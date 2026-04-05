'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase, type Praticien, type Realisation } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import { getCountryDisplay } from '@/lib/countryFlag';
import { BADGE_STYLES } from '@/lib/badges';

export default function PraticienPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  type CollectionItem = { id: string; title: string; url: string; description: string };
  type Collection = { id: string; title: string; description?: string; items: CollectionItem[] };
  const [p, setP] = useState<Praticien | null>(null);
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  async function handleContact() {
    if (!p) return;
    setContactLoading(true);
    try {
      const res = await fetch(`/api/praticien-email?slug=${p.slug}`);
      const { email, error } = await res.json();
      if (email) {
        window.location.href = `mailto:${email}?subject=Contact depuis from0tohero.dev`;
      } else {
        alert(error || 'Impossible de récupérer le contact.');
      }
    } finally {
      setContactLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      const { data: praticienRaw } = await supabase
        .from('praticiens')
        .select('id,slug,name,role,country,city,bio,categories,category,category_label,stack,skills,badges,certifications,linkedin_url,github_url,twitter_url,youtube_url,website_url,whatsapp_url,photo_url,status,created_at,user_id')
        .eq('slug', slug).single();
      const praticien = praticienRaw as unknown as Praticien | null;
      if (!praticien) { notFound(); return; }
      setP(praticien);
      const [{ data: reals }, { data: cols }] = await Promise.all([
        supabase.from('realisations').select('*').eq('praticien_id', praticien.id).eq('status', 'approved'),
        supabase.from('collections').select('id, title, description, items, ordre').eq('praticien_id', praticien.id).eq('status', 'approved').order('ordre', { ascending: true }),
      ]);
      setRealisations(reals ?? []);
      setCollections((cols ?? []) as Collection[]);
      setLoading(false);

      // Check if logged-in user owns this profile
      const browserSupabase = createClient();
      const { data: { user } } = await browserSupabase.auth.getUser();
      if (user && praticien.user_id === user.id) setIsOwner(true);
    }
    load();
  }, [slug]);

  if (loading) return (
    <div style={{ padding: '4rem 6vw', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ height: 14, width: 80, marginBottom: '2.5rem' }} className="skeleton" />
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          <div className="skeleton" style={{ height: 28, width: '40%' }} />
          <div className="skeleton" style={{ height: 13, width: '25%' }} />
          <div className="skeleton" style={{ height: 13, width: '70%' }} />
          <div className="skeleton" style={{ height: 13, width: '60%' }} />
        </div>
      </div>
    </div>
  );
  if (!p) return null;

  const praticienRealisations = realisations;

  return (
    <div style={{ padding: '3.5rem 6vw', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/praticiens" className="link-back" style={{ display: 'inline-flex' }}>← Praticiens</Link>
        {isOwner && (
          <Link href="/mon-compte/edit" style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.7rem',
            padding: '.45rem 1rem',
            borderRadius: 7,
            border: '1.5px solid var(--f-border)',
            color: 'var(--f-text-2)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.4rem',
            transition: 'border-color .15s, color .15s',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modifier mon profil
          </Link>
        )}
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', padding: '2.5rem 0', borderBottom: '1px solid var(--f-border)', flexWrap: 'wrap' }}>
        <Avatar name={p.name} photoUrl={p.photo_url} size={72} radius={14} fontSize="1.1rem" />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.5rem,3.5vw,2rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: 0 }}>{p.name}</h1>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', background: 'var(--f-surface)', padding: '2px 8px', borderRadius: 4 }}>
              {(() => { const { flag, name } = getCountryDisplay(p.country); return <>{flag ? `${flag} ` : ''}{name || p.country}</>; })()}
            </span>
          </div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-sky)', margin: '0 0 .35rem 0', letterSpacing: '.04em' }}>{p.role}</p>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-3)', margin: '0 0 .9rem 0' }}>@{p.slug}</p>
          {p.badges?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '1.1rem' }}>
              {p.badges.map(b => {
                const c = BADGE_STYLES[b] || { color: 'var(--f-text-3)', border: 'var(--f-border)', bg: 'var(--f-surface)' };
                return <span key={b} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.08em', color: c.color, border: `1px solid ${c.border}`, background: c.bg, padding: '2px 9px', borderRadius: 4 }}>{b}</span>;
              })}
            </div>
          )}
          {p.certifications && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '.4rem' }}>🎓 Certifications</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                {String(p.certifications).split(',').map(c => c.trim()).filter(Boolean).map(cert => (
                  <span key={cert} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-sky)', border: '1px solid rgba(56,189,248,.25)', background: 'rgba(56,189,248,.08)', padding: '2px 9px', borderRadius: 4 }}>
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p style={{ fontSize: '.9rem', color: 'var(--f-text-2)', lineHeight: 1.8, maxWidth: 560, margin: '0 0 1.25rem 0' }}>{p.bio}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {p.linkedin_url && (
              <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.93v5.68H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 .77 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
                LinkedIn
              </a>
            )}
            {p.github_url && (
              <a href={p.github_url} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2c-3.34.73-4.04-1.6-4.04-1.6-.54-1.4-1.33-1.77-1.33-1.77-1.08-.74.08-.73.08-.73 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.3.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23.95-.27 1.97-.4 2.98-.4 1 0 2.03.13 2.97.4 2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.9 1.23 3.22 0 4.6-2.8 5.63-5.48 5.93.43.37.82 1.1.82 2.22v3.29c0 .32.22.68.83.57C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"/></svg>
                GitHub
              </a>
            )}
            {(p as any).twitter_url && (
              <a href={(p as any).twitter_url} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Twitter / X
              </a>
            )}
            {(p as any).youtube_url && (
              <a href={(p as any).youtube_url} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </a>
            )}
            {(p as any).website_url && (
              <a href={(p as any).website_url} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                Portfolio
              </a>
            )}
            {(p as any).whatsapp_url && (() => {
              const raw = String((p as any).whatsapp_url);
              const waHref = /^\d+$/.test(raw) ? `https://wa.me/${raw}` : raw;
              return (
              <a href={waHref} target="_blank" rel="noreferrer" className="profile-link">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              );
            })()}
          </div>

          {/* Bouton contact — affiché seulement si le praticien a un compte et que ce n'est pas le propriétaire */}
          {p.user_id && !isOwner && (
            <button
              onClick={handleContact}
              disabled={contactLoading}
              className="btn-f btn-f-primary"
              style={{ marginTop: '1.25rem', fontSize: '.78rem', display: 'inline-flex', alignItems: 'center', gap: '.45rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {contactLoading ? 'Chargement…' : 'Contacter'}
            </button>
          )}
        </div>
      </div>

      {/* COMPÉTENCES */}
      {Array.isArray(p.skills) && p.skills.length > 0 && (
        <div style={{ margin: '3rem 0' }}>
          <span className="f-label" style={{ marginBottom: '1.75rem' }}>// compétences techniques</span>
          {(p.skills as { category?: string; label?: string; items: string[] }[]).map((sec, i) => {
            const title = sec.category ?? sec.label ?? '';
            return (
              <div key={`${title}-${i}`} style={{ marginBottom: '1.75rem' }}>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .75rem 0' }}>{title}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                  {sec.items.map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <hr className="f-hr" style={{ marginBottom: '2.5rem' }} />

      {/* COLLECTIONS */}
      {collections.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <span className="f-label" style={{ marginBottom: '1.25rem' }}>// collections & ressources</span>
          <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {collections.map(col => (
              <div key={col.id} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 12, padding: '1.25rem 1.5rem' }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .25rem 0' }}>{col.title}</p>
                {col.description && (
                  <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', margin: '0 0 1rem 0', lineHeight: 1.6 }}>{col.description}</p>
                )}
                {Array.isArray(col.items) && col.items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {col.items.map((item, i) => (
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
            ))}
          </div>
        </div>
      )}

      {/* RÉALISATIONS */}
      {praticienRealisations.length > 0 && (
        <div>
          <span className="f-label" style={{ marginBottom: '1.25rem' }}>// réalisations</span>
          <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {praticienRealisations.map(r => {
              const CAT_COLORS: Record<string,{color:string,border:string,bg:string}> = {
                data:   { color:'#60a5fa', border:'rgba(96,165,250,.25)',  bg:'rgba(96,165,250,.08)' },
                devops: { color:'#34d399', border:'rgba(52,211,153,.25)',  bg:'rgba(52,211,153,.08)' },
                cloud:  { color:'#a78bfa', border:'rgba(167,139,250,.25)', bg:'rgba(167,139,250,.08)' },
                ia:     { color:'#f97316', border:'rgba(249,115,22,.25)',  bg:'rgba(249,115,22,.08)' },
                cyber:  { color:'#fb7185', border:'rgba(251,113,133,.25)', bg:'rgba(251,113,133,.08)' },
                dev:    { color:'#f472b6', border:'rgba(244,114,182,.25)', bg:'rgba(244,114,182,.08)' },
              };
              const cat = CAT_COLORS[r.category] ?? CAT_COLORS.data;
              return (
                <div key={r.slug} className="f-card f-card-hover">
                  <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: cat.color, border: `1px solid ${cat.border}`, background: cat.bg, padding: '2px 9px', borderRadius: 4 }}>{r.category.toUpperCase()}</span>
                    <span className="f-tag">{r.type}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>{r.title}</h3>
                  <p style={{ fontSize: '.85rem', color: 'var(--f-text-2)', lineHeight: 1.7, margin: '0 0 1.1rem 0' }}>{r.excerpt}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '1.1rem' }}>
                    {r.stack.map(s => <span key={s} className="f-tag">{s}</span>)}
                  </div>
                  {Array.isArray(r.collaborateurs) && (r.collaborateurs as string[]).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', marginBottom: '.85rem' }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>avec</span>
                      {(r.collaborateurs as string[]).map(c => (
                        <a key={c} href={`/praticiens/${c}`} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-sky)', textDecoration: 'none', border: '1px solid var(--f-sky-border)', background: 'var(--f-sky-bg)', padding: '1px 7px', borderRadius: 99 }}>
                          @{c}
                        </a>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    {r.demo_url && <a href={r.demo_url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-sky)', textDecoration: 'none' }}>Demo →</a>}
                    {r.repo_url && <a href={r.repo_url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', textDecoration: 'none' }}>Repo →</a>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
