# ECONEX V27.0 — Universal Economic Network Architecture

**Product:** ECONEX — Universal Economic Operating System  
**Release:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK`  
**Schema Target:** Schema 25 (`src/server/postgres/schema_v25.sql`)  
**Developer:** VINEXSAH TECHNOLOGIES  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Network Architecture Overview

ECONEX V27.0 establishes the universal, cross-sector economic network layer on top of V22–V26:
- **Participant Profiles (`v27NetworkProfiles`)**: Multi-type participants (`INDIVIDUAL`, `BUSINESS`, `COOPERATIVE`, `SUPPLIER`, `BUYER`, `LOGISTICS_PROVIDER`, `FINANCE_PROVIDER`, `INSTITUTION`) spanning 10+ economic sectors across all 7 East African Community (EAC) jurisdictions (`UG`, `KE`, `TZ`, `RW`, `BI`, `SS`, `CD`).
- **Strict Privacy Controls**: Profiles enforce `PUBLIC`, `NETWORK`, `ORG_ONLY`, and `PRIVATE` visibility boundaries (`canViewProfile` and `sanitizeProfileForViewer`). Setting `PRIVATE` or `ORG_ONLY` automatically disables public search discoverability, and personal email/phone/national ID fields are strictly redacted (`contactPrivacyRedacted: true`) unless the viewer is the owner, platform administrator, or an `ACCEPTED` partner with explicit sharing consent.
- **Trusted Relationships (`v27Relationships`)**: Counterparties establish structured commercial links (`SUPPLIER`, `APPROVED_SUPPLIER`, `BUYER`, `LOGISTICS_CARRIER`, `FINANCE_PARTNER`, `TRADING_PARTNER`) through an invitation workflow (`PENDING` -> `ACCEPTED` / `REJECTED` -> `SUSPENDED` / `TERMINATED`) with full transition audit trails. Self-invitations and third-party acceptances are blocked server-side.
- **Economic Activity Graph (`/api/v27/graph`)**: Computes relationship, opportunity, and transaction-backed review graphs around visible participants while returning `403 PROFILE_PRIVACY_FORBIDDEN` for unauthorized `PRIVATE` profile targets.

## 2. Additive Schema 25 Compatibility

All V27 capabilities persist across 25 additive collections in both JSON WAL storage (`src/server/db.ts`) and PostgreSQL 16 DDL (`src/server/postgres/schema_v25.sql`), preserving V1–V26 tables and maintaining verified V26 snapshot rollback readiness (`data/aros_database.v26.backup.json`).
