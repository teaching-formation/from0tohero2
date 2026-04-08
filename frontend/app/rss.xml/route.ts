import { createClient } from '@/lib/supabase/server';

const SITE = 'https://from0tohero.dev';

function escape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const supabase = await createClient();

  const [{ data: articles }, { data: tips }, { data: realisations }] = await Promise.all([
    supabase.from('articles').select('slug, title, excerpt, author, created_at, category, external_url').eq('status', 'approved').order('created_at', { ascending: false }).limit(30),
    supabase.from('tips').select('id, content, type, category, created_at, praticiens(name, slug)').eq('status', 'approved').order('created_at', { ascending: false }).limit(30),
    supabase.from('realisations').select('slug, title, excerpt, created_at, category, praticiens(name)').eq('status', 'approved').order('created_at', { ascending: false }).limit(30),
  ]);

  type Item = { date: string; xml: string };
  const items: Item[] = [];

  for (const a of articles ?? []) {
    items.push({
      date: a.created_at,
      xml: `
    <item>
      <title>${escape(a.title)}</title>
      <link>${escape(a.external_url ?? `${SITE}/articles`)}</link>
      <guid isPermaLink="false">${SITE}/articles#${escape(a.slug)}</guid>
      <description>${escape(a.excerpt ?? '')}</description>
      <author>${escape(a.author)}</author>
      <category>${escape(a.category)}</category>
      <pubDate>${new Date(a.created_at).toUTCString()}</pubDate>
    </item>`,
    });
  }

  for (const t of tips ?? []) {
    const author = (t.praticiens as any)?.name ?? 'Praticien';
    const slug = (t.praticiens as any)?.slug ?? '';
    items.push({
      date: t.created_at,
      xml: `
    <item>
      <title>${escape(`[${t.type.toUpperCase()}] ${String(t.content).slice(0, 80)}…`)}</title>
      <link>${SITE}/tips</link>
      <guid isPermaLink="false">${SITE}/tips#${t.id}</guid>
      <description>${escape(String(t.content))}</description>
      <author>${escape(author)}</author>
      <category>${escape(t.category)}</category>
      <pubDate>${new Date(t.created_at).toUTCString()}</pubDate>
    </item>`,
    });
  }

  for (const r of realisations ?? []) {
    const author = (r.praticiens as any)?.name ?? 'Praticien';
    items.push({
      date: r.created_at,
      xml: `
    <item>
      <title>${escape(r.title)}</title>
      <link>${SITE}/realisations/${escape(r.slug)}</link>
      <guid isPermaLink="true">${SITE}/realisations/${escape(r.slug)}</guid>
      <description>${escape(r.excerpt ?? '')}</description>
      <author>${escape(author)}</author>
      <category>${escape(r.category)}</category>
      <pubDate>${new Date(r.created_at).toUTCString()}</pubDate>
    </item>`,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>from0tohero.dev</title>
    <link>${SITE}</link>
    <description>Articles, réalisations et tips de praticiens tech africains.</description>
    <language>fr</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items.map(i => i.xml).join('')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
