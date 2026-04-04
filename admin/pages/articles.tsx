import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';
import AddModal  from '@/components/AddModal';

type Row = {
  id: string;
  slug: string;
  title: string;
  author: string;
  author_country?: string;
  category: string;
  source: string;
  status: string;
  date_published?: string;
  created_at: string;
  external_url: string;
  excerpt?: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'title',          label: 'Titre' },
  { key: 'author',         label: 'Auteur' },
  { key: 'author_country', label: 'Pays auteur' },
  { key: 'category',       label: 'Catégorie', type: 'select' as const, options: ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'] },
  { key: 'source',         label: 'Source', type: 'select' as const, options: ['linkedin','medium','devto','substack','blog','youtube','autre'] },
  { key: 'source_label',   label: 'Source (autre — préciser)' },
  { key: 'external_url',   label: 'Lien article', type: 'url' as const },
  { key: 'excerpt',        label: 'Résumé', type: 'textarea' as const },
  { key: 'date_published', label: 'Date publication', type: 'date' as const },
  { key: 'status',         label: 'Statut', type: 'select' as const, options: ['pending','approved','rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Tous', approved: 'Approuvés', pending: 'En attente', rejected: 'Rejetés' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };

const SOURCE_COLOR: Record<string, string> = {
  linkedin:  '#0a66c2',
  medium:    '#00ab6c',
  devto:     '#08090a',
  substack:  '#ff6719',
  youtube:   '#ff0000',
  blog:      '#38bdf8',
  autre:     '#a78bfa',
};

function ArticlesPage() {
  const [rows, setRows]         = useState<Row[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [editing, setEditing]   = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding,  setAdding]    = useState(false);

  async function deleteRow(id: string, title: string) {
    if (!window.confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setDeleting(id);
    const r = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table: 'articles', id }),
    });
    if (!r.ok) { setDeleting(null); alert('Erreur lors de la suppression.'); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  useEffect(() => {
    fetch('/api/content?table=articles', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.author.toLowerCase().includes(search.toLowerCase()));

  function onSaved(updated: Record<string, unknown>) {
    setRows(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } as Row : r));
  }

  function onCreated(row: Record<string, unknown>) {
    setRows(prev => [row as Row, ...prev]);
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
            Articles
            <span className="page-title-count">({rows.length})</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <input type="search" placeholder="Rechercher…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 220, fontSize: '.72rem' }} />
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>+ Nouveau</button>
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
                {['Titre', 'Auteur', 'Catégorie', 'Source', 'Statut', 'Publié le', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 280 }}>
                    <a
                      href={r.external_url}
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
                  </td>
                  <td>
                    <div className="td-mono" style={{ whiteSpace: 'nowrap' }}>{r.author}</div>
                    {r.author_country && (
                      <div className="td-faint" style={{ marginTop: '.1rem' }}>{r.author_country}</div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-sky">{r.category}</span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      color: SOURCE_COLOR[r.source] || 'var(--text-3)',
                      borderColor: `${SOURCE_COLOR[r.source] || '#666'}33`,
                      background: `${SOURCE_COLOR[r.source] || '#666'}11`,
                    }}>
                      {r.source}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    <span className="td-faint" style={{ whiteSpace: 'nowrap' }}>
                      {r.date_published || '—'}
                    </span>
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
              {search ? `Aucun résultat pour "${search}"` : 'Aucun article pour ce filtre.'}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal table="articles" row={editing} fields={EDIT_FIELDS}
          onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
      {adding && (
        <AddModal table="articles"
          fields={[
            { key: 'title',          label: 'Titre', required: true },
            { key: 'author',         label: 'Auteur', required: true },
            { key: 'author_country', label: 'Pays auteur' },
            { key: 'category',       label: 'Catégorie', type: 'select', options: ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'] },
            { key: 'source',         label: 'Source', type: 'select', options: ['linkedin','medium','devto','substack','blog','youtube','autre'] },
            { key: 'source_label',   label: 'Source précisée (si Autre)' },
            { key: 'external_url',   label: 'Lien article', type: 'url', required: true },
            { key: 'excerpt',        label: 'Résumé', type: 'textarea' },
            { key: 'date_published', label: 'Date publication', type: 'date' },
            { key: 'status',         label: 'Statut', type: 'select', options: ['approved','pending','rejected'] },
          ]}
          defaults={{ status: 'approved' }}
          onClose={() => setAdding(false)} onCreated={onCreated} />
      )}
    </div>
  );
}

export default function ArticlesRoute() {
  return <AuthGuard><ArticlesPage /></AuthGuard>;
}
