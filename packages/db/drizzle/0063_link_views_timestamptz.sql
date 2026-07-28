-- link_views.created_at was a naive `timestamp`, which the pg driver
-- reinterprets using the reading process's local timezone instead of UTC.
-- The existing values were written as correct UTC wall-clock times (session
-- tz is UTC), so reinterpreting them explicitly as UTC before widening to
-- timestamptz preserves the true instant.
ALTER TABLE "link_views"
  ALTER COLUMN "created_at" TYPE timestamp(3) with time zone
  USING "created_at" AT TIME ZONE 'UTC';
