import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';
import { statusLabel } from '@/lib/utils';

type Row = {
  id: string;
  name: string;
  description?: string;
  url: string;
  subs?: string;
  ordre: number;
  status: string;
  created_at: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'name',        label: 'Nom de la chaîne' },
  { key: 'description', label: 'Description (tags séparés par ·)' },
  { key: 'url',         label: 'URL YouTube', type: 'url' as const },
  { key: 'subs',        label: 'Abonnés / info (ex: 100k+ abonnés)' },
  { key: 'ordre',       label: "Ordre d'affichage (1 = premier)" },
  { key: 'active',      label: 'Active (true/false)' },
  { key: 'status',      label: 'Statut', type: 'select' as const, options: ['pending', 'approved', 'rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Toutes', approved: 'Approuvées', pending: 'En attente', rejected: 'Rejetées' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };

const EMPTY_FORM = { name: '', description: '', url: '', subs: '', ordre: '0' };

function ChainesPage() {
  const [rows,     setRows]     = useState<Row[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');

  useEffect(() => {
    fetch('/api/content?table=chaines_youtube', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function deleteRow(id: string, name: string) {
    if (!window.confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    setDeleting(id);
    const r = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table: 'chaines_youtube', id }),
    });
    if (!r.ok) { setDeleting(null); alert('Erreur lors de la suppression.'); return; }
    setRows(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    if (!form.name.trim() || !form.url.trim()) { setFormErr('Nom et URL sont requis.'); return; }
    setSaving(true);
    const r = await fetch('/api/chaines-insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ ...form, ordre: Number(form.ordre) || 0, active: false }),
    });
    const data = await r.json();
    if (!r.ok) { setFormErr(data.error || 'Erreur'); setSaving(false); return; }
    setRows(prev => [...prev, { ...data, status: 'pending' }]);
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  function onSaved(updated: Record<string, unknown>) {
    setRows(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } as Row : r));
  }

  const filtered = rows
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all:      rows.length,
    approved: rows.filter(r => r.status === 'approved').length,
    pending:  rows.filter(r => r.status === 'pending').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">// contenu</p>
          <h1 className="page-title">
            Chaînes YouTube
            <span className="page-title-count">({rows.length})</span>
          </h1>
        </div>
        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220, fontSize: '.72rem' }}
        />
      </div>

      {/* Filters */}
      <div className="filter-row">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`filter-pill${filter === f ? ` ${STATUS_CLASS[f]}` : ''}`}
            onClick={() => setFilter(f)}
          >
            {STATUS_LABEL[f]}
            <span style={{ marginLeft: '.3rem', opacity: .65 }}>
              ({counts[f as keyof typeof counts]})
            </span>
          </button>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      <div className="table-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <p style={{ fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>
          + Ajouter une chaîne
        </p>
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.75rem' }}>
          <input placeholder="Nom *" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }} />
          <input placeholder="Description (ex: DevOps · Linux)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }} />
          <input placeholder="URL YouTube *" value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }} />
          <input placeholder="Abonnés (ex: 100k+ abonnés)" value={form.subs}
            onChange={e => setForm(f => ({ ...f, subs: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }} />
          <input type="number" placeholder="Ordre (1 = premier)" value={form.ordre}
            onChange={e => setForm(f => ({ ...f, ordre: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }} />
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ alignSelf: 'end' }}>
            {saving ? '…' : '+ Ajouter'}
          </button>
        </form>
        {formErr && <p style={{ fontSize: '.7rem', color: 'var(--red)', marginTop: '.5rem' }}>{formErr}</p>}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner" />Chargement…</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                {['Nom', 'Description', 'Abonnés', 'Ordre', 'Statut', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <a href={r.url} target="_blank" rel="noreferrer" className="td-primary"
                      style={{ color: 'var(--sky)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <span style={{ color: '#ff0000' }}>▶</span>
                      {r.name}
                    </a>
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <span className="td-faint">{r.description || '—'}</span>
                  </td>
                  <td>
                    <span className="td-mono">{r.subs || '—'}</span>
                  </td>
                  <td>
                    <span className="td-faint">{r.ordre}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{statusLabel(r.status)}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>
                      ✎ Modifier
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: '.4rem' }}
                      disabled={deleting === r.id} onClick={() => deleteRow(r.id, r.name)}>
                      {deleting === r.id ? '…' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">
              {search ? `Aucun résultat pour "${search}"` : `Aucune chaîne pour ce filtre.`}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal table="chaines_youtube" row={editing} fields={EDIT_FIELDS}
          onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </div>
  );
}

export default function ChainesRoute() {
  return <AuthGuard><ChainesPage /></AuthGuard>;
}
