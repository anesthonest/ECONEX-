/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V30.0 - Guarded Financial AI Telemetry, Resilience Repair Register, GitHub Diagnostics & Integrations Console
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, BrainCircuit, CheckCircle2, Code2, Plug, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

export type V30DevSubTab = 'AI' | 'RESILIENCE' | 'GITHUB' | 'INTEGRATIONS';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: V30DevSubTab;
}

export const V30DeveloperGitHubIntegrationsView: React.FC<Props> = ({ initialSubTab = 'GITHUB' }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || 'usr_admin_01', userRole: role };

  const [subTab, setSubTab] = useState<V30DevSubTab>(initialSubTab);
  const [gitDiag, setGitDiag] = useState<any>(null);
  const [aiTelemetry, setAiTelemetry] = useState<any>(null);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [prompt, setPrompt] = useState<string>('Compare lowest-cost sandbox payout rails for a Mbale coffee cooperative');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gRes, tRes, repRes, rRes] = await Promise.all([
        ApiClient.v30GetGitHubDiagnostics(),
        ApiClient.v30GetAiTelemetry(actor),
        ApiClient.v30GetRepairRegister(actor),
        ApiClient.v30GetReadinessMatrix(),
      ]);
      setGitDiag(gRes);
      setAiTelemetry(tRes);
      setRepairs(repRes?.repairs || []);
      setReadiness(rRes);
    } catch (e: any) {
      setError(e?.message || 'Unable to load developer diagnostics.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRunAi = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v30RunAiAdvisor(
        { domainTask: 'ROUTING_COST_ANALYSIS', prompt, countryCode: 'UG' },
        actor
      );
      if (res?.error) throw new Error(res.error);
      setAiResponse(res);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'AI Advisor blocked or failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              Engineering, AI Quota Resilience &amp; Git Diagnostics
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1">
              Platform Resilience, GitHub Diagnostics &amp; Integrations
            </h1>
          </div>
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="min-h-[40px] px-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(
            [
              ['GITHUB', 'Git & GitHub Diagnostics', Code2],
              ['AI', 'AI Advisor & 429 Telemetry', BrainCircuit],
              ['RESILIENCE', 'Repair Register & Honesty Matrix', Activity],
              ['INTEGRATIONS', 'OpenAPI & Sandbox Webhooks', Plug],
            ] as const
          ).map(([id, lbl, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs border flex items-center gap-2 cursor-pointer ${
                subTab === id
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-[#050505] font-semibold'
                  : 'bg-[#181818] border-[#27272a] text-[#C0C0C0] hover:border-[#D4AF37]'
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{lbl}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div role="alert" className="p-3 rounded-xl bg-red-950/40 border border-red-700/60 text-xs text-red-200">{error}</div>}

      {/* GITHUB DIAGNOSTICS */}
      {subTab === 'GITHUB' && gitDiag && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(gitDiag.flags || {}).map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-[#121212] border border-[#27272a] text-xs">
                <div className="text-[11px] font-mono text-[#A0A0A0] break-all">{k}</div>
                <div className={`text-sm font-bold font-mono mt-1 ${v ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {String(v)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272a] text-xs space-y-2">
            <div className="text-sm font-semibold text-[#F5F5F5]">Local Repository State</div>
            <div className="text-[#C0C0C0] font-mono">
              Branch: {gitDiag.repository?.branch} · HEAD: {gitDiag.repository?.headCommit} ({gitDiag.repository?.headSubject}) · Commits: {gitDiag.repository?.commitCount}
            </div>
            <div className="text-[#A0A0A0]">
              .gitignore Complete: {String(gitDiag.hygiene?.gitignoreComplete)} · Tracked Sensitive Files: {gitDiag.hygiene?.trackedSensitiveOrBloatFiles?.length || 0} · V29 Backup Preserved: {String(gitDiag.archives?.v29BackupArchivePreserved)}
            </div>
            <ul className="list-disc pl-5 text-[#A0A0A0] space-y-1 pt-2">
              {gitDiag.recoveryInstructions?.map((line: string, i: number) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI ADVISOR & 429 TELEMETRY */}
      {subTab === 'AI' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Guarded Financial Intelligence Advisor</h2>
            <p className="text-xs text-[#A0A0A0]">
              Protected against Gemini 429 exhaustion (shared cooldown + SHA-256 deduplication + bounded non-sensitive cache) and blocks autonomous execution commands.
            </p>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleRunAi}
              className="min-h-[44px] px-5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Run Guarded Financial Guidance
            </button>
            {aiResponse && (
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-1.5">
                <div className="font-mono text-[#D4AF37]">Outcome: {aiResponse.outcome} · Fallback Used: {String(aiResponse.usedFallback)} · Human Approval Required: {String(aiResponse.humanApprovalRequired)}</div>
                <pre className="whitespace-pre-wrap text-[#F5F5F5] font-sans">{aiResponse.advisoryText}</pre>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Gemini Resilience &amp; Cooldown Telemetry</h2>
            {aiTelemetry?.telemetry && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs tabular-nums">
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#27272a]">Cooldown Active: <strong className="text-[#D4AF37]">{String(aiTelemetry.telemetry.cooldownActive)}</strong></div>
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#27272a]">Quota 429 Hits: <strong>{aiTelemetry.telemetry.quota429Count}</strong></div>
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#27272a]">Cache Hits: <strong>{aiTelemetry.telemetry.cacheHits}</strong></div>
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#27272a]">Dedup Hits: <strong>{aiTelemetry.telemetry.dedupHits}</strong></div>
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#27272a]">Cooldown Fallbacks: <strong>{aiTelemetry.telemetry.cooldownFallbacks}</strong></div>
                <div className="p-2.5 rounded-lg bg-[#181818] border border-[#27272a]">Cache Size: <strong>{aiTelemetry.telemetry.cacheSize}</strong></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPAIR REGISTER & 34-POINT MATRIX */}
      {subTab === 'RESILIENCE' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Verified Engineering Repair Register ({repairs.length})</h2>
            <div className="space-y-2.5">
              {repairs.map((r) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#D4AF37]">{r.id} · {r.area}</span>
                    <span className="text-emerald-400">{r.verificationStatus}</span>
                  </div>
                  <div className="text-[#F5F5F5]">{r.symptom}</div>
                  <div className="text-[#A0A0A0]">Fix: {r.fixApplied}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-2">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Honest Final Release Readiness Matrix</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(readiness?.rows || []).map((row: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[#F5F5F5] font-medium">{row.item}</div>
                    <div className="text-[11px] text-[#A0A0A0]">{row.evidence}</div>
                  </div>
                  <span className={`font-mono text-[11px] shrink-0 ${row.status === 'COMPLETE' ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATIONS & OPENAPI */}
      {subTab === 'INTEGRATIONS' && (
        <div className="p-5 rounded-2xl bg-[#121212] border border-[#27272a] space-y-3 text-xs">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <CheckCircle2 size={16} aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#F5F5F5]">OpenAPI 3.1 &amp; Sandbox Provider Adapters</h2>
          </div>
          <p className="text-[#C0C0C0]">
            OpenAPI 3.1 Specification is served live at <code className="text-[#D4AF37]">/api/v30/openapi.json</code> and HMAC-SHA256 webhook verification runs at <code className="text-[#D4AF37]">/api/v30/webhooks/hmac-verify</code>. All bank, MoMo, card scheme, and remittance connectors remain explicitly isolated in sandbox mode (`EXTERNAL_INTEGRATIONS_LIVE=false`).
          </p>
        </div>
      )}
    </div>
  );
};
