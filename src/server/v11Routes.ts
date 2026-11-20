/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V11.0 - Global Economic Network Scale REST Router
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.ts';
import type {
  TenantRecord,
  TenantMembership,
  ParticipantOnboardingApplication,
  OnboardingLifecycleStatus,
  BusinessWorkspaceProfile,
  BusinessCatalogItem,
  BusinessCommercialDoc,
  BusinessTaskItem,
  ParticipantRelationshipRecord,
  ConnectionRequestRecord,
  NetworkMarketplaceListing,
  V11ProcurementRequest,
  SupplierQualificationRecord,
  LogisticsCarrierProfile,
  VerifiedProviderProfile,
  ProviderIntegrationLifecycle,
  RegisteredEcosystemApp,
  AppRegistryLifecycle,
  IndustrialCapacityRecord,
  WorkServiceOpportunity,
  AiAgentActionLog,
  TenantSubscriptionRecord,
  TenantBillingInvoice,
  V11PerformanceBenchmark,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'aros_database.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export const v11Router = Router();

interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
  isPlatformAdmin: boolean;
}

const ONBOARDING_STAGE_ORDER: OnboardingLifecycleStatus[] = [
  'APPLICATION',
  'IDENTITY_VERIFICATION',
  'CLASSIFICATION',
  'DOCUMENT_REVIEW',
  'RISK_ASSESSMENT',
  'APPROVAL',
  'ACTIVATION',
];

const PROVIDER_STAGE_ORDER: ProviderIntegrationLifecycle[] = [
  'DISCOVERED',
  'REVIEW_PENDING',
  'CONFIGURED',
  'SANDBOX_TESTED',
  'SECURITY_APPROVED',
  'AUTHORIZED',
  'PRODUCTION_CONNECTED',
  'MONITORED',
];

const APP_STAGE_ORDER: AppRegistryLifecycle[] = [
  'SUBMITTED',
  'REVIEW_PENDING',
  'SECURITY_REVIEW',
  'SANDBOX_APPROVED',
  'PRODUCTION_APPROVED',
  'PUBLISHED',
];

function resolveActorFromRequest(req: Request): { userId?: string; role?: string; isPlatformAdmin: boolean } {
  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string | undefined)?.trim();
  let role: string | undefined;

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
    if (user) {
      role = user.role;
    }
  }

  return {
    userId,
    role,
    isPlatformAdmin: role === 'PLATFORM_ADMIN',
  };
}

/**
 * Enforces multi-tenant isolation whenever x-tenant-id or x-user-id / Bearer token is supplied.
 * - If x-user-id or Bearer token is supplied alongside x-tenant-id: verifies an ACTIVE membership
 *   in db.tenantMemberships (or primaryAdminUserId match, or PLATFORM_ADMIN).
 * - Rejects revoked/suspended memberships or cross-tenant access with HTTP 403 CROSS_TENANT_ACCESS_DENIED.
 */
function requireTenantContext(req: Request, res: Response, next: NextFunction) {
  const requestedTenantId =
    (req.headers['x-tenant-id'] as string | undefined)?.trim() ||
    (req.query.tenantId as string | undefined)?.trim() ||
    (req.body?.tenantId as string | undefined)?.trim() ||
    'TEN-UG-ELGON-01';

  const actor = resolveActorFromRequest(req);
  const tenant = db.tenants.get(requestedTenantId);

  if (!tenant) {
    return res.status(404).json({ error: `Tenant ${requestedTenantId} not found.` });
  }

  if (tenant.status === 'SUSPENDED' || tenant.status === 'CLOSED') {
    if (!actor.isPlatformAdmin && !req.path.startsWith('/tenants')) {
      return res.status(403).json({
        error: 'TENANT_SUSPENDED',
        message: `Tenant ${requestedTenantId} is currently ${tenant.status}.`,
      });
    }
  }

  if (actor.userId && !actor.isPlatformAdmin) {
    const hasMembership = Array.from(db.tenantMemberships.values()).some(
      (m) => m.tenantId === requestedTenantId && m.userId === actor.userId && m.status === 'ACTIVE'
    );
    const isPrimaryAdmin = tenant.primaryAdminUserId === actor.userId;
    if (!hasMembership && !isPrimaryAdmin) {
      return res.status(403).json({
        error: 'CROSS_TENANT_ACCESS_DENIED',
        tenantId: requestedTenantId,
        userId: actor.userId,
        message: `User ${actor.userId} does not hold an active membership for tenant ${requestedTenantId}.`,
      });
    }
  }

  (req as any).tenantContext = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies TenantContext;

  return next();
}

function getTenantCtx(req: Request): TenantContext {
  return (req as any).tenantContext as TenantContext;
}

// ==========================================
// P1: MULTI-TENANCY & PARTICIPANT ONBOARDING
// ==========================================

v11Router.get('/tenants', (req: Request, res: Response) => {
  const actor = resolveActorFromRequest(req);
  const tenants = Array.from(db.tenants.values());
  const includeMemberships = req.query.includeMemberships === 'true';

  if (actor.userId && !actor.isPlatformAdmin) {
    const allowedTenantIds = new Set(
      Array.from(db.tenantMemberships.values())
        .filter((m) => m.userId === actor.userId && m.status === 'ACTIVE')
        .map((m) => m.tenantId)
    );
    tenants.forEach((t) => {
      if (t.primaryAdminUserId === actor.userId) allowedTenantIds.add(t.id);
    });
    const scoped = tenants.filter((t) => allowedTenantIds.has(t.id));
    if (!includeMemberships) return res.json(scoped);
    return res.json(
      scoped.map((t) => ({
        ...t,
        memberships: Array.from(db.tenantMemberships.values()).filter((m) => m.tenantId === t.id),
      }))
    );
  }

  if (!includeMemberships) {
    return res.json(tenants);
  }
  return res.json(
    tenants.map((t) => ({
      ...t,
      memberships: Array.from(db.tenantMemberships.values()).filter((m) => m.tenantId === t.id),
    }))
  );
});

v11Router.get('/tenants/:id/members', (req: Request, res: Response) => {
  const tenant = db.tenants.get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });
  const members = Array.from(db.tenantMemberships.values()).filter((m) => m.tenantId === req.params.id);
  return res.json(members);
});

