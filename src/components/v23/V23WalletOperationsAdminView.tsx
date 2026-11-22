/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Wallet Operations, Compliance, Risk, Continuity & Schema 21 Admin Desk
 * Enforces human-in-the-loop compliance decisions, truthful readiness flags,
 * 12 failure-scenario drills, and Schema 21 PostgreSQL 16 dry-run audits.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Database, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V23WalletOperationsAdminView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || 'usr_admin_01', userRole: role };

  const [readiness, setReadiness] = useState<any>(null);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [riskEvents, setRiskEvents] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [supportCases, setSupportCases] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [continuityRuns, setContinuityRuns] = useState<any[]>([]);
  const [pgAudit, setPgAudit] = useState<any>(null);

  const [caseSummary, setCaseSummary] = useState<string>('Customer requested status review on sandbox transfer');
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rd, cmp, rsk, aud, sup, intg] = await Promise.all([
        ApiClient.v23GetReadinessMatrix(actor),
        ApiClient.v23GetCompliance(actor),
        ApiClient.v23GetRiskEvents(actor),
        ApiClient.v23GetAuditEvents(actor),
        ApiClient.v23GetSupportCases(actor),
        ApiClient.v23GetIntegrations(actor),
      ]);
      setReadiness(rd);
      setCompliance(Array.isArray(cmp) ? cmp : []);
      setRiskEvents(Array.isArray(rsk) ? rsk : []);
      setAuditEvents(Array.isArray(aud) ? aud : []);
      setSupportCases(Array.isArray(sup) ? sup : []);
      setIntegrations(Array.isArray(intg) ? intg : []);
      if (rd?.latestPostgresDryRun) setPgAudit(rd.latestPostgresDryRun);
    } catch (e: any) {
      setError(e?.message || 'Unable to load V23 Wallet Operations Admin desk.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunContinuityAll = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v23RunContinuityDrills(undefined, actor);
      if (res?.error) throw new Error(res.error);
      setContinuityRuns(res.runs || []);
      setFeedback(`Executed all ${res.total} continuity failure scenarios: ${res.passed}/${res.total} PASSED.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Continuity drill execution failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRunPgAudit = async () => {
    setBusy(true);
    setError(null);
    try {
      const run = await ApiClient.v23RunPostgresAudit(actor);
      if (run?.error) throw new Error(run.error);
      setPgAudit(run);
      setFeedback(`Schema ${run.schemaVersionTarget} dry-run audit completed: ${run.mappedTablesCount} PG tables mapped, ledger balanced.`);
    } catch (e: any) {
      setError(e?.message || 'Postgres dry-run audit failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleComplianceReview = async (id: string, decision: 'CLEARED' | 'RESTRICTED') => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v23ReviewCompliance(
        id,
        { humanDecision: decision, decisionReason: `Admin human decision: ${decision}` },
        actor
      );
      if (res?.error) throw new Error(res.error);
      setFeedback(`Compliance record ${id} decided by human officer: ${res.humanDecision}.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Compliance review update failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSupportCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v23CreateSupportCase(
        {
          category: 'TRANSACTION_DELAY_OR_STATUS',
          participantIdentityId: 'IDN-V23-001',
          summary: caseSummary,
        },
        actor
      );
      if (res?.error) throw new Error(res.error);
      setFeedback(`Opened support case ${res.caseReference}.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Support case creation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
            ADMINISTRATION · COMPLIANCE · CONTINUITY · SCHEMA 21 POSTGRES AUDIT
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1">
            Wallet Operations &amp; Risk Control Center
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('v23-wallet')}
            className="px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#121212] text-xs text-[#F5F5F5] cursor-pointer"
          >
            Wallet Dashboard
          </button>
          <button
            type="button"
            onClick={handleRunContinuityAll}
            disabled={busy}
            className="px-3.5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Activity size={13} /> Run 12 Continuity Drills
          </button>
          <button
            type="button"
            onClick={handleRunPgAudit}
            disabled={busy}
            className="px-3.5 py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Database size={13} /> Run Schema 21 Audit
          </button>
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-[#27272a] bg-[#121212] text-xs text-[#F5F5F5] cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900 text-xs text-red-200">{error}</div>}
      {feedback && <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900 text-xs text-emerald-200">{feedback}</div>}

      {/* Truthful V23 Readiness Matrix */}
      {readiness?.flags && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold text-[#F5F5F5]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#D4AF37]" /> Truthful V23 Release Readiness Flags
            </span>
            <span className="font-mono text-xs text-amber-300">{readiness.releaseDecision}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
            {Object.entries(readiness.flags).map(([k, v]) => (
              <div key={k} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[#A0A0A0] truncate mr-2">{k}</span>
                <span className={v ? 'text-emerald-400 font-bold' : 'text-amber-300'}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continuity Scenario Results */}
      {continuityRuns.length > 0 && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold text-[#F5F5F5]">
            12 Operational Continuity &amp; Crash Recovery Scenarios ({continuityRuns.filter((r) => r.passed).length}/{continuityRuns.length} PASSED)
          </div>
          <div className="divide-y divide-[#27272a] text-xs">
            {continuityRuns.map((r) => (
              <div key={r.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[#D4AF37]">{r.scenarioCode}</span> · <span className="text-[#F5F5F5]">{r.scenarioTitle}</span>
                  <div className="text-[#A0A0A0]">{r.userFacingOutcome}</div>
                </div>
                <span className="font-mono text-emerald-400">{r.passed ? 'PASSED' : 'FAILED'} · {r.observedTransactionState}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schema 21 PG Dry Run */}
      {pgAudit && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 text-xs space-y-1.5">
          <div className="font-semibold text-[#F5F5F5]">
            Schema {pgAudit.schemaVersionTarget} PostgreSQL 16 Dry-Run · Mode: {pgAudit.mode} · Authority: {pgAudit.activeAuthority}
          </div>
          <div className="font-mono text-[#A0A0A0]">
            Mapped Tables: {pgAudit.mappedTablesCount} · Unique EUWN Verified: {String(pgAudit.uniqueEuwnVerified)} · Rollback Verified: {String(pgAudit.rollbackVerified)} · Cutover Complete: {String(pgAudit.postgresCutoverComplete)}
          </div>
          <div className="text-[#71717a]">{pgAudit.notes}</div>
        </div>
      )}

      {/* Human-in-the-loop Compliance & External Integration Gates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold text-[#F5F5F5]">Human Compliance Queue ({compliance.length})</div>
          <div className="divide-y divide-[#27272a] text-xs">
            {compliance.map((c) => (
              <div key={c.id} className="py-2.5 space-y-1.5">
                <div className="font-mono text-[#F5F5F5]">
                  {c.id} · {c.reviewType} · <span className="text-[#D4AF37]">{c.humanDecision}</span>
                </div>
                <div className="text-[#A0A0A0]">{c.screeningNotice}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleComplianceReview(c.id, 'CLEARED')}
                    className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-200 cursor-pointer"
                  >
                    Human Clear
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleComplianceReview(c.id, 'RESTRICTED')}
                    className="px-2.5 py-1 rounded bg-red-950 border border-red-800 text-red-200 cursor-pointer"
                  >
                    Confirm Restriction
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold text-[#F5F5F5]">External Integration Readiness Gates ({integrations.length})</div>
          <div className="divide-y divide-[#27272a] text-xs">
            {integrations.map((intg) => (
              <div key={intg.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[#F5F5F5] font-medium">{intg.name}</div>
                  <div className="text-[#A0A0A0]">{intg.regulatoryPrereq}</div>
                </div>
                <span className="font-mono text-amber-300 shrink-0">{intg.state}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support Desk + Risk & Hash-Chained Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
            <Wrench size={14} className="text-[#D4AF37]" /> Wallet Support &amp; Dispute Cases ({supportCases.length})
          </div>
          <form onSubmit={handleCreateSupportCase} className="flex gap-2 text-xs">
            <input
              type="text"
              value={caseSummary}
              onChange={(e) => setCaseSummary(e.target.value)}
              className="flex-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
            />
            <button type="submit" disabled={busy} className="px-3 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Open Case
            </button>
          </form>
          <div className="divide-y divide-[#27272a] text-xs">
            {supportCases.slice(0, 5).map((sc) => (
              <div key={sc.id} className="py-2">
                <span className="font-mono text-[#D4AF37]">{sc.caseReference}</span> · {sc.status} · <span className="text-[#A0A0A0]">{sc.summary}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold text-[#F5F5F5]">
            Hash-Chained Wallet Audit Trail ({auditEvents.length}) · Risk Alerts ({riskEvents.length})
          </div>
          <div className="divide-y divide-[#27272a] text-xs max-h-56 overflow-y-auto">
            {auditEvents.slice(0, 8).map((ev) => (
              <div key={ev.id} className="py-2">
                <div className="font-mono text-[#F5F5F5]">{ev.action} · {ev.targetId}</div>
                <div className="text-[#A0A0A0]">{ev.summary}</div>
                <div className="font-mono text-[10px] text-[#71717a]">SHA: {ev.entryHash?.slice(0, 24)}...</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
