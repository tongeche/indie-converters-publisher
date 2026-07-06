-- Freelancers can offer more than one service (e.g. both Formatting and Cover Design)
ALTER TABLE freelancers ADD COLUMN IF NOT EXISTS service_types text[] NOT NULL DEFAULT '{}';

UPDATE freelancers
SET service_types = ARRAY[service_type]
WHERE service_type IS NOT NULL AND service_types = '{}';

ALTER TABLE freelancers DROP COLUMN IF EXISTS service_type;
