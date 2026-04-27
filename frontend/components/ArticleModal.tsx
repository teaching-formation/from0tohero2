'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';
import FlagImg from '@/components/FlagImg';
import { useTranslations, useLocale } from 'next-intl';

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

import { CAT_COLOR, CAT_LABEL, SOURCE_ICON } from '@/lib/constants';
import { formatDateTime, timeAgo, decodeHtml } from '@/lib/utils';


export default function ArticleModal({ article, onClose }: Props) {
  const t = useTranslations('modal');
  const locale = useLocale();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [mySlug, setMySlug] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
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
  }, [article?.id]);

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

  async function translateComment(id: string, content: string) {
    const targetLang = locale === 'fr' ? 'en' : 'fr';
    setTranslating(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content, targetLang }),
      });
      const d = await res.json();
      if (d.translated) {
        setTranslations(prev => ({ ...prev, [id]: d.translated }));
        setShowOriginal(prev => ({ ...prev, [id]: false }));
      }
    } catch {
      // ignore
    } finally {
      setTranslating(prev => ({ ...prev, [id]: false }));
    }
  }

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
      setError(d.error || t('sendError'));
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
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--f-surface)',
          border: '1px solid var(--f-border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Focus sentinel */}
        <div ref={topRef} tabIndex={-1} style={{ outline: 'none', height: 0, overflow: 'hidden' }} aria-hidden />

        {/* Bande couleur */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${catColor}, transparent)`,
          borderRadius: '16px 16px 0 0',
        }} />

        {/* ── HEADER fixe ─────────────────────────────────────────────────── */}
        <div style={{ padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid var(--f-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.65rem' }}>
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
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontSize: '1.15rem', fontWeight: 800,
                color: 'var(--f-text-1)', margin: '0 0 .6rem', letterSpacing: '-.02em', lineHeight: 1.25,
              }}>{decodeHtml(article.title)}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                {article.author_country && <FlagImg country={article.author_country} size={16} />}
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: catColor, opacity: .85 }}>
                  {article.author}
                </span>
                {article.date_published && (
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: 'var(--f-text-3)' }}>
                    · {article.date_published}
                  </span>
                )}
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', marginLeft: 'auto' }}>
                  {t('addedOn')} {formatDateTime(article.created_at)}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: '1px solid var(--f-border)', borderRadius: 8,
              padding: '4px 8px', cursor: 'pointer', color: 'var(--f-text-3)',
              fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', flexShrink: 0,
            }}>✕</button>
          </div>
        </div>

        {/* ── BODY scrollable ──────────────────────────────────────────────── */}
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>

          {article.excerpt && (
            <p style={{ fontSize: '.88rem', color: 'var(--f-text-2)', lineHeight: 1.75, margin: 0 }}>
              {decodeHtml(article.excerpt)}
            </p>
          )}

          {/* Lire l'article + Like + Share */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
            <a href={article.external_url} target="_blank" rel="noreferrer" style={{
              fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', fontWeight: 600,
              color: catColor, border: `1px solid ${catColor}44`, background: `${catColor}0a`,
              padding: '6px 16px', borderRadius: 99, textDecoration: 'none',
            }}>{t('readArticle')}</a>
            <LikeButton contentType="article" contentId={article.id} initialCount={0} initialLiked={false} />
            <ShareButton url={article.external_url || 'https://from0tohero.dev/articles'} title={article.title} text={article.excerpt ?? undefined} />
          </div>

          {/* Commentaires */}
          <div style={{ borderTop: '1px solid var(--f-border)', paddingTop: '.75rem' }}>
            <span style={{
              fontFamily: "'Geist Mono', monospace", fontSize: '.65rem',
              color: 'var(--f-text-3)', letterSpacing: '.06em', textTransform: 'uppercase',
            }}>{t('commentsLabel')} ({comments.length})</span>
          </div>

          {loadingComments ? (
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>{t('loading')}</p>
          ) : comments.length === 0 ? (
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>{t('beFirst')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {comments.map(c => {
                const isOwn = mySlug && c.praticiens?.slug === mySlug;
                const isEditing = editingId === c.id;
                const translated = translations[c.id];
                const isShowingOriginal = showOriginal[c.id];
                const isTranslating = translating[c.id];
                const displayContent = translated && !isShowingOriginal ? translated : c.content;
                return (
                  <div key={c.id} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                    {c.praticiens && <Avatar name={c.praticiens.name} photoUrl={c.praticiens.photo_url ?? null} size={28} radius={7} fontSize=".55rem" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-sky)', fontWeight: 600 }}>@{c.praticiens?.slug ?? '?'}</span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)' }}>{formatDateTime(c.created_at)}</span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.57rem', color: 'var(--f-text-3)', opacity: .7 }}>({timeAgo(c.created_at)})</span>
                        {isOwn && !isEditing && (
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.35rem' }}>
                            <button onClick={() => { setEditingId(c.id); setEditText(c.content); }} style={{
                              background: 'none', border: '1px solid var(--f-border)', borderRadius: 5,
                              padding: '2px 7px', cursor: 'pointer', fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)',
                            }}>{t('edit')}</button>
                            <button onClick={() => deleteComment(c.id)} style={{
                              background: 'none', border: '1px solid #f8717133', borderRadius: 5,
                              padding: '2px 7px', cursor: 'pointer', fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: '#f87171',
                            }}>{t('delete')}</button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                          <textarea value={editText} onChange={e => setEditText(e.target.value)} maxLength={500} rows={2} autoFocus style={{
                            width: '100%', resize: 'none', background: 'var(--f-bg)', border: '1px solid var(--f-sky)',
                            borderRadius: 6, padding: '.4rem .6rem', fontFamily: "'Geist Mono', monospace",
                            fontSize: '.72rem', color: 'var(--f-text-1)', outline: 'none', boxSizing: 'border-box',
                          }} />
                          <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setEditingId(null); setEditText(''); }} style={{
                              background: 'none', border: '1px solid var(--f-border)', borderRadius: 5,
                              padding: '3px 10px', cursor: 'pointer', fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)',
                            }}>{t('cancel')}</button>
                            <button onClick={() => saveEdit(c.id)} disabled={savingEdit || editText.trim().length < 2} style={{
                              border: 'none', borderRadius: 5, padding: '3px 10px', cursor: 'pointer',
                              fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', fontWeight: 600,
                              background: editText.trim().length >= 2 ? 'var(--f-sky)' : 'var(--f-border)',
                              color: editText.trim().length >= 2 ? '#0d1117' : 'var(--f-text-3)',
                            }}>{savingEdit ? '…' : t('save')}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{
                            fontFamily: "'Geist Mono', monospace", fontSize: '.74rem',
                            color: 'var(--f-text-2)', lineHeight: 1.65, margin: '0 0 .3rem 0', wordBreak: 'break-word',
                          }}>{displayContent}</p>
                          <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
                            {!translated ? (
                              <button onClick={() => translateComment(c.id, c.content)} disabled={isTranslating} style={{
                                background: 'none', border: 'none', cursor: isTranslating ? 'wait' : 'pointer',
                                fontFamily: "'Geist Mono', monospace", fontSize: '.56rem',
                                color: 'var(--f-text-3)', padding: 0, opacity: isTranslating ? 0.5 : 1,
                              }}>{isTranslating ? t('translating') : t('translate')}</button>
                            ) : (
                              <button onClick={() => setShowOriginal(prev => ({ ...prev, [c.id]: !isShowingOriginal }))} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: "'Geist Mono', monospace", fontSize: '.56rem', color: 'var(--f-sky)', padding: 0,
                              }}>{isShowingOriginal ? t('showTranslation') : t('showOriginal')}</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER fixe : formulaire commentaire ────────────────────────── */}
        <div style={{ padding: '.75rem 1.5rem .9rem', borderTop: '2px solid var(--f-border)', flexShrink: 0, background: 'var(--f-bg)' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .5rem 0' }}>
            {t('commentsLabel').replace(/\(.*\)/, '').trim()} →
          </p>
          <form onSubmit={submit} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t('commentPlaceholder')}
              maxLength={500}
              rows={2}
              style={{
                flex: 1, resize: 'none', background: 'var(--f-surface)', border: '1.5px solid var(--f-border)',
                borderRadius: 8, padding: '.5rem .7rem', fontFamily: "'Geist Mono', monospace",
                fontSize: '.74rem', color: 'var(--f-text-1)', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--f-sky)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--f-border)'}
            />
            <button type="submit" disabled={sending || text.trim().length < 2} style={{
              fontFamily: "'Geist Mono', monospace", fontSize: '.64rem', fontWeight: 600,
              padding: '8px 16px', borderRadius: 8, border: 'none', flexShrink: 0,
              background: text.trim().length >= 2 ? 'var(--f-sky)' : 'var(--f-border)',
              color: text.trim().length >= 2 ? '#0d1117' : 'var(--f-text-3)',
              cursor: sending || text.trim().length < 2 ? 'not-allowed' : 'pointer',
              transition: 'background .15s',
            }}>{sending ? '…' : t('send')}</button>
          </form>
          {error && <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: '#f87171', margin: '.4rem 0 0' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
