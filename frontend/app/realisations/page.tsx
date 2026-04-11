'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonArticleCard } from '@/components/SkeletonCard';
import LikeButton from '@/components/LikeButton';
import RealisationModal from '@/components/RealisationModal';
import { useTranslations } from 'next-intl';

const PAGE_SIZE = 12;

type RealisationWithPraticien = {
  id: string; slug: string; title: string; praticien_id: string;
  category: string; type: string; stack: string[]; excerpt?: string;
  demo_url?: string; repo_url?: string; date_published?: string;
  status: string; created_at: string; collaborateurs?: string[];
  praticiens: { name: string; slug: string; photo_url?: string } | null;
};

import { CAT_COLOR, CAT_LABEL, REAL_TYPE_LABELS, REAL_TYPE_ICONS } from '@/lib/constants';

export default function RealisationsPage() {
  const t = useTranslations('realisations');
  const [realisations, setRealisations] = useState<RealisationWithPraticien[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [activeCat, setActiveCat] = useState('all');
  const [activeStack, setActiveStack] = useState('');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<RealisationWithPraticien | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => { setVisible(PAGE_SIZE); }, [activeType, activeCat, activeStack, search]);

  useEffect(() => {
    supabase
      .from('realisations')
      .select('*, praticiens(name, slug, photo_url)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows = (data as RealisationWithPraticien[]) ?? [];
        setRealisations(rows);
        setLoading(false);
        // Load comment counts for all realisations
        rows.forEach(r => {
          fetch(`/api/comment?type=realisation&id=${r.id}`)
            .then(res => res.json())
            .then(d => {
              setCommentCounts(prev => ({ ...prev, [r.id]: (d.comments ?? []).length }));
            })
            .catch(() => {});
        });
      });
  }, []);

  const filtered = realisations.filter(r => {
    if (activeType !== 'all' && r.type !== activeType) return false;
    if (activeCat !== 'all' && r.category !== activeCat) return false;
    if (activeStack && !(r.stack ?? []).map(s => s.toLowerCase()).includes(activeStack.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !(r.praticiens?.name || '').toLowerCase().includes(q) && !(r.excerpt || '').toLowerCase().includes(q)) return false;
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
          {['all', 'data', 'devops', 'cloud', 'ia', 'cyber', 'frontend', 'backend', 'fullstack', 'mobile', 'web3', 'embedded', 'autre'].map(c => (
            <button
              key={c}
              className={`filter-pill${activeCat === c ? ' active' : ''}`}
              onClick={() => setActiveCat(c)}
            >
              {c === 'all' ? t('allCategories') : CAT_LABEL[c] || c}
            </button>
          ))}
        </div>

        {/* Filtres type */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {['all', 'pipeline', 'dashboard', 'api', 'bootcamp', 'youtube', 'app', 'cours', 'autre'].map(typ => (
            <button
              key={typ}
              className={`filter-pill${activeType === typ ? ' active' : ''}`}
              onClick={() => setActiveType(typ)}
            >
              {typ === 'all' ? t('allTypes') : `${REAL_TYPE_ICONS[typ] || ''} ${REAL_TYPE_LABELS[typ] || typ}`}
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
            {filtered.slice(0, visible).map(r => {
              const catColor = CAT_COLOR[r.category] || 'var(--f-text-3)';
              const typeIcon = REAL_TYPE_ICONS[r.type] || '◦';
              const typeLabel = REAL_TYPE_LABELS[r.type] || r.type;

              const commentCount = commentCounts[r.id] ?? 0;

              return (
                <article
                  key={r.slug}
                  className="f-card f-card-hover realisation-card"
                  onClick={() => setSelected(r)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.9rem',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
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

                  {/* Badges type + catégorie */}
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.25rem' }}>
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
                    }}>{CAT_LABEL[r.category] || r.category}</span>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.58rem',
                      letterSpacing: '.09em',
                      textTransform: 'uppercase',
                      color: 'var(--f-text-3)',
                      border: '1px solid var(--f-border)',
                      padding: '3px 9px',
                      borderRadius: 99,
                      fontWeight: 600,
                    }}>{typeIcon} {typeLabel}</span>
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
                  }}>{r.title}</h3>

                  {/* Auteur + co-auteurs */}
                  {r.praticiens && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.3rem' }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: catColor, opacity: .6 }}>by</span>
                      <Link
                        href={`/praticiens/${r.praticiens.slug}`}
                        style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: catColor, textDecoration: 'none', opacity: .85 }}
                        onClick={e => e.stopPropagation()}
                      >
                        {r.praticiens.name}
                      </Link>
                      {r.collaborateurs && r.collaborateurs.length > 0 && (
                        <>
                          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', opacity: .6 }}>+</span>
                          {r.collaborateurs.map(c => (
                            <Link
                              key={c}
                              href={`/praticiens/${c}`}
                              style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', textDecoration: 'none', border: '1px solid var(--f-border)', padding: '1px 6px', borderRadius: 99 }}
                              onClick={e => e.stopPropagation()}
                            >
                              @{c}
                            </Link>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Excerpt */}
                  {r.excerpt && (
                    <p style={{
                      fontSize: '.83rem',
                      color: 'var(--f-text-2)',
                      lineHeight: 1.75,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>{r.excerpt}</p>
                  )}

                  {/* Spacer */}
                  <div style={{ flex: 1 }} />

                  {/* Stack */}
                  {r.stack?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                      {r.stack.slice(0, 5).map(s => (
                        <button
                          key={s}
                          onClick={e => { e.stopPropagation(); setActiveStack(activeStack === s ? '' : s); }}
                          className="f-tag"
                          style={{
                            cursor: 'pointer', border: 'none', background: activeStack === s ? 'var(--f-sky)' : undefined,
                            color: activeStack === s ? '#0d1117' : undefined, fontWeight: activeStack === s ? 700 : undefined,
                          }}
                        >{s}</button>
                      ))}
                      {r.stack.length > 5 && (
                        <span className="f-tag" style={{ color: 'var(--f-text-3)' }}>+{r.stack.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Footer : liens + like + commentaires */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '.75rem',
                    borderTop: '1px solid var(--f-border)',
                    marginTop: '.25rem',
                    gap: '.5rem',
                  }}>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                      {r.demo_url && (
                        <a
                          href={r.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: '.62rem',
                            color: catColor,
                            border: `1px solid ${catColor}44`,
                            background: `${catColor}0a`,
                            padding: '3px 10px',
                            borderRadius: 99,
                            textDecoration: 'none',
                            transition: 'opacity .15s',
                          }}
                        >
                          {t('demo')}
                        </a>
                      )}
                      {r.repo_url && (
                        <a
                          href={r.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: '.62rem',
                            color: 'var(--f-text-3)',
                            border: '1px solid var(--f-border)',
                            padding: '3px 10px',
                            borderRadius: 99,
                            textDecoration: 'none',
                            transition: 'opacity .15s',
                          }}
                        >
                          {t('repo')}
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      {/* Compteur commentaires */}
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(r); }}
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
                      <div onClick={e => e.stopPropagation()}>
                        <LikeButton contentType="realisation" contentId={r.id} initialCount={0} initialLiked={false} />
                      </div>
                    </div>
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
            {activeStack && (
              <> · {t('stackFilter')} <button onClick={() => setActiveStack('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: 'var(--f-sky)', padding: 0 }}>{activeStack} ✕</button></>
            )}
          </p>
        </>
      )}

      {/* Modal réalisation */}
      {selected && (
        <RealisationModal
          realisation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
