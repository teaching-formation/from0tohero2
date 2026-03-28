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

const TYPE_LABELS: Record<string,string> = { pipeline:'Pipeline', dashboard:'Dashboard', api:'API', bootcamp:'Bootcamp', youtube:'YouTube', app:'App', cours:'Cours', podcast:'Podcast', newsletter:'Newsletter', blog:'Blog', autre:'Autre' };
const CAT_COLORS: Record<string,{color:string,bg:string,border:string}> = {
  data:   { color:'#60a5fa', bg:'#60a5fa0d', border:'#60a5fa22' },
  devops: { color:'#34d399', bg:'#34d3990d', border:'#34d39922' },
  cloud:  { color:'#a78bfa', bg:'#a78bfa0d', border:'#a78bfa22' },
  ia:     { color:'#f97316', bg:'#f973160d', border:'#f9731622' },
  cyber:  { color:'#ff4560', bg:'#ff45600d', border:'#ff456022' },
  mlops:  { color:'#fb923c', bg:'#fb923c0d', border:'#fb923c22' },
  dev:    { color:'#f472b6', bg:'#f472b60d', border:'#f472b622' },
  autre:  { color:'#475569', bg:'#4755690d', border:'#47556922' },
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
      .then(({ data }) => { setRealisations((data as RealisationWithPraticien[]) ?? []); setLoading(false); });
  }, []);

  const filtered = realisations.filter(r => {
    if (activeType !== 'all' && r.type !== activeType) return false;
    if (activeCat !== 'all' && r.category !== activeCat) return false;
    return true;
  });

  return (
    <div style={{ padding: '3rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="f-label" style={{ marginBottom: '0.5rem' }}>// réalisations</span>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '0 0 0.5rem 0' }}>Ce que les praticiens construisent</h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '0.9rem', margin: '0 0 2rem 0' }}>Pipelines, dashboards, APIs, bootcamps, chaînes YT — du concret.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
          {['all','pipeline','dashboard','api','bootcamp','youtube','app','cours','autre'].map(t => (
            <button key={t} className={`filter-pill${activeType === t ? ' active' : ''}`} onClick={() => setActiveType(t)}>
              {t === 'all' ? 'Tous' : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {['all','data','devops','cloud','ia','cyber','mlops','dev','autre'].map(c => (
            <button key={c} className={`filter-pill${activeCat === c ? ' active' : ''}`} onClick={() => setActiveCat(c)}>
              {c === 'all' ? 'Toutes catégories' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonArticleCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--f-text-3)', fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', marginTop: '2rem' }}>Aucune réalisation pour ces filtres.</p>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {filtered.slice(0, visible).map(r => {
            const c = CAT_COLORS[r.category] || CAT_COLORS.data;
            return (
              <div key={r.slug} style={{ background: 'var(--f-card)', border: '1px solid var(--f-border)', borderRadius: 6, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'border-color 0.2s', cursor: 'default' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--f-sky)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--f-border)')}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: c.color, border: `1px solid ${c.border}`, background: c.bg, padding: '2px 8px', borderRadius: 2 }}>{r.category.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 8px', borderRadius: 2 }}>{TYPE_LABELS[r.type] || r.type}</span>
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: 0 }}>{r.title}</h3>
                {r.praticiens && (
                  <Link href={`/praticiens/${r.praticiens.slug}`} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: 'var(--f-sky)', textDecoration: 'none' }}>
                    {r.praticiens.name}
                  </Link>
                )}
                <p style={{ fontSize: '0.85rem', color: 'var(--f-text-2)', lineHeight: 1.6, margin: 0, flex: 1 }}>{r.excerpt}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {r.stack.map(s => <span key={s} className="f-tag">{s}</span>)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                  {r.demo_url && <a href={r.demo_url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '3px 10px', borderRadius: 2, textDecoration: 'none' }}>Demo →</a>}
                  {r.repo_url && <a href={r.repo_url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '3px 10px', borderRadius: 2, textDecoration: 'none' }}>Repo →</a>}
                </div>
              </div>
            );
          })}
        </div>
        {visible < filtered.length && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="btn-f btn-f-secondary" onClick={() => setVisible(v => v + PAGE_SIZE)}>
              Charger plus ({filtered.length - visible} restants) →
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
