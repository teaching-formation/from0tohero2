import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import EditCollectionClient from './EditCollectionClient';

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');

  const { data: praticien } = await supabaseAdmin
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) redirect('/mon-compte');

  const { data: collection } = await supabaseAdmin
    .from('collections').select('*').eq('id', id).eq('praticien_id', praticien.id).maybeSingle();
  if (!collection) notFound();

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/mon-compte?tab=collections" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-3)', textDecoration: 'none' }}>
          ← Mes collections
        </a>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '.75rem 0 .25rem 0' }}>
          Modifier la collection
        </h1>
      </div>
      <EditCollectionClient collection={{
        id:          collection.id,
        title:       collection.title,
        description: collection.description || '',
        items:       Array.isArray(collection.items) ? collection.items : [],
      }} />
    </div>
  );
}
