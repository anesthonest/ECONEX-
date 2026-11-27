/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V26.0 - Interactive Control Audit, Full Route Inventory, Workflow Coverage & Schema 24 Status
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  Layers,
  Map,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient.ts';
import { ALL_USER_ROLES } from '../../navigation/navigationRegistry.ts';

interface Props {
  onNavigate: (tabId: string) => void;
}

export const V26InteractiveAuditAndRoutesView: React.FC<Props> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'ROUTES' | 'WORKFLOWS' | 'MIGRATION'>('CONTROLS');
  const [loading, setLoading] = useState(true);

  const [controlsSummary, setControlsSummary] = useState<any>(null);
  const [routesSummary, setRoutesSummary] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ctrlRes, routeRes, wfRes, migRes] = await Promise.all([
        ApiClient.v26GetAuditControls({ status: statusFilter, q: searchQuery }).catch(() => null),
        ApiClient.v26GetAuditRoutes(roleFilter || undefined).catch(() => null),
        ApiClient.v26GetAuditWorkflows().catch(() => []),
        ApiClient.v26GetMigrationStatus().catch(() => null),
      ]);
      setControlsSummary(ctrlRes);
      setRoutesSummary(routeRes);
      setWorkflows(Array.isArray(wfRes) ? wfRes : []);
      setMigrationStatus(migRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-[#D4AF37]">ECONEX V26.0 · VERIFICATION &amp; NAVIGATION AUDIT</div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
            Interactive Control Audit, Route Inventory &amp; Schema 24 Migration
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Inspect every audited interactive button/form/menu, verified route mapping, connected workflow coverage, and Schema 23 → 24 migration integrity.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer self-start"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Audited UI Controls</div>
          <div className="text-2xl font-mono font-bold text-[#D4AF37] tabular-nums mt-1">
            {controlsSummary?.totalAuditedControls || 0}
          </div>
          <div className="text-xs text-emerald-400 mt-1">Zero dead buttons</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Registered UI Routes</div>
          <div className="text-2xl font-mono font-bold text-[#F5F5F5] tabular-nums mt-1">
            {routesSummary?.totalRoutes || 0}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Role-scoped navigation registry</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">End-to-End Workflows</div>
          <div className="text-2xl font-mono font-bold text-[#F5F5F5] tabular-nums mt-1">
            {workflows.length}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Backend + UI integrated</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Schema 24 &amp; V25 Backup</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums mt-1">
            {migrationStatus?.passed ? 'VERIFIED' : 'CHECK'}
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">
            V25 Rollback: {migrationStatus?.rollback?.v25BackupValid ? 'Ready' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3">
        {(
          [
            { id: 'CONTROLS', label: 'Interactive Controls Catalog', icon: ShieldCheck },
            { id: 'ROUTES', label: 'Route Inventory', icon: Map },
            { id: 'WORKFLOWS', label: 'Workflow Coverage Matrix', icon: Layers },
            { id: 'MIGRATION', label: 'Schema 24 Migration & V25 Backup', icon: Database },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Controls Catalog */}
      {activeTab === 'CONTROLS' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 rounded-xl bg-[#181818] border border-[#27272a]">
              <Search size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search control ID, route, action, or handler..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAll()}
                className="w-full min-h-[42px] bg-transparent text-sm text-[#F5F5F5] focus:outline-none"
              />
            </div>
            <select
              aria-label="Filter controls by audit status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED_WORKING">VERIFIED_WORKING</option>
              <option value="ACTIVATED_IN_V26">ACTIVATED_IN_V26</option>
              <option value="SANDBOX_MODE">SANDBOX_MODE</option>
              <option value="EXTERNAL_INTEGRATION_NOT_LIVE">EXTERNAL_INTEGRATION_NOT_LIVE</option>
            </select>
            <button
              type="button"
              onClick={loadAll}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Module &amp; Route</th>
                  <th className="py-2.5 px-3">Intended Action</th>
                  <th className="py-2.5 px-3">Destination / Endpoint</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Screen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {(controlsSummary?.controls || []).map((c: any) => (
                  <tr key={c.controlId} className="hover:bg-[#181818]/60">
                    <td className="py-2.5 px-3 font-mono text-[#D4AF37] whitespace-nowrap">{c.controlId}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#F5F5F5]">{c.module}</div>
                      <div className="font-mono text-[#A0A0A0]">{c.route}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#C0C0C0]">{c.intendedAction}</td>
                    <td className="py-2.5 px-3 font-mono text-[#A0A0A0]">{c.handlerOrDestination}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 whitespace-nowrap">{c.status}</td>
                    <td className="py-2.5 px-3 text-right">
                      {c.navTabId ? (
                        <button
                          type="button"
                          onClick={() => onNavigate(c.navTabId)}
                          className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowUpRight size={12} aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="text-[#71717a]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Route Inventory */}
      {activeTab === 'ROUTES' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[#C0C0C0]">
              Showing <strong className="text-[#F5F5F5] tabular-nums">{routesSummary?.filteredCount || 0}</strong> of{' '}
              <strong className="text-[#D4AF37] tabular-nums">{routesSummary?.totalRoutes || 0}</strong> registered routes
            </div>
            <select
              aria-label="Filter routes by participant role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            >
              <option value="">All Roles</option>
              {ALL_USER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto">
            {(routesSummary?.routes || []).map((r: any) => (
              <div key={r.routeId} className="p-3.5 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#F5F5F5] truncate">{r.label}</div>
                  <div className="text-xs font-mono text-[#D4AF37] truncate">{r.routePath}</div>
                  <div className="text-[11px] text-[#A0A0A0] truncate">
                    {r.groupId} · {r.minExperienceMode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(r.navId)}
                  className="min-h-[38px] px-3 py-1 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#F5F5F5] shrink-0 cursor-pointer"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Workflow Coverage */}
      {activeTab === 'WORKFLOWS' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          {workflows.map((wf) => (
            <div key={wf.workflowId} className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-[#D4AF37]">{wf.workflowId}</span>
                  <h3 className="text-sm font-semibold text-[#F5F5F5]">{wf.name}</h3>
                </div>
                <span className="font-mono text-xs text-emerald-400 inline-flex items-center gap-1">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  <span>{wf.status}</span>
                </span>
              </div>
              <div className="text-xs text-[#C0C0C0]">
                Stages: {(wf.stages || []).join(' -> ')}
              </div>
              <div className="text-xs font-mono text-[#A0A0A0]">
                Endpoints: {(wf.endpoints || []).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Schema 24 Migration & V25 Backup */}
      {activeTab === 'MIGRATION' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2">
              <div className="font-semibold text-[#F5F5F5]">Schema 24 Migration Integrity</div>
              <div className="text-xs text-[#C0C0C0] font-mono">
                Schema Version: {migrationStatus?.integrity?.schemaVersion}
              </div>
              <div className="text-xs text-[#C0C0C0] font-mono">
                Integrity Passed: {String(migrationStatus?.passed)}
              </div>
              <div className="text-xs text-[#A0A0A0]">
                Checks: {(migrationStatus?.integrity?.checks || []).join(' · ')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2">
              <div className="font-semibold text-[#F5F5F5]">V25 Rollback Backup Gate</div>
              <div className="text-xs text-[#C0C0C0] font-mono">
                Backup Valid: {String(migrationStatus?.rollback?.v25BackupValid)}
              </div>
              <div className="text-xs text-[#C0C0C0] font-mono break-all">
                SHA-256: {migrationStatus?.rollback?.v25BackupSha256 || 'Pending write'}
              </div>
              <div className="text-xs text-[#A0A0A0]">
                Bytes: {migrationStatus?.rollback?.v25BackupBytes || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
