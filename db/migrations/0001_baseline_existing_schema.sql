-- Baseline migration for the current schema initialized by docker_db/init scripts.
-- This is intentionally a no-op so the migration history can start from the
-- already-existing database structure without dropping any data.
SELECT 1;
