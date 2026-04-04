import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';
import AddModal  from '@/components/AddModal';

const PAYS = [
  'Afrique du Sud','Algérie','Angola','Bénin','Botswana','Burkina Faso','Burundi',
  'Cabo Verde','Cameroun','Comores','Congo (Brazzaville)','Congo (RDC)',
  "Côte d'Ivoire",'Djibouti','Égypte','Érythrée','Eswatini','Éthiopie',
  'Gabon','Gambie','Ghana','Guinée','Guinée-Bissau','Guinée équatoriale',
  'Kenya','Lesotho','Liberia','Libye','Madagascar','Malawi','Mali','Maroc',
  'Maurice','Mauritanie','Mozambique','Namibie','Niger','Nigeria','Ouganda',
  'Rwanda','São Tomé-et-Príncipe','Sénégal','Seychelles','Sierra Leone',
  'Somalie','Soudan','Soudan du Sud','Tanzanie','Tchad','Togo','Tunisie',
  'Zambie','Zimbabwe',
  '─── Diaspora ───',
  'France','Belgique','Canada','États-Unis','Royaume-Uni','Suisse','Allemagne',
  'Italie','Espagne','Portugal','Pays-Bas','Suède','Norvège','Autre',
];

const CAT_OPTIONS = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'];

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
  { key: 'name',           label: 'Nom complet' },
  { key: 'role',           label: 'Rôle / titre' },
  { key: 'photo_url',      label: 'Photo URL', type: 'url' as const },
  { key: 'country',        label: 'Pays', type: 'select' as const, options: PAYS },
  { key: 'city',           label: 'Ville' },
  { key: 'category',       label: 'Catégorie', type: 'select' as const, options: CAT_OPTIONS },
  { key: 'category_label', label: 'Catégorie précisée (si Autre)' },
  { key: 'bio',            label: 'Bio', type: 'textarea' as const },
  { key: 'stack',          label: 'Stack (séparé par ,)' },
  { key: 'badges',         label: 'Badges (séparé par ,)', type: 'array' as const },
  { key: 'linkedin_url',   label: 'LinkedIn', type: 'url' as const },
  { key: 'github_url',     label: 'GitHub', type: 'url' as const },
  { key: 'status',         label: 'Statut', type: 'select' as const, options: ['pending','approved','rejected'] },
];

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const STATUS_LABEL: Record<string, string> = { all: 'Tous', approved: 'Approuvés', pending: 'En attente', rejected: 'Rejetés' };
const STATUS_CLASS: Record<string, string> = { approved: 'active-green', pending: 'active-orange', rejected: 'active-red', all: 'active-sky' };

function PraticiensPage() {
  const [rows, setRows]         = useState<Row[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [editing, setEditing]   = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding,  setAdding]    = useState(false);

  async function deleteRow(id: string, name: string) {
    if (!window.confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    setDeleting(id);
    const r = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table: 'praticiens', id }),
    });
    if (!r.ok) { setDeleting(null); alert('Erreur lors de la suppression.'); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

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
            Praticiens
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
                {['Nom', 'Rôle', 'Localisation', 'Catégorie', 'Statut', 'Ajouté le', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                      {/* Avatar : photo ou initiales */}
                      {r.photo_url ? (
                        <img
                          src={r.photo_url}
                          alt={r.name}
                          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                        />
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(14,165,233,.12)', border: '1px solid rgba(14,165,233,.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '.62rem', color: '#38bdf8',
                        }}>
                          {r.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="td-primary">{r.name}</span>
                    </div>
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
                      onClick={() => deleteRow(r.id, r.name)}
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
              {search ? `Aucun résultat pour "${search}"` : 'Aucun praticien pour ce filtre.'}
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal table="praticiens" row={editing} fields={EDIT_FIELDS}
          onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
      {adding && (
        <AddModal table="praticiens"
          fields={[
            { key: 'name',           label: 'Nom complet', required: true },
            { key: 'role',           label: 'Rôle / titre', required: true },
            { key: 'country',        label: 'Pays', type: 'select', options: PAYS },
            { key: 'category',       label: 'Catégorie', type: 'select', options: CAT_OPTIONS },
            { key: 'category_label', label: 'Catégorie précisée (si Autre)' },
            { key: 'bio',            label: 'Bio', type: 'textarea' },
            { key: 'stack',          label: 'Stack (séparé par ,)' },
            { key: 'linkedin_url',   label: 'LinkedIn', type: 'url' },
            { key: 'github_url',     label: 'GitHub', type: 'url' },
            { key: 'youtube_url',    label: 'YouTube', type: 'url' },
            { key: 'website_url',    label: 'Site web', type: 'url' },
            { key: 'status',         label: 'Statut', type: 'select', options: ['approved','pending','rejected'] },
          ]}
          defaults={{ status: 'approved' }}
          onClose={() => setAdding(false)} onCreated={onCreated} />
      )}
    </div>
  );
}

export default function PraticiensRoute() {
  return <AuthGuard><PraticiensPage /></AuthGuard>;
}
