-- ─────────────────────────────────────────
-- MIGRATION 023 — Reactions (likes)
-- ─────────────────────────────────────────

create table if not exists reactions (
  id           uuid primary key default uuid_generate_v4(),
  praticien_id uuid references praticiens(id) on delete cascade not null,
  content_type text not null check (content_type in ('realisation', 'article', 'tip')),
  content_id   uuid not null,
  created_at   timestamptz default now(),
  unique (praticien_id, content_type, content_id)
);

create index if not exists reactions_content_idx on reactions(content_type, content_id);
create index if not exists reactions_praticien_idx on reactions(praticien_id);

alter table reactions enable row level security;

-- Lecture publique des réactions (pour les comptes)
create policy "public read reactions"
  on reactions for select
  using (true);

-- Seul un praticien authentifié peut insérer sa propre réaction
create policy "user insert reaction"
  on reactions for insert
  with check (
    exists (
      select 1 from praticiens
      where praticiens.id = reactions.praticien_id
      and praticiens.user_id = auth.uid()
    )
  );

-- Seul le propriétaire peut supprimer sa réaction
create policy "user delete own reaction"
  on reactions for delete
  using (
    exists (
      select 1 from praticiens
      where praticiens.id = reactions.praticien_id
      and praticiens.user_id = auth.uid()
    )
  );
