/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V3 - Regional Interoperability & Multi-Currency Engine
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Coins,
  ArrowRightLeft,
  ShieldCheck,
  FileCheck,
  RefreshCw,
  Building,
  CheckCircle,
  Truck,
  Compass,
  FileText,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  CurrencyMetadata,
  CountryTenantConfig,
  SupportedCurrency,
} from '../../types/index.ts';

export default function RegionalTradeView() {
  const [currencies, setCurrencies] = useState<CurrencyMetadata[]>([]);
  const [tenants, setTenants] = useState<CountryTenantConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Currency Converter Form
  const [fromCurrency, setFromCurrency] = useState<SupportedCurrency>('KES');
  const [toCurrency, setToCurrency] = useState<SupportedCurrency>('UGX');
  const [convertAmount, setConvertAmount] = useState('10000');
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [converting, setConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [curs, tens] = await Promise.all([
        api.getRegionalCurrencies(),
        api.getCountryTenants(),
      ]);
      setCurrencies(curs);
      setTenants(tens);
    } catch (err) {
      console.error('Failed to load regional currencies or tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConvert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!convertAmount || Number(convertAmount) < 0) return;
    setConversionError(null);
    setConverting(true);
    try {
      const res = await api.convertCurrency(fromCurrency, toCurrency, Number(convertAmount));
      setConversionResult(res);
    } catch (err: any) {
      setConversionError('Conversion error: ' + (err.message || err));
    } finally {
      setConverting(false);
    }
  };

  useEffect(() => {
    if (currencies.length > 0) {
      handleConvert();
    }
  }, [fromCurrency, toCurrency, convertAmount, currencies]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
              Corridor Interoperability V3.0
            </span>
            <span className="text-xs text-[#A0A0A0]">East African Community Cross-Border Trade</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Regional Currencies & Country Tenants</h1>
          <p className="text-sm text-[#A0A0A0] max-w-2xl mt-1">
            Bank of Uganda reference rates and EAC central bank interoperability. Cross-border grain and commodity settlements across Uganda, Kenya, Tanzania, Rwanda, and Burundi.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl border border-[#333] hover:border-[#D4AF37] text-[#A0A0A0] hover:text-[#D4AF37] transition self-start md:self-auto"
          title="Refresh Exchange Rates"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {conversionError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
          <span>{conversionError}</span>
          <button onClick={() => setConversionError(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Grid: Currency Converter Left / Currency Registry Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Converter Card */}
        <div className="bg-[#121212] border border-[#222] p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-[#F5F5F5]">Corridor FX Converter</h2>
          </div>

          <form onSubmit={handleConvert} className="space-y-4">
            <div>
              <label className="text-xs text-[#A0A0A0] block mb-1">Amount</label>
              <input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 font-mono focus:border-[#D4AF37] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">From Currency</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value as SupportedCurrency)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">To Currency</label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value as SupportedCurrency)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {conversionResult && (
              <div className="p-4 bg-[#181818] border border-[#2a2a2a] rounded-xl space-y-2">
                <span className="text-xs text-[#A0A0A0] block">Converted Value</span>
                <div className="text-2xl font-bold font-mono text-[#D4AF37]">
                  {conversionResult.convertedAmount.toLocaleString()} {toCurrency}
                </div>
                <div className="text-[11px] text-[#777] font-mono pt-1 border-t border-[#222] flex items-center justify-between">
                  <span>Base Peg: {conversionResult.amountInUGX.toLocaleString()} UGX</span>
                  <span>{conversionResult.rateProvenance}</span>
                </div>
              </div>
            )}
          </form>

          <div className="p-3 bg-[#0e0e0e] border border-[#222] rounded-xl text-[11px] text-[#777] space-y-1">
            <div className="text-[#CCC] font-semibold">Provenance Verification:</div>
            <div>UGX baseline is pegged to official Bank of Uganda indicative mid-rate fixes. EAC currencies calculate via bilateral clearing windows.</div>
          </div>
        </div>

        {/* Currency Rates Table */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#222] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">East African Corridor Currency Registry</h2>
            <span className="text-xs font-mono text-[#A0A0A0]">{currencies.length} Supported Currencies</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#A0A0A0]">
              <thead className="bg-[#181818] text-[#F5F5F5] text-xs uppercase font-mono tracking-wider border-b border-[#222]">
                <tr>
                  <th className="p-3">Currency</th>
                  <th className="p-3">Rate to UGX (Base)</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Official Provenance</th>
                  <th className="p-3">Decimals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e1e]">
                {currencies.map((c) => (
                  <tr key={c.code} className="hover:bg-[#181818]/50 transition font-sans">
                    <td className="p-3">
                      <div className="font-mono text-xs font-bold text-[#F5F5F5]">{c.code}</div>
                      <div className="text-xs text-[#777]">{c.name}</div>
                    </td>
                    <td className="p-3 font-mono text-xs text-[#D4AF37] font-semibold">
                      1 {c.code} = {c.exchangeRateToUGX.toLocaleString()} UGX
                    </td>
                    <td className="p-3 font-mono text-xs text-[#CCC]">{c.symbol}</td>
                    <td className="p-3">
                      <span className="text-[11px] font-mono bg-[#222] text-[#CCC] px-2 py-0.5 rounded border border-[#333]">
                        {c.rateSource}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-[#777]">{c.fractionDigits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Country Tenant Configurations & Data Residency */}
      <div className="bg-[#121212] border border-[#222] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">Country Tenants & Data Residency Architecture</h2>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Data residency policies comply with national sovereignty legislation. Uganda tenant stores primary trade documents within national borders, with regional EAC cluster sync for cross-border transit contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((t) => (
            <div key={t.code} className="p-4 bg-[#181818] border border-[#2a2a2a] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                    {t.code}
                  </span>
                  <span className="text-sm font-semibold text-[#F5F5F5]">{t.name}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    t.activeInProduction
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-[#222] text-[#777]'
                  }`}
                >
                  {t.activeInProduction ? 'PRODUCTION' : 'PILOT'}
                </span>
              </div>

              <div className="text-xs text-[#A0A0A0] space-y-1">
                <div>
                  <span className="text-[#CCC]">Data Residency: </span>
                  <span className="font-mono text-[11px] text-[#D4AF37]">{t.dataResidencyPolicy}</span>
                </div>
                <div>
                  <span className="text-[#CCC]">Regulatory Body: </span>
                  <span>{t.regulatoryBody}</span>
                </div>
                <div>
                  <span className="text-[#CCC]">Timezone: </span>
                  <span className="font-mono">{t.timeZone}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#262626] flex flex-wrap gap-1">
                {t.paymentProvidersAvailable.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className="text-[10px] font-mono bg-[#111] text-[#A0A0A0] px-1.5 py-0.5 rounded border border-[#2e2e2e]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Border Customs Dossier Checklist */}
      <div className="bg-[#121212] border border-[#222] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-base font-bold text-[#F5F5F5]">EAC Simplified Trade Regime (STR) Customs Dossier</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#F5F5F5]">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Certificate of Origin</span>
            </div>
            <p className="text-[#A0A0A0]">
              EAC rule-of-origin verification verifying commodities are wholly produced within East Africa (Duty-Free access).
            </p>
          </div>

          <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#F5F5F5]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Phytosanitary Clearance</span>
            </div>
            <p className="text-[#A0A0A0]">
              MAAIF inspection certificate certifying grain moisture &lt; 13.5% and free from aflatoxin contamination.
            </p>
          </div>

          <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#F5F5F5]">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>STR Declaration Under $2,000</span>
            </div>
            <p className="text-[#A0A0A0]">
              Expedited border clearance at Malaba, Busia, Mutukula, and Katuna for smallholder cross-border aggregators.
            </p>
          </div>

          <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#F5F5F5]">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>COMESA Yellow Card</span>
            </div>
            <p className="text-[#A0A0A0]">
              Third-party motor vehicle insurance valid across Uganda, Kenya, Rwanda, and South Sudan transport corridors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
