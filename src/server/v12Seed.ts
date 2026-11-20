/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V12.0 - Global Economic Intelligence Seed & Migration Helpers
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';
import type {
  IntelligenceSource,
  IntelligenceSourceCredential,
  IntelligenceSourceHealth,
  EconomicIndicatorDefinition,
  EconomicIndicator,
  EconomicObservation,
  EconomicTimeSeries,
  EconomicDataQualityReport,
  ForecastModel,
  V12EconomicForecast,
  ForecastEvaluation,
  ForecastAccuracyHistoryRecord,
  EconomicAnomaly,
  V12EconomicEarlyWarning,
  V12EconomicOpportunity,
  EconomicScenario,
  ScenarioSimulationResult,
  BusinessImpactSimulation,
  EconomicRecommendation,
  IntelligenceAgentPolicy,
  IntelligenceAgentRun,
  ModelDriftEvent,
  IntelligenceAuditEvent,
  IntelligenceSubscriptionProduct,
  IntelligenceReport,
  IntelligenceReviewQueueItem,
  IntelligencePublicationRecord,
} from '../types/index.ts';

function sha256Hex(val: string): string {
  return `0x${crypto.createHash('sha256').update(val).digest('hex')}`;
}

export function seedV12Collections(db: ArosDatabase): void {
  const now = new Date().toISOString();
  const baseMeta = (
    tenantId = 'GLOBAL_PUBLIC',
    jurisdiction = 'UG',
    sourceReference = 'AROS-INTERNAL-LEDGER',
    accessClassification: 'PUBLIC' | 'RESTRICTED' | 'TENANT_PRIVATE' | 'INSTITUTION_PRIVATE' | 'CONFIDENTIAL' | 'SOVEREIGN_RESTRICTED' = 'PUBLIC'
  ) => ({
    tenantId,
    jurisdiction,
    sourceReference,
    verificationStatus: 'VERIFIED' as const,
    accessClassification,
    provenance: `Generated from verified AETHER–AROS ledger & reference registry (${sourceReference})`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: now,
  });

  // 1. intelligenceSources
  if (db.intelligenceSources.size === 0) {
    const sources: IntelligenceSource[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'SRC-AROS-MARKET-LEDGER',
        sourceName: 'AETHER–AROS Internal Marketplace & Trade Ledger',
        sourceCategory: 'INTERNAL_NETWORK',
        sourceClassification: 'VERIFIED_PRIMARY_SOURCE',
        endpointOrReference: 'internal://aros/marketplace-and-executions',
        accessMethod: 'INTERNAL_LEDGER',
        connectionStatus: 'LOCAL_ONLY',
        authenticationRequired: true,
        licensingRestrictions: 'Platform operational records; aggregate statistics public, participant PII restricted.',
        commercialRedistributionAllowed: true,
        updateFrequencyHours: 1,
        lastSuccessfulRetrieval: now,
        reliabilityScorePct: 98.5,
        adminApprovalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UG-MARKET-MONITORS'),
        id: 'SRC-UG-MARKET-MONITORS',
        sourceName: 'Uganda Regional Commodity & Food Price Monitor Network',
        sourceCategory: 'COMMODITY_EXCHANGE',
        sourceClassification: 'VERIFIED_MARKET_SOURCE',
        endpointOrReference: 'internal://aros/price-observations',
        accessMethod: 'CSV_IMPORT',
        connectionStatus: 'LOCAL_ONLY',
        authenticationRequired: true,
        licensingRestrictions: 'Authorized East African cooperative & municipal market enumerators only.',
        commercialRedistributionAllowed: true,
        updateFrequencyHours: 24,
        lastSuccessfulRetrieval: now,
        reliabilityScorePct: 92.0,
        adminApprovalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-CORRIDOR-RECTS-REF'),
        id: 'SRC-CORRIDOR-RECTS-REF',
        sourceName: 'Northern & Central Corridor Freight & Border Telemetry Directory',
        sourceCategory: 'LOGISTICS_CORRIDOR',
        sourceClassification: 'AUTHORIZED_PARTNER_SOURCE',
        endpointOrReference: 'https://corridor-telemetry.eac.reference/v1/dwell-times',
        accessMethod: 'AUTHORIZED_API',
        connectionStatus: 'REFERENCE_DIRECTORY',
        authenticationRequired: true,
        licensingRestrictions: 'Reference schema only; live external carrier API credentials not provisioned in local runtime.',
        commercialRedistributionAllowed: false,
        updateFrequencyHours: 6,
        lastSuccessfulRetrieval: '2026-11-08T10:00:00.000Z',
        lastFailedRetrieval: '2026-11-12T06:00:00.000Z',
        reliabilityScorePct: 81.0,
        adminApprovalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-BOU-FX-REF'),
        id: 'SRC-BOU-FX-REF',
        sourceName: 'Bank of Uganda Indicative FX & Monetary Reference Feed',
        sourceCategory: 'CENTRAL_BANK',
        sourceClassification: 'VERIFIED_INSTITUTIONAL_SOURCE',
        endpointOrReference: 'https://www.bou.or.ug/reference/indicative-fx',
        accessMethod: 'JSON_IMPORT',
        connectionStatus: 'REFERENCE_DIRECTORY',
        authenticationRequired: false,
        licensingRestrictions: 'Indicative reference snapshots imported locally; no live central bank integration claimed.',
        commercialRedistributionAllowed: true,
        updateFrequencyHours: 24,
        lastSuccessfulRetrieval: now,
        reliabilityScorePct: 97.0,
        adminApprovalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UBOS-CPI-NOT-CONFIGURED'),
        id: 'SRC-UBOS-CPI-NOT-CONFIGURED',
        sourceName: 'National Statistical Bureau Automated Macro Feed (UBOS / KNBS)',
        sourceCategory: 'PUBLIC_STATISTICS',
        sourceClassification: 'VERIFIED_INSTITUTIONAL_SOURCE',
        endpointOrReference: 'https://stats.ubos.go.ug/api/v1/indicators',
        accessMethod: 'AUTHORIZED_API',
        connectionStatus: 'NOT_CONFIGURED',
        authenticationRequired: true,
        licensingRestrictions: 'External institutional API key not configured; indicators lacking verified import remain UNAVAILABLE.',
        commercialRedistributionAllowed: false,
        updateFrequencyHours: 720,
        reliabilityScorePct: 0,
        adminApprovalStatus: 'PENDING_APPROVAL',
      },
      {
        ...baseMeta('TEN-UG-ELGON-01', 'UG', 'SRC-SANDBOX-SIM-FEED', 'RESTRICTED'),
        id: 'SRC-SANDBOX-SIM-FEED',
        sourceName: 'AETHER–AROS Sandbox Scenario Stress Calibration Feed',
        sourceCategory: 'PARTNER_FEED',
        sourceClassification: 'SIMULATED_DATA',
        endpointOrReference: 'sandbox://aros/stress-calibration',
        accessMethod: 'JSON_IMPORT',
        connectionStatus: 'LOCAL_ONLY',
        authenticationRequired: true,
        licensingRestrictions: 'Strictly labeled SIMULATED_DATA; prohibited from authoritative indicator publication.',
        commercialRedistributionAllowed: false,
        updateFrequencyHours: 168,
        lastSuccessfulRetrieval: now,
        reliabilityScorePct: 75.0,
        adminApprovalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
      },
    ];
    sources.forEach((s) => db.intelligenceSources.set(s.id, s));
  }

  // 2. intelligenceSourceCredentials (never return keyHash or raw secret in public DTOs)
  if (db.intelligenceSourceCredentials.size === 0) {
    const creds: IntelligenceSourceCredential[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-CORRIDOR-RECTS-REF', 'CONFIDENTIAL'),
        id: 'CRED-SRC-RECTS-01',
        sourceId: 'SRC-CORRIDOR-RECTS-REF',
        authScheme: 'API_KEY',
        keyHash: sha256Hex('SANDBOX_PLACEHOLDER_RECTS_KEY_DO_NOT_EXFILTRATE'),
        maskedPreview: 'arcs_****_8f2a',
        expiresAt: '2027-06-30T23:59:59.000Z',
        rotationStatus: 'ACTIVE',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UBOS-CPI-NOT-CONFIGURED', 'CONFIDENTIAL'),
        id: 'CRED-SRC-UBOS-02',
        sourceId: 'SRC-UBOS-CPI-NOT-CONFIGURED',
        authScheme: 'OAUTH2_CLIENT',
        keyHash: sha256Hex('UNCONFIGURED_STAT_BUREAU_SLOT'),
        maskedPreview: 'NOT_PROVISIONED',
        expiresAt: '2026-01-01T00:00:00.000Z',
        rotationStatus: 'EXPIRED',
      },
    ];
    creds.forEach((c) => db.intelligenceSourceCredentials.set(c.id, c));
  }

  // 3. intelligenceSourceHealth
  if (db.intelligenceSourceHealth.size === 0) {
    const healthRecords: IntelligenceSourceHealth[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'HLTH-SRC-01',
        sourceId: 'SRC-AROS-MARKET-LEDGER',
        sourceName: 'AETHER–AROS Internal Marketplace & Trade Ledger',
        status: 'HEALTHY',
        lastCheckedAt: now,
        stalenessHours: 0.5,
        duplicateRatePct: 0,
        formatDriftDetected: false,
        abnormalValueCount: 0,
        missingUpdateCount: 0,
        diagnosticNotes: 'Internal authoritative ledger sync healthy.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-CORRIDOR-RECTS-REF'),
        id: 'HLTH-SRC-02',
        sourceId: 'SRC-CORRIDOR-RECTS-REF',
        sourceName: 'Northern & Central Corridor Freight & Border Telemetry Directory',
        status: 'STALE',
        lastCheckedAt: now,
        stalenessHours: 96,
        duplicateRatePct: 0,
        formatDriftDetected: false,
        abnormalValueCount: 1,
        missingUpdateCount: 4,
        diagnosticNotes: 'Last automated pull exceeded 48h freshness window; corridor metrics flagged stale until next verified import.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UBOS-CPI-NOT-CONFIGURED'),
        id: 'HLTH-SRC-03',
        sourceId: 'SRC-UBOS-CPI-NOT-CONFIGURED',
        sourceName: 'National Statistical Bureau Automated Macro Feed (UBOS / KNBS)',
        status: 'NOT_CONFIGURED',
        lastCheckedAt: now,
        stalenessHours: 999,
        duplicateRatePct: 0,
        formatDriftDetected: false,
        abnormalValueCount: 0,
        missingUpdateCount: 12,
        diagnosticNotes: 'No live statistical agency credentials configured; dependent indicators honestly marked UNAVAILABLE.',
      },
    ];
    healthRecords.forEach((h) => db.intelligenceSourceHealth.set(h.id, h));
  }

  // 6. economicIndicatorDefinitions
  if (db.economicIndicatorDefinitions.size === 0) {
    const defs: EconomicIndicatorDefinition[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UG-MARKET-MONITORS'),
        id: 'DEF-UG-MAIZE-WHOLESALE',
        code: 'UG_MAIZE_WHOLESALE_KG',
        name: 'Uganda Grade-1 Dry Maize Wholesale Price',
        description: 'Weighted average wholesale price per kilogram of FAQ/Grade-1 maize across Kampala, Jinja, and Mbale markets.',
        economicCategory: 'COMMODITY_PRICES',
        unitOfMeasurement: 'UGX/KG',
        canonicalNormalizationUnit: 'UGX_PER_KG',
        updateFrequency: 'WEEKLY',
        calculationMethodology: 'Median of verified municipal & cooperative market price observations excluding rejected outliers.',
        minimumObservationsForForecast: 4,
        maxStalenessHours: 336,
        limitations: 'Reflects major regional hubs; remote rural farm-gate prices may vary by transport spread.',
        definitionalDifferencesByJurisdiction: {
          UG: 'Measured at 13.5% max moisture Grade-1 wholesale bag equivalent (100 kg divided by 100).',
          KE: 'Kenyan markets frequently quote 90 kg wholesale bags; converted to per-KG equivalent.',
        },
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UG-MARKET-MONITORS'),
        id: 'DEF-UG-COFFEE-ARABICA-EXPORT',
        code: 'UG_COFFEE_ARABICA_KG',
        name: 'Mount Elgon Arabica Specialty Parchment Price',
        description: 'Cooperative & export reference price for Bugisu Arabica Grade AA parchment.',
        economicCategory: 'COMMODITY_PRICES',
        unitOfMeasurement: 'UGX/KG',
        canonicalNormalizationUnit: 'UGX_PER_KG',
        updateFrequency: 'WEEKLY',
        calculationMethodology: 'Volume-weighted mean of verified cooperative off-take contracts and market reports.',
        minimumObservationsForForecast: 4,
        maxStalenessHours: 336,
        limitations: 'Specialty micro-lots may command higher premiums outside standard Grade AA contracts.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-BOU-FX-REF'),
        id: 'DEF-FX-USD-UGX',
        code: 'FX_USD_UGX_MID',
        name: 'USD / UGX Indicative Mid Exchange Rate',
        description: 'Indicative Uganda Shilling per US Dollar reference mid-rate.',
        economicCategory: 'CURRENCY_FX',
        unitOfMeasurement: 'UGX/USD',
        canonicalNormalizationUnit: 'UGX_PER_USD',
        updateFrequency: 'DAILY',
        calculationMethodology: 'Imported indicative central-bank / treasury reference rate.',
        minimumObservationsForForecast: 4,
        maxStalenessHours: 168,
        limitations: 'Indicative rate only; commercial bank desk execution spreads vary by volume.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-CORRIDOR-RECTS-REF'),
        id: 'DEF-EAC-FREIGHT-NORTHERN',
        code: 'EAC_NORTHERN_FREIGHT_MT',
        name: 'Northern Corridor Road Freight Cost (Mombasa–Kampala)',
        description: 'Standard 30T containerized/bulk haulage rate per metric tonne.',
        economicCategory: 'LOGISTICS_COSTS',
        unitOfMeasurement: 'USD/MT',
        canonicalNormalizationUnit: 'USD_PER_MT',
        updateFrequency: 'WEEKLY',
        calculationMethodology: 'Carrier-reported freight tariffs adjusted for verified corridor surcharges.',
        minimumObservationsForForecast: 4,
        maxStalenessHours: 72,
        limitations: 'Subject to seasonal fuel price revisions and border dwell surcharges.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'DEF-UG-PROCUREMENT-DEMAND',
        code: 'UG_PROCUREMENT_RFQ_INDEX',
        name: 'Multi-Sector Procurement Demand Index',
        description: 'Aggregate monthly procurement RFQ value across manufacturing, agro-processing, and services.',
        economicCategory: 'PROCUREMENT_DEMAND',
        unitOfMeasurement: 'MILLION_UGX',
        canonicalNormalizationUnit: 'MILLION_UGX',
        updateFrequency: 'MONTHLY',
        calculationMethodology: 'Sum of verified active RFQ budgets normalized by baseline month (100 = baseline).',
        minimumObservationsForForecast: 4,
        maxStalenessHours: 720,
        limitations: 'Captures on-platform procurement activity; off-platform bilateral tenders excluded.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'DEF-UG-INDUSTRIAL-UTIL',
        code: 'UG_INDUSTRIAL_CAPACITY_UTIL',
        name: 'Registered Industrial Processing Utilization Rate',
        description: 'Share of audited monthly processing capacity allocated across registered factories.',
        economicCategory: 'INDUSTRIAL_OUTPUT',
        unitOfMeasurement: 'PERCENT',
        canonicalNormalizationUnit: 'PERCENT',
        updateFrequency: 'MONTHLY',
        calculationMethodology: 'Allocated throughput divided by audited total monthly capacity.',
        minimumObservationsForForecast: 4,
        maxStalenessHours: 720,
        limitations: 'Limited to facilities reporting capacity records on AETHER–AROS.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UBOS-CPI-NOT-CONFIGURED'),
        id: 'DEF-UG-ENERGY-GRID-UNAVAIL',
        code: 'UG_INDUSTRIAL_GRID_RELIABILITY',
        name: 'National Industrial Power Grid Feeder Reliability Index',
        description: 'Verified industrial feeder uptime telemetry across regional manufacturing parks.',
        economicCategory: 'ENERGY_AVAILABILITY',
        unitOfMeasurement: 'PERCENT',
        canonicalNormalizationUnit: 'PERCENT',
        updateFrequency: 'MONTHLY',
        calculationMethodology: 'Requires verified utility telemetry feed (currently unconfigured).',
        minimumObservationsForForecast: 6,
        maxStalenessHours: 720,
        limitations: 'Utility API feed not yet configured; indicator values must not be fabricated.',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'KE', 'SRC-UBOS-CPI-NOT-CONFIGURED'),
        id: 'DEF-KE-SME-CREDIT-UNAVAIL',
        code: 'KE_SME_CREDIT_DEFAULT_RATE',
        name: 'Kenya Cross-Border SME Trade Credit Non-Performing Rate',
        description: 'Official financial institution delinquency series across cross-border SME trade portfolios.',
        economicCategory: 'PAYMENT_DELAYS',
        unitOfMeasurement: 'PERCENT',
        canonicalNormalizationUnit: 'PERCENT',
        updateFrequency: 'QUARTERLY',
        calculationMethodology: 'Requires authorized central bank / credit bureau release.',
        minimumObservationsForForecast: 6,
        maxStalenessHours: 2160,
        limitations: 'Authorized credit bureau source not connected in this environment.',
      },
    ];
    defs.forEach((d) => db.economicIndicatorDefinitions.set(d.id, d));
  }

  // 4 & 7. economicObservations + economicTimeSeries (6 clean monthly periods so forecasts & evaluations work authentically)
  if (db.economicObservations.size === 0) {
    const seriesSpecs: {
      indicatorId: string;
      code: string;
      sourceId: string;
      sourceClassification: EconomicObservation['sourceClassification'];
      jurisdiction: string;
      sector: string;
      commodity: string;
      region: string;
      unit: string;
      currency?: string;
      values: { period: string; date: string; value: number }[];
      isStale?: boolean;
    }[] = [
      {
        indicatorId: 'IND-UG-MAIZE-WHOLESALE',
        code: 'UG_MAIZE_WHOLESALE_KG',
        sourceId: 'SRC-UG-MARKET-MONITORS',
        sourceClassification: 'VERIFIED_MARKET_SOURCE',
        jurisdiction: 'UG',
        sector: 'Agriculture & Food Trade',
        commodity: 'Grade-1 Dry Maize',
        region: 'Kampala / Jinja / Mbale',
        unit: 'UGX/KG',
        currency: 'UGX',
        values: [
          { period: '2026-06', date: '2026-06-28T12:00:00.000Z', value: 1180 },
          { period: '2026-07', date: '2026-07-28T12:00:00.000Z', value: 1210 },
          { period: '2026-08', date: '2026-08-28T12:00:00.000Z', value: 1245 },
          { period: '2026-09', date: '2026-09-28T12:00:00.000Z', value: 1290 },
          { period: '2026-10', date: '2026-10-28T12:00:00.000Z', value: 1340 },
          { period: '2026-11', date: now, value: 1385 },
        ],
      },
      {
        indicatorId: 'IND-UG-COFFEE-ARABICA',
        code: 'UG_COFFEE_ARABICA_KG',
        sourceId: 'SRC-AROS-MARKET-LEDGER',
        sourceClassification: 'VERIFIED_PRIMARY_SOURCE',
        jurisdiction: 'UG',
        sector: 'Export Cash Crops & Processing',
        commodity: 'Arabica Bugisu AA',
        region: 'Mount Elgon Corridor',
        unit: 'UGX/KG',
        currency: 'UGX',
        values: [
          { period: '2026-06', date: '2026-06-28T12:00:00.000Z', value: 13200 },
          { period: '2026-07', date: '2026-07-28T12:00:00.000Z', value: 13450 },
          { period: '2026-08', date: '2026-08-28T12:00:00.000Z', value: 13900 },
          { period: '2026-09', date: '2026-09-28T12:00:00.000Z', value: 14100 },
          { period: '2026-10', date: '2026-10-28T12:00:00.000Z', value: 14450 },
          { period: '2026-11', date: now, value: 14800 },
        ],
      },
      {
        indicatorId: 'IND-FX-USD-UGX',
        code: 'FX_USD_UGX_MID',
        sourceId: 'SRC-BOU-FX-REF',
        sourceClassification: 'VERIFIED_INSTITUTIONAL_SOURCE',
        jurisdiction: 'UG',
        sector: 'Currency & Financial Infrastructure',
        commodity: 'USD/UGX Mid Rate',
        region: 'National Interbank',
        unit: 'UGX/USD',
        currency: 'UGX',
        values: [
          { period: '2026-06', date: '2026-06-28T12:00:00.000Z', value: 3710 },
          { period: '2026-07', date: '2026-07-28T12:00:00.000Z', value: 3725 },
          { period: '2026-08', date: '2026-08-28T12:00:00.000Z', value: 3740 },
          { period: '2026-09', date: '2026-09-28T12:00:00.000Z', value: 3732 },
          { period: '2026-10', date: '2026-10-28T12:00:00.000Z', value: 3755 },
          { period: '2026-11', date: now, value: 3768 },
        ],
      },
      {
        indicatorId: 'IND-EAC-FREIGHT-NORTHERN',
        code: 'EAC_NORTHERN_FREIGHT_MT',
        sourceId: 'SRC-CORRIDOR-RECTS-REF',
        sourceClassification: 'AUTHORIZED_PARTNER_SOURCE',
        jurisdiction: 'EAC',
        sector: 'Logistics & Cross-Border Freight',
        commodity: '30T Freight Tariff',
        region: 'Mombasa–Malaba–Kampala',
        unit: 'USD/MT',
        currency: 'USD',
        isStale: true,
        values: [
          { period: '2026-06', date: '2026-06-28T12:00:00.000Z', value: 94 },
          { period: '2026-07', date: '2026-07-28T12:00:00.000Z', value: 96 },
          { period: '2026-08', date: '2026-08-28T12:00:00.000Z', value: 98 },
          { period: '2026-09', date: '2026-09-28T12:00:00.000Z', value: 102 },
          { period: '2026-10', date: '2026-10-28T12:00:00.000Z', value: 105 },
          { period: '2026-11', date: '2026-11-08T10:00:00.000Z', value: 111 },
        ],
      },
      {
        indicatorId: 'IND-UG-PROCUREMENT-DEMAND',
        code: 'UG_PROCUREMENT_RFQ_INDEX',
        sourceId: 'SRC-AROS-MARKET-LEDGER',
        sourceClassification: 'VERIFIED_PRIMARY_SOURCE',
        jurisdiction: 'UG',
        sector: 'Multi-Sector Procurement',
        commodity: 'Procurement RFQ Volume',
        region: 'Uganda Network',
        unit: 'MILLION_UGX',
        currency: 'UGX',
        values: [
          { period: '2026-06', date: '2026-06-28T12:00:00.000Z', value: 420 },
          { period: '2026-07', date: '2026-07-28T12:00:00.000Z', value: 455 },
          { period: '2026-08', date: '2026-08-28T12:00:00.000Z', value: 480 },
          { period: '2026-09', date: '2026-09-28T12:00:00.000Z', value: 515 },
          { period: '2026-10', date: '2026-10-28T12:00:00.000Z', value: 548 },
          { period: '2026-11', date: now, value: 590 },
        ],
      },
      {
        indicatorId: 'IND-UG-INDUSTRIAL-UTIL',
        code: 'UG_INDUSTRIAL_CAPACITY_UTIL',
        sourceId: 'SRC-AROS-MARKET-LEDGER',
        sourceClassification: 'VERIFIED_PRIMARY_SOURCE',
        jurisdiction: 'UG',
        sector: 'Manufacturing & Industrial Processing',
        commodity: 'Factory Utilization',
        region: 'Namanve & Jinja Industrial Belt',
        unit: 'PERCENT',
        values: [
          { period: '2026-06', date: '2026-06-28T12:00:00.000Z', value: 66.5 },
          { period: '2026-07', date: '2026-07-28T12:00:00.000Z', value: 68.0 },
          { period: '2026-08', date: '2026-08-28T12:00:00.000Z', value: 69.2 },
          { period: '2026-09', date: '2026-09-28T12:00:00.000Z', value: 71.4 },
          { period: '2026-10', date: '2026-10-28T12:00:00.000Z', value: 72.8 },
          { period: '2026-11', date: now, value: 74.1 },
        ],
      },
    ];

    for (const s of seriesSpecs) {
      const tsPoints: EconomicTimeSeries['points'] = [];
      s.values.forEach((pt, idx) => {
        const obsId = `OBS-${s.code}-${pt.period}`;
        const obs: EconomicObservation = {
          ...baseMeta('GLOBAL_PUBLIC', s.jurisdiction, s.sourceId),
          id: obsId,
          sourceId: s.sourceId,
          sourceClassification: s.sourceClassification,
          indicatorId: s.indicatorId,
          indicatorCode: s.code,
          sector: s.sector,
          commodityOrSubject: s.commodity,
          regionOrCorridor: s.region,
          observationPeriod: pt.period,
          observedAt: pt.date,
          publishedAt: pt.date,
          numericValue: pt.value,
          unit: s.unit,
          normalizedValue: pt.value,
          normalizedUnit: s.unit,
          currency: s.currency,
          dataOwner: s.sourceId,
          authorizationScope: 'PUBLIC_AGGREGATE',
          qualityScore: s.isStale && idx === s.values.length - 1 ? 78 : 95,
          isStale: Boolean(s.isStale && idx === s.values.length - 1),
          dedupeKey: `${s.sourceId}|${s.code}|${pt.period}|${s.jurisdiction}`,
        };
        db.economicObservations.set(obs.id, obs);
        tsPoints.push({
          period: pt.period,
          observedAt: pt.date,
          value: pt.value,
          observationId: obs.id,
          sourceClassification: s.sourceClassification,
          qualityScore: obs.qualityScore,
        });
      });

      const ts: EconomicTimeSeries = {
        ...baseMeta('GLOBAL_PUBLIC', s.jurisdiction, s.sourceId),
        id: `TS-${s.indicatorId}`,
        indicatorId: s.indicatorId,
        indicatorCode: s.code,
        unit: s.unit,
        currency: s.currency,
        points: tsPoints,
      };
      db.economicTimeSeries.set(ts.id, ts);
    }
  }

  // 5. economicIndicators (including 2 explicit UNAVAILABLE indicators)
  if (db.economicIndicators.size === 0) {
    const indicators: EconomicIndicator[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UG-MARKET-MONITORS'),
        id: 'IND-UG-MAIZE-WHOLESALE',
        definitionId: 'DEF-UG-MAIZE-WHOLESALE',
        code: 'UG_MAIZE_WHOLESALE_KG',
        name: 'Uganda Grade-1 Dry Maize Wholesale Price',
        category: 'COMMODITY_PRICES',
        sector: 'Agriculture & Food Trade',
        regionLabel: 'Kampala / Jinja / Mbale',
        latestValue: 1385,
        previousValue: 1340,
        changePct: 3.36,
        unit: 'UGX/KG',
        currency: 'UGX',
        availabilityStatus: 'AVAILABLE',
        factOrEstimate: 'OBSERVED_FACT',
        sourceClassification: 'VERIFIED_MARKET_SOURCE',
        effectivePeriod: '2026-11',
        confidence: 'HIGH',
        limitations: 'Covers central & eastern regional wholesale depots.',
        staleWarning: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'IND-UG-COFFEE-ARABICA',
        definitionId: 'DEF-UG-COFFEE-ARABICA-EXPORT',
        code: 'UG_COFFEE_ARABICA_KG',
        name: 'Mount Elgon Arabica Specialty Parchment Price',
        category: 'COMMODITY_PRICES',
        sector: 'Export Cash Crops & Processing',
        regionLabel: 'Mount Elgon Corridor',
        latestValue: 14800,
        previousValue: 14450,
        changePct: 2.42,
        unit: 'UGX/KG',
        currency: 'UGX',
        availabilityStatus: 'AVAILABLE',
        factOrEstimate: 'OBSERVED_FACT',
        sourceClassification: 'VERIFIED_PRIMARY_SOURCE',
        effectivePeriod: '2026-11',
        confidence: 'HIGH',
        limitations: 'Derived from verified cooperative lot contracts.',
        staleWarning: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-BOU-FX-REF'),
        id: 'IND-FX-USD-UGX',
        definitionId: 'DEF-FX-USD-UGX',
        code: 'FX_USD_UGX_MID',
        name: 'USD / UGX Indicative Mid Exchange Rate',
        category: 'CURRENCY_FX',
        sector: 'Currency & Financial Infrastructure',
        regionLabel: 'Uganda National',
        latestValue: 3768,
        previousValue: 3755,
        changePct: 0.35,
        unit: 'UGX/USD',
        currency: 'UGX',
        availabilityStatus: 'AVAILABLE',
        factOrEstimate: 'OBSERVED_FACT',
        sourceClassification: 'VERIFIED_INSTITUTIONAL_SOURCE',
        effectivePeriod: '2026-11',
        confidence: 'HIGH',
        limitations: 'Indicative reference mid-rate; actual settlement desk rates may differ.',
        staleWarning: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-CORRIDOR-RECTS-REF'),
        id: 'IND-EAC-FREIGHT-NORTHERN',
        definitionId: 'DEF-EAC-FREIGHT-NORTHERN',
        code: 'EAC_NORTHERN_FREIGHT_MT',
        name: 'Northern Corridor Road Freight Cost (Mombasa–Kampala)',
        category: 'LOGISTICS_COSTS',
        sector: 'Logistics & Cross-Border Freight',
        regionLabel: 'East African Community (Northern Corridor)',
        latestValue: 111,
        previousValue: 105,
        changePct: 5.71,
        unit: 'USD/MT',
        currency: 'USD',
        availabilityStatus: 'STALE',
        factOrEstimate: 'OBSERVED_FACT',
        sourceClassification: 'AUTHORIZED_PARTNER_SOURCE',
        effectivePeriod: '2026-11',
        confidence: 'MODERATE',
        limitations: 'Source telemetry last refreshed >72h ago; treat with caution.',
        staleWarning: true,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'IND-UG-PROCUREMENT-DEMAND',
        definitionId: 'DEF-UG-PROCUREMENT-DEMAND',
        code: 'UG_PROCUREMENT_RFQ_INDEX',
        name: 'Multi-Sector Procurement Demand Index',
        category: 'PROCUREMENT_DEMAND',
        sector: 'Multi-Sector Procurement',
        regionLabel: 'Uganda Network',
        latestValue: 590,
        previousValue: 548,
        changePct: 7.66,
        unit: 'MILLION_UGX',
        currency: 'UGX',
        availabilityStatus: 'AVAILABLE',
        factOrEstimate: 'OBSERVED_FACT',
        sourceClassification: 'VERIFIED_PRIMARY_SOURCE',
        effectivePeriod: '2026-11',
        confidence: 'HIGH',
        limitations: 'Reflects active RFQs inside AETHER–AROS.',
        staleWarning: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'IND-UG-INDUSTRIAL-UTIL',
        definitionId: 'DEF-UG-INDUSTRIAL-UTIL',
        code: 'UG_INDUSTRIAL_CAPACITY_UTIL',
        name: 'Registered Industrial Processing Utilization Rate',
        category: 'INDUSTRIAL_OUTPUT',
        sector: 'Manufacturing & Industrial Processing',
        regionLabel: 'Namanve & Jinja Industrial Belt',
        latestValue: 74.1,
        previousValue: 72.8,
        changePct: 1.79,
        unit: 'PERCENT',
        availabilityStatus: 'AVAILABLE',
        factOrEstimate: 'OBSERVED_FACT',
        sourceClassification: 'VERIFIED_PRIMARY_SOURCE',
        effectivePeriod: '2026-11',
        confidence: 'HIGH',
        limitations: 'Covers industrial facilities registered in AETHER–AROS.',
        staleWarning: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UBOS-CPI-NOT-CONFIGURED'),
        id: 'IND-UG-ENERGY-GRID-UNAVAIL',
        definitionId: 'DEF-UG-ENERGY-GRID-UNAVAIL',
        code: 'UG_INDUSTRIAL_GRID_RELIABILITY',
        name: 'National Industrial Power Grid Feeder Reliability Index',
        category: 'ENERGY_AVAILABILITY',
        sector: 'Energy & Utilities',
        regionLabel: 'Uganda National Grid',
        latestValue: null,
        previousValue: null,
        changePct: null,
        unit: 'PERCENT',
        availabilityStatus: 'UNAVAILABLE',
        unavailableReason: 'Verified electric utility telemetry feed (SRC-UBOS-CPI-NOT-CONFIGURED) is not configured; value intentionally omitted rather than fabricated.',
        factOrEstimate: 'UNAVAILABLE',
        sourceClassification: 'VERIFIED_INSTITUTIONAL_SOURCE',
        effectivePeriod: 'UNAVAILABLE',
        confidence: 'INSUFFICIENT_DATA',
        limitations: 'No verified observations available.',
        staleWarning: true,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'KE', 'SRC-UBOS-CPI-NOT-CONFIGURED'),
        id: 'IND-KE-SME-CREDIT-UNAVAIL',
        definitionId: 'DEF-KE-SME-CREDIT-UNAVAIL',
        code: 'KE_SME_CREDIT_DEFAULT_RATE',
        name: 'Kenya Cross-Border SME Trade Credit Non-Performing Rate',
        category: 'PAYMENT_DELAYS',
        sector: 'Financial Services & Credit',
        regionLabel: 'Kenya',
        latestValue: null,
        previousValue: null,
        changePct: null,
        unit: 'PERCENT',
        availabilityStatus: 'UNAVAILABLE',
        unavailableReason: 'Authorized central bank / credit bureau source has not published machine-readable series to this node.',
        factOrEstimate: 'UNAVAILABLE',
        sourceClassification: 'VERIFIED_INSTITUTIONAL_SOURCE',
        effectivePeriod: 'UNAVAILABLE',
        confidence: 'INSUFFICIENT_DATA',
        limitations: 'Insufficient verified observations to display numeric metric.',
        staleWarning: true,
      },
    ];
    indicators.forEach((i) => db.economicIndicators.set(i.id, i));
  }

  // 8. economicDataQualityReports
  if (db.economicDataQualityReports.size === 0) {
    const dq: EconomicDataQualityReport = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-QUALITY-MONITOR'),
      id: 'DQR-2026-11-INITIAL',
      scope: 'Global Economic Observatory Baseline Audit',
      totalObservationsChecked: db.economicObservations.size,
      verifiedCount: Math.max(1, db.economicObservations.size - 1),
      staleCount: 1,
      duplicateRejectedCount: 0,
      invalidRejectedCount: 0,
      missingIndicatorCount: 2,
      overallQualityScore: 91.5,
      poisoningSignalsDetected: 0,
      issues: [
        {
          severity: 'MEDIUM',
          code: 'STALE_CORRIDOR_TELEMETRY',
          description: 'Northern Corridor freight series last refreshed >72 hours ago.',
          affectedId: 'IND-EAC-FREIGHT-NORTHERN',
        },
        {
          severity: 'LOW',
          code: 'UNAVAILABLE_UTILITY_SOURCE',
          description: '2 macro/utility indicators marked UNAVAILABLE awaiting authorized external connector.',
          affectedId: 'IND-UG-ENERGY-GRID-UNAVAIL',
        },
      ],
      generatedAt: now,
    };
    db.economicDataQualityReports.set(dq.id, dq);
  }

  // 10. forecastModels
  if (db.forecastModels.size === 0) {
    const models: ForecastModel[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-MODEL-REGISTRY'),
        id: 'MDL-STAT-MA-BASE-V1',
        modelName: 'Weighted Moving Average Statistical Baseline',
        version: '1.0.0',
        method: 'MOVING_AVERAGE',
        supportedDomains: [
          'COMMODITY_PRICES',
          'FOOD_PRICES',
          'BUSINESS_DEMAND',
          'PRODUCT_DEMAND',
          'SUPPLY_AVAILABILITY',
          'FREIGHT_TRANSPORT_COSTS',
          'CURRENCY_TRENDS',
        ],
        trainingDataReference: 'obs://2026-06..2026-10-verified-series',
        validationDataReference: 'eval://2026-10..2026-11-holdout',
        evaluationPeriod: '2026-06 to 2026-11',
        errorMetrics: {
          mae: 28.4,
          rmse: 34.1,
          mapePct: 2.35,
          predictionIntervalCoveragePct: 90.0,
          directionalAccuracyPct: 83.3,
        },
        knownWeaknesses: ['Lags sharp structural regime shifts or sudden border closures.'],
        approvalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
        deploymentStatus: 'ACTIVE',
        isBaselineModel: true,
        driftDetected: false,
        requiresReviewBeforeRestore: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-MODEL-REGISTRY'),
        id: 'MDL-STAT-HOLT-EXP-V1',
        modelName: 'Holt Double Exponential Smoothing Trend Forecaster',
        version: '1.2.0',
        method: 'EXPONENTIAL_SMOOTHING',
        supportedDomains: [
          'COMMODITY_PRICES',
          'FOOD_PRICES',
          'IMPORT_EXPORT_ACTIVITY',
          'FREIGHT_TRANSPORT_COSTS',
          'CURRENCY_TRENDS',
          'INDUSTRIAL_PRODUCTION',
          'PROCUREMENT_DEMAND',
          'REGIONAL_ECONOMIC_ACTIVITY',
        ],
        trainingDataReference: 'obs://2026-06..2026-10-verified-series',
        validationDataReference: 'eval://2026-10..2026-11-holdout',
        evaluationPeriod: '2026-06 to 2026-11',
        baselineModelId: 'MDL-STAT-MA-BASE-V1',
        errorMetrics: {
          mae: 19.2,
          rmse: 24.8,
          mapePct: 1.62,
          predictionIntervalCoveragePct: 92.5,
          directionalAccuracyPct: 88.9,
        },
        knownWeaknesses: ['Assumes linear local slope continuity; sensitive to uncleaned outlier spikes.'],
        approvalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
        deploymentStatus: 'ACTIVE',
        isBaselineModel: false,
        driftDetected: false,
        requiresReviewBeforeRestore: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-MODEL-REGISTRY'),
        id: 'MDL-STAT-OLS-TREND-V1',
        modelName: 'Ordinary Least Squares Trend & Interval Estimator',
        version: '1.1.0',
        method: 'LINEAR_REGRESSION',
        supportedDomains: [
          'COMMODITY_PRICES',
          'INVENTORY_REQUIREMENTS',
          'EMPLOYMENT_DEMAND',
          'BUSINESS_CASH_FLOW_SCENARIOS',
          'SUPPLY_CHAIN_DISRUPTION_RISK',
        ],
        trainingDataReference: 'obs://2026-06..2026-10-verified-series',
        validationDataReference: 'eval://2026-10..2026-11-holdout',
        evaluationPeriod: '2026-06 to 2026-11',
        baselineModelId: 'MDL-STAT-MA-BASE-V1',
        errorMetrics: {
          mae: 21.5,
          rmse: 26.4,
          mapePct: 1.85,
          predictionIntervalCoveragePct: 91.0,
          directionalAccuracyPct: 85.0,
        },
        knownWeaknesses: ['Underfits non-linear seasonal crop cycles unless paired with seasonal adjustment.'],
        approvalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
        deploymentStatus: 'ACTIVE',
        isBaselineModel: false,
        driftDetected: false,
        requiresReviewBeforeRestore: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-MODEL-REGISTRY'),
        id: 'MDL-STAT-SEASONAL-V1',
        modelName: 'East African Bimodal Seasonal Decomposition Model',
        version: '1.0.4',
        method: 'SEASONAL_DECOMPOSITION',
        supportedDomains: ['COMMODITY_PRICES', 'FOOD_PRICES', 'SUPPLY_AVAILABILITY'],
        trainingDataReference: 'obs://2026-06..2026-10-verified-series',
        validationDataReference: 'eval://2026-10..2026-11-holdout',
        evaluationPeriod: '2026-06 to 2026-11',
        baselineModelId: 'MDL-STAT-MA-BASE-V1',
        errorMetrics: {
          mae: 22.8,
          rmse: 28.0,
          mapePct: 1.94,
          predictionIntervalCoveragePct: 90.0,
          directionalAccuracyPct: 86.0,
        },
        knownWeaknesses: ['Requires >= 4 periods; loses seasonal precision during El Niño anomalies.'],
        approvalStatus: 'APPROVED',
        approvedBy: 'usr_admin_01',
        deploymentStatus: 'APPROVED',
        isBaselineModel: false,
        driftDetected: false,
        requiresReviewBeforeRestore: false,
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-MODEL-REGISTRY'),
        id: 'MDL-EXP-GRADIENT-DEV-V0',
        modelName: 'Experimental Multi-Factor Regressive Candidate',
        version: '0.4.2-dev',
        method: 'ANOMALY_ADJUSTED',
        supportedDomains: ['REGIONAL_ECONOMIC_ACTIVITY', 'SUPPLY_CHAIN_DISRUPTION_RISK'],
        trainingDataReference: 'obs://sandbox-candidate',
        validationDataReference: 'pending-validation',
        evaluationPeriod: 'Pending formal holdout evaluation',
        baselineModelId: 'MDL-STAT-MA-BASE-V1',
        errorMetrics: {
          mae: 39.0,
          rmse: 47.2,
          mapePct: 4.1,
          predictionIntervalCoveragePct: 78.0,
          directionalAccuracyPct: 70.0,
        },
        knownWeaknesses: ['Not yet outperforming statistical baseline; blocked from production active deployment.'],
        approvalStatus: 'PENDING_VALIDATION',
        deploymentStatus: 'DEVELOPMENT',
        isBaselineModel: false,
        driftDetected: false,
        requiresReviewBeforeRestore: false,
      },
    ];
    models.forEach((m) => db.forecastModels.set(m.id, m));
  }

  // 9, 11, 12. v12EconomicForecasts, forecastEvaluations, forecastAccuracyHistory
  if (db.v12EconomicForecasts.size === 0) {
    const fc1: V12EconomicForecast = {
      ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UG-MARKET-MONITORS'),
      id: 'FC12-UG-MAIZE-30D',
      indicatorId: 'IND-UG-MAIZE-WHOLESALE',
      indicatorName: 'Uganda Grade-1 Dry Maize Wholesale Price',
      domain: 'COMMODITY_PRICES',
      sector: 'Agriculture & Food Trade',
      horizon: 'NEAR_TERM',
      horizonDays: 30,
      generatedAt: now,
      expiresAt: '2026-12-15T23:59:59.000Z',
      sourceObservationIds: [
        'OBS-UG_MAIZE_WHOLESALE_KG-2026-06',
        'OBS-UG_MAIZE_WHOLESALE_KG-2026-07',
        'OBS-UG_MAIZE_WHOLESALE_KG-2026-08',
        'OBS-UG_MAIZE_WHOLESALE_KG-2026-09',
        'OBS-UG_MAIZE_WHOLESALE_KG-2026-10',
        'OBS-UG_MAIZE_WHOLESALE_KG-2026-11',
      ],
      observationCountUsed: 6,
      inputHash: sha256Hex('IND-UG-MAIZE-WHOLESALE|MDL-STAT-HOLT-EXP-V1|NEAR_TERM|1180,1210,1245,1290,1340,1385'),
      modelId: 'MDL-STAT-HOLT-EXP-V1',
      modelVersion: '1.2.0',
      methodUsed: 'EXPONENTIAL_SMOOTHING',
      methodology: 'Holt linear trend exponential smoothing (alpha=0.55, beta=0.35) over 6 verified monthly market observations.',
      assumptions: ['No abrupt export ban enacted within 30 days', 'Normal post-harvest road corridor accessibility'],
      baselineValue: 1385,
      expectedValue: 1428,
      unit: 'UGX/KG',
      currency: 'UGX',
      predictionInterval: { lower: 1379, upper: 1477, coverageLevelPct: 90 },
      confidenceClassification: 'HIGH',
      validationMetrics: { mae: 19.2, rmse: 24.8, mapePct: 1.62, directionalAccuracyPct: 88.9 },
      knownLimitations: ['Statistical projection only; does not guarantee future spot market clearing price.'],
      modelStatus: 'ACTIVE',
      outputValidated: true,
    };

    const fc2: V12EconomicForecast = {
      ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
      id: 'FC12-UG-PROCUREMENT-90D',
      indicatorId: 'IND-UG-PROCUREMENT-DEMAND',
      indicatorName: 'Multi-Sector Procurement Demand Index',
      domain: 'PROCUREMENT_DEMAND',
      sector: 'Multi-Sector Procurement',
      horizon: 'MEDIUM_TERM',
      horizonDays: 90,
      generatedAt: now,
      expiresAt: '2027-02-15T23:59:59.000Z',
      sourceObservationIds: [
        'OBS-UG_PROCUREMENT_RFQ_INDEX-2026-06',
        'OBS-UG_PROCUREMENT_RFQ_INDEX-2026-07',
        'OBS-UG_PROCUREMENT_RFQ_INDEX-2026-08',
        'OBS-UG_PROCUREMENT_RFQ_INDEX-2026-09',
        'OBS-UG_PROCUREMENT_RFQ_INDEX-2026-10',
        'OBS-UG_PROCUREMENT_RFQ_INDEX-2026-11',
      ],
      observationCountUsed: 6,
      inputHash: sha256Hex('IND-UG-PROCUREMENT-DEMAND|MDL-STAT-OLS-TREND-V1|MEDIUM_TERM|420,455,480,515,548,590'),
      modelId: 'MDL-STAT-OLS-TREND-V1',
      modelVersion: '1.1.0',
      methodUsed: 'LINEAR_REGRESSION',
      methodology: 'OLS linear trend regression over 6 monthly on-network procurement volume snapshots.',
      assumptions: ['Buyer tenant renewal rate stays constant', 'No macro liquidity freeze'],
      baselineValue: 590,
      expectedValue: 684,
      unit: 'MILLION_UGX',
      currency: 'UGX',
      predictionInterval: { lower: 635, upper: 733, coverageLevelPct: 90 },
      confidenceClassification: 'MODERATE',
      validationMetrics: { mae: 21.5, rmse: 26.4, mapePct: 1.85, directionalAccuracyPct: 85.0 },
      knownLimitations: ['Medium-term window carries wider interval due to 6-month history span.'],
      modelStatus: 'ACTIVE',
      outputValidated: true,
    };

    const fc3: V12EconomicForecast = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-CORRIDOR-RECTS-REF'),
      id: 'FC12-EAC-FREIGHT-14D',
      indicatorId: 'IND-EAC-FREIGHT-NORTHERN',
      indicatorName: 'Northern Corridor Road Freight Cost (Mombasa–Kampala)',
      domain: 'FREIGHT_TRANSPORT_COSTS',
      sector: 'Logistics & Cross-Border Freight',
      horizon: 'NEAR_TERM',
      horizonDays: 14,
      generatedAt: now,
      expiresAt: '2026-11-30T23:59:59.000Z',
      sourceObservationIds: [
        'OBS-EAC_NORTHERN_FREIGHT_MT-2026-06',
        'OBS-EAC_NORTHERN_FREIGHT_MT-2026-07',
        'OBS-EAC_NORTHERN_FREIGHT_MT-2026-08',
        'OBS-EAC_NORTHERN_FREIGHT_MT-2026-09',
        'OBS-EAC_NORTHERN_FREIGHT_MT-2026-10',
        'OBS-EAC_NORTHERN_FREIGHT_MT-2026-11',
      ],
      observationCountUsed: 6,
      inputHash: sha256Hex('IND-EAC-FREIGHT-NORTHERN|MDL-STAT-MA-BASE-V1|NEAR_TERM|94,96,98,102,105,111'),
      modelId: 'MDL-STAT-MA-BASE-V1',
      modelVersion: '1.0.0',
      methodUsed: 'MOVING_AVERAGE',
      methodology: 'Weighted 4-period moving average over corridor tariff directory snapshots.',
      assumptions: ['Diesel pump tariffs remain within +/-5%', 'Malaba OSBP remains open'],
      baselineValue: 111,
      expectedValue: 114,
      unit: 'USD/MT',
      currency: 'USD',
      predictionInterval: { lower: 106, upper: 122, coverageLevelPct: 90 },
      confidenceClassification: 'LOW',
      validationMetrics: { mae: 2.8, rmse: 3.4, mapePct: 2.65, directionalAccuracyPct: 80.0 },
      knownLimitations: ['Underlying corridor feed currently flagged STALE (>72h); confidence downgraded to LOW.'],
      modelStatus: 'ACTIVE',
      outputValidated: true,
    };

    [fc1, fc2, fc3].forEach((f) => db.v12EconomicForecasts.set(f.id, f));

    const evalRec: ForecastEvaluation = {
      ...baseMeta('GLOBAL_PUBLIC', 'UG', 'V12-EVALUATION-ENGINE'),
      id: 'EVAL-FC12-MAIZE-OCT',
      forecastId: fc1.id,
      modelId: 'MDL-STAT-HOLT-EXP-V1',
      modelVersion: '1.2.0',
      indicatorId: 'IND-UG-MAIZE-WHOLESALE',
      forecastValue: 1368,
      actualObservedValue: 1385,
      actualObservationId: 'OBS-UG_MAIZE_WHOLESALE_KG-2026-11',
      absoluteError: 17,
      squaredError: 289,
      percentageErrorPct: 1.23,
      withinPredictionInterval: true,
      directionCorrect: true,
      evaluatedAt: now,
      notes: 'Backtest evaluation comparing prior forecast against verified 2026-11 market close.',
    };
    db.forecastEvaluations.set(evalRec.id, evalRec);

    const accRec: ForecastAccuracyHistoryRecord = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-EVALUATION-ENGINE'),
      id: 'ACCHIST-HOLT-2026-11',
      modelId: 'MDL-STAT-HOLT-EXP-V1',
      modelVersion: '1.2.0',
      period: '2026-11',
      sampleCount: 12,
      mae: 19.2,
      rmse: 24.8,
      mapePct: 1.62,
      intervalCoveragePct: 92.5,
      directionalAccuracyPct: 88.9,
      comparedAgainstBaselineDeltaPct: -18.4, // 18.4% lower error than MA baseline
      recordedAt: now,
    };
    db.forecastAccuracyHistory.set(accRec.id, accRec);
  }

  // 13. economicAnomalies
  if (db.economicAnomalies.size === 0) {
    const anomalies: EconomicAnomaly[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-ANOMALY-ENGINE'),
        id: 'ANOM-2026-FREIGHT-01',
        classification: 'OPERATIONAL_ANOMALY',
        title: 'Northern Corridor Freight Tariff Surge (+5.7% Single-Period Step)',
        detectionReason: 'Freight cost per MT exceeded rolling 4-month moving average by 2.4 standard deviations.',
        affectedRecordType: 'OBSERVATION',
        affectedRecordId: 'OBS-EAC_NORTHERN_FREIGHT_MT-2026-11',
        historicalBaselineValue: 100.25,
        observedValue: 111,
        deviationZScore: 2.41,
        detectionMethod: 'ROLLING_Z_SCORE_V1',
        severity: 'MEDIUM',
        confidence: 'MODERATE',
        recommendedInvestigation: 'Verify Malaba OSBP border dwell queues and carrier diesel surcharge schedules before locking long-term haulage contracts.',
        humanInvestigationRequired: false,
        reviewStatus: 'OPEN',
        resolutionHistory: [],
      },
      {
        ...baseMeta('TEN-UG-ROOFINGS-02', 'UG', 'V12-ANOMALY-ENGINE', 'TENANT_PRIVATE'),
        id: 'ANOM-2026-PAYMENT-02',
        classification: 'FINANCIAL_REVIEW_REQUIRED',
        title: 'Repeated Cross-Border Supplier Settlement Retry Pattern',
        detectionReason: 'Three settlement initiation retries within 45 minutes flagged for operator reconciliation check.',
        affectedRecordType: 'PAYMENT',
        affectedRecordId: 'FIN-EXEC-2026-001',
        affectedParticipantId: 'PART-UG-COOP-001',
        historicalBaselineValue: 1.0,
        observedValue: 3.0,
        deviationZScore: 2.65,
        detectionMethod: 'VELOCITY_SPIKE_CHECK',
        severity: 'HIGH',
        confidence: 'MODERATE',
        recommendedInvestigation: 'Human compliance analyst must inspect idempotency logs before any participant status action. Anomaly is not proof of fraud.',
        humanInvestigationRequired: true,
        reviewStatus: 'UNDER_INVESTIGATION',
        resolutionHistory: [
          {
            timestamp: now,
            actor: 'compliance-triage',
            status: 'UNDER_INVESTIGATION',
            notes: 'Assigned to human compliance auditor; no automated punitive action taken.',
          },
        ],
      },
    ];
    anomalies.forEach((a) => db.economicAnomalies.set(a.id, a));
  }

  // 14. economicEarlyWarnings
  if (db.economicEarlyWarnings.size === 0) {
    const warnings: V12EconomicEarlyWarning[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-CORRIDOR-RECTS-REF'),
        id: 'EWR-V12-2026-01',
        eventCode: 'CORRIDOR-NORTHERN-DWELL-01',
        title: 'Elevated Transit & Freight Cost Pressure on Northern Corridor (Mombasa–Malaba–Kampala)',
        riskDomain: 'LOGISTICS',
        severity: 'ELEVATED',
        affectedSectors: ['Logistics & Freight', 'Manufacturing Inputs', 'Cross-Border Grain Trade'],
        evidenceSummary: 'Corridor freight tariff rose +5.71% month-over-month to $111/MT alongside 96h telemetry lag.',
        sourceReferences: ['SRC-CORRIDOR-RECTS-REF', 'ANOM-2026-FREIGHT-01'],
        detectedAt: now,
        expectedImpact: 'Potential 2–4 day delivery lead-time buffer needed for containerized industrial imports.',
        potentialAffectedParticipants: ['Kampala Agro-Processors & Grain Mills Ltd', 'Roofings Rolling Mills Ltd'],
        forecastHorizon: '14–30 DAYS',
        recommendedPreventiveAction: 'Evaluate Busia OSBP diversion or rail-intermodal Tororo dry-port routing.',
        escalationRequirements: 'Internal logistics advisory; public emergency escalation requires PLATFORM_ADMIN authorization.',
        isPublicAlert: false,
        officialGovernmentDisclaimer: 'PLATFORM INTELLIGENCE SIGNAL ONLY: Not an official government, central bank, or statutory emergency-service bulletin.',
        reviewStatus: 'ACTIVE',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-UG-MARKET-MONITORS'),
        id: 'EWR-V12-2026-02',
        eventCode: 'FOOD-PRICE-WATCH-UG-02',
        title: 'Seasonal Maize Wholesale Price Appreciation Watch (+17.4% over 5 months)',
        riskDomain: 'FOOD_SUPPLY',
        severity: 'WATCH',
        affectedSectors: ['Agriculture & Food Trade', 'School & Institutional Procurement'],
        evidenceSummary: 'Grade-1 dry maize wholesale moved from 1,180 UGX/KG (June) to 1,385 UGX/KG (November).',
        sourceReferences: ['SRC-UG-MARKET-MONITORS', 'FC12-UG-MAIZE-30D'],
        detectedAt: now,
        expectedImpact: 'Higher feedstock procurement costs for commercial grain millers over next 30 days.',
        potentialAffectedParticipants: ['Kampala Agro-Processors & Grain Mills Ltd', 'Elgon Arabica Growers Cooperative Union'],
        forecastHorizon: '30 DAYS',
        recommendedPreventiveAction: 'Review warehouse receipt inventory buffers and lock forward supply contracts.',
        escalationRequirements: 'Routine market watch; no emergency escalation required.',
        isPublicAlert: false,
        officialGovernmentDisclaimer: 'PLATFORM INTELLIGENCE SIGNAL ONLY: Not an official MAAIF or government food security declaration.',
        reviewStatus: 'ACTIVE',
      },
    ];
    warnings.forEach((w) => db.economicEarlyWarnings.set(w.id, w));
  }

  // 15. v12EconomicOpportunities
  if (db.v12EconomicOpportunities.size === 0) {
    const opps: V12EconomicOpportunity[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'UG', 'SRC-AROS-MARKET-LEDGER'),
        id: 'OPP-V12-PROC-01',
        opportunityType: 'PROCUREMENT_DEMAND',
        title: 'Industrial Cold-Rolled Steel & Packaging Procurement Demand (Namanve Corridor)',
        description: 'Active manufacturing procurement RFQs exceed current prequalified domestic supplier quotes by 28% volume.',
        sector: 'Manufacturing & Industrial Inputs',
        demandEvidence: 'Multi-Sector Procurement Demand Index up +7.66% MoM to 590M UGX; active V11 procurement requests open.',
        supplyEvidence: 'Audited industrial utilization stands at 74.1%, leaving 25.9% expandable mill capacity.',
        estimatedMarketSizeAmount: 480000000,
        estimatedMarketSizeCurrency: 'UGX',
        competitionIndicators: '3 prequalified domestic fabricators active; moderate cross-border competition.',
        potentialParticipants: [
          { id: 'TEN-UG-ROOFINGS-02', name: 'Roofings Rolling Mills Ltd (Namanve Industrial Park)', role: 'INDUSTRIAL_BUYER' },
        ],
        linkedV11RecordIds: ['REQ-V11-001', 'CAP-V11-001'],
        confidence: 'HIGH',
        limitations: 'Indicative demand estimate from registered RFQs; does not guarantee contract award.',
        suggestedNextSteps: ['Inspect open RFQ specifications in V11 Procurement Marketplace', 'Verify supplier compliance docs'],
        disclaimer: 'Informational market intelligence only. Not investment advice or guaranteed financial return.',
        expiresAt: '2027-03-31T23:59:59.000Z',
        status: 'ACTIVE',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'SRC-AROS-MARKET-LEDGER'),
        id: 'OPP-V12-EXPORT-02',
        opportunityType: 'EXPORT_OPPORTUNITY',
        title: 'EAC Cross-Border Specialty Coffee & Grain Forward Supply Matching (UG → KE)',
        description: 'Roasters in Nairobi show sustained forward buying demand for washed Bugisu AA coffee under zero-tariff EAC Rules of Origin.',
        sector: 'Export Cash Crops & Cross-Border Trade',
        demandEvidence: 'Verified active V10/V11 execution flows and Nairobi Specialty Roasters buyer profile.',
        supplyEvidence: 'Elgon Arabica Cooperative active harvest inventory verified in Mbale depot.',
        estimatedMarketSizeAmount: 350000000,
        estimatedMarketSizeCurrency: 'UGX',
        competitionIndicators: 'High-grade washed Arabica supply tight during off-peak window.',
        potentialParticipants: [
          { id: 'TEN-UG-ELGON-01', name: 'Uganda Arabica Exporters Cooperative Union', role: 'EXPORTER' },
          { id: 'TEN-KE-ROASTERS-03', name: 'Nairobi Specialty Roasters & Blenders Ltd', role: 'IMPORTER' },
        ],
        linkedV11RecordIds: ['EXEC-UG-KE-2026-001'],
        confidence: 'HIGH',
        limitations: 'Requires valid EAC Simplified Certificate of Origin & MAAIF phytosanitary clearance.',
        suggestedNextSteps: ['Confirm Busia/Malaba corridor haulage slot', 'Draft bilateral forward supply schedule'],
        disclaimer: 'Informational market discovery only. Not personalized financial or investment advice.',
        expiresAt: '2027-02-28T23:59:59.000Z',
        status: 'ACTIVE',
      },
    ];
    opps.forEach((o) => db.v12EconomicOpportunities.set(o.id, o));
  }

  // 16 & 17. economicScenarios & scenarioSimulationResults
  if (db.economicScenarios.size === 0) {
    const scen: EconomicScenario = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-SCENARIO-ENGINE'),
      id: 'SCEN-EAC-TRANSPORT-SHOCK-01',
      scenarioName: 'Northern Corridor Transport Cost +10% / +25% Stress Comparison',
      scenarioType: 'TRANSPORT_COST_INCREASE',
      description: 'Models landed wholesale commodity & manufacturing input cost impact under +10%, +25%, and -10% transport cost shifts.',
      label: 'SIMULATED_SCENARIO',
      startingConditions: {
        baselineFreightUsdPerMt: 111,
        baselineMaizeUgxPerKg: 1385,
        baselineFxUgxPerUsd: 3768,
      },
      assumptions: [
        'Freight share represents ~14% of cross-border landed staple grain cost and ~19% of heavy industrial inputs.',
        'Pass-through elasticity calibrated at 0.72 over 30-day window.',
        'Simulation strictly isolated; zero mutations to production ledgers.',
      ],
      inputVariables: [
        { variable: 'corridor_freight_cost_usd_mt', baselineValue: 111, shockPct: 25, unit: 'USD/MT' },
      ],
      affectedJurisdictions: ['UG', 'KE'],
      affectedSectors: ['Logistics & Freight', 'Agriculture & Food Trade', 'Manufacturing'],
      timeHorizon: '30 DAYS',
      modelUsed: 'ELASTICITY_PASS_THROUGH_SIM_V1',
      createdBy: 'usr_admin_01',
      mutatesRealRecords: false,
    };
    db.economicScenarios.set(scen.id, scen);

    const simRes: ScenarioSimulationResult = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-SCENARIO-ENGINE'),
      id: 'SIMRES-EAC-TRANSPORT-01',
      scenarioId: scen.id,
      label: 'SIMULATED_SCENARIO',
      baselineComparison: [
        { metric: 'Northern Corridor Freight Rate', baselineValue: 111, simulatedValue: 138.75, deltaPct: 25, unit: 'USD/MT' },
        { metric: 'Estimated Landed Maize Wholesale Equivalent', baselineValue: 1385, simulatedValue: 1420, deltaPct: 2.52, unit: 'UGX/KG' },
        { metric: 'Industrial Input Margin Pressure', baselineValue: 100, simulatedValue: 96.6, deltaPct: -3.4, unit: 'INDEX' },
      ],
      alternativeComparisons: [
        { caseName: 'Baseline (0% shock)', shockPct: 0, projectedImpactPct: 0, projectedValue: 111 },
        { caseName: 'Scenario A: Transport +10%', shockPct: 10, projectedImpactPct: 10, projectedValue: 122.1 },
        { caseName: 'Scenario B: Transport +25%', shockPct: 25, projectedImpactPct: 25, projectedValue: 138.75 },
        { caseName: 'Scenario C: Transport -10%', shockPct: -10, projectedImpactPct: -10, projectedValue: 99.9 },
      ],
      uncertaintyRangePct: [-1.2, 4.1],
      affectedCorridors: ['Northern Corridor (Mombasa–Malaba–Kampala)'],
      alternativeRoutesOrSuppliers: ['Busia OSBP alternate crossing', 'Tororo rail-freight transshipment'],
      estimatedRecoveryPeriodDays: 21,
      dataGaps: ['Live Kenyan rail capacity utilization feed not connected locally.'],
      limitations: ['SIMULATED_SCENARIO output; assumes constant consumer demand elasticity.'],
      reproducibleSeedHash: sha256Hex('SCEN-EAC-TRANSPORT-SHOCK-01|25|111|1385'),
      generatedAt: now,
    };
    db.scenarioSimulationResults.set(simRes.id, simRes);
  }

  // 18. businessImpactSimulations (strictly tenant-isolated!)
  if (db.businessImpactSimulations.size === 0) {
    const bizSims: BusinessImpactSimulation[] = [
      {
        ...baseMeta('TEN-UG-ELGON-01', 'UG', 'V12-BIZ-SIMULATOR', 'TENANT_PRIVATE'),
        id: 'BIZSIM-ELGON-01',
        businessName: 'Uganda Arabica Exporters Cooperative Union',
        label: 'SIMULATED_SCENARIO',
        inputAssumptions: {
          supplierCostDeltaPct: 8,
          productDemandDeltaPct: 5,
          fxExposureDeltaPct: 2,
          inventoryCostDeltaPct: 4,
          transportExpenseDeltaPct: 12,
          payrollDeltaPct: 3,
          currency: 'UGX',
        },
        baselineMetrics: {
          monthlyRevenue: 240000000,
          monthlyOperatingCost: 185000000,
          monthlyNetMargin: 55000000,
          sourceRecordCount: 4,
        },
        projectedScenarios: {
          bestCase: { projectedRevenue: 264000000, projectedCost: 194000000, netMargin: 70000000, cashPressure: 'LOW' },
          baseCase: { projectedRevenue: 252000000, projectedCost: 199800000, netMargin: 52200000, cashPressure: 'MODERATE' },
          stressCase: { projectedRevenue: 228000000, projectedCost: 210900000, netMargin: 17100000, cashPressure: 'HIGH' },
        },
        uncertaintyNotes: 'SIMULATED_SCENARIO decision-support estimate scoped strictly to TEN-UG-ELGON-01.',
        recommendedManagementActions: [
          'Hedge freight surcharge risk by consolidating outbound 30T export lots.',
          'Review cooperative dry-parchment buffer stock.',
        ],
        disclaimer: 'Decision-support simulation only; does not guarantee future cooperative financial performance.',
        createdBy: 'usr_coop_01',
      },
      {
        ...baseMeta('TEN-KE-ROASTERS-03', 'KE', 'V12-BIZ-SIMULATOR', 'TENANT_PRIVATE'),
        id: 'BIZSIM-KE-ROASTERS-01',
        businessName: 'Nairobi Specialty Roasters & Blenders Ltd',
        label: 'SIMULATED_SCENARIO',
        inputAssumptions: {
          supplierCostDeltaPct: 10,
          productDemandDeltaPct: 6,
          fxExposureDeltaPct: -3,
          inventoryCostDeltaPct: 5,
          transportExpenseDeltaPct: 15,
          payrollDeltaPct: 4,
          currency: 'KES',
        },
        baselineMetrics: {
          monthlyRevenue: 14500000,
          monthlyOperatingCost: 11200000,
          monthlyNetMargin: 3300000,
          sourceRecordCount: 3,
        },
        projectedScenarios: {
          bestCase: { projectedRevenue: 15900000, projectedCost: 11760000, netMargin: 4140000, cashPressure: 'LOW' },
          baseCase: { projectedRevenue: 15370000, projectedCost: 12320000, netMargin: 3050000, cashPressure: 'MODERATE' },
          stressCase: { projectedRevenue: 13800000, projectedCost: 13104000, netMargin: 696000, cashPressure: 'HIGH' },
        },
        uncertaintyNotes: 'SIMULATED_SCENARIO confidential to TEN-KE-ROASTERS-03; cross-tenant visibility denied.',
        recommendedManagementActions: [
          'Evaluate multi-currency escrow settlement in KES/UGX to cushion short-term FX swings.',
        ],
        disclaimer: 'Decision-support simulation only; not an audited accounting statement.',
        createdBy: 'usr_buyer_02',
      },
    ];
    bizSims.forEach((b) => db.businessImpactSimulations.set(b.id, b));
  }

  // 19. economicRecommendations
  if (db.economicRecommendations.size === 0) {
    const recs: EconomicRecommendation[] = [
      {
        ...baseMeta('TEN-UG-ROOFINGS-02', 'UG', 'EWR-V12-2026-01', 'TENANT_PRIVATE'),
        id: 'REC-V12-FREIGHT-01',
        targetParticipantId: 'TEN-UG-ROOFINGS-02',
        targetParticipantName: 'Roofings Rolling Mills Ltd (Namanve Industrial Park)',
        recommendationType: 'ALTERNATIVE_FREIGHT',
        sourceIntelligenceIds: ['EWR-V12-2026-01', 'ANOM-2026-FREIGHT-01'],
        explanation: 'Northern Corridor freight costs rose +5.71% with elevated dwell-time signals.',
        expectedBenefit: 'Potential 18–30 hour transit lead-time reduction via alternate verified carrier/border routing.',
        potentialRisk: 'Alternate border crossing may carry different customs inspection shift hours.',
        requiredPermissions: ['OPERATIONS_MANAGER', 'LOGISTICS_COORDINATOR'],
        recommendedAction: 'Review verified carrier bids on Busia OSBP & Tororo dry-port rail corridor.',
        confidence: 'MODERATE',
        expiresAt: '2026-12-20T23:59:59.000Z',
        requiresHumanApproval: true,
        approvalStatus: 'GENERATED',
        autoExecutionProhibited: true,
      },
      {
        ...baseMeta('TEN-UG-ELGON-01', 'UG', 'OPP-V12-EXPORT-02', 'TENANT_PRIVATE'),
        id: 'REC-V12-EXPORT-02',
        targetParticipantId: 'TEN-UG-ELGON-01',
        targetParticipantName: 'Uganda Arabica Exporters Cooperative Union',
        recommendationType: 'PROCUREMENT_OPPORTUNITY',
        sourceIntelligenceIds: ['OPP-V12-EXPORT-02', 'FC12-UG-MAIZE-30D'],
        explanation: 'Specialty roaster demand in KE aligns with cooperative parchment stock availability.',
        expectedBenefit: 'Forward contract stabilizes cooperative revenue prior to seasonal freight cost increases.',
        potentialRisk: 'Requires strict <=12.0% moisture quality compliance and EAC Origin docs.',
        requiredPermissions: ['TENANT_ADMIN', 'PROCUREMENT_LEAD'],
        recommendedAction: 'Prepare non-binding quotation in Commercial Workspace for human signatory review.',
        confidence: 'HIGH',
        expiresAt: '2026-12-30T23:59:59.000Z',
        requiresHumanApproval: true,
        approvalStatus: 'UNDER_REVIEW',
        autoExecutionProhibited: true,
      },
    ];
    recs.forEach((r) => db.economicRecommendations.set(r.id, r));
  }

  // 21. intelligenceAgentPolicies (All 15 Specialist Agents from V12 §17!)
  if (db.intelligenceAgentPolicies.size === 0) {
    const agentSpecs: {
      code: string;
      name: string;
      type: IntelligenceAgentPolicy['agentType'];
      purpose: string;
      maxLevel: 1 | 2 | 3 | 4;
      scope: IntelligenceAgentPolicy['authorizedDataScope'];
    }[] = [
      { code: 'AGT-V12-01', name: 'Global Economic Research Agent', type: 'GLOBAL_ECONOMIC_RESEARCH', purpose: 'Synthesize multi-country macroeconomic & sectoral indicators with strict provenance citations.', maxLevel: 2, scope: ['PUBLIC', 'RESTRICTED'] },
      { code: 'AGT-V12-02', name: 'Market Intelligence Agent', type: 'MARKET_INTELLIGENCE', purpose: 'Analyze regional market demand, wholesale-farmgate spreads, and buyer-seller liquidity.', maxLevel: 3, scope: ['PUBLIC', 'RESTRICTED', 'TENANT_PRIVATE'] },
      { code: 'AGT-V12-03', name: 'Commodity Intelligence Agent', type: 'COMMODITY_INTELLIGENCE', purpose: 'Track commodity price trends, grade differentials, and storage inventories.', maxLevel: 2, scope: ['PUBLIC', 'RESTRICTED'] },
      { code: 'AGT-V12-04', name: 'Currency Intelligence Agent', type: 'CURRENCY_INTELLIGENCE', purpose: 'Monitor indicative FX curves, settlement corridor spreads, and currency exposure.', maxLevel: 2, scope: ['PUBLIC', 'RESTRICTED', 'INSTITUTION_PRIVATE'] },
      { code: 'AGT-V12-05', name: 'Trade Intelligence Agent', type: 'TRADE_INTELLIGENCE', purpose: 'Evaluate cross-border EAC & AfCFTA trade flows, customs readiness, and tariff rules.', maxLevel: 3, scope: ['PUBLIC', 'RESTRICTED', 'TENANT_PRIVATE'] },
      { code: 'AGT-V12-06', name: 'Logistics Intelligence Agent', type: 'LOGISTICS_INTELLIGENCE', purpose: 'Diagnose corridor bottlenecks, freight tariff movements, and alternative carrier options.', maxLevel: 3, scope: ['PUBLIC', 'RESTRICTED', 'TENANT_PRIVATE'] },
      { code: 'AGT-V12-07', name: 'Industrial Intelligence Agent', type: 'INDUSTRIAL_INTELLIGENCE', purpose: 'Assess factory utilization rates, raw feedstock gaps, and processing capacity.', maxLevel: 3, scope: ['PUBLIC', 'RESTRICTED', 'TENANT_PRIVATE'] },
      { code: 'AGT-V12-08', name: 'Business Intelligence Agent', type: 'BUSINESS_INTELLIGENCE', purpose: 'Analyze tenant-private commercial cashflow, cost drivers, and business resilience.', maxLevel: 3, scope: ['TENANT_PRIVATE'] },
      { code: 'AGT-V12-09', name: 'Procurement Intelligence Agent', type: 'PROCUREMENT_INTELLIGENCE', purpose: 'Match prequalified suppliers against procurement RFQs with explainable evidence.', maxLevel: 3, scope: ['PUBLIC', 'RESTRICTED', 'TENANT_PRIVATE'] },
      { code: 'AGT-V12-10', name: 'Risk Intelligence Agent', type: 'RISK_INTELLIGENCE', purpose: 'Classify anomalies, velocity spikes, and compliance review flags without automated accusation.', maxLevel: 3, scope: ['RESTRICTED', 'TENANT_PRIVATE', 'CONFIDENTIAL'] },
      { code: 'AGT-V12-11', name: 'Early Warning Agent', type: 'EARLY_WARNING', purpose: 'Monitor emerging supply, climate, energy, and corridor risks and escalate human review.', maxLevel: 3, scope: ['PUBLIC', 'RESTRICTED', 'INSTITUTION_PRIVATE'] },
      { code: 'AGT-V12-12', name: 'Economic Forecasting Agent', type: 'ECONOMIC_FORECASTING', purpose: 'Orchestrate statistical forecast generation, confidence intervals, and backtest evaluation.', maxLevel: 2, scope: ['PUBLIC', 'RESTRICTED'] },
      { code: 'AGT-V12-13', name: 'Scenario Simulation Agent', type: 'SCENARIO_SIMULATION', purpose: 'Execute isolated what-if shock simulations labeled SIMULATED_SCENARIO.', maxLevel: 2, scope: ['PUBLIC', 'TENANT_PRIVATE'] },
      { code: 'AGT-V12-14', name: 'Data Quality Agent', type: 'DATA_QUALITY', purpose: 'Audit source freshness, duplicate rejections, schema drift, and data poisoning safeguards.', maxLevel: 2, scope: ['PUBLIC', 'RESTRICTED'] },
      { code: 'AGT-V12-15', name: 'Economic Coordination Agent', type: 'ECONOMIC_COORDINATION', purpose: 'Convert approved intelligence into human-gated operational recommendations.', maxLevel: 4, scope: ['TENANT_PRIVATE', 'RESTRICTED'] },
    ];

    agentSpecs.forEach((a) => {
      const policy: IntelligenceAgentPolicy = {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-AGENT-GOVERNANCE'),
        id: a.code,
        agentCode: a.code,
        agentName: a.name,
        agentType: a.type,
        purpose: a.purpose,
        authorizedDataScope: a.scope,
        inputSchemaDescription: '{ tenantId, jurisdiction, prompt, contextScope }',
        outputSchemaDescription: '{ answer, citedSourceIds, confidence, limitations, distinguishedFactsVsForecasts }',
        modelDependency: 'gemini-4-hydrogen / CALIBRATED_DETERMINISTIC_INTELLIGENCE_V12',
        maxAutonomyLevelAllowed: a.maxLevel,
        executionRateLimitPerHour: 120,
        humanEscalationRule: 'Level 3+ consequential proposals require human review; Level 5 high-impact financial/institutional actions strictly require dual human authorization and can never be self-authorized by AI.',
        emergencyCircuitBreakerActive: false,
        totalRunsCount: a.code === 'AGT-V12-01' ? 1 : 0,
      };
      db.intelligenceAgentPolicies.set(policy.id, policy);
    });
  }

  // 20. intelligenceAgentRuns
  if (db.intelligenceAgentRuns.size === 0) {
    const run1: IntelligenceAgentRun = {
      ...baseMeta('TEN-UG-ELGON-01', 'UG', 'AGT-V12-01', 'TENANT_PRIVATE'),
      id: 'AGTRUN-V12-001',
      agentId: 'AGT-V12-01',
      agentType: 'GLOBAL_ECONOMIC_RESEARCH',
      requestedAction: 'SUMMARIZE_UGANDA_CORRIDOR_INTELLIGENCE',
      autonomyLevel: 1,
      promptSummary: 'Summarize current Uganda maize prices, Arabica exports, and corridor risks.',
      citedSourceIds: ['SRC-UG-MARKET-MONITORS', 'SRC-AROS-MARKET-LEDGER', 'SRC-CORRIDOR-RECTS-REF'],
      citedRecordsCount: 3,
      distinguishedFactsVsForecasts: true,
      promptInjectionStatus: 'CLEAN',
      outputValidationStatus: 'PASSED',
      humanEscalationRequired: false,
      dualAuthorizationRequired: false,
      approvers: [],
      executionStatus: 'COMPLETED',
      responseText: 'Observed: UG Grade-1 Maize wholesale stands at 1,385 UGX/KG (November 2026). Statistical Forecast: 30-day Holt trend projects 1,428 UGX/KG (HIGH confidence, 90% interval 1,379–1,477). Northern Corridor freight feed is currently marked STALE.',
      limitationsDisclosed: ['Corridor telemetry >72h old', 'Utility grid indicator UNAVAILABLE'],
      durationMs: 42,
      modelDependency: 'CALIBRATED_DETERMINISTIC_INTELLIGENCE_V12',
    };
    db.intelligenceAgentRuns.set(run1.id, run1);
  }

  // 22. modelDriftEvents
  if (db.modelDriftEvents.size === 0) {
    const drift: ModelDriftEvent = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-DRIFT-MONITOR'),
      id: 'DRIFT-2026-DEV-01',
      modelId: 'MDL-EXP-GRADIENT-DEV-V0',
      modelVersion: '0.4.2-dev',
      driftType: 'ACCURACY_DETERIORATION',
      severity: 'MODERATE',
      metricBefore: 2.1,
      metricAfter: 4.1,
      affectedForecastIds: [],
      fallbackModelId: 'MDL-STAT-MA-BASE-V1',
      modelMarkedDegraded: true,
      adminNotified: true,
      restorationReviewStatus: 'PENDING_REVIEW',
      detectedAt: now,
    };
    db.modelDriftEvents.set(drift.id, drift);
  }

  // 23. intelligenceAuditEvents
  if (db.intelligenceAuditEvents.size === 0) {
    const audit: IntelligenceAuditEvent = {
      id: 'IAUD-V12-SEED-01',
      timestamp: now,
      tenantId: 'GLOBAL_PUBLIC',
      jurisdiction: 'EAC',
      actorId: 'system-v12-migrator',
      actorRole: 'PLATFORM_ADMIN',
      actionType: 'MIGRATION_EVENT',
      entityType: 'DATABASE_SCHEMA',
      entityId: 'schema-v12',
      details: 'Initialized V12 Global Economic Intelligence baseline collections non-destructively.',
      inputHash: sha256Hex('schema-v12-init'),
      tamperHash: sha256Hex(`IAUD-V12-SEED-01|${now}|schema-v12`),
    };
    db.intelligenceAuditEvents.set(audit.id, audit);
  }

  // 24. intelligenceSubscriptions (5 proposed commercial intelligence tiers — zero fabricated revenue/customers)
  if (db.intelligenceSubscriptions.size === 0) {
    const tiers: IntelligenceSubscriptionProduct[] = [
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-COMMERCIAL-CATALOG'),
        id: 'SUB-TIER-STARTER',
        tierCode: 'INTELLIGENCE_STARTER',
        tierName: 'Intelligence Starter',
        isProposedTier: true,
        targetAudience: 'Smallholder cooperatives, individual traders, and emerging MSMEs',
        includedCapabilities: ['Basic economic indicators', 'Limited market insights', 'Basic alerts', 'Standard reports'],
        apiCallsLimitPerMonth: 5000,
        customForecastQuotaPerMonth: 25,
        configurablePricingByJurisdiction: {
          UG: { currency: 'UGX', monthlyFee: 95000, annualFee: 950000 },
          KE: { currency: 'KES', monthlyFee: 3500, annualFee: 35000 },
          GLOBAL: { currency: 'USD', monthlyFee: 29, annualFee: 290 },
        },
        licensingAndUsageRestrictions: 'Internal decision-support use only. Redistribution or resale of raw platform data prohibited.',
        permitsConfidentialResale: false,
        status: 'PROPOSED_CATALOG_ITEM',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-COMMERCIAL-CATALOG'),
        id: 'SUB-TIER-BUSINESS',
        tierCode: 'INTELLIGENCE_BUSINESS',
        tierName: 'Intelligence Business',
        isProposedTier: true,
        targetAudience: 'Commercial buyers, agro-processors, and regional distributors',
        includedCapabilities: ['Business-specific forecasts', 'Market demand analysis', 'Supplier & procurement intelligence', 'Business scenario simulation', 'Operational alerts'],
        apiCallsLimitPerMonth: 50000,
        customForecastQuotaPerMonth: 250,
        configurablePricingByJurisdiction: {
          UG: { currency: 'UGX', monthlyFee: 450000, annualFee: 4500000 },
          KE: { currency: 'KES', monthlyFee: 16500, annualFee: 165000 },
          GLOBAL: { currency: 'USD', monthlyFee: 129, annualFee: 1290 },
        },
        licensingAndUsageRestrictions: 'Tenant-scoped analytics; tenant retains full ownership of proprietary business records.',
        permitsConfidentialResale: false,
        status: 'PROPOSED_CATALOG_ITEM',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-COMMERCIAL-CATALOG'),
        id: 'SUB-TIER-ENTERPRISE',
        tierCode: 'INTELLIGENCE_ENTERPRISE',
        tierName: 'Intelligence Enterprise',
        isProposedTier: true,
        targetAudience: 'Manufacturers, multi-site corporations, and corridor logistics operators',
        includedCapabilities: ['Advanced forecasting', 'Multi-location intelligence', 'Industrial & supply-chain analysis', 'Custom reports', 'Advanced scenario simulation', 'Enterprise access controls'],
        apiCallsLimitPerMonth: 250000,
        customForecastQuotaPerMonth: 1500,
        configurablePricingByJurisdiction: {
          UG: { currency: 'UGX', monthlyFee: 1650000, annualFee: 16500000 },
          KE: { currency: 'KES', monthlyFee: 59000, annualFee: 590000 },
          GLOBAL: { currency: 'USD', monthlyFee: 449, annualFee: 4490 },
        },
        licensingAndUsageRestrictions: 'Enterprise RBAC & ABAC boundaries enforced; cross-tenant confidential data never exposed.',
        permitsConfidentialResale: false,
        status: 'PROPOSED_CATALOG_ITEM',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-COMMERCIAL-CATALOG'),
        id: 'SUB-TIER-INSTITUTIONAL',
        tierCode: 'INTELLIGENCE_INSTITUTIONAL',
        tierName: 'Intelligence Institutional',
        isProposedTier: true,
        targetAudience: 'Banks, development institutions, trade chambers, and public agencies',
        includedCapabilities: ['Authorized regional economic intelligence', 'Institutional data integration', 'Advanced economic observatory', 'Custom analytical models', 'Sovereign data controls', 'Institutional reporting'],
        apiCallsLimitPerMonth: 1000000,
        customForecastQuotaPerMonth: 5000,
        configurablePricingByJurisdiction: {
          UG: { currency: 'UGX', monthlyFee: 7500000, annualFee: 75000000 },
          GLOBAL: { currency: 'USD', monthlyFee: 1990, annualFee: 19900 },
        },
        licensingAndUsageRestrictions: 'Subject to jurisdictional data sovereignty policy & re-identification safeguards.',
        permitsConfidentialResale: false,
        status: 'PROPOSED_CATALOG_ITEM',
      },
      {
        ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-COMMERCIAL-CATALOG'),
        id: 'SUB-TIER-DEVELOPER',
        tierCode: 'INTELLIGENCE_DEVELOPER',
        tierName: 'Intelligence Developer',
        isProposedTier: true,
        targetAudience: 'Fintech, ERP, and supply-chain software integrators',
        includedCapabilities: ['Authorized intelligence APIs', 'Data subscription management', 'Forecast endpoints', 'Usage metering', 'Developer documentation'],
        apiCallsLimitPerMonth: 500000,
        customForecastQuotaPerMonth: 1000,
        configurablePricingByJurisdiction: {
          UG: { currency: 'UGX', monthlyFee: 350000, annualFee: 3500000 },
          GLOBAL: { currency: 'USD', monthlyFee: 99, annualFee: 990 },
        },
        licensingAndUsageRestrictions: 'API consumer must preserve attribution, source classification, and forecast limitations.',
        permitsConfidentialResale: false,
        status: 'PROPOSED_CATALOG_ITEM',
      },
    ];
    tiers.forEach((t) => db.intelligenceSubscriptions.set(t.id, t));
  }

  // 25. intelligenceReports
  if (db.intelligenceReports.size === 0) {
    const rep: IntelligenceReport = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'V12-REPORT-ENGINE'),
      id: 'RPT-V12-2026-Q4-EAC',
      reportTitle: 'Uganda & EAC Multi-Sector Economic Intelligence Baseline Brief (Nov 2026)',
      reportType: 'REGIONAL_BRIEF',
      sectors: ['Agriculture & Food Trade', 'Manufacturing', 'Logistics & Freight', 'Currency & Financial Infrastructure'],
      timeRange: '2026-06 to 2026-11',
      summary: 'Observed wholesale grain prices climbed +17.4% since June 2026 while industrial utilization reached 74.1%. Northern Corridor freight telemetry exhibits a >72h freshness warning.',
      keyFindings: [
        'OBSERVED: Uganda Grade-1 maize averaged 1,385 UGX/KG in Nov 2026 (SRC-UG-MARKET-MONITORS).',
        'FORECAST: Holt exponential smoothing projects 1,428 UGX/KG over 30 days (HIGH confidence, 90% PI: 1,379–1,477).',
        'UNAVAILABLE: Industrial power grid feeder reliability and KE SME NPL series remain UNAVAILABLE pending authorized connectors.',
      ],
      sourceReferences: ['SRC-AROS-MARKET-LEDGER', 'SRC-UG-MARKET-MONITORS', 'SRC-BOU-FX-REF', 'SRC-CORRIDOR-RECTS-REF'],
      distinguishesFactsVsForecasts: true,
      generatedBy: 'usr_admin_01',
      exportFormats: ['JSON', 'CSV'],
    };
    db.intelligenceReports.set(rep.id, rep);
  }

  // 26. intelligenceReviewQueue
  if (db.intelligenceReviewQueue.size === 0) {
    const rev: IntelligenceReviewQueueItem = {
      ...baseMeta('GLOBAL_PUBLIC', 'UG', 'V12-REVIEW-QUEUE', 'RESTRICTED'),
      id: 'REVQ-V12-01',
      itemType: 'ANOMALY',
      targetId: 'ANOM-2026-PAYMENT-02',
      title: 'Review repeated settlement retry anomaly on FIN-EXEC-2026-001',
      riskReason: 'Requires human compliance inspection prior to any participant restriction.',
      requestedBy: 'V12-ANOMALY-ENGINE',
      requiredRole: 'COMPLIANCE_AUDITOR',
      dualAuthorizationRequired: false,
      approvalsReceived: [],
      status: 'PENDING_REVIEW',
    };
    db.intelligenceReviewQueue.set(rev.id, rev);
  }

  // 27. intelligencePublicationRecords
  if (db.intelligencePublicationRecords.size === 0) {
    const pub: IntelligencePublicationRecord = {
      ...baseMeta('GLOBAL_PUBLIC', 'EAC', 'RPT-V12-2026-Q4-EAC'),
      id: 'PUB-V12-001',
      artifactType: 'REPORT',
      artifactId: 'RPT-V12-2026-Q4-EAC',
      title: 'Uganda & EAC Multi-Sector Economic Intelligence Baseline Brief (Nov 2026)',
      audienceScope: 'PUBLIC',
      publishedBy: 'usr_admin_01',
      authorizedBy: 'usr_admin_01',
      licensingNotice: 'AETHER–AROS V12 Intelligence Release — Source attribution required; statistical forecasts are not guarantees.',
      publishedAt: now,
      retracted: false,
    };
    db.intelligencePublicationRecords.set(pub.id, pub);
  }
}
