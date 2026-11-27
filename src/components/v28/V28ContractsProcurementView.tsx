/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V28.0 — Commercial Contracts, Obligations & SoD/COI Enterprise Procurement
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Plus,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';

interface Props {
  onNavigate: (tabId: string) => void;
  initialSubTab?: 'CONTRACTS' | 'OBLIGATIONS' | 'PROCUREMENT' | 'APPROVALS';
}

export const V28ContractsProcurementView: React.FC<Props> = ({ initialSubTab = 'CONTRACTS' }) => {
  const { currentUser, role } = useAuth();
  const { activeCountry, activeWorkspaceId } = useExperience();

  const [tab, setTab] = useState<'CONTRACTS' | 'OBLIGATIONS' | 'PROCUREMENT' | 'APPROVALS'>(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [contracts, setContracts] = useState<any[]>([]);
  const [obligations, setObligations] = useState<any[]>([]);
  const [procurement, setProcurement] = useState<any>({ policies: [], plans: [], requisitions: [], evaluations: [] });

  // Forms
  const [ctrTitle, setCtrTitle] = useState('');
  const [ctrPartyB, setCtrPartyB] = useState('org_buyer_01');
  const [ctrValue, setCtrValue] = useState('12000000');
  const [oblContractId, setOblContractId] = useState('');
  const [oblTitle, setOblTitle] = useState('');
  const [oblAmount, setOblAmount] = useState('3000000');

  const [reqTitle, setReqTitle] = useState('');
  const [reqAmount, setReqAmount] = useState('6000000');
  const [coiDeclared, setCoiDeclared] = useState(true);
  const [invoiceMatchInput, setInvoiceMatchInput] = useState<Record<string, string>>({});

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
      const [cRes, pRes] = await Promise.all([
        ApiClient.v28GetContracts(actor),
        ApiClient.v28GetProcurement(actor),
      ]);
      const cList = Array.isArray(cRes?.contracts) ? cRes.contracts : [];
      setContracts(cList);
      setObligations(Array.isArray(cRes?.obligations) ? cRes.obligations : []);
      setProcurement(pRes || { policies: [], plans: [], requisitions: [], evaluations: [] });
      if (cList.length > 0 && !oblContractId) setOblContractId(cList[0].id);
    } catch (err: any) {
      setError(err?.message || 'Failed to load V28 contracts and procurement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v28CreateContract(
        {
          title: ctrTitle.trim() || 'EAC Commercial Supply Agreement',
          scopeOfWork: 'Standardised cross-corridor supply and delivery assurance',
          partyBOrgId: ctrPartyB,
          totalValueMinor: Number(ctrValue || 0),
          currency: 'UGX',
        },
        actor
      );
      setFeedback(`Created contract ${created.contractNumber} (legallyQualifiedSignature: ${String(created.legallyQualifiedSignature)}).`);
      setCtrTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to create contract.');
    }
  };

  const handleContractAction = async (id: string, action: string) => {
    setError(null);
    setFeedback(null);
    try {
      const upd = await ApiClient.v28TransitionContract(id, { action, amendmentReason: 'Operator contract action' }, actor);
      setFeedback(`Contract ${upd.contractNumber} updated to status=${upd.status} (v${upd.currentVersion}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Contract action failed.');
    }
  };

  const handleCreateObligation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oblContractId) return;
    setError(null);
    setFeedback(null);
    try {
      const obl = await ApiClient.v28CreateContractObligation(
        oblContractId,
        { title: oblTitle.trim() || 'Milestone Tranche Obligation', amountMinor: Number(oblAmount || 0), linkToWalletObligation: true },
        actor
      );
      setFeedback(`Linked obligation ${obl.id} (${obl.status}) to contract ${obl.contractId}.`);
      setOblTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create obligation.');
    }
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const reqItem = await ApiClient.v28CreateProcurementRequisition(
        {
          title: reqTitle.trim() || 'Agro-Input Bulk Procurement',
          category: 'AGRICULTURAL_INPUTS',
          estimatedAmountMinor: Number(reqAmount || 0),
          currency: 'UGX',
          conflictDeclared: coiDeclared,
        },
        actor
      );
      setFeedback(`Submitted procurement requisition ${reqItem.id} (officialGovernmentApprovalClaimed: false).`);
      setReqTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Requisition creation failed.');
    }
  };

  const handleDecideReq = async (reqId: string, decision: 'APPROVE' | 'REJECT', threeWayMatchInvoiceMinor?: number) => {
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v28DecideProcurementRequisition(
        reqId,
        { decision, conflictDeclared: true, threeWayMatchInvoiceMinor },
        actor
      );
      setFeedback(`Requisition ${res.id} updated -> ${res.status}${res.exceptionReason ? ` (${res.exceptionReason})` : ''}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Procurement decision blocked by SoD / COI rule.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D4AF37]">CONTRACTS, OBLIGATIONS &amp; ENTERPRISE PROCUREMENT</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5] mt-1 flex items-center gap-2">
              <ScrollText className="text-[#D4AF37]" size={24} />
              Agreements, Obligations &amp; SoD Procurement
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Platform commercial acknowledgements only (not legally qualified PKI e-signatures) and enterprise procurement governance with strict Segregation of Duties &amp; 3-way match checks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['CONTRACTS', 'OBLIGATIONS', 'PROCUREMENT', 'APPROVALS'] as const).map((t) => (
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
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5] flex items-center gap-1 cursor-pointer"
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

      {(tab === 'CONTRACTS' || tab === 'OBLIGATIONS') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <form onSubmit={handleCreateContract} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
                <Plus size={15} className="text-[#D4AF37]" /> Draft Commercial Contract
              </h2>
              <input
                value={ctrTitle}
                onChange={(e) => setCtrTitle(e.target.value)}
                placeholder="Contract title"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                required
              />
              <input
                value={ctrPartyB}
                onChange={(e) => setCtrPartyB(e.target.value)}
                placeholder="Counterparty Org ID"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
              />
              <input
                type="number"
                min={1}
                value={ctrValue}
                onChange={(e) => setCtrValue(e.target.value)}
                placeholder="Total value (minor)"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
              />
              <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
                Create Contract
              </button>
            </form>

            <form onSubmit={handleCreateObligation} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Add Contract Obligation</h2>
              <select
                value={oblContractId}
                onChange={(e) => setOblContractId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber} ({c.title})
                  </option>
                ))}
              </select>
              <input
                value={oblTitle}
                onChange={(e) => setOblTitle(e.target.value)}
                placeholder="Obligation milestone description"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
                required
              />
              <input
                type="number"
                min={1}
                value={oblAmount}
                onChange={(e) => setOblAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
              />
              <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#181818] border border-[#D4AF37] text-[#D4AF37] font-semibold cursor-pointer">
                Link Wallet Obligation
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Commercial Contracts ({contracts.length})</h2>
              {loading ? (
                <div className="text-xs text-[#A0A0A0]">Loading contracts...</div>
              ) : (
                contracts.map((c) => (
                  <div key={c.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-mono text-[#D4AF37]">{c.contractNumber} · v{c.currentVersion} · {c.status}</div>
                        <div className="text-sm font-semibold text-[#F5F5F5]">{c.title}</div>
                        <div className="text-[#A0A0A0]">
                          {c.totalValueMinor.toLocaleString()} {c.currency} · Legally Qualified e-Sign: {String(c.legallyQualifiedSignature)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleContractAction(c.id, 'APPROVE')}
                          className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContractAction(c.id, 'ACKNOWLEDGE')}
                          className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                        >
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContractAction(c.id, 'AMEND')}
                          className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-[#C0C0C0] cursor-pointer"
                        >
                          Amend
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-display font-bold text-[#F5F5F5]">Linked Contractual Obligations ({obligations.length})</h2>
              {obligations.map((o) => (
                <div key={o.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono text-[#D4AF37]">{o.id} · {o.status}</div>
                    <div className="text-[#F5F5F5] font-medium">{o.title}</div>
                  </div>
                  <div className="font-mono text-[#F5F5F5] tabular-nums">
                    {Number(o.amountMinor).toLocaleString()} {o.currency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(tab === 'PROCUREMENT' || tab === 'APPROVALS') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateRequisition} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <ClipboardList size={15} className="text-[#D4AF37]" /> Submit Requisition (COI Enforced)
            </h2>
            <input
              value={reqTitle}
              onChange={(e) => setReqTitle(e.target.value)}
              placeholder="Requisition title"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5]"
              required
            />
            <input
              type="number"
              min={1}
              value={reqAmount}
              onChange={(e) => setReqAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
            />
            <label className="flex items-center gap-2 text-[#C0C0C0] cursor-pointer">
              <input type="checkbox" checked={coiDeclared} onChange={(e) => setCoiDeclared(e.target.checked)} />
              Confirm Conflict-of-Interest (COI) Declaration
            </label>
            <button type="submit" className="w-full min-h-[40px] rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
              Submit Requisition
            </button>
            <div className="text-[11px] text-[#A0A0A0] pt-1 flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-amber-400 shrink-0" />
              Requester self-approval is strictly blocked by server SoD policy.
            </div>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-display font-bold text-[#F5F5F5] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D4AF37]" /> Procurement Requisitions &amp; 3-Way Match ({procurement.requisitions?.length || 0})
            </h2>
            {(procurement.requisitions || []).map((reqItem: any) => (
              <div key={reqItem.id} className="bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[#D4AF37]">{reqItem.id} · {reqItem.status}</div>
                    <div className="text-sm font-semibold text-[#F5F5F5]">{reqItem.title}</div>
                    <div className="text-[#A0A0A0] font-mono">
                      Est: {Number(reqItem.estimatedAmountMinor).toLocaleString()} {reqItem.currency} · Requester: {reqItem.requesterUserId}
                    </div>
                    {reqItem.exceptionReason && <div className="text-amber-400 mt-1">{reqItem.exceptionReason}</div>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecideReq(reqItem.id, 'APPROVE')}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                    >
                      Approve (SoD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecideReq(reqItem.id, 'REJECT')}
                      className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#27272a] text-[#C0C0C0] cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[#1e1e24]">
                  <input
                    type="number"
                    placeholder="Invoice minor amount for 3-way match"
                    value={invoiceMatchInput[reqItem.id] || ''}
                    onChange={(e) => setInvoiceMatchInput((prev) => ({ ...prev, [reqItem.id]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#121212] border border-[#27272a] text-[#F5F5F5] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleDecideReq(
                        reqItem.id,
                        'APPROVE',
                        Number(invoiceMatchInput[reqItem.id] || reqItem.estimatedAmountMinor)
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#D4AF37] text-[#D4AF37] font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Run 3-Way Match
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
