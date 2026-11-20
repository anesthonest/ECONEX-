/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V6.0 - Public Economy & Institutional Governance (AETHER PUBLIC ECONOMY)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.ts';
import {
  PublicTender,
  TaxDeclaration,
} from '../../types/index.ts';
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  Landmark,
  Plus,
  Receipt,
  RefreshCw,
  Scale,
  ShieldCheck,
} from 'lucide-react';

export const PublicEconomyView: React.FC = () => {
  const [tenders, setTenders] = useState<PublicTender[]>([]);
  const [taxDeclarations, setTaxDeclarations] = useState<TaxDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TENDERS' | 'TAX'>('TENDERS');

  // New Tender Modal State
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [tenderTitle, setTenderTitle] = useState('');
  const [tenderEntity, setTenderEntity] = useState('Uganda National Roads Authority (UNRA)');
  const [tenderSector, setTenderSector] = useState<any>('CONSTRUCTION');
  const [tenderBudget, setTenderBudget] = useState<number>(4500000000);
  const [tenderCurrency, setTenderCurrency] = useState('UGX');

  // New Tax Declaration Modal State
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxTIN, setTaxTIN] = useState('1004928172');
  const [taxType, setTaxType] = useState<TaxDeclaration['taxType']>('VAT');
  const [taxAmount, setTaxAmount] = useState<number>(24500000);
  const [taxSuccessMsg, setTaxSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tndList, taxList] = await Promise.all([
        api.getPublicTenders(),
        api.getTaxDeclarations(),
      ]);
      setTenders(Array.isArray(tndList) ? tndList : []);
      setTaxDeclarations(Array.isArray(taxList) ? taxList : []);
    } catch (err) {
      console.error('Failed to load public economy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenderTitle) return;
    try {
      await api.publishPublicTender({
        procuringEntity: tenderEntity,
        title: tenderTitle,
        sector: tenderSector,
        countryCode: 'UG',
        budgetEstimate: Number(tenderBudget),
        currency: tenderCurrency,
        requirements: ['Valid PPDA Certificate', 'URA Tax Clearance Certificate'],
      });
      setShowTenderModal(false);
      setTenderTitle('');
      fetchData();
    } catch (err) {
      console.error('Failed to publish tender:', err);
    }
  };

  const handleDeclareTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaxSuccessMsg('');
    try {
      const res = await api.submitTaxDeclaration({
        taxpayerTIN: taxTIN,
        taxpayerName: 'Nile Agro-Industries Ltd',
        countryCode: 'UG',
        taxType,
        taxPeriod: '2026-Q4',
        declaredTaxAmount: Number(taxAmount),
        currency: 'UGX',
      });
      setTaxSuccessMsg(`Declaration ${res.id} submitted to Uganda Revenue Authority.`);
      setTimeout(() => {
        setShowTaxModal(false);
        setTaxSuccessMsg('');
        fetchData();
      }, 1500);
    } catch (err: any) {
      setTaxSuccessMsg(`Error: ${err.message || 'Tax declaration failed'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">ECONEX PUBLIC ECONOMY</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c1c1f] text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
              Government & Institutional Infrastructure
            </span>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Controlled integration for public procurement tenders, tax administration transparency, and statutory fiscal reporting.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab('TENDERS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'TENDERS' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Public Procurement ({tenders.length})
          </button>
          <button
            onClick={() => setActiveTab('TAX')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'TAX' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Statutory Tax Declarations ({taxDeclarations.length})
          </button>
        </div>
      </div>

      {/* VIEW: TENDERS */}
      {activeTab === 'TENDERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Public Procurement Opportunities</h2>
              <p className="text-xs text-[#A0A0A0]">
                Public procurement notices published under PPDA guidelines with audited transparency.
              </p>
            </div>
            <button
              onClick={() => setShowTenderModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors"
            >
              <Plus size={14} />
              <span>Publish Notice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenders.map((tnd) => (
              <div key={tnd.id} className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#D4AF37] font-bold">{tnd.tenderNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {tnd.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F5]">{tnd.title}</h3>
                  <div className="text-xs text-[#A0A0A0] mt-1">
                    Procuring Entity: <strong className="text-[#F5F5F5]">{tnd.procuringEntity}</strong>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] rounded border border-[#27272a] flex justify-between items-center text-xs">
                  <span className="text-[#A0A0A0]">Budget Allocation Estimate:</span>
                  <span className="font-mono font-bold text-[#F5F5F5] tabular-nums">
                    {tnd.budgetEstimate.toLocaleString()} {tnd.currency}
                  </span>
                </div>

                <div className="space-y-1 pt-1 text-[11px] text-[#A0A0A0]">
                  <div>Requirements:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#71717a]">
                    {tnd.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 text-[11px] text-[#71717a] border-t border-[#1e1e24] flex justify-between items-center">
                  <span>Closing Date: {new Date(tnd.closingDate).toLocaleDateString()}</span>
                  <span>{tnd.submissionCount} Bids Submitted</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: TAX DECLARATIONS */}
      {activeTab === 'TAX' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Tax Administration & Sovereign Filings</h2>
              <p className="text-xs text-[#A0A0A0]">
                Direct integration boundaries for URA, KRA, and TRA statutory declaration reconciliation.
              </p>
            </div>
            <button
              onClick={() => setShowTaxModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors"
            >
              <Plus size={14} />
              <span>Submit Tax Declaration</span>
            </button>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181b] border-b border-[#27272a] text-[#A0A0A0]">
                <tr>
                  <th className="py-3 px-4 font-medium">Declaration ID</th>
                  <th className="py-3 px-4 font-medium">Taxpayer TIN</th>
                  <th className="py-3 px-4 font-medium">Tax Type</th>
                  <th className="py-3 px-4 font-medium">Tax Period</th>
                  <th className="py-3 px-4 font-medium text-right">Declared Tax Liability</th>
                  <th className="py-3 px-4 font-medium">Filing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e24] text-[#F5F5F5]">
                {taxDeclarations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#71717a]">
                      No statutory tax declarations submitted yet.
                    </td>
                  </tr>
                ) : (
                  taxDeclarations.map((tax) => (
                    <tr key={tax.id} className="hover:bg-[#18181b]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{tax.id}</td>
                      <td className="py-3 px-4 font-mono">{tax.taxpayerTIN}</td>
                      <td className="py-3 px-4">{tax.taxType}</td>
                      <td className="py-3 px-4 text-[#A0A0A0]">{tax.taxPeriod}</td>
                      <td className="py-3 px-4 font-mono text-right tabular-nums font-bold">
                        {tax.declaredTaxAmount.toLocaleString()} {tax.currency}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {tax.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Publish Tender */}
      {showTenderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Publish Public Procurement Tender</h3>
            <form onSubmit={handleCreateTender} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Procuring Public Body</label>
                <input
                  type="text"
                  required
                  value={tenderEntity}
                  onChange={(e) => setTenderEntity(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Tender Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Construction of Regional Feeder Grain Storage Silos"
                  value={tenderTitle}
                  onChange={(e) => setTenderTitle(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Budget Estimate</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tenderBudget}
                    onChange={(e) => setTenderBudget(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Currency</label>
                  <select
                    value={tenderCurrency}
                    onChange={(e) => setTenderCurrency(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTenderModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Publish Tender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tax Declaration */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Submit Statutory Tax Filing</h3>
            <form onSubmit={handleDeclareTax} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Taxpayer TIN</label>
                <input
                  type="text"
                  required
                  value={taxTIN}
                  onChange={(e) => setTaxTIN(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Tax Type</label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as TaxDeclaration['taxType'])}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                >
                  <option value="VAT">Value Added Tax (18% VAT)</option>
                  <option value="CORPORATE_INCOME_TAX">Corporate Income Tax (30% CIT)</option>
                  <option value="WITHHOLDING_TAX">Withholding Tax (6% WHT)</option>
                  <option value="CUSTOMS_DUTY">EAC Common External Tariff Customs Duty</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Declared Tax Liability (UGX)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              {taxSuccessMsg && (
                <div className="p-2 rounded text-xs bg-emerald-950 text-emerald-300">
                  {taxSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Submit Declaration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
