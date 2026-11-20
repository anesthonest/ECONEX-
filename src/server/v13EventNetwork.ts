/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V13.0 - Durable Distributed Event Streaming & Transactional Outbox Engine
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { db } from './db.ts';
import type {
  DistributedEventOutbox,
  DistributedEventInbox,
  DistributedEventConsumer,
  DistributedDeadLetterEvent,
  V13TruthfulStatus,
} from '../types/index.ts';

function sha256Hex(val: string): string {
  return `0x${crypto.createHash('sha256').update(val).digest('hex')}`;
}

let brokerSimulatedOutage = false;

export function setBrokerSimulatedOutage(outage: boolean): { brokerOutageActive: boolean } {
  brokerSimulatedOutage = outage;
  db.distributedEventConsumers.forEach((c) => {
    c.status = outage ? 'DEGRADED' : 'ACTIVE';
    c.lastHeartbeatAt = new Date().toISOString();
    db.distributedEventConsumers.set(c.id, c);
  });
  db.scheduleSave();
  return { brokerOutageActive: brokerSimulatedOutage };
}

export function getEventNetworkStatus(): {
  kafkaConfigured: boolean;
  natsConfigured: boolean;
  activeAdapter: 'LOCAL_OUTBOX_LOG' | 'KAFKA_ADAPTER' | 'NATS_ADAPTER';
  truthfulBrokerStatus: V13TruthfulStatus;
  brokerSimulatedOutage: boolean;
  deliverySemantics: 'AT_LEAST_ONCE_WITH_IDEMPOTENT_CONSUMERS';
  schemasCount: number;
  outboxTotal: number;
  outboxPendingOrFailed: number;
  inboxProcessed: number;
  duplicatesSuppressed: number;
  deadLetterCount: number;
  consumersCount: number;
} {
  const kafkaConfigured = Boolean(process.env.KAFKA_BROKERS);
  const natsConfigured = Boolean(process.env.NATS_URL);
  let outboxPendingOrFailed = 0;
  for (const o of db.distributedEventOutbox.values()) {
    if (o.deliveryStatus === 'PENDING' || o.deliveryStatus === 'FAILED') outboxPendingOrFailed++;
  }
  let inboxProcessed = 0;
  let duplicatesSuppressed = 0;
  for (const i of db.distributedEventInbox.values()) {
    if (i.status === 'PROCESSED') inboxProcessed++;
    else if (i.status === 'DUPLICATE_SUPPRESSED') duplicatesSuppressed++;
  }
  return {
    kafkaConfigured,
    natsConfigured,
    activeAdapter: 'LOCAL_OUTBOX_LOG',
    truthfulBrokerStatus: brokerSimulatedOutage
      ? 'DEGRADED'
      : kafkaConfigured || natsConfigured
        ? 'CONFIGURED'
        : 'LOCAL_ONLY',
    brokerSimulatedOutage,
    deliverySemantics: 'AT_LEAST_ONCE_WITH_IDEMPOTENT_CONSUMERS',
    schemasCount: db.distributedEventSchemas.size,
    outboxTotal: db.distributedEventOutbox.size,
    outboxPendingOrFailed,
    inboxProcessed,
    duplicatesSuppressed,
    deadLetterCount: db.distributedDeadLetterEvents.size,
    consumersCount: db.distributedEventConsumers.size,
  };
}

