-- Ajoute types[] pour supporter plusieurs types par événement
ALTER TABLE evenements ADD COLUMN IF NOT EXISTS types text[] DEFAULT '{}';

-- Backfill : les événements existants gardent leur type dans le tableau
UPDATE evenements SET types = ARRAY[type] WHERE types = '{}' OR types IS NULL;
