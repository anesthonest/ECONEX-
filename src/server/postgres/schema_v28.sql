-- ECONEX V31.0 — Sovereign Data Infrastructure, Financial Connectivity & Continental Deployment Readiness
-- PostgreSQL 16 Additive Schema Migration (Schema Version 28)
-- Local JSON WAL remains fail-closed authoritative until hosted PostgreSQL cutover is verified.
-- All monetary quantities use integer minor units (BIGINT).
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v31_schema_migrations (
  version INTEGER PRIMARY KEY,
  release_tag TEXT NOT NULL,
  ddl_checksum_sha256 TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Sovereign PostgreSQL Migration Runs
CREATE TABLE IF NOT EXISTS v31_database_migration_runs (
  id TEXT PRIMARY KEY,
  schema_from INTEGER NOT NULL,
  schema_to INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('DRY_RUN_REHEARSAL','LIVE_POSTGRES_MIGRATION')),
  pg_configured BOOLEAN NOT NULL DEFAULT FALSE,
  pg_live_connected BOOLEAN NOT NULL DEFAULT FALSE,
  pg_target_redacted TEXT NOT NULL,
  active_authority_after_run TEXT NOT NULL CHECK (active_authority_after_run IN ('LOCAL_JSON_WAL_AUTHORITATIVE','POSTGRESQL_16_AUTHORITATIVE')),
  migration_lock_acquired BOOLEAN NOT NULL DEFAULT TRUE,
  v30_backup_checksum_sha256 TEXT NOT NULL,
  interrupted_recovery_tested BOOLEAN NOT NULL DEFAULT FALSE,
  stages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_source_records INTEGER NOT NULL DEFAULT 0,
  total_target_records INTEGER NOT NULL DEFAULT 0,
  ledger_variance_minor BIGINT NOT NULL DEFAULT 0,
  parity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('COMPLETED_DRY_RUN','COMPLETED_LIVE_PG','RECOVERED','FAILED')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL
);

