# ECONEX V23.0 — PostgreSQL 16 Migration & Dry-Run Audit Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.  
**Current Active Authority:** `LOCAL_JSON_WAL_AUTHORITATIVE` (`data/aros_database.json`, Schema 21)  
**Target Production Engine:** PostgreSQL 16 (`src/server/postgres/schema_v13.sql` – `schema_v21.sql`)

---

## 1. Schema Evolution Summary

Apply SQL schemas sequentially when provisioning PostgreSQL 16:

1. `src/server/postgres/schema_v13.sql` — Core economic entities, tenants, ledger accounts & double-entry journal
2. `src/server/postgres/schema_v16.sql` — Uganda pilot tables, HSM/WORM & gate records
3. `src/server/postgres/schema_v17.sql` — 27-gate network remediation & 21-state transactions
4. `src/server/postgres/schema_v18.sql` — 9 V20 unified commercial, logistics, reconciliation & cooperative pool tables
5. `src/server/postgres/schema_v19.sql` — 8 V21 pilot lifecycle, onboarding, field activity, officer task, exception, support, country profile & migration audit tables
6. `src/server/postgres/schema_v20.sql` — 18 V22 universal sector taxonomy, multi-sector businesses, artisans, Marketplace 2.0, 16-stage contracts, procurement, projects, invoicing, FX, AI & webhooks tables
7. `src/server/postgres/schema_v21.sql` — **22 V23 tables**: `v23_participant_identities`, `v23_wallet_number_allocations` (permanent non-reassigned EUWN constraint `^EX-[A-Z0-9]{12}$`), `v23_wallet_accounts`, `v23_currency_subaccounts` (`available_minor >= 0` check constraints), `v23_country_operating_profiles`, `v23_wallet_transactions`, `v23_ledger_postings`, `v23_merchant_accounts`, `v23_merchant_terminals`, `v23_qr_payment_requests`, `v23_virtual_cards`, `v23_physical_cards`, `v23_compliance_reviews`, `v23_risk_events`, `v23_reconciliation_records`, `v23_wallet_audit_events`, `v23_fee_configurations`, `v23_support_dispute_cases`, `v23_offline_queue_items`, `v23_integration_interfaces`, `v23_reversals_or_refunds`, and `v23_continuity_runs`

---

## 2. Running Non-Destructive Dry-Run Audits

Authorized `PLATFORM_ADMIN` operators can audit schema completeness, foreign-key topology, EUWN/txReference uniqueness, V22 backup rollback readiness, and balanced double-entry ledger parity:

- **UI:** Navigate to `/wallet/operations-control` → **Run Schema 21 PG Dry-Run Audit**.
- **API:**
  - `GET /api/v23/postgres-audit` — Inspect recent Schema 21 dry-run audits.
  - `POST /api/v23/postgres-audit` — Execute Schema 21 22-collection mapping parity audit, SHA-256 checksum computation, uniqueness verification, and ledger balance check.
  - Preserved: `POST /api/v22/postgres/dry-run` and `POST /api/v21/postgres/dry-run`.

---

## 3. Cutover & Rollback Safety Rule

- When `DATABASE_URL` / `PGHOST` is unset, ECONEX keeps `LOCAL_JSON_WAL_AUTHORITATIVE` active and reports `V23_POSTGRESQL_CUTOVER_COMPLETE: false`.
- Before upgrading Schema 20 → Schema 21, `db.ts` preserved `data/aros_database.v22.backup.json` for deterministic rollback verification (`db.verifyV22BackupAndRollbackReadiness()`).
