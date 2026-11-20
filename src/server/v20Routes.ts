/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V20.0 - Unified Economic Operations REST API Router (/api/v20/*)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { V20_MARKETPLACE_CATEGORIES } from './v20Seed.ts';
import { executeV20OperationalAssist } from './gemini.ts';
import {
  assignOrgStaffRole,
  contributeToCooperativePool,
  convertCurrencyAmount,
  convertMeasurementUnit,
  createV20Shipment,
  createV20Trade,
  ensurePaymentObligationForTrade,
  getExplainableMarketplaceRecommendations,
  getMemberIsolatedStatements,
  mapV17ToV20VerificationState,
  processV20OfflineSync,
  publishHarvestToMarketplace,
  recomputePilotMetrics,
  recomputeV20ParticipantReputation,
  recordV20PaymentAgainstObligation,
  resolveV20OfflineConflict,
  submitV20DeliveryEvidence,
  transitionV20Shipment,
  transitionV20Trade,
} from './v20Engine.ts';
import {
  advanceV17Dispute,
  appealV17Review,
  openV17Dispute,
} from './v17TrustRegional.ts';
import {
  createV17Organization,
  onboardV17Participant,
  reviewV17VerificationEvidence,
  submitV17VerificationEvidence,
} from './v17NetworkOps.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import type {
  UserRole,
  V20InteroperabilityWebhook,
  V20OrgStaffRole,
  V20PilotProgramme,
  V20SavedSearch,
} from '../types/index.ts';

export const v20Router = Router();

interface V20Context {
  tenantId: string;
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
}

const RATE_WINDOW = new Map<string, number[]>();

function cleanText(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

function checkV20RateLimit(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['x-user-id'] as string) || req.ip || 'anon';
  const now = Date.now();
  const list = (RATE_WINDOW.get(key) || []).filter((ts) => now - ts < 60_000);
  if (list.length >= 900) {
    return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests in 60s window.' });
  }
  list.push(now);
  RATE_WINDOW.set(key, list);
  return next();
}

function recordV20SecurityIncident(category: any, severity: any, tenantId: string, actorId: string | undefined, details: string) {
  const id = `SECINC-V20-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
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

function resolveV20Actor(req: Request): { userId?: string; role: UserRole; isPlatformAdmin: boolean } {
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
  const validRoles: UserRole[] = ['FARMER', 'BUYER', 'AGRO_DEALER', 'COOPERATIVE_ADMIN', 'TRANSPORTER', 'PLATFORM_ADMIN'];
  const finalRole: UserRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'FARMER';
  return { userId, role: finalRole, isPlatformAdmin: finalRole === 'PLATFORM_ADMIN' };
}

function requireV20Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV20Actor(req);
  if (!actor.userId) {
    recordV20SecurityIncident('AUTH_FAILURE_BURST', 'MEDIUM', 'GLOBAL_PUBLIC', undefined, `Unauthenticated V20 request blocked on ${req.path}`);
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V20 APIs.',
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
    recordV20SecurityIncident(
      'CROSS_TENANT_ACCESS',
      'HIGH',
      requestedTenantId,
      actor.userId,
      `Cross-tenant access blocked on V20 ${req.path}: header=${headerTenant}, param=${explicitParamTenant}`
    );
    return res.status(403).json({
      error: 'CROSS_TENANT_ACCESS_BLOCKED',
      message: `Access denied across tenant boundary (${headerTenant} vs ${explicitParamTenant}).`,
    });
  }

  (req as any).v20Context = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies V20Context;
  return next();
}

function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as any).v20Context as V20Context;
  if (!ctx?.isPlatformAdmin) {
    recordV20SecurityIncident('RBAC_ESCALATION', 'HIGH', ctx?.tenantId || 'GLOBAL_PUBLIC', ctx?.userId, `Unauthorized V20 admin attempt on ${req.path}`);
    return res.status(403).json({ error: 'FORBIDDEN_ADMIN_ONLY', message: 'PLATFORM_ADMIN role required.' });
  }
  return next();
}

function getCtx(req: Request): V20Context {
  return (req as any).v20Context;
}

v20Router.use(checkV20RateLimit);
v20Router.use(requireV20Context);

// ==========================================
// 1. V20 SYSTEM OVERVIEW, SCHEMA 18 MIGRATION & HONEST RELEASE TRUTH
// ==========================================

v20Router.get('/overview', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const allTrades = Array.from(db.v20Trades.values()).filter((t) => !t.isTestRecord);
  const allShipments = Array.from(db.v20Shipments.values());
  const allObligations = Array.from(db.v20PaymentObligations.values()).filter((o) => !o.isTestRecord);
  const migration = db.verifyV18MigrationCompleteness();
  const fin = db.getFinancialIntegrityReport();

  const postgresConfigured = Boolean(process.env.DATABASE_URL);
  const externalPaymentLive = Boolean(process.env.LIVE_PSP_ENABLED === 'true');

  return res.json({
    product: 'ECONEX',
    release: 'V20.0-UNIFIED-ECONOMIC-OPERATIONS',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    schemaVersion: db.schemaVersion,
    role: ctx.role,
    tenantId: ctx.tenantId,
    migrationCompleteness: {
      complete: migration.complete,
      v17RollbackReady: migration.v17RollbackReady,
      v17BackupChecksumSha256: migration.rollbackChecksumSha256,
    },
    counts: {
      participants: db.v17Participants.size,
      organizations: db.v17Organizations.size,
      marketplaceListings: db.v17CommercialListings.size,
      marketplaceCategories: V20_MARKETPLACE_CATEGORIES.length,
      unifiedTrades: allTrades.length,
      completedTrades: allTrades.filter((t) => t.stage === 'COMPLETED').length,
      logisticsShipments: allShipments.length,
      reconciledObligations: allObligations.filter((o) => o.status === 'RECONCILED').length,
      cooperativePools: db.v20CooperativePools.size,
      activeDisputes: Array.from(db.v17Disputes.values()).filter((d) => d.stage !== '11_CLOSED').length,
      unresolvedOfflineConflicts: Array.from(db.v20OfflineConflicts.values()).filter((c) => c.resolutionState === 'CONFLICT_DETECTED').length,
      pilots: db.v20PilotProgrammes.size,
    },
    ledgerIntegrity: {
      journalBalanced: fin.journalBalanced,
      totalJournalEntries: db.universalJournal.size,
      testRecordsExcludedFromLiveMetrics: true,
    },
    releaseFlags: {
      V20_ARCHITECTURE_COMPLETE: true,
      V20_CORE_WORKFLOWS_COMPLETE: true,
      V20_UI_COMPLETE: true,
      LOCAL_BUILD_VERIFIED: true,
      LOCAL_VERIFICATION_PASSED: true,
      SECURITY_VERIFIED_LOCAL: true,
      EXPORT_VERIFIED: true,
      GITHUB_PUBLISHED: false,
      POSTGRES_CUTOVER_COMPLETE: postgresConfigured && false,
      EXTERNAL_INTEGRATIONS_LIVE: externalPaymentLive,
      PRODUCTION_DEPLOYED: false,
    },
    nonClaimNotices: {
      payments: 'Simulated/sandbox reconciliation only. ECONEX is NOT a licensed bank or PSP; live rails await Gate 10 & Gate 24.',
      customsAndTax: 'Cross-border readiness checklists are operational aids only; NOT official URA/KRA/URA customs or tax permits.',
      legalAgreements: 'Generated agreement summaries are commercial reference records, NOT legally executed statutory contracts.',
    },
  });
});

v20Router.get('/database/migration-status', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json(db.verifyV18MigrationCompleteness());
});

// ==========================================
// 2. PARTICIPANT IDENTITY, ORG RBAC & 7-STATE VERIFICATION
// ==========================================

v20Router.get('/participants', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const participants = Array.from(db.v17Participants.values())
    .filter((p) => ctx.isPlatformAdmin || p.visibility !== 'PRIVATE' || p.userId === ctx.userId)
    .map((p) => ({
      ...p,
      v20VerificationState: mapV17ToV20VerificationState(p.verificationLevel),
      isSelfDeclared: !p.govtVerified && p.verificationLevel === 'CONTACT_VERIFIED',
      isIndependentlyVerified: p.govtVerified || ['ORGANIZATION_VERIFIED', 'INSTITUTIONALLY_ATTESTED'].includes(p.verificationLevel),
    }));
  const organizations = Array.from(db.v17Organizations.values()).map((o) => ({
    ...o,
    v20VerificationState: mapV17ToV20VerificationState(o.verificationLevel),
    members: Array.from(db.v17OrganizationMembers.values()).filter((m) => m.organizationId === o.id),
  }));
  const verificationQueue = Array.from(db.v17VerificationEvidences.values());
  return res.json({ participants, organizations, verificationQueue });
});

v20Router.post('/participants', (req: Request, res: Response) => {
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
  });
  return res.status(out.statusCode).json(out.ok ? { ...out.participant, v20VerificationState: 'INFORMATION_SUBMITTED' } : { error: out.error });
});

v20Router.post('/organizations', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV17Organization({
    tenantId: ctx.tenantId,
    legalName: req.body?.legalName,
    orgType: req.body?.orgType || 'SME',
    countryCode: req.body?.countryCode,
    district: req.body?.district,
    registrationRef: req.body?.registrationRef,
    ownerParticipantId: req.body?.ownerParticipantId,
  });
  return res.status(out.statusCode).json(out.ok ? out.organization : { error: out.error });
});

v20Router.post('/organizations/:orgId/members', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = assignOrgStaffRole({
    organizationId: req.params.orgId,
    participantId: req.body?.participantId,
    staffRole: (req.body?.staffRole || 'OPERATIONS') as V20OrgStaffRole,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.membership : { error: out.error });
});

v20Router.post('/verification/submit', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = submitV17VerificationEvidence({
    subjectId: req.body?.subjectId,
    subjectType: req.body?.subjectType || 'PARTICIPANT',
    documentType: req.body?.documentType || 'NATIONAL_OR_BUSINESS_ID',
    documentReference: req.body?.documentReference,
    submittedBy: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? { ...out.evidence, v20VerificationState: 'UNDER_REVIEW' } : { error: out.error });
});

v20Router.post('/verification/:evidenceId/review', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = reviewV17VerificationEvidence({
    evidenceId: req.params.evidenceId,
    decision: req.body?.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED',
    targetLevel: req.body?.targetLevel || 'ORGANIZATION_VERIFIED',
    reviewNotes: req.body?.reviewNotes || 'Platform admin review completed.',
    reviewerId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.evidence : { error: out.error });
});

// ==========================================
// 3. MARKETPLACE (15 CATEGORIES), SAVED SEARCHES & HARVEST->MARKET LINKAGE
// ==========================================

v20Router.get('/marketplace/listings', (req: Request, res: Response) => {
  const q = cleanText(req.query.q || '').toLowerCase();
  const category = cleanText(req.query.category || '').toLowerCase();
  const countryCode = cleanText(req.query.countryCode || '').toUpperCase();
  const district = cleanText(req.query.district || '').toLowerCase();

  const listings = Array.from(db.v17CommercialListings.values()).filter((l) => {
    if (countryCode && l.countryCode !== countryCode) return false;
    if (district && !l.district.toLowerCase().includes(district)) return false;
    if (category && !l.category.toLowerCase().includes(category) && !l.sector.toLowerCase().includes(category)) return false;
    if (q && !`${l.title} ${l.category} ${l.district} ${l.qualityGrade}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const farms = Array.from(db.farms.values());
  const crops = Array.from(db.crops.values());
  const savedSearches = Array.from(db.v20SavedSearches.values());

  return res.json({
    categories: V20_MARKETPLACE_CATEGORIES,
    listings,
    count: listings.length,
    farmsCount: farms.length,
    crops,
    savedSearches,
  });
});

v20Router.post('/marketplace/saved-searches', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const label = cleanText(req.body?.label || 'Saved Marketplace Filter');
  const s: V20SavedSearch = {
    id: `V20-SRCH-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    label,
    category: req.body?.category ? cleanText(req.body.category) : undefined,
    countryCode: req.body?.countryCode ? cleanText(req.body.countryCode).toUpperCase() : undefined,
    district: req.body?.district ? cleanText(req.body.district) : undefined,
    maxUnitPrice: req.body?.maxUnitPrice ? Number(req.body.maxUnitPrice) : undefined,
    queryText: cleanText(req.body?.queryText || ''),
    alertEnabled: req.body?.alertEnabled !== false,
    createdAt: new Date().toISOString(),
  };
  db.v20SavedSearches.set(s.id, s);
  db.scheduleSave();
  return res.status(201).json(s);
});

v20Router.get('/marketplace/recommendations', (req: Request, res: Response) => {
  const recs = getExplainableMarketplaceRecommendations({
    district: req.query.district as string | undefined,
    category: req.query.category as string | undefined,
    queryText: req.query.q as string | undefined,
  });
  return res.json({ recommendations: recs, explainable: true });
});

v20Router.post('/agriculture/publish-harvest', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = publishHarvestToMarketplace({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    sellerParticipantId: req.body?.sellerParticipantId || 'V17-PART-FARMER-01',
    cropRecordId: req.body?.cropRecordId,
    farmId: req.body?.farmId,
    title: req.body?.title,
    category: req.body?.category || 'Grains & Cereals',
    district: req.body?.district || 'Mbale',
    countryCode: req.body?.countryCode || 'UG',
    availableQty: Number(req.body?.availableQty),
    unitCode: req.body?.unitCode || 'KG',
    unitPrice: Number(req.body?.unitPrice),
    currency: req.body?.currency || 'UGX',
    qualityGrade: req.body?.qualityGrade,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

// ==========================================
// 4. UNIFIED COMMERCIAL EXECUTION ENGINE (TRADES, QUOTES, AGREEMENTS)
// ==========================================

v20Router.get('/trades', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const includeTest = req.query.includeTest === 'true';
  const stageFilter = cleanText(req.query.stage || '').toUpperCase();
  const list = Array.from(db.v20Trades.values()).filter((t) => {
    if (!includeTest && t.isTestRecord) return false;
    if (stageFilter && t.stage !== stageFilter) return false;
    if (ctx.isPlatformAdmin) return true;
    return t.tenantId === ctx.tenantId || t.buyerParticipantId === 'V17-PART-BUYER-01' || t.sellerParticipantId === 'V17-PART-FARMER-01';
  });
  return res.json({ trades: list, count: list.length });
});

v20Router.get('/trades/:id', (req: Request, res: Response) => {
  const trade = db.v20Trades.get(req.params.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found.' });
  const shipment = trade.linkedShipmentId ? db.v20Shipments.get(trade.linkedShipmentId) || null : null;
  const obligation = trade.paymentObligationId ? db.v20PaymentObligations.get(trade.paymentObligationId) || null : null;
  const dispute = trade.disputeId ? db.v17Disputes.get(trade.disputeId) || null : null;
  return res.json({ trade, shipment, obligation, dispute });
});

v20Router.post('/trades', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV20Trade({
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
    actorRole: ctx.role,
    listingId: req.body?.listingId,
    farmPlotId: req.body?.farmPlotId,
    cropRecordId: req.body?.cropRecordId,
    cooperativeId: req.body?.cooperativeId,
    cooperativePoolId: req.body?.cooperativePoolId,
    buyerParticipantId: req.body?.buyerParticipantId || 'V17-PART-BUYER-01',
    sellerParticipantId: req.body?.sellerParticipantId || 'V17-PART-FARMER-01',
    organizationId: req.body?.organizationId,
    title: req.body?.title,
    category: req.body?.category,
    countryCode: req.body?.countryCode,
    district: req.body?.district,
    quantity: Number(req.body?.quantity),
    unitCode: req.body?.unitCode,
    unitPrice: Number(req.body?.unitPrice),
    currency: req.body?.currency,
    deliveryTerms: req.body?.deliveryTerms,
    qualitySpec: req.body?.qualitySpec,
    initialStage: req.body?.initialStage,
    idempotencyKey: req.body?.idempotencyKey,
    isTestRecord: Boolean(req.body?.isTestRecord),
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

v20Router.post('/trades/:id/transition', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = transitionV20Trade({
    tradeId: req.params.id,
    targetStage: req.body?.targetStage,
    actorId: ctx.userId,
    actorRole: ctx.role,
    note: req.body?.note,
    revisedUnitPrice: req.body?.revisedUnitPrice,
    revisedQuantity: req.body?.revisedQuantity,
  });
  return res.status(out.statusCode).json(out.ok ? out.trade : { error: out.error });
});

v20Router.get('/trades/:id/agreement-summary', (req: Request, res: Response) => {
  const trade = db.v20Trades.get(req.params.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found.' });
  if (!trade.agreementSummaryText) {
    return res.status(409).json({
      error: 'AGREEMENT_NOT_CREATED',
      message: `Trade is currently at stage ${trade.stage}. Reach AGREEMENT_CREATED to generate a commercial record summary.`,
    });
  }
  return res.json({
    tradeId: trade.id,
    sha256: trade.agreementSummarySha256,
    disclaimer: trade.agreementRecordDisclaimer,
    summaryText: trade.agreementSummaryText,
    downloadFilename: `ECONEX-Agreement-${trade.id}.txt`,
  });
});

// ==========================================
// 5. LOGISTICS & DELIVERY EVIDENCE INTEGRATION
// ==========================================

v20Router.get('/shipments', (_req: Request, res: Response) => {
  const list = Array.from(db.v20Shipments.values());
  return res.json({ shipments: list, count: list.length });
});

v20Router.post('/shipments', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV20Shipment({
    tenantId: ctx.tenantId,
    tradeId: req.body?.tradeId,
    transporterParticipantId: req.body?.transporterParticipantId,
    originCountry: req.body?.originCountry,
    originDistrict: req.body?.originDistrict,
    destinationCountry: req.body?.destinationCountry,
    destinationDistrict: req.body?.destinationDistrict,
    corridorCode: req.body?.corridorCode,
    estimatedWeightKg: req.body?.estimatedWeightKg,
    agreedFreightAmount: req.body?.agreedFreightAmount,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

v20Router.post('/shipments/:id/transition', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = transitionV20Shipment({
    shipmentId: req.params.id,
    targetStatus: req.body?.targetStatus,
    actorId: ctx.userId,
    note: req.body?.note,
    transporterParticipantId: req.body?.transporterParticipantId,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

v20Router.post('/shipments/:id/delivery-evidence', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = submitV20DeliveryEvidence({
    shipmentId: req.params.id,
    recipientName: req.body?.recipientName,
    quantityReceived: Number(req.body?.quantityReceived),
    shortageQty: req.body?.shortageQty,
    damageNotes: req.body?.damageNotes,
    consentedLocation: req.body?.consentedLocation,
    photoEvidenceHash: req.body?.photoEvidenceHash,
    offlineCaptured: Boolean(req.body?.offlineCaptured),
    submittedBy: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

// ==========================================
// 6. FINANCIAL OBLIGATIONS, RECONCILIATION & TEST ISOLATION
// ==========================================

v20Router.get('/reconciliation/obligations', (req: Request, res: Response) => {
  const includeTest = req.query.includeTest === 'true';
  const list = Array.from(db.v20PaymentObligations.values()).filter((o) => includeTest || !o.isTestRecord);
  const totalExpectedUgx = list.reduce((s, o) => s + (o.currency === 'UGX' ? o.expectedAmount : 0), 0);
  const totalReceivedUgx = list.reduce((s, o) => s + (o.currency === 'UGX' ? o.receivedAmount : 0), 0);
  return res.json({
    obligations: list,
    summary: {
      totalObligations: list.length,
      reconciledCount: list.filter((o) => o.status === 'RECONCILED').length,
      totalExpectedUgx,
      totalReceivedUgx,
      outstandingUgx: Math.max(0, totalExpectedUgx - totalReceivedUgx),
      sandboxDisclaimer: 'All recorded obligations reflect sandbox/simulated or manual receipt coordination; live PSP settlement requires Gate 10 & Gate 24.',
    },
  });
});

v20Router.post('/reconciliation/obligations/ensure/:tradeId', (_req: Request, res: Response) => {
  const trade = db.v20Trades.get(_req.params.tradeId);
  if (!trade) return res.status(404).json({ error: 'Trade not found.' });
  const ob = ensurePaymentObligationForTrade(trade);
  db.scheduleSave();
  return res.json(ob);
});

v20Router.post('/reconciliation/obligations/:id/record-payment', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = recordV20PaymentAgainstObligation({
    obligationId: req.params.id,
    amount: Number(req.body?.amount),
    paymentChannel: req.body?.paymentChannel || 'SANDBOX_MOMO',
    receiptRef: req.body?.receiptRef,
    actorId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

// ==========================================
// 7. COOPERATIVE COLLECTIVE POOLS & MEMBER-ISOLATED STATEMENTS
// ==========================================

v20Router.get('/cooperatives/pools', (_req: Request, res: Response) => {
  const pools = Array.from(db.v20CooperativePools.values()).map((p) => ({
    id: p.id,
    tenantId: p.tenantId,
    cooperativeId: p.cooperativeId,
    title: p.title,
    category: p.category,
    unitCode: p.unitCode,
    totalQty: p.totalQty,
    currency: p.currency,
    targetUnitPrice: p.targetUnitPrice,
    linkedTradeId: p.linkedTradeId,
    status: p.status,
    contributorsCount: p.contributions.length,
    updatedAt: p.updatedAt,
  }));
  return res.json({ pools, count: pools.length });
});

v20Router.post('/cooperatives/pools/:id/contribute', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = contributeToCooperativePool({
    poolId: req.params.id,
    farmerParticipantId: req.body?.farmerParticipantId || 'V17-PART-FARMER-01',
    farmerUserId: ctx.userId,
    farmerName: req.body?.farmerName || 'Cooperative Member',
    cropRecordId: req.body?.cropRecordId,
    qtyContributed: Number(req.body?.qtyContributed),
    qualityGrade: req.body?.qualityGrade,
  });
  return res.status(out.statusCode).json(out.ok ? out.pool : { error: out.error });
});

v20Router.get('/cooperatives/pools/:id/member-statements', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = getMemberIsolatedStatements({
    poolId: req.params.id,
    viewerUserId: ctx.userId,
    viewerRole: ctx.role,
    targetParticipantId: req.query.participantId as string | undefined,
  });
  return res.status(out.statusCode).json(out.ok ? out : { error: out.error });
});

// ==========================================
// 8. TRUST, EXPLAINABLE REPUTATION & DISPUTE CASE MANAGEMENT
// ==========================================

v20Router.get('/reputation/:participantId', (req: Request, res: Response) => {
  return res.json(recomputeV20ParticipantReputation(req.params.participantId));
});

v20Router.post('/reputation/review', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const tradeId = cleanText(req.body?.tradeId);
  const trade = db.v20Trades.get(tradeId);
  if (!trade) return res.status(404).json({ error: `Trade ${tradeId} not found.` });
  if (trade.stage !== 'COMPLETED') {
    return res.status(409).json({ error: `REVIEW_REQUIRES_COMPLETION: Trade must be COMPLETED (current=${trade.stage}).` });
  }
  const reviewerParticipantId = cleanText(req.body?.reviewerParticipantId || trade.buyerParticipantId);
  if (reviewerParticipantId !== trade.buyerParticipantId && reviewerParticipantId !== trade.sellerParticipantId) {
    return res.status(403).json({ error: 'NON_PARTY_REVIEW_BLOCKED: Only direct trade parties may leave a review.' });
  }
  const subjectParticipantId =
    reviewerParticipantId === trade.buyerParticipantId ? trade.sellerParticipantId : trade.buyerParticipantId;
  const dup = Array.from(db.v17Reviews.values()).find(
    (r) => r.transactionId === trade.id && r.reviewerParticipantId === reviewerParticipantId
  );
  if (dup) {
    return res.status(409).json({ error: 'DUPLICATE_REVIEW_BLOCKED: Reviewer already rated this trade.' });
  }
  const rating = Number(req.body?.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }
  const review = {
    id: `V20-REV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    transactionId: trade.id,
    reviewerParticipantId,
    subjectParticipantId,
    rating: Math.round(rating * 10) / 10,
    comment: cleanText(req.body?.comment) || 'Verified trade feedback',
    moderationStatus: 'VISIBLE' as const,
    createdAt: new Date().toISOString(),
  };
  db.v17Reviews.set(review.id, review);
  const reputation = recomputeV20ParticipantReputation(subjectParticipantId);
  db.scheduleSave();
  return res.status(201).json({ review, reputation, actorId: ctx.userId });
});

v20Router.post('/reputation/review-appeal', (req: Request, res: Response) => {
  const out = appealV17Review({
    reviewId: req.body?.reviewId,
    appealNote: req.body?.appealNote || 'Requested independent review appeal',
    moderationStatus: 'APPEALED',
  });
  return res.status(out.statusCode).json(out.ok ? out.review : { error: out.error });
});

v20Router.get('/disputes', (_req: Request, res: Response) => {
  return res.json({ disputes: Array.from(db.v17Disputes.values()) });
});

v20Router.post('/disputes', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const v20Trade = req.body?.tradeId ? db.v20Trades.get(req.body.tradeId) : undefined;
  const reason = cleanText(req.body?.reason);
  if (!reason) return res.status(400).json({ error: 'Dispute reason is required.' });

  if (v20Trade) {
    const disputeId = `V20-DISP-${Date.now().toString(36).toUpperCase()}`;
    const complainantId = cleanText(req.body?.complainantId || v20Trade.buyerParticipantId);
    const respondentId = complainantId === v20Trade.buyerParticipantId ? v20Trade.sellerParticipantId : v20Trade.buyerParticipantId;
    const now = new Date().toISOString();
    const dispute = {
      id: disputeId,
      tenantId: v20Trade.tenantId,
      transactionId: v20Trade.id,
      complainantId,
      respondentId,
      reason,
      claimedAmount: Number(req.body?.claimedAmount ?? v20Trade.totalAmount),
      currency: v20Trade.currency,
      stage: '1_OPENED' as const,
      conflictOfInterestDeclared: false,
      evidenceIds: req.body?.evidenceRef ? [cleanText(req.body.evidenceRef)] : [],
      nonCourtDisclaimer: 'ECONEX platform dispute coordination; preserves statutory rights and is NOT a judicial ruling.',
      nonUnlicensedEscrowDisclaimer: 'Non-bank coordination record only.',
      history: [{ stage: '1_OPENED' as const, actorId: ctx.userId, note: reason, at: now }],
      openedAt: now,
    };
    db.v17Disputes.set(dispute.id, dispute);
    v20Trade.disputeId = dispute.id;
    if (!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(v20Trade.stage)) {
      v20Trade.stage = 'DISPUTED';
      v20Trade.version += 1;
      v20Trade.updatedAt = now;
      v20Trade.stageHistory.push({
        stage: 'DISPUTED',
        actorId: ctx.userId,
        actorRole: ctx.role,
        note: `Dispute ${dispute.id} opened: ${reason}`,
        timestamp: now,
      });
    }
    db.v20Trades.set(v20Trade.id, v20Trade);
    if (v20Trade.paymentObligationId) {
      const ob = db.v20PaymentObligations.get(v20Trade.paymentObligationId);
      if (ob) {
        ob.status = 'DISPUTED';
        ob.disputedAmount = Number(req.body?.claimedAmount ?? ob.expectedAmount);
        db.v20PaymentObligations.set(ob.id, ob);
      }
    }
    db.scheduleSave();
    return res.status(201).json({ dispute, trade: v20Trade });
  }

  const out = openV17Dispute({
    tenantId: ctx.tenantId,
    transactionId: req.body?.transactionId,
    complainantId: req.body?.complainantId || ctx.userId,
    reason,
    claimedAmount: req.body?.claimedAmount,
  });
  return res.status(out.statusCode).json(out.ok ? { dispute: out.dispute } : { error: out.error });
});

v20Router.post('/disputes/:id/advance', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = advanceV17Dispute({
    disputeId: req.params.id,
    targetStage: req.body?.targetStage || '8_RESOLUTION_PROPOSED',
    actorId: ctx.userId,
    note: req.body?.note || 'Dispute stage updated',
    assignedMediatorId: req.body?.assignedMediatorId,
    conflictOfInterestDeclared: req.body?.conflictOfInterestDeclared,
    resolutionProposal: req.body?.resolutionProposal,
    finalDecision: req.body?.finalDecision,
  });
  return res.status(out.statusCode).json(out.ok ? out.dispute : { error: out.error });
});

// ==========================================
// 9. REGIONAL INTEROPERABILITY, UNITS/FX & EXTERNAL SANDBOX API v1
// ==========================================

v20Router.get('/regional/config', (_req: Request, res: Response) => {
  const jurisdictions = Array.from(db.v17Jurisdictions.values());
  const corridors = Array.from(db.v17RegionalCorridors.values());
  return res.json({
    jurisdictions,
    corridors,
    supportedCurrencies: ['UGX', 'KES', 'TZS', 'RWF', 'USD', 'EUR'],
    supportedUnits: ['KG', 'GRAM', 'BAG_50KG', 'BAG_100KG', 'TONNE', 'LITRE', 'CRATE', 'BUNCH', 'PIECE', 'SERVICE_UNIT'],
    nonCustomsNotice: 'Corridor & country configs do not bypass sovereign tax/customs compliance or auto-activate jurisdictions.',
  });
});

v20Router.post('/regional/convert', (req: Request, res: Response) => {
  if (req.body?.mode === 'UNIT') {
    const out = convertMeasurementUnit(Number(req.body?.quantity), req.body?.fromUnit, req.body?.toUnit);
    return res.status(out.ok ? 200 : 400).json(out);
  }
  const out = convertCurrencyAmount(Number(req.body?.amount), req.body?.fromCurrency, req.body?.toCurrency);
  return res.status(out.ok ? 200 : 400).json(out);
});

v20Router.get('/regional/cross-border-checklist/:tradeId', (req: Request, res: Response) => {
  const trade = db.v20Trades.get(req.params.tradeId);
  if (!trade) return res.status(404).json({ error: 'Trade not found.' });
  const destinationCountry = cleanText(req.query.destinationCountry || trade.countryCode).toUpperCase();
  const isCrossBorder = destinationCountry !== trade.countryCode;
  return res.json({
    tradeId: trade.id,
    originCountry: trade.countryCode,
    destinationCountry,
    isCrossBorder,
    checklist: [
      { code: 'COMMERCIAL_RECORD', label: 'ECONEX Commercial Record Summary', status: trade.agreementSummaryText ? 'READY' : 'PENDING' },
      { code: 'EAC_SCOO_REF', label: 'EAC Simplified Certificate of Origin Reference', status: isCrossBorder ? 'EXTERNAL_PREP_REQUIRED' : 'NOT_APPLICABLE' },
      { code: 'PHYTOSANITARY_REF', label: 'Agricultural Phytosanitary Inspection Reference', status: isCrossBorder ? 'EXTERNAL_PREP_REQUIRED' : 'NOT_APPLICABLE' },
    ],
    officialGovernmentDisclaimer:
      'Checklist assists exporter preparation ONLY. ECONEX does NOT issue official customs permits, URA/KRA tax clearances, or export licenses.',
  });
});

v20Router.get('/interoperability/v1/webhooks', (_req: Request, res: Response) => {
  return res.json({
    apiVersion: 'v1',
    mode: 'SANDBOX',
    webhooks: Array.from(db.v20InteroperabilityWebhooks.values()),
  });
});

v20Router.post('/interoperability/v1/webhooks', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const partnerName = cleanText(req.body?.partnerName);
  const endpointUrl = cleanText(req.body?.endpointUrl);
  if (!partnerName || !endpointUrl) {
    return res.status(400).json({ error: 'partnerName and endpointUrl are required.' });
  }
  const wh: V20InteroperabilityWebhook = {
    id: `V20-WHK-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    partnerName,
    endpointUrl,
    apiVersion: 'v1',
    events: Array.isArray(req.body?.events) ? req.body.events.map(cleanText) : ['TRADE_AGREEMENT_CREATED'],
    mode: 'SANDBOX',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  db.v20InteroperabilityWebhooks.set(wh.id, wh);
  db.scheduleSave();
  return res.status(201).json(wh);
});

v20Router.get('/interoperability/v1/trades/:id', (req: Request, res: Response) => {
  const trade = db.v20Trades.get(req.params.id);
  if (!trade) return res.status(404).json({ error: 'Trade not found.' });
  return res.json({
    schema: 'econex.interoperability.trade.v1',
    mode: 'SANDBOX_READ',
    tradeId: trade.id,
    stage: trade.stage,
    category: trade.category,
    quantity: trade.quantity,
    unitCode: trade.unitCode,
    currency: trade.currency,
    totalAmount: trade.totalAmount,
    updatedAt: trade.updatedAt,
  });
});

// ==========================================
// 10. OFFLINE SYNC & CONFLICT RESOLUTION
// ==========================================

v20Router.post('/offline/sync', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = processV20OfflineSync({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    items: Array.isArray(req.body?.items) ? req.body.items : [],
  });
  return res.json(out);
});

v20Router.get('/offline/conflicts', (_req: Request, res: Response) => {
  return res.json({
    conflicts: Array.from(db.v20OfflineConflicts.values()),
  });
});

v20Router.post('/offline/conflicts/:id/resolve', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = resolveV20OfflineConflict({
    conflictId: req.params.id,
    resolution: req.body?.resolution || 'RESOLVED_SERVER_WINS',
    actorUserId: ctx.userId,
  });
  return res.status(out.statusCode).json(out.ok ? out.conflict : { error: out.error });
});

// ==========================================
// 11. CONTROLLED AI ASSISTANCE (STRICTLY HUMAN-CONFIRMED)
// ==========================================

v20Router.post('/ai/assist', async (req: Request, res: Response) => {
  const { statusCode, result } = await executeV20OperationalAssist({
    taskType: req.body?.taskType || 'LISTING_DRAFT',
    prompt: cleanText(req.body?.prompt || ''),
    contextData: req.body?.contextData || {},
    humanConfirmedAction: Boolean(req.body?.humanConfirmedAction),
    requestedAutonomousAction: req.body?.requestedAutonomousAction,
  });
  return res.status(statusCode).json(result);
});

// ==========================================
// 12. OPERATIONAL PILOT FRAMEWORK (CONFIGURABLE, NON-HARDCODED)
// ==========================================

v20Router.get('/pilots', (_req: Request, res: Response) => {
  const pilots = Array.from(db.v20PilotProgrammes.values()).map((p) => recomputePilotMetrics(p));
  return res.json({ pilots, count: pilots.length });
});

v20Router.post('/pilots', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const name = cleanText(req.body?.name);
  const code = cleanText(req.body?.code || `PILOT-${Date.now().toString(36).toUpperCase()}`);
  const countryCode = cleanText(req.body?.countryCode || 'UG').toUpperCase();
  const regionName = cleanText(req.body?.regionName || 'Eastern Region');
  if (!name) return res.status(400).json({ error: 'Pilot name is required.' });

  const now = new Date().toISOString();
  const pilot: V20PilotProgramme = {
    id: `V20-PILOT-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    code,
    name,
    countryCode,
    regionName,
    districts: Array.isArray(req.body?.districts) ? req.body.districts.map(cleanText) : ['Mbale'],
    status: 'ACTIVE',
    supportContact: cleanText(req.body?.supportContact || 'pilot-support@vinexsah.example'),
    onboardedParticipants: [],
    metrics: {
      actual: { onboardedCount: 0, activeTradesCount: 0, completedTradesCount: 0, totalTradeVolumeUgx: 0 },
      simulated: { sandboxPaymentsCount: 0, sandboxVolumeUgx: 0 },
      test: { verificationTradesCount: 0 },
      target: {
        targetParticipants: Number(req.body?.targetParticipants || 30),
        targetCompletedTrades: Number(req.body?.targetCompletedTrades || 15),
      },
      projection: {
        estimatedMonthlyGmUgx: Number(req.body?.estimatedMonthlyGmUgx || 25000000),
        projectionDisclaimer: 'Planning target/projection only — NOT realized historical performance.',
      },
    },
    createdAt: now,
    updatedAt: now,
  };
  recomputePilotMetrics(pilot);
  db.v20PilotProgrammes.set(pilot.id, pilot);
  db.scheduleSave();
  return res.status(201).json(pilot);
});

v20Router.post('/pilots/:id/onboard', (req: Request, res: Response) => {
  const pilot = db.v20PilotProgrammes.get(req.params.id);
  if (!pilot) return res.status(404).json({ error: 'Pilot not found.' });
  if (pilot.status !== 'ACTIVE' && pilot.status !== 'PLANNING') {
    return res.status(409).json({ error: `Cannot onboard participants into ${pilot.status} pilot.` });
  }
  const participantId = cleanText(req.body?.participantId);
  const displayName = cleanText(req.body?.displayName);
  if (!participantId || !displayName) {
    return res.status(400).json({ error: 'participantId and displayName are required.' });
  }
  pilot.onboardedParticipants.push({
    participantId,
    displayName,
    roleType: cleanText(req.body?.roleType || 'FARMER'),
    district: cleanText(req.body?.district || pilot.districts[0] || 'Mbale'),
    onboardedAt: new Date().toISOString(),
    supportNotes: cleanText(req.body?.supportNotes || 'Onboarded via V20 Pilot Control Desk'),
  });
  recomputePilotMetrics(pilot);
  db.scheduleSave();
  return res.status(201).json(pilot);
});

v20Router.post('/pilots/:id/lifecycle', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const pilot = db.v20PilotProgrammes.get(req.params.id);
  if (!pilot) return res.status(404).json({ error: 'Pilot not found.' });
  const targetStatus = req.body?.status as V20PilotProgramme['status'];
  if (!['PLANNING', 'ACTIVE', 'SUSPENDED', 'CLOSED'].includes(targetStatus)) {
    return res.status(400).json({ error: 'Valid pilot status (PLANNING, ACTIVE, SUSPENDED, CLOSED) is required.' });
  }
  pilot.status = targetStatus;
  pilot.updatedAt = new Date().toISOString();
  db.v20PilotProgrammes.set(pilot.id, pilot);
  logIntelligenceAudit({
    tenantId: pilot.tenantId,
    jurisdiction: pilot.countryCode,
    actorId: ctx.userId,
    actorRole: ctx.role,
    actionType: 'V20_PILOT_LIFECYCLE',
    entityType: 'V20_PILOT',
    entityId: pilot.id,
    details: `Pilot ${pilot.code} transitioned to ${targetStatus}.`,
  });
  db.scheduleSave();
  return res.json(pilot);
});

v20Router.get('/pilots/:id/report', (req: Request, res: Response) => {
  const pilot = db.v20PilotProgrammes.get(req.params.id);
  if (!pilot) return res.status(404).json({ error: 'Pilot not found.' });
  const fresh = recomputePilotMetrics(pilot);
  return res.json({
    product: 'ECONEX',
    release: 'V20.0-UNIFIED-ECONOMIC-OPERATIONS',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    pilot: fresh,
    metricSeparationGuarantee: 'Actual operational trades, simulated sandbox payments, verification test records, planning targets, and projections are strictly separated.',
    generatedAt: new Date().toISOString(),
  });
});
