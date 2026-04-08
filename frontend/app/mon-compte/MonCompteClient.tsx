'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Avatar from '@/components/Avatar';
import FlagImg from '@/components/FlagImg';
import { getCountryDisplay } from '@/lib/countryFlag';

type User        = { id: string; email: string; name: string };
type Praticien   = Record<string, unknown> | null;
type ContentRow  = Record<string, unknown>;

type Props = {
  user:         User;
  praticien:    Praticien;
  articles:     ContentRow[];
  realisations: ContentRow[];
  evenements:   ContentRow[];
  collections:  ContentRow[];
  tips:         ContentRow[];
};

const SOURCE_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn', medium: 'Medium', devto: 'Dev.to',
  substack: 'Substack', blog: 'Blog', youtube: 'YouTube', autre: 'Autre',
};
const TYPE_LABEL: Record<string, string> = {
  pipeline: 'Pipeline', dashboard: 'Dashboard', api: 'API',
  app: 'App', bootcamp: 'Bootcamp', youtube: 'YouTube', autre: 'Autre',
};

const EVTYPE_LABEL: Record<string, string> = {
  conference:'Conférence', meetup:'Meetup', hackathon:'Hackathon',
  webinaire:'Webinaire', bootcamp:'Bootcamp', autre:'Autre',
};

