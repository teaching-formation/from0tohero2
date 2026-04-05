import { NextRequest, NextResponse } from 'next/server';

// Mapping topics/langages → catégorie from0tohero
const CATEGORY_MAP: Record<string, string> = {
  python: 'data', pandas: 'data', spark: 'data', sql: 'data', dbt: 'data',
  kafka: 'data', airflow: 'data', bigquery: 'data', snowflake: 'data', etl: 'data',
  docker: 'devops', kubernetes: 'devops', terraform: 'devops', ansible: 'devops', ci: 'devops',
  aws: 'cloud', gcp: 'cloud', azure: 'cloud', serverless: 'cloud',
  'machine-learning': 'ia', 'deep-learning': 'ia', nlp: 'ia', pytorch: 'ia',
  tensorflow: 'ia', llm: 'ia', 'computer-vision': 'ia', ai: 'ia',
  react: 'frontend', vue: 'frontend', angular: 'frontend', nextjs: 'frontend',
  svelte: 'frontend', css: 'frontend', tailwind: 'frontend',
  node: 'backend', django: 'backend', fastapi: 'backend', go: 'backend',
  rust: 'backend', java: 'backend', spring: 'backend', express: 'backend',
  flutter: 'mobile', 'react-native': 'mobile', swift: 'mobile', kotlin: 'mobile',
  solidity: 'web3', blockchain: 'web3', ethereum: 'web3', web3: 'web3',
  embedded: 'embedded', arduino: 'embedded', raspberry: 'embedded',
};

// Mapping topics → type de réalisation
const TYPE_MAP: Record<string, string> = {
  dashboard: 'dashboard', pipeline: 'pipeline', api: 'api',
  'rest-api': 'api', graphql: 'api', app: 'app', mobile: 'app',
};

function guessCategory(tags: string[]): string {
  for (const tag of tags) {
    const key = tag.toLowerCase().replace(/[\s.]/g, '');
    if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  }
  return '';
}

function guessType(topics: string[], repoUrl: string): string {
  for (const t of topics) {
    const key = t.toLowerCase();
    if (TYPE_MAP[key]) return TYPE_MAP[key];
  }
  if (repoUrl.includes('github.com')) return 'api';
  return 'app';
}

async function fetchGitHub(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'from0tohero' },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Repo GitHub introuvable ou privé');
  return res.json();
}

function extractMeta(html: string, tag: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${tag}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${tag}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${tag}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${tag}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function extractTitle(html: string): string {
  const og = extractMeta(html, 'title');
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? '';
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL requise' }, { status: 400 });

  let parsed: URL;
  try { parsed = new URL(url); } catch {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }

  try {
    // ── GitHub ────────────────────────────────────────────────────────────
    const ghMatch = parsed.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (parsed.hostname === 'github.com' && ghMatch) {
      const [, owner, repo] = ghMatch;
      const data = await fetchGitHub(owner, repo.replace(/\.git$/, ''));

      const topics: string[] = data.topics ?? [];
      const langs: string[]  = data.language ? [data.language] : [];
      const allTags          = [...topics, ...langs];
      const stack            = allTags.slice(0, 8).join(', ');
      const category         = guessCategory(allTags);
      const type             = guessType(topics, url);

      return NextResponse.json({
        title:    data.name?.replace(/-/g, ' ') ?? '',
        excerpt:  data.description ?? '',
        stack,
        category,
        type,
        repo_url: url,
        demo_url: data.homepage ?? '',
      });
    }

    // ── URL générique — extraction OG tags ────────────────────────────────
    const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const BROWSER_HEADERS = {
      'User-Agent': BROWSER_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
    };

    let pageRes = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
    });

    // Fallback Googlebot si la page bloque les navigateurs (rare mais possible)
    if (!pageRes.ok) {
      pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });
    }

    if (!pageRes.ok) throw new Error('Page inaccessible');

    const html    = await pageRes.text();
    const title   = extractTitle(html);
    const excerpt = extractMeta(html, 'description') || extractMeta(html, 'og:description');

    return NextResponse.json({
      title:    title,
      excerpt:  excerpt,
      stack:    '',
      category: '',
      type:     'app',
      demo_url: url,
      repo_url: '',
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors de la récupération';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
