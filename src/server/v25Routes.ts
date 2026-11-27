/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V25.0 — Continental Infrastructure, Multi-Org Governance, Security, Ledger,
 * Outbox/Jobs, OpenAPI 3.1, Country/FX, Private Vault, Compliance & Migration Router (/api/v25/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { getV25AiTelemetryStats, runV25AiPlatformAssist } from './gemini.ts';
import {
  getV25PostgresDiagnostics,
  runV25Postgres20StageMigration,
} from './v25PostgresEngine.ts';
import {
  V25ActorCtx,
  V25HttpError,
  advanceV25SecurityIncident,
  approveControlledCountryActivation,
  buildV25OpenApi31Spec,
  cleanV25Text,
  createV25ApiApp,
  createV25Branch,
  createV25BusinessUnit,
  createV25Department,
  createV25FxQuote,
  createV25IdentitySession,
  createV25Organisation,
  createV25SecurityIncident,
  createV25Team,
  dispatchAndConsumeV25Outbox,
  dispatchV25SignedWebhook,
  enqueueAndRunV25BackgroundJob,
  enforceOrganisationIsolation,
  evaluateV25AccessPolicy,
  executeV25FxClearing,
  generateV25CountryReadinessReport,
  getActiveMembershipForUser,
  getOrgHierarchySnapshot,
  getV25EnvironmentProfile,
  getV25InfrastructureTelemetry,
  getV25ReadinessMatrix,
  grantOrDelegateV25Membership,
  initiateV25LedgerTransaction,
  issueV25MfaChallenge,
  issueV25ScopedApiKey,
  issueV25VaultDownloadToken,
  queryV25EconomicGraphAndSearch,
  redeemV25VaultDownloadToken,
  registerV25CountryProfile,
  registerV25UserDevice,
  registerV25WebhookEndpoint,
  replayV25DeadLetter,
  revokeV25ApiKey,
  revokeV25Session,
  rotateV25SessionRefreshToken,
  runV25BackupAndRestoreDrill,
  runV25ConcurrencyRaceProof,
  runV25MeasuredLoadBenchmark,
  setV25MembershipStatus,
  setV25OrgLifecycleStatus,
  subscribeOrgToV25Plan,
  switchActiveV25Organisation,
  transferV25OrgOwnership,
  transitionV25LedgerTransaction,
  uploadV25VaultDocument,
  upsertV25ComplianceRecord,
  verifyV25MfaChallenge,
  verifyV25ScopedApiKey,
} from './v25Engine.ts';
import type { UserRole, V25LedgerTxState, V25OrgLifecycleStatus } from '../types/index.ts';

export const v25Router = Router();

function resolveV25Ctx(req: Request): V25ActorCtx {
  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string | undefined)?.trim();
  let role = (req.headers['x-user-role'] as string | undefined)?.trim();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = db.validateSession(authHeader.slice(7).trim());
    if (session) {
      userId = session.userId;
      role = session.role;
    }
  }
  if (userId) {
    const u = db.users.get(userId);
    if (u) role = u.role;
  }
  const effectiveUserId = userId || 'usr_admin_01';
  const effectiveRole = (role || 'PLATFORM_ADMIN') as UserRole;
  const activeMem = getActiveMembershipForUser(effectiveUserId);
  const requestedOrgId = (req.headers['x-org-id'] as string | undefined)?.trim() || activeMem?.organisationId || 'ORG-V25-UG-PRODUCE';
  const requestedCountry = (req.headers['x-country-code'] as string | undefined)?.trim() || db.v25Organisations.get(requestedOrgId)?.countryCode || 'UG';

  return {
    tenantId: ((req.headers['x-tenant-id'] as string) || `TENANT-${requestedCountry}`).trim(),
    userId: effectiveUserId,
    role: effectiveRole,
    isPlatformAdmin: effectiveRole === 'PLATFORM_ADMIN',
    organisationId: requestedOrgId,
    countryCode: requestedCountry.toUpperCase(),
    correlationId: ((req as any).correlationId || `CORR-${crypto.randomBytes(4).toString('hex')}`),
    sourceIp: String(req.ip || '127.0.0.1'),
    mfaConfirmed: req.headers['x-mfa-confirmed'] === 'true',
  };
}

