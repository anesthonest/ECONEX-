#!/usr/bin/env node
/**
 * ECONEX V19.0 - Repository Secret & Credential Scanner
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'exports',
  'data',
  '.econex-reports',
  '.tmp',
]);

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.html',
  '.css',
  '.sql',
  '.md',
  '.yml',
  '.yaml',
  '.example',
]);

const SECRET_PATTERNS = [
  { name: 'GOOGLE_API_KEY', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: 'GITHUB_CLASSIC_TOKEN', regex: /\bghp_[0-9A-Za-z]{36}\b/g },
  { name: 'GITHUB_FINE_GRAINED_PAT', regex: /\bgithub_pat_[0-9A-Za-z_]{22,}\b/g },
  { name: 'PRIVATE_KEY_BLOCK', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'STRIPE_LIVE_SECRET', regex: /\bsk_live_[0-9A-Za-z]{20,}\b/g },
  { name: 'AWS_ACCESS_KEY_ID', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'SLACK_TOKEN', regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
];

export function scanDirectoryForSecrets(rootDir = ROOT) {
  const findings = [];
  const forbiddenFilesFound = [];
  let filesScanned = 0;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walk(fullPath);
        continue;
      }

      // Check for forbidden real .env files in source workspace
      if (/^\.env($|\.)/.test(entry.name) && entry.name !== '.env.example') {
        forbiddenFilesFound.push(relPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext) && entry.name !== '.gitignore') continue;

      filesScanned++;
      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      for (const pat of SECRET_PATTERNS) {
        pat.regex.lastIndex = 0;
        const match = pat.regex.exec(content);
        if (match) {
          findings.push({
            file: relPath,
            rule: pat.name,
            preview: `${match[0].slice(0, 8)}***`,
          });
        }
      }
    }
  }

  walk(rootDir);

  return {
    passed: findings.length === 0 && forbiddenFilesFound.length === 0,
    filesScanned,
    findings,
    forbiddenEnvFiles: forbiddenFilesFound,
    scannedAt: new Date().toISOString(),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = scanDirectoryForSecrets(ROOT);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `[ECONEX SECRET SCAN] Scanned ${result.filesScanned} source files | Findings=${result.findings.length} | ForbiddenEnvFiles=${result.forbiddenEnvFiles.length} | Status=${result.passed ? 'PASSED' : 'FAILED'}`
    );
    if (!result.passed) {
      console.error(JSON.stringify(result, null, 2));
    }
  }
  process.exit(result.passed ? 0 : 1);
}
