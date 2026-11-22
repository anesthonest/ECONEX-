/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V21.0 - Controlled Pilot Deployment, Onboarding, Field Ops & Monitoring Engine
 * Connects directly to V20 marketplace, trade, logistics, reconciliation, cooperative, and conflict engines.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import { processV20OfflineSync, recomputePilotMetrics } from './v20Engine.ts';
import type {
  V21AuditEntry,
  V21FieldActivityRecord,
  V21FieldOfficerTask,
  V21FieldTaskStatus,
  V21MetricDefinition,
  V21OperationalException,
  V21ParticipantCategory,
  V21ParticipantOnboarding,
  V21PilotLifecycleState,
  V21PilotRecord,
  V21SupportRequest,
  V21VerificationStatus,
} from '../types/index.ts';

function cleanText(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

function sha(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export const ALL_V21_PARTICIPANT_CATEGORIES: V21ParticipantCategory[] = [
  'INDIVIDUAL',
  'FARMER',
  'BUYER_TRADER',
  'SME_BUSINESS',
  'COOPERATIVE',
  'AGRO_DEALER',
  'LOGISTICS_OPERATOR',
  'SERVICE_PROVIDER',
  'INSTITUTIONAL',
  'FIELD_OFFICER',
];

export const ALL_V21_VERIFICATION_STATUSES: V21VerificationStatus[] = [
  'UNVERIFIED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
  'EXPIRED',
];

// ==========================================
// 1. PILOT LIFECYCLE & MEASURABLE EVIDENCE ENGINE
// ==========================================

const PILOT_ALLOWED_TRANSITIONS: Record<V21PilotLifecycleState, V21PilotLifecycleState[]> = {
  DRAFT: ['CONFIGURED', 'CANCELLED'],
  CONFIGURED: ['APPROVAL_PENDING', 'DRAFT', 'CANCELLED'],
  APPROVAL_PENDING: ['APPROVED', 'CONFIGURED', 'CANCELLED'],
  APPROVED: ['READY', 'PAUSED', 'CANCELLED'],
  READY: ['ACTIVE', 'PAUSED', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'SUSPENDED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function recomputeV21PilotMetrics(pilot: V21PilotRecord): V21PilotRecord {
  const onboardings = Array.from(db.v21Onboardings.values()).filter((o) => o.pilotId === pilot.id);
  const verifiedCount = onboardings.filter((o) => o.verificationStatus === 'VERIFIED').length;
  const orgIds = new Set(onboardings.map((o) => o.organizationId).filter(Boolean));
  pilot.participatingOrganizationIds.forEach((id) => orgIds.add(id));

  const trades = Array.from(db.v20Trades.values()).filter((t) => t.tenantId === pilot.tenantId);
  const liveTrades = trades.filter((t) => !t.isTestRecord);
  const testTrades = trades.filter((t) => t.isTestRecord);
  const activeTrades = liveTrades.filter((t) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(t.stage));
  const completedTrades = liveTrades.filter((t) => t.stage === 'COMPLETED');
  const realizedVolumeUgx = completedTrades.reduce((acc, t) => acc + Number(t.baseUgxEquivalent || 0), 0);

  const obligations = Array.from(db.v20PaymentObligations.values()).filter((o) => o.tenantId === pilot.tenantId);
  const liveObs = obligations.filter((o) => !o.isTestRecord);
  const testObs = obligations.filter((o) => o.isTestRecord);
  const reconciledObs = liveObs.filter((o) => o.status === 'RECONCILED');
  const sandboxVolumeUgx = reconciledObs.reduce((acc, o) => acc + Number(o.receivedAmount || 0), 0);

  const shipments = Array.from(db.v20Shipments.values()).filter((s) => s.tenantId === pilot.tenantId);
  const completedDeliveries = shipments.filter((s) => ['DELIVERY_CONFIRMED', 'COMPLETED'].includes(s.status)).length;

  const disputes = Array.from(db.v17Disputes.values()).filter((d) => d.tenantId === pilot.tenantId);
  const resolvedDisputes = disputes.filter((d) => ['8_RESOLUTION_PROPOSED', '9_SETTLEMENT_OR_ADJUSTMENT', '11_CLOSED'].includes(d.stage)).length;

  const fieldRecords = Array.from(db.v21FieldRecords.values()).filter((r) => r.pilotId === pilot.id);
  const syncedRecords = fieldRecords.filter((r) => r.syncStatus === 'SYNCED').length;
  const syncSuccessPct = fieldRecords.length > 0 ? Math.round((syncedRecords / fieldRecords.length) * 100) : 100;

  const listingsCount = Array.from(db.v17CommercialListings.values()).filter((l) => l.tenantId === pilot.tenantId && l.status === 'ACTIVE').length;
  const enquiriesCount = liveTrades.filter((t) => t.stageHistory.some((h) => h.stage === 'ENQUIRY')).length;
  const quotationsCount = liveTrades.filter((t) => t.stageHistory.some((h) => h.stage === 'QUOTATION')).length;
  const agreementsCount = liveTrades.filter((t) => t.stageHistory.some((h) => h.stage === 'AGREEMENT_CREATED')).length;
  const failedOrAbandoned = liveTrades.filter((t) => ['CANCELLED', 'REJECTED'].includes(t.stage)).length;

  pilot.separatedSummary.actual = {
    onboardedParticipants: onboardings.length,
    verifiedParticipants: verifiedCount,
    organizationsOnboarded: orgIds.size,
    activeListings: listingsCount,
    activeTrades: activeTrades.length,
    completedTrades: completedTrades.length,
    realizedTradeVolumeUgx: realizedVolumeUgx,
    reconciledObligationsCount: reconciledObs.length,
    deliveriesCompleted: completedDeliveries,
    disputesOpened: disputes.length,
    disputesResolved: resolvedDisputes,
  };
  pilot.separatedSummary.simulated = {
    sandboxPaymentsCount: reconciledObs.length,
    sandboxPaymentVolumeUgx: sandboxVolumeUgx,
  };
  pilot.separatedSummary.test = {
    testTradesCount: testTrades.length,
    testObligationsCount: testObs.length,
  };

  const geoScope = `${pilot.geography.countryCode} / ${pilot.geography.region} / ${pilot.geography.district}`;
  const period = `${pilot.startDate.slice(0, 10)} to ${pilot.endDate.slice(0, 10)}`;

  const kpis: V21MetricDefinition[] = [
    {
      key: 'participants_registered',
      label: 'Participants Registered',
      value: onboardings.length,
      unit: 'participants',
      definition: 'Count of onboarding records bound to this pilot.',
      sourceRecord: 'v21Onboardings',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(v21Onboardings WHERE pilotId = pilot.id)',
    },
    {
      key: 'participants_verified',
      label: 'Participants Verified',
      value: verifiedCount,
      unit: 'participants',
      definition: 'Participants independently approved to VERIFIED state.',
      sourceRecord: 'v21Onboardings',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(v21Onboardings WHERE verificationStatus = VERIFIED)',
    },
    {
      key: 'organizations_onboarded',
      label: 'Organisations Onboarded',
      value: orgIds.size,
      unit: 'organisations',
      definition: 'Distinct participating SMEs, cooperatives, and institutional bodies.',
      sourceRecord: 'v21Pilots + v21Onboardings',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(DISTINCT organizationId)',
    },
    {
      key: 'listings_published',
      label: 'Active Marketplace Listings',
      value: listingsCount,
      unit: 'listings',
      definition: 'Active commercial supply/demand listings in pilot tenant.',
      sourceRecord: 'v17CommercialListings',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(v17CommercialListings WHERE status = ACTIVE)',
    },
    {
      key: 'enquiries_quotations_agreements',
      label: 'Agreements Accepted',
      value: agreementsCount,
      unit: 'agreements',
      definition: `Enquiries=${enquiriesCount}, Quotations=${quotationsCount}, Agreements=${agreementsCount} (non-test).`,
      sourceRecord: 'v20Trades',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(v20Trades WHERE !isTestRecord AND stageHistory contains AGREEMENT_CREATED)',
    },
    {
      key: 'deliveries_completed',
      label: 'Deliveries Confirmed/Completed',
      value: completedDeliveries,
      unit: 'shipments',
      definition: 'Shipments with confirmed delivery proof or completion.',
      sourceRecord: 'v20Shipments',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(v20Shipments WHERE status IN (DELIVERY_CONFIRMED, COMPLETED))',
    },
    {
      key: 'reconciled_volume_ugx',
      label: 'Verified Commercial Trade Value (Live/Non-Test)',
      value: realizedVolumeUgx,
      unit: 'UGX_EQUIV',
      definition: 'Sum of non-test COMPLETED trade totals in base UGX equivalent (internal commercial record, NOT external bank proof).',
      sourceRecord: 'v20Trades',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'SUM(baseUgxEquivalent WHERE !isTestRecord AND stage = COMPLETED)',
    },
    {
      key: 'sandbox_reconciliation_ugx',
      label: 'Sandbox Payment Reconciliation Volume',
      value: sandboxVolumeUgx,
      unit: 'UGX',
      definition: 'Simulated sandbox payment records matched against obligations.',
      sourceRecord: 'v20PaymentObligations',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'SIMULATED',
      calculationMethod: 'SUM(receivedAmount WHERE !isTestRecord AND status = RECONCILED)',
    },
    {
      key: 'test_trades_excluded',
      label: 'Verification Test Trades (Isolated)',
      value: testTrades.length,
      unit: 'trades',
      definition: 'Automated test/verification trades excluded from actual pilot volume.',
      sourceRecord: 'v20Trades',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'TEST',
      calculationMethod: 'COUNT(v20Trades WHERE isTestRecord = true)',
    },
    {
      key: 'disputes_opened_resolved',
      label: 'Disputes Resolved / Total',
      value: disputes.length > 0 ? Math.round((resolvedDisputes / disputes.length) * 100) : 100,
      unit: 'percent',
      definition: `${resolvedDisputes} resolved out of ${disputes.length} opened disputes.`,
      sourceRecord: 'v17Disputes',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'resolvedDisputes / totalDisputes * 100',
    },
    {
      key: 'failed_abandoned_workflows',
      label: 'Failed / Abandoned Commercial Workflows',
      value: failedOrAbandoned,
      unit: 'trades',
      definition: 'Trades ending in CANCELLED or REJECTED.',
      sourceRecord: 'v20Trades',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(v20Trades WHERE !isTestRecord AND stage IN (CANCELLED, REJECTED))',
    },
    {
      key: 'offline_sync_success_rate',
      label: 'Offline Field Sync Success Rate',
      value: syncSuccessPct,
      unit: 'percent',
      definition: 'Percentage of field-captured offline records synchronized cleanly.',
      sourceRecord: 'v21FieldRecords',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'ACTUAL',
      calculationMethod: 'COUNT(SYNCED) / COUNT(ALL_FIELD_RECORDS) * 100',
    },
    {
      key: 'farmer_income_impact',
      label: 'Household Income Change (External Survey Required)',
      value: null,
      unit: 'PENDING_MEASUREMENT',
      definition: 'Cannot be inferred from platform transactions alone; requires independent baseline & endline household survey.',
      sourceRecord: 'EXTERNAL_SURVEY_REQUIRED',
      timePeriod: period,
      geographicScope: geoScope,
      pilotId: pilot.id,
      classification: 'PENDING_EXTERNAL_SURVEY',
      calculationMethod: 'PENDING_EXTERNAL_FIELD_EVALUATION',
    },
  ];
  pilot.performanceIndicators = kpis;
  pilot.updatedAt = new Date().toISOString();
  db.v21Pilots.set(pilot.id, pilot);
  return pilot;
}

export function transitionV21Pilot(params: {
  pilotId: string;
  targetState: V21PilotLifecycleState;
  actorId: string;
  actorRole: string;
  reason?: string;
  closureSummary?: string;
}): { ok: boolean; statusCode: number; pilot?: V21PilotRecord; error?: string } {
  const pilot = db.v21Pilots.get(params.pilotId);
  if (!pilot) return { ok: false, statusCode: 404, error: `Pilot ${params.pilotId} not found.` };

  const allowed = PILOT_ALLOWED_TRANSITIONS[pilot.status] || [];
  if (!allowed.includes(params.targetState)) {
    return {
      ok: false,
      statusCode: 409,
      error: `INVALID_PILOT_TRANSITION: Cannot move pilot from ${pilot.status} to ${params.targetState}. Allowed: [${allowed.join(', ')}]`,
    };
  }

  const now = new Date().toISOString();
  const prev = pilot.status;
  pilot.status = params.targetState;
  pilot.statusReason = cleanText(params.reason || `Transitioned to ${params.targetState}`);
  pilot.auditHistory.push({
    id: uid('AUD-PLT'),
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: 'PILOT_LIFECYCLE_TRANSITION',
    fromState: prev,
    toState: params.targetState,
    note: pilot.statusReason,
    timestamp: now,
    immutableHash: sha(`${pilot.id}|${prev}|${params.targetState}|${params.actorId}|${now}`),
  });

  recomputeV21PilotMetrics(pilot);

  if (params.targetState === 'COMPLETED') {
    const summaryText =
      cleanText(params.closureSummary) ||
      `Controlled closure report for ${pilot.name}: ${pilot.separatedSummary.actual.onboardedParticipants} onboarded, ${pilot.separatedSummary.actual.completedTrades} completed non-test trades (${pilot.separatedSummary.actual.realizedTradeVolumeUgx} UGX equiv).`;
    pilot.closureReport = {
      closedBy: params.actorId,
      closedAt: now,
      summary: summaryText,
      lessonsLearned: [
        'Independent admin review strictly kept separate from initial participant registration.',
        'Offline sync conflict queue prevented silent overwrites during intermittent connectivity.',
      ],
      pendingExternalOutcomeNotes: [
        'Long-term farmer income, poverty reduction, and consumer price effects require independent external survey.',
      ],
      reportChecksumSha256: sha(`${pilot.id}|${summaryText}|${now}`),
    };
  }

  db.v21Pilots.set(pilot.id, pilot);
  logIntelligenceAudit({
    tenantId: pilot.tenantId,
    jurisdiction: pilot.geography.countryCode,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'V21_PILOT_LIFECYCLE',
    entityType: 'V21_PILOT',
    entityId: pilot.id,
    details: `Pilot ${pilot.code} (${prev} -> ${params.targetState}): ${pilot.statusReason}`,
  });
  db.scheduleSave();
  return { ok: true, statusCode: 200, pilot };
}

// ==========================================
// 2. PARTICIPANT ONBOARDING & 7-STATE VERIFICATION
// ==========================================

const CATEGORY_DEFAULT_PERMS: Record<V21ParticipantCategory, string[]> = {
  INDIVIDUAL: ['BROWSE_MARKETPLACE', 'CREATE_ENQUIRY'],
  FARMER: ['LIST_PRODUCE', 'RESPOND_ENQUIRY', 'CONTRIBUTE_POOL', 'SUBMIT_EVIDENCE'],
  BUYER_TRADER: ['CREATE_ENQUIRY', 'ACCEPT_AGREEMENT', 'CONFIRM_DELIVERY'],
  SME_BUSINESS: ['LIST_PRODUCE', 'CREATE_ENQUIRY', 'ISSUE_QUOTATION', 'ACCEPT_AGREEMENT'],
  COOPERATIVE: ['MANAGE_POOL', 'AGGREGATE_PRODUCE', 'ISSUE_QUOTATION', 'BULK_TRADE'],
  AGRO_DEALER: ['LIST_INPUTS', 'ISSUE_QUOTATION', 'REDEEM_VOUCHER_RECORD'],
  LOGISTICS_OPERATOR: ['ACCEPT_SHIPMENT', 'UPDATE_ROUTE', 'SUBMIT_DELIVERY_EVIDENCE'],
  SERVICE_PROVIDER: ['LIST_SERVICES', 'ISSUE_QUOTATION', 'SUBMIT_SERVICE_PROOF'],
  INSTITUTIONAL: ['VIEW_COMPLIANCE_SUMMARY', 'ISSUE_PROCUREMENT_TENDER'],
  FIELD_OFFICER: ['CAPTURE_FIELD_FORM', 'ASSIST_PARTICIPANT', 'UPDATE_ASSIGNED_TASK'],
};

export function createV21Onboarding(params: {
  tenantId: string;
  pilotId: string;
  userId: string;
  fullName: string;
  phone: string;
  preferredLanguage?: string;
  category: V21ParticipantCategory;
  organizationId?: string;
  organizationName?: string;
  geography: Partial<V21ParticipantOnboarding['geography']>;
  consentAccepted: boolean;
  documentType?: string;
  documentReference?: string;
}): { ok: boolean; statusCode: number; onboarding?: V21ParticipantOnboarding; error?: string } {
  const pilot = db.v21Pilots.get(params.pilotId);
  if (!pilot) return { ok: false, statusCode: 404, error: `Pilot ${params.pilotId} not found.` };
  if (['COMPLETED', 'CANCELLED', 'SUSPENDED'].includes(pilot.status)) {
    return { ok: false, statusCode: 409, error: `PILOT_NOT_ACCEPTING_ONBOARDING: Pilot is ${pilot.status}.` };
  }
  const existingForPilot = Array.from(db.v21Onboardings.values()).filter((o) => o.pilotId === pilot.id).length;
  if (existingForPilot >= pilot.maxParticipantsLimit) {
    return { ok: false, statusCode: 409, error: 'PILOT_PARTICIPATION_LIMIT_REACHED' };
  }
  if (!params.consentAccepted) {
    return { ok: false, statusCode: 400, error: 'CONSENT_REQUIRED: Privacy notice and consent must be accepted explicitly.' };
  }
  const fullName = cleanText(params.fullName);
  const phone = cleanText(params.phone);
  if (!fullName || !phone) {
    return { ok: false, statusCode: 400, error: 'fullName and phone are required.' };
  }
  if (!ALL_V21_PARTICIPANT_CATEGORIES.includes(params.category)) {
    return { ok: false, statusCode: 400, error: `Unsupported participant category ${params.category}.` };
  }

  const now = new Date().toISOString();
  const id = uid('V21-ONB');
  const participantId = uid('V17-PART');
  const masked = phone.length >= 6 ? `${phone.slice(0, 4)}***${phone.slice(-3)}` : '***';
  const hasDoc = Boolean(cleanText(params.documentReference));

  const rec: V21ParticipantOnboarding = {
    id,
    tenantId: params.tenantId,
    pilotId: pilot.id,
    userId: params.userId,
    participantId,
    fullName,
    phoneMasked: masked,
    preferredLanguage: cleanText(params.preferredLanguage || 'en'),
    category: params.category,
    organizationId: params.organizationId ? cleanText(params.organizationId) : undefined,
    organizationName: params.organizationName ? cleanText(params.organizationName) : undefined,
    geography: {
      countryCode: cleanText(params.geography?.countryCode || pilot.geography.countryCode).toUpperCase(),
      region: cleanText(params.geography?.region || pilot.geography.region),
      district: cleanText(params.geography?.district || pilot.geography.district),
      subcounty: cleanText(params.geography?.subcounty || 'Central'),
      parish: cleanText(params.geography?.parish || 'Ward 1'),
      village: cleanText(params.geography?.village || 'Locality A'),
      gpsPermissionGranted: Boolean(params.geography?.gpsPermissionGranted),
      gpsLat: params.geography?.gpsPermissionGranted ? Number(params.geography?.gpsLat) : undefined,
      gpsLng: params.geography?.gpsPermissionGranted ? Number(params.geography?.gpsLng) : undefined,
    },
    consentAccepted: true,
    consentVersion: 'V21-PRIVACY-2026.1',
    privacyNoticeAcceptedAt: now,
    // CRITICAL RULE: Registration is NEVER treated as verified identity!
    verificationStatus: hasDoc ? 'SUBMITTED' : 'UNVERIFIED',
    registrationIsNotIdentityVerification: true,
    evidenceSubmitted: hasDoc
      ? [
          {
            id: uid('EVD-V21'),
            documentType: cleanText(params.documentType || 'NATIONAL_OR_BUSINESS_ID'),
            referenceNumberMasked: `REF-***-${cleanText(params.documentReference).slice(-3)}`,
            fileHashSha256: sha(`${id}|${cleanText(params.documentReference)}`),
            attestationStatus: 'SELF_DECLARED_UNVERIFIED',
            uploadedAt: now,
          },
        ]
      : [],
    activityPermissions: CATEGORY_DEFAULT_PERMS[params.category] || ['BROWSE_MARKETPLACE'],
    suspended: false,
    recoveryRequests: [],
    auditHistory: [
      {
        id: uid('AUD-ONB'),
        actorId: params.userId,
        actorRole: params.category,
        action: 'ONBOARDING_REGISTERED',
        toState: hasDoc ? 'SUBMITTED' : 'UNVERIFIED',
        note: 'Registered with consent accepted; identity awaits independent verification.',
        timestamp: now,
        immutableHash: sha(`${id}|REGISTERED|${now}`),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  // Also register corresponding V17 participant so V17/V20 trades interoperate seamlessly
  db.v17Participants.set(participantId, {
    id: participantId,
    userId: params.userId,
    tenantId: params.tenantId,
    participantType: params.category === 'BUYER_TRADER' ? 'BUYER' : params.category === 'LOGISTICS_OPERATOR' ? 'LOGISTICS_OPERATOR' : 'FARMER',
    displayName: fullName,
    phoneMasked: masked,
    countryCode: rec.geography.countryCode,
    district: rec.geography.district,
    languages: [rec.preferredLanguage],
    verificationLevel: hasDoc ? 'CONTACT_VERIFIED' : 'UNVERIFIED',
    verificationSourceLabel: hasDoc ? 'Self-declared metadata submitted (awaiting review)' : 'Registered (Unverified)',
    govtVerified: false,
    consentVersion: rec.consentVersion,
    consentGranted: true,
    visibility: 'PARTICIPANTS_ONLY',
    createdAt: now,
    updatedAt: now,
  });

  db.v21Onboardings.set(rec.id, rec);
  if (hasDoc) {
    // Queue backlog exception for admin attention
    const excId = uid('V21-EXC');
    db.v21Exceptions.set(excId, {
      id: excId,
      tenantId: params.tenantId,
      pilotId: pilot.id,
      exceptionType: 'VERIFICATION_BACKLOG',
      title: `Verification Pending: ${fullName} (${rec.category})`,
      description: `Submitted self-declared ${rec.evidenceSubmitted[0].documentType}; awaits independent verification review.`,
      sourceEntityId: rec.id,
      district: rec.geography.district,
      priority: 'MEDIUM',
      status: 'OPEN',
      ownerId: pilot.pilotAdminIds[0] || 'usr_admin_01',
      resolutionHistory: [{ actorId: 'SYSTEM', note: 'Auto-queued upon onboarding document submission.', status: 'OPEN', timestamp: now }],
      createdAt: now,
      updatedAt: now,
    });
  }
  recomputeV21PilotMetrics(pilot);
  db.scheduleSave();
  return { ok: true, statusCode: 201, onboarding: rec };
}

export function reviewV21OnboardingVerification(params: {
  onboardingId: string;
  targetStatus: V21VerificationStatus;
  reviewerId: string;
  reviewerRole: string;
  note?: string;
}): { ok: boolean; statusCode: number; onboarding?: V21ParticipantOnboarding; error?: string } {
  const rec = db.v21Onboardings.get(params.onboardingId);
  if (!rec) return { ok: false, statusCode: 404, error: 'Onboarding record not found.' };
  if (!ALL_V21_VERIFICATION_STATUSES.includes(params.targetStatus)) {
    return { ok: false, statusCode: 400, error: `Invalid verification status: ${params.targetStatus}` };
  }
  if (params.targetStatus === 'VERIFIED' && rec.evidenceSubmitted.length === 0) {
    return { ok: false, statusCode: 409, error: 'CANNOT_VERIFY_WITHOUT_EVIDENCE: At least one submitted document hash is required.' };
  }

  const now = new Date().toISOString();
  const prev = rec.verificationStatus;
  rec.verificationStatus = params.targetStatus;
  if (params.targetStatus === 'SUSPENDED') {
    rec.suspended = true;
    rec.suspensionReason = cleanText(params.note || 'Suspended during compliance review');
  } else if (params.targetStatus === 'VERIFIED') {
    rec.suspended = false;
  }

  for (const ev of rec.evidenceSubmitted) {
    ev.reviewedBy = params.reviewerId;
    ev.reviewedAt = now;
    ev.reviewNote = cleanText(params.note || `Updated to ${params.targetStatus}`);
    if (params.targetStatus === 'VERIFIED') {
      ev.attestationStatus = 'INDEPENDENTLY_REVIEWED';
    }
  }

  rec.auditHistory.push({
    id: uid('AUD-VER'),
    actorId: params.reviewerId,
    actorRole: params.reviewerRole,
    action: 'VERIFICATION_STATUS_UPDATED',
    fromState: prev,
    toState: params.targetStatus,
    note: cleanText(params.note || `Verification status set to ${params.targetStatus}`),
    timestamp: now,
    immutableHash: sha(`${rec.id}|${prev}|${params.targetStatus}|${params.reviewerId}|${now}`),
  });
  rec.updatedAt = now;
  db.v21Onboardings.set(rec.id, rec);

  // Sync underlying V17 participant verification level
  const part = db.v17Participants.get(rec.participantId);
  if (part) {
    part.verificationLevel =
      params.targetStatus === 'VERIFIED'
        ? 'ORGANIZATION_VERIFIED'
        : params.targetStatus === 'UNDER_REVIEW'
          ? 'DOCUMENTS_REVIEWED'
          : 'CONTACT_VERIFIED';
    part.updatedAt = now;
    db.v17Participants.set(part.id, part);
  }

  // Close open verification backlog exceptions for this onboarding
  for (const exc of db.v21Exceptions.values()) {
    if (exc.sourceEntityId === rec.id && exc.exceptionType === 'VERIFICATION_BACKLOG' && exc.status === 'OPEN') {
      exc.status = 'RESOLVED';
      exc.updatedAt = now;
      exc.resolutionHistory.push({
        actorId: params.reviewerId,
        note: `Onboarding reviewed -> ${params.targetStatus}`,
        status: 'RESOLVED',
        timestamp: now,
      });
      db.v21Exceptions.set(exc.id, exc);
    }
  }

  const pilot = db.v21Pilots.get(rec.pilotId);
  if (pilot) recomputeV21PilotMetrics(pilot);

  logIntelligenceAudit({
    tenantId: rec.tenantId,
    jurisdiction: rec.geography.countryCode,
    actorId: params.reviewerId,
    actorRole: params.reviewerRole,
    actionType: 'V21_ONBOARDING_EVENT',
    entityType: 'V21_ONBOARDING',
    entityId: rec.id,
    details: `Verification review ${prev} -> ${params.targetStatus} for ${rec.fullName}.`,
  });
  db.scheduleSave();
  return { ok: true, statusCode: 200, onboarding: rec };
}

// ==========================================
// 3. FIELD OPERATIONS RECORDS & TASK LIFECYCLE
// ==========================================

const FIELD_TASK_TRANSITIONS: Record<V21FieldTaskStatus, V21FieldTaskStatus[]> = {
  CREATED: ['ASSIGNED', 'REASSIGNED'],
  ASSIGNED: ['ACCEPTED', 'REJECTED', 'REASSIGNED'],
  REASSIGNED: ['ACCEPTED', 'REJECTED', 'IN_PROGRESS'],
  REJECTED: ['REASSIGNED', 'ASSIGNED', 'CLOSED'],
  ACCEPTED: ['IN_PROGRESS', 'REASSIGNED'],
  IN_PROGRESS: ['SUBMITTED', 'REASSIGNED'],
  SUBMITTED: ['REVIEWED', 'IN_PROGRESS', 'REJECTED'],
  REVIEWED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

export function saveOrSyncV21FieldRecord(params: {
  id?: string;
  tenantId: string;
  pilotId: string;
  fieldOfficerId: string;
  participantId?: string;
  recordType: V21FieldActivityRecord['recordType'];
  title: string;
  summary: string;
  payload: Record<string, any>;
  evidenceAttachmentMeta?: V21FieldActivityRecord['evidenceAttachmentMeta'];
  gpsPermissionGranted?: boolean;
  gpsCoordinates?: { lat: number; lng: number; accuracyMeters?: number };
  idempotencyKey?: string;
  clientVersion?: number;
  targetMode: 'LOCAL_DRAFT' | 'QUEUED' | 'SYNC_NOW';
  simulateFailure?: boolean;
}): { ok: boolean; statusCode: number; record?: V21FieldActivityRecord; error?: string } {
  if (params.gpsCoordinates && !params.gpsPermissionGranted) {
    return {
      ok: false,
      statusCode: 403,
      error: 'LOCATION_PERMISSION_REQUIRED: GPS coordinates cannot be stored unless explicit user permission is granted.',
    };
  }
  const pilot = db.v21Pilots.get(params.pilotId);
  if (!pilot) return { ok: false, statusCode: 404, error: `Pilot ${params.pilotId} not found.` };

  const idem = cleanText(params.idempotencyKey || uid('FLD-IDEM'));
  const existing = params.id
    ? db.v21FieldRecords.get(params.id)
    : Array.from(db.v21FieldRecords.values()).find((r) => r.idempotencyKey === idem);

  const now = new Date().toISOString();
  const base: V21FieldActivityRecord = existing || {
    id: params.id || uid('V21-FLD'),
    tenantId: params.tenantId,
    pilotId: params.pilotId,
    fieldOfficerId: params.fieldOfficerId,
    participantId: params.participantId ? cleanText(params.participantId) : undefined,
    recordType: params.recordType,
    title: cleanText(params.title || 'Field Record'),
    summary: cleanText(params.summary || 'Field operations activity capture'),
    payload: params.payload || {},
    evidenceAttachmentMeta: params.evidenceAttachmentMeta,
    gpsPermissionGranted: Boolean(params.gpsPermissionGranted),
    gpsCoordinates: params.gpsPermissionGranted ? params.gpsCoordinates : undefined,
    syncStatus: params.targetMode === 'SYNC_NOW' ? 'SYNCING' : params.targetMode,
    idempotencyKey: idem,
    clientVersion: Number(params.clientVersion || 1),
    serverVersion: 1,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (existing) {
    base.title = cleanText(params.title || existing.title);
    base.summary = cleanText(params.summary || existing.summary);
    base.payload = { ...existing.payload, ...(params.payload || {}) };
    base.updatedAt = now;
  }

  if (params.targetMode === 'SYNC_NOW') {
    if (params.simulateFailure) {
      base.syncStatus = 'FAILED';
      base.retryCount += 1;
      base.lastError = 'SIMULATED_NETWORK_TIMEOUT: Offline record preserved locally for retry.';
      const excId = uid('V21-EXC');
      db.v21Exceptions.set(excId, {
        id: excId,
        tenantId: base.tenantId,
        pilotId: base.pilotId,
        exceptionType: 'OFFLINE_SYNC_FAILURE',
        title: `Field Sync Failure: ${base.title}`,
        description: base.lastError,
        sourceEntityId: base.id,
        district: pilot.geography.district,
        priority: 'HIGH',
        status: 'OPEN',
        ownerId: base.fieldOfficerId,
        resolutionHistory: [{ actorId: 'SYSTEM', note: base.lastError, status: 'OPEN', timestamp: now }],
        createdAt: now,
        updatedAt: now,
      });
    } else if (base.payload?.targetTradeId) {
      // Forward through V20 offline conflict detector!
      const syncRes = processV20OfflineSync({
        tenantId: base.tenantId,
        actorUserId: base.fieldOfficerId,
        items: [
          {
            actionType: 'DELIVERY_EVIDENCE',
            entityId: String(base.payload.targetTradeId),
            idempotencyKey: base.idempotencyKey,
            clientVersion: base.clientVersion,
            payload: base.payload,
          },
        ],
      });
      if (syncRes.conflicts.length > 0) {
        base.syncStatus = 'CONFLICT';
        base.conflictId = syncRes.conflicts[0].id;
        base.lastError = 'VERSION_CONFLICT_DETECTED: Server record advanced; human resolution required.';
      } else {
        base.syncStatus = 'SYNCED';
        base.serverVersion += 1;
        base.lastError = undefined;
      }
    } else {
      base.syncStatus = 'SYNCED';
      base.serverVersion += 1;
      base.lastError = undefined;
    }
  } else {
    base.syncStatus = params.targetMode;
  }

  db.v21FieldRecords.set(base.id, base);
  recomputeV21PilotMetrics(pilot);
  db.scheduleSave();
  return { ok: true, statusCode: existing ? 200 : 201, record: base };
}

export function transitionV21FieldTask(params: {
  taskId: string;
  targetStatus: V21FieldTaskStatus;
  actorId: string;
  actorRole: string;
  note?: string;
  siteVisitNotes?: string;
  assistanceSummary?: string;
  followUpAction?: string;
  supervisorReviewNote?: string;
  reassignToOfficerId?: string;
}): { ok: boolean; statusCode: number; task?: V21FieldOfficerTask; error?: string } {
  const task = db.v21FieldTasks.get(params.taskId);
  if (!task) return { ok: false, statusCode: 404, error: 'Field task not found.' };

  const isAdminOrSupervisor = params.actorRole === 'PLATFORM_ADMIN' || params.actorRole === 'COOPERATIVE_ADMIN';
  if (!isAdminOrSupervisor && task.officerUserId !== params.actorId) {
    return {
      ok: false,
      statusCode: 403,
      error: 'FIELD_OFFICER_SCOPE_DENIED: Officer can only manage tasks assigned to them.',
    };
  }
  if ((params.targetStatus === 'REVIEWED' || params.targetStatus === 'CLOSED') && !isAdminOrSupervisor) {
    return { ok: false, statusCode: 403, error: 'SUPERVISOR_REQUIRED_TO_REVIEW_OR_CLOSE' };
  }

  const allowed = FIELD_TASK_TRANSITIONS[task.status] || [];
  if (!allowed.includes(params.targetStatus)) {
    return {
      ok: false,
      statusCode: 409,
      error: `INVALID_TASK_TRANSITION: Cannot move task from ${task.status} to ${params.targetStatus}. Allowed: [${allowed.join(', ')}]`,
    };
  }

  const now = new Date().toISOString();
  const prev = task.status;
  task.status = params.targetStatus;
  if (params.siteVisitNotes) task.siteVisitNotes = cleanText(params.siteVisitNotes);
  if (params.assistanceSummary) task.assistanceSummary = cleanText(params.assistanceSummary);
  if (params.followUpAction) task.followUpAction = cleanText(params.followUpAction);
  if (params.supervisorReviewNote) {
    task.supervisorReviewNote = cleanText(params.supervisorReviewNote);
    task.supervisorId = params.actorId;
  }
  if (params.targetStatus === 'REASSIGNED' && params.reassignToOfficerId) {
    task.officerUserId = cleanText(params.reassignToOfficerId);
  }
  task.history.push({
    id: uid('AUD-TSK'),
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: 'TASK_STATUS_TRANSITION',
    fromState: prev,
    toState: params.targetStatus,
    note: cleanText(params.note || `Task updated to ${params.targetStatus}`),
    timestamp: now,
    immutableHash: sha(`${task.id}|${prev}|${params.targetStatus}|${params.actorId}|${now}`),
  });
  task.updatedAt = now;
  db.v21FieldTasks.set(task.id, task);

  logIntelligenceAudit({
    tenantId: task.tenantId,
    jurisdiction: 'UG',
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'V21_FIELD_TASK_EVENT',
    entityType: 'V21_FIELD_TASK',
    entityId: task.id,
    details: `Field task ${task.id} (${prev} -> ${params.targetStatus}).`,
  });
  db.scheduleSave();
  return { ok: true, statusCode: 200, task };
}

// ==========================================
// 4. CONTROL CENTRE MONITORING & EXCEPTIONS
// ==========================================

export function buildControlCentreSnapshot(filters: {
  pilotId?: string;
  district?: string;
  category?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const pilots = Array.from(db.v21Pilots.values())
    .map((p) => recomputeV21PilotMetrics(p))
    .filter((p) => (!filters.pilotId || p.id === filters.pilotId) && (!filters.district || p.geography.district.toLowerCase().includes(filters.district.toLowerCase())));

  const onboardings = Array.from(db.v21Onboardings.values()).filter((o) => {
    if (filters.pilotId && o.pilotId !== filters.pilotId) return false;
    if (filters.district && !o.geography.district.toLowerCase().includes(filters.district.toLowerCase())) return false;
    if (filters.category && o.category !== filters.category) return false;
    if (filters.status && o.verificationStatus !== filters.status) return false;
    return true;
  });

  const trades = Array.from(db.v20Trades.values()).filter((t) => {
    if (t.isTestRecord) return false;
    if (filters.district && !t.district.toLowerCase().includes(filters.district.toLowerCase())) return false;
    if (filters.fromDate && t.createdAt < filters.fromDate) return false;
    if (filters.toDate && t.createdAt > filters.toDate) return false;
    return true;
  });

  const shipments = Array.from(db.v20Shipments.values()).filter((s) =>
    !filters.district || s.originDistrict.toLowerCase().includes(filters.district.toLowerCase()) || s.destinationDistrict.toLowerCase().includes(filters.district.toLowerCase())
  );

  const exceptions = Array.from(db.v21Exceptions.values()).filter((e) => {
    if (filters.pilotId && e.pilotId !== filters.pilotId) return false;
    if (filters.district && !e.district.toLowerCase().includes(filters.district.toLowerCase())) return false;
    return true;
  });

  const tasks = Array.from(db.v21FieldTasks.values()).filter((t) => {
    if (filters.pilotId && t.pilotId !== filters.pilotId) return false;
    if (filters.district && !t.assignedDistrict.toLowerCase().includes(filters.district.toLowerCase())) return false;
    return true;
  });

  const supportCases = Array.from(db.v21SupportCases.values()).filter((s) => !filters.pilotId || s.pilotId === filters.pilotId);
  const fieldRecords = Array.from(db.v21FieldRecords.values()).filter((r) => !filters.pilotId || r.pilotId === filters.pilotId);
  const disputes = Array.from(db.v17Disputes.values());
  const obligations = Array.from(db.v20PaymentObligations.values()).filter((o) => !o.isTestRecord);
  const offlineConflicts = Array.from(db.v20OfflineConflicts.values());

  return {
    counts: {
      activePilots: pilots.filter((p) => p.status === 'ACTIVE').length,
      totalPilots: pilots.length,
      registeredParticipants: onboardings.length,
      verifiedParticipants: onboardings.filter((o) => o.verificationStatus === 'VERIFIED').length,
      verificationBacklog: onboardings.filter((o) => ['SUBMITTED', 'UNDER_REVIEW'].includes(o.verificationStatus)).length,
      organizationsOnboarded: new Set(onboardings.map((o) => o.organizationId).filter(Boolean)).size,
      activeListings: Array.from(db.v17CommercialListings.values()).filter((l) => l.status === 'ACTIVE').length,
      openEnquiries: trades.filter((t) => t.stage === 'ENQUIRY').length,
      activeAgreements: trades.filter((t) => ['AGREEMENT_CREATED', 'FULFILMENT_PLANNED', 'FULFILMENT_IN_PROGRESS'].includes(t.stage)).length,
      fulfilmentOperations: shipments.filter((s) => !['COMPLETED', 'CANCELLED'].includes(s.status)).length,
      deliveryExceptions: shipments.filter((s) => ['DELAYED', 'DAMAGED', 'DISPUTED'].includes(s.status)).length,
      disputesRequiringAttention: disputes.filter((d) => d.stage !== '11_CLOSED').length,
      offlineSyncFailures: fieldRecords.filter((r) => r.syncStatus === 'FAILED' || r.syncStatus === 'CONFLICT').length + offlineConflicts.filter((c) => c.resolutionState === 'CONFLICT_DETECTED').length,
      reconciliationExceptions: obligations.filter((o) => ['DISPUTED', 'PARTIAL_PAID'].includes(o.status)).length,
      fieldOfficerAssignments: tasks.filter((t) => t.status !== 'CLOSED').length,
      openSupportRequests: supportCases.filter((s) => !['RESOLVED', 'CLOSED'].includes(s.status)).length,
      openExceptionsQueue: exceptions.filter((e) => !['RESOLVED', 'CLOSED'].includes(e.status)).length,
    },
    pilots,
    onboardings,
    exceptions,
    tasks,
    supportCases,
    recentAuditEvents: Array.from(db.intelligenceAuditEvents.values()).slice(-20).reverse(),
  };
}
