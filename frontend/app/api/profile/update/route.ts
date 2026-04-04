import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_FIELDS = [
  'name', 'role', 'pays', 'ville', 'bio',
  'categories', 'category_label', 'stack', 'skills', 'badges', 'certifications',
  'linkedin_url', 'github_url', 'youtube_url',
  'website_url', 'twitter_url', 'whatsapp_url',
];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();

    // Filtre uniquement les champs autorisés
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updates[key] = body[key];
    }

    // Mappe pays/ville → country/city
    if ('pays'  in updates) { updates.country = updates.pays;  delete updates.pays; }
    if ('ville' in updates) { updates.city    = updates.ville; delete updates.ville; }

    const { error } = await supabase
      .from('praticiens')
      .update(updates)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[profile/update]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
