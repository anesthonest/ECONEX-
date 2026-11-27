/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Universal Wallet & Identity Dashboard
 * Permanent EUWN (EX-...), Multi-Country Context, Integer Minor-Unit Subaccounts,
 * Internal Transfer Flow (Lookup -> Fee/FX Preview -> PIN Confirm), Offline Queue & Statements.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Copy,
  FileText,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V23CountryOperatingProfile,
  V23CurrencyCode,
  V23CurrencySubaccount,
  V23OfflineQueueItem,
  V23ParticipantIdentity,
  V23WalletAccount,
  V23WalletNumberAllocation,
  V23WalletTransaction,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

interface WalletBundle {
  wallet: Omit<V23WalletAccount, 'pinHash' | 'pinSalt'>;
  allocation: V23WalletNumberAllocation | null;
  identity: V23ParticipantIdentity | null;
  subaccounts: V23CurrencySubaccount[];
}

function fmtMinor(minor: number, currency: string): string {
  const major = Number(minor || 0) / 100;
  return `${major.toLocaleString('en-US', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export const V23UniversalWalletDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || 'usr_farmer_01', userRole: role };

  const [tab, setTab] = useState<'OVERVIEW' | 'SEND' | 'PORTABILITY' | 'OFFLINE' | 'STATEMENT'>('OVERVIEW');
  const [bundles, setBundles] = useState<WalletBundle[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [countries, setCountries] = useState<V23CountryOperatingProfile[]>([]);
  const [transactions, setTransactions] = useState<V23WalletTransaction[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<V23OfflineQueueItem[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // Create new identity/wallet modal toggle
  const [showNewWallet, setShowNewWallet] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'INDIVIDUAL' | 'BUSINESS' | 'COOPERATIVE' | 'INSTITUTIONAL'>('INDIVIDUAL');
  const [newCountry, setNewCountry] = useState<string>('UG');
  const [newCurrency, setNewCurrency] = useState<V23CurrencyCode>('UGX');
  const [newPin, setNewPin] = useState<string>('2468');

  // Enable currency subaccount
  const [addCurrency, setAddCurrency] = useState<V23CurrencyCode>('KES');

  // Send Transfer state
  const [recipientEuwn, setRecipientEuwn] = useState<string>('EX-3H8N6V2X9C4T');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [srcCurrency, setSrcCurrency] = useState<V23CurrencyCode>('UGX');
  const [dstCurrency, setDstCurrency] = useState<V23CurrencyCode>('UGX');
  const [amountMajor, setAmountMajor] = useState<number>(25000);
  const [txPurpose, setTxPurpose] = useState<string>('Commercial goods & services settlement');
  const [txPin, setTxPin] = useState<string>('2468');
  const [fxPreview, setFxPreview] = useState<any>(null);
  const [feePreview, setFeePreview] = useState<any>(null);
  const [fxConfirmed, setFxConfirmed] = useState<boolean>(false);

  // Portability & PIN state
  const [newPhone, setNewPhone] = useState<string>('+256 779 884 112');
  const [newDeviceLabel, setNewDeviceLabel] = useState<string>('Android Field Handset B2');
  const [travelCountry, setTravelCountry] = useState<string>('KE');
  const [currentPin, setCurrentPin] = useState<string>('2468');
  const [nextPin, setNextPin] = useState<string>('2468');

  // Offline Draft state
  const [offEuwn, setOffEuwn] = useState<string>('EX-3H8N6V2X9C4T');
  const [offAmountMajor, setOffAmountMajor] = useState<number>(10000);
  const [offCurrency, setOffCurrency] = useState<V23CurrencyCode>('UGX');

  // Statement & Reconciliation
  const [statement, setStatement] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, wList, cList, txList, oq] = await Promise.all([
        ApiClient.v23GetOverview(actor),
        ApiClient.v23GetWallets(role === 'PLATFORM_ADMIN' ? 'all' : 'own', actor),
        ApiClient.v23GetCountries(actor),
        ApiClient.v23GetTransactions(undefined, actor),
        ApiClient.v23GetOfflineQueue(actor),
      ]);
      setOverview(ov);
      const list = Array.isArray(wList) ? wList : [];
      setBundles(list);
      if (list.length > 0 && (!selectedWalletId || !list.some((b: WalletBundle) => b.wallet.id === selectedWalletId))) {
        setSelectedWalletId(list[0].wallet.id);
      }
      setCountries(Array.isArray(cList) ? cList : []);
      setTransactions(Array.isArray(txList) ? txList : []);
      setOfflineQueue(Array.isArray(oq) ? oq : []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Universal Wallet data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeBundle = bundles.find((b) => b.wallet.id === selectedWalletId) || bundles[0] || null;

  const handleCopyEuwn = async () => {
    if (!activeBundle) return;
    try {
      await navigator.clipboard.writeText(activeBundle.wallet.euwn);
      setFeedback(`Copied permanent EUWN ${activeBundle.wallet.euwn}`);
    } catch {
      setFeedback(`Permanent EUWN: ${activeBundle.wallet.euwn}`);
    }
  };

  const handleLookupAndPreview = async () => {
    if (!activeBundle) return;
    setBusy(true);
    setError(null);
    try {
      const minor = Math.max(100, Math.round(Number(amountMajor || 0) * 100));
      const [lkp, fx, fee] = await Promise.all([
        ApiClient.v23LookupEuwn(recipientEuwn.trim(), actor),
        ApiClient.v23PreviewFx({ sourceCurrency: srcCurrency, destinationCurrency: dstCurrency, sourceAmountMinor: minor }, actor),
        ApiClient.v23PreviewFees(
          {
            serviceType: srcCurrency === dstCurrency ? 'WALLET_TO_WALLET' : 'CROSS_COUNTRY_INTERNAL_TRANSFER',
            countryCode: activeBundle.wallet.activeCountryCode,
            currency: srcCurrency,
            amountMinor: minor,
          },
          actor
        ),
      ]);
      if (lkp?.error) throw new Error(lkp.message || lkp.error);
      setLookupResult(lkp);
      setFxPreview(fx);
      setFeePreview(fee);
      setFxConfirmed(!fx.fxApplied);
      setFeedback(`Verified recipient ${lkp.displayName} (${lkp.euwn}) — zero private PII exposed.`);
    } catch (e: any) {
      setLookupResult(null);
      setError(e?.message || 'Recipient EUWN lookup failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBundle) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const minor = Math.max(100, Math.round(Number(amountMajor || 0) * 100));
      const res = await ApiClient.v23PostTransaction(
        {
          sourceWalletId: activeBundle.wallet.id,
          destinationEuwn: recipientEuwn.trim(),
          sourceCurrency: srcCurrency,
          destinationCurrency: dstCurrency,
          amountMinor: minor,
          txType: srcCurrency === dstCurrency ? 'WALLET_TO_WALLET' : 'CROSS_COUNTRY_INTERNAL_TRANSFER',
          purpose: txPurpose,
          idempotencyKey: `UI-TX-${activeBundle.wallet.id}-${Date.now()}`,
          pin: txPin,
          fxUserConfirmed: srcCurrency === dstCurrency ? true : fxConfirmed,
        },
        actor
      );
      if (res?.error) throw new Error(res.error);
      setFeedback(`Confirmed ${res.transaction.txReference} · Double-entry GL ${res.transaction.journalEntryId || 'HOLD'}`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Transfer rejected.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await ApiClient.v23CreateIdentityAndWallet(
        {
          displayName: newName.trim(),
          legalName: `${newName.trim()} (Verified Record)`,
          email: currentUser?.email || 'participant@econex.local',
          phone: currentUser?.phone || '+256700100200',
          countryCode: newCountry,
          districtOrCity: currentUser?.district || 'Kampala',
          category: newCategory === 'INDIVIDUAL' ? 'INDIVIDUAL' : newCategory === 'COOPERATIVE' ? 'COOPERATIVE' : newCategory === 'INSTITUTIONAL' ? 'INSTITUTION' : 'SMALL_BUSINESS',
          walletCategory: newCategory,
          initialCurrency: newCurrency,
          pin: newPin,
          sandboxSeedMinor: 50000000,
        },
        actor
      );
      if (created?.error) throw new Error(created.error);
      setShowNewWallet(false);
      setNewName('');
      setFeedback(`Issued permanent EUWN ${created.wallet.euwn} (${newCountry} · ${newCurrency}) with sandbox seed.`);
      await loadData();
      if (created?.wallet?.id) setSelectedWalletId(created.wallet.id);
    } catch (e: any) {
      setError(e?.message || 'Unable to register permanent wallet.');
    } finally {
      setBusy(false);
    }
  };

  const handleEnableCurrency = async () => {
    if (!activeBundle) return;
    setBusy(true);
    setError(null);
    try {
      const sub = await ApiClient.v23EnableSubaccount(activeBundle.wallet.id, addCurrency, 0, actor);
      if (sub?.error) throw new Error(sub.error);
      setFeedback(`Enabled ${addCurrency} subaccount on existing EUWN ${activeBundle.wallet.euwn} without creating duplicate identity.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to enable currency subaccount.');
    } finally {
      setBusy(false);
    }
  };

  const handlePortability = async (action: 'UPDATE_PHONE' | 'MIGRATE_DEVICE' | 'TRAVEL_COUNTRY' | 'RECOVER_ACCOUNT') => {
    if (!activeBundle?.identity) return;
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v23UpdatePortability(
        activeBundle.identity.id,
        { action, newPhone, newDeviceLabel, targetCountryCode: travelCountry },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`${action} completed — permanent EUWN ${activeBundle.wallet.euwn} remains unchanged.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Portability update failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRotatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBundle) return;
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v23UpdateWalletPin(
        activeBundle.wallet.id,
        { action: 'CHANGE', currentPin, newPin: nextPin },
        actor
      );
      if (res?.error) throw new Error(res.error);
      setFeedback(`PIN updated securely for ${activeBundle.wallet.euwn}.`);
    } catch (e: any) {
      setError(e?.message || 'PIN update rejected.');
    } finally {
      setBusy(false);
    }
  };

  const handleQueueOffline = async (syncNow: boolean) => {
    if (!activeBundle) return;
    setBusy(true);
    setError(null);
    try {
      const minor = Math.max(100, Math.round(Number(offAmountMajor || 0) * 100));
      const res = await ApiClient.v23EnqueueOfflineItem(
        {
          deviceId: 'HANDSET-UG-01',
          clientDraftId: `OFFDRAFT-${Date.now()}`,
          sourceWalletId: activeBundle.wallet.id,
          recipientEuwn: offEuwn.trim(),
          amountMinor: minor,
          currency: offCurrency,
          countryCode: activeBundle.wallet.activeCountryCode,
          purpose: 'Offline field wallet transfer',
          syncNow,
          pin: txPin,
        },
        actor
      );
      if (res?.error && !res?.queueItem) throw new Error(res.error);
      setFeedback(
        res.synced
          ? `Offline draft posted to server ledger (${res.transaction?.txReference}).`
          : res.queueItem?.syncStatus === 'QUEUED_LOCAL'
          ? 'Saved locally in offline queue. Balance remains strictly server-verified until online sync.'
          : `Sync rejected cleanly: ${res.error || res.queueItem?.conflictOrRejectReason}`
      );
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Offline queue operation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleLoadStatement = async () => {
    if (!activeBundle) return;
    setBusy(true);
    setError(null);
    try {
      const [stmt, rec] = await Promise.all([
        ApiClient.v23GetWalletStatement(activeBundle.wallet.id, actor),
        ApiClient.v23RunReconciliation(actor),
      ]);
      setStatement({ ...stmt, latestReconciliation: rec });
      setFeedback(`Statement generated · Reconciliation status: ${rec.status} (${rec.totalSubaccountsChecked} subaccounts checked).`);
    } catch (e: any) {
      setError(e?.message || 'Unable to generate wallet statement.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Truthful Mode Notice */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#27272a] pb-4">
        <div>
          <div className="text-xs font-semibold text-[#D4AF37]">
            Universal Wallet Network · Sandbox Mode
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1">
            Universal Wallet &amp; Permanent Identity
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            One permanent ECONEX number across phones, devices, and participating countries. Real-value settlement remains disabled pending regulatory licensing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewWallet((v) => !v)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} aria-hidden="true" /> Issue New EUWN
          </button>
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#121212] text-xs text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {/* Explicit Real-Value vs Sandbox Separation Bar */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-[#A0A0A0]">
          <span className="text-amber-300 font-semibold">Sandbox Simulation Active · </span>
          <span>Live Real-Value Volume: </span>
          <span className="font-mono tabular-nums text-[#F5F5F5]">0 UGX</span>
          <span className="mx-2 text-[#52525b]">·</span>
          <span>Live Revenue Recognized: </span>
          <span className="font-mono tabular-nums text-[#F5F5F5]">0 UGX</span>
          <span className="mx-2 text-[#52525b]">·</span>
          <span>Active Wallets: </span>
          <span className="font-mono tabular-nums text-[#F5F5F5]">{overview?.counts?.wallets ?? bundles.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button type="button" onClick={() => onNavigate('v23-merchant')} className="min-h-[36px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer">
            <QrCode size={13} aria-hidden="true" /> Merchant QR
          </button>
          <button type="button" onClick={() => onNavigate('v23-cards')} className="min-h-[36px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer">
            Cards
          </button>
          <button type="button" onClick={() => onNavigate('v23-country-network')} className="min-h-[36px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer">
            <Globe size={13} aria-hidden="true" /> Countries &amp; Gates
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-red-950/30 border border-red-900 text-xs text-red-200">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900 text-xs text-emerald-200">
          {feedback}
        </div>
      )}

      {/* Create New Permanent Wallet Form */}
      {showNewWallet && (
        <form onSubmit={handleCreateWallet} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold text-[#F5F5F5]">Register Participant Identity &amp; Permanent EUWN</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Participant or Business Name"
              className="md:col-span-2 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#F5F5F5]"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#F5F5F5]"
            >
              <option value="INDIVIDUAL">Individual Wallet</option>
              <option value="BUSINESS">Business / Merchant</option>
              <option value="COOPERATIVE">Cooperative Treasury</option>
              <option value="INSTITUTIONAL">Institutional Escrow</option>
            </select>
            <select
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#F5F5F5]"
            >
              {countries.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.countryCode} · {c.countryName}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value as V23CurrencyCode)}
                className="flex-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-2 text-sm text-[#F5F5F5]"
              >
                {['UGX', 'KES', 'TZS', 'RWF', 'BIF', 'SSP', 'CDF', 'USD', 'EUR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={6}
                placeholder="PIN"
                className="w-20 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-2 text-sm font-mono text-[#F5F5F5]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNewWallet(false)} className="px-4 py-2 rounded-lg border border-[#27272a] text-xs text-[#A0A0A0] cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Generate Permanent EUWN
            </button>
          </div>
        </form>
      )}

      {/* Active Wallet Selector & Permanent EUWN Identity Banner */}
      {activeBundle && (
        <div className="bg-[#121212] border border-[#27272a] border-t-2 border-t-[#D4AF37] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-[#A0A0A0]">
              {activeBundle.wallet.walletCategory} · Active Country: <strong className="text-[#F5F5F5]">{activeBundle.wallet.activeCountryCode}</strong> · Status: <strong className="text-emerald-400">{activeBundle.wallet.status}</strong>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Wallet size={20} className="text-[#D4AF37]" />
              <span className="font-mono tabular-nums text-2xl font-bold tracking-wider text-[#F5F5F5]">
                {activeBundle.wallet.euwn}
              </span>
              <button
                type="button"
                onClick={handleCopyEuwn}
                className="px-2.5 py-1 rounded-md border border-[#27272a] bg-[#0a0a0c] text-xs text-[#A0A0A0] hover:text-[#F5F5F5] flex items-center gap-1 cursor-pointer"
              >
                <Copy size={12} /> Copy Number
              </button>
            </div>
            <div className="text-xs text-[#A0A0A0]">
              Holder: <span className="text-[#F5F5F5]">{activeBundle.wallet.displayName}</span>
              <span className="mx-2 text-[#52525b]">·</span>
              <span>Countries Visited: </span>
              <span className="font-mono text-[#F5F5F5]">{activeBundle.allocation?.travelCountryHistory.join(', ') || activeBundle.wallet.activeCountryCode}</span>
              <span className="mx-2 text-[#52525b]">·</span>
              <span>Permanent across phones &amp; borders</span>
            </div>
          </div>
          {bundles.length > 1 && (
            <div className="flex flex-col gap-1 min-w-[240px]">
              <label htmlFor="v23-wallet-select" className="text-xs text-[#A0A0A0]">Switch Owned/Managed Wallet</label>
              <select
                id="v23-wallet-select"
                value={activeBundle.wallet.id}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F5F5]"
              >
                {bundles.map((b) => (
                  <option key={b.wallet.id} value={b.wallet.id}>
                    {b.wallet.euwn} · {b.wallet.displayName} ({b.wallet.walletCategory})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3">
        {[
          { id: 'OVERVIEW', label: 'Currency Subaccounts & Activity' },
          { id: 'SEND', label: 'Send & FX Transfer' },
          { id: 'PORTABILITY', label: 'Identity Portability & PIN' },
          { id: 'OFFLINE', label: 'Offline Queue Safety' },
          { id: 'STATEMENT', label: 'Statements & Reconciliation' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer border ${
              tab === t.id
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#121212] text-[#A0A0A0] border-[#27272a] hover:text-[#F5F5F5]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CURRENCY SUBACCOUNTS & RECENT LEDGER */}
      {tab === 'OVERVIEW' && activeBundle && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              Multi-Currency Subaccounts ({activeBundle.subaccounts.length}) · Integer Minor Units (Scale 100)
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={addCurrency}
                onChange={(e) => setAddCurrency(e.target.value as V23CurrencyCode)}
                className="bg-[#121212] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]"
              >
                {['UGX', 'KES', 'TZS', 'RWF', 'BIF', 'SSP', 'CDF', 'USD', 'EUR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleEnableCurrency}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-[#D4AF37] text-xs text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer"
              >
                + Enable Currency
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeBundle.subaccounts.map((sub) => (
              <div key={sub.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                  <span className="font-mono font-semibold text-[#D4AF37]">{sub.currency} · SANDBOX TEST</span>
                  <span className="font-mono">{sub.ledgerAccountId}</span>
                </div>
                <div className="font-mono tabular-nums text-xl font-bold text-[#F5F5F5]">
                  {fmtMinor(sub.availableMinor, sub.currency)}
                </div>
                <div className="pt-2 border-t border-[#27272a] grid grid-cols-2 gap-1 text-[11px] text-[#A0A0A0] font-mono tabular-nums">
                  <span>Pending: {fmtMinor(sub.pendingMinor, sub.currency)}</span>
                  <span>Reserved: {fmtMinor(sub.reservedMinor, sub.currency)}</span>
                  <span>Restricted: {fmtMinor(sub.restrictedMinor, sub.currency)}</span>
                  <span>Reversed: {fmtMinor(sub.reversedMinor, sub.currency)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#F5F5F5]">Recent Internal Wallet Transactions</span>
              <span className="text-xs text-[#A0A0A0] font-mono">{transactions.length} records</span>
            </div>
            <div className="divide-y divide-[#27272a]">
              {transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-mono text-[#F5F5F5]">
                      {tx.txReference} · <span className="text-[#D4AF37]">{tx.status}</span> · {tx.txType}
                    </div>
                    <div className="text-[#A0A0A0]">
                      <span className="font-mono">{tx.sourceEuwn}</span> ({tx.sourceCountryCode}) → <span className="font-mono">{tx.destinationEuwn}</span> ({tx.destinationCountryCode}) · {tx.purpose}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-[#F5F5F5] font-semibold">{fmtMinor(tx.sourceAmountMinor, tx.sourceCurrency)}</div>
                    <div className="text-[#A0A0A0] text-[11px]">
                      {tx.fxApplied ? `Converted: ${fmtMinor(tx.destinationAmountMinor, tx.destinationCurrency)}` : `Fee: ${fmtMinor(tx.feeMinor, tx.feeCurrency)}`}
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-[#A0A0A0]">No sandbox wallet transfers executed yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEND & FX TRANSFER */}
      {tab === 'SEND' && activeBundle && (
        <form onSubmit={handleSendTransfer} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Send size={15} className="text-[#D4AF37]" /> Internal Wallet Transfer (Lookup → Preview → Confirm)
            </h2>
            <span className="text-xs text-[#A0A0A0]">Sandbox Ledger Only · Double-Entry Enforced</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[#A0A0A0] mb-1">Recipient Permanent EUWN</label>
              <input
                type="text"
                required
                value={recipientEuwn}
                onChange={(e) => setRecipientEuwn(e.target.value)}
                placeholder="EX-3H8N6V2X9C4T"
                className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-sm font-mono text-[#F5F5F5]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A0A0A0] mb-1">Send Amount (Major Units)</label>
              <input
                type="number"
                required
                min={1}
                value={amountMajor}
                onChange={(e) => setAmountMajor(Number(e.target.value))}
                className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-[#F5F5F5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-[#A0A0A0] mb-1">From</label>
                <select
                  value={srcCurrency}
                  onChange={(e) => setSrcCurrency(e.target.value as V23CurrencyCode)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-2 text-sm text-[#F5F5F5]"
                >
                  {['UGX', 'KES', 'TZS', 'RWF', 'BIF', 'SSP', 'CDF', 'USD', 'EUR'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#A0A0A0] mb-1">To</label>
                <select
                  value={dstCurrency}
                  onChange={(e) => setDstCurrency(e.target.value as V23CurrencyCode)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-2 py-2 text-sm text-[#F5F5F5]"
                >
                  {['UGX', 'KES', 'TZS', 'RWF', 'BIF', 'SSP', 'CDF', 'USD', 'EUR'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLookupAndPreview}
              disabled={busy}
              className="px-4 py-2 rounded-lg border border-[#D4AF37] text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer"
            >
              1. Verify Recipient &amp; Preview Fee / FX
            </button>
            <span className="text-xs text-[#A0A0A0]">
              Seed demo PINs: WLT-001 <span className="font-mono text-[#F5F5F5]">2468</span> · WLT-002 <span className="font-mono text-[#F5F5F5]">1357</span> · WLT-006 <span className="font-mono text-[#F5F5F5]">8642</span>
            </span>
          </div>

          {lookupResult && (
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-2 text-xs">
              <div className="text-[#F5F5F5] font-semibold">
                Verified Recipient: {lookupResult.displayName} ({lookupResult.euwn})
              </div>
              <div className="text-[#A0A0A0]">
                Category: {lookupResult.walletCategory} · Country Context: {lookupResult.countryName} · KYC: {lookupResult.identityVerificationStatus}
              </div>
              {feePreview && (
                <div className="font-mono tabular-nums text-[#F5F5F5]">
                  Amount: {fmtMinor(feePreview.amountMinor, feePreview.currency)} · Sandbox Fee: {fmtMinor(feePreview.feeMinor, feePreview.currency)} · Total Debit: {fmtMinor(feePreview.totalDebitMinor, feePreview.currency)}
                </div>
              )}
              {fxPreview?.fxApplied && (
                <div className="pt-2 border-t border-[#27272a] space-y-2">
                  <div className="text-amber-300 font-mono">
                    Synthetic Test FX Rate: 1 {fxPreview.sourceCurrency} = {fxPreview.fxRateApplied} {fxPreview.destinationCurrency} → Recipient receives {fmtMinor(fxPreview.destinationAmountMinor, fxPreview.destinationCurrency)}
                  </div>
                  <label className="flex items-center gap-2 text-[#F5F5F5] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fxConfirmed}
                      onChange={(e) => setFxConfirmed(e.target.checked)}
                    />
                    <span>I explicitly confirm this synthetic test FX conversion rate prior to execution.</span>
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={txPurpose}
              onChange={(e) => setTxPurpose(e.target.value)}
              placeholder="Payment purpose / reference"
              className="md:col-span-2 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-[#F5F5F5]"
            />
            <input
              type="password"
              required
              value={txPin}
              onChange={(e) => setTxPin(e.target.value)}
              placeholder="Wallet PIN"
              maxLength={6}
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-sm font-mono text-[#F5F5F5]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="min-h-[42px] px-5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={14} /> 2. Authorize &amp; Post Internal Transfer
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: IDENTITY PORTABILITY & PIN */}
      {tab === 'PORTABILITY' && activeBundle && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Smartphone size={15} className="text-[#D4AF37]" /> Phone, Device &amp; Cross-Border Portability
            </div>
            <p className="text-xs text-[#A0A0A0]">
              Permanent EUWN <span className="font-mono text-[#F5F5F5]">{activeBundle.wallet.euwn}</span> never changes when you update phone numbers, replace devices, or travel across participating countries.
            </p>
            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
                />
                <button
                  type="button"
                  onClick={() => handlePortability('UPDATE_PHONE')}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] cursor-pointer"
                >
                  Update Phone ({activeBundle.allocation?.phoneChangeCount || 0})
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeviceLabel}
                  onChange={(e) => setNewDeviceLabel(e.target.value)}
                  className="flex-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
                />
                <button
                  type="button"
                  onClick={() => handlePortability('MIGRATE_DEVICE')}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] cursor-pointer"
                >
                  Migrate Device ({activeBundle.allocation?.deviceMigrationCount || 0})
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={travelCountry}
                  onChange={(e) => setTravelCountry(e.target.value)}
                  className="flex-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
                >
                  {countries.map((c) => (
                    <option key={c.countryCode} value={c.countryCode}>
                      {c.countryCode} · {c.countryName} ({c.defaultCurrency})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handlePortability('TRAVEL_COUNTRY')}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                >
                  Switch Country Context
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleRotatePin} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <KeyRound size={15} className="text-[#D4AF37]" /> Wallet PIN Rotation &amp; Account Recovery
            </div>
            <p className="text-xs text-[#A0A0A0]">
              PINs are stored strictly using salted scrypt hashes. Wallet numbers alone never authorize transactions.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Current PIN</label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  maxLength={6}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
                />
              </div>
              <div>
                <label className="block text-[#A0A0A0] mb-1">New PIN (4-6 digits)</label>
                <input
                  type="password"
                  value={nextPin}
                  onChange={(e) => setNextPin(e.target.value)}
                  maxLength={6}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handlePortability('RECOVER_ACCOUNT')}
                disabled={busy}
                className="px-3 py-2 rounded-lg border border-[#27272a] text-xs text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
              >
                Run Recovery Verification
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
              >
                Rotate Wallet PIN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: OFFLINE QUEUE SAFETY */}
      {tab === 'OFFLINE' && activeBundle && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
            <WifiOff size={15} className="text-[#D4AF37]" /> Offline Wallet Draft Queue (Server-Authoritative Sync)
          </div>
          <p className="text-xs text-[#A0A0A0]">
            Offline clients never create spendable money or authorize unverified withdrawals. Local drafts are reconciled deterministically when connectivity returns.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              value={offEuwn}
              onChange={(e) => setOffEuwn(e.target.value)}
              placeholder="Recipient EUWN"
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
            />
            <input
              type="number"
              value={offAmountMajor}
              onChange={(e) => setOffAmountMajor(Number(e.target.value))}
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
            />
            <select
              value={offCurrency}
              onChange={(e) => setOffCurrency(e.target.value as V23CurrencyCode)}
              className="bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
            >
              {['UGX', 'KES', 'USD'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQueueOffline(false)}
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-lg border border-[#27272a] text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
              >
                Queue Local
              </button>
              <button
                type="button"
                onClick={() => handleQueueOffline(true)}
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
              >
                Queue &amp; Sync
              </button>
            </div>
          </div>
          <div className="divide-y divide-[#27272a] border-t border-[#27272a] pt-2">
            {offlineQueue.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[#F5F5F5]">{item.clientDraftId}</span> · → <span className="font-mono">{item.recipientEuwn}</span> · {fmtMinor(item.amountMinor, item.currency)}
                  {item.conflictOrRejectReason && <div className="text-red-300 mt-0.5">{item.conflictOrRejectReason}</div>}
                </div>
                <span className="font-mono text-[#D4AF37]">{item.syncStatus}</span>
              </div>
            ))}
            {offlineQueue.length === 0 && (
              <div className="py-4 text-xs text-[#A0A0A0]">No offline wallet drafts queued.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STATEMENT & RECONCILIATION */}
      {tab === 'STATEMENT' && activeBundle && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <FileText size={15} className="text-[#D4AF37]" /> Structured Wallet Statement &amp; Ledger Proof
            </div>
            <button
              type="button"
              onClick={handleLoadStatement}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={14} /> Generate Statement &amp; Reconcile
            </button>
          </div>
          {statement ? (
            <div className="space-y-3 text-xs">
              <div className="font-mono text-[#F5F5F5]">
                Statement ID: {statement.statementId} · Ledger Balanced: {String(statement.ledgerBalanced)} · Reconciliation: {statement.latestReconciliation?.status} ({statement.latestReconciliation?.totalPostingsChecked} postings audited)
              </div>
              <div className="text-[#A0A0A0]">{statement.disclaimer}</div>
              <div className="border-t border-[#27272a] pt-2 space-y-1.5">
                {statement.postings?.slice(0, 6).map((p: any) => (
                  <div key={p.id} className="font-mono text-[11px] text-[#A0A0A0] flex justify-between">
                    <span>{p.txReference} · JRN {p.journalEntryId}</span>
                    <span className="text-emerald-400">Balanced: {String(p.balanced)} · SHA {p.postingHashSha256?.slice(0, 14)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#A0A0A0]">
              Click Generate Statement &amp; Reconcile to export immutable postings, verify double-entry GL balance, and audit subaccount buckets.
            </div>
          )}
        </div>
      )}

      {/* Cross-Module Quick Link */}
      <div className="flex items-center justify-between bg-[#121212] border border-[#27272a] rounded-xl px-4 py-3 text-xs">
        <span className="text-[#A0A0A0] flex items-center gap-2">
          <Layers size={14} className="text-[#D4AF37]" /> Integrated across Marketplace, Invoices, Procurement, Logistics, Cooperatives &amp; Projects (V1–V22).
        </span>
        <button
          type="button"
          onClick={() => onNavigate('v23-wallet-admin')}
          className="text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
        >
          Wallet Admin &amp; Continuity <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
