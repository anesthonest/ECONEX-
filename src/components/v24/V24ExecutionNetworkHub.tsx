/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V24.0 - Universal Commerce, Supply Chain & Economic Execution Network Hub
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Database,
  Globe,
  KeyRound,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Webhook,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V24ApiClientCredential,
  V24CommercialParticipant,
  V24ParticipantOrgType,
  V24PostgresDryRunReport,
  V24SectorClassification,
  V24WebhookDelivery,
  V24WebhookSubscription,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const ORG_TYPES: V24ParticipantOrgType[] = [
  'INDIVIDUAL',
  'SOLE_TRADER',
  'SME',
  'LARGE_ENTERPRISE',
  'MANUFACTURER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'RETAILER',
  'IMPORTER',
  'EXPORTER',
  'SERVICE_PROVIDER',
  'CONTRACTOR',
  'COOPERATIVE',
  'PROFESSIONAL_FIRM',
  'LOGISTICS_PROVIDER',
  'INSTITUTION',
  'PUBLIC_PROCUREMENT_ENTITY',
];

const AI_TASKS = [
  { id: 'SUPPLIER_COMPARISON', label: 'Supplier Quotation Comparison' },
  { id: 'PROCUREMENT_PREPARATION', label: 'Procurement Preparation Check' },
  { id: 'ORDER_RISK_CHECK', label: 'Order & Delivery Risk Review' },
  { id: 'NEGOTIATION_SUMMARY', label: 'Negotiation Summary' },
  { id: 'DOCUMENT_DRAFT', label: 'Commercial Document Draft' },
  { id: 'INVENTORY_REORDER_ADVISORY', label: 'Inventory & ATP Advisory' },
  { id: 'SUPPLY_CHAIN_BOTTLENECK', label: 'Supply Chain Bottleneck Analysis' },
  { id: 'PROJECT_STATUS_SUMMARY', label: 'Project Milestone Summary' },
  { id: 'BUSINESS_SUMMARY', label: 'Commercial Operations Summary' },
  { id: 'MULTILINGUAL_ASSIST', label: 'Multilingual Trade Assistance' },
];

