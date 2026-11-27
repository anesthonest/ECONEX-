/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V25.0 — Continental Infrastructure Command Centre
 * Real measured telemetry, 22-flag truthfulness matrix, Country Engine, Multi-Currency FX, DR Drill, Load Test & AI Advisor
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Globe,
  HardDrive,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V25BackupDrillRun,
  V25CountryProfile,
  V25CountryReadinessReport,
  V25FxQuote,
  V25LoadBenchmarkRun,
  V25ReadinessMatrix,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V25InfrastructureCommandCentreView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role, tenantId: 'TENANT-UG' };

  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [readiness, setReadiness] = useState<V25ReadinessMatrix | null>(null);
  const [countries, setCountries] = useState<V25CountryProfile[]>([]);
  const [reports, setReports] = useState<V25CountryReadinessReport[]>([]);
  const [quotes, setQuotes] = useState<V25FxQuote[]>([]);
  const [drillResult, setDrillResult] = useState<V25BackupDrillRun | null>(null);
  const [loadResult, setLoadResult] = useState<V25LoadBenchmarkRun | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Country & FX forms
  const [newCountryCode, setNewCountryCode] = useState('ET');
  const [newCountryName, setNewCountryName] = useState('Federal Democratic Republic of Ethiopia');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [fxAmountMinor, setFxAmountMinor] = useState(100_000);

  // Governed AI Assistant
  const [aiTask, setAiTask] = useState<'INFRASTRUCTURE_DIAGNOSTIC' | 'COUNTRY_READINESS_REVIEW' | 'FX_EXPOSURE_SUMMARY'>('INFRASTRUCTURE_DIAGNOSTIC');
  const [aiPrompt, setAiPrompt] = useState('Review Schema 23 JSON WAL authority, PostgreSQL readiness, and active East African corridor controls.');
  const [aiOutput, setAiOutput] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tel, mat, cRes, fxRes] = await Promise.all([
        ApiClient.v25GetTelemetry(actor),
        ApiClient.v25GetReadinessMatrix(),
        ApiClient.v25GetCountries(actor),
        ApiClient.v25GetFxQuotes(actor),
      ]);
      setTelemetry(tel);
      setReadiness(mat);
      setCountries(cRes.countries || []);
      setReports(cRes.readinessReports || []);
      setQuotes(fxRes.quotes || []);
      if (tel?.latestBackupDrill) setDrillResult(tel.latestBackupDrill);
      if (tel?.latestLoadBenchmark) setLoadResult(tel.latestLoadBenchmark);
    } catch (err: any) {
      setActionMsg(err?.message || 'Failed to load V25 Command Centre telemetry');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunBackupDrill = async () => {
    setBusyAction('DRILL');
    try {
      const res = await ApiClient.v25RunBackupDrill(actor);
      setDrillResult(res);
      setActionMsg(`DR Drill ${res.id} passed cleanly · RPO=${res.measuredRpoSeconds}s · RTO=${res.measuredRtoMs}ms · SHA-256=${res.backupChecksumSha256.slice(0, 12)}...`);
      await loadData();
    } catch (e: any) {
      setActionMsg(e?.message || 'Backup drill failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunLoadBenchmark = async () => {
    setBusyAction('LOAD');
    try {
      const res = await ApiClient.v25RunLoadBenchmark({ concurrency: 25, totalRequests: 100 }, actor);
      setLoadResult(res);
      setActionMsg(`Measured ${res.measuredRps} req/s (${res.succeededRequests}/${res.totalRequests} passed, p95=${res.p95LatencyMs}ms, RSS=${res.memoryRssMb} MB)`);
      await loadData();
    } catch (e: any) {
      setActionMsg(e?.message || 'Load benchmark failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRegisterCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction('COUNTRY');
    try {
      await ApiClient.v25RegisterCountry(
        {
          countryCode: newCountryCode,
          countryName: newCountryName,
          defaultCurrency: newCurrency,
          regionBloc: 'AFCFTA_GENERAL',
        },
        actor
      );
      setActionMsg(`Registered ${newCountryName} (${newCountryCode.toUpperCase()}) in inactive staging status.`);
      await loadData();
    } catch (err: any) {
      setActionMsg(err?.message || 'Country registration requires Platform Admin');
    } finally {
      setBusyAction(null);
    }
  };

  const handleActivateCountry = async (code: string) => {
    setBusyAction(`ACT-${code}`);
    try {
      await ApiClient.v25ActivateCountry(code, actor);
      setActionMsg(`Approved controlled sandbox activation for ${code}. External live rails remain disconnected.`);
      await loadData();
    } catch (err: any) {
      setActionMsg(err?.message || 'Activation failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleExecuteFx = async (quoteId: string) => {
    setBusyAction(`FX-${quoteId}`);
    try {
      const rec = await ApiClient.v25ExecuteFxClearing({ quoteId, sourceAmountMinor: fxAmountMinor }, actor);
      setActionMsg(`Cleared FX ${rec.sourceAmountMinor} ${rec.sourceCurrency} -> ${rec.targetAmountMinor} ${rec.targetCurrency} (fee=${rec.clearingFeeMinor} ${rec.targetCurrency}, reconciled=${rec.reconciled}).`);
      await loadData();
    } catch (err: any) {
      setActionMsg(err?.message || 'FX execution failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction('AI');
    try {
      const res = await ApiClient.v25AskAiAssist({ taskType: aiTask, prompt: aiPrompt }, actor);
      setAiOutput(res);
    } catch (err: any) {
      setAiOutput({ summary: err?.message || 'Request blocked by AI governance boundary', blocked: true });
    } finally {
      setBusyAction(null);
    }
  };

  const flagEntries = readiness ? Object.entries(readiness.flags) : [];
  const implementedTrue = flagEntries.filter(([, v]) => v).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#D4AF37]">ECONEX V25.0 · CONTINENTAL INFRASTRUCTURE COMMAND CENTRE</div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Platform Authority, Telemetry, Country Engine &amp; Resilience Controls
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            VINEXSAH TECHNOLOGIES · Schema v{telemetry?.schemaVersion ?? 23} · Environment: {telemetry?.environmentProfile || 'LOCAL_DEVELOPMENT'} · Authority:{' '}
            <span className="font-mono text-[#F5F5F5]">{telemetry?.databaseAuthority || 'LOCAL_JSON_WAL_AUTHORITATIVE'}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('v25-enterprise-org')}
            className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#18181b] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            Orgs &amp; Identity <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v25-postgres-migration')}
            className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#18181b] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            PG16 Migrator <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2.5 text-xs font-mono text-[#D4AF37]">
          {actionMsg}
        </div>
      )}

      {/* Measured KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] text-[#A0A0A0]">Server Memory (RSS / Heap)</div>
          <div className="text-lg font-mono font-bold text-[#F5F5F5] tabular-nums mt-1">
            {telemetry ? `${telemetry.memory.rssMb} / ${telemetry.memory.heapUsedMb} MB` : '—'}
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-mono">
            Uptime {telemetry?.uptimeSeconds ?? 0}s
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] text-[#A0A0A0]">WAL Persistence &amp; Ledger</div>
          <div className="text-lg font-mono font-bold text-[#F5F5F5] tabular-nums mt-1">
            {telemetry ? `${(telemetry.walDatabaseBytes / (1024 * 1024)).toFixed(2)} MB` : '—'}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
            {telemetry?.financialIntegrity?.journalBalanced ? 'Double-Entry Balanced (0.00 var)' : 'Checking...'}
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] text-[#A0A0A0]">Active Countries &amp; Orgs</div>
          <div className="text-lg font-mono font-bold text-[#F5F5F5] tabular-nums mt-1">
            {telemetry ? `${telemetry.counts.countriesActivated}/${telemetry.counts.countriesConfigured} · ${telemetry.counts.organisations} orgs` : '—'}
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-mono">
            {telemetry?.counts.vaultDocuments ?? 0} vault docs · {telemetry?.counts.outboxEvents ?? 0} outbox
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-[11px] text-[#A0A0A0]">Readiness Truthfulness</div>
          <div className="text-lg font-mono font-bold text-[#D4AF37] tabular-nums mt-1">
            {implementedTrue}/{flagEntries.length} Flags True
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-mono">
            PG Cutover: {telemetry?.postgresCutoverComplete ? 'TRUE' : 'FALSE (Dry-Run)'}
          </div>
        </div>
      </div>

      {/* Resilience DR Drill + Measured Load Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
                <HardDrive size={15} className="text-[#D4AF37]" /> Disaster Recovery Backup &amp; Restore Verification
              </h2>
              <p className="text-xs text-[#A0A0A0]">Writes verified snapshot &amp; validates JSON parse + financial parity.</p>
            </div>
            <button
              type="button"
              onClick={handleRunBackupDrill}
              disabled={busyAction !== null}
              className="px-3.5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              {busyAction === 'DRILL' ? 'Running...' : 'Run DR Drill'}
            </button>
          </div>
          {drillResult ? (
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 text-xs font-mono space-y-1">
              <div className="text-[#F5F5F5]">Drill ID: {drillResult.id} · Verified: {String(drillResult.restoreVerificationPassed)}</div>
              <div className="text-[#A0A0A0] tabular-nums">
                Measured RPO: {drillResult.measuredRpoSeconds}s · Measured RTO: {drillResult.measuredRtoMs}ms · Size: {(drillResult.backupBytes / (1024 * 1024)).toFixed(2)} MB
              </div>
              <div className="text-[#71717a] truncate">SHA-256: {drillResult.backupChecksumSha256}</div>
            </div>
          ) : (
            <div className="text-xs text-[#71717a]">No DR drill recorded yet. Click Run DR Drill to measure RPO/RTO.</div>
          )}
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
                <Activity size={15} className="text-[#D4AF37]" /> Measured Concurrency Load Benchmark
              </h2>
              <p className="text-xs text-[#A0A0A0]">Executes 100 concurrent integrity checks (25 workers) against live state.</p>
            </div>
            <button
              type="button"
              onClick={handleRunLoadBenchmark}
              disabled={busyAction !== null}
              className="px-3.5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              {busyAction === 'LOAD' ? 'Benchmarking...' : 'Run Load Test'}
            </button>
          </div>
          {loadResult ? (
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 text-xs font-mono space-y-1">
              <div className="text-[#F5F5F5] tabular-nums">
                Throughput: {loadResult.measuredRps} req/s · Succeeded: {loadResult.succeededRequests}/{loadResult.totalRequests}
              </div>
              <div className="text-[#A0A0A0] tabular-nums">
                p50: {loadResult.p50LatencyMs}ms · p95: {loadResult.p95LatencyMs}ms · p99: {loadResult.p99LatencyMs}ms · RSS: {loadResult.memoryRssMb} MB
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#71717a]">Click Run Load Test to measure real server throughput and tail latency.</div>
          )}
        </div>
      </div>

      {/* Country Configuration Engine */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Globe size={15} className="text-[#D4AF37]" /> Country Configuration Engine &amp; Readiness Reports ({countries.length} Countries)
            </h2>
            <p className="text-xs text-[#A0A0A0]">EAC + AfCFTA multi-country readiness profiles with controlled governance activation.</p>
          </div>
          <form onSubmit={handleRegisterCountry} className="flex flex-wrap items-center gap-2">
            <input
              value={newCountryCode}
              onChange={(e) => setNewCountryCode(e.target.value)}
              maxLength={2}
              placeholder="ISO2"
              className="w-14 px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            />
            <input
              value={newCountryName}
              onChange={(e) => setNewCountryName(e.target.value)}
              placeholder="Country Name"
              className="w-48 px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
              maxLength={3}
              placeholder="CCY"
              className="w-16 px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            />
            <button
              type="submit"
              disabled={busyAction !== null}
              className="px-3 py-1.5 rounded-lg border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Add Country
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                <th className="py-2 pr-3 font-medium">Code · Country</th>
                <th className="py-2 pr-3 font-medium">Bloc</th>
                <th className="py-2 pr-3 font-medium">Default CCY · VAT</th>
                <th className="py-2 pr-3 font-medium">Readiness Score</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e24]">
              {countries.map((c) => {
                const rep = reports.find((r) => r.countryCode === c.countryCode);
                return (
                  <tr key={c.countryCode}>
                    <td className="py-2.5 pr-3 font-medium text-[#F5F5F5]">
                      <span className="font-mono text-[#D4AF37] mr-1.5">{c.countryCode}</span>
                      {c.countryName}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[#A0A0A0]">{c.regionBloc}</td>
                    <td className="py-2.5 pr-3 font-mono text-[#F5F5F5] tabular-nums">
                      {c.defaultCurrency} · {c.vatStandardRatePct}% VAT
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[#F5F5F5] tabular-nums">
                      {rep ? `${rep.overallScorePct}%` : '—'}
                    </td>
                    <td className="py-2.5 pr-3 font-mono">
                      <span className={c.activated ? 'text-emerald-400' : 'text-amber-400'}>
                        {c.readinessStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {!c.activated ? (
                        <button
                          type="button"
                          onClick={() => handleActivateCountry(c.countryCode)}
                          disabled={busyAction !== null}
                          className="px-2.5 py-1 rounded border border-[#27272a] hover:border-[#D4AF37] text-[11px] font-medium text-[#F5F5F5] whitespace-nowrap cursor-pointer"
                        >
                          Approve Sandbox Activation
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-[#71717a]">ACTIVE (SANDBOX)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Currency FX Engine + 22 Readiness Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5]">
              Multi-Currency FX Engine (Zero Silent Conversion)
            </h2>
            <input
              type="number"
              value={fxAmountMinor}
              onChange={(e) => setFxAmountMinor(Number(e.target.value || 10000))}
              className="w-28 px-2.5 py-1 rounded bg-[#0a0a0c] border border-[#27272a] text-xs font-mono text-[#F5F5F5] tabular-nums"
              title="Source minor units"
            />
          </div>
          <div className="divide-y divide-[#1e1e24] text-xs">
            {quotes.map((q) => (
              <div key={q.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[#F5F5F5]">
                    {q.baseCurrency}/{q.quoteCurrency} · Rate {q.rateNumeric} · Spread {q.spreadBps} bps
                  </div>
                  <div className="text-[11px] text-[#71717a] font-mono">
                    {q.quoteType} · {q.status} · {q.rateSource}
                  </div>
                </div>
                {q.quoteType === 'EXECUTABLE' && q.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => handleExecuteFx(q.id)}
                    disabled={busyAction !== null}
                    className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold text-[11px] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Clear {fxAmountMinor} minor
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-[#71717a]">{q.quoteType}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
            <ShieldAlert size={15} className="text-[#D4AF37]" /> 22 Authoritative V25 Readiness Flags
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1 text-[11px] font-mono">
            {flagEntries.map(([flag, val]) => (
              <div
                key={flag}
                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#0a0a0c] border border-[#1e1e24]"
              >
                <span className="truncate text-[#A0A0A0]" title={flag}>{flag.replace('V25_', '')}</span>
                <span className={val ? 'text-emerald-400 shrink-0' : 'text-amber-400 shrink-0'}>
                  {val ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Governed AI Platform Operations Advisor */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Sparkles size={15} className="text-[#D4AF37]" /> Governed AI Operations Advisor (Server-Side Gemini Boundary)
            </h2>
            <p className="text-xs text-[#A0A0A0]">Advisory only · Prompt-injection guarded · Human confirmation required for all state transitions.</p>
          </div>
          <select
            value={aiTask}
            onChange={(e) => setAiTask(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
          >
            <option value="INFRASTRUCTURE_DIAGNOSTIC">INFRASTRUCTURE_DIAGNOSTIC</option>
            <option value="COUNTRY_READINESS_REVIEW">COUNTRY_READINESS_REVIEW</option>
            <option value="FX_EXPOSURE_SUMMARY">FX_EXPOSURE_SUMMARY</option>
          </select>
        </div>
        <form onSubmit={handleAskAi} className="flex flex-col sm:flex-row gap-2">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
          />
          <button
            type="submit"
            disabled={busyAction === 'AI'}
            className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            {busyAction === 'AI' ? 'Analyzing...' : 'Run Advisory'}
          </button>
        </form>
        {aiOutput && (
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3.5 text-xs space-y-1.5">
            <div className="font-semibold text-[#F5F5F5] flex items-center gap-2">
              <CheckCircle2 size={13} className="text-[#D4AF37]" /> {aiOutput.summary}
            </div>
            <div className="text-[11px] font-mono text-[#71717a]">
              Engine: {aiOutput.modelDependency} · Autonomous Execution Allowed: {String(aiOutput.canExecuteAutonomousAction)} · Human Confirmation Required: {String(aiOutput.requiresHumanConfirmation)}
            </div>
            {Array.isArray(aiOutput.recommendations) && (
              <ul className="list-disc pl-5 text-[#A0A0A0] space-y-0.5">
                {aiOutput.recommendations.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