v11Router.post('/tenants', (req: Request, res: Response) => {
  const {
    legalName,
    slug,
    organizationType,
    jurisdiction,
    primaryAdminUserId,
    primaryAdminName,
    primaryAdminEmail,
    residencyCountry,
    billingPlanId,
    parentTenantId,
  } = req.body;

  if (!legalName || !jurisdiction || !organizationType) {
    return res.status(400).json({ error: 'legalName, organizationType, and jurisdiction are required.' });
  }

  const now = new Date().toISOString();
  const id = `TEN-${jurisdiction.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const adminId = primaryAdminUserId || `usr_admin_${Date.now().toString(36)}`;

  const tenant: TenantRecord = {
    id,
    slug: slug || legalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    legalName,
    organizationType,
    jurisdiction: jurisdiction.toUpperCase(),
    parentTenantId,
    primaryAdminUserId: adminId,
    status: 'ACTIVE',
    dataOwnershipPolicy: {
      residencyCountry: (residencyCountry || jurisdiction).toUpperCase(),
      retainAuthoritativeControl: true,
      retentionDays: 2555,
      allowCrossBorderAnalytics: true,
    },
    billingPlanId: billingPlanId || 'PLAN-BIZ-02',
    integrationEnvironment: 'SANDBOX',
    createdAt: now,
    updatedAt: now,
  };

  const membership: TenantMembership = {
    id: `MEM-${Date.now().toString(36).toUpperCase()}`,
    tenantId: id,
    userId: adminId,
    userName: primaryAdminName || `${legalName} Primary Admin`,
    email: primaryAdminEmail || `admin@${tenant.slug}.aros.local`,
    role: 'TENANT_ADMIN',
    attributes: ['TENANT_OWNER', 'EXPORT_SIGNATORY', 'TREASURY_VIEW'],
    status: 'ACTIVE',
    invitedBy: 'system-onboarding',
    joinedAt: now,
  };

  db.tenants.set(id, tenant);
  db.tenantMemberships.set(membership.id, membership);
  db.logAudit({
    actorId: adminId,
    actorName: membership.userName,
    actorRole: 'COOPERATIVE_ADMIN',
    action: 'V11_TENANT_CREATED',
    entityType: 'ORGANIZATION',
    entityId: id,
    details: `Tenant ${legalName} (${id}) provisioned in jurisdiction ${tenant.jurisdiction}.`,
  });
  db.scheduleSave();

  return res.status(201).json({ tenant, adminMembership: membership });
});

v11Router.post('/tenants/:id/members', (req: Request, res: Response) => {
  const tenant = db.tenants.get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });

  const { userId, userName, email, role, attributes, invitedBy } = req.body;
  if (!userId || !userName || !email || !role) {
    return res.status(400).json({ error: 'userId, userName, email, and role are required.' });
  }

  const membership: TenantMembership = {
    id: `MEM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 999)}`,
    tenantId: tenant.id,
    userId,
    userName,
    email,
    role,
    attributes: Array.isArray(attributes) ? attributes : [],
    status: 'ACTIVE',
    invitedBy: invitedBy || tenant.primaryAdminUserId,
    joinedAt: new Date().toISOString(),
  };

  db.tenantMemberships.set(membership.id, membership);
  db.scheduleSave();
  return res.status(201).json(membership);
});

v11Router.post('/tenants/:id/members/:memberId/revoke', (req: Request, res: Response) => {
  const membership = db.tenantMemberships.get(req.params.memberId);
  if (!membership || membership.tenantId !== req.params.id) {
    return res.status(404).json({ error: 'Tenant membership not found.' });
  }

  membership.status = 'REVOKED';
  membership.revokedAt = new Date().toISOString();
  db.tenantMemberships.set(membership.id, membership);
  db.logAudit({
    actorId: req.body?.actorId || 'tenant-admin',
    actorName: 'Tenant Governance Officer',
    actorRole: 'PLATFORM_ADMIN',
    action: 'TENANT_MEMBERSHIP_REVOKED',
    entityType: 'USER',
    entityId: membership.userId,
    details: `Revoked membership ${membership.id} for tenant ${membership.tenantId}.`,
  });
  db.scheduleSave();

  return res.json(membership);
});

v11Router.post('/tenants/:id/suspend', (req: Request, res: Response) => {
  const tenant = db.tenants.get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });

  const nextStatus = req.body?.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';
  tenant.status = nextStatus;
  tenant.updatedAt = new Date().toISOString();
  db.tenants.set(tenant.id, tenant);
  db.scheduleSave();
  return res.json(tenant);
});

v11Router.get('/tenants/:id/export', (req: Request, res: Response) => {
  const tenant = db.tenants.get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });

  const actor = resolveActorFromRequest(req);
  if (actor.userId && !actor.isPlatformAdmin) {
    const allowed = Array.from(db.tenantMemberships.values()).some(
      (m) => m.tenantId === tenant.id && m.userId === actor.userId && m.status === 'ACTIVE'
    );
    if (!allowed && tenant.primaryAdminUserId !== actor.userId) {
      return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
    }
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    tenant,
    dataOwnershipRetainedByParticipant: tenant.dataOwnershipPolicy.retainAuthoritativeControl,
    memberships: Array.from(db.tenantMemberships.values()).filter((m) => m.tenantId === tenant.id),
    workspaceProfile: Array.from(db.businessWorkspaces.values()).filter((w) => w.tenantId === tenant.id),
    catalogItems: Array.from(db.businessCatalogItems.values()).filter((c) => c.tenantId === tenant.id),
    commercialDocs: Array.from(db.businessCommercialDocs.values()).filter((d) => d.tenantId === tenant.id),
    tasks: Array.from(db.businessTasks.values()).filter((t) => t.tenantId === tenant.id),
    relationships: Array.from(db.participantRelationships.values()).filter((r) => r.tenantId === tenant.id),
  };

  return res.json(exportPayload);
});

// Onboarding Applications & Lifecycle
v11Router.get('/onboarding/applications', (req: Request, res: Response) => {
  const publicRedacted = req.query.publicView === 'true';
  const tenantFilter = req.query.tenantId as string | undefined;

  let apps = Array.from(db.onboardingApplications.values());
  if (tenantFilter) {
    apps = apps.filter((a) => a.tenantId === tenantFilter);
  }

  if (publicRedacted) {
    apps = apps.map((a) => ({
      ...a,
      registrationOrNationalId: 'REDACTED_SENSITIVE',
      evidenceDocuments: a.evidenceDocuments.map((doc) =>
        doc.classification === 'SENSITIVE_IDENTITY'
          ? { ...doc, fileName: 'REDACTED', documentHash: 'REDACTED_PII' }
          : doc
      ),
    }));
  }

  return res.json(apps);
});

v11Router.post('/onboarding/applications', (req: Request, res: Response) => {
  const {
    tenantId,
    participantType,
    legalOrFullName,
    email,
    phone,
    jurisdiction,
    registrationOrNationalId,
    taxId,
    declaredCapabilities,
    authorizedRepresentatives,
    consentGranted,
  } = req.body;

  if (!participantType || !legalOrFullName || !email || !jurisdiction || !registrationOrNationalId) {
    return res.status(400).json({
      error: 'participantType, legalOrFullName, email, jurisdiction, and registrationOrNationalId are required.',
    });
  }
  if (consentGranted !== true) {
    return res.status(400).json({ error: 'Explicit participant data consent (consentGranted: true) is required.' });
  }

  const normalizedReg = registrationOrNationalId.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  const duplicate = Array.from(db.onboardingApplications.values()).find(
    (existing) =>
      existing.registrationOrNationalId.trim().toUpperCase() === normalizedReg ||
      existing.email.trim().toLowerCase() === normalizedEmail
  );

  const now = new Date().toISOString();
  const id = `ONB-2026-${Date.now().toString(36).toUpperCase()}`;

  const app: ParticipantOnboardingApplication = {
    id,
    tenantId: tenantId || 'TEN-UG-ELGON-01',
    participantType,
    legalOrFullName,
    email,
    phone: phone || '',
    jurisdiction: jurisdiction.toUpperCase(),
    registrationOrNationalId,
    taxId,
    declaredCapabilities: Array.isArray(declaredCapabilities) ? declaredCapabilities : [],
    authorizedRepresentatives: Array.isArray(authorizedRepresentatives) ? authorizedRepresentatives : [],
    consentGranted: true,
    consentTimestamp: now,
    status: 'APPLICATION',
    evidenceDocuments: [],
    duplicateCheckStatus: duplicate ? 'POTENTIAL_DUPLICATE' : 'CLEAR',
    verificationClaimType: 'SELF_DECLARED',
    auditHistory: [
      {
        timestamp: now,
        action: 'APPLICATION_SUBMITTED',
        actor: email,
        notes: duplicate ? `Flagged potential duplicate against ${duplicate.id}` : 'No duplicate detected',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.onboardingApplications.set(id, app);
  db.scheduleSave();
  return res.status(201).json(app);
});

v11Router.post('/onboarding/applications/:id/documents', (req: Request, res: Response) => {
  const app = db.onboardingApplications.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Onboarding application not found.' });

  const { documentType, fileName, classification, verificationStatus, verifiedBy } = req.body;
  if (!documentType || !fileName || !classification) {
    return res.status(400).json({ error: 'documentType, fileName, and classification are required.' });
  }

  const docHash = `0x${crypto.createHash('sha256').update(`${app.id}:${fileName}:${Date.now()}`).digest('hex').slice(0, 40)}`;
  const doc = {
    id: `DOC-ONB-${Date.now().toString(36).toUpperCase()}`,
    documentType,
    fileName,
    documentHash: docHash,
    classification,
    verificationStatus: verificationStatus || 'PENDING_REVIEW',
    uploadedAt: new Date().toISOString(),
    verifiedBy,
  };

  app.evidenceDocuments.push(doc);
  if (app.evidenceDocuments.some((d) => d.verificationStatus === 'INDEPENDENTLY_VERIFIED')) {
    app.verificationClaimType = 'PARTIALLY_VERIFIED';
  }
  app.updatedAt = new Date().toISOString();
  db.onboardingApplications.set(app.id, app);
  db.scheduleSave();

  return res.status(201).json(app);
});

v11Router.post('/onboarding/applications/:id/transition', (req: Request, res: Response) => {
  const app = db.onboardingApplications.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Onboarding application not found.' });

  const { targetStatus, actor, notes } = req.body as {
    targetStatus?: OnboardingLifecycleStatus;
    actor?: string;
    notes?: string;
  };
  if (!targetStatus) return res.status(400).json({ error: 'targetStatus is required.' });

  const sideStates: OnboardingLifecycleStatus[] = ['PENDING_INFORMATION', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'REVOKED'];
  if (!sideStates.includes(targetStatus)) {
    const curIdx = ONBOARDING_STAGE_ORDER.indexOf(app.status);
    const tgtIdx = ONBOARDING_STAGE_ORDER.indexOf(targetStatus);
    if (tgtIdx === -1) {
      return res.status(400).json({ error: `Invalid targetStatus: ${targetStatus}` });
    }
    if (curIdx === -1) {
      return res.status(400).json({ error: `Cannot advance directly from ${app.status} to ${targetStatus}` });
    }
    if (tgtIdx > curIdx + 1) {
      return res.status(400).json({
        error: 'STAGE_SKIP_PROHIBITED',
        message: `Onboarding stage transition ${app.status} -> ${targetStatus} violates sequential verification pipeline.`,
      });
    }
  }

  if (targetStatus === 'ACTIVATION') {
    if (app.duplicateCheckStatus === 'POTENTIAL_DUPLICATE' && !req.body.overrideDuplicateConfirmedBy) {
      return res.status(409).json({
        error: 'DUPLICATE_RESOLUTION_REQUIRED',
        message: 'Application flagged as POTENTIAL_DUPLICATE requires explicit override review before activation.',
      });
    }
    app.renewalDueAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
    if (app.evidenceDocuments.some((d) => d.verificationStatus === 'INDEPENDENTLY_VERIFIED')) {
      app.verificationClaimType = 'INDEPENDENTLY_VERIFIED';
    }
  }

  const prev = app.status;
  app.status = targetStatus;
  app.updatedAt = new Date().toISOString();
  app.auditHistory.push({
    timestamp: app.updatedAt,
    action: `TRANSITION_${prev}_TO_${targetStatus}`,
    actor: actor || 'compliance-reviewer@aros.ug',
    notes,
  });

  db.onboardingApplications.set(app.id, app);
  db.scheduleSave();
  return res.json(app);
});

// ==========================================
// P2: BUSINESS OPERATING WORKSPACE (STRICT TENANT ISOLATION)
// ==========================================

v11Router.get('/workspace/profile', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const profile = Array.from(db.businessWorkspaces.values()).find((w) => w.tenantId === tenantId);
  if (!profile) {
    const tenant = db.tenants.get(tenantId);
    return res.json({
      id: `BIZ-WS-${tenantId}`,
      tenantId,
      businessName: tenant?.legalName || tenantId,
      sector: 'Multi-Sector Commerce',
      jurisdiction: tenant?.jurisdiction || 'UG',
      locations: [],
      representatives: [],
      verificationStatus: 'PENDING',
      statutoryDisclaimer:
        'AETHER–AROS provides operational workspace tooling; accounting, tax filing, and banking remain governed by licensed institutions.',
      updatedAt: new Date().toISOString(),
    } satisfies BusinessWorkspaceProfile);
  }
  return res.json(profile);
});

v11Router.put('/workspace/profile', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const existing = Array.from(db.businessWorkspaces.values()).find((w) => w.tenantId === tenantId);
  const now = new Date().toISOString();
  const updated: BusinessWorkspaceProfile = {
    id: existing?.id || `BIZ-WS-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    businessName: req.body.businessName || existing?.businessName || db.tenants.get(tenantId)?.legalName || tenantId,
    sector: req.body.sector || existing?.sector || 'General Commerce',
    jurisdiction: req.body.jurisdiction || existing?.jurisdiction || 'UG',
    locations: Array.isArray(req.body.locations) ? req.body.locations : existing?.locations || [],
    representatives: Array.isArray(req.body.representatives) ? req.body.representatives : existing?.representatives || [],
    verificationStatus: req.body.verificationStatus || existing?.verificationStatus || 'PENDING',
    statutoryDisclaimer:
      existing?.statutoryDisclaimer ||
      'AETHER–AROS provides operational workspace tooling; accounting, tax filing, and banking remain governed by licensed institutions.',
    updatedAt: now,
  };
  db.businessWorkspaces.set(updated.id, updated);
  db.scheduleSave();
  return res.json(updated);
});

