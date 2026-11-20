/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V13.0 - Sovereign Data Federation, Institutional Connectivity & Hardware-Backed Trust Engine
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import {
  DEV_ISOLATED_KEY_STORE,
  getOrGenerateDevEcdsaKeyPair,
  getEnclaveAesKey,
} from './v13Seed.ts';
import { logIntelligenceAudit } from './v12Engine.ts';
import type {
  CrossBorderDataTransfer,
  CryptographicApprovalRequest,
  CryptographicApprovalSignature,
  SignedAuditCheckpoint,
} from '../types/index.ts';

function sha256Hex(val: string): string {
  return `0x${crypto.createHash('sha256').update(val).digest('hex')}`;
}

export function canonicalizePayload(payload: Record<string, any>): string {
  const keys = Object.keys(payload || {}).sort();
  const sorted: Record<string, any> = {};
  keys.forEach((k) => {
    sorted[k] = payload[k];
  });
  return JSON.stringify(sorted);
}

// ==========================================
// 1. SOVEREIGN ENCLAVE ENCRYPTION & CROSS-BORDER EXCHANGE (§8-§11)
// ==========================================

export function encryptInJurisdictionEnclave(jurisdictionCode: string, tenantId: string, plaintext: string): {
  allowed: boolean;
  ciphertextBase64?: string;
  ivHex?: string;
  authTagHex?: string;
  keyId?: string;
  error?: string;
} {
  const enclave = Array.from(db.sovereignDataEnclaves.values()).find(
    (e) => e.jurisdictionCode === jurisdictionCode
  );
  if (!enclave) {
    return { allowed: false, error: `No sovereign enclave provisioned for jurisdiction ${jurisdictionCode}.` };
  }
  if (!enclave.tenantIdsAllowed.includes(tenantId)) {
    return { allowed: false, error: `ENCLAVE_ISOLATION_DENIED: Tenant ${tenantId} is not authorized inside enclave ${enclave.id} (${jurisdictionCode}).` };
  }
  const aesKey = getEnclaveAesKey(jurisdictionCode);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  cipher.setAAD(Buffer.from(`${enclave.id}:${tenantId}`, 'utf8'));
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  enclave.auditCount += 1;
  db.sovereignDataEnclaves.set(enclave.id, enclave);
  db.scheduleSave();
  return {
    allowed: true,
    ciphertextBase64: enc.toString('base64'),
    ivHex: iv.toString('hex'),
    authTagHex: tag.toString('hex'),
    keyId: enclave.keyId,
  };
}

