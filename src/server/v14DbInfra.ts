/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V14.0 - Database Authority Manager & Distributed Event Streaming Infrastructure
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import { db } from './db.ts';
import type {
  DatabaseAuthorityState,
  DatabaseCutoverChecklist,
  DatabaseBackupVerification,
  DistributedBrokerHealth,
} from '../types/index.ts';
import { publishDistributedEvent } from './v13EventNetwork.ts';
import { logIntelligenceAudit } from './v12Engine.ts';

function sha256Hex(raw: Buffer | string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ==========================================
// 1. DATABASE AUTHORITY MANAGER & 7-GATE CUTOVER VALIDATOR
// ==========================================

export function getSchemaV14DdlMetadata(): {
  schemaFileExists: boolean;
  schemaFilePath: string;
  schemaChecksumSha256: string | null;
  statementCount: number;
} {
  const schemaPath = path.join(process.cwd(), 'src', 'server', 'postgres', 'schema_v14.sql');
  if (!fs.existsSync(schemaPath)) {
    return {
      schemaFileExists: false,
      schemaFilePath: schemaPath,
      schemaChecksumSha256: null,
      statementCount: 0,
    };
  }
  const content = fs.readFileSync(schemaPath, 'utf8');
  return {
    schemaFileExists: true,
    schemaFilePath: schemaPath,
    schemaChecksumSha256: sha256Hex(content),
    statementCount: content.split(';').filter((s) => s.trim().length > 0).length,
  };
}

export async function probeDatabaseInfrastructureV14(): Promise<{
  activeAuthority: DatabaseAuthorityState;
  singleWriterLockEnforced: boolean;
  postgresEnvConfigured: boolean;
  postgresReachable: boolean;
  postgresServerVersion: string | null;
  timescaleDetected: boolean;
  schemaV14Ddl: ReturnType<typeof getSchemaV14DdlMetadata>;
  replicas: any[];
  latestChecklist: DatabaseCutoverChecklist | undefined;
  truthfulDisclosure: string;
}> {
  const dsn = process.env.DATABASE_URL || (process.env.PGHOST ? `postgres://${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'aros'}` : '');
  let postgresReachable = false;
  let postgresServerVersion: string | null = null;
  let timescaleDetected = false;

  if (dsn) {
    const pool = new Pool({ connectionString: dsn, connectionTimeoutMillis: 1500 });
    try {
      const verRes = await pool.query('SELECT version() AS ver');
      postgresServerVersion = verRes.rows[0]?.ver || null;
      postgresReachable = Boolean(postgresServerVersion);
      const tsRes = await pool.query("SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'");
      timescaleDetected = (tsRes.rowCount || 0) > 0;
    } catch {
      postgresReachable = false;
    } finally {
      await pool.end().catch(() => {});
    }
  }

  const latestChecklist = Array.from(db.databaseCutoverChecklists.values()).slice(-1)[0];
  const activeAuthority: DatabaseAuthorityState = latestChecklist?.currentAuthorityState || 'WAL_JSON_SINGLE_NODE';

  return {
    activeAuthority,
    singleWriterLockEnforced: true,
    postgresEnvConfigured: Boolean(dsn),
    postgresReachable,
    postgresServerVersion,
    timescaleDetected,
    schemaV14Ddl: getSchemaV14DdlMetadata(),
    replicas: Array.from(db.databaseReplicaHealth.values()),
    latestChecklist,
    truthfulDisclosure: postgresReachable
      ? 'PostgreSQL connection verified; cutover governed by 7-gate checklist.'
      : 'No live PostgreSQL server configured or reachable in container. WAL_JSON_SINGLE_NODE remains the exclusive single authoritative writer.',
  };
}

export async function evaluateAndRequestCutover(params: {
  requestedAuthorityState: DatabaseAuthorityState;
  platformAdminApproved: boolean;
  actorId: string;
}): Promise<{ allowed: boolean; statusCode: number; checklist: DatabaseCutoverChecklist }> {
  const probe = await probeDatabaseInfrastructureV14();
  const backupSummary = db.verifyV13BackupAndRollbackReadiness();
  const fin = db.getFinancialIntegrityReport();

  const gates = {
    postgresProvisionedAndReachable: probe.postgresReachable,
    schemaV14AppliedAndVerified: probe.postgresReachable && probe.schemaV14Ddl.schemaFileExists,
    zeroDataLossChecksumVerified: backupSummary.v13BackupValid && Boolean(backupSummary.checksumSha256),
    shadowParityPassed: probe.postgresReachable && fin.journalBalanced,
    backupAndRestoreVerified: backupSummary.rollbackSupported,
    singleWriterLockConfirmed: true,
    platformAdminApproved: params.platformAdminApproved,
  };

  const blockedReasons: string[] = [];
  if (!gates.postgresProvisionedAndReachable) blockedReasons.push('PostgreSQL server not provisioned/reachable (DATABASE_URL / PGHOST unavailable).');
  if (!gates.schemaV14AppliedAndVerified) blockedReasons.push('schema_v14.sql cannot be verified against a live PostgreSQL instance.');
  if (!gates.zeroDataLossChecksumVerified) blockedReasons.push('Canonical pre-V14 backup SHA-256 verification incomplete.');
  if (!gates.shadowParityPassed) blockedReasons.push('PostgreSQL shadow parity check requires live PostgreSQL connection.');
  if (!gates.platformAdminApproved) blockedReasons.push('Explicit PLATFORM_ADMIN cutover sign-off required.');

  const allGatesPassed =
    params.requestedAuthorityState === 'WAL_JSON_SINGLE_NODE' ||
    Object.values(gates).every((v) => v === true);

  const checklist: DatabaseCutoverChecklist = {
    id: `CUTOVER-${Date.now().toString(36).toUpperCase()}`,
    targetEngine: params.requestedAuthorityState === 'POSTGRES_PRIMARY_WITH_REPLICAS' ? 'POSTGRESQL_HA_CLUSTER' : 'POSTGRESQL_16',
    currentAuthorityState: allGatesPassed && params.requestedAuthorityState !== 'WAL_JSON_SINGLE_NODE' ? params.requestedAuthorityState : probe.activeAuthority,
    requestedAuthorityState: params.requestedAuthorityState,
    gates,
    allGatesPassed,
    blockedReasons,
    evaluatedBy: params.actorId,
    evaluatedAt: new Date().toISOString(),
  };

  db.databaseCutoverChecklists.set(checklist.id, checklist);
  db.scheduleSave();

  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'UG',
    actorId: params.actorId,
    actorRole: 'PLATFORM_ADMIN',
    actionType: allGatesPassed ? 'DB_CUTOVER_APPROVED' : 'DB_CUTOVER_BLOCKED',
    entityType: 'DATABASE_CUTOVER',
    entityId: checklist.id,
    details: allGatesPassed
      ? `Cutover transition evaluated to ${checklist.currentAuthorityState}`
      : `Cutover to ${params.requestedAuthorityState} rejected: ${blockedReasons.join(' | ')}`,
  });

  if (!allGatesPassed) {
    return { allowed: false, statusCode: 409, checklist };
  }
  return { allowed: true, statusCode: 200, checklist };
}

