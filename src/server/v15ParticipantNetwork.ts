/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V15.0 - Global Economic Participant Network, Discovery, Marketplace & Verified Execution Engine
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import type {
  V15EconomicParticipant,
  ParticipantCategoryV15,
  ParticipantVerification,
  ParticipantMatch,
  MarketplaceOrder,
  MarketplaceOrderLifecycleV15,
  V15EconomicExecution,
  V15DeliveryEvidence,
  IndustrySectorV15,
} from '../types/index.ts';

function sha256Hex(v: string): string {
  return `0x${crypto.createHash('sha256').update(v).digest('hex')}`;
}

export const ALL_24_PARTICIPANT_CATEGORIES: ParticipantCategoryV15[] = [
  'INDIVIDUAL',
  'FARMER',
  'FARMER_GROUP',
  'COOPERATIVE',
  'SME',
  'LARGE_BUSINESS',
  'MANUFACTURER',
  'SUPPLIER',
  'WHOLESALER',
  'RETAILER',
  'IMPORTER',
  'EXPORTER',
  'LOGISTICS_PROVIDER',
  'FREIGHT_OPERATOR',
  'WAREHOUSE',
  'FINANCIAL_SERVICE_PROVIDER',
  'LICENSED_PAYMENT_PROVIDER',
  'INSTITUTIONAL_BUYER',
  'GOVERNMENT_AGENCY',
  'DEVELOPMENT_ORGANIZATION',
  'PROFESSIONAL_SERVICE_PROVIDER',
  'DEVELOPER',
  'INVESTOR_CAPITAL_PROVIDER',
  'EDUCATIONAL_RESEARCH_INSTITUTION',
];

// ==========================================
// 1. GLOBAL ECONOMIC PARTICIPANT NETWORK (§5)
// ==========================================

