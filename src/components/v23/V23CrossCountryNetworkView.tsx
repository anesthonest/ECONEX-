/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Multi-Country Operating Profiles, FX Calculator & Regulatory Gate Tracker
 * Covers 7 Initial Countries (UG, KE, TZ, RW, BI, SS, CD), 9 Currencies, Uganda NPS Act 2020 & BoU 14-Gate Checklist.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Calculator, CheckCircle2, Globe, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type { V23CountryOperatingProfile, V23CurrencyCode } from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V23CrossCountryNetworkView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || 'usr_farmer_01', userRole: role };

  const [countries, setCountries] = useState<V23CountryOperatingProfile[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('UG');
  const [fxFrom, setFxFrom] = useState<V23CurrencyCode>('UGX');
  const [fxTo, setFxTo] = useState<V23CurrencyCode>('KES');
  const [fxMajor, setFxMajor] = useState<number>(100000);
  const [fxResult, setFxResult] = useState<any>(null);

  // Add Country (Admin only)
  const [newCode, setNewCode] = useState<string>('ZM');
  const [newName, setNewName] = useState<string>('Republic of Zambia');
  const [newCurr, setNewCurr] = useState<V23CurrencyCode>('USD');
  const [newAuth, setNewAuth] = useState<string>('Bank of Zambia (BoZ)');

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await ApiClient.v23GetCountries(actor);
      setCountries(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load country operating profiles.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeProfile = countries.find((c) => c.countryCode === selectedCode) || countries[0] || null;

  const handleFxCalc = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v23PreviewFx(
        { sourceCurrency: fxFrom, destinationCurrency: fxTo, sourceAmountMinor: Math.round(fxMajor * 100) },
        actor
      );
      setFxResult(out);
    } catch (e: any) {
      setError(e?.message || 'FX preview failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await ApiClient.v23RegisterCountry(
        {
          countryCode: newCode.trim().toUpperCase(),
          countryName: newName.trim(),
          defaultCurrency: newCurr,
          supportedCurrencies: [newCurr, 'UGX', 'USD'],
          authorityRef: newAuth.trim(),
        },
        actor
      );
      if (created?.error) throw new Error(created.error);
      setFeedback(`Registered configurable country profile ${created.countryCode} with status ${created.countryActivationStatus}.`);
      await loadData();
      setSelectedCode(created.countryCode);
    } catch (e: any) {
      setError(e?.message || 'Add country failed (Admin required).');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleGate = async (gateCode: string, completed: boolean) => {
    if (!activeProfile) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await ApiClient.v23UpdateCountryGate(
        activeProfile.countryCode,
        { gateCode, completed: !completed, evidenceRef: `EVID-${activeProfile.countryCode}-${gateCode}` },
        actor
      );
      if (updated?.error) throw new Error(updated.error);
      setFeedback(`Updated gate ${gateCode} for ${activeProfile.countryCode} (Activation remains ${updated.countryActivationStatus}).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Gate update failed (Platform Admin required).');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
            MULTI-COUNTRY OPERATING FRAMEWORK · ALL COUNTRIES DEFAULT TO NOT_ACTIVATED FOR REAL VALUE
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1">
            African Wallet Network, FX Transparency &amp; Regulatory Gates
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            One permanent ECONEX wallet identity across Uganda, Kenya, Tanzania, Rwanda, Burundi, South Sudan, DRC, and extensible AfCFTA markets.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onNavigate('v23-wallet')}
            className="px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#121212] text-xs text-[#F5F5F5] cursor-pointer"
          >
            Back to Wallet
          </button>
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#121212] text-xs text-[#F5F5F5] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900 text-xs text-red-200">{error}</div>}
      {feedback && <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900 text-xs text-emerald-200">{feedback}</div>}

      {/* Synthetic FX Transparency Calculator */}
      <form onSubmit={handleFxCalc} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
            <Calculator size={15} className="text-[#D4AF37]" /> 9-Currency FX Transparency Calculator (Synthetic Test Rates Only)
          </div>
          <span className="text-xs text-amber-300 font-mono">NON-EXECUTABLE TEST RATE</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <input
            type="number"
            value={fxMajor}
            onChange={(e) => setFxMajor(Number(e.target.value))}
            className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
          />
          <select value={fxFrom} onChange={(e) => setFxFrom(e.target.value as V23CurrencyCode)} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]">
            {['UGX', 'KES', 'TZS', 'RWF', 'BIF', 'SSP', 'CDF', 'USD', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fxTo} onChange={(e) => setFxTo(e.target.value as V23CurrencyCode)} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]">
            {['UGX', 'KES', 'TZS', 'RWF', 'BIF', 'SSP', 'CDF', 'USD', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
            Preview Conversion
          </button>
        </div>
        {fxResult && (
          <div className="font-mono text-xs text-[#F5F5F5] pt-2 border-t border-[#27272a]">
            {(fxResult.sourceAmountMinor / 100).toLocaleString()} {fxResult.sourceCurrency} → {(fxResult.destinationAmountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} {fxResult.destinationCurrency} · Rate: {fxResult.fxRateApplied} ({fxResult.fxRateSource})
          </div>
        )}
      </form>

      {/* Country Grid & Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {countries.map((c) => (
          <button
            key={c.countryCode}
            type="button"
            onClick={() => setSelectedCode(c.countryCode)}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              activeProfile?.countryCode === c.countryCode
                ? 'bg-[#121212] border-[#D4AF37]'
                : 'bg-[#121212] border-[#27272a] hover:border-[#52525b]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#D4AF37] font-bold">{c.countryCode} · {c.defaultCurrency}</span>
              <span className="text-[#A0A0A0]">{c.countryActivationStatus}</span>
            </div>
            <div className="text-sm font-semibold text-[#F5F5F5] mt-1 flex items-center gap-1.5">
              <Globe size={14} className="text-[#D4AF37]" /> {c.countryName}
            </div>
            <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono">
              Gates: {c.activationGates.filter((g) => g.completed).length}/{c.activationGates.length} · Sandbox: {String(c.sandboxWalletAvailable)}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Country Regulatory & Operating Details + 14-Gate Checklist */}
      {activeProfile && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#27272a] pb-3">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">
                {activeProfile.countryName} ({activeProfile.countryCode}) — Regulatory &amp; Licensing Readiness Gates
              </h2>
              <div className="text-xs text-[#A0A0A0] mt-0.5">
                Authority: {activeProfile.regulatoryAuthorityRef} · Card Policy: {activeProfile.cardPermissions} · Withdrawals: {activeProfile.withdrawalPermissions}
              </div>
            </div>
            <div className="text-xs font-mono text-amber-300">{activeProfile.operationalAvailabilityStatus}</div>
          </div>

          <div className="divide-y divide-[#27272a]">
            {activeProfile.activationGates.map((g) => (
              <div key={g.gateCode} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="text-[#F5F5F5] font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className={g.completed ? 'text-emerald-400' : 'text-[#52525b]'} />
                    <span className="font-mono text-[#D4AF37]">{g.gateCode}</span> · {g.title}
                  </div>
                  <div className="text-[#A0A0A0] mt-0.5">{g.notes}</div>
                </div>
                {role === 'PLATFORM_ADMIN' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleGate(g.gateCode, g.completed)}
                    className="px-3 py-1 rounded border border-[#27272a] text-[#F5F5F5] hover:border-[#D4AF37] shrink-0 cursor-pointer"
                  >
                    {g.completed ? 'Mark Incomplete' : 'Record Evidence'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin: Register Additional African Country */}
      {role === 'PLATFORM_ADMIN' && (
        <form onSubmit={handleAddCountry} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
            <ShieldCheck size={15} className="text-[#D4AF37]" /> Admin: Add Extensible African / International Country Profile
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <input type="text" maxLength={2} required value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="ISO (e.g. ZM)" className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]" />
            <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Country Name" className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]" />
            <input type="text" required value={newAuth} onChange={(e) => setNewAuth(e.target.value)} placeholder="Central Bank / Authority" className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]" />
            <div className="flex gap-2">
              <select value={newCurr} onChange={(e) => setNewCurr(e.target.value as V23CurrencyCode)} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-2 text-[#F5F5F5]">
                {['USD', 'EUR', 'UGX', 'KES', 'TZS', 'RWF'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={busy} className="flex-1 px-3 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold flex items-center justify-center gap-1 cursor-pointer">
                <Plus size={13} /> Add Country
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
