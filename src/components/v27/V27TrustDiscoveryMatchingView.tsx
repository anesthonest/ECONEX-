/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V27.0 - Trust, Evidence Verification, Transparent Reputation, Discovery & Explainable Matching View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  BookmarkCheck,
  CheckCircle2,
  GitCompare,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'DISCOVER' | 'MATCHING' | 'TRUST' | 'SUPPLIERS' | 'BUYERS';
}

export const V27TrustDiscoveryMatchingView: React.FC<Props> = ({ onNavigate, initialSubTab = 'DISCOVER' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'DISCOVER' | 'MATCHING' | 'TRUST' | 'SUPPLIERS' | 'BUYERS'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [discoverData, setDiscoverData] = useState<any>(null);
  const [savedSearches, setSavedSearches] = useState<any>({ savedSearches: [], recentHistory: [] });
  const [matchData, setMatchData] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Verification / Review / Capability forms
  const [verProfileId, setVerProfileId] = useState('V27-PROF-UG-FARM-01');
  const [verSummary, setVerSummary] = useState('');
  const [revTargetId, setRevTargetId] = useState('V27-PROF-UG-BUYER-01');
  const [revOrderId, setRevOrderId] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');

  const [capName, setCapName] = useState('');
  const [capQty, setCapQty] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqVol, setReqVol] = useState('');

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  useEffect(() => {
    setTab(initialSubTab);
  }, [initialSubTab]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, ssRes, mRes, vRes, rRes, sRes, bRes, pRes] = await Promise.all([
        ApiClient.v27Discover({ q: query, sectorId: sectorFilter, verifiedOnly }, actor),
        ApiClient.v27GetSavedSearches(actor),
        ApiClient.v27GetMatches(sectorFilter, actor),
        ApiClient.v27GetVerificationRecords(actor),
        ApiClient.v27GetReputationReviews(undefined, actor),
        ApiClient.v27GetSupplierCapabilities(sectorFilter, actor),
        ApiClient.v27GetBuyerRequirements(sectorFilter, actor),
        ApiClient.v27GetParticipants({}, actor),
      ]);
      setDiscoverData(dRes);
      setSavedSearches(ssRes || { savedSearches: [], recentHistory: [] });
      setMatchData(mRes);
      setVerifications(Array.isArray(vRes) ? vRes : []);
      setReviews(Array.isArray(rRes) ? rRes : []);
      setSuppliers(Array.isArray(sRes) ? sRes : []);
      setBuyers(Array.isArray(bRes) ? bRes : []);
      setProfiles(Array.isArray(pRes) ? pRes : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load V27 Discovery, Trust & Matching data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role, activeWorkspaceId, sectorFilter, verifiedOnly]);

  const handleSaveCurrentSearch = async () => {
    setError(null);
    try {
      const saved = await ApiClient.v27SaveSearch(
        { label: query || `Saved ${sectorFilter} Search`, queryText: query, filters: { sectorId: sectorFilter, verifiedOnly } },
        actor
      );
      setFeedback(`Saved search "${saved.label}".`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Could not save search.');
    }
  };

  const handleMatchFeedback = async (recId: string, action: 'SAVE' | 'ACCEPT' | 'REJECT' | 'RFQ') => {
    setError(null);
    try {
      await ApiClient.v27SubmitMatchFeedback({ recommendationId: recId, action }, actor);
      setFeedback(`Recorded match decision: ${action} on ${recId}.`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to record match feedback.');
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const rec = await ApiClient.v27SubmitVerification(
        { profileId: verProfileId, verificationType: 'BUSINESS_REGISTRATION', evidenceSummary: verSummary },
        actor
      );
      setFeedback(`Submitted verification evidence (${rec.id}) with provenance=${rec.provenance}.`);
      setVerSummary('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit verification evidence.');
    }
  };

  const handleAdminDecideVerification = async (recId: string, status: 'VERIFIED' | 'REJECTED') => {
    setError(null);
    try {
      const upd = await ApiClient.v27DecideVerification(
        recId,
        { status, provenance: 'HUMAN_REVIEWED', reviewNotes: `Reviewed via UI by ${actor.userId}` },
        actor
      );
      setFeedback(`Verification ${upd.id} updated to ${upd.status} (${upd.provenance}).`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Only Platform Admin (and non-submitter) may verify records.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const rev = await ApiClient.v27SubmitReputationReview(
        { targetProfileId: revTargetId, linkedOrderId: revOrderId, rating: revRating, comment: revComment },
        actor
      );
      setFeedback(`Submitted transaction-linked review (${rev.id}) verified against ${rev.verifiedTransactionProof}.`);
      setRevComment('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Review rejected (requires valid non-self transaction proof).');
    }
  };

  const handleAddCapability = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await ApiClient.v27CreateSupplierCapability(
        { capabilityName: capName, sectorId: sectorFilter === 'ALL' ? 'AGRICULTURE' : sectorFilter, declaredCapacityText: capQty, minOrderQtyText: '1 Ton' },
        actor
      );
      setFeedback(`Declared capability "${capName}" recorded as USER_DECLARED (separate from verified capacity).`);
      setCapName('');
      setCapQty('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Could not add supplier capability.');
    }
  };

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await ApiClient.v27CreateBuyerRequirement(
        { title: reqTitle, sectorId: sectorFilter === 'ALL' ? 'AGRICULTURE' : sectorFilter, requiredVolumeText: reqVol, qualityStandard: 'Commercial Export Grade', targetPriceMinor: 5000000 },
        actor
      );
      setFeedback(`Published buyer requirement "${reqTitle}".`);
      setReqTitle('');
      setReqVol('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Could not create buyer requirement.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider">
              ECONEX V27.0 • Trust, Discovery, Explainable Matching &amp; Capabilities
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Discovery, Trust Verification &amp; Matching Engine
            </h1>
            <p className="text-sm text-[#A0A0A0]">
              Organic trust scoring &amp; search ranking never include paid promotions. Verification separates user claims from independent human/3P evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('v27-network-hub')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-xs text-[#F5F5F5] cursor-pointer"
            >
              Network Hub
            </button>
            <button
              type="button"
              onClick={loadAll}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          {(['DISCOVER', 'MATCHING', 'TRUST', 'SUPPLIERS', 'BUYERS'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#0a0a0c] border border-[#27272a] text-[#A0A0A0]'
              }`}
            >
              {t === 'DISCOVER' && 'Unified Network Search'}
              {t === 'MATCHING' && 'Explainable Matching'}
              {t === 'TRUST' && 'Verification & Reputation'}
              {t === 'SUPPLIERS' && 'Supplier Capabilities'}
              {t === 'BUYERS' && 'Buyer Requirements'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200">{error}</div>}
      {feedback && <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200">{feedback}</div>}

      {loading ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center text-sm text-[#A0A0A0]">Loading V27 engine...</div>
      ) : tab === 'DISCOVER' ? (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search verified suppliers, buyers, cooperatives, or opportunities..."
              className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            >
              <option value="ALL">All Sectors</option>
              <option value="AGRICULTURE">Agriculture</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="RETAIL_WHOLESALE">Retail &amp; Wholesale</option>
              <option value="LOGISTICS_TRANSPORT">Logistics &amp; Freight</option>
              <option value="ENERGY_UTILITIES">Energy &amp; Utilities</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-[#A0A0A0] cursor-pointer">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              Verified Only
            </label>
            <button type="button" onClick={loadAll} className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
              <Search size={14} /> Search
            </button>
            <button type="button" onClick={handleSaveCurrentSearch} className="px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-xs text-[#F5F5F5] flex items-center gap-1.5 cursor-pointer">
              <BookmarkCheck size={14} /> Save Search
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
              <div className="text-xs font-mono text-[#A0A0A0]">
                {discoverData?.organicRankingPolicy}
              </div>
              {(discoverData?.participants || []).map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] flex justify-between items-start gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#F5F5F5]">{p.displayName}</div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">{p.sectorId} • {p.countryCode} • {p.verificationStatus}</div>
                    <div className="text-xs text-[#A0A0A0] mt-1">{p.summary}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-xs font-mono text-[#D4AF37] shrink-0">
                    Trust {p.trustScore}
                  </span>
                </div>
              ))}
              {(discoverData?.sponsoredPromotions || []).length > 0 && (
                <div className="pt-3 border-t border-[#27272a] space-y-2">
                  <div className="text-[11px] font-mono text-amber-300 uppercase">Separate Sponsored Placements (Zero Organic Boost)</div>
                  {discoverData.sponsoredPromotions.map((sp: any) => (
                    <div key={sp.id} className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/50 text-xs flex justify-between">
                      <span className="text-[#F5F5F5]">{sp.title}</span>
                      <span className="font-mono text-amber-300">{sp.promotionLabel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
              <h3 className="text-sm font-bold text-[#F5F5F5]">Saved Searches &amp; Recent History</h3>
              {(savedSearches.savedSearches || []).map((s: any) => (
                <div key={s.id} className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs">
                  <div className="font-semibold text-[#D4AF37]">{s.label}</div>
                  <div className="text-[#A0A0A0] font-mono">query="{s.queryText}"</div>
                </div>
              ))}
              {(savedSearches.recentHistory || []).slice(0, 4).map((h: any) => (
                <div key={h.id} className="p-2.5 rounded-lg bg-[#0a0a0c] border border-[#1e1e24] text-[11px] text-[#A0A0A0] font-mono">
                  "{h.queryText || '*'}" -&gt; {h.resultCount} results
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'MATCHING' ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
            <GitCompare size={16} className="text-[#D4AF37]" /> Explainable Match Recommendations (For {matchData?.forProfile?.displayName})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(matchData?.recommendations || []).map((rec: any) => (
              <div key={rec.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[#D4AF37] font-bold">{rec.matchType} • {rec.candidateProfileId}</span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800 text-emerald-300 font-mono">
                    Score {rec.overallScore}/100
                  </span>
                </div>
                <ul className="space-y-1 text-[#A0A0A0] list-disc pl-4">
                  {(rec.explanationFactors || []).map((ef: string, i: number) => (
                    <li key={i}>{ef}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1e1e24]">
                  <button type="button" onClick={() => handleMatchFeedback(rec.id, 'SAVE')} className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-[#F5F5F5] cursor-pointer">Save</button>
                  <button type="button" onClick={() => handleMatchFeedback(rec.id, 'ACCEPT')} className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-700 text-emerald-300 cursor-pointer">Accept</button>
                  <button type="button" onClick={() => handleMatchFeedback(rec.id, 'RFQ')} className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">Convert to RFQ</button>
                  <button type="button" onClick={() => handleMatchFeedback(rec.id, 'REJECT')} className="px-2.5 py-1 rounded bg-red-950/40 border border-red-800 text-red-300 cursor-pointer">Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'TRUST' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D4AF37]" /> Evidence-Backed Verification Lifecycle
            </h2>
            <form onSubmit={handleSubmitVerification} className="space-y-2">
              <select value={verProfileId} onChange={(e) => setVerProfileId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]">
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.displayName} ({p.verificationStatus})</option>
                ))}
              </select>
              <input
                required
                value={verSummary}
                onChange={(e) => setVerSummary(e.target.value)}
                placeholder="Describe uploaded registration/identity/facility evidence..."
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
                Submit Verification Evidence
              </button>
            </form>
            <div className="space-y-2.5 text-xs">
              {verifications.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a] space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#D4AF37]">{v.id} • {v.verificationType}</span>
                    <span className="text-emerald-300">{v.status} ({v.provenance})</span>
                  </div>
                  <div className="text-[#A0A0A0]">{v.evidenceSummary}</div>
                  {role === 'PLATFORM_ADMIN' && v.status !== 'VERIFIED' && (
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => handleAdminDecideVerification(v.id, 'VERIFIED')} className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-200 cursor-pointer">
                        Human-Review Approve
                      </button>
                      <button type="button" onClick={() => handleAdminDecideVerification(v.id, 'REJECTED')} className="px-2.5 py-1 rounded bg-red-950/60 border border-red-700 text-red-200 cursor-pointer">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <Star size={16} className="text-[#D4AF37]" /> Transaction-Linked Reputation Reviews
            </h2>
            <form onSubmit={handleSubmitReview} className="space-y-2">
              <select value={revTargetId} onChange={(e) => setRevTargetId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]">
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.displayName}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={revOrderId}
                  onChange={(e) => setRevOrderId(e.target.value)}
                  placeholder="Linked Order ID (required)"
                  className="px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
              </div>
              <input
                required
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder="Factual transaction delivery & quality feedback..."
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
                Submit Verified Review
              </button>
            </form>
            <div className="space-y-2 text-xs">
              {reviews.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#D4AF37]">{r.targetProfileId} • {r.rating}/5</span>
                    <span className="text-[#71717a]">{r.verifiedTransactionProof}</span>
                  </div>
                  <div className="text-[#A0A0A0] mt-1">{r.comment}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'SUPPLIERS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <PackageCheck size={16} className="text-[#D4AF37]" /> Supplier Capabilities (Declared vs Verified Separated)
            </h2>
            {suppliers.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] space-y-1.5 text-xs">
                <div className="font-bold text-[#F5F5F5]">{s.capabilityName} ({s.sectorId})</div>
                <div className="text-[#A0A0A0] font-mono">Declared: {s.declaredCapacityText} [{s.declaredCapacityProvenance}]</div>
                <div className="text-emerald-300 font-mono">
                  Verified: {s.verifiedCapacityText || 'Not yet verified'} [{s.verifiedCapacityProvenance || 'UNVERIFIED'}]
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddCapability} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Declare Supplier Capability</h3>
            <input required value={capName} onChange={(e) => setCapName(e.target.value)} placeholder="Capability Name" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <input required value={capQty} onChange={(e) => setCapQty(e.target.value)} placeholder="Declared Monthly Capacity (e.g. 25 MT)" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Save Declared Capability
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#D4AF37]" /> Buyer Requirements &amp; Offtake Demand
            </h2>
            {buyers.map((b) => (
              <div key={b.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs space-y-1">
                <div className="font-bold text-[#F5F5F5]">{b.title}</div>
                <div className="font-mono text-[#D4AF37]">{b.requiredVolumeText} • {b.qualityStandard} • {b.deliveryFrequency}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddRequirement} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Post Buyer Requirement</h3>
            <input required value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder="Requirement Title" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <input required value={reqVol} onChange={(e) => setReqVol(e.target.value)} placeholder="Required Volume (e.g. 15 Tons / Month)" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Publish Requirement
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
