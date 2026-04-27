import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notifyFollowers } from '@/lib/createNotification';
import { indexContent } from '@/lib/indexContent';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'];
const TYPES      = ['tip','TIL','snippet'];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const body = await req.json();
    const { content, type, category, category_label, stack } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Contenu requis' }, { status: 400 });
    }
    if (content.trim().length > 280) {
      return NextResponse.json({ error: 'Contenu trop long (max 280 caractères)' }, { status: 400 });
    }
    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }

    // Récupère le praticien
    const { data: praticien } = await supabaseAdmin
      .from('praticiens')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!praticien) {
      return NextResponse.json({ error: 'Praticien introuvable' }, { status: 403 });
    }

    const cleanStack = Array.isArray(stack)
      ? stack.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

    const { data: tip, error } = await supabaseAdmin
      .from('tips')
      .insert({
        praticien_id:   praticien.id,
        content:        content.trim(),
        type,
        category,
        category_label: category === 'autre' && category_label ? String(category_label).slice(0, 60) : null,
        stack:          cleanStack,
        status:         'approved',
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notifier les followers de l'auteur
    notifyFollowers({
      praticien_id:  praticien.id,
      content_type:  'tip',
      content_id:    tip.id,
      content_title: content.trim().slice(0, 80),
    }).catch(() => {});

    // Indexer pour Ask Hero (non-bloquant)
    indexContent({
      content_type: 'tip',
      content_id:   tip.id,
      title:        `${type} · ${category}`,
      body:         `[${type}] Catégorie: ${category}. ${content.trim()}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: tip.id });
  } catch (err) {
    console.error('[tip POST]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
