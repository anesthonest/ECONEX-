/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Universal Economic Activity & Growth Engine REST API (/api/v22/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import { validateV21Environment } from './v21Config.ts';
import {
  V22_DISCLAIMER_AGREEMENT,
  V22_DISCLAIMER_NON_CUSTODIAL,
  V22_DISCLAIMER_PROCUREMENT,
  askV22EconomicAssistant,
  awardV22TenderBid,
  cleanV22Text,
  createV22BusinessProfile,
  createV22CommercialActivity,
  createV22IndividualProfile,
  createV22Invoice,
  createV22MarketplaceListing,
  createV22Project,
  createV22Sector,
  createV22Tender,
  maskSensitiveBusinessForViewer,
  recordV22ExternalPaymentReference,
  reportV22ListingOrEntity,
  runV22PostgresDryRunAudit,
  sha256V22,
  transitionV22ActivityStage,
  uidV22,
} from './v22Engine.ts';
import type {
  UserRole,
  V22EconomicRelationship,
  V22InteroperabilityEvent,
  V22ProcurementBid,
  V22WorkforceTask,
} from '../types/index.ts';

export const v22Router = Router();

interface V22Context {
  tenantId: string;
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
}

const rateBuckets = new Map<string, { count: number; windowStart: number }>();

function rateLimitV22(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const actorKey =
      (req.headers['x-user-id'] as string | undefined) ||
      (req.headers.authorization || '').slice(0, 24) ||
      req.ip ||
      'anon';
    const key = `${req.path}:${actorKey}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now - bucket.windowStart > windowMs) {
      rateBuckets.set(key, { count: 1, windowStart: now });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests in the current window. Please retry shortly.',
      });
    }
    bucket.count += 1;
    rateBuckets.set(key, bucket);
    return next();
  };
}

function resolveV22Actor(req: Request): { userId?: string; role: UserRole; isPlatformAdmin: boolean } {
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
  const finalRole: UserRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'BUYER';
  return {
    userId,
    role: finalRole,
    isPlatformAdmin: finalRole === 'PLATFORM_ADMIN',
  };
}

function requireV22Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV22Actor(req);
  if (!actor.userId) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V22 APIs.',
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
    return res.status(403).json({
      error: 'TENANT_BOUNDARY_VIOLATION',
      message: 'Cross-tenant request mismatch blocked.',
    });
  }

  (req as any).v22Ctx = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } as V22Context;
  return next();
}

function requireV22Admin(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as any).v22Ctx as V22Context;
  if (!ctx?.isPlatformAdmin) {
    return res.status(403).json({
      error: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Platform Administrator role is required for this V22 operation.',
    });
  }
  return next();
}

function scopeByTenant<T extends { tenantId: string }>(items: T[], ctx: V22Context): T[] {
  if (ctx.isPlatformAdmin && ctx.tenantId === 'GLOBAL_PUBLIC') return items;
  if (ctx.tenantId === 'GLOBAL_PUBLIC') return items;
  return items.filter((i) => i.tenantId === ctx.tenantId);
}

// ==========================================
// PUBLIC V22 HEALTH & OPENAPI 3.1 SPECIFICATION
// ==========================================

v22Router.get('/health', (_req: Request, res: Response) => {
  const envDiag = validateV21Environment();
  const migrationStatus = db.verifyV20MigrationCompleteness();
  res.json({
    status: 'HEALTHY',
    product: 'ECONEX',
    release: 'V22.0-UNIVERSAL-ECONOMIC-GROWTH',
    schemaVersion: db.schemaVersion,
    sectorsCount: db.v22Sectors.size,
    businessesCount: db.v22Businesses.size,
    individualsCount: db.v22Individuals.size,
    marketplaceItemsCount: db.v22MarketplaceItems.size,
    activitiesCount: db.v22Activities.size,
    databaseAuthority: envDiag.databaseAuthority,
    migrationComplete: migrationStatus.complete,
    developer: 'VINEXSAH TECHNOLOGIES',
    timestamp: new Date().toISOString(),
  });
});

v22Router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.1.0',
    info: {
      title: 'ECONEX V22.0 Universal Economic Activity & Growth API',
      version: '22.0.0',
      description: 'Universal multi-sector economic operating system APIs under VINEXSAH TECHNOLOGIES.',
    },
    servers: [{ url: '/api/v22' }],
    paths: {
      '/health': { get: { summary: 'V22 Universal Platform Health & Migration Status' } },
      '/overview': { get: { summary: 'Universal Executive & Multi-Sector Overview (Separated Metrics)' } },
      '/sectors': { get: { summary: 'List 28+ Economic Sectors' }, post: { summary: 'Add Custom Economic Sector (Admin)' } },
      '/businesses': { get: { summary: 'List Multi-Sector Businesses (Sensitive Sector Masking)' }, post: { summary: 'Create Business Profile' } },
      '/individuals': { get: { summary: 'List Independent Individuals/Artisans' }, post: { summary: 'Create Individual Profile' } },
      '/marketplace': { get: { summary: 'Search Marketplace 2.0 Goods, Services, Rentals & Digital Offers' }, post: { summary: 'Publish Universal Listing' } },
      '/marketplace/reports': { post: { summary: 'Submit Listing Fraud/Compliance Report' } },
      '/activities': { get: { summary: 'List Commercial Activities' }, post: { summary: 'Initiate Universal Commercial Activity' } },
      '/activities/{id}/transition': { post: { summary: 'Advance Commercial Stage with Cryptographic SHA-256 Agreement Lock' } },
      '/tenders': { get: { summary: 'List Private/Cooperative Procurement Opportunities' }, post: { summary: 'Publish RFQ/Tender' } },
      '/tenders/{id}/bids': { post: { summary: 'Submit Supplier Bid' } },
      '/tenders/{id}/award': { post: { summary: 'Evaluate & Award Procurement Bid (Human Justification Required)' } },
      '/projects': { get: { summary: 'List Milestone-Based Projects' }, post: { summary: 'Create Milestone Project' } },
      '/invoices': { get: { summary: 'List Invoices' }, post: { summary: 'Create Invoice with Tax Calculation & Double-Entry Ledger' } },
      '/payment-references': { post: { summary: 'Record Non-Custodial External Payment Reference' } },
      '/fx-rates': { get: { summary: 'List Extensible Multi-Currency FX Rates' }, post: { summary: 'Register/Update FX Rate (Admin)' } },
      '/intelligence/insights': { get: { summary: 'List Explainable Economic Growth Insights' } },
      '/intelligence/assistant': { post: { summary: 'Grounded AI Economic Assistant (Prompt-Injection Guarded)' } },
      '/interoperability/events': { post: { summary: 'HMAC-SHA256 Signed External Interoperability Webhook' } },
      '/postgres/dry-run': { post: { summary: 'Run Schema 20 PostgreSQL 16 Dry-Run Audit' } },
    },
  });
});

// Signed External Interoperability Event Webhook (HMAC-SHA256 + Replay Protection)
v22Router.post('/interoperability/events', (req: Request, res: Response) => {
  const sigHeader = String(req.headers['x-econex-signature'] || '').trim();
  const idemKey = cleanV22Text(req.body?.idempotencyKey || req.headers['x-idempotency-key']);
  const partnerId = cleanV22Text(req.body?.partnerId || 'PARTNER-EXT');
  const eventType = cleanV22Text(req.body?.eventType || 'EXTERNAL_SYNC');
  const tenantId = cleanV22Text(req.body?.tenantId || 'TEN-UG-ELGON-01');

  if (!idemKey) {
    return res.status(400).json({ error: 'IDEMPOTENCY_KEY_REQUIRED', message: 'idempotencyKey or x-idempotency-key is required.' });
  }
  const replay = Array.from(db.v22InteropEvents.values()).find((e) => e.idempotencyKey === idemKey);
  if (replay) {
    return res.status(409).json({ error: 'REPLAY_DETECTED', message: 'Duplicate event idempotencyKey rejected.', existingEventId: replay.id });
  }

  const secret = process.env.ECONEX_WEBHOOK_SECRET || 'ECONEX_V22_DEV_HMAC_KEY';
  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body || {})).digest('hex');
  if (sigHeader !== expected && sigHeader !== `sha256=${expected}`) {
    return res.status(401).json({ error: 'INVALID_HMAC_SIGNATURE', message: 'Valid HMAC-SHA256 x-econex-signature header required.' });
  }

  const evt: V22InteroperabilityEvent = {
    id: uidV22('IOE-V22'),
    tenantId,
    partnerId,
    eventType,
    idempotencyKey: idemKey,
    signatureValid: true,
    payloadSummary: cleanV22Text(JSON.stringify(req.body?.payload || {}).slice(0, 220)),
    receivedAt: new Date().toISOString(),
  };
  db.v22InteropEvents.set(evt.id, evt);
  db.scheduleSave();
  return res.status(201).json({ accepted: true, event: evt });
});

// All routes below require authenticated context
v22Router.use(requireV22Context);

// ==========================================
// OVERVIEW & SEPARATED KPI CLASSIFICATION
// ==========================================

v22Router.get('/overview', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const businesses = scopeByTenant(Array.from(db.v22Businesses.values()), ctx);
  const individuals = scopeByTenant(Array.from(db.v22Individuals.values()), ctx);
  const listings = scopeByTenant(Array.from(db.v22MarketplaceItems.values()), ctx);
  const activities = scopeByTenant(Array.from(db.v22Activities.values()), ctx);
  const tenders = scopeByTenant(Array.from(db.v22Tenders.values()), ctx);
  const projects = scopeByTenant(Array.from(db.v22Projects.values()), ctx);
  const invoices = scopeByTenant(Array.from(db.v22Invoices.values()), ctx);

  const actualActivities = activities.filter((a) => !a.isTestRecord);
  const testActivities = activities.filter((a) => a.isTestRecord);
  const totalInvoicedUgx = invoices
    .filter((i) => !i.isTestRecord)
    .reduce((sum, i) => sum + i.totalAmount * (i.exchangeRateToUgx || 1), 0);
  const totalPaidUgx = invoices
    .filter((i) => !i.isTestRecord)
    .reduce((sum, i) => sum + i.paidAmount * (i.exchangeRateToUgx || 1), 0);

  const fin = db.getFinancialIntegrityReport();
  const migration = db.verifyV20MigrationCompleteness();

  res.json({
    product: 'ECONEX',
    release: 'V22.0-UNIVERSAL-ECONOMIC-GROWTH',
    schemaVersion: db.schemaVersion,
    developer: 'VINEXSAH TECHNOLOGIES',
    viewer: { userId: ctx.userId, role: ctx.role, tenantId: ctx.tenantId },
    sectorsCount: db.v22Sectors.size,
    separatedMetrics: {
      actual: {
        classification: 'ACTUAL',
        registeredBusinesses: businesses.length,
        independentIndividuals: individuals.length,
        activeListings: listings.filter((l) => l.moderationStatus === 'ACTIVE').length,
        liveCommercialActivities: actualActivities.length,
        openTenders: tenders.filter((t) => t.status === 'OPEN').length,
        activeProjects: projects.filter((p) => p.status === 'ACTIVE').length,
        invoicedValueUgx: Math.round(totalInvoicedUgx),
        reconciledExternalPaymentsUgx: Math.round(totalPaidUgx),
        payingSubscribersCount: Array.from(db.v22Plans.values()).reduce((s, p) => s + p.activeSubscribersCount, 0),
      },
      testAndSimulation: {
        classification: 'TEST',
        testCommercialActivities: testActivities.length,
        sandboxPaymentObligations: Array.from(db.v20PaymentObligations.values()).filter((o) => o.isTestRecord).length,
      },
      externalStatusFlags: {
        classification: 'PENDING_EXTERNAL_SURVEY',
        V22_GITHUB_PUBLISHED: false,
        V22_POSTGRESQL_CUTOVER_COMPLETE: false,
        V22_EXTERNAL_INTEGRATIONS_LIVE: false,
        V22_HUMAN_FIELD_VALIDATION_COMPLETE: false,
        V22_PILOT_ACTIVE: false,
        V22_PRODUCTION_DEPLOYED: false,
      },
    },
    financialIntegrity: {
      journalBalanced: fin.journalBalanced,
      currencyIntegrityPassed: fin.currencyIntegrityPassed,
    },
    migrationComplete: migration.complete,
    disclaimers: {
      nonCustodial: V22_DISCLAIMER_NON_CUSTODIAL,
      nonOfficialProcurement: V22_DISCLAIMER_PROCUREMENT,
      agreement: V22_DISCLAIMER_AGREEMENT,
    },
  });
});

// ==========================================
// SECTORS
// ==========================================

v22Router.get('/sectors', (req: Request, res: Response) => {
  const group = cleanV22Text(req.query.categoryGroup);
  const q = cleanV22Text(req.query.q).toLowerCase();
  let list = Array.from(db.v22Sectors.values());
  if (group) list = list.filter((s) => s.categoryGroup === group);
  if (q) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.subsectors.some((sub) => sub.toLowerCase().includes(q))
    );
  }
  res.json({ total: list.length, sectors: list });
});

v22Router.post('/sectors', requireV22Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const out = createV22Sector({ ...req.body, actorId: ctx.userId });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.sector);
});

// ==========================================
// BUSINESSES & INDIVIDUALS (PRIVACY ISOLATION)
// ==========================================

v22Router.get('/businesses', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const sector = cleanV22Text(req.query.sectorCode).toUpperCase();
  const q = cleanV22Text(req.query.q).toLowerCase();
  let list = scopeByTenant(Array.from(db.v22Businesses.values()), ctx);
  if (sector) {
    list = list.filter((b) => b.primarySectorCode === sector || b.secondarySectorCodes.includes(sector));
  }
  if (q) {
    list = list.filter((b) => b.name.toLowerCase().includes(q) || b.summary.toLowerCase().includes(q) || b.district.toLowerCase().includes(q));
  }
  const masked = list.map((b) => maskSensitiveBusinessForViewer(b, ctx));
  res.json({ total: masked.length, businesses: masked });
});

v22Router.post('/businesses', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const out = createV22BusinessProfile({
    ...req.body,
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    ownerUserId: ctx.userId,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.business);
});

v22Router.post('/businesses/:id/verify', requireV22Admin, (req: Request, res: Response) => {
  const biz = db.v22Businesses.get(req.params.id);
  if (!biz) return res.status(404).json({ error: 'Business profile not found.' });
  if (req.body.registrationVerified !== undefined) biz.registrationVerified = Boolean(req.body.registrationVerified);
  if (req.body.productLicenceVerified !== undefined) biz.productLicenceVerified = Boolean(req.body.productLicenceVerified);
  if (req.body.verificationStatus) biz.verificationStatus = req.body.verificationStatus;
  biz.updatedAt = new Date().toISOString();
  db.v22Businesses.set(biz.id, biz);
  db.scheduleSave();
  res.json(biz);
});

v22Router.get('/individuals', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const sector = cleanV22Text(req.query.sectorCode).toUpperCase();
  let list = scopeByTenant(Array.from(db.v22Individuals.values()), ctx);
  if (sector) list = list.filter((i) => i.sectorCodes.includes(sector));
  res.json({ total: list.length, individuals: list });
});

v22Router.post('/individuals', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const out = createV22IndividualProfile({
    ...req.body,
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    userId: ctx.userId,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.individual);
});

// ==========================================
// UNIVERSAL MARKETPLACE 2.0 & MODERATION
// ==========================================

v22Router.get('/marketplace', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const sector = cleanV22Text(req.query.sectorCode).toUpperCase();
  const offerKind = cleanV22Text(req.query.offerKind).toUpperCase();
  const q = cleanV22Text(req.query.q).toLowerCase();
  let list = scopeByTenant(Array.from(db.v22MarketplaceItems.values()), ctx);
  if (sector) list = list.filter((i) => i.sectorCode === sector);
  if (offerKind) list = list.filter((i) => i.offerKind === offerKind);
  if (q) list = list.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.sellerName.toLowerCase().includes(q));
  res.json({ total: list.length, items: list });
});

v22Router.post('/marketplace', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const user = db.users.get(ctx.userId);
  const out = createV22MarketplaceListing({
    ...req.body,
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    sellerUserId: ctx.userId,
    sellerName: cleanV22Text(req.body?.sellerName || user?.organizationName || user?.name || ctx.userId),
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.listing);
});

v22Router.get('/marketplace/reports', requireV22Admin, (_req: Request, res: Response) => {
  res.json({ reports: Array.from(db.v22FraudReports.values()) });
});

v22Router.post('/marketplace/reports', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const out = reportV22ListingOrEntity({
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    targetType: req.body?.targetType || 'LISTING',
    targetId: req.body?.targetId,
    reporterUserId: ctx.userId,
    reasonCategory: req.body?.reasonCategory || 'MISLEADING_TERMS',
    description: req.body?.description,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.report);
});

v22Router.post('/marketplace/reports/:id/moderate', requireV22Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const r = db.v22FraudReports.get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Report not found.' });
  const decision = cleanV22Text(req.body?.decision).toUpperCase(); // 'REMOVE_TARGET' | 'RESTORE_TARGET'
  r.status = decision === 'REMOVE_TARGET' ? 'ACTION_TAKEN' : 'DISMISSED';
  r.reviewedBy = ctx.userId;
  r.reviewNote = cleanV22Text(req.body?.reviewNote || `Moderated by ${ctx.userId}`);
  r.updatedAt = new Date().toISOString();
  db.v22FraudReports.set(r.id, r);
  if (r.targetType === 'LISTING') {
    const item = db.v22MarketplaceItems.get(r.targetId);
    if (item) {
      item.moderationStatus = decision === 'REMOVE_TARGET' ? 'REMOVED' : 'ACTIVE';
      item.updatedAt = r.updatedAt;
      db.v22MarketplaceItems.set(item.id, item);
    }
  }
  db.scheduleSave();
  res.json(r);
});

// ==========================================
// COMMERCIAL EXECUTION LIFECYCLE & AGREEMENTS
// ==========================================

v22Router.get('/activities', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const sector = cleanV22Text(req.query.sectorCode).toUpperCase();
  let list = scopeByTenant(Array.from(db.v22Activities.values()), ctx);
  if (sector) list = list.filter((a) => a.sectorCode === sector);
  res.json({ total: list.length, activities: list });
});

v22Router.post('/activities', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const user = db.users.get(ctx.userId);
  const out = createV22CommercialActivity({
    ...req.body,
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    buyerUserId: req.body?.buyerUserId || ctx.userId,
    buyerName: req.body?.buyerName || user?.organizationName || user?.name || ctx.userId,
    actorRole: ctx.role,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(out.deduplicated ? 200 : 201).json(out);
});

v22Router.post('/activities/:id/transition', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const act = db.v22Activities.get(req.params.id);
  if (!act) return res.status(404).json({ error: 'Economic activity not found.' });
  if (!ctx.isPlatformAdmin && act.tenantId !== ctx.tenantId && ctx.tenantId !== 'GLOBAL_PUBLIC') {
    return res.status(403).json({ error: 'TENANT_BOUNDARY_VIOLATION' });
  }
  const out = transitionV22ActivityStage({
    activityId: req.params.id,
    targetStage: req.body?.targetStage,
    actorId: ctx.userId,
    actorRole: ctx.role,
    note: req.body?.note,
    evidenceSummary: req.body?.evidenceSummary,
    agreementTerms: req.body?.agreementTerms,
    expectedVersion: req.body?.expectedVersion,
  });
  if (!out.ok) return res.status(out.statusCode || 400).json({ error: out.error });
  res.json(out.activity);
});

// ==========================================
// PROCUREMENT RFQS / TENDERS & BIDS
// ==========================================

v22Router.get('/tenders', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const tenders = scopeByTenant(Array.from(db.v22Tenders.values()), ctx).map((t) => ({
    ...t,
    bids: Array.from(db.v22Bids.values()).filter((b) => b.tenderId === t.id),
  }));
  res.json({ total: tenders.length, disclaimer: V22_DISCLAIMER_PROCUREMENT, tenders });
});

v22Router.post('/tenders', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const user = db.users.get(ctx.userId);
  const out = createV22Tender({
    ...req.body,
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    issuerName: req.body?.issuerName || user?.organizationName || user?.name || ctx.userId,
    createdBy: ctx.userId,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.tender);
});

v22Router.post('/tenders/:id/bids', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const tender = db.v22Tenders.get(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Procurement tender not found.' });
  if (tender.status !== 'OPEN' && tender.status !== 'EVALUATION') {
    return res.status(400).json({ error: 'Tender is closed for new bids.' });
  }
  const amount = Number(req.body?.proposedAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Positive proposedAmount is required.' });
  }
  const user = db.users.get(ctx.userId);
  const now = new Date().toISOString();
  const bid: V22ProcurementBid = {
    id: uidV22('BID-V22'),
    tenantId: tender.tenantId,
    tenderId: tender.id,
    bidderProfileId: cleanV22Text(req.body?.bidderProfileId || ctx.userId),
    bidderUserId: ctx.userId,
    bidderName: cleanV22Text(req.body?.bidderName || user?.organizationName || user?.name || ctx.userId),
    proposedAmount: amount,
    currency: cleanV22Text(req.body?.currency || tender.currency).toUpperCase(),
    deliveryLeadDays: Math.max(1, Number(req.body?.deliveryLeadDays || 14)),
    technicalSummary: cleanV22Text(req.body?.technicalSummary || 'Qualified supplier proposal'),
    supportingEvidenceHash: sha256V22(`${tender.id}|${ctx.userId}|${amount}|${now}`),
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };
  db.v22Bids.set(bid.id, bid);
  db.scheduleSave();
  res.status(201).json(bid);
});

v22Router.post('/tenders/:id/award', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const out = awardV22TenderBid({
    tenderId: req.params.id,
    bidId: req.body?.bidId,
    actorId: ctx.userId,
    actorRole: ctx.role,
    evaluationScore: Number(req.body?.evaluationScore ?? 85),
    justification: req.body?.justification,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.json(out);
});

// ==========================================
// PROJECTS, MILESTONES & VARIATION APPROVALS
// ==========================================

v22Router.get('/projects', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const list = scopeByTenant(Array.from(db.v22Projects.values()), ctx);
  res.json({ total: list.length, projects: list });
});

v22Router.post('/projects', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const out = createV22Project({
    ...req.body,
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    clientUserId: req.body?.clientUserId || ctx.userId,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.project);
});

v22Router.post('/projects/:id/milestones/:milestoneId/update', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const project = db.v22Projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const ms = project.milestones.find((m) => m.id === req.params.milestoneId);
  if (!ms) return res.status(404).json({ error: 'Milestone not found.' });
  const nextStatus = cleanV22Text(req.body?.status).toUpperCase() as any;
  const validStatuses = ['PLANNED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'INSPECTED', 'ACCEPTED', 'REJECTED'];
  if (!validStatuses.includes(nextStatus)) {
    return res.status(400).json({ error: 'Invalid milestone status.' });
  }
  const now = new Date().toISOString();
  ms.status = nextStatus;
  if (req.body?.evidenceNotes) {
    ms.evidenceNotes = cleanV22Text(req.body.evidenceNotes);
    ms.evidenceHash = sha256V22(`${project.id}|${ms.id}|${ms.evidenceNotes}|${now}`);
  }
  if (nextStatus === 'ACCEPTED') {
    ms.acceptedBy = ctx.userId;
    ms.acceptedAt = now;
  }
  if (project.milestones.every((m) => m.status === 'ACCEPTED')) {
    project.status = 'COMPLETED';
  }
  project.updatedAt = now;
  db.v22Projects.set(project.id, project);
  db.scheduleSave();
  res.json(project);
});

v22Router.post('/projects/:id/variations', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const project = db.v22Projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const reason = cleanV22Text(req.body?.reason);
  const scopeDelta = cleanV22Text(req.body?.scopeDelta);
  if (!reason || !scopeDelta) return res.status(400).json({ error: 'reason and scopeDelta are required.' });
  const now = new Date().toISOString();
  const variation = {
    id: uidV22('VAR'),
    requestedBy: ctx.userId,
    reason,
    scopeDelta,
    budgetDelta: Number(req.body?.budgetDelta || 0),
    scheduleDeltaDays: Number(req.body?.scheduleDeltaDays || 0),
    status: 'PENDING_APPROVAL' as const,
    createdAt: now,
  };
  project.variations.push(variation);
  project.updatedAt = now;
  db.v22Projects.set(project.id, project);
  db.scheduleSave();
  res.status(201).json(variation);
});

v22Router.post('/projects/:id/variations/:variationId/decision', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const project = db.v22Projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const v = project.variations.find((item) => item.id === req.params.variationId);
  if (!v) return res.status(404).json({ error: 'Variation request not found.' });
  const decision = cleanV22Text(req.body?.decision).toUpperCase();
  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    return res.status(400).json({ error: 'decision must be APPROVED or REJECTED.' });
  }
  const now = new Date().toISOString();
  v.status = decision;
  v.reviewedBy = ctx.userId;
  v.reviewedAt = now;
  if (decision === 'APPROVED') {
    project.totalBudget = Number((project.totalBudget + v.budgetDelta).toFixed(2));
  }
  project.updatedAt = now;
  db.v22Projects.set(project.id, project);
  db.scheduleSave();
  res.json(project);
});

// ==========================================
// INVOICES, NON-CUSTODIAL PAYMENT REFERENCES & FX REGISTRY
// ==========================================

v22Router.get('/invoices', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const invoices = scopeByTenant(Array.from(db.v22Invoices.values()), ctx);
  const paymentRefs = scopeByTenant(Array.from(db.v22PaymentRefs.values()), ctx);
  res.json({ total: invoices.length, disclaimer: V22_DISCLAIMER_NON_CUSTODIAL, invoices, paymentRefs });
});

v22Router.post('/invoices', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const user = db.users.get(ctx.userId);
  const out = createV22Invoice({
    ...req.body,
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    issuerUserId: ctx.userId,
    issuerName: req.body?.issuerName || user?.organizationName || user?.name || ctx.userId,
  });
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.status(201).json(out.invoice);
});

v22Router.post('/payment-references', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const out = recordV22ExternalPaymentReference({
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    invoiceId: req.body?.invoiceId,
    externalChannel: req.body?.externalChannel || 'BANK_TRANSFER',
    externalProviderName: req.body?.externalProviderName || 'Commercial Bank',
    externalReferenceNumber: req.body?.externalReferenceNumber,
    amount: Number(req.body?.amount),
    claimCustodialWalletOrDeposit: Boolean(req.body?.claimCustodialWalletOrDeposit),
    recordedBy: ctx.userId,
  });
  if (!out.ok) return res.status(out.statusCode || 400).json({ error: out.error });
  res.status(201).json(out);
});

v22Router.get('/fx-rates', (_req: Request, res: Response) => {
  res.json({ rates: Array.from(db.v22FxRates.values()) });
});

v22Router.post('/fx-rates', requireV22Admin, (req: Request, res: Response) => {
  const code = cleanV22Text(req.body?.currencyCode).toUpperCase();
  const rate = Number(req.body?.rateToUgx);
  if (!code || !Number.isFinite(rate) || rate <= 0) {
    return res.status(400).json({ error: 'Valid currencyCode and positive rateToUgx required.' });
  }
  const rec = {
    currencyCode: code,
    currencyName: cleanV22Text(req.body?.currencyName || code),
    symbol: cleanV22Text(req.body?.symbol || code),
    rateToUgx: rate,
    rateSource: cleanV22Text(req.body?.rateSource || 'Admin Configured Indicative Reference'),
    classification: (req.body?.classification || 'INDICATIVE_MARKET') as any,
    updatedAt: new Date().toISOString(),
  };
  db.v22FxRates.set(code, rec);
  db.scheduleSave();
  res.status(201).json(rec);
});

// ==========================================
// WORKFORCE TASKS, INTELLIGENCE, RELATIONSHIPS & PLANS
// ==========================================

v22Router.get('/workforce/tasks', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  res.json({ tasks: scopeByTenant(Array.from(db.v22WorkforceTasks.values()), ctx) });
});

v22Router.post('/workforce/tasks', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const title = cleanV22Text(req.body?.title);
  if (!title) return res.status(400).json({ error: 'Task title is required.' });
  const now = new Date().toISOString();
  const task: V22WorkforceTask = {
    id: uidV22('TSK-V22'),
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    businessProfileId: cleanV22Text(req.body?.businessProfileId || 'BIZ-V22-001'),
    assigneeName: cleanV22Text(req.body?.assigneeName || 'Assigned Specialist'),
    assigneeRole: cleanV22Text(req.body?.assigneeRole || 'Operations Coordinator'),
    title,
    sectorCode: cleanV22Text(req.body?.sectorCode || 'PROFESSIONAL_ADVISORY').toUpperCase(),
    priority: (req.body?.priority || 'MEDIUM') as any,
    status: 'TODO',
    dueDate: cleanV22Text(req.body?.dueDate || '2026-12-15'),
    createdAt: now,
    updatedAt: now,
  };
  db.v22WorkforceTasks.set(task.id, task);
  db.scheduleSave();
  res.status(201).json(task);
});

v22Router.post('/workforce/tasks/:id/status', (req: Request, res: Response) => {
  const task = db.v22WorkforceTasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  const status = cleanV22Text(req.body?.status).toUpperCase();
  if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  task.status = status as any;
  task.updatedAt = new Date().toISOString();
  db.v22WorkforceTasks.set(task.id, task);
  db.scheduleSave();
  res.json(task);
});

v22Router.get('/intelligence/insights', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  res.json({ insights: scopeByTenant(Array.from(db.v22Insights.values()), ctx) });
});

v22Router.post('/intelligence/insights/:id/acknowledge', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const ins = db.v22Insights.get(req.params.id);
  if (!ins) return res.status(404).json({ error: 'Insight not found.' });
  ins.acknowledgedBy = ctx.userId;
  db.v22Insights.set(ins.id, ins);
  db.scheduleSave();
  res.json(ins);
});

v22Router.post('/intelligence/assistant', rateLimitV22(20, 60_000), async (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const result = await askV22EconomicAssistant({
    query: req.body?.query,
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
  });
  res.status(result.promptInjectionDetected ? 400 : 200).json(result);
});

v22Router.get('/relationships', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const list = scopeByTenant(Array.from(db.v22Relationships.values()), ctx);
  res.json({ total: list.length, relationships: list });
});

v22Router.post('/relationships', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const sourceEntityName = cleanV22Text(req.body?.sourceEntityName);
  const targetEntityName = cleanV22Text(req.body?.targetEntityName);
  if (!sourceEntityName || !targetEntityName) {
    return res.status(400).json({ error: 'sourceEntityName and targetEntityName are required.' });
  }
  const sectorCode = cleanV22Text(req.body?.sectorCode || 'PROFESSIONAL_ADVISORY').toUpperCase();
  const rel: V22EconomicRelationship = {
    id: uidV22('REL-V22'),
    tenantId: ctx.tenantId === 'GLOBAL_PUBLIC' ? 'TEN-UG-ELGON-01' : ctx.tenantId,
    sourceEntityId: cleanV22Text(req.body?.sourceEntityId || ctx.userId),
    sourceEntityName,
    sourceEntityType: req.body?.sourceEntityType || 'BUSINESS',
    targetEntityId: cleanV22Text(req.body?.targetEntityId || 'EXT-PARTNER'),
    targetEntityName,
    targetEntityType: req.body?.targetEntityType || 'BUSINESS',
    relationshipType: req.body?.relationshipType || 'SUPPLIER_TO',
    sectorCode,
    verifiedByTransactionCount: Number(req.body?.verifiedByTransactionCount || 0),
    sensitiveMaskApplied: ['HEALTHCARE_MEDICAL', 'PHARMA_BIOTECH', 'FINANCIAL_COORDINATION'].includes(sectorCode),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  db.v22Relationships.set(rel.id, rel);
  db.scheduleSave();
  res.status(201).json(rel);
});

v22Router.get('/plans', (_req: Request, res: Response) => {
  res.json({
    plans: Array.from(db.v22Plans.values()),
    subscriptions: Array.from(db.v22Subscriptions.values()),
  });
});

v22Router.get('/search', (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const q = cleanV22Text(req.query.q).toLowerCase();
  const sectors = Array.from(db.v22Sectors.values()).filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  const businesses = scopeByTenant(Array.from(db.v22Businesses.values()), ctx)
    .filter((b) => !q || b.name.toLowerCase().includes(q) || b.summary.toLowerCase().includes(q))
    .map((b) => maskSensitiveBusinessForViewer(b, ctx));
  const individuals = scopeByTenant(Array.from(db.v22Individuals.values()), ctx).filter(
    (i) => !q || i.fullName.toLowerCase().includes(q) || i.professionalTitle.toLowerCase().includes(q)
  );
  const listings = scopeByTenant(Array.from(db.v22MarketplaceItems.values()), ctx).filter(
    (l) => !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
  );
  const tenders = scopeByTenant(Array.from(db.v22Tenders.values()), ctx).filter(
    (t) => !q || t.title.toLowerCase().includes(q) || t.scopeDescription.toLowerCase().includes(q)
  );
  const projects = scopeByTenant(Array.from(db.v22Projects.values()), ctx).filter(
    (p) => !q || p.title.toLowerCase().includes(q)
  );
  res.json({
    query: q,
    sectors: sectors.slice(0, 12),
    businesses: businesses.slice(0, 12),
    individuals: individuals.slice(0, 12),
    listings: listings.slice(0, 12),
    tenders: tenders.slice(0, 10),
    projects: projects.slice(0, 10),
  });
});

v22Router.post('/postgres/dry-run', requireV22Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v22Ctx as V22Context;
  const result = runV22PostgresDryRunAudit();
  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: 'UG',
    actorId: ctx.userId,
    actorRole: ctx.role,
    actionType: 'REPORT_EXPORTED',
    entityType: 'V22PostgresDryRun',
    entityId: 'SCHEMA-20',
    details: `PostgreSQL Schema 20 dry-run audited (${result.mappedTablesCount} tables, ledgerBalanced=${result.ledgerBalanced})`,
  });
  res.json(result);
});

v22Router.get('/migration/status', (_req: Request, res: Response) => {
  res.json(db.verifyV20MigrationCompleteness());
});

v22Router.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'V22_ENDPOINT_NOT_FOUND' });
});
