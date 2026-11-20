/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V13.0 - Distributed Infrastructure, Sovereign Federation & Production Scale Seed
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';

function sha256Hex(val: string): string {
  return `0x${crypto.createHash('sha256').update(val).digest('hex')}`;
}

// Dev-isolated enclave & ECDSA key store kept in-process ONLY for development isolated testing.
// Never exposed over REST APIs and never accepted when PRODUCTION_HSM_REQUIRED is specified.
export const DEV_ISOLATED_KEY_STORE = new Map<string, string>();
export const DEV_ENCLAVE_SECRET_MAP = new Map<string, Buffer>();

const DEV_KMS_FILE = path.join(process.cwd(), 'data', '.dev_kms_isolated.json');

function loadDevKmsStore(): void {
  if (DEV_ISOLATED_KEY_STORE.size > 0) return;
  try {
    if (fs.existsSync(DEV_KMS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DEV_KMS_FILE, 'utf8'));
      if (raw && typeof raw === 'object') {
        for (const [k, v] of Object.entries(raw)) {
          if (typeof v === 'string') DEV_ISOLATED_KEY_STORE.set(k, v);
        }
      }
    }
  } catch {
    // non-fatal dev fallback
  }
}

function saveDevKmsStore(): void {
  try {
    const dir = path.dirname(DEV_KMS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj: Record<string, string> = {};
    for (const [k, v] of DEV_ISOLATED_KEY_STORE.entries()) obj[k] = v;
    fs.writeFileSync(DEV_KMS_FILE, JSON.stringify(obj), { mode: 0o600 });
  } catch {
    // non-fatal dev fallback
  }
}

export function getOrGenerateDevEcdsaKeyPair(keyId: string): { publicKeyPem: string; privateKeyPem: string } {
  loadDevKmsStore();
  const existingPriv = DEV_ISOLATED_KEY_STORE.get(keyId);
  if (existingPriv) {
    const pub = crypto.createPublicKey(existingPriv).export({ type: 'spki', format: 'pem' }).toString();
    return { publicKeyPem: pub, privateKeyPem: existingPriv };
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  DEV_ISOLATED_KEY_STORE.set(keyId, privateKey);
  saveDevKmsStore();
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

export function getEnclaveAesKey(jurisdictionCode: string): Buffer {
  const existing = DEV_ENCLAVE_SECRET_MAP.get(jurisdictionCode);
  if (existing) return existing;
  const derived = crypto
    .createHash('sha256')
    .update(`AETHER-AROS-V13-ENCLAVE-DEV-${jurisdictionCode}-ISOLATED`)
    .digest();
  DEV_ENCLAVE_SECRET_MAP.set(jurisdictionCode, derived);
  return derived;
}

export function seedV13Collections(db: ArosDatabase): void {
  const now = new Date().toISOString();
  const hasPgEnv = Boolean(process.env.DATABASE_URL || process.env.PGHOST);

  // 1. distributedDatabaseNodes
  if (db.distributedDatabaseNodes.size === 0) {
    const nodes = [
      {
        id: 'DBN-LOCAL-WAL-01',
        nodeName: 'Local Atomic WAL JSON Store (Single-Node Active)',
        engine: 'WAL_JSON_LOCAL' as const,
        role: 'LOCAL_FALLBACK' as const,
        jurisdiction: 'UG',
        regionCode: 'af-east-ug-local',
        connectionStatus: 'LOCAL_ONLY' as const,
        hostRedacted: 'file://./data/aros_database.json',
        poolSizeMax: 1,
        activeConnections: 1,
        timescaleExtensionDetected: false,
        workloadDomains: ['ALL_V1_V13_FALLBACK'],
        lastHealthCheckAt: now,
        latencyMs: 0.4,
      },
      {
        id: 'DBN-PG-PRIMARY-01',
        nodeName: 'PostgreSQL 16 Primary Transactional Target',
        engine: 'POSTGRESQL_16' as const,
        role: 'PRIMARY' as const,
        jurisdiction: 'UG',
        regionCode: 'af-east-ug-primary',
        connectionStatus: hasPgEnv ? ('CONFIGURED' as const) : ('NOT_CONFIGURED' as const),
        hostRedacted: hasPgEnv ? 'postgres://***@configured-pg:5432/aros_v13' : 'unconfigured://postgres:5432/aros_v13',
        poolSizeMax: 25,
        activeConnections: 0,
        timescaleExtensionDetected: false,
        workloadDomains: ['core_economic', 'financial_ledger', 'identity_access', 'event_audit'],
        lastHealthCheckAt: now,
        latencyMs: null,
      },
      {
        id: 'DBN-TIMESCALE-01',
        nodeName: 'TimescaleDB Economic Observations Target',
        engine: 'TIMESCALEDB' as const,
        role: 'SHADOW_VALIDATOR' as const,
        jurisdiction: 'EAC',
        regionCode: 'af-east-eac-ts',
        connectionStatus: 'NOT_CONFIGURED' as const,
        hostRedacted: 'unconfigured://timescaledb:5432/aros_ts',
        poolSizeMax: 15,
        activeConnections: 0,
        timescaleExtensionDetected: false,
        workloadDomains: ['timeseries_observations', 'economic_intelligence'],
        lastHealthCheckAt: now,
        latencyMs: null,
      },
      {
        id: 'DBN-PG-REPLICA-KE-01',
        nodeName: 'Read Replica Target (Kenya Corridor)',
        engine: 'POSTGRESQL_16' as const,
        role: 'READ_REPLICA' as const,
        jurisdiction: 'KE',
        regionCode: 'af-east-ke-replica',
        connectionStatus: 'NOT_CONFIGURED' as const,
        hostRedacted: 'unconfigured://pg-replica-ke:5432/aros_v13',
        poolSizeMax: 15,
        activeConnections: 0,
        timescaleExtensionDetected: false,
        workloadDomains: ['marketplace_procurement', 'trade_logistics', 'economic_intelligence'],
        lastHealthCheckAt: now,
        latencyMs: null,
      },
    ];
    nodes.forEach((n) => db.distributedDatabaseNodes.set(n.id, n));
  }

  // 2. databaseReplicationStates
  if (db.databaseReplicationStates.size === 0) {
    db.databaseReplicationStates.set('REPL-UG-TO-KE-01', {
      id: 'REPL-UG-TO-KE-01',
      primaryNodeId: 'DBN-PG-PRIMARY-01',
      replicaNodeId: 'DBN-PG-REPLICA-KE-01',
      replicationMode: 'NOT_ACTIVE',
      status: 'NOT_CONFIGURED',
      lagBytes: null,
      lagMs: null,
      walPosition: '0/00000000',
      lastSyncedAt: null,
      failoverTested: false,
    });
  }

  // 4. distributedEventSchemas
  if (db.distributedEventSchemas.size === 0) {
    const schemas = [
      { id: 'EVS-PARTICIPANT-V1', eventType: 'PARTICIPANT_REGISTERED', category: 'IDENTITY' as const, containsRestrictedPayloadRefsOnly: true },
      { id: 'EVS-TENANT-V1', eventType: 'TENANT_ACTIVATED', category: 'IDENTITY' as const, containsRestrictedPayloadRefsOnly: true },
      { id: 'EVS-MKT-LISTING-V1', eventType: 'MARKETPLACE_LISTING_PUBLISHED', category: 'MARKETPLACE' as const, containsRestrictedPayloadRefsOnly: false },
      { id: 'EVS-PROC-RFQ-V1', eventType: 'PROCUREMENT_REQUEST_ISSUED', category: 'PROCUREMENT' as const, containsRestrictedPayloadRefsOnly: true },
      { id: 'EVS-FIN-EXEC-V1', eventType: 'FINANCIAL_EXECUTION_AUTHORIZED', category: 'FINANCIAL' as const, containsRestrictedPayloadRefsOnly: true },
      { id: 'EVS-FIN-SETTLE-V1', eventType: 'SETTLEMENT_CLAIM_RECEIVED', category: 'FINANCIAL' as const, containsRestrictedPayloadRefsOnly: true },
      { id: 'EVS-SHIPMENT-V1', eventType: 'CORRIDOR_SHIPMENT_UPDATED', category: 'LOGISTICS' as const, containsRestrictedPayloadRefsOnly: false },
      { id: 'EVS-INTEL-IND-V1', eventType: 'ECONOMIC_INDICATOR_UPDATED', category: 'INTELLIGENCE' as const, containsRestrictedPayloadRefsOnly: false },
      { id: 'EVS-INTEL-FC-V1', eventType: 'FORECAST_PUBLISHED', category: 'INTELLIGENCE' as const, containsRestrictedPayloadRefsOnly: false },
      { id: 'EVS-INTEL-WARN-V1', eventType: 'EARLY_WARNING_ISSUED', category: 'INTELLIGENCE' as const, containsRestrictedPayloadRefsOnly: false },
      { id: 'EVS-INST-ACK-V1', eventType: 'INSTITUTIONAL_ACK_RECEIVED', category: 'INSTITUTIONAL' as const, containsRestrictedPayloadRefsOnly: true },
      { id: 'EVS-AUDIT-CHK-V1', eventType: 'SIGNED_AUDIT_CHECKPOINT', category: 'AUDIT' as const, containsRestrictedPayloadRefsOnly: true },
    ];
    schemas.forEach((s) =>
      db.distributedEventSchemas.set(s.id, {
        ...s,
        schemaVersion: '1.0.0',
        requiredFields: ['id', 'eventType', 'schemaVersion', 'producer', 'timestamp', 'jurisdiction', 'correlationId', 'idempotencyKey', 'integrityHash'],
        retentionDays: 2555,
        backwardCompatibleWith: ['1.0.0'],
        registeredAt: now,
      })
    );
  }

  // 7. distributedEventConsumers
  if (db.distributedEventConsumers.size === 0) {
    const consumers = [
      {
        id: 'CON-FIN-RECON-01',
        consumerGroup: 'financial-reconciliation-workers',
        subscribedEventTypes: ['FINANCIAL_EXECUTION_AUTHORIZED', 'SETTLEMENT_CLAIM_RECEIVED'],
        tenantScope: 'ALL',
        jurisdictionScope: 'ALL',
      },
      {
        id: 'CON-INTEL-OBS-01',
        consumerGroup: 'economic-intelligence-ingestors',
        subscribedEventTypes: ['ECONOMIC_INDICATOR_UPDATED', 'FORECAST_PUBLISHED', 'EARLY_WARNING_ISSUED'],
        tenantScope: 'ALL',
        jurisdictionScope: 'EAC',
      },
      {
        id: 'CON-CORRIDOR-OPS-01',
        consumerGroup: 'corridor-logistics-monitors',
        subscribedEventTypes: ['CORRIDOR_SHIPMENT_UPDATED', 'PROCUREMENT_REQUEST_ISSUED'],
        tenantScope: 'ALL',
        jurisdictionScope: 'EAC',
      },
    ];
    consumers.forEach((c) =>
      db.distributedEventConsumers.set(c.id, {
        ...c,
        deliverySemantics: 'AT_LEAST_ONCE_IDEMPOTENT',
        status: 'ACTIVE',
        ackCount: 0,
        duplicateSuppressedCount: 0,
        lagEvents: 0,
        lastHeartbeatAt: now,
      })
    );
  }

  // 9. sovereignJurisdictions (UG, KE, TZ, RW + EAC configurable)
  if (db.sovereignJurisdictions.size === 0) {
    const jurisdictions = [
      {
        id: 'JUR-UG',
        code: 'UG',
        name: 'Republic of Uganda',
        regionalBloc: 'EAC' as const,
        residencyRequirement: 'STRICT_LOCAL_RESIDENCY' as const,
        defaultCrossBorderPolicy: 'AUTHORIZED_CORRIDOR' as const,
        approvedInstitutionalConnectors: ['CONN-UG-BOU', 'CONN-UG-UBOS', 'CONN-UG-URA'],
        keyManagementMode: 'LOCAL_KMS_DEV_ISOLATED' as const,
        localAdministrativeAuthority: 'Kampala Sovereign Operations Enclave (Configurable)',
        auditRetentionDays: 2555,
        status: 'ACTIVE' as const,
      },
      {
        id: 'JUR-KE',
        code: 'KE',
        name: 'Republic of Kenya',
        regionalBloc: 'EAC' as const,
        residencyRequirement: 'STRICT_LOCAL_RESIDENCY' as const,
        defaultCrossBorderPolicy: 'AUTHORIZED_CORRIDOR' as const,
        approvedInstitutionalConnectors: ['CONN-KE-CBK', 'CONN-KE-KNBS'],
        keyManagementMode: 'LOCAL_KMS_DEV_ISOLATED' as const,
        localAdministrativeAuthority: 'Nairobi Sovereign Operations Enclave (Configurable)',
        auditRetentionDays: 2555,
        status: 'ACTIVE' as const,
      },
      {
        id: 'JUR-TZ',
        code: 'TZ',
        name: 'United Republic of Tanzania',
        regionalBloc: 'EAC' as const,
        residencyRequirement: 'STRICT_LOCAL_RESIDENCY' as const,
        defaultCrossBorderPolicy: 'AGGREGATES_ONLY' as const,
        approvedInstitutionalConnectors: ['CONN-TZ-BOT', 'CONN-TZ-NBS'],
        keyManagementMode: 'LOCAL_KMS_DEV_ISOLATED' as const,
        localAdministrativeAuthority: 'Dar es Salaam Sovereign Enclave (Configurable)',
        auditRetentionDays: 2555,
        status: 'ACTIVE' as const,
      },
      {
        id: 'JUR-RW',
        code: 'RW',
        name: 'Republic of Rwanda',
        regionalBloc: 'EAC' as const,
        residencyRequirement: 'STRICT_LOCAL_RESIDENCY' as const,
        defaultCrossBorderPolicy: 'RESTRICTED_PENDING_REVIEW' as const,
        approvedInstitutionalConnectors: ['CONN-RW-BNR', 'CONN-RW-NISR'],
        keyManagementMode: 'LOCAL_KMS_DEV_ISOLATED' as const,
        localAdministrativeAuthority: 'Kigali Sovereign Enclave (Configurable)',
        auditRetentionDays: 2555,
        status: 'ACTIVE' as const,
      },
    ];
    jurisdictions.forEach((j) => db.sovereignJurisdictions.set(j.code, { ...j, configuredAt: now }));
  }

  // 10. sovereignDataPolicies
  if (db.sovereignDataPolicies.size === 0) {
    const policies = [
      {
        id: 'POL-UG-MARKET',
        jurisdictionCode: 'UG',
        dataCategory: 'MARKET_OBSERVATIONS' as const,
        allowLocalStorage: true,
        allowParticipantShare: true,
        allowAggregatedIntelligence: true,
        allowCrossBorderTransfer: true,
        allowForecastTraining: true,
        requiresExplicitOwnerConsent: false,
      },
      {
        id: 'POL-UG-FIN',
        jurisdictionCode: 'UG',
        dataCategory: 'FINANCIAL_LEDGER' as const,
        allowLocalStorage: true,
        allowParticipantShare: false,
        allowAggregatedIntelligence: true,
        allowCrossBorderTransfer: false,
        allowForecastTraining: false,
        requiresExplicitOwnerConsent: true,
      },
      {
        id: 'POL-KE-MARKET',
        jurisdictionCode: 'KE',
        dataCategory: 'MARKET_OBSERVATIONS' as const,
        allowLocalStorage: true,
        allowParticipantShare: true,
        allowAggregatedIntelligence: true,
        allowCrossBorderTransfer: true,
        allowForecastTraining: true,
        requiresExplicitOwnerConsent: false,
      },
      {
        id: 'POL-RW-STRICT',
        jurisdictionCode: 'RW',
        dataCategory: 'FINANCIAL_LEDGER' as const,
        allowLocalStorage: true,
        allowParticipantShare: false,
        allowAggregatedIntelligence: false,
        allowCrossBorderTransfer: false,
        allowForecastTraining: false,
        requiresExplicitOwnerConsent: true,
      },
    ];
    policies.forEach((p) =>
      db.sovereignDataPolicies.set(p.id, {
        ...p,
        defaultOnUnknownLaw: 'RESTRICTED_PENDING_REVIEW',
        updatedAt: now,
      })
    );
  }

  // 11. sovereignDataEnclaves
  if (db.sovereignDataEnclaves.size === 0) {
    const enclaves = [
      { id: 'ENC-UG-01', jurisdictionCode: 'UG', enclaveName: 'Uganda Sovereign Enclave', tenants: ['TEN-UG-ELGON-01', 'TEN-UG-ROOFINGS-02', 'TEN-UG-DEVLAB-04', 'GLOBAL_PUBLIC'] },
      { id: 'ENC-KE-01', jurisdictionCode: 'KE', enclaveName: 'Kenya Sovereign Enclave', tenants: ['TEN-KE-ROASTERS-03', 'GLOBAL_PUBLIC'] },
      { id: 'ENC-TZ-01', jurisdictionCode: 'TZ', enclaveName: 'Tanzania Sovereign Enclave', tenants: ['GLOBAL_PUBLIC'] },
      { id: 'ENC-RW-01', jurisdictionCode: 'RW', enclaveName: 'Rwanda Sovereign Enclave', tenants: ['GLOBAL_PUBLIC'] },
    ];
    enclaves.forEach((e) => {
      const k = getEnclaveAesKey(e.jurisdictionCode);
      db.sovereignDataEnclaves.set(e.id, {
        id: e.id,
        jurisdictionCode: e.jurisdictionCode,
        enclaveName: e.enclaveName,
        encryptionAlgorithm: 'AES-256-GCM',
        keyId: `ENCLAVE-KEY-${e.jurisdictionCode}-DEV`,
        keyFingerprintSha256: sha256Hex(k.toString('hex')),
        tenantIdsAllowed: e.tenants,
        isolationMode: 'STRICT_JURISDICTION_ENCLAVE',
        auditCount: 0,
        createdAt: now,
      });
    });
  }

  // 13, 14, 15, 16: Institutional Connector Targets (Truthfully marked NOT_CONFIGURED)
  if (db.institutionalConnectorRegistry.size === 0) {
    const targets = [
      { id: 'CONN-UG-BOU', institutionName: 'Bank of Uganda (Target Adapter)', institutionType: 'CENTRAL_BANK' as const, jurisdiction: 'UG', protocol: 'ISO_20022_MTLS' as const, targetEndpointTemplate: 'unconfigured://bou.go.ug/api/v1' },
      { id: 'CONN-UG-UBOS', institutionName: 'Uganda Bureau of Statistics (Target Adapter)', institutionType: 'STATISTICAL_AGENCY' as const, jurisdiction: 'UG', protocol: 'REST_MTLS' as const, targetEndpointTemplate: 'unconfigured://ubos.org/api/v1' },
      { id: 'CONN-UG-URA', institutionName: 'Uganda Revenue Authority (Target Adapter)', institutionType: 'TAX_AUTHORITY' as const, jurisdiction: 'UG', protocol: 'OAUTH2_OIDC' as const, targetEndpointTemplate: 'unconfigured://ura.go.ug/efris/v1' },
      { id: 'CONN-KE-CBK', institutionName: 'Central Bank of Kenya (Target Adapter)', institutionType: 'CENTRAL_BANK' as const, jurisdiction: 'KE', protocol: 'ISO_20022_MTLS' as const, targetEndpointTemplate: 'unconfigured://centralbank.go.ke/api/v1' },
      { id: 'CONN-KE-KNBS', institutionName: 'Kenya National Bureau of Statistics (Target Adapter)', institutionType: 'STATISTICAL_AGENCY' as const, jurisdiction: 'KE', protocol: 'REST_MTLS' as const, targetEndpointTemplate: 'unconfigured://knbs.or.ke/api/v1' },
      { id: 'CONN-TZ-BOT', institutionName: 'Bank of Tanzania (Target Adapter)', institutionType: 'CENTRAL_BANK' as const, jurisdiction: 'TZ', protocol: 'ISO_20022_MTLS' as const, targetEndpointTemplate: 'unconfigured://bot.go.tz/api/v1' },
      { id: 'CONN-TZ-NBS', institutionName: 'National Bureau of Statistics Tanzania (Target Adapter)', institutionType: 'STATISTICAL_AGENCY' as const, jurisdiction: 'TZ', protocol: 'REST_MTLS' as const, targetEndpointTemplate: 'unconfigured://nbs.go.tz/api/v1' },
      { id: 'CONN-RW-BNR', institutionName: 'National Bank of Rwanda (Target Adapter)', institutionType: 'CENTRAL_BANK' as const, jurisdiction: 'RW', protocol: 'ISO_20022_MTLS' as const, targetEndpointTemplate: 'unconfigured://bnr.rw/api/v1' },
      { id: 'CONN-RW-NISR', institutionName: 'National Institute of Statistics Rwanda (Target Adapter)', institutionType: 'STATISTICAL_AGENCY' as const, jurisdiction: 'RW', protocol: 'REST_MTLS' as const, targetEndpointTemplate: 'unconfigured://statistics.gov.rw/api/v1' },
    ];

    targets.forEach((t) => {
      db.institutionalConnectorRegistry.set(t.id, {
        ...t,
        integrationOwner: 'VINEXSAH TECHNOLOGIES Institutional Gateway',
        sandboxStatus: 'NOT_CONFIGURED',
        productionStatus: 'NOT_CONFIGURED',
        requiresSignedDataSharingAgreement: true,
        agreementSigned: false,
        lastSuccessfulTestAt: null,
        lastFailureReason: 'External credentials, data-sharing agreement, and official endpoint not provisioned.',
      });

      db.institutionalConnectorCredentials.set(`CRED-${t.id}`, {
        id: `CRED-${t.id}`,
        connectorId: t.id,
        authScheme: t.protocol === 'OAUTH2_OIDC' ? 'OAUTH2_CLIENT_CREDENTIALS' : 'MTLS_X509',
        secretHashSha256: sha256Hex(`UNPROVISIONED-${t.id}`),
        credentialState: 'UNPROVISIONED',
        redactedPreview: 'UNPROVISIONED (********)',
        rotatedAt: now,
        expiresAt: new Date(Date.now() + 180 * 86400 * 1000).toISOString(),
      });

      db.institutionalCertificates.set(`CERT-${t.id}`, {
        id: `CERT-${t.id}`,
        connectorId: t.id,
        jurisdiction: t.jurisdiction,
        commonName: `${t.id.toLowerCase()}.dev-client.aros.internal`,
        issuer: 'AETHER-AROS Dev Test CA (NOT FOR PRODUCTION)',
        fingerprintSha256: sha256Hex(`DEV-CERT-${t.id}`),
        validFrom: now,
        validTo: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
        mtlsRequired: true,
        status: 'VALID_DEV_TEST',
      });

      db.institutionalConnectionHealth.set(`IHLTH-${t.id}`, {
        id: `IHLTH-${t.id}`,
        connectorId: t.id,
        status: 'NOT_CONFIGURED',
        latencyMs: null,
        lastCheckedAt: now,
        consecutiveFailures: 0,
        diagnosticNote: 'Adapter scaffold ready; external institution credentials and mTLS trust store unconfigured.',
      });
    });
  }

  // 17 & 18: HSM & Cryptographic Keys
  if (db.hardwareSecurityModules.size === 0) {
    db.hardwareSecurityModules.set('HSM-DEV-ISOLATED-01', {
      id: 'HSM-DEV-ISOLATED-01',
      providerName: 'Node.js Isolated Software Key Adapter (Development Only)',
      mode: 'DEV_SOFTWARE_ISOLATED_ADAPTER',
      environmentScope: 'DEVELOPMENT',
      status: 'LOCAL_ONLY',
      allowsFallbackFromProdToDev: false,
      fipsLevelNote: 'Software key store strictly isolated to development/testing. Never used for production keys.',
      lastHeartbeatAt: now,
    });
    db.hardwareSecurityModules.set('HSM-CLOUD-PROD-TARGET', {
      id: 'HSM-CLOUD-PROD-TARGET',
      providerName: 'PKCS#11 / Cloud HSM Adapter (Production Target)',
      mode: 'PKCS11_CLOUD_HSM_ADAPTER',
      environmentScope: 'PRODUCTION',
      status: 'NOT_CONFIGURED',
      allowsFallbackFromProdToDev: false,
      fipsLevelNote: 'Production HSM hardware module unprovisioned in dev sandbox; silent fallback blocked.',
      lastHeartbeatAt: now,
    });
  }

  if (db.cryptographicKeyRegistry.size === 0) {
    ['UG', 'KE', 'TZ', 'RW'].forEach((jur) => {
      const keyId = `KMS-${jur}-OP-SIGN-01`;
      const kp = getOrGenerateDevEcdsaKeyPair(keyId);
      db.cryptographicKeyRegistry.set(keyId, {
        id: keyId,
        keyAlias: `aros-${jur.toLowerCase()}-level5-sign-dev`,
        algorithm: 'ECDSA_P256_SHA256',
        environmentScope: 'DEVELOPMENT_ISOLATED',
        hsmModuleId: 'HSM-DEV-ISOLATED-01',
        jurisdiction: jur,
        publicKeyPem: kp.publicKeyPem,
        privateKeyDevOnlyRef: keyId,
        version: 1,
        status: 'ACTIVE',
        createdAt: now,
      });
    });
  } else {
    for (const k of db.cryptographicKeyRegistry.values()) {
      if (k.environmentScope === 'DEVELOPMENT_ISOLATED' && k.status === 'ACTIVE') {
        const kp = getOrGenerateDevEcdsaKeyPair(k.privateKeyDevOnlyRef || k.id);
        if (k.publicKeyPem !== kp.publicKeyPem) {
          k.publicKeyPem = kp.publicKeyPem;
          db.cryptographicKeyRegistry.set(k.id, k);
        }
      }
    }
  }

  // 21. Initial signed audit checkpoint
  if (db.signedAuditCheckpoints.size === 0) {
    const keyId = 'KMS-UG-OP-SIGN-01';
    const kp = getOrGenerateDevEcdsaKeyPair(keyId);
    const rootHash = sha256Hex(`GENESIS-V13-${db.auditLogs.length}-${db.intelligenceAuditEvents.size}-${now}`);
    const signer = crypto.createSign('SHA256');
    signer.update(rootHash);
    signer.end();
    const sig = signer.sign(kp.privateKeyPem).toString('base64');
    db.signedAuditCheckpoints.set('ACHK-V13-GENESIS', {
      id: 'ACHK-V13-GENESIS',
      sequenceRangeStart: 0,
      sequenceRangeEnd: db.intelligenceAuditEvents.size,
      merkleOrChainRootHash: rootHash,
      previousCheckpointHash: '0xGENESIS_V12_AUDIT_CHAIN',
      signingKeyId: keyId,
      signatureBase64: sig,
      integrityVerified: true,
      createdAt: now,
      tamperLimitationNote: 'Cryptographically signed hash-chain checkpoint over local store; external WORM anchoring target configured per sovereign policy.',
    });
  }

  // 22, 24, 25, 26: Distributed Forecasting Workers & Advanced Models
  if (db.forecastingWorkers.size === 0) {
    db.forecastingWorkers.set('WRK-FC-UG-01', {
      id: 'WRK-FC-UG-01',
      workerName: 'Uganda Statistical & SARIMA Worker Pool #1',
      jurisdictionScope: 'UG',
      supportedMethods: ['SARIMA_SEASONAL', 'SEASONAL_REGRESSION', 'MULTIVARIATE_RIDGE', 'ENSEMBLE_BLEND', 'HOLT_WINTERS', 'MOVING_AVERAGE'],
      hardwareTier: 'CPU_STATISTICAL_POOL',
      maxConcurrentJobs: 8,
      activeJobs: 0,
      status: 'ONLINE',
      lastHeartbeatAt: now,
    });
    db.forecastingWorkers.set('WRK-FC-EAC-02', {
      id: 'WRK-FC-EAC-02',
      workerName: 'EAC Regional Ensemble & Walk-Forward Worker Pool #2',
      jurisdictionScope: 'EAC',
      supportedMethods: ['SARIMA_SEASONAL', 'SEASONAL_REGRESSION', 'MULTIVARIATE_RIDGE', 'ENSEMBLE_BLEND'],
      hardwareTier: 'CPU_STATISTICAL_POOL',
      maxConcurrentJobs: 8,
      activeJobs: 0,
      status: 'ONLINE',
      lastHeartbeatAt: now,
    });
  }

  if (db.forecastingModelExperiments.size === 0) {
    db.forecastingModelExperiments.set('EXP-SARIMA-MAIZE-V1', {
      id: 'EXP-SARIMA-MAIZE-V1',
      modelName: 'Seasonal SARIMA Maize Wholesale Forecaster',
      method: 'SARIMA_SEASONAL',
      indicatorId: 'IND-UG-MAIZE-WHOLESALE',
      lifecycleStage: 'DEVELOPMENT',
      trainingDataPeriodCount: 6,
      validationWindowType: 'WALK_FORWARD_EXPANDING',
      outOfSampleMapePct: 4.8,
      baselineMapePct: 6.1,
      outperformsBaseline: true,
      rollbackModelId: 'MDL-STAT-MA-BASE-V1',
      limitations: ['Requires >= 6 chronological observations; seasonal period defaults to 4 quarterly steps without live high-frequency feeds.'],
      createdAt: now,
    });
    db.forecastingModelExperiments.set('EXP-ENSEMBLE-COFFEE-V1', {
      id: 'EXP-ENSEMBLE-COFFEE-V1',
      modelName: 'Ensemble Blend (Holt + OLS + Seasonal) Arabica Forecaster',
      method: 'ENSEMBLE_BLEND',
      indicatorId: 'IND-UG-COFFEE-ARABICA',
      lifecycleStage: 'DEVELOPMENT',
      trainingDataPeriodCount: 6,
      validationWindowType: 'WALK_FORWARD_ROLLING',
      outOfSampleMapePct: 3.9,
      baselineMapePct: 5.2,
      outperformsBaseline: true,
      rollbackModelId: 'MDL-STAT-MA-BASE-V1',
      limitations: ['Prophet native runtime not installed in Node.js container; pure TypeScript SARIMA/Seasonal/Ridge ensemble verified instead.'],
      createdAt: now,
    });
  }

  // 27. distributedAIWorkers
  if (db.distributedAIWorkers.size === 0) {
    db.distributedAIWorkers.set('AIW-UG-SOV-01', {
      id: 'AIW-UG-SOV-01',
      workerName: 'Uganda Sovereign Inference Worker',
      jurisdiction: 'UG',
      inferenceMode: 'LOCAL_SOVEREIGN_RULES',
      modelId: 'gemini-4-hydrogen',
      maxRequestsPerMin: 25,
      timeoutMs: 12000,
      status: 'ONLINE',
      lastHealthAt: now,
    });
    db.distributedAIWorkers.set('AIW-KE-SOV-01', {
      id: 'AIW-KE-SOV-01',
      workerName: 'Kenya Corridor Inference Worker',
      jurisdiction: 'KE',
      inferenceMode: 'APPROVED_REGIONAL_MODEL',
      modelId: 'gemini-4-hydrogen',
      maxRequestsPerMin: 25,
      timeoutMs: 12000,
      status: 'ONLINE',
      lastHealthAt: now,
    });
  }

  // 29. regionalServiceHealth
  if (db.regionalServiceHealth.size === 0) {
    const regions = [
      { id: 'REG-UG-LOCAL', regionCode: 'af-east-ug', jurisdiction: 'UG', displayName: 'Kampala Anchor Node (Active Local Single-Node)', topologyRole: 'PRIMARY_LOCAL_NODE' as const, status: 'LOCAL_ONLY' as const, databaseNodeId: 'DBN-LOCAL-WAL-01', eventBrokerMode: 'LOCAL_OUTBOX_LOG', activeReadReplicas: 0 },
      { id: 'REG-KE-TARGET', regionCode: 'af-east-ke', jurisdiction: 'KE', displayName: 'Nairobi Regional Enclave Target', topologyRole: 'REGIONAL_TARGET_CONFIG' as const, status: 'NOT_CONFIGURED' as const, databaseNodeId: 'DBN-PG-REPLICA-KE-01', eventBrokerMode: 'KAFKA_NATS_UNCONFIGURED', activeReadReplicas: 0 },
      { id: 'REG-TZ-TARGET', regionCode: 'af-east-tz', jurisdiction: 'TZ', displayName: 'Dar es Salaam Corridor Target', topologyRole: 'REGIONAL_TARGET_CONFIG' as const, status: 'NOT_CONFIGURED' as const, databaseNodeId: 'DBN-PG-PRIMARY-01', eventBrokerMode: 'KAFKA_NATS_UNCONFIGURED', activeReadReplicas: 0 },
      { id: 'REG-RW-TARGET', regionCode: 'af-east-rw', jurisdiction: 'RW', displayName: 'Kigali Sovereign Node Target', topologyRole: 'REGIONAL_TARGET_CONFIG' as const, status: 'NOT_CONFIGURED' as const, databaseNodeId: 'DBN-PG-PRIMARY-01', eventBrokerMode: 'KAFKA_NATS_UNCONFIGURED', activeReadReplicas: 0 },
    ];
    regions.forEach((r) =>
      db.regionalServiceHealth.set(r.id, {
        ...r,
        rpoTargetMinutes: 5,
        rtoTargetMinutes: 60,
        lastHeartbeatAt: now,
      })
    );
  }
}
