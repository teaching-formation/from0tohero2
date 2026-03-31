import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';

type Row = {
  id: string;
  slug: string;
  title: string;
  type: string;
  pays?: string;
  lieu?: string;
  online: boolean;
  gratuit: boolean;
  url?: string;
  date_debut: string;
  date_fin?: string;
  excerpt?: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'title',      label: 'Titre' },
  { key: 'type',       label: 'Type', type: 'select' as const, options: ['conference','meetup','hackathon','webinaire','bootcamp','autre'] },
  { key: 'pays',       label: 'Pays' },
  { key: 'lieu',       label: 'Lieu' },
  { key: 'url',        label: 'Lien', type: 'url' as const },
  { key: 'date_debut', label: 'Date début', type: 'date' as const },
  { key: 'date_fin',   label: 'Date fin',   type: 'date' as const },
  { key: 'excerpt',    label: 'Description', type: 'textarea' as const },
  { key: 'status',     label: 'Statut', type: 'select' as const, options: ['pending','approved','rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Tous', approved: 'Approuvés', pending: 'En attente', rejected: 'Rejetés' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };

const EVENT_TYPE_LABEL: Record<string, string> = {
  conference: 'Conférence',
  meetup:     'Meetup',
  hackathon:  'Hackathon',
  webinaire:  'Webinaire',
  bootcamp:   'Bootcamp',
  autre:      'Autre',
};

function EvenementsPage() {
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
      body: JSON.stringify({ table: 'evenements', id }),
    });
    if (!r.ok) { setDeleting(null); alert('Erreur lors de la suppression.'); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  useEffect(() => {
    fetch('/api/content?table=evenements', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.pays || '').toLowerCase().includes(search.toLowerCase()));

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
            Événements
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
                {['Titre', 'Type', 'Pays / Lieu', 'Date', 'Gratuit', 'Statut', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 260 }}>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="td-primary"
                        style={{
                          color: 'var(--sky)',
                          textDecoration: 'none',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {r.title}
                      </a>
                    ) : (
                      <span className="td-primary" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {r.title}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-violet">
                      {EVENT_TYPE_LABEL[r.type] || r.type}
                    </span>
                  </td>
                  <td>
                    <div className="td-mono">
                      {r.pays || '—'}{r.lieu ? ` · ${r.lieu}` : ''}
                    </div>
                    {r.online && (
                      <div className="td-faint" style={{ marginTop: '.1rem' }}>En ligne</div>
                    )}
                  </td>
                  <td>
                    <span className="td-faint" style={{ whiteSpace: 'nowrap' }}>
                      {r.date_debut}
                      {r.date_fin && r.date_fin !== r.date_debut
                        ? <><br /><span style={{ color: 'var(--text-4)' }}>→ {r.date_fin}</span></>
                        : null}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.65rem',
                      color: r.gratuit ? 'var(--green)' : 'var(--text-3)',
                    }}>
                      {r.gratuit ? 'Gratuit' : 'Payant'}
                    </span>
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
              {search ? `Aucun résultat pour "${search}"` : 'Aucun événement pour ce filtre.'}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal
          table="evenements"
          row={editing}
          fields={EDIT_FIELDS}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

export default function EvenementsRoute() {
  return <AuthGuard><EvenementsPage /></AuthGuard>;
}
