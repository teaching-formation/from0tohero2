'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
    // Check session
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const links = [
    { href: '/articles', label: 'Articles' },
    { href: '/praticiens', label: 'Praticiens' },
    { href: '/realisations', label: 'Réalisations' },
    { href: '/evenements', label: 'Événements' },
  ];

  return (
    <nav className="navbar" style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.95)',
      borderBottom: '1px solid var(--f-border)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1rem', color: 'var(--f-text-1)', letterSpacing: '-.01em' }}>
            from0tohero<span style={{ color: 'var(--f-orange)' }}>.dev</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }} className="desktop-nav">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.73rem',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              padding: '.4rem .8rem',
              color: pathname.startsWith(l.href) ? 'var(--f-sky)' : 'var(--f-text-2)',
              textDecoration: 'none',
              transition: 'color .15s',
            }}>
              {l.label}
            </Link>
          ))}
          <Link href="/soumettre" className="btn-f btn-f-primary" style={{ marginLeft: '1rem', fontSize: '.7rem', padding: '.5rem 1.1rem' }}>
            Soumettre
          </Link>
          <Link
            href={isLoggedIn ? '/mon-compte' : '/connexion'}
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.7rem',
              padding: '.5rem 1rem',
              borderRadius: 7,
              border: '1.5px solid var(--f-border)',
              color: 'var(--f-text-2)',
              textDecoration: 'none',
              transition: 'border-color .15s, color .15s',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoggedIn ? 'Mon espace' : 'Connexion'}
          </Link>
          <a href="https://github.com/diakite-data" target="_blank" rel="noreferrer" style={{ color: 'var(--f-text-3)', marginLeft: '.5rem', lineHeight: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2c-3.34.73-4.04-1.6-4.04-1.6-.54-1.4-1.33-1.77-1.33-1.77-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.3.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23.95-.27 1.97-.4 2.98-.4 1 0 2.03.13 2.97.4 2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.9 1.23 3.22 0 4.6-2.8 5.63-5.48 5.93.43.37.82 1.1.82 2.22v3.29c0 .32.22.68.83.57C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"/></svg>
          </a>
          <button onClick={toggleDark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-text-3)', marginLeft: '.25rem', fontSize: '1rem', lineHeight: 1 }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
}
