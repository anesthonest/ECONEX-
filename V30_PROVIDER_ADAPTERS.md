# ECONEX V30.0 — PROVIDER ADAPTERS & HEALTH STATE MACHINE

**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Registered Provider-Neutral Adapters (13 Providers)

| Provider ID | Category | Countries | Integration Status | Default Health |
|---|---|---|---|---|
| `PRV-MTN-MOMO-UG` | `MOBILE_MONEY` | UG | `PARTNER_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-AIRTEL-MONEY-UG` | `MOBILE_MONEY` | UG, KE, TZ, RW | `PARTNER_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-MPESA-KE` | `MOBILE_MONEY` | KE, TZ | `CREDENTIALS_REQUIRED` | `HEALTHY` |
| `PRV-STANBIC-UG` | `COMMERCIAL_BANK` | UG, KE, TZ, ZA | `PARTNER_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-CENTENARY-UG` | `COMMERCIAL_BANK` | UG | `PARTNER_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-BOU-RTGS-CLR` | `CENTRAL_BANK_RTGS` | UG | `REGULATORY_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-PESALINK-EAC` | `INSTANT_INTERBANK_SWITCH` | KE | `PARTNER_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-FLUTTERWAVE-AF` | `PAYMENT_GATEWAY` | UG, KE, TZ, RW, NG, ZA | `CREDENTIALS_REQUIRED` | `HEALTHY` |
| `PRV-PAYSTACK-AF` | `PAYMENT_GATEWAY` | KE, NG, ZA | `CREDENTIALS_REQUIRED` | `HEALTHY` |
| `PRV-REMIT-CORRIDOR` | `REMITTANCE_RAIL` | UG, KE, TZ, RW, CD, SS, NG, ZA | `REGULATORY_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-CARD-SCHEME-GATE` | `CARD_SCHEME_GATEWAY` | UG, KE, TZ, RW, NG, ZA | `PARTNER_APPROVAL_REQUIRED` | `HEALTHY` |
| `PRV-COOP-SACCO-HUB` | `COOPERATIVE_SACCO_LEDGER` | UG, KE, TZ, RW | `SANDBOX_ACTIVE` | `HEALTHY` |
| `PRV-DIGITAL-ASSET-GATE` | `DIGITAL_ASSET_GATE` | UG, KE | `REGULATORY_APPROVAL_REQUIRED` | `DOWN` (Strictly Gated) |

## 2. Outage & Recovery Controls

- Only `PLATFORM_ADMIN` can transition provider health (`POST /api/v30/providers/:id/health`); non-admin callers receive `HTTP 403`.
- Promoting `PRV-DIGITAL-ASSET-GATE` to `HEALTHY` is blocked with `HTTP 403 DIGITAL_ASSET_GATE_RESTRICTED`.
- When a provider enters `DOWN`, `CIRCUIT_OPEN`, or `MAINTENANCE`, `evaluateSmartRouting()` immediately excludes it and selects the next healthiest rail.
- All health transitions append immutable audit telemetry to `v30_provider_health_events`.
