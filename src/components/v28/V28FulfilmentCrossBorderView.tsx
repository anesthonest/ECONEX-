/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 — Fulfilment, Inventory Reservations, Cross-Border Ops & Sandbox Wallet Coordination
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  PackageCheck,
  RefreshCw,
  Truck,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'FULFILMENT' | 'INVENTORY' | 'CROSS_BORDER' | 'WALLET';
}

export const V28FulfilmentCrossBorderView: React.FC<Props> = ({ initialSubTab = 'FULFILMENT' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'FULFILMENT' | 'INVENTORY' | 'CROSS_BORDER' | 'WALLET'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [fulfilment, setFulfilment] = useState<any>({ plans: [], reservations: [], evidences: [] });
  const [crossBorder, setCrossBorder] = useState<any>({ countries: [], executions: [] });
  const [walletCoord, setWalletCoord] = useState<any>(null);

  // Forms
  const [reserveOrderId, setReserveOrderId] = useState('ORD-V28-1001');
  const [reserveInvId, setReserveInvId] = useState('INV-V24-001');
  const [reserveQty, setReserveQty] = useState('5');

  const [xbOrigin, setXbOrigin] = useState('UG');
  const [xbDest, setXbDest] = useState('KE');
  const [xbImporter, setXbImporter] = useState('org_buyer_01');

  const [srcSub, setSrcSub] = useState('SUB-WLT-V23-001-UGX');
  const [dstSub, setDstSub] = useState('SUB-WLT-V23-002-UGX');
  const [txAmountMinor, setTxAmountMinor] = useState('250000');

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  useEffect(() => {
    setTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fRes, xbRes, wRes] = await Promise.all([
        ApiClient.v28GetFulfilment(actor),
        ApiClient.v28GetCrossBorder(actor),
        ApiClient.v28GetWalletCoordination(actor),
      ]);
      setFulfilment(fRes || { plans: [], reservations: [], evidences: [] });
      setCrossBorder(xbRes || { countries: [], executions: [] });
      setWalletCoord(wRes || null);
      if (fRes?.reservations?.[0]?.inventoryId && reserveInvId === 'INV-V24-001') {
        setReserveInvId(fRes.reservations[0].inventoryId);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load V28 fulfilment and cross-border workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId]);

  const handleReserveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const out = await ApiClient.v28ReserveFulfilmentStock(
        {
          orderId: reserveOrderId,
          buyerOrgId: 'org_buyer_01',
          inventoryId: reserveInvId,
          orderedQuantity: Number(reserveQty || 0),
        },
        actor
      );
      setFeedback(`Reserved ${reserveQty} units (${out.reservation.id}); remaining available stock=${out.inventoryRemainingAvailable}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Inventory reservation failed.');
    }
  };

  const handleMilestone = async (planId: string, action: string) => {
    setError(null);
    setFeedback(null);
    try {
      const out = await ApiClient.v28RecordFulfilmentMilestone(
        planId,
        {
          action,
          deliveredQty: action === 'RECORD_POD' ? 1 : 0,
          returnedQty: action === 'REPORT_DAMAGE_RETURN' ? 1 : 0,
          locationLabel: 'Manual Operator Checkpoint (Live GPS Unconnected)',
        },
        actor
      );
      setFeedback(`Recorded ${action} on ${out.plan.id} -> status=${out.plan.status}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update fulfilment plan.');
    }
  };

  const handleCreateCrossBorder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const xb = await ApiClient.v28CreateCrossBorder(
        {
          originCountryCode: xbOrigin,
          destinationCountryCode: xbDest,
          importerOrgId: xbImporter,
          tradeCurrency: 'UGX',
          settlementCurrency: 'KES',
          submittedDocumentIds: ['DOC-COA-01', 'DOC-INVOICE-01'],
        },
        actor
      );
      setFeedback(`Initiated corridor execution ${xb.id} (${xb.originCountryCode} -> ${xb.destinationCountryCode}, stage=${xb.stage}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Cross-border initiation failed.');
    }
  };

  const handleSandboxTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const out = await ApiClient.v28ExecuteSandboxTransfer(
        {
          sourceSubaccountId: srcSub,
          destinationSubaccountId: dstSub,
          amountMinor: Number(txAmountMinor || 0),
          currency: 'UGX',
          idempotencyKey: `V28-UI-${Date.now()}`,
          narration: 'V28 Sandbox Contractual Obligation Settlement',
        },
        actor
      );
      setFeedback(`Sandbox ledger transfer settled (${out.transaction.txReference}, realValueOperationsEnabled: false).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Sandbox transfer rejected.');
    }
  };

  const handleReversal = async (txId: string) => {
    setError(null);
    setFeedback(null);
    try {
      const rev = await ApiClient.v28ReverseSandboxTransfer(txId, 'Operator compensating reversal', actor);
      setFeedback(`Reversed transaction ${rev.reversedTx.txReference} via posting ${rev.compensatingPosting.id}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Reversal requires PLATFORM_ADMIN or COOPERATIVE_ADMIN authority.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D4AF37]">FULFILMENT, INVENTORY, CROSS-BORDER &amp; WALLET COORDINATION</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1 flex items-center gap-2">
              <Truck className="text-[#D4AF37]" size={24} />
              Connected Fulfilment &amp; Corridor Settlement
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              ATP stock reservations, manual shipment milestones (no live GPS claims), 7-country readiness profiles, and idempotent internal sandbox ledger coordination.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['FULFILMENT', 'INVENTORY', 'CROSS_BORDER', 'WALLET'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#181818] text-[#C0C0C0] border border-[#27272a]'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
            <button
              type="button"
              onClick={loadData}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-xs text-red-200">{error}</div>}
      {feedback && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-4 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {(tab === 'FULFILMENT' || tab === 'INVENTORY') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleReserveStock} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <PackageCheck size={16} className="text-[#D4AF37]" /> Reserve Stock &amp; Create Fulfilment
            </h2>
            <input
              value={reserveOrderId}
              onChange={(e) => setReserveOrderId(e.target.value)}
              placeholder="Order ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <input
              value={reserveInvId}
              onChange={(e) => setReserveInvId(e.target.value)}
              placeholder="V24 Inventory ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <input
              type="number"
              min={1}
              value={reserveQty}
              onChange={(e) => setReserveQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Reserve Inventory
            </button>
          </form>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Fulfilment Plans ({fulfilment.plans?.length || 0})</h2>
              {loading ? (
                <div className="text-xs text-[#A0A0A0]">Loading fulfilment workspace...</div>
              ) : (
                (fulfilment.plans || []).map((p: any) => (
                  <div key={p.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-mono text-[#D4AF37]">{p.id} · Order {p.orderId} · {p.status}</div>
                        <div className="text-[#A0A0A0] font-mono">
                          Ordered: {p.orderedQuantity} · Reserved: {p.reservedQuantity} · Delivered: {p.deliveredQuantity} · Returned: {p.returnedQuantity}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleMilestone(p.id, 'AUTHORISE_DISPATCH')}
                          className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] cursor-pointer"
                        >
                          Authorise Dispatch
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMilestone(p.id, 'RECORD_POD')}
                          className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                        >
                          Record POD
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMilestone(p.id, 'REPORT_DAMAGE_RETURN')}
                          className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-amber-300 cursor-pointer"
                        >
                          Return 1 Unit
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-2 text-xs">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Inventory Reservations ({fulfilment.reservations?.length || 0})</h2>
              {(fulfilment.reservations || []).map((r: any) => (
                <div key={r.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 flex justify-between font-mono">
                  <span className="text-[#D4AF37]">{r.id} ({r.sku})</span>
                  <span className="text-[#F5F5F5]">Reserved: {r.quantityReserved} · Returned: {r.quantityReturned} · {r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'CROSS_BORDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateCrossBorder} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Globe size={16} className="text-[#D4AF37]" /> Initiate Cross-Border Corridor
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={xbOrigin}
                onChange={(e) => setXbOrigin(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
              >
                {(crossBorder.countries || []).map((c: any) => (
                  <option key={c.countryCode} value={c.countryCode}>
                    {c.countryCode} ({c.countryName})
                  </option>
                ))}
              </select>
              <select
                value={xbDest}
                onChange={(e) => setXbDest(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
              >
                {(crossBorder.countries || []).map((c: any) => (
                  <option key={c.countryCode} value={c.countryCode}>
                    {c.countryCode} ({c.countryName})
                  </option>
                ))}
              </select>
            </div>
            <input
              value={xbImporter}
              onChange={(e) => setXbImporter(e.target.value)}
              placeholder="Importer Org ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Validate Docs &amp; Launch Corridor
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Country Operating Profiles &amp; Corridor Executions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(crossBorder.countries || []).map((c: any) => (
                <div key={c.countryCode} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
                  <div className="font-mono text-[#D4AF37]">{c.countryCode} · {c.countryName} · {c.readinessLevel}</div>
                  <div className="text-[#A0A0A0] mt-1">Currencies: {(c.supportedCurrencies || []).join(', ')}</div>
                  <div className="text-[#A0A0A0]">Docs: {(c.tradeDocumentationRequired || []).join(', ')}</div>
                </div>
              ))}
            </div>
            <div className="pt-2 space-y-2">
              {(crossBorder.executions || []).map((xb: any) => (
                <div key={xb.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="font-mono text-[#D4AF37]">{xb.id} · {xb.originCountryCode} → {xb.destinationCountryCode} · {xb.stage}</div>
                    <div className="text-[#A0A0A0]">Customs Filing Claimed: {String(xb.officialCustomsOrTaxFilingClaimed)} · FX Dealing Claimed: {String(xb.regulatedFxDealingClaimed)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'WALLET' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSandboxTransfer} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Wallet size={16} className="text-[#D4AF37]" /> Idempotent Sandbox Transfer
            </h2>
            <div className="bg-amber-950/30 border border-amber-800/60 rounded-lg p-3 text-amber-200 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{walletCoord?.sandboxDisclaimer}</span>
            </div>
            <input
              value={srcSub}
              onChange={(e) => setSrcSub(e.target.value)}
              placeholder="Source Subaccount ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <input
              value={dstSub}
              onChange={(e) => setDstSub(e.target.value)}
              placeholder="Destination Subaccount ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <input
              type="number"
              min={1}
              value={txAmountMinor}
              onChange={(e) => setTxAmountMinor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Settle Sandbox Obligation
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5]">
                Sandbox Ledger Transactions (Balanced: {String(walletCoord?.journalBalanced ?? true)})
              </h2>
              <span className="font-mono text-[#D4AF37]">Real Value Enabled: {String(walletCoord?.realValueOperationsEnabled ?? false)}</span>
            </div>
            {(walletCoord?.recentWalletTransactions || []).map((tx: any) => (
              <div key={tx.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-[#D4AF37]">{tx.txReference} · {tx.status}</div>
                  <div className="text-[#F5F5F5]">{tx.purpose}</div>
                  <div className="text-[#A0A0A0] font-mono">{tx.sourceAmountMinor} minor {tx.sourceCurrency}</div>
                </div>
                {tx.status !== 'REVERSED' && (
                  <button
                    type="button"
                    onClick={() => handleReversal(tx.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-[#C0C0C0] cursor-pointer whitespace-nowrap"
                  >
                    Compensating Reverse
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
