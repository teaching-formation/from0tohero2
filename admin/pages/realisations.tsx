import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';

type Row = {
  id: string;
  slug: string;
  title: string;
  category: string;
  type: string;
  stack: string[];
  status: string;
  date_published?: string;
  created_at: string;
  demo_url?: string;
  repo_url?: string;
  excerpt?: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'title',          label: 'Titre' },
  { key: 'category',       label: 'Catégorie', type: 'select' as const, options: ['data','devops','cloud','ia','cyber','dev'] },
  { key: 'type',           label: 'Type', type: 'select' as const, options: ['pipeline','dashboard','api','app','bootcamp','youtube','autre'] },
  { key: 'stack',          label: 'Stack (séparé par ,)' },
  { key: 'excerpt',        label: 'Description', type: 'textarea' as const },
  { key: 'demo_url',       label: 'Lien Demo', type: 'url' as const },
  { key: 'repo_url',       label: 'Lien Repo', type: 'url' as const },
  { key: 'date_published', label: 'Date', type: 'date' as const },
  { key: 'status',         label: 'Statut', type: 'select' as const, options: ['pending','approved','rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Tous', approved: 'Approuvés', pending: 'En attente', rejected: 'Rejetés' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };

function RealisationsPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [editing, setEditing] = useState<Row | null>(null);

  useEffect(() => {
    fetch('/api/content?table=realisations', { headers: { Authorization: `Bearer ${getToken()}` } })
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
            Réalisations
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
                {['Titre', 'Catégorie', 'Type', 'Stack', 'Statut', 'Liens', ''].map(h => (
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
                  <td>
                    <span className="badge badge-sky">{r.category}</span>
                  </td>
                  <td>
                    <span className="td-faint" style={{ textTransform: 'capitalize' }}>{r.type}</span>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                      {(r.stack || []).slice(0, 3).map(s => (
                        <span key={s} className="stack-tag">{s}</span>
                      ))}
                      {(r.stack || []).length > 3 && (
                        <span className="stack-tag" style={{ color: 'var(--text-4)' }}>
                          +{r.stack.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      {r.demo_url && (
                        <a
                          href={r.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--sky)', borderColor: 'var(--sky-border)' }}
                        >
                          Demo
                        </a>
                      )}
                      {r.repo_url && (
                        <a
                          href={r.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          Repo
                        </a>
                      )}
                    </div>
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
              {search ? `Aucun résultat pour "${search}"` : 'Aucune réalisation pour ce filtre.'}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal
          table="realisations"
          row={editing}
          fields={EDIT_FIELDS}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

export default function RealisationsRoute() {
  return <AuthGuard><RealisationsPage /></AuthGuard>;
}
