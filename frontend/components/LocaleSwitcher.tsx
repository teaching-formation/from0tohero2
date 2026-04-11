'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition, useState, useRef, useEffect } from 'react';

const LOCALES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
];

export default function LocaleSwitcher() {
  const locale    = useLocale();
  const router    = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function switchLocale(next: string) {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    startTransition(() => { router.refresh(); });
  }

  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '.67rem',
          fontWeight: 700,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          background: 'transparent',
          border: `1.5px solid ${open ? 'var(--f-sky)' : 'var(--f-border)'}`,
          borderRadius: 7,
          padding: '4px 10px',
          color: open ? 'var(--f-sky)' : 'var(--f-text-3)',
          cursor: isPending ? 'wait' : 'pointer',
          transition: 'all .15s',
          opacity: isPending ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '.35rem',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '.85rem', lineHeight: 1 }}>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span style={{ fontSize: '.5rem', opacity: .65, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', display: 'inline-block' }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 7px)',
          right: 0,
          background: 'var(--f-card)',
          border: '1.5px solid var(--f-border)',
          borderRadius: 10,
          overflow: 'hidden',
          zIndex: 2000,
          minWidth: 148,
          boxShadow: '0 8px 28px rgba(0,0,0,.18)',
        }}>
          {LOCALES.map(l => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                onClick={() => switchLocale(l.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.65rem',
                  width: '100%',
                  padding: '.6rem 1rem',
                  background: active ? 'rgba(14,165,233,.08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.7rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? 'var(--f-sky)' : 'var(--f-text-2)',
                  textAlign: 'left',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--f-surface)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '.9rem', lineHeight: 1 }}>{l.flag}</span>
                <span style={{ flex: 1 }}>{l.label}</span>
                {active && <span style={{ fontSize: '.6rem', opacity: .8 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
