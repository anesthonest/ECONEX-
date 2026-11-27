# ECONEX V28.0 — GitHub Repository & CI Workflow Guide

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

## 1. Branch & PR Hygiene
- Work on feature or release branches; target `main` via pull request using `.github/PULL_REQUEST_TEMPLATE.md`.
- Bug reports follow `.github/ISSUE_TEMPLATE/bug_report.md`.
- Contributions comply with `CONTRIBUTING.md`.

## 2. Automated Workflows
- `.github/workflows/ci.yml`: Validates lockfile installation (`npm ci` / `bun install` / `npm install`), runs `npm run typecheck`, `npm run build`, and `npm run security:scan`.
- `.github/workflows/security.yml`: Runs repository-wide secret detection (`scripts/econex-secret-scan.mjs`) and checks `.gitignore` enforcement.

## 3. Never Commit Runtime State
Ensure none of the following are staged:
- `.env` or credential files (only `.env.example`)
- `data/aros_database.json`, `data/*.backup.json`, `data/backups/`, `data/v25_vault/`, `data/v28_vault/`
- `dist/`, `node_modules/`, `.econex-reports/`, `exports/`, `*.zip`
