'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from '@/components/NotificationBell';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useTranslations } from 'next-intl';

const NAV_ITEMS = [
  {
    href: '/praticiens',
    key: 'praticiens' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    href: '/realisations',
    key: 'realisations' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    href: '/articles',
    key: 'articles' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/evenements',
    key: 'evenements' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/tips',
    key: 'tips' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
    ),
  },
  {
    href: '/collections',
    key: 'collections' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations('nav');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <nav className="navbar" style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled
        ? (dark ? 'rgba(13,17,23,0.82)' : 'rgba(241,245,249,0.82)')
        : (dark ? 'rgba(13,17,23,0.98)' : 'rgba(241,245,249,0.98)'),
      backdropFilter: scrolled ? 'blur(18px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(180%)' : 'none',
      borderBottom: '1px solid var(--f-border)',
      boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,.07)' : 'none',
      transition: 'background 0.3s ease, box-shadow 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 4vw',
        height: 60, display: 'flex', alignItems: 'stretch',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '.55rem',
          textDecoration: 'none', flexShrink: 0, paddingRight: '1.5rem',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 7,
            background: '#0d1117', border: '1.5px solid rgba(249,115,22,.4)', flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Geist Mono', monospace", fontWeight: 700,
              fontSize: '.72rem', color: '#f97316', letterSpacing: '-.03em',
              lineHeight: 1, userSelect: 'none',
            }}>
              &gt;_
            </span>
          </span>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: '.88rem', color: 'var(--f-text-1)', letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
            from0tohero<span style={{ color: 'var(--f-orange)' }}>.dev</span>
          </span>
        </Link>

        {/* Desktop — items iconiques centré */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
          {NAV_ITEMS.map(({ href, key, icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '2px',
                  padding: '0 .9rem',
                  textDecoration: 'none',
                  color: isActive ? 'var(--f-text-1)' : 'var(--f-text-3)',
                  borderBottom: isActive ? '2px solid var(--f-text-1)' : '2px solid transparent',
                  transition: 'color .15s, border-color .15s',
                  whiteSpace: 'nowrap',
                  minWidth: 64,
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--f-text-1)'; } }}
                onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--f-text-3)'; } }}
              >
                <span style={{ lineHeight: 1 }}>{icon}</span>
                <span style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.58rem',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  fontWeight: isActive ? 700 : 400,
                }}>
                  {t(key)}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', paddingLeft: '1rem', flexShrink: 0 }}>
          <Link href="/recherche" style={{
            color: pathname === '/recherche' ? 'var(--f-sky)' : 'var(--f-text-3)',
            padding: '.4rem .5rem', display: 'flex', alignItems: 'center',
            transition: 'color .15s', textDecoration: 'none',
          }} title={t('rechercher')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </Link>
          <Link href="/soumettre" className="btn-f btn-f-primary" style={{ fontSize: '.68rem', padding: '.45rem .9rem' }}>
            {t('soumettre')}
          </Link>
          {isLoggedIn && <NotificationBell />}
          <Link
            href={isLoggedIn ? '/mon-compte' : '/connexion'}
            style={{
              fontFamily: "'Geist Mono', monospace", fontSize: '.68rem',
              padding: '.45rem .9rem', borderRadius: 7,
              border: '1.5px solid var(--f-border)', color: 'var(--f-text-2)',
              textDecoration: 'none', transition: 'border-color .15s, color .15s',
              whiteSpace: 'nowrap',
              visibility: isLoggedIn === null ? 'hidden' : 'visible',
            }}
          >
            {isLoggedIn ? t('monEspace') : t('connexion')}
          </Link>
          <LocaleSwitcher />
          <button onClick={toggleDark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-text-3)', fontSize: '1rem', lineHeight: 1, padding: '.25rem' }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Mobile right */}
        <div className="mobile-nav-right" style={{ display: 'none', alignItems: 'center', gap: '.5rem' }}>
          {isLoggedIn && <NotificationBell />}
          <Link href="/recherche" style={{
            color: pathname === '/recherche' ? 'var(--f-sky)' : 'var(--f-text-3)',
            padding: '.25rem', display: 'flex', alignItems: 'center',
            textDecoration: 'none', transition: 'color .15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </Link>
          <button onClick={toggleDark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-text-3)', fontSize: '1rem', lineHeight: 1, padding: '.25rem' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '.4rem', color: 'var(--f-text-1)', display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center' }}
            aria-label="Menu"
          >
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--f-text-1)', borderRadius: 2, transition: 'transform .2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--f-text-1)', borderRadius: 2, transition: 'opacity .2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--f-text-1)', borderRadius: 2, transition: 'transform .2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: dark ? 'rgba(13,17,23,0.99)' : 'rgba(255,255,255,0.99)',
          borderBottom: '1px solid var(--f-border)',
          padding: '1rem 6vw 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '.25rem',
          boxShadow: '0 8px 24px rgba(0,0,0,.08)',
        }}>
          {NAV_ITEMS.map(({ href, key, icon }) => (
            <Link key={href} href={href} style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.82rem', letterSpacing: '.08em', textTransform: 'uppercase',
              padding: '.8rem .5rem',
              color: pathname.startsWith(href) ? 'var(--f-sky)' : 'var(--f-text-1)',
              textDecoration: 'none', borderBottom: '1px solid var(--f-border)',
              display: 'flex', alignItems: 'center', gap: '.75rem',
              fontWeight: pathname.startsWith(href) ? 700 : 400,
            }}>
              <span style={{ color: pathname.startsWith(href) ? 'var(--f-sky)' : 'var(--f-text-3)', opacity: .8 }}>{icon}</span>
              {t(key)}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/soumettre" className="btn-f btn-f-primary" style={{ fontSize: '.72rem', padding: '.6rem 1.2rem', flex: 1, justifyContent: 'center' }}>
              {t('soumettre')}
            </Link>
            <Link
              href={isLoggedIn ? '/mon-compte' : '/connexion'}
              style={{
                fontFamily: "'Geist Mono', monospace", fontSize: '.72rem',
                padding: '.6rem 1.2rem', borderRadius: 9,
                border: '1.5px solid var(--f-border)', color: 'var(--f-text-2)',
                textDecoration: 'none', flex: 1, textAlign: 'center',
                visibility: isLoggedIn === null ? 'hidden' : 'visible',
              }}
            >
              {isLoggedIn ? t('monEspace') : t('connexion')}
            </Link>
            <LocaleSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}
