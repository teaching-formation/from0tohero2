'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = {
  tipId: string;
  type: string;
  category: string;
  content: string;
  typeColor: string;
  praticienSlug?: string;
};

export default function TipCard({ tipId, type, category, content, typeColor, praticienSlug }: Props) {
  const router = useRouter();

  return (
    <div
      className="f-card f-card-hover"
      style={{ padding: '1.1rem 1.25rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '.55rem', cursor: 'pointer' }}
      onClick={() => router.push(`/tips#tip-${tipId}`)}
    >
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', letterSpacing: '.08em', color: typeColor, border: `1px solid currentColor`, padding: '2px 7px', borderRadius: 4 }}>
          {type}
        </span>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 7px', borderRadius: 4 }}>
          {category}
        </span>
      </div>
      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.76rem', color: 'var(--f-text-1)', margin: 0, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
        {content}
      </p>
      {praticienSlug && (
        <Link
          href={`/praticiens/${praticienSlug}`}
          style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', textDecoration: 'none', marginTop: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          @{praticienSlug}
        </Link>
      )}
    </div>
  );
}
