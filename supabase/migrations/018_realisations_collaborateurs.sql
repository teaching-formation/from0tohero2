-- Feature 4: collaborateurs sur une réalisation
ALTER TABLE realisations ADD COLUMN IF NOT EXISTS collaborateurs text[] DEFAULT '{}';
