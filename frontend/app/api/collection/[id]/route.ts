import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getOwnership(userId: string, collectionId: string) {
  const { data: praticien } = await supabaseAdmin
    .from('praticiens').select('id').eq('user_id', userId).maybeSingle();
  if (!praticien) return null;

  const { data: collection } = await supabaseAdmin
    .from('collections').select('praticien_id').eq('id', collectionId).maybeSingle();
  if (!collection || collection.praticien_id !== praticien.id) return null;

  return praticien;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const ok = await getOwnership(user.id, id);
    if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const { title, description, items } = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined)       updates.title       = title?.trim() || '';
    if (description !== undefined) updates.description = description?.trim() || null;
    if (items !== undefined)       updates.items       = Array.isArray(items) ? items : [];

    const { error } = await supabaseAdmin.from('collections').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[collection/update]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const ok = await getOwnership(user.id, id);
    if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const { error } = await supabaseAdmin.from('collections').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[collection/delete]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