function handleV25(fn: (req: Request, res: Response, ctx: V25ActorCtx) => Promise<any> | any) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    const ctx = resolveV25Ctx(req);
    try {
      await fn(req, res, ctx);
    } catch (err: any) {
      if (err instanceof V25HttpError) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code,
          correlationId: ctx.correlationId,
        });
      }
      console.error('[ECONEX V25 ERROR]', err);
      return res.status(500).json({
        error: err?.message || 'INTERNAL_V25_ERROR',
        correlationId: ctx.correlationId,
      });
    }
  };
}

// ==========================================
// 1. HEALTH, TELEMETRY, READINESS & OPENAPI 3.1
// ==========================================

v25Router.get('/health', (_req, res) => {
  const pg = getV25PostgresDiagnostics();
  const v23Check = db.verifyV23MigrationCompleteness();
  return res.json({
    status: 'HEALTHY',
    product: 'ECONEX',
    release: 'V25.0-CONTINENTAL-INFRASTRUCTURE',
    schemaVersion: db.schemaVersion,
    environmentProfile: getV25EnvironmentProfile(),
    databaseAuthority: pg.databaseAuthority,
    pgConfigured: pg.pgConfigured,
    postgresCutoverComplete: pg.postgresCutoverComplete,
    schema23IntegrityValid: v23Check.integrity.valid,
    v24RollbackReady: v23Check.rollback.v24BackupValid,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    timestamp: new Date().toISOString(),
  });
});

v25Router.get('/telemetry', handleV25((_req, res) => res.json(getV25InfrastructureTelemetry())));

v25Router.get('/readiness-matrix', handleV25((_req, res) => res.json(getV25ReadinessMatrix())));

v25Router.get('/openapi.json', (_req, res) => res.json(buildV25OpenApi31Spec()));

// ==========================================
// 2. POSTGRESQL 16 20-STAGE MIGRATOR & SCHEMA 23 VERIFICATION
// ==========================================

v25Router.get('/postgres/status', handleV25((_req, res) => {
  return res.json({
    ...getV25PostgresDiagnostics(),
    schema23Completeness: db.verifyV23MigrationCompleteness(),
  });
}));

v25Router.post('/postgres/migrate', handleV25(async (req, res, ctx) => {
  if (!ctx.isPlatformAdmin) throw new V25HttpError(403, 'PLATFORM_ADMIN_REQUIRED');
  const run = await runV25Postgres20StageMigration({
    simulateInterruptAtStage: req.body?.simulateInterruptAtStage ? Number(req.body.simulateInterruptAtStage) : undefined,
    resumeFromRunId: req.body?.resumeFromRunId ? cleanV25Text(req.body.resumeFromRunId) : undefined,
    attemptLivePg: req.body?.attemptLivePg !== false,
  });
  return res.json(run);
}));

v25Router.get('/rollback-readiness', handleV25((_req, res) => {
  return res.json(db.verifyV23MigrationCompleteness());
}));

// ==========================================
// 3. ENTERPRISE MULTI-ORGANISATION HIERARCHY & RBAC ISOLATION
// ==========================================

v25Router.get('/organisations', handleV25((req, res, ctx) => {
  const filterOrgId = req.query.organisationId ? cleanV25Text(req.query.organisationId) : undefined;
  return res.json(getOrgHierarchySnapshot(ctx, filterOrgId));
}));

v25Router.post('/organisations', handleV25((req, res, ctx) => {
  const org = createV25Organisation(req.body || {}, ctx);
  return res.status(201).json(org);
}));

v25Router.post('/organisations/business-units', handleV25((req, res, ctx) => {
  return res.status(201).json(createV25BusinessUnit(req.body || {}, ctx));
}));

