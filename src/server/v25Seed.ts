/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V25.0 — Idempotent Continental Infrastructure Seeder (Schema 23)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { ArosDatabase } from './db.ts';
import type {
  V25ApiApplication,
  V25AuditTrailRecord,
  V25BackgroundJob,
  V25Branch,
  V25BusinessUnit,
  V25ComplianceRecord,
  V25CountryProfile,
  V25CountryReadinessReport,
  V25Department,
  V25ExternalAdapterBoundary,
  V25FxQuote,
  V25MfaConfig,
  V25OrgMembership,
  V25OrgSubscription,
  V25Organisation,
  V25OutboxEvent,
  V25PlatformInvoice,
  V25PlatformPlan,
  V25RegulatoryLimitRule,
  V25RolePermissionGrant,
  V25SecurityEvent,
  V25SecurityIncident,
  V25Team,
  V25UserDevice,
  V25VaultDocument,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VAULT_ROOT = path.resolve(__dirname, '../../data/v25_vault');

function sha256(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function seedV25Collections(db: ArosDatabase) {
  const now = '2026-11-23T08:00:00.000Z';

  // Ensure private document vault directory sits OUTSIDE public Vite/Express directories
  fs.mkdirSync(VAULT_ROOT, { recursive: true });

  // 1. Enterprise Multi-Organisation Hierarchy (Holding -> Subsidiary -> Business Units -> Branches -> Departments -> Teams)
  if (db.v25Organisations.size === 0) {
    const orgs: V25Organisation[] = [
      {
        id: 'ORG-V25-HOLDING',
        tenantId: 'TENANT-UG',
        code: 'ECX-UG-HOLDING',
        legalName: 'Kampala Continental Trading Holdings Ltd',
        displayName: 'Kampala Continental Holdings (UG)',
        orgType: 'HOLDING_COMPANY',
        countryCode: 'UG',
        defaultCurrency: 'UGX',
        ownerUserId: 'usr_admin_01',
        status: 'ACTIVE',
        dataClassificationDefault: 'ORG_INTERNAL',
        complianceTier: 'HUMAN_REVIEWED',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ORG-V25-UG-PRODUCE',
        tenantId: 'TENANT-UG',
        code: 'ECX-UG-PRODUCE',
        legalName: 'Nile Harvest Agro & Manufacturing Co. Ltd',
        displayName: 'Nile Harvest Manufacturing (UG)',
        orgType: 'ENTERPRISE',
        parentOrganisationId: 'ORG-V25-HOLDING',
        countryCode: 'UG',
        defaultCurrency: 'UGX',
        ownerUserId: 'usr_coop_01',
        status: 'ACTIVE',
        dataClassificationDefault: 'ORG_INTERNAL',
        complianceTier: 'HUMAN_REVIEWED',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ORG-V25-KE-CORRIDOR',
        tenantId: 'TENANT-KE',
        code: 'ECX-KE-CORRIDOR',
        legalName: 'Mombasa Rift Corridor Logistics Ltd',
        displayName: 'Rift Corridor Logistics (KE)',
        orgType: 'LOGISTICS_OPERATOR',
        parentOrganisationId: 'ORG-V25-HOLDING',
        countryCode: 'KE',
        defaultCurrency: 'KES',
        ownerUserId: 'usr_buyer_01',
        status: 'ACTIVE',
        dataClassificationDefault: 'ORG_INTERNAL',
        complianceTier: 'AUTO_VALIDATED',
        createdAt: now,
        updatedAt: now,
      },
    ];
    orgs.forEach((o) => db.v25Organisations.set(o.id, o));
  }

  if (db.v25BusinessUnits.size === 0) {
    const bus: V25BusinessUnit[] = [
      {
        id: 'BU-V25-UG-AGRO',
        organisationId: 'ORG-V25-UG-PRODUCE',
        tenantId: 'TENANT-UG',
        code: 'BU-AGRO-MILLING',
        name: 'Grain Processing & Milling BU',
        sectorId: 'SEC-02',
        countryCode: 'UG',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'BU-V25-KE-FREIGHT',
        organisationId: 'ORG-V25-KE-CORRIDOR',
        tenantId: 'TENANT-KE',
        code: 'BU-OSBP-FREIGHT',
        name: 'Northern Corridor Cross-Border Freight BU',
        sectorId: 'SEC-06',
        countryCode: 'KE',
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    bus.forEach((b) => db.v25BusinessUnits.set(b.id, b));
  }

  if (db.v25Branches.size === 0) {
    const branches: V25Branch[] = [
      {
        id: 'BR-V25-KLA-HQ',
        organisationId: 'ORG-V25-UG-PRODUCE',
        businessUnitId: 'BU-V25-UG-AGRO',
        tenantId: 'TENANT-UG',
        code: 'UG-KLA-01',
        name: 'Kampala Industrial Area Branch',
        countryCode: 'UG',
        cityOrDistrict: 'Kampala',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'BR-V25-JINJA-DEPOT',
        organisationId: 'ORG-V25-UG-PRODUCE',
        businessUnitId: 'BU-V25-UG-AGRO',
        tenantId: 'TENANT-UG',
        code: 'UG-JIN-02',
        name: 'Jinja Eastern Processing Branch',
        countryCode: 'UG',
        cityOrDistrict: 'Jinja',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'BR-V25-MBA-PORT',
        organisationId: 'ORG-V25-KE-CORRIDOR',
        businessUnitId: 'BU-V25-KE-FREIGHT',
        tenantId: 'TENANT-KE',
        code: 'KE-MBA-01',
        name: 'Mombasa Port Logistics Branch',
        countryCode: 'KE',
        cityOrDistrict: 'Mombasa',
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    branches.forEach((b) => db.v25Branches.set(b.id, b));
  }

  if (db.v25Departments.size === 0) {
    const depts: V25Department[] = [
      {
        id: 'DEPT-V25-TREASURY',
        organisationId: 'ORG-V25-UG-PRODUCE',
        branchId: 'BR-V25-KLA-HQ',
        tenantId: 'TENANT-UG',
        code: 'DEP-TRES',
        name: 'Treasury & Settlement Control',
        costCenterCode: 'CC-UG-101',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'DEPT-V25-PROCURE',
        organisationId: 'ORG-V25-UG-PRODUCE',
        branchId: 'BR-V25-KLA-HQ',
        tenantId: 'TENANT-UG',
        code: 'DEP-PROC',
        name: 'Procurement & Warehouse Control',
        costCenterCode: 'CC-UG-102',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'DEPT-V25-DISPATCH',
        organisationId: 'ORG-V25-KE-CORRIDOR',
        branchId: 'BR-V25-MBA-PORT',
        tenantId: 'TENANT-KE',
        code: 'DEP-DISP',
        name: 'Corridor Dispatch & Border Manifest',
        costCenterCode: 'CC-KE-201',
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    depts.forEach((d) => db.v25Departments.set(d.id, d));
  }

  if (db.v25Teams.size === 0) {
    const teams: V25Team[] = [
      {
        id: 'TEAM-V25-FIN-UG',
        organisationId: 'ORG-V25-UG-PRODUCE',
        departmentId: 'DEPT-V25-TREASURY',
        tenantId: 'TENANT-UG',
        name: 'Kampala Dual-Approval Treasury Team',
        leadUserId: 'usr_coop_01',
        memberUserIds: ['usr_coop_01', 'usr_admin_01', 'usr_farmer_01'],
        createdAt: now,
      },
      {
        id: 'TEAM-V25-KE-OPS',
        organisationId: 'ORG-V25-KE-CORRIDOR',
        departmentId: 'DEPT-V25-DISPATCH',
        tenantId: 'TENANT-KE',
        name: 'Mombasa-Malaba Dispatch Desk',
        leadUserId: 'usr_buyer_01',
        memberUserIds: ['usr_buyer_01', 'usr_transporter_01'],
        createdAt: now,
      },
    ];
    teams.forEach((t) => db.v25Teams.set(t.id, t));
  }

  if (db.v25OrgMemberships.size === 0) {
    const memberships: V25OrgMembership[] = [
      {
        id: 'MEM-V25-ADMIN-HOLDING',
        organisationId: 'ORG-V25-HOLDING',
        tenantId: 'TENANT-UG',
        userId: 'usr_admin_01',
        memberRole: 'ORG_OWNER',
        allowedBranchIds: ['BR-V25-KLA-HQ', 'BR-V25-JINJA-DEPOT'],
        allowedDepartmentIds: ['DEPT-V25-TREASURY', 'DEPT-V25-PROCURE'],
        allowedCountries: ['UG', 'KE'],
        approvalLimitMinor: 500_000_000_00,
        status: 'ACTIVE',
        isActiveContext: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'MEM-V25-ADMIN-PRODUCE',
        organisationId: 'ORG-V25-UG-PRODUCE',
        tenantId: 'TENANT-UG',
        userId: 'usr_admin_01',
        memberRole: 'TREASURY_APPROVER',
        allowedBranchIds: ['BR-V25-KLA-HQ'],
        allowedDepartmentIds: ['DEPT-V25-TREASURY'],
        allowedCountries: ['UG'],
        approvalLimitMinor: 250_000_000_00,
        status: 'ACTIVE',
        isActiveContext: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'MEM-V25-COOP-PRODUCE',
        organisationId: 'ORG-V25-UG-PRODUCE',
        tenantId: 'TENANT-UG',
        userId: 'usr_coop_01',
        memberRole: 'ORG_OWNER',
        allowedBranchIds: ['BR-V25-KLA-HQ', 'BR-V25-JINJA-DEPOT'],
        allowedDepartmentIds: ['DEPT-V25-TREASURY', 'DEPT-V25-PROCURE'],
        allowedCountries: ['UG'],
        approvalLimitMinor: 150_000_000_00,
        status: 'ACTIVE',
        isActiveContext: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'MEM-V25-BUYER-KE',
        organisationId: 'ORG-V25-KE-CORRIDOR',
        tenantId: 'TENANT-KE',
        userId: 'usr_buyer_01',
        memberRole: 'ORG_OWNER',
        allowedBranchIds: ['BR-V25-MBA-PORT'],
        allowedDepartmentIds: ['DEPT-V25-DISPATCH'],
        allowedCountries: ['KE'],
        approvalLimitMinor: 100_000_000_00,
        status: 'ACTIVE',
        isActiveContext: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'MEM-V25-FARMER-PRODUCE',
        organisationId: 'ORG-V25-UG-PRODUCE',
        tenantId: 'TENANT-UG',
        userId: 'usr_farmer_01',
        memberRole: 'OPERATOR',
        allowedBranchIds: ['BR-V25-JINJA-DEPOT'],
        allowedDepartmentIds: ['DEPT-V25-PROCURE'],
        allowedCountries: ['UG'],
        approvalLimitMinor: 5_000_000_00,
        status: 'ACTIVE',
        isActiveContext: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    memberships.forEach((m) => db.v25OrgMemberships.set(m.id, m));
  }

  // 2. Central RBAC + Resource/Org/Country Permission Matrix
  if (db.v25RolePermissionGrants.size === 0) {
    const grants: V25RolePermissionGrant[] = [
      {
        id: 'RBAC-V25-01',
        roleCode: 'ORG_OWNER',
        resource: 'ORGANISATION_GOVERNANCE',
        actions: ['READ', 'CREATE', 'UPDATE', 'DELEGATE', 'TRANSFER_OWNERSHIP', 'SUSPEND_MEMBER'],
        requireMfaForSensitive: true,
        requireSameOrganisation: true,
        requireSameCountry: false,
        description: 'Organisation owner full governance within their owned enterprise boundary.',
      },
      {
        id: 'RBAC-V25-02',
        roleCode: 'TREASURY_APPROVER',
        resource: 'LEDGER_TRANSACTION',
        actions: ['READ', 'APPROVE_PENDING', 'REVERSE', 'FX_CLEAR'],
        requireMfaForSensitive: true,
        requireSameOrganisation: true,
        requireSameCountry: true,
        description: 'Dual-control treasury approval restricted to organisation & country scope.',
      },
      {
        id: 'RBAC-V25-03',
        roleCode: 'AUDITOR_READ_ONLY',
        resource: 'AUDIT_AND_VAULT',
        actions: ['READ', 'EXPORT_COMPLIANCE_REPORT'],
        requireMfaForSensitive: false,
        requireSameOrganisation: true,
        requireSameCountry: true,
        description: 'Read-only assurance role without write or payment mutation rights.',
      },
      {
        id: 'RBAC-V25-04',
        roleCode: 'PLATFORM_ADMIN',
        resource: 'CONTINENTAL_INFRASTRUCTURE',
        actions: ['READ', 'CONFIGURE_COUNTRY', 'MIGRATE_SCHEMA', 'INCIDENT_RESPONSE', 'BACKUP_DRILL'],
        requireMfaForSensitive: true,
        requireSameOrganisation: false,
        requireSameCountry: false,
        description: 'Global platform infrastructure administration under audit logging.',
      },
      {
        id: 'RBAC-V25-05',
        roleCode: 'OPERATOR',
        resource: 'VAULT_DOCUMENT',
        actions: ['READ_SHARED', 'UPLOAD'],
        requireMfaForSensitive: false,
        requireSameOrganisation: true,
        requireSameCountry: true,
        description: 'Standard operator access scoped to active branch/organisation.',
      },
    ];
    grants.forEach((g) => db.v25RolePermissionGrants.set(g.id, g));
  }

  // 3. MFA & Registered Trusted Devices
  if (db.v25MfaConfigs.size === 0) {
    const mfas: V25MfaConfig[] = [
      {
        userId: 'usr_admin_01',
        enabled: true,
        method: 'TOTP_AUTHENTICATOR',
        secretFingerprint: sha256('ECX-ADMIN-MFA-FP-2026').slice(0, 16),
        recoveryCodesRemaining: 6,
        lastVerifiedAt: now,
        updatedAt: now,
      },
      {
        userId: 'usr_coop_01',
        enabled: true,
        method: 'TOTP_AUTHENTICATOR',
        secretFingerprint: sha256('ECX-COOP-MFA-FP-2026').slice(0, 16),
        recoveryCodesRemaining: 6,
        lastVerifiedAt: now,
        updatedAt: now,
      },
    ];
    mfas.forEach((m) => db.v25MfaConfigs.set(m.userId, m));
  }

  if (db.v25UserDevices.size === 0) {
    const devices: V25UserDevice[] = [
      {
        id: 'DEV-V25-ADMIN-01',
        userId: 'usr_admin_01',
        deviceLabel: 'VINEXSAH Operations Terminal (Kampala)',
        fingerprintHash: sha256('DEV-FP-ADMIN-KLA-01'),
        userAgent: 'ECONEX-OpsConsole/25.0',
        countryCode: 'UG',
        trusted: true,
        status: 'ACTIVE',
        lastSeenAt: now,
        registeredAt: now,
      },
      {
        id: 'DEV-V25-COOP-01',
        userId: 'usr_coop_01',
        deviceLabel: 'Nile Harvest Treasury Workstation',
        fingerprintHash: sha256('DEV-FP-COOP-KLA-01'),
        userAgent: 'ECONEX-Desktop/25.0',
        countryCode: 'UG',
        trusted: true,
        status: 'ACTIVE',
        lastSeenAt: now,
        registeredAt: now,
      },
      {
        id: 'DEV-V25-BUYER-01',
        userId: 'usr_buyer_01',
        deviceLabel: 'Mombasa Corridor Logistics Tablet',
        fingerprintHash: sha256('DEV-FP-BUYER-MBA-01'),
        userAgent: 'ECONEX-FieldAndroid/25.0',
        countryCode: 'KE',
        trusted: true,
        status: 'ACTIVE',
        lastSeenAt: now,
        registeredAt: now,
      },
    ];
    devices.forEach((d) => db.v25UserDevices.set(d.id, d));
  }

  // 4. Configurable Regulatory Limit Rules
  if (db.v25RegulatoryLimits.size === 0) {
    const rules: V25RegulatoryLimitRule[] = [
      {
        id: 'LIM-V25-UG-USER',
        countryCode: 'UG',
        currency: 'UGX',
        complianceTier: 'USER_SUBMITTED',
        singleTxMaxMinor: 2_000_000_00,
        dailyTxMaxMinor: 5_000_000_00,
        dualApprovalThresholdMinor: 1_000_000_00,
        active: true,
        updatedAt: now,
      },
      {
        id: 'LIM-V25-UG-HUMAN',
        countryCode: 'UG',
        currency: 'UGX',
        complianceTier: 'HUMAN_REVIEWED',
        singleTxMaxMinor: 250_000_000_00,
        dailyTxMaxMinor: 750_000_000_00,
        dualApprovalThresholdMinor: 50_000_000_00,
        active: true,
        updatedAt: now,
      },
      {
        id: 'LIM-V25-KE-HUMAN',
        countryCode: 'KE',
        currency: 'KES',
        complianceTier: 'HUMAN_REVIEWED',
        singleTxMaxMinor: 10_000_000_00,
        dailyTxMaxMinor: 25_000_000_00,
        dualApprovalThresholdMinor: 2_000_000_00,
        active: true,
        updatedAt: now,
      },
    ];
    rules.forEach((r) => db.v25RegulatoryLimits.set(r.id, r));
  }

  // 5. Country Configuration Engine (7 EAC States + AfCFTA Readiness Reports)
  if (db.v25CountryProfiles.size === 0) {
    const countries: V25CountryProfile[] = [
      {
        countryCode: 'UG',
        countryName: 'Republic of Uganda',
        regionBloc: 'EAC',
        defaultCurrency: 'UGX',
        supportedCurrencies: ['UGX', 'USD', 'KES'],
        vatStandardRatePct: 18,
        regulatoryAuthorityNote: 'Bank of Uganda NPS & URA EFRIS integration boundary configured (sandbox only).',
        paymentRailsConfigured: ['MTN_MOMO_UG_SANDBOX', 'AIRTEL_UG_SANDBOX', 'BOU_RTGS_SANDBOX'],
        readinessStatus: 'PILOT_READY',
        activated: true,
        approvedByUserId: 'usr_admin_01',
        approvedAt: now,
        updatedAt: now,
      },
      {
        countryCode: 'KE',
        countryName: 'Republic of Kenya',
        regionBloc: 'EAC',
        defaultCurrency: 'KES',
        supportedCurrencies: ['KES', 'USD', 'UGX'],
        vatStandardRatePct: 16,
        regulatoryAuthorityNote: 'CBK & KRA eTIMS integration boundary configured (sandbox staging).',
        paymentRailsConfigured: ['MPESA_KE_SANDBOX', 'PESALINK_SANDBOX'],
        readinessStatus: 'PILOT_READY',
        activated: true,
        approvedByUserId: 'usr_admin_01',
        approvedAt: now,
        updatedAt: now,
      },
      {
        countryCode: 'TZ',
        countryName: 'United Republic of Tanzania',
        regionBloc: 'EAC',
        defaultCurrency: 'TZS',
        supportedCurrencies: ['TZS', 'USD', 'KES'],
        vatStandardRatePct: 18,
        regulatoryAuthorityNote: 'Bank of Tanzania TIPS adapter interface registered (inactive pending approval).',
        paymentRailsConfigured: ['TIPS_TZ_SANDBOX'],
        readinessStatus: 'SANDBOX_STAGING',
        activated: false,
        updatedAt: now,
      },
      {
        countryCode: 'RW',
        countryName: 'Republic of Rwanda',
        regionBloc: 'EAC',
        defaultCurrency: 'RWF',
        supportedCurrencies: ['RWF', 'USD', 'UGX'],
        vatStandardRatePct: 18,
        regulatoryAuthorityNote: 'BNR RSwitch & RRA EBM interface staged in sandbox.',
        paymentRailsConfigured: ['RSWITCH_RW_SANDBOX'],
        readinessStatus: 'SANDBOX_STAGING',
        activated: false,
        updatedAt: now,
      },
      {
        countryCode: 'BI',
        countryName: 'Republic of Burundi',
        regionBloc: 'EAC',
        defaultCurrency: 'BIF',
        supportedCurrencies: ['BIF', 'USD'],
        vatStandardRatePct: 18,
        regulatoryAuthorityNote: 'BRB corridor profile configured (awaiting partner onboarding).',
        paymentRailsConfigured: ['ECOCASH_BI_SANDBOX'],
        readinessStatus: 'CONFIGURED_INACTIVE',
        activated: false,
        updatedAt: now,
      },
      {
        countryCode: 'SS',
        countryName: 'Republic of South Sudan',
        regionBloc: 'EAC',
        defaultCurrency: 'SSP',
        supportedCurrencies: ['SSP', 'USD', 'UGX'],
        vatStandardRatePct: 18,
        regulatoryAuthorityNote: 'Nimule corridor trade configuration staged (non-live).',
        paymentRailsConfigured: ['M_GURUSH_SS_SANDBOX'],
        readinessStatus: 'CONFIGURED_INACTIVE',
        activated: false,
        updatedAt: now,
      },
      {
        countryCode: 'CD',
        countryName: 'Democratic Republic of the Congo',
        regionBloc: 'EAC',
        defaultCurrency: 'CDF',
        supportedCurrencies: ['CDF', 'USD', 'UGX'],
        vatStandardRatePct: 16,
        regulatoryAuthorityNote: 'Mpondwe / Kasindi corridor configuration staged (non-live).',
        paymentRailsConfigured: ['CDF_MOBILE_SANDBOX'],
        readinessStatus: 'CONFIGURED_INACTIVE',
        activated: false,
        updatedAt: now,
      },
    ];
    countries.forEach((c) => db.v25CountryProfiles.set(c.countryCode, c));
  }

  if (db.v25CountryReadinessReports.size === 0) {
    for (const c of db.v25CountryProfiles.values()) {
      const rep: V25CountryReadinessReport = {
        id: `CRR-V25-${c.countryCode}`,
        countryCode: c.countryCode,
        checks: [
          { checkName: 'TAX_VAT_PROFILE_CONFIGURED', passed: c.vatStandardRatePct > 0, detail: `VAT=${c.vatStandardRatePct}%` },
          { checkName: 'CURRENCY_PRECISION_LOCKED', passed: c.supportedCurrencies.length >= 2, detail: c.supportedCurrencies.join(', ') },
          { checkName: 'SANDBOX_PAYMENT_RAIL_BOUNDARY', passed: c.paymentRailsConfigured.length >= 1, detail: c.paymentRailsConfigured.join(', ') },
          { checkName: 'LOCAL_PILOT_OR_COMPLIANCE_APPROVED', passed: c.activated, detail: c.activated ? 'Controlled sandbox pilot approved' : 'Pending governance sign-off' },
        ],
        overallScorePct: c.activated ? 100 : 75,
        readyForControlledActivation: true,
        liveExternalRailsConnected: false,
        generatedAt: now,
      };
      db.v25CountryReadinessReports.set(rep.id, rep);
    }
  }

  // 6. Multi-Currency FX Engine Quotes (Zero Silent Conversion)
  if (db.v25FxQuotes.size === 0) {
    const validUntil = '2026-12-31T23:59:59.000Z';
    const quotes: V25FxQuote[] = [
      {
        id: 'FXQ-V25-UGX-KES',
        baseCurrency: 'KES',
        quoteCurrency: 'UGX',
        rateNumeric: 28.5,
        inverseRateNumeric: Number((1 / 28.5).toFixed(6)),
        quoteType: 'EXECUTABLE',
        rateSource: 'EAC_CORRIDOR_REFERENCE_BENCHMARK_SANDBOX',
        rateTimestamp: now,
        validUntil,
        spreadBps: 35,
        silentConversionForbidden: true,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'FXQ-V25-USD-UGX',
        baseCurrency: 'USD',
        quoteCurrency: 'UGX',
        rateNumeric: 3685,
        inverseRateNumeric: Number((1 / 3685).toFixed(8)),
        quoteType: 'EXECUTABLE',
        rateSource: 'EAC_CORRIDOR_REFERENCE_BENCHMARK_SANDBOX',
        rateTimestamp: now,
        validUntil,
        spreadBps: 25,
        silentConversionForbidden: true,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'FXQ-V25-USD-KES',
        baseCurrency: 'USD',
        quoteCurrency: 'KES',
        rateNumeric: 129.3,
        inverseRateNumeric: Number((1 / 129.3).toFixed(6)),
        quoteType: 'INDICATIVE',
        rateSource: 'EAC_CORRIDOR_REFERENCE_BENCHMARK_SANDBOX',
        rateTimestamp: now,
        validUntil,
        spreadBps: 30,
        silentConversionForbidden: true,
        status: 'ACTIVE',
        createdAt: now,
      },
    ];
    quotes.forEach((q) => db.v25FxQuotes.set(q.id, q));
  }

  // 7. Outbox Events & Background Jobs
  if (db.v25OutboxEvents.size === 0) {
    const ev: V25OutboxEvent = {
      id: 'OUTBOX-V25-INIT-01',
      eventType: 'v25.infrastructure.schema23_initialized',
      aggregateType: 'SYSTEM_SCHEMA',
      aggregateId: 'SCHEMA-23',
      tenantId: 'TENANT-UG',
      organisationId: 'ORG-V25-HOLDING',
      correlationId: 'CORR-V25-BOOTSTRAP',
      idempotencyKey: 'IDEM-V25-BOOTSTRAP-01',
      payload: { schemaVersion: 23, authority: 'LOCAL_JSON_WAL_AUTHORITATIVE' },
      status: 'CONSUMED',
      attempts: 1,
      maxAttempts: 3,
      consumedByConsumers: ['AUDIT_SINK_CONSUMER', 'TELEMETRY_PROJECTION'],
      createdAt: now,
      updatedAt: now,
    };
    db.v25OutboxEvents.set(ev.id, ev);
  }

  if (db.v25BackgroundJobs.size === 0) {
    const job: V25BackgroundJob = {
      id: 'JOB-V25-RECON-01',
      jobType: 'RECONCILIATION_VERIFY',
      idempotencyLockKey: 'JOBLOCK-RECON-BOOTSTRAP-01',
      tenantId: 'TENANT-UG',
      organisationId: 'ORG-V25-HOLDING',
      status: 'COMPLETED',
      attempts: 1,
      maxRetries: 3,
      aiAutoApproveAllowed: false,
      payload: { scope: 'ALL_CURRENCIES' },
      resultSummary: 'Zero-variance double-entry general ledger check passed cleanly.',
      scheduledAt: now,
      startedAt: now,
      completedAt: now,
    };
    db.v25BackgroundJobs.set(job.id, job);
  }

  // 8. Developer Platform Apps & External Adapter Boundaries
  if (db.v25ApiApplications.size === 0) {
    const app: V25ApiApplication = {
      id: 'APP-V25-ERP-BRIDGE',
      tenantId: 'TENANT-UG',
      organisationId: 'ORG-V25-UG-PRODUCE',
      name: 'Nile Harvest ERP Sandbox Connector',
      description: 'OpenAPI 3.1 sandbox webhook and commerce sync client.',
      environment: 'SANDBOX',
      ownerUserId: 'usr_coop_01',
      status: 'ACTIVE',
      rateLimitPerMin: 120,
      createdAt: now,
    };
    db.v25ApiApplications.set(app.id, app);
  }

  if (db.v25ExternalAdapters.size === 0) {
    const adapters: V25ExternalAdapterBoundary[] = [
      {
        id: 'ADP-V25-BANK-RTGS',
        category: 'BANKING_RAIL',
        providerName: 'Bank of Uganda / EAPS RTGS ISO-20022 Boundary',
        countryCode: 'UG',
        adapterState: 'REQUIRES_CREDENTIALS_AND_LICENSE',
        liveProductionEnabled: false,
        requiredEnvVars: ['RTGS_GATEWAY_ENDPOINT', 'HSM_PKCS11_MODULE_PATH'],
        lastHealthCheckAt: now,
        notes: 'Protocol boundary implemented; live production switch blocked without central bank mTLS credentials.',
      },
      {
        id: 'ADP-V25-MOMO-UG',
        category: 'MOBILE_MONEY',
        providerName: 'MTN MoMo & Airtel Money Collection Boundary',
        countryCode: 'UG',
        adapterState: 'SANDBOX_SIMULATOR',
        liveProductionEnabled: false,
        requiredEnvVars: ['MOMO_PROVIDER_API_URL', 'MOMO_PROVIDER_API_KEY'],
        lastHealthCheckAt: now,
        notes: 'Sandbox webhook simulator active; zero live mobile money disbursements.',
      },
      {
        id: 'ADP-V25-KYC-NIRA',
        category: 'KYC_PROVIDER',
        providerName: 'National ID / Business Registry KYC/KYB Verification Adapter',
        countryCode: 'UG',
        adapterState: 'NOT_CONFIGURED',
        liveProductionEnabled: false,
        requiredEnvVars: ['KYC_REGISTRY_API_URL', 'KYC_REGISTRY_CLIENT_CERT'],
        lastHealthCheckAt: now,
        notes: 'Explicitly distinguishes USER_SUBMITTED / AUTO_VALIDATED / HUMAN_REVIEWED from GOVERNMENT_VERIFIED.',
      },
      {
        id: 'ADP-V25-GOVT-URA',
        category: 'GOVT_TAX_PORTAL',
        providerName: 'URA EFRIS & KRA eTIMS Tax Boundary',
        countryCode: 'UG',
        adapterState: 'NOT_CONFIGURED',
        liveProductionEnabled: false,
        requiredEnvVars: ['URA_EFRIS_ENDPOINT', 'URA_TAXPAYER_TIN'],
        lastHealthCheckAt: now,
        notes: 'Commercial documents remain internal ECONEX records unless official EFRIS gateway is provisioned.',
      },
    ];
    adapters.forEach((a) => db.v25ExternalAdapters.set(a.id, a));
  }

  // 9. Private Document Vault Seed File (Outside public static directories)
  if (db.v25VaultDocuments.size === 0) {
    const sampleFilename = 'nile_harvest_kyb_charter.txt';
    const samplePath = path.join(VAULT_ROOT, `VAULT-DOC-V25-01_${sampleFilename}`);
    const content = Buffer.from(
      'ECONEX V25 PRIVATE DOCUMENT VAULT RECORD\nOrganisation: ORG-V25-UG-PRODUCE\nClassification: REGULATED_COMPLIANCE\nNotice: Stored outside public Vite/Express directories with SHA-256 integrity.\n',
      'utf8'
    );
    fs.writeFileSync(samplePath, content);
    const doc: V25VaultDocument = {
      id: 'VAULT-DOC-V25-01',
      tenantId: 'TENANT-UG',
      organisationId: 'ORG-V25-UG-PRODUCE',
      countryCode: 'UG',
      ownerUserId: 'usr_coop_01',
      classification: 'REGULATED_COMPLIANCE',
      title: 'Nile Harvest Incorporation & KYB Charter',
      originalFilename: sampleFilename,
      storageRelativePath: path.basename(samplePath),
      mimeType: 'text/plain',
      sizeBytes: content.length,
      sha256Checksum: sha256(content),
      version: 1,
      malwareScanStatus: 'PASSED_SANDBOX_HEURISTIC',
      retentionPolicyDays: 2555,
      retentionExpiresAt: '2033-11-23T08:00:00.000Z',
      linkedEntityType: 'ORGANISATION',
      linkedEntityId: 'ORG-V25-UG-PRODUCE',
      createdAt: now,
    };
    db.v25VaultDocuments.set(doc.id, doc);
  }

  // 10. Zero-Trust Security Event, Incident & 5-Tier Compliance Records
  if (db.v25SecurityEvents.size === 0) {
    const ev: V25SecurityEvent = {
      id: 'SEC-EV-V25-01',
      eventType: 'CROSS_TENANT_ACCESS_BLOCKED',
      severity: 'MEDIUM',
      tenantId: 'TENANT-UG',
      organisationId: 'ORG-V25-UG-PRODUCE',
      actorUserId: 'usr_buyer_01',
      sourceIp: '10.24.0.18',
      summary: 'Cross-organisation vault probe blocked cleanly by V25 isolation guard.',
      blocked: true,
      createdAt: now,
    };
    db.v25SecurityEvents.set(ev.id, ev);
  }

  if (db.v25SecurityIncidents.size === 0) {
    const inc: V25SecurityIncident = {
      id: 'INC-V25-01',
      title: 'Baseline Cross-Tenant Probe Containment Drill',
      severity: 'LOW',
      stage: 'POST_INCIDENT_REVIEW',
      relatedEventIds: ['SEC-EV-V25-01'],
      affectedOrganisationId: 'ORG-V25-UG-PRODUCE',
      containmentActions: ['Verified fail-closed 403 tenant guard', 'Logged SHA-256 audit entry'],
      leadResponderUserId: 'usr_admin_01',
      postMortemSummary: 'Zero data exposure; cross-tenant guard verified effective.',
      stageHistory: [
        { fromStage: null, toStage: 'DETECTION', actorUserId: 'usr_admin_01', note: 'Detected probe event', timestamp: now },
        { fromStage: 'DETECTION', toStage: 'POST_INCIDENT_REVIEW', actorUserId: 'usr_admin_01', note: 'Drill closed', timestamp: now },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.v25SecurityIncidents.set(inc.id, inc);
  }

  if (db.v25ComplianceRecords.size === 0) {
    const records: V25ComplianceRecord[] = [
      {
        id: 'CMP-V25-01',
        subjectType: 'ORGANISATION',
        subjectId: 'ORG-V25-UG-PRODUCE',
        organisationId: 'ORG-V25-UG-PRODUCE',
        countryCode: 'UG',
        verificationCategory: 'KYB',
        tier: 'HUMAN_REVIEWED',
        evidenceSummary: 'Reviewed certificate of incorporation and cooperative registry documents in Private Vault.',
        vaultDocumentIds: ['VAULT-DOC-V25-01'],
        sanctionsScreeningStatus: 'CLEAR_SANDBOX_CHECK',
        reviewedByUserId: 'usr_admin_01',
        reviewNotes: 'Approved for controlled sandbox pilot. Official URSB external API remains disconnected.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'CMP-V25-02',
        subjectType: 'INDIVIDUAL',
        subjectId: 'usr_farmer_01',
        organisationId: 'ORG-V25-UG-PRODUCE',
        countryCode: 'UG',
        verificationCategory: 'KYC',
        tier: 'USER_SUBMITTED',
        evidenceSummary: 'Self-submitted profile pending third-party or human compliance verification.',
        vaultDocumentIds: [],
        sanctionsScreeningStatus: 'NOT_SCREENED_EXTERNALLY',
        createdAt: now,
        updatedAt: now,
      },
    ];
    records.forEach((r) => db.v25ComplianceRecords.set(r.id, r));
  }

  // 11. Commercial Subscriptions & Governance Plans (Strictly Separated from Wallet Balances)
  if (db.v25PlatformPlans.size === 0) {
    const plans: V25PlatformPlan[] = [
      {
        id: 'PLAN-V25-STARTER',
        code: 'ECX-STARTER',
        name: 'SME & Cooperative Starter',
        tier: 'STARTER',
        monthlyPriceMinor: 50_000_00,
        currency: 'UGX',
        includedApiRequestsPerMonth: 10_000,
        includedBranches: 2,
        includedVaultMb: 500,
        walletBalanceSeparated: true,
        active: true,
      },
      {
        id: 'PLAN-V25-ENTERPRISE',
        code: 'ECX-ENTERPRISE',
        name: 'Continental Enterprise Multi-Branch',
        tier: 'ENTERPRISE',
        monthlyPriceMinor: 450_000_00,
        currency: 'UGX',
        includedApiRequestsPerMonth: 250_000,
        includedBranches: 25,
        includedVaultMb: 10_000,
        walletBalanceSeparated: true,
        active: true,
      },
      {
        id: 'PLAN-V25-INSTITUTION',
        code: 'ECX-INSTITUTION',
        name: 'Sovereign & Institutional Corridor Node',
        tier: 'CONTINENTAL_INSTITUTION',
        monthlyPriceMinor: 1_500_000_00,
        currency: 'UGX',
        includedApiRequestsPerMonth: 2_000_000,
        includedBranches: 200,
        includedVaultMb: 100_000,
        walletBalanceSeparated: true,
        active: true,
      },
    ];
    plans.forEach((p) => db.v25PlatformPlans.set(p.id, p));
  }

  if (db.v25OrgSubscriptions.size === 0) {
    const sub: V25OrgSubscription = {
      id: 'SUB-V25-PRODUCE-01',
      organisationId: 'ORG-V25-UG-PRODUCE',
      planId: 'PLAN-V25-ENTERPRISE',
      status: 'ACTIVE',
      billingCycleStart: '2026-11-01T00:00:00.000Z',
      billingCycleEnd: '2026-11-30T23:59:59.000Z',
      apiUsageCount: 142,
      walletBalanceSeparated: true,
      updatedAt: now,
    };
    db.v25OrgSubscriptions.set(sub.id, sub);
  }

  if (db.v25PlatformInvoices.size === 0) {
    const inv: V25PlatformInvoice = {
      id: 'PINV-V25-01',
      invoiceNumber: 'ECX-SAAS-2026-0001',
      organisationId: 'ORG-V25-UG-PRODUCE',
      subscriptionId: 'SUB-V25-PRODUCE-01',
      planId: 'PLAN-V25-ENTERPRISE',
      amountMinor: 450_000_00,
      taxMinor: 81_000_00,
      totalMinor: 531_000_00,
      currency: 'UGX',
      status: 'ISSUED',
      walletBalanceSeparated: true,
      createdAt: now,
    };
    db.v25PlatformInvoices.set(inv.id, inv);
  }

  // 12. Hash-Chained Audit Trail Genesis Entry
  if (db.v25AuditTrail.size === 0) {
    const genesisHash = sha256(`GENESIS|SCHEMA_23|${now}`);
    const entry: V25AuditTrailRecord = {
      id: 'AUD-V25-GENESIS',
      tenantId: 'TENANT-UG',
      organisationId: 'ORG-V25-HOLDING',
      countryCode: 'UG',
      actorUserId: 'usr_admin_01',
      actorRole: 'PLATFORM_ADMIN',
      action: 'V25_SCHEMA_23_INITIALIZED',
      resourceType: 'PLATFORM_INFRASTRUCTURE',
      resourceId: 'SCHEMA-23',
      classification: 'ORG_INTERNAL',
      correlationId: 'CORR-V25-BOOTSTRAP',
      summary: 'Initialized ECONEX V25.0 Continental Infrastructure Schema 23 preserving all V1-V24 operational state.',
      prevHash: '0'.repeat(64),
      entryHash: genesisHash,
      createdAt: now,
    };
    db.v25AuditTrail.set(entry.id, entry);
  }
}
