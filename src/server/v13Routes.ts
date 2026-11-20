/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V13.0 - Distributed Infrastructure, Sovereign Federation & Production Scale REST Router
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db.ts';
import {
  probePostgresAndTimescale,
  validateDualWriteAuthority,
  executeShadowMigrationReconciliation,
  simulateReplicaFailoverAndPoolRecovery,
} from './v13PostgresAdapter.ts';
import {
  getEventNetworkStatus,
  setBrokerSimulatedOutage,
  publishDistributedEvent,
  replayOutboxAndDeadLetterEvents,
  registerConsumerGroup,
} from './v13EventNetwork.ts';
import {
  encryptInJurisdictionEnclave,
  decryptInJurisdictionEnclave,
  executeGovernedCrossBorderTransfer,
  testInstitutionalConnector,
  validateMtlsCertificate,
  enforceHsmKeyPolicy,
  rotateCryptographicKey,
  createCryptoApprovalRequest,
  signCryptoApprovalRequest,
  verifyCryptoApprovalRequest,
  createAndVerifySignedAuditCheckpoint,
} from './v13SovereigntySecurity.ts';
import {
  runWalkForwardValidation,
  scheduleAndExecuteForecastWorkerJob,
  executeSovereignAIWorkerInference,
  runV13DisasterRecoveryTest,
  getV13VersionedIntegrationContracts,
} from './v13ForecastingAI.ts';
import { logIntelligenceAudit } from './v12Engine.ts';

export const v13Router = Router();

interface V13Context {
  tenantId: string;
  userId?: string;
  role?: string;
  sessionToken: string;
  isPlatformAdmin: boolean;
}

function resolveV13Actor(req: Request): { userId?: string; role?: string; sessionToken: string; isPlatformAdmin: boolean } {
  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string | undefined)?.trim();
  let role = (req.headers['x-user-role'] as string | undefined)?.trim();
  let sessionToken = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionToken = authHeader.slice(7).trim();
    const session = db.validateSession(sessionToken);
    if (session) {
      userId = session.userId;
      role = session.role;
    }
  }

  if (userId) {
    const user = db.users.get(userId);
    if (user) role = user.role;
  }

  return {
    userId,
    role,
    sessionToken: sessionToken || `${userId || 'anon'}-header-sess`,
    isPlatformAdmin: role === 'PLATFORM_ADMIN',
  };
}

function requireV13Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV13Actor(req);
  if (!actor.userId) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id actor header is required for V13 infrastructure endpoints.',
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
      const isPrimaryAdmin = tenant.primaryAdminUserId === actor.userId;
      if (!hasMembership && !isPrimaryAdmin) {
        return res.status(403).json({
          error: 'CROSS_TENANT_ACCESS_DENIED',
          tenantId: requestedTenantId,
          userId: actor.userId,
          message: `User ${actor.userId} does not belong to tenant ${requestedTenantId}.`,
        });
      }
    }
  }

  (req as any).v13Ctx = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    sessionToken: actor.sessionToken,
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies V13Context;

  return next();
}

function ctxOf(req: Request): V13Context {
  return (req as any).v13Ctx as V13Context;
}

function redactKeyRecord(k: any) {
  const { privateKeyDevOnlyRef: _priv, ...safe } = k;
  return safe;
}

function redactCredRecord(c: any) {
  return {
    id: c.id,
    connectorId: c.connectorId,
    authScheme: c.authScheme,
    credentialState: c.credentialState,
    redactedPreview: c.redactedPreview,
    rotatedAt: c.rotatedAt,
    expiresAt: c.expiresAt,
  };
}

// ==========================================
// 1. DISTRIBUTED DATABASE ENDPOINTS (§31)
// ==========================================

v13Router.get('/infrastructure/database/status', requireV13Context, async (_req: Request, res: Response) => {
  const probe = await probePostgresAndTimescale();
  return res.json({
    schemaVersion: db.schemaVersion,
    probe,
    nodes: Array.from(db.distributedDatabaseNodes.values()),
    rollbackReadiness: db.verifyV12BackupAndRollbackReadiness(),
    financialTotals: db.getPreservedFinancialTotals(),
  });
});

v13Router.get('/infrastructure/database/replication', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    replicationStates: Array.from(db.databaseReplicationStates.values()),
    highAvailabilityClaimed: false,
    note: 'Single-node WAL JSON active; replica streaming target requires provisioned external PostgreSQL host.',
  });
});

