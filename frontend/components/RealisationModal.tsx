'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';

type RealisationDetail = {
  id: string; slug: string; title: string;
  category: string; type: string; stack: string[];
  excerpt?: string; demo_url?: string; repo_url?: string;
  date_published?: string; created_at: string;
  collaborateurs?: string[];
  praticiens: { name: string; slug: string; photo_url?: string } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  praticiens: { slug: string; name: string; photo_url?: string } | null;
};

type Props = {
  realisation: RealisationDetail | null;
  onClose: () => void;
};

import { CAT_COLOR, CAT_LABEL, REAL_TYPE_LABELS, REAL_TYPE_ICONS } from '@/lib/constants';
import { formatDateTime, timeAgo } from '@/lib/utils';


export default function RealisationModal({ realisation, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [mySlug, setMySlug] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll + compensate scrollbar width (Windows fix)
  useEffect(() => {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sw > 0) document.body.style.paddingRight = `${sw}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Focus top sentinel on open — prevents browser from auto-scrolling to textarea (all browsers/OS)
  useEffect(() => {
    requestAnimationFrame(() => {
      if (topRef.current) topRef.current.focus();
    });
  }, [realisation?.id]);

  // Reset scroll to top after comments load (double rAF for paint guarantee)
  useEffect(() => {
    if (!loadingComments) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }));
    }
  }, [loadingComments]);

  // Load session slug
  useEffect(() => {
    (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('praticiens').select('slug').eq('user_id', session.user.id).maybeSingle();
      if (data) setMySlug(data.slug);
    })();
  }, []);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!realisation) return;
    setLoadingComments(true);
    const res = await fetch(`/api/comment?type=realisation&id=${realisation.id}`);
    const d = await res.json();
    setComments(d.comments ?? []);
    setLoadingComments(false);
  }, [realisation]);

  useEffect(() => { loadComments(); }, [loadComments]);

  if (!realisation) return null;

  const catColor = CAT_COLOR[realisation.category] || 'var(--f-text-3)';
  const typeIcon = REAL_TYPE_ICONS[realisation.type] || '◦';
  const typeLabel = REAL_TYPE_LABELS[realisation.type] || realisation.type;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = text.trim();
    if (trimmed.length < 2 || !realisation) return;
    const realisationId = realisation.id;

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/connexion'); return; }

    setSending(true);
    const res = await fetch('/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'realisation', content_id: realisationId, content: trimmed }),
    });
    setSending(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Erreur lors de l\'envoi.');
      return;
    }
    const { comment } = await res.json();
    setComments(cs => [...cs, comment]);
    setText('');
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

  async function deleteComment(id: string) {
    await fetch('/api/comment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setComments(cs => cs.filter(c => c.id !== id));
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        width: '100%', height: '100%',
        zIndex: 1000,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={scrollRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--f-surface)',
          border: '1px solid var(--f-border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Focus sentinel — keeps scroll at top on all browsers/OS */}
        <div ref={topRef} tabIndex={-1} style={{ outline: 'none', height: 0, overflow: 'hidden' }} aria-hidden />

        {/* Bande couleur */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${catColor}, transparent)`,
          borderRadius: '16px 16px 0 0',
        }} />

        {/* Header modal */}
        <div style={{ padding: '1.75rem 1.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginTop: '.25rem' }}>
          <div style={{ flex: 1 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.9rem' }}>
              <span style={{
                fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.09em',
                textTransform: 'uppercase', color: catColor, border: `1px solid ${catColor}33`,
                background: `${catColor}0d`, padding: '3px 9px', borderRadius: 99, fontWeight: 600,
              }}>{CAT_LABEL[realisation.category] || realisation.category}</span>
              <span style={{
                fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.09em',
                textTransform: 'uppercase', color: 'var(--f-text-3)', border: '1px solid var(--f-border)',
                padding: '3px 9px', borderRadius: 99, fontWeight: 600,
              }}>{typeIcon} {typeLabel}</span>
            </div>

            {/* Titre */}
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 800,
              color: 'var(--f-text-1)', margin: '0 0 .75rem', letterSpacing: '-.02em', lineHeight: 1.25,
            }}>{realisation.title}</h2>

            {/* Auteur + date */}
            {realisation.praticiens && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                <Avatar name={realisation.praticiens.name} photoUrl={realisation.praticiens.photo_url ?? null} size={24} radius={6} fontSize=".5rem" />
                <a
                  href={`/praticiens/${realisation.praticiens.slug}`}
                  style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: catColor, textDecoration: 'none', opacity: .85 }}
                >
                  {realisation.praticiens.name}
                </a>
                {realisation.date_published && (
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)' }}>
                    · {realisation.date_published}
                  </span>
                )}
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', marginLeft: 'auto' }}>
                  Soumis le {formatDateTime(realisation.created_at)}
                </span>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid var(--f-border)', borderRadius: 8,
              padding: '4px 8px', cursor: 'pointer', color: 'var(--f-text-3)',
              fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Excerpt */}
          {realisation.excerpt && (
            <p style={{ fontSize: '.88rem', color: 'var(--f-text-2)', lineHeight: 1.75, margin: 0 }}>
              {realisation.excerpt}
            </p>
          )}

          {/* Stack */}
          {realisation.stack?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
              {realisation.stack.map(s => (
                <span key={s} className="f-tag">{s}</span>
              ))}
            </div>
          )}

          {/* Liens */}
          {(realisation.demo_url || realisation.repo_url) && (
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {realisation.demo_url && (
                <a href={realisation.demo_url} target="_blank" rel="noreferrer" style={{
                  fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: catColor,
                  border: `1px solid ${catColor}44`, background: `${catColor}0a`,
                  padding: '5px 14px', borderRadius: 99, textDecoration: 'none',
                }}>Demo →</a>
              )}
              {realisation.repo_url && (
                <a href={realisation.repo_url} target="_blank" rel="noreferrer" style={{
                  fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-3)',
                  border: '1px solid var(--f-border)', padding: '5px 14px', borderRadius: 99, textDecoration: 'none',
                }}>Repo →</a>
              )}
            </div>
          )}

          {/* Like */}
          <div>
            <LikeButton contentType="realisation" contentId={realisation.id} initialCount={0} initialLiked={false} />
          </div>

          {/* Séparateur commentaires */}
          <div style={{ borderTop: '1px solid var(--f-border)', paddingTop: '1rem' }}>
            <span style={{
              fontFamily: "'Geist Mono', monospace", fontSize: '.65rem',
              color: 'var(--f-text-3)', letterSpacing: '.06em', textTransform: 'uppercase',
            }}>
              // commentaires ({comments.length})
            </span>
          </div>

          {/* Liste commentaires */}
          {loadingComments ? (
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
              Chargement…
            </p>
          ) : comments.length === 0 ? (
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
              Sois le premier à commenter.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {comments.map(c => {
                const isOwn = mySlug && c.praticiens?.slug === mySlug;
                const isEditing = editingId === c.id;
                return (
                  <div key={c.id} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                    {c.praticiens && (
                      <Avatar name={c.praticiens.name} photoUrl={c.praticiens.photo_url ?? null} size={28} radius={7} fontSize=".55rem" />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-sky)', fontWeight: 600 }}>
                          @{c.praticiens?.slug ?? '?'}
                        </span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)' }}>
                          {formatDateTime(c.created_at)}
                        </span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.57rem', color: 'var(--f-text-3)', opacity: .7 }}>
                          ({timeAgo(c.created_at)})
                        </span>
                        {isOwn && !isEditing && (
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.35rem' }}>
                            <button
                              onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                              style={{
                                background: 'none', border: '1px solid var(--f-border)',
                                borderRadius: 5, padding: '2px 7px', cursor: 'pointer',
                                fontFamily: "'Geist Mono', monospace", fontSize: '.58rem',
                                color: 'var(--f-text-3)',
                              }}
                            >Modifier</button>
                            <button
                              onClick={() => deleteComment(c.id)}
                              style={{
                                background: 'none', border: '1px solid #f8717133',
                                borderRadius: 5, padding: '2px 7px', cursor: 'pointer',
                                fontFamily: "'Geist Mono', monospace", fontSize: '.58rem',
                                color: '#f87171',
                              }}
                            >Suppr.</button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            maxLength={500}
                            rows={2}
                            autoFocus
                            style={{
                              width: '100%', resize: 'none',
                              background: 'var(--f-bg)', border: '1px solid var(--f-sky)',
                              borderRadius: 6, padding: '.4rem .6rem',
                              fontFamily: "'Geist Mono', monospace", fontSize: '.72rem',
                              color: 'var(--f-text-1)', outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setEditingId(null); setEditText(''); }}
                              style={{
                                background: 'none', border: '1px solid var(--f-border)',
                                borderRadius: 5, padding: '3px 10px', cursor: 'pointer',
                                fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)',
                              }}
                            >Annuler</button>
                            <button
                              onClick={() => saveEdit(c.id)}
                              disabled={savingEdit || editText.trim().length < 2}
                              style={{
                                border: 'none', borderRadius: 5, padding: '3px 10px', cursor: 'pointer',
                                fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', fontWeight: 600,
                                background: editText.trim().length >= 2 ? 'var(--f-sky)' : 'var(--f-border)',
                                color: editText.trim().length >= 2 ? '#0d1117' : 'var(--f-text-3)',
                              }}
                            >{savingEdit ? '…' : 'Sauvegarder'}</button>
                          </div>
                        </div>
                      ) : (
                        <p style={{
                          fontFamily: "'Geist Mono', monospace", fontSize: '.74rem',
                          color: 'var(--f-text-2)', lineHeight: 1.65, margin: 0, wordBreak: 'break-word',
                        }}>{c.content}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form ajout commentaire */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginTop: '.25rem' }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Ajouter un commentaire…"
              maxLength={500}
              rows={2}
              style={{
                width: '100%', resize: 'none',
                background: 'var(--f-bg)', border: '1px solid var(--f-border)',
                borderRadius: 6, padding: '.5rem .7rem',
                fontFamily: "'Geist Mono', monospace", fontSize: '.74rem',
                color: 'var(--f-text-1)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {error && <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: '#f87171', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={sending || text.trim().length < 2}
              style={{
                alignSelf: 'flex-end',
                fontFamily: "'Geist Mono', monospace", fontSize: '.64rem', fontWeight: 600,
                padding: '5px 14px', borderRadius: 6, border: 'none',
                background: text.trim().length >= 2 ? 'var(--f-sky)' : 'var(--f-border)',
                color: text.trim().length >= 2 ? '#0d1117' : 'var(--f-text-3)',
                cursor: sending || text.trim().length < 2 ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
              }}
            >{sending ? '…' : 'Envoyer →'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
