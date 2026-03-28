'use client';
import { useState } from 'react';

type Props = {
  name: string;
  photoUrl?: string | null;
  size?: number;
  radius?: number;
  fontSize?: string;
};

export default function Avatar({ name, photoUrl, size = 52, radius = 10, fontSize = '.78rem' }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size,
          borderRadius: radius,
          objectFit: 'cover',
          flexShrink: 0,
          border: '1.5px solid var(--f-border)',
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      background: 'var(--f-sky-bg)',
      border: '1.5px solid var(--f-sky-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Syne', sans-serif",
      fontSize, letterSpacing: '.05em', fontWeight: 800,
      color: 'var(--f-sky)', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}
