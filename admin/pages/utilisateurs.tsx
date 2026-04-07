import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AuthGuard, { getToken } from '@/components/AuthGuard';

type UserRow = {
  id:              string;
  email:           string;
  created_at:      string;
  last_sign_in_at: string | null;
  provider:        string;
  providers:       string[];
  praticien:       { slug: string; name: string; status: string } | null;
};

const PROVIDER_ICON: Record<string, string> = {
  google: '🔵 Google',
  email:  '✉ Magic Link',
  github: '⬛ GitHub',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDatetime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function UtilisateursPage() {
  const router = useRouter();
  const [rows, setRows]       = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all' | 'with' | 'without'>('all');

  useEffect(() => {
    fetch('/api/users', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r => {
    if (filter === 'with'    && !r.praticien) return false;
    if (filter === 'without' &&  r.praticien) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.email.toLowerCase().includes(q) && !(r.praticien?.name || '').toLowerCase().includes(q) && !(r.praticien?.slug || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const withProfile    = rows.filter(r => !!r.praticien).length;
  const withoutProfile = rows.filter(r => !r.praticien).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">// comptes</p>
          <h1 className="page-title">
            Utilisateurs
            <span className="page-title-count">({rows.length})</span>
          </h1>
        </div>
        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, fontSize: '.72rem' }}
        />
      </div>

      {/* Stats + filtres */}
      <div className="filter-row">
        {[
          { key: 'all',     label: `Tous (${rows.length})` },
          { key: 'with',    label: `Avec profil (${withProfile})` },
          { key: 'without', label: `Sans profil (${withoutProfile})` },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-pill${filter === f.key ? ' active-sky' : ''}`}
            onClick={() => setFilter(f.key as typeof filter)}
          >
            {f.label}
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
                {['Email', 'Connexion via', 'Profil praticien', 'Inscrit le', 'Dernière connexion', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const providerLabel = PROVIDER_ICON[r.provider] ?? r.provider;
                return (
                  <tr key={r.id}>
                    <td>
                      <span className="td-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem' }}>
                        {r.email}
                      </span>
                    </td>
                    <td>
                      <span className="td-mono" style={{ fontSize: '.7rem' }}>
                        {providerLabel}
                      </span>
                    </td>
                    <td>
                      {r.praticien ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <a
                            href={`https://from0tohero.dev/praticiens/${r.praticien.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--sky)', textDecoration: 'none' }}
                          >
                            @{r.praticien.slug}
                          </a>
                          <span className={`badge badge-${r.praticien.status}`} style={{ fontSize: '.58rem' }}>
                            {r.praticien.status}
                          </span>
                        </div>
                      ) : (
                        <span className="td-faint">—</span>
                      )}
                    </td>
                    <td>
                      <span className="td-faint">{fmtDate(r.created_at)}</span>
                    </td>
                    <td>
                      <span className="td-faint">{fmtDatetime(r.last_sign_in_at)}</span>
                    </td>
                    <td>
                      {r.praticien && (
                        <a
                          href={`/praticiens`}
                          className="btn btn-ghost btn-sm"
                          style={{ textDecoration: 'none' }}
                          onClick={e => { e.preventDefault(); router.push(`/praticiens?search=${r.praticien!.slug}`); }}
                        >
                          Voir profil
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">
              {search ? `Aucun résultat pour "${search}"` : 'Aucun utilisateur pour ce filtre.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UtilisateursRoute() {
  return <AuthGuard><UtilisateursPage /></AuthGuard>;
}
