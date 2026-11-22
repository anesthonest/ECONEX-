/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Multi-Sector Businesses, Independent Individuals/Artisans,
 * Workforce Tasks & Configurable Subscription Plans (0 paying subscribers disclosed cleanly).
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Building2, CheckSquare, Plus, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V22BusinessProfile,
  V22IndividualProfile,
  V22SectorDefinition,
  V22SubscriptionPlan,
  V22WorkforceTask,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V22BusinessWorkspaceView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || role, userRole: role };

  const [tab, setTab] = useState<'BUSINESSES' | 'INDIVIDUALS' | 'WORKFORCE' | 'PLANS'>('BUSINESSES');
  const [businesses, setBusinesses] = useState<V22BusinessProfile[]>([]);
  const [individuals, setIndividuals] = useState<V22IndividualProfile[]>([]);
  const [tasks, setTasks] = useState<V22WorkforceTask[]>([]);
  const [plans, setPlans] = useState<V22SubscriptionPlan[]>([]);
  const [sectors, setSectors] = useState<V22SectorDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [bizFormOpen, setBizFormOpen] = useState<boolean>(false);
  const [bizName, setBizName] = useState<string>('');
  const [bizSector, setBizSector] = useState<string>('CONSTRUCTION_CIVIL');
  const [bizEntityType, setBizEntityType] = useState<V22BusinessProfile['legalEntityType']>('LIMITED_COMPANY');
  const [bizDistrict, setBizDistrict] = useState<string>('Kampala');
  const [bizSummary, setBizSummary] = useState<string>('');

  const [indFormOpen, setIndFormOpen] = useState<boolean>(false);
  const [indName, setIndName] = useState<string>('');
  const [indTitle, setIndTitle] = useState<string>('');
  const [indSector, setIndSector] = useState<string>('REPAIR_MAINTENANCE');
  const [indRate, setIndRate] = useState<number>(85000);

  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskAssignee, setTaskAssignee] = useState<string>('Operations Lead');

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [bizRes, indRes, tskRes, plnRes, secRes] = await Promise.all([
        ApiClient.v22GetBusinesses(undefined, actor),
        ApiClient.v22GetIndividuals(undefined, actor),
        ApiClient.v22GetWorkforceTasks(actor),
        ApiClient.v22GetPlans(actor),
        ApiClient.v22GetSectors(undefined, actor),
      ]);
      setBusinesses(bizRes.businesses || []);
      setIndividuals(indRes.individuals || []);
      setTasks(tskRes.tasks || []);
      setPlans(plnRes.plans || []);
      setSectors(secRes.sectors || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load businesses and workforce directory.');
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateBiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v22CreateBusiness(
        {
          name: bizName,
          primarySectorCode: bizSector,
          legalEntityType: bizEntityType,
          district: bizDistrict,
          summary: bizSummary,
        },
        actor
      );
      setFeedback(`Created multi-sector business profile "${created.name}" (${created.id}).`);
      setBizName('');
      setBizSummary('');
      setBizFormOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not create business profile.');
    }
  };

  const handleCreateIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v22CreateIndividual(
        {
          fullName: indName,
          professionalTitle: indTitle,
          sectorCodes: [indSector],
          hourlyOrUnitRate: indRate,
        },
        actor
      );
      setFeedback(`Registered independent individual profile "${created.fullName}" (non-registered option supported).`);
      setIndName('');
      setIndTitle('');
      setIndFormOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not create individual profile.');
    }
  };

  const handleVerifyBusiness = async (bizId: string) => {
    setError(null);
    setFeedback(null);
    try {
      await ApiClient.v22VerifyBusiness(
        bizId,
        { registrationVerified: true, verificationStatus: 'REGISTRATION_VERIFIED' },
        actor
      );
      setFeedback(`Business ${bizId} registration verification updated by Admin.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Admin role required to verify businesses.');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setError(null);
    try {
      await ApiClient.v22CreateWorkforceTask({ title: taskTitle, assigneeName: taskAssignee }, actor);
      setTaskTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not add task.');
    }
  };

  const handleAdvanceTask = async (t: V22WorkforceTask) => {
    const next = t.status === 'TODO' ? 'IN_PROGRESS' : 'DONE';
    try {
      await ApiClient.v22UpdateTaskStatus(t.id, next, actor);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update task.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#D4AF37]">BUSINESSES, INDEPENDENT ARTISANS &amp; WORKFORCE</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">Economic Participants &amp; Operations</h1>
            <p className="text-sm text-[#A0A0A0]">
              Supports registered companies, cooperatives, NGOs, and independent individuals without forcing formal business registration.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setBizFormOpen((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={14} aria-hidden="true" />
              <span>Register Business</span>
            </button>
            <button
              type="button"
              onClick={() => setIndFormOpen((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37]/70 text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck size={14} aria-hidden="true" />
              <span>Add Independent Artisan</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          {(['BUSINESSES', 'INDIVIDUALS', 'WORKFORCE', 'PLANS'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-mono border cursor-pointer whitespace-nowrap shrink-0 ${
                tab === t
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#181818] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              {t}
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

      {bizFormOpen && (
        <form onSubmit={handleCreateBiz} className="bg-[#121212] border border-[#D4AF37]/60 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5]">New Multi-Sector Business Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Business Name</span>
              <input
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="e.g. Nile Valley Civil Contractors Ltd"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Primary Sector</span>
              <select
                value={bizSector}
                onChange={(e) => setBizSector(e.target.value)}
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
              <span>Legal Entity Type</span>
              <select
                value={bizEntityType}
                onChange={(e) => setBizEntityType(e.target.value as V22BusinessProfile['legalEntityType'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="LIMITED_COMPANY">LIMITED_COMPANY</option>
                <option value="SOLE_PROPRIETOR">SOLE_PROPRIETOR</option>
                <option value="COOPERATIVE">COOPERATIVE</option>
                <option value="PARTNERSHIP">PARTNERSHIP</option>
                <option value="NGO_INSTITUTION">NGO_INSTITUTION</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>District / Hub</span>
              <input
                required
                value={bizDistrict}
                onChange={(e) => setBizDistrict(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-[#A0A0A0]">
            <span>Operational Capabilities Summary</span>
            <input
              required
              value={bizSummary}
              onChange={(e) => setBizSummary(e.target.value)}
              placeholder="Core services, capacity, equipment, and target districts..."
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>
          <div className="flex justify-end">
            <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer">
              Save Business Profile
            </button>
          </div>
        </form>
      )}

      {indFormOpen && (
        <form onSubmit={handleCreateIndividual} className="bg-[#121212] border border-[#D4AF37]/60 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
            Register Independent Worker / Artisan (No Company Registration Required)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Full Name</span>
              <input
                required
                value={indName}
                onChange={(e) => setIndName(e.target.value)}
                placeholder="e.g. Kato Emmanuel"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Professional Trade / Title</span>
              <input
                required
                value={indTitle}
                onChange={(e) => setIndTitle(e.target.value)}
                placeholder="e.g. Certified Solar Electrician"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Primary Sector</span>
              <select
                value={indSector}
                onChange={(e) => setIndSector(e.target.value)}
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
              <span>Unit Rate (UGX)</span>
              <input
                type="number"
                min={0}
                value={indRate}
                onChange={(e) => setIndRate(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer">
              Save Individual Profile
            </button>
          </div>
        </form>
      )}

      {tab === 'BUSINESSES' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((b) => (
            <article key={b.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#D4AF37]">{b.primarySectorCode} · {b.legalEntityType}</span>
                <span className={b.registrationVerified ? 'text-emerald-400' : 'text-amber-400'}>
                  {b.verificationStatus}
                </span>
              </div>
              <h2 className="text-lg font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Building2 size={16} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
                <span>{b.name}</span>
              </h2>
              <p className="text-xs text-[#A0A0A0] leading-relaxed">{b.summary}</p>
              <div className="text-xs font-mono text-[#C0C0C0]">
                {b.district}, {b.countryCode} · Reg Ref: {b.registrationReference || 'Unlisted'} · Currencies: {b.currenciesSupported.join(', ')}
              </div>
              {role === 'PLATFORM_ADMIN' && !b.registrationVerified && (
                <button
                  type="button"
                  onClick={() => handleVerifyBusiness(b.id)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#D4AF37] text-xs text-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck size={13} aria-hidden="true" />
                  <span>Mark Registration Verified</span>
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === 'INDIVIDUALS' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {individuals.map((ind) => (
            <article key={ind.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#D4AF37]">{ind.sectorCodes.join(', ')}</span>
                <span className="text-[#A0A0A0]">{ind.availabilityStatus}</span>
              </div>
              <h2 className="text-lg font-display font-semibold text-[#F5F5F5]">{ind.fullName}</h2>
              <div className="text-sm text-[#C0C0C0]">{ind.professionalTitle}</div>
              <div className="text-xs font-mono text-[#A0A0A0] tabular-nums">
                Rate: {ind.currency} {Number(ind.hourlyOrUnitRate || 0).toLocaleString()} · {ind.district}, {ind.countryCode}
              </div>
              <div className="text-xs text-[#A0A0A0]">Skills: {ind.skills.join(' · ') || 'General'}</div>
              <div className="text-[11px] font-mono text-emerald-400">
                Non-Registered Individual Enabled: {String(ind.isIndividualNonRegistered)}
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === 'WORKFORCE' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3">
            <input
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Assign cross-sector task (e.g. Inspect Kampala switchgear commissioning)..."
              className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
            <input
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              placeholder="Assignee"
              className="sm:w-52 min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
            <button type="submit" className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer">
              Assign Task
            </button>
          </form>
          <div className="divide-y divide-[#27272a]">
            {tasks.map((t) => (
              <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-mono text-[#D4AF37]">
                    {t.id} · {t.sectorCode} · {t.priority} · Due {t.dueDate}
                  </div>
                  <div className="text-sm font-medium text-[#F5F5F5]">{t.title}</div>
                  <div className="text-[#A0A0A0]">Assignee: {t.assigneeName} ({t.assigneeRole})</div>
                </div>
                <button
                  type="button"
                  disabled={t.status === 'DONE'}
                  onClick={() => handleAdvanceTask(t)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <CheckSquare size={13} className="text-[#D4AF37]" aria-hidden="true" />
                  <span>{t.status}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'PLANS' && (
        <section className="space-y-4">
          <div className="bg-[#0e0e10] border border-[#27272a] rounded-xl p-4 text-xs text-[#A0A0A0]">
            Commercial tier billing is configurable for enterprise operators. Zero fabricated subscriber counts or commercial revenue are claimed.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <article key={p.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#D4AF37]">{p.code}</span>
                  <span className="text-[#A0A0A0]">{p.classification}</span>
                </div>
                <h2 className="text-lg font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
                  <Briefcase size={15} className="text-[#D4AF37]" aria-hidden="true" />
                  <span>{p.name}</span>
                </h2>
                <div className="text-xl font-mono font-bold tabular-nums text-[#F5F5F5]">
                  {p.currency} {p.monthlyFeeUgx.toLocaleString()} <span className="text-xs font-normal text-[#A0A0A0]">/ month</span>
                </div>
                <ul className="text-xs text-[#A0A0A0] space-y-1">
                  {p.includedCapabilities.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-[#27272a] text-xs font-mono text-[#C0C0C0] flex items-center justify-between">
                  <span>Active Paying Subscribers: {p.activeSubscribersCount}</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('v22-finance-intel')}
                    className="text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default V22BusinessWorkspaceView;
