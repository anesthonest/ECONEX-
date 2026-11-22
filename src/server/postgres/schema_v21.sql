-- ECONEX V23.0 Additive PostgreSQL 16 Schema Migration (Schema Version 21)
-- Universal Economic Identity, Wallet Network & Card Infrastructure
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v23_participant_identities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  category TEXT NOT NULL,
  authorized_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  email_masked TEXT NOT NULL,
  phone_masked TEXT NOT NULL,
  phone_hash TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  active_country_context TEXT NOT NULL DEFAULT 'UG',
  district_or_city TEXT NOT NULL,
  identity_verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  business_verification_status TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
  account_status TEXT NOT NULL DEFAULT 'ACTIVE',
  status_reason TEXT,
  device_fingerprint_hash TEXT NOT NULL,
  recovery_email_hint TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_lock_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v23_identities_tenant_status ON v23_participant_identities(tenant_id, account_status, country_code);

CREATE TABLE IF NOT EXISTS v23_wallet_number_allocations (
  id TEXT PRIMARY KEY,
  euwn TEXT NOT NULL UNIQUE CHECK (euwn ~ '^EX-[A-Z0-9]{12}$'),
  participant_identity_id TEXT NOT NULL REFERENCES v23_participant_identities(id),
  wallet_account_id TEXT NOT NULL UNIQUE,
  wallet_category TEXT NOT NULL,
  permanent BOOLEAN NOT NULL DEFAULT TRUE,
  reassigned BOOLEAN NOT NULL DEFAULT FALSE CHECK (reassigned = FALSE),
  country_independent BOOLEAN NOT NULL DEFAULT TRUE,
  phone_change_count INTEGER NOT NULL DEFAULT 0,
  device_migration_count INTEGER NOT NULL DEFAULT 0,
  travel_country_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_wallet_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  participant_identity_id TEXT NOT NULL REFERENCES v23_participant_identities(id),
  euwn TEXT NOT NULL UNIQUE REFERENCES v23_wallet_number_allocations(euwn),
  wallet_category TEXT NOT NULL CHECK (wallet_category IN ('INDIVIDUAL', 'BUSINESS', 'COOPERATIVE', 'INSTITUTIONAL')),
  label TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  status_reason TEXT,
  owner_user_id TEXT NOT NULL,
  linked_entity_id TEXT,
  staff_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  dual_approval_threshold_minor BIGINT NOT NULL DEFAULT 0,
  primary_country_code TEXT NOT NULL DEFAULT 'UG',
  active_country_code TEXT NOT NULL DEFAULT 'UG',
  pin_hash TEXT NOT NULL DEFAULT '',
  pin_salt TEXT NOT NULL DEFAULT '',
  pin_set BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  new_device_restricted_until TIMESTAMPTZ,
  daily_limit_minor_by_currency JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_test_mode BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v23_wallets_owner ON v23_wallet_accounts(tenant_id, owner_user_id, wallet_category);

CREATE TABLE IF NOT EXISTS v23_currency_subaccounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_account_id TEXT NOT NULL REFERENCES v23_wallet_accounts(id),
  euwn TEXT NOT NULL REFERENCES v23_wallet_accounts(euwn),
  currency TEXT NOT NULL CHECK (currency IN ('UGX', 'KES', 'TZS', 'RWF', 'BIF', 'SSP', 'CDF', 'USD', 'EUR')),
  minor_unit_scale INTEGER NOT NULL DEFAULT 100,
  available_minor BIGINT NOT NULL DEFAULT 0 CHECK (available_minor >= 0),
  pending_minor BIGINT NOT NULL DEFAULT 0 CHECK (pending_minor >= 0),
  reserved_minor BIGINT NOT NULL DEFAULT 0 CHECK (reserved_minor >= 0),
  restricted_minor BIGINT NOT NULL DEFAULT 0 CHECK (restricted_minor >= 0),
  reversed_minor BIGINT NOT NULL DEFAULT 0 CHECK (reversed_minor >= 0),
  test_only_balance_minor BIGINT NOT NULL DEFAULT 0,
  ledger_account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wallet_account_id, currency)
);

