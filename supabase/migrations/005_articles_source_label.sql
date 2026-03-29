-- ─────────────────────────────────────────
-- MIGRATION 005 — articles: colonne source_label
-- ─────────────────────────────────────────

-- Stocke le nom de la plateforme quand source = 'autre'
-- Ex: "Hashnode", "Dev Community", "Mon blog"
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS source_label text;
