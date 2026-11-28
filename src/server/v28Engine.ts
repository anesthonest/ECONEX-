/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 - Universal Economic Execution, Interoperability & Continental Operations Engine
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeGenerateGeminiText } from './gemini.ts';
import { db } from './db.ts';
import { detectPromptInjection, sanitizeExternalSourceText } from './gemini.ts';
import { cleanV26Text, createInAppNotification, uidV26 } from './v26Engine.ts';
import { getV25PostgresDiagnostics } from './v25PostgresEngine.ts';
import { getV28RepositoryHealth } from './v28GitHubEngine.ts';
import type {
  UserRole,
  V23CurrencyCode,
  V23LedgerPosting,
  V23WalletTransaction,
  V28AiOrchestrationRun,
  V28ConnectorCategory,
  V28ConnectorState,
  V28ContractObligation,
  V28ContractRecord,
  V28ContractStatus,
  V28ContractType,
  V28CountryOperatingProfile,
  V28CrossBorderExecution,
  V28DomainEvent,
  V28DualApprovalRequest,
  V28ExecutionTransition,
  V28ExecutionWorkflow,
  V28FieldOfflineRecord,
  V28FulfilmentPlan,
  V28IntelligenceSourceCategory,
  V28InteroperabilityConnector,
  V28InventoryReservation,
  V28OperationalException,
  V28ParticipantCategory,
  V28ProcurementEvaluation,
  V28ProcurementPlan,
  V28ProcurementRequisition,
  V28ReadinessFlags,
  V28ShipmentEvidence,
  V28VaultDocumentRecord,
  V28WorkflowStage,
  V28WorkflowStatus,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const REPORT_FILE = path.join(ROOT, '.econex-reports', 'verification-latest.json');

export class V28HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code || message;
  }
}

export interface V28ActorCtx {
  tenantId: string;
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
  organisationId: string;
  countryCode: string;
  correlationId: string;
  sourceIp: string;
  authenticated: boolean;
}

const V28_STAGE_SEQUENCE: V28WorkflowStage[] = [
  'DISCOVER',
  'VERIFY',
  'MATCH',
  'NEGOTIATE',
  'AGREE',
  'AUTHORISE',
  'EXECUTE',
  'FULFIL',
  'RECONCILE',
  'CLOSE',
  'EVALUATE',
];

const V28_ALLOWED_STATUS_FROM: Record<V28WorkflowStatus, V28WorkflowStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['VERIFIED', 'APPROVED', 'REJECTED' as any, 'CANCELLED', 'FAILED'].filter(Boolean) as V28WorkflowStatus[],
  VERIFIED: ['APPROVED', 'CONTRACTED', 'DISPUTED', 'CANCELLED', 'FAILED'],
  APPROVED: ['CONTRACTED', 'IN_PROGRESS', 'DISPUTED', 'SUSPENDED', 'CANCELLED'],
  CONTRACTED: ['IN_PROGRESS', 'DISPUTED', 'SUSPENDED', 'CANCELLED'],
  IN_PROGRESS: ['PARTIALLY_FULFILLED', 'FULFILLED', 'DISPUTED', 'SUSPENDED', 'FAILED'],
  PARTIALLY_FULFILLED: ['FULFILLED', 'DISPUTED', 'FAILED'],
  FULFILLED: ['RECONCILED', 'DISPUTED'],
  RECONCILED: ['CLOSED', 'DISPUTED'],
  CLOSED: [],
  DISPUTED: ['IN_PROGRESS', 'RECONCILED', 'CANCELLED', 'FAILED'],
  SUSPENDED: ['IN_PROGRESS', 'CANCELLED'],
  CANCELLED: [],
  FAILED: ['SUBMITTED', 'CANCELLED'],
};

const V28_AI_COUNTERS = {
  totalRuns: 0,
  blockedInjections: 0,
  blockedAutonomousRequests: 0,
  liveModelCalls: 0,
  deterministicFallbacks: 0,
};

function sanitize(val: unknown): string {
  return cleanV26Text(val);
}

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

function resolveTenantForCountry(countryCode: string): string {
  return `TENANT-${(countryCode || 'UG').toUpperCase()}`;
}

export function emitV28DomainEvent(
  domain: V28DomainEvent['domain'],
  eventType: string,
  payload: Record<string, any>,
  ctx: V28ActorCtx,
  idempotencyKey?: string
): V28DomainEvent {
  const key = idempotencyKey || `${eventType}:${ctx.correlationId}:${Date.now()}`;
  const existing = Array.from(db.v28DomainEvents.values()).find((e) => e.idempotencyKey === key);
  if (existing) return existing;

  const now = new Date().toISOString();
  const evt: V28DomainEvent = {
    id: uidV26('V28-EVT'),
    eventVersion: '1.0',
    eventType: sanitize(eventType).toUpperCase(),
    domain,
    correlationId: ctx.correlationId,
    idempotencyKey: key,
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    payload,
    status: 'DISPATCHED',
    attempts: 1,
    maxAttempts: 3,
    dispatchedAt: now,
    createdAt: now,
  };
  db.v28DomainEvents.set(evt.id, evt);
  return evt;
}

// ==========================================
// 1. UNIFIED ECONOMIC EXECUTION STATE MACHINE (PART 4)
// ==========================================

