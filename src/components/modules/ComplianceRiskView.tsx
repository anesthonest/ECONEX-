/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V3 - Compliance, Fraud & Anomaly Monitoring
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import { ComplianceRiskEvent } from '../../types/index.ts';

export default function ComplianceRiskView() {
  const [risks, setRisks] = useState<ComplianceRiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<ComplianceRiskEvent | null>(null);

  // Resolution Form
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getComplianceRiskEvents();
      setRisks(data);
      if (data.length > 0 && !selectedRisk) {
        setSelectedRisk(data[0]);
      } else if (selectedRisk) {
        const found = data.find((r) => r.id === selectedRisk.id);
        if (found) setSelectedRisk(found);
      }
    } catch (err) {
      console.error('Failed to load compliance risk events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignInvestigator = async (riskId: string) => {
    setActionError(null);
    try {
      await api.investigateComplianceRisk(riskId, 'Grace Nakato (Compliance Auditor)');
      await loadData();
    } catch (err: any) {
      setActionError('Error assigning auditor: ' + (err.message || err));
    }
  };

  const handleResolveRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk || !resolutionNotes) return;
    setActionError(null);
    setSubmitting(true);
    try {
      await api.resolveComplianceRisk(selectedRisk.id, resolutionNotes, actionTaken);
      setResolutionNotes('');
      await loadData();
    } catch (err: any) {
      setActionError('Error resolving risk event: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121212] border border-[#2a2a2a] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
              Regulatory Tech & Compliance V3.0
            </span>
            <span className="text-xs text-[#A0A0A0]">Supervisory Surveillance & Human Sign-Off</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Compliance & Risk Surveillance</h1>
          <p className="text-sm text-[#A0A0A0] max-w-2xl mt-1">
            Real-time pattern detection for velocity spikes, currency mismatches, and price anomalies. Governed by strict human review requirements: algorithmic signals cannot seize assets or condemn entities without certified human audit.
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="p-2.5 rounded-xl border border-[#333] hover:border-[#D4AF37] text-[#A0A0A0] hover:text-[#D4AF37] transition self-start md:self-auto"
          title="Refresh Queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Human-in-the-Loop Regulatory Charter Card */}
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl p-4 flex items-start gap-3 text-xs text-[#A0A0A0]">
        <Lock className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <div>
          <p className="text-[#F5F5F5] font-semibold">Non-Punitive AI Safeguard Constitution</p>
          <p className="mt-0.5">
            Under Section 10 of the ECONEX Regulatory Technology Charter, AI economic engines and automated heuristics operate solely as <strong>advisory signals</strong>. Automatic punitive action, asset freezing, or farmer disqualification based purely on probabilistic model outputs is structurally barred. Every escalation requires a human compliance auditor sign-off.
          </p>
        </div>
      </div>

      {/* Grid: Events List Left / Event Investigation Detail Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Queue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase font-mono tracking-wider text-[#A0A0A0]">Active Surveillance Queue</h2>
            <span className="text-xs font-mono text-[#D4AF37]">{risks.length} Incidents</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#777]">Loading risk events...</div>
          ) : risks.length === 0 ? (
            <div className="p-8 bg-[#121212] border border-[#222] rounded-xl text-center text-xs text-[#777]">
              Zero active risk flags detected.
            </div>
          ) : (
            risks.map((risk) => (
              <div
                key={risk.id}
                onClick={() => setSelectedRisk(risk)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                  selectedRisk?.id === risk.id
                    ? 'bg-[#181818] border-[#D4AF37]'
                    : 'bg-[#121212] border-[#222] hover:border-[#333]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 ${
                        risk.severity === 'CRITICAL'
                          ? 'text-rose-500'
                          : risk.severity === 'HIGH'
                          ? 'text-orange-400'
                          : risk.severity === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-[#D4AF37]'
                      }`}
                    />
                    <span className="text-xs font-bold text-[#F5F5F5] line-clamp-1">{risk.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      risk.severity === 'CRITICAL' || risk.severity === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {risk.severity}
                  </span>
                </div>

                <p className="text-xs text-[#A0A0A0] line-clamp-2">{risk.description}</p>

                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#777]">
                  <span>{risk.category.replace('_', ' ')}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-semibold ${
                      risk.status.includes('RESOLVED')
                        ? 'text-emerald-400'
                        : risk.status.includes('INVESTIGATION')
                        ? 'text-amber-400'
                        : 'text-[#CCC]'
                    }`}
                  >
                    {risk.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Risk Investigation & Sign-Off */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRisk ? (
            <div className="bg-[#121212] border border-[#222] rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono bg-[#222] text-[#D4AF37] px-2 py-0.5 rounded border border-[#333]">
                      Incident #{selectedRisk.id}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Advisory Signal Only (Non-Punitive)
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#F5F5F5]">{selectedRisk.title}</h2>
                  <span className="text-xs text-[#A0A0A0]">
                    Category: {selectedRisk.category} • Subject: {selectedRisk.subjectType} ({selectedRisk.subjectId})
                  </span>
                </div>

                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded font-semibold shrink-0 ${
                    selectedRisk.status.includes('RESOLVED')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {selectedRisk.status}
                </span>
              </div>

              {/* Description */}
              <div className="p-4 bg-[#181818] border border-[#262626] rounded-xl text-sm text-[#CCC] leading-relaxed">
                {selectedRisk.description}
              </div>

              {/* Investigator Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-[#181818] border border-[#222] rounded-xl">
                  <span className="text-[#777] block mb-1">Assigned Human Compliance Auditor</span>
                  <div className="text-sm font-semibold text-[#F5F5F5] flex items-center justify-between">
                    <span>{selectedRisk.assignedAuditor || 'Unassigned'}</span>
                    {!selectedRisk.assignedAuditor && (
                      <button
                        onClick={() => handleAssignInvestigator(selectedRisk.id)}
                        className="text-xs bg-[#222] hover:bg-[#333] text-[#D4AF37] px-2 py-1 rounded transition"
                      >
                        Assign Self
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#181818] border border-[#222] rounded-xl">
                  <span className="text-[#777] block mb-1">Creation & Investigation Timeline</span>
                  <div className="text-xs text-[#CCC]">
                    Flagged: {new Date(selectedRisk.createdAt).toLocaleString()}
                    {selectedRisk.resolvedAt && (
                      <div className="text-emerald-400 mt-0.5">
                        Resolved: {new Date(selectedRisk.resolvedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resolution Notes Display (If resolved) */}
              {selectedRisk.resolutionNotes && (
                <div className="p-4 bg-[#0e1610] border border-emerald-500/30 rounded-xl space-y-1">
                  <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Human Compliance Sign-Off On Record
                  </span>
                  <p className="text-xs text-[#CCC]">{selectedRisk.resolutionNotes}</p>
                </div>
              )}

              {/* Action Form (If still open or under investigation) */}
              {!selectedRisk.resolvedAt && (
                <form onSubmit={handleResolveRisk} className="p-5 bg-[#181818] border border-[#2e2e2e] rounded-xl space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#F5F5F5] block mb-1">
                      Auditor Investigation Finding & Sign-Off Justification
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Detail findings of invoice inspection, seller origin verification, or reconciliation..."
                      className="w-full bg-[#121212] border border-[#333] text-[#F5F5F5] text-sm rounded-xl p-3 focus:border-[#D4AF37] outline-none"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#CCC]">
                    <input
                      type="checkbox"
                      id="actionCheck"
                      checked={actionTaken}
                      onChange={(e) => setActionTaken(e.target.checked)}
                      className="rounded text-[#D4AF37]"
                    />
                    <label htmlFor="actionCheck">
                      Remedial action required (e.g. hold escrow pending corrected invoice)
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black font-semibold text-sm rounded-xl hover:bg-[#c29d2f] transition disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{submitting ? 'Submitting Sign-off...' : 'Certify Compliance Sign-Off'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-[#121212] border border-[#222] p-12 text-center text-[#A0A0A0] rounded-2xl">
              Select an incident from the surveillance queue to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
