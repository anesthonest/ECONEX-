/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V17.0 - Verified Economic Network Operations & Regional Adoption Control Center (24 Sections)
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileCheck2,
  Layers,
  Lock,
  Network,
  RefreshCw,
  Scale,
  Shield,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { ApiClient } from '../services/apiClient.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

type SectionGroup =
  | 'OVERVIEW_GATES'
  | 'ONBOARDING_ORGS'
  | 'RELATIONSHIPS_COMMERCE'
  | 'TRANSACTIONS_EVIDENCE'
  | 'TRUST_DISPUTES'
  | 'REGIONAL_COOPS'
  | 'RECON_BILLING_GOV'
  | 'OFFLINE_INTEL';

export const V17NetworkControlCenter: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  const actor = {
    userId: currentUser?.id || 'usr_admin_01',
    userRole: role || 'PLATFORM_ADMIN',
    tenantId: 'TEN-UG-ELGON-01',
  };

  const [group, setGroup] = useState<SectionGroup>('OVERVIEW_GATES');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [gatesData, setGatesData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [evidences, setEvidences] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [regional, setRegional] = useState<any>(null);
  const [cooperatives, setCooperatives] = useState<any[]>([]);
  const [reconCases, setReconCases] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [governance, setGovernance] = useState<any>(null);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [migrations, setMigrations] = useState<any>(null);
  const [gateFilter, setGateFilter] = useState<string>('ALL');

  // Interactive Form States
  const [newPartName, setNewPartName] = useState('');
  const [newPartDistrict, setNewPartDistrict] = useState('Mbale');
  const [newListTitle, setNewListTitle] = useState('');
  const [newListPrice, setNewListPrice] = useState('14000');
  const [newListQty, setNewListQty] = useState('500');
  const [newTxAmount, setNewTxAmount] = useState('450000');
  const [newTxQty, setNewTxQty] = useState('30');
  const [disputeTxId, setDisputeTxId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [ov, gt, pt, og, rl, cm, tx, dp, rg, cp, rc, bl, gv, oq, mg] = await Promise.all([
        ApiClient.v17GetOverview(actor),
        ApiClient.v17GetGates(actor),
        ApiClient.v17GetParticipants(actor),
        ApiClient.v17GetOrganizations(actor),
        ApiClient.v17GetRelationships(actor),
        ApiClient.v17GetCommercialListings(actor),
        ApiClient.v17GetTransactions(actor),
        ApiClient.v17GetDisputes(actor),
        ApiClient.v17GetRegional(actor),
        ApiClient.v17GetCooperatives(actor),
        ApiClient.v17GetReconciliationCases(actor).catch(() => ({ cases: [] })),
        ApiClient.v17GetBillingSummary(actor).catch(() => null),
        ApiClient.v17GetGovernancePolicies(actor).catch(() => null),
        ApiClient.v17GetOfflineQueue(actor),
        ApiClient.v17GetMigrations(actor).catch(() => null),
      ]);
      setOverview(ov);
      setGatesData(gt);
      setParticipants(pt?.participants || []);
      setOrgs(og?.organizations || []);
      setRelationships(rl?.relationships || []);
      setInvitations(rl?.invitations || []);
      setListings(cm?.listings || []);
      setRequests(cm?.requests || []);
      setQuotations(cm?.quotations || []);
      setTransactions(tx?.transactions || []);
      setEvidences(tx?.evidences || []);
      setDisputes(dp?.disputes || []);
      setRegional(rg);
      setCooperatives(cp?.cooperatives || []);
      setReconCases(rc?.cases || []);
      setBilling(bl);
      setGovernance(gv);
      setOfflineQueue(oq?.queue || []);
      setMigrations(mg);
      if (!disputeTxId && tx?.transactions?.length) {
        setDisputeTxId(tx.transactions[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load V17 network operations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [currentUser?.id, role]);

  const handleOnboardParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await ApiClient.v17OnboardParticipant(
        {
          displayName: newPartName,
          district: newPartDistrict,
          participantType: 'FARMER',
          consentGranted: true,
        },
        actor
      );
      setStatusMessage(`Onboarded participant ${res.id} (${res.verificationSourceLabel}).`);
      setNewPartName('');
      await loadAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to onboard participant.');
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await ApiClient.v17CreateListing(
        {
          title: newListTitle,
          unitPrice: Number(newListPrice),
          availableQty: Number(newListQty),
          unitCode: 'KG',
          currency: 'UGX',
          district: 'Mbale',
        },
        actor
      );
      setStatusMessage(`Created commercial listing ${res.id} (${res.title}).`);
      setNewListTitle('');
      await loadAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create commercial listing.');
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await ApiClient.v17CreateTransaction(
        {
          buyerId: 'V17-PART-BUYER-01',
          sellerId: 'V17-PART-FARMER-01',
          amount: Number(newTxAmount),
          quantity: Number(newTxQty),
          unitCode: 'KG',
          currency: 'UGX',
        },
        actor
      );
      setStatusMessage(`Initialized V17 transaction ${res.id} in DRAFT (${res.verificationTier}).`);
      await loadAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initialize transaction.');
    }
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await ApiClient.v17OpenDispute(
        {
          transactionId: disputeTxId,
          complainantId: 'V17-PART-BUYER-01',
          reason: disputeReason,
        },
        actor
      );
      setStatusMessage(`Opened 11-stage dispute ${res.id} at stage ${res.stage}.`);
      setDisputeReason('');
      await loadAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to open dispute.');
    }
  };

  const handleRemediateGate = async (gateId: string, targetStatus: string) => {
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await ApiClient.v17RemediateGate(gateId, { targetStatus, submittedEvidence: `Reviewed in V17 Control Center at ${new Date().toISOString()}` }, actor);
      setStatusMessage(`Updated ${gateId} status to ${targetStatus}.`);
      await loadAll();
    } catch (err: any) {
      setErrorMessage(err?.message || `Gate ${gateId} update rejected.`);
    }
  };

  const tabs: { id: SectionGroup; label: string; icon: React.ReactNode }[] = [
    { id: 'OVERVIEW_GATES', label: '1-3. Overview & 27 Gates', icon: <Shield size={14} /> },
    { id: 'ONBOARDING_ORGS', label: '4-6. Participants & Orgs', icon: <Users size={14} /> },
    { id: 'RELATIONSHIPS_COMMERCE', label: '7-9. Relationships & Listings', icon: <ShoppingBag size={14} /> },
    { id: 'TRANSACTIONS_EVIDENCE', label: '10-12. Transactions & Proof', icon: <FileCheck2 size={14} /> },
    { id: 'TRUST_DISPUTES', label: '13-14. Trust & Disputes', icon: <Scale size={14} /> },
    { id: 'REGIONAL_COOPS', label: '15-17. Regional & Co-ops', icon: <Truck size={14} /> },
    { id: 'RECON_BILLING_GOV', label: '18-21. Recon, Billing & Gov', icon: <Wallet size={14} /> },
    { id: 'OFFLINE_INTEL', label: '22-24. Offline, Migration & Intel', icon: <Activity size={14} /> },
  ];

  const statuses = overview?.statuses || {
    ENGINEERING_COMPLETE: true,
    PRODUCTION_READY: false,
    LIVE_PILOT_OPERATIONAL: false,
  };

  const filteredGates = (gatesData?.gates || []).filter((g: any) =>
    gateFilter === 'ALL' ? true : g.status === gateFilter
  );

  return (
    <div className="space-y-6">
      {/* Header & Strict 3-State Truth Banner */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Network size={20} className="text-[#D4AF37]" />
              <h1 className="text-lg font-bold text-[#F5F5F5] tracking-tight">
                ECONEX V17.0 — Verified Economic Network Operations Control Center
              </h1>
            </div>
            <p className="text-xs text-[#A0A0A0]">
              Schema {overview?.schemaVersion || 17} · Republic of Uganda Initial Jurisdiction · EAC &amp; AfCFTA Corridors ·{' '}
              {overview?.attribution || 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Telemetry</span>
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('v16-control-center')}
                className="px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#D4AF37] cursor-pointer"
              >
                Open V16 Infra
              </button>
            )}
          </div>
        </div>

        {/* Honest 3-State Classification Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#27272a]">
          <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] text-[#A0A0A0]">Engineering &amp; Domain Build</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-400 tabular-nums">
              <CheckCircle2 size={15} />
              <span>ENGINEERING_COMPLETE: {String(statuses.ENGINEERING_COMPLETE)}</span>
            </div>
          </div>
          <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] text-[#A0A0A0]">External Live Infrastructure</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-amber-400 tabular-nums">
              <Lock size={15} />
              <span>PRODUCTION_READY: {String(statuses.PRODUCTION_READY)}</span>
            </div>
          </div>
          <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3">
            <div className="text-[11px] text-[#A0A0A0]">Uganda Live Financial Rails</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-amber-400 tabular-nums">
              <AlertTriangle size={15} />
              <span>LIVE_PILOT_OPERATIONAL: {String(statuses.LIVE_PILOT_OPERATIONAL)}</span>
            </div>
          </div>
        </div>

        {(statusMessage || errorMessage) && (
          <div
            className={`p-3 rounded-lg border text-xs ${
              errorMessage
                ? 'bg-red-950/30 border-red-800 text-red-300'
                : 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
            }`}
          >
            {errorMessage || statusMessage}
          </div>
        )}
      </div>

      {/* 8 Grouped Tabs Covering All 24 Sections */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setGroup(t.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${
              group === t.id
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* GROUP 1: OVERVIEW & 27 GATE REMEDIATION */}
      {group === 'OVERVIEW_GATES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">V16 Gates Passed</div>
              <div className="text-xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
                {overview?.gatesSummary?.v16GatesPassed ?? 11} / 27
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">External Blocked Gates</div>
              <div className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-1">
                {overview?.gatesSummary?.externalBlockedCount ?? 7}
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">V17 Participants</div>
              <div className="text-xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
                {participants.length}
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">V17 Transactions</div>
              <div className="text-xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
                {transactions.length}
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-xs text-[#A0A0A0]">Schema 17 Migration</div>
              <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                {overview?.migrationComplete ? 'VERIFIED' : 'CHECK'}
              </div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#27272a] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#F5F5F5]">
                  Sections 1–3: Readiness Matrix &amp; 27-Gate Closure / Remediation Registry
                </h2>
                <p className="text-xs text-[#A0A0A0]">
                  Critical security, legal, and financial gates cannot be waived. Blocked dependencies prevent premature closure.
                </p>
              </div>
              <select
                value={gateFilter}
                onChange={(e) => setGateFilter(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5]"
              >
                <option value="ALL">All 27 Gates</option>
                <option value="TESTED_LOCAL">TESTED_LOCAL</option>
                <option value="IMPLEMENTED">IMPLEMENTED</option>
                <option value="EXTERNAL_DEPENDENCY_BLOCKED">EXTERNAL_DEPENDENCY_BLOCKED</option>
                <option value="NOT_STARTED">NOT_STARTED</option>
              </select>
            </div>
            <div className="divide-y divide-[#1e1e24]">
              {filteredGates.map((g: any) => (
                <div key={g.gateId} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#D4AF37] tabular-nums">{g.gateId}</span>
                      <span className="font-semibold text-[#F5F5F5]">{g.gateName}</span>
                      <span className="text-[11px] font-mono text-[#A0A0A0]">[{g.category}]</span>
                      {g.criticalNonWaivable && (
                        <span className="text-[11px] font-mono text-amber-400">NON-WAIVABLE</span>
                      )}
                    </div>
                    <div className="text-[#A0A0A0]">{g.submittedEvidence}</div>
                    {g.blockedByGates?.length > 0 && (
                      <div className="text-[11px] text-amber-400 font-mono">
                        Blocked by: {g.blockedByGates.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded bg-[#09090b] border border-[#27272a] font-mono text-[11px] text-[#F5F5F5]">
                      {g.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemediateGate(g.gateId, 'PRODUCTION_READY')}
                      className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[11px] text-[#D4AF37] cursor-pointer"
                    >
                      Check Promotion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GROUP 2: ONBOARDING & ORGANIZATIONS */}
      {group === 'ONBOARDING_ORGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={handleOnboardParticipant} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Section 4: Onboard Participant (PDP 2019 Consent)</h2>
            <input
              type="text"
              required
              placeholder="Participant full name or trade name"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              placeholder="District (e.g. Mbale, Lira, Gulu)"
              value={newPartDistrict}
              onChange={(e) => setNewPartDistrict(e.target.value)}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
            >
              Onboard with Explicit Consent
            </button>
            <p className="text-[11px] text-[#A0A0A0]">
              Participants start at CONTACT_VERIFIED and are clearly labelled non-government verified unless attested externally.
            </p>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Sections 5–6: Verified Participant &amp; Organization Directory</h2>
            <div className="divide-y divide-[#1e1e24]">
              {participants.map((p) => (
                <div key={p.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-[#F5F5F5]">
                      {p.displayName} <span className="font-mono text-[#D4AF37]">({p.participantType})</span>
                    </div>
                    <div className="text-[#A0A0A0]">
                      {p.district}, {p.countryCode} · {p.phoneMasked} · {p.verificationSourceLabel}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-[#F5F5F5]">
                    {p.verificationLevel} · govtVerified={String(p.govtVerified)}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-[#27272a] space-y-2">
              <div className="text-xs font-semibold text-[#F5F5F5]">Organizations ({orgs.length})</div>
              {orgs.map((o) => (
                <div key={o.id} className="text-xs bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 flex justify-between gap-2">
                  <div>
                    <span className="font-semibold text-[#F5F5F5]">{o.legalName}</span>{' '}
                    <span className="text-[#A0A0A0]">({o.orgType}, {o.district})</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#D4AF37]">{o.verificationLevel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GROUP 3: RELATIONSHIPS & COMMERCIAL */}
      {group === 'RELATIONSHIPS_COMMERCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={handleCreateListing} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Section 8: Publish Commercial Listing</h2>
            <input
              type="text"
              required
              placeholder="Product title (e.g. Sesame Grain Grade 1)"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                required
                min="1"
                value={newListPrice}
                onChange={(e) => setNewListPrice(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] tabular-nums"
              />
              <input
                type="number"
                required
                min="1"
                value={newListQty}
                onChange={(e) => setNewListQty(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] tabular-nums"
              />
            </div>
            <button type="submit" className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Publish Listing (UGX / KG)
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              Sections 7–9: Commercial Listings ({listings.length}), Requests ({requests.length}), Quotations ({quotations.length}) &amp; Relationships ({relationships.length})
            </h2>
            <div className="divide-y divide-[#1e1e24]">
              {listings.map((l) => (
                <div key={l.id} className="py-2.5 flex justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#F5F5F5]">{l.title}</div>
                    <div className="text-[#A0A0A0]">
                      {l.district}, {l.countryCode} · Grade: {l.qualityGrade}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-[#D4AF37]">
                      {Number(l.unitPrice).toLocaleString()} {l.currency} / {l.unitCode}
                    </div>
                    <div className="text-[#A0A0A0]">Qty: {l.availableQty}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-[#27272a] text-xs space-y-1">
              <div className="font-semibold text-[#F5F5F5]">
                Verified Network Relationships ({relationships.length}) · Invitations ({invitations.length})
              </div>
              {relationships.map((r) => (
                <div key={r.id} className="text-[#A0A0A0] font-mono">
                  {r.id}: {r.partyAId} ↔ {r.partyBId} [{r.relationshipType}] · {r.status} ({r.visibility})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GROUP 4: 21-STATE TRANSACTIONS & EVIDENCE */}
      {group === 'TRANSACTIONS_EVIDENCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={handleCreateTransaction} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Section 10: Start 21-State Transaction</h2>
            <label className="block text-xs text-[#A0A0A0]">
              Amount (UGX)
              <input
                type="number"
                min="1"
                value={newTxAmount}
                onChange={(e) => setNewTxAmount(e.target.value)}
                className="mt-1 w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] tabular-nums"
              />
            </label>
            <label className="block text-xs text-[#A0A0A0]">
              Quantity (KG)
              <input
                type="number"
                min="1"
                value={newTxQty}
                onChange={(e) => setNewTxQty(e.target.value)}
                className="mt-1 w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] tabular-nums"
              />
            </label>
            <button type="submit" className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Create Transaction (DRAFT)
            </button>
            <p className="text-[11px] text-[#A0A0A0]">
              User uploads never auto-verify settlements. Verification tiers require independent review or provider proof.
            </p>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              Sections 11–12: Transactions ({transactions.length}) &amp; Cryptographic Evidence Records ({evidences.length})
            </h2>
            {transactions.length === 0 ? (
              <p className="text-xs text-[#A0A0A0]">No V17 transactions recorded yet. Initialize one to inspect the 21-state engine.</p>
            ) : (
              <div className="divide-y divide-[#1e1e24]">
                {transactions.map((t) => (
                  <div key={t.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-mono font-bold text-[#D4AF37]">{t.id}</div>
                      <div className="text-[#A0A0A0]">
                        {t.buyerId} → {t.sellerId} · Tier: {t.verificationTier}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-[#F5F5F5]">
                        {Number(t.amount).toLocaleString()} {t.currency} ({t.quantity} {t.unitCode})
                      </div>
                      <div className="text-emerald-400">{t.state}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GROUP 5: TRUST & 11-STAGE DISPUTES */}
      {group === 'TRUST_DISPUTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={handleOpenDispute} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Section 14: Open 11-Stage Dispute</h2>
            <input
              type="text"
              required
              placeholder="V17 Transaction ID"
              value={disputeTxId}
              onChange={(e) => setDisputeTxId(e.target.value)}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
            />
            <textarea
              required
              rows={3}
              placeholder="Dispute reason (e.g. Moisture variance on delivery)"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
            />
            <button type="submit" className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer">
              Submit Mediation Case
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              Sections 13–14: Commercial Trust &amp; Active Disputes ({disputes.length})
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Reputation is transaction-backed, volume-neutral, and NOT a regulated credit score. Disputes are non-court mediation records.
            </p>
            <div className="divide-y divide-[#1e1e24]">
              {disputes.map((d) => (
                <div key={d.id} className="py-2.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono font-bold text-[#D4AF37]">{d.id} ({d.stage})</span>
                    <span className="font-mono tabular-nums text-[#F5F5F5]">
                      {Number(d.claimedAmount).toLocaleString()} {d.currency}
                    </span>
                  </div>
                  <div className="text-[#A0A0A0]">{d.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GROUP 6: REGIONAL, CORRIDORS & COOPERATIVES */}
      {group === 'REGIONAL_COOPS' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              Sections 15–16: Regional Jurisdictions (Uganda Pilot + 6 Dormant EAC/AfCFTA Candidates)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(regional?.jurisdictions || []).map((j: any) => (
                <div key={j.countryCode} className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-[#F5F5F5]">
                    <span>{j.countryName} ({j.countryCode})</span>
                    <span className="font-mono text-[#D4AF37]">{j.currency}</span>
                  </div>
                  <div className="font-mono text-[11px] text-amber-400">{j.activationState}</div>
                  <div className="text-[11px] text-[#A0A0A0]">{j.rulesSummary}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2">
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Regional Corridors ({regional?.corridors?.length || 0})</h2>
              {(regional?.corridors || []).map((c: any) => (
                <div key={c.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-xs space-y-1">
                  <div className="font-semibold text-[#F5F5F5]">{c.name} [{c.status}]</div>
                  <div className="text-[#A0A0A0]">{c.originDistrict}, {c.originCountry} → {c.destinationDistrict}, {c.destinationCountry}</div>
                  <div className="text-[11px] text-amber-400">{c.nonCustomsDisclaimer}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2">
              <h2 className="text-sm font-semibold text-[#F5F5F5]">Section 17: Cooperative Workspaces ({cooperatives.length})</h2>
              {cooperatives.map((cp) => (
                <div key={cp.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-xs space-y-1">
                  <div className="font-semibold text-[#F5F5F5]">{cp.name} ({cp.district})</div>
                  <div className="font-mono text-[11px] text-[#D4AF37]">Privacy Mode: {cp.memberPrivacyMode}</div>
                  <div className="text-[11px] text-[#A0A0A0]">{cp.nonDepositTakingDisclaimer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GROUP 7: RECONCILIATION, BILLING & GOVERNANCE */}
      {group === 'RECON_BILLING_GOV' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Section 18: Reconciliation Cases ({reconCases.length})</h2>
            <p className="text-[#A0A0A0]">All adjustments post non-destructive reversing entries; existing ledger journals are immutable.</p>
            {reconCases.map((rc) => (
              <div key={rc.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-2.5">
                <div className="font-mono text-[#D4AF37]">{rc.id} · {rc.status}</div>
                <div className="text-[#A0A0A0] tabular-nums">Variance: {rc.varianceAmount} {rc.currency}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Section 19: Network Billing &amp; Revenue Truth</h2>
            <p className="text-[#A0A0A0]">{billing?.nonConflationDisclosure}</p>
            {Object.entries(billing?.byCurrency || {}).map(([cur, b]: any) => (
              <div key={cur} className="bg-[#09090b] border border-[#27272a] rounded-lg p-2.5 space-y-1 font-mono tabular-nums">
                <div className="text-[#D4AF37] font-bold">{cur}</div>
                <div>Gross Flow: {Number(b.grossTransactionValue).toLocaleString()}</div>
                <div>Service Fee: {Number(b.platformServiceFeeAmount).toLocaleString()}</div>
                <div className="text-emerald-400">Collected: {Number(b.collectedPlatformRevenue).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Sections 20–21: Dual-Authorization Governance Policies</h2>
            {(governance?.policies || []).map((p: any) => (
              <div key={p.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-2.5">
                <div className="font-mono text-[#D4AF37]">{p.policyCode} · DualAuth={String(p.requiresDualAuthorization)}</div>
                <div className="text-[#F5F5F5]">{p.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GROUP 8: OFFLINE SYNC, SCHEMA 17 MIGRATIONS & INTELLIGENCE */}
      {group === 'OFFLINE_INTEL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <WifiOff size={15} className="text-[#D4AF37]" />
              <span>Section 22: Offline Sync Revalidation ({offlineQueue.length})</span>
            </h2>
            <p className="text-[#A0A0A0]">Offline drafts revalidate against server state on reconnect. Offline settlement confirmations are strictly rejected.</p>
            {offlineQueue.map((q) => (
              <div key={q.id} className="bg-[#09090b] border border-[#27272a] rounded-lg p-2.5">
                <div className="font-mono text-[#D4AF37]">{q.actionType}</div>
                <div className="text-[#F5F5F5]">{q.validationStatus}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Database size={15} className="text-[#D4AF37]" />
              <span>Section 23: Schema 17 Migration &amp; V16 Backup</span>
            </h2>
            <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 space-y-1 font-mono tabular-nums">
              <div>Schema Version: {migrations?.completeness?.schemaVersion || 17}</div>
              <div>Complete: {String(migrations?.completeness?.complete)}</div>
              <div>V16 Backup Valid: {String(migrations?.v16BackupReadiness?.v16BackupValid)}</div>
              <div className="truncate">V16 SHA-256: {migrations?.v16BackupReadiness?.checksumSha256 || 'N/A'}</div>
              <div>Preserved Users: {migrations?.completeness?.preservedUsersCount}</div>
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Layers size={15} className="text-[#D4AF37]" />
              <span>Section 24: Real-Data Economic Intelligence</span>
            </h2>
            <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3 space-y-1 font-mono tabular-nums">
              <div>Participants: {overview?.intelligence?.metrics?.registeredParticipants ?? 0}</div>
              <div>Active Listings: {overview?.intelligence?.metrics?.activeListings ?? 0}</div>
              <div>Evidence-Backed Txs: {overview?.intelligence?.metrics?.evidenceBackedTransactions ?? 0}</div>
              <div>Usability Study: {overview?.intelligence?.metrics?.usabilitySessionsStatus || 'NOT_CONDUCTED'}</div>
            </div>
            <p className="text-[11px] text-[#A0A0A0]">{overview?.intelligence?.methodologyDisclosure}</p>
          </div>
        </div>
      )}
    </div>
  );
};
