/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Universal Economic Identity, Wallet Network & Card Infrastructure API (/api/v23/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { validateV21Environment } from './v21Config.ts';
import { hashV23Pin } from './v23Seed.ts';
import {
  V23_ATM_NETWORK_LIVE,
  V23_CARD_SCHEME_CERTIFIED,
  V23_LIVE_MERCHANT_ACCEPTANCE,
  V23_PHYSICAL_CARDS_ISSUED,
  V23_REAL_VALUE_ENABLED,
  V23_SUPPORTED_CURRENCIES,
  advanceV23PhysicalCardStage,
  appendV23AuditEvent,
  applyForV23PhysicalCard,
  cleanV23Text,
  computeV23FeeMinor,
  createV23IdentityAndWallet,
  createV23QrPaymentRequest,
  createV23SupportCase,
  enableCurrencySubaccount,
  enqueueAndSyncV23OfflineItem,
  issueV23VirtualCard,
  postInternalWalletTransaction,
  previewV23FxConversion,
  refundOrReverseV23Transaction,
  registerV23CountryProfile,
  registerV23MerchantTerminal,
  registerV23SandboxMerchant,
  runV23ContinuityScenario,
  runV23PostgresDryRunAudit,
  runV23WalletReconciliation,
  sanitizeIdentityForPublicLookup,
  sanitizeWalletForResponse,
  simulateV23CardAuthorization,
  transitionV23IdentityOrWalletStatus,
  transitionV23VirtualCardStatus,
  uidV23,
  updateIdentityPortability,
  verifyAndPayV23Qr,
} from './v23Engine.ts';
import type {
  UserRole,
  V23CurrencyCode,
  V23FeeConfiguration,
  V23PhysicalCardStage,
  V23WalletAccount,
} from '../types/index.ts';

export const v23Router = Router();

interface V23Context {
  tenantId: string;
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
}

const v23RateBuckets = new Map<string, { count: number; windowStart: number }>();

function rateLimitV23(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const actorKey =
      (req.headers['x-user-id'] as string | undefined) ||
      (req.headers.authorization || '').slice(0, 24) ||
      req.ip ||
      'anon';
    const key = `${req.path}:${actorKey}`;
    const now = Date.now();
    const bucket = v23RateBuckets.get(key);
    if (!bucket || now - bucket.windowStart > windowMs) {
      v23RateBuckets.set(key, { count: 1, windowStart: now });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many wallet or lookup requests in the current window. Please retry shortly.',
      });
    }
    bucket.count += 1;
    v23RateBuckets.set(key, bucket);
    return next();
  };
}

function resolveV23Actor(req: Request): { userId?: string; role: UserRole; isPlatformAdmin: boolean } {
  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string | undefined)?.trim();
  let role = (req.headers['x-user-role'] as string | undefined)?.trim();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = db.validateSession(token);
    if (session) {
      userId = session.userId;
      role = session.role;
    }
  }
  if (userId) {
    const u = db.users.get(userId);
    if (u) role = u.role;
  }
  const validRoles: UserRole[] = [
    'FARMER',
    'BUYER',
    'AGRO_DEALER',
    'COOPERATIVE_ADMIN',
    'TRANSPORTER',
    'PLATFORM_ADMIN',
  ];
  const finalRole: UserRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'BUYER';
  return {
    userId,
    role: finalRole,
    isPlatformAdmin: finalRole === 'PLATFORM_ADMIN',
  };
}

function requireV23Context(req: Request, res: Response, next: NextFunction) {
  const actor = resolveV23Actor(req);
  if (!actor.userId) {
    return res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Valid Bearer session or x-user-id header is required for V23 Wallet APIs.',
    });
  }
  const explicitParamTenant =
    (req.query.tenantId as string | undefined)?.trim() ||
    (req.body?.tenantId as string | undefined)?.trim();
  const headerTenant = (req.headers['x-tenant-id'] as string | undefined)?.trim();
  const requestedTenantId =
    explicitParamTenant === 'GLOBAL_PUBLIC' || headerTenant === 'GLOBAL_PUBLIC'
      ? 'GLOBAL_PUBLIC'
      : explicitParamTenant || headerTenant || 'TEN-UG-ELGON-01';

  if (
    !actor.isPlatformAdmin &&
    requestedTenantId !== 'GLOBAL_PUBLIC' &&
    headerTenant &&
    explicitParamTenant &&
    headerTenant !== explicitParamTenant
  ) {
    return res.status(403).json({
      error: 'TENANT_BOUNDARY_VIOLATION',
      message: 'Cross-tenant request mismatch blocked.',
    });
  }

  (req as any).v23Ctx = {
    tenantId: requestedTenantId,
    userId: actor.userId,
    role: actor.role,
    isPlatformAdmin: actor.isPlatformAdmin,
  } as V23Context;
  return next();
}

function requireV23Admin(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as any).v23Ctx as V23Context;
  if (!ctx?.isPlatformAdmin) {
    return res.status(403).json({
      error: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Platform Administrator role is required for this V23 operation.',
    });
  }
  return next();
}

function canManageWallet(ctx: V23Context, wallet: V23WalletAccount): boolean {
  if (ctx.isPlatformAdmin) return true;
  if (wallet.ownerUserId === ctx.userId) return true;
  return wallet.staffPermissions.some((sp) => sp.userId === ctx.userId && sp.canInitiate);
}

export function buildV23ReadinessMatrix() {
  const integrity = db.verifyV21MigrationCompleteness();
  const pgAudits = Array.from(db.v23PgMigrations.values());
  const latestPgAudit = pgAudits[pgAudits.length - 1];
  const continuityRuns = Array.from(db.v23ContinuityRuns.values());
  const reconciliations = Array.from(db.v23Reconciliations.values());
  const latestRec = reconciliations[reconciliations.length - 1];

  return {
    release: 'V23.0-UNIVERSAL-WALLET-NETWORK',
    schemaVersion: db.schemaVersion,
    flags: {
      V23_WALLET_IDENTITY_IMPLEMENTED: true,
      V23_INTERNAL_LEDGER_TESTED: true,
      V23_REAL_VALUE_TRANSACTIONS_ENABLED: V23_REAL_VALUE_ENABLED,
      V23_PHYSICAL_CARDS_ISSUED: V23_PHYSICAL_CARDS_ISSUED,
      V23_CARD_SCHEME_CERTIFIED: V23_CARD_SCHEME_CERTIFIED,
      V23_ATM_NETWORK_LIVE: V23_ATM_NETWORK_LIVE,
      V23_LIVE_MERCHANT_ACCEPTANCE: V23_LIVE_MERCHANT_ACCEPTANCE,
      V23_EXTERNAL_INTEGRATIONS_LIVE: false,
      V23_POSTGRESQL_CUTOVER_COMPLETE: false,
      V23_HUMAN_FIELD_VALIDATION_COMPLETE: false,
      V23_PILOT_ACTIVE: false,
      V23_PRODUCTION_DEPLOYED: false,
    },
    releaseDecision: 'V23_ENGINEERING_COMPLETE_WITH_EXTERNAL_GATES',
    capabilities: [
      { key: 'EUWN_PERMANENT_IDENTITY', status: 'IMPLEMENTED_VERIFIED', realValueLive: false, notes: 'EX-XXXXXXXXXXXX generated with CSPRNG, permanent across phones, devices & countries.' },
      { key: 'MULTI_COUNTRY_SUBACCOUNTS', status: 'IMPLEMENTED_SANDBOX_ONLY', realValueLive: false, notes: '9 currencies in integer minor units (x100); 7 African country profiles NOT_ACTIVATED for live ops.' },
      { key: 'INTERNAL_LEDGER_ENGINE', status: 'IMPLEMENTED_VERIFIED', realValueLive: false, notes: 'Atomic state machine, idempotency, concurrency locks, balanced double-entry postings.' },
      { key: 'MERCHANT_QR_ACCEPTANCE', status: 'SANDBOX_ONLY', realValueLive: false, notes: 'HMAC-SHA256 signed static/dynamic QR and partial/full sandbox refunds.' },
      { key: 'VIRTUAL_AND_PHYSICAL_CARDS', status: 'SIMULATED_ONLY', realValueLive: false, notes: 'Tokenized virtual/physical workflow states only; zero Visa/Mastercard/ATM certification.' },
      { key: 'REGULATORY_LICENSING', status: 'EXTERNAL_GATE_PENDING', realValueLive: false, notes: 'Uganda NPS Act 2020 & Bank of Uganda PSP/PSO/EMI licensing and trust safeguarding required.' },
    ],
    migrationIntegrity: integrity,
    continuityDrillsRecorded: continuityRuns.length,
    latestReconciliation: latestRec || null,
    latestPostgresDryRun: latestPgAudit || null,
    attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
  };
}

