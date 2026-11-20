/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V14.0 - Global Institutional Integration, Financial Interoperability & Production Operations REST Router
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import {
  probeDatabaseInfrastructureV14,
  evaluateAndRequestCutover,
  runBackupAndRestoreDrillV14,
  getDistributedEventsInfraSummary,
  publishV14OrderedEvent,
  configureBrokerAdapterTarget,
} from './v14DbInfra.ts';
import {
  redactInstitutionalCredential,
  getInstitutionalLifecycleStage,
  runInstitutionalSandboxTestV14,
  evaluateProductionActivationGate,
  executeInstitutionalSyncLog,
  verifyWebhookIngressV14,
  createV14PaymentTransactionV14,
  transitionPaymentStateV14,
  verifyProviderSettlementV14,
  runFinancialReconciliationV14,
  createPaymentDisputeV14,
  getPerCurrencyLedgerIsolationReport,
} from './v14InstitutionsFinance.ts';
import {
  createOnboardingRequestV14,
  advanceOnboardingStageV14,
  evaluateAuthorizationPolicyV14,
  createExternalWormAuditArchiveV14,
  getSecurityOperationsSummaryV14,
  createTradeWorkflowV14,
  advanceTradeWorkflowV14,
  submitOrVerifyDeliveryEvidenceV14,
  assessJurisdictionTaxV14,
  subscribeAndBillTenantV14,
  issueInvoiceRefundV14,
  runDisasterRecoveryExerciseV14,
  generateProductionReadinessAssessmentV14,
} from './v14OperationsSecurity.ts';
import { logIntelligenceAudit } from './v12Engine.ts';

export const v14Router = Router();

interface V14Context {
  tenantId: string;
  userId: string;
  role: string;
  isPlatformAdmin: boolean;
}

