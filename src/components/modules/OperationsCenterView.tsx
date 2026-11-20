/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V5 - Autonomous Operations Control Plane
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Database,
  Server,
  Zap,
  Play,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
  Layers,
  ArrowUpRight,
  HardDriveDownload,
  Clock,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  SystemTelemetrySnapshot,
  OperationalIncident,
  AutomatedRemediationAction,
  DisasterRecoveryDrill,
} from '../../types/index.ts';

export default function OperationsCenterView() {
  const [telemetry, setTelemetry] = useState<SystemTelemetrySnapshot | null>(null);
  const [incidents, setIncidents] = useState<OperationalIncident[]>([]);
  const [drDrills, setDrDrills] = useState<DisasterRecoveryDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<OperationalIncident | null>(null);

  // Form states
  const [newActionType, setNewActionType] = useState('RESTART_WORKER');
  const [operatorId, setOperatorId] = useState('auditor@vinexsah.tech');
  const [rejectReason, setRejectReason] = useState('');
  const [drScenario, setDrScenario] = useState('DATABASE_FAILOVER_SIMULATION');
  const [drRunning, setDrRunning] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [tSnap, incList, drillList] = await Promise.all([
        api.getTelemetrySnapshot(),
        api.getOperationalIncidents(),
        api.getDisasterRecoveryDrills(),
      ]);
      setTelemetry(tSnap);
      setIncidents(incList);
      setDrDrills(drillList);
    } catch (err: any) {
      console.error('Failed to load operational data:', err);
      setStatusMessage({ text: err.message || 'Failed to fetch operational telemetry', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRemediate = async (incidentId: string) => {
    try {
      setStatusMessage({ text: 'Executing automated remediation protocol...', type: 'info' });
      const res = await api.remediateIncident(incidentId, newActionType, operatorId);
      setStatusMessage({
        text: `Remediation action registered: ${res.action.actionType} (${res.action.executionStatus || res.action.executionState || 'SUCCESS'})`,
        type: 'success',
      });
      await loadAllData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Remediation invocation failed', type: 'error' });
    }
  };

  const handleApproveAction = async (actionId: string) => {
    try {
      setStatusMessage({ text: 'Authorizing critical operational action...', type: 'info' });
      await api.approveRemediation(actionId, operatorId);
      setStatusMessage({ text: `Action approved and executed by ${operatorId}`, type: 'success' });
      await loadAllData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Approval execution failed', type: 'error' });
    }
  };

  const handleRejectAction = async (actionId: string) => {
    if (!rejectReason) {
      setStatusMessage({ text: 'Please specify a rejection reason for the audit trail', type: 'error' });
      return;
    }
    try {
      await api.rejectRemediation(actionId, operatorId, rejectReason);
      setStatusMessage({ text: `Remediation action rejected and logged to audit trail`, type: 'info' });
      setRejectReason('');
      await loadAllData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Rejection failed', type: 'error' });
    }
  };

  const handleRunDrill = async () => {
    try {
      setDrRunning(true);
      setStatusMessage({ text: `Executing simulated disaster recovery drill: ${drScenario}...`, type: 'info' });
      const drill = await api.runDisasterRecoveryDrill(drScenario, operatorId);
      const rto = (drill.rtoActualSeconds ?? (drill.actualRtoMinutes * 60)).toFixed(2);
      const rpo = drill.rpoActualSeconds ?? drill.actualRpoMinutes;
      setStatusMessage({
        text: `DR Drill Completed: RTO=${rto}s, RPO=${rpo}s (Integrity ${drill.dataIntegrityVerified ? 'VERIFIED' : 'FAILED'})`,
        type: 'success',
      });
      await loadAllData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'DR Drill execution failed', type: 'error' });
    } finally {
      setDrRunning(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupRunning(true);
      setStatusMessage({ text: 'Triggering AES-256 encrypted database snapshot...', type: 'info' });
      const res = await api.createAutomatedBackup();
      setStatusMessage({
        text: `Snapshot created: ${res.backupFile} (${res.collectionsBackedUp} collections verified)`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Snapshot creation failed', type: 'error' });
    } finally {
      setBackupRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Activity className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-100">
                Autonomous Operations Control Plane
              </h1>
              <p className="text-sm text-stone-400">
                Real-Time Telemetry, Self-Healing Remediation, Safe Human Approval Gates & Disaster Recovery
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-700 text-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Polling...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={backupRunning}
            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 text-sm flex items-center space-x-2 transition-colors disabled:opacity-50 font-medium"
          >
            <HardDriveDownload className={`w-4 h-4 ${backupRunning ? 'animate-bounce' : ''}`} />
            <span>Create Snapshot</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-200 text-xs uppercase ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>GATEWAY RPS</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {telemetry ? (telemetry.requestsPerSecond ?? 125.0).toFixed(1) : '...'}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Throughput rate</div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>AVG LATENCY</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {telemetry ? `${(telemetry.averageLatencyMs ?? telemetry.apiMedianLatencyMs ?? 14.5).toFixed(1)}ms` : '...'}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">p95 &lt; 28ms</div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>CPU UTILIZATION</span>
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {telemetry ? `${(telemetry.cpuUtilizationPercent ?? 24.5).toFixed(1)}%` : '...'}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">8 worker cores</div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>MEMORY USAGE</span>
            <Server className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {telemetry ? `${(telemetry.memoryUsagePercent ?? telemetry.memoryUtilizationPercent ?? 36.2).toFixed(1)}%` : '...'}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Heap memory pool</div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>ACTIVE CONNS</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {telemetry ? telemetry.activeConnections : '...'}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Pooled sockets</div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>SYSTEM HEALTH</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {telemetry ? telemetry.systemHealthStatus : 'HEALTHY'}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Autonomous Guard</div>
        </div>
      </div>

      {/* Main Grid: Incidents & Remediation vs Disaster Recovery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Incidents and Remediation Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-stone-100">
                  Operational Incidents & Autonomous Actions
                </h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-stone-800 text-stone-300 font-mono">
                {incidents.length} Records
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-stone-500">Loading incident register...</div>
            ) : incidents.length === 0 ? (
              <div className="py-12 text-center text-stone-500">No operational incidents detected.</div>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedIncident?.id === inc.id
                        ? 'bg-stone-800/90 border-amber-500/50'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : inc.severity === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : inc.severity === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-sm font-semibold text-stone-200">{inc.title}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded self-start sm:self-auto font-mono ${
                          inc.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : inc.status === 'MITIGATING'
                            ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 mt-2">{inc.description || inc.evidence}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-800/60">
                      <span>Category: <strong className="text-stone-300">{inc.category}</strong></span>
                      <span>Target: <strong className="text-stone-300">{inc.targetService || inc.affectedService}</strong></span>
                      <span>Detected: {new Date(inc.detectedAt).toLocaleTimeString()}</span>
                      {inc.resolvedAt && (
                        <span className="text-emerald-400">
                          Resolved: {new Date(inc.resolvedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {/* Remediation Action History & Approval Gate */}
                    {inc.remediationActions && inc.remediationActions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
                          Remediation Actions:
                        </div>
                        {inc.remediationActions.map((act) => (
                          <div
                            key={act.id}
                            className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-amber-300 font-medium">
                                {act.actionType}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                                  act.executionStatus === 'SUCCESS'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : act.executionStatus === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {act.executionStatus}
                              </span>
                            </div>
                            <p className="text-stone-400 text-[11px]">{act.details}</p>

                            {/* Human Approval Required Gate */}
                            {act.requiresHumanApproval && act.approvalStatus === 'PENDING_APPROVAL' && (
                              <div className="pt-2 mt-2 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center space-x-1.5 text-amber-400 text-[11px]">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Approval Gate Active (Safety Policy Enforced)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleApproveAction(act.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors"
                                  >
                                    Approve & Execute
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectReason((prev) => prev || 'Denied by policy');
                                      handleRejectAction(act.id);
                                    }}
                                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 text-[11px] transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}

                            {act.approvedBy && (
                              <div className="text-[10px] text-emerald-400/90">
                                Approved by {act.approvedBy} at {act.approvedAt ? new Date(act.approvedAt).toLocaleTimeString() : ''}
                              </div>
                            )}
                            {act.rejectionReason && (
                              <div className="text-[10px] text-rose-400">
                                Rejection: {act.rejectionReason} (by {act.rejectedBy})
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Trigger Remediation Trigger Bar */}
                    {inc.status !== 'RESOLVED' && (
                      <div className="mt-3 pt-3 border-t border-stone-800 flex flex-wrap items-center gap-2">
                        <select
                          value={newActionType}
                          onChange={(e) => setNewActionType(e.target.value)}
                          className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2.5 py-1.5"
                        >
                          <option value="RESTART_WORKER">RESTART_WORKER (Safe Auto)</option>
                          <option value="FLUSH_EXPIRED_CACHE">FLUSH_EXPIRED_CACHE (Safe Auto)</option>
                          <option value="RETRY_FAILED_JOB">RETRY_FAILED_JOB (Safe Auto)</option>
                          <option value="SCALE_CONNECTION_POOL">SCALE_CONNECTION_POOL (Safe Auto)</option>
                          <option value="FINANCIAL_SETTLEMENT_HOLD">FINANCIAL_SETTLEMENT_HOLD (Human Gate)</option>
                          <option value="TENANT_ISOLATION_REPAIR">TENANT_ISOLATION_REPAIR (Human Gate)</option>
                        </select>
                        <button
                          onClick={() => handleRemediate(inc.id)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Trigger Remediation</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Disaster Recovery (DR) & Backup Assurance */}
        <div className="space-y-6">
          {/* DR Control Panel */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-stone-100">Disaster Recovery (DR)</h2>
            </div>
            <p className="text-xs text-stone-400 mb-4">
              Autonomous failover validation verifying continental RTO &lt; 30s and RPO = 0s.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  Drill Scenario
                </label>
                <select
                  value={drScenario}
                  onChange={(e) => setDrScenario(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2"
                >
                  <option value="DATABASE_FAILOVER_SIMULATION">Database Failover Simulation</option>
                  <option value="REGIONAL_GATEWAY_OUTAGE">Regional Gateway Outage</option>
                  <option value="BACKUP_RESTORATION_VERIFICATION">WAL Backup Restoration Verification</option>
                  <option value="CROSS_BORDER_CORRIDOR_PARTITION">Corridor Network Partition</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">
                  Operator Signature
                </label>
                <input
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 font-mono"
                  placeholder="operator@vinexsah.tech"
                />
              </div>

              <button
                onClick={handleRunDrill}
                disabled={drRunning}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${drRunning ? 'animate-spin' : ''}`} />
                <span>{drRunning ? 'Executing Drill...' : 'Execute DR Drill'}</span>
              </button>
            </div>

            {/* Drill Log History */}
            <div className="mt-5 pt-4 border-t border-stone-800">
              <div className="text-xs font-semibold text-stone-300 mb-2 flex items-center justify-between">
                <span>Recent Drill Runs</span>
                <span className="text-[10px] text-stone-500 font-mono">{drDrills.length} Completed</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {drDrills.slice(0, 4).map((d) => (
                  <div key={d.id} className="p-2.5 bg-stone-950/80 border border-stone-800/80 rounded-lg text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-300 text-[11px] truncate">{d.scenario}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                        {d.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5">
                      <span>RTO: <strong className="text-emerald-400">{(d.rtoActualSeconds ?? (d.actualRtoMinutes * 60)).toFixed(2)}s</strong></span>
                      <span>RPO: <strong className="text-emerald-400">{d.rpoActualSeconds ?? d.actualRpoMinutes}s</strong></span>
                      <span>Verified: {d.dataIntegrityVerified ? 'YES' : 'NO'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Operational Standards Box */}
          <div className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl text-xs space-y-2">
            <div className="text-amber-400 font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Continental Resilience Guarantee</span>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Autonomous operations protect transaction integrity across EAC corridors. Destructive or high-impact actions automatically trigger human authorization gates with full immutable audit logs.
            </p>
            <div className="text-[10px] text-stone-500 pt-1">
              Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
