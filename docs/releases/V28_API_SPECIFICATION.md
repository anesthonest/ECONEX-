# ECONEX V28.0 — API Specification Summary (`/api/v28/*`)

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.  
**Live OpenAPI 3.1 Spec:** `GET /api/v28/openapi.json`

## Key Endpoints
- **Health & Readiness:** `GET /api/v28/health`, `GET /api/v28/readiness-matrix`, `GET /api/v28/openapi.json`, `GET /api/v28/migration/status`, `GET /api/v28/migration/backup-verify`
- **Workspace & Executions:** `GET /api/v28/workspace`, `GET|POST /api/v28/executions`, `POST /api/v28/executions/:id/transition`
- **Contracts & Obligations:** `GET|POST /api/v28/contracts`, `POST /api/v28/contracts/:id/transition`, `POST /api/v28/contracts/:id/obligations`
- **Procurement:** `GET /api/v28/procurement`, `POST /api/v28/procurement/plans`, `POST /api/v28/procurement/requisitions`, `POST /api/v28/procurement/requisitions/:id/decide`, `POST /api/v28/procurement/requisitions/:id/evaluate`
- **Fulfilment & Cross-Border:** `GET /api/v28/fulfilment`, `POST /api/v28/fulfilment/reserve`, `POST /api/v28/fulfilment/:id/record`, `GET|POST /api/v28/cross-border`
- **Wallet Coordination:** `GET /api/v28/wallet/coordination`, `POST /api/v28/wallet/transfer`, `POST /api/v28/wallet/reverse/:txId`
- **Interoperability & Events:** `GET /api/v28/interoperability/connectors`, `POST /api/v28/interoperability/connectors/:id/transition`, `POST /api/v28/interoperability/webhook-sign`, `GET /api/v28/events`, `POST /api/v28/events/dlq/:id/replay`
- **Vault, Intelligence & AI:** `GET|POST /api/v28/vault/documents`, `POST /api/v28/vault/documents/:id/governance`, `GET /api/v28/intelligence/continental`, `POST /api/v28/ai/orchestrate`, `GET /api/v28/ai/runs`
- **Operations, Field & Repo Health:** `GET /api/v28/operations/control-centre`, `POST /api/v28/operations/exceptions/:id/resolve`, `POST /api/v28/operations/dual-approvals`, `POST /api/v28/operations/dual-approvals/:id/decide`, `GET|POST /api/v28/field/offline-records`, `POST /api/v28/field/offline-records/:id/resolve`, `GET /api/v28/developer/repository-health`
