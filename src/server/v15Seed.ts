/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V15.0 - Global Economic Network Activation Seed
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';
import type { IndustrySectorV15 } from '../types/index.ts';

function sha256Hex(val: string): string {
  return `0x${crypto.createHash('sha256').update(val).digest('hex')}`;
}

export const ALL_16_SECTORS_V15: IndustrySectorV15[] = [
  'AGRICULTURE',
  'FOOD_PROCESSING',
  'MANUFACTURING',
  'CONSTRUCTION',
  'TRANSPORT',
  'LOGISTICS',
  'ENERGY',
  'TECHNOLOGY',
  'HEALTHCARE_SUPPLY_CHAINS',
  'EDUCATION_SERVICES',
  'RETAIL',
  'WHOLESALE',
  'TOURISM',
  'PROFESSIONAL_SERVICES',
  'MINING_SUPPLY_CHAINS',
  'EXPORT_INDUSTRIES',
];

export function seedV15Collections(db: ArosDatabase): void {
  const now = new Date().toISOString();
  const hasPg = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
  const hasKafkaOrNats = Boolean(process.env.KAFKA_BROKERS || process.env.NATS_URL);
  const hasHsm = Boolean(process.env.HSM_PKCS11_MODULE_PATH && process.env.HSM_SLOT_PIN);
  const hasWorm = Boolean(process.env.AUDIT_WORM_S3_BUCKET || process.env.AUDIT_WORM_ENDPOINT);

  // 1. V15 Pilot & Initial Network Economic Participants (explicitly consenting demo/pilot accounts)
  if (db.v15Participants.size === 0) {
    const participants = [
      {
        id: 'EP-UG-COOP-ELGON',
        tenantId: 'TEN-UG-ELGON-01',
        userId: 'usr_coop_01',
        displayName: 'Elgon Arabica Growers Cooperative Union (Pilot Cohort)',
        category: 'COOPERATIVE' as const,
        jurisdiction: 'UG',
        districtOrCity: 'Mbale',
        kycStatus: 'VERIFIED' as const,
        kybStatus: 'VERIFIED' as const,
        regulatoryAuthorized: true,
        verificationLevel: 'BUSINESS_VERIFIED' as const,
        trustScore: 86,
        trustScoreBasis: 'Pilot verified cooperative profile & fulfilled V14 warehouse receipts.',
        isPilotParticipant: true,
        pilotConsentRecorded: true,
      },
      {
        id: 'EP-UG-FARMER-SARAH',
        tenantId: 'TEN-UG-ELGON-01',
        userId: 'usr_farmer_01',
        displayName: 'Sarah Namubiru Smallholder Collective',
        category: 'FARMER' as const,
        jurisdiction: 'UG',
        districtOrCity: 'Mbale',
        kycStatus: 'VERIFIED' as const,
        kybStatus: 'NOT_APPLICABLE' as const,
        regulatoryAuthorized: false,
        verificationLevel: 'IDENTITY_VERIFIED' as const,
        trustScore: 81,
        trustScoreBasis: 'Verified cooperative member identity & delivery history.',
        isPilotParticipant: true,
        pilotConsentRecorded: true,
      },
      {
        id: 'EP-UG-SME-ROOFINGS',
        tenantId: 'TEN-UG-ROOFINGS-02',
        userId: 'usr_buyer_01',
        displayName: 'Kampala Agro-Industrial Procurement & Manufacturing Ltd',
        category: 'MANUFACTURER' as const,
        jurisdiction: 'UG',
        districtOrCity: 'Kampala',
        kycStatus: 'VERIFIED' as const,
        kybStatus: 'VERIFIED' as const,
        regulatoryAuthorized: true,
        verificationLevel: 'BUSINESS_VERIFIED' as const,
        trustScore: 88,
        trustScoreBasis: 'KYB reviewed entity with clean payment authorization history.',
        isPilotParticipant: true,
        pilotConsentRecorded: true,
      },
      {
        id: 'EP-UG-LOGISTICS-TRANS',
        tenantId: 'TEN-UG-ELGON-01',
        userId: 'usr_trans_01',
        displayName: 'Northern Corridor Freight & Cold-Chain Operators Ltd',
        category: 'LOGISTICS_PROVIDER' as const,
        jurisdiction: 'UG',
        districtOrCity: 'Jinja',
        kycStatus: 'VERIFIED' as const,
        kybStatus: 'VERIFIED' as const,
        regulatoryAuthorized: true,
        verificationLevel: 'BUSINESS_VERIFIED' as const,
        trustScore: 84,
        trustScoreBasis: 'Verified waybill handoff records along Kampala–Malaba corridor.',
        isPilotParticipant: true,
        pilotConsentRecorded: true,
      },
      {
        id: 'EP-KE-EXPORTER-01',
        tenantId: 'TEN-KE-ROASTERS-03',
        userId: 'usr_ke_buyer_01',
        displayName: 'East Africa Specialty Exporters & Roasters (KE)',
        category: 'EXPORTER' as const,
        jurisdiction: 'KE',
        districtOrCity: 'Nairobi',
        kycStatus: 'VERIFIED' as const,
        kybStatus: 'VERIFIED' as const,
        regulatoryAuthorized: true,
        verificationLevel: 'BUSINESS_VERIFIED' as const,
        trustScore: 85,
        trustScoreBasis: 'Verified EAC cross-border commercial buyer profile.',
        isPilotParticipant: false,
        pilotConsentRecorded: false,
      },
      {
        id: 'EP-UG-DEVLAB-01',
        tenantId: 'TEN-UG-DEVLAB-04',
        userId: 'usr_admin_01',
        displayName: 'VINEXSAH Platform Sandbox & API Integration Lab',
        category: 'DEVELOPER' as const,
        jurisdiction: 'UG',
        districtOrCity: 'Kampala',
        kycStatus: 'VERIFIED' as const,
        kybStatus: 'VERIFIED' as const,
        regulatoryAuthorized: true,
        verificationLevel: 'BUSINESS_VERIFIED' as const,
        trustScore: 90,
        trustScoreBasis: 'Verified internal platform developer tenant.',
        isPilotParticipant: false,
        pilotConsentRecorded: false,
      },
    ];

    participants.forEach((p) => {
      db.v15Participants.set(p.id, {
        ...p,
        accountStatus: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      db.v15BusinessLocations.set(`LOC-${p.id}`, {
        id: `LOC-${p.id}`,
        participantId: p.id,
        tenantId: p.tenantId,
        branchName: `${p.districtOrCity} Operations Hub`,
        jurisdiction: p.jurisdiction,
        cityOrDistrict: p.districtOrCity,
        addressSummary: `${p.districtOrCity}, ${p.jurisdiction}`,
        locationType: p.category === 'COOPERATIVE' ? 'COLLECTION_CENTER' : 'HEADQUARTERS',
        isPrimary: true,
        active: true,
        createdAt: now,
      });
    });

    db.v15EconomicProfiles.set('PROF-EP-UG-COOP-ELGON', {
      id: 'PROF-EP-UG-COOP-ELGON',
      participantId: 'EP-UG-COOP-ELGON',
      tenantId: 'TEN-UG-ELGON-01',
      primarySector: 'AGRICULTURE',
      secondarySectors: ['EXPORT_INDUSTRIES', 'FOOD_PROCESSING'],
      summary: 'Washed Arabica coffee & graded maize aggregation across 14 Mt. Elgon primary societies.',
      annualCapacityDescription: '1,800 MT seasonal agricultural output capacity.',
      operatingAreas: ['Mbale', 'Kapchorwa', 'Sironko', 'Kampala'],
      supportedCurrencies: ['UGX', 'KES', 'USD'],
      updatedAt: now,
    });
  }

  // 2. Seed initial Marketplace Listings, Service Listings & Market Opportunities
  if (db.v15EconomicListings.size === 0) {
    db.v15EconomicListings.set('LST-V15-UG-COFFEE-01', {
      id: 'LST-V15-UG-COFFEE-01',
      sellerParticipantId: 'EP-UG-COOP-ELGON',
      tenantId: 'TEN-UG-ELGON-01',
      marketType: 'WHOLESALE',
      sector: 'AGRICULTURE',
      title: 'AA Graded Washed Bugisu Arabica Coffee Beans (Lot Pilot-01)',
      description: 'Coffee moisture-tested, traceable Arabica export lot stored in Mbale dry warehouse.',
      jurisdiction: 'UG',
      unit: 'KG',
      unitPrice: 14500,
      currency: 'UGX',
      availableQuantity: 12000,
      minOrderQuantity: 500,
      verifiedSupplier: true,
      promotedPlacement: false,
      active: true,
      createdAt: now,
    });

    db.v15EconomicListings.set('LST-V15-UG-MAIZE-02', {
      id: 'LST-V15-UG-MAIZE-02',
      sellerParticipantId: 'EP-UG-COOP-ELGON',
      tenantId: 'TEN-UG-ELGON-01',
      marketType: 'BULK_PROCUREMENT',
      sector: 'FOOD_PROCESSING',
      title: 'Grade-1 Dried White Maize (Aflatoxin Tested)',
      description: 'Cleaned & bagged 100kg lots available for Kampala millers and institutional buyers.',
      jurisdiction: 'UG',
      unit: 'KG',
      unitPrice: 1850,
      currency: 'UGX',
      availableQuantity: 45000,
      minOrderQuantity: 1000,
      verifiedSupplier: true,
      promotedPlacement: false,
      active: true,
      createdAt: now,
    });
  }
  const seededCoffee = db.v15EconomicListings.get('LST-V15-UG-COFFEE-01');
  if (seededCoffee && !seededCoffee.title.toLowerCase().includes('coffee')) {
    seededCoffee.title = 'AA Graded Washed Bugisu Arabica Coffee Beans (Lot Pilot-01)';
    seededCoffee.description = 'Coffee moisture-tested, traceable Arabica export lot stored in Mbale dry warehouse.';
    db.v15EconomicListings.set('LST-V15-UG-COFFEE-01', seededCoffee);
  }

  if (db.v15ServiceListings.size === 0) {
    db.v15ServiceListings.set('SRV-V15-LOG-01', {
      id: 'SRV-V15-LOG-01',
      providerParticipantId: 'EP-UG-LOGISTICS-TRANS',
      tenantId: 'TEN-UG-ELGON-01',
      serviceCategory: 'FREIGHT',
      title: 'Kampala–Mbale–Malaba–Nairobi Insured Commercial Freight',
      jurisdictionCoverage: ['UG', 'KE', 'RW', 'TZ'],
      baseRate: 450000,
      currency: 'UGX',
      rateUnit: 'PER_TON_CORRIDOR',
      verifiedProvider: true,
      promotedPlacement: false,
      active: true,
      createdAt: now,
    });
  }

  if (db.v15MarketOpportunities.size === 0) {
    db.v15MarketOpportunities.set('OPP-V15-UG-01', {
      id: 'OPP-V15-UG-01',
      issuerParticipantId: 'EP-UG-SME-ROOFINGS',
      tenantId: 'TEN-UG-ROOFINGS-02',
      opportunityType: 'PROCUREMENT',
      title: 'Annual Food-Grade Grain & Packaging Supply Tender (Uganda Pilot)',
      sector: 'FOOD_PROCESSING',
      jurisdiction: 'UG',
      estimatedValue: 85000000,
      currency: 'UGX',
      eligibilitySummary: 'KYB/KYC verified cooperatives or SMEs with storage capacity.',
      outcomeDisclaimer: 'Application does not guarantee contract award; selection depends on quality and price verification.',
      status: 'OPEN',
      createdAt: now,
    });
  }

  // 3. Seed 16 Industrial Value Chains
  if (db.v15IndustryValueChains.size === 0) {
    ALL_16_SECTORS_V15.forEach((sector, idx) => {
      db.v15IndustryValueChains.set(`IVC-V15-${sector}`, {
        id: `IVC-V15-${sector}`,
        sector,
        title: `${sector.replace(/_/g, ' ')} Regional Value Network`,
        jurisdiction: idx % 2 === 0 ? 'UG' : 'EAC',
        nodesMapped: [
          { stage: 'PRODUCER', participantCount: sector === 'AGRICULTURE' ? 2 : 1, capacityNote: 'Initial pilot cohort mapped' },
          { stage: 'SUPPLIER' as any, participantCount: 1, capacityNote: 'Input & raw material tier' },
          { stage: 'PROCESSOR', participantCount: 1, capacityNote: 'Grading / value addition tier' },
          { stage: 'LOGISTICS', participantCount: 1, capacityNote: 'Corridor freight & warehousing' },
          { stage: 'BUYER', participantCount: 1, capacityNote: 'Domestic & cross-border off-takers' },
        ],
        identifiedBottlenecks: ['Live external payment/customs integration pending bilateral credential activation'],
        regulatoryRequirements: ['Jurisdiction KYB', 'Tax identification verification', 'Independent delivery proof'],
        updatedAt: now,
      });
    });
  }

  // 4. Seed V15 Provider-Neutral 8-State Integrations (honestly NOT_CONFIGURED until provisioned)
  if (db.v15ProviderIntegrations.size === 0) {
    const providers = [
      { id: 'V15-PROV-MTN-MOMO-UG', providerCode: 'MTN_MOMO_UG', providerName: 'MTN Mobile Money Uganda', railType: 'MOBILE_MONEY' as const, jurisdiction: 'UG', supportedCurrencies: ['UGX'] },
      { id: 'V15-PROV-AIRTEL-UG', providerCode: 'AIRTEL_MONEY_UG', providerName: 'Airtel Money Uganda', railType: 'MOBILE_MONEY' as const, jurisdiction: 'UG', supportedCurrencies: ['UGX'] },
      { id: 'V15-PROV-MPESA-KE', providerCode: 'SAFARICOM_MPESA_KE', providerName: 'Safaricom M-Pesa Kenya', railType: 'MOBILE_MONEY' as const, jurisdiction: 'KE', supportedCurrencies: ['KES'] },
      { id: 'V15-PROV-BANK-RTGS-EAC', providerCode: 'EAC_PARTICIPATING_BANKS_RTGS', providerName: 'Participating Banks & EAC RTGS Gateway', railType: 'RTGS' as const, jurisdiction: 'EAC', supportedCurrencies: ['UGX', 'KES', 'TZS', 'RWF', 'USD'] },
      { id: 'V15-PROV-INTL-SWIFT', providerCode: 'GLOBAL_SWIFT_CORRESPONDENT', providerName: 'International Correspondent Network (Target)', railType: 'INTERNATIONAL_RAIL' as const, jurisdiction: 'GLOBAL', supportedCurrencies: ['USD', 'EUR', 'GBP', 'CNY', 'JPY'] },
    ];
    providers.forEach((p) => {
      db.v15ProviderIntegrations.set(p.id, {
        ...p,
        lifecycleState: 'NOT_CONFIGURED',
        credentialsConfigured: false,
        sandboxValidated: false,
        productionAuthorized: false,
        licensingDisclosure: 'AETHER–AROS coordinates workflows via licensed third-party providers and does not operate as an unlicensed bank, PSP, or custodian.',
        availabilityStatus: 'NOT_CONFIGURED',
        lastHealthCheckAt: now,
      });
    });
  }

  // 5. Seed Corridor Activity Hubs
  if (db.v15CorridorActivities.size === 0) {
    const corridors = [
      { id: 'CORR-UG-KE-NORTHERN', corridorCode: 'NORTHERN_CORRIDOR', originCountry: 'UG', destinationCountry: 'KE', bottleneckNote: 'Malaba OSBP digital manifest pre-clearance active locally; official customs API unconfigured.' },
      { id: 'CORR-UG-TZ-CENTRAL', corridorCode: 'CENTRAL_CORRIDOR', originCountry: 'UG', destinationCountry: 'TZ', bottleneckNote: 'Mutukula corridor freight matching active; TRA/URA live bridge pending authorization.' },
      { id: 'CORR-UG-RW-SOUTHWEST', corridorCode: 'SOUTHWEST_CORRIDOR', originCountry: 'UG', destinationCountry: 'RW', bottleneckNote: 'Katuna/Gatuna trade coordination active.' },
      { id: 'CORR-UG-BI-GREAT_LAKES', corridorCode: 'GREAT_LAKES_CORRIDOR', originCountry: 'UG', destinationCountry: 'BI', bottleneckNote: 'Cross-border freight estimation active.' },
      { id: 'CORR-UG-SS-NIMULE', corridorCode: 'NIMULE_JUBA_CORRIDOR', originCountry: 'UG', destinationCountry: 'SS', bottleneckNote: 'Nimule agricultural supply tracking active.' },
      { id: 'CORR-UG-CD-MPONDWE', corridorCode: 'MPONDWE_EAC_CORRIDOR', originCountry: 'UG', destinationCountry: 'CD', bottleneckNote: 'Subject to lawful customs & cross-border controls.' },
    ];
    corridors.forEach((c) => {
      db.v15CorridorActivities.set(c.id, {
        ...c,
        activeShipments: 0,
        clearedShipments: 0,
        totalTradeValueUsdEquivalent: 0,
        updatedAt: now,
      });
    });
  }

  // 6. Seed Infrastructure Activations & Regional Service Statuses (Strictly Truthful)
  if (db.v15InfrastructureActivations.size === 0) {
    db.v15InfrastructureActivations.set('INFRA-PG-16', {
      id: 'INFRA-PG-16',
      component: 'POSTGRESQL_16',
      targetSpec: 'PostgreSQL 16 Primary + Read Replica + PITR',
      currentState: hasPg ? 'CONFIGURED_NOT_CONNECTED' : 'LOCAL_ONLY',
      poolOrClusterMetrics: { activeAuthority: 'JSON_WAL_ACTIVE', maxPoolSize: 20, activeConnections: 0 },
      slowQueriesDetected: 0,
      pitrEnabled: false,
      lastProbedAt: now,
      diagnosticMessage: hasPg
        ? 'PostgreSQL environment configured; awaiting live probe validation.'
        : 'Running cleanly on JSON_WAL_ACTIVE; no PostgreSQL instance provisioned in container.',
    });
    db.v15InfrastructureActivations.set('INFRA-EVENT-BUS', {
      id: 'INFRA-EVENT-BUS',
      component: 'KAFKA_OR_NATS',
      targetSpec: 'Multi-Node Kafka or NATS JetStream (At-Least-Once Idempotent)',
      currentState: hasKafkaOrNats ? 'CONFIGURED_NOT_CONNECTED' : 'LOCAL_ONLY',
      poolOrClusterMetrics: { localOutboxActive: true, externalBrokerConnected: false },
      slowQueriesDetected: 0,
      pitrEnabled: false,
      lastProbedAt: now,
      diagnosticMessage: 'Local transactional outbox active; external Kafka/NATS broker not provisioned.',
    });
    db.v15InfrastructureActivations.set('INFRA-HSM-PKCS11', {
      id: 'INFRA-HSM-PKCS11',
      component: 'PKCS11_HSM',
      targetSpec: 'Production PKCS#11 Hardware Security Module',
      currentState: hasHsm ? 'CONFIGURED_NOT_CONNECTED' : 'NOT_CONFIGURED',
      poolOrClusterMetrics: { silentProdToDevFallbackAllowed: false },
      slowQueriesDetected: 0,
      pitrEnabled: false,
      lastProbedAt: now,
      diagnosticMessage: 'Production PKCS#11 HSM not configured; silent fallback to dev keys strictly blocked.',
    });
    db.v15InfrastructureActivations.set('INFRA-WORM-AUDIT', {
      id: 'INFRA-WORM-AUDIT',
      component: 'EXTERNAL_WORM_ARCHIVE',
      targetSpec: 'External Immutable S3 Object Lock / Azure Blob WORM',
      currentState: hasWorm ? 'CONFIGURED_NOT_CONNECTED' : 'NOT_CONFIGURED',
      poolOrClusterMetrics: { localHashChainCheckpointsActive: true },
      slowQueriesDetected: 0,
      pitrEnabled: false,
      lastProbedAt: now,
      diagnosticMessage: 'Local signed hash-chain checkpoints operational; external WORM bucket unprovisioned.',
    });
  }
  if (!db.v15InfrastructureActivations.has('INFRA-MULTI-REGION')) {
    db.v15InfrastructureActivations.set('INFRA-MULTI-REGION', {
      id: 'INFRA-MULTI-REGION',
      component: 'MULTI_REGION_FAILOVER',
      targetSpec: 'EAC Active-Passive Regional Failover (UG Primary -> KE Standby)',
      currentState: 'NOT_CONFIGURED',
      poolOrClusterMetrics: { activeActiveClaimed: false, failoverRegionsProvisioned: 0 },
      slowQueriesDetected: 0,
      pitrEnabled: false,
      lastProbedAt: now,
      diagnosticMessage: 'Regional KE/TZ/RW standby nodes unprovisioned; zero false active-active claims.',
    });
  }
  if (!db.v15InfrastructureActivations.has('INFRA-OBSERVABILITY')) {
    db.v15InfrastructureActivations.set('INFRA-OBSERVABILITY', {
      id: 'INFRA-OBSERVABILITY',
      component: 'OBSERVABILITY_MONITORING',
      targetSpec: 'OpenTelemetry / Prometheus Scrape & Slow-Query Threshold',
      currentState: 'LOCAL_ONLY',
      poolOrClusterMetrics: { slowQueryThresholdMs: 100, localMetricsActive: true },
      slowQueriesDetected: 0,
      pitrEnabled: false,
      lastProbedAt: now,
      diagnosticMessage: 'Local latency and telemetry collectors active; external Prometheus target unconfigured.',
    });
  }
  if (!db.distributedEventSchemas.has('EVS-V15-NET-ACT')) {
    db.distributedEventSchemas.set('EVS-V15-NET-ACT', {
      id: 'EVS-V15-NET-ACT',
      eventType: 'v15.network.activation',
      category: 'AUDIT',
      containsRestrictedPayloadRefsOnly: false,
      schemaVersion: '15.0',
      requiredFields: ['id', 'eventType', 'schemaVersion', 'producer', 'timestamp', 'jurisdiction', 'correlationId', 'idempotencyKey', 'integrityHash'],
      retentionDays: 2555,
      backwardCompatibleWith: ['1.0.0', '15.0'],
      registeredAt: now,
    });
  }

  if (db.v15RegionalServiceStatuses.size === 0) {
    [
      { id: 'REG-SRV-UG', regionCode: 'af-east-ug', jurisdiction: 'UG', role: 'PRIMARY_CANDIDATE' as const, readinessState: 'LOCAL_ONLY' as const, databaseBound: 'JSON_WAL_ACTIVE' },
      { id: 'REG-SRV-KE', regionCode: 'af-east-ke', jurisdiction: 'KE', role: 'REGIONAL_CANDIDATE' as const, readinessState: 'NOT_CONFIGURED' as const, databaseBound: 'UNPROVISIONED' },
      { id: 'REG-SRV-TZ', regionCode: 'af-east-tz', jurisdiction: 'TZ', role: 'REGIONAL_CANDIDATE' as const, readinessState: 'NOT_CONFIGURED' as const, databaseBound: 'UNPROVISIONED' },
      { id: 'REG-SRV-RW', regionCode: 'af-east-rw', jurisdiction: 'RW', role: 'REGIONAL_CANDIDATE' as const, readinessState: 'NOT_CONFIGURED' as const, databaseBound: 'UNPROVISIONED' },
    ].forEach((r) => {
      db.v15RegionalServiceStatuses.set(r.id, {
        ...r,
        sovereignPolicyId: `SDP-${r.jurisdiction}-01`,
        activeActiveClaimed: false,
        lastCheckedAt: now,
      });
    });
  }

  // 7. Seed Initial Controlled Uganda Pilot Cohort Tracker
  if (db.v15PilotOperations.size === 0) {
    db.v15PilotOperations.set('PILOT-UG-001', {
      id: 'PILOT-UG-001',
      pilotCode: 'UG-PILOT-COHORT-01',
      tenantId: 'TEN-UG-ELGON-01',
      jurisdiction: 'UG',
      producerParticipantId: 'EP-UG-COOP-ELGON',
      buyerParticipantId: 'EP-UG-SME-ROOFINGS',
      logisticsParticipantId: 'EP-UG-LOGISTICS-TRANS',
      listingId: 'LST-V15-UG-COFFEE-01',
      currentStepNumber: 4,
      currentStepName: 'Product or service listing active for consenting pilot participants',
      usesLivePaymentRail: false,
      nonProductionWorkflowDisclosed: true,
      operationalIssues: ['Live MoMo & BoU credentials pending external provider onboarding.'],
      participantFeedback: ['Pilot cooperative requested offline waybill capture prior to Kampala dispatch.'],
      status: 'ACTIVE_IN_PROGRESS',
      updatedAt: now,
    });
  }

  // 8. Initial Sandbox Developer App (Client Secret stored hashed only)
  if (db.v15DeveloperApplications.size === 0) {
    db.v15DeveloperApplications.set('DEVAPP-V15-01', {
      id: 'DEVAPP-V15-01',
      developerParticipantId: 'EP-UG-DEVLAB-01',
      tenantId: 'TEN-UG-DEVLAB-04',
      appName: 'AETHER-AROS Uganda Pilot ERP Connector',
      authMode: 'OAUTH2_CLIENT_CREDENTIALS',
      clientId: 'aros_v15_dev_client_01',
      apiSecretHashSha256: sha256Hex('DEV-SANDBOX-APP-SECRET-01'),
      secretPreviewRedacted: 'aros_sec_********01',
      scopes: ['discovery:read', 'marketplace:read', 'impact:read'],
      rateLimitPerMinute: 120,
      environment: 'SANDBOX',
      status: 'ACTIVE',
      createdAt: now,
    });
  }
}