function recordSecurityIncident(category: any, severity: any, tenantId: string, actorId: string | undefined, details: string) {
  const id = `SECINC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
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
    if (user) role = user.role;
  }
  return { userId, role: role || 'FARMER', isPlatformAdmin: role === 'PLATFORM_ADMIN' };
}

function requireV14Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveActor(req);
  if (!actor.userId) {
    recordSecurityIncident('AUTH_FAILURE_BURST', 'MEDIUM', 'GLOBAL_PUBLIC', undefined, `Unauthenticated request blocked on ${req.path}`);
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V14 endpoints.',
    });
  }

  const requestedTenantId =
    (req.headers['x-tenant-id'] as string | undefined)?.trim() ||
    (req.query.tenantId as string | undefined)?.trim() ||
    (req.body?.tenantId as string | undefined)?.trim() ||
    'TEN-UG-ELGON-01';

  if (requestedTenantId !== 'GLOBAL_PUBLIC') {
    const tenant = db.tenants.get(requestedTenantId);
    if (!tenant) {
      return res.status(404).json({ error: `Tenant ${requestedTenantId} not found.` });
    }
    if (!actor.isPlatformAdmin) {
      const hasMembership = Array.from(db.tenantMemberships.values()).some(
        (m) => m.tenantId === requestedTenantId && m.userId === actor.userId && m.status === 'ACTIVE'
      );
      if (!hasMembership && tenant.primaryAdminUserId !== actor.userId) {
        recordSecurityIncident(
          'CROSS_TENANT_ACCESS_ATTEMPT',
          'HIGH',
          requestedTenantId,
          actor.userId,
          `Actor ${actor.userId} attempted cross-tenant access to ${requestedTenantId} on ${req.path}`
        );
        return res.status(403).json({
          error: 'CROSS_TENANT_ACCESS_DENIED',
          tenantId: requestedTenantId,
          userId: actor.userId,
        });
      }
    }
  }

  (req as any).v14Ctx = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role || 'FARMER',
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies V14Context;

  return next();
}

function requireAdmin(req: Request, res: Response, ctx: V14Context): boolean {
  if (!ctx.isPlatformAdmin) {
    recordSecurityIncident(
      'PRIVILEGE_ESCALATION_ATTEMPT',
      'HIGH',
      ctx.tenantId,
      ctx.userId,
      `Non-admin role ${ctx.role} (${ctx.userId}) attempted admin operation on ${req.path}`
    );
    res.status(403).json({ error: 'PLATFORM_ADMIN_REQUIRED', role: ctx.role });
    return false;
  }
  return true;
}

function ctxOf(req: Request): V14Context {
  return (req as any).v14Ctx as V14Context;
}

// ==========================================
// 1. DATABASE PRODUCTION TRANSITION & BACKUPS
// ==========================================

v14Router.get('/infrastructure/database/status', requireV14Context, async (_req: Request, res: Response) => {
  const probe = await probeDatabaseInfrastructureV14();
  const rollbackReadiness = db.verifyV13BackupAndRollbackReadiness();
  const checkpoints = Array.from(db.v14MigrationCheckpoints.values());
  const backups = Array.from(db.databaseBackupVerifications.values()).reverse().slice(0, 15);
  return res.json({
    schemaVersion: db.schemaVersion,
    probe,
    rollbackReadiness,
    v14MigrationCheckpoints: checkpoints,
    recentBackupVerifications: backups,
    collectionsCount: Object.keys(db.getV14CollectionCountsSnapshot()).length,
  });
});

v14Router.post('/infrastructure/database/cutover-check', requireV14Context, async (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const { requestedAuthorityState, platformAdminApproved } = req.body || {};
  if (!requestedAuthorityState) {
    return res.status(400).json({ error: 'requestedAuthorityState is required.' });
  }
  const result = await evaluateAndRequestCutover({
    requestedAuthorityState,
    platformAdminApproved: Boolean(platformAdminApproved),
    actorId: ctx.userId,
  });
  return res.status(result.statusCode).json(result);
});

v14Router.post('/infrastructure/backups/verify', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const verification = runBackupAndRestoreDrillV14(ctx.userId);
  return res.status(201).json(verification);
});

// ==========================================
// 2. DISTRIBUTED EVENT STREAMING INFRASTRUCTURE V14
// ==========================================

v14Router.get('/infrastructure/events/status', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const summary = getDistributedEventsInfraSummary();
  const recentOutbox = Array.from(db.distributedEventOutbox.values())
    .filter((e) => ctx.isPlatformAdmin || e.tenantId === ctx.tenantId || e.tenantId === 'GLOBAL_PUBLIC')
    .slice(-25)
    .reverse();
  return res.json({ ...summary, recentOutbox });
});

v14Router.post('/infrastructure/events/publish', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { eventType, schemaVersion, jurisdiction, orderingKey, idempotencyKey, payloadReference, payloadSummary } = req.body || {};
  if (!eventType || !idempotencyKey || !payloadReference) {
    return res.status(400).json({ error: 'eventType, idempotencyKey, and payloadReference are required.' });
  }
  const result = publishV14OrderedEvent({
    eventType,
    schemaVersion,
    jurisdiction: jurisdiction || 'UG',
    tenantId: ctx.tenantId,
    orderingKey: orderingKey || ctx.tenantId,
    idempotencyKey,
    actorId: ctx.userId,
    actorRole: ctx.role,
    payloadReference,
    payloadSummary,
  });
  return res.status(result.statusCode).json(result);
});

v14Router.post('/infrastructure/events/broker/configure', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const { adapterType, retentionPolicyHours, maxInFlightMessages } = req.body || {};
  if (!adapterType) return res.status(400).json({ error: 'adapterType is required.' });
  const r = configureBrokerAdapterTarget({ adapterType, retentionPolicyHours, maxInFlightMessages, actorId: ctx.userId });
  if (!r.ok) return res.status(400).json({ error: r.error });
  return res.json(r.broker);
});

// ==========================================
// 3. GLOBAL INSTITUTIONAL CONNECTIVITY & 16-STATE LIFECYCLE
// ==========================================

v14Router.get('/institutions/connectors', requireV14Context, (_req: Request, res: Response) => {
  const connectors = Array.from(db.institutionalConnectorRegistry.values()).map((conn) => {
    const lifecycleStage = getInstitutionalLifecycleStage(conn.id);
    const agreement = Array.from(db.institutionalAgreements.values()).find((a) => a.connectorId === conn.id) || null;
    const health = Array.from(db.institutionalConnectionHealth.values()).find((h) => h.connectorId === conn.id) || null;
    const creds = Array.from(db.institutionalConnectorCredentials.values())
      .filter((c) => c.connectorId === conn.id)
      .map(redactInstitutionalCredential);
    return {
      ...conn,
      lifecycleStage,
      agreement,
      health,
      credentials: creds,
    };
  });
  return res.json({
    total: connectors.length,
    connectors,
    sandboxTests: Array.from(db.institutionalSandboxTests.values()).reverse().slice(0, 20),
    productionApprovals: Array.from(db.institutionalProductionApprovals.values()).reverse().slice(0, 20),
    syncLogs: Array.from(db.externalSystemSyncLogs.values()).reverse().slice(0, 20),
  });
});

v14Router.post('/institutions/connectors/:id/test', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const result = runInstitutionalSandboxTestV14({
    connectorId: req.params.id,
    testType: req.body?.testType,
    actorId: ctx.userId,
  });
  return res.status(result.statusCode).json(result);
});

v14Router.post('/institutions/connectors/:id/activate-production', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const result = evaluateProductionActivationGate({
    connectorId: req.params.id,
    requestedBy: ctx.userId,
    approvedBy: ctx.userId,
    decision: req.body?.decision,
    justification: req.body?.justification || 'Production activation check requested via V14 Control Center',
  });
  return res.status(result.statusCode).json(result);
});

v14Router.post('/institutions/connectors/:id/sync', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const conn = db.institutionalConnectorRegistry.get(req.params.id);
  if (!conn) return res.status(404).json({ error: `Connector ${req.params.id} not found.` });
  const { operation, correlationId, idempotencyKey, payload } = req.body || {};
  const log = executeInstitutionalSyncLog({
    connectorId: conn.id,
    operation: operation || 'STATUS_HEARTBEAT_SYNC',
    correlationId: correlationId || `CORR-${Date.now().toString(36).toUpperCase()}`,
    idempotencyKey: idempotencyKey || `SYNC-${Date.now().toString(36).toUpperCase()}`,
    payload: payload || { jurisdiction: conn.jurisdiction },
  });
  return res.status(201).json(log);
});

v14Router.post('/institutions/agreements/:id/sign', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const agr = db.institutionalAgreements.get(req.params.id);
  if (!agr) return res.status(404).json({ error: 'Institutional agreement not found.' });
  agr.signed = true;
  agr.signedByInstitution = req.body?.signedByInstitution || 'Authorized Institutional Signatory';
  agr.signedByArosOfficer = ctx.userId;
  agr.signedAt = new Date().toISOString();
  agr.expiresAt = new Date(Date.now() + 365 * 86400_000).toISOString();
  agr.status = 'SIGNED_ACTIVE';
  db.institutionalAgreements.set(agr.id, agr);
  const conn = db.institutionalConnectorRegistry.get(agr.connectorId);
  if (conn) {
    conn.agreementSigned = true;
    db.institutionalConnectorRegistry.set(conn.id, conn);
  }
  db.scheduleSave();
  return res.json(agr);
});

v14Router.post('/institutions/webhooks/verify', requireV14Context, (req: Request, res: Response) => {
  const { connectorId, providerId, webhookId, eventType, timestampHeader, signatureHex, payload } = req.body || {};
  if (!webhookId || !signatureHex || !payload) {
    return res.status(400).json({ error: 'webhookId, signatureHex, and payload are required.' });
  }
  const result = verifyWebhookIngressV14({
    connectorId,
    providerId,
    webhookId,
    eventType: eventType || 'INSTITUTIONAL_NOTIFICATION',
    timestampHeader,
    signatureHex,
    payload,
  });
  return res.status(result.statusCode).json(result);
});

v14Router.get('/institutions/onboarding', requireV14Context, (_req: Request, res: Response) => {
  return res.json({
    requests: Array.from(db.institutionalOnboardingRequests.values()).reverse(),
  });
});

v14Router.post('/institutions/onboarding', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { institutionName, institutionCategory, jurisdiction, connectorId } = req.body || {};
  if (!institutionName || !institutionCategory || !jurisdiction) {
    return res.status(400).json({ error: 'institutionName, institutionCategory, and jurisdiction are required.' });
  }
  const created = createOnboardingRequestV14({
    tenantId: ctx.tenantId,
    institutionName,
    institutionCategory,
    jurisdiction,
    submittedBy: ctx.userId,
    connectorId,
  });
  return res.status(201).json(created);
});

v14Router.post('/institutions/onboarding/:id/advance', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const { targetStage, note } = req.body || {};
  if (!targetStage) return res.status(400).json({ error: 'targetStage is required.' });
  const result = advanceOnboardingStageV14({
    onboardingId: req.params.id,
    targetStage,
    actorId: ctx.userId,
    note,
  });
  return res.status(result.statusCode).json(result);
});

// ==========================================
// 4. FINANCIAL INTEROPERABILITY, RECONCILIATION, DISPUTES & 14 CURRENCIES
// ==========================================

v14Router.get('/payments/providers', requireV14Context, (_req: Request, res: Response) => {
  return res.json({
    providers: Array.from(db.paymentProviderIntegrations.values()),
  });
});

v14Router.get('/payments/transactions', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const txs = Array.from(db.paymentTransactions.values())
    .filter((t) => ctx.isPlatformAdmin || t.tenantId === ctx.tenantId)
    .reverse();
  return res.json({
    transactions: txs,
    receipts: Array.from(db.providerSettlementReceipts.values()).reverse().slice(0, 30),
  });
});

v14Router.post('/payments/initiate', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const {
    idempotencyKey,
    providerId,
    corridor,
    sourceCurrency,
    settlementCurrency,
    amount,
    feeAmount,
    fxQuoteId,
    fxQuoteMode,
    payerAccountRef,
    payeeAccountRef,
  } = req.body || {};

  if (!idempotencyKey || !providerId || !sourceCurrency || !settlementCurrency || amount === undefined) {
    return res.status(400).json({ error: 'idempotencyKey, providerId, sourceCurrency, settlementCurrency, and amount are required.' });
  }
  const result = createV14PaymentTransactionV14({
    tenantId: ctx.tenantId,
    idempotencyKey,
    providerId,
    corridor: corridor || 'UG-DOMESTIC',
    sourceCurrency,
    settlementCurrency,
    amount: Number(amount),
    feeAmount,
    fxQuoteId,
    fxQuoteMode,
    payerAccountRef: payerAccountRef || 'ACCT-PAYER-01',
    payeeAccountRef: payeeAccountRef || 'ACCT-PAYEE-01',
    actorId: ctx.userId,
  });
  return res.status(result.statusCode).json(result);
});

v14Router.post('/payments/:id/transition', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const tx = db.paymentTransactions.get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Payment not found.' });
  if (!ctx.isPlatformAdmin && tx.tenantId !== ctx.tenantId) {
    return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  }
  const { targetStatus, note } = req.body || {};
  if (!targetStatus) return res.status(400).json({ error: 'targetStatus is required.' });
  const r = transitionPaymentStateV14({ paymentId: tx.id, targetStatus, actorId: ctx.userId, note });
  return res.status(r.statusCode).json(r);
});

v14Router.post('/payments/:id/verify-settlement', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const tx = db.paymentTransactions.get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Payment not found.' });
  if (!ctx.isPlatformAdmin && tx.tenantId !== ctx.tenantId) {
    return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  }
  const { providerReference, settledAmount, providerFeeAmount, currency, proofSource, signatureHex } = req.body || {};
  const r = verifyProviderSettlementV14({
    paymentId: tx.id,
    providerReference: providerReference || '',
    settledAmount: Number(settledAmount ?? 0),
    providerFeeAmount,
    currency: currency || tx.settlementCurrency,
    proofSource: proofSource || 'SYNTHETIC_REJECTED',
    signatureHex: signatureHex || '',
    actorId: ctx.userId,
  });
  return res.status(r.statusCode).json(r);
});

v14Router.get('/payments/reconciliation', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  return res.json({
    batches: Array.from(db.financialReconciliationBatches.values())
      .filter((b) => ctx.isPlatformAdmin || b.tenantId === ctx.tenantId)
      .reverse(),
    exceptions: Array.from(db.financialReconciliationExceptions.values())
      .filter((e) => ctx.isPlatformAdmin || e.tenantId === ctx.tenantId)
      .reverse(),
  });
});

v14Router.post('/payments/reconcile', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { currency, providerId, providerStatements } = req.body || {};
  if (!currency || !providerId || !Array.isArray(providerStatements)) {
    return res.status(400).json({ error: 'currency, providerId, and providerStatements array are required.' });
  }
  const result = runFinancialReconciliationV14({
    tenantId: ctx.tenantId,
    currency,
    providerId,
    providerStatements,
    actorId: ctx.userId,
  });
  return res.status(201).json(result);
});

v14Router.post('/payments/reconciliation/exceptions/:id/resolve', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const ex = db.financialReconciliationExceptions.get(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Reconciliation exception not found.' });
  ex.resolutionStatus = req.body?.resolutionStatus || 'RESOLVED_BY_OPERATOR';
  ex.resolutionNote = req.body?.resolutionNote || 'Investigated and reconciled by finance operator.';
  ex.resolvedAt = new Date().toISOString();
  db.financialReconciliationExceptions.set(ex.id, ex);
  db.scheduleSave();
  return res.json(ex);
});

v14Router.get('/payments/disputes', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  return res.json({
    disputes: Array.from(db.paymentDisputes.values())
      .filter((d) => ctx.isPlatformAdmin || d.tenantId === ctx.tenantId)
      .reverse(),
  });
});

v14Router.post('/payments/disputes', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { paymentTransactionId, reconciliationExceptionId, disputeType, disputedAmount, currency, evidenceSummary } = req.body || {};
  if (!paymentTransactionId || !disputeType || disputedAmount === undefined || !currency) {
    return res.status(400).json({ error: 'paymentTransactionId, disputeType, disputedAmount, and currency are required.' });
  }
  const r = createPaymentDisputeV14({
    tenantId: ctx.tenantId,
    paymentTransactionId,
    reconciliationExceptionId,
    disputeType,
    disputedAmount: Number(disputedAmount),
    currency,
    raisedBy: ctx.userId,
    evidenceSummary: evidenceSummary || 'Dispute opened for settlement verification.',
  });
  return res.status(r.statusCode).json(r);
});

v14Router.get('/treasury/currencies', requireV14Context, (_req: Request, res: Response) => {
  return res.json({
    configs: Array.from(db.currencySettlementConfigs.values()),
    fxQuotes: Array.from(db.fxQuoteSources.values()),
    ledgerIsolation: getPerCurrencyLedgerIsolationReport(),
  });
});

// ==========================================
// 5. REAL-WORLD TRADE, PROCUREMENT, EVIDENCE & TAX COMPLIANCE
// ==========================================

v14Router.get('/operations/trades', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  return res.json({
    trades: Array.from(db.tradeOperationWorkflows.values())
      .filter((t) => ctx.isPlatformAdmin || t.tenantId === ctx.tenantId)
      .reverse(),
    evidences: Array.from(db.deliveryVerificationEvidences.values())
      .filter((e) => ctx.isPlatformAdmin || e.tenantId === ctx.tenantId)
      .reverse(),
  });
});

v14Router.post('/operations/trades', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { exporterId, importerId, originJurisdiction, destinationJurisdiction, commodityDescription, contractValue, currency } = req.body || {};
  if (!exporterId || !importerId || !commodityDescription || contractValue === undefined || !currency) {
    return res.status(400).json({ error: 'exporterId, importerId, commodityDescription, contractValue, and currency are required.' });
  }
  const wf = createTradeWorkflowV14({
    tenantId: ctx.tenantId,
    exporterId,
    importerId,
    originJurisdiction: originJurisdiction || 'UG',
    destinationJurisdiction: destinationJurisdiction || 'KE',
    commodityDescription,
    contractValue: Number(contractValue),
    currency,
  });
  return res.status(201).json(wf);
});

v14Router.post('/operations/trades/:id/advance', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const wf = db.tradeOperationWorkflows.get(req.params.id);
  if (!wf) return res.status(404).json({ error: 'Trade workflow not found.' });
  if (!ctx.isPlatformAdmin && wf.tenantId !== ctx.tenantId) {
    return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  }
  const r = advanceTradeWorkflowV14({
    tradeId: wf.id,
    targetStepIndex: req.body?.targetStepIndex,
    actorId: ctx.userId,
  });
  return res.status(r.statusCode).json(r);
});

v14Router.post('/operations/delivery-evidence', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { action, evidenceId, operationType, operationId, claimDescription, verificationSource } = req.body || {};
  if (!action || !operationType || !operationId) {
    return res.status(400).json({ error: 'action, operationType, and operationId are required.' });
  }
  const r = submitOrVerifyDeliveryEvidenceV14({
    action,
    evidenceId,
    tenantId: ctx.tenantId,
    operationType,
    operationId,
    actorId: ctx.userId,
    claimDescription,
    verificationSource,
  });
  return res.status(r.statusCode).json(r);
});

v14Router.get('/operations/procurement', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  return res.json({
    procurements: Array.from(db.procurementOperationWorkflows.values())
      .filter((p) => ctx.isPlatformAdmin || p.tenantId === ctx.tenantId)
      .reverse(),
  });
});

v14Router.post('/operations/procurement', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { procuringEntity, supplierId, jurisdiction, budgetAmount, currency } = req.body || {};
  if (!procuringEntity || !supplierId || budgetAmount === undefined || !currency) {
    return res.status(400).json({ error: 'procuringEntity, supplierId, budgetAmount, and currency are required.' });
  }
  const now = new Date().toISOString();
  const proc = {
    id: `PROC-V14-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    procuringEntity,
    supplierId,
    jurisdiction: jurisdiction || 'UG',
    budgetAmount: Number(budgetAmount),
    currency,
    stage: 'TENDER_PUBLISHED' as const,
    complianceChecklistPassed: true,
    createdAt: now,
    updatedAt: now,
  };
  db.procurementOperationWorkflows.set(proc.id, proc);
  db.scheduleSave();
  return res.status(201).json(proc);
});

