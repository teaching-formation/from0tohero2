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

const TYPE_COLOR: Record<string, string> = {
  tip:     'var(--f-orange)',
  TIL:     'var(--f-sky)',
  snippet: 'var(--f-green)',
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
    <div style={{ padding: '4.5rem 6vw', maxWidth: 820, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>// tips & TIL</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 .75rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          Ce que les praticiens apprennent
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: '0 0 2rem 0', lineHeight: 1.7 }}>
          Tips, TIL (Today I Learned) et snippets partagés par la communauté.
        </p>

        {/* Search */}
        <input
          className="f-input"
          type="search"
          placeholder="Rechercher un tip, un auteur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '100%', marginBottom: '1.25rem' }}
        />

        {/* Type filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
          {['all', 'tip', 'TIL', 'snippet'].map(t => (
            <button key={t} className={`filter-pill${activeType === t ? ' active' : ''}`} onClick={() => setActiveType(t)}>
              {t === 'all' ? 'Tous types' : t}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1.25rem' }}>
          {['all', 'data', 'devops', 'cloud', 'ia', 'cyber', 'frontend', 'backend', 'fullstack', 'mobile', 'web3', 'embedded', 'autre'].map(c => (
            <button key={c} className={`filter-pill${activeCat === c ? ' active' : ''}`} onClick={() => setActiveCat(c)}>
              {c === 'all' ? 'Toutes catégories' : CAT_LABEL[c] || c}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Du</label>
            <input className="f-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ maxWidth: 165 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Au</label>
            <input className="f-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ maxWidth: 165 }} />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '4px 12px', borderRadius: 99, background: 'transparent', cursor: 'pointer' }}
            >
              ✕ effacer
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
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
            {filtered.slice(0, visible).map(tip => (
              <div key={tip.id} className="f-card" style={{ padding: '1.1rem 1.35rem' }}>
                {/* Header : badges + date/heure */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '.65rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.58rem',
                      letterSpacing: '.08em',
                      color: TYPE_COLOR[tip.type] ?? 'var(--f-text-3)',
                      border: `1px solid ${TYPE_COLOR[tip.type] ?? 'var(--f-border)'}`,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>{tip.type}</span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 8px', borderRadius: 4 }}>
                      {CAT_LABEL[tip.category] || tip.category}
                    </span>
                    {tip.stack?.slice(0, 3).map(s => (
                      <span key={s} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 8px', borderRadius: 4 }}>{s}</span>
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
            ))}
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
