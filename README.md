# AI-Powered Mid-Day Meal Monitoring & Smart Nutrition Planning System

Monorepo for school meal monitoring, nutrition analytics, food wastage tracking, and **AI-driven weekly meal optimization** powered by Google Gemini — with an automatic rules-engine fallback for offline resilience.

## Architecture

```
MealCare AI/
├── apps/
│   ├── mobile-flutter/         # Android-first Flutter app (offline-first)
│   └── web-dashboard/          # Next.js dashboard (analytics, planner, reports)
├── services/
│   └── api/                    # Express + TypeScript + Prisma + PostgreSQL
│       ├── src/
│       │   ├── ai-engine/      # ← AI abstraction layer (in-process)
│       │   │   ├── providers/  #    GeminiProvider, MockProvider, ProviderFactory
│       │   │   ├── prompts/    #    All LLM prompt templates
│       │   │   ├── modules/    #    7 AI modules with Prisma logging
│       │   │   └── fallback/   #    RulesEngine (deterministic offline fallback)
│       │   ├── routes/         #    REST API routes (auth, ai, meals, etc.)
│       │   ├── middleware/     #    Auth, validation
│       │   └── lib/            #    Prisma client, auth helpers
│       └── prisma/
│           └── schema.prisma   #    Full schema (including AI models)
├── packages/
│   └── shared-contracts/       # Shared TypeScript types (AI types, roles, etc.)
└── ai-integration/             # Blueprint/reference (already applied to project)
```

## AI Engine

The AI engine runs **in-process** inside the Express API — no separate Python service needed. It supports three providers:

| Provider | Description | When to Use |
|----------|-------------|-------------|
| **Gemini** | Google Gemini 2.5 Flash via REST API | Production — real AI analysis |
| **Mock** | Static fixtures, instant responses | Tests, CI, development without API key |
| **RulesEngine** | Deterministic fallback (nutrition DB, templates) | Automatic — when Gemini fails |

### AI Modules

| Module | Endpoint | Description |
|--------|----------|-------------|
| Nutrition Engine | `POST /ai/nutrition` | Analyze ingredients for calories, macros, deficiency alerts |
| Meal Optimizer | `POST /ai/meal-plan` | Generate budget-optimized weekly schedules |
| Participation Predictor | `POST /ai/participation` | Forecast student meal attendance |
| Wastage Analyzer | `POST /ai/waste` | Predict food waste and suggest mitigations |
| Inventory Analyzer | `POST /ai/inventory` | Stock level alerts, expiry warnings, menu suggestions |
| Holiday Planner | `POST /ai/holiday-plan` | Adjust schedule for festivals and closures |
| Recommendation Engine | `POST /ai/recommendations` | Ingredient procurement recommendations |
| Health Check | `GET /ai/health` | Provider status and configuration |

### Admin Endpoints

| Endpoint | Description | Access |
|----------|-------------|--------|
| `POST /ai/admin/provider` | Hot-swap AI provider (gemini ↔ mock) | District Admin |
| `GET /ai/admin/stats` | View AI usage stats, token counts, fallback rate | District Admin |
| `PATCH /ai/recommendations/:id/approve` | Approve a recommendation | School Head+ |
| `PATCH /ai/recommendations/:id/reject` | Reject a recommendation | School Head+ |

### AI Database Models

| Model | Purpose |
|-------|---------|
| `AiRequest` | Logs every AI call (provider, tokens, latency, fallback flag) |
| `AiPrediction` | Stores predictions for trend analysis |
| `AiRecommendation` | Approval workflow for AI suggestions |
| `AiProviderConfig` | DB-level provider switching |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` (or edit the existing `.env`):

```env
# Database
DATABASE_URL=postgresql://midday:midday_password@localhost:5432/midday_meal_ai?schema=public

# Auth
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d

# API
API_PORT=4000

# AI Engine
AI_PROVIDER=mock          # "gemini" | "mock" (start with mock, switch to gemini when ready)
GEMINI_API_KEY=           # Required when AI_PROVIDER=gemini
MODEL_NAME=gemini-2.5-flash
AI_TIMEOUT_MS=30000
```

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Initialize database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Start the API

```bash
npm run dev:api
```

### 6. Verify AI is working

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"district@district.gov","password":"Password123!"}' \
  | jq -r '.token')

# Health check
curl -s http://localhost:4000/ai/health -H "Authorization: Bearer $TOKEN" | jq

# Test nutrition analysis
curl -s -X POST http://localhost:4000/ai/nutrition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"ingredients":["Rice","Dal","Egg","Spinach","Banana"]}' | jq
```

### 7. Enable Gemini AI (optional)

Set your API key and switch provider:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
```

Or switch at runtime via the admin endpoint:

```bash
curl -s -X POST http://localhost:4000/ai/admin/provider \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"provider":"gemini"}'
```

## Main URLs

- Web dashboard: `http://localhost:3000`
- REST API: `http://localhost:4000`
- Swagger docs: `http://localhost:4000/docs`
- AI health: `http://localhost:4000/ai/health`

## Seeded Roles

All seeded users use password `Password123!`:

| Role | Email | Access Level |
|------|-------|------|
| Kitchen Staff | `cook@school.gov` | Nutrition analysis, waste prediction, inventory |
| School Head | `head@school.gov` | + Meal planning, participation, approve/reject |
| Nutrition Officer | `nutrition@district.gov` | + Recommendations, participation predictions |
| District Admin | `district@district.gov` | Full access — provider management, stats |

## Tech Stack

- **API**: Express, TypeScript, Prisma, PostgreSQL, JWT
- **AI**: Google Gemini 2.5 Flash (with RulesEngine fallback)
- **Web**: Next.js
- **Mobile**: Flutter (offline-first)
- **Shared**: TypeScript contracts (workspace package)
