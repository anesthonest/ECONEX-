/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V16.0 - Production Infrastructure, Verified Integrations & Uganda Pilot REST Router
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import {
  advanceReleasePipelineV16,
  createMonitoringIncidentV16,
  evaluateV16ReadinessGates,
  executeRecoveryExerciseV16,
  getEventBusStatusV16,
  getMonitoringHealthV16,
  getOrExportAuditArchiveV16,
  probeHsmAndSecurityV16,
  probePostgresV16,
  publishCategoryEventV16,
  replayOrRecoverEventBusV16,
  requestDatabaseAuthorityTransitionV16,
  rotateEnvironmentCredentialV16,
  runV16MigrationDryRun,
  transitionMonitoringIncidentV16,
  V16_ALL_EVENT_CATEGORIES,
  validateEnvironmentStartupV16,
  verifyOrRotateHsmKeyV16,
} from './v16Infrastructure.ts';
import {
  advanceInstitutionalStageV16,
  createInstitutionalOnboardingV16,
  createPilotCohortV16,
  createUsabilitySessionV16,
  decideComplianceReviewV16,
  enrollPilotParticipantConsentV16,
  getEconomicActivityFunnelV16,
  getPilotDashboardV16,
  getUnitEconomicsReportV16,
  getUsabilitySummaryV16,
  listFinancialProvidersV16,
  recordOperationalCostV16,
  recordPilotActivityV16,
  recordUsabilityTaskResultV16,
  testFinancialProviderConnectionV16,
} from './v16PilotIntegrations.ts';
import { getSecurityOperationsSummaryV14 } from './v14OperationsSecurity.ts';
import { computeEconomicImpactV15 } from './v15TradeImpactEcosystem.ts';

export const v16Router = Router();

interface V16Context {
  tenantId: string;
  userId: string;
  role: string;
  isPlatformAdmin: boolean;
}

