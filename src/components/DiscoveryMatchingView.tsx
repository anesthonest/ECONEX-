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
import { EconexImage } from './ux/EconexImage.tsx';
import { resolveSectorAsset } from '../config/econexAssetManifest.ts';
import { ApiClient } from '../services/apiClient';
import {
  EconomicDiscoveryListing,
  EconomicMatchResult,
  EconomicParticipant,
  SupportedCurrency
} from '../types';

const COUNTRY_NAMES: Record<string, string> = {
  UG: 'Uganda',
  KE: 'Kenya',
  TZ: 'Tanzania',
  RW: 'Rwanda',
  CD: 'DR Congo',
  SS: 'South Sudan',
};

const formatHumanToken = (val?: string): string =>
  String(val || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
      <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#D4AF37] font-medium">
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Partner &amp; Capability Directory</span>
              <span aria-hidden="true" className="text-[#52525b]">·</span>
              <span className="text-[#A0A0A0]">Cross-border supplier &amp; buyer matching</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#F5F5F5]">
              Find Trusted Trading Partners
            </h1>
            <p className="text-sm text-[#A0A0A0] max-w-3xl leading-relaxed">
              Connect with verified regional suppliers, industrial buyers, capital partners, and transport operators across participating countries with clear match explanations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-sm font-semibold text-[#050505] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>List Your Capability</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assisted Matchmaking Workspace */}
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#121212] via-[#17171a] to-[#121212] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#F5F5F5]">
              Recommended Partner Matching
            </h2>
          </div>
          <span className="text-xs text-[#A0A0A0]">
            Transparent scoring with clear supporting reasons
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs text-[#A0A0A0] mb-1.5">
              Your Organisation or Account
            </label>
            <select
              value={sourceEntityId}
              onChange={(e) => setSourceEntityId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
            >
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.legalName} ({COUNTRY_NAMES[p.countryCode] || p.countryCode} · {formatHumanToken(p.industrySector)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#A0A0A0] mb-1.5">
              Looking For
            </label>
            <select
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="TRADE">Cross-Border Commerce &amp; Trade</option>
              <option value="SUPPLY_CHAIN">Suppliers &amp; Raw Materials</option>
              <option value="INVESTMENT">Capital &amp; Trade Finance</option>
              <option value="LOGISTICS">Transport &amp; Warehousing</option>
            </select>
          </div>

          <button
            type="button"
            onClick={runMatchingEngine}
            disabled={matchingLoading}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-sm font-semibold text-[#050505] transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${matchingLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{matchingLoading ? 'Finding Matches...' : 'Find Best Matches'}</span>
          </button>
        </div>

        {/* Match Results Display */}
        {matches.length > 0 && (
          <div className="pt-5 border-t border-[#27272a] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
              <span>Recommended partners ({matches.length})</span>
              <span>Sorted by compatibility</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <div
                  key={match.matchId}
                  className="p-5 rounded-2xl bg-[#141416] border border-[#27272a] hover:border-[#D4AF37]/60 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#D4AF37]">
                      {formatHumanToken(match.matchType)}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium text-emerald-400">
                        {formatHumanToken(match.confidenceBand)} match
                      </span>
                      <span className="text-base font-bold text-[#F5F5F5] tabular-nums">
                        {match.matchScore}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-base font-semibold text-[#F5F5F5]">
                      {match.matchedEntityName}
                    </div>
                    <div className="text-xs text-[#71717a] font-mono mt-0.5">
                      Ref: {match.matchedEntityId}
                    </div>
                  </div>

                  <p className="text-xs text-[#C0C0C0] leading-relaxed bg-[#0c0c0e] p-3 rounded-xl border border-[#1f1f23]">
                    {match.matchExplanation}
                  </p>

                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-[#A0A0A0]">
                      Why this partner fits:
                    </div>
                    {(match.evidencePoints || match.supportingEvidence || []).map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#C0C0C0]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#222226] flex items-center justify-between text-xs">
                    <span className="text-[#71717a] tabular-nums">
                      Updated {new Date(match.evaluatedAt || match.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActionNotice(`Introduction & quotation request queued with ${match.matchedEntityName}.`)}
                      className="min-h-[36px] text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Start Conversation</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-[#A0A0A0] hover:text-white ml-4 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Discovery Catalog Search & Filters */}
      <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
            placeholder="Search products, skills, materials, or countries..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] placeholder-[#71717a] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">All Countries</option>
            <option value="UG">Uganda</option>
            <option value="KE">Kenya</option>
            <option value="TZ">Tanzania</option>
            <option value="RW">Rwanda</option>
            <option value="CD">DR Congo</option>
            <option value="SS">South Sudan</option>
          </select>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">All Sectors</option>
            <option value="MANUFACTURING">Manufacturing</option>
            <option value="AGRICULTURE">Agriculture</option>
            <option value="LOGISTICS">Transport &amp; Logistics</option>
            <option value="ENERGY">Energy</option>
            <option value="TRADE">Cross-Border Trade</option>
          </select>

          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">All Currencies</option>
            <option value="UGX">UGX (Uganda Shilling)</option>
            <option value="KES">KES (Kenya Shilling)</option>
            <option value="TZS">TZS (Tanzania Shilling)</option>
            <option value="USD">USD (US Dollar)</option>
          </select>

          <button
            type="button"
            onClick={fetchListings}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Discovery Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((item) => {
          const asset = resolveSectorAsset(`${item.title} ${item.industry}`, item.industry);
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-[#27272a] bg-[#121212] hover:border-[#D4AF37]/60 transition-all flex flex-col justify-between overflow-hidden"
            >
              <EconexImage
                src={asset.path}
                alt={asset.alt}
                fallbackLabel={formatHumanToken(item.industry)}
                aspectClassName="aspect-[16/9]"
                containerClassName="border-b border-[#27272a]"
              />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[#C0C0C0]">
                      {formatHumanToken(item.industry)}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{formatHumanToken(item.verifiedStatus || 'VERIFIED')}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F5] leading-snug">
                      {item.title}
                    </h3>
                    <div className="text-xs text-[#D4AF37] font-medium mt-0.5">
                      {item.participantName} · {COUNTRY_NAMES[item.countryCode] || item.countryCode}
                    </div>
                  </div>

                  <p className="text-xs text-[#A0A0A0] line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  {Array.isArray(item.capabilities) && item.capabilities.length > 0 && (
                    <div className="text-xs text-[#888888] leading-relaxed">
                      {item.capabilities.map(formatHumanToken).join(' · ')}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#222226] space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#A0A0A0]">Delivery countries</span>
                    <span className="text-[#F5F5F5] font-medium">
                      {(item.deliveryRegions || []).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#A0A0A0]">Accepted currencies</span>
                    <span className="text-[#D4AF37] font-medium">
                      {(item.settlementCurrencies || [item.currency || 'UGX']).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#A0A0A0]">Estimated lead time</span>
                    <span className="text-[#F5F5F5] font-medium tabular-nums">
                      {item.leadTimeDays || 5} days
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActionNotice(`Quotation request drafted for ${item.participantName}.`)}
                    className="w-full min-h-[44px] mt-2 py-2.5 rounded-xl bg-[#181818] hover:bg-[#222226] border border-[#27272a] hover:border-[#D4AF37] text-xs font-semibold text-[#F5F5F5] transition-colors cursor-pointer"
                  >
                    Request Quotation
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {listings.length === 0 && !loading && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[#27272a] bg-[#121212]">
          <Compass className="w-8 h-8 text-[#71717a] mx-auto mb-3" aria-hidden="true" />
          <div className="text-sm font-semibold text-[#F5F5F5]">No matching partners or listings found</div>
          <p className="text-xs text-[#A0A0A0] mt-1">Try broadening your filters or publish a new business capability.</p>
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
