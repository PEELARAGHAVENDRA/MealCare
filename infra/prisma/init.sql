CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Review companion for the Prisma schema in services/api/prisma/schema.prisma.
-- Use Prisma migrations/db push for application-managed environments.

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  district TEXT NOT NULL,
  block TEXT NOT NULL,
  address TEXT NOT NULL,
  student_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('KITCHEN_STAFF', 'SCHOOL_HEAD', 'NUTRITION_OFFICER', 'DISTRICT_ADMIN')),
  school_id TEXT REFERENCES schools(id),
  district_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  default_cost_per_unit NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nutrition_data (
  id TEXT PRIMARY KEY,
  food_item TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  calories DOUBLE PRECISION NOT NULL,
  protein DOUBLE PRECISION NOT NULL,
  carbs DOUBLE PRECISION NOT NULL,
  fat DOUBLE PRECISION NOT NULL,
  iron DOUBLE PRECISION NOT NULL,
  calcium DOUBLE PRECISION NOT NULL,
  vitamin_a DOUBLE PRECISION NOT NULL,
  vitamin_b DOUBLE PRECISION NOT NULL,
  vitamin_c DOUBLE PRECISION NOT NULL,
  vitamin_d DOUBLE PRECISION NOT NULL,
  fiber DOUBLE PRECISION NOT NULL,
  default_cost_per_serving NUMERIC(10, 2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS users_role_school_idx ON users(role, school_id);
