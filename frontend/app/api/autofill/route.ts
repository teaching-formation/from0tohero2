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

// ── Medium : extrait via flux RSS de la publication ──────────────────────
async function fetchMediumViaRss(parsed: URL): Promise<{ title: string; excerpt: string; external_url: string } | null> {
  try {
    // Ex: /gitconnected/article-slug  ou  /@user/article-slug
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const pub = parts[0]; // publication ou @user
    const feedUrl = `https://medium.com/feed/${pub}`;

    const rssRes = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!rssRes.ok) return null;
    const rssText = await rssRes.text();

    // Cherche l'item dont le lien correspond à l'URL demandée (slug)
    const slug = parts[parts.length - 1].replace(/-[a-f0-9]{8,}$/, ''); // retire l'ID Medium final
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let bestItem: { title: string; excerpt: string; link: string } | null = null;
    let m: RegExpExecArray | null;

    while ((m = itemRegex.exec(rssText)) !== null) {
      const block = m[1];
      const linkMatch  = block.match(/<link[^>]*>([^<]+)<\/link>/i) || block.match(/<link>(.*?)<\/link>/i);
      const link = linkMatch?.[1]?.trim() ?? '';
      if (!link.includes(slug)) continue;

      const titleMatch = block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || block.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch  = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || block.match(/<description>([^<]+)<\/description>/i);
      const rawTitle   = titleMatch?.[1]?.trim() ?? '';
      let rawDesc      = descMatch?.[1]?.trim() ?? '';
      // Nettoie le HTML de la description RSS
      rawDesc = rawDesc.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').slice(0, 300).trim();

      bestItem = { title: rawTitle, excerpt: rawDesc, link };
      break;
    }

    if (!bestItem) {
      // Aucun item matchant — prend le premier du flux
      const firstItem = rssText.match(/<item>([\s\S]*?)<\/item>/i);
      if (!firstItem) return null;
      const block = firstItem[1];
      const titleMatch = block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || block.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch  = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
      const rawTitle   = titleMatch?.[1]?.trim() ?? '';
      let rawDesc      = descMatch?.[1]?.trim() ?? '';
      rawDesc = rawDesc.replace(/<[^>]+>/g, '').slice(0, 300).trim();
      const linkMatch  = block.match(/<link>(.*?)<\/link>/i);
      bestItem = { title: rawTitle, excerpt: rawDesc, link: linkMatch?.[1]?.trim() ?? '' };
    }

    return { title: bestItem.title, excerpt: bestItem.excerpt, external_url: bestItem.link || parsed.href };
  } catch {
    return null;
  }
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

    // ── Medium — via RSS (bloque le scraping direct depuis Vercel) ──────────
    if (parsed.hostname === 'medium.com' || parsed.hostname.endsWith('.medium.com')) {
      const mediumData = await fetchMediumViaRss(parsed);
      if (mediumData) {
        return NextResponse.json({
          title:        mediumData.title,
          excerpt:      mediumData.excerpt,
          external_url: mediumData.external_url,
          source:       'medium',
          stack:        '',
          category:     '',
        });
      }
    }

    // ── Substack — via RSS (username.substack.com) ────────────────────────
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
          const rssText    = await rssRes.text();
          const itemRegex  = /<item>([\s\S]*?)<\/item>/gi;
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
            if (title) return NextResponse.json({ title, excerpt, external_url: link || url, source: 'substack', stack: '', category: '' });
          }
        }
      } catch { /* fallback */ }
    }

    // ── Dev.to — via API publique ─────────────────────────────────────────
    if (parsed.hostname === 'dev.to') {
      try {
        // ex: /username/article-slug
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          const username = parts[0];
          const slug     = parts[1];
          const apiRes   = await fetch(`https://dev.to/api/articles/${username}/${slug}`, {
            headers: { 'User-Agent': 'from0tohero' },
            signal: AbortSignal.timeout(8000),
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            return NextResponse.json({
              title:        data.title ?? '',
              excerpt:      data.description ?? '',
              external_url: data.url ?? url,
              source:       'devto',
              stack:        (data.tags ?? []).join(', '),
              category:     guessCategory(data.tags ?? []),
            });
          }
        }
      } catch { /* fallback */ }
    }

    // ── LinkedIn — impossible à scraper, retourne message guidé ──────────
    if (parsed.hostname.includes('linkedin.com')) {
      return NextResponse.json({
        error: 'LinkedIn ne permet pas la récupération automatique. Remplis le titre et la description manuellement, puis colle l\'URL dans le champ "Lien externe".',
      }, { status: 422 });
    }

    // ── YouTube — via oEmbed ──────────────────────────────────────────────
    if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
          signal: AbortSignal.timeout(6000),
        });
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          return NextResponse.json({
            title:        data.title ?? '',
            excerpt:      '',
            external_url: url,
            source:       'youtube',
            stack:        '',
            category:     '',
          });
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

    // Fallback Googlebot si la page bloque les navigateurs
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
      title,
      excerpt,
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
