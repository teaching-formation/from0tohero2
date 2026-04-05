import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

const TABLES: Record<string, string> = {
  praticiens:      'praticiens',
  articles:        'articles',
  realisations:    'realisations',
  evenements:      'evenements',
  chaines_youtube: 'chaines_youtube',
  collections:     'collections',
  tips:            'tips',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const table = TABLES[String(req.query.table)];
  if (!table) return res.status(400).json({ error: 'Table inconnue' });

  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data ?? []);
}
