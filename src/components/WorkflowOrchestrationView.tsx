/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V8.0 - Universal Economic Workflow Orchestrator & Transaction Coordination
 * Continental Economic Network & Autonomous Coordination
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  RefreshCw,
  Plus,
  DollarSign,
  Lock,
  FileText,
  Hash,
  Send,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import {
  WorkflowInstance,
  UniversalTransactionRecord,
  EconomicParticipant,
  SupportedCurrency
} from '../types';

export const WorkflowOrchestrationView: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [transactions, setTransactions] = useState<UniversalTransactionRecord[]>([]);
  const [participants, setParticipants] = useState<EconomicParticipant[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [advancing, setAdvancing] = useState<boolean>(false);

  // New Workflow Modal
  const [isNewWorkflowModalOpen, setIsNewWorkflowModalOpen] = useState<boolean>(false);
  const [wfName, setWfName] = useState<string>('Cross-Border Grain Logistics & Escrow Settlement');
  const [wfDefId, setWfDefId] = useState<string>('DEF-TRADE-FLOW-V8');
  const [wfInitiatorId, setWfInitiatorId] = useState<string>('PART-UG-MUK-002');

  // New Transaction Modal
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [txInitiatorId, setTxInitiatorId] = useState<string>('PART-UG-MUK-002');
  const [txCounterpartyId, setTxCounterpartyId] = useState<string>('PART-KE-NBO-001');
  const [txAmount, setTxAmount] = useState<number>(250000000);
  const [txCurrency, setTxCurrency] = useState<SupportedCurrency>('UGX');
  const [stageAuditNotes, setStageAuditNotes] = useState<string>('');
  const [confirmMilestoneKey, setConfirmMilestoneKey] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfList, txList, partList] = await Promise.all([
        ApiClient.getWorkflowInstances(),
        ApiClient.getCoordinatedTransactions(),
        ApiClient.getEconomicParticipants()
      ]);
      setWorkflows(wfList);
      setTransactions(txList);
      setParticipants(partList);
      if (wfList.length > 0 && !selectedWorkflowId) {
        setSelectedWorkflowId(wfList[0].id);
      }
    } catch (err) {
      console.error('Failed to load orchestration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdvance = async (action: 'ADVANCE' | 'PAUSE' | 'RESUME' | 'RETRY' | 'REJECT') => {
    if (!selectedWorkflowId) return;
    try {
      setAdvancing(true);
      await ApiClient.advanceWorkflowStage(
        selectedWorkflowId,
        action,
        'CHIEF_OPERATIONS_OFFICER',
        stageAuditNotes.trim() || `Action executed: ${action}`
      );
      setStageAuditNotes('');
      await fetchData();
    } catch (err) {
      console.error('Failed to advance workflow:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleSettleMilestone = async (txId: string, milestoneId: string) => {
    try {
      await ApiClient.settleTransactionMilestone(txId, milestoneId, 'autonomous.treasury.node');
      setConfirmMilestoneKey(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to settle milestone:', err);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    const initObj = participants.find(p => p.id === wfInitiatorId);
    try {
      await ApiClient.createWorkflowInstance({
        definitionId: wfDefId,
        workflowName: wfName,
        initiatorId: wfInitiatorId,
        initiatorName: initObj?.legalName || wfInitiatorId,
        entityId: `ENT-${Date.now()}`
      });
      setIsNewWorkflowModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to create workflow:', err);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createUniversalTransaction({
        initiatorId: txInitiatorId,
        counterpartyId: txCounterpartyId,
        totalAmount: txAmount,
        currency: txCurrency,
        functionalCurrency: txCurrency,
        executionFxRate: 1.0,
        multiRailProviders: ['PROV-BOU-RTGS', 'PROV-MTN-MOMO'],
        actor: 'commercial.controller@aros.ug'
      });
      setIsNewTxModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to create coordinated transaction:', err);
    }
  };

  const activeWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                V8.0 Universal Orchestrator
              </span>
              <span className="text-xs text-[#A0A0A0]">State Machine & Multi-Rail Settlement</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-[#F5F5F5]">
              Universal Workflow & Transaction Coordination
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
              End-to-end multi-party state machine executing commercial trade flows, milestone-based escrow locks, cross-border multi-rail liquidity releases, and cryptographic immutable audit chains.
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
              onClick={() => setIsNewWorkflowModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 border border-[#D4AF37]/40 text-xs font-mono text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              <Plus className="w-3.5 h-3.5" />
              NEW WORKFLOW
            </button>
            <button
              onClick={() => setIsNewTxModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505]"
            >
              <DollarSign className="w-3.5 h-3.5" />
              COORDINATE TRANSACTION
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Instance Inspector */}
      {activeWorkflow ? (
        <div className="border border-[#262626] bg-[#0c0c0c] p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono text-[#D4AF37]">
                  {activeWorkflow.id}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                  activeWorkflow.currentState === 'ACTIVE'
                    ? 'border border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/5'
                    : activeWorkflow.currentState === 'COMPLETED'
                    ? 'border border-[#60a5fa]/40 text-[#60a5fa] bg-[#60a5fa]/5'
                    : activeWorkflow.currentState === 'PAUSED'
                    ? 'border border-[#facc15]/40 text-[#facc15] bg-[#facc15]/5'
                    : 'border border-[#ef4444]/40 text-[#ef4444] bg-[#ef4444]/5'
                }`}>
                  {activeWorkflow.currentState}
                </span>
                <span className="text-xs text-[#888888] font-mono">
                  Stage {activeWorkflow.currentStageIndex + 1} of {activeWorkflow.stages.length}
                </span>
              </div>
              <h2 className="text-lg font-medium text-[#F5F5F5]">
                {activeWorkflow.workflowName}
              </h2>
              <div className="text-xs text-[#888888] font-mono mt-1">
                Initiated by: {activeWorkflow.initiatorName} ({activeWorkflow.initiatorId}) • Target Entity: {activeWorkflow.entityId}
              </div>
            </div>

            {/* Workflow Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={stageAuditNotes}
                onChange={(e) => setStageAuditNotes(e.target.value)}
                placeholder="Audit approval note (optional)..."
                className="px-2.5 py-1.5 bg-[#121212] border border-[#333333] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
              />
              {activeWorkflow.currentState === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => handleAdvance('ADVANCE')}
                    disabled={advancing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    APPROVE & ADVANCE STAGE
                  </button>
                  <button
                    onClick={() => handleAdvance('PAUSE')}
                    disabled={advancing}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444444] hover:border-[#facc15] text-xs font-mono text-[#facc15]"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    PAUSE
                  </button>
                  <button
                    onClick={() => handleAdvance('REJECT')}
                    disabled={advancing}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#444444] hover:border-[#ef4444] text-xs font-mono text-[#ef4444]"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    REJECT
                  </button>
                </>
              )}

              {activeWorkflow.currentState === 'PAUSED' && (
                <button
                  onClick={() => handleAdvance('RESUME')}
                  disabled={advancing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4ade80] hover:bg-[#22c55e] text-xs font-mono font-medium text-[#050505]"
                >
                  <Play className="w-3.5 h-3.5" />
                  RESUME WORKFLOW
                </button>
              )}

              {activeWorkflow.currentState === 'REJECTED' && (
                <button
                  onClick={() => handleAdvance('RETRY')}
                  disabled={advancing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f59e0b] hover:bg-[#d97706] text-xs font-mono font-medium text-[#050505]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  RETRY STAGE
                </button>
              )}
            </div>
          </div>

          {/* Workflow Stage Pipeline */}
          <div className="py-6 border-b border-[#222222]">
            <div className="text-xs font-mono text-[#888888] uppercase mb-4">
              State Machine Stage Progression
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {activeWorkflow.stages.map((stg, idx) => {
                const isCompleted = stg.status === 'COMPLETED';
                const isActive = stg.status === 'ACTIVE';
                const isFailed = stg.status === 'FAILED';

                return (
                  <div
                    key={stg.stageId}
                    className={`p-4 border ${
                      isCompleted
                        ? 'border-[#22c55e]/40 bg-[#06140b]'
                        : isActive
                        ? 'border-[#D4AF37] bg-[#1a170b]'
                        : isFailed
                        ? 'border-[#ef4444]/40 bg-[#170a0a]'
                        : 'border-[#1f1f1f] bg-[#0f0f0f]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-[#888888]">
                        STAGE {idx + 1}
                      </span>
                      <span className={`text-[10px] font-mono font-medium ${
                        isCompleted
                          ? 'text-[#4ade80]'
                          : isActive
                          ? 'text-[#D4AF37]'
                          : isFailed
                          ? 'text-[#ef4444]'
                          : 'text-[#666666]'
                      }`}>
                        {stg.status}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-[#F5F5F5] mb-2">
                      {stg.stageName}
                    </div>

                    <div className="text-[10px] font-mono text-[#888888] space-y-1">
                      <div>Req: {(stg.requiredApprovers || []).join(', ') || 'Autonomous'}</div>
                      {stg.completedAt && (
                        <div className="text-[#4ade80]">
                          Done: {new Date(stg.completedAt).toLocaleTimeString()}
                        </div>
                      )}
                      {stg.approvalNotes && (
                        <div className="text-[#A0A0A0] italic">
                          "{stg.approvalNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Audit Timeline */}
          <div className="pt-6">
            <div className="text-xs font-mono text-[#888888] uppercase mb-3">
              Immutable Stage Transition Audit Log ({activeWorkflow.timeline.length} Events)
            </div>
            <div className="space-y-2">
              {activeWorkflow.timeline.map((evt, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-[#121212] border border-[#1e1e1e] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="font-mono text-[#D4AF37]">{evt.event}</span>
                    <span className="text-[#A0A0A0]">{evt.notes}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-[#666666]">
                    <span>Actor: {evt.actor}</span>
                    <span>{new Date(evt.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-[#222222] bg-[#0c0c0c] text-xs font-mono text-[#888888]">
          NO ACTIVE WORKFLOW INSTANCES FOUND
        </div>
      )}

      {/* Universal Transaction Coordination Matrix */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-mono tracking-wider uppercase text-[#F5F5F5]">
              Universal Transaction Coordination & Multi-Rail Clearing
            </h2>
          </div>
          <span className="text-xs font-mono text-[#888888]">
            {transactions.length} Transactions Coordinated
          </span>
        </div>

        <div className="space-y-4">
          {transactions.map((tx) => {
            const settledCount = tx.milestones.filter(m => m.isSettled).length;
            const progressPercent = Math.round((settledCount / tx.milestones.length) * 100);

            return (
              <div
                key={tx.id}
                className="p-5 border border-[#222222] bg-[#121212] hover:border-[#D4AF37]/40 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#1c1c1c]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#D4AF37] font-semibold">
                        {tx.transactionReference}
                      </span>
                      <span className="text-[10px] font-mono text-[#888888]">
                        ({tx.id})
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                        tx.status === 'COMPLETED'
                          ? 'border border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/5'
                          : tx.status === 'PARTIALLY_COMPLETED'
                          ? 'border border-[#facc15]/40 text-[#facc15] bg-[#facc15]/5'
                          : 'border border-[#60a5fa]/40 text-[#60a5fa] bg-[#60a5fa]/5'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#A0A0A0] mt-1">
                      Initiator: <span className="text-[#F5F5F5]">{tx.initiatorId}</span> → Counterparty: <span className="text-[#F5F5F5]">{tx.counterpartyId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-[10px] font-mono text-[#888888]">TOTAL VALUE</div>
                      <div className="text-lg font-mono font-medium text-[#F5F5F5]">
                        {tx.currency} {tx.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-[#888888]">SETTLEMENT PROGRESS</div>
                      <div className="text-sm font-mono text-[#D4AF37]">
                        {progressPercent}% ({settledCount}/{tx.milestones.length} Milestones)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Rail Switch Badges */}
                <div className="py-3 flex flex-wrap items-center gap-2 text-xs border-b border-[#1c1c1c]">
                  <span className="text-[10px] font-mono text-[#888888]">ACTIVE RAILS:</span>
                  {tx.multiRailProviders.map((rail, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#181818] border border-[#282828] text-[10px] font-mono text-[#D4AF37]"
                    >
                      {rail}
                    </span>
                  ))}
                  {tx.workflowInstanceId && (
                    <span className="px-2 py-0.5 bg-[#181818] border border-[#282828] text-[10px] font-mono text-[#60a5fa]">
                      WF: {tx.workflowInstanceId}
                    </span>
                  )}
                </div>

                {/* Milestones Breakdown */}
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] font-mono text-[#888888] uppercase">
                    Execution Milestones & Automated Escrow Release:
                  </div>

                  {tx.milestones.map((ms) => (
                    <div
                      key={ms.milestoneId}
                      className="p-3 bg-[#0a0a0a] border border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-medium text-[#F5F5F5]">
                          [{ms.milestoneId}] {ms.description}
                        </div>
                        <div className="text-[10px] font-mono text-[#888888]">
                          Tranche Value: {tx.currency} {ms.amount.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {ms.isSettled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#4ade80] px-2.5 py-1 bg-[#4ade80]/10 border border-[#4ade80]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            SETTLED & RELEASED
                          </span>
                        ) : confirmMilestoneKey === `${tx.id}:${ms.milestoneId}` ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSettleMilestone(tx.id, ms.milestoneId)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-mono font-medium text-white"
                            >
                              CONFIRM RELEASE
                            </button>
                            <button
                              onClick={() => setConfirmMilestoneKey(null)}
                              className="px-2 py-1 border border-[#333] text-[10px] font-mono text-[#A0A0A0]"
                            >
                              CANCEL
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmMilestoneKey(`${tx.id}:${ms.milestoneId}`)}
                            className="px-3 py-1 bg-[#D4AF37] hover:bg-[#b89528] text-[10px] font-mono font-medium text-[#050505] transition-colors"
                          >
                            SETTLE MILESTONE
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audit Trail with cryptographic hash */}
                <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex items-center justify-between text-[10px] font-mono text-[#666666]">
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#D4AF37]" />
                    <span>Cryptographic Ledger Hash: {tx.auditTrail[0]?.hash || 'sha256_verified'}</span>
                  </div>
                  <div>
                    Last updated: {new Date(tx.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Workflow Modal */}
      {isNewWorkflowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border border-[#333333] bg-[#0c0c0c] w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-[#F5F5F5]">
                  Initiate Multi-Party Workflow
                </h3>
              </div>
              <button
                onClick={() => setIsNewWorkflowModalOpen(false)}
                className="text-[#888888] hover:text-[#F5F5F5] text-xs font-mono"
              >
                CLOSE [ESC]
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  WORKFLOW TITLE
                </label>
                <input
                  type="text"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  WORKFLOW DEFINITION BLUEPRINT
                </label>
                <select
                  value={wfDefId}
                  onChange={(e) => setWfDefId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="DEF-TRADE-FLOW-V8">DEF-TRADE-FLOW-V8 (Cross-Border Escrow & Customs)</option>
                  <option value="DEF-INDUSTRIAL-PROCURE-V8">DEF-INDUSTRIAL-PROCURE-V8 (Biomass Feedstock Offtake)</option>
                  <option value="DEF-CORRIDOR-LOGISTICS-V8">DEF-CORRIDOR-LOGISTICS-V8 (Transit Inspection & Settle)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  INITIATOR PARTICIPANT
                </label>
                <select
                  value={wfInitiatorId}
                  onChange={(e) => setWfInitiatorId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.legalName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewWorkflowModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-xs font-mono text-[#A0A0A0]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505]"
                >
                  INSTANTIATE WORKFLOW
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Coordinated Transaction Modal */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border border-[#333333] bg-[#0c0c0c] w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-[#F5F5F5]">
                  Coordinate Multi-Rail Transaction
                </h3>
              </div>
              <button
                onClick={() => setIsNewTxModalOpen(false)}
                className="text-[#888888] hover:text-[#F5F5F5] text-xs font-mono"
              >
                CLOSE [ESC]
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  PAYER / INITIATOR
                </label>
                <select
                  value={txInitiatorId}
                  onChange={(e) => setTxInitiatorId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.legalName} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  BENEFICIARY / COUNTERPARTY
                </label>
                <select
                  value={txCounterpartyId}
                  onChange={(e) => setTxCounterpartyId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.legalName} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    TOTAL AMOUNT
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    CURRENCY
                  </label>
                  <select
                    value={txCurrency}
                    onChange={(e) => setTxCurrency(e.target.value as SupportedCurrency)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="UGX">UGX</option>
                    <option value="KES">KES</option>
                    <option value="TZS">TZS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-xs font-mono text-[#A0A0A0]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505]"
                >
                  DISPATCH TRANSACTION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
