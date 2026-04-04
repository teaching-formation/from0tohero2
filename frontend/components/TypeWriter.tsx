'use client';
import { useEffect, useState } from 'react';

type Props = {
  text: string;
  startDelay?: number;
  speed?: number;
};

export default function TypeWriter({ text, startDelay = 550, speed = 70 }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(text); setShowCursor(false); return;
    }
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          // curseur clignote 2s puis disparaît
          setTimeout(() => setShowCursor(false), 2200);
        }
      }, speed);
    }, startDelay);

    return () => { clearTimeout(start); clearInterval(interval); };
  }, [text, startDelay, speed]);

  return (
    <>
      <span style={{
        background: 'linear-gradient(135deg, var(--f-sky) 0%, #7dd3fc 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>{displayed}</span>
      {showCursor && (
        <span className="tw-cursor" />
      )}
    </>
  );
}
