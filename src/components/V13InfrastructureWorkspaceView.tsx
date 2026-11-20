/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V13.0 - Distributed Infrastructure, Sovereign Federation & Operations Workspace
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Server,
  Database,
  Radio,
  Globe,
  ShieldCheck,
  Landmark,
  FileKey,
  KeyRound,
  Cpu,
  Bot,
  Activity,
  ShieldAlert,
  FileCheck2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/apiClient.ts';

type V13SectionId =
  | 'overview'
  | 'database'
  | 'events'
  | 'jurisdictions'
  | 'federation'
  | 'connectors'
  | 'certificates'
  | 'crypto-auth'
  | 'forecast-workers'
  | 'ai-workers'
  | 'regions'
  | 'disaster-recovery'
  | 'security-audit'
  | 'verification';

interface V13Props {
  onNavigateTab?: (tab: string) => void;
}

const TRUTH_STYLE: Record<string, string> = {
  PRODUCTION_CONNECTED_AND_VERIFIED: 'text-emerald-400',
  SANDBOX_CONNECTED: 'text-sky-400',
  CONFIGURED: 'text-[#D4AF37]',
  LOCAL_ONLY: 'text-amber-300',
  SIMULATED: 'text-purple-300',
  DEGRADED: 'text-orange-400',
  FAILED: 'text-red-400',
  NOT_CONFIGURED: 'text-[#A0A0A0]',
};