v13Router.post('/infrastructure/database/verify', requireV13Context, async (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { mode, requestedWriter } = req.body || {};

  if (mode === 'DUAL_WRITE_CHECK') {
    const check = validateDualWriteAuthority(requestedWriter || 'POSTGRES_SECONDARY');
    if (!check.allowed) return res.status(409).json(check);
    return res.json(check);
  }
  if (mode === 'REPLICA_FAILOVER_DRILL') {
    if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required for failover drills.' });
    return res.json(simulateReplicaFailoverAndPoolRecovery(ctx.userId || 'admin'));
  }

  const probe = await probePostgresAndTimescale();
  const shadow = executeShadowMigrationReconciliation();
  return res.json({ probe, shadow });
});

v13Router.get('/infrastructure/database/migrations', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    schemaVersion: db.schemaVersion,
    migrationHistory: db.migrationHistory,
    v12MigrationManifests: db.v12MigrationManifests,
    v13DatabaseManifests: Array.from(db.databaseMigrationManifests.values()),
    v12BackupCheck: db.verifyV12BackupAndRollbackReadiness(),
  });
});

// ==========================================
// 2. DISTRIBUTED EVENT NETWORK ENDPOINTS (§31)
// ==========================================

v13Router.get('/infrastructure/events/status', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const status = getEventNetworkStatus();
  const outbox = Array.from(db.distributedEventOutbox.values()).filter(
    (e) => ctx.isPlatformAdmin || e.tenantId === ctx.tenantId || e.tenantId === 'GLOBAL_PUBLIC'
  );
  return res.json({
    ...status,
    schemas: Array.from(db.distributedEventSchemas.values()),
    recentOutbox: outbox.slice(-40).reverse(),
  });
});

v13Router.post('/infrastructure/events/publish', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { eventType, schemaVersion, producer, jurisdiction, correlationId, idempotencyKey, payloadReference, payloadSummary, poisonSimulate } = req.body || {};
  if (!eventType || !payloadReference) {
    return res.status(400).json({ error: 'eventType and payloadReference are required.' });
  }
  const result = publishDistributedEvent({
    eventType,
    schemaVersion,
    producer: producer || 'AETHER-AROS-API',
    jurisdiction: jurisdiction || 'UG',
    tenantId: ctx.tenantId,
    correlationId,
    idempotencyKey,
    actorId: ctx.userId || 'actor',
    actorRole: ctx.role || 'MEMBER',
    payloadReference,
    payloadSummary,
    poisonSimulate: Boolean(poisonSimulate),
  });
  if (!result.accepted) return res.status(400).json(result);
  return res.status(result.deduplicated ? 200 : 201).json(result);
});

v13Router.get('/infrastructure/events/consumers', requireV13Context, (_req: Request, res: Response) => {
  return res.json(Array.from(db.distributedEventConsumers.values()));
});

v13Router.post('/infrastructure/events/consumers', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { consumerGroup, subscribedEventTypes, jurisdictionScope } = req.body || {};
  if (!consumerGroup || !Array.isArray(subscribedEventTypes) || subscribedEventTypes.length === 0) {
    return res.status(400).json({ error: 'consumerGroup and subscribedEventTypes[] are required.' });
  }
  const consumer = registerConsumerGroup({
    consumerGroup,
    subscribedEventTypes,
    tenantScope: ctx.isPlatformAdmin ? 'ALL' : ctx.tenantId,
    jurisdictionScope: jurisdictionScope || 'ALL',
  });
  return res.status(201).json(consumer);
});

v13Router.get('/infrastructure/events/dead-letter', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const list = Array.from(db.distributedDeadLetterEvents.values()).filter(
    (d) => ctx.isPlatformAdmin || d.tenantId === ctx.tenantId
  );
  return res.json(list);
});

v13Router.post('/infrastructure/events/replay', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { simulateOutage, deadLetterId } = req.body || {};
  if (typeof simulateOutage === 'boolean') {
    if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required to toggle broker simulation.' });
    return res.json(setBrokerSimulatedOutage(simulateOutage));
  }
  const replay = replayOutboxAndDeadLetterEvents({
    tenantId: ctx.isPlatformAdmin ? undefined : ctx.tenantId,
    includeDeadLetterId: deadLetterId,
  });
  return res.json(replay);
});

