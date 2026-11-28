# ECONEX V30.0 — SECURITY, RBAC, SoD & FRAUD CONTROLS

**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Authentication, RBAC & Tenant Isolation

- Protected `/api/v30/*` routes resolve actor identity via `resolveV30Ctx(req)` and return `HTTP 401 AUTHENTICATION_REQUIRED` when unauthenticated.
- Administrative operations (provider health transitions, payment reversals, reconciliation resolution, dispute mediation, fraud review, regulatory evidence submission, AI fault test hooks) enforce `PLATFORM_ADMIN` authorization (`HTTP 403`).

## 2. 4-Eye Segregation of Duties (SoD) in Business Finance

`POST /api/v30/business-finance/:id/decide` blocks:
- Cross-organisation approvals (`403 FORBIDDEN_ORG_ISOLATION`)
- Requester self-approval (`doc.requesterUserId === ctx.userId` -> `403 SOD_SELF_APPROVAL_BLOCKED`)

## 3. Velocity Fraud Detection & Human-Review Guarantee

- Transactions >= `5,000,000` minor UGX automatically emit a `V30FraudRiskEvent` (`status: 'OPEN_REVIEW'`, `humanReviewRequired: true`).
- **No Unsupervised Account Bans:** Automated threshold checks never permanently freeze funds or close accounts unilaterally; a human Platform Administrator reviews via `POST /api/v30/fraud-events/:id/review` (`CLEARED`, `BLOCKED_CONFIRMED`, `FALSE_POSITIVE`).
- **Webhook Integrity:** `POST /api/v30/webhooks/hmac-verify` verifies SHA-256 HMAC signatures (`sha256=...`).
- **Secret Hygiene:** Enforced by `npm run security:scan` (`scripts/econex-secret-scan.mjs`) and `.gitignore`.
