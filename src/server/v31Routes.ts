/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V31.0 — Sovereign Data Infrastructure, Connectivity & Continental Deployment Router (/api/v31/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  V31ActorCtx,
  V31HttpError,
  V31_MANDATORY_HONESTY_FLAGS,
  advanceV31PilotStage,
  advanceV31ProviderCertificationStage,
  buildV31OpenApiSpec,
  calculateV31CountryTaxBreakdown,
  createV31CommercialWorkflowCase,
  createV31ContinentalAnalyticsSnapshot,
  createV31EnterpriseOrganization,
  createV31OrganizationBranch,
  createV31OrganizationDepartment,
  getV31EnterpriseOverview,
  getV31Overview,
  getV31PilotOverview,
  getV31ReadinessMatrix,
  getV31SecurityOverview,
  listV31ContinentalAnalytics,
  listV31CountryProfiles,
  listV31ProviderCertifications,
  listV31ResidencyPolicies,
  logV31PilotIncident,
  recordV31FieldValidation,
  registerV31PilotParticipant,
  revokeV31UserSession,
  rotateV31CredentialMetadata,
  runV31CountryAwareAiAdvisor,
  runV31ProviderCertificationHarness,
  transitionV31CommercialWorkflowCase,
  transitionV31SecurityIncident,
  triggerV31BackupRestoreDrill,
  triggerV31PostgresDryRun,
  upsertV31CountryProfile,
  upsertV31ResidencyPolicy,
} from './v31Engine.ts';
import { getV31PostgresDiagnostics } from './v31PostgresEngine.ts';
import {
  getV31GitHubDiagnostics,
  listV31Deployments,
  recordV31EnvironmentReadinessCheck,
} from './v31GitHubEngine.ts';
import type { UserRole, V31DeploymentEnvironment, V31ProviderCertificationStage } from '../types/index.ts';

export const v31Router = Router();

function resolveV31Ctx(req: Request, allowAnonymousFallback = false): V31ActorCtx {
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
    throw new V31HttpError(401, 'AUTHENTICATION_REQUIRED');
  }

  const effectiveUserId = userId || 'usr_farmer_01';
  const effectiveRole = (role || 'FARMER') as UserRole;
  const prefs = db.v26UserPreferences.get(effectiveUserId);
  const requestedOrg =
    (req.headers['x-org-id'] as string | undefined)?.trim() ||
    prefs?.activeWorkspaceId ||
    db.users.get(effectiveUserId)?.organizationId ||
    'org_coop_01';
  const requestedCountry =
    (req.headers['x-country-code'] as string | undefined)?.trim() ||
    prefs?.activeCountryCode ||
    'UG';

  return {
    tenantId: `TENANT-${requestedCountry.toUpperCase()}`,
    userId: effectiveUserId,
    role: effectiveRole,
    isPlatformAdmin: effectiveRole === 'PLATFORM_ADMIN',
    organisationId: requestedOrg,
    countryCode: requestedCountry.toUpperCase(),
    correlationId: (req as any).correlationId || `CORR-V31-${Date.now().toString(36)}`,
    sourceIp: req.ip || '127.0.0.1',
    authenticated,
  };
}

function handleErr(res: Response, err: any) {
  if (err instanceof V31HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }
  return res.status(500).json({ error: err?.message || 'Internal V31 error', code: 'V31_INTERNAL_ERROR' });
}

v31Router.get('/health', (_req: Request, res: Response) => {
  const integrity = db.validateV28SchemaIntegrity();
  const rb = db.verifyV30BackupAndRollbackReadiness();
  const pgDiag = getV31PostgresDiagnostics();
  return res.json({
    status: integrity.valid ? 'HEALTHY' : 'DEGRADED',
    product: 'ECONEX',
    release: 'V31.0-SOVEREIGN-INFRASTRUCTURE-AND-DEPLOYMENT',
    schemaVersion: db.schemaVersion,
    schema28Integrity: integrity,
    v30RollbackReady: rb.v30BackupExists,
    databaseAuthority: pgDiag.databaseAuthority,
    honestyFlags: V31_MANDATORY_HONESTY_FLAGS,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    timestamp: new Date().toISOString(),
  });
});

v31Router.get('/overview', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req, true);
    return res.json(getV31Overview(ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.get('/readiness-matrix', (_req: Request, res: Response) => {
  return res.json(getV31ReadinessMatrix());
});

v31Router.get('/openapi.json', (_req: Request, res: Response) => {
  return res.json(buildV31OpenApiSpec());
});

// Phase B: Sovereign PostgreSQL & Residency
v31Router.get('/postgres/status', (_req: Request, res: Response) => {
  return res.json({
    ...getV31PostgresDiagnostics(),
    migrationVerification: db.verifyV28MigrationCompleteness(),
    v30Rollback: db.verifyV30BackupAndRollbackReadiness(),
  });
});

v31Router.post('/postgres/migrate-dry-run', async (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const run = await triggerV31PostgresDryRun(ctx, Boolean(req.body?.simulateInterrupt));
    return res.json(run);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/postgres/backup-drill', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const rec = triggerV31BackupRestoreDrill(ctx);
    return res.json(rec);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.get('/residency/policies', (_req: Request, res: Response) => {
  return res.json({ policies: listV31ResidencyPolicies() });
});

v31Router.post('/residency/policies', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const policy = upsertV31ResidencyPolicy(ctx, req.body || {});
    return res.json(policy);
  } catch (err) {
    return handleErr(res, err);
  }
});

// Phase C: External Financial Integration & Certification Harness
v31Router.get('/providers/certifications', (_req: Request, res: Response) => {
  return res.json(listV31ProviderCertifications());
});

v31Router.post('/providers/:id/certify', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const updated = runV31ProviderCertificationHarness(ctx, req.params.id);
    return res.json(updated);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/providers/:id/advance', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const stage = String(req.body?.targetStage || '').trim() as V31ProviderCertificationStage;
    const updated = advanceV31ProviderCertificationStage(ctx, req.params.id, stage);
    return res.json(updated);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/providers/credentials/:id/rotate', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const updated = rotateV31CredentialMetadata(
      ctx,
      req.params.id,
      req.body?.rotationIntervalDays ? Number(req.body.rotationIntervalDays) : undefined
    );
    return res.json(updated);
  } catch (err) {
    return handleErr(res, err);
  }
});