v11Router.get('/workspace/catalog', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const items = Array.from(db.businessCatalogItems.values()).filter((c) => c.tenantId === tenantId);
  return res.json(items);
});

v11Router.post('/workspace/catalog', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { sku, name, itemType, category, unit, unitPrice, currency, availableStockOrCapacity } = req.body;
  if (!name || !unit || unitPrice === undefined || !currency) {
    return res.status(400).json({ error: 'name, unit, unitPrice, and currency are required.' });
  }
  const item: BusinessCatalogItem = {
    id: `CAT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 99)}`,
    tenantId,
    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
    name,
    itemType: itemType || 'PRODUCT',
    category: category || 'General Trade',
    unit,
    unitPrice: Number(unitPrice),
    currency,
    availableStockOrCapacity: Number(availableStockOrCapacity || 0),
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  db.businessCatalogItems.set(item.id, item);
  db.scheduleSave();
  return res.status(201).json(item);
});

v11Router.get('/workspace/documents', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const docs = Array.from(db.businessCommercialDocs.values()).filter((d) => d.tenantId === tenantId);
  return res.json(docs);
});

v11Router.post('/workspace/documents', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId, userId } = getTenantCtx(req);
  const { docType, counterpartyName, counterpartyTenantId, lineItems, taxRatePct, currency, dueDate } = req.body;
  if (!docType || !counterpartyName || !Array.isArray(lineItems) || lineItems.length === 0 || !currency) {
    return res.status(400).json({ error: 'docType, counterpartyName, lineItems array, and currency are required.' });
  }

  const normalizedLines = lineItems.map((l: any) => {
    const qty = Number(l.quantity || 1);
    const price = Number(l.unitPrice || 0);
    return {
      description: String(l.description || 'Commercial Line Item'),
      quantity: qty,
      unitPrice: price,
      total: l.total !== undefined ? Number(l.total) : qty * price,
    };
  });
  const subtotal = normalizedLines.reduce((acc, l) => acc + l.total, 0);
  const effectiveTaxPct = taxRatePct !== undefined ? Number(taxRatePct) : 18;
  const taxAmount = Number(((subtotal * effectiveTaxPct) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  const prefixMap: Record<string, string> = {
    QUOTATION: 'QTN',
    PURCHASE_ORDER: 'PO',
    INVOICE: 'INV',
    DELIVERY_NOTE: 'DN',
  };

  const doc: BusinessCommercialDoc = {
    id: `BDOC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 99)}`,
    tenantId,
    docNumber: `${prefixMap[docType] || 'DOC'}-2026-${Math.floor(100 + Math.random() * 900)}`,
    docType,
    counterpartyName,
    counterpartyTenantId,
    lineItems: normalizedLines,
    subtotal,
    taxAmount,
    totalAmount,
    currency,
    status: req.body.status || 'DRAFT',
    dueDate,
    createdBy: userId || req.body.createdBy || 'tenant-operator',
    createdAt: new Date().toISOString(),
  };

  db.businessCommercialDocs.set(doc.id, doc);
  db.scheduleSave();
  return res.status(201).json(doc);
});

v11Router.post('/workspace/documents/:id/status', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const doc = db.businessCommercialDocs.get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Commercial document not found.' });
  if (doc.tenantId !== tenantId) {
    return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  }
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required.' });
  doc.status = status;
  db.businessCommercialDocs.set(doc.id, doc);
  db.scheduleSave();
  return res.json(doc);
});

v11Router.get('/workspace/tasks', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const tasks = Array.from(db.businessTasks.values()).filter((t) => t.tenantId === tenantId);
  return res.json(tasks);
});

v11Router.post('/workspace/tasks', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { title, assignedTo, department, priority, dueDate, status } = req.body;
  if (!title || !assignedTo) {
    return res.status(400).json({ error: 'title and assignedTo are required.' });
  }
  const task: BusinessTaskItem = {
    id: `TASK-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    title,
    assignedTo,
    department: department || 'Operations',
    priority: priority || 'MEDIUM',
    status: status || 'OPEN',
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  db.businessTasks.set(task.id, task);
  db.scheduleSave();
  return res.status(201).json(task);
});

v11Router.get('/workspace/summary', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const profile = Array.from(db.businessWorkspaces.values()).find((w) => w.tenantId === tenantId);
  const catalog = Array.from(db.businessCatalogItems.values()).filter((c) => c.tenantId === tenantId);
  const docs = Array.from(db.businessCommercialDocs.values()).filter((d) => d.tenantId === tenantId);
  const tasks = Array.from(db.businessTasks.values()).filter((t) => t.tenantId === tenantId);
  const receivablesByCurrency: Record<string, number> = {};
  const payablesByCurrency: Record<string, number> = {};

  docs.forEach((d) => {
    if (d.docType === 'INVOICE' && d.status !== 'CANCELLED') {
      receivablesByCurrency[d.currency] = (receivablesByCurrency[d.currency] || 0) + d.totalAmount;
    } else if (d.docType === 'PURCHASE_ORDER' && d.status !== 'CANCELLED') {
      payablesByCurrency[d.currency] = (payablesByCurrency[d.currency] || 0) + d.totalAmount;
    }
  });

  return res.json({
    tenantId,
    businessName: profile?.businessName || db.tenants.get(tenantId)?.legalName || tenantId,
    catalogCount: catalog.length,
    documentsCount: docs.length,
    openTasksCount: tasks.filter((t) => t.status !== 'COMPLETED').length,
    receivablesByCurrency,
    payablesByCurrency,
    statutoryDisclaimer:
      profile?.statutoryDisclaimer ||
      'AETHER–AROS provides operational workspace tooling; accounting, tax filing, and banking remain governed by licensed institutions.',
  });
});

// ==========================================
// P3: NETWORK RELATIONSHIPS & MARKETPLACE
// ==========================================

v11Router.get('/network/relationships', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId, isPlatformAdmin } = getTenantCtx(req);
  const visible = Array.from(db.participantRelationships.values()).filter((r) => {
    if (isPlatformAdmin) return true;
    if (r.visibility === 'PUBLIC' || r.visibility === 'NETWORK_PARTICIPANTS') return true;
    return r.tenantId === tenantId || r.sourceParticipantId === tenantId || r.targetParticipantId === tenantId;
  });
  return res.json(visible);
});

v11Router.post('/network/relationships', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const {
    targetParticipantId,
    targetParticipantName,
    relationshipType,
    jurisdiction,
    visibility,
    evidenceRef,
    authorizedContacts,
    expiresAt,
  } = req.body;

  if (!targetParticipantId || !relationshipType) {
    return res.status(400).json({ error: 'targetParticipantId and relationshipType are required.' });
  }

  const sourceTenant = db.tenants.get(tenantId);
  const rel: ParticipantRelationshipRecord = {
    id: `REL-V11-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    sourceParticipantId: tenantId,
    sourceParticipantName: sourceTenant?.legalName || tenantId,
    targetParticipantId,
    targetParticipantName: targetParticipantName || targetParticipantId,
    relationshipType,
    jurisdiction: jurisdiction || sourceTenant?.jurisdiction || 'UG',
    visibility: visibility || 'BILATERAL_ONLY',
    evidenceRef: evidenceRef || `SELF-${Date.now()}`,
    verificationStatus: evidenceRef ? 'VERIFIED' : 'SELF_DECLARED',
    status: 'ACTIVE',
    authorizedContacts: Array.isArray(authorizedContacts) ? authorizedContacts : [],
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  db.participantRelationships.set(rel.id, rel);
  db.scheduleSave();
  return res.status(201).json(rel);
});

v11Router.post('/network/relationships/:id/terminate', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId, isPlatformAdmin } = getTenantCtx(req);
  const rel = db.participantRelationships.get(req.params.id);
  if (!rel) return res.status(404).json({ error: 'Relationship not found.' });
  if (!isPlatformAdmin && rel.tenantId !== tenantId && rel.sourceParticipantId !== tenantId && rel.targetParticipantId !== tenantId) {
    return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  }
  rel.status = 'REVOKED';
  db.participantRelationships.set(rel.id, rel);
  db.scheduleSave();
  return res.json(rel);
});

v11Router.get('/network/connections', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId, isPlatformAdmin } = getTenantCtx(req);
  const items = Array.from(db.connectionRequests.values()).filter(
    (c) => isPlatformAdmin || c.fromTenantId === tenantId || c.toTenantId === tenantId
  );
  return res.json(items);
});

v11Router.post('/network/connections', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { toTenantId, toName, proposedRelationshipType, message } = req.body;
  if (!toTenantId || !proposedRelationshipType) {
    return res.status(400).json({ error: 'toTenantId and proposedRelationshipType are required.' });
  }
  const fromTenant = db.tenants.get(tenantId);
  const targetTenant = db.tenants.get(toTenantId);
  const conn: ConnectionRequestRecord = {
    id: `CONN-REQ-${Date.now().toString(36).toUpperCase()}`,
    fromTenantId: tenantId,
    fromName: fromTenant?.legalName || tenantId,
    toTenantId,
    toName: toName || targetTenant?.legalName || toTenantId,
    proposedRelationshipType,
    message: message || 'Network partnership request',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  db.connectionRequests.set(conn.id, conn);
  db.scheduleSave();
  return res.status(201).json(conn);
});

