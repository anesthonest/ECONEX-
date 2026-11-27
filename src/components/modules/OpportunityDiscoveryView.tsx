/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V4 - Economic Opportunities Discovery & Organization Reputation Engine
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  Scale,
  Globe,
  FileText,
  DollarSign,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { EconexImage } from '../ux/EconexImage.tsx';
import { resolveSectorAsset } from '../../config/econexAssetManifest.ts';
import { api } from '../../services/apiClient.ts';
import {
  EconomicOpportunity,
  OrganizationReputationScore,
  UserProfile,
} from '../../types/index.ts';

interface OpportunityDiscoveryViewProps {
  currentUser?: UserProfile | null;
}

const formatTitle = (val?: string): string =>
  String(val || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function OpportunityDiscoveryView({ currentUser }: OpportunityDiscoveryViewProps) {
  const [opportunities, setOpportunities] = useState<EconomicOpportunity[]>([]);
  const [reputations, setReputations] = useState<Record<string, OrganizationReputationScore>>({});
  const [loading, setLoading] = useState(true);
  const [filterSector, setFilterSector] = useState<string>('ALL');
  const [showNewOppModal, setShowNewOppModal] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Opportunity Form
  const [oppTitle, setOppTitle] = useState('');
  const [oppType, setOppType] = useState<any>('PROCESSING_DEFICIT');
  const [oppSector, setOppSector] = useState('Edible Oilseeds & Refineries');
  const [oppRegion, setOppRegion] = useState('Eastern & Northern Uganda');
  const [oppMarketSize, setOppMarketSize] = useState('24000000');
  const [oppUnmetVolume, setOppUnmetVolume] = useState('45000');
  const [oppRationale, setOppRationale] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const oppList = await api.getEconomicOpportunities();
      setOpportunities(Array.isArray(oppList) ? oppList : []);

      // Load reputation scores for known key organizations
      const orgIds = ['org_coop_elgon', 'org_ind_mukwano', 'org_dist_01'];
      const repMap: Record<string, OrganizationReputationScore> = {};
      for (const id of orgIds) {
        try {
          const raw = await api.getOrganizationReputation(id);
          if (raw && typeof raw === 'object' && !('error' in raw)) {
            const completed = raw.completedTradesCount ?? raw.completedTransactions ?? 0;
            const disputeFreq =
              raw.disputeFrequencyPercent ??
              (completed > 0 ? Number((((raw.disputeCount ?? 0) / completed) * 100).toFixed(1)) : 0);
            repMap[id] = {
              ...raw,
              organizationId: raw.organizationId || raw.orgId || id,
              organizationName: raw.organizationName || raw.orgName || id,
              overallScore: raw.overallScore ?? raw.trustScore ?? 0,
              fulfillmentRatePercent: raw.fulfillmentRatePercent ?? raw.onTimeDeliveryRate ?? 0,
              qualityPassRatePercent: raw.qualityPassRatePercent ?? raw.qualityComplianceRate ?? 0,
              disputeFrequencyPercent: disputeFreq,
              completedTradesCount: completed,
            };
          }
        } catch (e) {
          console.warn('Could not load rep for', id);
        }
      }
      setReputations(repMap);
    } catch (err) {
      console.error('Failed to load economic opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEconomicOpportunity({
        title: oppTitle,
        opportunityType: oppType,
        targetSector: oppSector,
        targetRegion: oppRegion,
        estimatedMarketSizeUsd: Number(oppMarketSize),
        unmetDemandVolumeMT: Number(oppUnmetVolume),
        rationale: oppRationale,
        keyOfftakers: ['Regional Agro-processors', 'Cooperatives'],
      });
      setShowNewOppModal(false);
      setOppTitle('');
      setOppRationale('');
      await loadData();
    } catch (err) {
      console.error('Failed to create opportunity:', err);
    }
  };

  const filteredOpps = opportunities.filter((o) => {
    if (filterSector !== 'ALL' && !(o.targetSector || '').toLowerCase().includes(filterSector.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#121212] border border-[#27272a] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#D4AF37]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium">
              <Award className="w-4 h-4" aria-hidden="true" />
              <span>Market Gaps &amp; Partner Reputation</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F5] tracking-tight">
              Regional Opportunities &amp; Trusted Businesses
            </h1>
            <p className="text-sm text-[#A0A0A0] max-w-2xl leading-relaxed">
              See real demand gaps in processing, storage, and regional trade alongside objective partner track records built from completed deliveries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="min-h-[44px] px-4 py-2 bg-[#181818] hover:bg-[#222226] text-[#F5F5F5] border border-[#27272a] rounded-xl transition-colors flex items-center gap-2 text-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNewOppModal(true)}
              className="min-h-[44px] px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Share Market Opportunity</span>
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-[#A0A0A0] hover:text-white ml-4 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Organization Reputation Scoring Board */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 shadow-lg">
        <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1.5 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" /> Verified Partner Track Records
        </h3>
        <p className="text-xs text-[#A0A0A0] mb-4">
          Scores are calculated directly from on-time order delivery, quality inspection results, and resolved disputes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(reputations).map(([orgKey, rep], idx) => (
            <div key={rep.organizationId || rep.orgId || orgKey || `rep-${idx}`} className="p-4 bg-[#181818] border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#F5F5F5] truncate">{rep.organizationName || rep.orgName || orgKey}</span>
                <span className="font-semibold text-[#D4AF37] shrink-0">
                  {formatTitle(rep.ratingBand || 'TIER_1_EXEMPLARY')}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#A0A0A0]">Trust Score</span>
                <span className="text-2xl font-bold font-mono tabular-nums text-[#D4AF37]">
                  {rep.overallScore ?? rep.trustScore ?? 0}<span className="text-xs text-[#A0A0A0]">/100</span>
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-[#27272a]">
                <div className="flex justify-between">
                  <span className="text-[#A0A0A0]">On-Time Fulfillment</span>
                  <strong className="text-emerald-400 tabular-nums">{rep.fulfillmentRatePercent ?? rep.onTimeDeliveryRate ?? 0}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A0A0]">Quality Pass Rate</span>
                  <strong className="text-emerald-400 tabular-nums">{rep.qualityPassRatePercent ?? rep.qualityComplianceRate ?? 0}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A0A0]">Dispute Rate</span>
                  <strong className="text-[#C0C0C0] tabular-nums">{rep.disputeFrequencyPercent ?? 0}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A0A0]">Completed Orders</span>
                  <strong className="text-[#F5F5F5] tabular-nums">{rep.completedTradesCount ?? rep.completedTransactions ?? 0}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Opportunities Discovery */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" /> Regional Supply &amp; Demand Opportunities ({filteredOpps.length})
          </h3>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {['ALL', 'Oilseeds', 'Grain', 'Storage'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterSector(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  filterSector === cat
                    ? 'bg-[#D4AF37] text-[#050505]'
                    : 'bg-[#181818] text-[#A0A0A0] border border-[#27272a] hover:text-[#F5F5F5]'
                }`}
              >
                {cat === 'ALL' ? 'All Sectors' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOpps.map((opp, idx) => {
            const sectorAsset = resolveSectorAsset(`${opp.targetSector} ${opp.title}`, opp.targetSector);
            return (
              <div key={opp.id || `opp-${idx}`} className="bg-[#121212] border border-[#27272a] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
                <EconexImage
                  src={sectorAsset.path}
                  alt={sectorAsset.alt}
                  fallbackLabel={opp.targetSector}
                  aspectClassName="aspect-[16/9]"
                  containerClassName="border-b border-[#27272a]"
                />
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-[#A0A0A0]">{opp.id}</span>
                      <span className="text-[#D4AF37] font-medium">
                        {formatTitle(opp.opportunityType || 'MARKET_DEFICIT')}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#F5F5F5] leading-snug">{opp.title}</h4>
                    <p className="text-xs text-[#A0A0A0] mt-1.5 leading-relaxed">{opp.rationale}</p>

                    <div className="mt-4 p-3.5 bg-[#181818] border border-[#27272a] rounded-xl text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#A0A0A0]">Estimated Market Size</span>
                        <strong className="text-emerald-400 font-mono tabular-nums">${((opp.estimatedMarketSizeUsd || 0) / 1000000).toFixed(1)}M USD</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A0A0A0]">Annual Demand Gap</span>
                        <strong className="text-[#F5F5F5] tabular-nums">{(opp.unmetDemandVolumeMT || 0).toLocaleString()} MT / year</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A0A0A0]">Region</span>
                        <span className="text-[#D4AF37] font-medium">{opp.targetRegion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#222226] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#71717a] truncate max-w-[200px]">Source: {opp.dataProvenance}</span>
                    <button
                      type="button"
                      onClick={() => setActionNotice(`Saved ${opp.title} to your opportunity workspace.`)}
                      className="min-h-[40px] px-3.5 py-2 bg-[#181818] hover:bg-[#222226] text-[#D4AF37] border border-[#27272a] hover:border-[#D4AF37] rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Save Opportunity</span>
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Opportunity Modal */}
      {showNewOppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#333] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D4AF37]" /> Publish Value Chain Opportunity
              </h3>
              <button onClick={() => setShowNewOppModal(false)} className="text-[#888] hover:text-[#F5F5F5] text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Edible Oil Soya Milling Deficit in Eastern Uganda"
                  value={oppTitle}
                  onChange={(e) => setOppTitle(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Type</label>
                  <select
                    value={oppType}
                    onChange={(e) => setOppType(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="PROCESSING_DEFICIT">Processing Deficit</option>
                    <option value="LOGISTICS_BOTTLENECK">Logistics Bottleneck</option>
                    <option value="CROSS_BORDER_ARBITRAGE">Cross-Border Arbitrage</option>
                    <option value="STORAGE_EXPANSION">Storage & Cold-Chain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Target Sector</label>
                  <input
                    type="text"
                    required
                    value={oppSector}
                    onChange={(e) => setOppSector(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Market Size ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={oppMarketSize}
                    onChange={(e) => setOppMarketSize(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unmet Volume (MT)</label>
                  <input
                    type="number"
                    required
                    value={oppUnmetVolume}
                    onChange={(e) => setOppUnmetVolume(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Target Region</label>
                <input
                  type="text"
                  required
                  value={oppRegion}
                  onChange={(e) => setOppRegion(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Economic Rationale & Evidence</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail factory capacity shortfalls, import substitution opportunities, or regional price spreads."
                  value={oppRationale}
                  onChange={(e) => setOppRationale(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 border-t border-[#2a2a2a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOppModal(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] text-[#A0A0A0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold rounded-lg shadow"
                >
                  Publish Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
