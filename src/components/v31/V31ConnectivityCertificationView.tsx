/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V31.0 — Provider Certification Harness, Credential Metadata & Health Telemetry
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { Plug, ShieldAlert, Play, KeyRound, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: 'CERTIFICATION' | 'CREDENTIALS';
}

export const V31ConnectivityCertificationView: React.FC<Props> = ({
  onNavigate,
  initialSubTab = 'CERTIFICATION',
}) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role };
  const [subTab, setSubTab] = useState<'CERTIFICATION' | 'CREDENTIALS'>(initialSubTab);
  const [runs, setRuns] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [healthHistory, setHealthHistory] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = async () => {
    try {
      const res = await api.v31GetProviderCertifications();
      setRuns(res.runs || []);
      setCredentials(res.credentials || []);
      setHealthHistory(res.healthHistory || []);
    } catch (e: any) {
      setNotice(e?.message || 'Failed to load provider certification registry.');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role]);

  const handleCertify = async (providerId: string) => {
    setBusyId(providerId);
    setNotice(null);
    try {
      const updated = await api.v31RunProviderCertHarness(providerId, actor);
      setNotice(`${updated.providerCode}: 6-point certification suite passed ${updated.passRatePct}% (${updated.avgMeasuredLatencyMs} ms avg latency). Stage=${updated.currentStage}.`);
      await loadData();
    } catch (e: any) {
      setNotice(e?.message || 'Certification harness execution blocked or failed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAttemptLivePromote = async (providerId: string) => {
    setBusyId(`live-${providerId}`);
    setNotice(null);
    try {
      await api.v31AdvanceProviderCertStage(providerId, 'LIVE_VERIFIED', actor);
    } catch (e: any) {
      setNotice(`Fail-Closed Guard Triggered: ${e?.message || 'LIVE_VERIFIED blocked without credentials and regulatory approval.'}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRotateCred = async (credId: string) => {
    setBusyId(credId);
    setNotice(null);
    try {
      const updated = await api.v31RotateCredentialMetadata(credId, 90, actor);
      setNotice(`Rotated metadata fingerprint for ${updated.providerCode}: ${updated.redactedFingerprint}`);
      await loadData();
    } catch (e: any) {
      setNotice(e?.message || 'Credential rotation failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
            <Plug className="w-4 h-4" />
            <span>ECONEX V31.0 · EXTERNAL FINANCIAL CONNECTIVITY &amp; CERTIFICATION HARNESS</span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            9-Stage Provider Certification Pipeline &amp; Credential Governance
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            External live rails: <span className="font-mono text-amber-300">BLOCKED FAIL-CLOSED (EXTERNAL_INTEGRATIONS_LIVE = FALSE)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#141418] text-xs text-[#F5F5F5] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v31-infrastructure-hub')}
            className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#141418] border border-[#27272a] text-xs text-[#D4AF37] cursor-pointer"
          >
            Infrastructure Hub
          </button>
        </div>
      </header>

      {notice && (
        <div className="bg-[#121216] border border-[#D4AF37]/40 rounded-lg px-4 py-3 text-xs font-mono text-[#F5F5F5]">
          {notice}
        </div>
      )}

      <div className="flex gap-2 border-b border-[#27272a] pb-3">
        <button
          type="button"
          onClick={() => setSubTab('CERTIFICATION')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
            subTab === 'CERTIFICATION'
              ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
              : 'bg-[#0d0d10] text-[#A0A0A0] border-[#27272a]'
          }`}
        >
          Provider Certification Matrix ({runs.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('CREDENTIALS')}
          className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
            subTab === 'CREDENTIALS'
              ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
              : 'bg-[#0d0d10] text-[#A0A0A0] border-[#27272a]'
          }`}
        >
          Credentials Metadata &amp; Health History ({credentials.length})
        </button>
      </div>

      {subTab === 'CERTIFICATION' ? (
        <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                <tr>
                  <th className="py-2.5 px-4">Provider</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4 text-right">Pass Rate</th>
                  <th className="py-2.5 px-4 text-right">Avg Latency</th>
                  <th className="py-2.5 px-4">Live Verified</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#F5F5F5]">{r.providerName}</div>
                      <div className="text-[11px] text-[#A0A0A0]">{r.providerCode}</div>
                    </td>
                    <td className="py-2.5 px-4 text-[#D4AF37]">{r.currentStage}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">{r.passRatePct}%</td>
                    <td className="py-2.5 px-4 text-right">{r.avgMeasuredLatencyMs} ms</td>
                    <td className="py-2.5 px-4 text-amber-300">{r.liveVerified ? 'TRUE' : 'FALSE (SANDBOX)'}</td>
                    <td className="py-2.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        disabled={busyId === r.providerId}
                        onClick={() => handleCertify(r.providerId)}
                        className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        Run 6-Point Suite
                      </button>
                      <button
                        type="button"
                        disabled={busyId === `live-${r.providerId}`}
                        onClick={() => handleAttemptLivePromote(r.providerId)}
                        className="px-2.5 py-1 rounded border border-[#27272a] bg-[#141418] text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        Test Live Gate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              REDACTED CREDENTIAL METADATA REGISTRY (ZERO RAW SECRETS STORED)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Provider</th>
                    <th className="py-2.5 px-4">Auth Scheme</th>
                    <th className="py-2.5 px-4">Env Ref Key</th>
                    <th className="py-2.5 px-4">Fingerprint</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono">
                  {credentials.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{c.providerCode}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{c.authScheme}</td>
                      <td className="py-2.5 px-4 text-[#D4AF37]">{c.secretReferenceKey}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{c.redactedFingerprint}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRotateCred(c.id)}
                          className="px-2.5 py-1 rounded border border-[#27272a] bg-[#141418] text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
                        >
                          Rotate Metadata
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <Activity className="w-4 h-4" />
              MEASURED SANDBOX HEALTH HISTORY (LAST {Math.min(15, healthHistory.length)})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Provider</th>
                    <th className="py-2.5 px-4">Probe</th>
                    <th className="py-2.5 px-4 text-right">Latency</th>
                    <th className="py-2.5 px-4">Breaker</th>
                    <th className="py-2.5 px-4">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                  {healthHistory.slice(0, 15).map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{h.providerCode}</td>
                      <td className="py-2.5 px-4 text-emerald-400">{h.probeStatus}</td>
                      <td className="py-2.5 px-4 text-right">{h.measuredLatencyMs} ms</td>
                      <td className="py-2.5 px-4">{h.circuitBreakerState}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{h.measuredNote}</td>
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