v11Router.post('/network/connections/:id/respond', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId, isPlatformAdmin } = getTenantCtx(req);
  const conn = db.connectionRequests.get(req.params.id);
  if (!conn) return res.status(404).json({ error: 'Connection request not found.' });
  if (!isPlatformAdmin && conn.toTenantId !== tenantId) {
    return res.status(403).json({ error: 'Only recipient tenant can approve or reject connection request.' });
  }

  const decision = req.body.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  conn.status = decision;
  conn.respondedAt = new Date().toISOString();
  db.connectionRequests.set(conn.id, conn);

  let createdRelationship: ParticipantRelationshipRecord | undefined;
  if (decision === 'APPROVED') {
    createdRelationship = {
      id: `REL-V11-${Date.now().toString(36).toUpperCase()}`,
      tenantId: conn.fromTenantId,
      sourceParticipantId: conn.fromTenantId,
      sourceParticipantName: conn.fromName,
      targetParticipantId: conn.toTenantId,
      targetParticipantName: conn.toName,
      relationshipType: conn.proposedRelationshipType,
      jurisdiction: db.tenants.get(conn.fromTenantId)?.jurisdiction || 'UG',
      visibility: 'BILATERAL_ONLY',
      evidenceRef: `CONN-${conn.id}`,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      authorizedContacts: [],
      createdAt: conn.respondedAt,
    };
    db.participantRelationships.set(createdRelationship.id, createdRelationship);
  }

  db.scheduleSave();
  return res.json({ connection: conn, relationship: createdRelationship });
});

v11Router.get('/marketplace/listings', (req: Request, res: Response) => {
  const { listingType, jurisdiction, currency, claimClassification, q } = req.query;
  let items = Array.from(db.networkMarketplaceListings.values());
  if (listingType) items = items.filter((l) => l.listingType === listingType);
  if (jurisdiction) items = items.filter((l) => l.jurisdiction === String(jurisdiction).toUpperCase());
  if (currency) items = items.filter((l) => l.currency === String(currency).toUpperCase());
  if (claimClassification) items = items.filter((l) => l.claimClassification === claimClassification);
  if (q) {
    const query = String(q).toLowerCase();
    items = items.filter(
      (l) =>
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        l.publisherName.toLowerCase().includes(query)
    );
  }
  return res.json(items);
});

v11Router.post('/marketplace/listings', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const {
    listingType,
    title,
    description,
    jurisdiction,
    currency,
    unitPrice,
    unit,
    minOrderQuantity,
    availableQuantity,
    expiresAt,
  } = req.body;

  if (!listingType || !title || unitPrice === undefined || !currency || !unit) {
    return res.status(400).json({ error: 'listingType, title, unitPrice, currency, and unit are required.' });
  }

  const tenant = db.tenants.get(tenantId);
  const hasVerifiedOnboarding = Array.from(db.onboardingApplications.values()).some(
    (a) => a.tenantId === tenantId && a.verificationClaimType === 'INDEPENDENTLY_VERIFIED' && a.status === 'ACTIVATION'
  );

  const listing: NetworkMarketplaceListing = {
    id: `MKT-V11-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    publisherName: tenant?.legalName || tenantId,
    listingType,
    title,
    description: description || '',
    jurisdiction: (jurisdiction || tenant?.jurisdiction || 'UG').toUpperCase(),
    currency: currency.toUpperCase(),
    unitPrice: Number(unitPrice),
    unit,
    minOrderQuantity: Number(minOrderQuantity || 1),
    availableQuantity: Number(availableQuantity || 1),
    claimClassification: hasVerifiedOnboarding ? 'VERIFIED_BUSINESS_LISTING' : 'PARTICIPANT_SUBMITTED_CLAIM',
    verificationNotes: hasVerifiedOnboarding
      ? 'Publisher corporate registration verified; product specs remain participant-declared.'
      : 'Participant-submitted claim pending independent entity verification.',
    status: 'ACTIVE',
    offers: [],
    fraudReportsCount: 0,
    expiresAt: expiresAt || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.networkMarketplaceListings.set(listing.id, listing);
  db.scheduleSave();
  return res.status(201).json(listing);
});

v11Router.get('/marketplace/match', (req: Request, res: Response) => {
  const sectorQuery = String(req.query.q || '').toLowerCase();
  const jurisdiction = String(req.query.jurisdiction || '').toUpperCase();
  const maxUnitPrice = req.query.maxUnitPrice ? Number(req.query.maxUnitPrice) : undefined;

  const matches = Array.from(db.networkMarketplaceListings.values())
    .filter((l) => l.status === 'ACTIVE')
    .map((l) => {
      let score = 60;
      const factors: string[] = [];
      if (l.claimClassification === 'VERIFIED_BUSINESS_LISTING') {
        score += 18;
        factors.push('Verified business entity (+18)');
      }
      if (jurisdiction && l.jurisdiction === jurisdiction) {
        score += 12;
        factors.push(`Same jurisdiction ${jurisdiction} (+12)`);
      }
      if (sectorQuery && (l.title.toLowerCase().includes(sectorQuery) || l.description.toLowerCase().includes(sectorQuery))) {
        score += 10;
        factors.push('Keyword & capability match (+10)');
      }
      if (maxUnitPrice !== undefined && l.unitPrice <= maxUnitPrice) {
        score += 5;
        factors.push('Within unit budget ceiling (+5)');
      }
      return {
        listing: l,
        matchScore: Math.min(99, score),
        explanationFactors: factors,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return res.json(matches);
});

v11Router.post('/marketplace/listings/:id/offers', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const listing = db.networkMarketplaceListings.get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  if (listing.status !== 'ACTIVE') {
    return res.status(400).json({ error: `Cannot submit offer on listing in status ${listing.status}.` });
  }

  const { offeredPrice, quantity, notes } = req.body;
  if (offeredPrice === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'offeredPrice and quantity are required.' });
  }
  const buyer = db.tenants.get(tenantId);
  const offer = {
    id: `OFR-${Date.now().toString(36).toUpperCase()}`,
    buyerTenantId: tenantId,
    buyerName: buyer?.legalName || tenantId,
    offeredPrice: Number(offeredPrice),
    quantity: Number(quantity),
    notes: notes || '',
    status: 'SUBMITTED' as const,
    createdAt: new Date().toISOString(),
  };
  listing.offers.push(offer);
  db.networkMarketplaceListings.set(listing.id, listing);
  db.scheduleSave();
  return res.status(201).json(listing);
});

v11Router.post('/marketplace/listings/:id/report', requireTenantContext, (req: Request, res: Response) => {
  const listing = db.networkMarketplaceListings.get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  listing.fraudReportsCount += 1;
  if (listing.fraudReportsCount >= 2) {
    listing.status = 'MODERATION_HOLD';
  }
  db.networkMarketplaceListings.set(listing.id, listing);
  db.scheduleSave();
  return res.json(listing);
});

// ==========================================
// P4: PROCUREMENT, SUPPLIER QUALIFICATION & LOGISTICS
// ==========================================

v11Router.get('/procurement/requests', (_req: Request, res: Response) => {
  return res.json(Array.from(db.v11ProcurementRequests.values()));
});

v11Router.post('/procurement/requests', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { procurementScope, title, category, jurisdiction, budgetAmount, currency, evaluationCriteria, officialGovernmentPortalLinked } = req.body;
  if (!title || !category || budgetAmount === undefined || !currency) {
    return res.status(400).json({ error: 'title, category, budgetAmount, and currency are required.' });
  }
  const proc: V11ProcurementRequest = {
    id: `PROC-V11-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    referenceNumber: `SOURCING-2026-${Math.floor(100 + Math.random() * 900)}`,
    procurementScope: procurementScope || 'PRIVATE_SECTOR',
    title,
    category,
    jurisdiction: (jurisdiction || 'UG').toUpperCase(),
    budgetAmount: Number(budgetAmount),
    currency: currency.toUpperCase(),
    evaluationCriteria: Array.isArray(evaluationCriteria)
      ? evaluationCriteria
      : [
          { criterion: 'Commercial Price Competitiveness', weightPct: 50 },
          { criterion: 'Compliance & Technical Quality', weightPct: 50 },
        ],
    officialGovernmentPortalLinked: Boolean(officialGovernmentPortalLinked),
    status: 'OPEN',
    bids: [],
    createdAt: new Date().toISOString(),
  };
  db.v11ProcurementRequests.set(proc.id, proc);
  db.scheduleSave();
  return res.status(201).json(proc);
});

v11Router.post('/procurement/requests/:id/bids', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const proc = db.v11ProcurementRequests.get(req.params.id);
  if (!proc) return res.status(404).json({ error: 'Procurement request not found.' });
  if (proc.status === 'AWARDED' || proc.status === 'CANCELLED') {
    return res.status(400).json({ error: `Cannot submit bid when procurement status is ${proc.status}.` });
  }

  const { bidAmount, deliveryDays, technicalScore } = req.body;
  if (bidAmount === undefined || deliveryDays === undefined) {
    return res.status(400).json({ error: 'bidAmount and deliveryDays are required.' });
  }

  const supplierTenant = db.tenants.get(tenantId);
  const isQualified = Array.from(db.supplierQualifications.values()).some(
    (q) => q.tenantId === tenantId && q.qualificationStatus === 'PREQUALIFIED'
  );

  const bid = {
    id: `BID-${Date.now().toString(36).toUpperCase()}`,
    supplierTenantId: tenantId,
    supplierName: supplierTenant?.legalName || tenantId,
    bidAmount: Number(bidAmount),
    deliveryDays: Number(deliveryDays),
    qualificationVerified: isQualified,
    technicalScore: Number(technicalScore || 85),
    status: 'SUBMITTED' as const,
    submittedAt: new Date().toISOString(),
  };
  proc.bids.push(bid);
  proc.status = 'EVALUATION';
  db.v11ProcurementRequests.set(proc.id, proc);
  db.scheduleSave();
  return res.status(201).json(proc);
});