// ==========================================
// PUBLIC HEALTH & OPENAPI 3.1 SPECIFICATION
// ==========================================

v23Router.get('/health', (_req: Request, res: Response) => {
  const envDiag = validateV21Environment();
  const integrity = db.verifyV21MigrationCompleteness();
  res.json({
    status: 'HEALTHY',
    product: 'ECONEX',
    release: 'V23.0-UNIVERSAL-WALLET-NETWORK',
    schemaVersion: db.schemaVersion,
    databaseAuthority: envDiag.databaseAuthority,
    migrationComplete: integrity.complete,
    journalBalanced: db.getFinancialIntegrityReport().journalBalanced,
    counts: {
      identities: db.v23Identities.size,
      wallets: db.v23Wallets.size,
      subaccounts: db.v23Subaccounts.size,
      countries: db.v23CountryProfiles.size,
      transactions: db.v23Transactions.size,
      merchants: db.v23Merchants.size,
      virtualCards: db.v23VirtualCards.size,
      physicalCards: db.v23PhysicalCards.size,
    },
    realValueEnabled: V23_REAL_VALUE_ENABLED,
    developer: 'VINEXSAH TECHNOLOGIES',
    timestamp: new Date().toISOString(),
  });
});

v23Router.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.1.0',
    info: {
      title: 'ECONEX V23.0 Universal Economic Identity, Wallet Network & Card API',
      version: '23.0.0',
      description:
        'Sandbox Universal Wallet Network (EUWN), integer minor-unit ledger, Merchant QR, Simulated Card controls, and Regulatory Activation Gates under VINEXSAH TECHNOLOGIES.',
    },
    servers: [{ url: '/api/v23' }],
    paths: {
      '/health': { get: { summary: 'V23 Wallet Network health and Schema 21 status' } },
      '/readiness-matrix': { get: { summary: 'Truthful V23 production & regulatory readiness flags' } },
      '/overview': { get: { summary: 'Consolidated V23 sandbox metrics (test balances strictly isolated)' } },
      '/identities': {
        get: { summary: 'List Universal Participant Identities' },
        post: { summary: 'Register permanent identity, EUWN (EX-...), and primary currency subaccount' },
      },
      '/identities/{id}/portability': {
        post: { summary: 'Update phone, migrate device, travel countries, recover account, or add economic role without changing EUWN' },
      },
      '/lookup/{euwn}': {
        get: { summary: 'Rate-limited public recipient EUWN lookup (omits legal PII, phone, email & balances)' },
      },
      '/wallets': { get: { summary: 'List Wallet Accounts and multi-currency subaccounts' } },
      '/wallets/{id}/subaccounts': { post: { summary: 'Enable additional currency subaccount on existing EUWN' } },
      '/wallets/{id}/pin': { post: { summary: 'Verify or update wallet PIN (stored as scrypt hash)' } },
      '/wallets/{id}/statement': { get: { summary: 'Export structured wallet statement and reconciliation proof' } },
      '/fx/preview': { post: { summary: 'Preview synthetic test FX rate conversion with minor-unit arithmetic' } },
      '/fees/preview': { post: { summary: 'Preview fee transparency breakdown prior to authorization' } },
      '/transactions': {
        get: { summary: 'List sandbox internal wallet transactions' },
        post: { summary: 'Execute internal double-entry wallet transfer (idempotencyKey + PIN required; real-value gated)' },
      },
      '/transactions/{id}/reverse-or-refund': {
        post: { summary: 'Process partial/full sandbox refund or compensating reversal' },
      },
      '/merchants': { get: { summary: 'List sandbox merchant accounts' }, post: { summary: 'Register sandbox merchant' } },
      '/terminals': { get: { summary: 'List merchant terminals' }, post: { summary: 'Register merchant terminal' } },
      '/qr': { get: { summary: 'List merchant QR requests' }, post: { summary: 'Generate HMAC-SHA256 signed QR payload' } },
      '/qr/pay': { post: { summary: 'Verify QR HMAC signature, limits & pay merchant in sandbox' } },
      '/cards': { get: { summary: 'List simulated virtual and physical ECONEX cards' } },
      '/cards/virtual': { post: { summary: 'Issue simulated virtual card (non-live, externalNetworkUsable=false)' } },
      '/cards/virtual/{id}/authorize-sim': { post: { summary: 'Simulate virtual card authorization against sandbox rules' } },
      '/cards/physical': { post: { summary: 'Submit physical card workflow application (simulation only)' } },
      '/cards/physical/{id}/stage': { post: { summary: 'Advance 13-stage physical card workflow (schemeCertified=false)' } },
      '/countries': { get: { summary: 'List 7+ African country operating profiles' }, post: { summary: 'Add extensible country profile (NOT_ACTIVATED)' } },
      '/countries/{code}/gates': { post: { summary: 'Update regulatory readiness gate checklist (Admin)' } },
      '/offline-queue': { get: { summary: 'List offline queued wallet drafts' }, post: { summary: 'Queue local draft or sync when online' } },
      '/compliance': { get: { summary: 'List compliance reviews' }, post: { summary: 'Submit human compliance review/appeal' } },
      '/support-cases': { get: { summary: 'List wallet dispute/support cases' }, post: { summary: 'Open wallet dispute/support case' } },
      '/reconciliations/run': { post: { summary: 'Run full subledger & general ledger reconciliation job' } },
      '/continuity/run': { post: { summary: 'Run 12 operational continuity & recovery drills' } },
      '/postgres-audit': { post: { summary: 'Run Schema 21 PostgreSQL 16 dry-run integrity audit' } },
    },
    'x-sandbox-examples': {
      transfer: {
        sourceWalletId: 'WLT-V23-001',
        destinationEuwn: 'EX-3H8N6V2X9C4T',
        sourceCurrency: 'UGX',
        destinationCurrency: 'UGX',
        amountMinor: 500000,
        txType: 'WALLET_TO_WALLET',
        purpose: 'Sandbox supplier payment',
        idempotencyKey: 'EX-IDEM-DEMO-001',
      },
    },
  });
});

// ==========================================
// AUTHENTICATED V23 WALLET NETWORK ENDPOINTS
// ==========================================

v23Router.use(requireV23Context);

v23Router.get('/readiness-matrix', (_req: Request, res: Response) => {
  res.json(buildV23ReadinessMatrix());
});

