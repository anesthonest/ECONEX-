/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V26.0 - Universal Platform Activation, Workflow Execution, Reporting & Audit Router (/api/v26/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import {
  V26ActorCtx,
  V26HttpError,
  advanceConnectedCommerceWorkflow,
  archiveNotification,
  buildV26OpenApiSpec,
  cleanV26Text,
  createDocumentShare,
  createInAppNotification,
  createSavedItem,
  createSupportTicket,
  deleteSavedItem,
  generateReportExport,
  getControlAuditSummary,
  getLocalizationAndCountryPack,
  getOrCreateNotificationPreferences,
  getOrCreateUserPreferences,
  getQuickActionsForRole,
  getReportDownloadPayload,
  getRouteInventorySummary,
  getUserDevicesAndSessions,
  getUserOnboardingProgress,
  getV26HomeSummary,
  getV26ReadinessMatrix,
  getWorkflowCoverageMatrix,
  getWorkspacesForUser,
  listAccessibleDocuments,
  listNotificationsForUser,
  listSavedItems,
  listSupportTickets,
  markAllNotificationsRead,
  markNotificationRead,
  onboardBusinessEntity,
  replyToSupportTicket,
  requestAccountRecoveryOrVerification,
  resolveDocumentShareToken,
  revokeDocumentShare,
  startConnectedCommerceWorkflow,
  switchActiveWorkspace,
  universalV26Search,
  updateAccountProfile,
  updateNotificationPreferences,
  updateSupportTicketStatus,
  updateUserPreferences,
  upsertUserOnboardingProgress,
  verifyAccountRecoveryOrContact,
} from './v26Engine.ts';
import type { UserRole } from '../types/index.ts';

export const v26Router = Router();

function resolveV26Ctx(req: Request, allowAnonymousFallback = false): V26ActorCtx {
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
    throw new V26HttpError(401, 'AUTHENTICATION_REQUIRED');
  }

  const effectiveUserId = userId || 'usr_farmer_01';
  const effectiveRole = (role || 'FARMER') as UserRole;
  const prefs = db.v26UserPreferences.get(effectiveUserId);
  const requestedOrg =
    (req.headers['x-org-id'] as string | undefined)?.trim() ||
    prefs?.activeWorkspaceId ||
    db.users.get(effectiveUserId)?.organizationId ||
    'ORG-V25-UG-PRODUCE';
  const requestedCountry =
    (req.headers['x-country-code'] as string | undefined)?.trim() ||
    prefs?.activeCountryCode ||
    db.users.get(effectiveUserId)?.country ||
    'UG';

  return {
    tenantId: ((req.headers['x-tenant-id'] as string) || `TENANT-${requestedCountry.toUpperCase()}`).trim(),
    userId: effectiveUserId,
    role: effectiveRole,
    isPlatformAdmin: effectiveRole === 'PLATFORM_ADMIN',
    organisationId: requestedOrg,
    countryCode: requestedCountry.toUpperCase(),
    correlationId: (req as any).correlationId || `CORR-${crypto.randomBytes(4).toString('hex')}`,
    sourceIp: String(req.ip || '127.0.0.1'),
    authenticated,
  };
}

function handleV26(
  fn: (req: Request, res: Response, ctx: V26ActorCtx) => Promise<any> | any,
  options?: { allowAnonymous?: boolean }
) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const ctx = resolveV26Ctx(req, Boolean(options?.allowAnonymous));
      await fn(req, res, ctx);
    } catch (err: any) {
      if (err instanceof V26HttpError) {
        return res.status(err.status).json({
          error: err.message,
          code: err.code,
        });
      }
      console.error('[ECONEX V26 ERROR]', err);
      return res.status(500).json({
        error: err?.message || 'INTERNAL_V26_ERROR',
      });
    }
  };
}

// ==========================================
// 1. PUBLIC HEALTH, READINESS, OPENAPI & LOCALIZATION
// ==========================================

v26Router.get('/health', (_req, res) => {
  const schema24 = db.verifyV24MigrationCompleteness();
  return res.json({
    status: 'HEALTHY',
    product: 'ECONEX',
    release: 'V26.0-UNIVERSAL-PLATFORM-ACTIVATION',
    schemaVersion: db.schemaVersion,
    schema24IntegrityValid: schema24.integrity.valid,
    v25RollbackReady: schema24.rollback.v25BackupValid,
    routeInventoryCount: db.v26RouteInventory.size,
    controlAuditsCount: db.v26ControlAudits.size,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    timestamp: new Date().toISOString(),
  });
});

v26Router.get('/readiness-matrix', handleV26((_req, res) => res.json(getV26ReadinessMatrix()), { allowAnonymous: true }));
v26Router.get('/openapi.json', (_req, res) => res.json(buildV26OpenApiSpec()));
v26Router.get('/localization', (_req, res) => res.json(getLocalizationAndCountryPack()));

