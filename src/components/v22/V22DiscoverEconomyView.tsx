/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Universal Multi-Sector Discovery & Extensible Sector Directory
 * Searchable directory across 28+ economic sectors, multi-sector search across businesses,
 * individuals, marketplace offers, RFQs, and projects, plus admin sector extensibility.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Compass, Plus, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type { V22SectorDefinition } from '../../types/index.ts';
import { EconexImage } from '../ux/EconexImage.tsx';
import { resolveSectorAsset } from '../../config/econexAssetManifest.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const CATEGORY_GROUPS: Array<V22SectorDefinition['categoryGroup'] | 'ALL'> = [
  'ALL',
  'PRIMARY_PRODUCTION',
  'INDUSTRY_CONSTRUCTION',
  'COMMERCE_LOGISTICS',
  'SERVICES_TECHNOLOGY',
  'SOCIAL_PUBLIC_INSTITUTIONS',
];

const CATEGORY_GROUP_LABELS: Record<string, string> = {
  ALL: 'All Sectors',
  PRIMARY_PRODUCTION: 'Agriculture & Primary Production',
  INDUSTRY_CONSTRUCTION: 'Manufacturing & Construction',
  COMMERCE_LOGISTICS: 'Trade, Retail & Logistics',
  SERVICES_TECHNOLOGY: 'Services & Clean Technology',
  SOCIAL_PUBLIC_INSTITUTIONS: 'Health, Education & Public',
};

