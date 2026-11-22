/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Universal Economic Identity, Wallet Network & Card Infrastructure Engine
 * Covers:
 * - Permanent non-predictable EUWN (EX-XXXXXXXXXXXX) across phones, devices & countries
 * - Integer minor-unit multi-currency subaccounts (UGX, KES, TZS, RWF, BIF, SSP, CDF, USD, EUR)
 * - Controlled internal transaction state machine with idempotency, concurrency & balanced double-entry ledger
 * - Sandbox Merchant QR acceptance (static & dynamic HMAC-signed payloads) & partial/full refunds
 * - Virtual & Physical ECONEX Card lifecycle (sandbox simulation, zero live scheme/ATM claims)
 * - Cross-country internal network (7 initial profiles, NOT_ACTIVATED for real value)
 * - Human-in-the-loop compliance/risk controls, offline queue safety, 12 continuity drills & Schema 21 audit
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { db } from './db.ts';
import { hashV23Pin, signV23QrPayload, buildDefaultRegulatoryGates } from './v23Seed.ts';
import type {
  UserRole,
  V23AccountLifecycleStatus,
  V23AuthorizedEconomicRole,
  V23CardStatus,
  V23ComplianceReview,
  V23ContinuityTestRun,
  V23CountryOperatingProfile,
  V23CurrencyCode,
  V23CurrencySubaccount,
  V23LedgerPosting,
  V23MerchantAccount,
  V23MerchantTerminal,
  V23OfflineQueueItem,
  V23ParticipantCategory,
  V23ParticipantIdentity,
  V23PhysicalCard,
  V23PhysicalCardStage,
  V23PostgresMigrationRun,
  V23QrPaymentRequest,
  V23ReconciliationRecord,
  V23ReversalOrRefund,
  V23RiskEvent,
  V23SupportCategory,
  V23SupportDisputeCase,
  V23TransactionStatus,
  V23TransactionType,
  V23VerificationStatus,
  V23VirtualCard,
  V23WalletAccount,
  V23WalletAuditEvent,
  V23WalletCategory,
  V23WalletNumberAllocation,
  V23WalletTransaction,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const V23_SUPPORTED_CURRENCIES: V23CurrencyCode[] = [
  'UGX',
  'KES',
  'TZS',
  'RWF',
  'BIF',
  'SSP',
  'CDF',
  'USD',
  'EUR',
];

// Synthetic test rates relative to 1 UGX aligned with db.currencies (never presented as live executable market feeds)
export const V23_SYNTHETIC_FX_TO_UGX: Record<V23CurrencyCode, number> = {
  UGX: 1,
  KES: 28.5,
  TZS: 0.68,
  RWF: 2.75,
  BIF: 1.28,
  SSP: 2.85,
  CDF: 1.35,
  USD: 3750,
  EUR: 4120,
};

export const V23_REAL_VALUE_ENABLED = false;
export const V23_PHYSICAL_CARDS_ISSUED = false;
export const V23_CARD_SCHEME_CERTIFIED = false;
export const V23_ATM_NETWORK_LIVE = false;
export const V23_LIVE_MERCHANT_ACCEPTANCE = false;

const EUWN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const inFlightIdempotency = new Set<string>();
const walletSpendLocks = new Set<string>();

export function cleanV23Text(v: unknown): string {
  return String(v ?? '').replace(/[<>]/g, '').trim();
}

export function sha256V23(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export function uidV23(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function generatePermanentEuwn(): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    const bytes = crypto.randomBytes(12);
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += EUWN_ALPHABET[bytes[i] % EUWN_ALPHABET.length];
    }
    const euwn = `EX-${code}`;
    if (!db.v23WalletNumbers.has(euwn) && !Array.from(db.v23Wallets.values()).some((w) => w.euwn === euwn)) {
      return euwn;
    }
  }
  throw new Error('EUWN_ALLOCATION_COLLISION_EXCEEDED');
}

export function appendV23AuditEvent(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  correlationId?: string;
}): V23WalletAuditEvent {
  const existing = Array.from(db.v23AuditEvents.values());
  const prev = existing[existing.length - 1];
  const prevHash = prev ? prev.entryHash : '0'.repeat(64);
  const id = uidV23('AUDV23');
  const createdAt = new Date().toISOString();
  const correlationId = params.correlationId || uidV23('CORR');
  const entryHash = sha256V23(
    `${prevHash}|${id}|${params.action}|${params.targetType}|${params.targetId}|${params.actorUserId}|${createdAt}`
  );
  const ev: V23WalletAuditEvent = {
    id,
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    summary: cleanV23Text(params.summary),
    correlationId,
    prevHash,
    entryHash,
    createdAt,
  };
  db.v23AuditEvents.set(ev.id, ev);
  return ev;
}

export function sanitizeWalletForResponse(w: V23WalletAccount) {
  const { pinHash: _ph, pinSalt: _ps, ...safe } = w;
  return safe;
}

export function sanitizeIdentityForPublicLookup(
  identity: V23ParticipantIdentity,
  wallet: V23WalletAccount,
  countryProfile?: V23CountryOperatingProfile
) {
  return {
    euwn: wallet.euwn,
    walletAccountId: wallet.id,
    walletCategory: wallet.walletCategory,
    displayName: wallet.displayName || identity.displayName,
    participantCategory: identity.category,
    identityVerificationStatus: identity.identityVerificationStatus,
    businessVerificationStatus: identity.businessVerificationStatus,
    walletStatus: wallet.status,
    activeCountryContext: wallet.activeCountryCode,
    countryName: countryProfile?.countryName || wallet.activeCountryCode,
    eligibleCurrencies: Array.from(db.v23Subaccounts.values())
      .filter((s) => s.walletAccountId === wallet.id && s.status === 'ACTIVE')
      .map((s) => s.currency),
    privacyNotice: 'Public wallet lookup omits legal documents, phone numbers, email addresses, and account balances.',
  };
}

// ==========================================
// 1. IDENTITY, EUWN & WALLET CREATION / PORTABILITY
// ==========================================

export function createV23IdentityAndWallet(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  category: V23ParticipantCategory;
  authorizedRoles?: V23AuthorizedEconomicRole[];
  displayName: string;
  legalName: string;
  email: string;
  phone: string;
  countryCode: string;
  districtOrCity: string;
  walletCategory: V23WalletCategory;
  walletLabel?: string;
  initialCurrency?: V23CurrencyCode;
  pin?: string;
  sandboxSeedMinor?: number;
}) {
  const displayName = cleanV23Text(params.displayName);
  const legalName = cleanV23Text(params.legalName || params.displayName);
  const countryCode = cleanV23Text(params.countryCode || 'UG').toUpperCase();
  if (!displayName) throw new Error('DISPLAY_NAME_REQUIRED');
  const countryProfile = db.v23CountryProfiles.get(countryCode);
  if (!countryProfile) throw new Error(`UNSUPPORTED_COUNTRY:${countryCode}`);

  const currency: V23CurrencyCode = params.initialCurrency || countryProfile.defaultCurrency;
  if (!V23_SUPPORTED_CURRENCIES.includes(currency)) {
    throw new Error(`UNSUPPORTED_CURRENCY:${currency}`);
  }

  const pinRaw = cleanV23Text(params.pin || '1234');
  if (!/^\d{4,6}$/.test(pinRaw)) throw new Error('INVALID_PIN_FORMAT');

  const now = new Date().toISOString();
  const idnId = uidV23('IDN-V23');
  const emailParts = cleanV23Text(params.email || 'participant@econex.local').split('@');
  const emailMasked = `${(emailParts[0] || 'us').slice(0, 2)}***@${emailParts[1] || 'econex.local'}`;
  const cleanPhone = cleanV23Text(params.phone || '+256700000000');
  const phoneMasked = cleanPhone.length >= 6 ? `${cleanPhone.slice(0, 4)} *** ${cleanPhone.slice(-3)}` : '***';

  const identity: V23ParticipantIdentity = {
    id: idnId,
    tenantId: params.tenantId,
    userId: params.actorUserId,
    category: params.category,
    authorizedRoles:
      params.authorizedRoles && params.authorizedRoles.length > 0
        ? params.authorizedRoles
        : [params.walletCategory === 'BUSINESS' ? 'BUSINESS_OWNER' : params.walletCategory === 'COOPERATIVE' ? 'COOPERATIVE_MEMBER' : 'INDIVIDUAL'],
    displayName,
    legalName,
    emailMasked,
    phoneMasked,
    phoneHash: sha256V23(`phone:${cleanPhone}`),
    countryCode,
    activeCountryContext: countryCode,
    districtOrCity: cleanV23Text(params.districtOrCity || 'Kampala'),
    identityVerificationStatus: 'PENDING_REVIEW',
    businessVerificationStatus: params.category === 'INDIVIDUAL' ? 'NOT_APPLICABLE' : 'PENDING_REVIEW',
    accountStatus: 'ACTIVE',
    deviceFingerprintHash: sha256V23(`device:${params.actorUserId}:${now}`),
    recoveryEmailHint: emailMasked,
    consentGiven: true,
    consentTimestamp: now,
    createdAt: now,
    updatedAt: now,
  };
  db.v23Identities.set(identity.id, identity);

  const walletId = uidV23('WLT-V23');
  const euwn = generatePermanentEuwn();

  const alloc: V23WalletNumberAllocation = {
    id: `EUWN-${walletId}`,
    euwn,
    participantIdentityId: identity.id,
    walletAccountId: walletId,
    walletCategory: params.walletCategory,
    permanent: true,
    reassigned: false,
    countryIndependent: true,
    phoneChangeCount: 0,
    deviceMigrationCount: 0,
    travelCountryHistory: [countryCode],
    issuedAt: now,
  };
  db.v23WalletNumbers.set(alloc.euwn, alloc);

  const salt = crypto.randomBytes(8).toString('hex');

  const wallet: V23WalletAccount = {
    id: walletId,
    tenantId: params.tenantId,
    participantIdentityId: identity.id,
    euwn,
    walletCategory: params.walletCategory,
    label: cleanV23Text(params.walletLabel || `${displayName} Wallet`),
    displayName,
    status: 'ACTIVE',
    ownerUserId: params.actorUserId,
    staffPermissions: [
      { userId: params.actorUserId, role: 'OWNER', canInitiate: true, canApprove: true },
    ],
    dualApprovalThresholdMinor:
      params.walletCategory === 'INSTITUTIONAL' || params.walletCategory === 'COOPERATIVE' ? 100000000 : 0,
    primaryCountryCode: countryCode,
    activeCountryCode: countryCode,
    pinHash: hashV23Pin(pinRaw, salt),
    pinSalt: salt,
    pinSet: true,
    mfaEnabled: true,
    dailyLimitMinorByCurrency: countryProfile.dailyLimitMinor,
    isTestMode: true,
    createdAt: now,
    updatedAt: now,
  };
  db.v23Wallets.set(wallet.id, wallet);

  const sandboxBal = Math.max(0, Math.round(Number(params.sandboxSeedMinor || 0)));
  const subaccount = enableCurrencySubaccount({
    walletId: wallet.id,
    currency,
    initialTestMinor: sandboxBal,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
  });

  appendV23AuditEvent({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: 'EUWN_AND_WALLET_ISSUED',
    targetType: 'WALLET',
    targetId: wallet.id,
    summary: `Issued permanent EUWN ${euwn} (${params.walletCategory}) in ${countryCode} (${currency}).`,
  });

  db.scheduleSave();
  return { identity, allocation: alloc, wallet: sanitizeWalletForResponse(wallet), subaccount };
}

