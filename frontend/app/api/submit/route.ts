import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/slugify';

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
        open_to_work:  payload.open_to_work  || false,
        user_id:       user?.id || null,
        badges:         [],
        certifications: payload.certifications || null,
        photo_url:      null,
        status:         'approved',
      });
      if (error) insertError = error.message;

    } else if (type === 'article') {
      const slug = slugify(payload.title);
      const { data: praticien } = await supabaseAdmin
        .from('praticiens').select('id, name')
        .eq('slug', String(payload.username || '')).maybeSingle();

      const { error } = await supabaseAdmin.from('articles').insert({
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
        status:         'approved',
      });
      if (error) insertError = error.message;

    } else if (type === 'realisation') {

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
        const { data: praticien } = await supabaseAdmin
          .from('praticiens').select('id')
          .eq('slug', String(payload.username || '')).maybeSingle();

        const { error } = await supabaseAdmin.from('realisations').insert({
          slug,
          title:          payload.title,
          praticien_id:   praticien?.id || null,
          category:       payload.category,
          type:           payload.type,
          type_label:     payload.type === 'autre' ? (payload.type_label || null) : null,
          stack:          Array.isArray(payload.stack)
            ? payload.stack
            : String(payload.stack || '').split(',').map((s: string) => s.trim()).filter(Boolean),
          excerpt:        payload.excerpt || null,
          demo_url:       payload.demo_url   || null,
          repo_url:       payload.repo_url   || null,
          date_published: payload.date_published || null,
          status:         'approved',
        });
        if (error) insertError = error.message;
      }

    } else if (type === 'evenement') {
      const slug = slugify(payload.title);
      const { data: praticienEvt } = await supabaseAdmin
        .from('praticiens').select('id')
        .eq('slug', String(payload.username || '')).maybeSingle();

      const { error } = await supabaseAdmin.from('evenements').insert({
        slug,
        title:        payload.title,
        type:         payload.type,
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
      if (error) insertError = error.message;
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

    await resend.emails.send({
      from: 'from0tohero <onboarding@resend.dev>',
      to:   process.env.ADMIN_EMAIL!,
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
