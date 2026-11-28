# ECONEX V30.0 — UNIVERSAL FINANCIAL INTEROPERABILITY ENGINE (UFIE)

**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Core Architectural Problem Solved

Traditional African and global payment tools suffer from siloed wallets, opaque FX markups, single-carrier outage failures, weak invoice/contract linkage, and black-box account freezes. ECONEX UFIE acts as an intelligent, **provider-neutral financial orchestration layer** sitting above existing payment rails while linking every payment instruction to real commercial objects (`ORDER`, `CONTRACT`, `INVOICE`, `PROCUREMENT`).

## 2. Smart Routing & Fee Transparency

`POST /api/v30/routing/evaluate` ranks eligible healthy providers across 4 user-selectable strategies:
1. `LOWEST_COST`: Minimizes `providerFeeMinor + platformFeeMinor + fxSpreadMinor`.
2. `FASTEST_SETTLEMENT`: Prioritizes near-instant rails (e.g., PesaLink, M-Pesa, MTN/Airtel sandbox rails).
3. `HIGHEST_RELIABILITY`: Prioritizes historical reliability & health telemetry.
4. `FALLBACK_RESILIENCE`: Prefers `HEALTHY` rails with multi-carrier failover readiness.

Every quote discloses:
- `principalMinor`
- `providerFeeMinor`
- `platformFeeMinor`
- `fxSpreadMinor`
- `totalDebitMinor`
- `primary` vs `fallback` rail + indicative conversion rate.

## 3. Idempotent Execution & Zero-Double-Debit Failover

`POST /api/v30/payments` enforces:
- Unique `idempotencyKey` replay guard: duplicate submissions return `HTTP 200` (`deduplicatedReplay: true`) with the exact original instruction and ledger group—never creating a second debit.
- **Pre-Debit Failover (`simulatePrimaryFailure: true`)**: If the primary provider fails retryably *before* settlement debit (`FAILED_RETRYABLE` attempt #1), UFIE switches atomically to the `fallback` rail (`SUCCEEDED` attempt #2) and writes **exactly one** balanced `V23LedgerPosting` journal pair (`DEBIT == CREDIT`).
- **12-State Lifecycle**: `REQUESTED -> VALIDATING -> AUTHORIZED -> SUBMITTED -> PROCESSING -> CONFIRMED -> PENDING_RECONCILIATION -> RECONCILED -> CLOSED` plus `FAILED`, `DISPUTED`, and compensating `REVERSED`.
