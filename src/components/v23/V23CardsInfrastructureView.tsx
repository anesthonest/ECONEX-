/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Virtual & Physical ECONEX Cards (Simulated Infrastructure Only)
 * Strictly enforces schemeCertified=false, physicalCardLiveIssued=false, externalNetworkUsable=false.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Lock, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type { V23PhysicalCard, V23PhysicalCardStage, V23VirtualCard, V30WalletCardProfile } from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const PHYSICAL_STAGES: V23PhysicalCardStage[] = [
  'APPLIED',
  'ELIGIBILITY_REVIEW',
  'APPROVED',
  'PRODUCTION_REQUESTED',
  'PERSONALIZATION',
  'DISPATCHED',
  'DELIVERED',
  'PIN_SETUP_VERIFIED',
  'ACTIVATED',
  'SUSPENDED',
  'REPLACEMENT_REQUESTED',
  'RENEWED',
  'CANCELLED',
];

export const V23CardsInfrastructureView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || 'usr_farmer_01', userRole: role };

  const [virtualCards, setVirtualCards] = useState<V23VirtualCard[]>([]);
  const [physicalCards, setPhysicalCards] = useState<V23PhysicalCard[]>([]);
  const [v30CardProfiles, setV30CardProfiles] = useState<V30WalletCardProfile[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('WLT-V23-001');
  const [cardholderName, setCardholderName] = useState<string>('SARAH NAMUBIRU');
  const [simAmountMajor, setSimAmountMajor] = useState<number>(20000);
  const [simCountry, setSimCountry] = useState<string>('UG');
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, wRes, uRes] = await Promise.all([
        ApiClient.v23GetCards(actor),
        ApiClient.v23GetWallets(role === 'PLATFORM_ADMIN' ? 'all' : 'own', actor),
        ApiClient.v30GetUniversalWalletOverview(actor).catch(() => ({ cardProfiles: [] })),
      ]);
      setVirtualCards(cRes.virtualCards || []);
      setPhysicalCards(cRes.physicalCards || []);
      setV30CardProfiles(uRes?.cardProfiles || []);
      const wl = Array.isArray(wRes) ? wRes : [];
      setWallets(wl);
      if (wl.length > 0 && !wl.some((b: any) => b.wallet.id === selectedWalletId)) {
        setSelectedWalletId(wl[0].wallet.id);
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to load card infrastructure view.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleIssueVirtual = async () => {
    setBusy(true);
    setError(null);
    try {
      const card = await ApiClient.v23IssueVirtualCard(
        { walletAccountId: selectedWalletId, cardholderName },
        actor
      );
      if (card?.error) throw new Error(card.error);
      setFeedback(`Issued simulated virtual card ${card.tokenizedCardRef} (externalNetworkUsable=false).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Virtual card issuance failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVirtualStatus = async (cardId: string, targetStatus: string) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await ApiClient.v23SetVirtualCardStatus(
        cardId,
        { targetStatus, reason: `Cardholder control -> ${targetStatus}` },
        actor
      );
      if (updated?.error) throw new Error(updated.error);
      setFeedback(`Virtual card ${updated.tokenizedCardRef} updated to ${updated.cardStatus}.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to change card status.');
    } finally {
      setBusy(false);
    }
  };

  const handleSimulateAuth = async (cardId: string) => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v23SimulateVirtualCardAuth(
        cardId,
        {
          merchantEuwn: 'EX-3H8N6V2X9C4T',
          amountMinor: Math.round(simAmountMajor * 100),
          currency: 'UGX',
          countryCode: simCountry,
          idempotencyKey: `VCARD-SIM-${cardId}-${Date.now()}`,
        },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`Simulated authorization approved in sandbox ledger (${out.transaction.txReference}).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Card simulation declined.');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyPhysical = async () => {
    setBusy(true);
    setError(null);
    try {
      const card = await ApiClient.v23ApplyPhysicalCard(
        { walletAccountId: selectedWalletId, cardholderName, deliveryCountryCode: 'UG', deliveryDistrict: 'Kampala' },
        actor
      );
      if (card?.error) throw new Error(card.error);
      setFeedback(`Submitted simulated physical card workflow ${card.id} (schemeCertified=false).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Physical card workflow submission failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdvancePhysical = async (cardId: string, nextStage: V23PhysicalCardStage) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await ApiClient.v23AdvancePhysicalCardStage(
        cardId,
        { targetStage: nextStage, simPin: nextStage === 'PIN_SETUP_VERIFIED' ? '4321' : undefined },
        actor
      );
      if (updated?.error) throw new Error(updated.error);
      setFeedback(`Physical card workflow ${updated.id} moved to ${updated.stage} (simulated only).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to advance workflow.');
    } finally {
      setBusy(false);
    }
  };

  const handleV30CardControl = async (
    card: V30WalletCardProfile,
    patch: { frozen?: boolean; dailySpendLimitMinor?: number; monthlySpendLimitMinor?: number }
  ) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await ApiClient.v30UpdateCardControls(card.id, patch, actor);
      if (updated?.error) throw new Error(updated.error);
      setFeedback(
        `V30 Card Governance updated ${updated.tokenizedCardRef}: frozen=${updated.frozen}, dailyCap=${Number(updated.dailySpendLimitMinor).toLocaleString()} minor units (schemeCertified=false).`
      );
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to update V30 card governance.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-amber-300">
            SIMULATED CARD INFRASTRUCTURE · SCHEME CERTIFICATION: FALSE · ATM NETWORK LIVE: FALSE
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1">
            Virtual &amp; Physical ECONEX Card Architecture
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Tokenized card controls, freeze/unfreeze enforcement, spending limits, and 13-stage physical workflow simulation. Cards are NOT usable on Visa, Mastercard, or external ATMs.
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

      {/* Truthfulness Disclosure Banner */}
      <div className="bg-[#121212] border border-amber-900/70 rounded-xl px-4 py-3 text-xs text-amber-200 flex items-center gap-2">
        <ShieldAlert size={16} className="shrink-0 text-amber-300" />
        <span>
          Truthful Status: V23_PHYSICAL_CARDS_ISSUED = false · V23_CARD_SCHEME_CERTIFIED = false · V23_ATM_NETWORK_LIVE = false. Only sandbox tokenized wallet controls operate here.
        </span>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900 text-xs text-red-200">{error}</div>}
      {feedback && <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900 text-xs text-emerald-200">{feedback}</div>}

      {/* Issue New Simulated Card Controls */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 text-xs">
        <select
          value={selectedWalletId}
          onChange={(e) => setSelectedWalletId(e.target.value)}
          className="w-full md:w-auto flex-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]"
        >
          {wallets.map((b: any) => (
            <option key={b.wallet.id} value={b.wallet.id}>{b.wallet.euwn} · {b.wallet.displayName}</option>
          ))}
        </select>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Cardholder Name"
          className="w-full md:w-56 bg-[#0a0a0c] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
        />
        <button
          type="button"
          onClick={handleIssueVirtual}
          disabled={busy}
          className="w-full md:w-auto px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> Issue Virtual Card (Test)
        </button>
        <button
          type="button"
          onClick={handleApplyPhysical}
          disabled={busy}
          className="w-full md:w-auto px-4 py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] font-semibold cursor-pointer"
        >
          + Physical Card Workflow (Sim)
        </button>
      </div>

      {/* Virtual Cards */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#F5F5F5]">Virtual ECONEX Cards ({virtualCards.length}) · Tokenized Sandbox Only</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#A0A0A0]">Sim Charge UGX:</span>
            <input
              type="number"
              value={simAmountMajor}
              onChange={(e) => setSimAmountMajor(Number(e.target.value))}
              className="w-24 bg-[#121212] border border-[#27272a] rounded px-2 py-1 font-mono text-[#F5F5F5]"
            />
            <select
              value={simCountry}
              onChange={(e) => setSimCountry(e.target.value)}
              className="bg-[#121212] border border-[#27272a] rounded px-2 py-1 font-mono text-[#F5F5F5]"
            >
              {['UG', 'KE', 'TZ', 'RW'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {virtualCards.map((vc) => (
            <div key={vc.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[#D4AF37]">{vc.tokenizedCardRef}</span>
                <span className="font-mono text-[#F5F5F5]">{vc.cardStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-lg tracking-widest text-[#F5F5F5]">{vc.maskedPan}</div>
                  <div className="text-xs text-[#A0A0A0] mt-1">{vc.cardholderName} · Exp {vc.expiryPlaceholder} · EUWN {vc.euwn}</div>
                </div>
                <CreditCard size={24} className="text-[#D4AF37]" />
              </div>
              <div className="text-xs text-[#A0A0A0] font-mono">
                Currencies: {vc.allowedCurrencies.join(', ')} · Countries: {vc.allowedCountries.join(', ')} · External Usable: false
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a] text-xs">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSimulateAuth(vc.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                >
                  Simulate Purchase
                </button>
                {vc.cardStatus === 'ACTIVE_TEST' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleVirtualStatus(vc.id, 'FROZEN')}
                    className="px-3 py-1.5 rounded-lg border border-[#27272a] text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-1 cursor-pointer"
                  >
                    <Lock size={12} /> Freeze
                  </button>
                ) : vc.cardStatus === 'FROZEN' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleVirtualStatus(vc.id, 'ACTIVE_TEST')}
                    className="px-3 py-1.5 rounded-lg border border-[#D4AF37] text-[#D4AF37] cursor-pointer"
                  >
                    Unfreeze
                  </button>
                ) : null}
                {vc.cardStatus !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleVirtualStatus(vc.id, 'CANCELLED')}
                    className="px-3 py-1.5 rounded-lg border border-red-900 text-red-300 cursor-pointer"
                  >
                    Cancel Card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Physical Card 13-Stage Workflow (Simulated Only) */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#F5F5F5]">
          Physical ECONEX Card Issuance Workflows ({physicalCards.length}) · Simulated Non-Live Architecture
        </h2>
        <div className="divide-y divide-[#27272a]">
          {physicalCards.map((pc) => {
            const idx = PHYSICAL_STAGES.indexOf(pc.stage);
            const nextStage = idx >= 0 && idx < 8 ? PHYSICAL_STAGES[idx + 1] : null;
            return (
              <div key={pc.id} className="py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-[#F5F5F5]">
                    {pc.id} · {pc.maskedPan} · Stage: <span className="text-[#D4AF37]">{pc.stage}</span>
                  </div>
                  <div className="text-[#A0A0A0] font-mono">
                    schemeCertified: {String(pc.schemeCertified)} · physicalCardLiveIssued: {String(pc.physicalCardLiveIssued)} · ATM: {pc.atmInterfaceStatus}
                  </div>
                  <div className="text-[#71717a]">{pc.nonCertificationNotice}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextStage && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAdvancePhysical(pc.id, nextStage)}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                    >
                      Advance → {nextStage}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || pc.cardStatus === 'REPORTED_LOST' || pc.stage === 'SUSPENDED'}
                    onClick={() => handleAdvancePhysical(pc.id, 'SUSPENDED')}
                    className="px-3 py-1.5 rounded-lg border border-red-900 text-red-300 cursor-pointer"
                  >
                    Suspend / Report Lost
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* V30 Spend-Limit & Freeze Governance Controls */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              V30 Card Spend-Limit &amp; Freeze Governance ({v30CardProfiles.length}) · Sandbox Token Controls
            </h2>
            <p className="text-xs text-[#A0A0A0] mt-0.5">
              Enforces daily/monthly spend caps, merchant category controls &amp; instant freeze while strictly maintaining schemeCertified=false and liveIssuanceEnabled=false.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('v30-wallet-universal')}
            className="px-3 py-1.5 rounded-lg border border-[#D4AF37] text-xs text-[#D4AF37] cursor-pointer self-start sm:self-auto"
          >
            Open Universal Wallet
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {v30CardProfiles.map((cp) => (
            <div key={cp.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[#D4AF37]">{cp.tokenizedCardRef}</span>
                <span className={`font-mono ${cp.frozen ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {cp.frozen ? 'FROZEN' : 'ACTIVE_SANDBOX'}
                </span>
              </div>
              <div className="text-[#F5F5F5] font-medium">
                Wallet {cp.walletId} · Daily Cap {cp.dailySpendLimitMinor.toLocaleString()} · Monthly Cap {cp.monthlySpendLimitMinor.toLocaleString()} minor
              </div>
              <div className="text-[#A0A0A0] font-mono">
                Categories: {cp.allowedCategories.join(', ')} · schemeCertified={String(cp.schemeCertified)} · liveIssuanceEnabled={String(cp.liveIssuanceEnabled)}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleV30CardControl(cp, { frozen: !cp.frozen })}
                  className="px-3 py-1.5 rounded-lg border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] cursor-pointer"
                >
                  {cp.frozen ? 'Unfreeze Card' : 'Freeze Card'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    handleV30CardControl(cp, {
                      dailySpendLimitMinor: cp.dailySpendLimitMinor + 250000,
                      monthlySpendLimitMinor: Math.max(cp.monthlySpendLimitMinor, (cp.dailySpendLimitMinor + 250000) * 4),
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-[#27272a] hover:border-[#D4AF37] text-[#D4AF37] cursor-pointer"
                >
                  +250,000 Minor Daily Cap
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
