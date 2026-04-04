'use client';
import { useEffect, useRef } from 'react';

export default function HeroParallax() {
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (orb1.current) orb1.current.style.transform = `translateY(${y * 0.18}px)`;
      if (orb2.current) orb2.current.style.transform = `translateY(${-y * 0.12}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div ref={orb1} className="hero-orb" style={{
        position: 'absolute', top: '15%', right: '-8%',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,.13) 0%, transparent 70%)',
        pointerEvents: 'none', willChange: 'transform',
      }} />
      <div ref={orb2} className="hero-orb-2" style={{
        position: 'absolute', bottom: '10%', left: '-12%',
        width: 640, height: 640, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,.11) 0%, transparent 70%)',
        pointerEvents: 'none', willChange: 'transform',
      }} />
    </>
  );
}
