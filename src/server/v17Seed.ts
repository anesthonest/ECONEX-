/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V17.0 - Non-Destructive Schema 17 Idempotent Seed
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import type {
  V17CommercialListing,
  V17CooperativeActivity,
  V17CooperativeMembership,
  V17CooperativeWorkspace,
  V17GateRemediationRecord,
  V17GovernancePolicy,
  V17JurisdictionProfile,
  V17OrganizationMember,
  V17OrganizationProfile,
  V17Participant,
  V17RegionalCorridor,
  V17Relationship,
} from '../types/index.ts';

export function seedV17Collections(db: any) {
  const now = '2026-11-17T06:00:00.000Z';

  // 1. 27-Gate Closure & Remediation Records (Synchronized 1:1 with V16 GATE-01..GATE-27)
  if (db.v17GateRemediations.size === 0) {
    const initialGates: V17GateRemediationRecord[] = [
      { gateId: 'GATE-01', gateNumber: 1, gateName: 'Code & Build Verification', category: 'INFRASTRUCTURE', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Platform Engineering', reviewer: 'Release Auditor', blockedByGates: [], requiredEvidence: 'Clean TypeScript & Vite production build', submittedEvidence: 'npm run build + tsc --noEmit passed with 0 errors', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-02', gateNumber: 2, gateName: 'Schema V16→V17 Migration & Integrity', category: 'INFRASTRUCTURE', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Database Engineering', reviewer: 'Data Governance Lead', blockedByGates: [], requiredEvidence: 'Canonical V16 backup SHA-256 + Schema 17 integrity check', submittedEvidence: 'Non-destructive migration & ledger balance parity verified', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-03', gateNumber: 3, gateName: 'Single Authoritative Write Database Lock', category: 'INFRASTRUCTURE', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Database Engineering', reviewer: 'Architecture Board', blockedByGates: [], requiredEvidence: 'Single writer lock proof with zero silent split-brain writers', submittedEvidence: 'JSON_WAL_ACTIVE single-authoritative writer lock enforced', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-04', gateNumber: 4, gateName: 'Managed PostgreSQL 16 Provisioning & PITR', category: 'INFRASTRUCTURE', status: 'EXTERNAL_DEPENDENCY_BLOCKED', criticalNonWaivable: true, owner: 'Cloud Infrastructure', reviewer: 'Security Operations', blockedByGates: [], requiredEvidence: 'Live PG16 connection string + WAL PITR archive active', submittedEvidence: 'schema_v17.sql ready; external PG16 container not provisioned', waiverAuthority: null, targetDate: '2026-12-15', updatedAt: now },
      { gateId: 'GATE-05', gateNumber: 5, gateName: 'Multi-Environment Config & Secret Isolation', category: 'SECURITY', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Platform Security', reviewer: 'CISO Delegate', blockedByGates: [], requiredEvidence: '6 isolated environments rejecting cross-env prod credentials', submittedEvidence: '6 isolated environment scopes verified with HTTP 409 block on leakage', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-06', gateNumber: 6, gateName: 'Durable 12-Category Event Bus & Replay', category: 'INFRASTRUCTURE', status: 'EXTERNAL_DEPENDENCY_BLOCKED', criticalNonWaivable: false, owner: 'Distributed Systems', reviewer: 'SRE Lead', blockedByGates: ['GATE-04'], requiredEvidence: 'External Kafka / NATS JetStream cluster probe + DLQ replay', submittedEvidence: 'Local outbox/inbox durable queue verified; external broker awaits provisioning', waiverAuthority: null, targetDate: '2026-12-18', updatedAt: now },
      { gateId: 'GATE-07', gateNumber: 7, gateName: 'PKCS#11 Cloud HSM / KMS Integration', category: 'SECURITY', status: 'EXTERNAL_DEPENDENCY_BLOCKED', criticalNonWaivable: true, owner: 'Cryptography & Security', reviewer: 'Chief Security Officer', blockedByGates: [], requiredEvidence: 'Live PKCS#11 Cloud HSM / KMS slot signing verification', submittedEvidence: 'HSM_PKCS11_MODULE_PATH unconfigured; local dev signing refuses production claims', waiverAuthority: null, targetDate: '2026-12-20', updatedAt: now },
      { gateId: 'GATE-08', gateNumber: 8, gateName: 'Fail-Closed Key Rotation & Compromise Guard', category: 'SECURITY', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Cryptography & Security', reviewer: 'Platform Security', blockedByGates: [], requiredEvidence: 'Key revocation & prod->dev fallback block', submittedEvidence: 'Verified HTTP 409 rejection on non-HSM production key rotation', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-09', gateNumber: 9, gateName: 'External Immutable WORM Audit Archive', category: 'SECURITY', status: 'EXTERNAL_DEPENDENCY_BLOCKED', criticalNonWaivable: true, owner: 'Security Operations', reviewer: 'Compliance Audit', blockedByGates: [], requiredEvidence: 'S3 Object Lock / Azure Immutable Blob WORM bucket commit', submittedEvidence: 'Local ECDSA hash-chains verified; external WORM bucket unconfigured', waiverAuthority: null, targetDate: '2026-12-20', updatedAt: now },
      { gateId: 'GATE-10', gateNumber: 10, gateName: 'Licensed Financial Provider Authorization', category: 'FINANCIAL', status: 'EXTERNAL_DEPENDENCY_BLOCKED', criticalNonWaivable: true, owner: 'Financial Partnerships', reviewer: 'Compliance Counsel', blockedByGates: ['GATE-24'], requiredEvidence: 'Production credentials from licensed MoMo/Bank PSP under BoU NPS', submittedEvidence: 'Sandbox connectors implemented; zero live production payment keys active', waiverAuthority: null, targetDate: '2027-01-15', updatedAt: now },
      { gateId: 'GATE-11', gateNumber: 11, gateName: 'HMAC Webhook Signature & Idempotency Guard', category: 'SECURITY', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Financial Engineering', reviewer: 'AppSec Lead', blockedByGates: [], requiredEvidence: 'Replay-safe idempotency + HMAC signature verification', submittedEvidence: 'HMAC validation & duplicate idempotency key blocking tested', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-12', gateNumber: 12, gateName: 'Double-Entry Ledger & Reconciliation Integrity', category: 'FINANCIAL', status: 'IMPLEMENTED', criticalNonWaivable: true, owner: 'Treasury Operations', reviewer: 'External Finance Auditor', blockedByGates: ['GATE-10'], requiredEvidence: 'Balanced ledger + live PSP settlement reconciliation match', submittedEvidence: 'Double-entry ledger balanced; non-destructive reversing reconciliation ready', waiverAuthority: null, targetDate: '2027-01-15', updatedAt: now },
      { gateId: 'GATE-13', gateNumber: 13, gateName: '12-Stage Institutional Onboarding Pipeline', category: 'LEGAL', status: 'IMPLEMENTED', criticalNonWaivable: true, owner: 'Institutional Affairs', reviewer: 'Legal Counsel', blockedByGates: ['GATE-24'], requiredEvidence: 'Signed bilateral agreement + mTLS sandbox & security validation', submittedEvidence: '12-stage institutional workflow tracking active; live agreements pending', waiverAuthority: null, targetDate: '2027-01-20', updatedAt: now },
      { gateId: 'GATE-14', gateNumber: 14, gateName: 'Uganda Pilot Cohort & Consent Governance', category: 'PILOT_OPERATIONS', status: 'TESTED_LOCAL', criticalNonWaivable: false, owner: 'Uganda Pilot Operations', reviewer: 'Data Protection Officer', blockedByGates: ['GATE-10'], requiredEvidence: 'Recorded informed consent + physical district cohort onboarding', submittedEvidence: 'Informed consent & non-production disclosure enforced', waiverAuthority: null, targetDate: '2027-01-25', updatedAt: now },
      { gateId: 'GATE-15', gateNumber: 15, gateName: 'Verified Delivery Evidence & Receipt Matching', category: 'FINANCIAL', status: 'IMPLEMENTED', criticalNonWaivable: true, owner: 'Trade & Logistics Ops', reviewer: 'Settlement Auditor', blockedByGates: ['GATE-10'], requiredEvidence: 'Independent delivery + PSP settlement evidence cross-verification', submittedEvidence: 'V17 6-tier evidence verification prevents auto-verification of uploads', waiverAuthority: null, targetDate: '2027-01-15', updatedAt: now },
      { gateId: 'GATE-16', gateNumber: 16, gateName: 'Human Usability Field Evaluation', category: 'PILOT_OPERATIONS', status: 'NOT_STARTED', criticalNonWaivable: false, owner: 'UX Research Lead', reviewer: 'Product Accessibility Lead', blockedByGates: [], requiredEvidence: 'At least 8 moderated field usability sessions in Uganda', submittedEvidence: 'NOT_CONDUCTED (0 real field sessions recorded; zero fabricated data)', waiverAuthority: null, targetDate: '2026-12-30', updatedAt: now },
      { gateId: 'GATE-17', gateNumber: 17, gateName: 'Multilingual Localization & Legal Fallback', category: 'LOCALIZATION', status: 'IMPLEMENTED', criticalNonWaivable: false, owner: 'Localization Operations', reviewer: 'Legal & Linguistics Panel', blockedByGates: [], requiredEvidence: '7/7 Uganda & EAC languages reviewed for legal/financial copy', submittedEvidence: 'English fallback active on unreviewed legal/financial terms', waiverAuthority: null, targetDate: '2026-12-22', updatedAt: now },
      { gateId: 'GATE-18', gateNumber: 18, gateName: 'Simple Mode Low-Bandwidth & Voice Accessibility', category: 'PILOT_OPERATIONS', status: 'TESTED_LOCAL', criticalNonWaivable: false, owner: 'Frontend UX Engineering', reviewer: 'Accessibility Reviewer', blockedByGates: [], requiredEvidence: 'Mobile-first Simple Mode + Offline queue + Voice safeguards', submittedEvidence: 'Simple Mode, Low Data Mode, Offline Sync queue & confirmation prompts active', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-19', gateNumber: 19, gateName: 'Operational Telemetry & Incident Workflows', category: 'INFRASTRUCTURE', status: 'TESTED_LOCAL', criticalNonWaivable: false, owner: 'SRE Operations', reviewer: 'Platform Lead', blockedByGates: [], requiredEvidence: 'Correlation ID telemetry + incident transition timeline', submittedEvidence: 'Monitoring health & incident workflow active', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-20', gateNumber: 20, gateName: 'Disaster Recovery & Rollback Verification', category: 'INFRASTRUCTURE', status: 'IMPLEMENTED', criticalNonWaivable: true, owner: 'SRE Operations', reviewer: 'Architecture Board', blockedByGates: ['GATE-04'], requiredEvidence: 'Offsite PG16 PITR recovery drill within RPO/RTO SLA', submittedEvidence: 'Local JSON WAL recovery drill & canonical backup SHA verified', waiverAuthority: null, targetDate: '2026-12-22', updatedAt: now },
      { gateId: 'GATE-21', gateNumber: 21, gateName: 'Staging Validation & Release Rollback Pipeline', category: 'INFRASTRUCTURE', status: 'IMPLEMENTED', criticalNonWaivable: true, owner: 'Release Management', reviewer: 'QA Lead', blockedByGates: ['GATE-04'], requiredEvidence: 'Dedicated external STAGING deployment sign-off', submittedEvidence: 'Staging gate blocks production deploy when unvalidated', waiverAuthority: null, targetDate: '2026-12-28', updatedAt: now },
      { gateId: 'GATE-22', gateNumber: 22, gateName: 'Real-Data Economic Funnel Separation', category: 'FINANCIAL', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Economic Intelligence', reviewer: 'Financial Controller', blockedByGates: [], requiredEvidence: 'Strict separation of Registered -> Ordered -> Paid -> Provider-Settled -> Reconciled', submittedEvidence: 'Per-currency real-data ledger metrics & methodology disclosure enforced', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-23', gateNumber: 23, gateName: 'Commercial Unit Economics & Revenue Truth', category: 'FINANCIAL', status: 'IMPLEMENTED', criticalNonWaivable: true, owner: 'Commercial Finance', reviewer: 'CFO Delegate', blockedByGates: ['GATE-10'], requiredEvidence: 'PSP gross separated from platform service fee & collected revenue', submittedEvidence: 'Billing separates gross value, PSP fees, taxes, refunds & platform receivables', waiverAuthority: null, targetDate: '2027-01-15', updatedAt: now },
      { gateId: 'GATE-24', gateNumber: 24, gateName: 'Uganda Regulatory & Legal Counsel Review', category: 'LEGAL', status: 'EXTERNAL_DEPENDENCY_BLOCKED', criticalNonWaivable: true, owner: 'Legal & Compliance', reviewer: 'External Legal Counsel', blockedByGates: [], requiredEvidence: 'Written legal counsel clearance (PDP 2019, NPS 2020, ETA 2011, URA)', submittedEvidence: 'Statutory checklists mapped; regulated payment/cross-border flows require formal counsel sign-off', waiverAuthority: null, targetDate: '2027-01-10', updatedAt: now },
      { gateId: 'GATE-25', gateNumber: 25, gateName: 'Tenant Isolation & Role-Based Authorization', category: 'SECURITY', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'Platform Security', reviewer: 'AppSec Lead', blockedByGates: [], requiredEvidence: 'Fail-closed 401/403 + tenant isolation + dual-auth checks', submittedEvidence: 'RBAC, tenant isolation & cross-tenant self-grant blocks verified', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-26', gateNumber: 26, gateName: 'Zero Silent Secret or Credential Leakage', category: 'SECURITY', status: 'TESTED_LOCAL', criticalNonWaivable: true, owner: 'AppSec Lead', reviewer: 'CISO Delegate', blockedByGates: [], requiredEvidence: 'Zero secrets/hashes returned in public or client API responses', submittedEvidence: 'Redacted secret refs & scrubbed passwords verified', waiverAuthority: null, targetDate: '2026-11-17', updatedAt: now },
      { gateId: 'GATE-27', gateNumber: 27, gateName: 'VINEXSAH TECHNOLOGIES Production Go-Live Sign-Off', category: 'LEGAL', status: 'EXTERNAL_DEPENDENCY_BLOCKED', criticalNonWaivable: true, owner: 'VINEXSAH TECHNOLOGIES Executive', reviewer: 'Release Governance Board', blockedByGates: ['GATE-04', 'GATE-06', 'GATE-07', 'GATE-09', 'GATE-10', 'GATE-13', 'GATE-16', 'GATE-20', 'GATE-21', 'GATE-24'], requiredEvidence: 'All 26 prerequisite gates cleared', submittedEvidence: 'Blocked pending external infrastructure, legal clearance & live PSP rails', waiverAuthority: null, targetDate: '2027-01-30', updatedAt: now },
    ];
    for (const g of initialGates) {
      db.v17GateRemediations.set(g.gateId, g);
    }
  }

  // 2. Verified Participant & Organization Network Directory (Truthfully labelled non-government verified)
  if (db.v17Participants.size === 0) {
    const participants: V17Participant[] = [
      {
        id: 'V17-PART-FARMER-01',
        userId: 'usr_farmer_01',
        tenantId: 'TEN-UG-ELGON-01',
        participantType: 'FARMER',
        displayName: 'Sarah Namubiru',
        phoneMasked: '+256 772 *** 456',
        countryCode: 'UG',
        district: 'Mbale',
        languages: ['en', 'lg'],
        verificationLevel: 'DOCUMENTS_REVIEWED',
        verificationSourceLabel: 'Platform Cooperative Attestation (Not Government-Verified)',
        govtVerified: false,
        consentVersion: 'UG-PDP-2026-v1',
        consentGranted: true,
        visibility: 'PARTICIPANTS_ONLY',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V17-PART-BUYER-01',
        userId: 'usr_buyer_01',
        tenantId: 'TEN-UG-KLA-01',
        participantType: 'BUYER',
        displayName: 'Kampala Agro-Export Buyers Ltd',
        phoneMasked: '+256 701 *** 890',
        countryCode: 'UG',
        district: 'Kampala',
        languages: ['en', 'sw'],
        verificationLevel: 'ORGANIZATION_VERIFIED',
        verificationSourceLabel: 'Platform Business Documents Reviewed (Not Government-Verified)',
        govtVerified: false,
        consentVersion: 'UG-PDP-2026-v1',
        consentGranted: true,
        visibility: 'PUBLIC',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V17-PART-COOP-01',
        userId: 'usr_coop_01',
        tenantId: 'TEN-UG-ELGON-01',
        participantType: 'COOPERATIVE_MEMBER',
        displayName: 'Elgon Arabica Growers Cooperative Coordinator',
        phoneMasked: '+256 752 *** 311',
        countryCode: 'UG',
        district: 'Mbale',
        languages: ['en', 'lg'],
        verificationLevel: 'ORGANIZATION_VERIFIED',
        verificationSourceLabel: 'Platform Cooperative Registry Checked (Not Government-Verified)',
        govtVerified: false,
        consentVersion: 'UG-PDP-2026-v1',
        consentGranted: true,
        visibility: 'PUBLIC',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V17-PART-LOG-01',
        userId: 'usr_transporter_01',
        tenantId: 'TEN-UG-KLA-01',
        participantType: 'LOGISTICS_OPERATOR',
        displayName: 'Nile Corridor Freight & Cold Chain',
        phoneMasked: '+256 782 *** 118',
        countryCode: 'UG',
        district: 'Jinja',
        languages: ['en', 'sw', 'xog'],
        verificationLevel: 'IDENTITY_VERIFIED',
        verificationSourceLabel: 'Platform Carrier Contact & Licence Upload Reviewed (Not Government-Verified)',
        govtVerified: false,
        consentVersion: 'UG-PDP-2026-v1',
        consentGranted: true,
        visibility: 'PUBLIC',
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const p of participants) db.v17Participants.set(p.id, p);
  }

  if (db.v17Organizations.size === 0) {
    const orgs: V17OrganizationProfile[] = [
      {
        id: 'V17-ORG-ELGON-COOP',
        tenantId: 'TEN-UG-ELGON-01',
        legalName: 'Elgon Arabica Growers Cooperative Union',
        orgType: 'FARMER_COOPERATIVE',
        countryCode: 'UG',
        district: 'Mbale',
        registrationRef: 'PLATFORM-REF-UG-COOP-01',
        verificationLevel: 'ORGANIZATION_VERIFIED',
        govtVerified: false,
        verifiedByNote: 'Platform internal review completed; direct URSB/Ministry API verification not connected.',
        visibility: 'PUBLIC',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V17-ORG-KLA-BUYERS',
        tenantId: 'TEN-UG-KLA-01',
        legalName: 'Kampala Agro-Export Buyers Ltd',
        orgType: 'ENTERPRISE',
        countryCode: 'UG',
        district: 'Kampala',
        registrationRef: 'PLATFORM-REF-UG-ENT-02',
        verificationLevel: 'ORGANIZATION_VERIFIED',
        govtVerified: false,
        verifiedByNote: 'Platform document check completed; external government registry link NOT_CONFIGURED.',
        visibility: 'PUBLIC',
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const o of orgs) db.v17Organizations.set(o.id, o);

    const members: V17OrganizationMember[] = [
      { id: 'V17-ORGM-01', organizationId: 'V17-ORG-ELGON-COOP', participantId: 'V17-PART-COOP-01', role: 'ADMIN', status: 'ACTIVE', addedAt: now },
      { id: 'V17-ORGM-02', organizationId: 'V17-ORG-ELGON-COOP', participantId: 'V17-PART-FARMER-01', role: 'MEMBER', status: 'ACTIVE', addedAt: now },
      { id: 'V17-ORGM-03', organizationId: 'V17-ORG-KLA-BUYERS', participantId: 'V17-PART-BUYER-01', role: 'OWNER', status: 'ACTIVE', addedAt: now },
    ];
    for (const m of members) db.v17OrganizationMembers.set(m.id, m);
  }

  // 3. Initial Commercial Relationship
  if (db.v17Relationships.size === 0) {
    const rel: V17Relationship = {
      id: 'V17-REL-01',
      tenantId: 'TEN-UG-ELGON-01',
      partyAId: 'V17-PART-FARMER-01',
      partyBId: 'V17-PART-COOP-01',
      relationshipType: 'FARMER_COOPERATIVE',
      visibility: 'PARTICIPANTS_ONLY',
      status: 'ACTIVE',
      establishedAt: now,
      expiresAt: '2027-11-17T06:00:00.000Z',
      updatedAt: now,
    };
    db.v17Relationships.set(rel.id, rel);
  }

  // 4. Initial Verified Commercial Listings (Mbale / Kampala Uganda)
  if (db.v17CommercialListings.size === 0) {
    const listings: V17CommercialListing[] = [
      {
        id: 'V17-LIST-COFFEE-01',
        tenantId: 'TEN-UG-ELGON-01',
        sellerParticipantId: 'V17-PART-FARMER-01',
        organizationId: 'V17-ORG-ELGON-COOP',
        title: 'Washed Bugisu Arabica Parchment Coffee (AA Grade)',
        sector: 'AGRICULTURE',
        category: 'Coffee',
        countryCode: 'UG',
        district: 'Mbale',
        unitPrice: 12500,
        currency: 'UGX',
        unitCode: 'KG',
        availableQty: 2500,
        minOrderQty: 50,
        qualityGrade: 'AA Washed (<12% moisture)',
        deliveryTerms: 'Ex-Mbale Collection Hub or Kampala Corridor Dispatch',
        visibility: 'PUBLIC',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V17-LIST-MAIZE-02',
        tenantId: 'TEN-UG-ELGON-01',
        sellerParticipantId: 'V17-PART-COOP-01',
        organizationId: 'V17-ORG-ELGON-COOP',
        title: 'Clean Dried White Maize Grain (100kg Bag)',
        sector: 'AGRICULTURE',
        category: 'Grains',
        countryCode: 'UG',
        district: 'Mbale',
        unitPrice: 145000,
        currency: 'UGX',
        unitCode: 'BAG_100KG',
        availableQty: 180,
        minOrderQty: 5,
        qualityGrade: 'EAS 2 Grade 1',
        deliveryTerms: 'Collection at Mbale Cooperative Silo',
        visibility: 'PUBLIC',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const l of listings) db.v17CommercialListings.set(l.id, l);
  }

  // 5. Regional Jurisdictions: Uganda Controlled Pilot Sandbox + 6 Dormant EAC/AfCFTA States (Never auto-activated)
  if (db.v17Jurisdictions.size === 0) {
    const jurisdictions: V17JurisdictionProfile[] = [
      {
        countryCode: 'UG',
        countryName: 'Republic of Uganda',
        currency: 'UGX',
        activationState: 'CONTROLLED_PILOT_SANDBOX',
        complianceReviewCleared: false,
        regulatoryApprovalsPending: ['BoU NPS 2020 Payment Integration Clearance', 'PDPO PDP 2019 Registration Sign-off', 'URA EFRIS Production Integration'],
        rulesSummary: 'Primary initial pilot jurisdiction. Controlled sandbox active; live regulated payments blocked pending Gate 10 & Gate 24.',
        updatedAt: now,
      },
      { countryCode: 'KE', countryName: 'Republic of Kenya', currency: 'KES', activationState: 'INACTIVE', complianceReviewCleared: false, regulatoryApprovalsPending: ['CBK NPS Clearance', 'ODPC Kenya Data Protection Compliance', 'KRA eTIMS Integration'], rulesSummary: 'Dormant regional expansion candidate. Auto-activation strictly prohibited.', updatedAt: now },
      { countryCode: 'TZ', countryName: 'United Republic of Tanzania', currency: 'TZS', activationState: 'INACTIVE', complianceReviewCleared: false, regulatoryApprovalsPending: ['BoT Payment Systems Approval', 'PDPC Tanzania Registration', 'TRA VFD Review'], rulesSummary: 'Dormant regional expansion candidate. Auto-activation strictly prohibited.', updatedAt: now },
      { countryCode: 'RW', countryName: 'Republic of Rwanda', currency: 'RWF', activationState: 'INACTIVE', complianceReviewCleared: false, regulatoryApprovalsPending: ['BNR Payment Oversight Review', 'NCSA Data Protection Law No. 058/2021', 'RRA EBM Linkage'], rulesSummary: 'Dormant regional expansion candidate. Auto-activation strictly prohibited.', updatedAt: now },
      { countryCode: 'BI', countryName: 'Republic of Burundi', currency: 'BIF', activationState: 'INACTIVE', complianceReviewCleared: false, regulatoryApprovalsPending: ['BRB Regulatory Review', 'OBR Customs/Tax Alignment'], rulesSummary: 'Dormant EAC corridor candidate.', updatedAt: now },
      { countryCode: 'SS', countryName: 'Republic of South Sudan', currency: 'SSP', activationState: 'INACTIVE', complianceReviewCleared: false, regulatoryApprovalsPending: ['BoSS Regulatory Clearance', 'Nimule Corridor Border Protocol'], rulesSummary: 'Dormant EAC corridor candidate.', updatedAt: now },
      { countryCode: 'CD', countryName: 'Democratic Republic of the Congo', currency: 'CDF', activationState: 'INACTIVE', complianceReviewCleared: false, regulatoryApprovalsPending: ['BCC Central Bank Authorization', 'EAC Western Corridor Review'], rulesSummary: 'Dormant AfCFTA/EAC corridor candidate.', updatedAt: now },
    ];
    for (const j of jurisdictions) db.v17Jurisdictions.set(j.countryCode, j);
  }

  // 6. Regional Trade & Logistics Corridors (Non-customs disclaimer)
  if (db.v17RegionalCorridors.size === 0) {
    const corridors: V17RegionalCorridor[] = [
      {
        id: 'V17-CORR-UG-MBALE-KLA',
        code: 'UG-ELGON-KLA',
        name: 'Mbale – Jinja – Kampala Agricultural Spine',
        originCountry: 'UG',
        destinationCountry: 'UG',
        originDistrict: 'Mbale',
        destinationDistrict: 'Kampala',
        transportModes: ['PICKUP_VAN', 'TRUCK', 'COOPERATIVE_BULK'],
        status: 'ACTIVE',
        nonCustomsDisclaimer: 'Domestic logistics corridor coordinator; does not replace statutory URA/police road inspections.',
      },
      {
        id: 'V17-CORR-EAC-KLA-NBO',
        code: 'EAC-NORTH-MALABA',
        name: 'Kampala – Malaba – Nairobi Northern Corridor',
        originCountry: 'UG',
        destinationCountry: 'KE',
        originDistrict: 'Kampala',
        destinationDistrict: 'Nairobi',
        transportModes: ['TRUCK', 'CROSS_BORDER_FREIGHT'],
        status: 'PLANNING',
        nonCustomsDisclaimer: 'Planning corridor only; does not replace official URA/KRA ASYCUDA customs clearance or official cross-border permits.',
      },
    ];
    for (const c of corridors) db.v17RegionalCorridors.set(c.id, c);
  }

  // 7. Cooperative Workspace (Non-deposit-taking, privacy-preserving)
  if (db.v17Cooperatives.size === 0) {
    const coop: V17CooperativeWorkspace = {
      id: 'V17-COOP-ELGON-01',
      tenantId: 'TEN-UG-ELGON-01',
      organizationId: 'V17-ORG-ELGON-COOP',
      name: 'Elgon Arabica Growers Cooperative Workspace',
      district: 'Mbale',
      countryCode: 'UG',
      memberPrivacyMode: 'AGGREGATED_ONLY',
      nonDepositTakingDisclaimer: 'Coordination workspace only — NOT a licensed SACCO deposit-taking or regulated credit institution.',
      createdAt: now,
    };
    db.v17Cooperatives.set(coop.id, coop);

    const mems: V17CooperativeMembership[] = [
      { id: 'V17-CMEM-01', cooperativeId: coop.id, participantId: 'V17-PART-FARMER-01', consentToShareProfile: true, producedKgAggregated: 2500, status: 'ACTIVE', joinedAt: now },
      { id: 'V17-CMEM-02', cooperativeId: coop.id, participantId: 'V17-PART-COOP-01', consentToShareProfile: false, producedKgAggregated: 4100, status: 'ACTIVE', joinedAt: now },
    ];
    for (const m of mems) db.v17CooperativeMemberships.set(m.id, m);

    const act: V17CooperativeActivity = {
      id: 'V17-CACT-01',
      cooperativeId: coop.id,
      activityType: 'AGGREGATED_LOT',
      title: 'Elgon Harvest Lot #14 Combined Parchment Lot',
      totalQty: 6600,
      unitCode: 'KG',
      currency: 'UGX',
      totalAmount: 82500000,
      recordedAt: now,
    };
    db.v17CooperativeActivities.set(act.id, act);
  }

  // 8. Dual-Authorization Governance Policies
  if (db.v17GovernancePolicies.size === 0) {
    const policies: V17GovernancePolicy[] = [
      {
        id: 'V17-POL-DUAL-TREASURY',
        policyCode: 'POL-DUAL-TREASURY-01',
        title: 'Dual-Authorization for Treasury Adjustments & Manual Reconciliation Reversals',
        domain: 'TREASURY',
        requiresDualAuthorization: true,
        status: 'ACTIVE',
        version: 1,
        updatedAt: now,
      },
      {
        id: 'V17-POL-REGIONAL-ACTIVATION',
        policyCode: 'POL-REGIONAL-ACT-02',
        title: 'Jurisdiction Activation Requires Legal Counsel Clearance & Dual Approval',
        domain: 'REGULATORY',
        requiresDualAuthorization: true,
        status: 'ACTIVE',
        version: 1,
        updatedAt: now,
      },
      {
        id: 'V17-POL-CROSS-TENANT-DENY',
        policyCode: 'POL-CROSS-TENANT-03',
        title: 'No Single Admin Cross-Tenant Self-Grant Without Independent Co-Approver',
        domain: 'CROSS_TENANT',
        requiresDualAuthorization: true,
        status: 'ACTIVE',
        version: 1,
        updatedAt: now,
      },
    ];
    for (const p of policies) db.v17GovernancePolicies.set(p.id, p);
  }
}
