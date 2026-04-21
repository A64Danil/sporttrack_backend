# 📄 SDD — SportTrack Backend v1

---

# 1. 🧠 IDEA (Product Intent)

## 1.1 Purpose
SportTrack — backend система для фиксации, хранения и анализа физических упражнений пользователя.

Основная цель:
- фиксировать реальные действия пользователя (ExerciseLog)
- строить аналитику на основе этих данных (streak, прогресс)
- поддерживать расширяемую структуру упражнений и тренировок

---

## 1.2 Core Value
- пользователь логирует упражнения
- система хранит “истину” (ExerciseLog)
- аналитика строится поверх логов (not source of truth)
- поддержка кастомных упражнений

---

## 1.3 Key Principles
- Event-like model (ExerciseLog = основной источник данных)
- Modular monolith architecture
- SQL-first аналитика
- Cached read models (streak)
- Strict separation layers (Controller → Service → Repository)

---

# 2. 🎯 SPECIFICATION (System Requirements)

## 2.1 MVP Scope

### Included:
- Exercise logging
- Exercise types (system + user-defined)
- Workout creation and execution
- Streak analytics
- Basic stats

### Excluded (future):
- Social features (posts, sharing, comparison)
- Realtime updates
- AI recommendations
- Microservices architecture

---

## 2.2 Data Ownership Rules

- ExerciseLog → source of truth
- Workout → structure / grouping
- Analytics → derived state
- Streak → cached derived state

---

## 2.3 Mutation Rules

- ExerciseLog:
    - UPDATE allowed
    - DELETE discouraged (soft delete recommended)

- Workout:
    - immutable after completion

- ExerciseType:
    - system + user custom

---

# 3. 🏗 ARCHITECTURE DESIGN

## 3.1 System Type
- Modular Monolith (NestJS)
- Layered architecture

---

## 3.2 Layers


Controller → Service → Repository → DB


---

## 3.3 Modules

- AuthModule
- UserModule
- ExerciseModule
- WorkoutModule
- AnalyticsModule

---

## 3.4 Dependency Rules

- Only downward dependencies
- No cross-module direct DB access
- Analytics depends on Exercise (not reverse)

---

## 3.5 Data Flow Model

Write model:
- ExerciseLog = write source

Read model:
- Analytics (streak, stats)
- cached tables

---

# 4. 🗃 DATABASE MODEL (HIGH LEVEL)

## Core Entities

### ExerciseCategory
- hierarchical structure

### ExerciseType
- system + user-defined
- primary_metric, equipment_type

### ExerciseLog
- main event entity
- user activity record

### ExerciseLogMetric
- flexible key/value metric system

---

## Workout Domain

### Workout
- container of execution

### WorkoutBlock
- grouping (optional)

### WorkoutItem
- link to ExerciseType + logs

---

## User Domain

- User
- UserProfile
- AuthIdentity
- Session
- MFA
- AuditLog

---

## Analytics

- streak cache (conceptual)
- derived metrics

---

# 5. 🔌 API SPECIFICATION

## 5.1 Exercise

### Create log

POST /exercise/log


Request:
```json
{
  "exerciseTypeId": "uuid",
  "metrics": {
    "reps": 12,
    "weight_kg": 80
  },
  "performedAt": "optional"
}
```

Response:
```
{
  "id": "uuid",
  "status": "created"
}
```
Get logs
GET /exercise/logs?from=&to=&exerciseTypeId=

## 5.2 ExerciseType
GET /exercise/types
POST /exercise/types
## 5.3 Workout
POST /workout
GET /workout/:id
## 5.4 Analytics
GET /analytics/streak
GET /analytics/summary
POST /analytics/recalculate

# 6. 🔄 DATA FLOWS

## 6.1 Create ExerciseLog
Controller
 → Service validation
 → Repository insert
 → Analytics update (sync)
## 6.2 Update ExerciseLog
Repository update
 → mark analytics dirty (optional)
## 6.3 Streak Calculation

Strategy:

cache-first
SQL fallback if dirty
## 6.4 Workout Execution
Workout created
 → items added
 → logs generated via ExerciseLog
 → workout = immutable record
# 7. ⚙️ IMPLEMENTATION PLAN

## Phase 1 — Core foundation
NestJS project setup
Postgres Docker integration
Base modules
Prisma/SQL layer
## Phase 2 — Exercise system
ExerciseType
ExerciseLog
Metrics system
## Phase 3 — Workout system
Workout creation
WorkoutItems
Blocks
## Phase 4 — Analytics
streak calculation
cache table
recompute logic
## Phase 5 — Auth system
JWT auth
refresh tokens
user profile

# 8. 🧩 TASK DECOMPOSITION
## Core backend
 setup NestJS structure
 setup Postgres connection
 create migration system
## Exercise module
 ExerciseType CRUD
 ExerciseLog creation endpoint
 metrics storage
 validation layer
## Workout module
 Workout create
 WorkoutItem linking
 completion flow
## Analytics module
 streak calculation SQL
 cache table design
 recalculation logic
## Auth module
 JWT auth
 session management
 MFA support (future-ready)
# 9. 💻 CODE STRUCTURE (NESTJS)
src/
  modules/
    exercise/
      controller/
      service/
      repository/
      dto/

    workout/
    analytics/
    auth/
    user/

  shared/
    db/
    errors/
    logging/
    utils/
Layer rules
Controller → HTTP only
Service → business logic
Repository → DB access only
Shared → cross-module utilities

# 10. 🧪 TESTING & VALIDATION
## 10.1 Unit tests
Service layer logic
streak calculation
## 10.2 Integration tests
API endpoints
DB interaction
## 10.3 Edge cases
ExerciseLog update impact on streak
cache invalidation
invalid metrics

# 11. 🚀 DEPLOYMENT
Environment
Docker Compose
Postgres container
NestJS app container (future)
Migration strategy
SQL-based migration files
versioned schema updates
Seed strategy
initial ExerciseTypes
test users
demo logs
# 12. 🔮 FUTURE EXTENSIONS
Social layer (posts, sharing, comparison)
Event queue (BullMQ)
Async analytics processing
Microservices split (Analytics separation)
AI recommendations

# 📌 FINAL SUMMARY

System characteristics:

Modular monolith backend
Event-like data model (ExerciseLog)
SQL-first analytics
Cached derived state (streak)
Hybrid ORM + raw SQL approach
Strict layered architecture
Future-ready for async + scaling