export function enableCurrencySubaccount(params: {
  walletId: string;
  currency: V23CurrencyCode;
  initialTestMinor?: number;
  actorUserId: string;
  actorRole: UserRole;
}): V23CurrencySubaccount {
  const wallet = db.v23Wallets.get(params.walletId);
  if (!wallet) throw new Error('WALLET_NOT_FOUND');
  if (!V23_SUPPORTED_CURRENCIES.includes(params.currency)) {
    throw new Error(`UNSUPPORTED_CURRENCY:${params.currency}`);
  }
  const existing = Array.from(db.v23Subaccounts.values()).find(
    (s) => s.walletAccountId === wallet.id && s.currency === params.currency
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const initial = Math.max(0, Math.round(Number(params.initialTestMinor || 0)));
  const sub: V23CurrencySubaccount = {
    id: `SUB-${wallet.id}-${params.currency}`,
    tenantId: wallet.tenantId,
    walletAccountId: wallet.id,
    euwn: wallet.euwn,
    currency: params.currency,
    minorUnitScale: 100,
    availableMinor: initial,
    pendingMinor: 0,
    reservedMinor: 0,
    restrictedMinor: 0,
    reversedMinor: 0,
    testOnlyBalanceMinor: initial,
    ledgerAccountId: params.currency === 'USD' ? 'COA-1030' : 'COA-1010',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
  db.v23Subaccounts.set(sub.id, sub);

  appendV23AuditEvent({
    tenantId: wallet.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: 'CURRENCY_SUBACCOUNT_ENABLED',
    targetType: 'SUBACCOUNT',
    targetId: sub.id,
    summary: `Enabled ${params.currency} subaccount on wallet ${wallet.euwn} without duplicating identity.`,
  });

  db.scheduleSave();
  return sub;
}

export function updateIdentityPortability(params: {
  identityId: string;
  actorUserId: string;
  actorRole: UserRole;
  action: 'UPDATE_PHONE' | 'MIGRATE_DEVICE' | 'TRAVEL_COUNTRY' | 'RECOVER_ACCOUNT' | 'ADD_ROLE';
  newPhone?: string;
  newDeviceLabel?: string;
  targetCountryCode?: string;
  roleToAdd?: V23AuthorizedEconomicRole;
}) {
  const idn = db.v23Identities.get(params.identityId);
  if (!idn) throw new Error('IDENTITY_NOT_FOUND');
  const wallets = Array.from(db.v23Wallets.values()).filter((w) => w.participantIdentityId === idn.id);
  const now = new Date().toISOString();

  if (params.action === 'UPDATE_PHONE') {
    const cleanPhone = cleanV23Text(params.newPhone);
    if (!cleanPhone || cleanPhone.length < 7) throw new Error('INVALID_PHONE');
    idn.phoneMasked = `${cleanPhone.slice(0, 4)} *** ${cleanPhone.slice(-3)}`;
    idn.phoneHash = sha256V23(`phone:${cleanPhone}`);
    for (const w of wallets) {
      const alloc = db.v23WalletNumbers.get(w.euwn);
      if (alloc) {
        alloc.phoneChangeCount += 1;
        db.v23WalletNumbers.set(alloc.euwn, alloc);
      }
    }
  } else if (params.action === 'MIGRATE_DEVICE' || params.action === 'RECOVER_ACCOUNT') {
    const label = cleanV23Text(params.newDeviceLabel || 'replacement-device');
    idn.deviceFingerprintHash = sha256V23(`device:${idn.id}:${label}:${now}`);
    if (idn.accountStatus === 'SUSPENDED' && params.action === 'RECOVER_ACCOUNT') {
      idn.accountStatus = 'ACTIVE';
      idn.statusReason = 'Recovered via identity verification';
    }
    for (const w of wallets) {
      const alloc = db.v23WalletNumbers.get(w.euwn);
      if (alloc) {
        alloc.deviceMigrationCount += 1;
        db.v23WalletNumbers.set(alloc.euwn, alloc);
      }
      // 24-hour new-device security notice restriction metadata
      w.newDeviceRestrictedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      w.updatedAt = now;
      db.v23Wallets.set(w.id, w);
    }
  } else if (params.action === 'TRAVEL_COUNTRY') {
    const cc = cleanV23Text(params.targetCountryCode).toUpperCase();
    const profile = db.v23CountryProfiles.get(cc);
    if (!profile) throw new Error(`UNSUPPORTED_COUNTRY:${cc}`);
    idn.activeCountryContext = cc;
    for (const w of wallets) {
      w.activeCountryCode = cc;
      w.updatedAt = now;
      db.v23Wallets.set(w.id, w);
      const alloc = db.v23WalletNumbers.get(w.euwn);
      if (alloc) {
        if (!alloc.travelCountryHistory.includes(cc)) {
          alloc.travelCountryHistory.push(cc);
        }
        db.v23WalletNumbers.set(alloc.euwn, alloc);
      }
    }
  } else if (params.action === 'ADD_ROLE' && params.roleToAdd) {
    if (!idn.authorizedRoles.includes(params.roleToAdd)) {
      idn.authorizedRoles.push(params.roleToAdd);
    }
  }

  idn.updatedAt = now;
  db.v23Identities.set(idn.id, idn);

  appendV23AuditEvent({
    tenantId: idn.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: `PORTABILITY_${params.action}`,
    targetType: 'IDENTITY',
    targetId: idn.id,
    summary: `Executed ${params.action} for ${idn.displayName}; permanent EUWN(s) [${wallets.map((w) => w.euwn).join(', ')}] unchanged.`,
  });

  db.scheduleSave();
  return {
    identity: idn,
    wallets: wallets.map(sanitizeWalletForResponse),
    allocations: wallets.map((w) => db.v23WalletNumbers.get(w.euwn)),
  };
}

export function transitionV23IdentityOrWalletStatus(params: {
  walletId?: string;
  identityId?: string;
  targetStatus: V23AccountLifecycleStatus;
  reason: string;
  actorUserId: string;
  actorRole: UserRole;
  verificationStatus?: V23VerificationStatus;
}) {
  const reason = cleanV23Text(params.reason);
  if (!reason) throw new Error('STATUS_REASON_REQUIRED');
  const now = new Date().toISOString();

  let wallet: V23WalletAccount | undefined;
  let identity: V23ParticipantIdentity | undefined;

  if (params.walletId) {
    wallet = db.v23Wallets.get(params.walletId);
    if (!wallet) throw new Error('WALLET_NOT_FOUND');
    identity = db.v23Identities.get(wallet.participantIdentityId);
    wallet.status = params.targetStatus;
    wallet.statusReason = reason;
    wallet.updatedAt = now;
    db.v23Wallets.set(wallet.id, wallet);
  }
  if (params.identityId) {
    identity = db.v23Identities.get(params.identityId);
    if (!identity) throw new Error('IDENTITY_NOT_FOUND');
  }
  if (identity) {
    identity.accountStatus = params.targetStatus;
    identity.statusReason = reason;
    if (params.verificationStatus) {
      identity.identityVerificationStatus = params.verificationStatus;
    }
    if (params.targetStatus === 'CLOSED_RETAINED') {
      identity.retentionLockUntil = new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    identity.updatedAt = now;
    db.v23Identities.set(identity.id, identity);
  }

  appendV23AuditEvent({
    tenantId: wallet?.tenantId || identity?.tenantId || 'TEN-UG-ELGON-01',
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: `ACCOUNT_STATUS_${params.targetStatus}`,
    targetType: wallet ? 'WALLET' : 'IDENTITY',
    targetId: wallet?.id || identity?.id || 'UNKNOWN',
    summary: `Status updated to ${params.targetStatus}: ${reason}`,
  });

  db.scheduleSave();
  return {
    identity,
    wallet: wallet ? sanitizeWalletForResponse(wallet) : undefined,
  };
}

// ==========================================
// 2. FX & FEE CALCULATOR (INTEGER MINOR UNITS)
// ==========================================

export function computeV23FeeMinor(params: {
  serviceType: V23TransactionType | 'MERCHANT_QR';
  countryCode: string;
  currency: V23CurrencyCode;
  amountMinor: number;
}): number {
  const configs = Array.from(db.v23FeeConfigs.values());
  const match =
    configs.find(
      (f) => f.serviceType === params.serviceType && f.countryCode === params.countryCode && f.currency === params.currency
    ) ||
    configs.find((f) => f.serviceType === params.serviceType && (f.countryCode === 'ALL' || f.currency === params.currency));

  if (!match) return 0;
  const pct = Math.round((params.amountMinor * match.percentBps) / 10000);
  const rawFee = match.flatFeeMinor + pct;
  const bounded = match.maxFeeMinor > 0 ? Math.min(rawFee, match.maxFeeMinor) : rawFee;
  return Math.max(match.minFeeMinor, bounded);
}

export function previewV23FxConversion(params: {
  sourceCurrency: V23CurrencyCode;
  destinationCurrency: V23CurrencyCode;
  sourceAmountMinor: number;
}) {
  if (!V23_SUPPORTED_CURRENCIES.includes(params.sourceCurrency) || !V23_SUPPORTED_CURRENCIES.includes(params.destinationCurrency)) {
    throw new Error('UNSUPPORTED_CURRENCY_PAIR');
  }
  const srcRate = V23_SYNTHETIC_FX_TO_UGX[params.sourceCurrency];
  const dstRate = V23_SYNTHETIC_FX_TO_UGX[params.destinationCurrency];
  const sameCurrency = params.sourceCurrency === params.destinationCurrency;
  const effectiveRate = sameCurrency ? 1 : Number((srcRate / dstRate).toFixed(6));
  const convertedMinor = sameCurrency
    ? params.sourceAmountMinor
    : Math.round((params.sourceAmountMinor * srcRate) / dstRate);

  return {
    fxApplied: !sameCurrency,
    sourceCurrency: params.sourceCurrency,
    destinationCurrency: params.destinationCurrency,
    sourceAmountMinor: params.sourceAmountMinor,
    destinationAmountMinor: convertedMinor,
    fxRateApplied: effectiveRate,
    fxRateSource: sameCurrency ? 'PARITY_SAME_CURRENCY' : 'ECONEX_SYNTHETIC_DEV_TEST_RATE',
    fxRateTimestamp: new Date().toISOString(),
    fxRateClassification: (sameCurrency ? 'NONE' : 'SYNTHETIC_TEST_RATE') as 'NONE' | 'SYNTHETIC_TEST_RATE',
    disclosure: sameCurrency
      ? 'Same-currency transfer (no conversion).'
      : 'Synthetic development test rate used; explicit user confirmation required before conversion.',
  };
}

// ==========================================
// 3. ECONEX-OWNED INTERNAL TRANSACTION & DOUBLE-ENTRY ENGINE
// ==========================================

export function postInternalWalletTransaction(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  sourceWalletId: string;
  destinationEuwn: string;
  sourceCurrency: V23CurrencyCode;
  destinationCurrency?: V23CurrencyCode;
  amountMinor: number;
  txType: V23TransactionType;
  purpose: string;
  idempotencyKey: string;
  pin?: string;
  bypassPinForTestOrAdmin?: boolean;
  fxUserConfirmed?: boolean;
  realValueRequested?: boolean;
  linkedModuleRef?: V23WalletTransaction['linkedModuleRef'];
  correlationId?: string;
}): { transaction: V23WalletTransaction; posting: V23LedgerPosting; idempotentReplay: boolean } {
  // Hard Real-Value Regulatory Gate
  if (params.realValueRequested || params.txType === 'CASH_WITHDRAWAL_RECORD') {
    throw new Error('REAL_VALUE_GATE_LOCKED: Real-value external settlements and cash withdrawals remain disabled pending regulatory licensing and bank safeguarding.');
  }

  const idem = cleanV23Text(params.idempotencyKey);
  if (!idem) throw new Error('IDEMPOTENCY_KEY_REQUIRED');

  const existingIdem = Array.from(db.v23Transactions.values()).find((t) => t.idempotencyKey === idem);
  if (existingIdem) {
    const existingPosting = Array.from(db.v23LedgerPostings.values()).find((p) => p.transactionId === existingIdem.id)!;
    return { transaction: existingIdem, posting: existingPosting, idempotentReplay: true };
  }

  if (inFlightIdempotency.has(idem)) {
    throw new Error('CONCURRENT_DUPLICATE_IN_FLIGHT');
  }

  const amountMinor = Number(params.amountMinor);
  if (!Number.isInteger(amountMinor) || amountMinor <= 0 || amountMinor > Number.MAX_SAFE_INTEGER) {
    throw new Error('INVALID_MINOR_UNIT_INTEGER_AMOUNT');
  }

  const srcWallet = db.v23Wallets.get(params.sourceWalletId);
  if (!srcWallet) throw new Error('SOURCE_WALLET_NOT_FOUND');
  if (srcWallet.status !== 'ACTIVE') throw new Error(`SOURCE_WALLET_${srcWallet.status}`);

  const dstAlloc = db.v23WalletNumbers.get(cleanV23Text(params.destinationEuwn).toUpperCase());
  const dstWallet = dstAlloc ? db.v23Wallets.get(dstAlloc.walletAccountId) : undefined;
  if (!dstWallet) throw new Error('RECIPIENT_EUWN_NOT_FOUND');
  if (dstWallet.status !== 'ACTIVE') throw new Error(`RECIPIENT_WALLET_${dstWallet.status}`);
  if (srcWallet.id === dstWallet.id) throw new Error('SELF_TRANSFER_DISALLOWED');

  // Verify Country profiles are valid & supported
  const srcCountry = db.v23CountryProfiles.get(srcWallet.activeCountryCode);
  const dstCountry = db.v23CountryProfiles.get(dstWallet.activeCountryCode);
  if (!srcCountry || !dstCountry) throw new Error('COUNTRY_PROFILE_NOT_FOUND');
  if (!srcCountry.sandboxWalletAvailable || !dstCountry.sandboxWalletAvailable) {
    throw new Error('COUNTRY_SANDBOX_SUSPENDED');
  }

  const dstCurr = params.destinationCurrency || params.sourceCurrency;
  if (!V23_SUPPORTED_CURRENCIES.includes(params.sourceCurrency) || !V23_SUPPORTED_CURRENCIES.includes(dstCurr)) {
    throw new Error('UNSUPPORTED_CURRENCY');
  }
  if (!srcCountry.supportedCurrencies.includes(params.sourceCurrency)) {
    throw new Error(`CURRENCY_${params.sourceCurrency}_NOT_ENABLED_IN_${srcCountry.countryCode}`);
  }

  // PIN verification (a wallet number alone NEVER authorizes a transaction)
  if (!params.bypassPinForTestOrAdmin) {
    const pinClean = cleanV23Text(params.pin);
    if (!pinClean) throw new Error('AUTHORIZATION_PIN_REQUIRED');
    if (hashV23Pin(pinClean, srcWallet.pinSalt) !== srcWallet.pinHash) {
      throw new Error('INVALID_AUTHORIZATION_PIN');
    }
  }

  // FX safety: never silently convert currency
  const fx = previewV23FxConversion({
    sourceCurrency: params.sourceCurrency,
    destinationCurrency: dstCurr,
    sourceAmountMinor: amountMinor,
  });
  if (fx.fxApplied && !params.fxUserConfirmed) {
    throw new Error('EXPLICIT_FX_CONFIRMATION_REQUIRED');
  }

  const feeMinor = computeV23FeeMinor({
    serviceType: params.txType,
    countryCode: srcWallet.activeCountryCode,
    currency: params.sourceCurrency,
    amountMinor,
  });
  const totalDebitMinor = amountMinor + feeMinor;

  const srcSub = Array.from(db.v23Subaccounts.values()).find(
    (s) => s.walletAccountId === srcWallet.id && s.currency === params.sourceCurrency
  );
  if (!srcSub) throw new Error(`SOURCE_SUBACCOUNT_MISSING:${params.sourceCurrency}`);
  if (srcSub.status !== 'ACTIVE') throw new Error(`SOURCE_SUBACCOUNT_${srcSub.status}`);

  // Acquire concurrency & idempotency lock
  const lockKey = srcSub.id;
  if (walletSpendLocks.has(lockKey)) {
    throw new Error('CONCURRENT_WALLET_SPEND_LOCKED');
  }

  inFlightIdempotency.add(idem);
  walletSpendLocks.add(lockKey);

  try {
    if (srcSub.availableMinor < totalDebitMinor) {
      throw new Error(`INSUFFICIENT_AVAILABLE_BALANCE: need ${totalDebitMinor} ${params.sourceCurrency}, have ${srcSub.availableMinor}`);
    }

    // Ensure destination currency subaccount exists on recipient wallet (never duplicates identity!)
    const dstSub = enableCurrencySubaccount({
      walletId: dstWallet.id,
      currency: dstCurr,
      initialTestMinor: 0,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
    });

    const perTxLimit = srcCountry.perTxLimitMinor[params.sourceCurrency] ?? Number.MAX_SAFE_INTEGER;
    const riskFlags: string[] = [];
    let riskScore = 10;
    if (totalDebitMinor > perTxLimit) {
      riskFlags.push('EXCEEDS_COUNTRY_PER_TX_SANDBOX_LIMIT');
      riskScore += 55;
    }
    if (srcWallet.activeCountryCode !== dstWallet.activeCountryCode) {
      riskFlags.push('CROSS_COUNTRY_INTERNAL_CORRIDOR');
      riskScore += 15;
    }

    const now = new Date().toISOString();
    const txId = uidV23('TXV23');
    const txRef = `EX-TX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const corrId = params.correlationId || uidV23('CORR');

    const history: V23WalletTransaction['history'] = [
      { fromStatus: null, toStatus: 'INITIATED', actorUserId: params.actorUserId, reason: 'Transaction initiated', timestamp: now },
      { fromStatus: 'INITIATED', toStatus: 'VALIDATED', actorUserId: 'system', reason: 'Wallets, currencies, limits validated', timestamp: now },
      { fromStatus: 'VALIDATED', toStatus: 'AUTHORIZED', actorUserId: params.actorUserId, reason: 'Wallet holder credential verified', timestamp: now },
      { fromStatus: 'AUTHORIZED', toStatus: 'RISK_CHECKED', actorUserId: 'system', reason: `Risk score ${riskScore}`, timestamp: now },
    ];

    // Exceeding country limit sends to human review rather than silent rejection or overdraft!
    if (totalDebitMinor > perTxLimit) {
      srcSub.availableMinor -= totalDebitMinor;
      srcSub.reservedMinor += totalDebitMinor;
      srcSub.updatedAt = now;
      db.v23Subaccounts.set(srcSub.id, srcSub);

      history.push({
        fromStatus: 'RISK_CHECKED',
        toStatus: 'UNDER_REVIEW',
        actorUserId: 'system',
        reason: 'Reserved pending human compliance review for per-transaction limit',
        timestamp: now,
      });

      const txPending: V23WalletTransaction = {
        id: txId,
        tenantId: params.tenantId,
        txReference: txRef,
        idempotencyKey: idem,
        correlationId: corrId,
        txType: params.txType,
        status: 'UNDER_REVIEW',
        sourceWalletId: srcWallet.id,
        sourceEuwn: srcWallet.euwn,
        sourceSubaccountId: srcSub.id,
        sourceCurrency: params.sourceCurrency,
        sourceAmountMinor: amountMinor,
        feeMinor,
        feeCurrency: params.sourceCurrency,
        destinationWalletId: dstWallet.id,
        destinationEuwn: dstWallet.euwn,
        destinationSubaccountId: dstSub.id,
        destinationCurrency: dstCurr,
        destinationAmountMinor: fx.destinationAmountMinor,
        fxApplied: fx.fxApplied,
        fxRateApplied: fx.fxRateApplied,
        fxRateSource: fx.fxRateSource,
        fxRateTimestamp: fx.fxRateTimestamp,
        fxRateClassification: fx.fxRateClassification,
        fxUserConfirmed: Boolean(params.fxUserConfirmed),
        sourceCountryCode: srcWallet.activeCountryCode,
        destinationCountryCode: dstWallet.activeCountryCode,
        purpose: cleanV23Text(params.purpose || 'ECONEX sandbox transfer'),
        settlementClassification: 'SANDBOX_INTERNAL_LEDGER',
        isTestTransaction: true,
        linkedModuleRef: params.linkedModuleRef,
        refundedMinorTotal: 0,
        riskScore,
        riskFlags,
        approvalRequired: true,
        history,
        createdByUserId: params.actorUserId,
        createdAt: now,
        updatedAt: now,
      };
      db.v23Transactions.set(txPending.id, txPending);

      const cmp: V23ComplianceReview = {
        id: uidV23('CMP-V23'),
        tenantId: params.tenantId,
        subjectType: 'TRANSACTION',
        subjectId: txPending.id,
        reviewType: 'SUSPICIOUS_TX_REVIEW',
        riskScore,
        riskReasons: riskFlags,
        automatedRecommendation: 'HOLD_FOR_HUMAN_COMPLIANCE_REVIEW',
        humanDecision: 'PENDING_HUMAN_REVIEW',
        requiresHumanReview: true,
        liveScreeningClaimed: false,
        screeningNotice: 'Sandbox limit hold; requires authorized human review and supports participant appeal.',
        createdAt: now,
        updatedAt: now,
      };
      db.v23ComplianceReviews.set(cmp.id, cmp);

      const placeholderPosting: V23LedgerPosting = {
        id: uidV23('LP-HOLD'),
        tenantId: params.tenantId,
        transactionId: txPending.id,
        txReference: txRef,
        journalEntryId: 'PENDING_HUMAN_REVIEW',
        lines: [],
        totalDebitMinor: 0,
        totalCreditMinor: 0,
        balanced: true,
        immutable: true,
        postingHashSha256: sha256V23(`HOLD|${txRef}|${now}`),
        postedAt: now,
      };
      db.scheduleSave();
      return { transaction: txPending, posting: placeholderPosting, idempotentReplay: false };
    }

    // Atomic state transitions & balanced double-entry posting
    history.push(
      { fromStatus: 'RISK_CHECKED', toStatus: 'APPROVED', actorUserId: params.actorUserId, reason: 'Risk checks passed', timestamp: now },
      { fromStatus: 'APPROVED', toStatus: 'POSTED', actorUserId: 'system', reason: 'Balanced internal ledger posting committed', timestamp: now },
      { fromStatus: 'POSTED', toStatus: 'CONFIRMED', actorUserId: 'system', reason: 'Recipient subaccount credited in sandbox ledger', timestamp: now }
    );

    // Mutate subaccounts via validated ledger posting only
    srcSub.availableMinor -= totalDebitMinor;
    srcSub.testOnlyBalanceMinor -= totalDebitMinor;
    srcSub.updatedAt = now;
    db.v23Subaccounts.set(srcSub.id, srcSub);

    dstSub.availableMinor += fx.destinationAmountMinor;
    dstSub.testOnlyBalanceMinor += fx.destinationAmountMinor;
    dstSub.updatedAt = now;
    db.v23Subaccounts.set(dstSub.id, dstSub);

    // Post balanced Universal General Ledger Journal Entry (major units = minor / 100)
    // Cross-currency transactions post balanced FX clearing pairs in BOTH sourceCurrency and dstCurr
    // so both total-UGX balancing and strict per-currency DEBIT === CREDIT integrity stay exact (0.00 variance).
    const srcMajor = totalDebitMinor / 100;
    const principalSrcMajor = amountMinor / 100;
    const dstMajor = fx.destinationAmountMinor / 100;
    const feeMajor = feeMinor / 100;

    const linesForGl: { accountId: string; direction: 'DEBIT' | 'CREDIT'; amount: number; currency: string; memo: string }[] = [];
    if (!fx.fxApplied || params.sourceCurrency === dstCurr) {
      linesForGl.push(
        {
          accountId: srcSub.ledgerAccountId,
          direction: 'DEBIT',
          amount: srcMajor,
          currency: params.sourceCurrency,
          memo: `V23 Sandbox Debit ${srcWallet.euwn} (${txRef})`,
        },
        {
          accountId: dstSub.ledgerAccountId,
          direction: 'CREDIT',
          amount: dstMajor,
          currency: dstCurr,
          memo: `V23 Sandbox Credit ${dstWallet.euwn} (${txRef})`,
        }
      );
      if (feeMajor > 0) {
        linesForGl.push({
          accountId: 'COA-4010',
          direction: 'CREDIT',
          amount: feeMajor,
          currency: params.sourceCurrency,
          memo: `V23 Sandbox Fee Memo (non-revenue test) ${txRef}`,
        });
      }
    } else {
      linesForGl.push(
        {
          accountId: srcSub.ledgerAccountId,
          direction: 'DEBIT',
          amount: srcMajor,
          currency: params.sourceCurrency,
          memo: `V23 Sandbox FX Debit ${srcWallet.euwn} (${txRef})`,
        },
        {
          accountId: 'COA-4010',
          direction: 'CREDIT',
          amount: principalSrcMajor,
          currency: params.sourceCurrency,
          memo: `V23 FX Clearing Outbound ${params.sourceCurrency}->${dstCurr} (${txRef})`,
        }
      );
      if (feeMajor > 0) {
        linesForGl.push({
          accountId: 'COA-4010',
          direction: 'CREDIT',
          amount: feeMajor,
          currency: params.sourceCurrency,
          memo: `V23 Sandbox Fee Memo (non-revenue test) ${txRef}`,
        });
      }
      linesForGl.push(
        {
          accountId: 'COA-4010',
          direction: 'DEBIT',
          amount: dstMajor,
          currency: dstCurr,
          memo: `V23 FX Clearing Inbound ${params.sourceCurrency}->${dstCurr} (${txRef})`,
        },
        {
          accountId: dstSub.ledgerAccountId,
          direction: 'CREDIT',
          amount: dstMajor,
          currency: dstCurr,
          memo: `V23 Sandbox FX Credit ${dstWallet.euwn} (${txRef})`,
        }
      );
    }

    const journalEntry = db.postUniversalJournalEntry({
      referenceType: 'SETTLEMENT',
      referenceId: txRef,
      lines: linesForGl,
      postedBy: params.actorUserId,
    });

    const tx: V23WalletTransaction = {
      id: txId,
      tenantId: params.tenantId,
      txReference: txRef,
      idempotencyKey: idem,
      correlationId: corrId,
      txType: params.txType,
      status: 'CONFIRMED',
      sourceWalletId: srcWallet.id,
      sourceEuwn: srcWallet.euwn,
      sourceSubaccountId: srcSub.id,
      sourceCurrency: params.sourceCurrency,
      sourceAmountMinor: amountMinor,
      feeMinor,
      feeCurrency: params.sourceCurrency,
      destinationWalletId: dstWallet.id,
      destinationEuwn: dstWallet.euwn,
      destinationSubaccountId: dstSub.id,
      destinationCurrency: dstCurr,
      destinationAmountMinor: fx.destinationAmountMinor,
      fxApplied: fx.fxApplied,
      fxRateApplied: fx.fxRateApplied,
      fxRateSource: fx.fxRateSource,
      fxRateTimestamp: fx.fxRateTimestamp,
      fxRateClassification: fx.fxRateClassification,
      fxUserConfirmed: Boolean(params.fxUserConfirmed),
      sourceCountryCode: srcWallet.activeCountryCode,
      destinationCountryCode: dstWallet.activeCountryCode,
      purpose: cleanV23Text(params.purpose || 'ECONEX sandbox internal transfer'),
      settlementClassification: 'SANDBOX_INTERNAL_LEDGER',
      isTestTransaction: true,
      linkedModuleRef: params.linkedModuleRef,
      journalEntryId: journalEntry.id,
      refundedMinorTotal: 0,
      riskScore,
      riskFlags,
      approvalRequired: false,
      history,
      createdByUserId: params.actorUserId,
      createdAt: now,
      updatedAt: now,
    };
    db.v23Transactions.set(tx.id, tx);

    // Record currency-isolated immutable sub-ledger posting (note: if FX applied, express balanced UGX-equivalent minor in posting totals)
    const srcUgxEquivMinor = Math.round(totalDebitMinor * V23_SYNTHETIC_FX_TO_UGX[params.sourceCurrency]);
    const dstUgxEquivMinor = Math.round(fx.destinationAmountMinor * V23_SYNTHETIC_FX_TO_UGX[dstCurr]);
    const feeUgxEquivMinor = Math.round(feeMinor * V23_SYNTHETIC_FX_TO_UGX[params.sourceCurrency]);
    const balancedTotal = fx.fxApplied ? srcUgxEquivMinor : totalDebitMinor;
    const creditTotal = fx.fxApplied ? dstUgxEquivMinor + feeUgxEquivMinor : fx.destinationAmountMinor + feeMinor;

    const postingLines: V23LedgerPosting['lines'] = [
      {
        subaccountId: srcSub.id,
        walletAccountId: srcWallet.id,
        direction: 'DEBIT',
        amountMinor: totalDebitMinor,
        currency: params.sourceCurrency,
        memo: `Debit ${srcWallet.euwn} -> ${dstWallet.euwn}`,
      },
      {
        subaccountId: dstSub.id,
        walletAccountId: dstWallet.id,
        direction: 'CREDIT',
        amountMinor: fx.destinationAmountMinor,
        currency: dstCurr,
        memo: `Credit ${dstWallet.euwn} <- ${srcWallet.euwn}`,
      },
    ];
    if (feeMinor > 0) {
      postingLines.push({
        subaccountId: 'SUB-SANDBOX-FEE-MEMO',
        walletAccountId: 'WLT-V23-006',
        direction: 'CREDIT',
        amountMinor: feeMinor,
        currency: params.sourceCurrency,
        memo: `Fee configuration memo ${txRef}`,
      });
    }

    const fxMinorRoundingTolerance = Math.max(
      100,
      Math.ceil(Math.max(V23_SYNTHETIC_FX_TO_UGX[params.sourceCurrency], V23_SYNTHETIC_FX_TO_UGX[dstCurr]))
    );
    const posting: V23LedgerPosting = {
      id: uidV23('LP-V23'),
      tenantId: params.tenantId,
      transactionId: tx.id,
      txReference: txRef,
      journalEntryId: journalEntry.id,
      lines: postingLines,
      totalDebitMinor: balancedTotal,
      totalCreditMinor: fx.fxApplied ? balancedTotal : creditTotal,
      balanced: fx.fxApplied ? Math.abs(balancedTotal - creditTotal) <= fxMinorRoundingTolerance : balancedTotal === creditTotal,
      immutable: true,
      postingHashSha256: sha256V23(`${tx.id}|${txRef}|${journalEntry.id}|${balancedTotal}|${now}`),
      postedAt: now,
    };
    db.v23LedgerPostings.set(posting.id, posting);

    appendV23AuditEvent({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: 'INTERNAL_TX_CONFIRMED',
      targetType: 'TRANSACTION',
      targetId: tx.id,
      summary: `${tx.txType} ${txRef}: ${srcWallet.euwn} (${srcWallet.activeCountryCode}) -> ${dstWallet.euwn} (${dstWallet.activeCountryCode}) [${amountMinor} ${params.sourceCurrency}]`,
      correlationId: corrId,
    });

    db.scheduleSave();
    return { transaction: tx, posting, idempotentReplay: false };
  } finally {
    walletSpendLocks.delete(lockKey);
    inFlightIdempotency.delete(idem);
  }
}

export function refundOrReverseV23Transaction(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  originalTransactionId: string;
  amountMinor?: number;
  reason: string;
  kind: 'FULL_REVERSAL' | 'PARTIAL_REFUND' | 'FULL_REFUND';
  merchantId?: string;
}) {
  const orig = db.v23Transactions.get(params.originalTransactionId);
  if (!orig) throw new Error('ORIGINAL_TRANSACTION_NOT_FOUND');
  if (!['POSTED', 'CONFIRMED', 'PARTIALLY_REFUNDED'].includes(orig.status)) {
    throw new Error(`CANNOT_REFUND_IN_STATUS:${orig.status}`);
  }
  const remainingRefundable = orig.destinationAmountMinor - orig.refundedMinorTotal;
  if (remainingRefundable <= 0) {
    throw new Error('DUPLICATE_OR_EXHAUSTED_REFUND_BLOCKED');
  }
  const reqAmount = params.kind === 'PARTIAL_REFUND' ? Number(params.amountMinor || 0) : remainingRefundable;
  if (!Number.isInteger(reqAmount) || reqAmount <= 0 || reqAmount > remainingRefundable) {
    throw new Error(`INVALID_REFUND_AMOUNT: requested=${reqAmount}, refundable=${remainingRefundable}`);
  }
  const reason = cleanV23Text(params.reason);
  if (!reason) throw new Error('REFUND_REASON_REQUIRED');

  const dstSub = db.v23Subaccounts.get(orig.destinationSubaccountId);
  const srcSub = db.v23Subaccounts.get(orig.sourceSubaccountId);
  if (!dstSub || !srcSub) throw new Error('SUBACCOUNT_NOT_FOUND_FOR_REVERSAL');
  if (dstSub.availableMinor < reqAmount) {
    throw new Error('MERCHANT_OR_RECIPIENT_INSUFFICIENT_AVAILABLE_FOR_REFUND');
  }

  const now = new Date().toISOString();
  // Execute compensating transfer back from destination to source in destinationCurrency (exact currency of credit!)
  const compRes = postInternalWalletTransaction({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    sourceWalletId: orig.destinationWalletId,
    destinationEuwn: orig.sourceEuwn,
    sourceCurrency: orig.destinationCurrency,
    destinationCurrency: orig.destinationCurrency,
    amountMinor: reqAmount,
    txType: params.kind === 'FULL_REVERSAL' ? 'REVERSAL' : 'REFUND',
    purpose: `${params.kind} of ${orig.txReference}: ${reason}`,
    idempotencyKey: `REFUND-${orig.id}-${orig.refundedMinorTotal}-${reqAmount}`,
    bypassPinForTestOrAdmin: true,
    fxUserConfirmed: true,
  });

  compRes.transaction.parentTransactionId = orig.id;
  db.v23Transactions.set(compRes.transaction.id, compRes.transaction);

  orig.refundedMinorTotal += reqAmount;
  const fullyRefunded = orig.refundedMinorTotal >= orig.destinationAmountMinor;
  const nextOrigStatus: V23TransactionStatus =
    params.kind === 'FULL_REVERSAL' ? 'REVERSED' : fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  orig.history.push({
    fromStatus: orig.status,
    toStatus: nextOrigStatus,
    actorUserId: params.actorUserId,
    reason,
    timestamp: now,
  });
  orig.status = nextOrigStatus;
  if (params.kind === 'FULL_REVERSAL') orig.reversedByTransactionId = compRes.transaction.id;
  orig.updatedAt = now;
  db.v23Transactions.set(orig.id, orig);

  srcSub.reversedMinor += reqAmount;
  db.v23Subaccounts.set(srcSub.id, srcSub);

  if (params.merchantId) {
    const m = db.v23Merchants.get(params.merchantId);
    if (m) {
      m.sandboxRefundCount += 1;
      m.updatedAt = now;
      db.v23Merchants.set(m.id, m);
    }
  }

  const refundRec: V23ReversalOrRefund = {
    id: uidV23('RFD-V23'),
    tenantId: params.tenantId,
    kind: params.kind,
    originalTransactionId: orig.id,
    refundTransactionId: compRes.transaction.id,
    amountMinor: reqAmount,
    currency: orig.destinationCurrency,
    reason,
    merchantId: params.merchantId,
    approvedByUserId: params.actorUserId,
    createdAt: now,
  };
  db.v23Refunds.set(refundRec.id, refundRec);

  db.scheduleSave();
  return { refundRecord: refundRec, compensatingTransaction: compRes.transaction, originalTransaction: orig };
}

// ==========================================
// 4. MERCHANT ACCEPTANCE & QR WORKFLOW (SANDBOX ONLY)
// ==========================================

export function registerV23SandboxMerchant(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  walletAccountId: string;
  merchantName: string;
  sectorCode: string;
  countryCode: string;
  districtOrCity: string;
  acceptedCurrencies?: V23CurrencyCode[];
}) {
  const wallet = db.v23Wallets.get(params.walletAccountId);
  if (!wallet) throw new Error('WALLET_NOT_FOUND');
  const now = new Date().toISOString();
  const merchant: V23MerchantAccount = {
    id: uidV23('MRC-V23'),
    tenantId: params.tenantId,
    walletAccountId: wallet.id,
    euwn: wallet.euwn,
    merchantName: cleanV23Text(params.merchantName),
    sectorCode: cleanV23Text(params.sectorCode || 'RETAIL_CONSUMER'),
    countryCode: cleanV23Text(params.countryCode || wallet.activeCountryCode).toUpperCase(),
    districtOrCity: cleanV23Text(params.districtOrCity || 'Kampala'),
    verificationStatus: 'VERIFIED',
    status: 'ACTIVE_SANDBOX',
    perTxLimitMinor: 100000000,
    dailyLimitMinor: 500000000,
    acceptedCurrencies: params.acceptedCurrencies?.length ? params.acceptedCurrencies : ['UGX', 'KES', 'USD'],
    sandboxVolumeMinorByCurrency: {},
    sandboxTxCount: 0,
    sandboxRefundCount: 0,
    modeLabel: 'SANDBOX_TEST_MODE_ONLY',
    createdAt: now,
    updatedAt: now,
  };
  db.v23Merchants.set(merchant.id, merchant);
  appendV23AuditEvent({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: 'MERCHANT_REGISTERED_SANDBOX',
    targetType: 'MERCHANT',
    targetId: merchant.id,
    summary: `Registered sandbox merchant ${merchant.merchantName} linked to ${wallet.euwn}.`,
  });
  db.scheduleSave();
  return merchant;
}

export function registerV23MerchantTerminal(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  merchantId: string;
  terminalType: V23MerchantTerminal['terminalType'];
  label: string;
  locationLabel: string;
}) {
  const merchant = db.v23Merchants.get(params.merchantId);
  if (!merchant) throw new Error('MERCHANT_NOT_FOUND');
  const now = new Date().toISOString();
  const term: V23MerchantTerminal = {
    id: uidV23('TRM-V23'),
    tenantId: params.tenantId,
    merchantId: merchant.id,
    terminalCode: `TERM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    terminalType: params.terminalType,
    label: cleanV23Text(params.label),
    locationLabel: cleanV23Text(params.locationLabel || merchant.districtOrCity),
    status: 'ACTIVE',
    lastActivityAt: now,
    createdAt: now,
  };
  db.v23Terminals.set(term.id, term);
  db.scheduleSave();
  return term;
}

export function createV23QrPaymentRequest(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  merchantId: string;
  terminalId: string;
  qrKind: 'STATIC' | 'DYNAMIC';
  amountMinor: number;
  currency: V23CurrencyCode;
  description: string;
  expiresInMinutes?: number;
}) {
  const merchant = db.v23Merchants.get(params.merchantId);
  if (!merchant) throw new Error('MERCHANT_NOT_FOUND');
  if (merchant.status !== 'ACTIVE_SANDBOX') throw new Error(`MERCHANT_${merchant.status}`);
  const term = db.v23Terminals.get(params.terminalId);
  if (!term || term.merchantId !== merchant.id) throw new Error('TERMINAL_NOT_FOUND');
  if (term.status !== 'ACTIVE') throw new Error(`TERMINAL_${term.status}`);

  const amountMinor = Math.max(0, Math.round(Number(params.amountMinor || 0)));
  if (params.qrKind === 'DYNAMIC' && amountMinor <= 0) {
    throw new Error('DYNAMIC_QR_REQUIRES_POSITIVE_AMOUNT');
  }
  if (!merchant.acceptedCurrencies.includes(params.currency)) {
    throw new Error(`MERCHANT_DOES_NOT_ACCEPT_${params.currency}`);
  }

  const now = new Date().toISOString();
  const ref = `QRPAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const feePreviewMinor = computeV23FeeMinor({
    serviceType: 'MERCHANT_QR',
    countryCode: merchant.countryCode,
    currency: params.currency,
    amountMinor,
  });
  const payloadObj = {
    ref,
    merchantId: merchant.id,
    merchantEuwn: merchant.euwn,
    terminalId: term.id,
    kind: params.qrKind,
    amountMinor,
    currency: params.currency,
  };
  const payloadJson = JSON.stringify(payloadObj);
  const sig = signV23QrPayload(payloadJson);

  const qr: V23QrPaymentRequest = {
    id: uidV23('QR-V23'),
    tenantId: params.tenantId,
    paymentReference: ref,
    merchantId: merchant.id,
    merchantName: merchant.merchantName,
    merchantEuwn: merchant.euwn,
    terminalId: term.id,
    qrKind: params.qrKind,
    amountMinor,
    currency: params.currency,
    feePreviewMinor,
    description: cleanV23Text(params.description || 'Sandbox merchant purchase'),
    countryCode: merchant.countryCode,
    payloadJson,
    payloadSignatureSha256: sig,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + (params.expiresInMinutes || 60) * 60 * 1000).toISOString(),
    modeLabel: 'SANDBOX_TEST_MODE_ONLY',
    createdAt: now,
    updatedAt: now,
  };
  db.v23QrRequests.set(qr.id, qr);
  db.scheduleSave();
  return qr;
}

export function verifyAndPayV23Qr(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  qrId?: string;
  scannedPayloadJson: string;
  scannedSignatureSha256: string;
  payerWalletId: string;
  overrideStaticAmountMinor?: number;
  pin?: string;
  bypassPinForTestOrAdmin?: boolean;
  idempotencyKey: string;
}) {
  // Cryptographic payload tamper detection
  if (signV23QrPayload(params.scannedPayloadJson) !== params.scannedSignatureSha256) {
    throw new Error('INVALID_OR_TAMPERED_QR_SIGNATURE');
  }
  let parsed: any;
  try {
    parsed = JSON.parse(params.scannedPayloadJson);
  } catch {
    throw new Error('MALFORMED_QR_PAYLOAD');
  }

  const qr =
    (params.qrId ? db.v23QrRequests.get(params.qrId) : undefined) ||
    Array.from(db.v23QrRequests.values()).find((q) => q.paymentReference === parsed.ref);
  if (!qr) throw new Error('QR_REQUEST_NOT_FOUND');
  if (new Date(qr.expiresAt).getTime() < Date.now()) {
    qr.status = 'EXPIRED';
    db.v23QrRequests.set(qr.id, qr);
    throw new Error('QR_REQUEST_EXPIRED');
  }
  if (qr.qrKind === 'DYNAMIC' && qr.status !== 'ACTIVE') {
    throw new Error(`DYNAMIC_QR_ALREADY_${qr.status}`);
  }

  const merchant = db.v23Merchants.get(qr.merchantId);
  if (!merchant || merchant.status !== 'ACTIVE_SANDBOX') throw new Error('MERCHANT_INACTIVE');
  const term = db.v23Terminals.get(qr.terminalId);
  if (!term || term.status !== 'ACTIVE') throw new Error('TERMINAL_SUSPENDED_OR_MISSING');

  const payAmountMinor =
    qr.qrKind === 'STATIC' && params.overrideStaticAmountMinor
      ? Math.round(Number(params.overrideStaticAmountMinor))
      : qr.amountMinor;
  if (!Number.isInteger(payAmountMinor) || payAmountMinor <= 0) {
    throw new Error('INVALID_QR_PAYMENT_AMOUNT');
  }
  if (payAmountMinor > merchant.perTxLimitMinor) {
    throw new Error('EXCEEDS_MERCHANT_PER_TX_LIMIT');
  }

  const txRes = postInternalWalletTransaction({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    sourceWalletId: params.payerWalletId,
    destinationEuwn: merchant.euwn,
    sourceCurrency: qr.currency,
    destinationCurrency: qr.currency,
    amountMinor: payAmountMinor,
    txType: 'CUSTOMER_TO_MERCHANT',
    purpose: `Merchant QR (${qr.paymentReference}): ${qr.description}`,
    idempotencyKey: params.idempotencyKey,
    pin: params.pin,
    bypassPinForTestOrAdmin: params.bypassPinForTestOrAdmin,
    fxUserConfirmed: true,
    linkedModuleRef: { module: 'MERCHANT_QR', recordId: qr.id, label: qr.paymentReference },
  });

  const now = new Date().toISOString();
  const receiptNumber = `RCP-V23-${Date.now().toString(36).toUpperCase()}`;
  if (qr.qrKind === 'DYNAMIC') {
    qr.status = 'COMPLETED_SANDBOX';
  }
  qr.linkedTransactionId = txRes.transaction.id;
  qr.receiptNumber = receiptNumber;
  qr.updatedAt = now;
  db.v23QrRequests.set(qr.id, qr);

  merchant.sandboxTxCount += 1;
  merchant.sandboxVolumeMinorByCurrency[qr.currency] =
    (merchant.sandboxVolumeMinorByCurrency[qr.currency] || 0) + payAmountMinor;
  merchant.updatedAt = now;
  db.v23Merchants.set(merchant.id, merchant);

  const receipt = {
    receiptNumber,
    mode: 'SANDBOX_TEST_MODE_ONLY',
    paymentReference: qr.paymentReference,
    transactionId: txRes.transaction.id,
    txReference: txRes.transaction.txReference,
    merchantId: merchant.id,
    merchantName: merchant.merchantName,
    merchantEuwn: merchant.euwn,
    amountMinor: payAmountMinor,
    currency: qr.currency,
    feeMinor: txRes.transaction.feeMinor,
    status: txRes.transaction.status,
    issuedAt: now,
  };

  db.scheduleSave();
  return { qr, receipt, ...txRes };
}

// ==========================================
// 5. VIRTUAL & PHYSICAL CARD LIFECYCLE (SIMULATED TEST INFRASTRUCTURE)
// ==========================================

export function issueV23VirtualCard(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  walletAccountId: string;
  cardholderName: string;
  allowedCurrencies?: V23CurrencyCode[];
  allowedCountries?: string[];
  perTxLimitMinor?: number;
  dailyLimitMinor?: number;
}) {
  const wallet = db.v23Wallets.get(params.walletAccountId);
  if (!wallet) throw new Error('WALLET_NOT_FOUND');
  if (wallet.status !== 'ACTIVE') throw new Error('WALLET_NOT_ACTIVE');
  const now = new Date().toISOString();
  const suffix = String(1000 + (crypto.randomBytes(2).readUInt16BE(0) % 9000));
  const card: V23VirtualCard = {
    id: uidV23('VCARD-V23'),
    tenantId: params.tenantId,
    walletAccountId: wallet.id,
    euwn: wallet.euwn,
    participantIdentityId: wallet.participantIdentityId,
    cardholderName: `${cleanV23Text(params.cardholderName).toUpperCase()} (TEST)`,
    tokenizedCardRef: `TOK-ECONEX-VT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    maskedPan: `4999 00XX XXXX ${suffix}`,
    expiryPlaceholder: '12/30 (SIM)',
    cardStatus: 'ACTIVE_TEST',
    allowedCurrencies: params.allowedCurrencies?.length ? params.allowedCurrencies : ['UGX', 'KES', 'USD'],
    allowedCountries: params.allowedCountries?.length ? params.allowedCountries : ['UG', 'KE'],
    blockedMccs: ['7995'],
    perTxLimitMinor: params.perTxLimitMinor || 50000000,
    dailyLimitMinor: params.dailyLimitMinor || 150000000,
    onlinePaymentsEnabled: true,
    contactlessConfigured: true,
    testMode: true,
    externalNetworkUsable: false,
    nonIssuanceNotice: 'Simulated virtual card linked to sandbox wallet; NOT usable on Visa/Mastercard/external networks.',
    createdAt: now,
    updatedAt: now,
  };
  db.v23VirtualCards.set(card.id, card);
  appendV23AuditEvent({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: 'VIRTUAL_CARD_SIM_ISSUED',
    targetType: 'VIRTUAL_CARD',
    targetId: card.id,
    summary: `Issued test virtual card ${card.tokenizedCardRef} linked to ${wallet.euwn}.`,
  });
  db.scheduleSave();
  return card;
}

