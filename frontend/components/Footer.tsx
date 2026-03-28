import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: '#0f172a',
      borderTop: '1px solid #1e293b',
      padding: '1.5rem 6vw',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.72rem', color: '#64748b' }}>
          © 2026 from0tohero.dev — Tous droits réservés.
        </span>
        <Link href="/legal" style={{ fontFamily: "'Space Mono', monospace", fontSize: '.72rem', color: '#64748b', textDecoration: 'none' }}>
          Mentions légales & CGU
        </Link>
      </div>
    </footer>
  );
}
