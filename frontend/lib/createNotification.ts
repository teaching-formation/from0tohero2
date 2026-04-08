import { supabaseAdmin } from '@/lib/supabaseAdmin';

type NotifPayload = {
  praticien_id: string;   // destinataire
  type: 'like' | 'comment' | 'follow' | 'coauteur';
  actor_id?: string;
  content_type?: 'realisation' | 'article' | 'tip';
  content_id?: string;
  content_title?: string;
};

// Fire-and-forget : ne pas await côté appelant
export async function createNotification(payload: NotifPayload) {
  // Ne pas notifier si l'acteur est le destinataire
  if (payload.actor_id && payload.actor_id === payload.praticien_id) return;

  await supabaseAdmin.from('notifications').insert({
    praticien_id:  payload.praticien_id,
    type:          payload.type,
    actor_id:      payload.actor_id ?? null,
    content_type:  payload.content_type ?? null,
    content_id:    payload.content_id ?? null,
    content_title: payload.content_title ?? null,
  });
}
