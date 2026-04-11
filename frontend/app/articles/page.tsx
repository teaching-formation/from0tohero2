'use client';
import { useState, useEffect } from 'react';
import { supabase, type Article } from '@/lib/supabase';
import { SkeletonArticleCard } from '@/components/SkeletonCard';
import FlagImg from '@/components/FlagImg';
import LikeButton from '@/components/LikeButton';
import ArticleModal from '@/components/ArticleModal';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 12;

import { CAT_COLOR, CAT_LABEL, SOURCE_ICON } from '@/lib/constants';

export default function ArticlesPage() {
  const t = useTranslations('articles');
  const tCats = useTranslations('cats');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Article | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => { setVisible(PAGE_SIZE); }, [activeFilter, search]);

  useEffect(() => {
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows = data ?? [];
        setArticles(rows);
        setLoading(false);
        rows.forEach(a => {
          fetch(`/api/comment?type=article&id=${a.id}`)
            .then(res => res.json())
            .then(d => {
              setCommentCounts(prev => ({ ...prev, [a.id]: (d.comments ?? []).length }));
            })
            .catch(() => {});
        });
      });
  }, []);

  const filtered = articles.filter(a => {
    if (activeFilter !== 'all' && a.category !== activeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.author.toLowerCase().includes(q) && !(a.excerpt || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>{t('label')}</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 .75rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: '0 0 2.25rem 0', lineHeight: 1.7 }}>
          {t('subtitle')}
        </p>

        {/* Barre de recherche */}
        <input
          className="f-input"
          type="search"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '100%', marginBottom: '1.25rem' }}
        />

        {/* Filtres catégorie */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {['all', 'data', 'devops', 'cloud', 'ia', 'cyber', 'frontend', 'backend', 'fullstack', 'mobile', 'web3', 'embedded', 'autre'].map(f => (
            <button
              key={f}
              className={`filter-pill${activeFilter === f ? ' active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'all' ? t('all') : (tCats(f as Parameters<typeof tCats>[0]) || f)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonArticleCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '5rem 0',
          fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-text-3)',
        }}>
          {t('empty')}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem' }}>
            {filtered.slice(0, visible).map(a => {
              const catColor = CAT_COLOR[a.category] || 'var(--f-text-3)';
              const srcKey = (a.source || '').toLowerCase();
              const srcIcon = SOURCE_ICON[srcKey] || '◧';
              const srcLabel = a.source_label || a.source || '';
              const commentCount = commentCounts[a.id] ?? 0;

              return (
                <article
                  key={a.slug}
                  className="f-card f-card-hover"
                  onClick={() => setSelected(a)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.9rem',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {/* Bande couleur catégorie */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${catColor}, transparent)`,
                    borderRadius: '12px 12px 0 0',
                    opacity: .8,
                  }} />

                  {/* Badge catégorie + source */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.4rem', marginTop: '.25rem' }}>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.58rem',
                      letterSpacing: '.09em',
                      textTransform: 'uppercase',
                      color: catColor,
                      border: `1px solid ${catColor}33`,
                      background: `${catColor}0d`,
                      padding: '3px 9px',
                      borderRadius: 99,
                      fontWeight: 600,
                    }}>{tCats(a.category as Parameters<typeof tCats>[0]) || a.category}</span>

                    {srcLabel && (
                      <span style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.58rem',
                        letterSpacing: '.07em',
                        color: 'var(--f-text-3)',
                        border: '1px solid var(--f-border)',
                        padding: '3px 9px',
                        borderRadius: 99,
                        fontWeight: 600,
                      }}>{srcIcon} {srcLabel}</span>
                    )}
                  </div>

                  {/* Titre */}
                  <h3 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    color: 'var(--f-text-1)',
                    margin: 0,
                    letterSpacing: '-.015em',
                    lineHeight: 1.3,
                    flex: 1,
                  }}>{a.title}</h3>

                  {/* Auteur + date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.68rem',
                      color: catColor,
                      opacity: .85,
                      letterSpacing: '.01em',
                    }}>
                      {a.author_country && <span style={{ marginRight: '.3rem', verticalAlign: 'middle' }}><FlagImg country={a.author_country} size={16} /></span>}
                      {a.author}
                    </span>
                    {a.date_published && (
                      <span style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.63rem',
                        color: 'var(--f-text-3)',
                        marginLeft: 'auto',
                      }}>{a.date_published}</span>
                    )}
                  </div>

                  {/* Excerpt */}
                  {a.excerpt && (
                    <p style={{
                      fontSize: '.83rem',
                      color: 'var(--f-text-2)',
                      lineHeight: 1.75,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>{a.excerpt}</p>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '.75rem',
                    borderTop: '1px solid var(--f-border)',
                    marginTop: '.25rem',
                    gap: '.4rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <div onClick={e => e.stopPropagation()}>
                        <LikeButton contentType="article" contentId={a.id} initialCount={0} initialLiked={false} />
                      </div>
                      {/* Compteur commentaires */}
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(a); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
                          background: 'none', border: '1px solid var(--f-border)',
                          borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                          color: 'var(--f-text-3)', fontFamily: "'Geist Mono', monospace",
                          fontSize: '.6rem', transition: 'color .15s, border-color .15s',
                          flexShrink: 0,
                        }}
                        title={t('comments')}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {commentCount > 0 && <span>{commentCount}</span>}
                      </button>
                    </div>
                    <a
                      href={a.external_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.62rem',
                        color: catColor,
                        opacity: .8,
                        letterSpacing: '.04em',
                        textDecoration: 'none',
                      }}
                    >{t('read')}</a>
                  </div>

                </article>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button className="btn-f btn-f-secondary" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                {t('loadMore', { count: filtered.length - visible })}
              </button>
            </div>
          )}

          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.63rem',
            color: 'var(--f-text-3)',
            textAlign: 'center',
            marginTop: '1.25rem',
            letterSpacing: '.06em',
          }}>
            {t('counter', { visible: Math.min(visible, filtered.length), total: filtered.length })}
          </p>
        </>
      )}

      {/* Modal article */}
      {selected && (
        <ArticleModal
          article={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
