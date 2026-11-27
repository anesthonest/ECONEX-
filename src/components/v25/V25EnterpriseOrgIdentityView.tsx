/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V25.0 — Enterprise Multi-Organisation Hierarchy, Identity Security, MFA & 5-Tier Compliance
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V25Branch,
  V25BusinessUnit,
  V25ComplianceRecord,
  V25MfaConfig,
  V25OrgMembership,
  V25Organisation,
  V25UserDevice,
  V25UserSession,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V25EnterpriseOrgIdentityView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role, tenantId: 'TENANT-UG' };

  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<V25Organisation[]>([]);
  const [bus, setBus] = useState<V25BusinessUnit[]>([]);
  const [branches, setBranches] = useState<V25Branch[]>([]);
  const [memberships, setMemberships] = useState<V25OrgMembership[]>([]);
  const [devices, setDevices] = useState<V25UserDevice[]>([]);
  const [sessions, setSessions] = useState<V25UserSession[]>([]);
  const [mfaConfigs, setMfaConfigs] = useState<V25MfaConfig[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<V25ComplianceRecord[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [newOrgName, setNewOrgName] = useState('Victoria Steel & Solar Distribution Ltd');
  const [newOrgCountry, setNewOrgCountry] = useState('UG');
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCodeInput, setMfaCodeInput] = useState('');
  const [sandboxOtpHint, setSandboxOtpHint] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, idRes, cmpRes] = await Promise.all([
        ApiClient.v25GetOrganisations(actor),
        ApiClient.v25GetIdentitySecurityState(actor),
        ApiClient.v25GetComplianceRecords(actor),
      ]);
      setOrgs(orgRes.organisations || []);
      setBus(orgRes.businessUnits || []);
      setBranches(orgRes.branches || []);
      setMemberships(orgRes.memberships || []);
      setDevices(idRes.devices || []);
      setSessions(idRes.sessions || []);
      setMfaConfigs(idRes.mfaConfigs || []);
      setComplianceRecords(cmpRes.records || []);
    } catch (e: any) {
      setStatusMsg(e?.message || 'Failed to load organisation & identity data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await ApiClient.v25CreateOrganisation({ legalName: newOrgName, countryCode: newOrgCountry }, actor);
      setStatusMsg(`Created organisation ${created.code} (${created.legalName}) with strict isolation.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Could not create organisation');
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    try {
      const res = await ApiClient.v25SwitchOrganisation(orgId, actor);
      setStatusMsg(`Active organisation context switched to ${res.activeOrganisation.displayName}.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Context switch blocked');
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await ApiClient.v25CreateSession({ countryCode: 'UG', deviceLabel: 'V25 Console Browser' }, actor);
      setStatusMsg(`Issued rotated session ${res.session.id} (${res.accessTokenHint}).`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Session creation failed');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await ApiClient.v25RevokeSession(sessionId, false, actor);
      setStatusMsg(`Revoked ${res.revokedCount} session cleanly.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Revoke failed');
    }
  };

  const handleIssueMfa = async () => {
    try {
      const res = await ApiClient.v25IssueMfaChallenge({}, actor);
      setMfaChallengeId(res.challengeId);
      setSandboxOtpHint(res.sandboxOtpPreview);
      setMfaCodeInput(res.sandboxOtpPreview);
      setStatusMsg(`MFA challenge ${res.challengeId} issued cleanly.`);
    } catch (err: any) {
      setStatusMsg(err?.message || 'MFA challenge failed');
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallengeId) return;
    try {
      const res = await ApiClient.v25VerifyMfaChallenge({ challengeId: mfaChallengeId, code: mfaCodeInput }, actor);
      setStatusMsg(`MFA verified cleanly at ${res.lastVerifiedAt}.`);
      setMfaChallengeId(null);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'MFA verification failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#D4AF37]">ECONEX V25.0 · MULTI-ORGANISATION GOVERNANCE &amp; ZERO-TRUST IDENTITY</div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Enterprise Hierarchy, Active Org Context, MFA, Devices &amp; 5-Tier KYC/KYB
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            Holding -&gt; Business Units -&gt; Branches -&gt; Memberships · Cross-org &amp; cross-country boundaries enforced server-side.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('v25-command-centre')}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#18181b] text-xs text-[#F5F5F5] cursor-pointer whitespace-nowrap"
          >
            Command Centre
          </button>
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2.5 text-xs font-mono text-[#D4AF37]">
          {statusMsg}
        </div>
      )}

      {/* Create & Switch Organisations */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
            <Building2 size={15} className="text-[#D4AF37]" /> Authorised Organisations ({orgs.length}) · {bus.length} Business Units · {branches.length} Branches
          </h2>
          <form onSubmit={handleCreateOrg} className="flex flex-wrap items-center gap-2">
            <input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Legal Entity Name"
              className="w-60 px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <select
              value={newOrgCountry}
              onChange={(e) => setNewOrgCountry(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
            >
              <option value="UG">UG</option>
              <option value="KE">KE</option>
              <option value="TZ">TZ</option>
              <option value="RW">RW</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs whitespace-nowrap cursor-pointer"
            >
              Create Organisation
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                <th className="py-2 pr-3 font-medium">Code · Legal Name</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Country · CCY</th>
                <th className="py-2 pr-3 font-medium">Compliance Tier</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Active Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e24]">
              {orgs.map((o) => {
                const activeMem = memberships.find((m) => m.organisationId === o.id && m.userId === currentUser?.id);
                return (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-3 font-medium text-[#F5F5F5]">
                      <span className="font-mono text-[#D4AF37] mr-1.5">{o.code}</span>
                      {o.legalName}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[#A0A0A0]">{o.orgType}</td>
                    <td className="py-2.5 pr-3 font-mono text-[#F5F5F5]">{o.countryCode} · {o.defaultCurrency}</td>
                    <td className="py-2.5 pr-3 font-mono text-[#A0A0A0]">{o.complianceTier}</td>
                    <td className="py-2.5 pr-3 font-mono text-emerald-400">{o.status}</td>
                    <td className="py-2.5 text-right">
                      {activeMem?.isActiveContext ? (
                        <span className="text-[11px] font-mono text-[#D4AF37]">ACTIVE CONTEXT</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchOrg(o.id)}
                          className="px-2.5 py-1 rounded border border-[#27272a] hover:border-[#D4AF37] text-[11px] text-[#F5F5F5] cursor-pointer"
                        >
                          Switch Context
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Identity, MFA & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <KeyRound size={15} className="text-[#D4AF37]" /> MFA Verification &amp; Trusted Devices ({devices.length})
            </h2>
            <button
              type="button"
              onClick={handleIssueMfa}
              className="px-3 py-1.5 rounded-lg border border-[#D4AF37] text-[#D4AF37] text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Issue MFA Challenge
            </button>
          </div>
          {mfaChallengeId && (
            <form onSubmit={handleVerifyMfa} className="bg-[#0a0a0c] border border-[#D4AF37]/40 rounded-lg p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-[#A0A0A0]">Sandbox OTP: {sandboxOtpHint}</span>
              <input
                value={mfaCodeInput}
                onChange={(e) => setMfaCodeInput(e.target.value)}
                className="w-28 px-2 py-1 rounded bg-[#121212] border border-[#27272a] font-mono text-[#F5F5F5]"
              />
              <button type="submit" className="px-3 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
                Verify Challenge
              </button>
            </form>
          )}
          <div className="divide-y divide-[#1e1e24] text-xs">
            {mfaConfigs.map((m) => (
              <div key={m.userId} className="py-2 flex items-center justify-between">
                <span className="font-mono text-[#F5F5F5]">{m.userId} · {m.method}</span>
                <span className={m.enabled ? 'font-mono text-emerald-400' : 'font-mono text-amber-400'}>
                  {m.enabled ? 'MFA ENABLED' : 'PENDING'}
                </span>
              </div>
            ))}
            {devices.map((d) => (
              <div key={d.id} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[#F5F5F5] flex items-center gap-1.5">
                    <Smartphone size={12} className="text-[#A0A0A0]" /> {d.deviceLabel}
                  </div>
                  <div className="text-[11px] font-mono text-[#71717a]">{d.userId} · {d.countryCode} · {d.userAgent}</div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">{d.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Users size={15} className="text-[#D4AF37]" /> Active Sessions &amp; Refresh Rotation ({sessions.length})
            </h2>
            <button
              type="button"
              onClick={handleCreateSession}
              className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Issue Session
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="text-xs text-[#71717a]">No rotated V25 sessions created in this workspace yet.</div>
          ) : (
            <div className="divide-y divide-[#1e1e24] text-xs max-h-60 overflow-y-auto">
              {sessions.map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[#F5F5F5]">
                      {s.id} · Org {s.activeOrganisationId}
                    </div>
                    <div className="text-[11px] font-mono text-[#71717a]">
                      {s.userId} · {s.countryCode} · Rotations: {s.refreshRotationCount} · {s.suspiciousFlag ? 'ANOMALY FLAGGED' : 'Normal'}
                    </div>
                  </div>
                  {s.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      className="px-2.5 py-1 rounded border border-red-900 text-red-400 text-[11px] cursor-pointer"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] text-[#71717a]">{s.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5-Tier Compliance Distinction */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
          <ShieldCheck size={15} className="text-[#D4AF37]" /> KYC / KYB / Sanctions Verification Tiers (Explicit Distinction)
        </h2>
        <p className="text-xs text-[#A0A0A0]">
          Strictly separates <span className="font-mono text-[#F5F5F5]">USER_SUBMITTED</span>,{' '}
          <span className="font-mono text-[#F5F5F5]">AUTO_VALIDATED</span>,{' '}
          <span className="font-mono text-[#F5F5F5]">THIRD_PARTY_VERIFIED</span>,{' '}
          <span className="font-mono text-[#F5F5F5]">HUMAN_REVIEWED</span>, and{' '}
          <span className="font-mono text-[#F5F5F5]">GOVERNMENT_VERIFIED</span>.
        </p>
        <div className="divide-y divide-[#1e1e24] text-xs">
          {complianceRecords.map((c) => (
            <div key={c.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium text-[#F5F5F5]">
                  <span className="font-mono text-[#D4AF37] mr-2">{c.verificationCategory}</span>
                  {c.subjectType} {c.subjectId} ({c.countryCode})
                </div>
                <div className="text-[11px] text-[#A0A0A0]">{c.evidenceSummary}</div>
              </div>
              <div className="font-mono text-[11px] text-[#F5F5F5] flex items-center gap-2 shrink-0">
                <CheckCircle2 size={12} className="text-emerald-400" />
                {c.tier} · {c.sanctionsScreeningStatus}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
