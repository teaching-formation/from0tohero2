'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import FlagImg from '@/components/FlagImg';

/* ── Couleurs catégorie ─────────────────────────────────────── */
const CAT_COLOR: Record<string, string> = {
  data: 'var(--f-sky)', devops: '#a78bfa', cloud: 'var(--f-sky)',
  ia: 'var(--f-orange)', cyber: '#f87171', frontend: 'var(--f-green)',
  backend: '#a78bfa', fullstack: 'var(--f-orange)', mobile: 'var(--f-green)',
  web3: '#a78bfa', embedded: 'var(--f-sky)', mlops: '#f472b6', autre: 'var(--f-text-3)',
};

const SOURCE_ICON: Record<string, string> = {
  medium: 'M', linkedin: 'in', devto: 'DEV', hashnode: 'H',
  substack: '◎', youtube: '▷', blog: '◧', autre: '◦',
};

const TYPE_COLOR: Record<string, string> = {
  tip: 'var(--f-sky)', TIL: 'var(--f-green)', snippet: 'var(--f-orange)',
};

const SUGGESTIONS = ['kafka', 'python', 'data engineering', 'devops', 'dashboard'];

/* ── Types résultats ────────────────────────────────────────── */
type PraticienResult = {
  slug: string; name: string; role: string;
  country: string; photo_url?: string; stack: string[]; categories: string[];
};
type RealisationResult = {
  slug: string; title: string; category: string; type: string;
  stack: string[]; demo_url?: string; repo_url?: string;
  praticiens: { slug: string; name: string } | null;
};
type ArticleResult = {
  slug: string; title: string; author: string; author_country?: string;
  category: string; source: string; external_url: string;
};
type TipResult = {
  id: string; content: string; type: string; category: string;
  praticiens: { slug: string; name: string } | null;
};

type Results = {
  praticiens: PraticienResult[];
  realisations: RealisationResult[];
  articles: ArticleResult[];
  tips: TipResult[];
};

