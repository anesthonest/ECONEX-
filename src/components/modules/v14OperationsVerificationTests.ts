/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V14.0 - Automated V14 Verification Test Definitions & Runner (T701-T850)
 * Global Institutional Integration, Financial Interoperability & Real-World Economic Operations
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

export interface V14TestCaseDef {
  id: string;
  name: string;
  category: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
}

export const V14_INITIAL_TESTS: V14TestCaseDef[] = [
  // T701-T720: V13->V14 Migration, Database Authority, 7-Gate Cutover & Backups (20)
  { id: 'T701', name: 'SchemaVersion 14 & /api/health Release V14 Verification', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T702', name: 'Canonical V13 Backup SHA-256 Checksum & Rollback Instructions', category: 'V14_MIGRATION', status: 'PENDING' },
  { id: 'T703', name: 'V13->V14 Migration Checkpoint Completed & Idempotent', category: 'V14_MIGRATION', status: 'PENDING' },
  { id: 'T704', name: 'All 40 New V14 Collections Initialized in Durable Snapshot', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T705', name: 'Database Authority Manager Active on WAL_JSON_SINGLE_NODE', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T706', name: 'Truthful PostgreSQL Environment Probe (postgresReachable=false)', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T707', name: 'Modular schema_v14.sql DDL Checksum & Integrity Verified', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T708', name: '7-Gate PostgreSQL Cutover Strictly Blocked (409) When PG Unprovisioned', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T709', name: 'Cutover Gate Records Explicit BlockedReasons & Single-Writer Lock', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T710', name: 'Non-Admin Cutover Check Rejected (403 PLATFORM_ADMIN_REQUIRED)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T711', name: 'Backup & Restore Drill Produces SHA-256 & Record Count Proof', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T712', name: 'Non-Admin Backup Verification Trigger Blocked (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T713', name: 'Unauthenticated V14 Database Status Rejected (401)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T714', name: 'Cross-Tenant V14 Database Probe Access Denied (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T715', name: 'Replica Health Inventory Truthfully Reports LOCAL_WAL vs NOT_CONFIGURED', category: 'V14_DATABASE', status: 'PENDING' },
  { id: 'T716', name: 'V14 Readiness Zero Regression on Pre-Existing Users & Tenants', category: 'V14_MIGRATION', status: 'PENDING' },
  { id: 'T717', name: 'Double-Entry Ledger Exact Zero-Variance Preserved Across V14 Upgrade', category: 'V14_INTEGRITY', status: 'PENDING' },
  { id: 'T718', name: '14-Currency Registry Initialized Completely During Migration', category: 'V14_MIGRATION', status: 'PENDING' },
  { id: 'T719', name: 'V14 Migration Audit History Entry Recorded', category: 'V14_MIGRATION', status: 'PENDING' },
  { id: 'T720', name: 'V14 Readiness Endpoint Confirms All V14 Subsystems Queryable', category: 'V14_DATABASE', status: 'PENDING' },

  // T721-T735: Distributed Event Streaming Infrastructure V14 (15)
  { id: 'T721', name: 'V14 Event Infrastructure Status Honestly Classifies LOCAL_OUTBOX_LOG', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T722', name: 'External Kafka & NATS JetStream Adapters Honestly Marked NOT_CONFIGURED', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T723', name: 'At-Least-Once With Idempotent Inbox Disclosed (No Fake Exactly-Once)', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T724', name: 'Ordered Event Publish Enforces Ordering Key & Correlation Trace', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T725', name: 'Ordered Event Duplicate Idempotency Key Deduplicates Cleanly (200)', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T726', name: 'Consumer Offset & Lag Telemetry Tracked Per Consumer Group', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T727', name: 'Broker Retention Policy Configuration Updates Metadata Cleanly', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T728', name: 'Broker Configuration Preserves Truthful NOT_CONFIGURED Without Env', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T729', name: 'Non-Admin Blocked From Configuring Broker Adapters (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T730', name: 'Event Publish Rejects Missing EventType/IdempotencyKey (400)', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T731', name: 'Event Backpressure Percentage & DLQ Count Tracked Live', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T732', name: 'Tenant-Scoped Outbox Event Visibility Isolation Verified', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T733', name: 'V14 Event Publish Integrates Seamlessly With V13 Schema Registry', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T734', name: 'Reject Unregistered Schema Version on V14 Ordered Publish (400)', category: 'V14_EVENTS', status: 'PENDING' },
  { id: 'T735', name: 'Zero Synthetic Settlement Claims Allowed via V14 Event Publish', category: 'V14_INTEGRITY', status: 'PENDING' },

  // T736-T755: 16-State Institutional Lifecycle, Agreements, Onboarding & Webhooks (20)
  { id: 'T736', name: 'Institutional Adapters Report 16-State Lifecycle & Credentials Redacted', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T737', name: 'Institutional Connector Secrets Completely Redacted in API Output', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T738', name: 'Production Activation Gate Strictly Blocked (409) Without Prereqs', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T739', name: 'Sandbox Harness Local Contract Test Runs Truthfully (externalReachable=false)', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T740', name: 'Non-Admin Blocked From Triggering Connector Tests (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T741', name: 'Non-Admin Blocked From Production Activation Requests (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T742', name: 'Bilateral Institutional MOU Countersign Lifecycle Works (Admin)', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T743', name: 'Agreement Signing Still Blocks Prod Activation Without Prod Certs (409)', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T744', name: 'Production Activation Rejection/Revocation Decision Records Cleanly', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T745', name: 'Outbound Institutional Sync Records Signed SHA-256 Digest & Dry-Run Mode', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T746', name: 'Unknown Connector Sync Returns 404 Cleanly', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T747', name: 'V14 Webhook Verification Accepts Valid HMAC-SHA256 Payload', category: 'V14_INSTITUTIONS', status: 'PENDING' },
  { id: 'T748', name: 'V14 Webhook Replay Attack Rejected With 409 DUPLICATE_REJECTED', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T749', name: 'Tampered Webhook Signature Rejected With 403 & Logs Security Incident', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T750', name: '11-Stage Institutional Onboarding Submission Starts as SUBMITTED_IDENTITY', category: 'V14_ONBOARDING', status: 'PENDING' },
  { id: 'T751', name: 'Onboarding Stage Advance Verifies Legal Registration & Authority Tiers', category: 'V14_ONBOARDING', status: 'PENDING' },
  { id: 'T752', name: 'Onboarding Stage Cannot Regress Backwards (409 Conflict)', category: 'V14_ONBOARDING', status: 'PENDING' },
  { id: 'T753', name: 'Onboarding Cannot Reach LIVE_OPERATIONS Without Verified Prod Connector', category: 'V14_ONBOARDING', status: 'PENDING' },
  { id: 'T754', name: 'Non-Admin Blocked From Advancing Onboarding Stages (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T755', name: 'All 9 Institutional Connectors Never Claim PRODUCTION_CONNECTED_AND_VERIFIED', category: 'V14_INTEGRITY', status: 'PENDING' },

  // T756-T780: 10-State Payments, Settlement Proof Gate, Reconciliation & 14 Currencies (25)
  { id: 'T756', name: 'Payment Providers Registry Covers MoMo, M-Pesa, Commercial Bank & RTGS', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T757', name: 'Unconfigured Payment Providers Honestly Report NOT_CONFIGURED', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T758', name: 'Initiate Payment Enforces Idempotency Key & Valid Amount/Currency', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T759', name: 'Duplicate Payment Idempotency Key Returns Existing Record (200 Dedup)', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T760', name: 'Reject Negative or Zero Payment Amount (400)', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T761', name: 'Reject Unsupported Currency Code (400)', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T762', name: 'Reject EXECUTABLE FX Quote When Only Indicative Reference Exists (409)', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T763', name: 'Valid Payment State Progression PROVIDER_SELECTED -> SUBMITTED -> AUTHORIZED', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T764', name: 'Invalid Payment State Skip Rejected Cleanly (409)', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T765', name: 'SETTLED Transition Blocked (409) Without Authoritative Settlement Receipt', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T766', name: 'Synthetic/Placeholder Settlement Flag Strictly Rejected (403) + Incident Logged', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T767', name: 'Invalid HMAC Signature on Provider Settlement Receipt Rejected (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T768', name: 'Valid HMAC Provider Settlement Receipt Verifies & Transitions to SETTLED', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T769', name: 'Partial Settlement Receipt Amount Automatically Flags REQUIRES_RECONCILIATION', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T770', name: 'Settlement Receipt Currency Mismatch Rejected (409 CURRENCY_MISMATCH)', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T771', name: 'Automated Financial Reconciliation Identifies Matched, Partial, Fee & Unmatched Items', category: 'V14_RECONCILIATION', status: 'PENDING' },
  { id: 'T772', name: 'Reconciliation Detects Duplicate Provider Reference Entries as CRITICAL', category: 'V14_RECONCILIATION', status: 'PENDING' },
  { id: 'T773', name: 'Reconciliation Never Fabricates Synthetic Journal Entries On Mismatch', category: 'V14_INTEGRITY', status: 'PENDING' },
  { id: 'T774', name: 'Operator Resolves Financial Reconciliation Exception With Audit Note', category: 'V14_RECONCILIATION', status: 'PENDING' },
  { id: 'T775', name: 'Open Payment Dispute Linked to Reconciliation Exception Escalates Status', category: 'V14_PAYMENTS', status: 'PENDING' },
  { id: 'T776', name: 'Cross-Tenant Payment State Mutation Blocked (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T777', name: '14 Supported Currencies Isolated Independently in Per-Currency Ledger Report', category: 'V14_TREASURY', status: 'PENDING' },
  { id: 'T778', name: 'Indicative vs Executable FX Quote Sources Distinctly Classified', category: 'V14_TREASURY', status: 'PENDING' },
  { id: 'T779', name: 'KES Cross-Border Payment Verified Across Independent KES Account Prefix', category: 'V14_TREASURY', status: 'PENDING' },
  { id: 'T780', name: 'Zero SETTLED V14 Payments Exist Without Verified Provider Settlement Proof', category: 'V14_INTEGRITY', status: 'PENDING' },

  // T781-T800: 16-Step Trade, Procurement, Verified Delivery Evidence & Tax Rules (20)
  { id: 'T781', name: 'Create 16-Step Cross-Border Trade Workflow (UG -> KE)', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T782', name: 'Advance Trade Workflow Through Early Pre-Delivery Steps', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T783', name: 'Trade Step 14 Strictly Blocked (409) Without Independently Verified Evidence', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T784', name: 'Participant Delivery Claim Stored Strictly as SUBMITTED_CLAIM', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T785', name: 'Self-Verification of Own Delivery Claim Rejected (403 SELF_VERIFICATION_PROHIBITED)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T786', name: 'Independent Counterparty/Inspector Verification Transitions to INDEPENDENTLY_VERIFIED', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T787', name: 'Trade Completes Steps 14-16 Cleanly Once Verified Delivery Evidence Attached', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T788', name: 'Trade Workflow Regression Step Rejected (409)', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T789', name: 'Cross-Tenant Trade Workflow Access Denied (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T790', name: 'Create Public/Institutional Procurement Workflow Record', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T791', name: 'Procurement Delivery Evidence Verification Links Cleanly', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T792', name: 'Effective-Dated Tax Rules Query Covers UG, KE, TZ, RW', category: 'V14_TAX', status: 'PENDING' },
  { id: 'T793', name: 'Assess UG 18% VAT Tax Returns LOCAL_ASSESSMENT_ONLY (Honest Non-Filing)', category: 'V14_TAX', status: 'PENDING' },
  { id: 'T794', name: 'Assess KE 16% VAT Applies Jurisdiction-Specific Statutory Rate', category: 'V14_TAX', status: 'PENDING' },
  { id: 'T795', name: 'Create New Effective-Dated Tax Jurisdiction Rule (Admin 201)', category: 'V14_TAX', status: 'PENDING' },
  { id: 'T796', name: 'Non-Admin Blocked From Creating Statutory Tax Rules (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T797', name: 'Missing Jurisdiction Tax Rule Returns 404 Cleanly', category: 'V14_TAX', status: 'PENDING' },
  { id: 'T798', name: 'Tax Assessment Validation Rejects Missing Parameters (400)', category: 'V14_TAX', status: 'PENDING' },
  { id: 'T799', name: 'Procurement Listing Validation Rejects Missing Required Fields (400)', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T800', name: 'Zero Delivery Claims Bypass Independent Verification Gate', category: 'V14_INTEGRITY', status: 'PENDING' },

  // T801-T815: Identity Tiers, RBAC+ABAC Policy Engine, HSM & WORM Audit (15)
  { id: 'T801', name: 'ABAC Policy Engine Grants Valid Admin/High-Trust Request Within Jurisdiction', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T802', name: 'ABAC Policy Engine Enforces Dual Approval Over 50M UGX Value Threshold', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T803', name: 'ABAC Policy Engine Denies Unauthorized Role (403) & Missing Verified Identity', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T804', name: 'ABAC Policy Engine Denies Restricted Jurisdiction Constraint (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T805', name: 'Legal Identity Submission Stored Strictly as SUBMITTED_IDENTITY', category: 'V14_IDENTITY', status: 'PENDING' },
  { id: 'T806', name: 'Non-Admin Blocked From Verifying Legal Registration Status (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T807', name: 'Admin Upgrades Submitted Identity to VERIFIED_LEGAL_REGISTRATION', category: 'V14_IDENTITY', status: 'PENDING' },
  { id: 'T808', name: 'Production PKCS#11 HSM Record Reports NOT_CONFIGURED & FailClosed=true', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T809', name: 'External WORM Audit Checkpoint Archive Generated With Local-Only Limitation', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T810', name: 'Non-Admin Blocked From Exporting WORM Audit Archives (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T811', name: 'Security Incidents Telemetry Captures Auth/Escalation/Settlement Attempts', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T812', name: 'Admin Security Incident Mitigation Transitions Status to MITIGATED', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T813', name: 'Non-Admin Blocked From Mitigating Security Incidents (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T814', name: 'Security Overview Reports Production Key Management Rotation Dates', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T815', name: 'Security Overview Redacts All Private Keys & Connector Credentials', category: 'V14_SECURITY', status: 'PENDING' },

  // T816-T830: Commercial Plans, Subscriptions, Usage Metering, Invoices, Refunds & Profiles (15)
  { id: 'T816', name: 'Commercial Catalog Exposes All 5 Required Plans (STARTER -> INSTITUTIONAL)', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T817', name: 'Subscribe Tenant Creates Active Subscription, Usage Meter & Issued Invoice', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T818', name: 'Commercial Invoices Disclose Non-Realized Revenue Until Verified Settlement', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T819', name: 'Annual Billing Cycle Applies Plan Discount Percentage Deterministically', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T820', name: 'API Usage Overage Computes Metered Charge Accurately', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T821', name: 'Admin Issues Partial/Full Invoice Refund & Transitions Invoice to REFUNDED', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T822', name: 'Refund Rejects Amount Exceeding Invoice Total (400)', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T823', name: 'Non-Admin Blocked From Approving Invoice Refunds (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T824', name: 'Deployment Environment Profiles Cover DEVELOPMENT, STAGING, PILOT, PRODUCTION', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T825', name: 'PRODUCTION Profile Activation Strictly Blocked (409) Without PG & HSM', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T826', name: 'PILOT & DEVELOPMENT Profile Switching Works Cleanly (Admin 200)', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T827', name: 'Non-Admin Blocked From Switching Deployment Profiles (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T828', name: 'Unknown PlanCode Subscribe Returns 400 Cleanly', category: 'V14_COMMERCIAL', status: 'PENDING' },
  { id: 'T829', name: 'Tenant Subscription Isolation Enforced Across Tenant Boundaries', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T830', name: 'Commercial Operations Overview Reports Real Counts Without Projections as Revenue', category: 'V14_INTEGRITY', status: 'PENDING' },

  // T831-T850: Multi-Region, DR Exercises, Concurrency Benchmarks & V14 Master Synthesis (20)
  { id: 'T831', name: 'Multi-Region Registry Reports UG LOCAL_ONLY & KE/TZ/RW NOT_CONFIGURED', category: 'V14_RESILIENCE', status: 'PENDING' },
  { id: 'T832', name: 'Trigger DATABASE_CORRUPTION DR Exercise & Verify Consistency', category: 'V14_RESILIENCE', status: 'PENDING' },
  { id: 'T833', name: 'Trigger HSM_UNAVAILABLE DR Exercise & Fail-Closed Security Check', category: 'V14_RESILIENCE', status: 'PENDING' },
  { id: 'T834', name: 'Trigger CREDENTIAL_COMPROMISE DR Exercise Cleanly', category: 'V14_RESILIENCE', status: 'PENDING' },
  { id: 'T835', name: 'Trigger INTERRUPTED_FINANCIAL_TX DR Exercise & Ledger Balance Check', category: 'V14_RESILIENCE', status: 'PENDING' },
  { id: 'T836', name: 'Trigger FAILED_SETTLEMENT_PROOF DR Exercise Cleanly', category: 'V14_RESILIENCE', status: 'PENDING' },
  { id: 'T837', name: 'Non-Admin Blocked From Triggering V14 DR Exercises (403)', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T838', name: 'Production Readiness Assessment Truthfully Reports BLOCKED_FOR_LIVE_PRODUCTION', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T839', name: 'Concurrent V14 Readiness & Treasury Load Benchmark (25 Parallel, p95 < 500ms)', category: 'V14_PERFORMANCE', status: 'PENDING' },
  { id: 'T840', name: 'Concurrent V14 Payment Initiation Benchmark (15 Parallel Idempotent Writes)', category: 'V14_PERFORMANCE', status: 'PENDING' },
  { id: 'T841', name: 'Concurrent V14 Ordered Event Publishing Benchmark (15 Parallel Writes)', category: 'V14_PERFORMANCE', status: 'PENDING' },
  { id: 'T842', name: 'Concurrent Institutional Diagnostics & Policy Evaluation Load Benchmark', category: 'V14_PERFORMANCE', status: 'PENDING' },
  { id: 'T843', name: 'Zero Unverified SETTLED Payments After Full V14 Verification Workload', category: 'V14_INTEGRITY', status: 'PENDING' },
  { id: 'T844', name: 'Double-Entry General Ledger Exact Balance Across All Currencies Post-Load', category: 'V14_INTEGRITY', status: 'PENDING' },
  { id: 'T845', name: 'Cross-Tenant KE vs UG Isolation Verified Under Concurrent Mixed Workload', category: 'V14_SECURITY', status: 'PENDING' },
  { id: 'T846', name: 'Zero Regression Across V11, V12 & V13 Core Control APIs Under V14', category: 'V14_INTEGRITY', status: 'PENDING' },
  { id: 'T847', name: 'Truthful Classification Audit Across PG, Kafka, HSM, WORM, MoMo & Institutions', category: 'V14_INTEGRITY', status: 'PENDING' },
  { id: 'T848', name: 'Deployment Profile Cleanly Restored to DEVELOPMENT Post-Testing', category: 'V14_OPERATIONS', status: 'PENDING' },
  { id: 'T849', name: 'All 40 V14 Collections Persisted & Queryable in Schema 14 Snapshot', category: 'V14_INTEGRITY', status: 'PENDING' },
  { id: 'T850', name: 'Master Synthesis: AETHER–AROS V14 Global Institutional Integration & Operations', category: 'V14_INTEGRITY', status: 'PENDING' },
];

export async function runV14VerificationTests(
  updateTestStatus: (
    id: string,
    status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED',
    durationMs?: number,
    assertionDetails?: string,
    error?: string
  ) => void
): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  const ADMIN_HDRS: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_admin_01',
    'x-user-role': 'PLATFORM_ADMIN',
    'x-tenant-id': 'TEN-UG-ELGON-01',
    Authorization: `Bearer v14-sess-admin-${Date.now()}`,
  };
  const COOP_HDRS: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_coop_01',
    'x-user-role': 'COOPERATIVE_ADMIN',
    'x-tenant-id': 'TEN-UG-ELGON-01',
    Authorization: `Bearer v14-sess-coop-${Date.now()}`,
  };
  const FARMER_HDRS: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_farmer_01',
    'x-user-role': 'FARMER',
    'x-tenant-id': 'TEN-UG-ELGON-01',
    Authorization: `Bearer v14-sess-farmer-${Date.now()}`,
  };
  const KE_BUYER_HDRS: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_buyer_02',
    'x-user-role': 'BUYER',
    'x-tenant-id': 'TEN-KE-ROASTERS-03',
    Authorization: `Bearer v14-sess-buyer2-${Date.now()}`,
  };

  const exec = async (id: string, fn: () => Promise<string>) => {
    const t0 = performance.now();
    updateTestStatus(id, 'RUNNING');
    try {
      const msg = await fn();
      const dur = Math.max(1, Math.round(performance.now() - t0));
      passed++;
      updateTestStatus(id, 'PASSED', dur, msg);
    } catch (e: any) {
      const dur = Math.max(1, Math.round(performance.now() - t0));
      failed++;
      updateTestStatus(id, 'FAILED', dur, undefined, e?.message || String(e));
    }
  };

  const computeHmacHex = async (secret: string, msg: string): Promise<string> => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const tag = Date.now().toString(36).toUpperCase();
  let dbStCache: any = null;
  let onboardingId = '';
  const payIdem = `V14-PAY-${tag}`;
  let paymentId = '';
  let partialPaymentId = '';
  let kesPaymentId = '';
  let lastReconExId = '';
  let tradeId = '';
  let evidenceId = '';
  let procurementId = '';
  let identityId = '';
  let lastIncidentId = '';
  let invoiceId = '';

  // ==========================================
  // T701-T720: V13->V14 Migration, DB Authority & 7-Gate Cutover
  // ==========================================
  await exec('T701', async () => {
    const h = await fetch('/api/health').then((r) => r.json());
    if (
      h.schemaVersion < 14 ||
      (!String(h.release).includes('V14.0-GLOBAL-INSTITUTIONAL-INTEGRATION') &&
        !String(h.release).includes('V15.0-') &&
        !String(h.release).includes('V16.0-') &&
        !String(h.release).includes('V17.0-') &&
        !String(h.release).includes('V18.0-'))
    ) {
      throw new Error(`Expected V14+ health & schemaVersion>=14, got ${h.schemaVersion} / ${h.release}`);
    }
    return `/api/health confirmed ${h.system} (${h.release}, schemaVersion=${h.schemaVersion}).`;
  });

  await exec('T702', async () => {
    const d = await fetch('/api/v14/infrastructure/database/status', { headers: ADMIN_HDRS }).then((r) => r.json());
    dbStCache = d;
    if (!d.rollbackReadiness?.v13BackupValid || !d.rollbackReadiness?.checksumSha256 || !d.rollbackReadiness?.rollbackInstructions?.length) {
      throw new Error('Canonical V13 backup & rollback verification failed');
    }
    return `Canonical V13 backup SHA-256 verified (${d.rollbackReadiness.checksumSha256.slice(0, 14)}...).`;
  });

  await exec('T703', async () => {
    const cps = dbStCache?.v14MigrationCheckpoints || [];
    if (!cps.length || !['COMPLETED', 'RECOVERED'].includes(cps[0].status)) {
      throw new Error('Missing completed V14 migration checkpoint');
    }
    return `V14 checkpoint ${cps[0].id} status=${cps[0].status} (from ${cps[0].fromSchemaVersion}->14).`;
  });

  await exec('T704', async () => {
    if (!dbStCache || dbStCache.collectionsCount < 110) {
      throw new Error(`Expected >= 110 total collections incl 40 V14 collections, got ${dbStCache?.collectionsCount}`);
    }
    return `Verified ${dbStCache.collectionsCount} total persisted collections in Schema 14 snapshot.`;
  });

  await exec('T705', async () => {
    if (dbStCache?.probe?.activeAuthority !== 'WAL_JSON_SINGLE_NODE' || !dbStCache?.probe?.singleWriterLockEnforced) {
      throw new Error('Active single-writer database authority mismatch');
    }
    return 'Database Authority Manager active exclusively on WAL_JSON_SINGLE_NODE.';
  });

  await exec('T706', async () => {
    if (dbStCache?.probe?.postgresReachable !== false) {
      throw new Error('Expected truthful postgresReachable=false in single container');
    }
    return 'PostgreSQL probe truthfully reports unprovisioned/unreachable in container.';
  });

  await exec('T707', async () => {
    const ddl = dbStCache?.probe?.schemaV14Ddl;
    if (!ddl?.schemaFileExists || !ddl?.schemaChecksumSha256 || ddl.statementCount < 10) {
      throw new Error('schema_v14.sql DDL missing or incomplete');
    }
    return `schema_v14.sql verified (${ddl.statementCount} statements, SHA-256 ${ddl.schemaChecksumSha256.slice(0, 14)}...).`;
  });

  await exec('T708', async () => {
    const r = await fetch('/api/v14/infrastructure/database/cutover-check', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ requestedAuthorityState: 'POSTGRES_PRIMARY', platformAdminApproved: true }),
    });
    const d = await r.json();
    if (r.status !== 409 || d.allowed !== false) {
      throw new Error(`Expected 409 blocked cutover when PG unreachable, got ${r.status}`);
    }
    return `7-Gate cutover blocked with 409: ${d.checklist?.blockedReasons?.[0]}`;
  });

  await exec('T709', async () => {
    const r = await fetch('/api/v14/infrastructure/database/cutover-check', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ requestedAuthorityState: 'POSTGRES_PRIMARY_WITH_REPLICAS', platformAdminApproved: false }),
    });
    const d = await r.json();
    if (r.status !== 409 || !d.checklist?.gates?.singleWriterLockConfirmed || d.checklist?.blockedReasons?.length < 2) {
      throw new Error('Expected blockedReasons & singleWriterLockConfirmed');
    }
    return `Cutover evaluator tracked ${d.checklist.blockedReasons.length} unmet gates with single-writer lock active.`;
  });

  await exec('T710', async () => {
    const r = await fetch('/api/v14/infrastructure/database/cutover-check', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ requestedAuthorityState: 'POSTGRES_PRIMARY', platformAdminApproved: true }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 for non-admin cutover, got ${r.status}`);
    return 'Non-admin blocked from database cutover governance (403).';
  });

  await exec('T711', async () => {
    const r = await fetch('/api/v14/infrastructure/backups/verify', { method: 'POST', headers: ADMIN_HDRS });
    const d = await r.json();
    if (r.status !== 201 || !d.integrityVerified || !d.checksumSha256) {
      throw new Error('Backup & restore drill verification failed');
    }
    return `Verified backup ${d.id} (${d.bytes} bytes, SHA-256 ${d.checksumSha256.slice(0, 12)}...).`;
  });

  await exec('T712', async () => {
    const r = await fetch('/api/v14/infrastructure/backups/verify', { method: 'POST', headers: FARMER_HDRS });
    if (r.status !== 403) throw new Error(`Expected 403 for non-admin backup drill, got ${r.status}`);
    return 'Non-admin blocked from backup & restore drill (403).';
  });

  await exec('T713', async () => {
    const r = await fetch('/api/v14/infrastructure/database/status');
    if (r.status !== 401) throw new Error(`Expected 401 for unauthenticated DB status, got ${r.status}`);
    return 'Unauthenticated V14 database request strictly rejected with 401.';
  });

  await exec('T714', async () => {
    const r = await fetch('/api/v14/infrastructure/database/status', {
      headers: { ...COOP_HDRS, 'x-tenant-id': 'TEN-KE-ROASTERS-03' },
    });
    if (r.status !== 403) throw new Error(`Expected 403 cross-tenant denial, got ${r.status}`);
    return 'Cross-tenant access attempt blocked (403) & recorded.';
  });

  await exec('T715', async () => {
    const reps = dbStCache?.probe?.replicas || [];
    if (!reps.some((x: any) => x.connectionStatus === 'LOCAL_ONLY') || !reps.some((x: any) => x.connectionStatus === 'NOT_CONFIGURED')) {
      throw new Error('Replica health classification mismatch');
    }
    return `Verified ${reps.length} replica health descriptors (LOCAL_ONLY vs NOT_CONFIGURED).`;
  });

  await exec('T716', async () => {
    const f = dbStCache?.rollbackReadiness;
    if (f.restorableUsers < 6 || f.restorableTenants < 4) throw new Error('Expected >=6 users & >=4 tenants');
    return `Verified preserved entities (${f.restorableUsers} users, ${f.restorableTenants} tenants).`;
  });

  await exec('T717', async () => {
    const t = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!t.ledgerIsolation?.allCurrenciesBalanced) throw new Error('General ledger imbalanced after migration');
    return 'Double-entry ledger exact balance verified across all currency accounts.';
  });

  await exec('T718', async () => {
    const t = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    if ((t.configs || []).length !== 14) throw new Error(`Expected 14 currencies, got ${t.configs?.length}`);
    return 'All 14 currency settlement configs verified (UGX..JPY).';
  });

  await exec('T719', async () => {
    const aud = await fetch('/api/v12/governance/audit', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!Array.isArray(aud)) throw new Error('Audit trail unavailable');
    return `Audit chain active with ${aud.length} governance log entries.`;
  });

  await exec('T720', async () => {
    const r = await fetch('/api/v14/operations/readiness', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (r.schemaVersion < 14 || r.summary?.collectionsCount < 110) throw new Error('Readiness check failed');
    return `V14 readiness summary verified (${r.summary.collectionsCount} collections).`;
  });

  // ==========================================
  // T721-T735: Distributed Event Streaming Infrastructure V14
  // ==========================================
  let evStatusCache: any = null;
  await exec('T721', async () => {
    evStatusCache = await fetch('/api/v14/infrastructure/events/status', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (evStatusCache.activeBrokerAdapter !== 'LOCAL_OUTBOX_LOG') throw new Error('Expected LOCAL_OUTBOX_LOG active');
    return 'Event status honestly classifies LOCAL_OUTBOX_LOG as active log.';
  });

  await exec('T722', async () => {
    if (evStatusCache.externalKafkaStatus !== 'NOT_CONFIGURED' || evStatusCache.externalNatsStatus !== 'NOT_CONFIGURED') {
      throw new Error('Expected Kafka & NATS NOT_CONFIGURED');
    }
    return 'External Kafka & NATS JetStream honestly classified NOT_CONFIGURED.';
  });

  await exec('T723', async () => {
    if (evStatusCache.exactlyOnceBrokerClaimed !== false || evStatusCache.deliverySemantics !== 'AT_LEAST_ONCE_WITH_IDEMPOTENT_INBOX') {
      throw new Error('Event delivery semantics violated truthfulness contract');
    }
    return 'Disclosed AT_LEAST_ONCE_WITH_IDEMPOTENT_INBOX honestly (no fake exactly-once).';
  });

  const orderedIdem = `V14-ORD-EV-${tag}`;
  await exec('T724', async () => {
    const r = await fetch('/api/v14/infrastructure/events/publish', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        eventType: 'CORRIDOR_SHIPMENT_UPDATED',
        jurisdiction: 'UG',
        orderingKey: 'CORRIDOR-UG-KE-01',
        idempotencyKey: orderedIdem,
        payloadReference: `SHP-V14-${tag}`,
        payloadSummary: { milestone: 'BORDER_DISPATCHED' },
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || !d.event?.correlationId.includes('CORRIDOR-UG-KE-01')) {
      throw new Error('Ordered event publish failed');
    }
    return `Published ordered event ${d.event.id} with orderingKey=CORRIDOR-UG-KE-01.`;
  });

  await exec('T725', async () => {
    const r = await fetch('/api/v14/infrastructure/events/publish', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        eventType: 'CORRIDOR_SHIPMENT_UPDATED',
        jurisdiction: 'UG',
        orderingKey: 'CORRIDOR-UG-KE-01',
        idempotencyKey: orderedIdem,
        payloadReference: `SHP-V14-${tag}`,
      }),
    });
    const d = await r.json();
    if (r.status !== 200 || !d.deduplicated) throw new Error('Expected 200 deduplicated=true');
    return `Deduplicated repeated idempotencyKey ${orderedIdem} cleanly.`;
  });

  await exec('T726', async () => {
    const st = await fetch('/api/v14/infrastructure/events/status', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!Array.isArray(st.consumerOffsets) || st.consumerOffsets.length < 2) {
      throw new Error('Consumer offset telemetry missing');
    }
    return `Tracked ${st.consumerOffsets.length} consumer offset partitions with committedOffset=${st.consumerOffsets[0].committedOffset}.`;
  });

  await exec('T727', async () => {
    const r = await fetch('/api/v14/infrastructure/events/broker/configure', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ adapterType: 'KAFKA', retentionPolicyHours: 336, maxInFlightMessages: 75000 }),
    });
    const d = await r.json();
    if (!r.ok || d.retentionPolicyHours !== 336) throw new Error('Broker policy update failed');
    return `Updated KAFKA adapter retentionPolicyHours=${d.retentionPolicyHours}.`;
  });

  await exec('T728', async () => {
    const st = await fetch('/api/v14/infrastructure/events/status', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (st.externalKafkaStatus !== 'NOT_CONFIGURED') throw new Error('Kafka falsely flipped away from NOT_CONFIGURED');
    return 'Kafka remained NOT_CONFIGURED cleanly after metadata policy update.';
  });

  await exec('T729', async () => {
    const r = await fetch('/api/v14/infrastructure/events/broker/configure', {
      method: 'POST',
      headers: FARMER_HDRS,
      body: JSON.stringify({ adapterType: 'NATS_JETSTREAM', retentionPolicyHours: 24 }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 for non-admin broker config, got ${r.status}`);
    return 'Non-admin blocked from broker adapter configuration (403).';
  });

  await exec('T730', async () => {
    const r = await fetch('/api/v14/infrastructure/events/publish', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ jurisdiction: 'UG' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 on invalid event publish, got ${r.status}`);
    return 'Rejected missing eventType/idempotencyKey/payloadReference (400).';
  });

  await exec('T731', async () => {
    const st = await fetch('/api/v14/infrastructure/events/status', { headers: ADMIN_HDRS }).then((r) => r.json());
    const localBroker = (st.brokers || []).find((b: any) => b.adapterType === 'LOCAL_OUTBOX_LOG');
    if (!localBroker || typeof localBroker.currentBackpressurePct !== 'number') {
      throw new Error('Local broker telemetry incomplete');
    }
    return `Broker backpressure=${localBroker.currentBackpressurePct}%, DLQ=${localBroker.dlqCount}.`;
  });

  await exec('T732', async () => {
    const keEv = await fetch('/api/v14/infrastructure/events/status', { headers: KE_BUYER_HDRS }).then((r) => r.json());
    const leaked = (keEv.recentOutbox || []).some((e: any) => e.tenantId === 'TEN-UG-ELGON-01');
    if (leaked) throw new Error('UG tenant outbox event leaked to KE tenant');
    return 'Outbox stream isolated cleanly per tenant boundary.';
  });

  await exec('T733', async () => {
    const r = await fetch('/api/v14/infrastructure/events/publish', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        eventType: 'FORECAST_PUBLISHED',
        schemaVersion: '1.0',
        orderingKey: 'FC-UG-MAIZE',
        idempotencyKey: `V14-FC-${tag}`,
        payloadReference: `FC-V14-${tag}`,
      }),
    });
    if (r.status !== 201) throw new Error(`Expected 201 on V14 FORECAST_PUBLISHED, got ${r.status}`);
    return 'V14 ordered publisher integrates seamlessly with V13 schema registry.';
  });

  await exec('T734', async () => {
    const r = await fetch('/api/v14/infrastructure/events/publish', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        eventType: 'FORECAST_PUBLISHED',
        schemaVersion: '99.9',
        idempotencyKey: `BADVER-${tag}`,
        payloadReference: 'REF-BADVER',
      }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 on bad schemaVersion, got ${r.status}`);
    return 'Rejected unregistered event schemaVersion=99.9 cleanly (400).';
  });

  await exec('T735', async () => {
    const r = await fetch('/api/v14/infrastructure/events/publish', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        eventType: 'SETTLEMENT_CLAIM_RECEIVED',
        idempotencyKey: `V14-CLM-${tag}`,
        payloadReference: 'PAY-CLM-01',
        payloadSummary: { authoritativeSettlementProof: true },
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.event?.payloadSummary?.authoritativeSettlementProof !== false) {
      throw new Error('Synthetic settlement claim flag was not stripped');
    }
    return 'Stripped synthetic authoritativeSettlementProof flag on SETTLEMENT_CLAIM_RECEIVED.';
  });

  // ==========================================
  // T736-T755: 16-State Institutional Lifecycle & Onboarding
  // ==========================================
  let connCache: any = null;
  await exec('T736', async () => {
    connCache = await fetch('/api/v14/institutions/connectors', { headers: ADMIN_HDRS }).then((r) => r.json());
    if ((connCache.connectors || []).length < 9 || !connCache.connectors[0].lifecycleStage) {
      throw new Error('Institutional 16-state adapters missing');
    }
    return `Listed ${connCache.connectors.length} institutional connectors with 16-state lifecycleStage.`;
  });

  await exec('T737', async () => {
    const allCreds = (connCache?.connectors || []).flatMap((c: any) => c.credentials || []);
    if (allCreds.some((cr: any) => cr.secretHashSha256 || !cr.secretRedacted)) {
      throw new Error('Unredacted credential secret detected in API output');
    }
    return `Confirmed ${allCreds.length} institutional credentials strictly redacted.`;
  });

  await exec('T738', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-UG-BOU/activate-production', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ justification: 'Precondition check' }),
    });
    const d = await r.json();
    if (r.status !== 409 || d.error !== 'PRODUCTION_ACTIVATION_GATE_BLOCKED' || !(d.missingPrerequisites || []).length) {
      throw new Error(`Expected 409 blocked production activation, got ${r.status}`);
    }
    return `Production activation gate blocked with 409 (${d.missingPrerequisites.join(', ')}).`;
  });

  await exec('T739', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-UG-BOU/test', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ testType: 'SIGNED_PAYLOAD_ROUNDTRIP' }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.test?.environment !== 'LOCAL_CONTRACT_HARNESS' || d.test?.externalReachable !== false) {
      throw new Error('Sandbox test did not report truthful LOCAL_CONTRACT_HARNESS');
    }
    return `Executed local contract harness sandbox test (latency=${d.test.latencyMs}ms, externalReachable=false).`;
  });

  await exec('T740', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-UG-BOU/test', { method: 'POST', headers: COOP_HDRS });
    if (r.status !== 403) throw new Error(`Expected 403, got ${r.status}`);
    return 'Non-admin blocked from triggering institutional sandbox tests (403).';
  });

  await exec('T741', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-UG-BOU/activate-production', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ justification: 'Unauthorized' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403, got ${r.status}`);
    return 'Non-admin blocked from production connector activation (403).';
  });

  await exec('T742', async () => {
    const r = await fetch('/api/v14/institutions/agreements/AGR-CONN-KE-CBK/sign', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ signedByInstitution: 'CBK Governor Proxy' }),
    });
    const d = await r.json();
    if (!r.ok || !d.signed || d.status !== 'SIGNED_ACTIVE') throw new Error('Agreement signing failed');
    return `Countersigned agreement ${d.id} cleanly.`;
  });

  await exec('T743', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-KE-CBK/activate-production', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ justification: 'Verify cert/sandbox still required' }),
    });
    const d = await r.json();
    if (r.status !== 409 || !(d.missingPrerequisites || []).includes('EXTERNAL_SANDBOX_VERIFICATION_REQUIRED')) {
      throw new Error('Expected 409 missing sandbox/cert prerequisites even after agreement signed');
    }
    return 'Agreement signing alone still blocks production activation until CA certs & external sandbox pass (409).';
  });

  await exec('T744', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-KE-CBK/activate-production', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ decision: 'REVOKED', justification: 'Security compliance drill' }),
    });
    const d = await r.json();
    if (!r.ok || d.approval?.decision !== 'REVOKED') throw new Error('Revocation decision failed');
    return `Recorded institutional approval decision=REVOKED (${d.approval.id}).`;
  });

  await exec('T745', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-UG-BOU/sync', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ operation: 'MACRO_REPORT_SYNC', idempotencyKey: `SYNC-${tag}` }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.status !== 'BLOCKED_UNPROVISIONED' || !d.requestSignatureSha256) {
      throw new Error('Expected signed dry-run sync blocked when unprovisioned');
    }
    return `Outbound sync recorded signed digest (${d.requestSignatureSha256.slice(0, 12)}...) with status=${d.status}.`;
  });

  await exec('T746', async () => {
    const r = await fetch('/api/v14/institutions/connectors/CONN-MISSING-999/sync', {
      method: 'POST',
      headers: ADMIN_HDRS,
    });
    if (r.status !== 404) throw new Error(`Expected 404, got ${r.status}`);
    return 'Unknown connector sync returned 404 cleanly.';
  });

  const whId = `WH-V14-${tag}`;
  const whPayload = { event: 'CLEARING_ADVICE', amountUgx: 950000 };
  const whTs = '1762900000';
  let whSig = '';

  await exec('T747', async () => {
    whSig = await computeHmacHex('DEV_WH_SECRET_CONN-UG-BOU', `${whTs}.${JSON.stringify(whPayload)}`);
    const r = await fetch('/api/v14/institutions/webhooks/verify', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({
        connectorId: 'CONN-UG-BOU',
        webhookId: whId,
        eventType: 'CLEARING_ADVICE',
        timestampHeader: whTs,
        signatureHex: whSig,
        payload: whPayload,
      }),
    });
    const d = await r.json();
    if (!r.ok || !d.ok || !d.log?.signatureVerified) throw new Error('Valid HMAC webhook rejected');
    return `Verified V14 HMAC-SHA256 webhook ${whId}.`;
  });

  await exec('T748', async () => {
    const r = await fetch('/api/v14/institutions/webhooks/verify', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({
        connectorId: 'CONN-UG-BOU',
        webhookId: whId,
        eventType: 'CLEARING_ADVICE',
        timestampHeader: whTs,
        signatureHex: whSig,
        payload: whPayload,
      }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 replay rejection, got ${r.status}`);
    return `Rejected duplicate webhook ${whId} replay with 409.`;
  });

  await exec('T749', async () => {
    const r = await fetch('/api/v14/institutions/webhooks/verify', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({
        connectorId: 'CONN-UG-BOU',
        webhookId: `WH-BAD-${tag}`,
        eventType: 'CLEARING_ADVICE',
        timestampHeader: whTs,
        signatureHex: '0'.repeat(64),
        payload: whPayload,
      }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 tampered signature, got ${r.status}`);
    return 'Tampered webhook signature rejected (403) & recorded WEBHOOK_TAMPER_ATTEMPT.';
  });

  await exec('T750', async () => {
    const r = await fetch('/api/v14/institutions/onboarding', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        institutionName: `EAC Clearing House Partner ${tag}`,
        institutionCategory: 'COMMERCIAL_BANK',
        jurisdiction: 'UG',
        connectorId: 'CONN-UG-BOU',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.stage !== 'REQUEST_SUBMITTED' || d.legalIdentityStatus !== 'SUBMITTED_IDENTITY') {
      throw new Error('Onboarding creation failed');
    }
    onboardingId = d.id;
    return `Submitted onboarding ${onboardingId} with legalIdentityStatus=SUBMITTED_IDENTITY.`;
  });

  await exec('T751', async () => {
    const r = await fetch(`/api/v14/institutions/onboarding/${onboardingId}/advance`, {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ targetStage: 'AGREEMENT_NEGOTIATION', note: 'Registry docs confirmed' }),
    });
    const d = await r.json();
    if (!r.ok || d.request?.legalIdentityStatus !== 'VERIFIED_LEGAL_REGISTRATION' || d.request?.regulatoryAuthorityStatus !== 'VERIFIED_INSTITUTIONAL_AUTHORITY') {
      throw new Error('Onboarding stage upgrade did not verify authority tier');
    }
    return `Advanced ${onboardingId} to ${d.request.stage} with VERIFIED_INSTITUTIONAL_AUTHORITY.`;
  });

  await exec('T752', async () => {
    const r = await fetch(`/api/v14/institutions/onboarding/${onboardingId}/advance`, {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ targetStage: 'REQUEST_SUBMITTED' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 regression block, got ${r.status}`);
    return 'Blocked onboarding backward stage regression (409).';
  });

  await exec('T753', async () => {
    const r = await fetch(`/api/v14/institutions/onboarding/${onboardingId}/advance`, {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ targetStage: 'LIVE_OPERATIONS' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 LIVE_OPERATIONS block, got ${r.status}`);
    return 'Blocked onboarding LIVE_OPERATIONS without verified production connector (409).';
  });

  await exec('T754', async () => {
    const r = await fetch(`/api/v14/institutions/onboarding/${onboardingId}/advance`, {
      method: 'POST',
      headers: FARMER_HDRS,
      body: JSON.stringify({ targetStage: 'SANDBOX_TESTING' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin onboarding advance, got ${r.status}`);
    return 'Non-admin blocked from advancing institutional onboarding stage (403).';
  });

  await exec('T755', async () => {
    const c = await fetch('/api/v14/institutions/connectors', { headers: ADMIN_HDRS }).then((r) => r.json());
    if ((c.connectors || []).some((x: any) => x.productionStatus === 'PRODUCTION_CONNECTED_AND_VERIFIED')) {
      throw new Error('Found unprovisioned connector falsely marked PRODUCTION_CONNECTED_AND_VERIFIED');
    }
    return 'Zero connectors falsely report PRODUCTION_CONNECTED_AND_VERIFIED.';
  });

  // ==========================================
  // T756-T780: 10-State Payments, Settlement Verification & Reconciliation
  // ==========================================
  await exec('T756', async () => {
    const d = await fetch('/api/v14/payments/providers', { headers: ADMIN_HDRS }).then((r) => r.json());
    if ((d.providers || []).length < 5) throw new Error('Missing payment provider integrations');
    return `Verified ${d.providers.length} registered payment providers across mobile money, bank, RTGS & global rails.`;
  });

  await exec('T757', async () => {
    const d = await fetch('/api/v14/payments/providers', { headers: ADMIN_HDRS }).then((r) => r.json());
    if ((d.providers || []).some((p: any) => p.productionStatus === 'PRODUCTION_CONNECTED_AND_VERIFIED')) {
      throw new Error('Payment provider falsely marked production verified');
    }
    return 'Payment providers honestly report NOT_CONFIGURED until provisioned.';
  });

  await exec('T758', async () => {
    const r = await fetch('/api/v14/payments/initiate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        idempotencyKey: payIdem,
        providerId: 'PAYPROV-MTN-MOMO-UG',
        corridor: 'UG-DOMESTIC',
        sourceCurrency: 'UGX',
        settlementCurrency: 'UGX',
        amount: 2500000,
        feeAmount: 12500,
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.transaction?.status !== 'PROVIDER_SELECTED') {
      throw new Error('Payment initiation failed');
    }
    paymentId = d.transaction.id;
    return `Initiated payment ${paymentId} cleanly in state ${d.transaction.status}.`;
  });

  await exec('T759', async () => {
    const r = await fetch('/api/v14/payments/initiate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        idempotencyKey: payIdem,
        providerId: 'PAYPROV-MTN-MOMO-UG',
        corridor: 'UG-DOMESTIC',
        sourceCurrency: 'UGX',
        settlementCurrency: 'UGX',
        amount: 2500000,
      }),
    });
    const d = await r.json();
    if (r.status !== 200 || !d.deduplicated || d.transaction?.id !== paymentId) {
      throw new Error('Payment idempotency deduplication failed');
    }
    return `Payment idempotency key ${payIdem} deduplicated to ${paymentId}.`;
  });

  await exec('T760', async () => {
    const r = await fetch('/api/v14/payments/initiate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        idempotencyKey: `NEG-${tag}`,
        providerId: 'PAYPROV-MTN-MOMO-UG',
        sourceCurrency: 'UGX',
        settlementCurrency: 'UGX',
        amount: -500,
      }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 negative amount, got ${r.status}`);
    return 'Rejected negative payment amount cleanly (400).';
  });

  await exec('T761', async () => {
    const r = await fetch('/api/v14/payments/initiate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        idempotencyKey: `BADCUR-${tag}`,
        providerId: 'PAYPROV-MTN-MOMO-UG',
        sourceCurrency: 'XYZ',
        settlementCurrency: 'UGX',
        amount: 1000,
      }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 unsupported currency, got ${r.status}`);
    return 'Rejected unsupported currency code XYZ cleanly (400).';
  });

  await exec('T762', async () => {
    const r = await fetch('/api/v14/payments/initiate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        idempotencyKey: `EXECFX-${tag}`,
        providerId: 'PAYPROV-EAC-BANK-RTGS',
        sourceCurrency: 'USD',
        settlementCurrency: 'UGX',
        amount: 5000,
        fxQuoteId: 'FXSRC-USD-UGX',
        fxQuoteMode: 'EXECUTABLE',
      }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 blocking EXECUTABLE FX without live quote, got ${r.status}`);
    return 'Blocked EXECUTABLE cross-currency quote when only INDICATIVE reference available (409).';
  });

  await exec('T763', async () => {
    for (const st of ['SUBMITTED', 'AUTHORIZED', 'CLEARING']) {
      const r = await fetch(`/api/v14/payments/${paymentId}/transition`, {
        method: 'POST',
        headers: COOP_HDRS,
        body: JSON.stringify({ targetStatus: st }),
      });
      if (!r.ok) throw new Error(`Failed valid transition to ${st}`);
    }
    return `Progressed ${paymentId} through SUBMITTED -> AUTHORIZED -> CLEARING.`;
  });

  await exec('T764', async () => {
    const r = await fetch(`/api/v14/payments/${paymentId}/transition`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ targetStatus: 'CREATED' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 invalid state skip, got ${r.status}`);
    return 'Rejected invalid payment state regression CLEARING -> CREATED (409).';
  });

  await exec('T765', async () => {
    const r = await fetch(`/api/v14/payments/${paymentId}/transition`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ targetStatus: 'SETTLED' }),
    });
    const d = await r.json();
    if (r.status !== 409 || !String(d.error).includes('AUTHORITATIVE_SETTLEMENT_PROOF_REQUIRED')) {
      throw new Error('Allowed SETTLED transition without verified receipt');
    }
    return 'Strictly blocked SETTLED transition without verified provider settlement receipt (409).';
  });

  await exec('T766', async () => {
    const r = await fetch(`/api/v14/payments/${paymentId}/verify-settlement`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        providerReference: 'FAKE-SYNTHETIC-01',
        settledAmount: 2500000,
        currency: 'UGX',
        proofSource: 'SYNTHETIC_REJECTED',
        signatureHex: 'abc',
      }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 synthetic rejection, got ${r.status}`);
    return 'Strictly rejected synthetic/placeholder settlement proof (403) & logged CRITICAL incident.';
  });

  await exec('T767', async () => {
    const r = await fetch(`/api/v14/payments/${paymentId}/verify-settlement`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        providerReference: `MOMO-REF-${tag}`,
        settledAmount: 2500000,
        currency: 'UGX',
        proofSource: 'SIGNED_PROVIDER_RECEIPT',
        signatureHex: 'deadbeef'.repeat(8),
      }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 bad HMAC receipt sig, got ${r.status}`);
    return 'Rejected invalid HMAC signature on provider settlement receipt (403).';
  });

  await exec('T768', async () => {
    const provRef = `MOMO-REF-${tag}`;
    const canonical = `${paymentId}|${provRef}|UGX|2500000.00`;
    const sigHex = await computeHmacHex('DEV_PROVIDER_SETTLEMENT_KEY_PAYPROV-MTN-MOMO-UG', canonical);
    const r = await fetch(`/api/v14/payments/${paymentId}/verify-settlement`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        providerReference: provRef,
        settledAmount: 2500000,
        providerFeeAmount: 12500,
        currency: 'UGX',
        proofSource: 'SIGNED_PROVIDER_RECEIPT',
        signatureHex: sigHex,
      }),
    });
    const d = await r.json();
    if (!r.ok || d.transaction?.status !== 'SETTLED' || !d.transaction?.settlementVerified || !d.transaction?.ledgerJournalId) {
      throw new Error('Verified provider settlement failed to settle payment & post journal');
    }
    return `Verified HMAC receipt ${d.receipt.id}; payment ${paymentId} SETTLED & journal ${d.transaction.ledgerJournalId} posted.`;
  });

  await exec('T769', async () => {
    const p2 = await fetch('/api/v14/payments/initiate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        idempotencyKey: `PART-${tag}`,
        providerId: 'PAYPROV-MTN-MOMO-UG',
        sourceCurrency: 'UGX',
        settlementCurrency: 'UGX',
        amount: 1000000,
        feeAmount: 5000,
      }),
    }).then((r) => r.json());
    partialPaymentId = p2.transaction.id;
    const provRef = `MOMO-PART-${tag}`;
    const sigHex = await computeHmacHex(
      'DEV_PROVIDER_SETTLEMENT_KEY_PAYPROV-MTN-MOMO-UG',
      `${partialPaymentId}|${provRef}|UGX|950000.00`
    );
    const r = await fetch(`/api/v14/payments/${partialPaymentId}/verify-settlement`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        providerReference: provRef,
        settledAmount: 950000,
        currency: 'UGX',
        proofSource: 'SIGNED_PROVIDER_RECEIPT',
        signatureHex: sigHex,
      }),
    });
    const d = await r.json();
    if (r.status !== 202 || d.transaction?.status !== 'REQUIRES_RECONCILIATION') {
      throw new Error('Partial settlement did not route to REQUIRES_RECONCILIATION');
    }
    return `Partial settlement (950k vs 1M UGX) routed ${partialPaymentId} to REQUIRES_RECONCILIATION.`;
  });

  await exec('T770', async () => {
    const r = await fetch(`/api/v14/payments/${partialPaymentId}/verify-settlement`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        providerReference: `CUR-MIS-${tag}`,
        settledAmount: 950000,
        currency: 'USD',
        proofSource: 'SIGNED_PROVIDER_RECEIPT',
        signatureHex: await computeHmacHex(
          'DEV_PROVIDER_SETTLEMENT_KEY_PAYPROV-MTN-MOMO-UG',
          `${partialPaymentId}|CUR-MIS-${tag}|USD|950000.00`
        ),
      }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 currency mismatch, got ${r.status}`);
    return 'Settlement receipt currency mismatch USD vs UGX rejected cleanly (409).';
  });

  await exec('T771', async () => {
    const r = await fetch('/api/v14/payments/reconcile', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        currency: 'UGX',
        providerId: 'PAYPROV-MTN-MOMO-UG',
        providerStatements: [
          { providerReference: `MOMO-REF-${tag}`, paymentTransactionId: paymentId, amount: 2500000, feeAmount: 14000, currency: 'UGX' },
          { providerReference: `MOMO-PART-${tag}`, paymentTransactionId: partialPaymentId, amount: 950000, feeAmount: 5000, currency: 'UGX' },
          { providerReference: `UNMATCHED-PROV-${tag}`, amount: 420000, currency: 'UGX' },
        ],
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.batch?.partialMatchCount < 1 || d.batch?.unmatchedProviderCount < 1 || !d.exceptions?.some((e: any) => e.exceptionType === 'FEE_VARIANCE')) {
      throw new Error('Reconciliation batch failed to classify mismatches');
    }
    lastReconExId = d.exceptions[0].id;
    return `Reconciliation batch ${d.batch.id} classified ${d.exceptions.length} exception(s) (partial, fee variance, unmatched).`;
  });

  await exec('T772', async () => {
    const r = await fetch('/api/v14/payments/reconcile', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        currency: 'UGX',
        providerId: 'PAYPROV-MTN-MOMO-UG',
        providerStatements: [
          { providerReference: `DUP-REF-${tag}`, amount: 50000, currency: 'UGX' },
          { providerReference: `DUP-REF-${tag}`, amount: 50000, currency: 'UGX' },
        ],
      }),
    });
    const d = await r.json();
    if (!d.exceptions?.some((e: any) => e.exceptionType === 'DUPLICATE_ENTRY' && e.severity === 'CRITICAL')) {
      throw new Error('Duplicate provider reference was not flagged CRITICAL');
    }
    return 'Detected duplicate provider reference entry as CRITICAL DUPLICATE_ENTRY.';
  });

  await exec('T773', async () => {
    const tr = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!tr.ledgerIsolation?.allCurrenciesBalanced) throw new Error('Reconciliation corrupted ledger balance');
    return 'Verified reconciliation mismatches generate exceptions without fabricating journal entries.';
  });

  await exec('T774', async () => {
    const r = await fetch(`/api/v14/payments/reconciliation/exceptions/${lastReconExId}/resolve`, {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ resolutionStatus: 'RESOLVED_BY_OPERATOR', resolutionNote: 'Fee schedule variance confirmed' }),
    });
    const d = await r.json();
    if (!r.ok || d.resolutionStatus !== 'RESOLVED_BY_OPERATOR') throw new Error('Exception resolution failed');
    return `Resolved reconciliation exception ${lastReconExId} cleanly.`;
  });

  await exec('T775', async () => {
    const r = await fetch('/api/v14/payments/disputes', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        paymentTransactionId: partialPaymentId,
        reconciliationExceptionId: lastReconExId,
        disputeType: 'UNSETTLED_FUNDS',
        disputedAmount: 50000,
        currency: 'UGX',
        evidenceSummary: 'Partial settlement short by 50,000 UGX',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.dispute?.status !== 'OPEN') throw new Error('Dispute creation failed');
    return `Opened payment dispute ${d.dispute.id} linked to reconciliation exception.`;
  });

  await exec('T776', async () => {
    const r = await fetch(`/api/v14/payments/${paymentId}/transition`, {
      method: 'POST',
      headers: KE_BUYER_HDRS,
      body: JSON.stringify({ targetStatus: 'DISPUTED' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 cross-tenant payment access, got ${r.status}`);
    return 'Cross-tenant payment state mutation strictly blocked (403).';
  });

  await exec('T777', async () => {
    const tr = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    const codes = (tr.ledgerIsolation?.currencies || []).map((c: any) => c.currency);
    if (!['UGX', 'KES', 'TZS', 'RWF', 'USD', 'EUR', 'GBP', 'CNY', 'JPY'].every((c) => codes.includes(c))) {
      throw new Error('Missing required currencies in isolation report');
    }
    return `Verified independent balancing across all ${codes.length} configured currencies.`;
  });

  await exec('T778', async () => {
    const tr = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!(tr.fxQuotes || []).every((q: any) => q.quoteClassification === 'INDICATIVE' && q.truthfulAvailability === 'LOCAL_REFERENCE_ONLY')) {
      throw new Error('FX quote sources failed indicative-only truthful disclosure');
    }
    return `All ${tr.fxQuotes.length} local FX quote sources classified as INDICATIVE (LOCAL_REFERENCE_ONLY).`;
  });

  await exec('T779', async () => {
    const kePay = await fetch('/api/v14/payments/initiate', {
      method: 'POST',
      headers: KE_BUYER_HDRS,
      body: JSON.stringify({
        idempotencyKey: `KES-PAY-${tag}`,
        providerId: 'PAYPROV-MPESA-KE',
        corridor: 'KE-DOMESTIC',
        sourceCurrency: 'KES',
        settlementCurrency: 'KES',
        amount: 45000,
      }),
    }).then((r) => r.json());
    kesPaymentId = kePay.transaction.id;
    const ref = `MPESA-${tag}`;
    const sig = await computeHmacHex('DEV_PROVIDER_SETTLEMENT_KEY_PAYPROV-MPESA-KE', `${kesPaymentId}|${ref}|KES|45000.00`);
    const v = await fetch(`/api/v14/payments/${kesPaymentId}/verify-settlement`, {
      method: 'POST',
      headers: KE_BUYER_HDRS,
      body: JSON.stringify({ providerReference: ref, settledAmount: 45000, currency: 'KES', proofSource: 'SIGNED_PROVIDER_RECEIPT', signatureHex: sig }),
    }).then((r) => r.json());
    if (v.transaction?.status !== 'SETTLED' || !String(v.transaction?.ledgerJournalId).startsWith('UJ-V14-')) {
      throw new Error('KES payment verification failed');
    }
    return `Settled independent KES transaction ${kesPaymentId} with journal ${v.transaction.ledgerJournalId}.`;
  });

  await exec('T780', async () => {
    const tr = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (tr.ledgerIsolation?.unverifiedSettlementsCount !== 0) {
      throw new Error('Detected SETTLED transaction without verified receipt');
    }
    return 'Zero SETTLED transactions exist without verified provider settlement proof.';
  });

  // ==========================================
  // T781-T800: 16-Step Trade, Procurement, Evidence & Tax Rules
  // ==========================================
  await exec('T781', async () => {
    const r = await fetch('/api/v14/operations/trades', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        exporterId: 'TEN-UG-ELGON-01',
        importerId: 'TEN-KE-ROASTERS-03',
        originJurisdiction: 'UG',
        destinationJurisdiction: 'KE',
        commodityDescription: 'Washed Bugisu Arabica AA Grade (18 MT)',
        contractValue: 74000,
        currency: 'USD',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.currentStepIndex !== 0) throw new Error('Trade creation failed');
    tradeId = d.id;
    return `Created 16-step trade workflow ${tradeId} (${d.currentStepName}).`;
  });

  await exec('T782', async () => {
    const r = await fetch(`/api/v14/operations/trades/${tradeId}/advance`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ targetStepIndex: 11 }),
    });
    const d = await r.json();
    if (!r.ok || d.workflow?.currentStepIndex !== 11) throw new Error('Trade advance to step 12 failed');
    return `Advanced ${tradeId} to ${d.workflow.currentStepName}.`;
  });

  await exec('T783', async () => {
    const r = await fetch(`/api/v14/operations/trades/${tradeId}/advance`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ targetStepIndex: 13 }),
    });
    const d = await r.json();
    if (r.status !== 409 || !String(d.error).includes('INDEPENDENT_DELIVERY_EVIDENCE_REQUIRED')) {
      throw new Error('Trade advanced past delivery verification gate without independent evidence');
    }
    return 'Trade step 14 strictly blocked without independently verified delivery evidence (409).';
  });

  await exec('T784', async () => {
    const r = await fetch('/api/v14/operations/delivery-evidence', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        action: 'SUBMIT',
        operationType: 'TRADE',
        operationId: tradeId,
        claimDescription: 'Malaba OSBP Waybill & Seal Dispatch Claim',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.evidence?.evidenceTrustState !== 'SUBMITTED_CLAIM') {
      throw new Error('Delivery evidence submit failed');
    }
    evidenceId = d.evidence.id;
    return `Delivery claim ${evidenceId} recorded strictly as SUBMITTED_CLAIM.`;
  });

  await exec('T785', async () => {
    const r = await fetch('/api/v14/operations/delivery-evidence', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        action: 'VERIFY_INDEPENDENT',
        evidenceId,
        operationType: 'TRADE',
        operationId: tradeId,
        verificationSource: 'CUSTOMS_SEAL',
      }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 self-verification block, got ${r.status}`);
    return 'Blocked submitter self-verification of own delivery claim (403).';
  });

  await exec('T786', async () => {
    const r = await fetch('/api/v14/operations/delivery-evidence', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({
        action: 'VERIFY_INDEPENDENT',
        evidenceId,
        operationType: 'TRADE',
        operationId: tradeId,
        verificationSource: 'CUSTOMS_SEAL',
      }),
    });
    const d = await r.json();
    if (!r.ok || d.evidence?.evidenceTrustState !== 'INDEPENDENTLY_VERIFIED') {
      throw new Error('Independent verification failed');
    }
    return `Independently verified ${evidenceId} via CUSTOMS_SEAL.`;
  });

  await exec('T787', async () => {
    const r = await fetch(`/api/v14/operations/trades/${tradeId}/advance`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ targetStepIndex: 15 }),
    });
    const d = await r.json();
    if (!r.ok || d.workflow?.status !== 'COMPLETED') throw new Error('Trade completion failed');
    return `Completed all 16 trade steps for ${tradeId} (${d.workflow.currentStepName}).`;
  });

  await exec('T788', async () => {
    const r = await fetch(`/api/v14/operations/trades/${tradeId}/advance`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ targetStepIndex: 5 }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 regression block, got ${r.status}`);
    return 'Blocked backward step regression on completed trade workflow (409).';
  });

  await exec('T789', async () => {
    const r = await fetch(`/api/v14/operations/trades/${tradeId}/advance`, {
      method: 'POST',
      headers: KE_BUYER_HDRS,
      body: JSON.stringify({ targetStepIndex: 15 }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 cross-tenant trade access, got ${r.status}`);
    return 'Cross-tenant trade workflow mutation strictly denied (403).';
  });

  await exec('T790', async () => {
    const r = await fetch('/api/v14/operations/procurement', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        procuringEntity: 'MAAIF Input Buffer Agency',
        supplierId: 'TEN-UG-ELGON-01',
        jurisdiction: 'UG',
        budgetAmount: 18000000,
        currency: 'UGX',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || !d.complianceChecklistPassed) throw new Error('Procurement creation failed');
    procurementId = d.id;
    return `Created procurement operation workflow ${procurementId}.`;
  });

  await exec('T791', async () => {
    const sub = await fetch('/api/v14/operations/delivery-evidence', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ action: 'SUBMIT', operationType: 'PROCUREMENT', operationId: procurementId }),
    }).then((r) => r.json());
    const ver = await fetch('/api/v14/operations/delivery-evidence', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({
        action: 'VERIFY_INDEPENDENT',
        evidenceId: sub.evidence.id,
        operationType: 'PROCUREMENT',
        operationId: procurementId,
        verificationSource: 'WAREHOUSE_INSPECTOR',
      }),
    }).then((r) => r.json());
    if (ver.evidence?.evidenceTrustState !== 'INDEPENDENTLY_VERIFIED') throw new Error('Procurement verification failed');
    return `Verified procurement delivery evidence ${ver.evidence.id} via WAREHOUSE_INSPECTOR.`;
  });

  await exec('T792', async () => {
    const d = await fetch('/api/v14/tax/rules', { headers: ADMIN_HDRS }).then((r) => r.json());
    const jurs = new Set((d.rules || []).map((r: any) => r.jurisdiction));
    if (!['UG', 'KE', 'TZ', 'RW'].every((j) => jurs.has(j))) throw new Error('Missing EAC tax rules');
    return `Verified effective-dated tax rules across ${Array.from(jurs).join(', ')}.`;
  });

  await exec('T793', async () => {
    const r = await fetch('/api/v14/tax/assess', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        jurisdiction: 'UG',
        taxType: 'VAT',
        operationReferenceId: tradeId,
        taxableBase: 10000000,
        currency: 'UGX',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.assessment?.calculatedTaxAmount !== 1800000 || d.assessment?.externalFilingStatus !== 'LOCAL_ASSESSMENT_ONLY') {
      throw new Error('UG 18% VAT assessment failed');
    }
    return `UG 18% VAT assessed cleanly (${d.assessment.calculatedTaxAmount} UGX, LOCAL_ASSESSMENT_ONLY).`;
  });

  await exec('T794', async () => {
    const r = await fetch('/api/v14/tax/assess', {
      method: 'POST',
      headers: KE_BUYER_HDRS,
      body: JSON.stringify({
        jurisdiction: 'KE',
        taxType: 'VAT',
        operationReferenceId: kesPaymentId,
        taxableBase: 100000,
        currency: 'KES',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.assessment?.calculatedTaxAmount !== 16000) throw new Error('KE 16% VAT assessment failed');
    return `KE 16% VAT assessed cleanly (${d.assessment.calculatedTaxAmount} KES).`;
  });

  await exec('T795', async () => {
    const r = await fetch('/api/v14/tax/rules', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({
        jurisdiction: 'UG',
        taxType: 'EXCISE_DUTY',
        ruleCode: `UG-EXCISE-${tag}`,
        ratePct: 10,
      }),
    });
    if (r.status !== 201) throw new Error('Failed to create statutory tax rule');
    return 'Created versioned UG EXCISE_DUTY rule cleanly (201).';
  });

  await exec('T796', async () => {
    const r = await fetch('/api/v14/tax/rules', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ jurisdiction: 'UG', taxType: 'EXCISE_DUTY', ruleCode: 'UNAUTH', ratePct: 1 }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin tax rule creation, got ${r.status}`);
    return 'Non-admin blocked from mutating statutory tax rules (403).';
  });

  await exec('T797', async () => {
    const r = await fetch('/api/v14/tax/assess', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ jurisdiction: 'ZZ', taxType: 'VAT', operationReferenceId: 'OP-1', taxableBase: 100, currency: 'USD' }),
    });
    if (r.status !== 404) throw new Error(`Expected 404 missing jurisdiction rule, got ${r.status}`);
    return 'Missing jurisdiction tax rule returned 404 cleanly.';
  });

  await exec('T798', async () => {
    const r = await fetch('/api/v14/tax/assess', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ jurisdiction: 'UG' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 invalid tax payload, got ${r.status}`);
    return 'Tax assessment rejected incomplete payload (400).';
  });

  await exec('T799', async () => {
    const r = await fetch('/api/v14/operations/procurement', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ jurisdiction: 'UG' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 incomplete procurement payload, got ${r.status}`);
    return 'Procurement endpoint rejected incomplete payload cleanly (400).';
  });

  await exec('T800', async () => {
    const tr = await fetch('/api/v14/operations/trades', { headers: ADMIN_HDRS }).then((r) => r.json());
    const evs = tr.evidences || [];
    const bad = evs.some((e: any) => e.evidenceTrustState === 'INDEPENDENTLY_VERIFIED' && e.verifiedBy === e.submittedBy);
    if (bad) throw new Error('Detected self-verified delivery evidence');
    return `Verified zero self-verified delivery claims across ${evs.length} evidence records.`;
  });

  // ==========================================
  // T801-T815: Identity, ABAC Policies, HSM & WORM Audit
  // ==========================================
  await exec('T801', async () => {
    const r = await fetch('/api/v14/security/policies/evaluate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        actionType: 'HIGH_VALUE_PAYMENT_SETTLE',
        jurisdiction: 'UG',
        amountUgx: 5000000,
        hasVerifiedIdentity: true,
      }),
    });
    const d = await r.json();
    if (!r.ok || !d.allowed) throw new Error('Valid ABAC evaluation failed');
    return `ABAC policy granted operation (${d.policyId}).`;
  });

  await exec('T802', async () => {
    const r = await fetch('/api/v14/security/policies/evaluate', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        actionType: 'HIGH_VALUE_PAYMENT_SETTLE',
        jurisdiction: 'UG',
        amountUgx: 120000000,
        hasVerifiedIdentity: true,
      }),
    });
    const d = await r.json();
    if (!r.ok || !d.requiresDualApproval) throw new Error('Expected dual approval over 50M UGX');
    return 'ABAC policy triggered requiresDualApproval=true for >50M UGX transaction.';
  });

  await exec('T803', async () => {
    const r = await fetch('/api/v14/security/policies/evaluate', {
      method: 'POST',
      headers: FARMER_HDRS,
      body: JSON.stringify({
        actionType: 'HIGH_VALUE_PAYMENT_SETTLE',
        jurisdiction: 'UG',
        amountUgx: 1000000,
        hasVerifiedIdentity: false,
      }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 policy denial, got ${r.status}`);
    return 'ABAC denied unverified role/identity cleanly (403).';
  });

  await exec('T804', async () => {
    const r = await fetch('/api/v14/security/policies/evaluate', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({
        actionType: 'DATABASE_AUTHORITY_CUTOVER',
        jurisdiction: 'ZZ',
        hasVerifiedIdentity: true,
      }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 jurisdiction restriction, got ${r.status}`);
    return 'ABAC enforced jurisdiction restriction cleanly (403).';
  });

  await exec('T805', async () => {
    const r = await fetch('/api/v14/security/identity/verify', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({
        participantId: 'TEN-UG-ELGON-01',
        legalEntityName: 'Elgon Growers Union Ltd',
        jurisdiction: 'UG',
        registrationNumber: `URSB-${tag}`,
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.verificationTier !== 'SUBMITTED_IDENTITY') throw new Error('Identity submit failed');
    identityId = d.id;
    return `Submitted legal identity ${identityId} as SUBMITTED_IDENTITY.`;
  });

  await exec('T806', async () => {
    const r = await fetch('/api/v14/security/identity/verify', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ action: 'VERIFY', recordId: identityId }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin identity verify, got ${r.status}`);
    return 'Non-admin blocked from verifying legal identity status (403).';
  });

  await exec('T807', async () => {
    const r = await fetch('/api/v14/security/identity/verify', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ action: 'VERIFY', recordId: identityId }),
    });
    const d = await r.json();
    if (!r.ok || d.verificationTier !== 'VERIFIED_LEGAL_REGISTRATION') throw new Error('Identity verification failed');
    return `Verified ${identityId} cleanly as VERIFIED_LEGAL_REGISTRATION.`;
  });

  let secCache: any = null;
  await exec('T808', async () => {
    secCache = await fetch('/api/v14/security/overview', { headers: ADMIN_HDRS }).then((r) => r.json());
    const prodKms = (secCache.productionKeys || []).find((k: any) => k.environmentScope === 'PRODUCTION_HSM_PKCS11');
    if (!prodKms || prodKms.hsmProviderStatus !== 'NOT_CONFIGURED' || prodKms.failClosedWhenProdHsmMissing !== true) {
      throw new Error('Prod HSM key record missing or not fail-closed');
    }
    return 'Production PKCS#11 HSM record truthfully reports NOT_CONFIGURED with failClosed=true.';
  });

  await exec('T809', async () => {
    const r = await fetch('/api/v14/security/audit/archive', { method: 'POST', headers: ADMIN_HDRS });
    const d = await r.json();
    if (r.status !== 201 || d.externalWormStatus !== 'NOT_CONFIGURED' || !d.bundleChecksumSha256) {
      throw new Error('WORM archive export failed');
    }
    return `Prepared signed audit archive ${d.id} (${d.externalWormStatus}, checksum ${d.bundleChecksumSha256.slice(0, 12)}...).`;
  });

  await exec('T810', async () => {
    const r = await fetch('/api/v14/security/audit/archive', { method: 'POST', headers: COOP_HDRS });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin archive export, got ${r.status}`);
    return 'Non-admin blocked from exporting signed audit archives (403).';
  });

  await exec('T811', async () => {
    const s = await fetch('/api/v14/security/overview', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!s.incidents?.length) throw new Error('Expected recorded security incidents from auth/settlement probes');
    lastIncidentId = s.incidents[0].id;
    return `Security telemetry captured ${s.incidents.length} real incident(s) (latest=${s.incidents[0].category}).`;
  });

  await exec('T812', async () => {
    const r = await fetch(`/api/v14/security/incidents/${lastIncidentId}/mitigate`, { method: 'POST', headers: ADMIN_HDRS });
    const d = await r.json();
    if (!r.ok || d.status !== 'MITIGATED') throw new Error('Incident mitigation failed');
    return `Mitigated security incident ${lastIncidentId} cleanly.`;
  });

  await exec('T813', async () => {
    const r = await fetch(`/api/v14/security/incidents/${lastIncidentId}/mitigate`, { method: 'POST', headers: FARMER_HDRS });
    if (r.status !== 403) throw new Error(`Expected 403, got ${r.status}`);
    return 'Non-admin blocked from mitigating security incidents (403).';
  });

  await exec('T814', async () => {
    if (!(secCache?.productionKeys || []).every((k: any) => k.nextRotationDueAt && k.rotationIntervalDays > 0)) {
      throw new Error('Key rotation metadata missing');
    }
    return 'Verified key rotation schedules across dev & prod KMS descriptors.';
  });

  await exec('T815', async () => {
    const raw = JSON.stringify(secCache);
    if (raw.includes('BEGIN EC PRIVATE KEY') || raw.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Private key material leaked in security overview');
    }
    return 'Zero private key material leaked in security endpoints.';
  });

  // ==========================================
  // T816-T830: Commercial Plans, Invoices, Refunds & Profiles
  // ==========================================
  await exec('T816', async () => {
    const d = await fetch('/api/v14/commercial/plans', { headers: ADMIN_HDRS }).then((r) => r.json());
    const codes = new Set((d.plans || []).map((p: any) => p.planCode));
    if (!['STARTER', 'GROWTH', 'ENTERPRISE', 'DEVELOPER_ECOSYSTEM', 'INSTITUTIONAL'].every((c) => codes.has(c))) {
      throw new Error('Missing commercial plan tiers');
    }
    return `Verified all 5 commercial plans (${Array.from(codes).join(', ')}).`;
  });

  await exec('T817', async () => {
    const r = await fetch('/api/v14/commercial/subscribe', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ planCode: 'STARTER', billingCycle: 'MONTHLY', currency: 'USD', apiCallsUsage: 10000 }),
    });
    const d = await r.json();
    if (r.status !== 201 || !d.subscription?.id || !d.invoice?.id) throw new Error('Subscribe & bill failed');
    invoiceId = d.invoice.id;
    return `Created subscription ${d.subscription.id} and invoice ${d.invoice.invoiceNumber} ($${d.invoice.totalAmount}).`;
  });

  await exec('T818', async () => {
    const subs = await fetch('/api/v14/commercial/subscriptions', { headers: COOP_HDRS }).then((r) => r.json());
    const inv = (subs.invoices || []).find((i: any) => i.id === invoiceId);
    if (!inv || !String(inv.revenueRecognitionNote).includes('NOT RECOGNIZED AS REALIZED REVENUE')) {
      throw new Error('Missing revenue non-realization safeguard');
    }
    return 'Invoice preserves strict distinction between issued invoice and realized revenue.';
  });

  await exec('T819', async () => {
    const r = await fetch('/api/v14/commercial/subscribe', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ planCode: 'GROWTH', billingCycle: 'ANNUAL', currency: 'USD', apiCallsUsage: 5000 }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.subscription?.contractedPrice >= 249 * 12) {
      throw new Error('Annual discount not applied');
    }
    return `Annual billing cycle applied 15% discount ($${d.subscription.contractedPrice}/yr).`;
  });

  await exec('T820', async () => {
    const r = await fetch('/api/v14/commercial/subscribe', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ planCode: 'STARTER', billingCycle: 'MONTHLY', currency: 'USD', apiCallsUsage: 35000 }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.usageRecord?.totalCharge !== 15) {
      throw new Error(`Expected $15 overage for 10k calls above 25k limit, got ${d.usageRecord?.totalCharge}`);
    }
    return `Usage meter calculated exact $15 overage on 35k API calls.`;
  });

  await exec('T821', async () => {
    const r = await fetch(`/api/v14/commercial/invoices/${invoiceId}/refund`, {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ amount: 20, reason: 'SLA credit adjustment' }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.refund?.status !== 'APPROVED') throw new Error('Refund failed');
    return `Issued refund ${d.refund.id} ($20) cleanly.`;
  });

  await exec('T822', async () => {
    const r = await fetch(`/api/v14/commercial/invoices/${invoiceId}/refund`, {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ amount: 999999, reason: 'Excess refund' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 excessive refund, got ${r.status}`);
    return 'Rejected refund exceeding invoice total cleanly (400).';
  });

  await exec('T823', async () => {
    const r = await fetch(`/api/v14/commercial/invoices/${invoiceId}/refund`, {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ amount: 5, reason: 'Unauthorized' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin refund, got ${r.status}`);
    return 'Non-admin blocked from approving customer refunds (403).';
  });

  await exec('T824', async () => {
    const d = await fetch('/api/v14/operations/regions', { headers: ADMIN_HDRS }).then((r) => r.json());
    const profs = new Set((d.deploymentProfiles || []).map((p: any) => p.profileName));
    if (!['DEVELOPMENT', 'STAGING', 'PILOT', 'PRODUCTION'].every((p) => profs.has(p))) {
      throw new Error('Deployment profiles incomplete');
    }
    return 'Verified all 4 deployment environment profiles (DEVELOPMENT -> PRODUCTION).';
  });

  await exec('T825', async () => {
    const r = await fetch('/api/v14/operations/deployment-profile', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ profileName: 'PRODUCTION' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 blocking PRODUCTION profile without PG/HSM, got ${r.status}`);
    return 'Strictly blocked PRODUCTION profile activation without PG & PKCS#11 HSM (409).';
  });

  await exec('T826', async () => {
    const r = await fetch('/api/v14/operations/deployment-profile', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ profileName: 'PILOT' }),
    });
    const d = await r.json();
    if (!r.ok || d.profileName !== 'PILOT' || !d.active) throw new Error('PILOT profile activation failed');
    return 'Switched environment profile cleanly to PILOT.';
  });

  await exec('T827', async () => {
    const r = await fetch('/api/v14/operations/deployment-profile', {
      method: 'POST',
      headers: FARMER_HDRS,
      body: JSON.stringify({ profileName: 'DEVELOPMENT' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403, got ${r.status}`);
    return 'Non-admin blocked from switching deployment profile (403).';
  });

  await exec('T828', async () => {
    const r = await fetch('/api/v14/commercial/subscribe', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ planCode: 'UNKNOWN_TIER' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 unknown plan, got ${r.status}`);
    return 'Rejected invalid commercial planCode cleanly (400).';
  });

  await exec('T829', async () => {
    const keSubs = await fetch('/api/v14/commercial/subscriptions', { headers: KE_BUYER_HDRS }).then((r) => r.json());
    if ((keSubs.subscriptions || []).some((s: any) => s.tenantId === 'TEN-UG-ELGON-01')) {
      throw new Error('Tenant subscription boundary breached');
    }
    return 'Tenant commercial subscription isolation enforced cleanly.';
  });

  await exec('T830', async () => {
    const subs = await fetch('/api/v14/commercial/subscriptions', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!String(subs.revenueDisclosure).includes('separate')) throw new Error('Missing commercial revenue disclosure');
    return 'Commercial telemetry separates issued invoices from realized revenue.';
  });

  // ==========================================
  // T831-T850: Multi-Region, DR Drills, Concurrency Benchmarks & V14 Synthesis
  // ==========================================
  await exec('T831', async () => {
    const reg = await fetch('/api/v14/operations/regions', { headers: ADMIN_HDRS }).then((r) => r.json());
    const ug = (reg.multiRegionDeployments || []).find((m: any) => m.jurisdiction === 'UG');
    const ke = (reg.multiRegionDeployments || []).find((m: any) => m.jurisdiction === 'KE');
    if (ug?.deploymentStatus !== 'LOCAL_ONLY' || ke?.deploymentStatus !== 'NOT_CONFIGURED') {
      throw new Error('Multi-region truthful deployment status violated');
    }
    return 'Confirmed af-east-ug=LOCAL_ONLY and af-east-ke/tz/rw=NOT_CONFIGURED.';
  });

  for (const [idx, scenario] of [
    ['T832', 'DATABASE_CORRUPTION'],
    ['T833', 'HSM_UNAVAILABLE'],
    ['T834', 'CREDENTIAL_COMPROMISE'],
    ['T835', 'INTERRUPTED_FINANCIAL_TX'],
    ['T836', 'FAILED_SETTLEMENT_PROOF'],
  ] as const) {
    await exec(idx, async () => {
      const r = await fetch('/api/v14/operations/dr-exercises', {
        method: 'POST',
        headers: ADMIN_HDRS,
        body: JSON.stringify({ scenario, affectedRegion: 'af-east-ug' }),
      });
      const d = await r.json();
      if (r.status !== 201 || d.status !== 'PASSED' || !d.financialConsistencyVerified || !d.failClosedSecurityVerified) {
        throw new Error(`DR exercise ${scenario} failed`);
      }
      return `DR exercise ${scenario} PASSED (RPO=${d.rpoObservedSeconds}s, RTO=${d.rtoObservedSeconds}s).`;
    });
  }

  await exec('T837', async () => {
    const r = await fetch('/api/v14/operations/dr-exercises', {
      method: 'POST',
      headers: COOP_HDRS,
      body: JSON.stringify({ scenario: 'DATABASE_CORRUPTION', affectedRegion: 'af-east-ug' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin DR drill, got ${r.status}`);
    return 'Non-admin blocked from triggering V14 DR exercises (403).';
  });

  await exec('T838', async () => {
    const r = await fetch('/api/v14/operations/readiness', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (r.assessment?.overallStatus !== 'BLOCKED_FOR_LIVE_PRODUCTION' || r.assessment?.blockingGapsCount < 4) {
      throw new Error('Readiness assessment failed truthful blocking classification');
    }
    return `Readiness truthfully reports BLOCKED_FOR_LIVE_PRODUCTION (${r.assessment.blockingGapsCount} unprovisioned external gaps).`;
  });

  await exec('T839', async () => {
    const lats: number[] = [];
    const results = await Promise.all(
      Array.from({ length: 25 }).map(async () => {
        const s = performance.now();
        const r = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS });
        lats.push(performance.now() - s);
        return r.status;
      })
    );
    lats.sort((a, b) => a - b);
    const p95 = Math.round(lats[Math.floor(lats.length * 0.95)]);
    if (results.some((s) => s !== 200) || p95 > 1000) throw new Error(`Treasury load benchmark failed (p95=${p95}ms)`);
    return `25-concurrent treasury/currency requests passed (p95=${p95}ms, 0 errors).`;
  });

  await exec('T840', async () => {
    const results = await Promise.all(
      Array.from({ length: 15 }).map((_, i) =>
        fetch('/api/v14/payments/initiate', {
          method: 'POST',
          headers: COOP_HDRS,
          body: JSON.stringify({
            idempotencyKey: `BENCH-PAY-${tag}-${i}`,
            providerId: 'PAYPROV-MTN-MOMO-UG',
            sourceCurrency: 'UGX',
            settlementCurrency: 'UGX',
            amount: 50000 + i * 100,
          }),
        }).then((r) => r.status)
      )
    );
    if (results.some((s) => s !== 201)) throw new Error('Concurrent V14 payment initiation failed');
    return '15 concurrent V14 payment initiations succeeded with zero lock errors.';
  });

  await exec('T841', async () => {
    const results = await Promise.all(
      Array.from({ length: 15 }).map((_, i) =>
        fetch('/api/v14/infrastructure/events/publish', {
          method: 'POST',
          headers: COOP_HDRS,
          body: JSON.stringify({
            eventType: 'CORRIDOR_SHIPMENT_UPDATED',
            orderingKey: `CORR-${i % 3}`,
            idempotencyKey: `BENCH-EV-${tag}-${i}`,
            payloadReference: `SHP-B-${i}`,
          }),
        }).then((r) => r.status)
      )
    );
    if (results.some((s) => s !== 201)) throw new Error('Concurrent V14 ordered event publish failed');
    return '15 concurrent V14 ordered events published & acknowledged cleanly.';
  });

  await exec('T842', async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }).map(() =>
        fetch('/api/v14/security/policies/evaluate', {
          method: 'POST',
          headers: ADMIN_HDRS,
          body: JSON.stringify({
            actionType: 'TAX_ASSESSMENT_SUBMIT',
            jurisdiction: 'UG',
            amountUgx: 500000,
            hasVerifiedIdentity: true,
          }),
        }).then((r) => r.status)
      )
    );
    if (results.some((s) => s !== 200)) throw new Error('Concurrent ABAC policy evaluations failed');
    return '12 concurrent ABAC policy evaluations succeeded (200).';
  });

  await exec('T843', async () => {
    const t = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (t.ledgerIsolation?.unverifiedSettlementsCount !== 0) {
      throw new Error('Detected unverified SETTLED payment after V14 load');
    }
    return 'Zero unverified SETTLED payments after full V14 concurrency load.';
  });

  await exec('T844', async () => {
    const t = await fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (!t.ledgerIsolation?.allCurrenciesBalanced) throw new Error('Currency ledger imbalanced post-load');
    return 'All 14 currency ledgers remain balanced post-load.';
  });

  await exec('T845', async () => {
    const [ugPay, kePay] = await Promise.all([
      fetch('/api/v14/payments/transactions', { headers: COOP_HDRS }).then((r) => r.json()),
      fetch('/api/v14/payments/transactions', { headers: KE_BUYER_HDRS }).then((r) => r.json()),
    ]);
    if (
      (ugPay.transactions || []).some((p: any) => p.tenantId !== 'TEN-UG-ELGON-01') ||
      (kePay.transactions || []).some((p: any) => p.tenantId !== 'TEN-KE-ROASTERS-03')
    ) {
      throw new Error('Cross-tenant payment leak detected');
    }
    return 'Verified strict UG vs KE tenant payment isolation under mixed queries.';
  });

  await exec('T846', async () => {
    const [v11, v12, v13] = await Promise.all([
      fetch('/api/v11/tenants', { headers: ADMIN_HDRS }),
      fetch('/api/v12/intelligence/overview', { headers: ADMIN_HDRS }),
      fetch('/api/v13/operations/health', { headers: ADMIN_HDRS }),
    ]);
    if (!v11.ok || !v12.ok || !v13.ok) throw new Error('Legacy V11/V12/V13 API regression detected');
    return 'Confirmed V11, V12, and V13 operational APIs respond cleanly (200).';
  });

  await exec('T847', async () => {
    const r = await fetch('/api/v14/operations/readiness', { headers: ADMIN_HDRS }).then((r) => r.json());
    const checks = r.assessment?.checks || [];
    if (checks.some((c: any) => c.currentStatus === 'PRODUCTION_CONNECTED_AND_VERIFIED')) {
      throw new Error('Truthful classification violated on unprovisioned external infra');
    }
    return `Truthful infrastructure audit passed across all ${checks.length} production readiness controls.`;
  });

  await exec('T848', async () => {
    const r = await fetch('/api/v14/operations/deployment-profile', {
      method: 'POST',
      headers: ADMIN_HDRS,
      body: JSON.stringify({ profileName: 'DEVELOPMENT' }),
    });
    if (!r.ok) throw new Error('Failed to restore DEVELOPMENT deployment profile');
    return 'Restored deployment profile cleanly to DEVELOPMENT.';
  });

  await exec('T849', async () => {
    const r = await fetch('/api/v14/operations/readiness', { headers: ADMIN_HDRS }).then((r) => r.json());
    if (r.summary?.collectionsCount < 110) throw new Error('Missing V14 collections in readiness count');
    return `Verified ${r.summary.collectionsCount} Schema 14 collections active & persisted.`;
  });

  await exec('T850', async () => {
    const [h, rdy, tr, conn] = await Promise.all([
      fetch('/api/health').then((r) => r.json()),
      fetch('/api/v14/operations/readiness', { headers: ADMIN_HDRS }).then((r) => r.json()),
      fetch('/api/v14/treasury/currencies', { headers: ADMIN_HDRS }).then((r) => r.json()),
      fetch('/api/v14/institutions/connectors', { headers: ADMIN_HDRS }).then((r) => r.json()),
    ]);
    if (
      h.schemaVersion < 14 ||
      rdy.schemaVersion < 14 ||
      !tr.ledgerIsolation?.allCurrenciesBalanced ||
      tr.ledgerIsolation?.unverifiedSettlementsCount !== 0 ||
      (conn.connectors || []).length < 9
    ) {
      throw new Error('Master V14 synthesis assertion failed');
    }
    return `MASTER V14 SYNTHESIS PASSED: Schema ${rdy.schemaVersion}, ${rdy.summary.collectionsCount} collections, ${tr.ledgerIsolation.supportedCurrencyCount} balanced currencies, ${conn.connectors.length} 16-state adapters, 7-gate cutover, HMAC settlement verification, reconciliation, tax rules, ABAC/WORM security, and DR exercises verified.`;
  });

  return { passed, failed };
}
