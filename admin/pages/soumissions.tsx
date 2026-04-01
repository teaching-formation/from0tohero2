import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import type { Soumission } from '@/lib/supabase';

const TYPE_COLOR: Record<string, string> = {
  praticien:   '#38bdf8',
  article:     '#f97316',
  realisation: '#34d399',
  evenement:   '#a78bfa',
};

function getTitle(s: Soumission): string {
  return s.type === 'praticien'
    ? String(s.payload.name ?? '—')
    : String(s.payload.title ?? '—');
}

function getSub(s: Soumission): string {
  const p = s.payload;
  if (s.type === 'praticien')   return [p.role, p.pays].filter(Boolean).join(' · ') || '—';
  if (s.type === 'article')     return [p.category, p.source].filter(Boolean).join(' · ') || '—';
  if (s.type === 'evenement')   return [p.type, p.pays, p.date_debut].filter(Boolean).join(' · ') || '—';
  return [p.category, p.type].filter(Boolean).join(' · ') || '—';
}

function PayloadView({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload).filter(([, v]) => v !== null && v !== '' && v !== undefined);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.6rem' }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '.6rem .75rem',
        }}>
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.55rem',
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: '.3rem',
          }}>
            {k}
          </p>
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.72rem',
            color: 'var(--text-1)',
            wordBreak: 'break-all',
            lineHeight: 1.5,
          }}>
            {Array.isArray(v) ? v.join(', ') : String(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

type ConfirmState = { s: Soumission; action: 'approve' | 'reject' } | null;

function SoumissionsPage() {
  const [all, setAll]             = useState<Soumission[]>([]);
  const [filter, setFilter]       = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [acting, setActing]       = useState<string | null>(null);
  const [actError, setActError]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [confirm, setConfirm]     = useState<ConfirmState>(null);

  useEffect(() => {
    fetch('/api/soumissions', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then((data: Soumission[]) => {
        if (Array.isArray(data)) setAll(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function deleteSoumission(id: string) {
    if (!window.confirm('Supprimer définitivement cette soumission ?')) return;
    setDeleting(id);
    const r = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ table: 'soumissions', id }),
    });
    if (!r.ok) { setDeleting(null); alert('Erreur lors de la suppression.'); return; }
    setAll(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  }

  async function act(action: 'approve' | 'reject', s: Soumission) {
    setConfirm(null);
    setActing(s.id);
    setActError(null);
    const r = await fetch('/api/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ action, id: s.id, type: s.type, payload: s.payload, note }),
    });
    if (!r.ok) {
      const json = await r.json().catch(() => ({ error: 'Erreur serveur' }));
      setActError(json.error || 'Erreur lors de l\'action.');
      setActing(null);
      return;
    }
    setAll(prev =>
      prev.map(x =>
        x.id === s.id
          ? { ...x, status: action === 'approve' ? 'approved' : 'rejected' }
          : x
      )
    );
    setActing(null);
    setNote('');
    setExpanded(null);
  }

  const pending  = all.filter(s => s.status === 'pending').length;
  const approved = all.filter(s => s.status === 'approved').length;
  const rejected = all.filter(s => s.status === 'rejected').length;

  const STATUS_FILTERS = [
    { key: 'pending',  label: 'En attente', count: pending,  activeClass: 'active-orange' },
    { key: 'approved', label: 'Approuvées', count: approved, activeClass: 'active-green' },
    { key: 'rejected', label: 'Rejetées',   count: rejected, activeClass: 'active-red' },
    { key: 'all',      label: 'Toutes',     count: all.length, activeClass: 'active-sky' },
  ];

  const TYPES = ['all', 'praticien', 'article', 'realisation', 'evenement'];

  const filtered = all
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => typeFilter === 'all' || s.type === typeFilter);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">// modération</p>
          <h1 className="page-title">
            Soumissions
            <span className="page-title-count">({all.length})</span>
          </h1>
        </div>
        {pending > 0 && (
          <span className="badge badge-orange" style={{ fontSize: '.65rem', padding: '5px 12px' }}>
            {pending} en attente
          </span>
        )}
      </div>

      {/* Status filters */}
      <div className="filter-row">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-pill${filter === f.key ? ` ${f.activeClass}` : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.count > 0 && (
              <span style={{ marginLeft: '.35rem', opacity: .7 }}>({f.count})</span>
            )}
          </button>
        ))}
        <div className="divider" style={{ margin: '0 .2rem' }} />
        {TYPES.map(t => (
          <button
            key={t}
            className={`filter-pill${typeFilter === t ? ' active-sky' : ''}`}
            onClick={() => setTypeFilter(t)}
            style={t !== 'all' && typeFilter !== t ? { color: TYPE_COLOR[t], borderColor: `${TYPE_COLOR[t]}33` } : undefined}
          >
            {t === 'all' ? 'Tous types' : t}
          </button>
        ))}
      </div>

      {/* Action error */}
      {actError && (
        <div style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '.72rem',
          color: 'var(--red)',
          background: 'var(--red-bg)',
          border: '1px solid var(--red-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '.6rem .85rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          ⚠ {actError}
          <button onClick={() => setActError(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '.9rem' }}>✕</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Chargement des soumissions…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '.78rem',
          color: 'var(--text-3)',
          padding: '3rem 0',
          textAlign: 'center',
        }}>
          {filter === 'pending'
            ? 'Aucune soumission en attente. Tout est à jour.'
            : 'Aucune soumission pour ce filtre.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {filtered.map(s => {
            const isExpanded = expanded === s.id;
            const color = TYPE_COLOR[s.type] || 'var(--text-3)';
            const isActing = acting === s.id;

            return (
              <div
                key={s.id}
                className={`soum-card${s.status === 'approved' ? ' soum-approved' : s.status === 'rejected' ? ' soum-rejected' : ''}`}
              >
                {/* Card header row */}
                <div
                  className="soum-card-header"
                  onClick={() => setExpanded(isExpanded ? null : s.id)}
                >
                  {/* Type badge */}
                  <span
                    className="badge"
                    style={{
                      color,
                      borderColor: `${color}33`,
                      background: `${color}0f`,
                      flexShrink: 0,
                    }}
                  >
                    {s.type}
                  </span>

                  {/* Title + sub */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="soum-title">{getTitle(s)}</p>
                    <p className="soum-sub">{getSub(s)}</p>
                  </div>

                  {/* Right controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexShrink: 0, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.58rem',
                      color: 'var(--text-3)',
                    }}>
                      {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </span>

                    {s.status === 'pending' ? (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={isActing}
                          onClick={e => { e.stopPropagation(); setConfirm({ s, action: 'approve' }); }}
                        >
                          {isActing ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />…</> : '✓ Approuver'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={isActing}
                          onClick={e => { e.stopPropagation(); setConfirm({ s, action: 'reject' }); }}
                        >
                          ✕ Rejeter
                        </button>
                      </>
                    ) : (
                      <span className={`badge badge-${s.status}`}>
                        {s.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                      </span>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={deleting === s.id}
                      title="Supprimer la soumission"
                      onClick={e => { e.stopPropagation(); deleteSoumission(s.id); }}
                      style={{ opacity: .7 }}
                    >
                      {deleting === s.id ? '…' : '🗑'}
                    </button>

                    <button
                      className="btn-icon"
                      onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : s.id); }}
                      aria-label={isExpanded ? 'Réduire' : 'Développer'}
                      style={{ fontSize: '.7rem', border: 'none', background: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '.25rem' }}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="soum-card-body">
                    <p style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.58rem',
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: 'var(--text-3)',
                      marginBottom: '.75rem',
                    }}>
                      Données du formulaire
                    </p>

                    <PayloadView payload={s.payload} />

                    {s.status === 'pending' && (
                      <div style={{ marginTop: '1.1rem' }}>
                        <p style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '.58rem',
                          letterSpacing: '.1em',
                          textTransform: 'uppercase',
                          color: 'var(--text-3)',
                          marginBottom: '.5rem',
                        }}>
                          Note admin (optionnelle)
                        </p>
                        <textarea
                          rows={2}
                          placeholder="Raison du rejet, commentaire…"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ maxWidth: 420, resize: 'vertical' }}
                        />
                      </div>
                    )}

                    {s.note_admin && (
                      <div style={{
                        marginTop: '1rem',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '.75rem',
                      }}>
                        <p style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '.58rem',
                          letterSpacing: '.08em',
                          textTransform: 'uppercase',
                          color: 'var(--text-3)',
                          marginBottom: '.35rem',
                        }}>
                          Note admin
                        </p>
                        <p style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '.72rem',
                          color: 'var(--text-2)',
                          lineHeight: 1.6,
                        }}>
                          {s.note_admin}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <>
          <div className="modal-overlay" onClick={() => setConfirm(null)} />
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {confirm.action === 'approve' ? 'Approuver la soumission' : 'Rejeter la soumission'}
              </h2>
              <button className="modal-close" onClick={() => setConfirm(null)}>✕</button>
            </div>

            <p style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.72rem',
              color: 'var(--text-2)',
              lineHeight: 1.6,
            }}>
              Vous êtes sur le point de{' '}
              <span style={{ color: confirm.action === 'approve' ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                {confirm.action === 'approve' ? 'approuver' : 'rejeter'}
              </span>{' '}
              <span style={{ color: 'var(--text-1)' }}>{getTitle(confirm.s)}</span>.
              Cette action est définitive.
            </p>

            {confirm.action === 'reject' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '.5rem' }}>
                  Raison du rejet (envoyée par email) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Le contenu ne correspond pas aux critères de la plateforme…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button
                className={`btn ${confirm.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => act(confirm.action, confirm.s)}
              >
                {confirm.action === 'approve' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SoumissionsRoute() {
  return <AuthGuard><SoumissionsPage /></AuthGuard>;
}
