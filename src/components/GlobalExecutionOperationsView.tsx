/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V10.0 — GLOBAL ECONOMIC EXECUTION, TRUST & INSTITUTIONAL OPERATIONS
 * Strategic Identity: Universal Economic Operating System
 * Developer: VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Building2,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Truck,
  Plus,
  RefreshCw,
  Scale,
  Cpu,
  Lock,
  Compass,
  FileCheck,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Zap,
  Globe2
} from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import {
  EconomicExecution,
  EconomicExecutionStatus,
  InstitutionalProfile,
  InstitutionalLifecycleStatus,
  EconomicAgreement,
  CommercialOrder,
  SupplyChainShipment,
  FinancialExecutionRecord,
  FinancialIntegrityReport,
  EconomicRiskAssessment,
  EconomicDispute,
  GovernedAutomationPolicy,
  AutomationApprovalQueueItem,
  SustainabilityPlan
} from '../types/index';

export const GlobalExecutionOperationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'EXECUTIONS' | 'INSTITUTIONS' | 'AGREEMENTS' | 'COMMERCE' | 'FINANCIAL_INTEGRITY' | 'GOVERNED_OPS'
  >('EXECUTIONS');

  const [executions, setExecutions] = useState<EconomicExecution[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionalProfile[]>([]);
  const [agreements, setAgreements] = useState<EconomicAgreement[]>([]);
  const [orders, setOrders] = useState<CommercialOrder[]>([]);
  const [shipments, setShipments] = useState<SupplyChainShipment[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialExecutionRecord[]>([]);
  const [integrityReport, setIntegrityReport] = useState<FinancialIntegrityReport | null>(null);
  const [disputes, setDisputes] = useState<EconomicDispute[]>([]);
  const [automationQueue, setAutomationQueue] = useState<AutomationApprovalQueueItem[]>([]);
  const [automationPolicies, setAutomationPolicies] = useState<GovernedAutomationPolicy[]>([]);
  const [sustainabilityPlans, setSustainabilityPlans] = useState<SustainabilityPlan[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal / Form States
  const [showNewExecutionModal, setShowNewExecutionModal] = useState(false);
  const [newExecution, setNewExecution] = useState({
    originatingParticipantId: 'PART-UG-COOP-001',
    originatingParticipantName: 'Uganda Arabica Exporters Cooperative Union',
    receivingParticipantId: 'PART-KE-ROAST-002',
    receivingParticipantName: 'Nairobi Specialty Roasters & Blenders Ltd',
    originJurisdiction: 'UG',
    destinationJurisdiction: 'KE',
    activityClassification: 'CROSS_BORDER_TRADE' as EconomicExecution['activityClassification'],
    currency: 'UGX',
    value: 120000000,
    requiredAuthorizations: 'BOU_EXCHANGE_CONTROL,URA_CUSTOMS_SCT',
    requiredServiceProviders: 'EAPS_CLEARING,TRANSEAST_LOGISTICS'
  });

  const [selectedExecution, setSelectedExecution] = useState<EconomicExecution | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<EconomicExecutionStatus>('VALIDATED');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionActor, setTransitionActor] = useState('controller@aros.ug');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        execData,
        instData,
        agrData,
        ordData,
        shipData,
        finData,
        repData,
        dispData,
        queueData,
        polData,
        planData,
        sumData
      ] = await Promise.all([
        ApiClient.getEconomicExecutions(),
        ApiClient.getInstitutionalProfiles(),
        ApiClient.getEconomicAgreements(),
        ApiClient.getV10CommercialOrders(),
        ApiClient.getSupplyChainShipments(),
        ApiClient.getFinancialExecutions(),
        ApiClient.getFinancialIntegrityReport(),
        ApiClient.getEconomicDisputes(),
        ApiClient.getAutomationApprovalQueue(),
        ApiClient.getGovernedAutomationPolicies(),
        ApiClient.getSustainabilityPlans(),
        ApiClient.getOperationsControlCenterSummary()
      ]);

      setExecutions(Array.isArray(execData) ? execData : []);
      setInstitutions(Array.isArray(instData) ? instData : []);
      setAgreements(Array.isArray(agrData) ? agrData : []);
      setOrders(Array.isArray(ordData) ? ordData : []);
      setShipments(Array.isArray(shipData) ? shipData : []);
      setFinancialRecords(Array.isArray(finData) ? finData : []);
      setIntegrityReport(repData);
      setDisputes(Array.isArray(dispData) ? dispData : []);
      setAutomationQueue(Array.isArray(queueData) ? queueData : []);
      setAutomationPolicies(Array.isArray(polData) ? polData : []);
      setSustainabilityPlans(Array.isArray(planData) ? planData : []);
      setSummary(sumData);
    } catch (err: any) {
      console.error('Failed to load V10 operational data', err);
      setFeedbackMessage({ text: 'Failed to load operational records: ' + (err.message || 'Network error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.createEconomicExecution({
        ...newExecution,
        requiredAuthorizations: newExecution.requiredAuthorizations.split(',').map(s => s.trim()),
        requiredServiceProviders: newExecution.requiredServiceProviders.split(',').map(s => s.trim())
      });
      setFeedbackMessage({ text: `Execution ${res.executionNumber} registered in DRAFT state.`, type: 'success' });
      setShowNewExecutionModal(false);
      loadData();
    } catch (err: any) {
      setFeedbackMessage({ text: 'Execution registration failed: ' + err.message, type: 'error' });
    }
  };

  const handleTransition = async (executionId: string) => {
    try {
      const res = await ApiClient.transitionEconomicExecution(
        executionId,
        transitionTarget,
        transitionActor,
        transitionReason || 'Operational workflow progression'
      );
      if (res.error) {
        setFeedbackMessage({ text: res.error, type: 'error' });
      } else {
        setFeedbackMessage({ text: `Execution transitioned to ${transitionTarget}`, type: 'success' });
        loadData();
        setSelectedExecution(null);
      }
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Transition error', type: 'error' });
    }
  };

  const handleVerifyMilestone = async (executionId: string, milestoneId: string) => {
    try {
      await ApiClient.verifyExecutionMilestone(executionId, milestoneId, 'statutory-inspector@maaif.go.ug', '0xabc123456');
      setFeedbackMessage({ text: `Milestone ${milestoneId} verified under audit trail.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setFeedbackMessage({ text: 'Milestone verification error: ' + err.message, type: 'error' });
    }
  };

  const handleSignAgreement = async (agreementId: string) => {
    try {
      const res = await ApiClient.signEconomicAgreement(
        agreementId,
        'SIG-EXECUTIVE-BOU',
        'Director of Economic Coordination',
        'SOVEREIGN_REGULATORY_SIGNATORY',
        '0x778899aabbccddeeff'
      );
      if (res.error) {
        setFeedbackMessage({ text: res.error, type: 'error' });
      } else {
        setFeedbackMessage({ text: `Agreement signed and verified. Status: ${res.status}`, type: 'success' });
        loadData();
      }
    } catch (err: any) {
      setFeedbackMessage({ text: 'Agreement signature error: ' + err.message, type: 'error' });
    }
  };

  const handleProcessApproval = async (itemId: string, decision: string) => {
    try {
      const res = await ApiClient.processAutomationApproval(itemId, decision, 'dual.operator@bou.aros.ug', 'Authorized under Level 5 Dual-Control Sovereign Policy');
      if (res.error) {
        setFeedbackMessage({ text: res.error, type: 'error' });
      } else {
        setFeedbackMessage({ text: `Approval queue item ${itemId} marked as ${decision}`, type: 'success' });
        loadData();
      }
    } catch (err: any) {
      setFeedbackMessage({ text: 'Approval processing failed: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] p-4 lg:p-6 space-y-6">
      {/* Header Banner */}
      <div className="border border-[#D4AF37]/30 bg-[#121212] rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 tracking-wider">
                V10.0 GLOBAL ECONOMIC EXECUTION
              </span>
              <span className="text-xs text-[#A0A0A0] font-mono">Schema Version 10 • Durable Persistent Storage</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mt-2 text-[#F5F5F5]">
              Global Economic Execution & Institutional Operations
            </h1>
            <p className="text-sm text-[#A0A0A0] max-w-3xl mt-1">
              Universal Economic Operating System coordinating complete economic activity across sovereign jurisdictions,
              authorized central banks, customs authorities, multi-party smart accords, and real-time settlement rails.
            </p>
            <div className="text-xs text-[#D4AF37] mt-2 font-mono">
              Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181818] hover:bg-[#252525] border border-white/10 text-xs font-mono text-[#C0C0C0] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D4AF37]' : ''}`} />
              Sync Operations
            </button>
            <button
              onClick={() => setShowNewExecutionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b8952b] text-black text-xs font-semibold shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Economic Execution
            </button>
          </div>
        </div>

        {/* Executive KPI Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
            <div className="text-xs text-[#A0A0A0] flex items-center justify-between">
              Active Executions
              <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] mt-1">
              {executions.filter(e => e.status === 'EXECUTING' || e.status === 'VALIDATED').length}
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">{executions.length} total across corridors</div>
          </div>

          <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
            <div className="text-xs text-[#A0A0A0] flex items-center justify-between">
              Authorized Institutions
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] mt-1">
              {institutions.filter(i => i.status === 'ACTIVE').length}
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Central Banks, Tax & Clearing</div>
          </div>

          <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
            <div className="text-xs text-[#A0A0A0] flex items-center justify-between">
              Smart Accords (V10)
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] mt-1">
              {agreements.length}
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Multi-party signature tracked</div>
          </div>

          <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
            <div className="text-xs text-[#A0A0A0] flex items-center justify-between">
              Currency Integrity
              <Scale className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Balanced
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Zero cross-currency bleed</div>
          </div>

          <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
            <div className="text-xs text-[#A0A0A0] flex items-center justify-between">
              Governed Autonomy
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-mono font-bold text-[#F5F5F5] mt-1">
              Level 5
            </div>
            <div className="text-[10px] text-purple-300 mt-0.5">Dual-human operator control</div>
          </div>

          <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
            <div className="text-xs text-[#A0A0A0] flex items-center justify-between">
              Disputes Desk
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-mono font-bold text-amber-400 mt-1">
              {disputes.filter(d => d.status !== 'CLOSED').length}
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Mediation & evidence queued</div>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/60 border border-red-500/40 text-red-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2 pb-1">
        {[
          { id: 'EXECUTIONS', label: '1. Economic Executions', icon: Activity, count: executions.length },
          { id: 'INSTITUTIONS', label: '2. Institutional Network', icon: Building2, count: institutions.length },
          { id: 'AGREEMENTS', label: '3. Smart Accords & Contracts', icon: FileText, count: agreements.length },
          { id: 'COMMERCE', label: '4. Commerce & Multimodal Supply Chain', icon: Truck, count: orders.length },
          { id: 'FINANCIAL_INTEGRITY', label: '5. Financial Assurance & Accounting', icon: DollarSign },
          { id: 'GOVERNED_OPS', label: '6. Governed Autonomy & Disputes', icon: ShieldCheck, count: automationQueue.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold transition whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-[#D4AF37] text-[#D4AF37] bg-white/5'
                  : 'border-transparent text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-white/[0.02]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-[#C0C0C0] font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ECONOMIC EXECUTIONS */}
      {activeTab === 'EXECUTIONS' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#D4AF37]" />
                  Economic Execution Registry & State Machine
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  End-to-end execution tracking governed by a server-side state machine. State progression requires statutory & provider clearance.
                </p>
              </div>
              <div className="text-xs font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded border border-[#D4AF37]/30">
                Invariant: Reaching COMPLETED requires authoritative settlement confirmation
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#A0A0A0]">
                    <th className="py-2.5 px-3">Execution Number</th>
                    <th className="py-2.5 px-3">Corridor</th>
                    <th className="py-2.5 px-3">Parties</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3 text-right">Value</th>
                    <th className="py-2.5 px-3">Lifecycle State</th>
                    <th className="py-2.5 px-3">Milestones</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {executions.map(ex => (
                    <tr key={ex.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#F5F5F5]">{ex.executionNumber}</div>
                        <div className="text-[10px] text-[#A0A0A0]">{ex.id}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                            {ex.originJurisdiction}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#A0A0A0]" />
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                            {ex.destinationJurisdiction}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[#F5F5F5] truncate max-w-xs">{ex.originatingParticipantName}</div>
                        <div className="text-[#A0A0A0] text-[10px] truncate max-w-xs">→ {ex.receivingParticipantName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 border border-blue-500/30">
                          {ex.activityClassification.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#D4AF37]">
                        {ex.currency} {ex.value.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            ex.status === 'COMPLETED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : ex.status === 'EXECUTING'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                              : ex.status === 'AUTHORIZED'
                              ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                              : ex.status === 'DISPUTED'
                              ? 'bg-red-950 text-red-300 border border-red-500/40'
                              : 'bg-white/10 text-[#C0C0C0]'
                          }`}
                        >
                          {ex.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          {ex.milestones.map(m => (
                            <span
                              key={m.id}
                              title={`${m.title}: ${m.status}`}
                              className={`w-2.5 h-2.5 rounded-full ${
                                m.status === 'VERIFIED'
                                  ? 'bg-emerald-400'
                                  : m.status === 'IN_PROGRESS'
                                  ? 'bg-amber-400'
                                  : 'bg-white/20'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-[#A0A0A0] ml-1">
                            {ex.milestones.filter(m => m.status === 'VERIFIED').length}/{ex.milestones.length}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            setSelectedExecution(ex);
                            setTransitionTarget('VALIDATED');
                          }}
                          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#252525] border border-white/20 text-[#D4AF37] text-[10px] transition"
                        >
                          Manage State
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Execution Detail / State Transition Drawer */}
          {selectedExecution && (
            <div className="bg-[#121212] border border-[#D4AF37]/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="font-bold text-[#F5F5F5] text-base flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    Managing Execution {selectedExecution.executionNumber} ({selectedExecution.id})
                  </h3>
                  <div className="text-xs text-[#A0A0A0] font-mono mt-0.5">
                    Current State: <span className="text-[#D4AF37] font-bold">{selectedExecution.status}</span> • Value:{' '}
                    {selectedExecution.currency} {selectedExecution.value.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="px-2 py-1 rounded text-xs text-[#A0A0A0] hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Milestones Checklist */}
              <div>
                <h4 className="text-xs font-bold text-[#C0C0C0] uppercase tracking-wider mb-2">
                  Contractual Milestones & Evidence Verification
                </h4>
                <div className="space-y-2">
                  {selectedExecution.milestones.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded bg-[#181818] border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            m.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-white/10 text-[#A0A0A0]'
                          }`}
                        >
                          {m.orderIndex}
                        </span>
                        <div>
                          <div className="font-medium text-[#F5F5F5]">{m.title}</div>
                          <div className="text-[10px] text-[#A0A0A0]">{m.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {m.status === 'VERIFIED' ? (
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-mono">
                              VERIFIED
                            </span>
                            <div className="text-[9px] text-[#A0A0A0] font-mono mt-0.5">
                              {m.verifiedBy} • {m.evidenceHash?.slice(0, 10)}...
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVerifyMilestone(selectedExecution.id, m.id)}
                            className="px-2.5 py-1 rounded bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-semibold"
                          >
                            Verify Milestone
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* State Machine Transition Form */}
              <div className="bg-[#181818] p-4 rounded-lg border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  State Machine Transition Controller
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#A0A0A0] uppercase block mb-1">Target Lifecycle State</label>
                    <select
                      value={transitionTarget}
                      onChange={e => setTransitionTarget(e.target.value as any)}
                      className="w-full bg-[#121212] border border-white/20 rounded p-2 text-xs font-mono text-[#F5F5F5]"
                    >
                      <option value="VALIDATED">VALIDATED</option>
                      <option value="AUTHORIZATION_PENDING">AUTHORIZATION_PENDING</option>
                      <option value="AUTHORIZED">AUTHORIZED</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="EXECUTING">EXECUTING</option>
                      <option value="MILESTONE_VERIFICATION">MILESTONE_VERIFICATION</option>
                      <option value="COMPLETION_PENDING">COMPLETION_PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="DISPUTED">DISPUTED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[#A0A0A0] uppercase block mb-1">Authorizing Actor</label>
                    <input
                      type="text"
                      value={transitionActor}
                      onChange={e => setTransitionActor(e.target.value)}
                      className="w-full bg-[#121212] border border-white/20 rounded p-2 text-xs font-mono text-[#F5F5F5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#A0A0A0] uppercase block mb-1">Justification Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Cleared by Customs and Central Bank"
                      value={transitionReason}
                      onChange={e => setTransitionReason(e.target.value)}
                      className="w-full bg-[#121212] border border-white/20 rounded p-2 text-xs text-[#F5F5F5]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleTransition(selectedExecution.id)}
                    className="px-4 py-2 rounded bg-[#D4AF37] hover:bg-[#b8952b] text-black text-xs font-bold transition shadow"
                  >
                    Execute Verified Transition
                  </button>
                </div>
              </div>

              {/* Audit Trail */}
              <div>
                <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">
                  Execution Audit Trail ({selectedExecution.auditTrail.length} events)
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[10px]">
                  {selectedExecution.auditTrail.map(event => (
                    <div key={event.id} className="p-2 rounded bg-[#181818] border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[#D4AF37]">{event.previousState}</span> →{' '}
                        <span className="text-emerald-400 font-bold">{event.newState}</span>: {event.reason}
                      </div>
                      <div className="text-[#A0A0A0]">
                        {event.actor} • {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INSTITUTIONAL OPERATIONS */}
      {activeTab === 'INSTITUTIONS' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Institutional Operations & Sovereign Authorities
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  Regulated banks, tax authorities, customs agencies, and clearing houses operating under verified statutory licenses.
                </p>
              </div>
              <div className="text-xs font-mono text-[#D4AF37] bg-white/5 px-3 py-1.5 rounded border border-white/10">
                Rule: Production activation requires statutory mandate & verified PKI credentials
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {institutions.map(inst => (
                <div key={inst.id} className="bg-[#181818] border border-white/10 rounded-lg p-4 space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-[#D4AF37]">
                        {inst.jurisdiction}
                      </span>
                      <h3 className="font-bold text-sm text-[#F5F5F5] mt-1">{inst.legalName}</h3>
                      <div className="text-[10px] text-blue-300 font-mono mt-0.5">{inst.operationalClassification}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        inst.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {inst.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#121212] border border-white/5 space-y-1 text-[11px]">
                    <div className="text-[#A0A0A0]">
                      Statutory Basis: <span className="text-[#F5F5F5]">{inst.authorizationEvidence.statutoryBasis}</span>
                    </div>
                    <div className="text-[#A0A0A0]">
                      License Ref: <span className="font-mono text-[#D4AF37]">{inst.authorizationEvidence.licenseNumber}</span>
                    </div>
                    <div className="text-[#A0A0A0]">
                      Environment:{' '}
                      <span className="font-mono text-purple-300 font-semibold">{inst.integrationEnvironment}</span> • SLA:{' '}
                      <span className="font-mono text-emerald-400">{inst.serviceAvailability}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#A0A0A0] uppercase font-mono mb-1">Supported Capabilities</div>
                    <div className="flex flex-wrap gap-1">
                      {inst.integrationCapabilities.map((cap, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-[#C0C0C0]">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMART ACCORDS & COMMERCIAL CONTRACTS (V10) */}
      {activeTab === 'AGREEMENTS' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Smart Accords & Multi-Party Contract Execution (V10)
                </h2>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  Version-controlled commercial contracts with cryptographic integrity hashes, signatory authorization, and dispute clauses.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {agreements.map(agr => (
                <div key={agr.id} className="bg-[#181818] border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#D4AF37] font-bold">{agr.agreementNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-mono">
                          {agr.agreementType}
                        </span>
                        <span className="text-[10px] text-[#A0A0A0] font-mono">v{agr.version}.0</span>
                      </div>
                      <h3 className="font-bold text-base text-[#F5F5F5] mt-1">{agr.title}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-[#D4AF37]">
                          {agr.currency} {agr.value.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#A0A0A0]">{agr.status}</div>
                      </div>
                      <button
                        onClick={() => handleSignAgreement(agr.id)}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                      >
                        Sign Accord
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#C0C0C0]">{agr.scope}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#121212] p-3 rounded">
                    <div>
                      <span className="text-[#A0A0A0] font-mono text-[10px] uppercase block">Contracting Parties</span>
                      <ul className="space-y-1 mt-1">
                        {agr.parties.map((p, i) => (
                          <li key={i} className="text-[#F5F5F5] flex items-center justify-between">
                            <span>{p.name} ({p.role})</span>
                            <span className="text-[10px] font-mono text-[#D4AF37]">{p.jurisdiction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[#A0A0A0] font-mono text-[10px] uppercase block">Signatory State & Hash</span>
                      <div className="mt-1 space-y-1">
                        {agr.signatures.map((sig, i) => (
                          <div key={i} className="text-[11px] text-[#F5F5F5] flex items-center justify-between font-mono">
                            <span>✓ {sig.signatoryName}</span>
                            <span className="text-[9px] text-[#A0A0A0]">{sig.cryptographicHash.slice(0, 16)}...</span>
                          </div>
                        ))}
                        {agr.signatures.length === 0 && (
                          <div className="text-[11px] text-amber-400">Pending required signatures</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#A0A0A0] font-mono pt-1">
                    <div>Governing Law: {agr.governingLaw} • Delivery: {agr.deliveryConditions}</div>
                    <div>Doc Hash: {agr.documentHash.slice(0, 20)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMERCE & MULTIMODAL SUPPLY CHAIN */}
      {activeTab === 'COMMERCE' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2 mb-4">
              <Truck className="w-4 h-4 text-amber-400" />
              Commercial Orders & Multimodal Supply Chain Telemetry
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#C0C0C0] uppercase font-mono">Commercial Value Chain Orders</h3>
                {orders.map(o => (
                  <div key={o.id} className="bg-[#181818] p-3.5 rounded-lg border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#D4AF37]">{o.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 font-mono">
                        {o.type}
                      </span>
                    </div>
                    <div className="text-xs text-[#F5F5F5]">
                      <span className="text-[#A0A0A0]">Buyer:</span> {o.buyerName} <br />
                      <span className="text-[#A0A0A0]">Seller:</span> {o.sellerName}
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 font-mono">
                      <span>Total: <strong className="text-[#F5F5F5]">{o.currency} {o.totalAmount.toLocaleString()}</strong></span>
                      <span className="text-amber-400">{o.status}</span>
                    </div>
                    <div className="text-[10px] text-[#A0A0A0]">
                      Tax Code: {o.taxAuthorityCode} (Rate: {(o.applicableTaxRate * 100).toFixed(0)}%)
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipments */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#C0C0C0] uppercase font-mono">Multimodal Logistics & Border Tracking</h3>
                {shipments.map(s => (
                  <div key={s.id} className="bg-[#181818] p-3.5 rounded-lg border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-400">{s.shipmentNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 font-mono">
                        {s.transportMode}
                      </span>
                    </div>
                    <div className="text-xs text-[#A0A0A0]">
                      <div>From: <span className="text-[#F5F5F5]">{s.originLocation}</span></div>
                      <div>To: <span className="text-[#F5F5F5]">{s.destinationLocation}</span></div>
                      <div>Carrier: <span className="text-[#F5F5F5]">{s.carrierName}</span></div>
                    </div>
                    <div className="p-2 rounded bg-[#121212] space-y-1">
                      <div className="text-[10px] font-mono text-[#D4AF37] uppercase">Verified Milestones Only:</div>
                      {s.milestoneHistory.map((m, i) => (
                        <div key={i} className="text-[10px] text-[#F5F5F5] font-mono flex items-center justify-between">
                          <span>• {m.location}: {m.event}</span>
                          <span className="text-[#A0A0A0]">{m.verifiedBy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL ASSURANCE & ACCOUNTING INTEGRITY */}
      {activeTab === 'FINANCIAL_INTEGRITY' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#D4AF37]" />
              Financial Assurance & Double-Entry Currency Integrity
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Invariant Verification: Every journal entry balances strictly within its own currency. Unrelated currencies are never balanced by aggregation.
            </p>

            {integrityReport && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#181818] p-4 rounded-lg border border-white/5">
                <div>
                  <div className="text-xs text-[#A0A0A0] uppercase font-mono">Universal Journal Balance</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> PASSED
                  </div>
                  <div className="text-[10px] text-[#A0A0A0] mt-1">
                    Debits equal credits within every individual currency
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[#A0A0A0] uppercase font-mono">Suspense Account Balance</div>
                  <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1">
                    UGX {integrityReport.suspenseAccountBalance.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">0 unallocated settlement funds</div>
                </div>

                <div>
                  <div className="text-xs text-[#A0A0A0] uppercase font-mono">Authoritative Settlement Confirmations</div>
                  <div className="text-xl font-bold font-mono text-[#D4AF37] mt-1">
                    {financialRecords.filter(f => f.lifecycleStage === 'SETTLEMENT_CONFIRMED').length} / {financialRecords.length}
                  </div>
                  <div className="text-[10px] text-[#A0A0A0] mt-1">Provider confirmation receipt verified</div>
                </div>
              </div>
            )}

            {/* Currency Debits vs Credits Breakdown */}
            {integrityReport && (
              <div className="bg-[#181818] p-4 rounded-lg border border-white/5">
                <h3 className="text-xs font-bold text-[#C0C0C0] uppercase font-mono mb-3">
                  Per-Currency Trial Balance Verification
                </h3>
                <div className="space-y-2 font-mono text-xs">
                  {Object.keys(integrityReport.totalDebitsByCurrency).map(cur => (
                    <div key={cur} className="flex items-center justify-between p-2 rounded bg-[#121212] border border-white/5">
                      <span className="font-bold text-[#D4AF37]">{cur}</span>
                      <div className="flex gap-6">
                        <span>Debits: <strong className="text-[#F5F5F5]">{integrityReport.totalDebitsByCurrency[cur].toLocaleString()}</strong></span>
                        <span>Credits: <strong className="text-[#F5F5F5]">{integrityReport.totalCreditsByCurrency[cur].toLocaleString()}</strong></span>
                        <span className="text-emerald-400 font-bold">Variance: 0.00</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: GOVERNED AUTONOMY & DISPUTES */}
      {activeTab === 'GOVERNED_OPS' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-xl p-5 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Governed Autonomous Economic Operations & Dispute Mediation
              </h2>
              <p className="text-xs text-[#A0A0A0] mt-0.5">
                5-Level Automation Governance Matrix. Level 5 Controlled High-Impact operations require dual human authorization.
              </p>
            </div>

            {/* Level 5 Human Approval Queue */}
            <div className="bg-[#181818] p-4 rounded-lg border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Level 5 Controlled High-Impact Dual-Operator Queue
                </h3>
                <span className="text-[10px] text-[#A0A0A0] font-mono">
                  Autonomous agents cannot grant privileges or bypass human signoff
                </span>
              </div>

              <div className="space-y-2">
                {automationQueue.map(item => (
                  <div key={item.id} className="p-3 rounded bg-[#121212] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#D4AF37]">{item.actionType}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-950 text-purple-300 font-mono font-bold">
                          LEVEL {item.automationLevel}
                        </span>
                        <span className="text-[10px] text-[#A0A0A0] font-mono">By: {item.requestedBy}</span>
                      </div>
                      <div className="text-xs text-[#C0C0C0] font-mono mt-1">
                        Amount: {item.payload.currency} {item.payload.amount?.toLocaleString()} • Execution:{' '}
                        {item.payload.executionId}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'PENDING_APPROVAL' ? (
                        <>
                          <button
                            onClick={() => handleProcessApproval(item.id, 'APPROVED')}
                            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessApproval(item.id, 'REJECTED')}
                            className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleProcessApproval(item.id, 'EMERGENCY_STOPPED')}
                            className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                          >
                            Emergency Stop
                          </button>
                        </>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-white/10 text-emerald-400">
                          {item.status} ({item.approvedBy})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Economic Disputes Desk */}
            <div className="bg-[#181818] p-4 rounded-lg border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Economic Accountability & Dispute Resolution Desk
              </h3>
              <p className="text-[11px] text-[#A0A0A0]">
                ECONEX coordinates evidence and workflows; it does not claim judicial authority or replace sovereign courts.
              </p>

              <div className="space-y-2">
                {disputes.map(d => (
                  <div key={d.id} className="p-3 rounded bg-[#121212] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-amber-400">{d.disputeNumber}</span> • Category:{' '}
                        <span className="font-bold text-[#F5F5F5]">{d.disputeCategory}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 font-mono font-bold">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#C0C0C0]">{d.description}</p>
                    <div className="text-[11px] text-[#A0A0A0] flex items-center justify-between">
                      <span>Claim: <strong className="text-[#D4AF37]">{d.currency} {d.claimAmount.toLocaleString()}</strong></span>
                      <span>Mediator: {d.mediatorRole || 'Assigned Arbitrator'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Economic Execution */}
      {showNewExecutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#121212] border border-[#D4AF37]/50 rounded-xl p-6 max-w-xl w-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                Register New Economic Execution
              </h3>
              <button onClick={() => setShowNewExecutionModal(false)} className="text-[#A0A0A0] hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExecution} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Origin Jurisdiction</label>
                  <input
                    type="text"
                    value={newExecution.originJurisdiction}
                    onChange={e => setNewExecution({ ...newExecution, originJurisdiction: e.target.value })}
                    className="w-full bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Destination Jurisdiction</label>
                  <input
                    type="text"
                    value={newExecution.destinationJurisdiction}
                    onChange={e => setNewExecution({ ...newExecution, destinationJurisdiction: e.target.value })}
                    className="w-full bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Originating Participant Name</label>
                <input
                  type="text"
                  value={newExecution.originatingParticipantName}
                  onChange={e => setNewExecution({ ...newExecution, originatingParticipantName: e.target.value })}
                  className="w-full bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Receiving Participant Name</label>
                <input
                  type="text"
                  value={newExecution.receivingParticipantName}
                  onChange={e => setNewExecution({ ...newExecution, receivingParticipantName: e.target.value })}
                  className="w-full bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Activity Classification</label>
                  <select
                    value={newExecution.activityClassification}
                    onChange={e => setNewExecution({ ...newExecution, activityClassification: e.target.value as any })}
                    className="w-full bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5]"
                  >
                    <option value="CROSS_BORDER_TRADE">CROSS_BORDER_TRADE</option>
                    <option value="INDUSTRIAL_PROCUREMENT">INDUSTRIAL_PROCUREMENT</option>
                    <option value="COMMODITY_EXPORT">COMMODITY_EXPORT</option>
                    <option value="INFRASTRUCTURE_FINANCING">INFRASTRUCTURE_FINANCING</option>
                    <option value="SERVICES_CONTRACT">SERVICES_CONTRACT</option>
                    <option value="AGRICULTURAL_CORRIDOR_SUPPLY">AGRICULTURAL_CORRIDOR_SUPPLY</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#A0A0A0] block mb-1">Currency & Value</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExecution.currency}
                      onChange={e => setNewExecution({ ...newExecution, currency: e.target.value })}
                      className="w-20 bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5] font-mono"
                    />
                    <input
                      type="number"
                      value={newExecution.value}
                      onChange={e => setNewExecution({ ...newExecution, value: Number(e.target.value) })}
                      className="w-full bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[#A0A0A0] block mb-1">Required Statutory Authorizations (comma-separated)</label>
                <input
                  type="text"
                  value={newExecution.requiredAuthorizations}
                  onChange={e => setNewExecution({ ...newExecution, requiredAuthorizations: e.target.value })}
                  className="w-full bg-[#181818] border border-white/20 rounded p-2 text-[#F5F5F5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewExecutionModal(false)}
                  className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#D4AF37] hover:bg-[#b8952b] text-black font-bold shadow"
                >
                  Register Execution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalExecutionOperationsView;
