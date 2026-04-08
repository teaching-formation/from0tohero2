'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import FlagImg from '@/components/FlagImg';

type ArticleDetail = {
  id: string; slug: string; title: string;
  category: string; source?: string; source_label?: string;
  author: string; author_country?: string; excerpt?: string;
  external_url: string; date_published?: string; created_at: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  praticiens: { slug: string; name: string; photo_url?: string } | null;
};

type Props = {
  article: ArticleDetail | null;
  onClose: () => void;
};

const CAT_COLOR: Record<string, string> = {
  data: 'var(--f-sky)', devops: '#a78bfa', cloud: 'var(--f-sky)',
  ia: 'var(--f-orange)', cyber: '#f87171', frontend: 'var(--f-green)',
  backend: '#a78bfa', fullstack: 'var(--f-orange)', mobile: 'var(--f-green)',
  web3: '#a78bfa', embedded: 'var(--f-sky)', dev: '#f472b6', autre: 'var(--f-text-3)',
};

const CAT_LABEL: Record<string, string> = {
  data: 'Data', devops: 'DevOps', cloud: 'Cloud', ia: 'IA',
  cyber: 'Cybersécurité', frontend: 'Frontend', backend: 'Backend',
  fullstack: 'Full-Stack', mobile: 'Mobile', web3: 'Web3',
  embedded: 'Embedded / IoT', dev: 'Dev', autre: 'Autre',
};

const SOURCE_ICON: Record<string, string> = {
  medium: 'M', linkedin: 'in', devto: 'DEV', hashnode: 'H',
  substack: '◎', youtube: '▷', autre: '◦',
};

function formatDateTime(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

export default function ArticleModal({ article, onClose }: Props) {
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
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Reset scroll to top after comments load (cross-platform fix)
  useEffect(() => {
    if (!loadingComments && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      });
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
    if (!article) return;
    setLoadingComments(true);
    const res = await fetch(`/api/comment?type=article&id=${article.id}`);
    const d = await res.json();
    setComments(d.comments ?? []);
    setLoadingComments(false);
  }, [article]);

  useEffect(() => { loadComments(); }, [loadComments]);

  if (!article) return null;

  const catColor = CAT_COLOR[article.category] || 'var(--f-text-3)';
  const srcKey = (article.source || '').toLowerCase();
  const srcIcon = SOURCE_ICON[srcKey] || '◧';
  const srcLabel = article.source_label || article.source || '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = text.trim();
    if (trimmed.length < 2 || !article) return;
    const articleId = article.id;

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/connexion'); return; }

    setSending(true);
    const res = await fetch('/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: 'article', content_id: articleId, content: trimmed }),
    });
    setSending(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erreur lors de l'envoi.");
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
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
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
        {/* Bande couleur */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${catColor}, transparent)`,
          borderRadius: '16px 16px 0 0',
        }} />

        {/* Header */}
        <div style={{ padding: '1.75rem 1.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginTop: '.25rem' }}>
          <div style={{ flex: 1 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.9rem' }}>
              <span style={{
                fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.09em',
                textTransform: 'uppercase', color: catColor, border: `1px solid ${catColor}33`,
                background: `${catColor}0d`, padding: '3px 9px', borderRadius: 99, fontWeight: 600,
              }}>{CAT_LABEL[article.category] || article.category}</span>
              {srcLabel && (
                <span style={{
                  fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.07em',
                  color: 'var(--f-text-3)', border: '1px solid var(--f-border)',
                  padding: '3px 9px', borderRadius: 99, fontWeight: 600,
                }}>{srcIcon} {srcLabel}</span>
              )}
            </div>

            {/* Titre */}
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 800,
              color: 'var(--f-text-1)', margin: '0 0 .75rem', letterSpacing: '-.02em', lineHeight: 1.25,
            }}>{article.title}</h2>

            {/* Auteur + date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              {article.author_country && (
                <FlagImg country={article.author_country} size={16} />
              )}
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: catColor, opacity: .85 }}>
                {article.author}
              </span>
              {article.date_published && (
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)' }}>
                  · {article.date_published}
                </span>
              )}
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', marginLeft: 'auto' }}>
                Ajouté le {formatDateTime(article.created_at)}
              </span>
            </div>
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
          {article.excerpt && (
            <p style={{ fontSize: '.88rem', color: 'var(--f-text-2)', lineHeight: 1.75, margin: 0 }}>
              {article.excerpt}
            </p>
          )}

          {/* Lire l'article */}
          <div>
            <a
              href={article.external_url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', fontWeight: 600,
                color: catColor, border: `1px solid ${catColor}44`, background: `${catColor}0a`,
                padding: '6px 16px', borderRadius: 99, textDecoration: 'none', display: 'inline-block',
              }}
            >
              Lire l'article →
            </a>
          </div>

          {/* Like */}
          <div>
            <LikeButton contentType="article" contentId={article.id} initialCount={0} initialLiked={false} />
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
                                fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)',
                              }}
                            >Modifier</button>
                            <button
                              onClick={() => deleteComment(c.id)}
                              style={{
                                background: 'none', border: '1px solid #f8717133',
                                borderRadius: 5, padding: '2px 7px', cursor: 'pointer',
                                fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: '#f87171',
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
