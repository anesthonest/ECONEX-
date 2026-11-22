# ECONEX V23.0 → Live Network Roadmap

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## Phase A — Completed in V23.0 (Engineering Baseline)
- Permanent EUWN identity architecture (`EX-XXXXXXXXXXXX`) across phones, devices, and countries.
- Integer minor-unit (`x100`) double-entry ledger, multi-currency subaccounts, idempotency, concurrency locks, and reconciliation.
- Sandbox Merchant POS/QR (HMAC-SHA256) acceptance, partial/full refunds, and digital receipts.
- Simulated virtual & 13-stage physical card lifecycle with strict non-live safety guards.
- 7 African country operating profiles, 14-gate regulatory readiness model, 12 continuity drills, and Schema 21 PostgreSQL 16 DDL.

## Phase B — Legal, Licensing & Bank Safeguarding Prerequisites (External Gates)
1. **Uganda Legal Classification & Licensing:** Obtain formal legal opinion under Uganda National Payment Systems Act 2020 (Act 15 of 2020) and engage Bank of Uganda for applicable PSP/PSO/EMI licensing.
2. **Customer Funds Safeguarding:** Execute trust deed and open ring-fenced commercial settlement/trust accounts before removing the `V23_REAL_VALUE_TRANSACTIONS_ENABLED = false` lock.
3. **Independent Audits:** Complete external cybersecurity penetration testing, PDPO data protection registration, and regulatory sandbox evaluation.

## Phase C — Partner & Infrastructure Cutover (Pre-Live)
1. **Managed PostgreSQL 16 Cutover:** Provision managed PostgreSQL 16 with SSL + PITR WAL archiving, apply `schema_v13.sql`–`schema_v21.sql`, and verify row/SHA-256 parity.
2. **Card BIN Sponsor & Scheme Certification:** Onboard licensed issuer processor, PCI-DSS Level 1 scope, and ATM switch certification before setting `V23_CARD_SCHEME_CERTIFIED` or `V23_PHYSICAL_CARDS_ISSUED`.
3. **Controlled Uganda Pilot → Regional EAC Corridors:** Activate Uganda first (`GATE_01`–`GATE_14` verified), followed by Kenya, Tanzania, Rwanda, Burundi, South Sudan, and DRC as individual jurisdiction approvals complete.