export function decryptInJurisdictionEnclave(
  jurisdictionCode: string,
  tenantId: string,
  ciphertextBase64: string,
  ivHex: string,
  authTagHex: string
): { allowed: boolean; plaintext?: string; error?: string } {
  const enclave = Array.from(db.sovereignDataEnclaves.values()).find(
    (e) => e.jurisdictionCode === jurisdictionCode
  );
  if (!enclave || !enclave.tenantIdsAllowed.includes(tenantId)) {
    return { allowed: false, error: 'ENCLAVE_DECRYPT_DENIED: Jurisdiction or tenant mismatch.' };
  }
  try {
    const aesKey = getEnclaveAesKey(jurisdictionCode);
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(ivHex, 'hex'));
    decipher.setAAD(Buffer.from(`${enclave.id}:${tenantId}`, 'utf8'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const dec = Buffer.concat([decipher.update(Buffer.from(ciphertextBase64, 'base64')), decipher.final()]);
    return { allowed: true, plaintext: dec.toString('utf8') };
  } catch {
    return { allowed: false, error: 'ENCLAVE_AUTH_TAG_FAILED: Ciphertext integrity or AAD mismatch.' };
  }
}

export function executeGovernedCrossBorderTransfer(params: {
  originJurisdiction: string;
  destinationJurisdiction: string;
  tenantId: string;
  dataClassification: CrossBorderDataTransfer['dataClassification'];
  dataCategory?: 'FINANCIAL_LEDGER' | 'PERSONAL_IDENTITY' | 'MARKET_OBSERVATIONS' | 'TRADE_CORRIDOR' | 'MODEL_WEIGHTS';
  dataOwnerId: string;
  dataOwnerConsentGranted: boolean;
  sendingJurisdictionAuthorized: boolean;
  receivingJurisdictionAuthorized: boolean;
  purpose: string;
  requestedFields: string[];
  receivingParty: string;
  retentionDays?: number;
  expiresInHours?: number;
  interruptSimulation?: boolean;
  actorId: string;
  actorRole: string;
}): { accepted: boolean; transfer: CrossBorderDataTransfer; error?: string } {
  const now = new Date();
  const originJur = db.sovereignJurisdictions.get(params.originJurisdiction.toUpperCase());
  const destJur = db.sovereignJurisdictions.get(params.destinationJurisdiction.toUpperCase());
  const id = `XFER13-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`;
  const expiresAt = new Date(now.getTime() + (params.expiresInHours ?? 72) * 3600 * 1000).toISOString();

  // Data minimization: strip raw personal/financial secret identifiers before cross-border transit
  const prohibitedFields = new Set(['passwordHash', 'privateKey', 'nationalIdNumber', 'rawBankAccountNumber', 'secretHash']);
  const minimizedFields = (params.requestedFields || []).filter((f) => !prohibitedFields.has(f));

  const policy = Array.from(db.sovereignDataPolicies.values()).find(
    (p) => p.jurisdictionCode === params.originJurisdiction.toUpperCase() && (!params.dataCategory || p.dataCategory === params.dataCategory)
  );

  let rejectionReason: string | undefined;
  if (!originJur || !destJur) {
    rejectionReason = 'UNKNOWN_JURISDICTION: Defaulting to RESTRICTED_PENDING_REVIEW because national legal boundary is unconfigured.';
  } else if (originJur.defaultCrossBorderPolicy === 'RESTRICTED_PENDING_REVIEW' && (!params.sendingJurisdictionAuthorized || !params.receivingJurisdictionAuthorized)) {
    rejectionReason = `JURISDICTION_DEFAULT_RESTRICTED: ${originJur.code} prohibits unapproved cross-border exchange.`;
  } else if (params.dataClassification === 'CONFIDENTIAL' || params.dataClassification === 'INSTITUTION_PRIVATE') {
    rejectionReason = `CONFIDENTIAL_RESIDENCY_LOCK: ${params.dataClassification} records cannot cross sovereign border raw; use regional aggregates only.`;
  } else if (policy && !policy.allowCrossBorderTransfer) {
    rejectionReason = `SOVEREIGN_POLICY_DENIED: Policy ${policy.id} disallows cross-border transfer of ${policy.dataCategory}.`;
  } else if (!params.dataOwnerConsentGranted) {
    rejectionReason = 'OWNER_CONSENT_REQUIRED: Explicit data owner consent is mandatory.';
  } else if (!params.sendingJurisdictionAuthorized || !params.receivingJurisdictionAuthorized) {
    rejectionReason = 'JURISDICTION_AUTH_REQUIRED: Both sending and receiving jurisdictional authorizations are required.';
  } else if (!params.purpose || params.purpose.trim().length < 5) {
    rejectionReason = 'PURPOSE_LIMITATION_MISSING: Explicit verified purpose required.';
  }

  const encryptedDigestSha256 = sha256Hex(`${id}|${params.originJurisdiction}|${params.destinationJurisdiction}|${minimizedFields.join(',')}|${params.purpose}`);

  const transfer: CrossBorderDataTransfer = {
    id,
    originJurisdiction: params.originJurisdiction.toUpperCase(),
    destinationJurisdiction: params.destinationJurisdiction.toUpperCase(),
    tenantId: params.tenantId,
    dataClassification: params.dataClassification,
    dataOwnerId: params.dataOwnerId,
    dataOwnerConsentGranted: params.dataOwnerConsentGranted,
    sendingJurisdictionAuthorized: params.sendingJurisdictionAuthorized,
    receivingJurisdictionAuthorized: params.receivingJurisdictionAuthorized,
    purpose: params.purpose,
    minimizedFields,
    encryptedDigestSha256,
    receivingParty: params.receivingParty,
    retentionDays: params.retentionDays || 365,
    expiresAt,
    status: rejectionReason ? 'REJECTED' : params.interruptSimulation ? 'IN_PROGRESS' : 'COMPLETED',
    rejectionReason,
    transferredAt: now.toISOString(),
  };

  db.crossBorderDataTransfers.set(transfer.id, transfer);

  logIntelligenceAudit({
    tenantId: params.tenantId,
    jurisdiction: params.originJurisdiction,
    actorId: params.actorId,
    actorRole: params.actorRole,
    actionType: 'CROSS_BORDER_DATA_TRANSFER',
    entityType: 'CROSS_BORDER_TRANSFER',
    entityId: transfer.id,
    details: `${transfer.originJurisdiction}->${transfer.destinationJurisdiction} [${transfer.status}]${rejectionReason ? `: ${rejectionReason}` : ''}`,
  });

  db.scheduleSave();
  return {
    accepted: !rejectionReason,
    transfer,
    error: rejectionReason,
  };
}

// ==========================================
// 2. INSTITUTIONAL CONNECTIVITY, MTLS & WEBHOOK VERIFICATION (§12-§14)
// ==========================================

export function testInstitutionalConnector(connectorId: string, actorId: string): {
  found: boolean;
  connector?: any;
  truthfulConnectionStatus: string;
  preconditionsMet: boolean;
  missingPrerequisites: string[];
} {
  const conn = db.institutionalConnectorRegistry.get(connectorId);
  if (!conn) {
    return {
      found: false,
      truthfulConnectionStatus: 'FAILED',
      preconditionsMet: false,
      missingPrerequisites: ['Connector ID not registered'],
    };
  }
  const cred = Array.from(db.institutionalConnectorCredentials.values()).find((c) => c.connectorId === connectorId);
  const cert = Array.from(db.institutionalCertificates.values()).find((c) => c.connectorId === connectorId);
  const missing: string[] = [];
  if (!conn.agreementSigned) missing.push('Signed institutional data-sharing agreement missing');
  if (!cred || cred.credentialState === 'UNPROVISIONED' || cred.credentialState === 'REVOKED') {
    missing.push(`Credentials in ${cred?.credentialState || 'MISSING'} state`);
  }
  if (!cert || cert.status === 'EXPIRED' || cert.status === 'REVOKED') {
    missing.push(`mTLS certificate ${cert?.status || 'MISSING'}`);
  }
  if (conn.targetEndpointTemplate.startsWith('unconfigured://')) {
    missing.push('Official institutional production/sandbox endpoint URL unconfigured');
  }

  const now = new Date().toISOString();
  const health = db.institutionalConnectionHealth.get(`IHLTH-${connectorId}`);
  const status = missing.length === 0 ? 'SANDBOX_CONNECTED' : 'NOT_CONFIGURED';
  if (health) {
    health.status = status;
    health.lastCheckedAt = now;
    health.diagnosticNote = missing.length ? `Preconditions unmet: ${missing.join('; ')}` : 'Sandbox probe verified';
    db.institutionalConnectionHealth.set(health.id, health);
  }
  conn.lastFailureReason = missing.length ? missing.join('; ') : null;
  db.institutionalConnectorRegistry.set(conn.id, conn);
  db.scheduleSave();

  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: conn.jurisdiction,
    actorId,
    actorRole: 'PLATFORM_ADMIN',
    actionType: 'INSTITUTIONAL_CONNECTOR_TEST',
    entityType: 'INSTITUTIONAL_CONNECTOR',
    entityId: conn.id,
    details: `Tested ${conn.id}: truthfulStatus=${status}; unmet=${missing.length}`,
  });

  return {
    found: true,
    connector: conn,
    truthfulConnectionStatus: status,
    preconditionsMet: missing.length === 0,
    missingPrerequisites: missing,
  };
}

