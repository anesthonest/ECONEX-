# ECONEX V27.0 — Trust & Reputation Framework

**Product:** ECONEX — Universal Economic Operating System  
**Release:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK`  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Evidence-Backed Verification Provenance

Every verification record and profile badge explicitly separates self-declared submissions from independent confirmation:
- `USER_SUBMITTED` / `USER_DECLARED`: Initial state on participant submission (`SUBMITTED`). Cannot transition directly to `VERIFIED`.
- `SYSTEM_VALIDATED`: Automated schema or cross-record consistency validation.
- `HUMAN_REVIEWED` / `THIRD_PARTY_VERIFIED`: Required provenance for `VERIFIED` status. Non-administrators receive `403 ADMIN_VERIFICATION_REVIEW_REQUIRED`, and submitters cannot approve their own dossier (`403 SELF_VERIFICATION_APPROVAL_BLOCKED`, enforcing Segregation of Duties).

## 2. Anti-Fraud Reputation & Appeals

- **Mandatory Transaction Link (`submitReputationReview`)**: Reviews require an existing `linkedOrderId` (`orders`, `v24Orders`, or awarded V27 opportunity order reference) or `linkedContractId`. Unlinked or fabricated references fail with `400`.
- **Anti-Self-Review & Anti-Duplicate**: Self-reviews return `403 SELF_REVIEW_FORBIDDEN`, and repeat reviews by the same actor for the same target and transaction fail with `409 DUPLICATE_TRANSACTION_REVIEW_FORBIDDEN`.
- **Moderation & Appeals (`fileReputationAppeal` / `decideReputationAppeal`)**: Reviewed participants can appeal reviews (`DISPUTED`), and administrators resolve appeals (`UPHELD_REMOVED` or `REJECTED_KEPT`) with automatic trust score recalculation.
- **Zero Commercial Bias**: Paid promotions (`v27PaidPromotions`) are strictly excluded from `recalculateProfileTrustScore`.
