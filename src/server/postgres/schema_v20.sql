-- ECONEX V22.0 Additive PostgreSQL 16 Schema Migration (Schema Version 20)
-- Universal Economic Activity & Growth Engine
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v22_sector_definitions (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_group TEXT NOT NULL,
  description TEXT NOT NULL,
  subsectors JSONB NOT NULL DEFAULT '[]'::jsonb,
  supported_activity_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  sensitive_data_isolation_required BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_notes TEXT NOT NULL,
  is_custom_added BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_business_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  legal_entity_type TEXT NOT NULL,
  primary_sector_code TEXT NOT NULL REFERENCES v22_sector_definitions(code),
  secondary_sector_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  subsectors JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  operating_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  currencies_supported JSONB NOT NULL DEFAULT '["UGX"]'::jsonb,
  registration_reference TEXT,
  tax_reference TEXT,
  registration_verified BOOLEAN NOT NULL DEFAULT FALSE,
  product_licence_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL,
  operational_status TEXT NOT NULL DEFAULT 'ACTIVE',
  summary TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  traceable_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v22_businesses_tenant_sector ON v22_business_profiles(tenant_id, primary_sector_code);

CREATE TABLE IF NOT EXISTS v22_individual_profiles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  professional_title TEXT NOT NULL,
  sector_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  is_individual_non_registered BOOLEAN NOT NULL DEFAULT TRUE,
  hourly_or_unit_rate NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  availability_status TEXT NOT NULL DEFAULT 'AVAILABLE',
  portfolio_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_marketplace_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sector_code TEXT NOT NULL REFERENCES v22_sector_definitions(code),
  subsector TEXT NOT NULL,
  offer_kind TEXT NOT NULL,
  transaction_mode TEXT NOT NULL,
  seller_type TEXT NOT NULL,
  seller_profile_id TEXT NOT NULL,
  seller_user_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pricing_model TEXT NOT NULL,
  unit_price NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  unit_label TEXT NOT NULL,
  min_order_qty INTEGER NOT NULL DEFAULT 1,
  available_qty NUMERIC(18, 2),
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  delivery_regions JSONB NOT NULL DEFAULT '[]'::jsonb,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  product_or_licence_verified BOOLEAN NOT NULL DEFAULT FALSE,
  quality_classification TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'ACTIVE',
  fraud_reports_count INTEGER NOT NULL DEFAULT 0,
  is_test_record BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v22_marketplace_sector_kind ON v22_marketplace_items(tenant_id, sector_code, offer_kind, moderation_status);

CREATE TABLE IF NOT EXISTS v22_fraud_reports (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reporter_user_id TEXT NOT NULL,
  reason_category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  reviewed_by TEXT,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_economic_activities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  activity_code TEXT NOT NULL UNIQUE,
  sector_code TEXT NOT NULL REFERENCES v22_sector_definitions(code),
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  listing_id TEXT,
  buyer_user_id TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  seller_user_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  quantity NUMERIC(18, 2) NOT NULL,
  unit_label TEXT NOT NULL,
  unit_price NUMERIC(18, 2) NOT NULL,
  total_amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  stage TEXT NOT NULL,
  configured_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  agreement JSONB,
  evidence_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  invoice_id TEXT,
  payment_reference_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  is_test_record BOOLEAN NOT NULL DEFAULT FALSE,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v22_activities_tenant_stage ON v22_economic_activities(tenant_id, sector_code, stage);

CREATE TABLE IF NOT EXISTS v22_procurement_opportunities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  reference_number TEXT NOT NULL UNIQUE,
  sector_code TEXT NOT NULL REFERENCES v22_sector_definitions(code),
  issuer_profile_id TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  issuer_kind TEXT NOT NULL,
  opportunity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  scope_description TEXT NOT NULL,
  budget_amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  submission_deadline TIMESTAMPTZ NOT NULL,
  evaluation_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'OPEN',
  awarded_bid_id TEXT,
  linked_activity_id TEXT,
  non_official_government_disclaimer TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_procurement_bids (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  tender_id TEXT NOT NULL REFERENCES v22_procurement_opportunities(id),
  bidder_profile_id TEXT NOT NULL,
  bidder_user_id TEXT NOT NULL,
  bidder_name TEXT NOT NULL,
  proposed_amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  delivery_lead_days INTEGER NOT NULL,
  technical_summary TEXT NOT NULL,
  supporting_evidence_hash TEXT NOT NULL,
  evaluation_score NUMERIC(6, 2),
  evaluation_justification TEXT,
  evaluated_by TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_code TEXT NOT NULL UNIQUE,
  sector_code TEXT NOT NULL REFERENCES v22_sector_definitions(code),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_user_id TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  contractor_user_id TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  total_budget NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  variations JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_activity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  activity_id TEXT,
  project_id TEXT,
  issuer_user_id TEXT NOT NULL,
  issuer_name TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  sector_code TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(18, 2) NOT NULL,
  tax_rate_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(18, 2) NOT NULL,
  paid_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  exchange_rate_to_ugx NUMERIC(18, 4) NOT NULL DEFAULT 1,
  exchange_rate_source TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  journal_entry_id TEXT,
  is_test_record BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_payment_references (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES v22_invoices(id),
  activity_id TEXT,
  external_channel TEXT NOT NULL,
  external_provider_name TEXT NOT NULL,
  external_reference_number TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  evidence_sha256 TEXT NOT NULL,
  reconciliation_status TEXT NOT NULL,
  non_custodial_notice TEXT NOT NULL,
  journal_entry_id TEXT,
  recorded_by TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_fx_rates (
  currency_code TEXT PRIMARY KEY,
  currency_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  rate_to_ugx NUMERIC(18, 4) NOT NULL,
  rate_source TEXT NOT NULL,
  classification TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_workforce_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  business_profile_id TEXT NOT NULL REFERENCES v22_business_profiles(id),
  assignee_name TEXT NOT NULL,
  assignee_role TEXT NOT NULL,
  title TEXT NOT NULL,
  sector_code TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'TODO',
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_economic_insights (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sector_code TEXT NOT NULL,
  title TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence_basis TEXT NOT NULL,
  source_record_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_date TIMESTAMPTZ NOT NULL,
  geographic_coverage TEXT NOT NULL,
  confidence TEXT NOT NULL,
  limitations TEXT NOT NULL,
  classification TEXT NOT NULL,
  recommended_next_step TEXT NOT NULL,
  requires_human_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
  acknowledged_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_relationships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  source_entity_name TEXT NOT NULL,
  source_entity_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  target_entity_name TEXT NOT NULL,
  target_entity_type TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  sector_code TEXT NOT NULL,
  verified_by_transaction_count INTEGER NOT NULL DEFAULT 0,
  sensitive_mask_applied BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_subscription_plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  monthly_fee_ugx NUMERIC(18, 2) NOT NULL,
  annual_fee_ugx NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  included_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  classification TEXT NOT NULL DEFAULT 'PROPOSED_CONFIGURABLE_PLAN',
  active_subscribers_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subscriber_profile_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES v22_subscription_plans(id),
  status TEXT NOT NULL,
  billing_notice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v22_interoperability_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  partner_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  payload_summary TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
