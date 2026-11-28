/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V30.0 - Business Finance Operations (SoD), Commercial Disputes, Fraud Controls & Regulatory Readiness View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Gavel, Landmark, Receipt, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { EconexImage } from '../ux/EconexImage.tsx';
import { ECONEX_ASSET_MANIFEST } from '../../config/econexAssetManifest.ts';
import type {
  V30BusinessFinanceDoc,
  V30FinancialDispute,
  V30FraudRiskEvent,
  V30RegulatoryRequirement,
} from '../../types/index.ts';

export type V30GovernanceSubTab = 'BUSINESS_FINANCE' | 'DISPUTES' | 'FRAUD' | 'REGULATORY';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: V30GovernanceSubTab;
}

export const V30BusinessDisputesComplianceView: React.FC<Props> = ({ initialSubTab = 'BUSINESS_FINANCE' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry } = useExperience();
  const actor = { userId: currentUser?.id || 'usr_buyer_01', userRole: role, countryCode: activeCountry };
  const isAdmin = role === 'PLATFORM_ADMIN';

  const [subTab, setSubTab] = useState<V30GovernanceSubTab>(initialSubTab);
  const [docs, setDocs] = useState<V30BusinessFinanceDoc[]>([]);
  const [disputes, setDisputes] = useState<V30FinancialDispute[]>([]);
  const [fraudEvents, setFraudEvents] = useState<V30FraudRiskEvent[]>([]);
  const [regReqs, setRegReqs] = useState<V30RegulatoryRequirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [docType, setDocType] = useState<V30BusinessFinanceDoc['docType']>('INVOICE');
  const [counterpartyName, setCounterpartyName] = useState<string>('Kampala Agro Logistics Ltd');
  const [docAmount, setDocAmount] = useState<number>(850000);

  const [disputeReason, setDisputeReason] = useState<string>('Shipment quantity discrepancy noted at delivery gate');
  const [disputeAmount, setDisputeAmount] = useState<number>(150000);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bfRes, dspRes, regRes] = await Promise.all([
        ApiClient.v30GetBusinessFinanceDocs(actor),
        ApiClient.v30GetDisputes(actor),
        ApiClient.v30GetRegulatoryReadiness(actor),
      ]);
      setDocs(bfRes?.docs || []);
      setDisputes(dspRes?.disputes || []);
      setRegReqs(regRes?.requirements || []);
      if (isAdmin) {
        const frRes = await ApiClient.v30GetFraudEvents(actor).catch(() => ({ events: [] }));
        setFraudEvents(frRes?.events || []);
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to load governance workspace.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateDoc = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30CreateBusinessFinanceDoc(
        { docType, counterpartyName, currency: 'UGX', totalMinor: docAmount },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`Created ${out.docRef} pending second-person SoD approval.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Unable to create document.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecideDoc = async (docId: string, decision: 'APPROVE' | 'REJECT') => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30DecideBusinessFinanceDoc(docId, decision, actor);
      if (out?.error) throw new Error(out.error);
      setFeedback(`Document ${out.docRef} updated to ${out.status}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Segregation of duties check rejected decision.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenDispute = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30CreateDispute(
        {
          respondentOrgId: 'org_ent_01',
          amountInDisputeMinor: disputeAmount,
          currency: 'UGX',
          category: 'QUALITY_MISMATCH',
          reason: disputeReason,
        },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`Opened escrow-backed dispute ${out.disputeRef}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Unable to file dispute.');
    } finally {
      setBusy(false);
    }
  };

  const handleReviewFraud = async (eventId: string, decision: 'CLEARED' | 'BLOCKED_CONFIRMED') => {
    setBusy(true);
    setError(null);
    try {
      const out = await ApiClient.v30ReviewFraudEvent(
        eventId,
        { decision, reviewNote: `Human fraud decision -> ${decision}` },
        actor
      );
      if (out?.error) throw new Error(out.error);
      setFeedback(`Fraud event ${eventId} reviewed -> ${out.status}.`);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Fraud review failed.');
    } finally {
      setBusy(false);
    }
  };

  const bannerImg = ECONEX_ASSET_MANIFEST.finance_digital_treasury;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl overflow-hidden border border-[#27272a] bg-[#121212] grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
            Business Finance, Protection &amp; Regulatory Readiness
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F5]">
            Invoicing SoD, Escrow Disputes &amp; Compliance Controls
          </h1>
          <p className="text-sm text-[#C0C0C0] leading-relaxed">
            Enforce 4-eye segregation of duties on business payouts, protect counterparties with evidence-hashed escrow disputes, and track Uganda BoU, FIA, URA &amp; Digital Asset gates honestly.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(
              [
                ['BUSINESS_FINANCE', 'Business Finance (SoD)', Receipt],
                ['DISPUTES', 'Commercial Disputes', Gavel],
                ...(isAdmin ? [['FRAUD', 'Fraud Review Queue', ShieldAlert] as const] : []),
                ...(isAdmin ? [['REGULATORY', 'Regulatory Readiness', Landmark] as const] : []),
              ] as const
            ).map(([id, lbl, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSubTab(id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs border flex items-center gap-2 cursor-pointer ${
                  subTab === id
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#050505] font-semibold'
                    : 'bg-[#181818] border-[#27272a] text-[#C0C0C0] hover:border-[#D4AF37]'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{lbl}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 min-h-[200px]">
          <EconexImage
            src={bannerImg.path}
            alt={bannerImg.alt}
            fallbackLabel={bannerImg.caption}
            aspectClassName="h-full w-full min-h-[200px]"
            overlayGradient
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="min-h-[40px] px-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && <div role="status" className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-xs text-emerald-200">{feedback}</div>}
      {error && <div role="alert" className="p-3 rounded-xl bg-red-950/40 border border-red-700/60 text-xs text-red-200">{error}</div>}

      {/* BUSINESS FINANCE OPS */}
      {subTab === 'BUSINESS_FINANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Create Invoice / PO / Bulk Batch</h2>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Document Type</span>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="INVOICE">Commercial Invoice</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
                <option value="INSTALLMENT_PLAN">Installment Schedule</option>
                <option value="BULK_PAYOUT_BATCH">Bulk Farmer Payout Batch</option>
              </select>
            </label>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Counterparty Name</span>
              <input
                type="text"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Total Amount (UGX)</span>
              <input
                type="number"
                value={docAmount}
                onChange={(e) => setDocAmount(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={handleCreateDoc}
              className="w-full min-h-[44px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Submit for 4-Eye SoD Approval
            </button>
          </div>
          <div className="lg:col-span-7 space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#D4AF37]">{d.docRef} ({d.docType})</span>
                  <span className="font-mono text-[#F5F5F5]">{d.status}</span>
                </div>
                <div className="text-sm font-medium text-[#F5F5F5]">{d.counterpartyName}</div>
                <div className="text-xs text-[#C0C0C0] tabular-nums">
                  Total: {d.totalMinor.toLocaleString()} {d.currency} (Tax {d.taxMinor.toLocaleString()}) · Requester: {d.requesterUserId}
                </div>
                {d.status === 'PENDING_APPROVAL' && (
                  <div className="flex gap-2 pt-2">
                    <button type="button" disabled={busy} onClick={() => handleDecideDoc(d.id, 'APPROVE')} className="min-h-[38px] px-3 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
                      Approve (SoD Checked)
                    </button>
                    <button type="button" disabled={busy} onClick={() => handleDecideDoc(d.id, 'REJECT')} className="min-h-[38px] px-3 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-red-300 cursor-pointer">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPUTES */}
      {subTab === 'DISPUTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Open Evidence-Backed Dispute</h2>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Dispute Amount (UGX)</span>
              <input
                type="number"
                value={disputeAmount}
                onChange={(e) => setDisputeAmount(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
              />
            </label>
            <label className="block text-xs text-[#C0C0C0] space-y-1">
              <span>Dispute Reason &amp; Evidence Note</span>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={handleOpenDispute}
              className="w-full min-h-[44px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Hold Sandbox Escrow &amp; File Dispute
            </button>
          </div>
          <div className="lg:col-span-7 space-y-3">
            {disputes.map((dsp) => (
              <div key={dsp.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#D4AF37]">{dsp.disputeRef} · {dsp.category}</span>
                  <span className="text-amber-300">{dsp.status}</span>
                </div>
                <p className="text-xs text-[#F5F5F5]">{dsp.reason}</p>
                <div className="text-xs text-[#A0A0A0] tabular-nums">
                  Amount: {dsp.amountInDisputeMinor.toLocaleString()} {dsp.currency} · Escrow Hold: {dsp.escrowHoldActive ? 'ACTIVE' : 'RELEASED'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FRAUD REVIEW QUEUE (ADMIN) */}
      {subTab === 'FRAUD' && (
        <div className="space-y-3">
          <div className="text-xs text-[#A0A0A0]">
            Human-in-the-loop review required before any permanent restriction is applied.
          </div>
          {fraudEvents.map((ev) => (
            <div key={ev.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#D4AF37]">{ev.id} · {ev.ruleTriggered} · Score {ev.riskScore}/100</div>
                <div className="text-xs text-[#C0C0C0]">Actor: {ev.actorUserId} · Status: {ev.status} · Human Review Required: {String(ev.humanReviewRequired)}</div>
              </div>
              {isAdmin && ev.status === 'OPEN_REVIEW' && (
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={() => handleReviewFraud(ev.id, 'CLEARED')} className="min-h-[38px] px-3 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
                    Clear Risk
                  </button>
                  <button type="button" disabled={busy} onClick={() => handleReviewFraud(ev.id, 'BLOCKED_CONFIRMED')} className="min-h-[38px] px-3 rounded-lg bg-[#181818] border border-red-800 text-xs text-red-300 cursor-pointer">
                    Confirm Block
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* REGULATORY READINESS CENTRE (ADMIN) */}
      {subTab === 'REGULATORY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regReqs.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-[#121212] border border-[#27272a] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-[#D4AF37]">{r.jurisdiction} · {r.requirementCode}</div>
                  <h3 className="text-sm font-semibold text-[#F5F5F5] mt-0.5">{r.title}</h3>
                </div>
                <span className="text-[11px] font-mono text-amber-300 shrink-0">{r.status}</span>
              </div>
              <div className="text-xs text-[#C0C0C0]">{r.authority} — {r.frameworkName}</div>
              <div className="text-xs text-[#A0A0A0]">{r.honestyDisclosure}</div>
              <div className="text-[11px] text-emerald-400">Evidence Records Attached: {r.evidenceCount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