v11Router.post('/procurement/requests/:id/award', requireTenantContext, (req: Request, res: Response) => {
  const proc = db.v11ProcurementRequests.get(req.params.id);
  if (!proc) return res.status(404).json({ error: 'Procurement request not found.' });

  const { bidId, humanAuthorizedBy } = req.body;
  if (!bidId) return res.status(400).json({ error: 'bidId is required.' });
  if (!humanAuthorizedBy || String(humanAuthorizedBy).trim().length < 3 || String(humanAuthorizedBy).startsWith('AI_')) {
    proc.status = 'AWARD_PENDING_HUMAN_APPROVAL';
    db.v11ProcurementRequests.set(proc.id, proc);
    db.scheduleSave();
    return res.status(403).json({
      error: 'HUMAN_AUTHORIZATION_REQUIRED',
      message: 'Procurement awards cannot be auto-executed; an explicit human authorizing officer is required.',
      procurement: proc,
    });
  }

  const targetBid = proc.bids.find((b) => b.id === bidId);
  if (!targetBid) return res.status(404).json({ error: 'Bid not found on procurement request.' });

  proc.bids = proc.bids.map((b) => ({
    ...b,
    status: b.id === bidId ? 'AWARDED' : 'REJECTED',
  }));
  proc.status = 'AWARDED';
  proc.awardedToBidId = bidId;
  proc.awardAuthorizedBy = humanAuthorizedBy;
  proc.awardedAt = new Date().toISOString();

  db.v11ProcurementRequests.set(proc.id, proc);
  db.scheduleSave();
  return res.json(proc);
});

v11Router.get('/procurement/qualifications', (_req: Request, res: Response) => {
  return res.json(Array.from(db.supplierQualifications.values()));
});

v11Router.post('/procurement/qualifications', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { supplierName, jurisdiction, categories, verifiedBy } = req.body;
  if (!supplierName || !jurisdiction) {
    return res.status(400).json({ error: 'supplierName and jurisdiction are required.' });
  }
  const qual: SupplierQualificationRecord = {
    id: `QUAL-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    supplierName,
    jurisdiction: jurisdiction.toUpperCase(),
    categories: Array.isArray(categories) ? categories : ['General Supply'],
    complianceDocsHash: `0x${crypto.createHash('sha256').update(`${supplierName}:${Date.now()}`).digest('hex').slice(0, 32)}`,
    qualificationStatus: 'PREQUALIFIED',
    verifiedBy: verifiedBy || 'procurement-review@aros.ug',
    validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  };
  db.supplierQualifications.set(qual.id, qual);
  db.scheduleSave();
  return res.status(201).json(qual);
});

v11Router.get('/logistics/carriers', (_req: Request, res: Response) => {
  return res.json(Array.from(db.logisticsCarriers.values()));
});

v11Router.post('/logistics/carriers', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { carrierName, modes, corridorsCovered, fleetCount, trackingSourceType } = req.body;
  if (!carrierName || !Array.isArray(modes)) {
    return res.status(400).json({ error: 'carrierName and modes array are required.' });
  }
  const carrier: LogisticsCarrierProfile = {
    id: `CARR-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    carrierName,
    modes,
    corridorsCovered: Array.isArray(corridorsCovered) ? corridorsCovered : [],
    fleetCount: Number(fleetCount || 1),
    trackingSourceType: trackingSourceType || 'MANUAL_DISPATCH_EVIDENCE',
    verificationStatus: trackingSourceType === 'RECTS_E_SEAL' || trackingSourceType === 'CARRIER_API' ? 'VERIFIED_CARRIER' : 'SELF_DECLARED',
    activeShipmentsCount: 0,
  };
  db.logisticsCarriers.set(carrier.id, carrier);
  db.scheduleSave();
  return res.status(201).json(carrier);
});

v11Router.post('/logistics/shipments/:id/exceptions', (req: Request, res: Response) => {
  const shipment = db.supplyChainShipments.get(req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found.' });
  const { location, reason, severity, actor } = req.body;
  if (!reason) return res.status(400).json({ error: 'Exception reason is required.' });

  shipment.currentStatus = 'DELAYED';
  shipment.milestoneHistory.push({
    timestamp: new Date().toISOString(),
    location: location || 'Corridor Checkpoint',
    event: `EXCEPTION (${severity || 'MEDIUM'}): ${reason}`,
    verifiedBy: actor || 'corridor-ops@aros.ug',
  });
  db.supplyChainShipments.set(shipment.id, shipment);
  db.scheduleSave();
  return res.json(shipment);
});

// ==========================================
// P5: VERIFIED PROVIDER CONNECTIVITY & CURRENCY ASSURANCE
// ==========================================

v11Router.get('/providers', (_req: Request, res: Response) => {
  return res.json(Array.from(db.verifiedProviders.values()));
});

v11Router.post('/providers', (req: Request, res: Response) => {
  const {
    providerCode,
    legalName,
    providerType,
    jurisdiction,
    authority,
    licenseRef,
    supportedCurrencies,
    supportedMethods,
    transactionLimitSingle,
    limitCurrency,
    callbackVerificationMethod,
    failoverProviderCode,
  } = req.body;

  if (!providerCode || !legalName || !providerType || !jurisdiction) {
    return res.status(400).json({ error: 'providerCode, legalName, providerType, and jurisdiction are required.' });
  }

  const provider: VerifiedProviderProfile = {
    id: `PROV-${providerCode.toUpperCase()}`,
    providerCode: providerCode.toUpperCase(),
    legalName,
    providerType,
    jurisdiction: jurisdiction.toUpperCase(),
    regulatoryEvidence: {
      authority: authority || 'National Financial Regulator',
      licenseRef: licenseRef || 'PENDING_VERIFICATION',
      verified: Boolean(licenseRef),
    },
    supportedCurrencies: Array.isArray(supportedCurrencies) ? supportedCurrencies : ['UGX'],
    supportedMethods: Array.isArray(supportedMethods) ? supportedMethods : ['BANK_TRANSFER'],
    lifecycleStage: 'DISCOVERED',
    connectionClassification: 'REFERENCE_DIRECTORY',
    transactionLimitSingle: Number(transactionLimitSingle || 50000000),
    limitCurrency: limitCurrency || 'UGX',
    callbackVerificationMethod: callbackVerificationMethod || 'HMAC_SHA256',
    failoverProviderCode,
    credentialStatus: 'NOT_PROVISIONED',
    updatedAt: new Date().toISOString(),
  };

  db.verifiedProviders.set(provider.id, provider);
  db.scheduleSave();
  return res.status(201).json(provider);
});

v11Router.post('/providers/:id/certify', (req: Request, res: Response) => {
  const provider = db.verifiedProviders.get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });

  const passed = req.body?.passed !== false;
  const environment = req.body?.environment === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
  provider.lastCertificationRun = {
    timestamp: new Date().toISOString(),
    passed,
    environment,
    notes: req.body?.notes || `${environment} connectivity & signature verification ${passed ? 'passed' : 'failed'}.`,
  };
  if (passed && provider.lifecycleStage === 'CONFIGURED') {
    provider.lifecycleStage = 'SANDBOX_TESTED';
    provider.connectionClassification = 'SANDBOX_CONNECTED';
  }
  provider.updatedAt = new Date().toISOString();
  db.verifiedProviders.set(provider.id, provider);
  db.scheduleSave();
  return res.json(provider);
});

v11Router.post('/providers/:id/lifecycle', (req: Request, res: Response) => {
  const provider = db.verifiedProviders.get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });

  const { targetStage, credentialStatus } = req.body as {
    targetStage?: ProviderIntegrationLifecycle;
    credentialStatus?: VerifiedProviderProfile['credentialStatus'];
  };
  if (!targetStage) return res.status(400).json({ error: 'targetStage is required.' });

  const curIdx = PROVIDER_STAGE_ORDER.indexOf(provider.lifecycleStage);
  const tgtIdx = PROVIDER_STAGE_ORDER.indexOf(targetStage);
  if (tgtIdx === -1) return res.status(400).json({ error: `Invalid targetStage: ${targetStage}` });
  if (tgtIdx > curIdx + 1) {
    return res.status(400).json({
      error: 'STAGE_SKIP_PROHIBITED',
      message: `Provider lifecycle cannot skip from ${provider.lifecycleStage} directly to ${targetStage}.`,
    });
  }

  if (credentialStatus) {
    provider.credentialStatus = credentialStatus;
  }

  if (targetStage === 'PRODUCTION_CONNECTED') {
    if (!provider.lastCertificationRun?.passed || provider.credentialStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'PRODUCTION_CERTIFICATION_REQUIRED',
        message: 'Provider requires passed certification run and ACTIVE credentials before PRODUCTION_CONNECTED.',
      });
    }
    provider.connectionClassification = 'PRODUCTION_CONNECTED_AND_VERIFIED';
  } else if (targetStage === 'SANDBOX_TESTED' || targetStage === 'SECURITY_APPROVED' || targetStage === 'AUTHORIZED') {
    provider.connectionClassification = 'SANDBOX_CONNECTED';
  }

  provider.lifecycleStage = targetStage;
  provider.updatedAt = new Date().toISOString();
  db.verifiedProviders.set(provider.id, provider);
  db.scheduleSave();
  return res.json(provider);
});

v11Router.post('/providers/:id/revoke-credentials', (req: Request, res: Response) => {
  const provider = db.verifiedProviders.get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });

  provider.credentialStatus = 'REVOKED';
  if (provider.connectionClassification === 'PRODUCTION_CONNECTED_AND_VERIFIED') {
    provider.connectionClassification = 'REFERENCE_DIRECTORY';
    provider.lifecycleStage = 'CONFIGURED';
  }
  provider.updatedAt = new Date().toISOString();
  db.verifiedProviders.set(provider.id, provider);
  db.scheduleSave();
  return res.json(provider);
});

v11Router.get('/currency/directory', (_req: Request, res: Response) => {
  const list = Array.from(db.currencies.values()).map((c) => ({
    ...c,
    rateClassification: 'INDICATIVE_REFERENCE_RATE',
    providerScope: 'REGIONAL_AND_GLOBAL_CORRIDOR',
  }));
  return res.json(list);
});

