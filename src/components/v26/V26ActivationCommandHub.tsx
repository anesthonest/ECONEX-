/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V26.0 - Activation Command Hub, Connected E2E Workflow Execution & Multi-Entity Business Onboarding
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe,
  Layers,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { EAC_ACTIVE_COUNTRIES, useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
}

const BUSINESS_TYPES = [
  { value: 'SME', label: 'Small & Medium Enterprise (SME)' },
  { value: 'COOPERATIVE', label: 'Cooperative / Farmers Union' },
  { value: 'MANUFACTURER', label: 'Manufacturer / Processor' },
  { value: 'LOGISTICS', label: 'Logistics / Freight Carrier' },
  { value: 'AGRO_DEALER', label: 'Agro-Dealer / Input Supplier' },
  { value: 'ENTERPRISE', label: 'Large Commercial Enterprise' },
  { value: 'INSTITUTION', label: 'Institution / Public Body' },
];

const SECTORS = [
  'AGRICULTURE',
  'MANUFACTURING',
  'RETAIL_WHOLESALE',
  'LOGISTICS_TRANSPORT',
  'CONSTRUCTION_MATERIALS',
  'PROFESSIONAL_SERVICES',
  'FINANCE_INSURANCE',
  'HEALTH_PHARMA',
  'ENERGY_UTILITIES',
];