// ==========================================
// 2. HOME SUMMARY, PREFERENCES & USER ONBOARDING
// ==========================================

v26Router.get('/home-summary', handleV26((_req, res, ctx) => res.json(getV26HomeSummary(ctx)), { allowAnonymous: true }));

v26Router.get('/preferences', handleV26((_req, res, ctx) => res.json(getOrCreateUserPreferences(ctx.userId, ctx.role))));
v26Router.put('/preferences', handleV26((req, res, ctx) => res.json(updateUserPreferences(req.body || {}, ctx))));

v26Router.get('/onboarding/user', handleV26((_req, res, ctx) => res.json(getUserOnboardingProgress(ctx.userId))));
v26Router.put('/onboarding/user', handleV26((req, res, ctx) => res.json(upsertUserOnboardingProgress(req.body || {}, ctx))));

// ==========================================
// 3. ACCOUNT PROFILE, RECOVERY & DEVICES/SESSIONS
// ==========================================

v26Router.put('/account/profile', handleV26((req, res, ctx) => res.json(updateAccountProfile(req.body || {}, ctx))));
v26Router.post('/account/recovery/request', handleV26((req, res, ctx) => res.status(201).json(requestAccountRecoveryOrVerification(req.body || {}, ctx))));
v26Router.post('/account/recovery/verify', handleV26((req, res, ctx) => res.json(verifyAccountRecoveryOrContact(req.body || {}, ctx))));
v26Router.get('/account/devices-sessions', handleV26((_req, res, ctx) => res.json(getUserDevicesAndSessions(ctx))));

// ==========================================
// 4. BUSINESS ONBOARDING & WORKSPACES
// ==========================================

v26Router.get(
  '/onboarding/business',
  handleV26((_req, res, ctx) => {
    const items = Array.from(db.v26BusinessOnboarding.values()).filter(
      (b) => ctx.isPlatformAdmin || b.userId === ctx.userId || b.organisationId === ctx.organisationId
    );
    return res.json(items);
  })
);
v26Router.post('/onboarding/business', handleV26((req, res, ctx) => res.status(201).json(onboardBusinessEntity(req.body || {}, ctx))));
v26Router.get('/workspaces/active', handleV26((_req, res, ctx) => res.json(getWorkspacesForUser(ctx))));
v26Router.post('/workspaces/switch', handleV26((req, res, ctx) => {
  const orgId = cleanV26Text(req.body?.organisationId || req.body?.workspaceId);
  if (!orgId) throw new V26HttpError(400, 'ORGANISATION_ID_REQUIRED');
  return res.json(switchActiveWorkspace(orgId, ctx));
}));

// ==========================================
// 5. CONNECTED COMMERCE E2E WORKFLOW & MARKETPLACE SAVED ITEMS
// ==========================================