/* ══════════════════════════════════════════════════════════════ */
export default function RecherchePage() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  /* Lire ?q= au montage */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    if (q) { setQuery(q); search(q); }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Debounce */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults(null);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }
    debounceRef.current = setTimeout(() => { search(query); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function search(q: string) {
    setLoading(true);
    window.history.replaceState(null, '', `?q=${encodeURIComponent(q)}`);

    const pattern = `%${q}%`;

    const [
      { data: praticiens },
      { data: realisations },
      { data: articles },
      { data: tips },
    ] = await Promise.all([
      supabase
        .from('praticiens')
        .select('slug,name,role,country,photo_url,stack,categories')
        .or(`name.ilike.${pattern},role.ilike.${pattern},bio.ilike.${pattern}`)
        .eq('status', 'approved')
        .limit(6),
      supabase
        .from('realisations')
        .select('slug,title,category,type,stack,demo_url,repo_url,praticiens(slug,name)')
        .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
        .eq('status', 'approved')
        .limit(6),
      supabase
        .from('articles')
        .select('slug,title,author,author_country,category,source,external_url')
        .or(`title.ilike.${pattern},author.ilike.${pattern},excerpt.ilike.${pattern}`)
        .eq('status', 'approved')
        .limit(6),
      supabase
        .from('tips')
        .select('id,content,type,category,praticiens(slug,name)')
        .ilike('content', pattern)
        .eq('status', 'approved')
        .limit(4),
    ]);

    setResults({
      praticiens:  (praticiens  as PraticienResult[]  | null) ?? [],
      realisations:(realisations as RealisationResult[] | null) ?? [],
      articles:    (articles    as ArticleResult[]    | null) ?? [],
      tips:        (tips        as TipResult[]        | null) ?? [],
    });
    setLoading(false);
  }

  const total = results
    ? results.praticiens.length + results.realisations.length + results.articles.length + results.tips.length
    : 0;

  /* ── Rendu ─────────────────────────────────────────────────── */
  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header / Input ── */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <span className="f-label" style={{ marginBottom: '.6rem', display: 'block' }}>// recherche</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 1.75rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          Recherche globale
        </h1>

        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          {/* Icône loupe */}
          <span style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--f-text-3)', display: 'flex', alignItems: 'center', pointerEvents: 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            className="f-input"
            type="search"
            placeholder="Chercher un praticien, une réalisation, un article..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.75rem',
              fontSize: '1rem',
              height: 52,
              boxSizing: 'border-box',
            }}
          />
          {loading && (
            <span style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--f-text-3)', fontFamily: "'Geist Mono', monospace", fontSize: '.7rem',
            }}>
              ...
            </span>
          )}
        </div>
      </div>

      {/* ── État vide (query < 2) ── */}
      {query.length < 2 && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{
            fontFamily: "'Geist Mono', monospace", fontSize: '.85rem',
            color: 'var(--f-text-3)', marginBottom: '1.5rem', lineHeight: 1.7,
          }}>
            Cherche un praticien, une stack, un projet...
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.72rem',
                  letterSpacing: '.06em',
                  padding: '.45rem 1rem',
                  borderRadius: 99,
                  border: '1.5px solid var(--f-border)',
                  background: 'var(--f-surface)',
                  color: 'var(--f-text-2)',
                  cursor: 'pointer',
                  transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--f-sky)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--f-sky)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--f-border)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--f-text-2)';
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chargement ── */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="f-card" style={{ height: 120, borderRadius: 12, opacity: .5, animation: 'pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {/* ── Résultats ── */}
      {!loading && results && (
        <>
          {/* Compteur */}
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.72rem',
            color: total > 0 ? 'var(--f-text-3)' : 'var(--f-text-3)',
            letterSpacing: '.05em',
            marginBottom: '2.5rem',
          }}>
            {total > 0
              ? `// ${total} résultat${total > 1 ? 's' : ''} pour « ${query} »`
              : `// Aucun résultat pour « ${query} »`}
          </p>

          {/* ── Praticiens ── */}
          {results.praticiens.length > 0 && (
            <Section title="Praticiens" count={results.praticiens.length}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
                {results.praticiens.map(p => {
                  const primaryCat = p.categories?.[0] || 'autre';
                  const catColor = CAT_COLOR[primaryCat] || 'var(--f-text-3)';
                  return (
                    <Link key={p.slug} href={`/praticiens/${p.slug}`} className="f-card-link" style={{ display: 'flex' }}>
                      <article className="f-card f-card-hover" style={{
                        display: 'flex', alignItems: 'center', gap: '.9rem',
                        padding: '1.1rem 1.25rem', position: 'relative', overflow: 'hidden', flex: 1,
                      }}>
                        {/* Bande couleur */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                          background: `linear-gradient(90deg, ${catColor}, transparent)`,
                          borderRadius: '12px 12px 0 0', opacity: .8,
                        }} />
                        <Avatar name={p.name} photoUrl={p.photo_url} size={44} radius={10} fontSize=".7rem" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontFamily: "'Syne', sans-serif", fontWeight: 800,
                            fontSize: '.95rem', color: 'var(--f-text-1)',
                            margin: 0, letterSpacing: '-.01em', lineHeight: 1.2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{p.name}</p>
                          <p style={{
                            fontFamily: "'Geist Mono', monospace", fontSize: '.65rem',
                            color: catColor, margin: '.15rem 0 0 0', lineHeight: 1.3, opacity: .9,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{p.role}</p>
                          {p.stack?.length > 0 && (
                            <div style={{ display: 'flex', gap: '.25rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
                              {p.stack.slice(0, 3).map(s => (
                                <span key={s} className="f-tag" style={{ fontSize: '.56rem' }}>{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <FlagImg country={p.country} size={16} />
                      </article>
                    </Link>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── Réalisations ── */}
          {results.realisations.length > 0 && (
            <Section title="Réalisations" count={results.realisations.length}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
                {results.realisations.map(r => {
                  const catColor = CAT_COLOR[r.category] || 'var(--f-text-3)';
                  const href = r.demo_url || r.repo_url || `/realisations/${r.slug}`;
                  const isExternal = !!(r.demo_url || r.repo_url);
                  const inner = (
                    <article className="f-card f-card-hover" style={{
                      display: 'flex', flexDirection: 'column', gap: '.75rem',
                      padding: '1.25rem', position: 'relative', overflow: 'hidden', flex: 1,
                    }}>
                      {/* Bande couleur */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${catColor}, transparent)`,
                        borderRadius: '12px 12px 0 0', opacity: .8,
                      }} />
                      {/* Type badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.15rem' }}>
                        <span style={{
                          fontFamily: "'Geist Mono', monospace", fontSize: '.58rem',
                          letterSpacing: '.09em', textTransform: 'uppercase',
                          color: catColor, border: `1px solid ${catColor}33`,
                          background: `${catColor}0d`, padding: '3px 9px',
                          borderRadius: 99, fontWeight: 600,
                        }}>{r.type}</span>
                      </div>
                      {/* Titre */}
                      <h3 style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 800,
                        fontSize: '.98rem', color: 'var(--f-text-1)',
                        margin: 0, letterSpacing: '-.01em', lineHeight: 1.3,
                      }}>{r.title}</h3>
                      {/* Stack */}
                      {r.stack?.length > 0 && (
                        <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
                          {r.stack.slice(0, 3).map(s => (
                            <span key={s} className="f-tag" style={{ fontSize: '.56rem' }}>{s}</span>
                          ))}
                          {r.stack.length > 3 && (
                            <span className="f-tag" style={{ fontSize: '.56rem', color: 'var(--f-text-3)' }}>+{r.stack.length - 3}</span>
                          )}
                        </div>
                      )}
                      {/* Auteur */}
                      {r.praticiens && (
                        <p style={{
                          fontFamily: "'Geist Mono', monospace", fontSize: '.65rem',
                          color: 'var(--f-text-3)', margin: 0,
                        }}>
                          @{r.praticiens.name}
                        </p>
                      )}
                    </article>
                  );
                  return isExternal ? (
                    <a key={r.slug} href={href} target="_blank" rel="noreferrer" className="f-card-link" style={{ display: 'flex' }}>
                      {inner}
                    </a>
                  ) : (
                    <Link key={r.slug} href={href} className="f-card-link" style={{ display: 'flex' }}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── Articles ── */}
          {results.articles.length > 0 && (
            <Section title="Articles" count={results.articles.length}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
                {results.articles.map(a => {
                  const catColor = CAT_COLOR[a.category] || 'var(--f-text-3)';
                  const srcKey = (a.source || '').toLowerCase();
                  const srcIcon = SOURCE_ICON[srcKey] || '◧';
                  return (
                    <a key={a.slug} href={a.external_url} target="_blank" rel="noreferrer" className="f-card-link" style={{ display: 'flex' }}>
                      <article className="f-card f-card-hover" style={{
                        display: 'flex', flexDirection: 'column', gap: '.75rem',
                        padding: '1.25rem', position: 'relative', overflow: 'hidden', flex: 1,
                      }}>
                        {/* Bande couleur */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                          background: `linear-gradient(90deg, ${catColor}, transparent)`,
                          borderRadius: '12px 12px 0 0', opacity: .8,
                        }} />
                        {/* Source badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.15rem' }}>
                          <span style={{
                            fontFamily: "'Geist Mono', monospace", fontSize: '.58rem',
                            letterSpacing: '.07em', color: 'var(--f-text-3)',
                            border: '1px solid var(--f-border)', padding: '3px 9px',
                            borderRadius: 99, fontWeight: 600,
                          }}>{srcIcon} {a.source}</span>
                        </div>
                        {/* Titre */}
                        <h3 style={{
                          fontFamily: "'Syne', sans-serif", fontWeight: 800,
                          fontSize: '.98rem', color: 'var(--f-text-1)',
                          margin: 0, letterSpacing: '-.01em', lineHeight: 1.3,
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>{a.title}</h3>
                        {/* Auteur + pays */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          {a.author_country && <FlagImg country={a.author_country} size={16} />}
                          <span style={{
                            fontFamily: "'Geist Mono', monospace", fontSize: '.65rem',
                            color: catColor, opacity: .85,
                          }}>{a.author}</span>
                        </div>
                        {/* Footer */}
                        <div style={{
                          paddingTop: '.6rem', borderTop: '1px solid var(--f-border)',
                          display: 'flex', justifyContent: 'flex-end',
                        }}>
                          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: catColor, opacity: .8 }}>
                            Lire →
                          </span>
                        </div>
                      </article>
                    </a>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ── Tips ── */}
          {results.tips.length > 0 && (
            <Section title="Tips" count={results.tips.length}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {results.tips.map(t => {
                  const typeColor = TYPE_COLOR[t.type] || 'var(--f-sky)';
                  return (
                    <article key={t.id} className="f-card" style={{
                      display: 'flex', flexDirection: 'column', gap: '.75rem',
                      padding: '1.25rem', position: 'relative', overflow: 'hidden',
                    }}>
                      {/* Bande couleur */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${typeColor}, transparent)`,
                        borderRadius: '12px 12px 0 0', opacity: .8,
                      }} />
                      {/* Type badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.15rem' }}>
                        <span style={{
                          fontFamily: "'Geist Mono', monospace", fontSize: '.58rem',
                          letterSpacing: '.09em', textTransform: 'uppercase',
                          color: typeColor, border: `1px solid ${typeColor}33`,
                          background: `${typeColor}0d`, padding: '3px 9px',
                          borderRadius: 99, fontWeight: 600,
                        }}>{t.type}</span>
                        {t.category && (
                          <span style={{
                            fontFamily: "'Geist Mono', monospace", fontSize: '.55rem',
                            color: 'var(--f-text-3)', letterSpacing: '.07em',
                          }}>{t.category}</span>
                        )}
                      </div>
                      {/* Contenu (2 lignes max) */}
                      <p style={{
                        fontFamily: "'Geist Mono', monospace", fontSize: '.78rem',
                        color: 'var(--f-text-2)', lineHeight: 1.7, margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}>{t.content}</p>
                      {/* Auteur */}
                      {t.praticiens && (
                        <Link href={`/praticiens/${t.praticiens.slug}`} style={{
                          fontFamily: "'Geist Mono', monospace", fontSize: '.63rem',
                          color: typeColor, opacity: .8, textDecoration: 'none',
                          letterSpacing: '.03em',
                        }}>
                          @{t.praticiens.name}
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Aucun résultat */}
          {total === 0 && (
            <div style={{
              textAlign: 'center', padding: '5rem 0',
              fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-text-3)',
            }}>
              <p style={{ marginBottom: '1rem' }}>Aucun résultat pour « {query} »</p>
              <p style={{ fontSize: '.72rem', opacity: .7 }}>
                Essaie un autre terme ou explore les sections ci-dessous.
              </p>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                {SUGGESTIONS.filter(s => s !== query).slice(0, 4).map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    style={{
                      fontFamily: "'Geist Mono', monospace", fontSize: '.7rem',
                      padding: '.4rem .9rem', borderRadius: 99,
                      border: '1.5px solid var(--f-border)',
                      background: 'var(--f-surface)', color: 'var(--f-text-2)',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Composant Section ──────────────────────────────────────── */
function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '1.15rem',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: 0,
          letterSpacing: '-.02em',
        }}>{title}</h2>
        <span style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: '.62rem',
          color: 'var(--f-text-3)',
          border: '1px solid var(--f-border)',
          padding: '2px 8px',
          borderRadius: 99,
          letterSpacing: '.05em',
        }}>{count}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--f-border)' }} />
      </div>
      {children}
    </div>
  );
}
