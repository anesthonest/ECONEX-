# ECONEX — Universal Economic Operating System

**Release:** `V19.0-PLATFORM-STABILITY-AND-DELIVERY`  
**Previous Consolidation:** `V18.0-COMPLETE-PLATFORM-CONSOLIDATION` (Schema Version 17)  
**Primary Jurisdiction:** Republic of Uganda (Regional EAC & AfCFTA corridors)  
**Attribution:** Developed under **VINEXSAH TECHNOLOGIES**. All rights reserved.

---

## 1. Overview & Architecture

ECONEX is a full-stack TypeScript economic operating system built on:
- **Frontend:** React 19, Vite 8, Tailwind CSS v4, TypeScript (`src/`), role-aware 13-group navigation registry (`src/navigation/navigationRegistry.ts`), code-split module loading, 7-language i18n, WCAG 2.2 accessibility controls.
- **Backend:** Express 4 API (`server.ts`, `src/server/api.ts`, `src/server/v11Routes.ts`–`src/server/v19Routes.ts`) running with Vite middleware in development and serving compiled static assets (`dist/`) in production.
- **Persistence:** Authoritative local atomic JSON Write-Ahead Log (`data/aros_database.json`) with Schema Version 17 integrity and PostgreSQL 16 schema blueprints (`src/server/postgres/schema_v13.sql`–`schema_v17.sql`).

> **Regulatory & Production Boundary Notice:** ECONEX in local/sandbox configuration runs in `LOCAL_JSON_WAL_AUTHORITATIVE` mode without live licensed Mobile Money PSPs, live BoU RTGS, URA/NIRA/URSB registries, Cloud HSM, or managed PostgreSQL 16 provisioned. ECONEX does not operate as an unlicensed bank, lender, insurer, or custodian.

---

## 2. Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure local environment variables (never commit .env)
cp .env.example .env

# 3. Start full-stack server on port 3000
npm run dev
```

Verify health:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/health
```

---

## 3. Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Express + Vite dev server on port `3000` |
| `npm run build` | Builds frontend production bundle to `dist/` |
| `npm run build:check` | Runs memory-bounded Vite build (`640 MB` heap cap) |
| `npm run typecheck` / `npm run lint` | Runs TypeScript check (`tsc --noEmit`) |
| `npm run test` | Runs V19 platform stability & export suite |
| `npm run test:integration` | Runs sequential V18 + V19 integration suites |
| `npm run test:historical` | Runs full V11–V19 verification sequentially in memory-safe batches |
| `npm run export:zip` | Builds secret-free `exports/ECONEX-V19.0-SOURCE.zip`, verifies via `unzip -t`, extracts & validates |
| `npm run export:check` | Validates an existing ZIP archive without regenerating |
| `npm run security:scan` | Scans source repository & export list for leaked secrets/keys |

---

## 4. Export, GitHub & Deployment Docs

- See [`RECOVERY.md`](./RECOVERY.md) for workspace recovery, Google AI Studio hang mitigation, and memory-safe test steps.
- See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for Node.js + PostgreSQL 16 + HTTPS staging/production architecture and GitHub publication workflow.
