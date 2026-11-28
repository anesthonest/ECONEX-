/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V31.0 — Uganda Pilot Readiness, Production Security & Country-Aware Intelligence View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { MapPin, Shield, BrainCircuit, TrendingUp, Lock, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: 'PILOT' | 'FIELD' | 'SECURITY' | 'INTELLIGENCE' | 'AI';
}

export const V31PilotSecurityIntelligenceView: React.FC<Props> = ({
  onNavigate,
  initialSubTab = 'PILOT',
}) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role };
  const [subTab, setSubTab] = useState<'PILOT' | 'FIELD' | 'SECURITY' | 'INTELLIGENCE' | 'AI'>(initialSubTab);
  const [pilotData, setPilotData] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState('Assess cross-border settlement VAT and USSD offline readiness for smallholder coffee cooperatives.');
  const [aiCountry, setAiCountry] = useState('UG');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = async () => {
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        api.v31GetPilotOverview(),
        api.v31GetSecurityOverview(actor),
        api.v31GetContinentalAnalytics(),
      ]);
      setPilotData(pRes);
      setSecurityData(sRes);
      setAnalytics(aRes);
    } catch (e: any) {
      setNotice(e?.message || 'Unable to load pilot/security telemetry.');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role]);

  const handleTestBlockedLivePilot = async () => {
    setNotice(null);
    try {
      await api.v31AdvancePilotStage({ targetStageNumber: 7 }, actor);
    } catch (e: any) {
      setNotice(`Fail-Closed Guard Verified: ${e?.message || 'Stage 7 blocked without regulatory sign-off.'}`);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setNotice(null);
    try {
      await api.v31RevokeSession(sessionId, actor);
      setNotice(`Session ${sessionId} revoked immediately.`);
      await loadData();
    } catch (e: any) {
      setNotice(e?.message || 'Session revocation failed.');
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiBusy(true);
    setNotice(null);
    try {
      const res = await api.v31RunCountryAiAdvisor({ prompt: aiPrompt, countryCode: aiCountry }, actor);
      setAiResponse(res);
    } catch (err: any) {
      setNotice(`AI Guardrail Triggered: ${err?.message || 'Request blocked.'}`);
    } finally {
      setAiBusy(false);
    }
  };

  const program = pilotData?.programs?.[0];

  return (
    <div className="space-y-5">
      <header className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
            <MapPin className="w-4 h-4" />
            <span>ECONEX V31.0 · PILOT READINESS, SECURITY CONTINUITY &amp; COUNTRY AI</span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Uganda 9-Stage Pilot Prep, Session Revocation &amp; k-Anonymous Intelligence
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            PILOT_ACTIVE: <span className="font-mono text-amber-300">FALSE</span> · k-Anonymity Floor: <span className="font-mono text-emerald-400">k &gt;= 3</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('v31-country-framework')}
          className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#141418] text-xs text-[#D4AF37] cursor-pointer"
        >
          Country Profiles
        </button>
      </header>

      {notice && (
        <div className="bg-[#121216] border border-[#D4AF37]/40 rounded-lg px-4 py-3 text-xs font-mono text-[#F5F5F5]">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3">
        {[
          { id: 'PILOT' as const, label: 'Uganda 9-Stage Pilot' },
          { id: 'FIELD' as const, label: `Field Validations & Incidents (${pilotData?.fieldValidations?.length || 0})` },
          { id: 'SECURITY' as const, label: `Security & Session Kill (${securityData?.securityIncidents?.length || 0})` },
          { id: 'INTELLIGENCE' as const, label: `Continental Analytics (${analytics?.snapshots?.length || 0})` },
          { id: 'AI' as const, label: 'Country-Aware AI Advisor' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
              subTab === t.id
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#0d0d10] text-[#A0A0A0] border-[#27272a]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'PILOT' && program && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-[#D4AF37]">{program.programCode} · {program.targetDistricts?.join(', ')}</div>
              <h2 className="text-sm font-semibold text-[#F5F5F5] mt-1">{program.title}</h2>
            </div>
            <button
              type="button"
              onClick={handleTestBlockedLivePilot}
              className="min-h-[38px] px-3.5 py-2 rounded-lg border border-amber-500/40 bg-amber-950/20 text-xs text-amber-300 font-mono cursor-pointer"
            >
              Verify Stage 7 Live-Gate Block
            </button>
          </div>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                <tr>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4">Title</th>
                  <th className="py-2.5 px-4">Acceptance Gate</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] font-mono">
                {(program.stageGates || []).map((g: any) => (
                  <tr key={g.stageNumber}>
                    <td className="py-2.5 px-4 font-bold text-[#F5F5F5]">Stage {g.stageNumber}</td>
                    <td className="py-2.5 px-4 text-[#F5F5F5]">{g.title}</td>
                    <td className="py-2.5 px-4 text-[#A0A0A0]">{g.acceptanceCriteria}</td>
                    <td className={`py-2.5 px-4 ${g.status === 'READY_INTERNAL' ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {g.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'FIELD' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37]">
              FIELD VALIDATION EVIDENCE &amp; PILOT INCIDENTS
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">District</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Summary</th>
                    <th className="py-2.5 px-4">Outcome</th>
                    <th className="py-2.5 px-4">Human Signoff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono">
                  {(pilotData?.fieldValidations || []).map((fv: any) => (
                    <tr key={fv.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{fv.district}</td>
                      <td className="py-2.5 px-4 text-[#D4AF37]">{fv.validationType}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{fv.evidenceSummary}</td>
                      <td className="py-2.5 px-4 text-sky-400">{fv.validationOutcome}</td>
                      <td className="py-2.5 px-4 text-amber-300">{fv.humanFieldSignoffCompleted ? 'COMPLETE' : 'FALSE (SANDBOX)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'SECURITY' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <Shield className="w-4 h-4" />
              SECURITY INCIDENT REGISTER &amp; SESSION REVOCATION (MFA ENROLLED: {securityData?.mfaEnrolledCount ?? 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Ref</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Severity</th>
                    <th className="py-2.5 px-4">Containment</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono">
                  {(securityData?.securityIncidents || []).map((inc: any) => (
                    <tr key={inc.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{inc.incidentRef}</td>
                      <td className="py-2.5 px-4 text-[#D4AF37]">{inc.category}</td>
                      <td className="py-2.5 px-4">{inc.severity}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{inc.containmentAction}</td>
                      <td className="py-2.5 px-4 text-emerald-400">{inc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              SESSIONS ({securityData?.activeSessions?.length || 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Session ID</th>
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono">
                  {(securityData?.activeSessions || []).map((s: any) => (
                    <tr key={s.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{s.id}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{s.userId}</td>
                      <td className={`py-2.5 px-4 ${s.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>{s.status}</td>
                      <td className="py-2.5 px-4 text-right">
                        {s.status === 'ACTIVE' && (
                          <button type="button" onClick={() => handleRevokeSession(s.id)} className="px-2.5 py-1 rounded border border-red-500/40 text-red-300 cursor-pointer">
                            Kill Session
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'INTELLIGENCE' && (
        <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            K-ANONYMOUS CONTINENTAL ANALYTICS (K &gt;= 3 ENFORCED)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                <tr>
                  <th className="py-2.5 px-4">Country / Corridor</th>
                  <th className="py-2.5 px-4">Sector</th>
                  <th className="py-2.5 px-4 text-right">Cluster Size (k)</th>
                  <th className="py-2.5 px-4 text-right">Indicative Volume</th>
                  <th className="py-2.5 px-4">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                {(analytics?.snapshots || []).map((s: any) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-4 text-[#F5F5F5]">{s.countryCode} · {s.corridorCode}</td>
                    <td className="py-2.5 px-4 text-[#D4AF37]">{s.sectorCode}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">k={s.participantClusterCount}</td>
                    <td className="py-2.5 px-4 text-right">{s.indicativeVolumeMinor?.toLocaleString()} {s.currency}</td>
                    <td className="py-2.5 px-4 text-[#A0A0A0]">{s.provenanceCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'AI' && (
        <div className="space-y-4">
          <form onSubmit={handleAskAi} className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#D4AF37]" />
              Country-Aware AI Strategic Advisor (Read-Only Advisory + 429 Circuit Breaker)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={aiCountry}
                onChange={(e) => setAiCountry(e.target.value)}
                className="bg-[#08080a] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
              >
                <option value="UG">UG — Uganda (UGX)</option>
                <option value="KE">KE — Kenya (KES)</option>
                <option value="TZ">TZ — Tanzania (TZS)</option>
                <option value="RW">RW — Rwanda (RWF)</option>
                <option value="BI">BI — Burundi (BIF)</option>
                <option value="SS">SS — South Sudan (SSP)</option>
              </select>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="sm:col-span-2 bg-[#08080a] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
              />
              <button
                type="submit"
                disabled={aiBusy}
                className="min-h-[38px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {aiBusy ? 'Consulting...' : 'Generate Advisory'}
              </button>
            </div>
            {aiResponse && (
              <div className="mt-3 p-4 rounded-lg bg-[#08080a] border border-[#27272a] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#D4AF37]">
                  <span>SOURCE: {aiResponse.source} ({aiResponse.countryCode} · {aiResponse.currency})</span>
                  <span>AUTONOMOUS MONEY MOVEMENT: {String(aiResponse.canExecuteMoneyMovement).toUpperCase()}</span>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-[#F5F5F5] font-sans leading-relaxed">
                  {aiResponse.advice}
                </pre>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
