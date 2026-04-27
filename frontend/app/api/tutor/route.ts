import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export async function POST(request: Request) {
  try {
    const { question, locale = 'fr', history = [] } = await request.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question requise' }, { status: 400 });
    }

    // 1. Embedding de la question
    const embRes = await mistral.embeddings.create({
      model: 'mistral-embed',
      inputs: [question],
    });
    const queryEmbedding = embRes.data[0].embedding;

    // 2. Recherche du contenu similaire dans Supabase
    const supabase = await createClient();
    const { data: matches } = await supabase.rpc('search_content', {
      query_embedding: queryEmbedding,
      match_threshold: 0.45,
      match_count: 6,
    });

    // 3. Construction du contexte
    const context = matches && matches.length > 0
      ? matches
          .map((m: { content_type: string; title: string; body: string }) =>
            `[${m.content_type}] ${m.title}: ${m.body}`
          )
          .join('\n\n')
      : '';

    const langInstruction = locale === 'fr'
      ? 'Tu réponds toujours en français, de manière claire et concise.'
      : 'You always respond in English, clearly and concisely.';

    const systemPrompt = `Tu es Ask Hero, le tuteur IA de from0tohero.dev — une plateforme communautaire de praticiens tech africains et de la diaspora (Data, DevOps, Cloud, IA, Cybersécurité, Dev). ${langInstruction}

Tu aides les utilisateurs à progresser dans la tech en t'appuyant sur les ressources de la communauté : tips, articles, collections et réalisations de praticiens.

${context
  ? `Voici les ressources pertinentes de la communauté :\n\n${context}\n\nUtilise ces ressources pour enrichir ta réponse quand c'est pertinent.`
  : 'Tu peux répondre avec tes connaissances générales en tech.'}

Règles :
- Réponds en 2-4 paragraphes maximum
- Sois direct, bienveillant et encourageant
- Si tu mentionnes une ressource du site, précise son type (tip, article, collection)
- Si tu ne sais pas, dis-le honnêtement
- Encourage l'utilisateur à explorer la communauté from0tohero`;

    // 4. Chat Mistral avec historique
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: question },
    ];

    const chatRes = await mistral.chat.complete({
      model: 'open-mixtral-8x7b',
      messages,
      maxTokens: 600,
      temperature: 0.7,
    });

    const answer = chatRes.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({ answer, sources: matches?.length ?? 0 });
  } catch (err) {
    console.error('[tutor]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
