/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Universal Economic Operating System Dashboard
 * Sector-neutral overview across 28+ sectors, separated ACTUAL / TEST / PENDING metrics,
 * 16-stage commercial execution pipeline with SHA-256 agreement lock, and role perspective switcher.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Compass,
  FileText,
  Globe,
  Hammer,
  Layers,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type { V22CommercialStage, V22EconomicActivity, V22SectorDefinition } from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const NEXT_STAGE_MAP: Partial<Record<V22CommercialStage, V22CommercialStage>> = {
  ENQUIRY: 'QUOTATION',
  QUOTATION: 'NEGOTIATION',
  NEGOTIATION: 'AGREEMENT_CONFIRMED',
  AGREEMENT_CONFIRMED: 'ORDER_OR_ENGAGEMENT_ACTIVE',
  ORDER_OR_ENGAGEMENT_ACTIVE: 'OBLIGATIONS_ASSIGNED',
  OBLIGATIONS_ASSIGNED: 'EXECUTION_IN_PROGRESS',
  EXECUTION_IN_PROGRESS: 'MILESTONE_EVIDENCE_SUBMITTED',
  MILESTONE_EVIDENCE_SUBMITTED: 'DELIVERY_OR_SERVICE_ACCEPTED',
  DELIVERY_OR_SERVICE_ACCEPTED: 'INVOICE_ISSUED',
  INVOICE_ISSUED: 'EXTERNAL_PAYMENT_REFERENCED',
  EXTERNAL_PAYMENT_REFERENCED: 'RECONCILIATION_COMPLETED',
  RECONCILIATION_COMPLETED: 'COMPLETED',
  COMPLETED: 'PERFORMANCE_TRUST_RECORDED',
};

