# ECONEX V30.0 — UNIVERSAL WALLET & CARD CONTROLS ARCHITECTURE

**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. EUWN Multi-Rail Wallet Evolution

Building on V23's **ECONEX Universal Wallet Number (`EX-...`)** and `BIGINT` minor-unit double-entry subaccounts (`v23Wallets`, `v23Subaccounts`, `v23LedgerPostings`), V30 adds:
- Unified multi-rail overview (`/wallet/universal` & `/api/v30/wallet/universal`) linking wallet balances to smart payment routing, settlement records, and card controls.
- Strict double-entry accounting verification (`journalBalanced = (debitMinor === creditMinor)`).
- Compensating reversal entries rather than destructive deletes on settled payments.

## 2. Tokenized Card Spend Governance (`v30WalletCardProfiles`)

Both `/wallet/universal` and `/wallet/cards` (`V23CardsInfrastructureView`) support sandbox governance controls via `POST /api/v30/wallet/cards/:id/controls`:
- `dailySpendLimitMinor` & `monthlySpendLimitMinor` (validating `monthly >= daily`)
- Instant `frozen` / unfreeze toggle
- `internationalEnabled`, `onlineEnabled`, and `allowedCategories` allowlists
- **Immutable Non-Certification Lock:** Every profile strictly enforces `schemeCertified: false` and `liveIssuanceEnabled: false`. No external Visa/Mastercard/ATM authorization is claimed or active.
