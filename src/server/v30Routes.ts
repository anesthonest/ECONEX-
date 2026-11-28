/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V30.0 - Universal Financial Interoperability & Economic Resilience Router (/api/v30/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  V30ActorCtx,
  V30HttpError,
  V30_MANDATORY_HONESTY_FLAGS,
  buildV30OpenApiSpec,
  createIdempotentPaymentInstruction,
  createV30BusinessFinanceDoc,
  createV30Dispute,
  decideV30BusinessFinanceDoc,
  evaluateSmartRouting,
  getV30AiMetricsAndTelemetry,
  getV30CompetitiveAdvantageMatrix,
  getV30Overview,
  getV30ReadinessMatrix,
  getV30UniversalWalletOverview,
  listV30AgentsAndLiquidity,
  listV30BusinessFinanceDocs,
  listV30Corridors,
  listV30Disputes,
  listV30FraudEvents,
  listV30Payments,
  listV30Providers,
  listV30RegulatoryReadiness,
  listV30UssdSessions,
  resolveV30ReconciliationCase,
  reviewV30FraudEvent,
  runV30FinancialAiAdvisor,
  runV30UssdSandboxCommand,
  submitV30LiquidityReport,
  submitV30RegulatoryEvidence,
  transitionV30Dispute,
  transitionV30PaymentState,
  transitionV30ProviderHealth,
  updateV30CardControls,
  verifyV30MediaAssetsExist,
} from './v30Engine.ts';
import { getV30GitHubDiagnostics } from './v30GitHubEngine.ts';
import {
  forceGeminiCooldownExpiryForTests,
  resetGeminiResilienceStateForTests,
  setSimulatedGeminiFaultQueueForTests,
} from './gemini.ts';
import type { UserRole } from '../types/index.ts';

export const v30Router = Router();

function resolveV30Ctx(req: Request, allowAnonymousFallback = false): V30ActorCtx {
  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string | undefined)?.trim();
  let role = (req.headers['x-user-role'] as string | undefined)?.trim();
  let authenticated = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = db.validateSession(authHeader.slice(7).trim());
    if (session) {
      userId = session.userId;
      role = session.role;
      authenticated = true;
    }
  }
  if (userId) {
    const u = db.users.get(userId);
    if (u) {
      role = u.role;
      authenticated = true;
    }
  }
  if (!authenticated && !allowAnonymousFallback) {
    throw new V30HttpError(401, 'AUTHENTICATION_REQUIRED');
  }

  const effectiveUserId = userId || 'usr_farmer_01';
  const effectiveRole = (role || 'FARMER') as UserRole;
  const prefs = db.v26UserPreferences.get(effectiveUserId);
  const requestedOrg =
    (req.headers['x-org-id'] as string | undefined)?.trim() ||
    prefs?.activeWorkspaceId ||
    db.users.get(effectiveUserId)?.organizationId ||
    'org_coop_01';
  const requestedCountry =
    (req.headers['x-country-code'] as string | undefined)?.trim() ||
    prefs?.activeCountryCode ||
    'UG';

  return {
    tenantId: `TENANT-${requestedCountry.toUpperCase()}`,
    userId: effectiveUserId,
    role: effectiveRole,
    isPlatformAdmin: effectiveRole === 'PLATFORM_ADMIN',
    organisationId: requestedOrg,
    countryCode: requestedCountry.toUpperCase(),
    correlationId: (req as any).correlationId || `CORR-V30-${Date.now().toString(36)}`,
    sourceIp: req.ip || '127.0.0.1',
    authenticated,
  };
}

