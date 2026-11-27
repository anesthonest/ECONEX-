# ECONEX V27.0 — Schema 25 Relational & WAL Database Inventory

**Schema Version:** `25` (Cumulative DDL: `schema_v13.sql` – `schema_v25.sql`)  
**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Cumulative SQL Schema Stack (`src/server/postgres/`)

| File | Release | Scope | Tables |
|---|---|---|---|
| `schema_v13.sql` – `schema_v18.sql` | V13–V20 | Core entities, Uganda pilot, 27-gate remediation, unified commercial & co-op ops | Core + 9 V20 tables |
| `schema_v19.sql` | V21 | Controlled pilot lifecycle, onboarding, field ops, migration audit | 8 tables |
| `schema_v20.sql` | V22 | 30-sector taxonomy, multi-sector business, Marketplace 2.0, procurement, FX | 18 tables |
| `schema_v21.sql` | V23 | EUWN wallet network (`^EX-[A-Z0-9]{12}$`), subaccounts, ledger, QR, cards | 22 tables |
| `schema_v22.sql` | V24 | RFQs, 18-state orders, ATP inventory, BOM manufacturing, corridors, obligations | 26 tables |
| `schema_v23.sql` | V25 | Enterprise orgs, zero-trust auth, SoD ledger, outbox/jobs, dev platform, countries/FX, vault, incidents, compliance, billing, search & ops | 38 tables |
| `schema_v24.sql` | V26 | User/business onboarding, UX preferences, E2E commerce workflow executions, saved items, unified inbox & delivery logs, recovery challenges, support tickets, doc shares, report exports & audit catalogs | 15 tables |
| **`schema_v25.sql`** | **V27** | **Schema migrations ledger, network profiles & privacy, relationships, evidence verification, transaction-linked reviews & appeals, saved searches/history, explainable matching/feedback, opportunities/responses, buyer/supplier capabilities, org CRM, paid promotions, threads/messages, referrals, outcomes, pilots/participants, field assignments/reports, integration partners & moderation cases** | **26 SQL tables (25 WAL maps)** |

---

## 2. Schema 25 (`schema_v25.sql`) Breakdown

1. `v27_schema_migrations` — Additive Schema 25 migration ledger and attribution checkpoint.
2. `v27_network_profiles` & `v27_network_relationships` — Participant directory with visibility scopes and relationship transition history.
3. `v27_verification_records`, `v27_reputation_reviews` & `v27_reputation_appeals` — Evidence provenance dossiers and transaction-linked reviews + appeals.
4. `v27_saved_searches`, `v27_search_history`, `v27_match_recommendations` & `v27_match_feedback` — Search persistence, query log, and explainable multi-factor matching.
5. `v27_economic_opportunities` & `v27_opportunity_responses` — Multi-sector exchange bids linked cleanly to RFQs and wallet obligation intents.
6. `v27_buyer_requirements`, `v27_supplier_capabilities`, `v27_crm_leads` & `v27_paid_promotions` — Declared vs verified capability separation, org-isolated CRM, and sponsored placement separation.
7. `v27_network_threads`, `v27_network_messages`, `v27_referral_attributions` & `v27_outcome_metrics` — Participant-isolated threads, non-cash referrals, and provenance-tagged outcomes.
8. `v27_pilot_programmes`, `v27_pilot_participants`, `v27_field_assignments`, `v27_field_reports`, `v27_integration_partners` & `v27_moderation_cases` — Pilot readiness, offline field sync + SoD reviews, 4-gate `LIVE` partner lifecycle, and trust moderation.

---

## 3. Data Integrity & Rollback Guarantees

- **Pre-Upgrade Backup:** `data/aros_database.v26.backup.json` is written prior to Schema 24→25 migration and verified via `GET /api/v27/migration/backup-verify` and `GET /api/v27/migration/status`.
- **Financial Invariant:** Double-entry debit/credit parity remains strictly `0.00` variance across Schema 21–25.
