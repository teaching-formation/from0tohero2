import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import MonCompteClient from './MonCompteClient';

export default async function MonComptePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion?next=/mon-compte');

  // Cherche le praticien lié à ce user
  let { data: praticien } = await supabase
    .from('praticiens')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Si pas trouvé par user_id, tente de le retrouver par email (migration profils existants)
  if (!praticien && user.email) {
    const { data: byEmail } = await supabase
      .from('praticiens')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (byEmail) {
      // Lier le compte auth au profil existant
      await supabase
        .from('praticiens')
        .update({ user_id: user.id })
        .eq('id', byEmail.id);
      praticien = { ...byEmail, user_id: user.id };
    }
  }

  // Récupère les contenus si praticien trouvé
  let articles:     Record<string, unknown>[] = [];
  let realisations: Record<string, unknown>[] = [];
  let evenements:   Record<string, unknown>[] = [];
  let collections:  Record<string, unknown>[] = [];
  let tips:         Record<string, unknown>[] = [];

  if (praticien) {
    const [{ data: arts }, { data: reals }, { data: evts }, { data: cols }, { data: tps }] = await Promise.all([
      supabase.from('articles').select('id, slug, title, source, date_published, status, category').eq('praticien_id', praticien.id).order('created_at', { ascending: false }),
      supabase.from('realisations').select('id, slug, title, type, stack, status, category').eq('praticien_id', praticien.id).order('created_at', { ascending: false }),
      supabase.from('evenements').select('id, slug, title, type, type_label, date_debut, date_fin, pays, online, status').eq('praticien_id', praticien.id).order('date_debut', { ascending: true }),
      supabase.from('collections').select('id, title, description, items, ordre, status').eq('praticien_id', praticien.id).order('ordre', { ascending: true }),
      supabase.from('tips').select('id, content, type, category, stack, status, created_at').eq('praticien_id', praticien.id).order('created_at', { ascending: false }),
    ]);
    articles     = (arts  ?? []) as Record<string, unknown>[];
    realisations = (reals ?? []) as Record<string, unknown>[];
    evenements   = (evts  ?? []) as Record<string, unknown>[];
    collections  = (cols  ?? []) as Record<string, unknown>[];
    tips         = (tps   ?? []) as Record<string, unknown>[];
  }

  return (
    <Suspense fallback={null}>
      <MonCompteClient
        user={{ id: user.id, email: user.email ?? '', name: user.user_metadata?.full_name ?? '' }}
        praticien={praticien}
        articles={articles}
        realisations={realisations}
        evenements={evenements}
        collections={collections}
        tips={tips}
      />
    </Suspense>
  );
}