// ==========================================
// 3. SOVEREIGN DATA FEDERATION ENDPOINTS (§31)
// ==========================================

v13Router.get('/federation/jurisdictions', requireV13Context, (_req: Request, res: Response) => {
  return res.json(Array.from(db.sovereignJurisdictions.values()));
});

v13Router.post('/federation/jurisdictions', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required to configure jurisdictions.' });
  const { code, name, regionalBloc, residencyRequirement, defaultCrossBorderPolicy, localAdministrativeAuthority } = req.body || {};
  if (!code || !name) return res.status(400).json({ error: 'code and name are required.' });
  const jur = {
    id: `JUR-${code.toUpperCase()}`,
    code: code.toUpperCase(),
    name,
    regionalBloc: regionalBloc || 'AFCFTA',
    residencyRequirement: residencyRequirement || 'STRICT_LOCAL_RESIDENCY',
    defaultCrossBorderPolicy: defaultCrossBorderPolicy || 'RESTRICTED_PENDING_REVIEW',
    approvedInstitutionalConnectors: [],
    keyManagementMode: 'LOCAL_KMS_DEV_ISOLATED' as const,
    localAdministrativeAuthority: localAdministrativeAuthority || `${name} Enclave Authority`,
    auditRetentionDays: 2555,
    status: 'CONFIGURABLE' as const,
    configuredAt: new Date().toISOString(),
  };
  db.sovereignJurisdictions.set(jur.code, jur);
  db.scheduleSave();
  return res.status(201).json(jur);
});

v13Router.get('/federation/policies', requireV13Context, (req: Request, res: Response) => {
  const jurisdiction = (req.query.jurisdiction as string | undefined)?.toUpperCase();
  let policies = Array.from(db.sovereignDataPolicies.values());
  if (jurisdiction) policies = policies.filter((p) => p.jurisdictionCode === jurisdiction);
  return res.json(policies);
});

v13Router.get('/federation/enclaves', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const enclaves = Array.from(db.sovereignDataEnclaves.values()).filter(
    (e) => ctx.isPlatformAdmin || e.tenantIdsAllowed.includes(ctx.tenantId) || e.tenantIdsAllowed.includes('GLOBAL_PUBLIC')
  );
  return res.json(enclaves);
});

v13Router.post('/federation/enclaves/verify-seal', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { jurisdictionCode, plaintext } = req.body || {};
  if (!jurisdictionCode || !plaintext) return res.status(400).json({ error: 'jurisdictionCode and plaintext required.' });
  const enc = encryptInJurisdictionEnclave(jurisdictionCode.toUpperCase(), ctx.tenantId, plaintext);
  if (!enc.allowed) return res.status(403).json(enc);
  const dec = decryptInJurisdictionEnclave(jurisdictionCode.toUpperCase(), ctx.tenantId, enc.ciphertextBase64!, enc.ivHex!, enc.authTagHex!);
  return res.json({ sealed: true, keyId: enc.keyId, decryptedVerified: dec.plaintext === plaintext });
});

v13Router.post('/federation/transfers', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const {
    originJurisdiction,
    destinationJurisdiction,
    dataClassification,
    dataCategory,
    dataOwnerId,
    dataOwnerConsentGranted,
    sendingJurisdictionAuthorized,
    receivingJurisdictionAuthorized,
    purpose,
    requestedFields,
    receivingParty,
    expiresInHours,
    interruptSimulation,
  } = req.body || {};

  if (!originJurisdiction || !destinationJurisdiction || !purpose) {
    return res.status(400).json({ error: 'originJurisdiction, destinationJurisdiction, and purpose are required.' });
  }

  const out = executeGovernedCrossBorderTransfer({
    originJurisdiction,
    destinationJurisdiction,
    tenantId: ctx.tenantId,
    dataClassification: dataClassification || 'RESTRICTED',
    dataCategory,
    dataOwnerId: dataOwnerId || ctx.userId || 'owner',
    dataOwnerConsentGranted: Boolean(dataOwnerConsentGranted),
    sendingJurisdictionAuthorized: Boolean(sendingJurisdictionAuthorized),
    receivingJurisdictionAuthorized: Boolean(receivingJurisdictionAuthorized),
    purpose,
    requestedFields: Array.isArray(requestedFields) ? requestedFields : ['aggregateIndex'],
    receivingParty: receivingParty || 'AUTHORIZED_REGIONAL_COUNTERPARTY',
    expiresInHours,
    interruptSimulation: Boolean(interruptSimulation),
    actorId: ctx.userId || 'actor',
    actorRole: ctx.role || 'MEMBER',
  });

  if (!out.accepted) return res.status(403).json(out);
  return res.status(201).json(out);
});

