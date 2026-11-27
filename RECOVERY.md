# ECONEX V27.0 — Workspace Recovery & Operational Troubleshooting Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Reopening the Saved Project in Google AI Studio

1. Allow 30–60 seconds on container cold-boot for workspace snapshot hydration.
2. Confirm core workspace files are mounted (`package.json`, `server.ts`, `index.html`, `src/`, `data/`).
3. Never overwrite an empty directory during snapshot hydration with a starter template.

---

## 2. Starting the Server & Verifying Schema 25 Integrity

```bash
npm install
npm run dev
```
- The server binds `0.0.0.0:3000` (overridable via `PORT`).
- On upgrade from V26 (Schema 24), `db.ts` writes `data/aros_database.v26.backup.json` and migrates non-destructively to **Schema 25**.
- Verify health, readiness, and V27 Economic Network integrity:
  ```bash
  curl http://localhost:3000/health
  curl http://localhost:3000/ready
  curl http://localhost:3000/api/v27/health
  curl http://localhost:3000/api/v27/readiness-matrix
  curl http://localhost:3000/api/v27/migration/backup-verify
  ```

---

## 3. Running Verification Suites Safely (Memory-Bounded)

Never run all historical suites concurrently with `vite build`:

```bash
# Run V27 Economic Network suite (850 assertions T5151–T6000)
npm run test:v27

# Run V18–V27 release verification gate
npm run verify

# Run sequential historical V11–V27 batches (5,700 CLI assertions; 6,000 total incl. UI T01–T300)
npm run test:historical
```

---

## 4. Generating Verified ZIP Archives

```bash
npm run security:scan
npm run export:zip
npm run export:check
```

---

## 5. Clean Build Recovery

```bash
npm run clean
npm install
npm run typecheck
npm run build:check
```
