import type { NextApiRequest, NextApiResponse } from 'next';

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

const TYPE_MAP: Record<string, string> = {
  dashboard: 'dashboard', pipeline: 'pipeline', api: 'api',
  'rest-api': 'api', graphql: 'api', app: 'app', mobile: 'app',
};

function detectSource(url: string): string {
  if (url.includes('medium.com'))   return 'medium';
  if (url.includes('substack.com')) return 'substack';
  if (url.includes('dev.to'))       return 'devto';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('youtube.com'))  return 'youtube';
  return 'blog';
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  let parsed: URL;
  try { parsed = new URL(url); } catch {
    return res.status(400).json({ error: 'URL invalide' });
  }

  try {
    // ── GitHub ────────────────────────────────────────────────────────────
    const ghMatch = parsed.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (parsed.hostname === 'github.com' && ghMatch) {
      const [, owner, repo] = ghMatch;
      const ghHeaders: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'from0tohero-admin',
      };
      if (process.env.GITHUB_TOKEN) ghHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
      const ghRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, '')}`,
        { headers: ghHeaders }
      );
      if (!ghRes.ok) throw new Error('Repo GitHub introuvable ou privé');
      const data = await ghRes.json();

      const topics: string[] = data.topics ?? [];
      const langs: string[]  = data.language ? [data.language] : [];
      const allTags          = [...topics, ...langs];

      return res.json({
        title:    data.name?.replace(/-/g, ' ') ?? '',
        excerpt:  data.description ?? '',
        stack:    allTags.slice(0, 8).join(', '),
        category: guessCategory(allTags),
        type:     guessType(topics, url),
        repo_url: url,
        demo_url: data.homepage ?? '',
      });
    }

    // ── Medium — via RSS ──────────────────────────────────────────────────
    if (parsed.hostname === 'medium.com' || parsed.hostname.endsWith('.medium.com')) {
      try {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const pub = parts[0];
          const slug = parts[parts.length - 1].replace(/-[a-f0-9]{8,}$/, '');
          const feedUrl = `https://medium.com/feed/${pub}`;
          const rssRes = await fetch(feedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
            signal: AbortSignal.timeout(10000),
          });
          if (rssRes.ok) {
            const rssText = await rssRes.text();
            const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
            let m: RegExpExecArray | null;
            let title = '', excerpt = '', link = '';
            while ((m = itemRegex.exec(rssText)) !== null) {
              const block = m[1];
              const linkMatch = block.match(/<link>(.*?)<\/link>/i);
              if (!linkMatch?.[1]?.includes(slug)) continue;
              const titleMatch = block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || block.match(/<title[^>]*>([^<]+)<\/title>/i);
              const descMatch  = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
              title   = titleMatch?.[1]?.trim() ?? '';
              excerpt = (descMatch?.[1] ?? '').replace(/<[^>]+>/g, '').slice(0, 300).trim();
              link    = linkMatch[1].trim();
              break;
            }
            if (title) {
              return res.json({ title, excerpt, external_url: link || url, source: 'medium', stack: '', category: '' });
            }
          }
        }
      } catch { /* fallback vers scraping générique */ }
    }

    // ── Substack — via RSS ────────────────────────────────────────────────
    if (parsed.hostname.endsWith('.substack.com')) {
      try {
        const feedUrl = `${parsed.protocol}//${parsed.hostname}/feed`;
        const parts   = parsed.pathname.split('/').filter(Boolean);
        const slug    = parts[parts.length - 1] ?? '';
        const rssRes  = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
          signal: AbortSignal.timeout(10000),
        });
        if (rssRes.ok) {
          const rssText   = await rssRes.text();
          const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
          let m: RegExpExecArray | null;
          while ((m = itemRegex.exec(rssText)) !== null) {
            const block     = m[1];
            const linkMatch = block.match(/<link>(.*?)<\/link>/i);
            const link      = linkMatch?.[1]?.trim() ?? '';
            if (slug && !link.includes(slug)) continue;
            const titleMatch = block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || block.match(/<title>([^<]+)<\/title>/i);
            const descMatch  = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
            const title      = titleMatch?.[1]?.trim() ?? '';
            const excerpt    = (descMatch?.[1] ?? '').replace(/<[^>]+>/g, '').slice(0, 300).trim();
            if (title) return res.json({ title, excerpt, external_url: link || url, source: 'substack', stack: '', category: '' });
          }
        }
      } catch { /* fallback */ }
    }

    // ── Dev.to — via API publique ─────────────────────────────────────────
    if (parsed.hostname === 'dev.to') {
      try {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const apiRes = await fetch(`https://dev.to/api/articles/${parts[0]}/${parts[1]}`, {
            headers: { 'User-Agent': 'from0tohero' },
            signal: AbortSignal.timeout(8000),
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            return res.json({ title: data.title ?? '', excerpt: data.description ?? '', external_url: data.url ?? url, source: 'devto', stack: (data.tags ?? []).join(', '), category: guessCategory(data.tags ?? []) });
          }
        }
      } catch { /* fallback */ }
    }

    // ── LinkedIn — impossible à scraper ───────────────────────────────────
    if (parsed.hostname.includes('linkedin.com')) {
      return res.status(422).json({ error: "LinkedIn ne permet pas la récupération automatique. Remplis le titre et la description manuellement, puis colle l'URL dans le champ \"Lien externe\"." });
    }

    // ── YouTube — via oEmbed ──────────────────────────────────────────────
    if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { signal: AbortSignal.timeout(6000) });
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          return res.json({ title: data.title ?? '', excerpt: '', external_url: url, source: 'youtube', stack: '', category: '' });
        }
      } catch { /* fallback */ }
    }

    // ── URL générique — extraction OG tags ────────────────────────────────
    const BROWSER_HEADERS = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
    };

    let pageRes = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
    });

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

    return res.json({
      title,
      excerpt,
      stack:        '',
      category:     '',
      type:         'app',
      demo_url:     url,
      repo_url:     '',
      external_url: url,
      source:       detectSource(url),
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors de la récupération';
    return res.status(422).json({ error: msg });
  }
}