v25Router.post('/organisations/branches', handleV25((req, res, ctx) => {
  return res.status(201).json(createV25Branch(req.body || {}, ctx));
}));

v25Router.post('/organisations/departments', handleV25((req, res, ctx) => {
  return res.status(201).json(createV25Department(req.body || {}, ctx));
}));

v25Router.post('/organisations/teams', handleV25((req, res, ctx) => {
  return res.status(201).json(createV25Team(req.body || {}, ctx));
}));

v25Router.post('/organisations/memberships', handleV25((req, res, ctx) => {
  return res.status(201).json(grantOrDelegateV25Membership(req.body || {}, ctx));
}));

v25Router.post('/organisations/memberships/:id/status', handleV25((req, res, ctx) => {
  const status = cleanV25Text(req.body?.status).toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  return res.json(setV25MembershipStatus(req.params.id, status, ctx));
}));

v25Router.post('/organisations/switch', handleV25((req, res, ctx) => {
  const targetOrgId = cleanV25Text(req.body?.organisationId);
  if (!targetOrgId) throw new V25HttpError(400, 'ORGANISATION_ID_REQUIRED');
  return res.json(switchActiveV25Organisation(targetOrgId, ctx));
}));

v25Router.post('/organisations/:id/transfer-ownership', handleV25((req, res, ctx) => {
  const newOwnerUserId = cleanV25Text(req.body?.newOwnerUserId);
  return res.json(transferV25OrgOwnership(req.params.id, newOwnerUserId, ctx));
}));

v25Router.post('/organisations/:id/status', handleV25((req, res, ctx) => {
  const targetStatus = cleanV25Text(req.body?.status).toUpperCase() as V25OrgLifecycleStatus;
  return res.json(setV25OrgLifecycleStatus(req.params.id, targetStatus, cleanV25Text(req.body?.reason), ctx));
}));

v25Router.post('/rbac/evaluate', handleV25((req, res, ctx) => {
  return res.json(
    evaluateV25AccessPolicy({
      ctx,
      resource: cleanV25Text(req.body?.resource || 'ORGANISATION_GOVERNANCE'),
      action: cleanV25Text(req.body?.action || 'READ'),
      targetOrganisationId: cleanV25Text(req.body?.organisationId || ctx.organisationId),
      targetCountryCode: req.body?.countryCode ? cleanV25Text(req.body.countryCode) : undefined,
      ownerUserId: req.body?.ownerUserId ? cleanV25Text(req.body.ownerUserId) : undefined,
      classification: req.body?.classification,
    })
  );
}));

// ==========================================
// 4. IDENTITY, MFA, DEVICES & SESSION MANAGEMENT
// ==========================================

v25Router.get('/identity/security-state', handleV25((_req, res, ctx) => {
  const devices = Array.from(db.v25UserDevices.values()).filter((d) => ctx.isPlatformAdmin || d.userId === ctx.userId);
  const sessions = Array.from(db.v25UserSessions.values()).filter((s) => ctx.isPlatformAdmin || s.userId === ctx.userId);
  const mfaConfigs = Array.from(db.v25MfaConfigs.values()).filter((m) => ctx.isPlatformAdmin || m.userId === ctx.userId);
  return res.json({ devices, sessions, mfaConfigs });
}));

v25Router.post('/identity/devices', handleV25((req, res, ctx) => {
  return res.status(201).json(registerV25UserDevice(req.body || {}, ctx));
}));

v25Router.post('/identity/sessions', handleV25((req, res, ctx) => {
  return res.status(201).json(createV25IdentitySession(req.body || {}, ctx));
}));

v25Router.post('/identity/sessions/:id/refresh', handleV25((req, res, ctx) => {
  return res.json(rotateV25SessionRefreshToken(req.params.id, cleanV25Text(req.body?.refreshToken), ctx));
}));

v25Router.post('/identity/sessions/:id/revoke', handleV25((req, res, ctx) => {
  return res.json(revokeV25Session(req.params.id, Boolean(req.body?.revokeAllForUser), ctx));
}));

