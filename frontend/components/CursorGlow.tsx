'use client';
import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Désactiver sur tactile
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; el.style.opacity = '1'; };
    const onLeave = () => { el.style.opacity = '0'; };

    // Lerp pour un mouvement fluide
    const animate = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      el.style.left = cx + 'px';
      el.style.top  = cy + 'px';
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,.06) 0%, transparent 65%)',
        transform: 'translate(-50%, -50%)',
        opacity: 0,
        transition: 'opacity 0.4s ease',
        willChange: 'left, top',
      }}
    />
  );
}
