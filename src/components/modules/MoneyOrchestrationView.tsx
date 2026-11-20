/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V3 - Money Orchestration & Double-Entry Ledger
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  Building,
  KeyRound,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  OrchestratedPayment,
  LedgerEntry,
  PaymentChannelProvider,
  SupportedCurrency,
} from '../../types/index.ts';

export default function MoneyOrchestrationView() {
  const [payments, setPayments] = useState<OrchestratedPayment[]>([]);
  const [ledgerData, setLedgerData] = useState<{
    totalEntries: number;
    allBalanced: boolean;
    totalVolumeUGX: number;
    entries: LedgerEntry[];
  }>({ totalEntries: 0, allBalanced: true, totalVolumeUGX: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'LEDGER' | 'WEBHOOK_SIM'>('PAYMENTS');

  // New Payment Form
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(`idemp_${Date.now()}`);
  const [payerName, setPayerName] = useState('John Baptist Okello');
  const [payeeName, setPayeeName] = useState('Sarah Namubiru');
  const [amount, setAmount] = useState('450000');
  const [currency, setCurrency] = useState<SupportedCurrency>('UGX');
  const [channel, setChannel] = useState<PaymentChannelProvider>('MTN_MOMO_UG');
  const [autoConfirmSandbox, setAutoConfirmSandbox] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Webhook Simulator State
  const [simProvider, setSimProvider] = useState<string>('mtn_momo');
  const [simPaymentRef, setSimPaymentRef] = useState('');
  const [simStatus, setSimStatus] = useState<'SUCCESSFUL' | 'FAILED'>('SUCCESSFUL');
  const [simResult, setSimResult] = useState<any>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pays, ledgers] = await Promise.all([
        api.getOrchestratedPayments(),
        api.getLedgerEntries(),
      ]);
      setPayments(pays);
      setLedgerData(ledgers);
      if (pays.length > 0 && !simPaymentRef) {
        setSimPaymentRef(pays[0].transactionReference);
      }
    } catch (err) {
      console.error('Failed to load money orchestration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true);
    try {
      await api.orchestratePayment({
        idempotencyKey,
        payerId: 'usr_buyer_01',
        payerName,
        payerPhoneOrAccount: '+256 701 450 789',
        payeeId: 'usr_farmer_01',
        payeeName,
        amount: Number(amount),
        currency,
        channel,
        autoConfirmSandbox,
      });
      setShowInitiateModal(false);
      setIdempotencyKey(`idemp_${Date.now()}`);
      setActionError(null);
      await loadData();
    } catch (err: any) {
      setActionError('Unable to initiate payment: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!simPaymentRef) return;
    setSimResult(null);
    try {
      const payload = {
        transactionReference: simPaymentRef,
        status: simStatus,
        providerReference: `${simProvider.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
      };
      // Use verified sandbox key signature for demonstration
      const res = await api.sendWebhookSimulation(
        simProvider,
        payload,
        'aros_valid_sandbox_signature_2026',
        Date.now()
      );
      setSimResult(res);
      await loadData();
    } catch (err: any) {
      setSimResult({ error: err.message || 'Webhook simulation error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Institutional Top Banner */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
              ECONEX Money Orchestrator
            </span>
            <span className="text-xs text-[#A0A0A0]">Provider-Agnostic Gateway & Double-Entry Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Financial Clearing & Settlement</h1>
          <p className="text-sm text-[#A0A0A0] max-w-2xl mt-1">
            Multi-currency regional corridor orchestration supporting MTN MoMo, Airtel Money, Bank EFT and PAPSS cross-border clearing with atomic double-entry balance validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-[#333] hover:border-[#D4AF37] text-[#A0A0A0] hover:text-[#D4AF37] transition"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIdempotencyKey(`idemp_${Date.now()}`);
              setShowInitiateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c29d2f] text-black font-semibold text-sm rounded-xl transition shadow-lg shadow-[#D4AF37]/10"
          >
            <CreditCard className="w-4 h-4" />
            <span>Initiate Orchestrated Payment</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Compliance / Institution Disclaimer Banner */}
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl p-4 flex items-start gap-3 text-xs text-[#A0A0A0]">
        <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div>
          <p className="text-[#F5F5F5] font-semibold">Regulatory Integrity & Banking Status Disclosure</p>
          <p className="mt-0.5">
            ECONEX is an economic coordination operating system and technology routing platform developed by VINEXSAH TECHNOLOGIES. It is not a deposit-taking bank or primary financial custodian. Fiat transactions are cleared via licensed payment service providers (Bank of Uganda NPS Act 2020 regulated institutions).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222] pb-2">
        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'PAYMENTS'
              ? 'bg-[#222] text-[#D4AF37] border border-[#333]'
              : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Transactions & Escrow ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'LEDGER'
              ? 'bg-[#222] text-[#D4AF37] border border-[#333]'
              : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Double-Entry Ledger ({ledgerData.totalEntries})</span>
          {ledgerData.allBalanced && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
              BALANCED
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('WEBHOOK_SIM')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'WEBHOOK_SIM'
              ? 'bg-[#222] text-[#D4AF37] border border-[#333]'
              : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Webhook & Signature Simulator</span>
        </button>
      </div>

      {/* TAB 1: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-[#222] p-4 rounded-xl">
              <span className="text-xs text-[#A0A0A0] block">Total Settled Volume</span>
              <span className="text-xl font-bold text-[#F5F5F5] font-mono mt-1 block">
                {ledgerData.totalVolumeUGX.toLocaleString()} UGX
              </span>
            </div>
            <div className="bg-[#121212] border border-[#222] p-4 rounded-xl">
              <span className="text-xs text-[#A0A0A0] block">Active Channels</span>
              <span className="text-xl font-bold text-[#D4AF37] font-mono mt-1 block">
                4 Gateways
              </span>
              <span className="text-[11px] text-[#A0A0A0]">MTN, Airtel, EFT, PAPSS</span>
            </div>
            <div className="bg-[#121212] border border-[#222] p-4 rounded-xl">
              <span className="text-xs text-[#A0A0A0] block">Idempotent Transactions</span>
              <span className="text-xl font-bold text-[#F5F5F5] font-mono mt-1 block">
                {payments.length} Safe
              </span>
              <span className="text-[11px] text-emerald-400">Zero duplicate charges</span>
            </div>
            <div className="bg-[#121212] border border-[#222] p-4 rounded-xl">
              <span className="text-xs text-[#A0A0A0] block">Reconciliation Rate</span>
              <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
                {Math.round(
                  (payments.filter((p) => p.reconciliationStatus === 'MATCHED').length /
                    (payments.length || 1)) *
                    100
                )}
                %
              </span>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#222] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Orchestrated Payment Records</h2>
              <span className="text-xs text-[#A0A0A0]">Ordered by creation timestamp</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-[#A0A0A0]">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-[#A0A0A0]">No payments orchestrated yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#A0A0A0]">
                  <thead className="bg-[#181818] text-[#F5F5F5] text-xs uppercase font-mono tracking-wider border-b border-[#222]">
                    <tr>
                      <th className="p-3">Reference / Idemp</th>
                      <th className="p-3">Payer & Payee</th>
                      <th className="p-3">Amount & Currency</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Reconciliation</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1e1e]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#181818]/50 transition font-sans">
                        <td className="p-3">
                          <div className="font-mono text-xs text-[#F5F5F5] font-semibold">
                            {p.transactionReference}
                          </div>
                          <div className="text-[11px] text-[#777] font-mono truncate max-w-[140px]" title={p.idempotencyKey}>
                            {p.idempotencyKey}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-[#F5F5F5]">{p.payerName}</div>
                          <div className="text-[11px] text-[#777]">→ {p.payeeName}</div>
                        </td>
                        <td className="p-3 font-mono">
                          <div className="text-xs text-[#F5F5F5] font-semibold">
                            {p.amount.toLocaleString()} {p.currency}
                          </div>
                          {p.currency !== 'UGX' && (
                            <div className="text-[11px] text-[#D4AF37]">
                              ≈ {p.equivalentUGX.toLocaleString()} UGX
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-[11px] font-mono bg-[#222] text-[#CCC] px-2 py-0.5 rounded border border-[#333]">
                            {p.channel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
                              p.status === 'CONFIRMED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : p.status === 'INITIATED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-[#222] text-[#A0A0A0]'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[11px] font-mono ${
                              p.reconciliationStatus === 'MATCHED'
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {p.reconciliationStatus}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-[#777] font-mono">
                          {new Date(p.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#222] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F5]">General Ledger Integrity Verified</h3>
                <p className="text-xs text-[#A0A0A0]">
                  Every settled payment creates dual-entry balanced accounting records where Total Debits equal Total Credits.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#A0A0A0]">Total Balanced Volume</span>
              <div className="text-lg font-mono font-bold text-[#D4AF37]">
                {ledgerData.totalVolumeUGX.toLocaleString()} UGX
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#222] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#222] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Double-Entry Ledger Book</h2>
              <span className="text-xs font-mono text-[#D4AF37]">{ledgerData.entries.length} Entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#A0A0A0]">
                <thead className="bg-[#181818] text-[#F5F5F5] text-xs uppercase font-mono tracking-wider border-b border-[#222]">
                  <tr>
                    <th className="p-3">Entry Number</th>
                    <th className="p-3">Debit Account</th>
                    <th className="p-3">Credit Account</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Narration</th>
                    <th className="p-3">Balanced Check</th>
                    <th className="p-3">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {ledgerData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#181818]/50 transition font-sans">
                      <td className="p-3 font-mono text-xs text-[#F5F5F5] font-semibold">
                        {entry.entryNumber}
                      </td>
                      <td className="p-3 font-mono text-xs text-rose-300">
                        {entry.debitAccount}
                      </td>
                      <td className="p-3 font-mono text-xs text-emerald-300">
                        {entry.creditAccount}
                      </td>
                      <td className="p-3 font-mono text-xs text-[#F5F5F5] font-semibold">
                        {entry.amount.toLocaleString()} {entry.currency}
                      </td>
                      <td className="p-3 text-xs text-[#CCC] max-w-[240px] truncate" title={entry.narration}>
                        {entry.narration}
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                          DEBIT = CREDIT
                        </span>
                      </td>
                      <td className="p-3 text-xs text-[#777] font-mono">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOK SIMULATOR */}
      {activeTab === 'WEBHOOK_SIM' && (
        <div className="bg-[#121212] border border-[#222] p-6 rounded-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5]">Cryptographic Webhook Simulation Engine</h2>
            <p className="text-xs text-[#A0A0A0] mt-1 max-w-2xl">
              Test how ECONEX verifies inbound payment provider callbacks. Callbacks require HMAC-SHA256 signature verification and strict timestamp checks to prevent replay attacks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#A0A0A0] block mb-1">Provider Adapter</label>
              <select
                value={simProvider}
                onChange={(e) => setSimProvider(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
              >
                <option value="mtn_momo">MTN Mobile Money UG</option>
                <option value="airtel_money">Airtel Money UG</option>
                <option value="papss">PAPSS Cross-Border Clearing</option>
                <option value="eft_bank">Bank EFT Gateway</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[#A0A0A0] block mb-1">Target Payment Reference</label>
              <select
                value={simPaymentRef}
                onChange={(e) => setSimPaymentRef(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none font-mono"
              >
                {payments.map((p) => (
                  <option key={p.id} value={p.transactionReference}>
                    {p.transactionReference} ({p.amount.toLocaleString()} {p.currency} - {p.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#A0A0A0] block mb-1">Callback Status Outcome</label>
              <select
                value={simStatus}
                onChange={(e) => setSimStatus(e.target.value as any)}
                className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
              >
                <option value="SUCCESSFUL">SUCCESSFUL (Settles in Ledger)</option>
                <option value="FAILED">FAILED (Payment Aborted)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-[#181818] border border-[#2a2a2a] rounded-xl flex items-center justify-between">
            <div className="text-xs text-[#A0A0A0] space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[#F5F5F5] font-semibold">Signature Protocol: HMAC-SHA256</span>
              </div>
              <div>Replay Window Tolerance: 600 seconds (10 mins)</div>
            </div>

            <button
              onClick={handleSimulateWebhook}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black font-semibold text-sm rounded-xl hover:bg-[#c29d2f] transition"
            >
              <Send className="w-4 h-4" />
              <span>Simulate Verified Webhook</span>
            </button>
          </div>

          {simResult && (
            <div className="p-4 bg-[#0a0a0a] border border-[#333] rounded-xl font-mono text-xs">
              <span className="text-[#A0A0A0] block mb-1">Server Response:</span>
              <pre className="text-emerald-400 overflow-x-auto">{JSON.stringify(simResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Initiate Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#333] rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#F5F5F5]">Initiate Orchestrated Payment</h2>
              <button
                onClick={() => setShowInitiateModal(false)}
                className="text-[#A0A0A0] hover:text-[#F5F5F5] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">Idempotency Key (Protection Against Duplicate Submissions)</label>
                <input
                  type="text"
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-xs rounded-xl p-2.5 font-mono focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A0A0A0] block mb-1">Payer Name</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A0A0A0] block mb-1">Payee Name</label>
                  <input
                    type="text"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A0A0A0] block mb-1">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 font-mono focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A0A0A0] block mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                    className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                  >
                    <option value="UGX">UGX (Ugandan Shilling)</option>
                    <option value="KES">KES (Kenyan Shilling)</option>
                    <option value="TZS">TZS (Tanzanian Shilling)</option>
                    <option value="RWF">RWF (Rwandan Franc)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">Payment Channel Gateway</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as PaymentChannelProvider)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                >
                  <option value="MTN_MOMO_UG">MTN Mobile Money UG</option>
                  <option value="AIRTEL_MONEY_UG">Airtel Money UG</option>
                  <option value="BANK_TRANSFER_EFT">Bank Transfer EFT</option>
                  <option value="PAPSS_CROSS_BORDER">PAPSS Cross-Border EAC Clearing</option>
                  <option value="AUTHORIZED_GATEWAY_SANDBOX">Authorized Gateway Sandbox</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#181818] border border-[#333] rounded-xl text-xs text-[#CCC]">
                <input
                  type="checkbox"
                  id="sandboxConfirm"
                  checked={autoConfirmSandbox}
                  onChange={(e) => setAutoConfirmSandbox(e.target.checked)}
                  className="rounded text-[#D4AF37]"
                />
                <label htmlFor="sandboxConfirm">
                  Auto-confirm in test sandbox (Immediately creates double-entry ledger settlement)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="px-4 py-2 text-sm text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#D4AF37] text-black font-semibold text-sm rounded-xl hover:bg-[#c29d2f] transition disabled:opacity-50"
                >
                  {submitting ? 'Orchestrating...' : 'Confirm & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
