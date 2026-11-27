# ECONEX V27.0 — PostgreSQL 16 Migration, Schema 25 & Rollback Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.  
**Current Active Authority:** `LOCAL_JSON_WAL_AUTHORITATIVE` (`data/aros_database.json`, Schema 25)  
**Target Production Engine:** PostgreSQL 16 (`src/server/postgres/schema_v13.sql` – `schema_v25.sql`)

---

## 1. Schema Evolution Summary

Apply SQL schemas sequentially when provisioning PostgreSQL 16:

1. `schema_v13.sql` – `schema_v18.sql`: Core economic entities, Uganda pilot tables, 27-gate network remediation, and 9 V20 unified operations tables.
2. `schema_v19.sql`: 8 V21 pilot lifecycle, onboarding, field ops, and migration audit tables.
3. `schema_v20.sql`: 18 V22 universal sector taxonomy, multi-sector business, Marketplace 2.0, 16-stage contracts, procurement, and FX tables.
4. `schema_v21.sql`: 22 V23 wallet identity (EUWN `^EX-[A-Z0-9]{12}$`), subaccounts, double-entry ledger, QR merchants, virtual/physical cards, and risk/reconciliation tables.
5. `schema_v22.sql`: 26 V24 universal commerce, RFQ/negotiation, 18-state orders, ATP inventory, BOM manufacturing, logistics corridors, and obligation tables.
6. `schema_v23.sql`: 38 V25 Enterprise Multi-Org, Zero-Trust Identity, Dual-Approval Ledger, Outbox/Jobs, Developer Platform, Country/FX, Vault, Compliance & Resilience tables.
7. `schema_v24.sql`: 15 V26 onboarding, preferences, 12-stage workflow executions, notifications, recovery, support, shares, reports & audit tables.
8. **`schema_v25.sql`**: **26 additive V27 tables** covering network profiles, relationships, evidence verification, transaction-linked reviews & appeals, discovery saved searches/history, explainable matching, opportunities/responses, buyer requirements, supplier capabilities, org CRM, paid promotions, threads/messages, referrals, outcomes, pilots, field sync/reports, partner governance & moderation cases.

---

## 2. Schema 25 Migration & V26 Rollback Endpoints

1. **`GET /api/v27/migration/status`**: Verifies Schema 25 collection completeness, integrity flags, and V26 rollback checkpoint health.
2. **`GET /api/v27/migration/backup-verify`**: Validates `data/aros_database.v26.backup.json` byte count and SHA-256 checksum.
3. **`GET /api/v25/postgres/status` & `POST /api/v25/postgres/migrate`**: Inspects PG16 readiness and executes safe 20-stage dry-run / Stage-10 interrupt recovery drills while PostgreSQL credentials remain unconfigured.

---

## 3. Cutover & Fail-Closed Authority Rule

- While `DATABASE_URL` / `PGHOST` are unset, ECONEX remains fail-closed on `LOCAL_JSON_WAL_AUTHORITATIVE` and reports `V27_POSTGRESQL_CUTOVER_COMPLETE: false`.
