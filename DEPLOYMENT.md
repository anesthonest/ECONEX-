# ECONEX V23.0 — Environment Separation & Deployment Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Environment Matrix

| Environment | `ECONEX_ENV` | `NODE_ENV` | Database Authority | Purpose |
|---|---|---|---|---|
| Local Dev | `DEVELOPMENT` | `development` | Local JSON WAL (`data/aros_database.json`, Schema 21) | Feature work & sandbox wallet preview |
| Automated Tests | `AUTOMATED_TESTING` | `development` | Local JSON WAL (Schema 21) | Sequential suite verification (2,950 assertions) |
| Staging | `STAGING` | `production` | Managed PostgreSQL 16 (when `DATABASE_URL` configured) | Pre-production & Schema 21 parity validation |
| Production | `PRODUCTION` | `production` | Managed PostgreSQL 16 + WORM archive | Regulated live ops (**Blocked until external gates clear**) |

---

## 2. Hosting Architecture

ECONEX is a **full-stack Node.js + Express + Vite SPA application**. Static hosting alone cannot run `/api/v23/*`, PIN verification, HMAC QR signing, or PostgreSQL persistence.

Recommended stack:
- **Compute:** Cloud Run / Fly.io / Railway / Render / dedicated Node.js 22 LTS container (`npm run build && npm run start`).
- **Database:** Managed PostgreSQL 16 with schemas applied sequentially from `src/server/postgres/schema_v13.sql` through `src/server/postgres/schema_v21.sql`.
- **Edge & TLS:** Reverse proxy terminating HTTPS on 443 forwarding to `PORT=3000`.

---

## 3. Health, Readiness & Observability Contracts

- **Build Command:** `npm run build`
- **Start Command:** `npm run start` (`tsx server.ts`) with `NODE_ENV=production`
- **Liveness Probe:** `GET /health`, `GET /api/v22/health`, & `GET /api/v23/health` (returns HTTP `200`, `503` during graceful shutdown)
- **Readiness Probe:** `GET /ready` & `GET /api/v23/readiness-matrix` (verifies Schema 21 integrity, balanced double-entry journal, and truthful non-live status flags)
- **Request Tracing:** Every request emits `X-Correlation-Id` (`src/server/v21Config.ts`).
- **Graceful Shutdown:** Handles `SIGTERM` / `SIGINT`, drains keep-alive connections, and flushes WAL writes (`db.saveToDisk()`).

---

## 4. Production Cutover Checklist

1. `npm run typecheck`, `npm run build`, `npm run verify`, and `npm run security:scan` exit `0`.
2. Provision PostgreSQL 16 with SSL (`PG_SSL_MODE=require`) and apply `schema_v13.sql`–`schema_v21.sql`.
3. Execute `POST /api/v23/postgres-audit` (and `POST /api/v22/postgres/dry-run`) and verify zero uniqueness/checksum errors and zero ledger variance.
4. Configure runtime secrets (`GEMINI_API_KEY`, `ECONEX_WEBHOOK_SECRET`, QR/card HSM keys, licensed partner keys) in a secret manager — never commit `.env`.
5. Keep `V23_REAL_VALUE_TRANSACTIONS_ENABLED`, `V23_PHYSICAL_CARDS_ISSUED`, `V23_CARD_SCHEME_CERTIFIED`, `V23_ATM_NETWORK_LIVE`, `V23_LIVE_MERCHANT_ACCEPTANCE`, `V23_EXTERNAL_INTEGRATIONS_LIVE`, `V23_POSTGRESQL_CUTOVER_COMPLETE`, `V23_PILOT_ACTIVE`, and `V23_PRODUCTION_DEPLOYED` strictly `false` until external regulatory, safeguarding, scheme, and infrastructure approvals are completed.
