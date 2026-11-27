# ECONEX V28.0 — Security & RBAC Audit

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

- **Authentication Gate:** All protected `/api/v28/*` routes require valid Bearer session or authenticated user context (`401 AUTHENTICATION_REQUIRED`).
- **Segregation of Duties (SoD):**
  - Procurement approval (`POST /api/v28/procurement/requisitions/:id/decide`) blocks requester self-approval (`403`).
  - Dual-approval governance (`POST /api/v28/operations/dual-approvals/:id/decide`) blocks requester self-approval and enforces distinct first & second approvers (`403`).
  - Field conflict resolution (`POST /api/v28/field/offline-records/:id/resolve`) blocks field officer self-resolution (`403`).
- **Prompt Injection & AI Guardrails:** `runGuardedV28AiOrchestration` blocks prompt injection (`400`) and autonomous payment/contract/approval bypass requests (`403`).
- **Document Vault:** Restricts MIME types, hashes contents (`SHA-256`), logs every upload/verification/legal hold, and prevents silent purge under legal hold.
- **Secret Hygiene:** `npm run security:scan` enforces zero hardcoded secrets or live `.env` inclusion in source exports.
