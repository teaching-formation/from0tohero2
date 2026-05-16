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
    const queryEmbedding = embRes.data[0]?.embedding;
    if (!queryEmbedding) {
      return NextResponse.json({ error: 'Embedding indisponible' }, { status: 500 });
    }

    // 2. Recherche du contenu similaire dans Supabase
    const supabase = createAdminClient();
    const { data: matches } = await supabase.rpc('search_content', {
      query_embedding: queryEmbedding,
      match_threshold: 0.65,
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

from0tohero.dev est une plateforme communautaire de praticiens tech africains et de la diaspora. Elle regroupe des profils de praticiens (Data Engineers, DevOps, Cloud Architects, développeurs IA, experts Cybersécurité, développeurs Web/Mobile), leurs réalisations concrètes, leurs tips & TIL, leurs articles et leurs collections de ressources.

Tu aides les utilisateurs à progresser dans la tech : apprendre, trouver des ressources, comprendre des concepts, progresser de zéro à praticien confirmé.

${context
  ? `=== RESSOURCES RÉELLES DE LA COMMUNAUTÉ ===\n${context}\n=== FIN DES RESSOURCES ===\n\nBasé-toi EXCLUSIVEMENT sur les ressources ci-dessus. Les URLs présentes dans ces ressources (format "URL: https://...") sont les seules URLs réelles que tu peux mentionner. Cite le titre exact et l'URL exacte tels qu'ils apparaissent dans les ressources.`
  : `Aucune ressource de la communauté ne correspond à cette question. Réponds avec tes connaissances générales en tech, sans mentionner de ressources from0tohero qui n'existent pas.`}

RÈGLES ABSOLUES — violation = réponse incorrecte :
1. JAMAIS inventer une URL. Seules les URLs au format "URL: https://..." dans le contexte ci-dessus existent réellement.
2. JAMAIS construire une URL comme /articles/[titre] ou /praticiens/[nom] — tu ne connais pas les vrais slugs.
3. JAMAIS citer un praticien, article, collection ou projet qui n'est PAS dans le contexte fourni.
4. Si le contexte ne contient pas de ressource pertinente, dis-le honnêtement et réponds avec des conseils généraux.
5. Réponds en 2-3 paragraphes max, sois direct et bienveillant.
6. Pour orienter vers le site sans ressource spécifique, utilise uniquement : from0tohero.dev/tips, from0tohero.dev/articles, from0tohero.dev/collections, from0tohero.dev/realisations, from0tohero.dev/praticiens
7. Utilise **gras** uniquement pour les termes importants. Pas de listes à puces excessives.`;

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
      temperature: 0.1,
    });

    const answer = chatRes.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({ answer, sources: matches?.length ?? 0 });
  } catch (err) {
    console.error('[tutor]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
