import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/createNotification';

// GET /api/follow?slug=diakite → { following: bool, count: number }
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ following: false, count: 0 });

  const { data: target } = await supabase
    .from('praticiens').select('id').eq('slug', slug).maybeSingle();
  if (!target) return NextResponse.json({ following: false, count: 0 });

  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', target.id);

  const { data: { user } } = await supabase.auth.getUser();
  let following = false;
  if (user) {
    const { data: praticien } = await supabase
      .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
    if (praticien) {
      const { data: existing } = await supabase
        .from('follows').select('id')
        .eq('follower_id', praticien.id)
        .eq('following_id', target.id)
        .maybeSingle();
      following = !!existing;
    }
  }

  return NextResponse.json({ following, count: count ?? 0 });
}

// POST /api/follow → toggle follow
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: 'slug manquant' }, { status: 400 });

  const { data: follower } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!follower) return NextResponse.json({ error: 'Profil praticien requis' }, { status: 403 });

  const { data: target } = await supabase
    .from('praticiens').select('id').eq('slug', slug).maybeSingle();
  if (!target) return NextResponse.json({ error: 'Praticien introuvable' }, { status: 404 });

  if (follower.id === target.id)
    return NextResponse.json({ error: 'Impossible de se suivre soi-même' }, { status: 400 });

  const { data: existing } = await supabase
    .from('follows').select('id')
    .eq('follower_id', follower.id)
    .eq('following_id', target.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id);
    return NextResponse.json({ following: false });
  } else {
    await supabase.from('follows').insert({ follower_id: follower.id, following_id: target.id });

    // Notifier le praticien suivi
    createNotification({
      praticien_id: target.id,
      type: 'follow',
      actor_id: follower.id,
    }).catch(() => {});

    return NextResponse.json({ following: true });
  }
}