export function registerEconomicParticipantV15(params: {
  tenantId: string;
  userId?: string;
  displayName: string;
  category: ParticipantCategoryV15;
  jurisdiction: string;
  districtOrCity: string;
  isPilotParticipant?: boolean;
  pilotConsentRecorded?: boolean;
  primarySector?: IndustrySectorV15;
}): { ok: boolean; statusCode: number; participant?: V15EconomicParticipant; error?: string } {
  if (!ALL_24_PARTICIPANT_CATEGORIES.includes(params.category)) {
    return { ok: false, statusCode: 400, error: `Unsupported participant category: ${params.category}` };
  }
  const now = new Date().toISOString();
  const id = `EP-V15-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  // Registration NEVER automatically confers verified identity, KYB status, or regulatory authorization
  const participant: V15EconomicParticipant = {
    id,
    tenantId: params.tenantId,
    userId: params.userId,
    displayName: params.displayName.trim(),
    category: params.category,
    jurisdiction: params.jurisdiction || 'UG',
    districtOrCity: params.districtOrCity || 'Kampala',
    kycStatus: 'UNVERIFIED',
    kybStatus: params.category === 'INDIVIDUAL' || params.category === 'FARMER' ? 'NOT_APPLICABLE' : 'UNVERIFIED',
    regulatoryAuthorized: false,
    verificationLevel: 'REGISTERED_UNVERIFIED',
    accountStatus: 'ACTIVE',
    trustScore: 10,
    trustScoreBasis: 'Initial baseline on registration (unverified; reflects 0 completed verified transactions).',
    isPilotParticipant: Boolean(params.isPilotParticipant && params.pilotConsentRecorded),
    pilotConsentRecorded: Boolean(params.pilotConsentRecorded),
    createdAt: now,
    updatedAt: now,
  };

  db.v15Participants.set(id, participant);
  if (params.primarySector) {
    db.v15EconomicProfiles.set(`PROF-${id}`, {
      id: `PROF-${id}`,
      participantId: id,
      tenantId: params.tenantId,
      primarySector: params.primarySector,
      secondarySectors: [],
      summary: `${params.displayName} (${params.category})`,
      annualCapacityDescription: 'Self-declared capacity pending verification.',
      operatingAreas: [params.districtOrCity || 'Kampala'],
      supportedCurrencies: [params.jurisdiction === 'KE' ? 'KES' : params.jurisdiction === 'TZ' ? 'TZS' : 'UGX'],
      updatedAt: now,
    });
  }
  db.scheduleSave();
  return { ok: true, statusCode: 201, participant };
}

export function verifyParticipantKycOrKybV15(params: {
  participantId: string;
  verificationType: ParticipantVerification['verificationType'];
  documentReference: string;
  decision: 'VERIFIED' | 'REJECTED';
  notes: string;
  reviewerId: string;
}): { ok: boolean; statusCode: number; participant?: V15EconomicParticipant; verification?: ParticipantVerification; error?: string } {
  const p = db.v15Participants.get(params.participantId);
  if (!p) return { ok: false, statusCode: 404, error: `Participant ${params.participantId} not found.` };

  const now = new Date().toISOString();
  const ver: ParticipantVerification = {
    id: `PVER-${Date.now().toString(36).toUpperCase()}`,
    participantId: p.id,
    tenantId: p.tenantId,
    verificationType: params.verificationType,
    providerOrReviewer: 'AETHER-AROS_ADMIN_KYB_REVIEW',
    documentReferenceHash: sha256Hex(params.documentReference || p.id),
    status: params.decision,
    notes: params.notes || '',
    verifiedBy: params.reviewerId,
    createdAt: now,
    decidedAt: now,
  };
  db.v15ParticipantVerifications.set(ver.id, ver);

  if (params.verificationType === 'KYC_INDIVIDUAL') {
    p.kycStatus = params.decision;
    if (params.decision === 'VERIFIED' && p.verificationLevel === 'REGISTERED_UNVERIFIED') {
      p.verificationLevel = 'IDENTITY_VERIFIED';
    }
  } else if (params.verificationType === 'KYB_BUSINESS') {
    p.kybStatus = params.decision;
    if (params.decision === 'VERIFIED') {
      p.verificationLevel = 'BUSINESS_VERIFIED';
    }
  } else if (params.verificationType === 'REGULATORY_LICENSE') {
    p.regulatoryAuthorized = params.decision === 'VERIFIED';
    if (params.decision === 'VERIFIED') {
      p.verificationLevel = 'REGULATED_VERIFIED';
    }
  }

  if (params.decision === 'VERIFIED') {
    p.trustScore = Math.min(100, Math.max(p.trustScore, 55));
    p.trustScoreBasis = `Derived from ${params.verificationType} review (${ver.id}) plus verifiable transaction history.`;
  }
  p.updatedAt = now;
  db.v15Participants.set(p.id, p);
  db.scheduleSave();
  return { ok: true, statusCode: 200, participant: p, verification: ver };
}

export function suspendOrAppealParticipantV15(params: {
  participantId: string;
  action: 'SUSPEND' | 'APPEAL' | 'REINSTATE';
  reasonOrNote: string;
}): { ok: boolean; statusCode: number; participant?: V15EconomicParticipant; error?: string } {
  const p = db.v15Participants.get(params.participantId);
  if (!p) return { ok: false, statusCode: 404, error: `Participant ${params.participantId} not found.` };
  if (params.action === 'SUSPEND') {
    p.accountStatus = 'SUSPENDED';
    p.suspensionReason = params.reasonOrNote;
  } else if (params.action === 'APPEAL') {
    p.accountStatus = 'UNDER_APPEAL';
    p.appealNote = params.reasonOrNote;
  } else {
    p.accountStatus = 'ACTIVE';
  }
  p.updatedAt = new Date().toISOString();
  db.v15Participants.set(p.id, p);
  db.scheduleSave();
  return { ok: true, statusCode: 200, participant: p };
}

// ==========================================
// 2. EXPLAINABLE DISCOVERY & MATCHING ENGINE (§6)
// ==========================================

export function discoverAndMatchV15(params: {
  requesterParticipantId: string;
  query?: string;
  sector?: IndustrySectorV15;
  jurisdiction?: string;
  verifiedOnly?: boolean;
  includePromoted?: boolean;
  targetType?: 'ALL' | 'LISTINGS' | 'SERVICES' | 'OPPORTUNITIES' | 'PARTICIPANTS' | 'APIS';
}): {
  organicMatches: ParticipantMatch[];
  promotedPlacements: ParticipantMatch[];
  rankingMethodologyNote: string;
} {
  const q = (params.query || '').trim().toLowerCase();
  const organicMatches: ParticipantMatch[] = [];
  const promotedPlacements: ParticipantMatch[] = [];
  const now = new Date().toISOString();
  const target = params.targetType || 'ALL';

  if (target === 'ALL' || target === 'LISTINGS') {
    for (const l of db.v15EconomicListings.values()) {
      if (!l.active) continue;
      if (params.sector && l.sector !== params.sector) continue;
      if (params.jurisdiction && l.jurisdiction !== params.jurisdiction) continue;
      if (params.verifiedOnly && !l.verifiedSupplier) continue;
      const textHit = !q || l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.sector.toLowerCase().includes(q);
      if (!textHit) continue;

      const factors = [
        { factor: 'Verification Status', weight: l.verifiedSupplier ? 40 : 10, detail: l.verifiedSupplier ? 'KYB/KYC verified supplier' : 'Unverified registrant' },
        { factor: 'Stock Availability', weight: l.availableQuantity > 0 ? 30 : 0, detail: `${l.availableQuantity} ${l.unit} available` },
        { factor: 'Jurisdiction & Query Fit', weight: q ? 30 : 20, detail: `${l.jurisdiction} · ${l.sector}` },
      ];
      const organicScore = factors.reduce((s, f) => s + f.weight, 0);
      const match: ParticipantMatch = {
        id: `MTH-${l.id}-${Date.now().toString(36)}`,
        requesterParticipantId: params.requesterParticipantId,
        matchedEntityId: l.id,
        matchedEntityType: 'ECONOMIC_LISTING',
        title: l.title,
        organicScore,
        promotedPlacement: l.promotedPlacement,
        promotionDisclosure: l.promotedPlacement ? 'PAID_PLACEMENT: Ranked separately from organic quality score.' : null,
        explanationFactors: factors,
        generatedAt: now,
      };
      if (l.promotedPlacement) {
        if (params.includePromoted !== false) promotedPlacements.push(match);
      } else {
        organicMatches.push(match);
      }
    }
  }

  if (target === 'ALL' || target === 'SERVICES') {
    for (const s of db.v15ServiceListings.values()) {
      if (!s.active) continue;
      if (params.jurisdiction && !s.jurisdictionCoverage.includes(params.jurisdiction)) continue;
      if (params.verifiedOnly && !s.verifiedProvider) continue;
      const textHit = !q || s.title.toLowerCase().includes(q) || s.serviceCategory.toLowerCase().includes(q);
      if (!textHit) continue;

      const factors = [
        { factor: 'Provider Verification', weight: s.verifiedProvider ? 45 : 15, detail: s.verifiedProvider ? 'Verified operator' : 'Unverified' },
        { factor: 'Corridor Coverage', weight: 35, detail: s.jurisdictionCoverage.join(', ') },
        { factor: 'Rate Transparency', weight: 20, detail: `${s.baseRate} ${s.currency} / ${s.rateUnit}` },
      ];
      const match: ParticipantMatch = {
        id: `MTH-${s.id}-${Date.now().toString(36)}`,
        requesterParticipantId: params.requesterParticipantId,
        matchedEntityId: s.id,
        matchedEntityType: 'SERVICE_LISTING',
        title: s.title,
        organicScore: factors.reduce((a, b) => a + b.weight, 0),
        promotedPlacement: s.promotedPlacement,
        promotionDisclosure: s.promotedPlacement ? 'PAID_PLACEMENT: Separated from organic rankings.' : null,
        explanationFactors: factors,
        generatedAt: now,
      };
      if (s.promotedPlacement) {
        if (params.includePromoted !== false) promotedPlacements.push(match);
      } else {
        organicMatches.push(match);
      }
    }
  }

  if (target === 'ALL' || target === 'OPPORTUNITIES') {
    for (const op of db.v15MarketOpportunities.values()) {
      if (op.status !== 'OPEN') continue;
      if (params.jurisdiction && op.jurisdiction !== params.jurisdiction) continue;
      if (q && !op.title.toLowerCase().includes(q) && !op.sector.toLowerCase().includes(q)) continue;
      organicMatches.push({
        id: `MTH-${op.id}-${Date.now().toString(36)}`,
        requesterParticipantId: params.requesterParticipantId,
        matchedEntityId: op.id,
        matchedEntityType: 'OPPORTUNITY',
        title: op.title,
        organicScore: 82,
        promotedPlacement: false,
        promotionDisclosure: null,
        explanationFactors: [
          { factor: 'Open Opportunity Status', weight: 50, detail: op.opportunityType },
          { factor: 'Jurisdiction & Sector Fit', weight: 32, detail: `${op.jurisdiction} · ${op.sector}` },
        ],
        generatedAt: now,
      });
    }
  }

  if (target === 'ALL' || target === 'PARTICIPANTS') {
    for (const p of db.v15Participants.values()) {
      if (p.accountStatus !== 'ACTIVE') continue;
      if (params.jurisdiction && p.jurisdiction !== params.jurisdiction) continue;
      if (params.verifiedOnly && p.verificationLevel === 'REGISTERED_UNVERIFIED') continue;
      if (q && !p.displayName.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) continue;
      organicMatches.push({
        id: `MTH-${p.id}-${Date.now().toString(36)}`,
        requesterParticipantId: params.requesterParticipantId,
        matchedEntityId: p.id,
        matchedEntityType: 'PARTICIPANT',
        title: `${p.displayName} (${p.category})`,
        organicScore: Math.round(p.trustScore),
        promotedPlacement: false,
        promotionDisclosure: null,
        explanationFactors: [
          { factor: 'Verified Activity Trust Score', weight: Math.round(p.trustScore), detail: p.trustScoreBasis },
        ],
        generatedAt: now,
      });
    }
  }

  organicMatches.sort((a, b) => b.organicScore - a.organicScore);

  return {
    organicMatches: organicMatches.slice(0, 30),
    promotedPlacements: promotedPlacements.slice(0, 10),
    rankingMethodologyNote: 'Organic rankings derive exclusively from verification status, stock/capacity, jurisdiction fit, and verifiable transaction history; paid promotions are never mixed into organic quality scores.',
  };
}

// ==========================================
// 3. GLOBAL COMMERCE (13-STAGE) & VERIFIED EXECUTION (§7, §8)
// ==========================================

const ALLOWED_ORDER_TRANSITIONS: Record<MarketplaceOrderLifecycleV15, MarketplaceOrderLifecycleV15[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['CONTRACTED', 'CANCELLED'],
  CONTRACTED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['PAYMENT_AUTHORIZED', 'CANCELLED', 'DISPUTED'],
  PAYMENT_AUTHORIZED: ['PROCESSING', 'DISPUTED'],
  PROCESSING: ['DISPATCHED', 'PARTIAL_FULFILMENT', 'DISPUTED'],
  PARTIAL_FULFILMENT: ['DISPATCHED', 'DISPUTED'],
  DISPATCHED: ['IN_TRANSIT', 'DISPUTED'],
  IN_TRANSIT: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['DELIVERY_VERIFIED', 'DISPUTED'],
  DELIVERY_VERIFIED: ['RECONCILED', 'DISPUTED'],
  RECONCILED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  DISPUTED: ['RECONCILED', 'CANCELLED'],
};

export function createMarketplaceOrderV15(params: {
  tenantId: string;
  buyerParticipantId: string;
  sellerParticipantId: string;
  listingId?: string;
  jurisdiction: string;
  currency: string;
  quantity: number;
  unitPrice: number;
  actorId: string;
  initialState?: 'DRAFT' | 'SUBMITTED';
}): { ok: boolean; statusCode: number; order?: MarketplaceOrder; execution?: V15EconomicExecution; error?: string } {
  const buyer = db.v15Participants.get(params.buyerParticipantId);
  const seller = db.v15Participants.get(params.sellerParticipantId);
  if (!buyer || !seller) return { ok: false, statusCode: 404, error: 'Valid buyerParticipantId and sellerParticipantId are required.' };
  if (params.quantity <= 0 || params.unitPrice < 0) {
    return { ok: false, statusCode: 400, error: 'Quantity must be positive and unitPrice non-negative.' };
  }

  const now = new Date().toISOString();
  const totalAmount = Number((params.quantity * params.unitPrice).toFixed(2));
  const state: MarketplaceOrderLifecycleV15 = params.initialState || 'SUBMITTED';
  const orderId = `MORD-V15-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const poId = `PO-V15-${Date.now().toString(36).toUpperCase()}`;

  const order: MarketplaceOrder = {
    id: orderId,
    tenantId: params.tenantId,
    buyerParticipantId: buyer.id,
    sellerParticipantId: seller.id,
    listingId: params.listingId,
    purchaseOrderId: poId,
    jurisdiction: params.jurisdiction || 'UG',
    currency: params.currency || 'UGX',
    quantity: params.quantity,
    unitPrice: params.unitPrice,
    totalAmount,
    lifecycleState: state,
    paymentAuthorized: false,
    settlementVerified: false,
    deliveryVerified: false,
    history: [{ state, actorId: params.actorId, note: 'Marketplace order initialized (separate from financial settlement).', at: now }],
    createdAt: now,
    updatedAt: now,
  };

  db.v15PurchaseOrders.set(poId, {
    id: poId,
    poNumber: poId,
    tenantId: params.tenantId,
    marketplaceOrderId: orderId,
    buyerParticipantId: buyer.id,
    supplierParticipantId: seller.id,
    currency: order.currency,
    totalAmount,
    termsSummary: 'Standard V15 verifiable commerce terms (requires settlement & independent delivery verification).',
    status: 'ISSUED',
    createdAt: now,
  });

  const execId = `EX-V15-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const execution: V15EconomicExecution = {
    id: execId,
    tenantId: params.tenantId,
    initiatingParticipantId: buyer.id,
    counterpartyParticipantId: seller.id,
    jurisdiction: order.jurisdiction,
    currency: order.currency,
    transactionValue: totalAmount,
    settledValue: 0,
    marketplaceOrderId: orderId,
    lifecycleState: 'INITIATED',
    authorizationHistory: [{ actorId: params.actorId, action: `ORDER_CREATED (${state})`, at: now }],
    createdAt: now,
    updatedAt: now,
  };

  db.v15MarketplaceOrders.set(order.id, order);
  db.v15EconomicExecutions.set(execution.id, execution);
  db.scheduleSave();
  return { ok: true, statusCode: 201, order, execution };
}

export function transitionMarketplaceOrderV15(params: {
  orderId: string;
  targetState: MarketplaceOrderLifecycleV15;
  actorId: string;
  note?: string;
}): { ok: boolean; statusCode: number; order?: MarketplaceOrder; error?: string } {
  const order = db.v15MarketplaceOrders.get(params.orderId);
  if (!order) return { ok: false, statusCode: 404, error: `Order ${params.orderId} not found.` };

  const allowedNext = ALLOWED_ORDER_TRANSITIONS[order.lifecycleState] || [];
  if (!allowedNext.includes(params.targetState)) {
    return {
      ok: false,
      statusCode: 409,
      error: `INVALID_ORDER_TRANSITION: Cannot move from ${order.lifecycleState} to ${params.targetState}.`,
    };
  }

  if (params.targetState === 'DELIVERY_VERIFIED' && !order.deliveryVerified) {
    return {
      ok: false,
      statusCode: 409,
      error: 'INDEPENDENT_DELIVERY_EVIDENCE_REQUIRED: Verify independent delivery evidence before DELIVERY_VERIFIED.',
    };
  }

  if ((params.targetState === 'RECONCILED' || params.targetState === 'COMPLETED') && !order.settlementVerified && !order.paymentAuthorized) {
    return {
      ok: false,
      statusCode: 409,
      error: 'SETTLEMENT_OR_PAYMENT_PROOF_REQUIRED: Cannot complete commerce order without verified settlement or authorized payment proof.',
    };
  }

  const now = new Date().toISOString();
  const prev = order.lifecycleState;
  order.lifecycleState = params.targetState;
  if (params.targetState === 'CANCELLED' || params.targetState === 'REJECTED' || params.targetState === 'DISPUTED') {
    order.cancellationOrDisputeReason = params.note || params.targetState;
  }
  order.history.push({ state: params.targetState, actorId: params.actorId, note: params.note || `Transitioned to ${params.targetState}`, at: now });
  order.updatedAt = now;
  db.v15MarketplaceOrders.set(order.id, order);

  const exec = Array.from(db.v15EconomicExecutions.values()).find((e) => e.marketplaceOrderId === order.id);
  if (exec) {
    const prevExecState = exec.lifecycleState;
    if (params.targetState === 'CONTRACTED') exec.lifecycleState = 'CONTRACTED';
    if (params.targetState === 'PAYMENT_PENDING') exec.lifecycleState = 'PAYMENT_INITIATED';
    if (params.targetState === 'DELIVERY_VERIFIED') exec.lifecycleState = 'DELIVERY_VERIFIED';
    if (params.targetState === 'RECONCILED') exec.lifecycleState = 'RECONCILED';
    if (params.targetState === 'COMPLETED') exec.lifecycleState = 'COMPLETED';
    if (params.targetState === 'DISPUTED') exec.lifecycleState = 'DISPUTED';
    if (params.targetState === 'CANCELLED') exec.lifecycleState = 'CANCELLED';
    exec.updatedAt = now;
    db.v15EconomicExecutions.set(exec.id, exec);

    const evId = `EXEV-V15-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    db.v15ExecutionEvents.set(evId, {
      id: evId,
      executionId: exec.id,
      tenantId: exec.tenantId,
      eventType: `ORDER_${params.targetState}`,
      fromState: prevExecState,
      toState: exec.lifecycleState,
      actorId: params.actorId,
      details: `Order ${order.id} transitioned ${prev} -> ${params.targetState}`,
      createdAt: now,
    });
  }

  db.scheduleSave();
  return { ok: true, statusCode: 200, order };
}