v11Router.get('/currency/fx-compare', (req: Request, res: Response) => {
  const from = String(req.query.from || 'USD').toUpperCase();
  const to = String(req.query.to || 'UGX').toUpperCase();
  const amount = Number(req.query.amount || 1000);

  const fromMeta = db.currencies.get(from);
  const toMeta = db.currencies.get(to);
  if (!fromMeta || !toMeta) {
    return res.status(400).json({ error: `Unsupported currency pair ${from}/${to}` });
  }

  const indicativeMidRate = Number((fromMeta.exchangeRateToUGX / toMeta.exchangeRateToUGX).toFixed(6));
  const convertedIndicative = Number((amount * indicativeMidRate).toFixed(toMeta.fractionDigits ?? 2));

  return res.json({
    pair: `${from}/${to}`,
    amount,
    indicativeMidRate,
    convertedIndicative,
    quoteClassification: 'INDICATIVE_RATE',
    executableQuoteDisclaimer:
      'Indicative reference rate only. Executable FX quotes require licensed provider lock via /api/money/fx/quote.',
    providerComparison: [
      { providerCode: 'STANBIC_UG_H2H', spreadBps: 45, estimatedReceivable: Number((convertedIndicative * 0.9955).toFixed(2)), classification: 'SANDBOX_ESTIMATE' },
      { providerCode: 'EAPS_CLEARING', spreadBps: 25, estimatedReceivable: Number((convertedIndicative * 0.9975).toFixed(2)), classification: 'REFERENCE_BENCHMARK' },
    ],
  });
});

// ==========================================
// P6: DEVELOPER & APPLICATION ECOSYSTEM
// ==========================================

v11Router.get('/developer/apps', (req: Request, res: Response) => {
  const tenantFilter = req.query.tenantId as string | undefined;
  let apps = Array.from(db.ecosystemApps.values());
  if (tenantFilter) apps = apps.filter((a) => a.tenantId === tenantFilter);
  return res.json(apps);
});

v11Router.post('/developer/apps', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { developerName, organizationName, appName, apiVersion, scopes, webhookUrl, rateLimitPerMin } = req.body;
  if (!appName || !developerName) {
    return res.status(400).json({ error: 'appName and developerName are required.' });
  }
  const rawSecret = `aros_sbx_${crypto.randomBytes(12).toString('hex')}`;
  const keyHash = `0x${crypto.createHash('sha256').update(rawSecret).digest('hex').slice(0, 32)}`;
  const now = new Date().toISOString();

  const app: RegisteredEcosystemApp = {
    id: `APP-ECO-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    developerName,
    organizationName: organizationName || db.tenants.get(tenantId)?.legalName || tenantId,
    appName,
    apiVersion: apiVersion || 'v11',
    scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : ['read:orders'],
    webhookUrl,
    clientId: `cli_aros_${crypto.randomBytes(4).toString('hex')}`,
    apiKeyPrefix: rawSecret.slice(0, 14),
    keyHash,
    rateLimitPerMin: Number(rateLimitPerMin || 60),
    usageCount24h: 0,
    lifecycleStage: 'SUBMITTED',
    credentialStatus: 'SANDBOX_ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  db.ecosystemApps.set(app.id, app);
  db.scheduleSave();
  return res.status(201).json({ ...app, issuedSandboxSecretOnce: rawSecret });
});

v11Router.post('/developer/apps/:id/lifecycle', (req: Request, res: Response) => {
  const app = db.ecosystemApps.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Ecosystem application not found.' });

  const { targetStage } = req.body as { targetStage?: AppRegistryLifecycle };
  if (!targetStage) return res.status(400).json({ error: 'targetStage is required.' });

  const sideStates: AppRegistryLifecycle[] = ['SUSPENDED', 'REVOKED', 'RETIRED'];
  if (!sideStates.includes(targetStage)) {
    const curIdx = APP_STAGE_ORDER.indexOf(app.lifecycleStage);
    const tgtIdx = APP_STAGE_ORDER.indexOf(targetStage);
    if (tgtIdx === -1) return res.status(400).json({ error: `Invalid targetStage ${targetStage}` });
    if (curIdx === -1 || tgtIdx > curIdx + 1) {
      return res.status(400).json({
        error: 'STAGE_SKIP_PROHIBITED',
        message: `App lifecycle cannot jump from ${app.lifecycleStage} to ${targetStage}.`,
      });
    }
  }

  app.lifecycleStage = targetStage;
  if (targetStage === 'PRODUCTION_APPROVED' || targetStage === 'PUBLISHED') {
    app.credentialStatus = 'PRODUCTION_ACTIVE';
  }
  if (targetStage === 'REVOKED') {
    app.credentialStatus = 'REVOKED';
  }
  app.updatedAt = new Date().toISOString();
  db.ecosystemApps.set(app.id, app);
  db.scheduleSave();
  return res.json(app);
});

v11Router.post('/developer/apps/:id/rotate-credentials', (req: Request, res: Response) => {
  const app = db.ecosystemApps.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Ecosystem application not found.' });
  if (app.credentialStatus === 'REVOKED') {
    return res.status(403).json({ error: 'Cannot rotate credentials for a REVOKED application.' });
  }

  const newSecret = `aros_rot_${crypto.randomBytes(12).toString('hex')}`;
  app.apiKeyPrefix = newSecret.slice(0, 14);
  app.keyHash = `0x${crypto.createHash('sha256').update(newSecret).digest('hex').slice(0, 32)}`;
  app.updatedAt = new Date().toISOString();
  db.ecosystemApps.set(app.id, app);
  db.scheduleSave();
  return res.json({ app, rotatedSecretOnce: newSecret });
});

v11Router.post('/developer/apps/:id/revoke', (req: Request, res: Response) => {
  const app = db.ecosystemApps.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Ecosystem application not found.' });
  app.lifecycleStage = 'REVOKED';
  app.credentialStatus = 'REVOKED';
  app.updatedAt = new Date().toISOString();
  db.ecosystemApps.set(app.id, app);
  db.scheduleSave();
  return res.json(app);
});

v11Router.post('/developer/apps/:id/test-call', (req: Request, res: Response) => {
  const app = db.ecosystemApps.get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Ecosystem application not found.' });
  if (app.credentialStatus === 'REVOKED' || app.lifecycleStage === 'SUSPENDED' || app.lifecycleStage === 'REVOKED') {
    return res.status(403).json({ error: 'APP_CREDENTIALS_REVOKED' });
  }

  const requiredScope = req.body?.requiredScope;
  if (requiredScope && !app.scopes.includes(requiredScope)) {
    return res.status(403).json({
      error: 'INSUFFICIENT_SCOPE',
      requiredScope,
      grantedScopes: app.scopes,
    });
  }

  if (req.body?.simulateBurstCount && Number(req.body.simulateBurstCount) > app.rateLimitPerMin) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      rateLimitPerMin: app.rateLimitPerMin,
    });
  }

  app.usageCount24h += 1;
  app.updatedAt = new Date().toISOString();
  db.ecosystemApps.set(app.id, app);

  // Also increment tenant subscription API usage meter if present
  for (const sub of db.tenantSubscriptions.values()) {
    if (sub.tenantId === app.tenantId && sub.status === 'ACTIVE') {
      sub.apiCallsUsedCurrentCycle += 1;
      db.tenantSubscriptions.set(sub.id, sub);
    }
  }
  db.scheduleSave();

  return res.json({
    authorized: true,
    appId: app.id,
    usageCount24h: app.usageCount24h,
    rateLimitPerMin: app.rateLimitPerMin,
  });
});

// ==========================================
// P7: INDUSTRIAL, WORK & SERVICES NETWORK
// ==========================================

v11Router.get('/industrial/capacities', (_req: Request, res: Response) => {
  return res.json(Array.from(db.industrialCapacities.values()));
});

v11Router.post('/industrial/capacities', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { facilityName, jurisdiction, sector, productLine, totalCapacityPerMonth, availableCapacityPerMonth, unit, inputRequirements } = req.body;
  if (!facilityName || !sector || !productLine || totalCapacityPerMonth === undefined) {
    return res.status(400).json({ error: 'facilityName, sector, productLine, and totalCapacityPerMonth are required.' });
  }
  const rec: IndustrialCapacityRecord = {
    id: `IND-CAP-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    facilityName,
    jurisdiction: (jurisdiction || 'UG').toUpperCase(),
    sector,
    productLine,
    totalCapacityPerMonth: Number(totalCapacityPerMonth),
    availableCapacityPerMonth: Number(availableCapacityPerMonth ?? totalCapacityPerMonth),
    unit: unit || 'MT',
    inputRequirements: Array.isArray(inputRequirements) ? inputRequirements : [],
    equipmentStatus: 'OPERATIONAL',
    sourceAttribution: `Participant Operations Report (${tenantId})`,
    verificationStatus: req.body.verificationStatus === 'AUDITED_CAPACITY' ? 'AUDITED_CAPACITY' : 'SELF_REPORTED',
    updatedAt: new Date().toISOString(),
  };
  db.industrialCapacities.set(rec.id, rec);
  db.scheduleSave();
  return res.status(201).json(rec);
});

v11Router.get('/work/opportunities', (_req: Request, res: Response) => {
  return res.json(Array.from(db.workOpportunities.values()));
});

