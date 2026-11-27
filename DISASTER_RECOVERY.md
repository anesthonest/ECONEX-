# ECONEX V27.0 — Disaster Recovery & Business Continuity Plan

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Recovery Objectives (Target vs Verified Sandbox)

| Tier | Target RPO | Target RTO | Sandbox Verification Method |
|---|---|---|---|
| Tier-0 Core Ledger & WAL | `<= 60s` (atomic disk flush) | `<= 15 min` | `POST /api/v25/resilience/backup-drill` + `GET /api/v27/migration/backup-verify` |
| Tier-1 PostgreSQL Cutover Checkpoint | `0` uncommitted transactions | `<= 30 min` | 20-Stage Migrator interrupt/resume (`simulateInterruptAtStage: 10` → `resumeRunId`) |
| Tier-2 Private Document Vault & Exports | Daily snapshot + hash manifest | `<= 60 min` | SHA-256 verification of `data/v25_vault/*` & `v26_report_exports` |

---

## 2. Canonical Backup & Schema 24→25 Rollback Procedure

- On first boot of V27.0, `db.ts` preserves `data/aros_database.v26.backup.json` prior to Schema 25 migration (alongside historical `data/aros_database.v25.backup.json` & `v24.backup.json`).
- Verify rollback health anytime via `GET /api/v27/migration/status` and `GET /api/v27/migration/backup-verify`.
- **Emergency Rollback Steps:**
  1. Stop Node.js server cleanly (`SIGTERM`) so in-flight WAL writes flush.
  2. Copy `data/aros_database.v26.backup.json` to `data/aros_database.json` in a maintenance window.
  3. Boot V26 release artifact and verify `/ready` and `GET /api/v26/health`.

---

## 3. Running Live Disaster Recovery & Verification Drills

1. Navigate to `/v25-command-centre` and run **Backup DR Drill** (`POST /api/v25/resilience/backup-drill`).
2. Confirm `schema25IntegrityValid: true` and `v26RollbackReady: true` via `GET /api/v27/health`.
3. Export a clean secret-free source recovery archive regularly via `npm run export:zip && npm run export:check`.