v23Router.get('/overview', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const identities = Array.from(db.v23Identities.values());
  const wallets = Array.from(db.v23Wallets.values()).map(sanitizeWalletForResponse);
  const subaccounts = Array.from(db.v23Subaccounts.values());
  const txs = Array.from(db.v23Transactions.values());
  const countries = Array.from(db.v23CountryProfiles.values());

  const sandboxBalanceByCurrency: Record<string, number> = {};
  for (const s of subaccounts) {
    sandboxBalanceByCurrency[s.currency] = (sandboxBalanceByCurrency[s.currency] || 0) + s.availableMinor;
  }

  const reconciliations = Array.from(db.v23Reconciliations.values());
  const latestRec = reconciliations[reconciliations.length - 1] || null;

  res.json({
    release: 'V23.0-UNIVERSAL-WALLET-NETWORK',
    schemaVersion: db.schemaVersion,
    actorRole: ctx.role,
    modeNotice: 'ALL WALLET BALANCES, CARDS, AND QR RECEIPTS ARE SANDBOX TEST RECORDS. REAL-VALUE TRANSACTIONS ARE DISABLED.',
    counts: {
      identities: identities.length,
      wallets: wallets.length,
      subaccounts: subaccounts.length,
      transactions: txs.length,
      countries: countries.length,
      activatedCountriesCount: countries.filter((c) => c.activationGates.every((g) => g.completed)).length,
      merchants: db.v23Merchants.size,
      terminals: db.v23Terminals.size,
      qrRequests: db.v23QrRequests.size,
      virtualCards: db.v23VirtualCards.size,
      physicalCards: db.v23PhysicalCards.size,
      openComplianceReviews: Array.from(db.v23ComplianceReviews.values()).filter(
        (c) => c.humanDecision === 'PENDING_HUMAN_REVIEW' || c.humanDecision === 'APPEAL_OPEN'
      ).length,
      openSupportCases: Array.from(db.v23SupportCases.values()).filter((c) => c.status !== 'CLOSED' && c.status !== 'RESOLVED').length,
      offlinePending: Array.from(db.v23OfflineQueue.values()).filter((q) => q.syncStatus === 'QUEUED_LOCAL').length,
    },
    metricsSeparated: {
      sandboxTestBalancesMinorByCurrency: sandboxBalanceByCurrency,
      actualRealValueVolumeMinor: 0,
      actualFeeRevenueMinor: 0,
      liveCardsIssuedCount: 0,
    },
    supportedCurrencies: V23_SUPPORTED_CURRENCIES,
    latestReconciliation: latestRec,
    flags: buildV23ReadinessMatrix().flags,
  });
});

// Identities & EUWN Allocation + Portability
v23Router.get('/identities', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const all = Array.from(db.v23Identities.values());
  const visible = ctx.isPlatformAdmin
    ? all
    : all.filter((i) => i.userId === ctx.userId || i.accountStatus === 'ACTIVE');
  res.json(
    visible.map((i) => ({
      ...i,
      legalName: ctx.isPlatformAdmin || i.userId === ctx.userId ? i.legalName : '[REDACTED_NON_OWNER]',
      phoneMasked: ctx.isPlatformAdmin || i.userId === ctx.userId ? i.phoneMasked : '[REDACTED]',
      emailMasked: ctx.isPlatformAdmin || i.userId === ctx.userId ? i.emailMasked : '[REDACTED]',
    }))
  );
});

v23Router.post('/identities', rateLimitV23(30, 60000), (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  try {
    const result = createV23IdentityAndWallet({
      tenantId: ctx.tenantId,
      actorUserId: req.body.userId && ctx.isPlatformAdmin ? cleanV23Text(req.body.userId) : ctx.userId,
      actorRole: ctx.role,
      category: req.body.category || 'INDIVIDUAL',
      authorizedRoles: req.body.authorizedRoles,
      displayName: req.body.displayName,
      legalName: req.body.legalName,
      email: req.body.email,
      phone: req.body.phone,
      countryCode: req.body.countryCode || 'UG',
      districtOrCity: req.body.districtOrCity || 'Kampala',
      walletCategory: req.body.walletCategory || 'INDIVIDUAL',
      walletLabel: req.body.walletLabel,
      initialCurrency: req.body.initialCurrency,
      pin: req.body.pin,
      sandboxSeedMinor: req.body.sandboxSeedMinor,
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'IDENTITY_CREATE_FAILED' });
  }
});

v23Router.post('/identities/:id/portability', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const idn = db.v23Identities.get(req.params.id);
  if (!idn) return res.status(404).json({ error: 'IDENTITY_NOT_FOUND' });
  if (!ctx.isPlatformAdmin && idn.userId !== ctx.userId) {
    return res.status(403).json({ error: 'FORBIDDEN_IDENTITY_PORTABILITY' });
  }
  try {
    const out = updateIdentityPortability({
      identityId: idn.id,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: req.body.action,
      newPhone: req.body.newPhone,
      newDeviceLabel: req.body.newDeviceLabel,
      targetCountryCode: req.body.targetCountryCode,
      roleToAdd: req.body.roleToAdd,
    });
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'PORTABILITY_UPDATE_FAILED' });
  }
});

v23Router.post('/identities/:id/status', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const idn = db.v23Identities.get(req.params.id);
  if (!idn) return res.status(404).json({ error: 'IDENTITY_NOT_FOUND' });
  if (!ctx.isPlatformAdmin && idn.userId !== ctx.userId) {
    return res.status(403).json({ error: 'FORBIDDEN_STATUS_UPDATE' });
  }
  if (req.body.verificationStatus && !ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'ADMIN_REQUIRED_FOR_VERIFICATION_DECISION' });
  }
  try {
    const out = transitionV23IdentityOrWalletStatus({
      identityId: idn.id,
      walletId: req.body.walletId,
      targetStatus: req.body.targetStatus,
      reason: req.body.reason,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      verificationStatus: req.body.verificationStatus,
    });
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'STATUS_TRANSITION_FAILED' });
  }
});

v23Router.post('/identities/:id/close-retain', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const idn = db.v23Identities.get(req.params.id);
  if (!idn) return res.status(404).json({ error: 'IDENTITY_NOT_FOUND' });
  if (!ctx.isPlatformAdmin && idn.userId !== ctx.userId) {
    return res.status(403).json({ error: 'FORBIDDEN_ACCOUNT_CLOSURE' });
  }
  const reason = cleanV23Text(req.body.reason || 'Participant requested closure with statutory ledger retention');
  const wallets = Array.from(db.v23Wallets.values()).filter((w) => w.participantIdentityId === idn.id);
  let lastOut: any = null;
  for (const w of wallets) {
    lastOut = transitionV23IdentityOrWalletStatus({
      identityId: idn.id,
      walletId: w.id,
      targetStatus: 'CLOSED_RETAINED',
      reason,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
    });
  }
  if (!lastOut) {
    lastOut = transitionV23IdentityOrWalletStatus({
      identityId: idn.id,
      targetStatus: 'CLOSED_RETAINED',
      reason,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
    });
  }
  res.json({ ...lastOut, auditHistoryRetained: true });
});

// Rate-Limited Anti-Enumeration Public EUWN Lookup (NEVER returns balances or legal PII)
v23Router.get('/lookup/:euwn', rateLimitV23(25, 60000), (req: Request, res: Response) => {
  const euwn = cleanV23Text(req.params.euwn).toUpperCase();
  const alloc = db.v23WalletNumbers.get(euwn);
  const wallet = alloc ? db.v23Wallets.get(alloc.walletAccountId) : undefined;
  const identity = wallet ? db.v23Identities.get(wallet.participantIdentityId) : undefined;
  if (!alloc || !wallet || !identity) {
    return res.status(404).json({ error: 'WALLET_NUMBER_NOT_FOUND', message: 'No ECONEX wallet matches this number.' });
  }
  const countryProfile = db.v23CountryProfiles.get(wallet.activeCountryCode);
  return res.json(sanitizeIdentityForPublicLookup(identity, wallet, countryProfile));
});

// Wallets & Multi-Currency Subaccounts
v23Router.get('/wallets', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const showAll = req.query.scope === 'all' && ctx.isPlatformAdmin;
  const allWallets = Array.from(db.v23Wallets.values());
  const visible = showAll || ctx.isPlatformAdmin
    ? allWallets
    : allWallets.filter((w) => canManageWallet(ctx, w));

  res.json(
    visible.map((w) => ({
      wallet: sanitizeWalletForResponse(w),
      allocation: db.v23WalletNumbers.get(w.euwn) || null,
      identity: db.v23Identities.get(w.participantIdentityId) || null,
      subaccounts: Array.from(db.v23Subaccounts.values()).filter((s) => s.walletAccountId === w.id),
    }))
  );
});

