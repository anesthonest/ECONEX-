/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V6.0 - Work, Employment & Income Infrastructure (AETHER WORK)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.ts';
import {
  WorkContract,
  WorkTimesheet,
  PayrollRun,
} from '../../types/index.ts';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck2,
  Plus,
  RefreshCw,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';

export const WorkAndIncomeView: React.FC = () => {
  const [contracts, setContracts] = useState<WorkContract[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CONTRACTS' | 'PAYROLL' | 'TIMESHEETS'>('CONTRACTS');

  // Timesheet Modal State
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [tsContractId, setTsContractId] = useState('');
  const [tsHours, setTsHours] = useState<number>(40);
  const [tsDesc, setTsDesc] = useState('Routine preventive maintenance overhaul on continuous grain roller');
  const [tsSuccessMsg, setTsSuccessMsg] = useState('');

  // Payroll Run Modal State
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollGross, setPayrollGross] = useState<number>(142500000);
  const [payrollEmployees, setPayrollEmployees] = useState<number>(42);
  const [payrollPeriod, setPayrollPeriod] = useState('November 2026');
  const [payrollSuccessMsg, setPayrollSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cntList, payList] = await Promise.all([
        api.getWorkContracts(),
        api.getPayrollRuns(),
      ]);
      setContracts(Array.isArray(cntList) ? cntList : []);
      setPayrollRuns(Array.isArray(payList) ? payList : []);
      if (cntList && cntList.length > 0) {
        setTsContractId(cntList[0].id);
      }
    } catch (err) {
      console.error('Failed to load work data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setTsSuccessMsg('');
    try {
      await api.submitWorkTimesheet({
        contractId: tsContractId || contracts[0]?.id || 'WRK-2026-001',
        hoursLogged: Number(tsHours),
        description: tsDesc,
        periodStart: new Date().toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
      });
      setTsSuccessMsg('Timesheet logged and approved by Operations Supervisor.');
      setTimeout(() => {
        setShowTimesheetModal(false);
        setTsSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setTsSuccessMsg(`Error: ${err.message || 'Failed to submit timesheet'}`);
    }
  };

  const handleExecutePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayrollSuccessMsg('');
    try {
      const res = await api.executePayrollRun({
        organizationId: 'PART-UG-001',
        period: payrollPeriod,
        grossPayAmount: Number(payrollGross),
        employeeCount: Number(payrollEmployees),
        currency: 'UGX',
      });
      setPayrollSuccessMsg(`Payroll run ${res.id} for ${res.employeeCount} employees disbursed. Net: USh ${(res.totalNetPay / 1000000).toFixed(1)}M.`);
      setTimeout(() => {
        setShowPayrollModal(false);
        setPayrollSuccessMsg('');
        fetchData();
      }, 1800);
    } catch (err: any) {
      setPayrollSuccessMsg(`Error: ${err.message || 'Payroll run failed'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">ECONEX WORK & INCOME</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c1c1f] text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
              Workforce, Contracts & Payroll
            </span>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Universal economic coordination for employment, contracts, skilled trades, timesheets, and automated tax/social deduction payroll.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab('CONTRACTS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'CONTRACTS' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Work Contracts ({contracts.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYROLL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'PAYROLL' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Payroll Runs ({payrollRuns.length})
          </button>
        </div>
      </div>

      {/* VIEW: WORK CONTRACTS */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Active Work Contracts & Engagements</h2>
              <p className="text-xs text-[#A0A0A0]">
                Verifiable milestone-driven agreements between employers, contractors, and specialists.
              </p>
            </div>
            <button
              onClick={() => setShowTimesheetModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors"
            >
              <Clock size={14} />
              <span>Log Timesheet Hours</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map((cnt) => (
              <div key={cnt.id} className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#D4AF37] font-bold text-xs">{cnt.workType} · {cnt.sector}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {cnt.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F5]">{cnt.contractTitle}</h3>
                  <div className="text-xs text-[#A0A0A0] mt-1">
                    Employer: <strong>{cnt.employerName}</strong> &rarr; Contractor: <strong>{cnt.contractorName}</strong>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] rounded border border-[#27272a] flex justify-between items-center text-xs">
                  <span className="text-[#A0A0A0]">Contract Remuneration Rate:</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {cnt.rateAmount.toLocaleString()} {cnt.currency} / {cnt.ratePeriod}
                  </span>
                </div>

                {cnt.milestones && cnt.milestones.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1e1e24]">
                    <div className="text-[11px] font-medium text-[#A0A0A0]">Milestones & Deliverables:</div>
                    {cnt.milestones.map((m) => (
                      <div key={m.id} className="p-2 bg-[#18181b] rounded flex items-center justify-between text-xs">
                        <span className="text-[#F5F5F5]">{m.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#A0A0A0]">{m.amount.toLocaleString()} {cnt.currency}</span>
                          {m.completed ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                              <CheckCircle2 size={11} /> Done
                            </span>
                          ) : (
                            <span className="text-amber-400 text-[10px]">In Progress</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: PAYROLL */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#F5F5F5]">Enterprise Payroll Administration</h2>
              <p className="text-xs text-[#A0A0A0]">
                Statutory deductions automatically calculated (10% NSSF Pension Contribution + 17% PAYE Withholding Tax).
              </p>
            </div>
            <button
              onClick={() => setShowPayrollModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors"
            >
              <Plus size={14} />
              <span>Execute Monthly Payroll</span>
            </button>
          </div>

          <div className="space-y-4">
            {payrollRuns.map((p) => (
              <div key={p.id} className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">{p.organizationName} — {p.period}</h3>
                    <div className="text-xs text-[#A0A0A0] mt-0.5">
                      {p.employeeCount} Registered Employees & Plant Operators
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#18181b] rounded border border-[#27272a]">
                    <span className="text-[#A0A0A0]">Total Gross Payroll:</span>
                    <div className="text-base font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
                      {p.totalGrossPay.toLocaleString()} {p.currency}
                    </div>
                  </div>

                  <div className="p-3 bg-[#18181b] rounded border border-[#27272a]">
                    <span className="text-[#A0A0A0]">Statutory Deductions (NSSF + PAYE):</span>
                    <div className="text-base font-bold font-mono text-red-400 tabular-nums mt-1">
                      -{p.totalDeductions.toLocaleString()} {p.currency}
                    </div>
                  </div>

                  <div className="p-3 bg-[#18181b] rounded border border-[#27272a]">
                    <span className="text-[#A0A0A0]">Net Disbursed to Bank/MoMo:</span>
                    <div className="text-base font-bold font-mono text-emerald-400 tabular-nums mt-1">
                      {p.totalNetPay.toLocaleString()} {p.currency}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#71717a] pt-2 border-t border-[#1e1e24] flex items-center justify-between">
                  <span>Run ID: <code className="text-[#A0A0A0] font-mono">{p.id}</code></span>
                  <span>Disbursed: {new Date(p.disbursedAt || p.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Log Timesheet */}
      {showTimesheetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Log Work Hours for Approval</h3>
            <form onSubmit={handleLogTimesheet} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Contract Reference</label>
                <select
                  value={tsContractId}
                  onChange={(e) => setTsContractId(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contractTitle} ({c.employerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Hours Logged</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  required
                  value={tsHours}
                  onChange={(e) => setTsHours(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Work Description & Deliverables</label>
                <textarea
                  rows={3}
                  required
                  value={tsDesc}
                  onChange={(e) => setTsDesc(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              {tsSuccessMsg && (
                <div className={`p-2 rounded text-xs ${tsSuccessMsg.startsWith('Error') ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                  {tsSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTimesheetModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Submit & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Execute Payroll */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Execute Automated Payroll Run</h3>
            <form onSubmit={handleExecutePayroll} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Payroll Period</label>
                <input
                  type="text"
                  required
                  value={payrollPeriod}
                  onChange={(e) => setPayrollPeriod(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Gross Amount (UGX)</label>
                  <input
                    type="number"
                    min="1000000"
                    required
                    value={payrollGross}
                    onChange={(e) => setPayrollGross(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Employee Count</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payrollEmployees}
                    onChange={(e) => setPayrollEmployees(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#18181b] rounded border border-[#27272a] space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-[#A0A0A0]">
                  <span>10% NSSF Contribution:</span>
                  <span>USh {(payrollGross * 0.10).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#A0A0A0]">
                  <span>17% PAYE Tax Withholding:</span>
                  <span>USh {(payrollGross * 0.17).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-[#27272a]">
                  <span>Net Disbursable:</span>
                  <span>USh {(payrollGross * 0.73).toLocaleString()}</span>
                </div>
              </div>

              {payrollSuccessMsg && (
                <div className="p-2 rounded text-xs bg-emerald-950 text-emerald-300">
                  {payrollSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Disburse Payroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
