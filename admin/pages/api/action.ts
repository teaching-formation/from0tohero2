import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/slugify';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Notification co-auteurs ───────────────────────────────────────────────
async function notifyCollaborateurs({
  slugs,
  contentType,
  contentTitle,
  contentSlug,
  authorName,
}: {
  slugs: string[];
  contentType: 'article' | 'realisation';
  contentTitle: string;
  contentSlug: string;
  authorName: string;
}) {
  if (slugs.length === 0) return;

  // Récupérer email + name de chaque co-auteur
  const { data: collabs } = await supabaseAdmin
    .from('praticiens')
    .select('name, email')
    .in('slug', slugs);

  if (!collabs || collabs.length === 0) return;

  const siteUrl = 'https://from0tohero.dev';
  const path = contentType === 'article' ? 'articles' : 'realisations';
  const contentUrl = `${siteUrl}/${path}/${contentSlug}`;
  const typeLabel = contentType === 'article' ? 'article' : 'réalisation';
  const typeLabelCap = contentType === 'article' ? 'Article' : 'Réalisation';

  const from = process.env.RESEND_FROM || 'from0tohero <onboarding@resend.dev>';

  await Promise.all(
    collabs
      .filter((c): c is { name: string; email: string } => Boolean(c.email))
      .map(({ name, email }) =>
        resend.emails.send({
          from,
          to: email,
          subject: `[from0tohero] Tu es crédité(e) sur un ${typeLabel} publié 🎉`,
          html: `
            <div style="font-family:monospace;max-width:520px;margin:0 auto;padding:2rem;background:#0d1117;color:#e6edf3;border-radius:8px;">
              <h2 style="color:#34d399;font-size:1rem;margin:0 0 1.5rem 0;letter-spacing:.05em;">// CO-AUTEUR — ${typeLabelCap.toUpperCase()} PUBLIÉ</h2>
              <p style="font-size:.85rem;color:#8b949e;line-height:1.7;margin:0 0 1rem 0;">
                Bonjour <strong style="color:#e6edf3;">${name}</strong>,<br/>
                Tu as été crédité(e) comme co-auteur(e) sur un ${typeLabel} publié sur <strong style="color:#f97316;">from0tohero.dev</strong>.
              </p>
              <div style="background:#161b22;border:1px solid #30363d;border-left:3px solid #34d399;border-radius:6px;padding:1rem;margin:1.25rem 0;">
                <p style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#656d76;margin:0 0 .5rem 0;">${typeLabelCap}</p>
                <p style="font-size:.9rem;color:#e6edf3;font-weight:700;margin:0 0 .35rem 0;">${contentTitle}</p>
                ${authorName ? `<p style="font-size:.72rem;color:#8b949e;margin:0;">par ${authorName}</p>` : ''}
              </div>
              <div style="margin-top:1.75rem;">
                <a href="${contentUrl}" style="display:inline-block;background:#34d399;color:#0d1117;text-decoration:none;padding:.6rem 1.4rem;border-radius:4px;font-size:.8rem;font-weight:700;letter-spacing:.04em;">
                  Voir le ${typeLabel} →
                </a>
              </div>
              <div style="margin-top:2rem;padding-top:1.25rem;border-top:1px solid #21262d;">
                <p style="font-size:.65rem;color:#656d76;margin:0;">
                  from0tohero.dev · La communauté Data &amp; Tech africaine
                </p>
              </div>
            </div>
          `,
        }).catch(() => {}) // ne pas bloquer si un email échoue
      )
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, id, type, payload, note: rawNote } = req.body;
  const note = rawNote ? String(rawNote).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') : '';

  if (action === 'reject') {
    await supabaseAdmin.from('soumissions').update({
      status: 'rejected',
      note_admin: rawNote || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);

    // Envoyer email de rejet si email disponible dans le payload
    const email = String(payload?.email || '');
    const title = String(payload?.title || payload?.name || 'ta soumission');
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'from0tohero <onboarding@resend.dev>',
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
      const { data: existing } = await supabaseAdmin.from('praticiens').select('id').eq('slug', slug).maybeSingle();
      if (existing) return res.status(409).json({ error: `Le slug "${slug}" est déjà utilisé par un praticien existant.` });
      const { error } = await supabaseAdmin.from('praticiens').insert({
        slug,
        name: payload.name,
        role: payload.role,
        country: payload.pays,
        city: payload.ville,
        category: primaryCat,
        category_label: cats.includes('autre') ? (payload.category_label || null) : null,
        categories: cats,
        bio: payload.bio || null,
        stack: Array.isArray(payload.stack)
          ? payload.stack
          : String(payload.stack || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        certifications: payload.certifications || null,
        linkedin_url: payload.linkedin_url || null,
        github_url: payload.github_url || null,
        youtube_url: payload.youtube_url || null,
        website_url: payload.website_url || null,
        twitter_url: payload.twitter_url || null,
        whatsapp_url: payload.whatsapp_url || null,
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
      const collabsArticle: string[] = Array.isArray(payload.collaborateurs) ? payload.collaborateurs : [];
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
        collaborateurs: collabsArticle,
        status: 'approved',
      });
      if (error) return res.status(500).json({ error: error.message });

      // Notifier les co-auteurs (ne bloque jamais l'approbation)
      if (collabsArticle.length > 0) {
        notifyCollaborateurs({
          slugs: collabsArticle,
          contentType: 'article',
          contentTitle: String(payload.title),
          contentSlug: slug,
          authorName: praticien?.name || String(payload.name || ''),
        }).catch(() => {});
      }

    } else if (type === 'realisation') {
      const slug = slugify(payload.title);
      const { data: praticien } = await supabaseAdmin
        .from('praticiens').select('id, name').eq('slug', String(payload.username || '')).maybeSingle();
      const collabsReal: string[] = Array.isArray(payload.collaborateurs) ? payload.collaborateurs : [];
      const { error } = await supabaseAdmin.from('realisations').insert({
        slug,
        title: payload.title,
        praticien_id: praticien?.id || null,
        category: payload.category,
        type: payload.type,
        type_label: payload.type === 'autre' ? (payload.type_label || null) : null,
        stack: Array.isArray(payload.stack)
          ? payload.stack
          : String(payload.stack || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        excerpt: payload.excerpt || null,
        demo_url: payload.demo_url || null,
        repo_url: payload.repo_url || null,
        date_published: payload.date_published || null,
        collaborateurs: collabsReal,
        status: 'approved',
      });
      if (error) return res.status(500).json({ error: error.message });

      // Notifier les co-auteurs (ne bloque jamais l'approbation)
      if (collabsReal.length > 0) {
        notifyCollaborateurs({
          slugs: collabsReal,
          contentType: 'realisation',
          contentTitle: String(payload.title),
          contentSlug: slug,
          authorName: praticien?.name || String(payload.name || ''),
        }).catch(() => {});
      }

    } else if (type === 'evenement') {
      const slug = slugify(payload.title);
      const evTypes: string[] = Array.isArray(payload.types) && payload.types.length > 0
        ? payload.types
        : [payload.type || 'autre'];
      const evType = evTypes[0] || 'autre';
      const { data: praticienEvt } = await supabaseAdmin
        .from('praticiens').select('id').eq('slug', String(payload.username || '')).maybeSingle();
      const { error } = await supabaseAdmin.from('evenements').insert({
        slug,
        title:        payload.title,
        type:         evType,
        types:        evTypes,
        type_label:   evTypes.includes('autre') ? (payload.type_label || payload.type_autre || null) : null,
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
