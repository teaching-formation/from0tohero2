-- Ajout colonne certifications sur praticiens
alter table praticiens
  add column if not exists certifications text default null;
