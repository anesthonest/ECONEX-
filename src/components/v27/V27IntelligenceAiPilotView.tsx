/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V27.0 - Economic Intelligence Centre, Guarded AI Advisor & Controlled Pilot Operations View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Flag,
  Globe,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'INTELLIGENCE' | 'AI' | 'COUNTRIES' | 'PILOTS';
}

export const V27IntelligenceAiPilotView: React.FC<Props> = ({ onNavigate, initialSubTab = 'INTELLIGENCE' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'INTELLIGENCE' | 'AI' | 'COUNTRIES' | 'PILOTS'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [pilots, setPilots] = useState<any[]>([]);

  const [aiPrompt, setAiPrompt] = useState('Summarize verified multi-sector EAC trade readiness and active opportunities in Uganda.');
  const [aiTask, setAiTask] = useState('INTELLIGENCE_BRIEF');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  useEffect(() => {
    setTab(initialSubTab);
  }, [initialSubTab]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, cRes, pRes] = await Promise.all([
        ApiClient.v27GetIntelligenceSummary(actor),
        ApiClient.v27GetCountryMatrix(),
        ApiClient.v27GetPilots(actor),
      ]);
      setSummary(sRes);
      setCountries(Array.isArray(cRes) ? cRes : []);
      setPilots(Array.isArray(pRes) ? pRes : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load V27 Economic Intelligence & Pilot Operations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role, activeWorkspaceId]);

  const handleRunAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v27AiAssist({ taskType: aiTask, prompt: aiPrompt, countryCode: activeCountry }, actor);
      setAiResponse(res);
    } catch (err: any) {
      setError(err?.message || 'AI request blocked by governance guardrails.');
    } finally {
      setAiBusy(false);
    }
  };

  const handlePilotTransition = async (pilotId: string, nextStatus: string) => {
    setError(null);
    setFeedback(null);
    try {
      const upd = await ApiClient.v27TransitionPilotStatus(pilotId, nextStatus, actor);
      setFeedback(`Pilot ${upd.code} updated to ${upd.status}.`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Pilot status transition blocked by readiness & field validation policy.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider">
              ECONEX V27.0 • Intelligence Centre, Guarded AI &amp; Pilot Control
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Economic Intelligence Centre &amp; Controlled Pilot Operations
            </h1>
            <p className="text-sm text-[#A0A0A0]">
              Explicit data provenance across ACTUAL, VERIFIED, USER_DECLARED, SIMULATED &amp; ESTIMATED metrics. AI strictly advisory; simulated pilots cannot be marked ACTIVE.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate('v27-field-operations')} className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-xs text-[#F5F5F5] cursor-pointer">
              Field Validation
            </button>
            <button type="button" onClick={loadAll} className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          {(['INTELLIGENCE', 'AI', 'COUNTRIES', 'PILOTS'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#0a0a0c] border border-[#27272a] text-[#A0A0A0]'
              }`}
            >
              {t === 'INTELLIGENCE' && 'Cross-Sector Intelligence'}
              {t === 'AI' && 'Guarded AI Advisor'}
              {t === 'COUNTRIES' && '7 EAC / AfCFTA Markets'}
              {t === 'PILOTS' && 'Pilot Operations'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200">{error}</div>}
      {feedback && <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200">{feedback}</div>}

      {loading ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center text-sm text-[#A0A0A0]">Loading Intelligence Centre...</div>
      ) : tab === 'INTELLIGENCE' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 tabular-nums">
            {(summary?.metrics || []).map((m: any) => (
              <div key={m.key} className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
                <div className="text-xs text-[#A0A0A0]">{m.label}</div>
                <div className="text-2xl font-bold text-[#F5F5F5]">{m.value}</div>
                <div className="text-[10px] font-mono text-[#D4AF37]">Provenance: {m.provenance}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-2 text-xs">
            <div className="font-bold text-[#F5F5F5]">Active Sector Distribution ({summary?.scope})</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(summary?.bySector || {}).map(([sec, val]: [string, any]) => (
                <div key={sec} className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                  <div className="font-mono text-[#D4AF37] font-bold">{sec}</div>
                  <div className="text-[#A0A0A0] mt-1">
                    Participants: {val.participants} • Opportunities: {val.opportunities} • Avg Trust: {val.avgTrustScore}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : tab === 'AI' ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
            <BrainCircuit size={16} className="text-[#D4AF37]" /> Grounded V27 AI Economic Advisor
          </h2>
          <form onSubmit={handleRunAi} className="space-y-3">
            <select value={aiTask} onChange={(e) => setAiTask(e.target.value)} className="px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]">
              <option value="INTELLIGENCE_BRIEF">INTELLIGENCE_BRIEF</option>
              <option value="DISCOVERY_ASSIST">DISCOVERY_ASSIST</option>
              <option value="OPPORTUNITY_MATCH_ANALYSIS">OPPORTUNITY_MATCH_ANALYSIS</option>
              <option value="SUPPLIER_COMPARISON">SUPPLIER_COMPARISON</option>
              <option value="NEGOTIATION_PREP">NEGOTIATION_PREP</option>
              <option value="PILOT_READINESS_REVIEW">PILOT_READINESS_REVIEW</option>
            </select>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <button type="submit" disabled={aiBusy} className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
              <Sparkles size={14} /> {aiBusy ? 'Analyzing Grounded Data...' : 'Run Grounded Intelligence Query'}
            </button>
          </form>
          {aiResponse && (
            <div className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] space-y-2 text-xs">
              <div className="font-mono text-emerald-400">
                Model={aiResponse.modelDependency} • AutonomousActionPermitted={String(aiResponse.canExecuteAutonomousAction)} • HumanConfirmationRequired={String(aiResponse.requiresHumanConfirmation)}
              </div>
              <p className="text-[#F5F5F5]">{aiResponse.summary}</p>
              <div className="font-mono text-[11px] text-[#A0A0A0]">Citations: {(aiResponse.citations || []).join(' | ')}</div>
            </div>
          )}
        </div>
      ) : tab === 'COUNTRIES' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {countries.map((c) => (
            <div key={c.code} className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#F5F5F5]">{c.name}</span>
                <span className="font-mono text-[#D4AF37]">{c.code} ({c.currency})</span>
              </div>
              <div className="text-[#A0A0A0]">{c.primaryHub}</div>
              <div className="font-mono text-[11px] text-[#71717a]">
                Participants: {c.participantCount} ({c.verifiedCount} verified) • Opportunities: {c.opportunityCount} • Pilots: {c.pilotCount}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
            <Flag size={16} className="text-[#D4AF37]" /> Controlled Pilot Programmes &amp; Readiness Gates
          </h2>
          {pilots.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] space-y-2 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="font-bold text-[#F5F5F5]">{p.name} ({p.countryCode})</div>
                <span className="px-2.5 py-0.5 rounded bg-[#18181b] border border-[#27272a] font-mono text-amber-300">
                  Status: {p.status} • Simulated={String(p.isSimulatedEnvironment)}
                </span>
              </div>
              <div className="space-y-1">
                {(p.readinessChecklist || []).map((c: any, idx: number) => (
                  <div key={idx} className="font-mono text-[11px] text-[#A0A0A0]">
                    [{c.completed ? 'DONE' : 'PENDING'}] {c.item}
                  </div>
                ))}
              </div>
              {role === 'PLATFORM_ADMIN' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1e1e24]">
                  <button type="button" onClick={() => handlePilotTransition(p.id, 'READY')} className="px-3 py-1 rounded bg-[#18181b] border border-[#27272a] text-[#F5F5F5] cursor-pointer">
                    Mark READY
                  </button>
                  <button type="button" onClick={() => handlePilotTransition(p.id, 'ACTIVE')} className="px-3 py-1 rounded bg-amber-950/50 border border-amber-800 text-amber-200 cursor-pointer">
                    Attempt ACTIVE (Requires Real Field Signoff)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
