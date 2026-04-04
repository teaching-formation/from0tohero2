'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, type Praticien } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import { SkeletonPraticienCard } from '@/components/SkeletonCard';
import { getCountryDisplay } from '@/lib/countryFlag';
import { BADGE_STYLES } from '@/lib/badges';

const PAGE_SIZE = 12;

const FILTERS = ['all','data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'];
const FILTER_LABELS: Record<string,string> = {
  all:'Tous', data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA',
  cyber:'Cybersécurité', frontend:'Frontend', backend:'Backend',
  fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT', autre:'Autre',
};

const CAT_COLORS: Record<string, string> = {
  data: 'var(--f-sky)', devops: '#a78bfa', cloud: 'var(--f-sky)',
  ia: 'var(--f-orange)', cyber: '#f87171', frontend: 'var(--f-green)',
  backend: '#a78bfa', fullstack: 'var(--f-orange)', mobile: 'var(--f-green)',
  web3: '#a78bfa', embedded: 'var(--f-sky)', autre: 'var(--f-text-3)',
};

export default function PraticiensPage() {
  const [praticiens, setPraticiens] = useState<Praticien[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [search, setSearch]         = useState('');
  const [visible, setVisible]       = useState(PAGE_SIZE);

  useEffect(() => { setVisible(PAGE_SIZE); }, [activeFilter, activeCountry, search]);

  useEffect(() => {
    supabase
      .from('praticiens')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPraticiens(data ?? []); setLoading(false); });
  }, []);

  const countries = Array.from(
    new Map(
      praticiens
        .filter(p => p.country)
        .map(p => {
          const { flag, name } = getCountryDisplay(p.country);
          const label = name || p.country || '';
          return [label, { raw: p.country!, flag, label }];
        })
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label, 'fr'));

  const filtered = praticiens.filter(p => {
    if (activeFilter !== 'all') {
      const cats: string[] = (p as any).categories ?? (p.category ? [p.category] : []);
      if (!cats.includes(activeFilter)) return false;
    }
    if (activeCountry !== 'all') {
      const { name } = getCountryDisplay(p.country);
      const label = name || p.country || '';
      if (label !== activeCountry) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.stack.join(' ').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>// praticiens</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 .75rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          Les gens qui construisent
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: '0 0 2.25rem 0', lineHeight: 1.7 }}>
          Data · DevOps · Cloud · IA · Cybersécurité · Frontend · Backend · Mobile · Web3
        </p>

        {/* Recherche + pays */}
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <input
            className="f-input"
            type="text"
            placeholder="Rechercher par nom, rôle, stack…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <select
            value={activeCountry}
            onChange={e => setActiveCountry(e.target.value)}
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.73rem',
              padding: '.55rem .9rem',
              borderRadius: 8,
              border: '1.5px solid var(--f-border)',
              background: 'var(--f-surface)',
              color: activeCountry !== 'all' ? 'var(--f-sky)' : 'var(--f-text-2)',
              cursor: 'pointer',
              outline: 'none',
              minWidth: 160,
            }}
          >
            <option value="all">🌍 Tous les pays</option>
            {countries.map(c => (
              <option key={c.label} value={c.label}>
                {c.flag ? `${c.flag} ` : ''}{c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtres catégorie */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-pill${activeFilter === f ? ' active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonPraticienCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '5rem 0',
          fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-text-3)',
        }}>
          Aucun praticien dans cette catégorie.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem' }}>
            {filtered.slice(0, visible).map((p, i) => {
              const cats: string[] = (p as any).categories ?? (p.category ? [p.category] : []);
              const primaryCat = cats[0] || 'autre';
              const catColor = CAT_COLORS[primaryCat] || 'var(--f-text-3)';
              const { flag, name: countryName } = getCountryDisplay(p.country);
              const countryDisplay = flag || countryName || p.country;

              return (
                <Link key={p.slug} href={`/praticiens/${p.slug}`} className="f-card-link"
                  style={{ animation: `cardReveal 0.45s cubic-bezier(.4,0,.2,1) ${Math.min(i, 11) * 45}ms both`, display: 'flex', height: '100%' }}
                >
                  <article
                    className="f-card f-card-hover praticien-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      padding: '1.5rem',
                      position: 'relative',
                      overflow: 'hidden',
                      willChange: 'transform',
                      flex: 1,
                    }}
                    onMouseMove={e => {
                      if (window.matchMedia('(hover: none)').matches) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - r.left) / r.width - 0.5;
                      const y = (e.clientY - r.top) / r.height - 0.5;
                      e.currentTarget.style.transition = 'transform 0.08s linear, box-shadow 0.2s';
                      e.currentTarget.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) scale3d(1.02,1.02,1.02)`;
                    }}
                    onMouseLeave={e => {
                      if (window.matchMedia('(hover: none)').matches) return;
                      e.currentTarget.style.transition = 'transform 0.55s cubic-bezier(.4,0,.2,1), box-shadow 0.2s';
                      e.currentTarget.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
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

                    {/* Header : avatar + nom + pays */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
                        <Avatar name={p.name} photoUrl={p.photo_url} size={48} radius={10} fontSize=".75rem" />
                        <div>
                          <p style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--f-text-1)',
                            margin: 0,
                            letterSpacing: '-.01em',
                            lineHeight: 1.2,
                          }}>{p.name}</p>
                          <p style={{
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: '.67rem',
                            color: catColor,
                            margin: '.2rem 0 0 0',
                            lineHeight: 1.3,
                            opacity: .9,
                          }}>{p.role}</p>
                        </div>
                      </div>
                      <span title={countryName || p.country} style={{
                        fontSize: flag ? '1.15rem' : '.7rem',
                        flexShrink: 0,
                        fontFamily: flag ? 'inherit' : "'Geist Mono', monospace",
                        color: flag ? 'inherit' : 'var(--f-text-3)',
                        marginTop: '.1rem',
                      }}>
                        {countryDisplay}
                      </span>
                    </div>

                    {/* Badges */}
                    {p.badges?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                        {p.badges.map(b => {
                          const c = BADGE_STYLES[b] || { color: 'var(--f-text-3)', border: 'var(--f-border)', bg: 'var(--f-surface)' };
                          return (
                            <span key={b} style={{
                              fontFamily: "'Geist Mono', monospace",
                              fontSize: '.56rem',
                              letterSpacing: '.1em',
                              color: c.color,
                              border: `1px solid ${c.border}`,
                              background: c.bg,
                              padding: '2px 9px',
                              borderRadius: 99,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                            }}>{b}</span>
                          );
                        })}
                      </div>
                    )}

                    {/* Bio */}
                    {p.bio && (
                      <p style={{
                        fontSize: '.83rem',
                        color: 'var(--f-text-2)',
                        lineHeight: 1.75,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>{p.bio}</p>
                    )}

                    {/* Spacer — pousse stack + footer vers le bas */}
                    <div style={{ flex: 1 }} />

                    {/* Stack */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                      {p.stack.slice(0, 5).map(s => (
                        <span key={s} className="f-tag">{s}</span>
                      ))}
                      {p.stack.length > 5 && (
                        <span className="f-tag" style={{ color: 'var(--f-text-3)' }}>+{p.stack.length - 5}</span>
                      )}
                    </div>

                    {/* Footer catégorie */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '.75rem',
                      borderTop: '1px solid var(--f-border)',
                      marginTop: '.25rem',
                    }}>
                      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        {cats.slice(0, 3).map(cat => (
                          <span key={cat} style={{
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: '.56rem',
                            letterSpacing: '.08em',
                            textTransform: 'uppercase',
                            color: CAT_COLORS[cat] || 'var(--f-text-3)',
                            opacity: .8,
                          }}>{cat}</span>
                        ))}
                        {cats.length > 3 && (
                          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.56rem', color: 'var(--f-text-3)' }}>+{cats.length - 3}</span>
                        )}
                      </div>
                      <span style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.62rem',
                        color: catColor,
                        opacity: .7,
                        letterSpacing: '.04em',
                      }}>voir →</span>
                    </div>
                  </article>
                </Link>
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
            {Math.min(visible, filtered.length)} / {filtered.length} praticiens
          </p>
        </>
      )}
    </div>
  );
}
