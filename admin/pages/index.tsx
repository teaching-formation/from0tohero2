import { useEffect, useState } from 'react';
import AuthGuard, { getToken } from '@/components/AuthGuard';
import type { Soumission } from '@/lib/supabase';

type ContentCounts = {
  praticiens:  number;
  articles:    number;
  realisations: number;
  evenements:  number;
};

type SoumStats = { pending: number; approved: number; rejected: number; total: number };

function Spinner() {
  return <div className="spinner" />;
}

function Dashboard() {
  const [soumStats, setSoumStats]     = useState<SoumStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [counts, setCounts]           = useState<ContentCounts>({ praticiens: 0, articles: 0, realisations: 0, evenements: 0 });
  const [recent, setRecent]           = useState<Soumission[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const token = getToken();
    const hdr = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/soumissions',              { headers: hdr }).then(r => r.json()),
      fetch('/api/content?table=praticiens', { headers: hdr }).then(r => r.json()),
      fetch('/api/content?table=articles',   { headers: hdr }).then(r => r.json()),
      fetch('/api/content?table=realisations',{ headers: hdr }).then(r => r.json()),
      fetch('/api/content?table=evenements', { headers: hdr }).then(r => r.json()),
    ]).then(([soums, prat, arts, real, evts]) => {
      if (Array.isArray(soums)) {
        setSoumStats({
          pending:  soums.filter((s: Soumission) => s.status === 'pending').length,
          approved: soums.filter((s: Soumission) => s.status === 'approved').length,
          rejected: soums.filter((s: Soumission) => s.status === 'rejected').length,
          total:    soums.length,
        });
        setRecent(soums.filter((s: Soumission) => s.status === 'pending').slice(0, 6));
      }
      setCounts({
        praticiens:   Array.isArray(prat) ? prat.filter((r: { status: string }) => r.status === 'approved').length : 0,
        articles:     Array.isArray(arts) ? arts.filter((r: { status: string }) => r.status === 'approved').length : 0,
        realisations: Array.isArray(real) ? real.filter((r: { status: string }) => r.status === 'approved').length : 0,
        evenements:   Array.isArray(evts) ? evts.filter((r: { status: string }) => r.status === 'approved').length : 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const TYPE_COLOR: Record<string, string> = {
    praticien:   '#38bdf8',
    article:     '#f97316',
    realisation: '#34d399',
    evenement:   '#a78bfa',
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">// vue d&apos;ensemble</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        {soumStats.pending > 0 && (
          <a href="/soumissions" className="btn btn-primary" style={{ alignSelf: 'center' }}>
            {soumStats.pending} en attente →
          </a>
        )}
      </div>

      {loading ? (
        <div className="loading-state"><Spinner />Chargement des données…</div>
      ) : (
        <>
          {/* Soumissions stats */}
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.58rem',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: '.85rem',
          }}>
            Soumissions
          </p>
          <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
            {[
              { label: 'En attente',  value: soumStats.pending,  color: 'var(--orange)', href: '/soumissions', glow: '#f97316' },
              { label: 'Approuvées', value: soumStats.approved, color: 'var(--green)',  href: '/soumissions', glow: '#34d399' },
              { label: 'Rejetées',   value: soumStats.rejected, color: 'var(--red)',    href: '/soumissions', glow: '#f87171' },
              { label: 'Total',      value: soumStats.total,    color: 'var(--sky)',    href: '/soumissions', glow: '#38bdf8' },
            ].map(s => (
              <a
                key={s.label}
                href={s.href}
                className="stat-card"
                style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}
              >
                <div
                  className="stat-card-glow"
                  style={{ background: s.glow }}
                />
                <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </a>
            ))}
          </div>

          {/* Content stats */}
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.58rem',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: '.85rem',
          }}>
            Contenu publié
          </p>
          <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
            {[
              { label: 'Praticiens',   value: counts.praticiens,   href: '/praticiens',   color: 'var(--sky)',    glow: '#38bdf8' },
              { label: 'Articles',     value: counts.articles,     href: '/articles',     color: 'var(--orange)', glow: '#f97316' },
              { label: 'Réalisations', value: counts.realisations, href: '/realisations', color: 'var(--green)',  glow: '#34d399' },
              { label: 'Événements',   value: counts.evenements,   href: '/evenements',   color: 'var(--violet)', glow: '#a78bfa' },
            ].map(s => (
              <a
                key={s.label}
                href={s.href}
                className="stat-card"
                style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}
              >
                <div
                  className="stat-card-glow"
                  style={{ background: s.glow }}
                />
                <div className="stat-num" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </a>
            ))}
          </div>

          {/* Recent pending */}
          {recent.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                <p style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.6rem',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  margin: 0,
                }}>
                  En attente de modération
                </p>
                <a href="/soumissions" style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.6rem',
                  color: 'var(--sky)',
                  textDecoration: 'none',
                  letterSpacing: '.05em',
                }}>
                  Voir tout →
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {recent.map(s => {
                  const title = s.type === 'praticien'
                    ? String(s.payload.name ?? '—')
                    : String(s.payload.title ?? '—');
                  const color = TYPE_COLOR[s.type] || 'var(--text-3)';
                  return (
                    <a key={s.id} href="/soumissions" className="recent-item">
                      <span
                        className="badge"
                        style={{
                          color,
                          borderColor: `${color}33`,
                          background: `${color}11`,
                          flexShrink: 0,
                        }}
                      >
                        {s.type}
                      </span>
                      <span style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: '.85rem',
                        color: 'var(--text-1)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {title}
                      </span>
                      <span style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.6rem',
                        color: 'var(--text-3)',
                        flexShrink: 0,
                      }}>
                        {new Date(s.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span style={{ color: 'var(--text-4)', fontSize: '.75rem', flexShrink: 0 }}>›</span>
                    </a>
                  );
                })}
              </div>

              {soumStats.pending > 6 && (
                <p style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.62rem',
                  color: 'var(--text-3)',
                  marginTop: '.85rem',
                  textAlign: 'center',
                }}>
                  + {soumStats.pending - 6} autres en attente
                </p>
              )}
            </div>
          )}

          {recent.length === 0 && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
              <span style={{ fontSize: '1.25rem' }}>✓</span>
              <div>
                <p style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: '.9rem',
                  color: 'var(--green)',
                  marginBottom: '.2rem',
                }}>
                  File d&apos;attente vide
                </p>
                <p style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.65rem',
                  color: 'var(--text-3)',
                }}>
                  Aucune soumission en attente de modération.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return <AuthGuard><Dashboard /></AuthGuard>;
}
