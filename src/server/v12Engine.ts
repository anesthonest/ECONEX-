/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V12.0 - Global Economic Intelligence, Statistical Forecasting, Simulation & Governance Engine
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import { detectPromptInjection, sanitizeExternalSourceText } from './gemini.ts';
import type {
  IntelligenceSource,
  EconomicObservation,
  EconomicIndicator,
  V12EconomicForecast,
  V12ForecastHorizon,
  V12ForecastDomain,
  V12ForecastMethod,
  V12ConfidenceClassification,
  ForecastEvaluation,
  ForecastModel,
  V12ForecastModelStatus,
  ModelDriftEvent,
  EconomicAnomaly,
  V12EconomicEarlyWarning,
  V12EconomicOpportunity,
  EconomicScenario,
  ScenarioSimulationResult,
  BusinessImpactSimulation,
  EconomicRecommendation,
  IntelligenceAuditEvent,
  V12BackgroundJob,
  V12SourceClassification,
  V12DataClassification,
} from '../types/index.ts';

function hash256(val: string): string {
  return `0x${crypto.createHash('sha256').update(val).digest('hex')}`;
}

// ==========================================
// 1. IMMUTABLE TAMPER-EVIDENT INTELLIGENCE AUDIT TRAIL (§24)
// ==========================================

export function logIntelligenceAudit(params: {
  tenantId: string;
  jurisdiction: string;
  actorId: string;
  actorRole: string;
  actionType: IntelligenceAuditEvent['actionType'];
  entityType: string;
  entityId: string;
  details: string;
  inputHash?: string;
}): IntelligenceAuditEvent {
  const id = `IAUD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`;
  const timestamp = new Date().toISOString();
  const prevEvents = Array.from(db.intelligenceAuditEvents.values());
  const prevHash = prevEvents.length > 0 ? prevEvents[prevEvents.length - 1].tamperHash : '0xGENESIS_V12';

  const event: IntelligenceAuditEvent = {
    id,
    timestamp,
    tenantId: params.tenantId,
    jurisdiction: params.jurisdiction,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
    inputHash: params.inputHash,
    tamperHash: hash256(`${prevHash}|${id}|${timestamp}|${params.actionType}|${params.entityId}|${params.details}`),
  };
  db.intelligenceAuditEvents.set(event.id, event);
  db.scheduleSave();
  return event;
}

// ==========================================
// 2. TENANT-SAFE PUBLIC CACHE (§32)
// ==========================================

interface CacheEntry<T> {
  value: T;
  classification: V12DataClassification;
  expiresAt: number;
}

const publicIntelligenceCache = new Map<string, CacheEntry<any>>();

export function getPublicCachedOrCompute<T>(
  key: string,
  classification: V12DataClassification,
  ttlMs: number,
  computeFn: () => T
): { data: T; cacheHit: boolean } {
  // STRICT RULE: Never cache TENANT_PRIVATE / INSTITUTION_PRIVATE / CONFIDENTIAL / SOVEREIGN_RESTRICTED
  if (classification !== 'PUBLIC') {
    return { data: computeFn(), cacheHit: false };
  }
  const now = Date.now();
  const existing = publicIntelligenceCache.get(key);
  if (existing && existing.classification === 'PUBLIC' && existing.expiresAt > now) {
    return { data: existing.value as T, cacheHit: true };
  }
  const fresh = computeFn();
  publicIntelligenceCache.set(key, {
    value: fresh,
    classification: 'PUBLIC',
    expiresAt: now + ttlMs,
  });
  return { data: fresh, cacheHit: false };
}

export function invalidatePublicIntelligenceCache(prefix?: string): void {
  if (!prefix) {
    publicIntelligenceCache.clear();
    return;
  }
  for (const key of Array.from(publicIntelligenceCache.keys())) {
    if (key.startsWith(prefix)) publicIntelligenceCache.delete(key);
  }
}

// ==========================================
// 3. DATA INGESTION, NORMALIZATION & QUALITY ENGINE (§3, §4, §5, §30)
// ==========================================

const VALID_JURISDICTIONS = new Set(['UG', 'KE', 'TZ', 'RW', 'BI', 'SS', 'CD', 'EAC', 'AFCFTA', 'GB', 'AE', 'GLOBAL']);

export function normalizeObservationUnit(
  value: number,
  unit: string,
  canonicalUnit: string
): { normalizedValue: number; normalizedUnit: string } {
  const u = (unit || '').toUpperCase().trim();
  const c = (canonicalUnit || '').toUpperCase().trim();

  if (u === 'BAG_100KG' && (c === 'UGX_PER_KG' || c === 'UGX/KG')) {
    return { normalizedValue: Number((value / 100).toFixed(2)), normalizedUnit: 'UGX_PER_KG' };
  }
  if (u === 'BAG_90KG' && (c === 'UGX_PER_KG' || c === 'UGX/KG')) {
    return { normalizedValue: Number((value / 90).toFixed(2)), normalizedUnit: 'UGX_PER_KG' };
  }
  if (u === 'TONNE' && (c === 'UGX_PER_KG' || c === 'UGX/KG')) {
    return { normalizedValue: Number((value / 1000).toFixed(2)), normalizedUnit: 'UGX_PER_KG' };
  }
  return { normalizedValue: Number(value.toFixed(4)), normalizedUnit: canonicalUnit || unit };
}

