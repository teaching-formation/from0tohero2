'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  topics: string[];
  stars: number;
  updated_at: string;
  already_imported: boolean;
};

const CATEGORY_MAP: Record<string, string> = {
  python: 'data', pandas: 'data', spark: 'data', kafka: 'data', dbt: 'data',
  docker: 'devops', kubernetes: 'devops', terraform: 'devops',
  aws: 'cloud', gcp: 'cloud', azure: 'cloud',
  'machine-learning': 'ia', pytorch: 'ia', tensorflow: 'ia', llm: 'ia',
  react: 'frontend', vue: 'frontend', nextjs: 'frontend', tailwind: 'frontend',
  node: 'backend', django: 'backend', fastapi: 'backend', go: 'backend',
  rust: 'backend', java: 'backend', express: 'backend',
  flutter: 'mobile', swift: 'mobile', kotlin: 'mobile',
  solidity: 'web3', blockchain: 'web3', ethereum: 'web3',
  arduino: 'embedded', raspberry: 'embedded',
};

const TYPE_MAP: Record<string, string> = {
  dashboard: 'dashboard', pipeline: 'pipeline', api: 'api', 'rest-api': 'api', graphql: 'api', app: 'app',
};

function guessCategory(tags: string[]): string {
  for (const t of tags) {
    const key = t.toLowerCase().replace(/[\s.]/g, '');
    if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  }
  return 'data';
}

function guessType(topics: string[]): string {
  for (const t of topics) {
    if (TYPE_MAP[t.toLowerCase()]) return TYPE_MAP[t.toLowerCase()];
  }
  return 'app';
}

export default function ImportGithubClient({ username: praticienSlug }: { username: string }) {
  const router = useRouter();
  const [repos,     setRepos]     = useState<Repo[]>([]);
  const [ghUser,    setGhUser]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [importing, setImporting] = useState<number | null>(null);
  const [done,      setDone]      = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/github-repos')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setRepos(data.repos || []);
        setGhUser(data.username || '');
        setLoading(false);
      })
      .catch(() => { setError('Impossible de charger les repos.'); setLoading(false); });
  }, []);

  async function importRepo(repo: Repo) {
    setImporting(repo.id);
    const allTags = [...repo.topics, repo.language].filter(Boolean);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'realisation',
          payload: {
            title:          repo.name.replace(/-/g, ' '),
            username:       praticienSlug,
            category:       guessCategory(allTags),
            type:           guessType(repo.topics),
            type_label:     '',
            stack:          allTags.slice(0, 8),
            excerpt:        repo.description || '',
            demo_url:       repo.homepage || '',
            repo_url:       repo.url,
            date_published: repo.updated_at.slice(0, 10),
            collaborateurs: [],
          },
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'import');
      setDone(d => new Set([...d, repo.id]));
    } catch {
      alert('Erreur lors de l\'import de ce repo.');
    } finally {
      setImporting(null);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-3)', padding: '3rem 0' }}>
      <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid var(--f-border)', borderTopColor: 'var(--f-orange)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      Chargement de tes repos GitHub…
    </div>
  );

  if (error) return (
    <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 8, padding: '1.25rem', fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: '#f87171' }}>
      ⚠ {error}
      {error.includes('profil') && (
        <span> — <a href="/mon-compte/edit" style={{ color: 'var(--f-sky)' }}>Ajouter ton lien GitHub →</a></span>
      )}
    </div>
  );

  const available = repos.filter(r => !r.already_imported && !done.has(r.id));
  const imported  = repos.filter(r => r.already_imported || done.has(r.id));

  return (
    <div>
      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', marginBottom: '1.5rem' }}>
        {available.length} repo{available.length !== 1 ? 's' : ''} disponible{available.length !== 1 ? 's' : ''} sur{' '}
        <a href={`https://github.com/${ghUser}`} target="_blank" rel="noreferrer" style={{ color: 'var(--f-sky)', textDecoration: 'none' }}>@{ghUser}</a>
        {imported.length > 0 && ` · ${imported.length} déjà importé${imported.length > 1 ? 's' : ''}`}
      </p>

      {available.length === 0 && done.size === 0 && (
        <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 10, padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-3)' }}>
            Tous tes repos publics sont déjà importés ✓
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {available.map(repo => (
          <div key={repo.id} style={{
            background: 'var(--f-surface)',
            border: '1px solid var(--f-border)',
            borderRadius: 10,
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '.9rem', fontWeight: 700, color: 'var(--f-text-1)' }}>
                  {repo.name}
                </span>
                {repo.stars > 0 && (
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)' }}>
                    ★ {repo.stars}
                  </span>
                )}
                {repo.language && (
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-orange)', border: '1px solid rgba(249,115,22,.2)', background: 'rgba(249,115,22,.07)', padding: '1px 7px', borderRadius: 99 }}>
                    {repo.language}
                  </span>
                )}
              </div>
              {repo.description && (
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-2)', margin: '0 0 .5rem 0', lineHeight: 1.6 }}>
                  {repo.description}
                </p>
              )}
              {repo.topics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                  {repo.topics.slice(0, 5).map(t => (
                    <span key={t} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', border: '1px solid var(--f-border)', padding: '1px 6px', borderRadius: 99 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="btn-f btn-f-primary"
              style={{ fontSize: '.72rem', flexShrink: 0 }}
              disabled={importing === repo.id}
              onClick={() => importRepo(repo)}
            >
              {importing === repo.id ? 'Import…' : 'Importer →'}
            </button>
          </div>
        ))}

        {done.size > 0 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-green)', marginBottom: '.75rem' }}>
              ✓ {done.size} réalisation{done.size > 1 ? 's' : ''} importée{done.size > 1 ? 's' : ''}
            </p>
            <button className="btn-f btn-f-secondary" style={{ fontSize: '.72rem' }} onClick={() => router.push('/mon-compte?tab=realisations')}>
              Voir mes réalisations →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
