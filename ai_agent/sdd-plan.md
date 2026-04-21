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

---

# 🧱 Phase 1 — Core foundation (System bootstrap)

## 1.1 Goals
Создать базовую инфраструктуру backend системы:
- NestJS application skeleton
- PostgreSQL connection via Docker
- базовая архитектура модулей
- базовый DB access layer (ORM + raw SQL hybrid)

---

## 1.2 Scope (what is included)

- NestJS project initialization
- Docker PostgreSQL setup
- DB schema initialization (init scripts)
- Prisma or pg client setup (hybrid approach)
- Base module structure (empty modules)
- Logging foundation (request + error logs)
- Error system (DomainError base)
- Env configuration system

---

## 1.3 Detailed Tasks

### Project setup
- [ ] Initialize NestJS project
- [ ] Configure folder structure:
```
  src/
  modules/
  shared/
``` 

- [ ] Setup environment variables (.env)
- [ ] Setup config module (DB, JWT, etc.)

---

### Database (Docker + Postgres)
- [ ] Configure docker-compose for Postgres
- [ ] Create persistent volume (pgdata)
- [ ] Add init SQL scripts:
- schema initialization
- seed data (basic ExerciseTypes)
- [ ] Ensure DB persistence across restarts

---

### DB access layer (Hybrid model)
- [ ] Setup ORM layer (Prisma OR pg client abstraction)
- [ ] Define Repository pattern:
- CRUD via ORM
- analytics via raw SQL
- [ ] Create base Repository class

---

### Core infrastructure
- [ ] Implement DomainError system
- [ ] Setup global exception filter (NestJS)
- [ ] Setup logging:
- request logging middleware
- SQL logging (dev mode)

---

---

# 🏋️ Phase 2 — Exercise System (CORE DOMAIN)

## 2.1 Goals
Создать основную систему логирования упражнений:
- ExerciseType catalog
- ExerciseLog system (source of truth)
- flexible metrics system

---

## 2.2 Scope

- ExerciseCategory hierarchy
- ExerciseType (system + user custom)
- ExerciseLog (mutable event-like entity)
- ExerciseLogMetric (key/value flexible model)
- validation layer for logs

---

## 2.3 Detailed Tasks

### ExerciseCategory
- [ ] Create entity model
- [ ] Support hierarchical categories (parent_id)
- [ ] Seed base categories (Push, Pull, Legs, Cardio)

---

### ExerciseType
- [ ] Create ExerciseType entity
- [ ] Fields:
- name
- primary_metric
- equipment_type
- system/user flag
- [ ] Implement CRUD endpoints
- [ ] Separate system vs user types logic

---

### ExerciseLog (core system)
- [ ] Create ExerciseLog entity
- [ ] Implement POST /exercise/log
- [ ] Extract userId from JWT context
- [ ] Store performedAt timestamp
- [ ] Support UPDATE operation

---

### ExerciseLogMetric system
- [ ] Implement key/value storage
- [ ] Validate metric structure in service layer
- [ ] Support flexible metrics:
- reps
- weight_kg
- duration_sec
- distance_m

---

### Validation rules
- [ ] DTO validation (format)
- [ ] Service validation (business rules)
- [ ] Reject invalid metrics keys

---

---

# 🏃 Phase 3 — Workout System (STRUCTURED EXECUTION LAYER)

## 3.1 Goals
Добавить структуру тренировок поверх ExerciseLog.

---

## 3.2 Scope

- Workout creation
- Workout items
- Workout blocks (optional grouping)
- Completion flow (Workout → ExerciseLogs)

---

## 3.3 Detailed Tasks

### Workout entity
- [ ] Create Workout model
- [ ] Fields:
- name
- started_at
- finished_at
- [ ] POST /workout (create empty workout)

---

### WorkoutItems
- [ ] Create WorkoutItem entity
- [ ] Link to ExerciseType
- [ ] Add ordering support (order_index)
- [ ] Optional link to ExerciseLog

---

### WorkoutBlocks (optional grouping)
- [ ] Implement block structure
- [ ] Support grouping exercises (supersets / rounds)

---

### Workout execution flow
- [ ] Create workout
- [ ] Add items
- [ ] On completion:
- generate ExerciseLog entries
- mark workout as completed
- [ ] Workout becomes immutable after completion

---

---

