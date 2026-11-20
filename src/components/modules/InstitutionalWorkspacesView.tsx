/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V3 - Institutional Workspaces & Data-Sharing Governance
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  FileCheck2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import { InstitutionalWorkspace } from '../../types/index.ts';

export default function InstitutionalWorkspacesView() {
  const [workspaces, setWorkspaces] = useState<InstitutionalWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<InstitutionalWorkspace | null>(null);

  // New Agreement Modal
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [partnerOrgId, setPartnerOrgId] = useState('org_coop_01');
  const [partnerOrgName, setPartnerOrgName] = useState('Elgon Arabica Growers Cooperative Union');
  const [purpose, setPurpose] = useState('Crop Yield Aggregation & Seasonal Liquidity Forecasting');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'aggregated_yield_forecast',
    'historical_delivery_volume',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmRevokeIdx, setConfirmRevokeIdx] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getInstitutionalWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(data[0]);
      } else if (selectedWorkspace) {
        const found = data.find((w) => w.id === selectedWorkspace.id);
        if (found) setSelectedWorkspace(found);
      }
    } catch (err) {
      console.error('Failed to load institutional workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !purpose) return;
    setSubmitting(true);
    try {
      await api.createDataSharingAgreement({
        workspaceId: selectedWorkspace.id,
        partnerOrgId,
        partnerOrgName,
        purpose,
        fieldsPermitted: selectedFields,
      });
      setShowAgreementModal(false);
      setFeedback({ type: 'success', text: 'Institutional data-sharing agreement recorded.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error creating data-sharing agreement: ' + (err.message || err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAgreement = async (index: number) => {
    if (!selectedWorkspace) return;
    try {
      await api.revokeDataSharingAgreement(selectedWorkspace.id, index);
      setConfirmRevokeIdx(null);
      setFeedback({ type: 'success', text: 'Data-sharing agreement revoked cleanly.' });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error revoking agreement: ' + (err.message || err) });
    }
  };

  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Institutional Top Banner */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
              Institutional Governance V3.0
            </span>
            <span className="text-xs text-[#A0A0A0]">Banks, Grain Councils & Statutory Authorities</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Institutional Workspaces & Data Sharing</h1>
          <p className="text-sm text-[#A0A0A0] max-w-2xl mt-1">
            Secure, consent-driven multi-tenant institutional isolation. Permitted institutions query aggregated macro datasets without accessing smallholder personal identifiable information (PII).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-[#333] hover:border-[#D4AF37] text-[#A0A0A0] hover:text-[#D4AF37] transition"
            title="Refresh Registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAgreementModal(true)}
            disabled={!selectedWorkspace}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c29d2f] text-black font-semibold text-sm rounded-xl transition shadow-lg shadow-[#D4AF37]/10 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Grant Data-Sharing Agreement</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
          feedback.type === 'error'
            ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
            : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Grid: Workspaces Left / Detail Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Workspaces List */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase font-mono tracking-wider text-[#A0A0A0]">Verified Institutions</h2>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#777]">Loading workspaces...</div>
          ) : (
            workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedWorkspace?.id === ws.id
                    ? 'bg-[#181818] border-[#D4AF37]'
                    : 'bg-[#121212] border-[#222] hover:border-[#333]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="text-sm font-semibold text-[#F5F5F5] line-clamp-1">{ws.orgName}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-[#222] text-[#CCC] px-1.5 py-0.5 rounded border border-[#333]">
                    {ws.countryCode}
                  </span>
                </div>

                <div className="mt-2 text-xs text-[#A0A0A0] flex items-center justify-between">
                  <span>{ws.type.replace('_', ' ')}</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>

                {ws.verifiedLicenseNumber && (
                  <div className="mt-2 text-[11px] font-mono text-[#777] bg-[#0c0c0c] px-2 py-1 rounded">
                    Lic: {ws.verifiedLicenseNumber}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: Workspace Details & Data Agreements */}
        <div className="lg:col-span-2 space-y-6">
          {selectedWorkspace ? (
            <>
              {/* Workspace Header Card */}
              <div className="bg-[#121212] border border-[#222] p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#F5F5F5]">{selectedWorkspace.orgName}</h2>
                    <span className="text-xs text-[#A0A0A0]">
                      Jurisdiction: {selectedWorkspace.countryCode} • Institution Type: {selectedWorkspace.type}
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Authoritative Registry Verified
                  </span>
                </div>

                <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg text-xs text-[#A0A0A0] flex items-start gap-2">
                  <Lock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#F5F5F5] font-semibold">Strict Zero-PII Enforcement Active: </span>
                    All data exchanged through institutional connectors is mathematically stripped of farmer names, phone numbers, national IDs (NIN), and raw GPS homestead coordinates. Only aggregated zonal metrics and anonymized commodity grades are permitted.
                  </div>
                </div>
              </div>

              {/* Data Sharing Agreements */}
              <div className="bg-[#121212] border border-[#222] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#D4AF37]" />
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">Active Data-Sharing Accords</h3>
                  </div>
                  <span className="text-xs font-mono text-[#A0A0A0]">
                    {selectedWorkspace.dataSharingAgreements.length} Authorized
                  </span>
                </div>

                {selectedWorkspace.dataSharingAgreements.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#777]">
                    No active data-sharing agreements on file for this institution.
                  </div>
                ) : (
                  <div className="divide-y divide-[#1e1e1e]">
                    {selectedWorkspace.dataSharingAgreements.map((agr, idx) => (
                      <div key={idx} className="p-4 space-y-2 hover:bg-[#181818]/40 transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-[#F5F5F5]">{agr.partnerOrgName}</span>
                            <p className="text-xs text-[#A0A0A0] mt-0.5">{agr.purpose}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                agr.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {agr.status}
                            </span>
                            {agr.status === 'ACTIVE' && (
                              confirmRevokeIdx === idx ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleRevokeAgreement(idx)}
                                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold"
                                  >
                                    Confirm Revoke
                                  </button>
                                  <button
                                    onClick={() => setConfirmRevokeIdx(null)}
                                    className="px-2 py-0.5 rounded bg-[#222] text-[#A0A0A0] text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmRevokeIdx(idx)}
                                  className="p-1 text-[#777] hover:text-rose-400 transition"
                                  title="Revoke Agreement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[11px] text-[#777] mr-1">Permitted Fields:</span>
                          {agr.fieldsPermitted.map((field, fIdx) => (
                            <span
                              key={fIdx}
                              className="text-[10px] font-mono bg-[#222] text-[#CCC] px-2 py-0.5 rounded border border-[#333]"
                            >
                              {field}
                            </span>
                          ))}
                        </div>

                        <div className="text-[11px] text-[#666] font-mono pt-1">
                          Granted: {new Date(agr.grantedAt).toLocaleDateString()} • Expires: {new Date(agr.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Institutional Reports */}
              <div className="bg-[#121212] border border-[#222] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#222] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">Macro Surveillance & Audits</h3>
                  </div>
                  <span className="text-xs font-mono text-[#A0A0A0]">
                    {selectedWorkspace.institutionalReports.length} Reports
                  </span>
                </div>

                {selectedWorkspace.institutionalReports.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#777]">
                    No macro audits generated yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#1e1e1e]">
                    {selectedWorkspace.institutionalReports.map((rep) => (
                      <div key={rep.id} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#F5F5F5]">{rep.reportTitle}</span>
                          <span className="text-[10px] font-mono bg-[#222] text-[#D4AF37] px-2 py-0.5 rounded border border-[#333]">
                            Period: {rep.period}
                          </span>
                        </div>
                        <div className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto">
                          <pre>{JSON.stringify(rep.metricsSummary, null, 2)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#121212] border border-[#222] p-12 text-center text-[#A0A0A0] rounded-xl">
              Select an institution to inspect data agreements.
            </div>
          )}
        </div>
      </div>

      {/* Agreement Modal */}
      {showAgreementModal && selectedWorkspace && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#333] rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5]">Grant Data-Sharing Agreement</h2>
                <span className="text-xs text-[#A0A0A0]">To: {selectedWorkspace.orgName}</span>
              </div>
              <button
                onClick={() => setShowAgreementModal(false)}
                className="text-[#A0A0A0] hover:text-[#F5F5F5] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAgreement} className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">Partner Organization Name</label>
                <input
                  type="text"
                  value={partnerOrgName}
                  onChange={(e) => setPartnerOrgName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] block mb-1">Purpose of Data Exchange</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-2.5 focus:border-[#D4AF37] outline-none"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] block mb-2">Permitted Non-PII Data Fields</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'aggregated_yield_forecast',
                    'historical_delivery_volume',
                    'commodity_stock_levels',
                    'warehouse_receipt_balances',
                    'indicative_cross_border_prices',
                    'border_transit_turnaround',
                  ].map((field) => (
                    <div
                      key={field}
                      onClick={() => toggleField(field)}
                      className={`p-2.5 rounded-lg border cursor-pointer font-mono text-[11px] transition ${
                        selectedFields.includes(field)
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                          : 'bg-[#181818] border-[#333] text-[#888]'
                      }`}
                    >
                      {field}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(false)}
                  className="px-4 py-2 text-sm text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#D4AF37] text-black font-semibold text-sm rounded-xl hover:bg-[#c29d2f] transition disabled:opacity-50"
                >
                  {submitting ? 'Granting...' : 'Sign & Grant Accord'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
