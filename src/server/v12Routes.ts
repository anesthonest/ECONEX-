/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V12.0 - Global Economic Intelligence & Predictive Analytics REST Router
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db.ts';
import { executeV12EconomicAssistant, detectPromptInjection, sanitizeExternalSourceText } from './gemini.ts';
import {
  logIntelligenceAudit,
  getPublicCachedOrCompute,
  invalidatePublicIntelligenceCache,
  ingestEconomicObservations,
  generateStatisticalForecast,
  evaluateForecastAgainstActual,
  transitionModelStatus,
  triggerModelDrift,
  enqueueV12Job,
  scanEconomicAnomalies,
  runEconomicScenarioSimulation,
  runBusinessImpactSimulation,
  generateCoordinationRecommendation,
} from './v12Engine.ts';
import type {
  IntelligenceSource,
  V12EconomicEarlyWarning,
  V12DataClassification,
  IntelligenceReport,
  IntelligenceReviewQueueItem,
  IntelligenceAgentRun,
} from '../types/index.ts';

export const v12Router = Router();

interface V12TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
  isPlatformAdmin: boolean;
}

function resolveActor(req: Request): { userId?: string; role?: string; isPlatformAdmin: boolean } {
  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string | undefined)?.trim();
  let role = (req.headers['x-user-role'] as string | undefined)?.trim();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = db.validateSession(token);
    if (session) {
      userId = session.userId;
      role = session.role;
    }
  }

  if (userId) {
    const user = db.users.get(userId);
    if (user) {
      role = user.role;
    }
  }

  return {
    userId,
    role,
    isPlatformAdmin: role === 'PLATFORM_ADMIN',
  };
}

function requireTenantContext(req: Request, res: Response, next: NextFunction) {
  const requestedTenantId =
    (req.headers['x-tenant-id'] as string | undefined)?.trim() ||
    (req.query.tenantId as string | undefined)?.trim() ||
    (req.body?.tenantId as string | undefined)?.trim() ||
    'TEN-UG-ELGON-01';

  const actor = resolveActor(req);

  if (requestedTenantId === 'GLOBAL_PUBLIC') {
    (req as any).v12Ctx = {
      tenantId: 'GLOBAL_PUBLIC',
      userId: actor.userId,
      role: actor.role,
      isPlatformAdmin: actor.isPlatformAdmin,
    } satisfies V12TenantContext;
    return next();
  }

  const tenant = db.tenants.get(requestedTenantId);
  if (!tenant) {
    return res.status(404).json({ error: `Tenant ${requestedTenantId} not found.` });
  }

  if ((tenant.status === 'SUSPENDED' || tenant.status === 'CLOSED') && !actor.isPlatformAdmin) {
    return res.status(403).json({
      error: 'TENANT_SUSPENDED',
      message: `Tenant ${requestedTenantId} is currently ${tenant.status}.`,
    });
  }

  if (actor.userId && !actor.isPlatformAdmin) {
    const hasMembership = Array.from(db.tenantMemberships.values()).some(
      (m) => m.tenantId === requestedTenantId && m.userId === actor.userId && m.status === 'ACTIVE'
    );
    const isPrimaryAdmin = tenant.primaryAdminUserId === actor.userId;
    if (!hasMembership && !isPrimaryAdmin) {
      return res.status(403).json({
        error: 'CROSS_TENANT_ACCESS_DENIED',
        tenantId: requestedTenantId,
        userId: actor.userId,
        message: `User ${actor.userId} does not hold an active membership for tenant ${requestedTenantId}.`,
      });
    }
  }

  (req as any).v12Ctx = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies V12TenantContext;

  return next();
}

function getCtx(req: Request): V12TenantContext {
  return (req as any).v12Ctx as V12TenantContext;
}

function canReadRecord(
  ctx: V12TenantContext,
  record: { tenantId: string; accessClassification: V12DataClassification }
): boolean {
  if (ctx.isPlatformAdmin) return true;
  if (record.accessClassification === 'PUBLIC') return true;
  if (record.accessClassification === 'RESTRICTED') {
    return record.tenantId === 'GLOBAL_PUBLIC' || record.tenantId === ctx.tenantId;
  }
  if (record.accessClassification === 'TENANT_PRIVATE') {
    return record.tenantId === ctx.tenantId;
  }
  // INSTITUTION_PRIVATE / CONFIDENTIAL / SOVEREIGN_RESTRICTED require explicit admin/institutional match
  if (record.accessClassification === 'INSTITUTION_PRIVATE') {
    return record.tenantId === ctx.tenantId && (ctx.role === 'COOPERATIVE_ADMIN' || ctx.role === 'PLATFORM_ADMIN');
  }
  return false;
}

// Per-bucket sliding window rate limiter
const rateBuckets = new Map<string, number[]>();

function v12RateLimit(bucketPrefix: string, maxRequestsPerMin: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ctx = getCtx(req);
    const keyOverride = (req.headers['x-rate-limit-key'] as string | undefined)?.trim();
    const bucketKey = `${bucketPrefix}:${keyOverride || ctx.userId || req.ip || 'anon'}:${ctx.tenantId}`;
    const now = Date.now();
    const windowStart = now - 60_000;
    const recent = (rateBuckets.get(bucketKey) || []).filter((t) => t > windowStart);

    if (recent.length >= maxRequestsPerMin) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        bucket: bucketPrefix,
        limitPerMinute: maxRequestsPerMin,
        message: 'API rate limit exceeded for current 60-second sliding window.',
      });
    }
    recent.push(now);
    rateBuckets.set(bucketKey, recent);
    return next();
  };
}

// ==========================================
// 1. INTELLIGENCE OVERVIEW, STATUS & COVERAGE (§20, §27)
// ==========================================

v12Router.get('/intelligence/overview', requireTenantContext, v12RateLimit('v12-read', 600), (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const jurisdictionFilter = (req.query.jurisdiction as string | undefined)?.toUpperCase();
  const sectorFilter = (req.query.sector as string | undefined)?.toLowerCase();

  const { data, cacheHit } = getPublicCachedOrCompute(
    `overview:${jurisdictionFilter || 'ALL'}:${sectorFilter || 'ALL'}`,
    'PUBLIC',
    10_000,
    () => {
      const sources = Array.from(db.intelligenceSources.values());
      const activeSources = sources.filter((s) => s.adminApprovalStatus === 'APPROVED');
      const healthList = Array.from(db.intelligenceSourceHealth.values());
      const staleSourcesCount = healthList.filter((h) => h.status === 'STALE' || h.stalenessHours > 48).length;

      let indicators = Array.from(db.economicIndicators.values()).filter((i) => i.accessClassification === 'PUBLIC');
      if (jurisdictionFilter && jurisdictionFilter !== 'ALL') {
        indicators = indicators.filter((i) => i.jurisdiction === jurisdictionFilter);
      }
      if (sectorFilter) {
        indicators = indicators.filter((i) => i.sector.toLowerCase().includes(sectorFilter));
      }

      const freshIndicatorsCount = indicators.filter((i) => i.availabilityStatus === 'AVAILABLE' && !i.staleWarning).length;
      const staleIndicatorsCount = indicators.filter((i) => i.staleWarning || i.availabilityStatus === 'STALE').length;
      const unavailableIndicatorsCount = indicators.filter((i) => i.availabilityStatus === 'UNAVAILABLE').length;

      const forecasts = Array.from(db.v12EconomicForecasts.values()).filter((f) => !f.suspendedDueToDrift);
      const confidenceDistribution = {
        HIGH: forecasts.filter((f) => f.confidenceClassification === 'HIGH').length,
        MODERATE: forecasts.filter((f) => f.confidenceClassification === 'MODERATE').length,
        LOW: forecasts.filter((f) => f.confidenceClassification === 'LOW').length,
        INSUFFICIENT_DATA: forecasts.filter((f) => f.confidenceClassification === 'INSUFFICIENT_DATA').length,
      };

      const warnings = Array.from(db.economicEarlyWarnings.values()).filter((w) => w.reviewStatus !== 'CLOSED');
      const anomalies = Array.from(db.economicAnomalies.values()).filter((a) => a.reviewStatus !== 'CLOSED' && a.accessClassification === 'PUBLIC');
      const opportunities = Array.from(db.v12EconomicOpportunities.values()).filter((o) => o.status === 'ACTIVE');
      const models = Array.from(db.forecastModels.values());
      const activeModels = models.filter((m) => m.deploymentStatus === 'ACTIVE');
      const avgMape = activeModels.length > 0
        ? Number((activeModels.reduce((a, m) => a + m.errorMetrics.mapePct, 0) / activeModels.length).toFixed(2))
        : null;

      const dqReports = Array.from(db.economicDataQualityReports.values());
      const latestDq = dqReports[dqReports.length - 1];
      const pendingReviewsCount = Array.from(db.intelligenceReviewQueue.values()).filter((r) => r.status === 'PENDING_REVIEW').length;

      // Distinguish registered vs active economic participants honestly
      const registeredParticipants = db.tenants.size + db.economicParticipants.size;
      const activeParticipants = new Set(
        Array.from(db.economicExecutions.values())
          .filter((e) => e.status !== 'DRAFT' && e.status !== 'CANCELLED')
          .flatMap((e) => [e.originatingParticipantId, e.receivingParticipantId])
      ).size;

      return {
        release: 'V12.0-GLOBAL-ECONOMIC-INTELLIGENCE',
        schemaVersion: db.schemaVersion,
        generatedAt: new Date().toISOString(),
        sources: {
          totalRegistered: sources.length,
          verifiedActive: activeSources.length,
          staleWarnings: staleSourcesCount,
        },
        indicators: {
          total: indicators.length,
          fresh: freshIndicatorsCount,
          stale: staleIndicatorsCount,
          unavailable: unavailableIndicatorsCount,
        },
        observationsCount: db.economicObservations.size,
        forecasts: {
          activeCount: forecasts.length,
          confidenceDistribution,
        },
        alerts: {
          activeWarnings: warnings.length,
          openAnomalies: anomalies.length,
          criticalWarnings: warnings.filter((w) => w.severity === 'CRITICAL' || w.severity === 'HIGH').length,
        },
        opportunitiesCount: opportunities.length,
        participantsSummary: {
          registeredCount: registeredParticipants,
          activeTransactingCount: activeParticipants,
          distinctionNotice: 'Registered participant accounts are explicitly separated from actively transacting participants.',
        },
        dataQuality: {
          overallQualityScore: latestDq?.overallQualityScore ?? null,
          staleCount: latestDq?.staleCount ?? staleIndicatorsCount,
          lastCheckedAt: latestDq?.generatedAt ?? new Date().toISOString(),
        },
        modelPerformance: {
          totalModels: models.length,
          activeProductionModels: activeModels.length,
          averageMapePct: avgMape,
          driftEventsCount: db.modelDriftEvents.size,
        },
        pendingHumanReviews: pendingReviewsCount,
      };
    }
  );

  return res.json({ ...data, tenantContext: ctx.tenantId, cacheHit });
});