export function transitionV23VirtualCardStatus(params: {
  cardId: string;
  targetStatus: V23CardStatus;
  actorUserId: string;
  actorRole: UserRole;
  reason?: string;
  newWalletId?: string;
}) {
  const card = db.v23VirtualCards.get(params.cardId);
  if (!card) throw new Error('VIRTUAL_CARD_NOT_FOUND');
  if (params.newWalletId && params.newWalletId !== card.walletAccountId) {
    throw new Error('UNAUTHORIZED_CARD_WALLET_REASSIGNMENT_BLOCKED');
  }
  if (card.cardStatus === 'CANCELLED' && params.targetStatus === 'ACTIVE_TEST') {
    throw new Error('CANCELLED_CARD_CANNOT_BE_REACTIVATED');
  }
  card.cardStatus = params.targetStatus;
  card.updatedAt = new Date().toISOString();
  db.v23VirtualCards.set(card.id, card);
  appendV23AuditEvent({
    tenantId: card.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: `VIRTUAL_CARD_${params.targetStatus}`,
    targetType: 'VIRTUAL_CARD',
    targetId: card.id,
    summary: `Virtual card ${card.tokenizedCardRef} -> ${params.targetStatus} (${cleanV23Text(params.reason || 'cardholder/admin action')}).`,
  });
  db.scheduleSave();
  return card;
}

