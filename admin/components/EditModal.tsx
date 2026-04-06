import { useState, useEffect, useCallback } from 'react';
import { getToken } from './AuthGuard';

const OPTION_LABEL: Record<string, string> = {
  pending:  'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

type Field = {
  key: string;
  label: string;
  type?: 'text' | 'url' | 'date' | 'select' | 'textarea' | 'array';
  options?: string[];
};

type Props = {
  table: string;
  row: Record<string, unknown>;
  fields: Field[];
  autofill?: boolean;
  onClose: () => void;
  onSaved: (updated: Record<string, unknown>) => void;
};

export default function EditModal({ table, row, fields, autofill = false, onClose, onSaved }: Props) {
  const [form, setForm]       = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [afUrl,     setAfUrl]     = useState('');
  const [afLoading, setAfLoading] = useState(false);
  const [afMsg,     setAfMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      const val = row[f.key];
      // stack et collaborateurs sont des arrays → afficher en CSV
      if (f.key === 'stack' || f.key === 'collaborateurs' || f.type === 'array') {
        init[f.key] = Array.isArray(val) ? (val as string[]).join(', ') : String(val ?? '');
      } else {
        init[f.key] = Array.isArray(val) ? (val as string[]).join(', ') : String(val ?? '');
      }
    }
    setForm(init);
  }, [row, fields]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = useCallback((key: string, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
  }, []);

  async function handleAutofill() {
    if (!afUrl.trim()) return;
    setAfLoading(true);
    setAfMsg(null);
    try {
      const res  = await fetch(`/api/autofill?url=${encodeURIComponent(afUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setForm(f => ({
        ...f,
        ...(data.title        && { title:        data.title }),
        ...(data.excerpt      && { excerpt:      data.excerpt }),
        ...(data.stack        && { stack:        data.stack }),
        ...(data.category     && { category:     data.category }),
        ...(data.type         && { type:         data.type }),
        ...(data.demo_url     && { demo_url:     data.demo_url }),
        ...(data.repo_url     && { repo_url:     data.repo_url }),
        ...(data.external_url && { external_url: data.external_url }),
        ...(data.source       && { source:       data.source }),
      }));
      const filled = [data.title, data.excerpt, data.stack, data.external_url].filter(Boolean).length;
      setAfMsg({ type: 'ok', text: `✓ ${filled} champ${filled > 1 ? 's' : ''} rempli${filled > 1 ? 's' : ''} automatiquement` });
    } catch (e: unknown) {
      setAfMsg({ type: 'err', text: e instanceof Error ? e.message : 'Impossible de récupérer les infos' });
    } finally {
      setAfLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    setError('');

    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === 'array' || f.key === 'stack' || f.key === 'collaborateurs') {
        data[f.key] = form[f.key].split(',').map(s => s.trim()).filter(Boolean);
      } else {
        data[f.key] = form[f.key] || null;
      }
    }

    const r = await fetch('/api/edit', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ table, id: row.id, data }),
    });

    const json = await r.json();
    if (!r.ok) {
      setError(json.error || 'Une erreur est survenue.');
      setLoading(false);
      return;
    }

    onSaved({ ...row, ...data });
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <div>
            <p style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.55rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--orange)',
              marginBottom: '.3rem',
            }}>
              // {table}
            </p>
            <h2 className="modal-title">Modifier l&apos;entrée</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {/* Divider */}
        <hr />

        {/* Autofill */}
        {autofill && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(56,189,248,.08) 0%, rgba(56,189,248,.02) 100%)',
            border: '1px solid var(--sky-border)',
            borderRadius: 'var(--radius)',
            padding: '.9rem 1rem',
            marginBottom: '.5rem',
          }}>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', fontWeight: 600, color: 'var(--sky)', marginBottom: '.2rem' }}>
              ✦ Autofill depuis une URL
            </p>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--text-3)', marginBottom: '.7rem' }}>
              Colle un lien GitHub ou de démo pour écraser les champs automatiquement.
            </p>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <input
                type="text"
                placeholder="https://github.com/user/repo"
                value={afUrl}
                onChange={e => setAfUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAutofill())}
                style={{ flex: 1, fontSize: '.72rem' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAutofill}
                disabled={afLoading || !afUrl.trim()}
                style={{ flexShrink: 0 }}
              >
                {afLoading ? '…' : 'Autofill →'}
              </button>
            </div>
            {afMsg && (
              <p style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.6rem',
                color: afMsg.type === 'ok' ? 'var(--green)' : 'var(--red)',
                marginTop: '.4rem',
              }}>
                {afMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Fields */}
        {fields.map(f => (
          <div key={f.key} className="field-group">
            <label className="field-label">{f.label}</label>
            {f.type === 'select' ? (
              <select
                value={form[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
              >
                <option value="">— Choisir —</option>
                {f.options?.map(o => o.startsWith('──') || o.startsWith('─')
                  ? <option key={o} disabled style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>{o}</option>
                  : <option key={o} value={o}>{OPTION_LABEL[o] ?? o}</option>
                )}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                rows={3}
                value={form[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
                style={{ resize: 'vertical' }}
              />
            ) : (
              <input
                type={f.type ?? 'text'}
                value={form[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
              />
            )}
          </div>
        ))}

        {/* Error */}
        {error && (
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.68rem',
            color: 'var(--red)',
            background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '.6rem .85rem',
            margin: 0,
          }}>
            ⚠ {error}
          </p>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                Sauvegarde…
              </>
            ) : (
              'Sauvegarder'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
