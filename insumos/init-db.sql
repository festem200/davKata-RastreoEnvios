SELECT 'CREATE DATABASE dav_kata_rastreo_envios'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'dav_kata_rastreo_envios'
)\gexec

\c dav_kata_rastreo_envios;

CREATE TABLE IF NOT EXISTS route (
  id BIGSERIAL PRIMARY KEY,
  origin_city VARCHAR(120) NOT NULL,
  destination_city VARCHAR(120) NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL CHECK (distance_km > 0),
  estimated_time_hours NUMERIC(8, 2) NOT NULL CHECK (estimated_time_hours > 0),
  vehicle_type VARCHAR(80) NOT NULL,
  carrier VARCHAR(120) NOT NULL,
  cost_usd NUMERIC(12, 2) NOT NULL CHECK (cost_usd >= 0),
  status VARCHAR(40) NOT NULL DEFAULT 'ACTIVA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "user" (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN route.status IS 'Estados posibles: ACTIVA, INACTIVA, SUSPENDIDA, EN_MANTENIMIENTO';
