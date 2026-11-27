# ECONEX V29.0 — Complete 133-Route Redesign & Category Register

**Product:** ECONEX — Universal Economic Operating System  
**Release:** V29.0-UNIVERSAL-UI-UX-TRANSFORMATION  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.  
**Canonical Registry:** `src/navigation/navigationRegistry.ts` (133 canonical routes preserved with zero deletions)

---

## 1. Category Distribution Summary

| V29 Menu Category | Canonical Route Count | Audience Scope |
| --- | ---: | --- |
| `BUSINESS` | 21 | Permitted Business, Producer, Buyer & Enterprise Roles |
| `TRADE` | 33 | Permitted Trade, Marketplace, Logistics & Procurement Roles |
| `FINANCE` | 13 | Permitted Wallet, Escrow, Invoicing & Treasury Roles |
| `NETWORK` | 16 | Permitted Partner Network, Trust & Intelligence Roles |
| `SUPPORT` | 4 | All Permitted Users |
| `ADMINISTRATION` | 46 | Strictly Admin / Developer Roles Only (`PLATFORM_ADMIN`) |
| **Total Canonical Routes** | **133** | **100% Preserved** |

---

## 2. Complete Canonical Route Register (1–133)

| # | Route ID | Canonical Path | Legacy Label | V29 Plain-Language Label | V29 Category | Audience |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `home` | `/home` | Home | Home | BUSINESS | All Permitted Users |
| 2 | `tasks` | `/tasks` | Notifications & Tasks | Tasks & Action Queue | SUPPORT | All Permitted Users |
| 3 | `messages` | `/messages` | Messages & Alerts | Messages & Alerts | SUPPORT | All Permitted Users |
| 4 | `v22-overview` | `/v22` | Universal Economy Hub (V22) | Universal Economy Hub | BUSINESS | All Permitted Users |
| 5 | `v24-execution-hub` | `/commerce-network` | Commerce Execution Network (V24) | Commerce Execution Network | ADMINISTRATION | Admin / Developer |
| 6 | `v25-command-centre` | `/v25-command-centre` | V25 Command Centre | V25 Command Centre | ADMINISTRATION | Admin / Developer |
| 7 | `v25-enterprise-org` | `/v25-enterprise-org` | V25 Orgs & Identity | V25 Orgs & Identity | ADMINISTRATION | Admin / Developer |
| 8 | `v25-postgres-migration` | `/v25-postgres-migration` | V25 PG16 & Ledger Ops | V25 PG16 & Ledger Ops | ADMINISTRATION | Admin / Developer |
| 9 | `v25-developer-platform` | `/v25-developer-platform` | V25 APIs, Vault & Security | V25 APIs, Vault & Security | ADMINISTRATION | Admin / Developer |
| 10 | `v26-hub` | `/v26-hub` | V26 Activation Command Hub | V26 Activation Command Hub | ADMINISTRATION | Admin / Developer |
| 11 | `v27-network-hub` | `/network/hub` | Universal Economic Network (V27) | Business Network | NETWORK | All Permitted Users |
| 12 | `v27-discover` | `/network/discover` | Network Discovery Search | Discover Counterparties | TRADE | All Permitted Users |
| 13 | `v27-participants` | `/network/participants` | Network Participants Directory | Network Members | NETWORK | All Permitted Users |
| 14 | `v27-relationships` | `/network/relationships` | Network Relationships & Graph | Partner Relationships | NETWORK | All Permitted Users |
| 15 | `v27-opportunities` | `/network/opportunities` | Economic Opportunity Exchange | Opportunity Exchange | TRADE | All Permitted Users |
| 16 | `v27-matching` | `/network/matching` | Explainable Matching Engine | Partner Matching | TRADE | All Permitted Users |
| 17 | `v27-suppliers` | `/network/suppliers` | Supplier Capabilities Directory | Verified Suppliers | TRADE | All Permitted Users |
| 18 | `v27-buyers` | `/network/buyers` | Buyer Requirements & Offtake | Buyer Requirements | TRADE | All Permitted Users |
| 19 | `v27-trust` | `/network/trust` | Trust, Verification & Reputation | Trust & Reputation | NETWORK | All Permitted Users |
| 20 | `v27-analytics` | `/network/analytics` | Network Growth & Outcome Metrics | Network Growth & Outcomes | NETWORK | All Permitted Users |
| 21 | `v27-economic-intelligence` | `/economic-intelligence` | Economic Intelligence Centre (V27) | Sector Market Insights | NETWORK | All Permitted Users |
| 22 | `v27-crm` | `/crm` | Commercial Pipeline, CRM & Promotions | Customer & Deal Pipeline | BUSINESS | All Permitted Users |
| 23 | `v27-pilot-operations` | `/pilot-operations` | Controlled Pilot Operations (V27) | Controlled Pilot Operations | ADMINISTRATION | Admin / Developer |
| 24 | `v27-field-operations` | `/field-operations` | Field Validation & Offline Sync | Field Operations & Checks | TRADE | All Permitted Users |
| 25 | `v27-integration-centre` | `/integration-centre` | Integration & Moderation Governance | Integration & Moderation Governance | ADMINISTRATION | Admin / Developer |
| 26 | `v28-execution-hub` | `/v28/execution` | Universal Execution Hub (V28) | Commercial Execution Desk | TRADE | All Permitted Users |
| 27 | `v28-workspace` | `/v28/workspace` | 18-Section Entity Workspace (V28) | Role Workspace | BUSINESS | All Permitted Users |
| 28 | `v28-contracts` | `/v28/contracts` | Contracts & Milestones (V28) | Contracts & Agreements | TRADE | All Permitted Users |
| 29 | `v28-obligations` | `/v28/obligations` | Contractual Obligations (V28) | Trade Obligations | TRADE | All Permitted Users |
| 30 | `v28-procurement` | `/v28/procurement` | Enterprise Procurement (V28) | Procurement Orders | TRADE | All Permitted Users |
| 31 | `v28-procurement-approvals` | `/v28/procurement/approvals` | Procurement SoD Approvals (V28) | Procurement Approvals | TRADE | All Permitted Users |
| 32 | `v28-fulfilment` | `/v28/fulfilment` | Connected Fulfilment (V28) | Fulfilment & Delivery | TRADE | All Permitted Users |
| 33 | `v28-inventory` | `/v28/inventory` | Inventory Reservations (V28) | Stock & Warehousing | TRADE | All Permitted Users |
| 34 | `v28-cross-border` | `/v28/cross-border` | Cross-Border Operations (V28) | Cross-Border & Customs | TRADE | All Permitted Users |
| 35 | `v28-wallet-coordination` | `/v28/wallet-coordination` | Wallet Coordination & Reversals (V28) | Escrow & Wallet Milestones | FINANCE | All Permitted Users |
| 36 | `v28-interoperability` | `/v28/interoperability` | Interoperability Gateway (V28) | Interoperability Gateway | ADMINISTRATION | Admin / Developer |
| 37 | `v28-events` | `/v28/events` | Domain Events & DLQ Replay (V28) | Domain Events & DLQ Replay | ADMINISTRATION | Admin / Developer |
| 38 | `v28-vault` | `/v28/vault` | Document & Evidence Vault (V28) | Document Vault | NETWORK | All Permitted Users |
| 39 | `v28-intelligence` | `/v28/intelligence` | Continental Intelligence (V28) | Continental Intelligence | ADMINISTRATION | Admin / Developer |
| 40 | `v28-ai-orchestrator` | `/v28/ai` | Guarded AI Orchestrator (V28) | Guarded AI Orchestrator | ADMINISTRATION | Admin / Developer |
| 41 | `v28-control-centre` | `/v28/control-centre` | Continental Ops Control Centre (V28) | Continental Ops Control Centre | ADMINISTRATION | Admin / Developer |
| 42 | `v28-dual-approvals` | `/v28/dual-approvals` | Dual-Approval SoD Desk (V28) | Dual-Approval SoD Desk | ADMINISTRATION | Admin / Developer |
| 43 | `v28-field-offline` | `/v28/field-offline` | Field Offline Sync & Conflicts (V28) | Offline Field Sync | TRADE | All Permitted Users |
| 44 | `v28-security` | `/v28/security` | Security & Truthfulness Governance (V28) | Security & Truthfulness Governance | ADMINISTRATION | Admin / Developer |
| 45 | `v28-repository-health` | `/v28/repository-health` | GitHub & Sync Diagnostics (V28) | GitHub & Sync Diagnostics | ADMINISTRATION | Admin / Developer |
| 46 | `explore` | `/discover` | Explore Marketplace | Explore Marketplace | TRADE | All Permitted Users |
| 47 | `marketplace` | `/marketplace` | Commodity Exchange | Commodities & Bulk Trade | TRADE | All Permitted Users |
| 48 | `discovery-matching` | `/discover/matching` | Supplier & Buyer Matching | Partner Matching | TRADE | All Permitted Users |
| 49 | `opportunities` | `/discover/opportunities` | Economic Opportunities | Opportunities & Tenders | TRADE | All Permitted Users |
| 50 | `v22-discover` | `/discover/economy` | Discover 28+ Sectors (V22) | Economic Sectors (28+) | TRADE | All Permitted Users |
| 51 | `v22-marketplace` | `/marketplace/universal` | Universal Marketplace 2.0 (V22) | Goods & Services Market | TRADE | All Permitted Users |
| 52 | `v24-marketplace-rfq` | `/commerce/marketplace` | Marketplace, RFQs & Agreements (V24) | RFQs & Trade Agreements | TRADE | All Permitted Users |
| 53 | `farmer-simple` | `/agriculture` | Sell & Farm Hub | Producer & Farm Hub | BUSINESS | All Permitted Users |
| 54 | `farmer-ops` | `/agriculture/operations` | Farm Parcels & Cultivation | Farm Parcels & Cultivation | BUSINESS | All Permitted Users |
| 55 | `agro-dealer` | `/agriculture/agro-dealer` | Agro-Inputs & Dealer Desk | Inputs & Equipment | BUSINESS | All Permitted Users |
| 56 | `warehouses` | `/agriculture/warehouses` | Warehouses & Silo Receipts | Warehouses & Storage | BUSINESS | All Permitted Users |
| 57 | `traceability` | `/agriculture/traceability` | Batch Traceability | Batch Traceability | BUSINESS | All Permitted Users |
| 58 | `operations-hub` | `/operations-hub` | Unified Operations Hub (V20) | Unified Operations Hub | ADMINISTRATION | Admin / Developer |
| 59 | `v22-procurement` | `/procurement` | Procurement & Projects (V22) | Procurement & Projects | TRADE | All Permitted Users |
| 60 | `v24-orders-inventory` | `/commerce/orders-inventory` | Orders, ATP Inventory & BOM (V24) | Orders & Stock Inventory | TRADE | All Permitted Users |
| 61 | `activity` | `/trade` | Orders & Trade Activity | My Orders & Activity | TRADE | All Permitted Users |
| 62 | `orders` | `/trade/orders` | Order Lifecycle Console | Order Lifecycle & Delivery | TRADE | All Permitted Users |
| 63 | `buyer-ops` | `/trade/buyer` | Buyer Sourcing Desk | Buyer Sourcing Desk | TRADE | All Permitted Users |
| 64 | `contracts` | `/trade/contracts` | Trade Contracts & RFQs | Trade Contracts & RFQs | TRADE | All Permitted Users |
| 65 | `cross-border` | `/trade/cross-border` | Cross-Border EAC Trade | Cross-Border EAC Trade | TRADE | All Permitted Users |
| 66 | `business-simple` | `/business` | My Business Workspace | My Business | BUSINESS | All Permitted Users |
| 67 | `v22-businesses` | `/businesses` | Businesses, Artisans & Workforce (V22) | Businesses & Skilled Artisans | BUSINESS | All Permitted Users |
| 68 | `dashboard` | `/workspace` | Role Operations Workspace | Operations Workspace | BUSINESS | All Permitted Users |
| 69 | `v26-reports` | `/reports` | Reports, Exports & Document Vault | Reports & Documents | BUSINESS | All Permitted Users |
| 70 | `universal-commerce` | `/business/commerce` | Multi-Sector Commerce | Multi-Sector Commerce | ADMINISTRATION | Admin / Developer |
| 71 | `workflow-orchestration` | `/business/workflows` | Workflow Orchestrator | Workflow Orchestrator | ADMINISTRATION | Admin / Developer |
| 72 | `agreements-automation` | `/business/agreements` | Programmable Agreements | Programmable Agreements | BUSINESS | All Permitted Users |
| 73 | `work-income` | `/work` | Work, Payroll & Services | Work, Payroll & Services | BUSINESS | All Permitted Users |
| 74 | `operations` | `/work/operations` | Operations Execution Center | Operations Execution Center | BUSINESS | All Permitted Users |
| 75 | `v21-field-ops` | `/field-ops` | Field Operations App (V21) | Field Operations | BUSINESS | All Permitted Users |
| 76 | `logistics` | `/logistics` | Logistics & Haulage | Transport & Haulage | TRADE | All Permitted Users |
| 77 | `corridors` | `/logistics/corridors` | Corridor & Border Tracking | Cross-Border Corridors | TRADE | All Permitted Users |
| 78 | `industry` | `/logistics/industry` | Industry & Value Chains | Industry & Value Chains | TRADE | All Permitted Users |
| 79 | `v24-procurement-logistics` | `/commerce/procurement-logistics` | Procurement, Logistics & Projects (V24) | Logistics & Supply Projects | TRADE | All Permitted Users |
| 80 | `v23-wallet` | `/wallet` | Universal Wallet & EUWN (V23) | Universal Wallet | FINANCE | All Permitted Users |
| 81 | `v23-merchant` | `/wallet/merchant` | Merchant QR Acceptance (V23) | Merchant QR Pay | FINANCE | All Permitted Users |
| 82 | `v23-cards` | `/wallet/cards` | ECONEX Cards Infrastructure (V23) | ECONEX Cards | FINANCE | All Permitted Users |
| 83 | `v23-country-network` | `/wallet/network` | Cross-Country Wallet & Gates (V23) | Country & Corridor Network | FINANCE | All Permitted Users |
| 84 | `v23-wallet-admin` | `/wallet/operations-control` | Wallet Risk, Continuity & Schema 21 (V23) | Wallet Risk, Continuity & Schema 21 | ADMINISTRATION | Admin / Developer |
| 85 | `v24-documents-settlement` | `/commerce/documents-execution` | Docs, Wallet Obligations & Execution (V24) | Trade Documents & Settlement | FINANCE | All Permitted Users |
| 86 | `payments` | `/finance` | Payments & Escrow | Payments & Escrow | FINANCE | All Permitted Users |
| 87 | `v22-finance-intel` | `/finance/universal-intelligence` | Invoicing, FX & Growth Intelligence (V22) | Invoicing & Currency Rates | FINANCE | All Permitted Users |
| 88 | `finance` | `/finance/vslas` | VSLAs & Agricultural Finance | VSLAs & Agricultural Finance | FINANCE | All Permitted Users |
| 89 | `money` | `/finance/orchestration` | Money & Multi-Rail Routing | Money & Multi-Rail Routing | FINANCE | All Permitted Users |
| 90 | `universal-money` | `/finance/money` | Universal Money & Currencies | Universal Money & Currencies | FINANCE | All Permitted Users |
| 91 | `accounting-ledger` | `/finance/accounting` | Accounting & General Ledger | Accounting & General Ledger | FINANCE | All Permitted Users |
| 92 | `capital-investment` | `/finance/capital` | Capital & Asset Registry | Capital & Asset Registry | FINANCE | All Permitted Users |
| 93 | `commercial-revenue` | `/finance/revenue` | Billing & Subscriptions | Billing & Subscriptions | ADMINISTRATION | Admin / Developer |
| 94 | `global-treasury` | `/finance/treasury` | Treasury & Reconciliation | Treasury & Reconciliation | ADMINISTRATION | Admin / Developer |
| 95 | `cooperatives` | `/cooperatives` | Cooperative Coordination | Cooperative Coordination | BUSINESS | All Permitted Users |
| 96 | `workspaces` | `/cooperatives/institutions` | Institutional Workspaces | Institutional Workspaces | BUSINESS | All Permitted Users |
| 97 | `public-economy` | `/cooperatives/public-economy` | Public Economy & Tenders | Public Economy & Tenders | BUSINESS | All Permitted Users |
| 98 | `institutional` | `/cooperatives/macro` | Macro & Early Warning (FEWS) | Macro & Early Warning (FEWS) | BUSINESS | All Permitted Users |
| 99 | `economic-network` | `/cooperatives/graph` | Relationship Network Graph | Partner Graph | NETWORK | All Permitted Users |
| 100 | `trust-identity` | `/trust` | Trust, Identity & Verification | Verification & Trust | NETWORK | All Permitted Users |
| 101 | `v21-onboarding` | `/onboarding` | Pilot Onboarding & Verification | Pilot Onboarding & Verification | NETWORK | All Permitted Users |
| 102 | `compliance` | `/trust/compliance` | Compliance Surveillance | Compliance Surveillance | ADMINISTRATION | Admin / Developer |
| 103 | `fraud-jurisdiction` | `/trust/jurisdiction` | Fraud, UBO & Jurisdiction Rules | Fraud, UBO & Jurisdiction Rules | ADMINISTRATION | Admin / Developer |
| 104 | `regional` | `/trust/fx-tenants` | FX Pegs & Country Tenants | FX Pegs & Country Tenants | ADMINISTRATION | Admin / Developer |
| 105 | `prices-simple` | `/intelligence/market-prices` | Market Prices | Market Prices | NETWORK | All Permitted Users |
| 106 | `resilience` | `/intelligence` | Disruptions & Resilience | Disruptions & Resilience | NETWORK | All Permitted Users |
| 107 | `prices` | `/intelligence/price-analytics` | Price Analytics & Series | Price Analytics & Series | NETWORK | All Permitted Users |
| 108 | `ai-engine` | `/intelligence/agri-ai` | Agri Multi-Agent Advisory | Agri Multi-Agent Advisory | NETWORK | All Permitted Users |
| 109 | `universal-intelligence` | `/intelligence/advisory` | 15-Domain Economic Advisory | 15-Domain Economic Advisory | NETWORK | All Permitted Users |
| 110 | `forecasting` | `/intelligence/forecasting` | Price & Demand Forecasting | Price & Demand Forecasting | NETWORK | All Permitted Users |
| 111 | `observatory` | `/intelligence/observatory` | Regional Observatory | Regional Observatory | ADMINISTRATION | Admin / Developer |
| 112 | `global-intelligence` | `/intelligence/global` | Global Intelligence Engine | Global Intelligence Engine | ADMINISTRATION | Admin / Developer |
| 113 | `v18-control-center` | `/network` | Admin Control Centre | Admin Control Centre | ADMINISTRATION | Admin / Developer |
| 114 | `v20-pilots` | `/pilots` | V20 Pilot Control Desk | V20 Pilot Control Desk | ADMINISTRATION | Admin / Developer |
| 115 | `v21-command-centre` | `/command-centre` | V21 Pilot Command Centre | V21 Pilot Command Centre | ADMINISTRATION | Admin / Developer |
| 116 | `v19-diagnostics` | `/v19-diagnostics` | V19 Diagnostics & Delivery | V19 Diagnostics & Delivery | ADMINISTRATION | Admin / Developer |
| 117 | `v17-control-center` | `/v17-control-center` | V17 Network Operations | V17 Network Operations | ADMINISTRATION | Admin / Developer |
| 118 | `v16-control-center` | `/v16-control-center` | V16 Production Readiness | V16 Production Readiness | ADMINISTRATION | Admin / Developer |
| 119 | `global-operations` | `/global-operations` | V15 Control Center | V15 Control Center | ADMINISTRATION | Admin / Developer |
| 120 | `v13-infrastructure` | `/network/infrastructure` | Sovereign Infrastructure (V13) | Sovereign Infrastructure | ADMINISTRATION | Admin / Developer |
| 121 | `universal-overview` | `/network/overview` | Universal Economic Overview | Universal Economic Overview | ADMINISTRATION | Admin / Developer |
| 122 | `global-network` | `/network/scale` | Global Network Scale (V11) | Global Network Scale | ADMINISTRATION | Admin / Developer |
| 123 | `global-execution` | `/network/execution` | Global Execution Engine | Global Execution Engine | ADMINISTRATION | Admin / Developer |
| 124 | `global-federation` | `/network/federation` | Sovereign Federation | Sovereign Federation | ADMINISTRATION | Admin / Developer |
| 125 | `integration-adapters` | `/network/adapters` | Integration Adapters & RTGS | Integration Adapters & RTGS | ADMINISTRATION | Admin / Developer |
| 126 | `events` | `/network/events` | Event Bus & Dead-Letter Queue | Event Bus & Dead-Letter Queue | ADMINISTRATION | Admin / Developer |
| 127 | `developer` | `/network/developer` | Developer APIs & Webhooks | Developer APIs & Webhooks | ADMINISTRATION | Admin / Developer |
| 128 | `performance` | `/network/performance` | Performance & Load Benchmarks | Performance & Load Benchmarks | ADMINISTRATION | Admin / Developer |
| 129 | `admin` | `/network/legacy-admin` | Legacy Admin Console | Legacy Admin Console | ADMINISTRATION | Admin / Developer |
| 130 | `tests` | `/tests` | System Verification Suite | System Verification Suite | ADMINISTRATION | Admin / Developer |
| 131 | `help` | `/support` | Help & Support Centre | Help & Support Centre | SUPPORT | All Permitted Users |
| 132 | `account` | `/settings` | Account & Accessibility | Account & Language | SUPPORT | All Permitted Users |
| 133 | `v26-audit` | `/v26-audit` | Control Audit & Route Inventory | Control Audit & Route Inventory | ADMINISTRATION | Admin / Developer |
