import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/profile-view  { slug }  → enregistre une vue (sauf si c'est le propriétaire)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { slug } = await req.json().catch(() => ({}));
  if (!slug) return NextResponse.json({ ok: false });

  const { data: praticien } = await supabase
    .from('praticiens').select('id, user_id').eq('slug', slug).maybeSingle();
  if (!praticien) return NextResponse.json({ ok: false });

  // Ne pas compter les visites du propriétaire sur son propre profil
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === praticien.user_id) return NextResponse.json({ ok: false });

  // Enregistrer visitor_id si le visiteur est connecté
  let visitor_id: string | null = null;
  if (user) {
    const { data: visitor } = await supabase
      .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
    if (visitor) visitor_id = visitor.id;
  }

  await supabase.from('profile_views').insert({ praticien_id: praticien.id, visitor_id });
  return NextResponse.json({ ok: true });
}

// GET /api/profile-view → stats + visiteurs pour le praticien connecté
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ week: 0, month: 0, total: 0, visitors: [] });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) return NextResponse.json({ week: 0, month: 0, total: 0, visitors: [] });

  const now = new Date();
  const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);

  const [{ count: week }, { count: month }, { count: total }, { data: rawVisitors }] = await Promise.all([
    supabase.from('profile_views').select('*', { count: 'exact', head: true })
      .eq('praticien_id', praticien.id)
      .gte('viewed_at', weekAgo.toISOString().slice(0, 10)),
    supabase.from('profile_views').select('*', { count: 'exact', head: true })
      .eq('praticien_id', praticien.id)
      .gte('viewed_at', monthAgo.toISOString().slice(0, 10)),
    supabase.from('profile_views').select('*', { count: 'exact', head: true })
      .eq('praticien_id', praticien.id),
    // Derniers visiteurs connectés (déduplication par visitor_id, plus récent en premier)
    supabase.from('profile_views')
      .select('visitor_id, viewed_at, praticiens!profile_views_visitor_id_fkey(name, slug, photo_url)')
      .eq('praticien_id', praticien.id)
      .not('visitor_id', 'is', null)
      .order('viewed_at', { ascending: false })
      .limit(100),
  ]);

  // Déduplique par visitor_id (garde la visite la plus récente)
  const seen = new Set<string>();
  const visitors = (rawVisitors ?? [])
    .filter((v: any) => {
      if (!v.visitor_id || seen.has(v.visitor_id)) return false;
      seen.add(v.visitor_id);
      return true;
    })
    .slice(0, 20)
    .map((v: any) => ({
      slug:      v.praticiens?.slug ?? null,
      name:      v.praticiens?.name ?? null,
      photo_url: v.praticiens?.photo_url ?? null,
      viewed_at: v.viewed_at,
    }));

  return NextResponse.json({ week: week ?? 0, month: month ?? 0, total: total ?? 0, visitors });
}