# 📊 Phase 4 — Analytics System (STREAK + READ MODELS)

## 4.1 Goals
Построить систему аналитики на основе ExerciseLog:
- streak calculation
- cached read models
- SQL fallback logic

---

## 4.2 Scope

- streak calculation
- cache table (derived state)
- recomputation logic
- analytics endpoints

---

## 4.3 Detailed Tasks

### Streak system (core)
- [ ] Define streak logic (daily consecutive logs)
- [ ] Implement SQL-based streak calculation
- [ ] Create GET /analytics/streak endpoint

---

### Cache layer
- [ ] Create streak cache table (UserStreakCache)
- [ ] Store:
- current streak
- last update date
- [ ] Update cache on new ExerciseLog

---

### Recalculation logic
- [ ] Mark cache as “dirty” on UPDATE ExerciseLog
- [ ] Implement full SQL recalculation fallback
- [ ] Add POST /analytics/recalculate endpoint

---

### Analytics endpoints
- [ ] GET /analytics/streak
- [ ] GET /analytics/summary (future-ready)

---

---

# 🔐 Phase 5 — Auth System (SECURITY LAYER)

## 5.1 Goals
Обеспечить безопасный доступ к системе.

---

## 5.2 Scope

- JWT authentication
- refresh tokens
- user profile
- session tracking (lightweight)

---

## 5.3 Detailed Tasks

### JWT system
- [ ] Implement JWT access token
- [ ] Implement refresh token flow
- [ ] Create Auth guards (NestJS)

---

### User system
- [ ] User entity
- [ ] UserProfile entity
- [ ] Link profile to user

---

### Auth endpoints
- [ ] POST /auth/login
- [ ] POST /auth/refresh
- [ ] POST /auth/logout

---

### Security rules
- [ ] Extract userId from JWT only
- [ ] No userId from client input
- [ ] Add request context injection

---

---

# 8. 🧩 TASK DECOMPOSITION (LOW-LEVEL EXECUTION PLAN)

---

# 🧱 Core Backend Setup

- [ ] Create NestJS project structure
- [ ] Setup modular architecture (modules folder)
- [ ] Setup config system (.env)
- [ ] Setup PostgreSQL connection
- [ ] Setup Docker environment
- [ ] Setup logging middleware
- [ ] Setup global exception filter (DomainError)

---

# 🗄 Database Layer

- [ ] Setup ORM (Prisma or pg abstraction)
- [ ] Implement Repository pattern
- [ ] Create base repository class
- [ ] Implement raw SQL executor for analytics
- [ ] Setup migrations system (SQL-based)

---

# 🏋️ Exercise Module

- [ ] Create ExerciseCategory module
- [ ] Create ExerciseType module
- [ ] Implement CRUD endpoints for ExerciseType
- [ ] Create ExerciseLog entity
- [ ] Implement POST /exercise/log
- [ ] Implement GET /exercise/logs
- [ ] Implement ExerciseLogMetric system
- [ ] Add DTO validation
- [ ] Add service-level validation rules

---

# 🏃 Workout Module

- [ ] Create Workout entity
- [ ] Implement POST /workout
- [ ] Implement GET /workout/:id
- [ ] Create WorkoutItem entity
- [ ] Implement linking ExerciseType → WorkoutItem
- [ ] Implement workout completion flow
- [ ] Generate ExerciseLog from Workout completion

---

# 📊 Analytics Module

- [ ] Implement streak SQL calculation
- [ ] Create streak cache table
- [ ] Implement cache update on ExerciseLog insert
- [ ] Implement cache invalidation on update
- [ ] Implement recalculation endpoint
- [ ] Implement GET /analytics/streak
- [ ] Implement GET /analytics/summary

---

# 🔐 Auth Module

- [ ] Implement JWT authentication
- [ ] Implement refresh token system
- [ ] Create auth guards
- [ ] Implement login/logout endpoints
- [ ] Setup request user context injection

---

# 🧠 Shared Infrastructure

- [ ] DomainError system
- [ ] Logging system (request + SQL)
- [ ] Validation layer (DTO + service)
- [ ] Utility helpers (date, metrics, etc.)

---

# 📌 FINAL NOTE

This plan defines:

- full backend architecture
- execution phases
- granular task breakdown
- data flow model
- analytics strategy
- authentication model
- database interaction strategy



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