v12Router.get('/intelligence/status', requireTenantContext, (_req: Request, res: Response) => {
  const models = Array.from(db.forecastModels.values());
  const agents = Array.from(db.intelligenceAgentPolicies.values());
  const circuitBreakerActive = agents.some((a) => a.emergencyCircuitBreakerActive);
  const sources = Array.from(db.intelligenceSources.values());
  return res.json({
    system: 'AETHER-AROS V12 Global Economic Intelligence Engine',
    schemaVersion: db.schemaVersion,
    operationalState: circuitBreakerActive ? 'DEGRADED_CIRCUIT_BREAKER_ACTIVE' : 'OPERATIONAL',
    circuitBreakerActive,
    backgroundQueue: {
      totalJobs: db.v12BackgroundJobs.size,
      queuedOrRunning: Array.from(db.v12BackgroundJobs.values()).filter((j) => j.status === 'QUEUED' || j.status === 'RUNNING').length,
      deadLetter: Array.from(db.v12BackgroundJobs.values()).filter((j) => j.status === 'DEAD_LETTER').length,
    },
    sourceConnectionsSummary: {
      localOnly: sources.filter((s) => s.connectionStatus === 'LOCAL_ONLY').length,
      referenceDirectory: sources.filter((s) => s.connectionStatus === 'REFERENCE_DIRECTORY').length,
      notConfigured: sources.filter((s) => s.connectionStatus === 'NOT_CONFIGURED').length,
      productionVerifiedExternal: sources.filter((s) => s.connectionStatus === 'PRODUCTION_CONNECTED_AND_VERIFIED').length,
    },
    degradedModelsCount: models.filter((m) => m.driftDetected || m.deploymentStatus === 'SUSPENDED').length,
    v1ToV11CoreUnaffected: true,
    timestamp: new Date().toISOString(),
  });
});

v12Router.get('/intelligence/coverage', requireTenantContext, (_req: Request, res: Response) => {
  const indicators = Array.from(db.economicIndicators.values());
  const byJurisdiction: Record<string, { available: number; stale: number; unavailable: number; sectors: string[] }> = {};

  indicators.forEach((ind) => {
    if (!byJurisdiction[ind.jurisdiction]) {
      byJurisdiction[ind.jurisdiction] = { available: 0, stale: 0, unavailable: 0, sectors: [] };
    }
    const bucket = byJurisdiction[ind.jurisdiction];
    if (ind.availabilityStatus === 'AVAILABLE') bucket.available++;
    else if (ind.availabilityStatus === 'STALE') bucket.stale++;
    else bucket.unavailable++;
    if (!bucket.sectors.includes(ind.sector)) bucket.sectors.push(ind.sector);
  });

  const definitions = Array.from(db.economicIndicatorDefinitions.values());
  return res.json({
    coverageDisclaimer: 'Coverage reflects strictly verified or authorized ingested datasets in UG, EAC, and configured corridors. Incomplete regional views are never presented as full global coverage.',
    jurisdictions: byJurisdiction,
    definitionalNotes: definitions
      .filter((d) => d.definitionalDifferencesByJurisdiction)
      .map((d) => ({ code: d.code, name: d.name, differences: d.definitionalDifferencesByJurisdiction })),
  });
});

// ==========================================
// 2. DATA SOURCES & CREDENTIAL PROTECTION (§5, §30)
// ==========================================

v12Router.get('/intelligence/sources', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const sources = Array.from(db.intelligenceSources.values())
    .filter((s) => canReadRecord(ctx, s))
    .map((s) => {
      const health = Array.from(db.intelligenceSourceHealth.values()).find((h) => h.sourceId === s.id);
      const cred = Array.from(db.intelligenceSourceCredentials.values()).find((c) => c.sourceId === s.id);
      return {
        ...s,
        healthStatus: health?.status || 'UNKNOWN',
        stalenessHours: health?.stalenessHours ?? null,
        // Never expose keyHash or raw credentials
        credentialSummary: cred
          ? { id: cred.id, authScheme: cred.authScheme, maskedPreview: cred.maskedPreview, rotationStatus: cred.rotationStatus }
          : null,
      };
    });
  return res.json(sources);
});

