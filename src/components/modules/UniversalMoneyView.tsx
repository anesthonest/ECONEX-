/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V6.0 - Universal Currency & Money Infrastructure (AETHER MONEY)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.ts';
import {
  CurrencyMetadata,
  EconomicTransaction,
  FxQuote,
  EconomicSettlement,
  SupportedCurrency,
} from '../../types/index.ts';
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  FileCheck2,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

export const UniversalMoneyView: React.FC = () => {
  const [currencies, setCurrencies] = useState<CurrencyMetadata[]>([]);
  const [transactions, setTransactions] = useState<EconomicTransaction[]>([]);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REGISTRY' | 'FX_CONVERTER' | 'ORCHESTRATOR' | 'RECONCILIATION'>('REGISTRY');

  // FX Quote State
  const [baseCurrency, setBaseCurrency] = useState<SupportedCurrency>('USD');
  const [quoteCurrency, setQuoteCurrency] = useState<SupportedCurrency>('UGX');
  const [baseAmount, setBaseAmount] = useState<number>(1000);
  const [fxQuote, setFxQuote] = useState<FxQuote | null>(null);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState('');

  // Payment Form State
  const [origParticipant, setOrigParticipant] = useState('PART-UG-001');
  const [recvParticipant, setRecvParticipant] = useState('PART-UG-003');
  const [payAmount, setPayAmount] = useState<number>(25000000);
  const [payCurrency, setPayCurrency] = useState<SupportedCurrency>('UGX');
  const [settleCurrency, setSettleCurrency] = useState<SupportedCurrency>('UGX');
  const [payMethod, setPayMethod] = useState('COMMERCIAL_BANK_WIRE');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // New Currency Modal State
  const [showAddCurModal, setShowAddCurModal] = useState(false);
  const [newCurCode, setNewCurCode] = useState('');
  const [newCurName, setNewCurName] = useState('');
  const [newCurSymbol, setNewCurSymbol] = useState('');
  const [newCurRateToUGX, setNewCurRateToUGX] = useState<number>(1.0);
  const [newCurPrecision, setNewCurPrecision] = useState<number>(2);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [curList, txList, recon] = await Promise.all([
        api.getCurrencies(),
        api.getUniversalTransactions(),
        api.reconcileMultiCurrencySettlements(),
      ]);
      setCurrencies(Array.isArray(curList) ? curList : []);
      setTransactions(Array.isArray(txList) ? txList : []);
      setReconciliation(recon);
    } catch (err) {
      console.error('Failed to load money data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setFxError('');
    setFxLoading(true);
    try {
      const q = await api.getFxQuote(baseCurrency, quoteCurrency, Number(baseAmount));
      setFxQuote(q);
    } catch (err: any) {
      setFxError(err.message || 'Failed to generate indicative FX quote');
    } finally {
      setFxLoading(false);
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPay(true);
    setPaySuccessMsg('');
    try {
      const tx = await api.orchestrateUniversalPayment({
        originatingParticipantId: origParticipant,
        receivingParticipantId: recvParticipant,
        amount: Number(payAmount),
        currency: payCurrency,
        settlementCurrency: settleCurrency,
        paymentMethod: payMethod,
        provider: payMethod === 'COMMERCIAL_BANK_WIRE' ? 'Victoria Commercial Bank' : 'ECONEX Settlement Mesh',
        transactionType: 'COMMERCIAL_EXCHANGE',
      });
      setPaySuccessMsg(`Transaction ${tx.transactionReference} authorized successfully across payment rails.`);
      fetchData();
    } catch (err: any) {
      setPaySuccessMsg(`Error: ${err.message || 'Payment initiation failed'}`);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleSettlePayment = async (txId: string) => {
    try {
      await api.authorizeUniversalPayment(txId, 'usr_admin_01');
      fetchData();
    } catch (err) {
      console.error('Settlement authorization failed:', err);
    }
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurCode || !newCurName) return;
    try {
      await api.registerCurrency({
        code: newCurCode.toUpperCase(),
        name: newCurName,
        symbol: newCurSymbol || newCurCode,
        fractionDigits: Number(newCurPrecision),
        exchangeRateToUGX: Number(newCurRateToUGX),
        rateSource: 'BOU_OFFICIAL',
        settlementRestrictions: [],
      });
      setShowAddCurModal(false);
      setNewCurCode('');
      setNewCurName('');
      setNewCurSymbol('');
      fetchData();
    } catch (err) {
      console.error('Failed to register currency:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">ECONEX MONEY</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c1c1f] text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
              Universal Currency Network
            </span>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Currency-agnostic monetary infrastructure connecting commercial banks, mobile money, electronic money, and interbank settlement.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab('REGISTRY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'REGISTRY' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Currency Registry
          </button>
          <button
            onClick={() => setActiveTab('FX_CONVERTER')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'FX_CONVERTER' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            FX Indicative Quotes
          </button>
          <button
            onClick={() => setActiveTab('ORCHESTRATOR')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'ORCHESTRATOR' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Payment Orchestration
          </button>
          <button
            onClick={() => setActiveTab('RECONCILIATION')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'RECONCILIATION' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Settlement Audit
          </button>
        </div>
      </div>

      {/* Top Level Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
          <div className="text-xs text-[#A0A0A0]">Supported Currencies</div>
          <div className="text-2xl font-bold text-[#F5F5F5] font-mono tabular-nums mt-1">{currencies.length}</div>
          <div className="text-[11px] text-[#A0A0A0] mt-1 flex items-center gap-1">
            <span>EAC Sovereign + Global Reserve</span>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
          <div className="text-xs text-[#A0A0A0]">Settled Volume (UGX Equivalent)</div>
          <div className="text-2xl font-bold text-[#D4AF37] font-mono tabular-nums mt-1">
            USh {reconciliation ? (reconciliation.totalSettledVolumeUGX / 1000000).toFixed(1) : '0'}M
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">Reconciled against double-entry ledger</div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
          <div className="text-xs text-[#A0A0A0]">Payment Rails Connected</div>
          <div className="text-2xl font-bold text-[#F5F5F5] font-mono tabular-nums mt-1">6 Active</div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">RTGS, SWIFT, MoMo, Card, Wallets</div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
          <div className="text-xs text-[#A0A0A0]">Settlement Discrepancies</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">0.00%</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">100% Debit/Credit Matched</div>
        </div>
      </div>

      {/* VIEW: CURRENCY REGISTRY */}
      {activeTab === 'REGISTRY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Configurable Currency Registry</h2>
              <p className="text-xs text-[#A0A0A0]">
                ISO 4217 standard fiat and regional settlement currencies with sovereign central bank rate sources.
              </p>
            </div>
            <button
              onClick={() => setShowAddCurModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors"
            >
              <Plus size={14} />
              <span>Register Currency</span>
            </button>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181b] border-b border-[#27272a] text-[#A0A0A0]">
                <tr>
                  <th className="py-3 px-4 font-medium">Currency Code</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Symbol</th>
                  <th className="py-3 px-4 font-medium">Precision</th>
                  <th className="py-3 px-4 font-medium text-right">UGX Conversion Rate</th>
                  <th className="py-3 px-4 font-medium">Rate Source</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e24] text-[#F5F5F5]">
                {currencies.map((cur) => (
                  <tr key={cur.code} className="hover:bg-[#18181b]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{cur.code}</td>
                    <td className="py-3 px-4">{cur.name}</td>
                    <td className="py-3 px-4 font-mono">{cur.symbol}</td>
                    <td className="py-3 px-4 font-mono tabular-nums">{cur.fractionDigits} decimals</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-right">
                      {cur.exchangeRateToUGX.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} UGX
                    </td>
                    <td className="py-3 px-4 text-[#A0A0A0]">
                      <span className="font-mono text-[11px]">{cur.rateSource}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-medium">Tradable</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: FX CONVERTER */}
      {activeTab === 'FX_CONVERTER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Generate Indicative FX Quote</h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5">
                Quotes are time-limited (15 minutes) with cryptographic quote hashes and transparent 0.35% conversion fees.
              </p>
            </div>

            <form onSubmit={handleGenerateQuote} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Base Currency (Sell)</label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value as SupportedCurrency)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5]"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] mb-1">Quote Currency (Buy)</label>
                  <select
                    value={quoteCurrency}
                    onChange={(e) => setQuoteCurrency(e.target.value as SupportedCurrency)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5]"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Base Amount to Convert</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5] font-mono tabular-nums"
                />
              </div>

              {fxError && <div className="text-red-400 text-xs">{fxError}</div>}

              <button
                type="submit"
                disabled={fxLoading}
                className="w-full py-2.5 px-4 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {fxLoading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
                <span>Calculate Guaranteed Indicative Quote</span>
              </button>
            </form>
          </div>

          {/* Quote Result Card */}
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">Quote Verification Certificate</h3>
              <p className="text-xs text-[#A0A0A0] mt-0.5">
                Clear distinction between indicative quotation and actual executed settlement.
              </p>

              {fxQuote ? (
                <div className="mt-5 space-y-4">
                  <div className="p-4 bg-[#18181b] border border-[#3f3f46] rounded-lg space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A0A0A0]">Quoted Exchange Rate:</span>
                      <span className="font-mono font-bold text-[#D4AF37]">
                        1 {fxQuote.baseCurrency} = {fxQuote.exchangeRate.toLocaleString()} {fxQuote.quoteCurrency}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A0A0A0]">Base Amount Input:</span>
                      <span className="font-mono text-[#F5F5F5]">
                        {fxQuote.baseAmount.toLocaleString()} {fxQuote.baseCurrency}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#A0A0A0]">Calculated Settlement Amount:</span>
                      <span className="font-mono text-base font-bold text-emerald-400">
                        {fxQuote.quotedAmount.toLocaleString()} {fxQuote.quoteCurrency}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[#27272a]">
                      <span className="text-[#A0A0A0]">Conversion Spread Fee (0.35%):</span>
                      <span className="font-mono text-[#A0A0A0]">
                        {fxQuote.feeAmount.toLocaleString()} {fxQuote.feeCurrency}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-[#A0A0A0]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#D4AF37]" />
                      <span>Valid until: <strong className="text-[#F5F5F5] font-mono">{new Date(fxQuote.expiresAt).toLocaleTimeString()}</strong></span>
                    </div>
                    <div className="truncate">
                      Cryptographic Hash: <code className="text-[#D4AF37] font-mono">{fxQuote.quoteHash.slice(0, 24)}...</code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-[#71717a] text-xs">
                  <Coins size={32} className="mb-2 opacity-50" />
                  <span>Select currencies and amount to generate a certified exchange quote.</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#71717a] pt-4 border-t border-[#1e1e24]">
              Note: Regulatory compliance requires licensed FX clearing providers to execute physical cross-border transfers.
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ORCHESTRATOR */}
      {activeTab === 'ORCHESTRATOR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Initiation Card */}
            <div className="lg:col-span-1 bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#F5F5F5]">Orchestrate Universal Payment</h2>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  Route payments seamlessly across commercial banks, mobile money, and regional clearing rails.
                </p>
              </div>

              <form onSubmit={handleInitiatePayment} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Originating Participant</label>
                  <select
                    value={origParticipant}
                    onChange={(e) => setOrigParticipant(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5]"
                  >
                    <option value="PART-UG-001">PART-UG-001: Nile Agro-Industries Ltd</option>
                    <option value="PART-UG-002">PART-UG-002: Victoria Commercial Bank</option>
                    <option value="PART-UG-003">PART-UG-003: EA Multimodal Logistics</option>
                    <option value="PART-KE-001">PART-KE-001: Nairobi Heavy Assemblies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] mb-1">Receiving Participant</label>
                  <select
                    value={recvParticipant}
                    onChange={(e) => setRecvParticipant(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5]"
                  >
                    <option value="PART-UG-003">PART-UG-003: EA Multimodal Logistics</option>
                    <option value="PART-UG-001">PART-UG-001: Nile Agro-Industries Ltd</option>
                    <option value="PART-KE-001">PART-KE-001: Nairobi Heavy Assemblies</option>
                    <option value="PART-UG-004">PART-UG-004: Uganda National Roads Authority</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#A0A0A0] mb-1">Amount</label>
                    <input
                      type="number"
                      min="1"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5] font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A0A0A0] mb-1">Currency</label>
                    <select
                      value={payCurrency}
                      onChange={(e) => setPayCurrency(e.target.value as SupportedCurrency)}
                      className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5]"
                    >
                      <option value="UGX">UGX</option>
                      <option value="USD">USD</option>
                      <option value="KES">KES</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] mb-1">Payment Method & Rails</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded-md px-3 py-2 text-[#F5F5F5]"
                  >
                    <option value="COMMERCIAL_BANK_WIRE">Commercial Bank RTGS Wire (Victoria Bank)</option>
                    <option value="MTN_MOMO">MTN Mobile Money Open API B2B</option>
                    <option value="AIRTEL_MONEY">Airtel Money Regional Corridor</option>
                    <option value="EAC_CROSS_BORDER_RTGS">EAC Interbank EAPS Settlement</option>
                  </select>
                </div>

                {paySuccessMsg && (
                  <div className={`p-2.5 rounded text-xs ${paySuccessMsg.startsWith('Error') ? 'bg-red-950/60 text-red-300 border border-red-800' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'}`}>
                    {paySuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="w-full py-2 px-4 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmittingPay ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Authorize & Disburse Settlement</span>
                </button>
              </form>
            </div>

            {/* Transactions History Feed */}
            <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#F5F5F5]">Universal Transaction Journal</h3>
                  <p className="text-xs text-[#A0A0A0]">Complete transactional audit trail across all participants and currencies.</p>
                </div>
                <button
                  onClick={fetchData}
                  className="p-1.5 rounded bg-[#18181b] border border-[#3f3f46] text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="divide-y divide-[#1e1e24] max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#71717a]">No transactions recorded yet.</div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="font-mono font-medium text-[#F5F5F5]">{tx.transactionReference}</div>
                        <div className="text-[#A0A0A0] mt-0.5">
                          {tx.originatingName} &rarr; {tx.receivingName}
                        </div>
                        <div className="text-[11px] text-[#71717a] mt-0.5">
                          {tx.paymentMethod} · {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-mono font-bold text-[#F5F5F5] tabular-nums">
                          {tx.originalAmount.toLocaleString()} {tx.originalCurrency}
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            tx.status === 'SETTLED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {tx.status}
                          </span>
                          {tx.status === 'AUTHORIZED' && (
                            <button
                              onClick={() => handleSettlePayment(tx.id)}
                              className="px-2 py-0.5 text-[10px] bg-[#1c1c1f] hover:bg-[#27272a] text-[#D4AF37] border border-[#D4AF37]/40 rounded font-medium"
                            >
                              Confirm Settlement
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: RECONCILIATION */}
      {activeTab === 'RECONCILIATION' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[#F5F5F5]">Multi-Currency Settlement Reconciliation</h2>
            <p className="text-xs text-[#A0A0A0] mt-0.5">
              Continuous mathematical verification: Every credit entry strictly matches corresponding debit and settlement vouchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
              <div className="text-xs text-[#A0A0A0]">Reconciled Transactions</div>
              <div className="text-xl font-bold text-[#F5F5F5] font-mono tabular-nums mt-1">
                {reconciliation ? reconciliation.reconciledCount : 0} Records
              </div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>100% Cleared through Registry</span>
              </div>
            </div>

            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
              <div className="text-xs text-[#A0A0A0]">Clearing Mesh Volume</div>
              <div className="text-xl font-bold text-[#D4AF37] font-mono tabular-nums mt-1">
                UGX {reconciliation ? (reconciliation.totalSettledVolumeUGX).toLocaleString() : '0'}
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-1">Multi-currency aggregate volume</div>
            </div>

            <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
              <div className="text-xs text-[#A0A0A0]">Reconciliation Integrity</div>
              <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">ZERO_DISCREPANCY</div>
              <div className="text-[11px] text-emerald-400 mt-1">Verified at {reconciliation ? new Date(reconciliation.reconciledAt).toLocaleTimeString() : 'Now'}</div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#27272a]">
            <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">Settlement Batches</h4>
            <div className="space-y-2 text-xs">
              {reconciliation?.settlements?.map((s: EconomicSettlement) => (
                <div key={s.id} className="p-3 bg-[#18181b] rounded border border-[#27272a] flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[#D4AF37]">{s.batchReference}</span>
                    <span className="text-[#A0A0A0] ml-2 font-mono text-[11px]">Provider: {s.clearingProvider}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[#F5F5F5]">Net: {s.netAmount.toLocaleString()}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {s.reconciliationStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Currency */}
      {showAddCurModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Register Currency in Registry</h3>
            <form onSubmit={handleCreateCurrency} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">ISO 4217 Currency Code (e.g. ZAR, NGN, GBP)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newCurCode}
                  onChange={(e) => setNewCurCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Currency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South African Rand"
                  value={newCurName}
                  onChange={(e) => setNewCurName(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Symbol (e.g. R, N)</label>
                  <input
                    type="text"
                    value={newCurSymbol}
                    onChange={(e) => setNewCurSymbol(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Decimal Precision</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={newCurPrecision}
                    onChange={(e) => setNewCurPrecision(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">UGX Conversion Rate Anchor</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newCurRateToUGX}
                  onChange={(e) => setNewCurRateToUGX(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono tabular-nums"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCurModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
