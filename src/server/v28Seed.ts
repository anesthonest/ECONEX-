/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 - Universal Economic Execution, Interoperability & Continental Operations Seeder
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';
import type {
  V28AiOrchestrationRun,
  V28ContractObligation,
  V28ContractRecord,
  V28CountryOperatingProfile,
  V28CrossBorderExecution,
  V28DomainEvent,
  V28DualApprovalRequest,
  V28EventDeadLetter,
  V28ExecutionWorkflow,
  V28FieldOfflineRecord,
  V28FulfilmentPlan,
  V28InteroperabilityConnector,
  V28InventoryReservation,
  V28OperationalException,
  V28ProcurementEvaluation,
  V28ProcurementPlan,
  V28ProcurementPolicy,
  V28ProcurementRequisition,
  V28ShipmentEvidence,
  V28VaultDocumentRecord,
} from '../types/index.ts';

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

export function seedV28Collections(db: ArosDatabase) {
  const now = '2026-11-25T10:00:00.000Z';

  // 1. Country Operating Profiles (Uganda + 6 EAC partners)
  const countries: V28CountryOperatingProfile[] = [
    {
      countryCode: 'UG',
      countryName: 'Republic of Uganda',
      supportedCurrencies: ['UGX', 'USD', 'KES'],
      timeZone: 'Africa/Kampala',
      languages: ['en', 'lg', 'sw'],
      businessIdentifierTypes: ['URSB_BRN', 'URA_TIN', 'NIRA_NIN'],
      verificationRequirements: ['URSB_CERTIFICATE', 'TIN_CERTIFICATE', 'DIRECTOR_ID'],
      complianceChecklist: ['FIA_AML_THRESHOLD', 'URA_EFRIS_REFERENCE', 'MINISTRY_SECTOR_PERMIT'],
      taxReferenceSystem: 'URA EFRIS Reference (Non-Filing Sandbox)',
      tradeDocumentationRequired: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'CERTIFICATE_OF_ORIGIN', 'PHYTOSANITARY_IF_AGRI'],
      operationalRestrictions: ['NO_UNLICENSED_REMITTANCE', 'SANDBOX_WALLET_ONLY'],
      externalIntegrationStatus: 'SANDBOX_ONLY',
      featureAvailability: {
        marketplace: true,
        procurement: true,
        crossBorderCoordination: true,
        sandboxWallet: true,
        liveBankRail: false,
        officialCustomsClearance: false,
      },
      updatedAt: now,
    },
    {
      countryCode: 'KE',
      countryName: 'Republic of Kenya',
      supportedCurrencies: ['KES', 'USD', 'UGX'],
      timeZone: 'Africa/Nairobi',
      languages: ['en', 'sw'],
      businessIdentifierTypes: ['BRS_PVT', 'KRA_PIN', 'NATIONAL_ID'],
      verificationRequirements: ['CR12_FILING', 'KRA_TAX_COMPLIANCE'],
      complianceChecklist: ['KEBS_QUALITY_REF', 'CBK_SANDBOX_POLICY'],
      taxReferenceSystem: 'KRA eTIMS Reference (Non-Filing Sandbox)',
      tradeDocumentationRequired: ['COMMERCIAL_INVOICE', 'EAC_CERTIFICATE_OF_ORIGIN', 'IMPORT_DECLARATION_REF'],
      operationalRestrictions: ['SANDBOX_WALLET_ONLY', 'NO_LIVE_FX_DEALING'],
      externalIntegrationStatus: 'SANDBOX_ONLY',
      featureAvailability: {
        marketplace: true,
        procurement: true,
        crossBorderCoordination: true,
        sandboxWallet: true,
        liveBankRail: false,
        officialCustomsClearance: false,
      },
      updatedAt: now,
    },
    {
      countryCode: 'TZ',
      countryName: 'United Republic of Tanzania',
      supportedCurrencies: ['TZS', 'USD', 'UGX'],
      timeZone: 'Africa/Dar_es_Salaam',
      languages: ['sw', 'en'],
      businessIdentifierTypes: ['BRELA_REG', 'TRA_TIN', 'NIDA_ID'],
      verificationRequirements: ['BRELA_EXTRACT', 'TRA_CLEARANCE'],
      complianceChecklist: ['TBS_STANDARD_REF', 'BOT_SANDBOX_POLICY'],
      taxReferenceSystem: 'TRA VFD Reference (Non-Filing Sandbox)',
      tradeDocumentationRequired: ['COMMERCIAL_INVOICE', 'EAC_CERTIFICATE_OF_ORIGIN'],
      operationalRestrictions: ['SANDBOX_WALLET_ONLY'],
      externalIntegrationStatus: 'SANDBOX_ONLY',
      featureAvailability: {
        marketplace: true,
        procurement: true,
        crossBorderCoordination: true,
        sandboxWallet: true,
        liveBankRail: false,
        officialCustomsClearance: false,
      },
      updatedAt: now,
    },
    {
      countryCode: 'RW',
      countryName: 'Republic of Rwanda',
      supportedCurrencies: ['RWF', 'USD', 'UGX'],
      timeZone: 'Africa/Kigali',
      languages: ['rw', 'en', 'fr'],
      businessIdentifierTypes: ['RDB_TIN', 'NATIONAL_ID'],
      verificationRequirements: ['RDB_REGISTRATION_CERT'],
      complianceChecklist: ['RSB_CERT_REF', 'BNR_SANDBOX_POLICY'],
      taxReferenceSystem: 'RRA EBM Reference (Non-Filing Sandbox)',
      tradeDocumentationRequired: ['COMMERCIAL_INVOICE', 'EAC_CERTIFICATE_OF_ORIGIN'],
      operationalRestrictions: ['SANDBOX_WALLET_ONLY'],
      externalIntegrationStatus: 'SANDBOX_ONLY',
      featureAvailability: {
        marketplace: true,
        procurement: true,
        crossBorderCoordination: true,
        sandboxWallet: true,
        liveBankRail: false,
        officialCustomsClearance: false,
      },
      updatedAt: now,
    },
    {
      countryCode: 'BI',
      countryName: 'Republic of Burundi',
      supportedCurrencies: ['USD', 'UGX'],
      timeZone: 'Africa/Bujumbura',
      languages: ['fr', 'en'],
      businessIdentifierTypes: ['OBR_NIF', 'RC_NUM'],
      verificationRequirements: ['OBR_TAX_ID'],
      complianceChecklist: ['EAC_TRANSIT_MANIFEST'],
      taxReferenceSystem: 'OBR Reference (Non-Filing Sandbox)',
      tradeDocumentationRequired: ['COMMERCIAL_INVOICE', 'EAC_CERTIFICATE_OF_ORIGIN'],
      operationalRestrictions: ['SANDBOX_WALLET_ONLY'],
      externalIntegrationStatus: 'SANDBOX_ONLY',
      featureAvailability: {
        marketplace: true,
        procurement: true,
        crossBorderCoordination: true,
        sandboxWallet: true,
        liveBankRail: false,
        officialCustomsClearance: false,
      },
      updatedAt: now,
    },
    {
      countryCode: 'SS',
      countryName: 'Republic of South Sudan',
      supportedCurrencies: ['USD', 'UGX'],
      timeZone: 'Africa/Juba',
      languages: ['en'],
      businessIdentifierTypes: ['MOJ_REG', 'NRA_TIN'],
      verificationRequirements: ['BUSINESS_CERT_JUBA'],
      complianceChecklist: ['NIMULE_CORRIDOR_DOC_REF'],
      taxReferenceSystem: 'NRA Reference (Non-Filing Sandbox)',
      tradeDocumentationRequired: ['COMMERCIAL_INVOICE', 'TRANSIT_WAYBILL'],
      operationalRestrictions: ['SANDBOX_WALLET_ONLY'],
      externalIntegrationStatus: 'SANDBOX_ONLY',
      featureAvailability: {
        marketplace: true,
        procurement: true,
        crossBorderCoordination: true,
        sandboxWallet: true,
        liveBankRail: false,
        officialCustomsClearance: false,
      },
      updatedAt: now,
    },
    {
      countryCode: 'CD',
      countryName: 'Democratic Republic of the Congo',
      supportedCurrencies: ['USD', 'UGX'],
      timeZone: 'Africa/Kinshasa',
      languages: ['fr', 'sw', 'en'],
      businessIdentifierTypes: ['RCCM', 'ID_NAT', 'NIF'],
      verificationRequirements: ['RCCM_EXTRACT', 'NIF_ATTESTATION'],
      complianceChecklist: ['MPONDWE_CORRIDOR_MANIFEST'],
      taxReferenceSystem: 'DGI Reference (Non-Filing Sandbox)',
      tradeDocumentationRequired: ['COMMERCIAL_INVOICE', 'ORIGIN_DECLARATION'],
      operationalRestrictions: ['SANDBOX_WALLET_ONLY'],
      externalIntegrationStatus: 'SANDBOX_ONLY',
      featureAvailability: {
        marketplace: true,
        procurement: true,
        crossBorderCoordination: true,
        sandboxWallet: true,
        liveBankRail: false,
        officialCustomsClearance: false,
      },
      updatedAt: now,
    },
  ];
  for (const c of countries) {
    if (!db.v28CountryProfiles.has(c.countryCode)) db.v28CountryProfiles.set(c.countryCode, c);
  }

  // 2. Seed Universal Execution Workflows
  const workflows: V28ExecutionWorkflow[] = [
    {
      id: 'V28-WF-001',
      workflowRef: 'EXEC-UG-KE-2026-001',
      title: 'Elgon Specialty Coffee Export Execution -> Nairobi Grain & Roastery',
      sectorId: 'AGRICULTURE',
      participantCategory: 'COOPERATIVE',
      initiatorUserId: 'usr_farmer_01',
      initiatorOrgId: 'org_coop_01',
      counterpartyOrgId: 'org_ent_01',
      ownerUserId: 'usr_farmer_01',
      stage: 'EXECUTE',
      status: 'IN_PROGRESS',
      countryCode: 'UG',
      destinationCountryCode: 'KE',
      currency: 'UGX',
      valueMinor: 35000000000,
      linkedOpportunityId: 'V27-OPP-001',
      linkedContractId: 'V28-CTR-001',
      linkedOrderId: 'ORD-2026-001',
      linkedFulfilmentPlanId: 'V28-FUL-001',
      linkedObligationId: 'V28-OBL-001',
      linkedCrossBorderId: 'V28-XB-001',
      requiredEvidence: ['QUALITY_LAB_CERT', 'CONTRACT_ACKNOWLEDGEMENT', 'DISPATCH_AUTH'],
      submittedEvidence: ['QUALITY_LAB_CERT', 'CONTRACT_ACKNOWLEDGEMENT'],
      requiresHumanApproval: true,
      humanApprovedByUserId: 'usr_buyer_01',
      humanApprovedAt: now,
      compensationStatus: 'NONE',
      correlationId: 'CORR-V28-SEED-001',
      transitions: [
        {
          id: 'V28-TR-001',
          workflowId: 'V28-WF-001',
          fromStage: 'DISCOVER',
          toStage: 'AGREE',
          fromStatus: 'SUBMITTED',
          toStatus: 'CONTRACTED',
          actorUserId: 'usr_farmer_01',
          actorRole: 'FARMER',
          actorOrgId: 'org_coop_01',
          evidenceRefs: ['V28-DOC-001'],
          correlationId: 'CORR-V28-SEED-001',
          occurredAt: now,
        },
        {
          id: 'V28-TR-002',
          workflowId: 'V28-WF-001',
          fromStage: 'AGREE',
          toStage: 'EXECUTE',
          fromStatus: 'CONTRACTED',
          toStatus: 'IN_PROGRESS',
          actorUserId: 'usr_buyer_01',
          actorRole: 'BUYER',
          actorOrgId: 'org_ent_01',
          evidenceRefs: ['V28-CTR-001'],
          humanApprovedBy: 'usr_buyer_01',
          correlationId: 'CORR-V28-SEED-001',
          occurredAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-WF-002',
      workflowRef: 'EXEC-UG-PROC-2026-002',
      title: 'Victoria Certified Maize Seed Institutional Supply Execution',
      sectorId: 'MANUFACTURING',
      participantCategory: 'ENTERPRISE',
      initiatorUserId: 'usr_buyer_01',
      initiatorOrgId: 'org_ent_01',
      counterpartyOrgId: 'org_dealer_01',
      ownerUserId: 'usr_buyer_01',
      stage: 'AUTHORISE',
      status: 'APPROVED',
      countryCode: 'UG',
      currency: 'UGX',
      valueMinor: 18000000000,
      linkedContractId: 'V28-CTR-002',
      linkedProcurementReqId: 'V28-REQ-001',
      linkedOrderId: 'ORD-2026-002',
      requiredEvidence: ['PROCUREMENT_PLAN_APPROVAL', 'COMPETITIVE_EVALUATION'],
      submittedEvidence: ['PROCUREMENT_PLAN_APPROVAL', 'COMPETITIVE_EVALUATION'],
      requiresHumanApproval: true,
      humanApprovedByUserId: 'usr_admin_01',
      humanApprovedAt: now,
      compensationStatus: 'NONE',
      correlationId: 'CORR-V28-SEED-002',
      transitions: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const wf of workflows) {
    if (!db.v28ExecutionWorkflows.has(wf.id)) db.v28ExecutionWorkflows.set(wf.id, wf);
  }

  // 3. Seed Universal Contracts & Obligations
  const contracts: V28ContractRecord[] = [
    {
      id: 'V28-CTR-001',
      contractNumber: 'ECX-CTR-2026-0001',
      contractType: 'CROSS_BORDER',
      templateCode: 'EAC-SUPPLY-AA-01',
      title: 'Mt Elgon Washed Arabica Cross-Border Supply Agreement',
      scopeOfWork: 'Supply of 500 x 60kg bags Washed Grade AA Arabica green coffee beans, moisture <= 11.5%, FCA Malaba border.',
      partyAOrgId: 'org_ent_01',
      partyARepUserId: 'usr_buyer_01',
      partyBOrgId: 'org_coop_01',
      partyBRepUserId: 'usr_farmer_01',
      countryCode: 'UG',
      currency: 'UGX',
      totalValueMinor: 35000000000,
      paymentTerms: '30% Sandbox Commitment upon dispatch authorisation; 70% upon verified POD',
      deliveryTerms: 'FCA Malaba Border Post, Eastern Uganda',
      items: [
        { sku: 'COF-AA-ELG-01', description: 'Washed Mt Elgon Grade AA Arabica (60kg bag)', quantity: 500, unit: 'BAG_60KG', unitPriceMinor: 70000000 },
      ],
      evidenceRequirements: ['MOISTURE_LAB_REPORT', 'EAC_CERTIFICATE_OF_ORIGIN', 'WEIGHBRIDGE_POD'],
      acknowledgements: [
        {
          userId: 'usr_buyer_01',
          orgId: 'org_ent_01',
          acknowledgedAt: now,
          acknowledgementHash: sha256('V28-CTR-001:usr_buyer_01:v1'),
          legallyQualifiedSignature: false,
        },
        {
          userId: 'usr_farmer_01',
          orgId: 'org_coop_01',
          acknowledgedAt: now,
          acknowledgementHash: sha256('V28-CTR-001:usr_farmer_01:v1'),
          legallyQualifiedSignature: false,
        },
      ],
      legallyQualifiedSignature: false,
      legalDisclosure: 'Recorded platform commercial acknowledgement; not a legally qualified e-signature under statutory PKI.',
      status: 'ACKNOWLEDGED_ACTIVE',
      currentVersion: 1,
      versions: [
        {
          version: 1,
          summary: 'Initial cross-border coffee supply terms',
          valueMinor: 35000000000,
          amendedByUserId: 'usr_buyer_01',
          amendmentReason: 'Baseline agreement establishment',
          checksumSha256: sha256('ECX-CTR-2026-0001:v1'),
          createdAt: now,
        },
      ],
      linkedOpportunityId: 'V27-OPP-001',
      linkedOrderIds: ['ORD-2026-001'],
      linkedInvoiceIds: [],
      linkedLedgerRefs: [],
      expiresAt: '2027-06-30T23:59:59.000Z',
      autoRenew: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CTR-002',
      contractNumber: 'ECX-CTR-2026-0002',
      contractType: 'PROCUREMENT',
      templateCode: 'ENT-PROC-SEED-02',
      title: 'Certified Longe 5 Maize Seed Bulk Procurement Contract',
      scopeOfWork: 'Delivery of 2,000 x 25kg bags certified hybrid maize seed to Kampala depot with germination test dossier.',
      partyAOrgId: 'org_ent_01',
      partyARepUserId: 'usr_buyer_01',
      partyBOrgId: 'org_dealer_01',
      partyBRepUserId: 'usr_dealer_01',
      countryCode: 'UG',
      currency: 'UGX',
      totalValueMinor: 18000000000,
      paymentTerms: 'Net 14 days post 3-way match in Sandbox Obligation Ledger',
      deliveryTerms: 'DAP Kampala Mill & Seed Store',
      items: [
        { sku: 'SEED-MAIZE-HYBRID-LONGE5', description: 'Certified Longe 5 Maize Seed (25kg bag)', quantity: 2000, unit: 'BAG_25KG', unitPriceMinor: 9000000 },
      ],
      evidenceRequirements: ['GERMINATION_CERTIFICATE', 'GRN_RECEIPT'],
      acknowledgements: [
        {
          userId: 'usr_buyer_01',
          orgId: 'org_ent_01',
          acknowledgedAt: now,
          acknowledgementHash: sha256('V28-CTR-002:usr_buyer_01:v1'),
          legallyQualifiedSignature: false,
        },
      ],
      legallyQualifiedSignature: false,
      legalDisclosure: 'Recorded platform commercial acknowledgement; not a legally qualified e-signature under statutory PKI.',
      status: 'APPROVED',
      currentVersion: 1,
      versions: [
        {
          version: 1,
          summary: 'Initial seed procurement schedule',
          valueMinor: 18000000000,
          amendedByUserId: 'usr_buyer_01',
          amendmentReason: 'Initial version',
          checksumSha256: sha256('ECX-CTR-2026-0002:v1'),
          createdAt: now,
        },
      ],
      linkedOrderIds: ['ORD-2026-002'],
      linkedInvoiceIds: [],
      linkedLedgerRefs: [],
      expiresAt: '2027-03-31T23:59:59.000Z',
      autoRenew: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const ctr of contracts) {
    if (!db.v28Contracts.has(ctr.id)) db.v28Contracts.set(ctr.id, ctr);
  }

  const obligations: V28ContractObligation[] = [
    {
      id: 'V28-OBL-001',
      contractId: 'V28-CTR-001',
      tenantId: 'TENANT-UG',
      title: 'Tranche 1 Arabica Dispatch Obligation (30% Sandbox)',
      dueDate: '2026-12-10T17:00:00.000Z',
      responsiblePartyOrgId: 'org_ent_01',
      amountMinor: 10500000000,
      currency: 'UGX',
      status: 'LINKED_WALLET_OBLIGATION',
      linkedWalletObligationId: 'V24-OBL-001',
      updatedAt: now,
    },
  ];
  for (const obl of obligations) {
    if (!db.v28ContractObligations.has(obl.id)) db.v28ContractObligations.set(obl.id, obl);
  }

  // 4. Procurement Policies, Plans, Requisitions, Evaluations
  const procPolicies: V28ProcurementPolicy[] = [
    {
      id: 'V28-PPOL-UG-01',
      organisationId: 'org_ent_01',
      countryCode: 'UG',
      enforceStrictSod: true,
      dualApprovalThresholdMinor: 5000000000,
      minCompetitiveQuotes: 2,
      requireConflictDeclaration: true,
      officialGovernmentApprovalClaimed: false,
      policyDisclaimer: 'Enterprise internal governance rule; does not represent PPDA or official government procurement approval.',
      updatedAt: now,
    },
  ];
  for (const p of procPolicies) {
    if (!db.v28ProcurementPolicies.has(p.id)) db.v28ProcurementPolicies.set(p.id, p);
  }

  const procPlans: V28ProcurementPlan[] = [
    {
      id: 'V28-PPLAN-001',
      organisationId: 'org_ent_01',
      fiscalPeriod: 'FY2026-Q4',
      title: 'Kampala Agro-Processors Q4 Seed & Packaging Procurement Plan',
      countryCode: 'UG',
      budgetMinor: 50000000000,
      committedMinor: 18000000000,
      currency: 'UGX',
      status: 'ACTIVE',
      ownerUserId: 'usr_buyer_01',
      approvedByUserId: 'usr_admin_01',
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const pl of procPlans) {
    if (!db.v28ProcurementPlans.has(pl.id)) db.v28ProcurementPlans.set(pl.id, pl);
  }

  const procReqs: V28ProcurementRequisition[] = [
    {
      id: 'V28-REQ-001',
      planId: 'V28-PPLAN-001',
      organisationId: 'org_ent_01',
      title: '2,000 Bags Certified Longe 5 Maize Seed',
      category: 'AGRICULTURAL_INPUTS',
      estimatedAmountMinor: 18000000000,
      currency: 'UGX',
      requesterUserId: 'usr_buyer_01',
      approverUserId: 'usr_admin_01',
      conflictDeclaredBy: ['usr_buyer_01', 'usr_admin_01'],
      status: 'APPROVED',
      linkedRfqId: 'RFQ-V24-001',
      officialGovernmentApprovalClaimed: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const rq of procReqs) {
    if (!db.v28ProcurementRequisitions.has(rq.id)) db.v28ProcurementRequisitions.set(rq.id, rq);
  }

  const procEvals: V28ProcurementEvaluation[] = [
    {
      id: 'V28-PEVAL-001',
      requisitionId: 'V28-REQ-001',
      rfqId: 'RFQ-V24-001',
      evaluatorUserId: 'usr_coop_01',
      supplierOrgId: 'org_dealer_01',
      priceScore: 91,
      qualityScore: 95,
      deliveryScore: 89,
      complianceScore: 94,
      weightedTotal: 92.4,
      conflictOfInterestFree: true,
      recommended: true,
      rationale: 'MAAIF-certified hybrid seed lot with 96% lab germination rate and lowest cost per kg.',
      evaluatedAt: now,
    },
  ];
  for (const ev of procEvals) {
    if (!db.v28ProcurementEvaluations.has(ev.id)) db.v28ProcurementEvaluations.set(ev.id, ev);
  }

  // 5. Supply Chain Fulfilment Plan, Reservations & Shipment Evidence
  const fulfilments: V28FulfilmentPlan[] = [
    {
      id: 'V28-FUL-001',
      orderId: 'ORD-2026-001',
      contractId: 'V28-CTR-001',
      sellerOrgId: 'org_coop_01',
      buyerOrgId: 'org_ent_01',
      warehouseId: 'WH-MBALE-01',
      carrierOrgId: 'org_fleet_01',
      status: 'IN_TRANSIT',
      orderedQuantity: 500,
      reservedQuantity: 500,
      deliveredQuantity: 0,
      rejectedQuantity: 0,
      damagedQuantity: 0,
      returnedQuantity: 0,
      dispatchAuthorisedBy: 'usr_farmer_01',
      reconciliationVarianceQty: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const f of fulfilments) {
    if (!db.v28FulfilmentPlans.has(f.id)) db.v28FulfilmentPlans.set(f.id, f);
  }

  const reservations: V28InventoryReservation[] = [
    {
      id: 'V28-RES-001',
      inventoryId: 'INV-V24-001',
      fulfilmentPlanId: 'V28-FUL-001',
      organisationId: 'org_coop_01',
      sku: 'COF-AA-ELG-01',
      quantityReserved: 500,
      quantityDispatched: 500,
      quantityReturned: 0,
      quantityDamaged: 0,
      status: 'CONSUMED',
      allowNegativePolicyOverride: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const r of reservations) {
    if (!db.v28InventoryReservations.has(r.id)) db.v28InventoryReservations.set(r.id, r);
  }

  const evidences: V28ShipmentEvidence[] = [
    {
      id: 'V28-SEVID-001',
      fulfilmentPlanId: 'V28-FUL-001',
      shipmentId: 'SHIP-2026-001',
      trackingSource: 'MANUAL_RECORD',
      liveGpsConnected: false,
      milestone: 'DISPATCHED_FROM_MBALE_DEPOT',
      locationLabel: 'Mbale Coffee Wash & Grading Station, UG (Manual Operator Log)',
      deliveredQty: 0,
      rejectedQty: 0,
      damagedQty: 0,
      returnedQty: 0,
      receiverName: 'Pending Border Handover',
      proofHashSha256: sha256('SHIP-2026-001:MBALE:DISPATCH'),
      recordedByUserId: 'usr_trans_01',
      recordedAt: now,
    },
  ];
  for (const e of evidences) {
    if (!db.v28ShipmentEvidences.has(e.id)) db.v28ShipmentEvidences.set(e.id, e);
  }

  // 6. Cross-Border Execution
  const xbs: V28CrossBorderExecution[] = [
    {
      id: 'V28-XB-001',
      originCountryCode: 'UG',
      destinationCountryCode: 'KE',
      exporterOrgId: 'org_coop_01',
      importerOrgId: 'org_ent_01',
      contractId: 'V28-CTR-001',
      fulfilmentPlanId: 'V28-FUL-001',
      tradeCurrency: 'UGX',
      settlementCurrency: 'KES',
      configuredFxRate: 0.0352,
      fxRateSource: 'ECONEX Sandbox Reference Feed (Non-Dealing)',
      fxRateTimestamp: now,
      requiredDocuments: ['COMMERCIAL_INVOICE', 'EAC_CERTIFICATE_OF_ORIGIN', 'PHYTOSANITARY_IF_AGRI'],
      submittedDocumentIds: ['V28-DOC-001'],
      restrictionsChecked: true,
      eligibilityVerified: true,
      stage: 'FULFILMENT_TRACKED',
      officialCustomsOrTaxFilingClaimed: false,
      regulatedFxDealingClaimed: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const x of xbs) {
    if (!db.v28CrossBorderExecutions.has(x.id)) db.v28CrossBorderExecutions.set(x.id, x);
  }

  // 7. Interoperability Gateway Connectors across 12 required categories
  const connectors: V28InteroperabilityConnector[] = [
    {
      id: 'V28-CONN-001',
      providerCode: 'MTN_MOMO_UG',
      providerName: 'MTN Mobile Money Uganda Gateway Interface',
      category: 'MOBILE_MONEY',
      countryCodes: ['UG'],
      state: 'SANDBOX',
      credentialRef: 'vault://sandbox/mtn-ug-placeholder',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/mtn-momo-ug',
      rateLimitPerMinute: 120,
      retryMaxAttempts: 3,
      lastHealthCheckAt: now,
      lastHealthStatus: 'SANDBOX_OK',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CONN-002',
      providerCode: 'STANBIC_RTGS_UG',
      providerName: 'Stanbic Bank / Bank of Uganda RTGS Adapter Interface',
      category: 'BANK',
      countryCodes: ['UG'],
      state: 'AWAITING_CREDENTIALS',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/stanbic-rtgs',
      rateLimitPerMinute: 60,
      retryMaxAttempts: 5,
      lastHealthStatus: 'UNKNOWN',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CONN-003',
      providerCode: 'ECONEX_CARD_SCHEME_SANDBOX',
      providerName: 'Card Processor Acquiring & Issuance Interface',
      category: 'CARD_PROCESSOR',
      countryCodes: ['UG', 'KE', 'TZ', 'RW'],
      state: 'NOT_CONFIGURED',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/card-processor',
      rateLimitPerMinute: 100,
      retryMaxAttempts: 3,
      lastHealthStatus: 'UNKNOWN',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CONN-004',
      providerCode: 'URSB_NIRA_IDENTITY_BRIDGE',
      providerName: 'National ID & Business Registry Verification Interface',
      category: 'IDENTITY_VERIFICATION',
      countryCodes: ['UG'],
      state: 'AWAITING_APPROVAL',
      credentialRef: 'vault://sandbox/ursb-nira-ref',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/identity-ug',
      rateLimitPerMinute: 30,
      retryMaxAttempts: 3,
      lastHealthCheckAt: now,
      lastHealthStatus: 'SANDBOX_OK',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CONN-005',
      providerCode: 'URA_EFRIS_TAX_INFO',
      providerName: 'Tax & Business Registration Information Interface',
      category: 'TAX_BUSINESS_REGISTRY',
      countryCodes: ['UG'],
      state: 'NOT_CONFIGURED',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/tax-efris',
      rateLimitPerMinute: 45,
      retryMaxAttempts: 3,
      lastHealthStatus: 'UNKNOWN',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CONN-006',
      providerCode: 'EAC_CUSTOMS_INFO_CORRIDOR',
      providerName: 'EAC Single Customs Territory Information Connector',
      category: 'TRADE_CUSTOMS_INFO',
      countryCodes: ['UG', 'KE', 'TZ', 'RW'],
      state: 'SANDBOX',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/eac-customs-info',
      rateLimitPerMinute: 60,
      retryMaxAttempts: 3,
      lastHealthCheckAt: now,
      lastHealthStatus: 'SANDBOX_OK',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CONN-007',
      providerCode: 'AFRICA_MESSAGING_GATEWAY',
      providerName: 'SMS / WhatsApp / Email Operational Messaging Interface',
      category: 'MESSAGING',
      countryCodes: ['UG', 'KE', 'TZ', 'RW', 'BI', 'SS', 'CD'],
      state: 'AWAITING_CREDENTIALS',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/messaging',
      rateLimitPerMinute: 240,
      retryMaxAttempts: 4,
      lastHealthStatus: 'UNKNOWN',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'V28-CONN-008',
      providerCode: 'ENTERPRISE_ERP_LEDGER_SYNC',
      providerName: 'ERP & Accounting Webhook Sync Interface',
      category: 'ERP',
      countryCodes: ['UG', 'KE', 'TZ', 'RW'],
      state: 'TESTING',
      sandboxEndpoint: 'https://sandbox.econex.local/connectors/erp-sync',
      rateLimitPerMinute: 90,
      retryMaxAttempts: 3,
      lastHealthCheckAt: now,
      lastHealthStatus: 'SANDBOX_OK',
      liveExternalTrafficEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const c of connectors) {
    if (!db.v28InteroperabilityConnectors.has(c.id)) db.v28InteroperabilityConnectors.set(c.id, c);
  }

  // 8. Domain Events & Dead Letters
  const events: V28DomainEvent[] = [
    {
      id: 'V28-EVT-001',
      eventVersion: '1.0',
      eventType: 'CONTRACT.ACKNOWLEDGED',
      domain: 'CONTRACT',
      correlationId: 'CORR-V28-SEED-001',
      idempotencyKey: 'SEED-EVT-001',
      tenantId: 'TENANT-UG',
      actorUserId: 'usr_farmer_01',
      payload: { contractId: 'V28-CTR-001', valueMinor: 35000000000 },
      status: 'ACKNOWLEDGED',
      attempts: 1,
      maxAttempts: 3,
      dispatchedAt: now,
      createdAt: now,
    },
    {
      id: 'V28-EVT-002',
      eventVersion: '1.0',
      eventType: 'INTEGRATION.DISPATCH_PENDING',
      domain: 'INTEGRATION',
      correlationId: 'CORR-V28-SEED-DLQ',
      idempotencyKey: 'SEED-EVT-002',
      tenantId: 'TENANT-UG',
      actorUserId: 'usr_admin_01',
      payload: { connectorId: 'V28-CONN-002', operation: 'VERIFY_RTGS_STATUS' },
      status: 'DEAD_LETTER',
      attempts: 3,
      maxAttempts: 3,
      lastError: 'PROVIDER_CREDENTIALS_NOT_PROVISIONED',
      createdAt: now,
    },
  ];
  for (const ev of events) {
    if (!db.v28DomainEvents.has(ev.id)) db.v28DomainEvents.set(ev.id, ev);
  }

  const dlqs: V28EventDeadLetter[] = [
    {
      id: 'V28-DLQ-001',
      domainEventId: 'V28-EVT-002',
      eventType: 'INTEGRATION.DISPATCH_PENDING',
      correlationId: 'CORR-V28-SEED-DLQ',
      errorClassification: 'PROVIDER_UNCONFIGURED',
      errorMessage: 'Stanbic RTGS live credentials not configured; queued safely for replay once approved.',
      replayCount: 0,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const d of dlqs) {
    if (!db.v28EventDeadLetters.has(d.id)) db.v28EventDeadLetters.set(d.id, d);
  }

  // 9. Document & Evidence Vault V28
  const docs: V28VaultDocumentRecord[] = [
    {
      id: 'V28-DOC-001',
      tenantId: 'TENANT-UG',
      organisationId: 'org_coop_01',
      ownerUserId: 'usr_farmer_01',
      title: 'Elgon Arabica Moisture & Cupping Lab Report Batch #42',
      category: 'INSPECTION_EVIDENCE',
      mimeType: 'application/pdf',
      sizeBytes: 248320,
      storageRef: 'vault://v28/TENANT-UG/V28-DOC-001.pdf',
      sha256Hash: sha256('V28-DOC-001:ELGON:LAB:42'),
      malwareScanStatus: 'SCAN_NOT_PROVISIONED_SANDBOX',
      verificationStatus: 'VERIFIED',
      verifiedByUserId: 'usr_admin_01',
      linkedEntityType: 'CONTRACT',
      linkedEntityId: 'V28-CTR-001',
      version: 1,
      legalHold: false,
      retentionUntil: '2031-11-25T00:00:00.000Z',
      accessLog: [{ userId: 'usr_farmer_01', action: 'UPLOAD', at: now }],
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const doc of docs) {
    if (!db.v28DocumentEvidenceRecords.has(doc.id)) db.v28DocumentEvidenceRecords.set(doc.id, doc);
  }

  // 10. Operational Exceptions, Dual Approvals, Offline Field Continuity & AI Audit
  const exceptions: V28OperationalException[] = [
    {
      id: 'V28-EXC-001',
      domain: 'INTEGRATION',
      severity: 'MEDIUM',
      title: 'External RTGS & Mobile Money Rails Awaiting Live Provider Credentials',
      description: 'External cash-out and bank rails remain in sandbox mode until BoU/partner API credentials and security sign-off are provisioned.',
      linkedEntityId: 'V28-CONN-002',
      organisationId: 'ORG-V25-HOLDING',
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const ex of exceptions) {
    if (!db.v28OperationalExceptions.has(ex.id)) db.v28OperationalExceptions.set(ex.id, ex);
  }

  const dualApprovals: V28DualApprovalRequest[] = [
    {
      id: 'V28-DUAL-001',
      actionType: 'CONNECTOR_PROMOTION',
      targetEntityId: 'V28-CONN-004',
      reason: 'Promote URSB/NIRA Identity Verification adapter after UAT verification',
      requestedByUserId: 'usr_coop_01',
      status: 'PENDING_FIRST_APPROVAL',
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const da of dualApprovals) {
    if (!db.v28DualApprovalRequests.has(da.id)) db.v28DualApprovalRequests.set(da.id, da);
  }

  const fieldOffline: V28FieldOfflineRecord[] = [
    {
      id: 'V28-FOFF-001',
      clientRecordId: 'OFFLINE-REC-UG-MBALE-01',
      taskType: 'FIELD_VERIFICATION',
      officerUserId: 'usr_dealer_01',
      organisationId: 'org_dealer_01',
      targetEntityId: 'V27-PROF-UG-FARM-01',
      countryCode: 'UG',
      district: 'Mbale',
      payload: { moistureReadingPct: 11.4, warehouseScaleCalibrated: true, bagsInspected: 500 },
      evidenceDocumentIds: ['V28-DOC-001'],
      version: 1,
      baseVersion: 1,
      syncState: 'REQUIRES_REVIEW',
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const fr of fieldOffline) {
    if (!db.v28FieldOfflineRecords.has(fr.id)) db.v28FieldOfflineRecords.set(fr.id, fr);
  }

  const aiRuns: V28AiOrchestrationRun[] = [
    {
      id: 'V28-AI-001',
      userId: 'usr_buyer_01',
      role: 'BUYER',
      organisationId: 'org_ent_01',
      taskType: 'FULFILMENT_RISK',
      prompt: 'Assess transit and evidence readiness for Malaba corridor coffee dispatch V28-WF-001.',
      contextSources: ['V28-WF-001', 'V28-FUL-001', 'V28-DOC-001'],
      responseSummary: 'Dispatch from Mbale depot is active (500 bags reserved/consumed) with lab report V28-DOC-001 verified. Final border POD and phytosanitary upload remain required before ledger reconciliation.',
      confidenceLabel: 'HIGH',
      limitationsNotice: 'Telemetry relies on manual operator logs (live GPS unconfigured). Human verification required prior to release.',
      humanApprovalRequired: true,
      autonomousExecutionBlocked: true,
      promptInjectionFlagged: false,
      aiGeneratedNotice: 'AI-GENERATED ADVISORY: Distinguishable from verified operational records; cannot authorise payments or sign contracts.',
      createdAt: now,
    },
  ];
  for (const r of aiRuns) {
    if (!db.v28AiOrchestrationRuns.has(r.id)) db.v28AiOrchestrationRuns.set(r.id, r);
  }
}
