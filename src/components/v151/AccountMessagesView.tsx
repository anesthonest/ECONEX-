/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Messages & Account Accessibility Settings Views
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Lock,
  Sparkles,
  Sliders,
  UserCheck,
  Archive,
  CheckCheck,
  Globe,
  ShieldCheck,
  Laptop,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  useExperience,
  ExperienceMode,
  TextSizeScale,
  EAC_ACTIVE_COUNTRIES,
} from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import {
  V26InAppNotification,
  V26NotificationDelivery,
  V26NotificationPreferences,
} from '../../types/index.ts';
import { LanguageSelector } from '../ux/LanguageSelector.tsx';
import { EmptyState, VerificationBadge } from '../ux/CorePrimitives.tsx';
import { formatShortDate } from '../../i18n/econexTranslations.ts';

export const MessagesSimpleView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const { language } = useExperience();
  const [items, setItems] = useState<V26InAppNotification[]>([]);
  const [deliveries, setDeliveries] = useState<V26NotificationDelivery[]>([]);
  const [prefs, setPrefs] = useState<V26NotificationPreferences | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [channelNotice, setChannelNotice] = useState<string | null>(null);

  const actor = { userId: currentUser?.id, userRole: role };

  const loadNotifications = async () => {
    const res = await ApiClient.v26GetNotifications(
      { category: categoryFilter, archived: 'false' },
      actor
    ).catch(() => null);
    if (res && Array.isArray(res.notifications)) {
      setItems(res.notifications);
      setDeliveries(Array.isArray(res.deliveries) ? res.deliveries : []);
      if (res.preferences) setPrefs(res.preferences);
    } else {
      const legacy = await ApiClient.getNotifications(currentUser?.id).catch(() => []);
      setItems(
        (Array.isArray(legacy) ? legacy : []).map((n: any) => ({
          id: n.id,
          userId: n.userId,
          tenantId: 'TENANT-UG',
          category: 'SYSTEM',
          severity: 'INFO',
          title: n.title,
          body: n.body,
          targetRoute: '/messages',
          targetTabId: 'messages',
          isRead: Boolean(n.read),
          archived: false,
          createdAt: n.timestamp,
        }))
      );
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser?.id, categoryFilter]);

  const markRead = async (id: string) => {
    await ApiClient.v26MarkNotificationRead(id, actor).catch(() => ApiClient.markNotificationRead(id).catch(() => {}));
    await loadNotifications();
  };

  const markAllRead = async () => {
    await ApiClient.v26MarkAllNotificationsRead(actor).catch(() => {});
    await loadNotifications();
  };

  const archiveItem = async (id: string) => {
    await ApiClient.v26ArchiveNotification(id, actor).catch(() => {});
    await loadNotifications();
  };

  const togglePref = async (key: 'inAppEnabled' | 'emailEnabled' | 'smsEnabled' | 'whatsappEnabled', value: boolean) => {
    const res = await ApiClient.v26UpdateNotificationPreferences({ [key]: value }, actor).catch(() => null);
    if (res?.preferences) setPrefs(res.preferences);
    if (res?.honestyNotice) setChannelNotice(res.honestyNotice);
  };

  const categories = ['ALL', 'ORDERS', 'WALLET', 'SUPPORT', 'PROCUREMENT', 'SYSTEM'];

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Messages &amp; Notification Preferences</h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Order updates, wallet ledger alerts, support replies, and channel preferences.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markAllRead}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Mark All Read</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('help')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#D4AF37] cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${
              categoryFilter === cat
                ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title="No messages in this view"
          description="When an order updates, payment settles, or support replies, clear alerts appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <article
              key={n.id}
              className={`bg-[#121212] border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                n.isRead ? 'border-[#27272a]' : 'border-[#D4AF37]/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
                  <span>{formatShortDate(n.createdAt, language)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{n.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className={n.isRead ? 'text-[#A0A0A0]' : 'text-[#D4AF37] font-semibold'}>
                    {n.isRead ? 'Read' : 'New update'}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[#F5F5F5]">{n.title}</h2>
                <p className="text-sm text-[#C0C0C0]">{n.body}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {n.targetTabId && n.targetTabId !== 'messages' && (
                  <button
                    type="button"
                    onClick={() => onNavigate(n.targetTabId)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#D4AF37] cursor-pointer"
                  >
                    Open Workspace
                  </button>
                )}
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => archiveItem(n.id)}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#3f3f46] text-xs text-[#A0A0A0] hover:text-[#F5F5F5] flex items-center gap-1 cursor-pointer"
                >
                  <Archive size={13} aria-hidden="true" />
                  <span>Archive</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Channel Preferences & Truthful Delivery Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-[#F5F5F5]">Alert Channel Preferences</h2>
          {channelNotice && (
            <p className="text-xs text-[#D4AF37] bg-[#181818] border border-[#27272a] rounded-xl p-3">
              {channelNotice}
            </p>
          )}
          <div className="space-y-2 text-sm">
            {[
              { key: 'inAppEnabled' as const, label: 'In-App Notifications Inbox (Active)' },
              { key: 'emailEnabled' as const, label: 'Email Alerts (External SMTP unprovisioned — logged as non-sent)' },
              { key: 'smsEnabled' as const, label: 'SMS Alerts (External gateway unprovisioned — logged as non-sent)' },
              { key: 'whatsappEnabled' as const, label: 'WhatsApp Alerts (External provider unprovisioned — logged as non-sent)' },
            ].map((ch) => (
              <label key={ch.key} className="flex items-center justify-between p-3 rounded-xl bg-[#181818] border border-[#27272a] cursor-pointer">
                <span className="text-xs sm:text-sm text-[#F5F5F5]">{ch.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(prefs ? prefs[ch.key] : ch.key === 'inAppEnabled')}
                  onChange={(e) => togglePref(ch.key, e.target.checked)}
                  className="w-5 h-5 accent-[#D4AF37]"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-semibold text-[#F5F5F5]">Recent Channel Delivery Audit</h2>
          {deliveries.length === 0 ? (
            <p className="text-xs text-[#A0A0A0]">No channel delivery records yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {deliveries.slice(0, 8).map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#F5F5F5] font-semibold">{d.channel}</span>
                    <span className={d.deliveryStatus === 'DELIVERED_IN_APP' ? 'text-emerald-400' : 'text-[#D4AF37]'}>
                      {d.deliveryStatus}
                    </span>
                  </div>
                  <div className="text-[#A0A0A0]">{d.providerNote}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export const AccountSettingsView: React.FC<{
  onStartOnboarding: () => void;
  onOpenAuth: () => void;
  onNavigate: (tab: string) => void;
}> = ({ onStartOnboarding, onOpenAuth, onNavigate }) => {
  const { currentUser, role, availableUsers, switchUser, refreshUsers } = useAuth();
  const {
    mode,
    setMode,
    canAccessMode,
    activeCountry,
    activeCurrency,
    setActiveCountry,
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
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    district: currentUser?.district || '',
    organizationName: currentUser?.organizationName || '',
    bio: currentUser?.bio || '',
  });
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [recoveryChannel, setRecoveryChannel] = useState<'EMAIL' | 'PHONE_SMS'>('EMAIL');
  const [recoveryReqId, setRecoveryReqId] = useState<string | null>(null);
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [sessionsData, setSessionsData] = useState<{ sessions: any[]; devices: any[] }>({ sessions: [], devices: [] });

  useEffect(() => {
    setProfileForm({
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      district: currentUser?.district || '',
      organizationName: currentUser?.organizationName || '',
      bio: currentUser?.bio || '',
    });
    if (currentUser?.id) {
      ApiClient.v26GetDevicesAndSessions({ userId: currentUser.id, userRole: role })
        .then((d) => setSessionsData({ sessions: d?.sessions || [], devices: d?.devices || [] }))
        .catch(() => {});
    }
  }, [currentUser?.id, role]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setProfileStatus(null);
    try {
      await ApiClient.v26UpdateAccountProfile(
        {
          name: profileForm.name,
          phone: profileForm.phone,
          district: profileForm.district,
          country: activeCountry,
          organizationName: profileForm.organizationName,
          bio: profileForm.bio,
        },
        { userId: currentUser.id, userRole: role }
      );
      await refreshUsers();
      setProfileStatus('Profile saved cleanly.');
    } catch (err: any) {
      setProfileStatus(err?.message || 'Could not update profile.');
    }
  };

  const handleRequestVerification = async () => {
    if (!currentUser?.id) return;
    setRecoveryNotice(null);
    try {
      const res = await ApiClient.v26RequestRecoveryOrVerification(
        {
          requestType: 'CONTACT_VERIFY',
          contactChannel: recoveryChannel,
          contactTarget: recoveryChannel === 'EMAIL' ? currentUser.email : currentUser.phone,
        },
        { userId: currentUser.id, userRole: role }
      );
      setRecoveryReqId(res.request?.id || null);
      setSandboxOtp(res.sandboxVerificationCode || null);
      setRecoveryNotice(res.honestyNotice || 'Sandbox code issued locally.');
    } catch (err: any) {
      setRecoveryNotice(err?.message || 'Failed to request verification challenge.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!currentUser?.id || !recoveryReqId || !otpInput.trim()) return;
    try {
      const res = await ApiClient.v26VerifyRecoveryOrContact(
        { requestId: recoveryReqId, code: otpInput.trim() },
        { userId: currentUser.id, userRole: role }
      );
      if (res.verified) {
        setRecoveryNotice('Contact verification completed and recorded in audit trail.');
        setSandboxOtp(null);
        setOtpInput('');
        await refreshUsers();
      }
    } catch (err: any) {
      setRecoveryNotice(err?.message || 'Verification failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
            <UserCheck size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <span>{role}</span>
            <span aria-hidden="true">·</span>
            <span>{currentUser?.district || 'Uganda'} ({activeCountry} · {activeCurrency})</span>
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

      {/* Profile Editor & Active Country Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-[#D4AF37]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Edit Profile Details</h2>
          </div>
          {profileStatus && (
            <div className="p-3 rounded-xl bg-[#181818] border border-[#D4AF37] text-xs text-[#D4AF37]">
              {profileStatus}
            </div>
          )}
          <form onSubmit={handleSaveProfile} className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="acc-name" className="block text-xs text-[#C0C0C0] mb-1">Full Name</label>
                <input
                  id="acc-name"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
              <div>
                <label htmlFor="acc-phone" className="block text-xs text-[#C0C0C0] mb-1">Phone Number</label>
                <input
                  id="acc-phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="acc-district" className="block text-xs text-[#C0C0C0] mb-1">District / City</label>
                <input
                  id="acc-district"
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm((p) => ({ ...p, district: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
              <div>
                <label htmlFor="acc-org" className="block text-xs text-[#C0C0C0] mb-1">Organisation / Business</label>
                <input
                  id="acc-org"
                  type="text"
                  value={profileForm.organizationName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, organizationName: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="acc-bio" className="block text-xs text-[#C0C0C0] mb-1">Short Economic Bio</label>
              <input
                id="acc-bio"
                type="text"
                value={profileForm.bio}
                onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Produce, trade focus, or enterprise role"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm flex items-center gap-2 cursor-pointer"
            >
              <Save size={15} aria-hidden="true" />
              <span>Save Profile Changes</span>
            </button>
          </form>
        </section>

        {/* Country Context & Sandbox Verification */}
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#D4AF37]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Active Country &amp; Currency</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EAC_ACTIVE_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setActiveCountry(c.code, currentUser?.id, role)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-left text-xs cursor-pointer ${
                    activeCountry === c.code
                      ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                      : 'bg-[#181818] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
                  }`}
                >
                  <div>{c.name}</div>
                  <div className="font-mono opacity-80">{c.currency}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#27272a] pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#D4AF37]" aria-hidden="true" />
              <h3 className="text-base font-semibold text-[#F5F5F5]">Contact Verification (Sandbox Challenge)</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Verification channel"
                value={recoveryChannel}
                onChange={(e) => setRecoveryChannel(e.target.value as 'EMAIL' | 'PHONE_SMS')}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#F5F5F5]"
              >
                <option value="EMAIL">Email ({currentUser?.email})</option>
                <option value="PHONE_SMS">SMS ({currentUser?.phone})</option>
              </select>
              <button
                type="button"
                onClick={handleRequestVerification}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37] text-xs font-semibold text-[#D4AF37] cursor-pointer"
              >
                Issue Sandbox Code
              </button>
            </div>
            {sandboxOtp && (
              <div className="p-3 rounded-xl bg-[#181818] border border-[#27272a] space-y-2 text-xs">
                <div className="text-[#D4AF37] font-mono">
                  Sandbox Code: <strong>{sandboxOtp}</strong>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit sandbox code"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-[#F5F5F5] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
            {recoveryNotice && <p className="text-xs text-[#A0A0A0]">{recoveryNotice}</p>}
          </div>
        </section>
      </div>

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

      {/* Active Devices & Sessions */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Laptop size={18} className="text-[#D4AF37]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Devices &amp; Active Sessions ({sessionsData.sessions.length})</h2>
        </div>
        {sessionsData.sessions.length === 0 ? (
          <p className="text-xs text-[#A0A0A0]">Active browser session bound to {currentUser?.name || role}.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessionsData.sessions.slice(0, 6).map((s: any) => (
              <div key={s.id} className="p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs space-y-1 font-mono">
                <div className="flex justify-between text-[#F5F5F5]">
                  <span>{s.deviceId || s.id}</span>
                  <span className="text-[#D4AF37]">{s.status}</span>
                </div>
                <div className="text-[#A0A0A0]">Org: {s.organisationId} · Expires: {new Date(s.expiresAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>

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
