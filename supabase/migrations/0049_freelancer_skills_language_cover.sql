ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}';
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';
