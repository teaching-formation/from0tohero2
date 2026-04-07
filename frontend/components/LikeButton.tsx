'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  contentType: 'realisation' | 'article' | 'tip';
  contentId: string;
  initialCount: number;
  initialLiked: boolean;
};

export default function LikeButton({ contentType, contentId, initialCount, initialLiked }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/reaction?type=${contentType}&id=${contentId}`)
      .then(r => r.json())
      .then(d => { setCount(d.count); setLiked(d.liked); })
      .catch(() => {});
  }, [contentType, contentId]);

  async function toggle() {
    if (loading) return;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/connexion'); return; }

    // Optimistic update
    setLiked(l => !l);
    setCount(c => liked ? c - 1 : c + 1);
    setLoading(true);

    const res = await fetch('/api/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: contentType, content_id: contentId }),
    });

    setLoading(false);
    if (!res.ok) {
      // Rollback
      setLiked(l => !l);
      setCount(c => liked ? c + 1 : c - 1);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '.3rem',
        background: 'none',
        border: '1px solid ' + (liked ? 'rgba(249,115,22,.4)' : 'var(--f-border)'),
        borderRadius: 6,
        padding: '3px 8px',
        cursor: loading ? 'wait' : 'pointer',
        color: liked ? 'var(--f-orange)' : 'var(--f-text-3)',
        fontFamily: "'Geist Mono', monospace",
        fontSize: '.6rem',
        transition: 'color .15s, border-color .15s',
        flexShrink: 0,
      }}
      title={liked ? 'Retirer la réaction' : 'Aimer'}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
