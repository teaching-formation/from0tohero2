-- ─────────────────────────────────────────────────────
-- MIGRATION 007 — Activation RLS + policies lecture publique
-- ─────────────────────────────────────────────────────

-- 1. Activation RLS sur toutes les tables de contenu
ALTER TABLE praticiens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE realisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements   ENABLE ROW LEVEL SECURITY;

-- 2. Lecture publique — contenu approuvé accessible à tous
DROP POLICY IF EXISTS "public read praticiens"   ON praticiens;
CREATE POLICY "public read praticiens"
  ON praticiens FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "public read articles"     ON articles;
CREATE POLICY "public read articles"
  ON articles FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "public read realisations" ON realisations;
CREATE POLICY "public read realisations"
  ON realisations FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "public read evenements"   ON evenements;
CREATE POLICY "public read evenements"
  ON evenements FOR SELECT USING (status = 'approved');

-- 3. Un praticien peut lire son PROPRE profil même non approuvé
DROP POLICY IF EXISTS "user read own praticien"  ON praticiens;
CREATE POLICY "user read own praticien"
  ON praticiens FOR SELECT USING (auth.uid() = user_id);
