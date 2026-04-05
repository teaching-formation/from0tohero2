import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewTipClient from './NewTipClient';

export const metadata = { title: 'Nouveau tip — from0tohero.dev' };

export default async function NouveauTipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion?next=/mon-compte/nouveau-tip');

  return <NewTipClient />;
}