-- 2. Database Integrity Checks
CREATE TABLE IF NOT EXISTS v31_database_integrity_checks (
  id TEXT PRIMARY KEY,
  check_scope TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  expected_count INTEGER NOT NULL,
  observed_count INTEGER NOT NULL,
  variance_minor BIGINT NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL,
  details TEXT NOT NULL,
  checked_by_user_id TEXT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Database Backup & Restore Drills
CREATE TABLE IF NOT EXISTS v31_database_backup_records (
  id TEXT PRIMARY KEY,
  backup_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  bytes BIGINT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  restore_drill_executed BOOLEAN NOT NULL DEFAULT FALSE,
  measured_restore_duration_ms INTEGER NOT NULL DEFAULT 0,
  verified_integrity BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Country Data Residency Policies
CREATE TABLE IF NOT EXISTS v31_data_residency_policies (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  jurisdiction_name TEXT NOT NULL,
  primary_storage_region TEXT NOT NULL,
  residency_mode TEXT NOT NULL CHECK (residency_mode IN ('LOCAL_PRIMARY_REQUIRED','REGIONAL_MIRROR_ALLOWED','CROSS_BORDER_CONSENT_ONLY')),
  pii_export_blocked_by_default BOOLEAN NOT NULL DEFAULT TRUE,
  encryption_at_rest_standard TEXT NOT NULL DEFAULT 'AES-256-GCM',
  retention_days_financial INTEGER NOT NULL DEFAULT 2555,
  retention_days_audit INTEGER NOT NULL DEFAULT 3650,
  legal_hold_override_blocked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Continental Country Operating Profiles
CREATE TABLE IF NOT EXISTS v31_country_operating_profiles (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  region_bloc TEXT NOT NULL,
  default_currency TEXT NOT NULL,
  minor_unit_scale INTEGER NOT NULL DEFAULT 100,
  vat_standard_rate_pct NUMERIC(6,2) NOT NULL DEFAULT 18.0,
  withholding_tax_pct NUMERIC(6,2) NOT NULL DEFAULT 6.0,
  mobile_money_rails_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  bank_settlement_rails_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ussd_short_code_pattern TEXT NOT NULL,
  kyc_tier_count INTEGER NOT NULL DEFAULT 3,
  privacy_law_reference TEXT NOT NULL,
  regulatory_authority TEXT NOT NULL,
  residency_policy_id TEXT REFERENCES v31_data_residency_policies(id),
  operating_mode TEXT NOT NULL,
  live_payments_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. External Provider Certification Lifecycle Runs
CREATE TABLE IF NOT EXISTS v31_provider_certification_runs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  current_stage TEXT NOT NULL CHECK (current_stage IN (
    'DISCOVERED','REGISTERED','DOCUMENTED','CONFIGURED','AUTHENTICATED',
    'SANDBOX_TESTED','CERTIFICATION_REVIEW','APPROVED','LIVE_VERIFIED'
  )),
  sandbox_only BOOLEAN NOT NULL DEFAULT TRUE,
  credentials_configured BOOLEAN NOT NULL DEFAULT FALSE,
  partner_approved BOOLEAN NOT NULL DEFAULT FALSE,
  regulatory_approved BOOLEAN NOT NULL DEFAULT FALSE,
  live_verified BOOLEAN NOT NULL DEFAULT FALSE,
  checks_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  pass_rate_pct INTEGER NOT NULL DEFAULT 0,
  avg_measured_latency_ms INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  audited_by_user_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Integration Credentials Metadata (Zero Raw Secrets)
CREATE TABLE IF NOT EXISTS v31_integration_credentials_metadata (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('DEV','TEST','STAGING','PROD')),
  auth_scheme TEXT NOT NULL,
  secret_reference_key TEXT NOT NULL,
  redacted_fingerprint TEXT NOT NULL,
  rotation_interval_days INTEGER NOT NULL DEFAULT 90,
  last_rotated_at TIMESTAMPTZ NOT NULL,
  next_rotation_due_at TIMESTAMPTZ NOT NULL,
  present_in_runtime_env BOOLEAN NOT NULL DEFAULT FALSE,
  live_activation_permitted BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Integration Health & Error History
CREATE TABLE IF NOT EXISTS v31_integration_health_history (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('SANDBOX_ADAPTER','LIVE_EXTERNAL')),
  probe_status TEXT NOT NULL CHECK (probe_status IN ('HEALTHY','DEGRADED','DOWN','UNCONFIGURED')),
  measured_latency_ms INTEGER NOT NULL DEFAULT 0,
  error_rate_bps INTEGER NOT NULL DEFAULT 0,
  circuit_breaker_state TEXT NOT NULL CHECK (circuit_breaker_state IN ('CLOSED','OPEN','HALF_OPEN')),
  measured_note TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Institutional Organizations
CREATE TABLE IF NOT EXISTS v31_institutional_organizations (
  id TEXT PRIMARY KEY,
  org_code TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  country_code TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  tax_id_number TEXT NOT NULL,
  kyb_tier TEXT NOT NULL,
  active_branch_count INTEGER NOT NULL DEFAULT 1,
  default_currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Organization Branches
CREATE TABLE IF NOT EXISTS v31_organization_branches (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v31_institutional_organizations(id),
  branch_code TEXT NOT NULL UNIQUE,
  branch_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  city_or_district TEXT NOT NULL,
  branch_manager_user_id TEXT NOT NULL,
  cash_float_limit_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Organization Departments
CREATE TABLE IF NOT EXISTS v31_organization_departments (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v31_institutional_organizations(id),
  branch_id TEXT NOT NULL REFERENCES v31_organization_branches(id),
  department_code TEXT NOT NULL UNIQUE,
  department_name TEXT NOT NULL,
  cost_center_code TEXT NOT NULL,
  head_user_id TEXT NOT NULL,
  annual_budget_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Enterprise Approval & SoD Policies
CREATE TABLE IF NOT EXISTS v31_enterprise_approval_policies (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES v31_institutional_organizations(id),
  policy_name TEXT NOT NULL,
  workflow_domain TEXT NOT NULL,
  currency TEXT NOT NULL,
  level1_threshold_minor BIGINT NOT NULL,
  level2_threshold_minor BIGINT NOT NULL,
  dual_approval_threshold_minor BIGINT NOT NULL,
  requester_cannot_approve BOOLEAN NOT NULL DEFAULT TRUE,
  coi_disclosure_required BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Enterprise Commercial Workflow Cases
CREATE TABLE IF NOT EXISTS v31_commercial_workflow_cases (
  id TEXT PRIMARY KEY,
  case_ref TEXT NOT NULL UNIQUE,
  organisation_id TEXT NOT NULL REFERENCES v31_institutional_organizations(id),
  branch_id TEXT NOT NULL REFERENCES v31_organization_branches(id),
  department_id TEXT NOT NULL REFERENCES v31_organization_departments(id),
  requester_user_id TEXT NOT NULL,
  approver1_user_id TEXT,
  approver2_user_id TEXT,
  supplier_name TEXT NOT NULL,
  description TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  stage TEXT NOT NULL,
  linked_payment_instruction_id TEXT,
  audit_events_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Pilot Programs (Uganda 9-Stage Acceptance-Gated)
CREATE TABLE IF NOT EXISTS v31_pilot_programs (
  id TEXT PRIMARY KEY,
  program_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  country_code TEXT NOT NULL,
  target_districts_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_stage_number INTEGER NOT NULL CHECK (current_stage_number BETWEEN 1 AND 9),
  stage_name TEXT NOT NULL,
  pilot_status TEXT NOT NULL,
  live_pilot_active BOOLEAN NOT NULL DEFAULT FALSE,
  stage_gates_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Pilot Participants
CREATE TABLE IF NOT EXISTS v31_pilot_participants (
  id TEXT PRIMARY KEY,
  pilot_program_id TEXT NOT NULL REFERENCES v31_pilot_programs(id),
  participant_name TEXT NOT NULL,
  role_category TEXT NOT NULL,
  district TEXT NOT NULL,
  country_code TEXT NOT NULL,
  onboarding_mode TEXT NOT NULL,
  ussd_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_level TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Field Validation Records
CREATE TABLE IF NOT EXISTS v31_field_validation_records (
  id TEXT PRIMARY KEY,
  pilot_program_id TEXT NOT NULL REFERENCES v31_pilot_programs(id),
  district TEXT NOT NULL,
  validation_type TEXT NOT NULL,
  submitted_by_user_id TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  validation_outcome TEXT NOT NULL,
  human_field_signoff_completed BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Pilot Incidents
CREATE TABLE IF NOT EXISTS v31_pilot_incidents (
  id TEXT PRIMARY KEY,
  pilot_program_id TEXT NOT NULL REFERENCES v31_pilot_programs(id),
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  mitigation_plan TEXT NOT NULL,
  status TEXT NOT NULL,
  reported_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 18. Production Security Incidents
CREATE TABLE IF NOT EXISTS v31_security_incidents (
  id TEXT PRIMARY KEY,
  incident_ref TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DETECTED','CONTAINED','INVESTIGATING','REMEDIATED','CLOSED')),
  containment_action TEXT NOT NULL,
  detected_by_user_id TEXT NOT NULL,
  remediated_by_user_id TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remediated_at TIMESTAMPTZ
);

-- 19. Deployment & Release Verification Records
CREATE TABLE IF NOT EXISTS v31_deployment_records (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL CHECK (environment IN ('DEV','TEST','STAGING','PROD')),
  release_tag TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  target_host_description TEXT NOT NULL,
  database_authority TEXT NOT NULL,
  status TEXT NOT NULL,
  deployed_by_user_id TEXT NOT NULL,
  git_commit_short TEXT,
  notes TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v31_release_verification_records (
  id TEXT PRIMARY KEY,
  release_tag TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  v31_tests_passed INTEGER NOT NULL,
  v31_tests_total INTEGER NOT NULL,
  regression_passed INTEGER NOT NULL,
  security_scan_passed BOOLEAN NOT NULL,
  build_chunk_warning_cleared BOOLEAN NOT NULL,
  export_archive_sha256 TEXT,
  verified_by_user_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Continental Analytics Snapshots (Privacy-Protected k>=3)
CREATE TABLE IF NOT EXISTS v31_continental_analytics_snapshots (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  sector_code TEXT NOT NULL,
  corridor_code TEXT NOT NULL,
  participant_cluster_count INTEGER NOT NULL CHECK (participant_cluster_count >= 3),
  k_anonymity_enforced BOOLEAN NOT NULL DEFAULT TRUE,
  indicative_volume_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  avg_corridor_settlement_minutes INTEGER NOT NULL DEFAULT 0,
  provenance_category TEXT NOT NULL,
  limitations_note TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
