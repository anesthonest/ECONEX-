/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V15.0 - Global Economic Network Activation, Production Launch & Impact REST Router
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import {
  probePostgresV15,
  requestDatabaseAuthorityTransitionV15,
  manageHsmKeyLifecycleV15,
  exportAndVerifyAuditArchiveV15,
  executeRecoveryVerificationV15,
  evaluateV15ProductionGates,
  evaluateV159ConsolidatedReadiness,
} from './v15InfraActivation.ts';
import {
  ALL_24_PARTICIPANT_CATEGORIES,
  registerEconomicParticipantV15,
  verifyParticipantKycOrKybV15,
  suspendOrAppealParticipantV15,
  discoverAndMatchV15,
  createMarketplaceOrderV15,
  transitionMarketplaceOrderV15,
  submitOrVerifyDeliveryEvidenceV15,
} from './v15ParticipantNetwork.ts';
import {
  advancePaymentProviderLifecycleV15,
  initiateProviderPaymentV15,
  verifySettlementEvidenceV15,
  runReconciliationV15,
  getInstitutionalDashboardV15,
  createTradeShipmentV15,
  transitionTradeShipmentV15,
  computeEconomicImpactV15,
  registerDeveloperAppV15,
} from './v15TradeImpactEcosystem.ts';
import {
  getDistributedEventsInfraSummary,
  publishV14OrderedEvent,
  runBackupAndRestoreDrillV14,
} from './v14DbInfra.ts';
import {
  getSecurityOperationsSummaryV14,
  assessJurisdictionTaxV14,
  subscribeAndBillTenantV14,
} from './v14OperationsSecurity.ts';
import { getPerCurrencyLedgerIsolationReport } from './v14InstitutionsFinance.ts';

export const v15Router = Router();

interface V15Context {
  tenantId: string;
  userId: string;
  role: string;
  isPlatformAdmin: boolean;
}

// Per-app in-memory fixed-window rate limiter for developer endpoints
const devAppRateWindow = new Map<string, { windowStartMs: number; count: number }>();