v12Router.post('/intelligence/sources', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const {
    sourceName,
    sourceCategory,
    sourceClassification,
    jurisdiction,
    endpointOrReference,
    accessMethod,
    licensingRestrictions,
    commercialRedistributionAllowed,
    updateFrequencyHours,
    apiSecretForStorageOnly,
  } = req.body || {};

  if (!sourceName || !sourceCategory || !sourceClassification || !jurisdiction) {
    return res.status(400).json({ error: 'sourceName, sourceCategory, sourceClassification, and jurisdiction are required.' });
  }
  const injCheck = detectPromptInjection(`${sourceName} ${endpointOrReference || ''} ${licensingRestrictions || ''}`);
  if (injCheck.flagged) {
    return res.status(400).json({ error: 'MALICIOUS_SOURCE_METADATA_BLOCKED', message: 'Prompt injection or script content rejected.' });
  }

  const now = new Date().toISOString();
  const id = `SRC-${jurisdiction.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const isApprovedAdmin = ctx.isPlatformAdmin;

  const newSource: IntelligenceSource = {
    id,
    tenantId: ctx.tenantId,
    jurisdiction: jurisdiction.toUpperCase(),
    sourceReference: id,
    verificationStatus: isApprovedAdmin ? 'VERIFIED' : 'PENDING_REVIEW',
    accessClassification: req.body.accessClassification || 'PUBLIC',
    provenance: `Registered by ${ctx.userId || ctx.tenantId}`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    sourceName: sanitizeExternalSourceText(sourceName).sanitized,
    sourceCategory,
    sourceClassification,
    endpointOrReference: endpointOrReference || 'manual://upload',
    accessMethod: accessMethod || 'JSON_IMPORT',
    connectionStatus: endpointOrReference?.startsWith('http') ? 'REFERENCE_DIRECTORY' : 'LOCAL_ONLY',
    authenticationRequired: Boolean(apiSecretForStorageOnly),
    licensingRestrictions: licensingRestrictions || 'Internal AETHER–AROS authorized analytical use only.',
    commercialRedistributionAllowed: Boolean(commercialRedistributionAllowed),
    updateFrequencyHours: Number(updateFrequencyHours || 24),
    reliabilityScorePct: isApprovedAdmin ? 85 : 50,
    adminApprovalStatus: isApprovedAdmin ? 'APPROVED' : 'PENDING_APPROVAL',
    approvedBy: isApprovedAdmin ? ctx.userId : undefined,
  };
  db.intelligenceSources.set(newSource.id, newSource);

  // Store hashed credential safely (never leaked in API JSON)
  if (apiSecretForStorageOnly) {
    const rawSec = String(apiSecretForStorageOnly);
    const credId = `CRED-${newSource.id}`;
    db.intelligenceSourceCredentials.set(credId, {
      id: credId,
      tenantId: ctx.tenantId,
      jurisdiction: newSource.jurisdiction,
      sourceReference: newSource.id,
      verificationStatus: 'VERIFIED',
      accessClassification: 'CONFIDENTIAL',
      provenance: 'Hashed source credential vault',
      retentionPolicy: '7_YEARS_STATUTORY',
      createdAt: now,
      updatedAt: now,
      sourceId: newSource.id,
      authScheme: 'API_KEY',
      keyHash: `0x${crypto.createHash('sha256').update(rawSec).digest('hex')}`,
      maskedPreview: rawSec.length > 6 ? `${rawSec.slice(0, 3)}****${rawSec.slice(-3)}` : '****',
      rotationStatus: 'ACTIVE',
    });
  }

  db.intelligenceSourceHealth.set(`HLTH-${newSource.id}`, {
    id: `HLTH-${newSource.id}`,
    tenantId: ctx.tenantId,
    jurisdiction: newSource.jurisdiction,
    sourceReference: newSource.id,
    verificationStatus: 'VERIFIED',
    accessClassification: 'PUBLIC',
    provenance: 'Source monitor initializer',
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    sourceId: newSource.id,
    sourceName: newSource.sourceName,
    status: 'HEALTHY',
    lastCheckedAt: now,
    stalenessHours: 0,
    duplicateRatePct: 0,
    formatDriftDetected: false,
    abnormalValueCount: 0,
    missingUpdateCount: 0,
    diagnosticNotes: 'Source registered cleanly.',
  });

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: newSource.jurisdiction,
    actorId: ctx.userId || 'api-caller',
    actorRole: ctx.role || 'MEMBER',
    actionType: 'SOURCE_REGISTERED',
    entityType: 'INTELLIGENCE_SOURCE',
    entityId: newSource.id,
    details: `Registered ${newSource.sourceName} (${newSource.sourceClassification}, approval=${newSource.adminApprovalStatus}).`,
  });

  db.scheduleSave();
  return res.status(201).json(newSource);
});

v12Router.get('/intelligence/sources/:id', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const src = db.intelligenceSources.get(req.params.id);
  if (!src) return res.status(404).json({ error: `Source ${req.params.id} not found.` });
  if (!canReadRecord(ctx, src)) {
    return res.status(403).json({ error: 'ACCESS_DENIED_SOURCE_CLASSIFICATION' });
  }
  const health = Array.from(db.intelligenceSourceHealth.values()).find((h) => h.sourceId === src.id);
  const cred = Array.from(db.intelligenceSourceCredentials.values()).find((c) => c.sourceId === src.id);
  return res.json({
    ...src,
    health: health || null,
    credentialSummary: cred
      ? { id: cred.id, authScheme: cred.authScheme, maskedPreview: cred.maskedPreview, rotationStatus: cred.rotationStatus }
      : null,
  });
});

v12Router.post('/intelligence/sources/:id/verify', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  if (!ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'FORBIDDEN: Only PLATFORM_ADMIN may approve or verify intelligence sources.' });
  }
  const src = db.intelligenceSources.get(req.params.id);
  if (!src) return res.status(404).json({ error: `Source ${req.params.id} not found.` });

  src.adminApprovalStatus = req.body?.decision === 'SUSPEND' ? 'SUSPENDED' : 'APPROVED';
  src.verificationStatus = src.adminApprovalStatus === 'APPROVED' ? 'VERIFIED' : 'DISPUTED';
  src.approvedBy = ctx.userId || 'usr_admin_01';
  src.reliabilityScorePct = Number(req.body?.reliabilityScorePct || Math.max(src.reliabilityScorePct, 88));
  src.updatedAt = new Date().toISOString();
  db.intelligenceSources.set(src.id, src);

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: src.jurisdiction,
    actorId: ctx.userId || 'usr_admin_01',
    actorRole: ctx.role || 'PLATFORM_ADMIN',
    actionType: 'SOURCE_VERIFIED',
    entityType: 'INTELLIGENCE_SOURCE',
    entityId: src.id,
    details: `Source ${src.id} updated to adminApprovalStatus=${src.adminApprovalStatus}.`,
  });

  db.scheduleSave();
  return res.json(src);
});

v12Router.post('/intelligence/sources/:id/refresh', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const src = db.intelligenceSources.get(req.params.id);
  if (!src) return res.status(404).json({ error: `Source ${req.params.id} not found.` });
  const now = new Date().toISOString();

  if (src.connectionStatus === 'NOT_CONFIGURED') {
    src.lastFailedRetrieval = now;
    src.updatedAt = now;
    db.intelligenceSources.set(src.id, src);
    const hlth = Array.from(db.intelligenceSourceHealth.values()).find((h) => h.sourceId === src.id);
    if (hlth) {
      hlth.status = 'NOT_CONFIGURED';
      hlth.lastCheckedAt = now;
      db.intelligenceSourceHealth.set(hlth.id, hlth);
    }
    db.scheduleSave();
    return res.status(200).json({
      refreshed: false,
      connectionStatus: src.connectionStatus,
      message: 'External source API not configured; existing verified observations retained and V1–V11 workflows unaffected.',
    });
  }

  src.lastSuccessfulRetrieval = now;
  src.updatedAt = now;
  db.intelligenceSources.set(src.id, src);
  const hlth = Array.from(db.intelligenceSourceHealth.values()).find((h) => h.sourceId === src.id);
  if (hlth) {
    hlth.status = 'HEALTHY';
    hlth.stalenessHours = 0;
    hlth.lastCheckedAt = now;
    db.intelligenceSourceHealth.set(hlth.id, hlth);
  }
  invalidatePublicIntelligenceCache();
  db.scheduleSave();
  return res.json({ refreshed: true, sourceId: src.id, refreshedAt: now, tenantId: ctx.tenantId });
});

// ==========================================
// 3. ECONOMIC INDICATORS & OBSERVATIONS (§4, §21, §27)
// ==========================================

v12Router.get('/economy/indicators', requireTenantContext, v12RateLimit('v12-read', 600), (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const jurisdiction = (req.query.jurisdiction as string | undefined)?.toUpperCase();
  const sector = (req.query.sector as string | undefined)?.toLowerCase();
  const search = (req.query.q as string | undefined)?.toLowerCase();

  const { data, cacheHit } = getPublicCachedOrCompute(
    `indicators:${jurisdiction || 'ALL'}:${sector || 'ALL'}:${search || 'ALL'}`,
    'PUBLIC',
    15_000,
    () => {
      let items = Array.from(db.economicIndicators.values()).filter((ind) => canReadRecord(ctx, ind));
      if (jurisdiction && jurisdiction !== 'ALL') {
        items = items.filter((i) => i.jurisdiction === jurisdiction);
      }
      if (sector) {
        items = items.filter((i) => i.sector.toLowerCase().includes(sector));
      }
      if (search) {
        items = items.filter(
          (i) =>
            i.name.toLowerCase().includes(search) ||
            i.code.toLowerCase().includes(search) ||
            i.category.toLowerCase().includes(search)
        );
      }
      return items;
    }
  );

  return res.json({ indicators: data, cacheHit, total: data.length });
});

v12Router.get('/economy/indicators/:id', requireTenantContext, v12RateLimit('v12-read', 600), (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const ind = db.economicIndicators.get(req.params.id);
  if (!ind) return res.status(404).json({ error: `Indicator ${req.params.id} not found.` });
  if (!canReadRecord(ctx, ind)) return res.status(403).json({ error: 'ACCESS_DENIED' });

  const definition = db.economicIndicatorDefinitions.get(ind.definitionId) || null;
  const timeSeries = db.economicTimeSeries.get(`TS-${ind.id}`) || null;
  return res.json({ indicator: ind, definition, timeSeries });
});

v12Router.get('/economy/observations', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const indicatorId = req.query.indicatorId as string | undefined;
  const jurisdiction = (req.query.jurisdiction as string | undefined)?.toUpperCase();

  let obs = Array.from(db.economicObservations.values()).filter((o) => canReadRecord(ctx, o));
  if (indicatorId) obs = obs.filter((o) => o.indicatorId === indicatorId);
  if (jurisdiction && jurisdiction !== 'ALL') obs = obs.filter((o) => o.jurisdiction === jurisdiction);
  obs.sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  return res.json(obs);
});

v12Router.post('/economy/observations/import', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { sourceId, format, csvPayload, observations } = req.body || {};
  if (!sourceId) return res.status(400).json({ error: 'sourceId is required for provenance tracking.' });

  const result = ingestEconomicObservations({
    sourceId,
    tenantId: ctx.tenantId,
    actorId: ctx.userId || 'importer',
    actorRole: ctx.role || 'MEMBER',
    format: format || 'JSON',
    csvPayload,
    observations,
  });

  if (result.accepted.length === 0 && result.rejected.length > 0) {
    return res.status(400).json(result);
  }
  return res.status(201).json(result);
});

v12Router.get('/economy/regional', requireTenantContext, (req: Request, res: Response) => {
  const scope = ((req.query.scope as string) || 'ALL').toUpperCase();
  const indicators = Array.from(db.economicIndicators.values());
  const defs = Array.from(db.economicIndicatorDefinitions.values());
  const filtered = scope === 'ALL' ? indicators : indicators.filter((i) => i.jurisdiction === scope);
  return res.json({
    scope,
    indicators: filtered,
    definitionalDifferences: defs
      .filter((d) => d.definitionalDifferencesByJurisdiction)
      .map((d) => ({ code: d.code, differences: d.definitionalDifferencesByJurisdiction })),
    completenessDisclosure: 'Regional views reflect exclusively verified datasets held on this node; unavailable indicators remain marked UNAVAILABLE.',
  });
});

// ==========================================
// 4. FORECASTS, EVALUATION & MODEL GOVERNANCE (§6, §22, §23, §27)
// ==========================================

v12Router.get('/forecasts', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const domain = req.query.domain as string | undefined;
  const horizon = req.query.horizon as string | undefined;
  let items = Array.from(db.v12EconomicForecasts.values()).filter((f) => canReadRecord(ctx, f));
  if (domain) items = items.filter((f) => f.domain === domain);
  if (horizon) items = items.filter((f) => f.horizon === horizon);
  items.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  return res.json(items);
});

v12Router.post('/forecasts/generate', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { indicatorId, domain, horizon, modelId, asyncQueue, idempotencyKey } = req.body || {};
  if (!indicatorId || !domain || !horizon) {
    return res.status(400).json({ error: 'indicatorId, domain, and horizon are required.' });
  }

  if (asyncQueue) {
    const queued = enqueueV12Job({
      jobType: 'FORECAST_GENERATION',
      priority: 'HIGH',
      tenantId: ctx.tenantId,
      idempotencyKey: idempotencyKey || `fc-${indicatorId}-${horizon}-${modelId || 'auto'}-${Date.now()}`,
      payload: { indicatorId, domain, horizon, modelId },
      actorId: ctx.userId || 'analyst',
      actorRole: ctx.role || 'MEMBER',
    });
    if (!queued.accepted) return res.status(429).json({ error: queued.error });
    return res.status(202).json({ queued: true, deduplicated: queued.deduplicated, job: queued.job });
  }

  const result = generateStatisticalForecast({
    indicatorId,
    domain,
    horizon,
    modelId,
    tenantId: ctx.tenantId,
    actorId: ctx.userId || 'analyst',
    actorRole: ctx.role || 'MEMBER',
  });
  if (!result.success) {
    return res.status(400).json({ error: result.error, code: result.code });
  }
  return res.status(201).json(result.forecast);
});

v12Router.get('/forecasts/accuracy/history', requireTenantContext, (_req: Request, res: Response) => {
  return res.json(Array.from(db.forecastAccuracyHistory.values()));
});

v12Router.get('/forecasts/:id', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const fc = db.v12EconomicForecasts.get(req.params.id);
  if (!fc) return res.status(404).json({ error: `Forecast ${req.params.id} not found.` });
  if (!canReadRecord(ctx, fc)) return res.status(403).json({ error: 'ACCESS_DENIED' });
  return res.json(fc);
});

v12Router.get('/forecasts/:id/evaluation', requireTenantContext, (req: Request, res: Response) => {
  const fc = db.v12EconomicForecasts.get(req.params.id);
  if (!fc) return res.status(404).json({ error: `Forecast ${req.params.id} not found.` });
  const evals = Array.from(db.forecastEvaluations.values()).filter((e) => e.forecastId === fc.id);
  const model = db.forecastModels.get(fc.modelId);
  return res.json({
    forecastId: fc.id,
    modelId: fc.modelId,
    modelVersion: fc.modelVersion,
    modelMetrics: model?.errorMetrics || fc.validationMetrics,
    evaluations: evals,
  });
});

v12Router.post('/forecasts/:id/evaluate', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const actualValue = Number(req.body?.actualValue);
  const result = evaluateForecastAgainstActual({
    forecastId: req.params.id,
    actualValue,
    actualObservationId: req.body?.actualObservationId,
    actorId: ctx.userId || 'evaluator',
    actorRole: ctx.role || 'MEMBER',
  });
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(201).json(result);
});

// ==========================================
// 5. ANOMALIES, EARLY WARNINGS & OPPORTUNITIES (§7, §8, §9, §27)
// ==========================================

v12Router.get('/intelligence/anomalies', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const list = Array.from(db.economicAnomalies.values()).filter((a) => canReadRecord(ctx, a));
  return res.json(list);
});

v12Router.post('/intelligence/anomalies/detect', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const detected = scanEconomicAnomalies(ctx.tenantId, ctx.userId || 'scanner', ctx.role || 'MEMBER');
  return res.json({ newlyDetectedCount: detected.length, anomalies: detected });
});

v12Router.post('/intelligence/anomalies/:id/review', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const anom = db.economicAnomalies.get(req.params.id);
  if (!anom) return res.status(404).json({ error: `Anomaly ${req.params.id} not found.` });
  const { reviewStatus, notes } = req.body || {};
  if (!['UNDER_INVESTIGATION', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED'].includes(reviewStatus)) {
    return res.status(400).json({ error: 'Invalid reviewStatus.' });
  }
  const now = new Date().toISOString();
  anom.reviewStatus = reviewStatus;
  anom.updatedAt = now;
  anom.resolutionHistory.push({
    timestamp: now,
    actor: ctx.userId || 'reviewer',
    status: reviewStatus,
    notes: notes || 'Human investigation recorded.',
  });
  db.economicAnomalies.set(anom.id, anom);
  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: anom.jurisdiction,
    actorId: ctx.userId || 'reviewer',
    actorRole: ctx.role || 'MEMBER',
    actionType: 'ANOMALY_REVIEWED',
    entityType: 'ECONOMIC_ANOMALY',
    entityId: anom.id,
    details: `Anomaly ${anom.id} transitioned to ${reviewStatus}: ${notes || ''}`,
  });
  db.scheduleSave();
  return res.json(anom);
});

v12Router.get('/intelligence/warnings', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const list = Array.from(db.economicEarlyWarnings.values()).filter((w) => canReadRecord(ctx, w));
  return res.json(list);
});

v12Router.post('/intelligence/warnings', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { title, riskDomain, severity, evidenceSummary, sourceReferences, expectedImpact, isPublicAlert } = req.body || {};

  if (!title || !riskDomain || !severity || !evidenceSummary) {
    return res.status(400).json({ error: 'title, riskDomain, severity, and evidenceSummary are required.' });
  }
  if (!Array.isArray(sourceReferences) || sourceReferences.length === 0) {
    return res.status(400).json({ error: 'EVIDENCE_REQUIRED: sourceReferences cannot be empty for early warnings.' });
  }

  // Prevent unauthorized public or CRITICAL emergency warning issuance
  if ((isPublicAlert || severity === 'CRITICAL') && !ctx.isPlatformAdmin) {
    return res.status(403).json({
      error: 'UNAUTHORIZED_PUBLIC_WARNING',
      message: 'Public emergency or CRITICAL alerts require PLATFORM_ADMIN authorization.',
    });
  }

  const now = new Date().toISOString();
  const warn: V12EconomicEarlyWarning = {
    id: `EWR-V12-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    jurisdiction: (req.body.jurisdiction || 'UG').toUpperCase(),
    sourceReference: sourceReferences[0],
    verificationStatus: 'VERIFIED',
    accessClassification: isPublicAlert ? 'PUBLIC' : 'RESTRICTED',
    provenance: `Platform intelligence risk signal backed by ${sourceReferences.join(', ')}`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    eventCode: `EWR-${Date.now().toString(36).toUpperCase()}`,
    title,
    riskDomain,
    severity,
    affectedSectors: req.body.affectedSectors || ['Multi-Sector Economy'],
    evidenceSummary,
    sourceReferences,
    detectedAt: now,
    expectedImpact: expectedImpact || 'Requires operational contingency review.',
    potentialAffectedParticipants: req.body.potentialAffectedParticipants || [],
    forecastHorizon: req.body.forecastHorizon || '14-30 DAYS',
    recommendedPreventiveAction: req.body.recommendedPreventiveAction || 'Review corridor/supplier contingency options.',
    escalationRequirements: severity === 'CRITICAL' ? 'Escalate immediately to PLATFORM_ADMIN and compliance desk.' : 'Monitor via Early Warning Centre.',
    isPublicAlert: Boolean(isPublicAlert),
    authorizedPublicPublisher: isPublicAlert ? ctx.userId || 'usr_admin_01' : undefined,
    officialGovernmentDisclaimer: 'PLATFORM INTELLIGENCE SIGNAL ONLY: Not an official government or statutory emergency-service warning.',
    reviewStatus: severity === 'CRITICAL' ? 'ESCALATED' : 'ACTIVE',
  };
  db.economicEarlyWarnings.set(warn.id, warn);

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: warn.jurisdiction,
    actorId: ctx.userId || 'risk-analyst',
    actorRole: ctx.role || 'MEMBER',
    actionType: 'EARLY_WARNING_ISSUED',
    entityType: 'EARLY_WARNING',
    entityId: warn.id,
    details: `Issued ${warn.severity} warning (${warn.riskDomain}, public=${warn.isPublicAlert}).`,
  });
  db.scheduleSave();
  return res.status(201).json(warn);
});

