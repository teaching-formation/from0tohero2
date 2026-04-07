'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: '.68rem',
        letterSpacing: '.15em',
        textTransform: 'uppercase',
        color: 'var(--f-orange)',
        marginBottom: '.75rem',
      }}>
        // erreur
      </p>
      <h2 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 'clamp(1.4rem, 3vw, 2rem)',
        fontWeight: 800,
        color: 'var(--f-text-1)',
        margin: '0 0 .75rem 0',
        letterSpacing: '-.02em',
      }}>
        Quelque chose s&apos;est mal passé.
      </h2>
      <p style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: '.78rem',
        color: 'var(--f-text-3)',
        margin: '0 0 2rem 0',
        lineHeight: 1.7,
      }}>
        Une erreur inattendue s&apos;est produite. Tu peux réessayer ou revenir à l&apos;accueil.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn-f btn-f-primary" onClick={reset}>
          Réessayer →
        </button>
        <a href="/" className="btn-f btn-f-secondary">
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
