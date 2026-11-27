# ECONEX V27.0 — Network & Platform Operations Runbook

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Routine Health, Readiness & Audit Checks

1. Check container liveness: `GET /health` & `GET /api/v27/health` → `200 OK` (`schemaVersion: 25`, `schema25IntegrityValid: true`, `v26RollbackReady: true`)
2. Check Schema 25 + ledger parity: `GET /ready` → `200 OK`
3. Inspect the 31-flag readiness matrix (`GET /api/v27/readiness-matrix`): confirm all 5 non-live/cutover flags remain strictly `false` in sandbox (`V27_PILOT_ACTIVE`, `V27_FIELD_VALIDATION_COMPLETE`, `V27_EXTERNAL_INTEGRATIONS_LIVE`, `V27_POSTGRESQL_CUTOVER_COMPLETE`, `V27_PRODUCTION_DEPLOYED`).
4. Verify zero dead controls via `GET /api/v26/audit/controls` (`IMPLEMENTED_NOT_VERIFIED === 0`) and `/v26-audit`.

---

## 2. Trust, Field Validation, Pilot & Partner Operations

- **Verification & Reputation Appeals:** Admins adjudicate submitted verification dossiers (`POST /api/v27/verification/:id/decision`) with `HUMAN_REVIEWED`/`THIRD_PARTY_VERIFIED` provenance and review appeals (`POST /api/v27/reputation/appeals/:id/decide`). Self-approval returns `403`.
- **Field Officer Sync & SoD:** Offline reports sync idempotently via `offlineClientId`; supervisor review enforces `officerUserId !== reviewerUserId`.
- **Pilot Programmes & Partner Governance:** Simulated pilots cannot transition to `ACTIVE` (`400 SIMULATED_PILOT_CANNOT_BE_MARKED_ACTIVE`), and integration partners cannot transition to `LIVE` without all 4 governance gates (`403`).

---

## 3. Transactional Outbox, Jobs & Moderation Response

- Monitor `GET /api/v25/outbox/events` for `DEAD_LETTER` items and replay via `POST /api/v25/outbox/dlq/:id/replay`.
- Execute spend-lock verification (`POST /api/v25/ledger/concurrency-proof`) and backup DR drills (`POST /api/v25/resilience/backup-drill`).
- Adjudicate trust moderation cases (`POST /api/v27/moderation/cases/:id/decide`) and process appeals cleanly.
