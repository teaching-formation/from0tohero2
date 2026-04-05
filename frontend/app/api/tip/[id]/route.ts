import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const TYPES      = ['tip', 'TIL', 'snippet'];
const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'];

async function getOwnerPraticien(userId: string) {
  const { data } = await supabaseAdmin
    .from('praticiens').select('id').eq('user_id', userId).maybeSingle();
  return data;
}

async function checkTipOwnership(id: string, praticienId: string) {
  const { data } = await supabaseAdmin
    .from('tips').select('id, praticien_id').eq('id', id).maybeSingle();
  return data && data.praticien_id === praticienId ? data : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const praticien = await getOwnerPraticien(user.id);
    if (!praticien) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 403 });

    const tip = await checkTipOwnership(id, praticien.id);
    if (!tip) return NextResponse.json({ error: 'Tip introuvable ou non autorisé' }, { status: 403 });

    const body = await req.json();
    const { content, type, category, stack } = body;

    if (content !== undefined) {
      if (!content.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 });
      if (content.length > 280) return NextResponse.json({ error: 'Maximum 280 caractères' }, { status: 400 });
    }
    if (type !== undefined && !TYPES.includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
    if (category !== undefined && !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }

    const clean: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (content  !== undefined) clean.content  = content.trim();
    if (type     !== undefined) clean.type     = type;
    if (category !== undefined) clean.category = category;
    if (stack    !== undefined) {
      clean.stack = Array.isArray(stack)
        ? stack.map((s: unknown) => String(s).trim()).filter(Boolean)
        : String(stack).split(',').map(s => s.trim()).filter(Boolean);
    }

    const { error } = await supabaseAdmin.from('tips').update(clean).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[tip PATCH]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const praticien = await getOwnerPraticien(user.id);
    if (!praticien) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 403 });

    const tip = await checkTipOwnership(id, praticien.id);
    if (!tip) return NextResponse.json({ error: 'Tip introuvable ou non autorisé' }, { status: 403 });

    const { error } = await supabaseAdmin.from('tips').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[tip DELETE]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
