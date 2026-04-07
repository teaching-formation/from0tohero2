'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;           // slug du praticien à suivre
  isSelf?: boolean;       // true si c'est son propre profil
};

export default function FollowButton({ slug, isSelf = false }: Props) {
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/follow?slug=${slug}`)
      .then(r => r.json())
      .then(d => { setFollowing(d.following); setCount(d.count); })
      .catch(() => {});
  }, [slug]);

  if (isSelf) return null;

  async function toggle() {
    if (loading) return;
    // Vérifier session
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/connexion'); return; }

    // Optimistic update
    setFollowing(f => !f);
    setCount(c => following ? c - 1 : c + 1);
    setLoading(true);

    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    setLoading(false);
    if (!res.ok) {
      setFollowing(f => !f);
      setCount(c => following ? c + 1 : c - 1);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '.7rem',
          letterSpacing: '.04em',
          padding: '.45rem 1.1rem',
          borderRadius: 7,
          border: following
            ? '1.5px solid rgba(56,189,248,.4)'
            : '1.5px solid var(--f-sky)',
          background: following ? 'rgba(56,189,248,.08)' : 'var(--f-sky)',
          color: following ? 'var(--f-sky)' : '#0d1117',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'all .15s',
          whiteSpace: 'nowrap',
          fontWeight: 600,
        }}
      >
        {following ? '✓ Suivi' : '+ Suivre'}
      </button>
      {count > 0 && (
        <span style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '.62rem',
          color: 'var(--f-text-3)',
        }}>
          {count} {count === 1 ? 'abonné' : 'abonnés'}
        </span>
      )}
    </div>
  );
}