v13Router.get('/federation/transfers/:id', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const xfer = db.crossBorderDataTransfers.get(req.params.id);
  if (!xfer) return res.status(404).json({ error: 'Cross-border transfer not found.' });
  if (!ctx.isPlatformAdmin && xfer.tenantId !== ctx.tenantId) {
    return res.status(403).json({ error: 'TENANT_ISOLATION_DENIED' });
  }
  if (xfer.status === 'COMPLETED' && Date.parse(xfer.expiresAt) <= Date.now()) {
    xfer.status = 'EXPIRED';
    db.crossBorderDataTransfers.set(xfer.id, xfer);
  }
  return res.json(xfer);
});

v13Router.post('/federation/transfers/:id/action', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const xfer = db.crossBorderDataTransfers.get(req.params.id);
  if (!xfer) return res.status(404).json({ error: 'Cross-border transfer not found.' });
  if (!ctx.isPlatformAdmin && xfer.tenantId !== ctx.tenantId) {
    return res.status(403).json({ error: 'TENANT_ISOLATION_DENIED' });
  }
  const { action } = req.body || {};
  if (action === 'REVOKE') {
    xfer.status = 'REVOKED';
    xfer.rejectionReason = `Revoked by ${ctx.userId}`;
  } else if (action === 'RECOVER' && xfer.status === 'IN_PROGRESS') {
    xfer.status = 'RECOVERED';
  } else {
    return res.status(400).json({ error: 'Unsupported transfer action (use REVOKE or RECOVER).' });
  }
  db.crossBorderDataTransfers.set(xfer.id, xfer);
  db.scheduleSave();
  return res.json(xfer);
});

// ==========================================
// 4. INSTITUTIONAL CONNECTIVITY & CERTIFICATES (§31)
// ==========================================

v13Router.get('/institutions/connectors', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    connectors: Array.from(db.institutionalConnectorRegistry.values()),
    credentials: Array.from(db.institutionalConnectorCredentials.values()).map(redactCredRecord),
  });
});

v13Router.post('/institutions/connectors/:id/test', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required to run connector diagnostics.' });
  const result = testInstitutionalConnector(req.params.id, ctx.userId || 'admin');
  if (!result.found) return res.status(404).json(result);
  return res.json(result);
});

v13Router.get('/institutions/connectors/:id/health', requireV13Context, (req: Request, res: Response) => {
  const conn = db.institutionalConnectorRegistry.get(req.params.id);
  if (!conn) return res.status(404).json({ error: 'Connector not found.' });
  const health = db.institutionalConnectionHealth.get(`IHLTH-${conn.id}`);
  return res.json({ connector: conn, health });
});

v13Router.get('/institutions/certificates', requireV13Context, (_req: Request, res: Response) => {
  return res.json(Array.from(db.institutionalCertificates.values()));
});

v13Router.post('/institutions/certificates/:id/lifecycle', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required for certificate lifecycle.' });
  const cert = db.institutionalCertificates.get(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Certificate not found.' });
  const { action, reason } = req.body || {};

  if (action === 'VALIDATE') {
    const val = validateMtlsCertificate(cert.id);
    if (!val.valid) return res.status(403).json(val);
    return res.json(val);
  }
  if (action === 'EXPIRE_TEST') {
    cert.validTo = new Date(Date.now() - 86400 * 1000).toISOString();
    cert.status = 'EXPIRED';
    db.institutionalCertificates.set(cert.id, cert);
    db.scheduleSave();
    return res.json(cert);
  }
  if (action === 'REVOKE') {
    cert.status = 'REVOKED';
    cert.revocationReason = reason || 'Revoked during mTLS security lifecycle check';
    db.institutionalCertificates.set(cert.id, cert);
    db.scheduleSave();
    return res.json(cert);
  }
  if (action === 'ROTATE') {
    cert.validFrom = new Date().toISOString();
    cert.validTo = new Date(Date.now() + 365 * 86400 * 1000).toISOString();
    cert.status = 'VALID_DEV_TEST';
    cert.revocationReason = undefined;
    cert.fingerprintSha256 = `0x${crypto.createHash('sha256').update(`${cert.id}-${Date.now()}`).digest('hex')}`;
    db.institutionalCertificates.set(cert.id, cert);
    db.scheduleSave();
    return res.json(cert);
  }
  return res.status(400).json({ error: 'Invalid action; use VALIDATE, EXPIRE_TEST, REVOKE, or ROTATE.' });
});