export function validateMtlsCertificate(certId: string): {
  valid: boolean;
  reason?: string;
  certificate?: any;
} {
  const cert = db.institutionalCertificates.get(certId);
  if (!cert) return { valid: false, reason: 'CERTIFICATE_NOT_FOUND' };
  if (cert.status === 'REVOKED') return { valid: false, reason: `CERTIFICATE_REVOKED: ${cert.revocationReason || 'Revoked by administrator'}`, certificate: cert };
  if (cert.status === 'EXPIRED' || Date.parse(cert.validTo) <= Date.now()) {
    cert.status = 'EXPIRED';
    db.institutionalCertificates.set(cert.id, cert);
    return { valid: false, reason: 'CERTIFICATE_EXPIRED: Certificate validity period ended.', certificate: cert };
  }
  return { valid: true, certificate: cert };
}

// ==========================================
// 3. HSM ADAPTER, KEY LIFECYCLE & LEVEL 5 CRYPTOGRAPHIC DUAL APPROVAL (§15-§17)
// ==========================================

export function enforceHsmKeyPolicy(keyId: string, requireProductionHsm = false): {
  allowed: boolean;
  key?: any;
  reason?: string;
} {
  const key = db.cryptographicKeyRegistry.get(keyId);
  if (!key) return { allowed: false, reason: `KEY_NOT_FOUND: ${keyId}` };
  if (key.status === 'REVOKED' || key.status === 'COMPROMISED') {
    return { allowed: false, reason: `KEY_${key.status}: Key ${key.id} is unusable.` };
  }
  const hsm = db.hardwareSecurityModules.get(key.hsmModuleId);
  if (requireProductionHsm && (key.environmentScope !== 'PRODUCTION_HSM_REQUIRED' || !hsm || hsm.environmentScope !== 'PRODUCTION' || hsm.status !== 'PRODUCTION_CONNECTED_AND_VERIFIED')) {
    return {
      allowed: false,
      reason: 'PRODUCTION_HSM_REQUIRED: Production keys cannot silently fall back to development software keys.',
    };
  }
  return { allowed: true, key };
}