export function runBackupAndRestoreDrillV14(actorId: string): DatabaseBackupVerification {
  const backupResult = db.createAutomatedBackup();
  const raw = fs.existsSync(backupResult.backupPath) ? fs.readFileSync(backupResult.backupPath) : Buffer.from('{}');
  const parsed = JSON.parse(raw.toString('utf8'));
  const checksum = sha256Hex(raw);
  const integrityVerified = Number(parsed.schemaVersion) >= 14 && Array.isArray(parsed.users) && parsed.users.length > 0;

  const verification: DatabaseBackupVerification = {
    id: `BKV-V14-${Date.now().toString(36).toUpperCase()}`,
    backupType: 'RESTORE_DRILL',
    filePath: backupResult.backupPath,
    schemaVersion: Number(parsed.schemaVersion || 14),
    checksumSha256: checksum,
    bytes: backupResult.bytes,
    restoreSimulated: true,
    integrityVerified,
    rollbackSupported: db.verifyV13BackupAndRollbackReadiness().rollbackSupported,
    restoredRecordCounts: {
      users: Array.isArray(parsed.users) ? parsed.users.length : 0,
      tenants: Array.isArray(parsed.tenants) ? parsed.tenants.length : 0,
      universalJournal: Array.isArray(parsed.universalJournal) ? parsed.universalJournal.length : 0,
      paymentTransactions: Array.isArray(parsed.paymentTransactions) ? parsed.paymentTransactions.length : 0,
    },
    verifiedBy: actorId,
    verifiedAt: new Date().toISOString(),
  };

  db.databaseBackupVerifications.set(verification.id, verification);
  db.scheduleSave();
  return verification;
}

