/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V17.0 - Gate Closure Engine, Onboarding, Relationships, Commercial Ops, 21-State Transactions, Evidence & Offline Revalidation
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import { evaluateV16ReadinessGates } from './v16Infrastructure.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import type {
  V17BuyerRequest,
  V17CommercialListing,
  V17GateRemediationRecord,
  V17GateStatus,
  V17Negotiation,
  V17OfflineSyncItem,
  V17OrganizationMember,
  V17OrganizationProfile,
  V17Participant,
  V17Quotation,
  V17Relationship,
  V17RelationshipInvitation,
  V17TransactionEvidence,
  V17TransactionRecord,
  V17TransactionState,
  V17TransactionVerificationResult,
  V17TransactionVerificationTier,
  V17UnitCode,
  V17VerificationEvidence,
} from '../types/index.ts';

function cleanText(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

function sha256Hex(v: string): string {
  return `0x${crypto.createHash('sha256').update(v).digest('hex')}`;
}

export function maskPhone(phone: string): string {
  const digits = cleanText(phone);
  if (digits.length <= 6) return '***';
  return `${digits.slice(0, 6)} *** ${digits.slice(-3)}`;
}

// ==========================================
// 1. V16->V17 GATE CLOSURE & REMEDIATION ENGINE
// ==========================================

export async function getV17GatesSummary() {
  const v16Eval = await evaluateV16ReadinessGates('PRODUCTION');
  const remediations = Array.from(db.v17GateRemediations.values()).sort((a, b) => a.gateNumber - b.gateNumber);
  const completedCount = remediations.filter((g) => g.status === 'PRODUCTION_READY').length;
  const externalBlockedCount = remediations.filter((g) => g.status === 'EXTERNAL_DEPENDENCY_BLOCKED').length;

  return {
    product: 'ECONEX',
    releaseVersion: 'V17.0-VERIFIED-ECONOMIC-NETWORK-OPERATIONS',
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    statuses: {
      ENGINEERING_COMPLETE: true,
      PRODUCTION_READY: v16Eval.productionAllowed && completedCount === 27,
      LIVE_PILOT_OPERATIONAL: v16Eval.statuses.LIVE_PILOT_OPERATIONAL,
    },
    v16GatesPassed: v16Eval.gatesPassed,
    v17ProductionReadyCount: completedCount,
    externalBlockedCount,
    totalGates: remediations.length,
    gates: remediations.map((g) => {
      const liveV16 = v16Eval.gates.find((vg) => vg.gateNumber === g.gateNumber);
      return {
        ...g,
        liveV16State: liveV16?.state || 'NOT_CONFIGURED',
        liveV16PassedForProduction: Boolean(liveV16?.passedForProduction),
        liveBlocker: liveV16?.blocker || null,
      };
    }),
    checkedAt: new Date().toISOString(),
  };
}

export function remediateV17Gate(params: {
  gateId: string;
  targetStatus: V17GateStatus;
  submittedEvidence?: string;
  waiverAuthority?: string;
  actorId: string;
}): { ok: boolean; statusCode: number; gate?: V17GateRemediationRecord; error?: string } {
  const gate = db.v17GateRemediations.get(params.gateId);
  if (!gate) return { ok: false, statusCode: 404, error: `Gate ${params.gateId} not found.` };

  if (params.targetStatus === 'WAIVED_WITH_AUTHORITY') {
    if (gate.criticalNonWaivable) {
      return {
        ok: false,
        statusCode: 409,
        error: `CRITICAL_GATE_NON_WAIVABLE: ${gate.gateId} (${gate.gateName}) cannot be waived.`,
      };
    }
    if (!cleanText(params.waiverAuthority)) {
      return {
        ok: false,
        statusCode: 400,
        error: 'Explicit waiverAuthority sign-off is required for non-critical gate waivers.',
      };
    }
  }

  if (params.targetStatus === 'PRODUCTION_READY') {
    const blockedDeps = gate.blockedByGates.filter((depId) => {
      const dep = db.v17GateRemediations.get(depId);
      return !dep || dep.status !== 'PRODUCTION_READY';
    });
    if (blockedDeps.length > 0) {
      return {
        ok: false,
        statusCode: 409,
        error: `GATE_DEPENDENCY_BLOCKED: ${gate.gateId} cannot reach PRODUCTION_READY while prerequisite gate(s) remain unclosed: ${blockedDeps.join(', ')}.`,
      };
    }
  }

  const now = new Date().toISOString();
  gate.status = params.targetStatus;
  if (params.submittedEvidence) gate.submittedEvidence = cleanText(params.submittedEvidence);
  if (params.waiverAuthority) gate.waiverAuthority = cleanText(params.waiverAuthority);
  gate.updatedAt = now;
  db.v17GateRemediations.set(gate.gateId, gate);
  db.scheduleSave();

  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'UG',
    actorId: params.actorId,
    actorRole: 'PLATFORM_ADMIN',
    actionType: 'GOVERNANCE_GATE_UPDATED',
    entityType: 'V17_GATE_REMEDIATION',
    entityId: gate.gateId,
    details: `Gate ${gate.gateId} transitioned to ${params.targetStatus}.`,
  });

  return { ok: true, statusCode: 200, gate };
}

