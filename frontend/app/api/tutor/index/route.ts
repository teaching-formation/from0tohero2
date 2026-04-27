import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

async function embed(text: string): Promise<number[]> {
  const res = await mistral.embeddings.create({
    model: 'mistral-embed',
    inputs: [text.slice(0, 2000)], // sécurité token limit
  });
  return (res.data[0].embedding as number[]) ?? [];
}

async function upsert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: { content_type: string; content_id: string; title: string; body: string; embedding: number[] }
) {
  await supabase.from('content_embeddings').upsert(row, {
    onConflict: 'content_type,content_id',
  });
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = await createClient();
    let indexed = 0;

    // ── TIPS ──────────────────────────────────────────────────
    const { data: tips } = await supabase
      .from('tips')
      .select('id, content, type, category, stack')
      .eq('status', 'approved');

    for (const tip of tips ?? []) {
      const body = `[${tip.type}] Catégorie: ${tip.category}. ${tip.content}`;
      const embedding = await embed(body);
      await upsert(supabase, {
        content_type: 'tip',
        content_id: tip.id,
        title: `${tip.type} · ${tip.category}`,
        body,
        embedding,
      });
      indexed++;
    }

    // ── ARTICLES ──────────────────────────────────────────────
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, excerpt, category, source')
      .eq('status', 'approved');

    for (const article of articles ?? []) {
      const body = `${article.title}. ${article.excerpt ?? ''}`.trim();
      const embedding = await embed(body);
      await upsert(supabase, {
        content_type: 'article',
        content_id: article.id,
        title: article.title,
        body,
        embedding,
      });
      indexed++;
    }

    // ── COLLECTIONS ───────────────────────────────────────────
    const { data: collections } = await supabase
      .from('collections')
      .select('id, title, description, items')
      .eq('status', 'approved');

    for (const col of collections ?? []) {
      const items = Array.isArray(col.items)
        ? (col.items as { title: string }[]).map(i => i.title).join(', ')
        : '';
      const body = `${col.title}. ${col.description ?? ''} Ressources : ${items}`.trim();
      const embedding = await embed(body);
      await upsert(supabase, {
        content_type: 'collection',
        content_id: col.id,
        title: col.title,
        body,
        embedding,
      });
      indexed++;
    }

    // ── RÉALISATIONS ──────────────────────────────────────────
    const { data: reals } = await supabase
      .from('realisations')
      .select('id, title, excerpt, category, type, stack')
      .eq('status', 'approved');

    for (const r of reals ?? []) {
      const body = `${r.title}. ${r.excerpt ?? ''} Stack: ${(r.stack ?? []).join(', ')}`.trim();
      const embedding = await embed(body);
      await upsert(supabase, {
        content_type: 'realisation',
        content_id: r.id,
        title: r.title,
        body,
        embedding,
      });
      indexed++;
    }

    return NextResponse.json({ success: true, indexed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[tutor/index]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
