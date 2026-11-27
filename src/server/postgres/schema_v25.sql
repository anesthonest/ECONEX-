-- ECONEX V27.0 Universal Economic Network, Trust Infrastructure & Continental Market Activation
-- PostgreSQL 16 Additive Schema Migration (Schema Version 25)
-- Developer: VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v27_schema_migrations (
  version INTEGER PRIMARY KEY,
  release_tag TEXT NOT NULL,
  ddl_checksum_sha256 TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Universal Network Participant Profiles & Privacy Controls
CREATE TABLE IF NOT EXISTS v27_network_profiles (
  id TEXT PRIMARY KEY,
  participant_type TEXT NOT NULL CHECK (participant_type IN (
    'INDIVIDUAL', 'BUSINESS', 'COOPERATIVE', 'INSTITUTION', 'LOGISTICS_PROVIDER', 'SUPPLIER', 'BUYER'
  )),
  user_id TEXT,
  organisation_id TEXT,
  business_profile_id TEXT,
  euwn_ref TEXT,
  display_name TEXT NOT NULL,
  legal_name TEXT,
  sector_id TEXT NOT NULL,
  sub_sector TEXT,
  country_code TEXT NOT NULL DEFAULT 'UG',
  region_or_district TEXT NOT NULL,
  summary TEXT NOT NULL,
  capabilities_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'NETWORK' CHECK (visibility IN ('PUBLIC', 'NETWORK', 'ORG_ONLY', 'PRIVATE')),
  discoverable_in_public_search BOOLEAN NOT NULL DEFAULT TRUE,
  share_contact_publicly BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (verification_status IN (
    'NOT_STARTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'REVOKED'
  )),
  verification_provenance TEXT NOT NULL DEFAULT 'USER_SUBMITTED',
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (trust_score >= 0 AND trust_score <= 100),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  completed_transactions_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_transactions_count >= 0),
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v27_profiles_country_sector ON v27_network_profiles(country_code, sector_id, visibility);
CREATE INDEX IF NOT EXISTS idx_v27_profiles_org ON v27_network_profiles(organisation_id);

-- 2. Trusted Network Relationships & Invitations
CREATE TABLE IF NOT EXISTS v27_network_relationships (
  id TEXT PRIMARY KEY,
  requester_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  requester_org_id TEXT,
  target_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  target_org_id TEXT,
  relationship_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'SUSPENDED', 'TERMINATED')),
  notes TEXT,
  history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v27_rel_profiles ON v27_network_relationships(requester_profile_id, target_profile_id, status);

-- 3. Evidence-Backed Verification Records & Provenance
CREATE TABLE IF NOT EXISTS v27_verification_records (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  entity_type TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
    'NOT_STARTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'REVOKED'
  )),
  provenance TEXT NOT NULL CHECK (provenance IN (
    'USER_SUBMITTED', 'SYSTEM_VALIDATED', 'THIRD_PARTY_VERIFIED', 'HUMAN_REVIEWED', 'GOVERNMENT_CONFIRMED'
  )),
  evidence_summary TEXT NOT NULL,
  evidence_document_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer_user_id TEXT,
  review_notes TEXT,
  expires_at TIMESTAMPTZ,
  audit_trail_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  submitted_by_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Transaction-Linked Reputation Reviews & Appeals
