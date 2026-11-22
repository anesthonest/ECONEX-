#!/usr/bin/env node
/**
 * ECONEX V19.0 - Memory-Safe Sequential Verification Orchestrator
 * Executes test batches sequentially with heap limits, timing, RSS tracking, and JSON report persistence.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, '.econex-reports');
const REPORT_FILE = path.join(REPORT_DIR, 'verification-latest.json');
const BASE_URL = process.env.ECONEX_TEST_BASE_URL || 'http://localhost:3000';

const BATCH_SPECS = [
  {
    batchId: 'BATCH_C_V11_V13',
    label: 'V11–V13 Network Scale, Economic Intelligence & Distributed Infrastructure',
    suites: [
      { id: 'V11', file: './src/components/modules/v11VerificationTests.ts', fn: 'runV11VerificationTests', passBase: false },
      { id: 'V12', file: './src/components/modules/v12IntelligenceVerificationTests.ts', fn: 'runV12VerificationTests', passBase: false },
      { id: 'V13', file: './src/components/modules/v13InfrastructureVerificationTests.ts', fn: 'runV13VerificationTests', passBase: false },
    ],
  },
  {
    batchId: 'BATCH_D_V14_V15',
    label: 'V14–V15 Global Operations & Activation',
    suites: [
      { id: 'V14', file: './src/components/modules/v14OperationsVerificationTests.ts', fn: 'runV14VerificationTests', passBase: false },
      { id: 'V15', file: './src/components/modules/v15ActivationVerificationTests.ts', fn: 'runV15VerificationTests', passBase: false },
    ],
  },
  {
    batchId: 'BATCH_E_V151_V159',
    label: 'V15.1–V15.9 Human-Centred UX & Platform Consolidation',
    suites: [
      { id: 'V15.1', file: './src/components/modules/v151UxVerificationTests.ts', fn: 'runV151UxVerificationTests', passBase: false },
      { id: 'V15.9', file: './src/components/modules/v159ConsolidationTests.ts', fn: 'runV159ConsolidationTests', passBase: false },
    ],
  },
  {
    batchId: 'BATCH_F_V16',
    label: 'V16 Production Infrastructure & Uganda Pilot Readiness',
    suites: [
      { id: 'V16', file: './src/components/modules/v16OperationsTests.ts', fn: 'runV16OperationsTests', passBase: false },
    ],
  },
  {
    batchId: 'BATCH_G_V17',
    label: 'V17 Verified Economic Network Operations',
    suites: [
      { id: 'V17', file: './src/components/modules/v17NetworkOperationsTests.ts', fn: 'runV17VerificationTests', passBase: true },
    ],
  },
  {
    batchId: 'BATCH_H_V18',
    label: 'V18 Complete System Navigation & Consolidation (T1376–T1475)',
    suites: [
      { id: 'V18', file: './src/components/modules/v18ConsolidationTests.ts', fn: 'runV18VerificationTests', passBase: true },
    ],
  },
  {
    batchId: 'BATCH_I_V19',
    label: 'V19 Platform Stability, Export, Recovery & Deployment Readiness (T1476–T1525)',
    suites: [
      { id: 'V19', file: './src/components/modules/v19StabilityTests.ts', fn: 'runV19VerificationTests', passBase: true },
    ],
  },
  {
    batchId: 'BATCH_J_V20',
    label: 'V20 Unified Economic Operations, Continental Network Activation & Market Execution (T1526–T1725)',
    suites: [
      { id: 'V20', file: './src/components/modules/v20UnifiedOperationsTests.ts', fn: 'runV20VerificationTests', passBase: true },
    ],
  },
  {
    batchId: 'BATCH_K_V21',
    label: 'V21 Controlled Pilot Deployment, Field Operations & Commercial Activation (T1726–T2000)',
    suites: [
      { id: 'V21', file: './src/components/modules/v21PilotOperationsTests.ts', fn: 'runV21VerificationTests', passBase: true },
    ],
  },
  {
    batchId: 'BATCH_L_V22',
    label: 'V22 Universal Economic Activity & Growth Engine (T2001–T2400)',
    suites: [
      { id: 'V22', file: './src/components/modules/v22UniversalEconomyTests.ts', fn: 'runV22VerificationTests', passBase: true },
    ],
  },
  {
    batchId: 'BATCH_M_V23',
    label: 'V23 Universal Economic Identity, Wallet Network & Card Infrastructure (T2401–T2950)',
    suites: [
      { id: 'V23', file: './src/components/modules/v23WalletNetworkTests.ts', fn: 'runV23VerificationTests', passBase: true },
    ],
  },
];

function runSingleSuiteIsolated(suite) {
  const runnerScript = `
    (async () => {
      const BASE = ${JSON.stringify(BASE_URL)};
      const origFetch = globalThis.fetch.bind(globalThis);
      globalThis.fetch = ((input, init) =>
        typeof input === 'string' && input.startsWith('/') ? origFetch(BASE + input, init) : origFetch(input, init));
      const mod = await import(${JSON.stringify(path.resolve(ROOT, suite.file))});
      const runFn = mod[${JSON.stringify(suite.fn)}];
      const failures = [];
      const upd = (id, status, _d, _m, err) => {
        if (status === 'FAILED') failures.push({ id, error: String(err || 'Failed') });
      };
      const t0 = Date.now();
      const res = await (${suite.passBase ? 'runFn(upd, BASE)' : 'runFn(upd)'});
      const mem = process.memoryUsage();
      console.log('__ECONEX_SUITE_RESULT__=' + JSON.stringify({
        suite: ${JSON.stringify(suite.id)},
        passed: res.passed,
        failed: res.failed,
        durationMs: Date.now() - t0,
        rssMb: Number((mem.rss / (1024 * 1024)).toFixed(1)),
        heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(1)),
        failures,
      }));
    })().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  `;

  const proc = spawnSync('npx', ['tsx', '-e', runnerScript], {
    cwd: ROOT,
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=448' },
    encoding: 'utf8',
    timeout: 420_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const combined = `${proc.stdout || ''}\n${proc.stderr || ''}`;
  const line = combined
    .split('\n')
    .find((l) => l.startsWith('__ECONEX_SUITE_RESULT__='));

  if (!line || proc.status !== 0) {
    return {
      suite: suite.id,
      status: proc.signal ? 'CANCELLED_OR_TIMEOUT' : 'FAILED',
      passed: 0,
      failed: 1,
      durationMs: 0,
      rssMb: 0,
      heapUsedMb: 0,
      failures: [{ id: suite.id, error: (proc.stderr || proc.error?.message || `Exit status ${proc.status}`).slice(0, 400) }],
    };
  }

  const parsed = JSON.parse(line.replace('__ECONEX_SUITE_RESULT__=', ''));
  return {
    ...parsed,
    status: parsed.failed === 0 ? 'PASSED' : 'FAILED',
  };
}

function parseRequestedBatches() {
  const arg = process.argv.find((a) => a.startsWith('--batch='));
  const val = arg ? arg.split('=')[1].toUpperCase() : 'V23';
  if (val === 'ALL') return BATCH_SPECS;
  if (val === 'VERIFY') return BATCH_SPECS.filter((b) => ['BATCH_H_V18', 'BATCH_I_V19', 'BATCH_J_V20', 'BATCH_K_V21', 'BATCH_L_V22', 'BATCH_M_V23'].includes(b.batchId));
  if (val === 'UNIT') return BATCH_SPECS.filter((b) => ['BATCH_E_V151_V159', 'BATCH_I_V19', 'BATCH_K_V21', 'BATCH_L_V22', 'BATCH_M_V23'].includes(b.batchId));

  const tokens = val.split(',').map((t) => t.trim());
  const selected = [];
  for (const b of BATCH_SPECS) {
    const filteredSuites = b.suites.filter((s) => tokens.includes(s.id.toUpperCase()));
    if (filteredSuites.length > 0) {
      selected.push({ ...b, suites: filteredSuites });
    }
  }
  return selected.length > 0 ? selected : BATCH_SPECS.filter((b) => b.batchId === 'BATCH_M_V23');
}

async function main() {
  try {
    const h = await fetch(`${BASE_URL}/api/health`);
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
  } catch (err) {
    console.error(`[ECONEX VERIFY] Server at ${BASE_URL} is not reachable (${err?.message || err}). Start server with \`npm run dev\` first.`);
    process.exit(1);
  }

  const batches = parseRequestedBatches();
  const startedAt = new Date().toISOString();
  const suiteResults = [];

  for (const batch of batches) {
    console.log(`\n[ECONEX VERIFY] Running ${batch.batchId}: ${batch.label}`);
    for (const suite of batch.suites) {
      const result = runSingleSuiteIsolated(suite);
      suiteResults.push({ batchId: batch.batchId, ...result });
      console.log(
        `  -> ${result.suite}: status=${result.status} passed=${result.passed} failed=${result.failed} (${result.durationMs}ms, rss=${result.rssMb}MB)`
      );
      if (result.failures?.length) {
        for (const f of result.failures) {
          console.log(`     FAIL ${f.id}: ${f.error}`);
        }
      }
    }
  }

  const totalPassed = suiteResults.reduce((acc, s) => acc + s.passed, 0);
  const totalFailed = suiteResults.reduce((acc, s) => acc + s.failed, 0);

  const report = {
    release: 'V23.0-UNIVERSAL-WALLET-NETWORK',
    baseUrl: BASE_URL,
    executedAt: startedAt,
    completedAt: new Date().toISOString(),
    totalPassed,
    totalFailed,
    overallStatus: totalFailed === 0 ? 'PASSED' : 'FAILED',
    suites: suiteResults,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n[ECONEX VERIFY] Summary saved to .econex-reports/verification-latest.json | Passed=${totalPassed} Failed=${totalFailed}`);
  process.exit(totalFailed === 0 ? 0 : 1);
}

main();
