-- ECONEX V28.0 Universal Economic Execution, Interoperability & Continental Operations Infrastructure
-- PostgreSQL 16 Additive Schema Migration (Schema Version 26)
-- Note: Local JSON WAL remains authoritative in development/preview until POSTGRESQL_CUTOVER_COMPLETE=true.
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v28_schema_migrations (
  version INTEGER PRIMARY KEY,
  release_tag TEXT NOT NULL,
  ddl_checksum_sha256 TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Unified Economic Execution Workflows & State Machine Transitions
CREATE TABLE IF NOT EXISTS v28_execution_workflows (
  id TEXT PRIMARY KEY,
  workflow_ref TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  participant_category TEXT NOT NULL,
  initiator_user_id TEXT NOT NULL,
  initiator_org_id TEXT NOT NULL,
  counterparty_org_id TEXT,
  owner_user_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'DISCOVER','VERIFY','MATCH','NEGOTIATE','AGREE','AUTHORISE','EXECUTE','FULFIL','RECONCILE','CLOSE','EVALUATE'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'DRAFT','SUBMITTED','VERIFIED','APPROVED','CONTRACTED','IN_PROGRESS','PARTIALLY_FULFILLED','FULFILLED','RECONCILED','CLOSED','DISPUTED','SUSPENDED','CANCELLED','FAILED'
  )),
  country_code TEXT NOT NULL DEFAULT 'UG',
  destination_country_code TEXT,
  currency TEXT NOT NULL DEFAULT 'UGX',
  value_minor BIGINT NOT NULL DEFAULT 0 CHECK (value_minor >= 0),
  linked_opportunity_id TEXT,
  linked_contract_id TEXT,
  linked_procurement_req_id TEXT,
  linked_order_id TEXT,
  linked_fulfilment_plan_id TEXT,
  linked_obligation_id TEXT,
  linked_cross_border_id TEXT,
  required_evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  requires_human_approval BOOLEAN NOT NULL DEFAULT TRUE,
  human_approved_by_user_id TEXT,
  human_approved_at TIMESTAMPTZ,
  compensation_status TEXT DEFAULT 'NONE',
  failure_reason TEXT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_v28_workflows_org_status ON v28_execution_workflows(initiator_org_id, status, stage);

CREATE TABLE IF NOT EXISTS v28_workflow_transitions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES v28_execution_workflows(id),
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_org_id TEXT NOT NULL,
  evidence_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  human_approved_by TEXT,
  compensation_action TEXT,
  notes TEXT,
  idempotency_key TEXT,
  correlation_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_v28_transitions_wf ON v28_workflow_transitions(workflow_id, occurred_at);