v12Router.post('/intelligence/warnings/:id/review', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const warn = db.economicEarlyWarnings.get(req.params.id);
  if (!warn) return res.status(404).json({ error: `Warning ${req.params.id} not found.` });

  const { reviewStatus, notes } = req.body || {};
  if (!['UNDER_REVIEW', 'ESCALATED', 'MITIGATED', 'CLOSED'].includes(reviewStatus)) {
    return res.status(400).json({ error: 'Invalid warning reviewStatus.' });
  }
  const now = new Date().toISOString();
  warn.reviewStatus = reviewStatus;
  warn.reviewNotes = notes || warn.reviewNotes;
  warn.updatedAt = now;
  if (reviewStatus === 'CLOSED') warn.closedAt = now;
  db.economicEarlyWarnings.set(warn.id, warn);

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: warn.jurisdiction,
    actorId: ctx.userId || 'reviewer',
    actorRole: ctx.role || 'MEMBER',
    actionType: reviewStatus === 'CLOSED' ? 'EARLY_WARNING_CLOSED' : 'EARLY_WARNING_ISSUED',
    entityType: 'EARLY_WARNING',
    entityId: warn.id,
    details: `Early warning ${warn.id} updated to ${reviewStatus}: ${notes || ''}`,
  });
  db.scheduleSave();
  return res.json(warn);
});

