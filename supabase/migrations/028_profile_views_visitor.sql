-- ─────────────────────────────────────────
-- MIGRATION 028 — Ajout visitor_id sur profile_views
-- ─────────────────────────────────────────
-- Permet de savoir qui a visité un profil (null = visiteur anonyme)

alter table profile_views
  add column if not exists visitor_id uuid references praticiens(id) on delete set null;

create index if not exists profile_views_visitor_idx
  on profile_views(praticien_id, visitor_id, viewed_at desc);
