-- ─────────────────────────────────────────
-- MIGRATION 002 — Nouvelles catégories + réseaux sociaux
-- ─────────────────────────────────────────

-- 1. Ajout des nouvelles valeurs à l'enum category_type
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'frontend';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'backend';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'fullstack';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'mobile';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'web3';
ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'embedded';

-- 2. Ajout des nouveaux réseaux sociaux dans praticiens
ALTER TABLE praticiens
  ADD COLUMN IF NOT EXISTS twitter_url   text,
  ADD COLUMN IF NOT EXISTS whatsapp_url  text;

-- 3. Fonction RPC pour vérifier la disponibilité d'un username (slug)
--    SECURITY DEFINER = bypass RLS, retourne uniquement un booléen
--    → vérifie praticiens (tous statuts) + soumissions pending
CREATE OR REPLACE FUNCTION is_slug_available(p_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_in_praticiens boolean;
  exists_in_soumissions boolean;
BEGIN
  -- Vérifie dans praticiens (approved + pending + rejected)
  SELECT EXISTS (
    SELECT 1 FROM praticiens WHERE slug = p_slug
  ) INTO exists_in_praticiens;

  -- Vérifie dans soumissions pending (payload->>'username')
  SELECT EXISTS (
    SELECT 1 FROM soumissions
    WHERE type = 'praticien'
      AND status = 'pending'
      AND payload->>'username' = p_slug
  ) INTO exists_in_soumissions;

  RETURN NOT (exists_in_praticiens OR exists_in_soumissions);
END;
$$;

-- Accès public à cette fonction
GRANT EXECUTE ON FUNCTION is_slug_available(text) TO anon, authenticated;
