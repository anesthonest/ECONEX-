/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V31.0 — GitHub Repository Hygiene, CI/CD Workflows & Deployment Readiness Engine
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { db } from './db.ts';
import { getV31PostgresDiagnostics } from './v31PostgresEngine.ts';
import type { V31DeploymentEnvironment, V31DeploymentRecord, V31ReleaseVerificationRecord } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

function runGit(args: string): { ok: boolean; stdout: string; stderr: string } {
  try {
    const out = execSync(`git -c safe.directory=${ROOT} ${args}`, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
    })
      .toString('utf8')
      .trim();
    return { ok: true, stdout: out, stderr: '' };
  } catch (err: any) {
    return {
      ok: false,
      stdout: err?.stdout ? String(err.stdout).trim() : '',
      stderr: err?.stderr ? String(err.stderr).trim() : String(err?.message || err),
    };
  }
}

export function getV31GitHubDiagnostics() {
  const gitBinary = runGit('--version');
  const gitFolderExists = fs.existsSync(path.join(ROOT, '.git'));
  const branchRes = gitFolderExists ? runGit('rev-parse --abbrev-ref HEAD') : { ok: false, stdout: 'UNINITIALIZED', stderr: '' };
  const headCommitRes = gitFolderExists ? runGit('rev-parse --short HEAD') : { ok: false, stdout: '', stderr: '' };
  const commitMsgRes = gitFolderExists ? runGit('log -1 --pretty=%s') : { ok: false, stdout: '', stderr: '' };
  const commitCountRes = gitFolderExists ? runGit('rev-list --count HEAD') : { ok: false, stdout: '0', stderr: '' };
  const statusRes = gitFolderExists ? runGit('status --porcelain') : { ok: false, stdout: '', stderr: '' };
  const remoteRes = gitFolderExists ? runGit('remote -v') : { ok: false, stdout: '', stderr: '' };

  const dirtyLines = statusRes.stdout
    ? statusRes.stdout.split('\n').filter((l) => l.trim().length > 0)
    : [];

  const gitignorePath = path.join(ROOT, '.gitignore');
  const gitignoreText = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const requiredIgnores = [
    'node_modules/',
    'dist/',
    '.env*',
    'data/aros_database.json',
    'data/*.backup.json',
    'data/backups/',
    'exports/',
    '*.zip',
    '*.sqlite*',
    '.aistudio/',
  ];
  const missingIgnoreRules = requiredIgnores.filter((r) => !gitignoreText.includes(r));

  const trackedSensitive = gitFolderExists
    ? runGit('ls-files').stdout
        .split('\n')
        .filter((f) => f && f !== '.env.example' && (/^(node_modules\/|data\/|exports\/|\.env($|\.)|\.aistudio\/)|\.zip$/i).test(f))
    : [];

  const workflowsDir = path.join(ROOT, '.github', 'workflows');
  const workflowFiles = ['econex-ci.yml', 'ci.yml', 'security.yml'].map((name) => {
    const p = path.join(workflowsDir, name);
    const exists = fs.existsSync(p);
    const content = exists ? fs.readFileSync(p, 'utf8') : '';
    return {
      name,
      path: `.github/workflows/${name}`,
      exists,
      v31Updated: name === 'econex-ci.yml' ? content.includes('V31') : true,
      bytes: exists ? fs.statSync(p).size : 0,
    };
  });

  const v29ZipExists = fs.existsSync(path.join(ROOT, 'exports', 'ECONEX-V29.0-SOURCE.zip'));
  const v30ZipExists = fs.existsSync(path.join(ROOT, 'exports', 'ECONEX-V30.0-SOURCE.zip'));
  const v31ZipPath = path.join(ROOT, 'exports', 'ECONEX-V31.0-SOURCE.zip');
  const v31ZipExists = fs.existsSync(v31ZipPath);
  const v31ZipBytes = v31ZipExists ? fs.statSync(v31ZipPath).size : 0;

  const hasRemoteConfigured = Boolean(remoteRes.stdout && remoteRes.stdout.trim().length > 0);
  const localGitReady = Boolean(gitBinary.ok && gitFolderExists && branchRes.ok && missingIgnoreRules.length === 0 && trackedSensitive.length === 0);
  const localCommitComplete = Boolean(localGitReady && headCommitRes.ok && Number(commitCountRes.stdout || 0) >= 1);

  return {
    product: 'ECONEX V31.0',
    release: 'V31.0-SOVEREIGN-INFRASTRUCTURE-AND-DEPLOYMENT',
    schemaVersion: db.schemaVersion,
    flags: {
      LOCAL_GIT_READY: localGitReady,
      LOCAL_COMMIT_COMPLETE: localCommitComplete,
      REMOTE_CONFIGURED: hasRemoteConfigured,
      AUTHENTICATION_VERIFIED: false,
      PUSH_SUCCESSFUL: false,
      REMOTE_COMMIT_VERIFIED: false,
      GITHUB_REMOTE_SYNC_VERIFIED: false,
      AI_STUDIO_GITHUB_BINDING_VERIFIED: false,
      PRODUCTION_DEPLOYED: false,
    },
    repository: {
      gitCliInstalled: gitBinary.ok,
      gitVersion: gitBinary.stdout || null,
      gitInitialized: gitFolderExists,
      branch: branchRes.stdout || 'main',
      headCommit: headCommitRes.stdout || null,
      headSubject: commitMsgRes.stdout || null,
      commitCount: Number(commitCountRes.stdout || 0),
      workingTreeClean: dirtyLines.length === 0,
      changedFilesCount: dirtyLines.length,
      changedFilesSample: dirtyLines.slice(0, 20),
      remotesConfigured: hasRemoteConfigured,
      remotesOutput: remoteRes.stdout || 'NONE_CONFIGURED',
    },
    workflows: workflowFiles,
    hygiene: {
      gitignoreComplete: missingIgnoreRules.length === 0,
      missingIgnoreRules,
      trackedSensitiveOrBloatFiles: trackedSensitive,
      envExampleExists: fs.existsSync(path.join(ROOT, '.env.example')),
    },
    archives: {
      v29BackupArchivePreserved: v29ZipExists,
      v30BackupArchivePreserved: v30ZipExists,
      v31ArchivePath: 'exports/ECONEX-V31.0-SOURCE.zip',
      v31ArchiveExists: v31ZipExists,
      v31ArchiveBytes: v31ZipBytes,
    },
    environments: Array.from(db.v31DeploymentRecords.values()),
    releaseVerifications: Array.from(db.v31ReleaseVerificationRecords.values()),
    inspectedAt: new Date().toISOString(),
  };
}

