import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/slugify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, id, type, payload, note } = req.body;

  if (action === 'reject') {
    await supabaseAdmin.from('soumissions').update({
      status: 'rejected',
      note_admin: note || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    return res.json({ ok: true });
  }

  if (action === 'approve') {
    if (type === 'praticien') {
      const slug = slugify(payload.name);
      const { error } = await supabaseAdmin.from('praticiens').insert({
        slug,
        name: payload.name,
        role: payload.role,
        country: payload.pays,
        city: payload.ville,
        category: payload.category,
        bio: payload.bio,
        stack: Array.isArray(payload.stack)
          ? payload.stack
          : String(payload.stack).split(',').map((s: string) => s.trim()).filter(Boolean),
        linkedin_url: payload.linkedin_url || null,
        github_url: payload.github_url || null,
        youtube_url: payload.youtube_url || null,
        website_url: payload.website_url || null,
        open_to_work: payload.open_to_work || false,
        badges: Array.isArray(payload.badges) ? payload.badges : [],
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        photo_url: payload.photo_url || null,
        status: 'approved',
      });
      if (error) return res.status(500).json({ error: error.message });

    } else if (type === 'article') {
      const slug = slugify(payload.title);
      const { data: praticien } = await supabaseAdmin
        .from('praticiens').select('id, name').ilike('linkedin_url', `%${String(payload.linkedin_url || '').replace(/\/$/, '')}%`).maybeSingle();
      const { error } = await supabaseAdmin.from('articles').insert({
        slug,
        title: payload.title,
        author: praticien?.name || String(payload.author_name || payload.name || 'Inconnu'),
        author_country: payload.author_country || null,
        praticien_id: praticien?.id || null,
        category: payload.category,
        source: payload.source,
        external_url: payload.external_url,
        excerpt: payload.excerpt || null,
        date_published: payload.date_published || null,
        status: 'approved',
      });
      if (error) return res.status(500).json({ error: error.message });

    } else if (type === 'realisation') {
      const slug = slugify(payload.title);
      const { data: praticien } = await supabaseAdmin
        .from('praticiens').select('id').ilike('linkedin_url', `%${String(payload.linkedin_url || '').replace(/\/$/, '')}%`).maybeSingle();
      const { error } = await supabaseAdmin.from('realisations').insert({
        slug,
        title: payload.title,
        praticien_id: praticien?.id || null,
        category: payload.category,
        type: payload.type,
        stack: Array.isArray(payload.stack)
          ? payload.stack
          : String(payload.stack).split(',').map((s: string) => s.trim()).filter(Boolean),
        excerpt: payload.excerpt || null,
        demo_url: payload.demo_url || null,
        repo_url: payload.repo_url || null,
        date_published: payload.date_published || null,
        status: 'approved',
      });
      if (error) return res.status(500).json({ error: error.message });

    } else if (type === 'evenement') {
      const slug = slugify(payload.title);
      const { error } = await supabaseAdmin.from('evenements').insert({
        slug,
        title: payload.title,
        type: payload.type === 'autre' ? 'autre' : payload.type,
        lieu: payload.lieu || null,
        pays: payload.pays || null,
        online: payload.online || false,
        url: payload.url || null,
        date_debut: payload.date_debut,
        date_fin: payload.date_fin || null,
        gratuit: payload.gratuit || false,
        excerpt: payload.excerpt || null,
        status: 'approved',
      });
      if (error) return res.status(500).json({ error: error.message });
    }

    await supabaseAdmin.from('soumissions').update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);

    return res.json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