v12Router.get('/intelligence/opportunities', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const list = Array.from(db.v12EconomicOpportunities.values()).filter((o) => canReadRecord(ctx, o));
  return res.json(list);
});

v12Router.get('/intelligence/opportunities/:id', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const opp = db.v12EconomicOpportunities.get(req.params.id);
  if (!opp) return res.status(404).json({ error: `Opportunity ${req.params.id} not found.` });
  if (!canReadRecord(ctx, opp)) return res.status(403).json({ error: 'ACCESS_DENIED' });
  return res.json(opp);
});

// ==========================================
// 6. SIMULATIONS, BUSINESS IMPACT & STRESS TESTING (§10, §11, §12, §27)
// ==========================================

v12Router.get('/simulations', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const scenarios = Array.from(db.economicScenarios.values()).filter((s) => canReadRecord(ctx, s));
  const results = Array.from(db.scenarioSimulationResults.values()).filter((r) => canReadRecord(ctx, r));
  return res.json({ scenarios, results });
});

v12Router.post('/simulations', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = runEconomicScenarioSimulation({
    scenarioName: req.body?.scenarioName,
    scenarioType: req.body?.scenarioType || 'TRANSPORT_COST_INCREASE',
    description: req.body?.description || '',
    shockVariable: req.body?.shockVariable || 'corridor_freight_cost_usd_mt',
    baselineValue: Number(req.body?.baselineValue),
    shockPct: Number(req.body?.shockPct),
    unit: req.body?.unit || 'USD/MT',
    affectedJurisdictions: req.body?.affectedJurisdictions || ['UG'],
    affectedSectors: req.body?.affectedSectors || ['Logistics & Trade'],
    timeHorizon: req.body?.timeHorizon || '30 DAYS',
    tenantId: ctx.tenantId,
    actorId: ctx.userId || 'analyst',
    actorRole: ctx.role || 'MEMBER',
  });
  if (!out.success) return res.status(400).json({ error: out.error });
  return res.status(201).json({ scenario: out.scenario, result: out.result });
});

v12Router.get('/simulations/business-impact', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  // Strict tenant isolation: never return other tenant business impact simulations!
  const list = Array.from(db.businessImpactSimulations.values()).filter(
    (b) => ctx.isPlatformAdmin ? b.tenantId === ctx.tenantId || req.query.all === 'true' : b.tenantId === ctx.tenantId
  );
  return res.json(list);
});

v12Router.post('/simulations/business-impact', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const sim = runBusinessImpactSimulation({
    tenantId: ctx.tenantId,
    actorId: ctx.userId || 'biz-user',
    actorRole: ctx.role || 'MEMBER',
    supplierCostDeltaPct: Number(req.body?.supplierCostDeltaPct ?? 5),
    productDemandDeltaPct: Number(req.body?.productDemandDeltaPct ?? 3),
    fxExposureDeltaPct: Number(req.body?.fxExposureDeltaPct ?? 2),
    inventoryCostDeltaPct: Number(req.body?.inventoryCostDeltaPct ?? 3),
    transportExpenseDeltaPct: Number(req.body?.transportExpenseDeltaPct ?? 8),
    payrollDeltaPct: Number(req.body?.payrollDeltaPct ?? 2),
    currency: req.body?.currency,
  });
  return res.status(201).json(sim);
});

v12Router.post('/simulations/stress-test', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = runEconomicScenarioSimulation({
    scenarioName: req.body?.scenarioName || 'Regional Multi-Corridor Stress Test',
    scenarioType: 'MULTI_COUNTRY_STRESS',
    description: req.body?.description || 'Simultaneous fuel, corridor, and liquidity shock model.',
    shockVariable: req.body?.shockVariable || 'regional_supply_continuity_cost',
    baselineValue: Number(req.body?.baselineValue || 100),
    shockPct: Number(req.body?.shockPct || 25),
    unit: req.body?.unit || 'INDEX',
    affectedJurisdictions: req.body?.affectedJurisdictions || ['UG', 'KE', 'TZ'],
    affectedSectors: req.body?.affectedSectors || ['Trade Corridors', 'Manufacturing', 'Food Supply'],
    timeHorizon: req.body?.timeHorizon || '90 DAYS',
    tenantId: ctx.tenantId,
    actorId: ctx.userId || 'analyst',
    actorRole: ctx.role || 'MEMBER',
  });
  if (!out.success) return res.status(400).json({ error: out.error });
  return res.status(201).json({ scenario: out.scenario, result: out.result, disclaimer: 'Stress test only; AETHER–AROS does not claim control over national economic policy.' });
});

v12Router.get('/simulations/:id', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const scen = db.economicScenarios.get(req.params.id);
  if (!scen) return res.status(404).json({ error: `Scenario ${req.params.id} not found.` });
  if (!canReadRecord(ctx, scen)) return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  const result = Array.from(db.scenarioSimulationResults.values()).find((r) => r.scenarioId === scen.id) || null;
  return res.json({ scenario: scen, result });
});

v12Router.post('/simulations/:id/compare', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const scen = db.economicScenarios.get(req.params.id);
  if (!scen) return res.status(404).json({ error: `Scenario ${req.params.id} not found.` });
  if (!canReadRecord(ctx, scen)) return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  const result = Array.from(db.scenarioSimulationResults.values()).find((r) => r.scenarioId === scen.id);
  const customShocks: number[] = Array.isArray(req.body?.shockPercentages) ? req.body.shockPercentages : [0, 10, 25, -10];
  const baseVar = scen.inputVariables[0]?.baselineValue || 100;
  const comparisons = customShocks.map((pct) => ({
    shockPct: pct,
    projectedValue: Number((baseVar * (1 + pct / 100)).toFixed(2)),
    downstreamPriceImpactPct: Number((pct * 0.35).toFixed(2)),
    label: 'SIMULATED_SCENARIO',
  }));
  return res.json({ scenarioId: scen.id, label: 'SIMULATED_SCENARIO', existingResult: result, comparisons });
});

// ==========================================
// 7. RECOMMENDATIONS & SUPPLIER/TRADE INTELLIGENCE (§13, §14, §15, §27)
// ==========================================

v12Router.get('/recommendations', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const recs = Array.from(db.economicRecommendations.values()).filter((r) => canReadRecord(ctx, r));
  return res.json(recs);
});

v12Router.post('/recommendations/generate', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const rec = generateCoordinationRecommendation({
    tenantId: ctx.tenantId,
    targetParticipantName: req.body?.targetParticipantName,
    recommendationType: req.body?.recommendationType || 'INVENTORY_REVIEW',
    sourceIntelligenceIds: req.body?.sourceIntelligenceIds || ['IND-UG-MAIZE-WHOLESALE'],
    recommendedAction: req.body?.recommendedAction || 'Review procurement buffer levels and prequalified suppliers.',
    explanation: req.body?.explanation || 'Generated from verified indicator & early-warning signals.',
    actorId: ctx.userId || 'coordinator',
    actorRole: ctx.role || 'MEMBER',
  });
  return res.status(201).json(rec);
});

v12Router.post('/recommendations/:id/approve', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const rec = db.economicRecommendations.get(req.params.id);
  if (!rec) return res.status(404).json({ error: `Recommendation ${req.params.id} not found.` });
  if (!canReadRecord(ctx, rec)) return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });

  // Recommendations NEVER silently trigger financial transfers
  if (req.body?.autoExecuteFinancialTransfer) {
    return res.status(403).json({
      error: 'PROHIBITED_AUTO_FINANCIAL_EXECUTION',
      message: 'Recommendations cannot directly execute financial transfers; submit through human-approved V10/V11 settlement workflows.',
    });
  }

  rec.approvalStatus = 'APPROVED';
  rec.reviewedBy = ctx.userId || 'human-approver';
  rec.reviewedAt = new Date().toISOString();
  rec.reviewNotes = req.body?.notes || 'Approved for operational action by human operator.';
  rec.updatedAt = rec.reviewedAt;
  db.economicRecommendations.set(rec.id, rec);

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: rec.jurisdiction,
    actorId: rec.reviewedBy,
    actorRole: ctx.role || 'MEMBER',
    actionType: 'RECOMMENDATION_DECIDED',
    entityType: 'ECONOMIC_RECOMMENDATION',
    entityId: rec.id,
    details: `Recommendation ${rec.id} APPROVED by human operator ${rec.reviewedBy}.`,
  });
  db.scheduleSave();
  return res.json(rec);
});

