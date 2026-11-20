/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Messages & Account Accessibility Settings Views
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Lock, Sparkles, Sliders, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience, ExperienceMode, TextSizeScale } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { NotificationItem } from '../../types/index.ts';
import { LanguageSelector } from '../ux/LanguageSelector.tsx';
import { EmptyState, VerificationBadge } from '../ux/CorePrimitives.tsx';
import { formatShortDate } from '../../i18n/econexTranslations.ts';

export const MessagesSimpleView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { language } = useExperience();
  const [items, setItems] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    const res = await ApiClient.getNotifications(currentUser?.id).catch(() => []);
    setItems(Array.isArray(res) ? res : []);
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser?.id]);

  const markRead = async (id: string) => {
    await ApiClient.markNotificationRead(id).catch(() => {});
    await loadNotifications();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Messages &amp; Updates</h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Order updates, payment alerts, and important announcements in plain words.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('help')}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#D4AF37] cursor-pointer"
        >
          Contact Support
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title="No messages yet"
          description="When someone places an order or a payment updates, you will see a clear alert here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <article
              key={n.id}
              className={`bg-[#121212] border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                n.read ? 'border-[#27272a]' : 'border-[#D4AF37]/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                  <span>{formatShortDate(n.timestamp, language)}</span>
                  <span aria-hidden="true">·</span>
                  <span className={n.read ? 'text-[#A0A0A0]' : 'text-[#D4AF37] font-semibold'}>
                    {n.read ? 'Read' : 'New update'}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[#F5F5F5]">{n.title}</h2>
                <p className="text-sm text-[#C0C0C0]">{n.body}</p>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] shrink-0 cursor-pointer"
                >
                  Mark as read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export const AccountSettingsView: React.FC<{
  onStartOnboarding: () => void;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}> = ({ onStartOnboarding, onOpenAuth, onNavigate }) => {
  const { currentUser, role, availableUsers, switchUser } = useAuth();
  const {
    mode,
    setMode,
    canAccessMode,
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    lowBandwidth,
    setLowBandwidth,
  } = useExperience();

  const [modeError, setModeError] = useState<string | null>(null);

  const modes: { id: ExperienceMode; title: string; desc: string }[] = [
    { id: 'SIMPLE', title: 'Simple Mode (Default)', desc: 'Large buttons, plain everyday wording, and guided steps.' },
    { id: 'STANDARD', title: 'Standard Mode', desc: 'Adds business tools, analytics, contracts, and market tables.' },
    { id: 'PROFESSIONAL', title: 'Professional & Enterprise Mode', desc: 'Adds cross-border trade, logistics corridors, and accounting ledgers.' },
    { id: 'ADMINISTRATOR', title: 'Administrator Operations Mode', desc: 'Restricted to authorized Platform Administrators (/global-operations).' },
  ];

  const handleModeSelect = (next: ExperienceMode) => {
    const res = setMode(next, role, currentUser?.id);
    if (!res.ok) {
      setModeError(res.error || 'Not permitted for your current account role.');
    } else {
      setModeError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <UserCheck size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <span>{role}</span>
            <span aria-hidden="true">·</span>
            <span>{currentUser?.district || 'Uganda'}</span>
            <span aria-hidden="true">·</span>
            <VerificationBadge verified={Boolean(currentUser?.isVerified)} />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">{currentUser?.name || 'ECONEX Member'}</h1>
          <p className="text-sm text-[#A0A0A0]">{currentUser?.email} · {currentUser?.phone}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
          >
            Sign In / Create Account
          </button>
          <button
            type="button"
            onClick={onStartOnboarding}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Guided Tutorial</span>
          </button>
        </div>
      </section>

      {/* Experience Complexity Selector */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-[#D4AF37]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Choose Your Experience Level</h2>
        </div>

        {modeError && (
          <div role="alert" className="p-3 rounded-xl bg-[#181818] border border-red-700/70 text-xs text-red-300 flex items-center gap-2">
            <Lock size={15} aria-hidden="true" />
            <span>{modeError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modes.map((m) => {
            const allowed = canAccessMode(m.id, role);
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeSelect(m.id)}
                className={`p-4 rounded-xl border text-left space-y-1 cursor-pointer ${
                  active
                    ? 'bg-[#181818] border-[#D4AF37]'
                    : allowed
                      ? 'bg-[#121212] border-[#27272a] hover:border-[#3f3f46]'
                      : 'bg-[#121212] border-[#27272a] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-[#F5F5F5]">{m.title}</span>
                  {active && <CheckCircle2 size={16} className="text-[#D4AF37]" aria-hidden="true" />}
                  {!allowed && <Lock size={14} className="text-[#A0A0A0]" aria-hidden="true" />}
                </div>
                <p className="text-xs text-[#A0A0A0]">{m.desc}</p>
              </button>
            );
          })}
        </div>

        {role === 'PLATFORM_ADMIN' && (
          <button
            type="button"
            onClick={() => onNavigate('global-operations')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37] text-sm font-semibold text-[#D4AF37] cursor-pointer"
          >
            Open Administrator Control Center (/global-operations)
          </button>
        )}
      </section>

      {/* Language & Accessibility Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Language Settings</h2>
          <LanguageSelector />
        </section>

        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Reading &amp; Data Accessibility</h2>

          <div>
            <div className="text-xs text-[#C0C0C0] mb-2">Text Size</div>
            <div className="flex gap-2">
              {(['normal', 'large', 'xlarge'] as TextSizeScale[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTextSize(s)}
                  className={`min-h-[44px] flex-1 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                    textSize === s
                      ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                      : 'bg-[#181818] text-[#C0C0C0] border-[#27272a]'
                  }`}
                >
                  {s === 'normal' ? 'Standard' : s === 'large' ? 'Large' : 'Extra Large'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 text-sm">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#27272a] cursor-pointer">
              <span className="text-[#F5F5F5]">High-Contrast Reading Mode</span>
              <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} className="w-5 h-5 accent-[#D4AF37]" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#27272a] cursor-pointer">
              <span className="text-[#F5F5F5]">Reduce Animations (Motion Sensitivity)</span>
              <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} className="w-5 h-5 accent-[#D4AF37]" />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#27272a] cursor-pointer">
              <span className="text-[#F5F5F5]">Low-Data Mode (Hide heavy photos)</span>
              <input type="checkbox" checked={lowBandwidth} onChange={(e) => setLowBandwidth(e.target.checked)} className="w-5 h-5 accent-[#D4AF37]" />
            </label>
          </div>
        </section>
      </div>

      {/* Role Demo Switcher (clearly organized) */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-[#F5F5F5]">Switch Active User Account</h2>
        <p className="text-xs text-[#A0A0A0]">
          Preview ECONEX as different registered stakeholders (farmer, buyer, agro-dealer, cooperative, transporter, or platform administrator).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableUsers.map((u) => {
            const active = u.id === currentUser?.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => switchUser(u.id)}
                className={`min-h-[52px] p-3.5 rounded-xl border text-left cursor-pointer ${
                  active ? 'bg-[#181818] border-[#D4AF37]' : 'bg-[#181818] border-[#27272a] hover:border-[#3f3f46]'
                }`}
              >
                <div className="font-semibold text-sm text-[#F5F5F5]">{u.name}</div>
                <div className="text-xs text-[#D4AF37]">{u.role}</div>
                <div className="text-xs text-[#A0A0A0]">{u.district}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
