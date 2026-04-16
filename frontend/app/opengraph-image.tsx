import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'from0tohero.dev — Ce qu\'ils ont construit. Pas ce qu\'ils ont promis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: '#0d1117',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '80px',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        {/* Grid dots background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, #21262d 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.6,
          display: 'flex',
        }} />

        {/* Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 40,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
          <span style={{ fontSize: 18, color: '#656d76', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            from0tohero.dev
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: '#f0f6fc', lineHeight: 1.05, display: 'flex' }}>
            Ce qu'ils ont{' '}
            <span style={{ color: '#38bdf8', marginLeft: 16 }}>construit</span>
          </span>
          <span style={{ fontSize: 72, fontWeight: 800, color: '#f0f6fc', lineHeight: 1.05, display: 'flex' }}>
            Pas ce qu'ils ont{' '}
            <span style={{ color: '#fb923c', marginLeft: 16 }}>promis</span>
          </span>
        </div>

        {/* Sub */}
        <p style={{
          fontSize: 24, color: '#8d96a0',
          marginTop: 36, lineHeight: 1.6,
        }}>
          Articles · Réalisations · Praticiens tech
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 12, marginTop: 48 }}>
          {['Data', 'DevOps', 'Cloud', 'IA', 'Cyber', 'Dev'].map(t => (
            <span key={t} style={{
              fontSize: 14, color: '#656d76',
              border: '1px solid #30363d',
              padding: '4px 12px', borderRadius: 4,
              letterSpacing: '0.06em',
            }}>{t}</span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
