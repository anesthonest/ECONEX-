# ECONEX V23.0 — Universal Economic Identity, Wallet Network & Card Infrastructure Architecture

**Product:** ECONEX — Universal Economic Operating System  
**Release:** `V23.0-UNIVERSAL-WALLET-NETWORK` (Schema Version 21)  
**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.  
**Starting Jurisdiction:** Republic of Uganda (Regional EAC → AfCFTA → Global Extensible)

---

## 1. Strategic Identity & Core Principle

**ONE ECONEX NUMBER. ONE CONNECTED WALLET IDENTITY. MULTIPLE SUPPORTED COUNTRIES. MULTIPLE CURRENCIES. ONE UNIVERSAL ECONOMIC NETWORK.**

ECONEX assigns each verified wallet account a permanent, cryptographically unpredictable **ECONEX Universal Wallet Number (EUWN)** formatted `EX-XXXXXXXXXXXX` (using a 32-character unambiguous alphabet via CSPRNG `crypto.randomBytes`).

- **Permanent Across Changes:** Phone number updates, lost-device recovery, new-device migrations, cross-country travel (`UG → KE → TZ → RW`), and added economic roles (`INDIVIDUAL`, `SUPPLIER`, `MERCHANT`, `BUSINESS_OWNER`, `COOPERATIVE_MEMBER`, `INSTITUTIONAL_APPROVER`) never change or regenerate the EUWN (`reassigned = false`).
- **Separate Entity Ownership:** Individuals, businesses, cooperatives, and institutions maintain distinct wallet containers while sharing the common identity verification and transaction infrastructure.

---

## 2. Multi-Currency Account & Ledger Architecture

- **Integer Minor Units Only:** Every currency subaccount enforces `minorUnitScale = 100` (e.g., UGX/KES/TZS/RWF/BIF/SSP/CDF/USD/EUR stored in integer minor units — zero floating-point drift).
- **Five Balance Buckets:** `availableMinor`, `pendingMinor`, `reservedMinor` (compliance holds), `restrictedMinor`, and `reversedMinor`.
- **Direct-Edit Guards:** `POST /api/v23/wallets/:id/balance` and `PATCH /api/v23/subaccounts/:id/balance` return HTTP `403 DIRECT_BALANCE_EDIT_PROHIBITED`. Balances only mutate via balanced double-entry transactions (`db.postUniversalJournalEntry` + `v23LedgerPostings`).
- **Cross-Currency Safety:** Cross-currency transfers require explicit FX preview disclosure (`SYNTHETIC_TEST_RATE`) and `fxUserConfirmed: true`. Minor-unit rounding differences automatically post a balanced UGX variance leg (`COA-4010`), maintaining general ledger trial balance at zero variance.

---

## 3. Atomic Transaction Lifecycle & Safeguards

1. **Idempotency & Concurrency:** Every transaction requires a unique `idempotencyKey`; in-flight deduplication and per-subaccount spend locks prevent race-condition double spends.
2. **State Machine:** `INITIATED → VALIDATED → AUTHORIZED → RISK_CHECKED → APPROVED / UNDER_REVIEW → POSTED → CONFIRMED` (plus compensating `PARTIALLY_REFUNDED`, `REFUNDED`, `REVERSED`).
3. **Hard Real-Value & Regulatory Lock:** `realValueRequested: true` or `txType === 'CASH_WITHDRAWAL_RECORD'` is blocked with HTTP `403 REAL_VALUE_GATE_LOCKED`.
4. **PIN Security:** Wallet PINs are salted and hashed with `crypto.scryptSync`. `pinHash` and `pinSalt` are never exposed on API responses.

---

## 4. Merchant Acceptance, Signed QR & Simulated Cards

- **Merchant Terminals & HMAC-SHA256 QR:** Supports Static Counter QR (multiple payments, buyer-specified amount) and Dynamic Invoice QR (fixed minor amount, single-use expiry). Payloads are HMAC-SHA256 signed and verified before debiting payers.
- **Virtual Cards:** Issue tokenized non-live virtual cards (`TOK-ECONEX-...`, masked PAN, `externalNetworkUsable = false`), with freeze/unfreeze/cancel controls, country/currency allow-lists, MCC blocking, and per-tx limit enforcement. Frozen card attempts record `V23RiskEvent` entries.
- **13-Stage Physical Card Workflow:** Models `APPLIED → ELIGIBILITY_REVIEW → APPROVED → QUEUED_FOR_PRODUCTION → PRODUCED → DISPATCHED → RECEIVED → PIN_SETUP_VERIFIED → ACTIVATED` (+ `SUSPENDED/REPLACED/CANCELLED`), while strictly preserving `schemeCertified = false`, `physicalCardLiveIssued = false`, and `atmInterfaceStatus = INACTIVE_NOT_LIVE`.

---

## 5. Multi-Country & Regulatory Gate Architecture (Uganda NPS Act 2020 & BoU)

- **7 Initial Country Profiles (`UG`, `KE`, `TZ`, `RW`, `BI`, `SS`, `CD`):** All start in `countryActivationStatus = NOT_ACTIVATED` and `operationalAvailabilityStatus = SANDBOX_ONLY_NOT_LIVE`. Extensible dynamically by `PLATFORM_ADMIN` (e.g., `ZM`).
- **14 Mandatory Regulatory Gates per Country:** Covers entity readiness, legal classification (e.g., Bank of Uganda / National Payment Systems Act 2020), PSP/PSO/EMI licences, safeguarding trust accounts, AML/CFT, CDD/KYB, PDPO privacy, cybersecurity, BCDR, and written authorization. Attempting to bypass gates returns HTTP `403 REGULATORY_GATE_BYPASS_PROHIBITED`.

---

## 6. Truthful Boundary Summary

ECONEX V23 operates as a **verified local/sandbox engineering implementation**. Real-value money movement, cash-in/cash-out, Bank of Uganda licensing, live card scheme certifications (Visa/Mastercard/ATM), live NIRA/URSB/sanctions feeds, managed PostgreSQL 16 cutover, and live production deployment remain **strictly `false` / external gates**.
