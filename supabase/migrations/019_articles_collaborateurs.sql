-- Feature 4: collaborateurs sur un article
ALTER TABLE articles ADD COLUMN IF NOT EXISTS collaborateurs text[] DEFAULT '{}';
