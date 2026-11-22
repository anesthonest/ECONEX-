/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V21.0 - Controlled Pilot & Field Monitoring Command Centre (/command-centre)
 * Strictly separates Actual, Simulated, Test, Target, Projection & Pending-Survey indicators.
 * Provides lifecycle governance, multi-axis filters, exception resolution, support triage,
 * 7 EAC/AfCFTA country profiles, Postgres 16 dry-run audits, and GitHub publication readiness.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Database,
  Download,
  GitBranch,
  Globe,
  Layers,
  Plus,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V21CountryProfile,
  V21OperationalException,
  V21PilotLifecycleState,
  V21PilotRecord,
  V21PilotTemplateModel,
  V21PostgresMigrationRun,
  V21SupportRequest,
} from '../../types/index.ts';

function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PILOT_NEXT_STATES: Record<V21PilotLifecycleState, V21PilotLifecycleState[]> = {
  DRAFT: ['CONFIGURED', 'CANCELLED'],
  CONFIGURED: ['APPROVAL_PENDING', 'CANCELLED'],
  APPROVAL_PENDING: ['APPROVED', 'CONFIGURED', 'CANCELLED'],
  APPROVED: ['READY', 'CANCELLED'],
  READY: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'SUSPENDED', 'COMPLETED'],
  PAUSED: ['ACTIVE', 'SUSPENDED', 'COMPLETED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const V21PilotCommandCentre: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const [tab, setTab] = useState<'PILOTS' | 'CONTROL' | 'EXCEPTIONS' | 'EAC_PROFILES' | 'POSTGRES_GIT'>('PILOTS');
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [pilots, setPilots] = useState<V21PilotRecord[]>([]);
  const [controlSnap, setControlSnap] = useState<any>(null);
  const [countries, setCountries] = useState<V21CountryProfile[]>([]);
  const [pgAudit, setPgAudit] = useState<any>(null);
  const [gitReadiness, setGitReadiness] = useState<any>(null);

  // Filters
  const [filterPilotId, setFilterPilotId] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Create Pilot Form
  const [newPilotName, setNewPilotName] = useState('');
  const [newPilotTemplate, setNewPilotTemplate] = useState<V21PilotTemplateModel>('FARMER_TO_BUYER');
  const [newPilotCountry, setNewPilotCountry] = useState('UG');
  const [newPilotDistrict, setNewPilotDistrict] = useState('Mbale');

  // Support creation
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState<V21SupportRequest['category']>('SUPPORT');

  const actor = {
    userId: currentUser?.id || 'usr_admin_01',
    userRole: role,
    tenantId: 'TEN-UG-ELGON-01',
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, pl, cc, co, pg, gr] = await Promise.all([
        ApiClient.v21GetOverview(actor),
        ApiClient.v21GetPilots(actor),
        ApiClient.v21GetControlCentre(
          {
            pilotId: filterPilotId || undefined,
            district: filterDistrict || undefined,
            status: filterStatus || undefined,
          },
          actor
        ),
        ApiClient.v21GetCountries(actor),
        ApiClient.v21GetPostgresAudit(actor),
        ApiClient.v21GetGithubReadiness(actor),
      ]);
      setOverview(ov);
      setPilots(Array.isArray(pl?.pilots) ? pl.pilots : []);
      setControlSnap(cc);
      setCountries(Array.isArray(co?.countries) ? co.countries : []);
      setPgAudit(pg);
      setGitReadiness(gr);
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Unable to load V21 Command Centre.' });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role, filterPilotId, filterDistrict, filterStatus]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreatePilot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ApiClient.v21CreatePilot(
        {
          name: newPilotName,
          modelTemplate: newPilotTemplate,
          geography: { countryCode: newPilotCountry, district: newPilotDistrict },
        },
        actor
      );
      setNewPilotName('');
      setBanner({ kind: 'ok', text: `Created pilot ${created.id} (${created.modelTemplate}).` });
      loadAll();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Pilot creation failed.' });
    }
  };

  const handleTransitionPilot = async (pilotId: string, targetState: V21PilotLifecycleState) => {
    try {
      const updated = await ApiClient.v21TransitionPilot(
        pilotId,
        {
          targetState,
          reason: `Transitioned to ${targetState} from Command Centre`,
          closureSummary: targetState === 'COMPLETED' ? 'Controlled pilot review completed with audit trail preserved.' : undefined,
        },
        actor
      );
      setBanner({ kind: 'ok', text: `Pilot ${updated.id} is now ${updated.status}.` });
      loadAll();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Pilot transition blocked.' });
    }
  };

  const handleDownloadPilotReport = async (pilotId: string) => {
    try {
      const report = await ApiClient.v21GetPilotReport(pilotId, actor);
      downloadJson(`ECONEX-V21-Pilot-Report-${pilotId}.json`, report);
      setBanner({ kind: 'ok', text: `Downloaded pilot report for ${pilotId}.` });
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Report download failed.' });
    }
  };

  const handleResolveException = async (exc: V21OperationalException) => {
    try {
      await ApiClient.v21UpdateException(
        exc.id,
        { status: 'RESOLVED', note: 'Resolved via V21 Pilot Command Centre' },
        actor
      );
      setBanner({ kind: 'ok', text: `Exception ${exc.id} marked RESOLVED.` });
      loadAll();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Exception update failed.' });
    }
  };

  const handleCreateSupportCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim()) return;
    try {
      const created = await ApiClient.v21CreateSupportRequest(
        {
          category: supportCategory,
          subject: supportSubject.trim(),
          priority: 'MEDIUM',
        },
        actor
      );
      setSupportSubject('');
      setBanner({ kind: 'ok', text: `Logged support case ${created.id}.` });
      loadAll();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Support creation failed.' });
    }
  };

  const handleRunPostgresDryRun = async (simulateInterruptedRecovery: boolean) => {
    try {
      const run: V21PostgresMigrationRun = await ApiClient.v21RunPostgresDryRun({ simulateInterruptedRecovery }, actor);
      setBanner({
        kind: run.ledgerBalancedAfter ? 'ok' : 'err',
        text: `Postgres Dry-Run ${run.id}: ${run.status} · ${run.collectionsAudited} collections · Ledger balanced=${run.ledgerBalancedAfter}`,
      });
      loadAll();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Dry-run failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#D4AF37]">
            ECONEX V21.0 · CONTROLLED PILOT &amp; OPERATIONS COMMAND CENTRE
          </div>
          <h1 className="text-xl font-semibold text-[#F5F5F5] flex items-center gap-2">
            <Shield size={20} className="text-[#D4AF37]" />
            <span>Pilot Lifecycle, Field Monitoring &amp; Portability</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A0A0]">
            Schema V{overview?.schemaVersion || 19} · DB Authority: {overview?.environment?.databaseAuthority || 'LOCAL_JSON_WAL_AUTHORITATIVE'} · PostgreSQL Cutover: NOT YET LIVE
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <>
              <button
                type="button"
                onClick={() => onNavigateTab('v21-field-ops')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
              >
                Field Ops App
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('v21-onboarding')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
              >
                Onboarding Hub
              </button>
            </>
          )}
          <button
            type="button"
            onClick={loadAll}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {banner && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            banner.kind === 'ok'
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800 text-amber-200'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Top KPI Summary Strip (Strictly Separated) */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#A0A0A0]">Active Pilots</div>
          <div className="text-2xl font-semibold text-[#F5F5F5] tabular-nums mt-1">
            {overview?.counts?.activePilots ?? 0} / {overview?.counts?.pilots ?? 0}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">Classification: ACTUAL</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#A0A0A0]">Onboarded / Verified</div>
          <div className="text-2xl font-semibold text-[#F5F5F5] tabular-nums mt-1">
            {overview?.counts?.onboardings ?? 0} / {overview?.counts?.verifiedOnboardings ?? 0}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">Reg != Verified Identity</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#A0A0A0]">Field Records &amp; Tasks</div>
          <div className="text-2xl font-semibold text-[#F5F5F5] tabular-nums mt-1">
            {overview?.counts?.fieldRecords ?? 0} · {overview?.counts?.fieldTasks ?? 0}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">Offline-Safe Capture</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#A0A0A0]">Open Exceptions</div>
          <div className="text-2xl font-semibold text-amber-300 tabular-nums mt-1">
            {overview?.counts?.openExceptions ?? 0}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">Support Cases: {overview?.counts?.supportCases ?? 0}</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#A0A0A0]">Ledger Integrity</div>
          <div className="text-2xl font-semibold text-emerald-400 tabular-nums mt-1">
            {overview?.ledgerIntegrity?.journalBalanced ? 'BALANCED' : 'CHECK'}
          </div>
          <div className="text-[11px] text-[#A0A0A0] mt-1">
            {overview?.ledgerIntegrity?.totalJournalEntries ?? 0} journal entries
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'PILOTS', label: 'Pilot Governance', icon: Layers },
            { id: 'CONTROL', label: 'Control Centre & KPIs', icon: Activity },
            { id: 'EXCEPTIONS', label: 'Exceptions & Support', icon: AlertTriangle },
            { id: 'EAC_PROFILES', label: 'EAC / AfCFTA Profiles', icon: Globe },
            { id: 'POSTGRES_GIT', label: 'PostgreSQL & Git Readiness', icon: Database },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer ${
                tab === item.id
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-[#050505] font-semibold'
                  : 'bg-[#121212] border-[#27272a] text-[#C0C0C0] hover:border-[#D4AF37]'
              }`}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PILOT LIFECYCLE & TEMPLATES */}
      {tab === 'PILOTS' && (
        <div className="space-y-5">
          <form onSubmit={handleCreatePilot} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Plus size={16} className="text-[#D4AF37]" />
              <span>Create Configurable Pilot (3 Templates)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={newPilotName}
                onChange={(e) => setNewPilotName(e.target.value)}
                placeholder="Pilot Name"
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
              <select
                value={newPilotTemplate}
                onChange={(e) => setNewPilotTemplate(e.target.value as V21PilotTemplateModel)}
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="FARMER_TO_BUYER">Model A: Farmer-to-Buyer</option>
                <option value="SME_TRADE">Model B: SME Trade</option>
                <option value="COOPERATIVE_AGGREGATION">Model C: Cooperative Aggregation</option>
              </select>
              <input
                type="text"
                value={newPilotCountry}
                onChange={(e) => setNewPilotCountry(e.target.value.toUpperCase())}
                placeholder="Country (UG/KE/TZ/RW...)"
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
              <input
                type="text"
                value={newPilotDistrict}
                onChange={(e) => setNewPilotDistrict(e.target.value)}
                placeholder="Primary District"
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Create Pilot in DRAFT
            </button>
          </form>

          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-[#A0A0A0]">Loading pilots...</p>
            ) : (
              pilots.map((pilot) => {
                const nextStates = PILOT_NEXT_STATES[pilot.status] || [];
                return (
                  <div key={pilot.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-[#F5F5F5]">{pilot.name}</div>
                        <div className="text-xs text-[#A0A0A0] font-mono">
                          {pilot.id} · {pilot.modelTemplate} · {pilot.geography.countryCode}/{pilot.geography.district} · Status:{' '}
                          <span className="text-[#D4AF37]">{pilot.status}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {nextStates.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleTransitionPilot(pilot.id, st)}
                            className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
                          >
                            Transition → {st}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleDownloadPilotReport(pilot.id)}
                          className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-[#D4AF37] text-xs font-medium text-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download size={14} />
                          <span>Export JSON Report</span>
                        </button>
                      </div>
                    </div>

                    {/* Separated Actual / Simulated / Test / Target / Projection Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-[#27272a] text-xs tabular-nums">
                      <div>
                        <div className="text-[#A0A0A0]">ACTUAL Trades</div>
                        <div className="font-semibold text-[#F5F5F5]">
                          {pilot.separatedSummary.actual.activeTrades} active · {pilot.separatedSummary.actual.completedTrades} done
                        </div>
                      </div>
                      <div>
                        <div className="text-[#A0A0A0]">ACTUAL Volume</div>
                        <div className="font-semibold text-[#F5F5F5]">
                          {pilot.separatedSummary.actual.realizedTradeVolumeUgx.toLocaleString()} UGX
                        </div>
                      </div>
                      <div>
                        <div className="text-[#A0A0A0]">SIMULATED (Sandbox)</div>
                        <div className="font-semibold text-amber-300">
                          {pilot.separatedSummary.simulated.sandboxPaymentsCount} · {pilot.separatedSummary.simulated.sandboxPaymentVolumeUgx.toLocaleString()} UGX
                        </div>
                      </div>
                      <div>
                        <div className="text-[#A0A0A0]">TEST Verification</div>
                        <div className="font-semibold text-[#C0C0C0]">
                          {pilot.separatedSummary.test.testTradesCount} trades
                        </div>
                      </div>
                      <div>
                        <div className="text-[#A0A0A0]">TARGET Participants</div>
                        <div className="font-semibold text-emerald-300">
                          {pilot.separatedSummary.actual.onboardedParticipants} / {pilot.separatedSummary.target.targetParticipants}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL CENTRE FILTERS & KPI DEFINITIONS */}
      {tab === 'CONTROL' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Field Monitoring &amp; KPI Measurement Registry</h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={filterPilotId}
                onChange={(e) => setFilterPilotId(e.target.value)}
                placeholder="Filter pilotId..."
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <input
                type="text"
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                placeholder="Filter district (e.g. Mbale)..."
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <input
                type="text"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                placeholder="Filter status..."
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
            </div>
          </div>

          <div className="divide-y divide-[#27272a]">
            {(controlSnap?.pilots?.[0]?.performanceIndicators || pilots[0]?.performanceIndicators || []).map((kpi: any) => (
              <div key={kpi.key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-[#F5F5F5]">{kpi.label}</div>
                  <div className="text-xs text-[#A0A0A0]">
                    {kpi.definition} · Source: <span className="font-mono">{kpi.sourceRecord}</span>
                  </div>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <div className="text-sm font-semibold text-[#D4AF37]">
                    {kpi.value === null ? 'Pending External Survey' : `${kpi.value} ${kpi.unit}`}
                  </div>
                  <div className="text-[11px] font-mono text-[#A0A0A0]">{kpi.classification}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: EXCEPTIONS & SUPPORT / ABUSE REPORTING */}
      {tab === 'EXCEPTIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Operational Exceptions Queue</h2>
            <div className="divide-y divide-[#27272a]">
              {(controlSnap?.exceptions || []).map((exc: V21OperationalException) => (
                <div key={exc.id} className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-[#F5F5F5]">{exc.title}</div>
                    {exc.status !== 'RESOLVED' && exc.status !== 'CLOSED' && (
                      <button
                        type="button"
                        onClick={() => handleResolveException(exc)}
                        className="min-h-[38px] px-3 rounded-lg border border-[#D4AF37] text-xs text-[#D4AF37] cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#A0A0A0]">
                    {exc.id} · {exc.exceptionType} · {exc.priority} · {exc.status} · Owner: {exc.ownerId}
                  </div>
                  <p className="text-xs text-[#A0A0A0]">{exc.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Participant Support &amp; Abuse Cases</h2>
            <form onSubmit={handleCreateSupportCase} className="flex flex-col sm:flex-row gap-2">
              <select
                value={supportCategory}
                onChange={(e) => setSupportCategory(e.target.value as V21SupportRequest['category'])}
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              >
                <option value="SUPPORT">SUPPORT</option>
                <option value="COMPLAINT">COMPLAINT</option>
                <option value="ABUSE_REPORT">ABUSE_REPORT</option>
                <option value="VERIFICATION_HELP">VERIFICATION_HELP</option>
              </select>
              <input
                type="text"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="Log new support or abuse escalation..."
                className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
              >
                Log Case
              </button>
            </form>

            <div className="divide-y divide-[#27272a]">
              {(controlSnap?.supportCases || []).map((sc: V21SupportRequest) => (
                <div key={sc.id} className="py-3 space-y-1">
                  <div className="text-sm font-medium text-[#F5F5F5]">{sc.subject}</div>
                  <div className="text-xs font-mono text-[#A0A0A0]">
                    {sc.id} · {sc.category} · {sc.status} · Priority: {sc.priority}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: EAC & AfCFTA COUNTRY PROFILES */}
      {tab === 'EAC_PROFILES' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#F5F5F5]">EAC &amp; AfCFTA Country Readiness Profiles (7 Countries)</h2>
            <p className="text-xs text-[#A0A0A0]">
              Modularly configures units, currencies, languages, and operational checklists. NOT connected to live statutory or customs systems.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((c) => (
              <div key={c.countryCode} className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#F5F5F5]">
                    {c.countryName} ({c.countryCode})
                  </div>
                  <span className="text-xs font-mono text-[#D4AF37]">{c.defaultCurrency}</span>
                </div>
                <div className="text-xs text-[#A0A0A0]">
                  Bloc: {c.regionalBloc} · TZ: {c.timezone} · Languages: {c.supportedLanguages.join(', ')}
                </div>
                <div className="text-xs text-[#C0C0C0]">
                  Units: {c.supportedUnits.join(', ')}
                </div>
                <div className="text-[11px] font-mono text-amber-300">{c.institutionalIntegrationStatus}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 5: POSTGRESQL 16 DRY-RUN & GITHUB READINESS */}
      {tab === 'POSTGRES_GIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Database size={16} className="text-[#D4AF37]" />
                <span>PostgreSQL 16 Migration Audit &amp; Dry-Run</span>
              </h2>
            </div>
            <div className="text-xs text-[#A0A0A0] space-y-1">
              <div>Active Authority: <strong className="text-[#F5F5F5]">{pgAudit?.activeAuthority || 'LOCAL_JSON_WAL_AUTHORITATIVE'}</strong></div>
              <div>DATABASE_URL Configured: <strong className="text-[#F5F5F5]">{String(Boolean(pgAudit?.databaseUrlConfigured))}</strong></div>
              <div>PostgreSQL Cutover Complete: <strong className="text-amber-300">false (Verified Audit &amp; Dry-Run Only)</strong></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRunPostgresDryRun(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
              >
                Run Schema &amp; Checksum Dry-Run
              </button>
              <button
                type="button"
                onClick={() => handleRunPostgresDryRun(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
              >
                Simulate Interrupted Recovery Audit
              </button>
            </div>
            <div className="divide-y divide-[#27272a]">
              {(pgAudit?.recentRuns || []).slice(0, 5).map((r: V21PostgresMigrationRun) => (
                <div key={r.id} className="py-2.5 text-xs">
                  <div className="font-mono text-[#F5F5F5]">
                    {r.id} · {r.mode} · {r.status}
                  </div>
                  <div className="text-[#A0A0A0] tabular-nums">
                    Collections: {r.collectionsAudited} · Tables: {r.mappedTablesCount} · Debit==Credit: {String(r.ledgerBalancedAfter)} ({r.ledgerDebitUgx.toLocaleString()} UGX)
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
              <GitBranch size={16} className="text-[#D4AF37]" />
              <span>GitHub Publication &amp; Deployment Readiness</span>
            </h2>
            <div className="space-y-2 text-xs text-[#C0C0C0]">
              <div>Git Initialized: <strong className="text-[#F5F5F5]">{String(Boolean(gitReadiness?.gitInitialized))}</strong></div>
              <div>Branch: <strong className="text-[#F5F5F5]">{gitReadiness?.branch || 'Not initialized'}</strong></div>
              <div>.gitignore Secret/DB Rules Protected: <strong className="text-[#F5F5F5]">{String(Boolean(gitReadiness?.gitignoreProtected))}</strong></div>
              <div>V21 Documentation Complete: <strong className="text-[#F5F5F5]">{String(Boolean(gitReadiness?.docsPresent))}</strong></div>
              <div>GITHUB_READY: <strong className="text-emerald-400">{String(Boolean(gitReadiness?.githubReady))}</strong></div>
              <div>GITHUB_PUBLISHED: <strong className="text-amber-300">{String(Boolean(gitReadiness?.githubPublished))}</strong> (External push awaits operator credential)</div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
export default V21PilotCommandCentre;
