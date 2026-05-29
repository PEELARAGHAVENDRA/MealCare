-- The canonical schema is services/api/prisma/schema.prisma.
-- This SQL mirrors the main entities for database review.

CREATE TABLE schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  district TEXT NOT NULL,
  block TEXT NOT NULL,
  address TEXT NOT NULL,
  student_count INTEGER NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  school_id TEXT REFERENCES schools(id),
  district_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE nutrition_data (
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
  fiber DOUBLE PRECISION NOT NULL
);

CREATE INDEX users_role_school_idx ON users(role, school_id);
