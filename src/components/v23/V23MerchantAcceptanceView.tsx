/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Sandbox Merchant Acceptance, Terminals, HMAC QR & Refund Console
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { QrCode, RefreshCw, RotateCcw, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V23CurrencyCode,
  V23MerchantAccount,
  V23MerchantTerminal,
  V23QrPaymentRequest,
  V23WalletTransaction,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

function fmtMinor(minor: number, currency: string): string {
  return `${(Number(minor || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export const V23MerchantAcceptanceView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || 'usr_buyer_01', userRole: role };

  const [merchants, setMerchants] = useState<V23MerchantAccount[]>([]);
  const [terminals, setTerminals] = useState<V23MerchantTerminal[]>([]);
  const [qrs, setQrs] = useState<V23QrPaymentRequest[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [txs, setTxs] = useState<V23WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // Create QR state
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('MRC-V23-001');
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>('TRM-V23-001');
  const [qrKind, setQrKind] = useState<'DYNAMIC' | 'STATIC'>('DYNAMIC');
  const [qrAmountMajor, setQrAmountMajor] = useState<number>(35000);
  const [qrCurrency, setQrCurrency] = useState<V23CurrencyCode>('UGX');
  const [qrDesc, setQrDesc] = useState<string>('Certified hardware & inputs order');

  // Pay QR state
  const [payerWalletId, setPayerWalletId] = useState<string>('WLT-V23-001');
  const [payerPin, setPayerPin] = useState<string>('2468');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mList, tList, qList, wList, txList] = await Promise.all([
        ApiClient.v23GetMerchants(actor),
        ApiClient.v23GetTerminals(undefined, actor),
        ApiClient.v23GetQrRequests(undefined, actor),
        ApiClient.v23GetWallets(role === 'PLATFORM_ADMIN' ? 'all' : 'own', actor),
        ApiClient.v23GetTransactions(undefined, actor),
      ]);
      setMerchants(Array.isArray(mList) ? mList : []);
      setTerminals(Array.isArray(tList) ? tList : []);
      setQrs(Array.isArray(qList) ? qList : []);
      const wl = Array.isArray(wList) ? wList : [];
      setWallets(wl);
      if (wl.length > 0 && !wl.some((b: any) => b.wallet.id === payerWalletId)) {
        setPayerWalletId(wl[0].wallet.id);
      }
      setTxs(Array.isArray(txList) ? txList : []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Merchant QR console.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const qr = await ApiClient.v23CreateQrRequest(
        {
          merchantId: selectedMerchantId,
          terminalId: selectedTerminalId,
          qrKind,
          amountMinor: qrKind === 'DYNAMIC' ? Math.round(qrAmountMajor * 100) : 0,
          currency: qrCurrency,
          description: qrDesc,
        },
        actor
      );
      if (qr?.error) throw new Error(qr.error);
      setFeedback(`Generated HMAC-SHA256 signed ${qr.qrKind} QR ${qr.paymentReference}.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'QR creation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handlePayQr = async (qr: V23QrPaymentRequest) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v23PayQr(
        {
          qrId: qr.id,
          scannedPayloadJson: qr.payloadJson,
          scannedSignatureSha256: qr.payloadSignatureSha256,
          payerWalletId,
          overrideStaticAmountMinor: qr.qrKind === 'STATIC' ? Math.round(qrAmountMajor * 100) : undefined,
          pin: payerPin,
          bypassPinForTestOrAdmin: role === 'PLATFORM_ADMIN',
          idempotencyKey: `QRPAY-UI-${qr.id}-${Date.now()}`,
        },
        actor
      );
      if (res?.error) throw new Error(res.error);
      setLastReceipt(res.receipt);
      setFeedback(`Sandbox receipt ${res.receipt.receiptNumber} confirmed.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'QR verification/payment failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRefundTx = async (tx: V23WalletTransaction, partial: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v23RefundOrReverse(
        tx.id,
        {
          kind: partial ? 'PARTIAL_REFUND' : 'FULL_REFUND',
          amountMinor: partial ? Math.max(100, Math.floor((tx.destinationAmountMinor - tx.refundedMinorTotal) / 2)) : undefined,
          reason: partial ? 'Partial sandbox customer return' : 'Full sandbox merchant refund',
          merchantId: merchants.find((m) => m.walletAccountId === tx.destinationWalletId)?.id,
        },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`Processed ${out.refundRecord.kind} (${out.compensatingTransaction.txReference}).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Refund blocked.');
    } finally {
      setBusy(false);
    }
  };

  const merchantTxs = txs.filter((t) => t.txType === 'CUSTOMER_TO_MERCHANT');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
            SANDBOX MERCHANT ACCEPTANCE · TEST MODE ONLY · LIVE ACCEPTANCE DISABLED
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1">
            Merchant Accounts, Terminals &amp; HMAC QR Pay
          </h1>
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

      {/* Registered Sandbox Merchants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {merchants.map((m) => (
          <div key={m.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
              <span className="font-mono text-[#D4AF37]">{m.id} · {m.modeLabel}</span>
              <span className="font-mono">{m.status}</span>
            </div>
            <div className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Store size={16} className="text-[#D4AF37]" /> {m.merchantName}
            </div>
            <div className="text-xs text-[#A0A0A0] font-mono">
              Wallet EUWN: {m.euwn} · Tx Count: {m.sandboxTxCount} · Refunds: {m.sandboxRefundCount}
            </div>
            <div className="text-xs text-[#A0A0A0]">
              Currencies: {m.acceptedCurrencies.join(', ')} · Country: {m.countryCode} · {m.districtOrCity}
            </div>
          </div>
        ))}
      </div>

      {/* Generate Signed Merchant QR */}
      <form onSubmit={handleGenerateQr} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
          <QrCode size={16} className="text-[#D4AF37]" /> Generate HMAC-SHA256 Signed QR Request
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <select
            value={selectedMerchantId}
            onChange={(e) => setSelectedMerchantId(e.target.value)}
            className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>{m.merchantName}</option>
            ))}
          </select>
          <select
            value={selectedTerminalId}
            onChange={(e) => setSelectedTerminalId(e.target.value)}
            className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
          >
            {terminals.filter((t) => t.merchantId === selectedMerchantId).map((t) => (
              <option key={t.id} value={t.id}>{t.terminalCode} · {t.label}</option>
            ))}
          </select>
          <select
            value={qrKind}
            onChange={(e) => setQrKind(e.target.value as any)}
            className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
          >
            <option value="DYNAMIC">DYNAMIC (Fixed Amount)</option>
            <option value="STATIC">STATIC (Counter Till)</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              value={qrAmountMajor}
              onChange={(e) => setQrAmountMajor(Number(e.target.value))}
              className="flex-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
            />
            <select
              value={qrCurrency}
              onChange={(e) => setQrCurrency(e.target.value as V23CurrencyCode)}
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-2 text-[#F5F5F5]"
            >
              {['UGX', 'KES', 'USD'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
          >
            Generate Signed QR
          </button>
        </div>
        <input
          type="text"
          value={qrDesc}
          onChange={(e) => setQrDesc(e.target.value)}
          placeholder="Order or receipt description"
          className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
        />
      </form>

      {/* Active QR Requests & Scan/Verify/Pay Controls */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[#F5F5F5]">Active Merchant QR Requests ({qrs.length})</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#A0A0A0]">Payer Wallet:</span>
            <select
              value={payerWalletId}
              onChange={(e) => setPayerWalletId(e.target.value)}
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-1.5 font-mono text-[#F5F5F5]"
            >
              {wallets.map((b: any) => (
                <option key={b.wallet.id} value={b.wallet.id}>{b.wallet.euwn} ({b.wallet.displayName})</option>
              ))}
            </select>
            <input
              type="password"
              value={payerPin}
              onChange={(e) => setPayerPin(e.target.value)}
              placeholder="PIN"
              maxLength={6}
              className="w-20 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-1.5 font-mono text-[#F5F5F5]"
            />
          </div>
        </div>

        <div className="divide-y divide-[#27272a]">
          {qrs.map((q) => (
            <div key={q.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-mono text-[#F5F5F5]">
                  {q.paymentReference} · <span className="text-[#D4AF37]">{q.status}</span> · {q.qrKind}
                </div>
                <div className="text-[#A0A0A0]">
                  {q.merchantName} (<span className="font-mono">{q.merchantEuwn}</span>) · {q.description}
                </div>
                <div className="font-mono text-[11px] text-[#71717a]">
                  HMAC-SHA256: {q.payloadSignatureSha256.slice(0, 28)}...
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right font-mono tabular-nums text-[#F5F5F5]">
                  {q.qrKind === 'STATIC' ? 'Customer enters amount' : fmtMinor(q.amountMinor, q.currency)}
                </div>
                <button
                  type="button"
                  disabled={busy || (q.qrKind === 'DYNAMIC' && q.status !== 'ACTIVE')}
                  onClick={() => handlePayQr(q)}
                  className="px-3.5 py-2 rounded-lg bg-[#D4AF37] disabled:opacity-40 text-[#050505] font-semibold cursor-pointer"
                >
                  Verify &amp; Pay QR
                </button>
              </div>
            </div>
          ))}
        </div>

        {lastReceipt && (
          <div className="bg-[#0a0a0c] border border-emerald-900 rounded-lg p-3.5 text-xs font-mono space-y-1">
            <div className="text-emerald-300 font-semibold">
              DIGITAL RECEIPT {lastReceipt.receiptNumber} · {lastReceipt.mode}
            </div>
            <div className="text-[#F5F5F5]">
              Tx: {lastReceipt.txReference} · Merchant: {lastReceipt.merchantName} ({lastReceipt.merchantEuwn}) · Paid: {fmtMinor(lastReceipt.amountMinor, lastReceipt.currency)}
            </div>
          </div>
        )}
      </div>

      {/* Merchant Settlement & Partial/Full Sandbox Refund History */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#27272a] text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
          <RotateCcw size={14} className="text-[#D4AF37]" /> Merchant Payments &amp; Sandbox Refunds ({merchantTxs.length})
        </div>
        <div className="divide-y divide-[#27272a]">
          {merchantTxs.map((tx) => (
            <div key={tx.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="font-mono text-[#F5F5F5]">
                  {tx.txReference} · <span className="text-[#D4AF37]">{tx.status}</span> · Refunded: {fmtMinor(tx.refundedMinorTotal, tx.destinationCurrency)}
                </div>
                <div className="text-[#A0A0A0]">{tx.purpose}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-[#F5F5F5] mr-2">
                  {fmtMinor(tx.destinationAmountMinor, tx.destinationCurrency)}
                </span>
                <button
                  type="button"
                  disabled={busy || !['CONFIRMED', 'PARTIALLY_REFUNDED'].includes(tx.status)}
                  onClick={() => handleRefundTx(tx, true)}
                  className="px-2.5 py-1.5 rounded-md border border-[#27272a] text-[#F5F5F5] hover:border-[#D4AF37] disabled:opacity-40 cursor-pointer"
                >
                  Partial Refund
                </button>
                <button
                  type="button"
                  disabled={busy || !['CONFIRMED', 'PARTIALLY_REFUNDED'].includes(tx.status)}
                  onClick={() => handleRefundTx(tx, false)}
                  className="px-2.5 py-1.5 rounded-md border border-[#27272a] text-[#F5F5F5] hover:border-[#D4AF37] disabled:opacity-40 cursor-pointer"
                >
                  Full Refund
                </button>
              </div>
            </div>
          ))}
          {merchantTxs.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-[#A0A0A0]">
              Verify &amp; Pay a Merchant QR above to test digital receipts and partial/full sandbox refunds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
