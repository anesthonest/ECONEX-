/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 - Repository Health, GitHub Sync Diagnostics & Workspace Hygiene Engine
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { db } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

function safeExec(cmd: string): { ok: boolean; stdout: string; stderr: string } {
  try {
    const out = execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], timeout: 4000 })
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

function getDirStats(dirPath: string, maxDepth = 4, depth = 0): { files: number; bytes: number } {
  if (!fs.existsSync(dirPath) || depth > maxDepth) return { files: 0, bytes: 0 };
  let files = 0;
  let bytes = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === 'dist') continue;
      const full = path.join(dirPath, ent.name);
      if (ent.isDirectory()) {
        const sub = getDirStats(full, maxDepth, depth + 1);
        files += sub.files;
        bytes += sub.bytes;
      } else if (ent.isFile()) {
        files += 1;
        try {
          bytes += fs.statSync(full).size;
        } catch {
          // ignore unreadable stat
        }
      }
    }
  } catch {
    // ignore permission error
  }
  return { files, bytes };
}

export function getV28RepositoryHealth() {
  const gitBinary = safeExec('git --version');
  const gitFolderExists = fs.existsSync(path.join(ROOT, '.git'));
  const gitStatus = gitFolderExists ? safeExec('git status --short') : { ok: false, stdout: '', stderr: 'No .git metadata folder inside AI Studio container' };
  const gitBranch = gitFolderExists ? safeExec('git rev-parse --abbrev-ref HEAD') : { ok: false, stdout: 'NONE_IN_CONTAINER', stderr: 'Detached from remote git CLI' };
  const gitRemotes = gitFolderExists ? safeExec('git remote -v') : { ok: false, stdout: '', stderr: 'Remotes managed externally by AI Studio platform binding' };

  const gitignorePath = path.join(ROOT, '.gitignore');
  const gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const requiredIgnores = ['node_modules/', 'dist/', '.env*', 'data/aros_database.json', 'data/*.backup.json', 'data/backups/', 'data/v25_vault/', 'exports/', '*.zip'];
  const missingIgnoreRules = requiredIgnores.filter((r) => !gitignoreContent.includes(r));

  const srcStats = getDirStats(path.join(ROOT, 'src'), 6);
  const docsStats = getDirStats(path.join(ROOT, 'docs'), 6);
  const dataStats = getDirStats(path.join(ROOT, 'data'), 4);
  const exportsStats = getDirStats(path.join(ROOT, 'exports'), 3);

  const workflowsDir = path.join(ROOT, '.github', 'workflows');
  const workflowsPresent = fs.existsSync(workflowsDir)
    ? fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    : [];

  const requiredEngineeringDocs = [
    '.github/workflows/ci.yml',
    '.github/workflows/security.yml',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/ISSUE_TEMPLATE/bug_report.md',
    'CONTRIBUTING.md',
    'docs/engineering/GITHUB_SYNC_AND_AI_STUDIO_RCA.md',
    'docs/engineering/GITHUB_WORKFLOW_GUIDE.md',
    'docs/engineering/SAFE_SYNC_CHECKLIST.md',
  ];

  const missingArtifacts = requiredEngineeringDocs.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));

  const rootExports = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.zip'));

  const v28ZipPath = path.join(ROOT, 'exports', 'ECONEX-V28.0-SOURCE.zip');
  const v28ZipExists = fs.existsSync(v28ZipPath);
  const v28ZipBytes = v28ZipExists ? fs.statSync(v28ZipPath).size : 0;

  // Inspect package.json for lockfile mismatch
  const hasPackageLock = fs.existsSync(path.join(ROOT, 'package-lock.json'));
  const hasBunLock = fs.existsSync(path.join(ROOT, 'bun.lock'));

  const rootCauses = [
    {
      code: 'RCA_CLASS_4_NO_GIT_DIR',
      classification: 'Class 4 — Google AI Studio Platform Sync Boundary',
      severity: 'HIGH',
      summary: 'No .git repository directory exists inside the AI Studio execution container (/app/applet).',
      evidence: gitFolderExists ? 'Unexpected .git found' : 'fs.existsSync(".git") === false',
      resolutionStatus: 'PLATFORM_MANAGED_USE_VERIFIED_ZIP_OR_EXTERNAL_REMOTE',
    },
    {
      code: 'RCA_CLASS_1_GENERATED_FILES_BLOAT',
      classification: 'Class 1 — Runtime Artifacts & Generated Snapshot Footprint',
      severity: 'MEDIUM',
      summary: `Runtime data/ (${(dataStats.bytes / (1024 * 1024)).toFixed(1)} MB across ${dataStats.files} files including v25_vault/ and backup snapshots) exceeds source tree size (${(srcStats.bytes / (1024 * 1024)).toFixed(1)} MB).`,
      evidence: `data/v25_vault/ added 1,600+ files; ignored in .gitignore and excluded by econex-export.mjs`,
      resolutionStatus: missingIgnoreRules.length === 0 ? 'MITIGATED_VIA_GITIGNORE_AND_EXPORTER' : 'NEEDS_GITIGNORE_RULES',
    },
    {
      code: 'RCA_CLASS_2_LOCKFILE_WORKFLOW_DRIFT',
      classification: 'Class 2 — Repository Hygiene & Stale CI Workflow',
      severity: 'MEDIUM',
      summary: 'Workspace uses bun.lock without package-lock.json; legacy V25 workflow invoked npm ci which fails without package-lock.json.',
      evidence: `hasPackageLock=${hasPackageLock}, hasBunLock=${hasBunLock}`,
      resolutionStatus: workflowsPresent.includes('ci.yml') ? 'REPAIRED_IN_CI_YML' : 'PENDING_CI_YML',
    },
    {
      code: 'RCA_CLASS_3_GITHUB_AUTH_OUTSIDE_CONTAINER',
      classification: 'Class 3 — External OAuth / GitHub App Token Scope',
      severity: 'INFO',
      summary: 'GitHub OAuth tokens and AI Studio Save-to-GitHub bindings reside outside container sandbox; cannot be asserted verified from local code.',
      evidence: 'GITHUB_REMOTE_SYNC_VERIFIED=false, AI_STUDIO_GITHUB_BINDING_VERIFIED=false',
      resolutionStatus: 'TRUTHFUL_RECOVERY_PATH_DOCUMENTED',
    },
  ];

  return {
    product: 'ECONEX V28.0',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    schemaVersion: db.schemaVersion,
    gitCliInstalled: gitBinary.ok,
    gitCliVersion: gitBinary.stdout || null,
    gitRepoInitializedLocally: gitFolderExists,
    gitBranch: gitBranch.stdout,
    gitStatusSummary: gitStatus.stdout || gitStatus.stderr,
    gitRemotesConfigured: Boolean(gitRemotes.stdout),
    githubRemoteSyncVerified: false,
    aiStudioGithubBindingVerified: false,
    packageManagers: {
      hasPackageLock,
      hasBunLock,
      recommendedCiInstaller: hasPackageLock ? 'npm ci' : 'bun install --frozen-lockfile || npm install',
    },
    workspaceMetrics: {
      sourceFiles: srcStats.files,
      sourceSizeMb: Number((srcStats.bytes / (1024 * 1024)).toFixed(2)),
      docsFiles: docsStats.files,
      runtimeDataFiles: dataStats.files,
      runtimeDataSizeMb: Number((dataStats.bytes / (1024 * 1024)).toFixed(2)),
      exportFiles: exportsStats.files,
      exportSizeMb: Number((exportsStats.bytes / (1024 * 1024)).toFixed(2)),
      rootZipFilesCount: rootExports.length,
    },
    v28SourceArchive: {
      path: 'exports/ECONEX-V28.0-SOURCE.zip',
      exists: v28ZipExists,
      bytes: v28ZipBytes,
    },
    workflowsPresent,
    missingIgnoreRules,
    missingEngineeringDocs: missingArtifacts,
    rootCauses,
    recommendedRecoveryRunbook: 'docs/engineering/GITHUB_SYNC_AND_AI_STUDIO_RCA.md',
    inspectedAt: new Date().toISOString(),
  };
}
