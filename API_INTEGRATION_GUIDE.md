# ECONEX V20 / V21 / V22 / V23 API Integration Guide

**Product:** ECONEX (`V23.0-UNIVERSAL-WALLET-NETWORK`)  
**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Authentication, Tenant Isolation & Tracing Headers

Protected `/api/v20/*`–`/api/v23/*` endpoints require:
- Authentication: `Authorization: Bearer <session_token>` or local development test headers `x-user-id` & `x-user-role`.
- Tenant Boundary: `x-tenant-id` (e.g., `TEN-UG-ELGON-01`). Non-admin mismatches return HTTP `403`.
- Correlation ID: Optional `X-Correlation-Id` request header (echoed/generated on every response).

---

## 2. Public Health, Readiness & Contract Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Container liveness check (`503` during graceful shutdown) |
| `GET` | `/ready` | Schema 21 integrity + balanced double-entry journal check |
| `GET` | `/api/health` | Full release metadata & schema telemetry |
| `GET` | `/api/v23/health` | V23 Wallet Network & Schema 21 probe (`realValueEnabled: false`) |
| `GET` | `/api/v23/openapi.json` | Machine-readable OpenAPI 3.1 specification for V23 |

---

## 3. Core `/api/v23/*` Wallet Network & Card Endpoints

| Domain | Endpoints | Guard / Behavior |
|---|---|---|
| Readiness & Overview | `GET /api/v23/readiness-matrix`, `GET /api/v23/overview` | Authenticated; truthful 12 flags + zero live revenue |
| Identities & EUWN | `GET/POST /api/v23/identities`, `POST /api/v23/identities/:id/portability`, `POST /api/v23/identities/:id/status`, `POST /api/v23/identities/:id/close-retain`, `GET /api/v23/lookup/:euwn` | Rate-limited zero-PII recipient lookup |
| Wallets & Subaccounts | `GET /api/v23/wallets`, `GET /api/v23/wallets/:id`, `POST /api/v23/wallets/:id/subaccounts`, `POST /api/v23/wallets/:id/pin`, `GET /api/v23/wallets/:id/statement` | `403` on `/wallets/:id/balance` & `/subaccounts/:id/balance` |
| FX, Fees & Transfers | `POST /api/v23/fx/preview`, `POST /api/v23/fees/preview`, `GET/POST /api/v23/transactions`, `POST /api/v23/transactions/:id/reverse-or-refund` | PIN required, `idempotencyKey` required, `403` if real-value requested |
| Merchants & QR | `GET/POST /api/v23/merchants`, `GET/POST /api/v23/terminals`, `GET/POST /api/v23/qr`, `POST /api/v23/qr/pay` | HMAC-SHA256 verified QR payloads + digital receipts |
| Cards (Simulated) | `GET /api/v23/cards`, `POST /api/v23/cards/virtual`, `POST /api/v23/cards/virtual/:id/authorize-sim`, `POST /api/v23/cards/physical`, `POST /api/v23/cards/physical/:id/stage` | Strictly `externalNetworkUsable=false`, `schemeCertified=false` |
| Countries & Gates | `GET/POST /api/v23/countries`, `POST /api/v23/countries/:code/toggle-sandbox`, `POST /api/v23/countries/:code/gates` | `PLATFORM_ADMIN` for mutations; `403` on gate bypass |
| Governance, Continuity & PG | `GET/POST /api/v23/offline-queue`, `GET/POST /api/v23/compliance`, `GET /api/v23/risk-events`, `GET /api/v23/audit-events`, `GET/POST /api/v23/support-cases`, `POST /api/v23/integrations/link-payment`, `POST /api/v23/reconciliations/run`, `POST /api/v23/continuity/run`, `POST /api/v23/postgres-audit` | Full continuity drills & Schema 21 audit |

---

## 4. Example V23 Internal Transfer Payload

```json
POST /api/v23/transactions
{
  "sourceWalletId": "WLT-V23-001",
  "destinationEuwn": "EX-3H8N6V2X9C4T",
  "sourceCurrency": "UGX",
  "destinationCurrency": "UGX",
  "amountMinor": 500000,
  "txType": "WALLET_TO_WALLET",
  "purpose": "Sandbox supplier settlement",
  "pin": "2468",
  "idempotencyKey": "EX-IDEM-DEMO-001"
}
```