function recordV15SecurityIncident(category: any, severity: any, tenantId: string, actorId: string | undefined, details: string) {
  const id = `SECINC-V15-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
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

function resolveV15Actor(req: Request): { userId?: string; role: string; isPlatformAdmin: boolean } {
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

function requireV15Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV15Actor(req);
  if (!actor.userId) {
    recordV15SecurityIncident('AUTH_FAILURE_BURST', 'MEDIUM', 'GLOBAL_PUBLIC', undefined, `Unauthenticated V15 request blocked on ${req.path}`);
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V15 APIs.',
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
        recordV15SecurityIncident(
          'CROSS_TENANT_ACCESS',
          'HIGH',
          requestedTenantId,
          actor.userId,
          `Cross-tenant V15 access blocked for ${actor.userId} on ${requestedTenantId}`
        );
        return res.status(403).json({
          error: 'TENANT_ISOLATION_VIOLATION',
          message: `Actor ${actor.userId} does not belong to tenant ${requestedTenantId}.`,
        });
      }
    }
  } else if (!actor.isPlatformAdmin) {
    return res.status(403).json({
      error: 'FORBIDDEN_GLOBAL_SCOPE',
      message: 'Only PLATFORM_ADMIN may access GLOBAL_PUBLIC scope.',
    });
  }

  (req as any).v15 = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies V15Context;
  return next();
}

function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const ctx: V15Context = (req as any).v15;
  if (!ctx?.isPlatformAdmin) {
    return res.status(403).json({
      error: 'PLATFORM_ADMIN_REQUIRED',
      message: `Role ${ctx?.role || 'UNKNOWN'} is not authorized for administrative operation.`,
    });
  }
  return next();
}

function getCtx(req: Request): V15Context {
  return (req as any).v15;
}

v15Router.use(requireV15Context);

// ==========================================
// 1. PARTICIPANTS & ORGANIZATIONS (/participants, /organizations)
// ==========================================

v15Router.get('/participants', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const category = req.query.category as string | undefined;
  const jurisdiction = req.query.jurisdiction as string | undefined;
  const pilotOnly = req.query.pilotOnly === 'true';

  const items = Array.from(db.v15Participants.values()).filter((p) => {
    if (!ctx.isPlatformAdmin && p.tenantId !== ctx.tenantId) return false;
    if (category && p.category !== category) return false;
    if (jurisdiction && p.jurisdiction !== jurisdiction) return false;
    if (pilotOnly && !p.isPilotParticipant) return false;
    return true;
  });

  return res.json({
    totalCategoriesSupported: ALL_24_PARTICIPANT_CATEGORIES.length,
    supportedCategories: ALL_24_PARTICIPANT_CATEGORIES,
    participants: items,
    verifications: Array.from(db.v15ParticipantVerifications.values()),
    profiles: Array.from(db.v15EconomicProfiles.values()),
    locations: Array.from(db.v15BusinessLocations.values()),
  });
});

v15Router.post('/participants', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { displayName, category, jurisdiction, districtOrCity, isPilotParticipant, pilotConsentRecorded, primarySector } = req.body || {};
  if (!displayName || !category) {
    return res.status(400).json({ error: 'displayName and category are required.' });
  }
  const r = registerEconomicParticipantV15({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    displayName: String(displayName),
    category,
    jurisdiction: jurisdiction || 'UG',
    districtOrCity: districtOrCity || 'Kampala',
    isPilotParticipant: Boolean(isPilotParticipant),
    pilotConsentRecorded: Boolean(pilotConsentRecorded),
    primarySector,
  });
  return res.status(r.statusCode).json(r.ok ? r.participant : { error: r.error });
});

v15Router.post('/participants/:id/verify', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { verificationType, documentReference, decision, notes } = req.body || {};
  if (!verificationType || !decision) {
    return res.status(400).json({ error: 'verificationType and decision (VERIFIED|REJECTED) are required.' });
  }
  const r = verifyParticipantKycOrKybV15({
    participantId: req.params.id,
    verificationType,
    documentReference: documentReference || 'REG-DOC',
    decision,
    notes: notes || '',
    reviewerId: ctx.userId,
  });
  return res.status(r.statusCode).json(r.ok ? { participant: r.participant, verification: r.verification } : { error: r.error });
});

v15Router.post('/participants/:id/status', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { action, reasonOrNote } = req.body || {};
  if (!action || !['SUSPEND', 'APPEAL', 'REINSTATE'].includes(action)) {
    return res.status(400).json({ error: 'action must be SUSPEND, APPEAL, or REINSTATE.' });
  }
  if ((action === 'SUSPEND' || action === 'REINSTATE') && !ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'PLATFORM_ADMIN role required to suspend or reinstate participants.' });
  }
  const r = suspendOrAppealParticipantV15({
    participantId: req.params.id,
    action,
    reasonOrNote: reasonOrNote || '',
  });
  return res.status(r.statusCode).json(r.ok ? r.participant : { error: r.error });
});

v15Router.get('/organizations', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const orgs = Array.from(db.organizations.values()).filter((o) => ctx.isPlatformAdmin || o.id === ctx.tenantId || o.country === 'UG');
  const memberships = Array.from(db.v15OrganizationMemberships.values()).filter((m) => ctx.isPlatformAdmin || m.tenantId === ctx.tenantId);
  return res.json({ organizations: orgs, v15Memberships: memberships });
});

// ==========================================
// 2. MARKETPLACE, DISCOVERY, MATCHING, ORDERS & EXECUTIONS
// ==========================================

v15Router.get('/marketplace', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  return res.json({
    economicListings: Array.from(db.v15EconomicListings.values()),
    serviceListings: Array.from(db.v15ServiceListings.values()),
    buyerRequests: Array.from(db.v15BuyerRequests.values()),
    supplierOffers: Array.from(db.v15SupplierOffers.values()),
    quotations: Array.from(db.v15CommercialQuotations.values()).filter((q) => ctx.isPlatformAdmin || q.tenantId === ctx.tenantId),
    orders: Array.from(db.v15MarketplaceOrders.values()).filter((o) => ctx.isPlatformAdmin || o.tenantId === ctx.tenantId),
    purchaseOrders: Array.from(db.v15PurchaseOrders.values()).filter((po) => ctx.isPlatformAdmin || po.tenantId === ctx.tenantId),
  });
});

v15Router.post('/marketplace/listings', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { supplierParticipantId, sellerParticipantId, marketType, title, description, sector, jurisdiction, unit, unitPrice, currency, availableQuantity, minOrderQuantity, promotedPlacement } = req.body || {};
  const sellerId = sellerParticipantId || supplierParticipantId;
  if (!sellerId || !title || !sector) {
    return res.status(400).json({ error: 'sellerParticipantId/supplierParticipantId, title, and sector are required.' });
  }
  const supplier = db.v15Participants.get(sellerId);
  if (!supplier) return res.status(404).json({ error: 'Supplier participant not found.' });
  const now = new Date().toISOString();
  const id = `LST-V15-${Date.now().toString(36).toUpperCase()}`;
  const listing = {
    id,
    tenantId: ctx.tenantId,
    sellerParticipantId: sellerId,
    marketType: marketType || ('WHOLESALE' as const),
    title: String(title),
    description: String(description || title),
    sector,
    jurisdiction: jurisdiction || supplier.jurisdiction || 'UG',
    unit: unit || 'unit',
    unitPrice: Number(unitPrice || 0),
    currency: currency || 'UGX',
    availableQuantity: Number(availableQuantity || 0),
    minOrderQuantity: Math.max(1, Number(minOrderQuantity || 1)),
    verifiedSupplier: supplier.verificationLevel !== 'REGISTERED_UNVERIFIED',
    promotedPlacement: Boolean(promotedPlacement),
    active: true,
    createdAt: now,
  };
  db.v15EconomicListings.set(id, listing);
  db.scheduleSave();
  return res.status(201).json(listing);
});

v15Router.post('/marketplace/quotations', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { buyerParticipantId, supplierParticipantId, sellerParticipantId, listingId, quantity, unitPrice, quotedUnitPrice, currency, validUntil } = req.body || {};
  const sellerId = sellerParticipantId || supplierParticipantId;
  const uPrice = Number(quotedUnitPrice ?? unitPrice ?? 0);
  if (!buyerParticipantId || !sellerId || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'buyerParticipantId, sellerParticipantId, and positive quantity required.' });
  }
  const totalQuotedValue = Number((Number(quantity) * uPrice).toFixed(2));
  const q = {
    id: `QUO-V15-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    buyerParticipantId,
    sellerParticipantId: sellerId,
    listingId,
    currency: currency || 'UGX',
    quantity: Number(quantity),
    quotedUnitPrice: uPrice,
    totalQuotedValue,
    validUntil: validUntil || new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'SENT' as const,
    createdAt: new Date().toISOString(),
  };
  db.v15CommercialQuotations.set(q.id, q);
  db.scheduleSave();
  return res.status(201).json(q);
});

v15Router.get('/discovery', (req: Request, res: Response) => {
  const requesterParticipantId = (req.query.requesterParticipantId as string) || 'EP-UG-SME-ROOFINGS';
  const result = discoverAndMatchV15({
    requesterParticipantId,
    query: req.query.q as string | undefined,
    sector: req.query.sector as any,
    jurisdiction: req.query.jurisdiction as string | undefined,
    verifiedOnly: req.query.verifiedOnly === 'true',
    includePromoted: req.query.includePromoted !== 'false',
    targetType: (req.query.targetType as any) || 'ALL',
  });
  return res.json(result);
});

v15Router.post('/matching', (req: Request, res: Response) => {
  const { requesterParticipantId, query, sector, jurisdiction, verifiedOnly, includePromoted, targetType } = req.body || {};
  const result = discoverAndMatchV15({
    requesterParticipantId: requesterParticipantId || 'EP-UG-SME-ROOFINGS',
    query,
    sector,
    jurisdiction,
    verifiedOnly,
    includePromoted,
    targetType,
  });
  result.organicMatches.slice(0, 5).forEach((m) => db.v15ParticipantMatches.set(m.id, m));
  db.scheduleSave();
  return res.json(result);
});

