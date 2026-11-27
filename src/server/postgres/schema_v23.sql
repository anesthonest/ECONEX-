-- ECONEX V25.0 Continental Infrastructure, Cloud Transformation & Sovereign Economic Platform
-- PostgreSQL 16 Additive Schema Migration (Schema Version 23)
-- Developer: VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v25_schema_migrations (
  version INTEGER PRIMARY KEY,
  release_tag TEXT NOT NULL,
  ddl_checksum_sha256 TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_migration_locks (
  lock_name TEXT PRIMARY KEY,
  holder_run_id TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Layer 1: Enterprise Multi-Organisation Hierarchy & Governance
CREATE TABLE IF NOT EXISTS v25_organisations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  parent_organisation_id TEXT REFERENCES v25_organisations(id),
  country_code TEXT NOT NULL,
  default_currency TEXT NOT NULL DEFAULT 'UGX',
  owner_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING_REVIEW')),
  data_classification_default TEXT NOT NULL DEFAULT 'ORG_INTERNAL',
  compliance_tier TEXT NOT NULL DEFAULT 'USER_SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v25_orgs_tenant_country ON v25_organisations(tenant_id, country_code, status);

CREATE TABLE IF NOT EXISTS v25_business_units (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, code)
);

CREATE TABLE IF NOT EXISTS v25_branches (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  business_unit_id TEXT NOT NULL REFERENCES v25_business_units(id),
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  city_or_district TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organisation_id, code)
);

