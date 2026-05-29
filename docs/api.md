# API Design

Base URL: `http://localhost:4000`

## Authentication

- `POST /auth/login`: returns JWT and user profile.
- `POST /auth/refresh`: refreshes current JWT.
- `GET /auth/me`: returns authenticated user.

## Meals and Attendance

- `GET /schools/:schoolId/dashboard/today`
- `POST /meals`
- `GET /meals?schoolId=&from=&to=`
- `POST /attendance`
- `POST /meal-distribution`
- `POST /food-wastage`

## Nutrition and AI

- `GET /nutrition-data`
- `POST /ai/analyze-menu`
- `POST /ai/detect-deficiencies`
- `POST /ai/generate-weekly-plan`
- `GET /ai/recommendations?schoolId=`

## Inventory and Analytics

- `GET /inventory?schoolId=`
- `POST /inventory/adjust`
- `GET /analytics/school/:schoolId`
- `GET /analytics/district`
- `GET /reports/:id`
- `POST /reports`

## IoT-Ready APIs

- `POST /iot/weight-reading`
- `POST /iot/ingredient-consumption`
- `GET /iot/devices?schoolId=`

Swagger UI is mounted at `/docs`.