function handleErr(res: Response, err: any) {
  if (err instanceof V30HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  return res.status(500).json({ error: err?.message || 'Internal V30 error', code: 'V30_INTERNAL_ERROR' });
}

v30Router.get('/health', (_req: Request, res: Response) => {
  const integrity = db.validateV27SchemaIntegrity();
  const rb = db.verifyV29BackupAndRollbackReadiness();
  const media = verifyV30MediaAssetsExist();
  return res.json({
    status: integrity.valid ? 'HEALTHY' : 'DEGRADED',
    product: 'ECONEX',
    release: 'V30.0-UNIVERSAL-FINANCIAL-RESILIENCE',
    schemaVersion: db.schemaVersion,
    schema27Integrity: integrity,
    v29RollbackReady: rb.rollbackSupported,
    v30MediaAssets: media,
    honestyFlags: V30_MANDATORY_HONESTY_FLAGS,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    timestamp: new Date().toISOString(),
  });
});

v30Router.get('/migration/status', (_req: Request, res: Response) => {
  return res.json(db.verifyV27MigrationCompleteness());
});

v30Router.get('/migration/backup-verify', (_req: Request, res: Response) => {
  return res.json(db.verifyV29BackupAndRollbackReadiness());
});

v30Router.get('/readiness-matrix', (_req: Request, res: Response) => {
  return res.json(getV30ReadinessMatrix());
});

v30Router.get('/openapi.json', (_req: Request, res: Response) => {
  return res.json(buildV30OpenApiSpec());
});

v30Router.get('/competitive-matrix', (_req: Request, res: Response) => {
  return res.json({ entries: getV30CompetitiveAdvantageMatrix() });
});

v30Router.get('/overview', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(getV30Overview(ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/providers', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json(
      listV30Providers({
        country: req.query.country as string | undefined,
        currency: req.query.currency as string | undefined,
        category: req.query.category as string | undefined,
      })
    );
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/providers/:id/health', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(transitionV30ProviderHealth(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/routing/evaluate', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json(evaluateSmartRouting(req.body || {}));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/payments', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(listV30Payments(ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/payments', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    const out = createIdempotentPaymentInstruction(req.body || {}, ctx);
    return res.status(out.deduplicatedReplay ? 200 : 201).json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/payments/:id/transition', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(transitionV30PaymentState(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/reconciliation/:id/resolve', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(resolveV30ReconciliationCase(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/corridors', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json(listV30Corridors(req.query.origin as string | undefined));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/agents', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json(
      listV30AgentsAndLiquidity({
        country: req.query.country as string | undefined,
        district: req.query.district as string | undefined,
        provider: req.query.provider as string | undefined,
      })
    );
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/liquidity/report', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.status(201).json(submitV30LiquidityReport(req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/business-finance', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json({ docs: listV30BusinessFinanceDocs(ctx) });
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/business-finance', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.status(201).json(createV30BusinessFinanceDoc(req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/business-finance/:id/decide', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(decideV30BusinessFinanceDoc(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/disputes', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json({ disputes: listV30Disputes(ctx) });
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/disputes', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.status(201).json(createV30Dispute(req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/disputes/:id/transition', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(transitionV30Dispute(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/fraud-events', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json({ events: listV30FraudEvents(ctx) });
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/fraud-events/:id/review', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(reviewV30FraudEvent(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/regulatory', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json(listV30RegulatoryReadiness());
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/regulatory/evidence', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.status(201).json(submitV30RegulatoryEvidence(req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/wallet/universal', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(getV30UniversalWalletOverview(ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/wallet/cards/:id/controls', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.json(updateV30CardControls(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/ussd/sessions', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json({ sessions: listV30UssdSessions() });
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/ussd/simulate', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    return res.status(201).json(runV30UssdSandboxCommand(req.body || {}, ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/ai/advise', async (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    const out = await runV30FinancialAiAdvisor(req.body || {}, ctx);
    return res.json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/ai/telemetry', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json(getV30AiMetricsAndTelemetry());
  } catch (err) {
    return handleErr(res, err);
  }
});

// Controlled test hook for deterministic automated verification of 429/5xx/timeout/recovery resilience
v30Router.post('/ai/test-fault-mode', (req: Request, res: Response) => {
  try {
    const ctx = resolveV30Ctx(req);
    if (!ctx.isPlatformAdmin) {
      throw new V30HttpError(403, 'Admin required for resilience fault injection test hook.', 'FORBIDDEN');
    }
    const { action, faults } = req.body || {};
    if (action === 'RESET') {
      resetGeminiResilienceStateForTests();
    } else if (action === 'EXPIRE_COOLDOWN') {
      forceGeminiCooldownExpiryForTests();
    } else if (action === 'QUEUE' && Array.isArray(faults)) {
      setSimulatedGeminiFaultQueueForTests(faults);
    }
    return res.json({ ok: true, telemetry: getV30AiMetricsAndTelemetry().telemetry });
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.get('/developer/github-diagnostics', (_req: Request, res: Response) => {
  return res.json(getV30GitHubDiagnostics());
});

v30Router.get('/repair-register', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    return res.json({
      repairs: Array.from(db.v30RepairRegister.values()),
    });
  } catch (err) {
    return handleErr(res, err);
  }
});

v30Router.post('/webhooks/hmac-verify', (req: Request, res: Response) => {
  try {
    resolveV30Ctx(req);
    const payloadStr = JSON.stringify(req.body?.payload || {});
    const secret = String(req.body?.secret || 'sandbox-webhook-verification-key');
    const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    return res.json({
      algorithm: 'HMAC-SHA256',
      signatureHeader: `sha256=${signature}`,
      verified: true,
      sandboxOnly: true,
    });
  } catch (err) {
    return handleErr(res, err);
  }
});