v25Router.post('/identity/mfa/challenge', handleV25((req, res, ctx) => {
  const userId = cleanV25Text(req.body?.userId || ctx.userId);
  if (userId !== ctx.userId && !ctx.isPlatformAdmin) throw new V25HttpError(403, 'MFA_USER_MISMATCH');
  return res.json(issueV25MfaChallenge(userId, req.body?.method));
}));

v25Router.post('/identity/mfa/verify', handleV25((req, res, ctx) => {
  const userId = cleanV25Text(req.body?.userId || ctx.userId);
  return res.json(verifyV25MfaChallenge(userId, cleanV25Text(req.body?.challengeId), cleanV25Text(req.body?.code)));
}));

// ==========================================
// 5. IMMUTABLE LEDGER STATE MACHINE & CONCURRENCY SPEND LOCK
// ==========================================

v25Router.get('/ledger/transactions', handleV25((_req, res, ctx) => {
  const items = Array.from(db.v25LedgerTransactions.values()).filter(
    (t) => ctx.isPlatformAdmin || Boolean(getActiveMembershipForUser(ctx.userId, t.organisationId))
  );
  return res.json({
    transactions: items,
    regulatoryLimits: Array.from(db.v25RegulatoryLimits.values()),
    concurrencyProofs: Array.from(db.v25ConcurrencyProofRuns.values()),
  });
}));

v25Router.post('/ledger/transactions', handleV25((req, res, ctx) => {
  return res.status(201).json(initiateV25LedgerTransaction(req.body || {}, ctx));
}));

v25Router.post('/ledger/transactions/:id/transition', handleV25((req, res, ctx) => {
  const targetState = cleanV25Text(req.body?.targetState).toUpperCase() as V25LedgerTxState;
  return res.json(transitionV25LedgerTransaction(req.params.id, targetState, cleanV25Text(req.body?.note), ctx));
}));

v25Router.post('/ledger/concurrency-proof', handleV25(async (req, res, ctx) => {
  return res.json(await runV25ConcurrencyRaceProof(req.body || {}, ctx));
}));

// ==========================================
// 6. TRANSACTIONAL OUTBOX, DLQ & CENTRAL BACKGROUND JOBS
// ==========================================

v25Router.get('/outbox/events', handleV25((_req, res) => {
  return res.json({
    events: Array.from(db.v25OutboxEvents.values()),
    deadLetters: Array.from(db.v25DeadLetters.values()),
    auditTrail: Array.from(db.v25AuditTrail.values()).slice(-50),
  });
}));

v25Router.post('/outbox/events/:id/dispatch', handleV25((req, res) => {
  return res.json(
    dispatchAndConsumeV25Outbox(req.params.id, {
      consumerName: req.body?.consumerName,
      simulateFailure: Boolean(req.body?.simulateFailure),
    })
  );
}));

v25Router.post('/outbox/dlq/:id/replay', handleV25((req, res) => {
  return res.json(replayV25DeadLetter(req.params.id));
}));

v25Router.get('/jobs', handleV25((_req, res) => {
  return res.json({ jobs: Array.from(db.v25BackgroundJobs.values()) });
}));

v25Router.post('/jobs', handleV25((req, res, ctx) => {
  return res.status(201).json(enqueueAndRunV25BackgroundJob(req.body || {}, ctx));
}));

// ==========================================
// 7. DEVELOPER PLATFORM, SCOPED KEYS, WEBHOOKS & ADAPTER BOUNDARIES
// ==========================================

v25Router.get('/developer/platform', handleV25((_req, res, ctx) => {
  const apps = Array.from(db.v25ApiApplications.values()).filter(
    (a) => ctx.isPlatformAdmin || Boolean(getActiveMembershipForUser(ctx.userId, a.organisationId))
  );
  const appIds = new Set(apps.map((a) => a.id));
  // Never leak raw secret; stored hash only
  const keys = Array.from(db.v25ScopedApiKeys.values()).filter((k) => appIds.has(k.appId));
  const endpoints = Array.from(db.v25WebhookEndpoints.values()).filter((w) => appIds.has(w.appId));
  const deliveries = Array.from(db.v25WebhookDeliveries.values());
  const adapters = Array.from(db.v25ExternalAdapters.values());
  return res.json({ apps, keys, endpoints, deliveries, adapters });
}));