function recordV16SecurityIncident(category: any, severity: any, tenantId: string, actorId: string | undefined, details: string) {
  const id = `SECINC-V16-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  db.securityIncidents.set(id, {
    id,
    tenantId,
    category,
    severity,
    actorId,
    details,
    status: 'OPEN',
    detectedAt: new Date().toISOString(),
  });
  db.scheduleSave();
}

function resolveV16Actor(req: Request): { userId?: string; role: string; isPlatformAdmin: boolean } {
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
    const u = db.users.get(userId);
    if (u) role = u.role;
  }
  const finalRole = role || 'FARMER';
  return { userId, role: finalRole, isPlatformAdmin: finalRole === 'PLATFORM_ADMIN' };
}

function requireV16Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV16Actor(req);
  if (!actor.userId) {
    recordV16SecurityIncident('AUTH_FAILURE_BURST', 'MEDIUM', 'GLOBAL_PUBLIC', undefined, `Unauthenticated V16 request blocked on ${req.path}`);
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V16 APIs.',
    });
  }

  const explicitParamTenant =
    (req.query.tenantId as string | undefined)?.trim() ||
    (req.body?.tenantId as string | undefined)?.trim();
  const headerTenant = (req.headers['x-tenant-id'] as string | undefined)?.trim();
  const requestedTenantId =
    explicitParamTenant === 'GLOBAL_PUBLIC' || headerTenant === 'GLOBAL_PUBLIC'
      ? 'GLOBAL_PUBLIC'
      : explicitParamTenant || headerTenant || 'TEN-UG-ELGON-01';

  // Enforce strict tenant isolation for non-admin requests when accessing tenant-scoped datasets
  if (
    !actor.isPlatformAdmin &&
    requestedTenantId !== 'GLOBAL_PUBLIC' &&
    headerTenant &&
    explicitParamTenant &&
    headerTenant !== explicitParamTenant
  ) {
    recordV16SecurityIncident(
      'CROSS_TENANT_ACCESS',
      'HIGH',
      requestedTenantId,
      actor.userId,
      `Cross-tenant access blocked on V16 ${req.path}: header=${headerTenant}, param=${explicitParamTenant}`
    );
    return res.status(403).json({
      error: 'CROSS_TENANT_ACCESS_BLOCKED',
      message: `Access denied for cross-tenant request between ${headerTenant} and ${explicitParamTenant}.`,
    });
  }

  (req as any).v16Context = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } as V16Context;
  return next();
}

function getCtx(req: Request): V16Context {
  return (req as any).v16Context;
}

function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const ctx = getCtx(req);
  if (!ctx.isPlatformAdmin) {
    recordV16SecurityIncident(
      'RBAC_PRIVILEGE_ESCALATION',
      'HIGH',
      ctx.tenantId,
      ctx.userId,
      `Forbidden V16 admin operation ${req.method} ${req.path} by role ${ctx.role}`
    );
    return res.status(403).json({
      error: 'PLATFORM_ADMIN_REQUIRED',
      message: `Operation requires PLATFORM_ADMIN role; caller role is ${ctx.role}.`,
    });
  }
  return next();
}

v16Router.use(requireV16Context);

// ==========================================
// 1. INFRASTRUCTURE, DEPENDENCIES & ENVIRONMENTS (§5)
// ==========================================

v16Router.get('/infrastructure/status', async (_req: Request, res: Response) => {
  const envCheck = validateEnvironmentStartupV16();
  const dbProbe = await probePostgresV16();
  const bus = getEventBusStatusV16();
  const hsm = probeHsmAndSecurityV16();
  const archive = getOrExportAuditArchiveV16({ exportNew: false, actorId: 'system' });
  const readiness = await evaluateV16ReadinessGates(envCheck.activeEnvironment);

  return res.json({
    product: 'ECONEX',
    release: 'V16.0-PRODUCTION-INFRASTRUCTURE-AND-PILOT-ACTIVATION',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    schemaVersion: db.schemaVersion,
    environmentStartup: envCheck,
    database: dbProbe,
    eventBus: bus,
    securityHsm: hsm,
    auditArchive: archive,
    readiness,
  });
});

v16Router.get('/infrastructure/dependencies', async (_req: Request, res: Response) => {
  const dbProbe = await probePostgresV16();
  const bus = getEventBusStatusV16();
  const hsm = probeHsmAndSecurityV16();
  const providers = listFinancialProvidersV16();

  return res.json({
    dependencies: [
      { id: 'DEP-PG16', name: 'PostgreSQL 16 + TimescaleDB', state: dbProbe.connected ? 'CONNECTED_NOT_VALIDATED' : 'NOT_CONFIGURED', localFallback: 'JSON_WAL_ACTIVE', configured: dbProbe.configured },
      { id: 'DEP-EVENTBUS', name: 'Kafka / NATS JetStream Durable Broker', state: bus.externalClusterConnected ? 'SANDBOX_CONNECTED' : 'LOCAL_ONLY', localFallback: 'LOCAL_OUTBOX_LOG', configured: bus.externalClusterConnected },
      { id: 'DEP-HSM', name: 'PKCS#11 Cloud HSM / KMS', state: hsm.hsmStatus, localFallback: 'DEVELOPMENT_ISOLATED_ECDSA', configured: hsm.pkcs11Configured },
      { id: 'DEP-WORM', name: 'External S3 Object Lock / Azure WORM Audit Archive', state: hsm.externalWormConfigured ? 'SANDBOX_CONNECTED' : 'NOT_CONFIGURED', localFallback: 'LOCAL_HASH_CHAIN_ONLY', configured: hsm.externalWormConfigured },
      { id: 'DEP-PROVIDERS', name: 'Licensed Uganda & EAC Financial Providers', state: providers.liveAuthorizedCount > 0 ? 'PRODUCTION_VERIFIED' : 'NOT_CONFIGURED', localFallback: 'SANDBOX_ADAPTER_ONLY', configured: providers.liveAuthorizedCount > 0 },
    ],
  });
});

v16Router.get('/infrastructure/environments', (req: Request, res: Response) => {
  const scope = req.query.testScope as any;
  return res.json(validateEnvironmentStartupV16({ suppliedCredentialScope: scope }));
});

v16Router.post('/infrastructure/environments/:env/rotate-credential', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const env = String(req.params.env || '').toUpperCase() as any;
  const keyName = String(req.body?.keyName || `ECONEX_${env}_SIGNING_KEY`).replace(/[<>]/g, '').trim();
  const out = rotateEnvironmentCredentialV16({ environment: env, keyName, actorId: ctx.userId });
  return res.status(out.statusCode).json(out);
});

// ==========================================
// 2. POSTGRESQL 16 DATABASE, MIGRATIONS & ROLLBACK (§6)
// ==========================================

v16Router.get('/database/status', async (_req: Request, res: Response) => {
  const probe = await probePostgresV16();
  const integrity = db.validateV16SchemaIntegrity();
  const rollback = db.verifyV15BackupAndRollbackReadiness();
  return res.json({ probe, integrity, v15Rollback: rollback });
});

v16Router.get('/database/migrations', (_req: Request, res: Response) => {
  return res.json({
    checkpoints: Array.from(db.v16MigrationCheckpoints.values()).reverse(),
    completeness: db.verifyV16MigrationCompleteness(),
    v15BackupReadiness: db.verifyV15BackupAndRollbackReadiness(),
    v14BackupReadiness: db.verifyV14BackupAndRollbackReadiness(),
  });
});

v16Router.post('/database/migrate-dry-run', requirePlatformAdmin, async (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = await runV16MigrationDryRun({ actorId: ctx.userId, targetEngine: req.body?.targetEngine });
  return res.status(200).json(out);
});

v16Router.post('/database/authority', requirePlatformAdmin, async (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { targetAuthorityState, adminApproved } = req.body || {};
  if (!targetAuthorityState) {
    return res.status(400).json({ error: 'targetAuthorityState is required.' });
  }
  const out = await requestDatabaseAuthorityTransitionV16({
    targetAuthorityState,
    adminApproved: Boolean(adminApproved),
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/database/integrity', (_req: Request, res: Response) => {
  return res.json({
    v16Integrity: db.validateV16SchemaIntegrity(),
    v15Integrity: db.validateV15SchemaIntegrity(),
    financialIntegrity: db.getFinancialIntegrityReport(),
    collectionCounts: db.getV16CollectionCountsSnapshot(),
  });
});

// ==========================================
// 3. DURABLE EVENT BUS (12 CATEGORIES) (§7)
// ==========================================

v16Router.get('/events/status', (_req: Request, res: Response) => {
  return res.json(getEventBusStatusV16());
});

v16Router.post('/events/publish', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { category, jurisdiction, correlationId, idempotencyKey, payloadReference, payloadSummary, poisonSimulate } = req.body || {};
  if (!category || !V16_ALL_EVENT_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of ${V16_ALL_EVENT_CATEGORIES.join(', ')}` });
  }
  const out = publishCategoryEventV16({
    category,
    tenantId: ctx.tenantId,
    jurisdiction: jurisdiction || 'UG',
    actorId: ctx.userId,
    actorRole: ctx.role,
    correlationId,
    idempotencyKey,
    payloadReference: payloadReference || `ref://v16/${category}/${Date.now()}`,
    payloadSummary,
    poisonSimulate: Boolean(poisonSimulate),
  });
  return res.status(out.statusCode).json(out);
});

