# ECONEX V28.0 — Performance & Sequential Suite Benchmark

**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

- **Test Orchestration:** `scripts/econex-verify-sequential.mjs` isolates each release suite in its own child Node/TSX process with `--max-old-space-size=448` to avoid memory accumulation.
- **V28 Suite Execution:** `900` live assertions (`T6901–T7800`) complete in ~13–16 seconds at ~190–205 MB RSS against the Express + Vite server.
- **Code Splitting:** All 6 V28 React views are lazy-loaded via `React.lazy(...)` in `src/App.tsx` so initial bundle size remains fast and modular.
