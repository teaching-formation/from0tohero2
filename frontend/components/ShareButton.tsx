'use client';
import { useState } from 'react';

type Props = {
  url: string;
  title?: string;
  text?: string;
};

export default function ShareButton({ url, title, text }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // annulé par l'utilisateur
        return;
      }
    }
    // Fallback : copier dans le presse-papiers
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      title="Partager"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '.35rem',
        background: 'none', border: '1px solid var(--f-border)',
        borderRadius: 7, padding: '.4rem .75rem',
        cursor: 'pointer', fontFamily: "'Geist Mono', monospace",
        fontSize: '.65rem', color: copied ? 'var(--f-green)' : 'var(--f-text-3)',
        transition: 'color .15s, border-color .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copié !
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Partager
        </>
      )}
    </button>
  );
}
