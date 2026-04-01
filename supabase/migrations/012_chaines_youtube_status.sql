-- Ajout colonne status sur chaines_youtube (aligné avec articles/realisations)
alter table chaines_youtube
  add column if not exists status text not null default 'pending';

-- Migrer les données existantes
update chaines_youtube set status = 'approved' where active = true;
update chaines_youtube set status = 'rejected' where active = false;
