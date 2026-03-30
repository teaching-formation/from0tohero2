'use client';
import { useRouter } from 'next/navigation';
import FormEvenement from '@/components/forms/FormEvenement';

export default function NouvelEvenementClient({ username }: { username: string }) {
  const router = useRouter();
  return (
    <FormEvenement
      username={username}
      hideEmail
      onSuccess={() => {
        router.push('/mon-compte?tab=evenements');
        router.refresh();
      }}
    />
  );
}
