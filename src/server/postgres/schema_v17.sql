-- ECONEX V17.0 Additive PostgreSQL 16 Schema Migration
-- Universal Economic Operating System
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v17_gate_remediations (
  gate_id TEXT PRIMARY KEY,
  gate_number INTEGER NOT NULL UNIQUE,
  gate_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  critical_non_waivable BOOLEAN NOT NULL DEFAULT TRUE,
  owner TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  blocked_by_gates JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_evidence TEXT NOT NULL,
  submitted_evidence TEXT NOT NULL,
  waiver_authority TEXT,
  target_date TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_participants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  participant_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  phone_masked TEXT NOT NULL,
  country_code TEXT NOT NULL,
  district TEXT NOT NULL,
  verification_level TEXT NOT NULL,
  govt_verified BOOLEAN NOT NULL DEFAULT FALSE,
  consent_granted BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'PARTICIPANTS_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_organizations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  country_code TEXT NOT NULL,
  district TEXT NOT NULL,
  verification_level TEXT NOT NULL,
  govt_verified BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_relationships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  party_a_id TEXT NOT NULL,
  party_b_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  visibility TEXT NOT NULL,
  status TEXT NOT NULL,
  established_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_commercial_listings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  seller_participant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sector TEXT NOT NULL,
  country_code TEXT NOT NULL,
  district TEXT NOT NULL,
  unit_price NUMERIC(18, 2) NOT NULL CHECK (unit_price >= 0),
  currency TEXT NOT NULL,
  unit_code TEXT NOT NULL,
  available_qty NUMERIC(18, 4) NOT NULL CHECK (available_qty >= 0),
  min_order_qty NUMERIC(18, 4) NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
  quantity NUMERIC(18, 4) NOT NULL,
  unit_code TEXT NOT NULL,
  state TEXT NOT NULL,
  verification_tier TEXT NOT NULL,
  external_provider_ref TEXT UNIQUE,
  offline_queued BOOLEAN NOT NULL DEFAULT FALSE,
  offline_revalidated BOOLEAN NOT NULL DEFAULT TRUE,
  state_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_transaction_evidence (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES v17_transactions(id),
  tenant_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  external_ref_id TEXT,
  payload_hash_sha256 TEXT NOT NULL,
  verified_by_independent_reviewer BOOLEAN NOT NULL DEFAULT FALSE,
  verification_tier TEXT NOT NULL,
  auto_verified_from_user_upload BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_disputes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL REFERENCES v17_transactions(id),
  complainant_id TEXT NOT NULL,
  respondent_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  claimed_amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL,
  stage TEXT NOT NULL,
  assigned_mediator_id TEXT,
  conflict_of_interest_declared BOOLEAN NOT NULL DEFAULT FALSE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v17_jurisdictions (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  activation_state TEXT NOT NULL,
  compliance_review_cleared BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_cooperatives (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  country_code TEXT NOT NULL,
  member_privacy_mode TEXT NOT NULL DEFAULT 'AGGREGATED_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_reconciliation_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL REFERENCES v17_transactions(id),
  currency TEXT NOT NULL,
  expected_amount NUMERIC(18, 2) NOT NULL,
  provider_reported_amount NUMERIC(18, 2) NOT NULL,
  variance_amount NUMERIC(18, 2) NOT NULL,
  status TEXT NOT NULL,
  correcting_journal_entry_id TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v17_network_billing_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  gross_transaction_value NUMERIC(18, 2) NOT NULL,
  provider_fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  refund_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  platform_service_fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  collected_platform_revenue NUMERIC(18, 2) NOT NULL DEFAULT 0,
  platform_receivable_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  exempt_public_service BOOLEAN NOT NULL DEFAULT FALSE,
  settlement_matched BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_governance_policies (
  id TEXT PRIMARY KEY,
  policy_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  requires_dual_authorization BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v17_migration_checkpoints (
  id TEXT PRIMARY KEY,
  from_schema_version INTEGER NOT NULL,
  to_schema_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  v16_backup_checksum_sha256 TEXT NOT NULL,
  migration_checksum_sha256 TEXT NOT NULL,
  financial_totals_preserved BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
