# Implemented API Endpoints

This file lists the endpoints that are currently implemented in the backend.

## App

- `GET /`

## Exercise

- `POST /exercise/log`
- `GET /exercise/logs`
- `GET /exercise/log/:id`
- `PATCH /exercise/log/:id`

- `POST /exercise/types`
- `GET /exercise/types`
- `GET /exercise/types/system`
- `GET /exercise/types/user`
- `GET /exercise/types/:id`
- `PATCH /exercise/types/:id`
- `DELETE /exercise/types/:id`

- `GET /exercise/categories`
- `GET /exercise/categories/:id`
- `POST /exercise/categories`
- `PATCH /exercise/categories/:id`
- `DELETE /exercise/categories/:id`
- `GET /exercise/categories/:categoryId/types`

## Workout

- `POST /workout`
- `GET /workout/:id`
- `POST /workout/:id/blocks`
- `POST /workout/:id/items`
- `POST /workout/:id/complete`

## Planned but not yet implemented

- `GET /users`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /analytics/streak`
- `GET /analytics/summary`
- `POST /analytics/recalculate`
