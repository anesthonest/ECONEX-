# ECONEX V28.0 — DATA PRESERVATION & RECOVERY VERIFICATION

**Product:** ECONEX — Universal Economic Operating System  
**Release Transition:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK` (Schema 25) -> `V28.0-UNIVERSAL-ECONOMIC-EXECUTION` (Schema 26)  
**Developer:** VINEXSAH TECHNOLOGIES  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.  
**Snapshot Captured At:** `2026-11-25T13:34:44Z`

---

## 1. Authoritative Persistence Model Confirmation

Inspection of `/server.ts`, `/src/server/db.ts`, `/src/server/v25PostgresEngine.ts`, and `/api/v27/migration/status` confirms:

- **Authoritative Store:** Local JSON WAL (`/app/applet/data/aros_database.json`).
- **PostgreSQL Status:** `DATABASE_URL` and `PGHOST` are unconfigured (`LOCAL_JSON_WAL_AUTHORITATIVE`). V28 will keep JSON WAL authoritative while supplying additive `database/schema_v26.sql` and `src/server/postgres/schema_v26.sql` DDL compatibility without mutating Schema 25 tables or silently switching database authority.

---

## 2. Verified Pre-V28 Backup & Source Snapshots

No existing backup files were overwritten (`aros_database.v13.backup.json` .. `aros_database.v26.backup.json` remain intact). An immutable V27 baseline snapshot was created prior to any Schema 26 changes:

| Artifact | Location | Size (Bytes) | SHA-256 Checksum | Verification Result |
|---|---|---:|---|---|
| Live V27 WAL Authoritative DB | `/app/applet/data/aros_database.json` | `28,401,965` | `9f081339e5bb8dda0760b18bf650976a3a31bbf03a510d5bca0287141e52c748` | Parsed valid Schema 25 |
| Immutable V27 Preservation Snapshot | `/app/applet/data/aros_database.v27.backup.json` | `28,401,965` | `9f081339e5bb8dda0760b18bf650976a3a31bbf03a510d5bca0287141e52c748` | Exact match (`backupMatchesLive: true`), JSON readable |
| Pre-V28 Complete Source Archive | `/app/applet/exports/ECONEX-V27.0-SOURCE.zip` | `6,093,322` | `fe2ba944e5f9b033b8fdc8afa3114ba9f65c050cdeff5766a47747daee433c16` | Verified (`269` files, `unzip -t` + clean extract + 0 secrets) |

---

## 3. Preserved Baseline Record Counts & Financial Totals

- **Financial Integrity (Universal Double-Entry Journal):**
  - Journal Entries: `1,928`
  - Journal Debit Total: `15,890,000` UGX (`228,880,799.82` cumulative multi-currency migration check / `37,230,771,837` minor UGX & `919,125` minor TZS balanced at `0` minor variance)
  - Journal Credit Total: `15,890,000` UGX (`balanced: true`)
- **Preserved Record Counts at V27 Snapshot:**
  - `users`: `10` | `tenants`: `4` | `orders`: `3` | `commercialOrders`: `2`
  - `v22Sectors`: `33` | `v22Businesses`: `79`
  - `v23Wallets`: `1,298` | `v23Subaccounts`: `1,477` | `v23Transactions`: `1,866` | `v23LedgerPostings`: `1,861`
  - `v24Rfqs`: `16` | `v24Agreements`: `311` | `v24Orders`: `386` | `v24ProcurementRequests`: `6` | `v24PurchaseOrders`: `6` | `v24Shipments`: `11` | `v24Inventory`: `24` | `v24Obligations`: `396`
  - `v25Organisations`: `390` | `v25OutboxEvents`: `816` | `v25DeadLetters`: `5` | `v25AuditTrail`: `408` | `v25VaultDocuments`: `388`
  - `v26WorkflowExecutions`: `715` | `v26Notifications`: `829` | `v26RouteInventory`: `113` | `v26ControlAudits`: `143`
  - `v27NetworkProfiles`: `20` | `v27Relationships`: `8` | `v27VerificationRecords`: `12` | `v27Opportunities`: `8` | `v27PilotProgrammes`: `2` | `v27FieldReports`: `10` | `v27IntegrationPartners`: `7`

---

## 4. Recovery Procedure Verification

A dry-run restore test copied `/app/applet/data/aros_database.v27.backup.json` to an isolated temporary location, re-computed SHA-256, and verified JSON deserialization (`recoveryDryRunPassed: true`, `schemaVersion: 25`, `10` users, `1,298` EUWN wallets intact).

### Emergency Rollback Procedure (V28 -> V27)

1. Stop the ECONEX server cleanly (`SIGTERM` / `restart_dev_server`).
2. Verify checksum of `/app/applet/data/aros_database.v27.backup.json`:
   ```bash
   sha256sum data/aros_database.v27.backup.json
   ```
3. Restore the V27 database snapshot atomically:
   ```bash
   cp data/aros_database.aros_v28_failed.json data/aros_database.pre_rollback.json 2>/dev/null || true
   cp data/aros_database.v27.backup.json data/aros_database.json
   ```
4. If rolling back application source code as well, extract `/app/applet/exports/ECONEX-V27.0-SOURCE.zip` into a clean staging directory after verifying its SHA-256 (`fe2ba944...`), reinstall dependencies, and start the server.

---
*Developed under VINEXSAH TECHNOLOGIES. All rights reserved.*
