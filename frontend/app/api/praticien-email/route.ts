import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug requis' }, { status: 400 });

  // Récupère le user_id du praticien (approuvé uniquement)
  const { data: praticien } = await supabaseAdmin
    .from('praticiens')
    .select('user_id, status')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();

  if (!praticien?.user_id) {
    return NextResponse.json({ error: 'Contact non disponible' }, { status: 404 });
  }

  // Récupère l'email depuis auth.users via le service role
  const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(praticien.user_id);
  if (error || !user?.email) {
    return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
  }

  return NextResponse.json({ email: user.email });
}
