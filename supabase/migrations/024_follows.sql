-- ─────────────────────────────────────────
-- MIGRATION 024 — Follows (suivre un praticien)
-- ─────────────────────────────────────────

create table if not exists follows (
  id           uuid primary key default uuid_generate_v4(),
  follower_id  uuid references praticiens(id) on delete cascade not null,
  following_id uuid references praticiens(id) on delete cascade not null,
  created_at   timestamptz default now(),
  unique (follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

create index if not exists follows_follower_idx  on follows(follower_id);
create index if not exists follows_following_idx on follows(following_id);

alter table follows enable row level security;

create policy "public read follows"
  on follows for select using (true);

create policy "user insert follow"
  on follows for insert
  with check (
    exists (
      select 1 from praticiens
      where praticiens.id = follows.follower_id
      and praticiens.user_id = auth.uid()
    )
  );

create policy "user delete own follow"
  on follows for delete
  using (
    exists (
      select 1 from praticiens
      where praticiens.id = follows.follower_id
      and praticiens.user_id = auth.uid()
    )
  );
