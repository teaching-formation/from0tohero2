import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const NAV = [
  { href: '/',             label: 'Dashboard',       icon: '▦',  badge: false },
  { href: '/soumissions',  label: 'Soumissions',     icon: '◎',  badge: true  },
  { href: '/praticiens',   label: 'Praticiens',      icon: '◉',  badge: false },
  { href: '/articles',     label: 'Articles',        icon: '✍',  badge: false },
  { href: '/realisations', label: 'Réalisations',    icon: '◆',  badge: false },
  { href: '/evenements',   label: 'Événements',      icon: '◷',  badge: false },
  { href: '/chaines',      label: 'Chaînes YouTube', icon: '▶',  badge: false },
  { href: '/collections',  label: 'Collections',     icon: '◈',  badge: false },
];

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const router   = useRouter();
  const [open, setOpen]           = useState(false);
  const [pendingCount, setPending] = useState(0);
  const [isDark, setIsDark]       = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('admin_theme');
    setIsDark(saved !== 'light');
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('admin_theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('admin_theme', 'light');
    }
  }

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
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--text-3)', opacity: .5 }}>
          from0tohero // admin
        </span>
      </div>
    </>
  );

  return (
    <div className="layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="sidebar-toggle-inline"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 6,
            background: '#0d1117',
            border: '1.5px solid rgba(249,115,22,.4)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Geist Mono', 'Courier New', monospace",
              fontWeight: 700, fontSize: '.6rem',
              color: '#f97316', letterSpacing: '-.03em', lineHeight: 1,
            }}>&gt;_</span>
          </span>
          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontWeight: 700, fontSize: '.8rem',
            color: 'var(--text-1)', letterSpacing: '-.01em',
          }}>
            from0tohero<span style={{ color: '#f97316' }}>.</span>
          </span>
        </div>
      </div>

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
        {/* Top header */}
        <header className="topbar">
          <div className="topbar-section">
            {NAV.find(n => n.href === router.pathname)?.icon && (
              <span className="topbar-icon">
                {NAV.find(n => n.href === router.pathname)?.icon}
              </span>
            )}
            <span className="topbar-title">
              {NAV.find(n => n.href === router.pathname)?.label ?? 'Admin'}
            </span>
            {pendingCount > 0 && router.pathname !== '/soumissions' && (
              <a href="/soumissions" className="topbar-badge">
                {pendingCount} en attente
              </a>
            )}
          </div>
          <div className="topbar-right">
            <a href="https://from0tohero.dev" target="_blank" rel="noreferrer" className="topbar-link">
              ↗ Voir le site
            </a>
            <button className="topbar-theme" onClick={toggleTheme} title={isDark ? 'Mode clair' : 'Mode sombre'}>
              {isDark ? '☀' : '☾'}
            </button>
            <button className="topbar-logout" onClick={logout}>
              ↩ Déconnexion
            </button>
          </div>
        </header>
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
}
