'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  const NAV = [
    { href: '/praticiens',   labelKey: 'nav.praticiens' },
    { href: '/realisations', labelKey: 'nav.realisations' },
    { href: '/articles',     labelKey: 'nav.articles' },
    { href: '/evenements',   labelKey: 'nav.evenements' },
  ];

  const tNav = useTranslations('nav');

  return (
    <footer style={{ background: '#0a0e17', borderTop: '1px solid #1a2235' }}>

      {/* ── Corps ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 6vw 2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3rem' }}>

        {/* Brand */}
        <div>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 7,
              background: '#0d1117', border: '1.5px solid rgba(249,115,22,.4)', flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: '.72rem', color: '#f97316', lineHeight: 1 }}>&gt;_</span>
            </span>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: '.9rem', color: '#f0f6fc', letterSpacing: '-.02em' }}>
              from0tohero<span style={{ color: '#f97316' }}>.dev</span>
            </span>
          </Link>
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.7rem',
            color: '#475569',
            lineHeight: 1.8,
            margin: '0 0 1.5rem 0',
            letterSpacing: '.01em',
          }}>
            {t('tagline1')}<br />
            {t('tagline2')}
          </p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {['Data', 'DevOps', 'Cloud', 'IA', 'Cyber', 'Dev'].map(tag => (
              <span key={tag} style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.55rem',
                letterSpacing: '.1em',
                color: '#334155',
                border: '1px solid #1e293b',
                padding: '2px 7px',
                borderRadius: 99,
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#334155', marginBottom: '1.1rem' }}>
            {t('explore')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {NAV.map(l => (
              <Link key={l.href} href={l.href} style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.75rem',
                color: '#64748b',
                textDecoration: 'none',
                letterSpacing: '.02em',
                transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f97316')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >{tNav(l.labelKey.replace('nav.', '') as Parameters<typeof tNav>[0])}</Link>
            ))}
          </div>
        </div>

        {/* Liens secondaires */}
        <div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#334155', marginBottom: '1.1rem' }}>
            {t('platform')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <Link href="/soumettre" style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.75rem',
              color: '#64748b',
              textDecoration: 'none',
              letterSpacing: '.02em',
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >{tNav('soumettre')}</Link>
            <Link href="/connexion" style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.75rem',
              color: '#64748b',
              textDecoration: 'none',
              letterSpacing: '.02em',
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >{tNav('connexion')}</Link>
            <Link href="/legal" style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.75rem',
              color: '#64748b',
              textDecoration: 'none',
              letterSpacing: '.02em',
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
            >{t('legal')}</Link>
          </div>
        </div>
      </div>

      {/* ── Barre basse ── */}
      <div style={{ borderTop: '1px solid #1a2235', padding: '1rem 6vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: '#334155', letterSpacing: '.04em' }}>
            {t('copyright')}
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: '#1e293b', letterSpacing: '.06em' }}>
            {t('builtBy')}
          </span>
        </div>
      </div>

    </footer>
  );
}
