-- ── RLS DELETE policies — utilisateurs peuvent supprimer leur propre contenu ──

-- Articles : praticien_id doit appartenir à l'utilisateur connecté
CREATE POLICY "praticiens peuvent supprimer leurs articles"
  ON articles FOR DELETE
  TO authenticated
  USING (
    praticien_id IN (
      SELECT id FROM praticiens WHERE user_id = auth.uid()
    )
  );

-- Réalisations : praticien_id doit appartenir à l'utilisateur connecté
CREATE POLICY "praticiens peuvent supprimer leurs realisations"
  ON realisations FOR DELETE
  TO authenticated
  USING (
    praticien_id IN (
      SELECT id FROM praticiens WHERE user_id = auth.uid()
    )
  );

-- Événements : praticien_id doit appartenir à l'utilisateur connecté
CREATE POLICY "praticiens peuvent supprimer leurs evenements"
  ON evenements FOR DELETE
  TO authenticated
  USING (
    praticien_id IN (
      SELECT id FROM praticiens WHERE user_id = auth.uid()
    )
  );
