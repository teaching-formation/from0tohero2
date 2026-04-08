import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/createNotification';

// GET /api/comment?type=realisation&id=xxx → { comments: [...] }
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const content_type = req.nextUrl.searchParams.get('type');
  const content_id   = req.nextUrl.searchParams.get('id');
  if (!content_type || !content_id)
    return NextResponse.json({ comments: [] });

  const { data } = await supabase
    .from('comments')
    .select('id, content, created_at, praticiens(slug, name, photo_url)')
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(50);

  return NextResponse.json({ comments: data ?? [] });
}

// POST /api/comment → créer un commentaire
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { content_type, content_id, content } = await req.json();
  if (!content_type || !content_id || !content)
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

  const trimmed = String(content).trim();
  if (trimmed.length < 2 || trimmed.length > 500)
    return NextResponse.json({ error: 'Commentaire invalide (2-500 caractères)' }, { status: 400 });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien)
    return NextResponse.json({ error: 'Profil praticien requis' }, { status: 403 });

  const { data, error } = await supabase
    .from('comments')
    .insert({ praticien_id: praticien.id, content_type, content_id, content: trimmed })
    .select('id, content, created_at, praticiens(slug, name, photo_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notifier le propriétaire du contenu (fire-and-forget)
  const table = content_type === 'realisation' ? 'realisations' : 'articles';
  supabase.from(table).select('praticien_id, title').eq('id', content_id).maybeSingle()
    .then(({ data: owner }) => {
      if (owner) {
        createNotification({
          praticien_id: owner.praticien_id,
          type: 'comment',
          actor_id: praticien.id,
          content_type,
          content_id,
          content_title: (owner as any).title ?? null,
        }).catch(() => {});
      }
    });

  return NextResponse.json({ comment: data });
}

// PUT /api/comment → modifier son commentaire
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id, content } = await req.json();
  if (!id || !content) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

  const trimmed = String(content).trim();
  if (trimmed.length < 2 || trimmed.length > 500)
    return NextResponse.json({ error: 'Commentaire invalide (2-500 caractères)' }, { status: 400 });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) return NextResponse.json({ error: 'Profil requis' }, { status: 403 });

  const { data, error } = await supabase
    .from('comments')
    .update({ content: trimmed })
    .eq('id', id)
    .eq('praticien_id', praticien.id)
    .eq('status', 'approved')
    .select('id, content, created_at, praticiens(slug, name, photo_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

// DELETE /api/comment → soft delete
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) return NextResponse.json({ error: 'Profil requis' }, { status: 403 });

  await supabase.from('comments')
    .update({ status: 'deleted' })
    .eq('id', id)
    .eq('praticien_id', praticien.id);

  return NextResponse.json({ ok: true });
}
