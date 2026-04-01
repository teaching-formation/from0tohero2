import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const NAV = [
  { href: '/',             label: 'Dashboard',    icon: '▦',  badge: false },
  { href: '/soumissions',  label: 'Soumissions',  icon: '◎',  badge: true  },
  { href: '/praticiens',   label: 'Praticiens',   icon: '◉',  badge: false },
  { href: '/articles',     label: 'Articles',     icon: '✍',  badge: false },
  { href: '/realisations', label: 'Réalisations', icon: '◆',  badge: false },
  { href: '/evenements',   label: 'Événements',   icon: '◷',  badge: false },
  { href: '/chaines',      label: 'Chaînes YouTube', icon: '▶', badge: false },
];

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const router   = useRouter();
  const [open, setOpen]           = useState(false);
  const [pendingCount, setPending] = useState(0);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [router.pathname]);

  // Fetch pending count for badge
  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') || '' : '';
    if (!token) return;
    fetch('/api/soumissions', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ status: string }>) => {
        if (Array.isArray(data)) {
          setPending(data.filter(s => s.status === 'pending').length);
        }
      })
      .catch(() => {});
  }, [router.pathname]);

  function logout() {
    sessionStorage.removeItem('admin_token');
    router.push('/login');
  }

  const SidebarContent = (
    <>
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.3rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            background: '#0d1117',
            border: '1.5px solid rgba(249,115,22,.4)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Geist Mono', 'Courier New', monospace",
              fontWeight: 700,
              fontSize: '.65rem',
              color: '#f97316',
              letterSpacing: '-.03em',
              lineHeight: 1,
              userSelect: 'none',
            }}>
              &gt;_
            </span>
          </span>
          <span className="sidebar-logo">
            from0tohero<span className="sidebar-logo-accent">.</span>
          </span>
        </div>
        <span className="sidebar-tag">// admin console</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>
        {NAV.map(n => (
          <a
            key={n.href}
            href={n.href}
            className={`nav-item${router.pathname === n.href ? ' active' : ''}`}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {n.badge && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="nav-item"
          onClick={logout}
          style={{ width: '100%', opacity: .65 }}
        >
          <span className="nav-icon">↩</span>
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="layout">
      {/* Mobile toggle button */}
      <button
        className="sidebar-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {SidebarContent}
      </aside>

      {/* Main content */}
      <main className="main">
        {children}
      </main>
    </div>
  );
}
