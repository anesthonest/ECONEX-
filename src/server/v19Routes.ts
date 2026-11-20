/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V19.0 - Platform Stability, Diagnostics, Secret Scanning & Verified Export API (/api/v19/*)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import type { UserRole, V19DiagnosticsSummary } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(ROOT, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'aros_database.json');
const EXPORT_DIR = path.join(ROOT, 'exports');
const ARCHIVE_PATH = path.join(EXPORT_DIR, 'ECONEX-V19.0-SOURCE.zip');
const MANIFEST_PATH = path.join(EXPORT_DIR, 'ECONEX-V19.0-EXPORT-MANIFEST.json');
const REPORT_FILE = path.join(ROOT, '.econex-reports', 'verification-latest.json');

export const v19Router = Router();

interface V19Context {
  tenantId: string;
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
}

const RECENT_RUNTIME_ERRORS: string[] = [];

export function recordV19RuntimeError(msg: string) {
  RECENT_RUNTIME_ERRORS.unshift(`${new Date().toISOString()} — ${msg}`);
  if (RECENT_RUNTIME_ERRORS.length > 25) RECENT_RUNTIME_ERRORS.pop();
}

function resolveV19Actor(req: Request): { userId?: string; role: UserRole; isPlatformAdmin: boolean } {
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

function recordV19SecurityIncident(
  category: any,
  severity: any,
  tenantId: string,
  actorId: string | undefined,
  details: string
) {
  const id = `SECINC-V19-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
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

function requireV19Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV19Actor(req);
  if (!actor.userId) {
    recordV19SecurityIncident(
      'AUTH_FAILURE_BURST',
      'MEDIUM',
      'GLOBAL_PUBLIC',
      undefined,
      `Unauthenticated V19 request blocked on ${req.path}`
    );
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V19 APIs.',
    });
  }

  const headerTenant = (req.headers['x-tenant-id'] as string | undefined)?.trim();
  const explicitParamTenant =
    (req.query.tenantId as string | undefined)?.trim() ||
    (req.body?.tenantId as string | undefined)?.trim();
  const requestedTenantId = explicitParamTenant || headerTenant || 'TEN-UG-ELGON-01';

  if (
    !actor.isPlatformAdmin &&
    requestedTenantId !== 'GLOBAL_PUBLIC' &&
    headerTenant &&
    explicitParamTenant &&
    headerTenant !== explicitParamTenant
  ) {
    recordV19SecurityIncident(
      'CROSS_TENANT_ACCESS',
      'HIGH',
      requestedTenantId,
      actor.userId,
      `Cross-tenant access blocked on V19 ${req.path}`
    );
    return res.status(403).json({
      error: 'CROSS_TENANT_ACCESS_BLOCKED',
      message: 'Access denied across tenant boundary.',
    });
  }

  (req as any).v19Context = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } satisfies V19Context;
  return next();
}

function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as any).v19Context as V19Context;
  if (!ctx?.isPlatformAdmin) {
    recordV19SecurityIncident(
      'RBAC_ESCALATION',
      'HIGH',
      ctx?.tenantId || 'GLOBAL_PUBLIC',
      ctx?.userId,
      `Non-admin V19 diagnostics/export attempt on ${req.path}`
    );
    return res.status(403).json({
      error: 'PLATFORM_ADMIN_REQUIRED',
      message: `Role ${ctx?.role || 'UNKNOWN'} cannot access V19 system diagnostics or source exports.`,
    });
  }
  return next();
}

function dirSizeBytes(targetDir: string, maxDepth = 4, depth = 0): number {
  if (!fs.existsSync(targetDir) || depth > maxDepth) return 0;
  let total = 0;
  try {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        total += dirSizeBytes(full, maxDepth, depth + 1);
      } else {
        try {
          total += fs.statSync(full).size;
        } catch {
          // ignore transient tmp file
        }
      }
    }
  } catch {
    return total;
  }
  return total;
}

function inspectGitState() {
  const gitDir = path.join(ROOT, '.git');
  const gitInitialized = fs.existsSync(gitDir);
  const gitignorePath = path.join(ROOT, '.gitignore');
  const gitignoreText = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const gitignoreProtected =
    gitignoreText.includes('node_modules/') &&
    gitignoreText.includes('data/aros_database.json') &&
    gitignoreText.includes('.env*');

  if (!gitInitialized) {
    return {
      gitInitialized: false,
      branch: null,
      remoteConfigured: false,
      remoteNames: [],
      latestCommit: null,
      dirtyEntriesCount: null,
      gitignoreProtected,
    };
  }

  const runGit = (args: string[]): string | null => {
    try {
      return execFileSync('git', ['-c', `safe.directory=${ROOT}`, ...args], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
    } catch {
      return null;
    }
  };

  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const remotesRaw = runGit(['remote']) || '';
  const remoteNames = remotesRaw ? remotesRaw.split('\n').map((s) => s.trim()).filter(Boolean) : [];
  const latestCommit = runGit(['rev-parse', '--short', 'HEAD']);
  const statusRaw = runGit(['status', '--porcelain']);
  const dirtyEntriesCount = statusRaw === null ? null : statusRaw ? statusRaw.split('\n').filter(Boolean).length : 0;

  return {
    gitInitialized: true,
    branch,
    remoteConfigured: remoteNames.length > 0,
    remoteNames,
    latestCommit,
    dirtyEntriesCount,
    gitignoreProtected,
  };
}

function buildDiagnosticsSummary(): V19DiagnosticsSummary {
  const mem = process.memoryUsage();
  const srcBytes = dirSizeBytes(path.join(ROOT, 'src'));
  const dataBytes = dirSizeBytes(DATA_DIR);
  const walExists = fs.existsSync(DB_FILE);
  const walBytes = walExists ? fs.statSync(DB_FILE).size : 0;
  const backupsCount = fs.existsSync(BACKUP_DIR)
    ? fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json')).length
    : 0;
  const nodeModulesPresent = fs.existsSync(path.join(ROOT, 'node_modules'));
  const distDir = path.join(ROOT, 'dist');
  const distBuildPresent = fs.existsSync(distDir);
  const distIndexPresent = fs.existsSync(path.join(distDir, 'index.html'));

  const finReport = db.getFinancialIntegrityReport();
  const latestMigration = db.migrationHistory[db.migrationHistory.length - 1];

  let manifest: any = null;
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch {
      manifest = null;
    }
  }
  const zipExists = fs.existsSync(ARCHIVE_PATH);
  const zipStat = zipExists ? fs.statSync(ARCHIVE_PATH) : null;
  const exportVerified = Boolean(zipExists && manifest?.verification?.verified);

  let verReport: any = null;
  if (fs.existsSync(REPORT_FILE)) {
    try {
      verReport = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    } catch {
      verReport = null;
    }
  }

  const gitRepository = inspectGitState();
  const warnings: string[] = [];
  if (!distIndexPresent) warnings.push('Production build output (dist/index.html) not generated yet; run `npm run build`.');
  if (!process.env.DATABASE_URL) warnings.push('PostgreSQL 16 (DATABASE_URL) is NOT_PROVISIONED; running authoritative local JSON WAL.');
  if (!gitRepository.remoteConfigured) warnings.push('No GitHub remote is configured or authorized in this container environment.');
  if (!exportVerified) warnings.push('Source archive exports/ECONEX-V19.0-SOURCE.zip has not been generated/verified yet.');
  if (backupsCount > 12) warnings.push(`Rolling backups directory has ${backupsCount} files; keep pruned to avoid workspace bloat.`);

  const artifactChecks = (() => {
    let packageScriptsReady = false;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
      packageScriptsReady = Boolean(
        pkg.scripts?.dev &&
          pkg.scripts?.start &&
          pkg.scripts?.build &&
          pkg.scripts?.['build:check'] &&
          pkg.scripts?.typecheck &&
          pkg.scripts?.test &&
          pkg.scripts?.verify &&
          pkg.scripts?.['export:zip'] &&
          pkg.scripts?.['security:scan']
      );
    } catch {
      packageScriptsReady = false;
    }
    return {
      envExamplePresent: fs.existsSync(path.join(ROOT, '.env.example')),
      readmePresent: fs.existsSync(path.join(ROOT, 'README.md')),
      recoveryDocPresent: fs.existsSync(path.join(ROOT, 'RECOVERY.md')),
      deploymentDocPresent: fs.existsSync(path.join(ROOT, 'DEPLOYMENT.md')),
      gitattributesPresent: fs.existsSync(path.join(ROOT, '.gitattributes')),
      packageScriptsReady,
      sequentialVerifierPresent: fs.existsSync(path.join(ROOT, 'scripts/econex-verify-sequential.mjs')),
      secretScannerPresent: fs.existsSync(path.join(ROOT, 'scripts/econex-secret-scan.mjs')),
      zipExporterPresent: fs.existsSync(path.join(ROOT, 'scripts/econex-export.mjs')),
    };
  })();

  return {
    product: 'ECONEX',
    release: 'V19.0-PLATFORM-STABILITY-AND-DELIVERY',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    environment: process.env.ECONEX_ENV || (process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'),
    schemaVersion: db.schemaVersion,
    port: Number(process.env.PORT) || 3000,
    serverUptimeSeconds: Math.round(process.uptime()),
    memory: {
      processRssMb: Number((mem.rss / (1024 * 1024)).toFixed(1)),
      heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(1)),
      heapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(1)),
      systemTotalMb: Math.round(os.totalmem() / (1024 * 1024)),
      systemFreeMb: Math.round(os.freemem() / (1024 * 1024)),
    },
    workspace: {
      srcSizeMb: Number((srcBytes / (1024 * 1024)).toFixed(2)),
      dataSizeMb: Number((dataBytes / (1024 * 1024)).toFixed(2)),
      walFileSizeMb: Number((walBytes / (1024 * 1024)).toFixed(2)),
      walExists,
      rollingBackupsCount: backupsCount,
      nodeModulesPresent,
      distBuildPresent,
      distIndexPresent,
    },
    persistence: {
      authorityMode: 'LOCAL_JSON_WAL_AUTHORITATIVE',
      postgresConfigured: Boolean(process.env.DATABASE_URL),
      postgresConnected: false,
      lastBackupTimestamp: latestMigration?.migratedAt || null,
      journalBalanced: finReport.journalBalanced,
    },
    exportArchive: {
      exists: zipExists,
      verified: exportVerified,
      archiveName: 'ECONEX-V19.0-SOURCE.zip',
      bytes: zipStat ? zipStat.size : 0,
      sha256: manifest?.verification?.sha256 || null,
      fileCount: manifest?.verification?.fileCount || 0,
      verifiedAt: manifest?.verification?.verifiedAt || null,
      downloadUrl: exportVerified ? '/api/v19/export/download' : null,
    },
    gitRepository,
    verificationReport: {
      available: Boolean(verReport),
      executedAt: verReport?.completedAt || null,
      overallStatus: verReport?.overallStatus || null,
      totalPassed: Number(verReport?.totalPassed || 0),
      totalFailed: Number(verReport?.totalFailed || 0),
      suitesCount: Array.isArray(verReport?.suites) ? verReport.suites.length : 0,
    },
    artifactChecks,
    warnings,
    recentErrors: [...RECENT_RUNTIME_ERRORS],
    milestones: {
      ENGINEERING_STABLE: walExists && finReport.journalBalanced && nodeModulesPresent && srcBytes > 0,
      EXPORT_READY: exportVerified,
      GITHUB_READY: gitRepository.gitInitialized && gitRepository.gitignoreProtected && Boolean(manifest?.secretScan?.passed ?? true),
      GITHUB_PUBLISHED: gitRepository.remoteConfigured && Boolean(gitRepository.latestCommit) && false,
      DEPLOYMENT_READY: distIndexPresent && Boolean(process.env.DATABASE_URL) && finReport.journalBalanced,
      PRODUCTION_DEPLOYED: false,
    },
  };
}

// Public stability health endpoint (strictly non-PII, non-secret telemetry)
v19Router.get('/health', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  return res.json({
    status: 'HEALTHY',
    product: 'ECONEX',
    system: 'ECONEX V19',
    release: 'V19.0-PLATFORM-STABILITY-AND-DELIVERY',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    schemaVersion: db.schemaVersion,
    environment: process.env.ECONEX_ENV || (process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'),
    uptimeSeconds: Math.round(process.uptime()),
    memoryRssMb: Number((mem.rss / (1024 * 1024)).toFixed(1)),
    walExists: fs.existsSync(DB_FILE),
    timestamp: new Date().toISOString(),
  });
});

// Strict authentication & RBAC guard for all diagnostics/export endpoints below
v19Router.use(requireV19Context);

v19Router.get('/diagnostics', requirePlatformAdmin, (_req: Request, res: Response) => {
  return res.json(buildDiagnosticsSummary());
});

v19Router.post('/secret-scan', requirePlatformAdmin, (_req: Request, res: Response) => {
  try {
    const raw = execFileSync('node', [path.join(ROOT, 'scripts/econex-secret-scan.mjs'), '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return res.json(JSON.parse(raw));
  } catch (err: any) {
    recordV19RuntimeError(`Secret scan execution error: ${err?.message || err}`);
    return res.status(500).json({ error: 'SECRET_SCAN_FAILED', message: err?.message || 'Scan failed' });
  }
});

v19Router.post('/export/generate', requirePlatformAdmin, (req: Request, res: Response) => {
  const ctx = (req as any).v19Context as V19Context;
  try {
    const raw = execFileSync('node', [path.join(ROOT, 'scripts/econex-export.mjs'), '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    const manifest = JSON.parse(raw);

    logIntelligenceAudit({
      tenantId: ctx.tenantId,
      jurisdiction: 'UG',
      actorId: ctx.userId,
      actorRole: ctx.role,
      actionType: 'V19_EXPORT_VERIFIED',
      entityType: 'SOURCE_ARCHIVE',
      entityId: manifest.verification.archiveName,
      details: `Generated and verified secret-free source archive (${manifest.verification.bytes} bytes, ${manifest.verification.fileCount} files, SHA-256 ${manifest.verification.sha256.slice(0, 16)}...).`,
    });

    return res.json({
      ...manifest,
      downloadUrl: '/api/v19/export/download',
    });
  } catch (err: any) {
    recordV19RuntimeError(`Export generation failed: ${err?.message || err}`);
    return res.status(500).json({
      error: 'EXPORT_GENERATION_FAILED',
      message: err?.message || 'Unable to generate verified ZIP archive.',
    });
  }
});

v19Router.get('/export/download', requirePlatformAdmin, (_req: Request, res: Response) => {
  if (!fs.existsSync(ARCHIVE_PATH) || !fs.existsSync(MANIFEST_PATH)) {
    return res.status(404).json({
      error: 'ARCHIVE_NOT_GENERATED',
      message: 'Verified source archive has not been generated yet. Run POST /api/v19/export/generate or `npm run export:zip`.',
    });
  }
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="ECONEX-V19.0-SOURCE.zip"');
  return res.sendFile(ARCHIVE_PATH);
});

v19Router.get('/diagnostics/report-download', requirePlatformAdmin, (_req: Request, res: Response) => {
  const summary = buildDiagnosticsSummary();
  const payload = {
    generatedAt: new Date().toISOString(),
    credentialFreeDiagnosticBundle: true,
    userRecordsIncluded: false,
    ...summary,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="ECONEX-V19-DIAGNOSTIC-REPORT.json"');
  return res.send(JSON.stringify(payload, null, 2));
});
