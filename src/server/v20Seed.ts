/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V20.0 - Non-Destructive Schema 18 Idempotent Seed
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type {
  V20CooperativePool,
  V20InteroperabilityWebhook,
  V20LogisticsShipment,
  V20PaymentObligation,
  V20PilotProgramme,
  V20SavedSearch,
  V20TradeRecord,
} from '../types/index.ts';

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export const V20_MARKETPLACE_CATEGORIES: {
  id: string;
  label: string;
  sector: string;
  defaultUnit: string;
}[] = [
  { id: 'Grains & Cereals', label: 'Grains & Cereals', sector: 'AGRICULTURE', defaultUnit: 'BAG_100KG' },
  { id: 'Coffee & Cash Crops', label: 'Coffee & Cash Crops', sector: 'AGRICULTURE', defaultUnit: 'KG' },
  { id: 'Horticulture & Produce', label: 'Horticulture & Produce', sector: 'AGRICULTURE', defaultUnit: 'CRATE' },
  { id: 'Livestock & Dairy', label: 'Livestock & Dairy', sector: 'AGRICULTURE', defaultUnit: 'LITRE' },
  { id: 'Fisheries & Aquaculture', label: 'Fisheries & Aquaculture', sector: 'AGRICULTURE', defaultUnit: 'KG' },
  { id: 'Seeds & Agro-Inputs', label: 'Seeds & Agro-Inputs', sector: 'AGRO_INPUTS', defaultUnit: 'BAG_50KG' },
  { id: 'Processed Foods & Milling', label: 'Processed Foods & Milling', sector: 'INDUSTRY', defaultUnit: 'KG' },
  { id: 'Manufacturing & Textiles', label: 'Manufacturing & Textiles', sector: 'MANUFACTURING', defaultUnit: 'PIECE' },
  { id: 'Construction & Hardware', label: 'Construction & Hardware', sector: 'CONSTRUCTION', defaultUnit: 'TONNE' },
  { id: 'Transport & Haulage', label: 'Transport & Haulage', sector: 'LOGISTICS', defaultUnit: 'SERVICE_UNIT' },
  { id: 'Storage & Cold Chain', label: 'Storage & Cold Chain', sector: 'WAREHOUSING', defaultUnit: 'TONNE' },
  { id: 'Equipment & Machinery Leasing', label: 'Equipment & Machinery Leasing', sector: 'SERVICES', defaultUnit: 'SERVICE_UNIT' },
  { id: 'Skilled Trades & Field Services', label: 'Skilled Trades & Field Services', sector: 'SERVICES', defaultUnit: 'SERVICE_UNIT' },
  { id: 'Cooperatives & Bulk Supply', label: 'Cooperatives & Bulk Supply', sector: 'COOPERATIVES', defaultUnit: 'TONNE' },
  { id: 'Institutional Procurement', label: 'Institutional Procurement', sector: 'PUBLIC_PROCUREMENT', defaultUnit: 'TONNE' },
];

