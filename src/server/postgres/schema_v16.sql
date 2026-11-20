-- ECONEX V16.0 PostgreSQL 16 Production Schema Extension (Extends schema_v13.sql, schema_v14.sql & schema_v15.sql)
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
-- Normalized relational tables, foreign keys, CHECK invariants, indexes, and zero plaintext secret storage.

CREATE SCHEMA IF NOT EXISTS v16_prod;

-- 1. Deployment Environments & Secret Reference Metadata (no plaintext secrets stored)
CREATE TABLE IF NOT EXISTS v16_prod.deployment_environments (
  id TEXT PRIMARY KEY,
  environment TEXT NOT NULL UNIQUE CHECK (environment IN ('DEVELOPMENT', 'AUTOMATED_TESTING', 'STAGING', 'INTEGRATION_TESTING', 'CONTROLLED_PILOT', 'PRODUCTION')),
  config_version TEXT NOT NULL,
  database_target_label TEXT NOT NULL,
  provider_endpoint_scope TEXT NOT NULL,
  secret_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  cross_env_production_cred_blocked BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. V15-to-V16 Migration Checkpoints & Explicit Migration Exceptions
CREATE TABLE IF NOT EXISTS v16_prod.migration_checkpoints (
  id TEXT PRIMARY KEY,
  from_schema_version INTEGER NOT NULL,
  to_schema_version INTEGER NOT NULL CHECK (to_schema_version >= 16),
  target_engine TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'DRY_RUN_VALIDATED', 'COMPLETED', 'RECOVERED', 'FAILED', 'ROLLED_BACK')),
  backup_file_path TEXT NOT NULL,
  backup_checksum_sha256 TEXT NOT NULL,
  migration_checksum_sha256 TEXT NOT NULL,
  pre_counts_json JSONB NOT NULL,
  post_counts_json JSONB NOT NULL,
  exceptions_count INTEGER NOT NULL DEFAULT 0 CHECK (exceptions_count >= 0),
  postgres_live_applied BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_available BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v16_prod.migration_exceptions (
  id TEXT PRIMARY KEY,
  checkpoint_id TEXT NOT NULL REFERENCES v16_prod.migration_checkpoints(id) ON DELETE CASCADE,
  collection_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Payment Provider Connection Probes
CREATE TABLE IF NOT EXISTS v16_prod.provider_connection_tests (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  environment TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('LOCAL_DRY_RUN', 'SANDBOX_PROBE', 'PRODUCTION_PROBE')),
  webhook_signature_tested BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_verified BOOLEAN NOT NULL DEFAULT FALSE,
  external_reachable BOOLEAN NOT NULL DEFAULT FALSE,
  latency_ms NUMERIC(10, 2),
  status TEXT NOT NULL,
  diagnostic_note TEXT NOT NULL,
  tested_by TEXT NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 12-Stage Institutional Onboarding & Integration Evidence
CREATE TABLE IF NOT EXISTS v16_prod.institutional_onboarding (
  id TEXT PRIMARY KEY,
  institution_name TEXT NOT NULL,
  institution_type TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  stage_number INTEGER NOT NULL CHECK (stage_number >= 1 AND stage_number <= 12),
  protocols_supported TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  agreement_approved BOOLEAN NOT NULL DEFAULT FALSE,
  sandbox_tested BOOLEAN NOT NULL DEFAULT FALSE,
  security_validated BOOLEAN NOT NULL DEFAULT FALSE,
  production_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  readiness_state TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Uganda Pilot Programmes, Cohorts & Participant Consent
CREATE TABLE IF NOT EXISTS v16_prod.pilot_programmes (
  id TEXT PRIMARY KEY,
  pilot_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  districts_covered TEXT[] NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  uses_live_payment_rails BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v16_prod.pilot_cohorts (
  id TEXT PRIMARY KEY,
  pilot_id TEXT NOT NULL REFERENCES v16_prod.pilot_programmes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  district TEXT NOT NULL,
  enrolled_count INTEGER NOT NULL DEFAULT 0 CHECK (enrolled_count >= 0),
  verified_count INTEGER NOT NULL DEFAULT 0 CHECK (verified_count >= 0),
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'ACTIVE', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v16_prod.pilot_participant_consents (
  id TEXT PRIMARY KEY,
  pilot_id TEXT NOT NULL REFERENCES v16_prod.pilot_programmes(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES v16_prod.pilot_cohorts(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_category TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  informed_consent_granted BOOLEAN NOT NULL,
  disclosed_non_production BOOLEAN NOT NULL,
  is_non_production_test_record BOOLEAN NOT NULL DEFAULT TRUE,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pilot_id, participant_id)
);

-- 6. Human Usability Sessions & Task Results (empty until external moderated sessions are run)
CREATE TABLE IF NOT EXISTS v16_prod.usability_sessions (
  id TEXT PRIMARY KEY,
  persona_code TEXT NOT NULL,
  participant_group TEXT NOT NULL,
  language_used TEXT NOT NULL,
  consent_recorded BOOLEAN NOT NULL CHECK (consent_recorded = TRUE),
  moderator_id TEXT NOT NULL,
  location_district TEXT NOT NULL,
  overall_accessibility_notes TEXT NOT NULL,
  conducted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v16_prod.usability_task_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES v16_prod.usability_sessions(id) ON DELETE CASCADE,
  task_code TEXT NOT NULL,
  task_title TEXT NOT NULL,
  completed BOOLEAN NOT NULL,
  errors_count INTEGER NOT NULL DEFAULT 0 CHECK (errors_count >= 0),
  assistance_required BOOLEAN NOT NULL DEFAULT FALSE,
  duration_seconds NUMERIC(10, 2) NOT NULL CHECK (duration_seconds >= 0),
  feedback_note TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Monitoring Incidents, Recovery Exercises, Releases, Compliance & Operational Costs
CREATE TABLE IF NOT EXISTS v16_prod.monitoring_incidents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  component TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  correlation_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'MITIGATING', 'RESOLVED')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v16_prod.recovery_exercises (
  id TEXT PRIMARY KEY,
  systems_affected TEXT[] NOT NULL,
  backup_source TEXT NOT NULL,
  actual_rpo_seconds NUMERIC(10, 2) NOT NULL,
  actual_rto_seconds NUMERIC(10, 2) NOT NULL,
  data_integrity_passed BOOLEAN NOT NULL,
  live_external_infra_proven BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v16_prod.production_releases (
  id TEXT PRIMARY KEY,
  version_tag TEXT NOT NULL,
  environment TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('ROLLING', 'BLUE_GREEN', 'CANARY')),
  artifact_checksum_sha256 TEXT NOT NULL,
  staging_validated BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by TEXT,
  status TEXT NOT NULL,
  rollback_target_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v16_prod.compliance_reviews (
  id TEXT PRIMARY KEY,
  jurisdiction TEXT NOT NULL,
  domain TEXT NOT NULL,
  statutory_reference TEXT NOT NULL,
  requirement_summary TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status IN ('PENDING_LEGAL_REVIEW', 'CHANGES_REQUIRED', 'LEGAL_COUNSEL_CLEARED')),
  regulated_activation_blocked BOOLEAN NOT NULL DEFAULT TRUE,
  reviewer_name TEXT,
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v16_prod.operational_costs (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  period TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  amount_usd NUMERIC(14, 4) NOT NULL CHECK (amount_usd >= 0),
  note TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v16_incidents_status ON v16_prod.monitoring_incidents (tenant_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_v16_compliance_jur ON v16_prod.compliance_reviews (jurisdiction, review_status);
