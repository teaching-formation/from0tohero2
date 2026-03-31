-- ─────────────────────────────────────────────────────────────
-- MIGRATION 008 — realisations: type_label + enum 'app'
-- ─────────────────────────────────────────────────────────────

-- 1. Ajoute 'app' dans l'enum realisation_type
--    (le formulaire propose "App Web / Mobile" avec la valeur 'app')
ALTER TYPE realisation_type ADD VALUE IF NOT EXISTS 'app';

-- 2. Colonne type_label pour stocker le label quand type = 'autre'
ALTER TABLE realisations
  ADD COLUMN IF NOT EXISTS type_label text;