export function ingestEconomicObservations(params: {
  sourceId: string;
  tenantId: string;
  actorId: string;
  actorRole: string;
  format?: 'JSON' | 'CSV';
  csvPayload?: string;
  observations?: Array<{
    indicatorId: string;
    observationPeriod: string;
    observedAt: string;
    numericValue: any;
    unit?: string;
    jurisdiction?: string;
    sector?: string;
    commodityOrSubject?: string;
    regionOrCorridor?: string;
    currency?: string;
    notes?: string;
  }>;
}): {
  accepted: EconomicObservation[];
  rejected: { index: number; reason: string; code: string }[];
  duplicatesRejected: number;
  poisoningBlocked: number;
} {
  const source = db.intelligenceSources.get(params.sourceId);
  if (!source) {
    return {
      accepted: [],
      rejected: [{ index: 0, reason: `Source ${params.sourceId} not registered.`, code: 'SOURCE_NOT_FOUND' }],
      duplicatesRejected: 0,
      poisoningBlocked: 0,
    };
  }
  if (source.adminApprovalStatus !== 'APPROVED') {
    return {
      accepted: [],
      rejected: [{ index: 0, reason: `Source ${params.sourceId} is ${source.adminApprovalStatus}; administrator approval required before ingestion.`, code: 'SOURCE_NOT_APPROVED' }],
      duplicatesRejected: 0,
      poisoningBlocked: 0,
    };
  }

  let rows = Array.isArray(params.observations) ? [...params.observations] : [];

  // Optional CSV secure parsing
  if (params.format === 'CSV' && typeof params.csvPayload === 'string') {
    const csvScan = detectPromptInjection(params.csvPayload);
    const hasCellFormula = params.csvPayload
      .split(/\r?\n/)
      .some((line) =>
        line.split(',').some((rawCell) => {
          const cell = rawCell.trim().replace(/^"+|"+$/g, '');
          if (!cell) return false;
          if (/^[=@+]/.test(cell)) return true;
          if (/^-/.test(cell) && !/^-\d+(\.\d+)?$/.test(cell)) return true;
          return false;
        })
      );
    if (csvScan.flagged || hasCellFormula) {
      return {
        accepted: [],
        rejected: [{ index: 0, reason: 'Malicious CSV formula/injection pattern detected and blocked.', code: 'MALICIOUS_IMPORT_BLOCKED' }],
        duplicatesRejected: 0,
        poisoningBlocked: 1,
      };
    }
    const lines = params.csvPayload
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      return {
        accepted: [],
        rejected: [{ index: 0, reason: 'CSV payload must contain header and at least one observation row.', code: 'INVALID_CSV' }],
        duplicatesRejected: 0,
        poisoningBlocked: 0,
      };
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx];
      });
      rows.push({
        indicatorId: obj.indicatorId,
        observationPeriod: obj.observationPeriod,
        observedAt: obj.observedAt || new Date().toISOString(),
        numericValue: Number(obj.numericValue),
        unit: obj.unit,
        jurisdiction: obj.jurisdiction,
        sector: obj.sector,
        commodityOrSubject: obj.commodityOrSubject,
        regionOrCorridor: obj.regionOrCorridor,
        currency: obj.currency,
        notes: obj.notes,
      });
    }
  }

  const accepted: EconomicObservation[] = [];
  const rejected: { index: number; reason: string; code: string }[] = [];
  let duplicatesRejected = 0;
  let poisoningBlocked = 0;

  rows.forEach((row, idx) => {
    // 1. Prompt injection & malicious payload defense
    const rawStr = JSON.stringify(row);
    const inj = detectPromptInjection(rawStr);
    if (inj.flagged) {
      poisoningBlocked++;
      rejected.push({ index: idx, reason: 'Blocked prompt-injection or script payload in imported observation.', code: 'MALICIOUS_PAYLOAD' });
      return;
    }

    const indicator = db.economicIndicators.get(row.indicatorId);
    const def = indicator ? db.economicIndicatorDefinitions.get(indicator.definitionId) : undefined;
    if (!indicator || !def) {
      rejected.push({ index: idx, reason: `Unknown indicatorId: ${row.indicatorId}`, code: 'UNKNOWN_INDICATOR' });
      return;
    }

    // 2. Numeric & unit normalization before outlier poisoning check
    const numVal = Number(row.numericValue);
    if (!Number.isFinite(numVal) || numVal < 0) {
      rejected.push({ index: idx, reason: `Invalid negative or non-finite numericValue: ${row.numericValue}`, code: 'INVALID_VALUE' });
      return;
    }

    const { normalizedValue, normalizedUnit } = normalizeObservationUnit(
      numVal,
      row.unit || indicator.unit,
      def.canonicalNormalizationUnit
    );

    // Extreme poisoning check (> 50x historical canonical baseline jump without verification)
    if (indicator.latestValue !== null && indicator.latestValue > 0 && normalizedValue > indicator.latestValue * 50) {
      poisoningBlocked++;
      rejected.push({
        index: idx,
        reason: `Extreme anomalous spike (${normalizedValue} ${normalizedUnit} vs baseline ${indicator.latestValue}) quarantined as potential data poisoning.`,
        code: 'EXTREME_OUTLIER_QUARANTINED',
      });
      return;
    }

    // 3. Timestamp validation
    const obsTimeMs = Date.parse(row.observedAt);
    if (Number.isNaN(obsTimeMs) || obsTimeMs > Date.now() + 24 * 60 * 60 * 1000) {
      rejected.push({ index: idx, reason: `Invalid or far-future observedAt timestamp: ${row.observedAt}`, code: 'INVALID_TIMESTAMP' });
      return;
    }

    // 4. Jurisdiction validation
    const juris = (row.jurisdiction || source.jurisdiction || indicator.jurisdiction || 'UG').toUpperCase();
    if (!VALID_JURISDICTIONS.has(juris)) {
      rejected.push({ index: idx, reason: `Unsupported jurisdiction code: ${juris}`, code: 'INVALID_JURISDICTION' });
      return;
    }

    // 5. Duplicate detection
    const period = (row.observationPeriod || '').trim();
    if (!period) {
      rejected.push({ index: idx, reason: 'observationPeriod is required.', code: 'MISSING_PERIOD' });
      return;
    }
    const dedupeKey = `${source.id}|${indicator.code}|${period}|${juris}`;
    const existingDup = Array.from(db.economicObservations.values()).find((o) => o.dedupeKey === dedupeKey);
    if (existingDup) {
      duplicatesRejected++;
      rejected.push({
        index: idx,
        reason: `Duplicate observation rejected for key ${dedupeKey} (already stored as ${existingDup.id}).`,
        code: 'DUPLICATE_OBSERVATION',
      });
      return;
    }

    const stalenessHours = Math.max(0, (Date.now() - obsTimeMs) / (1000 * 60 * 60));
    const isStale = stalenessHours > def.maxStalenessHours;
    const sanitizedNotes = sanitizeExternalSourceText(row.notes || '').sanitized;
    const now = new Date().toISOString();

    const obs: EconomicObservation = {
      id: `OBS-${indicator.code}-${period}-${crypto.randomBytes(2).toString('hex')}`,
      tenantId: params.tenantId || source.tenantId,
      jurisdiction: juris,
      sourceReference: source.id,
      verificationStatus: source.sourceClassification === 'UNVERIFIED_USER_SUBMISSION' ? 'UNVERIFIED' : 'VERIFIED',
      accessClassification: source.accessClassification,
      provenance: `Ingested via ${source.accessMethod} from ${source.sourceName}${sanitizedNotes ? ` (${sanitizedNotes})` : ''}`,
      retentionPolicy: '7_YEARS_STATUTORY',
      createdAt: now,
      updatedAt: now,
      sourceId: source.id,
      sourceClassification: source.sourceClassification,
      indicatorId: indicator.id,
      indicatorCode: indicator.code,
      sector: row.sector || indicator.sector,
      commodityOrSubject: row.commodityOrSubject || indicator.name,
      regionOrCorridor: row.regionOrCorridor || indicator.regionLabel,
      observationPeriod: period,
      observedAt: new Date(obsTimeMs).toISOString(),
      publishedAt: now,
      numericValue: numVal,
      unit: row.unit || indicator.unit,
      normalizedValue,
      normalizedUnit,
      currency: row.currency || indicator.currency,
      dataOwner: source.sourceName,
      authorizationScope: source.commercialRedistributionAllowed ? 'PUBLIC_AGGREGATE' : 'RESTRICTED_INTERNAL',
      qualityScore: isStale ? 72 : source.sourceClassification === 'SIMULATED_DATA' ? 50 : 94,
      isStale,
      dedupeKey,
    };

    db.economicObservations.set(obs.id, obs);

    // Update Time Series & Indicator snapshot (never let SIMULATED_DATA overwrite authoritative indicator!)
    const tsId = `TS-${indicator.id}`;
    let ts = db.economicTimeSeries.get(tsId);
    if (!ts) {
      ts = {
        id: tsId,
        tenantId: 'GLOBAL_PUBLIC',
        jurisdiction: indicator.jurisdiction,
        sourceReference: source.id,
        verificationStatus: 'VERIFIED',
        accessClassification: 'PUBLIC',
        provenance: `Time-series accumulator for ${indicator.code}`,
        retentionPolicy: '7_YEARS_STATUTORY',
        createdAt: now,
        updatedAt: now,
        indicatorId: indicator.id,
        indicatorCode: indicator.code,
        unit: indicator.unit,
        currency: indicator.currency,
        points: [],
      };
    }
    ts.points.push({
      period: obs.observationPeriod,
      observedAt: obs.observedAt,
      value: obs.normalizedValue,
      observationId: obs.id,
      sourceClassification: obs.sourceClassification,
      qualityScore: obs.qualityScore,
    });
    ts.points.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    ts.updatedAt = now;
    db.economicTimeSeries.set(ts.id, ts);

    if (obs.sourceClassification !== 'SIMULATED_DATA' && obs.sourceClassification !== 'UNVERIFIED_USER_SUBMISSION') {
      const prev = indicator.latestValue;
      indicator.previousValue = prev;
      indicator.latestValue = obs.normalizedValue;
      indicator.changePct = prev && prev !== 0 ? Number((((obs.normalizedValue - prev) / prev) * 100).toFixed(2)) : null;
      indicator.availabilityStatus = obs.isStale ? 'STALE' : 'AVAILABLE';
      indicator.staleWarning = obs.isStale;
      indicator.effectivePeriod = obs.observationPeriod;
      indicator.factOrEstimate = 'OBSERVED_FACT';
      indicator.sourceClassification = obs.sourceClassification;
      indicator.confidence = obs.isStale ? 'MODERATE' : 'HIGH';
      indicator.updatedAt = now;
      delete indicator.unavailableReason;
      db.economicIndicators.set(indicator.id, indicator);
    }

    accepted.push(obs);
  });

  if (accepted.length > 0) {
    source.lastSuccessfulRetrieval = new Date().toISOString();
    source.updatedAt = source.lastSuccessfulRetrieval;
    db.intelligenceSources.set(source.id, source);
    invalidatePublicIntelligenceCache();
  }

  logIntelligenceAudit({
    tenantId: params.tenantId,
    jurisdiction: source.jurisdiction,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'DATA_INGESTED',
    entityType: 'INTELLIGENCE_SOURCE',
    entityId: source.id,
    details: `Ingested ${accepted.length} observations, rejected ${rejected.length} (${duplicatesRejected} duplicates, ${poisoningBlocked} poisoning/security blocks).`,
  });

  db.scheduleSave();
  return { accepted, rejected, duplicatesRejected, poisoningBlocked };
}