export function publishDistributedEvent(params: {
  eventType: string;
  schemaVersion?: string;
  producer: string;
  jurisdiction: string;
  tenantId: string;
  correlationId?: string;
  idempotencyKey?: string;
  actorId: string;
  actorRole: string;
  payloadReference: string;
  payloadSummary?: Record<string, any>;
  poisonSimulate?: boolean;
}): { accepted: boolean; deduplicated?: boolean; event?: DistributedEventOutbox; error?: string; code?: string } {
  const schema = Array.from(db.distributedEventSchemas.values()).find(
    (s) => s.eventType === params.eventType && (!params.schemaVersion || s.schemaVersion === params.schemaVersion)
  );
  if (!schema) {
    return {
      accepted: false,
      code: 'UNKNOWN_EVENT_SCHEMA',
      error: `Event schema not registered for ${params.eventType}@${params.schemaVersion || '1.0.0'}.`,
    };
  }

  // Prevent confidential PII leaks into shared outbox streams
  const serializedSummary = JSON.stringify(params.payloadSummary || {});
  if (/(password|privateKey|secretKey|pinCode|rawBankSecret)/i.test(serializedSummary)) {
    return {
      accepted: false,
      code: 'SENSITIVE_DATA_LEAK_BLOCKED',
      error: 'Prohibited confidential field detected in event payloadSummary; store protected data in enclave and pass payloadReference only.',
    };
  }

  const idemKey = params.idempotencyKey || `${params.eventType}-${params.tenantId}-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  const existing = Array.from(db.distributedEventOutbox.values()).find(
    (e) => e.idempotencyKey === idemKey && e.tenantId === params.tenantId
  );
  if (existing) {
    return { accepted: true, deduplicated: true, event: existing };
  }

  const now = new Date().toISOString();
  const seq = db.distributedEventOutbox.size + 1;
  const id = `EV13-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`;
  const correlationId = params.correlationId || `CORR-${Date.now().toString(36).toUpperCase()}`;

  // Strip any claim that SETTLED overrides authoritative verification
  const cleanSummary = { ...(params.payloadSummary || {}) };
  if (params.eventType === 'SETTLEMENT_CLAIM_RECEIVED') {
    cleanSummary.authoritativeSettlementProof = false;
    cleanSummary.requiresProviderSettlementVerification = true;
  }

  const integrityHash = sha256Hex(`${id}|${params.eventType}|${schema.schemaVersion}|${params.tenantId}|${params.jurisdiction}|${idemKey}|${params.payloadReference}|${seq}`);

  const event: DistributedEventOutbox = {
    id,
    eventType: params.eventType,
    schemaVersion: schema.schemaVersion,
    producer: params.producer,
    timestamp: now,
    jurisdiction: params.jurisdiction,
    tenantId: params.tenantId,
    correlationId,
    idempotencyKey: idemKey,
    authorizationContext: {
      actorId: params.actorId,
      role: params.actorRole,
      clearance: params.actorRole === 'PLATFORM_ADMIN' ? 'ADMIN' : 'TENANT_SCOPED',
    },
    payloadReference: params.payloadReference,
    payloadSummary: cleanSummary,
    integrityHash,
    brokerAdapter: 'LOCAL_OUTBOX_LOG',
    deliveryStatus: brokerSimulatedOutage ? 'PENDING' : 'PUBLISHED',
    sequenceNumber: seq,
    retryCount: 0,
    maxRetries: 3,
  };

  if (params.poisonSimulate) {
    event.deliveryStatus = 'DEAD_LETTER';
    event.retryCount = event.maxRetries;
    db.distributedEventOutbox.set(event.id, event);
    const dlq: DistributedDeadLetterEvent = {
      id: `DLQ13-${Date.now().toString(36).toUpperCase()}`,
      outboxEventId: event.id,
      eventType: event.eventType,
      tenantId: event.tenantId,
      jurisdiction: event.jurisdiction,
      failureReason: 'POISON_PAYLOAD_QUARANTINED: Malformed or failing consumer payload exceeded bounded retry limit.',
      poisonPayloadDetected: true,
      attempts: event.maxRetries,
      quarantinedAt: now,
      status: 'QUARANTINED',
    };
    db.distributedDeadLetterEvents.set(dlq.id, dlq);
    db.scheduleSave();
    return { accepted: true, deduplicated: false, event };
  }

  db.distributedEventOutbox.set(event.id, event);

  // Immediately deliver if broker available (transactional outbox fan-out to subscribed consumer groups)
  if (!brokerSimulatedOutage) {
    deliverOutboxEventToSubscribers(event);
  }
  db.scheduleSave();
  return { accepted: true, deduplicated: false, event };
}

let processedInboxKeys: Set<string> | null = null;

function ensureProcessedInboxKeys(): Set<string> {
  if (!processedInboxKeys || db.distributedEventInbox.size === 0) {
    processedInboxKeys = new Set<string>();
    for (const item of db.distributedEventInbox.values()) {
      if (item.status === 'PROCESSED') {
        processedInboxKeys.add(`${item.consumerGroupId}::${item.idempotencyKey}`);
      }
    }
  }
  return processedInboxKeys;
}

export function deliverOutboxEventToSubscribers(event: DistributedEventOutbox): {
  deliveredCount: number;
  suppressedDuplicatesCount: number;
} {
  let deliveredCount = 0;
  let suppressedDuplicatesCount = 0;
  const now = new Date().toISOString();
  const keys = ensureProcessedInboxKeys();

  db.distributedEventConsumers.forEach((consumer) => {
    if (!consumer.subscribedEventTypes.includes(event.eventType)) return;
    if (consumer.tenantScope !== 'ALL' && consumer.tenantScope !== event.tenantId) return;

    // Idempotent inbox deduplication per consumer group (O(1) lookup)
    const compositeKey = `${consumer.id}::${event.idempotencyKey}`;
    if (keys.has(compositeKey)) {
      suppressedDuplicatesCount++;
      consumer.duplicateSuppressedCount += 1;
      const supId = `INB-SUP-${consumer.id}-${event.idempotencyKey}`;
      const supRecord: DistributedEventInbox = {
        id: supId,
        outboxEventId: event.id,
        consumerGroupId: consumer.id,
        idempotencyKey: event.idempotencyKey,
        receivedAt: now,
        processedAt: now,
        status: 'DUPLICATE_SUPPRESSED',
        financialSettlementVerifiedByProvider: false,
      };
      db.distributedEventInbox.set(supId, supRecord);
      db.distributedEventConsumers.set(consumer.id, consumer);
      return;
    }

    // Even if SETTLEMENT_CLAIM_RECEIVED is processed, never trust event alone as settlement proof
    const inb: DistributedEventInbox = {
      id: `INB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
      outboxEventId: event.id,
      consumerGroupId: consumer.id,
      idempotencyKey: event.idempotencyKey,
      receivedAt: now,
      processedAt: now,
      status: 'PROCESSED',
      financialSettlementVerifiedByProvider: false,
    };
    db.distributedEventInbox.set(inb.id, inb);
    keys.add(compositeKey);
    consumer.ackCount += 1;
    consumer.lastHeartbeatAt = now;
    db.distributedEventConsumers.set(consumer.id, consumer);
    deliveredCount++;
  });

  if (deliveredCount > 0 || suppressedDuplicatesCount > 0) {
    event.deliveryStatus = 'ACKNOWLEDGED';
    db.distributedEventOutbox.set(event.id, event);
  }
  return { deliveredCount, suppressedDuplicatesCount };
}

