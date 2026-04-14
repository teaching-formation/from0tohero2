'use client';
import { useEffect, useState } from 'react';

const LINES = [
  '> initializing from0tohero.dev...',
  '> loading practitioners',
  '> mapping the tech scene',
  '> ready',
];

export default function SplashScreen() {
  const [visible, setVisible]       = useState(false);
  const [lineIdx, setLineIdx]        = useState(0);
  const [typed, setTyped]            = useState('');
  const [charIdx, setCharIdx]        = useState(0);
  const [curtainUp, setCurtainUp]    = useState(false);
  const [done, setDone]              = useState(false);

  // Afficher seulement au premier visit (une fois par session)
  useEffect(() => {
    const seen = sessionStorage.getItem('f2h_splash');
    if (seen) { setDone(true); return; }
    sessionStorage.setItem('f2h_splash', '1');
    setVisible(true);
  }, []);

  // Typewriter
  useEffect(() => {
    if (!visible || curtainUp) return;
    const line = LINES[lineIdx];
    if (!line) return;

    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setTyped(prev => prev + line[charIdx]);
        setCharIdx(c => c + 1);
      }, 28);
      return () => clearTimeout(t);
    }

    // Ligne finie
    if (lineIdx < LINES.length - 1) {
      const t = setTimeout(() => {
        setTyped('');
        setCharIdx(0);
        setLineIdx(i => i + 1);
      }, 320);
      return () => clearTimeout(t);
    }

    // Dernière ligne tapée → rideau
    const t = setTimeout(() => setCurtainUp(true), 600);
    return () => clearTimeout(t);
  }, [visible, charIdx, lineIdx, curtainUp]);

  // Fin de l'animation rideau
  useEffect(() => {
    if (!curtainUp) return;
    const t = setTimeout(() => setDone(true), 900);
    return () => clearTimeout(t);
  }, [curtainUp]);

  if (!visible || done) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pointerEvents: curtainUp ? 'none' : 'all',
      }}
    >
      {/* Panneau haut */}
      <div
        style={{
          flex: 1,
          background: '#0d1117',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '2rem',
          transform: curtainUp ? 'translateY(-100%)' : 'translateY(0)',
          transition: curtainUp ? 'transform .75s cubic-bezier(.76,0,.24,1)' : 'none',
        }}
      >
        {/* Logo centré */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: '#0d1117',
            border: '2px solid rgba(249,115,22,.6)',
            boxShadow: '0 0 32px rgba(249,115,22,.25)',
          }}>
            <span style={{
              fontFamily: "'Geist Mono', 'Courier New', monospace",
              fontWeight: 700, fontSize: '1.2rem', color: '#f97316',
              letterSpacing: '-.03em', userSelect: 'none',
            }}>
              &gt;_
            </span>
          </div>
          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontWeight: 700, fontSize: '1.1rem',
            color: '#f1f5f9',
            letterSpacing: '-.02em',
          }}>
            from0tohero<span style={{ color: '#f97316' }}>.dev</span>
          </span>
        </div>
      </div>

      {/* Panneau bas */}
      <div
        style={{
          flex: 1,
          background: '#0d1117',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '2rem',
          transform: curtainUp ? 'translateY(100%)' : 'translateY(0)',
          transition: curtainUp ? 'transform .75s cubic-bezier(.76,0,.24,1)' : 'none',
        }}
      >
        {/* Terminal typewriter */}
        <div style={{
          fontFamily: "'Geist Mono', 'Courier New', monospace",
          fontSize: '.8rem',
          color: '#38bdf8',
          letterSpacing: '.04em',
          minHeight: '1.4em',
        }}>
          {typed}
          <span style={{
            display: 'inline-block',
            width: 8, height: '1em',
            background: '#38bdf8',
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'blink .7s step-end infinite',
          }} />
        </div>
      </div>

      {/* Ligne centrale (séparation entre les deux panneaux) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0, right: 0,
        height: 1,
        background: 'rgba(249,115,22,.3)',
        transform: 'translateY(-50%)',
        zIndex: 1,
        opacity: curtainUp ? 0 : 1,
        transition: 'opacity .2s',
      }} />

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
