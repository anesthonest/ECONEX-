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
import { api } from '../../services/apiClient.ts';
import {
  EconomicOpportunity,
  OrganizationReputationScore,
  UserProfile,
} from '../../types/index.ts';

interface OpportunityDiscoveryViewProps {
  currentUser?: UserProfile | null;
}

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
      <div className="bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#121212] border border-[#2a2a2a] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#D4AF37]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 tracking-wider">
                ECONEX ECONOMIC OPPORTUNITIES
              </span>
              <span className="text-xs text-[#A0A0A0] flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#D4AF37]" /> Reputation Scoring & Continental Value Chain Gaps
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F5] tracking-tight">
              Value Chain Opportunities & Participant Reputation
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-2xl">
              Identifies structural deficits in processing capacity, storage, and cross-border trade while tracking objective participant reputation based on contract fulfillment rates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-[#1e1e1e] hover:bg-[#282828] text-[#F5F5F5] border border-[#333] rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowNewOppModal(true)}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Market Gap</span>
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Organization Reputation Scoring Board */}
      <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
        <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#D4AF37]" /> Verified Participant Reputation Indices
        </h3>
        <p className="text-xs text-[#A0A0A0] mb-4">
          Reputation is calculated objectively from verified on-time contract delivery, quality acceptance rates, and dispute resolution history.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(reputations).map(([orgKey, rep], idx) => (
            <div key={rep.organizationId || rep.orgId || orgKey || `rep-${idx}`} className="p-4 bg-[#181818] border border-[#282828] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F5F5F5] truncate max-w-[170px]">{rep.organizationName || rep.orgName || orgKey}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                  {(rep.ratingBand || 'TIER_1_EXEMPLARY').replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#A0A0A0]">Overall Index</span>
                <span className="text-2xl font-bold font-mono text-[#D4AF37]">
                  {rep.overallScore ?? rep.trustScore ?? 0}<span className="text-xs text-[#A0A0A0]">/100</span>
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-2 border-t border-[#242424]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#A0A0A0]">Contract Fulfillment:</span>
                  <strong className="text-emerald-400">{rep.fulfillmentRatePercent ?? rep.onTimeDeliveryRate ?? 0}%</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#A0A0A0]">Lab Quality Pass Rate:</span>
                  <strong className="text-emerald-400">{rep.qualityPassRatePercent ?? rep.qualityComplianceRate ?? 0}%</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#A0A0A0]">Dispute Frequency:</span>
                  <strong className="text-[#A0A0A0]">{rep.disputeFrequencyPercent ?? 0}%</strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#A0A0A0]">Completed Trades:</span>
                  <strong className="text-[#F5F5F5]">{rep.completedTradesCount ?? rep.completedTransactions ?? 0}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Opportunities Discovery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" /> Continental Supply Chain Deficit & Opportunity Registry ({filteredOpps.length})
          </h3>

          <div className="flex gap-1.5 text-xs">
            {['ALL', 'Oilseeds', 'Grain', 'Storage'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterSector(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterSector === cat
                    ? 'bg-[#D4AF37] text-[#050505]'
                    : 'bg-[#181818] text-[#A0A0A0] hover:text-[#F5F5F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpps.map((opp, idx) => (
            <div key={opp.id || `opp-${idx}`} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono text-[#D4AF37] font-semibold">{opp.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#1e293b] text-blue-300 font-medium">
                    {(opp.opportunityType || 'MARKET_DEFICIT').replace(/_/g, ' ')}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#F5F5F5]">{opp.title}</h4>
                <p className="text-xs text-[#A0A0A0] mt-1">{opp.rationale}</p>

                <div className="mt-4 p-3 bg-[#181818] border border-[#262626] rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Estimated Market Size:</span>
                    <strong className="text-emerald-400 font-mono">${((opp.estimatedMarketSizeUsd || 0) / 1000000).toFixed(1)}M USD</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Unmet Deficit Volume:</span>
                    <strong className="text-[#F5F5F5]">{(opp.unmetDemandVolumeMT || 0).toLocaleString()} MT / year</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Target Region:</span>
                    <span className="text-[#D4AF37]">{opp.targetRegion}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#222] flex items-center justify-between text-xs">
                <span className="text-[#777] text-[11px] truncate max-w-[200px]">Data: {opp.dataProvenance}</span>
                <button
                  onClick={() => setActionNotice(`Opportunity ${opp.id} bookmarked in your ECONEX workspace thesis.`)}
                  className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#282828] text-[#D4AF37] border border-[#333] rounded text-xs font-semibold flex items-center gap-1"
                >
                  Explore Value Chain <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
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
