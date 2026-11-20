/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V6.0 - Capital Access & Investment Infrastructure (AETHER CAPITAL & INVESTMENT)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.ts';
import {
  CapitalFinancingApplication,
  InvestmentOpportunity,
  EconomicAsset,
} from '../../types/index.ts';
import {
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  Coins,
  FileCheck2,
  FileText,
  Landmark,
  Percent,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const CapitalAndInvestmentView: React.FC = () => {
  const [applications, setApplications] = useState<CapitalFinancingApplication[]>([]);
  const [investments, setInvestments] = useState<InvestmentOpportunity[]>([]);
  const [assets, setAssets] = useState<EconomicAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CAPITAL' | 'INVESTMENTS' | 'ASSETS'>('CAPITAL');

  // New Application Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyType, setApplyType] = useState<CapitalFinancingApplication['facilityType']>('WORKING_CAPITAL');
  const [applyAmount, setApplyAmount] = useState<number>(150000000);
  const [applyCurrency, setApplyCurrency] = useState('UGX');
  const [applyPurpose, setApplyPurpose] = useState('Expansion of warehouse capacity and inventory purchase');
  const [applyRevenue, setApplyRevenue] = useState<number>(2500000000);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');

  // Subscription Modal State
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentOpportunity | null>(null);
  const [subAmount, setSubAmount] = useState<number>(10000000);
  const [subSuccessMsg, setSubSuccessMsg] = useState('');

  // New Asset Modal State
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<EconomicAsset['assetCategory']>('INDUSTRIAL_MACHINERY');
  const [assetValuation, setAssetValuation] = useState<number>(500000000);
  const [assetCurrency, setAssetCurrency] = useState('UGX');
  const [assetRef, setAssetRef] = useState('');
  const [assetEvaluator, setAssetEvaluator] = useState('Certified Engineering & Valuations Board');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appList, invList, astList] = await Promise.all([
        api.getCapitalApplications(),
        api.getInvestmentOpportunities(),
        api.getEconomicAssets(),
      ]);
      setApplications(Array.isArray(appList) ? appList : []);
      setInvestments(Array.isArray(invList) ? invList : []);
      setAssets(Array.isArray(astList) ? astList : []);
    } catch (err) {
      console.error('Failed to load capital data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingApply(true);
    setApplySuccessMsg('');
    try {
      const res = await api.applyForCapital({
        applicantId: 'PART-UG-001',
        facilityType: applyType,
        requestedAmount: Number(applyAmount),
        currency: applyCurrency,
        purpose: applyPurpose,
        annualRevenue: Number(applyRevenue),
      });
      setApplySuccessMsg(`Application approved! Matched with ${res.matchedProvider} at indicative APR of ${res.indicativeApr}%.`);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccessMsg('');
        fetchData();
      }, 1800);
    } catch (err: any) {
      setApplySuccessMsg(`Error: ${err.message || 'Application failed'}`);
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment) return;
    try {
      const res = await api.subscribeToInvestment(selectedInvestment.id, Number(subAmount), 'PART-UG-001');
      setSubSuccessMsg(`Subscription ${res.subscriptionReference} confirmed into secure escrow.`);
      setTimeout(() => {
        setSelectedInvestment(null);
        setSubSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setSubSuccessMsg(`Error: ${err.message || 'Subscription failed'}`);
    }
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName) return;
    try {
      await api.registerEconomicAsset({
        ownerParticipantId: 'PART-UG-001',
        assetCategory,
        assetName,
        registrationReference: assetRef || `REG-${Date.now().toString().slice(-6)}`,
        jurisdiction: 'Republic of Uganda',
        estimatedValuation: Number(assetValuation),
        valuationCurrency: assetCurrency,
        certifiedEvaluator: assetEvaluator,
      });
      setShowAssetModal(false);
      setAssetName('');
      setAssetRef('');
      fetchData();
    } catch (err) {
      console.error('Failed to register asset:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">ECONEX CAPITAL & ASSETS</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c1c1f] text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
              Capital Access & Asset Economy
            </span>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Structured capital access with institutional underwriting, sovereign securities discovery, and multi-category asset registration.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab('CAPITAL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'CAPITAL' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Capital Access ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('INVESTMENTS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'INVESTMENTS' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Sovereign & Market Securities ({investments.length})
          </button>
          <button
            onClick={() => setActiveTab('ASSETS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'ASSETS' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Asset Registry ({assets.length})
          </button>
        </div>
      </div>

      {/* VIEW: CAPITAL ACCESS */}
      {activeTab === 'CAPITAL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Commercial Financing Facilities</h2>
              <p className="text-xs text-[#A0A0A0]">
                Direct matchmaking with licensed commercial banks and development finance institutions without predatory terms.
              </p>
            </div>
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors"
            >
              <Plus size={14} />
              <span>Apply for Financing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#D4AF37] text-xs">{app.facilityType}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {app.status}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-[#A0A0A0]">Facility Requested Amount</div>
                  <div className="text-xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-0.5">
                    {app.requestedAmount.toLocaleString()} {app.currency}
                  </div>
                  <p className="text-xs text-[#A0A0A0] mt-1 line-clamp-2">{app.purpose}</p>
                </div>

                <div className="pt-3 border-t border-[#1e1e24] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#A0A0A0]">Matched Provider:</span>
                    <div className="font-medium text-[#F5F5F5]">{app.matchedProvider}</div>
                  </div>
                  <div>
                    <span className="text-[#A0A0A0]">Indicative APR / Tenor:</span>
                    <div className="font-mono text-[#D4AF37]">{app.indicativeApr}% · {app.repaymentMonths} Months</div>
                  </div>
                </div>

                {app.repaymentSchedule && app.repaymentSchedule.length > 0 && (
                  <div className="pt-2 text-[11px] text-[#71717a]">
                    Month 1 Due: <strong className="text-[#A0A0A0]">{app.repaymentSchedule[0].totalDue.toLocaleString()} {app.currency}</strong> (Due {app.repaymentSchedule[0].dueDate})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: INVESTMENTS */}
      {activeTab === 'INVESTMENTS' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#F5F5F5]">Sovereign Securities & Infrastructure Capital</h2>
            <p className="text-xs text-[#A0A0A0]">
              Regulated investment discovery across Bank of Uganda Treasury Bills, regional green bonds, and industrial growth funds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {investments.map((inv) => (
              <div key={inv.id} className="bg-[#121212] border border-[#27272a] rounded-lg p-5 flex flex-col justify-between hover:border-[#D4AF37]/50 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#D4AF37]">{inv.instrumentType}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1c1c1f] text-emerald-400 border border-[#27272a]">
                      Rating: {inv.riskRating}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F5F5F5] leading-snug">{inv.title}</h3>
                  <p className="text-xs text-[#A0A0A0] line-clamp-3">{inv.summary}</p>

                  <div className="pt-2 text-[11px] text-[#71717a]">
                    Issuer: <strong className="text-[#A0A0A0]">{inv.issuer}</strong>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#1e1e24] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0A0A0]">Indicative Yield:</span>
                    <span className="font-mono text-base font-bold text-emerald-400">{inv.indicativeYieldPercent}% p.a.</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0A0A0]">Tenor:</span>
                    <span className="font-mono text-[#F5F5F5]">{inv.tenorMonths} Months</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A0A0A0]">Min Subscription:</span>
                    <span className="font-mono text-[#F5F5F5]">{inv.minimumSubscription.toLocaleString()} {inv.currency}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInvestment(inv);
                      setSubAmount(inv.minimumSubscription);
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded transition-colors"
                  >
                    Subscribe into Escrow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ASSETS */}
      {activeTab === 'ASSETS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Economic Asset Registry & Valuation</h2>
              <p className="text-xs text-[#A0A0A0]">
                Verified title deeds, heavy industrial machinery, vehicle fleets, and intellectual property records.
              </p>
            </div>
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors"
            >
              <Plus size={14} />
              <span>Register Asset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((ast) => (
              <div key={ast.id} className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#D4AF37]">{ast.assetCategory}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    ast.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {ast.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F5]">{ast.assetName}</h3>
                  <div className="text-xs text-[#A0A0A0] mt-0.5">
                    Registration Ref: <span className="font-mono text-[#D4AF37]">{ast.registrationReference}</span>
                  </div>
                  <div className="text-[11px] text-[#71717a] mt-0.5">Jurisdiction: {ast.jurisdiction}</div>
                </div>

                <div className="p-3 bg-[#18181b] rounded border border-[#27272a] flex justify-between items-center text-xs">
                  <span className="text-[#A0A0A0]">Certified Valuation:</span>
                  <span className="font-mono font-bold text-[#F5F5F5] tabular-nums">
                    {ast.estimatedValuation.toLocaleString()} {ast.valuationCurrency}
                  </span>
                </div>

                <div className="text-[11px] text-[#71717a]">
                  Evaluator: {ast.certifiedEvaluator} · Owner: <strong className="text-[#A0A0A0]">{ast.ownerName}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Apply for Financing */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Apply for Enterprise Credit Facility</h3>
            <form onSubmit={handleApplyCapital} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Facility Category</label>
                <select
                  value={applyType}
                  onChange={(e) => setApplyType(e.target.value as CapitalFinancingApplication['facilityType'])}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                >
                  <option value="WORKING_CAPITAL">Working Capital Liquidity Facility</option>
                  <option value="PURCHASE_ORDER">Purchase Order & Contract Financing</option>
                  <option value="INVOICE_DISCOUNTING">Invoice Factoring & Discounting</option>
                  <option value="EQUIPMENT_LEASE">Industrial Equipment Lease Financing</option>
                  <option value="TRADE_FINANCE">Cross-Border Trade Finance Letter of Credit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Requested Amount</label>
                  <input
                    type="number"
                    min="1000000"
                    required
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Currency</label>
                  <select
                    value={applyCurrency}
                    onChange={(e) => setApplyCurrency(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Annual Business Revenue (UGX)</label>
                <input
                  type="number"
                  min="10000000"
                  required
                  value={applyRevenue}
                  onChange={(e) => setApplyRevenue(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Purpose & Use of Funds</label>
                <textarea
                  rows={2}
                  value={applyPurpose}
                  onChange={(e) => setApplyPurpose(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              {applySuccessMsg && (
                <div className={`p-2 rounded text-xs ${applySuccessMsg.startsWith('Error') ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                  {applySuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  {submittingApply ? 'Underwriting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Investment Subscription */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Subscribe to Securities Opportunity</h3>
            <div className="p-3 bg-[#18181b] rounded text-xs space-y-1">
              <div className="font-bold text-[#D4AF37]">{selectedInvestment.title}</div>
              <div className="text-[#A0A0A0]">Yield: {selectedInvestment.indicativeYieldPercent}% p.a. · Tenor: {selectedInvestment.tenorMonths} Mo</div>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">
                  Subscription Amount ({selectedInvestment.currency}) - Min: {selectedInvestment.minimumSubscription.toLocaleString()}
                </label>
                <input
                  type="number"
                  min={selectedInvestment.minimumSubscription}
                  required
                  value={subAmount}
                  onChange={(e) => setSubAmount(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              {subSuccessMsg && (
                <div className="p-2 rounded text-xs bg-emerald-950 text-emerald-300">
                  {subSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvestment(null)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Confirm Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Asset */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Register Economic Asset</h3>
            <form onSubmit={handleRegisterAsset} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50-Hectare Commercial Freehold Plot"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Asset Category</label>
                <select
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value as EconomicAsset['assetCategory'])}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                >
                  <option value="LAND">LAND</option>
                  <option value="BUILDING">BUILDING</option>
                  <option value="INDUSTRIAL_MACHINERY">INDUSTRIAL MACHINERY</option>
                  <option value="VEHICLE">VEHICLE / FLEET</option>
                  <option value="INTELLECTUAL_PROPERTY">INTELLECTUAL PROPERTY / PATENT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Estimated Valuation</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={assetValuation}
                    onChange={(e) => setAssetValuation(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Currency</label>
                  <select
                    value={assetCurrency}
                    onChange={(e) => setAssetCurrency(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Registration Reference / Deed No.</label>
                <input
                  type="text"
                  placeholder="e.g. FRH-MUK-2026-081"
                  value={assetRef}
                  onChange={(e) => setAssetRef(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
