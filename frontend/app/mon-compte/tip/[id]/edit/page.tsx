import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditTipClient from './EditTipClient';

export const metadata = { title: 'Modifier un tip — from0tohero.dev' };

export default async function EditTipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?next=/mon-compte/tip/${id}/edit`);

  const { data: praticien } = await supabase
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();
  if (!praticien) redirect('/mon-compte');

  const { data: tip } = await supabase
    .from('tips')
    .select('id, content, type, category, stack')
    .eq('id', id)
    .eq('praticien_id', praticien.id)
    .maybeSingle();

  if (!tip) notFound();

  return <EditTipClient tip={tip} />;
}
