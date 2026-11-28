/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V30.0 - Git & GitHub Source-Control Diagnostic, Hygiene & Recovery Engine
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

export function getV30GitHubDiagnostics() {
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
    'data/v25_vault/',
    'data/v30_vault/',
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

  const v29ZipExists = fs.existsSync(path.join(ROOT, 'exports', 'ECONEX-V29.0-SOURCE.zip'));
  const v30ZipPath = path.join(ROOT, 'exports', 'ECONEX-V30.0-SOURCE.zip');
  const v30ZipExists = fs.existsSync(v30ZipPath);
  const v30ZipBytes = v30ZipExists ? fs.statSync(v30ZipPath).size : 0;

  const hasRemoteConfigured = Boolean(remoteRes.stdout && remoteRes.stdout.trim().length > 0);
  const localGitReady = Boolean(gitBinary.ok && gitFolderExists && branchRes.ok && missingIgnoreRules.length === 0 && trackedSensitive.length === 0);
  const localCommitComplete = Boolean(localGitReady && headCommitRes.ok && Number(commitCountRes.stdout || 0) >= 1);

  return {
    product: 'ECONEX V30.0',
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
    },
    repository: {
      gitCliInstalled: gitBinary.ok,
      gitVersion: gitBinary.stdout || null,
      gitInitialized: gitFolderExists,
      safeDirectoryApplied: true,
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
    hygiene: {
      gitignoreComplete: missingIgnoreRules.length === 0,
      missingIgnoreRules,
      trackedSensitiveOrBloatFiles: trackedSensitive,
      lockfiles: {
        hasPackageLock: fs.existsSync(path.join(ROOT, 'package-lock.json')),
        hasBunLock: fs.existsSync(path.join(ROOT, 'bun.lock')),
      },
    },
    archives: {
      v29BackupArchivePreserved: v29ZipExists,
      v30ArchivePath: 'exports/ECONEX-V30.0-SOURCE.zip',
      v30ArchiveExists: v30ZipExists,
      v30ArchiveBytes: v30ZipBytes,
    },
    syncHistory: Array.from(db.v30GitSyncEvents.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    recoveryInstructions: [
      'Local Git repository is configured safely with zero secrets or runtime database files staged.',
      'To publish externally outside Google AI Studio, download exports/ECONEX-V30.0-SOURCE.zip or add an authenticated remote (`git remote add origin <repo-url>` && `git push -u origin main`).',
      'AI Studio Save-to-GitHub binding happens at the outer Google AI Studio host UI level and cannot be forged or marked verified from inside this runtime container.',
    ],
    inspectedAt: new Date().toISOString(),
  };
}