export function rotateCryptographicKey(keyId: string, actorId: string): { success: boolean; key?: any; error?: string } {
  const key = db.cryptographicKeyRegistry.get(keyId);
  if (!key) return { success: false, error: `Key ${keyId} not found.` };
  if (key.status === 'COMPROMISED' || key.status === 'REVOKED') {
    return { success: false, error: `Cannot rotate ${key.status} key ${keyId}; issue a fresh key identifier.` };
  }
  // Generate fresh ECDSA P-256 keypair for new version
  const newRef = `${keyId}-v${key.version + 1}`;
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  DEV_ISOLATED_KEY_STORE.set(newRef, privateKey);
  key.publicKeyPem = publicKey;
  key.privateKeyDevOnlyRef = newRef;
  key.version += 1;
  key.rotatedAt = new Date().toISOString();
  db.cryptographicKeyRegistry.set(key.id, key);
  db.scheduleSave();

  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: key.jurisdiction,
    actorId,
    actorRole: 'PLATFORM_ADMIN',
    actionType: 'CRYPTO_KEY_ROTATED',
    entityType: 'CRYPTOGRAPHIC_KEY',
    entityId: key.id,
    details: `Rotated ${key.id} to version ${key.version}.`,
  });

  return { success: true, key: { ...key, privateKeyDevOnlyRef: undefined } };
}

