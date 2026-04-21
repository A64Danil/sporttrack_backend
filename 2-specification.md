🔐 1. IDENTITY LAYER
UserAccount
id (PK)
created_at
👉 единый root-объект пользователя

AuthIdentity
id (PK)
user_id (FK → UserAccount)

provider (email | google | apple | etc)
provider_user_id
email

created_at
📌 принцип:
1 user → N способов входа
account ≠ profile

👤 2. PROFILE LAYER (SOCIAL CORE)
UserProfile
id (PK, FK → UserAccount)

display_name
avatar_url
bio

birth_date
height
weight

language
theme

privacy_level (private | friends | public)
stats_visibility (private | friends | public)

created_at
📌 смысл:
это “человек в системе”
не зависит от auth
является узлом social graph

🧠 3. FITNESS CORE DOMAIN

ExerciseCategory
id (PK)
name
parent_id (nullable)

ExerciseType
id (PK)
name
category_id (FK → ExerciseCategory)

primary_metric (reps | time | distance | weight)
equipment_type (bodyweight | barbell | dumbbell | machine | mixed)

description
main_media_url

created_by_user_id (nullable)
is_system
📌 важно:
это “каноническое упражнение”
НЕ содержит пользовательских вариаций

ExerciseTypeMuscleGroup
exercise_type_id (FK)
muscle_group_id (FK)

PRIMARY KEY (exercise_type_id, muscle_group_id)

MuscleGroup
id (PK)
name

🏋️ 4. WORKOUT DOMAIN (DRAFT SYSTEM)
Workout
id (PK)
user_id (FK → UserAccount)

status (draft | completed | archived)

started_at
finished_at

source_type (template | manual | clone)
source_id (nullable)
📌 ключ:
Workout = редактируемый контейнер
НЕ источник аналитики

WorkoutItem
id (PK)
workout_id (FK → Workout)
exercise_type_id (FK → ExerciseType)

order_index

planned_value (nullable)
planned_secondary_values (json, nullable)
📌 важно:
существует только в контексте draft workout

📝 5. EXERCISE LOG (SOURCE OF TRUTH)
ExerciseLog
id (PK)
user_id (FK → UserAccount)

exercise_type_id (FK → ExerciseType)
workout_id (FK → Workout, nullable)

performed_at

value (numeric or duration depending on type)
secondary_values (json, nullable)

created_at
📌 КРИТИЧНО:
это единственный источник истины для прогресса
immutable (никогда не редактируется, только append/correct via new log)

📋 6. WORKOUT TEMPLATE SYSTEM
WorkoutTemplate
id (PK)
user_id (nullable)

name
created_at

WorkoutTemplateItem
id (PK)
template_id (FK → WorkoutTemplate)
exercise_type_id (FK → ExerciseType)

default_value (nullable)
order_index

📆 7. ACTIVITY & STREAK SYSTEM
UserActivity
user_id (FK → UserAccount)
date

has_activity (bool)
📌 принцип:
это “день как факт”
не содержит бизнес-логики streak

Bonus
id (PK)
user_id (FK)

type (streak_skip_day)

state (active | used | expired)

created_at
used_at

StreakState (CACHE ONLY)
user_id (PK)

current_streak
best_streak

last_active_date
streak_dirty (bool)
streak_cached_at
📌 важно:
НЕ источник истины
только кеш вычислений

📊 8. BIOMETRICS
BiometricLog
id (PK)
user_id (FK)

type (weight | body_fat | muscle_size | etc)
value

created_at

🔐 9. PRIVACY SYSTEM (FIRST-CLASS)
VisibilityRule
id (PK)
user_id (FK)

object_type (exercise_log | workout | post | biometric)
object_id

visibility (private | friends | public)
📌 ключевая идея:
универсальная система доступа
не встроена в сущности

👥 10. SOCIAL LAYER
SocialConnection
id (PK)

from_user_id (FK → UserProfile)
to_user_id (FK → UserProfile)

type (follow | friend)
status (pending | accepted | blocked)

created_at

Post
id (PK)
user_id (FK → UserProfile)

type (text | image | workout_share)

content_text
media_url

created_at

PostReaction
id (PK)
post_id (FK)
user_id (FK)

type (like | clap)

created_at

PostComment
id (PK)
post_id (FK)
user_id (FK)

text
created_at

WorkoutShare
post_id (FK → Post)
workout_id (FK → Workout)

💬 11. MESSAGING (ISOLATED DOMAIN)
Conversation
id (PK)
type (direct | group)

created_at

ConversationParticipant
conversation_id
user_id

Message
id (PK)
conversation_id
sender_id

type (text | image | system)
content

created_at
read_at

🧠 12. КЛЮЧЕВЫЕ ПРИНЦИПЫ (ФИКСАЦИЯ АРХИТЕКТУРЫ)

1. EVENT-FIRST CORE
   ExerciseLog = единственный источник прогресса
   всё остальное — projection

2. DRAFT → FINAL PIPELINE
   Workout (draft)
   ↓
   ExerciseLog (final immutable events)

3. DOMAIN ISOLATION
   Identity
   Profile
   Fitness Core
   Social
   Messaging
   Privacy
   👉 не пересекаются напрямую

4. NO BUSINESS LOGIC IN CORE TABLES
   streak = derived
   analytics = derived
   leaderboard = derived

5. RELATIONAL-FIRST DESIGN
   JSON только там, где структура реально динамическая
   всё критичное — нормализовано

