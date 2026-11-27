/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 - Universal Economic Execution, Interoperability & Continental Operations Router (/api/v28/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  V28ActorCtx,
  V28HttpError,
  approveProcurementRequisition,
  buildV28OpenApiSpec,
  createContract,
  createContractObligation,
  createCrossBorderExecution,
  createDualApprovalRequest,
  createExecutionWorkflow,
  createFulfilmentAndReserveStock,
  createProcurementPlan,
  createProcurementRequisition,
  decideDualApprovalRequest,
  getOperationsControlCentre,
  getUniversalWorkspaceSummary,
  getV28ContinentalIntelligence,
  getV28ReadinessMatrix,
  getV28WalletCoordinationOverview,
  listContracts,
  listCountryOperatingProfiles,
  listCrossBorderExecutions,
  listDomainEventsAndDlq,
  listExecutionWorkflows,
  listFieldOfflineRecords,
  listFulfilmentWorkspace,
  listInteroperabilityConnectors,
  listProcurementWorkspace,
  listVaultDocuments,
  recordFulfilmentDispatchOrDelivery,
  registerVaultDocument,
  replayDeadLetterEvent,
  resolveFieldOfflineConflict,
  resolveOperationalException,
  reverseSandboxTransfer,
  runGuardedV28AiOrchestration,
  executeSandboxObligationTransfer,
  signAndVerifyWebhookPayload,
  submitProcurementEvaluation,
  syncFieldOfflineRecordWithConflictDetection,
  transitionContract,
  transitionExecutionWorkflow,
  transitionInteroperabilityConnector,
  updateVaultDocumentGovernance,
} from './v28Engine.ts';
import { getV28RepositoryHealth } from './v28GitHubEngine.ts';
import type { UserRole } from '../types/index.ts';

export const v28Router = Router();

