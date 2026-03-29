import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';

type Row = {
  id: string;
  slug: string;
  name: string;
  role: string;
  country: string;
  city?: string;
  category: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'name',         label: 'Nom complet' },
  { key: 'role',         label: 'Rôle / titre' },
  { key: 'country',      label: 'Pays' },
  { key: 'city',         label: 'Ville' },
  { key: 'category',     label: 'Catégorie', type: 'select' as const, options: ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'] },
  { key: 'bio',          label: 'Bio', type: 'textarea' as const },
  { key: 'stack',        label: 'Stack (séparé par ,)' },
  { key: 'linkedin_url', label: 'LinkedIn', type: 'url' as const },
  { key: 'github_url',   label: 'GitHub', type: 'url' as const },
  { key: 'status',       label: 'Statut', type: 'select' as const, options: ['pending','approved','rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Tous', approved: 'Approuvés', pending: 'En attente', rejected: 'Rejetés' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };

function PraticiensPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [editing, setEditing] = useState<Row | null>(null);

  useEffect(() => {
    fetch('/api/content?table=praticiens', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase()));

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
            Praticiens
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
                {['Nom', 'Rôle', 'Localisation', 'Catégorie', 'Statut', 'Ajouté le', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className="td-primary">{r.name}</span>
                  </td>
                  <td>
                    <span className="td-mono">{r.role}</span>
                  </td>
                  <td>
                    <span className="td-faint">
                      {r.country}{r.city ? ` · ${r.city}` : ''}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-sky">{r.category}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    <span className="td-faint">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing(r)}
                    >
                      ✎ Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">
              {search ? `Aucun résultat pour "${search}"` : 'Aucun praticien pour ce filtre.'}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal
          table="praticiens"
          row={editing}
          fields={EDIT_FIELDS}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

export default function PraticiensRoute() {
  return <AuthGuard><PraticiensPage /></AuthGuard>;
}