v14Router.get('/tax/rules', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  return res.json({
    rules: Array.from(db.taxJurisdictionRules.values()),
    assessments: Array.from(db.taxAssessmentRecords.values())
      .filter((a) => ctx.isPlatformAdmin || a.tenantId === ctx.tenantId)
      .reverse(),
  });
});

v14Router.post('/tax/rules', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const { jurisdiction, taxType, ruleCode, ratePct, effectiveFrom, effectiveTo, authorityName } = req.body || {};
  if (!jurisdiction || !taxType || !ruleCode || ratePct === undefined) {
    return res.status(400).json({ error: 'jurisdiction, taxType, ruleCode, and ratePct are required.' });
  }
  const rule = {
    id: `TAXRULE-${jurisdiction}-${Date.now().toString(36).toUpperCase()}`,
    jurisdiction,
    taxType,
    ruleCode,
    ratePct: Number(ratePct),
    effectiveFrom: effectiveFrom || new Date().toISOString(),
    effectiveTo: effectiveTo || null,
    authorityName: authorityName || `${jurisdiction} Revenue Authority`,
    version: 1,
    active: true,
  };
  db.taxJurisdictionRules.set(rule.id, rule);
  db.scheduleSave();
  return res.status(201).json(rule);
});

v14Router.post('/tax/assess', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { jurisdiction, taxType, operationReferenceId, taxableBase, currency, effectiveAt } = req.body || {};
  if (!jurisdiction || !taxType || !operationReferenceId || taxableBase === undefined || !currency) {
    return res.status(400).json({ error: 'jurisdiction, taxType, operationReferenceId, taxableBase, and currency are required.' });
  }
  const r = assessJurisdictionTaxV14({
    tenantId: ctx.tenantId,
    jurisdiction,
    taxType,
    operationReferenceId,
    taxableBase: Number(taxableBase),
    currency,
    effectiveAt,
  });
  return res.status(r.statusCode).json(r);
});

