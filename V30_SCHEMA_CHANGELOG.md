# ECONEX V30.0 — SCHEMA 27 CHANGELOG

**Previous Schema:** `26` (V28/V29)  
**Target Schema:** `27` (V30.0)  
**Rollback Archive:** `data/aros_database.v29.backup.json`  
**DDL Files:** `database/schema_v27.sql` & `src/server/postgres/schema_v27.sql`  
**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Migration & Rollback Safety

- `migrateV26ToV27()` in `src/server/db.ts` runs automatically during `loadFromDisk()` and `seedDatabase()`, preserving all V1–V29 user, ledger, order, contract, network, and execution records intact while upgrading `schemaVersion` from `26` to `27`.
- `verifyV29BackupAndRollbackReadiness()` verifies non-empty backup byte size and computes SHA-256 checksum on `data/aros_database.v29.backup.json`.

## 2. New Schema 27 Tables & Runtime Collections (21 Collections + Migrations)

1. `v30_financial_providers` (`v30FinancialProviders`)
2. `v30_provider_capabilities` (`v30ProviderCapabilities`)
3. `v30_provider_health_events` (`v30ProviderHealthEvents`)
4. `v30_payment_routing_policies` (`v30PaymentRoutingPolicies`)
5. `v30_payment_instructions` (`v30PaymentInstructions`)
6. `v30_payment_attempts` (`v30PaymentAttempts`)
7. `v30_settlement_records` (`v30SettlementRecords`)
8. `v30_reconciliation_cases` (`v30ReconciliationCases`)
9. `v30_financial_corridors` (`v30FinancialCorridors`)
10. `v30_agent_profiles` (`v30AgentProfiles`)
11. `v30_liquidity_reports` (`v30LiquidityReports`)
12. `v30_financial_disputes` (`v30FinancialDisputes`)
13. `v30_fraud_risk_events` (`v30FraudRiskEvents`)
14. `v30_regulatory_requirements` (`v30RegulatoryRequirements`)
15. `v30_regulatory_evidence` (`v30RegulatoryEvidence`)
16. `v30_wallet_card_profiles` (`v30WalletCardProfiles`)
17. `v30_business_finance_docs` (`v30BusinessFinanceDocs`)
18. `v30_offline_ussd_sessions` (`v30OfflineUssdSessions`)
19. `v30_ai_request_metrics` (`v30AiRequestMetrics`)
20. `v30_repair_register` (`v30RepairRegister`)
21. `v30_git_sync_events` (`v30GitSyncEvents`)
22. `v30_schema_migrations` (PostgreSQL DDL migration log)
