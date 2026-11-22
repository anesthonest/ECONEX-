# ECONEX — Universal Economic Operating System

**Release:** `V23.0-UNIVERSAL-WALLET-NETWORK`  
**Previous Consolidation:** `V22.0-UNIVERSAL-ECONOMIC-GROWTH` (Schema Version 20 → **Schema Version 21**)  
**Primary Operating Jurisdiction:** Republic of Uganda (Regional EAC → AfCFTA corridors → Global extensibility)  
**Attribution:** Developed under **VINEXSAH TECHNOLOGIES**. All rights reserved.

---

## 1. Overview & Architecture

ECONEX is a full-stack TypeScript **sector-neutral Universal Economic Operating System** spanning **28+ economic sectors** and a **Universal Economic Identity, Multi-Country Wallet Network & Card Infrastructure (V23)**:
- **Frontend:** React 19, Vite 8, Tailwind CSS v4, TypeScript (`src/`), role-aware navigation (`src/navigation/navigationRegistry.ts`), V23 Universal Wallet (`/wallet`), Merchant QR Acceptance (`/wallet/merchant`), Virtual & Physical Cards (`/wallet/cards`), Cross-Country Network & Regulatory Gates (`/wallet/network`), and Wallet Operations & Readiness Control (`/wallet/operations-control`), alongside preserved V1–V22 workspaces (`/v22`, `/discover/economy`, `/marketplace/universal`, `/businesses`, `/procurement`, `/finance/universal-intelligence`, `/field-ops`, `/onboarding`, `/command-centre`, `/operations-hub`). Supports 7 languages (`en`, `lg`, `sw`, `nyn`, `ach`, `teo`, `xog`).
- **Backend:** Express 4 API (`server.ts`, `src/server/api.ts`, `src/server/v11Routes.ts`–`src/server/v23Routes.ts`) with V23 OpenAPI 3.1 (`GET /api/v23/openapi.json`), HMAC-signed QR payloads, scrypt PIN verification, correlation IDs, graceful shutdown, and probes (`/health`, `/ready`, `/api/health`, `/api/v23/health`, `/api/v23/readiness-matrix`).
- **Persistence:** Authoritative local atomic JSON Write-Ahead Log (`data/aros_database.json`) at **Schema Version 21** (`data/aros_database.v22.backup.json` reversible checkpoint), paired with PostgreSQL 16 schema blueprints (`src/server/postgres/schema_v13.sql`–`schema_v21.sql`) and non-destructive dry-run tooling.

> **Truthful Regulatory & Non-Live Capability Boundary Notice:** All V23 wallets, EUWNs, multi-currency balances (9 currencies in integer minor units), merchant QR receipts, virtual cards, and 13-stage physical card workflows run strictly in **sandbox simulation mode** (`LOCAL_JSON_WAL_AUTHORITATIVE`). Real-value transactions, cash withdrawals, physical card issuance, card scheme certification (Visa/Mastercard/ATM), live Bank of Uganda PSP/PSO/EMI licences, live external KYC/sanctions/settlement APIs, managed PostgreSQL cutover, and live production deployment remain **`false` / external gates pending**.

---

## 2. Quick Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Verify health, Schema 21 readiness & V23 API:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/api/v23/health
```

---

## 3. Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Express + Vite dev server on port `3000` |
| `npm run build` | Builds frontend production bundle to `dist/` |
| `npm run build:check` | Runs memory-bounded Vite build (`640 MB` heap cap) |
| `npm run typecheck` / `npm run lint` | Runs TypeScript check (`tsc --noEmit`) |
| `npm run test` / `npm run test:v23` | Runs V23 Wallet Network suite (550 live assertions: `T2401–T2950`, incl. 50 E2E scenarios) |
| `npm run test:v22` | Runs V22 Universal Economic Growth suite (400 assertions: `T2001–T2400`) |
| `npm run test:integration` | Runs sequential V18–V23 integration suites (1,575 assertions) |
| `npm run verify` | Runs V18–V23 release verification gate (1,575 assertions) |
| `npm run test:historical` | Runs full V11–V23 verification sequentially in memory-safe batches (2,650 CLI assertions; 2,950 total incl. T01–T300) |
| `npm run export:zip` | Builds secret-free `exports/ECONEX-V19.0-SOURCE.zip`, verifies via `unzip -t`, extracts & validates |
| `npm run export:check` | Validates an existing ZIP archive without regenerating |
| `npm run security:scan` | Scans source repository & export list for leaked secrets/keys |

---

## 4. Documentation Map

- [`WALLET_ARCHITECTURE_V23.md`](./WALLET_ARCHITECTURE_V23.md) — Permanent EUWN design, integer minor-unit ledger, Merchant QR, Card boundaries & Ugandan NPS Act 2020 regulatory gates.
- [`RELEASE_NOTES_V23.md`](./RELEASE_NOTES_V23.md) — V23 release deliverables and truthful 12-flag readiness matrix.
- [`ROADMAP_V23.md`](./ROADMAP_V23.md) — Legal/licensing, safeguarding, scheme certification, and PostgreSQL cutover roadmap.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Environment separation, health/readiness probes, and Node.js + PostgreSQL hosting checklist.
- [`RECOVERY.md`](./RECOVERY.md) — Workspace recovery, Schema 21 rollback protection, memory-safe testing, and ZIP backup workflows.
- [`POSTGRES_MIGRATION.md`](./POSTGRES_MIGRATION.md) — Schema 21 PostgreSQL DDL layout (`22` V23 tables), dry-run audit, and rollback steps.
- [`API_INTEGRATION_GUIDE.md`](./API_INTEGRATION_GUIDE.md) — Versioned `/api/v20/*`–`/api/v23/*` contracts (including OpenAPI 3.1).
