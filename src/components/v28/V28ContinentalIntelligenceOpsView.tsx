/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 — Continental Intelligence, Guarded AI Orchestrator, Control Centre & Dual-Approval SoD
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  Lock,
  RefreshCw,
  Server,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'INTELLIGENCE' | 'AI' | 'CONTROL_CENTRE' | 'DUAL_APPROVALS';
}

export const V28ContinentalIntelligenceOpsView: React.FC<Props> = ({ initialSubTab = 'INTELLIGENCE' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'INTELLIGENCE' | 'AI' | 'CONTROL_CENTRE' | 'DUAL_APPROVALS'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [intel, setIntel] = useState<any>(null);
  const [aiRuns, setAiRuns] = useState<any[]>([]);
  const [ctrl, setCtrl] = useState<any>(null);

  // Forms
  const [aiTask, setAiTask] = useState('COMMERCIAL_PLANNING');
  const [aiPrompt, setAiPrompt] = useState('Summarise cross-border Kampala to Nairobi maize supply workflow risks.');
  const [dualTarget, setDualTarget] = useState('V28-CONN-MTN-UG');
  const [dualReason, setDualReason] = useState('Approve sandbox gateway audit state transition');

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  useEffect(() => {
    setTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [iRes, rRes, cRes] = await Promise.all([
        ApiClient.v28GetContinentalIntelligence(actor),
        ApiClient.v28GetAiRuns(actor).catch(() => ({ runs: [] })),
        ApiClient.v28GetControlCentre(actor).catch(() => null),
      ]);
      setIntel(iRes);
      setAiRuns(Array.isArray(rRes?.runs) ? rRes.runs : []);
      setCtrl(cRes);
    } catch (err: any) {
      setError(err?.message || 'Unable to load Continental Intelligence workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId]);

  const handleRunAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const run = await ApiClient.v28RunAiOrchestration({ taskType: aiTask, prompt: aiPrompt }, actor);
      setFeedback(`Guarded advisory run ${run.id} completed (humanApprovalRequired: true).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'AI request blocked by prompt-injection or autonomy guardrail.');
    }
  };

  const handleCreateDual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const reqItem = await ApiClient.v28CreateDualApproval(
        { actionType: 'PROMOTE_CONNECTOR_ACTIVE', targetEntityId: dualTarget, reason: dualReason },
        actor
      );
      setFeedback(`Created dual-approval request ${reqItem.id} -> ${reqItem.status}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Dual approval request requires Platform Admin.');
    }
  };

  const handleDecideDual = async (reqId: string, decision: 'APPROVE' | 'REJECT') => {
    setError(null);
    setFeedback(null);
    try {
      const out = await ApiClient.v28DecideDualApproval(reqId, decision, actor);
      setFeedback(`Dual approval ${out.id} updated -> ${out.status}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Dual-approval SoD rule blocked self-approval.');
    }
  };

  const handleResolveException = async (exId: string) => {
    setError(null);
    setFeedback(null);
    try {
      const ex = await ApiClient.v28ResolveException(exId, { status: 'RESOLVED', resolutionNote: 'Triage completed via Ops Centre' }, actor);
      setFeedback(`Exception ${ex.id} marked ${ex.status}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Exception resolution failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D4AF37]">CONTINENTAL INTELLIGENCE, GUARDED AI &amp; OPS CONTROL CENTRE</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1 flex items-center gap-2">
              <TrendingUp className="text-[#D4AF37]" size={24} />
              Continental Intelligence &amp; Governance Ops
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              6-category source provenance with k-anonymity threshold ({intel?.kAnonymityThreshold ?? 3}), human-checkpointed AI orchestration, and Dual-Approval SoD desk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['INTELLIGENCE', 'AI', 'CONTROL_CENTRE', 'DUAL_APPROVALS'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#181818] text-[#C0C0C0] border border-[#27272a]'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
            <button
              type="button"
              onClick={loadData}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-xs text-red-200">{error}</div>}
      {feedback && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-4 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {tab === 'INTELLIGENCE' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-xs text-[#A0A0A0]">Loading indicators...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(intel?.indicators || []).map((ind: any) => (
                  <div key={ind.key} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-1">
                    <div className="text-[11px] font-mono text-[#D4AF37]">{ind.provenance}</div>
                    <div className="text-xs text-[#A0A0A0]">{ind.label}</div>
                    <div className="text-lg font-mono font-bold text-[#F5F5F5]">{String(ind.value)}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
                <h2 className="text-sm font-display font-bold text-[#F5F5F5]">
                  Country Benchmarks (k-Anonymity Threshold &gt;= {intel?.kAnonymityThreshold ?? 3})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(intel?.publicCountryBenchmarks || []).map((b: any) => (
                    <div key={b.countryCode} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 font-mono">
                      <div className="text-[#D4AF37]">{b.countryCode}</div>
                      <div className="text-[#F5F5F5]">
                        {b.privacySuppressed ? 'SUPPRESSED (<k)' : `${b.participantCount} participants`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'AI' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <form onSubmit={handleRunAi} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <BrainCircuit size={16} className="text-[#D4AF37]" /> Guarded AI Orchestrator
            </h2>
            <select
              value={aiTask}
              onChange={(e) => setAiTask(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
            >
              <option value="COMMERCIAL_PLANNING">COMMERCIAL_PLANNING</option>
              <option value="WORKFLOW_RISK">WORKFLOW_RISK</option>
              <option value="PROCUREMENT_BRIEF">PROCUREMENT_BRIEF</option>
              <option value="DISRUPTION_SCENARIO">DISRUPTION_SCENARIO</option>
            </select>
            <textarea
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
            />
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Run Guarded Advisory
            </button>
            <div className="text-[11px] text-[#A0A0A0] flex items-start gap-1.5">
              <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
              Prompt injection and autonomous value transfer directives are automatically blocked.
            </div>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Guarded Orchestration Runs ({aiRuns.length})</h2>
            {aiRuns.map((r) => (
              <div key={r.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-2">
                <div className="font-mono text-[#D4AF37]">{r.id} · {r.taskType} · humanApprovalRequired={String(r.humanApprovalRequired)}</div>
                <div className="text-[#F5F5F5]">{r.responseSummary}</div>
                <div className="text-[11px] text-[#A0A0A0]">{r.aiGeneratedNotice}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tab === 'CONTROL_CENTRE' || tab === 'DUAL_APPROVALS') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <form onSubmit={handleCreateDual} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Lock size={16} className="text-[#D4AF37]" /> Dual-Approval SoD Desk
            </h2>
            <input
              value={dualTarget}
              onChange={(e) => setDualTarget(e.target.value)}
              placeholder="Target Entity ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <input
              value={dualReason}
              onChange={(e) => setDualReason(e.target.value)}
              placeholder="Governance justification"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
            />
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Create Dual-Approval Request
            </button>
          </form>

          <div className="lg:col-span-2 space-y-4">
            {!ctrl ? (
              <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 text-[#A0A0A0]">
                Control Centre metrics require PLATFORM_ADMIN role.
              </div>
            ) : (
              <>
                <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
                    <Server size={16} className="text-[#D4AF37]" /> Dual-Approval Requests ({ctrl.dualApprovals?.length || 0})
                  </h2>
                  {(ctrl.dualApprovals || []).map((d: any) => (
                    <div key={d.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-mono text-[#D4AF37]">{d.id} · {d.actionType} · {d.status}</div>
                        <div className="text-[#C0C0C0]">Requester: {d.requestedByUserId} · Target: {d.targetEntityId}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecideDual(d.id, 'APPROVE')}
                          className="px-3 py-1 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecideDual(d.id, 'REJECT')}
                          className="px-3 py-1 rounded-lg bg-[#181818] border border-[#27272a] text-[#C0C0C0] cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Operational Exceptions ({ctrl.exceptions?.length || 0})</h2>
                  {(ctrl.exceptions || []).map((ex: any) => (
                    <div key={ex.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 flex justify-between items-center gap-2">
                      <div>
                        <div className="font-mono text-[#D4AF37]">{ex.id} · {ex.severity} · {ex.status}</div>
                        <div className="text-[#F5F5F5]">{ex.summary}</div>
                      </div>
                      {ex.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleResolveException(ex.id)}
                          className="px-3 py-1 rounded-lg bg-[#181818] border border-[#D4AF37] text-[#D4AF37] font-semibold cursor-pointer whitespace-nowrap"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