v16Router.post('/events/replay', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = replayOrRecoverEventBusV16({
    deadLetterId: req.body?.deadLetterId,
    clearSimulatedOutage: Boolean(req.body?.clearSimulatedOutage),
    actorId: ctx.userId,
  });
  return res.json(out);
});

// ==========================================
// 4. HSM, KEY LIFECYCLE, SECURITY & WORM AUDIT ARCHIVE (§8 & §9)
// ==========================================

v16Router.get('/security/hsm', (_req: Request, res: Response) => {
  return res.json(probeHsmAndSecurityV16());
});

v16Router.post('/security/hsm/lifecycle', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { action, keyId } = req.body || {};
  if (!action || !keyId) {
    return res.status(400).json({ error: 'action and keyId are required.' });
  }
  const out = verifyOrRotateHsmKeyV16({ action, keyId, actorId: ctx.userId });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/security/status', (_req: Request, res: Response) => {
  const v14Sec = getSecurityOperationsSummaryV14();
  const hsm = probeHsmAndSecurityV16();
  return res.json({
    ...v14Sec,
    hsmStatus: hsm.hsmStatus,
    allowsSilentProdToDevFallback: hsm.allowsSilentProdToDevFallback,
    totalKeys: hsm.totalKeys,
    activeKeys: hsm.activeKeys,
  });
});

