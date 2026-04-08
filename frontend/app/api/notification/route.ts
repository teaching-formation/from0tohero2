import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notification → liste des notifs du praticien connecté
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [], unread: 0 });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) return NextResponse.json({ notifications: [], unread: 0 });

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, read, content_type, content_id, content_title, created_at, praticiens!notifications_actor_id_fkey(name, slug, photo_url)')
    .eq('praticien_id', praticien.id)
    .order('created_at', { ascending: false })
    .limit(30);

  const unread = (notifications ?? []).filter(n => !n.read).length;

  return NextResponse.json({ notifications: notifications ?? [], unread });
}

// PATCH /api/notification → marquer toutes comme lues
export async function PATCH() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false });

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) return NextResponse.json({ ok: false });

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('praticien_id', praticien.id)
    .eq('read', false);

  return NextResponse.json({ ok: true });
}