v25Router.post('/developer/apps', handleV25((req, res, ctx) => {
  return res.status(201).json(createV25ApiApp(req.body || {}, ctx));
}));

v25Router.post('/developer/keys', handleV25((req, res, ctx) => {
  return res.status(201).json(issueV25ScopedApiKey(req.body || {}, ctx));
}));

v25Router.post('/developer/keys/:id/revoke', handleV25((req, res, ctx) => {
  return res.json(revokeV25ApiKey(req.params.id, ctx));
}));

v25Router.post('/developer/keys/verify', handleV25((req, res) => {
  return res.json(verifyV25ScopedApiKey(cleanV25Text(req.body?.apiKey), cleanV25Text(req.body?.requiredScope || 'read:commerce')));
}));

v25Router.post('/developer/webhooks', handleV25((req, res, ctx) => {
  return res.status(201).json(registerV25WebhookEndpoint(req.body || {}, ctx));
}));

v25Router.post('/developer/webhooks/:id/deliver', handleV25((req, res, ctx) => {
  return res.json(
    dispatchV25SignedWebhook(
      req.params.id,
      cleanV25Text(req.body?.eventType || 'v25.ledger.transaction_posted'),
      req.body?.payload || { status: 'SANDBOX_EVENT' },
      ctx
    )
  );
}));

// ==========================================
// 8. COUNTRY ENGINE & MULTI-CURRENCY FX ENGINE
// ==========================================

v25Router.get('/countries', handleV25((_req, res) => {
  return res.json({
    countries: Array.from(db.v25CountryProfiles.values()),
    readinessReports: Array.from(db.v25CountryReadinessReports.values()),
  });
}));

v25Router.post('/countries', handleV25((req, res, ctx) => {
  return res.status(201).json(registerV25CountryProfile(req.body || {}, ctx));
}));

v25Router.post('/countries/:code/readiness', handleV25((req, res, ctx) => {
  return res.json(generateV25CountryReadinessReport(req.params.code, ctx));
}));

v25Router.post('/countries/:code/activate', handleV25((req, res, ctx) => {
  return res.json(approveControlledCountryActivation(req.params.code, ctx));
}));

v25Router.get('/fx/quotes', handleV25((_req, res) => {
  return res.json({
    quotes: Array.from(db.v25FxQuotes.values()),
    clearings: Array.from(db.v25FxClearingRecords.values()),
  });
}));

v25Router.post('/fx/quotes', handleV25((req, res) => {
  return res.status(201).json(createV25FxQuote(req.body || {}));
}));

v25Router.post('/fx/clear', handleV25((req, res, ctx) => {
  return res.status(201).json(executeV25FxClearing(req.body || {}, ctx));
}));

// ==========================================
// 9. PRIVATE DOCUMENT & EVIDENCE VAULT
// ==========================================

v25Router.get('/vault/documents', handleV25((_req, res, ctx) => {
  const docs = Array.from(db.v25VaultDocuments.values()).filter((d) => {
    const check = evaluateV25AccessPolicy({
      ctx,
      resource: 'VAULT_DOCUMENT',
      action: 'READ',
      targetOrganisationId: d.organisationId,
      targetCountryCode: d.countryCode,
      ownerUserId: d.ownerUserId,
      classification: d.classification,
    });
    return check.allowed;
  });
  return res.json({
    documents: docs,
    accessLogs: Array.from(db.v25VaultAccessLogs.values()).slice(-30),
  });
}));

v25Router.post('/vault/documents', handleV25((req, res, ctx) => {
  return res.status(201).json(uploadV25VaultDocument(req.body || {}, ctx));
}));