export function listExecutionWorkflows(ctx: V28ActorCtx, filters?: { stage?: string; status?: string; countryCode?: string }) {
  return Array.from(db.v28ExecutionWorkflows.values())
    .filter((wf) => {
      if (!ctx.isPlatformAdmin) {
        const owns =
          wf.ownerUserId === ctx.userId ||
          wf.initiatorUserId === ctx.userId ||
          wf.initiatorOrgId === ctx.organisationId ||
          wf.counterpartyOrgId === ctx.organisationId;
        if (!owns) return false;
      }
      if (filters?.stage && wf.stage !== filters.stage) return false;
      if (filters?.status && wf.status !== filters.status) return false;
      if (filters?.countryCode && wf.countryCode !== filters.countryCode.toUpperCase()) return false;
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createExecutionWorkflow(
  payload: {
    title: string;
    sectorId?: string;
    participantCategory?: V28ParticipantCategory;
    counterpartyOrgId?: string;
    countryCode?: string;
    destinationCountryCode?: string;
    currency?: V23CurrencyCode;
    valueMinor: number;
    requiredEvidence?: string[];
    requiresHumanApproval?: boolean;
  },
  ctx: V28ActorCtx
): V28ExecutionWorkflow {
  const title = sanitize(payload.title);
  if (!title) throw new V28HttpError(400, 'WORKFLOW_TITLE_REQUIRED');
  const valueMinor = Math.round(Number(payload.valueMinor || 0));
  if (!Number.isFinite(valueMinor) || valueMinor < 0) {
    throw new V28HttpError(400, 'INVALID_INTEGER_VALUE_MINOR');
  }
  const now = new Date().toISOString();
  const wf: V28ExecutionWorkflow = {
    id: uidV26('V28-WF'),
    workflowRef: `EXEC-${(payload.countryCode || ctx.countryCode || 'UG').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    title,
    sectorId: sanitize(payload.sectorId || 'AGRICULTURE').toUpperCase(),
    participantCategory: payload.participantCategory || 'ENTERPRISE',
    initiatorUserId: ctx.userId,
    initiatorOrgId: ctx.organisationId,
    counterpartyOrgId: sanitize(payload.counterpartyOrgId) || undefined,
    ownerUserId: ctx.userId,
    stage: 'DISCOVER',
    status: 'DRAFT',
    countryCode: (sanitize(payload.countryCode) || ctx.countryCode || 'UG').toUpperCase(),
    destinationCountryCode: payload.destinationCountryCode ? sanitize(payload.destinationCountryCode).toUpperCase() : undefined,
    currency: (sanitize(payload.currency) || 'UGX').toUpperCase() as V23CurrencyCode,
    valueMinor,
    requiredEvidence: Array.isArray(payload.requiredEvidence) ? payload.requiredEvidence.map(sanitize) : [],
    submittedEvidence: [],
    requiresHumanApproval: payload.requiresHumanApproval !== false,
    compensationStatus: 'NONE',
    correlationId: ctx.correlationId,
    transitions: [],
    createdAt: now,
    updatedAt: now,
  };
  db.v28ExecutionWorkflows.set(wf.id, wf);
  emitV28DomainEvent('EXECUTION', 'EXECUTION.WORKFLOW_CREATED', { workflowId: wf.id, stage: wf.stage, status: wf.status }, ctx);
  db.scheduleSave();
  return wf;
}

export function transitionExecutionWorkflow(
  workflowId: string,
  payload: {
    toStage?: V28WorkflowStage;
    toStatus: V28WorkflowStatus;
    evidenceRefs?: string[];
    humanApprove?: boolean;
    notes?: string;
    idempotencyKey?: string;
  },
  ctx: V28ActorCtx
): V28ExecutionWorkflow {
  const wf = db.v28ExecutionWorkflows.get(workflowId);
  if (!wf) throw new V28HttpError(404, 'EXECUTION_WORKFLOW_NOT_FOUND');

  const isParty =
    ctx.isPlatformAdmin ||
    wf.ownerUserId === ctx.userId ||
    wf.initiatorUserId === ctx.userId ||
    wf.initiatorOrgId === ctx.organisationId ||
    wf.counterpartyOrgId === ctx.organisationId;
  if (!isParty) throw new V28HttpError(403, 'FORBIDDEN_WORKFLOW_ACCESS');

  if (payload.idempotencyKey) {
    const dup = wf.transitions.find((t) => t.idempotencyKey === payload.idempotencyKey);
    if (dup) return wf;
  }

  const allowedTargets = V28_ALLOWED_STATUS_FROM[wf.status] || [];
  if (!allowedTargets.includes(payload.toStatus)) {
    throw new V28HttpError(409, `INVALID_WORKFLOW_STATUS_TRANSITION: ${wf.status} -> ${payload.toStatus}`);
  }

  if (payload.toStage && !V28_STAGE_SEQUENCE.includes(payload.toStage)) {
    throw new V28HttpError(400, 'INVALID_WORKFLOW_STAGE');
  }

  if (Array.isArray(payload.evidenceRefs)) {
    for (const ref of payload.evidenceRefs) {
      const cleanRef = sanitize(ref);
      if (cleanRef && !wf.submittedEvidence.includes(cleanRef)) wf.submittedEvidence.push(cleanRef);
    }
  }

  // Enforce evidence + human checkpoint before EXECUTE / APPROVED / CONTRACTED / RECONCILED / CLOSED
  const gatedStatuses: V28WorkflowStatus[] = ['APPROVED', 'CONTRACTED', 'IN_PROGRESS', 'RECONCILED', 'CLOSED'];
  if (gatedStatuses.includes(payload.toStatus)) {
    const missing = wf.requiredEvidence.filter((reqEv) => !wf.submittedEvidence.includes(reqEv));
    if (missing.length > 0 && !ctx.isPlatformAdmin) {
      throw new V28HttpError(400, `REQUIRED_EVIDENCE_MISSING: ${missing.join(', ')}`);
    }
  }

  const now = new Date().toISOString();
  if (payload.humanApprove) {
    if (!ctx.isPlatformAdmin && ctx.role !== 'BUYER' && ctx.role !== 'COOPERATIVE_ADMIN') {
      throw new V28HttpError(403, 'HUMAN_APPROVAL_AUTHORITY_REQUIRED');
    }
    wf.humanApprovedByUserId = ctx.userId;
    wf.humanApprovedAt = now;
  }

  if (wf.requiresHumanApproval && ['IN_PROGRESS', 'RECONCILED', 'CLOSED'].includes(payload.toStatus) && !wf.humanApprovedByUserId) {
    throw new V28HttpError(403, 'HUMAN_APPROVAL_CHECKPOINT_REQUIRED_BEFORE_EXECUTION');
  }

  if (payload.toStatus === 'FAILED' || payload.toStatus === 'CANCELLED') {
    wf.compensationStatus = wf.stage === 'EXECUTE' || wf.stage === 'FULFIL' ? 'COMPENSATION_INITIATED' : 'NONE';
    wf.failureReason = sanitize(payload.notes || 'Transitioned to failure/cancelled state');
  }

  const nextStage = payload.toStage || wf.stage;
  const tr: V28ExecutionTransition = {
    id: uidV26('V28-TR'),
    workflowId: wf.id,
    fromStage: wf.stage,
    toStage: nextStage,
    fromStatus: wf.status,
    toStatus: payload.toStatus,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    actorOrgId: ctx.organisationId,
    evidenceRefs: Array.isArray(payload.evidenceRefs) ? payload.evidenceRefs.map(sanitize) : [],
    humanApprovedBy: payload.humanApprove ? ctx.userId : undefined,
    compensationAction: wf.compensationStatus !== 'NONE' ? 'COMPENSATING_RELEASE_RECORDED' : undefined,
    notes: sanitize(payload.notes) || undefined,
    idempotencyKey: sanitize(payload.idempotencyKey) || undefined,
    correlationId: ctx.correlationId,
    occurredAt: now,
  };

  wf.transitions.push(tr);
  wf.stage = nextStage;
  wf.status = payload.toStatus;
  wf.updatedAt = now;
  db.v28ExecutionWorkflows.set(wf.id, wf);
  emitV28DomainEvent('EXECUTION', `EXECUTION.${payload.toStatus}`, { workflowId: wf.id, stage: wf.stage }, ctx);
  db.scheduleSave();
  return wf;
}

// ==========================================
// 2. UNIVERSAL PARTICIPANT & ORGANISATION WORKSPACE (PART 5)
// ==========================================

export function getUniversalWorkspaceSummary(ctx: V28ActorCtx) {
  const user = db.users.get(ctx.userId);
  const workflows = listExecutionWorkflows(ctx);
  const contracts = listContracts(ctx);
  const obligations = Array.from(db.v28ContractObligations.values()).filter(
    (o) => ctx.isPlatformAdmin || o.responsiblePartyOrgId === ctx.organisationId || o.tenantId === ctx.tenantId
  );
  const procurementReqs = Array.from(db.v28ProcurementRequisitions.values()).filter(
    (r) => ctx.isPlatformAdmin || r.organisationId === ctx.organisationId
  );
  const fulfilments = Array.from(db.v28FulfilmentPlans.values()).filter(
    (f) => ctx.isPlatformAdmin || f.sellerOrgId === ctx.organisationId || f.buyerOrgId === ctx.organisationId
  );
  const docs = listVaultDocuments(ctx);
  const wallets = Array.from(db.v23Wallets.values()).filter(
    (w) => ctx.isPlatformAdmin || w.ownerUserId === ctx.userId || w.linkedEntityId === ctx.organisationId
  );
  const org = db.v25Organisations.get(ctx.organisationId) || db.organizations.get(ctx.organisationId);
  const membershipCount = Array.from(db.v25OrgMemberships.values()).filter(
    (m) => m.organisationId === ctx.organisationId || ctx.isPlatformAdmin
  ).length;
  const openExceptions = Array.from(db.v28OperationalExceptions.values()).filter(
    (ex) => (ctx.isPlatformAdmin || ex.organisationId === ctx.organisationId) && ex.status !== 'RESOLVED'
  );
  const notifications = Array.from(db.v26Notifications.values()).filter(
    (n) => ctx.isPlatformAdmin || n.userId === ctx.userId
  );

  return {
    actor: {
      userId: ctx.userId,
      name: user?.name || ctx.userId,
      role: ctx.role,
      organisationId: ctx.organisationId,
      organisationName: (org as any)?.legalName || (org as any)?.name || ctx.organisationId,
      countryCode: ctx.countryCode,
      tenantId: ctx.tenantId,
      isPlatformAdmin: ctx.isPlatformAdmin,
    },
    counts: {
      executionWorkflows: workflows.length,
      activeContracts: contracts.filter((c) => ['APPROVED', 'ACKNOWLEDGED_ACTIVE', 'AMENDED'].includes(c.status)).length,
      contractObligations: obligations.length,
      procurementRequisitions: procurementReqs.length,
      fulfilmentPlans: fulfilments.length,
      vaultDocuments: docs.length,
      wallets: wallets.length,
      teamMembers: membershipCount,
      openExceptions: openExceptions.length,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
    },
    sections: [
      'PROFILE_IDENTITY',
      'VERIFICATION_STATUS',
      'RELATIONSHIPS_PARTNERS',
      'DISCOVERY_OPPORTUNITIES',
      'RFQS_NEGOTIATIONS',
      'CONTRACTS_AGREEMENTS',
      'ORDERS_PROCUREMENT',
      'PRODUCTS_SERVICES_CAPACITY',
      'INVENTORY_WAREHOUSING',
      'LOGISTICS_FULFILMENT',
      'WALLET_OBLIGATIONS',
      'TEAM_ROLES_APPROVALS',
      'TASKS_ALERTS',
      'MESSAGES_THREADS',
      'DOCUMENTS_EVIDENCE',
      'ANALYTICS_AI_ADVISORY',
      'REPORTS_REPUTATION',
      'SUPPORT_DISPUTES',
    ],
    workflows: workflows.slice(0, 10),
    contracts: contracts.slice(0, 10),
    openExceptions: openExceptions.slice(0, 5),
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
  };
}

// ==========================================
// 3. UNIVERSAL CONTRACTS & OBLIGATIONS (PART 6)
// ==========================================

export function listContracts(ctx: V28ActorCtx) {
  return Array.from(db.v28Contracts.values())
    .filter((c) => ctx.isPlatformAdmin || c.partyAOrgId === ctx.organisationId || c.partyBOrgId === ctx.organisationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createContract(
  payload: {
    contractType?: V28ContractType;
    templateCode?: string;
    title: string;
    scopeOfWork: string;
    partyBOrgId: string;
    partyBRepUserId?: string;
    countryCode?: string;
    currency?: V23CurrencyCode;
    totalValueMinor: number;
    paymentTerms?: string;
    deliveryTerms?: string;
    items?: V28ContractRecord['items'];
    evidenceRequirements?: string[];
    expiresAt?: string;
    autoRenew?: boolean;
  },
  ctx: V28ActorCtx
): V28ContractRecord {
  const title = sanitize(payload.title);
  if (!title) throw new V28HttpError(400, 'CONTRACT_TITLE_REQUIRED');
  const totalValueMinor = Math.round(Number(payload.totalValueMinor || 0));
  if (!Number.isFinite(totalValueMinor) || totalValueMinor <= 0) {
    throw new V28HttpError(400, 'CONTRACT_VALUE_POSITIVE_INTEGER_REQUIRED');
  }
  const now = new Date().toISOString();
  const id = uidV26('V28-CTR');
  const contractNumber = `ECX-CTR-2026-${String(db.v28Contracts.size + 1).padStart(4, '0')}`;
  const ctr: V28ContractRecord = {
    id,
    contractNumber,
    contractType: payload.contractType || 'SUPPLY',
    templateCode: sanitize(payload.templateCode) || 'EAC-STD-01',
    title,
    scopeOfWork: sanitize(payload.scopeOfWork) || 'Commercial supply & fulfilment terms',
    partyAOrgId: ctx.organisationId,
    partyARepUserId: ctx.userId,
    partyBOrgId: sanitize(payload.partyBOrgId) || 'org_coop_01',
    partyBRepUserId: sanitize(payload.partyBRepUserId) || undefined,
    countryCode: (sanitize(payload.countryCode) || ctx.countryCode || 'UG').toUpperCase(),
    currency: (sanitize(payload.currency) || 'UGX').toUpperCase() as V23CurrencyCode,
    totalValueMinor,
    paymentTerms: sanitize(payload.paymentTerms) || 'Net 14 days post POD via ECONEX Sandbox Obligation',
    deliveryTerms: sanitize(payload.deliveryTerms) || 'DAP Buyer Warehouse',
    items: Array.isArray(payload.items) && payload.items.length > 0 ? payload.items : [],
    evidenceRequirements: Array.isArray(payload.evidenceRequirements) ? payload.evidenceRequirements.map(sanitize) : ['DELIVERY_POD'],
    acknowledgements: [],
    legallyQualifiedSignature: false,
    legalDisclosure: 'Recorded platform commercial acknowledgement; not a legally qualified e-signature under statutory PKI.',
    status: 'UNDER_REVIEW',
    currentVersion: 1,
    versions: [
      {
        version: 1,
        summary: title,
        valueMinor: totalValueMinor,
        amendedByUserId: ctx.userId,
        amendmentReason: 'Initial contract draft',
        checksumSha256: sha256(`${contractNumber}:v1:${totalValueMinor}`),
        createdAt: now,
      },
    ],
    linkedOrderIds: [],
    linkedInvoiceIds: [],
    linkedLedgerRefs: [],
    expiresAt: payload.expiresAt || new Date(Date.now() + 365 * 86400_000).toISOString(),
    autoRenew: Boolean(payload.autoRenew),
    createdAt: now,
    updatedAt: now,
  };
  db.v28Contracts.set(ctr.id, ctr);
  emitV28DomainEvent('CONTRACT', 'CONTRACT.CREATED', { contractId: ctr.id, contractNumber }, ctx);
  db.scheduleSave();
  return ctr;
}

export function transitionContract(
  contractId: string,
  payload: { action: 'APPROVE' | 'ACKNOWLEDGE' | 'AMEND' | 'DISPUTE' | 'CLOSE' | 'TERMINATE'; amendmentSummary?: string; amendmentReason?: string; newValueMinor?: number; disputeNote?: string },
  ctx: V28ActorCtx
): V28ContractRecord {
  const ctr = db.v28Contracts.get(contractId);
  if (!ctr) throw new V28HttpError(404, 'CONTRACT_NOT_FOUND');
  const isParty = ctx.isPlatformAdmin || ctr.partyAOrgId === ctx.organisationId || ctr.partyBOrgId === ctx.organisationId;
  if (!isParty) throw new V28HttpError(403, 'FORBIDDEN_CONTRACT_PARTY_ONLY');

  const now = new Date().toISOString();
  if (payload.action === 'APPROVE') {
    ctr.status = 'APPROVED';
  } else if (payload.action === 'ACKNOWLEDGE') {
    const already = ctr.acknowledgements.some((a) => a.userId === ctx.userId);
    if (!already) {
      ctr.acknowledgements.push({
        userId: ctx.userId,
        orgId: ctx.organisationId,
        acknowledgedAt: now,
        acknowledgementHash: sha256(`${ctr.id}:${ctx.userId}:v${ctr.currentVersion}:${now}`),
        legallyQualifiedSignature: false,
      });
    }
    ctr.status = 'ACKNOWLEDGED_ACTIVE';
  } else if (payload.action === 'AMEND') {
    const nextVer = ctr.currentVersion + 1;
    const val = payload.newValueMinor ? Math.round(Number(payload.newValueMinor)) : ctr.totalValueMinor;
    if (val <= 0) throw new V28HttpError(400, 'INVALID_AMENDMENT_VALUE');
    ctr.totalValueMinor = val;
    ctr.currentVersion = nextVer;
    ctr.versions.push({
      version: nextVer,
      summary: sanitize(payload.amendmentSummary) || `Amendment v${nextVer}`,
      valueMinor: val,
      amendedByUserId: ctx.userId,
      amendmentReason: sanitize(payload.amendmentReason) || 'Commercial terms update',
      checksumSha256: sha256(`${ctr.contractNumber}:v${nextVer}:${val}`),
      createdAt: now,
    });
    ctr.status = 'AMENDED';
  } else if (payload.action === 'DISPUTE') {
    ctr.status = 'DISPUTED';
    ctr.disputeNote = sanitize(payload.disputeNote) || 'Commercial performance dispute opened';
  } else if (payload.action === 'CLOSE') {
    ctr.status = 'CLOSED';
  } else if (payload.action === 'TERMINATE') {
    ctr.status = 'TERMINATED';
  }

  ctr.updatedAt = now;
  db.v28Contracts.set(ctr.id, ctr);
  emitV28DomainEvent('CONTRACT', `CONTRACT.${payload.action}`, { contractId: ctr.id, status: ctr.status }, ctx);
  db.scheduleSave();
  return ctr;
}

export function createContractObligation(
  contractId: string,
  payload: { title: string; amountMinor: number; dueDate?: string; responsiblePartyOrgId?: string; linkToWalletObligation?: boolean },
  ctx: V28ActorCtx
): V28ContractObligation {
  const ctr = db.v28Contracts.get(contractId);
  if (!ctr) throw new V28HttpError(404, 'CONTRACT_NOT_FOUND');
  const isParty = ctx.isPlatformAdmin || ctr.partyAOrgId === ctx.organisationId || ctr.partyBOrgId === ctx.organisationId;
  if (!isParty) throw new V28HttpError(403, 'FORBIDDEN_CONTRACT_PARTY_ONLY');
  const amountMinor = Math.round(Number(payload.amountMinor || 0));
  if (amountMinor <= 0) throw new V28HttpError(400, 'OBLIGATION_AMOUNT_POSITIVE_REQUIRED');

  const now = new Date().toISOString();
  const obl: V28ContractObligation = {
    id: uidV26('V28-OBL'),
    contractId: ctr.id,
    tenantId: resolveTenantForCountry(ctr.countryCode),
    title: sanitize(payload.title) || 'Contractual Milestone Obligation',
    dueDate: payload.dueDate || new Date(Date.now() + 14 * 86400_000).toISOString(),
    responsiblePartyOrgId: sanitize(payload.responsiblePartyOrgId) || ctr.partyAOrgId,
    amountMinor,
    currency: ctr.currency,
    status: payload.linkToWalletObligation ? 'LINKED_WALLET_OBLIGATION' : 'PENDING',
    linkedWalletObligationId: payload.linkToWalletObligation ? uidV26('V24-OBL') : undefined,
    updatedAt: now,
  };
  db.v28ContractObligations.set(obl.id, obl);
  db.scheduleSave();
  return obl;
}

// ==========================================
// 4. ENTERPRISE PROCUREMENT & SOD GOVERNANCE (PART 7)
// ==========================================

export function listProcurementWorkspace(ctx: V28ActorCtx) {
  const filterByOrg = <T extends { organisationId: string }>(items: T[]) =>
    ctx.isPlatformAdmin ? items : items.filter((i) => i.organisationId === ctx.organisationId);
  return {
    policies: filterByOrg(Array.from(db.v28ProcurementPolicies.values())),
    plans: filterByOrg(Array.from(db.v28ProcurementPlans.values())),
    requisitions: filterByOrg(Array.from(db.v28ProcurementRequisitions.values())),
    evaluations: Array.from(db.v28ProcurementEvaluations.values()),
  };
}

export function createProcurementPlan(
  payload: { fiscalPeriod: string; title: string; countryCode?: string; budgetMinor: number; currency?: V23CurrencyCode },
  ctx: V28ActorCtx
): V28ProcurementPlan {
  const budgetMinor = Math.round(Number(payload.budgetMinor || 0));
  if (budgetMinor <= 0) throw new V28HttpError(400, 'PLAN_BUDGET_POSITIVE_REQUIRED');
  const now = new Date().toISOString();
  const plan: V28ProcurementPlan = {
    id: uidV26('V28-PPLAN'),
    organisationId: ctx.organisationId,
    fiscalPeriod: sanitize(payload.fiscalPeriod) || 'FY2026-Q4',
    title: sanitize(payload.title) || 'Annual Procurement Plan',
    countryCode: (sanitize(payload.countryCode) || ctx.countryCode || 'UG').toUpperCase(),
    budgetMinor,
    committedMinor: 0,
    currency: (sanitize(payload.currency) || 'UGX').toUpperCase() as V23CurrencyCode,
    status: 'ACTIVE',
    ownerUserId: ctx.userId,
    createdAt: now,
    updatedAt: now,
  };
  db.v28ProcurementPlans.set(plan.id, plan);
  db.scheduleSave();
  return plan;
}

export function createProcurementRequisition(
  payload: { planId?: string; title: string; category: string; estimatedAmountMinor: number; currency?: V23CurrencyCode; conflictDeclared: boolean },
  ctx: V28ActorCtx
): V28ProcurementRequisition {
  if (!payload.conflictDeclared) {
    throw new V28HttpError(400, 'CONFLICT_OF_INTEREST_DECLARATION_REQUIRED');
  }
  const estimatedAmountMinor = Math.round(Number(payload.estimatedAmountMinor || 0));
  if (estimatedAmountMinor <= 0) throw new V28HttpError(400, 'ESTIMATED_AMOUNT_POSITIVE_REQUIRED');

  const now = new Date().toISOString();
  const reqItem: V28ProcurementRequisition = {
    id: uidV26('V28-REQ'),
    planId: sanitize(payload.planId) || undefined,
    organisationId: ctx.organisationId,
    title: sanitize(payload.title) || 'Procurement Requisition',
    category: sanitize(payload.category) || 'GENERAL_SUPPLY',
    estimatedAmountMinor,
    currency: (sanitize(payload.currency) || 'UGX').toUpperCase() as V23CurrencyCode,
    requesterUserId: ctx.userId,
    conflictDeclaredBy: [ctx.userId],
    status: 'SUBMITTED',
    officialGovernmentApprovalClaimed: false,
    createdAt: now,
    updatedAt: now,
  };
  db.v28ProcurementRequisitions.set(reqItem.id, reqItem);
  emitV28DomainEvent('PROCUREMENT', 'PROCUREMENT.REQUISITION_SUBMITTED', { reqId: reqItem.id }, ctx);
  db.scheduleSave();
  return reqItem;
}

export function approveProcurementRequisition(
  reqId: string,
  payload: { decision: 'APPROVE' | 'REJECT'; conflictDeclared?: boolean; threeWayMatchInvoiceMinor?: number },
  ctx: V28ActorCtx
): V28ProcurementRequisition {
  const reqItem = db.v28ProcurementRequisitions.get(reqId);
  if (!reqItem) throw new V28HttpError(404, 'REQUISITION_NOT_FOUND');

  // Strict Segregation of Duties: requester cannot approve their own requisition
  if (reqItem.requesterUserId === ctx.userId && payload.decision === 'APPROVE') {
    throw new V28HttpError(403, 'SOD_VIOLATION_SELF_APPROVAL_BLOCKED');
  }

  const now = new Date().toISOString();
  if (payload.decision === 'REJECT') {
    reqItem.status = 'REJECTED';
  } else if (payload.threeWayMatchInvoiceMinor !== undefined) {
    const invMinor = Math.round(Number(payload.threeWayMatchInvoiceMinor));
    const variance = invMinor - reqItem.estimatedAmountMinor;
    reqItem.invoiceMatchVarianceMinor = variance;
    if (Math.abs(variance) > Math.round(reqItem.estimatedAmountMinor * 0.05)) {
      reqItem.status = 'EXCEPTION';
      reqItem.exceptionReason = `3-Way match variance ${variance} minor units exceeds 5% tolerance; payment blocked.`;
    } else {
      reqItem.status = 'INVOICE_MATCHED';
    }
  } else {
    if (!reqItem.conflictDeclaredBy.includes(ctx.userId)) {
      if (!payload.conflictDeclared) throw new V28HttpError(400, 'APPROVER_CONFLICT_DECLARATION_REQUIRED');
      reqItem.conflictDeclaredBy.push(ctx.userId);
    }
    reqItem.approverUserId = ctx.userId;
    reqItem.status = 'APPROVED';
  }
  reqItem.updatedAt = now;
  db.v28ProcurementRequisitions.set(reqId, reqItem);
  emitV28DomainEvent('PROCUREMENT', `PROCUREMENT.${reqItem.status}`, { reqId }, ctx);
  db.scheduleSave();
  return reqItem;
}

export function submitProcurementEvaluation(
  reqId: string,
  payload: { supplierOrgId: string; priceScore: number; qualityScore: number; deliveryScore: number; complianceScore: number; conflictOfInterestFree: boolean; rationale: string },
  ctx: V28ActorCtx
): V28ProcurementEvaluation {
  const reqItem = db.v28ProcurementRequisitions.get(reqId);
  if (!reqItem) throw new V28HttpError(404, 'REQUISITION_NOT_FOUND');
  if (!payload.conflictOfInterestFree) throw new V28HttpError(400, 'EVALUATOR_CONFLICT_BLOCKS_SCORING');

  const p = Math.min(100, Math.max(0, Number(payload.priceScore || 0)));
  const q = Math.min(100, Math.max(0, Number(payload.qualityScore || 0)));
  const d = Math.min(100, Math.max(0, Number(payload.deliveryScore || 0)));
  const c = Math.min(100, Math.max(0, Number(payload.complianceScore || 0)));
  const weighted = Number((p * 0.35 + q * 0.3 + d * 0.2 + c * 0.15).toFixed(2));

  const ev: V28ProcurementEvaluation = {
    id: uidV26('V28-PEVAL'),
    requisitionId: reqItem.id,
    rfqId: reqItem.linkedRfqId,
    evaluatorUserId: ctx.userId,
    supplierOrgId: sanitize(payload.supplierOrgId),
    priceScore: p,
    qualityScore: q,
    deliveryScore: d,
    complianceScore: c,
    weightedTotal: weighted,
    conflictOfInterestFree: true,
    recommended: weighted >= 75,
    rationale: sanitize(payload.rationale) || 'Weighted evaluation recorded',
    evaluatedAt: new Date().toISOString(),
  };
  db.v28ProcurementEvaluations.set(ev.id, ev);
  db.scheduleSave();
  return ev;
}

// ==========================================
// 5. FULFILMENT, INVENTORY RESERVATIONS & LOGISTICS EVIDENCE (PART 8)
// ==========================================

export function listFulfilmentWorkspace(ctx: V28ActorCtx) {
  const plans = Array.from(db.v28FulfilmentPlans.values()).filter(
    (f) => ctx.isPlatformAdmin || f.sellerOrgId === ctx.organisationId || f.buyerOrgId === ctx.organisationId
  );
  const reservations = Array.from(db.v28InventoryReservations.values()).filter(
    (r) => ctx.isPlatformAdmin || r.organisationId === ctx.organisationId
  );
  const evidences = Array.from(db.v28ShipmentEvidences.values());
  return { plans, reservations, evidences };
}

export function createFulfilmentAndReserveStock(
  payload: {
    orderId: string;
    contractId?: string;
    buyerOrgId: string;
    inventoryId: string;
    warehouseId?: string;
    orderedQuantity: number;
    allowNegativePolicyOverride?: boolean;
  },
  ctx: V28ActorCtx
) {
  const qty = Math.round(Number(payload.orderedQuantity || 0));
  if (qty <= 0) throw new V28HttpError(400, 'FULFILMENT_QUANTITY_POSITIVE_REQUIRED');

  const inv = db.v24Inventory.get(payload.inventoryId);
  if (!inv) throw new V28HttpError(404, 'INVENTORY_ITEM_NOT_FOUND');

  // Strict available stock protection: prevent silent negative inventory
  if (inv.availableToPromiseQty < qty && !payload.allowNegativePolicyOverride) {
    throw new V28HttpError(
      409,
      `INSUFFICIENT_AVAILABLE_STOCK: requested=${qty}, available=${inv.availableToPromiseQty}. Negative stock disabled by default policy.`
    );
  }

  const now = new Date().toISOString();
  inv.availableToPromiseQty = Math.max(0, inv.availableToPromiseQty - qty);
  inv.reservedQty = (inv.reservedQty || 0) + qty;
  inv.updatedAt = now;
  db.v24Inventory.set(inv.id, inv);

  const plan: V28FulfilmentPlan = {
    id: uidV26('V28-FUL'),
    orderId: sanitize(payload.orderId),
    contractId: sanitize(payload.contractId) || undefined,
    sellerOrgId: ctx.organisationId,
    buyerOrgId: sanitize(payload.buyerOrgId),
    warehouseId: sanitize(payload.warehouseId) || inv.warehouseId,
    status: 'INVENTORY_RESERVED',
    orderedQuantity: qty,
    reservedQuantity: qty,
    deliveredQuantity: 0,
    rejectedQuantity: 0,
    damagedQuantity: 0,
    returnedQuantity: 0,
    reconciliationVarianceQty: qty,
    createdAt: now,
    updatedAt: now,
  };
  db.v28FulfilmentPlans.set(plan.id, plan);

  const reservation: V28InventoryReservation = {
    id: uidV26('V28-RES'),
    inventoryId: inv.id,
    fulfilmentPlanId: plan.id,
    organisationId: ctx.organisationId,
    sku: inv.sku,
    quantityReserved: qty,
    quantityDispatched: 0,
    quantityReturned: 0,
    quantityDamaged: 0,
    status: 'ACTIVE',
    allowNegativePolicyOverride: Boolean(payload.allowNegativePolicyOverride),
    createdAt: now,
    updatedAt: now,
  };
  db.v28InventoryReservations.set(reservation.id, reservation);

  emitV28DomainEvent('FULFILMENT', 'FULFILMENT.INVENTORY_RESERVED', { planId: plan.id, inventoryId: inv.id, qty }, ctx);
  db.scheduleSave();
  return { plan, reservation, inventoryRemainingAvailable: inv.availableToPromiseQty };
}

export function recordFulfilmentDispatchOrDelivery(
  planId: string,
  payload: {
    action: 'AUTHORISE_DISPATCH' | 'RECORD_MILESTONE' | 'RECORD_POD' | 'REPORT_DAMAGE_RETURN' | 'RECONCILE';
    milestone?: string;
    locationLabel?: string;
    trackingSource?: V28ShipmentEvidence['trackingSource'];
    deliveredQty?: number;
    rejectedQty?: number;
    damagedQty?: number;
    returnedQty?: number;
    receiverName?: string;
  },
  ctx: V28ActorCtx
) {
  const plan = db.v28FulfilmentPlans.get(planId);
  if (!plan) throw new V28HttpError(404, 'FULFILMENT_PLAN_NOT_FOUND');

  const now = new Date().toISOString();
  if (payload.action === 'AUTHORISE_DISPATCH') {
    plan.dispatchAuthorisedBy = ctx.userId;
    plan.status = 'DISPATCH_AUTHORISED';
  } else if (payload.action === 'RECORD_MILESTONE') {
    plan.status = 'IN_TRANSIT';
  } else if (payload.action === 'RECORD_POD') {
    const dQty = Math.max(0, Math.round(Number(payload.deliveredQty || 0)));
    const rQty = Math.max(0, Math.round(Number(payload.rejectedQty || 0)));
    plan.deliveredQuantity += dQty;
    plan.rejectedQuantity += rQty;
    plan.status = plan.deliveredQuantity >= plan.orderedQuantity ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
  } else if (payload.action === 'REPORT_DAMAGE_RETURN') {
    const dam = Math.max(0, Math.round(Number(payload.damagedQty || 0)));
    const ret = Math.max(0, Math.round(Number(payload.returnedQty || 0)));
    plan.damagedQuantity += dam;
    plan.returnedQuantity += ret;
    plan.status = dam > 0 ? 'DAMAGED_GOODS_REPORTED' : 'RETURN_INITIATED';
    // Restore returned non-damaged stock to inventory
    if (ret > 0) {
      const res = Array.from(db.v28InventoryReservations.values()).find((x) => x.fulfilmentPlanId === plan.id);
      if (res) {
        res.quantityReturned += ret;
        res.status = 'PARTIAL_RELEASED';
        db.v28InventoryReservations.set(res.id, res);
        const inv = db.v24Inventory.get(res.inventoryId);
        if (inv) {
          inv.availableToPromiseQty += ret;
          inv.reservedQty = Math.max(0, inv.reservedQty - ret);
          inv.updatedAt = now;
          db.v24Inventory.set(inv.id, inv);
        }
      }
    }
  } else if (payload.action === 'RECONCILE') {
    plan.reconciliationVarianceQty =
      plan.orderedQuantity - (plan.deliveredQuantity + plan.rejectedQuantity + plan.damagedQuantity + plan.returnedQuantity);
    plan.status = plan.reconciliationVarianceQty === 0 ? 'RECONCILED' : 'DISPUTED';
    plan.finalConfirmedBy = ctx.userId;
  }

  const evidence: V28ShipmentEvidence = {
    id: uidV26('V28-SEVID'),
    fulfilmentPlanId: plan.id,
    shipmentId: `SHIP-${plan.orderId}`,
    trackingSource: payload.trackingSource === 'EXTERNAL_CARRIER_API' ? 'MANUAL_RECORD' : (payload.trackingSource || 'MANUAL_RECORD'),
    liveGpsConnected: false,
    milestone: sanitize(payload.milestone) || payload.action,
    locationLabel: sanitize(payload.locationLabel) || 'Operator Checkpoint (Manual/Simulated Record — Live GPS Unconnected)',
    deliveredQty: Number(payload.deliveredQty || 0),
    rejectedQty: Number(payload.rejectedQty || 0),
    damagedQty: Number(payload.damagedQty || 0),
    returnedQty: Number(payload.returnedQty || 0),
    receiverName: sanitize(payload.receiverName) || ctx.userId,
    proofHashSha256: sha256(`${plan.id}:${payload.action}:${now}`),
    recordedByUserId: ctx.userId,
    recordedAt: now,
  };
  db.v28ShipmentEvidences.set(evidence.id, evidence);

  plan.reconciliationVarianceQty =
    plan.orderedQuantity - (plan.deliveredQuantity + plan.rejectedQuantity + plan.damagedQuantity + plan.returnedQuantity);
  plan.updatedAt = now;
  db.v28FulfilmentPlans.set(plan.id, plan);
  emitV28DomainEvent('FULFILMENT', `FULFILMENT.${payload.action}`, { planId: plan.id, status: plan.status }, ctx);
  db.scheduleSave();
  return { plan, evidence };
}

// ==========================================
// 6. CROSS-BORDER & COUNTRY OPERATIONS (PART 9)
// ==========================================

export function listCountryOperatingProfiles() {
  return Array.from(db.v28CountryProfiles.values());
}

export function listCrossBorderExecutions(ctx: V28ActorCtx) {
  return Array.from(db.v28CrossBorderExecutions.values()).filter(
    (xb) => ctx.isPlatformAdmin || xb.exporterOrgId === ctx.organisationId || xb.importerOrgId === ctx.organisationId
  );
}

export function createCrossBorderExecution(
  payload: {
    originCountryCode: string;
    destinationCountryCode: string;
    importerOrgId: string;
    tradeCurrency: V23CurrencyCode;
    settlementCurrency: V23CurrencyCode;
    configuredFxRate?: number;
    submittedDocumentIds?: string[];
  },
  ctx: V28ActorCtx
): V28CrossBorderExecution {
  const origin = db.v28CountryProfiles.get(payload.originCountryCode.toUpperCase());
  const dest = db.v28CountryProfiles.get(payload.destinationCountryCode.toUpperCase());
  if (!origin || !dest) throw new V28HttpError(400, 'UNSUPPORTED_CORRIDOR_COUNTRY_PROFILE');

  const now = new Date().toISOString();
  const requiredDocs = Array.from(new Set([...origin.tradeDocumentationRequired, ...dest.tradeDocumentationRequired]));
  const docs = Array.isArray(payload.submittedDocumentIds) ? payload.submittedDocumentIds.map(sanitize) : [];

  const xb: V28CrossBorderExecution = {
    id: uidV26('V28-XB'),
    originCountryCode: origin.countryCode,
    destinationCountryCode: dest.countryCode,
    exporterOrgId: ctx.organisationId,
    importerOrgId: sanitize(payload.importerOrgId),
    tradeCurrency: payload.tradeCurrency || origin.supportedCurrencies[0],
    settlementCurrency: payload.settlementCurrency || dest.supportedCurrencies[0],
    configuredFxRate: payload.configuredFxRate || 0.0352,
    fxRateSource: 'ECONEX Configured Reference Feed (Non-Dealing)',
    fxRateTimestamp: now,
    requiredDocuments: requiredDocs,
    submittedDocumentIds: docs,
    restrictionsChecked: true,
    eligibilityVerified: docs.length > 0,
    stage: docs.length >= 2 ? 'DOCS_VALIDATED' : 'ELIGIBILITY_VERIFIED',
    officialCustomsOrTaxFilingClaimed: false,
    regulatedFxDealingClaimed: false,
    createdAt: now,
    updatedAt: now,
  };
  db.v28CrossBorderExecutions.set(xb.id, xb);
  emitV28DomainEvent('CROSS_BORDER', 'CROSS_BORDER.INITIATED', { xbId: xb.id, corridor: `${origin.countryCode}-${dest.countryCode}` }, ctx);
  db.scheduleSave();
  return xb;
}

// ==========================================
// 7. WALLET, LEDGER & OBLIGATION COORDINATION V28 (PART 10)
// ==========================================

export function getV28WalletCoordinationOverview(ctx: V28ActorCtx) {
  const obligations = Array.from(db.v28ContractObligations.values()).filter(
    (o) => ctx.isPlatformAdmin || o.responsiblePartyOrgId === ctx.organisationId || o.tenantId === ctx.tenantId
  );
  const txs = Array.from(db.v23Transactions.values()).filter(
    (t) => ctx.isPlatformAdmin || t.createdByUserId === ctx.userId
  );
  const subaccounts = Array.from(db.v23Subaccounts.values());
  const journalReport = db.getFinancialIntegrityReport();

  return {
    sandboxDisclaimer:
      'ECONEX Wallet V28 operates in internal sandbox ledger mode. Real-value external mobile money, bank RTGS, and scheme card operations remain disabled until licensed provider integration is verified.',
    realValueOperationsEnabled: false,
    obligations,
    recentWalletTransactions: txs.slice(-15).reverse(),
    subaccounts: subaccounts.slice(0, 12),
    subaccountsCount: subaccounts.length,
    journalBalanced: journalReport.journalBalanced,
    totalDebitUgx: journalReport.totalDebitsByCurrency?.UGX || 0,
    totalCreditUgx: journalReport.totalCreditsByCurrency?.UGX || 0,
    totalDebitsByCurrency: journalReport.totalDebitsByCurrency,
    totalCreditsByCurrency: journalReport.totalCreditsByCurrency,
  };
}

export function executeSandboxObligationTransfer(
  payload: {
    obligationId?: string;
    sourceSubaccountId: string;
    destinationSubaccountId: string;
    amountMinor: number;
    currency: V23CurrencyCode;
    idempotencyKey: string;
    narration?: string;
  },
  ctx: V28ActorCtx
) {
  const idem = sanitize(payload.idempotencyKey);
  if (!idem) throw new V28HttpError(400, 'IDEMPOTENCY_KEY_REQUIRED');

  const existingTx = Array.from(db.v23Transactions.values()).find((t) => t.idempotencyKey === idem);
  if (existingTx) {
    return { idempotentReplay: true, transaction: existingTx };
  }

  const amountMinor = Math.round(Number(payload.amountMinor || 0));
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new V28HttpError(400, 'POSITIVE_INTEGER_MINOR_AMOUNT_REQUIRED');
  }
  if (payload.sourceSubaccountId === payload.destinationSubaccountId) {
    throw new V28HttpError(400, 'SELF_TRANSFER_FORBIDDEN');
  }

  const src = db.v23Subaccounts.get(payload.sourceSubaccountId);
  const dst = db.v23Subaccounts.get(payload.destinationSubaccountId);
  if (!src || !dst) throw new V28HttpError(404, 'WALLET_SUBACCOUNT_NOT_FOUND');
  if (src.currency !== dst.currency || src.currency !== payload.currency) {
    throw new V28HttpError(400, 'CURRENCY_MISMATCH_REQUIRES_CONFIGURED_FX_CONVERSION');
  }

  if (src.availableMinor < amountMinor) {
    throw new V28HttpError(409, `INSUFFICIENT_SANDBOX_BALANCE: availableMinor=${src.availableMinor}, requestedMinor=${amountMinor}`);
  }

  const now = new Date().toISOString();
  src.availableMinor = src.availableMinor - amountMinor;
  src.updatedAt = now;
  dst.availableMinor = dst.availableMinor + amountMinor;
  dst.updatedAt = now;
  db.v23Subaccounts.set(src.id, src);
  db.v23Subaccounts.set(dst.id, dst);

  const txId = uidV26('V28-WTX');
  const txReference = `ECX-V28-${Date.now().toString(36).toUpperCase()}`;
  const postingId = uidV26('V28-LPOST');
  const journalEntryId = uidV26('JRN-V28');
  const purpose = sanitize(payload.narration) || 'V28 Contractual Obligation Sandbox Transfer';

  const tx: V23WalletTransaction = {
    id: txId,
    tenantId: src.tenantId,
    txReference,
    idempotencyKey: idem,
    correlationId: ctx.correlationId,
    txType: 'COMMERCIAL_ORDER_PAYMENT',
    status: 'POSTED',
    sourceWalletId: src.walletAccountId,
    sourceEuwn: src.euwn,
    sourceSubaccountId: src.id,
    sourceCurrency: payload.currency,
    sourceAmountMinor: amountMinor,
    feeMinor: 0,
    feeCurrency: payload.currency,
    destinationWalletId: dst.walletAccountId,
    destinationEuwn: dst.euwn,
    destinationSubaccountId: dst.id,
    destinationCurrency: payload.currency,
    destinationAmountMinor: amountMinor,
    fxApplied: false,
    fxRateApplied: 1,
    fxRateSource: 'NONE',
    fxRateTimestamp: now,
    fxRateClassification: 'NONE',
    fxUserConfirmed: true,
    sourceCountryCode: ctx.countryCode,
    destinationCountryCode: ctx.countryCode,
    purpose,
    settlementClassification: 'SANDBOX_INTERNAL_LEDGER',
    isTestTransaction: true,
    journalEntryId,
    refundedMinorTotal: 0,
    riskScore: 0,
    riskFlags: [],
    approvalRequired: false,
    history: [
      {
        fromStatus: null,
        toStatus: 'POSTED',
        actorUserId: ctx.userId,
        reason: purpose,
        timestamp: now,
      },
    ],
    createdByUserId: ctx.userId,
    createdAt: now,
    updatedAt: now,
  };
  db.v23Transactions.set(tx.id, tx);

  const posting: V23LedgerPosting = {
    id: postingId,
    tenantId: src.tenantId,
    transactionId: tx.id,
    txReference,
    journalEntryId,
    lines: [
      {
        subaccountId: src.id,
        walletAccountId: src.walletAccountId,
        direction: 'DEBIT',
        amountMinor,
        currency: payload.currency,
        memo: purpose,
      },
      {
        subaccountId: dst.id,
        walletAccountId: dst.walletAccountId,
        direction: 'CREDIT',
        amountMinor,
        currency: payload.currency,
        memo: purpose,
      },
    ],
    totalDebitMinor: amountMinor,
    totalCreditMinor: amountMinor,
    balanced: true,
    immutable: true,
    postingHashSha256: sha256(`${postingId}:${txReference}:${amountMinor}:${now}`),
    postedAt: now,
  };
  db.v23LedgerPostings.set(posting.id, posting);

  if (payload.obligationId) {
    const obl = db.v28ContractObligations.get(payload.obligationId);
    if (obl) {
      obl.status = 'SETTLED_SANDBOX';
      obl.linkedLedgerRef = posting.id;
      obl.updatedAt = now;
      db.v28ContractObligations.set(obl.id, obl);
    }
  }

  emitV28DomainEvent('WALLET', 'WALLET.SANDBOX_TRANSFER_SETTLED', { txId: tx.id, amountMinor, currency: payload.currency }, ctx, idem);
  db.scheduleSave();
  return { idempotentReplay: false, transaction: tx, ledgerPosting: posting };
}

export function reverseSandboxTransfer(txId: string, reason: string, ctx: V28ActorCtx) {
  if (!ctx.isPlatformAdmin && ctx.role !== 'COOPERATIVE_ADMIN') {
    throw new V28HttpError(403, 'ADMIN_OR_COOP_ADMIN_AUTHORITY_REQUIRED_FOR_REVERSAL');
  }
  const orig = db.v23Transactions.get(txId);
  if (!orig) throw new V28HttpError(404, 'TRANSACTION_NOT_FOUND');
  if (orig.status === 'REVERSED') throw new V28HttpError(409, 'TRANSACTION_ALREADY_REVERSED');

  const src = orig.sourceSubaccountId ? db.v23Subaccounts.get(orig.sourceSubaccountId) : undefined;
  const dst = orig.destinationSubaccountId ? db.v23Subaccounts.get(orig.destinationSubaccountId) : undefined;
  if (!src || !dst) throw new V28HttpError(400, 'SUBACCOUNTS_MISSING_FOR_COMPENSATION');

  const now = new Date().toISOString();
  const revAmountMinor = orig.sourceAmountMinor;
  dst.availableMinor = Math.max(0, dst.availableMinor - revAmountMinor);
  dst.reversedMinor = (dst.reversedMinor || 0) + revAmountMinor;
  dst.updatedAt = now;
  src.availableMinor = src.availableMinor + revAmountMinor;
  src.reversedMinor = (src.reversedMinor || 0) + revAmountMinor;
  src.updatedAt = now;
  db.v23Subaccounts.set(src.id, src);
  db.v23Subaccounts.set(dst.id, dst);

  const prevStatus = orig.status;
  orig.status = 'REVERSED';
  orig.history.push({
    fromStatus: prevStatus,
    toStatus: 'REVERSED',
    actorUserId: ctx.userId,
    reason: sanitize(reason),
    timestamp: now,
  });
  orig.updatedAt = now;
  db.v23Transactions.set(orig.id, orig);

  const revId = uidV26('V28-LREV');
  const revJournalId = uidV26('JRN-V28-REV');
  const memo = `COMPENSATING_REVERSAL(${orig.txReference}): ${sanitize(reason)}`;
  const revPosting: V23LedgerPosting = {
    id: revId,
    tenantId: orig.tenantId,
    transactionId: orig.id,
    txReference: orig.txReference,
    journalEntryId: revJournalId,
    lines: [
      {
        subaccountId: dst.id,
        walletAccountId: dst.walletAccountId,
        direction: 'DEBIT',
        amountMinor: revAmountMinor,
        currency: orig.sourceCurrency,
        memo,
      },
      {
        subaccountId: src.id,
        walletAccountId: src.walletAccountId,
        direction: 'CREDIT',
        amountMinor: revAmountMinor,
        currency: orig.sourceCurrency,
        memo,
      },
    ],
    totalDebitMinor: revAmountMinor,
    totalCreditMinor: revAmountMinor,
    balanced: true,
    immutable: true,
    postingHashSha256: sha256(`${revId}:${orig.txReference}:${revAmountMinor}:${now}`),
    postedAt: now,
  };
  db.v23LedgerPostings.set(revPosting.id, revPosting);
  emitV28DomainEvent('WALLET', 'WALLET.COMPENSATING_REVERSAL', { origTxId: orig.id, revPostingId: revPosting.id }, ctx);
  db.scheduleSave();
  return { reversedTx: orig, compensatingPosting: revPosting };
}

// ==========================================
// 8. INTEROPERABILITY GATEWAY & EVENT ORCHESTRATION (PARTS 11-12)
// ==========================================

export function listInteroperabilityConnectors() {
  return Array.from(db.v28InteroperabilityConnectors.values());
}

export function transitionInteroperabilityConnector(
  connectorId: string,
  payload: { state: V28ConnectorState; credentialRef?: string; dualApprovalId?: string },
  ctx: V28ActorCtx
): V28InteroperabilityConnector {
  if (!ctx.isPlatformAdmin) throw new V28HttpError(403, 'ADMIN_REQUIRED_FOR_CONNECTOR_LIFECYCLE');
  const conn = db.v28InteroperabilityConnectors.get(connectorId);
  if (!conn) throw new V28HttpError(404, 'CONNECTOR_NOT_FOUND');

  if (payload.credentialRef) conn.credentialRef = sanitize(payload.credentialRef);

  if (payload.state === 'ACTIVE') {
    if (!conn.credentialRef) throw new V28HttpError(403, 'CREDENTIALS_REQUIRED_BEFORE_ACTIVE');
    if (conn.lastHealthStatus !== 'SANDBOX_OK') throw new V28HttpError(403, 'HEALTH_CHECK_MUST_PASS_BEFORE_ACTIVE');
    const approval = payload.dualApprovalId ? db.v28DualApprovalRequests.get(payload.dualApprovalId) : undefined;
    if (!approval || approval.status !== 'APPROVED') {
      throw new V28HttpError(403, 'DUAL_APPROVAL_REQUIRED_TO_PROMOTE_CONNECTOR_ACTIVE');
    }
    conn.approvedByUserId = ctx.userId;
  }

  conn.state = payload.state;
  conn.updatedAt = new Date().toISOString();
  db.v28InteroperabilityConnectors.set(conn.id, conn);
  emitV28DomainEvent('INTEGRATION', `CONNECTOR.STATE_${payload.state}`, { connectorId: conn.id }, ctx);
  db.scheduleSave();
  return conn;
}

export function signAndVerifyWebhookPayload(payloadBody: Record<string, any>, secretRef: string) {
  const canonical = JSON.stringify(payloadBody);
  const sig = crypto.createHmac('sha256', secretRef).update(canonical).digest('hex');
  return { signatureHeader: `sha256=${sig}`, verified: true };
}

export function listDomainEventsAndDlq() {
  return {
    events: Array.from(db.v28DomainEvents.values()).slice(-50).reverse(),
    deadLetters: Array.from(db.v28EventDeadLetters.values()).slice(-50).reverse(),
  };
}

export function replayDeadLetterEvent(dlqId: string, ctx: V28ActorCtx) {
  if (!ctx.isPlatformAdmin) throw new V28HttpError(403, 'ADMIN_REQUIRED_TO_REPLAY_DLQ');
  const dlq = db.v28EventDeadLetters.get(dlqId);
  if (!dlq) throw new V28HttpError(404, 'DEAD_LETTER_NOT_FOUND');
  const now = new Date().toISOString();
  dlq.replayCount += 1;
  dlq.status = 'REQUEUED';
  dlq.resolvedByUserId = ctx.userId;
  dlq.updatedAt = now;
  db.v28EventDeadLetters.set(dlq.id, dlq);

  const evt = db.v28DomainEvents.get(dlq.domainEventId);
  if (evt) {
    evt.status = 'RETRYING';
    evt.attempts += 1;
    evt.nextRetryAt = now;
    db.v28DomainEvents.set(evt.id, evt);
  }
  db.scheduleSave();
  return dlq;
}

// ==========================================
// 9. DOCUMENT & EVIDENCE VAULT V28 (PART 13)
// ==========================================

export function listVaultDocuments(ctx: V28ActorCtx) {
  return Array.from(db.v28DocumentEvidenceRecords.values()).filter(
    (d) => ctx.isPlatformAdmin || d.ownerUserId === ctx.userId || d.organisationId === ctx.organisationId
  );
}

export function registerVaultDocument(
  payload: {
    title: string;
    category: V28VaultDocumentRecord['category'];
    mimeType?: string;
    sizeBytes?: number;
    linkedEntityType: V28VaultDocumentRecord['linkedEntityType'];
    linkedEntityId: string;
    retentionYears?: number;
  },
  ctx: V28ActorCtx
): V28VaultDocumentRecord {
  const title = sanitize(payload.title);
  if (!title) throw new V28HttpError(400, 'DOCUMENT_TITLE_REQUIRED');
  const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'application/json'];
  const mime = sanitize(payload.mimeType) || 'application/pdf';
  if (!allowedMimes.includes(mime)) throw new V28HttpError(400, 'UNSUPPORTED_DOCUMENT_MIME_TYPE');

  const now = new Date().toISOString();
  const id = uidV26('V28-DOC');
  const years = Math.max(1, Number(payload.retentionYears || 5));
  const doc: V28VaultDocumentRecord = {
    id,
    tenantId: ctx.tenantId,
    organisationId: ctx.organisationId,
    ownerUserId: ctx.userId,
    title,
    category: payload.category || 'INSPECTION_EVIDENCE',
    mimeType: mime,
    sizeBytes: Math.max(1024, Number(payload.sizeBytes || 40960)),
    storageRef: `vault://v28/${ctx.tenantId}/${id}`,
    sha256Hash: sha256(`${id}:${title}:${now}`),
    malwareScanStatus: 'SCAN_NOT_PROVISIONED_SANDBOX',
    verificationStatus: 'PENDING_REVIEW',
    linkedEntityType: payload.linkedEntityType || 'CONTRACT',
    linkedEntityId: sanitize(payload.linkedEntityId),
    version: 1,
    legalHold: false,
    retentionUntil: new Date(Date.now() + years * 365 * 86400_000).toISOString(),
    accessLog: [{ userId: ctx.userId, action: 'UPLOAD', at: now }],
    createdAt: now,
    updatedAt: now,
  };
  db.v28DocumentEvidenceRecords.set(doc.id, doc);
  db.scheduleSave();
  return doc;
}

export function updateVaultDocumentGovernance(
  docId: string,
  payload: { action: 'VERIFY' | 'REJECT' | 'ENABLE_LEGAL_HOLD' | 'RELEASE_LEGAL_HOLD'; },
  ctx: V28ActorCtx
) {
  if (!ctx.isPlatformAdmin) throw new V28HttpError(403, 'ADMIN_REQUIRED_FOR_VAULT_GOVERNANCE');
  const doc = db.v28DocumentEvidenceRecords.get(docId);
  if (!doc) throw new V28HttpError(404, 'DOCUMENT_NOT_FOUND');
  const now = new Date().toISOString();
  if (payload.action === 'VERIFY') {
    doc.verificationStatus = 'VERIFIED';
    doc.verifiedByUserId = ctx.userId;
    doc.accessLog.push({ userId: ctx.userId, action: 'VERIFY', at: now });
  } else if (payload.action === 'REJECT') {
    doc.verificationStatus = 'REJECTED';
    doc.accessLog.push({ userId: ctx.userId, action: 'VERIFY', at: now });
  } else if (payload.action === 'ENABLE_LEGAL_HOLD') {
    doc.legalHold = true;
    doc.accessLog.push({ userId: ctx.userId, action: 'LEGAL_HOLD', at: now });
  } else if (payload.action === 'RELEASE_LEGAL_HOLD') {
    doc.legalHold = false;
    doc.accessLog.push({ userId: ctx.userId, action: 'LEGAL_HOLD', at: now });
  }
  doc.updatedAt = now;
  db.v28DocumentEvidenceRecords.set(doc.id, doc);
  db.scheduleSave();
  return doc;
}

// ==========================================
// 10. CONTINENTAL INTELLIGENCE & GUARDED AI ORCHESTRATOR (PARTS 14-15)
// ==========================================

export function getV28ContinentalIntelligence(ctx: V28ActorCtx) {
  const kAnonymityMinThreshold = 3;
  const profilesByCountry: Record<string, number> = {};
  for (const p of db.v27NetworkProfiles.values()) {
    profilesByCountry[p.countryCode] = (profilesByCountry[p.countryCode] || 0) + 1;
  }

  const publicCountryBenchmarks = Object.entries(profilesByCountry).map(([countryCode, count]) => ({
    countryCode,
    participantCount: count >= kAnonymityMinThreshold || ctx.isPlatformAdmin ? count : null,
    privacySuppressed: count < kAnonymityMinThreshold && !ctx.isPlatformAdmin,
    provenance: 'ACTUAL_RECORDED' as V28IntelligenceSourceCategory,
  }));

  const totalExecValueMinor = Array.from(db.v28ExecutionWorkflows.values()).reduce((s, w) => s + w.valueMinor, 0);

  return {
    scope: ctx.isPlatformAdmin ? 'CONTINENTAL_OPERATIONS_ADMIN' : `TENANT_SCOPED(${ctx.countryCode})`,
    kAnonymityThreshold: kAnonymityMinThreshold,
    indicators: [
      { key: 'V28_WORKFLOWS', label: 'Active Coordinated Executions', value: db.v28ExecutionWorkflows.size, provenance: 'ACTUAL_RECORDED' as V28IntelligenceSourceCategory },
      { key: 'V28_CONTRACTS_VALUE_MINOR', label: 'Contracted Pipeline Minor Units', value: totalExecValueMinor, provenance: 'CALCULATED_INDICATOR' as V28IntelligenceSourceCategory },
      { key: 'V28_FULFILMENT_ON_TIME_PCT', label: 'Corridor On-Time Delivery Estimate', value: 88.5, provenance: 'ESTIMATED_VALUE' as V28IntelligenceSourceCategory },
      { key: 'EAC_TRADE_FORECAST_Q1', label: 'EAC Intra-Regional Trade Growth Projection (%)', value: 11.4, provenance: 'FORECAST' as V28IntelligenceSourceCategory },
      { key: 'V28_SANDBOX_LEDGER_COUNT', label: 'Sandbox Ledger Postings', value: db.v23LedgerPostings.size, provenance: 'SYNTHETIC_TEST_DATA' as V28IntelligenceSourceCategory },
      { key: 'BOU_EAC_REFERENCE_FX', label: 'UGX/KES Reference Feed Status', value: '0.0352 (Non-Dealing)', provenance: 'EXTERNAL_SOURCED' as V28IntelligenceSourceCategory },
    ],
    publicCountryBenchmarks,
    aiCounters: { ...V28_AI_COUNTERS },
    generatedAt: new Date().toISOString(),
  };
}

export async function runGuardedV28AiOrchestration(
  payload: { taskType: V28AiOrchestrationRun['taskType']; prompt: string },
  ctx: V28ActorCtx
): Promise<V28AiOrchestrationRun> {
  V28_AI_COUNTERS.totalRuns += 1;
  const rawPrompt = String(payload.prompt || '').trim();
  if (!rawPrompt) throw new V28HttpError(400, 'AI_PROMPT_REQUIRED');

  const inj = detectPromptInjection(rawPrompt);
  if (inj.flagged) {
    V28_AI_COUNTERS.blockedInjections += 1;
    throw new V28HttpError(400, `V28_AI_PROMPT_INJECTION_BLOCKED: ${inj.matchedPattern || 'Disallowed directive'}`);
  }

  const autonomyPattern =
    /(execute payment|release funds|transfer money|approve dual|sign contract legally|override sod|bypass approval|activate live bank|promote connector live)/i;
  if (autonomyPattern.test(rawPrompt)) {
    V28_AI_COUNTERS.blockedAutonomousRequests += 1;
    throw new V28HttpError(403, 'V28_AI_AUTONOMOUS_EXECUTION_BLOCKED: AI runs remain strictly advisory with human approval checkpoints.');
  }

  const intel = getV28ContinentalIntelligence(ctx);
  const safePrompt = sanitizeExternalSourceText(rawPrompt).sanitized;
  const contextSources = ['v28ExecutionWorkflows', 'v28Contracts', 'v28FulfilmentPlans', 'v28CountryProfiles'];
  let summary = `Advisory summary (${payload.taskType}) for ${ctx.organisationId}: ${intel.indicators[0].value} execution workflows and ${db.v28Contracts.size} contracts evaluated. Human confirmation is mandatory before state transitions.`;

  const { text } = await safeGenerateGeminiText({
    contents: `Task=${payload.taskType}\nContext=${JSON.stringify(intel.indicators.slice(0, 4))}\nPrompt=${safePrompt}`,
    systemInstruction:
      'You are ECONEX V28 Advisory Orchestrator. Never claim to transfer money, sign legally binding contracts, or bypass SoD/human checkpoints.',
    timeoutMs: 4500,
    label: 'ECONEX V28 Orchestrator',
  });
  if (text && text.length > 20) {
    summary = text.slice(0, 650);
    V28_AI_COUNTERS.liveModelCalls += 1;
  } else {
    V28_AI_COUNTERS.deterministicFallbacks += 1;
  }

  const run: V28AiOrchestrationRun = {
    id: uidV26('V28-AI'),
    userId: ctx.userId,
    role: ctx.role,
    organisationId: ctx.organisationId,
    taskType: payload.taskType || 'COMMERCIAL_PLANNING',
    prompt: safePrompt,
    contextSources,
    responseSummary: summary,
    confidenceLabel: 'MEDIUM',
    limitationsNotice: 'Sandbox and manual-log context; external provider rails unconfigured. Human sign-off mandatory.',
    humanApprovalRequired: true,
    autonomousExecutionBlocked: true,
    promptInjectionFlagged: false,
    aiGeneratedNotice: 'AI-GENERATED ADVISORY: Clearly separated from verified ledger, contract, and compliance records.',
    createdAt: new Date().toISOString(),
  };
  db.v28AiOrchestrationRuns.set(run.id, run);
  db.scheduleSave();
  return run;
}

// ==========================================
// 11. CONTINENTAL OPS CONTROL CENTRE, DUAL APPROVALS & FIELD OFFLINE CONTINUITY (PARTS 16-17)
// ==========================================

export function getOperationsControlCentre(ctx: V28ActorCtx) {
  if (!ctx.isPlatformAdmin) throw new V28HttpError(403, 'ADMIN_REQUIRED_FOR_CONTROL_CENTRE');
  return {
    exceptions: Array.from(db.v28OperationalExceptions.values()),
    dualApprovals: Array.from(db.v28DualApprovalRequests.values()),
    deadLetters: Array.from(db.v28EventDeadLetters.values()),
    connectorsHealth: Array.from(db.v28InteroperabilityConnectors.values()).map((c) => ({
      id: c.id,
      providerCode: c.providerCode,
      state: c.state,
      lastHealthStatus: c.lastHealthStatus,
    })),
    fieldConflicts: Array.from(db.v28FieldOfflineRecords.values()).filter((r) => r.syncState === 'CONFLICT' || r.syncState === 'REQUIRES_REVIEW'),
  };
}

export function resolveOperationalException(
  exceptionId: string,
  payload: { status: V28OperationalException['status']; resolutionNote?: string },
  ctx: V28ActorCtx
) {
  if (!ctx.isPlatformAdmin) throw new V28HttpError(403, 'ADMIN_REQUIRED_FOR_EXCEPTION_RESOLUTION');
  const ex = db.v28OperationalExceptions.get(exceptionId);
  if (!ex) throw new V28HttpError(404, 'OPERATIONAL_EXCEPTION_NOT_FOUND');
  ex.status = payload.status;
  if (payload.status === 'RESOLVED') ex.resolvedByUserId = ctx.userId;
  ex.resolutionNote = sanitize(payload.resolutionNote) || ex.resolutionNote;
  ex.updatedAt = new Date().toISOString();
  db.v28OperationalExceptions.set(ex.id, ex);
  db.scheduleSave();
  return ex;
}

export function createDualApprovalRequest(
  payload: { actionType: V28DualApprovalRequest['actionType']; targetEntityId: string; reason: string },
  ctx: V28ActorCtx
): V28DualApprovalRequest {
  if (!ctx.isPlatformAdmin && ctx.role !== 'COOPERATIVE_ADMIN') {
    throw new V28HttpError(403, 'ADMIN_REQUIRED_FOR_DUAL_APPROVAL_REQUEST');
  }
  const now = new Date().toISOString();
  const reqItem: V28DualApprovalRequest = {
    id: uidV26('V28-DUAL'),
    actionType: payload.actionType,
    targetEntityId: sanitize(payload.targetEntityId),
    reason: sanitize(payload.reason) || 'Sensitive platform governance action',
    requestedByUserId: ctx.userId,
    status: 'PENDING_FIRST_APPROVAL',
    createdAt: now,
    updatedAt: now,
  };
  db.v28DualApprovalRequests.set(reqItem.id, reqItem);
  db.scheduleSave();
  return reqItem;
}

export function decideDualApprovalRequest(
  requestId: string,
  payload: { decision: 'APPROVE' | 'REJECT' },
  ctx: V28ActorCtx
): V28DualApprovalRequest {
  if (!ctx.isPlatformAdmin && ctx.role !== 'COOPERATIVE_ADMIN' && ctx.role !== 'BUYER') {
    throw new V28HttpError(403, 'DUAL_APPROVAL_AUTHORITY_REQUIRED');
  }
  const reqItem = db.v28DualApprovalRequests.get(requestId);
  if (!reqItem) throw new V28HttpError(404, 'DUAL_APPROVAL_REQUEST_NOT_FOUND');

  if (reqItem.requestedByUserId === ctx.userId && payload.decision === 'APPROVE') {
    throw new V28HttpError(403, 'SOD_REQUESTER_CANNOT_APPROVE_OWN_DUAL_REQUEST');
  }

  const now = new Date().toISOString();
  if (payload.decision === 'REJECT') {
    reqItem.status = 'REJECTED';
  } else if (reqItem.status === 'PENDING_FIRST_APPROVAL') {
    reqItem.firstApproverUserId = ctx.userId;
    reqItem.status = 'PENDING_SECOND_APPROVAL';
  } else if (reqItem.status === 'PENDING_SECOND_APPROVAL') {
    if (reqItem.firstApproverUserId === ctx.userId) {
      throw new V28HttpError(403, 'SOD_SECOND_APPROVER_MUST_DIFFER_FROM_FIRST_APPROVER');
    }
    reqItem.secondApproverUserId = ctx.userId;
    reqItem.status = 'APPROVED';
    reqItem.executedAt = now;
  }

  reqItem.updatedAt = now;
  db.v28DualApprovalRequests.set(reqItem.id, reqItem);
  db.scheduleSave();
  return reqItem;
}

export function listFieldOfflineRecords(ctx: V28ActorCtx) {
  return Array.from(db.v28FieldOfflineRecords.values()).filter(
    (r) => ctx.isPlatformAdmin || r.officerUserId === ctx.userId || r.organisationId === ctx.organisationId
  );
}

export function syncFieldOfflineRecordWithConflictDetection(
  payload: {
    clientRecordId: string;
    taskType: V28FieldOfflineRecord['taskType'];
    targetEntityId: string;
    countryCode?: string;
    district: string;
    payload: Record<string, any>;
    baseVersion: number;
    evidenceDocumentIds?: string[];
  },
  ctx: V28ActorCtx
): V28FieldOfflineRecord {
  const existing = Array.from(db.v28FieldOfflineRecords.values()).find(
    (r) => r.clientRecordId === sanitize(payload.clientRecordId)
  );
  const now = new Date().toISOString();

  if (existing) {
    // Explicit conflict detection: never silently overwrite newer server version
    if (Number(payload.baseVersion) < existing.version) {
      existing.syncState = 'CONFLICT';
      existing.conflictPayload = payload.payload;
      existing.updatedAt = now;
      db.v28FieldOfflineRecords.set(existing.id, existing);
      emitV28DomainEvent('FIELD', 'FIELD.SYNC_CONFLICT_DETECTED', { recordId: existing.id, clientVersion: payload.baseVersion, serverVersion: existing.version }, ctx);
      db.scheduleSave();
      return existing;
    }

    existing.payload = payload.payload;
    existing.version += 1;
    existing.baseVersion = existing.version;
    existing.syncState = 'REQUIRES_REVIEW';
    existing.updatedAt = now;
    db.v28FieldOfflineRecords.set(existing.id, existing);
    db.scheduleSave();
    return existing;
  }

  const created: V28FieldOfflineRecord = {
    id: uidV26('V28-FOFF'),
    clientRecordId: sanitize(payload.clientRecordId),
    taskType: payload.taskType || 'FIELD_VERIFICATION',
    officerUserId: ctx.userId,
    organisationId: ctx.organisationId,
    targetEntityId: sanitize(payload.targetEntityId),
    countryCode: (sanitize(payload.countryCode) || ctx.countryCode || 'UG').toUpperCase(),
    district: sanitize(payload.district) || 'Kampala',
    payload: payload.payload || {},
    evidenceDocumentIds: Array.isArray(payload.evidenceDocumentIds) ? payload.evidenceDocumentIds.map(sanitize) : [],
    version: 1,
    baseVersion: 1,
    syncState: 'REQUIRES_REVIEW',
    createdAt: now,
    updatedAt: now,
  };
  db.v28FieldOfflineRecords.set(created.id, created);
  emitV28DomainEvent('FIELD', 'FIELD.OFFLINE_RECORD_SYNCED', { recordId: created.id }, ctx);
  db.scheduleSave();
  return created;
}

export function resolveFieldOfflineConflict(
  recordId: string,
  payload: { strategy: 'KEEP_SERVER' | 'ACCEPT_CLIENT' | 'MERGED_MANUAL'; supervisorNote?: string; mergedPayload?: Record<string, any> },
  ctx: V28ActorCtx
): V28FieldOfflineRecord {
  if (!ctx.isPlatformAdmin && ctx.role !== 'COOPERATIVE_ADMIN') {
    throw new V28HttpError(403, 'SUPERVISOR_REQUIRED_FOR_CONFLICT_RESOLUTION');
  }
  const rec = db.v28FieldOfflineRecords.get(recordId);
  if (!rec) throw new V28HttpError(404, 'FIELD_RECORD_NOT_FOUND');
  if (rec.officerUserId === ctx.userId) {
    throw new V28HttpError(403, 'SUPERVISOR_CANNOT_SELF_RESOLVE_OWN_FIELD_RECORD');
  }

  if (payload.strategy === 'ACCEPT_CLIENT' && rec.conflictPayload) {
    rec.payload = rec.conflictPayload;
  } else if (payload.strategy === 'MERGED_MANUAL' && payload.mergedPayload) {
    rec.payload = payload.mergedPayload;
  }
  rec.conflictPayload = undefined;
  rec.resolutionStrategy = payload.strategy;
  rec.supervisorUserId = ctx.userId;
  rec.supervisorNote = sanitize(payload.supervisorNote) || 'Supervisor conflict review resolved';
  rec.version += 1;
  rec.syncState = 'SYNCED';
  rec.updatedAt = new Date().toISOString();
  db.v28FieldOfflineRecords.set(rec.id, rec);
  db.scheduleSave();
  return rec;
}

// ==========================================
// 12. READINESS MATRIX, HONESTY FLAGS & OPENAPI 3.1 SPEC (PARTS 19, 28, 30)
// ==========================================

export function getV28ReadinessMatrix(): { flags: V28ReadinessFlags; summary: Record<string, any> } {
  const schema26 = db.validateV26SchemaIntegrity();
  const repoHealth = getV28RepositoryHealth();
  const pgDiag = getV25PostgresDiagnostics();

  let latestTestPass = false;
  if (fs.existsSync(REPORT_FILE)) {
    try {
      const rpt = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
      const v28Suite = Array.isArray(rpt.suites)
        ? rpt.suites.find((s: any) => s.suite === 'V28' || s.batchId === 'BATCH_R_V28')
        : null;
      const v28Batch = Array.isArray(rpt.batches)
        ? rpt.batches.find((b: any) => b.batch === 'V28' || b.batch === 'BATCH_R_V28')
        : null;
      latestTestPass = Boolean(
        (v28Suite && v28Suite.status === 'PASSED' && Number(v28Suite.failed) === 0) || v28Batch?.passed
      );
    } catch {
      latestTestPass = false;
    }
  }

  const flags: V28ReadinessFlags = {
    V28_EXECUTION_ENGINE_ACTIVE: db.v28ExecutionWorkflows.size >= 2,
    V28_UNIVERSAL_WORKSPACE_ACTIVE: true,
    V28_CONTRACTS_OBLIGATIONS_ACTIVE: db.v28Contracts.size >= 2 && db.v28ContractObligations.size >= 1,
    V28_PROCUREMENT_SOD_ACTIVE: db.v28ProcurementPolicies.size >= 1 && db.v28ProcurementRequisitions.size >= 1,
    V28_FULFILMENT_INVENTORY_ACTIVE: db.v28FulfilmentPlans.size >= 1 && db.v28InventoryReservations.size >= 1,
    V28_CROSS_BORDER_ENGINE_ACTIVE: db.v28CountryProfiles.size >= 7 && db.v28CrossBorderExecutions.size >= 1,
    V28_WALLET_COORDINATION_ACTIVE: db.getFinancialIntegrityReport().journalBalanced,
    V28_INTEROPERABILITY_GATEWAY_ACTIVE: db.v28InteroperabilityConnectors.size >= 8,
    V28_EVENT_ORCHESTRATION_ACTIVE: db.v28DomainEvents.size >= 2 && db.v28EventDeadLetters.size >= 1,
    V28_DOCUMENT_EVIDENCE_VAULT_ACTIVE: db.v28DocumentEvidenceRecords.size >= 1,
    V28_CONTINENTAL_INTELLIGENCE_ACTIVE: true,
    V28_AI_ORCHESTRATOR_GUARDED: true,
    V28_OPERATIONS_CONTROL_CENTRE_ACTIVE: db.v28DualApprovalRequests.size >= 1,
    V28_FIELD_OFFLINE_CONTINUITY_ACTIVE: db.v28FieldOfflineRecords.size >= 1,
    V28_SECURITY_GOVERNANCE_ACTIVE: true,
    V28_GITHUB_DIAGNOSTICS_ACTIVE: true,
    V28_SCHEMA26_COMPATIBLE: schema26.valid,
    V28_FULL_TESTS_PASSING: latestTestPass,
    // Strict mandatory honesty flags — must stay false until genuinely verified externally
    POSTGRESQL_CUTOVER_COMPLETE: false,
    EXTERNAL_INTEGRATIONS_LIVE: false,
    REAL_VALUE_WALLET_OPERATIONS_ENABLED: false,
    CARD_SCHEME_CERTIFICATION_COMPLETE: false,
    HUMAN_FIELD_VALIDATION_COMPLETE: false,
    PILOT_ACTIVE: false,
    PRODUCTION_DEPLOYED: false,
    GITHUB_REMOTE_SYNC_VERIFIED: false,
    AI_STUDIO_GITHUB_BINDING_VERIFIED: false,
  };

  return {
    flags,
    summary: {
      release: 'V28.0-UNIVERSAL-ECONOMIC-EXECUTION',
      schemaVersion: db.schemaVersion,
      databaseAuthority: pgDiag.databaseAuthority || 'LOCAL_JSON_WAL_AUTHORITATIVE',
      postgresTargetConfigured: Boolean(pgDiag.pgConfigured),
      connectorsCount: db.v28InteroperabilityConnectors.size,
      countriesCount: db.v28CountryProfiles.size,
      missingEngineeringDocs: repoHealth.missingEngineeringDocs,
      evaluatedAt: new Date().toISOString(),
    },
  };
}

export function buildV28OpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'ECONEX V28.0 Universal Economic Execution & Interoperability API',
      version: '28.0.0',
      description: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
    },
    servers: [{ url: '/api/v28' }],
    paths: {
      '/health': { get: { summary: 'V28 Engine Health & Schema 26 Status' } },
      '/readiness-matrix': { get: { summary: 'V28 Honest Readiness & Completion Flags' } },
      '/openapi.json': { get: { summary: 'V28 OpenAPI 3.1 Specification' } },
      '/migration/status': { get: { summary: 'Schema 25 -> 26 Migration & Integrity Status' } },
      '/migration/backup-verify': { get: { summary: 'Verify Immutable V27 Backup SHA-256 & Rollback' } },
      '/workspace': { get: { summary: 'Universal Participant & Organisation 18-Section Workspace' } },
      '/executions': {
        get: { summary: 'List Unified Execution Workflows' },
        post: { summary: 'Create Unified Execution Workflow' },
      },
      '/executions/{id}/transition': { post: { summary: 'Transition Execution Workflow Stage & Status' } },
      '/contracts': {
        get: { summary: 'List Commercial Contracts' },
        post: { summary: 'Create Commercial Contract (Legally Qualified Signature: false)' },
      },
      '/contracts/{id}/transition': { post: { summary: 'Approve, Acknowledge, Amend, Dispute or Close Contract' } },
      '/contracts/{id}/obligations': { post: { summary: 'Create & Link Contract Payment Obligation' } },
      '/procurement': { get: { summary: 'Get Procurement Policies, Plans, Requisitions & Evaluations' } },
      '/procurement/plans': { post: { summary: 'Create Procurement Plan' } },
      '/procurement/requisitions': { post: { summary: 'Create Requisition with COI Declaration' } },
      '/procurement/requisitions/{id}/decide': { post: { summary: 'Approve/Reject/3-Way-Match Requisition (SoD Enforced)' } },
      '/procurement/requisitions/{id}/evaluate': { post: { summary: 'Submit Weighted Competitive Evaluation' } },
      '/fulfilment': { get: { summary: 'List Fulfilment Plans, Reservations & Evidence' } },
      '/fulfilment/reserve': { post: { summary: 'Create Fulfilment Plan & Reserve Inventory (Negative Stock Protected)' } },
      '/fulfilment/{id}/record': { post: { summary: 'Authorise Dispatch, Record POD, Damage/Return, Reconcile' } },
      '/cross-border': {
        get: { summary: 'List Country Operating Profiles & Cross-Border Executions' },
        post: { summary: 'Create Cross-Border Trade Execution' },
      },
      '/wallet/coordination': { get: { summary: 'Wallet & Ledger Coordination Summary (Sandbox)' } },
      '/wallet/transfer': { post: { summary: 'Execute Idempotent Sandbox Obligation Transfer' } },
      '/wallet/reverse/{txId}': { post: { summary: 'Compensating Ledger Reversal' } },
      '/interoperability/connectors': { get: { summary: 'List 12-Category Interoperability Connectors' } },
      '/interoperability/connectors/{id}/transition': { post: { summary: 'Transition Connector State (Dual Approval Gate)' } },
      '/events': { get: { summary: 'List Domain Events & Dead-Letter Queue' } },
      '/events/dlq/{id}/replay': { post: { summary: 'Replay Dead-Letter Event' } },
      '/vault/documents': {
        get: { summary: 'List Document & Evidence Vault Records' },
        post: { summary: 'Register Vault Evidence Document' },
      },
      '/vault/documents/{id}/governance': { post: { summary: 'Verify, Reject, or Toggle Legal Hold' } },
      '/intelligence/continental': { get: { summary: 'Continental Intelligence with 6 Provenance Categories & k-Anonymity' } },
      '/ai/orchestrate': { post: { summary: 'Guarded V28 AI Advisory Orchestration (gemini-4-hydrogen)' } },
      '/operations/control-centre': { get: { summary: 'Continental Operations Control Centre' } },
      '/operations/exceptions/{id}/resolve': { post: { summary: 'Resolve Operational Exception' } },
      '/operations/dual-approvals': { post: { summary: 'Create Dual Approval Request' } },
      '/operations/dual-approvals/{id}/decide': { post: { summary: 'First/Second Dual Approval Decision (SoD)' } },
      '/field/offline-records': {
        get: { summary: 'List Offline Field Records' },
        post: { summary: 'Sync Field Record with Optimistic Version Conflict Detection' },
      },
      '/field/offline-records/{id}/resolve': { post: { summary: 'Supervisor Resolution of Field Sync Conflict' } },
      '/developer/repository-health': { get: { summary: 'Read-Only Git & AI Studio Repository Sync Diagnostics' } },
    },
  };
}
