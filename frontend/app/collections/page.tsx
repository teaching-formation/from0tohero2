'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import ShareButton from '@/components/ShareButton';

const PAGE_SIZE = 15;

type CollectionItem = { id: string; title: string; url?: string; description?: string };
type Collection = {
  id: string;
  title: string;
  description?: string;
  items: CollectionItem[];
  praticiens: { slug: string; name: string } | null;
};

export default function CollectionsPage() {
  const t = useTranslations('collectionsPage');
  const [cols, setCols]       = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { setVisible(PAGE_SIZE); }, [search]);

  useEffect(() => {
    supabase
      .from('collections')
      .select('id, title, description, items, praticiens(slug, name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCols((data as unknown as Collection[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = cols.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      (c.praticiens?.name ?? '').toLowerCase().includes(q) ||
      (c.praticiens?.slug ?? '').toLowerCase().includes(q) ||
      (Array.isArray(c.items) && c.items.some(i => i.title.toLowerCase().includes(q)))
    );
  });

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>{t('label')}</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 .6rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: 0, lineHeight: 1.7 }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Recherche */}
      <div style={{
        background: 'var(--f-surface)',
        border: '1px solid var(--f-border)',
        borderRadius: 14,
        padding: '1.25rem 1.35rem',
        marginBottom: '2rem',
      }}>
        <input
          className="f-input"
          type="search"
          placeholder={`🔍  ${t('searchPlaceholder')}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '100%' }}
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="f-card skeleton" style={{ height: 110 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-text-3)' }}>
          {t('empty')}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.slice(0, visible).map(col => {
              const items = Array.isArray(col.items) ? col.items : [];
              const isOpen = expanded.has(col.id);
              return (
                <div key={col.id} className="f-card" style={{ padding: '1.25rem 1.5rem' }}>
                  {/* Titre + actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .2rem 0' }}>
                        {col.title}
                      </p>
                      {col.description && (
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', margin: '0 0 .5rem 0', lineHeight: 1.6 }}>
                          {col.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                        {col.praticiens && (
                          <Link href={`/praticiens/${col.praticiens.slug}`} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', textDecoration: 'none' }}>
                            {t('by')} <span style={{ color: 'var(--f-sky)' }}>@{col.praticiens.slug}</span>
                          </Link>
                        )}
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '2px 8px', borderRadius: 4 }}>
                          {t('resources', { count: items.length })}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexShrink: 0 }}>
                      <ShareButton
                        url={col.praticiens ? `https://from0tohero.dev/praticiens/${col.praticiens.slug}` : 'https://from0tohero.dev/collections'}
                        title={`${col.title} · from0tohero`}
                        text={col.description}
                      />
                      {items.length > 0 && (
                        <button
                          onClick={() => toggleExpand(col.id)}
                          style={{
                            background: 'none', border: '1px solid var(--f-border)',
                            borderRadius: 7, padding: '4px 10px',
                            fontFamily: "'Geist Mono', monospace", fontSize: '.65rem',
                            color: 'var(--f-text-3)', cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {isOpen ? '▲' : '▼'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items (expand) */}
                  {isOpen && items.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--f-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {items.map((item, i) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem' }}>
                          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', flexShrink: 0, marginTop: '.15rem' }}>{i + 1}.</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.url ? (
                              <a href={item.url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', fontWeight: 600, color: 'var(--f-sky)', textDecoration: 'none' }}>
                                {item.title}
                              </a>
                            ) : (
                              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', fontWeight: 600, color: 'var(--f-text-1)' }}>{item.title}</span>
                            )}
                            {item.description && (
                              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: '.1rem 0 0 0' }}>{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="btn-f btn-f-secondary" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                {t('loadMore', { count: filtered.length - visible })}
              </button>
            </div>
          )}

          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: 'var(--f-text-3)', textAlign: 'center', marginTop: '1rem', letterSpacing: '.06em' }}>
            {t('counter', { visible: Math.min(visible, filtered.length), total: filtered.length })}
          </p>
        </>
      )}
    </div>
  );
}
