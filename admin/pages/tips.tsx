import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';

type Row = {
  id: string;
  praticien_id: string;
  content: string;
  type: string;
  category: string;
  stack: string[];
  status: string;
  created_at: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'content',  label: 'Contenu', type: 'textarea' as const },
  { key: 'type',     label: 'Type', type: 'select' as const, options: ['tip','TIL','snippet'] },
  { key: 'category', label: 'Catégorie', type: 'select' as const, options: ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'] },
  { key: 'status',   label: 'Statut', type: 'select' as const, options: ['pending','approved','rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Tous', approved: 'Approuvés', pending: 'En attente', rejected: 'Rejetés' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };
const TYPE_COLOR: Record<string,string> = { tip:'#f97316', TIL:'#38bdf8', snippet:'#4ade80' };

function TipsPage() {
  const [rows, setRows]         = useState<Row[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [editing, setEditing]   = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteRow(id: string) {
    if (!window.confirm('Supprimer ce tip ? Cette action est irréversible.')) return;
    setDeleting(id);
    const r = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table: 'tips', id }),
    });
    if (!r.ok) { setDeleting(null); alert('Erreur lors de la suppression.'); return; }
    setRows(prev => prev.filter(row => row.id !== id));
    setDeleting(null);
  }

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/content?table=tips', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRows(r.ok ? await r.json() : []);
      setLoading(false);
    })();
  }, []);

  const displayed = rows
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.content.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()));

  const counts: Record<string, number> = { all: rows.length };
  STATUS_FILTERS.slice(1).forEach(s => { counts[s] = rows.filter(r => r.status === s).length; });

  function handleSaved(updated: Record<string, unknown>) {
    setRows(prev => prev.map(row => row.id === String(updated.id) ? { ...row, ...updated } : row));
    setEditing(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', fontWeight: 700 }}>
          💡 Tips &amp; TIL <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-3)', fontWeight: 400 }}>({rows.length})</span>
        </h1>
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '.45rem .85rem', borderRadius: 7, border: '1px solid var(--f-border)', background: 'var(--f-surface)', color: 'var(--f-text-1)', fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', width: 220 }}
        />
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`filter-pill${filter === s ? ` ${STATUS_CLASS[s]}` : ''}`}
          >
            {STATUS_LABEL[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-text-3)' }}>Chargement…</p>
      ) : displayed.length === 0 ? (
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-text-3)' }}>Aucun tip trouvé.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {displayed.map(row => (
            <div key={row.id} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: TYPE_COLOR[row.type] ?? '#aaa', border: '1px solid currentColor', padding: '2px 8px', borderRadius: 4 }}>
                    {row.type}
                  </span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 8px', borderRadius: 4 }}>
                    {row.category}
                  </span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--f-border)', color: row.status === 'approved' ? 'var(--f-green)' : row.status === 'rejected' ? '#f87171' : 'var(--f-orange)' }}>
                    {row.status}
                  </span>
                </div>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-text-1)', margin: '0 0 .4rem 0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {row.content.length > 200 ? `${row.content.slice(0, 200)}…` : row.content}
                </p>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', margin: 0 }}>
                  {new Date(row.created_at).toLocaleDateString('fr-FR')} · {row.praticien_id}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => setEditing(row)}
                  style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', padding: '.35rem .75rem', borderRadius: 6, border: '1px solid var(--f-border)', background: 'transparent', color: 'var(--f-text-2)', cursor: 'pointer' }}
                >
                  ✎
                </button>
                <button
                  onClick={() => deleteRow(row.id)}
                  disabled={deleting === row.id}
                  style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', padding: '.35rem .75rem', borderRadius: 6, border: '1px solid rgba(248,113,113,.3)', background: 'rgba(248,113,113,.08)', color: '#f87171', cursor: 'pointer' }}
                >
                  {deleting === row.id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          table="tips"
          row={editing}
          fields={EDIT_FIELDS}
          onSaved={handleSaved}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export default function TipsPageWrapper() {
  return <AuthGuard><TipsPage /></AuthGuard>;
}