v16Router.get('/audit/archive', (_req: Request, res: Response) => {
  return res.json(getOrExportAuditArchiveV16({ exportNew: false, actorId: 'reader' }));
});

v16Router.post('/audit/archive/export', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  return res.status(201).json(getOrExportAuditArchiveV16({ exportNew: true, actorId: ctx.userId }));
});

// ==========================================
// 5. FINANCIAL PROVIDERS (§10)
// ==========================================

v16Router.get('/providers', (_req: Request, res: Response) => {
  return res.json(listFinancialProvidersV16());
});

v16Router.get('/providers/:id/status', (req: Request, res: Response) => {
  const prov = db.v15ProviderIntegrations.get(req.params.id);
  if (!prov) return res.status(404).json({ error: `Provider ${req.params.id} not found.` });
  const tests = Array.from(db.v16ProviderTests.values()).filter((t) => t.providerId === prov.id);
  return res.json({ provider: prov, tests });
});

v16Router.post('/providers/:id/test', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = testFinancialProviderConnectionV16({
    providerId: req.params.id,
    environment: req.body?.environment,
    webhookTestPayload: req.body?.webhookTestPayload,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out);
});

// ==========================================
// 6. 12-STAGE INSTITUTIONAL ONBOARDING (§11)
// ==========================================

v16Router.get('/institutions/onboarding', (_req: Request, res: Response) => {
  return res.json({
    institutions: Array.from(db.v16InstitutionalOnboardings.values()),
    stagesCount: 12,
    disclaimer: 'Registry tracks formal onboarding stages; presence does NOT constitute external institutional approval.',
  });
});

