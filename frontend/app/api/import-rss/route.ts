import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function tag(xml: string, name: string): string {
  const patterns = [
    new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>`, 'i'),
    new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'),
  ];
  for (const p of patterns) {
    const m = xml.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function attr(xml: string, name: string, attribute: string): string {
  const m = xml.match(new RegExp(`<${name}[^>]+${attribute}=["']([^"']+)["']`, 'i'));
  return m?.[1]?.trim() ?? '';
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
}

function parseDate(s: string): string {
  if (!s) return '';
  try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; }
}

function detectSource(url: string): string {
  if (url.includes('medium.com'))    return 'medium';
  if (url.includes('substack.com'))  return 'substack';
  if (url.includes('dev.to'))        return 'devto';
  if (url.includes('youtube.com'))   return 'youtube';
  if (url.includes('linkedin.com'))  return 'linkedin';
  return 'blog';
}

const CATEGORY_MAP: Record<string, string> = {
  data: 'data', 'data-engineering': 'data', 'data-science': 'data', analytics: 'data',
  devops: 'devops', 'ci-cd': 'devops', docker: 'devops', kubernetes: 'devops',
  cloud: 'cloud', aws: 'cloud', gcp: 'cloud', azure: 'cloud',
  'machine-learning': 'ia', 'deep-learning': 'ia', ai: 'ia', llm: 'ia', nlp: 'ia',
  'artificial-intelligence': 'ia',
  react: 'frontend', vue: 'frontend', frontend: 'frontend', css: 'frontend', nextjs: 'frontend',
  backend: 'backend', api: 'backend', node: 'backend', django: 'backend', fastapi: 'backend',
  mobile: 'mobile', flutter: 'mobile', ios: 'mobile', android: 'mobile',
  blockchain: 'web3', web3: 'web3', solidity: 'web3',
  iot: 'embedded', embedded: 'embedded', arduino: 'embedded',
};

function guessCategory(tags: string[]): string {
  for (const t of tags) {
    const key = t.toLowerCase().replace(/[\s_]/g, '-');
    if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  }
  return 'data';
}

function parseItems(xml: string) {
  // RSS 2.0 items
  const rssItems = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  if (rssItems.length > 0) {
    return rssItems.map(item => {
      const categories = [...item.matchAll(/<category[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/gi)]
        .map(m => m[1].trim()).filter(Boolean);
      const link = tag(item, 'link') || tag(item, 'guid') ||
        item.match(/<link\s*\/?>(https?:\/\/[^\s<]+)/i)?.[1] || '';
      return {
        title:    tag(item, 'title'),
        link:     link.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim(),
        pubDate:  tag(item, 'pubDate') || tag(item, 'dc:date'),
        excerpt:  stripHtml(tag(item, 'description') || tag(item, 'content:encoded') || ''),
        categories,
      };
    });
  }
  // Atom entries
  const atomEntries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  return atomEntries.map(entry => {
    const categories = [...entry.matchAll(/<category[^>]+term=["']([^"']+)["']/gi)]
      .map(m => m[1].trim()).filter(Boolean);
    return {
      title:    tag(entry, 'title'),
      link:     attr(entry, 'link', 'href') || tag(entry, 'link'),
      pubDate:  tag(entry, 'published') || tag(entry, 'updated'),
      excerpt:  stripHtml(tag(entry, 'summary') || tag(entry, 'content') || ''),
      categories,
    };
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL requise' }, { status: 400 });

  // Normalise l'URL vers un feed RSS connu
  let feedUrl = url.trim();
  try {
    const u = new URL(feedUrl);
    if (u.hostname === 'medium.com' && !feedUrl.includes('/feed')) {
      // https://medium.com/@username → https://medium.com/feed/@username
      feedUrl = feedUrl.replace('medium.com/', 'medium.com/feed/');
    } else if (u.hostname.endsWith('substack.com') && !feedUrl.includes('/feed')) {
      feedUrl = feedUrl.replace(/\/?$/, '/feed');
    } else if (u.hostname === 'dev.to' && !feedUrl.includes('/feed')) {
      feedUrl = feedUrl.replace('dev.to/', 'dev.to/feed/');
    } else if (u.hostname === 'www.linkedin.com' || u.hostname === 'linkedin.com') {
      // LinkedIn Newsletter RSS : linkedin.com/newsletters/slug-ID/ → feed/
      if (u.pathname.includes('/newsletters/') && !feedUrl.includes('/feed')) {
        feedUrl = feedUrl.replace(/\/?$/, '/feed/');
      } else if (!u.pathname.includes('/newsletters/')) {
        return NextResponse.json(
          { error: 'LinkedIn ne supporte pas le RSS pour les profils. Utilise une URL de newsletter LinkedIn (linkedin.com/newsletters/…).' },
          { status: 422 }
        );
      }
    }
  } catch {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }

  // Récupère le praticien pour filtrer les articles déjà importés
  const { data: praticien } = await supabaseAdmin
    .from('praticiens').select('id').eq('user_id', user.id).maybeSingle();

  const importedUrls = new Set<string>();
  if (praticien) {
    const { data: existing } = await supabaseAdmin
      .from('articles').select('external_url').eq('praticien_id', praticien.id);
    (existing || []).forEach(a => {
      if (a.external_url) importedUrls.add(a.external_url.toLowerCase().replace(/\/$/, ''));
    });
  }

  // Fetch du flux RSS
  let xml = '';
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; from0tohero/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Feed inaccessible (${res.status})`);
    xml = await res.text();
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Impossible de lire le flux RSS' },
      { status: 422 }
    );
  }

  const items = parseItems(xml);
  if (items.length === 0)
    return NextResponse.json({ error: 'Aucun article trouvé dans ce flux.' }, { status: 422 });

  const source = detectSource(feedUrl);

  const articles = items.slice(0, 30).map(item => ({
    title:            item.title,
    link:             item.link,
    date_published:   parseDate(item.pubDate),
    excerpt:          item.excerpt,
    category:         guessCategory(item.categories),
    source,
    already_imported: importedUrls.has(item.link.toLowerCase().replace(/\/$/, '')),
  })).filter(a => a.title && a.link);

  return NextResponse.json({ articles, feedUrl });
}
