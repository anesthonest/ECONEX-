/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Universal Procurement (RFQs/Tenders) & Milestone Project Management
 * Private/cooperative procurement workflow (with non-official government disclaimer),
 * supplier bidding, weighted evaluation & human-justified award, plus project milestones & variations.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Award, Briefcase, CheckCircle2, FileCheck2, Layers, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type { V22ProjectRecord, V22SectorDefinition } from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V22ProcurementProjectsView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || role, userRole: role };

  const [tab, setTab] = useState<'PROCUREMENT' | 'PROJECTS'>('PROCUREMENT');
  const [tenders, setTenders] = useState<any[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [projects, setProjects] = useState<V22ProjectRecord[]>([]);
  const [sectors, setSectors] = useState<V22SectorDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [rfqOpen, setRfqOpen] = useState<boolean>(false);
  const [rfqTitle, setRfqTitle] = useState<string>('');
  const [rfqSector, setRfqSector] = useState<string>('CONSTRUCTION_CIVIL');
  const [rfqBudget, setRfqBudget] = useState<number>(25000000);
  const [rfqScope, setRfqScope] = useState<string>('');

  const [bidTargetId, setBidTargetId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(23500000);
  const [bidSummary, setBidSummary] = useState<string>('Full technical compliance with milestone schedule');

  const [awardJustification, setAwardJustification] = useState<string>('Highest weighted technical & price score');

  const [prjOpen, setPrjOpen] = useState<boolean>(false);
  const [prjTitle, setPrjTitle] = useState<string>('');
  const [prjSector, setPrjSector] = useState<string>('CONSTRUCTION_CIVIL');
  const [prjContractor, setPrjContractor] = useState<string>('Rift Valley Civil Engineering Ltd');
  const [ms1Title, setMs1Title] = useState<string>('Phase 1 Mobilisation & Site Works');
  const [ms1Amount, setMs1Amount] = useState<number>(12000000);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [tRes, pRes, sRes] = await Promise.all([
        ApiClient.v22GetTenders(actor),
        ApiClient.v22GetProjects(actor),
        ApiClient.v22GetSectors(undefined, actor),
      ]);
      setTenders(tRes.tenders || []);
      setDisclaimer(tRes.disclaimer || '');
      setProjects(pRes.projects || []);
      setSectors(sRes.sectors || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load procurement & projects.');
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v22CreateTender(
        {
          sectorCode: rfqSector,
          title: rfqTitle,
          scopeDescription: rfqScope,
          budgetAmount: rfqBudget,
          currency: 'UGX',
        },
        actor
      );
      setFeedback(`Published RFQ ${created.referenceNumber}: ${created.title}`);
      setRfqTitle('');
      setRfqScope('');
      setRfqOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not publish tender.');
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidTargetId) return;
    setError(null);
    setFeedback(null);
    try {
      const bid = await ApiClient.v22SubmitBid(
        bidTargetId,
        {
          proposedAmount: bidAmount,
          technicalSummary: bidSummary,
        },
        actor
      );
      setFeedback(`Submitted bid ${bid.id} for tender ${bidTargetId}.`);
      setBidTargetId(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not submit bid.');
    }
  };

  const handleAwardBid = async (tenderId: string, bidId: string) => {
    setError(null);
    setFeedback(null);
    try {
      const out = await ApiClient.v22AwardTender(
        tenderId,
        {
          bidId,
          evaluationScore: 92,
          justification: awardJustification,
        },
        actor
      );
      setFeedback(`Awarded tender and generated commercial activity ${out.activity?.activityCode}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not award tender.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v22CreateProject(
        {
          sectorCode: prjSector,
          title: prjTitle,
          clientName: currentUser?.organizationName || currentUser?.name || 'ECONEX Client',
          contractorName: prjContractor,
          contractorUserId: 'BIZ-V22-001',
          milestones: [{ title: ms1Title, deliverable: 'Verified deliverable sign-off', amount: ms1Amount }],
        },
        actor
      );
      setFeedback(`Created milestone project ${created.projectCode}.`);
      setPrjTitle('');
      setPrjOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not create project.');
    }
  };

  const handleUpdateMilestone = async (projectId: string, milestoneId: string, status: string) => {
    setError(null);
    setFeedback(null);
    try {
      await ApiClient.v22UpdateMilestone(
        projectId,
        milestoneId,
        { status, evidenceNotes: `Status updated to ${status} with verified inspection record.` },
        actor
      );
      setFeedback(`Milestone ${milestoneId} updated to ${status}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Milestone update failed.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#D4AF37]">UNIVERSAL PROCUREMENT &amp; MILESTONE PROJECTS</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">RFQs, Bidding, Awards &amp; Project Delivery</h1>
            <p className="text-xs text-[#A0A0A0]">{disclaimer}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setRfqOpen((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={14} aria-hidden="true" />
              <span>Post RFQ / Tender</span>
            </button>
            <button
              type="button"
              onClick={() => setPrjOpen((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37]/70 text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers size={14} aria-hidden="true" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          <button
            type="button"
            onClick={() => setTab('PROCUREMENT')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-mono border cursor-pointer ${
              tab === 'PROCUREMENT'
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#181818] text-[#C0C0C0] border-[#27272a]'
            }`}
          >
            PROCUREMENT RFQS ({tenders.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('PROJECTS')}
            className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-mono border cursor-pointer ${
              tab === 'PROJECTS'
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#181818] text-[#C0C0C0] border-[#27272a]'
            }`}
          >
            MILESTONE PROJECTS ({projects.length})
          </button>
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

      {rfqOpen && (
        <form onSubmit={handleCreateRfq} className="bg-[#121212] border border-[#D4AF37]/60 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5]">Publish Private / Cooperative RFQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Tender / RFQ Title</span>
              <input
                required
                value={rfqTitle}
                onChange={(e) => setRfqTitle(e.target.value)}
                placeholder="e.g. Clinic Cold-Chain Solar Backup Supply"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Sector</span>
              <select
                value={rfqSector}
                onChange={(e) => setRfqSector(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {sectors.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Estimated Budget (UGX)</span>
              <input
                type="number"
                min={1}
                value={rfqBudget}
                onChange={(e) => setRfqBudget(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-[#A0A0A0]">
            <span>Scope &amp; Evaluation Requirements</span>
            <input
              required
              value={rfqScope}
              onChange={(e) => setRfqScope(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>
          <div className="flex justify-end">
            <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer">
              Publish RFQ
            </button>
          </div>
        </form>
      )}

      {prjOpen && (
        <form onSubmit={handleCreateProject} className="bg-[#121212] border border-[#D4AF37]/60 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5]">Create Milestone-Based Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Project Title</span>
              <input
                required
                value={prjTitle}
                onChange={(e) => setPrjTitle(e.target.value)}
                placeholder="e.g. Regional Packaging Facility Fit-Out"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Sector</span>
              <select
                value={prjSector}
                onChange={(e) => setPrjSector(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {sectors.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Contractor / Vendor</span>
              <input
                required
                value={prjContractor}
                onChange={(e) => setPrjContractor(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0] md:col-span-2">
              <span>Milestone 1 Deliverable</span>
              <input
                required
                value={ms1Title}
                onChange={(e) => setMs1Title(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Milestone 1 Budget (UGX)</span>
              <input
                type="number"
                min={1}
                value={ms1Amount}
                onChange={(e) => setMs1Amount(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer">
              Create Project
            </button>
          </div>
        </form>
      )}

      {bidTargetId && (
        <form onSubmit={handleSubmitBid} className="bg-[#121212] border border-[#D4AF37] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">Submit Bid for Tender {bidTargetId}</h2>
            <button type="button" onClick={() => setBidTargetId(null)} className="text-xs text-[#A0A0A0] cursor-pointer">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Proposed Bid Amount (UGX)</span>
              <input
                type="number"
                min={1}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Technical Compliance Summary</span>
              <input
                required
                value={bidSummary}
                onChange={(e) => setBidSummary(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer">
              Submit Bid
            </button>
          </div>
        </form>
      )}

      {tab === 'PROCUREMENT' && (
        <section className="space-y-4">
          {tenders.map((t) => (
            <article key={t.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[#D4AF37]">
                    {t.referenceNumber} · {t.sectorCode} · {t.opportunityType} · {t.status}
                  </div>
                  <h2 className="text-lg font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
                    <Briefcase size={16} className="text-[#D4AF37]" aria-hidden="true" />
                    <span>{t.title}</span>
                  </h2>
                  <p className="text-xs text-[#A0A0A0]">{t.scopeDescription}</p>
                  <div className="text-xs font-mono text-[#C0C0C0] tabular-nums">
                    Issuer: {t.issuerName} · Budget: {t.currency} {Number(t.budgetAmount || 0).toLocaleString()} · Deadline:{' '}
                    {String(t.submissionDeadline).slice(0, 10)}
                  </div>
                </div>
                {t.status === 'OPEN' && (
                  <button
                    type="button"
                    onClick={() => setBidTargetId(t.id)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37] text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    Submit Supplier Bid
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-[#27272a] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[#A0A0A0]">SUBMITTED BIDS ({(t.bids || []).length})</span>
                  {t.status === 'OPEN' && (t.bids || []).length > 0 && (
                    <input
                      value={awardJustification}
                      onChange={(e) => setAwardJustification(e.target.value)}
                      placeholder="Human award justification..."
                      className="min-h-[36px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] sm:w-80"
                    />
                  )}
                </div>
                {(t.bids || []).map((b: any) => (
                  <div key={b.id} className="bg-[#181818] border border-[#27272a] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[#F5F5F5]">
                        {b.bidderName} · <span className="font-mono text-[#D4AF37]">{b.currency} {Number(b.proposedAmount).toLocaleString()}</span>
                      </div>
                      <div className="text-[#A0A0A0]">{b.technicalSummary} · Lead: {b.deliveryLeadDays}d · Status: {b.status}</div>
                    </div>
                    {t.status === 'OPEN' && b.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleAwardBid(t.id, b.id)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Award size={13} aria-hidden="true" />
                        <span>Evaluate &amp; Award</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === 'PROJECTS' && (
        <section className="space-y-4">
          {projects.map((p) => (
            <article key={p.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[#D4AF37]">
                    {p.projectCode} · {p.sectorCode} · {p.status}
                  </div>
                  <h2 className="text-lg font-display font-semibold text-[#F5F5F5]">{p.title}</h2>
                  <div className="text-xs font-mono text-[#A0A0A0] tabular-nums">
                    Client: {p.clientName} · Contractor: {p.contractorName} · Total Budget: {p.currency}{' '}
                    {p.totalBudget.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('v22-finance-intel')}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileCheck2 size={14} aria-hidden="true" />
                  <span>Invoice Milestones</span>
                </button>
              </div>

              <div className="divide-y divide-[#27272a] border-t border-[#27272a]">
                {p.milestones.map((m) => (
                  <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono text-[#D4AF37]">
                        #{m.sequence} {m.id} · {m.status} · Due {m.dueDate}
                      </div>
                      <div className="text-sm font-medium text-[#F5F5F5]">{m.title}</div>
                      <div className="text-[#A0A0A0]">
                        Deliverable: {m.deliverable} · {m.currency} {m.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.status !== 'ACCEPTED' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateMilestone(p.id, m.id, m.status === 'EVIDENCE_SUBMITTED' ? 'ACCEPTED' : 'EVIDENCE_SUBMITTED')}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#D4AF37] text-[#D4AF37] cursor-pointer whitespace-nowrap"
                        >
                          {m.status === 'EVIDENCE_SUBMITTED' ? 'Client Accept Milestone' : 'Submit Evidence'}
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle2 size={13} aria-hidden="true" /> ACCEPTED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default V22ProcurementProjectsView;
