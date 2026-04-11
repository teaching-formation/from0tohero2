import { supabaseAdmin } from '@/lib/supabaseAdmin';

type NotifType = 'like' | 'comment' | 'follow' | 'coauteur' | 'new_content';
type ContentType = 'realisation' | 'article' | 'tip' | 'evenement';

type NotifPayload = {
  praticien_id: string;   // destinataire
  type: NotifType;
  actor_id?: string;
  content_type?: ContentType;
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

// Notifie tous les followers d'un praticien quand il publie du contenu
export async function notifyFollowers(opts: {
  praticien_id: string;          // l'auteur du contenu
  content_type: ContentType;
  content_id: string;
  content_title: string;
}) {
  // Récupère tous les followers
  const { data: followers } = await supabaseAdmin
    .from('follows')
    .select('follower_id')
    .eq('following_id', opts.praticien_id);

  if (!followers || followers.length === 0) return;

  // Crée une notif pour chaque follower (batch insert)
  const notifs = followers
    .filter(f => f.follower_id !== opts.praticien_id) // pas de self-notif
    .map(f => ({
      praticien_id:  f.follower_id,
      type:          'new_content' as NotifType,
      actor_id:      opts.praticien_id,
      content_type:  opts.content_type,
      content_id:    opts.content_id,
      content_title: opts.content_title.slice(0, 120),
    }));

  if (notifs.length === 0) return;
  await supabaseAdmin.from('notifications').insert(notifs);
}
