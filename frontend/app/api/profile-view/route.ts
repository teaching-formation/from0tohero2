import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/profile-view  { slug }  → enregistre une vue
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { slug } = await req.json().catch(() => ({}));
  if (!slug) return NextResponse.json({ ok: false });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('slug', slug).maybeSingle();
  if (!praticien) return NextResponse.json({ ok: false });

  await supabase.from('profile_views').insert({ praticien_id: praticien.id });
  return NextResponse.json({ ok: true });
}

// GET /api/profile-view?slug=xxx → stats pour le praticien connecté
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ week: 0, month: 0, total: 0 });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) return NextResponse.json({ week: 0, month: 0, total: 0 });

  const now = new Date();
  const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);

  const [{ count: week }, { count: month }, { count: total }] = await Promise.all([
    supabase.from('profile_views').select('*', { count: 'exact', head: true })
      .eq('praticien_id', praticien.id)
      .gte('viewed_at', weekAgo.toISOString().slice(0, 10)),
    supabase.from('profile_views').select('*', { count: 'exact', head: true })
      .eq('praticien_id', praticien.id)
      .gte('viewed_at', monthAgo.toISOString().slice(0, 10)),
    supabase.from('profile_views').select('*', { count: 'exact', head: true })
      .eq('praticien_id', praticien.id),
  ]);

  return NextResponse.json({ week: week ?? 0, month: month ?? 0, total: total ?? 0 });
}
