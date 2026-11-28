# ECONEX V30.0 — SYSTEM ARCHITECTURE

**Release:** `V30.0-UNIVERSAL-FINANCIAL-RESILIENCE`  
**Schema Version:** `27` (migrated safely from `26` with immutable backup `data/aros_database.v29.backup.json`)  
**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Backend Architecture (`src/server/`)

- **`v30Seed.ts`**: Seeds 13 financial providers, 8 competitive capability dimensions, provider health baseline, 3 routing policies, initial payment instructions/attempts/settlements/reconciliation case, 8 EAC/AfCFTA corridors, 8 cash agents + 4 TTL liquidity reports, 2 disputes, 2 fraud velocity events, 8 regulatory requirements + 3 checksummed evidence items, 2 sandbox card control profiles, 4 SoD business finance documents, 2 `*284#` USSD sessions, initial AI telemetry, 5 Phase-B repair register records, and initial Git sync event.
- **`v30Engine.ts`**: Pure deterministic financial orchestration engine implementing:
  - Minor-unit integer money math (`assertPositiveInt`, no floating-point ledger accumulation)
  - Provider health state machine & Digital Asset Gate promotion blocker (`403`)
  - Smart multi-factor routing (`LOWEST_COST`, `FASTEST_SETTLEMENT`, `HIGHEST_RELIABILITY`, `FALLBACK_RESILIENCE`)
  - Idempotent single-debit payment instruction engine with automatic backup-rail failover & balanced double-entry `V23LedgerPosting` journals
  - Reconciliation discrepancy queue and compensating double-entry reversal journal postings
  - Corridor FX comparator, agent TTL liquidity, 4-eye business finance SoD (`requesterUserId !== approverUserId`), escrow disputes, human fraud review, `*284#` USSD sandbox, and guarded Gemini advisory
- **`v30Routes.ts`**: Express router mounted at `/api/v30/*` enforcing session/header authentication (`401`), RBAC (`403`), HMAC webhook verification, and admin-only AI fault test hook (`/api/v30/ai/test-fault-mode`).
- **`v30GitHubEngine.ts`**: Runs `git -c safe.directory=/app/applet` checks and validates `.gitignore` coverage, secret tracking, branch/commit metadata, and archive existence while honestly keeping `REMOTE_CONFIGURED=false` and `PUSH_SUCCESSFUL=false` when no external remote/OAuth exists.
- **`gemini.ts`**: Hardened Gemini resilience wrapper with SHA-256 request deduplication, bounded non-sensitive cache, error classification taxonomy, zero-retry `429`/`401`/`403` circuit-breaker cooldown, bounded `<=2` jittered `5xx`/timeout retries, and telemetry counters.

## 2. Frontend Architecture (`src/components/v30/`)

1. `V30FinancialNetworkHub.tsx`: UFIE Overview, 13 Providers & Outage Simulation, Competitive Capabilities Matrix, Smart Payment Router & Execution, Transactions & Reversals, Settlement Reconciliation.
2. `V30CorridorsAgentsLiquidityView.tsx`: 8 Cross-Border Corridors, Transparent FX Quote Comparator, Cash Agents Directory, TTL Liquidity Reporting, `*284#` USSD Sandbox Simulator.
3. `V30BusinessDisputesComplianceView.tsx`: Business Invoices/POs/Installments/Payroll Batches with 4-Eye SoD, Escrow Disputes, Fraud Velocity Human Review Queue, Regulatory Readiness Centre.
4. `V30UniversalWalletAndCardsView.tsx`: EUWN Multi-Rail Wallet Overview & Card Spend/Freeze Controls.
5. `V30DeveloperGitHubIntegrationsView.tsx`: Local Git Diagnostics, Guarded Financial AI + 429 Telemetry, Phase-B Repair Register & 34-Row Readiness Matrix, OpenAPI 3.1 Reference.
6. Enhanced `EconexHomeView.tsx` quick actions & `V23CardsInfrastructureView.tsx` V30 card governance controls.
