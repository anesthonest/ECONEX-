/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 — Interoperability Gateway, Event Outbox & DLQ Replay, Document & Evidence Vault
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  FileLock2,
  KeyRound,
  Plug,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'INTEROPERABILITY' | 'EVENTS' | 'VAULT';
}

export const V28InteroperabilityEventsView: React.FC<Props> = ({ initialSubTab = 'INTEROPERABILITY' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'INTEROPERABILITY' | 'EVENTS' | 'VAULT'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [connectors, setConnectors] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any>({ events: [], deadLetters: [] });
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [hmacResult, setHmacResult] = useState<string | null>(null);

  // Vault Upload Form
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('INSPECTION_EVIDENCE');
  const [linkedEntityId, setLinkedEntityId] = useState('V28-CTR-SEED-01');

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
      const [cRes, eRes, vRes] = await Promise.all([
        ApiClient.v28GetConnectors(actor).catch(() => ({ connectors: [] })),
        ApiClient.v28GetEvents(actor).catch(() => ({ events: [], deadLetters: [] })),
        ApiClient.v28GetVaultDocuments(actor).catch(() => ({ documents: [] })),
      ]);
      setConnectors(Array.isArray(cRes?.connectors) ? cRes.connectors : []);
      setEventsData(eRes || { events: [], deadLetters: [] });
      setVaultDocs(Array.isArray(vRes?.documents) ? vRes.documents : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load V28 interoperability & vault workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId]);

  const handleSignWebhook = async () => {
    setError(null);
    try {
      const res = await ApiClient.v28SignWebhook({ event: 'V28.TEST_PING', ts: Date.now() }, 'econex-v28-sandbox-key', actor);
      setHmacResult(res.signatureHeader);
      setFeedback('Generated and verified HMAC-SHA256 webhook signature.');
    } catch (err: any) {
      setError(err?.message || 'HMAC signing failed.');
    }
  };

  const handleTransitionConnector = async (connectorId: string, state: string) => {
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v28TransitionConnector(connectorId, { state }, actor);
      setFeedback(`Connector ${res.providerCode} updated to ${res.state}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Connector lifecycle promotion blocked by governance gate.');
    }
  };

  const handleReplayDlq = async (dlqId: string) => {
    setError(null);
    setFeedback(null);
    try {
      const dlq = await ApiClient.v28ReplayDlqEvent(dlqId, actor);
      setFeedback(`Requeued dead-letter event ${dlq.id} (replayCount=${dlq.replayCount}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'DLQ replay requires Platform Admin authority.');
    }
  };

  const handleRegisterDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const doc = await ApiClient.v28RegisterVaultDocument(
        {
          title: docTitle.trim() || 'Inspection Certificate',
          category: docCategory,
          mimeType: 'application/pdf',
          linkedEntityType: 'CONTRACT',
          linkedEntityId,
        },
        actor
      );
      setFeedback(`Registered SHA-256 checksummed vault record ${doc.id}.`);
      setDocTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Vault registration failed.');
    }
  };

  const handleDocGov = async (docId: string, action: string) => {
    setError(null);
    setFeedback(null);
    try {
      const doc = await ApiClient.v28UpdateVaultGovernance(docId, action, actor);
      setFeedback(`Document ${doc.id} -> verification=${doc.verificationStatus}, legalHold=${String(doc.legalHold)}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Vault governance requires Platform Admin.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D4AF37]">INTEROPERABILITY, EVENT ORCHESTRATION &amp; EVIDENCE VAULT</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1 flex items-center gap-2">
              <Plug className="text-[#D4AF37]" size={24} />
              Gateway Connectors, Domain Events &amp; Evidence Vault
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              12-category interoperability registry (sandbox-gated prior to external credentials), outbox DLQ replay, and SHA-256 legal-hold vault records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['INTEROPERABILITY', 'EVENTS', 'VAULT'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  tab === t ? 'bg-[#D4AF37] text-[#050505]' : 'bg-[#181818] text-[#C0C0C0] border border-[#27272a]'
                }`}
              >
                {t}
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

      {tab === 'INTEROPERABILITY' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#C0C0C0]">
              <KeyRound size={16} className="text-[#D4AF37]" />
              <span>HMAC-SHA256 Webhook Payload Signature Verifier {hmacResult ? `→ ${hmacResult.slice(0, 32)}...` : ''}</span>
            </div>
            <button
              type="button"
              onClick={handleSignWebhook}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer whitespace-nowrap"
            >
              Test Webhook HMAC Sign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="text-xs text-[#A0A0A0]">Loading connectors...</div>
            ) : (
              connectors.map((c) => (
                <div key={c.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#D4AF37]">{c.providerCode} · {c.category}</span>
                    <span className="font-mono text-[#F5F5F5]">{c.state}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F5F5F5]">{c.name}</div>
                  <div className="text-[#A0A0A0]">
                    Health: {c.lastHealthStatus} · Live Auth Claimed: {String(c.liveCredentialsConfigured)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTransitionConnector(c.id, 'SANDBOX_CONNECTED')}
                      className="px-3 py-1 rounded-lg bg-[#181818] border border-[#27272a] text-[#C0C0C0] cursor-pointer"
                    >
                      Sandbox Connect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTransitionConnector(c.id, 'ACTIVE')}
                      className="px-3 py-1 rounded-lg bg-[#181818] border border-[#D4AF37] text-[#D4AF37] cursor-pointer"
                    >
                      Attempt ACTIVE (Dual-Gate)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'EVENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <Activity size={16} className="text-[#D4AF37]" /> Domain Event Outbox ({eventsData.events?.length || 0})
            </h2>
            {(eventsData.events || []).slice(0, 12).map((e: any) => (
              <div key={e.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3">
                <div className="font-mono text-[#D4AF37]">{e.eventType} · {e.status}</div>
                <div className="text-[#A0A0A0] font-mono">Correlation: {e.correlationId}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Dead-Letter Queue ({eventsData.deadLetters?.length || 0})</h2>
            {(eventsData.deadLetters || []).map((d: any) => (
              <div key={d.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-amber-300">{d.id} · {d.status}</span>
                  <span className="text-[#A0A0A0]">Replays: {d.replayCount}</span>
                </div>
                <div className="text-[#C0C0C0]">{d.failureReason}</div>
                <button
                  type="button"
                  onClick={() => handleReplayDlq(d.id)}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                >
                  Replay Dead-Letter Event
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'VAULT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          <form onSubmit={handleRegisterDoc} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <FileLock2 size={16} className="text-[#D4AF37]" /> Register Evidence Record
            </h2>
            <input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Document title"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
              required
            />
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
            >
              <option value="INSPECTION_EVIDENCE">INSPECTION_EVIDENCE</option>
              <option value="TRADE_COMMERCIAL">TRADE_COMMERCIAL</option>
              <option value="KYC_KYB">KYC_KYB</option>
              <option value="SHIPMENT_POD">SHIPMENT_POD</option>
              <option value="CONTRACT_SIGNED">CONTRACT_SIGNED</option>
            </select>
            <input
              value={linkedEntityId}
              onChange={(e) => setLinkedEntityId(e.target.value)}
              placeholder="Linked Entity ID"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Store SHA-256 Record
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Vault Documents &amp; Legal Hold ({vaultDocs.length})</h2>
            {vaultDocs.map((doc) => (
              <div key={doc.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[#D4AF37]">{doc.id} · {doc.verificationStatus} · Legal Hold: {String(doc.legalHold)}</div>
                    <div className="text-sm font-semibold text-[#F5F5F5]">{doc.title}</div>
                    <div className="text-[#A0A0A0] font-mono">SHA-256: {String(doc.sha256Hash || '').slice(0, 24)}...</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDocGov(doc.id, 'VERIFY')}
                      className="px-3 py-1 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocGov(doc.id, doc.legalHold ? 'RELEASE_LEGAL_HOLD' : 'ENABLE_LEGAL_HOLD')}
                      className="px-3 py-1 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] cursor-pointer"
                    >
                      {doc.legalHold ? 'Release Hold' : 'Legal Hold'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