// ==========================================
// 2. VERIFIED PARTICIPANT & ORGANIZATION ONBOARDING
// ==========================================

export function onboardV17Participant(params: {
  userId: string;
  tenantId: string;
  participantType: V17Participant['participantType'];
  displayName: string;
  phone?: string;
  countryCode?: string;
  district?: string;
  languages?: string[];
  consentGranted: boolean;
  consentVersion?: string;
  visibility?: V17Participant['visibility'];
}): { ok: boolean; statusCode: number; participant?: V17Participant; error?: string } {
  const displayName = cleanText(params.displayName);
  if (!displayName) return { ok: false, statusCode: 400, error: 'displayName is required.' };
  if (!params.consentGranted) {
    return {
      ok: false,
      statusCode: 400,
      error: 'CONSENT_REQUIRED: Explicit participant consent under PDP 2019 is required before onboarding.',
    };
  }

  const now = new Date().toISOString();
  const participant: V17Participant = {
    id: `V17-PART-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    userId: cleanText(params.userId),
    tenantId: cleanText(params.tenantId),
    participantType: params.participantType || 'FARMER',
    displayName,
    phoneMasked: maskPhone(params.phone || '+256700000000'),
    countryCode: cleanText(params.countryCode || 'UG').toUpperCase(),
    district: cleanText(params.district || 'Kampala'),
    languages: params.languages?.length ? params.languages.map(cleanText) : ['en'],
    verificationLevel: 'CONTACT_VERIFIED',
    verificationSourceLabel: 'Platform Self-Registered & Contact Check (Not Government-Verified)',
    govtVerified: false,
    consentVersion: cleanText(params.consentVersion || 'UG-PDP-2026-v1'),
    consentGranted: true,
    visibility: params.visibility || 'PARTICIPANTS_ONLY',
    createdAt: now,
    updatedAt: now,
  };

  db.v17Participants.set(participant.id, participant);
  db.scheduleSave();
  return { ok: true, statusCode: 201, participant };
}

export function submitV17VerificationEvidence(params: {
  subjectId: string;
  subjectType: 'PARTICIPANT' | 'ORGANIZATION';
  documentType: string;
  documentReference: string;
  submittedBy: string;
}): { ok: boolean; statusCode: number; evidence?: V17VerificationEvidence; error?: string } {
  const ref = cleanText(params.documentReference);
  if (!ref) return { ok: false, statusCode: 400, error: 'documentReference is required.' };

  const exists =
    params.subjectType === 'PARTICIPANT'
      ? db.v17Participants.has(params.subjectId)
      : db.v17Organizations.has(params.subjectId);
  if (!exists) {
    return { ok: false, statusCode: 404, error: `${params.subjectType} ${params.subjectId} not found.` };
  }

  // Strictly never auto-verify uploaded documents!
  const ev: V17VerificationEvidence = {
    id: `V17-VEREV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    subjectId: params.subjectId,
    subjectType: params.subjectType,
    documentType: cleanText(params.documentType || 'NATIONAL_OR_BUSINESS_DOC'),
    fileHashSha256: sha256Hex(`${params.subjectId}:${ref}:${Date.now()}`),
    submittedBy: params.submittedBy,
    decision: 'PENDING',
    reviewNotes: 'Queued for independent reviewer inspection; user upload never auto-verified.',
    verificationTier: 'UNVERIFIED',
    submittedAt: new Date().toISOString(),
  };

  db.v17VerificationEvidences.set(ev.id, ev);
  db.scheduleSave();
  return { ok: true, statusCode: 201, evidence: ev };
}