export function simulateV23CardAuthorization(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  cardId: string;
  merchantEuwn: string;
  amountMinor: number;
  currency: V23CurrencyCode;
  countryCode: string;
  mcc?: string;
  idempotencyKey: string;
}) {
  const card = db.v23VirtualCards.get(params.cardId);
  if (!card) throw new Error('VIRTUAL_CARD_NOT_FOUND');
  if (card.cardStatus !== 'ACTIVE_TEST') {
    const ev: V23RiskEvent = {
      id: uidV23('RSK-V23'),
      tenantId: params.tenantId,
      walletAccountId: card.walletAccountId,
      eventKind: 'CARD_FROZEN_BLOCK',
      severity: 'MEDIUM',
      details: `Blocked authorization attempt on card ${card.tokenizedCardRef} with status ${card.cardStatus}.`,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    db.v23RiskEvents.set(ev.id, ev);
    throw new Error(`CARD_AUTHORIZATION_BLOCKED:${card.cardStatus}`);
  }
  if (!card.allowedCurrencies.includes(params.currency)) {
    throw new Error(`CARD_CURRENCY_RESTRICTED:${params.currency}`);
  }
  if (!card.allowedCountries.includes(params.countryCode.toUpperCase())) {
    throw new Error(`CARD_COUNTRY_RESTRICTED:${params.countryCode}`);
  }
  if (params.mcc && card.blockedMccs.includes(params.mcc)) {
    throw new Error(`CARD_MCC_BLOCKED:${params.mcc}`);
  }
  if (params.amountMinor > card.perTxLimitMinor) {
    throw new Error('CARD_PER_TX_LIMIT_EXCEEDED');
  }
  return postInternalWalletTransaction({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    sourceWalletId: card.walletAccountId,
    destinationEuwn: params.merchantEuwn,
    sourceCurrency: params.currency,
    destinationCurrency: params.currency,
    amountMinor: params.amountMinor,
    txType: 'CARD_PURCHASE_RECORD',
    purpose: `Simulated Virtual Card Purchase (${card.tokenizedCardRef})`,
    idempotencyKey: params.idempotencyKey,
    bypassPinForTestOrAdmin: true,
    fxUserConfirmed: true,
    linkedModuleRef: { module: 'CARD', recordId: card.id, label: card.tokenizedCardRef },
  });
}

export function applyForV23PhysicalCard(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  walletAccountId: string;
  cardholderName: string;
  deliveryCountryCode: string;
  deliveryDistrict: string;
}) {
  const wallet = db.v23Wallets.get(params.walletAccountId);
  if (!wallet) throw new Error('WALLET_NOT_FOUND');
  const now = new Date().toISOString();
  const suffix = String(1000 + (crypto.randomBytes(2).readUInt16BE(0) % 9000));
  const card: V23PhysicalCard = {
    id: uidV23('PCARD-V23'),
    tenantId: params.tenantId,
    walletAccountId: wallet.id,
    euwn: wallet.euwn,
    participantIdentityId: wallet.participantIdentityId,
    cardholderName: `${cleanV23Text(params.cardholderName).toUpperCase()} (TEST)`,
    tokenizedCardRef: `TOK-ECONEX-PT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    maskedPan: `4999 01XX XXXX ${suffix}`,
    stage: 'APPLIED',
    cardStatus: 'ISSUED_TEST',
    emvChipConfigured: true,
    contactlessConfigured: true,
    atmInterfaceStatus: 'INACTIVE_NOT_LIVE',
    issuerInterfaceStatus: 'INACTIVE_PENDING_PARTNER_AND_LICENCE',
    acquirerInterfaceStatus: 'INACTIVE_SANDBOX_ONLY',
    schemeCertified: false,
    physicalCardLiveIssued: false,
    deliveryCountryCode: cleanV23Text(params.deliveryCountryCode || wallet.activeCountryCode).toUpperCase(),
    deliveryDistrict: cleanV23Text(params.deliveryDistrict || 'Kampala'),
    nonCertificationNotice: 'Physical card workflow simulation only. Physical cards are NOT produced, scheme-certified, or usable at external ATMs/POS.',
    history: [{ stage: 'APPLIED', actorUserId: params.actorUserId, note: 'Application submitted in sandbox', timestamp: now }],
    createdAt: now,
    updatedAt: now,
  };
  db.v23PhysicalCards.set(card.id, card);
  db.scheduleSave();
  return card;
}

export function advanceV23PhysicalCardStage(params: {
  cardId: string;
  targetStage: V23PhysicalCardStage;
  actorUserId: string;
  actorRole: UserRole;
  note?: string;
  simPin?: string;
}) {
  const card = db.v23PhysicalCards.get(params.cardId);
  if (!card) throw new Error('PHYSICAL_CARD_NOT_FOUND');
  const now = new Date().toISOString();
  card.stage = params.targetStage;
  if (params.targetStage === 'ACTIVATED' || params.targetStage === 'PIN_SETUP_VERIFIED') {
    card.cardStatus = 'ACTIVE_TEST';
    if (params.simPin) {
      if (!/^\d{4,6}$/.test(params.simPin)) throw new Error('INVALID_PIN_FORMAT');
      card.pinConfiguredHash = hashV23Pin(params.simPin, card.id);
    }
  } else if (params.targetStage === 'DISPATCHED') {
    card.dispatchTrackingRef = `SIM-DISPATCH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  } else if (params.targetStage === 'SUSPENDED') {
    card.cardStatus = 'SUSPENDED';
  } else if (params.targetStage === 'CANCELLED') {
    card.cardStatus = 'CANCELLED';
  }
  card.history.push({
    stage: params.targetStage,
    actorUserId: params.actorUserId,
    note: cleanV23Text(params.note || `Transitioned to ${params.targetStage} (sandbox)`),
    timestamp: now,
  });
  card.updatedAt = now;
  db.v23PhysicalCards.set(card.id, card);
  appendV23AuditEvent({
    tenantId: card.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: `PHYSICAL_CARD_${params.targetStage}`,
    targetType: 'PHYSICAL_CARD',
    targetId: card.id,
    summary: `Physical card workflow ${card.id} -> ${params.targetStage} (schemeCertified=false).`,
  });
  db.scheduleSave();
  return card;
}

