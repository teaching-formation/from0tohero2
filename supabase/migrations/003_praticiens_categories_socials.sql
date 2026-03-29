-- ─────────────────────────────────────────
-- MIGRATION 003 — colonne categories[] sur praticiens
-- ─────────────────────────────────────────

-- Ajout de la colonne categories (tableau) pour stocker plusieurs catégories
ALTER TABLE praticiens
  ADD COLUMN IF NOT EXISTS categories text[] default '{}';

-- Index pour filtrer par catégorie
CREATE INDEX IF NOT EXISTS idx_praticiens_categories ON praticiens USING GIN (categories);
