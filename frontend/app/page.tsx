import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'from0tohero.dev — Ce qu\'ils ont construit. Pas ce qu\'ils ont promis.',
  description: 'Articles, réalisations et profils de praticiens tech francophones — Data, DevOps, Cloud, IA, Cybersécurité, Dev.',
  openGraph: {
    title: 'from0tohero.dev — Ce qu\'ils ont construit. Pas ce qu\'ils ont promis.',
    description: 'Articles, réalisations et profils de praticiens tech francophones.',
    url: 'https://from0tohero.dev',
    images: [{ url: 'https://from0tohero.dev/og-banner.png' }],
  },
};

async function getYoutubeChannels() {
  const { data } = await supabase
    .from('chaines_youtube')
    .select('name, description, url, subs')
    .eq('active', true)
    .order('ordre', { ascending: true });
  return data ?? [];
}

async function getStats() {
  const [p, r, e, a] = await Promise.all([
    supabase.from('praticiens').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('realisations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('evenements').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);
  return {
    praticiens:   p.count ?? 0,
    realisations: r.count ?? 0,
    evenements:   e.count ?? 0,
    articles:     a.count ?? 0,
  };
}

async function getLastArticles() {
  const { data } = await supabase
    .from('articles')
    .select('slug, title, author, author_country, category, source, external_url, excerpt, date_published')
    .eq('status', 'approved')
    .order('date_published', { ascending: false })
    .limit(3);
  return data ?? [];
}

export default async function Home() {
  const [stats, lastArticles, youtubeChannels] = await Promise.all([getStats(), getLastArticles(), getYoutubeChannels()]);

  return (
    <>
      {/* HERO */}
      <section className="hero-dot-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6vw', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <span className="badge-live"><span className="dot"></span>from0tohero.dev</span>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.4rem,6vw,5.5rem)', fontWeight: 800, lineHeight: 1.08, color: 'var(--f-text-1)', margin: '0 0 1.5rem 0' }}>
          Ce qu'ils ont <span style={{ color: 'var(--f-sky)' }}>construit.</span><br />
          Pas ce qu'ils ont <span style={{ color: 'var(--f-orange)' }}>promis.</span>
        </h1>
        <p style={{ fontSize: '1.08rem', color: 'var(--f-text-2)', maxWidth: 480, lineHeight: 1.9, marginBottom: '3rem' }}>
          Articles, réalisations et profils de praticiens tech —<br />
          Data, DevOps, Cloud, IA, Cybersécurité, Dev.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/praticiens" className="btn-f btn-f-primary">Voir les praticiens →</Link>
          <Link href="/soumettre" className="btn-f btn-f-secondary">Soumettre mon profil</Link>
        </div>
      </section>

      <hr className="f-hr" />

      {/* STATS */}
      <section style={{ padding: '3.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem' }}>
          {[
            [stats.praticiens,   'Praticiens'],
            [stats.realisations, 'Réalisations'],
            [stats.evenements,   'Événements'],
            [stats.articles,     'Articles'],
          ].map(([n, l]) => (
            <div key={String(l)}>
              <p className="stat-num">{n}</p>
              <p className="stat-label">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="f-hr" />

      {/* COMMENT ÇA MARCHE */}
      <section style={{ padding: '5.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
        <span className="f-label" style={{ marginBottom: '.5rem' }}>// comment ça marche</span>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 3rem 0' }}>
          Figurer sur from0tohero.dev en 3 étapes.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem' }}>
          {[
            { num: '01', title: 'Crée ton profil', desc: "Nom, rôle, stack, bio et liens. C'est l'étape fondatrice — elle ancre tout le reste sur la plateforme.", sub: '⏱ ~2 minutes', done: false },
            { num: '02', title: 'Soumets une réalisation, un article ou un événement', desc: "Pipeline, dashboard, API, bootcamp, article Medium ou LinkedIn, conférence, meetup — ce que tu as vraiment construit ou organisé.", sub: 'Optionnel · illimité', done: false },
            { num: '03', title: 'Publication instantanée', desc: "Ton profil, tes réalisations et tes événements apparaissent sur la plateforme. Visibles par des milliers de praticiens et recruteurs.", sub: '✓ Publication instantanée', done: true },
          ].map(s => (
            <div key={s.num} className="f-card" style={{ cursor: 'default' }}>
              <div className={`step-num${s.done ? ' done' : ''}`}>{s.num}</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .6rem 0' }}>{s.title}</h3>
              <p style={{ fontSize: '.85rem', color: 'var(--f-text-2)', lineHeight: 1.75, margin: '0 0 1.25rem 0' }}>{s.desc}</p>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: s.done ? 'var(--f-green)' : 'var(--f-text-3)' }}>{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      <hr className="f-hr" />

      {/* RESSOURCES */}
      <section style={{ padding: '5.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
        <span className="f-label" style={{ marginBottom: '.5rem' }}>// ressources</span>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 3rem 0' }}>Apprendre par la pratique</h2>

        {/* Bootcamps */}
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '1rem' }}>🎓 Bootcamps</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
          <a href="https://diakite-data.github.io/data-engineering-bootcamp/" className="f-card-link" target="_blank" rel="noreferrer">
            <div className="f-card f-card-hover">
              <span className="badge-live" style={{ marginBottom: '1rem' }}><span className="dot"></span>live</span>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '.5rem 0 .4rem 0' }}>Data Engineering Bootcamp</h3>
              <p style={{ fontSize: '.8rem', color: 'var(--f-text-2)', margin: '0 0 1rem 0', lineHeight: 1.6 }}>Python · Airflow · dbt · Spark · GCP · Kafka</p>
              <div style={{ display: 'flex', gap: '1.25rem', fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', flexWrap: 'wrap' }}>
                <span>35 modules</span><span>1 100+ apprenants</span><span>40+ pays</span>
              </div>
            </div>
          </a>
          <a href="https://da.from0tohero.dev" className="f-card-link" target="_blank" rel="noreferrer">
            <div className="f-card" style={{ opacity: .65 }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', display: 'block', marginBottom: '1rem' }}>○ coming soon</span>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .4rem 0' }}>Data Analyst Bootcamp</h3>
              <p style={{ fontSize: '.8rem', color: 'var(--f-text-2)', margin: '0 0 1rem 0', lineHeight: 1.6 }}>SQL · Python · Power BI · Tableau · Stats</p>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>En construction</span>
            </div>
          </a>
        </div>

        {/* Chaînes YouTube */}
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '1rem' }}>▶ Chaînes YouTube francophones</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {youtubeChannels.map(ch => (
            <a key={ch.name} href={ch.url} className="f-card-link" target="_blank" rel="noreferrer">
              <div className="f-card f-card-hover" style={{ padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.75rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,.12)', color: '#ef4444', fontSize: '.75rem', flexShrink: 0 }}>▶</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.9rem', color: 'var(--f-text-1)' }}>{ch.name}</span>
                </div>
                <p style={{ fontSize: '.78rem', color: 'var(--f-text-2)', lineHeight: 1.55, margin: '0 0 .75rem 0' }}>{ch.description}</p>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)' }}>{ch.subs}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Articles récents */}
        {lastArticles.length > 0 && (
          <>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '1rem' }}>✍ Articles récents</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {lastArticles.map(a => (
                <a key={a.slug} href={a.external_url} className="f-card-link" target="_blank" rel="noreferrer">
                  <div className="f-card f-card-hover" style={{ padding: '1.1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--f-sky)', border: '1px solid var(--f-sky-border)', background: 'var(--f-sky-bg)', padding: '2px 7px', borderRadius: 2 }}>{a.category}</span>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 7px', borderRadius: 2 }}>{a.source}</span>
                    </div>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '.92rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0', lineHeight: 1.35 }}>{a.title}</h3>
                    <p style={{ fontSize: '.78rem', color: 'var(--f-text-2)', lineHeight: 1.55, margin: '0 0 .75rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</p>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)' }}>{a.author} {a.author_country && `· ${a.author_country}`}</span>
                  </div>
                </a>
              ))}
            </div>
            <Link href="/articles" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-sky)', textDecoration: 'none' }}>
              Voir tous les articles →
            </Link>
          </>
        )}
      </section>

      <hr className="f-hr" />

      {/* COMMUNAUTÉ */}
      <section style={{ padding: '5.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
        <div className="community-strip" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 560 }}>
            <span className="f-label" style={{ marginBottom: '.6rem' }}>// la communauté</span>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 .8rem 0', lineHeight: 1.15 }}>
              Une communauté de praticiens tech francophones qui construisent.
            </h2>
            <p style={{ fontSize: '.9rem', color: 'var(--f-text-2)', lineHeight: 1.8, margin: 0 }}>
              Une communauté construite autour de ceux qui font — pas de ceux qui parlent.
            </p>
          </div>
          <Link href="/praticiens" className="btn-f btn-f-primary" style={{ flexShrink: 0 }}>Voir la communauté →</Link>
        </div>
      </section>
    </>
  );
}
