/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V30.0 - Universal Financial Network, Smart Routing, Payments & Reconciliation Hub
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeftRight,
  CheckCircle2,
  Coins,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { EconexImage } from '../ux/EconexImage.tsx';
import { ECONEX_ASSET_MANIFEST } from '../../config/econexAssetManifest.ts';
import type {
  V30CompetitiveAdvantageEntry,
  V30FinancialProvider,
  V30PaymentInstruction,
  V30ReconciliationCase,
  V30RoutingStrategy,
  V30SettlementRecord,
} from '../../types/index.ts';

export type V30HubSubTab =
  | 'OVERVIEW'
  | 'PROVIDERS'
  | 'INTEROP'
  | 'ROUTING'
  | 'TRANSACTIONS'
  | 'RECONCILIATION';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: V30HubSubTab;
}

export const V30FinancialNetworkHub: React.FC<Props> = ({ onNavigate, initialSubTab = 'OVERVIEW' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry } = useExperience();
  const actor = { userId: currentUser?.id || 'usr_buyer_01', userRole: role, countryCode: activeCountry };
  const isAdmin = role === 'PLATFORM_ADMIN';

  const [subTab, setSubTab] = useState<V30HubSubTab>(initialSubTab);
  const [overview, setOverview] = useState<any>(null);
  const [providers, setProviders] = useState<V30FinancialProvider[]>([]);
  const [payments, setPayments] = useState<V30PaymentInstruction[]>([]);
  const [settlements, setSettlements] = useState<V30SettlementRecord[]>([]);
  const [reconCases, setReconCases] = useState<V30ReconciliationCase[]>([]);
  const [matrix, setMatrix] = useState<V30CompetitiveAdvantageEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Smart Routing & Idempotent Payment Form
  const [srcCurrency, setSrcCurrency] = useState<string>('UGX');
  const [dstCurrency, setDstCurrency] = useState<string>('UGX');
  const [amountMinor, setAmountMinor] = useState<number>(250000);
  const [strategy, setStrategy] = useState<V30RoutingStrategy>('LOWEST_COST');
  const [recipientRef, setRecipientRef] = useState<string>('EX-MBALE-COOP-01');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`IDEMP-UI-${Date.now()}`);
  const [simulateFailover, setSimulateFailover] = useState<boolean>(false);
  const [routePreview, setRoutePreview] = useState<any>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, prvRes, payRes] = await Promise.all([
        ApiClient.v30GetOverview(actor),
        ApiClient.v30GetProviders(undefined, actor),
        ApiClient.v30GetPayments(actor),
      ]);
      setOverview(ovRes);
      setMatrix(ovRes?.competitiveMatrix || []);
      setProviders(prvRes?.providers || []);
      setPayments(payRes?.instructions || []);
      setSettlements(payRes?.settlements || []);
      setReconCases(payRes?.reconciliationCases || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Financial Interoperability Hub.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role, activeCountry]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleEvaluateRoute = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30EvaluateRouting(
        {
          sourceCurrency: srcCurrency,
          targetCurrency: dstCurrency,
          principalMinor: Number(amountMinor),
          countryCode: activeCountry,
          strategy,
        },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setRoutePreview(out);
      setFeedback(
        `Best rail: ${out.primary?.provider?.name} (Fee ${out.primary?.totalFeeMinor} ${srcCurrency}, FX ${out.indicativeFxRate}).`
      );
    } catch (e: any) {
      setError(e?.message || 'Route evaluation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleExecutePayment = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30ExecutePayment(
        {
          idempotencyKey,
          recipientRef,
          sourceCurrency: srcCurrency,
          targetCurrency: dstCurrency,
          principalMinor: Number(amountMinor),
          strategy,
          simulatePrimaryFailure: simulateFailover,
        },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(
        out.deduplicatedReplay
          ? `Idempotent replay prevented duplicate debit! Returned ${out.instruction?.instructionRef}.`
          : `Executed ${out.instruction?.instructionRef} via ${out.instruction?.selectedProviderId}${out.failoverUsed ? ' (automatic failover used, 0 duplicate debits)' : ''}.`
      );
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Payment execution failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleProviderHealth = async (p: V30FinancialProvider, nextStatus: string) => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30TransitionProviderHealth(
        p.id,
        { newStatus: nextStatus, reason: `Operator simulated status -> ${nextStatus}` },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`${p.code} transitioned to ${nextStatus}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Provider health transition blocked.');
    } finally {
      setBusy(false);
    }
  };

  const handleResolveRecon = async (caseId: string) => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30ResolveReconciliation(
        caseId,
        { status: 'RESOLVED_MATCHED', resolutionNote: 'Verified against settlement ledger variance log.' },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`Reconciliation case ${caseId} resolved cleanly.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Unable to resolve reconciliation case.');
    } finally {
      setBusy(false);
    }
  };

  const bannerImg = ECONEX_ASSET_MANIFEST.finance_enterprise_hub;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-2xl overflow-hidden border border-[#27272a] bg-[#121212] grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              Universal Financial Interoperability Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F5]">
              Provider-Neutral Payments, Routing &amp; Settlement Resilience
            </h1>
            <p className="text-sm text-[#C0C0C0] leading-relaxed">
              Connect Mobile Money, Commercial Banks, Cooperative SACCOs, and Payment Gateways through one transparent, failover-ready interface with upfront fee &amp; FX visibility.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#181818] border border-amber-700/50 text-xs text-amber-200 flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Non-Custodial Sandbox Notice:</strong> ECONEX is not a licensed bank, BoU PSP, or e-money issuer. All rails run in sandbox minor units with zero live funds moved.
            </span>
          </div>
        </div>
        <div className="lg:col-span-5 min-h-[200px]">
          <EconexImage
            src={bannerImg.path}
            alt={bannerImg.alt}
            fallbackLabel={bannerImg.caption}
            aspectClassName="h-full w-full min-h-[200px]"
            overlayGradient
          />
        </div>
      </section>

      {/* Metrics Strip */}
      {overview?.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#121212] border border-[#27272a]">
            <div className="text-xs text-[#A0A0A0]">Connected Sandbox Rails</div>
            <div className="text-xl font-bold text-[#F5F5F5] tabular-nums mt-1">
              {overview.metrics.healthyProvidersCount} / {overview.metrics.providersTotal} Healthy
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#121212] border border-[#27272a]">
            <div className="text-xs text-[#A0A0A0]">Sandbox Routed Volume</div>
            <div className="text-xl font-bold text-[#D4AF37] tabular-nums mt-1">
              UGX {Number(overview.metrics.totalSandboxVolumeMinor || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#121212] border border-[#27272a]">
            <div className="text-xs text-[#A0A0A0]">Live Real-Value Volume</div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums mt-1">
              UGX {overview.metrics.actualLiveExternalVolumeMinor} (Isolated)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#121212] border border-[#27272a]">
            <div className="text-xs text-[#A0A0A0]">Open Reconciliation Cases</div>
            <div className="text-xl font-bold text-[#F5F5F5] tabular-nums mt-1">
              {overview.metrics.reconciliationOpenCount}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] pb-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['OVERVIEW', 'Interoperability Matrix', Layers],
              ['ROUTING', 'Smart Routing & Pay', ArrowLeftRight],
              ['PROVIDERS', 'Providers & Failover', Zap],
              ['TRANSACTIONS', 'Transactions & Ledger', Coins],
              ['RECONCILIATION', 'Reconciliation Queue', CheckCircle2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 cursor-pointer transition-colors ${
                subTab === id
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-[#050505] font-semibold'
                  : 'bg-[#121212] border-[#27272a] text-[#C0C0C0] hover:border-[#D4AF37]'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div role="status" className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-xs text-emerald-200">
          {feedback}
        </div>
      )}
      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-red-950/40 border border-red-700/60 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* SUBTAB 1: COMPETITIVE LIMITATIONS -> MEASURABLE CAPABILITIES */}
      {(subTab === 'OVERVIEW' || subTab === 'INTEROP') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F5F5]">
                Addressing Structural Money System Gaps
              </h2>
              <p className="text-xs text-[#A0A0A0]">
                How ECONEX connects fragmented financial systems instead of replacing licensed institutions.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSubTab('ROUTING')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
              >
                Try Smart Payment Router
              </button>
              <button
                type="button"
                onClick={() => onNavigate('v30-corridors')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5] text-xs cursor-pointer"
              >
                Cross-Border Corridors
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matrix.map((entry) => (
              <article key={entry.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#F5F5F5]">{entry.legacySystem}</h3>
                  <span className="text-[11px] font-mono text-[#D4AF37] shrink-0">{entry.honestyStatus}</span>
                </div>
                <div className="text-xs text-[#A0A0A0]">
                  <span className="text-[#C0C0C0] font-medium">Gaps Solved: </span>
                  {entry.limitationsObserved.join(' · ')}
                </div>
                <div className="text-xs text-[#F5F5F5]">
                  <span className="text-[#D4AF37] font-medium">ECONEX Design: </span>
                  {entry.econexCapabilityBuilt}
                </div>
                <div className="pt-2 border-t border-[#27272a] text-xs text-emerald-300">
                  {entry.measurableAdvantage}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SUBTAB 2: SMART ROUTING & IDEMPOTENT PAYMENT EXECUTION */}
      {subTab === 'ROUTING' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">
              Smart Payment Router &amp; Sandbox Execution
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>Source Currency</span>
                <select
                  value={srcCurrency}
                  onChange={(e) => setSrcCurrency(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {['UGX', 'KES', 'TZS', 'RWF', 'USD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>Target Currency</span>
                <select
                  value={dstCurrency}
                  onChange={(e) => setDstCurrency(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {['UGX', 'KES', 'TZS', 'RWF', 'NGN', 'ZAR', 'USD'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>Amount (Minor Units)</span>
                <input
                  type="number"
                  min={500}
                  value={amountMinor}
                  onChange={(e) => setAmountMinor(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
                />
              </label>
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>Routing Objective</span>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as V30RoutingStrategy)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  <option value="LOWEST_COST">Lowest Total Cost</option>
                  <option value="FASTEST_SETTLEMENT">Fastest Settlement</option>
                  <option value="HIGHEST_RELIABILITY">Highest Reliability</option>
                  <option value="FALLBACK_RESILIENCE">Fallback Resilience</option>
                </select>
              </label>
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>Recipient EUWN / Account Ref</span>
                <input
                  type="text"
                  value={recipientRef}
                  onChange={(e) => setRecipientRef(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                />
              </label>
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>Idempotency Key (Prevents Double Pay)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                  <button
                    type="button"
                    onClick={() => setIdempotencyKey(`IDEMP-UI-${Date.now()}`)}
                    className="px-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#D4AF37] cursor-pointer"
                  >
                    New
                  </button>
                </div>
              </label>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-[#C0C0C0] cursor-pointer">
              <input
                type="checkbox"
                checked={simulateFailover}
                onChange={(e) => setSimulateFailover(e.target.checked)}
                className="w-4 h-4 accent-[#D4AF37]"
              />
              <span>Simulate Primary Provider Timeout (verifies backup rail failover without duplicate charge)</span>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleEvaluateRoute}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#181818] border border-[#D4AF37] text-[#D4AF37] font-semibold text-sm cursor-pointer"
              >
                Compare Provider Costs
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleExecutePayment}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
              >
                Execute Sandbox Payment
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Upfront Fee &amp; FX Transparency</h2>
            {routePreview ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#181818] border border-[#D4AF37]/60 space-y-1.5">
                  <div className="text-xs text-[#D4AF37] font-semibold">
                    Recommended Primary: {routePreview.primary.provider.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#C0C0C0] tabular-nums pt-1">
                    <div>Principal: {routePreview.principalMinor.toLocaleString()} {routePreview.sourceCurrency}</div>
                    <div>Provider Fee: {routePreview.primary.providerFeeMinor.toLocaleString()} {routePreview.sourceCurrency}</div>
                    <div>Platform Fee (0.20%): {routePreview.primary.platformFeeMinor.toLocaleString()} {routePreview.sourceCurrency}</div>
                    <div>FX Spread: {routePreview.primary.fxSpreadMinor.toLocaleString()} {routePreview.sourceCurrency}</div>
                  </div>
                  <div className="pt-2 border-t border-[#27272a] text-sm font-bold text-[#F5F5F5] tabular-nums">
                    Total Debit: {routePreview.primary.totalDebitMinor.toLocaleString()} {routePreview.sourceCurrency} · Est. Output: {routePreview.convertedTargetMinor.toLocaleString()} {routePreview.targetCurrency}
                  </div>
                </div>

                {routePreview.fallback && (
                  <div className="p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#C0C0C0]">
                    <strong>Standby Backup Rail:</strong> {routePreview.fallback.provider.name} ({routePreview.fallback.provider.typicalSettlementSeconds}s est.)
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-[#A0A0A0]">All Evaluated Sandbox Candidates</div>
                  {routePreview.alternatives?.map((alt: any) => (
                    <div key={alt.provider.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#181818] border border-[#27272a] tabular-nums">
                      <span className="text-[#F5F5F5]">{alt.provider.name}</span>
                      <span className="text-[#D4AF37]">Fee {alt.totalFeeMinor.toLocaleString()} {routePreview.sourceCurrency} · {alt.provider.reliabilityScore}% rel</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#A0A0A0]">
                Select currencies, amount, and routing strategy then click <strong>Compare Provider Costs</strong> to inspect transparent minor-unit fees before confirming.
              </div>
            )}
          </div>
        </section>
      )}

      {/* SUBTAB 3: PROVIDER DIRECTORY & OUTAGE SIMULATION */}
      {subTab === 'PROVIDERS' && (
        <section className="space-y-3">
          <div className="text-xs text-[#A0A0A0]">
            Showing all {providers.length} provider-neutral adapters. Platform Administrators can simulate provider outages (`DOWN` / `HEALTHY`) to test automatic failover.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">{p.name}</h3>
                    <span
                      className={`text-[11px] font-mono ${
                        p.healthStatus === 'HEALTHY'
                          ? 'text-emerald-400'
                          : p.healthStatus === 'DEGRADED' || p.healthStatus === 'MAINTENANCE'
                            ? 'text-amber-400'
                            : 'text-red-400'
                      }`}
                    >
                      {p.healthStatus}
                    </span>
                  </div>
                  <div className="text-xs text-[#D4AF37] font-mono">
                    {p.providerCategory} · {p.integrationStatus}
                  </div>
                  <div className="text-xs text-[#C0C0C0] tabular-nums">
                    Fee: {(p.feeBps / 100).toFixed(2)}% + {p.flatFeeMinor} | Countries: {p.countries.join(', ')}
                  </div>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">{p.notes}</p>
                </div>

                {isAdmin && p.providerCategory !== 'DIGITAL_ASSET_GATE' && (
                  <div className="flex gap-2 pt-2 border-t border-[#27272a]">
                    <button
                      type="button"
                      disabled={busy || p.healthStatus === 'DOWN'}
                      onClick={() => handleToggleProviderHealth(p, 'DOWN')}
                      className="min-h-[38px] flex-1 px-3 rounded-lg bg-[#181818] border border-red-800/60 text-xs text-red-300 disabled:opacity-40 cursor-pointer"
                    >
                      Simulate Outage
                    </button>
                    <button
                      type="button"
                      disabled={busy || p.healthStatus === 'HEALTHY'}
                      onClick={() => handleToggleProviderHealth(p, 'HEALTHY')}
                      className="min-h-[38px] flex-1 px-3 rounded-lg bg-[#181818] border border-emerald-800/60 text-xs text-emerald-300 disabled:opacity-40 cursor-pointer"
                    >
                      Restore Healthy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SUBTAB 4: TRANSACTIONS & DOUBLE-ENTRY SETTLEMENTS */}
      {subTab === 'TRANSACTIONS' && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] overflow-x-auto">
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-3">
              Payment Instructions &amp; Idempotent Executions ({payments.length})
            </h2>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Recipient</th>
                  <th className="py-2 pr-3">Rail</th>
                  <th className="py-2 pr-3">Principal</th>
                  <th className="py-2 pr-3">Total Debit</th>
                  <th className="py-2 pr-3">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] tabular-nums">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-3 font-mono text-[#D4AF37]">{p.instructionRef}</td>
                    <td className="py-2.5 pr-3 text-[#F5F5F5]">{p.recipientRef}</td>
                    <td className="py-2.5 pr-3 text-[#C0C0C0]">{p.selectedProviderId}</td>
                    <td className="py-2.5 pr-3 text-[#F5F5F5]">{p.principalMinor.toLocaleString()} {p.sourceCurrency}</td>
                    <td className="py-2.5 pr-3 text-[#C0C0C0]">{p.totalDebitMinor.toLocaleString()} {p.sourceCurrency}</td>
                    <td className="py-2.5 pr-3 font-mono text-emerald-300">{p.lifecycleState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-2xl bg-[#121212] border border-[#27272a]">
            <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">
              Double-Entry Ledger Settlements ({settlements.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settlements.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-1 tabular-nums">
                  <div className="flex justify-between">
                    <span className="font-mono text-[#D4AF37]">{s.settlementBatchRef}</span>
                    <span className="text-emerald-400">{s.balanced ? 'BALANCED (Debit==Credit)' : 'UNBALANCED'}</span>
                  </div>
                  <div className="text-[#C0C0C0]">
                    Net {s.netMinor.toLocaleString()} {s.currency} · Fee {s.feeMinor.toLocaleString()} · Journal {s.journalEntryId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SUBTAB 5: RECONCILIATION EXCEPTION QUEUE */}
      {subTab === 'RECONCILIATION' && (
        <section className="space-y-3">
          {reconCases.map((rc) => (
            <div key={rc.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-[#D4AF37]">{rc.id}</span>
                  <span className="font-mono text-[#F5F5F5]">{rc.status}</span>
                  <span className="text-amber-300">{rc.severity}</span>
                </div>
                <div className="text-xs text-[#C0C0C0] tabular-nums">
                  Payment {rc.paymentInstructionId} · Expected {rc.expectedMinor.toLocaleString()} vs Reported {rc.reportedMinor.toLocaleString()} {rc.currency} (Variance: {rc.varianceMinor.toLocaleString()})
                </div>
                {rc.resolutionNote && <div className="text-xs text-emerald-300">Note: {rc.resolutionNote}</div>}
              </div>
              {isAdmin && rc.status === 'OPEN' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleResolveRecon(rc.id)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer shrink-0"
                >
                  Resolve Matched Variance
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
