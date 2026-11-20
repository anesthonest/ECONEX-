/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Platform Administration & Oversight Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { UserProfile, MarketplaceListing, AuditLogEvent } from '../../types/index.ts';
import {
  ShieldAlert,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  TrendingUp,
  FileCheck,
  Trash2,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'VERIFICATION' | 'MODERATION' | 'AUDIT'>('METRICS');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [metricsData, usersData, listingsData, logsData] = await Promise.all([
        ApiClient.getAdminMetrics(),
        ApiClient.getUsers(),
        ApiClient.getListings({ status: 'ACTIVE' }),
        ApiClient.getAuditLogs(50),
      ]);
      setMetrics(metricsData);
      setUsers(usersData);
      setListings(listingsData);
      setAuditLogs(logsData);
    } catch (err: any) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyUser = async (userId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (!currentUser) return;
    try {
      await ApiClient.verifyUser(userId, status, currentUser.id, 'MAAIF operating certificate audit');
      setFeedbackMsg({
        type: 'success',
        text: `User verification updated to '${status}'. Audit event logged.`,
      });
      await fetchAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Verification update failed' });
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!currentUser) return;
    try {
      await ApiClient.deleteListing(listingId, currentUser.id);
      setFeedbackMsg({ type: 'success', text: 'Listing removed under administrative moderation.' });
      await fetchAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to remove listing' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
              : 'bg-red-950/60 border-red-600 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
            ✕
          </button>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-950/50 border border-red-800 flex items-center justify-center text-xl font-bold text-red-400">
              <ShieldAlert size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">Platform Operations & Administration</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800">
                  VINEXSAH System Controller
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1">
                Real-time national economic oversight, market integrity moderation, and security audit log.
              </p>
            </div>
          </div>

          {/* Sub tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('METRICS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'METRICS'
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'bg-[#18181b] text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              System Metrics
            </button>
            <button
              onClick={() => setActiveTab('VERIFICATION')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'VERIFICATION'
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'bg-[#18181b] text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              Verification Queue ({users.filter((u) => u.verificationStatus === 'PENDING_REVIEW').length})
            </button>
            <button
              onClick={() => setActiveTab('MODERATION')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'MODERATION'
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'bg-[#18181b] text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              Listings Moderation
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'AUDIT'
                  ? 'bg-[#D4AF37] text-black font-semibold'
                  : 'bg-[#18181b] text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Real System Metrics */}
      {activeTab === 'METRICS' && metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase font-semibold">Total Users</div>
              <div className="text-2xl font-bold font-mono text-[#F5F5F5] mt-1">{metrics.totalUsers}</div>
              <div className="text-[10px] text-[#71717a] mt-1">
                {metrics.activeFarmers} Farmers • {metrics.registeredBuyers} Buyers
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase font-semibold">Gross Traded (UGX)</div>
              <div className="text-2xl font-bold font-mono text-[#D4AF37] mt-1">
                {(metrics.totalGrossTradedUGX / 1000000).toFixed(2)}M
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">
                {metrics.totalOrders} Contracts Tracked
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase font-semibold">Escrow Volume Paid</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {(metrics.paidVolumeUGX / 1000000).toFixed(2)}M UGX
              </div>
              <div className="text-[10px] text-[#71717a] mt-1">Held in Mobile Money / Bank Escrow</div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0] uppercase font-semibold">Audit Events</div>
              <div className="text-2xl font-bold font-mono text-[#F5F5F5] mt-1">{metrics.auditLogCount}</div>
              <div className="text-[10px] text-[#71717a] mt-1">Cryptographically referenced</div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
              <div className="font-bold text-[#F5F5F5] uppercase tracking-wider text-xs">
                Stakeholder Distribution
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-[#1e1e24]">
                  <span className="text-[#A0A0A0]">Smallholder Farmers:</span>
                  <span className="font-mono text-[#F5F5F5] font-bold">{metrics.activeFarmers}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1e1e24]">
                  <span className="text-[#A0A0A0]">Commercial Buyers & Millers:</span>
                  <span className="font-mono text-[#F5F5F5] font-bold">{metrics.registeredBuyers}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1e1e24]">
                  <span className="text-[#A0A0A0]">MAAIF Agro-Dealers:</span>
                  <span className="font-mono text-[#F5F5F5] font-bold">{metrics.agroDealers}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1e1e24]">
                  <span className="text-[#A0A0A0]">Cooperative Unions:</span>
                  <span className="font-mono text-[#F5F5F5] font-bold">{metrics.cooperatives}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1e1e24]">
                  <span className="text-[#A0A0A0]">Freight Transporters:</span>
                  <span className="font-mono text-[#F5F5F5] font-bold">{metrics.transporters}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3 text-xs">
              <div className="font-bold text-[#F5F5F5] uppercase tracking-wider text-xs">
                Order Status Pipeline
              </div>
              <div className="space-y-2">
                {Object.entries(metrics.orderStatusCounts || {}).map(([st, cnt]) => (
                  <div key={st} className="flex justify-between py-1 border-b border-[#1e1e24]">
                    <span className="text-[#A0A0A0] font-mono">{st}:</span>
                    <span className="font-mono text-[#D4AF37] font-bold">{cnt as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Verification Queue */}
      {activeTab === 'VERIFICATION' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
            Stakeholder Account Verification Queue
          </h2>
          <p className="text-xs text-[#A0A0A0]">
            Review business credentials, MAAIF permits, and cooperative registration documents.
          </p>

          <div className="divide-y divide-[#1e1e24]">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F5F5F5]">{u.name}</span>
                    <span className="text-[10px] bg-[#18181b] border border-[#27272a] text-[#D4AF37] px-2 py-0.5 rounded font-mono">
                      {u.role}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        u.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : u.verificationStatus === 'PENDING_REVIEW'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-red-950 text-red-400 border-red-800'
                      }`}
                    >
                      {u.verificationStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A0A0A0] mt-0.5">
                    {u.organizationName || 'Individual'} • District: {u.district} • Contact: {u.phone}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {u.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerifyUser(u.id, 'VERIFIED')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded text-xs transition-colors"
                    >
                      Approve Verification
                    </button>
                  )}
                  {u.verificationStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleVerifyUser(u.id, 'REJECTED')}
                      className="px-3 py-1 bg-[#18181b] hover:bg-red-950 text-red-400 border border-red-900 rounded text-xs transition-colors"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Listings Moderation */}
      {activeTab === 'MODERATION' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
            Marketplace Moderation & Inspection
          </h2>

          <div className="divide-y divide-[#1e1e24]">
            {listings.map((l) => (
              <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F5F5F5]">{l.title}</span>
                    <span className="text-[10px] text-[#D4AF37] font-mono">{l.category}</span>
                  </div>
                  <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                    Seller: {l.sellerName} ({l.district}) • {l.quantityAvailable} {l.unit} @ {l.pricePerUnitUGX} UGX
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteListing(l.id)}
                  className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Trash2 size={12} /> Remove Listing
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Audit Trail */}
      {activeTab === 'AUDIT' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-[#D4AF37]" /> System Audit Trail ({auditLogs.length} Events)
          </h2>
          <p className="text-xs text-[#A0A0A0]">
            Immutable record of authentication, order transitions, escrow confirmations, and moderation.
          </p>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#D4AF37] font-semibold">{log.action}</span>
                    <span className="text-[10px] bg-[#18181b] text-[#A0A0A0] px-1.5 py-0.5 rounded border border-[#27272a]">
                      {log.entityType}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#F5F5F5] mt-1">{log.details}</div>
                  <div className="text-[10px] text-[#71717a] mt-0.5">
                    Actor: {log.actorName} ({log.actorRole})
                  </div>
                </div>

                <div className="text-[10px] text-[#71717a] font-mono shrink-0 sm:text-right">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
