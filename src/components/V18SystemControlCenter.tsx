/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V18.0 - Unified System Administration & Control Centre (/network)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Shield,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  HardDriveDownload,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ApiClient } from '../services/apiClient.ts';
import type { V18AdminControlSummary } from '../types/index.ts';

interface Props {
  onNavigateTab: (tabId: string) => void;
}

export const V18SystemControlCenter: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const [summary, setSummary] = useState<V18AdminControlSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backupResult, setBackupResult] = useState<{
    verified: boolean;
    backupPath: string;
    bytes: number;
    checksumSha256: string;
    collectionsBackedUp: number;
    verifiedAt: string;
  } | null>(null);
  const [verifyingBackup, setVerifyingBackup] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiClient.v18GetAdminControlCenter({
        userId: currentUser?.id,
        userRole: role,
      });
      setSummary(res);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Administrator Control Centre.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'PLATFORM_ADMIN') {
      loadSummary();
    } else {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  const handleVerifyBackup = async () => {
    try {
      setVerifyingBackup(true);
      setError(null);
      const res = await ApiClient.v18VerifyBackup({
        userId: currentUser?.id,
        userRole: role,
      });
      setBackupResult(res);
      await loadSummary();
    } catch (e: any) {
      setError(e?.message || 'Backup verification failed.');
    } finally {
      setVerifyingBackup(false);
    }
  };

  if (role !== 'PLATFORM_ADMIN') {
    return (
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
          <Lock size={22} aria-hidden="true" />
        </div>
        <h1 className="text-lg font-display font-bold text-[#F5F5F5]">
          Administrator Access Required
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          The ECONEX Admin Control Centre is restricted to authorized PLATFORM_ADMIN operators.
          Your current role (<strong className="text-[#F5F5F5]">{role}</strong>) does not permit access to system infrastructure queues.
        </p>
        <button
          type="button"
          onClick={() => onNavigateTab('home')}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
            <Shield size={15} aria-hidden="true" />
            <span>ECONEX V18.0-COMPLETE-PLATFORM-CONSOLIDATION</span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Unified System Administration &amp; Control Centre
          </h1>
          <p className="text-sm text-[#A0A0A0]">
            Real-time operational metrics, JSON WAL authority &amp; DR verification, operational queues, and honest 3-state release readiness.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleVerifyBackup}
            disabled={verifyingBackup}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm hover:bg-[#e5bf43] flex items-center gap-2 cursor-pointer"
          >
            <HardDriveDownload size={16} aria-hidden="true" />
            <span>{verifyingBackup ? 'Verifying Backup...' : 'Run Backup & SHA-256 Verify'}</span>
          </button>
          <button
            type="button"
            onClick={loadSummary}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-sm text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900 text-sm text-red-200 flex items-center gap-2">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {backupResult && (
        <div className="p-4 rounded-xl bg-[#121212] border border-emerald-800 text-sm space-y-1">
          <div className="font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Backup &amp; SHA-256 Integrity Verified</span>
          </div>
          <div className="text-xs text-[#C0C0C0] font-mono break-all">
            File: {backupResult.backupPath} · Bytes: {backupResult.bytes.toLocaleString()} · Collections: {backupResult.collectionsBackedUp} · SHA-256: {backupResult.checksumSha256}
          </div>
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-1">
              <div className="text-xs text-[#A0A0A0]">ENGINEERING_COMPLETE</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {String(summary.statuses.ENGINEERING_COMPLETE).toUpperCase()}
              </div>
              <p className="text-xs text-[#A0A0A0]">
                Unified shell, V1–V18 APIs, Schema {summary.schemaVersion}, double-entry ledger parity.
              </p>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-1">
              <div className="text-xs text-[#A0A0A0]">PRODUCTION_READY</div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {String(summary.statuses.PRODUCTION_READY).toUpperCase()}
              </div>
              <p className="text-xs text-[#A0A0A0]">
                Gates: {summary.gatesSummary.v17ProductionReadyCount}/{summary.gatesSummary.totalGates} ready · {summary.gatesSummary.externalBlockedCount} blocked on external infra/licences.
              </p>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-1">
              <div className="text-xs text-[#A0A0A0]">LIVE_PILOT_OPERATIONAL</div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {String(summary.statuses.LIVE_PILOT_OPERATIONAL).toUpperCase()}
              </div>
              <p className="text-xs text-[#A0A0A0]">
                Awaiting live PostgreSQL 16 cutover, licensed PSP credentials &amp; regulatory clearances.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Database size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Database Authority &amp; Backup Status</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Authority Mode</div>
                  <div className="font-mono text-[#F5F5F5] font-semibold mt-1">
                    {summary.database.authorityMode}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">WAL Size / Uptime</div>
                  <div className="font-mono text-[#F5F5F5] font-semibold mt-1 tabular-nums">
                    {(summary.database.walFileSizeBytes / (1024 * 1024)).toFixed(2)} MB · {summary.serverUptimeSeconds}s
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">PostgreSQL 16 Live</div>
                  <div className="font-mono text-amber-400 font-semibold mt-1">
                    {summary.database.postgresConnected ? 'CONNECTED' : 'NOT_PROVISIONED'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Canonical Rollbacks</div>
                  <div className="font-mono text-emerald-400 font-semibold mt-1">
                    V14:{summary.database.v14BackupValid ? 'OK' : 'NO'} · V15:{summary.database.v15BackupValid ? 'OK' : 'NO'} · V16:{summary.database.v16BackupValid ? 'OK' : 'NO'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F5F5]">
                Financial Ledger &amp; Control Consoles
              </h2>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Double-Entry</div>
                  <div className={`font-mono font-bold mt-1 ${summary.ledger.journalBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
                    {summary.ledger.journalBalanced ? 'BALANCED' : 'IMBALANCED'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Journal Entries</div>
                  <div className="font-mono text-[#F5F5F5] font-bold mt-1 tabular-nums">
                    {summary.ledger.totalJournalEntries}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Suspense Bal</div>
                  <div className="font-mono text-[#F5F5F5] font-bold mt-1 tabular-nums">
                    {summary.ledger.suspenseAccountBalance.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { tab: 'v19-diagnostics', label: 'V19 Diagnostics & Export' },
                  { tab: 'v17-control-center', label: 'V17 Network Ops' },
                  { tab: 'v16-control-center', label: 'V16 Infra & Pilot' },
                  { tab: 'global-operations', label: 'V15 Support Triage' },
                  { tab: 'accounting-ledger', label: 'General Ledger' },
                  { tab: 'compliance', label: 'Compliance & Security' },
                  { tab: 'tests', label: 'Verification Suite' },
                ].map((link) => (
                  <button
                    key={link.tab}
                    type="button"
                    onClick={() => onNavigateTab(link.tab)}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-xs text-[#F5F5F5] hover:border-[#D4AF37] flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{link.label}</span>
                    <ArrowUpRight size={13} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              Operational Review Queues
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Verifications', count: summary.queues.pendingVerifications, tab: 'v17-control-center' },
                { label: 'Disputes', count: summary.queues.openDisputes, tab: 'v17-control-center' },
                { label: 'Support Cases', count: summary.queues.openSupportCases, tab: 'global-operations' },
                { label: 'Offline Sync', count: summary.queues.offlineSyncItems, tab: 'v17-control-center' },
                { label: 'Security Incidents', count: summary.queues.openSecurityIncidents, tab: 'compliance' },
                { label: 'Ops Incidents', count: summary.queues.openOperationalIncidents, tab: 'operations' },
                { label: 'Dead-Letter Q', count: summary.queues.deadLetterEvents, tab: 'events' },
              ].map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => onNavigateTab(q.tab)}
                  className="min-h-[84px] p-3.5 rounded-xl bg-[#0a0a0c] border border-[#27272a] hover:border-[#D4AF37] text-left flex flex-col justify-between cursor-pointer"
                >
                  <span className="text-xs text-[#A0A0A0]">{q.label}</span>
                  <span className="text-2xl font-bold font-mono text-[#D4AF37] tabular-nums">
                    {q.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