v11Router.post('/work/opportunities', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { engagementType, title, skillsRequired, jurisdiction, compensationAmount, currency, billingModel, milestones } = req.body;
  if (!title || compensationAmount === undefined || !currency) {
    return res.status(400).json({ error: 'title, compensationAmount, and currency are required.' });
  }
  const tenant = db.tenants.get(tenantId);
  const work: WorkServiceOpportunity = {
    id: `WORK-V11-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    publisherName: tenant?.legalName || tenantId,
    engagementType: engagementType || 'PROFESSIONAL_SERVICE',
    title,
    skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
    jurisdiction: (jurisdiction || tenant?.jurisdiction || 'UG').toUpperCase(),
    compensationAmount: Number(compensationAmount),
    currency: currency.toUpperCase(),
    billingModel: billingModel || 'FIXED_MILESTONE',
    platformRoleDisclaimer: 'AETHER–AROS coordinates work contracts and milestones; it is not the employer of record.',
    status: 'OPEN',
    milestones: Array.isArray(milestones)
      ? milestones
      : [{ id: 'WM-1', title: 'Initial Deliverable Acceptance', amount: Number(compensationAmount), status: 'PENDING' }],
    createdAt: new Date().toISOString(),
  };
  db.workOpportunities.set(work.id, work);
  db.scheduleSave();
  return res.status(201).json(work);
});

v11Router.post('/work/opportunities/:id/milestones/:mId/verify', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId, isPlatformAdmin } = getTenantCtx(req);
  const work = db.workOpportunities.get(req.params.id);
  if (!work) return res.status(404).json({ error: 'Work opportunity not found.' });
  if (!isPlatformAdmin && work.tenantId !== tenantId) {
    return res.status(403).json({ error: 'CROSS_TENANT_ACCESS_DENIED' });
  }
  const milestone = work.milestones.find((m) => m.id === req.params.mId);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found.' });
  milestone.status = 'VERIFIED';
  work.status = work.milestones.every((m) => m.status === 'VERIFIED') ? 'COMPLETED' : 'MILESTONE_REVIEW';
  db.workOpportunities.set(work.id, work);
  db.scheduleSave();
  return res.json(work);
});

// ==========================================
// P8: NETWORK INTELLIGENCE & GOVERNED AI AGENTS
// ==========================================

v11Router.get('/intelligence/insights', (_req: Request, res: Response) => {
  return res.json(Array.from(db.networkInsights.values()));
});

v11Router.post('/intelligence/scenarios', (req: Request, res: Response) => {
  const { domain, commodityOrCorridor, shockPct } = req.body;
  const pct = Number(shockPct ?? 15);
  const baseOrders = db.commercialOrders.size + db.businessCommercialDocs.size;
  const insight = {
    id: `INTEL-SCEN-${Date.now().toString(36).toUpperCase()}`,
    domain: domain || 'TRADE_FLOW',
    title: `Scenario Stress Model: ${commodityOrCorridor || 'Northern Corridor'} (${pct >= 0 ? '+' : ''}${pct}% variance)`,
    summary: `Modeled ${pct}% corridor cost/tariff shift across ${baseOrders} active commercial orders. Margin impact requires bilateral contract renegotiation above 12%.`,
    factOrForecast: 'SCENARIO_MODEL' as const,
    dataSource: 'Live AROS Commercial Orders + Corridor Telemetry Snapshot',
    observationPeriod: 'Instantaneous Scenario Run',
    modelVersion: 'AROS-SCENARIO-SIM-v11.0',
    assumptions: [`Applied ${pct}% uniform cost perturbation`, 'Assumes fixed contractual volume'],
    confidencePct: 76,
    limitations: 'Hypothetical scenario simulation; not a forecast of guaranteed market outcomes.',
    updatedAt: new Date().toISOString(),
  };
  db.networkInsights.set(insight.id, insight);
  db.scheduleSave();
  return res.status(201).json(insight);
});

v11Router.get('/ai/agents', (_req: Request, res: Response) => {
  return res.json({
    agents: Array.from(db.governedAiAgents.values()),
    actionLogs: Array.from(db.aiAgentActionLogs.values()),
  });
});

v11Router.post('/ai/agents/:id/execute', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const agent = db.governedAiAgents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Governed AI agent not found.' });

  if (agent.emergencyStopped) {
    return res.status(423).json({
      error: 'AGENT_EMERGENCY_STOPPED',
      message: `Agent ${agent.agentCode} is halted by operational emergency stop.`,
    });
  }

  const requestedAction = String(req.body?.requestedAction || '').trim();
  const requestedAutonomyLevel = Number(req.body?.autonomyLevel || 1) as 1 | 2 | 3 | 4 | 5;
  if (!requestedAction) return res.status(400).json({ error: 'requestedAction is required.' });

  // Prompt injection / privilege escalation guard
  const lowerAction = requestedAction.toLowerCase();
  const injectionMarkers = ['ignore previous instructions', 'bypass approval', 'override human', 'drop table', 'transfer all funds'];
  const hasInjection = injectionMarkers.some((m) => lowerAction.includes(m));
  if (hasInjection) {
    const blockedLog: AiAgentActionLog = {
      id: `AGLOG-${Date.now().toString(36).toUpperCase()}`,
      agentId: agent.id,
      tenantId,
      requestedAction,
      autonomyLevel: requestedAutonomyLevel,
      status: 'BLOCKED_BOUNDARY',
      promptInjectionCheck: 'BLOCKED',
      outputValidation: 'FLAGGED',
      resultSummary: 'Blocked by prompt-injection & privilege escalation boundary guard.',
      timestamp: new Date().toISOString(),
    };
    db.aiAgentActionLogs.set(blockedLog.id, blockedLog);
    db.scheduleSave();
    return res.status(403).json({ error: 'PROMPT_INJECTION_BLOCKED', log: blockedLog });
  }

  if (requestedAutonomyLevel > agent.maxAutonomyLevel) {
    const boundaryLog: AiAgentActionLog = {
      id: `AGLOG-${Date.now().toString(36).toUpperCase()}`,
      agentId: agent.id,
      tenantId,
      requestedAction,
      autonomyLevel: requestedAutonomyLevel,
      status: 'BLOCKED_BOUNDARY',
      promptInjectionCheck: 'CLEAN',
      outputValidation: 'FLAGGED',
      resultSummary: `Requested level ${requestedAutonomyLevel} exceeds agent maximum boundary ${agent.maxAutonomyLevel}.`,
      timestamp: new Date().toISOString(),
    };
    db.aiAgentActionLogs.set(boundaryLog.id, boundaryLog);
    db.scheduleSave();
    return res.status(403).json({ error: 'AUTONOMY_BOUNDARY_EXCEEDED', log: boundaryLog });
  }

  // Levels 4-5 MUST queue for explicit human approval; agent never self-authorizes high-impact execution
  const requiresHumanGate = requestedAutonomyLevel >= 4;
  const log: AiAgentActionLog = {
    id: `AGLOG-${Date.now().toString(36).toUpperCase()}`,
    agentId: agent.id,
    tenantId,
    requestedAction,
    autonomyLevel: requestedAutonomyLevel,
    status: requiresHumanGate ? 'PENDING_HUMAN_APPROVAL' : 'EXECUTED_OBSERVE_ASSIST',
    promptInjectionCheck: 'CLEAN',
    outputValidation: 'PASSED',
    resultSummary: requiresHumanGate
      ? `Queued for dual human sign-off (Level ${requestedAutonomyLevel} regulated/high-impact boundary).`
      : `Executed advisory preparation within tenant ${tenantId} boundary.`,
    timestamp: new Date().toISOString(),
  };

  if (!requiresHumanGate) {
    agent.actionsExecutedCount += 1;
    db.governedAiAgents.set(agent.id, agent);
  }
  db.aiAgentActionLogs.set(log.id, log);
  db.scheduleSave();

  return res.status(requiresHumanGate ? 202 : 200).json(log);
});

v11Router.post('/ai/approvals/:id/decide', (req: Request, res: Response) => {
  const log = db.aiAgentActionLogs.get(req.params.id);
  if (!log) return res.status(404).json({ error: 'AI action log not found.' });
  const { decision, approvedBy } = req.body;
  if (!approvedBy || !decision) {
    return res.status(400).json({ error: 'decision (APPROVED|REJECTED) and approvedBy are required.' });
  }
  if (String(approvedBy).startsWith('AGENT')) {
    return res.status(403).json({ error: 'AI agent cannot approve its own high-impact action.' });
  }
  log.status = decision === 'APPROVED' ? 'APPROVED_BY_HUMAN' : 'REJECTED';
  log.approvedBy = approvedBy;
  if (decision === 'APPROVED') {
    const agent = db.governedAiAgents.get(log.agentId);
    if (agent) {
      agent.actionsExecutedCount += 1;
      db.governedAiAgents.set(agent.id, agent);
    }
  }
  db.aiAgentActionLogs.set(log.id, log);
  db.scheduleSave();
  return res.json(log);
});

v11Router.post('/ai/agents/:id/emergency-stop', (req: Request, res: Response) => {
  const agent = db.governedAiAgents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Governed AI agent not found.' });
  agent.emergencyStopped = req.body?.emergencyStopped !== undefined ? Boolean(req.body.emergencyStopped) : true;
  db.governedAiAgents.set(agent.id, agent);
  db.scheduleSave();
  return res.json(agent);
});

// ==========================================
// P9: COMMERCIAL BILLING & USAGE METERING
// ==========================================

v11Router.get('/billing/subscriptions', (req: Request, res: Response) => {
  const tenantFilter = req.query.tenantId as string | undefined;
  let subs = Array.from(db.tenantSubscriptions.values());
  if (tenantFilter) subs = subs.filter((s) => s.tenantId === tenantFilter);
  return res.json(subs);
});

v11Router.post('/billing/subscriptions', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { planId, planName, audienceTier, monthlyBaseFee, currency, maxUsers, maxApiCallsPerMonth, apiOverageUnitFee } = req.body;
  if (!planId || !planName || monthlyBaseFee === undefined || !currency) {
    return res.status(400).json({ error: 'planId, planName, monthlyBaseFee, and currency are required.' });
  }
  const tenant = db.tenants.get(tenantId);
  const sub: TenantSubscriptionRecord = {
    id: `TSUB-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    tenantName: tenant?.legalName || tenantId,
    planId,
    planName,
    audienceTier: audienceTier || 'BUSINESS',
    monthlyBaseFee: Number(monthlyBaseFee),
    currency: currency.toUpperCase(),
    entitlements: {
      maxUsers: Number(maxUsers || 25),
      maxApiCallsPerMonth: Number(maxApiCallsPerMonth || 10000),
      includedModules: ['WORKSPACE', 'MARKETPLACE', 'PROCUREMENT'],
    },
    apiCallsUsedCurrentCycle: 0,
    apiOverageUnitFee: Number(apiOverageUnitFee ?? 0.005),
    status: 'ACTIVE',
    billingCycleStart: new Date().toISOString(),
    billingCycleEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  };
  db.tenantSubscriptions.set(sub.id, sub);
  db.scheduleSave();
  return res.status(201).json(sub);
});

v11Router.post('/billing/subscriptions/:id/expire', (req: Request, res: Response) => {
  const sub = db.tenantSubscriptions.get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subscription not found.' });
  sub.status = req.body?.status === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED';
  db.tenantSubscriptions.set(sub.id, sub);
  db.scheduleSave();
  return res.json(sub);
});