-- 2. Universal Contract & Obligation Management
CREATE TABLE IF NOT EXISTS v28_contracts (
  id TEXT PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL,
  template_code TEXT NOT NULL,
  title TEXT NOT NULL,
  scope_of_work TEXT NOT NULL,
  party_a_org_id TEXT NOT NULL,
  party_a_rep_user_id TEXT NOT NULL,
  party_b_org_id TEXT NOT NULL,
  party_b_rep_user_id TEXT,
  country_code TEXT NOT NULL DEFAULT 'UG',
  currency TEXT NOT NULL DEFAULT 'UGX',
  total_value_minor BIGINT NOT NULL CHECK (total_value_minor >= 0),
  payment_terms TEXT NOT NULL,
  delivery_terms TEXT NOT NULL,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_requirements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  acknowledgements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  legally_qualified_signature BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  linked_opportunity_id TEXT,
  linked_order_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_invoice_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_ledger_refs_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_v28_contracts_parties ON v28_contracts(party_a_org_id, party_b_org_id, status);

CREATE TABLE IF NOT EXISTS v28_contract_versions (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES v28_contracts(id),
  version INTEGER NOT NULL,
  summary TEXT NOT NULL,
  value_minor BIGINT NOT NULL,
  amended_by_user_id TEXT NOT NULL,
  amendment_reason TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_contract_obligations (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES v28_contracts(id),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  responsible_party_org_id TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL,
  linked_wallet_obligation_id TEXT,
  linked_ledger_ref TEXT,
  evidence_ref TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enterprise Procurement Policies, Plans, Requisitions & Evaluations
CREATE TABLE IF NOT EXISTS v28_procurement_policies (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'UG',
  enforce_strict_sod BOOLEAN NOT NULL DEFAULT TRUE,
  dual_approval_threshold_minor BIGINT NOT NULL DEFAULT 50000000,
  min_competitive_quotes INTEGER NOT NULL DEFAULT 3,
  require_conflict_declaration BOOLEAN NOT NULL DEFAULT TRUE,
  official_government_approval_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_procurement_plans (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL,
  fiscal_period TEXT NOT NULL,
  title TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  budget_minor BIGINT NOT NULL CHECK (budget_minor >= 0),
  committed_minor BIGINT NOT NULL DEFAULT 0 CHECK (committed_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  approved_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_procurement_requisitions (
  id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES v28_procurement_plans(id),
  organisation_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_amount_minor BIGINT NOT NULL CHECK (estimated_amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'UGX',
  requester_user_id TEXT NOT NULL,
  approver_user_id TEXT,
  receiver_user_id TEXT,
  payment_authoriser_user_id TEXT,
  conflict_declared_by_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL,
  linked_rfq_id TEXT,
  linked_po_id TEXT,
  linked_obligation_id TEXT,
  invoice_match_variance_minor BIGINT DEFAULT 0,
  exception_reason TEXT,
  official_government_approval_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_procurement_evaluations (
  id TEXT PRIMARY KEY,
  requisition_id TEXT NOT NULL REFERENCES v28_procurement_requisitions(id),
  rfq_id TEXT,
  evaluator_user_id TEXT NOT NULL,
  supplier_org_id TEXT NOT NULL,
  price_score NUMERIC(5,2) NOT NULL,
  quality_score NUMERIC(5,2) NOT NULL,
  delivery_score NUMERIC(5,2) NOT NULL,
  compliance_score NUMERIC(5,2) NOT NULL,
  weighted_total NUMERIC(5,2) NOT NULL,
  conflict_of_interest_free BOOLEAN NOT NULL DEFAULT TRUE,
  recommended BOOLEAN NOT NULL DEFAULT FALSE,
  rationale TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Fulfilment Control, Inventory Reservations & Shipment Evidence
CREATE TABLE IF NOT EXISTS v28_fulfilment_plans (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  contract_id TEXT,
  seller_org_id TEXT NOT NULL,
  buyer_org_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  carrier_org_id TEXT,
  status TEXT NOT NULL,
  ordered_quantity NUMERIC(12,2) NOT NULL CHECK (ordered_quantity > 0),
  reserved_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivered_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  rejected_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  damaged_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  returned_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  dispatch_authorised_by TEXT,
  final_confirmed_by TEXT,
  reconciliation_variance_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_inventory_reservations (
  id TEXT PRIMARY KEY,
  inventory_id TEXT NOT NULL,
  fulfilment_plan_id TEXT NOT NULL REFERENCES v28_fulfilment_plans(id),
  organisation_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity_reserved NUMERIC(12,2) NOT NULL CHECK (quantity_reserved >= 0),
  quantity_dispatched NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_returned NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_damaged NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  allow_negative_policy_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_shipment_evidences (
  id TEXT PRIMARY KEY,
  fulfilment_plan_id TEXT NOT NULL REFERENCES v28_fulfilment_plans(id),
  shipment_id TEXT NOT NULL,
  tracking_source TEXT NOT NULL CHECK (tracking_source IN ('MANUAL_RECORD','SIMULATED_TELEMETRY','EXTERNAL_CARRIER_API')),
  live_gps_connected BOOLEAN NOT NULL DEFAULT FALSE,
  milestone TEXT NOT NULL,
  location_label TEXT NOT NULL,
  delivered_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  rejected_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  damaged_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  returned_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  receiver_name TEXT NOT NULL,
  proof_hash_sha256 TEXT NOT NULL,
  dispute_note TEXT,
  recorded_by_user_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cross-Border Country Profiles & Executions
CREATE TABLE IF NOT EXISTS v28_country_profiles (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  supported_currencies_json JSONB NOT NULL,
  time_zone TEXT NOT NULL,
  languages_json JSONB NOT NULL,
  business_identifier_types_json JSONB NOT NULL,
  verification_requirements_json JSONB NOT NULL,
  compliance_checklist_json JSONB NOT NULL,
  tax_reference_system TEXT NOT NULL,
  trade_documentation_required_json JSONB NOT NULL,
  operational_restrictions_json JSONB NOT NULL,
  external_integration_status TEXT NOT NULL DEFAULT 'SANDBOX_ONLY',
  feature_availability_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_cross_border_executions (
  id TEXT PRIMARY KEY,
  origin_country_code TEXT NOT NULL REFERENCES v28_country_profiles(country_code),
  destination_country_code TEXT NOT NULL REFERENCES v28_country_profiles(country_code),
  exporter_org_id TEXT NOT NULL,
  importer_org_id TEXT NOT NULL,
  contract_id TEXT,
  fulfilment_plan_id TEXT,
  trade_currency TEXT NOT NULL,
  settlement_currency TEXT NOT NULL,
  configured_fx_rate NUMERIC(18,6),
  fx_rate_source TEXT NOT NULL,
  fx_rate_timestamp TIMESTAMPTZ,
  required_documents_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_document_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  restrictions_checked BOOLEAN NOT NULL DEFAULT FALSE,
  eligibility_verified BOOLEAN NOT NULL DEFAULT FALSE,
  stage TEXT NOT NULL,
  external_settlement_ref TEXT,
  official_customs_or_tax_filing_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  regulated_fx_dealing_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Interoperability Gateway, Event Orchestration & Document Evidence Vault
CREATE TABLE IF NOT EXISTS v28_interoperability_connectors (
  id TEXT PRIMARY KEY,
  provider_code TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL,
  country_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  state TEXT NOT NULL CHECK (state IN (
    'NOT_CONFIGURED','AWAITING_CREDENTIALS','SANDBOX','TESTING','AWAITING_APPROVAL','ACTIVE','SUSPENDED','FAILED','RETIRED'
  )),
  credential_ref TEXT,
  sandbox_endpoint TEXT NOT NULL,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  retry_max_attempts INTEGER NOT NULL DEFAULT 3,
  last_health_check_at TIMESTAMPTZ,
  last_health_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  approved_by_user_id TEXT,
  live_external_traffic_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_domain_events (
  id TEXT PRIMARY KEY,
  event_version TEXT NOT NULL DEFAULT '1.0',
  event_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_v28_events_corr ON v28_domain_events(correlation_id, status);

CREATE TABLE IF NOT EXISTS v28_event_dead_letters (
  id TEXT PRIMARY KEY,
  domain_event_id TEXT NOT NULL REFERENCES v28_domain_events(id),
  event_type TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  error_classification TEXT NOT NULL,
  error_message TEXT NOT NULL,
  replay_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  resolved_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_document_evidence_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_ref TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  malware_scan_status TEXT NOT NULL DEFAULT 'SCAN_NOT_PROVISIONED_SANDBOX',
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  verified_by_user_id TEXT,
  linked_entity_type TEXT NOT NULL,
  linked_entity_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  retention_until TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  access_log_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Continental Operations Control, Field Continuity & AI Audit
CREATE TABLE IF NOT EXISTS v28_operational_exceptions (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  linked_entity_id TEXT,
  organisation_id TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_to_user_id TEXT,
  resolved_by_user_id TEXT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_dual_approval_requests (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_by_user_id TEXT NOT NULL,
  first_approver_user_id TEXT,
  second_approver_user_id TEXT,
  status TEXT NOT NULL,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_field_offline_records (
  id TEXT PRIMARY KEY,
  client_record_id TEXT NOT NULL UNIQUE,
  task_type TEXT NOT NULL,
  officer_user_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  district TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_document_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  base_version INTEGER NOT NULL DEFAULT 1,
  sync_state TEXT NOT NULL CHECK (sync_state IN (
    'DRAFT','PENDING_SYNC','SYNCING','SYNCED','CONFLICT','FAILED','REQUIRES_REVIEW'
  )),
  conflict_payload_json JSONB,
  resolution_strategy TEXT,
  supervisor_user_id TEXT,
  supervisor_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v28_ai_orchestration_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  organisation_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  context_sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_summary TEXT NOT NULL,
  confidence_label TEXT NOT NULL,
  limitations_notice TEXT NOT NULL,
  human_approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  autonomous_execution_blocked BOOLEAN NOT NULL DEFAULT TRUE,
  prompt_injection_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
