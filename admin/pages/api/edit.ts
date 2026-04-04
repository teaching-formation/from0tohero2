import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED: Record<string, string[]> = {
  praticiens:      ['name','role','country','city','category','category_label','categories','bio','stack','badges','certifications','linkedin_url','github_url','youtube_url','website_url','twitter_url','whatsapp_url','photo_url','status'],
  articles:        ['title','author','author_country','category','source','source_label','external_url','excerpt','date_published','status'],
  realisations:    ['title','category','type','type_label','stack','excerpt','demo_url','repo_url','date_published','status'],
  evenements:      ['title','type','types','type_label','lieu','pays','online','url','date_debut','date_fin','gratuit','excerpt','status'],
  chaines_youtube: ['name','description','url','subs','ordre','active','status'],
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

  // Pour les événements : synchronise type = types[0] et efface type_label si 'autre' absent
  if (table === 'evenements' && Array.isArray(clean.types)) {
    const evTypes = clean.types as string[];
    if (evTypes.length > 0) clean.type = evTypes[0];
    if (!evTypes.includes('autre')) clean.type_label = null;
  }

  const { error } = await supabaseAdmin.from(table).update(clean).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}