v12Router.post('/recommendations/:id/reject', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const rec = db.economicRecommendations.get(req.params.id);
  if (!rec) return res.status(404).json({ error: `Recommendation ${req.params.id} not found.` });
  if (!canReadRecord(ctx, rec)) return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });

  rec.approvalStatus = 'REJECTED';
  rec.reviewedBy = ctx.userId || 'human-reviewer';
  rec.reviewedAt = new Date().toISOString();
  rec.reviewNotes = req.body?.notes || 'Rejected by human operator.';
  rec.updatedAt = rec.reviewedAt;
  db.economicRecommendations.set(rec.id, rec);
  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: rec.jurisdiction,
    actorId: rec.reviewedBy,
    actorRole: ctx.role || 'MEMBER',
    actionType: 'RECOMMENDATION_DECIDED',
    entityType: 'ECONOMIC_RECOMMENDATION',
    entityId: rec.id,
    details: `Recommendation ${rec.id} REJECTED: ${rec.reviewNotes}`,
  });
  db.scheduleSave();
  return res.json(rec);
});

v12Router.get('/intelligence/trade-logistics', requireTenantContext, (_req: Request, res: Response) => {
  const corridors = Array.from(db.economicCorridors.values());
  const carriers = Array.from(db.logisticsCarriers.values());
  const shipments = Array.from(db.supplyChainShipments.values());
  const suppliers = Array.from(db.supplierQualifications.values());
  return res.json({
    corridors,
    carriers: carriers.map((c) => ({
      id: c.id,
      carrierName: c.carrierName,
      modes: c.modes,
      corridorsCovered: c.corridorsCovered,
      trackingSourceType: c.trackingSourceType,
      verificationStatus: c.verificationStatus,
      deliveryEstimateBasis: 'HISTORICAL_ESTIMATE',
    })),
    activeShipments: shipments.map((s) => ({
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      origin: s.originLocation,
      destination: s.destinationLocation,
      status: s.currentStatus,
      estimatedDelivery: s.estimatedDelivery,
      deliveryTimeClassification: s.actualEventsOnly ? 'PROVIDER_CONFIRMED_MILESTONES' : 'MODEL_GENERATED_ESTIMATE',
    })),
    qualifiedSuppliers: suppliers,
    disclosure: 'Delivery-time assessments clearly distinguish provider-confirmed milestones from historical estimates. Live GPS telemetry is not fabricated.',
  });
});

// ==========================================
// 8. AI ECONOMIC INTELLIGENCE ASSISTANT & 15 GOVERNED AGENTS (§16, §17, §18, §27, §30)
// ==========================================

v12Router.post('/assistant/query', requireTenantContext, v12RateLimit('v12-assistant', 25), async (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const question = String(req.body?.question || '').trim();
  if (!question) return res.status(400).json({ error: 'question is required.' });

  const jurisdictionFilter = (req.body?.jurisdiction as string | undefined)?.toUpperCase() || 'ALL';
  const authorizedIndicators = Array.from(db.economicIndicators.values())
    .filter((i) => canReadRecord(ctx, i) && (jurisdictionFilter === 'ALL' || i.jurisdiction === jurisdictionFilter))
    .map((i) => ({
      id: i.id,
      code: i.code,
      name: i.name,
      latestValue: i.latestValue,
      unit: i.unit,
      availabilityStatus: i.availabilityStatus,
      unavailableReason: i.unavailableReason,
      sourceReference: i.sourceReference,
      sourceClassification: i.sourceClassification,
      effectivePeriod: i.effectivePeriod,
    }));

  const authorizedForecasts = Array.from(db.v12EconomicForecasts.values())
    .filter((f) => canReadRecord(ctx, f) && !f.suspendedDueToDrift)
    .map((f) => ({
      id: f.id,
      indicatorName: f.indicatorName,
      horizon: f.horizon,
      expectedValue: f.expectedValue,
      unit: f.unit,
      confidenceClassification: f.confidenceClassification,
      modelVersion: f.modelVersion,
      sourceReference: f.sourceReference,
    }));

  const authorizedWarnings = Array.from(db.economicEarlyWarnings.values())
    .filter((w) => canReadRecord(ctx, w) && w.reviewStatus !== 'CLOSED')
    .map((w) => ({
      id: w.id,
      title: w.title,
      severity: w.severity,
      riskDomain: w.riskDomain,
      sourceReferences: w.sourceReferences,
    }));

  const authorizedOpportunities = Array.from(db.v12EconomicOpportunities.values())
    .filter((o) => canReadRecord(ctx, o) && o.status === 'ACTIVE')
    .map((o) => ({
      id: o.id,
      title: o.title,
      sector: o.sector,
      confidence: o.confidence,
      sourceReference: o.sourceReference,
    }));

  const synthesis = await executeV12EconomicAssistant({
    tenantId: ctx.tenantId,
    jurisdiction: jurisdictionFilter,
    question,
    agentType: req.body?.agentType || 'GLOBAL_ECONOMIC_RESEARCH',
    authorizedIndicators,
    authorizedForecasts,
    authorizedWarnings,
    authorizedOpportunities,
    authorizedExternalSnippets: req.body?.externalSnippets,
  });

  if (synthesis.promptInjectionBlocked) {
    return res.status(400).json(synthesis);
  }
  return res.json(synthesis);
});

v12Router.get('/agents', requireTenantContext, (_req: Request, res: Response) => {
  return res.json(Array.from(db.intelligenceAgentPolicies.values()));
});

v12Router.get('/agents/:id/runs', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const runs = Array.from(db.intelligenceAgentRuns.values()).filter(
    (r) => r.agentId === req.params.id && canReadRecord(ctx, r)
  );
  return res.json(runs);
});

