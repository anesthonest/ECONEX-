/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V24.0 - Universal Commerce, Supply Chain & Economic Execution Network Router (/api/v24/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { runV24AiCommerceAssist } from './gemini.ts';
import {
  V24ActorCtx,
  V24HttpError,
  V24_AGREEMENT_TYPES,
  V24_DOCUMENT_TYPES,
  V24_LISTING_TYPES,
  V24_ORDER_TYPES,
  adjustV24Inventory,
  appealV24TrustReview,
  appendV24Audit,
  approveV24ProcurementRequest,
  cleanV24Text,
  createV24Agreement,
  createV24Document,
  createV24DocumentShare,
  createV24Listing,
  createV24Order,
  createV24ProcurementRequest,
  createV24ProductionOrder,
  createV24Project,
  createV24PurchaseOrder,
  createV24Rfq,
  createV24Shipment,
  decideV24Quotation,
  executeV24ProductionBatch,
  findParticipantForUser,
  getV24IntelligenceSummary,
  getV24ReadinessMatrix,
  isAuthorizedRep,
  payV24ObligationViaV23,
  performV24ThreeWayMatch,
  postV24NegotiationMessage,
  receiveV24Inventory,
  reconcileV24Inventory,
  refundV24ObligationViaV23,
  registerV24Participant,
  releaseExpiredV24Reservations,
  runV24PostgresDryRunAudit,
  sha256V24,
  submitV24Quotation,
  submitV24TrustReview,
  sweepExpiredV24Listings,
  syncV24OfflineDraft,
  transitionV24Agreement,
  transitionV24Milestone,
  transitionV24Order,
  transitionV24Shipment,
  uidV24,
} from './v24Engine.ts';
import type { UserRole, V24ApiClientCredential, V24SavedSearch, V24WebhookDelivery } from '../types/index.ts';

export const v24Router = Router();

function resolveV24Actor(req: Request): { userId?: string; role: UserRole; isPlatformAdmin: boolean } {
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
  const validRoles: UserRole[] = [
    'FARMER',
    'BUYER',
    'AGRO_DEALER',
    'COOPERATIVE_ADMIN',
    'TRANSPORTER',
    'PLATFORM_ADMIN',
  ];
  const finalRole: UserRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'BUYER';
  return { userId, role: finalRole, isPlatformAdmin: finalRole === 'PLATFORM_ADMIN' };
}

function requireV24Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV24Actor(req);
  if (!actor.userId) {
    return res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: 'Authenticated user credentials required.' });
  }
  const headerTenant = ((req.headers['x-tenant-id'] as string | undefined) || 'TEN-UG-ELGON-01').trim();
  const queryTenant = typeof req.query.tenantId === 'string' ? req.query.tenantId.trim() : '';
  const bodyTenant = typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim() : '';
  const requestedTenant = queryTenant || bodyTenant;
  if (requestedTenant && requestedTenant !== headerTenant && !actor.isPlatformAdmin) {
    return res.status(403).json({
      error: 'TENANT_BOUNDARY_MISMATCH',
      message: `Cross-tenant access denied between header '${headerTenant}' and requested '${requestedTenant}'.`,
    });
  }
  (req as any).v24Ctx = {
    tenantId: headerTenant,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies V24ActorCtx;
  return next();
}