CREATE TABLE IF NOT EXISTS v23_country_operating_profiles (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  regional_bloc TEXT NOT NULL,
  country_activation_status TEXT NOT NULL DEFAULT 'NOT_ACTIVATED',
  operational_availability_status TEXT NOT NULL DEFAULT 'SANDBOX_ONLY_NOT_LIVE',
  sandbox_wallet_available BOOLEAN NOT NULL DEFAULT TRUE,
  supported_currencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_currency TEXT NOT NULL,
  local_wallet_eligibility_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  permitted_transaction_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  per_tx_limit_minor JSONB NOT NULL DEFAULT '{}'::jsonb,
  daily_limit_minor JSONB NOT NULL DEFAULT '{}'::jsonb,
  fee_schedule_summary TEXT NOT NULL,
  tax_and_reporting_notes TEXT NOT NULL,
  local_dispute_procedure TEXT NOT NULL,
  card_permissions TEXT NOT NULL DEFAULT 'SANDBOX_SIMULATION_ONLY',
  withdrawal_permissions TEXT NOT NULL DEFAULT 'DISABLED_PENDING_LICENCE',
  regulatory_status TEXT NOT NULL,
  regulatory_authority_ref TEXT NOT NULL,
  customer_protection_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_handling_rules TEXT NOT NULL,
  activation_gates JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_wallet_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  tx_reference TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  tx_type TEXT NOT NULL,
  status TEXT NOT NULL,
  source_wallet_id TEXT NOT NULL REFERENCES v23_wallet_accounts(id),
  source_euwn TEXT NOT NULL,
  source_subaccount_id TEXT NOT NULL REFERENCES v23_currency_subaccounts(id),
  source_currency TEXT NOT NULL,
  source_amount_minor BIGINT NOT NULL CHECK (source_amount_minor >= 0),
  fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (fee_minor >= 0),
  fee_currency TEXT NOT NULL,
  destination_wallet_id TEXT NOT NULL REFERENCES v23_wallet_accounts(id),
  destination_euwn TEXT NOT NULL,
  destination_subaccount_id TEXT NOT NULL REFERENCES v23_currency_subaccounts(id),
  destination_currency TEXT NOT NULL,
  destination_amount_minor BIGINT NOT NULL CHECK (destination_amount_minor >= 0),
  fx_applied BOOLEAN NOT NULL DEFAULT FALSE,
  fx_rate_applied NUMERIC(18, 6) NOT NULL DEFAULT 1,
  fx_rate_source TEXT NOT NULL,
  fx_rate_timestamp TIMESTAMPTZ NOT NULL,
  fx_rate_classification TEXT NOT NULL,
  fx_user_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  source_country_code TEXT NOT NULL,
  destination_country_code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  settlement_classification TEXT NOT NULL DEFAULT 'SANDBOX_INTERNAL_LEDGER',
  is_test_transaction BOOLEAN NOT NULL DEFAULT TRUE,
  linked_module_ref JSONB,
  journal_entry_id TEXT,
  reversed_by_transaction_id TEXT,
  parent_transaction_id TEXT,
  refunded_minor_total BIGINT NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_required BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_user_id TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v23_tx_wallets ON v23_wallet_transactions(tenant_id, source_wallet_id, destination_wallet_id, status);

CREATE TABLE IF NOT EXISTS v23_ledger_postings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL REFERENCES v23_wallet_transactions(id),
  tx_reference TEXT NOT NULL,
  journal_entry_id TEXT NOT NULL,
  lines JSONB NOT NULL,
  total_debit_minor BIGINT NOT NULL,
  total_credit_minor BIGINT NOT NULL CHECK (total_credit_minor = total_debit_minor),
  balanced BOOLEAN NOT NULL DEFAULT TRUE CHECK (balanced = TRUE),
  immutable BOOLEAN NOT NULL DEFAULT TRUE CHECK (immutable = TRUE),
  posting_hash_sha256 TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_merchant_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_account_id TEXT NOT NULL REFERENCES v23_wallet_accounts(id),
  euwn TEXT NOT NULL REFERENCES v23_wallet_accounts(euwn),
  merchant_name TEXT NOT NULL,
  sector_code TEXT NOT NULL,
  country_code TEXT NOT NULL,
  district_or_city TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE_SANDBOX',
  suspension_reason TEXT,
  per_tx_limit_minor BIGINT NOT NULL,
  daily_limit_minor BIGINT NOT NULL,
  accepted_currencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  sandbox_volume_minor_by_currency JSONB NOT NULL DEFAULT '{}'::jsonb,
  sandbox_tx_count INTEGER NOT NULL DEFAULT 0,
  sandbox_refund_count INTEGER NOT NULL DEFAULT 0,
  mode_label TEXT NOT NULL DEFAULT 'SANDBOX_TEST_MODE_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_merchant_terminals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  merchant_id TEXT NOT NULL REFERENCES v23_merchant_accounts(id),
  terminal_code TEXT NOT NULL UNIQUE,
  terminal_type TEXT NOT NULL,
  label TEXT NOT NULL,
  location_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_qr_payment_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  payment_reference TEXT NOT NULL UNIQUE,
  merchant_id TEXT NOT NULL REFERENCES v23_merchant_accounts(id),
  merchant_name TEXT NOT NULL,
  merchant_euwn TEXT NOT NULL,
  terminal_id TEXT NOT NULL REFERENCES v23_merchant_terminals(id),
  qr_kind TEXT NOT NULL CHECK (qr_kind IN ('STATIC', 'DYNAMIC')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL,
  fee_preview_minor BIGINT NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  country_code TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_signature_sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  linked_transaction_id TEXT,
  receipt_number TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  mode_label TEXT NOT NULL DEFAULT 'SANDBOX_TEST_MODE_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_virtual_cards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_account_id TEXT NOT NULL REFERENCES v23_wallet_accounts(id),
  euwn TEXT NOT NULL,
  participant_identity_id TEXT NOT NULL REFERENCES v23_participant_identities(id),
  cardholder_name TEXT NOT NULL,
  tokenized_card_ref TEXT NOT NULL UNIQUE,
  masked_pan TEXT NOT NULL,
  expiry_placeholder TEXT NOT NULL,
  card_status TEXT NOT NULL,
  allowed_currencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_mccs JSONB NOT NULL DEFAULT '[]'::jsonb,
  per_tx_limit_minor BIGINT NOT NULL,
  daily_limit_minor BIGINT NOT NULL,
  online_payments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  contactless_configured BOOLEAN NOT NULL DEFAULT FALSE,
  test_mode BOOLEAN NOT NULL DEFAULT TRUE,
  external_network_usable BOOLEAN NOT NULL DEFAULT FALSE CHECK (external_network_usable = FALSE),
  non_issuance_notice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_physical_cards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_account_id TEXT NOT NULL REFERENCES v23_wallet_accounts(id),
  euwn TEXT NOT NULL,
  participant_identity_id TEXT NOT NULL REFERENCES v23_participant_identities(id),
  cardholder_name TEXT NOT NULL,
  tokenized_card_ref TEXT NOT NULL UNIQUE,
  masked_pan TEXT NOT NULL,
  stage TEXT NOT NULL,
  card_status TEXT NOT NULL,
  emv_chip_configured BOOLEAN NOT NULL DEFAULT TRUE,
  contactless_configured BOOLEAN NOT NULL DEFAULT TRUE,
  atm_interface_status TEXT NOT NULL DEFAULT 'INACTIVE_NOT_LIVE',
  issuer_interface_status TEXT NOT NULL DEFAULT 'INACTIVE_PENDING_PARTNER_AND_LICENCE',
  acquirer_interface_status TEXT NOT NULL DEFAULT 'INACTIVE_SANDBOX_ONLY',
  scheme_certified BOOLEAN NOT NULL DEFAULT FALSE CHECK (scheme_certified = FALSE),
  physical_card_live_issued BOOLEAN NOT NULL DEFAULT FALSE CHECK (physical_card_live_issued = FALSE),
  dispatch_tracking_ref TEXT,
  delivery_country_code TEXT NOT NULL,
  delivery_district TEXT NOT NULL,
  pin_configured_hash TEXT,
  non_certification_notice TEXT NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_compliance_reviews (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  review_type TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  automated_recommendation TEXT NOT NULL,
  human_decision TEXT NOT NULL,
  requires_human_review BOOLEAN NOT NULL DEFAULT TRUE,
  reviewed_by_user_id TEXT,
  decision_reason TEXT,
  appeal_notes TEXT,
  live_screening_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  screening_notice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_risk_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  wallet_account_id TEXT,
  transaction_id TEXT,
  event_kind TEXT NOT NULL,
  severity TEXT NOT NULL,
  details TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_reconciliation_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  status TEXT NOT NULL,
  journal_balanced BOOLEAN NOT NULL,
  total_subaccounts_checked INTEGER NOT NULL,
  total_postings_checked INTEGER NOT NULL,
  imbalance_count INTEGER NOT NULL,
  exceptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  executed_by TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_wallet_audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_fee_configurations (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL,
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  participant_category TEXT NOT NULL,
  flat_fee_minor BIGINT NOT NULL DEFAULT 0,
  percent_bps INTEGER NOT NULL DEFAULT 0,
  min_fee_minor BIGINT NOT NULL DEFAULT 0,
  max_fee_minor BIGINT NOT NULL DEFAULT 0,
  classification TEXT NOT NULL DEFAULT 'CONFIGURABLE_SANDBOX_SCHEDULE',
  active_revenue_recognized_minor BIGINT NOT NULL DEFAULT 0,
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_support_dispute_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  case_reference TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  participant_identity_id TEXT NOT NULL,
  wallet_account_id TEXT,
  linked_transaction_id TEXT,
  assigned_support_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  summary TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  escalation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  closure_reason TEXT,
  consumer_protection_notice TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_offline_queue_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  client_draft_id TEXT NOT NULL UNIQUE,
  source_wallet_id TEXT NOT NULL,
  recipient_euwn TEXT NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL,
  country_code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'QUEUED_LOCAL',
  linked_transaction_id TEXT,
  conflict_or_reject_reason TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v23_integration_interfaces (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  country_code TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
  live_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  provider_placeholder TEXT NOT NULL,
  regulatory_prereq TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_reversals_or_refunds (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  original_transaction_id TEXT NOT NULL REFERENCES v23_wallet_transactions(id),
  refund_transaction_id TEXT NOT NULL REFERENCES v23_wallet_transactions(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL,
  reason TEXT NOT NULL,
  merchant_id TEXT,
  approved_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v23_postgres_migrations (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  database_url_configured BOOLEAN NOT NULL DEFAULT FALSE,
  active_authority TEXT NOT NULL DEFAULT 'LOCAL_JSON_WAL_AUTHORITATIVE',
  postgres_cutover_complete BOOLEAN NOT NULL DEFAULT FALSE,
  schema_version_target INTEGER NOT NULL DEFAULT 21,
  collections_audited INTEGER NOT NULL,
  mapped_tables_count INTEGER NOT NULL,
  collection_mappings JSONB NOT NULL,
  unique_euwn_verified BOOLEAN NOT NULL,
  unique_tx_ref_verified BOOLEAN NOT NULL,
  rollback_verified BOOLEAN NOT NULL,
  ledger_balanced_before BOOLEAN NOT NULL,
  ledger_balanced_after BOOLEAN NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS v23_continuity_runs (
  id TEXT PRIMARY KEY,
  scenario_code TEXT NOT NULL,
  scenario_title TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  expected_transaction_state TEXT NOT NULL,
  observed_transaction_state TEXT NOT NULL,
  recovery_procedure TEXT NOT NULL,
  audit_evidence_id TEXT NOT NULL,
  user_facing_outcome TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