v23Router.get('/wallets/:id', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.params.id);
  if (!w) return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) {
    return res.status(403).json({ error: 'FORBIDDEN_WALLET_ACCESS' });
  }
  res.json({
    wallet: sanitizeWalletForResponse(w),
    allocation: db.v23WalletNumbers.get(w.euwn) || null,
    identity: db.v23Identities.get(w.participantIdentityId) || null,
    subaccounts: Array.from(db.v23Subaccounts.values()).filter((s) => s.walletAccountId === w.id),
  });
});

// Explicit anti-tamper guards blocking any direct unledgered balance edits
v23Router.post('/wallets/:id/balance', (_req: Request, res: Response) => {
  return res.status(403).json({
    error: 'DIRECT_BALANCE_EDIT_PROHIBITED',
    message: 'Wallet balances cannot be modified directly. Use validated double-entry transactions only.',
  });
});
v23Router.patch('/subaccounts/:id/balance', (_req: Request, res: Response) => {
  return res.status(403).json({
    error: 'DIRECT_BALANCE_EDIT_PROHIBITED',
    message: 'Currency subaccount balances are ledger-derived and immutable to direct edits.',
  });
});

v23Router.post('/wallets/:id/subaccounts', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.params.id);
  if (!w) return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) return res.status(403).json({ error: 'FORBIDDEN_WALLET_ACCESS' });
  try {
    const sub = enableCurrencySubaccount({
      walletId: w.id,
      currency: String(req.body.currency || 'KES').toUpperCase() as V23CurrencyCode,
      initialTestMinor: ctx.isPlatformAdmin ? Number(req.body.initialTestMinor || 0) : 0,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
    });
    res.status(201).json(sub);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'SUBACCOUNT_ENABLE_FAILED' });
  }
});

v23Router.post('/wallets/:id/pin', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.params.id);
  if (!w) return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) return res.status(403).json({ error: 'FORBIDDEN_WALLET_ACCESS' });

  const action = cleanV23Text(req.body.action || 'VERIFY').toUpperCase();
  const currentPin = cleanV23Text(req.body.currentPin);
  if (!currentPin || hashV23Pin(currentPin, w.pinSalt) !== w.pinHash) {
    return res.status(401).json({ error: 'INVALID_CURRENT_PIN' });
  }
  if (action === 'CHANGE') {
    const newPin = cleanV23Text(req.body.newPin);
    if (!/^\d{4,6}$/.test(newPin)) {
      return res.status(400).json({ error: 'INVALID_NEW_PIN_FORMAT: 4 to 6 digits required.' });
    }
    const salt = crypto.randomBytes(8).toString('hex');
    w.pinSalt = salt;
    w.pinHash = hashV23Pin(newPin, salt);
    w.updatedAt = new Date().toISOString();
    db.v23Wallets.set(w.id, w);
    appendV23AuditEvent({
      tenantId: w.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      action: 'WALLET_PIN_UPDATED',
      targetType: 'WALLET',
      targetId: w.id,
      summary: `Wallet PIN rotated for ${w.euwn}.`,
    });
    db.scheduleSave();
    return res.json({ verified: true, pinUpdated: true, euwn: w.euwn });
  }
  return res.json({ verified: true, pinUpdated: false, euwn: w.euwn });
});

v23Router.get('/wallets/:id/statement', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.params.id);
  if (!w) return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) return res.status(403).json({ error: 'FORBIDDEN_WALLET_ACCESS' });

  const subaccounts = Array.from(db.v23Subaccounts.values()).filter((s) => s.walletAccountId === w.id);
  const transactions = Array.from(db.v23Transactions.values())
    .filter((t) => t.sourceWalletId === w.id || t.destinationWalletId === w.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const txIds = new Set(transactions.map((t) => t.id));
  const postings = Array.from(db.v23LedgerPostings.values()).filter((p) => txIds.has(p.transactionId));
  const fin = db.getFinancialIntegrityReport();

  res.json({
    statementId: uidV23('STMT'),
    generatedAt: new Date().toISOString(),
    mode: 'SANDBOX_STATEMENT',
    wallet: sanitizeWalletForResponse(w),
    subaccounts,
    transactions,
    postings,
    ledgerBalanced: fin.journalBalanced,
    disclaimer: 'All balances and postings shown reflect sandbox internal ledger simulation under VINEXSAH TECHNOLOGIES.',
  });
});

// FX & Fee Previews
v23Router.post('/fx/preview', (req: Request, res: Response) => {
  try {
    const out = previewV23FxConversion({
      sourceCurrency: String(req.body.sourceCurrency || 'UGX').toUpperCase() as V23CurrencyCode,
      destinationCurrency: String(req.body.destinationCurrency || 'KES').toUpperCase() as V23CurrencyCode,
      sourceAmountMinor: Math.round(Number(req.body.sourceAmountMinor || 0)),
    });
    res.json(out);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'FX_PREVIEW_FAILED' });
  }
});

v23Router.post('/fees/preview', (req: Request, res: Response) => {
  const amountMinor = Math.max(0, Math.round(Number(req.body.amountMinor || 0)));
  const currency = String(req.body.currency || 'UGX').toUpperCase() as V23CurrencyCode;
  const countryCode = cleanV23Text(req.body.countryCode || 'UG').toUpperCase();
  const serviceType = req.body.serviceType || 'WALLET_TO_WALLET';
  const feeMinor = computeV23FeeMinor({ serviceType, countryCode, currency, amountMinor });
  res.json({
    serviceType,
    countryCode,
    currency,
    amountMinor,
    feeMinor,
    totalDebitMinor: amountMinor + feeMinor,
    sandboxZeroRevenueNotice: 'Fee schedule is configurable for pilot simulation; actual revenue recognized = 0.',
  });
});

// Internal Transactions & Reversals/Refunds
v23Router.get('/transactions', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const walletId = cleanV23Text(req.query.walletId);
  let txs = Array.from(db.v23Transactions.values());
  if (!ctx.isPlatformAdmin) {
    const ownedIds = new Set(
      Array.from(db.v23Wallets.values())
        .filter((w) => canManageWallet(ctx, w))
        .map((w) => w.id)
    );
    txs = txs.filter((t) => ownedIds.has(t.sourceWalletId) || ownedIds.has(t.destinationWalletId));
  }
  if (walletId) {
    txs = txs.filter((t) => t.sourceWalletId === walletId || t.destinationWalletId === walletId);
  }
  txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(txs);
});

v23Router.get('/transactions/:id', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const tx = db.v23Transactions.get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
  const src = db.v23Wallets.get(tx.sourceWalletId);
  const dst = db.v23Wallets.get(tx.destinationWalletId);
  if (!ctx.isPlatformAdmin && !(src && canManageWallet(ctx, src)) && !(dst && canManageWallet(ctx, dst))) {
    return res.status(403).json({ error: 'FORBIDDEN_TRANSACTION_VIEW' });
  }
  const posting = Array.from(db.v23LedgerPostings.values()).find((p) => p.transactionId === tx.id) || null;
  res.json({ transaction: tx, posting });
});

