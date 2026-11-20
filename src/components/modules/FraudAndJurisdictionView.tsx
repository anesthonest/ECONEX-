/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V7.0 - Fraud Prevention, Risk Scoring & Statutory Jurisdiction Engine
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Calculator,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  StatutoryJurisdictionRule,
  FraudRiskAlert,
  BeneficialOwnershipRecord
} from '../../types/index.ts';

export const FraudAndJurisdictionView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'RULES' | 'FRAUD_ALERTS' | 'BENEFICIAL_OWNERSHIP'>('RULES');
  const [rules, setRules] = useState<StatutoryJurisdictionRule[]>([]);
  const [alerts, setAlerts] = useState<FraudRiskAlert[]>([]);
  const [ownershipRecords, setOwnershipRecords] = useState<BeneficialOwnershipRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tax Calculator State
  const [calcJurisdiction, setCalcJurisdiction] = useState<string>('UG');
  const [calcCategory, setCalcCategory] = useState<string>('VAT');
  const [calcAmount, setCalcAmount] = useState<number>(10000000);
  const [calcResult, setCalcResult] = useState<{
    taxAmount: number;
    effectiveRate: number;
    ruleCode: string;
    authority: string;
  } | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  // Fraud Evaluation State
  const [evalEntityId, setEvalEntityId] = useState<string>('PART-UG-KLA-001');
  const [evalEntityName, setEvalEntityName] = useState<string>('Sarah Namubiru Enterprise');
  const [evalAmount, setEvalAmount] = useState<number>(250000000);
  const [evalVelocity, setEvalVelocity] = useState<number>(18);
  const [evalInternational, setEvalInternational] = useState<boolean>(true);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [evalLoading, setEvalLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesRes, alertsRes, uboRes]: any = await Promise.all([
        api.getJurisdictionRules(),
        api.getFraudAlerts(),
        api.getBeneficialOwnership()
      ]);
      setRules(Array.isArray(rulesRes) ? rulesRes : (rulesRes?.data || []));
      setAlerts(Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []));
      setOwnershipRecords(Array.isArray(uboRes) ? uboRes : (uboRes?.data || []));
    } catch (err) {
      console.error('Failed to load compliance and jurisdiction data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCalcLoading(true);
      const res: any = await api.calculateStatutoryTax(calcJurisdiction, calcCategory, Number(calcAmount));
      if (res) {
        const payload = res.data || res;
        setCalcResult({
          taxAmount: payload.taxAmount || payload.statutoryLiabilityAmount,
          effectiveRate: payload.effectiveRate || payload.applicableRatePercent,
          ruleCode: payload.ruleCode || payload.ruleId,
          authority: payload.authority || payload.regulatorySource
        });
      }
    } catch (err) {
      console.error('Tax calculation error:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleEvaluateFraud = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEvalLoading(true);
      const res: any = await api.evaluateFraudRisk({
        participantId: evalEntityId,
        amount: Number(evalAmount),
        currency: 'UGX',
        channel: evalInternational ? 'SWIFT_ISO20022' : 'RTGS',
        countryCode: 'UG'
      });
      if (res) {
        const payload = res.data || res;
        setEvalResult(payload);
        // refresh alerts list
        const updatedAlerts: any = await api.getFraudAlerts();
        setAlerts(Array.isArray(updatedAlerts) ? updatedAlerts : (updatedAlerts?.data || []));
      }
    } catch (err) {
      console.error('Fraud evaluation error:', err);
    } finally {
      setEvalLoading(false);
    }
  };

  const getSeverityBadge = (severity: FraudRiskAlert['severity'] | string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/80 border-red-600 text-red-300 font-bold';
      case 'HIGH':
        return 'bg-rose-950/70 border-rose-600 text-rose-300';
      case 'MEDIUM':
        return 'bg-amber-950/70 border-amber-600 text-amber-300';
      default:
        return 'bg-emerald-950/70 border-emerald-600 text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272a] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#F5F5F5] font-display">
              Trust, Jurisdiction & Autonomous Risk Surveillance
            </h1>
            <span className="bg-[#1c1c1f] text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] px-2 py-0.5 rounded font-mono">
              V7.0-TRUST
            </span>
          </div>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Dynamic statutory rules engine (URA, KRA, EAC), real-time sanctions screening, beneficial ownership (UBO) transparency, and automated ML fraud risk scoring.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] rounded text-xs text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Compliance State</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#27272a] pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('RULES')}
          className={`flex items-center gap-2 px-3 py-2 rounded-t-md font-medium transition-colors ${
            activeSubTab === 'RULES'
              ? 'bg-[#18181b] text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Scale size={14} />
          <span>Statutory Rules Engine ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('FRAUD_ALERTS')}
          className={`flex items-center gap-2 px-3 py-2 rounded-t-md font-medium transition-colors ${
            activeSubTab === 'FRAUD_ALERTS'
              ? 'bg-[#18181b] text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <ShieldAlert size={14} />
          <span>Risk Scoring & Sanctions Alerts ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BENEFICIAL_OWNERSHIP')}
          className={`flex items-center gap-2 px-3 py-2 rounded-t-md font-medium transition-colors ${
            activeSubTab === 'BENEFICIAL_OWNERSHIP'
              ? 'bg-[#18181b] text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <UserCheck size={14} />
          <span>Beneficial Ownership (UBO) Registry ({ownershipRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: STATUTORY RULES & LIVE TAX CALCULATOR */}
      {activeSubTab === 'RULES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-lg overflow-hidden">
              <div className="p-3 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-2">
                  <Scale size={14} className="text-[#D4AF37]" />
                  Active Regional Statutory & Tax Rules (Versioned 2026)
                </span>
                <span className="text-[10px] text-[#A0A0A0] font-mono">
                  Autonomous Regulatory Compliance
                </span>
              </div>

              <div className="divide-y divide-[#1f1f23] text-xs">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 hover:bg-[#151518] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#D4AF37]">
                          {rule.versionTag}
                        </span>
                        <span className="font-semibold text-sm text-[#F5F5F5]">
                          {rule.jurisdictionName} ({rule.ruleCategory})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-950/70 border border-emerald-600/60 text-emerald-400">
                        {rule.countryCode} • ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] text-[#A0A0A0]">
                      <div>
                        <span className="text-[#71717a] block text-[10px]">Category</span>
                        <span className="font-mono text-[#F5F5F5]">{rule.ruleCategory}</span>
                      </div>
                      <div>
                        <span className="text-[#71717a] block text-[10px]">Statutory Rate</span>
                        <span className="font-mono font-bold text-amber-400">
                          {rule.standardRatePercent}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[#71717a] block text-[10px]">Authority</span>
                        <span className="text-[#F5F5F5]">{rule.jurisdictionName}</span>
                      </div>
                      <div>
                        <span className="text-[#71717a] block text-[10px]">Regulatory Statute</span>
                        <span className="font-mono text-[10px] text-[#C0C0C0]">
                          {rule.regulatorySource}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Statutory Tax Calculator */}
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
              <Calculator size={16} className="text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-[#F5F5F5]">
                Dynamic Jurisdiction Tax Engine
              </h2>
            </div>

            <form onSubmit={handleCalculateTax} className="space-y-3 text-xs">
              <div>
                <label className="text-[#A0A0A0] text-[11px] block mb-1">
                  Jurisdiction Territory
                </label>
                <select
                  value={calcJurisdiction}
                  onChange={(e) => setCalcJurisdiction(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="UG">Uganda (URA / MoFPED)</option>
                  <option value="KE">Kenya (KRA)</option>
                  <option value="TZ">Tanzania (TRA)</option>
                  <option value="RW">Rwanda (RRA)</option>
                </select>
              </div>

              <div>
                <label className="text-[#A0A0A0] text-[11px] block mb-1">
                  Tax Category
                </label>
                <select
                  value={calcCategory}
                  onChange={(e) => setCalcCategory(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="VAT">Value Added Tax (VAT)</option>
                  <option value="PAYE">Pay-As-You-Earn (PAYE)</option>
                  <option value="PENSION_NSSF">Social Security (NSSF)</option>
                  <option value="WITHHOLDING">Withholding Tax (WHT)</option>
                  <option value="CUSTOMS_DUTY">Customs Tariff</option>
                </select>
              </div>

              <div>
                <label className="text-[#A0A0A0] text-[11px] block mb-1">
                  Taxable Amount (UGX)
                </label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  min="0"
                  step="50000"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 font-mono text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={calcLoading}
                className="w-full py-2 bg-[#D4AF37] hover:bg-[#c49f30] text-black font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Calculator size={13} />
                <span>{calcLoading ? 'Calculating...' : 'Compute Statutory Liability'}</span>
              </button>
            </form>

            {calcResult && (
              <div className="bg-[#18181b] border border-[#D4AF37]/50 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="text-[10px] text-[#A0A0A0] uppercase tracking-wider font-semibold">
                  Statutory Calculation Summary
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0]">Effective Rate:</span>
                  <span className="font-mono font-bold text-[#D4AF37]">
                    {calcResult.effectiveRate}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0]">Assessed Tax Liability:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    UGX {calcResult.taxAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#27272a] text-[10px] text-[#71717a]">
                  <span>Applied Rule: {calcResult.ruleCode}</span>
                  <span>{calcResult.authority}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FRAUD RISK EVALUATION & ALERTS */}
      {activeSubTab === 'FRAUD_ALERTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-[#121212] border border-[#27272a] rounded-lg overflow-hidden">
              <div className="p-3 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-2">
                  <ShieldAlert size={14} className="text-rose-400" />
                  Active Suspicious Activity & Velocity Risk Alerts
                </span>
                <span className="text-[10px] text-[#A0A0A0] font-mono">
                  Autonomous Risk Scoring (0–100)
                </span>
              </div>

              <div className="divide-y divide-[#1f1f23] text-xs">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-[#151518] transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#F5F5F5]">
                            {alert.participantName}
                          </span>
                          <span className="font-mono text-[10px] text-[#A0A0A0]">
                            ({alert.participantId})
                          </span>
                        </div>
                        <div className="text-[10px] text-[#71717a] mt-0.5">
                          Detected: {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono border ${getSeverityBadge(
                            alert.severity
                          )}`}
                        >
                          {alert.severity} ({alert.riskScore}/100)
                        </span>
                        <span className="text-[10px] font-mono bg-[#1c1c1f] text-[#D4AF37] px-2 py-0.5 rounded border border-[#3f3f46]">
                          {alert.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 bg-[#18181b] text-zinc-300 border border-[#27272a] rounded text-[10px]">
                        • Trigger: {alert.ruleTriggered}
                      </span>
                      {alert.evidencePayload && (
                        <span className="px-2 py-0.5 bg-[#18181b] text-[#D4AF37] border border-[#27272a] rounded text-[10px]">
                          • Evidence: {JSON.stringify(alert.evidencePayload).slice(0, 80)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Risk Evaluation Form */}
          <div className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
              <ShieldAlert size={16} className="text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-[#F5F5F5]">
                Simulate Autonomous Risk Scoring
              </h2>
            </div>

            <form onSubmit={handleEvaluateFraud} className="space-y-3 text-xs">
              <div>
                <label className="text-[#A0A0A0] text-[11px] block mb-1">
                  Participant Identifier
                </label>
                <input
                  type="text"
                  value={evalEntityId}
                  onChange={(e) => setEvalEntityId(e.target.value)}
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 font-mono text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#A0A0A0] text-[11px] block mb-1">
                  Entity Legal Name
                </label>
                <input
                  type="text"
                  value={evalEntityName}
                  onChange={(e) => setEvalEntityName(e.target.value)}
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#A0A0A0] text-[11px] block mb-1">
                  Transaction Amount (UGX)
                </label>
                <input
                  type="number"
                  value={evalAmount}
                  onChange={(e) => setEvalAmount(Number(e.target.value))}
                  min="0"
                  step="1000000"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 font-mono text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#A0A0A0] text-[11px] block mb-1">
                  1-Hour Transaction Velocity (Count)
                </label>
                <input
                  type="number"
                  value={evalVelocity}
                  onChange={(e) => setEvalVelocity(Number(e.target.value))}
                  min="1"
                  max="100"
                  required
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 font-mono text-[#F5F5F5] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="intlCheck"
                  checked={evalInternational}
                  onChange={(e) => setEvalInternational(e.target.checked)}
                  className="rounded border-[#27272a] bg-[#18181b] text-[#D4AF37] focus:ring-0"
                />
                <label htmlFor="intlCheck" className="text-[11px] text-[#A0A0A0]">
                  Cross-Border / High-Risk Corridor Transfer
                </label>
              </div>

              <button
                type="submit"
                disabled={evalLoading}
                className="w-full py-2 bg-[#D4AF37] hover:bg-[#c49f30] text-black font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldAlert size={13} />
                <span>{evalLoading ? 'Evaluating ML Rules...' : 'Execute Fraud Scoring & Sanctions Scan'}</span>
              </button>
            </form>

            {evalResult && (
              <div className="bg-[#18181b] border border-amber-500/50 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0]">Assessed Risk Score:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {evalResult.riskScore} / 100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0]">Assigned Tier:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getSeverityBadge(
                      evalResult.riskTier || (evalResult.riskScore >= 75 ? 'HIGH' : 'MEDIUM')
                    )}`}
                  >
                    {evalResult.riskTier || (evalResult.riskScore >= 75 ? 'HIGH' : 'MEDIUM')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A0A0A0]">Action Mandate:</span>
                  <span className="font-mono text-xs font-semibold text-[#D4AF37]">
                    {evalResult.recommendation || (evalResult.riskScore >= 75 ? 'STEP_UP_AUTH' : 'CLEAR')}
                  </span>
                </div>
                {evalResult.flags && (
                  <div className="pt-2 border-t border-[#27272a]">
                    <span className="text-[10px] text-[#71717a] block mb-1">
                      Triggered Risk Heuristics:
                    </span>
                    <div className="space-y-0.5">
                      {evalResult.flags.map((t: string, i: number) => (
                        <div key={i} className="text-[10px] text-zinc-300">
                          • {t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BENEFICIAL OWNERSHIP & SANCTIONS DIRECTORY */}
      {activeSubTab === 'BENEFICIAL_OWNERSHIP' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg overflow-hidden">
          <div className="p-3 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#F5F5F5] flex items-center gap-2">
              <UserCheck size={14} className="text-[#D4AF37]" />
              Ultimate Beneficial Ownership (UBO) & FATF PEP Clearance
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              KYC/AML Level-3 Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181b]/50 text-[#71717a] border-b border-[#27272a] text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Entity Name & ID</th>
                  <th className="py-2.5 px-3">Ultimate Beneficial Owner</th>
                  <th className="py-2.5 px-3">Nationality</th>
                  <th className="py-2.5 px-3 text-right">Ownership %</th>
                  <th className="py-2.5 px-3 text-center">PEP Status</th>
                  <th className="py-2.5 px-3 text-center">Sanctions Clearance</th>
                  <th className="py-2.5 px-3">Control Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {ownershipRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#151518] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#F5F5F5]">
                        {record.entityName}
                      </div>
                      <div className="font-mono text-[10px] text-[#A0A0A0]">
                        {record.entityId}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#F5F5F5]">
                      {record.beneficialOwnerName}
                    </td>
                    <td className="py-2.5 px-3 text-[#A0A0A0]">
                      {record.nationality}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[#D4AF37]">
                      {record.ownershipPercentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {record.isPoliticallyExposedPerson ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-950 border border-amber-600 text-amber-300 font-mono">
                          PEP IDENTIFIED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400 font-mono">
                          NON-PEP
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {record.sanctionsClearanceStatus === 'FLAGGED' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 border border-red-600 text-red-300 font-mono">
                          SANCTIONED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 border border-emerald-600 text-emerald-300 font-mono">
                          CLEARED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#A0A0A0] text-[11px] font-mono">
                      {record.controlType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
