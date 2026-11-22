/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V20.0 - Unified Economic Operations Domain Engine
 * Consolidates Identity, Agriculture-to-Market, Commercial Trade Execution,
 * Logistics Fulfilment, Cooperative Pooling, Reconciliation, Trust/Disputes,
 * Offline Conflict Detection, Regional Interoperability & Pilots.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import { V20_MARKETPLACE_CATEGORIES } from './v20Seed.ts';
import type {
  V17CommercialListing,
  V17UnitCode,
  V20CooperativePool,
  V20DeliveryEvidence,
  V20LogisticsShipment,
  V20OfflineConflict,
  V20OrgStaffRole,
  V20PaymentObligation,
  V20PilotProgramme,
  V20SavedSearch,
  V20ShipmentStatus,
  V20TradeRecord,
  V20TradeStage,
  V20VerificationState,
} from '../types/index.ts';

function cleanText(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

function sha256Hex(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

// ==========================================
// 1. CURRENCY & MEASUREMENT UNIT CONVERSION
// ==========================================

const FX_TO_UGX_RATES: Record<string, { rate: number; source: string }> = {
  UGX: { rate: 1, source: 'BOU_REFERENCE_BASE' },
  KES: { rate: 28.5, source: 'EAC_INDICATIVE_REFERENCE' },
  TZS: { rate: 1.42, source: 'EAC_INDICATIVE_REFERENCE' },
  RWF: { rate: 2.75, source: 'EAC_INDICATIVE_REFERENCE' },
  USD: { rate: 3700, source: 'BOU_INDICATIVE_REFERENCE' },
  EUR: { rate: 4000, source: 'INDICATIVE_REFERENCE' },
};

const UNIT_TO_KG_FACTOR: Record<string, number | null> = {
  KG: 1,
  GRAM: 0.001,
  BAG_50KG: 50,
  BAG_100KG: 100,
  TONNE: 1000,
  LITRE: null,
  CRATE: null,
  BUNCH: null,
  PIECE: null,
  SERVICE_UNIT: null,
};

export function convertCurrencyAmount(amount: number, fromCurrency: string, toCurrency: string) {
  const amt = Number(amount);
  const from = cleanText(fromCurrency || 'UGX').toUpperCase();
  const to = cleanText(toCurrency || 'UGX').toUpperCase();
  const fromRate = FX_TO_UGX_RATES[from];
  const toRate = FX_TO_UGX_RATES[to];
  if (!Number.isFinite(amt) || amt < 0 || !fromRate || !toRate) {
    return {
      ok: false as const,
      error: `Unsupported currency conversion (${from} -> ${to}) or invalid amount.`,
    };
  }
  const ugxEquivalent = Number((amt * fromRate.rate).toFixed(2));
  const convertedAmount = Number((ugxEquivalent / toRate.rate).toFixed(2));
  return {
    ok: true as const,
    fromCurrency: from,
    toCurrency: to,
    originalAmount: amt,
    convertedAmount,
    ugxEquivalent,
    effectiveRate: Number((fromRate.rate / toRate.rate).toFixed(6)),
    rateSource: `${fromRate.source} -> ${toRate.source} (Indicative Reference, NOT live FX desk)`,
  };
}

export function convertMeasurementUnit(qty: number, fromUnit: string, toUnit: string) {
  const q = Number(qty);
  const f = cleanText(fromUnit || 'KG').toUpperCase();
  const t = cleanText(toUnit || 'KG').toUpperCase();
  const fFactor = UNIT_TO_KG_FACTOR[f];
  const tFactor = UNIT_TO_KG_FACTOR[t];
  if (!Number.isFinite(q) || q <= 0 || !fFactor || !tFactor) {
    return {
      ok: false as const,
      error: `Cannot convert between non-mass or unsupported units (${f} -> ${t}).`,
    };
  }
  const kg = Number((q * fFactor).toFixed(4));
  const convertedQty = Number((kg / tFactor).toFixed(4));
  return { ok: true as const, fromUnit: f, toUnit: t, originalQty: q, kgEquivalent: kg, convertedQty };
}

// ==========================================
// 2. CONSOLIDATED VERIFICATION & ORG RBAC
// ==========================================

export function mapV17ToV20VerificationState(level: string): V20VerificationState {
  if (level === 'INSTITUTIONALLY_ATTESTED' || level === 'ORGANIZATION_VERIFIED') return 'VERIFIED';
  if (level === 'DOCUMENTS_REVIEWED') return 'UNDER_REVIEW';
  if (level === 'CONTACT_VERIFIED') return 'INFORMATION_SUBMITTED';
  return 'UNVERIFIED';
}

export function assignOrgStaffRole(params: {
  organizationId: string;
  participantId: string;
  staffRole: V20OrgStaffRole;
  actorId: string;
}) {
  const org = db.v17Organizations.get(params.organizationId);
  const participant = db.v17Participants.get(params.participantId);
  if (!org) return { ok: false, statusCode: 404, error: `Organization ${params.organizationId} not found.` };
  if (!participant) return { ok: false, statusCode: 404, error: `Participant ${params.participantId} not found.` };

  const validRoles: V20OrgStaffRole[] = ['OWNER', 'MANAGER', 'FINANCE', 'OPERATIONS', 'VIEWER'];
  if (!validRoles.includes(params.staffRole)) {
    return { ok: false, statusCode: 400, error: `Invalid staffRole ${params.staffRole}.` };
  }

  const existing = Array.from(db.v17OrganizationMembers.values()).find(
    (m) => m.organizationId === params.organizationId && m.participantId === params.participantId
  );
  const id = existing?.id || uid('V20-ORGM');
  const mappedRole =
    params.staffRole === 'OWNER'
      ? 'OWNER'
      : params.staffRole === 'MANAGER'
        ? 'MANAGER'
        : params.staffRole === 'FINANCE' || params.staffRole === 'OPERATIONS'
          ? 'OPERATOR'
          : 'VIEWER';

  const rec = {
    id,
    organizationId: params.organizationId,
    participantId: params.participantId,
    role: mappedRole as any,
    v20StaffRole: params.staffRole,
    status: 'ACTIVE' as const,
    addedAt: existing?.addedAt || new Date().toISOString(),
  };
  db.v17OrganizationMembers.set(id, rec);
  db.scheduleSave();
  return { ok: true, statusCode: 200, membership: rec };
}

// ==========================================
// 3. FARM HARVEST -> MARKETPLACE LINKAGE & RECOMMENDATIONS
// ==========================================

export function publishHarvestToMarketplace(params: {
  tenantId: string;
  userId: string;
  sellerParticipantId: string;
  cropRecordId?: string;
  farmId?: string;
  title: string;
  category?: string;
  district?: string;
  countryCode?: string;
  availableQty: number;
  unitCode?: V17UnitCode;
  unitPrice: number;
  currency?: string;
  qualityGrade?: string;
}) {
  const title = cleanText(params.title);
  const qty = Number(params.availableQty);
  const price = Number(params.unitPrice);
  if (!title || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
    return { ok: false, statusCode: 400, error: 'Valid harvest title, positive quantity, and positive unitPrice are required.' };
  }

  if (params.cropRecordId) {
    const crop = db.crops.get(params.cropRecordId);
    if (!crop) {
      return { ok: false, statusCode: 404, error: `Crop record ${params.cropRecordId} not found.` };
    }
  }

  const now = new Date().toISOString();
  const cat = cleanText(params.category || 'Grains & Cereals');
  const listing: V17CommercialListing = {
    id: uid('V20-LIST'),
    tenantId: cleanText(params.tenantId),
    sellerParticipantId: cleanText(params.sellerParticipantId),
    title,
    sector: cat.toUpperCase().includes('COFFEE') || cat.toUpperCase().includes('GRAIN') ? 'AGRICULTURE' : 'COMMERCE',
    category: cat,
    countryCode: cleanText(params.countryCode || 'UG').toUpperCase(),
    district: cleanText(params.district || 'Mbale'),
    unitPrice: price,
    currency: cleanText(params.currency || 'UGX').toUpperCase(),
    unitCode: params.unitCode || 'KG',
    availableQty: qty,
    minOrderQty: Math.min(10, Math.max(1, Math.floor(qty * 0.1))),
    qualityGrade: cleanText(params.qualityGrade || 'Harvest Lot Grade 1'),
    deliveryTerms: `Origin: ${cleanText(params.district || 'Mbale')} Farm Gate / Collection Hub`,
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  db.v17CommercialListings.set(listing.id, listing);
  db.scheduleSave();
  return {
    ok: true,
    statusCode: 201,
    listing,
    linkedCropId: params.cropRecordId || null,
    linkedFarmId: params.farmId || null,
  };
}

export function getExplainableMarketplaceRecommendations(params: {
  district?: string;
  category?: string;
  queryText?: string;
}) {
  const listings = Array.from(db.v17CommercialListings.values()).filter((l) => l.status === 'ACTIVE');
  const targetDist = cleanText(params.district || '').toLowerCase();
  const targetCat = cleanText(params.category || '').toLowerCase();
  const q = cleanText(params.queryText || '').toLowerCase();

  return listings
    .map((l) => {
      const seller = db.v17Participants.get(l.sellerParticipantId);
      const rep = db.v17Reputations.get(l.sellerParticipantId);
      const reasons: string[] = [];
      let score = 50;
      if (targetDist && l.district.toLowerCase() === targetDist) {
        score += 20;
        reasons.push(`Same district (${l.district}) reduces corridor haulage distance`);
      }
      if (targetCat && (l.category.toLowerCase().includes(targetCat) || l.sector.toLowerCase().includes(targetCat))) {
        score += 15;
        reasons.push(`Matches selected category (${l.category})`);
      }
      if (q && `${l.title} ${l.category} ${l.qualityGrade}`.toLowerCase().includes(q)) {
        score += 10;
        reasons.push(`Keyword match for "${params.queryText}"`);
      }
      if (seller && seller.verificationLevel !== 'UNVERIFIED') {
        score += 10;
        reasons.push(`Seller verification state: ${mapV17ToV20VerificationState(seller.verificationLevel)}`);
      }
      if (rep && rep.completedTransactions > 0) {
        score += 5;
        reasons.push(`${rep.completedTransactions} verified completed trade(s) on record`);
      }
      if (reasons.length === 0) reasons.push('Active regional listing with clear unit pricing');

      return {
        listing: l,
        sellerDisplayName: seller?.displayName || l.sellerParticipantId,
        sellerVerificationState: seller ? mapV17ToV20VerificationState(seller.verificationLevel) : 'UNVERIFIED',
        matchScore: Math.min(99, score),
        explanationFactors: reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12);
}

// ==========================================
// 4. COMMERCIAL EXECUTION STATE MACHINE (12 CORE + 6 EXCEPTION STATES)
// ==========================================

const TRADE_ALLOWED_TRANSITIONS: Record<V20TradeStage, V20TradeStage[]> = {
  DISCOVERY: ['ENQUIRY', 'QUOTATION', 'CANCELLED'],
  ENQUIRY: ['QUOTATION', 'NEGOTIATION', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  QUOTATION: ['NEGOTIATION', 'OFFER_ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  NEGOTIATION: ['QUOTATION', 'OFFER_ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  OFFER_ACCEPTED: ['AGREEMENT_CREATED', 'CANCELLED', 'DISPUTED'],
  AGREEMENT_CREATED: ['FULFILMENT_PLANNED', 'FULFILMENT_IN_PROGRESS', 'CANCELLED', 'DISPUTED', 'SUSPENDED'],
  FULFILMENT_PLANNED: ['FULFILMENT_IN_PROGRESS', 'DELIVERY_EVIDENCE_SUBMITTED', 'CANCELLED', 'DISPUTED', 'SUSPENDED'],
  FULFILMENT_IN_PROGRESS: ['DELIVERY_EVIDENCE_SUBMITTED', 'DISPUTED', 'SUSPENDED', 'FAILED'],
  DELIVERY_EVIDENCE_SUBMITTED: ['BUYER_CONFIRMATION', 'DISPUTED'],
  BUYER_CONFIRMATION: ['RECONCILIATION', 'DISPUTED'],
  RECONCILIATION: ['COMPLETED', 'DISPUTED', 'FAILED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
  DISPUTED: ['RECONCILIATION', 'COMPLETED', 'CANCELLED', 'FAILED'],
  SUSPENDED: ['FULFILMENT_IN_PROGRESS', 'CANCELLED'],
  FAILED: [],
};

function buildAgreementSummary(trade: V20TradeRecord): { text: string; sha256: string } {
  const text = [
    `ECONEX COMMERCIAL RECORD SUMMARY`,
    `Trade Reference: ${trade.id}`,
    `Buyer Participant: ${trade.buyerParticipantId}`,
    `Seller Participant: ${trade.sellerParticipantId}`,
    `Item / Service: ${trade.title} [${trade.category}]`,
    `Quantity & Unit: ${trade.quantity} ${trade.unitCode}`,
    `Agreed Unit Price: ${trade.unitPrice.toLocaleString()} ${trade.currency}`,
    `Total Agreed Amount: ${trade.totalAmount.toLocaleString()} ${trade.currency} (~${trade.baseUgxEquivalent.toLocaleString()} UGX reference)`,
    `Quality Specification: ${trade.qualitySpec}`,
    `Delivery Terms: ${trade.deliveryTerms}`,
    `Generated At: ${new Date().toISOString()}`,
    `NOTICE: ${trade.agreementRecordDisclaimer}`,
  ].join('\n');
  return { text, sha256: sha256Hex(text) };
}

export function createV20Trade(params: {
  tenantId: string;
  actorId: string;
  actorRole: string;
  listingId?: string;
  farmPlotId?: string;
  cropRecordId?: string;
  cooperativeId?: string;
  cooperativePoolId?: string;
  buyerParticipantId: string;
  sellerParticipantId: string;
  organizationId?: string;
  title: string;
  category?: string;
  countryCode?: string;
  district?: string;
  quantity: number;
  unitCode?: string;
  unitPrice: number;
  currency?: string;
  deliveryTerms?: string;
  qualitySpec?: string;
  initialStage?: V20TradeStage;
  idempotencyKey?: string;
  isTestRecord?: boolean;
}) {
  const idemKey = cleanText(params.idempotencyKey || uid('IDEM-TRD'));
  const existingByIdem = Array.from(db.v20Trades.values()).find((t) => t.idempotencyKey === idemKey);
  if (existingByIdem) {
    return { ok: true, statusCode: 200, trade: existingByIdem, idempotentReplay: true };
  }

  const title = cleanText(params.title);
  const qty = Number(params.quantity);
  const price = Number(params.unitPrice);
  if (!title || !params.buyerParticipantId || !params.sellerParticipantId || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Valid title, buyerParticipantId, sellerParticipantId, positive quantity, and positive unitPrice are required.',
    };
  }
  if (params.buyerParticipantId === params.sellerParticipantId) {
    return { ok: false, statusCode: 400, error: 'Buyer and seller participants cannot be identical.' };
  }

  const currency = cleanText(params.currency || 'UGX').toUpperCase();
  const totalAmount = Number((qty * price).toFixed(2));
  const fx = convertCurrencyAmount(totalAmount, currency, 'UGX');
  if (!fx.ok) {
    return { ok: false, statusCode: 400, error: fx.error };
  }

  const startStage: V20TradeStage =
    params.initialStage && ['DISCOVERY', 'ENQUIRY', 'QUOTATION', 'NEGOTIATION', 'AGREEMENT_CREATED'].includes(params.initialStage)
      ? params.initialStage
      : 'ENQUIRY';

  const now = new Date().toISOString();
  const trade: V20TradeRecord = {
    id: uid('V20-TRD'),
    tenantId: cleanText(params.tenantId),
    listingId: params.listingId ? cleanText(params.listingId) : undefined,
    farmPlotId: params.farmPlotId ? cleanText(params.farmPlotId) : undefined,
    cropRecordId: params.cropRecordId ? cleanText(params.cropRecordId) : undefined,
    cooperativeId: params.cooperativeId ? cleanText(params.cooperativeId) : undefined,
    cooperativePoolId: params.cooperativePoolId ? cleanText(params.cooperativePoolId) : undefined,
    buyerParticipantId: cleanText(params.buyerParticipantId),
    sellerParticipantId: cleanText(params.sellerParticipantId),
    organizationId: params.organizationId ? cleanText(params.organizationId) : undefined,
    title,
    category: cleanText(params.category || V20_MARKETPLACE_CATEGORIES[0].id),
    sector: 'AGRICULTURE_COMMERCE',
    countryCode: cleanText(params.countryCode || 'UG').toUpperCase(),
    district: cleanText(params.district || 'Mbale'),
    quantity: qty,
    unitCode: cleanText(params.unitCode || 'KG').toUpperCase(),
    unitPrice: price,
    currency,
    totalAmount,
    baseUgxEquivalent: fx.ugxEquivalent,
    fxRateUsed: fx.effectiveRate,
    stage: startStage,
    idempotencyKey: idemKey,
    version: 1,
    isTestRecord: Boolean(params.isTestRecord),
    deliveryTerms: cleanText(params.deliveryTerms || 'Origin Hub -> Buyer Receiving Warehouse'),
    qualitySpec: cleanText(params.qualitySpec || 'Grade 1 Standard Moisture'),
    agreementRecordDisclaimer:
      'ECONEX commercial record summary only — NOT a statutory executed deed or licensed financial escrow guarantee.',
    crossBorderChecklistCleared: true,
    stageHistory: [
      {
        stage: startStage,
        actorId: params.actorId,
        actorRole: params.actorRole,
        note: `Trade initiated at ${startStage}.`,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  if (startStage === 'AGREEMENT_CREATED') {
    const agr = buildAgreementSummary(trade);
    trade.agreementSummaryText = agr.text;
    trade.agreementSummarySha256 = agr.sha256;
    ensurePaymentObligationForTrade(trade);
  }

  db.v20Trades.set(trade.id, trade);
  db.scheduleSave();
  return { ok: true, statusCode: 201, trade, idempotentReplay: false };
}

export function ensurePaymentObligationForTrade(trade: V20TradeRecord): V20PaymentObligation {
  if (trade.paymentObligationId && db.v20PaymentObligations.has(trade.paymentObligationId)) {
    return db.v20PaymentObligations.get(trade.paymentObligationId)!;
  }
  const now = new Date().toISOString();
  const ob: V20PaymentObligation = {
    id: uid('V20-POB'),
    tenantId: trade.tenantId,
    tradeId: trade.id,
    payerParticipantId: trade.buyerParticipantId,
    payeeParticipantId: trade.sellerParticipantId,
    currency: trade.currency,
    expectedAmount: trade.totalAmount,
    receivedAmount: 0,
    varianceAmount: -trade.totalAmount,
    outstandingAmount: trade.totalAmount,
    disputedAmount: 0,
    status: 'PENDING',
    paymentChannel: trade.isTestRecord ? 'TEST_LEDGER' : 'SANDBOX_MOMO',
    ledgerScope: trade.isTestRecord ? 'TEST_VERIFICATION' : 'SANDBOX_RECONCILIATION',
    sandboxDisclaimer:
      'Non-bank commercial coordination obligation only. Simulated/sandbox PSP recording — real PSP settlement awaits Gate 10 & Gate 24.',
    isTestRecord: trade.isTestRecord,
    receiptReferences: [],
    createdAt: now,
    updatedAt: now,
  };
  db.v20PaymentObligations.set(ob.id, ob);
  trade.paymentObligationId = ob.id;
  db.v20Trades.set(trade.id, trade);
  return ob;
}

export function transitionV20Trade(params: {
  tradeId: string;
  targetStage: V20TradeStage;
  actorId: string;
  actorRole: string;
  note?: string;
  revisedUnitPrice?: number;
  revisedQuantity?: number;
}) {
  const trade = db.v20Trades.get(params.tradeId);
  if (!trade) return { ok: false, statusCode: 404, error: `Trade ${params.tradeId} not found.` };

  const allowed = TRADE_ALLOWED_TRANSITIONS[trade.stage] || [];
  if (!allowed.includes(params.targetStage)) {
    return {
      ok: false,
      statusCode: 409,
      error: `INVALID_TRADE_TRANSITION: Cannot move trade from ${trade.stage} to ${params.targetStage}.`,
    };
  }

  // Require reconciliation or buyer confirmation before COMPLETED
  if (params.targetStage === 'COMPLETED' && trade.paymentObligationId) {
    const ob = db.v20PaymentObligations.get(trade.paymentObligationId);
    if (ob && ob.outstandingAmount > 0 && trade.stage !== 'DISPUTED') {
      return {
        ok: false,
        statusCode: 409,
        error: `RECONCILIATION_REQUIRED: Outstanding balance of ${ob.outstandingAmount} ${ob.currency} must be reconciled before COMPLETED.`,
      };
    }
  }

  const now = new Date().toISOString();
  if (
    ['QUOTATION', 'NEGOTIATION'].includes(params.targetStage) &&
    (params.revisedUnitPrice || params.revisedQuantity)
  ) {
    if (params.revisedUnitPrice && Number(params.revisedUnitPrice) > 0) {
      trade.unitPrice = Number(params.revisedUnitPrice);
    }
    if (params.revisedQuantity && Number(params.revisedQuantity) > 0) {
      trade.quantity = Number(params.revisedQuantity);
    }
    trade.totalAmount = Number((trade.quantity * trade.unitPrice).toFixed(2));
    const fx = convertCurrencyAmount(trade.totalAmount, trade.currency, 'UGX');
    if (fx.ok) trade.baseUgxEquivalent = fx.ugxEquivalent;
  }

  trade.stage = params.targetStage;
  trade.version += 1;
  trade.updatedAt = now;
  trade.stageHistory.push({
    stage: params.targetStage,
    actorId: params.actorId,
    actorRole: params.actorRole,
    note: cleanText(params.note || `Transitioned to ${params.targetStage}`),
    timestamp: now,
  });

  if (params.targetStage === 'AGREEMENT_CREATED') {
    const agr = buildAgreementSummary(trade);
    trade.agreementSummaryText = agr.text;
    trade.agreementSummarySha256 = agr.sha256;
    ensurePaymentObligationForTrade(trade);
  }

  if (params.targetStage === 'COMPLETED') {
    recomputeV20ParticipantReputation(trade.sellerParticipantId);
    recomputeV20ParticipantReputation(trade.buyerParticipantId);
  }

  db.v20Trades.set(trade.id, trade);
  logIntelligenceAudit({
    tenantId: trade.tenantId,
    jurisdiction: trade.countryCode,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'V20_TRADE_TRANSITION',
    entityType: 'V20_TRADE',
    entityId: trade.id,
    details: `Trade ${trade.id} transitioned to ${params.targetStage}.`,
  });
  db.scheduleSave();
  return { ok: true, statusCode: 200, trade };
}

// ==========================================
// 5. LOGISTICS SHIPMENT & DELIVERY EVIDENCE PROPAGATION
// ==========================================

const SHIPMENT_ALLOWED_TRANSITIONS: Record<V20ShipmentStatus, V20ShipmentStatus[]> = {
  REQUESTED: ['ACCEPTED', 'ASSIGNED', 'CANCELLED'],
  ACCEPTED: ['ASSIGNED', 'COLLECTION_CONFIRMED', 'CANCELLED'],
  ASSIGNED: ['COLLECTION_CONFIRMED', 'IN_TRANSIT', 'CANCELLED'],
  COLLECTION_CONFIRMED: ['IN_TRANSIT', 'DELAYED', 'DAMAGED', 'DISPUTED'],
  IN_TRANSIT: ['ARRIVED', 'DELAYED', 'DAMAGED', 'DISPUTED'],
  DELAYED: ['IN_TRANSIT', 'ARRIVED', 'DISPUTED', 'CANCELLED'],
  ARRIVED: ['DELIVERY_CONFIRMED', 'DAMAGED', 'DISPUTED'],
  DELIVERY_CONFIRMED: ['CLOSED', 'DISPUTED'],
  DAMAGED: ['DISPUTED', 'CLOSED'],
  DISPUTED: ['DELIVERY_CONFIRMED', 'CLOSED'],
  CANCELLED: [],
  CLOSED: [],
};

export function createV20Shipment(params: {
  tenantId: string;
  tradeId: string;
  transporterParticipantId?: string;
  originCountry?: string;
  originDistrict?: string;
  destinationCountry?: string;
  destinationDistrict?: string;
  corridorCode?: string;
  estimatedWeightKg?: number;
  agreedFreightAmount?: number;
  actorId: string;
}) {
  const trade = db.v20Trades.get(params.tradeId);
  if (!trade) return { ok: false, statusCode: 404, error: `Trade ${params.tradeId} not found.` };

  const now = new Date().toISOString();
  const shp: V20LogisticsShipment = {
    id: uid('V20-SHP'),
    tenantId: trade.tenantId,
    tradeId: trade.id,
    transporterParticipantId: params.transporterParticipantId ? cleanText(params.transporterParticipantId) : 'V17-PART-TRANS-01',
    originCountry: cleanText(params.originCountry || trade.countryCode || 'UG').toUpperCase(),
    originDistrict: cleanText(params.originDistrict || trade.district || 'Mbale'),
    destinationCountry: cleanText(params.destinationCountry || trade.countryCode || 'UG').toUpperCase(),
    destinationDistrict: cleanText(params.destinationDistrict || 'Kampala'),
    corridorCode: cleanText(params.corridorCode || 'UG-ELGON-KLA'),
    status: 'REQUESTED',
    version: 1,
    estimatedWeightKg: Math.max(1, Number(params.estimatedWeightKg || trade.quantity || 100)),
    agreedFreightAmount: Math.max(0, Number(params.agreedFreightAmount || 200000)),
    currency: trade.currency,
    statusHistory: [
      {
        status: 'REQUESTED',
        actorId: params.actorId,
        note: `Logistics shipment requested for trade ${trade.id}.`,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.v20Shipments.set(shp.id, shp);
  trade.linkedShipmentId = shp.id;
  if (['AGREEMENT_CREATED', 'OFFER_ACCEPTED'].includes(trade.stage)) {
    trade.stage = 'FULFILMENT_PLANNED';
    trade.version += 1;
    trade.stageHistory.push({
      stage: 'FULFILMENT_PLANNED',
      actorId: params.actorId,
      actorRole: 'LOGISTICS',
      note: `Linked shipment ${shp.id} created.`,
      timestamp: now,
    });
  }
  trade.updatedAt = now;
  db.v20Trades.set(trade.id, trade);
  db.scheduleSave();
  return { ok: true, statusCode: 201, shipment: shp, trade };
}

export function transitionV20Shipment(params: {
  shipmentId: string;
  targetStatus: V20ShipmentStatus;
  actorId: string;
  note?: string;
  transporterParticipantId?: string;
}) {
  const shp = db.v20Shipments.get(params.shipmentId);
  if (!shp) return { ok: false, statusCode: 404, error: `Shipment ${params.shipmentId} not found.` };

  const allowed = SHIPMENT_ALLOWED_TRANSITIONS[shp.status] || [];
  if (!allowed.includes(params.targetStatus)) {
    return {
      ok: false,
      statusCode: 409,
      error: `INVALID_SHIPMENT_TRANSITION: Cannot move shipment from ${shp.status} to ${params.targetStatus}.`,
    };
  }

  const now = new Date().toISOString();
  shp.status = params.targetStatus;
  shp.version += 1;
  if (params.transporterParticipantId) shp.transporterParticipantId = cleanText(params.transporterParticipantId);
  shp.updatedAt = now;
  shp.statusHistory.push({
    status: params.targetStatus,
    actorId: params.actorId,
    note: cleanText(params.note || `Shipment moved to ${params.targetStatus}.`),
    timestamp: now,
  });
  db.v20Shipments.set(shp.id, shp);

  // Propagate logistics in-transit into linked trade
  const trade = db.v20Trades.get(shp.tradeId);
  if (trade) {
    if (['COLLECTION_CONFIRMED', 'IN_TRANSIT'].includes(params.targetStatus) && trade.stage === 'FULFILMENT_PLANNED') {
      trade.stage = 'FULFILMENT_IN_PROGRESS';
      trade.version += 1;
      trade.updatedAt = now;
      trade.stageHistory.push({
        stage: 'FULFILMENT_IN_PROGRESS',
        actorId: params.actorId,
        actorRole: 'TRANSPORTER',
        note: `Propagated from shipment ${shp.id} status=${params.targetStatus}.`,
        timestamp: now,
      });
      db.v20Trades.set(trade.id, trade);
    }
  }

  db.scheduleSave();
  return { ok: true, statusCode: 200, shipment: shp, trade };
}

export function submitV20DeliveryEvidence(params: {
  shipmentId: string;
  recipientName: string;
  quantityReceived: number;
  shortageQty?: number;
  damageNotes?: string;
  consentedLocation?: string;
  photoEvidenceHash?: string;
  offlineCaptured?: boolean;
  submittedBy: string;
}) {
  const shp = db.v20Shipments.get(params.shipmentId);
  if (!shp) return { ok: false, statusCode: 404, error: `Shipment ${params.shipmentId} not found.` };

  const recipient = cleanText(params.recipientName);
  const qtyRecv = Number(params.quantityReceived);
  if (!recipient || !Number.isFinite(qtyRecv) || qtyRecv < 0) {
    return { ok: false, statusCode: 400, error: 'recipientName and valid non-negative quantityReceived are required.' };
  }

  const now = new Date().toISOString();
  const evidence: V20DeliveryEvidence = {
    recipientName: recipient,
    quantityReceived: qtyRecv,
    shortageQty: Math.max(0, Number(params.shortageQty || 0)),
    damageNotes: cleanText(params.damageNotes || 'No transit damage reported.'),
    consentedLocation: params.consentedLocation ? cleanText(params.consentedLocation) : undefined,
    photoEvidenceHash: params.photoEvidenceHash ? cleanText(params.photoEvidenceHash) : undefined,
    capturedAt: now,
    offlineCaptured: Boolean(params.offlineCaptured),
    submittedBy: params.submittedBy,
  };

  shp.deliveryEvidence = evidence;
  shp.status = 'DELIVERY_CONFIRMED';
  shp.version += 1;
  shp.updatedAt = now;
  shp.statusHistory.push({
    status: 'DELIVERY_CONFIRMED',
    actorId: params.submittedBy,
    note: `Delivery evidence submitted by ${recipient} (received=${qtyRecv}, shortage=${evidence.shortageQty}).`,
    timestamp: now,
  });
  db.v20Shipments.set(shp.id, shp);

  const trade = db.v20Trades.get(shp.tradeId);
  if (trade && !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(trade.stage)) {
    trade.stage = 'DELIVERY_EVIDENCE_SUBMITTED';
    trade.version += 1;
    trade.updatedAt = now;
    trade.stageHistory.push({
      stage: 'DELIVERY_EVIDENCE_SUBMITTED',
      actorId: params.submittedBy,
      actorRole: 'TRANSPORTER',
      note: `Delivery evidence attached to shipment ${shp.id}.`,
      timestamp: now,
    });
    db.v20Trades.set(trade.id, trade);
  }

  db.scheduleSave();
  return { ok: true, statusCode: 200, shipment: shp, trade };
}

// ==========================================
// 6. FINANCIAL RECONCILIATION & DOUBLE-ENTRY LEDGER LINKAGE
// ==========================================

export function recordV20PaymentAgainstObligation(params: {
  obligationId: string;
  amount: number;
  paymentChannel: V20PaymentObligation['paymentChannel'];
  receiptRef: string;
  actorId: string;
}) {
  const ob = db.v20PaymentObligations.get(params.obligationId);
  if (!ob) return { ok: false, statusCode: 404, error: `Payment obligation ${params.obligationId} not found.` };

  const amt = Number(params.amount);
  const ref = cleanText(params.receiptRef);
  if (!Number.isFinite(amt) || amt <= 0 || !ref) {
    return { ok: false, statusCode: 400, error: 'Positive payment amount and receiptRef are required.' };
  }

  const now = new Date().toISOString();
  ob.receivedAmount = Number((ob.receivedAmount + amt).toFixed(2));
  ob.varianceAmount = Number((ob.receivedAmount - ob.expectedAmount).toFixed(2));
  ob.outstandingAmount = Math.max(0, Number((ob.expectedAmount - ob.receivedAmount).toFixed(2)));
  ob.paymentChannel = params.paymentChannel || ob.paymentChannel;
  ob.receiptReferences.push({
    ref,
    amount: amt,
    channel: ob.paymentChannel,
    recordedBy: params.actorId,
    recordedAt: now,
  });

  if (ob.outstandingAmount === 0 && ob.varianceAmount === 0) {
    ob.status = 'RECONCILED';
  } else if (ob.receivedAmount > ob.expectedAmount) {
    ob.status = 'VARIANCE_OPEN';
  } else {
    ob.status = 'PARTIALLY_PAID';
  }
  ob.updatedAt = now;

  // Post balanced double-entry journal reference ONLY into universalJournal when NOT a test record,
  // or keep test ledger entries strictly flagged & isolated in V20_TEST_LEDGER reference!
  if (!ob.isTestRecord) {
    const jrnId = uid('V20-JRN');
    db.universalJournal.set(jrnId, {
      id: jrnId,
      transactionId: ob.tradeId,
      reference: ref,
      description: `ECONEX V20 sandbox commercial reconciliation (${ob.id})`,
      currency: ob.currency,
      totalDebits: amt,
      totalCredits: amt,
      isBalanced: true,
      lines: [
        { accountId: '1010-CASH-SANDBOX', accountName: 'Sandbox Settlement Clearing', debit: amt, credit: 0 },
        { accountId: '2010-TRADE-PAYABLE', accountName: 'Commercial Trade Clearing Payable', debit: 0, credit: amt },
      ],
      postedBy: params.actorId,
      postedAt: now,
    } as any);
    ob.ledgerEntryId = jrnId;
  } else {
    ob.ledgerEntryId = uid('V20-TEST-JRN');
  }

  db.v20PaymentObligations.set(ob.id, ob);

  const trade = db.v20Trades.get(ob.tradeId);
  if (trade && ob.status === 'RECONCILED' && trade.stage === 'BUYER_CONFIRMATION') {
    trade.stage = 'RECONCILIATION';
    trade.version += 1;
    trade.updatedAt = now;
    trade.stageHistory.push({
      stage: 'RECONCILIATION',
      actorId: params.actorId,
      actorRole: 'FINANCE',
      note: `Obligation ${ob.id} reconciled cleanly (${ob.ledgerScope}).`,
      timestamp: now,
    });
    db.v20Trades.set(trade.id, trade);
  }

  db.scheduleSave();
  return { ok: true, statusCode: 200, obligation: ob, trade };
}

// ==========================================
// 7. COOPERATIVE COLLECTIVE POOLING & MEMBER-ISOLATED STATEMENTS
// ==========================================

export function contributeToCooperativePool(params: {
  poolId: string;
  farmerParticipantId: string;
  farmerUserId: string;
  farmerName: string;
  cropRecordId?: string;
  qtyContributed: number;
  qualityGrade?: string;
}) {
  const pool = db.v20CooperativePools.get(params.poolId);
  if (!pool) return { ok: false, statusCode: 404, error: `Cooperative pool ${params.poolId} not found.` };

  const qty = Number(params.qtyContributed);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, statusCode: 400, error: 'Positive qtyContributed is required.' };
  }

  const now = new Date().toISOString();
  pool.contributions.push({
    id: uid('V20-CONTRIB'),
    farmerParticipantId: cleanText(params.farmerParticipantId),
    farmerName: cleanText(params.farmerName),
    cropRecordId: params.cropRecordId ? cleanText(params.cropRecordId) : undefined,
    qtyContributed: qty,
    qualityGrade: cleanText(params.qualityGrade || 'Grade 1'),
    contributedAt: now,
  });
  pool.totalQty = Number((pool.totalQty + qty).toFixed(4));
  pool.status = 'AGGREGATED';
  pool.updatedAt = now;

  // Recompute member-isolated distribution statements across all contributors
  const byMember = new Map<string, { name: string; qty: number; userId: string }>();
  for (const c of pool.contributions) {
    const p = db.v17Participants.get(c.farmerParticipantId);
    const existing = byMember.get(c.farmerParticipantId) || {
      name: c.farmerName,
      qty: 0,
      userId: p?.userId || params.farmerUserId,
    };
    existing.qty += c.qtyContributed;
    byMember.set(c.farmerParticipantId, existing);
  }

  pool.memberStatements = Array.from(byMember.entries()).map(([partId, info]) => {
    const shareRatio = pool.totalQty > 0 ? Number((info.qty / pool.totalQty).toFixed(4)) : 0;
    const gross = Number((info.qty * pool.targetUnitPrice).toFixed(2));
    const coopFee = Number((gross * 0.03).toFixed(2));
    return {
      id: uid('V20-STMT'),
      poolId: pool.id,
      cooperativeId: pool.cooperativeId,
      farmerParticipantId: partId,
      farmerUserId: info.userId,
      farmerName: info.name,
      qtyContributed: info.qty,
      shareRatio,
      grossEntitlementAmount: gross,
      cooperativeServiceDeduction: coopFee,
      netPayableAmount: Number((gross - coopFee).toFixed(2)),
      currency: pool.currency,
      settlementStatus: 'CALCULATED',
      generatedAt: now,
    };
  });

  db.v20CooperativePools.set(pool.id, pool);
  db.scheduleSave();
  return { ok: true, statusCode: 200, pool };
}

export function getMemberIsolatedStatements(params: {
  poolId: string;
  viewerUserId: string;
  viewerRole: string;
  targetParticipantId?: string;
}) {
  const pool = db.v20CooperativePools.get(params.poolId);
  if (!pool) return { ok: false, statusCode: 404, error: `Cooperative pool ${params.poolId} not found.` };

  const isPrivileged = params.viewerRole === 'PLATFORM_ADMIN' || params.viewerRole === 'COOPERATIVE_ADMIN';
  if (params.targetParticipantId && !isPrivileged) {
    const targetOwner = pool.memberStatements.find((s) => s.farmerParticipantId === params.targetParticipantId);
    if (targetOwner && targetOwner.farmerUserId !== params.viewerUserId) {
      return {
        ok: false,
        statusCode: 403,
        error: 'MEMBER_PRIVACY_ISOLATION: Individual cooperative distribution statements are private to the owning member or cooperative administrator.',
      };
    }
  }

  const statements = isPrivileged
    ? pool.memberStatements
    : pool.memberStatements.filter(
        (s) =>
          s.farmerUserId === params.viewerUserId &&
          (!params.targetParticipantId || s.farmerParticipantId === params.targetParticipantId)
      );

  return {
    ok: true,
    statusCode: 200,
    poolSummary: {
      id: pool.id,
      title: pool.title,
      totalQty: pool.totalQty,
      unitCode: pool.unitCode,
      currency: pool.currency,
      status: pool.status,
      contributorCount: pool.memberStatements.length,
    },
    statements,
  };
}

// ==========================================
// 8. EXPLAINABLE REPUTATION (NON-PENALIZING ON VALID COMPLAINTS)
// ==========================================

export function recomputeV20ParticipantReputation(participantId: string) {
  const trades = Array.from(db.v20Trades.values()).filter(
    (t) => !t.isTestRecord && (t.buyerParticipantId === participantId || t.sellerParticipantId === participantId)
  );
  const completedTrades = trades.filter((t) => t.stage === 'COMPLETED');
  const openOrLostRespondentDisputes = Array.from(db.v17Disputes.values()).filter(
    (d) => d.respondentId === participantId
  );
  // Note: Complainant filing a legitimate dispute is NEVER penalized!
  const complaintFiledCount = Array.from(db.v17Disputes.values()).filter(
    (d) => d.complainantId === participantId
  ).length;

  const reviews = Array.from(db.v17Reviews.values()).filter(
    (r: any) => r.subjectParticipantId === participantId && r.moderationStatus !== 'HIDDEN'
  );
  const avgReview =
    reviews.length > 0
      ? Number((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(2))
      : null;

  const baseScore = 70;
  const completionBonus = Math.min(20, completedTrades.length * 4);
  const reviewBonus = avgReview ? Math.round((avgReview - 3) * 5) : 0;
  const respondentPenalty = Math.min(25, openOrLostRespondentDisputes.length * 6);
  const explainableScore = Math.max(20, Math.min(100, baseScore + completionBonus + reviewBonus - respondentPenalty));

  return {
    participantId,
    explainableScore,
    completedTradesCount: completedTrades.length,
    totalNonTestTradesCount: trades.length,
    averageReviewRating: avgReview,
    respondentDisputeCount: openOrLostRespondentDisputes.length,
    validComplaintsFiledWithoutPenalty: complaintFiledCount,
    explanationFactors: [
      `Base operational score: ${baseScore}`,
      `Completed verified trades bonus (+4 each, max +20): +${completionBonus}`,
      `Review rating adjustment: ${reviewBonus >= 0 ? '+' : ''}${reviewBonus}`,
      `Disputes as respondent (${openOrLostRespondentDisputes.length}): -${respondentPenalty}`,
      `Policy protection: filing legitimate complaints (${complaintFiledCount}) carries 0 reputation penalty.`,
    ],
    disclaimer: 'Operational evidence-backed reputation summary — NOT a regulated financial credit score.',
    computedAt: new Date().toISOString(),
  };
}

// ==========================================
// 9. OFFLINE SYNC WITH VERSION CONFLICT DETECTION
// ==========================================

export function processV20OfflineSync(params: {
  tenantId: string;
  actorUserId: string;
  items: {
    idempotencyKey: string;
    actionType:
      | 'LISTING_DRAFT'
      | 'ENQUIRY_DRAFT'
      | 'FARM_RECORD_CREATE'
      | 'INVENTORY_UPDATE'
      | 'DELIVERY_EVIDENCE'
      | 'COOP_MEMBER_RECORD'
      | 'TRADE_AGREEMENT_DRAFT';
    entityId?: string;
    clientVersion?: number;
    payload: Record<string, any>;
  }[];
}) {
  const synced: any[] = [];
  const conflicts: V20OfflineConflict[] = [];
  const replays: any[] = [];

  for (const item of params.items || []) {
    const idem = cleanText(item.idempotencyKey);
    if (!idem) continue;

    // Duplicate prevention check across offline conflicts or existing trades
    const existingTrade = Array.from(db.v20Trades.values()).find((t) => t.idempotencyKey === idem);
    if (existingTrade) {
      replays.push({ idempotencyKey: idem, status: 'ALREADY_SYNCED', entityId: existingTrade.id });
      continue;
    }

    const existingConflict = Array.from(db.v20OfflineConflicts.values()).find((c) => c.idempotencyKey === idem);
    if (existingConflict) {
      replays.push({ idempotencyKey: idem, status: existingConflict.resolutionState, conflictId: existingConflict.id });
      continue;
    }

    // Version conflict detection on existing trade or shipment updates
    if (item.entityId && typeof item.clientVersion === 'number') {
      const targetTrade = db.v20Trades.get(item.entityId);
      const targetShip = db.v20Shipments.get(item.entityId);
      const serverVersion = targetTrade?.version ?? targetShip?.version;
      if (serverVersion !== undefined && item.clientVersion < serverVersion) {
        const conflict: V20OfflineConflict = {
          id: uid('V20-CONF'),
          tenantId: params.tenantId,
          actorUserId: params.actorUserId,
          actionType: item.actionType,
          entityId: item.entityId,
          idempotencyKey: idem,
          clientVersion: item.clientVersion,
          serverVersion,
          clientPayload: item.payload || {},
          serverSnapshot: (targetTrade || targetShip) as any,
          resolutionState: 'CONFLICT_DETECTED',
          createdAt: new Date().toISOString(),
        };
        db.v20OfflineConflicts.set(conflict.id, conflict);
        conflicts.push(conflict);
        continue;
      }
    }

    // Non-conflicting safe sync execution
    if (item.actionType === 'LISTING_DRAFT') {
      const res = publishHarvestToMarketplace({
        tenantId: params.tenantId,
        userId: params.actorUserId,
        sellerParticipantId: item.payload?.sellerParticipantId || 'V17-PART-FARMER-01',
        title: item.payload?.title || 'Offline Captured Produce Lot',
        category: item.payload?.category || 'Grains & Cereals',
        district: item.payload?.district || 'Mbale',
        availableQty: Number(item.payload?.availableQty || 100),
        unitPrice: Number(item.payload?.unitPrice || 2000),
        currency: item.payload?.currency || 'UGX',
      });
      synced.push({ idempotencyKey: idem, actionType: item.actionType, ok: res.ok, entityId: res.listing?.id });
    } else if (item.actionType === 'DELIVERY_EVIDENCE' && item.entityId) {
      const res = submitV20DeliveryEvidence({
        shipmentId: item.entityId,
        recipientName: item.payload?.recipientName || 'Offline Recipient Confirmation',
        quantityReceived: Number(item.payload?.quantityReceived || 1),
        shortageQty: Number(item.payload?.shortageQty || 0),
        damageNotes: item.payload?.damageNotes || 'Captured offline',
        consentedLocation: item.payload?.consentedLocation,
        offlineCaptured: true,
        submittedBy: params.actorUserId,
      });
      synced.push({ idempotencyKey: idem, actionType: item.actionType, ok: res.ok, entityId: item.entityId });
    } else if (item.actionType === 'ENQUIRY_DRAFT' || item.actionType === 'TRADE_AGREEMENT_DRAFT') {
      const res = createV20Trade({
        tenantId: params.tenantId,
        actorId: params.actorUserId,
        actorRole: 'FARMER',
        buyerParticipantId: item.payload?.buyerParticipantId || 'V17-PART-BUYER-01',
        sellerParticipantId: item.payload?.sellerParticipantId || 'V17-PART-FARMER-01',
        title: item.payload?.title || 'Offline Synchronized Trade Draft',
        quantity: Number(item.payload?.quantity || 50),
        unitPrice: Number(item.payload?.unitPrice || 5000),
        initialStage: item.actionType === 'TRADE_AGREEMENT_DRAFT' ? 'AGREEMENT_CREATED' : 'ENQUIRY',
        idempotencyKey: idem,
      });
      synced.push({ idempotencyKey: idem, actionType: item.actionType, ok: res.ok, entityId: res.trade?.id });
    } else {
      synced.push({ idempotencyKey: idem, actionType: item.actionType, ok: true, recorded: true });
    }
  }

  db.scheduleSave();
  return {
    syncedCount: synced.filter((s) => s.ok).length,
    conflictCount: conflicts.length,
    replayCount: replays.length,
    synced,
    conflicts,
    replays,
  };
}

export function resolveV20OfflineConflict(params: {
  conflictId: string;
  resolution: 'RESOLVED_SERVER_WINS' | 'RESOLVED_CLIENT_MERGE' | 'DISCARDED';
  actorUserId: string;
}) {
  const c = db.v20OfflineConflicts.get(params.conflictId);
  if (!c) return { ok: false, statusCode: 404, error: `Conflict ${params.conflictId} not found.` };
  if (c.resolutionState !== 'CONFLICT_DETECTED') {
    return { ok: false, statusCode: 409, error: `Conflict already resolved (${c.resolutionState}).` };
  }

  const now = new Date().toISOString();
  c.resolutionState = params.resolution;
  c.resolvedBy = params.actorUserId;
  c.resolvedAt = now;

  if (params.resolution === 'RESOLVED_CLIENT_MERGE' && c.entityId) {
    const t = db.v20Trades.get(c.entityId);
    if (t && c.clientPayload?.note) {
      t.deliveryTerms = cleanText(c.clientPayload.note);
      t.version += 1;
      t.updatedAt = now;
      db.v20Trades.set(t.id, t);
    }
  }

  db.v20OfflineConflicts.set(c.id, c);
  db.scheduleSave();
  return { ok: true, statusCode: 200, conflict: c };
}

// ==========================================
// 10. PILOT LIFECYCLE & HONEST METRICS RECOMPUTE
// ==========================================

export function recomputePilotMetrics(pilot: V20PilotProgramme): V20PilotProgramme {
  const allTrades = Array.from(db.v20Trades.values()).filter(
    (t) => t.countryCode === pilot.countryCode && (pilot.districts.length === 0 || pilot.districts.includes(t.district))
  );
  const actualTrades = allTrades.filter((t) => !t.isTestRecord);
  const testTrades = allTrades.filter((t) => t.isTestRecord);
  const sandboxPayments = Array.from(db.v20PaymentObligations.values()).filter(
    (o) => !o.isTestRecord && o.receivedAmount > 0 && o.tenantId === pilot.tenantId
  );

  pilot.metrics.actual = {
    onboardedCount: pilot.onboardedParticipants.length,
    activeTradesCount: actualTrades.filter((t) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'FAILED'].includes(t.stage)).length,
    completedTradesCount: actualTrades.filter((t) => t.stage === 'COMPLETED').length,
    totalTradeVolumeUgx: actualTrades.reduce((s, t) => s + t.baseUgxEquivalent, 0),
  };
  pilot.metrics.simulated = {
    sandboxPaymentsCount: sandboxPayments.length,
    sandboxVolumeUgx: sandboxPayments.reduce((s, o) => s + o.receivedAmount, 0),
  };
  pilot.metrics.test = {
    verificationTradesCount: testTrades.length,
  };
  pilot.updatedAt = new Date().toISOString();
  db.v20PilotProgrammes.set(pilot.id, pilot);
  return pilot;
}
