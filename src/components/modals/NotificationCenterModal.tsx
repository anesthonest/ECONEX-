import React from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { NotificationItem } from '../../types';
import { api } from '../../services/apiClient';

interface NotificationCenterModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  onClose,
  onRefresh
}) => {
  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    onRefresh();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#121212] border border-[#333] rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#D4AF37]" />
            <h3 className="font-bold text-white text-base">ECONEX Notification Center</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-black font-bold font-mono">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#A0A0A0] hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A0A0A0]">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((notif) => {
              const isWarning = notif.type === 'WEATHER' || notif.type === 'PRICE';
              const isSuccess = notif.type === 'ORDER' || notif.type === 'PAYMENT';
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded border transition-colors ${
                    notif.read
                      ? 'bg-[#141414] border-[#222] opacity-75'
                      : 'bg-[#1a1a1a] border-[#333] shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {isWarning ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-white">{notif.title}</h4>
                        <p className="text-xs text-[#A0A0A0] mt-0.5 leading-relaxed">
                          {notif.body}
                        </p>
                        <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 mt-1.5">
                          <Clock className="h-2.5 w-2.5" /> {new Date(notif.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Mark as read"
                        className="text-zinc-500 hover:text-white p-1 rounded bg-[#222] hover:bg-[#333] shrink-0"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1e1e1e] hover:bg-[#282828] text-white px-4 py-1.5 rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
