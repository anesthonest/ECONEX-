/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V11.0 - Global Economic Network Scale Seed & Migration Helpers
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import type { ArosDatabase } from './db.ts';
import type {
  TenantRecord,
  TenantMembership,
  ParticipantOnboardingApplication,
  BusinessWorkspaceProfile,
  BusinessCatalogItem,
  BusinessCommercialDoc,
  BusinessTaskItem,
  ParticipantRelationshipRecord,
  ConnectionRequestRecord,
  NetworkMarketplaceListing,
  V11ProcurementRequest,
  SupplierQualificationRecord,
  LogisticsCarrierProfile,
  VerifiedProviderProfile,
  RegisteredEcosystemApp,
  IndustrialCapacityRecord,
  WorkServiceOpportunity,
  NetworkAnalyticalInsight,
  GovernedAiAgentIdentity,
  AiAgentActionLog,
  TenantSubscriptionRecord,
  TenantBillingInvoice,
} from '../types/index.ts';

export function seedV11Collections(db: ArosDatabase): void {
  const now = new Date().toISOString();

  // 1. Multi-Tenant Organizations
  if (db.tenants.size === 0) {
    const seedTenants: TenantRecord[] = [
      {
        id: 'TEN-UG-ELGON-01',
        slug: 'elgon-arabica-union',
        legalName: 'Uganda Arabica Exporters Cooperative Union',
        organizationType: 'COOPERATIVE',
        jurisdiction: 'UG',
        primaryAdminUserId: 'usr_coop_01',
        status: 'ACTIVE',
        dataOwnershipPolicy: {
          residencyCountry: 'UG',
          retainAuthoritativeControl: true,
          retentionDays: 2555,
          allowCrossBorderAnalytics: true,
        },
        billingPlanId: 'PLAN-BIZ-02',
        integrationEnvironment: 'SANDBOX',
        createdAt: '2026-01-12T08:00:00Z',
        updatedAt: now,
      },
      {
        id: 'TEN-UG-ROOFINGS-02',
        slug: 'roofings-rolling-mills',
        legalName: 'Roofings Rolling Mills Ltd (Namanve Industrial Park)',
        organizationType: 'BUSINESS',
        jurisdiction: 'UG',
        primaryAdminUserId: 'usr_buyer_01',
        status: 'ACTIVE',
        dataOwnershipPolicy: {
          residencyCountry: 'UG',
          retainAuthoritativeControl: true,
          retentionDays: 2555,
          allowCrossBorderAnalytics: true,
        },
        billingPlanId: 'PLAN-BIZ-02',
        integrationEnvironment: 'SANDBOX',
        createdAt: '2026-02-01T09:30:00Z',
        updatedAt: now,
      },
      {
        id: 'TEN-KE-ROASTERS-03',
        slug: 'nairobi-specialty-roasters',
        legalName: 'Nairobi Specialty Roasters & Blenders Ltd',
        organizationType: 'BUSINESS',
        jurisdiction: 'KE',
        primaryAdminUserId: 'usr_buyer_02',
        status: 'ACTIVE',
        dataOwnershipPolicy: {
          residencyCountry: 'KE',
          retainAuthoritativeControl: true,
          retentionDays: 2555,
          allowCrossBorderAnalytics: false,
        },
        billingPlanId: 'PLAN-BIZ-02',
        integrationEnvironment: 'SANDBOX',
        createdAt: '2026-02-14T10:00:00Z',
        updatedAt: now,
      },
      {
        id: 'TEN-UG-DEVLAB-04',
        slug: 'kampala-fintech-labs',
        legalName: 'Kampala Open Commerce & API Labs Ltd',
        organizationType: 'DEVELOPER_ORG',
        jurisdiction: 'UG',
        primaryAdminUserId: 'usr_admin_01',
        status: 'ACTIVE',
        dataOwnershipPolicy: {
          residencyCountry: 'UG',
          retainAuthoritativeControl: true,
          retentionDays: 1095,
          allowCrossBorderAnalytics: true,
        },
        billingPlanId: 'PLAN-DEV-01',
        integrationEnvironment: 'SANDBOX',
        createdAt: '2026-03-05T11:00:00Z',
        updatedAt: now,
      },
    ];
    seedTenants.forEach((t) => db.tenants.set(t.id, t));
  }

  // 2. Tenant Memberships
  if (db.tenantMemberships.size === 0) {
    const seedMembers: TenantMembership[] = [
      {
        id: 'MEM-001',
        tenantId: 'TEN-UG-ELGON-01',
        userId: 'usr_coop_01',
        userName: 'John Baptist Okello',
        email: 'coop.elgon@aros.ug',
        role: 'TENANT_ADMIN',
        attributes: ['EXPORT_SIGNATORY', 'TREASURY_VIEW', 'PROCUREMENT_APPROVER'],
        status: 'ACTIVE',
        invitedBy: 'system-bootstrap',
        joinedAt: '2026-01-12T08:00:00Z',
      },
      {
        id: 'MEM-002',
        tenantId: 'TEN-UG-ELGON-01',
        userId: 'usr_farmer_01',
        userName: 'Sarah Namubiru',
        email: 'farmer.sarah@aros.ug',
        role: 'MEMBER',
        attributes: ['PRODUCER_DELIVERY'],
        status: 'ACTIVE',
        invitedBy: 'usr_coop_01',
        joinedAt: '2026-01-15T10:00:00Z',
      },
      {
        id: 'MEM-003',
        tenantId: 'TEN-UG-ROOFINGS-02',
        userId: 'usr_buyer_01',
        userName: 'David Kigozi',
        email: 'buyer.david@aros.ug',
        role: 'TENANT_ADMIN',
        attributes: ['PROCUREMENT_APPROVER', 'FINANCE_SIGNATORY'],
        status: 'ACTIVE',
        invitedBy: 'system-bootstrap',
        joinedAt: '2026-02-01T09:30:00Z',
      },
      {
        id: 'MEM-004',
        tenantId: 'TEN-KE-ROASTERS-03',
        userId: 'usr_buyer_02',
        userName: 'Wanjiku Mwangi',
        email: 'procurement@nairobispecialty.ke',
        role: 'TENANT_ADMIN',
        attributes: ['IMPORT_SIGNATORY', 'TREASURY_VIEW'],
        status: 'ACTIVE',
        invitedBy: 'system-bootstrap',
        joinedAt: '2026-02-14T10:00:00Z',
      },
    ];
    seedMembers.forEach((m) => db.tenantMemberships.set(m.id, m));
  }

  // 3. Participant Onboarding Applications
  if (db.onboardingApplications.size === 0) {
    const seedOnboarding: ParticipantOnboardingApplication[] = [
      {
        id: 'ONB-2026-001',
        tenantId: 'TEN-UG-ELGON-01',
        participantType: 'BUSINESS',
        legalOrFullName: 'Uganda Arabica Exporters Cooperative Union',
        email: 'coop.elgon@aros.ug',
        phone: '+256 772 410 880',
        jurisdiction: 'UG',
        registrationOrNationalId: 'URSB-COOP-80021459',
        taxId: 'URA-TIN-1004599812',
        declaredCapabilities: ['COFFEE_PROCESSING', 'EXPORT_AGGREGATION', 'WAREHOUSING'],
        authorizedRepresentatives: [{ name: 'John Baptist Okello', role: 'Managing Director', email: 'coop.elgon@aros.ug' }],
        consentGranted: true,
        consentTimestamp: '2026-01-12T08:00:00Z',
        status: 'ACTIVATION',
        evidenceDocuments: [
          {
            id: 'DOC-ONB-01',
            documentType: 'URSB Certificate of Registration',
            fileName: 'ursb_elgon_coop_2026.pdf',
            documentHash: '0x71a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
            classification: 'CORPORATE_REGISTRATION',
            verificationStatus: 'INDEPENDENTLY_VERIFIED',
            uploadedAt: '2026-01-12T08:05:00Z',
            verifiedBy: 'compliance-officer@aros.ug',
          },
        ],
        duplicateCheckStatus: 'CLEAR',
        verificationClaimType: 'INDEPENDENTLY_VERIFIED',
        renewalDueAt: '2027-01-12T08:00:00Z',
        auditHistory: [
          { timestamp: '2026-01-12T08:00:00Z', action: 'APPLICATION_SUBMITTED', actor: 'coop.elgon@aros.ug' },
          { timestamp: '2026-01-13T14:00:00Z', action: 'ACTIVATED', actor: 'compliance-officer@aros.ug' },
        ],
        createdAt: '2026-01-12T08:00:00Z',
        updatedAt: now,
      },
      {
        id: 'ONB-2026-002',
        tenantId: 'TEN-UG-ROOFINGS-02',
        participantType: 'INDIVIDUAL',
        legalOrFullName: 'Grace Nabwire (Certified Customs Clearing Agent)',
        email: 'grace.nabwire@eaclearing.ug',
        phone: '+256 701 332 910',
        jurisdiction: 'UG',
        registrationOrNationalId: 'NIRA-CF900124881X',
        declaredCapabilities: ['CUSTOMS_DECLARATION', 'MALABA_OSBP_CLEARING'],
        authorizedRepresentatives: [],
        consentGranted: true,
        consentTimestamp: '2026-10-15T10:00:00Z',
        status: 'DOCUMENT_REVIEW',
        evidenceDocuments: [
          {
            id: 'DOC-ONB-02',
            documentType: 'National ID (Redacted Hash)',
            fileName: 'nira_id_verified.pdf',
            documentHash: '0x998811223344556677889900aabbccddeeff1122',
            classification: 'SENSITIVE_IDENTITY',
            verificationStatus: 'PENDING_REVIEW',
            uploadedAt: '2026-10-15T10:05:00Z',
          },
        ],
        duplicateCheckStatus: 'CLEAR',
        verificationClaimType: 'SELF_DECLARED',
        auditHistory: [
          { timestamp: '2026-10-15T10:00:00Z', action: 'APPLICATION_SUBMITTED', actor: 'grace.nabwire@eaclearing.ug' },
        ],
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: now,
      },
    ];
    seedOnboarding.forEach((o) => db.onboardingApplications.set(o.id, o));
  }

  // 4. Business Workspaces, Catalog, Commercial Docs & Tasks
  if (db.businessWorkspaces.size === 0) {
    const seedWorkspaces: BusinessWorkspaceProfile[] = [
      {
        id: 'BIZ-WS-01',
        tenantId: 'TEN-UG-ELGON-01',
        businessName: 'Uganda Arabica Exporters Cooperative Union',
        sector: 'Agro-Processing & Specialty Export',
        jurisdiction: 'UG',
        locations: [
          { id: 'LOC-01', label: 'Mbale Central Wet Mill & Silos', city: 'Mbale', country: 'UG', isPrimary: true },
          { id: 'LOC-02', label: 'Kampala Export Dispatch Desk', city: 'Kampala', country: 'UG', isPrimary: false },
        ],
        representatives: [
          { name: 'John Baptist Okello', title: 'Managing Director', verificationStatus: 'VERIFIED' },
          { name: 'Esther Wambui', title: 'Head of Export Logistics', verificationStatus: 'SELF_DECLARED' },
        ],
        verificationStatus: 'VERIFIED',
        statutoryDisclaimer:
          'AETHER–AROS provides operational workspace tooling; accounting, tax filing, and banking remain governed by licensed institutions.',
        updatedAt: now,
      },
      {
        id: 'BIZ-WS-02',
        tenantId: 'TEN-UG-ROOFINGS-02',
        businessName: 'Roofings Rolling Mills Ltd',
        sector: 'Industrial Manufacturing & Construction Steel',
        jurisdiction: 'UG',
        locations: [
          { id: 'LOC-03', label: 'Namanve Industrial Plant', city: 'Mukono', country: 'UG', isPrimary: true },
        ],
        representatives: [
          { name: 'David Kigozi', title: 'Procurement & Supply Lead', verificationStatus: 'VERIFIED' },
        ],
        verificationStatus: 'VERIFIED',
        statutoryDisclaimer:
          'AETHER–AROS provides operational workspace tooling; accounting, tax filing, and banking remain governed by licensed institutions.',
        updatedAt: now,
      },
    ];
    seedWorkspaces.forEach((w) => db.businessWorkspaces.set(w.id, w));
  }

  if (db.businessCatalogItems.size === 0) {
    const seedCatalog: BusinessCatalogItem[] = [
      {
        id: 'CAT-001',
        tenantId: 'TEN-UG-ELGON-01',
        sku: 'ELG-ARAB-AA-60',
        name: 'Mt. Elgon Washed Arabica Grade AA (60kg Jute Bag)',
        itemType: 'PRODUCT',
        category: 'Agricultural Commodities',
        unit: '60kg Bag',
        unitPrice: 700000,
        currency: 'UGX',
        availableStockOrCapacity: 1450,
        status: 'ACTIVE',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'CAT-002',
        tenantId: 'TEN-UG-ROOFINGS-02',
        sku: 'RRM-BS4449-12MM',
        name: 'High-Tensile Ribbed Rebar 12mm (BS4449 Grade 500B)',
        itemType: 'INDUSTRIAL_INPUT',
        category: 'Construction Steel',
        unit: 'Metric Tonne',
        unitPrice: 3650000,
        currency: 'UGX',
        availableStockOrCapacity: 820,
        status: 'ACTIVE',
        createdAt: '2026-09-12T08:00:00Z',
      },
    ];
    seedCatalog.forEach((c) => db.businessCatalogItems.set(c.id, c));
  }

  if (db.businessCommercialDocs.size === 0) {
    const seedDocs: BusinessCommercialDoc[] = [
      {
        id: 'BDOC-001',
        tenantId: 'TEN-UG-ELGON-01',
        docNumber: 'INV-ELG-2026-019',
        docType: 'INVOICE',
        counterpartyName: 'Nairobi Specialty Roasters & Blenders Ltd',
        counterpartyTenantId: 'TEN-KE-ROASTERS-03',
        lineItems: [{ description: 'Washed Arabica Grade AA (60kg bags)', quantity: 200, unitPrice: 700000, total: 140000000 }],
        subtotal: 140000000,
        taxAmount: 0,
        totalAmount: 140000000,
        currency: 'UGX',
        status: 'ISSUED',
        dueDate: '2026-11-30',
        createdBy: 'usr_coop_01',
        createdAt: '2026-11-05T12:00:00Z',
      },
      {
        id: 'BDOC-002',
        tenantId: 'TEN-UG-ROOFINGS-02',
        docNumber: 'PO-RRM-2026-402',
        docType: 'PURCHASE_ORDER',
        counterpartyName: 'Hima Lime & Flux Supply Cooperative',
        lineItems: [{ description: 'Industrial Quicklime Flux (MT)', quantity: 80, unitPrice: 250000, total: 20000000 }],
        subtotal: 20000000,
        taxAmount: 3600000,
        totalAmount: 23600000,
        currency: 'UGX',
        status: 'ACCEPTED',
        createdBy: 'usr_buyer_01',
        createdAt: '2026-11-08T09:00:00Z',
      },
    ];
    seedDocs.forEach((d) => db.businessCommercialDocs.set(d.id, d));
  }

  if (db.businessTasks.size === 0) {
    const seedTasks: BusinessTaskItem[] = [
      {
        id: 'TASK-001',
        tenantId: 'TEN-UG-ELGON-01',
        title: 'Submit UCDA Phytosanitary Certificate for Lot #ELG-44',
        assignedTo: 'Esther Wambui',
        department: 'Export Compliance',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: '2026-11-18',
        createdAt: '2026-11-10T08:00:00Z',
      },
    ];
    seedTasks.forEach((t) => db.businessTasks.set(t.id, t));
  }

  // 5. Relationship Graph & Connection Requests
  if (db.participantRelationships.size === 0) {
    const seedRels: ParticipantRelationshipRecord[] = [
      {
        id: 'REL-V11-001',
        tenantId: 'TEN-UG-ELGON-01',
        sourceParticipantId: 'TEN-UG-ELGON-01',
        sourceParticipantName: 'Uganda Arabica Exporters Cooperative Union',
        targetParticipantId: 'TEN-KE-ROASTERS-03',
        targetParticipantName: 'Nairobi Specialty Roasters & Blenders Ltd',
        relationshipType: 'SUPPLIER',
        jurisdiction: 'UG-KE',
        visibility: 'BILATERAL_ONLY',
        evidenceRef: 'AGR-2026-UGKE-001',
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        authorizedContacts: ['John Baptist Okello', 'Wanjiku Mwangi'],
        createdAt: '2026-03-01T09:00:00Z',
      },
      {
        id: 'REL-V11-002',
        tenantId: 'TEN-UG-ROOFINGS-02',
        sourceParticipantId: 'TEN-UG-ROOFINGS-02',
        sourceParticipantName: 'Roofings Rolling Mills Ltd',
        targetParticipantId: 'CARR-TRANSEAST-01',
        targetParticipantName: 'TransEast Freight Logistics Corporation',
        relationshipType: 'LOGISTICS_PROVIDER',
        jurisdiction: 'UG-RW',
        visibility: 'NETWORK_PARTICIPANTS',
        evidenceRef: 'CON-LOG-2026-11',
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        authorizedContacts: ['David Kigozi'],
        createdAt: '2026-04-12T11:00:00Z',
      },
    ];
    seedRels.forEach((r) => db.participantRelationships.set(r.id, r));
  }

  if (db.connectionRequests.size === 0) {
    const seedConn: ConnectionRequestRecord[] = [
      {
        id: 'CONN-REQ-001',
        fromTenantId: 'TEN-UG-ROOFINGS-02',
        fromName: 'Roofings Rolling Mills Ltd',
        toTenantId: 'TEN-UG-ELGON-01',
        toName: 'Uganda Arabica Exporters Cooperative Union',
        proposedRelationshipType: 'LOGISTICS_PROVIDER',
        message: 'Coordinate shared Kampala-Malaba return freight backhaul capacity.',
        status: 'PENDING',
        createdAt: '2026-11-11T10:00:00Z',
      },
    ];
    seedConn.forEach((c) => db.connectionRequests.set(c.id, c));
  }

  // 6. Network Opportunity Marketplace Listings
  if (db.networkMarketplaceListings.size === 0) {
    const seedListings: NetworkMarketplaceListing[] = [
      {
        id: 'MKT-V11-001',
        tenantId: 'TEN-UG-ELGON-01',
        publisherName: 'Uganda Arabica Exporters Cooperative Union',
        listingType: 'PRODUCT',
        title: 'Washed Mt. Elgon Grade AA Arabica Green Coffee (Export Ready)',
        description: 'Moisture <= 11.8%, screen 18, cupped 85.5 SCA. Available FCA Malaba or FOB Mombasa.',
        jurisdiction: 'UG',
        currency: 'UGX',
        unitPrice: 700000,
        unit: '60kg bag',
        minOrderQuantity: 50,
        availableQuantity: 1450,
        claimClassification: 'VERIFIED_BUSINESS_LISTING',
        verificationNotes: 'Publisher URSB & UCDA export registry checked; batch quality self-declared pending buyer assay.',
        status: 'ACTIVE',
        offers: [],
        fraudReportsCount: 0,
        expiresAt: '2027-02-28T23:59:59Z',
        createdAt: '2026-11-01T08:00:00Z',
      },
      {
        id: 'MKT-V11-002',
        tenantId: 'TEN-UG-ROOFINGS-02',
        publisherName: 'Roofings Rolling Mills Ltd',
        listingType: 'PRODUCTION_CAPACITY',
        title: 'Namanve Hot-Rolling Steel Line — Q1 Custom B2B Fabrication Allocation',
        description: 'Open rolling mill capacity for structural angles, channels, and BS4449 rebar contracts.',
        jurisdiction: 'UG',
        currency: 'USD',
        unitPrice: 890,
        unit: 'Metric Tonne',
        minOrderQuantity: 25,
        availableQuantity: 600,
        claimClassification: 'VERIFIED_BUSINESS_LISTING',
        verificationNotes: 'Verified business entity; UNBS conformity certification attached per production lot.',
        status: 'ACTIVE',
        offers: [],
        fraudReportsCount: 0,
        expiresAt: '2027-03-31T23:59:59Z',
        createdAt: '2026-11-03T09:00:00Z',
      },
      {
        id: 'MKT-V11-003',
        tenantId: 'TEN-UG-DEVLAB-04',
        publisherName: 'Kampala Open Commerce & API Labs Ltd',
        listingType: 'TECH_SERVICE',
        title: 'ERP-to-EFRIS & ISO 20022 Integration Engineering Retainer',
        description: 'Advisory and sandbox adapter onboarding for East African mid-market manufacturers.',
        jurisdiction: 'UG',
        currency: 'USD',
        unitPrice: 1800,
        unit: 'Monthly Retainer',
        minOrderQuantity: 1,
        availableQuantity: 5,
        claimClassification: 'PARTICIPANT_SUBMITTED_CLAIM',
        verificationNotes: 'Participant-submitted service capability; AETHER–AROS does not warrant service outcomes.',
        status: 'ACTIVE',
        offers: [],
        fraudReportsCount: 0,
        expiresAt: '2027-06-30T23:59:59Z',
        createdAt: '2026-11-06T12:00:00Z',
      },
    ];
    seedListings.forEach((l) => db.networkMarketplaceListings.set(l.id, l));
  }

  // 7. Procurement & Supplier Qualifications
  if (db.v11ProcurementRequests.size === 0) {
    const seedProc: V11ProcurementRequest[] = [
      {
        id: 'PROC-V11-001',
        tenantId: 'TEN-UG-ROOFINGS-02',
        referenceNumber: 'SOURCING-2026-089',
        procurementScope: 'INDUSTRIAL',
        title: 'Annual Supply of Industrial Quicklime Flux & Refractory Consumables',
        category: 'Industrial Raw Materials',
        jurisdiction: 'UG',
        budgetAmount: 180000000,
        currency: 'UGX',
        evaluationCriteria: [
          { criterion: 'CaO Purity >= 90%', weightPct: 40 },
          { criterion: 'Delivered Unit Price', weightPct: 35 },
          { criterion: 'Delivery Lead Time Reliability', weightPct: 25 },
        ],
        officialGovernmentPortalLinked: false,
        status: 'OPEN',
        bids: [
          {
            id: 'BID-001',
            supplierTenantId: 'TEN-UG-ELGON-01',
            supplierName: 'Hima Lime Supply Cooperative',
            bidAmount: 172000000,
            deliveryDays: 7,
            qualificationVerified: true,
            technicalScore: 91,
            status: 'SUBMITTED',
            submittedAt: '2026-11-09T11:00:00Z',
          },
        ],
        createdAt: '2026-11-04T08:00:00Z',
      },
    ];
    seedProc.forEach((p) => db.v11ProcurementRequests.set(p.id, p));
  }

  if (db.supplierQualifications.size === 0) {
    const seedQuals: SupplierQualificationRecord[] = [
      {
        id: 'QUAL-001',
        tenantId: 'TEN-UG-ELGON-01',
        supplierName: 'Uganda Arabica Exporters Cooperative Union',
        jurisdiction: 'UG',
        categories: ['Export Coffee', 'Dry Grains'],
        complianceDocsHash: '0xabcdef1234567890',
        qualificationStatus: 'PREQUALIFIED',
        verifiedBy: 'procurement-review@aros.ug',
        validUntil: '2027-12-31T23:59:59Z',
      },
    ];
    seedQuals.forEach((q) => db.supplierQualifications.set(q.id, q));
  }

  // 8. Logistics Carrier Profiles
  if (db.logisticsCarriers.size === 0) {
    const seedCarriers: LogisticsCarrierProfile[] = [
      {
        id: 'CARR-TRANSEAST-01',
        tenantId: 'TEN-UG-ELGON-01',
        carrierName: 'TransEast Freight Logistics Corporation',
        modes: ['ROAD', 'COLD_CHAIN'],
        corridorsCovered: ['Kampala-Malaba-Nairobi-Mombasa', 'Kampala-Katuna-Kigali'],
        fleetCount: 42,
        trackingSourceType: 'RECTS_E_SEAL',
        verificationStatus: 'VERIFIED_CARRIER',
        activeShipmentsCount: 3,
      },
      {
        id: 'CARR-RVR-RAIL-02',
        tenantId: 'TEN-UG-ROOFINGS-02',
        carrierName: 'East African Meter-Gauge Bulk Rail Freight',
        modes: ['RAIL', 'MULTIMODAL' as any],
        corridorsCovered: ['Mombasa-Malaba-Tororo-Jinja-Kampala'],
        fleetCount: 18,
        trackingSourceType: 'MANUAL_DISPATCH_EVIDENCE',
        verificationStatus: 'SELF_DECLARED',
        activeShipmentsCount: 1,
      },
    ];
    seedCarriers.forEach((c) => db.logisticsCarriers.set(c.id, c));
  }

  // 9. Verified Provider Connectivity Registry (Honest Integration Statuses)
  if (db.verifiedProviders.size === 0) {
    const seedProviders: VerifiedProviderProfile[] = [
      {
        id: 'PROV-BOU-RTGS',
        providerCode: 'BOU_RTGS_UG',
        legalName: 'Bank of Uganda RTGS (Reference Specification)',
        providerType: 'CENTRAL_BANK',
        jurisdiction: 'UG',
        regulatoryEvidence: {
          authority: 'Parliament of Uganda (NPS Act 2020)',
          licenseRef: 'STATUTORY_CENTRAL_BANK',
          verified: true,
        },
        supportedCurrencies: ['UGX'],
        supportedMethods: ['ISO_20022_PACS008', 'RTGS_WIRE'],
        lifecycleStage: 'SANDBOX_TESTED',
        connectionClassification: 'SANDBOX_CONNECTED',
        transactionLimitSingle: 5000000000,
        limitCurrency: 'UGX',
        callbackVerificationMethod: 'MTLS_SIGNED_WEBHOOK',
        failoverProviderCode: 'STANBIC_UG_H2H',
        lastCertificationRun: {
          timestamp: '2026-11-10T09:00:00Z',
          passed: true,
          environment: 'SANDBOX',
          notes: 'Local ISO 20022 sandbox validation passed; live central bank keys not provisioned in preview runtime.',
        },
        credentialStatus: 'NOT_PROVISIONED',
        updatedAt: now,
      },
      {
        id: 'PROV-MTN-MOMO-UG',
        providerCode: 'MTN_MOMO_UG',
        legalName: 'MTN Mobile Money Uganda Ltd',
        providerType: 'MOBILE_MONEY',
        jurisdiction: 'UG',
        regulatoryEvidence: {
          authority: 'Bank of Uganda',
          licenseRef: 'BOU-PSP-2021-001',
          verified: true,
        },
        supportedCurrencies: ['UGX'],
        supportedMethods: ['MOBILE_MONEY_COLLECTION', 'MOBILE_MONEY_DISBURSEMENT'],
        lifecycleStage: 'SANDBOX_TESTED',
        connectionClassification: 'SANDBOX_CONNECTED',
        transactionLimitSingle: 20000000,
        limitCurrency: 'UGX',
        callbackVerificationMethod: 'HMAC_SHA256',
        failoverProviderCode: 'AIRTEL_MONEY_UG',
        lastCertificationRun: {
          timestamp: '2026-11-11T11:30:00Z',
          passed: true,
          environment: 'SANDBOX',
          notes: 'Sandbox callback signature verification validated.',
        },
        credentialStatus: 'ACTIVE',
        updatedAt: now,
      },
      {
        id: 'PROV-EAPS-REGIONAL',
        providerCode: 'EAPS_CLEARING',
        legalName: 'East African Payment System (EAPS) Regional Switch',
        providerType: 'REGIONAL_SWITCH',
        jurisdiction: 'EAC',
        regulatoryEvidence: {
          authority: 'EAC Monetary Affairs Committee',
          licenseRef: 'EAC-MAC-EAPS-2013',
          verified: true,
        },
        supportedCurrencies: ['UGX', 'KES', 'TZS', 'RWF'],
        supportedMethods: ['CROSS_BORDER_RTGS'],
        lifecycleStage: 'CONFIGURED',
        connectionClassification: 'REFERENCE_DIRECTORY',
        transactionLimitSingle: 2000000000,
        limitCurrency: 'UGX',
        callbackVerificationMethod: 'MTLS_SIGNED_WEBHOOK',
        credentialStatus: 'NOT_PROVISIONED',
        updatedAt: now,
      },
    ];
    seedProviders.forEach((p) => db.verifiedProviders.set(p.id, p));
  }

  // 10. Registered Ecosystem Applications
  if (db.ecosystemApps.size === 0) {
    const seedApps: RegisteredEcosystemApp[] = [
      {
        id: 'APP-ECO-001',
        tenantId: 'TEN-UG-DEVLAB-04',
        developerName: 'Kato Emmanuel',
        organizationName: 'Kampala Open Commerce & API Labs Ltd',
        appName: 'EFRIS Invoice Sync Connector',
        apiVersion: 'v11',
        scopes: ['read:orders', 'write:invoices', 'read:fx'],
        webhookUrl: 'https://sandbox-webhooks.kampalalabs.example/aros',
        clientId: 'cli_aros_efris_991a',
        apiKeyPrefix: 'aros_sbx_991a',
        keyHash: '0x6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d',
        rateLimitPerMin: 120,
        usageCount24h: 412,
        lifecycleStage: 'SANDBOX_APPROVED',
        credentialStatus: 'SANDBOX_ACTIVE',
        securityReviewNotes: 'Scoped to TEN-UG-DEVLAB-04 sandbox workspace only.',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: now,
      },
    ];
    seedApps.forEach((a) => db.ecosystemApps.set(a.id, a));
  }

  // 11. Industrial Capacities
  if (db.industrialCapacities.size === 0) {
    const seedCap: IndustrialCapacityRecord[] = [
      {
        id: 'IND-CAP-001',
        tenantId: 'TEN-UG-ROOFINGS-02',
        facilityName: 'Namanve Rolling Mill Line B',
        jurisdiction: 'UG',
        sector: 'Metallurgy & Construction Materials',
        productLine: 'Deformed Steel Rebar (BS4449)',
        totalCapacityPerMonth: 4500,
        availableCapacityPerMonth: 1250,
        unit: 'MT',
        inputRequirements: ['Prime Steel Billets (130x130mm)', 'Industrial Quicklime Flux'],
        equipmentStatus: 'OPERATIONAL',
        sourceAttribution: 'Plant Telemetry & Operations Log (TEN-UG-ROOFINGS-02)',
        verificationStatus: 'AUDITED_CAPACITY',
        updatedAt: '2026-11-12T07:00:00Z',
      },
      {
        id: 'IND-CAP-002',
        tenantId: 'TEN-UG-ELGON-01',
        facilityName: 'Mbale Central Dry Hulling & Grading Plant',
        jurisdiction: 'UG',
        sector: 'Agro-Processing',
        productLine: 'Export-Grade Clean Arabica Coffee',
        totalCapacityPerMonth: 800,
        availableCapacityPerMonth: 320,
        unit: 'MT',
        inputRequirements: ['Dry Parchment Coffee (<=12% moisture)', 'Food-grade 60kg Jute Bags'],
        equipmentStatus: 'OPERATIONAL',
        sourceAttribution: 'Self-Reported Cooperative Facility Schedule',
        verificationStatus: 'SELF_REPORTED',
        updatedAt: '2026-11-11T16:00:00Z',
      },
    ];
    seedCap.forEach((c) => db.industrialCapacities.set(c.id, c));
  }

  // 12. Work & Services Network
  if (db.workOpportunities.size === 0) {
    const seedWork: WorkServiceOpportunity[] = [
      {
        id: 'WORK-V11-001',
        tenantId: 'TEN-UG-ELGON-01',
        publisherName: 'Uganda Arabica Exporters Cooperative Union',
        engagementType: 'PROFESSIONAL_SERVICE',
        title: 'Q4 Independent Coffee Moisture & Ochratoxin Lab Assay (Mbale Lots)',
        skillsRequired: ['ISO 17025 Lab Assay', 'UCDA Quality Grading', 'Phytosanitary Documentation'],
        jurisdiction: 'UG',
        compensationAmount: 4200000,
        currency: 'UGX',
        billingModel: 'FIXED_MILESTONE',
        platformRoleDisclaimer: 'AETHER–AROS coordinates work contracts and milestones; it is not the employer of record.',
        status: 'OPEN',
        milestones: [
          { id: 'WM-1', title: 'Sample Collection & Moisture Certification', amount: 1800000, status: 'PENDING' },
          { id: 'WM-2', title: 'Final Lab Report & Lot Release Sign-off', amount: 2400000, status: 'PENDING' },
        ],
        createdAt: '2026-11-09T09:00:00Z',
      },
    ];
    seedWork.forEach((w) => db.workOpportunities.set(w.id, w));
  }

  // 13. Network Intelligence Insights (With explicit Provenance & Limitations)
  if (db.networkInsights.size === 0) {
    const seedInsights: NetworkAnalyticalInsight[] = [
      {
        id: 'INTEL-V11-001',
        domain: 'COMMODITY_PRICE',
        title: 'Kampala–Nairobi Arabica Cross-Border Spread Analysis',
        summary: 'Observed regional green Arabica export quotes show an 11.4% net margin above farm-gate parchment after Malaba OSBP transit costs.',
        factOrForecast: 'OBSERVED_FACT',
        dataSource: 'AROS Price Observations & V10 Commercial Orders (n=14 corridors)',
        observationPeriod: '2026-10-01 to 2026-11-12',
        modelVersion: 'AROS-INTEL-AGG-v11.0',
        assumptions: ['Standard 60kg jute packaging', 'Zero-rated EAC export VAT under Section 24'],
        confidencePct: 92,
        limitations: 'Excludes unplanned demurrage or extreme weather holds exceeding 48 hours at Malaba OSBP.',
        updatedAt: now,
      },
      {
        id: 'INTEL-V11-002',
        domain: 'CORRIDOR_LOGISTICS',
        title: 'Northern Corridor Q1 Transit Lead-Time Projection',
        summary: 'Projected transit lead times between Mbale and Mombasa are modeled at 78–92 hours assuming nominal customs electronic seal throughput.',
        factOrForecast: 'ECONOMETRIC_FORECAST',
        dataSource: 'Corridor Shipment Milestones & RECTS Telemetry History',
        observationPeriod: 'Rolling 90-day corridor window',
        modelVersion: 'AROS-CORRIDOR-FORECAST-v11.0',
        assumptions: ['No customs portal outage', 'Axle load limits compliant at Tororo & Mariakani weighbridges'],
        confidencePct: 81,
        limitations: 'Projection only; actual arrival times depend on third-party border authorities and carrier dispatch.',
        updatedAt: now,
      },
    ];
    seedInsights.forEach((i) => db.networkInsights.set(i.id, i));
  }

  // 14. Governed AI Agent Identities (Levels 1-5)
  if (db.governedAiAgents.size === 0) {
    const seedAgents: GovernedAiAgentIdentity[] = [
      {
        id: 'AGENT-SUPPLIER-MATCH',
        agentCode: 'AROS_SUPPLIER_ADVISOR',
        name: 'Supplier Discovery & Procurement Preparation Agent',
        domain: 'Procurement & Supply Chain',
        maxAutonomyLevel: 2,
        allowedTools: ['search_listings', 'draft_rfq', 'compare_bids'],
        dataAccessBoundary: 'TENANT_SCOPED_AND_PUBLIC_LISTINGS_ONLY',
        modelVersion: 'AROS-AGENT-GOV-v11.0',
        emergencyStopped: false,
        actionsExecutedCount: 4,
      },
      {
        id: 'AGENT-TREASURY-EXEC',
        agentCode: 'AROS_TREASURY_COORDINATOR',
        name: 'Cross-Currency Settlement Preparation Agent',
        domain: 'Treasury & Financial Operations',
        maxAutonomyLevel: 5,
        allowedTools: ['prepare_payment_draft', 'inspect_reconciliation_variance'],
        dataAccessBoundary: 'REQUIRES_EXPLICIT_DUAL_HUMAN_APPROVAL_FOR_EXECUTION',
        modelVersion: 'AROS-AGENT-GOV-v11.0',
        emergencyStopped: false,
        actionsExecutedCount: 1,
      },
    ];
    seedAgents.forEach((a) => db.governedAiAgents.set(a.id, a));
  }

  if (db.aiAgentActionLogs.size === 0) {
    const seedAgentLogs: AiAgentActionLog[] = [
      {
        id: 'AGLOG-001',
        agentId: 'AGENT-SUPPLIER-MATCH',
        tenantId: 'TEN-UG-ROOFINGS-02',
        requestedAction: 'Summarize prequalified industrial flux suppliers in UG',
        autonomyLevel: 1,
        status: 'EXECUTED_OBSERVE_ASSIST',
        promptInjectionCheck: 'CLEAN',
        outputValidation: 'PASSED',
        resultSummary: 'Identified 1 prequalified supplier matching CaO >= 90% criteria.',
        timestamp: '2026-11-12T08:30:00Z',
      },
    ];
    seedAgentLogs.forEach((l) => db.aiAgentActionLogs.set(l.id, l));
  }

  // 15. Multi-Tenant Subscriptions & Billing Invoices
  if (db.tenantSubscriptions.size === 0) {
    const seedSubs: TenantSubscriptionRecord[] = [
      {
        id: 'TSUB-001',
        tenantId: 'TEN-UG-ELGON-01',
        tenantName: 'Uganda Arabica Exporters Cooperative Union',
        planId: 'PLAN-BIZ-02',
        planName: 'Commercial Enterprise Multi-Corridor Suite',
        audienceTier: 'ENTERPRISE',
        monthlyBaseFee: 350,
        currency: 'USD',
        entitlements: {
          maxUsers: 50,
          maxApiCallsPerMonth: 100000,
          includedModules: ['WORKSPACE', 'MARKETPLACE', 'PROCUREMENT', 'SUPPLY_CHAIN'],
        },
        apiCallsUsedCurrentCycle: 1420,
        apiOverageUnitFee: 0.002,
        status: 'ACTIVE',
        billingCycleStart: '2026-11-01T00:00:00Z',
        billingCycleEnd: '2026-11-30T23:59:59Z',
      },
      {
        id: 'TSUB-002',
        tenantId: 'TEN-UG-DEVLAB-04',
        tenantName: 'Kampala Open Commerce & API Labs Ltd',
        planId: 'PLAN-DEV-01',
        planName: 'Developer Sandbox & Regional API Tier',
        audienceTier: 'DEVELOPER',
        monthlyBaseFee: 50,
        currency: 'USD',
        entitlements: {
          maxUsers: 10,
          maxApiCallsPerMonth: 25000,
          includedModules: ['DEVELOPER_API', 'SANDBOX_WEBHOOKS'],
        },
        apiCallsUsedCurrentCycle: 412,
        apiOverageUnitFee: 0.001,
        status: 'ACTIVE',
        billingCycleStart: '2026-11-01T00:00:00Z',
        billingCycleEnd: '2026-11-30T23:59:59Z',
      },
    ];
    seedSubs.forEach((s) => db.tenantSubscriptions.set(s.id, s));
  }

  if (db.tenantBillingInvoices.size === 0) {
    const seedInvoices: TenantBillingInvoice[] = [
      {
        id: 'TINV-2026-001',
        invoiceNumber: 'AROS-BIL-2026-101',
        tenantId: 'TEN-UG-ELGON-01',
        subscriptionId: 'TSUB-001',
        pricingBasis: 'Monthly Enterprise Platform Fee (350 USD) + 0 API overage calls',
        baseAmount: 350,
        usageOverageAmount: 0,
        taxRatePct: 18,
        taxAmount: 63,
        totalAmount: 413,
        currency: 'USD',
        status: 'PAID',
        issuedAt: '2026-11-01T00:05:00Z',
      },
    ];
    seedInvoices.forEach((inv) => db.tenantBillingInvoices.set(inv.id, inv));
  }
}
