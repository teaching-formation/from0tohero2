import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  // Requiert une session authentifiée pour éviter le harvesting d'emails
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });

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
  const { data: authData, error } = await supabaseAdmin.auth.admin.getUserById(praticien.user_id);
  if (error || !authData?.user?.email) {
    return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
  }

  return NextResponse.json({ email: authData.user.email });
}
