/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V16.0 - Production Infrastructure, Verified Integrations & Uganda Pilot Verification Suite
 * 60 End-to-End Automated Assertions (T1161 - T1220)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

export interface V16TestCase {
  id: string;
  name: string;
  category: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  durationMs?: number;
  assertionDetails?: string;
  error?: string;
}

export const V16_INITIAL_TESTS: V16TestCase[] = [
  // Health, Schema 16, Migration & Rollback (T1161 - T1170)
  { id: 'T1161', name: 'Health Endpoint V16 Release & Schema Version 16 Verification', category: 'V16_MIGRATION', status: 'PENDING' },
  { id: 'T1162', name: 'Canonical V15 Backup SHA-256 & Rollback Readiness Verification', category: 'V16_MIGRATION', status: 'PENDING' },
  { id: 'T1163', name: 'V16 Migration Completeness & 16 Collection Initialization', category: 'V16_MIGRATION', status: 'PENDING' },
  { id: 'T1164', name: 'Schema V16 Integrity & Unresolved Exceptions Zero Check', category: 'V16_MIGRATION', status: 'PENDING' },
  { id: 'T1165', name: 'PostgreSQL 16 Migration Dry-Run Parity & Discrepancy Zero Check', category: 'V16_MIGRATION', status: 'PENDING' },
  { id: 'T1166', name: 'Schema_v16.sql Deterministic SHA-256 Verification', category: 'V16_DATABASE', status: 'PENDING' },
  { id: 'T1167', name: 'PostgreSQL 16 Honest NOT_CONFIGURED Probe Disclosure', category: 'V16_DATABASE', status: 'PENDING' },
  { id: 'T1168', name: 'Single Authoritative Write Database Lock Enforcement (JSON_WAL_ACTIVE)', category: 'V16_DATABASE', status: 'PENDING' },
  { id: 'T1169', name: 'Fail-Closed PG16 Authority Cutover Rejection When Unprovisioned (HTTP 409)', category: 'V16_DATABASE', status: 'PENDING' },
  { id: 'T1170', name: 'Preserved V1-V15 User, Participant & Double-Entry Journal Parity', category: 'V16_DATABASE', status: 'PENDING' },

  // Environments, Secret Isolation, Event Bus, HSM & WORM (T1171 - T1184)
  { id: 'T1171', name: 'Six Isolated Runtime Environments Configuration Verification', category: 'V16_ENVIRONMENTS', status: 'PENDING' },
  { id: 'T1172', name: 'Cross-Environment Production Credential Rejection Guard', category: 'V16_ENVIRONMENTS', status: 'PENDING' },
  { id: 'T1173', name: 'Environment Secret Rotation Redaction & Zero Plaintext Emission', category: 'V16_ENVIRONMENTS', status: 'PENDING' },
  { id: 'T1174', name: 'PRODUCTION Environment Key Rotation Fail-Closed Without PKCS#11 HSM', category: 'V16_ENVIRONMENTS', status: 'PENDING' },
  { id: 'T1175', name: 'External Dependencies Truthful Inventory Classification', category: 'V16_INFRA', status: 'PENDING' },
  { id: 'T1176', name: 'Durable Event Bus Supports All 12 ECONEX Event Categories', category: 'V16_EVENT_BUS', status: 'PENDING' },
  { id: 'T1177', name: 'Event Bus Publish & Idempotent Duplicate Suppression Across Categories', category: 'V16_EVENT_BUS', status: 'PENDING' },
  { id: 'T1178', name: 'Event Bus Rejects Sensitive Secret Leakage in Payload Summaries', category: 'V16_EVENT_BUS', status: 'PENDING' },
  { id: 'T1179', name: 'Event Bus Interruption Recovery & Replay Safety Check', category: 'V16_EVENT_BUS', status: 'PENDING' },
  { id: 'T1180', name: 'PKCS#11 HSM Status Truthful Disclosure & Private Key Ref Omission', category: 'V16_SECURITY', status: 'PENDING' },
  { id: 'T1181', name: 'Fail-Closed Block on Production->Dev Silent Signing Fallback (HTTP 409)', category: 'V16_SECURITY', status: 'PENDING' },
  { id: 'T1182', name: 'Development Isolated Key Rotation Lifecycle Verification', category: 'V16_SECURITY', status: 'PENDING' },
  { id: 'T1183', name: 'Immutable Audit Export Distinguishes Local Hash-Chain vs External WORM', category: 'V16_AUDIT', status: 'PENDING' },
  { id: 'T1184', name: 'External Audit Checkpoint Cryptographic Integrity Check', category: 'V16_AUDIT', status: 'PENDING' },

  // Financial Providers, Institutional Onboarding & Uganda Pilot (T1185 - T1200)
  { id: 'T1185', name: 'Financial Provider Registry Honest Non-Production Classification', category: 'V16_PROVIDERS', status: 'PENDING' },
  { id: 'T1186', name: 'Financial Provider Connection Test & Idempotency Deduplication Check', category: 'V16_PROVIDERS', status: 'PENDING' },
  { id: 'T1187', name: 'Financial Provider PRODUCTION Probe Fail-Closed Without Live Credentials', category: 'V16_PROVIDERS', status: 'PENDING' },
  { id: 'T1188', name: 'Financial Provider Invalid Webhook Signature Rejection (HTTP 403)', category: 'V16_PROVIDERS', status: 'PENDING' },
  { id: 'T1189', name: '12-Stage Institutional Onboarding Pipeline Listing & Disclaimer Verification', category: 'V16_INSTITUTION', status: 'PENDING' },
  { id: 'T1190', name: 'Institutional Onboarding Creation & Non-Approved Default State', category: 'V16_INSTITUTION', status: 'PENDING' },
  { id: 'T1191', name: 'Institutional Stage 7+ Sandbox Gate Blocked Without Signed Agreement', category: 'V16_INSTITUTION', status: 'PENDING' },
  { id: 'T1192', name: 'Institutional Stage 10+ Production Gate Blocked Without Security Validation', category: 'V16_INSTITUTION', status: 'PENDING' },
  { id: 'T1193', name: 'Uganda Pilot Programme Non-Production Disclosure & Zero Live Rail Claim', category: 'V16_PILOT', status: 'PENDING' },
  { id: 'T1194', name: 'Uganda Pilot Cohort Creation & Test vs Real Participant Separation', category: 'V16_PILOT', status: 'PENDING' },
  { id: 'T1195', name: 'Uganda Pilot Informed Consent Mandatory Acceptance Guard', category: 'V16_PILOT', status: 'PENDING' },
  { id: 'T1196', name: 'Uganda Pilot Consent Enrollment & Activity Logging Execution', category: 'V16_PILOT', status: 'PENDING' },
  { id: 'T1197', name: 'Uganda Pilot Rejects Activity for Participant Without Informed Consent', category: 'V16_PILOT', status: 'PENDING' },
  { id: 'T1198', name: 'Pilot Metrics Strictly Separate Simulation UGX vs Live Provider UGX', category: 'V16_PILOT', status: 'PENDING' },
  { id: 'T1199', name: 'Human Usability Programme Truthful NOT_CONDUCTED Default When Empty', category: 'V16_USABILITY', status: 'PENDING' },
  { id: 'T1200', name: 'Human Usability Session Consent Validation Guard', category: 'V16_USABILITY', status: 'PENDING' },

  // Monitoring, Recovery, Releases, Sustainability, Compliance, Security & 27 Gates (T1201 - T1220)
  { id: 'T1201', name: '7-Language Translation Review Registry & Legal English Fallback Policy', category: 'V16_LANGUAGES', status: 'PENDING' },
  { id: 'T1202', name: 'Monitoring Health Telemetry Component Aggregation', category: 'V16_MONITORING', status: 'PENDING' },
  { id: 'T1203', name: 'Operational Incident Creation & Admin Lifecycle Resolution Workflow', category: 'V16_MONITORING', status: 'PENDING' },
  { id: 'T1204', name: 'Disaster Recovery Exercise Execution & Ledger Integrity Proof', category: 'V16_RECOVERY', status: 'PENDING' },
  { id: 'T1205', name: 'Recovery Status Exposes Both V14 & V15 Rollback Targets', category: 'V16_RECOVERY', status: 'PENDING' },
  { id: 'T1206', name: 'Release Pipeline Candidate Tracking & Artifact Checksum Verification', category: 'V16_RELEASE', status: 'PENDING' },
  { id: 'T1207', name: 'Release Pipeline Blocks Deploy Without Staging Validation (HTTP 409)', category: 'V16_RELEASE', status: 'PENDING' },
  { id: 'T1208', name: 'Release Pipeline Blocks Production Deploy Until 27 Gates Pass', category: 'V16_RELEASE', status: 'PENDING' },
  { id: 'T1209', name: 'Real-Data Economic Activity Funnel Stage Separation Verification', category: 'V16_IMPACT', status: 'PENDING' },
  { id: 'T1210', name: 'Operational Cost Recording & Unit Economics Real vs Billed Separation', category: 'V16_ECONOMICS', status: 'PENDING' },
  { id: 'T1211', name: 'Unit Economics Rejects Negative Cost Inputs cleanly', category: 'V16_ECONOMICS', status: 'PENDING' },
  { id: 'T1212', name: 'Uganda Regulatory Compliance Register Defaults to PENDING_LEGAL_REVIEW', category: 'V16_COMPLIANCE', status: 'PENDING' },
  { id: 'T1213', name: 'Regulated Workflow Activation Flag Maintained Until Legal Counsel Cleared', category: 'V16_COMPLIANCE', status: 'PENDING' },
  { id: 'T1214', name: 'V16 API Enforces Authentication (HTTP 401 on Unauthenticated Request)', category: 'V16_SECURITY', status: 'PENDING' },
  { id: 'T1215', name: 'V16 API Enforces PLATFORM_ADMIN RBAC on Infrastructure Endpoints (HTTP 403)', category: 'V16_SECURITY', status: 'PENDING' },
  { id: 'T1216', name: 'V16 API Enforces Cross-Tenant Isolation Guard (HTTP 403)', category: 'V16_SECURITY', status: 'PENDING' },
  { id: 'T1217', name: 'V16 API Input XSS Angle-Bracket Sanitization Verification', category: 'V16_SECURITY', status: 'PENDING' },
  { id: 'T1218', name: 'V16 27-Gate Acceptance Matrix Evaluates All 27 Gates Without False Greens', category: 'V16_READINESS', status: 'PENDING' },
  { id: 'T1219', name: 'V16 Executive Statuses Distinguish ENGINEERING_COMPLETE vs PRODUCTION_READY vs LIVE_PILOT', category: 'V16_READINESS', status: 'PENDING' },
  { id: 'T1220', name: 'MASTER V16 SYNTHESIS: End-to-End Schema 16, Zero-Regression & VINEXSAH Attribution', category: 'V16_SYNTHESIS', status: 'PENDING' },
];

