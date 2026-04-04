'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonArticleCard } from '@/components/SkeletonCard';

const PAGE_SIZE = 12;

type RealisationWithPraticien = {
  id: string; slug: string; title: string; praticien_id: string;
  category: string; type: string; stack: string[]; excerpt?: string;
  demo_url?: string; repo_url?: string; date_published?: string;
  status: string; created_at: string;
  praticiens: { name: string; slug: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  pipeline: 'Pipeline', dashboard: 'Dashboard', api: 'API',
  bootcamp: 'Bootcamp', youtube: 'YouTube', app: 'App',
  cours: 'Cours', podcast: 'Podcast', newsletter: 'Newsletter',
  blog: 'Blog', autre: 'Autre',
};

const TYPE_ICONS: Record<string, string> = {
  pipeline: '⬡', dashboard: '◧', api: '◈', bootcamp: '◎',
  youtube: '▷', app: '⬟', cours: '◉', podcast: '◌',
  newsletter: '◫', blog: '◪', autre: '◦',
};

const CAT_COLOR: Record<string, string> = {
  data: 'var(--f-sky)',
  devops: '#a78bfa',
  cloud: 'var(--f-sky)',
  ia: 'var(--f-orange)',
  cyber: '#f87171',
  frontend: 'var(--f-green)',
  backend: '#a78bfa',
  fullstack: 'var(--f-orange)',
  mobile: 'var(--f-green)',
  web3: '#a78bfa',
  embedded: 'var(--f-sky)',
  mlops: '#fb923c',
  dev: '#f472b6',
  autre: 'var(--f-text-3)',
};

const CAT_LABEL: Record<string, string> = {
  data: 'Data', devops: 'DevOps', cloud: 'Cloud', ia: 'IA',
  cyber: 'Cybersécurité', frontend: 'Frontend', backend: 'Backend',
  fullstack: 'Full-Stack', mobile: 'Mobile', web3: 'Web3',
  embedded: 'Embedded / IoT', mlops: 'MLOps', dev: 'Dev', autre: 'Autre',
};

export default function RealisationsPage() {
  const [realisations, setRealisations] = useState<RealisationWithPraticien[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [activeCat, setActiveCat] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => { setVisible(PAGE_SIZE); }, [activeType, activeCat]);

  useEffect(() => {
    supabase
      .from('realisations')
      .select('*, praticiens(name, slug)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRealisations((data as RealisationWithPraticien[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = realisations.filter(r => {
    if (activeType !== 'all' && r.type !== activeType) return false;
    if (activeCat !== 'all' && r.category !== activeCat) return false;
    return true;
  });

  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>// réalisations</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 .75rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          Ce que les praticiens construisent
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: '0 0 2.25rem 0', lineHeight: 1.7 }}>
          Pipelines · Dashboards · APIs · Bootcamps · Chaînes YT — du concret, pas des promesses.
        </p>

        {/* Filtres type */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
          {['all', 'pipeline', 'dashboard', 'api', 'bootcamp', 'youtube', 'app', 'cours', 'autre'].map(t => (
            <button
              key={t}
              className={`filter-pill${activeType === t ? ' active' : ''}`}
              onClick={() => setActiveType(t)}
            >
              {t === 'all' ? 'Tous les types' : `${TYPE_ICONS[t] || ''} ${TYPE_LABELS[t] || t}`}
            </button>
          ))}
        </div>

        {/* Filtres catégorie */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {['all', 'data', 'devops', 'cloud', 'ia', 'cyber', 'frontend', 'backend', 'fullstack', 'mobile', 'web3', 'embedded', 'autre'].map(c => (
            <button
              key={c}
              className={`filter-pill${activeCat === c ? ' active' : ''}`}
              onClick={() => setActiveCat(c)}
            >
              {c === 'all' ? 'Toutes catégories' : CAT_LABEL[c] || c}
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
          Aucune réalisation pour ces filtres.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem' }}>
            {filtered.slice(0, visible).map(r => {
              const catColor = CAT_COLOR[r.category] || 'var(--f-text-3)';
              const typeIcon = TYPE_ICONS[r.type] || '◦';
              const typeLabel = TYPE_LABELS[r.type] || r.type;

              return (
                <article
                  key={r.slug}
                  className="f-card f-card-hover realisation-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.9rem',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
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

                  {/* Auteur */}
                  {r.praticiens && (
                    <Link
                      href={`/praticiens/${r.praticiens.slug}`}
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.7rem',
                        color: catColor,
                        textDecoration: 'none',
                        opacity: .85,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '.3rem',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <span style={{ opacity: .6 }}>by</span> {r.praticiens.name}
                    </Link>
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
                      flex: 1,
                    }}>{r.excerpt}</p>
                  )}

                  {/* Stack */}
                  {r.stack?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginTop: 'auto' }}>
                      {r.stack.slice(0, 5).map(s => (
                        <span key={s} className="f-tag">{s}</span>
                      ))}
                      {r.stack.length > 5 && (
                        <span className="f-tag" style={{ color: 'var(--f-text-3)' }}>+{r.stack.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Footer : liens + flèche */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '.75rem',
                    borderTop: '1px solid var(--f-border)',
                    marginTop: '.25rem',
                  }}>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
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
                          Demo →
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
                          Repo →
                        </a>
                      )}
                    </div>
                    {/* Ghost type icon */}
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.62rem',
                      color: catColor,
                      opacity: .7,
                      letterSpacing: '.04em',
                    }}>voir →</span>
                  </div>

                </article>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button className="btn-f btn-f-secondary" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                Charger plus ({filtered.length - visible} restants) →
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
            {Math.min(visible, filtered.length)} / {filtered.length} réalisations
          </p>
        </>
      )}
    </div>
  );
}