// Phase D: Multi-Country Operating Profiles & Tax Precision
v31Router.get('/countries', (_req: Request, res: Response) => {
  return res.json({ countries: listV31CountryProfiles() });
});

v31Router.post('/countries', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const profile = upsertV31CountryProfile(ctx, req.body || {});
    return res.json(profile);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/countries/:code/tax-calculate', (req: Request, res: Response) => {
  try {
    const result = calculateV31CountryTaxBreakdown(req.params.code, Number(req.body?.grossMinor || 0));
    return res.json(result);
  } catch (err) {
    return handleErr(res, err);
  }
});

// Phase E: Enterprise Hierarchy, SoD & Traceable Commercial Workflows
v31Router.get('/enterprise/overview', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req, true);
    return res.json(getV31EnterpriseOverview(ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/enterprise/organizations', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const org = createV31EnterpriseOrganization(ctx, req.body || {});
    return res.status(201).json(org);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/enterprise/branches', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const branch = createV31OrganizationBranch(ctx, req.body || {});
    return res.status(201).json(branch);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/enterprise/departments', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const dept = createV31OrganizationDepartment(ctx, req.body || {});
    return res.status(201).json(dept);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/enterprise/cases', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const wfCase = createV31CommercialWorkflowCase(ctx, req.body || {});
    return res.status(201).json(wfCase);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/enterprise/cases/:id/transition', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const wfCase = transitionV31CommercialWorkflowCase(
      ctx,
      req.params.id,
      req.body?.action,
      req.body?.note
    );
    return res.json(wfCase);
  } catch (err) {
    return handleErr(res, err);
  }
});

// Phase F: Uganda Supervised Pilot Readiness & Field Validation
v31Router.get('/pilot/overview', (_req: Request, res: Response) => {
  return res.json(getV31PilotOverview());
});

v31Router.post('/pilot/advance-stage', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const programId = String(req.body?.programId || 'v31_pilot_ug_cohort_01');
    const stageNum = Number(req.body?.targetStageNumber || 1);
    const updated = advanceV31PilotStage(ctx, programId, stageNum);
    return res.json(updated);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/pilot/participants', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const rec = registerV31PilotParticipant(ctx, req.body || {});
    return res.status(201).json(rec);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/pilot/field-validations', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const rec = recordV31FieldValidation(ctx, req.body || {});
    return res.status(201).json(rec);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/pilot/incidents', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const rec = logV31PilotIncident(ctx, req.body || {});
    return res.status(201).json(rec);
  } catch (err) {
    return handleErr(res, err);
  }
});

// Phase G: Production Security, Session Revocation & Continuity
v31Router.get('/security/overview', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req, true);
    return res.json(getV31SecurityOverview(ctx));
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/security/sessions/:id/revoke', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const session = revokeV31UserSession(ctx, req.params.id);
    return res.json(session);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/security/incidents/:id/transition', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const inc = transitionV31SecurityIncident(
      ctx,
      req.params.id,
      req.body?.status,
      req.body?.containmentAction
    );
    return res.json(inc);
  } catch (err) {
    return handleErr(res, err);
  }
});

// Phase H: Continental Analytics & Country-Aware AI Advisor
v31Router.get('/intelligence/analytics', (req: Request, res: Response) => {
  const cc = typeof req.query.countryCode === 'string' ? req.query.countryCode : undefined;
  return res.json(listV31ContinentalAnalytics(cc));
});

v31Router.post('/intelligence/analytics', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const snap = createV31ContinentalAnalyticsSnapshot(ctx, req.body || {});
    return res.status(201).json(snap);
  } catch (err) {
    return handleErr(res, err);
  }
});

v31Router.post('/intelligence/ai-advisor', async (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req, true);
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      throw new V31HttpError(400, 'prompt is required for AI Strategic Advisor.', 'EMPTY_PROMPT');
    }
    const out = await runV31CountryAwareAiAdvisor(
      ctx,
      prompt,
      req.body?.countryCode,
      Boolean(req.body?.forceLocalSimulation)
    );
    return res.json(out);
  } catch (err) {
    return handleErr(res, err);
  }
});

// Phase K: GitHub, CI/CD & Multi-Environment Deployment Readiness
v31Router.get('/github/diagnostics', (_req: Request, res: Response) => {
  return res.json(getV31GitHubDiagnostics());
});

v31Router.get('/deployments', (_req: Request, res: Response) => {
  return res.json(listV31Deployments());
});

v31Router.post('/deployments/verify', (req: Request, res: Response) => {
  try {
    const ctx = resolveV31Ctx(req);
    const env = String(req.body?.environment || 'DEV').toUpperCase() as V31DeploymentEnvironment;
    const rec = recordV31EnvironmentReadinessCheck({
      environment: env,
      notes: req.body?.notes,
      actorUserId: ctx.userId,
    });
    return res.json(rec);
  } catch (err) {
    return handleErr(res, err);
  }
});