function resolveV28Ctx(req: Request, allowAnonymousFallback = false): V28ActorCtx {
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
    throw new V28HttpError(401, 'AUTHENTICATION_REQUIRED');
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
    correlationId: (req as any).correlationId || `CORR-V28-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    sourceIp: req.ip || '127.0.0.1',
    authenticated,
  };
}

function handleV28Err(res: Response, err: unknown) {
  if (err instanceof V28HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  const msg = err instanceof Error ? err.message : 'V28_INTERNAL_ERROR';
  return res.status(500).json({ error: msg, code: 'V28_INTERNAL_ERROR' });
}

// ==========================================
// 1. HEALTH, READINESS, MIGRATION & OPENAPI 3.1
// ==========================================

v28Router.get('/health', (_req: Request, res: Response) => {
  const integrity = db.validateV26SchemaIntegrity();
  const readiness = getV28ReadinessMatrix();
  return res.json({
    status: integrity.valid ? 'HEALTHY' : 'DEGRADED',
    product: 'ECONEX',
    release: 'V28.0-UNIVERSAL-ECONOMIC-EXECUTION',
    schemaVersion: db.schemaVersion,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    schema26Integrity: integrity,
    honestyFlags: {
      POSTGRESQL_CUTOVER_COMPLETE: readiness.flags.POSTGRESQL_CUTOVER_COMPLETE,
      EXTERNAL_INTEGRATIONS_LIVE: readiness.flags.EXTERNAL_INTEGRATIONS_LIVE,
      REAL_VALUE_WALLET_OPERATIONS_ENABLED: readiness.flags.REAL_VALUE_WALLET_OPERATIONS_ENABLED,
      CARD_SCHEME_CERTIFICATION_COMPLETE: readiness.flags.CARD_SCHEME_CERTIFICATION_COMPLETE,
      HUMAN_FIELD_VALIDATION_COMPLETE: readiness.flags.HUMAN_FIELD_VALIDATION_COMPLETE,
      PILOT_ACTIVE: readiness.flags.PILOT_ACTIVE,
      PRODUCTION_DEPLOYED: readiness.flags.PRODUCTION_DEPLOYED,
      GITHUB_REMOTE_SYNC_VERIFIED: readiness.flags.GITHUB_REMOTE_SYNC_VERIFIED,
      AI_STUDIO_GITHUB_BINDING_VERIFIED: readiness.flags.AI_STUDIO_GITHUB_BINDING_VERIFIED,
    },
    timestamp: new Date().toISOString(),
  });
});

v28Router.get('/openapi.json', (_req: Request, res: Response) => {
  return res.json(buildV28OpenApiSpec());
});

v28Router.get('/readiness-matrix', (_req: Request, res: Response) => {
  return res.json(getV28ReadinessMatrix());
});

v28Router.get('/migration/status', (_req: Request, res: Response) => {
  return res.json(db.verifyV26MigrationCompleteness());
});

v28Router.get('/migration/backup-verify', (_req: Request, res: Response) => {
  return res.json(db.verifyV27BackupAndRollbackReadiness());
});

// ==========================================
// 2. UNIVERSAL WORKSPACE & EXECUTION STATE MACHINE
// ==========================================

v28Router.get('/workspace', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(getUniversalWorkspaceSummary(ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/executions', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const workflows = listExecutionWorkflows(ctx, {
      stage: req.query.stage as string | undefined,
      status: req.query.status as string | undefined,
      countryCode: req.query.countryCode as string | undefined,
    });
    return res.json({ count: workflows.length, workflows });
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/executions', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const workflow = createExecutionWorkflow(req.body || {}, ctx);
    return res.status(201).json(workflow);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/executions/:id/transition', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const workflow = transitionExecutionWorkflow(req.params.id, req.body || {}, ctx);
    return res.json(workflow);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

// ==========================================
// 3. CONTRACTS, OBLIGATIONS & PROCUREMENT
// ==========================================

v28Router.get('/contracts', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const contracts = listContracts(ctx);
    const obligations = Array.from(db.v28ContractObligations.values()).filter(
      (o) => ctx.isPlatformAdmin || o.responsiblePartyOrgId === ctx.organisationId || o.tenantId === ctx.tenantId
    );
    return res.json({ count: contracts.length, contracts, obligations });
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/contracts', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const ctr = createContract(req.body || {}, ctx);
    return res.status(201).json(ctr);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/contracts/:id/transition', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const ctr = transitionContract(req.params.id, req.body || {}, ctx);
    return res.json(ctr);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/contracts/:id/obligations', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const obl = createContractObligation(req.params.id, req.body || {}, ctx);
    return res.status(201).json(obl);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/procurement', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(listProcurementWorkspace(ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/procurement/plans', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const plan = createProcurementPlan(req.body || {}, ctx);
    return res.status(201).json(plan);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/procurement/requisitions', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const reqItem = createProcurementRequisition(req.body || {}, ctx);
    return res.status(201).json(reqItem);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/procurement/requisitions/:id/decide', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const reqItem = approveProcurementRequisition(req.params.id, req.body || {}, ctx);
    return res.json(reqItem);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/procurement/requisitions/:id/evaluate', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const ev = submitProcurementEvaluation(req.params.id, req.body || {}, ctx);
    return res.status(201).json(ev);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

// ==========================================
// 4. FULFILMENT, INVENTORY, CROSS-BORDER & WALLET COORDINATION
// ==========================================

v28Router.get('/fulfilment', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(listFulfilmentWorkspace(ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/fulfilment/reserve', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const out = createFulfilmentAndReserveStock(req.body || {}, ctx);
    return res.status(201).json(out);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/fulfilment/:id/record', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const out = recordFulfilmentDispatchOrDelivery(req.params.id, req.body || {}, ctx);
    return res.json(out);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/cross-border', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json({
      countries: listCountryOperatingProfiles(),
      executions: listCrossBorderExecutions(ctx),
    });
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/cross-border', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const xb = createCrossBorderExecution(req.body || {}, ctx);
    return res.status(201).json(xb);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/wallet/coordination', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(getV28WalletCoordinationOverview(ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/wallet/transfer', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const result = executeSandboxObligationTransfer(req.body || {}, ctx);
    return res.status(result.idempotentReplay ? 200 : 201).json(result);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/wallet/reverse/:txId', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const result = reverseSandboxTransfer(req.params.txId, req.body?.reason || 'Operator reversal', ctx);
    return res.json(result);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

// ==========================================
// 5. INTEROPERABILITY, EVENTS, VAULT, INTELLIGENCE, AI, OPS, FIELD & REPO HEALTH
// ==========================================

v28Router.get('/interoperability/connectors', (req: Request, res: Response) => {
  try {
    resolveV28Ctx(req);
    const connectors = listInteroperabilityConnectors();
    return res.json({ count: connectors.length, connectors });
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/interoperability/connectors/:id/transition', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const conn = transitionInteroperabilityConnector(req.params.id, req.body || {}, ctx);
    return res.json(conn);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/interoperability/webhook-sign', (req: Request, res: Response) => {
  try {
    resolveV28Ctx(req);
    const sig = signAndVerifyWebhookPayload(req.body?.payload || {}, String(req.body?.secret || 'econex-v28-sandbox-key'));
    return res.json(sig);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/events', (req: Request, res: Response) => {
  try {
    resolveV28Ctx(req);
    return res.json(listDomainEventsAndDlq());
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/events/dlq/:id/replay', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(replayDeadLetterEvent(req.params.id, ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/vault/documents', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const documents = listVaultDocuments(ctx);
    return res.json({ count: documents.length, documents });
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/vault/documents', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const doc = registerVaultDocument(req.body || {}, ctx);
    return res.status(201).json(doc);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/vault/documents/:id/governance', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const doc = updateVaultDocumentGovernance(req.params.id, req.body || {}, ctx);
    return res.json(doc);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/intelligence/continental', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(getV28ContinentalIntelligence(ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/ai/orchestrate', async (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const run = await runGuardedV28AiOrchestration(req.body || {}, ctx);
    return res.status(201).json(run);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/ai/runs', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const runs = Array.from(db.v28AiOrchestrationRuns.values())
      .filter((r) => ctx.isPlatformAdmin || r.userId === ctx.userId || r.organisationId === ctx.organisationId)
      .reverse();
    return res.json({ count: runs.length, runs });
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/operations/control-centre', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(getOperationsControlCentre(ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/operations/exceptions/:id/resolve', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(resolveOperationalException(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/operations/dual-approvals', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.status(201).json(createDualApprovalRequest(req.body || {}, ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/operations/dual-approvals/:id/decide', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    return res.json(decideDualApprovalRequest(req.params.id, req.body || {}, ctx));
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/field/offline-records', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const records = listFieldOfflineRecords(ctx);
    return res.json({ count: records.length, records });
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/field/offline-records', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const rec = syncFieldOfflineRecordWithConflictDetection(req.body || {}, ctx);
    return res.status(rec.syncState === 'CONFLICT' ? 409 : 201).json(rec);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.post('/field/offline-records/:id/resolve', (req: Request, res: Response) => {
  try {
    const ctx = resolveV28Ctx(req);
    const rec = resolveFieldOfflineConflict(req.params.id, req.body || {}, ctx);
    return res.json(rec);
  } catch (err) {
    return handleV28Err(res, err);
  }
});

v28Router.get('/developer/repository-health', (req: Request, res: Response) => {
  try {
    resolveV28Ctx(req, true);
    return res.json(getV28RepositoryHealth());
  } catch (err) {
    return handleV28Err(res, err);
  }
});
