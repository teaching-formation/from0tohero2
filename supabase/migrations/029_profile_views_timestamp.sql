-- ─────────────────────────────────────────
-- MIGRATION 029 — viewed_at : date → timestamptz
-- ─────────────────────────────────────────
-- Nécessaire pour afficher l'heure de visite

alter table profile_views
  alter column viewed_at type timestamptz
  using viewed_at::timestamptz;

alter table profile_views
  alter column viewed_at set default now();
