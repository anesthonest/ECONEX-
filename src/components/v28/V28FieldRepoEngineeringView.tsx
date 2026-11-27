/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 — Field Offline Sync Conflicts, Security & Truthfulness, GitHub & AI Studio Diagnostics
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Eye,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'FIELD' | 'SECURITY' | 'REPO_HEALTH';
}

export const V28FieldRepoEngineeringView: React.FC<Props> = ({ initialSubTab = 'FIELD' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'FIELD' | 'SECURITY' | 'REPO_HEALTH'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [fieldRecords, setFieldRecords] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [repoHealth, setRepoHealth] = useState<any>(null);

  // Field Sync Form
  const [clientRecordId, setClientRecordId] = useState('CLIENT-UG-101');
  const [district, setDistrict] = useState('Mbale');
  const [baseVersion, setBaseVersion] = useState('1');
  const [note, setNote] = useState('Field moisture check 13.4% verified');

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    organisationId: activeWorkspaceId,
    countryCode: activeCountry,
  };

  useEffect(() => {
    setTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fRes, rRes, gRes] = await Promise.all([
        ApiClient.v28GetFieldOfflineRecords(actor).catch(() => ({ records: [] })),
        ApiClient.v28GetReadinessMatrix(),
        ApiClient.v28GetRepositoryHealth(),
      ]);
      setFieldRecords(Array.isArray(fRes?.records) ? fRes.records : []);
      setReadiness(rRes || null);
      setRepoHealth(gRes || null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load V28 field & engineering diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId]);

  const handleSyncField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const rec = await ApiClient.v28SyncFieldOfflineRecord(
        {
          clientRecordId,
          taskType: 'FIELD_VERIFICATION',
          targetEntityId: 'org_coop_01',
          countryCode: activeCountry,
          district,
          baseVersion: Number(baseVersion || 1),
          payload: { note },
        },
        actor
      );
      setFeedback(`Synced offline record ${rec.id} (v${rec.version}) -> state=${rec.syncState}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Version conflict detected (CONFLICT) — supervisor resolution required.');
      await loadData();
    }
  };

  const handleResolveConflict = async (recId: string, strategy: 'KEEP_SERVER' | 'ACCEPT_CLIENT') => {
    setError(null);
    setFeedback(null);
    try {
      const rec = await ApiClient.v28ResolveFieldConflict(recId, { strategy, supervisorNote: 'Reviewed by supervisor' }, actor);
      setFeedback(`Resolved conflict on ${rec.id} via ${strategy} -> ${rec.syncState}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Supervisor SoD check blocked self-resolution.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D4AF37]">FIELD OFFLINE CONTINUITY, SECURITY GOVERNANCE &amp; GITHUB DIAGNOSTICS</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1 flex items-center gap-2">
              <Database className="text-[#D4AF37]" size={24} />
              Field Sync Conflicts, Honesty Flags &amp; Sync Diagnostics
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Optimistic version checks preventing silent offline overwrites, complete 27-flag readiness transparency, and truthful Git/AI Studio repository diagnostics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['FIELD', 'SECURITY', 'REPO_HEALTH'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#181818] text-[#C0C0C0] border border-[#27272a]'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
            <button
              type="button"
              onClick={loadData}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-xs text-red-200">{error}</div>}
      {feedback && (
        <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-4 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {tab === 'FIELD' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <form onSubmit={handleSyncField} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <MapPin size={16} className="text-[#D4AF37]" /> Offline Field Record Sync
            </h2>
            <input
              value={clientRecordId}
              onChange={(e) => setClientRecordId(e.target.value)}
              placeholder="Client Record ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District"
                className="px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
              />
              <input
                type="number"
                min={0}
                value={baseVersion}
                onChange={(e) => setBaseVersion(e.target.value)}
                placeholder="Base Version"
                className="px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observation note"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
            />
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Sync Field Record
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Offline Queue &amp; Conflicts ({fieldRecords.length})</h2>
            {loading ? (
              <div className="text-[#A0A0A0]">Loading field queue...</div>
            ) : (
              fieldRecords.map((rec) => (
                <div key={rec.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-[#D4AF37]">{rec.clientRecordId} · v{rec.version} · {rec.syncState}</div>
                      <div className="text-[#C0C0C0]">{rec.district} ({rec.countryCode}) · Officer: {rec.officerUserId}</div>
                    </div>
                    {rec.syncState === 'CONFLICT' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveConflict(rec.id, 'KEEP_SERVER')}
                          className="px-3 py-1 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] cursor-pointer"
                        >
                          Keep Server
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveConflict(rec.id, 'ACCEPT_CLIENT')}
                          className="px-3 py-1 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                        >
                          Accept Client
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'SECURITY' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4 text-xs">
          <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
            <Eye size={16} className="text-[#D4AF37]" /> 27-Flag Truthful Readiness Matrix
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(readiness?.flags || {}).map(([key, val]) => (
              <div key={key} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 flex items-center justify-between font-mono">
                <span className="text-[#C0C0C0] truncate pr-2">{key}</span>
                <span className={val ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {String(val).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'REPO_HEALTH' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D4AF37]" /> GitHub &amp; AI Studio Repository Diagnostics
            </h2>
            <span className="font-mono text-amber-400">
              Remote Sync Verified: {String(repoHealth?.remoteSyncVerified ?? false)}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
              <div className="text-[#A0A0A0]">LOCAL .GIT DIR</div>
              <div className="text-sm font-bold text-[#F5F5F5]">{String(repoHealth?.localGitMetadataPresent ?? false)}</div>
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
              <div className="text-[#A0A0A0]">CI WORKFLOW</div>
              <div className="text-sm font-bold text-emerald-400">{String(repoHealth?.ciWorkflowsPresent?.ciYml ?? false)}</div>
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
              <div className="text-[#A0A0A0]">VAULT GITIGNORED</div>
              <div className="text-sm font-bold text-emerald-400">{String(repoHealth?.gitignoreRulesPresent?.v28VaultIgnored ?? false)}</div>
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
              <div className="text-[#A0A0A0]">UNTRACKED VAULT FILES</div>
              <div className="text-sm font-bold text-[#F5F5F5]">{repoHealth?.runtimeArtifacts?.v25VaultFileCount ?? 0}</div>
            </div>
          </div>
          <div className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-2">
            <div className="font-semibold text-[#D4AF37]">Sync Root-Cause Diagnostics</div>
            {(repoHealth?.likelyCauses || []).map((c: any) => (
              <div key={c.code} className="text-[#C0C0C0]">
                <span className="font-mono text-[#F5F5F5]">{c.code}:</span> {c.summary}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