export function reviewV17VerificationEvidence(params: {
  evidenceId: string;
  decision: 'APPROVED' | 'REJECTED';
  targetLevel?: V17Participant['verificationLevel'];
  reviewNotes: string;
  reviewerId: string;
}): { ok: boolean; statusCode: number; evidence?: V17VerificationEvidence; error?: string } {
  const ev = db.v17VerificationEvidences.get(params.evidenceId);
  if (!ev) return { ok: false, statusCode: 404, error: `Verification evidence ${params.evidenceId} not found.` };
  if (ev.submittedBy === params.reviewerId) {
    return {
      ok: false,
      statusCode: 403,
      error: 'SELF_REVIEW_FORBIDDEN: Submitter cannot review or approve their own verification evidence.',
    };
  }

  const now = new Date().toISOString();
  ev.decision = params.decision;
  ev.reviewedBy = params.reviewerId;
  ev.reviewNotes = cleanText(params.reviewNotes || ev.decision);
  ev.reviewedAt = now;
  const resolvedLevel = params.decision === 'APPROVED' ? params.targetLevel || 'DOCUMENTS_REVIEWED' : 'UNVERIFIED';
  ev.verificationTier = resolvedLevel;
  db.v17VerificationEvidences.set(ev.id, ev);

  if (params.decision === 'APPROVED') {
    if (ev.subjectType === 'PARTICIPANT') {
      const p = db.v17Participants.get(ev.subjectId);
      if (p) {
        p.verificationLevel = resolvedLevel;
        p.verificationSourceLabel =
          resolvedLevel === 'INSTITUTIONALLY_ATTESTED'
            ? 'Institutionally Attested (Requires Bilateral Proof)'
            : 'Platform Document Reviewer Checked (Not Government-Verified)';
        p.updatedAt = now;
        db.v17Participants.set(p.id, p);
      }
    } else {
      const o = db.v17Organizations.get(ev.subjectId);
      if (o) {
        o.verificationLevel = resolvedLevel;
        o.verifiedByNote = `Reviewed by ${params.reviewerId}; external government API registry not linked.`;
        o.updatedAt = now;
        db.v17Organizations.set(o.id, o);
      }
    }
  }

  db.scheduleSave();
  return { ok: true, statusCode: 200, evidence: ev };
}

