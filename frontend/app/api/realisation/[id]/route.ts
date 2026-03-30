import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const ALLOWED = ['title', 'category', 'type', 'type_label', 'stack', 'excerpt', 'demo_url', 'repo_url', 'date_published'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    // Vérifie que la réalisation appartient à l'utilisateur
    const { data: praticien } = await supabaseAdmin
      .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
    if (!praticien) return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 });

    const { data: realisation } = await supabaseAdmin
      .from('realisations').select('praticien_id').eq('id', id).maybeSingle();
    if (!realisation || realisation.praticien_id !== praticien.id)
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) updates[key] = body[key];
    }

    // Normalise stack si string
    if ('stack' in updates && !Array.isArray(updates.stack)) {
      updates.stack = String(updates.stack).split(',').map(s => s.trim()).filter(Boolean);
    }

    const { error } = await supabaseAdmin.from('realisations').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[realisation/update]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
