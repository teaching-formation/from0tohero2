-- ─────────────────────────────────────────
-- MIGRATION 031 — new_content notification type
-- ─────────────────────────────────────────
-- Ajoute le type 'new_content' : notifie les followers
-- quand un praticien publie une réalisation, article, tip ou événement.

-- 1. Étendre le check sur le type
alter table notifications
  drop constraint if exists notifications_type_check;
alter table notifications
  add constraint notifications_type_check
  check (type in ('like', 'comment', 'follow', 'coauteur', 'new_content'));

-- 2. Étendre le check sur content_type pour inclure 'evenement'
alter table notifications
  drop constraint if exists notifications_content_type_check;
alter table notifications
  add constraint notifications_content_type_check
  check (content_type in ('realisation', 'article', 'tip', 'evenement'));
