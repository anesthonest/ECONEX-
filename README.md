# ECONEX — Universal Economic Operating System

**Release:** `V28.0-UNIVERSAL-ECONOMIC-EXECUTION`  
**Previous Consolidation:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK` (Schema Version 25 → **Schema Version 26**)  
**Primary Operating Jurisdiction:** Republic of Uganda (Regional 7-State EAC → AfCFTA corridors → Global extensibility)  
**Attribution:** Developed under **VINEXSAH TECHNOLOGIES**. All rights reserved.

---

## 1. Overview & Architecture

ECONEX is a full-stack TypeScript **sector-neutral Universal Economic Operating System** spanning **30 economic sectors**, **Universal Wallet Network & Card Infrastructure (V23)**, **Universal Commerce & Supply Chain Execution (V24)**, **Continental Infrastructure & Sovereign Platform Engineering (V25)**, **Universal Platform Activation (V26)**, **Universal Economic Network & Trust Infrastructure (V27)**, and **Universal Economic Execution, Interoperability & Continental Operations (V28)**:

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, TypeScript (`src/`), role-aware navigation (`src/navigation/navigationRegistry.ts` with **133** verified routes incl. 15 V27 and 20 V28 routes), unified `ExperienceContext`, and 6 lazy-loaded V28 execution hubs (`src/components/v28/*`):
  - `/v28/execution` & `/v28/workspace` (**`V28ExecutionWorkspaceView`**): 14-stage unified execution workflow state machine (`DISCOVER` -> `EVALUATE`) and 18-section universal individual/SME/cooperative/institutional workspace.
  - `/v28/contracts`, `/v28/obligations`, `/v28/procurement`, `/v28/procurement/approvals` (**`V28ContractsProcurementView`**): Versioned contracts with non-eIDAS sandbox acknowledgment, contractual obligations, annual procurement plans, COI declarations, SoD requisitions, competitive scoring & 3-way match checks.
  - `/v28/fulfilment`, `/v28/inventory`, `/v28/cross-border`, `/v28/wallet-coordination` (**`V28FulfilmentCrossBorderView`**): Non-negative ATP stock reservations, fulfilment POD evidence & returns, 7-country EAC/AfCFTA profiles, and integer minor-unit sandbox wallet transfers & compensating reversals.
  - `/v28/interoperability`, `/v28/events`, `/v28/vault` (**`V28InteroperabilityEventsView`**): 12-category interoperability connectors gated by dual-approval `ACTIVE` review, HMAC-SHA256 webhook verification, outbox DLQ replay, and SHA-256 Evidence Vault with legal holds.
  - `/v28/intelligence`, `/v28/ai`, `/v28/control-centre`, `/v28/dual-approvals` (**`V28ContinentalIntelligenceOpsView`**): 6-provenance-category Continental Intelligence with `k >= 3` anonymity suppression, prompt-injection/autonomy-blocked AI orchestrator (`gemini-4-hydrogen`), two-person SoD dual-approval desk & Ops Control Centre.
  - `/v28/field-offline`, `/v28/security`, `/v28/repository-health` (**`V28FieldRepoEngineeringView`**): Optimistic version-checked offline field capture with explicit `CONFLICT` non-self supervisor resolution, security & 9-flag truthfulness governance, and honest local GitHub/CI diagnostics.
- **Backend:** Express 4 API (`server.ts`, `src/server/api.ts`, `src/server/v11Routes.ts`–`src/server/v28Routes.ts`) with V28 OpenAPI 3.1 (`GET /api/v28/openapi.json`), Schema 26 engine (`src/server/v28Engine.ts`), GitHub/repo health diagnostics (`src/server/v28GitHubEngine.ts`), seed fixtures (`src/server/v28Seed.ts`), PostgreSQL 16 engine (`src/server/v25PostgresEngine.ts`), and probes (`/health`, `/ready`, `/api/health`, `/api/v27/health`, `/api/v28/health`, `/api/v28/readiness-matrix`).
- **Persistence:** Authoritative local atomic JSON Write-Ahead Log (`data/aros_database.json`) at **Schema Version 26** (`data/aros_database.v27.backup.json` reversible checkpoint), paired with PostgreSQL 16 schema blueprints (`src/server/postgres/schema_v13.sql`–`schema_v26.sql` & `database/schema_v26.sql`).

> **Truthful Regulatory & Non-Live Capability Boundary Notice:** In the local workspace sandbox, PostgreSQL (`DATABASE_URL`/`PGHOST`) is unconfigured and persistence runs fail-closed under `LOCAL_JSON_WAL_AUTHORITATIVE`. All **9 mandatory pre-production honesty flags** remain strictly **`false`**: `POSTGRESQL_CUTOVER_COMPLETE`, `EXTERNAL_INTEGRATIONS_LIVE`, `REAL_VALUE_WALLET_OPERATIONS_ENABLED`, `CARD_SCHEME_CERTIFICATION_COMPLETE`, `HUMAN_FIELD_VALIDATION_COMPLETE`, `PILOT_ACTIVE`, `PRODUCTION_DEPLOYED`, `GITHUB_REMOTE_SYNC_VERIFIED`, and `AI_STUDIO_GITHUB_BINDING_VERIFIED`.

---

## 2. Quick Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Verify health, Schema 26 readiness & V28 Universal Economic Execution API:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/api/v28/health
curl http://localhost:3000/api/v28/readiness-matrix
```

---

## 3. Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Express + Vite dev server on port `3000` |
| `npm run build` | Builds frontend production bundle to `dist/` |
| `npm run build:check` | Runs memory-bounded Vite build (`640 MB` heap cap) |
| `npm run typecheck` / `npm run lint` | Runs TypeScript check (`tsc --noEmit`) |
| `npm run test` / `npm run test:v28` | Runs V28 Execution & Interoperability suite (`900` live assertions: `T6901–T7800`, incl. `120` E2E journeys) |
| `npm run test:v27` | Runs V27 Economic Network suite (`850` live assertions: `T5151–T6000`, incl. `100` E2E journeys) |
| `npm run test:v26` | Runs V26 Platform Activation suite (`800` live assertions: `T4351–T5150`, incl. `100` E2E journeys) |
| `npm run test:v25` | Runs V25 Continental Infrastructure suite (`750` live assertions: `T3601–T4350`, incl. `75` E2E scenarios) |
| `npm run test:v24` | Runs V24 Commerce & Supply Chain Execution suite (`650` live assertions: `T2951–T3600`, incl. `60` E2E journeys) |
| `npm run test:v23` | Runs V23 Wallet Network suite (`550` live assertions: `T2401–T2950`, incl. `50` E2E scenarios) |
| `npm run test:v22` | Runs V22 Universal Economic Growth suite (`400` assertions: `T2001–T2400`) |
| `npm run test:integration` | Runs sequential V18–V28 integration suites |
| `npm run verify` | Runs V18–V28 release verification gate (`BATCH_R_V28` inclusive) |
| `npm run test:historical` | Runs full V11–V28 verification sequentially (`6,600` CLI assertions; `6,900` total incl. UI `T01–T300`) |
| `npm run export:zip` | Builds secret-free source ZIP archive (`exports/ECONEX-V28.0-SOURCE.zip`), verifies via `unzip -t`, extracts & validates |
| `npm run export:check` | Validates existing ZIP archive without regenerating |
| `npm run security:scan` | Scans source repository & export list for leaked secrets/keys |

---

## 4. Documentation Map

- **V28 Execution, Interoperability & Engineering Docs:**
  - [`docs/releases/V28_BASELINE_AUDIT.md`](./docs/releases/V28_BASELINE_AUDIT.md) & [`docs/releases/V28_DATA_PRESERVATION_AND_RECOVERY.md`](./docs/releases/V28_DATA_PRESERVATION_AND_RECOVERY.md) — Baseline inventory, SHA-256 backup checkpoint, and non-destructive upgrade audit.
  - [`docs/releases/V28_SYSTEM_ARCHITECTURE_BLUEPRINT.md`](./docs/releases/V28_SYSTEM_ARCHITECTURE_BLUEPRINT.md), [`V28_IMPLEMENTATION_PLAN.md`](./docs/releases/V28_IMPLEMENTATION_PLAN.md), [`V28_API_SPECIFICATION.md`](./docs/releases/V28_API_SPECIFICATION.md), [`V28_READINESS_MATRIX.md`](./docs/releases/V28_READINESS_MATRIX.md), [`V28_COMPLETION_AUDIT.md`](./docs/releases/V28_COMPLETION_AUDIT.md) — V28 Schema 26 architecture, `/api/v28/*` spec, and 27-flag truthfulness audit.
  - [`docs/engineering/GITHUB_SYNC_AND_AI_STUDIO_RCA.md`](./docs/engineering/GITHUB_SYNC_AND_AI_STUDIO_RCA.md), [`GITHUB_WORKFLOW_GUIDE.md`](./docs/engineering/GITHUB_WORKFLOW_GUIDE.md), [`SAFE_SYNC_CHECKLIST.md`](./docs/engineering/SAFE_SYNC_CHECKLIST.md), [`CONTRIBUTING.md`](./CONTRIBUTING.md) — GitHub sync root-cause analysis, repaired CI/security workflows, and safe pull/rebase checklist.
  - [`docs/operations/DISASTER_RECOVERY_RUNBOOK.md`](./docs/operations/DISASTER_RECOVERY_RUNBOOK.md), [`INCIDENT_RESPONSE_PLAYBOOK.md`](./docs/operations/INCIDENT_RESPONSE_PLAYBOOK.md), [`MONITORING_AND_OBSERVABILITY.md`](./docs/operations/MONITORING_AND_OBSERVABILITY.md) — Production & WAL recovery runbooks.
  - [`docs/audits/V28_SECURITY_AND_RBAC_AUDIT.md`](./docs/audits/V28_SECURITY_AND_RBAC_AUDIT.md), [`V28_PERFORMANCE_BENCHMARK.md`](./docs/audits/V28_PERFORMANCE_BENCHMARK.md), [`V28_POSTGRESQL_MIGRATION_REPORT.md`](./docs/audits/V28_POSTGRESQL_MIGRATION_REPORT.md) — Security, SoD, latency, and Schema 26 PostgreSQL DDL reports.
  - [`V28_TEST_REPORT.md`](./V28_TEST_REPORT.md) — V28.0 verification report (`6,900` total assertions; `900` new V28 checks), 27 readiness flags, and `ECONEX-V28.0-SOURCE.zip` proof.
- **Core Platform Architecture, Operations & Compliance Docs:**
  - [`INTERACTIVE_FUNCTIONALITY_AUDIT.md`](./INTERACTIVE_FUNCTIONALITY_AUDIT.md) — Audited interactive control catalog (`163` registered controls, zero dead buttons).
  - [`ROUTE_INVENTORY.md`](./ROUTE_INVENTORY.md) — Full role-scoped UI route registry (`133` verified routes incl. 15 V27 and 20 V28 workspaces).
  - [`WORKFLOW_COVERAGE.md`](./WORKFLOW_COVERAGE.md) — End-to-end connected workflow pipelines (`WF-V26-01`–`WF-V28-06`) and honesty boundaries.
  - [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DEPLOYMENT.md`](./DEPLOYMENT.md), [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md), [`POSTGRES_MIGRATION.md`](./POSTGRES_MIGRATION.md), [`API_INTEGRATION_GUIDE.md`](./API_INTEGRATION_GUIDE.md), [`SECURITY.md`](./SECURITY.md), [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md), [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md), [`RECOVERY.md`](./RECOVERY.md) — Core platform operations & architecture guides.
  - [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) — Consolidated V28.0 release deliverables, `900` new assertions, and 27-flag truthfulness matrix.
  - Historical baseline docs: [`V27_TEST_REPORT.md`](./V27_TEST_REPORT.md), [`V26_TEST_REPORT.md`](./V26_TEST_REPORT.md), [`WALLET_ARCHITECTURE_V23.md`](./WALLET_ARCHITECTURE_V23.md), [`RELEASE_NOTES_V23.md`](./RELEASE_NOTES_V23.md), [`ROADMAP_V23.md`](./ROADMAP_V23.md), [`RELEASE_NOTES_V22.md`](./RELEASE_NOTES_V22.md), [`RELEASE_NOTES_V21.md`](./RELEASE_NOTES_V21.md).
