-- ECONEX V26.0 Universal Platform Activation, Complete Workflow Execution & Interactive Experience Transformation
-- PostgreSQL 16 Additive Schema Migration (Schema Version 24)
-- Developer: VINEXSAH TECHNOLOGIES. All rights reserved.

CREATE TABLE IF NOT EXISTS v26_schema_migrations (
  version INTEGER PRIMARY KEY,
  release_tag TEXT NOT NULL,
  ddl_checksum_sha256 TEXT NOT NULL,
  applied_by TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. User Onboarding Progress & Activation
CREATE TABLE IF NOT EXISTS v26_user_onboarding_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 7),
  total_steps INTEGER NOT NULL DEFAULT 7,
  selected_language TEXT NOT NULL DEFAULT 'en',
  country_code TEXT NOT NULL DEFAULT 'UG',
  account_type TEXT NOT NULL DEFAULT 'FARMER',
  full_name TEXT,
  phone TEXT,
  email TEXT,
  district TEXT,
  interests_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  consent_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Business Onboarding Progress & Auto-Routed Workspace Provisioning
CREATE TABLE IF NOT EXISTS v26_business_onboarding_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organisation_id TEXT,
  business_profile_id TEXT,
  euwn TEXT,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  sector_id TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'UG',
  currency TEXT NOT NULL DEFAULT 'UGX',
  registration_number TEXT,
  routed_workspace TEXT NOT NULL DEFAULT 'business-simple',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROVISIONED', 'VERIFICATION_PENDING', 'ACTIVE')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v26_biz_onb_user ON v26_business_onboarding_progress(user_id, completed);

-- 3. User Preferences, Accessibility & Dashboard Layout Persistence
CREATE TABLE IF NOT EXISTS v26_user_preferences (
  user_id TEXT PRIMARY KEY,
  experience_mode TEXT NOT NULL DEFAULT 'SIMPLE' CHECK (experience_mode IN ('SIMPLE', 'STANDARD', 'PROFESSIONAL', 'ADMINISTRATOR')),
  language_code TEXT NOT NULL DEFAULT 'en',
  active_country_code TEXT NOT NULL DEFAULT 'UG',
  active_currency TEXT NOT NULL DEFAULT 'UGX',
  active_workspace_id TEXT,
  text_size TEXT NOT NULL DEFAULT 'normal' CHECK (text_size IN ('normal', 'large', 'xlarge')),
  high_contrast BOOLEAN NOT NULL DEFAULT FALSE,
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  low_bandwidth BOOLEAN NOT NULL DEFAULT FALSE,
  dashboard_layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Contact Verification & Account Recovery Requests
CREATE TABLE IF NOT EXISTS v26_user_recovery_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('CONTACT_VERIFY', 'ACCESS_RECOVERY')),
  contact_channel TEXT NOT NULL CHECK (contact_channel IN ('EMAIL', 'PHONE_SMS')),
  contact_target_masked TEXT NOT NULL,
  verification_code_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'COMPLETED', 'EXPIRED')),
  sandbox_delivery_only BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v26_recovery_user ON v26_user_recovery_requests(user_id, status);

-- 5. Unified In-App Notifications, Preferences & Honest Provider Delivery Logs
CREATE TABLE IF NOT EXISTS v26_in_app_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'SYSTEM',
  severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'ACTION_REQUIRED', 'WARNING', 'CRITICAL')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_route TEXT NOT NULL DEFAULT '/home',
  target_tab_id TEXT NOT NULL DEFAULT 'home',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_v26_notif_user ON v26_in_app_notifications(user_id, is_read, archived);

CREATE TABLE IF NOT EXISTS v26_notification_preferences (
  user_id TEXT PRIMARY KEY,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  categories_json JSONB NOT NULL DEFAULT '{"ORDERS":true,"WALLET":true,"PROCUREMENT":true,"LOGISTICS":true,"SUPPORT":true,"SYSTEM":true}'::jsonb,
  quiet_hours_json JSONB NOT NULL DEFAULT '{"enabled":false,"start":"22:00","end":"06:00"}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v26_notification_deliveries (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL REFERENCES v26_in_app_notifications(id),
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP')),
  provider_configured BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('DELIVERED_IN_APP', 'PROVIDER_NOT_CONFIGURED', 'SIMULATED_NOT_SENT', 'FAILED')),
  provider_note TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Saved Listings, Saved Searches & Quick Action History
CREATE TABLE IF NOT EXISTS v26_saved_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('SAVED_SEARCH', 'SAVED_LISTING', 'QUICK_ACTION')),
  label TEXT NOT NULL,
  query_text TEXT,
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_tab_id TEXT,
  listing_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v26_saved_user ON v26_saved_items(user_id, item_type);

-- 7. Unified Support Tickets & Threaded Messages
CREATE TABLE IF NOT EXISTS v26_support_tickets (
  id TEXT PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organisation_id TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  linked_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED')),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v26_support_ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES v26_support_tickets(id),
  sender_user_id TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  message_body TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Document Sharing Permissions & Expiring Tokens
CREATE TABLE IF NOT EXISTS v26_document_shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  target_user_id TEXT,
  target_org_id TEXT,
  permission TEXT NOT NULL DEFAULT 'VIEW' CHECK (permission IN ('VIEW', 'DOWNLOAD')),
  share_token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Real Downloadable Report Exports Ledger
CREATE TABLE IF NOT EXISTS v26_report_exports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('CSV', 'JSON', 'PDF')),
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  content_sha256 TEXT NOT NULL,
  bytes INTEGER NOT NULL DEFAULT 0 CHECK (bytes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. End-to-End Connected Economic Workflow Execution Tracker
CREATE TABLE IF NOT EXISTS v26_workflow_executions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  organisation_id TEXT,
  workflow_type TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  completed_stages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_refs_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED')),
  honesty_notice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Interactive Control Audit & Route Inventory Registries
CREATE TABLE IF NOT EXISTS v26_interactive_control_audits (
  control_id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  route TEXT NOT NULL,
  control_type TEXT NOT NULL,
  intended_action TEXT NOT NULL,
  handler_or_destination TEXT NOT NULL,
  required_permission TEXT NOT NULL,
  backend_dependency TEXT NOT NULL,
  persistence_requirement TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'VERIFIED_FUNCTIONAL',
    'IMPLEMENTED_NOT_VERIFIED',
    'BLOCKED_EXTERNAL_DEPENDENCY',
    'DISABLED_BY_PERMISSION',
    'DISABLED_BY_BUSINESS_RULE',
    'REMOVED_AS_DUPLICATE'
  )),
  test_reference TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS v26_route_inventory (
  route_id TEXT PRIMARY KEY,
  nav_id TEXT NOT NULL,
  route_path TEXT NOT NULL,
  label TEXT NOT NULL,
  group_id TEXT NOT NULL,
  required_roles_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_experience_mode TEXT NOT NULL,
  availability TEXT NOT NULL,
  module_component TEXT NOT NULL,
  verified_status TEXT NOT NULL DEFAULT 'VERIFIED_FUNCTIONAL'
);
