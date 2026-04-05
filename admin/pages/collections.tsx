import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';

type CollectionItem = { id: string; title: string; url: string; description: string };
type Row = {
  id: string;
  title: string;
  description?: string;
  items: CollectionItem[];
  ordre: number;
  status: string;
  praticien_id: string;
  created_at: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'title',       label: 'Titre' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'ordre',       label: 'Ordre (entier)' },
  { key: 'status',      label: 'Statut', type: 'select' as const, options: ['pending','approved','rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Tous', approved: 'Approuvées', pending: 'En attente', rejected: 'Rejetées' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };

function CollectionsPage() {
  const [rows, setRows]         = useState<Row[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [editing, setEditing]   = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteRow(id: string, title: string) {
    if (!window.confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setDeleting(id);
    const r = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table: 'collections', id }),
    });
    if (!r.ok) { setDeleting(null); alert('Erreur lors de la suppression.'); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  useEffect(() => {
    fetch('/api/content?table=collections', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  function onSaved(updated: Record<string, unknown>) {
    setRows(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } as Row : r));
  }

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
            Collections
            <span className="page-title-count">({rows.length})</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <input type="search" placeholder="Rechercher…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 220, fontSize: '.72rem' }} />
        </div>
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

      {/* Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Chargement…
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                {['Titre', 'Description', 'Ressources', 'Ordre', 'Statut', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 240 }}>
                    <span className="td-primary" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {r.title}
                    </span>
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <span className="td-faint" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {r.description || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="td-faint">
                      {Array.isArray(r.items) ? r.items.length : 0} ressource{Array.isArray(r.items) && r.items.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td>
                    <span className="td-faint">{r.ordre ?? 0}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing(r)}
                    >
                      ✎ Modifier
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: '.4rem' }}
                      disabled={deleting === r.id}
                      onClick={() => deleteRow(r.id, r.title)}
                    >
                      {deleting === r.id ? '…' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">
              {search ? `Aucun résultat pour "${search}"` : 'Aucune collection pour ce filtre.'}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal table="collections" row={editing} fields={EDIT_FIELDS}
          onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </div>
  );
}

export default function CollectionsRoute() {
  return <AuthGuard><CollectionsPage /></AuthGuard>;
}
