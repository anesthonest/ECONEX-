/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V30.0 - Cross-Border Corridors, Currency Converter, Cash Agents, Liquidity & Offline USSD View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Globe, MapPin, Radio, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { EconexImage } from '../ux/EconexImage.tsx';
import { ECONEX_ASSET_MANIFEST } from '../../config/econexAssetManifest.ts';
import type {
  V30AgentProfile,
  V30FinancialCorridor,
  V30LiquidityReport,
  V30OfflineUssdSession,
} from '../../types/index.ts';

export type V30CorridorSubTab = 'CORRIDORS' | 'CURRENCY' | 'AGENTS' | 'LIQUIDITY' | 'USSD';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: V30CorridorSubTab;
}

export const V30CorridorsAgentsLiquidityView: React.FC<Props> = ({ onNavigate, initialSubTab = 'CORRIDORS' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry } = useExperience();
  const actor = { userId: currentUser?.id || 'usr_buyer_01', userRole: role, countryCode: activeCountry };

  const [subTab, setSubTab] = useState<V30CorridorSubTab>(initialSubTab);
  const [corridors, setCorridors] = useState<V30FinancialCorridor[]>([]);
  const [agents, setAgents] = useState<V30AgentProfile[]>([]);
  const [liquidityReports, setLiquidityReports] = useState<Array<V30LiquidityReport & { isFresh?: boolean }>>([]);
  const [ussdSessions, setUssdSessions] = useState<V30OfflineUssdSession[]>([]);
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // FX Comparison Calculator
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('CORR-UG-KE');
  const [fxAmountMinor, setFxAmountMinor] = useState<number>(1000000);

  // Liquidity Submission
  const [liqAgentId, setLiqAgentId] = useState<string>('AGT-UG-KLA-01');
  const [cashBand, setCashBand] = useState<'HIGH' | 'MODERATE' | 'LOW' | 'DEPLETED'>('HIGH');
  const [floatBand, setFloatBand] = useState<'HIGH' | 'MODERATE' | 'LOW' | 'DEPLETED'>('HIGH');
  const [maxPayoutMinor, setMaxPayoutMinor] = useState<number>(3000000);

  // USSD Simulator
  const [msisdn, setMsisdn] = useState<string>('+256772100401');
  const [dialString, setDialString] = useState<string>('*284*2*0772100401*50000#');

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [corRes, agRes, usRes] = await Promise.all([
        ApiClient.v30GetCorridors(countryFilter, actor),
        ApiClient.v30GetAgents({ country: countryFilter }, actor),
        ApiClient.v30GetUssdSessions(actor),
      ]);
      setCorridors(corRes?.corridors || []);
      setAgents(agRes?.agents || []);
      setLiquidityReports(agRes?.liquidityReports || []);
      setUssdSessions(usRes?.sessions || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load corridor and agent network.');
    } finally {
      setLoading(false);
    }
  }, [countryFilter, currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeCorridor = corridors.find((c) => c.id === selectedCorridorId) || corridors[0];
  const econexFeeMinor = activeCorridor ? Math.round((fxAmountMinor * activeCorridor.econexFeeBps) / 10000) : 0;
  const legacyFeeMinor = activeCorridor ? Math.round((fxAmountMinor * activeCorridor.legacyRemittanceFeeBps) / 10000) : 0;
  const estimatedTarget = activeCorridor ? Math.round(fxAmountMinor * activeCorridor.indicativeFxRate) : 0;

  const handleReportLiquidity = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30SubmitLiquidityReport(
        { agentId: liqAgentId, currency: 'UGX', cashAvailableBand: cashBand, floatAvailableBand: floatBand, maxSinglePayoutMinor: maxPayoutMinor },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`Updated live TTL liquidity band (${cashBand}/${floatBand}) for ${liqAgentId}.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to submit liquidity report.');
    } finally {
      setBusy(false);
    }
  };

  const handleRunUssd = async (codeOverride?: string) => {
    setBusy(true);
    setError(null);
    try {
      const dial = codeOverride || dialString;
      const out = await ApiClient.v30SimulateUssd({ msisdn, dialString: dial }, actor);
      if (out?.error) throw new Error(out.error);
      setFeedback(`USSD *284# sandbox executed: ${out.actionIntent}`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'USSD simulation error.');
    } finally {
      setBusy(false);
    }
  };

  const headerImg =
    subTab === 'AGENTS' || subTab === 'LIQUIDITY'
      ? ECONEX_ASSET_MANIFEST.finance_mobile_money_agent
      : ECONEX_ASSET_MANIFEST.finance_corridor_border;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl overflow-hidden border border-[#27272a] bg-[#121212] grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            Corridors, Cash Agents &amp; Offline Accessibility
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F5]">
            Cross-Border Settlement &amp; Cash-Liquidity Intelligence
          </h1>
          <p className="text-sm text-[#C0C0C0] leading-relaxed">
            Compare indicative EAC &amp; AfCFTA corridor fees against legacy remittance charges, locate verified cash agents with fresh float bands, and simulate *284# offline feature-phone flows.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(
              [
                ['CORRIDORS', 'Trade Corridors'],
                ['CURRENCY', 'FX Fee Comparator'],
                ['AGENTS', 'Cash Agent Directory'],
                ['LIQUIDITY', 'Liquidity Signals'],
                ['USSD', '*284# Offline USSD'],
              ] as const
            ).map(([id, lbl]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSubTab(id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs border cursor-pointer ${
                  subTab === id
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#050505] font-semibold'
                    : 'bg-[#181818] border-[#27272a] text-[#C0C0C0] hover:border-[#D4AF37]'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 min-h-[200px]">
          <EconexImage
            src={headerImg.path}
            alt={headerImg.alt}
            fallbackLabel={headerImg.caption}
            aspectClassName="h-full w-full min-h-[200px]"
            overlayGradient
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs text-[#C0C0C0] flex items-center gap-2">
          <Globe size={15} className="text-[#D4AF37]" aria-hidden="true" />
          <span>Country Filter:</span>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="min-h-[40px] px-3 rounded-xl bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
          >
            <option value="ALL">All Markets (UG, KE, TZ, RW, CD, SS, NG, ZA)</option>
            <option value="UG">Uganda (UG)</option>
            <option value="KE">Kenya (KE)</option>
            <option value="RW">Rwanda (RW)</option>
          </select>
        </label>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="min-h-[40px] px-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div role="status" className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-xs text-emerald-200">
          {feedback}
        </div>
      )}
      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-950/40 border border-red-700/60 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* CORRIDORS */}
      {subTab === 'CORRIDORS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {corridors.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-bold text-[#F5F5F5]">{c.corridorCode} ({c.originCurrency} -&gt; {c.destinationCurrency})</div>
                <span className="text-xs font-mono text-[#D4AF37]">1 {c.originCurrency} = {c.indicativeFxRate} {c.destinationCurrency}</span>
              </div>
              <div className="text-xs text-[#C0C0C0] tabular-nums">
                Target Fee {(c.econexFeeBps / 100).toFixed(2)}% vs Legacy Remittance {(c.legacyRemittanceFeeBps / 100).toFixed(2)}% · {c.settlementWindowLabel}
              </div>
              <div className="text-[11px] font-mono text-amber-300">{c.regulatoryStatus}</div>
              <div className="text-xs text-[#A0A0A0]">Supported Sandbox Rails: {c.supportedRails.join(', ')}</div>
            </div>
          ))}
        </div>
      )}

      {/* CURRENCY FX COMPARATOR */}
      {subTab === 'CURRENCY' && activeCorridor && (
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Transparent Cross-Border Cost &amp; FX Comparator (Sandbox)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-xs text-[#C0C0C0] space-y-1">
              <span>Select Corridor</span>
              <select
                value={activeCorridor.id}
                onChange={(e) => setSelectedCorridorId(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {corridors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.corridorCode}: {c.originCurrency} to {c.destinationCurrency}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#C0C0C0] space-y-1">
              <span>Send Principal ({activeCorridor.originCurrency})</span>
              <input
                type="number"
                min={1000}
                value={fxAmountMinor}
                onChange={(e) => setFxAmountMinor(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 tabular-nums">
            <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a]">
              <div className="text-xs text-[#A0A0A0]">Indicative Target Payout</div>
              <div className="text-xl font-bold text-[#F5F5F5] mt-1">{estimatedTarget.toLocaleString()} {activeCorridor.destinationCurrency}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#181818] border border-emerald-700/60">
              <div className="text-xs text-emerald-300">ECONEX Sandbox Fee ({(activeCorridor.econexFeeBps / 100).toFixed(2)}%)</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{econexFeeMinor.toLocaleString()} {activeCorridor.originCurrency}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#181818] border border-red-800/50">
              <div className="text-xs text-red-300">Typical Legacy Fee ({(activeCorridor.legacyRemittanceFeeBps / 100).toFixed(2)}%)</div>
              <div className="text-xl font-bold text-red-300 mt-1">{legacyFeeMinor.toLocaleString()} {activeCorridor.originCurrency}</div>
            </div>
          </div>
          <div className="text-xs text-amber-200 flex items-center gap-2">
            <ShieldAlert size={14} className="text-amber-400" aria-hidden="true" />
            <span>Indicative FX estimates only; outbound live remittance requires licensed MTO partner authorization.</span>
          </div>
        </div>
      )}

      {/* AGENTS */}
      {subTab === 'AGENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((ag) => {
            const latest = liquidityReports.find((r) => r.agentId === ag.id);
            return (
              <div key={ag.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">{ag.businessName}</h3>
                    <div className="text-xs text-[#A0A0A0] flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-[#D4AF37]" aria-hidden="true" />
                      <span>{ag.townOrMarket}, {ag.district} ({ag.countryCode})</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#D4AF37]">{ag.verificationTier}</span>
                </div>
                <div className="text-xs text-[#C0C0C0]">
                  Rails: {ag.supportedProviders.join(', ')} · Hours: {ag.operatingHours}
                </div>
                {latest && (
                  <div className="p-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs tabular-nums flex items-center justify-between">
                    <span className="text-emerald-300">Cash: {latest.cashAvailableBand} · Float: {latest.floatAvailableBand}</span>
                    <span className="text-[#A0A0A0]">Max {latest.maxSinglePayoutMinor.toLocaleString()} {latest.currency}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* LIQUIDITY SIGNALS */}
      {subTab === 'LIQUIDITY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Report Agent Cash / Float Availability</h2>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Agent</span>
              <select
                value={liqAgentId}
                onChange={(e) => setLiqAgentId(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.businessName} ({a.district})</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>Cash On Hand</span>
                <select
                  value={cashBand}
                  onChange={(e) => setCashBand(e.target.value as any)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {['HIGH', 'MODERATE', 'LOW', 'DEPLETED'].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
              <label className="text-xs text-[#C0C0C0] space-y-1">
                <span>E-Float Balance</span>
                <select
                  value={floatBand}
                  onChange={(e) => setFloatBand(e.target.value as any)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {['HIGH', 'MODERATE', 'LOW', 'DEPLETED'].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Max Single Payout (UGX)</span>
              <input
                type="number"
                value={maxPayoutMinor}
                onChange={(e) => setMaxPayoutMinor(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={handleReportLiquidity}
              className="w-full min-h-[44px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Publish 6-Hour TTL Liquidity Signal
            </button>
          </div>
          <div className="lg:col-span-7 space-y-3">
            {liquidityReports.map((lr) => (
              <div key={lr.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] text-xs flex items-center justify-between gap-2 tabular-nums">
                <div>
                  <div className="font-semibold text-[#F5F5F5]">{lr.agentId} · {lr.reporterProvenance}</div>
                  <div className="text-[#C0C0C0] mt-0.5">Cash: {lr.cashAvailableBand} | Float: {lr.floatAvailableBand} | Max Payout: {lr.maxSinglePayoutMinor.toLocaleString()} {lr.currency}</div>
                </div>
                <span className={lr.isFresh ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                  {lr.isFresh ? 'FRESH_SIGNAL' : 'EXPIRED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OFFLINE *284# USSD SIMULATOR */}
      {subTab === 'USSD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-4">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Radio size={16} aria-hidden="true" />
              <h2 className="text-base font-semibold text-[#F5F5F5]">*284# Feature-Phone &amp; Low-Connectivity USSD Sandbox</h2>
            </div>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Phone Number (MSISDN)</span>
              <input
                type="text"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>USSD Dial String (*284...)</span>
              <input
                type="text"
                value={dialString}
                onChange={(e) => setDialString(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handleRunUssd('*284*1#')} className="min-h-[38px] px-3 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#C0C0C0] cursor-pointer">*284*1# Balance</button>
              <button type="button" onClick={() => handleRunUssd('*284*2*0772100401*50000#')} className="min-h-[38px] px-3 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#C0C0C0] cursor-pointer">*284*2# Queue Pay</button>
              <button type="button" onClick={() => handleRunUssd('*284*3#')} className="min-h-[38px] px-3 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#C0C0C0] cursor-pointer">*284*3# Agent</button>
              <button type="button" disabled={busy} onClick={() => handleRunUssd()} className="min-h-[38px] px-4 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">Dial Custom</button>
            </div>
          </div>
          <div className="lg:col-span-6 space-y-3">
            {ussdSessions.slice(0, 4).map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#D4AF37]">{s.dialString}</span>
                  <span className="text-[#A0A0A0]">{s.adapterMode}</span>
                </div>
                <pre className="p-3 rounded-xl bg-[#050505] border border-[#27272a] text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                  {s.responseScreenText}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