v15Router.get('/orders', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const orders = Array.from(db.v15MarketplaceOrders.values()).filter((o) => ctx.isPlatformAdmin || o.tenantId === ctx.tenantId);
  return res.json({ orders, count: orders.length });
});

v15Router.post('/orders', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { buyerParticipantId, sellerParticipantId, listingId, jurisdiction, currency, quantity, unitPrice, initialState } = req.body || {};
  if (!buyerParticipantId || !sellerParticipantId || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'buyerParticipantId, sellerParticipantId, and positive quantity are required.' });
  }
  const r = createMarketplaceOrderV15({
    tenantId: ctx.tenantId,
    buyerParticipantId,
    sellerParticipantId,
    listingId,
    jurisdiction: jurisdiction || 'UG',
    currency: currency || 'UGX',
    quantity: Number(quantity),
    unitPrice: Number(unitPrice || 0),
    actorId: ctx.userId,
    initialState,
  });
  return res.status(r.statusCode).json(r.ok ? { order: r.order, execution: r.execution } : { error: r.error });
});

v15Router.post('/orders/:id/transition', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { targetState, note } = req.body || {};
  if (!targetState) return res.status(400).json({ error: 'targetState is required.' });
  const r = transitionMarketplaceOrderV15({
    orderId: req.params.id,
    targetState,
    actorId: ctx.userId,
    note,
  });
  return res.status(r.statusCode).json(r.ok ? r.order : { error: r.error });
});

v15Router.post('/orders/:id/delivery-evidence', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { action, evidenceId, submittedByParticipantId, verifierParticipantId, evidenceType, documentSummary } = req.body || {};
  if (!action || !['SUBMIT', 'VERIFY'].includes(action)) {
    return res.status(400).json({ error: 'action must be SUBMIT or VERIFY.' });
  }
  const r = submitOrVerifyDeliveryEvidenceV15({
    action,
    evidenceId,
    marketplaceOrderId: req.params.id,
    submittedByParticipantId: submittedByParticipantId || ctx.userId,
    verifierParticipantId,
    evidenceType,
    documentSummary,
    tenantId: ctx.tenantId,
  });
  return res.status(r.statusCode).json(r.ok ? r.evidence : { error: r.error });
});

v15Router.get('/executions', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const executions = Array.from(db.v15EconomicExecutions.values()).filter((e) => ctx.isPlatformAdmin || e.tenantId === ctx.tenantId);
  const events = Array.from(db.v15ExecutionEvents.values()).filter((ev) => ctx.isPlatformAdmin || ev.tenantId === ctx.tenantId);
  return res.json({ executions, events, deliveryEvidences: Array.from(db.v15DeliveryEvidences.values()) });
});

// ==========================================
// 3. FINANCIAL PROVIDERS (8-STATE), SETTLEMENT, RECONCILIATION & INSTITUTIONS (11-STATE)
// ==========================================

v15Router.get('/providers', (_req: Request, res: Response) => {
  return res.json({
    providers: Array.from(db.v15ProviderIntegrations.values()),
    disclosure: 'Licensed payment rail adapters operate provider-neutrally; live settlement requires valid credentials and signed provider settlement receipts.',
  });
});

v15Router.post('/providers/:id/lifecycle', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { targetState } = req.body || {};
  if (!targetState) return res.status(400).json({ error: 'targetState is required.' });
  const r = advancePaymentProviderLifecycleV15({
    providerId: req.params.id,
    targetState,
    actorId: ctx.userId,
  });
  return res.status(r.statusCode).json(r.ok ? r.provider : { error: r.error });
});

v15Router.get('/financial', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const v15SettledUnverified = Array.from(db.v15ProviderTransactions.values()).filter(
    (t) =>
      t.status === 'SETTLED' &&
      !Array.from(db.v15SettlementEvidences.values()).some(
        (ev) => ev.providerTransactionId === t.id && ev.verifiedByPlatform === true
      )
  ).length;
  const v14SettledUnverified = Array.from(db.financialExecutionRecords.values()).filter(
    (r) =>
      (r.lifecycleStage === 'SETTLEMENT_CONFIRMED' || r.lifecycleStage === 'RECONCILED') &&
      !r.settlementEvidenceHash
  ).length;
  return res.json({
    transactions: Array.from(db.v15ProviderTransactions.values()).filter((t) => ctx.isPlatformAdmin || t.tenantId === ctx.tenantId),
    settlementEvidences: Array.from(db.v15SettlementEvidences.values()).filter((s) => ctx.isPlatformAdmin || s.tenantId === ctx.tenantId),
    reconciliations: Array.from(db.v15FinancialReconciliations.values()).filter((r) => ctx.isPlatformAdmin || r.tenantId === ctx.tenantId),
    ledgerIntegrity: db.getFinancialIntegrityReport(),
    unverifiedSettledPaymentsCount: v15SettledUnverified + v14SettledUnverified,
    currencyIsolation: getPerCurrencyLedgerIsolationReport(),
  });
});

v15Router.post('/financial/initiate', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { providerId, executionId, marketplaceOrderId, idempotencyKey, currency, amount } = req.body || {};
  if (!providerId || !idempotencyKey || Number(amount) <= 0) {
    return res.status(400).json({ error: 'providerId, idempotencyKey, and positive amount are required.' });
  }
  const r = initiateProviderPaymentV15({
    providerId,
    tenantId: ctx.tenantId,
    executionId,
    marketplaceOrderId,
    idempotencyKey: String(idempotencyKey),
    currency: currency || 'UGX',
    amount: Number(amount),
  });
  return res.status(r.statusCode).json(r.ok ? { deduplicated: r.deduplicated, transaction: r.transaction } : { error: r.error });
});

v15Router.post('/financial/settlement-verify', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { transactionId, providerReceiptRef, settledAmount, currency, hmacSignatureHex, syntheticFlag } = req.body || {};
  if (!transactionId || !providerReceiptRef || Number(settledAmount) <= 0) {
    return res.status(400).json({ error: 'transactionId, providerReceiptRef, and positive settledAmount are required.' });
  }
  const r = verifySettlementEvidenceV15({
    transactionId,
    providerReceiptRef,
    settledAmount: Number(settledAmount),
    currency: currency || 'UGX',
    hmacSignatureHex: hmacSignatureHex || '',
    syntheticFlag: Boolean(syntheticFlag),
    actorId: ctx.userId,
  });
  return res.status(r.statusCode).json(r.ok ? { transaction: r.transaction, evidence: r.evidence } : { error: r.error });
});