// ==========================================
// 6. SECURITY OPERATIONS, IDENTITY VERIFICATION, ABAC & WORM ARCHIVES
// ==========================================

v14Router.get('/security/overview', requireV14Context, (_req: Request, res: Response) => {
  return res.json({
    ...getSecurityOperationsSummaryV14(),
    authorizationPolicies: Array.from(db.authorizationPolicies.values()),
    identityRecords: Array.from(db.identityVerificationRecords.values()).reverse().slice(0, 20),
    authorityRecords: Array.from(db.institutionalAuthorityRecords.values()).reverse().slice(0, 20),
    externalAuditArchives: Array.from(db.externalAuditArchives.values()).reverse().slice(0, 20),
  });
});

v14Router.post('/security/policies/evaluate', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { actionType, jurisdiction, amountUgx, hasVerifiedIdentity } = req.body || {};
  if (!actionType) return res.status(400).json({ error: 'actionType is required.' });
  const evalRes = evaluateAuthorizationPolicyV14({
    actionType,
    userRole: ctx.role,
    jurisdiction: jurisdiction || 'UG',
    amountUgx: amountUgx !== undefined ? Number(amountUgx) : 0,
    hasVerifiedIdentity: Boolean(hasVerifiedIdentity),
  });
  return res.status(evalRes.allowed ? 200 : 403).json(evalRes);
});

