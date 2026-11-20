/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V15.0 - Global Economic Operations Control Center (/global-operations)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/apiClient.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Code,
  Compass,
  Database,
  DollarSign,
  Download,
  FileCheck,
  Globe,
  Landmark,
  Layers,
  Lock,
  Network,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  Search,
} from 'lucide-react';
import { ErrorRecoveryPanel } from './ux/CorePrimitives.tsx';
import { sanitizeCsvCell } from '../utils/errorMessages.ts';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

type ControlSection =
  | 'overview'
  | 'participants'
  | 'marketplace'
  | 'financial'
  | 'institutions'
  | 'trade'
  | 'regional'
  | 'infrastructure'
  | 'security'
  | 'commercial'
  | 'impact'
  | 'recovery'
  | 'readiness'
  | 'verification';

type SectionGroup = 'ALL' | 'NETWORK_COMMERCE' | 'FINANCE_INSTITUTIONS' | 'INFRASTRUCTURE_TRUST' | 'IMPACT_LAUNCH';

const SECTIONS: { id: ControlSection; num: string; label: string; group: SectionGroup; tip: string; icon: any }[] = [
  { id: 'overview', num: '01', label: 'Global Network Overview', group: 'NETWORK_COMMERCE', tip: 'Live system summary across participants, gates, and ledger', icon: Globe },
  { id: 'participants', num: '02', label: 'Economic Participants', group: 'NETWORK_COMMERCE', tip: '24 verified & unverified participant categories', icon: Users },
  { id: 'marketplace', num: '03', label: 'Marketplace Activity', group: 'NETWORK_COMMERCE', tip: 'Discovery matching, listings, and order flows', icon: Compass },
  { id: 'financial', num: '04', label: 'Financial Operations', group: 'FINANCE_INSTITUTIONS', tip: 'Payment channels, settlement receipts, and reconciliation', icon: DollarSign },
  { id: 'institutions', num: '05', label: 'Institutional Connectivity', group: 'FINANCE_INSTITUTIONS', tip: 'Partner banks, ministries, and onboarding stages', icon: Landmark },
  { id: 'trade', num: '06', label: 'Trade & Logistics', group: 'NETWORK_COMMERCE', tip: 'Cross-border shipments, customs, and freight corridors', icon: Truck },
  { id: 'regional', num: '07', label: 'Regional Economic Activity', group: 'IMPACT_LAUNCH', tip: 'Uganda primary pilot & EAC corridor performance', icon: Network },
  { id: 'infrastructure', num: '08', label: 'Infrastructure Health', group: 'INFRASTRUCTURE_TRUST', tip: 'Database state, event outbox, and storage', icon: Server },
  { id: 'security', num: '09', label: 'Security & Trust', group: 'INFRASTRUCTURE_TRUST', tip: 'Audit archive, cryptographic keys, and access logs', icon: Lock },
  { id: 'commercial', num: '10', label: 'Commercial Revenue', group: 'FINANCE_INSTITUTIONS', tip: 'Tenant billing, plans, and commercial metrics', icon: BookOpen },
  { id: 'impact', num: '11', label: 'Economic Impact (24)', group: 'IMPACT_LAUNCH', tip: '24 tracked economic & social outcome indicators', icon: TrendingUp },
  { id: 'recovery', num: '12', label: 'Disaster Recovery', group: 'INFRASTRUCTURE_TRUST', tip: 'Backup restoration and recovery verification drills', icon: RefreshCw },
  { id: 'readiness', num: '13', label: 'Production Readiness (20)', group: 'IMPACT_LAUNCH', tip: '20 consolidated launch gates, usability status & Uganda pilot checklist', icon: ShieldCheck },
  { id: 'verification', num: '14', label: 'Verification & Audit', group: 'IMPACT_LAUNCH', tip: 'Schema 15 integrity and V14 rollback verification', icon: FileCheck },
];

function stateTone(state: string): string {
  const s = String(state || '').toUpperCase();
  if (s.includes('VERIFIED') || s === 'COMPLETED' || s === 'BALANCED' || s === 'PASSED_LOCAL_DRILL' || s === 'HEALTHY') {
    return 'text-emerald-400 border-emerald-800/70 bg-emerald-950/30';
  }
  if (s.includes('SANDBOX') || s === 'LOCAL_ONLY' || s === 'ACTIVE_MONITORED') {
    return 'text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/10';
  }
  if (s.includes('BLOCKED') || s === 'FAILED' || s === 'DISPUTED' || s === 'EXCEPTIONS_DETECTED') {
    return 'text-red-400 border-red-800/70 bg-red-950/30';
  }
  return 'text-[#C0C0C0] border-[#27272a] bg-[#181818]';
}

