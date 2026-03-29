import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

const TYPE_LABELS: Record<string, string> = {
  praticien:   'Profil praticien',
  article:     'Article',
  realisation: 'Réalisation',
  evenement:   'Événement',
};

export async function POST(req: Request) {
  try {
    const { type, name, username, title } = await req.json();

    const label = TYPE_LABELS[type] || type;
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3001';

    await resend.emails.send({
      from: 'from0tohero <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL!,
      subject: `[from0tohero] Nouvelle soumission — ${label}`,
      html: `
        <div style="font-family:monospace;max-width:520px;margin:0 auto;padding:2rem;background:#0d1117;color:#e6edf3;border-radius:8px;">
          <h2 style="color:#f97316;font-size:1rem;margin:0 0 1.5rem 0;letter-spacing:.05em;">// NOUVELLE SOUMISSION</h2>

          <table style="width:100%;border-collapse:collapse;font-size:.85rem;">
            <tr>
              <td style="padding:.4rem 0;color:#8b949e;width:120px;">Type</td>
              <td style="padding:.4rem 0;color:#e6edf3;">${label}</td>
            </tr>
            ${name ? `
            <tr>
              <td style="padding:.4rem 0;color:#8b949e;">Nom</td>
              <td style="padding:.4rem 0;color:#e6edf3;">${name}</td>
            </tr>` : ''}
            ${title ? `
            <tr>
              <td style="padding:.4rem 0;color:#8b949e;">Titre</td>
              <td style="padding:.4rem 0;color:#e6edf3;">${title}</td>
            </tr>` : ''}
            ${username ? `
            <tr>
              <td style="padding:.4rem 0;color:#8b949e;">Username</td>
              <td style="padding:.4rem 0;color:#e6edf3;">@${username}</td>
            </tr>` : ''}
          </table>

          <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid #21262d;">
            <a href="${adminUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:.6rem 1.2rem;border-radius:4px;font-size:.8rem;letter-spacing:.04em;">
              Voir dans l'admin →
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notify]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