function handleErr(res: Response, err: unknown) {
  if (err instanceof V24HttpError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  const msg = err instanceof Error ? err.message : String(err);
  return res.status(400).json({ error: msg });
}

// ==========================================
// PUBLIC HEALTH, OPENAPI 3.1, READINESS & TAXONOMY
// ==========================================

v24Router.get('/health', (_req: Request, res: Response) => {
  const fin = db.getFinancialIntegrityReport();
  const invRec = reconcileV24Inventory();
  return res.json({
    status: 'HEALTHY',
    product: 'ECONEX',
    release: 'V24.0-UNIVERSAL-COMMERCE-EXECUTION',
    schemaVersion: db.schemaVersion,
    sectorsCount: db.v24Sectors.size,
    corridorsCount: db.v24Corridors.size,
    participantsCount: db.v24Participants.size,
    ordersCount: db.v24Orders.size,
    obligationsCount: db.v24Obligations.size,
    journalBalanced: fin.journalBalanced,
    inventoryBalanced: invRec.balanced,
    externalIntegrationsLive: false,
    postgresqlCutoverComplete: false,
    realValueWalletLive: false,
    sandboxOnly: true,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    timestamp: new Date().toISOString(),
  });
});

v24Router.get('/openapi.json', (_req: Request, res: Response) => {
  return res.json({
    openapi: '3.1.0',
    info: {
      title: 'ECONEX V24.0 Universal Commerce, Supply Chain & Economic Execution Network API',
      version: '24.0.0',
      description: 'Multi-sector commercial operations, ATP warehousing, procurement SoD, BOM manufacturing, corridor logistics, and V23 sandbox obligation settlements.',
    },
    servers: [{ url: '/api/v24' }],
    paths: {
      '/health': { get: { summary: 'V24 System Health & Ledger Invariants' } },
      '/readiness-matrix': { get: { summary: 'Truthful Engineering vs Live Operational Flags' } },
      '/sectors': { get: { summary: '30 Universal Economic Sector Classifications' } },
      '/corridors': { get: { summary: '5 EAC & AfCFTA Cross-Border Corridor Guides' } },
      '/participants': { get: { summary: 'List Commercial Participants' }, post: { summary: 'Register Participant' } },
      '/listings': { get: { summary: 'Search Multi-Sector Listings' }, post: { summary: 'Publish Listing' } },
      '/rfqs': { get: { summary: 'List RFQs' }, post: { summary: 'Create Public/Invited RFQ' } },
      '/quotations': { get: { summary: 'List Quotations' }, post: { summary: 'Submit Revisioned Quotation' } },
      '/agreements': { get: { summary: 'List Agreements' }, post: { summary: 'Draft Agreement' } },
      '/orders': { get: { summary: 'List 18-State Orders' }, post: { summary: 'Place Order & Reserve ATP' } },
      '/orders/{id}/transition': { post: { summary: 'Advance Order State Machine' } },
      '/warehouses': { get: { summary: 'List Warehouses' } },
      '/inventory': { get: { summary: 'List ATP Inventory' } },
      '/procurement': { get: { summary: 'Procurement Requests (Requester != Approver SoD)' } },
      '/purchase-orders/{id}/three-way-match': { post: { summary: 'Perform PO/GRN/Invoice 3-Way Match' } },
      '/production-orders': { get: { summary: 'List BOM Production Orders' }, post: { summary: 'Create Production Order' } },
      '/shipments': { get: { summary: 'List Shipments (gpsClaimed: false)' }, post: { summary: 'Book Shipment' } },
      '/documents': { get: { summary: 'List 14-Type Commercial Documents' }, post: { summary: 'Issue Commercial Document' } },
      '/obligations': { get: { summary: 'List Payment Obligations' } },
      '/obligations/{id}/pay': { post: { summary: 'Settle Obligation via V23 Sandbox Wallet Engine' } },
      '/obligations/{id}/refund': { post: { summary: 'Reverse/Refund via V23 Engine' } },
      '/projects': { get: { summary: 'List Milestone Projects' }, post: { summary: 'Create Project' } },
      '/reviews': { get: { summary: 'Verified-Transaction Trust Reviews' } },
      '/ai/assist': { post: { summary: 'Human-Governed AI Commerce Assistant' } },
    },
  });
});

v24Router.get('/readiness-matrix', (_req: Request, res: Response) => {
  return res.json(getV24ReadinessMatrix());
});

v24Router.get('/sectors', (_req: Request, res: Response) => {
  const sectors = Array.from(db.v24Sectors.values());
  return res.json({ sectors, totalCount: sectors.length });
});

v24Router.get('/corridors', (_req: Request, res: Response) => {
  const corridors = Array.from(db.v24Corridors.values());
  return res.json({ corridors, customsClearanceClaimed: false });
});

v24Router.get('/listings', (req: Request, res: Response) => {
  const keyword = cleanV24Text(req.query.keyword || req.query.q || '').toLowerCase();
  const sectorId = cleanV24Text(req.query.sectorId || '');
  const countryCode = cleanV24Text(req.query.countryCode || '').toUpperCase();
  const listingType = cleanV24Text(req.query.listingType || '').toUpperCase();
  const verifiedOnly = String(req.query.verifiedOnly || '') === 'true';
  const deliveryOnly = String(req.query.deliveryAvailable || '') === 'true';
  const maxPriceMinor = req.query.maxPriceMinor ? Number(req.query.maxPriceMinor) : undefined;

  const listings = Array.from(db.v24Listings.values()).filter((l) => {
    if (l.status !== 'ACTIVE') return false;
    if (sectorId && l.sectorId !== sectorId) return false;
    if (countryCode && l.countryCode !== countryCode) return false;
    if (listingType && l.listingType !== listingType) return false;
    if (verifiedOnly && l.verificationStatus !== 'VERIFIED') return false;
    if (deliveryOnly && !l.deliveryAvailable) return false;
    if (maxPriceMinor && Number.isFinite(maxPriceMinor) && l.priceMinor > maxPriceMinor) return false;
    if (
      keyword &&
      !l.title.toLowerCase().includes(keyword) &&
      !l.description.toLowerCase().includes(keyword) &&
      !l.location.toLowerCase().includes(keyword)
    ) {
      return false;
    }
    return true;
  });

  return res.json({ listings, supportedListingTypes: V24_LISTING_TYPES });
});

v24Router.get('/documents/shared/:token', (req: Request, res: Response) => {
  const share = db.v24DocumentShares.get(req.params.token);
  if (!share || new Date(share.expiresAt).getTime() <= Date.now()) {
    return res.status(404).json({ error: 'SHARE_TOKEN_INVALID' });
  }
  const document = db.v24Documents.get(share.documentId);
  if (!document) return res.status(404).json({ error: 'SHARE_TOKEN_INVALID' });
  return res.json({ document, share });
});

// ==========================================
// AUTHENTICATED COMMERCE & EXECUTION ROUTES
// ==========================================

v24Router.use(requireV24Context);

v24Router.get('/participants', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const sectorId = cleanV24Text(req.query.sectorId || '');
  const countryCode = cleanV24Text(req.query.countryCode || '').toUpperCase();
  const organizationType = cleanV24Text(req.query.organizationType || '').toUpperCase();
  const verificationStatus = cleanV24Text(req.query.verificationStatus || '').toUpperCase();

  const participants = Array.from(db.v24Participants.values()).filter((p) => {
    if (!ctx.isPlatformAdmin && p.tenantId !== ctx.tenantId) return false;
    if (sectorId && !p.sectorIds.includes(sectorId)) return false;
    if (countryCode && !p.operatingCountries.includes(countryCode)) return false;
    if (organizationType && p.organizationType !== organizationType) return false;
    if (verificationStatus && p.verificationStatus !== verificationStatus) return false;
    return true;
  });
  return res.json({ participants });
});