export function submitOrVerifyDeliveryEvidenceV15(params: {
  action: 'SUBMIT' | 'VERIFY';
  evidenceId?: string;
  marketplaceOrderId: string;
  submittedByParticipantId: string;
  verifierParticipantId?: string;
  evidenceType?: V15DeliveryEvidence['evidenceType'];
  documentSummary?: string;
  tenantId: string;
}): { ok: boolean; statusCode: number; evidence?: V15DeliveryEvidence; error?: string } {
  const order = db.v15MarketplaceOrders.get(params.marketplaceOrderId);
  if (!order) return { ok: false, statusCode: 404, error: `Order ${params.marketplaceOrderId} not found.` };
  const now = new Date().toISOString();

  if (params.action === 'SUBMIT') {
    const id = `DLV-V15-${Date.now().toString(36).toUpperCase()}`;
    const ev: V15DeliveryEvidence = {
      id,
      marketplaceOrderId: order.id,
      tenantId: params.tenantId,
      submittedByParticipantId: params.submittedByParticipantId,
      evidenceType: params.evidenceType || 'SIGNED_WAYBILL',
      documentHashSha256: sha256Hex(params.documentSummary || `${order.id}:${now}`),
      trustStatus: 'SUBMITTED_CLAIM',
      submittedAt: now,
    };
    db.v15DeliveryEvidences.set(ev.id, ev);
    db.scheduleSave();
    return { ok: true, statusCode: 201, evidence: ev };
  }

  const ev = params.evidenceId ? db.v15DeliveryEvidences.get(params.evidenceId) : undefined;
  if (!ev) return { ok: false, statusCode: 404, error: 'Delivery evidence record not found.' };

  // Anti-self-verification rule
  if (!params.verifierParticipantId || params.verifierParticipantId === ev.submittedByParticipantId) {
    return {
      ok: false,
      statusCode: 403,
      error: 'SELF_VERIFICATION_PROHIBITED: Submitter cannot independently verify their own delivery claim.',
    };
  }

  ev.trustStatus = 'INDEPENDENTLY_VERIFIED';
  ev.verifiedByIndependentParticipantId = params.verifierParticipantId;
  ev.verifiedAt = now;
  db.v15DeliveryEvidences.set(ev.id, ev);

  order.deliveryVerified = true;
  db.v15MarketplaceOrders.set(order.id, order);
  const exec = Array.from(db.v15EconomicExecutions.values()).find((e) => e.marketplaceOrderId === order.id);
  if (exec) {
    exec.deliveryEvidenceId = ev.id;
    exec.deliveryReference = ev.id;
    exec.updatedAt = now;
    db.v15EconomicExecutions.set(exec.id, exec);
  }
  db.scheduleSave();
  return { ok: true, statusCode: 200, evidence: ev };
}
