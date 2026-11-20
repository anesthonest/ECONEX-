/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V19.0 - System Diagnostics, Secret Scan, Verified ZIP Export & Delivery Control Centre (/v19-diagnostics)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Cpu,
  Download,
  FileJson,
  GitBranch,
  HardDrive,
  Lock,
  RefreshCw,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ApiClient } from '../services/apiClient.ts';
import type { V19DiagnosticsSummary, V19ExportManifest } from '../types/index.ts';

interface Props {
  onNavigateTab: (tabId: string) => void;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const V19DiagnosticsControlCenter: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const [summary, setSummary] = useState<V19DiagnosticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [scanningSecrets, setScanningSecrets] = useState<boolean>(false);
  const [secretResult, setSecretResult] = useState<V19ExportManifest['secretScan'] | null>(null);

  const [generatingExport, setGeneratingExport] = useState<boolean>(false);
  const [exportManifest, setExportManifest] = useState<V19ExportManifest | null>(null);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);

  const actor = { userId: currentUser?.id, userRole: role };

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.v19GetDiagnostics(actor);
      setSummary(data);
    } catch (e: any) {
      setError(e?.message || 'Unable to load V19 Diagnostics Control Centre.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'PLATFORM_ADMIN') {
      loadDiagnostics();
    } else {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  const handleSecretScan = async () => {
    try {
      setScanningSecrets(true);
      setError(null);
      const res = await ApiClient.v19RunSecretScan(actor);
      setSecretResult(res);
    } catch (e: any) {
      setError(e?.message || 'Secret scan failed.');
    } finally {
      setScanningSecrets(false);
    }
  };

  const handleGenerateExport = async () => {
    try {
      setGeneratingExport(true);
      setError(null);
      const res = await ApiClient.v19GenerateExport(actor);
      setExportManifest(res);
      setSecretResult(res.secretScan);
      await loadDiagnostics();
    } catch (e: any) {
      setError(e?.message || 'Verified archive generation failed.');
    } finally {
      setGeneratingExport(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      setError(null);
      const blob = await ApiClient.v19FetchDownloadBlob('/api/v19/export/download', actor);
      triggerBlobDownload(blob, 'ECONEX-V19.0-SOURCE.zip');
    } catch (e: any) {
      setError(e?.message || 'ZIP download failed.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadDiagnosticJson = async () => {
    try {
      setDownloadingReport(true);
      setError(null);
      const blob = await ApiClient.v19FetchDownloadBlob('/api/v19/diagnostics/report-download', actor);
      triggerBlobDownload(blob, 'ECONEX-V19-DIAGNOSTIC-REPORT.json');
    } catch (e: any) {
      setError(e?.message || 'Diagnostic report download failed.');
    } finally {
      setDownloadingReport(false);
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
          V19 Platform Diagnostics, Secret Scanning, and Source Archive Export are restricted to authorized{' '}
          <strong className="text-[#F5F5F5]">PLATFORM_ADMIN</strong> operators.
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

  const archiveVerified = Boolean(summary?.exportArchive?.verified || exportManifest?.verification?.verified);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
            <HardDrive size={15} aria-hidden="true" />
            <span>ECONEX V19.0-PLATFORM-STABILITY-AND-DELIVERY</span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Platform Stability, Secret Scan &amp; Verified Export Control Centre
          </h1>
          <p className="text-sm text-[#A0A0A0]">
            Live memory &amp; workspace telemetry, secret-free source ZIP export, Git/GitHub readiness, and honest 6-tier release classification.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSecretScan}
            disabled={scanningSecrets}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] hover:border-[#D4AF37] text-xs sm:text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>{scanningSecrets ? 'Scanning Repo...' : 'Run Secret Scan'}</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateExport}
            disabled={generatingExport}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs sm:text-sm hover:bg-[#e5bf43] flex items-center gap-2 cursor-pointer"
          >
            <Archive size={16} aria-hidden="true" />
            <span>{generatingExport ? 'Building & Verifying ZIP...' : 'Generate & Verify Source ZIP'}</span>
          </button>

          <button
            type="button"
            onClick={loadDiagnostics}
            disabled={loading}
            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] hover:border-[#D4AF37] text-xs sm:text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
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

      {/* Secret Scan Result Banner */}
      {secretResult && (
        <div
          className={`p-4 rounded-xl border text-sm space-y-1 ${
            secretResult.passed
              ? 'bg-[#121212] border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-900 text-red-200'
          }`}
        >
          <div className="font-semibold flex items-center gap-2">
            {secretResult.passed ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>
              Secret Scan {secretResult.passed ? 'PASSED' : 'FAILED'} — {secretResult.filesScanned} source files scanned
            </span>
          </div>
          <div className="text-xs font-mono text-[#C0C0C0]">
            Findings: {secretResult.findings.length} · Forbidden .env files: {secretResult.forbiddenEnvFiles.length} · Scanned: {secretResult.scannedAt}
          </div>
        </div>
      )}

      {/* Verified ZIP Export Banner + Download Controls */}
      {summary && (
        <>
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F5]">
                <Archive size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Verified Source Archive ({summary.exportArchive.archiveName})</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    archiveVerified
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950/60 text-amber-300 border-amber-800'
                  }`}
                >
                  {archiveVerified ? 'VERIFIED' : 'NOT GENERATED'}
                </span>
              </div>
              {archiveVerified ? (
                <div className="text-xs font-mono text-[#A0A0A0] break-all">
                  {(summary.exportArchive.bytes / (1024 * 1024)).toFixed(2)} MB ({summary.exportArchive.bytes.toLocaleString()} bytes) ·{' '}
                  {summary.exportArchive.fileCount} files · SHA-256: {summary.exportArchive.sha256}
                </div>
              ) : (
                <p className="text-xs text-[#A0A0A0]">
                  Click &ldquo;Generate &amp; Verify Source ZIP&rdquo; or run <code className="text-[#D4AF37]">npm run export:zip</code> to build and verify a clean archive.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {archiveVerified && (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Download size={15} aria-hidden="true" />
                  <span>{downloadingZip ? 'Preparing ZIP...' : 'Download Verified ZIP'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadDiagnosticJson}
                disabled={downloadingReport}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] hover:border-[#D4AF37] text-xs sm:text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
              >
                <FileJson size={15} className="text-[#D4AF37]" aria-hidden="true" />
                <span>{downloadingReport ? 'Preparing Report...' : 'Download Diagnostic JSON'}</span>
              </button>
            </div>
          </div>

          {/* 6-Tier Honest Release Milestones */}
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              V19 Honest 6-Tier Release Classification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                {
                  key: 'ENGINEERING_STABLE',
                  val: summary.milestones.ENGINEERING_STABLE,
                  note: 'WAL authoritative, balanced ledger, node_modules & src healthy',
                },
                {
                  key: 'EXPORT_READY',
                  val: summary.milestones.EXPORT_READY,
                  note: 'ECONEX-V19.0-SOURCE.zip built, secret-scanned & unzip -t verified',
                },
                {
                  key: 'GITHUB_READY',
                  val: summary.milestones.GITHUB_READY,
                  note: 'Clean .git repo initialized, .gitignore excludes secrets & DB',
                },
                {
                  key: 'GITHUB_PUBLISHED',
                  val: summary.milestones.GITHUB_PUBLISHED,
                  note: summary.gitRepository.remoteConfigured
                    ? 'Remote present — verify push explicitly'
                    : 'NOT CONFIGURED — requires user GitHub remote & PAT/SSH auth',
                },
                {
                  key: 'DEPLOYMENT_READY',
                  val: summary.milestones.DEPLOYMENT_READY,
                  note: summary.persistence.postgresConfigured
                    ? 'dist/ & DATABASE_URL present'
                    : 'BLOCKED ON EXTERNAL INFRA — DATABASE_URL not provisioned',
                },
                {
                  key: 'PRODUCTION_DEPLOYED',
                  val: summary.milestones.PRODUCTION_DEPLOYED,
                  note: 'External cloud hosting, TLS domain, & licensed financial keys pending',
                },
              ].map((m) => (
                <div key={m.key} className="p-3.5 rounded-xl bg-[#0a0a0c] border border-[#27272a] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[#A0A0A0]">{m.key}</span>
                    <span
                      className={`font-mono font-bold ${
                        m.val ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {m.val ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <p className="text-[#C0C0C0]">{m.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Memory & Workspace Telemetry + Persistence & Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Cpu size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Runtime Memory &amp; Workspace Size</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Server RSS / Heap</div>
                  <div className="font-mono font-bold text-[#F5F5F5] mt-1 tabular-nums">
                    {summary.memory.processRssMb} / {summary.memory.heapUsedMb} MB
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Container RAM Free</div>
                  <div className="font-mono font-bold text-[#F5F5F5] mt-1 tabular-nums">
                    {summary.memory.systemFreeMb} / {summary.memory.systemTotalMb} MB
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Environment / Port</div>
                  <div className="font-mono font-bold text-[#D4AF37] mt-1">
                    {summary.environment} :{summary.port}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">src/ Size</div>
                  <div className="font-mono font-bold text-[#F5F5F5] mt-1 tabular-nums">
                    {summary.workspace.srcSizeMb} MB
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">data/ Size (Pruned)</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                    {summary.workspace.dataSizeMb} MB ({summary.workspace.rollingBackupsCount} backups)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Build dist/index.html</div>
                  <div className={`font-mono font-bold mt-1 ${summary.workspace.distIndexPresent ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {summary.workspace.distIndexPresent ? 'PRESENT' : 'NOT BUILT'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <GitBranch size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Git Repository, DB &amp; Sequential Verification</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Git Status &amp; Branch</div>
                  <div className="font-mono font-bold text-[#F5F5F5] mt-1">
                    {summary.gitRepository.gitInitialized
                      ? `${summary.gitRepository.branch || 'main'} (${summary.gitRepository.latestCommit || 'no-commit'})`
                      : 'NOT INITIALIZED'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">.gitignore Secret Shield</div>
                  <div className={`font-mono font-bold mt-1 ${summary.gitRepository.gitignoreProtected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {summary.gitRepository.gitignoreProtected ? 'PROTECTED' : 'INCOMPLETE'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">DB Authority &amp; Ledger</div>
                  <div className="font-mono font-bold text-emerald-400 mt-1">
                    WAL ({summary.workspace.walFileSizeMb} MB) · {summary.persistence.journalBalanced ? 'BALANCED' : 'UNBALANCED'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="text-[#A0A0A0]">Latest Sequential Report</div>
                  <div className="font-mono font-bold text-[#F5F5F5] mt-1 tabular-nums">
                    {summary.verificationReport.available
                      ? `${summary.verificationReport.overallStatus} (${summary.verificationReport.totalPassed} pass / ${summary.verificationReport.totalFailed} fail)`
                      : 'NOT RUN YET'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs space-y-1.5">
                <div className="font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                  <Terminal size={13} className="text-[#D4AF37]" aria-hidden="true" />
                  <span>GitHub Publication Workflow (Credential-Safe CLI)</span>
                </div>
                <pre className="font-mono text-[11px] text-[#A0A0A0] overflow-x-auto whitespace-pre-wrap">
{`git remote add origin https://github.com/<ORG>/econex.git
git push -u origin main`}
                </pre>
              </div>
            </div>
          </div>

          {/* Warnings & Errors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Active Environment Notices</h2>
              {summary.warnings.length === 0 ? (
                <p className="text-xs text-emerald-400">No workspace warnings detected.</p>
              ) : (
                <ul className="space-y-2 text-xs text-amber-300">
                  {summary.warnings.map((w, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-[#0a0a0c] border border-[#27272a]">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Recent Runtime Errors</h2>
              {summary.recentErrors.length === 0 ? (
                <p className="text-xs text-emerald-400">Zero runtime errors recorded in current session.</p>
              ) : (
                <ul className="space-y-2 text-xs text-red-300 font-mono">
                  {summary.recentErrors.map((err, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] break-all">
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('v18-control-center')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#121212] hover:border-[#D4AF37] text-xs text-[#F5F5F5] cursor-pointer"
            >
              Back to V18 Admin Control Centre
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('tests')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#121212] hover:border-[#D4AF37] text-xs text-[#F5F5F5] cursor-pointer"
            >
              Open System Verification Suite
            </button>
          </div>
        </>
      )}
    </div>
  );
};