export default function MonCompteClient({ user, praticien, articles, realisations, evenements, collections, tips }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  type Tab = 'profil' | 'articles' | 'realisations' | 'evenements' | 'collections' | 'tips';
  const rawTab    = searchParams.get('tab') ?? '';
  const initialTab: Tab = (['profil','articles','realisations','evenements','collections','tips'] as Tab[]).includes(rawTab as Tab)
    ? (rawTab as Tab)
    : 'profil';
  const [tab, setTab]         = useState<Tab>(initialTab);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewStats, setViewStats] = useState({ week: 0, month: 0, total: 0 });
  const [visitors, setVisitors] = useState<{ slug: string; name: string; photo_url: string | null; viewed_at: string }[]>([]);
  const [visitorsOpen, setVisitorsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/profile-view')
      .then(r => r.json())
      .then(d => { setViewStats(d); setVisitors(d.visitors ?? []); })
      .catch(() => {});
  }, []);

  async function deleteContent(table: 'articles' | 'realisations' | 'evenements', id: string, label: string) {
    if (!window.confirm(`Supprimer "${label}" ? Cette action est irréversible.`)) return;
    setDeleting(id);
    const r = await fetch('/api/delete-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });
    setDeleting(null);
    if (!r.ok) { alert('Erreur lors de la suppression.'); return; }
    router.refresh();
  }

  async function deleteTip(id: string) {
    if (!window.confirm('Supprimer ce tip ? Cette action est irréversible.')) return;
    setDeleting(id);
    const r = await fetch(`/api/tip/${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (!r.ok) { alert('Erreur lors de la suppression.'); return; }
    router.refresh();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  // ── Pas de profil → invitation à en créer un ───────────────────────────
  if (!praticien) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--f-orange)', marginBottom: '.75rem' }}>
            // bienvenue
          </p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .75rem 0' }}>
            Tu n&apos;as pas encore de profil
          </h1>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-3)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Connecté en tant que <strong style={{ color: 'var(--f-text-2)' }}>{user.email}</strong>.<br />
            Crée ton profil praticien pour apparaître dans l&apos;annuaire.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/soumettre" className="btn-f btn-f-primary">
              Créer mon profil →
            </a>
            <button onClick={handleSignOut} className="btn-f btn-f-secondary">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  const p = praticien as Record<string, string | string[] | boolean | unknown>;

  // ── Dashboard ───────────────────────────────────────────────────────────
  return (
    <div className="moncompte-wrap" style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* Header */}
      <div className="moncompte-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Avatar
            name={String(p.name)}
            photoUrl={p.photo_url ? String(p.photo_url) : null}
            size={64}
            radius={12}
            fontSize='.85rem'
          />
          <div>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--f-orange)', margin: '0 0 .4rem 0' }}>
              // mon espace
            </p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: 'var(--f-text-1)', margin: 0 }}>
              {String(p.name)}
            </h1>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-3)', margin: '.3rem 0 0 0' }}>
              @{String(p.slug)} · {user.email}
            </p>
          </div>
        </div>
        <button onClick={handleSignOut} className="btn-f btn-f-secondary" style={{ fontSize: '.7rem' }}>
          Se déconnecter
        </button>
      </div>

      {/* Onboarding checklist — visible seulement si profil incomplet */}
      {(() => {
        const checks = [
          { label: 'Profil créé',           done: true },
          { label: 'Bio ajoutée',           done: !!p.bio },
          { label: 'Stack renseignée',      done: Array.isArray(p.stack) && (p.stack as string[]).length > 0 },
          { label: 'Photo de profil',       done: !!p.photo_url },
          { label: 'Première réalisation',  done: realisations.length > 0 },
        ];
        const doneCount = checks.filter(c => c.done).length;
        if (doneCount === checks.length) return null; // profil complet → masquer
        const pct = Math.round((doneCount / checks.length) * 100);
        return (
          <div style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-orange)', margin: 0 }}>
                // complète ton profil
              </p>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)' }}>
                {doneCount}/{checks.length} · {pct}%
              </span>
            </div>
            {/* Barre de progression */}
            <div style={{ height: 4, background: 'var(--f-border)', borderRadius: 99, marginBottom: '1rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--f-orange)', borderRadius: 99, transition: 'width .4s ease' }} />
            </div>
            {/* Checklist */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {checks.map(c => (
                <span key={c.label} style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: '.62rem',
                  padding: '3px 10px',
                  borderRadius: 99,
                  border: `1px solid ${c.done ? 'rgba(52,211,153,.4)' : 'var(--f-border)'}`,
                  background: c.done ? 'rgba(52,211,153,.08)' : 'transparent',
                  color: c.done ? 'var(--f-green)' : 'var(--f-text-3)',
                }}>
                  {c.done ? '✓ ' : '○ '}{c.label}
                </span>
              ))}
            </div>
            <a href="/mon-compte/edit" style={{ display: 'inline-block', marginTop: '.85rem', fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-orange)', textDecoration: 'none' }}>
              Compléter mon profil →
            </a>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="moncompte-tabs" style={{ display: 'flex', gap: '.5rem', borderBottom: '1px solid var(--f-border)', marginBottom: '2rem', overflowX: 'auto' }}>
        {([
          { key: 'profil',       label: 'Mon profil' },
          { key: 'articles',     label: `Articles (${articles.length})` },
          { key: 'realisations', label: `Réalisations (${realisations.length})` },
          { key: 'evenements',   label: `Événements (${evenements.length})` },
          { key: 'collections',  label: `Collections (${collections.length})` },
          { key: 'tips',         label: `Tips (${tips.length})` },
        ] as { key: typeof tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.72rem',
              padding: '.6rem 1rem',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--f-orange)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.key ? 'var(--f-text-1)' : 'var(--f-text-3)',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'color .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Onglet Profil */}
      {tab === 'profil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Rôle',      value: p.role },
              { label: 'Catégorie', value: Array.isArray(p.categories) ? p.categories.join(', ') : String(p.category || '') },
              { label: 'Stack',     value: Array.isArray(p.stack) ? (p.stack as string[]).slice(0, 6).join(', ') : '' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem' }}>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .4rem 0' }}>{label}</p>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-1)', margin: 0 }}>{String(value || '—')}</p>
              </div>
            ))}
            {/* Localisation avec drapeau image */}
            <div style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .4rem 0' }}>Localisation</p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                {p.country ? (
                  <><FlagImg country={String(p.country)} size={16} />{getCountryDisplay(String(p.country)).name || String(p.country)}</>
                ) : '—'}
              </p>
            </div>
          </div>

          {!!p.bio && (
            <div style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .5rem 0' }}>Bio</p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-2)', lineHeight: 1.7, margin: 0 }}>{String(p.bio)}</p>
            </div>
          )}

          {/* Analytics vues */}
          <div style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: 0 }}>
                // vues de profil
              </p>
              {visitors.length > 0 && (
                <button
                  onClick={() => setVisitorsOpen(true)}
                  style={{
                    fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', fontWeight: 600,
                    color: 'var(--f-sky)', background: 'var(--f-sky-bg, rgba(56,189,248,.08))',
                    border: '1px solid rgba(56,189,248,.3)', borderRadius: 6,
                    padding: '3px 10px', cursor: 'pointer',
                  }}
                >
                  Visiteurs ({visitors.length}) →
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                { label: '7 jours',  value: viewStats.week },
                { label: '30 jours', value: viewStats.month },
                { label: 'total',    value: viewStats.total },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: 'var(--f-sky)', margin: '0 0 .2rem 0', lineHeight: 1 }}>{value}</p>
                  <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Modal visiteurs */}
          {visitorsOpen && (
            <div
              onClick={() => setVisitorsOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'var(--f-surface)', border: '1px solid var(--f-border)',
                  borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '80vh',
                  overflowY: 'auto', display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--f-border)' }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)' }}>
                    // visiteurs récents · {visitors.length}
                  </span>
                  <button
                    onClick={() => setVisitorsOpen(false)}
                    style={{ background: 'none', border: '1px solid var(--f-border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: 'var(--f-text-3)', fontFamily: "'Geist Mono', monospace", fontSize: '.7rem' }}
                  >✕</button>
                </div>

                {/* Liste */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '.75rem' }}>
                  {visitors.map((v, i) => (
                    <a
                      key={i}
                      href={`/praticiens/${v.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '.75rem', textDecoration: 'none', padding: '.6rem .75rem', borderRadius: 8, transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--f-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Avatar name={v.name} photoUrl={v.photo_url} size={32} radius={8} fontSize=".6rem" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-sky)', fontWeight: 600, margin: '0 0 .15rem 0' }}>
                          @{v.slug}
                        </p>
                        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', margin: 0 }}>
                          {v.name}
                        </p>
                      </div>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(v.viewed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' '}{new Date(v.viewed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href={`/mon-compte/edit`} className="btn-f btn-f-primary">
              ✎ Modifier mon profil
            </a>
            <a href={`/praticiens/${String(p.slug)}`} className="btn-f btn-f-secondary" target="_blank" rel="noreferrer">
              Voir mon profil public →
            </a>
          </div>
        </div>
      )}

      {/* Onglet Articles */}
      {tab === 'articles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.5rem', flexWrap: 'wrap' }}>
            <a href="/mon-compte/import-rss" className="btn-f btn-f-secondary" style={{ fontSize: '.72rem' }}>
              ↓ Importer des articles
            </a>
            <a href="/mon-compte/nouvel-article" className="btn-f btn-f-primary" style={{ fontSize: '.72rem' }}>
              + Ajouter un article
            </a>
          </div>
          {articles.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', background: 'var(--f-surface)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>✍️</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>
                Partage ton expertise
              </p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', margin: '0 0 1.5rem 0', lineHeight: 1.7, maxWidth: 360, marginInline: 'auto' }}>
                Publie un article, un tutoriel ou un retour d&apos;expérience. Tes pairs en ont besoin.
              </p>
              <a href="/mon-compte/nouvel-article" className="btn-f btn-f-primary" style={{ fontSize: '.75rem' }}>
                + Écrire mon premier article
              </a>
            </div>
          ) : (articles as Record<string, unknown>[]).map((a) => (
            <div key={String(a.id)} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-text-1)', margin: '0 0 .25rem 0', fontWeight: 500 }}>{String(a.title)}</p>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
                  {SOURCE_LABEL[String(a.source)] || String(a.source)} · {String(a.date_published || '—')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <a href={`/mon-compte/article/${String(a.id)}/edit`} className="btn-f btn-f-secondary" style={{ fontSize: '.68rem' }}>
                  ✎ Modifier
                </a>
                <button
                  onClick={() => deleteContent('articles', String(a.id), String(a.title))}
                  disabled={deleting === String(a.id)}
                  className="btn-f btn-f-danger"
                  style={{ fontSize: '.68rem' }}
                >
                  {deleting === String(a.id) ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onglet Réalisations */}
      {tab === 'realisations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.5rem', flexWrap: 'wrap' }}>
            <a href="/mon-compte/import-github" className="btn-f btn-f-secondary" style={{ fontSize: '.72rem' }}>
              ↓ Importer depuis GitHub
            </a>
            <a href="/mon-compte/nouvelle-realisation" className="btn-f btn-f-primary" style={{ fontSize: '.72rem' }}>
              + Ajouter une réalisation
            </a>
          </div>
          {realisations.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', background: 'var(--f-surface)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>⚡</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>
                Montre ce que tu as construit
              </p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', margin: '0 0 .75rem 0', lineHeight: 1.7, maxWidth: 380, marginInline: 'auto' }}>
                Pipeline, dashboard, API, app… Colle ton lien GitHub et le formulaire se remplit automatiquement.
              </p>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.25rem' }}>
                {['Pipeline de données', 'Dashboard BI', 'API REST', 'App mobile'].map(ex => (
                  <span key={ex} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-sky)', border: '1px solid var(--f-sky-border)', background: 'var(--f-sky-bg)', padding: '3px 10px', borderRadius: 99 }}>
                    {ex}
                  </span>
                ))}
              </div>
              <a href="/mon-compte/nouvelle-realisation" className="btn-f btn-f-primary" style={{ fontSize: '.75rem' }}>
                + Ajouter ma première réalisation
              </a>
            </div>
          ) : (realisations as Record<string, unknown>[]).map((r) => {
            const isCoAuthor = r._isCoAuthor === true;
            return (
              <div key={String(r.id)} style={{ background: 'var(--f-surface)', border: `1px solid ${isCoAuthor ? 'rgba(56,189,248,.35)' : 'var(--f-border)'}`, borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem', flexWrap: 'wrap' }}>
                    <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-text-1)', margin: 0, fontWeight: 500 }}>{String(r.title)}</p>
                    {isCoAuthor && (
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--f-sky)', background: 'rgba(56,189,248,.1)', border: '1px solid rgba(56,189,248,.3)', padding: '1px 7px', borderRadius: 99 }}>
                        co-auteur
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
                    {TYPE_LABEL[String(r.type)] || String(r.type)} · {Array.isArray(r.stack) ? (r.stack as string[]).slice(0, 3).join(', ') : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                  <a href={`/mon-compte/realisation/${String(r.id)}/edit`} className="btn-f btn-f-secondary" style={{ fontSize: '.68rem' }}>
                    ✎ Modifier
                  </a>
                  {!isCoAuthor && (
                    <button
                      onClick={() => deleteContent('realisations', String(r.id), String(r.title))}
                      disabled={deleting === String(r.id)}
                      className="btn-f btn-f-danger"
                      style={{ fontSize: '.68rem' }}
                    >
                      {deleting === String(r.id) ? '…' : '✕'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onglet Événements */}
      {tab === 'evenements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/mon-compte/nouvel-evenement" className="btn-f btn-f-primary" style={{ fontSize: '.72rem' }}>
              + Ajouter un événement
            </a>
          </div>
          {evenements.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', background: 'var(--f-surface)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>📅</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>
                Tu organises ou participes à un événement ?
              </p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', margin: '0 0 1.5rem 0', lineHeight: 1.7, maxWidth: 360, marginInline: 'auto' }}>
                Meetup, conférence, hackathon, webinaire… Partage-le avec la communauté.
              </p>
              <a href="/mon-compte/nouvel-evenement" className="btn-f btn-f-primary" style={{ fontSize: '.75rem' }}>
                + Ajouter un événement
              </a>
            </div>
          ) : (evenements as Record<string, unknown>[]).map((ev) => (
            <div key={String(ev.id)} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-text-1)', margin: '0 0 .25rem 0', fontWeight: 500 }}>{String(ev.title)}</p>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
                  {ev.type_label ? String(ev.type_label) : (EVTYPE_LABEL[String(ev.type)] || String(ev.type))} · {String(ev.date_debut || '—')} {ev.online ? '· En ligne' : (ev.pays ? `· ${String(ev.pays)}` : '')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <a href={`/mon-compte/evenement/${String(ev.id)}/edit`} className="btn-f btn-f-secondary" style={{ fontSize: '.68rem' }}>
                  ✎ Modifier
                </a>
                <button
                  onClick={() => deleteContent('evenements', String(ev.id), String(ev.title))}
                  disabled={deleting === String(ev.id)}
                  className="btn-f btn-f-danger"
                  style={{ fontSize: '.68rem' }}
                >
                  {deleting === String(ev.id) ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onglet Collections */}
      {tab === 'collections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/mon-compte/collections/new" className="btn-f btn-f-primary" style={{ fontSize: '.72rem' }}>
              + Nouvelle collection
            </a>
          </div>
          {collections.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', background: 'var(--f-surface)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>◈</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>
                Crée ta première collection
              </p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', margin: '0 0 1.5rem 0', lineHeight: 1.7, maxWidth: 380, marginInline: 'auto' }}>
                Regroupe des ressources utiles (livres, outils, articles, cours…) et partage-les sur ton profil.
              </p>
              <a href="/mon-compte/collections/new" className="btn-f btn-f-primary" style={{ fontSize: '.75rem' }}>
                + Créer une collection
              </a>
            </div>
          ) : (collections as Record<string, unknown>[]).map((col) => {
            const items = Array.isArray(col.items) ? col.items as Record<string,unknown>[] : [];
            return (
              <div key={String(col.id)} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-text-1)', margin: '0 0 .2rem 0', fontWeight: 500 }}>{String(col.title)}</p>
                  {!!col.description && (
                    <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: '0 0 .3rem 0' }}>{String(col.description)}</p>
                  )}
                  <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', margin: 0 }}>
                    {items.length} ressource{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <a href={`/mon-compte/collections/${String(col.id)}/edit`} className="btn-f btn-f-secondary" style={{ fontSize: '.68rem', flexShrink: 0 }}>
                  ✎ Modifier
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Onglet Tips */}
      {tab === 'tips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/mon-compte/nouveau-tip" className="btn-f btn-f-primary" style={{ fontSize: '.72rem' }}>
              + Nouveau tip
            </a>
          </div>
          {tips.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', background: 'var(--f-surface)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>💡</div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>
                Partage ce que tu sais
              </p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', margin: '0 0 1.5rem 0', lineHeight: 1.7, maxWidth: 380, marginInline: 'auto' }}>
                Tips, TIL, snippets… Publie en 30 secondes. Instantanément visible sur ton profil et la homepage.
              </p>
              <a href="/mon-compte/nouveau-tip" className="btn-f btn-f-primary" style={{ fontSize: '.75rem' }}>
                + Publier mon premier tip
              </a>
            </div>
          ) : (tips as Record<string, unknown>[]).map((tip) => (
            <div key={String(tip.id)} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.08em', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--f-sky-border)', background: 'var(--f-sky-bg)', color: 'var(--f-sky)' }}>
                    {String(tip.type)}
                  </span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', letterSpacing: '.08em', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--f-border)', color: 'var(--f-text-3)' }}>
                    {String(tip.category)}
                  </span>
                </div>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-1)', margin: '0 0 .25rem 0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {String(tip.content)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <a href={`/mon-compte/tip/${String(tip.id)}/edit`} className="btn-f btn-f-secondary" style={{ fontSize: '.68rem' }}>
                  ✎ Modifier
                </a>
                <button
                  onClick={() => deleteTip(String(tip.id))}
                  disabled={deleting === String(tip.id)}
                  className="btn-f btn-f-danger"
                  style={{ fontSize: '.68rem' }}
                >
                  {deleting === String(tip.id) ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
