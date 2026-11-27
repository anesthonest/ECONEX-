# ECONEX V28.0 — Implementation & Delivery Plan

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

1. **Phase 1 — Immutable Backup & Schema 26 Foundation:** Preserve `/data/aros_database.v27.backup.json`, add 20 V28 collections to `src/server/db.ts`, create `src/server/v28Seed.ts`, and mirror DDL in `database/schema_v26.sql` & `src/server/postgres/schema_v26.sql`.
2. **Phase 2 — Core Execution, Contracts, Procurement & Fulfilment Engines:** Build `src/server/v28Engine.ts` and `/api/v28/*` REST router (`src/server/v28Routes.ts`) with OpenAPI 3.1 contract.
3. **Phase 3 — Interoperability, Vault, AI Guardrails, Ops Control & Offline Conflicts:** Implement dual-approval SoD, DLQ replay, SHA-256 document vault, guarded `gemini-4-hydrogen` orchestrator, and optimistic field sync conflict detection.
4. **Phase 4 — Repository & CI Hygiene Repair:** Harden `.gitignore`, add `.github/workflows/ci.yml` & `security.yml`, PR/issue templates, `CONTRIBUTING.md`, and read-only `src/server/v28GitHubEngine.ts`.
5. **Phase 5 — Frontend Routing & 6 Modular Views:** Register 20 V28 routes (`133` total), audit registry entries, `ApiClient` V28 methods, and 6 lazy UI components in `src/components/v28/`.
6. **Phase 6 — Verification, Source Export & Truthfulness Audit:** Author 900 live assertions (`T6901–T7800`), run full V18–V28 regression, build secret-free `ECONEX-V28.0-SOURCE.zip`, and enforce all 9 mandatory `false` honesty flags.
