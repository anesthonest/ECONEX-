-- AETHER-AROS V15.0 PostgreSQL 16 Production Schema Extension (Extends schema_v13.sql & schema_v14.sql)
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
-- Normalized relational schemas, foreign keys, CHECK invariants, unique indexes, and tenant boundaries.

CREATE SCHEMA IF NOT EXISTS network_activation;
CREATE SCHEMA IF NOT EXISTS marketplace_exec;
CREATE SCHEMA IF NOT EXISTS trade_corridors;
CREATE SCHEMA IF NOT EXISTS impact_telemetry;
CREATE SCHEMA IF NOT EXISTS developer_platform;
CREATE SCHEMA IF NOT EXISTS pilot_ops;

-- ==========================================
-- 1. GLOBAL ECONOMIC PARTICIPANT NETWORK
-- ==========================================
CREATE TABLE IF NOT EXISTS network_activation.economic_participants (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  district_or_city TEXT NOT NULL,
  kyc_status TEXT NOT NULL CHECK (kyc_status IN ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED')),
  kyb_status TEXT NOT NULL CHECK (kyb_status IN ('NOT_APPLICABLE', 'UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED')),
  regulatory_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  verification_level TEXT NOT NULL,
  account_status TEXT NOT NULL CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'UNDER_APPEAL')),
  trust_score NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  is_pilot_participant BOOLEAN NOT NULL DEFAULT FALSE,
  pilot_consent_recorded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ep_tenant_cat ON network_activation.economic_participants (tenant_id, category, jurisdiction);