export const V13InfrastructureWorkspaceView: React.FC<V13Props> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const [section, setSection] = useState<V13SectionId>('overview');
  const [tenantId, setTenantId] = useState<string>('TEN-UG-ELGON-01');
  const [loading, setLoading] = useState<boolean>(false);
  const [banner, setBanner] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const [health, setHealth] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbRepl, setDbRepl] = useState<any>(null);
  const [dbMig, setDbMig] = useState<any>(null);
  const [eventStatus, setEventStatus] = useState<any>(null);
  const [consumers, setConsumers] = useState<any[]>([]);
  const [dlqEvents, setDlqEvents] = useState<any[]>([]);
  const [jurisdictions, setJurisdictions] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [enclaves, setEnclaves] = useState<any[]>([]);
  const [connectorsData, setConnectorsData] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [securityKeys, setSecurityKeys] = useState<any>(null);
  const [hsmStatus, setHsmStatus] = useState<any>(null);
  const [workersData, setWorkersData] = useState<any>(null);
  const [experimentsData, setExperimentsData] = useState<any>(null);
  const [regionsData, setRegionsData] = useState<any>(null);
  const [drData, setDrData] = useState<any>(null);

  // Interactive form controls
  const [transferForm, setTransferForm] = useState({
    originJurisdiction: 'UG',
    destinationJurisdiction: 'KE',
    purpose: 'Regional commodity price aggregation briefing',
    ownerConsent: true,
    sendingAuth: true,
    receivingAuth: true,
  });
  const [lastTransferResult, setLastTransferResult] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState('Summarize current maize market risk using verified UG indicators only.');
  const [aiOutput, setAiOutput] = useState<any>(null);

  const actor = {
    tenantId,
    userId: currentUser?.id || 'usr_admin_01',
    userRole: role || 'PLATFORM_ADMIN',
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        h,
        dbs,
        dbr,
        dbm,
        evs,
        cons,
        dlq,
        jurs,
        pols,
        encs,
        conns,
        certs,
        keys,
        hsm,
        wrks,
        exps,
        regs,
        dr,
      ] = await Promise.all([
        api.v13GetOperationsHealth(actor),
        api.v13GetDatabaseStatus(actor),
        api.v13GetDatabaseReplication(actor),
        api.v13GetDatabaseMigrations(actor),
        api.v13GetEventStatus(actor),
        api.v13GetEventConsumers(actor),
        api.v13GetDeadLetterEvents(actor),
        api.v13GetJurisdictions(actor),
        api.v13GetFederationPolicies(actor),
        api.v13GetEnclaves(actor),
        api.v13GetInstitutionalConnectors(actor),
        api.v13GetCertificates(actor),
        api.v13GetSecurityKeys(actor),
        api.v13GetHsmStatus(actor),
        api.v13GetWorkers(actor),
        api.v13GetModelExperiments(actor),
        api.v13GetRegions(actor),
        api.v13GetDisasterRecovery(actor),
      ]);
      setHealth(h);
      setDbStatus(dbs);
      setDbRepl(dbr);
      setDbMig(dbm);
      setEventStatus(evs);
      setConsumers(cons || []);
      setDlqEvents(dlq || []);
      setJurisdictions(jurs || []);
      setPolicies(pols || []);
      setEnclaves(encs || []);
      setConnectorsData(conns);
      setCertificates(certs || []);
      setSecurityKeys(keys);
      setHsmStatus(hsm);
      setWorkersData(wrks);
      setExperimentsData(exps);
      setRegionsData(regs);
      setDrData(dr);
      setBanner(null);
    } catch (err: any) {
      setBanner({
        kind: 'error',
        text: err?.message || 'Access or load error on V13 Infrastructure API.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [tenantId, currentUser?.id, role]);

  const runAction = async (label: string, fn: () => Promise<any>) => {
    try {
      await fn();
      setBanner({ kind: 'info', text: `${label} completed cleanly.` });
      await loadAll();
    } catch (err: any) {
      setBanner({ kind: 'error', text: `${label}: ${err?.message || 'Action blocked'}` });
    }
  };

  const sections: { id: V13SectionId; label: string; icon: any }[] = [
    { id: 'overview', label: '01. Global Infrastructure', icon: Server },
    { id: 'database', label: '02. Database Operations', icon: Database },
    { id: 'events', label: '03. Distributed Events', icon: Radio },
    { id: 'jurisdictions', label: '04. Sovereign Registry', icon: Globe },
    { id: 'federation', label: '05. Data Federation', icon: ShieldCheck },
    { id: 'connectors', label: '06. Institutional Gateways', icon: Landmark },
    { id: 'certificates', label: '07. Certificate Lifecycle', icon: FileKey },
    { id: 'crypto-auth', label: '08. Crypto Authorization', icon: KeyRound },
    { id: 'forecast-workers', label: '09. Forecasting Workers', icon: Cpu },
    { id: 'ai-workers', label: '10. Sovereign AI Workers', icon: Bot },
    { id: 'regions', label: '11. Regional Operations', icon: Activity },
    { id: 'disaster-recovery', label: '12. Disaster Recovery', icon: ShieldAlert },
    { id: 'security-audit', label: '13. Security Audit', icon: FileCheck2 },
    { id: 'verification', label: '14. Infra Verification', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 text-[#F5F5F5]">
      {/* Header Bar */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#A0A0A0]">
            <span className="font-mono text-[#D4AF37] font-semibold">V13.0 Distributed &amp; Sovereign Infrastructure</span>
            <span aria-hidden="true">·</span>
            <span>Schema v{health?.schemaVersion || 13}</span>
            <span aria-hidden="true">·</span>
            <span className={TRUTH_STYLE[health?.database?.truthfulStatus || 'NOT_CONFIGURED']}>
              PostgreSQL: {health?.database?.truthfulStatus || 'NOT_CONFIGURED'}
            </span>
            <span aria-hidden="true">·</span>
            <span className={TRUTH_STYLE[health?.eventNetwork?.truthfulBrokerStatus || 'LOCAL_ONLY']}>
              Event Network: {health?.eventNetwork?.truthfulBrokerStatus || 'LOCAL_ONLY'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-[#F5F5F5] tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Global Sovereign Operations &amp; Distributed Infrastructure
          </h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Developed under VINEXSAH TECHNOLOGIES. Truthful operational states distinguish LOCAL_ONLY single-node active engines from NOT_CONFIGURED external targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="bg-[#181818] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
            aria-label="Tenant Context"
          >
            <option value="TEN-UG-ELGON-01">TEN-UG-ELGON-01 (Elgon Union, UG)</option>
            <option value="TEN-UG-ROOFINGS-02">TEN-UG-ROOFINGS-02 (Kampala Industrial, UG)</option>
            <option value="TEN-KE-ROASTERS-03">TEN-KE-ROASTERS-03 (Nairobi Roasters, KE)</option>
            <option value="TEN-UG-DEVLAB-04">TEN-UG-DEVLAB-04 (Sandbox DevLab, UG)</option>
            <option value="GLOBAL_PUBLIC">GLOBAL_PUBLIC (Platform Scope)</option>
          </select>

          <button
            onClick={loadAll}
            disabled={loading}
            className="px-4 py-2 bg-[#181818] hover:bg-[#222] border border-[#D4AF37]/40 rounded-lg text-xs font-medium text-[#D4AF37] flex items-center gap-2"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
            banner.kind === 'error'
              ? 'bg-red-950/40 border-red-800/70 text-red-200'
              : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
          }`}
        >
          <AlertTriangle size={14} />
          <span>{banner.text}</span>
        </div>
      )}

      {/* 14-Section Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {sections.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center gap-2 ${
                active
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]/50'
              }`}
            >
              <Icon size={14} />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 01: OVERVIEW */}
      {section === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">Active Persistence Node</div>
              <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-1">WAL JSON Single-Node</div>
              <div className="text-xs text-amber-300 mt-1">LOCAL_ONLY · Schema {health?.schemaVersion || 13}</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">PostgreSQL / TimescaleDB</div>
              <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-1">{health?.database?.truthfulStatus || 'NOT_CONFIGURED'}</div>
              <div className="text-xs text-[#A0A0A0] mt-1">DDL Schema Verified · No fake live claim</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">Sovereign Enclaves</div>
              <div className="text-lg font-bold font-mono text-[#D4AF37] mt-1">{enclaves.length} Enclaves</div>
              <div className="text-xs text-[#A0A0A0] mt-1">AES-256-GCM · {jurisdictions.length} Jurisdictions</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">Hardware Security &amp; Approvals</div>
              <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-1">ECDSA P-256 Dual-Auth</div>
              <div className="text-xs text-amber-300 mt-1">Dev HSM: LOCAL_ONLY · Prod HSM: NOT_CONFIGURED</div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#D4AF37]">Versioned Interoperability Contracts</h2>
            <div className="mt-3 divide-y divide-[#27272a]">
              {(regionsData?.contracts || []).map((c: any) => (
                <div key={c.contractName} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#F5F5F5]">{c.contractName}</span>
                    <span className="text-[#A0A0A0] ml-2 font-mono">{c.version}</span>
                  </div>
                  <div className="text-[#C0C0C0]">{c.standardReference}</div>
                  <div className="font-mono text-amber-300">{c.conformanceStatus}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 02: DATABASE OPERATIONS */}
      {section === 'database' && (
        <div className="space-y-4 bg-[#121212] border border-[#27272a] rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">PostgreSQL, TimescaleDB &amp; Shadow Reconciliation</h2>
              <p className="text-xs text-[#A0A0A0]">Dual-write conflict protection prevents split-brain financial writes. V12 canonical backup verified for rollback.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => runAction('Shadow Reconciliation', () => api.v13VerifyDatabase({ mode: 'SHADOW' }, actor))}
                className="px-3 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded-lg"
              >
                Run Shadow Reconciliation
              </button>
              <button
                onClick={() => runAction('Replica Pool Failover Drill', () => api.v13VerifyDatabase({ mode: 'REPLICA_FAILOVER_DRILL' }, actor))}
                className="px-3 py-2 bg-[#181818] border border-[#27272a] text-xs rounded-lg"
              >
                Test Pool Recovery Drill
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[#A0A0A0] border-b border-[#27272a]">
                <tr>
                  <th className="py-2">Node ID</th>
                  <th className="py-2">Engine</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Jurisdiction</th>
                  <th className="py-2">Truthful Status</th>
                  <th className="py-2">TimescaleDB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23] font-mono">
                {(dbStatus?.nodes || []).map((n: any) => (
                  <tr key={n.id}>
                    <td className="py-2.5 text-[#F5F5F5]">{n.id}</td>
                    <td className="py-2.5 text-[#C0C0C0]">{n.engine}</td>
                    <td className="py-2.5">{n.role}</td>
                    <td className="py-2.5">{n.jurisdiction}</td>
                    <td className={`py-2.5 font-semibold ${TRUTH_STYLE[n.connectionStatus]}`}>{n.connectionStatus}</td>
                    <td className="py-2.5">{n.timescaleExtensionDetected ? 'DETECTED' : 'NOT_DETECTED'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#27272a] text-xs">
            <div>
              <div className="text-[#A0A0A0]">Preserved Universal Journal Integrity</div>
              <div className="font-mono mt-1 text-emerald-400">
                Debits: {Number(dbStatus?.financialTotals?.journalDebitUgx || 0).toLocaleString()} UGX · Credits:{' '}
                {Number(dbStatus?.financialTotals?.journalCreditUgx || 0).toLocaleString()} UGX
              </div>
            </div>
            <div>
              <div className="text-[#A0A0A0]">V12 Snapshot Rollback Check ({dbMig?.v12BackupCheck?.v12SchemaVersion ? `v${dbMig.v12BackupCheck.v12SchemaVersion}` : 'verified'})</div>
              <div className="font-mono mt-1 text-[#C0C0C0] truncate">
                SHA-256: {dbMig?.v12BackupCheck?.checksumSha256 || 'N/A'}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#A0A0A0]">
            Replication targets: {(dbRepl?.replicationStates || []).length} configured · HA Claimed: {String(Boolean(dbRepl?.highAvailabilityClaimed))}
          </div>
        </div>
      )}

      {/* SECTION 03: DISTRIBUTED EVENT NETWORK */}
      {section === 'events' && (
        <div className="space-y-4 bg-[#121212] border border-[#27272a] rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Transactional Outbox, Idempotent Consumers &amp; DLQ Replay</h2>
              <p className="text-xs text-[#A0A0A0]">At-least-once delivery with idempotency suppression. SETTLED events never override authoritative provider verification.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  runAction('Publish Economic Event', () =>
                    api.v13PublishEvent(
                      {
                        eventType: 'ECONOMIC_INDICATOR_UPDATED',
                        jurisdiction: 'UG',
                        payloadReference: 'IND-UG-MAIZE-WHOLESALE',
                        payloadSummary: { priceUGX: 1350, note: 'Telemetry pulse' },
                      },
                      actor
                    )
                  )
                }
                className="px-3 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded-lg"
              >
                Publish Outbox Event
              </button>
              <button
                onClick={() => runAction('Outbox Replay', () => api.v13ReplayEvents({}, actor))}
                className="px-3 py-2 bg-[#181818] border border-[#27272a] text-xs rounded-lg"
              >
                Replay Outbox Safely
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-[#181818] p-3 rounded-lg">Outbox Total: {eventStatus?.outboxTotal || 0}</div>
            <div className="bg-[#181818] p-3 rounded-lg">Inbox Processed: {eventStatus?.inboxProcessed || 0}</div>
            <div className="bg-[#181818] p-3 rounded-lg">Dupes Suppressed: {eventStatus?.duplicatesSuppressed || 0}</div>
            <div className="bg-[#181818] p-3 rounded-lg">DLQ Quarantined: {dlqEvents.length}</div>
          </div>

          <div className="text-xs">
            <div className="font-semibold text-[#D4AF37] mb-2">Active Consumer Groups ({consumers.length})</div>
            <div className="space-y-1.5 font-mono">
              {consumers.map((c) => (
                <div key={c.id} className="bg-[#181818] px-3 py-2 rounded flex flex-wrap justify-between gap-2">
                  <span>{c.consumerGroup}</span>
                  <span className="text-[#A0A0A0]">{c.deliverySemantics}</span>
                  <span>Ack: {c.ackCount} · Dupes Suppressed: {c.duplicateSuppressedCount}</span>
                  <span className={c.status === 'ACTIVE' ? 'text-emerald-400' : 'text-orange-400'}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 04: SOVEREIGN JURISDICTIONS */}
      {section === 'jurisdictions' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold">Sovereign Jurisdiction Registry &amp; Residency Boundaries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {jurisdictions.map((j) => (
              <div key={j.code} className="bg-[#181818] border border-[#27272a] rounded-lg p-4 text-xs space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#D4AF37]">{j.code} — {j.name}</span>
                  <span className="font-mono text-[#C0C0C0]">{j.regionalBloc}</span>
                </div>
                <div className="text-[#A0A0A0]">{j.localAdministrativeAuthority}</div>
                <div className="font-mono text-[#F5F5F5]">
                  Residency: {j.residencyRequirement} · Default Transfer: {j.defaultCrossBorderPolicy}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-[#A0A0A0]">Active Sovereign Data Policies: {policies.length} rules configured.</div>
        </div>
      )}

      {/* SECTION 05: DATA FEDERATION & CROSS-BORDER EXCHANGE */}
      {section === 'federation' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold">Sovereign Enclaves &amp; Governed Cross-Border Transfer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enclaves.map((e) => (
              <div key={e.id} className="bg-[#181818] border border-[#27272a] rounded-lg p-3.5 text-xs space-y-1">
                <div className="font-semibold text-[#D4AF37]">{e.enclaveName} ({e.jurisdictionCode})</div>
                <div className="font-mono text-[#C0C0C0]">{e.encryptionAlgorithm} · {e.keyId}</div>
                <div className="text-[#A0A0A0]">Enclave Audits: {e.auditCount}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#27272a] pt-4 space-y-3 text-xs">
            <div className="font-semibold text-[#F5F5F5]">Governed Cross-Border Exchange Request</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={transferForm.originJurisdiction}
                onChange={(e) => setTransferForm({ ...transferForm, originJurisdiction: e.target.value })}
                className="bg-[#181818] border border-[#27272a] rounded px-3 py-2"
              >
                <option value="UG">Origin: UG</option>
                <option value="KE">Origin: KE</option>
                <option value="TZ">Origin: TZ</option>
                <option value="RW">Origin: RW</option>
              </select>
              <select
                value={transferForm.destinationJurisdiction}
                onChange={(e) => setTransferForm({ ...transferForm, destinationJurisdiction: e.target.value })}
                className="bg-[#181818] border border-[#27272a] rounded px-3 py-2"
              >
                <option value="KE">Destination: KE</option>
                <option value="UG">Destination: UG</option>
                <option value="TZ">Destination: TZ</option>
                <option value="RW">Destination: RW</option>
              </select>
              <input
                value={transferForm.purpose}
                onChange={(e) => setTransferForm({ ...transferForm, purpose: e.target.value })}
                className="bg-[#181818] border border-[#27272a] rounded px-3 py-2"
                placeholder="Authorized purpose"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-[#C0C0C0]">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={transferForm.ownerConsent} onChange={(e) => setTransferForm({ ...transferForm, ownerConsent: e.target.checked })} />
                Owner Consent
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={transferForm.sendingAuth} onChange={(e) => setTransferForm({ ...transferForm, sendingAuth: e.target.checked })} />
                Sending Jurisdiction Auth
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={transferForm.receivingAuth} onChange={(e) => setTransferForm({ ...transferForm, receivingAuth: e.target.checked })} />
                Receiving Jurisdiction Auth
              </label>
            </div>
            <button
              onClick={() =>
                runAction('Cross-Border Data Exchange', async () => {
                  const res = await api.v13CreateCrossBorderTransfer(
                    {
                      originJurisdiction: transferForm.originJurisdiction,
                      destinationJurisdiction: transferForm.destinationJurisdiction,
                      dataClassification: 'RESTRICTED',
                      dataCategory: 'MARKET_OBSERVATIONS',
                      dataOwnerConsentGranted: transferForm.ownerConsent,
                      sendingJurisdictionAuthorized: transferForm.sendingAuth,
                      receivingJurisdictionAuthorized: transferForm.receivingAuth,
                      purpose: transferForm.purpose,
                      requestedFields: ['maizeIndexUGX', 'passwordHash'],
                    },
                    actor
                  );
                  setLastTransferResult(res.transfer);
                })
              }
              className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg"
            >
              Execute Authorized Exchange
            </button>
            {lastTransferResult && (
              <div className="bg-[#181818] p-3 rounded font-mono text-xs">
                Transfer {lastTransferResult.id} · Status: {lastTransferResult.status} · Minimized Fields:{' '}
                {lastTransferResult.minimizedFields?.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 06: INSTITUTIONAL CONNECTORS */}
      {section === 'connectors' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold">Institutional Target Connector Registry (Truthful Connection State)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[#A0A0A0] border-b border-[#27272a]">
                <tr>
                  <th className="py-2">Institution Target</th>
                  <th className="py-2">Jur</th>
                  <th className="py-2">Protocol</th>
                  <th className="py-2">Sandbox</th>
                  <th className="py-2">Production</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {(connectorsData?.connectors || []).map((c: any) => (
                  <tr key={c.id}>
                    <td className="py-2.5 text-[#F5F5F5]">{c.institutionName}</td>
                    <td className="py-2.5 font-mono">{c.jurisdiction}</td>
                    <td className="py-2.5 font-mono">{c.protocol}</td>
                    <td className={`py-2.5 font-mono ${TRUTH_STYLE[c.sandboxStatus]}`}>{c.sandboxStatus}</td>
                    <td className={`py-2.5 font-mono ${TRUTH_STYLE[c.productionStatus]}`}>{c.productionStatus}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => runAction(`Test ${c.id}`, () => api.v13TestInstitutionalConnector(c.id, actor))}
                        className="px-2.5 py-1 bg-[#181818] border border-[#27272a] rounded hover:border-[#D4AF37]"
                      >
                        Run Diagnostics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 07: CERTIFICATES */}
      {section === 'certificates' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold">Mutual TLS Client Certificate Registry</h2>
          <div className="space-y-2 text-xs">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-[#181818] border border-[#27272a] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono font-semibold text-[#F5F5F5]">{cert.commonName}</div>
                  <div className="text-[#A0A0A0]">{cert.issuer} · Valid Until {cert.validTo.slice(0, 10)}</div>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className={cert.status === 'VALID_DEV_TEST' ? 'text-amber-300' : 'text-red-400'}>{cert.status}</span>
                  <button
                    onClick={() => runAction(`Rotate ${cert.id}`, () => api.v13CertificateLifecycle(cert.id, 'ROTATE', undefined, actor))}
                    className="px-2.5 py-1 bg-[#121212] border border-[#27272a] rounded"
                  >
                    Rotate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 08: CRYPTO AUTHORIZATION & HSM */}
      {section === 'crypto-auth' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Hardware Security Module Adapters &amp; Cryptographic Level 5 Dual Approval</h2>
              <p className="text-xs text-[#A0A0A0]">Production keys never fall back to dev keys. Signatures bind to SHA-256 canonical operation payload hashes.</p>
            </div>
            <button
              onClick={() =>
                runAction('Create Dual-Approval Request', () =>
                  api.v13CreateApprovalRequest(
                    { actionType: 'SOVEREIGN_CORRIDOR_SETTLEMENT_POLICY', jurisdiction: 'UG', operationPayload: { limitUGX: 50000000 } },
                    actor
                  )
                )
              }
              className="px-3 py-2 bg-[#D4AF37] text-black font-semibold text-xs rounded-lg"
            >
              New Signed Approval Request
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {(hsmStatus?.modules || []).map((m: any) => (
              <div key={m.id} className="bg-[#181818] p-3.5 rounded-lg border border-[#27272a]">
                <div className="font-semibold">{m.providerName}</div>
                <div className={`font-mono mt-1 ${TRUTH_STYLE[m.status]}`}>Status: {m.status} · Scope: {m.environmentScope}</div>
                <div className="text-[#A0A0A0] mt-1">{m.fipsLevelNote}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-semibold text-[#D4AF37]">ECDSA Signing Keys (Secrets Redacted)</div>
            {(securityKeys?.keys || []).map((k: any) => (
              <div key={k.id} className="bg-[#181818] p-3 rounded flex flex-wrap justify-between items-center gap-2 font-mono">
                <span>{k.id} v{k.version} ({k.algorithm})</span>
                <span className="text-amber-300">{k.environmentScope} · {k.status}</span>
                <button
                  onClick={() => runAction(`Rotate ${k.id}`, () => api.v13KeyLifecycle(k.id, 'ROTATE', actor))}
                  className="px-2.5 py-1 bg-[#121212] border border-[#27272a] rounded"
                >
                  Rotate Key
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 09: FORECASTING WORKERS & WALK-FORWARD VALIDATION */}
      {section === 'forecast-workers' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Distributed Forecasting Workers &amp; Walk-Forward Validation</h2>
              <p className="text-xs text-[#A0A0A0]">SARIMA, Seasonal Regression &amp; Ensemble validation strictly enforcing chronological split without data leakage.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  runAction('Walk-Forward Validation', () =>
                    api.v13RunModelValidation(
                      {
                        experimentId: 'EXP-SARIMA-MAIZE-V1',
                        indicatorId: 'IND-UG-MAIZE-WHOLESALE',
                        method: 'SARIMA_SEASONAL',
                        windowType: 'WALK_FORWARD_EXPANDING',
                      },
                      actor
                    )
                  )
                }
                className="px-3 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded-lg"
              >
                Run Walk-Forward Validation
              </button>
              <button
                onClick={() =>
                  runAction('Dispatch Worker Job', () =>
                    api.v13ScheduleForecastJob({ indicatorId: 'IND-UG-MAIZE-WHOLESALE', method: 'SARIMA_SEASONAL', horizon: 'NEAR_TERM' }, actor)
                  )
                }
                className="px-3 py-2 bg-[#181818] border border-[#27272a] text-xs rounded-lg"
              >
                Schedule Worker Job
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {(workersData?.forecastingWorkers || []).map((w: any) => (
              <div key={w.id} className="bg-[#181818] p-3.5 rounded-lg border border-[#27272a]">
                <div className="font-semibold">{w.workerName}</div>
                <div className="font-mono text-emerald-400 mt-1">{w.status} · {w.hardwareTier} · Scope: {w.jurisdictionScope}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs">
            {(experimentsData?.experiments || []).map((exp: any) => (
              <div key={exp.id} className="bg-[#181818] p-3 rounded font-mono flex flex-wrap justify-between gap-2">
                <span>{exp.modelName} ({exp.method})</span>
                <span>Stage: {exp.lifecycleStage}</span>
                <span>Out-of-Sample MAPE: {exp.outOfSampleMapePct}% vs Baseline: {exp.baselineMapePct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 10: SOVEREIGN AI WORKERS */}
      {section === 'ai-workers' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold">Distributed Sovereign AI Inference Workers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {(workersData?.aiWorkers || []).map((w: any) => (
              <div key={w.id} className="bg-[#181818] p-3.5 rounded-lg border border-[#27272a]">
                <div className="font-semibold text-[#D4AF37]">{w.workerName}</div>
                <div className="font-mono mt-1">Jurisdiction: {w.jurisdiction} · Mode: {w.inferenceMode} · Status: {w.status}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 bg-[#181818] border border-[#27272a] rounded-lg px-3 py-2"
            />
            <button
              onClick={() =>
                runAction('Sovereign AI Worker Inference', async () => {
                  const res = await api.v13RunSovereignAIWorker('AIW-UG-SOV-01', { jurisdiction: 'UG', prompt: aiPrompt }, actor);
                  setAiOutput(res);
                })
              }
              className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg"
            >
              Execute on UG Sovereign Worker
            </button>
          </div>
          {aiOutput && (
            <div className="bg-[#181818] border border-[#27272a] rounded-lg p-3 text-xs whitespace-pre-wrap">
              {aiOutput.answer}
            </div>
          )}
        </div>
      )}

      {/* SECTION 11: REGIONAL OPERATIONS */}
      {section === 'regions' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
          <h2 className="text-base font-semibold">Multi-Region Service Topology &amp; Targets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {(regionsData?.regions || []).map((r: any) => (
              <div key={r.id} className="bg-[#181818] border border-[#27272a] rounded-lg p-3.5">
                <div className="font-semibold">{r.displayName}</div>
                <div className={`font-mono mt-1 ${TRUTH_STYLE[r.status]}`}>
                  {r.regionCode} ({r.jurisdiction}) · {r.status}
                </div>
                <div className="text-[#A0A0A0] mt-1 font-mono">
                  Targets: RPO &le; {r.rpoTargetMinutes}m · RTO &le; {r.rtoTargetMinutes}m · Replicas: {r.activeReadReplicas}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 12: DISASTER RECOVERY */}
      {section === 'disaster-recovery' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Disaster Recovery Drills &amp; Post-Recovery Financial Reconciliation</h2>
              <p className="text-xs text-[#A0A0A0]">Zero duplicate financial execution or unverified COMPLETED transactions permitted during failure drills.</p>
            </div>
            <button
              onClick={() =>
                runAction('Execute Database Outage DR Drill', () =>
                  api.v13TriggerRecoveryTest({ scenarioType: 'DATABASE_OUTAGE', affectedRegion: 'af-east-ug' }, actor)
                )
              }
              className="px-3 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded-lg"
            >
              Execute DB Outage DR Drill
            </button>
          </div>
          <div className="space-y-2 text-xs font-mono">
            {(drData?.events || []).map((ev: any) => (
              <div key={ev.id} className="bg-[#181818] p-3 rounded flex flex-wrap justify-between gap-2">
                <span>{ev.scenarioType} ({ev.affectedRegion})</span>
                <span>RPO {ev.rpoObservedSeconds}s · RTO {ev.rtoObservedSeconds}s</span>
                <span className={ev.status === 'PASSED' ? 'text-emerald-400' : 'text-red-400'}>
                  {ev.status} · Financial Reconciled: {String(ev.financialReconciliationPassed)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 13: SECURITY AUDIT CHECKPOINTS */}
      {section === 'security-audit' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Signed Hash-Chain Audit Checkpoints</h2>
              <p className="text-xs text-[#A0A0A0]">Detects retrospective tampering in local records; external WORM anchoring required for external legal immutability.</p>
            </div>
            <button
              onClick={() => runAction('Issue Signed Audit Checkpoint', () => api.v13IssueAuditCheckpoint(actor))}
              className="px-3 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded-lg"
            >
              Issue Signed Checkpoint
            </button>
          </div>
          <div className="space-y-2 text-xs font-mono">
            {(securityKeys?.auditCheckpoints || []).map((cp: any) => (
              <div key={cp.id} className="bg-[#181818] p-3 rounded space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#D4AF37]">{cp.id}</span>
                  <span className="text-emerald-400">Verified: {String(cp.integrityVerified)}</span>
                </div>
                <div className="text-[#A0A0A0] truncate">Root: {cp.merkleOrChainRootHash}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 14: VERIFICATION LINK */}
      {section === 'verification' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
          <h2 className="text-base font-semibold">700-Point Infrastructure &amp; Regression Verification Suite</h2>
          <p className="text-[#A0A0A0]">
            V13 expands system verification from 550 assertions (`T01–T550`) to 700 assertions (`T01–T700`) covering PostgreSQL/TimescaleDB migration &amp; reconciliation, durable event replay, sovereign enclaves, mTLS certificates, ECDSA dual authorization, walk-forward forecasting, AI worker isolation, and resilience drills.
          </p>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('tests')}
              className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg"
            >
              Open System Verification Suite (700 Tests)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
