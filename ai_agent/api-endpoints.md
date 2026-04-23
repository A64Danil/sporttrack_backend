# Implemented API Endpoints

This file lists the endpoints that are currently implemented in the backend.

## App

- `GET /`

## Auth

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user (returns access_token, refresh_token)
- `POST /auth/refresh` - Refresh access token using refresh_token
- `POST /auth/logout` - Logout (revoke session)
- `POST /auth/me` - Get current user profile (requires JWT)

## Exercise

- `POST /exercise/log` - Create exercise log
- `GET /exercise/logs` - Get user's exercise logs
- `GET /exercise/log/:id` - Get single exercise log
- `PATCH /exercise/log/:id` - Update exercise log

- `POST /exercise/types` - Create custom exercise type
- `GET /exercise/types` - Get all exercise types
- `GET /exercise/types/system` - Get system exercise types
- `GET /exercise/types/user` - Get user's custom exercise types
- `GET /exercise/types/:id` - Get single exercise type
- `PATCH /exercise/types/:id` - Update exercise type
- `DELETE /exercise/types/:id` - Delete exercise type

- `GET /exercise/categories` - Get all categories
- `GET /exercise/categories/:id` - Get single category
- `POST /exercise/categories` - Create category
- `PATCH /exercise/categories/:id` - Update category
- `DELETE /exercise/categories/:id` - Delete category
- `GET /exercise/categories/:categoryId/types` - Get types by category

## Workout

- `POST /workout` - Create workout
- `GET /workout/:id` - Get workout details
- `POST /workout/:id/blocks` - Add workout block
- `POST /workout/:id/items` - Add workout item
- `POST /workout/:id/complete` - Complete workout

## Analytics

- `GET /analytics/streak` - Get current streak
- `GET /analytics/summary` - Get analytics summary
- `POST /analytics/recalculate` - Recalculate analytics

## Planned but not yet implemented

- `GET /users` - Get users list (for admin/social features)
