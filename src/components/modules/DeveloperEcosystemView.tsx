/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V3 - Developer Ecosystem & Scoped APIs
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Code,
  Key,
  Webhook,
  Shield,
  Plus,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  Layers,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  DeveloperApplication,
  DeveloperWebhookDelivery,
} from '../../types/index.ts';

export default function DeveloperEcosystemView() {
  const [apps, setApps] = useState<DeveloperApplication[]>([]);
  const [deliveries, setDeliveries] = useState<DeveloperWebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  // New App Form
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [appName, setAppName] = useState('FreightLogistics Automated Dispatcher');
  const [isLive, setIsLive] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<
    ('read:market' | 'read:prices' | 'write:contracts' | 'read:traceability' | 'read:warehouses')[]
  >(['read:market', 'read:prices']);
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/mock-endpoint-aros');
  const [submitting, setSubmitting] = useState(false);

  // Webhook Test Form
  const [selectedAppId, setSelectedAppId] = useState('');
  const [testEvent, setTestEvent] = useState<'payment.confirmed' | 'contract.signed' | 'shipment.dispatched'>('payment.confirmed');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, delivData] = await Promise.all([
        api.getDeveloperApps(),
        api.getDeveloperWebhookDeliveries(),
      ]);
      setApps(appData);
      setDeliveries(delivData);
      if (appData.length > 0 && !selectedAppId) {
        setSelectedAppId(appData[0].id);
      }
    } catch (err) {
      console.error('Failed to load developer applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName) return;
    setSubmitting(true);
    try {
      await api.createDeveloperApp({
        appName,
        isLive,
        allowedScopes: selectedScopes,
        webhookUrl,
      });
      setShowNewAppModal(false);
      setAppName('');
      setActionFeedback({ type: 'success', message: 'Scoped developer application and API key created.' });
      await loadData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: 'Could not create application: ' + (err.message || err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!selectedAppId) return;
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await api.testDeveloperWebhook({
        appId: selectedAppId,
        event: testEvent,
        payload: {
          testEvent,
          timestamp: new Date().toISOString(),
          details: 'Dispatched via ECONEX Developer Ecosystem Suite',
        },
      });
      setTestResult(res);
      await loadData();
    } catch (err: any) {
      setTestResult({ error: err.message || 'Webhook test failed' });
    } finally {
      setTestingWebhook(false);
    }
  };

  const toggleScope = (scope: any) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setActionFeedback({ type: 'success', message: 'API key copied to clipboard.' });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {actionFeedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between ${
            actionFeedback.type === 'error'
              ? 'bg-red-950/60 border-red-700 text-red-200'
              : 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-[11px] underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Top Banner */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
              ECONEX Developer Ecosystem
            </span>
            <span className="text-xs text-[#A0A0A0]">Scoped API Keys &amp; Webhook Subscriptions</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">API Management &amp; External Integrations</h1>
          <p className="text-sm text-[#A0A0A0] max-w-2xl mt-1">
            Standardized REST endpoints and cryptographic webhooks enabling third-party ERPs, commercial banks, and freight dispatchers to build on ECONEX infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-[#333] hover:border-[#D4AF37] text-[#A0A0A0] hover:text-[#D4AF37] transition"
            title="Refresh Apps"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewAppModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c29d2f] text-black font-semibold text-sm rounded-xl transition shadow-lg shadow-[#D4AF37]/10"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Scoped API Key</span>
          </button>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#F5F5F5]">Registered Developer Applications</h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#777]">Loading applications...</div>
        ) : apps.length === 0 ? (
          <div className="p-8 bg-[#121212] border border-[#222] rounded-xl text-center text-xs text-[#777]">
            No developer applications registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apps.map((app) => (
              <div key={app.id} className="p-5 bg-[#121212] border border-[#222] rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">{app.appName}</h3>
                    <span className="text-[11px] font-mono text-[#777]">ID: {app.id}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      app.apiKey.startsWith('aros_live_')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {app.apiKey.startsWith('aros_live_') ? 'LIVE PRODUCTION' : 'TEST SANDBOX'}
                  </span>
                </div>

                {/* API Key Box */}
                <div className="p-2.5 bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-between font-mono text-xs">
                  <div className="text-[#D4AF37] truncate mr-2">
                    {app.apiKey.slice(0, 16)}••••••••••••••••
                  </div>
                  <button
                    onClick={() => copyToClipboard(app.apiKey)}
                    className="text-[#777] hover:text-[#F5F5F5] transition p-1"
                    title="Copy Full Key"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Allowed Scopes */}
                <div className="space-y-1">
                  <span className="text-[11px] text-[#A0A0A0] block">Authorized Scopes:</span>
                  <div className="flex flex-wrap gap-1">
                    {app.allowedScopes.map((scope, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono bg-[#181818] text-[#CCC] px-2 py-0.5 rounded border border-[#2a2a2a]"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e1e1e] flex items-center justify-between text-xs text-[#777] font-mono">
                  <span>Rate Limit: {app.rateLimitPerMin} req/min</span>
                  <span>Total Calls: {app.requestCountTotal || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook Testing & Delivery Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Dispatcher */}
        <div className="bg-[#121212] border border-[#222] p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-sm font-bold text-[#F5F5F5]">Webhook Dispatch Simulator</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#A0A0A0] block mb-1">Target Application</label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
              >
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.appName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#A0A0A0] block mb-1">Event Type</label>
              <select
                value={testEvent}
                onChange={(e) => setTestEvent(e.target.value as any)}
                className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none font-mono"
              >
                <option value="payment.confirmed">payment.confirmed</option>
                <option value="contract.signed">contract.signed</option>
                <option value="shipment.dispatched">shipment.dispatched</option>
              </select>
            </div>

            <button
              onClick={handleTestWebhook}
              disabled={testingWebhook || !selectedAppId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D4AF37] text-black font-semibold text-sm rounded-xl hover:bg-[#c29d2f] transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{testingWebhook ? 'Dispatching...' : 'Dispatch Test Webhook'}</span>
            </button>

            {testResult && (
              <div className="p-3 bg-[#0a0a0a] border border-[#222] rounded-xl text-xs font-mono">
                <span className="text-[#A0A0A0] block mb-1">Result:</span>
                <pre className="text-emerald-400 overflow-x-auto">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Deliveries Log */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#222] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Recent Webhook Delivery Log</h2>
            <span className="text-xs font-mono text-[#A0A0A0]">{deliveries.length} Deliveries</span>
          </div>

          {deliveries.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#777]">
              No webhooks dispatched yet. Use the simulator to send a test event.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#A0A0A0]">
                <thead className="bg-[#181818] text-[#F5F5F5] text-xs uppercase font-mono tracking-wider border-b border-[#222]">
                  <tr>
                    <th className="p-3">Delivery ID</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">HTTP Code</th>
                    <th className="p-3">Attempts</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {deliveries.map((deliv) => (
                    <tr key={deliv.id} className="hover:bg-[#181818]/50 transition font-sans">
                      <td className="p-3 font-mono text-xs text-[#F5F5F5]">{deliv.id}</td>
                      <td className="p-3 font-mono text-xs text-[#D4AF37]">{deliv.event}</td>
                      <td className="p-3">
                        <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {deliv.deliveryStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-emerald-400">{deliv.httpStatusCode || 200}</td>
                      <td className="p-3 font-mono text-xs text-[#CCC]">{deliv.attempts}</td>
                      <td className="p-3 font-mono text-xs text-[#777]">
                        {new Date(deliv.lastAttemptAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New App Modal */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#333] rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#F5F5F5]">Provision Scoped API Key</h2>
              <button
                onClick={() => setShowNewAppModal(false)}
                className="text-[#A0A0A0] hover:text-[#F5F5F5] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">Application / Service Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">Webhook Endpoint URL (Optional)</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-xs font-mono rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] block mb-2">Select Granted Scopes</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'read:market',
                    'read:prices',
                    'write:contracts',
                    'read:traceability',
                    'read:warehouses',
                  ].map((scope) => (
                    <div
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`p-2.5 rounded-lg border cursor-pointer font-mono text-[11px] transition ${
                        selectedScopes.includes(scope as any)
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-[#181818] border-[#333] text-[#888]'
                      }`}
                    >
                      {scope}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#181818] border border-[#333] rounded-xl text-xs text-[#CCC]">
                <input
                  type="checkbox"
                  id="liveKeyToggle"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className="rounded text-[#D4AF37]"
                />
                <label htmlFor="liveKeyToggle">
                  Generate Live Production Key (<code className="text-[#D4AF37]">aros_live_...</code> with 240 req/min)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowNewAppModal(false)}
                  className="px-4 py-2 text-sm text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#D4AF37] text-black font-semibold text-sm rounded-xl hover:bg-[#c29d2f] transition disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Provision Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
