-- ─────────────────────────────────────────────────────────────
-- MIGRATION 010 — soumissions: user_id + evenements fixes
-- ─────────────────────────────────────────────────────────────

-- 1. Colonne user_id sur soumissions (lien optionnel avec auth.users)
ALTER TABLE soumissions
  ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete set null;

CREATE INDEX IF NOT EXISTS soumissions_user_id_idx ON soumissions(user_id);

-- 2. RLS : un utilisateur peut lire ses propres soumissions
DROP POLICY IF EXISTS "user read own soumissions" ON soumissions;
CREATE POLICY "user read own soumissions"
  ON soumissions FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Policy INSERT pour evenements (utilisateur authentifié lié à un praticien)
DROP POLICY IF EXISTS "user insert own evenement" ON evenements;
CREATE POLICY "user insert own evenement"
  ON evenements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM praticiens
      WHERE praticiens.id = evenements.praticien_id
      AND praticiens.user_id = auth.uid()
    )
  );

-- 4. Corriger le default de evenements.status : doit être 'pending' comme les autres tables
ALTER TABLE evenements ALTER COLUMN status SET DEFAULT 'pending';