v15Router.post('/financial/reconcile', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { providerId, currency } = req.body || {};
  const rec = runReconciliationV15({
    tenantId: ctx.tenantId,
    providerId: providerId || 'V15-PROV-MTN-MOMO-UG',
    currency: currency || 'UGX',
    actorId: ctx.userId,
  });
  return res.status(201).json(rec);
});

v15Router.get('/institutions', (_req: Request, res: Response) => {
  return res.json(getInstitutionalDashboardV15());
});

// ==========================================
// 4. TRADE, CORRIDORS, LOGISTICS, OPPORTUNITIES & 16 SECTORS
// ==========================================

v15Router.get('/trade', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  return res.json({
    tradeOpportunities: Array.from(db.v15TradeOpportunities.values()),
    tradeShipments: Array.from(db.v15TradeShipments.values()).filter((s) => ctx.isPlatformAdmin || s.tenantId === ctx.tenantId),
    corridors: Array.from(db.v15CorridorActivities.values()),
    disclosure: 'Platform trade documentation and tax estimates are informational workflows unless official customs authority clearance is verified.',
  });
});

v15Router.post('/trade/shipments', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { executionId, originJurisdiction, destinationJurisdiction, corridorCode, carrierParticipantId, hsClassificationRef, estimatedDutyTaxAmount, currency } = req.body || {};
  const shp = createTradeShipmentV15({
    tenantId: ctx.tenantId,
    executionId,
    originJurisdiction: originJurisdiction || 'UG',
    destinationJurisdiction: destinationJurisdiction || 'KE',
    corridorCode: corridorCode || 'NORTHERN_CORRIDOR',
    carrierParticipantId: carrierParticipantId || 'EP-UG-LOGISTICS-TRANS',
    hsClassificationRef: hsClassificationRef || '0901.11',
    estimatedDutyTaxAmount: Number(estimatedDutyTaxAmount || 0),
    currency: currency || 'USD',
  });
  return res.status(201).json(shp);
});

v15Router.post('/trade/shipments/:id/transition', (req: Request, res: Response) => {
  const { targetMilestone, customsAuthorityReference } = req.body || {};
  if (!targetMilestone) return res.status(400).json({ error: 'targetMilestone is required.' });
  const r = transitionTradeShipmentV15({
    shipmentId: req.params.id,
    targetMilestone,
    customsAuthorityReference,
  });
  return res.status(r.statusCode).json(r.ok ? r.shipment : { error: r.error });
});

v15Router.post('/trade/tax-assess', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { jurisdiction, grossAmount, taxableBase, currency, taxType, operationReferenceId } = req.body || {};
  const r = assessJurisdictionTaxV14({
    tenantId: ctx.tenantId,
    jurisdiction: jurisdiction || 'UG',
    taxType: taxType || 'VAT',
    operationReferenceId: operationReferenceId || `TAXREF-${Date.now().toString(36).toUpperCase()}`,
    taxableBase: Number(taxableBase ?? grossAmount ?? 0),
    currency: currency || 'UGX',
  });
  return res.status(r.statusCode).json(r.ok ? { assessment: r.assessment, disclosure: 'Informational calculation only; not an official tax filing unless submitted to revenue authority.' } : { error: r.error });
});

v15Router.get('/logistics', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  return res.json({
    bookings: Array.from(db.v15LogisticsBookings.values()).filter((b) => ctx.isPlatformAdmin || b.tenantId === ctx.tenantId),
    corridors: Array.from(db.v15CorridorActivities.values()),
    serviceListings: Array.from(db.v15ServiceListings.values()),
  });
});

v15Router.post('/logistics/bookings', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { tradeShipmentId, marketplaceOrderId, logisticsParticipantId, shipperParticipantId, originDistrict, destinationDistrict, agreedRate, quotedFreightCost, currency } = req.body || {};
  if (!logisticsParticipantId || (!tradeShipmentId && (!originDistrict || !destinationDistrict))) {
    return res.status(400).json({ error: 'logisticsParticipantId and shipment/route details are required.' });
  }
  const b = {
    id: `LOGB-V15-${Date.now().toString(36).toUpperCase()}`,
    tenantId: ctx.tenantId,
    tradeShipmentId: tradeShipmentId || marketplaceOrderId || 'UNLINKED',
    logisticsParticipantId,
    shipperParticipantId: shipperParticipantId || ctx.userId,
    quotedFreightCost: Number(quotedFreightCost ?? agreedRate ?? 0),
    currency: currency || 'UGX',
    status: 'CONFIRMED' as const,
    createdAt: new Date().toISOString(),
  };
  db.v15LogisticsBookings.set(b.id, b);
  db.scheduleSave();
  return res.status(201).json(b);
});

v15Router.get('/opportunities', (_req: Request, res: Response) => {
  return res.json({
    marketOpportunities: Array.from(db.v15MarketOpportunities.values()),
    employmentOpportunities: Array.from(db.v15EmploymentOpportunities.values()),
    applications: Array.from(db.v15OpportunityApplications.values()),
  });
});

v15Router.post('/opportunities/:id/apply', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { applicantParticipantId, proposalSummary, coverNote, opportunityKind } = req.body || {};
  const noteText = coverNote || proposalSummary;
  if (!applicantParticipantId || !noteText) {
    return res.status(400).json({ error: 'applicantParticipantId and proposalSummary/coverNote are required.' });
  }
  const participant = db.v15Participants.get(applicantParticipantId);
  const app = {
    id: `OAPP-V15-${Date.now().toString(36).toUpperCase()}`,
    opportunityId: req.params.id,
    opportunityKind: opportunityKind || ('MARKET' as const),
    applicantParticipantId,
    tenantId: ctx.tenantId,
    eligibilityVerified: Boolean(participant && participant.verificationLevel !== 'REGISTERED_UNVERIFIED'),
    coverNote: String(noteText),
    status: 'SUBMITTED' as const,
    appliedAt: new Date().toISOString(),
  };
  db.v15OpportunityApplications.set(app.id, app);
  db.scheduleSave();
  return res.status(201).json(app);
});

