'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, type Praticien, type Realisation } from '@/lib/supabase';
import Avatar from '@/components/Avatar';

export default function PraticienPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [p, setP] = useState<Praticien | null>(null);
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: praticien } = await supabase
        .from('praticiens').select('*').eq('slug', slug).single();
      if (!praticien) { notFound(); return; }
      setP(praticien);
      const { data: reals } = await supabase
        .from('realisations').select('*')
        .eq('praticien_id', praticien.id)
        .eq('status', 'approved');
      setRealisations(reals ?? []);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <div style={{ padding: '4rem 6vw', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ height: 14, width: 80, marginBottom: '2.5rem' }} className="skeleton" />
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          <div className="skeleton" style={{ height: 28, width: '40%' }} />
          <div className="skeleton" style={{ height: 13, width: '25%' }} />
          <div className="skeleton" style={{ height: 13, width: '70%' }} />
          <div className="skeleton" style={{ height: 13, width: '60%' }} />
        </div>
      </div>
    </div>
  );
  if (!p) return null;

  const praticienRealisations = realisations;

  const BADGE_STYLES: Record<string,{color:string,border:string,bg:string}> = {
    'MENTOR':      { color:'var(--f-orange)', border:'rgba(249,115,22,.25)', bg:'rgba(249,115,22,.08)' },
    'SPEAKER':     { color:'#a78bfa',         border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.08)' },
    'OPEN SOURCE': { color:'var(--f-green)',   border:'rgba(52,211,153,.25)', bg:'rgba(52,211,153,.08)' },
  };

  return (
    <div style={{ padding: '3.5rem 6vw', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/praticiens" className="link-back" style={{ marginBottom: '2.5rem', display: 'inline-flex' }}>← Praticiens</Link>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', padding: '2.5rem 0', borderBottom: '1px solid var(--f-border)', flexWrap: 'wrap' }}>
        <Avatar name={p.name} photoUrl={p.photo_url} size={72} radius={14} fontSize="1.1rem" />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.5rem,3.5vw,2rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: 0 }}>{p.name}</h1>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', background: 'var(--f-surface)', padding: '2px 8px', borderRadius: 4 }}>{p.country} {p.city}</span>
          </div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-sky)', margin: '0 0 .9rem 0', letterSpacing: '.04em' }}>{p.role}</p>
          {p.badges?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '1.1rem' }}>
              {p.badges.map(b => {
                const c = BADGE_STYLES[b] || { color: 'var(--f-text-3)', border: 'var(--f-border)', bg: 'var(--f-surface)' };
                return <span key={b} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.08em', color: c.color, border: `1px solid ${c.border}`, background: c.bg, padding: '2px 9px', borderRadius: 4 }}>{b}</span>;
              })}
            </div>
          )}
          <p style={{ fontSize: '.9rem', color: 'var(--f-text-2)', lineHeight: 1.8, maxWidth: 560, margin: '0 0 1.25rem 0' }}>{p.bio}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {p.github_url && (
              <a href={p.github_url} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2c-3.34.73-4.04-1.6-4.04-1.6-.54-1.4-1.33-1.77-1.33-1.77-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.3.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23.95-.27 1.97-.4 2.98-.4 1 0 2.03.13 2.97.4 2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.9 1.23 3.22 0 4.6-2.8 5.63-5.48 5.93.43.37.82 1.1.82 2.22v3.29c0 .32.22.68.83.57C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"/></svg>
                GitHub
              </a>
            )}
            {p.linkedin_url && (
              <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.93v5.68H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 .77 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* COMPÉTENCES */}
      {Array.isArray(p.skills) && p.skills.length > 0 && (
        <div style={{ margin: '3rem 0' }}>
          <span className="f-label" style={{ marginBottom: '1.75rem' }}>// compétences techniques</span>
          {(p.skills as { category?: string; label?: string; items: string[] }[]).map((sec, i) => {
            const title = sec.category ?? sec.label ?? '';
            return (
              <div key={`${title}-${i}`} style={{ marginBottom: '1.75rem' }}>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .75rem 0' }}>{title}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                  {sec.items.map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <hr className="f-hr" style={{ marginBottom: '2.5rem' }} />

      {/* RÉALISATIONS */}
      {praticienRealisations.length > 0 && (
        <div>
          <span className="f-label" style={{ marginBottom: '1.25rem' }}>// réalisations</span>
          <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {praticienRealisations.map(r => {
              const CAT_COLORS: Record<string,{color:string,border:string,bg:string}> = {
                data:   { color:'#60a5fa', border:'rgba(96,165,250,.25)',  bg:'rgba(96,165,250,.08)' },
                devops: { color:'#34d399', border:'rgba(52,211,153,.25)',  bg:'rgba(52,211,153,.08)' },
                cloud:  { color:'#a78bfa', border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.08)' },
                ia:     { color:'#f97316', border:'rgba(249,115,22,.25)',  bg:'rgba(249,115,22,.08)' },
                cyber:  { color:'#fb7185', border:'rgba(251,113,133,.25)', bg:'rgba(251,113,133,.08)' },
                dev:    { color:'#f472b6', border:'rgba(244,114,182,.25)', bg:'rgba(244,114,182,.08)' },
              };
              const cat = CAT_COLORS[r.category] ?? CAT_COLORS.data;
              return (
                <div key={r.slug} className="f-card f-card-hover">
                  <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: cat.color, border: `1px solid ${cat.border}`, background: cat.bg, padding: '2px 9px', borderRadius: 4 }}>{r.category.toUpperCase()}</span>
                    <span className="f-tag">{r.type}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>{r.title}</h3>
                  <p style={{ fontSize: '.85rem', color: 'var(--f-text-2)', lineHeight: 1.7, margin: '0 0 1.1rem 0' }}>{r.excerpt}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '1.1rem' }}>
                    {r.stack.map(s => <span key={s} className="f-tag">{s}</span>)}
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    {r.demo_url && <a href={r.demo_url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-sky)', textDecoration: 'none' }}>Demo →</a>}
                    {r.repo_url && <a href={r.repo_url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', textDecoration: 'none' }}>Repo →</a>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