v24Router.post('/participants', (req: Request, res: Response) => {
  try {
    const participant = registerV24Participant(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ participant });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/listings', (req: Request, res: Response) => {
  try {
    const listing = createV24Listing(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ listing });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/listings/expire', (req: Request, res: Response) => {
  const expiredCount = sweepExpiredV24Listings((req as any).v24Ctx);
  return res.json({ expiredCount });
});

v24Router.get('/saved-searches', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const savedSearches = Array.from(db.v24SavedSearches.values()).filter(
    (s) => s.tenantId === ctx.tenantId && s.userId === ctx.userId
  );
  return res.json({ savedSearches });
});

v24Router.post('/saved-searches', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const b = req.body || {};
  const ss: V24SavedSearch = {
    id: uidV24('SRCH-V24'),
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    label: cleanV24Text(b.label || 'Saved Filter'),
    query: b.query || b.keyword ? cleanV24Text(b.query || b.keyword) : undefined,
    sectorId: b.sectorId ? cleanV24Text(b.sectorId) : undefined,
    countryCode: b.countryCode ? cleanV24Text(b.countryCode).toUpperCase() : undefined,
    listingType: b.listingType ? cleanV24Text(b.listingType) as any : undefined,
    maxPriceMinor: b.maxPriceMinor ? Number(b.maxPriceMinor) : undefined,
    createdAt: new Date().toISOString(),
  };
  db.v24SavedSearches.set(ss.id, ss);
  db.scheduleSave();
  return res.status(201).json({ savedSearch: ss });
});

