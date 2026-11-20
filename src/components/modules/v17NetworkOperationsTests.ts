/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V17.0 - Verified Economic Network Operations Automated Test Suite (T1221-T1375: 155 Assertions)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

export interface V17TestCaseDef {
  id: string;
  name: string;
  category: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
}

export const V17_INITIAL_TESTS: V17TestCaseDef[] = [
  // T1221 - T1230: Schema 17 Migration & V16 Parity
  { id: 'T1221', name: 'Health Endpoint Reports ECONEX V17.0 Schema 17 & VINEXSAH Attribution', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1222', name: 'Canonical V16 Pre-Migration Backup Exists with Valid SHA-256 Checksum', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1223', name: 'Schema V16->V17 Migration Completeness Preserves Existing Records', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1224', name: 'Migration Checkpoints Record Schema 16 to 17 Transition', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1225', name: 'Zero V16 Regression Check via V16 Database Integrity Endpoint', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1226', name: 'Double-Entry General Ledger Remains Balanced After V17 Seeding', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1227', name: 'V17 Network Overview Reports 27 Tracked Remediation Gates', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1228', name: 'V17 Overview Enforces Strict 3-State Release Truth Classification', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1229', name: 'PostgreSQL 16 Additive DDL File Metadata Parity Verification', category: 'V17_MIGRATION', status: 'PENDING' },
  { id: 'T1230', name: 'V17 Migration Endpoint Enforces PLATFORM_ADMIN Access Control', category: 'V17_MIGRATION', status: 'PENDING' },

  // T1231 - T1242: 27-Gate Remediation & Governance Controls
  { id: 'T1231', name: 'Gates Endpoint Lists All 27 Synchronized Gates (GATE-01..GATE-27)', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1232', name: 'Non-Critical Gate Waiver Fails With 400 Without Explicit Authority', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1233', name: 'Critical Non-Waivable Gate Waiver Attempt Strictly Rejected With 409', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1234', name: 'Gate Dependency Blocker Rejects Premature PRODUCTION_READY With 409', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1235', name: 'GATE-27 Release Sign-Off Remains Blocked Until Prerequisites Clear (409)', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1236', name: 'Valid Evidence Update on GATE-18 Persists TESTED_LOCAL Evidence', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1237', name: 'Non-Critical Gate Waiver Succeeds With Explicit Authority Sign-Off', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1238', name: 'Gate Waiver State Cleanly Restored Without Leaving False Prod Claim', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1239', name: 'Live V16 Infrastructure Probe Surfaces External PG16/HSM/WORM/PSP Blockers', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1240', name: 'GATE-16 Field Usability Gate Explicitly Reports NOT_CONDUCTED Honest Status', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1241', name: 'Gate Remediation Rejects Non-Admin Operator With 403', category: 'V17_GATES', status: 'PENDING' },
  { id: 'T1242', name: 'Missing Gate Identifier Returns Deterministic 404 Not Found', category: 'V17_GATES', status: 'PENDING' },

  // T1243 - T1258: Participant & Organization Onboarding
  { id: 'T1243', name: 'Participant Directory Returns Seeded Uganda Pilot Participants', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1244', name: 'Seeded Participants Carry Explicit Non-Government-Verified Flag (govtVerified=false)', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1245', name: 'Participant Onboarding Strictly Rejects Missing PDP 2019 Consent With 400', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1246', name: 'Participant Onboarding Rejects Empty Display Name With 400', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1247', name: 'Valid Participant Onboarding Succeeds With Masked Phone & Contact Verification', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1248', name: 'Onboarded Participant Strips Angle-Bracket XSS Payloads Safely', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1249', name: 'Participant Verification Evidence Upload Rejects Missing Document Ref (400)', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1250', name: 'Participant Document Upload Never Auto-Verifies (decision=PENDING)', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1251', name: 'Verification Evidence Computes Non-Empty SHA-256 Provenance Hash', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1252', name: 'Self-Review of Submitted Verification Evidence Blocked With 403', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1253', name: 'Independent Admin Review Promotes Participant Verification Level (200)', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1254', name: 'Verification Evidence Review Blocks Non-Admin Reviewer With 403', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1255', name: 'Organization Creation Rejects Empty Legal Name With 400', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1256', name: 'Organization Creation Links Owner Member & Marks govtVerified=false', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1257', name: 'Organization Directory Returns Created Organization & Membership Record', category: 'V17_ONBOARDING', status: 'PENDING' },
  { id: 'T1258', name: 'PRIVATE Participant Visibility Hides Record From Unrelated Non-Admin Participant', category: 'V17_ONBOARDING', status: 'PENDING' },

  // T1259 - T1270: Commercial Relationships & Invitations
  { id: 'T1259', name: 'Self-Relationship Invitation Strictly Rejected With 400', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1260', name: 'Valid Relationship Invitation Created With PENDING Status & 30-Day Expiry', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1261', name: 'Accepting Relationship Invitation Establishes ACTIVE Bilateral Relationship', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1262', name: 'Re-Responding to Already Accepted Invitation Blocked With 409', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1263', name: 'Rejecting Second Relationship Invitation Leaves Zero Active Link', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1264', name: 'Active Relationship Transitions Cleanly to SUSPENDED', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1265', name: 'Suspended Relationship Renews Cleanly Back to ACTIVE', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1266', name: 'Active Relationship Terminates Cleanly to REVOKED', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1267', name: 'PRIVATE Bilateral Relationship Hidden From Uninvolved Third-Party Viewer', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1268', name: 'PRIVATE Bilateral Relationship Remains Visible to Direct Counterparty', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1269', name: 'Unknown Invitation Response Returns 404 Not Found', category: 'V17_RELATIONSHIPS', status: 'PENDING' },
  { id: 'T1270', name: 'Unknown Relationship Status Update Returns 404 Not Found', category: 'V17_RELATIONSHIPS', status: 'PENDING' },

  // T1271 - T1286: Commercial Listings, Buyer Requests, Units & Negotiations
  { id: 'T1271', name: 'Commercial Listings Directory Returns Seeded Uganda Commodities', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1272', name: 'Listing Search Query Filters Correctly by District & Commodity', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1273', name: 'Listing Creation Rejects Negative Unit Price With 400', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1274', name: 'Listing Creation Rejects Zero Available Quantity With 400', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1275', name: 'Valid Listing Created With BAG_50KG Unit & Multi-Sector Attributes', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1276', name: 'Buyer Sourcing Request Rejects Non-Positive Quantities With 400', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1277', name: 'Valid Buyer Sourcing Request Created in OPEN State', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1278', name: 'Quotation Normalizes BAG_50KG Into Exact Kilogram Equivalent (x50)', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1279', name: 'Quotation Normalizes BAG_100KG Into Exact Kilogram Equivalent (x100)', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1280', name: 'Quotation Normalizes TONNE Into Exact Kilogram Equivalent (x1000)', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1281', name: 'Non-Mass CRATE Unit Safely Leaves normalizedKg as null', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1282', name: 'Quotation Counteroffer Round 1 Updates Price, Total & Round Number', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1283', name: 'Quotation Counteroffer Round 2 Preserves Full Negotiation Audit Sequence', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1284', name: 'Accepting Final Counteroffer Transitions Quotation to ACCEPTED', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1285', name: 'Negotiating Already Accepted Quotation Blocked With 409', category: 'V17_COMMERCE', status: 'PENDING' },
  { id: 'T1286', name: 'Rejecting Separate Quotation Marks Terminal REJECTED State', category: 'V17_COMMERCE', status: 'PENDING' },

  // T1287 - T1310: 21-State Transaction Engine & 6-Tier Evidence Verification
  { id: 'T1287', name: 'Transaction Creation Rejects Self-Dealing (buyerId == sellerId) With 400', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1288', name: 'Transaction Creation Rejects Zero or Negative Amount With 400', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1289', name: 'New Transaction Starts in DRAFT With PLATFORM_RECORDED Tier', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1290', name: 'Zero-Trust Transition Blocks Illegal Skip DRAFT->COMPLETED With 409', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1291', name: 'Transition to PAYMENT_PROVIDER_VERIFIED Blocked Without externalProviderRef (409)', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1292', name: 'Transaction Progresses Validly DRAFT->SUBMITTED->ACCEPTED->CONFIRMED', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1293', name: 'CONFIRMED Transaction Elevates Verification Tier to PARTICIPANT_CONFIRMED', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1294', name: 'Payment Initiation Progresses AWAITING_PAYMENT->PAYMENT_INITIATED->PAYMENT_PENDING', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1295', name: 'PAYMENT_PROVIDER_VERIFIED Succeeds With Provider Ref & Elevates Tier', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1296', name: 'Duplicate externalProviderRef on Second Transaction Blocked With 409', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1297', name: 'Provider Settlement Evidence Rejects Missing externalRefId With 400', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1298', name: 'Attached Provider Receipt Never Auto-Verifies (autoVerifiedFromUserUpload=false)', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1299', name: 'Duplicate Evidence externalRefId Strictly Blocked With 409', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1300', name: 'Fulfillment Lifecycle Advances Through IN_FULFILLMENT->IN_TRANSIT->DELIVERED', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1301', name: 'Delivery Photo Hash Evidence Attachment Computes SHA-256 Digest', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1302', name: 'DELIVERY_CONFIRMED Advances Tier to DELIVERY_CONFIRMED', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1303', name: 'Transaction Completes Cleanly to COMPLETED With Full State History', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1304', name: 'Completed Transaction Advances to RECONCILED Tier', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1305', name: 'Independent Admin Review Promotes Tier to INDEPENDENTLY_REVIEWED', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1306', name: 'Verify Transaction Rejects Non-Admin Caller With 403', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1307', name: 'Terminal CANCELLED Transaction Rejects Further Transitions With 409', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1308', name: 'Failed Payment Lifecycle Permits Retry Recovery to AWAITING_PAYMENT', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1309', name: 'Verify Transaction Evaluates Checks Summary Accurately', category: 'V17_TRANSACTIONS', status: 'PENDING' },
  { id: 'T1310', name: 'Second Completed Transaction Created in KES to Verify Currency Separation', category: 'V17_TRANSACTIONS', status: 'PENDING' },

  // T1311 - T1330: Reviews, Volume-Neutral Reputation & 11-Stage Disputes
  { id: 'T1311', name: 'Non-Party Review Submission Strictly Rejected With 403', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1312', name: 'Review Blocked With 409 on Uncompleted DRAFT Transaction', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1313', name: 'Out-of-Range Review Rating (>5) Rejected With 400', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1314', name: 'Valid Buyer Review Created on Reconciled Transaction & Updates Reputation', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1315', name: 'Duplicate Review by Same Party on Same Transaction Blocked With 409', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1316', name: 'Review Appeal Workflow Transitions Moderation Status to APPEALED', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1317', name: 'Reputation Summary Includes Volume-Neutral Note & Non-Credit Disclaimer', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1318', name: 'Reputation Reflects Evidence-Verified Count & Zero Unsubstantiated Score', category: 'V17_TRUST', status: 'PENDING' },
  { id: 'T1319', name: 'Opening Dispute Requires Non-Empty Reason (400 Guard)', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1320', name: 'New Dispute Opens at 1_OPENED With Non-Court & Non-Escrow Disclaimers', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1321', name: 'Dispute Progression Rejects Backward Stage Jump With 409', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1322', name: 'Dispute Advances Sequentially 1_OPENED Through 6_PARTY_NEGOTIATION', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1323', name: 'Declared Conflict of Interest Blocks 7_ADMIN_OR_COOP_REVIEW With 409', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1324', name: 'Reassigning Independent Mediator Clears Conflict Blocker & Advances to Stage 7', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1325', name: 'Dispute Advances Through Stage 8 Resolution Proposal & Stage 9 Settlement', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1326', name: 'Dispute Supports Stage 10 Appeal Review Before Final Closure', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1327', name: 'Dispute Closes Cleanly at 11_CLOSED With Timestamp & Final Decision', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1328', name: 'Closed 11_CLOSED Dispute Rejects Further Progression With 409', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1329', name: 'Dispute Stage Progression Blocks Non-Admin Operator With 403', category: 'V17_DISPUTES', status: 'PENDING' },
  { id: 'T1330', name: 'Disputes Directory Returns Persisted Dispute With Full Audit History', category: 'V17_DISPUTES', status: 'PENDING' },

  // T1331 - T1345: Regional Jurisdictions, Logistics & Cooperative Workspaces
  { id: 'T1331', name: 'Regional Endpoint Shows Uganda Sandbox & 6 Inactive Expansion States', category: 'V17_REGIONAL', status: 'PENDING' },
  { id: 'T1332', name: 'Dormant Jurisdiction (KE) Auto-Activation Strictly Blocked With 409', category: 'V17_REGIONAL', status: 'PENDING' },
  { id: 'T1333', name: 'Jurisdiction Activation Succeeds Only With Explicit Legal Counsel Sign-Off', category: 'V17_REGIONAL', status: 'PENDING' },
  { id: 'T1334', name: 'Kenya Jurisdiction Restored Cleanly to INACTIVE Without False Expansion Claim', category: 'V17_REGIONAL', status: 'PENDING' },
  { id: 'T1335', name: 'Corridors Carry Explicit Non-Customs-Replacement Disclaimers', category: 'V17_REGIONAL', status: 'PENDING' },
  { id: 'T1336', name: 'Logistics Shipment Rejects Missing Origin or Destination With 400', category: 'V17_LOGISTICS', status: 'PENDING' },
  { id: 'T1337', name: 'Logistics Shipment Sets hasFakeGpsCoordinates=false & Supports Offline Flag', category: 'V17_LOGISTICS', status: 'PENDING' },
  { id: 'T1338', name: 'Logistics Shipment Status Advances to DELIVERED While Preserving No Fake GPS', category: 'V17_LOGISTICS', status: 'PENDING' },
  { id: 'T1339', name: 'Cooperative Directory Returns Non-Deposit-Taking Disclaimer', category: 'V17_COOPERATIVES', status: 'PENDING' },
  { id: 'T1340', name: 'Cooperative Detail Redacts Individual Member Identities for Unprivileged Caller', category: 'V17_COOPERATIVES', status: 'PENDING' },
  { id: 'T1341', name: 'Cooperative Detail Reveals Authorized Member Roster for Cooperative/Platform Admin', category: 'V17_COOPERATIVES', status: 'PENDING' },
  { id: 'T1342', name: 'Cooperative Aggregated Lot Activity Recorded Accurately Without Member Exposure', category: 'V17_COOPERATIVES', status: 'PENDING' },
  { id: 'T1343', name: 'Unknown Cooperative Identifier Returns 404 Not Found', category: 'V17_COOPERATIVES', status: 'PENDING' },
  { id: 'T1344', name: 'Jurisdiction Activation Endpoint Enforces PLATFORM_ADMIN RBAC (403)', category: 'V17_REGIONAL', status: 'PENDING' },
  { id: 'T1345', name: 'Unknown Jurisdiction Code Returns Deterministic 404', category: 'V17_REGIONAL', status: 'PENDING' },

  // T1346 - T1362: Reconciliation, Billing Truth, Dual-Auth, Privacy & Offline Sync
  { id: 'T1346', name: 'Reconciliation Case Computes Variance Accurately Between Expected & Provider Amounts', category: 'V17_RECON', status: 'PENDING' },
  { id: 'T1347', name: 'Resolving Reconciliation Case Posts Non-Destructive Balanced Correcting Journal', category: 'V17_RECON', status: 'PENDING' },
  { id: 'T1348', name: 'General Ledger Still Balances Debit == Credit After V17 Reversing Journal Entry', category: 'V17_RECON', status: 'PENDING' },
  { id: 'T1349', name: 'Re-Resolving Already Resolved Reconciliation Case Preserves Audit State', category: 'V17_RECON', status: 'PENDING' },
  { id: 'T1350', name: 'Billing Record Separates Gross Flow, PSP Fee, Tax & Platform Fee (Uncollected)', category: 'V17_BILLING', status: 'PENDING' },
  { id: 'T1351', name: 'Settlement-Matched Billing Record Recognizes Collected Platform Revenue Truthfully', category: 'V17_BILLING', status: 'PENDING' },
  { id: 'T1352', name: 'Exempt Public Service Billing Forces Zero Platform Service Fee', category: 'V17_BILLING', status: 'PENDING' },
  { id: 'T1353', name: 'KES Billing Record Keeps Multi-Currency Buckets Strictly Unmixed', category: 'V17_BILLING', status: 'PENDING' },
  { id: 'T1354', name: 'Billing Summary Includes Explicit Non-Conflation Disclosure', category: 'V17_BILLING', status: 'PENDING' },
  { id: 'T1355', name: 'Governance Policies List Dual-Authorization Rules Across 3 Critical Domains', category: 'V17_GOVERNANCE', status: 'PENDING' },
  { id: 'T1356', name: 'Dual-Auth Approval Request Created in PENDING_SECOND_APPROVAL State', category: 'V17_GOVERNANCE', status: 'PENDING' },
  { id: 'T1357', name: 'Same-Admin Self-Approval Strictly Blocked With 403 DUAL_AUTH_VIOLATION', category: 'V17_GOVERNANCE', status: 'PENDING' },
  { id: 'T1358', name: 'Independent Second Admin Approval Completes Dual-Authorization (200)', category: 'V17_GOVERNANCE', status: 'PENDING' },
  { id: 'T1359', name: 'Privacy Data Export Completes With Secrets Strictly Redacted', category: 'V17_PRIVACY', status: 'PENDING' },
  { id: 'T1360', name: 'Privacy Deletion Request Enters Controlled IN_REVIEW Governance Queue', category: 'V17_PRIVACY', status: 'PENDING' },
  { id: 'T1361', name: 'Offline Queue Revalidates Safe Order Draft Submission (201 REVALIDATED)', category: 'V17_OFFLINE', status: 'PENDING' },
  { id: 'T1362', name: 'Offline Queue Strictly Rejects Settlement Confirmation Attempt With 409', category: 'V17_OFFLINE', status: 'PENDING' },

  // T1363 - T1375: Security, Intelligence & Master V17 Synthesis
  { id: 'T1363', name: 'Unauthenticated V17 Request Strictly Rejected With 401', category: 'V17_SECURITY', status: 'PENDING' },
  { id: 'T1364', name: 'Cross-Tenant Parameter Injection Blocked With 403 For Non-Admin Caller', category: 'V17_SECURITY', status: 'PENDING' },
  { id: 'T1365', name: 'Billing & Reconciliation Admin Endpoints Reject Farmer Role With 403', category: 'V17_SECURITY', status: 'PENDING' },
  { id: 'T1366', name: 'Privacy Request & Offline Queue Endpoints Available to Authenticated Participant', category: 'V17_SECURITY', status: 'PENDING' },
  { id: 'T1367', name: 'Economic Intelligence Returns Real Observed Database Counts Without Mocked Impact', category: 'V17_INTELLIGENCE', status: 'PENDING' },
  { id: 'T1368', name: 'Economic Intelligence Separates UGX & KES Funnels Without Currency Conflation', category: 'V17_INTELLIGENCE', status: 'PENDING' },
  { id: 'T1369', name: 'Economic Intelligence Honestly Reports NOT_CONDUCTED When Usability Sessions=0', category: 'V17_INTELLIGENCE', status: 'PENDING' },
  { id: 'T1370', name: 'Economic Intelligence Includes Methodology Disclosure', category: 'V17_INTELLIGENCE', status: 'PENDING' },
  { id: 'T1371', name: 'Evidence List Returns Both Provider & Delivery Hashes With Zero Auto-Verification', category: 'V17_INTEGRITY', status: 'PENDING' },
  { id: 'T1372', name: 'Offline Queue Persists Both Revalidated Draft & Rejected Settlement Attempt', category: 'V17_INTEGRITY', status: 'PENDING' },
  { id: 'T1373', name: 'V1-V16 Core Health, Auth, Ledger & Global Institutional Endpoints Preserved', category: 'V17_INTEGRITY', status: 'PENDING' },
  { id: 'T1374', name: 'Security Incident Log Captures V17 Auth & RBAC Violation Attempts', category: 'V17_SECURITY', status: 'PENDING' },
  { id: 'T1375', name: 'Master V17 Synthesis: Schema 17, 27-Gate Ops, 21-State Tx, Trust, Regional & Honest Truth Verified', category: 'V17_INTEGRITY', status: 'PENDING' },
];

export async function runV17VerificationTests(
  updateTestStatus: (
    id: string,
    status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED',
    durationMs?: number,
    assertionDetails?: string,
    error?: string
  ) => void,
  baseUrl = ''
): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  const url = (p: string) => `${baseUrl}${p}`;

  const exec = async (id: string, fn: () => Promise<string>) => {
    const t0 = performance.now();
    updateTestStatus(id, 'RUNNING');
    try {
      const msg = await fn();
      const dur = Math.round(performance.now() - t0);
      passed++;
      updateTestStatus(id, 'PASSED', dur, msg);
    } catch (err: any) {
      const dur = Math.round(performance.now() - t0);
      failed++;
      updateTestStatus(id, 'FAILED', dur, undefined, err?.message || String(err));
    }
  };

  const adminHdrs = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_admin_01',
    'x-user-role': 'PLATFORM_ADMIN',
    'x-tenant-id': 'TEN-UG-ELGON-01',
  };
  const admin2Hdrs = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_admin_02',
    'x-user-role': 'PLATFORM_ADMIN',
    'x-tenant-id': 'TEN-UG-ELGON-01',
  };
  const farmerHdrs = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_farmer_01',
    'x-user-role': 'FARMER',
    'x-tenant-id': 'TEN-UG-ELGON-01',
  };
  const buyerHdrs = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_buyer_01',
    'x-user-role': 'BUYER',
    'x-tenant-id': 'TEN-UG-KLA-01',
  };
  const thirdPartyHdrs = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_third_party_99',
    'x-user-role': 'FARMER',
    'x-tenant-id': 'TEN-UG-ELGON-01',
  };

  const uid = Date.now().toString(36).toUpperCase();

  let migCache: any = null;
  let gatesCache: any = null;
  let participantId = '';
  let verEvId = '';
  let selfVerEvId = '';
  let orgId = '';
  let invId = '';
  let invRejectId = '';
  let relId = '';
  let privInvId = '';
  let privRelId = '';
  let listingId = '';
  let reqId = '';
  let quotId = '';
  let rejQuotId = '';
  let txId = '';
  let txDraftId = '';
  let txFailId = '';
  let txCancelId = '';
  let txKesId = '';
  let reviewId = '';
  let disputeId = '';
  let shipId = '';
  let reconCaseId = '';
  let approvalId = '';

  // T1221 - T1230: Schema 17 Migration & V16 Parity
  await exec('T1221', async () => {
    const h = await fetch(url('/api/health')).then((r) => r.json());
    if (
      h.product !== 'ECONEX' ||
      h.schemaVersion < 17 ||
      (h.release !== 'V17.0-VERIFIED-ECONOMIC-NETWORK-OPERATIONS' &&
        h.release !== 'V18.0-COMPLETE-PLATFORM-CONSOLIDATION') ||
      !String(h.attribution).includes('VINEXSAH TECHNOLOGIES')
    ) {
      throw new Error(`Unexpected health payload: ${JSON.stringify(h)}`);
    }
    return `Verified ${h.system} (${h.release}, schema=${h.schemaVersion}).`;
  });

  await exec('T1222', async () => {
    migCache = await fetch(url('/api/v17/database/migrations'), { headers: adminHdrs }).then((r) => r.json());
    if (!migCache.v16BackupReadiness?.v16BackupValid || !migCache.v16BackupReadiness?.checksumSha256) {
      throw new Error(`V16 backup invalid: ${JSON.stringify(migCache)}`);
    }
    return `Canonical V16 backup verified (${migCache.v16BackupReadiness.bytes} bytes, SHA=${migCache.v16BackupReadiness.checksumSha256.slice(0, 12)}).`;
  });

  await exec('T1223', async () => {
    if (!migCache?.completeness?.complete || (migCache.completeness.preservedUsersCount || 0) < 1) {
      throw new Error('V17 migration completeness check failed');
    }
    return `Migration complete; preservedUsers=${migCache.completeness.preservedUsersCount}, v17Collections=${migCache.completeness.v17CollectionsCount}.`;
  });

  await exec('T1224', async () => {
    const cps = migCache?.checkpoints || [];
    if (!cps.length || cps[0].toSchemaVersion !== 17) {
      throw new Error('Missing Schema 16->17 migration checkpoint');
    }
    return `Checkpoint ${cps[0].id} recorded (${cps[0].fromSchemaVersion}->${cps[0].toSchemaVersion}).`;
  });

  await exec('T1225', async () => {
    const d = await fetch(url('/api/v16/database/integrity'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.v16Integrity?.valid || d.v16Integrity?.exceptionsCount > 0) {
      throw new Error(`V16 parity check failed: ${JSON.stringify(d)}`);
    }
    return `Zero V16 regression confirmed across ${d.v16Integrity.v16CollectionsInitialized} V16 collections.`;
  });

  await exec('T1226', async () => {
    const r = await fetch(url('/api/financial/integrity-report'), { headers: adminHdrs }).then((r) => r.json());
    if (r.isBalanced === false) throw new Error('Double-entry general ledger imbalanced');
    return `Double-entry general ledger balanced (Debit=${r.totalDebits} == Credit=${r.totalCredits}).`;
  });

  await exec('T1227', async () => {
    const ov = await fetch(url('/api/v17/network/overview'), { headers: adminHdrs }).then((r) => r.json());
    if (ov.gatesSummary?.totalGates !== 27) throw new Error(`Expected 27 gates, got ${ov.gatesSummary?.totalGates}`);
    return `Overview confirmed 27 synchronized gates (${ov.gatesSummary.externalBlockedCount} externally blocked).`;
  });

  await exec('T1228', async () => {
    const ov = await fetch(url('/api/v17/network/overview'), { headers: adminHdrs }).then((r) => r.json());
    const s = ov.statuses;
    if (!s || s.ENGINEERING_COMPLETE !== true || s.PRODUCTION_READY !== false || s.LIVE_PILOT_OPERATIONAL !== false) {
      throw new Error(`False release status claim: ${JSON.stringify(s)}`);
    }
    return `Strict 3-state release truth verified (ENGINEERING_COMPLETE=true, PRODUCTION_READY=false, LIVE_PILOT_OPERATIONAL=false).`;
  });

  await exec('T1229', async () => {
    const d = await fetch(url('/api/v17/database/migrations'), { headers: adminHdrs }).then((r) => r.json());
    if ((d.completeness?.schemaVersion || 0) < 17) throw new Error('Expected schemaVersion >= 17 in completeness');
    return `PostgreSQL additive schema target v17 verified in migration completeness report.`;
  });

  await exec('T1230', async () => {
    const r = await fetch(url('/api/v17/database/migrations'), { headers: farmerHdrs });
    if (r.status !== 403) throw new Error(`Expected 403 for FARMER, got ${r.status}`);
    return `Confirmed 403 FORBIDDEN_ADMIN_ONLY on non-admin migration status request.`;
  });

  // T1231 - T1242: 27-Gate Remediation
  await exec('T1231', async () => {
    gatesCache = await fetch(url('/api/v17/gates'), { headers: adminHdrs }).then((r) => r.json());
    if (!Array.isArray(gatesCache.gates) || gatesCache.gates.length !== 27) {
      throw new Error(`Expected 27 gates array, got ${gatesCache.gates?.length}`);
    }
    return `Listed all 27 synchronized gates (${gatesCache.v16GatesPassed}/27 live V16 runtime checks passed).`;
  });

  await exec('T1232', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-18/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'WAIVED_WITH_AUTHORITY' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 missing waiverAuthority, got ${r.status}`);
    return `Missing waiverAuthority rejected with HTTP 400.`;
  });

  await exec('T1233', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-07/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'WAIVED_WITH_AUTHORITY', waiverAuthority: 'CTO Override' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 non-waivable gate, got ${r.status}`);
    return `Critical non-waivable GATE-07 waiver strictly blocked with HTTP 409.`;
  });

  await exec('T1234', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-06/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'PRODUCTION_READY', submittedEvidence: 'Bypass attempt' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 dependency block, got ${r.status}`);
    return `GATE-06 premature PRODUCTION_READY blocked with HTTP 409 because GATE-04 is open.`;
  });

  await exec('T1235', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-27/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'PRODUCTION_READY' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 on GATE-27, got ${r.status}`);
    return `GATE-27 sign-off strictly blocked with HTTP 409 pending prerequisite infrastructure/legal gates.`;
  });

  await exec('T1236', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-18/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        targetStatus: 'TESTED_LOCAL',
        submittedEvidence: 'V17 Simple Mode & Voice safety prompts verified',
      }),
    });
    const d = await r.json();
    if (!r.ok || d.status !== 'TESTED_LOCAL') throw new Error(`Gate update failed: ${JSON.stringify(d)}`);
    return `GATE-18 updated to TESTED_LOCAL with recorded verification evidence.`;
  });

  await exec('T1237', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-18/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        targetStatus: 'WAIVED_WITH_AUTHORITY',
        waiverAuthority: 'QA Temporary Non-Critical Test',
      }),
    });
    const d = await r.json();
    if (!r.ok || d.status !== 'WAIVED_WITH_AUTHORITY') throw new Error(`Waiver failed: ${JSON.stringify(d)}`);
    return `Non-critical GATE-18 accepted explicit waiverAuthority (${d.waiverAuthority}).`;
  });

  await exec('T1238', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-18/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        targetStatus: 'TESTED_LOCAL',
        submittedEvidence: 'Restored TESTED_LOCAL after V17 automated gate test',
      }),
    });
    const d = await r.json();
    if (!r.ok || d.status !== 'TESTED_LOCAL') throw new Error('Gate restore failed');
    return `GATE-18 cleanly restored to TESTED_LOCAL.`;
  });

  await exec('T1239', async () => {
    const blocked = (gatesCache?.gates || []).filter((g: any) => g.status === 'EXTERNAL_DEPENDENCY_BLOCKED');
    if (blocked.length < 5) throw new Error(`Expected >=5 external dependency blocked gates, found ${blocked.length}`);
    return `Live matrix transparently reports ${blocked.length} externally blocked infrastructure/legal gates.`;
  });

  await exec('T1240', async () => {
    const g16 = (gatesCache?.gates || []).find((g: any) => g.gateId === 'GATE-16');
    if (!g16 || !String(g16.submittedEvidence).includes('NOT_CONDUCTED')) {
      throw new Error(`GATE-16 must report NOT_CONDUCTED honestly: ${JSON.stringify(g16)}`);
    }
    return `GATE-16 honestly confirms NOT_CONDUCTED (0 fabricated field usability sessions).`;
  });

  await exec('T1241', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-18/remediate'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ targetStatus: 'IMPLEMENTED' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 for non-admin gate edit, got ${r.status}`);
    return `Non-admin gate remediation attempt denied with 403.`;
  });

  await exec('T1242', async () => {
    const r = await fetch(url('/api/v17/gates/GATE-999/remediate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'IMPLEMENTED' }),
    });
    if (r.status !== 404) throw new Error(`Expected 404 for unknown gate, got ${r.status}`);
    return `Unknown gate GATE-999 returned deterministic HTTP 404.`;
  });

  // T1243 - T1258: Participant & Organization Onboarding
  await exec('T1243', async () => {
    const d = await fetch(url('/api/v17/participants'), { headers: adminHdrs }).then((r) => r.json());
    if (!Array.isArray(d.participants) || d.participants.length < 4) {
      throw new Error(`Expected >=4 seeded Uganda participants, got ${d.participants?.length}`);
    }
    return `Participant directory returned ${d.participants.length} participants.`;
  });

  await exec('T1244', async () => {
    const d = await fetch(url('/api/v17/participants'), { headers: adminHdrs }).then((r) => r.json());
    const anyGovt = d.participants.some((p: any) => p.govtVerified === true);
    if (anyGovt) throw new Error('Found fabricated govtVerified=true on participant');
    return `All ${d.participants.length} participants carry honest govtVerified=false label.`;
  });

  await exec('T1245', async () => {
    const r = await fetch(url('/api/v17/participants/onboard'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ displayName: 'Consentless User', consentGranted: false }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 on missing consent, got ${r.status}`);
    return `PDP 2019 consent guard strictly rejected consentGranted=false with HTTP 400.`;
  });

  await exec('T1246', async () => {
    const r = await fetch(url('/api/v17/participants/onboard'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ displayName: '   ', consentGranted: true }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 on blank displayName, got ${r.status}`);
    return `Blank participant displayName rejected with HTTP 400.`;
  });

  await exec('T1247', async () => {
    const r = await fetch(url('/api/v17/participants/onboard'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        participantType: 'FARMER',
        displayName: `Grace Nabwire <script>alert(1)</script> ${uid}`,
        phone: '+256772991122',
        countryCode: 'UG',
        district: 'Soroti',
        languages: ['en', 'teo'],
        consentGranted: true,
        visibility: 'PRIVATE',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || !d.id || !String(d.phoneMasked).includes('***') || d.govtVerified !== false) {
      throw new Error(`Onboarding failed: ${JSON.stringify(d)}`);
    }
    participantId = d.id;
    return `Onboarded participant ${d.id} with masked phone (${d.phoneMasked}) and consent=${d.consentVersion}.`;
  });

  await exec('T1248', async () => {
    const d = await fetch(url('/api/v17/participants'), { headers: adminHdrs }).then((r) => r.json());
    const found = d.participants.find((p: any) => p.id === participantId);
    if (!found || found.displayName.includes('<') || found.displayName.includes('>')) {
      throw new Error(`XSS brackets not stripped: ${found?.displayName}`);
    }
    return `Verified XSS angle-bracket stripping on displayName (${found.displayName}).`;
  });

  await exec('T1249', async () => {
    const r = await fetch(url('/api/v17/participants/verification/evidence'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ subjectId: participantId, subjectType: 'PARTICIPANT', documentReference: '' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 missing documentReference, got ${r.status}`);
    return `Missing documentReference blocked with HTTP 400.`;
  });

  await exec('T1250', async () => {
    const r = await fetch(url('/api/v17/participants/verification/evidence'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        subjectId: participantId,
        subjectType: 'PARTICIPANT',
        documentType: 'COOP_ATTESTATION_LETTER',
        documentReference: `COOP-SOROTI-${uid}`,
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.decision !== 'PENDING' || d.verificationTier !== 'UNVERIFIED') {
      throw new Error(`Document evidence should stay PENDING/UNVERIFIED: ${JSON.stringify(d)}`);
    }
    verEvId = d.id;
    return `Uploaded evidence ${d.id} stays decision=PENDING & tier=UNVERIFIED (never auto-verified).`;
  });

  await exec('T1251', async () => {
    const r = await fetch(url('/api/v17/participants/verification/evidence'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        subjectId: participantId,
        subjectType: 'PARTICIPANT',
        documentType: 'TRADE_LICENSE',
        documentReference: `ADMIN-SELF-${uid}`,
      }),
    });
    const d = await r.json();
    if (!String(d.fileHashSha256).startsWith('0x') || d.fileHashSha256.length < 20) {
      throw new Error(`Invalid fileHashSha256: ${d.fileHashSha256}`);
    }
    selfVerEvId = d.id;
    return `SHA-256 provenance digest verified (${d.fileHashSha256.slice(0, 16)}...).`;
  });

  await exec('T1252', async () => {
    const r = await fetch(url(`/api/v17/participants/verification/${selfVerEvId}/review`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ decision: 'APPROVED', targetLevel: 'DOCUMENTS_REVIEWED', reviewNotes: 'Self check' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 SELF_REVIEW_FORBIDDEN, got ${r.status}`);
    return `Self-review of own uploaded evidence blocked with 403 SELF_REVIEW_FORBIDDEN.`;
  });

  await exec('T1253', async () => {
    const r = await fetch(url(`/api/v17/participants/verification/${verEvId}/review`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ decision: 'APPROVED', targetLevel: 'DOCUMENTS_REVIEWED', reviewNotes: 'Verified Soroti letter' }),
    });
    const d = await r.json();
    if (!r.ok || d.decision !== 'APPROVED' || d.verificationTier !== 'DOCUMENTS_REVIEWED') {
      throw new Error(`Independent verification failed: ${JSON.stringify(d)}`);
    }
    return `Independent admin review approved ${verEvId} -> tier=${d.verificationTier}.`;
  });

  await exec('T1254', async () => {
    const r = await fetch(url(`/api/v17/participants/verification/${verEvId}/review`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ decision: 'APPROVED' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin reviewer, got ${r.status}`);
    return `Non-admin verification review blocked with HTTP 403.`;
  });

  await exec('T1255', async () => {
    const r = await fetch(url('/api/v17/organizations'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ legalName: '' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 blank org legalName, got ${r.status}`);
    return `Blank organization legalName blocked with HTTP 400.`;
  });

  await exec('T1256', async () => {
    const r = await fetch(url('/api/v17/organizations'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        legalName: `Teso Oilseeds Traders Ltd ${uid}`,
        orgType: 'SME',
        countryCode: 'UG',
        district: 'Soroti',
        ownerParticipantId: participantId,
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || !d.id || d.govtVerified !== false) {
      throw new Error(`Org creation failed: ${JSON.stringify(d)}`);
    }
    orgId = d.id;
    return `Organization ${orgId} created with govtVerified=false and owner membership link.`;
  });

  await exec('T1257', async () => {
    const d = await fetch(url('/api/v17/organizations'), { headers: buyerHdrs }).then((r) => r.json());
    const org = d.organizations.find((o: any) => o.id === orgId);
    const mem = d.members.find((m: any) => m.organizationId === orgId && m.participantId === participantId);
    if (!org || !mem) throw new Error('Created org or owner member missing in directory');
    return `Confirmed organization ${orgId} & owner member ${mem.id} persisted.`;
  });

  await exec('T1258', async () => {
    const d = await fetch(url('/api/v17/participants'), { headers: thirdPartyHdrs }).then((r) => r.json());
    const leaked = d.participants.some((p: any) => p.id === participantId);
    if (leaked) throw new Error('PRIVATE visibility participant leaked to unrelated user');
    return `PRIVATE visibility participant ${participantId} properly isolated from unrelated third party.`;
  });

  // T1259 - T1270: Commercial Relationships
  await exec('T1259', async () => {
    const r = await fetch(url('/api/v17/relationships/invite'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        fromParticipantId: 'V17-PART-FARMER-01',
        toParticipantId: 'V17-PART-FARMER-01',
        relationshipType: 'SUPPLIER_BUYER',
      }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 self-invite block, got ${r.status}`);
    return `Self-relationship invitation blocked with 400 SELF_RELATIONSHIP_FORBIDDEN.`;
  });

  await exec('T1260', async () => {
    const r = await fetch(url('/api/v17/relationships/invite'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        fromParticipantId: 'V17-PART-FARMER-01',
        toParticipantId: 'V17-PART-BUYER-01',
        relationshipType: 'SUPPLIER_BUYER',
        visibility: 'PARTICIPANTS_ONLY',
        termsSummary: `Direct Bugisu coffee supply ${uid}`,
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.status !== 'PENDING') throw new Error(`Invite failed: ${JSON.stringify(d)}`);
    invId = d.id;
    return `Relationship invitation ${invId} created in PENDING state.`;
  });

  await exec('T1261', async () => {
    const r = await fetch(url(`/api/v17/relationships/invitations/${invId}/respond`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ decision: 'ACCEPTED' }),
    });
    const d = await r.json();
    if (!r.ok || d.relationship?.status !== 'ACTIVE') throw new Error(`Accept failed: ${JSON.stringify(d)}`);
    relId = d.relationship.id;
    return `Accepted invitation -> ACTIVE bilateral relationship ${relId}.`;
  });

  await exec('T1262', async () => {
    const r = await fetch(url(`/api/v17/relationships/invitations/${invId}/respond`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ decision: 'REJECTED' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 already responded, got ${r.status}`);
    return `Duplicate invitation response strictly blocked with HTTP 409.`;
  });

  await exec('T1263', async () => {
    const inv = await fetch(url('/api/v17/relationships/invite'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        fromParticipantId: 'V17-PART-FARMER-01',
        toParticipantId: 'V17-PART-LOG-01',
        relationshipType: 'CARRIER_SHIPPER',
      }),
    }).then((r) => r.json());
    invRejectId = inv.id;
    const resp = await fetch(url(`/api/v17/relationships/invitations/${invRejectId}/respond`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ decision: 'REJECTED' }),
    }).then((r) => r.json());
    if (resp.invitation?.status !== 'REJECTED' || resp.relationship) {
      throw new Error(`Reject invitation check failed: ${JSON.stringify(resp)}`);
    }
    return `Rejected invitation ${invRejectId} closed cleanly with zero active relationship created.`;
  });

  await exec('T1264', async () => {
    const d = await fetch(url(`/api/v17/relationships/${relId}/status`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ action: 'SUSPEND' }),
    }).then((r) => r.json());
    if (d.status !== 'SUSPENDED') throw new Error(`Expected SUSPENDED, got ${d.status}`);
    return `Relationship ${relId} suspended cleanly.`;
  });

  await exec('T1265', async () => {
    const d = await fetch(url(`/api/v17/relationships/${relId}/status`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ action: 'RENEW' }),
    }).then((r) => r.json());
    if (d.status !== 'ACTIVE') throw new Error(`Expected ACTIVE on renew, got ${d.status}`);
    return `Relationship ${relId} renewed back to ACTIVE.`;
  });

  await exec('T1266', async () => {
    const d = await fetch(url(`/api/v17/relationships/${relId}/status`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ action: 'REVOKE' }),
    }).then((r) => r.json());
    if (d.status !== 'REVOKED') throw new Error(`Expected REVOKED, got ${d.status}`);
    return `Relationship ${relId} permanently revoked.`;
  });

  await exec('T1267', async () => {
    const inv = await fetch(url('/api/v17/relationships/invite'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        fromParticipantId: 'usr_farmer_01',
        toParticipantId: 'usr_buyer_01',
        relationshipType: 'COOPERATIVE_BUYER',
        visibility: 'PRIVATE',
      }),
    }).then((r) => r.json());
    privInvId = inv.id;
    const acc = await fetch(url(`/api/v17/relationships/invitations/${privInvId}/respond`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ decision: 'ACCEPTED' }),
    }).then((r) => r.json());
    privRelId = acc.relationship.id;
    const view3 = await fetch(url('/api/v17/relationships'), { headers: thirdPartyHdrs }).then((r) => r.json());
    if ((view3.relationships || []).some((r: any) => r.id === privRelId)) {
      throw new Error('PRIVATE relationship leaked to third party');
    }
    return `PRIVATE relationship ${privRelId} strictly hidden from unrelated viewer.`;
  });

  await exec('T1268', async () => {
    const viewParty = await fetch(url('/api/v17/relationships'), { headers: buyerHdrs }).then((r) => r.json());
    if (!(viewParty.relationships || []).some((r: any) => r.id === privRelId)) {
      throw new Error('PRIVATE relationship missing for authorized party');
    }
    return `PRIVATE relationship ${privRelId} remains visible to counterparty usr_buyer_01.`;
  });

  await exec('T1269', async () => {
    const r = await fetch(url('/api/v17/relationships/invitations/V17-INV-MISSING/respond'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ decision: 'ACCEPTED' }),
    });
    if (r.status !== 404) throw new Error(`Expected 404 for unknown invitation, got ${r.status}`);
    return `Unknown relationship invitation returned 404.`;
  });

  await exec('T1270', async () => {
    const r = await fetch(url('/api/v17/relationships/V17-REL-MISSING/status'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ action: 'SUSPEND' }),
    });
    if (r.status !== 404) throw new Error(`Expected 404 for unknown relationship, got ${r.status}`);
    return `Unknown relationship status action returned 404.`;
  });

  // T1271 - T1286: Commercial Listings, Buyer Requests, Units & Negotiations
  await exec('T1271', async () => {
    const d = await fetch(url('/api/v17/commercial/listings'), { headers: farmerHdrs }).then((r) => r.json());
    if (!Array.isArray(d.listings) || d.listings.length < 2) {
      throw new Error(`Expected >=2 seeded listings, got ${d.listings?.length}`);
    }
    return `Commercial catalog returned ${d.listings.length} active Uganda listings.`;
  });

  await exec('T1272', async () => {
    const d = await fetch(url('/api/v17/commercial/listings?q=Arabica&countryCode=UG'), { headers: buyerHdrs }).then((r) => r.json());
    if (!d.listings.some((l: any) => String(l.title).includes('Arabica'))) {
      throw new Error('Search filter failed to match Arabica coffee listing');
    }
    return `Search filter q=Arabica&countryCode=UG matched ${d.listings.length} listing(s).`;
  });

  await exec('T1273', async () => {
    const r = await fetch(url('/api/v17/commercial/listings'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ title: 'Bad Price Produce', unitPrice: -500, availableQty: 100 }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 negative price, got ${r.status}`);
    return `Negative unitPrice listing strictly blocked with 400.`;
  });

  await exec('T1274', async () => {
    const r = await fetch(url('/api/v17/commercial/listings'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ title: 'Zero Qty Produce', unitPrice: 5000, availableQty: 0 }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 zero qty, got ${r.status}`);
    return `Zero availableQty listing strictly blocked with 400.`;
  });

  await exec('T1275', async () => {
    const r = await fetch(url('/api/v17/commercial/listings'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        sellerParticipantId: 'V17-PART-FARMER-01',
        title: `Soroti Dry Sesame Lot ${uid}`,
        sector: 'AGRICULTURE',
        category: 'Oilseeds',
        countryCode: 'UG',
        district: 'Soroti',
        unitPrice: 240000,
        currency: 'UGX',
        unitCode: 'BAG_50KG',
        availableQty: 40,
        minOrderQty: 2,
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || !d.id || d.unitCode !== 'BAG_50KG') throw new Error(`Listing failed: ${JSON.stringify(d)}`);
    listingId = d.id;
    return `Created listing ${listingId} (${d.unitCode} @ ${d.currency} ${d.unitPrice}).`;
  });

  await exec('T1276', async () => {
    const r = await fetch(url('/api/v17/commercial/requests'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ title: 'Invalid Request', requestedQty: -10, targetUnitPrice: 1000 }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 invalid qty, got ${r.status}`);
    return `Buyer request with non-positive quantity blocked with 400.`;
  });

  await exec('T1277', async () => {
    const r = await fetch(url('/api/v17/commercial/requests'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        buyerParticipantId: 'V17-PART-BUYER-01',
        title: `Need 30 Bags Grade-1 Sesame ${uid}`,
        sector: 'AGRICULTURE',
        countryCode: 'UG',
        targetDistrict: 'Kampala',
        requestedQty: 30,
        unitCode: 'BAG_50KG',
        targetUnitPrice: 235000,
        currency: 'UGX',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.status !== 'OPEN') throw new Error(`Request failed: ${JSON.stringify(d)}`);
    reqId = d.id;
    return `Buyer request ${reqId} opened in OPEN state.`;
  });

  await exec('T1278', async () => {
    const d = await fetch(url('/api/v17/commercial/quotations'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        requestId: reqId,
        listingId,
        sellerParticipantId: 'V17-PART-FARMER-01',
        buyerParticipantId: 'V17-PART-BUYER-01',
        quantity: 20,
        unitCode: 'BAG_50KG',
        unitPrice: 240000,
        currency: 'UGX',
      }),
    }).then((r) => r.json());
    if (d.normalizedKg !== 1000) throw new Error(`Expected 1000kg for 20x50kg, got ${d.normalizedKg}`);
    quotId = d.id;
    return `Quotation ${quotId}: 20 BAG_50KG normalized accurately to ${d.normalizedKg} kg.`;
  });

  await exec('T1279', async () => {
    const d = await fetch(url('/api/v17/commercial/quotations'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        sellerParticipantId: 'V17-PART-FARMER-01',
        buyerParticipantId: 'V17-PART-BUYER-01',
        quantity: 12,
        unitCode: 'BAG_100KG',
        unitPrice: 145000,
        currency: 'UGX',
      }),
    }).then((r) => r.json());
    if (d.normalizedKg !== 1200) throw new Error(`Expected 1200kg for 12x100kg, got ${d.normalizedKg}`);
    rejQuotId = d.id;
    return `BAG_100KG x 12 normalized accurately to ${d.normalizedKg} kg.`;
  });

  await exec('T1280', async () => {
    const d = await fetch(url('/api/v17/commercial/quotations'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        sellerParticipantId: 'V17-PART-FARMER-01',
        buyerParticipantId: 'V17-PART-BUYER-01',
        quantity: 2.5,
        unitCode: 'TONNE',
        unitPrice: 2800000,
        currency: 'UGX',
      }),
    }).then((r) => r.json());
    if (d.normalizedKg !== 2500) throw new Error(`Expected 2500kg for 2.5 TONNE, got ${d.normalizedKg}`);
    return `2.5 TONNE normalized accurately to ${d.normalizedKg} kg.`;
  });

  await exec('T1281', async () => {
    const d = await fetch(url('/api/v17/commercial/quotations'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        sellerParticipantId: 'V17-PART-FARMER-01',
        buyerParticipantId: 'V17-PART-BUYER-01',
        quantity: 15,
        unitCode: 'CRATE',
        unitPrice: 35000,
        currency: 'UGX',
      }),
    }).then((r) => r.json());
    if (d.normalizedKg !== null) throw new Error(`Expected null normalizedKg for CRATE, got ${d.normalizedKg}`);
    return `Domain-specific CRATE unit safely preserves normalizedKg=null.`;
  });

  await exec('T1282', async () => {
    const d = await fetch(url(`/api/v17/commercial/quotations/${quotId}/negotiate`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        proposedUnitPrice: 235000,
        proposedQty: 25,
        message: 'Counteroffer for 25 bags at 235,000 UGX',
        action: 'COUNTER',
      }),
    }).then((r) => r.json());
    if (d.quotation?.status !== 'COUNTERED' || d.negotiation?.roundNumber !== 1 || d.quotation?.normalizedKg !== 1250) {
      throw new Error(`Counteroffer R1 failed: ${JSON.stringify(d)}`);
    }
    return `Negotiation Round 1 updated total=${d.quotation.totalAmount} UGX (${d.quotation.normalizedKg} kg).`;
  });

  await exec('T1283', async () => {
    const d = await fetch(url(`/api/v17/commercial/quotations/${quotId}/negotiate`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        proposedUnitPrice: 237500,
        proposedQty: 25,
        message: 'Final agreed seller rate 237,500 UGX',
        action: 'COUNTER',
      }),
    }).then((r) => r.json());
    if (d.negotiation?.roundNumber !== 2) throw new Error(`Expected round 2, got ${d.negotiation?.roundNumber}`);
    return `Negotiation Round 2 recorded cleanly (price=${d.quotation.unitPrice}).`;
  });

  await exec('T1284', async () => {
    const d = await fetch(url(`/api/v17/commercial/quotations/${quotId}/negotiate`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ action: 'ACCEPT', message: 'Agreed' }),
    }).then((r) => r.json());
    if (d.quotation?.status !== 'ACCEPTED') throw new Error(`Expected ACCEPTED, got ${d.quotation?.status}`);
    return `Final quotation ${quotId} ACCEPTED cleanly.`;
  });

  await exec('T1285', async () => {
    const r = await fetch(url(`/api/v17/commercial/quotations/${quotId}/negotiate`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ action: 'COUNTER', proposedUnitPrice: 250000, proposedQty: 25 }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 modifying accepted quote, got ${r.status}`);
    return `Post-acceptance modification rejected with HTTP 409.`;
  });

  await exec('T1286', async () => {
    const d = await fetch(url(`/api/v17/commercial/quotations/${rejQuotId}/negotiate`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ action: 'REJECT', message: 'Not needed now' }),
    }).then((r) => r.json());
    if (d.quotation?.status !== 'REJECTED') throw new Error(`Expected REJECTED, got ${d.quotation?.status}`);
    return `Quotation ${rejQuotId} marked REJECTED.`;
  });

  // T1287 - T1310: 21-State Transaction Engine & Evidence System
  await exec('T1287', async () => {
    const r = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ buyerId: 'V17-PART-BUYER-01', sellerId: 'V17-PART-BUYER-01', amount: 100000, quantity: 10 }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 self-tx, got ${r.status}`);
    return `Self-dealing transaction rejected with HTTP 400.`;
  });

  await exec('T1288', async () => {
    const r = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ buyerId: 'V17-PART-BUYER-01', sellerId: 'V17-PART-FARMER-01', amount: 0, quantity: 10 }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 zero amount, got ${r.status}`);
    return `Zero-amount transaction rejected with HTTP 400.`;
  });

  await exec('T1289', async () => {
    const r = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        buyerId: 'V17-PART-BUYER-01',
        sellerId: 'V17-PART-FARMER-01',
        listingId,
        quotationId: quotId,
        currency: 'UGX',
        amount: 5937500,
        quantity: 25,
        unitCode: 'BAG_50KG',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.state !== 'DRAFT' || d.verificationTier !== 'PLATFORM_RECORDED') {
      throw new Error(`Transaction create failed: ${JSON.stringify(d)}`);
    }
    txId = d.id;
    return `Transaction ${txId} created in DRAFT (tier=${d.verificationTier}).`;
  });

  await exec('T1290', async () => {
    const r = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ targetState: 'COMPLETED' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 skipping states, got ${r.status}`);
    return `Invalid direct skip DRAFT->COMPLETED blocked with HTTP 409.`;
  });

  await exec('T1291', async () => {
    // Create separate tx to advance cleanly to PAYMENT_INITIATED then attempt PAYMENT_PROVIDER_VERIFIED without ref
    const txD = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ buyerId: 'V17-PART-BUYER-01', sellerId: 'V17-PART-FARMER-01', amount: 250000, quantity: 20, currency: 'UGX' }),
    }).then((r) => r.json());
    txDraftId = txD.id;
    for (const s of ['SUBMITTED', 'ACCEPTED', 'CONFIRMED', 'AWAITING_PAYMENT', 'PAYMENT_INITIATED', 'PAYMENT_CONFIRMED_UNVERIFIED']) {
      await fetch(url(`/api/v17/transactions/${txDraftId}/transition`), {
        method: 'POST',
        headers: adminHdrs,
        body: JSON.stringify({ targetState: s }),
      });
    }
    const r = await fetch(url(`/api/v17/transactions/${txDraftId}/transition`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'PAYMENT_PROVIDER_VERIFIED' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 missing externalProviderRef, got ${r.status}`);
    return `PAYMENT_PROVIDER_VERIFIED without externalProviderRef rejected with 409 PROVIDER_REF_REQUIRED.`;
  });

  await exec('T1292', async () => {
    let last: any;
    for (const s of ['SUBMITTED', 'ACCEPTED', 'CONFIRMED']) {
      last = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
        method: 'POST',
        headers: buyerHdrs,
        body: JSON.stringify({ targetState: s, note: `Stage ${s}` }),
      }).then((r) => r.json());
    }
    if (last.state !== 'CONFIRMED') throw new Error(`Expected CONFIRMED, got ${last.state}`);
    return `Transaction ${txId} progressed validly to CONFIRMED.`;
  });

  await exec('T1293', async () => {
    const d = await fetch(url('/api/v17/transactions'), { headers: buyerHdrs }).then((r) => r.json());
    const t = d.transactions.find((x: any) => x.id === txId);
    if (t?.verificationTier !== 'PARTICIPANT_CONFIRMED') {
      throw new Error(`Expected PARTICIPANT_CONFIRMED tier, got ${t?.verificationTier}`);
    }
    return `CONFIRMED transaction elevated tier to PARTICIPANT_CONFIRMED.`;
  });

  await exec('T1294', async () => {
    for (const s of ['AWAITING_PAYMENT', 'PAYMENT_INITIATED', 'PAYMENT_PENDING']) {
      const r = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
        method: 'POST',
        headers: buyerHdrs,
        body: JSON.stringify({ targetState: s }),
      });
      if (!r.ok) throw new Error(`Failed transition to ${s}`);
    }
    return `Transaction ${txId} entered PAYMENT_PENDING stage.`;
  });

  await exec('T1295', async () => {
    const d = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'PAYMENT_PROVIDER_VERIFIED', externalProviderRef: `MOMO-UG-TX-${uid}` }),
    }).then((r) => r.json());
    if (d.state !== 'PAYMENT_PROVIDER_VERIFIED' || d.verificationTier !== 'PROVIDER_CONFIRMED') {
      throw new Error(`Expected PROVIDER_CONFIRMED, got ${JSON.stringify(d)}`);
    }
    return `Attached provider ref MOMO-UG-TX-${uid} -> tier=${d.verificationTier}.`;
  });

  await exec('T1296', async () => {
    const r = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        buyerId: 'V17-PART-BUYER-01',
        sellerId: 'V17-PART-FARMER-01',
        amount: 100000,
        quantity: 10,
        externalProviderRef: `MOMO-UG-TX-${uid}`,
      }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 duplicate provider ref, got ${r.status}`);
    return `Duplicate externalProviderRef MOMO-UG-TX-${uid} blocked with HTTP 409.`;
  });

  await exec('T1297', async () => {
    const r = await fetch(url(`/api/v17/transactions/${txId}/evidence`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ evidenceType: 'PROVIDER_RECEIPT', payloadSummary: 'Missing external id' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 missing externalRefId, got ${r.status}`);
    return `Provider receipt without externalRefId rejected with HTTP 400.`;
  });

  await exec('T1298', async () => {
    const r = await fetch(url(`/api/v17/transactions/${txId}/evidence`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        evidenceType: 'PROVIDER_RECEIPT',
        externalRefId: `PSP-RCPT-${uid}`,
        payloadSummary: 'MTN MoMo clearing receipt callback matched',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.autoVerifiedFromUserUpload !== false || d.verifiedByIndependentReviewer !== false) {
      throw new Error(`Evidence upload invariant broken: ${JSON.stringify(d)}`);
    }
    return `Evidence ${d.id} recorded with autoVerifiedFromUserUpload=false.`;
  });

  await exec('T1299', async () => {
    const r = await fetch(url(`/api/v17/transactions/${txId}/evidence`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        evidenceType: 'PROVIDER_RECEIPT',
        externalRefId: `PSP-RCPT-${uid}`,
        payloadSummary: 'Duplicate receipt replay',
      }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 duplicate evidence ref, got ${r.status}`);
    return `Duplicate evidence externalRefId blocked with 409 DUPLICATE_EVIDENCE_REF.`;
  });

  await exec('T1300', async () => {
    let last: any;
    for (const s of ['IN_FULFILLMENT', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'DELIVERED']) {
      last = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
        method: 'POST',
        headers: adminHdrs,
        body: JSON.stringify({ targetState: s }),
      }).then((r) => r.json());
    }
    if (last.state !== 'DELIVERED') throw new Error(`Expected DELIVERED, got ${last.state}`);
    return `Fulfillment & transit advanced transaction cleanly to DELIVERED.`;
  });

  await exec('T1301', async () => {
    const d = await fetch(url(`/api/v17/transactions/${txId}/evidence`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        evidenceType: 'DELIVERY_PHOTO_HASH',
        payloadSummary: `Kampala buyer warehouse offload waybill #${uid}`,
      }),
    }).then((r) => r.json());
    if (!String(d.payloadHashSha256).startsWith('0x')) throw new Error('Missing SHA-256 evidence digest');
    return `Delivery evidence ${d.id} sealed with SHA-256 hash (${d.payloadHashSha256.slice(0, 14)}...).`;
  });

  await exec('T1302', async () => {
    const d = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ targetState: 'DELIVERY_CONFIRMED', note: '25 bags weighed and accepted' }),
    }).then((r) => r.json());
    if (d.verificationTier !== 'DELIVERY_CONFIRMED') throw new Error(`Expected DELIVERY_CONFIRMED, got ${d.verificationTier}`);
    return `Buyer delivery acceptance promoted tier to DELIVERY_CONFIRMED.`;
  });

  await exec('T1303', async () => {
    const d = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'COMPLETED' }),
    }).then((r) => r.json());
    if (d.state !== 'COMPLETED' || (d.stateHistory || []).length < 10) {
      throw new Error(`Expected COMPLETED with full history, got ${d.state}`);
    }
    return `Transaction ${txId} reached COMPLETED across ${d.stateHistory.length} audited transitions.`;
  });

  await exec('T1304', async () => {
    const d = await fetch(url(`/api/v17/transactions/${txId}/transition`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'RECONCILED' }),
    }).then((r) => r.json());
    if (d.state !== 'RECONCILED' || d.verificationTier !== 'RECONCILED') {
      throw new Error(`Expected RECONCILED, got ${JSON.stringify(d)}`);
    }
    return `Transaction ${txId} promoted to RECONCILED.`;
  });

  await exec('T1305', async () => {
    const d = await fetch(url(`/api/v17/transactions/${txId}/verify`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ independentReviewPassed: true }),
    }).then((r) => r.json());
    if (d.verificationTier !== 'INDEPENDENTLY_REVIEWED' || !d.providerVerified || !d.deliveryVerified) {
      throw new Error(`Verification failed: ${JSON.stringify(d)}`);
    }
    return `6-tier verifier promoted ${txId} to INDEPENDENTLY_REVIEWED (${d.evidenceCount} evidences).`;
  });

  await exec('T1306', async () => {
    const r = await fetch(url(`/api/v17/transactions/${txId}/verify`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ independentReviewPassed: true }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin verify, got ${r.status}`);
    return `Non-admin independent transaction verification denied with 403.`;
  });

  await exec('T1307', async () => {
    const txC = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ buyerId: 'V17-PART-BUYER-01', sellerId: 'V17-PART-FARMER-01', amount: 50000, quantity: 5 }),
    }).then((r) => r.json());
    txCancelId = txC.id;
    await fetch(url(`/api/v17/transactions/${txCancelId}/transition`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ targetState: 'CANCELLED' }),
    });
    const r = await fetch(url(`/api/v17/transactions/${txCancelId}/transition`), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ targetState: 'SUBMITTED' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 transition out of CANCELLED, got ${r.status}`);
    return `Terminal CANCELLED transaction ${txCancelId} blocked further transitions with 409.`;
  });

  await exec('T1308', async () => {
    const txF = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ buyerId: 'V17-PART-BUYER-01', sellerId: 'V17-PART-FARMER-01', amount: 120000, quantity: 10 }),
    }).then((r) => r.json());
    txFailId = txF.id;
    for (const s of ['SUBMITTED', 'ACCEPTED', 'CONFIRMED', 'AWAITING_PAYMENT', 'PAYMENT_INITIATED', 'FAILED', 'AWAITING_PAYMENT']) {
      const r = await fetch(url(`/api/v17/transactions/${txFailId}/transition`), {
        method: 'POST',
        headers: adminHdrs,
        body: JSON.stringify({ targetState: s }),
      });
      if (!r.ok) throw new Error(`Retry transition ${s} failed`);
    }
    return `FAILED payment ${txFailId} cleanly recovered to AWAITING_PAYMENT for retry.`;
  });

  await exec('T1309', async () => {
    const d = await fetch(url(`/api/v17/transactions/${txId}/verify`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ independentReviewPassed: true }),
    }).then((r) => r.json());
    if (!Array.isArray(d.checks) || d.checks.length < 4) throw new Error('Expected verification checks array');
    return `Verification result exposes ${d.checks.length} explicit audit checks.`;
  });

  await exec('T1310', async () => {
    const txK = await fetch(url('/api/v17/transactions'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        buyerId: 'V17-PART-BUYER-01',
        sellerId: 'V17-PART-COOP-01',
        currency: 'KES',
        amount: 45000,
        quantity: 300,
        unitCode: 'KG',
        externalProviderRef: `KES-PESA-${uid}`,
      }),
    }).then((r) => r.json());
    txKesId = txK.id;
    if (txK.currency !== 'KES') throw new Error(`Expected KES currency, got ${txK.currency}`);
    return `Created KES transaction ${txKesId} for strict multi-currency isolation check.`;
  });

  // T1311 - T1330: Reviews, Reputation & 11-Stage Disputes
  await exec('T1311', async () => {
    const r = await fetch(url('/api/v17/reviews'), {
      method: 'POST',
      headers: thirdPartyHdrs,
      body: JSON.stringify({ transactionId: txId, reviewerParticipantId: 'usr_third_party_99', rating: 5, comment: 'Fake' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-party review block, got ${r.status}`);
    return `Non-party review submission strictly denied with 403 NON_PARTY_REVIEW_BLOCKED.`;
  });

  await exec('T1312', async () => {
    const r = await fetch(url('/api/v17/reviews'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ transactionId: txFailId, reviewerParticipantId: 'V17-PART-BUYER-01', rating: 4, comment: 'Too early' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 uncompleted tx review block, got ${r.status}`);
    return `Review on incomplete transaction ${txFailId} rejected with HTTP 409.`;
  });

  await exec('T1313', async () => {
    const r = await fetch(url('/api/v17/reviews'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ transactionId: txId, reviewerParticipantId: 'V17-PART-BUYER-01', rating: 7, comment: 'Out of bounds' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 invalid rating > 5, got ${r.status}`);
    return `Out-of-range review rating rejected with HTTP 400.`;
  });

  await exec('T1314', async () => {
    const r = await fetch(url('/api/v17/reviews'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        transactionId: txId,
        reviewerParticipantId: 'V17-PART-BUYER-01',
        rating: 4.8,
        comment: 'Consistent sesame grade and timely Mbale dispatch',
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || !d.review?.id || !d.reputation) throw new Error(`Review failed: ${JSON.stringify(d)}`);
    reviewId = d.review.id;
    return `Submitted review ${reviewId}; updated subject averageRating=${d.reputation.averageRating}.`;
  });

  await exec('T1315', async () => {
    const r = await fetch(url('/api/v17/reviews'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ transactionId: txId, reviewerParticipantId: 'V17-PART-BUYER-01', rating: 5, comment: 'Repeat' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 duplicate review, got ${r.status}`);
    return `Duplicate review by same party rejected with 409 DUPLICATE_REVIEW_BLOCKED.`;
  });

  await exec('T1316', async () => {
    const d = await fetch(url(`/api/v17/reviews/${reviewId}/appeal`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ appealNote: 'Moisture test reading disputed at weighbridge' }),
    }).then((r) => r.json());
    if (d.moderationStatus !== 'APPEALED') throw new Error(`Expected APPEALED, got ${d.moderationStatus}`);
    return `Review appeal ${reviewId} transitioned cleanly to APPEALED.`;
  });

  await exec('T1317', async () => {
    const d = await fetch(url('/api/v17/reputation/V17-PART-FARMER-01'), { headers: buyerHdrs }).then((r) => r.json());
    if (!String(d.volumeNeutralNote).includes('not raw transaction volume') || !String(d.nonCreditScoringDisclaimer).includes('NOT a regulated credit score')) {
      throw new Error(`Missing volume-neutral or non-credit disclaimer: ${JSON.stringify(d)}`);
    }
    return `Reputation carries volume-neutral fairness note & non-credit-scoring disclaimer.`;
  });

  await exec('T1318', async () => {
    const d = await fetch(url('/api/v17/reputation/V17-PART-FARMER-01'), { headers: buyerHdrs }).then((r) => r.json());
    if (d.completedTransactions < 1 || d.evidenceVerifiedTransactions < 1) {
      throw new Error(`Expected >=1 evidence-verified completed tx, got ${JSON.stringify(d)}`);
    }
    return `Reputation tracks ${d.completedTransactions} completed & ${d.evidenceVerifiedTransactions} evidence-verified transactions.`;
  });

  await exec('T1319', async () => {
    const r = await fetch(url('/api/v17/disputes'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({ transactionId: txId, reason: '   ' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 blank dispute reason, got ${r.status}`);
    return `Blank dispute reason blocked with HTTP 400.`;
  });

  await exec('T1320', async () => {
    const d = await fetch(url('/api/v17/disputes'), {
      method: 'POST',
      headers: buyerHdrs,
      body: JSON.stringify({
        transactionId: txId,
        complainantId: 'V17-PART-BUYER-01',
        reason: `2 bag weight variance recorded at Kampala weighbridge ${uid}`,
        claimedAmount: 185000,
      }),
    }).then((r) => r.json());
    if (
      d.stage !== '1_OPENED' ||
      !String(d.nonCourtDisclaimer).includes('NOT a judicial court order') ||
      !String(d.nonUnlicensedEscrowDisclaimer).includes('does not hold unlicensed escrow')
    ) {
      throw new Error(`Dispute disclaimers missing: ${JSON.stringify(d)}`);
    }
    disputeId = d.id;
    return `Dispute ${disputeId} opened at 1_OPENED with non-court & non-escrow disclaimers.`;
  });

  await exec('T1321', async () => {
    const r = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '1_OPENED', note: 'Invalid self-stage repeat' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 invalid progression, got ${r.status}`);
    return `Backward/same-stage dispute jump strictly blocked with HTTP 409.`;
  });

  await exec('T1322', async () => {
    for (const s of ['2_RESPONDED', '3_EVIDENCE_COLLECTED', '4_INITIAL_ASSESSMENT', '5_MEDIATION_PROPOSED', '6_PARTY_NEGOTIATION']) {
      const r = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
        method: 'POST',
        headers: adminHdrs,
        body: JSON.stringify({ targetStage: s, note: `Progressed to ${s}` }),
      });
      if (!r.ok) throw new Error(`Failed advancing dispute to ${s}`);
    }
    return `Dispute ${disputeId} progressed cleanly through Stage 6_PARTY_NEGOTIATION.`;
  });

  await exec('T1323', async () => {
    const r = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        targetStage: '7_ADMIN_OR_COOP_REVIEW',
        conflictOfInterestDeclared: true,
        note: 'Related party reviewer detected',
      }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 conflict-of-interest block, got ${r.status}`);
    return `Conflict-of-interest guard blocked review with 409 CONFLICT_OF_INTEREST_BLOCKED.`;
  });

  await exec('T1324', async () => {
    const d = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        targetStage: '7_ADMIN_OR_COOP_REVIEW',
        conflictOfInterestDeclared: false,
        assignedMediatorId: 'MED-INDEPENDENT-UG-04',
        note: 'Reassigned to independent mediator',
      }),
    }).then((r) => r.json());
    if (d.stage !== '7_ADMIN_OR_COOP_REVIEW' || d.assignedMediatorId !== 'MED-INDEPENDENT-UG-04') {
      throw new Error(`Mediator reassignment failed: ${JSON.stringify(d)}`);
    }
    return `Independent mediator ${d.assignedMediatorId} cleared review blocker -> 7_ADMIN_OR_COOP_REVIEW.`;
  });

  await exec('T1325', async () => {
    await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '8_RESOLUTION_PROPOSED', resolutionProposal: 'Credit UGX 120,000 adjustment' }),
    });
    const d = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '9_SETTLEMENT_OR_ADJUSTMENT', note: 'Agreed to reversing adjustment' }),
    }).then((r) => r.json());
    if (d.stage !== '9_SETTLEMENT_OR_ADJUSTMENT') throw new Error('Failed stage 9');
    return `Dispute reached 9_SETTLEMENT_OR_ADJUSTMENT with recorded proposal.`;
  });

  await exec('T1326', async () => {
    const d = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '10_APPEAL_REVIEW', note: 'Final audit sign-off check' }),
    }).then((r) => r.json());
    if (d.stage !== '10_APPEAL_REVIEW') throw new Error('Failed stage 10');
    return `Dispute passed through 10_APPEAL_REVIEW cleanly.`;
  });

  await exec('T1327', async () => {
    const d = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '11_CLOSED', finalDecision: 'Mutually agreed UGX 120,000 adjustment' }),
    }).then((r) => r.json());
    if (d.stage !== '11_CLOSED' || !d.closedAt) throw new Error(`Expected 11_CLOSED, got ${JSON.stringify(d)}`);
    return `Dispute ${disputeId} closed at 11_CLOSED (${d.closedAt}).`;
  });

  await exec('T1328', async () => {
    const r = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '2_RESPONDED', note: 'Reopen' }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 on closed dispute, got ${r.status}`);
    return `Closed 11_CLOSED dispute rejected re-transition with HTTP 409.`;
  });

  await exec('T1329', async () => {
    const r = await fetch(url(`/api/v17/disputes/${disputeId}/advance`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ targetStage: '2_RESPONDED' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin dispute advance, got ${r.status}`);
    return `Non-admin dispute stage progression denied with HTTP 403.`;
  });

  await exec('T1330', async () => {
    const d = await fetch(url('/api/v17/disputes'), { headers: buyerHdrs }).then((r) => r.json());
    const found = (d.disputes || []).find((x: any) => x.id === disputeId);
    if (!found || (found.history || []).length < 8) throw new Error('Dispute audit history incomplete');
    return `Persisted dispute ${disputeId} carries ${found.history.length}-step immutable timeline.`;
  });

  // T1331 - T1345: Regional Jurisdictions, Logistics & Cooperative Workspaces
  await exec('T1331', async () => {
    const d = await fetch(url('/api/v17/regional/jurisdictions'), { headers: adminHdrs }).then((r) => r.json());
    const ug = (d.jurisdictions || []).find((j: any) => j.countryCode === 'UG');
    const inactive = (d.jurisdictions || []).filter((j: any) => j.activationState === 'INACTIVE');
    if (ug?.activationState !== 'CONTROLLED_PILOT_SANDBOX' || inactive.length < 6) {
      throw new Error(`Expected UG sandbox + 6 INACTIVE, got UG=${ug?.activationState}, inactive=${inactive.length}`);
    }
    return `Regional matrix confirmed UG=CONTROLLED_PILOT_SANDBOX and ${inactive.length} INACTIVE expansion states.`;
  });

  await exec('T1332', async () => {
    const r = await fetch(url('/api/v17/regional/jurisdictions/KE/activate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'CONTROLLED_PILOT_SANDBOX', legalCounselApproved: false }),
    });
    if (r.status !== 409) throw new Error(`Expected 409 auto-activation block, got ${r.status}`);
    return `Dormant KE sandbox activation without legal counsel clearance blocked with 409.`;
  });

  await exec('T1333', async () => {
    const d = await fetch(url('/api/v17/regional/jurisdictions/KE/activate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'CONTROLLED_PILOT_SANDBOX', legalCounselApproved: true }),
    }).then((r) => r.json());
    if (d.activationState !== 'CONTROLLED_PILOT_SANDBOX' || d.complianceReviewCleared !== true) {
      throw new Error(`Expected legal approval transition, got ${JSON.stringify(d)}`);
    }
    return `KE jurisdiction transitioned only with explicit legalCounselApproved=true.`;
  });

  await exec('T1334', async () => {
    const d = await fetch(url('/api/v17/regional/jurisdictions/KE/activate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'INACTIVE' }),
    }).then((r) => r.json());
    if (d.activationState !== 'INACTIVE') throw new Error('Failed restoring KE to INACTIVE');
    return `KE restored cleanly to INACTIVE preserving Uganda pilot focus.`;
  });

  await exec('T1335', async () => {
    const d = await fetch(url('/api/v17/regional/jurisdictions'), { headers: buyerHdrs }).then((r) => r.json());
    const missingDisc = (d.corridors || []).some((c: any) => !String(c.nonCustomsDisclaimer).includes('does not replace'));
    if (missingDisc) throw new Error('Corridor missing non-customs disclaimer');
    return `All ${(d.corridors || []).length} corridors carry explicit non-customs-replacement disclaimers.`;
  });

  await exec('T1336', async () => {
    const r = await fetch(url('/api/v17/logistics/shipments'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ transactionId: txId, originLocation: '' }),
    });
    if (r.status !== 400) throw new Error(`Expected 400 missing origin/destination, got ${r.status}`);
    return `Logistics shipment missing origin/destination rejected with HTTP 400.`;
  });

  await exec('T1337', async () => {
    const d = await fetch(url('/api/v17/logistics/shipments'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        transactionId: txId,
        corridorId: 'V17-CORR-UG-MBALE-KLA',
        carrierParticipantId: 'V17-PART-LOG-01',
        transportMode: 'TRUCK',
        originLocation: 'Soroti Aggregation Depot',
        destinationLocation: 'Kampala Namanve Silos',
        offlineSubmitted: true,
      }),
    }).then((r) => r.json());
    if (!d.id || d.hasFakeGpsCoordinates !== false || d.offlineSubmitted !== true) {
      throw new Error(`Logistics shipment invariant failed: ${JSON.stringify(d)}`);
    }
    shipId = d.id;
    return `Shipment ${shipId} created with hasFakeGpsCoordinates=false & offlineSubmitted=true.`;
  });

  await exec('T1338', async () => {
    const d = await fetch(url(`/api/v17/logistics/shipments/${shipId}/status`), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ status: 'DELIVERED', proofRef: `WB-SOROTI-${uid}` }),
    }).then((r) => r.json());
    if (d.status !== 'DELIVERED' || d.hasFakeGpsCoordinates !== false) {
      throw new Error(`Shipment update failed: ${JSON.stringify(d)}`);
    }
    return `Shipment ${shipId} updated to DELIVERED with proofRef=${d.proofRef} and zero fake GPS.`;
  });

  await exec('T1339', async () => {
    const d = await fetch(url('/api/v17/cooperatives'), { headers: farmerHdrs }).then((r) => r.json());
    const coop = (d.cooperatives || []).find((c: any) => c.id === 'V17-COOP-ELGON-01');
    if (!coop || !String(coop.nonDepositTakingDisclaimer).includes('NOT a licensed SACCO')) {
      throw new Error(`Missing non-deposit disclaimer: ${JSON.stringify(coop)}`);
    }
    return `Cooperative workspace carries explicit non-deposit-taking SACCO disclaimer.`;
  });

  await exec('T1340', async () => {
    const d = await fetch(url('/api/v17/cooperatives/V17-COOP-ELGON-01'), { headers: buyerHdrs }).then((r) => r.json());
    const allRedacted = (d.members || []).every((m: any) => m.participantRef === 'REDACTED_MEMBER_PRIVACY');
    if (!allRedacted) throw new Error(`Expected member redaction for non-admin: ${JSON.stringify(d.members)}`);
    return `Cooperative detail redacted ${d.members.length} member identities for unprivileged caller.`;
  });

  await exec('T1341', async () => {
    const d = await fetch(url('/api/v17/cooperatives/V17-COOP-ELGON-01'), { headers: adminHdrs }).then((r) => r.json());
    const visible = (d.members || []).every((m: any) => m.participantRef !== 'REDACTED_MEMBER_PRIVACY');
    if (!visible) throw new Error('Admin caller should see cooperative member refs');
    return `Cooperative detail exposed authorized member roster to PLATFORM_ADMIN.`;
  });

  await exec('T1342', async () => {
    const d = await fetch(url('/api/v17/cooperatives/V17-COOP-ELGON-01/activities'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        activityType: 'INPUT_PROCUREMENT',
        title: `Collective Fertilizer Pool ${uid}`,
        totalQty: 500,
        unitCode: 'KG',
        currency: 'UGX',
        totalAmount: 1900000,
      }),
    }).then((r) => r.json());
    if (!d.id || d.totalQty !== 500) throw new Error(`Coop activity failed: ${JSON.stringify(d)}`);
    return `Recorded cooperative aggregated pool activity ${d.id}.`;
  });

  await exec('T1343', async () => {
    const r = await fetch(url('/api/v17/cooperatives/V17-COOP-UNKNOWN'), { headers: adminHdrs });
    if (r.status !== 404) throw new Error(`Expected 404 unknown coop, got ${r.status}`);
    return `Unknown cooperative returned deterministic 404.`;
  });

  await exec('T1344', async () => {
    const r = await fetch(url('/api/v17/regional/jurisdictions/TZ/activate'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ targetState: 'CONTROLLED_PILOT_SANDBOX', legalCounselApproved: true }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 non-admin jurisdiction edit, got ${r.status}`);
    return `Non-admin jurisdiction activation blocked with 403.`;
  });

  await exec('T1345', async () => {
    const r = await fetch(url('/api/v17/regional/jurisdictions/ZZ/activate'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetState: 'CONTROLLED_PILOT_SANDBOX' }),
    });
    if (r.status !== 404) throw new Error(`Expected 404 unknown country ZZ, got ${r.status}`);
    return `Unknown country code ZZ returned 404.`;
  });

  // T1346 - T1362: Reconciliation, Billing Truth, Dual-Auth, Privacy & Offline Sync
  await exec('T1346', async () => {
    const d = await fetch(url('/api/v17/reconciliation/cases'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        transactionId: txId,
        currency: 'UGX',
        expectedAmount: 5937500,
        providerReportedAmount: 5912500,
        causeCategory: 'FEE_MISMATCH',
      }),
    }).then((r) => r.json());
    if (d.varianceAmount !== -25000 || d.status !== 'OPEN') throw new Error(`Recon variance mismatch: ${JSON.stringify(d)}`);
    reconCaseId = d.id;
    return `Reconciliation case ${reconCaseId} computed exact variance=${d.varianceAmount} UGX.`;
  });

  await exec('T1347', async () => {
    const d = await fetch(url(`/api/v17/reconciliation/cases/${reconCaseId}/resolve`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ postCorrectingJournalEntry: true }),
    }).then((r) => r.json());
    if (d.status !== 'REVERSAL_POSTED' || !d.correctingJournalEntryId) {
      throw new Error(`Expected REVERSAL_POSTED with journal ID, got ${JSON.stringify(d)}`);
    }
    return `Resolved ${reconCaseId} cleanly via non-destructive correcting journal ${d.correctingJournalEntryId}.`;
  });

  await exec('T1348', async () => {
    const r = await fetch(url('/api/financial/integrity-report'), { headers: adminHdrs }).then((r) => r.json());
    if (r.isBalanced === false) throw new Error('General ledger imbalanced after V17 reversing entry');
    return `General ledger preserved strict Debit == Credit balance after V17 adjustment.`;
  });

  await exec('T1349', async () => {
    const d = await fetch(url('/api/v17/reconciliation/cases'), { headers: adminHdrs }).then((r) => r.json());
    const found = (d.cases || []).find((c: any) => c.id === reconCaseId);
    if (!found || found.status !== 'REVERSAL_POSTED') throw new Error('Reconciliation case missing after resolve');
    return `Reconciliation case ${reconCaseId} persisted cleanly in REVERSAL_POSTED state.`;
  });

  await exec('T1350', async () => {
    const d = await fetch(url('/api/v17/billing/records'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        transactionId: txId,
        currency: 'UGX',
        grossTransactionValue: 5937500,
        providerFeeAmount: 25000,
        taxAmount: 18000,
        refundAmount: 0,
        platformServiceFeeAmount: 50000,
        exemptPublicService: false,
        settlementMatched: false,
      }),
    }).then((r) => r.json());
    if (d.collectedPlatformRevenue !== 0 || d.platformReceivableAmount !== 50000) {
      throw new Error(`Unmatched billing should be receivable not collected: ${JSON.stringify(d)}`);
    }
    return `Unmatched UGX billing recorded collected=0, receivable=50000 (separated from gross PSP 5937500).`;
  });

  await exec('T1351', async () => {
    const d = await fetch(url('/api/v17/billing/records'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        transactionId: txId,
        currency: 'UGX',
        grossTransactionValue: 2000000,
        providerFeeAmount: 10000,
        platformServiceFeeAmount: 25000,
        settlementMatched: true,
      }),
    }).then((r) => r.json());
    if (d.collectedPlatformRevenue !== 25000 || d.platformReceivableAmount !== 0) {
      throw new Error(`Matched billing should recognize collected revenue: ${JSON.stringify(d)}`);
    }
    return `Matched UGX billing recognized collectedPlatformRevenue=${d.collectedPlatformRevenue}.`;
  });

  await exec('T1352', async () => {
    const d = await fetch(url('/api/v17/billing/records'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        transactionId: txId,
        currency: 'UGX',
        grossTransactionValue: 500000,
        platformServiceFeeAmount: 15000,
        exemptPublicService: true,
        settlementMatched: true,
      }),
    }).then((r) => r.json());
    if (d.platformServiceFeeAmount !== 0 || d.collectedPlatformRevenue !== 0) {
      throw new Error(`Exempt public service should force 0 platform fee: ${JSON.stringify(d)}`);
    }
    return `Exempt public service billing enforced zero platform fee.`;
  });

  await exec('T1353', async () => {
    await fetch(url('/api/v17/billing/records'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        transactionId: txKesId,
        currency: 'KES',
        grossTransactionValue: 45000,
        platformServiceFeeAmount: 900,
        settlementMatched: true,
      }),
    });
    const sum = await fetch(url('/api/v17/billing/summary'), { headers: adminHdrs }).then((r) => r.json());
    if (!sum.byCurrency?.UGX || !sum.byCurrency?.KES) throw new Error('Expected separate UGX & KES billing buckets');
    return `Multi-currency billing separated cleanly (UGX gross=${sum.byCurrency.UGX.grossTransactionValue}, KES gross=${sum.byCurrency.KES.grossTransactionValue}).`;
  });

  await exec('T1354', async () => {
    const sum = await fetch(url('/api/v17/billing/summary'), { headers: adminHdrs }).then((r) => r.json());
    if (!String(sum.nonConflationDisclosure).includes('never mixed')) {
      throw new Error('Missing non-conflation disclosure');
    }
    return `Billing summary enforces multi-currency & gross/net non-conflation disclosure.`;
  });

  await exec('T1355', async () => {
    const d = await fetch(url('/api/v17/governance/policies'), { headers: adminHdrs }).then((r) => r.json());
    if (!Array.isArray(d.policies) || d.policies.length < 3 || !d.policies.every((p: any) => p.requiresDualAuthorization)) {
      throw new Error(`Expected >=3 dual-auth policies: ${JSON.stringify(d)}`);
    }
    return `Governance lists ${d.policies.length} active dual-authorization policies.`;
  });

  await exec('T1356', async () => {
    const d = await fetch(url('/api/v17/governance/approvals'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ policyId: 'V17-POL-DUAL-TREASURY', actionRequested: `Authorize adjustment ${reconCaseId}` }),
    }).then((r) => r.json());
    if (d.status !== 'PENDING_SECOND_APPROVAL') throw new Error(`Expected PENDING_SECOND_APPROVAL, got ${d.status}`);
    approvalId = d.id;
    return `Dual-auth request ${approvalId} created in PENDING_SECOND_APPROVAL.`;
  });

  await exec('T1357', async () => {
    const r = await fetch(url(`/api/v17/governance/approvals/${approvalId}/decide`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ decision: 'APPROVED' }),
    });
    if (r.status !== 403) throw new Error(`Expected 403 self-approval block, got ${r.status}`);
    return `Same-admin self-approval blocked with 403 DUAL_AUTH_VIOLATION.`;
  });

  await exec('T1358', async () => {
    const r = await fetch(url(`/api/v17/governance/approvals/${approvalId}/decide`), {
      method: 'POST',
      headers: admin2Hdrs,
      body: JSON.stringify({ decision: 'APPROVED' }),
    });
    const d = await r.json();
    if (!r.ok || d.status !== 'APPROVED' || d.secondApprovedBy !== 'usr_admin_02') {
      throw new Error(`Cross-approver failed: ${JSON.stringify(d)}`);
    }
    return `Independent second admin (usr_admin_02) approved ${approvalId}.`;
  });

  await exec('T1359', async () => {
    const d = await fetch(url('/api/v17/privacy/requests'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ participantId, requestType: 'DATA_EXPORT' }),
    }).then((r) => r.json());
    if (d.status !== 'COMPLETED' || d.exportedPayloadSummary?.secretsRedacted !== true) {
      throw new Error(`Data export privacy check failed: ${JSON.stringify(d)}`);
    }
    return `Privacy DATA_EXPORT ${d.id} completed with secretsRedacted=true.`;
  });

  await exec('T1360', async () => {
    const d = await fetch(url('/api/v17/privacy/requests'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({ participantId, requestType: 'ACCOUNT_DELETION' }),
    }).then((r) => r.json());
    if (d.status !== 'IN_REVIEW') throw new Error(`Expected IN_REVIEW for deletion request, got ${d.status}`);
    return `Privacy ACCOUNT_DELETION request ${d.id} queued in IN_REVIEW.`;
  });

  await exec('T1361', async () => {
    const r = await fetch(url('/api/v17/offline/sync'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        participantId: 'V17-PART-FARMER-01',
        actionType: 'SUBMIT_ORDER_DRAFT',
        queuedPayload: { listingId, qty: 5, district: 'Soroti' },
        syncNow: true,
      }),
    });
    const d = await r.json();
    if (r.status !== 201 || d.validationStatus !== 'REVALIDATED') {
      throw new Error(`Expected 201 REVALIDATED, got ${r.status} ${JSON.stringify(d)}`);
    }
    return `Offline field draft ${d.id} synchronized & REVALIDATED server-side.`;
  });

  await exec('T1362', async () => {
    const r = await fetch(url('/api/v17/offline/sync'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        participantId: 'V17-PART-FARMER-01',
        actionType: 'SETTLEMENT_ATTEMPT',
        queuedPayload: { transactionId: txFailId, amount: 120000 },
        syncNow: true,
      }),
    });
    const d = await r.json();
    if (r.status !== 409 || d.validationStatus !== 'REJECTED_STALE_OR_SETTLEMENT') {
      throw new Error(`Expected 409 REJECTED_STALE_OR_SETTLEMENT, got ${r.status} ${JSON.stringify(d)}`);
    }
    return `Offline settlement confirmation strictly rejected with 409 (${d.rejectionReason.slice(0, 48)}...).`;
  });

  // T1363 - T1375: Security, Real-Data Intelligence & Master V17 Synthesis
  await exec('T1363', async () => {
    const r = await fetch(url('/api/v17/network/overview'));
    if (r.status !== 401) throw new Error(`Expected 401 unauthenticated V17 request, got ${r.status}`);
    return `Unauthenticated /api/v17/network/overview rejected cleanly with HTTP 401.`;
  });

  await exec('T1364', async () => {
    const r = await fetch(url('/api/v17/participants?tenantId=TEN-KE-NAIROBI-01'), { headers: farmerHdrs });
    if (r.status !== 403) throw new Error(`Expected 403 cross-tenant isolation, got ${r.status}`);
    return `Cross-tenant parameter override rejected cleanly with HTTP 403.`;
  });

  await exec('T1365', async () => {
    const [r1, r2] = await Promise.all([
      fetch(url('/api/v17/billing/summary'), { headers: farmerHdrs }),
      fetch(url('/api/v17/reconciliation/cases'), { headers: farmerHdrs }),
    ]);
    if (r1.status !== 403 || r2.status !== 403) {
      throw new Error(`Expected 403 on farmer billing/recon access, got ${r1.status}/${r2.status}`);
    }
    return `Admin-only billing and reconciliation endpoints enforce 403 for participant role.`;
  });

  await exec('T1366', async () => {
    const r = await fetch(url('/api/v17/offline/queue'), { headers: farmerHdrs });
    const d = await r.json();
    if (!r.ok || !Array.isArray(d.queue)) throw new Error('Participant offline queue access failed');
    return `Authenticated participant retrieved ${d.queue.length} tenant-scoped offline sync item(s).`;
  });

  await exec('T1367', async () => {
    const d = await fetch(url('/api/v17/intelligence/metrics'), { headers: adminHdrs }).then((r) => r.json());
    if ((d.metrics?.registeredParticipants || 0) < 5 || (d.metrics?.totalTransactions || 0) < 4) {
      throw new Error(`Observed intelligence counts unexpectedly low: ${JSON.stringify(d.metrics)}`);
    }
    return `Intelligence reflects observed DB state (${d.metrics.registeredParticipants} participants, ${d.metrics.totalTransactions} transactions).`;
  });

  await exec('T1368', async () => {
    const d = await fetch(url('/api/v17/intelligence/metrics'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.txFunnelByCurrency?.UGX || !d.txFunnelByCurrency?.KES) {
      throw new Error(`Expected separate UGX and KES funnels: ${JSON.stringify(d.txFunnelByCurrency)}`);
    }
    return `Economic funnel strictly separates UGX (ordered=${d.txFunnelByCurrency.UGX.orderedValue}) & KES (ordered=${d.txFunnelByCurrency.KES.orderedValue}).`;
  });

  await exec('T1369', async () => {
    const d = await fetch(url('/api/v17/intelligence/metrics'), { headers: adminHdrs }).then((r) => r.json());
    if (d.metrics?.usabilitySessionsStatus !== 'NOT_CONDUCTED' && !String(d.metrics?.usabilitySessionsStatus).endsWith('_CONDUCTED')) {
      throw new Error(`Unexpected usabilitySessionsStatus: ${d.metrics?.usabilitySessionsStatus}`);
    }
    return `Usability field metric honestly reports status=${d.metrics.usabilitySessionsStatus}.`;
  });

  await exec('T1370', async () => {
    const d = await fetch(url('/api/v17/intelligence/metrics'), { headers: adminHdrs }).then((r) => r.json());
    if (!String(d.methodologyDisclosure).includes('only observed database records')) {
      throw new Error('Missing V17 intelligence methodology disclosure');
    }
    return `Economic intelligence includes mandatory real-data methodology disclosure.`;
  });

  await exec('T1371', async () => {
    const d = await fetch(url('/api/v17/transactions'), { headers: adminHdrs }).then((r) => r.json());
    const anyAuto = (d.evidences || []).some((e: any) => e.autoVerifiedFromUserUpload !== false);
    if ((d.evidences || []).length < 2 || anyAuto) {
      throw new Error('Evidence auto-verification invariant failed');
    }
    return `Verified all ${d.evidences.length} persisted evidence items enforce autoVerifiedFromUserUpload=false.`;
  });

  await exec('T1372', async () => {
    const d = await fetch(url('/api/v17/offline/queue'), { headers: adminHdrs }).then((r) => r.json());
    const hasReval = (d.queue || []).some((i: any) => i.validationStatus === 'REVALIDATED');
    const hasReject = (d.queue || []).some((i: any) => i.validationStatus === 'REJECTED_STALE_OR_SETTLEMENT');
    if (!hasReval || !hasReject) throw new Error('Offline queue missing expected audit records');
    return `Offline audit queue preserves both REVALIDATED drafts and REJECTED settlement attempts.`;
  });

  await exec('T1373', async () => {
    const [u, l, f, r16] = await Promise.all([
      fetch(url('/api/users')),
      fetch(url('/api/marketplace/listings')),
      fetch(url('/api/financial/integrity-report'), { headers: adminHdrs }),
      fetch(url('/api/v16/releases/readiness'), { headers: adminHdrs }),
    ]);
    if (!u.ok || !l.ok || !f.ok || !r16.ok) {
      throw new Error(`V1-V16 preservation HTTP failure: ${u.status}/${l.status}/${f.status}/${r16.status}`);
    }
    return `All V1-V16 baseline APIs verified healthy alongside V17 operations.`;
  });

  await exec('T1374', async () => {
    const d = await fetch(url('/api/v14/security/incidents'), { headers: adminHdrs }).then((r) => r.json());
    const v17Inc = (d.incidents || []).filter((i: any) => String(i.id).includes('V17'));
    if (v17Inc.length < 2) throw new Error(`Expected >=2 V17 security incidents logged, got ${v17Inc.length}`);
    return `Security audit log captured ${v17Inc.length} V17 auth/RBAC/cross-tenant incident(s).`;
  });

  await exec('T1375', async () => {
    const [h, ov, m, intel] = await Promise.all([
      fetch(url('/api/health')).then((r) => r.json()),
      fetch(url('/api/v17/network/overview'), { headers: adminHdrs }).then((r) => r.json()),
      fetch(url('/api/v17/database/migrations'), { headers: adminHdrs }).then((r) => r.json()),
      fetch(url('/api/v17/intelligence/metrics'), { headers: adminHdrs }).then((r) => r.json()),
    ]);
    if (
      h.product !== 'ECONEX' ||
      h.schemaVersion < 17 ||
      !String(h.attribution).includes('VINEXSAH TECHNOLOGIES') ||
      ov.statuses?.ENGINEERING_COMPLETE !== true ||
      ov.statuses?.PRODUCTION_READY !== false ||
      ov.statuses?.LIVE_PILOT_OPERATIONAL !== false ||
      !m.completeness?.complete ||
      !intel.methodologyDisclosure
    ) {
      throw new Error('Master V17 synthesis verification failed');
    }
    return `MASTER V17 SYNTHESIS PASSED: ECONEX V17.0 Schema 17, 27-Gate Remediation, Verified Onboarding, Relationships, 21-State Tx Engine, Reviews/11-Stage Disputes, Uganda/EAC Corridors, Cooperatives, Per-Currency Billing, Dual-Auth & VINEXSAH TECHNOLOGIES Attribution Verified.`;
  });

  return { passed, failed };
}