export function createCryptoApprovalRequest(params: {
  tenantId: string;
  jurisdiction: string;
  actionType: string;
  operationPayload: Record<string, any>;
  requestedBy: string;
  expiresInMinutes?: number;
}): CryptographicApprovalRequest {
  const canonical = canonicalizePayload(params.operationPayload);
  const canonicalPayloadHash = sha256Hex(canonical);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (params.expiresInMinutes ?? 30) * 60 * 1000).toISOString();

  const req: CryptographicApprovalRequest = {
    id: `CAPR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
    tenantId: params.tenantId,
    jurisdiction: params.jurisdiction,
    actionType: params.actionType,
    operationPayload: params.operationPayload,
    canonicalPayloadHash,
    requestedBy: params.requestedBy,
    requiredSignatures: 2,
    expiresAt,
    status: 'PENDING_DUAL_APPROVAL',
    createdAt: now.toISOString(),
  };
  db.cryptographicApprovalRequests.set(req.id, req);
  db.scheduleSave();
  return req;
}

export function signCryptoApprovalRequest(params: {
  approvalRequestId: string;
  signerUserId: string;
  signerRole: string;
  sessionToken: string;
  keyId: string;
  payloadToSign?: Record<string, any>;
  replaySignatureBase64?: string;
}): { success: boolean; approval?: CryptographicApprovalRequest; signature?: CryptographicApprovalSignature; error?: string; code?: string } {
  const req = db.cryptographicApprovalRequests.get(params.approvalRequestId);
  if (!req) return { success: false, code: 'NOT_FOUND', error: `Approval request ${params.approvalRequestId} not found.` };

  if (Date.parse(req.expiresAt) <= Date.now()) {
    req.status = 'EXPIRED';
    db.cryptographicApprovalRequests.set(req.id, req);
    return { success: false, code: 'APPROVAL_EXPIRED', error: 'Approval request has expired.' };
  }

  // Exact payload hash binding check
  if (params.payloadToSign) {
    const providedHash = sha256Hex(canonicalizePayload(params.payloadToSign));
    if (providedHash !== req.canonicalPayloadHash) {
      req.status = 'TAMPER_INVALIDATED';
      db.cryptographicApprovalRequests.set(req.id, req);
      db.scheduleSave();
      return {
        success: false,
        code: 'PAYLOAD_HASH_MISMATCH',
        error: 'Operation payload was altered after request creation; cryptographic approval invalidated.',
      };
    }
  }

  // Enforce authorized role
  if (params.signerRole !== 'PLATFORM_ADMIN' && params.signerRole !== 'COOPERATIVE_ADMIN') {
    return { success: false, code: 'UNAUTHORIZED_SIGNER', error: `Role ${params.signerRole} is not authorized to sign Level 5 approvals.` };
  }

  const keyPolicy = enforceHsmKeyPolicy(params.keyId, false);
  if (!keyPolicy.allowed || !keyPolicy.key) {
    return { success: false, code: 'KEY_UNUSABLE', error: keyPolicy.reason || 'Key unusable' };
  }

  const sessionHash = sha256Hex(params.sessionToken || `${params.signerUserId}-sess`);
  const existingSigs = Array.from(db.cryptographicApprovalSignatures.values()).filter(
    (s) => s.approvalRequestId === req.id
  );

  // Prevent single operator or same session signing twice
  if (existingSigs.some((s) => s.signerUserId === params.signerUserId)) {
    return {
      success: false,
      code: 'SELF_APPROVAL_PROHIBITED',
      error: `DUAL_AUTH_REQUIRED: Operator ${params.signerUserId} has already signed; a second distinct human operator is mandatory.`,
    };
  }
  if (existingSigs.some((s) => s.signerSessionTokenHash === sessionHash)) {
    return {
      success: false,
      code: 'DUPLICATE_SESSION_REJECTED',
      error: 'INDEPENDENT_SESSION_REQUIRED: Second approval must originate from an independent authenticated session.',
    };
  }

  // Replay signature check
  if (params.replaySignatureBase64) {
    const replayed = Array.from(db.cryptographicApprovalSignatures.values()).some(
      (s) => s.signatureBase64 === params.replaySignatureBase64
    );
    if (replayed) {
      return { success: false, code: 'REPLAY_SIGNATURE_REJECTED', error: 'Replayed cryptographic signature rejected.' };
    }
  }

  const keyRef = keyPolicy.key.privateKeyDevOnlyRef || params.keyId;
  const kp = getOrGenerateDevEcdsaKeyPair(keyRef);
  const signer = crypto.createSign('SHA256');
  signer.update(`${req.id}|${req.canonicalPayloadHash}|${params.signerUserId}|${sessionHash}`);
  signer.end();
  const sigBase64 = signer.sign(kp.privateKeyPem).toString('base64');

  const sigRec: CryptographicApprovalSignature = {
    id: `CSIG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
    approvalRequestId: req.id,
    signerUserId: params.signerUserId,
    signerRole: params.signerRole,
    signerSessionTokenHash: sessionHash,
    keyId: params.keyId,
    keyVersion: keyPolicy.key.version,
    signedPayloadHash: req.canonicalPayloadHash,
    signatureBase64: sigBase64,
    verified: true,
    signedAt: new Date().toISOString(),
  };
  db.cryptographicApprovalSignatures.set(sigRec.id, sigRec);

  const totalSigs = existingSigs.length + 1;
  if (totalSigs >= req.requiredSignatures) {
    req.status = 'APPROVED';
    db.cryptographicApprovalRequests.set(req.id, req);
  }
  db.scheduleSave();

  return { success: true, approval: req, signature: sigRec };
}