export const V26ActivationCommandHub: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, setActiveCountry, activeWorkspaceId, setActiveWorkspaceId } = useExperience();

  const [activeTab, setActiveTab] = useState<'WORKFLOWS' | 'ONBOARDING' | 'WORKSPACES' | 'READINESS'>('WORKFLOWS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [homeSummary, setHomeSummary] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workspacesData, setWorkspacesData] = useState<any>(null);
  const [businessOnboardings, setBusinessOnboardings] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);

  // Start Workflow Form
  const [wfTitle, setWfTitle] = useState('Regional Arabica & Maize Supply Contract');
  const [wfQty, setWfQty] = useState(25);
  const [wfPriceMinor, setWfPriceMinor] = useState(12000);
  const [wfCurrency, setWfCurrency] = useState('UGX');
  const [startingWf, setStartingWf] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Business Onboarding Form
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('SME');
  const [bizSector, setBizSector] = useState('AGRICULTURE');
  const [bizDistrict, setBizDistrict] = useState('Kampala');
  const [bizRegNum, setBizRegNum] = useState('');
  const [submittingBiz, setSubmittingBiz] = useState(false);
  const [latestOnboardResult, setLatestOnboardResult] = useState<any>(null);

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, wfRes, wsRes, bizRes, readyRes] = await Promise.all([
        ApiClient.v26GetHomeSummary(actor).catch(() => null),
        ApiClient.v26GetCommerceWorkflows(actor).catch(() => []),
        ApiClient.v26GetWorkspaces(actor).catch(() => null),
        ApiClient.v26ListBusinessOnboardings(actor).catch(() => []),
        ApiClient.v26GetReadinessMatrix().catch(() => null),
      ]);
      setHomeSummary(summaryRes);
      setWorkflows(Array.isArray(wfRes) ? wfRes : []);
      setWorkspacesData(wsRes);
      setBusinessOnboardings(Array.isArray(bizRes) ? bizRes : []);
      setReadiness(readyRes);
    } catch (e: any) {
      setError(e?.message || 'Failed to load V26 activation command hub.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId]);

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfTitle.trim()) return;
    setStartingWf(true);
    setFeedback(null);
    setError(null);
    try {
      const created = await ApiClient.v26StartCommerceWorkflow(
        {
          title: wfTitle.trim(),
          quantity: Number(wfQty) || 10,
          unitPriceMinor: Number(wfPriceMinor) || 10000,
          currency: wfCurrency,
        },
        actor
      );
      setFeedback(`Started connected commerce lifecycle ${created.id} at stage ${created.currentStage}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Unable to start connected workflow.');
    } finally {
      setStartingWf(false);
    }
  };

  const handleAdvanceWorkflow = async (workflowId: string, advanceAll: boolean) => {
    setAdvancingId(workflowId);
    setFeedback(null);
    setError(null);
    try {
      const updated = await ApiClient.v26AdvanceCommerceWorkflow(
        workflowId,
        advanceAll ? { advanceAll: true } : {},
        actor
      );
      setFeedback(
        `Workflow ${updated.id} advanced to ${updated.currentStage}${updated.linkedRefs?.walletTxId ? ` · Obligation Ref: ${updated.linkedRefs.walletTxId}` : ''}.`
      );
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Unable to advance workflow.');
    } finally {
      setAdvancingId(null);
    }
  };

  const handleSwitchWorkspace = async (orgId: string) => {
    setFeedback(null);
    setError(null);
    try {
      const res = await ApiClient.v26SwitchWorkspace(orgId, actor);
      setActiveWorkspaceId(res.activeWorkspaceId);
      if (res.activeWorkspace?.countryCode) {
        setActiveCountry(res.activeWorkspace.countryCode, actor.userId, actor.userRole);
      }
      setFeedback(`Switched active workspace to ${res.activeWorkspace?.displayName || orgId}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Workspace switch denied.');
    }
  };

  const handleOnboardBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) return;
    setSubmittingBiz(true);
    setFeedback(null);
    setError(null);
    try {
      const idemp = `ONB-${actor.userId}-${bizName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;
      const res = await ApiClient.v26OnboardBusinessEntity(
        {
          businessName: bizName.trim(),
          businessType: bizType,
          sectorId: bizSector,
          countryCode: activeCountry,
          district: bizDistrict.trim() || 'Kampala',
          registrationNumber: bizRegNum.trim() || undefined,
          idempotencyKey: idemp,
        },
        actor
      );
      setLatestOnboardResult(res);
      if (res?.organisation?.id) setActiveWorkspaceId(res.organisation.id);
      setBizName('');
      setBizRegNum('');
      setFeedback(
        `Provisioned ${res.onboarding?.businessName} (EUWN ${res.euwn}) and routed workspace '${res.routedWorkspace}'.`
      );
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Business onboarding failed.');
    } finally {
      setSubmittingBiz(false);
    }
  };

  const flagEntries = readiness?.flags ? Object.entries(readiness.flags) : [];
  const trueCount = flagEntries.filter(([, v]) => Boolean(v)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#D4AF37]">
            ECONEX V26.0 · UNIVERSAL PLATFORM ACTIVATION · SCHEMA {readiness?.schemaVersion || 24}
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
            Connected Activation &amp; Workflow Execution Hub
          </h1>
          <p className="text-sm text-[#A0A0A0]">
            Coordinate 12-stage end-to-end commercial execution, multi-country workspaces, business onboarding, and live platform readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label className="sr-only" htmlFor="v26-country-select">Active Country</label>
          <select
            id="v26-country-select"
            value={activeCountry}
            onChange={(e) => setActiveCountry(e.target.value, actor.userId, actor.userRole)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
          >
            {EAC_ACTIVE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.currency})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Honest Boundary Notice */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#C0C0C0]">
        <div>
          <strong className="text-[#D4AF37]">Operational Environment Notice: </strong>
          {homeSummary?.honestyNotice ||
            'Internal sandbox balances and Schema 24 JSON WAL authoritative persistence active; external live banking/SMS/email rails remain unprovisioned.'}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('v26-reports')}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] cursor-pointer"
          >
            Reports &amp; Vault
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v26-audit')}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] cursor-pointer"
          >
            Control Audit &amp; Routes
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-sm text-red-200 flex items-center gap-2">
          <ShieldAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">EUWN Wallet Identity</div>
          <div className="text-sm font-mono font-bold text-[#D4AF37] tabular-nums mt-1 truncate">
            {homeSummary?.walletSummary?.euwn || 'Sandbox Pending'}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('v23-wallet')}
            className="mt-2 text-xs text-[#F5F5F5] hover:text-[#D4AF37] inline-flex items-center gap-1 cursor-pointer"
          >
            <Wallet size={13} aria-hidden="true" />
            <span>Open Wallet</span>
          </button>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Active Workflows</div>
          <div className="text-2xl font-mono font-bold text-[#F5F5F5] tabular-nums mt-1">
            {workflows.length}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">12-stage commerce lifecycle</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Verified UI Routes</div>
          <div className="text-2xl font-mono font-bold text-[#D4AF37] tabular-nums mt-1">
            {homeSummary?.counts?.routesVerified || 0}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">
            {homeSummary?.counts?.controlsAudited || 0} interactive controls audited
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Active Country &amp; Currency</div>
          <div className="text-2xl font-mono font-bold text-[#F5F5F5] tabular-nums mt-1">
            {activeCountry} · {homeSummary?.preferences?.activeCurrency || 'UGX'}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1 truncate">
            Workspace: {workspacesData?.activeWorkspace?.displayName || activeWorkspaceId}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3">
        {(
          [
            { id: 'WORKFLOWS', label: 'Connected E2E Commerce Workflows', icon: Activity },
            { id: 'ONBOARDING', label: 'Multi-Entity Business Onboarding', icon: Building2 },
            { id: 'WORKSPACES', label: 'Organisation & Country Workspaces', icon: Globe },
            { id: 'READINESS', label: `34-Flag V26 Readiness Matrix (${trueCount}/${flagEntries.length})`, icon: ShieldCheck },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Connected E2E Workflows */}
      {activeTab === 'WORKFLOWS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleStartWorkflow} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Launch Connected Commerce Pipeline</h2>
            <p className="text-xs text-[#A0A0A0]">
              Connects Discovery, Enquiry, RFQ, Quotation, Agreement, Order, ATP Inventory, Logistics Shipment, Delivery Proof, Invoice, and V23 Wallet Obligation.
            </p>
            <div>
              <label htmlFor="v26-wf-title" className="block text-xs text-[#C0C0C0] mb-1">Trade / Order Description</label>
              <input
                id="v26-wf-title"
                required
                value={wfTitle}
                onChange={(e) => setWfTitle(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="v26-wf-qty" className="block text-xs text-[#C0C0C0] mb-1">Quantity</label>
                <input
                  id="v26-wf-qty"
                  type="number"
                  min={1}
                  value={wfQty}
                  onChange={(e) => setWfQty(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="v26-wf-price" className="block text-xs text-[#C0C0C0] mb-1">Unit Minor</label>
                <input
                  id="v26-wf-price"
                  type="number"
                  min={100}
                  value={wfPriceMinor}
                  onChange={(e) => setWfPriceMinor(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="v26-wf-curr" className="block text-xs text-[#C0C0C0] mb-1">Currency</label>
                <select
                  id="v26-wf-curr"
                  value={wfCurrency}
                  onChange={(e) => setWfCurrency(e.target.value)}
                  className="w-full min-h-[44px] px-2 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {['UGX', 'KES', 'TZS', 'RWF', 'USD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={startingWf}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play size={15} aria-hidden="true" />
              <span>{startingWf ? 'Starting Pipeline...' : 'Start Connected E2E Workflow'}</span>
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#F5F5F5]">Active &amp; Completed E2E Pipelines</h2>
              <button
                type="button"
                onClick={() => onNavigate('v24-execution-hub')}
                className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open V24 Execution Hub</span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>

            {workflows.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#A0A0A0] border border-[#27272a] rounded-xl">
                No connected commerce pipelines started yet. Launch one on the left to execute all 12 stages.
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((wf) => (
                  <div key={wf.id} className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-[#D4AF37]">
                          {wf.id} · Stage {wf.completedStages?.length || 1}/12 · {wf.status}
                        </div>
                        <div className="text-sm font-semibold text-[#F5F5F5] mt-0.5">
                          {wf.linkedRefs?.title || 'Commerce Pipeline'}
                        </div>
                      </div>
                      {wf.status !== 'COMPLETED' && (
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={advancingId === wf.id}
                            onClick={() => handleAdvanceWorkflow(wf.id, false)}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#F5F5F5] cursor-pointer"
                          >
                            Advance 1 Stage
                          </button>
                          <button
                            type="button"
                            disabled={advancingId === wf.id}
                            onClick={() => handleAdvanceWorkflow(wf.id, true)}
                            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
                          >
                            Execute Remaining Stages
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-[#A0A0A0] font-mono">
                      Current Stage: <strong className="text-[#F5F5F5]">{wf.currentStage}</strong>
                      {wf.linkedRefs?.rfqId && ` · RFQ: ${wf.linkedRefs.rfqId}`}
                      {wf.linkedRefs?.orderId && ` · Order: ${wf.linkedRefs.orderId}`}
                      {wf.linkedRefs?.shipmentId && ` · Shipment: ${wf.linkedRefs.shipmentId}`}
                      {wf.linkedRefs?.invoiceId && ` · Invoice: ${wf.linkedRefs.invoiceId}`}
                      {wf.linkedRefs?.walletTxId && ` · Wallet Tx: ${wf.linkedRefs.walletTxId}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Entity Business Onboarding */}
      {activeTab === 'ONBOARDING' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleOnboardBusiness} className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Onboard Business, Cooperative or Institution</h2>
            <p className="text-xs text-[#A0A0A0]">
              Idempotently provisions a V22 business profile, V25 organisation context, V23 corporate EUWN wallet (sandbox balance), and routes you to the matching operational workspace.
            </p>
            <div>
              <label htmlFor="v26-biz-name" className="block text-xs text-[#C0C0C0] mb-1">Registered Business / Entity Name</label>
              <input
                id="v26-biz-name"
                required
                placeholder="e.g. Victoria Basin Grain Processors Ltd"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="v26-biz-type" className="block text-xs text-[#C0C0C0] mb-1">Participant Type</label>
                <select
                  id="v26-biz-type"
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>{bt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="v26-biz-sector" className="block text-xs text-[#C0C0C0] mb-1">Primary Sector</label>
                <select
                  id="v26-biz-sector"
                  value={bizSector}
                  onChange={(e) => setBizSector(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="v26-biz-dist" className="block text-xs text-[#C0C0C0] mb-1">District / City</label>
                <input
                  id="v26-biz-dist"
                  value={bizDistrict}
                  onChange={(e) => setBizDistrict(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                />
              </div>
              <div>
                <label htmlFor="v26-biz-reg" className="block text-xs text-[#C0C0C0] mb-1">Registration Number (Optional)</label>
                <input
                  id="v26-biz-reg"
                  placeholder="URSB / TIN reference"
                  value={bizRegNum}
                  onChange={(e) => setBizRegNum(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submittingBiz}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold text-sm cursor-pointer disabled:opacity-50"
            >
              {submittingBiz ? 'Provisioning Entity...' : 'Create Business & Provision Workspace'}
            </button>
          </form>

          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Provisioned Entities &amp; Routed Workspaces</h2>

            {latestOnboardResult && (
              <div className="p-4 rounded-xl bg-[#181818] border border-[#D4AF37]/60 space-y-2 text-xs">
                <div className="font-semibold text-[#D4AF37]">
                  Newly Provisioned: {latestOnboardResult.onboarding?.businessName}
                </div>
                <div className="text-[#C0C0C0]">
                  EUWN: <span className="font-mono text-[#F5F5F5]">{latestOnboardResult.euwn}</span> · Status: {latestOnboardResult.onboarding?.status}
                </div>
                <div className="text-[#A0A0A0]">{latestOnboardResult.honestyNotice}</div>
                {latestOnboardResult.routedWorkspace && (
                  <button
                    type="button"
                    onClick={() => onNavigate(latestOnboardResult.routedWorkspace)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Routed Workspace ({latestOnboardResult.routedWorkspace})</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {businessOnboardings.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#F5F5F5] truncate">{b.businessName}</div>
                    <div className="text-xs text-[#A0A0A0] font-mono truncate">
                      {b.businessType} · {b.countryCode} ({b.currency}) · {b.euwn} · {b.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(b.routedWorkspace || 'v22-businesses')}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] shrink-0 cursor-pointer"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Workspaces */}
      {activeTab === 'WORKSPACES' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Authorized Organisation &amp; Country Workspaces</h2>
            <button
              type="button"
              onClick={() => onNavigate('v25-enterprise-org')}
              className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
            >
              Manage Multi-Org Hierarchy
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(workspacesData?.availableWorkspaces || []).map((org: any) => {
              const isActive = org.id === workspacesData?.activeWorkspaceId;
              return (
                <div
                  key={org.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    isActive ? 'bg-[#181818] border-[#D4AF37]' : 'bg-[#181818] border-[#27272a]'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#F5F5F5]">{org.displayName || org.legalName}</div>
                  <div className="text-xs text-[#A0A0A0] font-mono">
                    {org.orgType} · {org.countryCode} · {org.defaultCurrency}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchWorkspace(org.id)}
                    disabled={isActive}
                    className={`w-full min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      isActive
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]'
                        : 'bg-[#121212] text-[#F5F5F5] border border-[#27272a] hover:border-[#D4AF37]'
                    }`}
                  >
                    {isActive ? 'Active Workspace' : 'Switch to Workspace'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: 34-Flag Truthful Readiness Matrix */}
      {activeTab === 'READINESS' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">
                ECONEX V26.0 Readiness Matrix (34 Mandatory Flags)
              </h2>
              <p className="text-xs text-[#A0A0A0]">
                Database Authority: <span className="font-mono text-[#D4AF37]">{readiness?.databaseAuthority || 'LOCAL_JSON_WAL_AUTHORITATIVE'}</span> ·
                Schema 24 Valid: <strong className="text-[#F5F5F5]">{String(readiness?.schema24IntegrityValid ?? true)}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('v26-audit')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] flex items-center gap-1.5 cursor-pointer self-start"
            >
              <Layers size={14} aria-hidden="true" />
              <span>Inspect Route &amp; Control Audit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {flagEntries.map(([flagName, val]) => {
              const isTrue = Boolean(val);
              return (
                <div
                  key={flagName}
                  className="p-3 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-between gap-2 text-xs"
                >
                  <span className="font-mono text-[#F5F5F5] truncate">{flagName}</span>
                  <span
                    className={`font-mono font-semibold shrink-0 ${
                      isTrue ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isTrue ? 'true' : 'false'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
