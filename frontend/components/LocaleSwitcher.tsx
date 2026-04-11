'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = locale === 'fr' ? 'en' : 'fr';
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    startTransition(() => { router.refresh(); });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: '.67rem',
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        background: 'transparent',
        border: '1.5px solid var(--f-border)',
        borderRadius: 7,
        padding: '4px 10px',
        color: 'var(--f-text-3)',
        cursor: isPending ? 'wait' : 'pointer',
        transition: 'all .15s',
        opacity: isPending ? 0.6 : 1,
      }}
      onMouseEnter={e => {
        (e.target as HTMLButtonElement).style.borderColor = 'var(--f-sky)';
        (e.target as HTMLButtonElement).style.color = 'var(--f-sky)';
      }}
      onMouseLeave={e => {
        (e.target as HTMLButtonElement).style.borderColor = 'var(--f-border)';
        (e.target as HTMLButtonElement).style.color = 'var(--f-text-3)';
      }}
    >
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}
