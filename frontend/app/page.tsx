import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollReveal from '@/components/ScrollReveal';
import TypeWriter from '@/components/TypeWriter';
import CountUp from '@/components/CountUp';
import HeroParallax from '@/components/HeroParallax';
import Marquee from '@/components/Marquee';

export const revalidate = 60;

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

async function getBootcamps() {
  const { data } = await supabase
    .from('realisations')
    .select('title, stack, excerpt, demo_url, repo_url')
    .eq('type', 'bootcamp')
    .eq('status', 'approved')
    .order('created_at', { ascending: true });
  return data ?? [];
}

async function getYoutubeChannels() {
  const { data } = await supabase
    .from('chaines_youtube')
    .select('name, description, url, subs')
    .eq('status', 'approved')
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

async function getLatestTips() {
  const { data } = await supabase
    .from('tips')
    .select('id, content, type, category, stack, praticien_id, created_at, praticiens(slug, name)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(7);
  return (data ?? []) as unknown as Array<{
    id: string; content: string; type: string; category: string;
    stack: string[]; praticien_id: string; created_at: string;
    praticiens: { slug: string; name: string } | null;
  }>;
}

async function getLastArticles() {
  const { data } = await supabase
    .from('articles')
    .select('slug, title, author, author_country, category, source, external_url, excerpt, date_published')
    .eq('status', 'approved')
    .order('date_published', { ascending: false })
    .limit(8);
  return data ?? [];
}

const STAT_ACCENT = ['--f-sky', '--f-orange', '--f-green', '--f-purple'];

export default async function Home() {
  const [stats, lastArticles, youtubeChannels, bootcamps, latestTips] = await Promise.all([
    getStats(), getLastArticles(), getYoutubeChannels(), getBootcamps(), getLatestTips(),
  ]);

  const statItems = [
    { n: stats.praticiens,   l: 'Praticiens',   icon: '◈' },
    { n: stats.realisations, l: 'Réalisations',  icon: '⬡' },
    { n: stats.articles,     l: 'Articles',      icon: '◧' },
    { n: stats.evenements,   l: 'Événements',    icon: '◎' },
  ];

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero-dot-bg" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 6vw',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orbs décoratifs avec parallax */}
        <HeroParallax />

        {/* Badge live */}
        <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <span className="badge-live"><span className="dot" />&thinsp;from0tohero.dev</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2.6rem, 7vw, 6rem)',
          fontWeight: 800,
          lineHeight: 1.06,
          color: 'var(--f-text-1)',
          margin: '0 0 1.75rem 0',
          letterSpacing: '-.03em',
          position: 'relative', zIndex: 1,
          maxWidth: 820,
        }}>
          Ce qu&apos;ils ont{' '}
          <TypeWriter text="construit." speed={75} startDelay={400} />
          <br />
          Pas ce qu&apos;ils ont{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--f-orange) 0%, #fb923c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>promis.</span>
        </h1>

        {/* Sous-titre */}
        <p style={{
          fontSize: '1.12rem',
          color: 'var(--f-text-2)',
          maxWidth: 500,
          lineHeight: 1.85,
          marginBottom: '3rem',
          position: 'relative', zIndex: 1,
        }}>
          Profils, réalisations et ressources de praticiens tech
          <br />francophones — Data, DevOps, Cloud, IA, Cyber, Dev.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Link href="/praticiens" className="btn-f btn-f-primary">
            Voir les praticiens →
          </Link>
          <Link href="/soumettre" className="btn-f btn-f-secondary">
            Soumettre mon profil
          </Link>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '2.5rem', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem',
          opacity: .35,
        }}>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--f-text-3)' }}>scroll</span>
          <div style={{
            width: 1, height: 36,
            background: 'linear-gradient(to bottom, var(--f-text-3), transparent)',
          }} />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--f-surface)', padding: '4rem 6vw', borderTop: '1px solid var(--f-border)', borderBottom: '1px solid var(--f-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal>
            <div className="stats-strip" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1px',
              background: 'var(--f-border)',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid var(--f-border)',
            }}>
              {statItems.map((s, i) => (
                <div key={s.l} style={{
                  background: 'var(--f-surface)',
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '.6rem',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Accent top bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%',
                    height: 2, borderRadius: '0 0 4px 4px',
                    background: `var(${STAT_ACCENT[i] || '--f-sky'})`,
                    opacity: .8,
                  }} />
                  {/* Icon */}
                  <span style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '1.1rem',
                    color: `var(${STAT_ACCENT[i] || '--f-sky'})`,
                    opacity: .6,
                    lineHeight: 1,
                  }}>{s.icon}</span>
                  {/* Number */}
                  <p style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: `var(${STAT_ACCENT[i] || '--f-sky'})`,
                    margin: 0,
                    letterSpacing: '-.03em',
                  }}><CountUp target={s.n} /></p>
                  {/* Label */}
                  <p style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: '.6rem',
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: 'var(--f-text-3)',
                    margin: 0,
                  }}>{s.l}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────── */}
      <section style={{ padding: '6rem 6vw', maxWidth: 1200, margin: '0 auto', overflow: 'hidden' }}>
        <ScrollReveal>
          <span className="f-label" style={{ marginBottom: '.6rem' }}>// comment ça marche</span>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 800,
            color: 'var(--f-text-1)',
            margin: '.4rem 0 3.5rem 0',
            letterSpacing: '-.025em',
            lineHeight: 1.15,
          }}>
            Figurer sur from0tohero.dev<br />
            <span style={{ color: 'var(--f-text-3)', fontWeight: 700, fontSize: '80%' }}>en 3 étapes.</span>
          </h2>
        </ScrollReveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
          {[
            { num: '01', title: 'Crée ton profil', desc: "Nom, rôle, stack, bio et liens. C'est l'étape fondatrice — elle ancre tout le reste sur la plateforme.", sub: '⏱ ~2 minutes', done: false },
            { num: '02', title: 'Soumets une réalisation, un article ou un événement', desc: "Pipeline, dashboard, API, bootcamp, article Medium ou LinkedIn, conférence, meetup — ce que tu as vraiment construit ou organisé.", sub: 'Optionnel · illimité', done: false },
            { num: '03', title: 'Publication instantanée', desc: "Ton profil, tes réalisations et tes événements apparaissent sur la plateforme. Visibles par des milliers de praticiens et recruteurs.", sub: '✓ Publication instantanée', done: true },
          ].map((s, i) => (
            <ScrollReveal key={s.num} delay={i * 120} style={{ height: '100%' }}>
              <div className="step-card" style={{ height: '100%' }}>
                <div className={`step-num${s.done ? ' done' : ''}`}>{s.num}</div>
                <h3 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  color: 'var(--f-text-1)',
                  margin: '0 0 .75rem 0',
                  letterSpacing: '-.01em',
                  lineHeight: 1.3,
                }}>{s.title}</h3>
                <p style={{
                  fontSize: '.86rem',
                  color: 'var(--f-text-2)',
                  lineHeight: 1.8,
                  margin: '0 0 1.5rem 0',
                }}>{s.desc}</p>
                <span style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.63rem',
                  letterSpacing: '.08em',
                  color: s.done ? 'var(--f-green)' : 'var(--f-text-3)',
                }}>{s.sub}</span>
                {/* Ghost number */}
                <div className="step-num-bg">{s.num}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── RESSOURCES ───────────────────────────────────────────── */}
      <section style={{ background: 'var(--f-surface)', padding: '6rem 6vw', borderTop: '1px solid var(--f-border)', borderBottom: '1px solid var(--f-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal>
          <span className="f-label" style={{ marginBottom: '.6rem' }}>// ressources</span>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 800,
            color: 'var(--f-text-1)',
            margin: '.4rem 0 3.5rem 0',
            letterSpacing: '-.025em',
            lineHeight: 1.15,
          }}>
            Apprendre par la pratique.
          </h2>
        </ScrollReveal>

        {/* Bootcamps */}
        {bootcamps.length > 0 && (
          <>
            <ScrollReveal>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'var(--f-orange)', borderRadius: 2 }} />
                Bootcamps
              </p>
            </ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem', marginBottom: '3.5rem' }}>
              {bootcamps.map((b, i) => {
                const isLive = !!b.demo_url;
                const href   = b.demo_url || b.repo_url || '#';
                const stack  = Array.isArray(b.stack) ? b.stack.join(' · ') : '';
                return (
                  <ScrollReveal key={b.title} delay={i * 80}>
                    <a href={href} className="f-card-link" target="_blank" rel="noreferrer" style={{ display: 'block', height: '100%' }}>
                      <div className={`f-card f-card-hover${isLive ? '' : ''}`} style={{ height: '100%', opacity: isLive ? 1 : .65 }}>
                        {isLive
                          ? <span className="badge-live" style={{ marginBottom: '1.25rem' }}><span className="dot" />live</span>
                          : <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--f-text-3)', display: 'block', marginBottom: '1.25rem' }}>○ coming soon</span>
                        }
                        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 800, color: 'var(--f-text-1)', margin: '0 0 .5rem 0', letterSpacing: '-.01em' }}>{b.title}</h3>
                        {stack && <p style={{ fontSize: '.8rem', color: 'var(--f-text-2)', margin: '0 0 1rem 0', lineHeight: 1.6 }}>{stack}</p>}
                        {b.excerpt && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', lineHeight: 1.6 }}>{b.excerpt}</span>}
                      </div>
                    </a>
                  </ScrollReveal>
                );
              })}
            </div>
          </>
        )}

        {/* Chaînes YouTube */}
        <ScrollReveal>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span style={{ display: 'inline-block', width: 18, height: 1.5, background: '#ef4444', borderRadius: 2 }} />
            Chaînes YouTube francophones
          </p>
        </ScrollReveal>
        <div style={{ marginBottom: '3.5rem' }}>
          <Marquee speed={28} gap={14} itemWidth={230} itemHeight={150}>
            {youtubeChannels.map((ch) => (
              <a key={ch.name} href={ch.url} className="f-card-link" target="_blank" rel="noreferrer" style={{ display: 'flex', height: '100%' }}>
                <div className="f-card f-card-hover" style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.7rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'rgba(239,68,68,.12)', color: '#ef4444', fontSize: '.7rem', flexShrink: 0,
                    }}>▶</span>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '.85rem', color: 'var(--f-text-1)', letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</span>
                  </div>
                  <p style={{ fontSize: '.75rem', color: 'var(--f-text-2)', lineHeight: 1.6, margin: '0 0 .7rem 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ch.description}</p>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', marginTop: 'auto' }}>{ch.subs}</span>
                </div>
              </a>
            ))}
          </Marquee>
        </div>

        {/* Tips & TIL */}
        {latestTips.length > 0 && (
          <>
            <ScrollReveal>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'var(--f-orange)', borderRadius: 2 }} />
                Tips &amp; TIL
              </p>
            </ScrollReveal>
            <div style={{ marginBottom: '3.5rem' }}>
              {(() => {
                const TYPE_COLOR: Record<string,string> = { tip:'var(--f-orange)', TIL:'var(--f-sky)', snippet:'var(--f-green)' };
                return (
                  <Marquee speed={40} gap={14} itemWidth={290} itemHeight={190}>
                    {latestTips.map((tip) => {
                      const praticien = tip.praticiens;
                      return (
                        <div key={tip.id} className="f-card" style={{ padding: '1.1rem 1.25rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', letterSpacing: '.08em', color: TYPE_COLOR[tip.type] ?? 'var(--f-text-3)', border: `1px solid currentColor`, padding: '2px 7px', borderRadius: 4 }}>
                              {tip.type}
                            </span>
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 7px', borderRadius: 4 }}>
                              {tip.category}
                            </span>
                          </div>
                          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.76rem', color: 'var(--f-text-1)', margin: 0, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                            {tip.content}
                          </p>
                          {praticien && (
                            <Link href={`/praticiens/${praticien.slug}`} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', textDecoration: 'none', marginTop: 'auto' }}>
                              @{praticien.slug}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </Marquee>
                );
              })()}
            </div>
          </>
        )}

        {/* Articles récents */}
        {lastArticles.length > 0 && (
          <>
            <ScrollReveal>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'var(--f-sky)', borderRadius: 2 }} />
                Articles récents
              </p>
            </ScrollReveal>
            <div style={{ marginBottom: '1.75rem' }}>
              <Marquee speed={35} gap={14} itemWidth={300} itemHeight={220}>
                {lastArticles.map((a) => (
                  <a key={a.slug} href={a.external_url} className="f-card-link" target="_blank" rel="noreferrer" style={{ display: 'flex', height: '100%' }}>
                    <div className="f-card f-card-hover" style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-sky)', border: '1px solid var(--f-sky-border)', background: 'var(--f-sky-bg)', padding: '2px 7px', borderRadius: 4 }}>{a.category}</span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 7px', borderRadius: 4 }}>{a.source}</span>
                      </div>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '.9rem', fontWeight: 800, color: 'var(--f-text-1)', margin: 0, lineHeight: 1.4, letterSpacing: '-.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</h3>
                      {a.excerpt && (
                        <p style={{ fontSize: '.75rem', color: 'var(--f-text-2)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</p>
                      )}
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', marginTop: 'auto' }}>
                        {a.author}{a.author_country ? ` · ${a.author_country}` : ''}
                      </span>
                    </div>
                  </a>
                ))}
              </Marquee>
            </div>
            <ScrollReveal>
              <Link href="/articles" className="arrow-link">
                Voir tous les articles <span>→</span>
              </Link>
            </ScrollReveal>
          </>
        )}
        </div>
      </section>

      {/* ── COMMUNAUTÉ CTA ───────────────────────────────────────── */}
      <section style={{ padding: '6rem 6vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ScrollReveal>
          <div className="community-cta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 580 }}>
              <span className="f-label" style={{ marginBottom: '.75rem' }}>// la communauté</span>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                fontWeight: 800,
                color: 'var(--f-text-1)',
                margin: '.4rem 0 1rem 0',
                lineHeight: 1.2,
                letterSpacing: '-.025em',
              }}>
                Une communauté de praticiens<br />
                tech francophones qui construisent.
              </h2>
              <p style={{ fontSize: '.92rem', color: 'var(--f-text-2)', lineHeight: 1.85, margin: 0 }}>
                Construite autour de ceux qui font — pas de ceux qui parlent.
              </p>
            </div>
            <Link href="/praticiens" className="btn-f btn-f-primary" style={{ flexShrink: 0, fontSize: '.78rem' }}>
              Voir la communauté →
            </Link>
          </div>
        </ScrollReveal>
        </div>
      </section>
    </>
  );
}