export const V15GlobalOperationsView: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const [section, setSection] = useState<ControlSection>('overview');
  const [sectionSearch, setSectionSearch] = useState<string>('');
  const [sectionGroup, setSectionGroup] = useState<SectionGroup>('ALL');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('2026-11');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const [opsData, setOpsData] = useState<any>(null);
  const [participantsData, setParticipantsData] = useState<any>(null);
  const [marketplaceData, setMarketplaceData] = useState<any>(null);
  const [executionsData, setExecutionsData] = useState<any>(null);
  const [providersData, setProvidersData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [institutionsData, setInstitutionsData] = useState<any>(null);
  const [tradeData, setTradeData] = useState<any>(null);
  const [logisticsData, setLogisticsData] = useState<any>(null);
  const [opportunitiesData, setOpportunitiesData] = useState<any>(null);
  const [industriesData, setIndustriesData] = useState<any>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [commercialData, setCommercialData] = useState<any>(null);
  const [developersData, setDevelopersData] = useState<any>(null);
  const [infraData, setInfraData] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [v14Readiness, setV14Readiness] = useState<any>(null);
  const [v14Regions, setV14Regions] = useState<any>(null);

  // Quick interactive forms
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantCat, setNewParticipantCat] = useState('COOPERATIVE');
  const [discoveryQuery, setDiscoveryQuery] = useState('coffee');
  const [discoveryRes, setDiscoveryRes] = useState<any>(null);

  const actor = useMemo(
    () => ({
      userId: currentUser?.id || 'usr_admin_01',
      userRole: role || 'PLATFORM_ADMIN',
      tenantId: role === 'BUYER' && currentUser?.country === 'KE' ? 'TEN-KE-ROASTERS-03' : 'TEN-UG-ELGON-01',
    }),
    [currentUser?.id, currentUser?.country, role]
  );

  const loadAll = async () => {
    if (role !== 'PLATFORM_ADMIN') {
      setLoading(false);
      setError('403 Forbidden: Administrator permissions are required for Global Operations Control Center.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const jurQ = jurisdictionFilter !== 'ALL' ? jurisdictionFilter : '';
      const [
        ops,
        part,
        mkt,
        execs,
        provs,
        fin,
        inst,
        trd,
        logi,
        opps,
        inds,
        imp,
        comm,
        devs,
        inf,
        sec,
        ver,
        rdy14,
        reg14,
      ] = await Promise.all([
        api.v15GetOperations(actor),
        api.v15GetParticipants(actor, jurQ ? `?jurisdiction=${jurQ}` : ''),
        api.v15GetMarketplace(actor),
        api.v15GetExecutions(actor),
        api.v15GetProviders(actor),
        api.v15GetFinancial(actor),
        api.v15GetInstitutions(actor),
        api.v15GetTrade(actor),
        api.v15GetLogistics(actor),
        api.v15GetOpportunities(actor),
        api.v15GetIndustries(actor),
        api.v15GetImpact(jurQ, actor),
        api.v15GetCommercial(actor),
        api.v15GetDevelopers(actor),
        api.v15GetInfrastructure(actor),
        api.v15GetSecurity(actor),
        api.v15GetVerification(actor),
        api.v14GetReadiness(actor),
        api.v14GetRegions(actor),
      ]);
      setOpsData(ops);
      setParticipantsData(part);
      setMarketplaceData(mkt);
      setExecutionsData(execs);
      setProvidersData(provs);
      setFinancialData(fin);
      setInstitutionsData(inst);
      setTradeData(trd);
      setLogisticsData(logi);
      setOpportunitiesData(opps);
      setIndustriesData(inds);
      setImpactData(imp);
      setCommercialData(comm);
      setDevelopersData(devs);
      setInfraData(inf);
      setSecurityData(sec);
      setVerificationData(ver);
      setV14Readiness(rdy14);
      setV14Regions(reg14);
    } catch (e: any) {
      setError(e?.message || 'Unable to fetch V15 Global Operations Control Center telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role, jurisdictionFilter]);

  const runAction = async (label: string, fn: () => Promise<any>) => {
    setActionBanner(null);
    try {
      const out = await fn();
      setActionBanner(`${label}: ${out?.error || out?.message || 'Completed and persisted to durable WAL.'}`);
      await loadAll();
    } catch (e: any) {
      setActionBanner(`${label} blocked: ${e?.message || 'Operation failed'}`);
    }
  };

  const exportReport = (format: 'json' | 'csv') => {
    const consolidatedGates = opsData?.v159ReadinessGates || opsData?.productionGates;
    const payload = {
      product: 'ECONEX',
      consolidationRelease: opsData?.consolidationRelease || 'V15.9-FINAL-CONSOLIDATION-AND-RELEASE',
      exportedAt: new Date().toISOString(),
      release: opsData?.release,
      schemaVersion: opsData?.schemaVersion,
      jurisdictionFilter,
      periodFilter,
      productionGates: opsData?.productionGates,
      v159ReadinessGates: consolidatedGates,
      pilotOperations: opsData?.pilotOperations,
      impact: impactData,
      verification: verificationData,
    };
    const content =
      format === 'json'
        ? JSON.stringify(payload, null, 2)
        : [
            'metric_number,metric_code,label,value,unit,value_category',
            ...(impactData?.indicators || []).map((i: any) =>
              [
                sanitizeCsvCell(i.metricNumber),
                sanitizeCsvCell(i.metricCode),
                sanitizeCsvCell(i.label),
                sanitizeCsvCell(i.value),
                sanitizeCsvCell(i.unit),
                sanitizeCsvCell(i.valueCategory),
              ].join(',')
            ),
          ].join('\n');
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `econex_v159_operations_${jurisdictionFilter}_${periodFilter}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const readinessSource = opsData?.v159ReadinessGates || opsData?.productionGates;
  const gates = readinessSource?.gateEvaluations || [];
  const gatesPassed = readinessSource?.gatesPassed ?? 0;
  const gatesTotal = readinessSource?.gatesTotal ?? 20;
  const blockers = gates.filter((g: any) => !g.passedForProduction && g.blocker);
  const pilotCohorts = opsData?.pilotOperations || [];
  const usabilityProtocol = opsData?.v159ReadinessGates?.usabilityProtocol;
  const ugandaPilotChecklist = opsData?.v159ReadinessGates?.ugandaPilotChecklist;

  const filteredSections = SECTIONS.filter((s) => {
    if (sectionGroup !== 'ALL' && s.group !== sectionGroup) return false;
    if (sectionSearch.trim() && !`${s.label} ${s.tip}`.toLowerCase().includes(sectionSearch.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  if (role !== 'PLATFORM_ADMIN') {
    return (
      <ErrorRecoveryPanel
        error={error || 'HTTP 403 Forbidden: Administrator workspace access requires PLATFORM_ADMIN role.'}
        statusCode={403}
        isAdmin={false}
        onGoHome={() => onNavigateTab?.('home')}
        onOpenHelp={() => onNavigateTab?.('help')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Control Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Globe size={20} className="text-[#D4AF37]" />
              <h1 className="font-display text-lg font-bold tracking-tight text-[#F5F5F5]">
                ECONEX Operations Control Center
              </h1>
              <span className="font-mono text-[11px] px-2 py-0.5 border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
                V15.9 · SCHEMA {opsData?.schemaVersion || 15}
              </span>
              <span className={`font-mono text-[11px] px-2 py-0.5 border ${stateTone(readinessSource?.productionAllowed ? 'PRODUCTION_VERIFIED' : 'LOCAL_ONLY')}`}>
                {readinessSource?.productionAllowed ? 'PRODUCTION AUTHORIZED' : 'ENGINEERING COMPLETE · CONTROLLED PILOT ONLY'}
              </span>
            </div>
            <p className="text-xs text-[#A0A0A0] mt-1.5">
              Developed under <strong className="text-[#F5F5F5]">VINEXSAH TECHNOLOGIES</strong>. All rights reserved. · Uganda Primary Pilot · EAC &amp; AfCFTA Corridors · Authoritative DB:{' '}
              <span className="font-mono text-[#F5F5F5]">{infraData?.postgres?.authorityState || 'JSON_WAL_ACTIVE'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={jurisdictionFilter}
              onChange={(e) => setJurisdictionFilter(e.target.value)}
              className="bg-[#181818] border border-[#27272a] text-[#F5F5F5] px-2.5 py-1.5 rounded text-xs font-mono"
            >
              <option value="ALL">All Jurisdictions</option>
              <option value="UG">Uganda (UG)</option>
              <option value="KE">Kenya (KE)</option>
              <option value="TZ">Tanzania (TZ)</option>
              <option value="RW">Rwanda (RW)</option>
              <option value="BI">Burundi (BI)</option>
              <option value="SS">South Sudan (SS)</option>
              <option value="CD">DR Congo (CD)</option>
            </select>
            <input
              type="month"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-[#181818] border border-[#27272a] text-[#F5F5F5] px-2.5 py-1.5 rounded text-xs font-mono"
            />
            <button
              onClick={() => exportReport('json')}
              className="px-2.5 py-1.5 bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] rounded flex items-center gap-1.5"
            >
              <Download size={13} /> JSON
            </button>
            <button
              onClick={() => exportReport('csv')}
              className="px-2.5 py-1.5 bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] rounded flex items-center gap-1.5"
            >
              <Download size={13} /> CSV
            </button>
            <button
              onClick={loadAll}
              className="px-3 py-1.5 bg-[#D4AF37] text-black font-semibold rounded flex items-center gap-1.5 hover:bg-[#e5bf43]"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Truthful Infrastructure Blocker Notice */}
        {blockers.length > 0 && (
          <div className="mt-4 p-3 bg-[#181818] border border-red-800/60 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-300">External Production Blockers ({blockers.length} of {gatesTotal} Gates Blocked for Live External Traffic): </strong>
                <span className="text-[#A0A0A0]">
                  {blockers.slice(0, 4).map((b: any) => b.gateName).join(' · ')}
                  {blockers.length > 4 ? ` (+${blockers.length - 4} more)` : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSection('readiness')}
              className="text-[#D4AF37] font-mono underline shrink-0 text-left"
            >
              Inspect {gatesTotal} Gates →
            </button>
          </div>
        )}

        {actionBanner && (
          <div className="mt-3 p-2.5 bg-[#181818] border border-[#D4AF37]/40 rounded text-xs font-mono text-[#D4AF37]">
            {actionBanner}
          </div>
        )}
        {error && (
          <div className="mt-3">
            <ErrorRecoveryPanel
              error={error}
              isAdmin={true}
              onRetry={loadAll}
              onGoHome={() => onNavigateTab?.('home')}
              onOpenHelp={() => onNavigateTab?.('help')}
            />
          </div>
        )}
      </div>

      {/* Section Search & Category Grouping */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-3 text-[#A0A0A0]" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search operations sections"
              placeholder="Search control sections (e.g. financial, recovery, gates)..."
              value={sectionSearch}
              onChange={(e) => setSectionSearch(e.target.value)}
              className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(
              [
                ['ALL', 'All (14)'],
                ['NETWORK_COMMERCE', 'Network & Commerce'],
                ['FINANCE_INSTITUTIONS', 'Finance & Institutions'],
                ['INFRASTRUCTURE_TRUST', 'Infrastructure & Trust'],
                ['IMPACT_LAUNCH', 'Impact & Launch'],
              ] as [SectionGroup, string][]
            ).map(([gId, gLabel]) => (
              <button
                key={gId}
                type="button"
                onClick={() => setSectionGroup(gId)}
                className={`min-h-[36px] px-3 py-1 rounded-lg border cursor-pointer ${
                  sectionGroup === gId
                    ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                    : 'bg-[#181818] text-[#C0C0C0] border-[#27272a]'
                }`}
              >
                {gLabel}
              </button>
            ))}
          </div>
        </div>

        {/* 14-Section Navigation Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
          {filteredSections.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                title={s.tip}
                onClick={() => setSection(s.id)}
                className={`min-h-[42px] px-2.5 py-2 rounded border text-left transition-colors flex items-center gap-2 text-[11px] cursor-pointer ${
                  active
                    ? 'bg-[#181818] border-[#D4AF37] text-[#F5F5F5] font-semibold'
                    : 'bg-[#121212] border-[#27272a] text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#3f3f46]'
                }`}
              >
                <Icon size={13} className={active ? 'text-[#D4AF37] shrink-0' : 'text-[#71717a] shrink-0'} aria-hidden="true" />
                <span className="truncate">
                  <span className="font-mono text-[#71717a] mr-1">{s.num}</span>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 01: GLOBAL NETWORK OVERVIEW */}
      {section === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
              <div className="text-[11px] text-[#A0A0A0]">Registered Participants</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#F5F5F5] mt-1">
                {participantsData?.participants?.length ?? 0}
              </div>
              <div className="text-[11px] text-[#D4AF37] mt-1 font-mono">
                {participantsData?.totalCategoriesSupported || 24} supported categories
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
              <div className="text-[11px] text-[#A0A0A0]">Industry Value Networks</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#F5F5F5] mt-1">
                {industriesData?.totalSectors ?? 16}
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-1">Agriculture → Digital Services</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
              <div className="text-[11px] text-[#A0A0A0]">Production Activation Gates</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#D4AF37] mt-1">
                {gatesPassed} / {gatesTotal}
              </div>
              <div className="text-[11px] text-red-400 mt-1">Live external traffic blocked</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4">
              <div className="text-[11px] text-[#A0A0A0]">V15 Schema Collections</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-emerald-400 mt-1">
                {verificationData?.totalV15Collections ?? 41}
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono">
                Ledger balanced: {String(financialData?.ledgerIntegrity?.journalBalanced ?? true)}
              </div>
            </div>
          </div>

          {/* Controlled Uganda Pilot Operations Monitor */}
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <Sparkles size={15} className="text-[#D4AF37]" /> Controlled Uganda Pilot Operations Monitor
              </h2>
              <span className="font-mono text-[11px] text-[#A0A0A0]">Anchor: Republic of Uganda</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                    <th className="py-2 pr-3">Cohort ID</th>
                    <th className="py-2 pr-3">Pilot Code &amp; Step</th>
                    <th className="py-2 pr-3">Producer → Buyer</th>
                    <th className="py-2 pr-3">Live Rail</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Jurisdiction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23] font-mono">
                  {pilotCohorts.map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-2 pr-3 text-[#D4AF37]">{c.id}</td>
                      <td className="py-2 pr-3 font-sans text-[#F5F5F5]">
                        {c.pilotCode} <span className="text-[#71717a]">(Step {c.currentStepNumber}/16: {c.currentStepName})</span>
                      </td>
                      <td className="py-2 pr-3 text-[11px]">
                        {c.producerParticipantId} → {c.buyerParticipantId}
                      </td>
                      <td className="py-2 pr-3">{String(c.usesLivePaymentRail)}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-1.5 py-0.5 border text-[10px] ${stateTone(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2 text-[#A0A0A0]">{c.jurisdiction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Separated Economic Value Breakdown */}
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#F5F5F5]">Separated Economic Value Pipeline (Anti-Inflation Accounting)</h2>
              <span className="text-[11px] text-[#A0A0A0]">{impactData?.antiMisrepresentationNotice}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.entries(impactData?.measurement?.valueBreakdown || {}).map(([k, v]: any) => (
                <div key={k} className="bg-[#181818] border border-[#27272a] rounded p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#A0A0A0]">{k.replace(/Value$/, '')}</div>
                  <div className="font-mono text-sm font-bold tabular-nums text-[#F5F5F5] mt-1">
                    {Number(v || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 02: ECONOMIC PARTICIPANTS */}
      {section === 'participants' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#F5F5F5]">Global Economic Participant Network (24 Categories)</h2>
              <p className="text-xs text-[#A0A0A0]">Registration does not grant KYC, KYB, or regulatory authorization; verification state is tracked independently.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="New participant display name"
                className="bg-[#181818] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-[#F5F5F5]"
              />
              <select
                value={newParticipantCat}
                onChange={(e) => setNewParticipantCat(e.target.value)}
                className="bg-[#181818] border border-[#27272a] rounded px-2 py-1.5 text-xs text-[#F5F5F5] font-mono"
              >
                {(participantsData?.supportedCategories || []).map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!newParticipantName.trim()) return;
                  runAction('Register Participant', () =>
                    api.v15RegisterParticipant({
                      displayName: newParticipantName.trim(),
                      category: newParticipantCat,
                      jurisdiction: jurisdictionFilter === 'ALL' ? 'UG' : jurisdictionFilter,
                      districtOrCity: 'Kampala',
                    }, actor)
                  );
                  setNewParticipantName('');
                }}
                className="px-3 py-1.5 bg-[#D4AF37] text-black font-semibold rounded text-xs"
              >
                Register
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Participant</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Jurisdiction</th>
                  <th className="py-2 pr-3">Verification Level</th>
                  <th className="py-2 pr-3">Trust Score</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {(participantsData?.participants || []).map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 font-mono text-[#D4AF37]">{p.id}</td>
                    <td className="py-2 pr-3 text-[#F5F5F5] font-medium">{p.displayName}</td>
                    <td className="py-2 pr-3 font-mono text-[11px]">{p.category}</td>
                    <td className="py-2 pr-3 font-mono">{p.jurisdiction} · {p.districtOrCity}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-1.5 py-0.5 border font-mono text-[10px] ${stateTone(p.verificationLevel)}`}>
                        {p.verificationLevel}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{p.trustScore}</td>
                    <td className="py-2">
                      {p.verificationLevel === 'REGISTERED_UNVERIFIED' && (
                        <button
                          onClick={() =>
                            runAction(`Verify ${p.id}`, () =>
                              api.v15VerifyParticipant(p.id, {
                                verificationType: p.category === 'FARMER' || p.category === 'INDIVIDUAL' ? 'KYC_INDIVIDUAL' : 'KYB_BUSINESS',
                                documentReference: `DOC-${p.id}`,
                                decision: 'VERIFIED',
                                notes: 'Admin verification review in Control Center',
                              }, actor)
                            )
                          }
                          className="px-2 py-1 border border-[#D4AF37]/40 text-[#D4AF37] rounded text-[11px] hover:bg-[#D4AF37]/10"
                        >
                          Review &amp; Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 03: MARKETPLACE ACTIVITY */}
      {section === 'marketplace' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#F5F5F5]">Explainable Discovery &amp; Promoted Separation</h2>
              <div className="flex items-center gap-2">
                <input
                  value={discoveryQuery}
                  onChange={(e) => setDiscoveryQuery(e.target.value)}
                  className="bg-[#181818] border border-[#27272a] rounded px-2.5 py-1 text-xs text-[#F5F5F5]"
                  placeholder="Search listings/services..."
                />
                <button
                  onClick={async () => {
                    const r = await api.v15DiscoverySearch({ q: discoveryQuery, includePromoted: 'true' }, actor);
                    setDiscoveryRes(r);
                  }}
                  className="px-3 py-1 bg-[#D4AF37] text-black font-semibold rounded text-xs"
                >
                  Search
                </button>
              </div>
            </div>
            {discoveryRes && (
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#181818] border border-[#27272a] rounded p-3">
                  <div className="font-semibold text-emerald-400 mb-2">Organic Results ({discoveryRes.organicMatches?.length || 0})</div>
                  {(discoveryRes.organicMatches || []).slice(0, 5).map((m: any) => (
                    <div key={m.id} className="py-1.5 border-b border-[#27272a] flex justify-between">
                      <span>{m.title}</span>
                      <span className="font-mono text-[#D4AF37]">Score {m.organicScore}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#181818] border border-[#27272a] rounded p-3">
                  <div className="font-semibold text-[#D4AF37] mb-2">Promoted Placements Separated ({discoveryRes.promotedPlacements?.length || 0})</div>
                  {(discoveryRes.promotedPlacements || []).map((m: any) => (
                    <div key={m.id} className="py-1.5 border-b border-[#27272a]">
                      <div className="flex justify-between">
                        <span>{m.title}</span>
                        <span className="font-mono text-[10px] text-[#A0A0A0]">PROMOTED</span>
                      </div>
                      <div className="text-[10px] text-[#71717a]">{m.promotionDisclosure}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Marketplace Orders (13-Stage Lifecycle) &amp; Verified Executions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                    <th className="py-2 pr-3">Order ID</th>
                    <th className="py-2 pr-3">Buyer → Seller</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Lifecycle State</th>
                    <th className="py-2 pr-3">Settlement</th>
                    <th className="py-2">Delivery Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23] font-mono">
                  {(marketplaceData?.orders || []).map((o: any) => (
                    <tr key={o.id}>
                      <td className="py-2 pr-3 text-[#D4AF37]">{o.id}</td>
                      <td className="py-2 pr-3 text-[#F5F5F5]">{o.buyerParticipantId} → {o.sellerParticipantId}</td>
                      <td className="py-2 pr-3 tabular-nums">{Number(o.totalAmount).toLocaleString()} {o.currency}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-1.5 py-0.5 border text-[10px] ${stateTone(o.lifecycleState)}`}>{o.lifecycleState}</span>
                      </td>
                      <td className="py-2 pr-3">{String(o.settlementVerified)}</td>
                      <td className="py-2">{String(o.deliveryVerified)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 04: FINANCIAL OPERATIONS */}
      {section === 'financial' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#F5F5F5]">8-State Financial Rail Integrations (Provider-Neutral)</h2>
              <button
                onClick={() => runAction('Financial Reconciliation', () => api.v15RunReconciliation({ providerId: 'V15-PROV-MTN-MOMO-UG', currency: 'UGX' }, actor))}
                className="px-3 py-1 bg-[#D4AF37] text-black font-semibold rounded text-xs"
              >
                Run UGX Reconciliation
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(providersData?.providers || []).map((p: any) => (
                <div key={p.id} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-[#F5F5F5]">{p.providerName}</strong>
                    <span className={`px-1.5 py-0.5 border font-mono text-[10px] ${stateTone(p.lifecycleState)}`}>{p.lifecycleState}</span>
                  </div>
                  <div className="text-[#A0A0A0] font-mono text-[11px]">{p.category} · {(p.supportedCurrencies || []).join(', ')}</div>
                  <div className="text-[#71717a] text-[11px]">Credentials configured: {String(p.credentialsConfigured)} · Sandbox validated: {String(p.sandboxValidated)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-2 text-xs">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Per-Currency Double-Entry Ledger Integrity</h2>
            <div className="font-mono text-emerald-400">
              Journal Balanced: {String(financialData?.ledgerIntegrity?.journalBalanced)} · Unverified Settled Blocked: {financialData?.ledgerIntegrity?.unverifiedSettlementsCount ?? 0} · Reconciliations Run: {financialData?.reconciliations?.length ?? 0}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 05: INSTITUTIONAL CONNECTIVITY */}
      {section === 'institutions' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#F5F5F5]">11-State Institutional Connectivity Dashboard</h2>
            <span className="text-[11px] text-[#D4AF37] font-mono">{institutionsData?.disclosure}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                  <th className="py-2 pr-3">Connector</th>
                  <th className="py-2 pr-3">Jurisdiction</th>
                  <th className="py-2 pr-3">Integration Status (11-State)</th>
                  <th className="py-2 pr-3">Official Partner Claimed</th>
                  <th className="py-2">Production Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23] font-mono">
                {(institutionsData?.institutions || []).map((inst: any) => (
                  <tr key={inst.id}>
                    <td className="py-2 pr-3 font-sans text-[#F5F5F5]">{inst.institutionName}</td>
                    <td className="py-2 pr-3">{inst.jurisdiction}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-1.5 py-0.5 border text-[10px] ${stateTone(inst.integrationStatus)}`}>{inst.integrationStatus}</span>
                    </td>
                    <td className="py-2 pr-3 text-[#A0A0A0]">{String(inst.isOfficialPartnerClaimed)}</td>
                    <td className="py-2 text-[#A0A0A0]">{inst.productionStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 06: TRADE & LOGISTICS */}
      {section === 'trade' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Cross-Border Trade Shipments &amp; EAC/AfCFTA Corridors</h2>
            <span className="text-[11px] text-[#A0A0A0]">{tradeData?.disclosure}</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {(tradeData?.corridors || []).map((c: any) => (
              <div key={c.id} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs space-y-1">
                <div className="font-semibold text-[#F5F5F5]">{c.corridorCode}</div>
                <div className="font-mono text-[#D4AF37] text-[11px]">{c.originCountry} → {c.destinationCountry}</div>
                <div className="text-[#A0A0A0] font-mono tabular-nums">
                  Active: {c.activeShipments} · Cleared: {c.clearedShipments}
                </div>
                <div className="text-[#71717a] text-[11px]">{c.bottleneckNote}</div>
              </div>
            ))}
          </div>
          <div className="text-xs font-mono text-[#A0A0A0]">
            Active Trade Shipments: {tradeData?.tradeShipments?.length ?? 0} · Logistics Bookings: {logisticsData?.bookings?.length ?? 0} · Employment/Procurement Opportunities: {(opportunitiesData?.marketOpportunities?.length ?? 0) + (opportunitiesData?.employmentOpportunities?.length ?? 0)}
          </div>
        </div>
      )}

      {/* SECTION 07: REGIONAL ECONOMIC ACTIVITY */}
      {section === 'regional' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-bold text-[#F5F5F5]">Regional Economic Activity &amp; 16-Sector Value Networks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(industriesData?.sectors || []).map((sec: any) => (
              <div key={sec.id} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs space-y-1">
                <div className="font-mono text-[10px] text-[#D4AF37]">{sec.sector}</div>
                <div className="font-semibold text-[#F5F5F5]">{sec.title}</div>
                <div className="text-[#A0A0A0] font-mono text-[11px]">
                  Stages Mapped: {sec.nodesMapped?.length ?? 0} · Jurisdiction: {sec.jurisdiction}
                </div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5 pt-2">
            {(infraData?.regionalServices || v14Regions?.regions || []).map((r: any) => (
              <div key={r.id || r.regionCode} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs flex justify-between">
                <span className="font-mono text-[#F5F5F5]">{r.regionCode} · {r.serviceName || r.role}</span>
                <span className={`px-1.5 py-0.5 border font-mono text-[10px] ${stateTone(r.readinessState || r.replicationStatus)}`}>
                  {r.readinessState || r.replicationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 08: INFRASTRUCTURE HEALTH */}
      {section === 'infrastructure' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Infrastructure Activation &amp; PostgreSQL 16 / Broker Telemetry</h2>
            <button
              onClick={() => runAction('Probe PG16 Authority Cutover Check', () => api.v14RunCutoverCheck({ requestedAuthorityState: 'POSTGRESQL_PRIMARY', platformAdminApproved: true }, actor))}
              className="px-3 py-1 bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] rounded text-xs text-[#F5F5F5]"
            >
              Test Fail-Closed DB Authority Check
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {(infraData?.activations || []).map((inf: any) => (
              <div key={inf.id} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <strong className="text-[#F5F5F5]">{inf.component}</strong>
                  <span className={`px-1.5 py-0.5 border font-mono text-[10px] ${stateTone(inf.currentState)}`}>{inf.currentState}</span>
                </div>
                <div className="text-[#A0A0A0]">{inf.diagnosticMessage}</div>
              </div>
            ))}
          </div>
          <div className="text-xs font-mono text-[#A0A0A0]">
            schema_v15.sql SHA-256: {infraData?.postgres?.schemaV15Sha256} · Event Outbox Total: {infraData?.events?.outboxTotal ?? 0}
          </div>
        </div>
      )}

      {/* SECTION 09: SECURITY & TRUST */}
      {section === 'security' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Security Operations, PKCS#11 HSM Guard &amp; Signed Audit Archives</h2>
            <button
              onClick={() => runAction('Export Signed WORM Archive', () => api.v15ExportWormArchive(actor))}
              className="px-3 py-1 bg-[#D4AF37] text-black font-semibold rounded text-xs"
            >
              Issue Signed Audit Checkpoint
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#181818] border border-[#27272a] rounded p-3">
              <div className="text-[#A0A0A0]">Active RBAC/ABAC Policies</div>
              <div className="font-mono text-xl font-bold text-[#F5F5F5] mt-1">{securityData?.activePoliciesCount ?? 0}</div>
            </div>
            <div className="bg-[#181818] border border-[#27272a] rounded p-3">
              <div className="text-[#A0A0A0]">Open Security Incidents</div>
              <div className="font-mono text-xl font-bold text-[#D4AF37] mt-1">{securityData?.openIncidentCount ?? 0}</div>
            </div>
            <div className="bg-[#181818] border border-[#27272a] rounded p-3">
              <div className="text-[#A0A0A0]">Compromised Keys</div>
              <div className="font-mono text-xl font-bold text-[#F5F5F5] mt-1">{securityData?.compromisedKeysCount ?? 0}</div>
            </div>
            <div className="bg-[#181818] border border-[#27272a] rounded p-3">
              <div className="text-[#A0A0A0]">Local Audit Archives</div>
              <div className="font-mono text-xl font-bold text-emerald-400 mt-1">{securityData?.auditArchivesCount ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 10: COMMERCIAL REVENUE */}
      {section === 'commercial' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Commercial Sustainability (Invoiced vs Collected Revenue Strictly Separated)</h2>
            <span className="font-mono text-[11px] text-[#D4AF37]">{commercialData?.totals?.separationRule}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#181818] border border-[#27272a] rounded p-3">
              <div className="text-[#A0A0A0]">Issued Commercial Invoices (USD Equiv.)</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#F5F5F5] mt-1">
                ${Number(commercialData?.totals?.invoicedAmountUsdEquivalent ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#181818] border border-[#27272a] rounded p-3">
              <div className="text-[#A0A0A0]">Revenue Actually Collected (Verified Settlement Only)</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-emerald-400 mt-1">
                ${Number(commercialData?.totals?.collectedRevenueUsd ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 11: ECONOMIC IMPACT (24 INDICATORS) */}
      {section === 'impact' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#F5F5F5]">24 Verified Economic Impact Indicators</h2>
            <p className="text-xs text-[#A0A0A0]">{impactData?.measurement?.methodologyDisclosure}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {(impactData?.indicators || []).map((ind: any) => (
              <div key={ind.metricNumber} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs">
                <div className="flex justify-between font-mono text-[10px] text-[#71717a]">
                  <span>#{String(ind.metricNumber).padStart(2, '0')}</span>
                  <span>{ind.valueCategory}</span>
                </div>
                <div className="text-[#F5F5F5] font-medium mt-1">{ind.label}</div>
                <div className="font-mono text-lg font-bold tabular-nums text-[#D4AF37] mt-1">
                  {Number(ind.value).toLocaleString()} <span className="text-[10px] text-[#A0A0A0]">{ind.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 12: DISASTER RECOVERY */}
      {section === 'recovery' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Disaster Recovery &amp; Business Continuity Verification</h2>
            <button
              onClick={() => runAction('Run Local Recovery Verification', () => api.v15RunRecoveryVerification({ scenario: 'LOCAL_NODE_CONTROLLED_FAILOVER' }, actor))}
              className="px-3 py-1 bg-[#D4AF37] text-black font-semibold rounded text-xs"
            >
              Execute Recovery Drill
            </button>
          </div>
          <div className="space-y-2">
            {(opsData?.recoveryVerifications || []).map((rec: any) => (
              <div key={rec.id} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs flex flex-wrap justify-between gap-2">
                <div>
                  <strong className="font-mono text-[#D4AF37]">{rec.id}</strong> · <span className="text-[#F5F5F5]">{rec.scenario}</span>
                  <div className="text-[#A0A0A0] font-mono text-[11px]">
                    Mode: {rec.executionMode} · Observed RPO: {rec.observedRpoMinutes}m / Target {rec.targetRpoMinutes}m · Ledger Reconciled: {String(rec.ledgerReconciledPostRecovery)}
                  </div>
                </div>
                <span className={`px-2 py-0.5 border font-mono text-[10px] self-center ${stateTone(rec.status)}`}>{rec.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 13: PRODUCTION READINESS (20 CONSOLIDATED GATES + USABILITY + UGANDA PILOT) */}
      {section === 'readiness' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#F5F5F5]">{gatesTotal} Consolidated Production Readiness Gates</h2>
              <span className="font-mono text-xs text-[#D4AF37]">{gatesPassed} / {gatesTotal} Gates Ready for Live Production</span>
            </div>
            <div className="grid md:grid-cols-2 gap-2.5">
              {gates.map((g: any) => (
                <div key={g.gateNumber} className="bg-[#181818] border border-[#27272a] rounded p-3 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-[#F5F5F5]">
                      <span className="font-mono text-[#D4AF37] mr-1.5">G{String(g.gateNumber).padStart(2, '0')}</span>
                      {g.gateName}
                    </strong>
                    <span className={`px-1.5 py-0.5 border font-mono text-[10px] ${stateTone(g.state)}`}>{g.state}</span>
                  </div>
                  <div className="text-[#A0A0A0]">{g.evidence}</div>
                  {g.blocker && <div className="text-red-400 font-mono text-[11px]">Blocker: {g.blocker}</div>}
                </div>
              ))}
            </div>
          </div>

          {usabilityProtocol && (
            <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#F5F5F5]">Human Usability &amp; Field Validation Protocol</h3>
                <span className="font-mono text-xs px-2 py-0.5 border border-amber-700/70 bg-amber-950/40 text-amber-300">
                  STATUS: {usabilityProtocol.status} · Participants Tested: {usabilityProtocol.participantsTested}
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0]">{usabilityProtocol.disclosure}</p>
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#181818] border border-[#27272a] rounded p-3 space-y-1">
                  <div className="font-semibold text-[#D4AF37]">Target Uganda Personas ({usabilityProtocol.personas?.length || 0})</div>
                  {(usabilityProtocol.personas || []).map((p: any) => (
                    <div key={p.code} className="text-[#C0C0C0]">{p.code}: {p.label} ({p.literacyLevel} · {p.preferredLanguage})</div>
                  ))}
                </div>
                <div className="bg-[#181818] border border-[#27272a] rounded p-3 space-y-1">
                  <div className="font-semibold text-[#D4AF37]">Core Guided Tasks ({usabilityProtocol.coreTasks?.length || 0})</div>
                  {(usabilityProtocol.coreTasks || []).slice(0, 8).map((task: string) => (
                    <div key={task} className="text-[#C0C0C0] truncate">{task}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {ugandaPilotChecklist && (
            <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#F5F5F5]">Controlled Uganda Pilot 14-Step Launch Checklist</h3>
                <span className="font-mono text-xs text-[#D4AF37]">
                  {ugandaPilotChecklist.pilotFocus} · Live Payment Rails: {String(ugandaPilotChecklist.usesLivePaymentRails)}
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0]">{ugandaPilotChecklist.consentTemplateNotice}</p>
              <div className="grid md:grid-cols-2 gap-2 text-xs">
                {(ugandaPilotChecklist.steps || []).map((st: any) => (
                  <div key={st.step} className="bg-[#181818] border border-[#27272a] rounded p-2.5 flex items-center justify-between gap-2">
                    <span className="text-[#F5F5F5]"><span className="font-mono text-[#D4AF37] mr-1">{String(st.step).padStart(2, '0')}.</span>{st.title}</span>
                    <span className="font-mono text-[10px] text-[#A0A0A0] shrink-0">{st.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 14: VERIFICATION & AUDIT */}
      {section === 'verification' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#F5F5F5]">Schema 15 Verification, V14 Rollback Readiness &amp; Developer Sandbox</h2>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('tests')}
                className="px-3 py-1.5 bg-[#D4AF37] text-black font-semibold rounded text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Open 1,160 Automated Verification Suite
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-[#181818] border border-[#27272a] rounded p-3 space-y-1">
              <div className="text-[#D4AF37] font-bold">Schema 15 Migration &amp; V14 Rollback Readiness</div>
              <div>Schema Version: {verificationData?.schemaIntegrity?.schemaVersion} (Valid: {String(verificationData?.schemaIntegrity?.valid)})</div>
              <div>V14 Canonical Backup Valid: {String(verificationData?.rollbackReadiness?.v14BackupValid)}</div>
              <div className="truncate text-[#A0A0A0]">SHA-256: {verificationData?.rollbackReadiness?.checksumSha256}</div>
              <div>Preserved Users: {verificationData?.migrationCompleteness?.preservedUsersCount} · Tenants: {verificationData?.migrationCompleteness?.preservedTenantsCount}</div>
            </div>
            <div className="bg-[#181818] border border-[#27272a] rounded p-3 space-y-1">
              <div className="text-[#D4AF37] font-bold">Developer Ecosystem Sandbox (/api/v15)</div>
              <div>Registered Sandbox Apps: {developersData?.apps?.length ?? 0}</div>
              {(developersData?.apps || []).map((a: any) => (
                <div key={a.id} className="text-[#A0A0A0]">
                  {a.appName} · {a.clientId} · {a.rateLimitPerMinute}/min ({a.secretPreviewRedacted})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const V14GlobalOperationsView = V15GlobalOperationsView;
export default V15GlobalOperationsView;
