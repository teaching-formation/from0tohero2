import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
    const supabase = createAdminClient();
    const { data: matches } = await supabase.rpc('search_content', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
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

    const systemPrompt = `Tu es Ask Hero, le tuteur IA de from0tohero.dev. ${langInstruction}

from0tohero.dev est une plateforme communautaire de praticiens tech africains et de la diaspora. Elle regroupe des profils de praticiens (Data Engineers, DevOps, Cloud Architects, développeurs IA, experts Cybersécurité, développeurs Web/Mobile), leurs réalisations concrètes (pipelines, dashboards, APIs, apps, bootcamps, chaînes YouTube), leurs tips & TIL, leurs articles et leurs collections de ressources.

Tu aides les utilisateurs à progresser dans la tech : apprendre, trouver des ressources, comprendre des concepts, progresser de zéro à praticien confirmé.

${context
  ? `Voici les ressources de la communauté from0tohero qui correspondent à la question :\n\n${context}\n\nUTILISE UNIQUEMENT ces ressources pour illustrer ta réponse. Ne cite que ce qui est explicitement présent ci-dessus.`
  : 'Aucune ressource spécifique de la communauté ne correspond à cette question.'}

Règles ABSOLUES — à respecter strictement :
- N'invente JAMAIS une URL, un lien, un titre d'article ou une ressource qui ne figure pas dans le contexte fourni ci-dessus
- Si tu n'as pas de ressource correspondante dans le contexte, réponds avec tes connaissances générales en tech sans prétendre que ça vient du site
- Ne fabrique PAS de noms de praticiens, de projets ou de collections qui ne sont pas dans le contexte
- Réponds en 2-3 paragraphes max, sois direct et bienveillant
- Pour renvoyer vers le site, utilise uniquement ces sections réelles : /tips, /articles, /collections, /realisations, /praticiens
- Ne mets pas d'astérisques Markdown dans ta réponse sauf pour le gras **mot**`;

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
      model: 'mistral-small-latest',
      messages,
      maxTokens: 500,
      temperature: 0.3,
    });

    const answer = chatRes.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({ answer, sources: matches?.length ?? 0 });
  } catch (err) {
    console.error('[tutor]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
