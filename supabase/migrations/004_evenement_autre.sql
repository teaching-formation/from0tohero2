-- ─────────────────────────────────────────
-- MIGRATION 004 — evenement_type: ajout de 'autre' + colonne type_label
-- ─────────────────────────────────────────

-- 1. Ajout de la valeur 'autre' dans l'enum evenement_type
ALTER TYPE evenement_type ADD VALUE IF NOT EXISTS 'autre';

-- 2. Colonne type_label : stocke la précision quand type = 'autre'
--    Ex: "Salon Data", "Forum Tech", etc.
ALTER TABLE evenements
  ADD COLUMN IF NOT EXISTS type_label text;
