-- ─────────────────────────────────────────────────────────────
-- MIGRATION 007 — S'assure que RLS est activé sur toutes les tables
-- (idempotent — les policies publiques sont déjà définies dans 001_init.sql)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE praticiens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE realisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE soumissions  ENABLE ROW LEVEL SECURITY;
