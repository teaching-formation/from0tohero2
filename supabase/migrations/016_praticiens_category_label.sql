-- Ajoute category_label pour préciser quand category = 'autre'
ALTER TABLE praticiens ADD COLUMN IF NOT EXISTS category_label text DEFAULT null;
