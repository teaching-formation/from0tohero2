import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Stats · from0tohero',
  description: 'Chiffres clés de la communauté from0tohero : praticiens par pays, top stacks, top catégories.',
};

export default async function StatsPage() {
  const supabase = await createClient();

  const [
    { count: nbPraticiens },
    { count: nbRealisations },
    { count: nbArticles },
    { count: nbTips },
    { data: praticienRows },
    { data: realisationRows },
    { data: articleRows },
  ] = await Promise.all([
    supabase.from('praticiens').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('tips').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('praticiens').select('country, stack').eq('status', 'approved'),
    supabase.from('realisations').select('category, type, stack').eq('status', 'approved'),
    supabase.from('articles').select('category').eq('status', 'approved'),
  ]);

  // Top pays
  const countryCounts: Record<string, number> = {};
  for (const p of praticienRows ?? []) {
    if (p.country) countryCounts[p.country] = (countryCounts[p.country] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Top stacks (praticiens)
  const stackCounts: Record<string, number> = {};
  for (const p of praticienRows ?? []) {
    for (const s of (p.stack ?? []) as string[]) {
      stackCounts[s] = (stackCounts[s] ?? 0) + 1;
    }
  }
  const topStacks = Object.entries(stackCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

  // Top catégories réalisations
  const realCatCounts: Record<string, number> = {};
  for (const r of realisationRows ?? []) {
    if (r.category) realCatCounts[r.category] = (realCatCounts[r.category] ?? 0) + 1;
  }
  const topRealCats = Object.entries(realCatCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Top catégories articles
  const artCatCounts: Record<string, number> = {};
  for (const a of articleRows ?? []) {
    if (a.category) artCatCounts[a.category] = (artCatCounts[a.category] ?? 0) + 1;
  }
  const topArtCats = Object.entries(artCatCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const CAT_LABEL: Record<string, string> = {
    data: 'Data', devops: 'DevOps', cloud: 'Cloud', ia: 'IA', cyber: 'Cybersécurité',
    frontend: 'Frontend', backend: 'Backend', fullstack: 'Full-Stack', mobile: 'Mobile',
    web3: 'Web3', embedded: 'Embedded', dev: 'Dev', autre: 'Autre',
  };

  const stats = [
    { label: 'Praticiens', value: nbPraticiens ?? 0, color: 'var(--f-sky)' },
    { label: 'Réalisations', value: nbRealisations ?? 0, color: 'var(--f-green)' },
    { label: 'Articles', value: nbArticles ?? 0, color: 'var(--f-orange)' },
    { label: 'Tips', value: nbTips ?? 0, color: '#a78bfa' },
  ];

  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>// statistiques</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800, color: 'var(--f-text-1)',
          margin: '.4rem 0 .6rem', letterSpacing: '-.03em', lineHeight: 1.1,
        }}>
          La communauté en chiffres
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: 0, lineHeight: 1.7 }}>
          Données en temps réel sur les praticiens tech et leurs contributions.
        </p>
      </div>

      {/* Chiffres clés */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {stats.map(s => (
          <div key={s.label} className="f-card" style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: s.color, margin: '0 0 .25rem', lineHeight: 1 }}>
              {s.value.toLocaleString('fr-FR')}
            </p>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: 0 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>

        {/* Top pays */}
        <div className="f-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 1.25rem' }}>
            // praticiens par pays
          </p>
          {topCountries.map(([country, count]) => {
            const pct = Math.round((count / (nbPraticiens || 1)) * 100);
            return (
              <div key={country} style={{ marginBottom: '.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-2)', textTransform: 'capitalize' }}>{country}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)' }}>{count} · {pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--f-border)', borderRadius: 99 }}>
                  <div style={{ height: 4, width: `${pct}%`, background: 'var(--f-sky)', borderRadius: 99, transition: 'width .3s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top stacks */}
        <div className="f-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 1.25rem' }}>
            // top technologies (praticiens)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {topStacks.map(([tech, count]) => (
              <span key={tech} style={{
                fontFamily: "'Geist Mono', monospace", fontSize: '.68rem',
                color: 'var(--f-sky)', background: 'rgba(56,189,248,.1)',
                border: '1px solid rgba(56,189,248,.25)',
                padding: '4px 10px', borderRadius: 99,
              }}>
                {tech} <span style={{ opacity: .6 }}>·{count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Top catégories réalisations */}
        <div className="f-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 1.25rem' }}>
            // catégories réalisations
          </p>
          {topRealCats.map(([cat, count]) => {
            const pct = Math.round((count / (nbRealisations || 1)) * 100);
            return (
              <div key={cat} style={{ marginBottom: '.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-2)' }}>{CAT_LABEL[cat] || cat}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)' }}>{count} · {pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--f-border)', borderRadius: 99 }}>
                  <div style={{ height: 4, width: `${pct}%`, background: 'var(--f-green)', borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top catégories articles */}
        <div className="f-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 1.25rem' }}>
            // catégories articles
          </p>
          {topArtCats.map(([cat, count]) => {
            const pct = Math.round((count / (nbArticles || 1)) * 100);
            return (
              <div key={cat} style={{ marginBottom: '.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-2)' }}>{CAT_LABEL[cat] || cat}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)' }}>{count} · {pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--f-border)', borderRadius: 99 }}>
                  <div style={{ height: 4, width: `${pct}%`, background: 'var(--f-orange)', borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
