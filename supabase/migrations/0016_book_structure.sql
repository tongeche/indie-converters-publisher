-- ════════════════════════════════════════
-- 0016 · Book front/back matter + draft support
-- ════════════════════════════════════════

ALTER TABLE books ADD COLUMN IF NOT EXISTS front_matter jsonb;
ALTER TABLE books ADD COLUMN IF NOT EXISTS back_matter  jsonb;
ALTER TABLE books ADD COLUMN IF NOT EXISTS draft_step   smallint;