CREATE TABLE IF NOT EXISTS v25_departments (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  branch_id TEXT NOT NULL REFERENCES v25_branches(id),
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  cost_center_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_teams (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  department_id TEXT NOT NULL REFERENCES v25_departments(id),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  lead_user_id TEXT NOT NULL,
  member_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_org_memberships (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  member_role TEXT NOT NULL,
  allowed_branch_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_department_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_limit_minor BIGINT NOT NULL DEFAULT 0 CHECK (approval_limit_minor >= 0),
  delegated_by_user_id TEXT,
  delegation_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  is_active_context BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v25_memberships_user_org ON v25_org_memberships(user_id, organisation_id, status);

CREATE TABLE IF NOT EXISTS v25_role_permission_grants (
  id TEXT PRIMARY KEY,
  role_code TEXT NOT NULL,
  resource TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  require_mfa_for_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  require_same_organisation BOOLEAN NOT NULL DEFAULT TRUE,
  require_same_country BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL
);

-- Layer 2: Zero-Trust Identity, MFA, Devices & Session Rotation
CREATE TABLE IF NOT EXISTS v25_user_mfa_configs (
  user_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  method TEXT NOT NULL,
  secret_fingerprint TEXT NOT NULL,
  recovery_codes_remaining INTEGER NOT NULL DEFAULT 6,
  last_verified_at TIMESTAMPTZ,
  pending_challenge_id TEXT,
  pending_challenge_code_hash TEXT,
  pending_challenge_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_user_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_label TEXT NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  trusted BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  active_organisation_id TEXT NOT NULL,
  device_id TEXT NOT NULL REFERENCES v25_user_devices(id),
  token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  refresh_rotation_count INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT NOT NULL,
  country_code TEXT NOT NULL,
  suspicious_flag BOOLEAN NOT NULL DEFAULT FALSE,
  suspicious_reason TEXT,
  mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_v25_sessions_user_status ON v25_user_sessions(user_id, status);

-- Layer 3: Immutable Financial State Machine & Regulatory Limits
CREATE TABLE IF NOT EXISTS v25_ledger_transactions (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  from_euwn TEXT NOT NULL,
  to_euwn TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL,
  value_mode TEXT NOT NULL CHECK (value_mode = 'INTERNAL_SANDBOX_LEDGER'),
  real_value_settlement_claimed BOOLEAN NOT NULL DEFAULT FALSE CHECK (real_value_settlement_claimed = FALSE),
  state TEXT NOT NULL CHECK (state IN (
    'CREATED', 'VALIDATING', 'PENDING', 'APPROVED', 'POSTED',
    'REJECTED', 'FAILED', 'EXPIRED', 'CANCELLED', 'REVERSED', 'REFUNDED'
  )),
  requires_dual_approval BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_user_id TEXT,
  v23_transaction_id TEXT,
  spend_lock_acquired BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  state_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v25_ledger_org_country ON v25_ledger_transactions(organisation_id, country_code, state);

CREATE TABLE IF NOT EXISTS v25_regulatory_limit_rules (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  compliance_tier TEXT NOT NULL,
  single_tx_max_minor BIGINT NOT NULL CHECK (single_tx_max_minor > 0),
  daily_tx_max_minor BIGINT NOT NULL CHECK (daily_tx_max_minor >= single_tx_max_minor),
  dual_approval_threshold_minor BIGINT NOT NULL CHECK (dual_approval_threshold_minor > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Layer 4: Transactional Outbox, DLQ, Background Jobs & Hash-Chained Audit
CREATE TABLE IF NOT EXISTS v25_outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHED', 'CONSUMED', 'FAILED', 'DLQ')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  consumed_by_consumers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_dead_letter_events (
  id TEXT PRIMARY KEY,
  outbox_event_id TEXT NOT NULL REFERENCES v25_outbox_events(id),
  event_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  attempts_at_failure INTEGER NOT NULL,
  replayed BOOLEAN NOT NULL DEFAULT FALSE,
  replayed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_background_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  idempotency_lock_key TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRY_SCHEDULED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  ai_auto_approve_allowed BOOLEAN NOT NULL DEFAULT FALSE CHECK (ai_auto_approve_allowed = FALSE),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary TEXT,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v25_audit_trail (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  classification TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Layer 5: Developer Platform, APIs, Webhooks, Country Engine & FX
CREATE TABLE IF NOT EXISTS v25_api_applications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  environment TEXT NOT NULL CHECK (environment = 'SANDBOX'),
  owner_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  rate_limit_per_min INTEGER NOT NULL DEFAULT 120,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_scoped_api_keys (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES v25_api_applications(id),
  organisation_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  label TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash_sha256 TEXT NOT NULL UNIQUE,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  environment TEXT NOT NULL CHECK (environment = 'SANDBOX'),
  secret_displayed_once_at_creation BOOLEAN NOT NULL DEFAULT TRUE,
  secret_retrievable_after_creation BOOLEAN NOT NULL DEFAULT FALSE CHECK (secret_retrievable_after_creation = FALSE),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v25_webhook_endpoints (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES v25_api_applications(id),
  organisation_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  target_url TEXT NOT NULL,
  event_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  signing_secret_hash TEXT NOT NULL,
  signing_secret_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_webhook_deliveries (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT NOT NULL REFERENCES v25_webhook_endpoints(id),
  outbox_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  signature_hmac_sha256 TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  response_code INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_external_adapters (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  adapter_state TEXT NOT NULL,
  live_production_enabled BOOLEAN NOT NULL DEFAULT FALSE CHECK (live_production_enabled = FALSE),
  required_env_vars JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_health_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS v25_country_profiles (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  region_bloc TEXT NOT NULL,
  default_currency TEXT NOT NULL,
  supported_currencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  vat_standard_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  regulatory_authority_note TEXT NOT NULL,
  payment_rails_configured JSONB NOT NULL DEFAULT '[]'::jsonb,
  readiness_status TEXT NOT NULL,
  activated BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_user_id TEXT,
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_country_readiness_reports (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL REFERENCES v25_country_profiles(country_code),
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score_pct NUMERIC(5,2) NOT NULL,
  ready_for_controlled_activation BOOLEAN NOT NULL DEFAULT FALSE,
  live_external_rails_connected BOOLEAN NOT NULL DEFAULT FALSE CHECK (live_external_rails_connected = FALSE),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_fx_quotes (
  id TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  rate_numeric NUMERIC(18,8) NOT NULL CHECK (rate_numeric > 0),
  inverse_rate_numeric NUMERIC(18,8) NOT NULL CHECK (inverse_rate_numeric > 0),
  quote_type TEXT NOT NULL CHECK (quote_type IN ('INDICATIVE', 'EXECUTABLE')),
  rate_source TEXT NOT NULL,
  rate_timestamp TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  spread_bps INTEGER NOT NULL DEFAULT 0,
  silent_conversion_forbidden BOOLEAN NOT NULL DEFAULT TRUE CHECK (silent_conversion_forbidden = TRUE),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'EXECUTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_fx_clearing_records (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES v25_fx_quotes(id),
  organisation_id TEXT NOT NULL,
  source_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  source_amount_minor BIGINT NOT NULL CHECK (source_amount_minor > 0),
  target_amount_minor BIGINT NOT NULL CHECK (target_amount_minor > 0),
  rate_applied NUMERIC(18,8) NOT NULL,
  clearing_fee_minor BIGINT NOT NULL DEFAULT 0,
  reconciled BOOLEAN NOT NULL DEFAULT TRUE,
  executed_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Layer 6: Private Document Vault, Security Incidents, 5-Tier Compliance, Commercial Plans & Migration/DR Telemetry
CREATE TABLE IF NOT EXISTS v25_vault_documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  classification TEXT NOT NULL,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  storage_relative_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256_checksum TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id TEXT,
  malware_scan_status TEXT NOT NULL,
  retention_policy_days INTEGER NOT NULL DEFAULT 2555,
  retention_expires_at TIMESTAMPTZ NOT NULL,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_vault_access_logs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES v25_vault_documents(id),
  actor_user_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT,
  actor_user_id TEXT,
  source_ip TEXT NOT NULL,
  summary TEXT NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_security_incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'DETECTION', 'CLASSIFICATION', 'CONTAINMENT', 'INVESTIGATION', 'RECOVERY', 'POST_INCIDENT_REVIEW'
  )),
  related_event_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  affected_organisation_id TEXT,
  containment_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_responder_user_id TEXT NOT NULL,
  post_mortem_summary TEXT,
  stage_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_compliance_records (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('INDIVIDUAL', 'ORGANISATION')),
  subject_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  verification_category TEXT NOT NULL CHECK (verification_category IN ('KYC', 'KYB', 'SANCTIONS_AML', 'TAX_CLEARANCE')),
  tier TEXT NOT NULL CHECK (tier IN (
    'USER_SUBMITTED', 'AUTO_VALIDATED', 'THIRD_PARTY_VERIFIED', 'HUMAN_REVIEWED', 'GOVERNMENT_VERIFIED'
  )),
  evidence_summary TEXT NOT NULL,
  vault_document_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  sanctions_screening_status TEXT NOT NULL,
  reviewed_by_user_id TEXT,
  review_notes TEXT,
  government_registry_authority TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_platform_plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  monthly_price_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  included_api_requests_per_month INTEGER NOT NULL,
  included_branches INTEGER NOT NULL,
  included_vault_mb INTEGER NOT NULL,
  wallet_balance_separated BOOLEAN NOT NULL DEFAULT TRUE CHECK (wallet_balance_separated = TRUE),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS v25_org_subscriptions (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  plan_id TEXT NOT NULL REFERENCES v25_platform_plans(id),
  status TEXT NOT NULL,
  billing_cycle_start TIMESTAMPTZ NOT NULL,
  billing_cycle_end TIMESTAMPTZ NOT NULL,
  api_usage_count INTEGER NOT NULL DEFAULT 0,
  wallet_balance_separated BOOLEAN NOT NULL DEFAULT TRUE CHECK (wallet_balance_separated = TRUE),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_platform_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  organisation_id TEXT NOT NULL REFERENCES v25_organisations(id),
  subscription_id TEXT NOT NULL REFERENCES v25_org_subscriptions(id),
  plan_id TEXT NOT NULL REFERENCES v25_platform_plans(id),
  amount_minor BIGINT NOT NULL,
  tax_minor BIGINT NOT NULL,
  total_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  wallet_balance_separated BOOLEAN NOT NULL DEFAULT TRUE CHECK (wallet_balance_separated = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_pg_migration_runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  pg_configured BOOLEAN NOT NULL,
  active_authority_after_run TEXT NOT NULL,
  schema_target INTEGER NOT NULL DEFAULT 23,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  currency_reconciliation JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_records_audited INTEGER NOT NULL,
  zero_variance_verified BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS v25_backup_drills (
  id TEXT PRIMARY KEY,
  source_file TEXT NOT NULL,
  backup_file TEXT NOT NULL,
  backup_bytes BIGINT NOT NULL,
  backup_checksum_sha256 TEXT NOT NULL,
  restore_verification_passed BOOLEAN NOT NULL,
  measured_rpo_seconds INTEGER NOT NULL,
  measured_rto_ms INTEGER NOT NULL,
  financial_totals_matched BOOLEAN NOT NULL,
  executed_by_user_id TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v25_load_benchmarks (
  id TEXT PRIMARY KEY,
  concurrency INTEGER NOT NULL,
  total_requests INTEGER NOT NULL,
  succeeded_requests INTEGER NOT NULL,
  failed_requests INTEGER NOT NULL,
  total_duration_ms INTEGER NOT NULL,
  measured_rps NUMERIC(10,2) NOT NULL,
  p50_latency_ms NUMERIC(10,2) NOT NULL,
  p95_latency_ms NUMERIC(10,2) NOT NULL,
  p99_latency_ms NUMERIC(10,2) NOT NULL,
  memory_rss_mb NUMERIC(10,2) NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
