CREATE TABLE IF NOT EXISTS "UserStreakCache"
(
    user_id            uuid PRIMARY KEY REFERENCES "User" (id) ON DELETE CASCADE,
    current_streak     int         NOT NULL DEFAULT 0,
    last_activity_date date,
    is_dirty           boolean     NOT NULL DEFAULT false,
    last_calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_streak_cache_dirty
    ON "UserStreakCache" (is_dirty);

