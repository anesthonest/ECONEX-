/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V26.0 - Reports Export Center (Real CSV/JSON/PDF Downloads) & Document Vault Sharing
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Link2,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate?: (tabId: string) => void;
}

const REPORT_TYPES = [
  { value: 'AUDIT_SUMMARY', label: 'Interactive Control Audit Summary' },
  { value: 'ORDERS_LEDGER', label: 'Commercial Orders Ledger' },
  { value: 'WALLET_STATEMENT', label: 'V23 Wallet Transaction Statement' },
  { value: 'ROUTE_INVENTORY', label: 'Role-Scoped UI Route Inventory' },
  { value: 'WORKFLOW_PIPELINE', label: 'Connected E2E Commerce Pipelines' },
];

export const V26DocumentsReportsVaultView: React.FC<Props> = () => {
  const { currentUser, role } = useAuth();
  const { activeWorkspaceId, activeCountry } = useExperience();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [reports, setReports] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);

  const [reportType, setReportType] = useState('AUDIT_SUMMARY');
  const [reportFormat, setReportFormat] = useState<'CSV' | 'JSON' | 'PDF'>('CSV');
  const [generating, setGenerating] = useState(false);

  const [shareDocId, setShareDocId] = useState('');
  const [sharePerm, setSharePerm] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
  const [shareTtl, setShareTtl] = useState(24);
  const [creatingShare, setCreatingShare] = useState(false);
  const [latestShareToken, setLatestShareToken] = useState<string | null>(null);
  const [verifiedTokenMeta, setVerifiedTokenMeta] = useState<any>(null);

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [repRes, docRes] = await Promise.all([
        ApiClient.v26GetReports(actor).catch(() => []),
        ApiClient.v26GetDocuments(actor).catch(() => ({ documents: [], shares: [] })),
      ]);
      setReports(Array.isArray(repRes) ? repRes : []);
      const docs = Array.isArray(docRes?.documents) ? docRes.documents : [];
      setDocuments(docs);
      setShares(Array.isArray(docRes?.shares) ? docRes.shares : []);
      if (docs.length > 0 && !shareDocId) {
        setShareDocId(docs[0].id);
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to load reports and document vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeWorkspaceId]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setFeedback(null);
    try {
      const rep = await ApiClient.v26GenerateReport({ reportType, format: reportFormat }, actor);
      setFeedback(`Generated ${rep.format} report ${rep.id} (${rep.bytes} bytes, SHA-256 ${rep.contentSha256?.slice(0, 12)}...).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    setError(null);
    try {
      const { blob, filename, sha256 } = await ApiClient.v26DownloadReportBlob(reportId, actor);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback(`Downloaded ${filename}${sha256 ? ` (X-Content-SHA256: ${sha256.slice(0, 14)}...)` : ''}.`);
    } catch (e: any) {
      setError(e?.message || 'Download failed.');
    }
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareDocId) return;
    setCreatingShare(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v26ShareDocument(
        { documentId: shareDocId, permission: sharePerm, ttlHours: Number(shareTtl) || 24 },
        actor
      );
      setLatestShareToken(res.shareToken || null);
      setVerifiedTokenMeta(null);
      setFeedback(`Created expiring share link (${sharePerm}, ${shareTtl}h TTL).`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to share document.');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleVerifyShareToken = async (token: string) => {
    setError(null);
    try {
      const meta = await ApiClient.v26ResolveDocumentShare(token);
      setVerifiedTokenMeta(meta);
      setFeedback(`Verified share token resolves document "${meta.title}" (${meta.permission}).`);
    } catch (e: any) {
      setVerifiedTokenMeta(null);
      setError(e?.message || 'Share token verification failed.');
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    setError(null);
    try {
      await ApiClient.v26RevokeDocumentShare(shareId, actor);
      setFeedback(`Share link ${shareId} revoked immediately.`);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Unable to revoke share link.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#D4AF37]">ECONEX V26.0 · REPORTS &amp; VAULT</div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
            Reports Export Center &amp; Document Vault Sharing
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Generate verifiable CSV, JSON, and valid PDF exports with SHA-256 digests, and manage expiring commercial document share tokens.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer self-start"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-sm text-red-200 flex items-center gap-2">
          <ShieldAlert size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800 text-sm text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generator & Downloads */}
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
            <FileText size={17} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Generate Real Downloadable Report</span>
          </h2>

          <form onSubmit={handleGenerateReport} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="v26-rpt-type" className="block text-xs text-[#C0C0C0] mb-1">Dataset</label>
              <select
                id="v26-rpt-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {REPORT_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="v26-rpt-fmt" className="block text-xs text-[#C0C0C0] mb-1">Format</label>
              <select
                id="v26-rpt-fmt"
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as 'CSV' | 'JSON' | 'PDF')}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="CSV">CSV (.csv)</option>
                <option value="JSON">JSON (.json)</option>
                <option value="PDF">PDF (.pdf)</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={generating}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold text-sm cursor-pointer disabled:opacity-50"
              >
                {generating ? 'Generating Report...' : 'Generate Report Artifact'}
              </button>
            </div>
          </form>

          <div className="space-y-2.5 pt-2 border-t border-[#27272a] max-h-[360px] overflow-y-auto">
            {reports.length === 0 ? (
              <p className="text-sm text-[#A0A0A0]">No report exports generated yet.</p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#F5F5F5] truncate">
                      {r.reportType} ({r.format})
                    </div>
                    <div className="text-xs text-[#A0A0A0] font-mono tabular-nums truncate">
                      {r.id} · {r.rowCount} rows · {r.bytes} bytes
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadReport(r.id)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#121212] border border-[#D4AF37]/60 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Download size={14} aria-hidden="true" />
                    <span>Download</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Document Vault & Expiring Share Links */}
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
            <Link2 size={17} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Controlled Document Share Links</span>
          </h2>

          {documents.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">
              No accessible vault or commercial documents found for your current workspace.
            </p>
          ) : (
            <form onSubmit={handleCreateShare} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label htmlFor="v26-share-doc" className="block text-xs text-[#C0C0C0] mb-1">Select Document</label>
                <select
                  id="v26-share-doc"
                  value={shareDocId}
                  onChange={(e) => setShareDocId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.source})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="v26-share-perm" className="block text-xs text-[#C0C0C0] mb-1">Permission</label>
                <select
                  id="v26-share-perm"
                  value={sharePerm}
                  onChange={(e) => setSharePerm(e.target.value as 'VIEW' | 'DOWNLOAD')}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  <option value="VIEW">VIEW ONLY</option>
                  <option value="DOWNLOAD">DOWNLOAD</option>
                </select>
              </div>
              <div>
                <label htmlFor="v26-share-ttl" className="block text-xs text-[#C0C0C0] mb-1">TTL (Hours)</label>
                <input
                  id="v26-share-ttl"
                  type="number"
                  min={1}
                  max={720}
                  value={shareTtl}
                  onChange={(e) => setShareTtl(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] tabular-nums"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creatingShare}
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer disabled:opacity-50"
                >
                  {creatingShare ? 'Creating...' : 'Create Share Link'}
                </button>
              </div>
            </form>
          )}

          {latestShareToken && (
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#D4AF37]/60 space-y-2 text-xs">
              <div className="text-[#D4AF37] font-semibold">Latest Expiring Share Token</div>
              <div className="font-mono text-[#F5F5F5] break-all">{latestShareToken}</div>
              <button
                type="button"
                onClick={() => handleVerifyShareToken(latestShareToken)}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] cursor-pointer"
              >
                Verify Token Access Now
              </button>
              {verifiedTokenMeta && (
                <div className="text-emerald-400">
                  Resolved: {verifiedTokenMeta.title} · Expires {new Date(verifiedTokenMeta.expiresAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2.5 pt-2 border-t border-[#27272a] max-h-[260px] overflow-y-auto">
            {shares.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-mono text-[#F5F5F5] truncate">
                    {s.id} · Doc {s.documentId} · {s.permission}
                  </div>
                  <div className="text-[#A0A0A0]">
                    Status: {s.revoked ? 'REVOKED' : `ACTIVE (expires ${new Date(s.expiresAt).toLocaleDateString()})`}
                  </div>
                </div>
                {!s.revoked && (
                  <button
                    type="button"
                    onClick={() => handleRevokeShare(s.id)}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-[#121212] border border-red-800/70 text-red-300 hover:bg-red-950/40 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
