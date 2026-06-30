-- ════════════════════════════════════════
-- 0019 · Extended author profile fields
-- ════════════════════════════════════════

ALTER TABLE authors ADD COLUMN IF NOT EXISTS currency       text DEFAULT 'USD';
ALTER TABLE authors ADD COLUMN IF NOT EXISTS location       text;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS twitter_url    text;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS instagram_url  text;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS goodreads_url  text;