v15Router.get('/industries', (_req: Request, res: Response) => {
  const sectors = Array.from(db.v15IndustryValueChains.values());
  return res.json({ totalSectors: sectors.length, sectors });
});

// ==========================================
// 5. ECONOMIC IMPACT (24 INDICATORS), COMMERCIAL, DEVELOPERS & PILOT
// ==========================================

v15Router.get('/impact', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const jurisdiction = req.query.jurisdiction as string | undefined;
  const computed = computeEconomicImpactV15({
    tenantId: ctx.tenantId,
    jurisdiction,
    actorId: ctx.userId,
  });
  return res.json({
    ...computed,
    metricDefinitions: Array.from(db.v15ImpactMetrics.values()),
    participantOutcomes: Array.from(db.v15ParticipantOutcomes.values()),
    totalStoredMeasurements: db.v15ImpactMeasurements.size,
  });
});

v15Router.get('/commercial', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const invoices = Array.from(db.customerInvoices.values()).filter((i) => ctx.isPlatformAdmin || i.tenantId === ctx.tenantId);
  const usageRecords = Array.from(db.v15CommercialUsageRecords.values()).filter((u) => ctx.isPlatformAdmin || u.tenantId === ctx.tenantId);
  const invoicedUsd = invoices.reduce((s, i) => s + (i.currency === 'USD' ? i.totalAmount : i.totalAmount / 3685), 0);
  const collectedUsd = usageRecords.reduce((s, r) => s + r.collectedRevenueUsd, 0);
  return res.json({
    plans: Array.from(db.commercialPlanCatalog.values()),
    subscriptions: Array.from(db.customerSubscriptions.values()).filter((s) => ctx.isPlatformAdmin || s.tenantId === ctx.tenantId),
    invoices,
    usageRecords,
    totals: {
      invoicedAmountUsdEquivalent: Number(invoicedUsd.toFixed(2)),
      collectedRevenueUsd: Number(collectedUsd.toFixed(2)),
      separationRule: 'Commercial invoices never counted as collected revenue until verified settlement proof exists.',
    },
  });
});

v15Router.post('/commercial/subscribe', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { planCode, billingCycle, currency, apiCallsUsage } = req.body || {};
  if (!planCode) return res.status(400).json({ error: 'planCode is required.' });
  let r: ReturnType<typeof subscribeAndBillTenantV14>;
  try {
    r = subscribeAndBillTenantV14({
      tenantId: ctx.tenantId,
      planCode,
      billingCycle: billingCycle || 'MONTHLY',
      currency: currency || 'UGX',
      apiCallsUsage: Number(apiCallsUsage || 0),
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Subscription creation failed.' });
  }
  const uId = `CUSG-V15-${Date.now().toString(36).toUpperCase()}`;
  const billed = Number(r.invoice?.totalAmount || 0);
  db.v15CommercialUsageRecords.set(uId, {
    id: uId,
    tenantId: ctx.tenantId,
    participantId: ctx.userId,
    streamType: 'SUBSCRIPTION',
    quantity: Math.max(1, Number(apiCallsUsage || 1)),
    unitFeeUsd: billed,
    totalBilledUsd: billed,
    collectedRevenueUsd: 0, // Strictly zero until settlement receipt verified
    feeDisclosed: true,
    publicServiceExemptChecked: true,
    recordedAt: new Date().toISOString(),
  });
  db.scheduleSave();
  return res.status(201).json(r);
});

v15Router.get('/developers', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const apps = Array.from(db.v15DeveloperApplications.values())
    .filter((a) => ctx.isPlatformAdmin || a.tenantId === ctx.tenantId)
    .map((a) => ({ ...a, apiSecretHashSha256: undefined })); // Never return secret hash
  return res.json({
    apiVersion: 'v15',
    authModesSupported: ['OAUTH2_CLIENT_CREDENTIALS', 'SCOPED_API_KEY'],
    sandboxEndpointPrefix: '/api/v15',
    apps,
    usageLogs: Array.from(db.v15ApiUsageRecords.values()).slice(-30),
  });
});

v15Router.post('/developers/apps', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { appName, developerParticipantId, authMode, scopes, rateLimitPerMinute } = req.body || {};
  if (!appName) return res.status(400).json({ error: 'appName is required.' });
  const r = registerDeveloperAppV15({
    developerParticipantId: developerParticipantId || 'EP-UG-DEVLAB-01',
    tenantId: ctx.tenantId,
    appName: String(appName),
    authMode,
    scopes,
    rateLimitPerMinute,
  });
  return res.status(r.statusCode).json({
    app: { ...r.app, apiSecretHashSha256: undefined },
    issuedSecretOnce: r.issuedSecretOnce,
    secretNote: 'Store issuedSecretOnce securely; server stores SHA-256 hash only and will never echo plaintext again.',
  });
});