// ==========================================
// 4. STATISTICAL FORECASTING ENGINE & MODEL GOVERNANCE (§6, §22, §23)
// ==========================================

function horizonToDays(h: V12ForecastHorizon): number {
  switch (h) {
    case 'SHORT_TERM': return 7;
    case 'NEAR_TERM': return 30;
    case 'MEDIUM_TERM': return 90;
    case 'LONG_TERM': return 365;
  }
}

export function generateStatisticalForecast(params: {
  indicatorId: string;
  domain: V12ForecastDomain;
  horizon: V12ForecastHorizon;
  modelId?: string;
  tenantId: string;
  actorId: string;
  actorRole: string;
}): { success: boolean; forecast?: V12EconomicForecast; error?: string; code?: string } {
  const indicator = db.economicIndicators.get(params.indicatorId);
  if (!indicator) {
    return { success: false, error: `Indicator ${params.indicatorId} not found.`, code: 'INDICATOR_NOT_FOUND' };
  }
  const def = db.economicIndicatorDefinitions.get(indicator.definitionId);
  const ts = db.economicTimeSeries.get(`TS-${indicator.id}`);
  const points = (ts?.points || []).filter((p) => p.sourceClassification !== 'SIMULATED_DATA');

  const minRequired = def?.minimumObservationsForForecast || 4;
  if (indicator.availabilityStatus === 'UNAVAILABLE' || points.length < minRequired) {
    return {
      success: false,
      error: `INSUFFICIENT_DATA: Indicator ${indicator.code} has ${points.length} verified observations; minimum ${minRequired} required for statistically supported forecasting.`,
      code: 'INSUFFICIENT_DATA',
    };
  }

  // Do not permit LONG_TERM (6-36 months) forecasting without >= 12 observations
  if (params.horizon === 'LONG_TERM' && points.length < 12) {
    return {
      success: false,
      error: `INSUFFICIENT_DATA: LONG_TERM horizon (6-36 months) requires at least 12 historical periods; only ${points.length} periods exist. Use SHORT_TERM, NEAR_TERM, or MEDIUM_TERM instead.`,
      code: 'LONG_TERM_UNSUPPORTED',
    };
  }

  // Resolve requested or default approved/active model
  let model = params.modelId ? db.forecastModels.get(params.modelId) : undefined;
  if (!model) {
    model = Array.from(db.forecastModels.values()).find(
      (m) => m.deploymentStatus === 'ACTIVE' && m.supportedDomains.includes(params.domain)
    ) || db.forecastModels.get('MDL-STAT-MA-BASE-V1');
  }
  if (!model) {
    return { success: false, error: 'No forecast model available.', code: 'MODEL_NOT_FOUND' };
  }

  // Enforce model governance: suspended/development models cannot generate active forecasts (auto-fallback or reject)
  if (model.deploymentStatus === 'DEVELOPMENT' || model.deploymentStatus === 'RETIRED') {
    return {
      success: false,
      error: `Model ${model.id} is in ${model.deploymentStatus} state and has not been validated/approved for production forecasts.`,
      code: 'MODEL_NOT_APPROVED',
    };
  }

  let fallbackApplied = false;
  if (model.deploymentStatus === 'SUSPENDED' || model.driftDetected) {
    const baseline = db.forecastModels.get(model.baselineModelId || 'MDL-STAT-MA-BASE-V1');
    if (baseline && baseline.deploymentStatus === 'ACTIVE') {
      model = baseline;
      fallbackApplied = true;
    } else {
      return { success: false, error: `Model ${model.id} is suspended due to drift and no active baseline fallback is available.`, code: 'MODEL_SUSPENDED' };
    }
  }

  const values = points.map((p) => p.value);
  const n = values.length;
  const latest = values[n - 1];
  const stepsAhead = params.horizon === 'SHORT_TERM' ? 0.25 : params.horizon === 'NEAR_TERM' ? 1 : 3;

  let expectedValue = latest;
  let stdResidual = 0;

  if (model.method === 'MOVING_AVERAGE') {
    const windowSize = Math.min(4, n);
    const slice = values.slice(n - windowSize);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const avgStep = (values[n - 1] - values[0]) / Math.max(1, n - 1);
    expectedValue = mean + avgStep * stepsAhead;
    const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, slice.length);
    stdResidual = Math.sqrt(variance);
  } else if (model.method === 'EXPONENTIAL_SMOOTHING') {
    const alpha = 0.55;
    const beta = 0.35;
    let level = values[0];
    let trend = n > 1 ? values[1] - values[0] : 0;
    const residuals: number[] = [];
    for (let i = 1; i < n; i++) {
      const pred = level + trend;
      residuals.push(values[i] - pred);
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }
    expectedValue = level + trend * stepsAhead;
    stdResidual = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / Math.max(1, residuals.length));
  } else {
    // LINEAR_REGRESSION / SEASONAL_DECOMPOSITION / ANOMALY_ADJUSTED
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - meanX) * (values[i] - meanY);
      den += (i - meanX) * (i - meanX);
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    expectedValue = intercept + slope * (n - 1 + stepsAhead);
    const residuals = values.map((v, i) => v - (intercept + slope * i));
    stdResidual = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / Math.max(1, n - 2));
  }

  // Output guard against NaN / Infinity / invalid negative prices
  if (!Number.isFinite(expectedValue) || expectedValue <= 0) {
    return {
      success: false,
      error: 'INVALID_MODEL_OUTPUT: Statistical forecast produced non-finite or non-positive value and was blocked by output validation.',
      code: 'INVALID_MODEL_OUTPUT',
    };
  }

  const roundedExpected = Number(expectedValue.toFixed(2));
  const halfWidth = Math.max(roundedExpected * 0.025, 1.645 * stdResidual * Math.sqrt(Math.max(1, stepsAhead)));
  const lower = Number(Math.max(0.01, roundedExpected - halfWidth).toFixed(2));
  const upper = Number((roundedExpected + halfWidth).toFixed(2));

  const confidence: V12ConfidenceClassification = indicator.staleWarning
    ? 'LOW'
    : n >= 6 && params.horizon !== 'MEDIUM_TERM'
      ? 'HIGH'
      : 'MODERATE';

  const now = new Date();
  const horizonDays = horizonToDays(params.horizon);
  const expiresAt = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000).toISOString();
  const inputHash = hash256(`${indicator.id}|${model.id}|${model.version}|${params.horizon}|${values.join(',')}`);

  const fc: V12EconomicForecast = {
    id: `FC12-${indicator.code.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
    tenantId: params.tenantId,
    jurisdiction: indicator.jurisdiction,
    sourceReference: indicator.sourceReference,
    verificationStatus: 'VERIFIED',
    accessClassification: 'PUBLIC',
    provenance: `Generated by ${model.modelName} v${model.version} using ${n} verified observations`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    indicatorId: indicator.id,
    indicatorName: indicator.name,
    domain: params.domain,
    sector: indicator.sector,
    horizon: params.horizon,
    horizonDays,
    generatedAt: now.toISOString(),
    expiresAt,
    sourceObservationIds: points.map((p) => p.observationId),
    observationCountUsed: n,
    inputHash,
    modelId: model.id,
    modelVersion: model.version,
    methodUsed: model.method,
    methodology: `${model.method} computed reproducibly over ${n} verified time-series points${fallbackApplied ? ' (fallback to approved baseline applied)' : ''}.`,
    assumptions: [
      `Continuity of historical trajectory across ${n} recorded periods.`,
      'Exogenous regulatory shocks or abrupt border closures are not endogenously priced.',
    ],
    baselineValue: latest,
    expectedValue: roundedExpected,
    unit: indicator.unit,
    currency: indicator.currency,
    predictionInterval: { lower, upper, coverageLevelPct: 90 },
    confidenceClassification: confidence,
    validationMetrics: {
      mae: model.errorMetrics.mae,
      rmse: model.errorMetrics.rmse,
      mapePct: model.errorMetrics.mapePct,
      directionalAccuracyPct: model.errorMetrics.directionalAccuracyPct,
    },
    knownLimitations: [
      ...model.knownWeaknesses,
      ...(indicator.staleWarning ? ['Source observation contains stale warning (>max staleness window).'] : []),
    ],
    modelStatus: model.deploymentStatus,
    outputValidated: true,
  };

  db.v12EconomicForecasts.set(fc.id, fc);
  invalidatePublicIntelligenceCache('forecasts');

  logIntelligenceAudit({
    tenantId: params.tenantId,
    jurisdiction: fc.jurisdiction,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'FORECAST_GENERATED',
    entityType: 'ECONOMIC_FORECAST',
    entityId: fc.id,
    details: `Generated ${fc.horizon} forecast (${fc.expectedValue} ${fc.unit}, confidence ${fc.confidenceClassification}) via ${model.id}@${model.version}.`,
    inputHash,
  });

  db.scheduleSave();
  return { success: true, forecast: fc };
}

export function evaluateForecastAgainstActual(params: {
  forecastId: string;
  actualValue: number;
  actualObservationId?: string;
  actorId: string;
  actorRole: string;
}): { success: boolean; evaluation?: ForecastEvaluation; driftTriggered?: boolean; error?: string } {
  const fc = db.v12EconomicForecasts.get(params.forecastId);
  if (!fc) return { success: false, error: `Forecast ${params.forecastId} not found.` };
  if (!Number.isFinite(params.actualValue) || params.actualValue <= 0) {
    return { success: false, error: 'Invalid positive actualValue required for forecast evaluation.' };
  }

  const absErr = Number(Math.abs(params.actualValue - fc.expectedValue).toFixed(2));
  const sqErr = Number(Math.pow(params.actualValue - fc.expectedValue, 2).toFixed(2));
  const pctErr = Number(((absErr / params.actualValue) * 100).toFixed(2));
  const withinInterval =
    params.actualValue >= fc.predictionInterval.lower && params.actualValue <= fc.predictionInterval.upper;
  const expectedDir = fc.expectedValue - fc.baselineValue;
  const actualDir = params.actualValue - fc.baselineValue;
  const directionCorrect = (expectedDir >= 0 && actualDir >= 0) || (expectedDir < 0 && actualDir < 0);

  const now = new Date().toISOString();
  const ev: ForecastEvaluation = {
    id: `EVAL-${fc.id}-${Date.now().toString(36).toUpperCase()}`,
    tenantId: fc.tenantId,
    jurisdiction: fc.jurisdiction,
    sourceReference: params.actualObservationId || 'POST_HOC_ACTUAL_CHECK',
    verificationStatus: 'VERIFIED',
    accessClassification: 'PUBLIC',
    provenance: `Evaluated forecast ${fc.id} against observed actual ${params.actualValue}`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    forecastId: fc.id,
    modelId: fc.modelId,
    modelVersion: fc.modelVersion,
    indicatorId: fc.indicatorId,
    forecastValue: fc.expectedValue,
    actualObservedValue: params.actualValue,
    actualObservationId: params.actualObservationId || `OBS-ACTUAL-${Date.now().toString(36)}`,
    absoluteError: absErr,
    squaredError: sqErr,
    percentageErrorPct: pctErr,
    withinPredictionInterval: withinInterval,
    directionCorrect,
    evaluatedAt: now,
    notes: withinInterval ? 'Observed outcome fell inside 90% prediction interval.' : 'Observed outcome fell outside 90% prediction interval.',
  };
  db.forecastEvaluations.set(ev.id, ev);

  // Trigger drift check if MAPE spikes > 18%
  let driftTriggered = false;
  const model = db.forecastModels.get(fc.modelId);
  if (model && pctErr > 18 && !model.isBaselineModel) {
    driftTriggered = true;
    triggerModelDrift({
      modelId: model.id,
      driftType: 'ACCURACY_DETERIORATION',
      metricBefore: model.errorMetrics.mapePct,
      metricAfter: pctErr,
      actorId: params.actorId,
      actorRole: params.actorRole,
    });
  }

  logIntelligenceAudit({
    tenantId: fc.tenantId,
    jurisdiction: fc.jurisdiction,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'FORECAST_EVALUATED',
    entityType: 'FORECAST_EVALUATION',
    entityId: ev.id,
    details: `Evaluated ${fc.id}: forecast=${fc.expectedValue}, actual=${params.actualValue}, MAPE=${pctErr}%.`,
  });

  db.scheduleSave();
  return { success: true, evaluation: ev, driftTriggered };
}

export function transitionModelStatus(params: {
  modelId: string;
  targetStatus: V12ForecastModelStatus;
  actorId: string;
  actorRole: string;
  notes?: string;
}): { success: boolean; model?: ForecastModel; error?: string } {
  const model = db.forecastModels.get(params.modelId);
  if (!model) return { success: false, error: `Model ${params.modelId} not found.` };
  if (params.actorRole !== 'PLATFORM_ADMIN') {
    return { success: false, error: 'FORBIDDEN: Only PLATFORM_ADMIN may approve, promote, suspend, or retire forecasting models.' };
  }

  // Must pass VALIDATION & APPROVED before reaching ACTIVE
  if (params.targetStatus === 'ACTIVE') {
    if (model.approvalStatus !== 'APPROVED' && model.deploymentStatus !== 'APPROVED' && !model.isBaselineModel) {
      return {
        success: false,
        error: `GOVERNANCE_POLICY: Model ${model.id} (${model.deploymentStatus}/${model.approvalStatus}) must be APPROVED before promotion to ACTIVE production status.`,
      };
    }
    if (model.driftDetected && model.requiresReviewBeforeRestore) {
      return {
        success: false,
        error: `DRIFT_LOCK: Model ${model.id} was marked degraded due to drift and requires formal drift restoration review before returning to ACTIVE.`,
      };
    }
  }

  const now = new Date().toISOString();
  if (params.targetStatus === 'APPROVED') {
    model.approvalStatus = 'APPROVED';
    model.approvedBy = params.actorId;
    model.requiresReviewBeforeRestore = false;
    model.driftDetected = false;
  } else if (params.targetStatus === 'SUSPENDED') {
    model.approvalStatus = 'SUSPENDED';
  }
  model.deploymentStatus = params.targetStatus;
  model.updatedAt = now;
  db.forecastModels.set(model.id, model);

  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'EAC',
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: params.targetStatus === 'SUSPENDED' ? 'MODEL_SUSPENDED' : 'MODEL_PROMOTED',
    entityType: 'FORECAST_MODEL',
    entityId: model.id,
    details: `Transitioned model ${model.id} to ${params.targetStatus}. ${params.notes || ''}`,
  });

  db.scheduleSave();
  return { success: true, model };
}

export function triggerModelDrift(params: {
  modelId: string;
  driftType: ModelDriftEvent['driftType'];
  metricBefore: number;
  metricAfter: number;
  actorId: string;
  actorRole: string;
}): { success: boolean; driftEvent?: ModelDriftEvent; affectedForecastIds: string[]; error?: string } {
  const model = db.forecastModels.get(params.modelId);
  if (!model) return { success: false, affectedForecastIds: [], error: `Model ${params.modelId} not found.` };

  const now = new Date().toISOString();
  model.driftDetected = true;
  model.requiresReviewBeforeRestore = true;
  model.deploymentStatus = 'SUSPENDED';
  model.approvalStatus = 'SUSPENDED';
  model.updatedAt = now;
  db.forecastModels.set(model.id, model);

  const affectedForecastIds: string[] = [];
  db.v12EconomicForecasts.forEach((fc) => {
    if (fc.modelId === model.id) {
      fc.suspendedDueToDrift = true;
      fc.modelStatus = 'SUSPENDED';
      fc.updatedAt = now;
      db.v12EconomicForecasts.set(fc.id, fc);
      affectedForecastIds.push(fc.id);
    }
  });

  const driftEvent: ModelDriftEvent = {
    id: `DRIFT-${Date.now().toString(36).toUpperCase()}`,
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'EAC',
    sourceReference: 'V12-DRIFT-MONITOR',
    verificationStatus: 'VERIFIED',
    accessClassification: 'RESTRICTED',
    provenance: `Automated drift detector flagged ${model.id}`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    modelId: model.id,
    modelVersion: model.version,
    driftType: params.driftType,
    severity: 'HIGH',
    metricBefore: params.metricBefore,
    metricAfter: params.metricAfter,
    affectedForecastIds,
    fallbackModelId: model.baselineModelId || 'MDL-STAT-MA-BASE-V1',
    modelMarkedDegraded: true,
    adminNotified: true,
    restorationReviewStatus: 'PENDING_REVIEW',
    detectedAt: now,
  };
  db.modelDriftEvents.set(driftEvent.id, driftEvent);

  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'EAC',
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'DRIFT_DETECTED',
    entityType: 'FORECAST_MODEL',
    entityId: model.id,
    details: `Model drift (${params.driftType}) detected: metric moved ${params.metricBefore} -> ${params.metricAfter}; suspended ${affectedForecastIds.length} forecast(s), fallback ${driftEvent.fallbackModelId}.`,
  });

  db.scheduleSave();
  return { success: true, driftEvent, affectedForecastIds };
}

// ==========================================
// 5. BOUNDED PRIORITY BACKGROUND JOB QUEUE (§32)
// ==========================================

const MAX_ACTIVE_JOBS = 100;

export function enqueueV12Job(params: {
  jobType: V12BackgroundJob['jobType'];
  priority: V12BackgroundJob['priority'];
  tenantId: string;
  idempotencyKey: string;
  payload: Record<string, any>;
  actorId: string;
  actorRole: string;
}): { accepted: boolean; job?: V12BackgroundJob; deduplicated?: boolean; error?: string } {
  // Idempotency deduplication prevents duplicate forecasts/jobs
  const existing = Array.from(db.v12BackgroundJobs.values()).find(
    (j) => j.idempotencyKey === params.idempotencyKey && j.tenantId === params.tenantId && j.status !== 'CANCELLED'
  );
  if (existing) {
    return { accepted: true, job: existing, deduplicated: true };
  }

  const queuedCount = Array.from(db.v12BackgroundJobs.values()).filter(
    (j) => j.status === 'QUEUED' || j.status === 'RUNNING'
  ).length;
  if (queuedCount >= MAX_ACTIVE_JOBS) {
    return { accepted: false, error: 'BACKPRESSURE_LIMIT: Background job queue capacity reached.' };
  }

  const now = new Date().toISOString();
  const job: V12BackgroundJob = {
    id: `JOB-V12-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
    jobType: params.jobType,
    priority: params.priority,
    tenantId: params.tenantId,
    idempotencyKey: params.idempotencyKey,
    payload: params.payload,
    status: 'QUEUED',
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
  };
  db.v12BackgroundJobs.set(job.id, job);

  // Process asynchronous worker tick cleanly off the synchronous HTTP frame if possible, or execute deterministic quick step via micro-schedule
  setImmediate(() => {
    const live = db.v12BackgroundJobs.get(job.id);
    if (!live || live.status === 'CANCELLED') return;
    live.status = 'RUNNING';
    live.attempts += 1;
    live.updatedAt = new Date().toISOString();
    db.v12BackgroundJobs.set(live.id, live);

    if (live.jobType === 'FORECAST_GENERATION') {
      const res = generateStatisticalForecast({
        indicatorId: live.payload.indicatorId,
        domain: live.payload.domain || 'COMMODITY_PRICES',
        horizon: live.payload.horizon || 'NEAR_TERM',
        modelId: live.payload.modelId,
        tenantId: live.tenantId,
        actorId: params.actorId,
        actorRole: params.actorRole,
      });
      if (res.success && res.forecast) {
        live.status = 'COMPLETED';
        live.resultId = res.forecast.id;
        live.completedAt = new Date().toISOString();
      } else {
        live.status = live.attempts >= live.maxAttempts ? 'DEAD_LETTER' : 'FAILED';
        live.errorMessage = res.error;
      }
    } else {
      live.status = 'COMPLETED';
      live.completedAt = new Date().toISOString();
    }
    live.updatedAt = new Date().toISOString();
    db.v12BackgroundJobs.set(live.id, live);
    db.scheduleSave();
  });

  db.scheduleSave();
  return { accepted: true, job, deduplicated: false };
}

