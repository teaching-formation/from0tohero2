'use client';
import { useRef, useState } from 'react';

interface MarqueeProps {
  children: React.ReactNode[];
  speed?: number; // secondes pour un cycle complet
  gap?: number;   // gap en px entre items
}

/**
 * Défilement horizontal infini — pause au hover.
 * Les enfants sont dupliqués pour un loop seamless.
 */
export default function Marquee({ children, speed = 30, gap = 16 }: MarqueeProps) {
  const [paused, setPaused] = useState(false);
  const items = [...children, ...children]; // duplication pour loop seamless

  return (
    <div
      style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        cursor: 'default',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        style={{
          display: 'flex',
          gap,
          width: 'max-content',
          animation: `marquee-scroll ${speed}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {items.map((child, i) => (
          <div key={i} style={{ flexShrink: 0 }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