v23Router.post('/transactions', rateLimitV23(40, 60000), (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const srcWallet = db.v23Wallets.get(req.body.sourceWalletId);
  if (!srcWallet) return res.status(404).json({ error: 'SOURCE_WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, srcWallet)) {
    return res.status(403).json({ error: 'FORBIDDEN_SOURCE_WALLET_TRANSFER' });
  }

  try {
    const resTx = postInternalWalletTransaction({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      sourceWalletId: srcWallet.id,
      destinationEuwn: req.body.destinationEuwn,
      sourceCurrency: String(req.body.sourceCurrency || 'UGX').toUpperCase() as V23CurrencyCode,
      destinationCurrency: req.body.destinationCurrency
        ? (String(req.body.destinationCurrency).toUpperCase() as V23CurrencyCode)
        : undefined,
      amountMinor: Number(req.body.amountMinor),
      txType: req.body.txType || 'WALLET_TO_WALLET',
      purpose: req.body.purpose || 'ECONEX sandbox transfer',
      idempotencyKey: req.body.idempotencyKey || (req.headers['idempotency-key'] as string),
      pin: req.body.pin,
      bypassPinForTestOrAdmin: Boolean(req.body.bypassPinForTestOrAdmin && ctx.isPlatformAdmin),
      fxUserConfirmed: Boolean(req.body.fxUserConfirmed),
      realValueRequested: Boolean(req.body.realValueRequested),
      linkedModuleRef: req.body.linkedModuleRef,
      correlationId: (req as any).correlationId,
    });
    res.status(resTx.idempotentReplay ? 200 : 201).json(resTx);
  } catch (err: any) {
    const msg = String(err?.message || 'TRANSACTION_FAILED');
    const status = msg.includes('REAL_VALUE_GATE_LOCKED')
      ? 403
      : msg.includes('INVALID_AUTHORIZATION_PIN') || msg.includes('AUTHORIZATION_PIN_REQUIRED')
      ? 401
      : msg.includes('NOT_FOUND')
      ? 404
      : 400;
    res.status(status).json({ error: msg });
  }
});

v23Router.post('/transactions/:id/reverse-or-refund', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const tx = db.v23Transactions.get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'ORIGINAL_TRANSACTION_NOT_FOUND' });
  const dstWallet = db.v23Wallets.get(tx.destinationWalletId);
  if (!ctx.isPlatformAdmin && !(dstWallet && canManageWallet(ctx, dstWallet))) {
    return res.status(403).json({ error: 'FORBIDDEN_REFUND_AUTHORITY' });
  }
  try {
    const out = refundOrReverseV23Transaction({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      originalTransactionId: tx.id,
      amountMinor: req.body.amountMinor !== undefined ? Number(req.body.amountMinor) : undefined,
      reason: req.body.reason || 'Sandbox refund/reversal request',
      kind: req.body.kind || 'FULL_REFUND',
      merchantId: req.body.merchantId,
    });
    res.status(201).json(out);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'REFUND_FAILED' });
  }
});

// Sandbox Merchant Acceptance & QR
v23Router.get('/merchants', (_req: Request, res: Response) => {
  res.json(Array.from(db.v23Merchants.values()));
});

v23Router.post('/merchants', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.body.walletAccountId);
  if (!w) return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) return res.status(403).json({ error: 'FORBIDDEN_WALLET_ACCESS' });
  try {
    const m = registerV23SandboxMerchant({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      walletAccountId: w.id,
      merchantName: req.body.merchantName,
      sectorCode: req.body.sectorCode,
      countryCode: req.body.countryCode || w.activeCountryCode,
      districtOrCity: req.body.districtOrCity || 'Kampala',
      acceptedCurrencies: req.body.acceptedCurrencies,
    });
    res.status(201).json(m);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'MERCHANT_REGISTER_FAILED' });
  }
});

v23Router.post('/merchants/:id/status', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const m = db.v23Merchants.get(req.params.id);
  if (!m) return res.status(404).json({ error: 'MERCHANT_NOT_FOUND' });
  if (!ctx.isPlatformAdmin) return res.status(403).json({ error: 'ADMIN_REQUIRED_MERCHANT_STATUS' });
  m.status = req.body.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE_SANDBOX';
  m.updatedAt = new Date().toISOString();
  db.v23Merchants.set(m.id, m);
  appendV23AuditEvent({
    tenantId: m.tenantId,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    action: `MERCHANT_STATUS_${m.status}`,
    targetType: 'MERCHANT',
    targetId: m.id,
    summary: `Sandbox merchant ${m.merchantName} set to ${m.status}.`,
  });
  db.scheduleSave();
  res.json(m);
});

v23Router.get('/terminals', (req: Request, res: Response) => {
  const merchantId = cleanV23Text(req.query.merchantId);
  let list = Array.from(db.v23Terminals.values());
  if (merchantId) list = list.filter((t) => t.merchantId === merchantId);
  res.json(list);
});

v23Router.post('/terminals', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  try {
    const t = registerV23MerchantTerminal({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      merchantId: req.body.merchantId,
      terminalType: req.body.terminalType || 'DYNAMIC_POS_SIM',
      label: req.body.label || 'Counter Terminal',
      locationLabel: req.body.locationLabel || 'Kampala',
    });
    res.status(201).json(t);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'TERMINAL_CREATE_FAILED' });
  }
});

v23Router.post('/terminals/:id/status', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const term = db.v23Terminals.get(req.params.id);
  if (!term) return res.status(404).json({ error: 'TERMINAL_NOT_FOUND' });
  const merchant = db.v23Merchants.get(term.merchantId);
  const mWallet = merchant ? db.v23Wallets.get(merchant.walletAccountId) : undefined;
  if (!ctx.isPlatformAdmin && !(mWallet && canManageWallet(ctx, mWallet))) {
    return res.status(403).json({ error: 'FORBIDDEN_TERMINAL_CONTROL' });
  }
  term.status = req.body.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
  term.lastActivityAt = new Date().toISOString();
  db.v23Terminals.set(term.id, term);
  db.scheduleSave();
  res.json(term);
});

v23Router.get('/qr', (req: Request, res: Response) => {
  const merchantId = cleanV23Text(req.query.merchantId);
  let qrs = Array.from(db.v23QrRequests.values());
  if (merchantId) qrs = qrs.filter((q) => q.merchantId === merchantId);
  res.json(qrs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

v23Router.post('/qr', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  try {
    const qr = createV23QrPaymentRequest({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      merchantId: req.body.merchantId,
      terminalId: req.body.terminalId,
      qrKind: req.body.qrKind === 'STATIC' ? 'STATIC' : 'DYNAMIC',
      amountMinor: Number(req.body.amountMinor || 0),
      currency: String(req.body.currency || 'UGX').toUpperCase() as V23CurrencyCode,
      description: req.body.description || 'Sandbox merchant payment',
      expiresInMinutes: Number(req.body.expiresInMinutes || 60),
    });
    res.status(201).json(qr);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'QR_CREATE_FAILED' });
  }
});

v23Router.post('/qr/pay', rateLimitV23(30, 60000), (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const payerWallet = db.v23Wallets.get(req.body.payerWalletId);
  if (!payerWallet) return res.status(404).json({ error: 'PAYER_WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, payerWallet)) {
    return res.status(403).json({ error: 'FORBIDDEN_PAYER_WALLET' });
  }
  try {
    const result = verifyAndPayV23Qr({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      qrId: req.body.qrId,
      scannedPayloadJson: req.body.scannedPayloadJson,
      scannedSignatureSha256: req.body.scannedSignatureSha256,
      payerWalletId: payerWallet.id,
      overrideStaticAmountMinor:
        req.body.overrideStaticAmountMinor !== undefined
          ? Number(req.body.overrideStaticAmountMinor)
          : undefined,
      pin: req.body.pin,
      bypassPinForTestOrAdmin: Boolean(req.body.bypassPinForTestOrAdmin && ctx.isPlatformAdmin),
      idempotencyKey: req.body.idempotencyKey || uidV23('QRIDEM'),
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'QR_PAYMENT_FAILED' });
  }
});

// Virtual & Physical Cards (Simulated Sandbox Only)
v23Router.get('/cards', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const ownedIds = new Set(
    Array.from(db.v23Wallets.values())
      .filter((w) => canManageWallet(ctx, w))
      .map((w) => w.id)
  );
  const virtualCards = Array.from(db.v23VirtualCards.values()).filter(
    (c) => ctx.isPlatformAdmin || ownedIds.has(c.walletAccountId)
  );
  const physicalCards = Array.from(db.v23PhysicalCards.values()).filter(
    (c) => ctx.isPlatformAdmin || ownedIds.has(c.walletAccountId)
  );
  res.json({
    virtualCards,
    physicalCards,
    disclaimer: 'Simulated test cards only. schemeCertified=false, physicalCardLiveIssued=false, atmNetworkLive=false.',
  });
});

