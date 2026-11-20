/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V16.0 - 18-Section Production Infrastructure, Verified Integrations & Uganda Pilot Control Center
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Archive,
  Building2,
  CheckCircle2,
  Coins,
  Database,
  FileCheck2,
  Globe,
  KeyRound,
  Languages,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Rocket,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { api } from '../services/apiClient.ts';
import { useAuth } from '../context/AuthContext.tsx';

type SectionKey =
  | 'READINESS_27'
  | 'INFRA_DEPS'
  | 'DATABASE_PG16'
  | 'EVENT_BUS'
  | 'SECURITY_HSM'
  | 'WORM_AUDIT'
  | 'PROVIDERS'
  | 'INSTITUTIONS'
  | 'UGANDA_PILOT'
  | 'USABILITY'
  | 'TRANSLATIONS'
  | 'MONITORING'
  | 'RECOVERY'
  | 'RELEASES'
  | 'IMPACT_FUNNEL'
  | 'UNIT_ECONOMICS'
  | 'COMPLIANCE'
  | 'ATTRIBUTION';

const SECTION_TABS: { id: SectionKey; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'READINESS_27', label: '1. 27-Gate Readiness', icon: CheckCircle2 },
  { id: 'INFRA_DEPS', label: '2. Environments & Deps', icon: Server },
  { id: 'DATABASE_PG16', label: '3. DB & PG16 Cutover', icon: Database },
  { id: 'EVENT_BUS', label: '4. Durable Event Bus', icon: Layers },
  { id: 'SECURITY_HSM', label: '5. Security & HSM', icon: KeyRound },
  { id: 'WORM_AUDIT', label: '6. WORM Audit Archive', icon: Archive },
  { id: 'PROVIDERS', label: '7. Financial Providers', icon: Coins },
  { id: 'INSTITUTIONS', label: '8. Institutional 12-Stage', icon: Building2 },
  { id: 'UGANDA_PILOT', label: '9. Uganda Pilot Ops', icon: Sprout },
  { id: 'USABILITY', label: '10. Usability Programme', icon: Users },
  { id: 'TRANSLATIONS', label: '11. Multilingual Packs', icon: Languages },
  { id: 'MONITORING', label: '12. Monitoring & Incidents', icon: Activity },
  { id: 'RECOVERY', label: '13. Recovery Exercises', icon: RefreshCw },
  { id: 'RELEASES', label: '14. Releases & Rollback', icon: Rocket },
  { id: 'IMPACT_FUNNEL', label: '15. Economic Impact Funnel', icon: TrendingUp },
  { id: 'UNIT_ECONOMICS', label: '16. Sustainability & Costs', icon: Coins },
  { id: 'COMPLIANCE', label: '17. Regulatory Register', icon: FileCheck2 },
  { id: 'ATTRIBUTION', label: '18. Governance & Attribution', icon: ShieldCheck },
];

function stateBadgeClass(state: string): string {
  if (state === 'PRODUCTION_VERIFIED' || state === 'PRODUCTION_CONNECTED') {
    return 'bg-emerald-950/80 text-emerald-300 border-emerald-700';
  }
  if (state === 'SANDBOX_CONNECTED' || state === 'SANDBOX_VALIDATED') {
    return 'bg-sky-950/80 text-sky-300 border-sky-700';
  }
  if (state === 'LOCAL_ONLY' || state === 'CONFIGURED_NOT_CONNECTED' || state === 'CONNECTED_NOT_VALIDATED') {
    return 'bg-amber-950/80 text-amber-300 border-amber-700';
  }
  if (state === 'BLOCKED' || state === 'FAILED') {
    return 'bg-red-950/80 text-red-300 border-red-800';
  }
  return 'bg-zinc-900 text-zinc-300 border-zinc-700';
}

