-- ECONEX V30.0 — Universal Financial Interoperability, Economic Resilience & Intelligent Execution
-- PostgreSQL 16 Additive Schema Migration (Schema Version 27)
-- Mirror copy under src/server/postgres/ for in-server migration checksum verification.
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v30_schema_migrations (
  version INTEGER PRIMARY KEY,
  release_tag TEXT NOT NULL,
  ddl_checksum_sha256 TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_financial_providers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  provider_category TEXT NOT NULL CHECK (provider_category IN (
    'MOBILE_MONEY','COMMERCIAL_BANK','CENTRAL_BANK_RTGS','INSTANT_INTERBANK_SWITCH',
    'PAYMENT_GATEWAY','REMITTANCE_RAIL','CARD_SCHEME_GATEWAY','SACCO_COOP_HUB','DIGITAL_ASSET_GATE'
  )),
  countries_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  currencies_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  integration_status TEXT NOT NULL CHECK (integration_status IN (
    'SIMULATED','CREDENTIALS_REQUIRED','PARTNER_APPROVAL_REQUIRED','REGULATORY_APPROVAL_REQUIRED','SANDBOX_ACTIVE','LIVE'
  )),
  health_status TEXT NOT NULL CHECK (health_status IN (
    'HEALTHY','DEGRADED','DOWN','MAINTENANCE','CIRCUIT_OPEN'
  )),
  fee_bps INTEGER NOT NULL DEFAULT 0 CHECK (fee_bps >= 0),
  flat_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (flat_fee_minor >= 0),
  fx_markup_bps INTEGER NOT NULL DEFAULT 0 CHECK (fx_markup_bps >= 0),
  typical_settlement_seconds INTEGER NOT NULL DEFAULT 30,
  reliability_score INTEGER NOT NULL DEFAULT 99 CHECK (reliability_score BETWEEN 0 AND 100),
  supports_ussd_offline BOOLEAN NOT NULL DEFAULT FALSE,
  supports_webhooks_hmac BOOLEAN NOT NULL DEFAULT TRUE,
  sandbox_only BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_payment_instructions (
  id TEXT PRIMARY KEY,
  instruction_ref TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  initiator_user_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  recipient_ref TEXT NOT NULL,
  source_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  principal_minor BIGINT NOT NULL CHECK (principal_minor > 0),
  provider_fee_minor BIGINT NOT NULL DEFAULT 0,
  platform_fee_minor BIGINT NOT NULL DEFAULT 0,
  fx_spread_minor BIGINT NOT NULL DEFAULT 0,
  total_debit_minor BIGINT NOT NULL CHECK (total_debit_minor >= principal_minor),
  selected_provider_id TEXT NOT NULL REFERENCES v30_financial_providers(id),
  fallback_provider_id TEXT,
  routing_strategy TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  sandbox_only BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_payment_attempts (
  id TEXT PRIMARY KEY,
  payment_instruction_id TEXT NOT NULL REFERENCES v30_payment_instructions(id),
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  provider_id TEXT NOT NULL REFERENCES v30_financial_providers(id),
  status TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_instruction_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS v30_settlement_records (
  id TEXT PRIMARY KEY,
  payment_instruction_id TEXT NOT NULL REFERENCES v30_payment_instructions(id),
  provider_id TEXT NOT NULL,
  settlement_batch_ref TEXT NOT NULL,
  currency TEXT NOT NULL,
  gross_minor BIGINT NOT NULL CHECK (gross_minor >= 0),
  fee_minor BIGINT NOT NULL CHECK (fee_minor >= 0),
  net_minor BIGINT NOT NULL CHECK (net_minor >= 0),
  balanced BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_reconciliation_cases (
  id TEXT PRIMARY KEY,
  payment_instruction_id TEXT NOT NULL REFERENCES v30_payment_instructions(id),
  expected_minor BIGINT NOT NULL,
  reported_minor BIGINT NOT NULL,
  variance_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_financial_corridors (
  id TEXT PRIMARY KEY,
  corridor_code TEXT NOT NULL UNIQUE,
  origin_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  origin_currency TEXT NOT NULL,
  destination_currency TEXT NOT NULL,
  indicative_fx_rate NUMERIC(18,6) NOT NULL,
  econex_fee_bps INTEGER NOT NULL,
  legacy_remittance_fee_bps INTEGER NOT NULL,
  settlement_window_label TEXT NOT NULL,
  primary_provider_id TEXT NOT NULL,
  regulatory_status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_agent_profiles (
  id TEXT PRIMARY KEY,
  agent_code TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  town_or_market TEXT NOT NULL,
  verification_tier TEXT NOT NULL,
  reliability_score INTEGER NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_liquidity_reports (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES v30_agent_profiles(id),
  currency TEXT NOT NULL,
  cash_available_band TEXT NOT NULL,
  float_available_band TEXT NOT NULL,
  max_single_payout_minor BIGINT NOT NULL DEFAULT 0,
  reported_by_user_id TEXT NOT NULL,
  freshness_expires_at TIMESTAMPTZ NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_financial_disputes (
  id TEXT PRIMARY KEY,
  dispute_ref TEXT NOT NULL UNIQUE,
  payment_instruction_id TEXT REFERENCES v30_payment_instructions(id),
  claimant_user_id TEXT NOT NULL,
  respondent_org_id TEXT NOT NULL,
  amount_in_dispute_minor BIGINT NOT NULL CHECK (amount_in_dispute_minor > 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_fraud_risk_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  rule_triggered TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_regulatory_requirements (
  id TEXT PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  authority TEXT NOT NULL,
  requirement_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_business_finance_docs (
  id TEXT PRIMARY KEY,
  doc_ref TEXT NOT NULL UNIQUE,
  doc_type TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  requester_user_id TEXT NOT NULL,
  approver_user_id TEXT,
  total_minor BIGINT NOT NULL CHECK (total_minor > 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_offline_ussd_sessions (
  id TEXT PRIMARY KEY,
  msisdn TEXT NOT NULL,
  dial_string TEXT NOT NULL,
  action_intent TEXT NOT NULL,
  adapter_mode TEXT NOT NULL DEFAULT 'SIMULATED_USSD_ADAPTER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v30_ai_request_metrics (
  id TEXT PRIMARY KEY,
  domain_task TEXT NOT NULL,
  model_name TEXT NOT NULL,
  outcome TEXT NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
