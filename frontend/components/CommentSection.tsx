'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { useTranslations } from 'next-intl';

type Comment = {
  id: string;
  content: string;
  created_at: string;
  praticiens: { slug: string; name: string; photo_url?: string } | null;
};

type Props = {
  contentType: 'realisation' | 'article';
  contentId: string;
};

export default function CommentSection({ contentType, contentId }: Props) {
  const t = useTranslations('comments');
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [mySlug, setMySlug] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Charger le compteur au montage
  useEffect(() => {
    fetch(`/api/comment?type=${contentType}&id=${contentId}`)
      .then(r => r.json())
      .then(d => { setComments(d.comments ?? []); setCount((d.comments ?? []).length); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, [contentType, contentId]);

  // Charger le slug de la session
  useEffect(() => {
    (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('praticiens').select('slug').eq('user_id', session.user.id).maybeSingle();
      if (data) setMySlug(data.slug);
    })();
  }, []);

  function toggle() {
    setOpen(o => !o);
    if (!open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 150);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = text.trim();
    if (trimmed.length < 2) return;

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/connexion'); return; }

    setSending(true);
    const res = await fetch('/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: contentType, content_id: contentId, content: trimmed }),
    });
    setSending(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t('sendError'));
      return;
    }
    const { comment } = await res.json();
    setComments(cs => [...cs, comment]);
    setCount(c => c + 1);
    setText('');
  }

  async function deleteComment(id: string) {
    const res = await fetch('/api/comment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    setComments(cs => cs.filter(c => c.id !== id));
    setCount(c => c - 1);
  }

  async function saveEdit(id: string) {
    const trimmed = editText.trim();
    if (trimmed.length < 2) return;
    setSavingEdit(true);
    const res = await fetch('/api/comment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: trimmed }),
    });
    setSavingEdit(false);
    if (!res.ok) return;
    const { comment } = await res.json();
    setComments(cs => cs.map(c => c.id === id ? { ...c, ...comment } : c));
    setEditingId(null);
    setEditText('');
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t('timeAgoMin', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('timeAgoHour', { count: hrs });
    const days = Math.floor(hrs / 24);
    return t('timeAgoDay', { count: days });
  };

  return (
    <div onClick={e => e.stopPropagation()}>
      {/* Bouton compteur */}
      <button
        onClick={toggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '.3rem',
          background: 'none',
          border: '1px solid ' + (open ? 'rgba(56,189,248,.4)' : 'var(--f-border)'),
          borderRadius: 6,
          padding: '3px 8px',
          cursor: 'pointer',
          color: open ? 'var(--f-sky)' : 'var(--f-text-3)',
          fontFamily: "'Geist Mono', monospace",
          fontSize: '.6rem',
          transition: 'color .15s, border-color .15s',
          flexShrink: 0,
        }}
        title={open ? t('closeComments') : t('viewComments')}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {count > 0 && <span>{count}</span>}
      </button>

      {/* Panel commentaires */}
      {open && (
        <div style={{
          marginTop: '.75rem',
          borderTop: '1px solid var(--f-border)',
          paddingTop: '.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '.6rem',
        }}>
          {/* Liste */}
          {comments.length === 0 ? (
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
              {t('beFirst')}
            </p>
          ) : (
            comments.map(c => {
              const isOwn = mySlug && c.praticiens?.slug === mySlug;
              const isEditing = editingId === c.id;
              return (
                <div key={c.id} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                  {c.praticiens && (
                    <Avatar name={c.praticiens.name} photoUrl={c.praticiens.photo_url ?? null} size={24} radius={6} fontSize=".5rem" />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.2rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-sky)', fontWeight: 600 }}>
                        @{c.praticiens?.slug ?? '?'}
                      </span>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', color: 'var(--f-text-3)' }}>
                        {timeAgo(c.created_at)}
                      </span>
                      {isOwn && !isEditing && (
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.25rem' }}>
                          <button
                            onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                            style={{
                              background: 'none', border: '1px solid var(--f-border)', borderRadius: 4,
                              padding: '1px 6px', cursor: 'pointer',
                              fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', color: 'var(--f-text-3)',
                            }}
                          >{t('edit')}</button>
                          <button
                            onClick={() => deleteComment(c.id)}
                            style={{
                              background: 'none', border: '1px solid #f8717133', borderRadius: 4,
                              padding: '1px 6px', cursor: 'pointer',
                              fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', color: '#f87171',
                            }}
                          >{t('delete')}</button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          maxLength={500}
                          rows={2}
                          autoFocus
                          style={{
                            width: '100%', resize: 'none',
                            background: 'var(--f-surface)', border: '1px solid var(--f-sky)',
                            borderRadius: 5, padding: '.35rem .5rem',
                            fontFamily: "'Geist Mono', monospace", fontSize: '.7rem',
                            color: 'var(--f-text-1)', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '.25rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => { setEditingId(null); setEditText(''); }}
                            style={{
                              background: 'none', border: '1px solid var(--f-border)', borderRadius: 4,
                              padding: '2px 8px', cursor: 'pointer',
                              fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)',
                            }}
                          >{t('cancel')}</button>
                          <button
                            onClick={() => saveEdit(c.id)}
                            disabled={savingEdit || editText.trim().length < 2}
                            style={{
                              border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
                              fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', fontWeight: 600,
                              background: editText.trim().length >= 2 ? 'var(--f-sky)' : 'var(--f-border)',
                              color: editText.trim().length >= 2 ? '#0d1117' : 'var(--f-text-3)',
                            }}
                          >{savingEdit ? '…' : t('save')}</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-2)', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
                        {c.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Form */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginTop: '.25rem' }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t('placeholder')}
              maxLength={500}
              rows={2}
              style={{
                width: '100%',
                resize: 'none',
                background: 'var(--f-surface)',
                border: '1px solid var(--f-border)',
                borderRadius: 6,
                padding: '.5rem .7rem',
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.72rem',
                color: 'var(--f-text-1)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {error && <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: '#f87171', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={sending || text.trim().length < 2}
              style={{
                alignSelf: 'flex-end',
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.62rem',
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                background: text.trim().length >= 2 ? 'var(--f-sky)' : 'var(--f-border)',
                color: text.trim().length >= 2 ? '#0d1117' : 'var(--f-text-3)',
                cursor: sending || text.trim().length < 2 ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
                fontWeight: 600,
              }}
            >
              {sending ? '...' : t('send')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