v12Router.post('/agents/:id/run', requireTenantContext, v12RateLimit('v12-agents', 30), async (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const policy = db.intelligenceAgentPolicies.get(req.params.id);
  if (!policy) return res.status(404).json({ error: `Agent ${req.params.id} not found.` });

  const t0 = Date.now();
  const prompt = String(req.body?.prompt || 'Provide grounded economic briefing.');
  const requestedAction = String(req.body?.requestedAction || 'ANALYZE_AUTHORIZED_CONTEXT');
  const autonomyLevel = Math.min(5, Math.max(1, Number(req.body?.autonomyLevel || 1))) as 1 | 2 | 3 | 4 | 5;
  const now = new Date().toISOString();

  // Emergency circuit breaker enforcement
  if (policy.emergencyCircuitBreakerActive) {
    const haltedRun: IntelligenceAgentRun = {
      id: `AGTRUN-${Date.now().toString(36).toUpperCase()}`,
      tenantId: ctx.tenantId,
      jurisdiction: req.body?.jurisdiction || 'UG',
      sourceReference: policy.id,
      verificationStatus: 'VERIFIED',
      accessClassification: 'TENANT_PRIVATE',
      provenance: `Agent ${policy.agentCode}`,
      retentionPolicy: '7_YEARS_STATUTORY',
      createdAt: now,
      updatedAt: now,
      agentId: policy.id,
      agentType: policy.agentType,
      requestedAction,
      autonomyLevel,
      promptSummary: prompt.slice(0, 120),
      citedSourceIds: [],
      citedRecordsCount: 0,
      distinguishedFactsVsForecasts: true,
      promptInjectionStatus: 'CLEAN',
      outputValidationStatus: 'BLOCKED_POLICY_VIOLATION',
      humanEscalationRequired: true,
      dualAuthorizationRequired: autonomyLevel === 5,
      approvers: [],
      executionStatus: 'CIRCUIT_BREAKER_HALTED',
      responseText: `CIRCUIT_BREAKER_ACTIVE: Agent ${policy.agentCode} execution halted by administrator emergency stop.`,
      limitationsDisclosed: ['Emergency circuit breaker active.'],
      durationMs: Date.now() - t0,
      modelDependency: policy.modelDependency,
    };
    db.intelligenceAgentRuns.set(haltedRun.id, haltedRun);
    db.scheduleSave();
    return res.status(503).json(haltedRun);
  }

  // Prompt injection defense
  const inj = detectPromptInjection(`${prompt} ${requestedAction}`);
  if (inj.flagged) {
    const blockedRun: IntelligenceAgentRun = {
      id: `AGTRUN-${Date.now().toString(36).toUpperCase()}`,
      tenantId: ctx.tenantId,
      jurisdiction: req.body?.jurisdiction || 'UG',
      sourceReference: policy.id,
      verificationStatus: 'VERIFIED',
      accessClassification: 'TENANT_PRIVATE',
      provenance: `Agent ${policy.agentCode}`,
      retentionPolicy: '7_YEARS_STATUTORY',
      createdAt: now,
      updatedAt: now,
      agentId: policy.id,
      agentType: policy.agentType,
      requestedAction,
      autonomyLevel,
      promptSummary: '[BLOCKED_PROMPT_INJECTION]',
      citedSourceIds: [],
      citedRecordsCount: 0,
      distinguishedFactsVsForecasts: true,
      promptInjectionStatus: 'BLOCKED_INJECTION_ATTEMPT',
      outputValidationStatus: 'BLOCKED_POLICY_VIOLATION',
      humanEscalationRequired: true,
      dualAuthorizationRequired: false,
      approvers: [],
      executionStatus: 'BLOCKED_BOUNDARY',
      responseText: 'Prompt injection attempt blocked cleanly; governance policy remains enforced.',
      limitationsDisclosed: ['Instruction-override payload quarantined.'],
      durationMs: Date.now() - t0,
      modelDependency: 'SECURITY_GUARD_V12',
    };
    db.intelligenceAgentRuns.set(blockedRun.id, blockedRun);
    db.scheduleSave();
    return res.status(400).json(blockedRun);
  }

  // Level 5 High-Impact Controlled Action Gate: NEVER self-authorized by AI!
  if (autonomyLevel === 5 || requestedAction.toUpperCase().includes('RTGS') || requestedAction.toUpperCase().includes('GOVERNMENT')) {
    const l5Run: IntelligenceAgentRun = {
      id: `AGTRUN-${Date.now().toString(36).toUpperCase()}`,
      tenantId: ctx.tenantId,
      jurisdiction: req.body?.jurisdiction || 'UG',
      sourceReference: policy.id,
      verificationStatus: 'VERIFIED',
      accessClassification: 'TENANT_PRIVATE',
      provenance: `Agent ${policy.agentCode} Level-5 Governance Intercept`,
      retentionPolicy: '7_YEARS_STATUTORY',
      createdAt: now,
      updatedAt: now,
      agentId: policy.id,
      agentType: policy.agentType,
      requestedAction,
      autonomyLevel: 5,
      promptSummary: prompt.slice(0, 120),
      citedSourceIds: [],
      citedRecordsCount: 0,
      distinguishedFactsVsForecasts: true,
      promptInjectionStatus: 'CLEAN',
      outputValidationStatus: 'PASSED',
      humanEscalationRequired: true,
      dualAuthorizationRequired: true,
      approvers: [],
      executionStatus: 'PENDING_DUAL_AUTHORIZATION',
      responseText: 'LEVEL 5 GOVERNANCE HOLD: AI agents cannot self-authorize financial execution, regulated submissions, or agreement modifications. Two distinct human authorizers required.',
      limitationsDisclosed: ['Requires dual human authorization before downstream execution.'],
      durationMs: Date.now() - t0,
      modelDependency: policy.modelDependency,
    };
    db.intelligenceAgentRuns.set(l5Run.id, l5Run);
    db.intelligenceReviewQueue.set(`REVQ-${l5Run.id}`, {
      id: `REVQ-${l5Run.id}`,
      tenantId: ctx.tenantId,
      jurisdiction: l5Run.jurisdiction,
      sourceReference: l5Run.id,
      verificationStatus: 'PENDING_REVIEW',
      accessClassification: 'RESTRICTED',
      provenance: `Level 5 escalation from ${policy.agentCode}`,
      retentionPolicy: '7_YEARS_STATUTORY',
      createdAt: now,
      updatedAt: now,
      itemType: 'AI_LEVEL5_ESCALATION',
      targetId: l5Run.id,
      title: `Dual Authorization Required: ${requestedAction}`,
      riskReason: 'Level 5 controlled action requested via intelligence agent workflow.',
      requestedBy: ctx.userId || policy.agentCode,
      requiredRole: 'PLATFORM_ADMIN',
      dualAuthorizationRequired: true,
      approvalsReceived: [],
      status: 'PENDING_REVIEW',
    });
    logIntelligenceAudit({
      tenantId: ctx.tenantId,
      jurisdiction: l5Run.jurisdiction,
      actorId: ctx.userId || 'agent-caller',
      actorRole: ctx.role || 'MEMBER',
      actionType: 'AGENT_EXECUTED',
      entityType: 'INTELLIGENCE_AGENT_RUN',
      entityId: l5Run.id,
      details: `Level 5 action intercepted for dual human authorization (${requestedAction}).`,
    });
    db.scheduleSave();
    return res.status(202).json(l5Run);
  }

  // Levels 1-4 authorized intelligence execution
  const synthesis = await executeV12EconomicAssistant({
    tenantId: ctx.tenantId,
    jurisdiction: (req.body?.jurisdiction || 'ALL').toUpperCase(),
    question: prompt,
    agentType: policy.agentType,
    authorizedIndicators: Array.from(db.economicIndicators.values())
      .filter((i) => canReadRecord(ctx, i))
      .map((i) => ({
        id: i.id,
        code: i.code,
        name: i.name,
        latestValue: i.latestValue,
        unit: i.unit,
        availabilityStatus: i.availabilityStatus,
        unavailableReason: i.unavailableReason,
        sourceReference: i.sourceReference,
        sourceClassification: i.sourceClassification,
        effectivePeriod: i.effectivePeriod,
      })),
    authorizedForecasts: Array.from(db.v12EconomicForecasts.values())
      .filter((f) => canReadRecord(ctx, f) && !f.suspendedDueToDrift)
      .map((f) => ({
        id: f.id,
        indicatorName: f.indicatorName,
        horizon: f.horizon,
        expectedValue: f.expectedValue,
        unit: f.unit,
        confidenceClassification: f.confidenceClassification,
        modelVersion: f.modelVersion,
        sourceReference: f.sourceReference,
      })),
    authorizedWarnings: Array.from(db.economicEarlyWarnings.values())
      .filter((w) => canReadRecord(ctx, w) && w.reviewStatus !== 'CLOSED')
      .map((w) => ({
        id: w.id,
        title: w.title,
        severity: w.severity,
        riskDomain: w.riskDomain,
        sourceReferences: w.sourceReferences,
      })),
    authorizedOpportunities: Array.from(db.v12EconomicOpportunities.values())
      .filter((o) => canReadRecord(ctx, o) && o.status === 'ACTIVE')
      .map((o) => ({
        id: o.id,
        title: o.title,
        sector: o.sector,
        confidence: o.confidence,
        sourceReference: o.sourceReference,
      })),
  });

  const run: IntelligenceAgentRun = {
    id: `AGTRUN-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    jurisdiction: (req.body?.jurisdiction || 'UG').toUpperCase(),
    sourceReference: policy.id,
    verificationStatus: 'VERIFIED',
    accessClassification: 'TENANT_PRIVATE',
    provenance: `Agent ${policy.agentCode} (Autonomy Level ${autonomyLevel})`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    agentId: policy.id,
    agentType: policy.agentType,
    requestedAction,
    autonomyLevel,
    promptSummary: prompt.slice(0, 120),
    citedSourceIds: synthesis.citedSourceIds,
    citedRecordsCount: synthesis.citedSourceIds.length,
    distinguishedFactsVsForecasts: synthesis.distinguishedFactsVsForecasts,
    promptInjectionStatus: 'CLEAN',
    outputValidationStatus: synthesis.refusedDueToInsufficientData ? 'REFUSED_INSUFFICIENT_DATA' : 'PASSED',
    humanEscalationRequired: autonomyLevel >= 3,
    dualAuthorizationRequired: false,
    approvers: [],
    executionStatus: autonomyLevel >= 3 ? 'PENDING_HUMAN_APPROVAL' : 'COMPLETED',
    responseText: synthesis.answer,
    limitationsDisclosed: synthesis.limitations,
    durationMs: Date.now() - t0,
    modelDependency: synthesis.modelDependency,
  };

  db.intelligenceAgentRuns.set(run.id, run);
  policy.totalRunsCount += 1;
  policy.updatedAt = now;
  db.intelligenceAgentPolicies.set(policy.id, policy);

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: run.jurisdiction,
    actorId: ctx.userId || 'agent-caller',
    actorRole: ctx.role || 'MEMBER',
    actionType: 'AGENT_EXECUTED',
    entityType: 'INTELLIGENCE_AGENT_RUN',
    entityId: run.id,
    details: `Executed ${policy.agentCode} at Level ${autonomyLevel} -> ${run.executionStatus} (${run.citedRecordsCount} citations).`,
  });
  db.scheduleSave();
  return res.status(201).json(run);
});

v12Router.post('/agents/runs/:runId/approve', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  if (!ctx.isPlatformAdmin && ctx.role !== 'COOPERATIVE_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN: Authorized human reviewer role required.' });
  }
  const run = db.intelligenceAgentRuns.get(req.params.runId);
  if (!run) return res.status(404).json({ error: `Agent run ${req.params.runId} not found.` });

  const approverId = String(req.body?.approverId || ctx.userId || '').trim();
  if (!approverId) return res.status(400).json({ error: 'Distinct human approverId required.' });
  if (run.approvers.includes(approverId)) {
    return res.status(400).json({ error: 'DUAL_AUTHORIZATION_VIOLATION: Same human operator cannot sign twice.' });
  }

  run.approvers.push(approverId);
  if (run.dualAuthorizationRequired && run.approvers.length < 2) {
    run.executionStatus = 'PENDING_DUAL_AUTHORIZATION';
  } else {
    run.executionStatus = 'COMPLETED';
  }
  run.updatedAt = new Date().toISOString();
  db.intelligenceAgentRuns.set(run.id, run);
  db.scheduleSave();
  return res.json(run);
});

v12Router.post('/agents/circuit-breaker', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  if (!ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'FORBIDDEN: Only PLATFORM_ADMIN may engage or reset the AI emergency circuit breaker.' });
  }
  const active = Boolean(req.body?.active);
  const now = new Date().toISOString();
  db.intelligenceAgentPolicies.forEach((p) => {
    p.emergencyCircuitBreakerActive = active;
    p.updatedAt = now;
    db.intelligenceAgentPolicies.set(p.id, p);
  });
  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: 'EAC',
    actorId: ctx.userId || 'usr_admin_01',
    actorRole: 'PLATFORM_ADMIN',
    actionType: 'CIRCUIT_BREAKER_TOGGLED',
    entityType: 'AGENT_GOVERNANCE',
    entityId: 'GLOBAL_CIRCUIT_BREAKER',
    details: `AI emergency circuit breaker set to active=${active}.`,
  });
  db.scheduleSave();
  return res.json({ circuitBreakerActive: active, affectedAgentsCount: db.intelligenceAgentPolicies.size });
});

// ==========================================
// 9. GOVERNANCE, DRIFT, DATA QUALITY, REPORTS, SUBSCRIPTIONS, JOBS & MIGRATION (§22-§33)
// ==========================================

v12Router.get('/governance/models', requireTenantContext, (_req: Request, res: Response) => {
  return res.json({
    models: Array.from(db.forecastModels.values()),
    driftEvents: Array.from(db.modelDriftEvents.values()),
    evaluations: Array.from(db.forecastEvaluations.values()),
  });
});

v12Router.post('/governance/models/:id/transition', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = transitionModelStatus({
    modelId: req.params.id,
    targetStatus: req.body?.targetStatus,
    actorId: ctx.userId || 'anon',
    actorRole: ctx.role || 'MEMBER',
    notes: req.body?.notes,
  });
  if (!out.success) {
    return res.status(out.error?.startsWith('FORBIDDEN') ? 403 : 400).json({ error: out.error });
  }
  return res.json(out.model);
});

v12Router.post('/governance/models/:id/drift-check', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = triggerModelDrift({
    modelId: req.params.id,
    driftType: req.body?.driftType || 'ACCURACY_DETERIORATION',
    metricBefore: Number(req.body?.metricBefore || 1.8),
    metricAfter: Number(req.body?.metricAfter || 24.5),
    actorId: ctx.userId || 'drift-monitor',
    actorRole: ctx.role || 'PLATFORM_ADMIN',
  });
  if (!out.success) return res.status(400).json({ error: out.error });
  return res.status(201).json(out);
});

v12Router.get('/governance/audit', requireTenantContext, (_req: Request, res: Response) => {
  const events = Array.from(db.intelligenceAuditEvents.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return res.json(events);
});

v12Router.get('/governance/data-quality', requireTenantContext, (_req: Request, res: Response) => {
  return res.json({
    reports: Array.from(db.economicDataQualityReports.values()),
    sourceHealth: Array.from(db.intelligenceSourceHealth.values()),
  });
});

v12Router.get('/governance/review-queue', requireTenantContext, (_req: Request, res: Response) => {
  return res.json(Array.from(db.intelligenceReviewQueue.values()));
});

v12Router.post('/governance/review-queue/:id/decide', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const item = db.intelligenceReviewQueue.get(req.params.id);
  if (!item) return res.status(404).json({ error: `Review queue item ${req.params.id} not found.` });
  const decision = req.body?.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
  const now = new Date().toISOString();
  item.approvalsReceived.push({ actorId: ctx.userId || 'reviewer', role: ctx.role || 'PLATFORM_ADMIN', timestamp: now });
  item.status = decision;
  item.decisionNotes = req.body?.notes || `${decision} via Governance Review Queue`;
  item.updatedAt = now;
  db.intelligenceReviewQueue.set(item.id, item);
  db.scheduleSave();
  return res.json(item);
});

v12Router.get('/governance/reports', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const reports = Array.from(db.intelligenceReports.values()).filter((r) => canReadRecord(ctx, r));
  const publications = Array.from(db.intelligencePublicationRecords.values()).filter((p) => canReadRecord(ctx, p));
  return res.json({ reports, publications });
});

v12Router.post('/governance/reports', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { reportTitle, reportType, jurisdiction, sectors, timeRange } = req.body || {};
  if (!reportTitle) return res.status(400).json({ error: 'reportTitle is required.' });
  const now = new Date().toISOString();
  const indList = Array.from(db.economicIndicators.values()).filter((i) => !jurisdiction || jurisdiction === 'ALL' || i.jurisdiction === jurisdiction);
  const fcList = Array.from(db.v12EconomicForecasts.values()).filter((f) => !jurisdiction || jurisdiction === 'ALL' || f.jurisdiction === jurisdiction);

  const report: IntelligenceReport = {
    id: `RPT-V12-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    jurisdiction: (jurisdiction || 'UG').toUpperCase(),
    sourceReference: 'V12-REPORT-ENGINE',
    verificationStatus: 'VERIFIED',
    accessClassification: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'PUBLIC' : 'TENANT_PRIVATE',
    provenance: `Compiled dynamically from ${indList.length} indicators and ${fcList.length} forecasts`,
    retentionPolicy: '7_YEARS_STATUTORY',
    createdAt: now,
    updatedAt: now,
    reportTitle,
    reportType: reportType || 'CUSTOM',
    sectors: sectors || ['Multi-Sector Economy'],
    timeRange: timeRange || '2026-06 to 2026-11',
    summary: `Synthesized ${indList.filter((i) => i.availabilityStatus === 'AVAILABLE').length} verified indicators (${indList.filter((i) => i.availabilityStatus === 'UNAVAILABLE').length} unavailable disclosed) and ${fcList.length} statistical forecasts.`,
    keyFindings: indList.slice(0, 4).map((i) =>
      i.availabilityStatus === 'UNAVAILABLE'
        ? `UNAVAILABLE: ${i.name} (${i.unavailableReason || 'No verified observations'})`
        : `OBSERVED: ${i.name} = ${i.latestValue} ${i.unit} (${i.sourceClassification})`
    ),
    sourceReferences: Array.from(new Set(indList.map((i) => i.sourceReference))),
    distinguishesFactsVsForecasts: true,
    generatedBy: ctx.userId || 'report-user',
    exportFormats: ['JSON', 'CSV'],
  };
  db.intelligenceReports.set(report.id, report);
  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: report.jurisdiction,
    actorId: ctx.userId || 'report-user',
    actorRole: ctx.role || 'MEMBER',
    actionType: 'PUBLICATION_ISSUED',
    entityType: 'INTELLIGENCE_REPORT',
    entityId: report.id,
    details: `Generated intelligence report ${report.reportTitle}.`,
  });
  db.scheduleSave();
  return res.status(201).json(report);
});

