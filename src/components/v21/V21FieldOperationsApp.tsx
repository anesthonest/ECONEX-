/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V21.0 - Mobile-First & Low-Bandwidth Field Operations App (/field-ops)
 * Offline-resilient local capture, opt-in GPS, evidence attachment metadata,
 * 7-stage Field Officer task lifecycle, and direct integration with V20 Operations Hub.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  FileCheck2,
  Globe,
  MapPin,
  RefreshCw,
  Send,
  Wifi,
  WifiOff,
  Workflow,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { useOffline } from '../../context/OfflineContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { SUPPORTED_LANGUAGES } from '../../i18n/econexTranslations.ts';
import type {
  EconexLanguageCode,
} from '../../i18n/econexTranslations.ts';
import type {
  V21FieldActivityRecord,
  V21FieldOfficerTask,
  V21FieldTaskStatus,
} from '../../types/index.ts';

const LOCAL_DRAFT_STORAGE_KEY = 'econex_v21_field_drafts_v1';

async function computeSha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return `fallback-${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export const V21FieldOperationsApp: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const { language, setLanguage, lowBandwidth, setLowBandwidth, t } = useExperience();
  const { isSimulatedOffline, toggleSimulatedOffline, pendingCount } = useOffline();
  const isOnline = !isSimulatedOffline;

  const [activeSection, setActiveSection] = useState<'CAPTURE' | 'QUEUE' | 'TASKS'>('CAPTURE');
  const [records, setRecords] = useState<V21FieldActivityRecord[]>([]);
  const [tasks, setTasks] = useState<V21FieldOfficerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Field capture form state
  const [pilotId, setPilotId] = useState('V21-PILOT-UG-ELGON-01');
  const [recordType, setRecordType] = useState<V21FieldActivityRecord['recordType']>('HARVEST_CAPTURE');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [gpsPermissionGranted, setGpsPermissionGranted] = useState(false);
  const [gpsLat, setGpsLat] = useState('1.0820');
  const [gpsLng, setGpsLng] = useState('34.1750');
  const [attachmentMeta, setAttachmentMeta] = useState<
    { fileName: string; mimeType: string; sizeBytes: number; sha256: string } | undefined
  >(undefined);
  const [localSavedDraftCount, setLocalSavedDraftCount] = useState(0);

  // Officer Task transition state
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [siteVisitNotes, setSiteVisitNotes] = useState('');
  const [assistanceSummary, setAssistanceSummary] = useState('');
  const [followUpAction, setFollowUpAction] = useState('');
  const [supervisorNote, setSupervisorNote] = useState('');

  const actor = {
    userId: currentUser?.id || 'usr_officer_01',
    userRole: role,
    tenantId: 'TEN-UG-ELGON-01',
  };

  const refreshLocalDraftCounter = useCallback(() => {
    try {
      const raw = localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setLocalSavedDraftCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setLocalSavedDraftCount(0);
    }
  }, []);

  const loadFieldData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, taskRes] = await Promise.all([
        ApiClient.v21GetFieldRecords(actor).catch(() => ({ records: [] })),
        ApiClient.v21GetFieldTasks(actor).catch(() => ({ tasks: [] })),
      ]);
      const recList = Array.isArray(recRes?.records) ? recRes.records : [];
      const taskList = Array.isArray(taskRes?.tasks) ? taskRes.tasks : [];
      setRecords(recList);
      setTasks(taskList);
      if (taskList.length > 0 && !selectedTaskId) {
        setSelectedTaskId(taskList[0].id);
      }
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Could not refresh field operations state.' });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    refreshLocalDraftCounter();
    loadFieldData();
  }, [loadFieldData, refreshLocalDraftCounter]);

  const handleEvidenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const digest = await computeSha256Hex(`${file.name}:${file.size}:${file.lastModified}`);
    setAttachmentMeta({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      sha256: digest,
    });
    setNotice({ kind: 'ok', text: `Attached metadata digest for ${file.name} (${Math.round(file.size / 1024)} KB).` });
  };

  const handleSaveRecord = async (targetMode: 'LOCAL_DRAFT' | 'QUEUED' | 'SYNC_NOW', simulateFailure = false) => {
    if (!title.trim()) {
      setNotice({ kind: 'err', text: 'Enter a clear title before saving this field record.' });
      return;
    }

    const draftPayload = {
      pilotId,
      recordType,
      title: title.trim(),
      summary: summary.trim() || `${recordType} captured on field device`,
      participantId: participantId.trim() || undefined,
      gpsPermissionGranted,
      gpsCoordinates: gpsPermissionGranted
        ? { lat: Number(gpsLat || 0), lng: Number(gpsLng || 0), accuracyMeters: 15 }
        : undefined,
      evidenceAttachmentMeta: attachmentMeta,
      idempotencyKey: `V21-FLD-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      clientVersion: 1,
      targetMode,
      simulateFailure,
      payload: {
        lowBandwidthMode: lowBandwidth,
        language,
        capturedOfflineOnDevice: !isOnline,
      },
    };

    if (!isOnline || targetMode === 'LOCAL_DRAFT') {
      try {
        const raw = localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        existing.unshift({ ...draftPayload, savedLocallyAt: new Date().toISOString() });
        localStorage.setItem(LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(existing.slice(0, 25)));
        refreshLocalDraftCounter();
      } catch {
        // Ignore storage quota errors
      }
    }

    if (!isOnline) {
      setNotice({
        kind: 'ok',
        text: 'Offline detected: record persisted safely in device storage ready to sync when online.',
      });
      return;
    }

    try {
      const saved = await ApiClient.v21SaveFieldRecord(draftPayload, actor);
      setTitle('');
      setSummary('');
      setAttachmentMeta(undefined);
      setNotice({
        kind: saved.syncStatus === 'FAILED' || saved.syncStatus === 'CONFLICT' ? 'err' : 'ok',
        text: `Field record ${saved.id} saved with sync state ${saved.syncStatus}.`,
      });
      setActiveSection('QUEUE');
      loadFieldData();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Unable to store field record.' });
    }
  };

  const handleRetrySync = async (recordId: string) => {
    try {
      const retried = await ApiClient.v21RetryFieldRecord(recordId, actor);
      setNotice({
        kind: retried.syncStatus === 'SYNCED' ? 'ok' : 'err',
        text: `Retry finished: ${retried.id} is now ${retried.syncStatus}.`,
      });
      loadFieldData();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Retry failed.' });
    }
  };

  const handleTaskTransition = async (taskId: string, targetStatus: V21FieldTaskStatus) => {
    try {
      const updated = await ApiClient.v21TransitionFieldTask(
        taskId,
        {
          targetStatus,
          siteVisitNotes: siteVisitNotes || undefined,
          assistanceSummary: assistanceSummary || undefined,
          followUpAction: followUpAction || undefined,
          supervisorReviewNote: supervisorNote || undefined,
          note: `Transitioned to ${targetStatus} via V21 Field App`,
        },
        actor
      );
      setNotice({ kind: 'ok', text: `Task ${updated.id} moved to ${updated.status}.` });
      loadFieldData();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Task transition failed.' });
    }
  };

  const nextTaskActions = (status: V21FieldTaskStatus): V21FieldTaskStatus[] => {
    switch (status) {
      case 'ASSIGNED':
      case 'REASSIGNED':
        return ['ACCEPTED', 'REJECTED'];
      case 'ACCEPTED':
        return ['IN_PROGRESS', 'REJECTED'];
      case 'IN_PROGRESS':
        return ['SUBMITTED'];
      case 'SUBMITTED':
        return role === 'PLATFORM_ADMIN' || role === 'COOPERATIVE_ADMIN' ? ['REVIEWED', 'REASSIGNED'] : [];
      case 'REVIEWED':
        return role === 'PLATFORM_ADMIN' || role === 'COOPERATIVE_ADMIN' ? ['CLOSED'] : [];
      default:
        return [];
    }
  };

  const conflictRecords = records.filter((r) => r.syncStatus === 'CONFLICT' || r.syncStatus === 'FAILED');

  return (
    <div className="space-y-5 pb-20 sm:pb-6">
      {/* Compact Header tailored for Field Bandwidth */}
      <header className="bg-[#121212] border border-[#27272a] rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#D4AF37]">ECONEX V21.0 · FIELD OPERATIONS APP</div>
          <h1 className="text-xl font-semibold text-[#F5F5F5] flex items-center gap-2">
            <ClipboardCheck size={20} className="text-[#D4AF37]" aria-hidden="true" />
            <span>{t('pilot_field_app')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A0A0]">
            Low-bandwidth field capture, offline retry queue, opt-in GPS evidence, and Field Officer task execution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="v21-field-lang">Language</label>
          <div className="flex items-center gap-1.5 bg-[#09090b] border border-[#27272a] rounded-xl px-2.5 min-h-[44px]">
            <Globe size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <select
              id="v21-field-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as EconexLanguageCode)}
              className="bg-transparent text-xs text-[#F5F5F5] focus:outline-none min-h-[40px]"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#121212] text-[#F5F5F5]">
                  {l.nativeName} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setLowBandwidth(!lowBandwidth)}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
              lowBandwidth
                ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                : 'bg-[#09090b] border-[#27272a] text-[#C0C0C0]'
            }`}
          >
            {t('pilot_low_data_mode')}: {lowBandwidth ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={toggleSimulatedOffline}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
              isOnline
                ? 'bg-[#09090b] border-[#27272a] text-emerald-300'
                : 'bg-amber-950/50 border-amber-700 text-amber-200'
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? t('offline_online') : t('offline_offline')}</span>
          </button>
        </div>
      </header>

      {/* Notice Feedback */}
      {notice && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            notice.kind === 'ok'
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800 text-amber-200'
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs underline shrink-0 min-h-[36px] px-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Conflict / Failed Sync Recovery Strip */}
      {conflictRecords.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-200">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <div className="font-semibold">
                {conflictRecords.length} field record(s) require retry or conflict resolution
              </div>
              <p className="text-amber-300/80">
                Retry synchronization directly from the Queue tab or review server conflict snapshots in V20 Operations Hub.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('operations-hub')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-amber-600 text-xs font-semibold text-amber-100 hover:bg-amber-900/40 shrink-0 cursor-pointer"
            >
              Open Conflict Hub
            </button>
          )}
        </div>
      )}

      {/* Single-Row Top Switcher (Desktop/Tablet) + Quick V20 Link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'CAPTURE', label: 'Field Capture' },
              { id: 'QUEUE', label: `Sync Queue (${records.length})` },
              { id: 'TASKS', label: `Officer Tasks (${tasks.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-[#050505] font-semibold'
                  : 'bg-[#121212] border-[#27272a] text-[#C0C0C0] hover:border-[#D4AF37]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A0A0A0] tabular-nums">
          <span>Local Drafts: {localSavedDraftCount}</span>
          <span>·</span>
          <span>Device Queue: {pendingCount}</span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('operations-hub')}
              className="min-h-[44px] ml-2 px-3 py-2 rounded-xl border border-[#27272a] bg-[#121212] text-xs text-[#D4AF37] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
            >
              <Workflow size={14} />
              <span>{t('pilot_marketplace_cta')} / Trades</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: OFFLINE-SAFE CAPTURE FORM */}
      {activeSection === 'CAPTURE' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Capture Field Activity Record</h2>
            <span className="text-xs text-[#A0A0A0]">Zero auto-tracking · Permission-gated GPS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Pilot Scope</span>
              <select
                value={pilotId}
                onChange={(e) => setPilotId(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="V21-PILOT-UG-ELGON-01">Mt. Elgon Farmer-to-Buyer (UG)</option>
                <option value="V21-PILOT-UG-KLA-SME-02">Kampala SME Trade (UG)</option>
                <option value="V21-PILOT-UG-COOP-03">Busoga Cooperative Aggregation (UG)</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Activity Type</span>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as V21FieldActivityRecord['recordType'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="HARVEST_CAPTURE">Harvest Lot Capture</option>
                <option value="DELIVERY_PROOF">Delivery Evidence Capture</option>
                <option value="SITE_VISIT">Field Site Visit Log</option>
                <option value="ONBOARDING_CAPTURE">Assisted Participant Onboarding</option>
                <option value="ASSISTANCE_LOG">Participant Assistance Record</option>
              </select>
            </label>

            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Activity Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grade A Arabica lot weighbridge check — Mbale"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>

            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Participant ID (Optional)</span>
              <input
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="e.g. V17-PART-FARM-01"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs text-[#A0A0A0]">
            <span>Field Observations &amp; Verification Summary</span>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Quantity, moisture reading, bag seal number, or participant request..."
              className="w-full p-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>

          {/* Opt-In GPS + Lightweight File Hash Attachment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs sm:text-sm text-[#F5F5F5] cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={gpsPermissionGranted}
                  onChange={(e) => setGpsPermissionGranted(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37]"
                />
                <MapPin size={15} className="text-[#D4AF37]" />
                <span>Explicit participant permission granted for GPS tag</span>
              </label>
              {gpsPermissionGranted && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={gpsLat}
                    onChange={(e) => setGpsLat(e.target.value)}
                    aria-label="Latitude"
                    className="min-h-[44px] px-2.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs font-mono text-[#F5F5F5] tabular-nums"
                  />
                  <input
                    type="text"
                    value={gpsLng}
                    onChange={(e) => setGpsLng(e.target.value)}
                    aria-label="Longitude"
                    className="min-h-[44px] px-2.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs font-mono text-[#F5F5F5] tabular-nums"
                  />
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#F5F5F5]">
                <FileCheck2 size={15} className="text-[#D4AF37]" />
                <span>Attach Photo / Document Evidence Digest (Low-Data Safe)</span>
              </div>
              <input
                type="file"
                onChange={handleEvidenceFileChange}
                className="block w-full text-xs text-[#A0A0A0] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#18181b] file:text-[#F5F5F5] cursor-pointer"
              />
              {attachmentMeta && (
                <div className="text-[11px] font-mono text-emerald-300 truncate">
                  {attachmentMeta.fileName} · SHA256: {attachmentMeta.sha256.slice(0, 16)}...
                </div>
              )}
            </div>
          </div>

          {/* Mobile-Sized 44px Touch Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleSaveRecord('LOCAL_DRAFT')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs sm:text-sm text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
            >
              Save Local Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveRecord('QUEUED')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#18181b] text-xs sm:text-sm text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
            >
              Queue for Later
            </button>
            <button
              type="button"
              onClick={() => handleSaveRecord('SYNC_NOW')}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs sm:text-sm hover:bg-[#e5bf43] flex items-center gap-2 cursor-pointer"
            >
              <Send size={15} />
              <span>{t('pilot_sync_now')}</span>
            </button>
          </div>
        </section>
      )}

      {/* SECTION 2: SYNC QUEUE & RETRY DIAGNOSTICS */}
      {activeSection === 'QUEUE' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Field Sync Queue</h2>
            <button
              type="button"
              onClick={loadFieldData}
              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#C0C0C0] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-[#A0A0A0]">Loading field sync records...</p>
          ) : records.length === 0 ? (
            <p className="text-xs text-[#A0A0A0]">No field records captured yet.</p>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {records.map((rec) => (
                <div key={rec.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-medium text-[#F5F5F5]">{rec.title}</div>
                    <div className="text-xs text-[#A0A0A0] font-mono">
                      {rec.id} · {rec.recordType} · Sync: <span className={
                        rec.syncStatus === 'SYNCED' ? 'text-emerald-400' : rec.syncStatus === 'FAILED' || rec.syncStatus === 'CONFLICT' ? 'text-amber-400' : 'text-[#D4AF37]'
                      }>{rec.syncStatus}</span> · Retries: {rec.retryCount}
                    </div>
                    <p className="text-xs text-[#A0A0A0]">{rec.summary}</p>
                    {rec.lastError && (
                      <p className="text-xs text-amber-300">Error: {rec.lastError}</p>
                    )}
                  </div>
                  {rec.syncStatus !== 'SYNCED' && (
                    <button
                      type="button"
                      onClick={() => handleRetrySync(rec.id)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#18181b] border border-[#D4AF37] text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] shrink-0 cursor-pointer"
                    >
                      Retry Sync
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: 7-STAGE FIELD OFFICER TASK WORKFLOW */}
      {activeSection === 'TASKS' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Field Officer Task Execution</h2>
              <p className="text-xs text-[#A0A0A0]">
                Lifecycle: CREATED → ASSIGNED → ACCEPTED → IN_PROGRESS → SUBMITTED → REVIEWED → CLOSED
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#09090b] border border-[#27272a] rounded-xl p-3.5">
            <input
              type="text"
              value={siteVisitNotes}
              onChange={(e) => setSiteVisitNotes(e.target.value)}
              placeholder="Site visit observations..."
              className="min-h-[44px] px-3 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              value={assistanceSummary}
              onChange={(e) => setAssistanceSummary(e.target.value)}
              placeholder="Participant assistance provided..."
              className="min-h-[44px] px-3 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              value={followUpAction}
              onChange={(e) => setFollowUpAction(e.target.value)}
              placeholder="Follow-up action or supervisor review note..."
              onBlur={() => setSupervisorNote(followUpAction)}
              className="min-h-[44px] px-3 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
          </div>

          {tasks.length === 0 ? (
            <p className="text-xs text-[#A0A0A0]">No Field Officer tasks assigned to your current account.</p>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {tasks.map((task) => {
                const transitions = nextTaskActions(task.status);
                return (
                  <div key={task.id} className="py-4 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-[#F5F5F5]">{task.title}</div>
                        <div className="text-xs text-[#A0A0A0] font-mono">
                          {task.id} · {task.assignedDistrict} · Priority: {task.priority} · Status:{' '}
                          <span className="text-[#D4AF37]">{task.status}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {transitions.map((nextState) => (
                          <button
                            key={nextState}
                            type="button"
                            onClick={() => handleTaskTransition(task.id, nextState)}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
                          >
                            Move to {nextState}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#A0A0A0]">{task.instructions}</p>
                    {task.siteVisitNotes && (
                      <p className="text-xs text-emerald-300">Visit Note: {task.siteVisitNotes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Sticky Compact Mobile Action Bar (<12% viewport height) */}
      <nav
        aria-label="Field quick tabs"
        className="sm:hidden fixed bottom-14 left-2 right-2 z-30 bg-[#09090b]/95 border border-[#27272a] rounded-xl px-2 py-1.5 flex items-center justify-around gap-1 backdrop-blur"
      >
        <button
          type="button"
          onClick={() => setActiveSection('CAPTURE')}
          className={`min-h-[44px] flex-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer ${
            activeSection === 'CAPTURE' ? 'bg-[#D4AF37] text-[#050505]' : 'text-[#C0C0C0]'
          }`}
        >
          <MapPin size={14} />
          <span>Capture</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('QUEUE')}
          className={`min-h-[44px] flex-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer ${
            activeSection === 'QUEUE' ? 'bg-[#D4AF37] text-[#050505]' : 'text-[#C0C0C0]'
          }`}
        >
          {conflictRecords.length > 0 ? <CloudOff size={14} /> : <CheckCircle2 size={14} />}
          <span>Queue ({records.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('TASKS')}
          className={`min-h-[44px] flex-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1 cursor-pointer ${
            activeSection === 'TASKS' ? 'bg-[#D4AF37] text-[#050505]' : 'text-[#C0C0C0]'
          }`}
        >
          <ClipboardCheck size={14} />
          <span>Tasks ({tasks.length})</span>
        </button>
      </nav>
    </div>
  );
};
export default V21FieldOperationsApp;
