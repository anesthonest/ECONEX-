# ECONEX V27.0 — Environment Separation, Cloud & Deployment Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Environment Matrix

| Environment | `ECONEX_ENV` | `NODE_ENV` | Database Authority | Purpose |
|---|---|---|---|---|
| Local Dev | `DEVELOPMENT` | `development` | Local JSON WAL (`data/aros_database.json`, Schema 25) | Interactive economic network, trust & market activation sandbox |
| Automated Tests | `AUTOMATED_TESTING` | `development` | Local JSON WAL (Schema 25) | Sequential suite verification (`6,000` assertions) |
| Staging | `STAGING` | `production` | Managed PostgreSQL 16 (when `DATABASE_URL` / `PGHOST` configured) | Pre-production & Schema 25 parity validation |
| Production | `PRODUCTION` | `production` | Managed PostgreSQL 16 + WORM archive + Cloud Vault | Regulated live ops (**Blocked until external gates clear**) |

---

## 2. Container & CI/CD Manifests

ECONEX V27.0 retains cloud-ready build and verification manifests (`Dockerfile` + `.github/workflows/econex-ci.yml`):
- **`Dockerfile`:** Multi-stage `node:22-alpine` build (`npm ci`, `npm run typecheck && npm run build`) and production runtime exposing port `3000` with `/health` check and `/app/data/v25_vault`.
- **`.github/workflows/econex-ci.yml`:** CI/CD workflow running `npm run typecheck`, `npm run security:scan`, `npm run build`, live verification smoke + test suites, and `npm run export:zip && npm run export:check`.

---

## 3. Health, Readiness & Observability Contracts

- **Build Command:** `npm run build`
- **Start Command:** `npm run start` (`tsx server.ts`) with `NODE_ENV=production`
- **Liveness Probes:** `GET /health`, `GET /api/v25/health`, `GET /api/v26/health`, `GET /api/v27/health`
- **Readiness Probes:** `GET /ready`, `GET /api/v26/readiness-matrix`, `GET /api/v27/readiness-matrix` (Schema 25 integrity, balanced double-entry journal, V26 rollback checkpoint, and all `31` truthful V27 readiness flags)
- **Request Tracing:** Every request emits `X-Correlation-Id`.

---

## 4. Production Cutover Checklist

1. `npm run typecheck`, `npm run build`, `npm run verify`, and `npm run security:scan` exit `0`.
2. Provision PostgreSQL 16 with SSL (`PG_SSL_MODE=require`), apply `schema_v13.sql` through `schema_v25.sql`, set `DATABASE_URL`/`PGHOST`, and execute PostgreSQL dry-run + live migration validation.
3. Verify `GET /api/v27/migration/backup-verify` confirms `data/aros_database.v26.backup.json` integrity.
4. Keep all 5 non-live V27 readiness flags (`V27_PILOT_ACTIVE`, `V27_FIELD_VALIDATION_COMPLETE`, `V27_EXTERNAL_INTEGRATIONS_LIVE`, `V27_POSTGRESQL_CUTOVER_COMPLETE`, `V27_PRODUCTION_DEPLOYED`) strictly `false` until physical field validation, external partner approvals, and production cutover complete.
