import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    // Récupère le praticien
    const { data: praticien } = await supabaseAdmin
      .from('praticiens')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!praticien) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 403 });

    // Vérifie que le tip appartient à ce praticien
    const { data: tip } = await supabaseAdmin
      .from('tips')
      .select('id, praticien_id')
      .eq('id', id)
      .maybeSingle();

    if (!tip) return NextResponse.json({ error: 'Tip introuvable' }, { status: 404 });
    if (tip.praticien_id !== praticien.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const { error } = await supabaseAdmin.from('tips').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[tip DELETE]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
