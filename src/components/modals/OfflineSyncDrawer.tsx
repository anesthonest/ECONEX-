/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V20.0 - Offline Field Operations, Queue & Conflict Resolution Drawer
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React from 'react';
import { useOffline } from '../../context/OfflineContext.tsx';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Sprout,
  ShoppingBag,
  AlertTriangle,
  Truck,
  FileText,
} from 'lucide-react';

interface OfflineSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncDrawer: React.FC<OfflineSyncDrawerProps> = ({ isOpen, onClose }) => {
  const {
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingQueue,
    pendingCount,
    conflicts,
    unresolvedConflictsCount,
    isSyncing,
    lastSyncResult,
    syncNow,
    resolveConflict,
    clearQueue,
  } = useOffline();

  if (!isOpen) return null;

  const itemIcons: Record<string, any> = {
    FARM_CREATE: Layers,
    CROP_RECORD_CREATE: Sprout,
    LISTING_DRAFT: ShoppingBag,
    ORDER_DRAFT: Clock,
    ENQUIRY_DRAFT: ShoppingBag,
    DELIVERY_EVIDENCE: Truck,
    TRADE_AGREEMENT_DRAFT: FileText,
    INVENTORY_UPDATE: Layers,
    COOP_MEMBER_RECORD: Layers,
  };

  const unresolvedConflicts = conflicts.filter((c) => c.resolutionState === 'CONFLICT_DETECTED');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="bg-[#121212] border-l border-[#27272a] max-w-md w-full h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <RefreshCw size={16} className="text-[#D4AF37]" /> Offline Field Queue &amp; Sync
              </h3>
              <p className="text-[11px] text-[#A0A0A0]">
                Idempotent local buffer with non-destructive server version conflict protection.
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer">
              ✕
            </button>
          </div>

          <div className="bg-[#18181b] p-3 rounded-lg border border-[#27272a] flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#F5F5F5]">Field Mode Simulation</div>
              <div className="text-[10px] text-[#A0A0A0]">
                {isSimulatedOffline ? 'Simulating zero cellular connectivity' : 'Connected to central server'}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSimulatedOffline}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isSimulatedOffline
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-emerald-950 border-emerald-600 text-emerald-400'
              }`}
            >
              {isSimulatedOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
              <span>{isSimulatedOffline ? 'Offline Active' : 'Online'}</span>
            </button>
          </div>

          {lastSyncResult && (
            <div className="p-3 bg-[#09090b] rounded border border-[#1f1f23] text-xs text-[#D4AF37] flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{lastSyncResult}</span>
            </div>
          )}

          {/* Unresolved Version Conflicts Banner */}
          {unresolvedConflictsCount > 0 && (
            <div className="p-3 bg-red-950/30 border border-red-700/70 rounded-lg space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{unresolvedConflictsCount} Offline Sync Conflict(s) Detected</span>
              </div>
              <p className="text-[11px] text-red-200/80">
                Server records advanced while this device was offline. Silent overwrites are blocked; choose how to resolve each record:
              </p>
              <div className="space-y-2">
                {unresolvedConflicts.map((c) => (
                  <div key={c.id} className="p-2.5 rounded bg-[#09090b] border border-[#27272a] space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#F5F5F5]">{c.actionType}</span>
                      <span className="font-mono text-amber-400">
                        v{c.clientVersion} vs server v{c.serverVersion}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => resolveConflict(c.id, 'RESOLVED_SERVER_WINS')}
                        className="px-2 py-1 rounded bg-[#18181b] border border-[#27272a] hover:border-emerald-500 text-emerald-300 cursor-pointer"
                      >
                        Keep Server
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveConflict(c.id, 'RESOLVED_CLIENT_MERGE')}
                        className="px-2 py-1 rounded bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[#D4AF37] cursor-pointer"
                      >
                        Merge Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveConflict(c.id, 'DISCARDED')}
                        className="px-2 py-1 rounded bg-[#18181b] border border-[#27272a] hover:border-red-500 text-red-300 cursor-pointer"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Queue List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#71717a] uppercase tracking-wider">
              <span>Pending Drafts ({pendingCount})</span>
              {pendingQueue.length > 0 && (
                <button
                  type="button"
                  onClick={clearQueue}
                  className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 font-normal lowercase cursor-pointer"
                >
                  <Trash2 size={11} /> clear
                </button>
              )}
            </div>

            {pendingQueue.length === 0 ? (
              <div className="bg-[#09090b] p-6 rounded-lg border border-[#1f1f23] text-center text-xs text-[#71717a]">
                Queue is empty. Field records (farms, crops, listings, enquiries, delivery evidence) created offline appear here.
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                {pendingQueue.map((item) => {
                  const Icon = itemIcons[item.type] || Clock;
                  return (
                    <div
                      key={item.id}
                      className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#F5F5F5] flex items-center gap-1.5">
                          <Icon size={13} className="text-[#D4AF37]" />
                          <span>{item.type.replace(/_/g, ' ')}</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono">{item.status}</span>
                      </div>
                      <div className="text-[11px] text-[#A0A0A0] truncate">
                        {item.payload?.farmName ||
                          item.payload?.cropName ||
                          item.payload?.title ||
                          item.payload?.recipientName ||
                          'Field record payload'}
                      </div>
                      <div className="text-[9px] text-[#71717a]">
                        Queued: {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#27272a] space-y-2">
          <button
            type="button"
            onClick={syncNow}
            disabled={isSyncing || pendingCount === 0 || isSimulatedOffline}
            className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#e5bf43] disabled:opacity-50 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Synchronizing with Cloud...' : 'Synchronize All Records Now'}</span>
          </button>
          {isSimulatedOffline && (
            <p className="text-[10px] text-amber-400 text-center">
              Switch back to &quot;Online&quot; mode to transmit queued records to ECONEX servers.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
