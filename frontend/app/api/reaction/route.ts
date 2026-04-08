import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/createNotification';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const content_type = searchParams.get('type');
  const content_id = searchParams.get('id');
  if (!content_type || !content_id) return NextResponse.json({ count: 0, liked: false });

  const { data: { user } } = await supabase.auth.getUser();

  // Compte total
  const { count } = await supabase
    .from('reactions')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', content_type)
    .eq('content_id', content_id);

  // Est-ce que l'utilisateur courant a liké ?
  let liked = false;
  if (user) {
    const { data: praticien } = await supabase.from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
    if (praticien) {
      const { data: existing } = await supabase.from('reactions').select('id')
        .eq('praticien_id', praticien.id).eq('content_type', content_type).eq('content_id', content_id).maybeSingle();
      liked = !!existing;
    }
  }

  return NextResponse.json({ count: count ?? 0, liked });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { content_type, content_id } = await req.json();
  if (!content_type || !content_id) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

  // Trouver le praticien lié au user
  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) return NextResponse.json({ error: 'Profil praticien requis' }, { status: 403 });

  // Toggle : si la réaction existe → delete, sinon → insert
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('praticien_id', praticien.id)
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .maybeSingle();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return NextResponse.json({ liked: false });
  } else {
    await supabase.from('reactions').insert({ praticien_id: praticien.id, content_type, content_id });

    // Notifier le propriétaire du contenu
    const { data: content } = await supabase
      .from(content_type === 'realisation' ? 'realisations' : content_type === 'article' ? 'articles' : 'tips')
      .select('praticien_id, title').eq('id', content_id).maybeSingle();
    if (content) {
      createNotification({
        praticien_id: content.praticien_id,
        type: 'like',
        actor_id: praticien.id,
        content_type,
        content_id,
        content_title: (content as any).title ?? null,
      }).catch(() => {});
    }

    return NextResponse.json({ liked: true });
  }
}
