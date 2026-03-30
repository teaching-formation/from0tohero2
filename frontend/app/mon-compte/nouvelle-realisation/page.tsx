import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NouvelleRealisationClient from './NouvelleRealisationClient';

export default async function NouvelleRealisationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion?next=/mon-compte/nouvelle-realisation');

  const { data: praticien } = await supabaseAdmin
    .from('praticiens').select('slug, name').eq('user_id', user.id).maybeSingle();

  if (!praticien) redirect('/mon-compte');

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/mon-compte" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-3)', textDecoration: 'none' }}>
          ← Mon espace
        </a>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '.75rem 0 .25rem 0' }}>
          Ajouter une réalisation
        </h1>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', margin: 0 }}>
          Projet lié à @{praticien.slug}
        </p>
      </div>
      <NouvelleRealisationClient username={praticien.slug} />
    </div>
  );
}
