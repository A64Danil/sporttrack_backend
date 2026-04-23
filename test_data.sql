-- Create test user
INSERT INTO "User" (id, created_at)
VALUES ('99999999-9999-9999-9999-999999999999', NOW());

-- Create user profile
INSERT INTO "UserProfile" (id, user_id, display_name, age, weight, height, created_at)
VALUES ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'Test Athlete', 28, 75, 180, NOW());

-- Create user auth identity with password (plaintext for testing, use bcrypt in production!)
INSERT INTO "UserAuthIdentity" (id, user_id, provider, provider_user_id, email, password_hash, created_at, updated_at)
VALUES ('77777777-7777-7777-7777-777777777777', '99999999-9999-9999-9999-999999999999', 'local', 'testuser@example.com', 'testuser@example.com', 'password123', NOW(), NOW());

-- Create push-ups type if doesn't exist
INSERT INTO "ExerciseType" (id, category_id, name, primary_metric, equipment_type, is_system, created_at)
SELECT '33333333-3333-3333-3333-333333333334', 
       (SELECT id FROM "ExerciseCategory" WHERE name = 'Push' LIMIT 1),
       'Push-ups',
       'reps',
       'bodyweight',
       true,
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ExerciseType" WHERE name = 'Push-ups');

-- Create pullups type
INSERT INTO "ExerciseType" (id, category_id, name, primary_metric, equipment_type, is_system, created_at)
SELECT '33333333-3333-3333-3333-333333333335',
       (SELECT id FROM "ExerciseCategory" WHERE name = 'Pull' LIMIT 1),
       'Pull-ups',
       'reps',
       'bodyweight',
       true,
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ExerciseType" WHERE name = 'Pull-ups');

-- Create exercise log for test user
INSERT INTO "ExerciseLog" (id, user_id, exercise_type_id, performed_at, created_at)
VALUES ('44444444-4444-4444-4444-444444444445',
        '99999999-9999-9999-9999-999999999999',
        '33333333-3333-3333-3333-333333333334',
        NOW(),
        NOW());

-- Add metrics
INSERT INTO "ExerciseLogMetric" (exercise_log_id, key, value, unit)
VALUES ('44444444-4444-4444-4444-444444444445', 'reps', 20, 'count');

INSERT INTO "ExerciseLogMetric" (exercise_log_id, key, value, unit)
VALUES ('44444444-4444-4444-4444-444444444445', 'difficulty_level', 5, 'scale');
