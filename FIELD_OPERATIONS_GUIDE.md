# ECONEX V27.0 — Field Validation & Offline Sync Operations Guide

**Product:** ECONEX — Universal Economic Operating System  
**Release:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK`  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Field Officer Assignments & Offline Synchronization (`/api/v27/field/*`)

- **Assignments**: Administrators and cooperative admins create field verification tasks (`COOPERATIVE_AUDIT`, `FACILITY_INSPECT`, `ONBOARDING_VERIFY`) assigned to field officers (`usr_agro_01`).
- **Idempotent Offline Sync**: Mobile/field reports include an `offlineClientId` and GPS source classification (`UNAVAILABLE`, `DEVICE_GPS`, `MANUAL_ENTRY`). Replaying the same `offlineClientId` returns the persisted record cleanly without duplicating submissions.
- **Segregation of Duties (SoD)**: Supervisor review (`/api/v27/field/reports/:id/review`) requires `PLATFORM_ADMIN` privileges and rejects self-approval (`403 FIELD_REPORT_SELF_APPROVAL_BLOCKED`) whenever the reviewer is the submitting field officer.
- **Truthful Readiness Flag**: `V27_FIELD_VALIDATION_COMPLETE` remains `false` until verified real-world physical cohort validation closes.
