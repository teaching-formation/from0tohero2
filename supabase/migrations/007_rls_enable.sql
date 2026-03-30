ALTER TABLE praticiens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE realisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read praticiens"   ON praticiens;
CREATE POLICY "public read praticiens"   ON praticiens   FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "public read articles"     ON articles;
CREATE POLICY "public read articles"     ON articles     FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "public read realisations" ON realisations;
CREATE POLICY "public read realisations" ON realisations FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "public read evenements"   ON evenements;
CREATE POLICY "public read evenements"   ON evenements   FOR SELECT USING (status = 'approved');
