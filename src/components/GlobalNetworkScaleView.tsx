/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V11.0 - Global Economic Network Scale & Ecosystem Adoption Console
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { api } from '../services/apiClient.ts';
import type {
  TenantRecord,
  ParticipantOnboardingApplication,
  BusinessWorkspaceProfile,
  BusinessCatalogItem,
  BusinessCommercialDoc,
  BusinessTaskItem,
  ParticipantRelationshipRecord,
  ConnectionRequestRecord,
  NetworkMarketplaceListing,
  V11ProcurementRequest,
  LogisticsCarrierProfile,
  VerifiedProviderProfile,
  RegisteredEcosystemApp,
  IndustrialCapacityRecord,
  WorkServiceOpportunity,
  NetworkAnalyticalInsight,
  GovernedAiAgentIdentity,
  AiAgentActionLog,
  TenantSubscriptionRecord,
  TenantBillingInvoice,
  V11PerformanceBenchmark,
} from '../types/index.ts';
import {
  Building2,
  UserCheck,
  Briefcase,
  Share2,
  PackageSearch,
  Landmark,
  Code2,
  Factory,
  Cpu,
  CreditCard,
  Activity,
  ShieldAlert,
  Play,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type V11SubTab =
  | 'operations'
  | 'tenants-onboarding'
  | 'business-workspace'
  | 'network-marketplace'
  | 'procurement-industry'
  | 'providers-ecosystem'
  | 'intelligence-billing';

export const GlobalNetworkScaleView: React.FC = () => {
  const [subTab, setSubTab] = useState<V11SubTab>('operations');
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>('TEN-UG-ELGON-01');
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Domain State
  const [summary, setSummary] = useState<any>(null);
  const [migrationAudit, setMigrationAudit] = useState<any>(null);
  const [onboardingApps, setOnboardingApps] = useState<ParticipantOnboardingApplication[]>([]);
  const [wsProfile, setWsProfile] = useState<BusinessWorkspaceProfile | null>(null);
  const [wsCatalog, setWsCatalog] = useState<BusinessCatalogItem[]>([]);
  const [wsDocs, setWsDocs] = useState<BusinessCommercialDoc[]>([]);
  const [wsTasks, setWsTasks] = useState<BusinessTaskItem[]>([]);
  const [relationships, setRelationships] = useState<ParticipantRelationshipRecord[]>([]);
  const [connections, setConnections] = useState<ConnectionRequestRecord[]>([]);
  const [listings, setListings] = useState<NetworkMarketplaceListing[]>([]);
  const [procRequests, setProcRequests] = useState<V11ProcurementRequest[]>([]);
  const [carriers, setCarriers] = useState<LogisticsCarrierProfile[]>([]);
  const [providers, setProviders] = useState<VerifiedProviderProfile[]>([]);
  const [devApps, setDevApps] = useState<RegisteredEcosystemApp[]>([]);
  const [capacities, setCapacities] = useState<IndustrialCapacityRecord[]>([]);
  const [workOps, setWorkOps] = useState<WorkServiceOpportunity[]>([]);
  const [insights, setInsights] = useState<NetworkAnalyticalInsight[]>([]);
  const [aiAgents, setAiAgents] = useState<GovernedAiAgentIdentity[]>([]);
  const [aiLogs, setAiLogs] = useState<AiAgentActionLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscriptionRecord[]>([]);
  const [invoices, setInvoices] = useState<TenantBillingInvoice[]>([]);
  const [latestBenchmark, setLatestBenchmark] = useState<V11PerformanceBenchmark | null>(null);
  const [backupVerification, setBackupVerification] = useState<any>(null);

  // Interactive Form States
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantJurisdiction, setNewTenantJurisdiction] = useState('UG');
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogPrice, setNewCatalogPrice] = useState('450000');
  const [newDocCounterparty, setNewDocCounterparty] = useState('');
  const [newDocAmount, setNewDocAmount] = useState('1200000');
  const [newListingTitle, setNewListingTitle] = useState('');
  const [newListingPrice, setNewListingPrice] = useState('350000');
  const [newAppName, setNewAppName] = useState('');
  const [aiActionInput, setAiActionInput] = useState('Prepare cross-border supplier shortlist for Malaba corridor');
  const [aiLevelInput, setAiLevelInput] = useState<number>(2);
  const [fxCompareResult, setFxCompareResult] = useState<any>(null);

  const loadAll = async (tenantId = activeTenantId) => {
    setLoading(true);
    try {
      const [
        tenantList,
        netSummary,
        migAudit,
        onbList,
        profile,
        catalog,
        docs,
        tasks,
        rels,
        conns,
        mkt,
        procs,
        carrs,
        provs,
        apps,
        caps,
        works,
        ins,
        aiData,
        subs,
        invs,
      ] = await Promise.all([
        api.v11GetTenants(),
        api.v11GetNetworkSummary(),
        api.v11GetMigrationAudit(),
        api.v11GetOnboardingApplications(),
        api.v11GetWorkspaceProfile(tenantId),
        api.v11GetWorkspaceCatalog(tenantId),
        api.v11GetWorkspaceDocuments(tenantId),
        api.v11GetWorkspaceTasks(tenantId),
        api.v11GetRelationships(tenantId),
        api.v11GetConnections(tenantId),
        api.v11GetMarketplaceListings(),
        api.v11GetProcurementRequests(),
        api.v11GetLogisticsCarriers(),
        api.v11GetProviders(),
        api.v11GetDeveloperApps(),
        api.v11GetIndustrialCapacities(),
        api.v11GetWorkOpportunities(),
        api.v11GetInsights(),
        api.v11GetAiAgents(),
        api.v11GetSubscriptions(),
        api.v11GetBillingInvoices(),
      ]);

      setTenants(Array.isArray(tenantList) ? tenantList : []);
      setSummary(netSummary);
      setMigrationAudit(migAudit);
      setOnboardingApps(Array.isArray(onbList) ? onbList : []);
      setWsProfile(profile);
      setWsCatalog(Array.isArray(catalog) ? catalog : []);
      setWsDocs(Array.isArray(docs) ? docs : []);
      setWsTasks(Array.isArray(tasks) ? tasks : []);
      setRelationships(Array.isArray(rels) ? rels : []);
      setConnections(Array.isArray(conns) ? conns : []);
      setListings(Array.isArray(mkt) ? mkt : []);
      setProcRequests(Array.isArray(procs) ? procs : []);
      setCarriers(Array.isArray(carrs) ? carrs : []);
      setProviders(Array.isArray(provs) ? provs : []);
      setDevApps(Array.isArray(apps) ? apps : []);
      setCapacities(Array.isArray(caps) ? caps : []);
      setWorkOps(Array.isArray(works) ? works : []);
      setInsights(Array.isArray(ins) ? ins : []);
      setAiAgents(aiData?.agents || []);
      setAiLogs(aiData?.actionLogs || []);
      setSubscriptions(Array.isArray(subs) ? subs : []);
      setInvoices(Array.isArray(invs) ? invs : []);
      if (netSummary?.benchmarks?.length) {
        setLatestBenchmark(netSummary.benchmarks[netSummary.benchmarks.length - 1]);
      }
    } catch (err: any) {
      setStatusMessage(`Load warning: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(activeTenantId);
  }, [activeTenantId]);

  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  const tabs: { id: V11SubTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'operations', label: 'Network Control', icon: Activity },
    { id: 'tenants-onboarding', label: 'Tenants & Onboarding', icon: UserCheck },
    { id: 'business-workspace', label: 'Business Workspace', icon: Briefcase },
    { id: 'network-marketplace', label: 'Graph & Marketplace', icon: Share2 },
    { id: 'procurement-industry', label: 'Procurement & Industry', icon: Factory },
    { id: 'providers-ecosystem', label: 'Providers & Dev API', icon: Landmark },
    { id: 'intelligence-billing', label: 'AI Gov & Billing', icon: Cpu },
  ];

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    const res = await api.v11CreateTenant({
      legalName: newTenantName.trim(),
      organizationType: 'BUSINESS',
      jurisdiction: newTenantJurisdiction,
    });
    if (res?.tenant?.id) {
      setNewTenantName('');
      setActiveTenantId(res.tenant.id);
      setStatusMessage(`Tenant ${res.tenant.legalName} provisioned (${res.tenant.id}).`);
      await loadAll(res.tenant.id);
    }
  };

  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatalogName.trim()) return;
    await api.v11CreateWorkspaceCatalogItem(activeTenantId, {
      name: newCatalogName.trim(),
      itemType: 'PRODUCT',
      category: 'Commercial Goods',
      unit: 'Unit',
      unitPrice: Number(newCatalogPrice) || 100000,
      currency: activeTenant?.jurisdiction === 'KE' ? 'KES' : 'UGX',
      availableStockOrCapacity: 100,
    });
    setNewCatalogName('');
    setStatusMessage(`Added catalog item scoped strictly to ${activeTenantId}.`);
    await loadAll(activeTenantId);
  };

  const handleCreateCommercialDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocCounterparty.trim()) return;
    await api.v11CreateWorkspaceDocument(activeTenantId, {
      docType: 'INVOICE',
      counterpartyName: newDocCounterparty.trim(),
      lineItems: [{ description: 'Contracted Commercial Supply', quantity: 1, unitPrice: Number(newDocAmount) || 500000 }],
      taxRatePct: 18,
      currency: activeTenant?.jurisdiction === 'KE' ? 'KES' : 'UGX',
    });
    setNewDocCounterparty('');
    setStatusMessage(`Issued invoice inside ${activeTenantId} workspace.`);
    await loadAll(activeTenantId);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingTitle.trim()) return;
    await api.v11CreateMarketplaceListing(activeTenantId, {
      listingType: 'PRODUCT',
      title: newListingTitle.trim(),
      description: 'Published directly from tenant business workspace.',
      currency: 'UGX',
      unitPrice: Number(newListingPrice) || 250000,
      unit: 'Lot',
      availableQuantity: 25,
    });
    setNewListingTitle('');
    setStatusMessage('Network marketplace listing published with explicit claim classification.');
    await loadAll(activeTenantId);
  };

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    const res = await api.v11RegisterDeveloperApp(activeTenantId, {
      developerName: 'Tenant Engineering Team',
      appName: newAppName.trim(),
      scopes: ['read:orders', 'write:invoices'],
    });
    setNewAppName('');
    setStatusMessage(`Sandbox app registered (${res.clientId}). Secret issued once cleanly.`);
    await loadAll(activeTenantId);
  };

  const handleExecuteAi = async (e: React.FormEvent) => {
    e.preventDefault();
    const agentId = aiLevelInput >= 4 ? 'AGENT-TREASURY-EXEC' : 'AGENT-SUPPLIER-MATCH';
    const res = await api.v11ExecuteAiAgent(activeTenantId, agentId, aiActionInput, aiLevelInput);
    if (res?.error) {
      setStatusMessage(`AI Governance Guardrail: ${res.error}`);
    } else {
      setStatusMessage(`AI Action logged: ${res.status} (Level ${res.autonomyLevel}).`);
    }
    await loadAll(activeTenantId);
  };

  const handleRunBenchmark = async () => {
    const res = await api.v11RunBenchmark(80);
    setLatestBenchmark(res);
    setStatusMessage(`Measured ${res.concurrentOperations} concurrent ops in ${res.durationMs}ms (${res.throughputOpsPerSec} ops/s).`);
    await loadAll(activeTenantId);
  };

  const handleVerifyBackup = async () => {
    const res = await api.v11VerifyBackup();
    setBackupVerification(res);
    setStatusMessage(`Disk WAL backup verified: ${res.backupFile} (SHA-256 ${res.checksumSha256?.slice(0, 12)}...).`);
  };

  const handleFxCompare = async () => {
    const res = await api.v11CompareFx('USD', 'UGX', 10000);
    setFxCompareResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Header & Tenant Switcher Bar */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-heading font-bold text-[#F5F5F5] tracking-tight">
              Global Economic Network Scale (V11)
            </h1>
            <span className="text-[11px] font-mono text-[#D4AF37]">SCHEMA 11 · WAL ATOMIC</span>
          </div>
          <p className="text-xs text-[#A0A0A0]">
            Multi-tenant participant workspaces, onboarding verification, procurement, verified provider lifecycle, governed AI agents, and metered billing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wider text-[#A0A0A0] font-mono mb-1">
              Active Tenant Workspace
            </label>
            <select
              value={activeTenantId}
              onChange={(e) => setActiveTenantId(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:border-[#D4AF37] outline-none"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.legalName} ({t.jurisdiction} · {t.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadAll(activeTenantId)}
            className="mt-4 px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync State</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-[#121212] border border-[#443714] text-[#F5F5F5] px-4 py-2.5 rounded-lg text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5] font-mono text-[11px]">
            DISMISS
          </button>
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap border transition-colors ${
                active
                  ? 'bg-[#18181b] text-[#D4AF37] border-[#443714]'
                  : 'bg-[#121212] text-[#A0A0A0] border-[#27272a] hover:text-[#F5F5F5]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: NETWORK OPERATIONS CONTROL & BENCHMARKS */}
      {subTab === 'operations' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase tracking-wider font-mono">Active Tenants</div>
              <div className="text-2xl font-heading font-bold text-[#F5F5F5] tabular-nums mt-1">
                {summary.tenants.active} / {summary.tenants.total}
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono">{summary.tenants.memberships} active memberships</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase tracking-wider font-mono">Provider Connectivity</div>
              <div className="text-2xl font-heading font-bold text-[#D4AF37] tabular-nums mt-1">
                {summary.providers.sandboxConnected} Sandbox
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono">
                {summary.providers.productionVerified} Live Prod · {summary.providers.referenceDirectory} Directory
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase tracking-wider font-mono">AI Human Gate Queue</div>
              <div className="text-2xl font-heading font-bold text-[#F5F5F5] tabular-nums mt-1">
                {summary.governance.pendingAiHumanApprovals} Pending
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono">{summary.governance.governedAgents} governed agents</div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase tracking-wider font-mono">Ecosystem & Billing</div>
              <div className="text-2xl font-heading font-bold text-[#F5F5F5] tabular-nums mt-1">
                {summary.ecosystem.registeredApps} Apps
              </div>
              <div className="text-[11px] text-[#A0A0A0] mt-1 font-mono">
                {summary.ecosystem.activeSubscriptions} subs · {summary.ecosystem.invoicesIssued} invoices
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Concurrency Benchmark Panel */}
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Live Concurrency & Latency Benchmark</h2>
                  <p className="text-xs text-[#A0A0A0]">Measures actual in-process multi-tenant reads, ledger integrity, and SHA-256 verification throughput.</p>
                </div>
                <button
                  onClick={handleRunBenchmark}
                  className="px-3 py-2 bg-[#D4AF37] text-black rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Run Benchmark</span>
                </button>
              </div>
              {latestBenchmark ? (
                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-[#27272a] text-xs font-mono tabular-nums">
                  <div>
                    <div className="text-[#A0A0A0] text-[10px]">OPS</div>
                    <div className="text-[#F5F5F5] font-bold">{latestBenchmark.concurrentOperations}</div>
                  </div>
                  <div>
                    <div className="text-[#A0A0A0] text-[10px]">THROUGHPUT</div>
                    <div className="text-[#D4AF37] font-bold">{latestBenchmark.throughputOpsPerSec} /s</div>
                  </div>
                  <div>
                    <div className="text-[#A0A0A0] text-[10px]">P95 LATENCY</div>
                    <div className="text-emerald-400 font-bold">{latestBenchmark.p95LatencyMs} ms</div>
                  </div>
                  <div>
                    <div className="text-[#A0A0A0] text-[10px]">ERRORS</div>
                    <div className="text-[#F5F5F5] font-bold">{latestBenchmark.errorCount}</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#A0A0A0] font-mono">No benchmark executed in this session yet.</div>
              )}
            </div>

            {/* V10->V11 Migration & Backup Verification */}
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Schema V10 → V11 Preservation & Backup Integrity</h2>
                  <p className="text-xs text-[#A0A0A0]">Zero-loss migration audit and disk SHA-256 snapshot verification.</p>
                </div>
                <button
                  onClick={handleVerifyBackup}
                  className="px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] rounded-lg text-xs font-medium whitespace-nowrap"
                >
                  Verify Disk Backup
                </button>
              </div>
              {migrationAudit && (
                <div className="text-xs text-[#C0C0C0] font-mono space-y-1 border-t border-[#27272a] pt-3">
                  <div>
                    Preserved V1–V10: {migrationAudit.v10Preserved.users} users · {migrationAudit.v10Preserved.organizations} orgs · {migrationAudit.v10Preserved.economicExecutions} executions · {migrationAudit.v10Preserved.universalJournal} journals
                  </div>
                  <div>
                    Active Schema: v{migrationAudit.schemaVersion} · Migrations logged: {migrationAudit.migrationHistory?.length || 0}
                  </div>
                  {backupVerification && (
                    <div className="text-emerald-400">
                      Snapshot {backupVerification.backupFile} ({backupVerification.sizeBytes} bytes) · SHA-256 {backupVerification.checksumSha256?.slice(0, 16)}...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-TENANCY & PARTICIPANT ONBOARDING */}
      {subTab === 'tenants-onboarding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Provision Isolated Organization Tenant</h2>
            <form onSubmit={handleCreateTenant} className="flex flex-col sm:flex-row gap-2">
              <input
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="Legal entity name (e.g. Jinja Steel & Tubes Ltd)"
                className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] outline-none focus:border-[#D4AF37]"
              />
              <select
                value={newTenantJurisdiction}
                onChange={(e) => setNewTenantJurisdiction(e.target.value)}
                className="bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-2 text-xs text-[#F5F5F5]"
              >
                <option value="UG">UG</option>
                <option value="KE">KE</option>
                <option value="TZ">TZ</option>
                <option value="RW">RW</option>
              </select>
              <button type="submit" className="px-3.5 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg text-xs whitespace-nowrap flex items-center gap-1">
                <Plus size={13} /> Provision
              </button>
            </form>

            <div className="divide-y divide-[#27272a] border-t border-[#27272a]">
              {tenants.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#F5F5F5]">{t.legalName}</div>
                    <div className="text-[#A0A0A0] font-mono text-[11px]">
                      {t.id} · {t.organizationType} · Residency {t.dataOwnershipPolicy.residencyCountry} · {t.status}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTenantId(t.id)}
                    className="px-2.5 py-1 border border-[#27272a] hover:border-[#D4AF37] rounded text-[11px] text-[#D4AF37] whitespace-nowrap"
                  >
                    {activeTenantId === t.id ? 'Selected' : 'Switch'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Participant Onboarding & Verification Queue</h2>
            <div className="divide-y divide-[#27272a]">
              {onboardingApps.map((app) => (
                <div key={app.id} className="py-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#F5F5F5]">{app.legalOrFullName}</span>
                    <span className="font-mono text-[11px] text-[#D4AF37]">{app.status}</span>
                  </div>
                  <div className="text-[11px] text-[#A0A0A0] font-mono">
                    {app.id} · {app.participantType} · {app.jurisdiction} · Claim: {app.verificationClaimType} · Duplicate: {app.duplicateCheckStatus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TENANT-SCOPED BUSINESS OPERATING WORKSPACE */}
      {subTab === 'business-workspace' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-[#D4AF37]">STRICT TENANT ISOLATION · {activeTenantId}</div>
              <h2 className="text-lg font-heading font-bold text-[#F5F5F5] mt-0.5">{wsProfile?.businessName}</h2>
              <p className="text-xs text-[#A0A0A0] mt-1">{wsProfile?.statutoryDisclaimer}</p>
            </div>
            <div className="text-xs font-mono text-[#C0C0C0] space-y-1 text-right">
              <div>Catalog Items: {wsCatalog.length} · Commercial Docs: {wsDocs.length}</div>
              <div>Open Tasks: {wsTasks.filter((t) => t.status !== 'COMPLETED').length} · Entity Status: {wsProfile?.verificationStatus}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-heading font-bold text-[#F5F5F5]">Catalog & Inventory ({wsCatalog.length})</h3>
              <form onSubmit={handleCreateCatalog} className="flex gap-2">
                <input
                  value={newCatalogName}
                  onChange={(e) => setNewCatalogName(e.target.value)}
                  placeholder="Product or service name..."
                  className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
                />
                <input
                  value={newCatalogPrice}
                  onChange={(e) => setNewCatalogPrice(e.target.value)}
                  type="number"
                  className="w-28 bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F5] font-mono"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#D4AF37] text-black rounded-lg text-xs font-semibold whitespace-nowrap">
                  Add Item
                </button>
              </form>
              <div className="divide-y divide-[#27272a]">
                {wsCatalog.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[#F5F5F5] font-medium">{item.name}</div>
                      <div className="text-[11px] text-[#A0A0A0] font-mono">
                        {item.sku} · {item.itemType} · Stock: {item.availableStockOrCapacity} {item.unit}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-[#D4AF37] tabular-nums">
                      {item.unitPrice.toLocaleString()} {item.currency}
                    </div>
                  </div>
                ))}
                {wsCatalog.length === 0 && <div className="py-4 text-xs text-[#A0A0A0]">No catalog items in this isolated tenant yet.</div>}
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-heading font-bold text-[#F5F5F5]">Commercial Documents & Invoicing ({wsDocs.length})</h3>
              <form onSubmit={handleCreateCommercialDoc} className="flex gap-2">
                <input
                  value={newDocCounterparty}
                  onChange={(e) => setNewDocCounterparty(e.target.value)}
                  placeholder="Counterparty business name..."
                  className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
                />
                <input
                  value={newDocAmount}
                  onChange={(e) => setNewDocAmount(e.target.value)}
                  type="number"
                  className="w-28 bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F5] font-mono"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#D4AF37] text-black rounded-lg text-xs font-semibold whitespace-nowrap">
                  Issue Invoice
                </button>
              </form>
              <div className="divide-y divide-[#27272a]">
                {wsDocs.map((doc) => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[#F5F5F5] font-medium">
                        {doc.docNumber} · {doc.counterpartyName}
                      </div>
                      <div className="text-[11px] text-[#A0A0A0] font-mono">
                        {doc.docType} · Status: {doc.status} · Tax: {doc.taxAmount.toLocaleString()} {doc.currency}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-[#F5F5F5] tabular-nums">
                      {doc.totalAmount.toLocaleString()} {doc.currency}
                    </div>
                  </div>
                ))}
                {wsDocs.length === 0 && <div className="py-4 text-xs text-[#A0A0A0]">No commercial documents in this isolated tenant yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NETWORK RELATIONSHIPS & MULTI-SECTOR MARKETPLACE */}
      {subTab === 'network-marketplace' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Visible Economic Relationships ({relationships.length})</h2>
            <div className="divide-y divide-[#27272a]">
              {relationships.map((rel) => (
                <div key={rel.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F5F5F5]">
                      {rel.sourceParticipantName} → {rel.targetParticipantName}
                    </span>
                    <span className="font-mono text-[11px] text-[#D4AF37]">{rel.relationshipType}</span>
                  </div>
                  <div className="text-[11px] text-[#A0A0A0] font-mono">
                    Visibility: {rel.visibility} · Verification: {rel.verificationStatus} · Status: {rel.status}
                  </div>
                </div>
              ))}
            </div>

            {connections.length > 0 && (
              <div className="pt-3 border-t border-[#27272a] space-y-2">
                <h3 className="text-xs font-mono uppercase text-[#A0A0A0]">Pending Connection Requests</h3>
                {connections.map((c) => (
                  <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[#F5F5F5]">{c.fromName} → {c.toName} ({c.proposedRelationshipType})</div>
                      <div className="text-[11px] text-[#A0A0A0]">{c.message} · {c.status}</div>
                    </div>
                    {c.status === 'PENDING' && c.toTenantId === activeTenantId && (
                      <button
                        onClick={async () => {
                          await api.v11RespondConnection(activeTenantId, c.id, 'APPROVED');
                          await loadAll(activeTenantId);
                        }}
                        className="px-2.5 py-1 bg-[#D4AF37] text-black rounded text-[11px] font-semibold whitespace-nowrap"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Universal Opportunity Marketplace ({listings.length})</h2>
            <form onSubmit={handleCreateListing} className="flex gap-2">
              <input
                value={newListingTitle}
                onChange={(e) => setNewListingTitle(e.target.value)}
                placeholder="Publish product, industrial capacity, or service..."
                className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
              />
              <input
                value={newListingPrice}
                onChange={(e) => setNewListingPrice(e.target.value)}
                type="number"
                className="w-24 bg-[#18181b] border border-[#27272a] rounded-lg px-2 py-1.5 text-xs text-[#F5F5F5] font-mono"
              />
              <button type="submit" className="px-3 py-1.5 bg-[#D4AF37] text-black rounded-lg text-xs font-semibold whitespace-nowrap">
                Publish
              </button>
            </form>
            <div className="divide-y divide-[#27272a]">
              {listings.map((l) => (
                <div key={l.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#F5F5F5]">{l.title}</span>
                    <span className="font-mono text-[#D4AF37] tabular-nums whitespace-nowrap">
                      {l.unitPrice.toLocaleString()} {l.currency} / {l.unit}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#A0A0A0]">
                    {l.publisherName} · {l.listingType} · {l.claimClassification} · {l.offers.length} offers
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROCUREMENT, LOGISTICS, INDUSTRIAL & WORK NETWORKS */}
      {subTab === 'procurement-industry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Procurement Requests & Human Award Gate</h2>
              <div className="divide-y divide-[#27272a]">
                {procRequests.map((p) => (
                  <div key={p.id} className="py-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#F5F5F5]">{p.title}</span>
                      <span className="font-mono text-[11px] text-[#D4AF37]">{p.status}</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">
                      {p.referenceNumber} · Scope: {p.procurementScope} · Budget: {p.budgetAmount.toLocaleString()} {p.currency} · Official Gov Linked: {p.officialGovernmentPortalLinked ? 'YES' : 'NO'}
                    </div>
                    {p.bids.map((b) => (
                      <div key={b.id} className="flex items-center justify-between pt-1 text-[11px] text-[#C0C0C0]">
                        <span>
                          Bid {b.id}: {b.supplierName} — {b.bidAmount.toLocaleString()} {p.currency} ({b.deliveryDays}d, Score {b.technicalScore})
                        </span>
                        {p.status !== 'AWARDED' && (
                          <button
                            onClick={async () => {
                              await api.v11AwardProcurement(activeTenantId, p.id, b.id, 'Procurement Officer (Human Sign-Off)');
                              setStatusMessage(`Procurement ${p.referenceNumber} awarded with explicit human authorization.`);
                              await loadAll(activeTenantId);
                            }}
                            className="px-2 py-0.5 bg-[#D4AF37] text-black rounded font-semibold whitespace-nowrap"
                          >
                            Human Award
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Multimodal Logistics Carriers & Industrial Capacity</h2>
              <div className="divide-y divide-[#27272a]">
                {carriers.map((c) => (
                  <div key={c.id} className="py-2.5 text-xs">
                    <div className="font-semibold text-[#F5F5F5]">{c.carrierName}</div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">
                      Modes: {c.modes.join(', ')} · Tracking: {c.trackingSourceType} · Status: {c.verificationStatus}
                    </div>
                  </div>
                ))}
                {capacities.map((cap) => (
                  <div key={cap.id} className="py-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#F5F5F5]">{cap.facilityName}</span>
                      <span className="font-mono text-[#D4AF37] tabular-nums">
                        {cap.availableCapacityPerMonth}/{cap.totalCapacityPerMonth} {cap.unit}/mo
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">
                      {cap.productLine} · {cap.verificationStatus} · {cap.sourceAttribution}
                    </div>
                  </div>
                ))}
                {workOps.map((w) => (
                  <div key={w.id} className="py-2.5 text-xs">
                    <div className="font-semibold text-[#F5F5F5]">{w.title}</div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">
                      {w.engagementType} · {w.compensationAmount.toLocaleString()} {w.currency} · {w.platformRoleDisclaimer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: VERIFIED PROVIDER CONNECTIVITY & DEVELOPER ECOSYSTEM */}
      {subTab === 'providers-ecosystem' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Verified Financial & Clearing Providers</h2>
              <button
                onClick={handleFxCompare}
                className="px-2.5 py-1 border border-[#27272a] hover:border-[#D4AF37] rounded text-[11px] text-[#D4AF37] whitespace-nowrap"
              >
                Compare USD/UGX FX
              </button>
            </div>
            {fxCompareResult && (
              <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg text-xs font-mono space-y-1">
                <div className="text-[#D4AF37]">
                  {fxCompareResult.pair}: 1 USD = {fxCompareResult.indicativeMidRate} UGX ({fxCompareResult.quoteClassification})
                </div>
                <div className="text-[11px] text-[#A0A0A0]">{fxCompareResult.executableQuoteDisclaimer}</div>
              </div>
            )}
            <div className="divide-y divide-[#27272a]">
              {providers.map((p) => (
                <div key={p.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#F5F5F5]">{p.legalName}</span>
                    <span className="font-mono text-[11px] text-[#D4AF37]">{p.connectionClassification}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#A0A0A0]">
                    Stage: {p.lifecycleStage} · Credentials: {p.credentialStatus} · Currencies: {p.supportedCurrencies.join(', ')}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#71717a]">
                    <span>Regulator: {p.regulatoryEvidence.authority} ({p.regulatoryEvidence.licenseRef})</span>
                    <button
                      onClick={async () => {
                        await api.v11CertifyProvider(p.id);
                        await loadAll(activeTenantId);
                      }}
                      className="text-[#D4AF37] hover:underline font-mono"
                    >
                      Run Sandbox Cert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Developer & Integration Applications ({devApps.length})</h2>
            <form onSubmit={handleRegisterApp} className="flex gap-2">
              <input
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="New sandbox app name (e.g. ERP Order Sync)"
                className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
              />
              <button type="submit" className="px-3 py-1.5 bg-[#D4AF37] text-black rounded-lg text-xs font-semibold whitespace-nowrap">
                Register App
              </button>
            </form>
            <div className="divide-y divide-[#27272a]">
              {devApps.map((app) => (
                <div key={app.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F5F5F5]">{app.appName}</span>
                    <span className="font-mono text-[11px] text-[#D4AF37]">{app.lifecycleStage}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#A0A0A0]">
                    {app.clientId} · Prefix: {app.apiKeyPrefix} · Scopes: {app.scopes.join(', ')} · 24h calls: {app.usageCount24h}/{app.rateLimitPerMin}/min
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: NETWORK INTELLIGENCE, GOVERNED AI AGENTS & METERED BILLING */}
      {subTab === 'intelligence-billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Governed AI Agents (5-Level Autonomy Matrix)</h2>
              <form onSubmit={handleExecuteAi} className="flex flex-col sm:flex-row gap-2">
                <input
                  value={aiActionInput}
                  onChange={(e) => setAiActionInput(e.target.value)}
                  className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] outline-none"
                />
                <select
                  value={aiLevelInput}
                  onChange={(e) => setAiLevelInput(Number(e.target.value))}
                  className="bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F5F5]"
                >
                  <option value={1}>Level 1 (Observe)</option>
                  <option value={2}>Level 2 (Recommend)</option>
                  <option value={4}>Level 4 (Approval Req)</option>
                  <option value={5}>Level 5 (Dual Human)</option>
                </select>
                <button type="submit" className="px-3 py-1.5 bg-[#D4AF37] text-black rounded-lg text-xs font-semibold whitespace-nowrap">
                  Execute
                </button>
              </form>
              <div className="divide-y divide-[#27272a]">
                {aiAgents.map((ag) => (
                  <div key={ag.id} className="py-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#F5F5F5]">{ag.name}</span>
                      <span className="font-mono text-[#D4AF37]">Max L{ag.maxAutonomyLevel}</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">
                      Boundary: {ag.dataAccessBoundary} · Executed: {ag.actionsExecutedCount}
                    </div>
                  </div>
                ))}
                {aiLogs.slice(-4).reverse().map((log) => (
                  <div key={log.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#F5F5F5]">{log.requestedAction}</span>
                      <span className="font-mono text-[11px] text-[#D4AF37] whitespace-nowrap">{log.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#A0A0A0]">
                      <span>{log.resultSummary}</span>
                      {log.status === 'PENDING_HUMAN_APPROVAL' && (
                        <button
                          onClick={async () => {
                            await api.v11DecideAiApproval(log.id, 'APPROVED', 'chief.risk.officer@aros.ug');
                            await loadAll(activeTenantId);
                          }}
                          className="text-emerald-400 hover:underline whitespace-nowrap"
                        >
                          Human Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-heading font-bold text-[#F5F5F5]">Source-Attributed Intelligence & Tenant Billing</h2>
              <div className="divide-y divide-[#27272a]">
                {insights.map((ins) => (
                  <div key={ins.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[#F5F5F5]">{ins.title}</span>
                      <span className="font-mono text-[11px] text-[#D4AF37] whitespace-nowrap">{ins.factOrForecast}</span>
                    </div>
                    <div className="text-[#C0C0C0]">{ins.summary}</div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">
                      Source: {ins.dataSource} · Confidence: {ins.confidencePct}% · Limitation: {ins.limitations}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#27272a] space-y-2">
                <h3 className="text-xs font-mono uppercase text-[#A0A0A0]">Subscriptions & Metered Invoices</h3>
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between text-xs py-1">
                    <div>
                      <div className="text-[#F5F5F5] font-medium">{sub.tenantName} — {sub.planName}</div>
                      <div className="text-[11px] font-mono text-[#A0A0A0]">
                        {sub.monthlyBaseFee} {sub.currency}/mo · API Calls: {sub.apiCallsUsedCurrentCycle}/{sub.entitlements.maxApiCallsPerMonth} · {sub.status}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await api.v11GenerateBillingInvoice(sub.tenantId, sub.id);
                        setStatusMessage(`Generated itemized VAT invoice for ${sub.tenantName}.`);
                        await loadAll(activeTenantId);
                      }}
                      className="px-2.5 py-1 border border-[#27272a] hover:border-[#D4AF37] rounded text-[11px] text-[#D4AF37] whitespace-nowrap"
                    >
                      Issue Invoice
                    </button>
                  </div>
                ))}
                {invoices.map((inv) => (
                  <div key={inv.id} className="text-[11px] font-mono text-[#C0C0C0] flex justify-between pt-1">
                    <span>{inv.invoiceNumber} ({inv.pricingBasis})</span>
                    <span className="tabular-nums text-[#F5F5F5]">{inv.totalAmount} {inv.currency} [{inv.status}]</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