v24Router.get('/rfqs', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const myPart = findParticipantForUser(ctx.userId);
  const rfqs = Array.from(db.v24Rfqs.values()).filter((r) => {
    if (!ctx.isPlatformAdmin && r.tenantId !== ctx.tenantId) return false;
    if (r.visibility === 'PUBLIC' || ctx.isPlatformAdmin) return true;
    return Boolean(myPart && (r.buyerParticipantId === myPart.id || r.invitedParticipantIds.includes(myPart.id)));
  });
  return res.json({ rfqs });
});

v24Router.post('/rfqs', (req: Request, res: Response) => {
  try {
    const rfq = createV24Rfq(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ rfq });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/quotations', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const rfqId = cleanV24Text(req.query.rfqId || '');
  const quotations = Array.from(db.v24Quotations.values()).filter((q) => {
    if (!ctx.isPlatformAdmin && q.tenantId !== ctx.tenantId) return false;
    if (rfqId && q.rfqId !== rfqId) return false;
    return true;
  });
  return res.json({ quotations });
});

v24Router.post('/quotations', (req: Request, res: Response) => {
  try {
    const quotation = submitV24Quotation(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ quotation });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/quotations/:id/decide', (req: Request, res: Response) => {
  try {
    const quotation = decideV24Quotation(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json({ quotation });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/negotiations', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const myPart = findParticipantForUser(ctx.userId);
  const negotiations = Array.from(db.v24Negotiations.values()).filter((t) => {
    if (ctx.isPlatformAdmin) return true;
    return Boolean(myPart && t.participantIds.includes(myPart.id));
  });
  return res.json({ negotiations });
});

v24Router.post('/negotiations/messages', (req: Request, res: Response) => {
  try {
    const out = postV24NegotiationMessage(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/agreements', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const agreements = Array.from(db.v24Agreements.values()).filter((a) => ctx.isPlatformAdmin || a.tenantId === ctx.tenantId);
  return res.json({ agreements, supportedAgreementTypes: V24_AGREEMENT_TYPES });
});

v24Router.post('/agreements', (req: Request, res: Response) => {
  try {
    const agreement = createV24Agreement(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ agreement });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/agreements/:id/transition', (req: Request, res: Response) => {
  try {
    const agreement = transitionV24Agreement(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json({ agreement });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/orders', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const orders = Array.from(db.v24Orders.values()).filter((o) => ctx.isPlatformAdmin || o.tenantId === ctx.tenantId);
  return res.json({ orders, supportedOrderTypes: V24_ORDER_TYPES });
});

v24Router.post('/orders', (req: Request, res: Response) => {
  try {
    const out = createV24Order(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/orders/:id/transition', (req: Request, res: Response) => {
  try {
    const order = transitionV24Order(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json({ order });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/warehouses', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const warehouses = Array.from(db.v24Warehouses.values()).filter((w) => ctx.isPlatformAdmin || w.tenantId === ctx.tenantId);
  return res.json({ warehouses });
});

v24Router.get('/inventory', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const whId = cleanV24Text(req.query.warehouseId || '');
  const items = Array.from(db.v24Inventory.values()).filter((i) => {
    if (!ctx.isPlatformAdmin && i.tenantId !== ctx.tenantId) return false;
    if (whId && i.warehouseId !== whId) return false;
    return true;
  });
  return res.json({ items });
});

v24Router.post('/inventory/receive', (req: Request, res: Response) => {
  try {
    const out = receiveV24Inventory(req.body || {}, (req as any).v24Ctx);
    return res.status(out.created ? 201 : 200).json({ item: out.item, movement: out.movement });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/inventory/adjust', (req: Request, res: Response) => {
  try {
    const out = adjustV24Inventory(req.body || {}, (req as any).v24Ctx);
    return res.json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/inventory/movements', (req: Request, res: Response) => {
  const itemId = cleanV24Text(req.query.inventoryItemId || '');
  const movements = Array.from(db.v24StockMovements.values()).filter((m) => (!itemId ? true : m.inventoryItemId === itemId));
  return res.json({ movements });
});

v24Router.post('/inventory/release-expired', (req: Request, res: Response) => {
  const releasedCount = releaseExpiredV24Reservations((req as any).v24Ctx);
  return res.json({ releasedCount });
});

v24Router.get('/inventory/reconcile', (_req: Request, res: Response) => {
  return res.json(reconcileV24Inventory());
});

v24Router.get('/procurement', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const requests = Array.from(db.v24ProcurementRequests.values()).filter((r) => ctx.isPlatformAdmin || r.tenantId === ctx.tenantId);
  return res.json({ requests });
});

v24Router.post('/procurement', (req: Request, res: Response) => {
  try {
    const request = createV24ProcurementRequest(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ request });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/procurement/:id/approve', (req: Request, res: Response) => {
  try {
    const request = approveV24ProcurementRequest(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json({ request });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/purchase-orders', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const purchaseOrders = Array.from(db.v24PurchaseOrders.values()).filter((p) => ctx.isPlatformAdmin || p.tenantId === ctx.tenantId);
  return res.json({ purchaseOrders });
});

v24Router.post('/purchase-orders', (req: Request, res: Response) => {
  try {
    const purchaseOrder = createV24PurchaseOrder(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ purchaseOrder });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/purchase-orders/:id/three-way-match', (req: Request, res: Response) => {
  try {
    const result = performV24ThreeWayMatch(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json(result);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/boms', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const boms = Array.from(db.v24Boms.values()).filter((b) => ctx.isPlatformAdmin || b.tenantId === ctx.tenantId);
  return res.json({ boms });
});

v24Router.get('/production-orders', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const productionOrders = Array.from(db.v24ProductionOrders.values()).filter((p) => ctx.isPlatformAdmin || p.tenantId === ctx.tenantId);
  return res.json({ productionOrders });
});

v24Router.post('/production-orders', (req: Request, res: Response) => {
  try {
    const out = createV24ProductionOrder(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/production-orders/:id/execute', (req: Request, res: Response) => {
  try {
    const out = executeV24ProductionBatch(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/shipments', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const shipments = Array.from(db.v24Shipments.values()).filter((s) => ctx.isPlatformAdmin || s.tenantId === ctx.tenantId);
  return res.json({ shipments });
});

v24Router.post('/shipments', (req: Request, res: Response) => {
  try {
    const shipment = createV24Shipment(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ shipment });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/shipments/:id/transition', (req: Request, res: Response) => {
  try {
    const shipment = transitionV24Shipment(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json({ shipment });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/documents', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const documents = Array.from(db.v24Documents.values()).filter((d) => ctx.isPlatformAdmin || d.tenantId === ctx.tenantId);
  return res.json({ documents, supportedDocumentTypes: V24_DOCUMENT_TYPES });
});

v24Router.post('/documents', (req: Request, res: Response) => {
  try {
    const document = createV24Document(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ document });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/documents/:id/share', (req: Request, res: Response) => {
  try {
    const out = createV24DocumentShare(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.status(201).json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/obligations', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const obligations = Array.from(db.v24Obligations.values()).filter((o) => ctx.isPlatformAdmin || o.tenantId === ctx.tenantId);
  return res.json({ obligations, sandboxOnly: true });
});

v24Router.post('/obligations/:id/pay', (req: Request, res: Response) => {
  try {
    const out = payV24ObligationViaV23(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/obligations/:id/refund', (req: Request, res: Response) => {
  try {
    const out = refundV24ObligationViaV23(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/projects', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const projects = Array.from(db.v24Projects.values()).filter((p) => ctx.isPlatformAdmin || p.tenantId === ctx.tenantId);
  return res.json({ projects });
});

v24Router.post('/projects', (req: Request, res: Response) => {
  try {
    const project = createV24Project(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ project });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/projects/:id/milestones/:mid/transition', (req: Request, res: Response) => {
  try {
    const out = transitionV24Milestone(req.params.id, req.params.mid, req.body || {}, (req as any).v24Ctx);
    return res.json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/reviews', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const reviews = Array.from(db.v24Reviews.values()).filter((r) => ctx.isPlatformAdmin || r.tenantId === ctx.tenantId);
  return res.json({ reviews });
});

v24Router.post('/reviews', (req: Request, res: Response) => {
  try {
    const review = submitV24TrustReview(req.body || {}, (req as any).v24Ctx);
    return res.status(201).json({ review });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.post('/reviews/:id/appeal', (req: Request, res: Response) => {
  try {
    const review = appealV24TrustReview(req.params.id, req.body || {}, (req as any).v24Ctx);
    return res.json({ review });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/trust/:participantId', (req: Request, res: Response) => {
  const p = db.v24Participants.get(req.params.participantId);
  if (!p) return res.status(404).json({ error: 'PARTICIPANT_NOT_FOUND' });
  const reviews = Array.from(db.v24Reviews.values()).filter(
    (r) => r.subjectParticipantId === p.id && r.appealStatus !== 'REMOVED'
  );
  const avgRating =
    reviews.length > 0 ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)) : 5;
  return res.json({
    profile: {
      participantId: p.id,
      displayName: p.displayName,
      verificationStatus: p.verificationStatus,
      identityVerificationStatus: p.identityVerificationStatus,
      legalRegistrationStatus: p.legalRegistrationStatus,
      operationalCapabilityStatus: p.operationalCapabilityStatus,
      completedOrdersCount: p.completedOrdersCount,
      onTimeDeliveryRatePct: p.onTimeDeliveryRatePct,
      disputeCount: p.disputeCount,
      averageRating: avgRating,
      reviewsCount: reviews.length,
      paidBadgesForbidden: true,
    },
    reviews,
  });
});

v24Router.get('/threads', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const threads = Array.from(db.v24Threads.values()).filter((t) => ctx.isPlatformAdmin || t.tenantId === ctx.tenantId);
  return res.json({ threads });
});

v24Router.post('/threads/:id/messages', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const thr = db.v24Threads.get(req.params.id);
  if (!thr) return res.status(404).json({ error: 'THREAD_NOT_FOUND' });
  const myPart = findParticipantForUser(ctx.userId);
  if (!ctx.isPlatformAdmin && myPart && thr.blockedParticipantIds.includes(myPart.id)) {
    return res.status(403).json({ error: 'PARTICIPANT_BLOCKED_IN_THREAD' });
  }
  const msgBody = cleanV24Text(req.body?.body || '');
  if (!msgBody) return res.status(400).json({ error: 'MESSAGE_BODY_REQUIRED' });

  const now = new Date().toISOString();
  const msg = {
    id: uidV24('TMSG'),
    senderParticipantId: myPart?.id || ctx.userId,
    senderUserId: ctx.userId,
    body: msgBody,
    createdAt: now,
  };
  thr.messages.push(msg);
  thr.updatedAt = now;
  db.v24Threads.set(thr.id, thr);
  db.scheduleSave();
  return res.status(201).json({ thread: thr, message: msg });
});

v24Router.post('/threads/:id/moderate', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const thr = db.v24Threads.get(req.params.id);
  if (!thr) return res.status(404).json({ error: 'THREAD_NOT_FOUND' });
  const myPart = findParticipantForUser(ctx.userId);
  const blockTarget =
    cleanV24Text(req.body?.targetParticipantId) ||
    thr.participantIds.find((pid) => pid !== myPart?.id) ||
    'PRTC-V24-002';

  if (req.body?.block !== false) {
    if (!thr.blockedParticipantIds.includes(blockTarget)) {
      thr.blockedParticipantIds.push(blockTarget);
    }
  } else {
    thr.blockedParticipantIds = thr.blockedParticipantIds.filter((pid) => pid !== blockTarget);
  }
  thr.updatedAt = new Date().toISOString();
  db.v24Threads.set(thr.id, thr);
  db.scheduleSave();
  return res.json({ thread: thr });
});

v24Router.get('/search', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const q = cleanV24Text(req.query.q || '').toLowerCase();
  const myPart = findParticipantForUser(ctx.userId);

  const listings = Array.from(db.v24Listings.values()).filter(
    (l) => l.status === 'ACTIVE' && (!q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
  );
  const orders = Array.from(db.v24Orders.values()).filter((o) => {
    const acl =
      ctx.isPlatformAdmin ||
      (myPart && (o.buyerParticipantId === myPart.id || o.sellerParticipantId === myPart.id));
    if (!acl) return false;
    return !q || o.orderNumber.toLowerCase().includes(q) || o.items.some((it) => it.title.toLowerCase().includes(q));
  });
  const documents = Array.from(db.v24Documents.values()).filter((d) => {
    const acl =
      ctx.isPlatformAdmin ||
      (myPart && (d.issuingParticipantId === myPart.id || d.receivingParticipantId === myPart.id));
    if (!acl) return false;
    return !q || d.documentNumber.toLowerCase().includes(q) || d.lineItems.some((l) => l.description.toLowerCase().includes(q));
  });
  const projects = Array.from(db.v24Projects.values()).filter((p) => {
    const acl =
      ctx.isPlatformAdmin ||
      (myPart && (p.clientParticipantId === myPart.id || p.contractorParticipantId === myPart.id));
    if (!acl) return false;
    return !q || p.title.toLowerCase().includes(q) || p.scope.toLowerCase().includes(q);
  });
  const inventory = Array.from(db.v24Inventory.values()).filter((i) => {
    const acl = ctx.isPlatformAdmin || (myPart && i.ownerParticipantId === myPart.id);
    if (!acl) return false;
    return !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
  });

  return res.json({ query: q, listings, orders, documents, projects, inventory });
});

v24Router.get('/intelligence', (_req: Request, res: Response) => {
  return res.json(getV24IntelligenceSummary());
});

v24Router.post('/ai/assist', async (req: Request, res: Response) => {
  const b = req.body || {};
  const out = await runV24AiCommerceAssist({
    taskType: cleanV24Text(b.taskType || 'BUSINESS_SUMMARY'),
    prompt: String(b.prompt || ''),
    targetLocale: b.targetLocale ? cleanV24Text(b.targetLocale) : undefined,
    requestedAutonomousAction: b.requestedAutonomousAction ? cleanV24Text(b.requestedAutonomousAction) : undefined,
    contextData: typeof b.contextData === 'object' && b.contextData !== null ? b.contextData : {},
  });
  return res.status(out.statusCode).json(out.result);
});

v24Router.get('/api-credentials', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const credentials = Array.from(db.v24ApiCredentials.values()).filter(
    (c) => ctx.isPlatformAdmin || c.tenantId === ctx.tenantId
  );
  return res.json({ credentials });
});

v24Router.post('/api-credentials', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const b = req.body || {};
  const orgId = cleanV24Text(b.organizationParticipantId) || findParticipantForUser(ctx.userId)?.id || 'PRTC-V24-002';
  const org = db.v24Participants.get(orgId);
  if (!org || (!isAuthorizedRep(org, ctx) && !ctx.isPlatformAdmin)) {
    return res.status(403).json({ error: 'UNAUTHORIZED_CREDENTIAL_ISSUER' });
  }
  const rawToken = `ecx_sbx_${crypto.randomBytes(12).toString('hex')}`;
  const cred: V24ApiClientCredential = {
    id: uidV24('CRED-V24'),
    tenantId: ctx.tenantId,
    organizationParticipantId: org.id,
    label: cleanV24Text(b.label || 'Sandbox ERP Client'),
    keyPrefix: rawToken.slice(0, 12),
    keyHashSha256: sha256V24(rawToken),
    scopes: Array.isArray(b.scopes) && b.scopes.length ? b.scopes.map((s: any) => cleanV24Text(s)) : ['orders:read'],
    environment: 'SANDBOX',
    status: 'ACTIVE',
    createdByUserId: ctx.userId,
    createdAt: new Date().toISOString(),
  };
  db.v24ApiCredentials.set(cred.id, cred);
  db.scheduleSave();
  return res.status(201).json({ credential: cred, oneTimeToken: rawToken });
});

v24Router.delete('/api-credentials/:id', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const cred = db.v24ApiCredentials.get(req.params.id);
  if (!cred) return res.status(404).json({ error: 'CREDENTIAL_NOT_FOUND' });
  const org = db.v24Participants.get(cred.organizationParticipantId);
  if (!ctx.isPlatformAdmin && cred.createdByUserId !== ctx.userId && !(org && isAuthorizedRep(org, ctx))) {
    return res.status(403).json({ error: 'CREDENTIAL_REVOKE_DENIED' });
  }
  cred.status = 'REVOKED';
  cred.revokedAt = new Date().toISOString();
  db.v24ApiCredentials.set(cred.id, cred);
  db.scheduleSave();
  return res.json({ credential: cred });
});

v24Router.get('/webhooks', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const webhooks = Array.from(db.v24Webhooks.values()).filter((w) => ctx.isPlatformAdmin || w.tenantId === ctx.tenantId);
  const deliveries = Array.from(db.v24WebhookDeliveries.values());
  return res.json({ webhooks, deliveries });
});

v24Router.post('/webhooks/deliver', (req: Request, res: Response) => {
  const b = req.body || {};
  const sub = db.v24Webhooks.get(cleanV24Text(b.subscriptionId));
  if (!sub) return res.status(404).json({ error: 'WEBHOOK_SUBSCRIPTION_NOT_FOUND' });
  if (sub.adapterState === 'NOT_CONFIGURED' || sub.adapterState === 'PAUSED') {
    return res.status(400).json({ error: `ADAPTER_STATE_${sub.adapterState}_BLOCKS_DELIVERY` });
  }
  const idem = cleanV24Text(b.idempotencyKey || uidV24('WHK-IDEM'));
  const existing = Array.from(db.v24WebhookDeliveries.values()).find(
    (d) => d.subscriptionId === sub.id && d.idempotencyKey === idem
  );
  if (existing) {
    return res.json({ delivery: existing, deduplicated: true });
  }

  const delivery: V24WebhookDelivery = {
    id: uidV24('DLV-V24'),
    subscriptionId: sub.id,
    eventType: cleanV24Text(b.eventType || 'v24.order.confirmed'),
    idempotencyKey: idem,
    payload: typeof b.payload === 'object' && b.payload !== null ? b.payload : {},
    signatureSha256: sha256V24(`${sub.id}|${idem}|${JSON.stringify(b.payload || {})}`),
    status: 'DELIVERED_SANDBOX',
    createdAt: new Date().toISOString(),
  };
  db.v24WebhookDeliveries.set(delivery.id, delivery);
  db.scheduleSave();
  return res.status(201).json({ delivery, deduplicated: false });
});

v24Router.post('/webhooks/:id/adapter-state', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  if (!ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'ADMIN_ROLE_REQUIRED' });
  }
  const sub = db.v24Webhooks.get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'WEBHOOK_SUBSCRIPTION_NOT_FOUND' });

  const nextState = cleanV24Text(req.body?.nextState).toUpperCase();
  if (nextState === 'LIVE_APPROVED') {
    return res.status(403).json({
      error: 'PRODUCTION_SIGN_OFF_REQUIRED: External integrations remain non-live in V24 sandbox build.',
    });
  }
  if (!['NOT_CONFIGURED', 'SANDBOX_ACTIVE', 'PAUSED'].includes(nextState)) {
    return res.status(400).json({ error: 'INVALID_ADAPTER_STATE' });
  }
  sub.adapterState = nextState as any;
  sub.updatedAt = new Date().toISOString();
  db.v24Webhooks.set(sub.id, sub);
  db.scheduleSave();
  return res.json({ webhook: sub });
});

v24Router.get('/offline-drafts', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const drafts = Array.from(db.v24OfflineDrafts.values()).filter(
    (d) => ctx.isPlatformAdmin || (d.tenantId === ctx.tenantId && d.userId === ctx.userId)
  );
  return res.json({ drafts });
});

v24Router.post('/offline-drafts/sync', (req: Request, res: Response) => {
  try {
    const draft = syncV24OfflineDraft(req.body || {}, (req as any).v24Ctx);
    return res.json({ draft });
  } catch (err) {
    return handleErr(res, err);
  }
});

v24Router.get('/audit', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  const events = Array.from(db.v24AuditEvents.values()).filter((e) => ctx.isPlatformAdmin || e.tenantId === ctx.tenantId);
  return res.json({ events });
});

v24Router.post('/postgres-audit', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'ADMIN_ROLE_REQUIRED' });
  const report = runV24PostgresDryRunAudit();
  appendV24Audit({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    action: 'SCHEMA_22_PG_DRY_RUN_AUDIT',
    targetType: 'DATABASE',
    targetId: report.id,
    summary: `Audited ${report.tablesAudited} Schema 22 PostgreSQL tables against JSON WAL.`,
  });
  return res.json({ report });
});

v24Router.get('/rollback-readiness', (req: Request, res: Response) => {
  const ctx: V24ActorCtx = (req as any).v24Ctx;
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'ADMIN_ROLE_REQUIRED' });
  return res.json(db.verifyV22MigrationCompleteness());
});
