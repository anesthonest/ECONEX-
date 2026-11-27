/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V25.0 — OpenAPI 3.1 Developer Platform, Scoped API Keys, Signed Webhooks,
 * Private Document Vault, 6-Stage Security Incidents & Commercial Governance Plans
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Code2,
  CreditCard,
  FileLock2,
  KeyRound,
  RefreshCw,
  Search,
  ShieldAlert,
  Webhook,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V25ApiApplication,
  V25ExternalAdapterBoundary,
  V25OrgSubscription,
  V25PlatformInvoice,
  V25PlatformPlan,
  V25ScopedApiKey,
  V25SecurityIncident,
  V25VaultDocument,
  V25WebhookDeliveryRecord,
  V25WebhookEndpoint,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

export const V25DeveloperPlatformIntegrationsView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role, tenantId: 'TENANT-UG', organisationId: 'ORG-V25-UG-PRODUCE' };

  const [loading, setLoading] = useState(true);
  const [openApiInfo, setOpenApiInfo] = useState<any>(null);
  const [apps, setApps] = useState<V25ApiApplication[]>([]);
  const [keys, setKeys] = useState<V25ScopedApiKey[]>([]);
  const [endpoints, setEndpoints] = useState<V25WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<V25WebhookDeliveryRecord[]>([]);
  const [adapters, setAdapters] = useState<V25ExternalAdapterBoundary[]>([]);
  const [vaultDocs, setVaultDocs] = useState<V25VaultDocument[]>([]);
  const [incidents, setIncidents] = useState<V25SecurityIncident[]>([]);
  const [plans, setPlans] = useState<V25PlatformPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<V25OrgSubscription[]>([]);
  const [invoices, setInvoices] = useState<V25PlatformInvoice[]>([]);
  const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);
  const [downloadedPreview, setDownloadedPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('Kampala');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [newKeyLabel, setNewKeyLabel] = useState('V25 Partner ERP Read Key');
  const [newDocTitle, setNewDocTitle] = useState('Signed Export Manifest & Tax Clear');
  const [newDocText, setNewDocText] = useState('ECONEX Private Evidence Document — Confidential to ORG-V25-UG-PRODUCE.');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [spec, dev, vault, inc, bill] = await Promise.all([
        ApiClient.v25GetOpenApiSpec(),
        ApiClient.v25GetDeveloperPlatform(actor),
        ApiClient.v25GetVaultDocuments(actor),
        ApiClient.v25GetSecurityIncidents(actor),
        ApiClient.v25GetPlatformBilling(actor),
      ]);
      setOpenApiInfo(spec);
      setApps(dev.apps || []);
      setKeys(dev.keys || []);
      setEndpoints(dev.endpoints || []);
      setDeliveries(dev.deliveries || []);
      setAdapters(dev.adapters || []);
      setVaultDocs(vault.documents || []);
      setIncidents(inc.incidents || []);
      setPlans(bill.plans || []);
      setSubscriptions(bill.subscriptions || []);
      setInvoices(bill.invoices || []);
    } catch (e: any) {
      setStatusMsg(e?.message || 'Failed to load developer platform & vault data');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleIssueKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAppId = apps[0]?.id || 'APP-V25-ERP-BRIDGE';
    try {
      const res = await ApiClient.v25IssueScopedApiKey(
        { appId: targetAppId, label: newKeyLabel, scopes: ['read:commerce', 'read:fx'] },
        actor
      );
      setOneTimeSecret(res.oneTimePlaintextSecret);
      setStatusMsg(`Issued scoped API key ${res.keyRecord.id}. Secret shown ONCE below — it cannot be retrieved again.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Could not issue scoped API key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await ApiClient.v25RevokeApiKey(keyId, actor);
      setStatusMsg(`API key ${keyId} revoked and logged cleanly.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Revoke failed');
    }
  };

  const handleRegisterAndDeliverWebhook = async () => {
    try {
      let epId = endpoints[0]?.id;
      if (!epId) {
        const reg = await ApiClient.v25RegisterWebhook(
          { appId: apps[0]?.id || 'APP-V25-ERP-BRIDGE', targetUrl: 'https://sandbox.partner.local/econex-webhook' },
          actor
        );
        epId = reg.endpoint.id;
      }
      const del = await ApiClient.v25DeliverWebhook(
        epId,
        { eventType: 'v25.ledger.transaction_posted', payload: { demo: true, timestamp: new Date().toISOString() } },
        actor
      );
      setStatusMsg(`Delivered HMAC-SHA256 signed sandbox webhook ${del.id} (sig=${del.signatureHmacSha256.slice(0, 16)}...).`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Webhook delivery failed');
    }
  };

  const handleUploadVaultDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const doc = await ApiClient.v25UploadVaultDocument(
        {
          organisationId: 'ORG-V25-UG-PRODUCE',
          countryCode: 'UG',
          classification: 'REGULATED_COMPLIANCE',
          title: newDocTitle,
          originalFilename: 'vault_evidence.txt',
          mimeType: 'text/plain',
          contentText: newDocText,
        },
        actor
      );
      setStatusMsg(`Stored private vault document ${doc.id} outside public directories (SHA-256 ${doc.sha256Checksum.slice(0, 14)}...).`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Vault upload blocked');
    }
  };

  const handleDownloadVaultDoc = async (docId: string) => {
    try {
      const tok = await ApiClient.v25IssueVaultDownloadToken(docId, actor);
      const res = await ApiClient.v25RedeemVaultDownloadToken(tok.token, actor);
      setDownloadedPreview(res.contentText);
      setStatusMsg(`Redeemed one-time token for ${docId} (sha256Verified=${res.sha256Verified}).`);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Vault download blocked');
    }
  };

  const handleCreateIncident = async () => {
    try {
      const inc = await ApiClient.v25CreateSecurityIncident(
        { title: 'API Key Probe Detection Drill', severity: 'MEDIUM', affectedOrganisationId: 'ORG-V25-UG-PRODUCE' },
        actor
      );
      setStatusMsg(`Opened security incident ${inc.id} in stage ${inc.stage}.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Incident creation requires PLATFORM_ADMIN');
    }
  };

  const handleAdvanceIncident = async (inc: V25SecurityIncident) => {
    const order = ['DETECTION', 'CLASSIFICATION', 'CONTAINMENT', 'INVESTIGATION', 'RECOVERY', 'POST_INCIDENT_REVIEW'];
    const nextStage = order[order.indexOf(inc.stage) + 1];
    if (!nextStage) return;
    try {
      const updated = await ApiClient.v25AdvanceSecurityIncident(inc.id, { targetStage: nextStage }, actor);
      setStatusMsg(`Incident ${updated.id} advanced to ${updated.stage}.`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Incident advance blocked');
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const res = await ApiClient.v25SubscribePlan({ organisationId: 'ORG-V25-UG-PRODUCE', planId }, actor);
      setStatusMsg(`Subscribed ORG-V25-UG-PRODUCE to ${planId} (Invoice ${res.invoice.invoiceNumber}, walletBalanceSeparated=true).`);
      await loadAll();
    } catch (err: any) {
      setStatusMsg(err?.message || 'Subscription failed');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.v25Search(searchQuery, actor);
      setSearchResults(res);
    } catch (err: any) {
      setStatusMsg(err?.message || 'Search failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#D4AF37]">
            ECONEX V25.0 · OPENAPI {openApiInfo?.openapi || '3.1.0'} · PRIVATE VAULT &amp; SECURITY
          </div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
            Developer Platform, Private Document Vault &amp; Security Ops
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            OpenAPI 3.1 endpoints: <strong className="text-[#F5F5F5]">{Object.keys(openApiInfo?.paths || {}).length}</strong> · External live adapters:{' '}
            <strong className="text-amber-300">NON-LIVE SANDBOX BOUNDARIES ONLY</strong> · Platform plans separated from wallet funds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadAll}
            disabled={loading}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v25-command-centre')}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#D4AF37] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
          >
            Command Centre <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-[#121212] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-xs text-[#F5F5F5] flex items-center justify-between gap-3">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="text-[#A0A0A0] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {oneTimeSecret && (
        <div className="bg-amber-950/30 border border-amber-600/60 rounded-xl p-4 text-xs space-y-1">
          <div className="font-bold text-amber-300">ONE-TIME SCOPED API SECRET (Shown Once Only — Copy Now)</div>
          <div className="font-mono text-[#F5F5F5] break-all select-all">{oneTimeSecret}</div>
        </div>
      )}

      {/* 1. API Keys, Signed Webhooks & External Adapter Boundaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <KeyRound size={16} className="text-[#D4AF37]" /> Scoped Sandbox API Keys &amp; HMAC Webhooks
            </h2>
            <button
              type="button"
              onClick={handleRegisterAndDeliverWebhook}
              className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/50 text-[#D4AF37] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Webhook size={13} /> Deliver Signed Webhook
            </button>
          </div>

          <form onSubmit={handleIssueKey} className="flex gap-2 text-xs">
            <input
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold cursor-pointer">
              Issue Scoped Key
            </button>
          </form>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {keys.map((k) => (
              <div key={k.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F5F5F5]">{k.label}</div>
                  <div className="font-mono text-[10px] text-[#A0A0A0]">
                    {k.keyPrefix}... · scopes=[{k.scopes.join(', ')}] · {k.status}
                  </div>
                </div>
                {k.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => handleRevokeKey(k.id)}
                    className="px-2.5 py-1 rounded bg-red-950 border border-red-800 text-red-300 text-[10px] cursor-pointer"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-[#A0A0A0] flex items-center gap-1.5">
              <Code2 size={13} className="text-[#D4AF37]" /> External Adapter Boundaries ({adapters.length}) · Webhooks Delivered: {deliveries.length}
            </div>
            {adapters.map((a) => (
              <div key={a.id} className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[11px] flex items-center justify-between gap-2">
                <span className="text-[#F5F5F5] truncate">{a.providerName}</span>
                <span className="font-mono text-[10px] text-amber-300 shrink-0">{a.adapterState}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Private Document & Evidence Vault */}
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
            <FileLock2 size={16} className="text-[#D4AF37]" /> Private Document Vault (Non-Public Disk Storage + Token Download)
          </h2>

          <form onSubmit={handleUploadVaultDoc} className="space-y-2 text-xs">
            <input
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Document Title"
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
            />
            <textarea
              value={newDocText}
              onChange={(e) => setNewDocText(e.target.value)}
              rows={2}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
            />
            <button type="submit" className="min-h-[38px] px-4 rounded-xl bg-[#D4AF37] text-black font-semibold cursor-pointer">
              Store in Private Vault (SHA-256 + Malware Check)
            </button>
          </form>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {vaultDocs.map((d) => (
              <div key={d.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-[#F5F5F5] truncate">{d.title}</div>
                  <div className="font-mono text-[10px] text-[#A0A0A0]">
                    {d.id} · v{d.version} · {d.classification} · {d.sizeBytes}B
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadVaultDoc(d.id)}
                  className="px-2.5 py-1 rounded border border-[#D4AF37]/50 text-[#D4AF37] text-[10px] shrink-0 cursor-pointer"
                >
                  Token Download
                </button>
              </div>
            ))}
          </div>

          {downloadedPreview && (
            <pre className="bg-[#09090b] border border-emerald-900/60 rounded-xl p-3 text-[11px] font-mono text-emerald-300 whitespace-pre-wrap">
              {downloadedPreview}
            </pre>
          )}
        </div>
      </div>

      {/* 3. 6-Stage Security Incidents, Commercial Subscriptions & Privacy Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#D4AF37]" /> 6-Stage Security Incidents
            </h2>
            <button
              type="button"
              onClick={handleCreateIncident}
              className="px-2.5 py-1 rounded bg-[#D4AF37] text-black font-semibold text-[11px] cursor-pointer"
            >
              Open Incident
            </button>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {incidents.map((inc) => (
              <div key={inc.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F5F5F5]">{inc.title}</span>
                  <span className="font-mono text-[10px] text-[#D4AF37]">{inc.stage}</span>
                </div>
                {inc.stage !== 'POST_INCIDENT_REVIEW' && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceIncident(inc)}
                    className="px-2.5 py-1 rounded border border-[#27272a] text-[10px] text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
                  >
                    Advance Stage →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
            <CreditCard size={16} className="text-[#D4AF37]" /> Governance Plans (Wallet-Separated)
          </h2>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {plans.map((p) => (
              <div key={p.id} className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-xs flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#F5F5F5]">{p.name}</div>
                  <div className="font-mono text-[10px] text-[#A0A0A0]">
                    {(p.monthlyPriceMinor / 100).toLocaleString()} {p.currency}/mo · branches={p.includedBranches}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubscribe(p.id)}
                  className="px-2.5 py-1 rounded bg-[#D4AF37] text-black font-semibold text-[10px] shrink-0 cursor-pointer"
                >
                  Subscribe
                </button>
              </div>
            ))}
            <div className="text-[11px] font-mono text-emerald-400">
              Active Subs: {subscriptions.length} · Issued Invoices: {invoices.length} (Wallet-Separated)
            </div>
          </div>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
            <Search size={16} className="text-[#D4AF37]" /> Privacy-Respecting Economic Search
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2 text-xs">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-[#F5F5F5]"
            />
            <button type="submit" className="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold cursor-pointer">
              Search
            </button>
          </form>
          {searchResults && (
            <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-xs space-y-1 font-mono">
              <div className="text-emerald-400">privacyIsolationApplied={String(searchResults.privacyIsolationApplied)}</div>
              <div className="text-[#F5F5F5]">Orgs visible: {searchResults.organisations?.length || 0}</div>
              <div className="text-[#A0A0A0]">Participants: {searchResults.participants?.length || 0}</div>
              <div className="text-[#A0A0A0]">Listings: {searchResults.listings?.length || 0}</div>
              <div className="text-[#A0A0A0]">Countries: {searchResults.countries?.length || 0}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