// ==========================================
// 5. CRYPTOGRAPHIC KEYS, HSM & DUAL AUTHORIZATION (§31)
// ==========================================

v13Router.get('/security/keys', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    keys: Array.from(db.cryptographicKeyRegistry.values()).map(redactKeyRecord),
    auditCheckpoints: Array.from(db.signedAuditCheckpoints.values()),
  });
});

v13Router.post('/security/keys/:id/lifecycle', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required for KMS lifecycle actions.' });
  const { action, requireProductionHsm } = req.body || {};
  const key = db.cryptographicKeyRegistry.get(req.params.id);
  if (!key) return res.status(404).json({ error: 'Key not found.' });

  if (action === 'CHECK_POLICY') {
    const chk = enforceHsmKeyPolicy(key.id, Boolean(requireProductionHsm));
    if (!chk.allowed) return res.status(403).json(chk);
    return res.json({ allowed: true, key: redactKeyRecord(chk.key) });
  }
  if (action === 'ROTATE') {
    const out = rotateCryptographicKey(key.id, ctx.userId || 'admin');
    if (!out.success) return res.status(400).json(out);
    return res.json(out);
  }
  if (action === 'REVOKE' || action === 'MARK_COMPROMISED') {
    key.status = action === 'REVOKE' ? 'REVOKED' : 'COMPROMISED';
    db.cryptographicKeyRegistry.set(key.id, key);
    db.scheduleSave();
    return res.json({ key: redactKeyRecord(key) });
  }
  if (action === 'RESTORE_ACTIVE_DEV') {
    key.status = 'ACTIVE';
    db.cryptographicKeyRegistry.set(key.id, key);
    db.scheduleSave();
    return res.json({ key: redactKeyRecord(key) });
  }
  return res.status(400).json({ error: 'Unsupported key action.' });
});

v13Router.get('/security/hsm/status', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    modules: Array.from(db.hardwareSecurityModules.values()),
    strictNoProdToDevFallback: true,
    pendingApprovalRequestsCount: Array.from(db.cryptographicApprovalRequests.values()).filter(
      (r) => r.status === 'PENDING_DUAL_APPROVAL'
    ).length,
    approvalRequests: Array.from(db.cryptographicApprovalRequests.values()).slice(-25).reverse(),
  });
});

v13Router.post('/security/audit-checkpoint', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required to issue signed audit checkpoints.' });
  return res.status(201).json(createAndVerifySignedAuditCheckpoint());
});

v13Router.post('/security/approvals', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { actionType, jurisdiction, operationPayload, expiresInMinutes } = req.body || {};
  if (!actionType || !operationPayload || typeof operationPayload !== 'object') {
    return res.status(400).json({ error: 'actionType and operationPayload object are required.' });
  }
  const approval = createCryptoApprovalRequest({
    tenantId: ctx.tenantId,
    jurisdiction: jurisdiction || 'UG',
    actionType,
    operationPayload,
    requestedBy: ctx.userId || 'requester',
    expiresInMinutes,
  });
  return res.status(201).json(approval);
});

v13Router.post('/security/approvals/:id/sign', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { keyId, payloadToSign, replaySignatureBase64 } = req.body || {};
  const result = signCryptoApprovalRequest({
    approvalRequestId: req.params.id,
    signerUserId: ctx.userId || 'anon',
    signerRole: ctx.role || 'MEMBER',
    sessionToken: ctx.sessionToken,
    keyId: keyId || 'KMS-UG-OP-SIGN-01',
    payloadToSign,
    replaySignatureBase64,
  });
  if (!result.success) {
    const code = result.code === 'NOT_FOUND' ? 404 : result.code === 'PAYLOAD_HASH_MISMATCH' || result.code === 'APPROVAL_EXPIRED' ? 400 : 403;
    return res.status(code).json(result);
  }
  return res.json(result);
});

