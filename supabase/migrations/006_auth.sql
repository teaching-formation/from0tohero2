-- ─────────────────────────────────────────
-- MIGRATION 006 — Supabase Auth integration
-- ─────────────────────────────────────────

-- 1. Colonne user_id sur praticiens (lien avec auth.users)
ALTER TABLE praticiens
  ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete set null;

-- 2. Colonne email sur praticiens (pour retrouver un profil existant à la connexion)
ALTER TABLE praticiens
  ADD COLUMN IF NOT EXISTS email text;

-- 3. Index pour les lookups fréquents
CREATE INDEX IF NOT EXISTS praticiens_user_id_idx ON praticiens(user_id);
CREATE INDEX IF NOT EXISTS praticiens_email_idx   ON praticiens(email);

-- ─────────────────────────────────────────
-- RLS — Policies pour les utilisateurs authentifiés
-- ─────────────────────────────────────────

-- Praticien peut lire son propre profil (même si non approuvé)
CREATE POLICY "user read own praticien"
  ON praticiens FOR SELECT
  USING (auth.uid() = user_id);

-- Praticien peut modifier son propre profil
CREATE POLICY "user update own praticien"
  ON praticiens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Praticien peut ajouter un article (lié à son profil)
CREATE POLICY "user insert own article"
  ON articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM praticiens
      WHERE praticiens.id = articles.praticien_id
      AND praticiens.user_id = auth.uid()
    )
  );

-- Praticien peut modifier ses articles
CREATE POLICY "user update own article"
  ON articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM praticiens
      WHERE praticiens.id = articles.praticien_id
      AND praticiens.user_id = auth.uid()
    )
  );

-- Praticien peut ajouter une réalisation
CREATE POLICY "user insert own realisation"
  ON realisations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM praticiens
      WHERE praticiens.id = realisations.praticien_id
      AND praticiens.user_id = auth.uid()
    )
  );

-- Praticien peut modifier ses réalisations
CREATE POLICY "user update own realisation"
  ON realisations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM praticiens
      WHERE praticiens.id = realisations.praticien_id
      AND praticiens.user_id = auth.uid()
    )
  );
