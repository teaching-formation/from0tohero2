import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('admin_token') || '';
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="loading-state" style={{ paddingTop: '4rem' }}>
        <div className="spinner" />
        Vérification de l&apos;accès…
      </div>
    );
  }

  return <>{children}</>;
}
