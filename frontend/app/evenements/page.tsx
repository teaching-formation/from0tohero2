'use client';
import { useState, useEffect } from 'react';
import { supabase, type Evenement } from '@/lib/supabase';

const PAGE_SIZE = 18;

const TYPE_LABELS: Record<string, string> = {
  conference: 'Conférence', meetup: 'Meetup', hackathon: 'Hackathon',
  webinaire: 'Webinaire', bootcamp: 'Bootcamp', atelier: 'Atelier', autre: 'Autre',
};

const TYPE_COLOR: Record<string, string> = {
  conference: '#60a5fa',
  meetup: 'var(--f-green)',
  hackathon: '#f87171',
  webinaire: '#a78bfa',
  bootcamp: 'var(--f-sky)',
  atelier: '#fb923c',
  autre: 'var(--f-text-3)',
};

const TYPE_ICON: Record<string, string> = {
  conference: '◎', meetup: '◉', hackathon: '⚡', webinaire: '◈',
  bootcamp: '⬡', atelier: '◧', autre: '◦',
};

function getEventStatus(e: Evenement): 'upcoming' | 'ongoing' | 'past' {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(e.date_debut); start.setHours(0, 0, 0, 0);
  if (start > today) return 'upcoming';
  if (e.date_fin) {
    const end = new Date(e.date_fin); end.setHours(23, 59, 59, 999);
    return end >= today ? 'ongoing' : 'past';
  }
  return start.getTime() === today.getTime() ? 'ongoing' : 'past';
}

function formatDate(dateStr: string, dateFinStr?: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const d1 = new Date(dateStr).toLocaleDateString('fr-FR', opts);
  if (!dateFinStr || dateFinStr === dateStr) return d1;
  const d2 = new Date(dateFinStr).toLocaleDateString('fr-FR', opts);
  return `${d1} — ${d2}`;
}