v25Router.post('/vault/documents/:id/download-token', handleV25((req, res, ctx) => {
  return res.status(201).json(issueV25VaultDownloadToken(req.params.id, ctx));
}));

v25Router.get('/vault/download/:token', handleV25((req, res, ctx) => {
  return res.json(redeemV25VaultDownloadToken(req.params.token, ctx));
}));

// ==========================================
// 10. SECURITY INCIDENTS, 5-TIER COMPLIANCE, PLANS, SEARCH, DR & LOAD TEST
// ==========================================

v25Router.get('/security/incidents', handleV25((_req, res) => {
  return res.json({
    securityEvents: Array.from(db.v25SecurityEvents.values()),
    incidents: Array.from(db.v25SecurityIncidents.values()),
  });
}));

v25Router.post('/security/incidents', handleV25((req, res, ctx) => {
  return res.status(201).json(createV25SecurityIncident(req.body || {}, ctx));
}));

v25Router.post('/security/incidents/:id/advance', handleV25((req, res, ctx) => {
  return res.json(advanceV25SecurityIncident(req.params.id, req.body || {}, ctx));
}));

v25Router.get('/compliance/records', handleV25((_req, res, ctx) => {
  const records = Array.from(db.v25ComplianceRecords.values()).filter((r) => {
    if (ctx.isPlatformAdmin) return true;
    return Boolean(getActiveMembershipForUser(ctx.userId, r.organisationId));
  });
  return res.json({ records });
}));

v25Router.post('/compliance/records', handleV25((req, res, ctx) => {
  return res.status(201).json(upsertV25ComplianceRecord(req.body || {}, ctx));
}));

v25Router.get('/billing/plans', handleV25((_req, res, ctx) => {
  const plans = Array.from(db.v25PlatformPlans.values());
  const subscriptions = Array.from(db.v25OrgSubscriptions.values()).filter(
    (s) => ctx.isPlatformAdmin || Boolean(getActiveMembershipForUser(ctx.userId, s.organisationId))
  );
  const invoices = Array.from(db.v25PlatformInvoices.values()).filter(
    (i) => ctx.isPlatformAdmin || Boolean(getActiveMembershipForUser(ctx.userId, i.organisationId))
  );
  return res.json({ plans, subscriptions, invoices, walletBalanceSeparated: true });
}));

v25Router.post('/billing/subscribe', handleV25((req, res, ctx) => {
  return res.status(201).json(subscribeOrgToV25Plan(req.body || {}, ctx));
}));

v25Router.get('/search', handleV25((req, res, ctx) => {
  return res.json(queryV25EconomicGraphAndSearch(String(req.query.q || ''), ctx));
}));

v25Router.post('/resilience/backup-drill', handleV25((_req, res, ctx) => {
  if (!ctx.isPlatformAdmin) throw new V25HttpError(403, 'PLATFORM_ADMIN_REQUIRED');
  return res.json(runV25BackupAndRestoreDrill(ctx));
}));

v25Router.post('/resilience/load-benchmark', handleV25(async (req, res, ctx) => {
  if (!ctx.isPlatformAdmin) throw new V25HttpError(403, 'PLATFORM_ADMIN_REQUIRED');
  const concurrency = Number(req.body?.concurrency || 20);
  const totalRequests = Number(req.body?.totalRequests || 80);
  return res.json(await runV25MeasuredLoadBenchmark(concurrency, totalRequests));
}));

v25Router.post('/ai/assist', handleV25(async (req, res, ctx) => {
  const out = await runV25AiPlatformAssist({
    taskType: req.body?.taskType || 'INFRASTRUCTURE_DIAGNOSTIC',
    prompt: String(req.body?.prompt || ''),
    organisationId: ctx.organisationId,
    countryCode: ctx.countryCode,
    verifiedContext: req.body?.verifiedContext,
  });
  return res.status(out.statusCode).json(out.result);
}));

v25Router.get('/ai/telemetry', (_req, res) => res.json(getV25AiTelemetryStats()));
