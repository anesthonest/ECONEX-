-- ECONEX V20.0 Additive PostgreSQL 16 Schema Migration (Schema Version 18)
-- Unified Economic Operations, Commercial Execution, Logistics, Cooperative Pooling & Pilot Management
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v20_unified_trades (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  listing_id TEXT,
  farm_plot_id TEXT,
  crop_record_id TEXT,
  cooperative_id TEXT,
  buyer_participant_id TEXT NOT NULL,
  seller_participant_id TEXT NOT NULL,
  organization_id TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC(18, 4) NOT NULL CHECK (quantity > 0),
  unit_code TEXT NOT NULL,
  unit_price NUMERIC(18, 2) NOT NULL CHECK (unit_price >= 0),
  currency TEXT NOT NULL,
  total_amount NUMERIC(18, 2) NOT NULL CHECK (total_amount >= 0),
  base_ugx_equivalent NUMERIC(18, 2) NOT NULL DEFAULT 0,
  fx_rate_used NUMERIC(18, 6) NOT NULL DEFAULT 1,
  stage TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  linked_shipment_id TEXT,
  payment_obligation_id TEXT,
  dispute_id TEXT,
  is_test_record BOOLEAN NOT NULL DEFAULT FALSE,
  agreement_summary_sha256 TEXT,
  stage_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  audit_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v20_logistics_shipments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  trade_id TEXT NOT NULL REFERENCES v20_unified_trades(id),
  transporter_participant_id TEXT,
  origin_country TEXT NOT NULL,
  origin_district TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  destination_district TEXT NOT NULL,
  corridor_code TEXT,
  status TEXT NOT NULL,
  delivery_evidence JSONB,
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v20_payment_obligations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  trade_id TEXT NOT NULL REFERENCES v20_unified_trades(id),
  payer_participant_id TEXT NOT NULL,
  payee_participant_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  expected_amount NUMERIC(18, 2) NOT NULL CHECK (expected_amount >= 0),
  received_amount NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (received_amount >= 0),
  variance_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  outstanding_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  disputed_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  payment_channel TEXT NOT NULL,
  ledger_entry_id TEXT,
  ledger_scope TEXT NOT NULL DEFAULT 'SANDBOX_RECONCILIATION',
  is_test_record BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v20_cooperative_pools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  cooperative_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_code TEXT NOT NULL,
  total_qty NUMERIC(18, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  target_unit_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
  linked_trade_id TEXT,
  status TEXT NOT NULL,
  contributions JSONB NOT NULL DEFAULT '[]'::jsonb,
  member_statements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v20_offline_conflicts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  client_version INTEGER NOT NULL,
  server_version INTEGER NOT NULL,
  client_payload JSONB NOT NULL,
  server_snapshot JSONB,
  resolution_state TEXT NOT NULL,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v20_pilot_programmes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  districts JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  support_contact TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  onboarded_participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v20_interoperability_webhooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_version TEXT NOT NULL DEFAULT 'v1',
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  mode TEXT NOT NULL DEFAULT 'SANDBOX',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v20_migration_checkpoints (
  id TEXT PRIMARY KEY,
  from_schema_version INTEGER NOT NULL,
  to_schema_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  v17_backup_checksum_sha256 TEXT NOT NULL,
  migration_checksum_sha256 TEXT NOT NULL,
  financial_totals_preserved BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