export function replayOutboxAndDeadLetterEvents(params: {
  tenantId?: string;
  includeDeadLetterId?: string;
}): {
  replayedOutboxCount: number;
  replayedDlqCount: number;
  duplicatesSafelySuppressed: number;
  financialExecutionsDuplicated: number;
} {
  let replayedOutboxCount = 0;
  let replayedDlqCount = 0;
  let duplicatesSafelySuppressed = 0;

  if (brokerSimulatedOutage) {
    setBrokerSimulatedOutage(false);
  }

  // Re-deliver pending or acknowledged outbox events for replay safety verification
  const outboxList = Array.from(db.distributedEventOutbox.values())
    .filter((o) => (!params.tenantId || o.tenantId === params.tenantId) && o.deliveryStatus !== 'DEAD_LETTER')
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  outboxList.forEach((ev) => {
    const res = deliverOutboxEventToSubscribers(ev);
    replayedOutboxCount++;
    duplicatesSafelySuppressed += res.suppressedDuplicatesCount;
  });

  if (params.includeDeadLetterId) {
    const dlq = db.distributedDeadLetterEvents.get(params.includeDeadLetterId);
    if (dlq && dlq.status === 'QUARANTINED') {
      const ev = db.distributedEventOutbox.get(dlq.outboxEventId);
      if (ev) {
        ev.deliveryStatus = 'PUBLISHED';
        db.distributedEventOutbox.set(ev.id, ev);
        deliverOutboxEventToSubscribers(ev);
        dlq.status = 'REPLAYED';
        dlq.replayedAt = new Date().toISOString();
        db.distributedDeadLetterEvents.set(dlq.id, dlq);
        replayedDlqCount++;
      }
    }
  }

  db.scheduleSave();
  return {
    replayedOutboxCount,
    replayedDlqCount,
    duplicatesSafelySuppressed,
    financialExecutionsDuplicated: 0,
  };
}

export function registerConsumerGroup(params: {
  consumerGroup: string;
  subscribedEventTypes: string[];
  tenantScope?: string;
  jurisdictionScope?: string;
}): DistributedEventConsumer {
  const existing = Array.from(db.distributedEventConsumers.values()).find(
    (c) => c.consumerGroup === params.consumerGroup
  );
  if (existing) return existing;

  const consumer: DistributedEventConsumer = {
    id: `CON-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
    consumerGroup: params.consumerGroup,
    subscribedEventTypes: params.subscribedEventTypes,
    tenantScope: params.tenantScope || 'ALL',
    jurisdictionScope: params.jurisdictionScope || 'ALL',
    deliverySemantics: 'AT_LEAST_ONCE_IDEMPOTENT',
    status: brokerSimulatedOutage ? 'DEGRADED' : 'ACTIVE',
    ackCount: 0,
    duplicateSuppressedCount: 0,
    lagEvents: 0,
    lastHeartbeatAt: new Date().toISOString(),
  };
  db.distributedEventConsumers.set(consumer.id, consumer);
  db.scheduleSave();
  return consumer;
}