v15Router.post('/developers/gateway-ping', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { appId, requiredScope, apiSecret } = req.body || {};
  const app = db.v15DeveloperApplications.get(appId);
  if (!app) return res.status(404).json({ error: 'Developer app not found.' });
  if (app.tenantId !== ctx.tenantId && !ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'Tenant boundary prevents invoking foreign developer app.' });
  }
  if (apiSecret) {
    const hashed = `0x${crypto.createHash('sha256').update(String(apiSecret)).digest('hex')}`;
    if (hashed !== app.apiSecretHashSha256) {
      return res.status(401).json({ error: 'INVALID_API_SECRET' });
    }
  }
  if (requiredScope && !app.scopes.includes(requiredScope)) {
    return res.status(403).json({ error: `SCOPE_DENIED: App lacks required scope '${requiredScope}'.` });
  }

  const nowMs = Date.now();
  const win = devAppRateWindow.get(app.id) || { windowStartMs: nowMs, count: 0 };
  if (nowMs - win.windowStartMs > 60000) {
    win.windowStartMs = nowMs;
    win.count = 0;
  }
  win.count += 1;
  devAppRateWindow.set(app.id, win);

  if (win.count > app.rateLimitPerMinute) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      limitPerMinute: app.rateLimitPerMinute,
      observedInWindow: win.count,
    });
  }

  const recId = `APIU-V15-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  db.v15ApiUsageRecords.set(recId, {
    id: recId,
    developerAppId: app.id,
    tenantId: app.tenantId,
    endpointPath: req.body?.endpoint || '/api/v15/discovery',
    apiVersion: 'v15',
    statusCode: 200,
    rateLimited: false,
    latencyMs: 3,
    recordedAt: new Date().toISOString(),
  });
  db.scheduleSave();
  return res.json({
    ok: true,
    appId: app.id,
    environment: app.environment,
    rateLimitRemaining: Math.max(0, app.rateLimitPerMinute - win.count),
  });
});

// ==========================================
// 6. INFRASTRUCTURE, SECURITY, OPERATIONS (17 GATES), PILOT & VERIFICATION
// ==========================================

v15Router.get('/infrastructure', async (_req: Request, res: Response) => {
  const pg = await probePostgresV15();
  const events = getDistributedEventsInfraSummary();
  const mig = db.verifyV15MigrationCompleteness();
  const rollback = db.verifyV14BackupAndRollbackReadiness();
  return res.json({
    postgres: pg,
    events,
    migration: mig,
    rollbackReadiness: rollback,
    activations: Array.from(db.v15InfrastructureActivations.values()),
    regionalServices: Array.from(db.v15RegionalServiceStatuses.values()),
  });
});

v15Router.post('/infrastructure/database/authority', requirePlatformAdmin, async (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { targetAuthorityState, adminApproved } = req.body || {};
  if (!targetAuthorityState) return res.status(400).json({ error: 'targetAuthorityState is required.' });
  const r = await requestDatabaseAuthorityTransitionV15({
    targetAuthorityState,
    adminApproved: Boolean(adminApproved),
    actorId: ctx.userId,
  });
  return res.status(r.statusCode).json(r);
});

v15Router.post('/infrastructure/events/publish', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { topic, eventType, partitionKey, orderingKey, payload } = req.body || {};
  const evType = eventType || topic;
  const ordKey = orderingKey || partitionKey;
  if (!evType || !ordKey) return res.status(400).json({ error: 'topic/eventType and partitionKey/orderingKey are required.' });
  const ev = publishV14OrderedEvent({
    eventType: evType,
    schemaVersion: '15.0',
    jurisdiction: 'UG',
    tenantId: ctx.tenantId,
    orderingKey: ordKey,
    idempotencyKey: `V15EV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
    actorId: ctx.userId,
    actorRole: ctx.role,
    payloadReference: `REF-${ordKey}`,
    payloadSummary: payload || {},
  });
  return res.status(ev.statusCode).json({
    ...ev,
    id: ev.event?.id,
    partitionSequence: db.distributedEventOutbox.size,
  });
});

v15Router.get('/security', (_req: Request, res: Response) => {
  return res.json({
    ...getSecurityOperationsSummaryV14(),
    auditArchives: Array.from(db.externalAuditArchives.values()),
  });
});

v15Router.post('/security/hsm', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { action, keyId } = req.body || {};
  if (!action || !keyId) return res.status(400).json({ error: 'action and keyId are required.' });
  const r = manageHsmKeyLifecycleV15({ action, keyId, actorId: ctx.userId });
  return res.status(r.statusCode).json(r);
});

v15Router.post('/security/audit/archive', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  return res.status(201).json(exportAndVerifyAuditArchiveV15(ctx.userId));
});

v15Router.get('/operations', async (_req: Request, res: Response) => {
  const gates = await evaluateV15ProductionGates('DEVELOPMENT');
  const v159Gates = await evaluateV159ConsolidatedReadiness('DEVELOPMENT');
  const pilotOps = Array.from(db.v15PilotOperations.values());
  const drVerifications = Array.from(db.v15RecoveryVerifications.values());
  return res.json({
    product: 'ECONEX',
    release: 'V15.0-GLOBAL-ECONOMIC-NETWORK-ACTIVATION',
    consolidationRelease: 'V15.9-FINAL-CONSOLIDATION-AND-RELEASE',
    schemaVersion: db.schemaVersion,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    productionGates: gates,
    v159ReadinessGates: v159Gates,
    pilotOperations: pilotOps,
    recoveryVerifications: drVerifications,
    v15CollectionCounts: db.getV15CollectionCountsSnapshot(),
  });
});

v15Router.get('/readiness/v159', async (_req: Request, res: Response) => {
  const report = await evaluateV159ConsolidatedReadiness('DEVELOPMENT');
  return res.json(report);
});

v15Router.post('/operations/recovery-verify', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { scenario, targetRpoMinutes, targetRtoMinutes } = req.body || {};
  const backupDrill = runBackupAndRestoreDrillV14(ctx.userId);
  const rec = executeRecoveryVerificationV15({
    scenario: scenario || 'DATABASE_AND_LEDGER_RECOVERY',
    targetRpoMinutes,
    targetRtoMinutes,
    actorId: ctx.userId,
  });
  return res.status(201).json({ recoveryVerification: rec, backupDrill });
});

v15Router.post('/pilot/cohorts', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { cohortName, pilotCode, producerParticipantId, buyerParticipantId, logisticsParticipantId, currentStepName } = req.body || {};
  if (!cohortName && !pilotCode) return res.status(400).json({ error: 'cohortName or pilotCode is required.' });
  const now = new Date().toISOString();
  const id = `PILOT-UG-${Date.now().toString(36).toUpperCase()}`;
  const cohort = {
    id,
    pilotCode: String(pilotCode || cohortName),
    tenantId: ctx.tenantId,
    jurisdiction: 'UG',
    producerParticipantId: producerParticipantId || 'EP-UG-COOP-ELGON',
    buyerParticipantId: buyerParticipantId || 'EP-UG-SME-ROOFINGS',
    logisticsParticipantId: logisticsParticipantId || 'EP-UG-LOGISTICS-TRANS',
    currentStepNumber: 2,
    currentStepName: currentStepName || 'Consenting Uganda pilot participants onboarded cleanly',
    usesLivePaymentRail: false,
    nonProductionWorkflowDisclosed: true,
    operationalIssues: [],
    participantFeedback: [`Registered under admin ${ctx.userId}`],
    status: 'ACTIVE_IN_PROGRESS' as const,
    updatedAt: now,
  };
  db.v15PilotOperations.set(id, cohort);
  db.scheduleSave();
  return res.status(201).json(cohort);
});

