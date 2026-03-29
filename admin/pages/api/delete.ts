import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_TABLES = ['praticiens', 'articles', 'realisations', 'evenements'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { table, id } = req.body;

  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Table non autorisée' });
  }
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID manquant' });
  }

  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true });
}
