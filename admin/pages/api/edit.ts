import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED: Record<string, string[]> = {
  praticiens:   ['name','role','country','city','category','bio','stack','linkedin_url','github_url','youtube_url','website_url','open_to_work','status'],
  articles:     ['title','author','author_country','category','source','external_url','excerpt','date_published','status'],
  realisations: ['title','category','type','stack','excerpt','demo_url','repo_url','date_published','status'],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { table, id, data } = req.body;
  if (!ALLOWED[table]) return res.status(400).json({ error: 'Table inconnue' });
  if (!id) return res.status(400).json({ error: 'id manquant' });

  // Filtrer uniquement les champs autorisés
  const allowed = ALLOWED[table];
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) clean[key] = data[key];
  }
  clean.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin.from(table).update(clean).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}
