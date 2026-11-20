-- AETHER-AROS V13.0 PostgreSQL + Optional TimescaleDB Production Schema
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
-- Safe modular separation across 10 logical economic domains.

-- 1. Identity & Access Workload
CREATE SCHEMA IF NOT EXISTS identity_access;
CREATE TABLE IF NOT EXISTS identity_access.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  organization_id TEXT,
  district TEXT,
  country TEXT NOT NULL DEFAULT 'UG',
  verification_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS identity_access.tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  status TEXT NOT NULL,
  primary_admin_user_id TEXT REFERENCES identity_access.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Core Economic Transactions Workload
CREATE SCHEMA IF NOT EXISTS core_economic;
CREATE TABLE IF NOT EXISTS core_economic.economic_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  origin_jurisdiction TEXT NOT NULL,
  destination_jurisdiction TEXT NOT NULL,
  activity_classification TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC(20, 4) NOT NULL,
  settlement_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_tenant_status ON core_economic.economic_executions (tenant_id, status);

-- 3. Financial Ledger Workload
CREATE SCHEMA IF NOT EXISTS financial_ledger;
CREATE TABLE IF NOT EXISTS financial_ledger.universal_journal (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  total_debit_ugx NUMERIC(20, 2) NOT NULL CHECK (total_debit_ugx >= 0),
  total_credit_ugx NUMERIC(20, 2) NOT NULL CHECK (total_credit_ugx >= 0),
  balanced BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_double_entry_balanced CHECK (total_debit_ugx = total_credit_ugx)
);

-- 4. Marketplace & Procurement Workload
CREATE SCHEMA IF NOT EXISTS marketplace_procurement;
CREATE TABLE IF NOT EXISTS marketplace_procurement.listings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sector TEXT NOT NULL,
  title TEXT NOT NULL,
  unit_price NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Trade & Logistics Workload
CREATE SCHEMA IF NOT EXISTS trade_logistics;
CREATE TABLE IF NOT EXISTS trade_logistics.corridor_shipments (
  id TEXT PRIMARY KEY,
  corridor_id TEXT NOT NULL,
  origin_jurisdiction TEXT NOT NULL,
  destination_jurisdiction TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Economic Intelligence & Forecasting Workload
CREATE SCHEMA IF NOT EXISTS economic_intelligence;
CREATE TABLE IF NOT EXISTS economic_intelligence.forecast_models (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  method TEXT NOT NULL,
  version TEXT NOT NULL,
  deployment_status TEXT NOT NULL,
  baseline_model_id TEXT,
  drift_detected BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. Time-Series Observations Workload (TimescaleDB Optional Hypertable)
CREATE SCHEMA IF NOT EXISTS timeseries_observations;
CREATE TABLE IF NOT EXISTS timeseries_observations.economic_observations (
  id TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  observation_period TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  numeric_value NUMERIC(20, 4) NOT NULL,
  normalized_value NUMERIC(20, 4) NOT NULL,
  normalized_unit TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  PRIMARY KEY (id, observed_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ts_dedupe ON timeseries_observations.economic_observations (dedupe_key, observed_at);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb') THEN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
    PERFORM create_hypertable('timeseries_observations.economic_observations', 'observed_at', if_not_exists => TRUE);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Vanilla PostgreSQL fallback preserves full relational indexing without TimescaleDB
  NULL;
END $$;

-- 8. Durable Event & Cryptographic Audit Workload
CREATE SCHEMA IF NOT EXISTS event_audit;
CREATE TABLE IF NOT EXISTS event_audit.outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  integrity_hash TEXT NOT NULL,
  delivery_status TEXT NOT NULL,
  sequence_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS event_audit.signed_checkpoints (
  id TEXT PRIMARY KEY,
  root_hash TEXT NOT NULL,
  signing_key_id TEXT NOT NULL,
  signature_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Background Jobs & Distributed Workers Workload
CREATE SCHEMA IF NOT EXISTS background_jobs;
CREATE TABLE IF NOT EXISTS background_jobs.forecasting_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  method TEXT NOT NULL,
  horizon TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Institutional Integration & Sovereignty Metadata
CREATE SCHEMA IF NOT EXISTS institutional_metadata;
CREATE TABLE IF NOT EXISTS institutional_metadata.connectors (
  id TEXT PRIMARY KEY,
  institution_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  sandbox_status TEXT NOT NULL,
  production_status TEXT NOT NULL,
  agreement_signed BOOLEAN NOT NULL DEFAULT FALSE
);
