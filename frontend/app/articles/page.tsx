'use client';
import { useState, useEffect } from 'react';
import { supabase, type Article } from '@/lib/supabase';
import { SkeletonArticleCard } from '@/components/SkeletonCard';

const PAGE_SIZE = 12;

const CAT_COLORS: Record<string,{color:string,border:string,bg:string}> = {
  data:   { color:'#60a5fa', border:'rgba(96,165,250,.25)',  bg:'rgba(96,165,250,.08)' },
  devops: { color:'#34d399', border:'rgba(52,211,153,.25)',  bg:'rgba(52,211,153,.08)' },
  cloud:  { color:'#a78bfa', border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.08)' },
  ia:     { color:'var(--f-orange)', border:'rgba(249,115,22,.25)', bg:'rgba(249,115,22,.08)' },
  cyber:  { color:'#fb7185', border:'rgba(251,113,133,.25)', bg:'rgba(251,113,133,.08)' },
  dev:    { color:'#f472b6', border:'rgba(244,114,182,.25)', bg:'rgba(244,114,182,.08)' },
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => { setVisible(PAGE_SIZE); }, [activeFilter]);

  useEffect(() => {
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setArticles(data ?? []); setLoading(false); });
  }, []);

  const filtered = activeFilter === 'all' ? articles : articles.filter(a => a.category === activeFilter);

  return (
    <div style={{ padding: '4rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="f-label" style={{ marginBottom: '.5rem' }}>// articles</span>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.9rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 .6rem 0' }}>Ce que les praticiens écrivent</h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: '0 0 2rem 0' }}>Articles publiés sur Medium, LinkedIn, Dev.to — agrégés ici.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {['all','data','devops','cloud','ia','cyber','dev'].map(f => (
            <button key={f} className={`filter-pill${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f === 'all' ? 'Tous' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonArticleCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--f-text-3)', fontFamily: "'Space Mono', monospace", fontSize: '.85rem', marginTop: '2rem' }}>Aucun article dans cette catégorie pour le moment.</p>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {filtered.slice(0, visible).map(a => {
            const c = CAT_COLORS[a.category] || CAT_COLORS.data;
            return (
              <a key={a.slug} href={a.external_url} target="_blank" rel="noreferrer" className="f-card-link">
                <div className="f-card f-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', height: '100%' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: c.color, border: `1px solid ${c.border}`, background: c.bg, padding: '2px 9px', borderRadius: 4, width: 'fit-content' }}>{a.category.toUpperCase()}</span>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '.98rem', fontWeight: 700, color: 'var(--f-text-1)', margin: 0, flex: 1 }}>{a.title}</h3>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-3)', margin: 0 }}>{a.author} {a.author_country} · {a.source} · {a.date_published}</p>
                  <p style={{ fontSize: '.83rem', color: 'var(--f-text-2)', lineHeight: 1.65, margin: 0 }}>{a.excerpt}</p>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.7rem', color: 'var(--f-sky)' }}>Lire →</span>
                </div>
              </a>
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