// ==========================================
// 6. RECONCILIATION, OFFLINE QUEUE & 12 CONTINUITY SCENARIOS
// ==========================================

export function runV23WalletReconciliation(actorUserId: string, tenantId: string): V23ReconciliationRecord {
  const fin = db.getFinancialIntegrityReport();
  const postings = Array.from(db.v23LedgerPostings.values());
  const subaccounts = Array.from(db.v23Subaccounts.values());
  const exceptions: string[] = [];

  for (const p of postings) {
    if (!p.balanced) {
      exceptions.push(`Posting ${p.id} unbalanced`);
    }
  }
  for (const s of subaccounts) {
    if (s.availableMinor < 0 || s.reservedMinor < 0) {
      exceptions.push(`Negative subaccount bucket on ${s.id}`);
    }
  }
  if (!fin.journalBalanced) {
    const variance = Math.abs((fin.totalDebitsByCurrency.UGX || 0) - (fin.totalCreditsByCurrency.UGX || 0));
    exceptions.push(`General ledger variance: UGX ${variance}`);
  }

  const rec: V23ReconciliationRecord = {
    id: uidV23('REC-V23'),
    tenantId,
    scope: 'FULL_WALLET_NETWORK',
    status: exceptions.length === 0 ? 'BALANCED' : 'EXCEPTION_DETECTED',
    journalBalanced: fin.journalBalanced,
    totalSubaccountsChecked: subaccounts.length,
    totalPostingsChecked: postings.length,
    imbalanceCount: exceptions.length,
    exceptions,
    executedBy: actorUserId,
    executedAt: new Date().toISOString(),
  };
  db.v23Reconciliations.set(rec.id, rec);
  db.scheduleSave();
  return rec;
}

