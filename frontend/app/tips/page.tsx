'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

type Tip = {
  id: string;
  content: string;
  type: string;
  category: string;
  stack: string[];
  created_at: string;
  praticiens: { slug: string; name: string } | null;
};

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tip:     { label: 'Tip',     color: 'var(--f-orange)', bg: 'rgba(251,146,60,.12)',  icon: '💡' },
  TIL:     { label: 'TIL',     color: 'var(--f-sky)',    bg: 'rgba(56,189,248,.12)',  icon: '🧠' },
  snippet: { label: 'Snippet', color: 'var(--f-green)',  bg: 'rgba(52,211,153,.12)',  icon: '</>' },
};

const CAT_LABEL: Record<string, string> = {
  data: 'Data', devops: 'DevOps', cloud: 'Cloud', ia: 'IA',
  cyber: 'Cyber', frontend: 'Frontend', backend: 'Backend',
  fullstack: 'Full-Stack', mobile: 'Mobile', web3: 'Web3',
  embedded: 'Embedded', autre: 'Autre',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function TipsPage() {
  const [tips, setTips]         = useState<Tip[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [activeCat, setActiveCat]   = useState('all');
  const [search, setSearch]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [visible, setVisible]       = useState(PAGE_SIZE);

  const hasFilters = activeType !== 'all' || activeCat !== 'all' || search || dateFrom || dateTo;

  function resetAll() {
    setActiveType('all');
    setActiveCat('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
  }

  useEffect(() => { setVisible(PAGE_SIZE); }, [activeType, activeCat, search, dateFrom, dateTo]);

  useEffect(() => {
    supabase
      .from('tips')
      .select('id, content, type, category, stack, created_at, praticiens(slug, name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTips((data as unknown as Tip[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = tips.filter(t => {
    if (activeType !== 'all' && t.type !== activeType) return false;
    if (activeCat !== 'all' && t.category !== activeCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.content.toLowerCase().includes(q) && !(t.praticiens?.name || '').toLowerCase().includes(q) && !(t.praticiens?.slug || '').toLowerCase().includes(q)) return false;
    }
    if (dateFrom && t.created_at < dateFrom) return false;
    if (dateTo && t.created_at > dateTo + 'T23:59:59') return false;
    return true;
  });

  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>// tips & TIL</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 .6rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          Ce que les praticiens apprennent
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: 0, lineHeight: 1.7 }}>
          Tips, TIL (Today I Learned) et snippets partagés par la communauté.
        </p>
      </div>

      {/* ── Bloc filtres ── */}
      <div style={{
        background: 'var(--f-surface)',
        border: '1px solid var(--f-border)',
        borderRadius: 14,
        padding: '1.25rem 1.35rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>

        {/* Barre de recherche */}
        <input
          className="f-input"
          type="search"
          placeholder="🔍  Rechercher un tip, un auteur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '100%' }}
        />

        {/* Type */}
        <div>
          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.55rem' }}>
            Type
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem' }}>
            <button
              onClick={() => setActiveType('all')}
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.7rem',
                padding: '5px 14px',
                borderRadius: 99,
                border: activeType === 'all' ? '1.5px solid var(--f-text-1)' : '1.5px solid var(--f-border)',
                background: activeType === 'all' ? 'var(--f-text-1)' : 'transparent',
                color: activeType === 'all' ? 'var(--f-bg)' : 'var(--f-text-3)',
                cursor: 'pointer',
                transition: 'all .15s',
                fontWeight: activeType === 'all' ? 700 : 400,
              }}
            >
              Tous
            </button>
            {Object.entries(TYPE_META).map(([key, meta]) => {
              const isActive = activeType === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveType(key)}
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '.7rem',
                    padding: '5px 14px',
                    borderRadius: 99,
                    border: `1.5px solid ${isActive ? meta.color : 'var(--f-border)'}`,
                    background: isActive ? meta.bg : 'transparent',
                    color: isActive ? meta.color : 'var(--f-text-3)',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    fontWeight: isActive ? 700 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ fontSize: '.7rem' }}>{meta.icon}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Catégorie — scroll horizontal sur mobile */}
        <div>
          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '.55rem' }}>
            Catégorie
          </div>
          <div style={{ display: 'flex', gap: '.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {['all', 'data', 'devops', 'cloud', 'ia', 'cyber', 'frontend', 'backend', 'fullstack', 'mobile', 'web3', 'embedded', 'autre'].map(c => {
              const isActive = activeCat === c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '.68rem',
                    padding: '4px 13px',
                    borderRadius: 99,
                    border: `1.5px solid ${isActive ? 'var(--f-text-2)' : 'var(--f-border)'}`,
                    background: isActive ? 'var(--f-text-1)' : 'transparent',
                    color: isActive ? 'var(--f-bg)' : 'var(--f-text-3)',
                    cursor: 'pointer',
                    transition: 'all .15s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {c === 'all' ? 'Toutes' : CAT_LABEL[c] || c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dates + reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', letterSpacing: '.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Période
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)' }}>du</span>
            <input className="f-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: 160, padding: '5px 10px', fontSize: '.75rem' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)' }}>au</span>
            <input className="f-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: 160, padding: '5px 10px', fontSize: '.75rem' }} />
          </div>

          {/* Spacer + résultats + reset */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
            {!loading && (
              <span style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.65rem',
                color: 'var(--f-text-3)',
                background: 'var(--f-border)',
                padding: '3px 10px',
                borderRadius: 99,
              }}>
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
            {hasFilters && (
              <button
                onClick={resetAll}
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.65rem',
                  color: 'var(--f-text-3)',
                  border: '1px solid var(--f-border)',
                  padding: '4px 12px',
                  borderRadius: 99,
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                ✕ reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="f-card skeleton" style={{ height: 120 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-text-3)' }}>
          Aucun tip pour ces filtres.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {filtered.slice(0, visible).map(tip => {
              const meta = TYPE_META[tip.type];
              return (
                <div key={tip.id} className="f-card" style={{ padding: '1.1rem 1.35rem', borderLeft: meta ? `3px solid ${meta.color}` : undefined }}>
                  {/* Header : badges + date/heure */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '.65rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {meta && (
                        <span style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '.6rem',
                          letterSpacing: '.06em',
                          color: meta.color,
                          background: meta.bg,
                          border: `1px solid ${meta.color}`,
                          padding: '2px 9px',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}>
                          {meta.icon} {tip.type}
                        </span>
                      )}
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 9px', borderRadius: 4 }}>
                        {CAT_LABEL[tip.category] || tip.category}
                      </span>
                      {tip.stack?.slice(0, 3).map(s => (
                        <span key={s} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 9px', borderRadius: 4 }}>{s}</span>
                      ))}
                    </div>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {fmtDate(tip.created_at)} · {fmtTime(tip.created_at)}
                    </span>
                  </div>

                  {/* Contenu */}
                  <p style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '.8rem',
                    color: 'var(--f-text-1)',
                    margin: '0 0 .85rem 0',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {tip.content}
                  </p>

                  {/* Auteur */}
                  {tip.praticiens && (
                    <Link href={`/praticiens/${tip.praticiens.slug}`} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', textDecoration: 'none' }}>
                      par <span style={{ color: 'var(--f-sky)' }}>@{tip.praticiens.slug}</span> · {tip.praticiens.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="btn-f btn-f-secondary" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                Charger plus ({filtered.length - visible} restants) →
              </button>
            </div>
          )}

          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: 'var(--f-text-3)', textAlign: 'center', marginTop: '1rem', letterSpacing: '.06em' }}>
            {Math.min(visible, filtered.length)} / {filtered.length} tips
          </p>
        </>
      )}
    </div>
  );
}
