-- ECONEX V30.0 — Universal Financial Interoperability, Economic Resilience & Intelligent Execution
-- PostgreSQL 16 Additive Schema Migration (Schema Version 27)
-- Local JSON WAL remains fail-closed authoritative until POSTGRESQL_CUTOVER_COMPLETE=true.
-- All monetary quantities use integer minor units (BIGINT).
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v30_schema_migrations (
  version INTEGER PRIMARY KEY,
  release_tag TEXT NOT NULL,
  ddl_checksum_sha256 TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Universal Financial Interoperability Providers
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

-- 2. Provider Capabilities Matrix
CREATE TABLE IF NOT EXISTS v30_provider_capabilities (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES v30_financial_providers(id),
  rail_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  min_amount_minor BIGINT NOT NULL DEFAULT 100,
  max_amount_minor BIGINT NOT NULL DEFAULT 5000000000,
  supports_payout BOOLEAN NOT NULL DEFAULT TRUE,
  supports_collection BOOLEAN NOT NULL DEFAULT TRUE,
  supports_reversal BOOLEAN NOT NULL DEFAULT TRUE,
  avg_latency_ms INTEGER NOT NULL DEFAULT 240,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Provider Health Events & Outage Circuit Breaker Telemetry
CREATE TABLE IF NOT EXISTS v30_provider_health_events (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES v30_financial_providers(id),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  error_rate_bps INTEGER NOT NULL DEFAULT 0,
  circuit_breaker_state TEXT NOT NULL CHECK (circuit_breaker_state IN ('CLOSED','OPEN','HALF_OPEN')),
  actor_user_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Payment Routing Policies
CREATE TABLE IF NOT EXISTS v30_payment_routing_policies (
  id TEXT PRIMARY KEY,
  policy_name TEXT NOT NULL UNIQUE,
  strategy TEXT NOT NULL CHECK (strategy IN ('LOWEST_COST','FASTEST_SETTLEMENT','HIGHEST_RELIABILITY','FALLBACK_RESILIENCE')),
  corridor_code TEXT NOT NULL DEFAULT 'ALL',
  max_fee_bps INTEGER NOT NULL DEFAULT 500,
  allow_failover BOOLEAN NOT NULL DEFAULT TRUE,
  require_sandbox_disclosure BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Universal Payment Instructions (Full Lifecycle & Idempotency)
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
  fx_rate_numerator BIGINT NOT NULL DEFAULT 1,
  fx_rate_denominator BIGINT NOT NULL DEFAULT 1,
  selected_provider_id TEXT NOT NULL REFERENCES v30_financial_providers(id),
  fallback_provider_id TEXT,
  routing_strategy TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN (
    'REQUESTED','VALIDATING','AUTHORIZED','SUBMITTED','PROCESSING',
    'CONFIRMED','FAILED','PENDING_RECONCILIATION','RECONCILED','CLOSED','DISPUTED','REVERSED'
  )),
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  sandbox_only BOOLEAN NOT NULL DEFAULT TRUE,
  offline_queued BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_v30_pi_org_state ON v30_payment_instructions(organisation_id, lifecycle_state);

-- 6. Payment Attempts (Prevents Duplicate Payment Across Failover)
CREATE TABLE IF NOT EXISTS v30_payment_attempts (
  id TEXT PRIMARY KEY,
  payment_instruction_id TEXT NOT NULL REFERENCES v30_payment_instructions(id),
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  provider_id TEXT NOT NULL REFERENCES v30_financial_providers(id),
  status TEXT NOT NULL CHECK (status IN ('INITIATED','SUCCEEDED','FAILED_RETRYABLE','FAILED_TERMINAL','SKIPPED_FAILOVER')),
  provider_ref TEXT,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_instruction_id, attempt_number)
);

-- 7. Settlement Records (Double-Entry Balanced)
CREATE TABLE IF NOT EXISTS v30_settlement_records (
  id TEXT PRIMARY KEY,
  payment_instruction_id TEXT NOT NULL REFERENCES v30_payment_instructions(id),
  provider_id TEXT NOT NULL,
  settlement_batch_ref TEXT NOT NULL,
  currency TEXT NOT NULL,
  gross_minor BIGINT NOT NULL CHECK (gross_minor >= 0),
  fee_minor BIGINT NOT NULL CHECK (fee_minor >= 0),
  net_minor BIGINT NOT NULL CHECK (net_minor >= 0),
  journal_entry_id TEXT,
  balanced BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('STAGED','RECONCILED','EXCEPTION','REVERSED')),
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Reconciliation Cases
CREATE TABLE IF NOT EXISTS v30_reconciliation_cases (
  id TEXT PRIMARY KEY,
  payment_instruction_id TEXT NOT NULL REFERENCES v30_payment_instructions(id),
  expected_minor BIGINT NOT NULL,
  reported_minor BIGINT NOT NULL,
  variance_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL CHECK (status IN ('OPEN','INVESTIGATING','RESOLVED_MATCHED','WRITTEN_OFF_APPROVED')),
  assigned_to_user_id TEXT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 9. Cross-Border Financial Corridors
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
  supported_rails_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Agent Profiles
CREATE TABLE IF NOT EXISTS v30_agent_profiles (
  id TEXT PRIMARY KEY,
  agent_code TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  town_or_market TEXT NOT NULL,
  supported_providers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  services_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_tier TEXT NOT NULL CHECK (verification_tier IN ('UNVERIFIED','BASIC_VERIFIED','COOPERATIVE_VERIFIED','INSTITUTIONAL_VERIFIED')),
  reliability_score INTEGER NOT NULL DEFAULT 90,
  operating_hours TEXT NOT NULL,
  ussd_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Agent & Corridor Liquidity Reports
CREATE TABLE IF NOT EXISTS v30_liquidity_reports (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES v30_agent_profiles(id),
  currency TEXT NOT NULL,
  cash_available_band TEXT NOT NULL CHECK (cash_available_band IN ('HIGH','MODERATE','LOW','DEPLETED')),
  float_available_band TEXT NOT NULL CHECK (float_available_band IN ('HIGH','MODERATE','LOW','DEPLETED')),
  max_single_payout_minor BIGINT NOT NULL DEFAULT 0,
  reported_by_user_id TEXT NOT NULL,
  reporter_provenance TEXT NOT NULL,
  freshness_expires_at TIMESTAMPTZ NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Commercial Protection & Financial Disputes
CREATE TABLE IF NOT EXISTS v30_financial_disputes (
  id TEXT PRIMARY KEY,
  dispute_ref TEXT NOT NULL UNIQUE,
  payment_instruction_id TEXT REFERENCES v30_payment_instructions(id),
  linked_order_or_contract_id TEXT,
  claimant_user_id TEXT NOT NULL,
  respondent_org_id TEXT NOT NULL,
  amount_in_dispute_minor BIGINT NOT NULL CHECK (amount_in_dispute_minor > 0),
  currency TEXT NOT NULL,
  category TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_hashes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  escrow_hold_active BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('OPEN','EVIDENCE_REVIEW','ESCROW_HOLD','MEDIATION','RESOLVED_REFUND','RESOLVED_RELEASE','ESCALATED')),
  mediator_user_id TEXT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Fraud Risk Events & Security Controls
CREATE TABLE IF NOT EXISTS v30_fraud_risk_events (
  id TEXT PRIMARY KEY,
  payment_instruction_id TEXT,
  actor_user_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  rule_triggered TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  velocity_count INTEGER NOT NULL DEFAULT 1,
  human_review_required BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL CHECK (status IN ('OPEN_REVIEW','CLEARED','BLOCKED_CONFIRMED','FALSE_POSITIVE')),
  reviewed_by_user_id TEXT,
  review_note TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 14. Regulatory Readiness Requirements (Uganda & EAC + Digital Asset Gate)
CREATE TABLE IF NOT EXISTS v30_regulatory_requirements (
  id TEXT PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  authority TEXT NOT NULL,
  framework_name TEXT NOT NULL,
  requirement_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  classification TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DESIGN_READY','SANDBOX_CONTROLLED','DOCUMENTATION_IN_PROGRESS','EXTERNAL_APPROVAL_REQUIRED','RESTRICTED_PENDING_REGULATORY_APPROVAL')),
  evidence_count INTEGER NOT NULL DEFAULT 0,
  honesty_disclosure TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Regulatory Evidence Artifacts
CREATE TABLE IF NOT EXISTS v30_regulatory_evidence (
  id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES v30_regulatory_requirements(id),
  document_title TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  submitted_by_user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','INTERNAL_REVIEW','VERIFIED_LOCAL')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Enhanced Wallet Card Controls (Non-Live Sandbox)
CREATE TABLE IF NOT EXISTS v30_wallet_card_profiles (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  tokenized_card_ref TEXT NOT NULL,
  daily_spend_limit_minor BIGINT NOT NULL CHECK (daily_spend_limit_minor >= 0),
  monthly_spend_limit_minor BIGINT NOT NULL CHECK (monthly_spend_limit_minor >= 0),
  international_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  online_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  frozen BOOLEAN NOT NULL DEFAULT FALSE,
  scheme_certified BOOLEAN NOT NULL DEFAULT FALSE,
  live_issuance_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_categories_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Business Financial Operations (Invoices, POs, Installments, Bulk Payout Batches)
CREATE TABLE IF NOT EXISTS v30_business_finance_docs (
  id TEXT PRIMARY KEY,
  doc_ref TEXT NOT NULL UNIQUE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('INVOICE','PURCHASE_ORDER','INSTALLMENT_PLAN','BULK_PAYOUT_BATCH')),
  organisation_id TEXT NOT NULL,
  requester_user_id TEXT NOT NULL,
  approver_user_id TEXT,
  counterparty_name TEXT NOT NULL,
  currency TEXT NOT NULL,
  total_minor BIGINT NOT NULL CHECK (total_minor > 0),
  tax_minor BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','PARTIALLY_PAID','SETTLED','REJECTED')),
  linked_payment_instruction_id TEXT,
  schedule_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Offline & USSD/SMS Adapter Sessions (Simulated Only)
CREATE TABLE IF NOT EXISTS v30_offline_ussd_sessions (
  id TEXT PRIMARY KEY,
  msisdn TEXT NOT NULL,
  dial_string TEXT NOT NULL,
  menu_step TEXT NOT NULL,
  action_intent TEXT NOT NULL,
  amount_minor BIGINT DEFAULT 0,
  currency TEXT DEFAULT 'UGX',
  queued_offline BOOLEAN NOT NULL DEFAULT TRUE,
  adapter_mode TEXT NOT NULL DEFAULT 'SIMULATED_USSD_ADAPTER',
  response_screen_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. AI Request & Quota Resilience Telemetry
CREATE TABLE IF NOT EXISTS v30_ai_request_metrics (
  id TEXT PRIMARY KEY,
  domain_task TEXT NOT NULL,
  model_name TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('LIVE_SUCCESS','CACHE_HIT','DEDUP_HIT','COOLDOWN_FALLBACK','QUOTA_429','AUTH_ERROR','UPSTREAM_5XX','TIMEOUT','BLOCKED_GUARDRAIL')),
  latency_ms INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  cooldown_active BOOLEAN NOT NULL DEFAULT FALSE,
  prompt_injection_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. System Repair Register & Git Sync Audit Events
CREATE TABLE IF NOT EXISTS v30_repair_register (
  id TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL','HIGH','MEDIUM','LOW')),
  symptom TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  fix_applied TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('VERIFIED_FIXED','OPEN','MONITORED')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v30_git_sync_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  commit_hash TEXT,
  local_git_ready BOOLEAN NOT NULL,
  remote_configured BOOLEAN NOT NULL,
  auth_verified BOOLEAN NOT NULL,
  push_verified BOOLEAN NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
