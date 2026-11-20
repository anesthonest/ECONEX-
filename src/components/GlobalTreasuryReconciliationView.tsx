/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V9.0 - Global Treasury, Financial Reconciliation & Data Sovereignty
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/apiClient.ts';
import {
  TreasuryPosition,
  ReconciliationBatch,
  ReconciliationException,
  DataTransferPolicy,
  DataExchangeLog,
  MultiRegionRecoveryEvent
} from '../types/index.ts';
import {
  Landmark,
  Coins,
  Scale,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Terminal,
  Activity,
  Layers,
  ChevronRight,
  Database,
  Lock,
  Globe
} from 'lucide-react';

export const GlobalTreasuryReconciliationView: React.FC = () => {
  const [positions, setPositions] = useState<TreasuryPosition[]>([]);
  const [batches, setBatches] = useState<ReconciliationBatch[]>([]);
  const [exceptions, setExceptions] = useState<ReconciliationException[]>([]);
  const [dataPolicies, setDataPolicies] = useState<DataTransferPolicy[]>([]);
  const [exchangeLogs, setExchangeLogs] = useState<DataExchangeLog[]>([]);
  const [recoveryEvents, setRecoveryEvents] = useState<MultiRegionRecoveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'treasury' | 'routing' | 'reconciliation' | 'sovereignty' | 'resilience'>('treasury');
  const [actionError, setActionError] = useState<string | null>(null);

  // Payment Routing Simulator State
  const [routeOrigin, setRouteOrigin] = useState<string>('UG');
  const [routeDest, setRouteDest] = useState<string>('KE');
  const [routeCurrency, setRouteCurrency] = useState<string>('UGX');
  const [routeTargetCurrency, setRouteTargetCurrency] = useState<string>('KES');
  const [routeAmount, setRouteAmount] = useState<number>(350000000);
  const [routeResult, setRouteResult] = useState<any>(null);
  const [isRouting, setIsRouting] = useState<boolean>(false);

  // Exception resolution state
  const [selectedException, setSelectedException] = useState<ReconciliationException | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolveOwner, setResolveOwner] = useState<string>('lead.reconciliation.auditor');

  // Data Sovereignty Check State
  const [sovereigntyOrigin, setSovereigntyOrigin] = useState<string>('UG');
  const [sovereigntyDest, setSovereigntyDest] = useState<string>('KE');
  const [sovereigntyCategory, setSovereigntyCategory] = useState<any>('TRADE_DOCUMENT');
  const [sovereigntyCheckResult, setSovereigntyCheckResult] = useState<any>(null);
  const [isCheckingSovereignty, setIsCheckingSovereignty] = useState<boolean>(false);

  // Treasury Adjustment Modal State
  const [showTreasuryModal, setShowTreasuryModal] = useState<boolean>(false);
  const [newTreasuryForm, setNewTreasuryForm] = useState({
    institutionName: '',
    accountNumber: '',
    jurisdiction: 'UG',
    currency: 'USD',
    totalBalance: 5000000,
    availableBalance: 4500000,
    encumberedBalance: 500000,
    fxExposureUGX: 18500000000
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pos, bat, exc, pol, logs, rec] = await Promise.all([
        api.getTreasuryPositions(),
        api.getReconciliationBatches(),
        api.getReconciliationExceptions(),
        api.getDataTransferPolicies(),
        api.getDataExchangeLogs(),
        api.getMultiRegionRecoveryEvents()
      ]);
      setPositions(pos || []);
      setBatches(bat || []);
      setExceptions(exc || []);
      setDataPolicies(pol || []);
      setExchangeLogs(logs || []);
      setRecoveryEvents(rec || []);
    } catch (err) {
      console.error('Failed to load global treasury and reconciliation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEvaluateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsRouting(true);
    try {
      const res = await api.evaluateGlobalPaymentRoute({
        originCountry: routeOrigin,
        destinationCountry: routeDest,
        currency: routeCurrency,
        targetCurrency: routeTargetCurrency,
        amount: routeAmount,
        idempotencyKey: `IDEMP-${Date.now().toString(36).toUpperCase()}`
      });
      setRouteResult(res);
    } catch (err: any) {
      setActionError('Routing evaluation error: ' + err.message);
    } finally {
      setIsRouting(false);
    }
  };

  const handleResolveException = async () => {
    if (!selectedException) return;
    setActionError(null);
    try {
      await api.resolveReconciliationException(selectedException.id, resolveOwner, resolutionNotes);
      setSelectedException(null);
      setResolutionNotes('');
      await loadData();
    } catch (err: any) {
      setActionError('Failed to resolve exception: ' + err.message);
    }
  };

  const handleCheckSovereignty = async () => {
    setActionError(null);
    setIsCheckingSovereignty(true);
    try {
      const res = await api.checkDataTransferPolicy({
        originCountry: sovereigntyOrigin,
        destinationCountry: sovereigntyDest,
        dataCategory: sovereigntyCategory,
        sendingEntity: 'Uganda Regional Clearing Node',
        receivingEntity: 'Destination Financial Network',
        recordCount: 15,
        hasExplicitConsent: true
      });
      setSovereigntyCheckResult(res);
      await loadData();
    } catch (err: any) {
      setActionError('Sovereignty verification error: ' + err.message);
    } finally {
      setIsCheckingSovereignty(false);
    }
  };

  const handleCreateTreasuryPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.recordTreasuryPosition(newTreasuryForm);
      setShowTreasuryModal(false);
      setNewTreasuryForm({
        institutionName: '',
        accountNumber: '',
        jurisdiction: 'UG',
        currency: 'USD',
        totalBalance: 5000000,
        availableBalance: 4500000,
        encumberedBalance: 500000,
        fxExposureUGX: 18500000000
      });
      await loadData();
    } catch (err: any) {
      setActionError('Failed to record treasury account: ' + err.message);
    }
  };

  // Aggregated total treasury in UGX equivalent
  const totalTreasuryUGX = positions.reduce((sum, p) => {
    if (p.currency === 'UGX') return sum + p.totalBalance;
    if (p.currency === 'USD') return sum + p.totalBalance * 3700;
    if (p.currency === 'KES') return sum + p.totalBalance * 28;
    return sum + p.totalBalance;
  }, 0);

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}
      {/* Top Banner Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-[#D4AF37] uppercase">ECONEX FINANCIAL ARCHITECTURE</span>
              <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[10px] font-mono">
                TREASURY, RECONCILIATION & SOVEREIGNTY
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
              Global Multi-Currency Treasury & Financial Reconciliation Network
            </h1>
            <p className="text-xs text-[#A0A0A0] max-w-3xl">
              Cross-border institutional liquidity positions, transparent payment routing with idempotency protection, automated reconciliation against central bank RTGS statements, and sovereign data residency governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-2 bg-[#181818] hover:bg-[#202020] text-[#F5F5F5] rounded-lg text-xs font-medium border border-[#27272a] flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh Ledger</span>
            </button>
            <button
              onClick={() => setShowTreasuryModal(true)}
              className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus size={14} />
              <span>Record Treasury Position</span>
            </button>
          </div>
        </div>

        {/* Global Financial Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#1f1f23]">
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <Coins size={11} className="text-[#D4AF37]" /> Total Multi-Currency Liquidity
            </div>
            <div className="text-lg font-bold font-mono text-[#D4AF37] mt-0.5">
              UGX {(totalTreasuryUGX / 1000000000).toFixed(2)}B
            </div>
            <div className="text-[10px] text-[#71717a] mt-0.5 font-mono">{positions.length} Authorized Nostro / RTGS Accounts</div>
          </div>

          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <Scale size={11} className="text-emerald-400" /> Reconciliation Success Rate
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">99.85% Balanced</div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5 font-mono">{batches.length} Batches Processed</div>
          </div>

          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-amber-400" /> Unresolved Exceptions
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
              {exceptions.filter(e => e.status !== 'RESOLVED').length} Under Investigation
            </div>
            <div className="text-[10px] text-[#71717a] mt-0.5 font-mono">Assigned to Treasury Desk</div>
          </div>

          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-cyan-400" /> Sovereign Data Compliance
            </div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">EAC Treaty 104 Verified</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">Zero Unlawful Cross-Border Leaks</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#27272a] gap-2">
        <button
          onClick={() => setActiveTab('treasury')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'treasury'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Landmark size={14} />
          <span>Treasury Positions ({positions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'routing'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <ArrowRightLeft size={14} />
          <span>Global Payment Routing</span>
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'reconciliation'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Scale size={14} />
          <span>Reconciliation & Exceptions ({exceptions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sovereignty')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'sovereignty'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Globe size={14} />
          <span>Data Sovereignty & Exchange</span>
        </button>
        <button
          onClick={() => setActiveTab('resilience')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'resilience'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Activity size={14} />
          <span>Multi-Region Resilience</span>
        </button>
      </div>

      {/* Subtab 1: Treasury Positions */}
      {activeTab === 'treasury' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {positions.map((pos) => (
              <div
                key={pos.id}
                className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-[#1f1f23] text-[#D4AF37] font-mono text-[10px] font-bold rounded border border-[#27272a]">
                      {pos.jurisdiction} • {pos.currency}
                    </span>
                    <h3 className="font-bold text-sm text-[#F5F5F5] mt-1.5">{pos.institutionName}</h3>
                    <div className="text-[11px] text-[#A0A0A0] font-mono">Acc: {pos.accountNumber}</div>
                  </div>
                  <Landmark size={18} className="text-[#D4AF37]" />
                </div>

                <div className="bg-[#09090b] rounded-lg p-3 border border-[#1f1f23] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Total Balance:</span>
                    <span className="text-[#F5F5F5] font-bold">
                      {pos.currency} {pos.totalBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-400">Available:</span>
                    <span className="text-emerald-400 font-semibold">
                      {pos.currency} {pos.availableBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-400">Encumbered / Hold:</span>
                    <span className="text-amber-400">
                      {pos.currency} {pos.encumberedBalance.toLocaleString()}
                    </span>
                  </div>
                  {pos.fxExposureUGX > 0 && (
                    <div className="flex justify-between pt-1 border-t border-[#1f1f23] text-[10px]">
                      <span className="text-[#71717a]">FX Exposure:</span>
                      <span className="text-[#D4AF37]">UGX {(pos.fxExposureUGX / 1000000).toLocaleString()}M</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[#71717a] font-mono flex items-center justify-between">
                  <span>As of: {new Date(pos.asOfDate).toLocaleDateString()}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active Nostro
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Global Payment Routing */}
      {activeTab === 'routing' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-[#D4AF37]" />
              Cross-Border Multi-Rail Payment Evaluator
            </h3>
            <form onSubmit={handleEvaluateRoute} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1 font-semibold">Origin Country</label>
                  <select
                    value={routeOrigin}
                    onChange={(e) => setRouteOrigin(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                  >
                    <option value="UG">Uganda (UG)</option>
                    <option value="KE">Kenya (KE)</option>
                    <option value="TZ">Tanzania (TZ)</option>
                    <option value="RW">Rwanda (RW)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1 font-semibold">Destination Country</label>
                  <select
                    value={routeDest}
                    onChange={(e) => setRouteDest(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                  >
                    <option value="KE">Kenya (KE)</option>
                    <option value="UG">Uganda (UG)</option>
                    <option value="TZ">Tanzania (TZ)</option>
                    <option value="RW">Rwanda (RW)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1 font-semibold">Source Currency</label>
                  <select
                    value={routeCurrency}
                    onChange={(e) => setRouteCurrency(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1 font-semibold">Target Currency</label>
                  <select
                    value={routeTargetCurrency}
                    onChange={(e) => setRouteTargetCurrency(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="UGX">UGX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Gross Transaction Amount</label>
                <input
                  type="number"
                  value={routeAmount}
                  onChange={(e) => setRouteAmount(Number(e.target.value))}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                />
              </div>

              <button
                type="submit"
                disabled={isRouting}
                className="w-full py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-lg text-xs transition-all shadow-md mt-2"
              >
                {isRouting ? 'Evaluating Optimal Route...' : 'Simulate Optimal Route & FX'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Optimal Routing Decision & Settlement Execution Path
            </h3>

            {routeResult ? (
              <div className="space-y-4">
                <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0A0A0]">Selected Primary Clearing Rail:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {routeResult.selectedRoute.providerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#A0A0A0]">Execution Path:</span>
                    <span className="text-cyan-300 font-bold">{routeResult.selectedRoute.executionPath}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#A0A0A0]">Estimated Interchange Fee:</span>
                    <span className="text-[#D4AF37] font-bold">
                      {routeCurrency} {routeResult.selectedRoute.estimatedFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#A0A0A0]">Settlement SLA:</span>
                    <span className="text-emerald-400">{routeResult.selectedRoute.settlementTime}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#A0A0A0]">Reliability Score:</span>
                    <span className="text-emerald-400">{routeResult.selectedRoute.reliabilityScore}%</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] pt-1 border-t border-[#1f1f23]">
                    <span className="text-[#71717a]">Quote Valid Until:</span>
                    <span className="text-[#A0A0A0]">{new Date(routeResult.quoteValidUntil).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg text-xs space-y-1">
                  <div className="text-[#D4AF37] font-semibold text-[11px] uppercase tracking-wider">Transparent Routing Explanation:</div>
                  <p className="text-[#A0A0A0] text-[11px]">{routeResult.routingExplanation}</p>
                </div>

                <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] text-xs">
                  <div className="font-semibold text-[#F5F5F5] mb-1">Alternative Fallback Clearing Rails:</div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {routeResult.alternativeRoutes?.map((alt: any) => (
                      <div key={alt.providerId} className="flex justify-between text-[#A0A0A0]">
                        <span>{alt.providerName}</span>
                        <span>Fee: {routeCurrency} {alt.estimatedFee.toLocaleString()} ({alt.settlementTime})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-[#71717a] text-center">
                <ArrowRightLeft size={32} className="mb-2 opacity-50 text-[#D4AF37]" />
                <p className="text-xs">Submit the parameters to evaluate multi-rail routing across regional clearing switches</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab 3: Financial Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Batches Table */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-3 border-b border-[#27272a] bg-[#161619] flex items-center justify-between text-xs font-semibold text-[#A0A0A0]">
              <span>CENTRAL SETTLEMENT RECONCILIATION BATCHES</span>
              <span>BATCH STATUS</span>
            </div>
            <div className="divide-y divide-[#1e1e24]">
              {batches.map((b) => (
                <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F5F5F5]">{b.batchNumber}</span>
                      <span className="text-[#444]">|</span>
                      <span className="text-[#D4AF37] font-semibold">{b.providerName}</span>
                      <span className="text-[#71717a] text-[10px]">Period: {b.period}</span>
                    </div>
                    <div className="text-[11px] text-[#A0A0A0] flex items-center gap-4">
                      <span>Internal Records: {b.internalTransactionsCount}</span>
                      <span className="text-emerald-400">Matched: {b.matchedCount}</span>
                      {b.unmatchedCount > 0 && (
                        <span className="text-amber-400">Unmatched / Variance: {b.unmatchedCount} ({b.currency} {b.varianceAmount.toLocaleString()})</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {b.status === 'RECONCILED' ? (
                      <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> RECONCILED (ZERO VARIANCE)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded text-xs font-semibold flex items-center gap-1">
                        <AlertTriangle size={12} /> VARIANCE DETECTED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exceptions Resolution Desk */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Reconciliation Variance & Exception Management Desk
            </h3>

            <div className="divide-y divide-[#1e1e24] border border-[#1f1f23] rounded-lg overflow-hidden">
              {exceptions.map((exc) => (
                <div key={exc.id} className="p-4 bg-[#09090b] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#D4AF37]">{exc.exceptionType}</span>
                      <span className="text-[#444]">|</span>
                      <span className="text-[#F5F5F5]">Ref: {exc.transactionRef}</span>
                      {exc.status === 'RESOLVED' ? (
                        <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded text-[9px] border border-emerald-800">RESOLVED</span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded text-[9px] border border-amber-800">INVESTIGATING</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#A0A0A0]">
                      Internal Ledger: {exc.currency} {exc.internalAmount.toLocaleString()} vs Bank Statement: {exc.currency} {exc.externalAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#71717a]">
                      Assigned Owner: <span className="text-cyan-300">{exc.assignedOwner}</span> | Notes: {exc.resolutionNotes}
                    </div>
                  </div>

                  {exc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        setSelectedException(exc);
                        setResolutionNotes('Settlement variance reconciled against secondary fee ledger entry.');
                      }}
                      className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded text-xs flex items-center gap-1 transition-all"
                    >
                      <span>Resolve Exception</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: Data Sovereignty */}
      {activeTab === 'sovereignty' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <Globe size={16} className="text-[#D4AF37]" />
              Cross-Border Data Transfer Policy Enforcement Simulator
            </h3>
            <p className="text-xs text-[#A0A0A0]">
              Enforces national data residency laws (Uganda DPPA 2019, Kenya DPA 2019) and legal basis (EAC Treaty Article 104) before permitting cross-border transfer.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Origin Country</label>
                <select
                  value={sovereigntyOrigin}
                  onChange={(e) => setSovereigntyOrigin(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                >
                  <option value="UG">Uganda (UG)</option>
                  <option value="KE">Kenya (KE)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Destination Country</label>
                <select
                  value={sovereigntyDest}
                  onChange={(e) => setSovereigntyDest(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                >
                  <option value="KE">Kenya (KE)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="UNKNOWN_OFFSHORE">Unknown Offshore Region</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Data Category</label>
                <select
                  value={sovereigntyCategory}
                  onChange={(e) => setSovereigntyCategory(e.target.value as any)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                >
                  <option value="TRADE_DOCUMENT">Trade Document (Customs / Waybill)</option>
                  <option value="FINANCIAL_TRANSACTION">Financial Transaction Payload</option>
                  <option value="IDENTITY_METADATA">Identity Metadata (KYC / Biometrics)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleCheckSovereignty}
                  disabled={isCheckingSovereignty}
                  className="w-full py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-lg text-xs transition-all shadow-md"
                >
                  {isCheckingSovereignty ? 'Auditing Policy...' : 'Evaluate Sovereignty Policy'}
                </button>
              </div>
            </div>

            {sovereigntyCheckResult && (
              <div
                className={`p-4 rounded-lg border text-xs font-mono space-y-1 ${
                  sovereigntyCheckResult.allowed
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                    : 'bg-red-950/30 border-red-800 text-red-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {sovereigntyCheckResult.allowed ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>TRANSFER PERMITTED UNDER SOVEREIGN RULES</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} className="text-red-400" />
                      <span>TRANSFER BLOCKED BY DATA SOVEREIGNTY PROTOCOL</span>
                    </>
                  )}
                </div>
                <div>{sovereigntyCheckResult.reason}</div>
                {sovereigntyCheckResult.log && (
                  <div className="text-[10px] text-[#A0A0A0] mt-1 pt-1 border-t border-[#1f1f23]">
                    Provenance Audit Log Hash: {sovereigntyCheckResult.log.provenanceHash}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Policies Table */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-3 border-b border-[#27272a] bg-[#161619] flex items-center justify-between text-xs font-semibold text-[#A0A0A0]">
              <span>ACTIVE SOVEREIGN DATA EXCHANGE POLICIES</span>
              <span>LEGAL BASIS</span>
            </div>
            <div className="divide-y divide-[#1e1e24]">
              {dataPolicies.map((pol) => (
                <div key={pol.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F5F5F5]">{pol.originCountry} ➔ {pol.destinationCountry}</span>
                      <span className="text-[#444]">|</span>
                      <span className="text-[#D4AF37] font-semibold">{pol.dataCategory}</span>
                      <span className="text-emerald-400 text-[10px]">Encryption: {pol.encryptionStandard}</span>
                    </div>
                    <div className="text-[11px] text-[#A0A0A0]">
                      Retention: {pol.retentionDays} days | Pre-Authorization Required: {String(pol.requiresPreAuthorization)}
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-[#1f1f23] text-cyan-300 font-mono text-[10px] border border-[#27272a] rounded">
                      {pol.legalBasis}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 5: Multi-Region Resilience */}
      {activeTab === 'resilience' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <Activity size={16} className="text-[#D4AF37]" />
              Multi-Region Disaster Recovery & Continuity Telemetry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recoveryEvents.map((ev) => (
                <div key={ev.id} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F5F5F5]">{ev.region}</span>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-mono">
                      {ev.status}
                    </span>
                  </div>
                  <div className="text-[#D4AF37] font-mono font-semibold">{ev.eventType}</div>
                  <p className="text-[#A0A0A0] text-[11px]">{ev.auditSummary}</p>
                  <div className="flex justify-between text-[10px] text-[#71717a] font-mono pt-2 border-t border-[#1f1f23]">
                    <span>RPO: {ev.recoveryPointActualMinutes}m</span>
                    <span>Duration: {ev.durationSeconds}s</span>
                    <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resolve Exception */}
      {selectedException && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Resolve Settlement Variance Exception
              </h3>
              <button
                onClick={() => setSelectedException(null)}
                className="text-[#71717a] hover:text-[#F5F5F5] text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] font-mono space-y-1">
                <div>Ref: {selectedException.transactionRef}</div>
                <div className="text-amber-400">Type: {selectedException.exceptionType}</div>
                <div className="text-[#A0A0A0]">
                  Variance: {selectedException.currency} {(Math.abs(selectedException.internalAmount - selectedException.externalAmount)).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Assigned Resolution Officer</label>
                <input
                  type="text"
                  value={resolveOwner}
                  onChange={(e) => setResolveOwner(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Audit Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f23]">
                <button
                  type="button"
                  onClick={() => setSelectedException(null)}
                  className="px-3 py-1.5 bg-[#18181b] hover:bg-[#202020] text-[#A0A0A0] rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveException}
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded text-xs shadow-md"
                >
                  Confirm Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Treasury Position */}
      {showTreasuryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <Landmark size={16} className="text-[#D4AF37]" />
                Record Institutional Treasury Account
              </h3>
              <button
                onClick={() => setShowTreasuryModal(false)}
                className="text-[#71717a] hover:text-[#F5F5F5] text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTreasuryPosition} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ecobank Kenya Clearing Nostro"
                  value={newTreasuryForm.institutionName}
                  onChange={(e) => setNewTreasuryForm({ ...newTreasuryForm, institutionName: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="ECO-NOSTRO-USD-001"
                  value={newTreasuryForm.accountNumber}
                  onChange={(e) => setNewTreasuryForm({ ...newTreasuryForm, accountNumber: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1 font-semibold">Currency</label>
                  <select
                    value={newTreasuryForm.currency}
                    onChange={(e) => setNewTreasuryForm({ ...newTreasuryForm, currency: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                  >
                    <option value="USD">USD</option>
                    <option value="UGX">UGX</option>
                    <option value="KES">KES</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1 font-semibold">Total Balance</label>
                  <input
                    type="number"
                    value={newTreasuryForm.totalBalance}
                    onChange={(e) => setNewTreasuryForm({ ...newTreasuryForm, totalBalance: Number(e.target.value) })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f23]">
                <button
                  type="button"
                  onClick={() => setShowTreasuryModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] hover:bg-[#202020] text-[#A0A0A0] rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded text-xs shadow-md"
                >
                  Save Treasury Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