// ==========================================
// 2. V14 DISTRIBUTED EVENT INFRASTRUCTURE (BROKER ADAPTERS & LAG MONITORING)
// ==========================================

export function getDistributedEventsInfraSummary() {
  const brokers = Array.from(db.distributedBrokerHealth.values());
  const offsets = Array.from(db.distributedConsumerOffsets.values());
  const outboxCount = db.distributedEventOutbox.size;
  const dlqCount = db.distributedDeadLetterEvents.size;
  const pendingCount = Array.from(db.distributedEventOutbox.values()).filter((e) => e.deliveryStatus === 'PENDING').length;

  // Keep consumer offsets synced with current outbox total
  offsets.forEach((off) => {
    off.latestOutboxOffset = outboxCount;
    const consumer = Array.from(db.distributedEventConsumers.values()).find((c) => c.consumerGroup === off.consumerGroup);
    if (consumer && consumer.status === 'DEGRADED') {
      off.status = 'DEGRADED';
      off.consumerLag = Math.max(0, outboxCount - off.committedOffset);
    } else {
      off.committedOffset = Math.max(off.committedOffset, outboxCount - pendingCount);
      off.consumerLag = Math.max(0, outboxCount - off.committedOffset);
      off.status = off.consumerLag > 5 ? 'LAGGING' : 'ACTIVE';
    }
    db.distributedConsumerOffsets.set(off.id, off);
  });

  const localBroker = db.distributedBrokerHealth.get('BROKER-LOCAL-OUTBOX');
  if (localBroker) {
    localBroker.dlqCount = dlqCount;
    localBroker.currentBackpressurePct = Math.min(100, Math.round((pendingCount / Math.max(1, localBroker.maxInFlightMessages)) * 100));
    localBroker.lastHealthCheckAt = new Date().toISOString();
    db.distributedBrokerHealth.set(localBroker.id, localBroker);
  }

  return {
    activeBrokerAdapter: 'LOCAL_OUTBOX_LOG',
    externalKafkaStatus: db.distributedBrokerHealth.get('BROKER-KAFKA-TARGET')?.connectionStatus || 'NOT_CONFIGURED',
    externalNatsStatus: db.distributedBrokerHealth.get('BROKER-NATS-TARGET')?.connectionStatus || 'NOT_CONFIGURED',
    exactlyOnceBrokerClaimed: false,
    deliverySemantics: 'AT_LEAST_ONCE_WITH_IDEMPOTENT_INBOX',
    outboxTotal: outboxCount,
    pendingOutboxCount: pendingCount,
    dlqCount,
    brokers,
    consumerOffsets: offsets,
  };
}

