# ECONEX V19.0 — Workspace Recovery & Operational Troubleshooting Guide

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Reopening the Saved Project in Google AI Studio

1. Wait up to 30–60 seconds on container cold-boot for workspace snapshot hydration.
2. Confirm core workspace files are mounted (`package.json`, `server.ts`, `index.html`, `src/`, `data/`).
3. If the directory appears empty after a container reset or OOM event, reopen the project or send **"Continue"** in AI Studio so the control plane re-hydrates `/app/applet`. Never overwrite an empty workspace with a blank starter template.

## 2. Inspecting the Project Root & Footprint

```bash
ls -la
du -sh src data data/backups exports dist node_modules 2>/dev/null || true
```

**Why workspace hangs occurred prior to V19:** Unrotated automated test backups inside `data/backups/` grew `data/` to **1.4 GB** across 144 files while `src/` is under **10 MB**. V19 enforces rolling backup rotation (keeping the 3 newest per prefix plus canonical milestone baselines) in `src/server/db.ts` and `src/server/v11Routes.ts`, and excludes `data/` from Vite file watching.

## 3. Starting the Development Server

```bash
npm install
npm run dev
```
- The server binds `0.0.0.0:3000` (overridable via `PORT` or `--port`).
- If `EADDRINUSE` occurs, terminate duplicate processes before restarting:
  ```bash
  curl http://localhost:3000/api/health
  ```

## 4. Running Verification Suites Safely (4 GB Container Safe)

Never execute all historical suites in parallel alongside `vite build`:

```bash
# Step 1: Ensure server is running
npm run dev

# Step 2: Run V18 + V19 integration checks
npm run test:integration

# Step 3: Run sequential historical V11-V19 batches (persists report to .econex-reports/verification-latest.json)
npm run test:historical
```

## 5. Creating & Verifying a Complete Source ZIP Archive

```bash
# Generates exports/ECONEX-V19.0-SOURCE.zip excluding secrets, .env, node_modules, and runtime DB records
npm run export:zip

# Validate archive independently
npm run export:check
```

Authorized `PLATFORM_ADMIN` users can also generate and download `ECONEX-V19.0-SOURCE.zip` directly from the **V19 Diagnostics & Delivery Console** (`/v19-diagnostics`).

## 6. Preparing & Publishing to GitHub

```bash
npm run security:scan
git init
git add .
git status   # Confirm NO .env, NO data/aros_database.json, NO private keys
git commit -m "chore(econex): V19.0 platform stability, recovery, export & delivery readiness"
git branch -M main
git remote add origin <YOUR_PRIVATE_OR_PUBLIC_GITHUB_REPO_URL>
git push -u origin main
```

## 7. Recovering After a Failed Build

```bash
npm run clean
npm install
npm run typecheck
npm run build:check
```