v13Router.post('/security/approvals/:id/verify', requireV13Context, (req: Request, res: Response) => {
  const { expectedPayload } = req.body || {};
  const verification = verifyCryptoApprovalRequest(req.params.id, expectedPayload);
  if (!verification.verified) {
    return res.status(verification.reason === 'NOT_FOUND' ? 404 : 403).json(verification);
  }
  return res.json(verification);
});

// ==========================================
// 6. DISTRIBUTED FORECASTING, AI WORKERS & VALIDATION (§31)
// ==========================================

v13Router.get('/intelligence/workers', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    forecastingWorkers: Array.from(db.forecastingWorkers.values()),
    aiWorkers: Array.from(db.distributedAIWorkers.values()),
    recentJobs: Array.from(db.forecastingJobQueue.values()).slice(-20).reverse(),
    recentAiRuns: Array.from(db.distributedAIJobRuns.values()).slice(-20).reverse(),
  });
});

v13Router.post('/intelligence/ai-workers/:id/infer', requireV13Context, async (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { jurisdiction, prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required.' });
  const out = await executeSovereignAIWorkerInference({
    workerId: req.params.id,
    tenantId: ctx.tenantId,
    jurisdiction: jurisdiction || 'UG',
    prompt,
    actorId: ctx.userId || 'analyst',
    actorRole: ctx.role || 'MEMBER',
  });
  return res.status(out.statusCode).json(out);
});

v13Router.post('/intelligence/forecast-jobs', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { indicatorId, method, horizon, simulateWorkerFailure } = req.body || {};
  if (!indicatorId) return res.status(400).json({ error: 'indicatorId is required.' });
  const result = scheduleAndExecuteForecastWorkerJob({
    tenantId: ctx.tenantId,
    indicatorId,
    method: method || 'SARIMA_SEASONAL',
    horizon: horizon || 'NEAR_TERM',
    simulateWorkerFailure: Boolean(simulateWorkerFailure),
    actorId: ctx.userId || 'analyst',
    actorRole: ctx.role || 'MEMBER',
  });
  return res.status(201).json(result);
});

v13Router.get('/intelligence/forecast-jobs/:id', requireV13Context, (req: Request, res: Response) => {
  const job = db.forecastingJobQueue.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Forecast job not found.' });
  return res.json(job);
});

v13Router.post('/intelligence/models/validate', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  const { experimentId, indicatorId, method, windowType, action } = req.body || {};

  if (action === 'PROMOTE' && experimentId) {
    if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required to promote model experiment.' });
    const exp = db.forecastingModelExperiments.get(experimentId);
    if (!exp) return res.status(404).json({ error: 'Experiment not found.' });
    const hasVal = Array.from(db.forecastingValidationRuns.values()).some((v) => v.experimentId === exp.id && v.strictChronologicalNoLeakage);
    if (!hasVal || !exp.outperformsBaseline) {
      return res.status(400).json({ error: 'PROMOTION_GATE_BLOCKED: Must pass chronological walk-forward validation and match/beat baseline first.' });
    }
    exp.lifecycleStage = 'ACTIVE';
    exp.promotedBy = ctx.userId;
    db.forecastingModelExperiments.set(exp.id, exp);
    db.scheduleSave();
    return res.json(exp);
  }

  if (action === 'ROLLBACK' && experimentId) {
    if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required to roll back model experiment.' });
    const exp = db.forecastingModelExperiments.get(experimentId);
    if (!exp) return res.status(404).json({ error: 'Experiment not found.' });
    exp.lifecycleStage = 'ROLLED_BACK';
    db.forecastingModelExperiments.set(exp.id, exp);
    db.scheduleSave();
    return res.json({ rolledBack: true, activeFallbackModelId: exp.rollbackModelId, experiment: exp });
  }

  if (!experimentId || !indicatorId || !method) {
    return res.status(400).json({ error: 'experimentId, indicatorId, and method are required.' });
  }
  const out = runWalkForwardValidation({
    experimentId,
    indicatorId,
    method,
    windowType: windowType || 'WALK_FORWARD_EXPANDING',
    actorId: ctx.userId || 'validator',
  });
  if (!out.success) return res.status(400).json(out);
  return res.json(out);
});

