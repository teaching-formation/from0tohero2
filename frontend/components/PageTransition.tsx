'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    // Pas d'animation au premier chargement
    if (first.current) { first.current = false; return; }
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const anim = el.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 280, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }
    );
    // Annuler l'animation quand elle est finie : cela retire le transform persistant
    // qui crée un stacking context et casse position:fixed (modals, widgets)
    anim.onfinish = () => anim.cancel();
  }, [pathname]);

  return <div ref={ref}>{children}</div>;
}
