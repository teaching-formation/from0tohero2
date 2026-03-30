-- MIGRATION 009 — evenements: lien praticien_id
ALTER TABLE evenements
  ADD COLUMN IF NOT EXISTS praticien_id uuid references praticiens(id) on delete set null;

CREATE INDEX IF NOT EXISTS evenements_praticien_id_idx ON evenements(praticien_id);

-- RLS : un praticien peut modifier ses événements
DROP POLICY IF EXISTS "user update own evenement" ON evenements;
CREATE POLICY "user update own evenement"
  ON evenements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM praticiens
      WHERE praticiens.id = evenements.praticien_id
      AND praticiens.user_id = auth.uid()
    )
  );
