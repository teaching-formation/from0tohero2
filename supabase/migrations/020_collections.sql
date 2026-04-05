-- Feature 6: collections / ressources
CREATE TABLE IF NOT EXISTS collections (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  praticien_id uuid REFERENCES praticiens(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  items        jsonb DEFAULT '[]'::jsonb,
  ordre        int  DEFAULT 0,
  status       text DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_select" ON collections FOR SELECT USING (status = 'approved');
CREATE POLICY "collections_insert" ON collections FOR INSERT WITH CHECK (
  praticien_id IN (SELECT id FROM praticiens WHERE user_id = auth.uid())
);
CREATE POLICY "collections_update" ON collections FOR UPDATE USING (
  praticien_id IN (SELECT id FROM praticiens WHERE user_id = auth.uid())
);
CREATE POLICY "collections_delete" ON collections FOR DELETE USING (
  praticien_id IN (SELECT id FROM praticiens WHERE user_id = auth.uid())
);