CREATE TABLE IF NOT EXISTS network_activation.participant_verifications (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  provider_or_reviewer TEXT NOT NULL,
  document_reference_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS network_activation.organization_memberships (
  id TEXT PRIMARY KEY,
  organization_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  member_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  tenant_id TEXT NOT NULL,
  branch_id TEXT,
  role_title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_activation.business_locations (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  city_or_district TEXT NOT NULL,
  location_type TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. GLOBAL COMMERCE, DISCOVERY & EXECUTION ENGINE
-- ==========================================
CREATE TABLE IF NOT EXISTS marketplace_exec.economic_listings (
  id TEXT PRIMARY KEY,
  seller_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  tenant_id TEXT NOT NULL,
  market_type TEXT NOT NULL,
  sector TEXT NOT NULL,
  title TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC(20, 4) NOT NULL CHECK (unit_price >= 0),
  currency TEXT NOT NULL,
  available_quantity NUMERIC(20, 4) NOT NULL CHECK (available_quantity >= 0),
  min_order_quantity NUMERIC(20, 4) NOT NULL DEFAULT 1,
  verified_supplier BOOLEAN NOT NULL DEFAULT FALSE,
  promoted_placement BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_sector_jur ON marketplace_exec.economic_listings (sector, jurisdiction, active);

CREATE TABLE IF NOT EXISTS marketplace_exec.service_listings (
  id TEXT PRIMARY KEY,
  provider_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  tenant_id TEXT NOT NULL,
  service_category TEXT NOT NULL,
  title TEXT NOT NULL,
  base_rate NUMERIC(20, 4) NOT NULL CHECK (base_rate >= 0),
  currency TEXT NOT NULL,
  verified_provider BOOLEAN NOT NULL DEFAULT FALSE,
  promoted_placement BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_exec.buyer_requests (
  id TEXT PRIMARY KEY,
  buyer_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sector TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  quantity NUMERIC(20, 4) NOT NULL CHECK (quantity > 0),
  target_unit_price NUMERIC(20, 4) NOT NULL CHECK (target_unit_price >= 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_exec.commercial_quotations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  buyer_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  seller_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  quantity NUMERIC(20, 4) NOT NULL CHECK (quantity > 0),
  quoted_unit_price NUMERIC(20, 4) NOT NULL CHECK (quoted_unit_price >= 0),
  total_quoted_value NUMERIC(20, 4) NOT NULL CHECK (total_quoted_value >= 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_exec.marketplace_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  buyer_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  seller_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  listing_id TEXT,
  quotation_id TEXT,
  purchase_order_id TEXT,
  jurisdiction TEXT NOT NULL,
  currency TEXT NOT NULL,
  quantity NUMERIC(20, 4) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(20, 4) NOT NULL CHECK (unit_price >= 0),
  total_amount NUMERIC(20, 4) NOT NULL CHECK (total_amount >= 0),
  lifecycle_state TEXT NOT NULL,
  payment_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  settlement_verified BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_tenant_state ON marketplace_exec.marketplace_orders (tenant_id, lifecycle_state);

CREATE TABLE IF NOT EXISTS marketplace_exec.economic_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  initiating_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  counterparty_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  jurisdiction TEXT NOT NULL,
  currency TEXT NOT NULL,
  transaction_value NUMERIC(20, 4) NOT NULL CHECK (transaction_value >= 0),
  settled_value NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (settled_value >= 0),
  contract_reference TEXT,
  marketplace_order_id TEXT REFERENCES marketplace_exec.marketplace_orders(id),
  payment_provider_reference TEXT,
  delivery_reference TEXT,
  ledger_journal_id TEXT,
  lifecycle_state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_exec.delivery_evidences (
  id TEXT PRIMARY KEY,
  marketplace_order_id TEXT NOT NULL REFERENCES marketplace_exec.marketplace_orders(id),
  execution_id TEXT REFERENCES marketplace_exec.economic_executions(id),
  tenant_id TEXT NOT NULL,
  submitted_by_participant_id TEXT NOT NULL,
  verified_by_independent_participant_id TEXT,
  document_hash_sha256 TEXT NOT NULL,
  trust_status TEXT NOT NULL CHECK (trust_status IN ('SUBMITTED_CLAIM', 'INDEPENDENTLY_VERIFIED', 'REJECTED')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- ==========================================
-- 3. PAYMENT PROVIDERS, TRADE CORRIDORS & DEVELOPER ECOSYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS marketplace_exec.provider_integrations (
  id TEXT PRIMARY KEY,
  provider_code TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  rail_type TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  credentials_configured BOOLEAN NOT NULL DEFAULT FALSE,
  sandbox_validated BOOLEAN NOT NULL DEFAULT FALSE,
  production_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  availability_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS marketplace_exec.provider_transactions (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES marketplace_exec.provider_integrations(id),
  execution_id TEXT REFERENCES marketplace_exec.economic_executions(id),
  tenant_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_reference TEXT NOT NULL,
  currency TEXT NOT NULL,
  requested_amount NUMERIC(20, 4) NOT NULL CHECK (requested_amount > 0),
  settled_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (settled_amount >= 0),
  status TEXT NOT NULL,
  is_non_production_test BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_corridors.trade_shipments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  execution_id TEXT,
  origin_jurisdiction TEXT NOT NULL,
  destination_jurisdiction TEXT NOT NULL,
  corridor_code TEXT NOT NULL,
  carrier_participant_id TEXT NOT NULL,
  hs_classification_ref TEXT NOT NULL,
  estimated_duty_tax_amount NUMERIC(20, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  platform_document_generated BOOLEAN NOT NULL DEFAULT TRUE,
  official_customs_clearance_verified BOOLEAN NOT NULL DEFAULT FALSE,
  customs_authority_reference TEXT,
  milestone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developer_platform.developer_applications (
  id TEXT PRIMARY KEY,
  developer_participant_id TEXT NOT NULL REFERENCES network_activation.economic_participants(id),
  tenant_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  auth_mode TEXT NOT NULL,
  client_id TEXT NOT NULL UNIQUE,
  api_secret_hash_sha256 TEXT NOT NULL,
  rate_limit_per_minute INTEGER NOT NULL CHECK (rate_limit_per_minute > 0),
  environment TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. IMPACT MEASUREMENT, PRODUCTION GATES & PILOT TELEMETRY
-- ==========================================
CREATE TABLE IF NOT EXISTS impact_telemetry.impact_measurements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  reporting_period TEXT NOT NULL,
  metrics_snapshot_json JSONB NOT NULL,
  value_breakdown_json JSONB NOT NULL,
  computed_by TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pilot_ops.production_deployments (
  id TEXT PRIMARY KEY,
  release_version TEXT NOT NULL,
  environment TEXT NOT NULL,
  database_authority_state TEXT NOT NULL,
  gates_passed INTEGER NOT NULL CHECK (gates_passed >= 0 AND gates_passed <= 17),
  gates_total INTEGER NOT NULL DEFAULT 17,
  production_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pilot_ops.pilot_operations (
  id TEXT PRIMARY KEY,
  pilot_code TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  producer_participant_id TEXT NOT NULL,
  buyer_participant_id TEXT NOT NULL,
  current_step_number INTEGER NOT NULL CHECK (current_step_number >= 1 AND current_step_number <= 16),
  current_step_name TEXT NOT NULL,
  uses_live_payment_rail BOOLEAN NOT NULL DEFAULT FALSE,
  non_production_workflow_disclosed BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
