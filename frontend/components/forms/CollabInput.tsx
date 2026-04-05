'use client';
import { useState } from 'react';

type Props = {
  value: string[];
  onChange: (slugs: string[]) => void;
};

export default function CollabInput({ value: collaborateurs, onChange }: Props) {
  const [input,      setInput]      = useState('');
  const [checking,   setChecking]   = useState(false);
  const [feedback,   setFeedback]   = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function addCollab() {
    const slug = input.trim().replace(/^@/, '').toLowerCase();
    if (!slug) return;
    if (collaborateurs.includes(slug)) {
      setFeedback({ type: 'err', text: `@${slug} est déjà ajouté.` });
      return;
    }
    setChecking(true);
    setFeedback(null);
    try {
      const res  = await fetch(`/api/praticien-exists?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.exists) {
        onChange([...collaborateurs, slug]);
        setInput('');
        setFeedback({ type: 'ok', text: `✓ ${data.name} (@${slug}) ajouté` });
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedback({ type: 'err', text: `@${slug} n'est pas inscrit sur from0tohero.` });
      }
    } catch {
      setFeedback({ type: 'err', text: 'Impossible de vérifier.' });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <input
          className="f-input"
          placeholder="@username inscrit sur from0tohero"
          value={input}
          onChange={e => { setInput(e.target.value); setFeedback(null); }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCollab(); }
          }}
          style={{ flex: 1 }}
          disabled={checking}
        />
        <button
          type="button"
          className="btn-f btn-f-secondary"
          onClick={addCollab}
          disabled={checking || !input.trim()}
          style={{ flexShrink: 0, fontSize: '.72rem' }}
        >
          {checking ? '…' : '+ Ajouter'}
        </button>
      </div>

      {collaborateurs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
          {collaborateurs.map(c => (
            <span key={c} style={{
              display: 'inline-flex', alignItems: 'center', gap: '.35rem',
              fontFamily: "'Geist Mono', monospace", fontSize: '.65rem',
              color: 'var(--f-sky)', border: '1px solid var(--f-sky-border)',
              background: 'var(--f-sky-bg)', padding: '2px 8px', borderRadius: 99,
            }}>
              @{c}
              <button
                type="button"
                onClick={() => onChange(collaborateurs.filter(x => x !== c))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-text-3)', padding: 0, lineHeight: 1, fontSize: '.7rem' }}
              >✕</button>
            </span>
          ))}
        </div>
      )}

      {feedback && (
        <span style={{
          fontFamily: "'Geist Mono', monospace", fontSize: '.63rem',
          color: feedback.type === 'ok' ? 'var(--f-green)' : '#f87171',
        }}>
          {feedback.text}
        </span>
      )}

      {!feedback && (
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>
          Le co-auteur doit être inscrit sur from0tohero.
        </span>
      )}
    </div>
  );
}
