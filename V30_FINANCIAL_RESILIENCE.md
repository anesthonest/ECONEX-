# ECONEX V30.0 — FINANCIAL RESILIENCE, CORRIDORS, AGENTS & USSD

**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Cross-Border Corridors & Transparent FX (8 Corridors)

- **Corridors Seeded:** `UG->KE`, `UG->TZ`, `UG->RW`, `UG->CD`, `UG->SS`, `UG->NG`, `UG->ZA`, `KE->RW`.
- Every corridor records `indicativeFxRate`, `econexTargetFeeBps` (135–190 bps), `legacyComparisonFeeBps` (450–650 bps), `settlementWindowMinutes`, and `regulatoryStatus` (`LICENSED_PARTNER_REQUIRED`), paired with an explicit indicative-rate disclaimer.

## 2. Cash-In / Cash-Out Agents & TTL Liquidity Intelligence

- **8 Verified Agent Profiles** across Kampala (Owino, Kikuubo), Mbale, Gulu, Jinja, Mbarara, Wakiso, and Nairobi.
- **TTL-Bounded Liquidity Reports (`POST /api/v30/liquidity/report`):** Captures `cashAvailableBand` (`HIGH` / `MODERATE` / `LOW` / `DEPLETED`), `floatAvailableBand`, `maxSinglePayoutMinor`, reporter provenance, and 6-hour `freshnessExpiresAt` expiration so users do not travel to out-of-cash kiosks.

## 3. Offline `*284#` USSD Sandbox Adapter

- `POST /api/v30/ussd/simulate` models feature-phone access for balance checks (`*284*1#`), offline queued send intents (`*284*2*<recipient>*<amount>#`), and nearest cash agent lookup (`*284*3#`).
- Enforces `*284` prefix validation (`HTTP 400` otherwise) and sets `adapterMode: 'SIMULATED_USSD_ADAPTER'` alongside `LIVE_USSD_CARRIER_CONNECTED: false`.

## 4. Phase-B Engineering Repair Register (`v30_repair_register`)

Tracks 5 verified code-level repairs including Gemini 429 quota protection, Schema 26->27 seamless migration, zero-double-debit failover accounting, safe-directory Git diagnostics, and test-harness forward compatibility.