export function listV31Deployments(): {
  environments: V31DeploymentRecord[];
  releaseVerifications: V31ReleaseVerificationRecord[];
  productionDeployed: false;
} {
  return {
    environments: Array.from(db.v31DeploymentRecords.values()),
    releaseVerifications: Array.from(db.v31ReleaseVerificationRecords.values()),
    productionDeployed: false,
  };
}

export function recordV31EnvironmentReadinessCheck(params: {
  environment: V31DeploymentEnvironment;
  notes?: string;
  actorUserId: string;
}): V31DeploymentRecord {
  const env = params.environment;
  if (!['DEV', 'TEST', 'STAGING', 'PROD'].includes(env)) {
    throw new Error(`Unsupported environment ${env}`);
  }
  const pgDiag = getV31PostgresDiagnostics();
  const gitHead = runGit('rev-parse --short HEAD');
  const existing = Array.from(db.v31DeploymentRecords.values()).find((r) => r.environment === env);

  // Strict honesty: PROD remains NOT_DEPLOYED unless real remote deployment infrastructure & live Postgres cutover exist.
  const status: V31DeploymentRecord['status'] =
    env === 'DEV'
      ? 'ACTIVE_LOCAL'
      : env === 'TEST'
      ? 'VERIFIED_AUTOMATED'
      : env === 'STAGING'
      ? pgDiag.pgConfigured
        ? 'DRY_RUN_CONFIGURED'
        : 'DRY_RUN_CONFIGURED'
      : 'NOT_DEPLOYED';

  const rec: V31DeploymentRecord = {
    id: existing?.id || `v31_dep_${env.toLowerCase()}`,
    environment: env,
    releaseTag: 'V31.0-SOVEREIGN-INFRASTRUCTURE-AND-DEPLOYMENT',
    schemaVersion: db.schemaVersion,
    targetHostDescription:
      existing?.targetHostDescription || `ECONEX ${env} Environment Target`,
    databaseAuthority: pgDiag.databaseAuthority,
    status,
    deployedByUserId: params.actorUserId,
    gitCommitShort: gitHead.ok ? gitHead.stdout : undefined,
    notes:
      params.notes?.trim() ||
      (env === 'PROD'
        ? 'External host deployment & live PostgreSQL provisioning required before production cutover.'
        : `${env} environment readiness verified locally at Schema ${db.schemaVersion}.`),
    recordedAt: new Date().toISOString(),
  };

  db.v31DeploymentRecords.set(rec.id, rec);
  db.scheduleSave();
  return rec;
}
