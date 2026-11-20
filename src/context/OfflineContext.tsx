/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V20.0 - Offline Operations & Synchronization Context (with Server Conflict Detection)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { OfflineQueueItem, V20OfflineConflict } from '../types/index.ts';
import { ApiClient } from '../services/apiClient.ts';

const V20_ACTION_TYPES = new Set<OfflineQueueItem['type']>([
  'ENQUIRY_DRAFT',
  'INVENTORY_UPDATE',
  'DELIVERY_EVIDENCE',
  'COOP_MEMBER_RECORD',
  'TRADE_AGREEMENT_DRAFT',
]);

interface OfflineContextType {
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  pendingQueue: OfflineQueueItem[];
  pendingCount: number;
  conflicts: V20OfflineConflict[];
  unresolvedConflictsCount: number;
  isSyncing: boolean;
  lastSyncResult: string | null;
  lastSyncedAt: string | null;
  queueOfflineAction: (type: OfflineQueueItem['type'], payload: any) => OfflineQueueItem;
  syncNow: () => Promise<void>;
  refreshConflicts: () => Promise<void>;
  resolveConflict: (
    conflictId: string,
    resolution: 'RESOLVED_SERVER_WINS' | 'RESOLVED_CLIENT_MERGE' | 'DISCARDED'
  ) => Promise<void>;
  clearQueue: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    return localStorage.getItem('aros_simulated_offline') === 'true';
  });
  const [pendingQueue, setPendingQueue] = useState<OfflineQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<V20OfflineConflict[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => localStorage.getItem('econex_last_synced_at'));

  const refreshQueue = () => {
    const queue = ApiClient.getOfflineQueue();
    setPendingQueue(queue);
  };

  const refreshConflicts = useCallback(async () => {
    try {
      const uid = localStorage.getItem('econex_active_user_id') || 'usr_farmer_01';
      const role = localStorage.getItem('econex_active_user_role') || 'FARMER';
      const res = await ApiClient.v20GetOfflineConflicts({ userId: uid, userRole: role });
      setConflicts(Array.isArray(res?.conflicts) ? res.conflicts : []);
    } catch {
      // Non-fatal if offline or unauthenticated
    }
  }, []);

  useEffect(() => {
    refreshQueue();
    refreshConflicts();
  }, [refreshConflicts]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      localStorage.setItem('aros_simulated_offline', String(next));
      return next;
    });
  };

  const queueOfflineAction = (type: OfflineQueueItem['type'], payload: any) => {
    const item = ApiClient.queueOfflineItem(type, payload);
    refreshQueue();
    return item;
  };

  const syncNow = async () => {
    if (isSimulatedOffline) {
      setLastSyncResult('Cannot sync while offline. Switch back online first.');
      return;
    }
    setIsSyncing(true);
    try {
      const current = ApiClient.getOfflineQueue().filter((q) => q.status === 'PENDING');
      const v20Items = current.filter((q) => V20_ACTION_TYPES.has(q.type));
      let v20Synced = 0;
      let v20ConflictsFound = 0;

      if (v20Items.length > 0) {
        const uid = localStorage.getItem('econex_active_user_id') || 'usr_farmer_01';
        const role = localStorage.getItem('econex_active_user_role') || 'FARMER';
        const mapped = v20Items.map((it) => ({
          idempotencyKey: it.id,
          actionType: it.type,
          entityId: it.payload?.entityId,
          clientVersion: it.clientVersion ?? it.payload?.clientVersion,
          payload: it.payload || {},
        }));
        const v20Res = await ApiClient.v20SyncOfflineItems(mapped, { userId: uid, userRole: role });
        v20Synced = v20Res?.syncedCount || 0;
        v20ConflictsFound = v20Res?.conflictCount || 0;

        const allLocal = ApiClient.getOfflineQueue();
        const conflictMap = new Map((v20Res?.conflicts || []).map((c: V20OfflineConflict) => [c.idempotencyKey, c.id]));
        const syncedSet = new Set((v20Res?.synced || []).filter((s: any) => s.ok).map((s: any) => s.idempotencyKey));
        const nextLocal = allLocal
          .filter((it) => !syncedSet.has(it.id))
          .map((it) =>
            conflictMap.has(it.id)
              ? { ...it, status: 'CONFLICT_DETECTED' as const, conflictId: String(conflictMap.get(it.id)) }
              : it
          );
        localStorage.setItem('aros_offline_queue', JSON.stringify(nextLocal));
      }

      const legacyRes = await ApiClient.syncOfflineQueue();
      refreshQueue();
      await refreshConflicts();

      const nowIso = new Date().toISOString();
      setLastSyncedAt(nowIso);
      localStorage.setItem('econex_last_synced_at', nowIso);

      const totalSynced = (legacyRes.syncedCount || 0) + v20Synced;
      if (v20ConflictsFound > 0) {
        setLastSyncResult(
          `Synced ${totalSynced} record(s); detected ${v20ConflictsFound} version conflict(s) requiring your review below.`
        );
      } else if (totalSynced > 0) {
        setLastSyncResult(`Successfully synchronized ${totalSynced} field record(s) with ECONEX server.`);
      } else {
        setLastSyncResult('All records on this device are up-to-date.');
      }
    } catch (err: any) {
      setLastSyncResult(`Synchronization failed: ${err?.message || 'Server unreachable'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const resolveConflict = async (
    conflictId: string,
    resolution: 'RESOLVED_SERVER_WINS' | 'RESOLVED_CLIENT_MERGE' | 'DISCARDED'
  ) => {
    const uid = localStorage.getItem('econex_active_user_id') || 'usr_farmer_01';
    const role = localStorage.getItem('econex_active_user_role') || 'FARMER';
    await ApiClient.v20ResolveOfflineConflict(conflictId, resolution, { userId: uid, userRole: role });
    const nextLocal = ApiClient.getOfflineQueue().filter((it) => it.conflictId !== conflictId);
    localStorage.setItem('aros_offline_queue', JSON.stringify(nextLocal));
    refreshQueue();
    await refreshConflicts();
    setLastSyncResult(`Conflict ${conflictId} resolved (${resolution}).`);
  };

  const clearQueue = () => {
    ApiClient.clearOfflineQueue();
    refreshQueue();
    setLastSyncResult('Local offline queue cleared.');
  };

  const unresolvedConflictsCount = conflicts.filter((c) => c.resolutionState === 'CONFLICT_DETECTED').length;

  return (
    <OfflineContext.Provider
      value={{
        isSimulatedOffline,
        toggleSimulatedOffline,
        pendingQueue,
        pendingCount: pendingQueue.filter((q) => q.status === 'PENDING' || q.status === 'CONFLICT_DETECTED').length,
        conflicts,
        unresolvedConflictsCount,
        isSyncing,
        lastSyncResult,
        lastSyncedAt,
        queueOfflineAction,
        syncNow,
        refreshConflicts,
        resolveConflict,
        clearQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