v16Router.post('/institutions/onboarding', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createInstitutionalOnboardingV16({
    institutionName: req.body?.institutionName,
    institutionType: req.body?.institutionType,
    jurisdiction: req.body?.jurisdiction,
    protocolsSupported: req.body?.protocolsSupported,
    contactName: req.body?.contactName,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/institutions/:id/integration-status', (req: Request, res: Response) => {
  const rec = db.v16InstitutionalOnboardings.get(req.params.id);
  if (!rec) return res.status(404).json({ error: `Institution ${req.params.id} not found.` });
  return res.json({ institution: rec });
});

v16Router.post('/institutions/:id/advance', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = advanceInstitutionalStageV16({
    institutionId: req.params.id,
    targetStage: req.body?.targetStage,
    agreementApproved: req.body?.agreementApproved,
    sandboxTested: req.body?.sandboxTested,
    securityValidated: req.body?.securityValidated,
    productionAuthorized: req.body?.productionAuthorized,
    evidenceRef: req.body?.evidenceRef,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out);
});

// ==========================================
// 7. UGANDA PILOT OPERATIONS WORKSPACE (§12)
// ==========================================

v16Router.get('/pilot', (_req: Request, res: Response) => {
  return res.json(getPilotDashboardV16());
});

v16Router.get('/pilot/metrics', (_req: Request, res: Response) => {
  const dash = getPilotDashboardV16();
  return res.json({ metrics: dash.metrics, cohorts: dash.cohorts, nonProductionDisclosure: dash.programme?.nonProductionDisclosure });
});

v16Router.post('/pilot/cohorts', requirePlatformAdmin, (req: Request, res: Response) => {
  const out = createPilotCohortV16({
    name: req.body?.name,
    district: req.body?.district,
    targetCategories: req.body?.targetCategories,
    pilotId: req.body?.pilotId,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.post('/pilot/participants', (req: Request, res: Response) => {
  const out = enrollPilotParticipantConsentV16({
    cohortId: req.body?.cohortId,
    participantId: req.body?.participantId || `PART-UG-${Date.now().toString(36).toUpperCase()}`,
    participantCategory: req.body?.participantCategory,
    district: req.body?.district,
    informedConsentGranted: Boolean(req.body?.informedConsentGranted),
    disclosedNonProduction: Boolean(req.body?.disclosedNonProduction),
    supportNeedsNote: req.body?.supportNeedsNote,
    isNonProductionTestRecord: req.body?.isNonProductionTestRecord,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.post('/pilot/consent', (req: Request, res: Response) => {
  const out = enrollPilotParticipantConsentV16({
    cohortId: req.body?.cohortId,
    participantId: req.body?.participantId,
    participantCategory: req.body?.participantCategory,
    district: req.body?.district,
    informedConsentGranted: Boolean(req.body?.informedConsentGranted),
    disclosedNonProduction: Boolean(req.body?.disclosedNonProduction),
    supportNeedsNote: req.body?.supportNeedsNote,
    isNonProductionTestRecord: req.body?.isNonProductionTestRecord,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.post('/pilot/activities', (req: Request, res: Response) => {
  const out = recordPilotActivityV16({
    cohortId: req.body?.cohortId,
    participantId: req.body?.participantId,
    workflowStepNumber: req.body?.workflowStepNumber,
    workflowStepName: req.body?.workflowStepName,
    orderOrExecutionId: req.body?.orderOrExecutionId,
    amountUgx: req.body?.amountUgx,
    isNonProductionSimulation: req.body?.isNonProductionSimulation,
    verifiedByExternalProvider: req.body?.verifiedByExternalProvider,
    note: req.body?.note,
  });
  return res.status(out.statusCode).json(out);
});

// ==========================================
// 8. HUMAN USABILITY & TRANSLATIONS (§13 & §14)
// ==========================================

v16Router.get('/usability/sessions', (_req: Request, res: Response) => {
  return res.json(getUsabilitySummaryV16());
});

v16Router.post('/usability/sessions', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createUsabilitySessionV16({
    personaCode: req.body?.personaCode,
    participantGroup: req.body?.participantGroup,
    languageUsed: req.body?.languageUsed,
    consentRecorded: Boolean(req.body?.consentRecorded),
    moderatorId: req.body?.moderatorId || ctx.userId,
    locationDistrict: req.body?.locationDistrict,
    overallAccessibilityNotes: req.body?.overallAccessibilityNotes,
    recommendations: req.body?.recommendations,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.post('/usability/results', requirePlatformAdmin, (req: Request, res: Response) => {
  const out = recordUsabilityTaskResultV16({
    sessionId: req.body?.sessionId,
    taskCode: req.body?.taskCode,
    taskTitle: req.body?.taskTitle,
    completed: Boolean(req.body?.completed),
    errorsCount: req.body?.errorsCount,
    assistanceRequired: Boolean(req.body?.assistanceRequired),
    durationSeconds: req.body?.durationSeconds,
    feedbackNote: req.body?.feedbackNote,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/translations/reviews', (_req: Request, res: Response) => {
  const reviews = Array.from(db.translationReviews.values());
  return res.json({
    product: 'ECONEX',
    legalFinancialFallbackPolicy: 'Unapproved local languages automatically fall back to verified English for critical financial and legal disclosures.',
    approvedCount: reviews.filter((r) => r.status === 'APPROVED').length,
    totalLanguages: reviews.length,
    reviews,
  });
});

// ==========================================
// 9. MONITORING, INCIDENTS, RECOVERY & RELEASES (§15, §16, §17)
// ==========================================

v16Router.get('/monitoring/health', async (_req: Request, res: Response) => {
  return res.json(await getMonitoringHealthV16());
});

v16Router.post('/monitoring/incidents', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createMonitoringIncidentV16({
    tenantId: ctx.tenantId,
    component: req.body?.component,
    severity: req.body?.severity,
    correlationId: req.body?.correlationId,
    summary: req.body?.summary,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.post('/monitoring/incidents/:id/status', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = transitionMonitoringIncidentV16({
    incidentId: req.params.id,
    targetStatus: req.body?.targetStatus,
    note: req.body?.note,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/recovery/status', (_req: Request, res: Response) => {
  return res.json({
    exercises: Array.from(db.v16RecoveryExercises.values()).reverse(),
    v15BackupReadiness: db.verifyV15BackupAndRollbackReadiness(),
    v14BackupReadiness: db.verifyV14BackupAndRollbackReadiness(),
  });
});

v16Router.post('/recovery/exercises', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const ex = executeRecoveryExerciseV16({
    systemsAffected: req.body?.systemsAffected,
    targetRpoMinutes: req.body?.targetRpoMinutes,
    targetRtoMinutes: req.body?.targetRtoMinutes,
    failuresObserved: req.body?.failuresObserved,
    correctiveActions: req.body?.correctiveActions,
    actorId: ctx.userId,
  });
  return res.status(201).json({ exercise: ex });
});

v16Router.get('/releases', (_req: Request, res: Response) => {
  return res.json({ releases: Array.from(db.v16Releases.values()).reverse() });
});

v16Router.post('/releases/:id/advance', requirePlatformAdmin, async (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = await advanceReleasePipelineV16({
    releaseId: req.params.id,
    targetStatus: req.body?.targetStatus,
    targetEnvironment: req.body?.targetEnvironment,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/releases/readiness', async (req: Request, res: Response) => {
  const env = (String(req.query.environment || 'DEVELOPMENT').toUpperCase()) as any;
  return res.json(await evaluateV16ReadinessGates(env));
});

// ==========================================
// 10. SUSTAINABILITY, COMPLIANCE & IMPACT FUNNEL (§19, §20, §21)
// ==========================================

v16Router.get('/sustainability/costs', (_req: Request, res: Response) => {
  return res.json({ costs: Array.from(db.v16OperationalCosts.values()) });
});

v16Router.post('/sustainability/costs', requirePlatformAdmin, (req: Request, res: Response) => {
  const out = recordOperationalCostV16({
    category: req.body?.category,
    period: req.body?.period,
    jurisdiction: req.body?.jurisdiction,
    amountUsd: req.body?.amountUsd,
    note: req.body?.note,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/sustainability/unit-economics', (_req: Request, res: Response) => {
  return res.json(getUnitEconomicsReportV16());
});

v16Router.get('/compliance/reviews', (_req: Request, res: Response) => {
  const reviews = Array.from(db.v16ComplianceReviews.values());
  return res.json({
    reviews,
    clearedCount: reviews.filter((r) => r.reviewStatus === 'LEGAL_COUNSEL_CLEARED').length,
    pendingCount: reviews.filter((r) => r.reviewStatus !== 'LEGAL_COUNSEL_CLEARED').length,
  });
});

v16Router.post('/compliance/reviews/:id/decide', requirePlatformAdmin, (req: Request, res: Response) => {
  const out = decideComplianceReviewV16({
    reviewId: req.params.id,
    reviewStatus: req.body?.reviewStatus,
    reviewerName: req.body?.reviewerName,
    notes: req.body?.notes,
  });
  return res.status(out.statusCode).json(out);
});

v16Router.get('/impact/summary', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const v15Impact = computeEconomicImpactV15({ tenantId: ctx.tenantId, actorId: ctx.userId });
  const funnel = getEconomicActivityFunnelV16();
  return res.json({
    funnel,
    v15MetricsCount: v15Impact.indicators.length,
    v15ImpactSummary: v15Impact,
  });
});
