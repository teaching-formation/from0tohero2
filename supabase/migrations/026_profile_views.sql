-- ─────────────────────────────────────────
-- MIGRATION 026 — Profile views (analytics)
-- ─────────────────────────────────────────

create table if not exists profile_views (
  id           uuid primary key default uuid_generate_v4(),
  praticien_id uuid references praticiens(id) on delete cascade not null,
  viewed_at    date not null default current_date
);

create index if not exists profile_views_praticien_date_idx
  on profile_views(praticien_id, viewed_at desc);

alter table profile_views enable row level security;

-- Tout le monde peut enregistrer une vue (anonyme ou connecté)
create policy "public insert profile_view"
  on profile_views for insert with check (true);

-- Seul le praticien peut lire ses propres stats
create policy "user read own profile_views"
  on profile_views for select
  using (
    exists (
      select 1 from praticiens
      where praticiens.id = profile_views.praticien_id
      and praticiens.user_id = auth.uid()
    )
  );
