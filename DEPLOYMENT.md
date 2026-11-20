# ECONEX V19.0 — Environment Separation & Deployment Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Environment Matrix

| Environment | `ECONEX_ENV` | `NODE_ENV` | Database Authority | Purpose |
|---|---|---|---|---|
| Local Dev | `DEVELOPMENT` | `development` | Local JSON WAL (`data/aros_database.json`) | Feature work & UI preview |
| Automated Tests | `AUTOMATED_TESTING` | `development` | Local JSON WAL | Sequential suite verification |
| Staging | `STAGING` | `production` | Managed PostgreSQL 16 | Pre-production cutover validation |
| Production | `PRODUCTION` | `production` | Managed PostgreSQL 16 + WAL archive | Live regulated operations (Blocked until external gates clear) |

---

## 2. Hosting Architecture

ECONEX is a **full-stack Node.js + Express + Vite SPA application**. Do **not** deploy it to static-only hosting (such as raw GitHub Pages) without a Node.js backend, PostgreSQL 16 database, and secure server-side environment secrets.

Recommended compatible stack:
- **Compute:** Cloud Run / Fly.io / Railway / Render / dedicated Node.js 22 LTS container (`npm run build && npm run start`).
- **Database:** Managed PostgreSQL 16 with schemas applied sequentially from `src/server/postgres/schema_v13.sql` through `src/server/postgres/schema_v17.sql`.
- **Edge & TLS:** Reverse proxy terminating HTTPS on 443 and forwarding to `PORT=3000` (or injected `PORT`), forwarding `/health` and `/api/health` readiness probes.

---

## 3. Build, Start & Health Contracts

- **Install Command:** `npm ci` (or `npm install`)
- **Build Command:** `npm run build` (emits static frontend assets into `dist/`)
- **Start Command:** `npm run start` (`tsx server.ts`) with `NODE_ENV=production`
- **Readiness Probes:** `GET /health` and `GET /api/health` returning HTTP `200`

---

## 4. Production Readiness Checklist (Pre-Cutover)

1. `npm run typecheck` and `npm run build` pass with 0 errors.
2. `npm run security:scan` returns 0 leaked secrets.
3. PostgreSQL 16 instance provisioned, SSL enforced, and `schema_v13.sql`–`schema_v17.sql` applied.
4. `GEMINI_API_KEY`, PSP API credentials, and WORM audit archive endpoints configured in secret manager (never `.env` in Git).
5. Verified backup & restore drill executed against staging PostgreSQL before promoting traffic.
