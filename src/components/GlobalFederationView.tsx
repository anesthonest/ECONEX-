/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V9.0 - Global Sovereign Federation & Federated Identity Hub
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/apiClient.ts';
import {
  FederationNetwork,
  FederationStatus,
  FederatedIdentityIssuer,
  FederatedIdentityClaim,
  InteroperabilityStandardRecord,
  MessageTranslationRecord
} from '../types/index.ts';
import {
  Globe,
  ShieldCheck,
  ShieldAlert,
  Radio,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Code,
  Lock,
  Layers,
  ArrowRight,
  UserCheck,
  Ban,
  Activity,
  Terminal,
  Clock
} from 'lucide-react';

export const GlobalFederationView: React.FC = () => {
  const [federations, setFederations] = useState<FederationNetwork[]>([]);
  const [issuers, setIssuers] = useState<FederatedIdentityIssuer[]>([]);
  const [claims, setClaims] = useState<FederatedIdentityClaim[]>([]);
  const [standards, setStandards] = useState<InteroperabilityStandardRecord[]>([]);
  const [translations, setTranslations] = useState<MessageTranslationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'federations' | 'identity' | 'interop'>('federations');

  // Modals & form state
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [selectedFed, setSelectedFed] = useState<FederationNetwork | null>(null);
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<FederationStatus>('TECHNICALLY_VALIDATED');
  const [lifecycleNotes, setLifecycleNotes] = useState<string>('');
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  // New federation form
  const [regForm, setRegForm] = useState({
    countryCode: 'RW',
    organizationName: '',
    responsibleAuthority: '',
    technicalEndpoint: '',
    supportedCurrencies: 'RWF, USD, UGX',
    supportedTransactionTypes: ['CROSS_BORDER_SETTLEMENT', 'IDENTITY_RESOLUTION']
  });

  // Translation test state
  const [translateInput, setTranslateInput] = useState<string>(
    `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">\n  <FIToFICstmrCdtTrf>\n    <GrpHdr>\n      <MsgId>EAPS-2026-UG-KE-7721</MsgId>\n      <CreDtTm>2026-11-10T12:00:00Z</CreDtTm>\n    </GrpHdr>\n    <CdtTrfTxInf>\n      <IntrBkSttlmAmt Ccy="UGX">250000000</IntrBkSttlmAmt>\n      <Dbtr><Nm>Mukwano Agro-Processing Ltd</Nm></Dbtr>\n      <Cdtr><Nm>Nairobi Flour Millers</Nm></Cdtr>\n    </CdtTrfTxInf>\n  </FIToFICstmrCdtTrf>\n</Document>`
  );
  const [translateResult, setTranslateResult] = useState<MessageTranslationRecord | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Resolution test
  const [resolveAetherId, setResolveAetherId] = useState<string>('DID:AROS:UG:PART-UG-KAK-001');
  const [resolveResult, setResolveResult] = useState<any>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmRevokeClaimId, setConfirmRevokeClaimId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [feds, iss, cls, stds] = await Promise.all([
        api.getFederations(),
        api.getFederatedIssuers(),
        api.getFederatedClaims(),
        api.getInteroperabilityStandards()
      ]);
      setFederations(feds || []);
      setIssuers(iss || []);
      setClaims(cls || []);
      setStandards(stds || []);
    } catch (err) {
      console.error('Failed to load federation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterFederation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.organizationName || !regForm.responsibleAuthority || !regForm.technicalEndpoint) {
      return;
    }
    try {
      await api.registerFederation({
        countryCode: regForm.countryCode,
        organizationName: regForm.organizationName,
        responsibleAuthority: regForm.responsibleAuthority,
        authorizedRepresentatives: ['admin@sovereign.node'],
        technicalEndpoint: regForm.technicalEndpoint,
        supportedInterfaces: ['REST_API', 'ISO20022'],
        supportedCurrencies: regForm.supportedCurrencies.split(',').map(s => s.trim().toUpperCase()),
        supportedTransactionTypes: regForm.supportedTransactionTypes as any
      });
      setShowRegisterModal(false);
      setRegForm({
        countryCode: 'RW',
        organizationName: '',
        responsibleAuthority: '',
        technicalEndpoint: '',
        supportedCurrencies: 'RWF, USD, UGX',
        supportedTransactionTypes: ['CROSS_BORDER_SETTLEMENT', 'IDENTITY_RESOLUTION']
      });
      await loadData();
    } catch (err: any) {
      setActionError('Registration failed: ' + err.message);
    }
  };

  const handleUpdateLifecycle = async () => {
    if (!selectedFed) return;
    setLifecycleError(null);
    try {
      const res = await api.updateFederationLifecycle(
        selectedFed.id,
        targetStatus,
        'chief.sovereign.controller',
        lifecycleNotes || `Transitioned to ${targetStatus}`
      );
      if (res.error) {
        setLifecycleError(res.error);
        return;
      }
      setLifecycleModalOpen(false);
      setSelectedFed(null);
      await loadData();
    } catch (err: any) {
      setLifecycleError(err.message);
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const res = await api.translateMessage({
        sourceFormat: 'ISO20022_PACS008_XML',
        targetFormat: 'CANONICAL_AROS_PAYMENT_JSON',
        providerReference: `TEST-REF-${Date.now().toString(36).toUpperCase()}`,
        rawPayload: translateInput,
        transformationRules: ['ISO_XML_TO_CANONICAL_JSON', 'CURRENCY_NORMALIZATION', 'AUDIT_SIGNATURE_SEAL']
      });
      setTranslateResult(res);
      setTranslations(prev => [res, ...prev]);
    } catch (err: any) {
      setActionError('Translation failed: ' + err.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleResolveIdentity = async () => {
    setActionError(null);
    setIsResolving(true);
    try {
      const res = await api.resolveFederatedIdentity(resolveAetherId, 'UG');
      setResolveResult(res);
    } catch (err: any) {
      setActionError('Resolution error: ' + err.message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleRevokeClaim = async (id: string) => {
    setActionError(null);
    try {
      await api.revokeFederatedClaim(id, 'Statutory verification audit revocation');
      setConfirmRevokeClaimId(null);
      await loadData();
    } catch (err: any) {
      setActionError('Revocation failed: ' + err.message);
    }
  };

  const filteredFeds = federations.filter(f =>
    f.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.countryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.responsibleAuthority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: FederationStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">ACTIVE SOVEREIGN</span>;
      case 'PRODUCTION_CONNECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">PROD CONNECTED</span>;
      case 'SANDBOX_CONNECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">SANDBOX VERIFIED</span>;
      case 'AUTHORIZATION_VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">AUTH CLEARED</span>;
      case 'TECHNICALLY_VALIDATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">TECH VALIDATED</span>;
      case 'REGISTERED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-zinc-400 border border-zinc-700">PENDING VALIDATION</span>;
      case 'SUSPENDED':
      case 'REVOKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950 text-red-400 border border-red-800">{status}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-zinc-400 border border-zinc-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}
      {/* Top Banner Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-[#D4AF37] uppercase">ECONEX FEDERATED INFRASTRUCTURE</span>
              <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[10px] font-mono">
                SOVEREIGN INTEROPERABILITY
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
              Global Economic Federation & Sovereign Identity Grid
            </h1>
            <p className="text-xs text-[#A0A0A0] max-w-3xl">
              Federated network connecting independent national economic networks, central bank clearing switches, ISO 20022 message translation hubs, and cross-border identity registries without centralizing sovereign authority.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3 py-2 bg-[#181818] hover:bg-[#202020] text-[#F5F5F5] rounded-lg text-xs font-medium border border-[#27272a] flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Sync Network</span>
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus size={14} />
              <span>Register Federation</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#1f1f23]">
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <Globe size={11} className="text-[#D4AF37]" /> Participating Federations
            </div>
            <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-0.5">{federations.length} Sovereign Nodes</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">7 Multi-Country Corridors</div>
          </div>

          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-emerald-400" /> Active Anchor Nodes
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {federations.filter(f => f.status === 'ACTIVE').length} Validated
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5 font-mono">mTLS & PKI Verified</div>
          </div>

          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <UserCheck size={11} className="text-[#D4AF37]" /> Federated Identity Claims
            </div>
            <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-0.5">{claims.length} Assertions</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 font-mono">100% Provenance Hashed</div>
          </div>

          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[10px] uppercase font-mono text-[#A0A0A0] flex items-center gap-1.5">
              <Code size={11} className="text-cyan-400" /> Interoperability Protocols
            </div>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">ISO 20022 + REST + AS4</div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5 font-mono">Canonical Schema Engine</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#27272a] gap-2">
        <button
          onClick={() => setActiveSubTab('federations')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'federations'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Globe size={14} />
          <span>Sovereign Federations ({federations.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('identity')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'identity'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <UserCheck size={14} />
          <span>Federated Identity & Claims ({claims.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('interop')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'interop'
              ? 'border-[#D4AF37] text-[#D4AF37] bg-[#121212]'
              : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Radio size={14} />
          <span>Interoperability & Message Translation</span>
        </button>
      </div>

      {/* Subtab 1: Sovereign Federations */}
      {activeSubTab === 'federations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-2.5 text-[#71717a]" />
              <input
                type="text"
                placeholder="Filter by country, organization, or authority..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] border border-[#27272a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F5F5F5] placeholder-[#71717a] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="text-xs text-[#71717a] font-mono">
              Showing {filteredFeds.length} of {federations.length} registered sovereign networks
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeds.map((fed) => (
              <div
                key={fed.id}
                className="bg-[#121212] border border-[#27272a] hover:border-[#38383f] rounded-xl p-5 shadow-lg transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#1f1f23] text-[#D4AF37] rounded font-mono text-[11px] font-bold border border-[#27272a]">
                        {fed.countryCode}
                      </span>
                      <h3 className="font-bold text-sm text-[#F5F5F5]">{fed.organizationName}</h3>
                    </div>
                    <div className="text-[11px] text-[#A0A0A0] flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>{fed.responsibleAuthority}</span>
                    </div>
                  </div>
                  <div>{getStatusBadge(fed.status)}</div>
                </div>

                <div className="bg-[#09090b] rounded-lg p-3 border border-[#1f1f23] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A0A0A0]">Technical Endpoint:</span>
                    <span className="font-mono text-cyan-300 truncate max-w-[220px]">{fed.technicalEndpoint}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A0A0A0]">Supported Interfaces:</span>
                    <span className="font-mono text-[#F5F5F5]">{fed.supportedInterfaces.join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A0A0A0]">Settlement Currencies:</span>
                    <span className="font-mono text-[#D4AF37] font-semibold">{fed.supportedCurrencies.join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A0A0A0]">Cert Fingerprint:</span>
                    <span className="font-mono text-[10px] text-[#71717a] truncate max-w-[200px]">
                      {fed.securityCredentials?.certificateThumbprint}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A0A0A0]">Availability SLA:</span>
                    <span className="font-mono text-emerald-400">{fed.availabilityPercent}% Uptime</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1f1f23]">
                  <div className="text-[10px] text-[#71717a] font-mono">
                    Audit log entries: {fed.registrationHistory?.length || 1}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFed(fed);
                      setLifecycleModalOpen(true);
                      setLifecycleError(null);
                    }}
                    className="px-3 py-1.5 bg-[#18181b] hover:bg-[#222228] border border-[#27272a] text-[#F5F5F5] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Lifecycle Governance</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Federated Identity */}
      {activeSubTab === 'identity' && (
        <div className="space-y-6">
          {/* Identity Issuers Overview */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#D4AF37]" />
                Authorized Federated Identity Issuers
              </h3>
              <span className="text-[11px] text-[#A0A0A0] font-mono">
                {issuers.length} Verified National & International Issuers
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {issuers.map((iss) => (
                <div key={iss.id} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F5F5F5]">{iss.issuerCountry}</span>
                    <span className="font-mono text-emerald-400 font-bold">{iss.trustScore}/100 Trust</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#D4AF37]">{iss.issuerName}</div>
                  <div className="text-[10px] text-[#A0A0A0]">Authority: {iss.issuerAuthority}</div>
                  <div className="text-[10px] font-mono text-cyan-300">Method: {iss.verificationMethod}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1 border-t border-[#1f1f23]">
                    <CheckCircle2 size={10} /> Cross-Border Resolution Enabled
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Border Identity Resolution Simulator */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Terminal size={15} className="text-cyan-400" />
                  Cross-Border Sovereign Identity Resolution Test
                </h3>
                <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                  Verify cryptographic claims across jurisdictions without exposing raw identity documents.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={resolveAetherId}
                onChange={(e) => setResolveAetherId(e.target.value)}
                placeholder="Enter subject DID (e.g. DID:AROS:UG:PART-UG-KAK-001)"
                className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                onClick={handleResolveIdentity}
                disabled={isResolving}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
              >
                {isResolving ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                <span>Resolve DID</span>
              </button>
            </div>

            {resolveResult && (
              <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-4 font-mono text-xs space-y-2">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Resolution Authoritative Result:
                </div>
                <div className="text-[#A0A0A0]">Subject: <span className="text-[#F5F5F5]">{resolveResult.subjectAetherId}</span></div>
                <div className="text-[#A0A0A0]">Home Jurisdiction: <span className="text-[#D4AF37] font-bold">{resolveResult.homeJurisdiction}</span></div>
                <div className="text-[#A0A0A0]">Authorized Cross-Border: <span className="text-emerald-400 font-bold">{String(resolveResult.authorized)}</span></div>
                <div className="text-[#A0A0A0]">Active Valid Claims: <span className="text-cyan-400 font-bold">{resolveResult.activeClaims?.length}</span></div>

                <div className="space-y-1.5 pt-2 border-t border-[#1f1f23]">
                  {resolveResult.activeClaims?.map((c: any) => (
                    <div key={c.id} className="bg-[#121212] p-2 rounded border border-[#27272a] flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[#D4AF37] font-semibold">{c.claimType}: </span>
                        <span className="text-[#F5F5F5]">{c.claimValue}</span>
                      </div>
                      <span className="text-[#71717a] text-[10px]">Hash: {c.provenanceHash?.slice(0, 14)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Claims Directory */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-3 border-b border-[#27272a] bg-[#161619] flex items-center justify-between text-xs font-semibold text-[#A0A0A0]">
              <span>FEDERATED IDENTITY CLAIMS & PROVENANCE RECORD</span>
              <span>REVOCATION GOVERNANCE</span>
            </div>
            <div className="divide-y divide-[#1e1e24]">
              {claims.map((claim) => (
                <div key={claim.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#D4AF37] font-bold">{claim.claimType}</span>
                      <span className="text-[#444]">|</span>
                      <span className="font-bold text-[#F5F5F5]">{claim.subjectName}</span>
                      <span className="px-1.5 py-0.2 bg-[#1f1f23] text-[#A0A0A0] rounded text-[10px] font-mono border border-[#27272a]">
                        {claim.homeJurisdiction}
                      </span>
                      {claim.isRevoked ? (
                        <span className="px-1.5 py-0.2 bg-red-950 text-red-400 rounded text-[10px] font-mono border border-red-800">
                          REVOKED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded text-[10px] font-mono border border-emerald-800">
                          VALID
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#A0A0A0] font-mono">
                      Subject DID: <span className="text-cyan-300">{claim.subjectAetherId}</span>
                    </div>
                    <div className="text-[11px] text-[#A0A0A0]">
                      Assertion Value: <span className="text-[#F5F5F5] font-semibold">{claim.claimValue}</span>
                    </div>
                    <div className="text-[10px] text-[#71717a] font-mono flex items-center gap-2">
                      <span>Provenance Hash: {claim.provenanceHash}</span>
                      <span>Issuer: {claim.issuerName}</span>
                    </div>
                  </div>

                  {!claim.isRevoked && (
                    confirmRevokeClaimId === claim.id ? (
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                          onClick={() => handleRevokeClaim(claim.id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold"
                        >
                          Confirm Revoke
                        </button>
                        <button
                          onClick={() => setConfirmRevokeClaimId(null)}
                          className="px-2.5 py-1 bg-zinc-800 text-[#A0A0A0] rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRevokeClaimId(claim.id)}
                        className="px-3 py-1 bg-red-950/40 hover:bg-red-950 border border-red-800/60 text-red-400 rounded text-xs font-semibold flex items-center gap-1 self-start md:self-auto transition-colors"
                      >
                        <Ban size={12} />
                        <span>Revoke Claim</span>
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Interoperability & Message Translation */}
      {activeSubTab === 'interop' && (
        <div className="space-y-6">
          {/* Standards Registry */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Radio size={16} className="text-[#D4AF37]" />
                  Universal Interoperability Standard Adapters
                </h3>
                <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                  Controlled translation between ISO 20022 XML, AS4 file payloads, and canonical ECONEX structures.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {standards.map((std) => (
                <div key={std.id} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-300 font-bold">{std.protocolType}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-mono">
                      {std.status}
                    </span>
                  </div>
                  <div className="font-bold text-[#F5F5F5]">{std.standardName}</div>
                  <div className="text-[11px] text-[#A0A0A0]">Provider: {std.providerName}</div>
                  <div className="text-[10px] text-[#71717a] font-mono">
                    Formats: {std.messageFormats?.join(', ')} | Auth: {std.authenticationMethod}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Message Translator */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Terminal size={15} className="text-cyan-400" />
                  ISO 20022 / AS4 Canonical Message Translation Simulator
                </h3>
                <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                  Input raw ISO 20022 pacs.008 or pain.001 XML to execute schema normalization into canonical JSON.
                </p>
              </div>
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                {isTranslating ? <RefreshCw size={13} className="animate-spin" /> : <Code size={13} />}
                <span>Execute Normalization</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A0A0A0]">Incoming Raw Wire Message (ISO 20022 / XML)</label>
                <textarea
                  rows={9}
                  value={translateInput}
                  onChange={(e) => setTranslateInput(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A0A0A0]">Canonical ECONEX Normalized Schema (Output)</label>
                <div className="w-full h-[188px] bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-[11px] font-mono text-emerald-400 overflow-auto">
                  {translateResult ? (
                    <pre>{JSON.stringify(translateResult.normalizedPayload, null, 2)}</pre>
                  ) : (
                    <div className="text-[#71717a] flex flex-col items-center justify-center h-full text-center">
                      <Terminal size={24} className="mb-2 opacity-50" />
                      <span>Execute normalization to view normalized canonical payload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {translateResult && (
              <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Transformation Status: {translateResult.transformationResult}
                  </span>
                  <span className="text-[#444]">|</span>
                  <span className="text-cyan-300 font-mono text-[11px]">Signature Verified: {String(translateResult.signatureVerified)}</span>
                </div>
                <div className="text-[10px] text-[#71717a] font-mono">
                  Applied Rules: {translateResult.transformationRules?.join(' -> ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Register Federation */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <Globe size={16} className="text-[#D4AF37]" />
                Register Sovereign Federation Network
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-[#71717a] hover:text-[#F5F5F5] text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterFederation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Country / Sovereign Jurisdiction</label>
                <select
                  value={regForm.countryCode}
                  onChange={(e) => setRegForm({ ...regForm, countryCode: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                >
                  <option value="UG">Uganda (UG)</option>
                  <option value="KE">Kenya (KE)</option>
                  <option value="TZ">Tanzania (TZ)</option>
                  <option value="RW">Rwanda (RW)</option>
                  <option value="SS">South Sudan (SS)</option>
                  <option value="CD">DR Congo (CD)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="AE">United Arab Emirates (AE)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Organization / Network Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank of Rwanda FinTech Interop Network"
                  value={regForm.organizationName}
                  onChange={(e) => setRegForm({ ...regForm, organizationName: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Responsible Regulatory Authority</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Bank of Rwanda Payment Systems Directorate"
                  value={regForm.responsibleAuthority}
                  onChange={(e) => setRegForm({ ...regForm, responsibleAuthority: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Sovereign Gateway Technical Endpoint</label>
                <input
                  type="url"
                  required
                  placeholder="https://gateway.node.go.country/v9"
                  value={regForm.technicalEndpoint}
                  onChange={(e) => setRegForm({ ...regForm, technicalEndpoint: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Supported Currencies (Comma Separated)</label>
                <input
                  type="text"
                  value={regForm.supportedCurrencies}
                  onChange={(e) => setRegForm({ ...regForm, supportedCurrencies: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs font-mono text-[#F5F5F5]"
                />
              </div>

              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] text-[11px] text-[#A0A0A0] space-y-1">
                <span className="font-semibold text-[#D4AF37]">Non-Negotiable Sovereign Lifecycle Note:</span>
                <p>
                  Newly registered federations enter status <strong>REGISTERED</strong>. In accordance with zero-trust sovereign architecture, full active inter-clearing requires subsequent technical handshake validation and regulatory license approval.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f23]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] hover:bg-[#202020] text-[#A0A0A0] rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded text-xs shadow-md"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lifecycle Governance */}
      {lifecycleModalOpen && selectedFed && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#D4AF37]" />
                Federation Lifecycle Transition
              </h3>
              <button
                onClick={() => setLifecycleModalOpen(false)}
                className="text-[#71717a] hover:text-[#F5F5F5] text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
                <div className="text-[10px] text-[#A0A0A0]">Federation Target:</div>
                <div className="font-bold text-[#F5F5F5]">{selectedFed.organizationName}</div>
                <div className="text-[11px] font-mono text-[#D4AF37] mt-0.5">Current Status: {selectedFed.status}</div>
              </div>

              {lifecycleError && (
                <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-[11px] flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{lifecycleError}</span>
                </div>
              )}

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Select Target Lifecycle State</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                >
                  <option value="TECHNICALLY_VALIDATED">TECHNICALLY_VALIDATED (Validate mTLS & Endpoint)</option>
                  <option value="AUTHORIZATION_VERIFIED">AUTHORIZATION_VERIFIED (Verify Central Bank License)</option>
                  <option value="SANDBOX_CONNECTED">SANDBOX_CONNECTED (Connect to Staging Testbed)</option>
                  <option value="PRODUCTION_CONNECTED">PRODUCTION_CONNECTED (Attach Live Production Node)</option>
                  <option value="ACTIVE">ACTIVE (Authorize Cross-Border Clearing)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporary Operational Hold)</option>
                  <option value="REVOKED">REVOKED (Permanent Regulatory Revocation)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1 font-semibold">Governance Transition Notes & Reference</label>
                <textarea
                  rows={3}
                  placeholder="Record justification, audit ticket, or regulatory gazette reference..."
                  value={lifecycleNotes}
                  onChange={(e) => setLifecycleNotes(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-xs text-[#F5F5F5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f23]">
                <button
                  type="button"
                  onClick={() => setLifecycleModalOpen(false)}
                  className="px-3 py-1.5 bg-[#18181b] hover:bg-[#202020] text-[#A0A0A0] rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateLifecycle}
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded text-xs shadow-md"
                >
                  Enact State Transition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
