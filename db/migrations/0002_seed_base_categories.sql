INSERT INTO "ExerciseCategory" (id, name, created_at)
SELECT '22222222-2222-2222-2222-222222222222', 'Push', now()
WHERE NOT EXISTS (
  SELECT 1 FROM "ExerciseCategory" WHERE name = 'Push'
);

INSERT INTO "ExerciseCategory" (id, name, created_at)
SELECT '22222222-2222-2222-2222-222222222223', 'Pull', now()
WHERE NOT EXISTS (
  SELECT 1 FROM "ExerciseCategory" WHERE name = 'Pull'
);

INSERT INTO "ExerciseCategory" (id, name, created_at)
SELECT '22222222-2222-2222-2222-222222222224', 'Legs', now()
WHERE NOT EXISTS (
  SELECT 1 FROM "ExerciseCategory" WHERE name = 'Legs'
);

INSERT INTO "ExerciseCategory" (id, name, created_at)
SELECT '22222222-2222-2222-2222-222222222225', 'Cardio', now()
WHERE NOT EXISTS (
  SELECT 1 FROM "ExerciseCategory" WHERE name = 'Cardio'
);
