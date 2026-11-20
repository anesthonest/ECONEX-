/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V5 - High-Scale Performance Testing & Load Harness
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Gauge,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  BarChart2,
  Users,
  ShieldCheck,
  Server,
  Activity,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import { LoadTestResult } from '../../types/index.ts';

export default function PerformanceTestingView() {
  const [profileUsers, setProfileUsers] = useState<number>(500);
  const [durationSeconds, setDurationSeconds] = useState<number>(5);
  const [running, setRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<LoadTestResult | null>(null);
  const [history, setHistory] = useState<LoadTestResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getLoadTestResults();
      setHistory(res);
      if (res.length > 0 && !currentResult) {
        setCurrentResult(res[0]);
      }
    } catch (err) {
      console.error('Failed to load load-test results history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRunLoadTest = async () => {
    try {
      setRunning(true);
      setErrorMsg(null);
      const result = await api.runLoadTest(profileUsers, durationSeconds);
      setCurrentResult(result);
      await loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Load test execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Gauge className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-100">
              High-Scale Performance & Empirical Load Testing
            </h1>
            <p className="text-sm text-stone-400">
              Simulate 100 to 5,000 Concurrent Users Across Continental Trade & Settlement Pipelines
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadHistory}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-700 text-sm flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload History</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Control Panel: Select Concurrency Profile */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-stone-100">Load Simulation Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { users: 100, label: 'Regional Baseline', sub: '100 Concurrent Users' },
            { users: 500, label: 'Settlement Surge', sub: '500 Concurrent Users' },
            { users: 1000, label: 'Harvest Peak', sub: '1,000 Concurrent Users' },
            { users: 5000, label: 'AfCFTA Stress Test', sub: '5,000 Concurrent Users' },
          ].map((profile) => (
            <button
              key={profile.users}
              type="button"
              onClick={() => setProfileUsers(profile.users)}
              className={`p-3 rounded-xl border text-left transition-all ${
                profileUsers === profile.users
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                  : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="font-bold text-sm text-stone-200">{profile.label}</div>
              <div className="text-xs font-mono text-amber-400 mt-0.5">{profile.sub}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-800">
          <div className="flex items-center space-x-3 text-xs text-stone-300">
            <span>Burst Duration:</span>
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-stone-200 font-mono"
            >
              <option value={3}>3 Seconds Burst</option>
              <option value={5}>5 Seconds Standard</option>
              <option value={10}>10 Seconds Sustained</option>
            </select>
          </div>

          <button
            onClick={handleRunLoadTest}
            disabled={running}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? `Executing ${profileUsers} Users Simulation...` : `Run ${profileUsers} User Load Test`}</span>
          </button>
        </div>
      </div>

      {/* Load Test Results Cards */}
      {currentResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>CONCURRENT USERS</span>
                <Users className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-stone-100 font-mono">
                {(currentResult.concurrentUsers ?? currentResult.profileUsers ?? 100).toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Virtual worker clients</div>
            </div>

            <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>THROUGHPUT (RPS)</span>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {(currentResult.throughputRps ?? currentResult.requestsPerSecond ?? 0).toFixed(1)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Reqs / second</div>
            </div>

            <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>MEDIAN (p50)</span>
                <Clock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-stone-100 font-mono">
                {(currentResult.p50LatencyMs ?? currentResult.medianLatencyMs ?? 0).toFixed(1)}ms
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Median latency</div>
            </div>

            <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>95TH %TILE (p95)</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-300 font-mono">
                {(currentResult.p95LatencyMs ?? 0).toFixed(1)}ms
              </div>
              <div className="text-[11px] text-stone-500 mt-1">95% of all calls</div>
            </div>

            <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>ERROR RATE</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-stone-100 font-mono">
                {currentResult.errorRatePercent.toFixed(2)}%
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">Target &lt; 1.0%</div>
            </div>

            <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                <span>SYSTEM STABILITY</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {currentResult.systemStability}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Zero regression</div>
            </div>
          </div>

          {/* Test Detail Breakdown Box */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-stone-100 mb-3">
              Execution Profile & Distribution Analysis
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg">
                <span className="text-stone-500 block text-[11px]">Total Requests:</span>
                <span className="text-stone-200 text-sm font-bold">{currentResult.totalRequests.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg">
                <span className="text-stone-500 block text-[11px]">Successful 2xx:</span>
                <span className="text-emerald-400 text-sm font-bold">{currentResult.successfulRequests.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg">
                <span className="text-stone-500 block text-[11px]">p99 Tail Latency:</span>
                <span className="text-amber-400 text-sm font-bold">{currentResult.p99LatencyMs.toFixed(1)}ms</span>
              </div>
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-lg">
                <span className="text-stone-500 block text-[11px]">Max Spike Latency:</span>
                <span className="text-stone-300 text-sm font-bold">{(currentResult.maxLatencyMs ?? currentResult.p99LatencyMs ?? 0).toFixed(1)}ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Load Runs */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-stone-100 mb-3 flex items-center justify-between">
          <span>Historical Load Test Executions</span>
          <span className="text-xs text-stone-500 font-mono">{history.length} Runs Recorded</span>
        </h3>

        {loadingHistory ? (
          <div className="py-6 text-center text-stone-500 text-xs">Loading run history...</div>
        ) : history.length === 0 ? (
          <div className="py-6 text-center text-stone-500 text-xs">No prior load test executions recorded.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h.id}
                onClick={() => setCurrentResult(h)}
                className={`p-3 rounded-lg border cursor-pointer text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                  currentResult?.id === h.id
                    ? 'bg-stone-800 border-amber-500'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-amber-300">{(h.concurrentUsers ?? h.profileUsers ?? 100)} Users</span>
                  <span className="text-stone-400">Total: {h.totalRequests} reqs</span>
                  <span className="text-emerald-400 font-bold">{(h.throughputRps ?? h.requestsPerSecond ?? 0).toFixed(1)} RPS</span>
                </div>
                <div className="flex items-center space-x-3 text-stone-400 text-[11px]">
                  <span>p95: {h.p95LatencyMs.toFixed(1)}ms</span>
                  <span>Errors: {h.errorRatePercent.toFixed(2)}%</span>
                  <span>{new Date(h.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
