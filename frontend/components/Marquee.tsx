'use client';
import { useState } from 'react';

interface MarqueeProps {
  children: React.ReactNode[];
  speed?: number;      // secondes pour un cycle complet
  gap?: number;        // gap en px entre items
  itemWidth: number;   // largeur fixe de chaque item (obligatoire pour les flèches)
  itemHeight?: number; // hauteur fixe optionnelle pour uniformité
}

const BTN_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '1.5px solid var(--f-border)',
  background: 'var(--f-surface)',
  color: 'var(--f-text-2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  lineHeight: 1,
  boxShadow: '0 2px 8px rgba(0,0,0,.12)',
  transition: 'border-color .15s, color .15s',
  flexShrink: 0,
};

export default function Marquee({ children, speed = 30, gap = 16, itemWidth, itemHeight }: MarqueeProps) {
  const [paused, setPaused]   = useState(false);
  const [step, setStep]       = useState(0);   // offset en nombre d'items (0 = début)
  const [manual, setManual]   = useState(false);
  const count = children.length;
  const items = [...children, ...children]; // duplication pour loop seamless
  const stepPx = itemWidth + gap;

  function goNext() {
    setManual(true);
    setStep(s => (s <= -(count - 1) ? 0 : s - 1));
  }

  function goPrev() {
    setManual(true);
    setStep(s => (s >= 0 ? -(count - 1) : s + 1));
  }

  function resume() {
    setManual(false);
    setPaused(false);
    setStep(0);
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 10, paddingRight: 10 }}>
      {/* Flèche gauche */}
      <button
        style={{ ...BTN_STYLE, left: -10 }}
        onClick={goPrev}
        aria-label="Précédent"
      >‹</button>

      {/* Track */}
      <div
        style={{
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}
        onMouseEnter={() => { if (!manual) setPaused(true); }}
        onMouseLeave={() => { if (!manual) setPaused(false); }}
      >
        <div
          style={{
            display: 'flex',
            gap,
            alignItems: 'stretch',
            width: 'max-content',
            ...(manual ? {
              transform: `translateX(${step * stepPx}px)`,
              transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
            } : {
              animation: `marquee-scroll ${speed}s linear infinite`,
              animationPlayState: paused ? 'paused' : 'running',
            }),
          }}
        >
          {items.map((child, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: itemWidth,
                ...(itemHeight ? { height: itemHeight } : {}),
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Flèche droite */}
      <button
        style={{ ...BTN_STYLE, right: -10 }}
        onClick={goNext}
        aria-label="Suivant"
      >›</button>

      {/* Bouton reprendre défilement (mode manuel) */}
      {manual && (
        <div style={{ textAlign: 'center', marginTop: '.6rem' }}>
          <button
            onClick={resume}
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.58rem',
              letterSpacing: '.08em',
              color: 'var(--f-text-3)',
              border: '1px solid var(--f-border)',
              background: 'transparent',
              padding: '3px 12px',
              borderRadius: 99,
              cursor: 'pointer',
              transition: 'color .15s',
            }}
          >
            ▶ reprendre le défilement
          </button>
        </div>
      )}
    </div>
  );
}
