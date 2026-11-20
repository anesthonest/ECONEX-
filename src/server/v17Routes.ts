/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V17.0 - Verified Economic Network Operations REST API Router (/api/v17/*)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import {
  attachV17TransactionEvidence,
  createV17BuyerRequest,
  createV17Listing,
  createV17Organization,
  createV17Transaction,
  getV17GatesSummary,
  inviteV17Relationship,
  listV17Relationships,
  negotiateV17Quotation,
  onboardV17Participant,
  queueAndSyncV17OfflineAction,
  remediateV17Gate,
  respondV17RelationshipInvitation,
  reviewV17VerificationEvidence,
  submitV17Quotation,
  submitV17VerificationEvidence,
  transitionV17Transaction,
  updateV17RelationshipStatus,
  verifyV17Transaction,
} from './v17NetworkOps.ts';
import {
  activateV17Jurisdiction,
  advanceV17Dispute,
  appealV17Review,
  computeV17EconomicIntelligence,
  createV17LogisticsShipment,
  createV17PrivacyRequest,
  decideV17PolicyApproval,
  getV17BillingSummary,
  getV17CooperativeDetail,
  openV17Dispute,
  openV17ReconciliationCase,
  recomputeV17Reputation,
  recordV17CooperativeActivity,
  recordV17NetworkBilling,
  requestV17PolicyApproval,
  resolveV17ReconciliationCase,
  submitV17Review,
  updateV17LogisticsShipmentStatus,
} from './v17TrustRegional.ts';

export const v17Router = Router();

interface V17Context {
  tenantId: string;
  userId: string;
  role: string;
  isPlatformAdmin: boolean;
}

const RATE_WINDOW = new Map<string, number[]>();

function checkV17RateLimit(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['x-user-id'] as string) || req.ip || 'anon';
  const now = Date.now();
  const list = (RATE_WINDOW.get(key) || []).filter((ts) => now - ts < 60_000);
  if (list.length >= 600) {
    return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests in 60s window.' });
  }
  list.push(now);
  RATE_WINDOW.set(key, list);
  return next();
}

function recordV17SecurityIncident(category: any, severity: any, tenantId: string, actorId: string | undefined, details: string) {
  const id = `SECINC-V17-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
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

function resolveV17Actor(req: Request): { userId?: string; role: string; isPlatformAdmin: boolean } {
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

function requireV17Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV17Actor(req);
  if (!actor.userId) {
    recordV17SecurityIncident('AUTH_FAILURE_BURST', 'MEDIUM', 'GLOBAL_PUBLIC', undefined, `Unauthenticated V17 request blocked on ${req.path}`);
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V17 APIs.',
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

  if (
    !actor.isPlatformAdmin &&
    requestedTenantId !== 'GLOBAL_PUBLIC' &&
    headerTenant &&
    explicitParamTenant &&
    headerTenant !== explicitParamTenant
  ) {
    recordV17SecurityIncident(
      'CROSS_TENANT_ACCESS',
      'HIGH',
      requestedTenantId,
      actor.userId,
      `Cross-tenant access blocked on V17 ${req.path}: header=${headerTenant}, param=${explicitParamTenant}`
    );
    return res.status(403).json({
      error: 'CROSS_TENANT_ACCESS_BLOCKED',
      message: `Access denied across tenant boundary (${headerTenant} vs ${explicitParamTenant}).`,
    });
  }

  (req as any).v17Context = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } as V17Context;
  return next();
}

function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as any).v17Context as V17Context;
  if (!ctx?.isPlatformAdmin) {
    recordV17SecurityIncident('RBAC_ESCALATION', 'HIGH', ctx?.tenantId || 'GLOBAL_PUBLIC', ctx?.userId, `Unauthorized V17 admin attempt on ${req.path}`);
    return res.status(403).json({
      error: 'FORBIDDEN_ADMIN_ONLY',
      message: 'PLATFORM_ADMIN role required for this V17 operation.',
    });
  }
  return next();
}

function getCtx(req: Request): V17Context {
  return (req as any).v17Context;
}

v17Router.use(checkV17RateLimit);
v17Router.use(requireV17Context);

// 1. Network Overview & Gate Remediation
v17Router.get('/network/overview', async (_req: Request, res: Response) => {
  const gates = await getV17GatesSummary();
  const intel = computeV17EconomicIntelligence();
  const migration = db.verifyV17MigrationCompleteness();
  return res.json({
    product: 'ECONEX',
    releaseVersion: 'V17.0-VERIFIED-ECONOMIC-NETWORK-OPERATIONS',
    schemaVersion: db.schemaVersion,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    statuses: gates.statuses,
    gatesSummary: {
      totalGates: gates.totalGates,
      v16GatesPassed: gates.v16GatesPassed,
      v17ProductionReadyCount: gates.v17ProductionReadyCount,
      externalBlockedCount: gates.externalBlockedCount,
    },
    migrationComplete: migration.complete,
    v16RollbackReady: migration.v16RollbackReady,
    intelligence: intel,
  });
});

v17Router.get('/gates', async (_req: Request, res: Response) => {
  return res.json(await getV17GatesSummary());
});

v17Router.post('/gates/:gateId/remediate', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = remediateV17Gate({
    gateId: req.params.gateId,
    targetStatus: req.body?.targetStatus,
    submittedEvidence: req.body?.submittedEvidence,
    waiverAuthority: req.body?.waiverAuthority,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.gate : { error: out.error });
});

// 2. Schema 17 Migration & Integrity
v17Router.get('/database/migrations', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json({
    v16BackupReadiness: db.verifyV16BackupAndRollbackReadiness(),
    completeness: db.verifyV17MigrationCompleteness(),
    checkpoints: Array.from(db.v17MigrationCheckpoints.values()),
  });
});

// 3. Verified Participant & Organization Onboarding
v17Router.get('/participants', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const list = Array.from(db.v17Participants.values()).filter((p) => {
    if (ctx.isPlatformAdmin) return true;
    if (p.visibility === 'PUBLIC' || p.visibility === 'PARTICIPANTS_ONLY') return true;
    return p.userId === ctx.userId;
  });
  return res.json({ participants: list, count: list.length });
});

v17Router.post('/participants/onboard', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = onboardV17Participant({
    userId: req.body?.userId || ctx.userId,
    tenantId: ctx.tenantId,
    participantType: req.body?.participantType || 'FARMER',
    displayName: req.body?.displayName,
    phone: req.body?.phone,
    countryCode: req.body?.countryCode,
    district: req.body?.district,
    languages: req.body?.languages,
    consentGranted: Boolean(req.body?.consentGranted),
    consentVersion: req.body?.consentVersion,
    visibility: req.body?.visibility,
  });
  return res.status(out.statusCode).json(out.ok ? out.participant : { error: out.error });
});

v17Router.post('/participants/verification/evidence', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = submitV17VerificationEvidence({
    subjectId: req.body?.subjectId,
    subjectType: req.body?.subjectType || 'PARTICIPANT',
    documentType: req.body?.documentType || 'NATIONAL_OR_BUSINESS_DOC',
    documentReference: req.body?.documentReference,
    submittedBy: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.evidence : { error: out.error });
});

v17Router.post('/participants/verification/:evidenceId/review', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = reviewV17VerificationEvidence({
    evidenceId: req.params.evidenceId,
    decision: req.body?.decision || 'APPROVED',
    targetLevel: req.body?.targetLevel,
    reviewNotes: req.body?.reviewNotes || 'Reviewed',
    reviewerId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.evidence : { error: out.error });
});

v17Router.get('/organizations', (_req: Request, res: Response) => {
  return res.json({
    organizations: Array.from(db.v17Organizations.values()),
    members: Array.from(db.v17OrganizationMembers.values()),
  });
});

v17Router.post('/organizations', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV17Organization({
    tenantId: ctx.tenantId,
    legalName: req.body?.legalName,
    orgType: req.body?.orgType,
    countryCode: req.body?.countryCode,
    district: req.body?.district,
    registrationRef: req.body?.registrationRef,
    ownerParticipantId: req.body?.ownerParticipantId,
  });
  return res.status(out.statusCode).json(out.ok ? out.organization : { error: out.error });
});

// 4. Network Relationships & Invitations
v17Router.get('/relationships', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  return res.json(listV17Relationships({ viewerId: ctx.userId, isPlatformAdmin: ctx.isPlatformAdmin }));
});

v17Router.post('/relationships/invite', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = inviteV17Relationship({
    tenantId: ctx.tenantId,
    fromParticipantId: req.body?.fromParticipantId || ctx.userId,
    toParticipantId: req.body?.toParticipantId,
    relationshipType: req.body?.relationshipType || 'SUPPLIER_BUYER',
    visibility: req.body?.visibility,
    termsSummary: req.body?.termsSummary,
  });
  return res.status(out.statusCode).json(out.ok ? out.invitation : { error: out.error });
});

v17Router.post('/relationships/invitations/:id/respond', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = respondV17RelationshipInvitation({
    invitationId: req.params.id,
    decision: req.body?.decision === 'REJECTED' ? 'REJECTED' : 'ACCEPTED',
    responderId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

v17Router.post('/relationships/:id/status', (req: Request, res: Response) => {
  const out = updateV17RelationshipStatus({
    relationshipId: req.params.id,
    action: req.body?.action || 'SUSPEND',
  });
  return res.status(out.statusCode).json(out.ok ? out.relationship : { error: out.error });
});

// 5. Commercial Listings, Buyer Requests & Quotations/Negotiations
v17Router.get('/commercial/listings', (req: Request, res: Response) => {
  const q = String(req.query.q || '').toLowerCase();
  const country = String(req.query.countryCode || '').toUpperCase();
  const sector = String(req.query.sector || '').toUpperCase();
  const items = Array.from(db.v17CommercialListings.values()).filter((l) => {
    if (q && !l.title.toLowerCase().includes(q) && !l.category.toLowerCase().includes(q) && !l.district.toLowerCase().includes(q)) return false;
    if (country && l.countryCode !== country) return false;
    if (sector && l.sector.toUpperCase() !== sector) return false;
    return true;
  });
  return res.json({
    listings: items,
    requests: Array.from(db.v17BuyerRequests.values()),
    quotations: Array.from(db.v17Quotations.values()),
    negotiations: Array.from(db.v17Negotiations.values()),
  });
});

v17Router.post('/commercial/listings', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV17Listing({
    tenantId: ctx.tenantId,
    sellerParticipantId: req.body?.sellerParticipantId || ctx.userId,
    organizationId: req.body?.organizationId,
    title: req.body?.title,
    sector: req.body?.sector,
    category: req.body?.category,
    countryCode: req.body?.countryCode,
    district: req.body?.district,
    unitPrice: req.body?.unitPrice,
    currency: req.body?.currency,
    unitCode: req.body?.unitCode,
    availableQty: req.body?.availableQty,
    minOrderQty: req.body?.minOrderQty,
    qualityGrade: req.body?.qualityGrade,
    deliveryTerms: req.body?.deliveryTerms,
  });
  return res.status(out.statusCode).json(out.ok ? out.listing : { error: out.error });
});

v17Router.post('/commercial/requests', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV17BuyerRequest({
    tenantId: ctx.tenantId,
    buyerParticipantId: req.body?.buyerParticipantId || ctx.userId,
    title: req.body?.title,
    sector: req.body?.sector,
    countryCode: req.body?.countryCode,
    targetDistrict: req.body?.targetDistrict,
    requestedQty: req.body?.requestedQty,
    unitCode: req.body?.unitCode,
    targetUnitPrice: req.body?.targetUnitPrice,
    currency: req.body?.currency,
    deliveryDeadline: req.body?.deliveryDeadline,
  });
  return res.status(out.statusCode).json(out.ok ? out.request : { error: out.error });
});

v17Router.post('/commercial/quotations', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = submitV17Quotation({
    tenantId: ctx.tenantId,
    requestId: req.body?.requestId,
    listingId: req.body?.listingId,
    sellerParticipantId: req.body?.sellerParticipantId || ctx.userId,
    buyerParticipantId: req.body?.buyerParticipantId,
    quantity: req.body?.quantity,
    unitCode: req.body?.unitCode,
    unitPrice: req.body?.unitPrice,
    currency: req.body?.currency,
  });
  return res.status(out.statusCode).json(out.ok ? out.quotation : { error: out.error });
});

v17Router.post('/commercial/quotations/:id/negotiate', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = negotiateV17Quotation({
    quotationId: req.params.id,
    proposedBy: req.body?.proposedBy || ctx.userId,
    proposedUnitPrice: req.body?.proposedUnitPrice,
    proposedQty: req.body?.proposedQty,
    message: req.body?.message,
    action: req.body?.action,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

// 6. 21-State Transaction Engine & Evidence System
v17Router.get('/transactions', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const txs = Array.from(db.v17Transactions.values()).filter((t) =>
    ctx.isPlatformAdmin ? true : t.tenantId === ctx.tenantId || t.buyerId === ctx.userId || t.sellerId === ctx.userId
  );
  return res.json({
    transactions: txs,
    evidences: Array.from(db.v17TransactionEvidences.values()),
  });
});

v17Router.post('/transactions', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV17Transaction({
    tenantId: ctx.tenantId,
    buyerId: req.body?.buyerId || ctx.userId,
    sellerId: req.body?.sellerId,
    listingId: req.body?.listingId,
    quotationId: req.body?.quotationId,
    currency: req.body?.currency,
    amount: req.body?.amount,
    quantity: req.body?.quantity,
    unitCode: req.body?.unitCode,
    externalProviderRef: req.body?.externalProviderRef,
    offlineQueued: req.body?.offlineQueued,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.transaction : { error: out.error });
});

v17Router.post('/transactions/:id/transition', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = transitionV17Transaction({
    transactionId: req.params.id,
    targetState: req.body?.targetState,
    actorId: ctx.userId,
    note: req.body?.note,
    externalProviderRef: req.body?.externalProviderRef,
  });
  return res.status(out.statusCode).json(out.ok ? out.transaction : { error: out.error });
});

v17Router.post('/transactions/:id/evidence', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = attachV17TransactionEvidence({
    transactionId: req.params.id,
    evidenceType: req.body?.evidenceType || 'WAYBILL',
    submittedBy: req.body?.submittedBy || ctx.userId,
    submittedRole: ctx.role,
    externalRefId: req.body?.externalRefId,
    payloadSummary: req.body?.payloadSummary || 'Evidence record',
  });
  return res.status(out.statusCode).json(out.ok ? out.evidence : { error: out.error });
});

v17Router.post('/transactions/:id/verify', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = verifyV17Transaction({
    transactionId: req.params.id,
    reviewerId: ctx.userId,
    independentReviewPassed: Boolean(req.body?.independentReviewPassed),
  });
  return res.status(out.statusCode).json(out.ok ? out.result : { error: out.error });
});

// 7. Reviews, Reputation & 11-Stage Disputes
v17Router.post('/reviews', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = submitV17Review({
    transactionId: req.body?.transactionId,
    reviewerParticipantId: req.body?.reviewerParticipantId || ctx.userId,
    rating: req.body?.rating,
    comment: req.body?.comment || '',
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

v17Router.post('/reviews/:id/appeal', (req: Request, res: Response) => {
  const out = appealV17Review({
    reviewId: req.params.id,
    appealNote: req.body?.appealNote || 'Review appealed',
    moderationStatus: req.body?.moderationStatus,
  });
  return res.status(out.statusCode).json(out.ok ? out.review : { error: out.error });
});

v17Router.get('/reputation/:participantId', (req: Request, res: Response) => {
  return res.json(recomputeV17Reputation(req.params.participantId));
});

v17Router.get('/disputes', (_req: Request, res: Response) => {
  return res.json({ disputes: Array.from(db.v17Disputes.values()) });
});

v17Router.post('/disputes', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = openV17Dispute({
    tenantId: ctx.tenantId,
    transactionId: req.body?.transactionId,
    complainantId: req.body?.complainantId || ctx.userId,
    reason: req.body?.reason,
    claimedAmount: req.body?.claimedAmount,
  });
  return res.status(out.statusCode).json(out.ok ? out.dispute : { error: out.error });
});

v17Router.post('/disputes/:id/advance', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = advanceV17Dispute({
    disputeId: req.params.id,
    targetStage: req.body?.targetStage,
    actorId: ctx.userId,
    note: req.body?.note || 'Dispute stage updated',
    assignedMediatorId: req.body?.assignedMediatorId,
    conflictOfInterestDeclared: req.body?.conflictOfInterestDeclared,
    resolutionProposal: req.body?.resolutionProposal,
    finalDecision: req.body?.finalDecision,
  });
  return res.status(out.statusCode).json(out.ok ? out.dispute : { error: out.error });
});

// 8. Regional Jurisdictions, Corridors & Logistics (No fake GPS)
v17Router.get('/regional/jurisdictions', (_req: Request, res: Response) => {
  return res.json({
    jurisdictions: Array.from(db.v17Jurisdictions.values()),
    corridors: Array.from(db.v17RegionalCorridors.values()),
    shipments: Array.from(db.v17LogisticsShipments.values()),
  });
});

v17Router.post('/regional/jurisdictions/:code/activate', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = activateV17Jurisdiction({
    countryCode: req.params.code,
    targetState: req.body?.targetState || 'CONTROLLED_PILOT_SANDBOX',
    legalCounselApproved: Boolean(req.body?.legalCounselApproved),
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.jurisdiction : { error: out.error });
});

v17Router.post('/logistics/shipments', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV17LogisticsShipment({
    tenantId: ctx.tenantId,
    transactionId: req.body?.transactionId,
    corridorId: req.body?.corridorId,
    carrierParticipantId: req.body?.carrierParticipantId,
    transportMode: req.body?.transportMode,
    originLocation: req.body?.originLocation,
    destinationLocation: req.body?.destinationLocation,
    offlineSubmitted: req.body?.offlineSubmitted,
  });
  return res.status(out.statusCode).json(out.ok ? out.shipment : { error: out.error });
});

v17Router.post('/logistics/shipments/:id/status', (req: Request, res: Response) => {
  const out = updateV17LogisticsShipmentStatus({
    shipmentId: req.params.id,
    status: req.body?.status,
    proofRef: req.body?.proofRef,
    offlineSubmitted: req.body?.offlineSubmitted,
  });
  return res.status(out.statusCode).json(out.ok ? out.shipment : { error: out.error });
});

// 9. Cooperative Workspaces
v17Router.get('/cooperatives', (_req: Request, res: Response) => {
  return res.json({ cooperatives: Array.from(db.v17Cooperatives.values()) });
});

v17Router.get('/cooperatives/:id', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const detail = getV17CooperativeDetail(req.params.id, ctx.isPlatformAdmin || ctx.role === 'COOPERATIVE_ADMIN');
  if (!detail) return res.status(404).json({ error: 'Cooperative not found.' });
  return res.json(detail);
});

v17Router.post('/cooperatives/:id/activities', (req: Request, res: Response) => {
  const out = recordV17CooperativeActivity({
    cooperativeId: req.params.id,
    activityType: req.body?.activityType || 'AGGREGATED_LOT',
    title: req.body?.title || 'Cooperative Lot Activity',
    totalQty: req.body?.totalQty || 100,
    unitCode: req.body?.unitCode || 'KG',
    currency: req.body?.currency || 'UGX',
    totalAmount: req.body?.totalAmount || 0,
  });
  return res.status(out.statusCode).json(out.ok ? out.activity : { error: out.error });
});

// 10. Reconciliation Cases, Billing Truth & Dual-Auth Governance
v17Router.get('/reconciliation/cases', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json({ cases: Array.from(db.v17ReconciliationCases.values()) });
});

v17Router.post('/reconciliation/cases', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = openV17ReconciliationCase({
    tenantId: ctx.tenantId,
    transactionId: req.body?.transactionId,
    currency: req.body?.currency,
    expectedAmount: req.body?.expectedAmount,
    providerReportedAmount: req.body?.providerReportedAmount,
    causeCategory: req.body?.causeCategory || 'FEE_MISMATCH',
  });
  return res.status(out.statusCode).json(out.ok ? out.reconCase : { error: out.error });
});

v17Router.post('/reconciliation/cases/:id/resolve', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = resolveV17ReconciliationCase({
    caseId: req.params.id,
    actorId: ctx.userId,
    postCorrectingJournalEntry: Boolean(req.body?.postCorrectingJournalEntry),
  });
  return res.status(out.statusCode).json(out.ok ? out.reconCase : { error: out.error });
});

v17Router.get('/billing/summary', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json(getV17BillingSummary());
});

v17Router.post('/billing/records', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const rec = recordV17NetworkBilling({
    tenantId: ctx.tenantId,
    transactionId: req.body?.transactionId,
    currency: req.body?.currency,
    grossTransactionValue: req.body?.grossTransactionValue,
    providerFeeAmount: req.body?.providerFeeAmount,
    taxAmount: req.body?.taxAmount,
    refundAmount: req.body?.refundAmount,
    platformServiceFeeAmount: req.body?.platformServiceFeeAmount,
    exemptPublicService: req.body?.exemptPublicService,
    settlementMatched: req.body?.settlementMatched,
  });
  return res.status(201).json(rec);
});

v17Router.get('/governance/policies', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json({
    policies: Array.from(db.v17GovernancePolicies.values()),
    approvals: Array.from(db.v17PolicyApprovals.values()),
  });
});

v17Router.post('/governance/approvals', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = requestV17PolicyApproval({
    policyId: req.body?.policyId,
    actionRequested: req.body?.actionRequested,
    requestedBy: ctx.userId,
    targetTenantId: req.body?.targetTenantId,
  });
  return res.status(out.statusCode).json(out.ok ? out.approval : { error: out.error });
});

v17Router.post('/governance/approvals/:id/decide', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = decideV17PolicyApproval({
    approvalId: req.params.id,
    decision: req.body?.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED',
    secondApproverId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.approval : { error: out.error });
});

// 11. Data Privacy & Offline Sync Revalidation & Real-Data Intelligence
v17Router.post('/privacy/requests', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const item = createV17PrivacyRequest({
    participantId: req.body?.participantId || ctx.userId,
    requestType: req.body?.requestType || 'DATA_EXPORT',
  });
  return res.status(201).json(item);
});

v17Router.get('/offline/queue', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const items = Array.from(db.v17OfflineSyncQueue.values()).filter((i) =>
    ctx.isPlatformAdmin ? true : i.participantId === ctx.userId || i.tenantId === ctx.tenantId
  );
  return res.json({ queue: items });
});

v17Router.post('/offline/sync', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const item = queueAndSyncV17OfflineAction({
    participantId: req.body?.participantId || ctx.userId,
    tenantId: ctx.tenantId,
    actionType: req.body?.actionType || 'SUBMIT_ORDER_DRAFT',
    targetEntityId: req.body?.targetEntityId,
    queuedPayload: req.body?.queuedPayload || {},
    syncNow: req.body?.syncNow !== false,
  });
  return res.status(item.validationStatus === 'REJECTED_STALE_OR_SETTLEMENT' ? 409 : 201).json(item);
});

v17Router.get('/intelligence/metrics', (_req: Request, res: Response) => {
  return res.json(computeV17EconomicIntelligence());
});
