-- AETHER-AROS V14.0 PostgreSQL Production Schema Extension (Extends schema_v13.sql)
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
-- Normalized relational schemas, foreign key integrity, CHECK invariants, and indexes for V14 domains.

-- Ensure base V13 schemas exist if executed standalone
CREATE SCHEMA IF NOT EXISTS identity_access;
CREATE SCHEMA IF NOT EXISTS core_economic;
CREATE SCHEMA IF NOT EXISTS financial_ledger;
CREATE SCHEMA IF NOT EXISTS institutional_metadata;
CREATE SCHEMA IF NOT EXISTS event_audit;

-- ==========================================
-- 1. V14 DATABASE CUTOVER & BACKUP GOVERNANCE
-- ==========================================
CREATE SCHEMA IF NOT EXISTS platform_ops;

CREATE TABLE IF NOT EXISTS platform_ops.database_cutover_checklists (
  id TEXT PRIMARY KEY,
  target_engine TEXT NOT NULL,
  current_authority_state TEXT NOT NULL,
  requested_authority_state TEXT NOT NULL,
  all_gates_passed BOOLEAN NOT NULL DEFAULT FALSE,
  gates_json JSONB NOT NULL,
  blocked_reasons_json JSONB NOT NULL,
  evaluated_by TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_ops.database_backup_verifications (
  id TEXT PRIMARY KEY,
  backup_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  bytes BIGINT NOT NULL CHECK (bytes >= 0),
  integrity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_supported BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. DISTRIBUTED BROKER HEALTH & CONSUMER OFFSETS
-- ==========================================
CREATE TABLE IF NOT EXISTS event_audit.distributed_broker_health (
  id TEXT PRIMARY KEY,
  broker_name TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  connection_status TEXT NOT NULL,
  is_active_authoritative_log BOOLEAN NOT NULL DEFAULT FALSE,
  ordering_key_enforced BOOLEAN NOT NULL DEFAULT TRUE,
  retention_policy_hours INTEGER NOT NULL CHECK (retention_policy_hours > 0),
  dlq_count INTEGER NOT NULL DEFAULT 0,
  last_health_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_audit.distributed_consumer_offsets (
  id TEXT PRIMARY KEY,
  consumer_group TEXT NOT NULL,
  topic_or_event_type TEXT NOT NULL,
  partition_key TEXT NOT NULL,
  committed_offset BIGINT NOT NULL CHECK (committed_offset >= 0),
  latest_outbox_offset BIGINT NOT NULL CHECK (latest_outbox_offset >= 0),
  consumer_lag BIGINT NOT NULL CHECK (consumer_lag >= 0),
  status TEXT NOT NULL,
  last_committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_consumer_group_topic_part
  ON event_audit.distributed_consumer_offsets (consumer_group, topic_or_event_type, partition_key);

-- ==========================================
-- 3. GLOBAL INSTITUTIONAL CONNECTIVITY & 16-STATE LIFECYCLE
-- ==========================================
CREATE TABLE IF NOT EXISTS institutional_metadata.agreements (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  agreement_type TEXT NOT NULL,
  agreement_reference TEXT NOT NULL,
  signed BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS institutional_metadata.onboarding_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_category TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  stage TEXT NOT NULL,
  legal_identity_status TEXT NOT NULL,
  regulatory_authority_status TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institutional_metadata.sandbox_tests (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  test_type TEXT NOT NULL,
  environment TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  external_reachable BOOLEAN NOT NULL DEFAULT FALSE,
  latency_ms INTEGER NOT NULL,
  executed_by TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institutional_metadata.production_approvals (
  id TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')),
  prerequisites_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 4. FINANCIAL INTEROPERABILITY & RECONCILIATION
-- ==========================================
CREATE TABLE IF NOT EXISTS financial_ledger.payment_providers (
  id TEXT PRIMARY KEY,
  provider_code TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  rail_type TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  credentials_configured BOOLEAN NOT NULL DEFAULT FALSE,
  sandbox_status TEXT NOT NULL,
  production_status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS financial_ledger.payment_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_id TEXT NOT NULL REFERENCES financial_ledger.payment_providers(id),
  corridor TEXT NOT NULL,
  source_currency TEXT NOT NULL,
  settlement_currency TEXT NOT NULL,
  amount NUMERIC(20, 4) NOT NULL CHECK (amount > 0),
  fee_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  fx_quote_mode TEXT NOT NULL CHECK (fx_quote_mode IN ('INDICATIVE', 'EXECUTABLE')),
  status TEXT NOT NULL,
  settlement_verified BOOLEAN NOT NULL DEFAULT FALSE,
  settlement_receipt_id TEXT,
  ledger_journal_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_tx_tenant_status
  ON financial_ledger.payment_transactions (tenant_id, status);

CREATE TABLE IF NOT EXISTS financial_ledger.provider_settlement_receipts (
  id TEXT PRIMARY KEY,
  payment_transaction_id TEXT NOT NULL REFERENCES financial_ledger.payment_transactions(id),
  provider_id TEXT NOT NULL REFERENCES financial_ledger.payment_providers(id),
  provider_reference TEXT NOT NULL,
  currency TEXT NOT NULL,
  settled_amount NUMERIC(20, 4) NOT NULL CHECK (settled_amount >= 0),
  proof_source TEXT NOT NULL,
  signature_hex TEXT NOT NULL,
  verified_by_platform BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_ledger.reconciliation_batches (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  matched_count INTEGER NOT NULL DEFAULT 0,
  partial_match_count INTEGER NOT NULL DEFAULT 0,
  unmatched_internal_count INTEGER NOT NULL DEFAULT 0,
  unmatched_provider_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_ledger.reconciliation_exceptions (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES financial_ledger.reconciliation_batches(id),
  tenant_id TEXT NOT NULL,
  payment_transaction_id TEXT,
  exception_type TEXT NOT NULL,
  currency TEXT NOT NULL,
  expected_amount NUMERIC(20, 4) NOT NULL,
  observed_amount NUMERIC(20, 4) NOT NULL,
  variance_amount NUMERIC(20, 4) NOT NULL,
  severity TEXT NOT NULL,
  resolution_status TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 5. TRADE, PROCUREMENT, EVIDENCE & TAX COMPLIANCE
-- ==========================================
CREATE TABLE IF NOT EXISTS core_economic.tax_jurisdiction_rules (
  id TEXT PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  tax_type TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  rate_pct NUMERIC(6, 3) NOT NULL CHECK (rate_pct >= 0 AND rate_pct <= 100),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS core_economic.delivery_verification_evidences (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  document_hash_sha256 TEXT NOT NULL,
  evidence_trust_state TEXT NOT NULL CHECK (evidence_trust_state IN ('SUBMITTED_CLAIM', 'INDEPENDENTLY_VERIFIED', 'REJECTED_FRAUDULENT')),
  verified_by TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 6. SECURITY INCIDENTS, COMMERCIAL PLANS & READINESS
-- ==========================================
CREATE TABLE IF NOT EXISTS identity_access.security_incidents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  actor_id TEXT,
  details TEXT NOT NULL,
  status TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_ops.commercial_plans (
  id TEXT PRIMARY KEY,
  plan_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  monthly_price_usd NUMERIC(12, 2) NOT NULL CHECK (monthly_price_usd >= 0),
  monthly_price_ugx NUMERIC(16, 2) NOT NULL CHECK (monthly_price_ugx >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS platform_ops.customer_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  subtotal NUMERIC(20, 2) NOT NULL,
  tax_amount NUMERIC(20, 2) NOT NULL,
  total_amount NUMERIC(20, 2) NOT NULL,
  status TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