v23Router.post('/cards/virtual', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.body.walletAccountId);
  if (!w) return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) return res.status(403).json({ error: 'FORBIDDEN_CARD_WALLET' });
  try {
    const card = issueV23VirtualCard({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      walletAccountId: w.id,
      cardholderName: req.body.cardholderName || w.displayName,
      allowedCurrencies: req.body.allowedCurrencies,
      allowedCountries: req.body.allowedCountries,
      perTxLimitMinor: req.body.perTxLimitMinor ? Number(req.body.perTxLimitMinor) : undefined,
      dailyLimitMinor: req.body.dailyLimitMinor ? Number(req.body.dailyLimitMinor) : undefined,
    });
    res.status(201).json(card);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'VIRTUAL_CARD_ISSUE_FAILED' });
  }
});

v23Router.post('/cards/virtual/:id/status', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const card = db.v23VirtualCards.get(req.params.id);
  if (!card) return res.status(404).json({ error: 'VIRTUAL_CARD_NOT_FOUND' });
  const w = db.v23Wallets.get(card.walletAccountId);
  if (!ctx.isPlatformAdmin && !(w && canManageWallet(ctx, w))) {
    return res.status(403).json({ error: 'FORBIDDEN_CARD_STATUS' });
  }
  try {
    const updated = transitionV23VirtualCardStatus({
      cardId: card.id,
      targetStatus: req.body.targetStatus,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      reason: req.body.reason,
      newWalletId: req.body.newWalletId,
    });
    res.json(updated);
  } catch (err: any) {
    const msg = String(err?.message || 'CARD_STATUS_FAILED');
    res.status(msg.includes('UNAUTHORIZED_CARD_WALLET_REASSIGNMENT') ? 403 : 400).json({ error: msg });
  }
});

v23Router.post('/cards/virtual/:id/authorize-sim', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const card = db.v23VirtualCards.get(req.params.id);
  if (!card) return res.status(404).json({ error: 'VIRTUAL_CARD_NOT_FOUND' });
  const w = db.v23Wallets.get(card.walletAccountId);
  if (!ctx.isPlatformAdmin && !(w && canManageWallet(ctx, w))) {
    return res.status(403).json({ error: 'FORBIDDEN_CARD_SIMULATION' });
  }
  try {
    const resTx = simulateV23CardAuthorization({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      cardId: card.id,
      merchantEuwn: req.body.merchantEuwn,
      amountMinor: Number(req.body.amountMinor),
      currency: String(req.body.currency || 'UGX').toUpperCase() as V23CurrencyCode,
      countryCode: req.body.countryCode || 'UG',
      mcc: req.body.mcc,
      idempotencyKey: req.body.idempotencyKey || uidV23('CSIM'),
    });
    res.status(201).json(resTx);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'CARD_SIM_DECLINED' });
  }
});

v23Router.post('/cards/physical', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.body.walletAccountId);
  if (!w) return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) return res.status(403).json({ error: 'FORBIDDEN_CARD_WALLET' });
  if (req.body.claimLiveIssuance || req.body.schemeCertified) {
    return res.status(403).json({
      error: 'CARD_SCHEME_CERTIFICATION_REQUIRED',
      message: 'Live physical card issuance and external scheme/ATM access remain disabled pending certification.',
    });
  }
  try {
    const card = applyForV23PhysicalCard({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      walletAccountId: w.id,
      cardholderName: req.body.cardholderName || w.displayName,
      deliveryCountryCode: req.body.deliveryCountryCode || w.activeCountryCode,
      deliveryDistrict: req.body.deliveryDistrict || 'Kampala',
    });
    res.status(201).json(card);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'PHYSICAL_CARD_APPLY_FAILED' });
  }
});

v23Router.post('/cards/physical/:id/stage', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const card = db.v23PhysicalCards.get(req.params.id);
  if (!card) return res.status(404).json({ error: 'PHYSICAL_CARD_NOT_FOUND' });
  const w = db.v23Wallets.get(card.walletAccountId);
  if (!ctx.isPlatformAdmin && !(w && canManageWallet(ctx, w))) {
    return res.status(403).json({ error: 'FORBIDDEN_PHYSICAL_CARD_STAGE' });
  }
  if (req.body.schemeCertified === true || req.body.physicalCardLiveIssued === true) {
    return res.status(403).json({
      error: 'LIVE_SCHEME_CERTIFICATION_NOT_AVAILABLE',
      message: 'Sandbox cannot mark schemeCertified=true or physicalCardLiveIssued=true.',
    });
  }
  try {
    const updated = advanceV23PhysicalCardStage({
      cardId: card.id,
      targetStage: req.body.targetStage as V23PhysicalCardStage,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      note: req.body.note,
      simPin: req.body.simPin,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'PHYSICAL_CARD_STAGE_FAILED' });
  }
});

// Multi-Country Profiles & Regulatory Gates
v23Router.get('/countries', (_req: Request, res: Response) => {
  res.json(Array.from(db.v23CountryProfiles.values()));
});

v23Router.post('/countries', requireV23Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  try {
    const profile = registerV23CountryProfile({
      countryCode: req.body.countryCode,
      countryName: req.body.countryName,
      defaultCurrency: String(req.body.defaultCurrency || 'USD').toUpperCase() as V23CurrencyCode,
      supportedCurrencies: Array.isArray(req.body.supportedCurrencies) ? req.body.supportedCurrencies : ['USD', 'UGX'],
      authorityRef: req.body.authorityRef || 'National Central Bank',
      actorUserId: ctx.userId,
      actorRole: ctx.role,
    });
    res.status(201).json(profile);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'COUNTRY_REGISTER_FAILED' });
  }
});

v23Router.post('/countries/:code/toggle-sandbox', requireV23Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const profile = db.v23CountryProfiles.get(cleanV23Text(req.params.code).toUpperCase());
  if (!profile) return res.status(404).json({ error: 'COUNTRY_PROFILE_NOT_FOUND' });
  profile.sandboxWalletAvailable =
    req.body.sandboxWalletAvailable !== undefined ? Boolean(req.body.sandboxWalletAvailable) : !profile.sandboxWalletAvailable;
  profile.updatedAt = new Date().toISOString();
  db.v23CountryProfiles.set(profile.countryCode, profile);
  appendV23AuditEvent({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    action: 'COUNTRY_SANDBOX_TOGGLED',
    targetType: 'COUNTRY',
    targetId: profile.countryCode,
    summary: `Country ${profile.countryCode} sandboxWalletAvailable=${profile.sandboxWalletAvailable}.`,
  });
  db.scheduleSave();
  res.json(profile);
});