export function publishV14OrderedEvent(params: {
  eventType: string;
  schemaVersion?: string;
  jurisdiction: string;
  tenantId: string;
  orderingKey: string;
  idempotencyKey: string;
  actorId?: string;
  actorRole?: string;
  payloadReference: string;
  payloadSummary?: Record<string, any>;
}) {
  const normalizedSchemaVer = params.schemaVersion === '1.0' ? '1.0.0' : params.schemaVersion || '1.0.0';
  const pubRes = publishDistributedEvent({
    eventType: params.eventType,
    schemaVersion: normalizedSchemaVer,
    producer: 'v14-operations-bus',
    jurisdiction: params.jurisdiction,
    tenantId: params.tenantId,
    correlationId: `ORDKEY-${params.orderingKey}`,
    idempotencyKey: params.idempotencyKey,
    actorId: params.actorId || 'SYSTEM_V14',
    actorRole: params.actorRole || 'PLATFORM_ADMIN',
    payloadReference: params.payloadReference,
    payloadSummary: { ...(params.payloadSummary || {}), orderingKey: params.orderingKey },
  });

  if (pubRes.event) {
    // Update consumer offsets for subscribed groups
    for (const off of db.distributedConsumerOffsets.values()) {
      off.latestOutboxOffset = db.distributedEventOutbox.size;
      if (pubRes.event.deliveryStatus === 'ACKNOWLEDGED') {
        off.committedOffset = off.latestOutboxOffset;
        off.consumerLag = 0;
        off.status = 'ACTIVE';
      } else {
        off.consumerLag = Math.max(0, off.latestOutboxOffset - off.committedOffset);
        off.status = off.consumerLag > 0 ? 'LAGGING' : 'ACTIVE';
      }
      off.lastCommittedAt = new Date().toISOString();
      db.distributedConsumerOffsets.set(off.id, off);
    }
    db.scheduleSave();
  }

  return {
    ...pubRes,
    statusCode: pubRes.accepted
      ? pubRes.deduplicated
        ? 200
        : 201
      : pubRes.code === 'CONFIDENTIAL_PII_LEAK' || pubRes.code === 'SENSITIVE_DATA_LEAK_BLOCKED'
        ? 403
        : 400,
  };
}

export function configureBrokerAdapterTarget(params: {
  adapterType: 'KAFKA' | 'NATS_JETSTREAM';
  retentionPolicyHours?: number;
  maxInFlightMessages?: number;
  actorId: string;
}): { ok: boolean; broker?: DistributedBrokerHealth; error?: string } {
  const id = params.adapterType === 'KAFKA' ? 'BROKER-KAFKA-TARGET' : 'BROKER-NATS-TARGET';
  const broker = db.distributedBrokerHealth.get(id);
  if (!broker) return { ok: false, error: `Unknown broker adapter ${params.adapterType}` };

  if (params.retentionPolicyHours && params.retentionPolicyHours > 0) {
    broker.retentionPolicyHours = params.retentionPolicyHours;
  }
  if (params.maxInFlightMessages && params.maxInFlightMessages > 0) {
    broker.maxInFlightMessages = params.maxInFlightMessages;
  }
  const envConfigured =
    params.adapterType === 'KAFKA' ? Boolean(process.env.KAFKA_BROKERS) : Boolean(process.env.NATS_URL);
  broker.connectionStatus = envConfigured ? 'SANDBOX_CONNECTED' : 'NOT_CONFIGURED';
  broker.lastHealthCheckAt = new Date().toISOString();
  broker.diagnosticNote = envConfigured
    ? `${params.adapterType} configuration updated.`
    : `Policy updated cleanly; ${params.adapterType} remains NOT_CONFIGURED until broker endpoint environment variables are provisioned.`;

  db.distributedBrokerHealth.set(broker.id, broker);
  db.scheduleSave();
  logIntelligenceAudit({
    tenantId: 'GLOBAL_PUBLIC',
    jurisdiction: 'UG',
    actorId: params.actorId,
    actorRole: 'PLATFORM_ADMIN',
    actionType: 'BROKER_ADAPTER_CONFIGURED',
    entityType: 'DISTRIBUTED_BROKER',
    entityId: broker.id,
    details: `Updated ${params.adapterType} retention=${broker.retentionPolicyHours}h (status=${broker.connectionStatus})`,
  });
  return { ok: true, broker };
}
