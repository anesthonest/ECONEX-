# ECONEX V27.0 — Economic Opportunity Exchange & Commercial Coordination Guide

**Product:** ECONEX — Universal Economic Operating System  
**Release:** `V27.0-UNIVERSAL-ECONOMIC-NETWORK`  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Opportunity Lifecycle (`/api/v27/opportunities`)

1. **Creation (`DRAFT` or `OPEN`)**: Participants publish `BUY_REQUEST`, `SUPPLY_OFFER`, `LOGISTICS_CONTRACT`, `SERVICES_TENDER`, or `FINANCING_REQUEST` opportunities across multi-sector EAC corridors.
2. **Proposals (`/responses`)**: Counterparties outside the creator's organisation submit structured bids (`proposedAmountMinor`, `currency`, `deliveryTimelineDays`). Same-org self-bidding is blocked (`403 SELF_RESPONSE_SAME_ORG_BLOCKED`).
3. **Award & RFQ Linkage (`/award`)**: Creator or admin awards the winning proposal (`AWARDED`), generates a linked `V27-RFQ-*` reference, and transitions non-selected open proposals to `DECLINED`.
4. **Wallet Obligation Linkage (`/link-obligation`)**: Records a `V27-OBL-*` settlement intent inside `v24SettlementIntents` requiring dual approval (`ledgerMutatedDirectly: false`), ensuring AI or exchange endpoints never directly debit/credit internal wallet balances.

## 2. Buyer Requirements, Supplier Capabilities & Org-Isolated CRM

- **Provenance Separation**: Supplier capabilities track `declaredCapacityProvenance: 'USER_DECLARED'` separately from `verifiedCapacityProvenance` (`UNVERIFIED` until admin/auditor sign-off).
- **Org-Isolated CRM (`/api/v27/crm/leads`)**: Tracks leads across `NEW -> QUALIFIED -> PROPOSAL -> NEGOTIATION -> WON / LOST`. Cross-organisation mutations fail with `403 CROSS_ORG_CRM_ACCESS_FORBIDDEN`.
- **Sponsored Promotions**: Always carry `promotionLabel: 'SPONSORED_PROMOTION'` with `affectsOrganicTrustScore: false` and `affectsSearchReputationRanking: false`.
