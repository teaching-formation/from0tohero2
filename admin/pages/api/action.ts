import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/slugify';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Envoyer email de rejet si email disponible dans le payload
    const email = String(payload?.email || '');
    const title = String(payload?.title || payload?.name || 'ta soumission');
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await resend.emails.send({
        from: 'from0tohero <onboarding@resend.dev>',
        to: email,
        subject: '[from0tohero] Ta soumission n\'a pas été retenue',
        html: `
          <div style="font-family:monospace;max-width:520px;margin:0 auto;padding:2rem;background:#0d1117;color:#e6edf3;border-radius:8px;">
            <h2 style="color:#f97316;font-size:1rem;margin:0 0 1.5rem 0;letter-spacing:.05em;">// SOUMISSION NON RETENUE</h2>
            <p style="font-size:.85rem;color:#8b949e;line-height:1.7;margin:0 0 1rem 0;">
              Merci pour ta soumission <strong style="color:#e6edf3;">${title}</strong>.<br/>
              Après examen, elle n&apos;a pas été retenue pour la plateforme.
            </p>
            ${note ? `
            <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:1rem;margin:1.25rem 0;">
              <p style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#656d76;margin:0 0 .5rem 0;">Note de l&apos;équipe</p>
              <p style="font-size:.82rem;color:#e6edf3;line-height:1.6;margin:0;">${note}</p>
            </div>` : ''}
            <p style="font-size:.82rem;color:#8b949e;line-height:1.7;margin:1rem 0 0 0;">
              Tu peux re-soumettre une fois les ajustements faits.
            </p>
            <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid #21262d;">
              <a href="https://from0tohero.dev/soumettre" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:.6rem 1.2rem;border-radius:4px;font-size:.8rem;letter-spacing:.04em;">
                Soumettre à nouveau →
              </a>
            </div>
          </div>
        `,
      }).catch(() => {}); // ne pas bloquer si l'email échoue
    }

    return res.json({ ok: true });
  }

  if (action === 'approve') {
    if (type === 'praticien') {
      const cats: string[] = Array.isArray(payload.categories) ? payload.categories : (payload.category ? [payload.category] : []);
      const primaryCat = cats[0] || 'data';
      const slug = payload.username || slugify(payload.name);
      const { error } = await supabaseAdmin.from('praticiens').insert({
        slug,
        name: payload.name,
        role: payload.role,
        country: payload.pays,
        city: payload.ville,
        category: primaryCat,
        categories: cats,
        bio: payload.bio || null,
        stack: Array.isArray(payload.stack)
          ? payload.stack
          : String(payload.stack || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        linkedin_url: payload.linkedin_url || null,
        github_url: payload.github_url || null,
        youtube_url: payload.youtube_url || null,
        website_url: payload.website_url || null,
        twitter_url: payload.twitter_url || null,
        whatsapp_url: payload.whatsapp_url || null,
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
        .from('praticiens').select('id, name').eq('slug', String(payload.username || '')).maybeSingle();
      const { error } = await supabaseAdmin.from('articles').insert({
        slug,
        title: payload.title,
        author: praticien?.name || String(payload.name || 'Inconnu'),
        author_country: payload.author_country || null,
        praticien_id: praticien?.id || null,
        category: payload.category,
        source: payload.source,
        source_label: payload.source === 'autre' ? (payload.source_autre || null) : null,
        external_url: payload.external_url,
        excerpt: payload.excerpt || null,
        date_published: payload.date_published || null,
        status: 'approved',
      });
      if (error) return res.status(500).json({ error: error.message });

    } else if (type === 'realisation') {
      const slug = slugify(payload.title);
      const { data: praticien } = await supabaseAdmin
        .from('praticiens').select('id').eq('slug', String(payload.username || '')).maybeSingle();
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
      const evType = payload.type === 'autre' ? 'autre' : payload.type;
      const { data: praticienEvt } = await supabaseAdmin
        .from('praticiens').select('id').eq('slug', String(payload.username || '')).maybeSingle();
      const { error } = await supabaseAdmin.from('evenements').insert({
        slug,
        title:        payload.title,
        type:         evType,
        type_label:   payload.type === 'autre' ? (payload.type_autre || null) : null,
        lieu:         payload.lieu    || null,
        pays:         payload.pays    || null,
        online:       payload.online  || false,
        url:          payload.url     || null,
        date_debut:   payload.date_debut,
        date_fin:     payload.date_fin || null,
        gratuit:      payload.gratuit  || false,
        excerpt:      payload.excerpt  || null,
        praticien_id: praticienEvt?.id || null,
        status:       'approved',
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
