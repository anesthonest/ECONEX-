/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V31.0 — Sovereign Infrastructure, PostgreSQL 16 Rehearsal, Residency & CI/CD Hub
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Database,
  Server,
  ShieldCheck,
  HardDrive,
  Code2,
  RefreshCw,
  Play,
  FileLock2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: 'OVERVIEW' | 'POSTGRES' | 'RESIDENCY' | 'CICD' | 'READINESS';
}

export const V31SovereignInfrastructureHub: React.FC<Props> = ({
  onNavigate,
  initialSubTab = 'OVERVIEW',
}) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role };
  const [subTab, setSubTab] = useState<'OVERVIEW' | 'POSTGRES' | 'RESIDENCY' | 'CICD' | 'READINESS'>(initialSubTab);
  const [overview, setOverview] = useState<any>(null);
  const [pgStatus, setPgStatus] = useState<any>(null);
  const [residency, setResidency] = useState<any[]>([]);
  const [githubDiag, setGitHubDiag] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [openApi, setOpenApi] = useState<any>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadAll = async () => {
    try {
      const [ov, pg, resPol, gh, rm, oa] = await Promise.all([
        api.v31GetOverview(actor),
        api.v31GetPostgresStatus(),
        api.v31GetResidencyPolicies(),
        api.v31GetGitHubDiagnostics(),
        api.v31GetReadinessMatrix(),
        api.v31GetOpenApiSpec(),
      ]);
      setOverview(ov);
      setPgStatus(pg);
      setResidency(resPol.policies || []);
      setGitHubDiag(gh);
      setReadiness(rm);
      setOpenApi(oa);
    } catch (e: any) {
      setNotice(e?.message || 'Unable to load Sovereign Infrastructure telemetry.');
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role]);

  const handleRunDryRun = async (simulateInterrupt: boolean) => {
    setBusyAction(simulateInterrupt ? 'interrupt' : 'dryrun');
    setNotice(null);
    try {
      const run = await api.v31RunPostgresDryRun({ simulateInterrupt }, actor);
      setNotice(`15-stage PG16 rehearsal ${run.id} completed (${run.status}, variance=${run.ledgerVarianceMinor} minor). Authority remains ${run.activeAuthorityAfterRun}.`);
      await loadAll();
    } catch (e: any) {
      setNotice(e?.message || 'PG dry-run failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleBackupDrill = async () => {
    setBusyAction('backup');
    setNotice(null);
    try {
      const rec = await api.v31RunBackupDrill(actor);
      setNotice(`Backup & restore drill verified: ${rec.bytes.toLocaleString()} bytes in ${rec.measuredRestoreDurationMs} ms (SHA-256 ${rec.checksumSha256.slice(0, 12)}...).`);
      await loadAll();
    } catch (e: any) {
      setNotice(e?.message || 'Backup drill failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleVerifyEnv = async (env: 'DEV' | 'TEST' | 'STAGING' | 'PROD') => {
    setBusyAction(`env-${env}`);
    setNotice(null);
    try {
      const rec = await api.v31VerifyEnvironment({ environment: env }, actor);
      setNotice(`Environment ${rec.environment} check recorded -> ${rec.status} (Schema ${rec.schemaVersion}).`);
      await loadAll();
    } catch (e: any) {
      setNotice(e?.message || 'Environment check failed');
    } finally {
      setBusyAction(null);
    }
  };

  const tabs: Array<{ id: typeof subTab; label: string }> = [
    { id: 'OVERVIEW', label: 'Infrastructure Command' },
    { id: 'POSTGRES', label: 'PG16 15-Stage Migration & DR' },
    { id: 'RESIDENCY', label: 'Data Residency Governance' },
    { id: 'CICD', label: 'GitHub CI/CD & Environments' },
    { id: 'READINESS', label: '30-Item Matrix & OpenAPI 3.1' },
  ];

  return (
    <div className="space-y-5">
      <header className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
            <Server className="w-4 h-4" />
            <span>ECONEX V31.0 · SCHEMA 28 SOVEREIGN DATA INFRASTRUCTURE</span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Sovereign Infrastructure, PostgreSQL 16 Rehearsal & Deployment Control
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            Active Authority: <span className="font-mono text-[#F5F5F5]">{pgStatus?.databaseAuthority || 'LOCAL_JSON_WAL_AUTHORITATIVE'}</span> · Production Cutover: <span className="font-mono text-amber-300">FALSE (SANDBOX / DRY-RUN)</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#141418] text-xs font-medium text-[#F5F5F5] hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v31-provider-certification')}
            className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
          >
            Provider Certification Harness
          </button>
        </div>
      </header>

      {notice && (
        <div className="bg-[#121216] border border-[#D4AF37]/40 rounded-lg px-4 py-3 text-xs text-[#F5F5F5] font-mono">
          {notice}
        </div>
      )}

      <nav className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              subTab === t.id
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#0d0d10] text-[#A0A0A0] border-[#27272a] hover:text-[#F5F5F5]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {subTab === 'OVERVIEW' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-4 space-y-1">
              <div className="text-[11px] font-mono text-[#A0A0A0]">SCHEMA 28 TABLES</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#F5F5F5]">
                {overview?.infrastructure?.schema28TablesPresent ?? 21} / {overview?.infrastructure?.schema28TablesExpected ?? 21}
              </div>
              <div className="text-xs text-emerald-400">PostgreSQL 16 DDL Normalized</div>
            </div>
            <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-4 space-y-1">
              <div className="text-[11px] font-mono text-[#A0A0A0]">V30 ROLLBACK SNAPSHOT</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#F5F5F5]">
                {overview?.infrastructure?.v30BackupPreserved ? 'VERIFIED' : 'MISSING'}
              </div>
              <div className="text-xs font-mono text-[#A0A0A0] truncate">
                SHA {overview?.infrastructure?.v30BackupSha256?.slice(0, 14) || '...'}
              </div>
            </div>
            <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-4 space-y-1">
              <div className="text-[11px] font-mono text-[#A0A0A0]">PROVIDERS TRACKED</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#F5F5F5]">
                {overview?.connectivity?.providersRegistered ?? 13}
              </div>
              <div className="text-xs text-amber-300">
                Live Verified: {overview?.connectivity?.liveVerifiedCount ?? 0} (Sandbox Only)
              </div>
            </div>
            <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-4 space-y-1">
              <div className="text-[11px] font-mono text-[#A0A0A0]">COUNTRIES / RESIDENCY</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#F5F5F5]">
                {overview?.continental?.countriesConfigured ?? 6} States
              </div>
              <div className="text-xs text-[#A0A0A0]">
                UG Pilot Stage {overview?.pilotReadiness?.currentStageNumber ?? 1}/9 (Inactive)
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Mandatory Pre-Production Honesty Flags (Fail-Closed Truthfulness)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
              {Object.entries(overview?.honestyFlags || {}).map(([k, v]) => (
                <div key={k} className="border border-[#27272a] bg-[#08080a] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-[#A0A0A0] truncate">{k}</span>
                  <span className={v ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                    {String(v).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'POSTGRES' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#D4AF37]" />
                15-Stage JSON WAL -&gt; PostgreSQL 16 Rehearsal &amp; Parity Validator
              </h2>
              <p className="text-xs text-[#A0A0A0]">
                Target: <span className="font-mono text-[#F5F5F5]">{pgStatus?.pgTargetRedacted}</span> · Zero Ledger Variance Enforced
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleRunDryRun(false)}
                className="min-h-[38px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {busyAction === 'dryrun' ? 'Running 15 Stages...' : 'Execute 15-Stage Dry Run'}
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => handleRunDryRun(true)}
                className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#141418] text-xs text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer disabled:opacity-50"
              >
                Test Interrupt / Resume
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={handleBackupDrill}
                className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#141418] text-xs text-[#F5F5F5] hover:border-[#D4AF37] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <HardDrive className="w-3.5 h-3.5" />
                {busyAction === 'backup' ? 'Verifying Restore...' : 'Run Backup Restore Drill'}
              </button>
            </div>
          </div>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37]">
              MIGRATION RUNS ({pgStatus?.migrationRuns?.length || 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Run ID</th>
                    <th className="py-2.5 px-4">Mode</th>
                    <th className="py-2.5 px-4">Stages</th>
                    <th className="py-2.5 px-4 text-right">Source Rows</th>
                    <th className="py-2.5 px-4 text-right">Target Rows</th>
                    <th className="py-2.5 px-4 text-right">Ledger Variance</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                  {(pgStatus?.migrationRuns || []).map((r: any) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{r.id}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{r.mode}</td>
                      <td className="py-2.5 px-4">{r.stages?.length || 15}/15</td>
                      <td className="py-2.5 px-4 text-right">{r.totalSourceRecords?.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right">{r.totalTargetRecords?.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-400">{r.ledgerVarianceMinor} minor</td>
                      <td className="py-2.5 px-4 text-[#D4AF37]">{r.status}</td>
                    </tr>
                  ))}
                  {(!pgStatus?.migrationRuns || pgStatus.migrationRuns.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#A0A0A0]">
                        No rehearsal runs recorded yet. Execute the 15-stage dry run above to measure live parity.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'RESIDENCY' && (
        <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
            <span className="text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <FileLock2 className="w-4 h-4" />
              SOVEREIGN DATA RESIDENCY POLICIES ({residency.length})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                <tr>
                  <th className="py-2.5 px-4">Country</th>
                  <th className="py-2.5 px-4">Storage Region</th>
                  <th className="py-2.5 px-4">Residency Mode</th>
                  <th className="py-2.5 px-4">At-Rest Encryption</th>
                  <th className="py-2.5 px-4 text-right">Financial Retention</th>
                  <th className="py-2.5 px-4">PII Export Blocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                {residency.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4 font-semibold text-[#F5F5F5]">{p.countryCode} · {p.jurisdictionName}</td>
                    <td className="py-2.5 px-4 text-[#A0A0A0]">{p.primaryStorageRegion}</td>
                    <td className="py-2.5 px-4 text-[#D4AF37]">{p.residencyMode}</td>
                    <td className="py-2.5 px-4 text-emerald-400">{p.encryptionAtRestStandard}</td>
                    <td className="py-2.5 px-4 text-right">{p.retentionDaysFinancial}d</td>
                    <td className="py-2.5 px-4">{p.piiExportBlockedByDefault ? 'YES' : 'NO'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'CICD' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#D4AF37]" />
              GitHub Repository, Workflows &amp; Deployment Environments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="border border-[#27272a] bg-[#08080a] rounded-lg p-3">
                <div className="text-[#A0A0A0]">HEAD COMMIT ({githubDiag?.repository?.branch})</div>
                <div className="text-[#F5F5F5] font-bold mt-1">{githubDiag?.repository?.headCommit || 'PENDING'}</div>
                <div className="text-[#A0A0A0] truncate mt-0.5">{githubDiag?.repository?.headSubject}</div>
              </div>
              <div className="border border-[#27272a] bg-[#08080a] rounded-lg p-3">
                <div className="text-[#A0A0A0]">REMOTE SYNC VERIFIED</div>
                <div className="text-amber-300 font-bold mt-1">FALSE (Container Local Git)</div>
                <div className="text-[#A0A0A0] mt-0.5">Remotes: {githubDiag?.repository?.remotesOutput}</div>
              </div>
              <div className="border border-[#27272a] bg-[#08080a] rounded-lg p-3">
                <div className="text-[#A0A0A0]">V31 SOURCE ARCHIVE</div>
                <div className="text-[#F5F5F5] font-bold mt-1">
                  {githubDiag?.archives?.v31ArchiveExists ? `${githubDiag.archives.v31ArchiveBytes.toLocaleString()} bytes` : 'Generated at Phase N'}
                </div>
                <div className="text-[#A0A0A0] mt-0.5">V29 &amp; V30 ZIP Preserved</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37]">
              DEPLOYMENT ENVIRONMENTS (DEV / TEST / STAGING / PROD)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Env</th>
                    <th className="py-2.5 px-4">Target</th>
                    <th className="py-2.5 px-4">Authority</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono">
                  {(githubDiag?.environments || []).map((env: any) => (
                    <tr key={env.id}>
                      <td className="py-2.5 px-4 font-bold text-[#F5F5F5]">{env.environment}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{env.targetHostDescription}</td>
                      <td className="py-2.5 px-4">{env.databaseAuthority}</td>
                      <td className={`py-2.5 px-4 ${env.status === 'NOT_DEPLOYED' ? 'text-amber-300' : 'text-emerald-400'}`}>
                        {env.status}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleVerifyEnv(env.environment)}
                          className="px-2.5 py-1 rounded border border-[#27272a] bg-[#141418] hover:border-[#D4AF37] text-[#F5F5F5] cursor-pointer"
                        >
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'READINESS' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between text-xs font-mono">
              <span className="text-[#D4AF37]">30-ITEM V31 RELEASE ACCEPTANCE MATRIX</span>
              <span className="text-[#A0A0A0]">OpenAPI {openApi?.openapi || '3.1.0'} ({Object.keys(openApi?.paths || {}).length} Paths)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Acceptance Requirement</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Measured Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {(readiness?.rows || []).map((row: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{row.item}</td>
                      <td className="py-2.5 px-4 font-mono">
                        <span className={`inline-flex items-center gap-1 ${
                          row.status === 'COMPLETE' ? 'text-emerald-400' :
                          row.status === 'DRY_RUN_VERIFIED' ? 'text-sky-400' :
                          row.status === 'BLOCKED' ? 'text-red-400' : 'text-amber-300'
                        }`}>
                          {row.status === 'COMPLETE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#A0A0A0]">{row.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