v14Router.post('/security/identity/verify', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { action, recordId, participantId, legalEntityName, jurisdiction, registrationNumber } = req.body || {};
  if (action === 'VERIFY' || action === 'REJECT') {
    if (!requireAdmin(req, res, ctx)) return;
    const rec = db.identityVerificationRecords.get(recordId);
    if (!rec) return res.status(404).json({ error: 'Identity verification record not found.' });
    rec.verificationTier = action === 'VERIFY' ? 'VERIFIED_LEGAL_REGISTRATION' : 'REJECTED';
    rec.verifiedBy = ctx.userId;
    rec.verifiedAt = new Date().toISOString();
    db.identityVerificationRecords.set(rec.id, rec);
    db.scheduleSave();
    return res.json(rec);
  }
  if (!participantId || !legalEntityName || !registrationNumber) {
    return res.status(400).json({ error: 'participantId, legalEntityName, and registrationNumber are required.' });
  }
  const now = new Date().toISOString();
  const rec = {
    id: `IDV-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    participantId,
    legalEntityName,
    jurisdiction: jurisdiction || 'UG',
    registrationNumber,
    verificationTier: 'SUBMITTED_IDENTITY' as const,
    evidenceHashSha256: `0x${Buffer.from(`${participantId}:${registrationNumber}`).toString('hex')}`,
    submittedAt: now,
  };
  db.identityVerificationRecords.set(rec.id, rec);
  db.scheduleSave();
  return res.status(201).json(rec);
});

v14Router.get('/security/incidents', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const incidents = Array.from(db.securityIncidents.values())
    .filter((i) => ctx.isPlatformAdmin || i.tenantId === ctx.tenantId)
    .reverse();
  return res.json({ incidents, total: incidents.length });
});

v14Router.post('/security/audit/archive', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const archive = createExternalWormAuditArchiveV14(ctx.userId);
  return res.status(201).json(archive);
});

v14Router.post('/security/incidents/:id/mitigate', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const inc = db.securityIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Security incident not found.' });
  inc.status = 'MITIGATED';
  inc.mitigatedBy = ctx.userId;
  inc.mitigatedAt = new Date().toISOString();
  db.securityIncidents.set(inc.id, inc);
  db.scheduleSave();
  return res.json(inc);
});

// ==========================================
// 7. COMMERCIAL PLANS, USAGE BILLING, INVOICES & REFUNDS
// ==========================================

v14Router.get('/commercial/plans', requireV14Context, (_req: Request, res: Response) => {
  return res.json({
    plans: Array.from(db.commercialPlanCatalog.values()),
  });
});

v14Router.get('/commercial/subscriptions', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  return res.json({
    subscriptions: Array.from(db.customerSubscriptions.values())
      .filter((s) => ctx.isPlatformAdmin || s.tenantId === ctx.tenantId),
    usageRecords: Array.from(db.billingUsageRecords.values())
      .filter((u) => ctx.isPlatformAdmin || u.tenantId === ctx.tenantId)
      .reverse(),
    invoices: Array.from(db.customerInvoices.values())
      .filter((i) => ctx.isPlatformAdmin || i.tenantId === ctx.tenantId)
      .reverse(),
    refunds: Array.from(db.refundRecords.values())
      .filter((r) => ctx.isPlatformAdmin || r.tenantId === ctx.tenantId)
      .reverse(),
    revenueDisclosure: 'Issued invoices are tracked separately from realized provider-settled revenue.',
  });
});

v14Router.post('/commercial/subscribe', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { planCode, billingCycle, currency, apiCallsUsage } = req.body || {};
  if (!planCode) return res.status(400).json({ error: 'planCode is required.' });
  try {
    const out = subscribeAndBillTenantV14({
      tenantId: ctx.tenantId,
      planCode,
      billingCycle: billingCycle || 'MONTHLY',
      currency: currency || 'UGX',
      apiCallsUsage: apiCallsUsage !== undefined ? Number(apiCallsUsage) : 12000,
    });
    return res.status(201).json(out);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Subscription failed' });
  }
});

v14Router.post('/commercial/invoices/:id/refund', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const { amount, reason } = req.body || {};
  if (amount === undefined) return res.status(400).json({ error: 'amount is required.' });
  const r = issueInvoiceRefundV14({
    invoiceId: req.params.id,
    amount: Number(amount),
    reason: reason || 'Customer billing adjustment',
    approvedBy: ctx.userId,
  });
  return res.status(r.statusCode).json(r);
});

// ==========================================
// 8. MULTI-REGION OPERATIONS, DEPLOYMENT PROFILES, DR & READINESS
// ==========================================

v14Router.get('/operations/regions', requireV14Context, (_req: Request, res: Response) => {
  return res.json({
    deploymentProfiles: Array.from(db.deploymentEnvironmentProfiles.values()),
    multiRegionDeployments: Array.from(db.multiRegionDeployments.values()),
    drExercises: Array.from(db.disasterRecoveryExercises.values()).reverse().slice(0, 20),
  });
});

v14Router.post('/operations/deployment-profile', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const { profileName } = req.body || {};
  if (!profileName) return res.status(400).json({ error: 'profileName is required.' });
  const target = Array.from(db.deploymentEnvironmentProfiles.values()).find((p) => p.profileName === profileName);
  if (!target) return res.status(404).json({ error: `Profile ${profileName} not found.` });

  if (profileName === 'PRODUCTION') {
    const pgConfigured = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
    const prodHsm = Boolean(process.env.HSM_PKCS11_MODULE_PATH && process.env.HSM_SLOT_PIN);
    if (!pgConfigured || !prodHsm) {
      return res.status(409).json({
        error: 'PRODUCTION_PROFILE_ACTIVATION_BLOCKED',
        message: 'Cannot activate PRODUCTION profile without provisioned PostgreSQL cluster and PKCS#11 Cloud HSM.',
      });
    }
  }

  for (const p of db.deploymentEnvironmentProfiles.values()) {
    p.active = p.id === target.id;
    db.deploymentEnvironmentProfiles.set(p.id, p);
  }
  db.scheduleSave();
  return res.json(target);
});

v14Router.post('/operations/dr-exercises', requireV14Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!requireAdmin(req, res, ctx)) return;
  const { scenario, affectedRegion } = req.body || {};
  const ex = runDisasterRecoveryExerciseV14({
    scenario: scenario || 'DATABASE_CORRUPTION',
    affectedRegion: affectedRegion || 'af-east-ug',
    actorId: ctx.userId,
  });
  return res.status(201).json(ex);
});

v14Router.get('/operations/readiness', requireV14Context, async (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const activeProfile = Array.from(db.deploymentEnvironmentProfiles.values()).find((p) => p.active)?.profileName || 'DEVELOPMENT';
  const assessment = await generateProductionReadinessAssessmentV14(activeProfile, ctx.userId);
  const dbProbe = await probeDatabaseInfrastructureV14();
  const evSummary = getDistributedEventsInfraSummary();
  const secSummary = getSecurityOperationsSummaryV14();
  const currencyReport = getPerCurrencyLedgerIsolationReport();

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: 'UG',
    actorId: ctx.userId,
    actorRole: ctx.role,
    actionType: 'V14_READINESS_ASSESSMENT',
    entityType: 'PRODUCTION_READINESS',
    entityId: assessment.id,
    details: `Readiness evaluated: ${assessment.overallStatus} (${assessment.passedControls}/${assessment.totalControls} controls passed)`,
  });

  return res.json({
    schemaVersion: db.schemaVersion,
    release: 'V14.0-GLOBAL-INSTITUTIONAL-INTEGRATION',
    activeProfile,
    assessment,
    summary: {
      collectionsCount: Object.keys(db.getV14CollectionCountsSnapshot()).length,
      databaseAuthority: dbProbe.activeAuthority,
      postgresReachable: dbProbe.postgresReachable,
      eventBrokerAdapter: evSummary.activeBrokerAdapter,
      supportedCurrencies: currencyReport.supportedCurrencyCount,
      allCurrenciesBalanced: currencyReport.allCurrenciesBalanced,
      openSecurityIncidents: secSummary.openIncidentCount,
      institutionalTargetsCount: db.institutionalConnectorRegistry.size,
      paymentProvidersCount: db.paymentProviderIntegrations.size,
      commercialPlansCount: db.commercialPlanCatalog.size,
    },
  });
});
