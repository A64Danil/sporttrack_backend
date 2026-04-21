-- EXTENSIONS
CREATE
EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS

CREATE TABLE "User"
(
    id         uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "UserProfile"
(
    id           uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    user_id      uuid UNIQUE REFERENCES "User" (id) ON DELETE CASCADE,

    display_name varchar     NOT NULL,
    age          int,
    weight       float,
    height       float,

    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "UserAuthIdentity"
(
    id               uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    user_id          uuid REFERENCES "User" (id) ON DELETE CASCADE,

    provider         varchar     NOT NULL,
    provider_user_id varchar     NOT NULL,

    email            varchar,
    password_hash    varchar,

    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),

    UNIQUE (provider),
    UNIQUE (provider_user_id)
);

CREATE TABLE "UserSession"
(
    id                 uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    user_id            uuid REFERENCES "User" (id) ON DELETE CASCADE,

    refresh_token_hash varchar     NOT NULL,

    user_agent         text,
    ip_address         varchar,

    created_at         timestamptz NOT NULL DEFAULT now(),
    last_used_at       timestamptz,

    expires_at         timestamptz NOT NULL,
    revoked_at         timestamptz
);

CREATE TABLE "AuditLog"
(
    id         uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    user_id    uuid REFERENCES "User" (id),

    action     varchar     NOT NULL,
    metadata   jsonb,

    ip_address varchar,
    user_agent text,

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "MFAFactor"
(
    id         uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    user_id    uuid REFERENCES "User" (id) ON DELETE CASCADE,

    type       varchar     NOT NULL,
    secret     varchar,
    enabled    boolean     NOT NULL DEFAULT false,

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "MFARecoveryCode"
(
    id         uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    user_id    uuid REFERENCES "User" (id) ON DELETE CASCADE,

    code_hash  varchar     NOT NULL,
    used_at    timestamptz,

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "AuthVerification"
(
    id         uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    user_id    uuid REFERENCES "User" (id) ON DELETE CASCADE,

    type       varchar     NOT NULL,
    token_hash varchar     NOT NULL,

    expires_at timestamptz NOT NULL,
    used_at    timestamptz,

    created_at timestamptz NOT NULL DEFAULT now()
);

-- EXERCISES

CREATE TABLE "ExerciseCategory"
(
    id         uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    name       varchar     NOT NULL,
    parent_id  uuid REFERENCES "ExerciseCategory" (id),

    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "ExerciseType"
(
    id                 uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    category_id        uuid REFERENCES "ExerciseCategory" (id),

    name               varchar     NOT NULL,
    primary_metric     varchar     NOT NULL,
    equipment_type     varchar     NOT NULL,

    description        text,
    main_media_url     varchar,

    created_by_user_id uuid,
    is_system          boolean     NOT NULL DEFAULT false,

    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "ExerciseLog"
(
    id               uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    user_id          uuid REFERENCES "User" (id) ON DELETE CASCADE,
    exercise_type_id uuid REFERENCES "ExerciseType" (id),

    performed_at     timestamptz NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "ExerciseLogMetric"
(
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_log_id uuid REFERENCES "ExerciseLog" (id) ON DELETE CASCADE,

    key             varchar NOT NULL,
    value           decimal NOT NULL,
    unit            varchar
);

-- WORKOUTS

CREATE TABLE "WorkoutTemplate"
(
    id          uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    user_id     uuid REFERENCES "User" (id) ON DELETE CASCADE,

    name        varchar     NOT NULL,
    description text,

    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "WorkoutTemplateItem"
(
    id                  uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    workout_template_id uuid REFERENCES "WorkoutTemplate" (id) ON DELETE CASCADE,

    exercise_type_id    uuid,
    order_index         int         NOT NULL,
    target_value        float,

    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Workout"
(
    id          uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    user_id     uuid REFERENCES "User" (id) ON DELETE CASCADE,

    name        varchar     NOT NULL,

    started_at  timestamptz NOT NULL,
    finished_at timestamptz,

    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "WorkoutBlock"
(
    id          uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),
    workout_id  uuid REFERENCES "Workout" (id) ON DELETE CASCADE,

    name        varchar,
    order_index int         NOT NULL,

    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "WorkoutItem"
(
    id               uuid PRIMARY KEY     DEFAULT uuid_generate_v4(),

    workout_id       uuid REFERENCES "Workout" (id) ON DELETE CASCADE,
    workout_block_id uuid REFERENCES "WorkoutBlock" (id),

    exercise_type_id uuid,

    order_index      int         NOT NULL,

    exercise_log_id  uuid REFERENCES "ExerciseLog" (id),

    created_at       timestamptz NOT NULL DEFAULT now()
);

-- INDEXES (ключевые под твою аналитику)

CREATE INDEX idx_exercise_log_user_date
    ON "ExerciseLog" (user_id, performed_at DESC);

CREATE INDEX idx_exercise_log_type
    ON "ExerciseLog" (exercise_type_id);

CREATE INDEX idx_metric_log
    ON "ExerciseLogMetric" (exercise_log_id);

CREATE INDEX idx_metric_key
    ON "ExerciseLogMetric" (key);

CREATE INDEX idx_workout_user
    ON "Workout" (user_id);

CREATE INDEX idx_workout_item_workout
    ON "WorkoutItem" (workout_id);

CREATE INDEX idx_workout_block_workout
    ON "WorkoutBlock" (workout_id);