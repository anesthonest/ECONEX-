/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V27.0 - Universal Economic Network Hub (Participants, Relationships, Activity Graph, Referrals & Outcomes)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  Network,
  RefreshCw,
  Share2,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'DIRECTORY' | 'RELATIONSHIPS' | 'GRAPH' | 'GROWTH';
}

export const V27EconomicNetworkHub: React.FC<Props> = ({ onNavigate, initialSubTab = 'DIRECTORY' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'DIRECTORY' | 'RELATIONSHIPS' | 'GRAPH' | 'GROWTH'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [graph, setGraph] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);

  const [countryFilter, setCountryFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [searchQ, setSearchQ] = useState('');

  // New Profile Form
  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState('AGRICULTURE');
  const [newDistrict, setNewDistrict] = useState('Kampala');
  const [newVisibility, setNewVisibility] = useState<'PUBLIC' | 'NETWORK' | 'ORG_ONLY' | 'PRIVATE'>('NETWORK');
  const [newSummary, setNewSummary] = useState('');

  // Invite & Referral Forms
  const [inviteTargetId, setInviteTargetId] = useState('');
  const [inviteType, setInviteType] = useState('TRADING_PARTNER');
  const [referralEmail, setReferralEmail] = useState('');

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  useEffect(() => {
    setTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, rRes, gRes, refRes, outRes, rdRes] = await Promise.all([
        ApiClient.v27GetParticipants({ q: searchQ, countryCode: countryFilter, sectorId: sectorFilter }, actor),
        ApiClient.v27GetRelationships(actor),
        ApiClient.v27GetGraph(undefined, actor),
        ApiClient.v27GetReferrals(actor),
        ApiClient.v27GetOutcomes(actor),
        ApiClient.v27GetReadinessMatrix(),
      ]);
      setProfiles(Array.isArray(pRes) ? pRes : []);
      setRelationships(Array.isArray(rRes) ? rRes : []);
      setGraph(gRes || null);
      setReferrals(Array.isArray(refRes) ? refRes : []);
      setOutcomes(Array.isArray(outRes) ? outRes : []);
      setReadiness(rdRes || null);
      if (Array.isArray(pRes) && pRes.length > 0 && !inviteTargetId) {
        setInviteTargetId(pRes[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load V27 Universal Economic Network data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId, countryFilter, sectorFilter]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v27CreateParticipant(
        {
          displayName: newName,
          sectorId: newSector,
          countryCode: activeCountry,
          regionOrDistrict: newDistrict,
          visibility: newVisibility,
          summary: newSummary,
          capabilities: [newSector, 'Verified Trading'],
        },
        actor
      );
      setFeedback(`Registered network profile ${created.displayName} (${created.id}) with visibility=${created.visibility}.`);
      setNewName('');
      setNewSummary('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to register network profile');
    }
  };

  const handlePrivacyToggle = async (profileId: string, nextVis: 'PUBLIC' | 'NETWORK' | 'ORG_ONLY' | 'PRIVATE') => {
    setError(null);
    setFeedback(null);
    try {
      const upd = await ApiClient.v27UpdatePrivacy(profileId, { visibility: nextVis }, actor);
      setFeedback(`Updated ${upd.displayName} privacy scope to ${upd.visibility}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Only the profile owner or Platform Admin may alter privacy.');
    }
  };

  const handleInviteRelationship = async () => {
    if (!inviteTargetId) return;
    setError(null);
    setFeedback(null);
    try {
      const rel = await ApiClient.v27InviteRelationship(
        { targetProfileId: inviteTargetId, relationshipType: inviteType, notes: 'Initiated via V27 Hub' },
        actor
      );
      setFeedback(`Sent ${rel.relationshipType} invitation (${rel.id}) -> ${rel.status}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not send invitation.');
    }
  };

  const handleRespondRelationship = async (relId: string, decision: 'ACCEPTED' | 'REJECTED') => {
    setError(null);
    setFeedback(null);
    try {
      const upd = await ApiClient.v27RespondRelationship(relId, decision, 'Updated from V27 Hub', actor);
      setFeedback(`Relationship ${upd.id} transitioned to ${upd.status}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Only recipient org or Admin can respond to this invitation.');
    }
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const ref = await ApiClient.v27CreateReferral(referralEmail, actor);
      setFeedback(`Attribution created (${ref.referralCode}). Notice: ${ref.rewardPolicyNotice}`);
      setReferralEmail('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Referral attribution failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider">
              ECONEX V27.0 • Universal Economic Network • Schema 25
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Universal Economic Network Hub
            </h1>
            <p className="text-sm text-[#A0A0A0]">
              Connect individuals, businesses, cooperatives, logistics providers &amp; institutions across EAC corridors with strict privacy and verification controls.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('v27-discover')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
            >
              Discovery &amp; Matching
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v27-opportunities')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
            >
              Opportunity Exchange
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v27-economic-intelligence')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
            >
              Intelligence &amp; AI
            </button>
            <button
              type="button"
              onClick={loadData}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs tabular-nums">
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[#A0A0A0]">Visible Participants</div>
            <div className="text-xl font-bold text-[#F5F5F5] mt-1">{profiles.length}</div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[#A0A0A0]">Network Relationships</div>
            <div className="text-xl font-bold text-[#D4AF37] mt-1">{relationships.length}</div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[#A0A0A0]">Active Flags</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {readiness ? `${readiness.activeCapabilitiesCount}/${readiness.totalFlags}` : '--'}
            </div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[#A0A0A0]">Pilot Live Status</div>
            <div className="text-xs font-mono text-amber-300 mt-2">
              {readiness?.flags?.V27_PILOT_ACTIVE ? 'LIVE_VERIFIED' : 'SIMULATED / PRE-FIELD'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          {(['DIRECTORY', 'RELATIONSHIPS', 'GRAPH', 'GROWTH'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                tab === t
                  ? 'bg-[#D4AF37] text-[#050505]'
                  : 'bg-[#0a0a0c] border border-[#27272a] text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              {t === 'DIRECTORY' && 'Participants Directory & Privacy'}
              {t === 'RELATIONSHIPS' && 'Partner Invitations & Trust Links'}
              {t === 'GRAPH' && 'Economic Activity Graph'}
              {t === 'GROWTH' && 'Referrals, Outcomes & Honesty Matrix'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200">{error}</div>
      )}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200">{feedback}</div>
      )}

      {loading ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center text-sm text-[#A0A0A0]">
          Loading V27 Universal Economic Network...
        </div>
      ) : tab === 'DIRECTORY' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
                <Users size={16} className="text-[#D4AF37]" /> Multi-Sector Network Directory
              </h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Filter name, sector, capability..."
                  className="px-3 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                />
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                >
                  <option value="ALL">All EAC Countries</option>
                  <option value="UG">Uganda (UG)</option>
                  <option value="KE">Kenya (KE)</option>
                  <option value="TZ">Tanzania (TZ)</option>
                  <option value="RW">Rwanda (RW)</option>
                </select>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                >
                  <option value="ALL">All Sectors</option>
                  <option value="AGRICULTURE">Agriculture</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="RETAIL_WHOLESALE">Retail &amp; Wholesale</option>
                  <option value="LOGISTICS_TRANSPORT">Logistics &amp; Freight</option>
                  <option value="CONSTRUCTION_MATERIALS">Construction</option>
                  <option value="PROFESSIONAL_SERVICES">Professional Services</option>
                  <option value="ENERGY_UTILITIES">Energy &amp; Utilities</option>
                </select>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-[#D4AF37] cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#F5F5F5]">{p.displayName}</div>
                      <div className="text-[11px] text-[#A0A0A0] font-mono">
                        {p.id} • {p.participantType} • {p.sectorId} • {p.countryCode} ({p.regionOrDistrict})
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#D4AF37]">
                        Trust {p.trustScore}/100
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                        {p.verificationStatus} ({p.verificationProvenance})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#A0A0A0] flex items-center gap-1">
                        <Lock size={10} /> {p.visibility}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#A0A0A0]">{p.summary}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e1e24] text-[11px]">
                    <div className="text-[#71717a]">
                      {p.contactPrivacyRedacted
                        ? 'Contact details protected by privacy policy'
                        : `Authorized contact: ${p.contactEmail || p.contactPhone || 'On file'}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrivacyToggle(p.id, p.visibility === 'PUBLIC' ? 'ORG_ONLY' : 'PUBLIC')}
                        className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
                      >
                        Toggle PUBLIC/ORG_ONLY
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('v27-trust')}
                        className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-[#D4AF37] cursor-pointer"
                      >
                        Verify / Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateProfile} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <UserPlus size={16} className="text-[#D4AF37]" /> Register Network Profile
            </h2>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Participant or Business Name"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <select
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            >
              <option value="AGRICULTURE">Agriculture</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="RETAIL_WHOLESALE">Retail &amp; Wholesale</option>
              <option value="LOGISTICS_TRANSPORT">Logistics &amp; Transport</option>
              <option value="CONSTRUCTION_MATERIALS">Construction Materials</option>
              <option value="PROFESSIONAL_SERVICES">Professional Services</option>
              <option value="ENERGY_UTILITIES">Energy &amp; Utilities</option>
            </select>
            <input
              value={newDistrict}
              onChange={(e) => setNewDistrict(e.target.value)}
              placeholder="Region / District (e.g., Kampala, Mbale)"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <select
              value={newVisibility}
              onChange={(e) => setNewVisibility(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            >
              <option value="PUBLIC">PUBLIC (Discoverable)</option>
              <option value="NETWORK">NETWORK (Authenticated Network)</option>
              <option value="ORG_ONLY">ORG_ONLY (Same Organisation Only)</option>
              <option value="PRIVATE">PRIVATE (Hidden from Public Search)</option>
            </select>
            <textarea
              required
              rows={3}
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Economic activity summary, products or services offered..."
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <button
              type="submit"
              className="w-full min-h-[42px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
            >
              Create Network Profile
            </button>
          </form>
        </div>
      ) : tab === 'RELATIONSHIPS' ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <Share2 size={16} className="text-[#D4AF37]" /> Trading Partner Invitations &amp; Relationship Lifecycle
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={inviteTargetId}
                onChange={(e) => setInviteTargetId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} ({p.countryCode})
                  </option>
                ))}
              </select>
              <select
                value={inviteType}
                onChange={(e) => setInviteType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
              >
                <option value="TRADING_PARTNER">TRADING_PARTNER</option>
                <option value="APPROVED_SUPPLIER">APPROVED_SUPPLIER</option>
                <option value="BUYER_CLIENT">BUYER_CLIENT</option>
                <option value="LOGISTICS_CARRIER">LOGISTICS_CARRIER</option>
              </select>
              <button
                type="button"
                onClick={handleInviteRelationship}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
              >
                Send Invitation
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {relationships.map((r) => (
              <div key={r.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-[#D4AF37] font-semibold">
                    {r.id} • {r.relationshipType} • {r.status}
                  </div>
                  <div className="text-[#F5F5F5]">
                    {r.requesterProfileId} <ArrowRight className="inline mx-1" size={12} /> {r.targetProfileId}
                  </div>
                  {r.notes && <div className="text-[#A0A0A0]">{r.notes}</div>}
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRespondRelationship(r.id, 'ACCEPTED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-200 cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondRelationship(r.id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-700 text-red-200 cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'GRAPH' ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
            <Network size={16} className="text-[#D4AF37]" /> Economic Activity Graph ({graph?.focusProfileId || '--'})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-2">
              <div className="font-semibold text-[#D4AF37]">Connected Nodes ({graph?.nodes?.length || 0})</div>
              {(graph?.nodes || []).map((n: any) => (
                <div key={n.id} className="p-2 rounded bg-[#121212] border border-[#1e1e24] flex justify-between">
                  <span className="text-[#F5F5F5]">{n.label}</span>
                  <span className="font-mono text-[10px] text-[#A0A0A0]">{n.nodeType}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-2">
              <div className="font-semibold text-[#D4AF37]">Graph Edges ({graph?.edges?.length || 0})</div>
              {(graph?.edges || []).map((e: any, idx: number) => (
                <div key={idx} className="p-2 rounded bg-[#121212] border border-[#1e1e24] font-mono text-[11px] text-[#A0A0A0]">
                  {e.from} --[{e.edgeType}: {e.label}]--&gt; {e.to}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <TrendingUp size={16} className="text-[#D4AF37]" /> Network Referrals &amp; Outcome Telemetry
            </h2>
            <form onSubmit={handleSendReferral} className="flex gap-2">
              <input
                type="email"
                required
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder="Invite partner email (self-referral blocked)"
                className="flex-1 px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
                Generate Referral
              </button>
            </form>
            <div className="space-y-2 text-xs">
              {referrals.map((r) => (
                <div key={r.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                  <div className="font-mono text-[#D4AF37]">{r.referralCode} • {r.status} • RewardPaid={String(r.monetaryRewardEnabled)}</div>
                  <div className="text-[#A0A0A0] mt-1">{r.referredEmailMasked} — {r.rewardPolicyNotice}</div>
                </div>
              ))}
              {outcomes.map((o) => (
                <div key={o.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <div className="text-[#F5F5F5] font-medium">{o.metricName}</div>
                    <div className="text-[10px] font-mono text-[#A0A0A0]">Provenance: {o.provenance} ({o.subjectId})</div>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-400">{o.metricValue}{o.unit}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D4AF37]" /> V27 Readiness &amp; Honesty Matrix ({readiness?.totalFlags || 31} Flags)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] max-h-96 overflow-y-auto pr-1">
              {readiness?.flags &&
                Object.entries(readiness.flags).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] flex items-center justify-between gap-2">
                    <span className="font-mono text-[#A0A0A0] truncate">{k}</span>
                    <span className={`font-mono font-bold ${v ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {v ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
