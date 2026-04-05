'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Article = {
  title: string;
  link: string;
  date_published: string;
  excerpt: string;
  category: string;
  source: string;
  already_imported: boolean;
};

const SOURCE_HINTS = [
  { label: 'Medium',    hint: 'https://medium.com/@username' },
  { label: 'Substack',  hint: 'https://username.substack.com' },
  { label: 'Dev.to',    hint: 'https://dev.to/username' },
  { label: 'LinkedIn',  hint: 'https://linkedin.com/newsletters/nom-newsletter-123456789/' },
  { label: 'Blog RSS',  hint: 'https://ton-blog.com/feed' },
];

const SOURCE_LABELS: Record<string, string> = {
  medium: 'Medium', substack: 'Substack', devto: 'Dev.to',
  blog: 'Blog', youtube: 'YouTube', linkedin: 'LinkedIn',
};

function isLinkedInProfile(u: string) {
  // profil perso, post, article — pas une newsletter
  return u.includes('linkedin.com') && !u.includes('linkedin.com/newsletters/');
}
function isLinkedInNewsletter(u: string) {
  return u.includes('linkedin.com/newsletters/');
}

export default function ImportRssClient({ username, country }: { username: string; country: string }) {
  const router = useRouter();
  const [url,           setUrl]           = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [linkedinHint,  setLinkedinHint]  = useState(false);
  const [articles,      setArticles]      = useState<Article[]>([]);
  const [importing,     setImporting]     = useState<string | null>(null);
  const [done,          setDone]          = useState<Set<string>>(new Set());

  async function fetchFeed() {
    const trimmed = url.trim();
    if (!trimmed) return;

    // LinkedIn profil/post/article → pas de RSS, on guide
    if (isLinkedInProfile(trimmed)) {
      setLinkedinHint(true);
      setError('');
      setArticles([]);
      return;
    }

    setLinkedinHint(false);
    setLoading(true);
    setError('');
    setArticles([]);
    setDone(new Set());
    try {
      const res  = await fetch(`/api/import-rss?url=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setArticles(data.articles || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Impossible de lire ce flux.');
    } finally {
      setLoading(false);
    }
  }

  async function importArticle(a: Article) {
    setImporting(a.link);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'article',
          payload: {
            title:          a.title,
            username,
            author_country: country,
            category:       a.category,
            source:         a.source,
            source_label:   '',
            external_url:   a.link,
            excerpt:        a.excerpt,
            date_published: a.date_published,
            collaborateurs: [],
          },
        }),
      });
      if (!res.ok) throw new Error('Erreur import');
      setDone(d => new Set([...d, a.link]));
    } catch {
      alert('Erreur lors de l\'import.');
    } finally {
      setImporting(null);
    }
  }

  const available = articles.filter(a => !a.already_imported && !done.has(a.link));
  const alreadyDone = articles.filter(a => a.already_imported || done.has(a.link));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Input flux */}
      <div style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 10, padding: '1.25rem' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-2)', marginBottom: '.75rem' }}>
          Colle l'URL de ton profil ou de ton flux RSS :
        </p>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem' }}>
          <input
            className="f-input"
            placeholder="https://medium.com/@username"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); setLinkedinHint(false); }}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), fetchFeed())}
            style={{ flex: 1 }}
            disabled={loading}
          />
          <button
            className="btn-f btn-f-primary"
            onClick={fetchFeed}
            disabled={loading || !url.trim()}
            style={{ flexShrink: 0, fontSize: '.72rem' }}
          >
            {loading ? '…' : 'Charger →'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
          {SOURCE_HINTS.map(h => (
            <button
              key={h.label}
              type="button"
              onClick={() => setUrl(h.hint)}
              style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', background: 'transparent', padding: '2px 8px', borderRadius: 99, cursor: 'pointer' }}
            >
              {h.label}
            </button>
          ))}
        </div>
        {error && (
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171', marginTop: '.75rem' }}>
            ⚠ {error}
          </p>
        )}

        {linkedinHint && (
          <div style={{ marginTop: '.85rem', background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 8, padding: '.85rem 1rem' }}>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', fontWeight: 600, color: 'var(--f-orange)', marginBottom: '.35rem' }}>
              ⚠ LinkedIn ne supporte pas le RSS pour les profils et articles.
            </p>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: 'var(--f-text-2)', lineHeight: 1.6, marginBottom: '.75rem' }}>
              Deux options :
            </p>
            <ul style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: 'var(--f-text-2)', lineHeight: 1.9, marginBottom: '.85rem', paddingLeft: '1.2rem' }}>
              <li><strong style={{ color: 'var(--f-text-1)' }}>Article par article</strong> — colle l'URL de ton article LinkedIn dans le formulaire avec autofill.</li>
              <li><strong style={{ color: 'var(--f-text-1)' }}>LinkedIn Newsletter</strong> — si tu as une newsletter LinkedIn, colle son URL (ex: <code style={{ color: 'var(--f-sky)' }}>linkedin.com/newsletters/nom-123456789/</code>) pour importer via RSS.</li>
            </ul>
            <a
              href="/mon-compte/nouvel-article"
              className="btn-f btn-f-secondary"
              style={{ fontSize: '.68rem' }}
            >
              Ajouter un article manuellement →
            </a>
          </div>
        )}
      </div>

      {/* Résultats */}
      {articles.length > 0 && (
        <div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', marginBottom: '1rem' }}>
            {available.length} article{available.length !== 1 ? 's' : ''} disponible{available.length !== 1 ? 's' : ''}
            {alreadyDone.length > 0 && ` · ${alreadyDone.length} déjà importé${alreadyDone.length > 1 ? 's' : ''}`}
          </p>

          {available.length === 0 && done.size === 0 && (
            <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-3)' }}>
                Tous les articles de ce flux sont déjà importés ✓
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {available.map(a => (
              <div key={a.link} style={{
                background: 'var(--f-surface)',
                border: '1px solid var(--f-border)',
                borderRadius: 10,
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '.88rem', fontWeight: 700, color: 'var(--f-text-1)' }}>
                      {a.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', marginBottom: a.excerpt ? '.4rem' : 0, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-sky)', border: '1px solid var(--f-sky-border)', background: 'var(--f-sky-bg)', padding: '1px 7px', borderRadius: 99 }}>
                      {SOURCE_LABELS[a.source] || a.source}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-orange)', border: '1px solid rgba(249,115,22,.2)', background: 'rgba(249,115,22,.07)', padding: '1px 7px', borderRadius: 99 }}>
                      {a.category}
                    </span>
                    {a.date_published && (
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)' }}>
                        {a.date_published}
                      </span>
                    )}
                  </div>
                  {a.excerpt && (
                    <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.67rem', color: 'var(--f-text-2)', margin: 0, lineHeight: 1.6 }}>
                      {a.excerpt.slice(0, 160)}{a.excerpt.length > 160 ? '…' : ''}
                    </p>
                  )}
                </div>
                <button
                  className="btn-f btn-f-primary"
                  style={{ fontSize: '.72rem', flexShrink: 0 }}
                  disabled={importing === a.link}
                  onClick={() => importArticle(a)}
                >
                  {importing === a.link ? 'Import…' : 'Importer →'}
                </button>
              </div>
            ))}

            {done.size > 0 && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-green)', marginBottom: '.75rem' }}>
                  ✓ {done.size} article{done.size > 1 ? 's' : ''} importé{done.size > 1 ? 's' : ''}
                </p>
                <button className="btn-f btn-f-secondary" style={{ fontSize: '.72rem' }} onClick={() => router.push('/mon-compte?tab=articles')}>
                  Voir mes articles →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