export default function EvenementsPage() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatut, setActiveStatut] = useState('upcoming');
  const [activeType, setActiveType] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => { setVisible(PAGE_SIZE); }, [activeStatut, activeType]);

  useEffect(() => {
    supabase
      .from('evenements')
      .select('*')
      .eq('status', 'approved')
      .order('date_debut', { ascending: true })
      .then(({ data }) => { setEvenements(data ?? []); setLoading(false); });
  }, []);

  const filtered = evenements.filter(e => {
    const status = getEventStatus(e);
    if (activeStatut !== 'all' && status !== activeStatut) return false;
    const types: string[] = (e as any).types?.length ? (e as any).types : [e.type];
    if (activeType !== 'all' && !types.includes(activeType)) return false;
    return true;
  });

  return (
    <div style={{ padding: '4.5rem 6vw', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>// événements</span>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 4.5vw, 3rem)',
          fontWeight: 800,
          color: 'var(--f-text-1)',
          margin: '.4rem 0 .75rem 0',
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}>
          Conférences, meetups & hackathons
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.88rem', margin: '0 0 2.25rem 0', lineHeight: 1.7 }}>
          Événements tech francophones — en ligne et en présentiel.
        </p>

        {/* Filtres statut */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
          {[
            { key: 'all',      label: 'Tous' },
            { key: 'upcoming', label: '● À venir' },
            { key: 'ongoing',  label: '● En cours' },
            { key: 'past',     label: '○ Passés' },
          ].map(s => (
            <button
              key={s.key}
              className={`filter-pill${activeStatut === s.key ? ' active' : ''}`}
              onClick={() => setActiveStatut(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Filtres type */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {['all', 'conference', 'meetup', 'hackathon', 'webinaire', 'bootcamp', 'atelier', 'autre'].map(t => (
            <button
              key={t}
              className={`filter-pill${activeType === t ? ' active' : ''}`}
              onClick={() => setActiveType(t)}
            >
              {t === 'all' ? 'Tous types' : `${TYPE_ICON[t] || ''} ${TYPE_LABELS[t] || t}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="f-card" style={{ height: 200, background: 'var(--f-card)', borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '5rem 0',
          fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-text-3)',
        }}>
          Aucun événement pour ces filtres.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
            {filtered.slice(0, visible).map((e, i) => {
              const types: string[] = (e as any).types?.length ? (e as any).types : [e.type];
              const primaryType = types[0] || 'autre';
              const typeColor = TYPE_COLOR[primaryType] || 'var(--f-text-3)';
              const status = getEventStatus(e);

              const statusColor = status === 'upcoming' ? '#4ade80' : status === 'ongoing' ? 'var(--f-orange)' : 'var(--f-text-3)';
              const statusLabel = status === 'upcoming' ? '● À venir' : status === 'ongoing' ? '● En cours' : '○ Passé';

              const lieu = [e.pays, e.online ? 'En ligne' : e.lieu].filter(Boolean).join(' · ');

              return (
                <article
                  key={i}
                  className="f-card f-card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.9rem',
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: status === 'past' ? .65 : 1,
                  }}
                >
                  {/* Bande couleur type */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${typeColor}, transparent)`,
                    borderRadius: '12px 12px 0 0',
                    opacity: status === 'past' ? .4 : .8,
                  }} />

                  {/* Badges type + statut */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.4rem', marginTop: '.25rem' }}>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                      {types.slice(0, 2).map(t => (
                        <span key={t} style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '.58rem',
                          letterSpacing: '.09em',
                          textTransform: 'uppercase',
                          color: TYPE_COLOR[t] || 'var(--f-text-3)',
                          border: `1px solid ${(TYPE_COLOR[t] || 'var(--f-text-3)')}33`,
                          background: `${(TYPE_COLOR[t] || 'var(--f-text-3)')}0d`,
                          padding: '3px 9px',
                          borderRadius: 99,
                          fontWeight: 600,
                        }}>{TYPE_ICON[t]} {TYPE_LABELS[t] || t}</span>
                      ))}
                      {e.gratuit && (
                        <span style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '.58rem',
                          letterSpacing: '.09em',
                          textTransform: 'uppercase',
                          color: 'var(--f-green)',
                          border: '1px solid var(--f-green-border)',
                          background: 'var(--f-green-bg)',
                          padding: '3px 9px',
                          borderRadius: 99,
                          fontWeight: 600,
                        }}>Gratuit</span>
                      )}
                    </div>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.58rem',
                      letterSpacing: '.07em',
                      textTransform: 'uppercase',
                      color: statusColor,
                      fontWeight: 700,
                    }}>{statusLabel}</span>
                  </div>

                  {/* Titre */}
                  <h3 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    color: 'var(--f-text-1)',
                    margin: 0,
                    letterSpacing: '-.015em',
                    lineHeight: 1.3,
                  }}>{e.title}</h3>

                  {/* Date + lieu */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '.2rem',
                  }}>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.7rem',
                      color: typeColor,
                      opacity: .9,
                      letterSpacing: '.03em',
                    }}>
                      📅 {formatDate(e.date_debut, e.date_fin)}
                    </span>
                    {lieu && (
                      <span style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.68rem',
                        color: 'var(--f-text-3)',
                        letterSpacing: '.02em',
                      }}>
                        📍 {lieu}
                      </span>
                    )}
                  </div>

                  {/* Excerpt */}
                  {e.excerpt && (
                    <p style={{
                      fontSize: '.83rem',
                      color: 'var(--f-text-2)',
                      lineHeight: 1.75,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}>{e.excerpt}</p>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '.75rem',
                    borderTop: '1px solid var(--f-border)',
                    marginTop: 'auto',
                  }}>
                    <span style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '.6rem',
                      color: 'var(--f-text-3)',
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                    }}>
                      {e.online ? 'En ligne' : 'Présentiel'}
                    </span>
                    {e.url && (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: '.62rem',
                          color: typeColor,
                          border: `1px solid ${typeColor}44`,
                          background: `${typeColor}0a`,
                          padding: '3px 10px',
                          borderRadius: 99,
                          textDecoration: 'none',
                          letterSpacing: '.04em',
                        }}
                      >
                        Voir l&apos;événement →
                      </a>
                    )}
                  </div>

                </article>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button className="btn-f btn-f-secondary" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                Charger plus ({filtered.length - visible} restants) →
              </button>
            </div>
          )}

          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.63rem',
            color: 'var(--f-text-3)',
            textAlign: 'center',
            marginTop: '1.25rem',
            letterSpacing: '.06em',
          }}>
            {Math.min(visible, filtered.length)} / {filtered.length} événements
          </p>
        </>
      )}
    </div>
  );
}
