# ECONEX V30.0 — AI GOVERNANCE & GEMINI QUOTA RESILIENCE

**Developed under VINEXSAH TECHNOLOGIES. All rights reserved.**

## 1. Root Cause Fixed (`src/server/gemini.ts`)

Earlier preview traffic could trigger repeated `429 RESOURCE_EXHAUSTED` quota storms when identical advisory prompts retried or fired repeatedly without shared cooldown state. V30 hardens `safeGenerateGeminiText` across every call site:
1. **SHA-256 In-Flight Deduplication:** Identical concurrent requests share a single upstream promise (`DEDUP_HIT`).
2. **Bounded Non-Sensitive Cache:** Max 120 entries, 5-minute TTL (`CACHE_HIT`).
3. **Fault Classification Taxonomy:**
   - `QUOTA_429` (`429` / `RESOURCE_EXHAUSTED`): **0 retries**, parses server `retryDelay`, activates process-wide cooldown circuit breaker (`COOLDOWN_FALLBACK`), logs compact single summary per 60s.
   - `AUTH_ERROR` (`401`/`403`/`404`/`API_KEY_INVALID`): **0 retries**, 10-minute cooldown, clear server secret diagnostic without leaking credentials.
   - `UPSTREAM_5XX` / `TIMEOUT`: bounded to **`<= 2` jittered retries** before deterministic fallback.
4. **Admin Fault-Injection Verification (`POST /api/v30/ai/test-fault-mode`):** `PLATFORM_ADMIN`-only test harness verifying `HTTP_429` cooldown activation, `COOLDOWN_FALLBACK`, `HTTP_503` -> `RECOVER_OK` recovery, `INVALID_CREDENTIALS`, and `RESET`.

## 2. Guarded Financial AI Policy (`POST /api/v30/ai/advise`)

- Blocks prompt-injection patterns (`detectPromptInjection`) and autonomous execution commands (`execute payment`, `transfer funds now`, `bypass approval`, `release escrow automatically`, `override fraud`) with **`HTTP 403 AI_AUTONOMOUS_EXECUTION_BLOCKED`**.
- Every advisory response explicitly sets `humanApprovalRequired: true` and `autonomousExecutionBlocked: true`.
