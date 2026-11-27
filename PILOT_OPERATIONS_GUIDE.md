# ECONEX V27.0 — Controlled Pilot Operations Guide

**Product:** ECONEX — Universal Economic Operating System  
**Release:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK`  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Pilot Lifecycle & Truthful Status Gating

ECONEX manages pilot programmes (`V27-PILOT-UG-01`, `V27-PILOT-KE-CORRIDOR-02`) through `/api/v27/pilots` with strict honesty controls:
- Any pilot marked `isSimulatedEnvironment: true` or with incomplete physical field/partner checklist items is blocked from transitioning to `ACTIVE` (`400 SIMULATED_PILOT_CANNOT_BE_MARKED_ACTIVE` / `PILOT_CHECKLIST_INCOMPLETE_FOR_ACTIVE`).
- In `/api/v27/readiness-matrix`, `V27_PILOT_ACTIVE` remains strictly `false` until real non-simulated pilot validation and sign-off are completed.
- Admins can track enrolled participants (`ENROLLED`, `ONBOARDED`, `TRANSACTING`), readiness checklists, and cohort outcome telemetry (`ACTUAL` vs `SIMULATED`).
