/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V20.0 - Configurable Regional & Uganda Pilot Control Desk (/pilots)
 * Strictly separates Actual, Simulated (Sandbox), Test, Target, and Projection metrics.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  MapPin,
  Plus,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type { V20PilotProgramme } from '../../types/index.ts';

function downloadJsonBlob(filename: string, obj: any) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const V20PilotControlView: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const [pilots, setPilots] = useState<V20PilotProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Create configurable pilot state (never hardcoded to Uganda)
  const [pilotName, setPilotName] = useState('');
  const [pilotCode, setPilotCode] = useState('');
  const [countryCode, setCountryCode] = useState('UG');
  const [regionName, setRegionName] = useState('Eastern Corridor');
  const [districtsCsv, setDistrictsCsv] = useState('Mbale, Jinja');
  const [targetParticipants, setTargetParticipants] = useState('40');
  const [targetCompletedTrades, setTargetCompletedTrades] = useState('20');

  // Onboard participant into selected pilot
  const [selectedPilotId, setSelectedPilotId] = useState('V20-PILOT-UG-ELGON-01');
  const [onboardParticipantId, setOnboardParticipantId] = useState('V17-PART-AGRO-01');
  const [onboardName, setOnboardName] = useState('Rwenzori Agro Inputs Hub');
  const [onboardRole, setOnboardRole] = useState('AGRO_DEALER');
  const [onboardDistrict, setOnboardDistrict] = useState('Mbale');

  const actor = {
    userId: currentUser?.id || 'usr_admin_01',
    userRole: role,
    tenantId: 'TEN-UG-ELGON-01',
  };

  const loadPilots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiClient.v20GetPilots(actor);
      const list = Array.isArray(res?.pilots) ? res.pilots : [];
      setPilots(list);
      if (list.length > 0 && !list.some((p: V20PilotProgramme) => p.id === selectedPilotId)) {
        setSelectedPilotId(list[0].id);
      }
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Unable to load pilot programmes.' });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadPilots();
  }, [loadPilots]);

  const handleCreatePilot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const districts = districtsCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const created = await ApiClient.v20CreatePilot(
        {
          name: pilotName,
          code: pilotCode || undefined,
          countryCode,
          regionName,
          districts,
          targetParticipants: Number(targetParticipants),
          targetCompletedTrades: Number(targetCompletedTrades),
        },
        actor
      );
      setPilotName('');
      setPilotCode('');
      setSelectedPilotId(created.id);
      setBanner({ kind: 'ok', text: `Created configurable pilot ${created.code} (${created.countryCode}).` });
      loadPilots();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Pilot creation failed.' });
    }
  };

  const handleOnboardParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.v20OnboardPilotParticipant(
        selectedPilotId,
        {
          participantId: onboardParticipantId,
          displayName: onboardName,
          roleType: onboardRole,
          district: onboardDistrict,
        },
        actor
      );
      setBanner({ kind: 'ok', text: `Participant ${onboardName} onboarded into ${selectedPilotId}.` });
      loadPilots();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Onboarding failed.' });
    }
  };

  const handleLifecycle = async (pilotId: string, status: string) => {
    try {
      await ApiClient.v20UpdatePilotLifecycle(pilotId, status, actor);
      setBanner({ kind: 'ok', text: `Pilot ${pilotId} transitioned to ${status}.` });
      loadPilots();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Lifecycle update failed.' });
    }
  };

  const handleDownloadReport = async (pilotId: string) => {
    try {
      const rep = await ApiClient.v20GetPilotReport(pilotId, actor);
      downloadJsonBlob(`ECONEX-Pilot-Report-${pilotId}.json`, rep);
      setBanner({ kind: 'ok', text: `Downloaded JSON report for ${pilotId}.` });
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Report export failed.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#D4AF37]">
            ECONEX V20.0 · PILOT CONTROL DESK
          </span>
          <h1 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
            <MapPin size={18} className="text-[#D4AF37]" />
            Configurable Country & Regional Pilot Governance
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            Manage Uganda-first and configurable EAC/AfCFTA regional pilots with strict separation of Actual, Simulated Sandbox, Test Verification, Target, and Projected metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('operations-hub')}
              className="px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
            >
              Operations Hub
            </button>
          )}
          <button
            type="button"
            onClick={loadPilots}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {banner && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            banner.kind === 'ok'
              ? 'bg-emerald-950/40 border-emerald-700/70 text-emerald-200'
              : 'bg-red-950/40 border-red-700/70 text-red-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {banner.kind === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {banner.text}
          </span>
          <button type="button" onClick={() => setBanner(null)} className="text-[#A0A0A0] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Pilots List + Separated 5-Tier Metrics */}
      <div className="space-y-4">
        {pilots.map((pilot) => (
          <div key={pilot.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#D4AF37]">{pilot.code}</span>
                  <h2 className="text-base font-bold text-[#F5F5F5]">{pilot.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#27272a] bg-[#09090b] text-emerald-300">
                    {pilot.status}
                  </span>
                </div>
                <div className="text-xs text-[#A0A0A0] mt-1">
                  Country: <strong className="text-[#F5F5F5]">{pilot.countryCode}</strong> · Region: {pilot.regionName} · Districts:{' '}
                  <span className="font-mono">{pilot.districts.join(', ')}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['PLANNING', 'ACTIVE', 'SUSPENDED', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={pilot.status === st}
                    onClick={() => handleLifecycle(pilot.id, st)}
                    className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] disabled:opacity-40 text-[11px] font-mono text-[#F5F5F5] cursor-pointer"
                  >
                    {st}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleDownloadReport(pilot.id)}
                  className="px-3 py-1 rounded bg-[#D4AF37] text-[#050505] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} /> JSON Report
                </button>
              </div>
            </div>

            {/* Strictly Separated 5 Metric Buckets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="bg-[#09090b] border border-emerald-900/60 rounded-lg p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-emerald-400">1. Actual Operations</div>
                <div className="font-mono tabular-nums text-[#F5F5F5]">Onboarded: {pilot.metrics.actual.onboardedCount}</div>
                <div className="font-mono tabular-nums text-[#F5F5F5]">Active / Done Trades: {pilot.metrics.actual.activeTradesCount} / {pilot.metrics.actual.completedTradesCount}</div>
                <div className="font-mono tabular-nums text-emerald-300">Vol: {pilot.metrics.actual.totalTradeVolumeUgx.toLocaleString()} UGX</div>
              </div>

              <div className="bg-[#09090b] border border-amber-900/60 rounded-lg p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-amber-400">2. Simulated (Sandbox)</div>
                <div className="font-mono tabular-nums text-[#F5F5F5]">Sandbox Payments: {pilot.metrics.simulated.sandboxPaymentsCount}</div>
                <div className="font-mono tabular-nums text-amber-300">Sandbox Vol: {pilot.metrics.simulated.sandboxVolumeUgx.toLocaleString()} UGX</div>
              </div>

              <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#A0A0A0]">3. Test Verification</div>
                <div className="font-mono tabular-nums text-[#F5F5F5]">Isolated Test Trades: {pilot.metrics.test.verificationTradesCount}</div>
                <div className="text-[10px] text-[#71717a]">Excluded from Actual & Journal</div>
              </div>

              <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#D4AF37]">4. Planning Target</div>
                <div className="font-mono tabular-nums text-[#F5F5F5]">Target Participants: {pilot.metrics.target.targetParticipants}</div>
                <div className="font-mono tabular-nums text-[#F5F5F5]">Target Trades: {pilot.metrics.target.targetCompletedTrades}</div>
              </div>

              <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 space-y-1">
                <div className="text-[10px] font-mono uppercase text-sky-400">5. Projection (Non-Realized)</div>
                <div className="font-mono tabular-nums text-sky-300">Est. Monthly: {pilot.metrics.projection.estimatedMonthlyGmUgx.toLocaleString()} UGX</div>
                <div className="text-[10px] text-[#71717a]">{pilot.metrics.projection.projectionDisclaimer}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Configurable Pilot + Onboard Participant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleCreatePilot} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
            <Plus size={15} className="text-[#D4AF37]" />
            Create Configurable Pilot (Any Country / Corridor)
          </h2>
          <input
            required
            value={pilotName}
            onChange={(e) => setPilotName(e.target.value)}
            placeholder="Pilot name (e.g., Busia Cross-Border Grain Pilot)"
            className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={pilotCode}
              onChange={(e) => setPilotCode(e.target.value)}
              placeholder="Code (optional)"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            />
            <input
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              placeholder="Country (UG, KE, TZ...)"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            />
            <input
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              placeholder="Region"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
          </div>
          <input
            value={districtsCsv}
            onChange={(e) => setDistrictsCsv(e.target.value)}
            placeholder="Districts comma-separated (e.g., Busia, Tororo, Bungoma)"
            className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="1"
              value={targetParticipants}
              onChange={(e) => setTargetParticipants(e.target.value)}
              placeholder="Target participants"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            />
            <input
              type="number"
              min="1"
              value={targetCompletedTrades}
              onChange={(e) => setTargetCompletedTrades(e.target.value)}
              placeholder="Target trades"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer">
            Create Configurable Pilot
          </button>
        </form>

        <form onSubmit={handleOnboardParticipant} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
            <UserPlus size={15} className="text-emerald-400" />
            Onboard Participant into Pilot
          </h2>
          <select
            value={selectedPilotId}
            onChange={(e) => setSelectedPilotId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
          >
            {pilots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              value={onboardParticipantId}
              onChange={(e) => setOnboardParticipantId(e.target.value)}
              placeholder="Participant ID"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            />
            <input
              required
              value={onboardName}
              onChange={(e) => setOnboardName(e.target.value)}
              placeholder="Display name"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={onboardRole}
              onChange={(e) => setOnboardRole(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            >
              <option value="FARMER">FARMER</option>
              <option value="BUYER">BUYER</option>
              <option value="AGRO_DEALER">AGRO_DEALER</option>
              <option value="COOPERATIVE_ADMIN">COOPERATIVE_ADMIN</option>
              <option value="TRANSPORTER">TRANSPORTER</option>
            </select>
            <input
              value={onboardDistrict}
              onChange={(e) => setOnboardDistrict(e.target.value)}
              placeholder="District"
              className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer">
            Onboard Participant to Pilot
          </button>
        </form>
      </div>
    </div>
  );
};
