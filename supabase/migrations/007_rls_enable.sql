-- ─────────────────────────────────────────────────────
-- MIGRATION 007 — Activation RLS + policies lecture publique
-- ─────────────────────────────────────────────────────
-- NOTE: La migration 006 a créé les policies d'écriture
-- mais n'a pas activé RLS. Sans activation, les policies
-- sont inactives et n'importe qui peut modifier les données
-- directement via la clé anon publique.
-- ─────────────────────────────────────────────────────

-- 1. Activation RLS sur toutes les tables de contenu
ALTER TABLE praticiens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE realisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements   ENABLE ROW LEVEL SECURITY;

-- 2. Lecture publique — contenu approuvé accessible à tous
CREATE POLICY IF NOT EXISTS "public read praticiens"
  ON praticiens FOR SELECT USING (status = 'approved');

CREATE POLICY IF NOT EXISTS "public read articles"
  ON articles FOR SELECT USING (status = 'approved');

CREATE POLICY IF NOT EXISTS "public read realisations"
  ON realisations FOR SELECT USING (status = 'approved');

CREATE POLICY IF NOT EXISTS "public read evenements"
  ON evenements FOR SELECT USING (status = 'approved');

-- 3. Un praticien peut lire son PROPRE profil même non approuvé
--    (déjà créé en 006, s'assure qu'il existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'praticiens' AND policyname = 'user read own praticien'
  ) THEN
    CREATE POLICY "user read own praticien"
      ON praticiens FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;

-- NOTE: Toutes les opérations d'écriture (INSERT/UPDATE/DELETE) passent
-- par supabaseAdmin (service role) qui bypasse RLS automatiquement.
-- Les policies INSERT/UPDATE de la migration 006 sont en backup de sécurité.
