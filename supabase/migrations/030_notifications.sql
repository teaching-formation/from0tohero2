-- ─────────────────────────────────────────
-- MIGRATION 030 — Notifications in-app
-- ─────────────────────────────────────────

create table if not exists notifications (
  id           uuid primary key default uuid_generate_v4(),
  praticien_id uuid references praticiens(id) on delete cascade not null,
  type         text not null check (type in ('like', 'comment', 'follow', 'coauteur')),
  -- qui a déclenché la notif
  actor_id     uuid references praticiens(id) on delete set null,
  -- contenu concerné (optionnel)
  content_type text check (content_type in ('realisation', 'article', 'tip')),
  content_id   uuid,
  content_title text,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifs_praticien_idx on notifications(praticien_id, read, created_at desc);

alter table notifications enable row level security;

-- Seul le destinataire peut lire ses notifs
create policy "user read own notifications"
  on notifications for select
  using (
    exists (
      select 1 from praticiens
      where praticiens.id = notifications.praticien_id
        and praticiens.user_id = auth.uid()
    )
  );

-- Seul le destinataire peut marquer comme lu
create policy "user update own notifications"
  on notifications for update
  using (
    exists (
      select 1 from praticiens
      where praticiens.id = notifications.praticien_id
        and praticiens.user_id = auth.uid()
    )
  )
  with check (read = true);

-- Insert autorisé via service role uniquement (APIs serveur)
-- Le insert public est volontairement absent : on passe par les APIs