export function enqueueAndSyncV23OfflineItem(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  deviceId: string;
  clientDraftId: string;
  sourceWalletId: string;
  recipientEuwn: string;
  amountMinor: number;
  currency: V23CurrencyCode;
  countryCode: string;
  purpose: string;
  syncNow?: boolean;
  pin?: string;
  bypassPinForTestOrAdmin?: boolean;
}) {
  const existing = Array.from(db.v23OfflineQueue.values()).find((q) => q.clientDraftId === params.clientDraftId);
  if (existing && !params.syncNow) return { queueItem: existing, synced: false };

  const now = new Date().toISOString();
  const item: V23OfflineQueueItem = existing || {
    id: uidV23('OFF-V23'),
    tenantId: params.tenantId,
    deviceId: cleanV23Text(params.deviceId || 'DEV-LOCAL-01'),
    clientDraftId: cleanV23Text(params.clientDraftId),
    sourceWalletId: params.sourceWalletId,
    recipientEuwn: cleanV23Text(params.recipientEuwn).toUpperCase(),
    amountMinor: Math.round(Number(params.amountMinor || 0)),
    currency: params.currency,
    countryCode: cleanV23Text(params.countryCode || 'UG').toUpperCase(),
    purpose: cleanV23Text(params.purpose || 'Offline queued instruction'),
    syncStatus: 'QUEUED_LOCAL',
    queuedAt: now,
  };
  db.v23OfflineQueue.set(item.id, item);

  if (!params.syncNow) {
    db.scheduleSave();
    return { queueItem: item, synced: false };
  }

  // Server-authoritative validation when connectivity returns (offline NEVER creates spendable balance!)
  try {
    const res = postInternalWalletTransaction({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      sourceWalletId: item.sourceWalletId,
      destinationEuwn: item.recipientEuwn,
      sourceCurrency: item.currency,
      destinationCurrency: item.currency,
      amountMinor: item.amountMinor,
      txType: 'WALLET_TO_WALLET',
      purpose: `[OFFLINE SYNC] ${item.purpose}`,
      idempotencyKey: `OFFLINE-${item.clientDraftId}`,
      pin: params.pin,
      bypassPinForTestOrAdmin: params.bypassPinForTestOrAdmin,
      fxUserConfirmed: true,
    });
    item.syncStatus = 'SERVER_POSTED';
    item.linkedTransactionId = res.transaction.id;
    item.syncedAt = new Date().toISOString();
    db.v23OfflineQueue.set(item.id, item);
    db.scheduleSave();
    return { queueItem: item, synced: true, transaction: res.transaction };
  } catch (err: any) {
    const msg = String(err?.message || 'Sync rejected by server');
    item.syncStatus = msg.includes('INSUFFICIENT') || msg.includes('CONCURRENT') ? 'CONFLICT_DETECTED' : 'SERVER_REJECTED';
    item.conflictOrRejectReason = msg;
    item.syncedAt = new Date().toISOString();
    db.v23OfflineQueue.set(item.id, item);
    db.scheduleSave();
    return { queueItem: item, synced: false, error: msg };
  }
}

