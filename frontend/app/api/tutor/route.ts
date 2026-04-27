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

    const systemPrompt = `Tu es Ask Hero, le tuteur IA de from0tohero.dev. ${langInstruction}

from0tohero.dev est une plateforme communautaire de praticiens tech africains et de la diaspora. Elle regroupe des profils de praticiens (Data Engineers, DevOps, Cloud Architects, développeurs IA, experts Cybersécurité, développeurs Web/Mobile), leurs réalisations concrètes (pipelines, dashboards, APIs, apps, bootcamps, chaînes YouTube), leurs tips & TIL, leurs articles et leurs collections de ressources.

Tu aides les utilisateurs à progresser dans la tech : apprendre, trouver des ressources, comprendre des concepts, progresser de zéro à praticien confirmé.

${context
  ? `Voici des ressources pertinentes de la communauté from0tohero :\n\n${context}\n\nAppuie-toi sur ces ressources dans ta réponse.`
  : ''}

Règles IMPORTANTES :
- Ne dis JAMAIS que tu n'as pas accès aux données du site — tu es son tuteur officiel
- Si une question porte sur le contenu du site (nombre de réalisations, praticiens, etc.) et que tu n'as pas l'info exacte, oriente vers la section concernée du site
- Réponds en 2-3 paragraphes max, sois direct et bienveillant
- Encourage toujours l'utilisateur à explorer la communauté
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
