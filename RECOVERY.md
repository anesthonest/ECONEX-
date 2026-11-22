# ECONEX V23.0 — Workspace Recovery & Operational Troubleshooting Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Reopening the Saved Project in Google AI Studio

1. Allow 30–60 seconds on container cold-boot for workspace snapshot hydration.
2. Confirm core workspace files are mounted (`package.json`, `server.ts`, `index.html`, `src/`, `data/`).
3. If the directory appears empty after a container reset or OOM event, reopen the project or send **"Continue"** in AI Studio so the workspace re-hydrates `/app/applet`. Never overwrite an empty workspace with a blank starter template.

---

## 2. Starting the Server & Verifying Schema 21 Integrity

```bash
npm install
npm run dev
```
- The server binds `0.0.0.0:3000` (overridable via `PORT`).
- On upgrade from V22 (Schema 20), `db.ts` preserves a canonical pre-migration rollback snapshot (`data/aros_database.v22.backup.json`) and migrates non-destructively to **Schema 21** (`migrateV20ToV21()`).
- Verify health, readiness & wallet network integrity:
  ```bash
  curl http://localhost:3000/health
  curl http://localhost:3000/ready
  curl http://localhost:3000/api/v23/health
  curl http://localhost:3000/api/v23/readiness-matrix
  ```

---

## 3. Running Verification Suites Safely (Memory-Bounded)

Never run all historical suites concurrently with `vite build`:

```bash
# Run V23 Universal Identity, Wallet Network & Card suite (550 assertions T2401–T2950)
npm run test:v23

# Run V18–V23 release verification gate (1,575 assertions)
npm run verify

# Run sequential historical V11–V23 batches (2,650 CLI assertions)
npm run test:historical
```

---

## 4. Generating Verified ZIP Archives & Preparing Git Push

```bash
npm run security:scan
npm run export:zip
npm run export:check
```

---

## 5. Recovering After a Failed Build or Interrupted Wallet Operation

- **Interrupted Wallet Transfers:** Idempotency keys (`idempotencyKey`) allow safe client retries without duplicate balance debits. Re-run `POST /api/v23/reconciliations/run` and `POST /api/v23/continuity/run` from `/wallet/operations-control` to confirm zero variance.
- **Clean Build Recovery:**
  ```bash
  npm run clean
  npm install
  npm run typecheck
  npm run build:check
  ```
