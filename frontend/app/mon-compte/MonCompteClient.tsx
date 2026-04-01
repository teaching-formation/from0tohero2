'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

type User        = { id: string; email: string; name: string };
type Praticien   = Record<string, unknown> | null;
type ContentRow  = Record<string, unknown>;

type Props = {
  user:         User;
  praticien:    Praticien;
  articles:     ContentRow[];
  realisations: ContentRow[];
  evenements:   ContentRow[];
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

export default function MonCompteClient({ user, praticien, articles, realisations, evenements }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  type Tab = 'profil' | 'articles' | 'realisations' | 'evenements';
  const rawTab    = searchParams.get('tab') ?? '';
  const initialTab: Tab = (['profil','articles','realisations','evenements'] as Tab[]).includes(rawTab as Tab)
    ? (rawTab as Tab)
    : 'profil';
  const [tab, setTab]         = useState<Tab>(initialTab);
  const [deleting, setDeleting] = useState<string | null>(null);

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
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
        <button onClick={handleSignOut} className="btn-f btn-f-secondary" style={{ fontSize: '.7rem' }}>
          Se déconnecter
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', borderBottom: '1px solid var(--f-border)', marginBottom: '2rem' }}>
        {([
          { key: 'profil',       label: 'Mon profil' },
          { key: 'articles',     label: `Articles (${articles.length})` },
          { key: 'realisations', label: `Réalisations (${realisations.length})` },
          { key: 'evenements',   label: `Événements (${evenements.length})` },
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
              { label: 'Rôle',         value: p.role },
              { label: 'Localisation', value: String(p.country || '') },
              { label: 'Catégorie',    value: Array.isArray(p.categories) ? p.categories.join(', ') : String(p.category || '') },
              { label: 'Stack',        value: Array.isArray(p.stack) ? (p.stack as string[]).slice(0, 6).join(', ') : '' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem' }}>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .4rem 0' }}>{label}</p>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-1)', margin: 0 }}>{String(value || '—')}</p>
              </div>
            ))}
          </div>

          {!!p.bio && (
            <div style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', margin: '0 0 .5rem 0' }}>Bio</p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-2)', lineHeight: 1.7, margin: 0 }}>{String(p.bio)}</p>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/mon-compte/nouvel-article" className="btn-f btn-f-primary" style={{ fontSize: '.72rem' }}>
              + Ajouter un article
            </a>
          </div>
          {articles.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 8, padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', margin: 0 }}>
                Aucun article pour l&apos;instant.
              </p>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a href="/mon-compte/nouvelle-realisation" className="btn-f btn-f-primary" style={{ fontSize: '.72rem' }}>
              + Ajouter une réalisation
            </a>
          </div>
          {realisations.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 8, padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', margin: 0 }}>
                Aucune réalisation pour l&apos;instant.
              </p>
            </div>
          ) : (realisations as Record<string, unknown>[]).map((r) => (
            <div key={String(r.id)} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.78rem', color: 'var(--f-text-1)', margin: '0 0 .25rem 0', fontWeight: 500 }}>{String(r.title)}</p>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
                  {TYPE_LABEL[String(r.type)] || String(r.type)} · {Array.isArray(r.stack) ? (r.stack as string[]).slice(0, 3).join(', ') : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                <a href={`/mon-compte/realisation/${String(r.id)}/edit`} className="btn-f btn-f-secondary" style={{ fontSize: '.68rem' }}>
                  ✎ Modifier
                </a>
                <button
                  onClick={() => deleteContent('realisations', String(r.id), String(r.title))}
                  disabled={deleting === String(r.id)}
                  className="btn-f btn-f-danger"
                  style={{ fontSize: '.68rem' }}
                >
                  {deleting === String(r.id) ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
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
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 8, padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', margin: 0 }}>
                Aucun événement pour l&apos;instant.
              </p>
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

    </div>
  );
}