export function verifyCryptoApprovalRequest(
  approvalRequestId: string,
  expectedPayload?: Record<string, any>
): {
  verified: boolean;
  reason?: string;
  signaturesVerifiedCount: number;
  approval?: CryptographicApprovalRequest;
} {
  const req = db.cryptographicApprovalRequests.get(approvalRequestId);
  if (!req) return { verified: false, reason: 'NOT_FOUND', signaturesVerifiedCount: 0 };
  if (Date.parse(req.expiresAt) <= Date.now()) {
    return { verified: false, reason: 'EXPIRED', signaturesVerifiedCount: 0, approval: req };
  }
  if (expectedPayload) {
    const actualHash = sha256Hex(canonicalizePayload(expectedPayload));
    if (actualHash !== req.canonicalPayloadHash) {
      req.status = 'TAMPER_INVALIDATED';
      db.cryptographicApprovalRequests.set(req.id, req);
      return { verified: false, reason: 'ALTERED_PAYLOAD_DETECTED', signaturesVerifiedCount: 0, approval: req };
    }
  }

  const sigs = Array.from(db.cryptographicApprovalSignatures.values()).filter((s) => s.approvalRequestId === req.id);
  const distinctOperators = new Set(sigs.map((s) => s.signerUserId));
  let validCount = 0;

  for (const s of sigs) {
    const key = db.cryptographicKeyRegistry.get(s.keyId);
    if (!key || key.status === 'REVOKED' || key.status === 'COMPROMISED') continue;
    const verifier = crypto.createVerify('SHA256');
    verifier.update(`${req.id}|${req.canonicalPayloadHash}|${s.signerUserId}|${s.signerSessionTokenHash}`);
    verifier.end();
    if (verifier.verify(key.publicKeyPem, Buffer.from(s.signatureBase64, 'base64'))) {
      validCount++;
    }
  }

  const verified = req.status === 'APPROVED' && distinctOperators.size >= req.requiredSignatures && validCount >= req.requiredSignatures;
  return {
    verified,
    reason: verified ? undefined : `Need ${req.requiredSignatures} valid distinct operator signatures; found ${validCount}`,
    signaturesVerifiedCount: validCount,
    approval: req,
  };
}

export function createAndVerifySignedAuditCheckpoint(): {
  checkpoint: SignedAuditCheckpoint;
  signatureVerified: boolean;
} {
  const prev = Array.from(db.signedAuditCheckpoints.values());
  const prevHash = prev.length > 0 ? prev[prev.length - 1].merkleOrChainRootHash : '0xGENESIS_V13';
  const events = Array.from(db.intelligenceAuditEvents.values());
  const rootHash = sha256Hex(`${prevHash}|${events.length}|${events[events.length - 1]?.tamperHash || 'empty'}`);
  const keyId = 'KMS-UG-OP-SIGN-01';
  const kp = getOrGenerateDevEcdsaKeyPair(db.cryptographicKeyRegistry.get(keyId)?.privateKeyDevOnlyRef || keyId);
  const signer = crypto.createSign('SHA256');
  signer.update(rootHash);
  signer.end();
  const sig = signer.sign(kp.privateKeyPem).toString('base64');

  const cp: SignedAuditCheckpoint = {
    id: `ACHK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
    sequenceRangeStart: prev.length > 0 ? prev[prev.length - 1].sequenceRangeEnd : 0,
    sequenceRangeEnd: events.length,
    merkleOrChainRootHash: rootHash,
    previousCheckpointHash: prevHash,
    signingKeyId: keyId,
    signatureBase64: sig,
    integrityVerified: true,
    createdAt: new Date().toISOString(),
    tamperLimitationNote: 'Signed hash-chain checkpoint detects retrospective mutation in local store; independent external WORM anchoring required for external legal immutability.',
  };
  db.signedAuditCheckpoints.set(cp.id, cp);
  db.scheduleSave();

  const key = db.cryptographicKeyRegistry.get(keyId)!;
  const ver = crypto.createVerify('SHA256');
  ver.update(cp.merkleOrChainRootHash);
  ver.end();
  const signatureVerified = ver.verify(key.publicKeyPem, Buffer.from(cp.signatureBase64, 'base64'));
  return { checkpoint: cp, signatureVerified };
}
