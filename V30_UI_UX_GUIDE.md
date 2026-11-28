# ECONEX V30.0 — UI/UX & ACCESSIBILITY GUIDE

**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Progressive Disclosure Across 153 Routes

- **6 Audience-Separated Categories:** `Business`, `Trade`, `Finance`, `Network`, `Support`, `Administration`.
- **Ordinary Role Simplicity:** `FARMER`, `BUYER`, `AGRO_DEALER`, `COOPERATIVE_ADMIN`, and `TRANSPORTER` never see `Administration` developer/diagnostic routes; `SIMPLE` mode stays focused (`<= 60` items per role).
- **Home Entry Points (`EconexHomeView.tsx`):** Quick action cards connect users directly to `Send, Pay & Wallet` (`v30-routing`), `Cross-Border & FX` (`v30-corridors`), and `Financial Network` (`v30-financial-network`).

## 2. Curated Financial Visual Assets (`public/assets/econex/finance/`)

Six domain-specific local JPG photographs are registered in `src/config/econexAssetManifest.ts` (`18` total assets across the app) with zero Unsplash links:
- `enterprise-finance-hub.jpg`
- `corridor-border-trade.jpg`
- `mobile-money-agent.jpg`
- `digital-treasury.jpg`
- `merchant-qr-counter.jpg`
- `rural-agro-finance.jpg`

## 3. Clarity & Truthfulness in Financial UI

- Every wallet, card, payment, FX quote, and USSD screen presents tabular minor/major-unit numbers, plain-language fee breakdowns before confirmation, and explicit non-custodial/sandbox disclosures.
