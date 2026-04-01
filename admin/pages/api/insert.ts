import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/slugify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { table, data } = req.body;
  if (!table || !data) return res.status(400).json({ error: 'table et data requis' });

  if (table === 'articles') {
    const slug = slugify(data.title || '');
    const { data: row, error } = await supabaseAdmin.from('articles').insert({
      slug,
      title:          data.title,
      author:         data.author || null,
      author_country: data.author_country || null,
      category:       data.category || 'data',
      source:         data.source || 'autre',
      external_url:   data.external_url || null,
      excerpt:        data.excerpt || null,
      date_published: data.date_published || null,
      status:         data.status || 'approved',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  if (table === 'realisations') {
    const slug = slugify(data.title || '');
    const stack = typeof data.stack === 'string'
      ? data.stack.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (data.stack || []);
    const { data: row, error } = await supabaseAdmin.from('realisations').insert({
      slug,
      title:          data.title,
      category:       data.category || 'data',
      type:           data.type || 'autre',
      stack,
      excerpt:        data.excerpt || null,
      demo_url:       data.demo_url || null,
      repo_url:       data.repo_url || null,
      date_published: data.date_published || null,
      status:         data.status || 'approved',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  if (table === 'praticiens') {
    const slug = slugify(data.name || '');
    const { data: existing } = await supabaseAdmin.from('praticiens').select('id').eq('slug', slug).maybeSingle();
    if (existing) return res.status(409).json({ error: `Le slug "${slug}" est déjà utilisé.` });
    const stack = typeof data.stack === 'string'
      ? data.stack.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (data.stack || []);
    const { data: row, error } = await supabaseAdmin.from('praticiens').insert({
      slug,
      name:         data.name,
      role:         data.role || null,
      country:      data.country || null,
      category:     data.category || 'data',
      categories:   [data.category || 'data'],
      bio:          data.bio || null,
      stack,
      badges:       [],
      linkedin_url: data.linkedin_url || null,
      github_url:   data.github_url || null,
      youtube_url:  data.youtube_url || null,
      website_url:  data.website_url || null,
      twitter_url:  data.twitter_url || null,
      status:       data.status || 'approved',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  return res.status(400).json({ error: 'Table non supportée' });
}
