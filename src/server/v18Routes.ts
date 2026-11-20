/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V18.0 - System Navigation, Scoped Global Search, Unified Tasks & Admin Control Center API (/api/v18/*)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { getV17GatesSummary } from './v17NetworkOps.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import {
  NAVIGATION_REGISTRY,
  getAuthorizedNavGroups,
  hasRolePermission,
  meetsExperienceMode,
  resolveRouteToNavItem,
  searchNavRegistry,
  type ExperienceModeLevel,
} from '../navigation/navigationRegistry.ts';
import type {
  UserRole,
  V18AdminControlSummary,
  V18SearchResult,
  V18TaskBucket,
  V18UnifiedTask,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'aros_database.json');

export const v18Router = Router();

interface V18Context {
  tenantId: string;
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
}

const RATE_WINDOW = new Map<string, number[]>();

function cleanText(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

function checkV18RateLimit(req: Request, res: Response, next: NextFunction) {
  const key = (req.headers['x-user-id'] as string) || req.ip || 'anon';
  const now = Date.now();
  const list = (RATE_WINDOW.get(key) || []).filter((ts) => now - ts < 60_000);
  if (list.length >= 600) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests in 60s window.',
    });
  }
  list.push(now);
  RATE_WINDOW.set(key, list);
  return next();
}

function recordV18SecurityIncident(
  category: any,
  severity: any,
  tenantId: string,
  actorId: string | undefined,
  details: string
) {
  const id = `SECINC-V18-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
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

function resolveV18Actor(req: Request): {
  userId?: string;
  role: UserRole;
  isPlatformAdmin: boolean;
} {
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
  const validRoles: UserRole[] = [
    'FARMER',
    'BUYER',
    'AGRO_DEALER',
    'COOPERATIVE_ADMIN',
    'TRANSPORTER',
    'PLATFORM_ADMIN',
  ];
  const finalRole: UserRole = validRoles.includes(role as UserRole)
    ? (role as UserRole)
    : 'FARMER';
  return {
    userId,
    role: finalRole,
    isPlatformAdmin: finalRole === 'PLATFORM_ADMIN',
  };
}

function requireV18Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV18Actor(req);
  if (!actor.userId) {
    recordV18SecurityIncident(
      'AUTH_FAILURE_BURST',
      'MEDIUM',
      'GLOBAL_PUBLIC',
      undefined,
      `Unauthenticated V18 request blocked on ${req.path}`
    );
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V18 APIs.',
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
    recordV18SecurityIncident(
      'CROSS_TENANT_ACCESS',
      'HIGH',
      requestedTenantId,
      actor.userId,
      `Cross-tenant access blocked on V18 ${req.path}: header=${headerTenant}, param=${explicitParamTenant}`
    );
    return res.status(403).json({
      error: 'CROSS_TENANT_ACCESS_BLOCKED',
      message: `Access denied across tenant boundary (${headerTenant} vs ${explicitParamTenant}).`,
    });
  }

  (req as any).v18Context = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } as V18Context;
  return next();
}

function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as any).v18Context as V18Context;
  if (!ctx?.isPlatformAdmin) {
    recordV18SecurityIncident(
      'RBAC_ESCALATION',
      'HIGH',
      ctx?.tenantId || 'GLOBAL_PUBLIC',
      ctx?.userId,
      `Unauthorized V18 admin attempt on ${req.path} by role=${ctx?.role || 'UNKNOWN'}`
    );
    return res.status(403).json({
      error: 'FORBIDDEN_ADMIN_ONLY',
      message: 'PLATFORM_ADMIN role required for this V18 administrative operation.',
    });
  }
  return next();
}

function getCtx(req: Request): V18Context {
  return (req as any).v18Context;
}

function resolveMode(rawMode: unknown, role: UserRole): ExperienceModeLevel {
  const candidate = String(rawMode || '').toUpperCase();
  if (candidate === 'ADMINISTRATOR' && role === 'PLATFORM_ADMIN') return 'ADMINISTRATOR';
  if (
    candidate === 'PROFESSIONAL' &&
    (role === 'PLATFORM_ADMIN' ||
      role === 'COOPERATIVE_ADMIN' ||
      role === 'BUYER' ||
      role === 'TRANSPORTER')
  ) {
    return 'PROFESSIONAL';
  }
  if (candidate === 'STANDARD') return 'STANDARD';
  return role === 'PLATFORM_ADMIN' ? 'ADMINISTRATOR' : 'STANDARD';
}

function getMyParticipantIds(userId: string): Set<string> {
  const ids = new Set<string>();
  for (const p of db.v17Participants.values()) {
    if (p.userId === userId) ids.add(p.id);
  }
  return ids;
}

v18Router.use(checkV18RateLimit);
v18Router.use(requireV18Context);

// 1. Authoritative Navigation Registry & Server-Side Route Authorization
v18Router.get('/navigation/registry', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const mode = resolveMode(req.query.mode, ctx.role);
  const includeAll = req.query.includeAllPermitted === 'true';
  const groups = getAuthorizedNavGroups(ctx.role, mode, includeAll);
  return res.json({
    release: 'V18.0-COMPLETE-PLATFORM-CONSOLIDATION',
    role: ctx.role,
    mode,
    totalRegistryRoutes: NAVIGATION_REGISTRY.length,
    authorizedItemCount: groups.reduce((acc, g) => acc + g.items.length, 0),
    groups,
  });
});

v18Router.get('/navigation/authorize', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const rawRoute = cleanText(req.query.route || '/home');
  const resolved = resolveRouteToNavItem(rawRoute);

  if (resolved.isUnknown || !resolved.item) {
    return res.status(404).json({
      authorized: false,
      statusCode: 404,
      error: 'ROUTE_NOT_FOUND',
      route: resolved.normalizedPath,
      message: `No registered module matches route "${resolved.normalizedPath}".`,
    });
  }

  const permitted = hasRolePermission(resolved.item, ctx.role);
  if (!permitted) {
    return res.status(403).json({
      authorized: false,
      statusCode: 403,
      error: 'ROUTE_ACCESS_RESTRICTED',
      route: resolved.item.route,
      itemId: resolved.item.id,
      requiredRoles: resolved.item.requiredRoles,
      currentRole: ctx.role,
      message: `Role ${ctx.role} is not permitted to access "${resolved.item.label}".`,
    });
  }

  const mode = resolveMode(req.query.mode, ctx.role);
  return res.json({
    authorized: true,
    statusCode: 200,
    route: resolved.item.route,
    item: resolved.item,
    modeVisible: meetsExperienceMode(resolved.item, mode),
  });
});

// 2. Role-, Tenant- & Permission-Scoped Global Search
v18Router.get('/search', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const query = cleanText(req.query.q).slice(0, 120);
  const needle = query.toLowerCase();
  const mode = resolveMode(req.query.mode, ctx.role);
  const limitPerSection = Math.min(Number(req.query.limit || 8), 20);
  const myParticipantIds = getMyParticipantIds(ctx.userId);
  const results: V18SearchResult[] = [];

  const modMatches = searchNavRegistry(query, ctx.role, mode, limitPerSection);
  for (const m of modMatches) {
    results.push({
      id: `MOD-${m.id}`,
      kind: 'MODULE',
      title: m.label,
      subtitle: `${m.groupLabel} · ${m.description}`,
      route: m.route,
      tabId: m.id,
      badge: m.availability === 'SANDBOX_ONLY' ? 'Sandbox' : m.groupLabel,
    });
  }

  if (needle.length > 0) {
    let listingHits = 0;
    for (const lst of db.listings.values()) {
      if (listingHits >= limitPerSection) break;
      const hay = `${lst.title} ${lst.category} ${lst.district} ${lst.sellerName} ${lst.qualityGrade || ''}`.toLowerCase();
      if (hay.includes(needle)) {
        listingHits++;
        results.push({
          id: `LST-${lst.id}`,
          kind: 'LISTING',
          title: `${lst.title} (${lst.quantityAvailable} ${lst.unit})`,
          subtitle: `${lst.district} · ${lst.pricePerUnitUGX.toLocaleString()} ${lst.currency}/${lst.unit} · Seller: ${lst.sellerName}`,
          route: '/discover',
          tabId: 'explore',
          badge: lst.status,
        });
      }
    }

    for (const v17l of db.v17CommercialListings.values()) {
      if (listingHits >= limitPerSection) break;
      const isMine = myParticipantIds.has(v17l.sellerParticipantId);
      if (v17l.visibility === 'PRIVATE' && !ctx.isPlatformAdmin && !isMine) continue;
      const hay = `${v17l.title} ${v17l.sector} ${v17l.category} ${v17l.district} ${v17l.qualityGrade}`.toLowerCase();
      if (hay.includes(needle)) {
        listingHits++;
        results.push({
          id: `V17LST-${v17l.id}`,
          kind: 'LISTING',
          title: v17l.title,
          subtitle: `${v17l.district}, ${v17l.countryCode} · ${v17l.unitPrice.toLocaleString()} ${v17l.currency}/${v17l.unitCode}`,
          route: '/marketplace',
          tabId: 'marketplace',
          badge: v17l.status,
        });
      }
    }

    let oppHits = 0;
    for (const opp of db.economicOpportunities.values()) {
      if (oppHits >= limitPerSection) break;
      const region = opp.targetRegion || opp.corridorOrDistrict || opp.countryCode || 'Uganda';
      const category = String(opp.category || opp.targetSector || opp.opportunityType || 'OPPORTUNITY');
      const hay = `${opp.title} ${category} ${region} ${opp.rationale || ''}`.toLowerCase();
      if (hay.includes(needle)) {
        oppHits++;
        results.push({
          id: `OPP-${opp.id}`,
          kind: 'OPPORTUNITY',
          title: opp.title,
          subtitle: `${region} · ${category}`,
          route: '/discover/opportunities',
          tabId: 'opportunities',
          badge: category,
        });
      }
    }

    for (const br of db.v17BuyerRequests.values()) {
      if (oppHits >= limitPerSection) break;
      const hay = `${br.title} ${br.sector} ${br.targetDistrict} ${br.countryCode}`.toLowerCase();
      if (hay.includes(needle)) {
        oppHits++;
        results.push({
          id: `BR-${br.id}`,
          kind: 'OPPORTUNITY',
          title: br.title,
          subtitle: `Buyer request · ${br.targetDistrict} (${br.requestedQty} ${br.unitCode})`,
          route: '/discover/opportunities',
          tabId: 'opportunities',
          badge: br.status,
        });
      }
    }

    let orderHits = 0;
    for (const ord of db.orders.values()) {
      if (orderHits >= limitPerSection) break;
      const isInvolved = ord.buyerId === ctx.userId || ord.sellerId === ctx.userId;
      if (!ctx.isPlatformAdmin && !isInvolved) continue;
      const hay = `${ord.id} ${ord.orderNumber} ${ord.productTitle} ${ord.buyerName} ${ord.sellerName} ${ord.status}`.toLowerCase();
      if (hay.includes(needle)) {
        orderHits++;
        results.push({
          id: `ORD-${ord.id}`,
          kind: 'ORDER',
          title: `Order ${ord.orderNumber || ord.id} — ${ord.productTitle}`,
          subtitle: `${ord.totalAmountUGX.toLocaleString()} ${ord.currency} · ${ord.status}`,
          route: '/trade',
          tabId: 'activity',
          requiresConfirmation:
            ord.status === 'SUBMITTED' ||
            ord.status === 'AWAITING_PAYMENT' ||
            ord.status === 'PAYMENT_PENDING',
          badge: ord.status,
        });
      }
    }

    for (const tx of db.v17Transactions.values()) {
      if (orderHits >= limitPerSection) break;
      const isInvolved =
        tx.buyerId === ctx.userId ||
        tx.sellerId === ctx.userId ||
        myParticipantIds.has(tx.buyerId) ||
        myParticipantIds.has(tx.sellerId);
      if (!ctx.isPlatformAdmin && !isInvolved) continue;
      const hay = `${tx.id} ${tx.state} ${tx.currency} ${tx.verificationTier}`.toLowerCase();
      if (hay.includes(needle)) {
        orderHits++;
        results.push({
          id: `TX-${tx.id}`,
          kind: 'ORDER',
          title: `Transaction ${tx.id}`,
          subtitle: `${tx.amount.toLocaleString()} ${tx.currency} · ${tx.state}`,
          route: '/trade/orders',
          tabId: 'orders',
          requiresConfirmation: true,
          badge: tx.state,
        });
      }
    }

    let supportHits = 0;
    for (const sc of db.supportCases.values()) {
      if (supportHits >= limitPerSection) break;
      if (!ctx.isPlatformAdmin && sc.userId !== ctx.userId) continue;
      const hay = `${sc.caseNumber} ${sc.subject} ${sc.category} ${sc.status}`.toLowerCase();
      if (hay.includes(needle)) {
        supportHits++;
        results.push({
          id: `SUP-${sc.id}`,
          kind: 'SUPPORT_CASE',
          title: `${sc.caseNumber}: ${sc.subject}`,
          subtitle: `${sc.category} · ${sc.status}`,
          route: '/support',
          tabId: 'help',
          badge: sc.status,
        });
      }
    }

    let actorHits = 0;
    for (const part of db.v17Participants.values()) {
      if (actorHits >= limitPerSection) break;
      if (part.visibility === 'PRIVATE' && !ctx.isPlatformAdmin && part.userId !== ctx.userId) continue;
      const hay = `${part.displayName} ${part.participantType} ${part.district} ${part.countryCode}`.toLowerCase();
      if (hay.includes(needle)) {
        actorHits++;
        results.push({
          id: `PART-${part.id}`,
          kind: 'PARTICIPANT',
          title: part.displayName,
          subtitle: `${part.participantType} · ${part.district}, ${part.countryCode}`,
          route: '/trust',
          tabId: 'trust-identity',
          badge: part.verificationLevel,
        });
      }
    }

    for (const org of db.v17Organizations.values()) {
      if (actorHits >= limitPerSection) break;
      if (org.visibility === 'PRIVATE' && !ctx.isPlatformAdmin) continue;
      const hay = `${org.legalName} ${org.orgType} ${org.district} ${org.countryCode}`.toLowerCase();
      if (hay.includes(needle)) {
        actorHits++;
        results.push({
          id: `ORG-${org.id}`,
          kind: 'ORGANIZATION',
          title: org.legalName,
          subtitle: `${org.orgType} · ${org.district}, ${org.countryCode}`,
          route: '/cooperatives',
          tabId: 'cooperatives',
          badge: org.verificationLevel,
        });
      }
    }
  }

  return res.json({
    query,
    role: ctx.role,
    totalResults: results.length,
    results,
  });
});

// 3. Unified Notification & 5-Bucket Task Centre
v18Router.get('/notifications-tasks', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const myParticipantIds = getMyParticipantIds(ctx.userId);
  const callerUser = db.users.get(ctx.userId);
  const nowMs = Date.now();

  const notifications = Array.from(db.notifications.values())
    .filter((n) => ctx.isPlatformAdmin || !n.userId || n.userId === ctx.userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const tasks: V18UnifiedTask[] = [];

  for (const bt of db.businessTasks.values()) {
    if (!ctx.isPlatformAdmin && bt.tenantId !== ctx.tenantId) continue;
    const dueMs = bt.dueDate ? new Date(bt.dueDate).getTime() : NaN;
    const isCompleted = bt.status === 'COMPLETED';
    const isOverdue = !isCompleted && !Number.isNaN(dueMs) && dueMs < nowMs;
    const assignedToCaller =
      bt.assignedTo === ctx.userId ||
      (callerUser?.name && bt.assignedTo.toLowerCase().includes(callerUser.name.toLowerCase()));

    let bucket: V18TaskBucket = 'AWAITING_MY_ACTION';
    if (isCompleted) bucket = 'COMPLETED';
    else if (isOverdue) bucket = 'OVERDUE';
    else if (assignedToCaller || ctx.isPlatformAdmin) bucket = 'ASSIGNED_TO_ME';

    tasks.push({
      id: bt.id,
      sourceType: 'BUSINESS_TASK',
      title: bt.title,
      description: `${bt.department} · Assigned to ${bt.assignedTo}`,
      bucket,
      priority: bt.priority,
      status: bt.status,
      dueDate: bt.dueDate,
      targetRoute: '/business',
      targetTabId: 'business-simple',
      actionable: true,
    });
  }

  for (const sc of db.supportCases.values()) {
    if (!ctx.isPlatformAdmin && sc.userId !== ctx.userId) continue;
    const closed = sc.status === 'RESOLVED' || sc.status === 'CLOSED';
    const bucket: V18TaskBucket = closed
      ? 'COMPLETED'
      : sc.userId === ctx.userId
        ? 'ASSIGNED_BY_ME'
        : 'AWAITING_MY_ACTION';

    tasks.push({
      id: sc.id,
      sourceType: 'SUPPORT_CASE',
      title: `${sc.caseNumber}: ${sc.subject}`,
      description: `${sc.category} · Status: ${sc.status}`,
      bucket,
      priority: sc.status === 'OPEN' ? 'HIGH' : 'MEDIUM',
      status: sc.status,
      dueDate: sc.createdAt,
      targetRoute: '/support',
      targetTabId: 'help',
      actionable: false,
    });
  }

  for (const inv of db.v17RelationshipInvitations.values()) {
    const isRecipient = myParticipantIds.has(inv.toParticipantId) || inv.toParticipantId === ctx.userId;
    const isSender = myParticipantIds.has(inv.fromParticipantId) || inv.fromParticipantId === ctx.userId;
    if (!ctx.isPlatformAdmin && !isRecipient && !isSender) continue;

    let bucket: V18TaskBucket = 'AWAITING_MY_ACTION';
    if (inv.status !== 'PENDING') bucket = 'COMPLETED';
    else if (isSender && !isRecipient) bucket = 'ASSIGNED_BY_ME';

    tasks.push({
      id: inv.id,
      sourceType: 'RELATIONSHIP_INVITE',
      title: `Partnership Invitation (${inv.relationshipType})`,
      description: inv.termsSummary || `From ${inv.fromParticipantId} to ${inv.toParticipantId}`,
      bucket,
      priority: 'MEDIUM',
      status: inv.status,
      dueDate: inv.expiresAt,
      targetRoute: '/cooperatives/graph',
      targetTabId: 'economic-network',
      actionable: false,
    });
  }

  for (const dsp of db.v17Disputes.values()) {
    const isParty =
      dsp.complainantId === ctx.userId ||
      dsp.respondentId === ctx.userId ||
      myParticipantIds.has(dsp.complainantId) ||
      myParticipantIds.has(dsp.respondentId);
    if (!ctx.isPlatformAdmin && !isParty) continue;

    const bucket: V18TaskBucket =
      dsp.stage === '11_CLOSED'
        ? 'COMPLETED'
        : ctx.isPlatformAdmin || dsp.respondentId === ctx.userId || myParticipantIds.has(dsp.respondentId)
          ? 'AWAITING_MY_ACTION'
          : 'ASSIGNED_BY_ME';

    tasks.push({
      id: dsp.id,
      sourceType: 'DISPUTE',
      title: `Dispute ${dsp.id} (${dsp.stage})`,
      description: `${dsp.reason} · ${dsp.claimedAmount.toLocaleString()} ${dsp.currency}`,
      bucket,
      priority: 'HIGH',
      status: dsp.stage,
      dueDate: dsp.openedAt,
      targetRoute: ctx.isPlatformAdmin ? '/v17-control-center' : '/trust',
      targetTabId: ctx.isPlatformAdmin ? 'v17-control-center' : 'trust-identity',
      actionable: false,
    });
  }

  for (const off of db.v17OfflineSyncQueue.values()) {
    const isMine = off.participantId === ctx.userId || myParticipantIds.has(off.participantId);
    if (!ctx.isPlatformAdmin && !isMine) continue;
    const bucket: V18TaskBucket =
      off.validationStatus === 'QUEUED' ? 'AWAITING_MY_ACTION' : 'COMPLETED';
    tasks.push({
      id: off.id,
      sourceType: 'OFFLINE_SYNC',
      title: `Offline Action: ${off.actionType}`,
      description: `Status: ${off.validationStatus}${off.rejectionReason ? ` — ${off.rejectionReason}` : ''}`,
      bucket,
      priority: off.validationStatus === 'QUEUED' ? 'MEDIUM' : 'LOW',
      status: off.validationStatus,
      dueDate: off.queuedAt,
      targetRoute: '/home',
      targetTabId: 'home',
      actionable: false,
    });
  }

  const countsByBucket: Record<V18TaskBucket, number> = {
    ASSIGNED_TO_ME: 0,
    AWAITING_MY_ACTION: 0,
    ASSIGNED_BY_ME: 0,
    OVERDUE: 0,
    COMPLETED: 0,
  };
  for (const task of tasks) {
    countsByBucket[task.bucket]++;
  }

  return res.json({
    unreadNotificationsCount: notifications.filter((n) => !n.read).length,
    totalNotificationsCount: notifications.length,
    notifications,
    totalTasksCount: tasks.length,
    countsByBucket,
    tasks,
  });
});

v18Router.post('/tasks/:id/status', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const taskId = cleanText(req.params.id);
  const requestedStatus = cleanText(req.body?.status).toUpperCase();
  const allowedStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

  if (!allowedStatuses.includes(requestedStatus)) {
    return res.status(400).json({
      error: 'INVALID_TASK_STATUS',
      message: `Status must be one of: ${allowedStatuses.join(', ')}`,
    });
  }

  const bt = db.businessTasks.get(taskId);
  if (!bt) {
    return res.status(404).json({
      error: 'TASK_NOT_FOUND',
      message: `Business task ${taskId} not found.`,
    });
  }

  if (!ctx.isPlatformAdmin && bt.tenantId !== ctx.tenantId) {
    recordV18SecurityIncident(
      'CROSS_TENANT_ACCESS',
      'HIGH',
      bt.tenantId,
      ctx.userId,
      `Unauthorized cross-tenant task update blocked for ${taskId}`
    );
    return res.status(403).json({
      error: 'FORBIDDEN_CROSS_TENANT',
      message: 'You do not have permission to modify tasks in another tenant.',
    });
  }

  bt.status = requestedStatus as 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  db.businessTasks.set(bt.id, bt);
  db.scheduleSave();

  return res.json({
    updated: true,
    task: bt,
  });
});

// 4. Unified System Administration & Control Centre (PLATFORM_ADMIN ONLY)
v18Router.get('/admin/control-center', requirePlatformAdmin, async (_req: Request, res: Response) => {
  const v14Backup = db.verifyV14BackupAndRollbackReadiness();
  const v15Backup = db.verifyV15BackupAndRollbackReadiness();
  const v16Backup = db.verifyV16BackupAndRollbackReadiness();
  const finReport = db.getFinancialIntegrityReport();
  const gates = await getV17GatesSummary();

  const walExists = fs.existsSync(DB_FILE);
  const walStat = walExists ? fs.statSync(DB_FILE) : null;

  let pendingVerifications = 0;
  for (const ev of db.v17VerificationEvidences.values()) {
    if (ev.decision === 'PENDING') pendingVerifications++;
  }

  let openDisputes = 0;
  for (const d of db.v17Disputes.values()) {
    if (d.stage !== '11_CLOSED') openDisputes++;
  }

  let openSupportCases = 0;
  for (const sc of db.supportCases.values()) {
    if (sc.status !== 'CLOSED' && sc.status !== 'RESOLVED') openSupportCases++;
  }

  let offlineSyncItems = 0;
  for (const o of db.v17OfflineSyncQueue.values()) {
    if (o.validationStatus === 'QUEUED') offlineSyncItems++;
  }

  let openSecurityIncidents = 0;
  for (const s of db.securityIncidents.values()) {
    if (s.status === 'OPEN') openSecurityIncidents++;
  }

  let openOperationalIncidents = 0;
  for (const op of db.operationalIncidents.values()) {
    if (op.status !== 'RESOLVED' && op.status !== 'CLOSED') openOperationalIncidents++;
  }

  let suspenseAccountBalance = 0;
  for (const acc of db.chartOfAccounts.values()) {
    if (
      acc.category === 'SUSPENSE' ||
      String(acc.accountNumber || '').includes('2999') ||
      String(acc.accountName || '').toLowerCase().includes('suspense')
    ) {
      suspenseAccountBalance += Number(acc.balance || 0);
    }
  }

  const latestMigration = db.migrationHistory[db.migrationHistory.length - 1];

  const summary: V18AdminControlSummary = {
    product: 'ECONEX',
    releaseVersion: 'V18.0-COMPLETE-PLATFORM-CONSOLIDATION',
    schemaVersion: db.schemaVersion,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    serverUptimeSeconds: Math.round(process.uptime()),
    database: {
      authorityMode: 'LOCAL_JSON_WAL_AUTHORITATIVE',
      walFileSizeBytes: walStat ? walStat.size : 0,
      walExists,
      postgresConfigured: Boolean(process.env.DATABASE_URL),
      postgresConnected: false,
      lastBackupTimestamp: latestMigration?.migratedAt || null,
      v16BackupValid: v16Backup.v16BackupValid,
      v15BackupValid: v15Backup.v15BackupValid,
      v14BackupValid: v14Backup.v14BackupValid,
    },
    queues: {
      pendingVerifications,
      openDisputes,
      openSupportCases,
      offlineSyncItems,
      openSecurityIncidents,
      openOperationalIncidents,
      deadLetterEvents: db.deadLetterQueue.size,
    },
    ledger: {
      journalBalanced: finReport.journalBalanced,
      totalJournalEntries: db.universalJournal.size,
      suspenseAccountBalance,
    },
    gatesSummary: {
      totalGates: gates.totalGates,
      v16GatesPassed: gates.v16GatesPassed,
      v17ProductionReadyCount: gates.v17ProductionReadyCount,
      externalBlockedCount: gates.externalBlockedCount,
    },
    statuses: {
      ENGINEERING_COMPLETE: true,
      PRODUCTION_READY: gates.statuses.PRODUCTION_READY,
      LIVE_PILOT_OPERATIONAL: gates.statuses.LIVE_PILOT_OPERATIONAL,
    },
  };

  return res.json(summary);
});

v18Router.post('/system/backup-verify', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const backup = db.createAutomatedBackup();
  const raw = fs.existsSync(backup.backupPath) ? fs.readFileSync(backup.backupPath) : Buffer.from('');
  const checksumSha256 = crypto.createHash('sha256').update(raw).digest('hex');

  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: 'UG',
    actorId: ctx.userId,
    actorRole: ctx.role,
    actionType: 'V18_ADMIN_ACTION',
    entityType: 'SYSTEM_BACKUP',
    entityId: path.basename(backup.backupPath),
    details: `Verified automated JSON WAL backup (${backup.bytes} bytes, SHA-256 ${checksumSha256.slice(0, 16)}...).`,
  });

  return res.json({
    verified: backup.integrityVerified,
    backupPath: path.basename(backup.backupPath),
    bytes: backup.bytes,
    checksumSha256,
    collectionsBackedUp: backup.collectionsBackedUp,
    verifiedAt: new Date().toISOString(),
  });
});
