-- ─────────────────────────────────────────
-- MIGRATION 025 — Comments
-- ─────────────────────────────────────────

create table if not exists comments (
  id           uuid primary key default uuid_generate_v4(),
  praticien_id uuid references praticiens(id) on delete cascade not null,
  content_type text not null check (content_type in ('realisation', 'article')),
  content_id   uuid not null,
  content      text not null check (char_length(content) >= 2 and char_length(content) <= 500),
  status       text not null default 'approved' check (status in ('approved', 'deleted')),
  created_at   timestamptz default now()
);

create index if not exists comments_content_idx  on comments(content_type, content_id);
create index if not exists comments_praticien_idx on comments(praticien_id);
create index if not exists comments_created_idx  on comments(created_at desc);

alter table comments enable row level security;

create policy "public read comments"
  on comments for select using (status = 'approved');

create policy "user insert comment"
  on comments for insert
  with check (
    exists (
      select 1 from praticiens
      where praticiens.id = comments.praticien_id
      and praticiens.user_id = auth.uid()
    )
  );

create policy "user soft delete own comment"
  on comments for update
  using (
    exists (
      select 1 from praticiens
      where praticiens.id = comments.praticien_id
      and praticiens.user_id = auth.uid()
    )
  )
  with check (status = 'deleted');