v15Router.get('/verification', (_req: Request, res: Response) => {
  const schemaIntegrity = db.validateV15SchemaIntegrity();
  const migrationCompleteness = db.verifyV15MigrationCompleteness();
  const rollbackReadiness = db.verifyV14BackupAndRollbackReadiness();
  const compatibility = db.restoreV14Compatibility();
  const infraSummary = Array.from(db.v15InfrastructureActivations.values()).map((a) => ({
    id: a.id,
    component: a.component,
    currentState: a.currentState,
  }));
  return res.json({
    schemaIntegrity,
    migrationCompleteness,
    rollbackReadiness,
    compatibility,
    infrastructureStates: infraSummary,
    totalV15Collections: Object.keys(db.getV15CollectionCountsSnapshot()).filter((k) => k.startsWith('v15')).length,
  });
});

v15Router.get('/support', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const cases = Array.from(db.supportCases.values())
    .filter((c) => ctx.isPlatformAdmin || c.userId === ctx.userId || c.tenantId === ctx.tenantId)
    .reverse();
  return res.json({ cases });
});

v15Router.post('/support', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const { category, subject, details } = req.body || {};
  const cleanSubject = String(subject || '').replace(/[<>]/g, '').trim();
  const cleanDetails = String(details || '').replace(/[<>]/g, '').trim();
  if (!cleanSubject || !cleanDetails) {
    return res.status(400).json({ error: 'Please include a short title and description of your issue.' });
  }
  const now = new Date().toISOString();
  const id = `SUP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const caseNumber = `CASE-${new Date().getFullYear()}-${String(db.supportCases.size + 1001)}`;
  const item = {
    id,
    caseNumber,
    userId: ctx.userId,
    tenantId: ctx.tenantId,
    category: String(category || 'GENERAL_HELP').replace(/[<>]/g, ''),
    subject: cleanSubject,
    details: cleanDetails,
    status: 'OPEN' as const,
    createdAt: now,
    updatedAt: now,
    history: [
      {
        status: 'OPEN' as const,
        timestamp: now,
        actorId: ctx.userId,
        actorRole: ctx.role,
        note: 'Support request created by participant.',
      },
    ],
  };
  db.supportCases.set(id, item);
  db.scheduleSave();
  return res.status(201).json({ case: item });
});

const handleSupportTransition = (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const existing = db.supportCases.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Support case not found.' });
  }
  if (!ctx.isPlatformAdmin && existing.userId !== ctx.userId) {
    recordV15SecurityIncident(
      'CROSS_TENANT_ACCESS',
      'MEDIUM',
      ctx.tenantId,
      ctx.userId,
      `Unauthorized support case status attempt on ${existing.id}`
    );
    return res.status(403).json({ error: 'You do not have permission to update this support case.' });
  }
  const { targetStatus, resolutionNote } = req.body || {};
  const nextStatus = String(targetStatus || '').toUpperCase() as 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  if (!['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].includes(nextStatus)) {
    return res.status(400).json({ error: 'targetStatus must be OPEN, IN_REVIEW, RESOLVED, or CLOSED.' });
  }
  if ((nextStatus === 'IN_REVIEW' || nextStatus === 'RESOLVED') && !ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'Only authorized support reviewers or administrators may move cases to IN_REVIEW or RESOLVED.' });
  }
  if (existing.status === 'CLOSED' && nextStatus !== 'CLOSED') {
    return res.status(409).json({ error: 'Closed support cases cannot transition back without opening a follow-up ticket.' });
  }

  const now = new Date().toISOString();
  const cleanNote = resolutionNote ? String(resolutionNote).replace(/[<>]/g, '').trim() : undefined;
  const history = Array.isArray(existing.history) ? [...existing.history] : [];
  history.push({
    status: nextStatus,
    timestamp: now,
    actorId: ctx.userId,
    actorRole: ctx.role,
    note: cleanNote || `Status updated to ${nextStatus}.`,
  });

  const updated = {
    ...existing,
    status: nextStatus,
    updatedAt: now,
    assignedReviewerId: ctx.isPlatformAdmin ? ctx.userId : existing.assignedReviewerId,
    resolutionNote: cleanNote || existing.resolutionNote,
    history,
  };
  db.supportCases.set(existing.id, updated);

  // Notify case owner transparently
  const notifId = `notif_sup_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
  db.notifications.set(notifId, {
    id: notifId,
    userId: existing.userId,
    title: `Support Case ${existing.caseNumber}: ${nextStatus.replace(/_/g, ' ')}`,
    body: cleanNote || `Your support request "${existing.subject}" is now ${nextStatus.replace(/_/g, ' ').toLowerCase()}.`,
    type: 'SYSTEM',
    channel: 'IN_APP',
    read: false,
    timestamp: now,
  });

  db.scheduleSave();
  return res.json({ case: updated });
};

v15Router.patch('/support/:id/status', handleSupportTransition);
v15Router.post('/support/:id/status', handleSupportTransition);

// ==========================================
// 7. V15.9 SERVER-SIDE EXPERIENCE MODE RBAC & MULTILINGUAL REVIEW WORKFLOW
// ==========================================

function canRoleUseExperienceMode(targetMode: string, role: string): boolean {
  if (targetMode === 'ADMINISTRATOR') return role === 'PLATFORM_ADMIN';
  if (targetMode === 'PROFESSIONAL') {
    return ['PLATFORM_ADMIN', 'COOPERATIVE_ADMIN', 'BUYER', 'TRANSPORTER'].includes(role);
  }
  return ['SIMPLE', 'STANDARD'].includes(targetMode);
}

v15Router.get('/experience-mode', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const stored = db.userExperienceModes.get(ctx.userId);
  const effectiveMode =
    stored && canRoleUseExperienceMode(stored.mode, ctx.role) ? stored.mode : 'SIMPLE';
  return res.json({
    userId: ctx.userId,
    role: ctx.role,
    mode: effectiveMode,
    allowedModes: (['SIMPLE', 'STANDARD', 'PROFESSIONAL', 'ADMINISTRATOR'] as const).filter((m) =>
      canRoleUseExperienceMode(m, ctx.role)
    ),
    updatedAt: stored?.updatedAt || null,
  });
});

