'use client';
import { useRouter } from 'next/navigation';
import FormRealisation from '@/components/forms/FormRealisation';

export default function NouvelleRealisationClient({ username }: { username: string }) {
  const router = useRouter();
  return (
    <FormRealisation
      username={username}
      onSuccess={() => {
        router.push('/mon-compte?tab=realisations');
        router.refresh();
      }}
    />
  );
}
