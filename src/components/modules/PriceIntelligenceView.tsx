/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V2 - Market Price Intelligence & Matching Engine Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/apiClient.ts';
import { CommodityPriceObservation } from '../../types/index.ts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  MapPin,
  Plus,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Search,
  ArrowRight,
  BarChart2,
} from 'lucide-react';

interface PriceIntelligenceViewProps {
  currentUser?: any;
  observations?: CommodityPriceObservation[];
  onRefresh?: () => void;
}

export const PriceIntelligenceView: React.FC<PriceIntelligenceViewProps> = () => {
  const [prices, setPrices] = useState<CommodityPriceObservation[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [priceForm, setPriceForm] = useState({
    commodity: 'White Maize (Dry Grade 1)',
    category: 'GRAINS_CEREALS' as const,
    district: 'Kampala',
    marketName: 'Kisenyi Grain Milling Cluster',
    wholesalePriceUGX: 1450,
    farmGatePriceUGX: 1150,
    unit: 'KG' as const,
    reportedBy: 'District Market Monitor',
  });

  const fetchPriceData = async () => {
    try {
      setIsLoading(true);
      const [pricesData, matchesData] = await Promise.all([
        ApiClient.getPrices(),
        ApiClient.getMatchingRecommendations(),
      ]);
      setPrices(pricesData);
      setMatches(matchesData);
    } catch (err: any) {
      console.error('Failed to load price intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
  }, []);

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.recordPrice(priceForm);
      setShowAddModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Price observation recorded for ${priceForm.commodity} in ${priceForm.district}!`,
      });
      await fetchPriceData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to record price.' });
    }
  };

  const filteredPrices =
    selectedCommodity === 'ALL'
      ? prices
      : prices.filter((p) => p.commodity.toLowerCase().includes(selectedCommodity.toLowerCase()));

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
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
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
            <div className="w-14 h-14 rounded-xl bg-emerald-950/50 border border-emerald-800 flex items-center justify-center text-xl font-bold text-emerald-300">
              <BarChart2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">Continental Price Intelligence & Arbitrage</h1>
                <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-mono font-medium">
                  Verified Monitors
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1">
                Live commodity price benchmarks, farm-gate vs. wholesale spreads, anomaly detection, and intelligent buyer-seller matching.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus size={15} /> Submit Price Observation
          </button>
        </div>
      </div>

      {/* Grid: Intelligent Matching & Price Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Regional Price Monitor Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-[#D4AF37]" /> Regional Commodity Price Observations
            </h2>

            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-[#F5F5F5] text-xs rounded px-2.5 py-1 focus:border-[#D4AF37] outline-none"
            >
              <option value="ALL">All Monitored Crops</option>
              <option value="Maize">White Maize</option>
              <option value="Coffee">Arabica Coffee</option>
              <option value="Soya">Soya Beans</option>
              <option value="Banana">Cooking Bananas</option>
            </select>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
                Loading price records...
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
                No price records found. Click &quot;Submit Price Observation&quot; to report current market rates.
              </div>
            ) : (
              filteredPrices.map((p) => {
                const spreadUGX = p.wholesalePriceUGX - p.farmGatePriceUGX;
                const spreadPct = Math.round((spreadUGX / p.farmGatePriceUGX) * 100);

                return (
                  <div key={p.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#F5F5F5]">{p.commodity}</h3>
                          <span className="text-[10px] bg-[#18181b] text-[#D4AF37] border border-[#27272a] px-1.5 py-0.2 rounded font-mono">
                            {p.category}
                          </span>
                          {p.anomalyFlag && (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                              <AlertTriangle size={11} /> Price Anomaly
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#A0A0A0] mt-0.5 flex items-center gap-1.5">
                          <MapPin size={12} className="text-[#D4AF37]" />
                          <span>{p.marketName} ({p.district} District)</span>
                          <span>•</span>
                          <span>Source: {p.sourceVerification.replace(/_/g, ' ')}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-[#A0A0A0]">Wholesale Terminal</div>
                          <div className="text-sm font-bold font-mono text-[#D4AF37]">
                            {p.wholesalePriceUGX.toLocaleString()} UGX/{p.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#A0A0A0]">Farm-Gate Depo</div>
                          <div className="text-sm font-bold font-mono text-emerald-400">
                            {p.farmGatePriceUGX.toLocaleString()} UGX/{p.unit}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arbitrage Spread Bar */}
                    <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#71717a]">Trading Spread:</span>
                        <span className="font-mono font-bold text-[#F5F5F5]">
                          +{spreadUGX.toLocaleString()} UGX ({spreadPct}%)
                        </span>
                        <span className="text-[10px] text-[#71717a]">(Covers freight + processing)</span>
                      </div>

                      <div className="flex items-center gap-1 font-semibold text-[11px]">
                        {p.trend === 'RISING' && (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <TrendingUp size={13} /> Rising
                          </span>
                        )}
                        {p.trend === 'FALLING' && (
                          <span className="text-red-400 flex items-center gap-0.5">
                            <TrendingDown size={13} /> Softening
                          </span>
                        )}
                        {p.trend === 'STABLE' && (
                          <span className="text-[#A0A0A0] flex items-center gap-0.5">
                            <Minus size={13} /> Stable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Intelligent Matching Engine */}
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={15} className="text-[#D4AF37]" /> Sourcing Match Engine
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono">Real-Time</span>
            </div>
            <p className="text-[11px] text-[#A0A0A0]">
              Automated algorithmic matching evaluating volume, corridor distance, quality grade, and seller reliability.
            </p>

            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.id} className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F5F5F5]">{m.commodity}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {m.matchScorePct}% MATCH
                    </span>
                  </div>

                  <div className="text-[11px] text-[#A0A0A0]">
                    Buyer: <strong className="text-[#F5F5F5]">{m.buyerName}</strong> ({m.buyerDistrict}) ⇄ Seller: <strong className="text-[#F5F5F5]">{m.sellerName}</strong> ({m.sellerDistrict})
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {m.matchReasons.map((r: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[9px] bg-[#18181b] text-[#A0A0A0] px-1.5 py-0.2 rounded border border-[#27272a]"
                      >
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Submit Price Observation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-[#D4AF37]" /> Submit Regional Price Observation
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrice} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Commodity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. White Maize, Arabica Coffee AA, Soya"
                  value={priceForm.commodity}
                  onChange={(e) => setPriceForm({ ...priceForm, commodity: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">District Location *</label>
                  <input
                    type="text"
                    required
                    value={priceForm.district}
                    onChange={(e) => setPriceForm({ ...priceForm, district: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Marketplace / Cluster Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kisenyi Mill, Bufumbo Central"
                    value={priceForm.marketName}
                    onChange={(e) => setPriceForm({ ...priceForm, marketName: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Wholesale UGX *</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={priceForm.wholesalePriceUGX}
                    onChange={(e) => setPriceForm({ ...priceForm, wholesalePriceUGX: parseInt(e.target.value) || 100 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] font-mono focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Farm-Gate UGX *</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={priceForm.farmGatePriceUGX}
                    onChange={(e) => setPriceForm({ ...priceForm, farmGatePriceUGX: parseInt(e.target.value) || 100 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] font-mono focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unit</label>
                  <select
                    value={priceForm.unit}
                    onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="KG">KG</option>
                    <option value="BAG_100KG">100KG</option>
                    <option value="TONNE">MT</option>
                    <option value="BUNCH">Bunch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Reporting Source / Observer Name</label>
                <input
                  type="text"
                  value={priceForm.reportedBy}
                  onChange={(e) => setPriceForm({ ...priceForm, reportedBy: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded shadow-md"
                >
                  Save Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
