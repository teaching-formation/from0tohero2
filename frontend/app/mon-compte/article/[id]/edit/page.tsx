import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import EditArticleClient from './EditArticleClient';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion?next=/mon-compte');

  const { data: praticien } = await supabaseAdmin
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) redirect('/mon-compte');

  const { data: article } = await supabaseAdmin
    .from('articles').select('*').eq('id', id).maybeSingle();

  if (!article || article.praticien_id !== praticien.id) redirect('/mon-compte');

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/mon-compte" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-3)', textDecoration: 'none' }}>
          ← Mon espace
        </a>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '.75rem 0 0 0' }}>
          Modifier l&apos;article
        </h1>
      </div>
      <EditArticleClient article={article} />
    </div>
  );
}
