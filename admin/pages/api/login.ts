import type { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory rate limiting: max 10 attempts per IP per minute
const attempts: Record<string, { count: number; resetAt: number }> = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();

  if (!attempts[ip] || attempts[ip].resetAt < now) {
    attempts[ip] = { count: 0, resetAt: now + 60_000 };
  }
  attempts[ip].count++;
  if (attempts[ip].count > 10) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessaie dans 1 minute.' });
  }

  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    attempts[ip].count = 0; // reset on success
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Mot de passe incorrect.' });
}