v15Router.post('/experience-mode', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const targetMode = String(req.body?.mode || '').toUpperCase();
  if (!['SIMPLE', 'STANDARD', 'PROFESSIONAL', 'ADMINISTRATOR'].includes(targetMode)) {
    return res.status(400).json({ error: 'mode must be SIMPLE, STANDARD, PROFESSIONAL, or ADMINISTRATOR.' });
  }
  if (!canRoleUseExperienceMode(targetMode, ctx.role)) {
    recordV15SecurityIncident(
      'RBAC_PRIVILEGE_ESCALATION',
      'HIGH',
      ctx.tenantId,
      ctx.userId,
      `Blocked unauthorized experience mode elevation to ${targetMode} by role ${ctx.role}`
    );
    return res.status(403).json({
      error: 'EXPERIENCE_MODE_FORBIDDEN',
      message: `Account role ${ctx.role} is not permitted to activate ${targetMode} mode.`,
    });
  }
  const now = new Date().toISOString();
  const record = {
    userId: ctx.userId,
    mode: targetMode as 'SIMPLE' | 'STANDARD' | 'PROFESSIONAL' | 'ADMINISTRATOR',
    updatedAt: now,
    updatedBy: ctx.userId,
  };
  db.userExperienceModes.set(ctx.userId, record);
  db.scheduleSave();
  return res.json({
    ok: true,
    userId: ctx.userId,
    role: ctx.role,
    mode: record.mode,
    updatedAt: now,
  });
});

const DEFAULT_TRANSLATION_PACKS = [
  { langCode: 'en', name: 'English', nativeName: 'English', regionFocus: 'Uganda & International', completenessPct: 100, status: 'APPROVED' as const, reviewedLegalFinancial: true, reviewerId: 'SYSTEM_BASE', reviewerName: 'ECONEX Base Release', notes: 'Canonical baseline English text.' },
  { langCode: 'lg', name: 'Luganda', nativeName: 'Oluganda', regionFocus: 'Central Uganda', completenessPct: 100, status: 'PENDING_REVIEW' as const, reviewedLegalFinancial: false, notes: 'UI navigation and marketplace strings populated; awaiting certified legal/financial translation sign-off.' },
  { langCode: 'sw', name: 'Swahili', nativeName: 'Kiswahili', regionFocus: 'East African Community', completenessPct: 100, status: 'PENDING_REVIEW' as const, reviewedLegalFinancial: false, notes: 'UI navigation and marketplace strings populated; awaiting certified legal/financial translation sign-off.' },
  { langCode: 'nyn', name: 'Runyankole', nativeName: 'Runyankore-Rukiga', regionFocus: 'Western Uganda', completenessPct: 100, status: 'PENDING_REVIEW' as const, reviewedLegalFinancial: false, notes: 'UI navigation and marketplace strings populated; awaiting certified legal/financial translation sign-off.' },
  { langCode: 'ach', name: 'Acholi', nativeName: 'Lwo (Acholi)', regionFocus: 'Northern Uganda', completenessPct: 100, status: 'PENDING_REVIEW' as const, reviewedLegalFinancial: false, notes: 'UI navigation and marketplace strings populated; awaiting certified legal/financial translation sign-off.' },
  { langCode: 'teo', name: 'Ateso', nativeName: 'Ateso', regionFocus: 'Eastern Uganda (Teso)', completenessPct: 100, status: 'PENDING_REVIEW' as const, reviewedLegalFinancial: false, notes: 'UI navigation and marketplace strings populated; awaiting certified legal/financial translation sign-off.' },
  { langCode: 'xog', name: 'Lusoga', nativeName: 'Olusoga', regionFocus: 'Busoga Sub-region', completenessPct: 100, status: 'PENDING_REVIEW' as const, reviewedLegalFinancial: false, notes: 'UI navigation and marketplace strings populated; awaiting certified legal/financial translation sign-off.' },
];

function ensureTranslationReviewsSeeded() {
  for (const pack of DEFAULT_TRANSLATION_PACKS) {
    if (!db.translationReviews.has(pack.langCode)) {
      db.translationReviews.set(pack.langCode, { ...pack });
    }
  }
}

v15Router.get('/translations/reviews', (_req: Request, res: Response) => {
  ensureTranslationReviewsSeeded();
  return res.json({
    product: 'ECONEX',
    legalSafetyPolicy: 'Unreviewed local language packs automatically display verified English for payment confirmations and legal terms.',
    reviews: Array.from(db.translationReviews.values()),
  });
});

v15Router.post('/translations/reviews/:code/approve', requirePlatformAdmin, (req: Request, res: Response) => {
  ensureTranslationReviewsSeeded();
  const ctx = getCtx(req);
  const code = String(req.params.code || '').toLowerCase().trim();
  const existing = db.translationReviews.get(code);
  if (!existing) {
    return res.status(404).json({ error: `Language pack '${code}' not found.` });
  }
  const { status, reviewedLegalFinancial, reviewerName, notes } = req.body || {};
  const reviewer = db.users.get(ctx.userId);
  const nextStatus = status && ['APPROVED', 'PENDING_REVIEW', 'NEEDS_CHANGES'].includes(status) ? status : 'APPROVED';
  const now = new Date().toISOString();

  const updated = {
    ...existing,
    status: nextStatus as 'APPROVED' | 'PENDING_REVIEW' | 'NEEDS_CHANGES',
    reviewedLegalFinancial: nextStatus === 'APPROVED' ? Boolean(reviewedLegalFinancial ?? true) : false,
    reviewerId: ctx.userId,
    reviewerName: String(reviewerName || reviewer?.name || 'Platform Language Reviewer').replace(/[<>]/g, ''),
    reviewedAt: now,
    notes: notes ? String(notes).replace(/[<>]/g, '').trim() : existing.notes,
  };
  db.translationReviews.set(code, updated);
  db.scheduleSave();
  return res.json({ review: updated });
});
