-- Real counter for how many times a freelancer has been hired through the
-- platform. Starts at 0 for everyone — no fabricated numbers. Incrementing
-- it requires an actual "mark as hired" mechanism, which doesn't exist yet.
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS hire_count integer NOT NULL DEFAULT 0;
