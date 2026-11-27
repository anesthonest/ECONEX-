/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 — Universal Execution Hub & 18-Section Entity Workspace
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'EXECUTION' | 'WORKSPACE';
}

const STAGES = [
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
] as const;

export const V28ExecutionWorkspaceView: React.FC<Props> = ({ onNavigate, initialSubTab = 'EXECUTION' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'EXECUTION' | 'WORKSPACE'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  const [title, setTitle] = useState('');
  const [sectorId, setSectorId] = useState('AGRICULTURE');
  const [valueMinor, setValueMinor] = useState('4500000');
  const [counterpartyOrgId, setCounterpartyOrgId] = useState('org_buyer_01');
  const [destCountry, setDestCountry] = useState('KE');

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
      const [wsRes, wfRes, rdRes] = await Promise.all([
        ApiClient.v28GetWorkspace(actor),
        ApiClient.v28GetExecutions({ status: statusFilter, stage: stageFilter }, actor),
        ApiClient.v28GetReadinessMatrix(),
      ]);
      setWorkspace(wsRes);
      setWorkflows(Array.isArray(wfRes?.workflows) ? wfRes.workflows : []);
      setReadiness(rdRes);
    } catch (err: any) {
      setError(err?.message || 'Unable to load V28 Execution Workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId, statusFilter, stageFilter]);

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v28CreateExecution(
        {
          title: title.trim() || 'Cross-Corridor Supply Execution',
          sectorId,
          valueMinor: Number(valueMinor || 0),
          counterpartyOrgId,
          countryCode: activeCountry,
          destinationCountryCode: destCountry,
          currency: 'UGX',
          requiredEvidence: ['CONTRACT_ACK'],
          requiresHumanApproval: true,
        },
        actor
      );
      setFeedback(`Created execution workflow ${created.workflowRef} at ${created.stage}/${created.status}.`);
      setTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create execution workflow.');
    }
  };

  const handleTransition = async (wf: any, toStatus: string, toStage?: string, humanApprove?: boolean) => {
    setError(null);
    setFeedback(null);
    try {
      const updated = await ApiClient.v28TransitionExecution(
        wf.id,
        {
          toStatus,
          toStage: toStage || wf.stage,
          evidenceRefs: ['CONTRACT_ACK'],
          humanApprove,
          notes: `Operator transition to ${toStatus}`,
        },
        actor
      );
      setFeedback(`Transitioned ${updated.workflowRef} -> ${updated.stage} (${updated.status}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Workflow state transition rejected by backend invariant.');
    }
  };

  const counts = workspace?.counts || {};
  const sections: string[] = Array.isArray(workspace?.sections) ? workspace.sections : [];

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">
              ECONEX V28.0 · Schema 26 Execution Infrastructure
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1 flex items-center gap-2">
              <Workflow className="text-[#D4AF37]" size={24} />
              Universal Execution Hub &amp; Entity Workspace
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1">
              Coordinated 11-stage commercial execution state machine and 18-section operational workspace with human approval checkpoints and truthful pre-production status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('EXECUTION')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                tab === 'EXECUTION' ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#181818] text-[#C0C0C0] border border-[#27272a]'
              }`}
            >
              Execution Pipeline
            </button>
            <button
              type="button"
              onClick={() => setTab('WORKSPACE')}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                tab === 'WORKSPACE' ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#181818] text-[#C0C0C0] border border-[#27272a]'
              }`}
            >
              18-Section Workspace
            </button>
            <button
              type="button"
              onClick={loadData}
              className="min-h-[40px] px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] font-mono text-[#A0A0A0]">WORKFLOWS</div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] tabular-nums">{counts.executionWorkflows ?? 0}</div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] font-mono text-[#A0A0A0]">ACTIVE CONTRACTS</div>
            <div className="text-xl font-mono font-bold text-[#D4AF37] tabular-nums">{counts.activeContracts ?? 0}</div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] font-mono text-[#A0A0A0]">REQUISITIONS</div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] tabular-nums">{counts.procurementRequisitions ?? 0}</div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] font-mono text-[#A0A0A0]">FULFILMENTS</div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] tabular-nums">{counts.fulfilmentPlans ?? 0}</div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] font-mono text-[#A0A0A0]">VAULT RECORDS</div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] tabular-nums">{counts.vaultDocuments ?? 0}</div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] font-mono text-[#A0A0A0]">PROD DEPLOYED</div>
            <div className="text-xl font-mono font-bold text-amber-400">
              {String(readiness?.flags?.PRODUCTION_DEPLOYED ?? false).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-xs text-red-200">
          {error}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-4 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {tab === 'EXECUTION' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateWorkflow} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Plus size={16} className="text-[#D4AF37]" /> Initiate Execution Workflow
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Workflow Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Robusta Lot 12 Export Execution"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Sector</label>
                  <select
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                  >
                    <option value="AGRICULTURE">AGRICULTURE</option>
                    <option value="MANUFACTURING">MANUFACTURING</option>
                    <option value="LOGISTICS_TRANSPORT">LOGISTICS_TRANSPORT</option>
                    <option value="ENERGY">ENERGY</option>
                    <option value="RETAIL_WHOLESALE">RETAIL_WHOLESALE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Destination Country</label>
                  <select
                    value={destCountry}
                    onChange={(e) => setDestCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                  >
                    <option value="KE">KE (Kenya)</option>
                    <option value="TZ">TZ (Tanzania)</option>
                    <option value="RW">RW (Rwanda)</option>
                    <option value="UG">UG (Uganda)</option>
                    <option value="CD">CD (DR Congo)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Value (Minor Units)</label>
                  <input
                    type="number"
                    min={1}
                    value={valueMinor}
                    onChange={(e) => setValueMinor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Counterparty Org</label>
                  <input
                    value={counterpartyOrgId}
                    onChange={(e) => setCounterpartyOrgId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full min-h-[42px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
            >
              Create Execution Workflow
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5]">
                Active Execution State Machine Instances
              </h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                >
                  <option value="ALL">All Stages</option>
                  {STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="FULFILLED">FULFILLED</option>
                  <option value="RECONCILED">RECONCILED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-xs text-[#A0A0A0] py-8 text-center">Loading execution workflows...</div>
            ) : workflows.length === 0 ? (
              <div className="text-xs text-[#A0A0A0] py-8 text-center border border-dashed border-[#27272a] rounded-lg">
                No execution workflows match the current filter.
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((wf) => (
                  <div key={wf.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-[#D4AF37]">
                          {wf.workflowRef} · {wf.countryCode} → {wf.destinationCountryCode || wf.countryCode}
                        </div>
                        <div className="text-sm font-semibold text-[#F5F5F5]">{wf.title}</div>
                        <div className="text-xs text-[#A0A0A0] font-mono">
                          Value: {wf.valueMinor.toLocaleString()} {wf.currency} · Stage: {wf.stage} · Status: {wf.status}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {wf.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleTransition(wf, 'SUBMITTED', 'VERIFY')}
                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Submit for Verify
                          </button>
                        )}
                        {wf.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            onClick={() => handleTransition(wf, 'VERIFIED', 'AUTHORISE')}
                            className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#D4AF37] text-[#D4AF37] text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Verify Evidence
                          </button>
                        )}
                        {wf.status === 'VERIFIED' && (
                          <button
                            type="button"
                            onClick={() => handleTransition(wf, 'APPROVED', 'AUTHORISE', true)}
                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Human Approve
                          </button>
                        )}
                        {wf.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleTransition(wf, 'IN_PROGRESS', 'EXECUTE')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            Start Execute
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-[#F5F5F5] flex items-center gap-2">
                <Building2 className="text-[#D4AF37]" size={18} />
                18-Section Universal Entity Workspace ({workspace?.actor?.organisationName || activeWorkspaceId})
              </h2>
              <p className="text-xs text-[#A0A0A0] mt-1">
                Active Actor: {workspace?.actor?.name} · Role: {workspace?.actor?.role} · Tenant: {workspace?.actor?.tenantId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('v28-contracts')}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              Contracts &amp; Procurement <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sections.map((sec, idx) => (
              <div key={sec} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-[#D4AF37]">SECTION {String(idx + 1).padStart(2, '0')}</div>
                  <div className="text-xs font-semibold text-[#F5F5F5] mt-0.5">{sec.replace(/_/g, ' ')}</div>
                </div>
                <Layers size={15} className="text-[#A0A0A0]" />
              </div>
            ))}
          </div>

          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 text-xs text-[#A0A0A0] flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#D4AF37] shrink-0" />
            <span>{workspace?.attribution || 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