v12Router.get('/subscriptions/plans', requireTenantContext, (_req: Request, res: Response) => {
  const tiers = Array.from(db.intelligenceSubscriptions.values());
  return res.json({
    tiers,
    commercialDisclosure: 'Proposed configurable intelligence product tiers. No synthetic subscriber revenue or confidential data resale permitted.',
    v11BillingIntegrated: true,
  });
});

v12Router.get('/jobs', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const jobs = Array.from(db.v12BackgroundJobs.values()).filter((j) => ctx.isPlatformAdmin || j.tenantId === ctx.tenantId);
  return res.json(jobs);
});

v12Router.post('/jobs/:id/cancel', requireTenantContext, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const job = db.v12BackgroundJobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: `Job ${req.params.id} not found.` });
  if (!ctx.isPlatformAdmin && job.tenantId !== ctx.tenantId) {
    return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  }
  job.status = 'CANCELLED';
  job.updatedAt = new Date().toISOString();
  db.v12BackgroundJobs.set(job.id, job);
  db.scheduleSave();
  return res.json(job);
});

// Migration, Backup Integrity, Interrupted Recovery & Rollback Audits
v12Router.get('/system/migration-audit', requireTenantContext, (_req: Request, res: Response) => {
  const backupCheck = db.verifyBackupFileIntegrity();
  return res.json({
    schemaVersion: db.schemaVersion,
    migrationHistory: db.migrationHistory,
    v12MigrationManifests: db.v12MigrationManifests,
    v11CanonicalBackupCheck: backupCheck,
    collectionCounts: db.getV12CollectionCountsSnapshot(),
    preservedFinancialTotals: db.getPreservedFinancialTotals(),
  });
});

v12Router.post('/system/backup-verify', requireTenantContext, (_req: Request, res: Response) => {
  const backup = db.createAutomatedBackup();
  const integrity = db.verifyBackupFileIntegrity(backup.backupFile);
  return res.json({ backup, integrity });
});

v12Router.post('/system/rollback-check', requireTenantContext, (_req: Request, res: Response) => {
  return res.json(db.verifyRollbackReadiness());
});

v12Router.post('/system/benchmark', requireTenantContext, (req: Request, res: Response) => {
  const iterations = Math.min(200, Math.max(10, Number(req.body?.iterations || 40)));
  const latencies: number[] = [];
  const tStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    const s = performance.now();
    getPublicCachedOrCompute('benchmark:overview', 'PUBLIC', 10_000, () => ({
      indicators: db.economicIndicators.size,
      forecasts: db.v12EconomicForecasts.size,
    }));
    latencies.push(performance.now() - s);
  }
  const totalMs = Number((performance.now() - tStart).toFixed(2));
  latencies.sort((a, b) => a - b);
  const p95 = Number((latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1] || 0).toFixed(3));
  return res.json({
    scenario: 'V12_CACHED_PUBLIC_INDICATOR_BENCHMARK',
    sampleSize: iterations,
    totalDurationMs: totalMs,
    p95InProcessMs: p95,
    measurementScope: 'Single-node local Node.js process benchmark; HTTP network round-trip benchmarks measured separately by automated test client.',
  });
});
