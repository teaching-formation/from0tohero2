'use client';
import { useState, useEffect } from 'react';
import { supabase, type Evenement } from '@/lib/supabase';

const TYPE_LABELS: Record<string,string> = { conference:'Conférence', meetup:'Meetup', hackathon:'Hackathon', webinaire:'Webinaire', bootcamp:'Bootcamp' };
const TYPE_COLORS: Record<string,{color:string,bg:string,border:string}> = {
  conference: { color:'#60a5fa', bg:'#60a5fa0d', border:'#60a5fa22' },
  meetup:     { color:'#34d399', bg:'#34d3990d', border:'#34d39922' },
  hackathon:  { color:'#ff4560', bg:'#ff45600d', border:'#ff456022' },
  webinaire:  { color:'#a78bfa', bg:'#a78bfa0d', border:'#a78bfa22' },
  bootcamp:   { color:'#0ea5e9', bg:'#0ea5e90d', border:'#0ea5e922' },
};

function getEventStatus(e: { date_debut: string; date_fin?: string }): 'upcoming' | 'ongoing' | 'past' {
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(e.date_debut); start.setHours(0,0,0,0);
  if (start > today) return 'upcoming';
  if (e.date_fin) {
    const end = new Date(e.date_fin); end.setHours(23,59,59,999);
    return end >= today ? 'ongoing' : 'past';
  }
  return start.getTime() === today.getTime() ? 'ongoing' : 'past';
}

function formatDate(dateStr: string, dateFinStr?: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const d1 = new Date(dateStr).toLocaleDateString('fr-FR', opts);
  if (!dateFinStr || dateFinStr === dateStr) return d1;
  const d2 = new Date(dateFinStr).toLocaleDateString('fr-FR', opts);
  return `${d1} → ${d2}`;
}

export default function EvenementsPage() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatut, setActiveStatut] = useState('all');
  const [activeType, setActiveType] = useState('all');

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
    if (activeType !== 'all' && e.type !== activeType) return false;
    return true;
  });

  return (
    <div style={{ padding: '3rem 6vw', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <span className="f-label" style={{ marginBottom: '0.5rem' }}>// événements</span>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '0 0 0.5rem 0' }}>Conférences, meetups & hackathons</h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '0.9rem', margin: '0 0 2rem 0' }}>Événements tech à ne pas manquer — en ligne et en présentiel.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
          {[
            { key: 'all',      label: 'Tous' },
            { key: 'upcoming', label: 'À venir' },
            { key: 'ongoing',  label: 'En cours' },
            { key: 'past',     label: 'Passés' },
          ].map(s => (
            <button key={s.key} className={`filter-pill${activeStatut === s.key ? ' active' : ''}`} onClick={() => setActiveStatut(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {['all','conference','meetup','hackathon','webinaire','bootcamp'].map(t => (
            <button key={t} className={`filter-pill${activeType === t ? ' active' : ''}`} onClick={() => setActiveType(t)}>
              {t === 'all' ? 'Tous types' : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--f-text-3)', fontFamily: "'Geist Mono', monospace", fontSize: '.85rem' }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--f-text-3)', fontFamily: "'Geist Mono', monospace", fontSize: '0.85rem', marginTop: '2rem' }}>Aucun événement pour ces filtres.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {filtered.map((e, i) => {
            const c = TYPE_COLORS[e.type] || TYPE_COLORS.meetup;
            const status = getEventStatus(e);
            return (
              <div key={i} style={{ background: 'var(--f-card)', border: '1px solid var(--f-border)', borderRadius: 6, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'border-color 0.2s' }}
                onMouseOver={ev => (ev.currentTarget.style.borderColor = 'var(--f-sky)')}
                onMouseOut={ev => (ev.currentTarget.style.borderColor = 'var(--f-border)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: c.color, border: `1px solid ${c.border}`, background: c.bg, padding: '2px 8px', borderRadius: 2 }}>{TYPE_LABELS[e.type] || e.type}</span>
                    {e.gratuit && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '0.62rem', color: '#34d399', border: '1px solid #34d39922', background: '#34d3990d', padding: '2px 8px', borderRadius: 2 }}>Gratuit</span>}
                  </div>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: status === 'upcoming' ? '#00e676' : status === 'ongoing' ? '#f97316' : 'var(--f-text-3)' }}>
                    {status === 'upcoming' ? '● À venir' : status === 'ongoing' ? '● En cours' : '○ Passé'}
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: 0 }}>{e.title}</h3>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '0.72rem', color: 'var(--f-text-3)', margin: 0 }}>{e.pays} {e.lieu} &nbsp;·&nbsp; {formatDate(e.date_debut, e.date_fin)}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--f-text-2)', lineHeight: 1.6, margin: 0, flex: 1 }}>{e.excerpt}</p>
                <a href={e.url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '0.72rem', color: 'var(--f-sky)', textDecoration: 'none', letterSpacing: '0.06em' }}>Voir l&apos;événement →</a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
