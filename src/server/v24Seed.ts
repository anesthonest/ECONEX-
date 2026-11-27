/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V24.0 - Universal Commerce, Supply Chain & Economic Execution Network Seed
 * Schema 22 Additive Deterministic Seeding (30 Sectors, 5 Corridors, Warehouses, Inventory, Trade, Obligations)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type { ArosDatabase } from './db.ts';
import type {
  V24ApiClientCredential,
  V24AuditEvent,
  V24BillOfMaterials,
  V24CommerceListing,
  V24CommercialAgreement,
  V24CommercialDocument,
  V24CommercialOrder,
  V24CommercialParticipant,
  V24CommercialProject,
  V24CommercialThread,
  V24InventoryItem,
  V24LogisticsShipment,
  V24NegotiationThread,
  V24PaymentObligation,
  V24ProcurementRequest,
  V24ProductionOrder,
  V24PurchaseOrder,
  V24Quotation,
  V24RegionalCorridorGuide,
  V24RequestForQuotation,
  V24SectorClassification,
  V24StockMovement,
  V24WarehouseFacility,
  V24WebhookSubscription,
} from '../types/index.ts';

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

export function seedV24Collections(db: ArosDatabase): void {
  const now = '2026-06-01T08:00:00.000Z';
  const tenantId = 'TEN-UG-ELGON-01';

  // 1. 30 Universal Economic Sector Classifications
  const sectorDefs: Array<[string, string, string, string, string, boolean, boolean, boolean, boolean]> = [
    ['SEC-AGRI', 'AGRI', 'Agriculture & Agribusiness', 'Primary Production', 'Crop farming, horticulture, livestock, dairy, and primary rural aggregation.', true, true, true, true],
    ['SEC-FOOD', 'FOOD', 'Food Processing & Beverages', 'Manufacturing & Agro-Industry', 'Grain milling, coffee roasting, juice bottling, edible oils, and packaging.', true, true, true, false],
    ['SEC-WHOLESALE', 'WHOLESALE', 'Wholesale & General Distribution', 'Trade & Distribution', 'Bulk wholesale supply, regional depot distribution, and FMCG trade.', true, true, false, false],
    ['SEC-MANUF', 'MANUF', 'Light & Industrial Manufacturing', 'Industrial Production', 'Fabrication, battery assembly, plastics, building hardware, and OEM output.', true, true, true, false],
    ['SEC-CONSTR', 'CONSTR', 'Construction & Civil Engineering', 'Infrastructure & Real Assets', 'Cement, steel reinforcement, electrical fit-out, plumbing, and civil works.', true, true, true, false],
    ['SEC-ENERGY', 'ENERGY', 'Renewable Energy & Power Systems', 'Energy & Utilities', 'Solar PV arrays, lithium battery storage, inverters, and clean microgrids.', true, true, true, false],
    ['SEC-HEALTH', 'HEALTH', 'Healthcare Supplies & Diagnostics', 'Social & Medical Services', 'Clinic consumables, cold-chain medical units, PPE, and lab equipment.', true, true, false, false],
    ['SEC-TECH', 'TECH', 'Software, ICT & Cloud Services', 'Digital Economy', 'ERP systems, POS hardware, networking, cybersecurity, and software engineering.', true, true, false, false],
    ['SEC-PROFSV', 'PROFSV', 'Professional, Legal & Advisory Services', 'Business Services', 'Audit preparation, quantity surveying, compliance advisory, and engineering design.', false, true, false, false],
    ['SEC-MAINTN', 'MAINTN', 'Industrial Maintenance & Calibration', 'Field Engineering', 'Plant servicing, cold-room repair, generator overhauls, and metrology.', false, true, false, false],
    ['SEC-COOPS', 'COOPS', 'Cooperatives & Producer Unions', 'Collective Commerce', 'Multi-member cooperative procurement, shared warehousing, and collective sales.', true, true, false, true],
    ['SEC-ENVIRO', 'ENVIRO', 'Water, Recycling & Environmental Systems', 'Sustainability', 'Rainwater harvesting, waste recovery, water filtration, and green packaging.', true, true, true, false],
    ['SEC-MEDIA', 'MEDIA', 'Creative, Printing & Brand Production', 'Media & Creative', 'Commercial printing, industrial labelling, corporate video, and marketing.', true, true, true, false],
    ['SEC-LOGIST', 'LOGIST', 'Freight, Transport & Corridor Logistics', 'Transport & Supply Chain', 'Trucking, courier delivery, cold-chain haulage, and cross-border freight.', false, true, false, false],
    ['SEC-PUBLIC', 'PUBLIC', 'Institutional & Public Tender Preparation', 'Institutional Procurement', 'School, hospital, NGO, and public tender specification preparation.', true, true, false, false],
    ['SEC-GENSUP', 'GENSUP', 'General Office & Enterprise Supplies', 'Business Supplies', 'Stationery, PPE kits, furniture, and recurring facility consumables.', true, true, false, false],
    ['SEC-TEXTILE', 'TEXTILE', 'Textiles, Garments & Uniforms', 'Manufacturing & Retail', 'Workwear uniforms, protective overalls, woven sacks, and apparel.', true, true, true, false],
    ['SEC-CHEM', 'CHEM', 'Industrial Chemicals & Sanitizers', 'Industrial Inputs', 'Water treatment reagents, food-grade disinfectants, and cleaning inputs.', true, true, true, false],
    ['SEC-EDU', 'EDU', 'Education & Vocational Training Services', 'Human Capital', 'Technical training labs, educational kits, and workplace certification.', true, true, false, false],
    ['SEC-TOURISM', 'TOURISM', 'Hospitality & Eco-Tourism Supply', 'Hospitality', 'Lodge consumables, catering supply contracts, and facility linen management.', true, true, false, false],
    ['SEC-MINING', 'MINING', 'Quarrying, Aggregates & Minerals', 'Extractives & Materials', 'Crushed stone, sand, lime, ceramics raw inputs, and safety gear.', true, true, false, false],
    ['SEC-REALEST', 'REALEST', 'Commercial Real Estate & Facility Leases', 'Property & Space', 'Warehouse bays, factory workshops, retail stalls, and cold storage leases.', false, true, false, false],
    ['SEC-AUTOPARTS', 'AUTOPARTS', 'Automotive Fleet Parts & Servicing', 'Mobility & Fleet', 'Heavy truck tyres, lubricants, spare parts, and fleet maintenance.', true, true, false, false],
    ['SEC-COLDCHAIN', 'COLDCHAIN', 'Cold-Chain Storage & Refrigeration', 'Temperature Logistics', 'Solar cold rooms, blast chillers, insulated crates, and reefers.', true, true, true, false],
    ['SEC-PRINTPACK', 'PRINTPACK', 'Packaging, Cartons & Barcoding', 'Supply Chain Inputs', 'Corrugated cartons, export pallets, thermal labels, and shrink wrap.', true, true, true, false],
    ['SEC-TELECOM', 'TELECOM', 'Telecoms & Last-Mile Connectivity', 'Digital Infrastructure', 'Fibre splicing, rural towers, VSAT terminals, and field routers.', true, true, false, false],
    ['SEC-SECURITY', 'SECURITY', 'Commercial Security & Safety Systems', 'Risk & Safety', 'Access control hardware, CCTV installation, fire suppression, and guarding.', true, true, false, false],
    ['SEC-WATER', 'WATER', 'Irrigation, Boreholes & Water Engineering', 'Water Infrastructure', 'Solar borehole pumps, HDPE piping, tanks, and municipal plumbing.', true, true, true, false],
    ['SEC-FINOPS', 'FINOPS', 'Accounting, Bookkeeping & ERP Integration', 'Financial Operations', 'Invoicing automation, inventory reconciliation advisory, and bookkeeping.', false, true, false, false],
    ['SEC-EXPORT', 'EXPORT', 'Cross-Border Export Aggregation & Trading', 'Regional Trade', 'East African Community and AfCFTA regional sourcing and export consolidation.', true, true, false, false],
  ];

  for (const [id, code, name, groupName, description, sg, ss, sm, isAgri] of sectorDefs) {
    if (!db.v24Sectors.has(id)) {
      const sec: V24SectorClassification = {
        id,
        code,
        name,
        groupName,
        description,
        primaryActivities: ['Commercial Supply', 'RFQs & Quotations', 'Fulfilment & Invoicing'],
        supportedParticipantCategories: ['SOLE_PROPRIETOR', 'SME', 'LARGE_ENTERPRISE', 'MANUFACTURER', 'COOPERATIVE', 'SERVICE_PROVIDER', 'INSTITUTION'],
        supportsGoods: sg,
        supportsServices: ss,
        supportsManufacturing: sm,
        isAgricultural: isAgri,
      };
      db.v24Sectors.set(id, sec);
    }
  }

  // 2. 5 EAC & AfCFTA Corridor Guides (customsClearanceClaimed ALWAYS false)
  const corridorSeed: V24RegionalCorridorGuide[] = [
    {
      corridorCode: 'CORR-UG-KE-MALABA',
      name: 'Northern Corridor: Kampala — Malaba OSBP — Nairobi — Mombasa',
      originCountry: 'UG',
      destinationCountry: 'KE',
      borderPost: 'Malaba One-Stop Border Post (OSBP)',
      distanceKmEstimate: 655,
      requiredGuidanceDocs: ['Commercial Invoice', 'EAC Certificate of Origin', 'Packing List', 'Consignment Waybill'],
      customsClearanceClaimed: false,
      externalAuthorityNotice: 'Guidance checklist only. Official customs declarations must be submitted via URA / KRA / EAC Single Customs Territory portals.',
    },
    {
      corridorCode: 'CORR-UG-KE-BUSIA',
      name: 'Central-East Corridor: Kampala — Busia OSBP — Kisumu',
      originCountry: 'UG',
      destinationCountry: 'KE',
      borderPost: 'Busia OSBP',
      distanceKmEstimate: 395,
      requiredGuidanceDocs: ['Commercial Invoice', 'EAC Simplified Certificate of Origin', 'Waybill'],
      customsClearanceClaimed: false,
      externalAuthorityNotice: 'Guidance checklist only. No automated URA/KRA customs clearing performed.',
    },
    {
      corridorCode: 'CORR-UG-TZ-MUTUKULA',
      name: 'Southern Corridor: Kampala — Mutukula OSBP — Mwanza — Dar es Salaam',
      originCountry: 'UG',
      destinationCountry: 'TZ',
      borderPost: 'Mutukula OSBP',
      distanceKmEstimate: 1380,
      requiredGuidanceDocs: ['Commercial Invoice', 'EAC Certificate of Origin', 'Transit Manifest', 'Packing List'],
      customsClearanceClaimed: false,
      externalAuthorityNotice: 'Guidance checklist only. Official TRA / URA clearance handled externally.',
    },
    {
      corridorCode: 'CORR-UG-RW-KATUNA',
      name: 'South-West Corridor: Kampala — Katuna/Gatuna OSBP — Kigali',
      originCountry: 'UG',
      destinationCountry: 'RW',
      borderPost: 'Katuna / Gatuna OSBP',
      distanceKmEstimate: 510,
      requiredGuidanceDocs: ['Commercial Invoice', 'EAC Certificate of Origin', 'Delivery Note', 'Waybill'],
      customsClearanceClaimed: false,
      externalAuthorityNotice: 'Guidance checklist only. Official RRA / URA clearance handled externally.',
    },
    {
      corridorCode: 'CORR-UG-CD-MPONDWE',
      name: 'Great Lakes AfCFTA Corridor: Kampala — Mpondwe — Beni / Goma',
      originCountry: 'UG',
      destinationCountry: 'CD',
      borderPost: 'Mpondwe Border Post',
      distanceKmEstimate: 440,
      requiredGuidanceDocs: ['Commercial Invoice', 'AfCFTA Certificate of Origin Reference', 'Packing List', 'Export Exit Note'],
      customsClearanceClaimed: false,
      externalAuthorityNotice: 'Guidance checklist only. Official DGDA / URA border formalities handled externally.',
    },
  ];
  for (const c of corridorSeed) {
    if (!db.v24Corridors.has(c.corridorCode)) {
      db.v24Corridors.set(c.corridorCode, c);
    }
  }

  //Helper to read matching V23 wallet identity accurately
  const getWalletMeta = (walletId: string) => {
    const w = db.v23Wallets.get(walletId);
    return {
      v23IdentityId: w?.participantIdentityId,
      v23WalletId: w?.id,
      v23Euwn: w?.euwn,
      euwn: w?.euwn,
    };
  };

  // 3. 6 Seeded Commercial Participants linked to V23 Wallets
  const participantSeeds: Array<{
    id: string;
    userId: string;
    walletId: string;
    extraReps: { userId: string; role: string }[];
    displayName: string;
    legalName: string;
    organizationType: V24CommercialParticipant['organizationType'];
    sectorIds: string[];
    primarySectorId: string;
    countries: string[];
    locations: string[];
    description: string;
    productsAndServices: string[];
    verificationStatus: V24CommercialParticipant['verificationStatus'];
  }> = [
    {
      id: 'PRTC-V24-001',
      userId: 'usr_farmer_01',
      walletId: 'WLT-V23-001',
      extraReps: [],
      displayName: 'Elgon Highland Producers & Agro-Processing',
      legalName: 'Elgon Highland Producers Enterprise Ltd',
      organizationType: 'COOPERATIVE',
      sectorIds: ['SEC-AGRI', 'SEC-FOOD', 'SEC-COOPS'],
      primarySectorId: 'SEC-AGRI',
      countries: ['UG', 'KE'],
      locations: ['Mbale', 'Kapchorwa'],
      description: 'Multi-sector agricultural producer & graded dry-food supplier.',
      productsAndServices: ['Washed Arabica Coffee', 'Graded Maize Flour', 'Dry Beans'],
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'PRTC-V24-002',
      userId: 'usr_buyer_01',
      walletId: 'WLT-V23-002',
      extraReps: [{ userId: 'usr_admin_01', role: 'DELEGATED_APPROVER' }],
      displayName: 'Kampala Wholesale & Industrial Buyers Group',
      legalName: 'Kampala Wholesale & Industrial Buyers Ltd',
      organizationType: 'WHOLESALER',
      sectorIds: ['SEC-WHOLESALE', 'SEC-CONSTR', 'SEC-ENERGY', 'SEC-FOOD'],
      primarySectorId: 'SEC-WHOLESALE',
      countries: ['UG', 'KE', 'TZ'],
      locations: ['Kampala Industrial Area', 'Nairobi ICD'],
      description: 'Regional procurement, wholesale distribution & commercial off-take buyer.',
      productsAndServices: ['Bulk Procurement', 'Wholesale Distribution', 'Project Contracting'],
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'PRTC-V24-003',
      userId: 'usr_dealer_01',
      walletId: 'WLT-V23-003',
      extraReps: [],
      displayName: 'East Africa Solar, Hardware & Manufacturing Co.',
      legalName: 'East Africa Solar & Hardware Manufacturing Ltd',
      organizationType: 'MANUFACTURER',
      sectorIds: ['SEC-MANUF', 'SEC-ENERGY', 'SEC-CONSTR', 'SEC-TECH', 'SEC-MAINTN'],
      primarySectorId: 'SEC-MANUF',
      countries: ['UG', 'KE', 'RW'],
      locations: ['Kampala', 'Jinja', 'Kigali'],
      description: 'Light industrial manufacturer supplying solar inverters, cold-room kits, and hardware.',
      productsAndServices: ['10kVA Solar Inverter Kits', 'Cold-Room Panels', 'Hardware Calibration'],
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'PRTC-V24-004',
      userId: 'usr_coop_01',
      walletId: 'WLT-V23-004',
      extraReps: [],
      displayName: 'Bugisu Cooperative Depot & Supply Union',
      legalName: 'Bugisu Cooperative Supply Union Ltd',
      organizationType: 'COOPERATIVE',
      sectorIds: ['SEC-COOPS', 'SEC-AGRI', 'SEC-WHOLESALE'],
      primarySectorId: 'SEC-COOPS',
      countries: ['UG'],
      locations: ['Mbale', 'Sironko'],
      description: 'Cooperative warehousing, shared procurement, and rural supply hub.',
      productsAndServices: ['Shared Storage Bays', 'Bulk Input Distribution'],
      verificationStatus: 'DOCUMENT_REVIEWED',
    },
    {
      id: 'PRTC-V24-005',
      userId: 'usr_transporter_01',
      walletId: 'WLT-V23-005',
      extraReps: [{ userId: 'usr_trans_01', role: 'CARRIER_OPERATOR' }],
      displayName: 'Northern Corridor Freight & Logistics Ltd',
      legalName: 'Northern Corridor Freight & Logistics Ltd',
      organizationType: 'LOGISTICS_CARRIER',
      sectorIds: ['SEC-LOGIST', 'SEC-COLDCHAIN', 'SEC-AUTOPARTS'],
      primarySectorId: 'SEC-LOGIST',
      countries: ['UG', 'KE', 'TZ', 'RW'],
      locations: ['Kampala', 'Malaba', 'Nairobi', 'Mombasa'],
      description: 'Regional cross-border haulage, cold-chain reefers, and hub transfers.',
      productsAndServices: ['28T Flatbed Freight', 'Cold-Chain Reefer Transport', 'Last-Mile Distribution'],
      verificationStatus: 'VERIFIED',
    },
    {
      id: 'PRTC-V24-006',
      userId: 'usr_admin_01',
      walletId: 'WLT-V23-006',
      extraReps: [],
      displayName: 'VINEXSAH Institutional Operations Sandbox',
      legalName: 'VINEXSAH Commercial Oversight Desk',
      organizationType: 'INSTITUTION',
      sectorIds: ['SEC-PUBLIC', 'SEC-PROFSV', 'SEC-FINOPS'],
      primarySectorId: 'SEC-PUBLIC',
      countries: ['UG'],
      locations: ['Kampala'],
      description: 'Institutional procurement prep, compliance oversight, and sandbox governance desk.',
      productsAndServices: ['Compliance Review', 'Tender Readiness'],
      verificationStatus: 'VERIFIED',
    },
  ];

  for (const p of participantSeeds) {
    if (!db.v24Participants.has(p.id)) {
      const wMeta = getWalletMeta(p.walletId);
      const part: V24CommercialParticipant = {
        id: p.id,
        tenantId,
        userId: p.userId,
        ...wMeta,
        authorizedRepresentatives: [{ userId: p.userId, role: 'PRIMARY_OWNER' }, ...p.extraReps],
        displayName: p.displayName,
        legalName: p.legalName,
        organizationType: p.organizationType,
        sectorIds: p.sectorIds,
        primarySectorId: p.primarySectorId,
        operatingCountries: p.countries,
        operatingLocations: p.locations,
        description: p.description,
        productsAndServices: p.productsAndServices,
        capabilities: ['COMMERCIAL_ORDERS', 'INVOICING', 'LOGISTICS_COORDINATION'],
        verificationStatus: p.verificationStatus,
        identityVerificationStatus: p.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING_REVIEW',
        legalRegistrationStatus: p.verificationStatus === 'VERIFIED' ? 'HUMAN_REVIEWED' : 'REGISTRY_DOCUMENT_SUBMITTED',
        operationalCapabilityStatus: 'INSPECTED_SANDBOX',
        consentGiven: true,
        consentTimestamp: now,
        isTestRecord: true,
        completedOrdersCount: 4,
        onTimeDeliveryRatePct: 96,
        disputeCount: 0,
        paidBadgesForbidden: true,
        createdAt: now,
        updatedAt: now,
      };
      db.v24Participants.set(part.id, part);
    }
  }

  // 4. Warehouses (WH-V24-001, WH-V24-002)
  if (!db.v24Warehouses.has('WH-V24-001')) {
    const wh1: V24WarehouseFacility = {
      id: 'WH-V24-001',
      tenantId,
      ownerParticipantId: 'PRTC-V24-004',
      code: 'WH-MBALE-01',
      name: 'Mbale Regional Aggregation & Cold Depot',
      countryCode: 'UG',
      districtOrCity: 'Mbale',
      facilityType: 'AGGREGATION_DEPOT',
      maxCapacityUnits: 10000,
      usedCapacityUnits: 450,
      temperatureControlled: true,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    db.v24Warehouses.set(wh1.id, wh1);
  }
  if (!db.v24Warehouses.has('WH-V24-002')) {
    const wh2: V24WarehouseFacility = {
      id: 'WH-V24-002',
      tenantId,
      ownerParticipantId: 'PRTC-V24-003',
      code: 'WH-KLA-IND-02',
      name: 'Kampala Industrial Park Distribution & Assembly Hub',
      countryCode: 'UG',
      districtOrCity: 'Kampala',
      facilityType: 'FACTORY_STORE',
      maxCapacityUnits: 25000,
      usedCapacityUnits: 160,
      temperatureControlled: false,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    db.v24Warehouses.set(wh2.id, wh2);
  }

  // 5. Inventory Items & Balanced Seed Movements
  const invSeeds: Array<{
    id: string;
    whId: string;
    ownerId: string;
    sku: string;
    name: string;
    sectorId: string;
    uom: string;
    qty: number;
    valMinor: number;
    batch: string;
  }> = [
    { id: 'INV-V24-001', whId: 'WH-V24-001', ownerId: 'PRTC-V24-001', sku: 'SKU-COFF-AA-50', name: 'Washed Elgon Arabica Coffee (50kg Bag)', sectorId: 'SEC-AGRI', uom: 'BAG', qty: 300, valMinor: 25000000, batch: 'BCH-2026-001' },
    { id: 'INV-V24-002', whId: 'WH-V24-001', ownerId: 'PRTC-V24-004', sku: 'SKU-FLOUR-MZ-25', name: 'Fortified Maize Flour (25kg Bale)', sectorId: 'SEC-FOOD', uom: 'BALE', qty: 150, valMinor: 6500000, batch: 'BCH-2026-002' },
    { id: 'INV-V24-003', whId: 'WH-V24-002', ownerId: 'PRTC-V24-003', sku: 'SKU-SOL-INV-5K', name: 'Hybrid Solar Inverter 5kVA Industrial Unit', sectorId: 'SEC-ENERGY', uom: 'UNIT', qty: 60, valMinor: 185000000, batch: 'BCH-2026-003' },
    { id: 'INV-V24-004', whId: 'WH-V24-002', ownerId: 'PRTC-V24-003', sku: 'SKU-RAW-ALU-FRAME', name: 'Anodized Solar Mounting Rail 4.2m', sectorId: 'SEC-MANUF', uom: 'BAR', qty: 100, valMinor: 12000000, batch: 'BCH-2026-004' },
  ];

  invSeeds.forEach((s, idx) => {
    if (!db.v24Inventory.has(s.id)) {
      const item: V24InventoryItem = {
        id: s.id,
        tenantId,
        warehouseId: s.whId,
        ownerParticipantId: s.ownerId,
        sku: s.sku,
        name: s.name,
        sectorId: s.sectorId,
        unitOfMeasure: s.uom,
        physicalQty: s.qty,
        reservedQty: 0,
        availableToPromiseQty: s.qty,
        reorderThresholdQty: 10,
        unitValuationMinor: s.valMinor,
        currency: 'UGX',
        batchNumber: s.batch,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.v24Inventory.set(item.id, item);

      const movId = `MOV-V24-00${idx + 1}`;
      if (!db.v24StockMovements.has(movId)) {
        const mov: V24StockMovement = {
          id: movId,
          tenantId,
          inventoryItemId: item.id,
          warehouseId: item.warehouseId,
          sku: item.sku,
          movementType: 'RECEIVE',
          quantityDeltaPhysical: s.qty,
          quantityDeltaReserved: 0,
          referenceType: 'INITIAL_SEED',
          referenceId: s.batch,
          reason: 'Initial Schema 22 warehouse baseline balance',
          actorUserId: 'system',
          createdAt: now,
        };
        db.v24StockMovements.set(mov.id, mov);
      }
    }
  });

  // 6. Multi-Sector Commerce Listings
  const listingSeeds: V24CommerceListing[] = [
    {
      id: 'LST-V24-001',
      tenantId,
      participantId: 'PRTC-V24-003',
      participantName: 'East Africa Solar, Hardware & Manufacturing Co.',
      listingType: 'SELL',
      title: 'Hybrid Solar Inverter 5kVA Industrial System',
      description: 'CE-certified pure sine wave industrial hybrid solar inverter with lithium BMS port.',
      sectorId: 'SEC-ENERGY',
      unitOfMeasure: 'UNIT',
      totalQuantityOrCapacity: 60,
      minOrderQty: 1,
      priceMinor: 220000000,
      currency: 'UGX',
      countryCode: 'UG',
      location: 'Kampala Industrial Area',
      deliveryAvailable: true,
      inspectionAvailable: true,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      tags: ['solar', 'inverter', 'energy'],
      isTestRecord: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'LST-V24-002',
      tenantId,
      participantId: 'PRTC-V24-003',
      participantName: 'East Africa Solar, Hardware & Manufacturing Co.',
      listingType: 'MANUFACTURING_CAPACITY',
      title: 'Custom Sheet Metal & Cold-Room Panel Fabrication',
      description: 'Insulated polyurethane panel line and CNC steel fabrication capacity in Kampala.',
      sectorId: 'SEC-MANUF',
      unitOfMeasure: 'SQM',
      totalQuantityOrCapacity: 1200,
      minOrderQty: 20,
      priceMinor: 14500000,
      currency: 'UGX',
      countryCode: 'UG',
      location: 'Kampala',
      deliveryAvailable: true,
      inspectionAvailable: true,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      tags: ['manufacturing', 'fabrication', 'cold-room'],
      isTestRecord: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'LST-V24-003',
      tenantId,
      participantId: 'PRTC-V24-005',
      participantName: 'Northern Corridor Freight & Logistics Ltd',
      listingType: 'TRANSPORT_FREIGHT',
      title: 'Kampala — Malaba — Nairobi 28T Corridor Haulage',
      description: 'Scheduled flatbed & container haulage along the Northern Corridor.',
      sectorId: 'SEC-LOGIST',
      unitOfMeasure: 'TRIP',
      totalQuantityOrCapacity: 12,
      minOrderQty: 1,
      priceMinor: 420000000,
      currency: 'UGX',
      countryCode: 'UG',
      location: 'Kampala / Nairobi',
      deliveryAvailable: true,
      inspectionAvailable: false,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      tags: ['logistics', 'freight', 'malaba'],
      isTestRecord: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'LST-V24-004',
      tenantId,
      participantId: 'PRTC-V24-001',
      participantName: 'Elgon Highland Producers & Agro-Processing',
      listingType: 'SELL',
      title: 'Graded Washed Elgon Arabica Coffee (50kg Export Lot)',
      description: 'Moisture-tested parchment/green Arabica coffee prepared for commercial roasters.',
      sectorId: 'SEC-AGRI',
      unitOfMeasure: 'BAG',
      totalQuantityOrCapacity: 300,
      minOrderQty: 5,
      priceMinor: 28000000,
      currency: 'UGX',
      countryCode: 'UG',
      location: 'Mbale',
      deliveryAvailable: true,
      inspectionAvailable: true,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      tags: ['coffee', 'arabica', 'elgon'],
      isTestRecord: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'LST-V24-005',
      tenantId,
      participantId: 'PRTC-V24-003',
      participantName: 'East Africa Solar, Hardware & Manufacturing Co.',
      listingType: 'OFFER_SERVICE',
      title: 'Commercial Cold-Room & Generator Preventative Maintenance',
      description: 'Quarterly servicing, refrigerant pressure check, and electrical load calibration.',
      sectorId: 'SEC-MAINTN',
      unitOfMeasure: 'VISIT',
      totalQuantityOrCapacity: 30,
      minOrderQty: 1,
      priceMinor: 45000000,
      currency: 'UGX',
      countryCode: 'UG',
      location: 'Kampala / Jinja / Mbale',
      deliveryAvailable: true,
      inspectionAvailable: true,
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      tags: ['maintenance', 'calibration', 'service'],
      isTestRecord: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const l of listingSeeds) {
    if (!db.v24Listings.has(l.id)) db.v24Listings.set(l.id, l);
  }

  // 7. Seeded RFQ, Quotation, Negotiation, Agreement, Order, Obligation, Document, PO, BOM, Production, Shipment, Project, Thread
  if (!db.v24Rfqs.has('RFQ-V24-001')) {
    const rfq: V24RequestForQuotation = {
      id: 'RFQ-V24-001',
      tenantId,
      buyerParticipantId: 'PRTC-V24-002',
      buyerName: 'Kampala Wholesale & Industrial Buyers Group',
      title: 'Cold-Room Solar Inverter Upgrade Package',
      sectorId: 'SEC-ENERGY',
      productOrService: '5kVA Hybrid Inverter + Mounting Kits',
      specifications: 'UNBS standard compliant, 24-month warranty',
      quantity: 4,
      unitOfMeasure: 'SET',
      budgetMaxMinor: 1000000000,
      currency: 'UGX',
      visibility: 'PUBLIC',
      invitedParticipantIds: [],
      deliveryLocation: 'Kampala Depot',
      deadlineAt: '2027-12-31T23:59:59.000Z',
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    db.v24Rfqs.set(rfq.id, rfq);
  }

  if (!db.v24Quotations.has('QUO-V24-001')) {
    const quo: V24Quotation = {
      id: 'QUO-V24-001',
      tenantId,
      rfqId: 'RFQ-V24-001',
      supplierParticipantId: 'PRTC-V24-003',
      supplierName: 'East Africa Solar, Hardware & Manufacturing Co.',
      revisionNumber: 1,
      unitPriceMinor: 215000000,
      quantity: 4,
      taxMinor: 0,
      deliveryChargeMinor: 10000000,
      discountMinor: 0,
      totalAmountMinor: 870000000,
      totalPriceMinor: 870000000,
      currency: 'UGX',
      leadTimeDays: 5,
      deliveryEstimateDays: 5,
      validityDays: 14,
      termsNote: 'Includes Kampala delivery and commissioning checklist.',
      status: 'SUBMITTED',
      createdAt: now,
      updatedAt: now,
    };
    db.v24Quotations.set(quo.id, quo);
  }

  if (!db.v24Negotiations.has('NEG-V24-001')) {
    const neg: V24NegotiationThread = {
      id: 'NEG-V24-001',
      tenantId,
      rfqId: 'RFQ-V24-001',
      quotationId: 'QUO-V24-001',
      participantIds: ['PRTC-V24-002', 'PRTC-V24-003'],
      messages: [
        {
          id: 'NMSG-001',
          senderParticipantId: 'PRTC-V24-002',
          senderUserId: 'usr_buyer_01',
          kind: 'CLARIFICATION',
          body: 'Confirm surge protection ratings and Kampala depot delivery window.',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.v24Negotiations.set(neg.id, neg);
  }

  if (!db.v24Agreements.has('AGR-V24-001')) {
    const agr: V24CommercialAgreement = {
      id: 'AGR-V24-001',
      tenantId,
      agreementNumber: 'ECONEX-AGR-2026-0001',
      agreementType: 'GOODS_SUPPLY',
      title: 'Standing Coffee & Food Staples Supply Framework',
      buyerParticipantId: 'PRTC-V24-002',
      sellerParticipantId: 'PRTC-V24-001',
      itemsSummary: [{ name: 'Washed Elgon Arabica Coffee (50kg Bag)', quantity: 10, unitOfMeasure: 'BAG', unitPriceMinor: 28000000 }],
      totalValueMinor: 280000000,
      currency: 'UGX',
      governingJurisdiction: 'Republic of Uganda',
      termsText: 'Standard B2B commercial supply terms. Sandbox obligation settlement via ECONEX V23 internal ledger.',
      status: 'PENDING_SIGNATURE',
      regulatedEscrowIncluded: false,
      immutableDocumentHash: sha256('AGR-V24-001|ECONEX-AGR-2026-0001|280000000'),
      history: [{ fromStatus: null, toStatus: 'PENDING_SIGNATURE', actorUserId: 'usr_buyer_01', note: 'Seeded agreement ready for signatures', timestamp: now }],
      createdAt: now,
      updatedAt: now,
    };
    db.v24Agreements.set(agr.id, agr);
  }

  if (!db.v24Orders.has('ORD-V24-001')) {
    const ord: V24CommercialOrder = {
      id: 'ORD-V24-001',
      tenantId,
      orderNumber: 'ECX-ORD-2026-0001',
      orderType: 'B2B',
      buyerParticipantId: 'PRTC-V24-002',
      sellerParticipantId: 'PRTC-V24-001',
      linkedListingId: 'LST-V24-004',
      items: [
        {
          id: 'ORDLN-001',
          title: 'Washed Elgon Arabica Coffee (50kg Bag)',
          inventoryItemId: 'INV-V24-001',
          quantityOrdered: 1,
          quantityFulfilled: 1,
          unitOfMeasure: 'BAG',
          unitPriceMinor: 35000000,
          lineTotalMinor: 35000000,
        },
      ],
      subtotalMinor: 35000000,
      taxMinor: 0,
      deliveryChargeMinor: 0,
      totalMinor: 35000000,
      currency: 'UGX',
      allowPartialFulfilment: true,
      deliveryLocation: 'Kampala Industrial Area Plot 14',
      deliveryEvidenceRef: 'POD-SEED-001',
      status: 'ORDER_DELIVERED',
      paymentObligationId: 'OBL-V24-001',
      history: [
        { fromStatus: null, toStatus: 'ORDER_SUBMITTED', actorUserId: 'usr_buyer_01', reason: 'Seeded order', timestamp: now },
        { fromStatus: 'ORDER_SUBMITTED', toStatus: 'ORDER_DELIVERED', actorUserId: 'usr_farmer_01', reason: 'Delivered to Kampala depot', timestamp: now },
      ],
      isTestRecord: true,
      createdAt: now,
      updatedAt: now,
    };
    db.v24Orders.set(ord.id, ord);
  }

  if (!db.v24Obligations.has('OBL-V24-001')) {
    const buyerW = db.v23Wallets.get('WLT-V23-002');
    const sellerW = db.v23Wallets.get('WLT-V23-001');
    const obl: V24PaymentObligation = {
      id: 'OBL-V24-001',
      obligationRef: 'OBL-ECX-2026-0001',
      tenantId,
      sourceEntityType: 'COMMERCIAL_ORDER',
      sourceEntityId: 'ORD-V24-001',
      payerParticipantId: 'PRTC-V24-002',
      payeeParticipantId: 'PRTC-V24-001',
      payerEuwn: buyerW?.euwn || 'EX-UG-BUYER-0002',
      payeeEuwn: sellerW?.euwn || 'EX-UG-FARMR-0001',
      amountMinor: 35000000,
      paidMinor: 0,
      refundedMinor: 0,
      currency: 'UGX',
      status: 'UNPAID',
      sandboxOnly: true,
      v23TransactionIds: [],
      v23RefundIds: [],
      createdAt: now,
      updatedAt: now,
    };
    db.v24Obligations.set(obl.id, obl);
  }

  if (!db.v24Documents.has('DOC-V24-001')) {
    const docInv: V24CommercialDocument = {
      id: 'DOC-V24-001',
      tenantId,
      documentNumber: 'ECX-INV-2026-0001',
      documentType: 'INVOICE',
      issuingParticipantId: 'PRTC-V24-003',
      receivingParticipantId: 'PRTC-V24-002',
      linkedEntityType: 'PURCHASE_ORDER',
      linkedEntityId: 'PO-V24-001',
      lineItems: [{ description: 'Industrial Solar & Hardware Supply Kit', quantity: 1, unitPriceMinor: 35000000, lineTotalMinor: 35000000 }],
      subtotalMinor: 35000000,
      taxMinor: 0,
      totalAmountMinor: 35000000,
      currency: 'UGX',
      status: 'ISSUED',
      taxFilingNotice: 'ECONEX_COMMERCIAL_RECORD_NOT_OFFICIAL_GOVERNMENT_TAX_FILING',
      documentHashSha256: sha256('DOC-V24-001|35000000'),
      issuedAt: now,
      updatedAt: now,
    };
    db.v24Documents.set(docInv.id, docInv);
  }

  if (!db.v24Documents.has('GRN-V24-001')) {
    const docGrn: V24CommercialDocument = {
      id: 'GRN-V24-001',
      tenantId,
      documentNumber: 'ECX-GRN-2026-0001',
      documentType: 'GOODS_RECEIVED_NOTE',
      issuingParticipantId: 'PRTC-V24-002',
      receivingParticipantId: 'PRTC-V24-003',
      linkedEntityType: 'PURCHASE_ORDER',
      linkedEntityId: 'PO-V24-001',
      lineItems: [{ description: 'Industrial Solar & Hardware Supply Kit', quantity: 1, unitPriceMinor: 35000000, lineTotalMinor: 35000000 }],
      subtotalMinor: 35000000,
      taxMinor: 0,
      totalAmountMinor: 35000000,
      currency: 'UGX',
      status: 'ACKNOWLEDGED',
      taxFilingNotice: 'ECONEX_COMMERCIAL_RECORD_NOT_OFFICIAL_GOVERNMENT_TAX_FILING',
      documentHashSha256: sha256('GRN-V24-001|35000000'),
      issuedAt: now,
      updatedAt: now,
    };
    db.v24Documents.set(docGrn.id, docGrn);
  }

  if (!db.v24ProcurementRequests.has('PRC-V24-001')) {
    const prc: V24ProcurementRequest = {
      id: 'PRC-V24-001',
      tenantId,
      requestNumber: 'ECX-PRC-2026-0001',
      buyerParticipantId: 'PRTC-V24-002',
      requesterUserId: 'usr_buyer_01',
      category: 'ENTERPRISE_INTERNAL',
      title: 'Kampala Hub Solar Hardware Replenishment',
      specifications: 'Solar inverters and hardware kits for Kampala depot',
      budgetReference: 'BUD-2026-KLA-01',
      estimatedBudgetMinor: 35000000,
      currency: 'UGX',
      conflictOfInterestDeclared: true,
      conflictDeclarationNote: 'No personal interest declared',
      requiresDualApproval: true,
      isPublicPreparationNotice: false,
      officialGovernmentPlatformClaimed: false,
      status: 'PO_ISSUED',
      approverUserId: 'usr_admin_01',
      approvalNote: 'Independent dual-control approval recorded',
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    db.v24ProcurementRequests.set(prc.id, prc);
  }

  if (!db.v24PurchaseOrders.has('PO-V24-001')) {
    const po: V24PurchaseOrder = {
      id: 'PO-V24-001',
      tenantId,
      poNumber: 'ECX-PO-2026-0001',
      procurementRequestId: 'PRC-V24-001',
      buyerParticipantId: 'PRTC-V24-002',
      supplierParticipantId: 'PRTC-V24-003',
      items: [{ title: 'Industrial Solar & Hardware Supply Kit', quantity: 1, unitOfMeasure: 'KIT', unitPriceMinor: 35000000, lineTotalMinor: 35000000 }],
      totalAmountMinor: 35000000,
      currency: 'UGX',
      status: 'ISSUED',
      threeWayMatchStatus: 'PENDING',
      matchVarianceMinor: 0,
      createdByUserId: 'usr_buyer_01',
      createdAt: now,
      updatedAt: now,
    };
    db.v24PurchaseOrders.set(po.id, po);
  }

  if (!db.v24Boms.has('BOM-V24-001')) {
    const bom: V24BillOfMaterials = {
      id: 'BOM-V24-001',
      tenantId,
      manufacturerParticipantId: 'PRTC-V24-003',
      productName: 'Pre-Wired Solar Rack Assembly',
      finishedSku: 'FG-SOLAR-RACK-01',
      workCentre: 'Kampala Line A',
      components: [
        {
          sku: 'SKU-RAW-ALU-FRAME',
          inventoryItemId: 'INV-V24-004',
          name: 'Anodized Solar Mounting Rail 4.2m',
          quantityPerUnit: 2,
          unitOfMeasure: 'BAR',
          estimatedUnitCostMinor: 12000000,
        },
      ],
      estimatedUnitCostMinor: 24000000,
      currency: 'UGX',
      costStatementNotice: 'ESTIMATED_OPERATIONAL_COST_NOT_AUDITED_FINANCIAL_STATEMENT',
      createdAt: now,
    };
    db.v24Boms.set(bom.id, bom);
  }

  if (!db.v24ProductionOrders.has('PROD-V24-001')) {
    const prod: V24ProductionOrder = {
      id: 'PROD-V24-001',
      tenantId,
      productionNumber: 'ECX-PROD-2026-0001',
      bomId: 'BOM-V24-001',
      manufacturerParticipantId: 'PRTC-V24-003',
      productName: 'Pre-Wired Solar Rack Assembly',
      finishedSku: 'FG-SOLAR-RACK-01',
      workCentre: 'Kampala Line A',
      targetQuantity: 5,
      producedGoodQty: 0,
      rejectedOrWastageQty: 0,
      finishedBatchNumber: 'MFG-2026-001',
      qualityInspectionStatus: 'PENDING',
      estimatedCostMinor: 120000000,
      actualOperationalCostMinor: 0,
      costVarianceMinor: 0,
      currency: 'UGX',
      costStatementNotice: 'ESTIMATED_OPERATIONAL_COST_NOT_AUDITED_FINANCIAL_STATEMENT',
      status: 'PLANNED',
      createdAt: now,
      updatedAt: now,
    };
    db.v24ProductionOrders.set(prod.id, prod);
  }

  if (!db.v24Shipments.has('SHP-V24-001')) {
    const shp: V24LogisticsShipment = {
      id: 'SHP-V24-001',
      tenantId,
      shipmentRef: 'ECX-SHP-2026-0001',
      linkedOrderId: 'ORD-V24-001',
      providerParticipantId: 'PRTC-V24-005',
      providerCategory: 'CROSS_BORDER_TRANSPORTER',
      corridorCode: 'CORR-UG-KE-MALABA',
      originCountry: 'UG',
      destinationCountry: 'UG',
      originLocation: 'Mbale Regional Depot',
      destinationLocation: 'Kampala Industrial Area',
      freightFeeMinor: 4500000,
      currency: 'UGX',
      status: 'IN_TRANSIT',
      proofOfCollectionRef: 'POC-SEED-001',
      exceptionNotes: [],
      events: [
        {
          id: 'SHPEV-001',
          status: 'IN_TRANSIT',
          reportedLocation: 'Jinja Weighbridge',
          locationSource: 'CARRIER_SELF_REPORT',
          gpsClaimed: false,
          notes: 'Carrier checkpoint self-report (no live GPS)',
          actorUserId: 'usr_transporter_01',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.v24Shipments.set(shp.id, shp);
  }

  if (!db.v24Projects.has('PRJ-V24-001')) {
    const prj: V24CommercialProject = {
      id: 'PRJ-V24-001',
      tenantId,
      projectCode: 'ECX-PRJ-2026-0001',
      title: 'Mbale Depot Solar Microgrid & Cold-Room Fit-Out',
      projectType: 'SOLAR_DEPLOYMENT',
      clientParticipantId: 'PRTC-V24-002',
      contractorParticipantId: 'PRTC-V24-003',
      scope: 'Design, inverter mounting, and load commissioning for cold storage depot.',
      totalBudgetMinor: 800000000,
      currency: 'UGX',
      autoEscrowRelease: false,
      milestones: [
        {
          id: 'PMS-01',
          title: 'Site Electrical & Mounting Prep',
          deliverableSummary: 'Mounting steel & conduit complete',
          budgetMinor: 300000000,
          status: 'PLANNED',
          updatedAt: now,
        },
        {
          id: 'PMS-02',
          title: 'Inverter Commissioning & Handover',
          deliverableSummary: 'Commissioning test sheet signed',
          budgetMinor: 500000000,
          status: 'PLANNED',
          updatedAt: now,
        },
      ],
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    db.v24Projects.set(prj.id, prj);
  }

  if (!db.v24Threads.has('THR-V24-001')) {
    const thr: V24CommercialThread = {
      id: 'THR-V24-001',
      tenantId,
      linkedEntityType: 'COMMERCIAL_ORDER',
      linkedEntityId: 'ORD-V24-001',
      title: 'Kampala Wholesale <-> East Africa Solar Commercial Dispatch Thread',
      participantIds: ['PRTC-V24-002', 'PRTC-V24-003'],
      blockedParticipantIds: [],
      messages: [
        {
          id: 'TMSG-001',
          senderParticipantId: 'PRTC-V24-002',
          senderUserId: 'usr_buyer_01',
          body: 'Please share gate clearance note ahead of depot arrival.',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.v24Threads.set(thr.id, thr);
  }

  // 8. Sandbox Webhook Adapters & API Credentials
  if (!db.v24Webhooks.has('WHK-V24-001')) {
    const whk1: V24WebhookSubscription = {
      id: 'WHK-V24-001',
      tenantId,
      organizationParticipantId: 'PRTC-V24-002',
      adapterCategory: 'ERP_ORDER_SYNC_SANDBOX',
      endpointUrl: 'https://sandbox.erp-adapter.internal/webhooks/econex',
      targetUrl: 'https://sandbox.erp-adapter.internal/webhooks/econex',
      eventTypes: ['v24.order.confirmed', 'v24.obligation.paid', 'v24.shipment.delivered'],
      adapterState: 'SANDBOX_ACTIVE',
      signingSecretHint: 'whsec_sandbox_***001',
      createdAt: now,
      updatedAt: now,
    };
    db.v24Webhooks.set(whk1.id, whk1);
  }
  if (!db.v24Webhooks.has('WHK-V24-002')) {
    const whk2: V24WebhookSubscription = {
      id: 'WHK-V24-002',
      tenantId,
      organizationParticipantId: 'PRTC-V24-003',
      adapterCategory: 'EXTERNAL_CARRIER_EDI',
      endpointUrl: 'https://unconfigured.carrier-edi.internal/hooks',
      targetUrl: 'https://unconfigured.carrier-edi.internal/hooks',
      eventTypes: ['v24.shipment.dispatched'],
      adapterState: 'NOT_CONFIGURED',
      signingSecretHint: 'whsec_unconfigured_***002',
      createdAt: now,
      updatedAt: now,
    };
    db.v24Webhooks.set(whk2.id, whk2);
  }

  if (!db.v24ApiCredentials.has('CRED-V24-SEED')) {
    const cred: V24ApiClientCredential = {
      id: 'CRED-V24-SEED',
      tenantId,
      organizationParticipantId: 'PRTC-V24-002',
      label: 'Kampala Wholesale ERP Read Sandbox',
      keyPrefix: 'ecx_sbx_001',
      keyHashSha256: sha256('ecx_sbx_001_seed_token_never_live'),
      scopes: ['orders:read', 'inventory:read', 'documents:read'],
      environment: 'SANDBOX',
      status: 'ACTIVE',
      createdByUserId: 'usr_buyer_01',
      createdAt: now,
    };
    db.v24ApiCredentials.set(cred.id, cred);
  }

  // 9. Genesis Audit Event
  if (!db.v24AuditEvents.has('AUD-V24-GENESIS')) {
    const genesisHash = sha256(`GENESIS|${tenantId}|${now}`);
    const ev: V24AuditEvent = {
      id: 'AUD-V24-GENESIS',
      tenantId,
      actorUserId: 'system',
      actorRole: 'PLATFORM_ADMIN',
      action: 'V24_SCHEMA_22_INITIALIZED',
      targetType: 'SYSTEM',
      targetId: 'SCHEMA_22',
      summary: 'Initialized ECONEX V24.0 Universal Commerce & Supply Chain Execution Network (Schema 22).',
      prevHash: '0'.repeat(64),
      entryHash: genesisHash,
      createdAt: now,
    };
    db.v24AuditEvents.set(ev.id, ev);
  }
}
