'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');
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
      }}>{t('label')}</span>

      <h1 style={{
        fontFamily: "'Syne', sans-serif", fontSize: 'clamp(3rem,10vw,6rem)',
        fontWeight: 800, color: 'var(--f-text-1)', margin: '0 0 1rem 0', lineHeight: 1,
      }}>{t('title')}</h1>

      <p style={{
        fontSize: '.95rem', color: 'var(--f-text-3)',
        maxWidth: 380, lineHeight: 1.8, margin: '0 0 2.5rem 0',
      }}>
        {t('desc')}<br />
        {t('hint')}
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn-f btn-f-primary">{t('home')}</Link>
        <Link href="/praticiens" className="btn-f btn-f-secondary">{t('practitioners')}</Link>
      </div>
    </div>
  );
}
