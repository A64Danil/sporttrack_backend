INSERT INTO "User" (id, created_at)
VALUES ('11111111-1111-1111-1111-111111111111', now());

INSERT INTO "ExerciseCategory" (id, name, created_at)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'Push', now()),
    ('22222222-2222-2222-2222-222222222223', 'Pull', now()),
    ('22222222-2222-2222-2222-222222222224', 'Legs', now()),
    ('22222222-2222-2222-2222-222222222225', 'Cardio', now());

INSERT INTO "ExerciseType" (id, category_id, name, primary_metric, equipment_type, is_system, created_at)
VALUES
    ('33333333-3333-3333-3333-333333333333',
     '22222222-2222-2222-2222-222222222222',
     'Push-ups',
     'reps',
     'bodyweight',
     true,
     now());

INSERT INTO "ExerciseLog" (id, user_id, exercise_type_id, performed_at, created_at)
VALUES
    ('44444444-4444-4444-4444-444444444444',
     '11111111-1111-1111-1111-111111111111',
     '33333333-3333-3333-3333-333333333333',
     now(),
     now());

INSERT INTO "ExerciseLogMetric" (exercise_log_id, key, value)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'reps', 15);