function fmtMinor(minor: number, currency = 'UGX'): string {
  const major = Number(minor || 0) / 100;
  return `${currency} ${major.toLocaleString('en-US', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export const V24ExecutionNetworkHub: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = useMemo(
    () => ({ userId: currentUser?.id || 'usr_buyer_01', userRole: role }),
    [currentUser?.id, role]
  );

  const [section, setSection] = useState<'OVERVIEW' | 'PARTICIPANTS' | 'AI_ASSIST' | 'INTEROP'>('OVERVIEW');
  const [sectors, setSectors] = useState<V24SectorClassification[]>([]);
  const [sectorGroupFilter, setSectorGroupFilter] = useState<string>('ALL');
  const [participants, setParticipants] = useState<V24CommercialParticipant[]>([]);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [readiness, setReadiness] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any>(null);

  // Onboarding form
  const [displayName, setDisplayName] = useState<string>('');
  const [orgType, setOrgType] = useState<V24ParticipantOrgType>('SME');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('SEC-AGRI');
  const [countryCode, setCountryCode] = useState<string>('UG');
  const [location, setLocation] = useState<string>('Kampala');
  const [description, setDescription] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(true);

  // AI Assist state
  const [aiTask, setAiTask] = useState<string>('SUPPLIER_COMPARISON');
  const [aiPrompt, setAiPrompt] = useState<string>(
    'Compare active quotations and current warehouse stock risks for upcoming commercial fulfillment.'
  );
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Interop & Schema 22
  const [credentials, setCredentials] = useState<V24ApiClientCredential[]>([]);
  const [webhooks, setWebhooks] = useState<V24WebhookSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<V24WebhookDelivery[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState<string>('ERP Order Feed Client');
  const [issuedRawSecret, setIssuedRawSecret] = useState<string | null>(null);
  const [pgAudit, setPgAudit] = useState<V24PostgresDryRunReport | null>(null);
  const [rollbackInfo, setRollbackInfo] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadHub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [secRes, partRes, intelRes, matrixRes, credRes, whRes] = await Promise.all([
        ApiClient.v24GetSectors(),
        ApiClient.v24GetParticipants({}, actor),
        ApiClient.v24GetIntelligence(actor),
        ApiClient.v24GetReadinessMatrix(),
        ApiClient.v24GetApiCredentials(actor),
        ApiClient.v24GetWebhooks(actor),
      ]);
      setSectors(secRes.sectors || []);
      setParticipants(partRes.participants || []);
      setIntelligence(intelRes);
      setReadiness(matrixRes.flags || {});
      setCredentials(credRes.credentials || []);
      setWebhooks(whRes.webhooks || []);
      setDeliveries(whRes.deliveries || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Commerce Execution Network.');
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

  const sectorGroups = useMemo(() => {
    const groups = Array.from(new Set(sectors.map((s) => s.groupName)));
    return ['ALL', ...groups];
  }, [sectors]);

  const visibleSectors = useMemo(() => {
    if (sectorGroupFilter === 'ALL') return sectors;
    return sectors.filter((s) => s.groupName === sectorGroupFilter);
  }, [sectors, sectorGroupFilter]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24Search(searchQuery, actor);
      setSearchResults(res);
    } catch (err: any) {
      setError(err?.message || 'Search failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v24RegisterParticipant(
        {
          displayName,
          organizationType: orgType,
          sectorIds: [selectedSectorId],
          operatingCountries: [countryCode],
          operatingLocations: [location],
          description: description || displayName,
          consentGiven,
        },
        actor
      );
      setFeedback(`Registered commercial participant ${res.participant?.displayName} (${res.participant?.id}).`);
      setDisplayName('');
      setDescription('');
      await loadHub();
    } catch (err: any) {
      setError(err?.message || 'Unable to register participant.');
    } finally {
      setBusy(false);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setError(null);
    try {
      const res = await ApiClient.v24AskAiAssist(
        {
          taskType: aiTask,
          prompt: aiPrompt,
          contextData: {
            sectorsActive: sectors.length,
            participantsCount: participants.length,
            actualOrdersCount: intelligence?.actualMetrics?.ordersCount ?? 0,
            sandboxOrdersCount: intelligence?.sandboxMetrics?.ordersCount ?? 0,
          },
        },
        actor
      );
      setAiResult(res);
    } catch (err: any) {
      setError(err?.message || 'AI advisory request failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleIssueCredential = async () => {
    setBusy(true);
    setError(null);
    setIssuedRawSecret(null);
    try {
      const res = await ApiClient.v24IssueApiCredential(
        { label: newKeyLabel, scopes: ['orders:read', 'inventory:read', 'documents:read'] },
        actor
      );
      setIssuedRawSecret(res.oneTimeToken || res.rawApiKey || null);
      setFeedback(`Issued scoped credential ${res.credential?.keyPrefix}... (secret shown once).`);
      await loadHub();
    } catch (err: any) {
      setError(err?.message || 'Unable to issue API credential.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeCredential = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24RevokeApiCredential(id, actor);
      setFeedback(`Revoked API credential ${id}.`);
      await loadHub();
    } catch (err: any) {
      setError(err?.message || 'Unable to revoke API credential.');
    } finally {
      setBusy(false);
    }
  };

  const handleTriggerWebhook = async (subscriptionId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24DeliverWebhook(
        {
          subscriptionId,
          eventType: 'v24.order.confirmed',
          payload: { triggeredBy: actor.userId, at: new Date().toISOString() },
        },
        actor
      );
      setFeedback(`Webhook delivery queued/logged: ${res.delivery?.id} (${res.delivery?.status}).`);
      await loadHub();
    } catch (err: any) {
      setError(err?.message || 'Webhook delivery failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRunPgAudit = async () => {
    setBusy(true);
    setError(null);
    try {
      const [auditRes, rbRes] = await Promise.all([
        ApiClient.v24RunPostgresAudit(actor),
        ApiClient.v24GetRollbackReadiness(actor),
      ]);
      setPgAudit(auditRes.report || null);
      setRollbackInfo(rbRes);
      setFeedback('Schema 22 PostgreSQL dry-run audit completed.');
    } catch (err: any) {
      setError(err?.message || 'Only Platform Administrators can execute Schema 22 dry-run audit.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Surface */}
      <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-[#D4AF37]">
              ECONEX V24.0 · Universal Commerce & Execution Network
            </div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] tracking-tight">
              Commerce, Supply Chain & Economic Execution Hub
            </h1>
            <p className="text-sm text-[#A0A0A0] max-w-3xl">
              Multi-sector commercial discovery, RFQ negotiation, 18-state order fulfilment, ATP warehouse ledgers,
              segregated procurement, manufacturing BOMs, corridor logistics, and V23 sandbox wallet obligations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadHub}
              disabled={loading}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-[#27272a] bg-[#181818] text-xs font-medium text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v24-marketplace-rfq')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold hover:bg-[#e5bf43] flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Marketplace & RFQs</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Truthful Governance Strip */}
        <div className="border-t border-[#27272a] pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A0A0A0]">
          <div>
            <span className="text-[#F5F5F5] font-medium">Authority Mode:</span> Local JSON WAL Authoritative
            · PostgreSQL Cutover Complete: <span className="font-mono text-[#F5F5F5]">false</span>
          </div>
          <div>
            <span className="text-[#F5F5F5] font-medium">Payment Settlement:</span> V23 Sandbox Wallet Engine
            · External Live Gateways: <span className="font-mono text-[#F5F5F5]">false</span>
          </div>
          <div>
            <span className="text-[#F5F5F5] font-medium">AI Execution Policy:</span> Advisory Drafts Only
            · Human Confirmation Required: <span className="font-mono text-emerald-400">true</span>
          </div>
        </div>

        {/* Segmented Sub-Navigation */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg w-fit">
          {(
            [
              { id: 'OVERVIEW', label: 'Network & Sectors' },
              { id: 'PARTICIPANTS', label: 'Commercial Participants' },
              { id: 'AI_ASSIST', label: 'Commerce AI Assist' },
              { id: 'INTEROP', label: 'APIs, Webhooks & Schema 22' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                section === tab.id
                  ? 'bg-[#D4AF37] text-[#050505] font-semibold'
                  : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div role="alert" className="bg-red-950/30 border border-red-800 rounded-xl px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl px-4 py-3 text-xs text-emerald-300">
          {feedback}
        </div>
      )}

      {/* Quick Module Launchers & Metrics */}
      {section === 'OVERVIEW' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-[#A0A0A0]">Active Economic Sectors</div>
              <div className="text-2xl font-display font-bold font-mono tabular-nums text-[#F5F5F5]">
                {sectors.length}
              </div>
              <div className="text-xs text-[#A0A0A0]">Goods · Services · Manufacturing · Infrastructure</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-[#A0A0A0]">Commercial Participants</div>
              <div className="text-2xl font-display font-bold font-mono tabular-nums text-[#F5F5F5]">
                {participants.length}
              </div>
              <div className="text-xs text-[#A0A0A0]">Linked to V23 Permanent EUWNs</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-[#A0A0A0]">Actual Non-Test Orders</div>
              <div className="text-2xl font-display font-bold font-mono tabular-nums text-[#D4AF37]">
                {intelligence?.actualMetrics?.ordersCount ?? 0}
              </div>
              <div className="text-xs text-[#A0A0A0] font-mono tabular-nums">
                Volume: {fmtMinor(intelligence?.actualMetrics?.volumeMinor ?? 0, 'UGX')}
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-1.5">
              <div className="text-xs text-[#A0A0A0]">Sandbox & Test Orders</div>
              <div className="text-2xl font-display font-bold font-mono tabular-nums text-[#C0C0C0]">
                {intelligence?.sandboxMetrics?.ordersCount ?? 0}
              </div>
              <div className="text-xs text-[#A0A0A0] font-mono tabular-nums">
                Cohort Min Threshold: {intelligence?.privacyCohortMinimum ?? 3} participants
              </div>
            </div>
          </div>

          {/* Execution Workspaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                tab: 'v24-marketplace-rfq',
                title: 'Marketplace, RFQs & Agreements',
                desc: '10-type multi-sector offers, revisioned supplier quotes, negotiation threads & 12-type commercial agreements.',
              },
              {
                tab: 'v24-orders-inventory',
                title: 'Orders, ATP Stock & Manufacturing',
                desc: '18-state commercial order fulfilment, optimistic ATP inventory reservations, BOMs & operational cost variance.',
              },
              {
                tab: 'v24-procurement-logistics',
                title: 'Procurement, Logistics & Projects',
                desc: 'Requester != Approver SoD, 3-way match, 14-state corridor logistics & 8-state milestone project controls.',
              },
              {
                tab: 'v24-documents-settlement',
                title: 'Documents, Obligations & Trust',
                desc: '14-type documents, expiring shares, V23 sandbox obligation settlement, verified-tx reviews & offline sync.',
              },
            ].map((w) => (
              <button
                key={w.tab}
                type="button"
                onClick={() => onNavigate(w.tab)}
                className="text-left bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] rounded-xl p-5 space-y-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-display font-semibold text-[#F5F5F5]">{w.title}</span>
                  <ArrowRight size={14} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-[#A0A0A0] leading-relaxed">{w.desc}</p>
              </button>
            ))}
          </div>

          {/* Unified ACL-Scoped Search */}
          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                  Unified Commerce Search (ACL-Scoped)
                </h2>
                <p className="text-xs text-[#A0A0A0]">
                  Search sectors, listings, suppliers, RFQs, orders, agreements, projects, and warehouses you are authorized to view.
                </p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A0A0]" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search maize, solar, logistics, Kampala, AGR-V24..."
                  className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5] placeholder-[#71717a]"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[42px] px-5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs whitespace-nowrap cursor-pointer"
              >
                Search Network
              </button>
            </form>
            {searchResults && (
              <div className="border-t border-[#27272a] pt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {[
                  ['Listings', searchResults.listings?.length ?? 0],
                  ['Orders', searchResults.orders?.length ?? 0],
                  ['Documents', searchResults.documents?.length ?? 0],
                  ['Projects', searchResults.projects?.length ?? 0],
                  ['Inventory', searchResults.inventory?.length ?? 0],
                ].map(([label, count]) => (
                  <div key={String(label)} className="bg-[#181818] border border-[#27272a] rounded-lg p-3">
                    <div className="text-[#A0A0A0]">{label}</div>
                    <div className="text-base font-mono tabular-nums font-bold text-[#F5F5F5]">{count}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 30 Sectors Browser */}
          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-[#D4AF37]" aria-hidden="true" />
                <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                  30 Universal Economic Sectors
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sectorGroups.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSectorGroupFilter(g)}
                    className={`px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap cursor-pointer ${
                      sectorGroupFilter === g
                        ? 'bg-[#D4AF37] text-[#050505] font-semibold'
                        : 'bg-[#181818] text-[#A0A0A0] hover:text-[#F5F5F5] border border-[#27272a]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                    <th className="py-2.5 pr-3 font-medium">Code</th>
                    <th className="py-2.5 pr-3 font-medium">Sector</th>
                    <th className="py-2.5 pr-3 font-medium">Group</th>
                    <th className="py-2.5 pr-3 font-medium">Capabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f24]">
                  {visibleSectors.map((sec) => (
                    <tr key={sec.id} className="hover:bg-[#181818]">
                      <td className="py-2.5 pr-3 font-mono text-[#D4AF37] whitespace-nowrap">{sec.code}</td>
                      <td className="py-2.5 pr-3 font-medium text-[#F5F5F5]">{sec.name}</td>
                      <td className="py-2.5 pr-3 text-[#A0A0A0] whitespace-nowrap">{sec.groupName}</td>
                      <td className="py-2.5 pr-3 text-[#A0A0A0]">
                        {[
                          sec.supportsGoods ? 'Goods' : null,
                          sec.supportsServices ? 'Services' : null,
                          sec.supportsManufacturing ? 'Manufacturing' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Commercial Participants Section */}
      {section === 'PARTICIPANTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleRegisterParticipant}
            className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4 self-start"
          >
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                Register Commercial Participant
              </h2>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Business or Participant Name</span>
                <input
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Nile Valley Solar Engineering Ltd"
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Organization Category</span>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as V24ParticipantOrgType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Primary Economic Sector</span>
                <select
                  value={selectedSectorId}
                  onChange={(e) => setSelectedSectorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[#A0A0A0]">Country</span>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                  >
                    {['UG', 'KE', 'TZ', 'RW', 'BI', 'SS', 'CD'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[#A0A0A0]">City / District</span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Commercial Scope</span>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Products, services, or supply capacity..."
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </label>
              <label className="flex items-center gap-2 text-[#A0A0A0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                <span>Explicit commercial directory consent granted</span>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
              >
                Register Participant Profile
              </button>
            </div>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              Registered Commercial Participants ({participants.length})
            </h2>
            <div className="divide-y divide-[#27272a]">
              {participants.map((p) => (
                <div key={p.id} className="py-3.5 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-medium text-sm text-[#F5F5F5]">{p.displayName}</div>
                    <div className="text-xs font-mono text-[#D4AF37]">
                      {p.euwn ? `${p.euwn} · ` : ''}
                      {p.id}
                    </div>
                  </div>
                  <div className="text-xs text-[#A0A0A0]">
                    {p.organizationType} · {p.operatingCountries.join(', ')} · {p.operatingLocations.join(', ')} ·
                    Identity: {p.identityVerificationStatus} · Legal: {p.legalRegistrationStatus}
                  </div>
                  <p className="text-xs text-[#A0A0A0]">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Advisory Section */}
      {section === 'AI_ASSIST' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#D4AF37]" aria-hidden="true" />
              <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                Commerce & Supply Chain AI Assistant
              </h2>
            </div>
            <span className="text-xs font-mono text-[#A0A0A0]">
              Human Confirmation Required · Autonomous Funds/Contract Actions Blocked (403)
            </span>
          </div>

          <form onSubmit={handleAskAi} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block space-y-1 text-xs">
                <span className="text-[#A0A0A0]">Advisory Workflow</span>
                <select
                  value={aiTask}
                  onChange={(e) => setAiTask(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {AI_TASKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2 block space-y-1 text-xs">
                <span className="text-[#A0A0A0]">Prompt</span>
                <input
                  required
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={aiLoading}
              className="min-h-[42px] px-5 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
            >
              {aiLoading ? 'Generating Structured Advisory...' : 'Run Grounded Advisory'}
            </button>
          </form>

          {aiResult && (
            <div className="border-t border-[#27272a] pt-5 space-y-4 text-xs">
              <div className="flex flex-wrap gap-3 text-[#A0A0A0]">
                <span>
                  Model: <strong className="text-[#F5F5F5]">{aiResult.modelDependency}</strong>
                </span>
                <span>·</span>
                <span>
                  Human Confirmation Required:{' '}
                  <strong className="text-emerald-400">{String(aiResult.requiresHumanConfirmation)}</strong>
                </span>
                <span>·</span>
                <span>
                  Autonomous Execution Allowed:{' '}
                  <strong className="text-[#F5F5F5]">{String(aiResult.autonomousExecutionAllowed)}</strong>
                </span>
              </div>
              <p className="text-sm text-[#F5F5F5] leading-relaxed">{aiResult.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#181818] border border-[#27272a] rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-[#D4AF37]">Verified System Data</div>
                  <ul className="space-y-1 text-[#A0A0A0]">
                    {(aiResult.verifiedSystemData || []).map((line: string, i: number) => (
                      <li key={i}>• {line}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#181818] border border-[#27272a] rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-[#F5F5F5]">Model Inference & Recommendations</div>
                  <ul className="space-y-1 text-[#A0A0A0]">
                    {(aiResult.modelInference || []).map((line: string, i: number) => (
                      <li key={i}>• {line}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#181818] border border-[#27272a] rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-amber-400">Explicit Uncertainties</div>
                  <ul className="space-y-1 text-[#A0A0A0]">
                    {(aiResult.uncertainties || []).map((line: string, i: number) => (
                      <li key={i}>• {line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Interop, Webhooks, Schema 22 Audit */}
      {section === 'INTEROP' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scoped API Credentials */}
            <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                  Scoped Organization API Credentials
                </h2>
              </div>
              <div className="flex gap-2">
                <input
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <button
                  type="button"
                  onClick={handleIssueCredential}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Issue Key
                </button>
              </div>
              {issuedRawSecret && (
                <div className="bg-[#181818] border border-[#D4AF37] rounded-lg p-3 text-xs font-mono text-[#F5F5F5] break-all">
                  One-time API key: {issuedRawSecret}
                </div>
              )}
              <div className="divide-y divide-[#27272a] text-xs">
                {credentials.map((c) => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-[#F5F5F5]">{c.label}</div>
                      <div className="text-[#A0A0A0] font-mono">
                        {c.keyPrefix}... · {c.status} · {c.scopes.join(', ')}
                      </div>
                    </div>
                    {c.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleRevokeCredential(c.id)}
                        className="px-3 py-1.5 rounded border border-red-800 text-red-300 hover:bg-red-950/30 cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Webhooks */}
            <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Webhook size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                  External Adapter & Webhook Registry ({deliveries.length} deliveries)
                </h2>
              </div>
              <div className="divide-y divide-[#27272a] text-xs">
                {webhooks.map((w) => (
                  <div key={w.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-[#F5F5F5]">
                        {w.adapterCategory} · {w.targetUrl}
                      </div>
                      <div className="text-[#A0A0A0] font-mono">
                        State: {w.adapterState} · Events: {w.eventTypes.join(', ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTriggerWebhook(w.id)}
                      disabled={busy || w.adapterState === 'NOT_CONFIGURED'}
                      className="px-3 py-1.5 rounded-lg border border-[#27272a] bg-[#181818] text-[#F5F5F5] disabled:opacity-40 cursor-pointer whitespace-nowrap"
                    >
                      Test Sandbox Delivery
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Schema 22 PostgreSQL Dry Run & Readiness Flags */}
          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                  Schema 22 PostgreSQL Dry-Run Audit & Rollback Verification
                </h2>
              </div>
              <button
                type="button"
                onClick={handleRunPgAudit}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Run Schema 22 Audit (Admin)
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {Object.entries(readiness).map(([k, v]) => (
                <div key={k} className="bg-[#181818] border border-[#27272a] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[#A0A0A0] truncate">{k}</span>
                  <span className={`font-mono font-semibold ${v ? 'text-emerald-400' : 'text-[#C0C0C0]'}`}>
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
            {pgAudit && (
              <div className="border-t border-[#27272a] pt-4 text-xs space-y-2">
                <div className="text-[#F5F5F5]">
                  Tables Audited: <strong className="font-mono">{pgAudit.tablesAudited}</strong> · Ledger Balanced:{' '}
                  <strong className="font-mono text-emerald-400">{String(pgAudit.ledgerBalanced)}</strong> · Inventory
                  Balanced: <strong className="font-mono text-emerald-400">{String(pgAudit.inventoryBalanced)}</strong>{' '}
                  · Rollback V23 Backup Ready:{' '}
                  <strong className="font-mono text-emerald-400">{String(rollbackInfo?.rollback?.v23BackupValid)}</strong>
                </div>
                <p className="text-[#A0A0A0]">{pgAudit.notes}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