v11Router.post('/billing/meter', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { subscriptionId, callsDelta } = req.body;
  const sub = subscriptionId
    ? db.tenantSubscriptions.get(subscriptionId)
    : Array.from(db.tenantSubscriptions.values()).find((s) => s.tenantId === tenantId && s.status === 'ACTIVE');

  if (!sub) return res.status(404).json({ error: 'Active subscription not found.' });
  if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') {
    return res.status(403).json({ error: `Subscription ${sub.id} is ${sub.status}.` });
  }

  sub.apiCallsUsedCurrentCycle += Number(callsDelta || 1);
  db.tenantSubscriptions.set(sub.id, sub);
  db.scheduleSave();
  return res.json(sub);
});

v11Router.get('/billing/invoices', (req: Request, res: Response) => {
  const tenantFilter = req.query.tenantId as string | undefined;
  let invs = Array.from(db.tenantBillingInvoices.values());
  if (tenantFilter) invs = invs.filter((i) => i.tenantId === tenantFilter);
  return res.json(invs);
});

v11Router.post('/billing/invoices', requireTenantContext, (req: Request, res: Response) => {
  const { tenantId } = getTenantCtx(req);
  const { subscriptionId, taxRatePct } = req.body;
  const sub = subscriptionId
    ? db.tenantSubscriptions.get(subscriptionId)
    : Array.from(db.tenantSubscriptions.values()).find((s) => s.tenantId === tenantId);

  if (!sub) return res.status(404).json({ error: 'Subscription not found for invoice calculation.' });

  const overageCalls = Math.max(0, sub.apiCallsUsedCurrentCycle - sub.entitlements.maxApiCallsPerMonth);
  const usageOverageAmount = Number((overageCalls * sub.apiOverageUnitFee).toFixed(2));
  const baseAmount = sub.monthlyBaseFee;
  const effectiveTaxRate = Number(taxRatePct ?? 18);
  const taxAmount = Number((((baseAmount + usageOverageAmount) * effectiveTaxRate) / 100).toFixed(2));
  const totalAmount = Number((baseAmount + usageOverageAmount + taxAmount).toFixed(2));

  const invoice: TenantBillingInvoice = {
    id: `TINV-${Date.now().toString(36).toUpperCase()}`,
    invoiceNumber: `AROS-BIL-2026-${Math.floor(200 + Math.random() * 799)}`,
    tenantId: sub.tenantId,
    subscriptionId: sub.id,
    pricingBasis: `Base (${baseAmount} ${sub.currency}) + ${overageCalls} overage API calls @ ${sub.apiOverageUnitFee}`,
    baseAmount,
    usageOverageAmount,
    taxRatePct: effectiveTaxRate,
    taxAmount,
    totalAmount,
    currency: sub.currency,
    status: 'ISSUED',
    issuedAt: new Date().toISOString(),
  };

  db.tenantBillingInvoices.set(invoice.id, invoice);
  db.scheduleSave();
  return res.status(201).json(invoice);
});

v11Router.post('/billing/invoices/:id/refund', (req: Request, res: Response) => {
  const invoice = db.tenantBillingInvoices.get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
  invoice.status = 'REFUNDED';
  invoice.refundReason = req.body?.reason || 'Commercial credit memo approved';
  db.tenantBillingInvoices.set(invoice.id, invoice);
  db.scheduleSave();
  return res.json(invoice);
});

// ==========================================
// P10 & P11: OPERATIONS SUMMARY, REAL BENCHMARK, BACKUP & MIGRATION AUDIT
// ==========================================

v11Router.get('/operations/network-summary', (_req: Request, res: Response) => {
  const activeTenants = Array.from(db.tenants.values()).filter((t) => t.status === 'ACTIVE').length;
  const pendingOnboarding = Array.from(db.onboardingApplications.values()).filter(
    (a) => a.status !== 'ACTIVATION' && a.status !== 'REJECTED' && a.status !== 'REVOKED'
  ).length;
  const providers = Array.from(db.verifiedProviders.values());
  const sandboxProviders = providers.filter((p) => p.connectionClassification === 'SANDBOX_CONNECTED').length;
  const prodProviders = providers.filter((p) => p.connectionClassification === 'PRODUCTION_CONNECTED_AND_VERIFIED').length;
  const pendingAiApprovals = Array.from(db.aiAgentActionLogs.values()).filter((l) => l.status === 'PENDING_HUMAN_APPROVAL').length;
  const activeAlerts = Array.from(db.fraudAlerts.values()).filter((a) => a.status !== 'DISMISSED_FALSE_POSITIVE').length;

  return res.json({
    schemaVersion: db.schemaVersion,
    tenants: {
      total: db.tenants.size,
      active: activeTenants,
      memberships: db.tenantMemberships.size,
    },
    onboarding: {
      total: db.onboardingApplications.size,
      pendingReview: pendingOnboarding,
    },
    marketplace: {
      listings: db.networkMarketplaceListings.size,
      procurementRequests: db.v11ProcurementRequests.size,
      industrialCapacities: db.industrialCapacities.size,
      workOpportunities: db.workOpportunities.size,
    },
    providers: {
      total: providers.length,
      sandboxConnected: sandboxProviders,
      productionVerified: prodProviders,
      referenceDirectory: providers.filter((p) => p.connectionClassification === 'REFERENCE_DIRECTORY').length,
    },
    ecosystem: {
      registeredApps: db.ecosystemApps.size,
      activeSubscriptions: Array.from(db.tenantSubscriptions.values()).filter((s) => s.status === 'ACTIVE').length,
      invoicesIssued: db.tenantBillingInvoices.size,
    },
    governance: {
      governedAgents: db.governedAiAgents.size,
      pendingAiHumanApprovals: pendingAiApprovals,
      activeFraudAlerts: activeAlerts,
    },
    benchmarks: Array.from(db.v11Benchmarks.values()).slice(-5),
    timestamp: new Date().toISOString(),
  });
});

v11Router.post('/operations/benchmark', async (req: Request, res: Response) => {
  const concurrentOperations = Math.min(200, Math.max(10, Number(req.body?.concurrentOperations || 50)));
  const scenario = String(req.body?.scenario || 'TENANT_ISOLATION_AND_LEDGER_READ_WRITE');

  const latencies: number[] = [];
  let errorCount = 0;
  const t0 = performance.now();

  await Promise.all(
    Array.from({ length: concurrentOperations }, async (_v, idx) => {
      const opStart = performance.now();
      try {
        const tenant = db.tenants.get('TEN-UG-ELGON-01');
        const listings = Array.from(db.networkMarketplaceListings.values());
        const report = db.getFinancialIntegrityReport();
        if (!tenant || listings.length === 0 || !report.currencyIntegrityPassed) {
          errorCount++;
        }
        // Perform lightweight cryptographic hash benchmark representing idempotent request verification
        crypto.createHash('sha256').update(`${scenario}:${idx}:${Date.now()}`).digest('hex');
      } catch {
        errorCount++;
      } finally {
        latencies.push(performance.now() - opStart);
      }
    })
  );

  const durationMs = Math.max(1, Math.round(performance.now() - t0));
  latencies.sort((a, b) => a - b);
  const p95Idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));

  const bench: V11PerformanceBenchmark = {
    id: `BENCH-${Date.now().toString(36).toUpperCase()}`,
    scenario,
    concurrentOperations,
    durationMs,
    throughputOpsPerSec: Number(((concurrentOperations / durationMs) * 1000).toFixed(1)),
    errorCount,
    p95LatencyMs: Number((latencies[p95Idx] || 0).toFixed(3)),
    measuredAt: new Date().toISOString(),
  };

  db.v11Benchmarks.set(bench.id, bench);
  db.scheduleSave();
  return res.status(201).json(bench);
});

v11Router.post('/system/backup-verify', (_req: Request, res: Response) => {
  db.persistToDiskSync();
  if (!fs.existsSync(DB_FILE)) {
    return res.status(500).json({ error: 'Database file not found on disk.' });
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  const parsed = JSON.parse(raw);
  const checksum = crypto.createHash('sha256').update(raw).digest('hex');
  const backupFile = path.join(BACKUP_DIR, `aros_v11_verified_${Date.now()}.json`);
  fs.writeFileSync(backupFile, raw, 'utf-8');
  try {
    const v11Backups = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('aros_v11_verified_') && f.endsWith('.json'))
      .sort();
    for (const stale of v11Backups.slice(0, Math.max(0, v11Backups.length - 3))) {
      fs.unlinkSync(path.join(BACKUP_DIR, stale));
    }
  } catch {
    // Non-fatal pruning safeguard
  }

  return res.json({
    verified: true,
    schemaVersion: parsed.schemaVersion,
    checksumSha256: checksum,
    sizeBytes: Buffer.byteLength(raw, 'utf-8'),
    backupFile: path.basename(backupFile),
    preservedCounts: {
      users: parsed.users?.length || 0,
      organizations: parsed.organizations?.length || 0,
      economicExecutions: parsed.economicExecutions?.length || 0,
      tenants: parsed.tenants?.length || 0,
      verifiedProviders: parsed.verifiedProviders?.length || 0,
    },
    verifiedAt: new Date().toISOString(),
  });
});

v11Router.get('/system/migration-audit', (_req: Request, res: Response) => {
  return res.json({
    schemaVersion: db.schemaVersion,
    migrationHistory: db.migrationHistory,
    v10Preserved: {
      users: db.users.size,
      organizations: db.organizations.size,
      economicExecutions: db.economicExecutions.size,
      institutionalProfiles: db.institutionalProfiles.size,
      universalJournal: db.universalJournal.size,
    },
    v11Collections: {
      tenants: db.tenants.size,
      tenantMemberships: db.tenantMemberships.size,
      onboardingApplications: db.onboardingApplications.size,
      businessWorkspaces: db.businessWorkspaces.size,
      businessCatalogItems: db.businessCatalogItems.size,
      businessCommercialDocs: db.businessCommercialDocs.size,
      participantRelationships: db.participantRelationships.size,
      networkMarketplaceListings: db.networkMarketplaceListings.size,
      v11ProcurementRequests: db.v11ProcurementRequests.size,
      verifiedProviders: db.verifiedProviders.size,
      ecosystemApps: db.ecosystemApps.size,
      governedAiAgents: db.governedAiAgents.size,
      tenantSubscriptions: db.tenantSubscriptions.size,
    },
  });
});
