/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V27.0 - Opportunity Exchange, Org-Isolated CRM Pipeline, Sponsored Promotions & Commercial Threads
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Tag,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'OPPORTUNITIES' | 'CRM' | 'PROMOTIONS' | 'THREADS';
}

export const V27OpportunitiesCrmGrowthView: React.FC<Props> = ({ onNavigate, initialSubTab = 'OPPORTUNITIES' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'OPPORTUNITIES' | 'CRM' | 'PROMOTIONS' | 'THREADS'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);

  // Forms
  const [oppTitle, setOppTitle] = useState('');
  const [oppType, setOppType] = useState('BUY_REQUEST');
  const [oppSector, setOppSector] = useState('AGRICULTURE');
  const [oppDesc, setOppDesc] = useState('');

  const [leadName, setLeadName] = useState('');
  const [leadVal, setLeadVal] = useState(15000000);
  const [leadNotes, setLeadNotes] = useState('');

  const [promoTitle, setPromoTitle] = useState('');
  const [promoBudget, setPromoBudget] = useState(250000);

  const [threadSubject, setThreadSubject] = useState('');
  const [threadMsg, setThreadMsg] = useState('');

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
      const [oRes, cRes, pRes, tRes] = await Promise.all([
        ApiClient.v27GetOpportunities({}, actor),
        ApiClient.v27GetCrmLeads(actor),
        ApiClient.v27GetPromotions(actor),
        ApiClient.v27GetThreads(actor),
      ]);
      setOpportunities(Array.isArray(oRes) ? oRes : []);
      setLeads(Array.isArray(cRes) ? cRes : []);
      setPromotions(Array.isArray(pRes) ? pRes : []);
      setThreads(Array.isArray(tRes) ? tRes : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load V27 Opportunity Exchange & CRM.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role, activeWorkspaceId]);

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = await ApiClient.v27CreateOpportunity(
        { opportunityType: oppType, title: oppTitle, description: oppDesc, sectorId: oppSector, publishImmediately: true },
        actor
      );
      setFeedback(`Published opportunity ${created.id} (${created.status}).`);
      setOppTitle('');
      setOppDesc('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Could not publish opportunity.');
    }
  };

  const handleRespondOpp = async (oppId: string) => {
    setError(null);
    try {
      await ApiClient.v27RespondOpportunity(
        oppId,
        { proposedAmountMinor: 18500000, deliveryTimelineDays: 7, proposalSummary: 'Ready to fulfil per specification.' },
        actor
      );
      setFeedback(`Submitted proposal response to ${oppId}.`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Cannot respond to own organisation opportunity.');
    }
  };

  const handleAwardOpp = async (oppId: string, responseId: string) => {
    setError(null);
    try {
      const res = await ApiClient.v27AwardOpportunity(oppId, responseId, actor);
      setFeedback(`Awarded ${oppId} -> linked RFQ ${res.linkedRfqId}.`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Only opportunity creator or Admin can award.');
    }
  };

  const handleLinkObligation = async (oppId: string) => {
    setError(null);
    try {
      const res = await ApiClient.v27LinkOpportunityObligation(oppId, actor);
      setFeedback(`Linked wallet obligation ${res.obligationId} (${res.sandboxPolicy})`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Obligation linkage requires awarded opportunity.');
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const l = await ApiClient.v27CreateCrmLead(
        { counterpartyName: leadName, estimatedValueMinor: leadVal, notes: leadNotes },
        actor
      );
      setFeedback(`Created org-isolated CRM lead ${l.id} for ${l.organisationId}.`);
      setLeadName('');
      setLeadNotes('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to create CRM lead.');
    }
  };

  const handleLeadStage = async (leadId: string, stage: string) => {
    setError(null);
    try {
      await ApiClient.v27UpdateCrmStage(leadId, stage, actor);
      setFeedback(`Updated CRM lead ${leadId} stage to ${stage}.`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Forbidden CRM stage update.');
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const pr = await ApiClient.v27CreatePromotion(
        { title: promoTitle, targetSectorId: 'AGRICULTURE', budgetMinor: promoBudget },
        actor
      );
      setFeedback(`Created clearly labelled promotion ${pr.id} (${pr.promotionLabel}; affectsTrust=${String(pr.affectsOrganicTrustScore)}).`);
      setPromoTitle('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to create promotion.');
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await ApiClient.v27CreateThread({ subject: threadSubject, initialMessage: threadMsg }, actor);
      setFeedback('Commercial messaging thread created.');
      setThreadSubject('');
      setThreadMsg('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Could not create thread.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider">
              ECONEX V27.0 • Opportunity Exchange, CRM, Sponsored Promotions &amp; Messaging
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Economic Opportunity Exchange &amp; Commercial CRM
            </h1>
            <p className="text-sm text-[#A0A0A0]">
              Publish tenders &amp; buy/supply requests, award proposals into RFQ/wallet obligation workflows, and manage strictly org-isolated CRM leads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate('v27-network-hub')} className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-xs text-[#F5F5F5] cursor-pointer">
              Network Hub
            </button>
            <button type="button" onClick={loadAll} className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          {(['OPPORTUNITIES', 'CRM', 'PROMOTIONS', 'THREADS'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#0a0a0c] border border-[#27272a] text-[#A0A0A0]'
              }`}
            >
              {t === 'OPPORTUNITIES' && 'Opportunity Exchange'}
              {t === 'CRM' && 'Org-Isolated CRM Pipeline'}
              {t === 'PROMOTIONS' && 'Sponsored Promotions (Isolated)'}
              {t === 'THREADS' && 'Commercial Messaging Threads'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200">{error}</div>}
      {feedback && <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200">{feedback}</div>}

      {loading ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center text-sm text-[#A0A0A0]">Loading Opportunity Exchange...</div>
      ) : tab === 'OPPORTUNITIES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <Briefcase size={16} className="text-[#D4AF37]" /> Active Economic Opportunities ({opportunities.length})
            </h2>
            {opportunities.map((o) => (
              <div key={o.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] space-y-2 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="font-bold text-[#F5F5F5]">{o.title}</div>
                  <span className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] font-mono text-[#D4AF37]">
                    {o.opportunityType} • {o.status}
                  </span>
                </div>
                <p className="text-[#A0A0A0]">{o.description}</p>
                <div className="font-mono text-[11px] text-[#71717a]">
                  {o.id} • {o.countryCode}{o.corridorDestinationCountry ? ` -> ${o.corridorDestinationCountry}` : ''} • {o.sectorId} • Responses: {o.responseCount}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1e1e24]">
                  {['OPEN', 'PUBLISHED', 'RESPONSES_RECEIVED'].includes(o.status) && (
                    <button type="button" onClick={() => handleRespondOpp(o.id)} className="px-3 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
                      Submit Proposal
                    </button>
                  )}
                  {o.status === 'AWARDED' && (
                    <button type="button" onClick={() => handleLinkObligation(o.id)} className="px-3 py-1 rounded bg-emerald-950/50 border border-emerald-700 text-emerald-300 flex items-center gap-1 cursor-pointer">
                      <Wallet size={12} /> Link Wallet Obligation
                    </button>
                  )}
                </div>
                {(o.responses || []).length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {o.responses.map((r: any) => (
                      <div key={r.id} className="p-2.5 rounded bg-[#121212] border border-[#1e1e24] flex flex-wrap justify-between items-center gap-2">
                        <span className="font-mono text-[#A0A0A0]">
                          {r.id} ({r.responderOrgId || r.responderOrganisationId}) • {r.proposedAmountMinor.toLocaleString()} {r.currency} • {r.status}
                        </span>
                        {o.status !== 'AWARDED' && r.status === 'SUBMITTED' && (
                          <button type="button" onClick={() => handleAwardOpp(o.id, r.id)} className="px-2.5 py-1 rounded bg-[#18181b] border border-[#D4AF37] text-[#D4AF37] cursor-pointer">
                            Award Proposal
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateOpp} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Publish Opportunity</h3>
            <select value={oppType} onChange={(e) => setOppType(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]">
              <option value="BUY_REQUEST">BUY_REQUEST</option>
              <option value="SUPPLY_OFFER">SUPPLY_OFFER</option>
              <option value="TENDER">TENDER</option>
              <option value="LOGISTICS_CONTRACT">LOGISTICS_CONTRACT</option>
              <option value="PROCESSING_CONTRACT">PROCESSING_CONTRACT</option>
            </select>
            <select value={oppSector} onChange={(e) => setOppSector(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]">
              <option value="AGRICULTURE">Agriculture</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="LOGISTICS_TRANSPORT">Logistics &amp; Transport</option>
              <option value="CONSTRUCTION_MATERIALS">Construction Materials</option>
              <option value="PROFESSIONAL_SERVICES">Professional Services</option>
            </select>
            <input required value={oppTitle} onChange={(e) => setOppTitle(e.target.value)} placeholder="Opportunity Title" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <textarea required rows={3} value={oppDesc} onChange={(e) => setOppDesc(e.target.value)} placeholder="Specifications, delivery timeline, quality standards..." className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Publish to Exchange
            </button>
          </form>
        </div>
      ) : tab === 'CRM' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <ClipboardList size={16} className="text-[#D4AF37]" /> Organisation CRM Pipeline ({activeWorkspaceId})
            </h2>
            {leads.map((l) => (
              <div key={l.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] flex flex-wrap justify-between items-center gap-3 text-xs">
                <div>
                  <div className="font-bold text-[#F5F5F5]">{l.counterpartyName}</div>
                  <div className="font-mono text-[#D4AF37]">{l.id} • Org={l.organisationId} • {l.estimatedValueMinor.toLocaleString()} {l.currency}</div>
                  <div className="text-[#A0A0A0]">{l.notes}</div>
                </div>
                <select
                  value={l.stage}
                  onChange={(e) => handleLeadStage(l.id, e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
                >
                  {['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <form onSubmit={handleCreateLead} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Add CRM Lead</h3>
            <input required value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Counterparty Name" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <input type="number" value={leadVal} onChange={(e) => setLeadVal(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <textarea rows={3} value={leadNotes} onChange={(e) => setLeadNotes(e.target.value)} placeholder="Qualification notes..." className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Create Lead
            </button>
          </form>
        </div>
      ) : tab === 'PROMOTIONS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <Tag size={16} className="text-[#D4AF37]" /> Sponsored Placements (Strict Non-Reputation Separation)
            </h2>
            {promotions.map((pr) => (
              <div key={pr.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-[#F5F5F5]">{pr.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800 text-amber-300 font-mono">{pr.promotionLabel}</span>
                </div>
                <div className="font-mono text-[#A0A0A0]">
                  AffectsTrustScore={String(pr.affectsOrganicTrustScore)} • AffectsOrganicRanking={String(pr.affectsSearchReputationRanking)} • Budget={pr.budgetMinor.toLocaleString()} {pr.currency}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleCreatePromo} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Create Sponsored Campaign</h3>
            <input required value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} placeholder="Campaign Headline" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <input type="number" value={promoBudget} onChange={(e) => setPromoBudget(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Create Sandbox Promotion
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <MessageSquare size={16} className="text-[#D4AF37]" /> Commercial Messaging Threads
            </h2>
            {threads.map((th) => (
              <div key={th.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs space-y-2">
                <div className="font-bold text-[#F5F5F5]">{th.subject}</div>
                {(th.messages || []).map((m: any) => (
                  <div key={m.id} className="p-2 rounded bg-[#121212] border border-[#1e1e24]">
                    <span className="font-mono text-[#D4AF37]">{m.senderUserId}: </span>
                    <span className="text-[#A0A0A0]">{m.body}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <form onSubmit={handleCreateThread} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Start Commercial Thread</h3>
            <input required value={threadSubject} onChange={(e) => setThreadSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <textarea required rows={3} value={threadMsg} onChange={(e) => setThreadMsg(e.target.value)} placeholder="Initial commercial message..." className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Send Message
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
