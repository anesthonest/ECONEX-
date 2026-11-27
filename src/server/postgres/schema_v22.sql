-- ECONEX V24.0 Additive PostgreSQL 16 Schema Migration (Schema Version 22)
-- Universal Commerce, Supply Chain & Economic Execution Network
-- Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v24_sectors (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  group_name TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
  supported_participant_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  supports_goods BOOLEAN NOT NULL DEFAULT TRUE,
  supports_services BOOLEAN NOT NULL DEFAULT TRUE,
  supports_manufacturing BOOLEAN NOT NULL DEFAULT FALSE,
  is_agricultural BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS v24_commercial_participants (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  v23_identity_id TEXT,
  v23_wallet_id TEXT,
  v23_euwn TEXT,
  authorized_representatives JSONB NOT NULL DEFAULT '[]'::jsonb,
  display_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  sector_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_sector_id TEXT NOT NULL,
  operating_countries JSONB NOT NULL DEFAULT '[]'::jsonb,
  operating_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  products_and_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'SELF_DECLARED',
  identity_verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  legal_registration_status TEXT NOT NULL DEFAULT 'UNVERIFIED_SELF_DECLARED',
  operational_capability_status TEXT NOT NULL DEFAULT 'SELF_DECLARED',
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_test_record BOOLEAN NOT NULL DEFAULT TRUE,
  completed_orders_count INTEGER NOT NULL DEFAULT 0,
  on_time_delivery_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
  dispute_count INTEGER NOT NULL DEFAULT 0,
  paid_badges_forbidden BOOLEAN NOT NULL DEFAULT TRUE CHECK (paid_badges_forbidden = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v24_participants_tenant ON v24_commercial_participants(tenant_id, primary_sector_id);

CREATE TABLE IF NOT EXISTS v24_commerce_listings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  participant_name TEXT NOT NULL,
  listing_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sector_id TEXT NOT NULL REFERENCES v24_sectors(id),
  unit_of_measure TEXT NOT NULL,
  total_quantity_or_capacity NUMERIC(14,3) NOT NULL DEFAULT 1,
  min_order_qty NUMERIC(14,3) NOT NULL DEFAULT 1,
  price_minor BIGINT NOT NULL CHECK (price_minor > 0),
  currency TEXT NOT NULL DEFAULT 'UGX',
  country_code TEXT NOT NULL DEFAULT 'UG',
  location TEXT NOT NULL,
  delivery_available BOOLEAN NOT NULL DEFAULT TRUE,
  inspection_available BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'SELF_DECLARED',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  is_test_record BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_saved_searches (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  query TEXT,
  sector_id TEXT,
  country_code TEXT,
  listing_type TEXT,
  max_price_minor BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_rfqs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  buyer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  buyer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  sector_id TEXT NOT NULL REFERENCES v24_sectors(id),
  product_or_service TEXT NOT NULL,
  specifications TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL,
  unit_of_measure TEXT NOT NULL,
  budget_max_minor BIGINT,
  currency TEXT NOT NULL DEFAULT 'UGX',
  visibility TEXT NOT NULL CHECK (visibility IN ('PUBLIC', 'INVITED_ONLY')),
  invited_participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_location TEXT NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  awarded_quotation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_quotations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  rfq_id TEXT NOT NULL REFERENCES v24_rfqs(id),
  supplier_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  supplier_name TEXT NOT NULL,
  revision_number INTEGER NOT NULL DEFAULT 1,
  parent_quotation_id TEXT,
  unit_price_minor BIGINT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL,
  tax_minor BIGINT NOT NULL DEFAULT 0,
  delivery_charge_minor BIGINT NOT NULL DEFAULT 0,
  discount_minor BIGINT NOT NULL DEFAULT 0,
  total_amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  lead_time_days INTEGER NOT NULL DEFAULT 5,
  validity_days INTEGER NOT NULL DEFAULT 14,
  terms_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  immutable_snapshot_hash TEXT,
  decided_at TIMESTAMPTZ,
  decided_by_user_id TEXT,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_negotiations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  rfq_id TEXT NOT NULL REFERENCES v24_rfqs(id),
  quotation_id TEXT,
  agreement_id TEXT,
  participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_commercial_agreements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agreement_number TEXT NOT NULL UNIQUE,
  agreement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  buyer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  seller_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  linked_rfq_id TEXT,
  linked_quotation_id TEXT,
  items_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_value_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  governing_jurisdiction TEXT NOT NULL DEFAULT 'Republic of Uganda',
  terms_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  regulated_escrow_included BOOLEAN NOT NULL DEFAULT FALSE CHECK (regulated_escrow_included = FALSE),
  buyer_signed_at TIMESTAMPTZ,
  buyer_signed_by TEXT,
  seller_signed_at TIMESTAMPTZ,
  seller_signed_by TEXT,
  immutable_document_hash TEXT NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_commercial_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL,
  buyer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  seller_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  linked_listing_id TEXT,
  linked_agreement_id TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_minor BIGINT NOT NULL,
  tax_minor BIGINT NOT NULL DEFAULT 0,
  delivery_charge_minor BIGINT NOT NULL DEFAULT 0,
  total_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  allow_partial_fulfilment BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_location TEXT NOT NULL,
  delivery_evidence_ref TEXT,
  inspection_result TEXT,
  status TEXT NOT NULL DEFAULT 'ORDER_SUBMITTED',
  payment_obligation_id TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_test_record BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_warehouses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  owner_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  district_or_city TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  max_capacity_units NUMERIC(14,3) NOT NULL CHECK (max_capacity_units > 0),
  used_capacity_units NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (used_capacity_units >= 0),
  temperature_controlled BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_inventory_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL REFERENCES v24_warehouses(id),
  owner_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  sector_id TEXT NOT NULL REFERENCES v24_sectors(id),
  unit_of_measure TEXT NOT NULL,
  physical_qty NUMERIC(14,3) NOT NULL CHECK (physical_qty >= 0),
  reserved_qty NUMERIC(14,3) NOT NULL CHECK (reserved_qty >= 0),
  available_to_promise_qty NUMERIC(14,3) NOT NULL CHECK (available_to_promise_qty = physical_qty - reserved_qty),
  reorder_threshold_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  unit_valuation_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  batch_number TEXT,
  expiry_date TIMESTAMPTZ,
  reservation_expires_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_stock_movements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  inventory_item_id TEXT NOT NULL REFERENCES v24_inventory_items(id),
  warehouse_id TEXT NOT NULL REFERENCES v24_warehouses(id),
  target_warehouse_id TEXT,
  sku TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  quantity_delta_physical NUMERIC(14,3) NOT NULL DEFAULT 0,
  quantity_delta_reserved NUMERIC(14,3) NOT NULL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_procurement_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  request_number TEXT NOT NULL UNIQUE,
  buyer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  requester_user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  specifications TEXT NOT NULL,
  budget_reference TEXT NOT NULL,
  estimated_budget_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  conflict_of_interest_declared BOOLEAN NOT NULL DEFAULT FALSE,
  conflict_declaration_note TEXT NOT NULL DEFAULT '',
  requires_dual_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_public_preparation_notice BOOLEAN NOT NULL DEFAULT FALSE,
  official_government_platform_claimed BOOLEAN NOT NULL DEFAULT FALSE CHECK (official_government_platform_claimed = FALSE),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
  approver_user_id TEXT,
  approval_note TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_purchase_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  po_number TEXT NOT NULL UNIQUE,
  procurement_request_id TEXT NOT NULL REFERENCES v24_procurement_requests(id),
  buyer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  supplier_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'ISSUED',
  three_way_match_status TEXT NOT NULL DEFAULT 'PENDING',
  matched_grn_id TEXT,
  matched_invoice_id TEXT,
  match_variance_minor BIGINT NOT NULL DEFAULT 0,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_boms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  manufacturer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  product_name TEXT NOT NULL,
  finished_sku TEXT NOT NULL,
  work_centre TEXT NOT NULL,
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_unit_cost_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  cost_statement_notice TEXT NOT NULL DEFAULT 'ESTIMATED_OPERATIONAL_COST_NOT_AUDITED_FINANCIAL_STATEMENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_production_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  production_number TEXT NOT NULL UNIQUE,
  bom_id TEXT NOT NULL REFERENCES v24_boms(id),
  manufacturer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  product_name TEXT NOT NULL,
  finished_sku TEXT NOT NULL,
  work_centre TEXT NOT NULL,
  target_quantity NUMERIC(14,3) NOT NULL,
  produced_good_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  rejected_or_wastage_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  finished_batch_number TEXT NOT NULL,
  finished_inventory_item_id TEXT,
  quality_inspection_status TEXT NOT NULL DEFAULT 'PENDING',
  estimated_cost_minor BIGINT NOT NULL DEFAULT 0,
  actual_operational_cost_minor BIGINT NOT NULL DEFAULT 0,
  cost_variance_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  cost_statement_notice TEXT NOT NULL DEFAULT 'ESTIMATED_OPERATIONAL_COST_NOT_AUDITED_FINANCIAL_STATEMENT',
  status TEXT NOT NULL DEFAULT 'PLANNED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_logistics_corridors (
  corridor_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  origin_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  border_post TEXT NOT NULL,
  distance_km_estimate INTEGER NOT NULL,
  required_guidance_docs JSONB NOT NULL DEFAULT '[]'::jsonb,
  customs_clearance_claimed BOOLEAN NOT NULL DEFAULT FALSE CHECK (customs_clearance_claimed = FALSE),
  external_authority_notice TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS v24_logistics_shipments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  shipment_ref TEXT NOT NULL UNIQUE,
  linked_order_id TEXT,
  provider_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  provider_category TEXT NOT NULL,
  corridor_code TEXT,
  origin_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  origin_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  freight_fee_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'CREATED',
  proof_of_collection_ref TEXT,
  proof_of_delivery_ref TEXT,
  exception_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_commercial_documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  document_number TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL,
  issuing_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  receiving_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  linked_entity_type TEXT NOT NULL,
  linked_entity_id TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_minor BIGINT NOT NULL,
  tax_minor BIGINT NOT NULL DEFAULT 0,
  total_amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'ISSUED',
  tax_filing_notice TEXT NOT NULL DEFAULT 'ECONEX_COMMERCIAL_RECORD_NOT_OFFICIAL_GOVERNMENT_TAX_FILING',
  document_hash_sha256 TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_document_shares (
  token TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES v24_commercial_documents(id),
  tenant_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_payment_obligations (
  id TEXT PRIMARY KEY,
  obligation_ref TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  source_entity_type TEXT NOT NULL,
  source_entity_id TEXT NOT NULL,
  payer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  payee_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  payer_euwn TEXT NOT NULL,
  payee_euwn TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  paid_minor BIGINT NOT NULL DEFAULT 0,
  refunded_minor BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'UNPAID',
  sandbox_only BOOLEAN NOT NULL DEFAULT TRUE CHECK (sandbox_only = TRUE),
  v23_transaction_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  v23_refund_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_commercial_projects (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  client_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  contractor_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  scope TEXT NOT NULL,
  total_budget_minor BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  auto_escrow_release BOOLEAN NOT NULL DEFAULT FALSE CHECK (auto_escrow_release = FALSE),
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_trust_reviews (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT NOT NULL REFERENCES v24_commercial_orders(id),
  reviewer_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  subject_participant_id TEXT NOT NULL REFERENCES v24_commercial_participants(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  appeal_status TEXT NOT NULL DEFAULT 'NONE',
  appeal_reason TEXT,
  admin_resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reviewer_participant_id <> subject_participant_id)
);

CREATE TABLE IF NOT EXISTS v24_commercial_threads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  linked_entity_type TEXT NOT NULL,
  linked_entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocked_participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v24_offline_drafts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  client_draft_id TEXT NOT NULL UNIQUE,
  entity_kind TEXT NOT NULL,
  target_entity_id TEXT,
  base_version INTEGER,
  attempted_action TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_state TEXT NOT NULL DEFAULT 'QUEUED',
  conflict_fields JSONB,
  server_resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS v24_audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
