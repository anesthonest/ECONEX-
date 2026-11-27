# ECONEX V28.0 — Incident Response Playbook

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

1. **Triage via Ops Control Centre:** Inspect `/v28/control-centre` (`GET /api/v28/operations/control-centre`) as `PLATFORM_ADMIN` for open exceptions, DLQ backlogs, and offline field sync conflicts.
2. **Dead-Letter Event Recovery:** Inspect failure reason on `V28-DLQ-*`, validate external connector credentials/health, and replay safely via `POST /api/v28/events/dlq/:id/replay`.
3. **Wallet Ledger Anomaly:** Do NOT mutate raw JSON balances; issue an audited compensating reversal via `POST /api/v28/wallet/reverse/:txId`.
4. **Legal Hold & Evidence Preservation:** Toggle `ENABLE_LEGAL_HOLD` on implicated documents in `/v28/vault` to block premature deletion or alteration.
