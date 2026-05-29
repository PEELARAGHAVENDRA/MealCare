# Testing Plan

## Backend

- Auth success and failure cases.
- Role guard behavior.
- Meal, attendance, distribution, and wastage validation.
- Waste percentage calculation.
- Inventory adjustment lower-bound behavior.
- School and district analytics aggregation.

## AI Service

- Nutrition totals for known food combinations.
- Deficiency detection thresholds.
- Weekly planner returns seven days.
- Repeated meals are avoided until the candidate list is exhausted.
- Budget and inventory penalties influence ranking.

## Mobile

- Meal form validation.
- Offline queue insert.
- Pending sync count.
- Attendance entry queueing.

## Web

- Dashboard renders all KPI cards.
- Charts render with supplied data.
- Weekly planner table is responsive.

## End-to-End Smoke

1. Start Docker Compose.
2. Seed database.
3. Login with `cook@school.gov`.
4. Create meal entry.
5. Submit attendance.
6. Generate weekly AI plan.
7. View dashboard analytics.