CREATE TABLE IF NOT EXISTS v27_reputation_reviews (
  id TEXT PRIMARY KEY,
  reviewer_user_id TEXT NOT NULL,
  reviewer_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  target_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  linked_order_id TEXT,
  linked_contract_id TEXT,
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  timeliness_score NUMERIC(3,2) NOT NULL CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
  quality_score NUMERIC(3,2) NOT NULL CHECK (quality_score >= 1 AND quality_score <= 5),
  communication_score NUMERIC(3,2) NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
  comment TEXT NOT NULL,
  verified_transaction_proof TEXT NOT NULL,
  moderation_status TEXT NOT NULL DEFAULT 'VISIBLE' CHECK (moderation_status IN ('VISIBLE', 'DISPUTED', 'UNDER_MODERATION', 'REMOVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reviewer_profile_id <> target_profile_id)
);

CREATE TABLE IF NOT EXISTS v27_reputation_appeals (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES v27_reputation_reviews(id),
  target_profile_id TEXT NOT NULL,
  appellant_user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  supporting_notes TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'UPHELD_REMOVED', 'REJECTED_KEPT')),
  decided_by_user_id TEXT,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Discovery Saved Searches, Search History & Explainable Matching
CREATE TABLE IF NOT EXISTS v27_saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  entity_scope TEXT NOT NULL,
  query_text TEXT NOT NULL,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  alert_on_new_match BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_count INTEGER NOT NULL DEFAULT 0 CHECK (result_count >= 0),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_match_recommendations (
  id TEXT PRIMARY KEY,
  for_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  for_user_id TEXT NOT NULL,
  candidate_profile_id TEXT,
  candidate_opportunity_id TEXT,
  match_type TEXT NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  factor_breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation_factors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  provenance TEXT NOT NULL DEFAULT 'SYSTEM_VALIDATED',
  is_paid_promotion_excluded BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_match_feedback (
  id TEXT PRIMARY KEY,
  recommendation_id TEXT NOT NULL REFERENCES v27_match_recommendations(id),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SAVE', 'ACCEPT', 'REJECT', 'RFQ', 'REPORT')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Economic Opportunity Exchange & Responses
CREATE TABLE IF NOT EXISTS v27_economic_opportunities (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT NOT NULL,
  creator_organisation_id TEXT NOT NULL,
  creator_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  opportunity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  corridor_destination_country TEXT,
  budget_min_minor BIGINT,
  budget_max_minor BIGINT,
  currency TEXT NOT NULL DEFAULT 'UGX',
  quantity_text TEXT,
  deadline_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'PUBLISHED', 'OPEN', 'RESPONSES_RECEIVED', 'UNDER_REVIEW', 'AWARDED', 'CLOSED', 'CANCELLED'
  )),
  awarded_response_id TEXT,
  response_count INTEGER NOT NULL DEFAULT 0 CHECK (response_count >= 0),
  provenance TEXT NOT NULL DEFAULT 'USER_DECLARED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v27_opp_country_sector_status ON v27_economic_opportunities(country_code, sector_id, status);

CREATE TABLE IF NOT EXISTS v27_opportunity_responses (
  id TEXT PRIMARY KEY,
  opportunity_id TEXT NOT NULL REFERENCES v27_economic_opportunities(id),
  responder_user_id TEXT NOT NULL,
  responder_organisation_id TEXT NOT NULL,
  responder_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  proposed_amount_minor BIGINT NOT NULL CHECK (proposed_amount_minor >= 0),
  currency TEXT NOT NULL,
  delivery_timeline_days INTEGER NOT NULL CHECK (delivery_timeline_days > 0),
  proposal_summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'SHORTLISTED', 'AWARDED', 'DECLINED', 'WITHDRAWN')),
  linked_rfq_id TEXT,
  linked_order_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Buyer Requirements, Supplier Capabilities, Org-Isolated CRM & Paid Promotions
CREATE TABLE IF NOT EXISTS v27_buyer_requirements (
  id TEXT PRIMARY KEY,
  buyer_user_id TEXT NOT NULL,
  buyer_organisation_id TEXT NOT NULL,
  buyer_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  title TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  required_volume_text TEXT NOT NULL,
  quality_standard TEXT NOT NULL,
  target_price_minor BIGINT NOT NULL CHECK (target_price_minor >= 0),
  currency TEXT NOT NULL,
  delivery_frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_supplier_capabilities (
  id TEXT PRIMARY KEY,
  supplier_user_id TEXT NOT NULL,
  supplier_organisation_id TEXT NOT NULL,
  supplier_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  capability_name TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  declared_capacity_text TEXT NOT NULL,
  declared_capacity_provenance TEXT NOT NULL DEFAULT 'USER_DECLARED',
  verified_capacity_text TEXT,
  verified_capacity_provenance TEXT DEFAULT 'UNVERIFIED',
  min_order_qty_text TEXT NOT NULL,
  lead_time_days INTEGER NOT NULL CHECK (lead_time_days > 0),
  certifications_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_crm_leads (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  counterparty_profile_id TEXT,
  counterparty_name TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'NEW' CHECK (stage IN ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')),
  estimated_value_minor BIGINT NOT NULL DEFAULT 0 CHECK (estimated_value_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'UGX',
  notes TEXT NOT NULL,
  next_action_text TEXT,
  next_action_due_at TIMESTAMPTZ,
  linked_opportunity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v27_crm_org ON v27_crm_leads(organisation_id, stage);

CREATE TABLE IF NOT EXISTS v27_paid_promotions (
  id TEXT PRIMARY KEY,
  sponsor_organisation_id TEXT NOT NULL,
  sponsor_profile_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_sector_id TEXT NOT NULL,
  target_country_code TEXT NOT NULL,
  promotion_label TEXT NOT NULL DEFAULT 'SPONSORED_PROMOTION',
  affects_organic_trust_score BOOLEAN NOT NULL DEFAULT FALSE,
  affects_search_reputation_ranking BOOLEAN NOT NULL DEFAULT FALSE,
  budget_minor BIGINT NOT NULL CHECK (budget_minor >= 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Commercial Messaging Threads, Referrals & Outcome Tracking
CREATE TABLE IF NOT EXISTS v27_network_threads (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  participant_user_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  participant_org_ids_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_network_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES v27_network_threads(id),
  sender_user_id TEXT NOT NULL,
  sender_organisation_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_referral_attributions (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  referrer_org_id TEXT,
  referred_user_id TEXT,
  referred_email_masked TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'REGISTERED', 'QUALIFIED_ACTIVITY', 'REJECTED_FRAUD')),
  monetary_reward_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reward_policy_notice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_outcome_metrics (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(14,4) NOT NULL,
  unit TEXT NOT NULL,
  provenance TEXT NOT NULL,
  cohort_tag TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Pilot Ops, Field Validation, Partner Governance & Trust Moderation
CREATE TABLE IF NOT EXISTS v27_pilot_programmes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'READY', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  is_simulated_environment BOOLEAN NOT NULL DEFAULT TRUE,
  can_mark_active_without_field_signoff BOOLEAN NOT NULL DEFAULT FALSE,
  lead_coordinator_user_id TEXT NOT NULL,
  target_participant_count INTEGER NOT NULL DEFAULT 0,
  enrolled_participant_count INTEGER NOT NULL DEFAULT 0,
  verified_completion_count INTEGER NOT NULL DEFAULT 0,
  readiness_checklist_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_pilot_participants (
  id TEXT PRIMARY KEY,
  pilot_id TEXT NOT NULL REFERENCES v27_pilot_programmes(id),
  profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  user_id TEXT,
  role_in_pilot TEXT NOT NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  first_transaction_completed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'NOMINATED',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_field_assignments (
  id TEXT PRIMARY KEY,
  officer_user_id TEXT NOT NULL,
  district TEXT NOT NULL,
  country_code TEXT NOT NULL,
  target_profile_id TEXT NOT NULL REFERENCES v27_network_profiles(id),
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ASSIGNED',
  assigned_by_user_id TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_field_reports (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES v27_field_assignments(id),
  officer_user_id TEXT NOT NULL,
  target_profile_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  district TEXT NOT NULL,
  observations TEXT NOT NULL,
  gps_latitude NUMERIC(10,6),
  gps_longitude NUMERIC(10,6),
  gps_source TEXT NOT NULL DEFAULT 'UNAVAILABLE',
  sync_status TEXT NOT NULL DEFAULT 'LOCAL_DRAFT' CHECK (sync_status IN ('LOCAL_DRAFT', 'QUEUED', 'SYNCED', 'REVIEWED', 'APPROVED', 'REJECTED')),
  offline_client_id TEXT UNIQUE,
  reviewed_by_user_id TEXT,
  review_decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_integration_partners (
  id TEXT PRIMARY KEY,
  partner_name TEXT NOT NULL,
  category TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  status TEXT NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'SANDBOX', 'TESTED', 'SECURITY_REVIEW', 'APPROVED', 'LIVE', 'SUSPENDED')),
  credentials_configured BOOLEAN NOT NULL DEFAULT FALSE,
  regulatory_approval_verified BOOLEAN NOT NULL DEFAULT FALSE,
  contractual_signoff_verified BOOLEAN NOT NULL DEFAULT FALSE,
  security_audit_passed BOOLEAN NOT NULL DEFAULT FALSE,
  last_heartbeat_at TIMESTAMPTZ,
  owner_org_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v27_moderation_cases (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason_category TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'APPEALED')),
  moderator_user_id TEXT,
  action_taken TEXT,
  appeal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
