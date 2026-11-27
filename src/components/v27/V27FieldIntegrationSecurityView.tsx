/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V27.0 - Field Officer Validation, Offline Sync Queue, Partner Integration Governance & Moderation View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Plug,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'FIELD' | 'PARTNERS' | 'MODERATION';
}

export const V27FieldIntegrationSecurityView: React.FC<Props> = ({ onNavigate, initialSubTab = 'FIELD' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'FIELD' | 'PARTNERS' | 'MODERATION'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);

  const [selectedAssignment, setSelectedAssignment] = useState('V27-FA-001');
  const [obsText, setObsText] = useState('');
  const [modTargetId, setModTargetId] = useState('V27-OPP-003');
  const [modDesc, setModDesc] = useState('');

  const actor = {
    userId: currentUser?.id || 'usr_agro_01',
    userRole: role || 'AGRO_DEALER',
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
      const [aRes, rRes, pRes, mRes] = await Promise.all([
        ApiClient.v27GetFieldAssignments(actor),
        ApiClient.v27GetFieldReports(actor),
        ApiClient.v27GetPartners(actor),
        ApiClient.v27GetModerationCases(actor),
      ]);
      setAssignments(Array.isArray(aRes) ? aRes : []);
      setReports(Array.isArray(rRes) ? rRes : []);
      setPartners(Array.isArray(pRes) ? pRes : []);
      setCases(Array.isArray(mRes) ? mRes : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load V27 Field, Partner & Moderation Governance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role, activeWorkspaceId]);

  const handleSyncReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const rep = await ApiClient.v27SyncFieldReport(
        {
          assignmentId: selectedAssignment,
          observations: obsText,
          gpsSource: 'OFFLINE_MANUAL',
          syncStatus: 'SYNCED',
          offlineClientId: `OFF-${Date.now().toString(36).toUpperCase()}`,
        },
        actor
      );
      setFeedback(`Synced field validation report ${rep.id} (${rep.syncStatus}); awaiting independent supervisor review.`);
      setObsText('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to sync field report.');
    }
  };

  const handleReviewReport = async (reportId: string, decision: 'APPROVED' | 'REJECTED') => {
    setError(null);
    try {
      const upd = await ApiClient.v27ReviewFieldReport(reportId, decision, `Supervisor decision: ${decision}`, actor);
      setFeedback(`Field report ${upd.id} reviewed -> ${upd.syncStatus}.`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Only non-author Platform Admin supervisor can approve field reports.');
    }
  };

  const handleAttemptLivePartner = async (partnerId: string) => {
    setError(null);
    try {
      const upd = await ApiClient.v27TransitionPartner(partnerId, { status: 'LIVE' }, actor);
      setFeedback(`Partner ${upd.id} -> ${upd.status}`);
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Blocked LIVE promotion until credentials, regulatory, contractual & security audit are verified.');
    }
  };

  const handleSubmitModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const c = await ApiClient.v27ReportModerationCase(
        { targetType: 'OPPORTUNITY', targetId: modTargetId, reasonCategory: 'POLICY_VIOLATION', description: modDesc },
        actor
      );
      setFeedback(`Opened moderation case ${c.id}.`);
      setModDesc('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit moderation report.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#D4AF37] uppercase tracking-wider">
              ECONEX V27.0 • Field Validation, Integration Governance &amp; Safety Moderation
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Field Operations, Partner Governance &amp; Moderation Centre
            </h1>
            <p className="text-sm text-[#A0A0A0]">
              Offline-ready field inspection sync with supervisor SoD, strict gating before LIVE partner status, and auditable trust moderation.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onNavigate('v27-network-hub')} className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-xs text-[#F5F5F5] cursor-pointer">
              Network Hub
            </button>
            <button type="button" onClick={loadAll} className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          {(['FIELD', 'PARTNERS', 'MODERATION'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#0a0a0c] border border-[#27272a] text-[#A0A0A0]'
              }`}
            >
              {t === 'FIELD' && 'Field Assignments & Offline Sync'}
              {t === 'PARTNERS' && 'Integration Partner Governance'}
              {t === 'MODERATION' && 'Safety Moderation & Appeals'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200">{error}</div>}
      {feedback && <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200">{feedback}</div>}

      {loading ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center text-sm text-[#A0A0A0]">Loading governance workspace...</div>
      ) : tab === 'FIELD' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <MapPin size={16} className="text-[#D4AF37]" /> Field Assignments &amp; Inspection Reports
            </h2>
            {assignments.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs font-mono text-[#A0A0A0]">
                {a.id} • Officer={a.officerUserId} • {a.district} ({a.countryCode}) • Target={a.targetProfileId} • Status={a.status}
              </div>
            ))}
            {reports.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs space-y-1.5">
                <div className="flex justify-between font-mono">
                  <span className="text-[#D4AF37]">{r.id} • {r.district}</span>
                  <span className="text-emerald-300">{r.syncStatus}</span>
                </div>
                <div className="text-[#A0A0A0]">{r.observations}</div>
                {role === 'PLATFORM_ADMIN' && (
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => handleReviewReport(r.id, 'APPROVED')} className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-700 text-emerald-200 cursor-pointer">
                      Supervisor Approve
                    </button>
                    <button type="button" onClick={() => handleReviewReport(r.id, 'REJECTED')} className="px-2.5 py-1 rounded bg-red-950/50 border border-red-700 text-red-200 cursor-pointer">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleSyncReport} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Sync Offline Field Report</h3>
            <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]">
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.id} ({a.district})</option>
              ))}
            </select>
            <textarea required rows={3} value={obsText} onChange={(e) => setObsText(e.target.value)} placeholder="On-site inspection & verification observations..." className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Sync Field Inspection
            </button>
          </form>
        </div>
      ) : tab === 'PARTNERS' ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
            <Plug size={16} className="text-[#D4AF37]" /> External Integration Partner Governance
          </h2>
          {partners.map((p) => (
            <div key={p.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs flex flex-wrap justify-between items-center gap-3">
              <div>
                <div className="font-bold text-[#F5F5F5]">{p.partnerName} ({p.category})</div>
                <div className="font-mono text-[#A0A0A0] mt-1">
                  Status={p.status} • Creds={String(p.credentialsConfigured)} • Regulatory={String(p.regulatoryApprovalVerified)} • Contract={String(p.contractualSignoffVerified)} • SecAudit={String(p.securityAuditPassed)}
                </div>
              </div>
              {role === 'PLATFORM_ADMIN' && (
                <button type="button" onClick={() => handleAttemptLivePartner(p.id)} className="px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-700 text-amber-200 cursor-pointer">
                  Attempt LIVE Promotion
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-bold text-base text-[#F5F5F5] flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#D4AF37]" /> Network Abuse &amp; Moderation Cases
            </h2>
            {cases.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs space-y-1">
                <div className="font-mono text-[#D4AF37]">{c.id} • {c.targetType}:{c.targetId} • {c.status}</div>
                <div className="text-[#A0A0A0]">{c.description}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmitModeration} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 h-fit">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Report Network Abuse</h3>
            <input required value={modTargetId} onChange={(e) => setModTargetId(e.target.value)} placeholder="Target Entity ID" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <textarea required rows={3} value={modDesc} onChange={(e) => setModDesc(e.target.value)} placeholder="Reason for moderation review..." className="w-full px-3 py-2 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]" />
            <button type="submit" className="w-full min-h-[40px] rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Submit Safety Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
