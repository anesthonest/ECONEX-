# ECONEX V20–V27 API Integration Guide

**Product:** ECONEX (`V27.0-UNIVERSAL-ECONOMIC-NETWORK`)  
**Developer:** VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Authentication, Tenant/Org Isolation & Tracing Headers

Protected `/api/v20/*`–`/api/v27/*` endpoints enforce:
- Authentication: `Authorization: Bearer <session_token>` or verified dev headers (`x-user-id`, `x-user-role`). Unauthenticated calls to protected V27 endpoints return HTTP `401 AUTHENTICATION_REQUIRED`.
- Tenant & Org Isolation: `x-tenant-id`, `x-org-id`, `x-country-code`. Cross-org, unauthorized `PRIVATE`/`ORG_ONLY` profile access, or privilege escalation attempts return HTTP `403`.
- Correlation ID: `X-Correlation-Id` echoed/generated on every response.

---

## 2. Public Health, Readiness & OpenAPI Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` & `/ready` | Container liveness, Schema 25 integrity & balanced journal readiness |
| `GET` | `/api/v27/health` | V27 Network health, Schema 25 integrity, V26 rollback readiness & collection counts |
| `GET` | `/api/v27/readiness-matrix` | 31 truthful V27 readiness flags (26 active capabilities, 5 live/pilot/cutover flags strictly `false`) |
| `GET` | `/api/v27/openapi.json` | Machine-readable OpenAPI 3.1.0 specification for V27 |
| `GET` | `/api/v27/migration/status` & `/backup-verify` | Schema 25 completeness & V26 rollback backup SHA-256 verification |
| `GET` | `/api/v27/intelligence/countries` | 7-country EAC economic network matrix (`UG, KE, TZ, RW, BI, SS, CD`) |

---

## 3. Core `/api/v27/*` Economic Network Endpoints

| Domain | Endpoints | Guard / Behavior |
|---|---|---|
| Profiles & Privacy | `GET/POST /api/v27/participants`, `GET .../participants/:id`, `PUT .../participants/:id/privacy` | Excludes `PRIVATE`/`ORG_ONLY` profiles from unauthorized viewers (`403` on direct get) and redacts contact PII (`contactPrivacyRedacted: true`) |
| Relationships | `GET/POST /api/v27/relationships`, `POST .../:id/respond`, `PUT .../:id/status` | Rejects self-invites (`400`) & third-party acceptances (`403`); tracks full transition history |
| Verification & Reputation | `GET/POST /api/v27/verification`, `POST .../:id/decision`, `GET/POST /api/v27/reputation/reviews`, `POST .../appeals`, `.../:id/decide` | Separates `USER_SUBMITTED` vs `HUMAN_REVIEWED`; blocks SoD self-approval (`403`), unlinked reviews (`400`), self-reviews (`403`), and duplicates (`409`) |
| Discovery & Matching | `GET /api/v27/discover`, `GET/POST/DELETE /api/v27/saved-searches`, `GET /api/v27/matching/recommendations`, `POST .../matching/feedback` | Privacy-filtered unified search + history; deterministic multi-factor scoring excluding paid promotions (`isPaidPromotionExcluded: true`) |
| Opportunity Exchange | `GET/POST /api/v27/opportunities`, `POST .../:id/status`, `responses`, `award`, `link-obligation` | Blocks same-org self-bids (`403`); links `V27-RFQ-*` & V23 obligation intent (`ledgerMutatedDirectly: false`) |
| Coordination, CRM & Promotions | `/api/v27/buyer-requirements`, `/api/v27/supplier-capabilities`, `/api/v27/crm/leads`, `/api/v27/promotions` | Declared vs verified capacity provenance separation; org-isolated CRM (`403` cross-org); explicit `SPONSORED_PROMOTION` tags |
| Threads & Activity Graph | `GET/POST /api/v27/threads`, `POST .../:id/messages`, `GET /api/v27/graph` | Participant-only thread messaging (`403` outsiders); graph queries enforce target profile privacy (`403`) |
| Intelligence & Guarded AI | `GET /api/v27/intelligence/summary`, `POST /api/v27/intelligence/ai-assist`, `/api/v27/referrals`, `/api/v27/outcomes` | Provenance-tagged metrics; blocks prompt injection (`400`) & autonomous actions (`403`); non-cash referral tracking |
| Pilots, Field & Partners | `/api/v27/pilots`, `/api/v27/field/assignments`, `/api/v27/field/reports`, `/api/v27/partners`, `/api/v27/moderation/cases` | Blocks simulated pilots marked `ACTIVE` (`400`), field report SoD self-approval (`403`), premature partner `LIVE` (`403`) |

---

## 4. Preserved V20–V26 API Contracts

All `/api/v20/*` through `/api/v26/*` routes remain live and backwards-compatible with zero regression.
