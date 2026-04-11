'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from '@/components/NotificationBell';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useTranslations } from 'next-intl';

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = chargement
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations('nav');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Frosted glass au scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ferme le menu quand on change de page
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const links = [
    { href: '/praticiens',   label: t('praticiens') },
    { href: '/realisations', label: t('realisations') },
    { href: '/articles',     label: t('articles') },
    { href: '/evenements',   label: t('evenements') },
    { href: '/tips',         label: t('tips') },
  ];

  return (
    <nav className="navbar" style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled
        ? (dark ? 'rgba(13,17,23,0.75)' : 'rgba(241,245,249,0.75)')
        : (dark ? 'rgba(13,17,23,0.97)' : 'rgba(241,245,249,0.97)'),
      backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
      borderBottom: '1px solid var(--f-border)',
      boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,.06)' : 'none',
      transition: 'background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 6vw', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '.55rem', textDecoration: 'none', flexShrink: 0 }}>
          {/* Terminal icon mark */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 7,
            background: '#0d1117',
            border: '1.5px solid rgba(249,115,22,.4)',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Geist Mono', 'Courier New', monospace",
              fontWeight: 700,
              fontSize: '.72rem',
              color: '#f97316',
              letterSpacing: '-.03em',
              lineHeight: 1,
              userSelect: 'none',
            }}>
              &gt;_
            </span>
          </span>
          {/* Wordmark */}
          <span style={{ fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: '.9rem', color: 'var(--f-text-1)', letterSpacing: '-.02em' }}>
            from0tohero<span style={{ color: 'var(--f-orange)' }}>.dev</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
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
          <Link href="/recherche" style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: pathname === '/recherche' ? 'var(--f-sky)' : 'var(--f-text-3)',
            padding: '.4rem .6rem',
            display: 'flex',
            alignItems: 'center',
            transition: 'color .15s',
            textDecoration: 'none',
          }} title={t('rechercher')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </Link>
          <Link href="/soumettre" className="btn-f btn-f-primary" style={{ marginLeft: '1rem', fontSize: '.7rem', padding: '.5rem 1.1rem' }}>
            {t('soumettre')}
          </Link>
          {isLoggedIn && <NotificationBell />}
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
              visibility: isLoggedIn === null ? 'hidden' : 'visible',
            }}
          >
            {isLoggedIn ? t('monEspace') : t('connexion')}
          </Link>
          <LocaleSwitcher />
          <button onClick={toggleDark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-text-3)', marginLeft: '.25rem', fontSize: '1rem', lineHeight: 1 }}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Mobile right — dark toggle + hamburger */}
        <div className="mobile-nav-right" style={{ display: 'none', alignItems: 'center', gap: '.5rem' }}>
          {isLoggedIn && <NotificationBell />}
          <Link href="/recherche" style={{
            color: pathname === '/recherche' ? 'var(--f-sky)' : 'var(--f-text-3)',
            padding: '.25rem',
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            transition: 'color .15s',
          }} title={t('rechercher')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <span style={{ display: 'block', width: 22, height: 2, background: menuOpen ? 'var(--f-text-1)' : 'var(--f-text-1)', borderRadius: 2, transition: 'transform .2s, opacity .2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--f-text-1)', borderRadius: 2, transition: 'opacity .2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--f-text-1)', borderRadius: 2, transition: 'transform .2s, opacity .2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'absolute', top: 56, left: 0, right: 0,
          background: dark ? 'rgba(13,17,23,0.99)' : 'rgba(255,255,255,0.99)',
          borderBottom: '1px solid var(--f-border)',
          padding: '1rem 6vw 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '.25rem',
          boxShadow: '0 8px 24px rgba(0,0,0,.08)',
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.82rem',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              padding: '.8rem .5rem',
              color: pathname.startsWith(l.href) ? 'var(--f-sky)' : 'var(--f-text-1)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--f-border)',
            }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/soumettre" className="btn-f btn-f-primary" style={{ fontSize: '.72rem', padding: '.6rem 1.2rem', flex: 1, justifyContent: 'center' }}>
              {t('soumettre')}
            </Link>
            <Link
              href={isLoggedIn ? '/mon-compte' : '/connexion'}
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: '.72rem',
                padding: '.6rem 1.2rem',
                borderRadius: 9,
                border: '1.5px solid var(--f-border)',
                color: 'var(--f-text-2)',
                textDecoration: 'none',
                flex: 1,
                textAlign: 'center',
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