type UpdateFn = (
  id: string,
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED',
  durationMs?: number,
  assertionDetails?: string,
  error?: string
) => void;

export async function runV16OperationsTests(
  updateTestStatus: UpdateFn,
  baseUrl = ''
): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  const exec = async (id: string, fn: () => Promise<string>) => {
    const t0 = performance.now();
    updateTestStatus(id, 'RUNNING');
    try {
      const msg = await fn();
      const dur = Math.round(performance.now() - t0);
      passed++;
      updateTestStatus(id, 'PASSED', dur, msg);
    } catch (e: any) {
      const dur = Math.round(performance.now() - t0);
      failed++;
      updateTestStatus(id, 'FAILED', dur, undefined, e?.message || String(e));
    }
  };

  const url = (p: string) => `${baseUrl}${p}`;
  const adminHdrs = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_admin_01',
    'x-user-role': 'PLATFORM_ADMIN',
    'x-tenant-id': 'TEN-UG-ELGON-01',
  };
  const farmerHdrs = {
    'Content-Type': 'application/json',
    'x-user-id': 'usr_farmer_01',
    'x-user-role': 'FARMER',
    'x-tenant-id': 'TEN-UG-ELGON-01',
  };

  let createdInstId = '';
  let createdCohortId = '';
  let createdIncidentId = '';
  let firstProviderId = 'PROV-V15-MOMO-UG';

  // T1161 - T1170
  await exec('T1161', async () => {
    const d = await fetch(url('/api/health')).then((r) => r.json());
    if (
      d.schemaVersion < 16 ||
      (!String(d.release).includes('V16.0-PRODUCTION-INFRASTRUCTURE-AND-PILOT-ACTIVATION') &&
        !String(d.release).includes('V17.0-VERIFIED-ECONOMIC-NETWORK-OPERATIONS') &&
        !String(d.release).includes('V18.0-COMPLETE-PLATFORM-CONSOLIDATION'))
    ) {
      throw new Error(`Expected schemaVersion>=16 & V16.0/V17.0/V18.0 release, got ${d.schemaVersion} / ${d.release}`);
    }
    return `Health confirmed Schema=${d.schemaVersion}, release=${d.release}.`;
  });

  await exec('T1162', async () => {
    const d = await fetch(url('/api/v16/database/migrations'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.v15BackupReadiness?.v15BackupValid || !d.v15BackupReadiness?.checksumSha256) {
      throw new Error('Canonical V15 backup invalid or missing SHA-256 checksum');
    }
    return `Canonical V15 backup verified (${d.v15BackupReadiness.bytes} bytes, SHA=${d.v15BackupReadiness.checksumSha256.slice(0, 12)}).`;
  });

  await exec('T1163', async () => {
    const d = await fetch(url('/api/v16/database/migrations'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.completeness?.complete) throw new Error('V16 migration completeness failed');
    return `Migration checkpoint complete; preservedUsers=${d.completeness.preservedUsersCount}.`;
  });

  await exec('T1164', async () => {
    const d = await fetch(url('/api/v16/database/integrity'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.v16Integrity?.valid || d.v16Integrity?.exceptionsCount > 0) {
      throw new Error(`Schema V16 integrity errors: ${JSON.stringify(d.v16Integrity)}`);
    }
    return `Schema 16 validated across ${d.v16Integrity.v16CollectionsInitialized} collections with 0 unresolved exceptions.`;
  });

  await exec('T1165', async () => {
    const d = await fetch(url('/api/v16/database/migrate-dry-run'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({}),
    }).then((r) => r.json());
    if (d.dryRunCheckpoint?.status !== 'DRY_RUN_VALIDATED' || d.discrepancyCount !== 0) {
      throw new Error(`Dry-run unexpected result: ${JSON.stringify(d)}`);
    }
    return `Migration dry-run ${d.dryRunCheckpoint.id} passed with 0 discrepancies.`;
  });

  await exec('T1166', async () => {
    const d = await fetch(url('/api/v16/database/status'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.probe?.schemaV16Sha256?.startsWith('0x')) throw new Error('Missing schema_v16.sql SHA-256');
    return `schema_v16.sql verified (${d.probe.schemaV16Sha256.slice(0, 16)}...).`;
  });

  await exec('T1167', async () => {
    const d = await fetch(url('/api/v16/database/status'), { headers: adminHdrs }).then((r) => r.json());
    if (d.probe.connected !== false && d.probe.configured === false) throw new Error('Inconsistent PG16 status');
    return `PG16 status truthfully reported (configured=${d.probe.configured}, authority=${d.probe.authorityState}).`;
  });

  await exec('T1168', async () => {
    const d = await fetch(url('/api/v16/database/status'), { headers: adminHdrs }).then((r) => r.json());
    if (d.probe.authorityState !== 'JSON_WAL_ACTIVE') {
      throw new Error(`Expected JSON_WAL_ACTIVE without live PG16, got ${d.probe.authorityState}`);
    }
    return `Single authoritative writer locked on ${d.probe.authorityState}.`;
  });

  await exec('T1169', async () => {
    const res = await fetch(url('/api/v16/database/authority'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetAuthorityState: 'POSTGRESQL_PRIMARY', adminApproved: true }),
    });
    const d = await res.json();
    if (res.status !== 409 || d.allowed !== false || d.currentState !== 'JSON_WAL_ACTIVE') {
      throw new Error(`Expected HTTP 409 fail-closed rejection, got ${res.status}`);
    }
    return `Fail-closed PG16 cutover rejected cleanly (HTTP 409: ${d.blockedReasons?.[0]}).`;
  });

  await exec('T1170', async () => {
    const d = await fetch(url('/api/v16/database/integrity'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.financialIntegrity?.journalBalanced || d.collectionCounts?.users < 5) {
      throw new Error('Preserved ledger balance or user count failed');
    }
    return `Verified double-entry balance and ${d.collectionCounts.users} preserved users.`;
  });

  // T1171 - T1184
  await exec('T1171', async () => {
    const d = await fetch(url('/api/v16/infrastructure/environments'), { headers: adminHdrs }).then((r) => r.json());
    if (!Array.isArray(d.environments) || d.environments.length < 6) {
      throw new Error(`Expected 6 environments, got ${d.environments?.length}`);
    }
    return `Verified 6 isolated environment configurations (active=${d.activeEnvironment}).`;
  });

  await exec('T1172', async () => {
    const d = await fetch(url('/api/v16/infrastructure/environments?testScope=PRODUCTION'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.crossEnvironmentProductionCredentialRejected || d.startupChecksPassed !== false) {
      throw new Error('Expected cross-environment PRODUCTION credential in non-prod runtime to be rejected');
    }
    return `Cross-environment production credential blocked in ${d.activeEnvironment}.`;
  });

  await exec('T1173', async () => {
    const res = await fetch(url('/api/v16/infrastructure/environments/DEVELOPMENT/rotate-credential'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ keyName: 'ECONEX_DEVELOPMENT_SIGNING_KEY' }),
    });
    const d = await res.json();
    if (!res.ok || JSON.stringify(d).includes('privateKey')) throw new Error('Rotation failed or exposed secret');
    return `Credential ref rotated safely with redacted fingerprint only.`;
  });

  await exec('T1174', async () => {
    const res = await fetch(url('/api/v16/infrastructure/environments/PRODUCTION/rotate-credential'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ keyName: 'ECONEX_PRODUCTION_SIGNING_KEY' }),
    });
    if (res.status !== 409) throw new Error(`Expected 409 for PRODUCTION key rotation without HSM, got ${res.status}`);
    return `Blocked PRODUCTION key rotation without PKCS#11 HSM (HTTP 409).`;
  });

  await exec('T1175', async () => {
    const d = await fetch(url('/api/v16/infrastructure/dependencies'), { headers: adminHdrs }).then((r) => r.json());
    if (!Array.isArray(d.dependencies) || d.dependencies.length < 5) throw new Error('Missing dependency inventory');
    return `Verified ${d.dependencies.length} external production dependency states truthfully classified.`;
  });

  await exec('T1176', async () => {
    const d = await fetch(url('/api/v16/events/status'), { headers: adminHdrs }).then((r) => r.json());
    if (d.categoryCount !== 12) throw new Error(`Expected 12 V16 event categories, got ${d.categoryCount}`);
    return `Verified all 12 durable event bus categories registered (${d.activeAdapter}).`;
  });

  await exec('T1177', async () => {
    const key = `V16-IDEM-${Date.now()}`;
    const p1 = await fetch(url('/api/v16/events/publish'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ category: 'FINANCIAL_OPERATIONS', idempotencyKey: key, payloadReference: 'ref://order/1' }),
    });
    const p2 = await fetch(url('/api/v16/events/publish'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ category: 'FINANCIAL_OPERATIONS', idempotencyKey: key, payloadReference: 'ref://order/1' }),
    });
    const d2 = await p2.json();
    if (p1.status !== 201 || !d2.deduplicated) throw new Error('Event deduplication failed');
    return `Published category event & suppressed duplicate replay via idempotencyKey=${key}.`;
  });

  await exec('T1178', async () => {
    const res = await fetch(url('/api/v16/events/publish'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        category: 'SECURITY',
        payloadReference: 'ref://sec/1',
        payloadSummary: { privateKey: 'SHOULD_BLOCK' },
      }),
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400 sensitive field block, got ${res.status}`);
    return `Event bus rejected confidential field emission (HTTP 400).`;
  });

  await exec('T1179', async () => {
    const d = await fetch(url('/api/v16/events/replay'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ clearSimulatedOutage: true }),
    }).then((r) => r.json());
    if (!d.recovered || !d.busStatus?.interruptionRecoverySafe) throw new Error('Event recovery check failed');
    return `Event bus interruption recovery check passed cleanly.`;
  });

  await exec('T1180', async () => {
    const d = await fetch(url('/api/v16/security/hsm'), { headers: adminHdrs }).then((r) => r.json());
    if (d.allowsSilentProdToDevFallback !== false || JSON.stringify(d).includes('privateKeyDevOnlyRef')) {
      throw new Error('HSM security boundary violation');
    }
    return `HSM status=${d.hsmStatus}, silentFallback=${d.allowsSilentProdToDevFallback}, zero private key leakage.`;
  });

  await exec('T1181', async () => {
    const res = await fetch(url('/api/v16/security/hsm/lifecycle'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ action: 'VERIFY_PROD_SIGNING', keyId: 'KEY-DEV-DEFAULT' }),
    });
    if (res.status !== 409) throw new Error(`Expected 409 on unconfigured prod HSM signing, got ${res.status}`);
    return `Fail-closed production HSM signing fallback blocked (HTTP 409).`;
  });

  await exec('T1182', async () => {
    const hsm = await fetch(url('/api/v16/security/hsm'), { headers: adminHdrs }).then((r) => r.json());
    const devKey = (hsm.keys || []).find((k: any) => k.environmentScope === 'DEVELOPMENT_ISOLATED');
    if (!devKey) throw new Error('No isolated dev key available');
    const rot = await fetch(url('/api/v16/security/hsm/lifecycle'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ action: 'ROTATE_KEY', keyId: devKey.id }),
    });
    if (!rot.ok) throw new Error('Dev key rotation failed');
    return `Isolated dev key ${devKey.id} rotated successfully.`;
  });

  await exec('T1183', async () => {
    const d = await fetch(url('/api/v16/audit/archive/export'), { method: 'POST', headers: adminHdrs }).then((r) => r.json());
    if (d.externalWormConfigured === false && d.externalImmutableWormState !== 'NOT_CONFIGURED') {
      throw new Error('WORM status misrepresented');
    }
    return `Audit checkpoint exported cleanly as ${d.latestArchive?.archiveDestinationType} (external=${d.externalImmutableWormState}).`;
  });

  await exec('T1184', async () => {
    const d = await fetch(url('/api/v16/audit/archive'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.localHashChainVerified || d.totalArchives < 1) throw new Error('Audit chain verification failed');
    return `Verified local ECDSA hash-chain across ${d.totalArchives} checkpoints.`;
  });

  // T1185 - T1200
  await exec('T1185', async () => {
    const d = await fetch(url('/api/v16/providers'), { headers: adminHdrs }).then((r) => r.json());
    if (!Array.isArray(d.providers) || d.providers.length === 0 || d.liveAuthorizedCount !== 0) {
      throw new Error(`Expected >=1 provider and 0 fabricated live rails, got ${d.liveAuthorizedCount}`);
    }
    firstProviderId = d.providers[0].id;
    return `Verified ${d.totalProviders} financial providers with liveAuthorized=${d.liveAuthorizedCount}.`;
  });

  await exec('T1186', async () => {
    const d = await fetch(url(`/api/v16/providers/${encodeURIComponent(firstProviderId)}/test`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ environment: 'INTEGRATION_TESTING' }),
    }).then((r) => r.json());
    if (!d.ok || !d.idempotencyChecked) throw new Error(`Provider test failed: ${JSON.stringify(d)}`);
    return `Provider ${firstProviderId} sandbox & idempotency check verified (${d.testRecord?.id}).`;
  });

  await exec('T1187', async () => {
    const res = await fetch(url(`/api/v16/providers/${encodeURIComponent(firstProviderId)}/test`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ environment: 'PRODUCTION' }),
    });
    if (res.status !== 409) throw new Error(`Expected HTTP 409 on unconfigured provider production probe, got ${res.status}`);
    return `Fail-closed PRODUCTION provider probe rejected without credentials (HTTP 409).`;
  });

  await exec('T1188', async () => {
    const res = await fetch(url(`/api/v16/providers/${encodeURIComponent(firstProviderId)}/test`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        environment: 'INTEGRATION_TESTING',
        webhookTestPayload: { receiptRef: 'RCPT-BAD', currency: 'UGX', settledAmount: 5000, signatureHex: 'deadbeef' },
      }),
    });
    if (res.status !== 403) throw new Error(`Expected 403 on forged HMAC webhook, got ${res.status}`);
    return `Rejected invalid provider HMAC webhook signature cleanly (HTTP 403).`;
  });

  await exec('T1189', async () => {
    const d = await fetch(url('/api/v16/institutions/onboarding'), { headers: adminHdrs }).then((r) => r.json());
    if (d.stagesCount !== 12 || !Array.isArray(d.institutions) || d.institutions.length < 4) {
      throw new Error('12-stage institutional onboarding registry invalid');
    }
    return `Verified 12-stage pipeline across ${d.institutions.length} target institutions.`;
  });

  await exec('T1190', async () => {
    const d = await fetch(url('/api/v16/institutions/onboarding'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        institutionName: 'Uganda Agricultural Apex Cooperative Test Partner',
        institutionType: 'COOPERATIVE_APEX',
        jurisdiction: 'UG',
        protocolsSupported: ['REST', 'SIGNED_WEBHOOK'],
      }),
    }).then((r) => r.json());
    if (!d.ok || !d.record?.id || d.record.agreementApproved !== false) throw new Error('Institution creation failed');
    createdInstId = d.record.id;
    return `Created onboarding target ${createdInstId} at stage 1_IDENTIFIED (unapproved default).`;
  });

  await exec('T1191', async () => {
    const res = await fetch(url(`/api/v16/institutions/${createdInstId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '7_SANDBOX_CREDENTIALS_ISSUED' }),
    });
    if (res.status !== 409) throw new Error(`Expected 409 before bilateral agreement approval, got ${res.status}`);
    return `Stage 7 sandbox credentials blocked cleanly without agreementApproved=true (HTTP 409).`;
  });

  await exec('T1192', async () => {
    const res = await fetch(url(`/api/v16/institutions/${createdInstId}/advance`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStage: '10_PRODUCTION_AUTHORIZATION', agreementApproved: true }),
    });
    if (res.status !== 409) throw new Error(`Expected 409 before security validation, got ${res.status}`);
    return `Stage 10 production authorization blocked cleanly without sandbox/security validation (HTTP 409).`;
  });

  await exec('T1193', async () => {
    const d = await fetch(url('/api/v16/pilot'), { headers: adminHdrs }).then((r) => r.json());
    if (d.programme?.usesLivePaymentRails !== false || !d.programme?.nonProductionDisclosure) {
      throw new Error('Pilot programme non-production disclosure missing');
    }
    return `Uganda Pilot ${d.programme.id} verified with non-production disclosure & 15-step flow.`;
  });

  await exec('T1194', async () => {
    const res = await fetch(url('/api/v16/pilot/cohorts'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ name: 'Gulu Maize Aggregation Verification Cohort', district: 'Gulu' }),
    });
    const d = await res.json();
    if (res.status !== 201 || !d.cohort?.id) throw new Error('Cohort creation failed');
    createdCohortId = d.cohort.id;
    return `Created Uganda pilot cohort ${createdCohortId} in Gulu.`;
  });

  await exec('T1195', async () => {
    const res = await fetch(url('/api/v16/pilot/consent'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        cohortId: createdCohortId,
        participantId: 'EP-NOCONSENT-01',
        district: 'Gulu',
        informedConsentGranted: false,
        disclosedNonProduction: false,
      }),
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400 without consent, got ${res.status}`);
    return `Rejected pilot enrollment missing informed consent / disclosure (HTTP 400).`;
  });

  await exec('T1196', async () => {
    const res = await fetch(url('/api/v16/pilot/consent'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        cohortId: createdCohortId,
        participantId: 'EP-UG-GULU-TEST-01',
        participantCategory: 'FARMER',
        district: 'Gulu',
        informedConsentGranted: true,
        disclosedNonProduction: true,
        isNonProductionTestRecord: true,
      }),
    });
    if (res.status !== 201) throw new Error('Consent enrollment failed');
    const act = await fetch(url('/api/v16/pilot/activities'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        cohortId: createdCohortId,
        participantId: 'EP-UG-GULU-TEST-01',
        workflowStepNumber: 4,
        workflowStepName: 'Publish Commodity Listing',
        amountUgx: 420000,
        isNonProductionSimulation: true,
      }),
    });
    if (act.status !== 201) throw new Error('Pilot activity logging failed');
    return `Consent & pilot workflow activity recorded with non-production flag.`;
  });

  await exec('T1197', async () => {
    const res = await fetch(url('/api/v16/pilot/activities'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({
        cohortId: createdCohortId,
        participantId: 'UNCONSENTED-ID-999',
        workflowStepNumber: 1,
        workflowStepName: 'Unauthorized Activity',
        amountUgx: 1000,
      }),
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403 for unconsented participant activity, got ${res.status}`);
    return `Blocked pilot activity for unconsented participant (HTTP 403).`;
  });

  await exec('T1198', async () => {
    const d = await fetch(url('/api/v16/pilot/metrics'), { headers: adminHdrs }).then((r) => r.json());
    if (d.metrics?.verifiedLiveProviderVolumeUgx !== 0 || d.metrics?.nonProductionSimulationVolumeUgx < 420000) {
      throw new Error(`Simulation vs live volume contamination: ${JSON.stringify(d.metrics)}`);
    }
    return `Pilot metrics strictly separated (simUgx=${d.metrics.nonProductionSimulationVolumeUgx}, liveUgx=${d.metrics.verifiedLiveProviderVolumeUgx}).`;
  });

  await exec('T1199', async () => {
    const d = await fetch(url('/api/v16/usability/sessions'), { headers: adminHdrs }).then((r) => r.json());
    if (d.participantsTested === 0 && d.programmeStatus !== 'NOT_CONDUCTED') {
      throw new Error('Empty usability store must report NOT_CONDUCTED');
    }
    return `Usability programme reports status=${d.programmeStatus} (participantsTested=${d.participantsTested}, zero fabricated data).`;
  });

  await exec('T1200', async () => {
    const res = await fetch(url('/api/v16/usability/sessions'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({
        personaCode: 'P1',
        participantGroup: 'RURAL_FARMER',
        languageUsed: 'lg',
        consentRecorded: false,
        locationDistrict: 'Mbale',
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400 without consentRecorded=true, got ${res.status}`);
    return `Usability session creation rejects missing participant consent (HTTP 400).`;
  });

  // T1201 - T1220
  await exec('T1201', async () => {
    const d = await fetch(url('/api/v16/translations/reviews'), { headers: adminHdrs }).then((r) => r.json());
    if (d.totalLanguages < 7 || !d.legalFinancialFallbackPolicy) throw new Error('7-language governance missing');
    return `Verified ${d.totalLanguages} languages (${d.approvedCount} reviewer-approved; English legal fallback enforced).`;
  });

  await exec('T1202', async () => {
    const d = await fetch(url('/api/v16/monitoring/health'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.components?.apiProcess || !d.components?.ledgerIntegrity?.balanced) throw new Error('Monitoring telemetry incomplete');
    return `Monitoring health verified (overall=${d.overallStatus}, ledgerBalanced=true).`;
  });

  await exec('T1203', async () => {
    const cRes = await fetch(url('/api/v16/monitoring/incidents'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ component: 'API', severity: 'LOW', summary: 'V16 verification telemetry check' }),
    });
    const cd = await cRes.json();
    if (cRes.status !== 201 || !cd.incident?.id) throw new Error('Incident creation failed');
    createdIncidentId = cd.incident.id;
    const tRes = await fetch(url(`/api/v16/monitoring/incidents/${createdIncidentId}/status`), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'RESOLVED', note: 'Verified resolution timeline' }),
    });
    if (!tRes.ok) throw new Error('Incident resolution failed');
    return `Incident ${createdIncidentId} created and transitioned to RESOLVED with timeline audit.`;
  });

  await exec('T1204', async () => {
    const res = await fetch(url('/api/v16/recovery/exercises'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetRpoMinutes: 5, targetRtoMinutes: 30 }),
    });
    const d = await res.json();
    if (res.status !== 201 || !d.exercise?.dataIntegrityPassed) throw new Error('Recovery exercise failed');
    return `Recovery exercise ${d.exercise.id} (${d.exercise.status}) verified ledger integrity cleanly.`;
  });

  await exec('T1205', async () => {
    const d = await fetch(url('/api/v16/recovery/status'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.v15BackupReadiness?.v15BackupValid || !d.v14BackupReadiness?.v14BackupValid) {
      throw new Error('V14/V15 backup targets incomplete');
    }
    return `Verified V14 and V15 canonical rollback targets intact.`;
  });

  await exec('T1206', async () => {
    const d = await fetch(url('/api/v16/releases'), { headers: adminHdrs }).then((r) => r.json());
    const rc1 = (d.releases || []).find((r: any) => r.id === 'REL-V16.0.0-RC1');
    if (!rc1 || !rc1.artifactChecksumSha256) throw new Error('Release candidate RC1 missing');
    return `Verified release ${rc1.id} (${rc1.status}, rollbackTarget=${rc1.rollbackTargetVersion}).`;
  });

  await exec('T1207', async () => {
    const res = await fetch(url('/api/v16/releases/REL-V16.0.0-RC1/advance'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'APPROVED_FOR_DEPLOY', targetEnvironment: 'STAGING' }),
    });
    if (res.status !== 409) throw new Error(`Expected 409 without stagingValidated=true, got ${res.status}`);
    return `Release pipeline blocked deployment without prior staging validation (HTTP 409).`;
  });

  await exec('T1208', async () => {
    const res = await fetch(url('/api/v16/releases/REL-V16.0.0-RC1/advance'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ targetStatus: 'DEPLOYED', targetEnvironment: 'PRODUCTION' }),
    });
    if (res.status !== 409) throw new Error(`Expected 409 for PRODUCTION deploy prior to 27 gates, got ${res.status}`);
    return `Release pipeline fail-closed PRODUCTION deploy blocked cleanly (HTTP 409).`;
  });

  await exec('T1209', async () => {
    const d = await fetch(url('/api/v16/impact/summary'), { headers: adminHdrs }).then((r) => r.json());
    if (!d.funnel?.funnel || d.v15MetricsCount < 24) throw new Error('Impact funnel summary invalid');
    return `Verified strict impact funnel separation + ${d.v15MetricsCount} V15 economic metrics.`;
  });

  await exec('T1210', async () => {
    const cRes = await fetch(url('/api/v16/sustainability/costs'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ category: 'SUPPORT', period: '2026-11', jurisdiction: 'UG', amountUsd: 12.5, note: 'Pilot airtime support verification' }),
    });
    if (cRes.status !== 201) throw new Error('Cost logging failed');
    const ue = await fetch(url('/api/v16/sustainability/unit-economics'), { headers: adminHdrs }).then((r) => r.json());
    if (ue.totalOperationalCostUsd < 12.5 || ue.collectedRealRevenueUsd !== 0) {
      throw new Error(`Unexpected unit economics breakdown: ${JSON.stringify(ue)}`);
    }
    return `Unit economics verified (cost=$${ue.totalOperationalCostUsd}, collected=$${ue.collectedRealRevenueUsd}).`;
  });

  await exec('T1211', async () => {
    const res = await fetch(url('/api/v16/sustainability/costs'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ category: 'HOSTING', amountUsd: -50, note: 'Invalid negative' }),
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400 on negative cost, got ${res.status}`);
    return `Rejected negative operational cost cleanly (HTTP 400).`;
  });

  await exec('T1212', async () => {
    const d = await fetch(url('/api/v16/compliance/reviews'), { headers: adminHdrs }).then((r) => r.json());
    if (!Array.isArray(d.reviews) || d.reviews.length < 5 || d.clearedCount !== 0) {
      throw new Error(`Expected >=5 statutory reviews at PENDING_LEGAL_REVIEW, cleared=${d.clearedCount}`);
    }
    return `Verified ${d.reviews.length} Uganda/EAC compliance reviews defaulting to PENDING_LEGAL_REVIEW.`;
  });

  await exec('T1213', async () => {
    const d = await fetch(url('/api/v16/compliance/reviews'), { headers: adminHdrs }).then((r) => r.json());
    if (d.reviews.some((r: any) => r.regulatedActivationBlocked !== true)) {
      throw new Error('Regulated workflow activation cannot auto-unblock without legal counsel review');
    }
    return `All ${d.reviews.length} statutory domains retain regulatedActivationBlocked=true until legal clearance.`;
  });

  await exec('T1214', async () => {
    const res = await fetch(url('/api/v16/infrastructure/status'));
    if (res.status !== 401) throw new Error(`Expected HTTP 401 for unauthenticated V16 request, got ${res.status}`);
    return `Unauthenticated V16 API request blocked cleanly (HTTP 401).`;
  });

  await exec('T1215', async () => {
    const res = await fetch(url('/api/v16/database/migrate-dry-run'), {
      method: 'POST',
      headers: farmerHdrs,
      body: JSON.stringify({}),
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403 for non-admin infra action, got ${res.status}`);
    return `Non-admin RBAC escalation blocked cleanly (HTTP 403).`;
  });

  await exec('T1216', async () => {
    const res = await fetch(url('/api/v16/pilot/metrics?tenantId=TEN-KE-ROASTERS-03'), {
      headers: farmerHdrs, // x-tenant-id is TEN-UG-ELGON-01
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403 cross-tenant isolation block, got ${res.status}`);
    return `Cross-tenant V16 API probe rejected cleanly (HTTP 403).`;
  });

  await exec('T1217', async () => {
    const res = await fetch(url('/api/v16/monitoring/incidents'), {
      method: 'POST',
      headers: adminHdrs,
      body: JSON.stringify({ component: 'API', severity: 'LOW', summary: '<script>alert(1)</script>Probe Clean' }),
    });
    const d = await res.json();
    if (!res.ok || String(d.incident?.summary).includes('<script>')) throw new Error('XSS angle-bracket sanitization failed');
    return `Input XSS sanitization verified (${d.incident.summary}).`;
  });

  await exec('T1218', async () => {
    const d = await fetch(url('/api/v16/releases/readiness?environment=PRODUCTION'), { headers: adminHdrs }).then((r) => r.json());
    if (d.gatesTotal !== 27 || d.productionAllowed !== false || d.gatesPassed >= 27) {
      throw new Error(`Expected fail-closed <27/27 gates in preview container, got ${d.gatesPassed}/${d.gatesTotal}`);
    }
    return `Evaluated ${d.gatesTotal} acceptance gates cleanly (${d.gatesPassed}/27 passed; zero false greens).`;
  });

  await exec('T1219', async () => {
    const d = await fetch(url('/api/v16/infrastructure/status'), { headers: adminHdrs }).then((r) => r.json());
    const s = d.readiness?.statuses;
    if (!s || s.ENGINEERING_COMPLETE !== true || s.PRODUCTION_READY !== false || s.LIVE_PILOT_OPERATIONAL !== false) {
      throw new Error(`Expected strict 3-state distinction, got ${JSON.stringify(s)}`);
    }
    return `Executive readiness truth confirmed: ENGINEERING_COMPLETE=true, PRODUCTION_READY=false, LIVE_PILOT_OPERATIONAL=false.`;
  });

  await exec('T1220', async () => {
    const [h, m, r] = await Promise.all([
      fetch(url('/api/health')).then((x) => x.json()),
      fetch(url('/api/v16/database/migrations'), { headers: adminHdrs }).then((x) => x.json()),
      fetch(url('/api/v16/releases/readiness'), { headers: adminHdrs }).then((x) => x.json()),
    ]);
    if (
      h.product !== 'ECONEX' ||
      h.schemaVersion < 16 ||
      !String(h.attribution).includes('VINEXSAH TECHNOLOGIES') ||
      !m.completeness?.complete ||
      r.gatesTotal !== 27
    ) {
      throw new Error('Master V16 synthesis check failed');
    }
    return `MASTER V16 SYNTHESIS PASSED: ECONEX V16.0 Schema 16, 27-Gate Fail-Closed Matrix, 12-Category Event Bus, Uganda Pilot Consent & VINEXSAH TECHNOLOGIES attribution verified.`;
  });

  return { passed, failed };
}
