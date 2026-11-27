# ECONEX V27.0 — Zero-Trust Security, Network Privacy & Trust Integrity

**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Zero-Trust Identity, Sessions & Network Privacy

- **Session & Header Auth:** Protected `/api/v25/*`, `/api/v26/*`, and `/api/v27/*` routes enforce authenticated identity (`401 AUTHENTICATION_REQUIRED` when missing).
- **Participant Profile Privacy (`canViewProfile` / `sanitizeProfileForViewer`):** `PRIVATE` and `ORG_ONLY` profiles are omitted from unauthorized search/listings (`403 PROFILE_PRIVACY_FORBIDDEN` on direct lookup), and phone/email/NIN fields are redacted (`contactPrivacyRedacted: true`) for unrelated viewers.
- **Organisation & Participant Isolation:** CRM leads (`403 CROSS_ORG_CRM_ACCESS_FORBIDDEN`), messaging threads (`403 FORBIDDEN_THREAD_PARTICIPANT_ONLY`), and saved search deletions enforce strict caller ownership.

---

## 2. Anti-Fraud Verification, Reputation & Segregation of Duties (SoD)

- **Verification Approval SoD:** Non-admins cannot approve verifications (`403 ADMIN_VERIFICATION_REVIEW_REQUIRED`), submitters cannot approve their own dossier (`403 SELF_VERIFICATION_APPROVAL_BLOCKED`), and `VERIFIED` status rejects `USER_SUBMITTED` provenance (`400`).
- **Field Officer SoD:** Supervisors cannot approve their own offline field inspection reports (`403 FIELD_REPORT_SELF_APPROVAL_BLOCKED`).
- **Transaction-Linked Reviews:** Reviews require real order/contract linkage (`400`), block self-reviews (`403`), and block duplicates (`409`).
- **Partner Live Gating:** `LIVE` integration partner promotion requires all 4 independent verifications (`credentialsConfigured`, `regulatoryApprovalVerified`, `contractualSignoffVerified`, `securityAuditPassed`) or returns `403`.

---

## 3. Guarded AI & Secret Hygiene

- `executeV27NetworkAiAssist` rejects prompt injections (`400 PROMPT_INJECTION_BLOCKED`) and autonomous execution commands (`403 AUTONOMOUS_EXECUTION_BLOCKED`), always setting `canExecuteAutonomousAction: false` and `requiresHumanConfirmation: true`.
- `npm run security:scan` enforces zero embedded API keys, private keys, or `.env` leaks before export.