export function seedV20Collections(db: any) {
  const now = '2026-11-19T08:00:00.000Z';

  // 1. Seeded End-to-End Unified Trades
  if (db.v20Trades.size === 0) {
    const agrSummary1 =
      'ECONEX COMMERCIAL RECORD SUMMARY | Trade: V20-TRD-ELGON-01 | Buyer: V17-PART-BUYER-01 | Seller: V17-PART-FARMER-01 | Item: Washed Bugisu Arabica Parchment Coffee (AA Grade) | Qty: 500 KG @ 12,500 UGX = 6,250,000 UGX | Delivery: Ex-Mbale Collection Hub -> Kampala | NOTE: Operational commercial record only; not a court-executed statutory deed.';
    const agrSummary2 =
      'ECONEX COMMERCIAL RECORD SUMMARY | Trade: V20-TRD-MAIZE-02 | Buyer: V17-PART-BUYER-01 | Seller: V17-PART-COOP-01 | Item: Clean Dried White Maize Grain (100kg Bag) | Qty: 40 BAG_100KG @ 145,000 UGX = 5,800,000 UGX | Delivery: Mbale Cooperative Silo -> Kampala | NOTE: Operational commercial record only; not a court-executed statutory deed.';

    const trades: V20TradeRecord[] = [
      {
        id: 'V20-TRD-ELGON-01',
        tenantId: 'TEN-UG-ELGON-01',
        listingId: 'V17-LIST-COFFEE-01',
        cooperativeId: 'V17-COOP-ELGON-01',
        buyerParticipantId: 'V17-PART-BUYER-01',
        sellerParticipantId: 'V17-PART-FARMER-01',
        organizationId: 'V17-ORG-ELGON-COOP',
        title: 'Bugisu Arabica Coffee Parchment Lot #44',
        category: 'Coffee & Cash Crops',
        sector: 'AGRICULTURE',
        countryCode: 'UG',
        district: 'Mbale',
        quantity: 500,
        unitCode: 'KG',
        unitPrice: 12500,
        currency: 'UGX',
        totalAmount: 6250000,
        baseUgxEquivalent: 6250000,
        fxRateUsed: 1,
        stage: 'FULFILMENT_IN_PROGRESS',
        idempotencyKey: 'SEED-V20-TRD-ELGON-01',
        version: 3,
        linkedShipmentId: 'V20-SHP-ELGON-01',
        paymentObligationId: 'V20-POB-ELGON-01',
        isTestRecord: false,
        deliveryTerms: 'Ex-Mbale Hub -> Kampala Warehouse',
        qualitySpec: 'AA Washed (<12% moisture)',
        agreementSummaryText: agrSummary1,
        agreementSummarySha256: sha256(agrSummary1),
        agreementRecordDisclaimer:
          'ECONEX commercial record summary generated from agreed terms. Does not constitute legal representation or statutory notarization.',
        crossBorderChecklistCleared: true,
        stageHistory: [
          { stage: 'ENQUIRY', actorId: 'usr_buyer_01', actorRole: 'BUYER', note: 'Initial buyer enquiry submitted.', timestamp: now },
          { stage: 'QUOTATION', actorId: 'usr_farmer_01', actorRole: 'FARMER', note: 'Quoted 12,500 UGX/KG for 500 KG.', timestamp: now },
          { stage: 'OFFER_ACCEPTED', actorId: 'usr_buyer_01', actorRole: 'BUYER', note: 'Offer accepted by buyer.', timestamp: now },
          { stage: 'AGREEMENT_CREATED', actorId: 'usr_farmer_01', actorRole: 'FARMER', note: 'Commercial record generated.', timestamp: now },
          { stage: 'FULFILMENT_PLANNED', actorId: 'usr_coop_01', actorRole: 'COOPERATIVE_ADMIN', note: 'Transport corridor assigned.', timestamp: now },
          { stage: 'FULFILMENT_IN_PROGRESS', actorId: 'usr_transporter_01', actorRole: 'TRANSPORTER', note: 'Cargo collected from Mbale Hub.', timestamp: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V20-TRD-MAIZE-02',
        tenantId: 'TEN-UG-ELGON-01',
        listingId: 'V17-LIST-MAIZE-02',
        cooperativeId: 'V17-COOP-ELGON-01',
        buyerParticipantId: 'V17-PART-BUYER-01',
        sellerParticipantId: 'V17-PART-COOP-01',
        organizationId: 'V17-ORG-ELGON-COOP',
        title: 'Clean Dried White Maize Grain Lot #12',
        category: 'Grains & Cereals',
        sector: 'AGRICULTURE',
        countryCode: 'UG',
        district: 'Mbale',
        quantity: 40,
        unitCode: 'BAG_100KG',
        unitPrice: 145000,
        currency: 'UGX',
        totalAmount: 5800000,
        baseUgxEquivalent: 5800000,
        fxRateUsed: 1,
        stage: 'COMPLETED',
        idempotencyKey: 'SEED-V20-TRD-MAIZE-02',
        version: 6,
        linkedShipmentId: 'V20-SHP-MAIZE-02',
        paymentObligationId: 'V20-POB-MAIZE-02',
        isTestRecord: false,
        deliveryTerms: 'Mbale Cooperative Silo -> Kampala Mill',
        qualitySpec: 'EAS 2 Grade 1 (<=13% moisture)',
        agreementSummaryText: agrSummary2,
        agreementSummarySha256: sha256(agrSummary2),
        agreementRecordDisclaimer:
          'ECONEX commercial record summary generated from agreed terms. Does not constitute legal representation or statutory notarization.',
        crossBorderChecklistCleared: true,
        stageHistory: [
          { stage: 'AGREEMENT_CREATED', actorId: 'usr_coop_01', actorRole: 'COOPERATIVE_ADMIN', note: 'Agreed 40 bags @ 145,000 UGX.', timestamp: now },
          { stage: 'DELIVERY_EVIDENCE_SUBMITTED', actorId: 'usr_transporter_01', actorRole: 'TRANSPORTER', note: '40 bags delivered cleanly.', timestamp: now },
          { stage: 'BUYER_CONFIRMATION', actorId: 'usr_buyer_01', actorRole: 'BUYER', note: 'Buyer confirmed receipt.', timestamp: now },
          { stage: 'RECONCILIATION', actorId: 'usr_buyer_01', actorRole: 'BUYER', note: 'Sandbox payment matched 5,800,000 UGX.', timestamp: now },
          { stage: 'COMPLETED', actorId: 'usr_admin_01', actorRole: 'PLATFORM_ADMIN', note: 'Trade cycle closed cleanly.', timestamp: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const t of trades) db.v20Trades.set(t.id, t);
  }

  // 2. Linked Logistics Shipments
  if (db.v20Shipments.size === 0) {
    const shipments: V20LogisticsShipment[] = [
      {
        id: 'V20-SHP-ELGON-01',
        tenantId: 'TEN-UG-ELGON-01',
        tradeId: 'V20-TRD-ELGON-01',
        transporterParticipantId: 'V17-PART-TRANS-01',
        originCountry: 'UG',
        originDistrict: 'Mbale',
        destinationCountry: 'UG',
        destinationDistrict: 'Kampala',
        corridorCode: 'UG-ELGON-KLA',
        status: 'IN_TRANSIT',
        version: 2,
        estimatedWeightKg: 500,
        agreedFreightAmount: 240000,
        currency: 'UGX',
        statusHistory: [
          { status: 'REQUESTED', actorId: 'usr_farmer_01', note: 'Freight booked for 500 KG Arabica.', timestamp: now },
          { status: 'ASSIGNED', actorId: 'usr_coop_01', note: 'Assigned Mbale-Kampala carrier.', timestamp: now },
          { status: 'IN_TRANSIT', actorId: 'usr_transporter_01', note: 'En route via Iganga-Jinja highway.', timestamp: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V20-SHP-MAIZE-02',
        tenantId: 'TEN-UG-ELGON-01',
        tradeId: 'V20-TRD-MAIZE-02',
        transporterParticipantId: 'V17-PART-TRANS-01',
        originCountry: 'UG',
        originDistrict: 'Mbale',
        destinationCountry: 'UG',
        destinationDistrict: 'Kampala',
        corridorCode: 'UG-ELGON-KLA',
        status: 'CLOSED',
        version: 4,
        estimatedWeightKg: 4000,
        agreedFreightAmount: 420000,
        currency: 'UGX',
        deliveryEvidence: {
          recipientName: 'Kampala Agro-Export Receiving Clerk',
          quantityReceived: 40,
          shortageQty: 0,
          damageNotes: 'All 40 bags intact and dry.',
          consentedLocation: 'Kampala Industrial Area Receiving Bay',
          capturedAt: now,
          offlineCaptured: false,
          submittedBy: 'usr_transporter_01',
        },
        statusHistory: [
          { status: 'REQUESTED', actorId: 'usr_coop_01', note: '4 MT maize transport requested.', timestamp: now },
          { status: 'DELIVERY_CONFIRMED', actorId: 'usr_buyer_01', note: '40 bags received without shortage.', timestamp: now },
          { status: 'CLOSED', actorId: 'usr_admin_01', note: 'Shipment archived.', timestamp: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const s of shipments) db.v20Shipments.set(s.id, s);
  }

  // 3. Payment Obligations & Reconciliation
  if (db.v20PaymentObligations.size === 0) {
    const obligations: V20PaymentObligation[] = [
      {
        id: 'V20-POB-ELGON-01',
        tenantId: 'TEN-UG-ELGON-01',
        tradeId: 'V20-TRD-ELGON-01',
        payerParticipantId: 'V17-PART-BUYER-01',
        payeeParticipantId: 'V17-PART-FARMER-01',
        currency: 'UGX',
        expectedAmount: 6250000,
        receivedAmount: 0,
        varianceAmount: -6250000,
        outstandingAmount: 6250000,
        disputedAmount: 0,
        status: 'PENDING',
        paymentChannel: 'SANDBOX_MOMO',
        ledgerScope: 'SANDBOX_RECONCILIATION',
        sandboxDisclaimer:
          'Non-bank coordination & reconciliation obligation only. Simulated/sandbox PSP channel — live payment execution awaits Gate 10 & Gate 24 clearance.',
        isTestRecord: false,
        receiptReferences: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'V20-POB-MAIZE-02',
        tenantId: 'TEN-UG-ELGON-01',
        tradeId: 'V20-TRD-MAIZE-02',
        payerParticipantId: 'V17-PART-BUYER-01',
        payeeParticipantId: 'V17-PART-COOP-01',
        currency: 'UGX',
        expectedAmount: 5800000,
        receivedAmount: 5800000,
        varianceAmount: 0,
        outstandingAmount: 0,
        disputedAmount: 0,
        status: 'RECONCILED',
        paymentChannel: 'SANDBOX_BANK',
        ledgerEntryId: 'V20-JRN-SEED-02',
        ledgerScope: 'SANDBOX_RECONCILIATION',
        sandboxDisclaimer:
          'Non-bank coordination & reconciliation obligation only. Simulated/sandbox PSP channel — live payment execution awaits Gate 10 & Gate 24 clearance.',
        isTestRecord: false,
        receiptReferences: [
          {
            ref: 'SBX-RCPT-MAIZE-02',
            amount: 5800000,
            channel: 'SANDBOX_BANK',
            recordedBy: 'usr_buyer_01',
            recordedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
    for (const o of obligations) db.v20PaymentObligations.set(o.id, o);
  }

  // 4. Cooperative Collective Pool + Member-Isolated Statements
  if (db.v20CooperativePools.size === 0) {
    const pool: V20CooperativePool = {
      id: 'V20-POOL-ELGON-01',
      tenantId: 'TEN-UG-ELGON-01',
      cooperativeId: 'V17-COOP-ELGON-01',
      title: 'Elgon Season-B Collective Arabica Export Pool',
      category: 'Coffee & Cash Crops',
      unitCode: 'KG',
      totalQty: 1500,
      currency: 'UGX',
      targetUnitPrice: 12500,
      status: 'AGGREGATED',
      contributions: [
        {
          id: 'V20-CONTRIB-01',
          farmerParticipantId: 'V17-PART-FARMER-01',
          farmerName: 'Sarah Namubiru',
          qtyContributed: 900,
          qualityGrade: 'AA Washed',
          contributedAt: now,
        },
        {
          id: 'V20-CONTRIB-02',
          farmerParticipantId: 'V17-PART-COOP-01',
          farmerName: 'Elgon Growers Lot B',
          qtyContributed: 600,
          qualityGrade: 'AA Washed',
          contributedAt: now,
        },
      ],
      memberStatements: [
        {
          id: 'V20-STMT-01',
          poolId: 'V20-POOL-ELGON-01',
          cooperativeId: 'V17-COOP-ELGON-01',
          farmerParticipantId: 'V17-PART-FARMER-01',
          farmerUserId: 'usr_farmer_01',
          farmerName: 'Sarah Namubiru',
          qtyContributed: 900,
          shareRatio: 0.6,
          grossEntitlementAmount: 11250000,
          cooperativeServiceDeduction: 337500,
          netPayableAmount: 10912500,
          currency: 'UGX',
          settlementStatus: 'CALCULATED',
          generatedAt: now,
        },
        {
          id: 'V20-STMT-02',
          poolId: 'V20-POOL-ELGON-01',
          cooperativeId: 'V17-COOP-ELGON-01',
          farmerParticipantId: 'V17-PART-COOP-01',
          farmerUserId: 'usr_coop_01',
          farmerName: 'Elgon Growers Lot B',
          qtyContributed: 600,
          shareRatio: 0.4,
          grossEntitlementAmount: 7500000,
          cooperativeServiceDeduction: 225000,
          netPayableAmount: 7275000,
          currency: 'UGX',
          settlementStatus: 'CALCULATED',
          generatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.v20CooperativePools.set(pool.id, pool);
  }

  // 5. Saved Searches
  if (db.v20SavedSearches.size === 0) {
    const s: V20SavedSearch = {
      id: 'V20-SRCH-01',
      tenantId: 'TEN-UG-KLA-01',
      userId: 'usr_buyer_01',
      label: 'Mbale AA Arabica Under 13,500 UGX',
      category: 'Coffee & Cash Crops',
      countryCode: 'UG',
      district: 'Mbale',
      maxUnitPrice: 13500,
      queryText: 'Arabica',
      alertEnabled: true,
      createdAt: now,
    };
    db.v20SavedSearches.set(s.id, s);
  }

  // 6. Configurable Uganda-First Pilot Programme
  if (db.v20PilotProgrammes.size === 0) {
    const pilot: V20PilotProgramme = {
      id: 'V20-PILOT-UG-ELGON-01',
      tenantId: 'TEN-UG-ELGON-01',
      code: 'PILOT-UG-ELGON-2026',
      name: 'Uganda Mount Elgon Agricultural & Trade Corridor Pilot',
      countryCode: 'UG',
      regionName: 'Eastern Region (Elgon Basin -> Kampala)',
      districts: ['Mbale', 'Sironko', 'Kapchorwa', 'Jinja', 'Kampala'],
      status: 'ACTIVE',
      supportContact: 'pilot-ops-ug@vinexsah.example (Controlled Sandbox Desk)',
      onboardedParticipants: [
        {
          participantId: 'V17-PART-FARMER-01',
          displayName: 'Sarah Namubiru',
          roleType: 'FARMER',
          district: 'Mbale',
          onboardedAt: now,
          supportNotes: 'Assisted onboarding complete; low-bandwidth offline mode enabled.',
        },
        {
          participantId: 'V17-PART-BUYER-01',
          displayName: 'Kampala Agro-Export Buyers Ltd',
          roleType: 'BUYER',
          district: 'Kampala',
          onboardedAt: now,
          supportNotes: 'Buyer reconciliation desk verified in sandbox.',
        },
      ],
      metrics: {
        actual: {
          onboardedCount: 2,
          activeTradesCount: 1,
          completedTradesCount: 1,
          totalTradeVolumeUgx: 12050000,
        },
        simulated: {
          sandboxPaymentsCount: 1,
          sandboxVolumeUgx: 5800000,
        },
        test: {
          verificationTradesCount: 0,
        },
        target: {
          targetParticipants: 50,
          targetCompletedTrades: 25,
        },
        projection: {
          estimatedMonthlyGmUgx: 75000000,
          projectionDisclaimer: 'Internal planning target/projection only — NOT realized historical performance.',
        },
      },
      createdAt: now,
      updatedAt: now,
    };
    db.v20PilotProgrammes.set(pilot.id, pilot);
  }

  // 7. Interoperability Sandbox Webhook
  if (db.v20InteroperabilityWebhooks.size === 0) {
    const wh: V20InteroperabilityWebhook = {
      id: 'V20-WHK-SBX-01',
      tenantId: 'TEN-UG-ELGON-01',
      partnerName: 'EAC Corridor Logistics Partner Sandbox',
      endpointUrl: 'https://sandbox-partner.example.invalid/econex/v1/events',
      apiVersion: 'v1',
      events: ['TRADE_AGREEMENT_CREATED', 'SHIPMENT_DELIVERY_CONFIRMED'],
      mode: 'SANDBOX',
      status: 'ACTIVE',
      createdAt: now,
    };
    db.v20InteroperabilityWebhooks.set(wh.id, wh);
  }
}
