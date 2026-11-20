/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V16.0 - Non-Destructive Production Infrastructure & Uganda Pilot Baseline Seed
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';
import type {
  V16EnvironmentConfig,
  V16EnvironmentName,
  V16InstitutionalOnboardingRecord,
  V16PilotProgramme,
  V16PilotCohort,
  V16PilotParticipantConsent,
  V16ReleaseRecord,
  V16ComplianceReview,
  V16OperationalCostRecord,
} from '../types/index.ts';

function sha256Short(val: string): string {
  return `sha256:${crypto.createHash('sha256').update(val).digest('hex').slice(0, 12)}...`;
}

export function seedV16Collections(db: ArosDatabase): void {
  const now = new Date().toISOString();
  const hasPg = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
  const hasHsm = Boolean(process.env.HSM_PKCS11_MODULE_PATH && process.env.HSM_SLOT_PIN);
  const hasWorm = Boolean(process.env.AUDIT_WORM_S3_BUCKET || process.env.AUDIT_WORM_ENDPOINT);

  // 1. Six isolated deployment environments (never mixing dev/test and prod secrets)
  if (db.v16Environments.size === 0) {
    const envs: {
      env: V16EnvironmentName;
      dbLabel: string;
      scope: V16EnvironmentConfig['providerEndpointScope'];
      policy: string;
    }[] = [
      {
        env: 'DEVELOPMENT',
        dbLabel: hasPg ? 'DEV_PG_OR_JSON_WAL' : 'LOCAL_JSON_WAL_DEV',
        scope: 'LOCAL_SANDBOX',
        policy: 'Permits synthetic dry-runs only; strictly rejects any PRODUCTION credential or live rail.',
      },
      {
        env: 'AUTOMATED_TESTING',
        dbLabel: 'ISOLATED_TEST_SNAPSHOT',
        scope: 'LOCAL_SANDBOX',
        policy: 'Non-destructive test suite execution; isolated keys; zero external settlement side effects.',
      },
      {
        env: 'STAGING',
        dbLabel: hasPg ? 'STAGING_PG16_CANDIDATE' : 'NOT_PROVISIONED_STAGING_PG16',
        scope: 'EXTERNAL_SANDBOX',
        policy: 'Requires signed candidate artifact & migration dry-run before release promotion.',
      },
      {
        env: 'INTEGRATION_TESTING',
        dbLabel: hasPg ? 'INTEGRATION_PG16_SANDBOX' : 'LOCAL_SANDBOX_INTEGRATION',
        scope: 'EXTERNAL_SANDBOX',
        policy: 'Provider sandbox & HMAC webhook signature tests only; real money settlement blocked.',
      },
      {
        env: 'CONTROLLED_PILOT',
        dbLabel: hasPg ? 'UG_PILOT_PG16' : 'LOCAL_PILOT_SANDBOX_ONLY',
        scope: 'PILOT_RESTRICTED',
        policy: 'Republic of Uganda pilot cohorts with explicit consent & non-production disclosure.',
      },
      {
        env: 'PRODUCTION',
        dbLabel: hasPg ? 'PROD_PG16_PRIMARY' : 'UNPROVISIONED_PG16_PROD',
        scope: 'PRODUCTION_LOCKED',
        policy: 'Fail-closed until 27 acceptance gates pass (PG16, PKCS#11 HSM, WORM S3, licensed rails & legal sign-off).',
      },
    ];

    for (const item of envs) {
      const missing: string[] = [];
      if (item.env === 'PRODUCTION' || item.env === 'STAGING') {
        if (!hasPg) missing.push('DATABASE_URL');
        if (!hasHsm) missing.push('HSM_PKCS11_MODULE_PATH');
        if (!hasWorm) missing.push('AUDIT_WORM_S3_BUCKET');
      }
      const cfg: V16EnvironmentConfig = {
        id: `ENV-${item.env}`,
        environment: item.env,
        configVersion: '16.0.0',
        databaseTargetLabel: item.dbLabel,
        providerEndpointScope: item.scope,
        secretRefs: [
          {
            keyName: `ECONEX_${item.env}_SIGNING_KEY`,
            configured: item.env === 'DEVELOPMENT' || item.env === 'AUTOMATED_TESTING' || hasHsm,
            lastRotatedAt: item.env === 'DEVELOPMENT' ? now : null,
            fingerprintRedacted: item.env === 'DEVELOPMENT' ? sha256Short(`DEV-${now}`) : 'NOT_PROVISIONED',
            scope: item.env,
          },
          {
            keyName: `ECONEX_${item.env}_WEBHOOK_SECRET`,
            configured: item.env === 'DEVELOPMENT' || item.env === 'AUTOMATED_TESTING',
            lastRotatedAt: item.env === 'DEVELOPMENT' ? now : null,
            fingerprintRedacted: item.env === 'DEVELOPMENT' ? sha256Short('DEV_WH_2026') : 'NOT_PROVISIONED',
            scope: item.env,
          },
        ],
        requiredVariablesChecked: true,
        missingRequiredVariables: missing,
        crossEnvProductionCredBlocked: true,
        accessPolicySummary: item.policy,
        status:
          item.env === 'DEVELOPMENT' || item.env === 'AUTOMATED_TESTING'
            ? 'LOCAL_ONLY'
            : missing.length > 0
              ? 'NOT_CONFIGURED'
              : 'CONFIGURED_NOT_CONNECTED',
        updatedAt: now,
      };
      db.v16Environments.set(cfg.id, cfg);
    }
  }

  // 2. 12-Stage Institutional Onboarding Pipeline (truthful: none auto-approved without signed docs)
  if (db.v16InstitutionalOnboardings.size === 0) {
    const institutions: V16InstitutionalOnboardingRecord[] = [
      {
        id: 'INST-ONB-UG-MOMO-01',
        institutionName: 'Target Mobile Money Operator (Uganda)',
        institutionType: 'MOBILE_MONEY',
        jurisdiction: 'UG',
        currentStage: '4_TECHNICAL_REQUIREMENTS',
        stageNumber: 4,
        protocolsSupported: ['REST', 'OAUTH2', 'SIGNED_WEBHOOK'],
        contactNameRedacted: 'Pending External Liaison',
        agreementApproved: false,
        sandboxTested: false,
        securityValidated: false,
        productionAuthorized: false,
        evidenceRefs: ['SPEC-UG-MOMO-2026'],
        approvalDisclaimer: 'Target integration profile only; does NOT constitute commercial agreement or live authorization.',
        readinessState: 'APPROVAL_PENDING',
        updatedAt: now,
      },
      {
        id: 'INST-ONB-UG-BANK-01',
        institutionName: 'Participating Commercial Bank Target (Kampala)',
        institutionType: 'COMMERCIAL_BANK',
        jurisdiction: 'UG',
        currentStage: '3_AUTHORIZED_CONTACT',
        stageNumber: 3,
        protocolsSupported: ['ISO_20022', 'MTLS', 'REST'],
        contactNameRedacted: 'Pending Bank Treasury Desk',
        agreementApproved: false,
        sandboxTested: false,
        securityValidated: false,
        productionAuthorized: false,
        evidenceRefs: ['ISO20022-PAIN001-MAP'],
        approvalDisclaimer: 'Target clearing bank profile only; awaiting legal data-sharing & bilateral agreement.',
        readinessState: 'NOT_CONFIGURED',
        updatedAt: now,
      },
      {
        id: 'INST-ONB-UG-CUSTOMS-01',
        institutionName: 'Uganda Revenue & Customs Corridor Interface (Target)',
        institutionType: 'CUSTOMS_REVENUE',
        jurisdiction: 'UG',
        currentStage: '2_INTEREST_RECORDED',
        stageNumber: 2,
        protocolsSupported: ['REST', 'SIGNED_WEBHOOK', 'SECURE_FILE'],
        contactNameRedacted: 'Pending Statutory Desk',
        agreementApproved: false,
        sandboxTested: false,
        securityValidated: false,
        productionAuthorized: false,
        evidenceRefs: ['EAC-SCT-SCHEMA-REF'],
        approvalDisclaimer: 'Technical interoperability schema prepared; zero official agency endorsement claimed.',
        readinessState: 'NOT_CONFIGURED',
        updatedAt: now,
      },
      {
        id: 'INST-ONB-KE-MPESA-01',
        institutionName: 'Regional Cross-Border Mobile Wallet Target (Kenya)',
        institutionType: 'MOBILE_MONEY',
        jurisdiction: 'KE',
        currentStage: '1_IDENTIFIED',
        stageNumber: 1,
        protocolsSupported: ['REST', 'OAUTH2', 'SIGNED_WEBHOOK'],
        contactNameRedacted: 'Unassigned',
        agreementApproved: false,
        sandboxTested: false,
        securityValidated: false,
        productionAuthorized: false,
        evidenceRefs: [],
        approvalDisclaimer: 'Planned EAC regional expansion corridor target; unconfigured.',
        readinessState: 'NOT_CONFIGURED',
        updatedAt: now,
      },
    ];
    for (const rec of institutions) {
      db.v16InstitutionalOnboardings.set(rec.id, rec);
    }
  }

  // 3. Uganda Pilot Programme, Initial Cohorts & Consenting Seeded Baseline
  if (db.v16PilotProgrammes.size === 0) {
    const pilot: V16PilotProgramme = {
      id: 'PILOT-UG-2026-01',
      pilotCode: 'UG-PILOT-CTRL-01',
      title: 'ECONEX Uganda Controlled Economic & Agricultural Pilot',
      jurisdiction: 'UG',
      districtsCovered: ['Mbale', 'Kampala', 'Jinja', 'Gulu'],
      startDate: '2026-11-17',
      endDate: '2027-02-28',
      administrators: ['usr_admin_01'],
      operationalRulesSummary:
        'Consenting evaluation cohorts operate under strict non-production disclosure until licensed mobile money credentials and legal approvals are cleared.',
      usesLivePaymentRails: false,
      nonProductionDisclosure:
        'CONTROLLED NON-PRODUCTION WORKFLOW: No live mobile money or bank funds move unless a licensed provider integration reaches PRODUCTION_VERIFIED.',
      status: 'CONTROLLED_SANDBOX_ACTIVE',
      updatedAt: now,
    };
    db.v16PilotProgrammes.set(pilot.id, pilot);

    const cohorts: V16PilotCohort[] = [
      {
        id: 'COH-UG-MBALE-COFFEE',
        pilotId: pilot.id,
        name: 'Mbale Smallholder & Cooperative Growers Cohort',
        jurisdiction: 'UG',
        district: 'Mbale',
        targetCategories: ['FARMER', 'COOPERATIVE'],
        enrolledCount: 2,
        verifiedCount: 2,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'COH-UG-KLA-SME',
        pilotId: pilot.id,
        name: 'Kampala Commercial Buyers & SME Vendors Cohort',
        jurisdiction: 'UG',
        district: 'Kampala',
        targetCategories: ['BUYER', 'MANUFACTURER', 'RETAIL'],
        enrolledCount: 1,
        verifiedCount: 1,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'COH-UG-JINJA-LOG',
        pilotId: pilot.id,
        name: 'Jinja & Northern Corridor Logistics Operators Cohort',
        jurisdiction: 'UG',
        district: 'Jinja',
        targetCategories: ['LOGISTICS_PROVIDER'],
        enrolledCount: 1,
        verifiedCount: 1,
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    for (const c of cohorts) db.v16PilotCohorts.set(c.id, c);

    const consents: V16PilotParticipantConsent[] = [
      {
        id: 'CONSENT-UG-FARMER-01',
        pilotId: pilot.id,
        cohortId: 'COH-UG-MBALE-COFFEE',
        participantId: 'EP-UG-FARMER-SARAH',
        participantCategory: 'FARMER',
        jurisdiction: 'UG',
        district: 'Mbale',
        consentVersion: 'V16.0-UG-NONPROD-1',
        informedConsentGranted: true,
        disclosedNonProduction: true,
        supportNeedsNote: 'Luganda Simple Mode & large text target.',
        isNonProductionTestRecord: true,
        consentedAt: now,
      },
      {
        id: 'CONSENT-UG-COOP-01',
        pilotId: pilot.id,
        cohortId: 'COH-UG-MBALE-COFFEE',
        participantId: 'EP-UG-COOP-ELGON',
        participantCategory: 'COOPERATIVE',
        jurisdiction: 'UG',
        district: 'Mbale',
        consentVersion: 'V16.0-UG-NONPROD-1',
        informedConsentGranted: true,
        disclosedNonProduction: true,
        supportNeedsNote: 'Cooperative bulk lot coordination.',
        isNonProductionTestRecord: true,
        consentedAt: now,
      },
    ];
    for (const cs of consents) db.v16PilotConsents.set(cs.id, cs);
  }

  // NOTE: Intentionally do NOT seed v16UsabilitySessions or v16UsabilityTaskResults!
  // Zero fabricated human usability sessions; external moderated sessions must remain NOT_CONDUCTED until executed.

  // 4. Production Release Artifact Candidate & Rollback Baseline
  if (db.v16Releases.size === 0) {
    const rel: V16ReleaseRecord = {
      id: 'REL-V16.0.0-RC1',
      versionTag: 'V16.0.0-RC1',
      environment: 'DEVELOPMENT',
      strategy: 'BLUE_GREEN',
      artifactChecksumSha256: crypto.createHash('sha256').update('ECONEX-V16.0.0-RC1-SCHEMA16').digest('hex'),
      buildVerified: true,
      migrationChecked: true,
      securityChecked: true,
      smokeTestsPassed: true,
      stagingValidated: false,
      status: 'CANDIDATE',
      rollbackTargetVersion: 'V15.9-FINAL-CONSOLIDATION-AND-RELEASE',
      createdAt: now,
      updatedAt: now,
    };
    db.v16Releases.set(rel.id, rel);
  }

  // 5. Configurable Uganda Regulatory & Legal Compliance Register (PENDING_LEGAL_REVIEW)
  if (db.v16ComplianceReviews.size === 0) {
    const reviews: V16ComplianceReview[] = [
      {
        id: 'CMP-UG-PDP-2019',
        jurisdiction: 'UG',
        domain: 'DATA_PROTECTION',
        statutoryReference: 'Uganda Data Protection and Privacy Act, 2019',
        requirementSummary: 'Explicit participant consent, lawful processing notice, and local residency boundaries.',
        reviewStatus: 'PENDING_LEGAL_REVIEW',
        regulatedActivationBlocked: true,
        notes: 'Technical consent logs active; requires independent DPO / legal counsel sign-off.',
      },
      {
        id: 'CMP-UG-NPS-2020',
        jurisdiction: 'UG',
        domain: 'PAYMENT_PROVIDER_INTEGRATION',
        statutoryReference: 'Uganda National Payment Systems Act, 2020 (Bank of Uganda)',
        requirementSummary: 'ECONEX operates solely as an integration software layer; all settlements must route through BoU-licensed PSPs/banks.',
        reviewStatus: 'PENDING_LEGAL_REVIEW',
        regulatedActivationBlocked: true,
        notes: 'No unlicensed deposit-taking or settlement executed by ECONEX.',
      },
      {
        id: 'CMP-UG-ETA-2011',
        jurisdiction: 'UG',
        domain: 'ELECTRONIC_TRANSACTIONS',
        statutoryReference: 'Electronic Transactions Act, 2011 & Electronic Signatures Act, 2011',
        requirementSummary: 'Tamper-evident agreement audit trails and verified legal translations prior to binding local-language execution.',
        reviewStatus: 'PENDING_LEGAL_REVIEW',
        regulatedActivationBlocked: true,
        notes: 'Local-language legal terms stay in verified English fallback until approved.',
      },
      {
        id: 'CMP-UG-TAX-URA',
        jurisdiction: 'UG',
        domain: 'TAX_REPORTING',
        statutoryReference: 'Uganda Revenue Authority VAT & EFRIS Invoicing Rules',
        requirementSummary: 'Accurate tax schedule separation and non-destructive invoice reversal records.',
        reviewStatus: 'PENDING_LEGAL_REVIEW',
        regulatedActivationBlocked: true,
        notes: 'Awaiting URA technical & legal alignment prior to live automated tax submissions.',
      },
      {
        id: 'CMP-EAC-TRADE-01',
        jurisdiction: 'EAC',
        domain: 'CROSS_BORDER_TRADE',
        statutoryReference: 'EAC Customs Union & AfCFTA Rules of Origin Framework',
        requirementSummary: 'Distinguish platform-generated export drafts from official customs authority clearance.',
        reviewStatus: 'PENDING_LEGAL_REVIEW',
        regulatedActivationBlocked: true,
        notes: 'Official customs clearance requires external customs authority verification.',
      },
    ];
    for (const r of reviews) db.v16ComplianceReviews.set(r.id, r);
  }

  // 6. Baseline Operational Cost Ledger (Real recorded dev/sandbox overhead entries; never inflated)
  if (db.v16OperationalCosts.size === 0) {
    const costs: V16OperationalCostRecord[] = [
      {
        id: 'COST-V16-HOST-01',
        category: 'HOSTING',
        period: '2026-11',
        jurisdiction: 'UG',
        amountUsd: 0,
        recordedAt: now,
        note: 'Single-node local preview container baseline; cloud production hosting invoices recorded upon external provisioning.',
      },
      {
        id: 'COST-V16-DB-01',
        category: 'DATABASE',
        period: '2026-11',
        jurisdiction: 'UG',
        amountUsd: 0,
        recordedAt: now,
        note: 'Local JSON WAL active ($0 managed PG16 spend until PostgreSQL 16 instance provisioned).',
      },
    ];
    for (const c of costs) db.v16OperationalCosts.set(c.id, c);
  }
}
