# ECONEX V28.0 — Safe Source Export & Sync Checklist

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

- [ ] Run `npm run lint` (`tsc --noEmit`) with 0 errors.
- [ ] Run `npm run build` (`vite build`) cleanly.
- [ ] Run `npm run security:scan` — confirm 0 leaked secrets and 0 forbidden `.env` files.
- [ ] Run `npm run test:v28` (`900/900` assertions passing) and `npm run verify`.
- [ ] Run `npm run export:zip && npm run export:check` to build and SHA-256 verify `exports/ECONEX-V28.0-SOURCE.zip`.
- [ ] Confirm `/api/v28/developer/repository-health` shows `missingIgnoreRules: []` and `missingEngineeringDocs: []`.
- [ ] Verify all 9 mandatory honesty flags remain `false`.
- [ ] Push verified source from authenticated workstation remote; never claim remote sync verified from inside the sandbox.
