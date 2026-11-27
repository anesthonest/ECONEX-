# ECONEX V28.0 — Monitoring & Observability Guide

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

- **Health & Integrity:** `/api/health`, `/api/v28/health`, `/api/v28/migration/status`
- **Readiness & Honesty Flags:** `/api/v28/readiness-matrix`
- **Event & DLQ Stream:** `/api/v28/events` (tracks `DISPATCHED`, `ACKNOWLEDGED`, `RETRYING`, `DEAD_LETTER`)
- **AI Safety Counters:** `/api/v28/intelligence/continental` exposes `totalRuns`, `blockedInjections`, `blockedAutonomousRequests`, `liveModelCalls`, `deterministicFallbacks`.
- **Repository & Export Hygiene:** `/api/v28/developer/repository-health` monitors `.gitignore`, `.github/workflows/*`, `data/` footprint, and `ECONEX-V28.0-SOURCE.zip`.
