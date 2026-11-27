# ECONEX V27.0 — Unified Discovery & Explainable Matching Engine

**Product:** ECONEX — Universal Economic Operating System  
**Release:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK`  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Unified Privacy-Respecting Discovery (`/api/v27/discover`)

The unified search index spans verified profiles, economic opportunities, and transparently separated sponsored placements:
- Supports keyword (`q`), `entityScope` (`ALL`, `PARTICIPANTS`, `SUPPLIERS`, `BUYERS`, `OPPORTUNITIES`), `countryCode`, `sectorId`, `verifiedOnly`, `minTrustScore`, and pagination (`page`, `limit`).
- `PRIVATE` and `ORG_ONLY` profiles are omitted for unauthorized callers.
- Every query logs into `v27SearchHistory` and integrates with user-owned `/api/v27/saved-searches`.

## 2. Explainable Weighted Matching (`/api/v27/matching/recommendations`)

Recommendations are deterministic, explainable, and strictly insulated from commercial placements (`isPaidPromotionExcluded: true`):
- **Sector Fit (28%)**: Direct sector vs adjacent corridor compatibility.
- **Country Corridor Fit (22%)**: Domestic vs EAC cross-border alignment.
- **Verification & Trust Weight (26%)**: Verification status and transaction-backed `trustScore`.
- **Capability Capacity Fit (14%)**: Verified/declared capability breadth.
- **Responsiveness (10%)**: Completed transaction frequency.

Every candidate includes `factorBreakdown` and plain-language `explanationFactors`, plus operator feedback persistence (`SAVE`, `ACCEPT`, `REJECT`, `RFQ`, `REPORT`).
