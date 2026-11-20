/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V8.0 - Programmable Economic Agreements & Automation Governance
 * Continental Economic Network & Autonomous Coordination
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Plus,
  ShieldCheck,
  Zap,
  Lock,
  Edit3,
  DollarSign,
  ArrowRight,
  Send,
  Layers,
  Activity,
  UserCheck
} from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import {
  ProgrammableEconomicAgreement,
  AutomationRulePolicy,
  AutomationExecutionRecord,
  UniversalPaymentProvider,
  EconomicParticipant,
  SupportedCurrency
} from '../types';

export const AgreementsAutomationView: React.FC = () => {
  const [agreements, setAgreements] = useState<ProgrammableEconomicAgreement[]>([]);
  const [policies, setPolicies] = useState<AutomationRulePolicy[]>([]);
  const [executions, setExecutions] = useState<AutomationExecutionRecord[]>([]);
  const [providers, setProviders] = useState<UniversalPaymentProvider[]>([]);
  const [participants, setParticipants] = useState<EconomicParticipant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Actions
  const [isNewAgreementModalOpen, setIsNewAgreementModalOpen] = useState<boolean>(false);
  const [agreementTitle, setAgreementTitle] = useState<string>('Strategic Sugarcane & Biomass Supply Accord 2026');
  const [agreementCategory, setAgreementCategory] = useState<string>('SUPPLY');
  const [agreementTerms, setAgreementTerms] = useState<string>('Annual delivery quota of 30,000 MT raw feedstock with automated inspection escrow release.');
  const [agreementAmount, setAgreementAmount] = useState<number>(4500000000);
  const [agreementCurrency, setAgreementCurrency] = useState<SupportedCurrency>('UGX');

  // Payment Routing Simulator
  const [routeCurrency, setRouteCurrency] = useState<SupportedCurrency>('UGX');
  const [routeAmount, setRouteAmount] = useState<number>(150000000);
  const [routeCountry, setRouteCountry] = useState<string>('UG');
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [simulatingRoute, setSimulatingRoute] = useState<boolean>(false);
  const [confirmApproveKey, setConfirmApproveKey] = useState<string | null>(null);
  const [confirmHighImpactId, setConfirmHighImpactId] = useState<string | null>(null);
  const [amendTargetId, setAmendTargetId] = useState<string | null>(null);
  const [amendNotes, setAmendNotes] = useState<string>('');
  const [amendTerms, setAmendTerms] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agrList, polList, execList, provList, partList] = await Promise.all([
        ApiClient.getProgrammableAgreements(),
        ApiClient.getAutomationPolicies(),
        ApiClient.getAutomationExecutions(),
        ApiClient.getPaymentProviders(),
        ApiClient.getEconomicParticipants()
      ]);
      setAgreements(agrList);
      setPolicies(polList);
      setExecutions(execList);
      setProviders(provList);
      setParticipants(partList);
    } catch (err) {
      console.error('Failed to load agreements and automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveMilestone = async (agrId: string, milestoneId: string) => {
    try {
      await ApiClient.approveAgreementMilestone(agrId, milestoneId, 'autonomous.legal.attorney@econex.ug');
      setConfirmApproveKey(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to approve milestone:', err);
    }
  };

  const handleAmendAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendTargetId || !amendNotes.trim()) return;
    try {
      await ApiClient.amendProgrammableAgreement(
        amendTargetId,
        'commercial.director@econex.ug',
        amendNotes.trim(),
        amendTerms.trim() || undefined
      );
      setAmendTargetId(null);
      setAmendNotes('');
      setAmendTerms('');
      await fetchData();
    } catch (err) {
      console.error('Failed to amend agreement:', err);
    }
  };

  const handleTogglePolicy = async (id: string) => {
    try {
      await ApiClient.toggleAutomationPolicy(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to toggle policy:', err);
    }
  };

  const handleApproveHighImpact = async (execId: string) => {
    try {
      await ApiClient.approveHighImpactExecution(execId, 'chief.risk.officer@econex.ug');
      setConfirmHighImpactId(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to approve high impact execution:', err);
    }
  };

  const handleTriggerTest = async (policyId: string) => {
    try {
      await ApiClient.triggerAutomation(policyId, { timestamp: new Date().toISOString(), trigger: 'MANUAL_TEST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to trigger automation:', err);
    }
  };

  const handleSimulatePaymentRoute = async () => {
    try {
      setSimulatingRoute(true);
      const res = await ApiClient.routePayment({
        sourceCurrency: routeCurrency,
        targetCurrency: routeCurrency,
        amount: routeAmount,
        countryCode: routeCountry
      });
      setRoutingResult(res);
    } catch (err) {
      console.error('Failed to simulate payment route:', err);
    } finally {
      setSimulatingRoute(false);
    }
  };

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (participants.length < 2) return;
    try {
      await ApiClient.createProgrammableAgreement({
        title: agreementTitle,
        category: agreementCategory,
        parties: [
          { participantId: participants[0].id, participantName: participants[0].legalName, role: 'BUYER', signed: true, signedAt: new Date().toISOString() },
          { participantId: participants[1].id, participantName: participants[1].legalName, role: 'SUPPLIER', signed: true, signedAt: new Date().toISOString() }
        ],
        terms: agreementTerms,
        currency: agreementCurrency,
        amount: agreementAmount,
        actor: 'legal.coordinator@aros.ug'
      });
      setIsNewAgreementModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to create programmable agreement:', err);
    }
  };

  const pendingHighImpactExecutions = executions.filter(e => e.state === 'REQUIRES_APPROVAL');

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                V8.0 Agreements & Autonomous Governance
              </span>
              <span className="text-xs text-[#A0A0A0]">Smart Accords & Human-In-The-Loop Approval Gates</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-[#F5F5F5]">
              Programmable Economic Agreements & Automation Governance
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
              Digitally signed bilateral contracts with milestone release triggers, automation policies with strict human-in-the-loop safety boundaries, circuit breakers, and provider-neutral payment rail orchestration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-[#333333] hover:border-[#D4AF37] text-xs font-mono text-[#F5F5F5]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              SYNC
            </button>
            <button
              onClick={() => setIsNewAgreementModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505]"
            >
              <Plus className="w-3.5 h-3.5" />
              NEW PROGRAMMABLE ACCORD
            </button>
          </div>
        </div>
      </div>

      {/* High-Impact Human Approval Gate Banner */}
      {pendingHighImpactExecutions.length > 0 && (
        <div className="border border-[#f59e0b] bg-[#1a1306] p-5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
            <h2 className="text-sm font-mono tracking-wider uppercase text-[#f59e0b] font-semibold">
              Action Required: High-Impact Autonomous Executions Awaiting Human Sign-off
            </h2>
          </div>
          <p className="text-xs text-[#d1d5db] mb-4 max-w-3xl">
            In accordance with V8 autonomous governance principles, critical executions (such as high-value interbank fund settlements, statutory filings, and legal ownership alterations) cannot proceed autonomously without multi-signatory officer authorization.
          </p>

          <div className="space-y-3">
            {pendingHighImpactExecutions.map((exec) => (
              <div
                key={exec.id}
                className="p-4 bg-[#0a0702] border border-[#f59e0b]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[#f59e0b] font-semibold">{exec.id}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30">
                      {exec.category}
                    </span>
                    <span className="text-[#888888] font-mono">Policy: {exec.policyName}</span>
                  </div>
                  <div className="text-[#F5F5F5]">{exec.outputSummary}</div>
                  <div className="text-[10px] font-mono text-[#888888] mt-1">
                    Triggered: {new Date(exec.triggeredAt).toLocaleString()}
                  </div>
                </div>

                {confirmHighImpactId === exec.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveHighImpact(exec.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-bold text-white"
                    >
                      CONFIRM SIGN-OFF
                    </button>
                    <button
                      onClick={() => setConfirmHighImpactId(null)}
                      className="px-3 py-2 border border-[#333] text-xs font-mono text-[#A0A0A0]"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmHighImpactId(exec.id)}
                    className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-xs font-mono font-bold text-[#050505] transition-colors shrink-0"
                  >
                    AUTHORIZE & RELEASE (HUMAN SIGN-OFF)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programmable Economic Agreements Registry */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-mono tracking-wider uppercase text-[#F5F5F5]">
              Active Programmable Economic Agreements
            </h2>
          </div>
          <span className="text-xs font-mono text-[#888888]">
            {agreements.length} Accords Enforced
          </span>
        </div>

        <div className="space-y-4">
          {agreements.map((agr) => (
            <div
              key={agr.id}
              className="p-5 border border-[#222222] bg-[#121212] hover:border-[#D4AF37]/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1c1c1c]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#D4AF37] font-semibold">
                      {agr.agreementNumber}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono border border-[#2a2a2a] text-[#C0C0C0]">
                      v{agr.version}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono border border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/5">
                      {agr.status}
                    </span>
                    <span className="text-[10px] font-mono text-[#888888]">
                      {agr.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[#F5F5F5] mt-1">
                    {agr.title}
                  </h3>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[10px] font-mono text-[#888888]">TOTAL VALUE</div>
                    <div className="text-base font-mono font-medium text-[#F5F5F5]">
                      {agr.currency} {agr.amount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#888888]">DIGITAL SIGNATURES</div>
                    <div className="text-xs font-mono text-[#D4AF37]">
                      {agr.digitalSignaturesCount} / {agr.parties.length} Signatories
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAmendTargetId(agr.id);
                      setAmendNotes('');
                      setAmendTerms('');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-[#333333] hover:border-[#D4AF37] text-xs font-mono text-[#F5F5F5]"
                  >
                    <Edit3 className="w-3 h-3" />
                    AMEND
                  </button>
                </div>
              </div>

              {/* Signatory Parties */}
              <div className="py-2.5 flex flex-wrap items-center gap-3 text-xs border-b border-[#1c1c1c]">
                <span className="text-[10px] font-mono text-[#888888]">PARTIES:</span>
                {agr.parties.map((party, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#C0C0C0]"
                  >
                    <ShieldCheck className="w-3 h-3 text-[#4ade80]" />
                    {party.participantName} ({party.role})
                  </span>
                ))}
              </div>

              {/* Terms */}
              <p className="text-xs text-[#A0A0A0] my-3 bg-[#0a0a0a] p-3 border border-[#1a1a1a]">
                {agr.terms}
              </p>

              {/* Payment Milestones */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-[#888888] uppercase">
                  Programmable Settlement Milestones:
                </div>
                {agr.paymentMilestones.map((ms) => (
                  <div
                    key={ms.milestoneId}
                    className="p-3 bg-[#0a0a0a] border border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#F5F5F5]">
                        [{ms.milestoneId}] {ms.title}
                      </div>
                      <div className="text-[10px] font-mono text-[#888888]">
                        Condition: <span className="text-[#C0C0C0]">{ms.condition}</span> • Value: {agr.currency} {ms.amount.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {ms.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#4ade80] px-2.5 py-1 bg-[#4ade80]/10 border border-[#4ade80]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          VERIFIED & SETTLED
                        </span>
                      ) : confirmApproveKey === `${agr.id}:${ms.milestoneId}` ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveMilestone(agr.id, ms.milestoneId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-mono font-medium text-white"
                          >
                            CONFIRM PAYOUT
                          </button>
                          <button
                            onClick={() => setConfirmApproveKey(null)}
                            className="px-2 py-1 border border-[#333] text-[10px] font-mono text-[#A0A0A0]"
                          >
                            CANCEL
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmApproveKey(`${agr.id}:${ms.milestoneId}`)}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#b89528] text-[10px] font-mono font-medium text-[#050505] transition-colors"
                        >
                          VERIFY & RELEASE
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Amendment History */}
              {agr.amendmentHistory && agr.amendmentHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-[10px] font-mono text-[#666666]">
                  <span className="text-[#888888]">Amendments: </span>
                  {agr.amendmentHistory.map(a => `[v${a.amendmentNumber}: ${a.notes} by ${a.amendedBy}]`).join(' • ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Autonomous Policy Registry & Execution Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Policies */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-mono tracking-wider uppercase text-[#F5F5F5]">
                Automation Policy Registry
              </h2>
            </div>
            <span className="text-xs font-mono text-[#888888]">
              {policies.length} Policies Active
            </span>
          </div>

          <div className="space-y-3">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="p-4 bg-[#121212] border border-[#222222] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#D4AF37] font-semibold">
                    {pol.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono ${
                      pol.category === 'HIGH_IMPACT'
                        ? 'border border-[#ef4444]/40 text-[#ef4444] bg-[#ef4444]/5'
                        : pol.category === 'AI_ASSISTED'
                        ? 'border border-[#a855f7]/40 text-[#a855f7] bg-[#a855f7]/5'
                        : 'border border-[#60a5fa]/40 text-[#60a5fa] bg-[#60a5fa]/5'
                    }`}>
                      {pol.category}
                    </span>
                    <button
                      onClick={() => handleTogglePolicy(pol.id)}
                      className={`px-2 py-0.5 text-[10px] font-mono ${
                        pol.status === 'ACTIVE'
                          ? 'text-[#4ade80] border border-[#4ade80]/40'
                          : 'text-[#888888] border border-[#333333]'
                      }`}
                    >
                      {pol.status}
                    </button>
                  </div>
                </div>

                <div className="text-xs font-medium text-[#F5F5F5] mb-1">
                  {pol.name}
                </div>
                <div className="text-[10px] font-mono text-[#888888] mb-2">
                  Scope: {pol.authorizedScope} • Condition: {pol.triggerCondition}
                </div>

                <div className="pt-2 border-t border-[#1c1c1c] flex items-center justify-between text-[10px] font-mono text-[#666666]">
                  <div>Executions: {pol.executionCount} • Failures: {pol.failureCount}</div>
                  <button
                    onClick={() => handleTriggerTest(pol.id)}
                    className="text-[#D4AF37] hover:underline"
                  >
                    SIMULATE RUN
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider-Neutral Payment Network & Simulator */}
        <div className="border border-[#262626] bg-[#0c0c0c] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#D4AF37]" />
                <h2 className="text-sm font-mono tracking-wider uppercase text-[#F5F5F5]">
                  Payment Rail Network & Routing Engine
                </h2>
              </div>
              <span className="text-xs font-mono text-[#888888]">
                {providers.length} Rails Interconnected
              </span>
            </div>

            {/* Providers List */}
            <div className="space-y-2 mb-6">
              {providers.map((prov) => (
                <div
                  key={prov.id}
                  className="p-3 bg-[#121212] border border-[#222222] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-[#F5F5F5]">{prov.providerName}</div>
                    <div className="text-[10px] font-mono text-[#888888]">
                      {prov.id} • {prov.providerType} • Currencies: {prov.supportedCurrencies.join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#4ade80] px-2 py-0.5 bg-[#4ade80]/10 border border-[#4ade80]/30">
                      {prov.settlementPeriod}
                    </span>
                    <div className="text-[10px] font-mono text-[#888888] mt-1">
                      Fee: {prov.feeSchedulePercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Route Simulator */}
            <div className="p-4 bg-[#141414] border border-[#2a2a2a] space-y-3">
              <div className="text-xs font-mono text-[#D4AF37] uppercase font-semibold">
                Universal Settlement Route Simulator
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-[#888888]">CURRENCY</label>
                  <select
                    value={routeCurrency}
                    onChange={(e) => setRouteCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-2 py-1 bg-[#0c0c0c] border border-[#262626] text-xs font-mono text-[#F5F5F5]"
                  >
                    <option value="UGX">UGX</option>
                    <option value="KES">KES</option>
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#888888]">AMOUNT</label>
                  <input
                    type="number"
                    value={routeAmount}
                    onChange={(e) => setRouteAmount(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-[#0c0c0c] border border-[#262626] text-xs font-mono text-[#F5F5F5]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#888888]">COUNTRY</label>
                  <select
                    value={routeCountry}
                    onChange={(e) => setRouteCountry(e.target.value)}
                    className="w-full px-2 py-1 bg-[#0c0c0c] border border-[#262626] text-xs font-mono text-[#F5F5F5]"
                  >
                    <option value="UG">UG (Uganda)</option>
                    <option value="KE">KE (Kenya)</option>
                    <option value="TZ">TZ (Tanzania)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSimulatePaymentRoute}
                disabled={simulatingRoute}
                className="w-full py-1.5 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505] transition-colors"
              >
                {simulatingRoute ? 'CALCULATING OPTIMAL RAIL...' : 'DETERMINE ROUTE & SETTLEMENT COST'}
              </button>

              {routingResult && (
                <div className="p-3 bg-[#0a0a0a] border border-[#D4AF37]/30 text-xs space-y-1">
                  <div className="font-mono text-[#D4AF37] font-semibold">
                    OPTIMAL RAIL: {routingResult.provider.providerName}
                  </div>
                  <div className="text-[11px] text-[#A0A0A0]">
                    Path: {routingResult.executionPath}
                  </div>
                  <div className="text-[11px] font-mono text-[#C0C0C0]">
                    Estimated Fee: {routeCurrency} {routingResult.estimatedFee.toLocaleString()} • Settlement: {routingResult.settlementPeriod}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Programmable Agreement Modal */}
      {isNewAgreementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border border-[#333333] bg-[#0c0c0c] w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-[#F5F5F5]">
                  Create Programmable Economic Accord
                </h3>
              </div>
              <button
                onClick={() => setIsNewAgreementModalOpen(false)}
                className="text-[#888888] hover:text-[#F5F5F5] text-xs font-mono"
              >
                CLOSE [ESC]
              </button>
            </div>

            <form onSubmit={handleCreateAgreement} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  AGREEMENT TITLE
                </label>
                <input
                  type="text"
                  value={agreementTitle}
                  onChange={(e) => setAgreementTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    TOTAL ACCORD AMOUNT
                  </label>
                  <input
                    type="number"
                    value={agreementAmount}
                    onChange={(e) => setAgreementAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    CURRENCY
                  </label>
                  <select
                    value={agreementCurrency}
                    onChange={(e) => setAgreementCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="UGX">UGX</option>
                    <option value="KES">KES</option>
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  LEGAL & OPERATIONAL TERMS
                </label>
                <textarea
                  rows={3}
                  value={agreementTerms}
                  onChange={(e) => setAgreementTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewAgreementModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-xs font-mono text-[#A0A0A0]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505]"
                >
                  EXECUTE & RECORD ACCORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Amend Agreement Modal */}
      {amendTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border border-[#333333] bg-[#0c0c0c] w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="text-sm font-mono uppercase tracking-wider text-[#F5F5F5]">Amend Agreement Terms</h3>
              <button onClick={() => setAmendTargetId(null)} className="text-[#888888] hover:text-[#F5F5F5] text-xs font-mono">
                CLOSE
              </button>
            </div>
            <form onSubmit={handleAmendAgreement} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">AMENDMENT RATIONALE</label>
                <input
                  type="text"
                  required
                  value={amendNotes}
                  onChange={(e) => setAmendNotes(e.target.value)}
                  placeholder="Describe amendment reason..."
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">UPDATED TERMS (OPTIONAL)</label>
                <textarea
                  rows={3}
                  value={amendTerms}
                  onChange={(e) => setAmendTerms(e.target.value)}
                  placeholder="Leave blank to retain current legal terms..."
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAmendTargetId(null)} className="px-3 py-1.5 border border-[#333333] text-xs font-mono text-[#A0A0A0]">
                  CANCEL
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#D4AF37] text-xs font-mono font-medium text-[#050505]">
                  RECORD AMENDMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