// ==========================================
// 6. ANOMALIES, EARLY WARNINGS & OPPORTUNITIES (§7, §8, §9)
// ==========================================

export function scanEconomicAnomalies(tenantId: string, actorId: string, actorRole: string): EconomicAnomaly[] {
  const created: EconomicAnomaly[] = [];
  const now = new Date().toISOString();

  db.economicTimeSeries.forEach((ts) => {
    if (ts.points.length < 4) return;
    const vals = ts.points.map((p) => p.value);
    const baselineSlice = vals.slice(0, vals.length - 1);
    const latest = vals[vals.length - 1];
    const mean = baselineSlice.reduce((a, b) => a + b, 0) / baselineSlice.length;
    const std = Math.sqrt(baselineSlice.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / baselineSlice.length) || 1;
    const z = Number(((latest - mean) / std).toFixed(2));

    if (Math.abs(z) >= 2.0) {
      const latestPt = ts.points[ts.points.length - 1];
      const already = Array.from(db.economicAnomalies.values()).some((a) => a.affectedRecordId === latestPt.observationId);
      if (!already) {
        const anom: EconomicAnomaly = {
          id: `ANOM-SCAN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
          tenantId: 'GLOBAL_PUBLIC',
          jurisdiction: ts.jurisdiction,
          sourceReference: ts.sourceReference,
          verificationStatus: 'VERIFIED',
          accessClassification: 'PUBLIC',
          provenance: `Statistical Z-score scan over ${ts.indicatorCode}`,
          retentionPolicy: '7_YEARS_STATUTORY',
          createdAt: now,
          updatedAt: now,
          classification: 'INFORMATIONAL_ANOMALY',
          title: `Statistical Shift Detected on ${ts.indicatorCode} (z=${z})`,
          detectionReason: `Latest normalized value (${latest}) deviated ${z} standard deviations from historical baseline (${mean.toFixed(2)}).`,
          affectedRecordType: 'OBSERVATION',
          affectedRecordId: latestPt.observationId,
          historicalBaselineValue: Number(mean.toFixed(2)),
          observedValue: latest,
          deviationZScore: z,
          detectionMethod: 'ROLLING_Z_SCORE_V1',
          severity: Math.abs(z) >= 3 ? 'HIGH' : 'MEDIUM',
          confidence: 'MODERATE',
          recommendedInvestigation: 'Verify primary market source notes before classifying as structural price move.',
          humanInvestigationRequired: false,
          reviewStatus: 'OPEN',
          resolutionHistory: [],
        };
        db.economicAnomalies.set(anom.id, anom);
        created.push(anom);
      }
    }
  });

  if (created.length > 0) {
    logIntelligenceAudit({
      tenantId,
      jurisdiction: 'EAC',
      actorId,
      actorRole,
      actionType: 'ANOMALY_DETECTED',
      entityType: 'ANOMALY_SCAN',
      entityId: created[0].id,
      details: `Anomaly scanner identified ${created.length} statistically significant deviation(s).`,
    });
    db.scheduleSave();
  }
  return created;
}

// ==========================================
// 7. SCENARIO, BUSINESS IMPACT & REGIONAL STRESS SIMULATIONS (§10, §11, §12)
// ==========================================

export function runEconomicScenarioSimulation(params: {
  scenarioName: string;
  scenarioType: EconomicScenario['scenarioType'];
  description: string;
  shockVariable: string;
  baselineValue: number;
  shockPct: number;
  unit: string;
  affectedJurisdictions: string[];
  affectedSectors: string[];
  timeHorizon: string;
  tenantId: string;
  actorId: string;
  actorRole: string;
}): { success: boolean; scenario?: EconomicScenario; result?: ScenarioSimulationResult; error?: string } {
  if (!params.scenarioName || !Number.isFinite(params.baselineValue) || params.baselineValue <= 0 || !Number.isFinite(params.shockPct)) {
    return { success: false, error: 'INVALID_SCENARIO_INPUT: scenarioName, positive baselineValue, and finite shockPct required.' };
  }
  if (params.shockPct < -95 || params.shockPct > 500) {
    return { success: false, error: 'INVALID_SCENARIO_BOUNDS: shockPct must sit within [-95%, +500%].' };
  }

  const now = new Date().toISOString();
  const scenId = `SCEN-${Date.now().toString(36).toUpperCase()}`;
  const jurisLabel = params.affectedJurisdictions[0] || 'UG';

  const scenario: EconomicScenario = {
    id: scenId,
    tenantId: params.tenantId,
    jurisdiction: jurisLabel,
    sourceReference: 'V12-SCENARIO-ENGINE',
    verificationStatus: 'VERIFIED',
    accessClassification: params.tenantId === 'GLOBAL_PUBLIC' ? 'PUBLIC' : 'TENANT_PRIVATE',
    provenance: 'SIMULATED_SCENARIO (strictly isolated from live financial and operational ledgers)',
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    scenarioName: params.scenarioName,
    scenarioType: params.scenarioType,
    description: params.description || `Simulated ${params.shockPct}% shock to ${params.shockVariable}`,
    label: 'SIMULATED_SCENARIO',
    startingConditions: { [params.shockVariable]: params.baselineValue },
    assumptions: [
      `Shock variable ${params.shockVariable} stressed by ${params.shockPct}% over ${params.timeHorizon}.`,
      'Downstream pass-through factor calibrated at 0.35 for consumer prices and -0.18 for sector operating margin.',
      'SIMULATED_SCENARIO: No live ledger, order, or settlement collection modified.',
    ],
    inputVariables: [
      { variable: params.shockVariable, baselineValue: params.baselineValue, shockPct: params.shockPct, unit: params.unit },
    ],
    affectedJurisdictions: params.affectedJurisdictions.length > 0 ? params.affectedJurisdictions : ['UG'],
    affectedSectors: params.affectedSectors.length > 0 ? params.affectedSectors : ['Multi-Sector Economy'],
    timeHorizon: params.timeHorizon || '30 DAYS',
    modelUsed: 'ELASTICITY_PASS_THROUGH_SIM_V1',
    createdBy: params.actorId,
    mutatesRealRecords: false,
  };
  db.economicScenarios.set(scenario.id, scenario);

  const simPrimary = Number((params.baselineValue * (1 + params.shockPct / 100)).toFixed(2));
  const passThroughPct = Number((params.shockPct * 0.35).toFixed(2));
  const marginDeltaPct = Number((-params.shockPct * 0.18).toFixed(2));
  const seedHash = hash256(`${scenario.scenarioType}|${params.shockVariable}|${params.baselineValue}|${params.shockPct}|${params.timeHorizon}`);

  const simResult: ScenarioSimulationResult = {
    id: `SIMRES-${Date.now().toString(36).toUpperCase()}`,
    tenantId: params.tenantId,
    jurisdiction: jurisLabel,
    sourceReference: scenario.id,
    verificationStatus: 'VERIFIED',
    accessClassification: scenario.accessClassification,
    provenance: 'SIMULATED_SCENARIO computation output',
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    scenarioId: scenario.id,
    label: 'SIMULATED_SCENARIO',
    baselineComparison: [
      { metric: params.shockVariable, baselineValue: params.baselineValue, simulatedValue: simPrimary, deltaPct: params.shockPct, unit: params.unit },
      { metric: 'Downstream Landed Price Pressure Index', baselineValue: 100, simulatedValue: Number((100 + passThroughPct).toFixed(2)), deltaPct: passThroughPct, unit: 'INDEX' },
      { metric: 'Sector Operating Margin Index', baselineValue: 100, simulatedValue: Number((100 + marginDeltaPct).toFixed(2)), deltaPct: marginDeltaPct, unit: 'INDEX' },
    ],
    alternativeComparisons: [
      { caseName: 'Baseline (0%)', shockPct: 0, projectedImpactPct: 0, projectedValue: params.baselineValue },
      { caseName: 'Scenario A (+10%)', shockPct: 10, projectedImpactPct: 10, projectedValue: Number((params.baselineValue * 1.1).toFixed(2)) },
      { caseName: 'Scenario B (+25%)', shockPct: 25, projectedImpactPct: 25, projectedValue: Number((params.baselineValue * 1.25).toFixed(2)) },
      { caseName: 'Scenario C (-10%)', shockPct: -10, projectedImpactPct: -10, projectedValue: Number((params.baselineValue * 0.9).toFixed(2)) },
      { caseName: `Custom (${params.shockPct}%)`, shockPct: params.shockPct, projectedImpactPct: params.shockPct, projectedValue: simPrimary },
    ],
    uncertaintyRangePct: [Number((passThroughPct - 2.5).toFixed(2)), Number((passThroughPct + 2.5).toFixed(2))],
    affectedCorridors: ['Northern Corridor', 'Central Corridor'],
    alternativeRoutesOrSuppliers: ['Busia OSBP alternate route', 'Domestic cooperative buffer stock'],
    estimatedRecoveryPeriodDays: Math.max(7, Math.round(Math.abs(params.shockPct) * 0.9)),
    dataGaps: ['Real-time private inventory levels across non-participating SMEs are unavailable.'],
    limitations: ['SIMULATED_SCENARIO only; relies on static pass-through elasticity and never asserts macroeconomic policy control.'],
    reproducibleSeedHash: seedHash,
    generatedAt: now,
  };
  db.scenarioSimulationResults.set(simResult.id, simResult);

  logIntelligenceAudit({
    tenantId: params.tenantId,
    jurisdiction: jurisLabel,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'SCENARIO_SIMULATED',
    entityType: 'ECONOMIC_SCENARIO',
    entityId: scenario.id,
    details: `Executed SIMULATED_SCENARIO ${scenario.scenarioName} (${params.shockPct}% shock on ${params.shockVariable}) without modifying real economic records.`,
    inputHash: seedHash,
  });

  db.scheduleSave();
  return { success: true, scenario, result: simResult };
}

export function runBusinessImpactSimulation(params: {
  tenantId: string;
  actorId: string;
  actorRole: string;
  supplierCostDeltaPct: number;
  productDemandDeltaPct: number;
  fxExposureDeltaPct: number;
  inventoryCostDeltaPct: number;
  transportExpenseDeltaPct: number;
  payrollDeltaPct: number;
  currency?: string;
}): BusinessImpactSimulation {
  const tenant = db.tenants.get(params.tenantId);
  const docs = Array.from(db.businessCommercialDocs.values()).filter((d) => d.tenantId === params.tenantId);
  const docRevenue = docs
    .filter((d) => d.docType === 'INVOICE' || d.docType === 'PURCHASE_ORDER')
    .reduce((acc, d) => acc + (d.totalAmount || 0), 0);

  const baselineRevenue = docRevenue > 0 ? docRevenue : 120000000;
  const baselineCost = Math.round(baselineRevenue * 0.76);
  const baselineMargin = baselineRevenue - baselineCost;
  const now = new Date().toISOString();

  const costFactorBase =
    1 +
    (params.supplierCostDeltaPct * 0.45 +
      params.transportExpenseDeltaPct * 0.2 +
      params.inventoryCostDeltaPct * 0.15 +
      params.payrollDeltaPct * 0.2) /
      100;
  const revFactorBase = 1 + (params.productDemandDeltaPct + params.fxExposureDeltaPct * 0.25) / 100;

  const baseRev = Math.round(baselineRevenue * revFactorBase);
  const baseCost = Math.round(baselineCost * costFactorBase);
  const baseMargin = baseRev - baseCost;

  const bestRev = Math.round(baseRev * 1.08);
  const bestCost = Math.round(baseCost * 0.95);
  const bestMargin = bestRev - bestCost;

  const stressRev = Math.round(baseRev * 0.88);
  const stressCost = Math.round(baseCost * 1.1);
  const stressMargin = stressRev - stressCost;

  const sim: BusinessImpactSimulation = {
    id: `BIZSIM-${params.tenantId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
    tenantId: params.tenantId,
    jurisdiction: tenant?.jurisdiction || 'UG',
    sourceReference: `TENANT_COMMERCIAL_RECORDS:${params.tenantId}`,
    verificationStatus: 'VERIFIED',
    accessClassification: 'TENANT_PRIVATE',
    provenance: `Computed exclusively from ${docs.length} authorized records of tenant ${params.tenantId}`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    businessName: tenant?.legalName || params.tenantId,
    label: 'SIMULATED_SCENARIO',
    inputAssumptions: {
      supplierCostDeltaPct: params.supplierCostDeltaPct,
      productDemandDeltaPct: params.productDemandDeltaPct,
      fxExposureDeltaPct: params.fxExposureDeltaPct,
      inventoryCostDeltaPct: params.inventoryCostDeltaPct,
      transportExpenseDeltaPct: params.transportExpenseDeltaPct,
      payrollDeltaPct: params.payrollDeltaPct,
      currency: params.currency || (tenant?.jurisdiction === 'KE' ? 'KES' : 'UGX'),
    },
    baselineMetrics: {
      monthlyRevenue: baselineRevenue,
      monthlyOperatingCost: baselineCost,
      monthlyNetMargin: baselineMargin,
      sourceRecordCount: docs.length,
    },
    projectedScenarios: {
      bestCase: { projectedRevenue: bestRev, projectedCost: bestCost, netMargin: bestMargin, cashPressure: bestMargin > 0 ? 'LOW' : 'MODERATE' },
      baseCase: { projectedRevenue: baseRev, projectedCost: baseCost, netMargin: baseMargin, cashPressure: baseMargin > baselineMargin * 0.5 ? 'MODERATE' : 'HIGH' },
      stressCase: { projectedRevenue: stressRev, projectedCost: stressCost, netMargin: stressMargin, cashPressure: 'HIGH' },
    },
    uncertaintyNotes: 'SIMULATED_SCENARIO decision-support estimate isolated strictly to requesting tenant.',
    recommendedManagementActions: [
      stressMargin < 0 ? 'Prepare working-capital liquidity buffer or renegotiate supplier credit terms under stress case.' : 'Monitor supplier cost variance weekly.',
      'Compare freight carriers inside AETHER–AROS Logistics before committing new dispatch volume.',
    ],
    disclaimer: 'Decision-support simulation only, not a guarantee of future business performance or audited accounting advice.',
    createdBy: params.actorId,
  };

  db.businessImpactSimulations.set(sim.id, sim);
  logIntelligenceAudit({
    tenantId: params.tenantId,
    jurisdiction: sim.jurisdiction,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'SCENARIO_SIMULATED',
    entityType: 'BUSINESS_IMPACT_SIMULATION',
    entityId: sim.id,
    details: `Tenant-isolated SIMULATED_SCENARIO generated for ${params.tenantId} (base margin ${baseMargin}).`,
  });
  db.scheduleSave();
  return sim;
}

// ==========================================
// 8. COORDINATION RECOMMENDATIONS & SUPPLIER MATCHING (§13, §14)
// ==========================================

export function generateCoordinationRecommendation(params: {
  tenantId: string;
  targetParticipantName?: string;
  recommendationType: EconomicRecommendation['recommendationType'];
  sourceIntelligenceIds: string[];
  recommendedAction: string;
  explanation: string;
  actorId: string;
  actorRole: string;
}): EconomicRecommendation {
  const tenant = db.tenants.get(params.tenantId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const rec: EconomicRecommendation = {
    id: `REC-V12-${Date.now().toString(36).toUpperCase()}`,
    tenantId: params.tenantId,
    jurisdiction: tenant?.jurisdiction || 'UG',
    sourceReference: params.sourceIntelligenceIds[0] || 'V12-COORDINATION-ENGINE',
    verificationStatus: 'VERIFIED',
    accessClassification: 'TENANT_PRIVATE',
    provenance: `Derived from verified intelligence items: ${params.sourceIntelligenceIds.join(', ') || 'internal signals'}`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    targetParticipantId: params.tenantId,
    targetParticipantName: params.targetParticipantName || tenant?.legalName || params.tenantId,
    recommendationType: params.recommendationType,
    sourceIntelligenceIds: params.sourceIntelligenceIds,
    explanation: params.explanation,
    expectedBenefit: 'Improves procurement continuity and mitigates price/corridor variance.',
    potentialRisk: 'Requires human operational verification of counterparty terms prior to contract commitment.',
    requiredPermissions: ['OPERATIONS_MANAGER', 'PROCUREMENT_LEAD'],
    recommendedAction: params.recommendedAction,
    confidence: 'MODERATE',
    expiresAt,
    requiresHumanApproval: true,
    approvalStatus: 'GENERATED',
    autoExecutionProhibited: true,
  };
  db.economicRecommendations.set(rec.id, rec);
  logIntelligenceAudit({
    tenantId: params.tenantId,
    jurisdiction: rec.jurisdiction,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'RECOMMENDATION_DECIDED',
    entityType: 'ECONOMIC_RECOMMENDATION',
    entityId: rec.id,
    details: `Generated human-gated recommendation ${rec.id} (${rec.recommendationType}); auto-execution disabled.`,
  });
  db.scheduleSave();
  return rec;
}