v13Router.get('/intelligence/models/experiments', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    experiments: Array.from(db.forecastingModelExperiments.values()),
    validationRuns: Array.from(db.forecastingValidationRuns.values()),
    hyperparameters: Array.from(db.forecastingHyperparameters.values()),
  });
});

// ==========================================
// 7. MULTI-REGION OPERATIONS & DISASTER RECOVERY (§31)
// ==========================================

v13Router.get('/operations/regions', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    regions: Array.from(db.regionalServiceHealth.values()),
    contracts: getV13VersionedIntegrationContracts(),
  });
});

v13Router.get('/operations/health', requireV13Context, async (_req: Request, res: Response) => {
  const pgProbe = await probePostgresAndTimescale();
  const evStatus = getEventNetworkStatus();
  return res.json({
    schemaVersion: db.schemaVersion,
    release: 'V13.0-DISTRIBUTED-SOVEREIGN-INFRASTRUCTURE',
    database: pgProbe,
    eventNetwork: evStatus,
    regions: Array.from(db.regionalServiceHealth.values()),
    hsmModules: Array.from(db.hardwareSecurityModules.values()),
    collectionsCount: Object.keys(db.getV13CollectionCountsSnapshot()).length,
  });
});

v13Router.get('/operations/disaster-recovery', requireV13Context, (_req: Request, res: Response) => {
  return res.json({
    targets: {
      coreFinancialRpoMinutes: 5,
      corePlatformRtoMinutes: 60,
      intelligenceRtoHours: 4,
      note: 'Engineering targets; verified via deterministic failover drills in single-node environment.',
    },
    events: Array.from(db.disasterRecoveryEvents.values()).reverse(),
    v12BackupRollbackReadiness: db.verifyV12BackupAndRollbackReadiness(),
  });
});

v13Router.post('/operations/recovery-tests', requireV13Context, (req: Request, res: Response) => {
  const ctx = ctxOf(req);
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'PLATFORM_ADMIN required to trigger DR drills.' });
  const { scenarioType, affectedRegion } = req.body || {};
  const drill = runV13DisasterRecoveryTest({
    scenarioType: scenarioType || 'DATABASE_OUTAGE',
    affectedRegion: affectedRegion || 'af-east-ug',
    actorId: ctx.userId || 'admin',
  });
  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'UG',
    actorId: ctx.userId || 'admin',
    actorRole: 'PLATFORM_ADMIN',
    actionType: 'DISASTER_RECOVERY_DRILL',
    entityType: 'DISASTER_RECOVERY_EVENT',
    entityId: drill.id,
    details: `Executed DR drill ${drill.scenarioType} on ${drill.affectedRegion}: ${drill.status}`,
  });
  return res.status(201).json(drill);
});

v13Router.post('/institutions/webhooks/verify', requireV13Context, (req: Request, res: Response) => {
  const { connectorId, webhookId, timestampHeader, signatureHex, payload } = req.body || {};
  if (!connectorId || !webhookId || !signatureHex || !payload) {
    return res.status(400).json({ error: 'connectorId, webhookId, signatureHex, and payload are required.' });
  }
  const replayDup = Array.from(db.distributedEventInbox.values()).some((i) => i.idempotencyKey === `WH-${webhookId}`);
  if (replayDup) {
    return res.status(409).json({ valid: false, error: 'DUPLICATE_WEBHOOK_REJECTED', webhookId });
  }
  const secret = process.env.INSTITUTIONAL_WEBHOOK_SECRET || `DEV_WH_SECRET_${connectorId}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestampHeader || ''}.${typeof payload === 'string' ? payload : JSON.stringify(payload)}`)
    .digest('hex');

  const sigMatch = signatureHex.length === expected.length && crypto.timingSafeEqual(Buffer.from(signatureHex), Buffer.from(expected));
  if (!sigMatch) {
    return res.status(403).json({ valid: false, error: 'INVALID_WEBHOOK_SIGNATURE' });
  }
  db.distributedEventInbox.set(`INB-WH-${Date.now().toString(36).toUpperCase()}`, {
    id: `INB-WH-${Date.now().toString(36).toUpperCase()}`,
    outboxEventId: webhookId,
    consumerGroupId: 'institutional-webhook-ingress',
    idempotencyKey: `WH-${webhookId}`,
    receivedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    status: 'PROCESSED',
    financialSettlementVerifiedByProvider: false,
  });
  db.scheduleSave();
  return res.json({ valid: true, webhookId, connectorId });
});
