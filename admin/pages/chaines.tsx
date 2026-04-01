import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import EditModal from '@/components/EditModal';

type Chaine = {
  id: string;
  name: string;
  description?: string;
  url: string;
  subs?: string;
  ordre: number;
  active: boolean;
  created_at: string;
  [key: string]: unknown;
};

const EDIT_FIELDS = [
  { key: 'name',        label: 'Nom de la chaîne' },
  { key: 'description', label: 'Description (tags séparés par ·)' },
  { key: 'url',         label: 'URL YouTube', type: 'url' as const },
  { key: 'subs',        label: 'Abonnés / info (ex: 100k+ abonnés)' },
  { key: 'ordre',       label: 'Ordre d\'affichage (1 = premier)' },
];

const EMPTY_FORM = { name: '', description: '', url: '', subs: '', ordre: '0' };

function ChainesPage() {
  const [rows,    setRows]    = useState<Chaine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Chaine | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => {
    fetch('/api/content?table=chaines_youtube', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRows(data.sort((a, b) => a.ordre - b.ordre)); setLoading(false); })
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

  async function toggleActive(row: Chaine) {
    setToggling(row.id);
    const r = await fetch('/api/edit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table: 'chaines_youtube', id: row.id, data: { active: !row.active } }),
    });
    if (r.ok) setRows(prev => prev.map(c => c.id === row.id ? { ...c, active: !c.active } : c));
    setToggling(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    if (!form.name.trim() || !form.url.trim()) { setFormErr('Nom et URL sont requis.'); return; }
    setSaving(true);
    const r = await fetch('/api/chaines-insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ ...form, ordre: Number(form.ordre) || 0, active: true }),
    });
    const data = await r.json();
    if (!r.ok) { setFormErr(data.error || 'Erreur'); setSaving(false); return; }
    setRows(prev => [...prev, data].sort((a, b) => a.ordre - b.ordre));
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  function onSaved(updated: Record<string, unknown>) {
    setRows(prev =>
      prev.map(c => c.id === updated.id ? { ...c, ...updated } as Chaine : c)
          .sort((a, b) => a.ordre - b.ordre)
    );
  }

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
      </div>

      {/* Formulaire d'ajout */}
      <div className="table-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <p style={{ fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '1rem' }}>
          + Ajouter une chaîne
        </p>
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.75rem' }}>
          <input
            placeholder="Nom *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }}
          />
          <input
            placeholder="Description (ex: DevOps · Linux)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }}
          />
          <input
            placeholder="URL YouTube *"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }}
          />
          <input
            placeholder="Abonnés (ex: 100k+ abonnés)"
            value={form.subs}
            onChange={e => setForm(f => ({ ...f, subs: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }}
          />
          <input
            type="number"
            placeholder="Ordre (1 = premier)"
            value={form.ordre}
            onChange={e => setForm(f => ({ ...f, ordre: e.target.value }))}
            style={{ fontSize: '.75rem', padding: '.45rem .7rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)' }}
          />
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
                {['#', 'Nom', 'Description', 'Abonnés', 'Active', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} style={{ opacity: c.active ? 1 : 0.45 }}>
                  <td>
                    <span className="td-faint">{c.ordre}</span>
                  </td>
                  <td>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="td-primary"
                      style={{ color: 'var(--sky)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem' }}
                    >
                      <span style={{ color: '#ff0000', fontSize: '1rem' }}>▶</span>
                      {c.name}
                    </a>
                  </td>
                  <td>
                    <span className="td-faint">{c.description || '—'}</span>
                  </td>
                  <td>
                    <span className="td-mono">{c.subs || '—'}</span>
                  </td>
                  <td>
                    <button
                      className={`badge badge-${c.active ? 'approved' : 'rejected'}`}
                      style={{ cursor: 'pointer', border: 'none', background: 'none' }}
                      disabled={toggling === c.id}
                      onClick={() => toggleActive(c)}
                      title={c.active ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                    >
                      {toggling === c.id ? '…' : c.active ? 'active' : 'inactive'}
                    </button>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>
                      ✎ Modifier
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: '.4rem' }}
                      disabled={deleting === c.id}
                      onClick={() => deleteRow(c.id, c.name)}
                    >
                      {deleting === c.id ? '…' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="table-empty">Aucune chaîne. Ajoutez-en une ci-dessus.</div>
          )}
        </div>
      )}

      {editing && (
        <EditModal
          table="chaines_youtube"
          row={editing}
          fields={EDIT_FIELDS}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

export default function ChainesRoute() {
  return <AuthGuard><ChainesPage /></AuthGuard>;
}
