import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: '#0f172a',
      borderTop: '1px solid #1e293b',
      padding: '1.5rem 6vw',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 5,
            background: '#0d1117',
            border: '1px solid rgba(249,115,22,.35)',
          }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: '.55rem', color: '#f97316', lineHeight: 1 }}>
              &gt;_
            </span>
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: '#64748b' }}>
            © 2026 from0tohero.dev — Tous droits réservés.
          </span>
        </span>
        <Link href="/legal" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: '#64748b', textDecoration: 'none' }}>
          Mentions légales & CGU
        </Link>
      </div>
    </footer>
  );
}
