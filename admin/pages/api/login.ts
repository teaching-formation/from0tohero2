import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual, createHash } from 'crypto';

// Rate limiting en mémoire avec lockout progressif
// Limites : 5 tentatives → lockout 5 min, 10 tentatives → lockout 30 min
const attempts: Record<string, { count: number; lockedUntil: number }> = {};

const LOCKOUT_RULES = [
  { after: 10, lockMs: 30 * 60 * 1000 },  // 10+ tentatives → 30 min
  { after: 5,  lockMs:  5 * 60 * 1000 },  //  5+ tentatives →  5 min
];

function isLocked(ip: string): boolean {
  const rec = attempts[ip];
  if (!rec) return false;
  if (rec.lockedUntil > Date.now()) return true;
  // lockout expiré → reset
  if (rec.lockedUntil && rec.lockedUntil <= Date.now()) {
    delete attempts[ip];
  }
  return false;
}

function recordFailure(ip: string): number {
  if (!attempts[ip]) attempts[ip] = { count: 0, lockedUntil: 0 };
  attempts[ip].count++;
  const count = attempts[ip].count;
  for (const rule of LOCKOUT_RULES) {
    if (count >= rule.after) {
      attempts[ip].lockedUntil = Date.now() + rule.lockMs;
      break;
    }
  }
  return count;
}

// Comparaison en temps constant pour éviter timing attacks
function safeCompare(a: string, b: string): boolean {
  try {
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  } catch {
    return false;
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = String(
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  ).split(',')[0].trim();

  if (isLocked(ip)) {
    const rec = attempts[ip];
    const remainingMs = rec.lockedUntil - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60_000);
    return res.status(429).json({
      error: `Trop de tentatives. Réessaie dans ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
    });
  }

  const { password } = req.body;
  const expected = process.env.ADMIN_PASSWORD || '';

  if (!password || !safeCompare(String(password), expected)) {
    const count = recordFailure(ip);
    const rec = attempts[ip];
    if (rec?.lockedUntil > Date.now()) {
      const remainingMin = Math.ceil((rec.lockedUntil - Date.now()) / 60_000);
      return res.status(401).json({
        error: `Mot de passe incorrect. Compte bloqué ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
      });
    }
    const remaining = 5 - count;
    return res.status(401).json({
      error: remaining > 0
        ? `Mot de passe incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`
        : 'Mot de passe incorrect.',
    });
  }

  // Succès → reset
  delete attempts[ip];
  return res.json({ ok: true });
}
