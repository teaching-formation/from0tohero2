'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, type Praticien } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import { SkeletonPraticienCard } from '@/components/SkeletonCard';
import { getCountryDisplay } from '@/lib/countryFlag';
import { BADGE_STYLES } from '@/lib/badges';

const PAGE_SIZE = 12;

const FILTERS = ['all','data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const FILTER_LABELS: Record<string,string> = { all:'Tous', data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cybersécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };

export default function PraticiensPage() {
  const [praticiens, setPraticiens] = useState<Praticien[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Reset pagination quand filtre ou recherche change
  useEffect(() => { setVisible(PAGE_SIZE); }, [activeFilter, activeCountry, search]);

  useEffect(() => {
    supabase
      .from('praticiens')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPraticiens(data ?? []); setLoading(false); });
  }, []);

  // Liste des pays présents, triés par nom normalisé
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
      return p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || (p.city ?? '').toLowerCase().includes(q) || p.stack.join(' ').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ padding: '4rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="f-label" style={{ marginBottom: '.5rem' }}>// praticiens</span>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.9rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 .6rem 0' }}>Les gens qui construisent</h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: '0 0 2rem 0' }}>Profils de praticiens tech — Data, DevOps, Cloud, IA, Cybersécurité, Frontend, Backend, Mobile, Web3 et plus.</p>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <input
            className="f-input"
            type="text"
            placeholder="Rechercher par nom, rôle, ville, stack…"
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {FILTERS.map(f => (
            <button key={f} className={`filter-pill${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{FILTER_LABELS[f]}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonPraticienCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--f-text-3)', fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', marginTop: '2rem' }}>Aucun praticien dans cette catégorie.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '1.25rem' }}>
            {filtered.slice(0, visible).map(p => (
              <Link key={p.slug} href={`/praticiens/${p.slug}`} className="f-card-link">
                <div className="f-card f-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                      <Avatar name={p.name} photoUrl={p.photo_url} size={52} radius={10} fontSize=".78rem" />
                      <div>
                        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '.98rem', fontWeight: 700, color: 'var(--f-text-1)', margin: 0 }}>{p.name}</p>
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-sky)', margin: '.15rem 0 0 0' }}>{p.role}</p>
                      </div>
                    </div>
                    {(() => { const { flag, name } = getCountryDisplay(p.country); const display = flag || name || p.country; return (
                      <span title={name || p.country} style={{ fontSize: flag ? '1.1rem' : '.72rem', flexShrink: 0, fontFamily: flag ? 'inherit' : "'Geist Mono', monospace", color: flag ? 'inherit' : 'var(--f-text-3)' }}>
                        {display}
                      </span>
                    ); })()}
                  </div>

                  {p.badges?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                      {p.badges.map(b => {
                        const c = BADGE_STYLES[b] || { color: 'var(--f-text-3)', border: 'var(--f-border)', bg: 'var(--f-surface)' };
                        return <span key={b} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.08em', color: c.color, border: `1px solid ${c.border}`, background: c.bg, padding: '2px 8px', borderRadius: 4 }}>{b}</span>;
                      })}
                    </div>
                  )}

                  <p style={{ fontSize: '.83rem', color: 'var(--f-text-2)', lineHeight: 1.7, margin: 0 }}>{p.bio}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                    {p.stack.slice(0, 6).map(s => <span key={s} className="f-tag">{s}</span>)}
                    {p.stack.length > 6 && <span className="f-tag">+{p.stack.length - 6}</span>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)' }}>{p.city}</span>
                    {p.open_to_work
                      ? <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-green)', display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}><span style={{ width: 6, height: 6, background: 'var(--f-green)', borderRadius: '50%', display: 'inline-block' }}></span>disponible</span>
                      : <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-border-2)' }}>○ non dispo</span>
                    }
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button className="btn-f btn-f-secondary" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                Charger plus ({filtered.length - visible} restants) →
              </button>
            </div>
          )}
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', textAlign: 'center', marginTop: '1rem' }}>
            {Math.min(visible, filtered.length)} / {filtered.length} praticiens
          </p>
        </>
      )}
    </div>
  );
}