export const V22UniversalDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || role, userRole: role };

  const [perspective, setPerspective] = useState<'ALL' | 'INDIVIDUAL' | 'BUSINESS' | 'PROCUREMENT' | 'ADMIN'>('ALL');
  const [overview, setOverview] = useState<any>(null);
  const [sectors, setSectors] = useState<V22SectorDefinition[]>([]);
  const [activities, setActivities] = useState<V22EconomicActivity[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newActOpen, setNewActOpen] = useState<boolean>(false);
  const [actTitle, setActTitle] = useState<string>('');
  const [actSector, setActSector] = useState<string>('SOLAR_ENERGY');
  const [actType, setActType] = useState<V22EconomicActivity['activityType']>('SERVICE_ENGAGEMENT');
  const [actSellerName, setActSellerName] = useState<string>('SunGrid East Africa Energy');
  const [actQty, setActQty] = useState<number>(1);
  const [actPrice, setActPrice] = useState<number>(3500000);
  const [actCurrency, setActCurrency] = useState<string>('UGX');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, secRes, actRes] = await Promise.all([
        ApiClient.v22GetOverview(actor),
        ApiClient.v22GetSectors(undefined, actor),
        ApiClient.v22GetActivities(selectedSector ? { sectorCode: selectedSector } : undefined, actor),
      ]);
      setOverview(ov);
      setSectors(secRes.sectors || []);
      setActivities(actRes.activities || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Universal Economy overview.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role, selectedSector]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v22CreateActivity(
        {
          sectorCode: actSector,
          activityType: actType,
          title: actTitle,
          sellerUserId: 'BIZ-V22-002',
          sellerName: actSellerName,
          quantity: actQty,
          unitPrice: actPrice,
          currency: actCurrency,
        },
        actor
      );
      setFeedback(`Initiated commercial activity ${res.activity?.activityCode || ''}`);
      setActTitle('');
      setNewActOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not initiate commercial activity.');
    }
  };

  const handleAdvanceStage = async (act: V22EconomicActivity) => {
    const targetStage = NEXT_STAGE_MAP[act.stage];
    if (!targetStage) return;
    setBusyId(act.id);
    setError(null);
    setFeedback(null);
    try {
      await ApiClient.v22TransitionActivity(
        act.id,
        {
          targetStage,
          expectedVersion: act.version,
          note: `Advanced stage to ${targetStage} from Universal Command Overview`,
          evidenceSummary:
            targetStage === 'MILESTONE_EVIDENCE_SUBMITTED'
              ? 'Signed field inspection and delivery receipt hash recorded.'
              : undefined,
        },
        actor
      );
      setFeedback(`${act.activityCode} advanced to ${targetStage}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Stage transition rejected.');
    } finally {
      setBusyId(null);
    }
  };

  const actual = overview?.separatedMetrics?.actual || {};
  const testData = overview?.separatedMetrics?.testAndSimulation || {};
  const extFlags = overview?.separatedMetrics?.externalStatusFlags || {};

  return (
    <div className="space-y-6">
      {/* Header & Perspective Switcher */}
      <header className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">
              ECONEX V22.0 · SCHEMA {overview?.schemaVersion ?? 20} · SECTOR-NEUTRAL OPERATING SYSTEM
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Universal Economic Activity &amp; Growth Engine
            </h1>
            <p className="text-sm text-[#A0A0A0] max-w-3xl">
              Coordinate legitimate commerce across {sectors.length || 28} economic sectors — from construction, solar energy,
              software &amp; healthcare supplies to transport, trade, artisans, and agriculture.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadData}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw size={15} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setNewActOpen((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm hover:bg-[#e5bf43] flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Initiate Commercial Activity</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Role Perspective Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#27272a]">
          <span className="text-xs font-mono text-[#A0A0A0] mr-2">VIEW PERSPECTIVE:</span>
          {(['ALL', 'INDIVIDUAL', 'BUSINESS', 'PROCUREMENT', 'ADMIN'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPerspective(p)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-mono border cursor-pointer whitespace-nowrap shrink-0 ${
                perspective === p
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#181818] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-200 flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-400 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 text-sm text-emerald-200">
          {feedback}
        </div>
      )}

      {/* New Activity Form */}
      {newActOpen && (
        <form onSubmit={handleCreateActivity} className="bg-[#121212] border border-[#D4AF37]/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              New Cross-Sector Commercial Activity
            </h2>
            <button
              type="button"
              onClick={() => setNewActOpen(false)}
              className="text-xs text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Title / Engagement Scope</span>
              <input
                required
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                placeholder="e.g. Clinic 10kW Solar Microgrid Installation"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Economic Sector</span>
              <select
                value={actSector}
                onChange={(e) => setActSector(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {sectors.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Activity Type</span>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value as V22EconomicActivity['activityType'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="GOODS_SALE">GOODS_SALE</option>
                <option value="SERVICE_ENGAGEMENT">SERVICE_ENGAGEMENT</option>
                <option value="EQUIPMENT_RENTAL">EQUIPMENT_RENTAL</option>
                <option value="PROJECT_CONTRACT">PROJECT_CONTRACT</option>
                <option value="WHOLESALE_ORDER">WHOLESALE_ORDER</option>
                <option value="DIGITAL_DELIVERY">DIGITAL_DELIVERY</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Counterparty / Supplier Name</span>
              <input
                required
                value={actSellerName}
                onChange={(e) => setActSellerName(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                value={actQty}
                onChange={(e) => setActQty(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs text-[#A0A0A0]">
                <span>Unit Price</span>
                <input
                  type="number"
                  min={0}
                  value={actPrice}
                  onChange={(e) => setActPrice(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
                />
              </label>
              <label className="space-y-1 text-xs text-[#A0A0A0]">
                <span>Currency</span>
                <select
                  value={actCurrency}
                  onChange={(e) => setActCurrency(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
                >
                  <option value="UGX">UGX</option>
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="TZS">TZS</option>
                  <option value="RWF">RWF</option>
                </select>
              </label>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Create Activity Record
            </button>
          </div>
        </form>
      )}

      {/* Separated Metrics Strip (ACTUAL / TEST / PENDING_EXTERNAL_SURVEY) */}
      <section aria-label="Universal Economy Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-[#D4AF37]">ACTUAL · SECTORS &amp; ENTITIES</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#F5F5F5]">
            {loading ? '—' : `${sectors.length} Sectors`}
          </div>
          <div className="text-xs text-[#A0A0A0] font-mono tabular-nums">
            {actual.registeredBusinesses ?? 0} businesses · {actual.independentIndividuals ?? 0} individuals
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-[#D4AF37]">ACTUAL · MARKET &amp; WORKFLOWS</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#F5F5F5]">
            {loading ? '—' : `${actual.activeListings ?? 0} Offers`}
          </div>
          <div className="text-xs text-[#A0A0A0] font-mono tabular-nums">
            {actual.liveCommercialActivities ?? 0} live deals · {actual.openTenders ?? 0} open RFQs
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-[#D4AF37]">ACTUAL · INVOICED &amp; LEDGER</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#F5F5F5]">
            {loading ? '—' : `UGX ${Number(actual.invoicedValueUgx || 0).toLocaleString()}`}
          </div>
          <div className="text-xs text-[#A0A0A0] font-mono tabular-nums">
            Ledger parity: {overview?.financialIntegrity?.journalBalanced ? 'BALANCED' : 'CHECK'} · Paying subscribers:{' '}
            {actual.payingSubscribersCount ?? 0}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-1">
          <div className="text-[11px] font-mono text-[#A0A0A0]">TEST &amp; EXTERNAL BOUNDARY</div>
          <div className="text-2xl font-mono font-bold tabular-nums text-[#C0C0C0]">
            {loading ? '—' : `${testData.testCommercialActivities ?? 0} Test`}
          </div>
          <div className="text-xs text-[#A0A0A0] font-mono">
            Cutover: {String(extFlags.V22_POSTGRESQL_CUTOVER_COMPLETE ?? false)} · Prod:{' '}
            {String(extFlags.V22_PRODUCTION_DEPLOYED ?? false)}
          </div>
        </div>
      </section>

      {/* Cross-Sector Universal Quick Actions */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
          Universal Cross-Sector Workflows
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('v22-marketplace')}
            className="min-h-[44px] p-3 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-left space-y-1 cursor-pointer"
          >
            <ShoppingBag size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <div className="text-sm font-medium text-[#F5F5F5]">Buy / Sell Goods</div>
            <div className="text-xs text-[#A0A0A0]">Retail, B2B &amp; wholesale</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('v22-marketplace')}
            className="min-h-[44px] p-3 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-left space-y-1 cursor-pointer"
          >
            <Wrench size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <div className="text-sm font-medium text-[#F5F5F5]">Book Service</div>
            <div className="text-xs text-[#A0A0A0]">Solar, ICT, advisory &amp; more</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('v22-businesses')}
            className="min-h-[44px] p-3 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-left space-y-1 cursor-pointer"
          >
            <Hammer size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <div className="text-sm font-medium text-[#F5F5F5]">Hire Artisan</div>
            <div className="text-xs text-[#A0A0A0]">Independent skilled workers</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('v22-procurement')}
            className="min-h-[44px] p-3 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-left space-y-1 cursor-pointer"
          >
            <Briefcase size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <div className="text-sm font-medium text-[#F5F5F5]">Post RFQ / Tender</div>
            <div className="text-xs text-[#A0A0A0]">Private &amp; coop sourcing</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('v22-procurement')}
            className="min-h-[44px] p-3 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-left space-y-1 cursor-pointer"
          >
            <Layers size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <div className="text-sm font-medium text-[#F5F5F5]">Manage Project</div>
            <div className="text-xs text-[#A0A0A0]">Milestones &amp; variations</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('v22-finance-intel')}
            className="min-h-[44px] p-3 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-left space-y-1 cursor-pointer"
          >
            <FileText size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <div className="text-sm font-medium text-[#F5F5F5]">Issue Invoice &amp; FX</div>
            <div className="text-xs text-[#A0A0A0]">VAT &amp; non-custodial refs</div>
          </button>
        </div>
      </section>

      {/* Sector Filter Strip + Active Commercial Activities */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              Commercial Execution Lifecycle (16 Configurable Stages)
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Agreements generate SHA-256 locks upon acceptance, rejecting silent post-acceptance contract changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter activities by sector"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="min-h-[40px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5]"
            >
              <option value="">All 28+ Sectors</option>
              {sectors.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onNavigate('v22-discover')}
              className="min-h-[40px] px-3 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass size={14} aria-hidden="true" />
              <span>All Sectors</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#27272a]">
          {activities.length === 0 ? (
            <div className="py-6 text-sm text-[#A0A0A0]">No commercial activities match the selected filter.</div>
          ) : (
            activities.map((act) => {
              const nextStage = NEXT_STAGE_MAP[act.stage];
              return (
                <div key={act.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#A0A0A0]">
                      <span className="text-[#D4AF37]">{act.activityCode}</span>
                      <span>·</span>
                      <span>{act.sectorCode}</span>
                      <span>·</span>
                      <span>{act.activityType}</span>
                      <span>·</span>
                      <span className="text-[#F5F5F5]">{act.stage}</span>
                    </div>
                    <div className="text-base font-medium text-[#F5F5F5]">{act.title}</div>
                    <div className="text-xs text-[#A0A0A0] font-mono tabular-nums">
                      Buyer: {act.buyerName} → Supplier: {act.sellerName} · {act.currency}{' '}
                      {act.totalAmount.toLocaleString()} · {act.district}, {act.countryCode} · v{act.version}
                    </div>
                    {act.agreement?.lockedAfterAcceptance && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                        <Lock size={12} aria-hidden="true" />
                        <span>SHA-256 Locked: {act.agreement.sha256Hash.slice(0, 20)}...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {nextStage ? (
                      <button
                        type="button"
                        disabled={busyId === act.id}
                        onClick={() => handleAdvanceStage(act)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#050505] text-xs font-semibold text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                      >
                        {busyId === act.id ? 'Updating...' : `Advance → ${nextStage}`}
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400">COMPLETED / ARCHIVED</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Non-Custodial & Regulatory Boundary Footer */}
      <section className="bg-[#0e0e10] border border-[#27272a] rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A0A0A0]">
        <div className="space-y-1">
          <div className="font-mono text-[#D4AF37] flex items-center gap-1.5">
            <Building2 size={13} aria-hidden="true" />
            <span>NON-CUSTODIAL BOUNDARY</span>
          </div>
          <p>{overview?.disclaimers?.nonCustodial}</p>
        </div>
        <div className="space-y-1">
          <div className="font-mono text-[#D4AF37] flex items-center gap-1.5">
            <Globe size={13} aria-hidden="true" />
            <span>PROCUREMENT DISCLOSURE</span>
          </div>
          <p>{overview?.disclaimers?.nonOfficialProcurement}</p>
        </div>
        <div className="space-y-1">
          <div className="font-mono text-[#D4AF37] flex items-center gap-1.5">
            <Lock size={13} aria-hidden="true" />
            <span>AGREEMENT RECORD NOTICE</span>
          </div>
          <p>{overview?.disclaimers?.agreement}</p>
        </div>
      </section>
    </div>
  );
};

export default V22UniversalDashboard;
