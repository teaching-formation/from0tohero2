'use client';
import { useRouter } from 'next/navigation';
import FormArticle from '@/components/forms/FormArticle';

export default function NouvelArticleClient({ username }: { username: string }) {
  const router = useRouter();
  return (
    <FormArticle
      username={username}
      hideEmail
      onSuccess={() => {
        router.push('/mon-compte?tab=articles');
        router.refresh();
      }}
    />
  );
}
