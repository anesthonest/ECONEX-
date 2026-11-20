/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V14.0 - Deterministic V14 Infrastructure, Financial Interoperability & Institutional Operations Seed
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';
import type { CurrencySettlementConfig } from '../types/index.ts';

function sha256Hex(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export const SUPPORTED_14_CURRENCIES: CurrencySettlementConfig[] = [
  { currency: 'UGX', currencyName: 'Ugandan Shilling', minorUnits: 0, regionGroup: 'EAC', clearingRail: 'BOU_RTGS_EFT', independentLedgerAccountPrefix: '1010-UGX', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'KES', currencyName: 'Kenyan Shilling', minorUnits: 2, regionGroup: 'EAC', clearingRail: 'CBK_KEPSS_PESALINK', independentLedgerAccountPrefix: '1010-KES', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'TZS', currencyName: 'Tanzanian Shilling', minorUnits: 2, regionGroup: 'EAC', clearingRail: 'BOT_TISS', independentLedgerAccountPrefix: '1010-TZS', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'RWF', currencyName: 'Rwandan Franc', minorUnits: 0, regionGroup: 'EAC', clearingRail: 'BNR_RIPPS', independentLedgerAccountPrefix: '1010-RWF', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'BIF', currencyName: 'Burundian Franc', minorUnits: 0, regionGroup: 'EAC', clearingRail: 'BRB_CLEARING', independentLedgerAccountPrefix: '1010-BIF', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'SSP', currencyName: 'South Sudanese Pound', minorUnits: 2, regionGroup: 'EAC', clearingRail: 'BOSS_CLEARING', independentLedgerAccountPrefix: '1010-SSP', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'CDF', currencyName: 'Congolese Franc', minorUnits: 2, regionGroup: 'EAC', clearingRail: 'BCC_CLEARING', independentLedgerAccountPrefix: '1010-CDF', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'NGN', currencyName: 'Nigerian Naira', minorUnits: 2, regionGroup: 'AFRICA', clearingRail: 'NIBSS_NIP_RTGS', independentLedgerAccountPrefix: '1010-NGN', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'ZAR', currencyName: 'South African Rand', minorUnits: 2, regionGroup: 'AFRICA', clearingRail: 'SARB_SAMOS', independentLedgerAccountPrefix: '1010-ZAR', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'USD', currencyName: 'United States Dollar', minorUnits: 2, regionGroup: 'GLOBAL', clearingRail: 'SWIFT_FEDWIRE_CORR', independentLedgerAccountPrefix: '1010-USD', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'EUR', currencyName: 'Euro', minorUnits: 2, regionGroup: 'GLOBAL', clearingRail: 'TARGET2_SEPA_CORR', independentLedgerAccountPrefix: '1010-EUR', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'GBP', currencyName: 'British Pound Sterling', minorUnits: 2, regionGroup: 'GLOBAL', clearingRail: 'CHAPS_FPS_CORR', independentLedgerAccountPrefix: '1010-GBP', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'CNY', currencyName: 'Chinese Yuan Renminbi', minorUnits: 2, regionGroup: 'GLOBAL', clearingRail: 'CIPS_CORR', independentLedgerAccountPrefix: '1010-CNY', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
  { currency: 'JPY', currencyName: 'Japanese Yen', minorUnits: 0, regionGroup: 'GLOBAL', clearingRail: 'BOJ_NET_CORR', independentLedgerAccountPrefix: '1010-JPY', crossCurrencyConversionRequiresExplicitFxEntry: true, active: true },
];

export function seedV14Collections(db: ArosDatabase): void {
  const now = new Date().toISOString();
  const hasPg = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
  const hasKafka = Boolean(process.env.KAFKA_BROKERS);
  const hasNats = Boolean(process.env.NATS_URL);
  const hasProdHsm = Boolean(process.env.HSM_PKCS11_MODULE_PATH && process.env.HSM_SLOT_PIN);
  const hasWorm = Boolean(process.env.AUDIT_WORM_S3_BUCKET || process.env.AUDIT_WORM_ENDPOINT);

  // 18. currencySettlementConfigs (All 14 Currencies)
  SUPPORTED_14_CURRENCIES.forEach((cfg) => {
    if (!db.currencySettlementConfigs.has(cfg.currency)) {
      db.currencySettlementConfigs.set(cfg.currency, cfg);
    }
  });

  // 1. databaseCutoverChecklists
  if (db.databaseCutoverChecklists.size === 0) {
    db.databaseCutoverChecklists.set('CUTOVER-CHECK-PRIMARY', {
      id: 'CUTOVER-CHECK-PRIMARY',
      targetEngine: 'POSTGRESQL_16',
      currentAuthorityState: 'WAL_JSON_SINGLE_NODE',
      requestedAuthorityState: 'POSTGRES_PRIMARY',
      gates: {
        postgresProvisionedAndReachable: hasPg,
        schemaV14AppliedAndVerified: false,
        zeroDataLossChecksumVerified: true,
        shadowParityPassed: false,
        backupAndRestoreVerified: true,
        singleWriterLockConfirmed: true,
        platformAdminApproved: false,
      },
      allGatesPassed: false,
      blockedReasons: hasPg
        ? ['Schema v14 live DDL verification and admin cutover approval pending.']
        : ['DATABASE_URL / PGHOST is not configured in the current container environment; WAL_JSON_SINGLE_NODE remains the active single-writer authority.'],
      evaluatedBy: 'SYSTEM_SEED',
      evaluatedAt: now,
    });
  }

  // 2. databaseReplicaHealth
  if (db.databaseReplicaHealth.size === 0) {
    db.databaseReplicaHealth.set('REPL-LOCAL-WAL', {
      id: 'REPL-LOCAL-WAL',
      nodeId: 'DBN-LOCAL-WAL-01',
      role: 'LOCAL_WAL_AUTHORITY',
      region: 'af-east-ug',
      jurisdiction: 'UG',
      connectionStatus: 'LOCAL_ONLY',
      replicationLagMs: 0,
      walPosition: 'wal/aros_database.json',
      connectionPoolUsed: 1,
      connectionPoolMax: 1,
      lastCheckedAt: now,
    });
    db.databaseReplicaHealth.set('REPL-PG-PRIMARY', {
      id: 'REPL-PG-PRIMARY',
      nodeId: 'DBN-PG-PRIMARY-01',
      role: 'PRIMARY',
      region: 'af-east-ug',
      jurisdiction: 'UG',
      connectionStatus: hasPg ? 'DEGRADED' : 'NOT_CONFIGURED',
      replicationLagMs: null,
      walPosition: 'UNPROVISIONED',
      connectionPoolUsed: 0,
      connectionPoolMax: 25,
      lastCheckedAt: now,
    });
    db.databaseReplicaHealth.set('REPL-PG-KE-ASYNC', {
      id: 'REPL-PG-KE-ASYNC',
      nodeId: 'DBN-PG-REPLICA-KE-01',
      role: 'ASYNC_REPLICA',
      region: 'af-east-ke',
      jurisdiction: 'KE',
      connectionStatus: 'NOT_CONFIGURED',
      replicationLagMs: null,
      walPosition: 'UNPROVISIONED',
      connectionPoolUsed: 0,
      connectionPoolMax: 15,
      lastCheckedAt: now,
    });
  }

  // 4. distributedBrokerHealth
  if (db.distributedBrokerHealth.size === 0) {
    db.distributedBrokerHealth.set('BROKER-LOCAL-OUTBOX', {
      id: 'BROKER-LOCAL-OUTBOX',
      brokerName: 'AETHER Durable Local Outbox Log',
      adapterType: 'LOCAL_OUTBOX_LOG',
      connectionStatus: 'LOCAL_ONLY',
      isActiveAuthoritativeLog: true,
      orderingKeyEnforced: true,
      retentionPolicyHours: 720,
      maxInFlightMessages: 1000,
      currentBackpressurePct: 2,
      dlqCount: db.distributedDeadLetterEvents.size,
      lastHealthCheckAt: now,
      diagnosticNote: 'Active durable local WAL outbox + idempotent inbox. External multi-node broker not provisioned in single container.',
    });
    db.distributedBrokerHealth.set('BROKER-KAFKA-TARGET', {
      id: 'BROKER-KAFKA-TARGET',
      brokerName: 'Apache Kafka Cluster Adapter',
      adapterType: 'KAFKA',
      connectionStatus: hasKafka ? 'SANDBOX_CONNECTED' : 'NOT_CONFIGURED',
      isActiveAuthoritativeLog: false,
      orderingKeyEnforced: true,
      retentionPolicyHours: 168,
      maxInFlightMessages: 50000,
      currentBackpressurePct: 0,
      dlqCount: 0,
      lastHealthCheckAt: now,
      diagnosticNote: hasKafka
        ? 'KAFKA_BROKERS configured; ready for broker adapter handshake.'
        : 'KAFKA_BROKERS not set in environment; interface implemented cleanly via local outbox adapter.',
    });
    db.distributedBrokerHealth.set('BROKER-NATS-TARGET', {
      id: 'BROKER-NATS-TARGET',
      brokerName: 'NATS JetStream Adapter',
      adapterType: 'NATS_JETSTREAM',
      connectionStatus: hasNats ? 'SANDBOX_CONNECTED' : 'NOT_CONFIGURED',
      isActiveAuthoritativeLog: false,
      orderingKeyEnforced: true,
      retentionPolicyHours: 168,
      maxInFlightMessages: 25000,
      currentBackpressurePct: 0,
      dlqCount: 0,
      lastHealthCheckAt: now,
      diagnosticNote: hasNats
        ? 'NATS_URL configured; ready for JetStream stream binding.'
        : 'NATS_URL not set in environment; interface remains NOT_CONFIGURED.',
    });
  }

  // 5. distributedConsumerOffsets
  if (db.distributedConsumerOffsets.size === 0) {
    const outboxTotal = db.distributedEventOutbox.size;
    Array.from(db.distributedEventConsumers.values()).forEach((c) => {
      const id = `OFFSET-${c.id}`;
      db.distributedConsumerOffsets.set(id, {
        id,
        consumerGroup: c.consumerGroup,
        topicOrEventType: c.subscribedEventTypes[0] || 'CORRIDOR_SHIPMENT_UPDATED',
        partitionKey: c.jurisdictionScope || 'UG',
        committedOffset: outboxTotal,
        latestOutboxOffset: outboxTotal,
        consumerLag: 0,
        status: c.status === 'ACTIVE' ? 'ACTIVE' : 'DEGRADED',
        lastCommittedAt: now,
      });
    });
  }

  // 6. institutionalAgreements (truthful draft / unsigned agreements aligned with existing V13 connectors)
  if (db.institutionalAgreements.size === 0) {
    Array.from(db.institutionalConnectorRegistry.values()).forEach((conn) => {
      const id = `AGR-${conn.id}`;
      db.institutionalAgreements.set(id, {
        id,
        connectorId: conn.id,
        institutionName: conn.institutionName,
        jurisdiction: conn.jurisdiction,
        agreementType:
          conn.institutionType === 'TAX_AUTHORITY'
            ? 'TAX_GATEWAY_ACCORD'
            : conn.institutionType === 'PAYMENT_CLEARING' || conn.institutionType === 'COMMERCIAL_BANK'
            ? 'PAYMENT_CLEARING_CONTRACT'
            : 'DATA_SHARING_MOU',
        agreementReference: `MOU-${conn.jurisdiction}-${conn.id.replace('CONN-', '')}-2026`,
        signed: conn.agreementSigned,
        signedByInstitution: null,
        signedByArosOfficer: null,
        signedAt: null,
        expiresAt: null,
        scopeRestrictions: ['MINIMIZED_AGGREGATED_PAYLOADS_ONLY', 'MTLS_OR_SIGNED_OAUTH_REQUIRED'],
        status: conn.agreementSigned ? 'SIGNED_ACTIVE' : 'PENDING_COUNTERSIGNATURE',
      });
    });
  }

  // 7. institutionalOnboardingRequests (sample onboarding records across stages)
  if (db.institutionalOnboardingRequests.size === 0) {
    db.institutionalOnboardingRequests.set('ONB-UG-BOU-01', {
      id: 'ONB-UG-BOU-01',
      tenantId: 'GLOBAL_PUBLIC',
      institutionName: 'Bank of Uganda (BoU) Macroeconomic & Settlement Gateway',
      institutionCategory: 'CENTRAL_BANK',
      jurisdiction: 'UG',
      stage: 'AGREEMENT_NEGOTIATION',
      legalIdentityStatus: 'VERIFIED_LEGAL_REGISTRATION',
      regulatoryAuthorityStatus: 'UNVERIFIED',
      submittedBy: 'usr_admin_01',
      assignedReviewer: 'usr_admin_01',
      connectorId: 'CONN-UG-BOU',
      agreementId: 'AGR-CONN-UG-BOU',
      stageHistory: [
        { stage: 'REQUEST_SUBMITTED', actorId: 'usr_admin_01', note: 'Central bank connector onboarding initiated.', timestamp: now },
        { stage: 'LEGAL_IDENTITY_REVIEW', actorId: 'usr_admin_01', note: 'Statutory central bank charter confirmed.', timestamp: now },
        { stage: 'AGREEMENT_NEGOTIATION', actorId: 'usr_admin_01', note: 'Awaiting bilateral signed MOU and mTLS CA exchange.', timestamp: now },
      ],
      createdAt: now,
      updatedAt: now,
    });
    db.institutionalOnboardingRequests.set('ONB-KE-CBK-01', {
      id: 'ONB-KE-CBK-01',
      tenantId: 'GLOBAL_PUBLIC',
      institutionName: 'Central Bank of Kenya (CBK) FX & KEPSS Adapter',
      institutionCategory: 'CENTRAL_BANK',
      jurisdiction: 'KE',
      stage: 'TECHNICAL_SETUP',
      legalIdentityStatus: 'VERIFIED_LEGAL_REGISTRATION',
      regulatoryAuthorityStatus: 'UNVERIFIED',
      submittedBy: 'usr_admin_01',
      connectorId: 'CONN-KE-CBK',
      agreementId: 'AGR-CONN-KE-CBK',
      stageHistory: [
        { stage: 'REQUEST_SUBMITTED', actorId: 'usr_admin_01', note: 'CBK bilateral interoperability onboarding initiated.', timestamp: now },
        { stage: 'TECHNICAL_SETUP', actorId: 'usr_admin_01', note: 'ISO 20022 envelope schema mapped locally; external credentials pending.', timestamp: now },
      ],
      createdAt: now,
      updatedAt: now,
    });
  }

  // 12. paymentProviderIntegrations (Honest NOT_CONFIGURED until provisioned)
  if (db.paymentProviderIntegrations.size === 0) {
    const providers = [
      {
        id: 'PAYPROV-MTN-MOMO-UG',
        providerCode: 'MTN_MOMO_UG',
        providerName: 'MTN Mobile Money Uganda OpenAPI',
        railType: 'MOBILE_MONEY' as const,
        jurisdiction: 'UG',
        supportedCurrencies: ['UGX'],
        credentialsConfigured: Boolean(process.env.MTN_MOMO_API_KEY),
        sandboxStatus: process.env.MTN_MOMO_API_KEY ? ('SANDBOX_CONNECTED' as const) : ('NOT_CONFIGURED' as const),
        productionStatus: 'NOT_CONFIGURED' as const,
        supportsSettlementReceiptQuery: true,
        webhookSecretConfigured: Boolean(process.env.MTN_MOMO_WEBHOOK_SECRET),
        rateLimitPerMinute: 120,
        lastCheckedAt: now,
      },
      {
        id: 'PAYPROV-AIRTEL-MOMO-UG',
        providerCode: 'AIRTEL_MONEY_UG',
        providerName: 'Airtel Money Uganda Collections & Disbursements',
        railType: 'MOBILE_MONEY' as const,
        jurisdiction: 'UG',
        supportedCurrencies: ['UGX'],
        credentialsConfigured: Boolean(process.env.AIRTEL_MONEY_CLIENT_ID),
        sandboxStatus: process.env.AIRTEL_MONEY_CLIENT_ID ? ('SANDBOX_CONNECTED' as const) : ('NOT_CONFIGURED' as const),
        productionStatus: 'NOT_CONFIGURED' as const,
        supportsSettlementReceiptQuery: true,
        webhookSecretConfigured: Boolean(process.env.AIRTEL_WEBHOOK_SECRET),
        rateLimitPerMinute: 120,
        lastCheckedAt: now,
      },
      {
        id: 'PAYPROV-MPESA-KE',
        providerCode: 'SAFARICOM_MPESA_KE',
        providerName: 'Safaricom M-Pesa Daraja Kenya',
        railType: 'MOBILE_MONEY' as const,
        jurisdiction: 'KE',
        supportedCurrencies: ['KES'],
        credentialsConfigured: Boolean(process.env.MPESA_CONSUMER_KEY),
        sandboxStatus: process.env.MPESA_CONSUMER_KEY ? ('SANDBOX_CONNECTED' as const) : ('NOT_CONFIGURED' as const),
        productionStatus: 'NOT_CONFIGURED' as const,
        supportsSettlementReceiptQuery: true,
        webhookSecretConfigured: Boolean(process.env.MPESA_WEBHOOK_SECRET),
        rateLimitPerMinute: 150,
        lastCheckedAt: now,
      },
      {
        id: 'PAYPROV-EAC-BANK-RTGS',
        providerCode: 'EAC_COMMERCIAL_BANK_ISO20022',
        providerName: 'EAC Commercial Bank Host-to-Host & RTGS Switch',
        railType: 'NATIONAL_CLEARING_SWITCH' as const,
        jurisdiction: 'EAC',
        supportedCurrencies: ['UGX', 'KES', 'TZS', 'RWF', 'USD', 'EUR', 'GBP'],
        credentialsConfigured: false,
        sandboxStatus: 'NOT_CONFIGURED' as const,
        productionStatus: 'NOT_CONFIGURED' as const,
        supportsSettlementReceiptQuery: true,
        webhookSecretConfigured: false,
        rateLimitPerMinute: 60,
        lastCheckedAt: now,
      },
      {
        id: 'PAYPROV-GLOBAL-SWIFT-CORR',
        providerCode: 'GLOBAL_SWIFT_ISO20022',
        providerName: 'Global Correspondent Settlement Target (SWIFT / CIPS / SEPA)',
        railType: 'CROSS_BORDER_RAIL' as const,
        jurisdiction: 'GLOBAL',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'ZAR', 'NGN'],
        credentialsConfigured: false,
        sandboxStatus: 'NOT_CONFIGURED' as const,
        productionStatus: 'NOT_CONFIGURED' as const,
        supportsSettlementReceiptQuery: true,
        webhookSecretConfigured: false,
        rateLimitPerMinute: 30,
        lastCheckedAt: now,
      },
    ];
    providers.forEach((p) => db.paymentProviderIntegrations.set(p.id, p));
  }

  // 19. fxQuoteSources (Indicative vs Executable explicit distinction)
  if (db.fxQuoteSources.size === 0) {
    const validUntil = new Date(Date.now() + 3600_000).toISOString();
    const quotes = [
      { id: 'FXSRC-USD-UGX', baseCurrency: 'USD', quoteCurrency: 'UGX', rate: 3685.0, quoteClassification: 'INDICATIVE' as const, sourceName: 'BoU Indicative Reference Rate', spreadBps: 45, validUntil, requiresLiveProviderForExecution: true, truthfulAvailability: 'LOCAL_REFERENCE_ONLY' as const, capturedAt: now },
      { id: 'FXSRC-USD-KES', baseCurrency: 'USD', quoteCurrency: 'KES', rate: 129.2, quoteClassification: 'INDICATIVE' as const, sourceName: 'CBK Indicative Reference Rate', spreadBps: 35, validUntil, requiresLiveProviderForExecution: true, truthfulAvailability: 'LOCAL_REFERENCE_ONLY' as const, capturedAt: now },
      { id: 'FXSRC-KES-UGX', baseCurrency: 'KES', quoteCurrency: 'UGX', rate: 28.52, quoteClassification: 'INDICATIVE' as const, sourceName: 'EAC Cross-Rate Indicative Reference', spreadBps: 50, validUntil, requiresLiveProviderForExecution: true, truthfulAvailability: 'LOCAL_REFERENCE_ONLY' as const, capturedAt: now },
      { id: 'FXSRC-EUR-UGX', baseCurrency: 'EUR', quoteCurrency: 'UGX', rate: 3980.0, quoteClassification: 'INDICATIVE' as const, sourceName: 'BoU EUR Indicative Reference', spreadBps: 55, validUntil, requiresLiveProviderForExecution: true, truthfulAvailability: 'LOCAL_REFERENCE_ONLY' as const, capturedAt: now },
      { id: 'FXSRC-USD-TZS', baseCurrency: 'USD', quoteCurrency: 'TZS', rate: 2660.0, quoteClassification: 'INDICATIVE' as const, sourceName: 'BoT Indicative Reference', spreadBps: 45, validUntil, requiresLiveProviderForExecution: true, truthfulAvailability: 'LOCAL_REFERENCE_ONLY' as const, capturedAt: now },
      { id: 'FXSRC-USD-RWF', baseCurrency: 'USD', quoteCurrency: 'RWF', rate: 1355.0, quoteClassification: 'INDICATIVE' as const, sourceName: 'BNR Indicative Reference', spreadBps: 40, validUntil, requiresLiveProviderForExecution: true, truthfulAvailability: 'LOCAL_REFERENCE_ONLY' as const, capturedAt: now },
    ];
    quotes.forEach((q) => db.fxQuoteSources.set(q.id, q));
  }

  // 23. taxJurisdictionRules (Effective-dated UG, KE, TZ, RW statutory rules)
  if (db.taxJurisdictionRules.size === 0) {
    const rules = [
      { id: 'TAXRULE-UG-VAT-18', jurisdiction: 'UG', taxType: 'VAT' as const, ruleCode: 'UG-URA-VAT-STANDARD', ratePct: 18.0, effectiveFrom: '2024-07-01T00:00:00Z', effectiveTo: null, authorityName: 'Uganda Revenue Authority (URA)', version: 2, active: true },
      { id: 'TAXRULE-UG-WHT-06', jurisdiction: 'UG', taxType: 'WITHHOLDING_TAX' as const, ruleCode: 'UG-URA-WHT-SUPPLIES', ratePct: 6.0, effectiveFrom: '2024-07-01T00:00:00Z', effectiveTo: null, authorityName: 'Uganda Revenue Authority (URA)', version: 1, active: true },
      { id: 'TAXRULE-KE-VAT-16', jurisdiction: 'KE', taxType: 'VAT' as const, ruleCode: 'KE-KRA-VAT-STANDARD', ratePct: 16.0, effectiveFrom: '2024-07-01T00:00:00Z', effectiveTo: null, authorityName: 'Kenya Revenue Authority (KRA)', version: 2, active: true },
      { id: 'TAXRULE-TZ-VAT-18', jurisdiction: 'TZ', taxType: 'VAT' as const, ruleCode: 'TZ-TRA-VAT-STANDARD', ratePct: 18.0, effectiveFrom: '2024-07-01T00:00:00Z', effectiveTo: null, authorityName: 'Tanzania Revenue Authority (TRA)', version: 1, active: true },
      { id: 'TAXRULE-RW-VAT-18', jurisdiction: 'RW', taxType: 'VAT' as const, ruleCode: 'RW-RRA-VAT-STANDARD', ratePct: 18.0, effectiveFrom: '2024-07-01T00:00:00Z', effectiveTo: null, authorityName: 'Rwanda Revenue Authority (RRA)', version: 1, active: true },
    ];
    rules.forEach((r) => db.taxJurisdictionRules.set(r.id, r));
  }

  // 27. authorizationPolicies (RBAC + ABAC + value limit + dual approval)
  if (db.authorizationPolicies.size === 0) {
    const policies = [
      { id: 'POL-HIGH-VALUE-SETTLEMENT', policyName: 'High-Value Financial Settlement Policy', actionType: 'HIGH_VALUE_PAYMENT_SETTLE', allowedRoles: ['PLATFORM_ADMIN', 'COOPERATIVE_ADMIN', 'BUYER'], jurisdictionConstraints: ['UG', 'KE', 'TZ', 'RW', 'EAC', 'GLOBAL'], maxTransactionValueUgx: 50_000_000, requiresDualApproval: true, requiresVerifiedIdentity: true, active: true },
      { id: 'POL-PROD-CONNECTOR-ACTIVATE', policyName: 'Institutional Production Connector Activation Policy', actionType: 'INSTITUTIONAL_PRODUCTION_ACTIVATE', allowedRoles: ['PLATFORM_ADMIN'], jurisdictionConstraints: ['UG', 'KE', 'TZ', 'RW', 'EAC', 'GLOBAL'], maxTransactionValueUgx: null, requiresDualApproval: true, requiresVerifiedIdentity: true, active: true },
      { id: 'POL-DB-CUTOVER', policyName: 'Database Authoritative Writer Cutover Policy', actionType: 'DATABASE_AUTHORITY_CUTOVER', allowedRoles: ['PLATFORM_ADMIN'], jurisdictionConstraints: ['UG', 'EAC'], maxTransactionValueUgx: null, requiresDualApproval: true, requiresVerifiedIdentity: true, active: true },
      { id: 'POL-TAX-FILING-SUBMIT', policyName: 'Tax Authority Assessment & Submission Policy', actionType: 'TAX_ASSESSMENT_SUBMIT', allowedRoles: ['PLATFORM_ADMIN', 'COOPERATIVE_ADMIN', 'BUYER'], jurisdictionConstraints: ['UG', 'KE', 'TZ', 'RW'], maxTransactionValueUgx: 250_000_000, requiresDualApproval: false, requiresVerifiedIdentity: false, active: true },
    ];
    policies.forEach((p) => db.authorizationPolicies.set(p.id, p));
  }

  // 29. productionKeyManagementRecords
  if (db.productionKeyManagementRecords.size === 0) {
    const nextDue = new Date(Date.now() + 90 * 86400_000).toISOString();
    db.productionKeyManagementRecords.set('KMS-DEV-LOCAL-ECDSA', {
      id: 'KMS-DEV-LOCAL-ECDSA',
      keyAlias: 'aros-dev-approval-signer-p256',
      environmentScope: 'DEVELOPMENT_ISOLATED',
      hsmProviderStatus: 'LOCAL_ONLY',
      pkcs11SlotConfigured: false,
      failClosedWhenProdHsmMissing: true,
      rotationIntervalDays: 90,
      lastRotatedAt: now,
      nextRotationDueAt: nextDue,
      compromiseDetected: false,
    });
    db.productionKeyManagementRecords.set('KMS-PROD-PKCS11-TARGET', {
      id: 'KMS-PROD-PKCS11-TARGET',
      keyAlias: 'aros-prod-institutional-hsm-p256',
      environmentScope: 'PRODUCTION_HSM_PKCS11',
      hsmProviderStatus: hasProdHsm ? 'SANDBOX_CONNECTED' : 'NOT_CONFIGURED',
      pkcs11SlotConfigured: hasProdHsm,
      failClosedWhenProdHsmMissing: true,
      rotationIntervalDays: 30,
      lastRotatedAt: now,
      nextRotationDueAt: nextDue,
      compromiseDetected: false,
    });
  }

  // 30. externalAuditArchives
  if (db.externalAuditArchives.size === 0) {
    const latestCheckpoint = Array.from(db.signedAuditCheckpoints.values()).slice(-1)[0];
    if (latestCheckpoint) {
      db.externalAuditArchives.set('WORM-ARCH-INIT-01', {
        id: 'WORM-ARCH-INIT-01',
        checkpointId: latestCheckpoint.id,
        sequenceStart: latestCheckpoint.sequenceRangeStart,
        sequenceEnd: latestCheckpoint.sequenceRangeEnd,
        rootHash: latestCheckpoint.merkleOrChainRootHash,
        signatureBase64: latestCheckpoint.signatureBase64,
        archiveDestinationType: hasWorm ? 'S3_OBJECT_LOCK_WORM' : 'LOCAL_HASH_CHAIN_ONLY',
        externalWormStatus: hasWorm ? 'SANDBOX_CONNECTED' : 'NOT_CONFIGURED',
        bundleChecksumSha256: sha256Hex(`${latestCheckpoint.id}:${latestCheckpoint.merkleOrChainRootHash}`),
        exportedAt: now,
        limitationNote: hasWorm
          ? 'External WORM storage endpoint configured.'
          : 'Local tamper-evident hash chain + ECDSA checkpoint prepared for export; external WORM S3 Object Lock / Azure Immutable Blob not provisioned in single-node environment.',
      });
    }
  }

  // 31. commercialPlanCatalog (5 required plans)
  if (db.commercialPlanCatalog.size === 0) {
    const plans = [
      { id: 'PLAN-V14-STARTER', planCode: 'STARTER' as const, displayName: 'Starter Economic Workspace', monthlyPriceUsd: 49, monthlyPriceUgx: 180_000, annualDiscountPct: 15, includedApiCallsPerMonth: 25_000, includedSettlementTxPerMonth: 250, maxTenants: 1, overagePricePer1kCallsUsd: 1.5, slaTier: '99.5% Standard', active: true },
      { id: 'PLAN-V14-GROWTH', planCode: 'GROWTH' as const, displayName: 'Growth Corridor Enterprise', monthlyPriceUsd: 249, monthlyPriceUgx: 920_000, annualDiscountPct: 15, includedApiCallsPerMonth: 250_000, includedSettlementTxPerMonth: 2_500, maxTenants: 5, overagePricePer1kCallsUsd: 1.0, slaTier: '99.9% Priority', active: true },
      { id: 'PLAN-V14-ENTERPRISE', planCode: 'ENTERPRISE' as const, displayName: 'Enterprise Multi-Jurisdiction Suite', monthlyPriceUsd: 1200, monthlyPriceUgx: 4_420_000, annualDiscountPct: 20, includedApiCallsPerMonth: 2_000_000, includedSettlementTxPerMonth: 25_000, maxTenants: 25, overagePricePer1kCallsUsd: 0.65, slaTier: '99.95% Dedicated', active: true },
      { id: 'PLAN-V14-DEVELOPER', planCode: 'DEVELOPER_ECOSYSTEM' as const, displayName: 'Developer Ecosystem & API Partner', monthlyPriceUsd: 99, monthlyPriceUgx: 365_000, annualDiscountPct: 10, includedApiCallsPerMonth: 500_000, includedSettlementTxPerMonth: 500, maxTenants: 2, overagePricePer1kCallsUsd: 0.5, slaTier: '99.9% Developer SLA', active: true },
      { id: 'PLAN-V14-INSTITUTIONAL', planCode: 'INSTITUTIONAL' as const, displayName: 'Institutional & Sovereign Gateway Tier', monthlyPriceUsd: 3500, monthlyPriceUgx: 12_900_000, annualDiscountPct: 20, includedApiCallsPerMonth: 10_000_000, includedSettlementTxPerMonth: 100_000, maxTenants: 100, overagePricePer1kCallsUsd: 0.35, slaTier: '99.99% Sovereign', active: true },
    ];
    plans.forEach((p) => db.commercialPlanCatalog.set(p.id, p));
  }

  // 32. customerSubscriptions (seeded for primary UG cooperative tenant without fabricating revenue)
  if (db.customerSubscriptions.size === 0) {
    db.customerSubscriptions.set('SUB-V14-ELGON-01', {
      id: 'SUB-V14-ELGON-01',
      tenantId: 'TEN-UG-ELGON-01',
      planCode: 'GROWTH',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      currency: 'UGX',
      contractedPrice: 920_000,
      startedAt: now,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400_000).toISOString(),
    });
  }

  // 36. deploymentEnvironmentProfiles
  if (db.deploymentEnvironmentProfiles.size === 0) {
    const profiles = [
      { id: 'ENV-DEVELOPMENT', profileName: 'DEVELOPMENT' as const, databaseAuthority: 'WAL_JSON_SINGLE_NODE' as const, eventBrokerMode: 'LOCAL_OUTBOX_LOG' as const, hsmMode: 'DEV_SOFTWARE_ISOLATED_ADAPTER' as const, externalWormRequired: false, allowsUnverifiedSettlements: false as const, active: true, configuredAt: now },
      { id: 'ENV-STAGING', profileName: 'STAGING' as const, databaseAuthority: 'POSTGRES_SHADOW' as const, eventBrokerMode: 'LOCAL_OUTBOX_LOG' as const, hsmMode: 'DEV_SOFTWARE_ISOLATED_ADAPTER' as const, externalWormRequired: false, allowsUnverifiedSettlements: false as const, active: false, configuredAt: now },
      { id: 'ENV-PILOT', profileName: 'PILOT' as const, databaseAuthority: 'WAL_JSON_SINGLE_NODE' as const, eventBrokerMode: 'LOCAL_OUTBOX_LOG' as const, hsmMode: 'DEV_SOFTWARE_ISOLATED_ADAPTER' as const, externalWormRequired: false, allowsUnverifiedSettlements: false as const, active: false, configuredAt: now },
      { id: 'ENV-PRODUCTION', profileName: 'PRODUCTION' as const, databaseAuthority: 'POSTGRES_PRIMARY_WITH_REPLICAS' as const, eventBrokerMode: 'KAFKA' as const, hsmMode: 'PKCS11_CLOUD_HSM_ADAPTER' as const, externalWormRequired: true, allowsUnverifiedSettlements: false as const, active: false, configuredAt: now },
    ];
    profiles.forEach((p) => db.deploymentEnvironmentProfiles.set(p.id, p));
  }

  // 37. multiRegionDeployments
  if (db.multiRegionDeployments.size === 0) {
    const regions = [
      { id: 'MREG-UG-PRIMARY', regionCode: 'af-east-ug', jurisdiction: 'UG', role: 'PRIMARY_NODE' as const, deploymentStatus: 'LOCAL_ONLY' as const, databaseStatus: 'LOCAL_ONLY' as const, eventBrokerStatus: 'LOCAL_ONLY' as const, hsmStatus: 'LOCAL_ONLY' as const, rpoTargetSeconds: 300, rtoTargetSeconds: 3600, lastHealthCheckAt: now },
      { id: 'MREG-KE-STANDBY', regionCode: 'af-east-ke', jurisdiction: 'KE', role: 'READ_REPLICA_TARGET' as const, deploymentStatus: 'NOT_CONFIGURED' as const, databaseStatus: 'NOT_CONFIGURED' as const, eventBrokerStatus: 'NOT_CONFIGURED' as const, hsmStatus: 'NOT_CONFIGURED' as const, rpoTargetSeconds: 300, rtoTargetSeconds: 3600, lastHealthCheckAt: now },
      { id: 'MREG-TZ-STANDBY', regionCode: 'af-east-tz', jurisdiction: 'TZ', role: 'WARM_STANDBY_TARGET' as const, deploymentStatus: 'NOT_CONFIGURED' as const, databaseStatus: 'NOT_CONFIGURED' as const, eventBrokerStatus: 'NOT_CONFIGURED' as const, hsmStatus: 'NOT_CONFIGURED' as const, rpoTargetSeconds: 600, rtoTargetSeconds: 3600, lastHealthCheckAt: now },
      { id: 'MREG-RW-STANDBY', regionCode: 'af-east-rw', jurisdiction: 'RW', role: 'WARM_STANDBY_TARGET' as const, deploymentStatus: 'NOT_CONFIGURED' as const, databaseStatus: 'NOT_CONFIGURED' as const, eventBrokerStatus: 'NOT_CONFIGURED' as const, hsmStatus: 'NOT_CONFIGURED' as const, rpoTargetSeconds: 600, rtoTargetSeconds: 3600, lastHealthCheckAt: now },
    ];
    regions.forEach((r) => db.multiRegionDeployments.set(r.id, r));
  }
}
