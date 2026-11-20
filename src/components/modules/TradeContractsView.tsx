/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V2 - Trade Contracts & Counteroffer Negotiation Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { TradeContract } from '../../types/index.ts';
import {
  FileText,
  Handshake,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface TradeContractsViewProps {
  currentUser?: any;
  contracts?: TradeContract[];
  onRefresh?: () => void;
}

export const TradeContractsView: React.FC<TradeContractsViewProps> = () => {
  const { currentUser } = useAuth();
  const [contracts, setContracts] = useState<TradeContract[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Counteroffer Modal State
  const [selectedContract, setSelectedContract] = useState<TradeContract | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(1400);
  const [counterNotes, setCounterNotes] = useState<string>('');

  // Create Contract Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newContractForm, setNewContractForm] = useState({
    sellerId: 'usr_farmer_01',
    commodity: 'White Maize (Longe 5D)',
    quantity: 5000,
    unit: 'KG' as const,
    proposedUnitPriceUGX: 1300,
    deliveryTerms: 'Ex-Works Central Depo, Moisture <= 13.5%',
    qualityGrade: 'GRADE_1',
    termsNotes: 'Standard 60kg woven jute bags with moisture lining.',
  });

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.getContracts(currentUser?.id);
      setContracts(data);
    } catch (err: any) {
      console.error('Failed to load trade contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [currentUser]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await ApiClient.createContract({
        ...newContractForm,
        buyerId: currentUser.id,
      });
      setShowCreateModal(false);
      setFeedbackMsg({
        type: 'success',
        text: 'Trade contract request submitted! Counterparty notified for review.',
      });
      await fetchContracts();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to initiate contract.' });
    }
  };

  const handleCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedContract) return;

    try {
      await ApiClient.counterOfferContract(selectedContract.id, counterPrice, currentUser.id, counterNotes);
      setSelectedContract(null);
      setFeedbackMsg({
        type: 'success',
        text: `Counteroffer of ${counterPrice.toLocaleString()} UGX submitted for Contract #${selectedContract.contractNumber}.`,
      });
      await fetchContracts();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to submit counteroffer.' });
    }
  };

  const handleConfirmContract = async (contractId: string) => {
    if (!currentUser) return;
    try {
      await ApiClient.confirmContract(contractId, currentUser.id);
      setFeedbackMsg({
        type: 'success',
        text: 'Contract legally confirmed and bound under ECONEX trade protocol.',
      });
      await fetchContracts();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Confirmation failed.' });
    }
  };

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    RFQ_PENDING: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800' },
    QUOTATION_ISSUED: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-800' },
    COUNTER_OFFER: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-800' },
    CONFIRMED: { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-600' },
    DISPUTED: { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700' },
    CANCELLED: { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700' },
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
              : 'bg-red-950/60 border-red-600 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1c1c1f] to-[#050505] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
              <Handshake size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">B2B Trade Contracts & Quotations</h1>
                <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-mono font-medium">
                  V2 Trade Protocol
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1">
                Formal commercial forward contracts, counteroffer negotiation, quality moisture thresholds, and binding terms.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus size={15} /> Initiate Trade Contract
          </button>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-[#D4AF37]" /> Active Forward Contracts ({contracts.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
            Loading contracts...
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
            No active trade contracts found. Click &quot;Initiate Trade Contract&quot; to begin a commercial negotiation.
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => {
              const colors = statusColors[c.status] || statusColors.RFQ_PENDING;
              return (
                <div key={c.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#F5F5F5]">#{c.contractNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-[#71717a]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#F5F5F5] mt-1">
                        {c.quantity.toLocaleString()} {c.unit} • {c.commodity}
                      </h3>
                      <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                        Buyer: <strong className="text-[#F5F5F5]">{c.buyerName}</strong> ⇄ Seller: <strong className="text-[#F5F5F5]">{c.sellerName}</strong>
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-sm font-bold text-[#D4AF37] font-mono">
                        {c.agreedUnitPriceUGX ? (
                          <span>{c.agreedUnitPriceUGX.toLocaleString()} UGX / {c.unit} (Agreed)</span>
                        ) : c.counterOfferPriceUGX ? (
                          <span>{c.counterOfferPriceUGX.toLocaleString()} UGX / {c.unit} (Counteroffer)</span>
                        ) : (
                          <span>{c.proposedUnitPriceUGX.toLocaleString()} UGX / {c.unit} (Proposed)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#71717a]">
                        Grade: {c.qualityGrade} • Delivery: {c.deliveryTerms}
                      </div>
                    </div>
                  </div>

                  {c.termsNotes && (
                    <div className="bg-[#09090b] p-2.5 rounded border border-[#1f1f23] text-xs text-[#A0A0A0]">
                      <span className="font-semibold text-[#71717a]">Terms & Counter Notes:</span> {c.termsNotes}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#71717a]">
                      Updated: {new Date(c.updatedAt).toLocaleTimeString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {c.status !== 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedContract(c);
                              setCounterPrice(c.counterOfferPriceUGX || c.proposedUnitPriceUGX);
                            }}
                            className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[#D4AF37] rounded text-xs transition-colors"
                          >
                            Submit Counteroffer
                          </button>
                          <button
                            onClick={() => handleConfirmContract(c.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded text-xs transition-colors"
                          >
                            Accept & Confirm Contract
                          </button>
                        </>
                      )}
                      {c.status === 'CONFIRMED' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                          <ShieldCheck size={13} /> Legally Bound
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Submit Counteroffer */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
                Submit Counteroffer (#{selectedContract.contractNumber})
              </h3>
              <button onClick={() => setSelectedContract(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCounterOffer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">
                  Proposed Price / Unit (UGX) * (Original: {selectedContract.proposedUnitPriceUGX.toLocaleString()} UGX)
                </label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(parseInt(e.target.value) || 100)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] font-mono focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Commercial Justification & Delivery Notes</label>
                <textarea
                  rows={3}
                  placeholder="Explain reason for counteroffer (e.g. grading upgrade, packaging included, delivery window adjustments)..."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded shadow-md"
                >
                  Submit Counteroffer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Initiate Trade Contract */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Handshake size={16} className="text-[#D4AF37]" /> Initiate Commercial Trade Contract
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Commodity *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Dry White Maize (Longe 5D)"
                  value={newContractForm.commodity}
                  onChange={(e) => setNewContractForm({ ...newContractForm, commodity: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newContractForm.quantity}
                    onChange={(e) => setNewContractForm({ ...newContractForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unit</label>
                  <select
                    value={newContractForm.unit}
                    onChange={(e) => setNewContractForm({ ...newContractForm, unit: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="KG">KG</option>
                    <option value="TONNE">Metric Tonne</option>
                    <option value="BAG_100KG">100KG Bag</option>
                    <option value="BAG_50KG">50KG Bag</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Price / Unit (UGX) *</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={newContractForm.proposedUnitPriceUGX}
                    onChange={(e) => setNewContractForm({ ...newContractForm, proposedUnitPriceUGX: parseInt(e.target.value) || 100 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Delivery Terms *</label>
                  <input
                    type="text"
                    required
                    value={newContractForm.deliveryTerms}
                    onChange={(e) => setNewContractForm({ ...newContractForm, deliveryTerms: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Quality Grade</label>
                  <select
                    value={newContractForm.qualityGrade}
                    onChange={(e) => setNewContractForm({ ...newContractForm, qualityGrade: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="GRADE_1">Grade 1 (Export Quality)</option>
                    <option value="GRADE_2">Grade 2 (Commercial Standard)</option>
                    <option value="STANDARD">Local Mill Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Packaging & Quality Terms</label>
                <textarea
                  rows={2}
                  value={newContractForm.termsNotes}
                  onChange={(e) => setNewContractForm({ ...newContractForm, termsNotes: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded shadow-md"
                >
                  Transmit Contract Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
