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
      source_label:   data.source === 'autre' ? (data.source_label || null) : null,
      external_url:   data.external_url || null,
      excerpt:        data.excerpt || null,
      date_published: data.date_published || null,
      collaborateurs: Array.isArray(data.collaborateurs) ? data.collaborateurs
        : (data.collaborateurs ? String(data.collaborateurs).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
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
      praticien_id:   data.praticien_id || null,
      category:       data.category || 'data',
      type:           data.type || 'autre',
      type_label:     data.type === 'autre' ? (data.type_label || null) : null,
      stack,
      excerpt:        data.excerpt || null,
      demo_url:       data.demo_url || null,
      repo_url:       data.repo_url || null,
      date_published: data.date_published || null,
      collaborateurs: Array.isArray(data.collaborateurs) ? data.collaborateurs
        : (data.collaborateurs ? String(data.collaborateurs).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
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
      name:           data.name,
      role:           data.role || null,
      country:        data.country || null,
      category:       data.category || 'data',
      category_label: data.category === 'autre' ? (data.category_label || null) : null,
      categories:     [data.category || 'data'],
      bio:            data.bio || null,
      stack,
      badges:         [],
      certifications: data.certifications || null,
      linkedin_url:   data.linkedin_url || null,
      github_url:     data.github_url || null,
      youtube_url:    data.youtube_url || null,
      website_url:    data.website_url || null,
      twitter_url:    data.twitter_url || null,
      whatsapp_url:   data.whatsapp_url || null,
      photo_url:      data.photo_url || null,
      status:         data.status || 'approved',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  if (table === 'evenements') {
    const slug = slugify(data.title || '');
    const evTypes: string[] = Array.isArray(data.types) && data.types.length > 0
      ? data.types
      : [data.type || 'autre'];
    const evType = evTypes[0] || 'autre';
    const { data: row, error } = await supabaseAdmin.from('evenements').insert({
      slug,
      title:      data.title,
      type:       evType,
      types:      evTypes,
      type_label: evTypes.includes('autre') ? (data.type_label || null) : null,
      pays:       data.pays || null,
      lieu:       data.lieu || null,
      online:     data.online === true || data.online === 'true' || false,
      url:        data.url || null,
      date_debut: data.date_debut,
      date_fin:   data.date_fin || null,
      gratuit:    data.gratuit === true || data.gratuit === 'true' || false,
      excerpt:    data.excerpt || null,
      status:     data.status || 'approved',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  if (table === 'collections') {
    const { data: row, error } = await supabaseAdmin.from('collections').insert({
      praticien_id: data.praticien_id,
      title:        data.title,
      description:  data.description || null,
      items:        Array.isArray(data.items) ? data.items : [],
      ordre:        Number(data.ordre) || 0,
      status:       data.status || 'approved',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  if (table === 'tips') {
    const cleanStack = typeof data.stack === 'string'
      ? data.stack.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (Array.isArray(data.stack) ? data.stack : []);
    const { data: row, error } = await supabaseAdmin.from('tips').insert({
      praticien_id: data.praticien_id,
      content:      data.content,
      type:         data.type || 'tip',
      category:     data.category || 'autre',
      stack:        cleanStack,
      status:       data.status || 'approved',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  if (table === 'chaines_youtube') {
    const { data: row, error } = await supabaseAdmin.from('chaines_youtube').insert({
      name:        data.name,
      description: data.description || null,
      url:         data.url,
      subs:        data.subs || null,
      ordre:       Number(data.ordre) || 0,
      active:      false,
      status:      data.status || 'pending',
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(row);
  }

  return res.status(400).json({ error: 'Table non supportée' });
}
