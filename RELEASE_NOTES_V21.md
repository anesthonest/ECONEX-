# ECONEX V21.0 — Release Notes (`V21.0-CONTROLLED-PILOT-AND-MARKET-ACTIVATION`)

**Product:** ECONEX — Universal Economic Operating System  
**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.  
**Initial Operating Jurisdiction:** Republic of Uganda  
**Regional Readiness:** East African Community (EAC) & AfCFTA Corridors  
**Baseline Upgraded From:** ECONEX V20.0 (Schema 18) → **Schema 19**

---

## 1. Key Capabilities Introduced in V21.0

1. **Controlled Pilot Operating Environment (`V21PilotCommandCentre` + `/api/v21/pilots/*`)**
   - 8-stage primary lifecycle (`DRAFT → CONFIGURED → APPROVAL_PENDING → APPROVED → READY → ACTIVE → PAUSED → COMPLETED`) plus `SUSPENDED` and `CANCELLED`.
   - Configurable templates: Model A (`FARMER_TO_BUYER`), Model B (`SME_TRADE`), Model C (`COOPERATIVE_AGGREGATION`).
   - Strict separation across `ACTUAL`, `SIMULATED`, `TEST`, `TARGET`, `PROJECTION`, and `PENDING_EXTERNAL_SURVEY` metrics.
   - Immutable audit trail (`DELETE /api/v21/pilots/:id/audit` returns `403 AUDIT_TRAIL_IMMUTABLE`) and SHA-256 checksummed JSON closure reports.

2. **10-Category Onboarding & 7-State Verification (`V21OnboardingHub` + `/api/v21/onboarding/*`)**
   - Categories: `INDIVIDUAL`, `FARMER`, `BUYER_TRADER`, `SME_BUSINESS`, `COOPERATIVE`, `AGRO_DEALER`, `LOGISTICS_OPERATOR`, `SERVICE_PROVIDER`, `INSTITUTIONAL`, `FIELD_OFFICER`.
   - 6-tier Uganda geographic hierarchy (`Country → Region → District → Subcounty → Parish → Village`).
   - 7 verification states (`UNVERIFIED`, `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`, `EXPIRED`) enforcing that registration never grants verified identity without independent review.
   - Privacy consent recording, self-service JSON data export, and device/SIM recovery request tracking.

3. **Mobile-First Low-Bandwidth Field Operations (`V21FieldOperationsApp` + `/api/v21/field/*`)**
   - Explicit offline states (`LOCAL_DRAFT`, `QUEUED`, `SYNCING`, `SYNCED`, `CONFLICT`, `FAILED`), manual/automatic retry, conflict forwarding to V20 sync, opt-in GPS gating (`403` without consent), and SHA-256 evidence file metadata digests.
   - 7-stage Field Officer task workflow (`CREATED → ASSIGNED → ACCEPTED → IN_PROGRESS → SUBMITTED → REVIEWED → CLOSED` plus `REJECTED`/`REASSIGNED`) with officer jurisdiction scoping.

4. **Field Monitoring, Exceptions & Support Command Centre (`/command-centre`)**
   - Multi-axis monitoring filters (`pilotId`, `district`, `category`, `status`, date range).
   - Operational exception queue (`VERIFICATION_BACKLOG`, `DELIVERY_EXCEPTION`, `OFFLINE_SYNC_FAILURE`, `RECONCILIATION_EXCEPTION`, `DISPUTE_ATTENTION`, `SUPPORT_ESCALATION`) with owner & resolution history.
   - Participant support, complaint, and abuse escalation ticketing.

5. **EAC / AfCFTA Country Readiness & Localization**
   - 7 configurable country profiles (`UG`, `KE`, `TZ`, `RW`, `BI`, `SS`, `CD`) explicitly flagged as operational guidance only (`NOT_CONNECTED_OPERATIONAL_GUIDANCE_ONLY`).
   - 7-language workflow coverage (`en`, `lg`, `sw`, `nyn`, `ach`, `teo`, `xog`).

6. **Deployment Portability & PostgreSQL 16 Dry-Run Tooling**
   - Additive PostgreSQL 16 Schema 19 DDL (`src/server/postgres/schema_v19.sql`) and checksummed dry-run audit endpoint (`/api/v21/postgres/dry-run`).
   - `/health`, `/ready`, `X-Correlation-Id` tracking, and graceful shutdown.

---

## 2. Explicit Scope Boundaries & Open External Gates

- **Database Authority:** `LOCAL_JSON_WAL_AUTHORITATIVE` (`POSTGRES_MIGRATION_READY: true`, `POSTGRES_CUTOVER_COMPLETE: false`).
- **Source Hosting:** `GITHUB_READY: true`, `GITHUB_PUBLISHED: false` (no remote GitHub credentials configured inside sandbox).
- **External Systems:** `EXTERNAL_INTEGRATIONS_LIVE: false` (Mobile Money PSPs, banks, BoU RTGS, URSB/URA/NIRA, customs remain non-live/sandbox).
- **Field Deployment:** `V21_PILOT_READY: true`, `HUMAN_FIELD_VALIDATION_COMPLETE: false`, `V21_PILOT_ACTIVE: false`, `PRODUCTION_DEPLOYED: false`.
