/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V17.0 - Trust & Reviews, 11-Stage Disputes, Regional Jurisdictions, Corridors,
 * Cooperatives, Reconciliation Cases, Billing Truth, Governance Dual-Auth & Real-Data Intelligence
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import type {
  V17CooperativeActivity,
  V17CooperativeMembership,
  V17DataPrivacyRequest,
  V17DisputeRecord,
  V17DisputeStage,
  V17LogisticsShipment,
  V17NetworkBillingRecord,
  V17PolicyApproval,
  V17ReconciliationCase,
  V17ReputationRecord,
  V17ReviewRecord,
} from '../types/index.ts';

function cleanText(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

function sha256Hex(v: string): string {
  return `0x${crypto.createHash('sha256').update(v).digest('hex')}`;
}

// ==========================================
// 1. TRANSACTION-BACKED REVIEWS & VOLUME-NEUTRAL REPUTATION
// ==========================================

export function submitV17Review(params: {
  transactionId: string;
  reviewerParticipantId: string;
  rating: number;
  comment: string;
}): { ok: boolean; statusCode: number; review?: V17ReviewRecord; reputation?: V17ReputationRecord; error?: string } {
  const tx = db.v17Transactions.get(params.transactionId);
  if (!tx) return { ok: false, statusCode: 404, error: `Transaction ${params.transactionId} not found.` };

  const isParty = params.reviewerParticipantId === tx.buyerId || params.reviewerParticipantId === tx.sellerId;
  if (!isParty) {
    return {
      ok: false,
      statusCode: 403,
      error: 'NON_PARTY_REVIEW_BLOCKED: Only direct buyer or seller participants of the transaction may leave a review.',
    };
  }

  const eligibleStates = ['DELIVERY_CONFIRMED', 'COMPLETED', 'RECONCILED'];
  if (!eligibleStates.includes(tx.state)) {
    return {
      ok: false,
      statusCode: 409,
      error: `REVIEW_REQUIRES_COMPLETION: Transaction must reach DELIVERY_CONFIRMED, COMPLETED, or RECONCILED before review (current=${tx.state}).`,
    };
  }

  const subjectId = params.reviewerParticipantId === tx.buyerId ? tx.sellerId : tx.buyerId;
  if (subjectId === params.reviewerParticipantId) {
    return { ok: false, statusCode: 400, error: 'SELF_RATING_FORBIDDEN: Cannot rate yourself.' };
  }

  const duplicate = Array.from(db.v17Reviews.values()).find(
    (r: any) => r.transactionId === tx.id && r.reviewerParticipantId === params.reviewerParticipantId
  );
  if (duplicate) {
    return {
      ok: false,
      statusCode: 409,
      error: 'DUPLICATE_REVIEW_BLOCKED: Reviewer already submitted feedback for this transaction.',
    };
  }

  const ratingNum = Number(params.rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { ok: false, statusCode: 400, error: 'Rating must be between 1 and 5.' };
  }

  const rev: V17ReviewRecord = {
    id: `V17-REV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    transactionId: tx.id,
    reviewerParticipantId: params.reviewerParticipantId,
    subjectParticipantId: subjectId,
    rating: Math.round(ratingNum * 10) / 10,
    comment: cleanText(params.comment),
    moderationStatus: 'VISIBLE',
    createdAt: new Date().toISOString(),
  };

  db.v17Reviews.set(rev.id, rev);
  const reputation = recomputeV17Reputation(subjectId);
  db.scheduleSave();
  return { ok: true, statusCode: 201, review: rev, reputation };
}

export function appealV17Review(params: {
  reviewId: string;
  appealNote: string;
  moderationStatus?: V17ReviewRecord['moderationStatus'];
}): { ok: boolean; statusCode: number; review?: V17ReviewRecord; error?: string } {
  const rev = db.v17Reviews.get(params.reviewId);
  if (!rev) return { ok: false, statusCode: 404, error: `Review ${params.reviewId} not found.` };
  rev.moderationStatus = params.moderationStatus || 'APPEALED';
  rev.appealNote = cleanText(params.appealNote);
  db.v17Reviews.set(rev.id, rev);
  db.scheduleSave();
  return { ok: true, statusCode: 200, review: rev };
}

export function recomputeV17Reputation(participantId: string): V17ReputationRecord {
  const participantReviews = Array.from(db.v17Reviews.values()).filter(
    (r: any) => r.subjectParticipantId === participantId && r.moderationStatus !== 'HIDDEN'
  );
  const participantTxs = Array.from(db.v17Transactions.values()).filter(
    (t: any) => (t.buyerId === participantId || t.sellerId === participantId) && ['COMPLETED', 'RECONCILED'].includes(t.state)
  );
  const participantDisputes = Array.from(db.v17Disputes.values()).filter(
    (d: any) => d.complainantId === participantId || d.respondentId === participantId
  );
  const evidenceVerified = participantTxs.filter(
    (t: any) => t.verificationTier !== 'PLATFORM_RECORDED'
  ).length;

  const avgRating =
    participantReviews.length > 0
      ? Number((participantReviews.reduce((s: number, r: any) => s + r.rating, 0) / participantReviews.length).toFixed(2))
      : 0;
  const disputeFrequencyPct =
    participantTxs.length > 0
      ? Number(((participantDisputes.length / participantTxs.length) * 100).toFixed(2))
      : 0;

  const rep: V17ReputationRecord = {
    participantId,
    completedTransactions: participantTxs.length,
    disputeCount: participantDisputes.length,
    averageRating: avgRating,
    evidenceVerifiedTransactions: evidenceVerified,
    disputeFrequencyPct,
    volumeNeutralNote: 'Reputation treats smallholder farmers and large enterprises equally using rate and verification quality, not raw transaction volume.',
    nonCreditScoringDisclaimer: 'Reputation & operational track record only — NOT a regulated credit score or financial underwriting decision.',
    updatedAt: new Date().toISOString(),
  };
  db.v17Reputations.set(participantId, rep);
  return rep;
}

// ==========================================
// 2. 11-STAGE DISPUTE RESOLUTION & COMMERCIAL TRUST
// ==========================================

const V17_DISPUTE_STAGES: V17DisputeStage[] = [
  '1_OPENED',
  '2_RESPONDED',
  '3_EVIDENCE_COLLECTED',
  '4_INITIAL_ASSESSMENT',
  '5_MEDIATION_PROPOSED',
  '6_PARTY_NEGOTIATION',
  '7_ADMIN_OR_COOP_REVIEW',
  '8_RESOLUTION_PROPOSED',
  '9_SETTLEMENT_OR_ADJUSTMENT',
  '10_APPEAL_REVIEW',
  '11_CLOSED',
];

export function openV17Dispute(params: {
  tenantId: string;
  transactionId: string;
  complainantId: string;
  reason: string;
  claimedAmount?: number;
}): { ok: boolean; statusCode: number; dispute?: V17DisputeRecord; error?: string } {
  const tx = db.v17Transactions.get(params.transactionId);
  if (!tx) return { ok: false, statusCode: 404, error: `Transaction ${params.transactionId} not found.` };
  const reason = cleanText(params.reason);
  if (!reason) return { ok: false, statusCode: 400, error: 'Dispute reason is required.' };

  const respondentId = params.complainantId === tx.buyerId ? tx.sellerId : tx.buyerId;
  const now = new Date().toISOString();
  const dispute: V17DisputeRecord = {
    id: `V17-DISP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    transactionId: tx.id,
    complainantId: cleanText(params.complainantId),
    respondentId,
    reason,
    claimedAmount: Number(params.claimedAmount ?? tx.amount),
    currency: tx.currency,
    stage: '1_OPENED',
    conflictOfInterestDeclared: false,
    evidenceIds: [],
    nonCourtDisclaimer: 'Structured platform dispute mediation only; preserves parties’ statutory rights and is NOT a judicial court order.',
    nonUnlicensedEscrowDisclaimer: 'ECONEX does not hold unlicensed escrow deposits; any monetary adjustment is executed via licensed PSP or reversing journal entry.',
    history: [{ stage: '1_OPENED', actorId: params.complainantId, note: reason, at: now }],
    openedAt: now,
  };

  db.v17Disputes.set(dispute.id, dispute);
  db.scheduleSave();
  return { ok: true, statusCode: 201, dispute };
}

export function advanceV17Dispute(params: {
  disputeId: string;
  targetStage: V17DisputeStage;
  actorId: string;
  note: string;
  assignedMediatorId?: string;
  conflictOfInterestDeclared?: boolean;
  resolutionProposal?: string;
  finalDecision?: string;
}): { ok: boolean; statusCode: number; dispute?: V17DisputeRecord; error?: string } {
  const d = db.v17Disputes.get(params.disputeId);
  if (!d) return { ok: false, statusCode: 404, error: `Dispute ${params.disputeId} not found.` };
  if (d.stage === '11_CLOSED') return { ok: false, statusCode: 409, error: 'Dispute is already 11_CLOSED.' };

  if (params.conflictOfInterestDeclared !== undefined) {
    d.conflictOfInterestDeclared = Boolean(params.conflictOfInterestDeclared);
  }
  if (params.assignedMediatorId) d.assignedMediatorId = cleanText(params.assignedMediatorId);

  if (d.conflictOfInterestDeclared && ['7_ADMIN_OR_COOP_REVIEW', '8_RESOLUTION_PROPOSED', '11_CLOSED'].includes(params.targetStage)) {
    return {
      ok: false,
      statusCode: 409,
      error: 'CONFLICT_OF_INTEREST_BLOCKED: Reassign an independent mediator before proposing resolution or closing dispute.',
    };
  }

  const curIdx = V17_DISPUTE_STAGES.indexOf(d.stage);
  const nextIdx = V17_DISPUTE_STAGES.indexOf(params.targetStage);
  if (nextIdx <= curIdx) {
    return {
      ok: false,
      statusCode: 409,
      error: `INVALID_DISPUTE_PROGRESSION: Cannot move from ${d.stage} to ${params.targetStage}.`,
    };
  }

  const now = new Date().toISOString();
  d.stage = params.targetStage;
  if (params.resolutionProposal) d.resolutionProposal = cleanText(params.resolutionProposal);
  if (params.finalDecision) d.finalDecision = cleanText(params.finalDecision);
  if (params.targetStage === '11_CLOSED') d.closedAt = now;
  d.history.push({ stage: params.targetStage, actorId: params.actorId, note: cleanText(params.note), at: now });
  db.v17Disputes.set(d.id, d);
  db.scheduleSave();
  return { ok: true, statusCode: 200, dispute: d };
}

// ==========================================
// 3. REGIONAL JURISDICTIONS, CORRIDORS & LOGISTICS (NO FAKE GPS)
// ==========================================

export function activateV17Jurisdiction(params: {
  countryCode: string;
  targetState: 'CONTROLLED_PILOT_SANDBOX' | 'PENDING_REVIEW' | 'INACTIVE';
  legalCounselApproved?: boolean;
  actorId: string;
}): { ok: boolean; statusCode: number; jurisdiction?: any; error?: string } {
  const code = cleanText(params.countryCode).toUpperCase();
  const jur = db.v17Jurisdictions.get(code);
  if (!jur) return { ok: false, statusCode: 404, error: `Jurisdiction ${code} not found.` };

  if (params.targetState === 'CONTROLLED_PILOT_SANDBOX' && !jur.complianceReviewCleared && !params.legalCounselApproved) {
    return {
      ok: false,
      statusCode: 409,
      error: `JURISDICTION_ACTIVATION_BLOCKED: ${code} cannot auto-activate without legal compliance review clearance.`,
    };
  }

  if (params.legalCounselApproved) jur.complianceReviewCleared = true;
  else if (params.targetState === 'INACTIVE') jur.complianceReviewCleared = false;
  jur.activationState = params.targetState;
  jur.updatedAt = new Date().toISOString();
  db.v17Jurisdictions.set(code, jur);
  db.scheduleSave();
  return { ok: true, statusCode: 200, jurisdiction: jur };
}

export function createV17LogisticsShipment(params: {
  tenantId: string;
  transactionId: string;
  corridorId?: string;
  carrierParticipantId: string;
  transportMode: V17LogisticsShipment['transportMode'];
  originLocation: string;
  destinationLocation: string;
  offlineSubmitted?: boolean;
}): { ok: boolean; statusCode: number; shipment?: V17LogisticsShipment; error?: string } {
  if (!params.transactionId || !params.originLocation || !params.destinationLocation) {
    return { ok: false, statusCode: 400, error: 'transactionId, originLocation, and destinationLocation are required.' };
  }
  const ship: V17LogisticsShipment = {
    id: `V17-SHIP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    transactionId: cleanText(params.transactionId),
    corridorId: params.corridorId,
    carrierParticipantId: cleanText(params.carrierParticipantId || 'V17-PART-LOG-01'),
    transportMode: params.transportMode || 'TRUCK',
    originLocation: cleanText(params.originLocation),
    destinationLocation: cleanText(params.destinationLocation),
    status: 'DISPATCHED',
    offlineSubmitted: Boolean(params.offlineSubmitted),
    hasFakeGpsCoordinates: false,
    updatedAt: new Date().toISOString(),
  };
  db.v17LogisticsShipments.set(ship.id, ship);
  db.scheduleSave();
  return { ok: true, statusCode: 201, shipment: ship };
}

export function updateV17LogisticsShipmentStatus(params: {
  shipmentId: string;
  status: V17LogisticsShipment['status'];
  proofRef?: string;
  offlineSubmitted?: boolean;
}): { ok: boolean; statusCode: number; shipment?: V17LogisticsShipment; error?: string } {
  const ship = db.v17LogisticsShipments.get(params.shipmentId);
  if (!ship) return { ok: false, statusCode: 404, error: `Shipment ${params.shipmentId} not found.` };
  ship.status = params.status;
  if (params.proofRef) ship.proofRef = cleanText(params.proofRef);
  if (params.offlineSubmitted !== undefined) ship.offlineSubmitted = Boolean(params.offlineSubmitted);
  ship.hasFakeGpsCoordinates = false;
  ship.updatedAt = new Date().toISOString();
  db.v17LogisticsShipments.set(ship.id, ship);
  db.scheduleSave();
  return { ok: true, statusCode: 200, shipment: ship };
}

// ==========================================
// 4. COOPERATIVE WORKSPACES (MEMBER PRIVACY + NON-DEPOSIT DISCLAIMER)
// ==========================================

export function getV17CooperativeDetail(coopId: string, isAdminOrCoopManager: boolean) {
  const coop = db.v17Cooperatives.get(coopId);
  if (!coop) return null;
  const memberships = Array.from(db.v17CooperativeMemberships.values()).filter((m: any) => m.cooperativeId === coopId);
  const activities = Array.from(db.v17CooperativeActivities.values()).filter((a: any) => a.cooperativeId === coopId);

  const visibleMembers = memberships.map((m: V17CooperativeMembership) => {
    const canShowIdentity = isAdminOrCoopManager || (coop.memberPrivacyMode === 'MEMBER_CONSENTED' && m.consentToShareProfile);
    const p = db.v17Participants.get(m.participantId);
    return {
      id: m.id,
      cooperativeId: m.cooperativeId,
      participantRef: canShowIdentity ? m.participantId : 'REDACTED_MEMBER_PRIVACY',
      displayName: canShowIdentity ? p?.displayName || 'Member' : 'Protected Cooperative Member',
      producedKgAggregated: m.producedKgAggregated,
      status: m.status,
      consentToShareProfile: m.consentToShareProfile,
    };
  });

  const totalAggregatedKg = memberships.reduce((sum: number, m: any) => sum + Number(m.producedKgAggregated || 0), 0);

  return {
    cooperative: coop,
    memberCount: memberships.length,
    totalAggregatedKg,
    members: visibleMembers,
    activities,
  };
}

export function recordV17CooperativeActivity(params: {
  cooperativeId: string;
  activityType: V17CooperativeActivity['activityType'];
  title: string;
  totalQty: number;
  unitCode: V17CooperativeActivity['unitCode'];
  currency?: string;
  totalAmount: number;
}): { ok: boolean; statusCode: number; activity?: V17CooperativeActivity; error?: string } {
  if (!db.v17Cooperatives.has(params.cooperativeId)) {
    return { ok: false, statusCode: 404, error: `Cooperative ${params.cooperativeId} not found.` };
  }
  const act: V17CooperativeActivity = {
    id: `V17-CACT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    cooperativeId: params.cooperativeId,
    activityType: params.activityType,
    title: cleanText(params.title),
    totalQty: Number(params.totalQty),
    unitCode: params.unitCode || 'KG',
    currency: cleanText(params.currency || 'UGX').toUpperCase(),
    totalAmount: Number(params.totalAmount),
    recordedAt: new Date().toISOString(),
  };
  db.v17CooperativeActivities.set(act.id, act);
  db.scheduleSave();
  return { ok: true, statusCode: 201, activity: act };
}

// ==========================================
// 5. RECONCILIATION CASES & NON-DESTRUCTIVE REVERSING ENTRIES
// ==========================================

export function openV17ReconciliationCase(params: {
  tenantId: string;
  transactionId: string;
  currency?: string;
  expectedAmount: number;
  providerReportedAmount: number;
  causeCategory: V17ReconciliationCase['causeCategory'];
}): { ok: boolean; statusCode: number; reconCase?: V17ReconciliationCase; error?: string } {
  const tx = db.v17Transactions.get(params.transactionId);
  if (!tx) return { ok: false, statusCode: 404, error: `Transaction ${params.transactionId} not found.` };
  const expected = Number(params.expectedAmount);
  const reported = Number(params.providerReportedAmount);
  const variance = Number((reported - expected).toFixed(2));
  const rc: V17ReconciliationCase = {
    id: `V17-RECON-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    transactionId: tx.id,
    currency: cleanText(params.currency || tx.currency).toUpperCase(),
    expectedAmount: expected,
    providerReportedAmount: reported,
    varianceAmount: variance,
    causeCategory: params.causeCategory || 'FEE_MISMATCH',
    status: 'OPEN',
    openedAt: new Date().toISOString(),
  };
  db.v17ReconciliationCases.set(rc.id, rc);
  db.scheduleSave();
  return { ok: true, statusCode: 201, reconCase: rc };
}

export function resolveV17ReconciliationCase(params: {
  caseId: string;
  actorId: string;
  postCorrectingJournalEntry?: boolean;
}): { ok: boolean; statusCode: number; reconCase?: V17ReconciliationCase; error?: string } {
  const rc = db.v17ReconciliationCases.get(params.caseId);
  if (!rc) return { ok: false, statusCode: 404, error: `Reconciliation case ${params.caseId} not found.` };
  if (rc.status === 'RESOLVED') return { ok: false, statusCode: 409, error: 'Reconciliation case already RESOLVED.' };

  const now = new Date().toISOString();
  if (params.postCorrectingJournalEntry && rc.varianceAmount !== 0) {
    const absAmt = Math.abs(rc.varianceAmount);
    const entryId = `JRN-V17-REV-${Date.now().toString(36).toUpperCase()}`;
    const rateToUgx = rc.currency === 'KES' ? 28.5 : rc.currency === 'USD' ? 3720 : 1;
    const baseAmountUgx = Math.round(absAmt * rateToUgx);
    db.universalJournal.set(entryId, {
      id: entryId,
      entryNumber: `UJ-V17-${db.universalJournal.size + 1}`,
      timestamp: now,
      period: now.slice(0, 7),
      referenceType: 'ADJUSTMENT',
      referenceId: rc.transactionId,
      lines: [
        {
          id: `${entryId}-L1`,
          accountId: 'COA-1010',
          accountNumber: '1010',
          accountName: 'Settlement Clearing',
          direction: 'DEBIT',
          amount: absAmt,
          currency: rc.currency,
          exchangeRateToUGX: rateToUgx,
          baseAmountUGX: baseAmountUgx,
          memo: `V17 clearing adjustment for ${rc.id} (${rc.causeCategory})`,
        },
        {
          id: `${entryId}-L2`,
          accountId: 'COA-2090',
          accountNumber: '2090',
          accountName: 'Reconciliation Variance Adjustment',
          direction: 'CREDIT',
          amount: absAmt,
          currency: rc.currency,
          exchangeRateToUGX: rateToUgx,
          baseAmountUGX: baseAmountUgx,
          memo: `V17 variance offset for ${rc.id} (${rc.causeCategory})`,
        },
      ],
      totalDebitUGX: baseAmountUgx,
      totalCreditUGX: baseAmountUgx,
      isBalanced: true,
      isPosted: true,
      postedBy: params.actorId,
      auditHash: sha256Hex(`${entryId}:${rc.transactionId}:${baseAmountUgx}:${now}`),
    });
    rc.correctingJournalEntryId = entryId;
    rc.status = 'REVERSAL_POSTED';
  } else {
    rc.status = 'RESOLVED';
  }
  rc.resolvedBy = params.actorId;
  rc.resolvedAt = now;
  db.v17ReconciliationCases.set(rc.id, rc);
  db.scheduleSave();
  return { ok: true, statusCode: 200, reconCase: rc };
}

// ==========================================
// 6. COMMERCIAL BILLING & REVENUE TRUTH (PER-CURRENCY SEPARATED)
// ==========================================

export function recordV17NetworkBilling(params: {
  tenantId: string;
  transactionId: string;
  currency?: string;
  grossTransactionValue: number;
  providerFeeAmount?: number;
  taxAmount?: number;
  refundAmount?: number;
  platformServiceFeeAmount?: number;
  exemptPublicService?: boolean;
  settlementMatched?: boolean;
}): V17NetworkBillingRecord {
  const gross = Number(params.grossTransactionValue || 0);
  const fee = params.exemptPublicService ? 0 : Number(params.platformServiceFeeAmount ?? 0);
  const matched = Boolean(params.settlementMatched);

  const rec: V17NetworkBillingRecord = {
    id: `V17-BILL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    tenantId: cleanText(params.tenantId),
    transactionId: cleanText(params.transactionId),
    currency: cleanText(params.currency || 'UGX').toUpperCase(),
    grossTransactionValue: gross,
    providerFeeAmount: Number(params.providerFeeAmount || 0),
    taxAmount: Number(params.taxAmount || 0),
    refundAmount: Number(params.refundAmount || 0),
    platformServiceFeeAmount: fee,
    collectedPlatformRevenue: matched ? fee : 0,
    platformReceivableAmount: matched ? 0 : fee,
    exemptPublicService: Boolean(params.exemptPublicService),
    settlementMatched: matched,
    recordedAt: new Date().toISOString(),
  };

  db.v17NetworkBillingRecords.set(rec.id, rec);
  db.scheduleSave();
  return rec;
}

export function getV17BillingSummary() {
  const records = Array.from(db.v17NetworkBillingRecords.values()) as V17NetworkBillingRecord[];
  const byCurrency: Record<
    string,
    {
      grossTransactionValue: number;
      providerFeeAmount: number;
      taxAmount: number;
      refundAmount: number;
      platformServiceFeeAmount: number;
      collectedPlatformRevenue: number;
      platformReceivableAmount: number;
    }
  > = {};

  for (const r of records) {
    if (!byCurrency[r.currency]) {
      byCurrency[r.currency] = {
        grossTransactionValue: 0,
        providerFeeAmount: 0,
        taxAmount: 0,
        refundAmount: 0,
        platformServiceFeeAmount: 0,
        collectedPlatformRevenue: 0,
        platformReceivableAmount: 0,
      };
    }
    const bucket = byCurrency[r.currency];
    bucket.grossTransactionValue += r.grossTransactionValue;
    bucket.providerFeeAmount += r.providerFeeAmount;
    bucket.taxAmount += r.taxAmount;
    bucket.refundAmount += r.refundAmount;
    bucket.platformServiceFeeAmount += r.platformServiceFeeAmount;
    bucket.collectedPlatformRevenue += r.collectedPlatformRevenue;
    bucket.platformReceivableAmount += r.platformReceivableAmount;
  }

  return {
    recordsCount: records.length,
    byCurrency,
    nonConflationDisclosure:
      'Gross PSP transaction flow is strictly separated from platform service fee, provider pass-through fees, taxes, refunds, and actually collected revenue. Multi-currency totals are never mixed.',
    records,
  };
}

// ==========================================
// 7. DUAL-AUTHORIZATION GOVERNANCE & DATA PRIVACY
// ==========================================

export function requestV17PolicyApproval(params: {
  policyId: string;
  actionRequested: string;
  requestedBy: string;
  targetTenantId?: string;
}): { ok: boolean; statusCode: number; approval?: V17PolicyApproval; error?: string } {
  const pol = db.v17GovernancePolicies.get(params.policyId);
  if (!pol) return { ok: false, statusCode: 404, error: `Policy ${params.policyId} not found.` };

  const approval: V17PolicyApproval = {
    id: `V17-APR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    policyId: pol.id,
    actionRequested: cleanText(params.actionRequested),
    requestedBy: cleanText(params.requestedBy),
    firstApprovedBy: cleanText(params.requestedBy),
    status: 'PENDING_SECOND_APPROVAL',
    createdAt: new Date().toISOString(),
  };
  db.v17PolicyApprovals.set(approval.id, approval);
  db.scheduleSave();
  return { ok: true, statusCode: 201, approval };
}

export function decideV17PolicyApproval(params: {
  approvalId: string;
  decision: 'APPROVED' | 'REJECTED';
  secondApproverId: string;
}): { ok: boolean; statusCode: number; approval?: V17PolicyApproval; error?: string } {
  const apr = db.v17PolicyApprovals.get(params.approvalId);
  if (!apr) return { ok: false, statusCode: 404, error: `Approval ${params.approvalId} not found.` };
  if (apr.status !== 'PENDING_SECOND_APPROVAL') return { ok: false, statusCode: 409, error: `Already decided (${apr.status}).` };

  if (apr.requestedBy === params.secondApproverId || apr.firstApprovedBy === params.secondApproverId) {
    return {
      ok: false,
      statusCode: 403,
      error: 'DUAL_AUTH_VIOLATION: Same administrator cannot self-approve a dual-authorization governance action.',
    };
  }

  apr.secondApprovedBy = cleanText(params.secondApproverId);
  apr.status = params.decision;
  apr.decidedAt = new Date().toISOString();
  db.v17PolicyApprovals.set(apr.id, apr);
  db.scheduleSave();

  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'UG',
    actorId: params.secondApproverId,
    actorRole: 'PLATFORM_ADMIN',
    actionType: 'DUAL_AUTH_POLICY_DECISION',
    entityType: 'V17_POLICY_APPROVAL',
    entityId: apr.id,
    details: `Dual-auth ${apr.status} by second approver ${params.secondApproverId}.`,
  });
  return { ok: true, statusCode: 200, approval: apr };
}

export function createV17PrivacyRequest(params: {
  participantId: string;
  requestType: V17DataPrivacyRequest['requestType'];
}): V17DataPrivacyRequest {
  const participant = db.v17Participants.get(params.participantId);
  const now = new Date().toISOString();
  const reqObj: V17DataPrivacyRequest = {
    id: `V17-PRIV-${Date.now().toString(36).toUpperCase()}`,
    participantId: cleanText(params.participantId),
    requestType: params.requestType,
    status: params.requestType === 'DATA_EXPORT' ? 'COMPLETED' : 'IN_REVIEW',
    exportedPayloadSummary:
      params.requestType === 'DATA_EXPORT'
        ? {
            participantFound: Boolean(participant),
            displayName: participant?.displayName || null,
            countryCode: participant?.countryCode || null,
            consentVersion: participant?.consentVersion || null,
            transactionsCount: Array.from(db.v17Transactions.values()).filter(
              (t: any) => t.buyerId === params.participantId || t.sellerId === params.participantId
            ).length,
            secretsRedacted: true,
          }
        : undefined,
    createdAt: now,
    completedAt: params.requestType === 'DATA_EXPORT' ? now : undefined,
  };
  db.v17DataPrivacyRequests.set(reqObj.id, reqObj);
  db.scheduleSave();
  return reqObj;
}

// ==========================================
// 8. REAL-DATA ECONOMIC INTELLIGENCE & IMPACT MEASUREMENT
// ==========================================

export function computeV17EconomicIntelligence() {
  const participants = Array.from(db.v17Participants.values()) as any[];
  const orgs = Array.from(db.v17Organizations.values()) as any[];
  const listings = Array.from(db.v17CommercialListings.values()) as any[];
  const txs = Array.from(db.v17Transactions.values()) as any[];
  const evidences = Array.from(db.v17TransactionEvidences.values()) as any[];
  const disputes = Array.from(db.v17Disputes.values()) as any[];
  const shipments = Array.from(db.v17LogisticsShipments.values()) as any[];
  const billing = getV17BillingSummary();

  const txFunnelByCurrency: Record<
    string,
    {
      orderedValue: number;
      providerVerifiedValue: number;
      deliveryConfirmedValue: number;
      reconciledValue: number;
    }
  > = {};

  for (const t of txs) {
    if (!txFunnelByCurrency[t.currency]) {
      txFunnelByCurrency[t.currency] = {
        orderedValue: 0,
        providerVerifiedValue: 0,
        deliveryConfirmedValue: 0,
        reconciledValue: 0,
      };
    }
    const b = txFunnelByCurrency[t.currency];
    b.orderedValue += t.amount;
    if (['PROVIDER_CONFIRMED', 'DELIVERY_CONFIRMED', 'RECONCILED', 'INDEPENDENTLY_REVIEWED'].includes(t.verificationTier)) {
      b.providerVerifiedValue += t.amount;
    }
    if (['DELIVERY_CONFIRMED', 'RECONCILED', 'INDEPENDENTLY_REVIEWED'].includes(t.verificationTier)) {
      b.deliveryConfirmedValue += t.amount;
    }
    if (t.state === 'RECONCILED') {
      b.reconciledValue += t.amount;
    }
  }

  const evidenceBackedCount = txs.filter((t) => evidences.some((e) => e.transactionId === t.id)).length;
  const completedCount = txs.filter((t) => ['COMPLETED', 'RECONCILED'].includes(t.state)).length;
  const activeUgPilotUsers = db.v16PilotConsents.size;
  const usabilitySessionsLogged = db.v16UsabilitySessions.size;

  return {
    product: 'ECONEX',
    releaseVersion: 'V17.0-VERIFIED-ECONOMIC-NETWORK-OPERATIONS',
    metrics: {
      registeredParticipants: participants.length,
      registeredOrganizations: orgs.length,
      activeListings: listings.filter((l) => l.status === 'ACTIVE').length,
      totalTransactions: txs.length,
      completedOrReconciledTransactions: completedCount,
      evidenceBackedTransactions: evidenceBackedCount,
      openDisputes: disputes.filter((d) => d.stage !== '11_CLOSED').length,
      closedDisputes: disputes.filter((d) => d.stage === '11_CLOSED').length,
      shipmentsTracked: shipments.length,
      ugandaPilotConsentedParticipants: activeUgPilotUsers,
      usabilitySessionsStatus: usabilitySessionsLogged === 0 ? 'NOT_CONDUCTED' : `${usabilitySessionsLogged}_CONDUCTED`,
    },
    txFunnelByCurrency,
    billingByCurrency: billing.byCurrency,
    methodologyDisclosure:
      'All V17 economic intelligence metrics count only observed database records, strictly separate currencies, and distinguish platform-recorded orders from provider-verified and reconciled settlements.',
    computedAt: new Date().toISOString(),
  };
}