export const V16OperationsControlCenter: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>('READINESS_27');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ kind: 'ok' | 'warn' | 'err'; text: string } | null>(null);

  const [infraStatus, setInfraStatus] = useState<any>(null);
  const [deps, setDeps] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [providersData, setProvidersData] = useState<any>(null);
  const [institutionsData, setInstitutionsData] = useState<any>(null);
  const [pilotData, setPilotData] = useState<any>(null);
  const [usabilityData, setUsabilityData] = useState<any>(null);
  const [translationsData, setTranslationsData] = useState<any>(null);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [releasesData, setReleasesData] = useState<any>(null);
  const [economicsData, setEconomicsData] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [impactData, setImpactData] = useState<any>(null);

  const actor = {
    userId: currentUser?.id || 'usr_admin_01',
    userRole: role || 'PLATFORM_ADMIN',
    tenantId: 'TEN-UG-ELGON-01',
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        inf,
        dep,
        dbs,
        prv,
        ins,
        plt,
        usab,
        trn,
        mon,
        rec,
        rel,
        eco,
        cmp,
        imp,
      ] = await Promise.all([
        api.v16GetInfrastructureStatus(actor),
        api.v16GetDependencies(actor),
        api.v16GetDatabaseStatus(actor),
        api.v16GetProviders(actor),
        api.v16GetInstitutions(actor),
        api.v16GetPilot(actor),
        api.v16GetUsability(actor),
        api.v16GetTranslations(actor),
        api.v16GetMonitoringHealth(actor),
        api.v16GetRecoveryStatus(actor),
        api.v16GetReleases(actor),
        api.v16GetUnitEconomics(actor),
        api.v16GetComplianceReviews(actor),
        api.v16GetImpactSummary(actor),
      ]);
      setInfraStatus(inf);
      setDeps(dep.dependencies || []);
      setDbStatus(dbs);
      setProvidersData(prv);
      setInstitutionsData(ins);
      setPilotData(plt);
      setUsabilityData(usab);
      setTranslationsData(trn);
      setMonitoringData(mon);
      setRecoveryData(rec);
      setReleasesData(rel);
      setEconomicsData(eco);
      setComplianceData(cmp);
      setImpactData(imp);
    } catch (e: any) {
      setActionMsg({ kind: 'err', text: e?.message || 'Unable to load V16 Control Center telemetry.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role]);

  const handleDryRun = async () => {
    try {
      const out = await api.v16RunMigrationDryRun(undefined, actor);
      setActionMsg({
        kind: 'ok',
        text: `Dry-Run ${out.dryRunCheckpoint?.id} validated (${out.dryRunCheckpoint?.status}, discrepancies=${out.discrepancyCount}).`,
      });
      loadAll();
    } catch (e: any) {
      setActionMsg({ kind: 'err', text: e?.message || 'Dry-run failed.' });
    }
  };

  const handleAttemptCutover = async () => {
    const out = await api.v16RequestDatabaseAuthority('POSTGRESQL_PRIMARY', true, actor);
    setActionMsg({
      kind: out.ok ? 'ok' : 'warn',
      text: out.ok
        ? `Authority transitioned to ${out.currentState}`
        : `Fail-closed (HTTP ${out.status}): ${(out.blockedReasons || []).join(' ')}`,
    });
    loadAll();
  };

  const handleTestProvider = async (providerId: string) => {
    const out = await api.v16TestProvider(providerId, 'INTEGRATION_TESTING', actor);
    setActionMsg({
      kind: out.ok ? 'ok' : 'warn',
      text: out.testRecord?.diagnosticNote || out.error || 'Provider check recorded.',
    });
    loadAll();
  };

  const handleExportArchive = async () => {
    try {
      const out = await api.v16ExportAuditArchive(actor);
      setActionMsg({
        kind: 'ok',
        text: `Audit checkpoint ${out.latestArchive?.id} signed (${out.latestArchive?.archiveDestinationType}).`,
      });
      loadAll();
    } catch (e: any) {
      setActionMsg({ kind: 'err', text: e?.message || 'Export failed.' });
    }
  };

  const handleRecoveryDrill = async () => {
    try {
      const out = await api.v16ExecuteRecovery({ targetRpoMinutes: 5, targetRtoMinutes: 30 }, actor);
      setActionMsg({
        kind: 'ok',
        text: `Recovery exercise ${out.exercise?.id}: ${out.exercise?.status} (RPO=${out.exercise?.actualRpoSeconds}s, RTO=${out.exercise?.actualRtoSeconds}s).`,
      });
      loadAll();
    } catch (e: any) {
      setActionMsg({ kind: 'err', text: e?.message || 'Recovery exercise failed.' });
    }
  };

  const readiness = infraStatus?.readiness;
  const statuses = readiness?.statuses || {
    ENGINEERING_COMPLETE: true,
    PRODUCTION_READY: false,
    LIVE_PILOT_OPERATIONAL: false,
  };

  const filteredTabs = searchQuery.trim()
    ? SECTION_TABS.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : SECTION_TABS;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-[#181818] border border-[#D4AF37]/50 text-[#D4AF37]">
                ECONEX V16.0 CONTROL CENTER
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                ENGINEERING_COMPLETE
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-950/70 border border-amber-800 text-amber-300">
                PRODUCTION_READY: {statuses.PRODUCTION_READY ? 'YES' : 'NO (BLOCKED)'}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-red-950/70 border border-red-800 text-red-300">
                LIVE_PILOT_OPERATIONAL: {statuses.LIVE_PILOT_OPERATIONAL ? 'YES' : 'NO'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#F5F5F5] mt-2">
              Production Infrastructure, Verified Integrations &amp; Uganda Pilot Activation
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Developed under <strong className="text-[#F5F5F5]">VINEXSAH TECHNOLOGIES</strong>. All rights reserved. Schema Version:{' '}
              <span className="text-[#D4AF37] font-mono">V{infraStatus?.schemaVersion || 16}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs font-semibold text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Telemetry</span>
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('tests')}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e3be46] text-xs font-semibold text-black flex items-center gap-2 cursor-pointer"
              >
                <Play size={14} />
                <span>Verification Suite (1,220)</span>
              </button>
            )}
          </div>
        </div>

        {/* Truthful Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#27272a]">
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[11px] text-[#A0A0A0]">27-Gate Production Readiness</div>
            <div className="text-lg font-mono font-bold text-[#D4AF37] mt-0.5">
              {readiness?.gatesPassed ?? '—'} / {readiness?.gatesTotal ?? 27}
            </div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[11px] text-[#A0A0A0]">Authoritative Write DB</div>
            <div className="text-sm font-mono font-semibold text-amber-300 mt-1">
              {infraStatus?.database?.authorityState || 'JSON_WAL_ACTIVE'}
            </div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[11px] text-[#A0A0A0]">External Usability Conducted</div>
            <div className="text-sm font-mono font-semibold text-[#F5F5F5] mt-1">
              {usabilityData?.programmeStatus || 'NOT_CONDUCTED'} ({usabilityData?.participantsTested ?? 0})
            </div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
            <div className="text-[11px] text-[#A0A0A0]">Live Licensed Payment Rails</div>
            <div className="text-sm font-mono font-semibold text-red-300 mt-1">
              {providersData?.liveAuthorizedCount ?? 0} / {providersData?.totalProviders ?? 0} Verified
            </div>
          </div>
        </div>

        {actionMsg && (
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              actionMsg.kind === 'ok'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                : actionMsg.kind === 'warn'
                  ? 'bg-amber-950/60 border-amber-800 text-amber-200'
                  : 'bg-red-950/60 border-red-800 text-red-200'
            }`}
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span>{actionMsg.text}</span>
          </div>
        )}
      </div>

      {/* Responsive 18-Section Selector */}
      <div className="bg-[#0a0a0c] border border-[#27272a] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-semibold text-[#D4AF37]">
            18 Operational Governance Workspaces
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter section..."
            className="px-3 py-1.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`px-2.5 py-2 rounded-xl border text-left text-[11px] flex items-center gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-semibold'
                    : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Workspace Detail Panel */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-5">
        {activeSection === 'READINESS_27' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#D4AF37]" /> 27-Gate Production &amp; Pilot Acceptance Matrix
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              ECONEX enforces fail-closed readiness gates across infrastructure, cryptography, licensed financial providers, usability, legal counsel review, and pilot operations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(readiness?.gates || []).map((g: any) => (
                <div key={g.gateNumber} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#F5F5F5]">
                      #{g.gateNumber}. {g.gateName}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stateBadgeClass(g.state)}`}>
                      {g.state}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A0A0A0]">{g.evidence}</p>
                  {g.blocker && (
                    <p className="text-[11px] text-red-300 flex items-start gap-1.5">
                      <XCircle size={12} className="shrink-0 mt-0.5" />
                      <span>{g.blocker}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'INFRA_DEPS' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#F5F5F5]">Environment Isolation &amp; External Dependencies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(infraStatus?.environmentStartup?.environments || []).map((e: any) => (
                <div key={e.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#D4AF37]">{e.environment}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stateBadgeClass(e.status)}`}>
                      {e.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#F5F5F5] font-mono">DB Target: {e.databaseTargetLabel}</div>
                  <p className="text-[11px] text-[#A0A0A0]">{e.accessPolicySummary}</p>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-semibold text-[#F5F5F5] pt-2">External Production Dependencies</h3>
            <div className="space-y-2">
              {deps.map((d) => (
                <div key={d.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[#F5F5F5]">{d.name}</div>
                    <div className="text-[11px] text-[#A0A0A0]">Fallback: {d.localFallback}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stateBadgeClass(d.state)}`}>
                    {d.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'DATABASE_PG16' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#F5F5F5]">PostgreSQL 16 Cutover State Machine &amp; V15→V16 Migration</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDryRun}
                  className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#D4AF37]/60 text-xs text-[#D4AF37] cursor-pointer"
                >
                  Run Migration Dry-Run
                </button>
                <button
                  type="button"
                  onClick={handleAttemptCutover}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold cursor-pointer"
                >
                  Test PG16 Cutover Gate
                </button>
              </div>
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
              <div>Authority State: <strong className="text-[#D4AF37] font-mono">{dbStatus?.probe?.authorityState}</strong></div>
              <div>V15 Canonical Backup Valid: <strong className="text-emerald-300">{String(dbStatus?.v15Rollback?.v15BackupValid)}</strong> ({dbStatus?.v15Rollback?.bytes} bytes)</div>
              <div className="font-mono text-[11px] text-[#A0A0A0]">V15 Backup SHA-256: {dbStatus?.v15Rollback?.checksumSha256}</div>
              <div className="font-mono text-[11px] text-[#A0A0A0]">schema_v16.sql SHA-256: {dbStatus?.probe?.schemaV16Sha256}</div>
              <p className="text-[11px] text-amber-200">{dbStatus?.probe?.truthfulDisclosure}</p>
            </div>
          </div>
        )}

        {activeSection === 'EVENT_BUS' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Provider-Neutral 12-Category Durable Event Bus</h2>
            <p className="text-[#A0A0A0]">{infraStatus?.eventBus?.truthfulDisclosure}</p>
            <div className="flex flex-wrap gap-1.5">
              {(infraStatus?.eventBus?.supportedCategories || []).map((c: string) => (
                <span key={c} className="px-2 py-1 rounded bg-[#0a0a0c] border border-[#27272a] font-mono text-[10px] text-[#D4AF37]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'SECURITY_HSM' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">PKCS#11 HSM &amp; Key Isolation</h2>
            <p className="text-amber-200">{infraStatus?.securityHsm?.truthfulDisclosure}</p>
            <div>Silent Prod→Dev Signing Fallback Allowed: <strong className="text-red-300 font-mono">FALSE (Blocked)</strong></div>
            <div>Active Keys in Registry: <strong className="font-mono text-[#F5F5F5]">{infraStatus?.securityHsm?.activeKeys}</strong></div>
          </div>
        )}

        {activeSection === 'WORM_AUDIT' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#F5F5F5]">Tamper-Evident &amp; External WORM Audit Archive</h2>
              <button type="button" onClick={handleExportArchive} className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black font-semibold cursor-pointer">
                Export Signed Checkpoint
              </button>
            </div>
            <p className="text-[#A0A0A0]">{infraStatus?.auditArchive?.truthfulDisclosure}</p>
            <div className="text-[11px] font-mono text-[#F5F5F5]">
              External WORM Status: {infraStatus?.auditArchive?.externalImmutableWormState} | Local Signed Checkpoints: {infraStatus?.auditArchive?.totalArchives}
            </div>
          </div>
        )}

        {activeSection === 'PROVIDERS' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F5]">Financial Provider Integrations &amp; Settlement Verification</h2>
            <p className="text-xs text-[#A0A0A0]">{providersData?.truthfulDisclosure}</p>
            <div className="space-y-2">
              {(providersData?.providers || []).map((p: any) => (
                <div key={p.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#F5F5F5]">{p.providerName} ({p.providerCode})</div>
                    <div className="text-[11px] text-[#A0A0A0]">Lifecycle: {p.lifecycleState} | Currencies: {(p.supportedCurrencies || []).join(', ')}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestProvider(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#D4AF37]/60 text-[11px] text-[#D4AF37] cursor-pointer"
                  >
                    Run Connection &amp; Idempotency Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'INSTITUTIONS' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F5]">12-Stage Institutional Onboarding Pipeline</h2>
            <p className="text-xs text-amber-200">{institutionsData?.disclaimer}</p>
            <div className="space-y-2">
              {(institutionsData?.institutions || []).map((inst: any) => (
                <div key={inst.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#F5F5F5]">{inst.institutionName}</div>
                    <div className="text-[11px] text-[#A0A0A0]">Stage {inst.stageNumber}/12 ({inst.currentStage}) | Protocols: {(inst.protocolsSupported || []).join(', ')}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stateBadgeClass(inst.readinessState)}`}>
                    {inst.readinessState}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'UGANDA_PILOT' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#F5F5F5]">{pilotData?.programme?.title || 'Uganda Pilot Operations Workspace'}</h2>
            <p className="text-xs text-amber-200">{pilotData?.programme?.nonProductionDisclosure}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Active Cohorts</div>
                <div className="text-base font-bold text-[#D4AF37]">{pilotData?.metrics?.cohortsCount}</div>
              </div>
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Consented Test Records</div>
                <div className="text-base font-bold text-[#F5F5F5]">{pilotData?.metrics?.nonProductionTestParticipants}</div>
              </div>
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Real External Pilot Users</div>
                <div className="text-base font-bold text-emerald-300">{pilotData?.metrics?.verifiedRealExternalParticipants}</div>
              </div>
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Live Provider UGX Volume</div>
                <div className="text-base font-bold font-mono text-[#F5F5F5]">{pilotData?.metrics?.verifiedLiveProviderVolumeUgx} UGX</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'USABILITY' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Human Usability Validation Programme</h2>
            <p className="text-amber-200">{usabilityData?.truthfulDisclosure}</p>
            <div>Status: <strong className="font-mono text-[#D4AF37]">{usabilityData?.programmeStatus}</strong> | Participants Tested: <strong>{usabilityData?.participantsTested}</strong></div>
          </div>
        )}

        {activeSection === 'TRANSLATIONS' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">7-Language Localization &amp; Legal/Financial Safety Fallback</h2>
            <p className="text-[#A0A0A0]">{translationsData?.legalFinancialFallbackPolicy}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(translationsData?.reviews || []).map((r: any) => (
                <div key={r.langCode} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#F5F5F5]">{r.name} ({r.nativeName})</div>
                    <div className="text-[11px] text-[#A0A0A0]">{r.regionFocus}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[#D4AF37]">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'MONITORING' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Operational Monitoring &amp; Incident Workflows</h2>
            <div>Overall Status: <strong className="font-mono text-[#D4AF37]">{monitoringData?.overallStatus}</strong> | Open Incidents: <strong>{monitoringData?.openIncidentsCount}</strong></div>
          </div>
        )}

        {activeSection === 'RECOVERY' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#F5F5F5]">Disaster Recovery Verification Exercises</h2>
              <button type="button" onClick={handleRecoveryDrill} className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black font-semibold cursor-pointer">
                Execute V16 Recovery Drill
              </button>
            </div>
            <div>Recorded V16 Exercises: <strong className="font-mono text-[#D4AF37]">{(recoveryData?.exercises || []).length}</strong></div>
          </div>
        )}

        {activeSection === 'RELEASES' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Release &amp; Rollback Pipeline</h2>
            {(releasesData?.releases || []).map((r: any) => (
              <div key={r.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-[#F5F5F5]">{r.versionTag} ({r.strategy})</div>
                  <div className="text-[11px] text-[#A0A0A0]">Rollback Target: {r.rollbackTargetVersion}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[#D4AF37]">{r.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'IMPACT_FUNNEL' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Real-Data Economic Activity Funnel</h2>
            <p className="text-[#A0A0A0]">{impactData?.funnel?.methodology}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(impactData?.funnel?.funnel || {}).map(([k, v]) => (
                <div key={k} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                  <div className="text-[10px] text-[#A0A0A0] font-mono">{k}</div>
                  <div className="text-sm font-bold font-mono text-[#D4AF37] mt-0.5">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'UNIT_ECONOMICS' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Operational Costs &amp; Unit Economics Truthfulness</h2>
            <p className="text-[#A0A0A0]">{economicsData?.truthfulDisclosure}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Operational Costs</div>
                <div className="text-base font-bold font-mono text-[#F5F5F5]">${economicsData?.totalOperationalCostUsd ?? 0}</div>
              </div>
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Issued Commercial Billing</div>
                <div className="text-base font-bold font-mono text-[#D4AF37]">${economicsData?.issuedCommercialBillingUsd ?? 0}</div>
              </div>
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Collected Real Revenue</div>
                <div className="text-base font-bold font-mono text-emerald-300">${economicsData?.collectedRealRevenueUsd ?? 0}</div>
              </div>
              <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3">
                <div className="text-[#A0A0A0]">Pricing Tiers</div>
                <div className="text-base font-bold font-mono text-[#F5F5F5]">{economicsData?.pricingPlansCount ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'COMPLIANCE' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Uganda &amp; EAC Regulatory Compliance Register</h2>
            <div className="space-y-2">
              {(complianceData?.reviews || []).map((r: any) => (
                <div key={r.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#F5F5F5]">{r.statutoryReference} ({r.domain})</div>
                    <div className="text-[11px] text-[#A0A0A0]">{r.requirementSummary}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-200">
                    {r.reviewStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'ATTRIBUTION' && (
          <div className="space-y-2 text-xs">
            <h2 className="text-base font-bold text-[#F5F5F5]">Corporate Attribution &amp; Operational Boundaries</h2>
            <p className="text-[#D4AF37] font-semibold">Developed under VINEXSAH TECHNOLOGIES. All rights reserved.</p>
            <p className="text-[#A0A0A0]">
              ECONEX V16.0 is ENGINEERING_COMPLETE and hardened for fail-closed external infrastructure cutover. Production financial settlement and live pilot operations remain gated until managed PostgreSQL 16, PKCS#11 HSM, external WORM archival, licensed mobile money / bank production credentials, external usability validation, and independent legal counsel clearances are verified.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
