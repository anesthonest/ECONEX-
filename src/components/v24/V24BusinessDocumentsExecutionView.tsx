/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V24.0 - Commercial Documents, V23 Wallet Obligations, Trust Reviews & Offline Conflict Sync
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileText,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V24CommercialDocument,
  V24CommercialOrder,
  V24CommercialParticipant,
  V24CommercialThread,
  V24DocumentType,
  V24OfflineDraft,
  V24PaymentObligation,
  V24TrustReview,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const DOC_TYPES: V24DocumentType[] = [
  'QUOTATION',
  'PROFORMA_INVOICE',
  'PURCHASE_ORDER',
  'SALES_ORDER',
  'CONTRACT_AGREEMENT',
  'INVOICE',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'RECEIPT',
  'DELIVERY_NOTE',
  'PACKING_LIST',
  'GOODS_RECEIVED_NOTE',
  'WAYBILL',
  'STATEMENT_OF_ACCOUNT',
];

function fmtMinor(minor: number, currency = 'UGX'): string {
  return `${currency} ${(Number(minor || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export const V24BusinessDocumentsExecutionView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = useMemo(
    () => ({ userId: currentUser?.id || 'usr_buyer_01', userRole: role }),
    [currentUser?.id, role]
  );

  const [tab, setTab] = useState<'DOCUMENTS_WALLET' | 'TRUST' | 'COMMS_OFFLINE'>('DOCUMENTS_WALLET');
  const [participants, setParticipants] = useState<V24CommercialParticipant[]>([]);
  const [documents, setDocuments] = useState<V24CommercialDocument[]>([]);
  const [obligations, setObligations] = useState<V24PaymentObligation[]>([]);
  const [orders, setOrders] = useState<V24CommercialOrder[]>([]);
  const [reviews, setReviews] = useState<V24TrustReview[]>([]);
  const [selectedTrustPartId, setSelectedTrustPartId] = useState<string>('PRTC-V24-001');
  const [trustProfile, setTrustProfile] = useState<any>(null);
  const [threads, setThreads] = useState<V24CommercialThread[]>([]);
  const [offlineDrafts, setOfflineDrafts] = useState<V24OfflineDraft[]>([]);

  // Issue doc form
  const [docType, setDocType] = useState<V24DocumentType>('INVOICE');
  const [docDesc, setDocDesc] = useState<string>('Commercial supply services');
  const [docAmountMajor, setDocAmountMajor] = useState<number>(350000);
  const [docReceiverId, setDocReceiverId] = useState<string>('PRTC-V24-002');
  const [sharePreview, setSharePreview] = useState<string | null>(null);

  // Pay obligation PIN
  const [walletPin, setWalletPin] = useState<string>('2468');

  // Review form
  const [revOrderId, setRevOrderId] = useState<string>('ORD-V24-001');
  const [revSubjectId, setRevSubjectId] = useState<string>('PRTC-V24-001');
  const [revRating, setRevRating] = useState<number>(5);
  const [revComment, setRevComment] = useState<string>('');

  // Thread / Offline draft
  const [threadMsg, setThreadMsg] = useState<string>('');
  const [offlineNote, setOfflineNote] = useState<string>('Field warehouse tally verified offline');

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partRes, docRes, oblRes, ordRes, revRes, trRes, thrRes, offRes] = await Promise.all([
        ApiClient.v24GetParticipants({}, actor),
        ApiClient.v24GetDocuments(actor),
        ApiClient.v24GetObligations(actor),
        ApiClient.v24GetOrders(actor),
        ApiClient.v24GetReviews(actor),
        ApiClient.v24GetTrustProfile(selectedTrustPartId, actor),
        ApiClient.v24GetThreads(actor),
        ApiClient.v24GetOfflineDrafts(actor),
      ]);
      setParticipants(partRes.participants || []);
      setDocuments(docRes.documents || []);
      setObligations(oblRes.obligations || []);
      setOrders(ordRes.orders || []);
      setReviews(revRes.reviews || []);
      setTrustProfile(trRes.profile || null);
      setThreads(thrRes.threads || []);
      setOfflineDrafts(offRes.drafts || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Documents, Obligations & Trust data.');
    } finally {
      setLoading(false);
    }
  }, [actor, selectedTrustPartId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myParticipant = useMemo(
    () => participants.find((p) => p.userId === actor.userId || p.authorizedRepresentatives.some((r) => r.userId === actor.userId)),
    [participants, actor.userId]
  );

  const handleIssueDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24CreateDocument(
        {
          documentType: docType,
          issuingParticipantId: myParticipant?.id,
          receivingParticipantId: docReceiverId,
          lineItems: [{ description: docDesc, quantity: 1, unitPriceMinor: Math.round(docAmountMajor * 100) }],
          currency: 'UGX',
        },
        actor
      );
      setFeedback(`Issued ${res.document?.documentNumber} (${res.document?.documentType}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to issue document.');
    } finally {
      setBusy(false);
    }
  };

  const handleShareDoc = async (docId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24ShareDocument(docId, 24, actor);
      setSharePreview(`${res.sharePath} (expires ${res.expiresAt})`);
      setFeedback('Expiring share token generated.');
    } catch (err: any) {
      setError(err?.message || 'Unable to create share link.');
    } finally {
      setBusy(false);
    }
  };

  const handlePayObligation = async (obl: V24PaymentObligation) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24PayObligation(
        obl.id,
        { pin: walletPin, idempotencyKey: `UI-${obl.id}-${Date.now()}` },
        actor
      );
      setFeedback(
        `Settled obligation ${obl.obligationRef} via V23 ledger tx ${res.v23Transaction?.txReference || res.v23TransactionId} (${res.obligation?.status}).`
      );
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Wallet obligation settlement declined.');
    } finally {
      setBusy(false);
    }
  };

  const handleRefundObligation = async (obl: V24PaymentObligation) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24RefundObligation(
        obl.id,
        { reason: 'Commercial order return/adjustment' },
        actor
      );
      setFeedback(`Reversed/refunded obligation ${res.obligation?.obligationRef} via V23 transaction engine.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Refund failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24SubmitReview(
        {
          orderId: revOrderId,
          reviewerParticipantId: myParticipant?.id,
          subjectParticipantId: revSubjectId,
          rating: revRating,
          comment: revComment,
        },
        actor
      );
      setFeedback('Verified-transaction review posted.');
      setRevComment('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Review requires a completed/delivered order between distinct parties.');
    } finally {
      setBusy(false);
    }
  };

  const handleAppealReview = async (reviewId: string) => {
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24AppealReview(reviewId, { reason: 'Requesting evidence re-verification' }, actor);
      setFeedback(`Appeal opened for review ${reviewId}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Appeal failed.');
    } finally {
      setBusy(false);
    }
  };

  const handlePostThreadMessage = async (threadId: string) => {
    if (!threadMsg.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24PostThreadMessage(threadId, { body: threadMsg }, actor);
      setThreadMsg('');
      setFeedback('Thread message recorded.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to post message.');
    } finally {
      setBusy(false);
    }
  };

  const handleSyncOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24SyncOfflineDraft(
        {
          clientDraftId: `CDRF-UI-${Date.now()}`,
          entityKind: 'INVENTORY_COUNT',
          targetEntityId: 'INV-V24-001',
          baseVersion: 1,
          payload: { note: offlineNote },
        },
        actor
      );
      setFeedback(`Offline draft synced: ${res.draft?.syncState} (${res.draft?.id}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Offline sync blocked.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#D4AF37]">ECONEX V24.0 · Settlement, Trust & Sync</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Commercial Documents, V23 Wallet Obligations & Evidence Trust
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              14 document types (NOT_OFFICIAL_GOVERNMENT_TAX_FILING) · Wallet obligations settle strictly via V23 engine in sandbox mode · Anti-self-review verified feedback · Offline conflict detection.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-[#27272a] bg-[#181818] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v23-wallet')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
            >
              Open V23 Wallet
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 p-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg w-fit">
          {(
            [
              { id: 'DOCUMENTS_WALLET', label: `Documents (${documents.length}) & Obligations (${obligations.length})` },
              { id: 'TRUST', label: `Trust & Reviews (${reviews.length})` },
              { id: 'COMMS_OFFLINE', label: `Comms (${threads.length}) & Offline (${offlineDrafts.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                tab === t.id ? 'bg-[#D4AF37] text-[#050505] font-semibold' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div role="alert" className="bg-red-950/30 border border-red-800 rounded-xl px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl px-4 py-3 text-xs text-emerald-300">
          {feedback}
        </div>
      )}

      {tab === 'DOCUMENTS_WALLET' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleIssueDocument} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
              <FileText size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Issue Commercial Document</span>
            </div>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as V24DocumentType)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {DOC_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
            <select
              value={docReceiverId}
              onChange={(e) => setDocReceiverId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  Recipient: {p.displayName}
                </option>
              ))}
            </select>
            <input
              required
              value={docDesc}
              onChange={(e) => setDocDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            />
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Amount (UGX)</span>
              <input
                type="number"
                min={100}
                value={docAmountMajor}
                onChange={(e) => setDocAmountMajor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Issue Document
            </button>
          </form>

          <div className="lg:col-span-2 space-y-6">
            {/* Payment Obligations */}
            <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-[#D4AF37]" aria-hidden="true" />
                  <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                    Commercial Payment Obligations (V23 Wallet Linked · Sandbox Only)
                  </h2>
                </div>
                <label className="flex items-center gap-2 text-[#A0A0A0]">
                  <span>Wallet PIN:</span>
                  <input
                    type="password"
                    value={walletPin}
                    onChange={(e) => setWalletPin(e.target.value)}
                    className="w-20 px-2 py-1 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono"
                  />
                </label>
              </div>

              <div className="divide-y divide-[#27272a]">
                {obligations.map((obl) => (
                  <div key={obl.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-medium text-sm text-[#F5F5F5]">
                        {obl.obligationRef} · {obl.sourceEntityType} ({obl.sourceEntityId})
                      </div>
                      <div className="text-[#A0A0A0] font-mono tabular-nums">
                        Amount: {fmtMinor(obl.amountMinor, obl.currency)} · Status: {obl.status} · Payee EUWN: {obl.payeeEuwn}
                        {obl.v23TransactionIds?.[0] ? ` · V23 Tx: ${obl.v23TransactionIds[0]}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {(obl.status === 'UNPAID' || obl.status === 'PAYMENT_FAILED') && (
                        <button
                          type="button"
                          onClick={() => handlePayObligation(obl)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                        >
                          Pay via V23 Wallet
                        </button>
                      )}
                      {obl.status === 'PAYMENT_POSTED' && (
                        <button
                          type="button"
                          onClick={() => handleRefundObligation(obl)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                        >
                          Refund via V23
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Documents List */}
            <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4 text-xs">
              <h3 className="text-base font-display font-semibold text-[#F5F5F5]">
                Issued Commercial Documents ({documents.length})
              </h3>
              {sharePreview && (
                <div className="bg-[#181818] border border-[#D4AF37] rounded-lg px-3 py-2 font-mono text-[#F5F5F5]">
                  Share link: {sharePreview}
                </div>
              )}
              <div className="divide-y divide-[#27272a]">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm text-[#F5F5F5]">
                        {doc.documentNumber} · {doc.documentType}
                      </div>
                      <div className="text-[#A0A0A0] font-mono tabular-nums">
                        Total: {fmtMinor(doc.totalAmountMinor, doc.currency)} · {doc.status} · {doc.taxFilingNotice}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShareDoc(doc.id)}
                      className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer shrink-0"
                    >
                      Generate Share Link
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {tab === 'TRUST' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmitReview} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
              <ShieldCheck size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Post Verified-Transaction Review</span>
            </div>
            <select
              value={revOrderId}
              onChange={(e) => setRevOrderId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} ({o.status})
                </option>
              ))}
            </select>
            <select
              value={revSubjectId}
              onChange={(e) => setRevSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  Subject: {p.displayName}
                </option>
              ))}
            </select>
            <select
              value={revRating}
              onChange={(e) => setRevRating(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5
                </option>
              ))}
            </select>
            <textarea
              required
              rows={2}
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              placeholder="Factual fulfilment review..."
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Submit Verified Review
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                Evidence-Based Trust Profile (Paid Badges Forbidden: true)
              </h2>
              <select
                value={selectedTrustPartId}
                onChange={(e) => setSelectedTrustPartId(e.target.value)}
                className="px-3 py-1.5 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>
            {trustProfile && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                <div className="bg-[#181818] border border-[#27272a] rounded-lg p-3">
                  <div className="text-[#A0A0A0] font-sans">Completed Orders</div>
                  <div className="text-lg font-bold text-[#F5F5F5]">{trustProfile.completedOrdersCount}</div>
                </div>
                <div className="bg-[#181818] border border-[#27272a] rounded-lg p-3">
                  <div className="text-[#A0A0A0] font-sans">On-Time Delivery</div>
                  <div className="text-lg font-bold text-emerald-400">{trustProfile.onTimeDeliveryRatePct}%</div>
                </div>
                <div className="bg-[#181818] border border-[#27272a] rounded-lg p-3">
                  <div className="text-[#A0A0A0] font-sans">Avg Rating</div>
                  <div className="text-lg font-bold text-[#D4AF37]">{trustProfile.averageRating}/5</div>
                </div>
                <div className="bg-[#181818] border border-[#27272a] rounded-lg p-3">
                  <div className="text-[#A0A0A0] font-sans">Disputes</div>
                  <div className="text-lg font-bold text-[#F5F5F5]">{trustProfile.disputeCount}</div>
                </div>
              </div>
            )}

            <div className="divide-y divide-[#27272a]">
              {reviews.map((r) => (
                <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-[#F5F5F5]">
                      {r.id} · Rating {r.rating}/5 · Order {r.orderId}
                    </div>
                    <div className="text-[#A0A0A0]">{r.comment}</div>
                    <div className="text-[#71717a] font-mono">Appeal: {r.appealStatus}</div>
                  </div>
                  {r.appealStatus === 'NONE' && (
                    <button
                      type="button"
                      onClick={() => handleAppealReview(r.id)}
                      className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer shrink-0"
                    >
                      Open Appeal
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'COMMS_OFFLINE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-display font-semibold text-[#F5F5F5]">
              <MessageCircle size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Scoped Commercial Threads</span>
            </div>
            <div className="flex gap-2">
              <input
                value={threadMsg}
                onChange={(e) => setThreadMsg(e.target.value)}
                placeholder="Write a message on an authorized thread..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
            </div>
            <div className="divide-y divide-[#27272a]">
              {threads.map((thr) => (
                <div key={thr.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#D4AF37]">
                      {thr.id} · {thr.linkedEntityType} ({thr.linkedEntityId})
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePostThreadMessage(thr.id)}
                      className="px-3 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                    >
                      Send Reply
                    </button>
                  </div>
                  <div className="space-y-1 text-[#A0A0A0]">
                    {thr.messages.map((m) => (
                      <div key={m.id}>
                        <strong className="text-[#F5F5F5]">{m.senderUserId}:</strong> {m.body}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-display font-semibold text-[#F5F5F5]">
              <WifiOff size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Offline Field Sync & Conflict Queue</span>
            </div>
            <form onSubmit={handleSyncOffline} className="flex gap-2">
              <input
                value={offlineNote}
                onChange={(e) => setOfflineNote(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer whitespace-nowrap"
              >
                Sync Draft
              </button>
            </form>
            <div className="divide-y divide-[#27272a]">
              {offlineDrafts.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[#F5F5F5]">
                      {d.clientDraftId} · {d.entityKind}
                    </div>
                    <div className="text-[#A0A0A0]">{d.serverResolutionNote || d.targetEntityId || 'Draft payload'}</div>
                  </div>
                  <span
                    className={`font-mono font-semibold ${
                      d.syncState === 'CONFLICT' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {d.syncState}
                  </span>
                </div>
              ))}
              {offlineDrafts.length === 0 && (
                <div className="py-6 text-center text-[#A0A0A0]">No offline sync drafts recorded yet.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
