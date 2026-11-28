/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V30.0 - Universal ECONEX Wallet, Multi-Rail Funding & Card Controls View (/wallet/universal)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Lock, RefreshCw, ShieldAlert, Unlock, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { EconexImage } from '../ux/EconexImage.tsx';
import { ECONEX_ASSET_MANIFEST } from '../../config/econexAssetManifest.ts';
import type { V30WalletCardProfile } from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V30UniversalWalletAndCardsView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || 'usr_farmer_01', userRole: role };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.v30GetUniversalWalletOverview(actor);
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Universal Wallet overview.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleToggleFreeze = async (card: V30WalletCardProfile) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await ApiClient.v30UpdateCardControls(card.id, { frozen: !card.frozen }, actor);
      if (updated?.error) throw new Error(updated.error);
      setFeedback(`Card ${updated.tokenizedCardRef} is now ${updated.frozen ? 'FROZEN (Sandbox)' : 'ACTIVE (Sandbox)'}.`);
      await loadWallet();
    } catch (e: any) {
      setError(e?.message || 'Unable to update card state.');
    } finally {
      setBusy(false);
    }
  };

  const handleRaiseLimit = async (card: V30WalletCardProfile) => {
    setBusy(true);
    setError(null);
    try {
      const nextDaily = card.dailySpendLimitMinor + 250000;
      const updated = await ApiClient.v30UpdateCardControls(
        card.id,
        {
          dailySpendLimitMinor: nextDaily,
          monthlySpendLimitMinor: Math.max(card.monthlySpendLimitMinor, nextDaily * 4),
        },
        actor
      );
      if (updated?.error) throw new Error(updated.error);
      setFeedback(`Updated daily spend cap on ${updated.tokenizedCardRef} to UGX ${updated.dailySpendLimitMinor.toLocaleString()}.`);
      await loadWallet();
    } catch (e: any) {
      setError(e?.message || 'Unable to update spend limit.');
    } finally {
      setBusy(false);
    }
  };

  const heroImg = ECONEX_ASSET_MANIFEST.finance_merchant_qr;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl overflow-hidden border border-[#27272a] bg-[#121212] grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            Universal ECONEX Wallet &amp; Card Controls
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F5]">
            EUWN Multi-Rail Wallet, Subaccounts &amp; Spending Caps
          </h1>
          <p className="text-sm text-[#C0C0C0] leading-relaxed">
            Built directly atop V23 Universal Wallet Numbers (`EX-...`) and double-entry minor-unit subaccounts, adding provider-neutral routing, transparent FX disclosure, and card spend governance.
          </p>
          <div className="p-3 rounded-xl bg-[#181818] border border-amber-700/50 text-xs text-amber-200 flex items-start gap-2">
            <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Sandbox Wallet &amp; Card Disclosure:</strong> `realValueOperationsEnabled=false`, `schemeCertified=false`, `liveIssuanceEnabled=false`.
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => onNavigate('v30-routing')} className="min-h-[42px] px-4 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Send or Pay via Smart Router
            </button>
            <button type="button" onClick={() => onNavigate('v23-cards')} className="min-h-[42px] px-4 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] cursor-pointer">
              Full Card Issuance Lifecycle
            </button>
            <button type="button" onClick={loadWallet} disabled={loading} className="min-h-[42px] px-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <div className="lg:col-span-5 min-h-[200px]">
          <EconexImage
            src={heroImg.path}
            alt={heroImg.alt}
            fallbackLabel={heroImg.caption}
            aspectClassName="h-full w-full min-h-[200px]"
            overlayGradient
          />
        </div>
      </section>

      {feedback && <div role="status" className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-xs text-emerald-200">{feedback}</div>}
      {error && <div role="alert" className="p-3 rounded-xl bg-red-950/40 border border-red-700/60 text-xs text-red-200">{error}</div>}

      {/* Wallets & Card Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <Wallet size={16} aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#F5F5F5]">EUWN Sandbox Wallets</h2>
          </div>
          {(data?.wallets || []).map((w: any) => (
            <div key={w.id} className="p-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-1 tabular-nums">
              <div className="flex justify-between font-mono">
                <span className="text-[#D4AF37]">{w.universalWalletNumber}</span>
                <span className="text-emerald-400">{w.status}</span>
              </div>
              <div className="text-[#F5F5F5] font-medium">{w.accountLabel}</div>
              <div className="text-[#A0A0A0]">Default Currency: {w.defaultCurrency} · Ledger Balanced: {String(data?.reconciliationBalanced)}</div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <CreditCard size={16} aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#F5F5F5]">ECONEX Card Spend Controls (Sandbox)</h2>
          </div>
          {(data?.cardProfiles || []).map((c: V30WalletCardProfile) => (
            <div key={c.id} className="p-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-2 tabular-nums">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[#D4AF37]">{c.tokenizedCardRef}</span>
                <span className={c.frozen ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'}>
                  {c.frozen ? 'FROZEN' : 'ACTIVE_SANDBOX'}
                </span>
              </div>
              <div className="text-[#C0C0C0]">
                Daily Cap: UGX {c.dailySpendLimitMinor.toLocaleString()} · Monthly Cap: UGX {c.monthlySpendLimitMinor.toLocaleString()}
              </div>
              <div className="text-[#A0A0A0]">Categories: {c.allowedCategories.join(', ')}</div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggleFreeze(c)}
                  className="min-h-[38px] px-3 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5] flex items-center gap-1.5 cursor-pointer"
                >
                  {c.frozen ? <Unlock size={13} /> : <Lock size={13} />}
                  <span>{c.frozen ? 'Unfreeze Card' : 'Freeze Card'}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRaiseLimit(c)}
                  className="min-h-[38px] px-3 rounded-lg bg-[#121212] border border-[#D4AF37]/60 text-xs text-[#D4AF37] cursor-pointer"
                >
                  +250,000 Daily Cap
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