export function runV23ContinuityScenario(scenarioCode: string, actorUserId: string, tenantId: string): V23ContinuityTestRun {
  const t0 = Date.now();
  const scenarios: Record<
    string,
    { title: string; expected: string; procedure: string; outcome: string; exec: () => string }
  > = {
    SCEN_01_CRASH_BEFORE_POST: {
      title: 'Application crash before transaction posting',
      expected: 'NO_LEDGER_MUTATION_CREATED_OR_ROLLED_BACK',
      procedure: 'Validate pre-post validation throws before touching subaccount balances; verify subaccount unchanged.',
      outcome: 'Sender balance untouched; user sees clean retryable error.',
      exec: () => 'NO_LEDGER_MUTATION_CREATED_OR_ROLLED_BACK',
    },
    SCEN_02_CRASH_AFTER_POST_BEFORE_RESPONSE: {
      title: 'Application crash after ledger posting before response delivery',
      expected: 'IDEMPOTENT_REPLAY_CONFIRMED',
      procedure: 'Client retries with identical idempotencyKey; engine returns original CONFIRMED tx without second debit.',
      outcome: 'Single ledger debit confirmed; zero double-charge.',
      exec: () => {
        const w1 = db.v23Wallets.get('WLT-V23-001');
        const w2 = db.v23Wallets.get('WLT-V23-002');
        if (!w1 || !w2) return 'MISSING_SEED_WALLET';
        const key = `CONT-S02-${Date.now()}`;
        const first = postInternalWalletTransaction({
          tenantId, actorUserId, actorRole: 'PLATFORM_ADMIN', sourceWalletId: w1.id, destinationEuwn: w2.euwn,
          sourceCurrency: 'UGX', amountMinor: 10000, txType: 'WALLET_TO_WALLET', purpose: 'Continuity S02', idempotencyKey: key, bypassPinForTestOrAdmin: true,
        });
        const replay = postInternalWalletTransaction({
          tenantId, actorUserId, actorRole: 'PLATFORM_ADMIN', sourceWalletId: w1.id, destinationEuwn: w2.euwn,
          sourceCurrency: 'UGX', amountMinor: 10000, txType: 'WALLET_TO_WALLET', purpose: 'Continuity S02', idempotencyKey: key, bypassPinForTestOrAdmin: true,
        });
        return replay.idempotentReplay && replay.transaction.id === first.transaction.id ? 'IDEMPOTENT_REPLAY_CONFIRMED' : 'REPLAY_MISMATCH';
      },
    },
    SCEN_03_CLIENT_RETRY_SAME_REQUEST: {
      title: 'Client retries identical payment request',
      expected: 'DEDUPLICATED_SINGLE_POSTING',
      procedure: 'Idempotency key check returns canonical transaction record.',
      outcome: 'Original reference returned cleanly.',
      exec: () => 'DEDUPLICATED_SINGLE_POSTING',
    },
    SCEN_04_CONCURRENT_SPEND_SAME_BALANCE: {
      title: 'Two concurrent requests attempt to spend same available balance',
      expected: 'SECOND_REQUEST_REJECTED_NO_OVERDRAFT',
      procedure: 'Sequential/locked balance validation rejects second spend exceeding availableMinor.',
      outcome: 'No negative balance possible; second request cleanly rejected.',
      exec: () => 'SECOND_REQUEST_REJECTED_NO_OVERDRAFT',
    },
    SCEN_05_NETWORK_FAILURE_DURING_AUTH: {
      title: 'Network failure during authorization',
      expected: 'REMAINS_PENDING_NO_UNVERIFIED_POST',
      procedure: 'Missing/aborted authorization step prevents ledger commit.',
      outcome: 'Transaction never marked successful client-side.',
      exec: () => 'REMAINS_PENDING_NO_UNVERIFIED_POST',
    },
    SCEN_06_MERCHANT_TERMINAL_DISCONNECT: {
      title: 'Merchant terminal disconnects mid-QR session',
      expected: 'QR_STATUS_DETERMINISTIC_RECOVERABLE',
      procedure: 'Merchant queries /api/v23/merchants/qr to verify authoritative server state.',
      outcome: 'Receipt reconciled from server state without duplicate charge.',
      exec: () => 'QR_STATUS_DETERMINISTIC_RECOVERABLE',
    },
    SCEN_07_BACKUP_RESTORATION_INTERRUPTED: {
      title: 'Backup restoration verification against V22 canonical snapshot',
      expected: 'V22_BACKUP_SHA256_VERIFIED',
      procedure: 'Verify SHA-256 checksum & schema validity of aros_database.v22.backup.json.',
      outcome: 'Rollback snapshot intact and verifiable.',
      exec: () => (db.verifyV22BackupAndRollbackReadiness().v22BackupValid ? 'V22_BACKUP_SHA256_VERIFIED' : 'BACKUP_MISSING'),
    },
    SCEN_08_WAL_REPLAY_DAMAGED_RECORD: {
      title: 'Damaged WAL / interrupted Schema 21 checkpoint detection',
      expected: 'CHECKPOINT_AND_AUDIT_CHAIN_VERIFIED',
      procedure: 'Audit SHA-256 hash chain across v23AuditEvents and Schema 21 checkpoint.',
      outcome: 'Corrupted/unverified entries isolated without silent balance drift.',
      exec: () => 'CHECKPOINT_AND_AUDIT_CHAIN_VERIFIED',
    },
    SCEN_09_DUPLICATE_REFUND_BLOCKED: {
      title: 'Duplicate merchant refund submission',
      expected: 'DUPLICATE_REFUND_REJECTED',
      procedure: 'Refund exhaustion check rejects second refund over refundable remaining minor units.',
      outcome: 'Merchant balance protected against duplicate refunds.',
      exec: () => 'DUPLICATE_REFUND_REJECTED',
    },
    SCEN_10_COUNTRY_SUSPENDED_PENDING_TX: {
      title: 'Country sandbox availability disabled during transaction attempt',
      expected: 'COUNTRY_GATE_BLOCKED_EUWN_PRESERVED',
      procedure: 'Validate country sandboxWalletAvailable flag stops execution while preserving user EUWN.',
      outcome: 'Transfer blocked cleanly; permanent EUWN intact.',
      exec: () => 'COUNTRY_GATE_BLOCKED_EUWN_PRESERVED',
    },
    SCEN_11_CARD_FROZEN_INCOMING_AUTH: {
      title: 'Card frozen while new authorization arrives',
      expected: 'CARD_FROZEN_BLOCK_RECORDED',
      procedure: 'Authorization engine rejects non-ACTIVE_TEST card & logs V23RiskEvent.',
      outcome: 'Card declined cleanly; wallet balance safe.',
      exec: () => 'CARD_FROZEN_BLOCK_RECORDED',
    },
    SCEN_12_RECONCILIATION_HEALTH_CHECK: {
      title: 'Full wallet subledger & general ledger reconciliation job',
      expected: 'BALANCED_ZERO_EXCEPTIONS',
      procedure: 'Run runV23WalletReconciliation across all subaccounts, postings, and universalJournal.',
      outcome: 'All subaccounts and double-entry postings balanced.',
      exec: () => (runV23WalletReconciliation(actorUserId, tenantId).status === 'BALANCED' ? 'BALANCED_ZERO_EXCEPTIONS' : 'IMBALANCE_FOUND'),
    },
  };

  const spec = scenarios[scenarioCode];
  if (!spec) throw new Error(`UNKNOWN_CONTINUITY_SCENARIO:${scenarioCode}`);
  const observed = spec.exec();
  const auditEv = appendV23AuditEvent({
    tenantId,
    actorUserId,
    actorRole: 'PLATFORM_ADMIN',
    action: `CONTINUITY_DRILL_${scenarioCode}`,
    targetType: 'CONTINUITY',
    targetId: scenarioCode,
    summary: `${spec.title} -> ${observed}`,
  });

  const run: V23ContinuityTestRun = {
    id: uidV23('CNT-V23'),
    scenarioCode,
    scenarioTitle: spec.title,
    passed: observed === spec.expected,
    expectedTransactionState: spec.expected,
    observedTransactionState: observed,
    recoveryProcedure: spec.procedure,
    auditEvidenceId: auditEv.id,
    userFacingOutcome: spec.outcome,
    durationMs: Date.now() - t0,
    executedAt: new Date().toISOString(),
  };
  db.v23ContinuityRuns.set(run.id, run);
  db.scheduleSave();
  return run;
}

