/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V31.0 — Continental Multi-Country Operating Profiles, Enterprise Hierarchy & Commercial Workflows
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { Globe, Building2, Workflow, Calculator, ShieldCheck, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';

interface Props {
  onNavigate: (tab: string) => void;
  initialSubTab?: 'COUNTRIES' | 'ENTERPRISE' | 'WORKFLOWS';
}

export const V31ContinentalEnterpriseView: React.FC<Props> = ({
  onNavigate,
  initialSubTab = 'COUNTRIES',
}) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id, userRole: role };
  const [subTab, setSubTab] = useState<'COUNTRIES' | 'ENTERPRISE' | 'WORKFLOWS'>(initialSubTab);
  const [countries, setCountries] = useState<any[]>([]);
  const [enterprise, setEnterprise] = useState<any>(null);
  const [taxCountry, setTaxCountry] = useState('UG');
  const [grossMinor, setGrossMinor] = useState('1000000');
  const [taxResult, setTaxResult] = useState<any>(null);
  const [newSupplier, setNewSupplier] = useState('Elgon Coffee Cooperative Ltd');
  const [newDesc, setNewDesc] = useState('Solar Cold-Chain Storage Procurement');
  const [newAmount, setNewAmount] = useState('4500000');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const loadData = async () => {
    try {
      const [cRes, entRes] = await Promise.all([
        api.v31GetCountries(),
        api.v31GetEnterpriseOverview(actor),
      ]);
      setCountries(cRes.countries || []);
      setEnterprise(entRes);
    } catch (e: any) {
      setNotice(e?.message || 'Unable to load continental enterprise configuration.');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, role]);

  const handleCalculateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    try {
      const res = await api.v31CalculateCountryTax(taxCountry, Number(grossMinor));
      setTaxResult(res);
    } catch (err: any) {
      setNotice(err?.message || 'Tax calculation failed.');
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    try {
      const created = await api.v31CreateCommercialCase(
        {
          supplierName: newSupplier,
          description: newDesc,
          currency: 'UGX',
          amountMinor: Number(newAmount),
        },
        actor
      );
      setNotice(`Created commercial workflow case ${created.caseRef} (Stage: ${created.stage}).`);
      await loadData();
    } catch (err: any) {
      setNotice(err?.message || 'Failed to create commercial case.');
    }
  };

  const handleCaseTransition = async (caseId: string, action: string) => {
    setNotice(null);
    try {
      const updated = await api.v31TransitionCommercialCase(caseId, { action }, actor);
      setNotice(`Case ${updated.caseRef} advanced to ${updated.stage}.`);
      await loadData();
    } catch (err: any) {
      setNotice(`Workflow Guard: ${err?.message || 'Transition rejected.'}`);
    }
  };

  return (
    <div className="space-y-5">
      <header className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37]">
            <Globe className="w-4 h-4" />
            <span>ECONEX V31.0 · CONTINENTAL COUNTRY ENGINE &amp; ENTERPRISE OPERATIONS</span>
          </div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Multi-Country Framework, Enterprise SoD Hierarchy &amp; Commercial Cases
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            {countries.length} African Operating Profiles · Integer Minor-Unit Tax Precision · Strict Segregation-of-Duties
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('v31-pilot-readiness')}
          className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#27272a] bg-[#141418] text-xs text-[#D4AF37] cursor-pointer"
        >
          Uganda Pilot Desk
        </button>
      </header>

      {notice && (
        <div className="bg-[#121216] border border-[#D4AF37]/40 rounded-lg px-4 py-3 text-xs font-mono text-[#F5F5F5]">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3">
        {[
          { id: 'COUNTRIES' as const, label: `Country Operating Profiles (${countries.length})` },
          { id: 'ENTERPRISE' as const, label: `Organizations, Branches & SoD (${enterprise?.organizations?.length || 0})` },
          { id: 'WORKFLOWS' as const, label: `Traceable Commercial Cases (${enterprise?.commercialCases?.length || 0})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
              subTab === t.id
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#0d0d10] text-[#A0A0A0] border-[#27272a]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'COUNTRIES' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Country</th>
                    <th className="py-2.5 px-4">Bloc / Currency</th>
                    <th className="py-2.5 px-4 text-right">VAT / WHT</th>
                    <th className="py-2.5 px-4">USSD Pattern</th>
                    <th className="py-2.5 px-4">Rails &amp; Regulator</th>
                    <th className="py-2.5 px-4">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                  {countries.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-4 font-semibold text-[#F5F5F5]">{c.countryCode} · {c.countryName}</td>
                      <td className="py-2.5 px-4">{c.regionBloc} · {c.defaultCurrency} (scale {c.minorUnitScale})</td>
                      <td className="py-2.5 px-4 text-right">{c.vatStandardRatePct}% / {c.withholdingTaxPct}%</td>
                      <td className="py-2.5 px-4 text-[#D4AF37]">{c.ussdShortCodePattern}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{(c.mobileMoneyRails || []).join(', ')}</td>
                      <td className="py-2.5 px-4 text-amber-300">{c.operatingMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleCalculateTax} className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#D4AF37]" />
              Country-Specific Minor-Unit VAT &amp; Withholding Tax Calculator
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={taxCountry}
                onChange={(e) => setTaxCountry(e.target.value)}
                className="bg-[#08080a] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
              >
                {countries.map((c) => (
                  <option key={c.countryCode} value={c.countryCode}>{c.countryCode} — {c.countryName} ({c.defaultCurrency})</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={grossMinor}
                onChange={(e) => setGrossMinor(e.target.value)}
                placeholder="Gross minor units"
                className="bg-[#08080a] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F5F5]"
              />
              <button
                type="submit"
                className="min-h-[38px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
              >
                Calculate Minor-Unit Breakdown
              </button>
            </div>
            {taxResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs tabular-nums">
                <div className="border border-[#27272a] rounded-lg p-3 bg-[#08080a]">
                  <div className="text-[#A0A0A0]">GROSS</div>
                  <div className="text-[#F5F5F5] font-bold">{taxResult.grossMinor?.toLocaleString()} {taxResult.currency}</div>
                </div>
                <div className="border border-[#27272a] rounded-lg p-3 bg-[#08080a]">
                  <div className="text-[#A0A0A0]">VAT ({taxResult.vatRatePct}%)</div>
                  <div className="text-[#D4AF37] font-bold">{taxResult.vatMinor?.toLocaleString()} {taxResult.currency}</div>
                </div>
                <div className="border border-[#27272a] rounded-lg p-3 bg-[#08080a]">
                  <div className="text-[#A0A0A0]">WHT ({taxResult.withholdingTaxPct}%)</div>
                  <div className="text-amber-300 font-bold">{taxResult.withholdingMinor?.toLocaleString()} {taxResult.currency}</div>
                </div>
                <div className="border border-[#27272a] rounded-lg p-3 bg-[#08080a]">
                  <div className="text-[#A0A0A0]">NET PAYABLE</div>
                  <div className="text-emerald-400 font-bold">{taxResult.netPayableMinor?.toLocaleString()} {taxResult.currency}</div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {subTab === 'ENTERPRISE' && (
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              INSTITUTIONAL ORGANIZATIONS ({enterprise?.organizations?.length || 0}) · BRANCHES ({enterprise?.branches?.length || 0}) · DEPARTMENTS ({enterprise?.departments?.length || 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Org Code &amp; Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Country</th>
                    <th className="py-2.5 px-4">KYB Tier</th>
                    <th className="py-2.5 px-4 text-right">Branches</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                  {(enterprise?.organizations || []).map((o: any) => (
                    <tr key={o.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{o.orgCode} · {o.legalName}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{o.orgType}</td>
                      <td className="py-2.5 px-4">{o.countryCode} ({o.defaultCurrency})</td>
                      <td className="py-2.5 px-4 text-[#D4AF37]">{o.kybTier}</td>
                      <td className="py-2.5 px-4 text-right">{o.activeBranchCount}</td>
                      <td className="py-2.5 px-4 text-emerald-400">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              MULTI-TIER ENTERPRISE APPROVAL &amp; SOD POLICIES
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Policy</th>
                    <th className="py-2.5 px-4">Domain</th>
                    <th className="py-2.5 px-4 text-right">L1 Threshold</th>
                    <th className="py-2.5 px-4 text-right">Dual Approval</th>
                    <th className="py-2.5 px-4">SoD Guard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                  {(enterprise?.approvalPolicies || []).map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-4 text-[#F5F5F5]">{p.policyName}</td>
                      <td className="py-2.5 px-4 text-[#A0A0A0]">{p.workflowDomain}</td>
                      <td className="py-2.5 px-4 text-right">{p.level1ThresholdMinor?.toLocaleString()} {p.currency}</td>
                      <td className="py-2.5 px-4 text-right">{p.dualApprovalThresholdMinor?.toLocaleString()} {p.currency}</td>
                      <td className="py-2.5 px-4 text-emerald-400">REQUESTER_CANNOT_APPROVE</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'WORKFLOWS' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateCase} className="bg-[#0d0d10] border border-[#27272a] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              Initiate End-to-End Traceable Commercial Workflow Case
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                placeholder="Supplier Name"
                className="bg-[#08080a] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Procurement Description"
                className="bg-[#08080a] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-[#F5F5F5]"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1000}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-[#08080a] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F5F5]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Create Case
                </button>
              </div>
            </div>
          </form>

          <div className="bg-[#0d0d10] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] text-xs font-mono text-[#D4AF37] flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              COMMERCIAL CASES (PROCUREMENT -&gt; DELIVERY -&gt; INVOICE -&gt; SANDBOX PAYMENT -&gt; RECONCILED)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080a] text-[#A0A0A0] font-mono border-b border-[#27272a]">
                  <tr>
                    <th className="py-2.5 px-4">Ref / Supplier</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4">Current Stage</th>
                    <th className="py-2.5 px-4 text-right">Advance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] font-mono tabular-nums">
                  {(enterprise?.commercialCases || []).map((c: any) => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-4">
                        <div className="text-[#F5F5F5] font-semibold">{c.caseRef} · {c.supplierName}</div>
                        <div className="text-[11px] text-[#A0A0A0]">{c.description}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right">{c.amountMinor?.toLocaleString()} {c.currency}</td>
                      <td className="py-2.5 px-4 text-[#D4AF37]">{c.stage}</td>
                      <td className="py-2.5 px-4 text-right space-x-1.5">
                        {c.stage === 'PROCUREMENT_REQUEST' && (
                          <button type="button" onClick={() => handleCaseTransition(c.id, 'APPROVE_L1')} className="px-2 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
                            L1 Approve
                          </button>
                        )}
                        {(c.stage === 'LEVEL1_APPROVED' || c.stage === 'DUAL_APPROVED') && (
                          <button type="button" onClick={() => handleCaseTransition(c.id, 'MARK_DELIVERED')} className="px-2 py-1 rounded border border-[#27272a] bg-[#141418] text-[#F5F5F5] cursor-pointer">
                            Deliver
                          </button>
                        )}
                        {c.stage === 'GOODS_DELIVERED' && (
                          <button type="button" onClick={() => handleCaseTransition(c.id, 'MATCH_INVOICE')} className="px-2 py-1 rounded border border-[#27272a] bg-[#141418] text-[#F5F5F5] cursor-pointer">
                            3-Way Match
                          </button>
                        )}
                        {c.stage === 'INVOICE_MATCHED' && (
                          <button type="button" onClick={() => handleCaseTransition(c.id, 'DISPATCH_SANDBOX_PAYMENT')} className="px-2 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer">
                            Pay Sandbox
                          </button>
                        )}
                        {c.stage === 'PAYMENT_DISPATCHED_SANDBOX' && (
                          <button type="button" onClick={() => handleCaseTransition(c.id, 'RECONCILE_CLOSE')} className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-pointer">
                            Reconcile
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
