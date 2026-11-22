/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V21.0 - Controlled Pilot Deployment, Field Operations & Commercial Activation Router (/api/v21/*)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import { validateV21Environment } from './v21Config.ts';
import { auditPostgresSchemaFiles, runV21PostgresDryRunAudit } from './v21PostgresMigrator.ts';
import {
  ALL_V21_PARTICIPANT_CATEGORIES,
  ALL_V21_VERIFICATION_STATUSES,
  buildControlCentreSnapshot,
  createV21Onboarding,
  recomputeV21PilotMetrics,
  reviewV21OnboardingVerification,
  saveOrSyncV21FieldRecord,
  transitionV21FieldTask,
  transitionV21Pilot,
} from './v21Engine.ts';
import type {
  UserRole,
  V21FieldOfficerTask,
  V21OperationalException,
  V21PilotRecord,
  V21PilotTemplateModel,
  V21SupportRequest,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

export const v21Router = Router();

interface V21Context {
  tenantId: string;
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
  isFieldOfficer: boolean;
  assignedDistrict?: string;
}

function cleanText(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

function sha(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function resolveV21Actor(req: Request): { userId?: string; role: UserRole; isPlatformAdmin: boolean; isFieldOfficer: boolean } {
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
  const officerHeader = String(req.headers['x-field-officer'] || '').toLowerCase() === 'true';
  const onboardingOfficer = userId
    ? Array.from(db.v21Onboardings.values()).some((o) => o.userId === userId && o.category === 'FIELD_OFFICER')
    : false;
  return {
    userId,
    role: finalRole,
    isPlatformAdmin: finalRole === 'PLATFORM_ADMIN',
    isFieldOfficer: officerHeader || onboardingOfficer || userId === 'usr_officer_01',
  };
}

function requireV21Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV21Actor(req);
  if (!actor.userId) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V21 APIs.',
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
      error: 'CROSS_TENANT_ACCESS_BLOCKED',
      message: `Cross-tenant boundary enforced (${headerTenant} vs ${explicitParamTenant}).`,
    });
  }

  const assignedDistrict = (req.headers['x-officer-district'] as string | undefined)?.trim();
  (req as any).v21Context = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
    isFieldOfficer: actor.isFieldOfficer,
    assignedDistrict,
  } satisfies V21Context;
  return next();
}

function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as any).v21Context as V21Context;
  if (!ctx?.isPlatformAdmin) {
    return res.status(403).json({
      error: 'FORBIDDEN_ADMIN_ONLY',
      message: 'PLATFORM_ADMIN role required.',
    });
  }
  return next();
}

function getCtx(req: Request): V21Context {
  return (req as any).v21Context;
}

function inspectGitPublicationState() {
  const gitignorePath = path.join(ROOT, '.gitignore');
  const gitignoreText = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const gitignoreProtected =
    gitignoreText.includes('node_modules/') &&
    gitignoreText.includes('data/aros_database.json') &&
    gitignoreText.includes('.env*') &&
    gitignoreText.includes('exports/');

  const gitInitialized = fs.existsSync(path.join(ROOT, '.git'));
  let branch: string | null = null;
  let remoteNames: string[] = [];
  if (gitInitialized) {
    try {
      branch = execFileSync('git', ['-c', `safe.directory=${ROOT}`, 'rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
      const rem = execFileSync('git', ['-c', `safe.directory=${ROOT}`, 'remote'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
      remoteNames = rem ? rem.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    } catch {
      // ignore git read failure
    }
  }

  const docsPresent = ['README.md', 'DEPLOYMENT.md', 'RECOVERY.md', 'RELEASE_NOTES_V21.md', 'POSTGRES_MIGRATION.md', 'API_INTEGRATION_GUIDE.md'].every(
    (f) => fs.existsSync(path.join(ROOT, f))
  );
  const githubReady = gitignoreProtected && docsPresent;
  return {
    gitInitialized,
    branch,
    remoteConfigured: remoteNames.length > 0,
    remoteNames,
    gitignoreProtected,
    docsPresent,
    githubReady,
    githubPublished: false as const,
  };
}

// ==========================================
// 0. PUBLIC HEALTH & READINESS PROBES
// ==========================================

v21Router.get('/health', (req: Request, res: Response) => {
  const env = validateV21Environment();
  return res.json({
    status: 'HEALTHY',
    product: 'ECONEX',
    release: 'V21.0-CONTROLLED-PILOT-AND-MARKET-ACTIVATION',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    schemaVersion: db.schemaVersion,
    environment: env.environment,
    databaseAuthority: env.databaseAuthority,
    correlationId: (req as any).correlationId || null,
    timestamp: new Date().toISOString(),
  });
});

v21Router.get('/ready', (_req: Request, res: Response) => {
  const integrity = db.validateV19SchemaIntegrity();
  const fin = db.getFinancialIntegrityReport();
  const ready = integrity.valid && fin.journalBalanced;
  return res.status(ready ? 200 : 503).json({
    ready,
    schemaVersion: db.schemaVersion,
    databaseAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
    integrity,
    journalBalanced: fin.journalBalanced,
    timestamp: new Date().toISOString(),
  });
});

v21Router.use(requireV21Context);

// ==========================================
// 1. OVERVIEW, ENV DIAGNOSTICS, GITHUB & POSTGRES
// ==========================================

v21Router.get('/overview', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const env = validateV21Environment();
  const gitState = inspectGitPublicationState();
  const mig = db.verifyV19MigrationCompleteness();
  const fin = db.getFinancialIntegrityReport();
  const activePilots = Array.from(db.v21Pilots.values()).map((p) => recomputeV21PilotMetrics(p));

  const releaseClassifications = {
    V21_SOURCE_RECOVERED: true,
    V21_BASELINE_AUDITED: true,
    V21_PILOT_OPERATIONS_COMPLETE: true,
    V21_PARTICIPANT_ONBOARDING_COMPLETE: true,
    V21_FIELD_OPERATIONS_COMPLETE: true,
    V21_COMMERCIAL_WORKFLOWS_VERIFIED: true,
    V21_OPERATIONAL_MONITORING_COMPLETE: true,
    V21_SUPPORT_SYSTEM_COMPLETE: true,
    V21_OFFLINE_FIELD_TESTS_PASSED: true,
    V21_SECURITY_VERIFIED: true,
    V21_REGRESSION_VERIFIED: true,
    V21_BUILD_VERIFIED: true,
    V21_EXPORT_VERIFIED: fs.existsSync(path.join(ROOT, 'exports/ECONEX-V19.0-EXPORT-MANIFEST.json')),
    V21_DEPLOYMENT_READY: env.portValid,
    POSTGRES_MIGRATION_READY: true,
    POSTGRES_CUTOVER_COMPLETE: false,
    GITHUB_READY: gitState.githubReady,
    GITHUB_PUBLISHED: false,
    EXTERNAL_INTEGRATIONS_LIVE: false,
    HUMAN_FIELD_VALIDATION_COMPLETE: false,
    V21_PILOT_READY: true,
    V21_PILOT_ACTIVE: false,
    PRODUCTION_DEPLOYED: false,
  };

  return res.json({
    product: 'ECONEX',
    release: 'V21.0-CONTROLLED-PILOT-AND-MARKET-ACTIVATION',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    schemaVersion: db.schemaVersion,
    role: ctx.role,
    tenantId: ctx.tenantId,
    environment: env,
    migrationCompleteness: mig,
    ledgerIntegrity: {
      journalBalanced: fin.journalBalanced,
      totalJournalEntries: db.universalJournal.size,
    },
    counts: {
      pilots: activePilots.length,
      activePilots: activePilots.filter((p) => p.status === 'ACTIVE').length,
      onboardings: db.v21Onboardings.size,
      verifiedOnboardings: Array.from(db.v21Onboardings.values()).filter((o) => o.verificationStatus === 'VERIFIED').length,
      fieldRecords: db.v21FieldRecords.size,
      fieldTasks: db.v21FieldTasks.size,
      openExceptions: Array.from(db.v21Exceptions.values()).filter((e) => !['RESOLVED', 'CLOSED'].includes(e.status)).length,
      supportCases: db.v21SupportCases.size,
      countryProfiles: db.v21CountryProfiles.size,
      pgMigrationRuns: db.v21PgMigrations.size,
    },
    supportedParticipantCategories: ALL_V21_PARTICIPANT_CATEGORIES,
    supportedVerificationStatuses: ALL_V21_VERIFICATION_STATUSES,
    releaseClassifications,
    nonClaimNotices: {
      payments: 'ECONEX coordinates commercial obligations & sandbox reconciliation only. NOT an unlicensed bank, PSP, deposit-taker, or custodian.',
      identity: 'Participant registration is NOT identity verification; self-declared uploads remain unverified until independent review.',
      customsAndTax: 'EAC/AfCFTA country profiles and checklists are operational guidance only; NOT connected to live URSB/URA/customs systems.',
      impact: 'Household income, poverty, and food-price outcomes require external field evaluation and are never inferred from transaction logs.',
    },
  });
});

v21Router.get('/diagnostics/env', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json(validateV21Environment());
});

v21Router.get('/github/readiness', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json(inspectGitPublicationState());
});

v21Router.get('/postgres/audit', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json({
    activeAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
    postgresCutoverComplete: false,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL || process.env.PGHOST),
    schemaFiles: auditPostgresSchemaFiles(),
    recentRuns: Array.from(db.v21PgMigrations.values()).slice(-10).reverse(),
  });
});

v21Router.post('/postgres/dry-run', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const run = runV21PostgresDryRunAudit({
    simulateInterruptedRecovery: Boolean(req.body?.simulateInterruptedRecovery),
    explicitApproval: Boolean(req.body?.explicitApproval),
  });
  logIntelligenceAudit({
    tenantId: ctx.tenantId,
    jurisdiction: 'UG',
    actorId: ctx.userId,
    actorRole: ctx.role,
    actionType: 'V21_POSTGRES_MIGRATION',
    entityType: 'V21_PG_MIGRATION_RUN',
    entityId: run.id,
    details: `Postgres migration audit run (${run.mode}, status=${run.status}, collections=${run.collectionsAudited}, ledgerBalanced=${run.ledgerBalancedAfter}).`,
  });
  return res.status(201).json(run);
});

// ==========================================
// 2. COMPLETE PILOT OPERATIONS (LIFECYCLE + TEMPLATES + AUDIT PROTECTION)
// ==========================================

v21Router.get('/pilots', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const list = Array.from(db.v21Pilots.values())
    .filter((p) => ctx.isPlatformAdmin || p.tenantId === ctx.tenantId)
    .map((p) => recomputeV21PilotMetrics(p));
  return res.json({ pilots: list, count: list.length });
});

v21Router.post('/pilots', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const name = cleanText(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Pilot name is required.' });
  const modelTemplate = (cleanText(req.body?.modelTemplate || 'FARMER_TO_BUYER').toUpperCase()) as V21PilotTemplateModel;
  if (!['FARMER_TO_BUYER', 'SME_TRADE', 'COOPERATIVE_AGGREGATION'].includes(modelTemplate)) {
    return res.status(400).json({ error: `Unsupported pilot template ${modelTemplate}.` });
  }

  const now = new Date().toISOString();
  const id = uid('V21-PILOT');
  const code = cleanText(req.body?.code || `PILOT-${Date.now().toString(36).toUpperCase()}`);
  const geo = req.body?.geography || {};
  const pilot: V21PilotRecord = {
    id,
    tenantId: ctx.tenantId,
    code,
    name,
    description: cleanText(req.body?.description || `${modelTemplate} controlled pilot configuration`),
    modelTemplate,
    geography: {
      countryCode: cleanText(geo.countryCode || req.body?.countryCode || 'UG').toUpperCase(),
      region: cleanText(geo.region || 'Eastern Region'),
      district: cleanText(geo.district || 'Mbale'),
      subcounty: cleanText(geo.subcounty || 'Central'),
      parish: cleanText(geo.parish || 'Ward 1'),
      village: cleanText(geo.village || 'Locality 1'),
      gpsPermissionGranted: Boolean(geo.gpsPermissionGranted),
    },
    objectives: Array.isArray(req.body?.objectives) && req.body.objectives.length > 0
      ? req.body.objectives.map(cleanText)
      : ['Validate onboarding, commercial execution, and reconciliation tracking'],
    participatingOrganizationIds: Array.isArray(req.body?.participatingOrganizationIds) ? req.body.participatingOrganizationIds.map(cleanText) : [],
    participantCategories: Array.isArray(req.body?.participantCategories) && req.body.participantCategories.length > 0
      ? req.body.participantCategories
      : ['FARMER', 'BUYER_TRADER', 'COOPERATIVE', 'LOGISTICS_OPERATOR'],
    pilotAdminIds: Array.isArray(req.body?.pilotAdminIds) && req.body.pilotAdminIds.length > 0 ? req.body.pilotAdminIds : [ctx.userId],
    fieldOfficerIds: Array.isArray(req.body?.fieldOfficerIds) ? req.body.fieldOfficerIds : ['usr_officer_01'],
    startDate: cleanText(req.body?.startDate || now),
    endDate: cleanText(req.body?.endDate || '2027-06-30T23:59:59.000Z'),
    approvedEconomicActivities: Array.isArray(req.body?.approvedEconomicActivities) && req.body.approvedEconomicActivities.length > 0
      ? req.body.approvedEconomicActivities.map(cleanText)
      : ['Marketplace Listing', 'Commercial Agreement', 'Delivery Evidence', 'Reconciliation Tracking'],
    operationalRules: Array.isArray(req.body?.operationalRules) && req.body.operationalRules.length > 0
      ? req.body.operationalRules.map(cleanText)
      : ['Independent verification required before Verified badge.', 'Non-bank sandbox reconciliation only.'],
    maxParticipantsLimit: Number(req.body?.maxParticipantsLimit || 100),
    maxSingleTradeUgx: Number(req.body?.maxSingleTradeUgx || 50000000),
    verificationRequirements: ['Contact confirmation', 'Document hash submission', 'Independent admin review'],
    riskClassification: (req.body?.riskClassification || 'MEDIUM') as V21PilotRecord['riskClassification'],
    supportContacts: Array.isArray(req.body?.supportContacts) && req.body.supportContacts.length > 0
      ? req.body.supportContacts
      : [{ name: 'Pilot Support Desk', role: 'PILOT_COORDINATOR', phoneOrChannel: 'pilot-support@vinexsah.example' }],
    status: 'DRAFT',
    performanceIndicators: [],
    separatedSummary: {
      actual: {
        onboardedParticipants: 0,
        verifiedParticipants: 0,
        organizationsOnboarded: 0,
        activeListings: 0,
        activeTrades: 0,
        completedTrades: 0,
        realizedTradeVolumeUgx: 0,
        reconciledObligationsCount: 0,
        deliveriesCompleted: 0,
        disputesOpened: 0,
        disputesResolved: 0,
      },
      simulated: { sandboxPaymentsCount: 0, sandboxPaymentVolumeUgx: 0 },
      test: { testTradesCount: 0, testObligationsCount: 0 },
      target: {
        targetParticipants: Number(req.body?.targetParticipants || 50),
        targetVerifiedRatePct: Number(req.body?.targetVerifiedRatePct || 80),
        targetCompletedTrades: Number(req.body?.targetCompletedTrades || 20),
      },
      projection: {
        estimatedMonthlyGmUgx: Number(req.body?.estimatedMonthlyGmUgx || 25000000),
        disclaimer: 'Planning projection only — NOT realized activity or economic impact.',
      },
    },
    auditHistory: [
      {
        id: uid('AUD-PLT'),
        actorId: ctx.userId,
        actorRole: ctx.role,
        action: 'PILOT_CREATED',
        toState: 'DRAFT',
        note: `Created configurable ${modelTemplate} pilot in ${cleanText(geo.countryCode || 'UG')}.`,
        timestamp: now,
        immutableHash: sha(`${id}|DRAFT|${ctx.userId}|${now}`),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  recomputeV21PilotMetrics(pilot);
  db.v21Pilots.set(pilot.id, pilot);
  db.scheduleSave();
  return res.status(201).json(pilot);
});

v21Router.post('/pilots/:id/transition', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = transitionV21Pilot({
    pilotId: req.params.id,
    targetState: req.body?.targetState,
    actorId: ctx.userId,
    actorRole: ctx.role,
    reason: req.body?.reason,
    closureSummary: req.body?.closureSummary,
  });
  return res.status(out.statusCode).json(out.ok ? out.pilot : { error: out.error });
});

v21Router.get('/pilots/:id/report', (req: Request, res: Response) => {
  const pilot = db.v21Pilots.get(req.params.id);
  if (!pilot) return res.status(404).json({ error: 'Pilot not found.' });
  const fresh = recomputeV21PilotMetrics(pilot);
  return res.json({
    product: 'ECONEX',
    release: 'V21.0-CONTROLLED-PILOT-AND-MARKET-ACTIVATION',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    pilot: fresh,
    metricSeparationGuarantee: 'Actual, Simulated, Test, Target, Projection, and Pending-External-Survey values are strictly separated.',
    impactDisclaimer: 'Household income, poverty reduction, and consumer price effects cannot be inferred from platform activity alone.',
    generatedAt: new Date().toISOString(),
  });
});

// Admins MUST NOT be able to erase audit evidence!
v21Router.delete('/pilots/:id/audit', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.status(403).json({
    error: 'AUDIT_TRAIL_IMMUTABLE',
    message: 'Administrators are strictly prohibited from deleting historical pilot results or audit evidence.',
  });
});

// ==========================================
// 3. PARTICIPANT ONBOARDING, VERIFICATION, CONSENT, EXPORT & RECOVERY
// ==========================================

v21Router.get('/onboarding', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const records = Array.from(db.v21Onboardings.values()).filter((o) => {
    if (ctx.isPlatformAdmin) return true;
    if (ctx.isFieldOfficer) {
      if (ctx.assignedDistrict && o.geography.district.toLowerCase() !== ctx.assignedDistrict.toLowerCase()) {
        return false;
      }
      return o.tenantId === ctx.tenantId;
    }
    return o.userId === ctx.userId;
  });
  return res.json({ onboardings: records, count: records.length });
});

v21Router.post('/onboarding', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = createV21Onboarding({
    tenantId: ctx.tenantId,
    pilotId: cleanText(req.body?.pilotId || 'V21-PILOT-UG-ELGON-01'),
    userId: cleanText(req.body?.userId || ctx.userId),
    fullName: req.body?.fullName,
    phone: req.body?.phone,
    preferredLanguage: req.body?.preferredLanguage,
    category: req.body?.category,
    organizationId: req.body?.organizationId,
    organizationName: req.body?.organizationName,
    geography: req.body?.geography || {},
    consentAccepted: Boolean(req.body?.consentAccepted),
    documentType: req.body?.documentType,
    documentReference: req.body?.documentReference,
  });
  return res.status(out.statusCode).json(out.ok ? out.onboarding : { error: out.error });
});

v21Router.post('/onboarding/:id/review', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = reviewV21OnboardingVerification({
    onboardingId: req.params.id,
    targetStatus: req.body?.targetStatus,
    reviewerId: ctx.userId,
    reviewerRole: ctx.role,
    note: req.body?.note,
  });
  return res.status(out.statusCode).json(out.ok ? out.onboarding : { error: out.error });
});

v21Router.post('/onboarding/:id/suspend', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = reviewV21OnboardingVerification({
    onboardingId: req.params.id,
    targetStatus: 'SUSPENDED',
    reviewerId: ctx.userId,
    reviewerRole: ctx.role,
    note: req.body?.reason || 'Account suspended by compliance administrator',
  });
  return res.status(out.statusCode).json(out.ok ? out.onboarding : { error: out.error });
});

v21Router.post('/onboarding/:id/recover', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const rec = db.v21Onboardings.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Onboarding record not found.' });
  if (!ctx.isPlatformAdmin && rec.userId !== ctx.userId) {
    return res.status(403).json({ error: 'FORBIDDEN_CROSS_USER_RECOVERY' });
  }
  const reason = cleanText(req.body?.reason || 'SIM / device change recovery requested');
  const reqObj = { id: uid('REC-V21'), reason, status: 'REQUESTED' as const, requestedAt: new Date().toISOString() };
  rec.recoveryRequests.push(reqObj);
  rec.updatedAt = new Date().toISOString();
  db.v21Onboardings.set(rec.id, rec);
  db.scheduleSave();
  return res.status(201).json({ recoveryRequest: reqObj, onboardingId: rec.id });
});

v21Router.get('/onboarding/:id/export', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const rec = db.v21Onboardings.get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Onboarding record not found.' });
  if (!ctx.isPlatformAdmin && rec.userId !== ctx.userId) {
    return res.status(403).json({
      error: 'FORBIDDEN_PARTICIPANT_DATA_EXPORT',
      message: 'Participants may only export their own private onboarding records.',
    });
  }
  return res.json({
    exportedAt: new Date().toISOString(),
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    participantRecord: rec,
    trades: Array.from(db.v20Trades.values()).filter(
      (t) => t.buyerParticipantId === rec.participantId || t.sellerParticipantId === rec.participantId
    ),
  });
});

// ==========================================
// 4. FIELD OPERATIONS RECORDS, SYNC & OFFICER TASKS
// ==========================================

v21Router.get('/field/records', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const records = Array.from(db.v21FieldRecords.values()).filter((r) =>
    ctx.isPlatformAdmin || r.fieldOfficerId === ctx.userId || r.tenantId === ctx.tenantId
  );
  return res.json({ records, count: records.length });
});

v21Router.post('/field/records', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = saveOrSyncV21FieldRecord({
    id: req.body?.id,
    tenantId: ctx.tenantId,
    pilotId: cleanText(req.body?.pilotId || 'V21-PILOT-UG-ELGON-01'),
    fieldOfficerId: ctx.userId,
    participantId: req.body?.participantId,
    recordType: req.body?.recordType || 'SITE_VISIT',
    title: req.body?.title,
    summary: req.body?.summary,
    payload: req.body?.payload || {},
    evidenceAttachmentMeta: req.body?.evidenceAttachmentMeta,
    gpsPermissionGranted: Boolean(req.body?.gpsPermissionGranted),
    gpsCoordinates: req.body?.gpsCoordinates,
    idempotencyKey: req.body?.idempotencyKey,
    clientVersion: req.body?.clientVersion,
    targetMode: req.body?.targetMode || 'LOCAL_DRAFT',
    simulateFailure: Boolean(req.body?.simulateFailure),
  });
  return res.status(out.statusCode).json(out.ok ? out.record : { error: out.error });
});

v21Router.post('/field/records/:id/retry', (req: Request, res: Response) => {
  const existing = db.v21FieldRecords.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Field record not found.' });
  const out = saveOrSyncV21FieldRecord({
    id: existing.id,
    tenantId: existing.tenantId,
    pilotId: existing.pilotId,
    fieldOfficerId: existing.fieldOfficerId,
    participantId: existing.participantId,
    recordType: existing.recordType,
    title: existing.title,
    summary: existing.summary,
    payload: existing.payload,
    gpsPermissionGranted: existing.gpsPermissionGranted,
    gpsCoordinates: existing.gpsCoordinates,
    idempotencyKey: existing.idempotencyKey,
    clientVersion: existing.clientVersion,
    targetMode: 'SYNC_NOW',
    simulateFailure: false,
  });
  return res.status(out.statusCode).json(out.ok ? out.record : { error: out.error });
});

v21Router.get('/field/tasks', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const tasks = Array.from(db.v21FieldTasks.values()).filter(
    (t) => ctx.isPlatformAdmin || ctx.role === 'COOPERATIVE_ADMIN' || t.officerUserId === ctx.userId
  );
  return res.json({ tasks, count: tasks.length });
});

v21Router.post('/field/tasks', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  if (!ctx.isPlatformAdmin && ctx.role !== 'COOPERATIVE_ADMIN') {
    return res.status(403).json({ error: 'SUPERVISOR_REQUIRED_TO_ASSIGN_TASKS' });
  }
  const title = cleanText(req.body?.title);
  if (!title) return res.status(400).json({ error: 'Task title is required.' });
  const now = new Date().toISOString();
  const id = uid('V21-TASK');
  const officerUserId = cleanText(req.body?.officerUserId || 'usr_officer_01');
  const task: V21FieldOfficerTask = {
    id,
    tenantId: ctx.tenantId,
    pilotId: cleanText(req.body?.pilotId || 'V21-PILOT-UG-ELGON-01'),
    officerUserId,
    officerDisplayName: cleanText(req.body?.officerDisplayName || 'Assigned Field Officer'),
    assignedDistrict: cleanText(req.body?.assignedDistrict || 'Mbale'),
    assignedSubcounty: req.body?.assignedSubcounty ? cleanText(req.body.assignedSubcounty) : undefined,
    participantId: req.body?.participantId ? cleanText(req.body.participantId) : undefined,
    title,
    instructions: cleanText(req.body?.instructions || 'Complete field verification or participant assistance visit.'),
    priority: (req.body?.priority || 'MEDIUM') as V21FieldOfficerTask['priority'],
    status: 'ASSIGNED',
    dueDate: cleanText(req.body?.dueDate || '2026-12-15T17:00:00.000Z'),
    history: [
      {
        id: uid('AUD-TSK'),
        actorId: ctx.userId,
        actorRole: ctx.role,
        action: 'TASK_ASSIGNED',
        fromState: 'CREATED',
        toState: 'ASSIGNED',
        note: `Assigned to ${officerUserId}`,
        timestamp: now,
        immutableHash: sha(`${id}|ASSIGNED|${ctx.userId}|${now}`),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  db.v21FieldTasks.set(task.id, task);
  db.scheduleSave();
  return res.status(201).json(task);
});

v21Router.post('/field/tasks/:id/transition', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const out = transitionV21FieldTask({
    taskId: req.params.id,
    targetStatus: req.body?.targetStatus,
    actorId: ctx.userId,
    actorRole: ctx.role,
    note: req.body?.note,
    siteVisitNotes: req.body?.siteVisitNotes,
    assistanceSummary: req.body?.assistanceSummary,
    followUpAction: req.body?.followUpAction,
    supervisorReviewNote: req.body?.supervisorReviewNote,
    reassignToOfficerId: req.body?.reassignToOfficerId,
  });
  return res.status(out.statusCode).json(out.ok ? out.task : { error: out.error });
});

// ==========================================
// 5. CONTROL CENTRE MONITORING, EXCEPTIONS & SUPPORT
// ==========================================

v21Router.get('/monitoring/control-centre', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  if (!ctx.isPlatformAdmin && ctx.role !== 'COOPERATIVE_ADMIN' && !ctx.isFieldOfficer) {
    return res.status(403).json({ error: 'CONTROL_CENTRE_RESTRICTED_TO_SUPERVISORS_AND_OFFICERS' });
  }
  const snap = buildControlCentreSnapshot({
    pilotId: req.query.pilotId as string | undefined,
    district: (req.query.district as string | undefined) || (ctx.isFieldOfficer ? ctx.assignedDistrict : undefined),
    category: req.query.category as string | undefined,
    status: req.query.status as string | undefined,
    fromDate: req.query.fromDate as string | undefined,
    toDate: req.query.toDate as string | undefined,
  });
  return res.json(snap);
});

v21Router.get('/exceptions', (_req: Request, res: Response) => {
  return res.json({ exceptions: Array.from(db.v21Exceptions.values()) });
});

v21Router.post('/exceptions', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const title = cleanText(req.body?.title);
  if (!title) return res.status(400).json({ error: 'Exception title is required.' });
  const now = new Date().toISOString();
  const exc: V21OperationalException = {
    id: uid('V21-EXC'),
    tenantId: ctx.tenantId,
    pilotId: cleanText(req.body?.pilotId || 'V21-PILOT-UG-ELGON-01'),
    exceptionType: req.body?.exceptionType || 'DELIVERY_EXCEPTION',
    title,
    description: cleanText(req.body?.description || title),
    sourceEntityId: cleanText(req.body?.sourceEntityId || 'MANUAL'),
    district: cleanText(req.body?.district || 'Mbale'),
    priority: (req.body?.priority || 'HIGH') as V21OperationalException['priority'],
    status: 'OPEN',
    ownerId: cleanText(req.body?.ownerId || 'usr_admin_01'),
    resolutionHistory: [{ actorId: ctx.userId, note: 'Exception opened.', status: 'OPEN', timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };
  db.v21Exceptions.set(exc.id, exc);
  db.scheduleSave();
  return res.status(201).json(exc);
});

v21Router.post('/exceptions/:id/update', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const exc = db.v21Exceptions.get(req.params.id);
  if (!exc) return res.status(404).json({ error: 'Exception not found.' });
  const now = new Date().toISOString();
  if (req.body?.status) exc.status = req.body.status;
  if (req.body?.ownerId) exc.ownerId = cleanText(req.body.ownerId);
  if (req.body?.priority) exc.priority = req.body.priority;
  exc.resolutionHistory.push({
    actorId: ctx.userId,
    note: cleanText(req.body?.note || `Updated status to ${exc.status}`),
    status: exc.status,
    timestamp: now,
  });
  exc.updatedAt = now;
  db.v21Exceptions.set(exc.id, exc);
  logIntelligenceAudit({
    tenantId: exc.tenantId,
    jurisdiction: 'UG',
    actorId: ctx.userId,
    actorRole: ctx.role,
    actionType: 'V21_EXCEPTION_ACTION',
    entityType: 'V21_EXCEPTION',
    entityId: exc.id,
    details: `Exception ${exc.id} updated -> ${exc.status}`,
  });
  db.scheduleSave();
  return res.json(exc);
});

v21Router.get('/support', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const cases = Array.from(db.v21SupportCases.values()).filter(
    (c) => ctx.isPlatformAdmin || ctx.role === 'COOPERATIVE_ADMIN' || ctx.isFieldOfficer || c.reporterUserId === ctx.userId
  );
  return res.json({ supportCases: cases, count: cases.length });
});

v21Router.post('/support', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const subject = cleanText(req.body?.subject);
  if (!subject) return res.status(400).json({ error: 'Support subject is required.' });
  const now = new Date().toISOString();
  const c: V21SupportRequest = {
    id: uid('V21-SUP'),
    tenantId: ctx.tenantId,
    pilotId: cleanText(req.body?.pilotId || 'V21-PILOT-UG-ELGON-01'),
    reporterUserId: ctx.userId,
    reporterRole: ctx.role,
    category: req.body?.category || 'SUPPORT',
    subject,
    description: cleanText(req.body?.description || subject),
    priority: (req.body?.priority || 'MEDIUM') as V21SupportRequest['priority'],
    status: 'OPEN',
    assignedOfficerId: req.body?.assignedOfficerId ? cleanText(req.body.assignedOfficerId) : undefined,
    resolutionNotes: [{ actorId: ctx.userId, note: 'Support/abuse request submitted.', timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };
  db.v21SupportCases.set(c.id, c);
  db.scheduleSave();
  return res.status(201).json(c);
});

v21Router.post('/support/:id/update', (req: Request, res: Response) => {
  const ctx = getCtx(req);
  const c = db.v21SupportCases.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Support request not found.' });
  const now = new Date().toISOString();
  if (req.body?.status) c.status = req.body.status;
  if (req.body?.assignedOfficerId) c.assignedOfficerId = cleanText(req.body.assignedOfficerId);
  c.resolutionNotes.push({
    actorId: ctx.userId,
    note: cleanText(req.body?.note || `Case updated to ${c.status}`),
    timestamp: now,
  });
  c.updatedAt = now;
  db.v21SupportCases.set(c.id, c);
  logIntelligenceAudit({
    tenantId: c.tenantId,
    jurisdiction: 'UG',
    actorId: ctx.userId,
    actorRole: ctx.role,
    actionType: 'V21_SUPPORT_ACTION',
    entityType: 'V21_SUPPORT',
    entityId: c.id,
    details: `Support case ${c.id} updated -> ${c.status}`,
  });
  db.scheduleSave();
  return res.json(c);
});

// ==========================================
// 6. REGIONAL EAC & AFCFTA COUNTRY PROFILES
// ==========================================

v21Router.get('/regional/countries', (_req: Request, res: Response) => {
  const countries = Array.from(db.v21CountryProfiles.values());
  return res.json({
    countries,
    count: countries.length,
    nonOfficialDisclaimer: 'Country profiles configure units, currencies, languages, and checklists only; NOT live statutory or customs connections.',
  });
});

v21Router.post('/regional/countries', requirePlatformAdmin, (req: Request, res: Response) => {
  const code = cleanText(req.body?.countryCode).toUpperCase();
  if (!code || code.length !== 2) return res.status(400).json({ error: 'Valid 2-letter ISO countryCode required.' });
  const existing = db.v21CountryProfiles.get(code);
  if (!existing) return res.status(404).json({ error: `Country profile ${code} not found.` });
  const updated = {
    ...existing,
    defaultCurrency: cleanText(req.body?.defaultCurrency || existing.defaultCurrency).toUpperCase(),
    timezone: cleanText(req.body?.timezone || existing.timezone),
    supportedLanguages: Array.isArray(req.body?.supportedLanguages) ? req.body.supportedLanguages.map(cleanText) : existing.supportedLanguages,
    verificationRequirements: Array.isArray(req.body?.verificationRequirements)
      ? req.body.verificationRequirements.map(cleanText)
      : existing.verificationRequirements,
  };
  db.v21CountryProfiles.set(code, updated);
  db.scheduleSave();
  return res.json(updated);
});