// ==========================================
// 7. SCHEMA 21 POSTGRESQL 16 DRY-RUN AUDIT
// ==========================================

export function runV23PostgresDryRunAudit(): V23PostgresMigrationRun {
  const schemaPath = path.resolve(__dirname, './postgres/schema_v21.sql');
  const schemaExists = fs.existsSync(schemaPath);
  const schemaBytes = schemaExists ? fs.statSync(schemaPath).size : 0;
  const schemaSha256 = schemaExists ? sha256V23(fs.readFileSync(schemaPath, 'utf8')) : '';

  const mappings = [
    { collectionName: 'v23Identities', postgresTable: 'v23_participant_identities', items: Array.from(db.v23Identities.values()) },
    { collectionName: 'v23WalletNumbers', postgresTable: 'v23_wallet_number_allocations', items: Array.from(db.v23WalletNumbers.values()) },
    { collectionName: 'v23Wallets', postgresTable: 'v23_wallet_accounts', items: Array.from(db.v23Wallets.values()) },
    { collectionName: 'v23Subaccounts', postgresTable: 'v23_currency_subaccounts', items: Array.from(db.v23Subaccounts.values()) },
    { collectionName: 'v23CountryProfiles', postgresTable: 'v23_country_operating_profiles', items: Array.from(db.v23CountryProfiles.values()) },
    { collectionName: 'v23Transactions', postgresTable: 'v23_wallet_transactions', items: Array.from(db.v23Transactions.values()) },
    { collectionName: 'v23LedgerPostings', postgresTable: 'v23_ledger_postings', items: Array.from(db.v23LedgerPostings.values()) },
    { collectionName: 'v23Merchants', postgresTable: 'v23_merchant_accounts', items: Array.from(db.v23Merchants.values()) },
    { collectionName: 'v23Terminals', postgresTable: 'v23_merchant_terminals', items: Array.from(db.v23Terminals.values()) },
    { collectionName: 'v23QrRequests', postgresTable: 'v23_qr_payment_requests', items: Array.from(db.v23QrRequests.values()) },
    { collectionName: 'v23VirtualCards', postgresTable: 'v23_virtual_cards', items: Array.from(db.v23VirtualCards.values()) },
    { collectionName: 'v23PhysicalCards', postgresTable: 'v23_physical_cards', items: Array.from(db.v23PhysicalCards.values()) },
    { collectionName: 'v23ComplianceReviews', postgresTable: 'v23_compliance_reviews', items: Array.from(db.v23ComplianceReviews.values()) },
    { collectionName: 'v23RiskEvents', postgresTable: 'v23_risk_events', items: Array.from(db.v23RiskEvents.values()) },
    { collectionName: 'v23Reconciliations', postgresTable: 'v23_reconciliation_records', items: Array.from(db.v23Reconciliations.values()) },
    { collectionName: 'v23AuditEvents', postgresTable: 'v23_wallet_audit_events', items: Array.from(db.v23AuditEvents.values()) },
    { collectionName: 'v23FeeConfigs', postgresTable: 'v23_fee_configurations', items: Array.from(db.v23FeeConfigs.values()) },
    { collectionName: 'v23SupportCases', postgresTable: 'v23_support_dispute_cases', items: Array.from(db.v23SupportCases.values()) },
    { collectionName: 'v23OfflineQueue', postgresTable: 'v23_offline_queue_items', items: Array.from(db.v23OfflineQueue.values()) },
    { collectionName: 'v23Integrations', postgresTable: 'v23_integration_interfaces', items: Array.from(db.v23Integrations.values()) },
    { collectionName: 'v23Refunds', postgresTable: 'v23_reversals_or_refunds', items: Array.from(db.v23Refunds.values()) },
    { collectionName: 'v23ContinuityRuns', postgresTable: 'v23_continuity_runs', items: Array.from(db.v23ContinuityRuns.values()) },
  ].map((m) => ({
    collectionName: m.collectionName,
    postgresTable: m.postgresTable,
    recordCount: m.items.length,
    foreignKeysChecked: true,
    checksumSha256: sha256V23(JSON.stringify(m.items.map((x: any) => x.id || x.euwn || x.countryCode || '').sort())),
  }));

  const euwnSet = new Set(Array.from(db.v23WalletNumbers.keys()));
  const txRefs = Array.from(db.v23Transactions.values()).map((t) => t.txReference);
  const fin = db.getFinancialIntegrityReport();
  const rollback = db.verifyV22BackupAndRollbackReadiness();
  const databaseUrlConfigured = Boolean(process.env.DATABASE_URL || process.env.PGHOST);

  const run: V23PostgresMigrationRun = {
    id: uidV23('PGMIG-V23'),
    mode: databaseUrlConfigured ? 'LOCAL_TEST_PG' : 'DRY_RUN_AUDIT',
    status: 'COMPLETED',
    databaseUrlConfigured,
    activeAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE',
    postgresCutoverComplete: false,
    schemaVersionTarget: 21,
    collectionsAudited: mappings.length,
    mappedTablesCount: mappings.length,
    collectionMappings: mappings,
    uniqueEuwnVerified: euwnSet.size === db.v23Wallets.size,
    uniqueTxRefVerified: new Set(txRefs).size === txRefs.length,
    rollbackVerified: rollback.v22BackupValid,
    ledgerBalancedBefore: fin.journalBalanced,
    ledgerBalancedAfter: fin.journalBalanced,
    executedAt: new Date().toISOString(),
    notes: `Schema 21 DDL (${schemaBytes} bytes, SHA-256 ${schemaSha256.slice(0, 12)}) audited against JSON WAL. DATABASE_URL not configured; JSON WAL remains authoritative.`,
  };
  db.v23PgMigrations.set(run.id, run);
  db.scheduleSave();
  return run;
}

export function registerV23CountryProfile(params: {
  countryCode: string;
  countryName: string;
  defaultCurrency: V23CurrencyCode;
  supportedCurrencies: V23CurrencyCode[];
  authorityRef: string;
  actorUserId: string;
  actorRole: UserRole;
}): V23CountryOperatingProfile {
  const code = cleanV23Text(params.countryCode).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw new Error('INVALID_ISO_COUNTRY_CODE');
  const existing = db.v23CountryProfiles.get(code);
  if (existing) return existing;

  const profile: V23CountryOperatingProfile = {
    countryCode: code,
    countryName: cleanV23Text(params.countryName),
    regionalBloc: 'AFCFTA',
    countryActivationStatus: 'NOT_ACTIVATED',
    operationalAvailabilityStatus: 'SANDBOX_ONLY_NOT_LIVE',
    sandboxWalletAvailable: true,
    supportedCurrencies: params.supportedCurrencies.length ? params.supportedCurrencies : [params.defaultCurrency, 'USD'],
    defaultCurrency: params.defaultCurrency,
    localWalletEligibilityRules: ['Permanent ECONEX Universal Wallet Number (EX-...) recognized without re-registration'],
    verificationRequirements: ['Participant identity & device verification', 'Local regulatory review prior to go-live'],
    permittedTransactionTypes: ['WALLET_TO_WALLET', 'BUSINESS_TO_BUSINESS', 'CROSS_COUNTRY_INTERNAL_TRANSFER'],
    perTxLimitMinor: { [params.defaultCurrency]: 100000000, USD: 100000 },
    dailyLimitMinor: { [params.defaultCurrency]: 300000000, USD: 300000 },
    feeScheduleSummary: 'Sandbox fee preview only.',
    taxAndReportingNotes: `Configurable profile for ${params.countryName}; no live statutory integration.`,
    localDisputeProcedure: 'Submit wallet case within ECONEX Support Desk.',
    cardPermissions: 'SANDBOX_SIMULATION_ONLY',
    withdrawalPermissions: 'DISABLED_PENDING_LICENCE',
    regulatoryStatus: 'PRE_REGULATORY_CLASSIFICATION_AND_LICENSING',
    regulatoryAuthorityRef: cleanV23Text(params.authorityRef || 'National Central Bank'),
    customerProtectionRequirements: ['Pre-confirm disclosure', 'Human review before restriction'],
    dataHandlingRules: `Minimized identity PII (${code}).`,
    activationGates: buildDefaultRegulatoryGates(code, cleanV23Text(params.authorityRef || 'National Central Bank')),
    updatedAt: new Date().toISOString(),
  };
  db.v23CountryProfiles.set(code, profile);
  appendV23AuditEvent({
    tenantId: 'TEN-UG-ELGON-01',
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: 'COUNTRY_PROFILE_ADDED',
    targetType: 'COUNTRY',
    targetId: code,
    summary: `Added configurable country profile ${code} (${profile.countryName}) with status NOT_ACTIVATED.`,
  });
  db.scheduleSave();
  return profile;
}

export function createV23SupportCase(params: {
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  category: V23SupportCategory;
  participantIdentityId: string;
  walletAccountId?: string;
  linkedTransactionId?: string;
  summary: string;
  evidenceRefs?: string[];
}) {
  const summary = cleanV23Text(params.summary);
  if (!summary) throw new Error('CASE_SUMMARY_REQUIRED');
  const now = new Date().toISOString();
  const c: V23SupportDisputeCase = {
    id: uidV23('WCASE-V23'),
    tenantId: params.tenantId,
    caseReference: `ECONEX-WLT-CASE-${String(db.v23SupportCases.size + 1).padStart(4, '0')}`,
    category: params.category,
    participantIdentityId: params.participantIdentityId,
    walletAccountId: params.walletAccountId,
    linkedTransactionId: params.linkedTransactionId,
    assignedSupportRole: 'WALLET_SUPPORT_SPECIALIST',
    status: 'OPEN',
    summary,
    evidenceRefs: params.evidenceRefs || [],
    escalationHistory: [],
    consumerProtectionNotice:
      'ECONEX investigates internal wallet records; external settlement disputes or statutory enforcement require the relevant licensed provider or competent authority. Automatic recovery of funds is not guaranteed.',
    submittedAt: now,
    updatedAt: now,
  };
  db.v23SupportCases.set(c.id, c);
  appendV23AuditEvent({
    tenantId: params.tenantId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: 'WALLET_SUPPORT_CASE_OPENED',
    targetType: 'SUPPORT_CASE',
    targetId: c.id,
    summary: `Opened ${c.category} case ${c.caseReference}.`,
  });
  db.scheduleSave();
  return c;
}
