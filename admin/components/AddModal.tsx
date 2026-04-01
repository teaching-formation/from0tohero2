import { useState, useEffect, useCallback } from 'react';
import { getToken } from './AuthGuard';

type Field = {
  key: string;
  label: string;
  type?: 'text' | 'url' | 'date' | 'select' | 'textarea' | 'array';
  options?: string[];
  required?: boolean;
};

type Props = {
  table: string;
  fields: Field[];
  defaults?: Record<string, string>;
  onClose: () => void;
  onCreated: (row: Record<string, unknown>) => void;
};

export default function AddModal({ table, fields, defaults = {}, onClose, onCreated }: Props) {
  const [form, setForm]       = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.key] = defaults[f.key] ?? '';
    setForm(init);
  }, [fields, defaults]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = useCallback((key: string, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
  }, []);

  async function save() {
    setLoading(true);
    setError('');

    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === 'array' || f.key === 'stack') {
        data[f.key] = form[f.key].split(',').map(s => s.trim()).filter(Boolean);
      } else {
        data[f.key] = form[f.key] || null;
      }
    }

    const r = await fetch('/api/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table, data }),
    });

    const json = await r.json();
    if (!r.ok) { setError(json.error || 'Une erreur est survenue.'); setLoading(false); return; }
    onCreated(json);
    onClose();
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: '.3rem' }}>
              // {table}
            </p>
            <h2 className="modal-title">Nouvelle entrée</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <hr />
        {fields.map(f => (
          <div key={f.key} className="field-group">
            <label className="field-label">
              {f.label}{f.required && <span style={{ color: 'var(--orange)', marginLeft: '.2rem' }}>*</span>}
            </label>
            {f.type === 'select' ? (
              <select value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)}>
                <option value="">— Choisir —</option>
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea rows={3} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} style={{ resize: 'vertical' }} />
            ) : (
              <input type={f.type ?? 'text'} value={form[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} />
            )}
          </div>
        ))}
        {error && (
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius-sm)', padding: '.6rem .85rem', margin: 0 }}>
            ⚠ {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? (<><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />Création…</>) : 'Créer'}
          </button>
        </div>
      </div>
    </>
  );
}
