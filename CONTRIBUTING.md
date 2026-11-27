# Contributing to ECONEX — Universal Economic Operating System

Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

## Core Engineering Rules
1. **Attribution & Truthfulness**: Preserve VINEXSAH TECHNOLOGIES attribution. Keep infrastructure honesty flags (`POSTGRESQL_CUTOVER_COMPLETE`, `EXTERNAL_INTEGRATIONS_LIVE`, `REAL_VALUE_WALLET_OPERATIONS_ENABLED`, `CARD_SCHEME_CERTIFICATION_COMPLETE`, `HUMAN_FIELD_VALIDATION_COMPLETE`, `PILOT_ACTIVE`, `PRODUCTION_DEPLOYED`, `GITHUB_REMOTE_SYNC_VERIFIED`, `AI_STUDIO_GITHUB_BINDING_VERIFIED`) strictly accurate.
2. **Additive Schema Evolution**: Never overwrite or downgrade existing schema versions or financial ledger balances. Always create verified backups prior to migration.
3. **Zero-Secret Hygiene**: Never commit `.env`, API keys, OAuth secrets, `data/aros_database.json`, `data/backups/`, `data/v25_vault/`, or `exports/`.
4. **Verification Gate**: Run `npm run typecheck`, `npm run security:scan`, `npm run build`, `npm run test:v28`, and `npm run export:zip && npm run export:check` before submitting changes.

## Recovering AI Studio GitHub Sync Safely
See `docs/engineering/GITHUB_SYNC_AND_AI_STUDIO_RCA.md` and `docs/engineering/SAFE_SYNC_CHECKLIST.md`.