v23Router.post('/countries/:code/gates', requireV23Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const profile = db.v23CountryProfiles.get(cleanV23Text(req.params.code).toUpperCase());
  if (!profile) return res.status(404).json({ error: 'COUNTRY_PROFILE_NOT_FOUND' });

  if (req.body.forceActivateWithoutGates) {
    return res.status(403).json({
      error: 'REGULATORY_GATE_BYPASS_PROHIBITED',
      message: 'Real-value country activation cannot bypass the 14 legal, licensing, safeguarding, and audit gates.',
    });
  }

  const gate = profile.activationGates.find((g) => g.gateCode === req.body.gateCode);
  if (!gate) return res.status(404).json({ error: 'REGULATORY_GATE_NOT_FOUND' });

  gate.completed = Boolean(req.body.completed);
  gate.evidenceRef = cleanV23Text(req.body.evidenceRef || '');
  gate.reviewedBy = ctx.userId;
  gate.reviewedAt = new Date().toISOString();
  if (req.body.notes) gate.notes = cleanV23Text(req.body.notes);

  const allCompleted = profile.activationGates.every((g) => g.completed);
  profile.countryActivationStatus = allCompleted && req.body.regulatoryLicenceApproved ? 'REGULATORY_REVIEW' : 'NOT_ACTIVATED';
  profile.updatedAt = new Date().toISOString();
  db.v23CountryProfiles.set(profile.countryCode, profile);
  appendV23AuditEvent({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    action: `COUNTRY_GATE_UPDATED_${gate.gateCode}`,
    targetType: 'COUNTRY',
    targetId: profile.countryCode,
    summary: `Gate ${gate.gateCode} updated (${gate.completed}) for ${profile.countryCode}.`,
  });
  db.scheduleSave();
  res.json(profile);
});

// Offline Queue
v23Router.get('/offline-queue', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const ownedIds = new Set(
    Array.from(db.v23Wallets.values())
      .filter((w) => canManageWallet(ctx, w))
      .map((w) => w.id)
  );
  const items = Array.from(db.v23OfflineQueue.values()).filter(
    (q) => ctx.isPlatformAdmin || ownedIds.has(q.sourceWalletId)
  );
  res.json(items);
});

v23Router.post('/offline-queue', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const w = db.v23Wallets.get(req.body.sourceWalletId);
  if (!w) return res.status(404).json({ error: 'SOURCE_WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, w)) return res.status(403).json({ error: 'FORBIDDEN_WALLET_ACCESS' });

  const out = enqueueAndSyncV23OfflineItem({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    deviceId: req.body.deviceId || 'DEV-WEB-01',
    clientDraftId: req.body.clientDraftId || uidV23('DRAFT'),
    sourceWalletId: w.id,
    recipientEuwn: req.body.recipientEuwn,
    amountMinor: Number(req.body.amountMinor || 0),
    currency: String(req.body.currency || 'UGX').toUpperCase() as V23CurrencyCode,
    countryCode: req.body.countryCode || w.activeCountryCode,
    purpose: req.body.purpose || 'Offline wallet instruction',
    syncNow: Boolean(req.body.syncNow),
    pin: req.body.pin,
    bypassPinForTestOrAdmin: Boolean(req.body.bypassPinForTestOrAdmin && ctx.isPlatformAdmin),
  });
  res.status(out.synced ? 201 : 200).json(out);
});

// Compliance, Risk, Audit & Support Desk
v23Router.get('/compliance', (_req: Request, res: Response) => {
  res.json(Array.from(db.v23ComplianceReviews.values()));
});

v23Router.post('/compliance/:id/review', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const cmp = db.v23ComplianceReviews.get(req.params.id);
  if (!cmp) return res.status(404).json({ error: 'COMPLIANCE_REVIEW_NOT_FOUND' });

  if (req.body.appealNote || req.body.appealNotes) {
    cmp.humanDecision = 'APPEAL_OPEN';
    cmp.appealNotes = cleanV23Text(req.body.appealNote || req.body.appealNotes);
    cmp.updatedAt = new Date().toISOString();
    db.v23ComplianceReviews.set(cmp.id, cmp);
    db.scheduleSave();
    return res.json(cmp);
  }

  if (!ctx.isPlatformAdmin) {
    return res.status(403).json({ error: 'ADMIN_REQUIRED_FOR_COMPLIANCE_DECISION' });
  }
  const decision = req.body.humanDecision;
  if (!['CLEARED', 'RESTRICTED', 'ESCALATED'].includes(decision)) {
    return res.status(400).json({ error: 'INVALID_HUMAN_COMPLIANCE_DECISION' });
  }
  const now = new Date().toISOString();
  cmp.humanDecision = decision;
  cmp.reviewedByUserId = ctx.userId;
  cmp.decisionReason = cleanV23Text(req.body.reviewerNote || req.body.decisionReason || 'Human compliance officer review recorded');
  cmp.updatedAt = now;
  db.v23ComplianceReviews.set(cmp.id, cmp);

  appendV23AuditEvent({
    tenantId: cmp.tenantId,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    action: `COMPLIANCE_HUMAN_${decision}`,
    targetType: 'COMPLIANCE',
    targetId: cmp.id,
    summary: `Human review decision ${decision} on ${cmp.subjectId}.`,
  });
  db.scheduleSave();
  res.json(cmp);
});

v23Router.get('/risk-events', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const events = Array.from(db.v23RiskEvents.values());
  if (ctx.isPlatformAdmin) return res.json(events);
  const ownedIds = new Set(
    Array.from(db.v23Wallets.values())
      .filter((w) => canManageWallet(ctx, w))
      .map((w) => w.id)
  );
  res.json(events.filter((e) => !e.walletAccountId || ownedIds.has(e.walletAccountId)));
});

v23Router.get('/audit-events', (_req: Request, res: Response) => {
  const events = Array.from(db.v23AuditEvents.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(events);
});

v23Router.get('/support-cases', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const cases = Array.from(db.v23SupportCases.values());
  if (ctx.isPlatformAdmin) return res.json(cases);
  const ownedIdentityIds = new Set(
    Array.from(db.v23Identities.values())
      .filter((i) => i.userId === ctx.userId)
      .map((i) => i.id)
  );
  res.json(cases.filter((c) => ownedIdentityIds.has(c.participantIdentityId)));
});

v23Router.post('/support-cases', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  try {
    const c = createV23SupportCase({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      category: req.body.category || 'TRANSACTION_DELAY_OR_STATUS',
      participantIdentityId: req.body.participantIdentityId || 'IDN-V23-001',
      walletAccountId: req.body.walletAccountId,
      linkedTransactionId: req.body.linkedTransactionId,
      summary: req.body.summary,
      evidenceRefs: req.body.evidenceRefs,
    });
    res.status(201).json(c);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'SUPPORT_CASE_CREATE_FAILED' });
  }
});

v23Router.post('/support-cases/:id/transition', requireV23Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const c = db.v23SupportCases.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'SUPPORT_CASE_NOT_FOUND' });
  c.status = req.body.status || 'INVESTIGATING';
  c.escalationHistory.push({
    role: `${ctx.role} (${c.status})`,
    note: cleanV23Text(req.body.note || `Updated to ${c.status}`),
    at: new Date().toISOString(),
  });
  c.updatedAt = new Date().toISOString();
  db.v23SupportCases.set(c.id, c);
  db.scheduleSave();
  res.json(c);
});

// Commercial Fee Config & External Integration Gates
v23Router.get('/fees', (_req: Request, res: Response) => {
  res.json({
    configs: Array.from(db.v23FeeConfigs.values()),
    actualRevenueRecognizedMinor: 0,
    notice: 'Fee configs operate in sandbox transparency preview mode only.',
  });
});

v23Router.post('/fees', requireV23Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const id = req.body.id || uidV23('FEE-V23');
  const cfg: V23FeeConfiguration = {
    id,
    serviceType: req.body.serviceType || 'WALLET_TO_WALLET',
    countryCode: cleanV23Text(req.body.countryCode || 'UG').toUpperCase(),
    currency: String(req.body.currency || 'UGX').toUpperCase() as V23CurrencyCode,
    participantCategory: req.body.participantCategory || 'ALL',
    flatFeeMinor: Math.max(0, Math.round(Number(req.body.flatFeeMinor || 0))),
    percentBps: Math.max(0, Math.round(Number(req.body.percentBps || 0))),
    minFeeMinor: Math.max(0, Math.round(Number(req.body.minFeeMinor || 0))),
    maxFeeMinor: Math.max(0, Math.round(Number(req.body.maxFeeMinor || 0))),
    classification: 'CONFIGURABLE_SANDBOX_SCHEDULE',
    activeRevenueRecognizedMinor: 0,
    updatedBy: ctx.userId,
    updatedAt: new Date().toISOString(),
  };
  db.v23FeeConfigs.set(cfg.id, cfg);
  db.scheduleSave();
  res.status(201).json(cfg);
});

