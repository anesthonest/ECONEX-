/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V18.0 - Unified Notification & 5-Bucket Task Centre (/tasks)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  CheckSquare,
  Square,
  CheckCheck,
  Archive,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  NotificationItem,
  V18TaskBucket,
  V18UnifiedTask,
  V26InAppNotification,
} from '../../types/index.ts';

interface Props {
  onNavigateTab: (tabId: string) => void;
  onRefreshNotifications?: () => Promise<void> | void;
}

const BUCKET_META: { id: 'ALL' | V18TaskBucket; label: string }[] = [
  { id: 'ALL', label: 'All Tasks' },
  { id: 'ASSIGNED_TO_ME', label: 'Assigned to Me' },
  { id: 'AWAITING_MY_ACTION', label: 'Awaiting Action' },
  { id: 'ASSIGNED_BY_ME', label: 'Assigned by Me' },
  { id: 'OVERDUE', label: 'Overdue' },
  { id: 'COMPLETED', label: 'Completed' },
];

export const TaskNotificationCenterView: React.FC<Props> = ({
  onNavigateTab,
  onRefreshNotifications,
}) => {
  const { currentUser, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<'ALL' | V18TaskBucket>('ALL');
  const [notifCategory, setNotifCategory] = useState<string>('ALL');
  const [notifUnreadOnly, setNotifUnreadOnly] = useState<boolean>(false);
  const [tasks, setTasks] = useState<V18UnifiedTask[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [v26Notifications, setV26Notifications] = useState<V26InAppNotification[]>([]);
  const [counts, setCounts] = useState<Record<V18TaskBucket, number>>({
    ASSIGNED_TO_ME: 0,
    AWAITING_MY_ACTION: 0,
    ASSIGNED_BY_ME: 0,
    OVERDUE: 0,
    COMPLETED: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const actor = { userId: currentUser?.id, userRole: role };

  const loadCenter = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, v26Res] = await Promise.all([
        ApiClient.v18GetNotificationsTasks(actor),
        ApiClient.v26GetNotifications(
          { category: notifCategory, unreadOnly: notifUnreadOnly, archived: 'false' },
          actor
        ).catch(() => null),
      ]);
      setTasks(data.tasks || []);
      setNotifications(data.notifications || []);
      if (v26Res && Array.isArray(v26Res.notifications)) {
        setV26Notifications(v26Res.notifications);
        setUnreadCount(Number(v26Res.unreadCount ?? data.unreadNotificationsCount ?? 0));
      } else {
        setV26Notifications([]);
        setUnreadCount(Number(data.unreadNotificationsCount || 0));
      }
      if (data.countsByBucket) setCounts(data.countsByBucket);
    } catch (e: any) {
      setError(e?.message || 'Unable to load notifications and tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCenter();
  }, [currentUser?.id, role, notifCategory, notifUnreadOnly]);

  const handleToggleTask = async (task: V18UnifiedTask) => {
    if (!task.actionable) return;
    const nextStatus = task.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
    try {
      setUpdatingId(task.id);
      await ApiClient.v18UpdateTaskStatus(task.id, nextStatus, actor);
      await loadCenter();
    } catch (e: any) {
      setError(e?.message || 'Unable to update task status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkNotificationRead = async (notifId: string, isV26 = false) => {
    try {
      setUpdatingId(notifId);
      if (isV26) await ApiClient.v26MarkNotificationRead(notifId, actor);
      else await ApiClient.markNotificationRead(notifId);
      await loadCenter();
      if (onRefreshNotifications) await onRefreshNotifications();
    } catch (e: any) {
      setError(e?.message || 'Unable to mark notification as read.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setUpdatingId('ALL');
      await ApiClient.v26MarkAllNotificationsRead(actor);
      await loadCenter();
      if (onRefreshNotifications) await onRefreshNotifications();
    } catch (e: any) {
      setError(e?.message || 'Unable to mark all notifications read.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleArchiveNotification = async (notifId: string) => {
    try {
      setUpdatingId(notifId);
      await ApiClient.v26ArchiveNotification(notifId, actor);
      await loadCenter();
    } catch (e: any) {
      setError(e?.message || 'Unable to archive notification.');
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleTasks =
    selectedBucket === 'ALL' ? tasks : tasks.filter((t) => t.bucket === selectedBucket);

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
            Notifications &amp; Unified Task Centre
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            All action queues, overdue items, partnership invitations, disputes, support tickets, and system alerts for{' '}
            <strong className="text-[#F5F5F5]">{currentUser?.name || role}</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={updatingId === 'ALL'}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-sm text-[#D4AF37] hover:border-[#D4AF37] flex items-center gap-2 cursor-pointer"
          >
            <CheckCheck size={15} aria-hidden="true" />
            <span>Mark All Read</span>
          </button>
          <button
            type="button"
            onClick={loadCenter}
            disabled={loading}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-sm text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900 text-sm text-red-200 flex items-center gap-2">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Unread Alerts</div>
          <div className="text-2xl font-bold font-mono text-[#D4AF37] tabular-nums mt-1">
            {unreadCount}
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Assigned to Me</div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
            {counts.ASSIGNED_TO_ME}
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Awaiting Action</div>
          <div className="text-2xl font-bold font-mono text-[#D4AF37] tabular-nums mt-1">
            {counts.AWAITING_MY_ACTION}
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Assigned by Me</div>
          <div className="text-2xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
            {counts.ASSIGNED_BY_ME}
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Overdue</div>
          <div className="text-2xl font-bold font-mono text-red-400 tabular-nums mt-1">
            {counts.OVERDUE}
          </div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
          <div className="text-xs text-[#A0A0A0]">Completed</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
            {counts.COMPLETED}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {BUCKET_META.map((b) => {
          const active = selectedBucket === b.id;
          const countVal = b.id === 'ALL' ? tasks.length : counts[b.id];
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBucket(b.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm flex items-center gap-2 cursor-pointer ${
                active
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              <span>{b.label}</span>
              <span className="font-mono text-xs tabular-nums">({countVal})</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#27272a] bg-[#0a0a0c] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              Actionable Task Queue (<span className="tabular-nums">{visibleTasks.length}</span>)
            </h2>
            <span className="text-xs text-[#A0A0A0]">
              {BUCKET_META.find((b) => b.id === selectedBucket)?.label || 'All Tasks'}
            </span>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#A0A0A0]">
              No tasks in this bucket.
            </div>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {visibleTasks.map((task) => {
                const isDone = task.bucket === 'COMPLETED' || task.status === 'COMPLETED';
                const priorityLabel = String(task.priority || 'NORMAL')
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const sourceLabel = String(task.sourceType || 'TASK')
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div
                    key={task.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181818]/60"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {task.actionable ? (
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          disabled={updatingId === task.id}
                          aria-label={isDone ? `Reopen ${task.title}` : `Complete ${task.title}`}
                          className="mt-0.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#27272a] bg-[#0a0a0c] text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer shrink-0"
                        >
                          {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      ) : (
                        <div className="mt-0.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#27272a] bg-[#0a0a0c] text-[#A0A0A0] shrink-0">
                          {isDone ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Clock size={18} />}
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-semibold ${isDone ? 'text-[#A0A0A0] line-through' : 'text-[#F5F5F5]'}`}>
                            {task.title}
                          </span>
                          <span className="text-xs font-medium text-[#D4AF37]">
                            {priorityLabel} priority
                          </span>
                          <span className="text-xs text-[#A0A0A0]">
                            · {sourceLabel}
                          </span>
                        </div>
                        <p className="text-xs text-[#A0A0A0]">{task.description}</p>
                        {task.dueDate && (
                          <div className="text-xs text-[#71717a] tabular-nums">
                            Logged {new Date(task.dueDate).toLocaleDateString()} · {String(task.status || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab(task.targetTabId)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-xs font-medium text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      <span>Open</span>
                      <ArrowUpRight size={14} className="text-[#D4AF37]" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-[#121212] border border-[#27272a] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#27272a] bg-[#0a0a0c] space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Bell size={15} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Notifications ({v26Notifications.length > 0 ? v26Notifications.length : notifications.length})</span>
              </h2>
              <span className="text-xs font-mono text-[#D4AF37] tabular-nums">
                {unreadCount} unread
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter notifications by category"
                value={notifCategory}
                onChange={(e) => setNotifCategory(e.target.value)}
                className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#27272a] bg-[#121212] text-xs text-[#F5F5F5]"
              >
                <option value="ALL">All Categories</option>
                <option value="ORDERS">Orders</option>
                <option value="WALLET">Wallet</option>
                <option value="PROCUREMENT">Procurement</option>
                <option value="SUPPORT">Support</option>
                <option value="SYSTEM">System</option>
              </select>
              <label className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#27272a] bg-[#121212] text-xs text-[#C0C0C0] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifUnreadOnly}
                  onChange={(e) => setNotifUnreadOnly(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>Unread only</span>
              </label>
            </div>
          </div>

          {v26Notifications.length === 0 && notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#A0A0A0]">
              No notifications recorded in this filter.
            </div>
          ) : (
            <div className="divide-y divide-[#27272a] max-h-[540px] overflow-y-auto">
              {v26Notifications.length > 0
                ? v26Notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 space-y-2 ${n.isRead ? 'bg-[#121212]' : 'bg-[#181818]'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-[#F5F5F5]">{n.title}</div>
                        <span className="text-[10px] font-mono text-[#D4AF37] shrink-0">
                          {n.isRead ? n.category : `UNREAD · ${n.category}`}
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A0A0]">{n.body}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] font-mono text-[#71717a]">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {n.targetTabId && (
                            <button
                              type="button"
                              onClick={() => onNavigateTab(n.targetTabId)}
                              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#27272a] bg-[#0a0a0c] text-xs text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
                            >
                              Open
                            </button>
                          )}
                          {!n.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkNotificationRead(n.id, true)}
                              disabled={updatingId === n.id}
                              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#27272a] bg-[#0a0a0c] text-xs text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleArchiveNotification(n.id)}
                            disabled={updatingId === n.id}
                            className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#27272a] bg-[#0a0a0c] text-xs text-[#A0A0A0] hover:text-[#F5F5F5] flex items-center gap-1 cursor-pointer"
                          >
                            <Archive size={12} aria-hidden="true" />
                            <span>Archive</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                : notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 space-y-2 ${n.read ? 'bg-[#121212]' : 'bg-[#181818]'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-[#F5F5F5]">{n.title}</div>
                        {!n.read && (
                          <span className="text-[10px] font-mono font-bold text-[#D4AF37] shrink-0">
                            UNREAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A0A0A0]">{n.body}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-mono text-[#71717a]">
                          {new Date(n.timestamp).toLocaleString()}
                        </span>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkNotificationRead(n.id, false)}
                            disabled={updatingId === n.id}
                            className="min-h-[36px] px-3 py-1 rounded-lg border border-[#27272a] bg-[#0a0a0c] text-xs text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
