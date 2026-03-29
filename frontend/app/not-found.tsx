import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center',
    }}>
      <span style={{
        fontFamily: "'Geist Mono', monospace", fontSize: '.72rem',
        letterSpacing: '.12em', textTransform: 'uppercase',
        color: 'var(--f-orange)', marginBottom: '1.5rem',
      }}>// 404</span>

      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontSize: 'clamp(3rem,10vw,6rem)',
        fontWeight: 800, color: 'var(--f-text-1)', margin: '0 0 1rem 0', lineHeight: 1,
      }}>Page<br />introuvable.</h1>

      <p style={{
        fontSize: '.95rem', color: 'var(--f-text-3)',
        maxWidth: 380, lineHeight: 1.8, margin: '0 0 2.5rem 0',
      }}>
        Cette page n'existe pas ou a été déplacée.<br />
        Retourne à l'accueil.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn-f btn-f-primary">← Accueil</Link>
        <Link href="/praticiens" className="btn-f btn-f-secondary">Voir les praticiens</Link>
      </div>
    </div>
  );
}