v23Router.get('/integrations', (_req: Request, res: Response) => {
  res.json(Array.from(db.v23Integrations.values()));
});

v23Router.post('/integrations/:id/state', requireV23Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const intf = db.v23Integrations.get(req.params.id);
  if (!intf) return res.status(404).json({ error: 'INTEGRATION_NOT_FOUND' });

  const requestedState = req.body.state;
  if (requestedState === 'LIVE_APPROVED' && !intf.liveEnabled) {
    return res.status(403).json({
      error: 'INTEGRATION_LIVE_PREREQUISITES_UNMET',
      message: 'External integration cannot move to LIVE_APPROVED without verified regulatory licence, contract, and live credentials.',
    });
  }
  intf.state = requestedState || 'CONFIGURED_TEST';
  intf.updatedAt = new Date().toISOString();
  db.v23Integrations.set(intf.id, intf);
  appendV23AuditEvent({
    tenantId: ctx.tenantId,
    actorUserId: ctx.userId,
    actorRole: ctx.role,
    action: `INTEGRATION_STATE_${intf.state}`,
    targetType: 'INTEGRATION',
    targetId: intf.id,
    summary: `${intf.name} -> ${intf.state}.`,
  });
  db.scheduleSave();
  res.json(intf);
});

// V1-V22 Cross-Module Linked Wallet Payment
v23Router.post('/integrations/link-payment', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const moduleName = cleanV23Text(req.body.module).toUpperCase();
  const recordId = cleanV23Text(req.body.recordId);
  if (!moduleName || !recordId) {
    return res.status(400).json({ error: 'MODULE_AND_RECORD_ID_REQUIRED' });
  }

  let verifiedLabel = '';
  if (moduleName === 'MARKETPLACE') {
    const item = db.v22MarketplaceItems.get(recordId) || db.listings.get(recordId);
    if (!item) return res.status(404).json({ error: 'MARKETPLACE_RECORD_NOT_FOUND' });
    verifiedLabel = (item as any).title || recordId;
  } else if (moduleName === 'INVOICE') {
    const inv = db.v22Invoices.get(recordId);
    if (!inv) return res.status(404).json({ error: 'INVOICE_RECORD_NOT_FOUND' });
    verifiedLabel = inv.invoiceNumber;
  } else if (moduleName === 'PROCUREMENT') {
    const tender = db.v22Tenders.get(recordId) || db.procurementRfqs.get(recordId);
    if (!tender) return res.status(404).json({ error: 'PROCUREMENT_RECORD_NOT_FOUND' });
    verifiedLabel = (tender as any).title || recordId;
  } else if (moduleName === 'LOGISTICS') {
    const ship = db.shipments.get(recordId) || db.corridorShipments.get(recordId);
    if (!ship) return res.status(404).json({ error: 'LOGISTICS_RECORD_NOT_FOUND' });
    verifiedLabel = (ship as any).trackingNumber || (ship as any).waybillCode || recordId;
  } else if (moduleName === 'COOPERATIVE') {
    const org = db.organizations.get(recordId);
    if (!org) return res.status(404).json({ error: 'COOPERATIVE_RECORD_NOT_FOUND' });
    verifiedLabel = org.name;
  } else if (moduleName === 'PROJECT') {
    const proj = db.v22Projects.get(recordId);
    if (!proj) return res.status(404).json({ error: 'PROJECT_RECORD_NOT_FOUND' });
    verifiedLabel = proj.title;
  } else {
    return res.status(400).json({ error: `UNSUPPORTED_LINK_MODULE:${moduleName}` });
  }

  const srcWallet = db.v23Wallets.get(req.body.sourceWalletId);
  if (!srcWallet) return res.status(404).json({ error: 'SOURCE_WALLET_NOT_FOUND' });
  if (!canManageWallet(ctx, srcWallet)) return res.status(403).json({ error: 'FORBIDDEN_WALLET_ACCESS' });

  try {
    const txOut = postInternalWalletTransaction({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      actorRole: ctx.role,
      sourceWalletId: srcWallet.id,
      destinationEuwn: req.body.destinationEuwn,
      sourceCurrency: String(req.body.currency || 'UGX').toUpperCase() as V23CurrencyCode,
      destinationCurrency: String(req.body.currency || 'UGX').toUpperCase() as V23CurrencyCode,
      amountMinor: Number(req.body.amountMinor),
      txType: moduleName === 'INVOICE' ? 'INVOICE_SETTLEMENT_RECORD' : moduleName === 'COOPERATIVE' ? 'COOPERATIVE_ALLOCATION' : 'COMMERCIAL_ORDER_PAYMENT',
      purpose: `${moduleName} linked payment (${verifiedLabel})`,
      idempotencyKey: req.body.idempotencyKey || `LINK-${moduleName}-${recordId}-${Date.now()}`,
      pin: req.body.pin,
      bypassPinForTestOrAdmin: Boolean(req.body.bypassPinForTestOrAdmin && ctx.isPlatformAdmin),
      fxUserConfirmed: true,
      linkedModuleRef: { module: moduleName, recordId, label: verifiedLabel },
    });
    res.status(201).json(txOut);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'LINKED_PAYMENT_FAILED' });
  }
});

// Reconciliation, 12 Continuity Scenarios & Schema 21 PG Audit
v23Router.get('/reconciliations', (_req: Request, res: Response) => {
  res.json(Array.from(db.v23Reconciliations.values()));
});

v23Router.post('/reconciliations/run', (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const rec = runV23WalletReconciliation(ctx.userId, ctx.tenantId);
  res.status(201).json(rec);
});

v23Router.get('/continuity', (_req: Request, res: Response) => {
  res.json(Array.from(db.v23ContinuityRuns.values()));
});

v23Router.post('/continuity/run', requireV23Admin, (req: Request, res: Response) => {
  const ctx = (req as any).v23Ctx as V23Context;
  const allCodes = [
    'SCEN_01_CRASH_BEFORE_POST',
    'SCEN_02_CRASH_AFTER_POST_BEFORE_RESPONSE',
    'SCEN_03_CLIENT_RETRY_SAME_REQUEST',
    'SCEN_04_CONCURRENT_SPEND_SAME_BALANCE',
    'SCEN_05_NETWORK_FAILURE_DURING_AUTH',
    'SCEN_06_MERCHANT_TERMINAL_DISCONNECT',
    'SCEN_07_BACKUP_RESTORATION_INTERRUPTED',
    'SCEN_08_WAL_REPLAY_DAMAGED_RECORD',
    'SCEN_09_DUPLICATE_REFUND_BLOCKED',
    'SCEN_10_COUNTRY_SUSPENDED_PENDING_TX',
    'SCEN_11_CARD_FROZEN_INCOMING_AUTH',
    'SCEN_12_RECONCILIATION_HEALTH_CHECK',
  ];
  const requested = req.body.scenarioCode ? [cleanV23Text(req.body.scenarioCode)] : allCodes;
  try {
    const runs = requested.map((code) => runV23ContinuityScenario(code, ctx.userId, ctx.tenantId));
    res.status(201).json({ total: runs.length, passed: runs.filter((r) => r.passed).length, runs });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'CONTINUITY_DRILL_FAILED' });
  }
});

v23Router.get('/postgres-audit', (_req: Request, res: Response) => {
  res.json(Array.from(db.v23PgMigrations.values()));
});

v23Router.post('/postgres-audit', requireV23Admin, (_req: Request, res: Response) => {
  const run = runV23PostgresDryRunAudit();
  res.status(201).json(run);
});
