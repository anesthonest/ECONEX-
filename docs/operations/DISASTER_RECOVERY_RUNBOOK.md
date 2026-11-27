# ECONEX V28.0 — Disaster Recovery Runbook

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

1. **Authoritative Snapshot & WAL:**
   - Primary WAL: `data/aros_database.json`
   - Immutable Pre-V28 Snapshot: `data/aros_database.v27.backup.json` (SHA-256 `9f081339e5bb8dda0760b18bf650976a3a31bbf03a510d5bca0287141e52c748`).
2. **Rollback Procedure to Schema 25 (V27):**
   - Stop the Node.js server (`server.ts`).
   - Verify SHA-256 of `data/aros_database.v27.backup.json`.
   - Restore backup cleanly to `data/aros_database.json` and switch checkout to V27 tag if reverting code.
3. **Recovery Verification:**
   - Call `GET /api/v28/migration/backup-verify` and `GET /api/v28/health` to confirm integrity and zero-variance ledger balance.