export const V22DiscoverEconomyView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || role, userRole: role };

  const [sectors, setSectors] = useState<V22SectorDefinition[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [query, setQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchEntityTab, setSearchEntityTab] = useState<'ALL' | 'BUSINESSES' | 'OFFERS' | 'RFQS'>('ALL');

  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newGroup, setNewGroup] = useState<V22SectorDefinition['categoryGroup']>('SERVICES_TECHNOLOGY');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newSubsectors, setNewSubsectors] = useState<string>('');

  const loadSectors = useCallback(async () => {
    setError(null);
    try {
      const res = await ApiClient.v22GetSectors(
        {
          categoryGroup: groupFilter === 'ALL' ? undefined : groupFilter,
          q: query.trim() || undefined,
        },
        actor
      );
      setSectors(res.sectors || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load sector directory.');
    }
  }, [groupFilter, query, currentUser?.id, role]);

  useEffect(() => {
    loadSectors();
  }, [loadSectors]);

  const handleUniversalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError(null);
    try {
      const res = await ApiClient.v22Search(query, actor);
      setSearchResults(res);
    } catch (err: any) {
      setError(err?.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddSector = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v22CreateSector(
        {
          code: newCode,
          name: newName,
          categoryGroup: newGroup,
          description: newDesc,
          subsectors: newSubsectors
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        actor
      );
      setFeedback(`Added new sector ${created.name} (${created.code}).`);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      setNewSubsectors('');
      setAddOpen(false);
      await loadSectors();
    } catch (err: any) {
      setError(err?.message || 'Only Platform Admins can add custom sectors.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-[#D4AF37]">28+ Active Economic Sectors</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">Discover the Universal Economy</h1>
            <p className="text-sm text-[#A0A0A0]">
              Explore every legitimate sector, discover registered businesses and skilled artisans, and search across Uganda &amp; East Africa.
            </p>
          </div>
          {role === 'PLATFORM_ADMIN' && (
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={16} aria-hidden="true" />
              <span>Add Custom Sector</span>
            </button>
          )}
        </div>

        {/* Universal Search Bar */}
        <form onSubmit={handleUniversalSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-[#A0A0A0]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search solar, civil works, pharmacy, software, artisans, RFQs, Kampala..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#181818] border border-[#D4AF37] text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            {searching ? 'Searching...' : 'Search Economy'}
          </button>
        </form>

        {/* Category Group Filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupFilter(g)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                groupFilter === g
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#181818] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              {CATEGORY_GROUP_LABELS[g] || g}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 text-sm text-emerald-200">
          {feedback}
        </div>
      )}

      {addOpen && role === 'PLATFORM_ADMIN' && (
        <form onSubmit={handleAddSector} className="bg-[#121212] border border-[#D4AF37]/60 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5]">Register New Extensible Sector</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Sector Code (UPPER_SNAKE_CASE)</span>
              <input
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="e.g. AEROSPACE_DRONES"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Sector Name</span>
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Commercial Drones & Geospatial Mapping"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Category Group</span>
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value as V22SectorDefinition['categoryGroup'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {CATEGORY_GROUPS.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_GROUP_LABELS[c] || c}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Subsectors (comma separated)</span>
              <input
                value={newSubsectors}
                onChange={(e) => setNewSubsectors(e.target.value)}
                placeholder="Aerial Surveying, Precision Mapping"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-[#A0A0A0]">
            <span>Description</span>
            <input
              required
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Commercial sector description..."
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] text-sm text-[#A0A0A0] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Save Sector
            </button>
          </div>
        </form>
      )}

      {/* Search Results Breakdown */}
      {searchResults && (
        <section className="bg-[#121212] border border-[#D4AF37]/40 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              Search Results for “{searchResults.query || 'All'}”
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'BUSINESSES', 'OFFERS', 'RFQS'] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setSearchEntityTab(tabKey)}
                  className={`min-h-[34px] px-3 py-1 rounded-lg text-xs border cursor-pointer ${
                    searchEntityTab === tabKey
                      ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                      : 'bg-[#181818] text-[#C0C0C0] border-[#27272a]'
                  }`}
                >
                  {tabKey === 'ALL' ? 'All Matches' : tabKey === 'BUSINESSES' ? 'Businesses' : tabKey === 'OFFERS' ? 'Offers' : 'RFQs & Projects'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSearchResults(null)}
                className="text-xs text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer ml-2"
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {(searchEntityTab === 'ALL' || searchEntityTab === 'BUSINESSES') && (
              <div className="bg-[#181818] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="font-semibold text-[#D4AF37] tabular-nums">Businesses ({searchResults.businesses?.length || 0})</div>
                {(searchResults.businesses || []).slice(0, 4).map((b: any) => (
                  <div key={b.id} className="text-[#F5F5F5] border-t border-[#27272a] pt-1.5">
                    <div>{b.name}</div>
                    <div className="text-[#A0A0A0]">{String(b.primarySectorCode || '').replace(/_/g, ' ')} · {b.district}</div>
                  </div>
                ))}
              </div>
            )}
            {(searchEntityTab === 'ALL' || searchEntityTab === 'OFFERS') && (
              <div className="bg-[#181818] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="font-semibold text-[#D4AF37] tabular-nums">Products &amp; Services ({searchResults.listings?.length || 0})</div>
                {(searchResults.listings || []).slice(0, 4).map((l: any) => (
                  <div key={l.id} className="text-[#F5F5F5] border-t border-[#27272a] pt-1.5">
                    <div>{l.title}</div>
                    <div className="text-[#A0A0A0] tabular-nums">
                      {String(l.offerKind || '').replace(/_/g, ' ')} · {l.currency} {Number(l.unitPrice || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(searchEntityTab === 'ALL' || searchEntityTab === 'RFQS') && (
              <div className="bg-[#181818] border border-[#27272a] rounded-xl p-4 space-y-2">
                <div className="font-semibold text-[#D4AF37] tabular-nums">RFQs &amp; Projects ({(searchResults.tenders?.length || 0) + (searchResults.projects?.length || 0)})</div>
                {(searchResults.tenders || []).slice(0, 3).map((t: any) => (
                  <div key={t.id} className="text-[#F5F5F5] border-t border-[#27272a] pt-1.5">
                    <div>Request: {t.title}</div>
                    <div className="text-[#A0A0A0] tabular-nums">{t.currency} {Number(t.budgetAmount || 0).toLocaleString()}</div>
                  </div>
                ))}
                {(searchResults.projects || []).slice(0, 2).map((p: any) => (
                  <div key={p.id} className="text-[#F5F5F5] border-t border-[#27272a] pt-1.5">
                    <div>Project: {p.title}</div>
                    <div className="text-[#A0A0A0]">{String(p.status || '').replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sector Directory Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectors.map((sec) => {
          const media = resolveSectorAsset(sec.code, sec.categoryGroup);
          return (
            <article key={sec.id} className="bg-[#121212] border border-[#27272a] hover:border-[#D4AF37]/60 transition-colors rounded-2xl overflow-hidden flex flex-col justify-between group">
              <div>
                <EconexImage
                  src={media.path}
                  alt={media.alt}
                  fallbackLabel={sec.name}
                  aspectClassName="h-36 w-full"
                  overlayGradient
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#D4AF37] font-medium">
                      {CATEGORY_GROUP_LABELS[sec.categoryGroup] || sec.categoryGroup}
                    </span>
                    {sec.sensitiveDataIsolationRequired && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ShieldCheck size={12} aria-hidden="true" /> Protected Data
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
                    <Compass size={15} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
                    <span>{sec.name}</span>
                  </h2>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed line-clamp-2">{sec.description}</p>
                  <div className="text-xs text-[#C0C0C0]">
                    Areas: {sec.subsectors.slice(0, 4).join(' · ') || 'General'}
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-[#27272a] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('v22-businesses')}
                  className="text-xs text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer"
                >
                  View Suppliers
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('v22-marketplace')}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Explore Offers
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default V22DiscoverEconomyView;
