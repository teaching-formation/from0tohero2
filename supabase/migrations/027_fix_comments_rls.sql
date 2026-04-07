-- ─────────────────────────────────────────
-- MIGRATION 027 — Fix comments RLS policies
-- ─────────────────────────────────────────
-- La policy "user soft delete own comment" bloquait l'édition de contenu
-- car elle imposait with check (status = 'deleted').
-- On la remplace par deux policies distinctes :
--   1. édition du contenu (status reste 'approved')
--   2. soft-delete (status passe à 'deleted')

drop policy if exists "user soft delete own comment" on comments;

-- Autoriser l'édition du contenu d'un commentaire approuvé
create policy "user edit own comment"
  on comments for update
  using (
    status = 'approved'
    and exists (
      select 1 from praticiens
      where praticiens.id = comments.praticien_id
        and praticiens.user_id = auth.uid()
    )
  )
  with check (
    status = 'approved'
    and exists (
      select 1 from praticiens
      where praticiens.id = comments.praticien_id
        and praticiens.user_id = auth.uid()
    )
  );

-- Autoriser le soft-delete (status → 'deleted')
create policy "user soft delete own comment"
  on comments for update
  using (
    exists (
      select 1 from praticiens
      where praticiens.id = comments.praticien_id
        and praticiens.user_id = auth.uid()
    )
  )
  with check (
    status = 'deleted'
    and exists (
      select 1 from praticiens
      where praticiens.id = comments.praticien_id
        and praticiens.user_id = auth.uid()
    )
  );
