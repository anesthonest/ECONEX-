/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Universal Economic Activity & Growth Engine
 * Supports 28+ economic sectors, multi-sector businesses, independent individuals/artisans,
 * Marketplace 2.0 (goods, services, rentals, wholesale, retail, digital offers),
 * configurable 16-stage commercial execution with cryptographic SHA-256 agreement lock,
 * procurement RFQs/tenders, milestone project controls, invoicing & external settlement references,
 * multi-currency FX registry, workforce tasks, explainable economic intelligence,
 * sensitive-sector privacy isolation, relationship graph, and grounded AI assistant.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';
import { detectPromptInjection } from './gemini.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import type {
  UserRole,
  V22AiAssistantQueryResult,
  V22BusinessProfile,
  V22CommercialAgreementSnapshot,
  V22CommercialStage,
  V22EconomicActivity,
  V22EconomicInsight,
  V22EconomicRelationship,
  V22FraudReport,
  V22FxRateRecord,
  V22IndividualProfile,
  V22InvoiceRecord,
  V22PaymentReference,
  V22ProcurementBid,
  V22ProcurementOpportunity,
  V22ProductOrService,
  V22ProjectRecord,
  V22SectorCode,
  V22SectorDefinition,
  V22WorkforceTask,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function cleanV22Text(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

export function sha256V22(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export function uidV22(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export const V22_DISCLAIMER_AGREEMENT =
  'Structured commercial record generated for coordination only; does not constitute formal legal advice.';
export const V22_DISCLAIMER_PROCUREMENT =
  'Private/cooperative/institutional procurement workflow coordinated on ECONEX; NOT an official government procurement portal unless explicitly integrated by statutory authority.';
export const V22_DISCLAIMER_NON_CUSTODIAL =
  'External payment reference recorded for invoice reconciliation only; ECONEX does not hold deposits, operate as a bank, issue e-money, or execute custodial funds transfer.';

const ALL_COMMERCIAL_STAGES_ORDER: V22CommercialStage[] = [
  'PARTICIPANT_REGISTERED',
  'DISCOVERY',
  'ENQUIRY',
  'QUOTATION',
  'NEGOTIATION',
  'AGREEMENT_CONFIRMED',
  'ORDER_OR_ENGAGEMENT_ACTIVE',
  'OBLIGATIONS_ASSIGNED',
  'EXECUTION_IN_PROGRESS',
  'MILESTONE_EVIDENCE_SUBMITTED',
  'DELIVERY_OR_SERVICE_ACCEPTED',
  'INVOICE_ISSUED',
  'EXTERNAL_PAYMENT_REFERENCED',
  'RECONCILIATION_COMPLETED',
  'COMPLETED',
  'PERFORMANCE_TRUST_RECORDED',
];

const STAGE_TRANSITIONS: Record<V22CommercialStage, V22CommercialStage[]> = {
  PARTICIPANT_REGISTERED: ['DISCOVERY', 'ENQUIRY', 'CANCELLED'],
  DISCOVERY: ['ENQUIRY', 'QUOTATION', 'CANCELLED'],
  ENQUIRY: ['QUOTATION', 'NEGOTIATION', 'CANCELLED'],
  QUOTATION: ['NEGOTIATION', 'AGREEMENT_CONFIRMED', 'CANCELLED'],
  NEGOTIATION: ['QUOTATION', 'AGREEMENT_CONFIRMED', 'CANCELLED'],
  AGREEMENT_CONFIRMED: ['ORDER_OR_ENGAGEMENT_ACTIVE', 'OBLIGATIONS_ASSIGNED', 'EXECUTION_IN_PROGRESS', 'DISPUTED', 'CANCELLED'],
  ORDER_OR_ENGAGEMENT_ACTIVE: ['OBLIGATIONS_ASSIGNED', 'EXECUTION_IN_PROGRESS', 'DISPUTED', 'CANCELLED'],
  OBLIGATIONS_ASSIGNED: ['EXECUTION_IN_PROGRESS', 'DISPUTED', 'CANCELLED'],
  EXECUTION_IN_PROGRESS: ['MILESTONE_EVIDENCE_SUBMITTED', 'DELIVERY_OR_SERVICE_ACCEPTED', 'DISPUTED', 'CANCELLED'],
  MILESTONE_EVIDENCE_SUBMITTED: ['EXECUTION_IN_PROGRESS', 'DELIVERY_OR_SERVICE_ACCEPTED', 'DISPUTED'],
  DELIVERY_OR_SERVICE_ACCEPTED: ['INVOICE_ISSUED', 'DISPUTED'],
  INVOICE_ISSUED: ['EXTERNAL_PAYMENT_REFERENCED', 'DISPUTED'],
  EXTERNAL_PAYMENT_REFERENCED: ['RECONCILIATION_COMPLETED', 'DISPUTED'],
  RECONCILIATION_COMPLETED: ['COMPLETED', 'PERFORMANCE_TRUST_RECORDED', 'DISPUTED'],
  COMPLETED: ['PERFORMANCE_TRUST_RECORDED'],
  PERFORMANCE_TRUST_RECORDED: [],
  DISPUTED: ['NEGOTIATION', 'EXECUTION_IN_PROGRESS', 'INVOICE_ISSUED', 'RECONCILIATION_COMPLETED', 'CANCELLED'],
  CANCELLED: [],
};

// Sensitive sectors requiring stricter privacy isolation
const SENSITIVE_SECTORS = new Set<string>([
  'HEALTHCARE_MEDICAL',
  'PHARMA_BIOTECH',
  'FINANCIAL_COORDINATION',
  'PROFESSIONAL_ADVISORY',
]);

export function maskSensitiveBusinessForViewer(
  biz: V22BusinessProfile,
  viewer: { userId: string; isPlatformAdmin: boolean; tenantId: string }
): V22BusinessProfile {
  const isOwner = biz.ownerUserId === viewer.userId;
  const isSensitiveSector =
    SENSITIVE_SECTORS.has(biz.primarySectorCode) ||
    biz.secondarySectorCodes.some((s) => SENSITIVE_SECTORS.has(s));

  if (viewer.isPlatformAdmin || isOwner || !isSensitiveSector) {
    return biz;
  }

  // Mask direct registration & tax identifiers for sensitive sectors viewed by third parties
  return {
    ...biz,
    registrationReference: biz.registrationReference ? `***${biz.registrationReference.slice(-4)}` : undefined,
    taxReference: biz.taxReference ? `***${biz.taxReference.slice(-4)}` : undefined,
    traceableDocuments: biz.traceableDocuments.map((d) => ({
      ...d,
      referenceMasked: d.referenceMasked.slice(0, 4) + '***',
    })),
  };
}

// ==========================================
// 1. SECTOR REGISTRY & EXTENSIBILITY
// ==========================================

export function createV22Sector(params: {
  code: string;
  name: string;
  categoryGroup: V22SectorDefinition['categoryGroup'];
  description: string;
  subsectors?: string[];
  supportedActivityTypes?: string[];
  sensitiveDataIsolationRequired?: boolean;
  complianceNotes?: string;
  actorId: string;
}): { ok: true; sector: V22SectorDefinition } | { ok: false; error: string } {
  const code = cleanV22Text(params.code).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const name = cleanV22Text(params.name);
  if (!code || !name) {
    return { ok: false, error: 'Sector code and name are required.' };
  }
  const dup = Array.from(db.v22Sectors.values()).find((s) => s.code === code);
  if (dup) {
    return { ok: false, error: `Sector code '${code}' already exists.` };
  }
  const now = new Date().toISOString();
  const sector: V22SectorDefinition = {
    id: `SEC-${String(db.v22Sectors.size + 1).padStart(2, '0')}`,
    code: code as V22SectorCode,
    name,
    categoryGroup: params.categoryGroup || 'SERVICES_TECHNOLOGY',
    description: cleanV22Text(params.description || `${name} universal economic sector.`),
    subsectors: (params.subsectors || []).map(cleanV22Text).filter(Boolean),
    supportedActivityTypes: (params.supportedActivityTypes && params.supportedActivityTypes.length > 0
      ? params.supportedActivityTypes
      : ['GOODS_TRADE', 'SERVICE_ENGAGEMENT', 'PROJECT_CONTRACT']
    ).map(cleanV22Text),
    sensitiveDataIsolationRequired: Boolean(params.sensitiveDataIsolationRequired),
    complianceNotes: cleanV22Text(params.complianceNotes || 'Standard verification separation applies.'),
    isCustomAdded: true,
    status: 'ACTIVE',
    createdBy: params.actorId,
    createdAt: now,
    updatedAt: now,
  };
  db.v22Sectors.set(sector.id, sector);
  db.scheduleSave();
  return { ok: true, sector };
}

// ==========================================
// 2. BUSINESSES & INDIVIDUAL PROFILES
// ==========================================

export function createV22BusinessProfile(params: {
  tenantId: string;
  ownerUserId: string;
  name: string;
  legalEntityType: V22BusinessProfile['legalEntityType'];
  primarySectorCode: V22SectorCode;
  secondarySectorCodes?: V22SectorCode[];
  subsectors?: string[];
  activityCategories?: string[];
  countryCode?: string;
  district?: string;
  operatingLocations?: string[];
  currenciesSupported?: string[];
  registrationReference?: string;
  taxReference?: string;
  summary: string;
  capabilities?: string[];
}): { ok: true; business: V22BusinessProfile } | { ok: false; error: string } {
  const name = cleanV22Text(params.name);
  const primarySectorCode = cleanV22Text(params.primarySectorCode).toUpperCase();
  if (!name || !primarySectorCode) {
    return { ok: false, error: 'Business name and primarySectorCode are required.' };
  }
  const sectorExists = Array.from(db.v22Sectors.values()).some((s) => s.code === primarySectorCode);
  if (!sectorExists) {
    return { ok: false, error: `Unknown sector code '${primarySectorCode}'.` };
  }
  const now = new Date().toISOString();
  const biz: V22BusinessProfile = {
    id: uidV22('BIZ-V22'),
    tenantId: params.tenantId,
    ownerUserId: params.ownerUserId,
    name,
    legalEntityType: params.legalEntityType || 'LIMITED_COMPANY',
    primarySectorCode,
    secondarySectorCodes: (params.secondarySectorCodes || []).map((s) => cleanV22Text(s).toUpperCase()).filter(Boolean),
    subsectors: (params.subsectors || []).map(cleanV22Text).filter(Boolean),
    activityCategories: (params.activityCategories && params.activityCategories.length > 0
      ? params.activityCategories
      : ['GOODS_TRADE', 'SERVICE_ENGAGEMENT']),
    countryCode: cleanV22Text(params.countryCode || 'UG').toUpperCase(),
    district: cleanV22Text(params.district || 'Kampala'),
    operatingLocations: (params.operatingLocations || [cleanV22Text(params.district || 'Kampala')]).map(cleanV22Text).filter(Boolean),
    currenciesSupported: (params.currenciesSupported && params.currenciesSupported.length > 0 ? params.currenciesSupported : ['UGX', 'USD']),
    registrationReference: params.registrationReference ? cleanV22Text(params.registrationReference) : undefined,
    taxReference: params.taxReference ? cleanV22Text(params.taxReference) : undefined,
    registrationVerified: false,
    productLicenceVerified: false,
    verificationStatus: 'SELF_DECLARED',
    operationalStatus: 'ACTIVE',
    summary: cleanV22Text(params.summary || `${name} multi-sector economic participant`),
    capabilities: (params.capabilities || []).map(cleanV22Text).filter(Boolean),
    traceableDocuments: [],
    createdAt: now,
    updatedAt: now,
  };
  db.v22Businesses.set(biz.id, biz);
  db.scheduleSave();
  return { ok: true, business: biz };
}

export function createV22IndividualProfile(params: {
  tenantId: string;
  userId: string;
  fullName: string;
  professionalTitle: string;
  sectorCodes: V22SectorCode[];
  skills?: string[];
  countryCode?: string;
  district?: string;
  hourlyOrUnitRate?: number;
  currency?: string;
}): { ok: true; individual: V22IndividualProfile } | { ok: false; error: string } {
  const fullName = cleanV22Text(params.fullName);
  const professionalTitle = cleanV22Text(params.professionalTitle);
  if (!fullName || !professionalTitle) {
    return { ok: false, error: 'fullName and professionalTitle are required.' };
  }
  const now = new Date().toISOString();
  const ind: V22IndividualProfile = {
    id: uidV22('IND-V22'),
    tenantId: params.tenantId,
    userId: params.userId,
    fullName,
    professionalTitle,
    sectorCodes: (params.sectorCodes && params.sectorCodes.length > 0 ? params.sectorCodes : ['PROFESSIONAL_ADVISORY']).map((s) =>
      cleanV22Text(s).toUpperCase()
    ),
    skills: (params.skills || []).map(cleanV22Text).filter(Boolean),
    countryCode: cleanV22Text(params.countryCode || 'UG').toUpperCase(),
    district: cleanV22Text(params.district || 'Kampala'),
    isIndividualNonRegistered: true,
    hourlyOrUnitRate: Math.max(0, Number(params.hourlyOrUnitRate || 0)),
    currency: cleanV22Text(params.currency || 'UGX').toUpperCase(),
    availabilityStatus: 'AVAILABLE',
    portfolioItems: [],
    identityVerified: false,
    verificationNote: 'Individual participant profile created without forced formal company registration.',
    createdAt: now,
    updatedAt: now,
  };
  db.v22Individuals.set(ind.id, ind);
  db.scheduleSave();
  return { ok: true, individual: ind };
}

// ==========================================
// 3. UNIVERSAL MARKETPLACE 2.0 & FRAUD MODERATION
// ==========================================

export function createV22MarketplaceListing(params: {
  tenantId: string;
  sellerUserId: string;
  sellerName: string;
  sellerProfileId?: string;
  sellerType?: V22ProductOrService['sellerType'];
  sectorCode: V22SectorCode;
  subsector?: string;
  offerKind: V22ProductOrService['offerKind'];
  transactionMode?: V22ProductOrService['transactionMode'];
  title: string;
  description: string;
  pricingModel?: V22ProductOrService['pricingModel'];
  unitPrice: number;
  currency?: string;
  unitLabel?: string;
  minOrderQty?: number;
  availableQty?: number | null;
  countryCode?: string;
  district?: string;
  deliveryRegions?: string[];
  isTestRecord?: boolean;
}): { ok: true; listing: V22ProductOrService } | { ok: false; error: string } {
  const title = cleanV22Text(params.title);
  const sectorCode = cleanV22Text(params.sectorCode).toUpperCase();
  const unitPrice = Number(params.unitPrice);
  if (!title || !sectorCode || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return { ok: false, error: 'Valid title, sectorCode, and non-negative unitPrice are required.' };
  }
  const now = new Date().toISOString();
  const listing: V22ProductOrService = {
    id: uidV22('MKT-V22'),
    tenantId: params.tenantId,
    sectorCode,
    subsector: cleanV22Text(params.subsector || 'General'),
    offerKind: params.offerKind || 'SERVICE',
    transactionMode: params.transactionMode || 'B2B',
    sellerType: params.sellerType || 'BUSINESS',
    sellerProfileId: cleanV22Text(params.sellerProfileId || params.sellerUserId),
    sellerUserId: params.sellerUserId,
    sellerName: cleanV22Text(params.sellerName),
    title,
    description: cleanV22Text(params.description || title),
    pricingModel: params.pricingModel || 'FIXED',
    unitPrice,
    currency: cleanV22Text(params.currency || 'UGX').toUpperCase(),
    unitLabel: cleanV22Text(params.unitLabel || 'Unit'),
    minOrderQty: Math.max(1, Number(params.minOrderQty || 1)),
    availableQty: params.availableQty === undefined ? null : params.availableQty,
    countryCode: cleanV22Text(params.countryCode || 'UG').toUpperCase(),
    district: cleanV22Text(params.district || 'Kampala'),
    deliveryRegions: (params.deliveryRegions && params.deliveryRegions.length > 0 ? params.deliveryRegions : [cleanV22Text(params.district || 'Kampala')]),
    identityVerified: false,
    productOrLicenceVerified: false,
    qualityClassification: 'SELF_DECLARED_LISTING',
    moderationStatus: 'ACTIVE',
    fraudReportsCount: 0,
    isTestRecord: Boolean(params.isTestRecord),
    createdAt: now,
    updatedAt: now,
  };
  db.v22MarketplaceItems.set(listing.id, listing);
  db.scheduleSave();
  return { ok: true, listing };
}

export function reportV22ListingOrEntity(params: {
  tenantId: string;
  targetType: V22FraudReport['targetType'];
  targetId: string;
  reporterUserId: string;
  reasonCategory: V22FraudReport['reasonCategory'];
  description: string;
}): { ok: true; report: V22FraudReport } | { ok: false; error: string } {
  const desc = cleanV22Text(params.description);
  if (!desc) return { ok: false, error: 'Report description is required.' };
  const now = new Date().toISOString();
  const report: V22FraudReport = {
    id: uidV22('FRD-V22'),
    tenantId: params.tenantId,
    targetType: params.targetType,
    targetId: cleanV22Text(params.targetId),
    reporterUserId: params.reporterUserId,
    reasonCategory: params.reasonCategory,
    description: desc,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  };
  db.v22FraudReports.set(report.id, report);
  if (params.targetType === 'LISTING') {
    const item = db.v22MarketplaceItems.get(params.targetId);
    if (item) {
      item.fraudReportsCount += 1;
      item.moderationStatus = 'FLAGGED_UNDER_REVIEW';
      item.updatedAt = now;
      db.v22MarketplaceItems.set(item.id, item);
    }
  }
  db.scheduleSave();
  return { ok: true, report };
}

// ==========================================
// 4. UNIVERSAL COMMERCIAL EXECUTION & CRYPTOGRAPHIC AGREEMENT LOCK
// ==========================================

export function createV22CommercialActivity(params: {
  tenantId: string;
  sectorCode: V22SectorCode;
  activityType: V22EconomicActivity['activityType'];
  title: string;
  listingId?: string;
  buyerUserId: string;
  buyerName: string;
  sellerUserId: string;
  sellerName: string;
  quantity: number;
  unitLabel?: string;
  unitPrice: number;
  currency?: string;
  countryCode?: string;
  district?: string;
  idempotencyKey?: string;
  isTestRecord?: boolean;
  actorRole: UserRole;
}): { ok: true; activity: V22EconomicActivity; deduplicated: boolean } | { ok: false; error: string } {
  const idem = cleanV22Text(params.idempotencyKey || uidV22('IDEM-ACT'));
  const existing = Array.from(db.v22Activities.values()).find((a) => a.idempotencyKey === idem);
  if (existing) {
    return { ok: true, activity: existing, deduplicated: true };
  }
  const qty = Number(params.quantity);
  const price = Number(params.unitPrice);
  const title = cleanV22Text(params.title);
  if (!title || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: 'Valid title, positive quantity, and non-negative unitPrice are required.' };
  }
  const now = new Date().toISOString();
  const act: V22EconomicActivity = {
    id: uidV22('ACT-V22'),
    tenantId: params.tenantId,
    activityCode: `ECX-ACT-${new Date().getFullYear()}-${String(db.v22Activities.size + 1).padStart(3, '0')}`,
    sectorCode: cleanV22Text(params.sectorCode || 'PROFESSIONAL_ADVISORY').toUpperCase(),
    activityType: params.activityType || 'SERVICE_ENGAGEMENT',
    title,
    listingId: params.listingId,
    buyerUserId: params.buyerUserId,
    buyerName: cleanV22Text(params.buyerName),
    sellerUserId: params.sellerUserId,
    sellerName: cleanV22Text(params.sellerName),
    quantity: qty,
    unitLabel: cleanV22Text(params.unitLabel || 'Unit'),
    unitPrice: price,
    totalAmount: Number((qty * price).toFixed(2)),
    currency: cleanV22Text(params.currency || 'UGX').toUpperCase(),
    countryCode: cleanV22Text(params.countryCode || 'UG').toUpperCase(),
    district: cleanV22Text(params.district || 'Kampala'),
    stage: 'ENQUIRY',
    configuredStages: [...ALL_COMMERCIAL_STAGES_ORDER],
    evidenceRecords: [],
    idempotencyKey: idem,
    version: 1,
    isTestRecord: Boolean(params.isTestRecord),
    history: [
      {
        stage: 'ENQUIRY',
        actorId: params.buyerUserId,
        actorRole: params.actorRole,
        note: `Universal commercial activity initiated (${params.activityType})`,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  db.v22Activities.set(act.id, act);
  db.scheduleSave();
  return { ok: true, activity: act, deduplicated: false };
}

export function transitionV22ActivityStage(params: {
  activityId: string;
  targetStage: V22CommercialStage;
  actorId: string;
  actorRole: UserRole;
  note?: string;
  evidenceSummary?: string;
  agreementTerms?: {
    title?: string;
    termsSummary?: string;
    scopeOfWorkOrGoods?: string;
    agreedAmount?: number;
    deliveryOrScheduleTerms?: string;
    buyerAccepted?: boolean;
    sellerAccepted?: boolean;
  };
  expectedVersion?: number;
}): { ok: true; activity: V22EconomicActivity } | { ok: false; error: string; statusCode?: number } {
  const act = db.v22Activities.get(params.activityId);
  if (!act) return { ok: false, error: 'Economic activity not found.', statusCode: 404 };

  if (params.expectedVersion !== undefined && act.version !== params.expectedVersion) {
    return {
      ok: false,
      error: `Version conflict: expected v${params.expectedVersion}, current is v${act.version}.`,
      statusCode: 409,
    };
  }

  // Reject silent post-acceptance mutation of locked agreement terms
  if (act.agreement?.lockedAfterAcceptance && params.agreementTerms) {
    const t = params.agreementTerms;
    const changed =
      (t.agreedAmount !== undefined && Number(t.agreedAmount) !== act.agreement.agreedAmount) ||
      (t.termsSummary && cleanV22Text(t.termsSummary) !== act.agreement.termsSummary) ||
      (t.scopeOfWorkOrGoods && cleanV22Text(t.scopeOfWorkOrGoods) !== act.agreement.scopeOfWorkOrGoods);
    if (changed) {
      return {
        ok: false,
        error: 'AGREEMENT_LOCKED: Accepted agreement terms cannot be modified silently without creating an explicit formal variation/dispute.',
        statusCode: 409,
      };
    }
  }

  const allowed = STAGE_TRANSITIONS[act.stage] || [];
  if (!allowed.includes(params.targetStage)) {
    return {
      ok: false,
      error: `Invalid commercial transition: '${act.stage}' cannot transition directly to '${params.targetStage}'. Allowed: [${allowed.join(', ')}].`,
      statusCode: 400,
    };
  }

  const now = new Date().toISOString();
  if (params.targetStage === 'AGREEMENT_CONFIRMED') {
    const termsSummary = cleanV22Text(params.agreementTerms?.termsSummary || act.agreement?.termsSummary || 'Standard scope & milestone settlement terms');
    const scope = cleanV22Text(params.agreementTerms?.scopeOfWorkOrGoods || act.agreement?.scopeOfWorkOrGoods || act.title);
    const amount = Number(params.agreementTerms?.agreedAmount ?? act.totalAmount);
    const schedule = cleanV22Text(params.agreementTerms?.deliveryOrScheduleTerms || act.agreement?.deliveryOrScheduleTerms || 'Per agreed schedule');
    const hashPayload = `${act.id}|${scope}|${amount}|${act.currency}|${termsSummary}|${schedule}`;
    const snap: V22CommercialAgreementSnapshot = {
      version: (act.agreement?.version || 0) + 1,
      templateCode: 'ECONEX-TMPL-UNIVERSAL-V22',
      title: cleanV22Text(params.agreementTerms?.title || `${act.title} — Confirmed Commercial Record`),
      termsSummary,
      scopeOfWorkOrGoods: scope,
      agreedAmount: amount,
      currency: act.currency,
      deliveryOrScheduleTerms: schedule,
      buyerAccepted: params.agreementTerms?.buyerAccepted ?? true,
      sellerAccepted: params.agreementTerms?.sellerAccepted ?? true,
      lockedAfterAcceptance: true,
      sha256Hash: sha256V22(hashPayload),
      legalDisclaimer: V22_DISCLAIMER_AGREEMENT,
      recordedAt: now,
    };
    act.agreement = snap;
  }

  if (params.evidenceSummary) {
    const summary = cleanV22Text(params.evidenceSummary);
    act.evidenceRecords.push({
      id: uidV22('EVD-V22'),
      stage: params.targetStage,
      summary,
      sha256: sha256V22(`${act.id}|${params.targetStage}|${summary}|${now}`),
      submittedBy: params.actorId,
      submittedAt: now,
    });
  }

  act.stage = params.targetStage;
  act.version += 1;
  act.updatedAt = now;
  act.history.push({
    stage: params.targetStage,
    actorId: params.actorId,
    actorRole: params.actorRole,
    note: cleanV22Text(params.note || `Transitioned to ${params.targetStage}`),
    timestamp: now,
  });

  db.v22Activities.set(act.id, act);
  db.scheduleSave();
  return { ok: true, activity: act };
}

// ==========================================
// 5. PROCUREMENT RFQS/TENDERS & PROJECTS
// ==========================================

export function createV22Tender(params: {
  tenantId: string;
  sectorCode: V22SectorCode;
  issuerProfileId: string;
  issuerName: string;
  issuerKind?: V22ProcurementOpportunity['issuerKind'];
  opportunityType?: V22ProcurementOpportunity['opportunityType'];
  title: string;
  scopeDescription: string;
  budgetAmount: number;
  currency?: string;
  countryCode?: string;
  district?: string;
  submissionDeadline?: string;
  evaluationCriteria?: { criterion: string; weightPct: number }[];
  createdBy: string;
}): { ok: true; tender: V22ProcurementOpportunity } | { ok: false; error: string } {
  const title = cleanV22Text(params.title);
  const budget = Number(params.budgetAmount);
  if (!title || !Number.isFinite(budget) || budget <= 0) {
    return { ok: false, error: 'Tender title and positive budgetAmount are required.' };
  }
  const now = new Date().toISOString();
  const tender: V22ProcurementOpportunity = {
    id: uidV22('TND-V22'),
    tenantId: params.tenantId,
    referenceNumber: `ECX-RFQ-${new Date().getFullYear()}-${String(db.v22Tenders.size + 1).padStart(3, '0')}`,
    sectorCode: cleanV22Text(params.sectorCode || 'PROFESSIONAL_ADVISORY').toUpperCase(),
    issuerProfileId: cleanV22Text(params.issuerProfileId || params.createdBy),
    issuerName: cleanV22Text(params.issuerName),
    issuerKind: params.issuerKind || 'PRIVATE_BUSINESS',
    opportunityType: params.opportunityType || 'RFQ',
    title,
    scopeDescription: cleanV22Text(params.scopeDescription || title),
    budgetAmount: budget,
    currency: cleanV22Text(params.currency || 'UGX').toUpperCase(),
    countryCode: cleanV22Text(params.countryCode || 'UG').toUpperCase(),
    district: cleanV22Text(params.district || 'Kampala'),
    submissionDeadline: params.submissionDeadline || new Date(Date.now() + 14 * 86400000).toISOString(),
    evaluationCriteria:
      params.evaluationCriteria && params.evaluationCriteria.length > 0
        ? params.evaluationCriteria
        : [
            { criterion: 'Technical Capability & Evidence', weightPct: 50 },
            { criterion: 'Commercial Bid Competitiveness', weightPct: 30 },
            { criterion: 'Delivery Lead Time', weightPct: 20 },
          ],
    status: 'OPEN',
    nonOfficialGovernmentDisclaimer: V22_DISCLAIMER_PROCUREMENT,
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  db.v22Tenders.set(tender.id, tender);
  db.scheduleSave();
  return { ok: true, tender };
}

export function awardV22TenderBid(params: {
  tenderId: string;
  bidId: string;
  actorId: string;
  actorRole: UserRole;
  evaluationScore: number;
  justification: string;
}): { ok: true; tender: V22ProcurementOpportunity; bid: V22ProcurementBid; activity: V22EconomicActivity } | { ok: false; error: string } {
  const tender = db.v22Tenders.get(params.tenderId);
  const bid = db.v22Bids.get(params.bidId);
  if (!tender || !bid || bid.tenderId !== tender.id) {
    return { ok: false, error: 'Tender or matching bid not found.' };
  }
  const justification = cleanV22Text(params.justification);
  if (!justification) {
    return { ok: false, error: 'Evaluation justification is required before awarding a procurement bid.' };
  }
  const now = new Date().toISOString();
  bid.evaluationScore = Math.max(0, Math.min(100, Number(params.evaluationScore)));
  bid.evaluationJustification = justification;
  bid.evaluatedBy = params.actorId;
  bid.status = 'AWARDED';
  bid.updatedAt = now;
  db.v22Bids.set(bid.id, bid);

  for (const other of db.v22Bids.values()) {
    if (other.tenderId === tender.id && other.id !== bid.id && other.status === 'SUBMITTED') {
      other.status = 'REJECTED';
      other.updatedAt = now;
      db.v22Bids.set(other.id, other);
    }
  }

  const created = createV22CommercialActivity({
    tenantId: tender.tenantId,
    sectorCode: tender.sectorCode,
    activityType: 'PROCUREMENT_AWARD',
    title: `${tender.title} (Award: ${bid.bidderName})`,
    buyerUserId: tender.createdBy,
    buyerName: tender.issuerName,
    sellerUserId: bid.bidderUserId,
    sellerName: bid.bidderName,
    quantity: 1,
    unitLabel: 'Awarded Contract',
    unitPrice: bid.proposedAmount,
    currency: bid.currency,
    countryCode: tender.countryCode,
    district: tender.district,
    actorRole: params.actorRole,
  });

  if (!created.ok) return created;

  tender.status = 'AWARDED';
  tender.awardedBidId = bid.id;
  tender.linkedActivityId = created.activity.id;
  tender.updatedAt = now;
  db.v22Tenders.set(tender.id, tender);
  db.scheduleSave();

  return { ok: true, tender, bid, activity: created.activity };
}

export function createV22Project(params: {
  tenantId: string;
  sectorCode: V22SectorCode;
  title: string;
  clientName: string;
  clientUserId: string;
  contractorName: string;
  contractorUserId: string;
  countryCode?: string;
  district?: string;
  currency?: string;
  milestones: { title: string; deliverable: string; amount: number; dueDate?: string }[];
}): { ok: true; project: V22ProjectRecord } | { ok: false; error: string } {
  const title = cleanV22Text(params.title);
  if (!title || !params.milestones || params.milestones.length === 0) {
    return { ok: false, error: 'Project title and at least one milestone are required.' };
  }
  const now = new Date().toISOString();
  const currency = cleanV22Text(params.currency || 'UGX').toUpperCase();
  const mappedMilestones = params.milestones.map((m, idx) => ({
    id: `MS-${String(idx + 1).padStart(3, '0')}-${crypto.randomBytes(1).toString('hex').toUpperCase()}`,
    sequence: idx + 1,
    title: cleanV22Text(m.title),
    deliverable: cleanV22Text(m.deliverable),
    amount: Math.max(0, Number(m.amount || 0)),
    currency,
    dueDate: cleanV22Text(m.dueDate || '2026-12-30'),
    status: 'PLANNED' as const,
  }));
  const totalBudget = mappedMilestones.reduce((s, m) => s + m.amount, 0);
  const project: V22ProjectRecord = {
    id: uidV22('PRJ-V22'),
    tenantId: params.tenantId,
    projectCode: `ECX-PRJ-${new Date().getFullYear()}-${String(db.v22Projects.size + 1).padStart(3, '0')}`,
    sectorCode: cleanV22Text(params.sectorCode || 'CONSTRUCTION_CIVIL').toUpperCase(),
    title,
    clientName: cleanV22Text(params.clientName),
    clientUserId: params.clientUserId,
    contractorName: cleanV22Text(params.contractorName),
    contractorUserId: params.contractorUserId,
    countryCode: cleanV22Text(params.countryCode || 'UG').toUpperCase(),
    district: cleanV22Text(params.district || 'Kampala'),
    totalBudget,
    currency,
    status: 'ACTIVE',
    milestones: mappedMilestones,
    variations: [],
    createdAt: now,
    updatedAt: now,
  };
  db.v22Projects.set(project.id, project);
  db.scheduleSave();
  return { ok: true, project };
}

// ==========================================
// 6. INVOICES, BALANCED LEDGER POSTING & NON-CUSTODIAL EXTERNAL PAYMENT REFS
// ==========================================

export function createV22Invoice(params: {
  tenantId: string;
  activityId?: string;
  projectId?: string;
  issuerUserId: string;
  issuerName: string;
  recipientUserId: string;
  recipientName: string;
  sectorCode: V22SectorCode;
  lineItems: { description: string; qty: number; unitPrice: number }[];
  taxRatePct?: number;
  currency?: string;
  dueDate?: string;
  isTestRecord?: boolean;
}): { ok: true; invoice: V22InvoiceRecord } | { ok: false; error: string } {
  if (!params.lineItems || params.lineItems.length === 0) {
    return { ok: false, error: 'At least one invoice line item is required.' };
  }
  const currency = cleanV22Text(params.currency || 'UGX').toUpperCase();
  const fxRecord = db.v22FxRates.get(currency);
  if (!fxRecord) {
    return { ok: false, error: `Unsupported currency '${currency}'. Register FX rate first.` };
  }
  const computedLines = params.lineItems.map((l) => {
    const qty = Math.max(1, Number(l.qty || 1));
    const unitPrice = Math.max(0, Number(l.unitPrice || 0));
    return {
      description: cleanV22Text(l.description),
      qty,
      unitPrice,
      total: Number((qty * unitPrice).toFixed(2)),
    };
  });
  const subtotal = Number(computedLines.reduce((s, l) => s + l.total, 0).toFixed(2));
  if (subtotal <= 0) {
    return { ok: false, error: 'Invoice subtotal must be positive.' };
  }
  const taxRatePct = Math.max(0, Number(params.taxRatePct ?? 18));
  const taxAmount = Number(((subtotal * taxRatePct) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));
  const now = new Date().toISOString();

  const invoiceId = uidV22('INV-V22');
  let journalEntryId: string | undefined;
  if (!params.isTestRecord) {
    // Same currency per journal entry ensures strict multi-currency ledger balance invariant
    const journalLines: { accountId: string; direction: 'DEBIT' | 'CREDIT'; amount: number; currency: string; memo: string }[] = [
      {
        accountId: 'COA-1200',
        direction: 'DEBIT',
        amount: totalAmount,
        currency,
        memo: `V22 Invoice Receivable ${invoiceId} (${params.recipientName})`,
      },
      {
        accountId: 'COA-4010',
        direction: 'CREDIT',
        amount: subtotal,
        currency,
        memo: `V22 Commercial Invoice Revenue Recognition ${invoiceId}`,
      },
    ];
    if (taxAmount > 0) {
      journalLines.push({
        accountId: 'COA-2100',
        direction: 'CREDIT',
        amount: taxAmount,
        currency,
        memo: `V22 Tax Liability (${taxRatePct}%) ${invoiceId}`,
      });
    }
    const entry = db.postUniversalJournalEntry({
      referenceType: 'INVOICE',
      referenceId: invoiceId,
      lines: journalLines,
      postedBy: params.issuerUserId,
    });
    journalEntryId = entry.id;
  }

  const invoice: V22InvoiceRecord = {
    id: invoiceId,
    tenantId: params.tenantId,
    invoiceNumber: `ECX-INV-${new Date().getFullYear()}-${String(db.v22Invoices.size + 1).padStart(3, '0')}`,
    activityId: params.activityId,
    projectId: params.projectId,
    issuerUserId: params.issuerUserId,
    issuerName: cleanV22Text(params.issuerName),
    recipientUserId: params.recipientUserId,
    recipientName: cleanV22Text(params.recipientName),
    sectorCode: cleanV22Text(params.sectorCode || 'PROFESSIONAL_ADVISORY').toUpperCase(),
    lineItems: computedLines,
    subtotal,
    taxRatePct,
    taxAmount,
    totalAmount,
    paidAmount: 0,
    balanceDue: totalAmount,
    currency,
    exchangeRateToUgx: fxRecord.rateToUgx,
    exchangeRateSource: fxRecord.rateSource,
    status: 'ISSUED',
    dueDate: cleanV22Text(params.dueDate || '2026-12-30'),
    journalEntryId,
    isTestRecord: Boolean(params.isTestRecord),
    createdAt: now,
    updatedAt: now,
  };

  db.v22Invoices.set(invoice.id, invoice);
  if (params.activityId) {
    const act = db.v22Activities.get(params.activityId);
    if (act) {
      act.invoiceId = invoice.id;
      act.updatedAt = now;
      db.v22Activities.set(act.id, act);
    }
  }
  db.scheduleSave();
  return { ok: true, invoice };
}

export function recordV22ExternalPaymentReference(params: {
  tenantId: string;
  invoiceId: string;
  externalChannel: V22PaymentReference['externalChannel'];
  externalProviderName: string;
  externalReferenceNumber: string;
  amount: number;
  claimCustodialWalletOrDeposit?: boolean;
  recordedBy: string;
}): { ok: true; paymentRef: V22PaymentReference; invoice: V22InvoiceRecord } | { ok: false; error: string; statusCode?: number } {
  // Enforce non-custodial boundary strictly
  if (params.claimCustodialWalletOrDeposit) {
    return {
      ok: false,
      error: 'REGULATORY_BOUNDARY_VIOLATION: ECONEX cannot accept deposits, issue e-money, or act as a custodial bank/wallet.',
      statusCode: 400,
    };
  }
  const invoice = db.v22Invoices.get(params.invoiceId);
  if (!invoice) return { ok: false, error: 'Invoice not found.', statusCode: 404 };
  const amount = Number(params.amount);
  const extRef = cleanV22Text(params.externalReferenceNumber);
  if (!extRef || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'externalReferenceNumber and positive amount are required.', statusCode: 400 };
  }
  if (amount > invoice.balanceDue + 0.01) {
    return { ok: false, error: `Payment reference amount (${amount}) exceeds remaining balanceDue (${invoice.balanceDue}).`, statusCode: 400 };
  }

  const prefId = uidV22('PREF-V22');
  const now = new Date().toISOString();
  let journalEntryId: string | undefined;
  if (!invoice.isTestRecord) {
    const clearingAccount =
      params.externalChannel === 'MOBILE_MONEY'
        ? 'COA-1020'
        : invoice.currency === 'USD'
          ? 'COA-1030'
          : 'COA-1010';
    const entry = db.postUniversalJournalEntry({
      referenceType: 'PAYMENT',
      referenceId: prefId,
      lines: [
        {
          accountId: clearingAccount,
          direction: 'DEBIT',
          amount,
          currency: invoice.currency,
          memo: `External settlement ref ${extRef} via ${cleanV22Text(params.externalProviderName)}`,
        },
        {
          accountId: 'COA-1200',
          direction: 'CREDIT',
          amount,
          currency: invoice.currency,
          memo: `Reconcile invoice receivable ${invoice.invoiceNumber}`,
        },
      ],
      postedBy: params.recordedBy,
    });
    journalEntryId = entry.id;
  }

  const paymentRef: V22PaymentReference = {
    id: prefId,
    tenantId: params.tenantId,
    invoiceId: invoice.id,
    activityId: invoice.activityId,
    externalChannel: params.externalChannel,
    externalProviderName: cleanV22Text(params.externalProviderName),
    externalReferenceNumber: extRef,
    amount,
    currency: invoice.currency,
    evidenceSha256: sha256V22(`${invoice.id}|${extRef}|${amount}|${now}`),
    reconciliationStatus: 'VERIFIED_RECONCILED',
    nonCustodialNotice: V22_DISCLAIMER_NON_CUSTODIAL,
    journalEntryId,
    recordedBy: params.recordedBy,
    recordedAt: now,
  };
  db.v22PaymentRefs.set(paymentRef.id, paymentRef);

  invoice.paidAmount = Number((invoice.paidAmount + amount).toFixed(2));
  invoice.balanceDue = Number(Math.max(0, invoice.totalAmount - invoice.paidAmount).toFixed(2));
  invoice.status = invoice.balanceDue <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';
  invoice.updatedAt = now;
  db.v22Invoices.set(invoice.id, invoice);
  db.scheduleSave();

  return { ok: true, paymentRef, invoice };
}

// ==========================================
// 7. GROUNDED AI ASSISTANT & UNIVERSAL SEARCH
// ==========================================

export async function askV22EconomicAssistant(params: {
  query: string;
  tenantId: string;
  actorId: string;
}): Promise<V22AiAssistantQueryResult> {
  const query = cleanV22Text(params.query);
  const id = uidV22('AI-V22');
  const now = new Date().toISOString();

  if (!query) {
    return {
      id,
      query,
      promptInjectionDetected: false,
      answer: 'Please enter a specific commercial, procurement, sector, or reconciliation question.',
      modelUsed: 'deterministic-guard',
      evidenceIdsCited: [],
      limitations: ['Empty query submitted.'],
      generatedAt: now,
    };
  }

  if (detectPromptInjection(query).flagged) {
    logIntelligenceAudit({
      tenantId: params.tenantId,
      jurisdiction: 'UG',
      actorId: params.actorId,
      actorRole: 'USER',
      actionType: 'PROMPT_INJECTION_BLOCKED',
      entityType: 'V22AiAssistant',
      entityId: id,
      details: `Blocked suspicious prompt injection in V22 Economic Assistant: "${query.slice(0, 120)}"`,
    });
    return {
      id,
      query,
      promptInjectionDetected: true,
      blockedReason: 'Prompt injection / instruction-override pattern detected and blocked before model execution.',
      answer: 'Request blocked by ECONEX AI security guardrails. Rephrase as a direct operational or economic question without instruction overrides.',
      modelUsed: 'security-guardrail',
      evidenceIdsCited: [],
      limitations: ['Execution halted by prompt-injection filter.'],
      generatedAt: now,
    };
  }

  // Gather grounded platform facts
  const sectorsCount = db.v22Sectors.size;
  const bizList = Array.from(db.v22Businesses.values()).filter((b) => b.tenantId === params.tenantId || params.tenantId === 'GLOBAL_PUBLIC');
  const openTenders = Array.from(db.v22Tenders.values()).filter((t) => t.status === 'OPEN');
  const unpaidInvoices = Array.from(db.v22Invoices.values()).filter((i) => i.balanceDue > 0);
  const insights = Array.from(db.v22Insights.values());

  const citedIds: string[] = [
    ...bizList.slice(0, 3).map((b) => b.id),
    ...openTenders.slice(0, 2).map((t) => t.id),
    ...insights.slice(0, 2).map((i) => i.id),
  ];

  const groundedContext = {
    sectorsCount,
    businessesCount: bizList.length,
    sampleBusinesses: bizList.slice(0, 5).map((b) => ({ id: b.id, name: b.name, sector: b.primarySectorCode, district: b.district })),
    openTenders: openTenders.map((t) => ({ id: t.id, title: t.title, budget: t.budgetAmount, currency: t.currency })),
    unpaidInvoicesCount: unpaidInvoices.length,
    insights: insights.map((i) => ({ id: i.id, title: i.title, sector: i.sectorCode, basis: i.evidenceBasis })),
  };

  let answer = '';
  let modelUsed = 'econex-v22-grounded-engine';

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User question: ${query}\n\nVerified internal ECONEX records:\n${JSON.stringify(groundedContext, null, 2)}`,
        config: {
          systemInstruction:
            'You are the ECONEX V22 Universal Economic Assistant (VINEXSAH TECHNOLOGIES). Answer concisely using ONLY verified platform facts provided in the context. Never invent national GDP/macro statistics, revenue figures, or subscriber numbers. Remind the user that human confirmation is required before executing commercial or financial commitments.',
        },
      });
      if (res.text) {
        answer = res.text;
        modelUsed = 'gemini-2.5-flash';
      }
    } catch {
      // Fallback cleanly to deterministic grounded answer
    }
  }

  if (!answer) {
    const q = query.toLowerCase();
    if (q.includes('tender') || q.includes('procure') || q.includes('rfq')) {
      answer = `Grounded Platform Summary: There are currently ${openTenders.length} open private/cooperative procurement opportunities (${openTenders
        .map((t) => `${t.referenceNumber}: ${t.title} [${t.currency} ${t.budgetAmount.toLocaleString()}]`)
        .join('; ')}). Review evaluation criteria and submit a documented bid before the deadline.`;
    } else if (q.includes('invoice') || q.includes('payment') || q.includes('reconcil')) {
      answer = `Grounded Financial Summary: ${unpaidInvoices.length} issued invoice(s) currently have an open balance due (${unpaidInvoices
        .map((i) => `${i.invoiceNumber}: ${i.currency} ${i.balanceDue.toLocaleString()} due from ${i.recipientName}`)
        .join('; ')}). Remember ECONEX records external payment references for reconciliation only (non-custodial).`;
    } else {
      answer = `ECONEX Universal Economy Summary (${sectorsCount} active sectors): ${bizList.length} registered multi-sector businesses and ${db.v22Individuals.size} independent individuals/artisans operate across Construction, Solar Energy, ICT/Software, Healthcare Supplies, Logistics, Manufacturing, and Agriculture. ${openTenders.length} open procurement opportunities and ${insights.length} evidence-backed growth insights are available for review.`;
    }
  }

  return {
    id,
    query,
    promptInjectionDetected: false,
    answer,
    modelUsed,
    evidenceIdsCited: citedIds,
    limitations: [
      'Grounded strictly in internal ECONEX V22 workspace records.',
      'External market/national macro datasets are not connected unless explicitly ingested.',
      'Does not authorize binding legal, procurement, or payment execution without human confirmation.',
    ],
    suggestedAction: {
      actionLabel: 'Review Relevant Workspace Records Before Confirming Action',
      endpointHint: '/api/v22/overview',
      requiresExplicitHumanConfirmation: true,
    },
    generatedAt: now,
  };
}

// ==========================================
// 8. POSTGRESQL 16 SCHEMA 20 DRY-RUN AUDIT
// ==========================================

export function runV22PostgresDryRunAudit() {
  const schemaPath = path.resolve(__dirname, './postgres/schema_v20.sql');
  const schemaExists = fs.existsSync(schemaPath);
  const schemaBytes = schemaExists ? fs.statSync(schemaPath).size : 0;
  const schemaSha256 = schemaExists ? sha256V22(fs.readFileSync(schemaPath, 'utf8')) : '';

  const collectionMappings = [
    { collection: 'v22Sectors', table: 'v22_sectors', count: db.v22Sectors.size },
    { collection: 'v22Businesses', table: 'v22_businesses', count: db.v22Businesses.size },
    { collection: 'v22Individuals', table: 'v22_individuals', count: db.v22Individuals.size },
    { collection: 'v22MarketplaceItems', table: 'v22_marketplace_items', count: db.v22MarketplaceItems.size },
    { collection: 'v22FraudReports', table: 'v22_fraud_reports', count: db.v22FraudReports.size },
    { collection: 'v22Activities', table: 'v22_economic_activities', count: db.v22Activities.size },
    { collection: 'v22Tenders', table: 'v22_procurement_opportunities', count: db.v22Tenders.size },
    { collection: 'v22Bids', table: 'v22_procurement_bids', count: db.v22Bids.size },
    { collection: 'v22Projects', table: 'v22_projects', count: db.v22Projects.size },
    { collection: 'v22Invoices', table: 'v22_invoices', count: db.v22Invoices.size },
    { collection: 'v22PaymentRefs', table: 'v22_payment_references', count: db.v22PaymentRefs.size },
    { collection: 'v22FxRates', table: 'v22_fx_rates', count: db.v22FxRates.size },
    { collection: 'v22WorkforceTasks', table: 'v22_workforce_tasks', count: db.v22WorkforceTasks.size },
    { collection: 'v22Insights', table: 'v22_economic_insights', count: db.v22Insights.size },
    { collection: 'v22Relationships', table: 'v22_economic_relationships', count: db.v22Relationships.size },
    { collection: 'v22Plans', table: 'v22_subscription_plans', count: db.v22Plans.size },
    { collection: 'v22Subscriptions', table: 'v22_business_subscriptions', count: db.v22Subscriptions.size },
    { collection: 'v22InteropEvents', table: 'v22_interoperability_events', count: db.v22InteropEvents.size },
  ];

  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL || process.env.PGHOST);
  const fin = db.getFinancialIntegrityReport();
  const rollback = db.verifyV19BackupAndRollbackReadiness();

  return {
    schemaVersion: 20,
    ddlFile: 'src/server/postgres/schema_v20.sql',
    ddlExists: schemaExists,
    ddlBytes: schemaBytes,
    ddlSha256: schemaSha256,
    databaseUrlConfigured,
    activeAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
    postgresCutoverComplete: false,
    mappedTablesCount: collectionMappings.length,
    collectionMappings,
    v19RollbackVerified: rollback.v19BackupValid,
    ledgerBalanced: fin.journalBalanced,
    auditedAt: new Date().toISOString(),
  };
}
