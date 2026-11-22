-- ECONEX V21.0 Additive PostgreSQL 16 Schema Migration (Schema Version 19)
-- Controlled Pilot Deployment, Participant Onboarding, Field Operations, Exceptions, Support & Country Profiles
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v21_pilots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  model_template TEXT NOT NULL,
  geography JSONB NOT NULL,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  participating_organization_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  participant_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  pilot_admin_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  field_officer_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  approved_economic_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  operational_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_participants_limit INTEGER NOT NULL DEFAULT 100,
  max_single_trade_ugx NUMERIC(18, 2) NOT NULL DEFAULT 50000000,
  verification_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_classification TEXT NOT NULL DEFAULT 'MEDIUM',
  support_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  separated_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  closure_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v21_pilots_tenant_status ON v21_pilots(tenant_id, status);

CREATE TABLE IF NOT EXISTS v21_participant_onboardings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pilot_id TEXT NOT NULL REFERENCES v21_pilots(id),
  user_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_masked TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  category TEXT NOT NULL,
  organization_id TEXT,
  geography JSONB NOT NULL,
  consent_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  consent_version TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  evidence_submitted JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  suspended BOOLEAN NOT NULL DEFAULT FALSE,
  audit_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v21_onboardings_tenant_pilot ON v21_participant_onboardings(tenant_id, pilot_id, verification_status);

CREATE TABLE IF NOT EXISTS v21_field_activity_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pilot_id TEXT NOT NULL REFERENCES v21_pilots(id),
  field_officer_id TEXT NOT NULL,
  participant_id TEXT,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  gps_permission_granted BOOLEAN NOT NULL DEFAULT FALSE,
  gps_coordinates JSONB,
  sync_status TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  client_version INTEGER NOT NULL DEFAULT 1,
  server_version INTEGER NOT NULL DEFAULT 1,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  conflict_id TEXT,
  synced_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v21_field_officer_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pilot_id TEXT NOT NULL REFERENCES v21_pilots(id),
  officer_user_id TEXT NOT NULL,
  officer_display_name TEXT NOT NULL,
  assigned_district TEXT NOT NULL,
  participant_id TEXT,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL,
  site_visit_notes TEXT,
  assistance_summary TEXT,
  supervisor_review_note TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v21_tasks_officer ON v21_field_officer_tasks(tenant_id, officer_user_id, status);

CREATE TABLE IF NOT EXISTS v21_operational_exceptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pilot_id TEXT NOT NULL REFERENCES v21_pilots(id),
  exception_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  district TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  resolution_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v21_support_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pilot_id TEXT NOT NULL REFERENCES v21_pilots(id),
  reporter_user_id TEXT NOT NULL,
  reporter_role TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_officer_id TEXT,
  resolution_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v21_country_profiles (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  regional_bloc TEXT NOT NULL,
  default_currency TEXT NOT NULL,
  supported_units JSONB NOT NULL DEFAULT '[]'::jsonb,
  timezone TEXT NOT NULL,
  supported_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  geographic_hierarchy JSONB NOT NULL DEFAULT '[]'::jsonb,
  business_profile_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  operational_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  institutional_integration_status TEXT NOT NULL DEFAULT 'NOT_CONNECTED_OPERATIONAL_GUIDANCE_ONLY'
);

CREATE TABLE IF NOT EXISTS v21_pg_migration_runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  database_url_configured BOOLEAN NOT NULL DEFAULT FALSE,
  active_authority TEXT NOT NULL DEFAULT 'LOCAL_JSON_WAL_AUTHORITATIVE',
  postgres_cutover_complete BOOLEAN NOT NULL DEFAULT FALSE,
  collections_audited INTEGER NOT NULL,
  mapped_tables_count INTEGER NOT NULL,
  duplicate_prevention_verified BOOLEAN NOT NULL DEFAULT FALSE,
  interrupted_recovery_verified BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ledger_balanced_before BOOLEAN NOT NULL DEFAULT TRUE,
  ledger_balanced_after BOOLEAN NOT NULL DEFAULT TRUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
