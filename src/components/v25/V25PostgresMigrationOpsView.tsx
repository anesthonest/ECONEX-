/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V25.0 — PostgreSQL 16 Migration Workbench, Immutable Ledger State Machine,
 * Outbox/DLQ Replay & Background Jobs Operations
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V25AuditTrailRecord,
  V25BackgroundJob,
  V25ConcurrencyProofRun,
  V25DeadLetterRecord,
  V25LedgerTransactionRecord,
  V25OutboxEvent,
  V25PostgresMigrationRun,
  V25RegulatoryLimitRule,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V25PostgresMigrationOpsView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role, tenantId: 'TENANT-UG', organisationId: 'ORG-V25-UG-PRODUCE' };

  const [loading, setLoading] = useState(true);
  const [pgStatus, setPgStatus] = useState<any>(null);
  const [activeRun, setActiveRun] = useState<V25PostgresMigrationRun | null>(null);
  const [interruptedRunId, setInterruptedRunId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<V25LedgerTransactionRecord[]>([]);
  const [limits, setLimits] = useState<V25RegulatoryLimitRule[]>([]);
  const [proofs, setProofs] = useState<V25ConcurrencyProofRun[]>([]);
  const [outboxEvents, setOutboxEvents] = useState<V25OutboxEvent[]>([]);
  const [deadLetters, setDeadLetters] = useState<V25DeadLetterRecord[]>([]);
  const [auditTrail, setAuditTrail] = useState<V25AuditTrailRecord[]>([]);
  const [jobs, setJobs] = useState<V25BackgroundJob[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Ledger Tx initiation form
  const [fromEuwn, setFromEuwn] = useState('EX-3H8N6V2X9C4T');
  const [toEuwn, setToEuwn] = useState('EX-9D5F3G7J2L6B');
  const [amountMinor, setAmountMinor] = useState(500_000_00);
  const [forceDualApproval, setForceDualApproval] = useState(true);
  const [jobLockKey, setJobLockKey] = useState(`JOBLOCK-OPS-${Date.now().toString(36).toUpperCase()}`);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pg, ltx, ob, jb] = await Promise.all([
        ApiClient.v25GetPostgresStatus(actor),
        ApiClient.v25GetLedgerTransactions(actor),
        ApiClient.v25GetOutboxAndAudit(actor),
        ApiClient.v25GetJobs(actor),
      ]);
      setPgStatus(pg);
      if (pg?.latestRun && !activeRun) setActiveRun(pg.latestRun);
      setTransactions(ltx.transactions || []);
      setLimits(ltx.regulatoryLimits || []);
      setProofs(ltx.concurrencyProofs || []);
      setOutboxEvents(ob.events || []);
      setDeadLetters(ob.deadLetters || []);
      setAuditTrail(ob.auditTrail || []);
      setJobs(jb.jobs || []);
    } catch (e: any) {
      setStatusMsg(e?.message || 'Failed to load PostgreSQL & ledger telemetry');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRunDryMigration = async () => {
    setBusy('pg-dry');
    try {
      const run: V25PostgresMigrationRun = await ApiClient.v25RunPostgresMigration({ attemptLivePg: false }, actor);
      setActiveRun(run);
      setInterruptedRunId(null);
      setStatusMsg(
        `20-stage rehearsal ${run.status}: ${run.totalRecordsAudited} records audited across ${run.stages.length} stages (0-variance=${run.zeroVarianceVerified}).`
      );
      await loadAll();
    } catch (e: any) {
      setStatusMsg(e?.message || 'Migration rehearsal failed');
    } finally {
      setBusy(null);
    }
  };

  const handleSimulateInterrupt = async () => {
    setBusy('pg-int');
    try {
      const run: V25PostgresMigrationRun = await ApiClient.v25RunPostgresMigration(
        { simulateInterruptAtStage: 10, attemptLivePg: false },
        actor
      );
      setActiveRun(run);
      setInterruptedRunId(run.id);
      setStatusMsg(`Simulated outage at Stage 10 for run ${run.id}. Click "Resume Interrupted Run" to verify idempotent recovery.`);
      await loadAll();
    } catch (e: any) {
      setStatusMsg(e?.message || 'Interrupt simulation failed');
    } finally {
      setBusy(null);
    }
  };

  const handleResumeMigration = async () => {
    if (!interruptedRunId) return;
    setBusy('pg-res');
    try {
      const run: V25PostgresMigrationRun = await ApiClient.v25RunPostgresMigration(
        { resumeFromRunId: interruptedRunId, attemptLivePg: false },
        actor
      );
      setActiveRun(run);
      setInterruptedRunId(null);
      setStatusMsg(`Resumed run ${run.id} -> status=${run.status} (zeroVariance=${run.zeroVarianceVerified}).`);
      await loadAll();
    } catch (e: any) {
      setStatusMsg(e?.message || 'Resume failed');
    } finally {
      setBusy(null);
    }
  };

  const handleInitiateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('tx-init');
    try {
      const tx = await ApiClient.v25InitiateLedgerTransaction(
        {
          organisationId: 'ORG-V25-UG-PRODUCE',
          countryCode: 'UG',
          fromEuwn,
          toEuwn,
          amountMinor: Number(amountMinor),
          currency: 'UGX',
          forceDualApproval,
          autoPost: !forceDualApproval,
        },
        actor
      );
      setStatusMsg(`Initiated ledger tx ${tx.id} in state ${tx.state} (dualApproval=${tx.requiresDualApproval}).`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Ledger transaction failed');
    } finally {
      setBusy(null);
    }
  };

  const handleTransitionTx = async (txId: string, targetState: string) => {
    setBusy(`tx-${txId}`);
    try {
      const tx = await ApiClient.v25TransitionLedgerTransaction(
        txId,
        targetState,
        `Operator transition to ${targetState}`,
        actor
      );
      setStatusMsg(`Ledger tx ${tx.id} transitioned to ${tx.state}.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Transition rejected by state machine / SoD');
    } finally {
      setBusy(null);
    }
  };

  const handleRunConcurrencyProof = async () => {
    setBusy('race');
    try {
      const proof: V25ConcurrencyProofRun = await ApiClient.v25RunConcurrencyProof(
        { fromEuwn, toEuwn, currency: 'UGX', workers: 5 },
        actor
      );
      setStatusMsg(
        `Spend-Lock Race Proof ${proof.id}: ${proof.succeededCount} succeeded, ${proof.blockedCount} blocked, doubleSpendPrevented=${proof.doubleSpendPrevented}.`
      );
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Concurrency proof failed');
    } finally {
      setBusy(null);
    }
  };

  const handleDispatchOutbox = async (eventId: string, simulateFailure: boolean) => {
    setBusy(`ob-${eventId}`);
    try {
      const res = await ApiClient.v25DispatchOutboxEvent(
        eventId,
        { consumerName: 'OPS_CONSOLE_CONSUMER', simulateFailure },
        actor
      );
      setStatusMsg(`Outbox ${res.event.id} status=${res.event.status} (attempts=${res.event.attempts}).`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Outbox dispatch failed');
    } finally {
      setBusy(null);
    }
  };

  const handleReplayDlq = async (dlqId: string) => {
    setBusy(`dlq-${dlqId}`);
    try {
      const res = await ApiClient.v25ReplayDeadLetter(dlqId, actor);
      setStatusMsg(`Dead-letter ${res.dlq.id} replayed cleanly (event=${res.event.status}).`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'DLQ replay failed');
    } finally {
      setBusy(null);
    }
  };

  const handleEnqueueJob = async () => {
    setBusy('job');
    try {
      const res = await ApiClient.v25EnqueueJob(
        { jobType: 'RECONCILIATION_VERIFY', idempotencyLockKey: jobLockKey },
        actor
      );
      setStatusMsg(
        res.duplicateLocked
          ? `Idempotency lock prevented duplicate job execution (${res.job.id}).`
          : `Background job ${res.job.id} completed: ${res.job.resultSummary}`
      );
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Job execution failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37]">
            ECONEX V25.0 · SCHEMA 23 PERSISTENCE &amp; LEDGER OPERATIONS
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
            PostgreSQL 16 Migrator, Ledger State Machine &amp; Outbox Ops
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            Active Authority:{' '}
            <strong className="text-[#D4AF37] font-mono">{pgStatus?.databaseAuthority || 'LOCAL_JSON_WAL_AUTHORITATIVE'}</strong>{' '}
            · PG Configured: <strong className="text-[#F5F5F5]">{pgStatus?.pgConfigured ? 'YES' : 'NO (Sandbox Safe Mode)'}</strong>{' '}
            · DDL Tables: <strong className="text-emerald-400">{pgStatus?.ddlAudit?.expectedTablesCount ?? 38}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v25-command-centre')}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#D4AF37] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
          >
            Command Centre <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-xs text-[#F5F5F5] flex items-center justify-between gap-3">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. PostgreSQL 20-Stage Idempotent Migrator */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <Database size={16} className="text-[#D4AF37]" /> 20-Stage JSON WAL → PostgreSQL 16 Migrator &amp; Parity Reconciliation
            </h2>
            <p className="text-[11px] text-[#A0A0A0]">
              V24 Backup SHA-256:{' '}
              <span className="font-mono text-[#F5F5F5]">{pgStatus?.v24Rollback?.checksumSha256?.slice(0, 20) || '--'}...</span> · Rollback Ready:{' '}
              <strong className="text-emerald-400">{pgStatus?.v24Rollback?.v24BackupValid ? 'VERIFIED' : 'PENDING'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRunDryMigration}
              disabled={busy !== null}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play size={13} /> {busy === 'pg-dry' ? 'Running 20 Stages...' : 'Run 20-Stage Dry-Run'}
            </button>
            <button
              type="button"
              onClick={handleSimulateInterrupt}
              disabled={busy !== null}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-amber-700/60 bg-amber-950/30 text-amber-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert size={13} /> Simulate Stage-10 Interrupt
            </button>
            {interruptedRunId && (
              <button
                type="button"
                onClick={handleResumeMigration}
                disabled={busy !== null}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={13} /> Resume Interrupted Run
              </button>
            )}
          </div>
        </div>

        {activeRun && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3">
                <div className="text-[10px] text-[#A0A0A0]">Run Status</div>
                <div className={`font-mono font-bold mt-0.5 ${activeRun.status === 'FAILED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {activeRun.status}
                </div>
              </div>
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3">
                <div className="text-[10px] text-[#A0A0A0]">Authority</div>
                <div className="font-mono font-bold text-[#F5F5F5] mt-0.5 truncate">{activeRun.activeAuthorityAfterRun}</div>
              </div>
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3">
                <div className="text-[10px] text-[#A0A0A0]">Records Audited</div>
                <div className="font-mono font-bold text-[#D4AF37] mt-0.5">{activeRun.totalRecordsAudited}</div>
              </div>
              <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3">
                <div className="text-[10px] text-[#A0A0A0]">0-Variance Parity</div>
                <div className="font-mono font-bold text-emerald-400 mt-0.5">
                  {activeRun.zeroVarianceVerified ? '0 VARIANCE VERIFIED' : 'VARIANCE DETECTED'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
              {activeRun.stages.map((s) => (
                <div key={s.stageNumber} className="bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#D4AF37]">#{s.stageNumber} {s.stageCode}</span>
                    <span className={`font-mono text-[10px] ${s.status === 'COMPLETED' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="text-[#A0A0A0] line-clamp-1">{s.description}</div>
                  <div className="text-[10px] font-mono text-[#71717a]">
                    rows={s.recordsProcessed} · {s.durationMs}ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Immutable Ledger State Machine & Concurrency Spend-Lock Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <Lock size={16} className="text-[#D4AF37]" /> Immutable Ledger State Machine &amp; Dual Approval
            </h2>
            <button
              type="button"
              onClick={handleRunConcurrencyProof}
              disabled={busy !== null}
              className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/50 text-[#D4AF37] text-[11px] font-semibold cursor-pointer hover:bg-[#D4AF37]/10"
            >
              {busy === 'race' ? 'Testing...' : 'Run 5-Worker Race Proof'}
            </button>
          </div>

          <form onSubmit={handleInitiateTx} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <input
              value={fromEuwn}
              onChange={(e) => setFromEuwn(e.target.value)}
              placeholder="Source EUWN"
              className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5] font-mono"
            />
            <input
              value={toEuwn}
              onChange={(e) => setToEuwn(e.target.value)}
              placeholder="Target EUWN"
              className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5] font-mono"
            />
            <input
              type="number"
              value={amountMinor}
              onChange={(e) => setAmountMinor(Number(e.target.value))}
              placeholder="Amount Minor (UGX)"
              className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5] font-mono"
            />
            <label className="flex items-center gap-2 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#A0A0A0]">
              <input
                type="checkbox"
                checked={forceDualApproval}
                onChange={(e) => setForceDualApproval(e.target.checked)}
              />
              Require Dual Approval
            </label>
            <button
              type="submit"
              disabled={busy !== null}
              className="sm:col-span-2 min-h-[38px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Initiate Sandbox Ledger Transaction
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {transactions.slice(-6).reverse().map((tx) => (
              <div key={tx.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#D4AF37] font-semibold">{tx.id}</span>
                  <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] font-mono text-[10px] text-[#F5F5F5]">
                    {tx.state}
                  </span>
                </div>
                <div className="text-[11px] text-[#A0A0A0] font-mono">
                  {tx.fromEuwn} → {tx.toEuwn} · {(tx.amountMinor / 100).toLocaleString()} {tx.currency}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tx.state === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleTransitionTx(tx.id, 'APPROVED')}
                      className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                  {tx.state === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => handleTransitionTx(tx.id, 'POSTED')}
                      className="px-2.5 py-1 rounded bg-[#D4AF37] text-black font-semibold text-[10px] cursor-pointer"
                    >
                      Post to Ledger
                    </button>
                  )}
                  {tx.state === 'POSTED' && (
                    <button
                      type="button"
                      onClick={() => handleTransitionTx(tx.id, 'REVERSED')}
                      className="px-2.5 py-1 rounded bg-red-950 border border-red-800 text-red-300 text-[10px] cursor-pointer"
                    >
                      Reverse
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {proofs.length > 0 && (
            <div className="bg-[#09090b] border border-emerald-900/60 rounded-xl p-3 text-[11px] space-y-1">
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Latest Spend-Lock Proof ({proofs[proofs.length - 1].id})
              </div>
              <div className="text-[#A0A0A0] font-mono">
                workers={proofs[proofs.length - 1].attemptedWorkers} · succeeded={proofs[proofs.length - 1].succeededCount} · blocked=
                {proofs[proofs.length - 1].blockedCount} · prevented={String(proofs[proofs.length - 1].doubleSpendPrevented)}
              </div>
            </div>
          )}
        </div>

        {/* 3. Transactional Outbox, Dead-Letter Queue & Background Jobs */}
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <Activity size={16} className="text-[#D4AF37]" /> Transactional Outbox, DLQ &amp; Background Jobs
            </h2>
            <span className="text-[11px] font-mono text-[#A0A0A0]">
              Audit Chain: {auditTrail.length} entries · Limits: {limits.length}
            </span>
          </div>

          <div className="flex gap-2 text-xs">
            <input
              value={jobLockKey}
              onChange={(e) => setJobLockKey(e.target.value)}
              className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5] font-mono"
            />
            <button
              type="button"
              onClick={handleEnqueueJob}
              disabled={busy !== null}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu size={13} /> Run Idempotent Job
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {outboxEvents.slice(-5).reverse().map((ev) => (
              <div key={ev.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-[#F5F5F5] truncate">{ev.eventType}</div>
                  <div className="text-[10px] font-mono text-[#A0A0A0]">
                    {ev.id} · status={ev.status} · attempts={ev.attempts}/{ev.maxAttempts}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDispatchOutbox(ev.id, false)}
                    className="px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] cursor-pointer"
                  >
                    Consume
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispatchOutbox(ev.id, true)}
                    className="px-2 py-1 rounded bg-red-950 border border-red-800 text-red-300 text-[10px] cursor-pointer"
                  >
                    Fail
                  </button>
                </div>
              </div>
            ))}
          </div>

          {deadLetters.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-amber-300">Dead-Letter Queue ({deadLetters.length})</div>
              {deadLetters.slice(-3).map((d) => (
                <div key={d.id} className="bg-[#09090b] border border-amber-900/60 rounded-lg p-2.5 text-[11px] flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[#F5F5F5]">{d.id}</span> · {d.eventType} ({d.replayed ? 'REPLAYED' : 'OPEN'})
                  </div>
                  {!d.replayed && (
                    <button
                      type="button"
                      onClick={() => handleReplayDlq(d.id)}
                      className="px-2.5 py-1 rounded bg-amber-500 text-black font-semibold text-[10px] cursor-pointer"
                    >
                      Replay
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-[#A0A0A0]">Recent Background Jobs ({jobs.length})</div>
            {jobs.slice(-3).reverse().map((j) => (
              <div key={j.id} className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[11px] flex items-center justify-between">
                <span className="font-mono text-[#F5F5F5]">{j.jobType}</span>
                <span className="font-mono text-emerald-400">{j.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
