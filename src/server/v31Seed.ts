/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V31.0 - Sovereign Infrastructure, Provider Certification, Continental Operating Framework & Pilot Seeder
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';
import type {
  V31CommercialWorkflowCase,
  V31ContinentalAnalyticsSnapshot,
  V31CountryOperatingProfile,
  V31DataResidencyPolicy,
  V31DeploymentRecord,
  V31EnterpriseApprovalPolicy,
  V31FieldValidationRecord,
  V31InstitutionalOrganization,
  V31IntegrationCredentialMetadata,
  V31IntegrationHealthHistory,
  V31OrganizationBranch,
  V31OrganizationDepartment,
  V31PilotIncident,
  V31PilotParticipant,
  V31PilotProgram,
  V31ProviderCertificationRun,
  V31SecurityIncident,
} from '../types/index.ts';

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

export function seedV31Collections(db: ArosDatabase) {
  const now = '2026-11-28T09:45:00.000Z';

  // 1. Country Data Residency Policies (6 EAC Countries)
  if (db.v31DataResidencyPolicies.size === 0) {
    const policies: V31DataResidencyPolicy[] = [
      {
        id: 'RES-UG-01',
        countryCode: 'UG',
        jurisdictionName: 'Republic of Uganda',
        primaryStorageRegion: 'af-east-kampala-primary',
        residencyMode: 'LOCAL_PRIMARY_REQUIRED',
        piiExportBlockedByDefault: true,
        encryptionAtRestStandard: 'AES-256-GCM',
        retentionDaysFinancial: 2555,
        retentionDaysAudit: 3650,
        legalHoldOverrideBlocked: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'RES-KE-01',
        countryCode: 'KE',
        jurisdictionName: 'Republic of Kenya',
        primaryStorageRegion: 'af-east-nairobi-primary',
        residencyMode: 'LOCAL_PRIMARY_REQUIRED',
        piiExportBlockedByDefault: true,
        encryptionAtRestStandard: 'AES-256-GCM',
        retentionDaysFinancial: 2555,
        retentionDaysAudit: 3650,
        legalHoldOverrideBlocked: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'RES-TZ-01',
        countryCode: 'TZ',
        jurisdictionName: 'United Republic of Tanzania',
        primaryStorageRegion: 'af-east-dar-primary',
        residencyMode: 'LOCAL_PRIMARY_REQUIRED',
        piiExportBlockedByDefault: true,
        encryptionAtRestStandard: 'AES-256-GCM',
        retentionDaysFinancial: 2555,
        retentionDaysAudit: 3650,
        legalHoldOverrideBlocked: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'RES-RW-01',
        countryCode: 'RW',
        jurisdictionName: 'Republic of Rwanda',
        primaryStorageRegion: 'af-east-kigali-primary',
        residencyMode: 'REGIONAL_MIRROR_ALLOWED',
        piiExportBlockedByDefault: true,
        encryptionAtRestStandard: 'AES-256-GCM',
        retentionDaysFinancial: 2555,
        retentionDaysAudit: 3650,
        legalHoldOverrideBlocked: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'RES-BI-01',
        countryCode: 'BI',
        jurisdictionName: 'Republic of Burundi',
        primaryStorageRegion: 'af-east-bujumbura-node',
        residencyMode: 'CROSS_BORDER_CONSENT_ONLY',
        piiExportBlockedByDefault: true,
        encryptionAtRestStandard: 'AES-256-GCM',
        retentionDaysFinancial: 2555,
        retentionDaysAudit: 3650,
        legalHoldOverrideBlocked: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'RES-SS-01',
        countryCode: 'SS',
        jurisdictionName: 'Republic of South Sudan',
        primaryStorageRegion: 'af-east-juba-node',
        residencyMode: 'CROSS_BORDER_CONSENT_ONLY',
        piiExportBlockedByDefault: true,
        encryptionAtRestStandard: 'AES-256-GCM',
        retentionDaysFinancial: 2555,
        retentionDaysAudit: 3650,
        legalHoldOverrideBlocked: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    policies.forEach((p) => db.v31DataResidencyPolicies.set(p.id, p));
  }

  // 2. Country Operating Profiles (UG, KE, TZ, RW, BI, SS)
  if (db.v31CountryOperatingProfiles.size === 0) {
    const countries: V31CountryOperatingProfile[] = [
      {
        id: 'COP-UG',
        countryCode: 'UG',
        countryName: 'Uganda',
        regionBloc: 'EAC',
        defaultCurrency: 'UGX',
        minorUnitScale: 100,
        vatStandardRatePct: 18,
        withholdingTaxPct: 6,
        mobileMoneyRails: ['MTN_MOMO_UG', 'AIRTEL_MONEY_UG'],
        bankSettlementRails: ['BOU_RTGS_SANDBOX', 'STANBIC_BANK_UG'],
        ussdShortCodePattern: '*284#',
        kycTierCount: 4,
        privacyLawReference: 'Uganda Data Protection and Privacy Act (2019)',
        regulatoryAuthority: 'Bank of Uganda (NPS Act 2020) & PDPO',
        residencyPolicyId: 'RES-UG-01',
        operatingMode: 'CONTROLLED_PILOT_PREP',
        livePaymentsEnabled: false,
        updatedAt: now,
      },
      {
        id: 'COP-KE',
        countryCode: 'KE',
        countryName: 'Kenya',
        regionBloc: 'EAC',
        defaultCurrency: 'KES',
        minorUnitScale: 100,
        vatStandardRatePct: 16,
        withholdingTaxPct: 5,
        mobileMoneyRails: ['MPESA_SAFARICOM_KE', 'AIRTEL_MONEY_KE'],
        bankSettlementRails: ['PESALINK_IPSL_KE', 'CBK_KISS_RTGS'],
        ussdShortCodePattern: '*284*254#',
        kycTierCount: 4,
        privacyLawReference: 'Kenya Data Protection Act (2019)',
        regulatoryAuthority: 'Central Bank of Kenya (NPS Act) & ODPC',
        residencyPolicyId: 'RES-KE-01',
        operatingMode: 'SANDBOX_READY',
        livePaymentsEnabled: false,
        updatedAt: now,
      },
      {
        id: 'COP-TZ',
        countryCode: 'TZ',
        countryName: 'Tanzania',
        regionBloc: 'EAC',
        defaultCurrency: 'TZS',
        minorUnitScale: 100,
        vatStandardRatePct: 18,
        withholdingTaxPct: 5,
        mobileMoneyRails: ['MPESA_TZ', 'AIRTEL_MONEY_TZ', 'TIGO_PESA_TZ'],
        bankSettlementRails: ['TIPS_BOT_TZ'],
        ussdShortCodePattern: '*284*255#',
        kycTierCount: 3,
        privacyLawReference: 'Tanzania Personal Data Protection Act (2022)',
        regulatoryAuthority: 'Bank of Tanzania (BoT)',
        residencyPolicyId: 'RES-TZ-01',
        operatingMode: 'EXPANSION_CONFIGURED',
        livePaymentsEnabled: false,
        updatedAt: now,
      },
      {
        id: 'COP-RW',
        countryCode: 'RW',
        countryName: 'Rwanda',
        regionBloc: 'EAC',
        defaultCurrency: 'RWF',
        minorUnitScale: 1,
        vatStandardRatePct: 18,
        withholdingTaxPct: 3,
        mobileMoneyRails: ['MTN_MOMO_RW', 'AIRTEL_MONEY_RW'],
        bankSettlementRails: ['BNR_RIPPS_RW'],
        ussdShortCodePattern: '*284*250#',
        kycTierCount: 3,
        privacyLawReference: 'Rwanda Law No. 058/2021 on Protection of Personal Data',
        regulatoryAuthority: 'National Bank of Rwanda (BNR)',
        residencyPolicyId: 'RES-RW-01',
        operatingMode: 'SANDBOX_READY',
        livePaymentsEnabled: false,
        updatedAt: now,
      },
      {
        id: 'COP-BI',
        countryCode: 'BI',
        countryName: 'Burundi',
        regionBloc: 'EAC',
        defaultCurrency: 'BIF',
        minorUnitScale: 1,
        vatStandardRatePct: 18,
        withholdingTaxPct: 4,
        mobileMoneyRails: ['LUMICASH_BI', 'ECOCASH_BI'],
        bankSettlementRails: ['BRB_ATS_BI'],
        ussdShortCodePattern: '*284*257#',
        kycTierCount: 3,
        privacyLawReference: 'Burundi Electronic Transactions & Consumer Protection Guidelines',
        regulatoryAuthority: 'Bank of the Republic of Burundi (BRB)',
        residencyPolicyId: 'RES-BI-01',
        operatingMode: 'EXTERNAL_APPROVAL_REQUIRED',
        livePaymentsEnabled: false,
        updatedAt: now,
      },
      {
        id: 'COP-SS',
        countryCode: 'SS',
        countryName: 'South Sudan',
        regionBloc: 'EAC',
        defaultCurrency: 'SSP',
        minorUnitScale: 100,
        vatStandardRatePct: 18,
        withholdingTaxPct: 5,
        mobileMoneyRails: ['MGURUSH_SS', 'MTN_MOMO_SS'],
        bankSettlementRails: ['BOSS_RTGS_SS'],
        ussdShortCodePattern: '*284*211#',
        kycTierCount: 3,
        privacyLawReference: 'South Sudan National Communication & Financial Regulations',
        regulatoryAuthority: 'Bank of South Sudan (BoSS)',
        residencyPolicyId: 'RES-SS-01',
        operatingMode: 'EXTERNAL_APPROVAL_REQUIRED',
        livePaymentsEnabled: false,
        updatedAt: now,
      },
    ];
    countries.forEach((c) => db.v31CountryOperatingProfiles.set(c.id, c));
  }

  // 3. External Provider Certification Runs, Credentials Metadata & Health History (aligned with V30 providers)
  if (db.v31ProviderCertificationRuns.size === 0) {
    const providers = Array.from(db.v30FinancialProviders.values());
    providers.forEach((prv, idx) => {
      const stage =
        prv.integrationStatus === 'REGULATORY_APPROVAL_REQUIRED'
          ? 'DOCUMENTED'
          : prv.integrationStatus === 'CREDENTIALS_REQUIRED'
            ? 'REGISTERED'
            : 'SANDBOX_TESTED';
      const certId = `CERT-${prv.code}`;
      const run: V31ProviderCertificationRun = {
        id: certId,
        providerId: prv.id,
        providerCode: prv.code,
        providerName: prv.name,
        currentStage: stage,
        sandboxOnly: true,
        credentialsConfigured: false,
        partnerApproved: false,
        regulatoryApproved: false,
        liveVerified: false,
        checks: [
          { testCode: 'CERT_01_AUTH', testName: 'Sandbox Token/Signature Auth Handshake', passed: true, measuredLatencyMs: 28 + (idx % 12), details: 'Sandbox handshake verified without production secrets.' },
          { testCode: 'CERT_02_EXPIRY', testName: 'Token Expiry & Refresh Recovery', passed: true, measuredLatencyMs: 19 + (idx % 9), details: 'Expired bearer simulation refreshed idempotently.' },
          { testCode: 'CERT_03_WEBHOOK', testName: 'Webhook HMAC-SHA256 Signature Check', passed: prv.supportsWebhooksHmac, measuredLatencyMs: 11, details: prv.supportsWebhooksHmac ? 'Constant-time HMAC verification passed.' : 'Polling fallback verified.' },
          { testCode: 'CERT_04_IDEMPOTENCY', testName: 'Duplicate Request Idempotency Replay Guard', passed: true, measuredLatencyMs: 14, details: 'Duplicate reference returned canonical instruction without double debit.' },
          { testCode: 'CERT_05_FAILOVER', testName: 'Timeout/Outage Circuit Breaker Failover', passed: true, measuredLatencyMs: 32, details: 'Primary failure triggered fallback without partial orphan debit.' },
          { testCode: 'CERT_06_REVERSAL', testName: 'Reversal & Refund Balanced Ledger Entry', passed: true, measuredLatencyMs: 24, details: 'Compensating credit/debit legs balanced to 0 minor variance.' },
        ],
        passRatePct: 100,
        avgMeasuredLatencyMs: 22 + (idx % 10),
        auditedByUserId: 'usr_admin_01',
        updatedAt: now,
      };
      db.v31ProviderCertificationRuns.set(run.id, run);

      const cred: V31IntegrationCredentialMetadata = {
        id: `CRED-${prv.code}`,
        providerId: prv.id,
        providerCode: prv.code,
        environment: 'SANDBOX_ADAPTER' === 'SANDBOX_ADAPTER' ? 'TEST' : 'DEV',
        authScheme: prv.providerCategory === 'CENTRAL_BANK_RTGS' ? 'ISO20022_SIGNED' : prv.supportsWebhooksHmac ? 'HMAC_SHA256_API_KEY' : 'OAUTH2_CLIENT_CREDENTIALS',
        secretReferenceKey: `ECONEX_SECRET_${prv.code}_SANDBOX_REF`,
        redactedFingerprint: `sha256:${sha256(`SANDBOX-META-${prv.code}`).slice(0, 12)}...`,
        rotationIntervalDays: 90,
        lastRotatedAt: now,
        nextRotationDueAt: '2027-02-26T09:45:00.000Z',
        presentInRuntimeEnv: false,
        liveActivationPermitted: false,
        updatedAt: now,
      };
      db.v31IntegrationCredentialsMetadata.set(cred.id, cred);

      const health: V31IntegrationHealthHistory = {
        id: `HLTH-${prv.code}-01`,
        providerId: prv.id,
        providerCode: prv.code,
        environment: 'SANDBOX_ADAPTER',
        probeStatus: prv.healthStatus === 'HEALTHY' ? 'HEALTHY' : prv.healthStatus === 'DEGRADED' ? 'DEGRADED' : 'DOWN',
        measuredLatencyMs: 24 + (idx % 14),
        errorRateBps: prv.healthStatus === 'HEALTHY' ? 0 : 120,
        circuitBreakerState: prv.healthStatus === 'HEALTHY' ? 'CLOSED' : 'OPEN',
        measuredNote: 'Baseline sandbox adapter telemetry; live external partner connection requires production onboarding.',
        recordedAt: now,
      };
      db.v31IntegrationHealthHistory.set(health.id, health);
    });
  }

  // 4. Institutional Organizations, Branches, Departments & Approval Policies
  if (db.v31InstitutionalOrganizations.size === 0) {
    const orgs: V31InstitutionalOrganization[] = [
      {
        id: 'ORG-V31-BUGISU',
        orgCode: 'BUGISU-COOP-UG',
        legalName: 'Bugisu Arabica Cooperative Union Ltd',
        orgType: 'COOPERATIVE_FEDERATION',
        countryCode: 'UG',
        registrationNumber: 'URSB-80020031944',
        taxIdNumber: 'TIN-1009482711',
        kybTier: 'TIER_3_INSTITUTIONAL',
        activeBranchCount: 2,
        defaultCurrency: 'UGX',
        status: 'ACTIVE_SANDBOX',
        createdAt: now,
      },
      {
        id: 'ORG-V31-KAMPALA-FOODS',
        orgCode: 'KLA-PROCESSOR-UG',
        legalName: 'Kampala Industrial Grain & Agro-Processing Ltd',
        orgType: 'AGRO_PROCESSOR',
        countryCode: 'UG',
        registrationNumber: 'URSB-80020049102',
        taxIdNumber: 'TIN-1009911402',
        kybTier: 'TIER_3_INSTITUTIONAL',
        activeBranchCount: 2,
        defaultCurrency: 'UGX',
        status: 'ACTIVE_SANDBOX',
        createdAt: now,
      },
      {
        id: 'ORG-V31-EAC-CARGO',
        orgCode: 'EAC-FREIGHT-KE',
        legalName: 'Nairobi-Kampala Northern Corridor Logistics PLC',
        orgType: 'LOGISTICS_CARRIER',
        countryCode: 'KE',
        registrationNumber: 'CPR-2021-88412',
        taxIdNumber: 'P051992841Q',
        kybTier: 'TIER_2_REGISTERED',
        activeBranchCount: 2,
        defaultCurrency: 'KES',
        status: 'ACTIVE_SANDBOX',
        createdAt: now,
      },
      {
        id: 'ORG-V31-VICTORIA-SACCO',
        orgCode: 'VIC-SACCO-UG',
        legalName: 'Victoria Regional Farmers & Traders SACCO',
        orgType: 'SACCO_INSTITUTION',
        countryCode: 'UG',
        registrationNumber: 'UMRA-SACCO-1194',
        taxIdNumber: 'TIN-1004418200',
        kybTier: 'TIER_3_INSTITUTIONAL',
        activeBranchCount: 2,
        defaultCurrency: 'UGX',
        status: 'ACTIVE_SANDBOX',
        createdAt: now,
      },
    ];
    orgs.forEach((o) => db.v31InstitutionalOrganizations.set(o.id, o));

    const branches: V31OrganizationBranch[] = [
      { id: 'BR-BUGISU-MBALE', organisationId: 'ORG-V31-BUGISU', branchCode: 'BUG-MBL-01', branchName: 'Mbale Central Coffee Collection Depo', countryCode: 'UG', cityOrDistrict: 'Mbale', branchManagerUserId: 'usr_coop_01', cashFloatLimitMinor: 1500000000, currency: 'UGX', active: true, createdAt: now },
      { id: 'BR-BUGISU-SIRONKO', organisationId: 'ORG-V31-BUGISU', branchCode: 'BUG-SRK-02', branchName: 'Sironko Highland Washing Station', countryCode: 'UG', cityOrDistrict: 'Sironko', branchManagerUserId: 'usr_farmer_01', cashFloatLimitMinor: 600000000, currency: 'UGX', active: true, createdAt: now },
      { id: 'BR-KLA-HQ', organisationId: 'ORG-V31-KAMPALA-FOODS', branchCode: 'KLA-IND-01', branchName: 'Kampala Industrial Area Mill HQ', countryCode: 'UG', cityOrDistrict: 'Kampala', branchManagerUserId: 'usr_buyer_01', cashFloatLimitMinor: 4000000000, currency: 'UGX', active: true, createdAt: now },
      { id: 'BR-KLA-JINJA', organisationId: 'ORG-V31-KAMPALA-FOODS', branchCode: 'KLA-JNJ-02', branchName: 'Jinja Eastern Warehouse Annex', countryCode: 'UG', cityOrDistrict: 'Jinja', branchManagerUserId: 'usr_dealer_01', cashFloatLimitMinor: 1200000000, currency: 'UGX', active: true, createdAt: now },
      { id: 'BR-EAC-NBO', organisationId: 'ORG-V31-EAC-CARGO', branchCode: 'EAC-NBO-01', branchName: 'Nairobi ICD Freight Hub', countryCode: 'KE', cityOrDistrict: 'Nairobi', branchManagerUserId: 'usr_trans_01', cashFloatLimitMinor: 250000000, currency: 'KES', active: true, createdAt: now },
      { id: 'BR-EAC-MALABA', organisationId: 'ORG-V31-EAC-CARGO', branchCode: 'EAC-MLB-02', branchName: 'Malaba OSBP Border Clearance Office', countryCode: 'KE', cityOrDistrict: 'Busia', branchManagerUserId: 'usr_trans_01', cashFloatLimitMinor: 120000000, currency: 'KES', active: true, createdAt: now },
      { id: 'BR-VIC-GULU', organisationId: 'ORG-V31-VICTORIA-SACCO', branchCode: 'VIC-GUL-01', branchName: 'Gulu Cooperative Credit Branch', countryCode: 'UG', cityOrDistrict: 'Gulu', branchManagerUserId: 'usr_coop_01', cashFloatLimitMinor: 850000000, currency: 'UGX', active: true, createdAt: now },
      { id: 'BR-VIC-MBARARA', organisationId: 'ORG-V31-VICTORIA-SACCO', branchCode: 'VIC-MBR-02', branchName: 'Mbarara Dairy & Trade Desk', countryCode: 'UG', cityOrDistrict: 'Mbarara', branchManagerUserId: 'usr_coop_01', cashFloatLimitMinor: 900000000, currency: 'UGX', active: true, createdAt: now },
    ];
    branches.forEach((b) => db.v31OrganizationBranches.set(b.id, b));

    const depts: V31OrganizationDepartment[] = [
      { id: 'DEPT-BUG-PROC', organisationId: 'ORG-V31-BUGISU', branchId: 'BR-BUGISU-MBALE', departmentCode: 'BUG-PROC', departmentName: 'Grower Aggregation & Procurement', costCenterCode: 'CC-101', headUserId: 'usr_coop_01', annualBudgetMinor: 8500000000, currency: 'UGX', createdAt: now },
      { id: 'DEPT-BUG-FIN', organisationId: 'ORG-V31-BUGISU', branchId: 'BR-BUGISU-MBALE', departmentCode: 'BUG-FIN', departmentName: 'Treasury & Settlement Control', costCenterCode: 'CC-102', headUserId: 'usr_admin_01', annualBudgetMinor: 3200000000, currency: 'UGX', createdAt: now },
      { id: 'DEPT-KLA-PROC', organisationId: 'ORG-V31-KAMPALA-FOODS', branchId: 'BR-KLA-HQ', departmentCode: 'KLA-PROC', departmentName: 'Bulk Grain Offtake & Supply', costCenterCode: 'CC-201', headUserId: 'usr_buyer_01', annualBudgetMinor: 15000000000, currency: 'UGX', createdAt: now },
      { id: 'DEPT-KLA-OPS', organisationId: 'ORG-V31-KAMPALA-FOODS', branchId: 'BR-KLA-HQ', departmentCode: 'KLA-OPS', departmentName: 'Milling & Warehouse Logistics', costCenterCode: 'CC-202', headUserId: 'usr_dealer_01', annualBudgetMinor: 6400000000, currency: 'UGX', createdAt: now },
      { id: 'DEPT-EAC-OPS', organisationId: 'ORG-V31-EAC-CARGO', branchId: 'BR-EAC-NBO', departmentCode: 'EAC-OPS', departmentName: 'Northern Corridor Dispatch', costCenterCode: 'CC-301', headUserId: 'usr_trans_01', annualBudgetMinor: 420000000, currency: 'KES', createdAt: now },
      { id: 'DEPT-VIC-CRED', organisationId: 'ORG-V31-VICTORIA-SACCO', branchId: 'BR-VIC-GULU', departmentCode: 'VIC-CRED', departmentName: 'Warehouse Receipt & Seasonal Credit', costCenterCode: 'CC-401', headUserId: 'usr_coop_01', annualBudgetMinor: 5100000000, currency: 'UGX', createdAt: now },
    ];
    depts.forEach((d) => db.v31OrganizationDepartments.set(d.id, d));

    const approvalPolicies: V31EnterpriseApprovalPolicy[] = [
      { id: 'APOL-BUG-PROC', organisationId: 'ORG-V31-BUGISU', policyName: 'Cooperative Produce Offtake SoD Policy', workflowDomain: 'PROCUREMENT', currency: 'UGX', level1ThresholdMinor: 50000000, level2ThresholdMinor: 250000000, dualApprovalThresholdMinor: 500000000, requesterCannotApprove: true, coiDisclosureRequired: true, active: true, updatedAt: now },
      { id: 'APOL-KLA-PROC', organisationId: 'ORG-V31-KAMPALA-FOODS', policyName: 'Kampala Industrial Procurement & Invoice Control', workflowDomain: 'PROCUREMENT', currency: 'UGX', level1ThresholdMinor: 100000000, level2ThresholdMinor: 500000000, dualApprovalThresholdMinor: 1000000000, requesterCannotApprove: true, coiDisclosureRequired: true, active: true, updatedAt: now },
      { id: 'APOL-KLA-TREAS', organisationId: 'ORG-V31-KAMPALA-FOODS', policyName: 'Kampala Treasury Payout Dual Signatory', workflowDomain: 'TREASURY_PAYOUT', currency: 'UGX', level1ThresholdMinor: 50000000, level2ThresholdMinor: 200000000, dualApprovalThresholdMinor: 500000000, requesterCannotApprove: true, coiDisclosureRequired: true, active: true, updatedAt: now },
      { id: 'APOL-EAC-XB', organisationId: 'ORG-V31-EAC-CARGO', policyName: 'Northern Corridor Cross-Border Freight Settlement', workflowDomain: 'CROSS_BORDER_SETTLEMENT', currency: 'KES', level1ThresholdMinor: 10000000, level2ThresholdMinor: 50000000, dualApprovalThresholdMinor: 100000000, requesterCannotApprove: true, coiDisclosureRequired: true, active: true, updatedAt: now },
    ];
    approvalPolicies.forEach((p) => db.v31EnterpriseApprovalPolicies.set(p.id, p));

    const sampleCase: V31CommercialWorkflowCase = {
      id: 'CASE-V31-1001',
      caseRef: 'ENT-UG-2026-001',
      organisationId: 'ORG-V31-KAMPALA-FOODS',
      branchId: 'BR-KLA-HQ',
      departmentId: 'DEPT-KLA-PROC',
      requesterUserId: 'usr_buyer_01',
      approver1UserId: 'usr_coop_01',
      supplierName: 'Bugisu Highland Arabica & Grain Growers',
      description: '10 MT Grade-1 White Maize Batch Lot #UG-26-114',
      currency: 'UGX',
      amountMinor: 1350000000,
      stage: 'INVOICE_MATCHED',
      auditEvents: [
        { timestamp: now, actorUserId: 'usr_buyer_01', action: 'CREATED', note: 'Procurement request raised with branch cost center CC-201.' },
        { timestamp: now, actorUserId: 'usr_coop_01', action: 'LEVEL1_APPROVED', note: 'Segregation-of-Duties check verified distinct approver.' },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.v31CommercialWorkflowCases.set(sampleCase.id, sampleCase);
  }

  // 5. Uganda Supervised Pilot Readiness Program (9 Explicit Acceptance-Gated Stages, Strictly Inactive)
  if (db.v31PilotPrograms.size === 0) {
    const ugPilot: V31PilotProgram = {
      id: 'PILOT-UG-COHORT-01',
      programCode: 'ECONEX-UG-PILOT-2026',
      title: 'Uganda Controlled Economic & Interoperability Pilot Preparation',
      countryCode: 'UG',
      targetDistricts: ['Kampala', 'Mbale', 'Jinja', 'Gulu', 'Mbarara'],
      currentStageNumber: 2,
      stageName: 'STAGE_2_SANDBOX_END_TO_END_REHEARSAL',
      pilotStatus: 'PREPARATION_SANDBOX_ONLY',
      livePilotActive: false,
      stageGates: [
        { stageNumber: 1, code: 'S1_INFRA_PG_READINESS', title: 'Sovereign Database & Schema 28 Dry-Run Verification', status: 'READY_INTERNAL', acceptanceCriteria: '15-stage PG rehearsal & V30 rollback backup checksum verified.', humanSignoffRequired: false },
        { stageNumber: 2, code: 'S2_SANDBOX_REHEARSAL', title: 'Multi-Rail Payment & Commercial SoD Sandbox Rehearsal', status: 'READY_INTERNAL', acceptanceCriteria: 'Idempotent payments, reversals & SoD approvals verified in sandbox.', humanSignoffRequired: false },
        { stageNumber: 3, code: 'S3_PARTNER_SANDBOX_AUTH', title: 'External Provider Sandbox Credential & Webhook Certification', status: 'IN_PROGRESS', acceptanceCriteria: 'Partner developer portal sandbox keys & HMAC test webhooks verified.', humanSignoffRequired: true },
        { stageNumber: 4, code: 'S4_BOU_REGULATORY_SUBMISSION', title: 'Bank of Uganda NPS Act 2020 & Sponsor Bank Oversight Gate', status: 'PENDING_EXTERNAL_APPROVAL', acceptanceCriteria: 'Written BoU regulatory non-objection / PSP partnership authorization.', humanSignoffRequired: true },
        { stageNumber: 5, code: 'S5_AGENT_LIQUIDITY_TRAINING', title: 'Rural Agent Float Onboarding & Dispute Desk Training', status: 'BLOCKED_UNTIL_FIELD_SIGNOFF', acceptanceCriteria: 'Human field validation across Mbale, Gulu & Mbarara cash agents.', humanSignoffRequired: true },
        { stageNumber: 6, code: 'S6_USSD_CARRIER_BINDING', title: 'MNO *284# USSD Gateway Binding Verification', status: 'PENDING_EXTERNAL_APPROVAL', acceptanceCriteria: 'UCC shortcode license and MTN/Airtel aggregator gateway binding.', humanSignoffRequired: true },
        { stageNumber: 7, code: 'S7_PRODUCTION_PG_CUTOVER', title: 'Hosted PostgreSQL Cutover & DR Failover Verification', status: 'PENDING_EXTERNAL_APPROVAL', acceptanceCriteria: 'Live PostgreSQL cluster provisioned with encrypted off-host WAL PITR.', humanSignoffRequired: true },
        { stageNumber: 8, code: 'S8_CLOSED_COHORT_GO_NO_GO', title: 'Executive Go/No-Go Dual Sign-Off for Capped Supervised Cohort', status: 'BLOCKED_UNTIL_FIELD_SIGNOFF', acceptanceCriteria: 'Zero critical security incidents & capped per-transaction pilot limits active.', humanSignoffRequired: true },
        { stageNumber: 9, code: 'S9_CONTROLLED_FIELD_MONITORING', title: 'Supervised Live Cohort Telemetry & Daily Reconciliation Review', status: 'BLOCKED_UNTIL_FIELD_SIGNOFF', acceptanceCriteria: 'Active only after Stages 1–8 formally signed off.', humanSignoffRequired: true },
      ],
      updatedAt: now,
    };
    db.v31PilotPrograms.set(ugPilot.id, ugPilot);

    const participants: V31PilotParticipant[] = [
      { id: 'PPART-UG-01', pilotProgramId: 'PILOT-UG-COHORT-01', participantName: 'Wanale Women Coffee Growers Assoc.', roleCategory: 'FARMER', district: 'Mbale', countryCode: 'UG', onboardingMode: 'SANDBOX_REHEARSAL', ussdOptIn: true, kycLevel: 'TIER_1_NATIONAL_ID', createdAt: now },
      { id: 'PPART-UG-02', pilotProgramId: 'PILOT-UG-COHORT-01', participantName: 'Owino Grain & Agro Wholesale Ltd', roleCategory: 'SME_MERCHANT', district: 'Kampala', countryCode: 'UG', onboardingMode: 'SANDBOX_REHEARSAL', ussdOptIn: false, kycLevel: 'TIER_2_URSB_TIN', createdAt: now },
      { id: 'PPART-UG-03', pilotProgramId: 'PILOT-UG-COHORT-01', participantName: 'Bugisu Cash & Float Kiosk #04', roleCategory: 'CASH_AGENT', district: 'Mbale', countryCode: 'UG', onboardingMode: 'PENDING_FIELD_VERIFICATION', ussdOptIn: true, kycLevel: 'TIER_2_AGENT_CERT', createdAt: now },
      { id: 'PPART-UG-04', pilotProgramId: 'PILOT-UG-COHORT-01', participantName: 'Gulu Northern Corridor Haulier Co-op', roleCategory: 'LOGISTICS_DRIVER', district: 'Gulu', countryCode: 'UG', onboardingMode: 'PENDING_FIELD_VERIFICATION', ussdOptIn: true, kycLevel: 'TIER_1_NATIONAL_ID', createdAt: now },
    ];
    participants.forEach((p) => db.v31PilotParticipants.set(p.id, p));

    const validations: V31FieldValidationRecord[] = [
      { id: 'FVAL-UG-01', pilotProgramId: 'PILOT-UG-COHORT-01', district: 'Mbale', validationType: 'FARMER_ONBOARDING', submittedByUserId: 'usr_coop_01', evidenceSummary: 'Sandbox rehearsal of 20 farmer NIN/Cooperative registration steps completed without real field issuance.', checksumSha256: sha256('FVAL-UG-01'), validationOutcome: 'SANDBOX_REHEARSAL_PASSED', humanFieldSignoffCompleted: false, recordedAt: now },
      { id: 'FVAL-UG-02', pilotProgramId: 'PILOT-UG-COHORT-01', district: 'Gulu', validationType: 'LOW_CONNECTIVITY_SYNC', submittedByUserId: 'usr_trans_01', evidenceSummary: 'Offline conflict resolution and idempotency replay rehearsed in local network emulation.', checksumSha256: sha256('FVAL-UG-02'), validationOutcome: 'PENDING_HUMAN_FIELD_VALIDATION', humanFieldSignoffCompleted: false, recordedAt: now },
    ];
    validations.forEach((v) => db.v31FieldValidationRecords.set(v.id, v));

    const pIncidents: V31PilotIncident[] = [
      { id: 'PINC-UG-01', pilotProgramId: 'PILOT-UG-COHORT-01', severity: 'MEDIUM', category: 'AGENT_LIQUIDITY', summary: 'Simulated rural kiosk cash depletion during harvest peak drill.', mitigationPlan: 'Trigger TTL float alert & route cash-out to nearby cooperative hub.', status: 'RESOLVED_LOCAL', reportedByUserId: 'usr_coop_01', createdAt: now, resolvedAt: now },
    ];
    pIncidents.forEach((i) => db.v31PilotIncidents.set(i.id, i));
  }

  // 6. Security Incidents & Production Deployment Environments
  if (db.v31SecurityIncidents.size === 0) {
    const secIncidents: V31SecurityIncident[] = [
      {
        id: 'SINC-V31-01',
        incidentRef: 'SEC-2026-001',
        category: 'BRUTE_FORCE_BLOCKED',
        severity: 'MEDIUM',
        targetResource: '/api/auth/login',
        status: 'REMEDIATED',
        containmentAction: '15-minute velocity throttling engaged automatically after 5 invalid attempts.',
        detectedByUserId: 'usr_admin_01',
        remediatedByUserId: 'usr_admin_01',
        detectedAt: now,
        remediatedAt: now,
      },
      {
        id: 'SINC-V31-02',
        incidentRef: 'SEC-2026-002',
        category: 'CREDENTIAL_ROTATION_DUE',
        severity: 'LOW',
        targetResource: 'integrationCredentialsMetadata',
        status: 'CONTAINED',
        containmentAction: 'Sandbox credential metadata inventory tagged 90-day rotation policy; zero raw secrets committed.',
        detectedByUserId: 'usr_admin_01',
        detectedAt: now,
      },
    ];
    secIncidents.forEach((s) => db.v31SecurityIncidents.set(s.id, s));
  }

  if (db.v31DeploymentRecords.size === 0) {
    const deployments: V31DeploymentRecord[] = [
      {
        id: 'DEP-DEV-LOCAL',
        environment: 'DEV',
        releaseTag: 'V31.0-SOVEREIGN-INFRASTRUCTURE-AND-DEPLOYMENT',
        schemaVersion: 28,
        targetHostDescription: 'AI Studio Container Node (localhost:3000)',
        databaseAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
        status: 'ACTIVE_LOCAL',
        deployedByUserId: 'usr_admin_01',
        notes: 'Active development environment with Vite React SPA + Express backend + JSON WAL.',
        recordedAt: now,
      },
      {
        id: 'DEP-TEST-CI',
        environment: 'TEST',
        releaseTag: 'V31.0-SOVEREIGN-INFRASTRUCTURE-AND-DEPLOYMENT',
        schemaVersion: 28,
        targetHostDescription: 'Sequential Verification Harness & GitHub Actions Runner',
        databaseAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
        status: 'VERIFIED_AUTOMATED',
        deployedByUserId: 'usr_admin_01',
        notes: 'Automated test matrix, tsc --noEmit, secret scan & source ZIP verification.',
        recordedAt: now,
      },
      {
        id: 'DEP-STAGING-PG',
        environment: 'STAGING',
        releaseTag: 'V31.0-SOVEREIGN-INFRASTRUCTURE-AND-DEPLOYMENT',
        schemaVersion: 28,
        targetHostDescription: 'Staging PostgreSQL 16 + Container Target (Awaiting External Provisioning)',
        databaseAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
        status: 'DRY_RUN_CONFIGURED',
        deployedByUserId: 'usr_admin_01',
        notes: '15-stage PG rehearsal & CI workflow configured; hosted staging server not yet attached.',
        recordedAt: now,
      },
      {
        id: 'DEP-PROD-CONTINENTAL',
        environment: 'PROD',
        releaseTag: 'V31.0-SOVEREIGN-INFRASTRUCTURE-AND-DEPLOYMENT',
        schemaVersion: 28,
        targetHostDescription: 'Continental Production Sovereign Cluster (Not Deployed)',
        databaseAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
        status: 'NOT_DEPLOYED',
        deployedByUserId: 'usr_admin_01',
        notes: 'Strictly blocked pending BoU regulatory authorization, live partner keys & hosted PostgreSQL cutover.',
        recordedAt: now,
      },
    ];
    deployments.forEach((d) => db.v31DeploymentRecords.set(d.id, d));
  }

  // 7. Continental Analytics Snapshots (k >= 3 privacy-preserving regional benchmarks)
  if (db.v31ContinentalAnalyticsSnapshots.size === 0) {
    const snapshots: V31ContinentalAnalyticsSnapshot[] = [
      { id: 'CAS-UG-AGRO', countryCode: 'UG', sectorCode: 'AGRICULTURE_COFFEE_MAIZE', corridorCode: 'UG-KLA-MBL', participantClusterCount: 18, kAnonymityEnforced: true, indicativeVolumeMinor: 485000000, currency: 'UGX', avgCorridorSettlementMinutes: 2, provenanceCategory: 'CALCULATED_INDICATOR', limitationsNote: 'Derived from local sandbox orders & settlement records; not live external clearing volume.', capturedAt: now },
      { id: 'CAS-KE-CORRIDOR', countryCode: 'KE', sectorCode: 'CROSS_BORDER_LOGISTICS', corridorCode: 'UG-KE-NORTHERN', participantClusterCount: 11, kAnonymityEnforced: true, indicativeVolumeMinor: 12400000, currency: 'KES', avgCorridorSettlementMinutes: 4, provenanceCategory: 'SYNTHETIC_TEST_DATA', limitationsNote: 'Sandbox corridor benchmark requiring live Daraja/PesaLink onboarding before production reporting.', capturedAt: now },
      { id: 'CAS-TZ-TRADE', countryCode: 'TZ', sectorCode: 'WHOLESALE_COMMODITIES', corridorCode: 'UG-TZ-CENTRAL', participantClusterCount: 7, kAnonymityEnforced: true, indicativeVolumeMinor: 92000000, currency: 'TZS', avgCorridorSettlementMinutes: 6, provenanceCategory: 'SYNTHETIC_TEST_DATA', limitationsNote: 'Indicative EAC corridor benchmark using Schema 28 country profile rates.', capturedAt: now },
      { id: 'CAS-RW-DIGITAL', countryCode: 'RW', sectorCode: 'DIGITAL_SERVICES_TRADE', corridorCode: 'UG-RW-GATUNA', participantClusterCount: 9, kAnonymityEnforced: true, indicativeVolumeMinor: 18500000, currency: 'RWF', avgCorridorSettlementMinutes: 3, provenanceCategory: 'SYNTHETIC_TEST_DATA', limitationsNote: 'Simulated Gatuna border trade volume; non-live sandbox.', capturedAt: now },
    ];
    snapshots.forEach((s) => db.v31ContinentalAnalyticsSnapshots.set(s.id, s));
  }
}
