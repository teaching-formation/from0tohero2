import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Récupère tous les utilisateurs auth
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return res.status(500).json({ error: error.message });

  // Récupère les praticiens pour les lier aux users
  const { data: praticiens } = await supabaseAdmin
    .from('praticiens')
    .select('user_id, slug, name, status');
  const praticienMap = Object.fromEntries(
    (praticiens ?? []).filter(p => p.user_id).map(p => [p.user_id, p])
  );

  const result = users.map(u => ({
    id:              u.id,
    email:           u.email ?? '—',
    created_at:      u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    provider:        (u.app_metadata?.provider as string) ?? 'email',
    providers:       (u.app_metadata?.providers as string[]) ?? [],
    praticien:       praticienMap[u.id] ?? null,
  }));

  // Tri : les plus récents en premier
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return res.json(result);
}
