/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V8.0 - Universal Economic Discovery & Matching Engine
 * Continental Economic Network & Autonomous Coordination
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  Building,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  Globe,
  Tag,
  ShieldAlert,
  Sliders,
  DollarSign,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import {
  EconomicDiscoveryListing,
  EconomicMatchResult,
  EconomicParticipant,
  SupportedCurrency
} from '../types';

export const DiscoveryMatchingView: React.FC = () => {
  const [listings, setListings] = useState<EconomicDiscoveryListing[]>([]);
  const [participants, setParticipants] = useState<EconomicParticipant[]>([]);
  const [matches, setMatches] = useState<EconomicMatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [matchingLoading, setMatchingLoading] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  // Matching Engine Input
  const [sourceEntityId, setSourceEntityId] = useState<string>('PART-UG-MUK-002');
  const [targetDomain, setTargetDomain] = useState<string>('TRADE');

  // Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [formParticipantId, setFormParticipantId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIndustry, setFormIndustry] = useState<string>('MANUFACTURING');
  const [formCountryCode, setFormCountryCode] = useState<string>('UG');
  const [formCurrencies, setFormCurrencies] = useState<string>('UGX, USD');
  const [formCapabilities, setFormCapabilities] = useState<string>('CROSS_BORDER_SUPPLY, BULK_CLEARING');
  const [formDeliveryRegions, setFormDeliveryRegions] = useState<string>('UG, KE, RW, TZ');
  const [formLeadTime, setFormLeadTime] = useState<number>(7);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const [listData, partData] = await Promise.all([
        ApiClient.getDiscoveryListings({
          q: searchQuery || undefined,
          country: selectedCountry !== 'ALL' ? selectedCountry : undefined,
          industry: selectedIndustry !== 'ALL' ? selectedIndustry : undefined,
          currency: selectedCurrency !== 'ALL' ? selectedCurrency : undefined
        }),
        ApiClient.getEconomicParticipants()
      ]);
      setListings(listData);
      setParticipants(partData);
      if (partData.length > 0 && !formParticipantId) {
        setFormParticipantId(partData[0].id);
      }
    } catch (err) {
      console.error('Failed to load discovery listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCountry, selectedIndustry, selectedCurrency]);

  const runMatchingEngine = async () => {
    try {
      setMatchingLoading(true);
      const matchData = await ApiClient.executeEconomicMatching(sourceEntityId, targetDomain);
      setMatches(matchData);
    } catch (err) {
      console.error('Failed to run economic matching engine:', err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handlePublishListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const part = participants.find(p => p.id === formParticipantId);
    try {
      setPublishing(true);
      await ApiClient.createDiscoveryListing({
        participantId: formParticipantId,
        participantName: part?.legalName || formParticipantId,
        title: formTitle,
        description: formDescription,
        industry: formIndustry,
        countryCode: formCountryCode,
        settlementCurrencies: formCurrencies.split(',').map(s => s.trim() as SupportedCurrency),
        capabilities: formCapabilities.split(',').map(s => s.trim()),
        deliveryRegions: formDeliveryRegions.split(',').map(s => s.trim()),
        leadTimeDays: Number(formLeadTime) || 5
      });
      setIsPublishModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      await fetchListings();
    } catch (err) {
      console.error('Failed to publish listing:', err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                V8.0 Discovery & Matching Engine
              </span>
              <span className="text-xs text-[#A0A0A0]">Cross-Border Multi-Vector Matching</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-[#F5F5F5]">
              Universal Economic Discovery & Matchmaking
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
              Discover verified regional suppliers, industrial off-takers, commercial buyers, institutional capital partners, and logistics operators across sovereign boundaries with automated AI-assisted matching scoring and audit evidence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              PUBLISH CAPABILITY LISTING
            </button>
          </div>
        </div>
      </div>

      {/* AI-Assisted Matchmaking Workspace */}
      <div className="border border-[#D4AF37]/30 bg-gradient-to-r from-[#0d0d0d] via-[#121212] to-[#0d0d0d] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-mono tracking-wider uppercase text-[#F5F5F5]">
              Autonomous Counterparty & Opportunity Matching Engine
            </h2>
          </div>
          <span className="text-xs font-mono text-[#D4AF37]">
            Deterministic Multi-Factor Affinity Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">
              SOURCE PARTICIPANT ENTITY
            </label>
            <select
              value={sourceEntityId}
              onChange={(e) => setSourceEntityId(e.target.value)}
              className="w-full px-3 py-2 bg-[#181818] border border-[#2a2a2a] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
            >
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.legalName} ({p.countryCode} - {p.industrySector})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#888888] mb-1">
              TARGET ECONOMIC DOMAIN
            </label>
            <select
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className="w-full px-3 py-2 bg-[#181818] border border-[#2a2a2a] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="TRADE">CROSS-BORDER COMMERCE & TRADE</option>
              <option value="SUPPLY_CHAIN">INDUSTRIAL FEEDSTOCK & SUPPLIERS</option>
              <option value="INVESTMENT">EQUITY & TRADE FINANCE CAPITAL</option>
              <option value="LOGISTICS">CORRIDOR FREIGHT & WAREHOUSING</option>
            </select>
          </div>

          <button
            onClick={runMatchingEngine}
            disabled={matchingLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#D4AF37]/50 text-xs font-mono font-medium text-[#D4AF37] transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${matchingLoading ? 'animate-spin' : ''}`} />
            {matchingLoading ? 'COMPUTING AFFINITY VECTORS...' : 'GENERATE ECONOMIC MATCHES'}
          </button>
        </div>

        {/* Match Results Display */}
        {matches.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#222222] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[#888888]">
              <span>GENERATED MATCH RECOMMENDATIONS ({matches.length})</span>
              <span>CALCULATED AUDIT EVIDENCE ATTACHED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <div
                  key={match.matchId}
                  className="p-4 bg-[#141414] border border-[#262626] hover:border-[#D4AF37] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-[#D4AF37] font-semibold">
                      {match.matchType}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono border border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/5">
                        {match.confidenceBand} CONFIDENCE
                      </span>
                      <span className="text-sm font-mono font-bold text-[#F5F5F5]">
                        {match.matchScore}%
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-[#F5F5F5] mb-1">
                    {match.matchedEntityName}
                  </div>
                  <div className="text-[10px] font-mono text-[#666666] mb-3">
                    ID: {match.matchedEntityId}
                  </div>

                  <p className="text-xs text-[#A0A0A0] mb-3 bg-[#0c0c0c] p-2.5 border border-[#1e1e1e]">
                    {match.matchExplanation}
                  </p>

                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-[#888888] uppercase">
                      Evidence Factors:
                    </div>
                    {(match.evidencePoints || match.supportingEvidence || []).map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#C0C0C0]">
                        <CheckCircle2 className="w-3 h-3 text-[#D4AF37] shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-[#666666]">
                      {new Date(match.evaluatedAt || match.createdAt || Date.now()).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => setActionNotice(`Bilateral engagement workflow queued with ${match.matchedEntityName}.`)}
                      className="text-xs font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
                    >
                      ENGAGE COUNTERPARTY <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Discovery Catalog Search & Filters */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
            placeholder="Search capabilities, commodities, industrial inputs, partner states..."
            className="w-full pl-9 pr-4 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-1.5 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">ALL COUNTRIES</option>
            <option value="UG">UGANDA (UG)</option>
            <option value="KE">KENYA (KE)</option>
            <option value="TZ">TANZANIA (TZ)</option>
            <option value="RW">RWANDA (RW)</option>
            <option value="CD">DR CONGO (CD)</option>
            <option value="SS">SOUTH SUDAN (SS)</option>
          </select>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-1.5 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">ALL INDUSTRIES</option>
            <option value="MANUFACTURING">MANUFACTURING</option>
            <option value="AGRICULTURE">AGRICULTURE</option>
            <option value="LOGISTICS">LOGISTICS</option>
            <option value="ENERGY">ENERGY</option>
            <option value="TRADE">CROSS-BORDER TRADE</option>
          </select>

          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-1.5 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">ALL CURRENCIES</option>
            <option value="UGX">UGX (Uganda Shilling)</option>
            <option value="KES">KES (Kenya Shilling)</option>
            <option value="TZS">TZS (Tanzania Shilling)</option>
            <option value="USD">USD (US Dollar)</option>
          </select>

          <button
            onClick={fetchListings}
            className="px-3 py-1.5 border border-[#333333] hover:border-[#D4AF37] text-xs font-mono text-[#F5F5F5]"
          >
            SEARCH
          </button>
        </div>
      </div>

      {/* Discovery Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((item) => (
          <div
            key={item.id}
            className="border border-[#222222] bg-[#0c0c0c] p-5 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 text-[10px] font-mono border border-[#2a2a2a] bg-[#141414] text-[#C0C0C0]">
                  {item.industry}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#4ade80]">
                  <CheckCircle2 className="w-3 h-3" />
                  {item.verifiedStatus}
                </span>
              </div>

              <h3 className="text-sm font-medium text-[#F5F5F5] mb-1">
                {item.title}
              </h3>
              <div className="text-xs text-[#D4AF37] font-mono mb-2">
                {item.participantName} ({item.countryCode})
              </div>

              <p className="text-xs text-[#A0A0A0] line-clamp-3 mb-4">
                {item.description}
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(item.capabilities || []).map((cap, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-[#121212] border border-[#222222] text-[10px] font-mono text-[#888888]"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1a1a1a] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#888888]">DELIVERY CORRIDORS:</span>
                <span className="text-[#C0C0C0]">{(item.deliveryRegions || []).join(', ')}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#888888]">SETTLEMENT:</span>
                <span className="text-[#D4AF37]">{(item.settlementCurrencies || [item.currency || 'UGX']).join(', ')}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#888888]">EST. LEAD TIME:</span>
                <span className="text-[#F5F5F5]">{item.leadTimeDays || 5} DAYS</span>
              </div>

              <button
                onClick={() => setActionNotice(`Commercial negotiation & RFQ draft opened with ${item.participantName}.`)}
                className="w-full mt-2 py-2 bg-[#141414] hover:bg-[#1f1f1f] border border-[#2c2c2c] hover:border-[#D4AF37] text-xs font-mono text-[#F5F5F5] transition-colors"
              >
                REQUEST PROPOSAL / RFQ
              </button>
            </div>
          </div>
        ))}
      </div>

      {listings.length === 0 && !loading && (
        <div className="text-center py-16 border border-dashed border-[#222222] bg-[#080808]">
          <Compass className="w-8 h-8 text-[#555555] mx-auto mb-3" />
          <div className="text-sm text-[#F5F5F5]">No discovery listings matched your criteria</div>
          <p className="text-xs text-[#888888] mt-1">Try widening your filters or publishing a new capability listing.</p>
        </div>
      )}

      {/* Publish Listing Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border border-[#333333] bg-[#0c0c0c] w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-[#F5F5F5]">
                  Publish Capability & Discovery Listing
                </h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-[#888888] hover:text-[#F5F5F5] text-xs font-mono"
              >
                CLOSE [ESC]
              </button>
            </div>

            <form onSubmit={handlePublishListing} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  OFFERING PARTICIPANT
                </label>
                <select
                  value={formParticipantId}
                  onChange={(e) => setFormParticipantId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.legalName} ({p.countryCode}) - {p.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  OFFERING TITLE
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Industrial Food-Grade Edible Oil Bulk Supply"
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    INDUSTRY SECTOR
                  </label>
                  <select
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="MANUFACTURING">MANUFACTURING</option>
                    <option value="AGRICULTURE">AGRICULTURE</option>
                    <option value="LOGISTICS">LOGISTICS</option>
                    <option value="ENERGY">ENERGY</option>
                    <option value="TRADE">CROSS-BORDER TRADE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    OPERATIONAL COUNTRY
                  </label>
                  <select
                    value={formCountryCode}
                    onChange={(e) => setFormCountryCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="UG">UGANDA (UG)</option>
                    <option value="KE">KENYA (KE)</option>
                    <option value="TZ">TANZANIA (TZ)</option>
                    <option value="RW">RWANDA (RW)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  DETAILED CAPABILITY DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide production quotas, quality certifications, packaging formats, and delivery specs..."
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    SETTLEMENT CURRENCIES (comma-sep)
                  </label>
                  <input
                    type="text"
                    value={formCurrencies}
                    onChange={(e) => setFormCurrencies(e.target.value)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    LEAD TIME (DAYS)
                  </label>
                  <input
                    type="number"
                    value={formLeadTime}
                    onChange={(e) => setFormLeadTime(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  CAPABILITY TAGS (comma-separated)
                </label>
                <input
                  type="text"
                  value={formCapabilities}
                  onChange={(e) => setFormCapabilities(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  DELIVERY CORRIDORS / REGIONS (comma-separated)
                </label>
                <input
                  type="text"
                  value={formDeliveryRegions}
                  onChange={(e) => setFormDeliveryRegions(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-xs font-mono text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505] transition-colors"
                >
                  {publishing ? 'PUBLISHING...' : 'PUBLISH LISTING'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