v26Router.get(
  '/workflows/commerce-e2e',
  handleV26((_req, res, ctx) => {
    const items = Array.from(db.v26WorkflowExecutions.values())
      .filter((w) => ctx.isPlatformAdmin || w.userId === ctx.userId || w.organisationId === ctx.organisationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return res.json(items);
  })
);
v26Router.post('/workflows/commerce-e2e', handleV26((req, res, ctx) => res.status(201).json(startConnectedCommerceWorkflow(req.body || {}, ctx))));
v26Router.post('/workflows/:id/advance', handleV26((req, res, ctx) => res.json(advanceConnectedCommerceWorkflow(req.params.id, req.body || {}, ctx))));

v26Router.get('/marketplace/saved', handleV26((_req, res, ctx) => res.json(listSavedItems(ctx))));
v26Router.post('/marketplace/saved', handleV26((req, res, ctx) => res.status(201).json(createSavedItem(req.body || {}, ctx))));
v26Router.delete('/marketplace/saved/:id', handleV26((req, res, ctx) => res.json(deleteSavedItem(req.params.id, ctx))));

// ==========================================
// 6. NOTIFICATIONS, PREFERENCES & DELIVERY LOGS
// ==========================================

v26Router.get('/notifications', handleV26((req, res, ctx) => res.json(listNotificationsForUser(ctx, req.query as Record<string, any>))));
v26Router.post(
  '/notifications',
  handleV26((req, res, ctx) => {
    const targetUserId = cleanV26Text(req.body?.userId || ctx.userId);
    if (targetUserId !== ctx.userId && !ctx.isPlatformAdmin) {
      throw new V26HttpError(403, 'CANNOT_SEND_NOTIFICATION_TO_OTHER_USER');
    }
    const created = createInAppNotification({
      userId: targetUserId,
      tenantId: ctx.tenantId,
      category: req.body?.category,
      severity: req.body?.severity,
      title: req.body?.title || 'Platform Notice',
      body: req.body?.body || 'Operation recorded.',
      targetRoute: req.body?.targetRoute,
      targetTabId: req.body?.targetTabId,
    });
    return res.status(201).json(created);
  })
);
v26Router.post('/notifications/mark-all-read', handleV26((_req, res, ctx) => res.json(markAllNotificationsRead(ctx))));
v26Router.post('/notifications/:id/read', handleV26((req, res, ctx) => res.json(markNotificationRead(req.params.id, ctx))));
v26Router.post('/notifications/:id/archive', handleV26((req, res, ctx) => res.json(archiveNotification(req.params.id, ctx))));
v26Router.get('/notifications/preferences', handleV26((_req, res, ctx) => res.json(getOrCreateNotificationPreferences(ctx.userId))));
v26Router.put('/notifications/preferences', handleV26((req, res, ctx) => res.json(updateNotificationPreferences(req.body || {}, ctx))));

// ==========================================
// 7. UNIVERSAL SEARCH & QUICK ACTIONS
// ==========================================

v26Router.get('/search', handleV26((req, res, ctx) => res.json(universalV26Search(String(req.query.q || ''), ctx)), { allowAnonymous: true }));
v26Router.get('/quick-actions', handleV26((_req, res, ctx) => res.json(getQuickActionsForRole(ctx)), { allowAnonymous: true }));

// ==========================================
// 8. DOCUMENT SHARING & REAL DOWNLOADABLE REPORTS (CSV/JSON/PDF)
// ==========================================

v26Router.get('/documents', handleV26((_req, res, ctx) => res.json(listAccessibleDocuments(ctx))));
v26Router.post('/documents/share', handleV26((req, res, ctx) => res.status(201).json(createDocumentShare(req.body || {}, ctx))));
v26Router.post('/documents/shares/:id/revoke', handleV26((req, res, ctx) => res.json(revokeDocumentShare(req.params.id, ctx))));
v26Router.get('/documents/share/:token', handleV26((req, res) => res.json(resolveDocumentShareToken(req.params.token)), { allowAnonymous: true }));

v26Router.get(
  '/reports',
  handleV26((_req, res, ctx) => {
    const items = Array.from(db.v26ReportExports.values())
      .filter((r) => ctx.isPlatformAdmin || r.userId === ctx.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ content: _omit, ...meta }) => ({ ...meta, downloadUrl: `/api/v26/reports/${meta.id}/download` }));
    return res.json(items);
  })
);
v26Router.post('/reports/generate', handleV26((req, res, ctx) => {
  const rep = generateReportExport(req.body || {}, ctx);
  const { content: _omit, ...meta } = rep;
  return res.status(201).json({ ...meta, downloadUrl: `/api/v26/reports/${rep.id}/download` });
}));
v26Router.get('/reports/:id/download', handleV26((req, res, ctx) => {
  const payload = getReportDownloadPayload(req.params.id, ctx);
  res.setHeader('Content-Type', payload.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
  res.setHeader('X-Content-SHA256', payload.report.contentSha256);
  return res.send(payload.report.content);
}));

// ==========================================
// 9. THREADED SUPPORT TICKETS
// ==========================================

v26Router.get('/support/tickets', handleV26((req, res, ctx) => res.json(listSupportTickets(ctx, String(req.query.status || 'ALL')))));
v26Router.post('/support/tickets', handleV26((req, res, ctx) => res.status(201).json(createSupportTicket(req.body || {}, ctx))));
v26Router.post('/support/tickets/:id/reply', handleV26((req, res, ctx) => res.status(201).json(replyToSupportTicket(req.params.id, req.body || {}, ctx))));
v26Router.post('/support/tickets/:id/status', handleV26((req, res, ctx) => res.json(updateSupportTicketStatus(req.params.id, req.body || {}, ctx))));

// ==========================================
// 10. INTERACTIVE CONTROL AUDIT, ROUTE INVENTORY & MIGRATION STATUS
// ==========================================

v26Router.get(
  '/audit/controls',
  handleV26(
    (req, res) =>
      res.json(
        getControlAuditSummary({
          status: req.query.status ? String(req.query.status) : undefined,
          module: req.query.module ? String(req.query.module) : undefined,
          q: req.query.q ? String(req.query.q) : undefined,
        })
      ),
    { allowAnonymous: true }
  )
);
v26Router.get(
  '/audit/routes',
  handleV26((req, res) => res.json(getRouteInventorySummary(req.query.role ? (String(req.query.role) as UserRole) : undefined)), {
    allowAnonymous: true,
  })
);
v26Router.get('/audit/workflows', (_req, res) => res.json(getWorkflowCoverageMatrix()));
v26Router.get('/migration/status', (_req, res) => res.json(db.verifyV24MigrationCompleteness()));
v26Router.get('/migration/backup-verify', (_req, res) => res.json(db.verifyV25BackupAndRollbackReadiness()));
