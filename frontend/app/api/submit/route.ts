import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';
import { notifyFollowers, createNotification } from '@/lib/createNotification';

const resend = new Resend(process.env.RESEND_API_KEY);

const TYPE_LABELS: Record<string, string> = {
  praticien:   'Profil praticien',
  article:     'Article',
  realisation: 'Réalisation',
  evenement:   'Événement',
};

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export async function POST(req: Request) {
  try {
    const { type, payload } = await req.json();

    // Récupère l'utilisateur connecté si disponible
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    // ── 1. Insérer dans la table cible (approuvé directement) ──────────────
    let insertError: string | null = null;

    if (type === 'praticien') {
      const cats: string[] = Array.isArray(payload.categories)
        ? payload.categories
        : payload.category ? [payload.category] : [];
      const primaryCat = cats[0] || 'data';
      const slug = payload.username || slugify(payload.name);

      const { data: existingSlug } = await supabaseAdmin.from('praticiens').select('id').eq('slug', slug).maybeSingle();
      if (existingSlug) return NextResponse.json({ error: `Le username "${slug}" est déjà utilisé.` }, { status: 409 });

      const { error } = await supabaseAdmin.from('praticiens').insert({
        slug,
        name:          payload.name,
        role:          payload.role,
        country:       payload.pays,
        city:          payload.ville || null,
        category:      primaryCat,
        categories:    cats,
        bio:           payload.bio || null,
        email:         payload.email || null,
        stack:         Array.isArray(payload.stack) ? payload.stack.filter(Boolean) : [],
        skills:        Array.isArray(payload.skills) ? payload.skills : [],
        linkedin_url:  payload.linkedin_url  || null,
        github_url:    payload.github_url    || null,
        youtube_url:   payload.youtube_url   || null,
        website_url:   payload.website_url   || null,
        twitter_url:   payload.twitter_url   || null,
        whatsapp_url:  payload.whatsapp_url  || null,
        user_id:        user?.id || null,
        badges:         [],
        certifications: payload.certifications || null,
        category_label: cats.includes('autre') ? (payload.category_label || null) : null,
        photo_url:      payload.photo_url || null,
        status:         'approved',
      });
      if (error) insertError = error.message;

    } else if (type === 'article') {
      const slug = slugify(payload.title);
      // Si authentifié, on récupère le praticien depuis la session (jamais depuis le payload)
      const { data: praticien } = user
        ? await supabaseAdmin.from('praticiens').select('id, name').eq('user_id', user.id).maybeSingle()
        : await supabaseAdmin.from('praticiens').select('id, name').eq('slug', String(payload.username || '')).maybeSingle();

      const { data: newArticle, error } = await supabaseAdmin.from('articles').insert({
        slug,
        title:          payload.title,
        author:         praticien?.name || String(payload.name || 'Inconnu'),
        author_country: payload.author_country || null,
        praticien_id:   praticien?.id || null,
        category:       payload.category,
        source:         payload.source,
        source_label:   payload.source === 'autre' ? (payload.source_autre || null) : null,
        external_url:   payload.external_url,
        excerpt:        payload.excerpt || null,
        date_published: payload.date_published || null,
        collaborateurs:  Array.isArray(payload.collaborateurs) ? payload.collaborateurs : [],
        status:         'approved',
      }).select('id').single();
      if (error) insertError = error.message;

      // Notifier les followers de l'auteur
      if (!error && praticien?.id && newArticle?.id) {
        notifyFollowers({
          praticien_id:  praticien.id,
          content_type:  'article',
          content_id:    newArticle.id,
          content_title: payload.title,
        }).catch(() => {});
      }

    } else if (type === 'realisation') {

      // Réalisations : l'utilisateur doit être authentifié
      if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

      if (payload.type === 'youtube') {
        // Chaîne YouTube → insérée dans chaines_youtube directement
        const { error } = await supabaseAdmin.from('chaines_youtube').insert({
          name:        payload.title,
          description: payload.excerpt || null,
          url:         payload.demo_url || payload.repo_url || null,
          subs:        null,
          ordre:       0,
          active:      true,
          status:      'approved',
        });
        if (error) insertError = error.message;

      } else {
        const slug = slugify(payload.title);
        // Récupère le praticien depuis la session (jamais depuis le payload)
        const { data: praticien } = await supabaseAdmin
          .from('praticiens').select('id')
          .eq('user_id', user.id).maybeSingle();

        if (!praticien) return NextResponse.json({ error: 'Profil praticien introuvable.' }, { status: 403 });

        const collabs: string[] = Array.isArray(payload.collaborateurs) ? payload.collaborateurs : [];
        const { data: newRealisation, error } = await supabaseAdmin.from('realisations').insert({
          slug,
          title:          payload.title,
          praticien_id:   praticien?.id || null,
          category:       payload.category,
          type:           payload.type,
          type_label:     payload.type === 'autre' ? (payload.type_label || null) : null,
          stack:          (() => {
            const INVALID = new Set(['null', 'unfound', 'undefined', '']);
            const raw: string[] = Array.isArray(payload.stack)
              ? payload.stack
              : String(payload.stack || '').split(',').map((s: string) => s.trim());
            return raw.filter((s: string) => s && !INVALID.has(s.toLowerCase().trim()));
          })(),
          excerpt:         payload.excerpt || null,
          demo_url:        payload.demo_url   || null,
          repo_url:        payload.repo_url   || null,
          date_published:  payload.date_published || null,
          collaborateurs:  collabs,
          status:          'approved',
        }).select('id').single();
        if (error) insertError = error.message;

        // ── Notifier les followers de l'auteur ────────────────────────────
        if (!error && praticien?.id && newRealisation?.id) {
          notifyFollowers({
            praticien_id:  praticien.id,
            content_type:  'realisation',
            content_id:    newRealisation.id,
            content_title: payload.title,
          }).catch(() => {});
        }

        // ── Notifier les co-auteurs par email ─────────────────────────────
        if (!error && collabs.length > 0) {
          const { data: collabPraticiens } = await supabaseAdmin
            .from('praticiens').select('id, name, email, slug').in('slug', collabs);
          const { data: submitter } = await supabaseAdmin
            .from('praticiens').select('name, slug').eq('id', praticien.id).maybeSingle();
          for (const collab of (collabPraticiens ?? [])) {
            if (!collab.email) continue;
            // Notif in-app co-auteur
            if (collab.id && newRealisation?.id) {
              createNotification({
                praticien_id:  collab.id,
                type:          'coauteur',
                actor_id:      praticien.id,
                content_type:  'realisation',
                content_id:    newRealisation.id,
                content_title: payload.title,
              }).catch(() => {});
            }
            resend.emails.send({
              from: process.env.RESEND_FROM || 'from0tohero <onboarding@resend.dev>',
              to: collab.email,
              subject: `[from0tohero] Tu as été ajouté en co-auteur d'une réalisation`,
              html: `
                <div style="font-family:monospace;max-width:520px;margin:0 auto;padding:2rem;background:#0d1117;color:#e6edf3;border-radius:8px;">
                  <h2 style="color:#38bdf8;font-size:1rem;margin:0 0 1.5rem 0;letter-spacing:.05em;">// co-auteur ✓</h2>
                  <p style="color:#e6edf3;font-size:.9rem;line-height:1.7;margin:0 0 1.25rem 0;">
                    Bonjour ${escHtml(collab.name)},<br/><br/>
                    <strong style="color:#f97316;">${escHtml(submitter?.name ?? 'Un praticien')}</strong> t'a ajouté en co-auteur de la réalisation
                    <strong style="color:#f0f6fc;">"${escHtml(payload.title)}"</strong> sur from0tohero.dev.
                  </p>
                  <p style="color:#8b949e;font-size:.8rem;margin:0 0 1.5rem 0;">
                    Cette réalisation apparaît maintenant sur ton profil public.
                  </p>
                  <a href="https://from0tohero.dev/praticiens/${collab.slug}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:.6rem 1.2rem;border-radius:4px;font-size:.8rem;">
                    Voir mon profil →
                  </a>
                </div>
              `,
            }).catch((err) => console.error('[submit] collab email error:', err));
          }
        }
      }

    } else if (type === 'evenement') {
      const slug = slugify(payload.title);
      // Si authentifié, on récupère le praticien depuis la session
      const { data: praticienEvt } = user
        ? await supabaseAdmin.from('praticiens').select('id').eq('user_id', user.id).maybeSingle()
        : await supabaseAdmin.from('praticiens').select('id').eq('slug', String(payload.username || '')).maybeSingle();

      const evTypes: string[] = Array.isArray(payload.types) && payload.types.length > 0
        ? payload.types
        : [payload.type || 'autre'];
      const evType = evTypes[0] || 'autre';
      const { data: newEvenement, error } = await supabaseAdmin.from('evenements').insert({
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
      }).select('id').single();
      if (error) insertError = error.message;

      // Notifier les followers de l'organisateur
      if (!error && praticienEvt?.id && newEvenement?.id) {
        notifyFollowers({
          praticien_id:  praticienEvt.id,
          content_type:  'evenement',
          content_id:    newEvenement.id,
          content_title: payload.title,
        }).catch(() => {});
      }
    }

    if (insertError) {
      console.error('[submit] insert error:', insertError);
      return NextResponse.json({ error: insertError }, { status: 500 });
    }

    // ── 2. Logger dans soumissions (audit trail) ───────────────────────────
    await supabaseAdmin.from('soumissions').insert({
      type,
      payload,
      status:      'approved',
      reviewed_at: new Date().toISOString(),
      user_id:     user?.id || null,
    });

    // ── 3. Notification email à l'admin ────────────────────────────────────
    const label    = TYPE_LABELS[type] || type;
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3001';
    const name     = escHtml(String(payload.name  || ''));
    const title    = escHtml(String(payload.title || ''));
    const username = escHtml(String(payload.username || ''));

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('[submit] ADMIN_EMAIL non défini, email admin non envoyé');
    } else await resend.emails.send({
      from: process.env.RESEND_FROM || 'from0tohero <onboarding@resend.dev>',
      to:   adminEmail,
      subject: `[from0tohero] Nouvelle soumission — ${label}`,
      html: `
        <div style="font-family:monospace;max-width:520px;margin:0 auto;padding:2rem;background:#0d1117;color:#e6edf3;border-radius:8px;">
          <h2 style="color:#34d399;font-size:1rem;margin:0 0 1.5rem 0;letter-spacing:.05em;">// AUTO-APPROUVÉ ✓</h2>
          <table style="width:100%;border-collapse:collapse;font-size:.85rem;">
            <tr>
              <td style="padding:.4rem 0;color:#8b949e;width:120px;">Type</td>
              <td style="padding:.4rem 0;color:#e6edf3;">${label}</td>
            </tr>
            ${name ? `<tr><td style="padding:.4rem 0;color:#8b949e;">Nom</td><td style="padding:.4rem 0;color:#e6edf3;">${name}</td></tr>` : ''}
            ${title ? `<tr><td style="padding:.4rem 0;color:#8b949e;">Titre</td><td style="padding:.4rem 0;color:#e6edf3;">${title}</td></tr>` : ''}
            ${username ? `<tr><td style="padding:.4rem 0;color:#8b949e;">Username</td><td style="padding:.4rem 0;color:#e6edf3;">@${username}</td></tr>` : ''}
          </table>
          <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid #21262d;">
            <a href="${adminUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:.6rem 1.2rem;border-radius:4px;font-size:.8rem;letter-spacing:.04em;">
              Voir dans l'admin →
            </a>
          </div>
        </div>
      `,
    }).catch((err) => console.error('[submit] email error:', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[submit]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