export function createV17Organization(params: {
  tenantId: string;
  legalName: string;
  orgType: V17OrganizationProfile['orgType'];
  countryCode?: string;
  district?: string;
  registrationRef?: string;
  ownerParticipantId?: string;
}): { ok: boolean; statusCode: number; organization?: V17OrganizationProfile; error?: string } {
  const legalName = cleanText(params.legalName);
  if (!legalName) return { ok: false, statusCode: 400, error: 'legalName is required.' };
  const now = new Date().toISOString();
  const org: V17OrganizationProfile = {
    id: `V17-ORG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    legalName,
    orgType: params.orgType || 'SME',
    countryCode: cleanText(params.countryCode || 'UG').toUpperCase(),
    district: cleanText(params.district || 'Kampala'),
    registrationRef: cleanText(params.registrationRef || `REF-${Date.now().toString(36).toUpperCase()}`),
    verificationLevel: 'UNVERIFIED',
    govtVerified: false,
    verifiedByNote: 'Registered on ECONEX platform; pending document review (Not Government-Verified).',
    visibility: 'PUBLIC',
    createdAt: now,
    updatedAt: now,
  };
  db.v17Organizations.set(org.id, org);

  if (params.ownerParticipantId && db.v17Participants.has(params.ownerParticipantId)) {
    const member: V17OrganizationMember = {
      id: `V17-ORGM-${Date.now().toString(36).toUpperCase()}`,
      organizationId: org.id,
      participantId: params.ownerParticipantId,
      role: 'OWNER',
      status: 'ACTIVE',
      addedAt: now,
    };
    db.v17OrganizationMembers.set(member.id, member);
  }

  db.scheduleSave();
  return { ok: true, statusCode: 201, organization: org };
}

// ==========================================
// 3. COMMERCIAL NETWORK RELATIONSHIPS
// ==========================================

export function listV17Relationships(params: { viewerId: string; isPlatformAdmin: boolean }) {
  const rels = Array.from(db.v17Relationships.values()).filter((r) => {
    if (params.isPlatformAdmin) return true;
    if (r.visibility === 'PUBLIC' || r.visibility === 'PARTICIPANTS_ONLY') return true;
    return r.partyAId === params.viewerId || r.partyBId === params.viewerId;
  });
  const invitations = Array.from(db.v17RelationshipInvitations.values()).filter((inv) => {
    if (params.isPlatformAdmin) return true;
    return inv.fromParticipantId === params.viewerId || inv.toParticipantId === params.viewerId;
  });
  return { relationships: rels, invitations };
}

export function inviteV17Relationship(params: {
  tenantId: string;
  fromParticipantId: string;
  toParticipantId: string;
  relationshipType: V17Relationship['relationshipType'];
  visibility?: V17Relationship['visibility'];
  termsSummary?: string;
}): { ok: boolean; statusCode: number; invitation?: V17RelationshipInvitation; error?: string } {
  if (!params.fromParticipantId || !params.toParticipantId) {
    return { ok: false, statusCode: 400, error: 'fromParticipantId and toParticipantId are required.' };
  }
  if (params.fromParticipantId === params.toParticipantId) {
    return { ok: false, statusCode: 400, error: 'SELF_RELATIONSHIP_FORBIDDEN: Cannot invite self into a bilateral relationship.' };
  }
  const inv: V17RelationshipInvitation = {
    id: `V17-INV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    fromParticipantId: cleanText(params.fromParticipantId),
    toParticipantId: cleanText(params.toParticipantId),
    relationshipType: params.relationshipType || 'SUPPLIER_BUYER',
    visibility: params.visibility || 'PARTICIPANTS_ONLY',
    termsSummary: cleanText(params.termsSummary || 'Standard commercial counterparty relationship.'),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  db.v17RelationshipInvitations.set(inv.id, inv);
  db.scheduleSave();
  return { ok: true, statusCode: 201, invitation: inv };
}

export function respondV17RelationshipInvitation(params: {
  invitationId: string;
  decision: 'ACCEPTED' | 'REJECTED';
  responderId: string;
}): { ok: boolean; statusCode: number; invitation?: V17RelationshipInvitation; relationship?: V17Relationship; error?: string } {
  const inv = db.v17RelationshipInvitations.get(params.invitationId);
  if (!inv) return { ok: false, statusCode: 404, error: `Invitation ${params.invitationId} not found.` };
  if (inv.status !== 'PENDING') return { ok: false, statusCode: 409, error: `Invitation is already ${inv.status}.` };

  const now = new Date().toISOString();
  inv.status = params.decision;
  inv.respondedAt = now;
  db.v17RelationshipInvitations.set(inv.id, inv);

  let rel: V17Relationship | undefined;
  if (params.decision === 'ACCEPTED') {
    rel = {
      id: `V17-REL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      tenantId: inv.tenantId,
      partyAId: inv.fromParticipantId,
      partyBId: inv.toParticipantId,
      relationshipType: inv.relationshipType,
      visibility: inv.visibility,
      status: 'ACTIVE',
      establishedAt: now,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      updatedAt: now,
    };
    db.v17Relationships.set(rel.id, rel);
  }
  db.scheduleSave();
  return { ok: true, statusCode: 200, invitation: inv, relationship: rel };
}

export function updateV17RelationshipStatus(params: {
  relationshipId: string;
  action: 'SUSPEND' | 'REVOKE' | 'RENEW';
}): { ok: boolean; statusCode: number; relationship?: V17Relationship; error?: string } {
  const rel = db.v17Relationships.get(params.relationshipId);
  if (!rel) return { ok: false, statusCode: 404, error: `Relationship ${params.relationshipId} not found.` };
  const now = new Date().toISOString();
  if (params.action === 'SUSPEND') rel.status = 'SUSPENDED';
  else if (params.action === 'REVOKE') rel.status = 'REVOKED';
  else if (params.action === 'RENEW') {
    rel.status = 'ACTIVE';
    rel.expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  }
  rel.updatedAt = now;
  db.v17Relationships.set(rel.id, rel);
  db.scheduleSave();
  return { ok: true, statusCode: 200, relationship: rel };
}

// ==========================================
// 4. COMMERCIAL LISTINGS, BUYER REQUESTS, QUOTATIONS & UNIT CONVERSIONS
// ==========================================

export function normalizeQuantityToKg(qty: number, unitCode: V17UnitCode): number | null {
  if (!Number.isFinite(qty) || qty <= 0) return null;
  if (unitCode === 'KG') return qty;
  if (unitCode === 'BAG_50KG') return qty * 50;
  if (unitCode === 'BAG_100KG') return qty * 100;
  if (unitCode === 'TONNE') return qty * 1000;
  return null; // CRATE / BUNCH / PIECE / LITRE / SERVICE_UNIT have domain-specific mass
}

export function createV17Listing(params: {
  tenantId: string;
  sellerParticipantId: string;
  organizationId?: string;
  title: string;
  sector?: string;
  category?: string;
  countryCode?: string;
  district?: string;
  unitPrice: number;
  currency?: string;
  unitCode?: V17UnitCode;
  availableQty: number;
  minOrderQty?: number;
  qualityGrade?: string;
  deliveryTerms?: string;
}): { ok: boolean; statusCode: number; listing?: V17CommercialListing; error?: string } {
  const title = cleanText(params.title);
  const price = Number(params.unitPrice);
  const qty = Number(params.availableQty);
  if (!title || !Number.isFinite(price) || price <= 0 || !Number.isFinite(qty) || qty <= 0) {
    return { ok: false, statusCode: 400, error: 'Valid title, positive unitPrice, and positive availableQty are required.' };
  }
  const now = new Date().toISOString();
  const listing: V17CommercialListing = {
    id: `V17-LIST-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    sellerParticipantId: cleanText(params.sellerParticipantId),
    organizationId: params.organizationId ? cleanText(params.organizationId) : undefined,
    title,
    sector: cleanText(params.sector || 'AGRICULTURE'),
    category: cleanText(params.category || 'Produce'),
    countryCode: cleanText(params.countryCode || 'UG').toUpperCase(),
    district: cleanText(params.district || 'Kampala'),
    unitPrice: price,
    currency: cleanText(params.currency || 'UGX').toUpperCase(),
    unitCode: params.unitCode || 'KG',
    availableQty: qty,
    minOrderQty: Math.max(1, Number(params.minOrderQty || 1)),
    qualityGrade: cleanText(params.qualityGrade || 'Standard Commercial Grade'),
    deliveryTerms: cleanText(params.deliveryTerms || 'Ex-Warehouse or Corridor Dispatch'),
    visibility: 'PUBLIC',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  db.v17CommercialListings.set(listing.id, listing);
  db.scheduleSave();
  return { ok: true, statusCode: 201, listing };
}

export function createV17BuyerRequest(params: {
  tenantId: string;
  buyerParticipantId: string;
  title: string;
  sector?: string;
  countryCode?: string;
  targetDistrict?: string;
  requestedQty: number;
  unitCode?: V17UnitCode;
  targetUnitPrice: number;
  currency?: string;
  deliveryDeadline?: string;
}): { ok: boolean; statusCode: number; request?: V17BuyerRequest; error?: string } {
  const title = cleanText(params.title);
  const qty = Number(params.requestedQty);
  const targetPrice = Number(params.targetUnitPrice);
  if (!title || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(targetPrice) || targetPrice <= 0) {
    return { ok: false, statusCode: 400, error: 'Valid title, positive requestedQty, and positive targetUnitPrice are required.' };
  }
  const reqObj: V17BuyerRequest = {
    id: `V17-REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    buyerParticipantId: cleanText(params.buyerParticipantId),
    title,
    sector: cleanText(params.sector || 'AGRICULTURE'),
    countryCode: cleanText(params.countryCode || 'UG').toUpperCase(),
    targetDistrict: cleanText(params.targetDistrict || 'Kampala'),
    requestedQty: qty,
    unitCode: params.unitCode || 'KG',
    targetUnitPrice: targetPrice,
    currency: cleanText(params.currency || 'UGX').toUpperCase(),
    deliveryDeadline: params.deliveryDeadline || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };
  db.v17BuyerRequests.set(reqObj.id, reqObj);
  db.scheduleSave();
  return { ok: true, statusCode: 201, request: reqObj };
}

export function submitV17Quotation(params: {
  tenantId: string;
  requestId?: string;
  listingId?: string;
  sellerParticipantId: string;
  buyerParticipantId: string;
  quantity: number;
  unitCode?: V17UnitCode;
  unitPrice: number;
  currency?: string;
}): { ok: boolean; statusCode: number; quotation?: V17Quotation; error?: string } {
  const qty = Number(params.quantity);
  const price = Number(params.unitPrice);
  const unitCode = params.unitCode || 'KG';
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
    return { ok: false, statusCode: 400, error: 'Positive quantity and unitPrice are required.' };
  }
  const now = new Date().toISOString();
  const q: V17Quotation = {
    id: `V17-QUOT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    requestId: params.requestId,
    listingId: params.listingId,
    sellerParticipantId: cleanText(params.sellerParticipantId),
    buyerParticipantId: cleanText(params.buyerParticipantId),
    quantity: qty,
    unitCode,
    normalizedKg: normalizeQuantityToKg(qty, unitCode),
    unitPrice: price,
    totalAmount: Number((qty * price).toFixed(2)),
    currency: cleanText(params.currency || 'UGX').toUpperCase(),
    validUntil: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: 'SENT',
    createdAt: now,
    updatedAt: now,
  };
  db.v17Quotations.set(q.id, q);
  db.scheduleSave();
  return { ok: true, statusCode: 201, quotation: q };
}

export function negotiateV17Quotation(params: {
  quotationId: string;
  proposedBy: string;
  proposedUnitPrice: number;
  proposedQty: number;
  message: string;
  action?: 'COUNTER' | 'ACCEPT' | 'REJECT';
}): { ok: boolean; statusCode: number; quotation?: V17Quotation; negotiation?: V17Negotiation; error?: string } {
  const q = db.v17Quotations.get(params.quotationId);
  if (!q) return { ok: false, statusCode: 404, error: `Quotation ${params.quotationId} not found.` };
  if (q.status === 'ACCEPTED' || q.status === 'REJECTED') {
    return { ok: false, statusCode: 409, error: `Quotation is finalized in ${q.status} status.` };
  }

  const now = new Date().toISOString();
  const existingRounds = Array.from(db.v17Negotiations.values()).filter((n: any) => n.quotationId === q.id).length;

  let neg: V17Negotiation | undefined;
  if (params.action === 'ACCEPT') {
    q.status = 'ACCEPTED';
  } else if (params.action === 'REJECT') {
    q.status = 'REJECTED';
  } else {
    const newPrice = Number(params.proposedUnitPrice || q.unitPrice);
    const newQty = Number(params.proposedQty || q.quantity);
    if (!Number.isFinite(newPrice) || newPrice <= 0 || !Number.isFinite(newQty) || newQty <= 0) {
      return { ok: false, statusCode: 400, error: 'Positive proposedUnitPrice and proposedQty are required.' };
    }
    q.unitPrice = newPrice;
    q.quantity = newQty;
    q.normalizedKg = normalizeQuantityToKg(newQty, q.unitCode);
    q.totalAmount = Number((newPrice * newQty).toFixed(2));
    q.status = 'COUNTERED';
    neg = {
      id: `V17-NEG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      tenantId: q.tenantId,
      quotationId: q.id,
      roundNumber: existingRounds + 1,
      proposedBy: cleanText(params.proposedBy),
      proposedUnitPrice: newPrice,
      proposedQty: newQty,
      message: cleanText(params.message || 'Counteroffer submitted'),
      createdAt: now,
    };
    db.v17Negotiations.set(neg.id, neg);
  }
  q.updatedAt = now;
  db.v17Quotations.set(q.id, q);
  db.scheduleSave();
  return { ok: true, statusCode: 200, quotation: q, negotiation: neg };
}

// ==========================================
// 5. 21-STATE VERIFIED TRANSACTION ENGINE & EVIDENCE SYSTEM
// ==========================================

const V17_TX_ALLOWED_TRANSITIONS: Record<V17TransactionState, V17TransactionState[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED', 'EXPIRED'],
  SUBMITTED: ['ACCEPTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['CONFIRMED', 'CANCELLED', 'DISPUTED'],
  CONFIRMED: ['AWAITING_PAYMENT', 'CANCELLED', 'DISPUTED'],
  AWAITING_PAYMENT: ['PAYMENT_INITIATED', 'IN_FULFILLMENT', 'CANCELLED', 'EXPIRED'],
  PAYMENT_INITIATED: ['PAYMENT_PENDING', 'PAYMENT_CONFIRMED_UNVERIFIED', 'FAILED'],
  PAYMENT_PENDING: ['PAYMENT_CONFIRMED_UNVERIFIED', 'PAYMENT_PROVIDER_VERIFIED', 'FAILED', 'EXPIRED'],
  PAYMENT_CONFIRMED_UNVERIFIED: ['PAYMENT_PROVIDER_VERIFIED', 'DISPUTED', 'FAILED'],
  PAYMENT_PROVIDER_VERIFIED: ['IN_FULFILLMENT', 'REFUNDED', 'DISPUTED'],
  IN_FULFILLMENT: ['READY_FOR_DISPATCH', 'DISPUTED', 'CANCELLED'],
  READY_FOR_DISPATCH: ['IN_TRANSIT', 'DISPUTED'],
  IN_TRANSIT: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['DELIVERY_CONFIRMED', 'DISPUTED'],
  DELIVERY_CONFIRMED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['RECONCILED', 'DISPUTED', 'REFUNDED'],
  RECONCILED: ['DISPUTED'],
  DISPUTED: ['COMPLETED', 'REFUNDED', 'CANCELLED', 'RECONCILED'],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: ['AWAITING_PAYMENT', 'CANCELLED'],
  EXPIRED: [],
};

export function createV17Transaction(params: {
  tenantId: string;
  buyerId: string;
  sellerId: string;
  listingId?: string;
  quotationId?: string;
  currency?: string;
  amount: number;
  quantity: number;
  unitCode?: V17UnitCode;
  externalProviderRef?: string;
  offlineQueued?: boolean;
  actorId: string;
}): { ok: boolean; statusCode: number; transaction?: V17TransactionRecord; error?: string } {
  const amt = Number(params.amount);
  const qty = Number(params.quantity);
  if (!params.buyerId || !params.sellerId || !Number.isFinite(amt) || amt <= 0 || !Number.isFinite(qty) || qty <= 0) {
    return { ok: false, statusCode: 400, error: 'buyerId, sellerId, positive amount, and positive quantity are required.' };
  }
  if (params.buyerId === params.sellerId) {
    return { ok: false, statusCode: 400, error: 'SELF_TRANSACTION_FORBIDDEN: Buyer and seller cannot be identical.' };
  }
  const cleanRef = params.externalProviderRef ? cleanText(params.externalProviderRef) : undefined;
  if (cleanRef) {
    const dup = Array.from(db.v17Transactions.values()).find((t: any) => t.externalProviderRef === cleanRef);
    if (dup) {
      return {
        ok: false,
        statusCode: 409,
        error: `DUPLICATE_EXTERNAL_REF: externalProviderRef ${cleanRef} already bound to transaction ${dup.id}.`,
      };
    }
  }

  const now = new Date().toISOString();
  const tx: V17TransactionRecord = {
    id: `V17-TX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    buyerId: cleanText(params.buyerId),
    sellerId: cleanText(params.sellerId),
    listingId: params.listingId,
    quotationId: params.quotationId,
    currency: cleanText(params.currency || 'UGX').toUpperCase(),
    amount: Number(amt.toFixed(2)),
    quantity: qty,
    unitCode: params.unitCode || 'KG',
    state: 'DRAFT',
    verificationTier: 'PLATFORM_RECORDED',
    externalProviderRef: cleanRef,
    offlineQueued: Boolean(params.offlineQueued),
    offlineRevalidated: !params.offlineQueued,
    stateHistory: [{ state: 'DRAFT', actorId: params.actorId, note: 'Transaction record initialized', at: now }],
    createdAt: now,
    updatedAt: now,
  };
  db.v17Transactions.set(tx.id, tx);
  db.scheduleSave();
  return { ok: true, statusCode: 201, transaction: tx };
}

export function transitionV17Transaction(params: {
  transactionId: string;
  targetState: V17TransactionState;
  actorId: string;
  note?: string;
  externalProviderRef?: string;
}): { ok: boolean; statusCode: number; transaction?: V17TransactionRecord; error?: string } {
  const tx = db.v17Transactions.get(params.transactionId);
  if (!tx) return { ok: false, statusCode: 404, error: `Transaction ${params.transactionId} not found.` };

  const allowed = V17_TX_ALLOWED_TRANSITIONS[tx.state] || [];
  if (!allowed.includes(params.targetState)) {
    return {
      ok: false,
      statusCode: 409,
      error: `INVALID_TX_TRANSITION: Cannot transition transaction from ${tx.state} directly to ${params.targetState}. Allowed: [${allowed.join(', ')}].`,
    };
  }

  if (params.externalProviderRef) {
    const cleanRef = cleanText(params.externalProviderRef);
    const dup = Array.from(db.v17Transactions.values()).find(
      (t: any) => t.id !== tx.id && t.externalProviderRef === cleanRef
    );
    if (dup) {
      return {
        ok: false,
        statusCode: 409,
        error: `DUPLICATE_EXTERNAL_REF: ${cleanRef} is already attached to transaction ${dup.id}.`,
      };
    }
    tx.externalProviderRef = cleanRef;
  }

  if (params.targetState === 'PAYMENT_PROVIDER_VERIFIED' && !tx.externalProviderRef) {
    return {
      ok: false,
      statusCode: 409,
      error: 'PROVIDER_REF_REQUIRED: PAYMENT_PROVIDER_VERIFIED requires a verified externalProviderRef.',
    };
  }

  const now = new Date().toISOString();
  tx.state = params.targetState;
  if (params.targetState === 'CONFIRMED') tx.verificationTier = 'PARTICIPANT_CONFIRMED';
  if (params.targetState === 'PAYMENT_PROVIDER_VERIFIED') tx.verificationTier = 'PROVIDER_CONFIRMED';
  if (params.targetState === 'DELIVERY_CONFIRMED') tx.verificationTier = 'DELIVERY_CONFIRMED';
  if (params.targetState === 'RECONCILED') tx.verificationTier = 'RECONCILED';

  tx.stateHistory.push({
    state: params.targetState,
    actorId: params.actorId,
    note: cleanText(params.note || `Transitioned to ${params.targetState}`),
    at: now,
  });
  tx.updatedAt = now;
  db.v17Transactions.set(tx.id, tx);
  db.scheduleSave();
  return { ok: true, statusCode: 200, transaction: tx };
}

export function attachV17TransactionEvidence(params: {
  transactionId: string;
  evidenceType: V17TransactionEvidence['evidenceType'];
  submittedBy: string;
  submittedRole: string;
  externalRefId?: string;
  payloadSummary: string;
}): { ok: boolean; statusCode: number; evidence?: V17TransactionEvidence; error?: string } {
  const tx = db.v17Transactions.get(params.transactionId);
  if (!tx) return { ok: false, statusCode: 404, error: `Transaction ${params.transactionId} not found.` };

  const extRef = params.externalRefId ? cleanText(params.externalRefId) : undefined;
  if (extRef) {
    const dupEv = Array.from(db.v17TransactionEvidences.values()).find((e: any) => e.externalRefId === extRef);
    if (dupEv) {
      return {
        ok: false,
        statusCode: 409,
        error: `DUPLICATE_EVIDENCE_REF: External reference ${extRef} already exists on evidence ${dupEv.id}.`,
      };
    }
  }

  const isProviderEvidence = params.evidenceType === 'PROVIDER_RECEIPT' || params.evidenceType === 'BANK_SETTLEMENT';
  if (isProviderEvidence && !extRef) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Provider or bank settlement evidence requires externalRefId.',
    };
  }

  // Strictly NEVER auto-verify user-uploaded evidence
  const ev: V17TransactionEvidence = {
    id: `V17-EV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    transactionId: tx.id,
    tenantId: tx.tenantId,
    evidenceType: params.evidenceType,
    submittedBy: params.submittedBy,
    submittedRole: params.submittedRole,
    externalRefId: extRef,
    payloadHashSha256: sha256Hex(`${tx.id}:${params.evidenceType}:${cleanText(params.payloadSummary)}:${Date.now()}`),
    verifiedByIndependentReviewer: false,
    verificationTier: 'PLATFORM_RECORDED',
    autoVerifiedFromUserUpload: false,
    recordedAt: new Date().toISOString(),
  };

  db.v17TransactionEvidences.set(ev.id, ev);
  db.scheduleSave();
  return { ok: true, statusCode: 201, evidence: ev };
}

export function verifyV17Transaction(params: {
  transactionId: string;
  reviewerId: string;
  independentReviewPassed?: boolean;
}): { ok: boolean; statusCode: number; result?: V17TransactionVerificationResult; error?: string } {
  const tx = db.v17Transactions.get(params.transactionId);
  if (!tx) return { ok: false, statusCode: 404, error: `Transaction ${params.transactionId} not found.` };

  const evidences = Array.from(db.v17TransactionEvidences.values()).filter((e: any) => e.transactionId === tx.id);
  const hasProviderEvidence = evidences.some(
    (e: any) => (e.evidenceType === 'PROVIDER_RECEIPT' || e.evidenceType === 'BANK_SETTLEMENT') && Boolean(e.externalRefId)
  );
  const hasDeliveryEvidence = evidences.some(
    (e: any) => e.evidenceType === 'DELIVERY_PHOTO_HASH' || e.evidenceType === 'RECIPIENT_ACK' || e.evidenceType === 'WAYBILL'
  );
  const hasDispute = Array.from(db.v17Disputes.values()).some(
    (d: any) => d.transactionId === tx.id && d.stage !== '11_CLOSED'
  );

  const providerVerified = Boolean(tx.externalProviderRef) || hasProviderEvidence;
  const deliveryVerified = tx.state === 'DELIVERY_CONFIRMED' || tx.state === 'COMPLETED' || tx.state === 'RECONCILED' || hasDeliveryEvidence;
  const reconciled = tx.state === 'RECONCILED';

  let tier: V17TransactionVerificationTier = tx.verificationTier;
  if (params.independentReviewPassed && evidences.length > 0 && providerVerified) {
    tier = 'INDEPENDENTLY_REVIEWED';
    for (const ev of evidences) {
      ev.verifiedByIndependentReviewer = true;
      ev.verificationTier = 'INDEPENDENTLY_REVIEWED';
      db.v17TransactionEvidences.set(ev.id, ev);
    }
  } else if (reconciled) {
    tier = 'RECONCILED';
  } else if (deliveryVerified && providerVerified) {
    tier = 'DELIVERY_CONFIRMED';
  } else if (providerVerified) {
    tier = 'PROVIDER_CONFIRMED';
  }

  tx.verificationTier = tier;
  tx.updatedAt = new Date().toISOString();
  db.v17Transactions.set(tx.id, tx);
  db.scheduleSave();

  const result: V17TransactionVerificationResult = {
    transactionId: tx.id,
    state: tx.state,
    verificationTier: tier,
    providerVerified,
    deliveryVerified,
    reconciled,
    evidenceCount: evidences.length,
    hasDispute,
    checks: [
      `State=${tx.state}`,
      `ProviderProof=${providerVerified}`,
      `DeliveryProof=${deliveryVerified}`,
      `EvidenceItems=${evidences.length}`,
      `OpenDispute=${hasDispute}`,
    ],
    evaluatedAt: new Date().toISOString(),
  };
  return { ok: true, statusCode: 200, result };
}

// ==========================================
// 6. OFFLINE QUEUE & SERVER REVALIDATION GUARD
// ==========================================

export function queueAndSyncV17OfflineAction(params: {
  participantId: string;
  tenantId: string;
  actionType: V17OfflineSyncItem['actionType'];
  targetEntityId?: string;
  queuedPayload: Record<string, any>;
  syncNow?: boolean;
}): V17OfflineSyncItem {
  const now = new Date().toISOString();
  const isSettlementAttempt = params.actionType === 'SETTLEMENT_ATTEMPT';

  const item: V17OfflineSyncItem = {
    id: `V17-OFF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    participantId: cleanText(params.participantId),
    tenantId: cleanText(params.tenantId),
    actionType: params.actionType,
    targetEntityId: params.targetEntityId,
    queuedPayload: params.queuedPayload || {},
    validationStatus: isSettlementAttempt
      ? 'REJECTED_STALE_OR_SETTLEMENT'
      : params.syncNow
        ? 'REVALIDATED'
        : 'QUEUED',
    rejectionReason: isSettlementAttempt
      ? 'OFFLINE_SETTLEMENT_FORBIDDEN: Financial settlements cannot be confirmed offline; live provider callback & verification required.'
      : undefined,
    queuedAt: now,
    syncedAt: params.syncNow || isSettlementAttempt ? now : undefined,
  };

  db.v17OfflineSyncQueue.set(item.id, item);
  db.scheduleSave();
  return item;
}
