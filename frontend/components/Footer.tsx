import Link from 'next/link';

const NAV = [
  { href: '/praticiens',   label: 'Praticiens' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/articles',     label: 'Articles' },
  { href: '/evenements',   label: 'Événements' },
];

const NAV2 = [
  { href: '/soumettre',    label: 'Soumettre' },
  { href: '/connexion',    label: 'Connexion' },
  { href: '/legal',        label: 'Mentions légales' },
];

export default function Footer() {
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
            Ce qu&apos;ils ont construit.<br />
            Pas ce qu&apos;ils ont promis.
          </p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {['Data', 'DevOps', 'Cloud', 'IA', 'Cyber', 'Dev'].map(t => (
              <span key={t} style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.55rem',
                letterSpacing: '.1em',
                color: '#334155',
                border: '1px solid #1e293b',
                padding: '2px 7px',
                borderRadius: 99,
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#334155', marginBottom: '1.1rem' }}>
            Explorer
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
              >{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Liens secondaires */}
        <div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#334155', marginBottom: '1.1rem' }}>
            Plateforme
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {NAV2.map(l => (
              <Link key={l.href} href={l.href} style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.75rem',
                color: '#64748b',
                textDecoration: 'none',
                letterSpacing: '.02em',
                transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0ea5e9')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
              >{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Barre basse ── */}
      <div style={{ borderTop: '1px solid #1a2235', padding: '1rem 6vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: '#334155', letterSpacing: '.04em' }}>
            © 2026 from0tohero.dev
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: '#1e293b', letterSpacing: '.06em' }}>
            Construit par des praticiens · Pour des praticiens
          </span>
        </div>
      </div>

    </footer>
  );
}
