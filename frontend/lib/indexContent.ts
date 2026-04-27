/**
 * Indexe un contenu dans pgvector pour Ask Hero (RAG).
 * Appel non-bloquant : utiliser avec .catch(() => {})
 *
 * Usage :
 *   indexContent({ content_type: 'tip', content_id: tip.id, title: '...', body: '...' }).catch(() => {});
 */

import { Mistral } from '@mistralai/mistralai';
import { createAdminClient } from '@/lib/supabase/admin';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export async function indexContent(item: {
  content_type: 'tip' | 'article' | 'collection' | 'realisation';
  content_id: string;
  title: string;
  body: string;
}) {
  const res = await mistral.embeddings.create({
    model: 'mistral-embed',
    inputs: [item.body.slice(0, 2000)],
  });
  const embedding = (res.data[0].embedding as number[]) ?? [];

  const supabase = createAdminClient();
  await supabase.from('content_embeddings').upsert(
    { ...item, embedding },
    { onConflict: 'content_type,content_id' }
  );
}
