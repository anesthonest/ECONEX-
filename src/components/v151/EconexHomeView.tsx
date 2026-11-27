/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V29.0 - Human-Centred Multi-Sector Home Experience
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag,
  Tag,
  Briefcase,
  Users,
  Building2,
  ClipboardCheck,
  Wrench,
  Wallet,
  HelpCircle,
  Bell,
  Sparkles,
  ArrowRight,
  Sliders,
  Globe,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience, EAC_ACTIVE_COUNTRIES } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Order, EconomicOpportunity, NotificationItem } from '../../types/index.ts';
import {
  UserWelcomeCard,
  OfflineStatusIndicator,
  EmptyState,
  ErrorRecoveryPanel,
} from '../ux/CorePrimitives.tsx';
import { OrderStatusCard, OpportunityCard, BusinessVisualCard } from '../ux/DomainCards.tsx';
import { VoiceHelpButton, VoiceCommandIntent, speakTextOutLoud } from '../ux/VoiceHelpButton.tsx';
import { EconexImage } from '../ux/EconexImage.tsx';
import { ECONEX_HERO_SLIDES } from '../../config/econexAssetManifest.ts';
import { formatShortDate } from '../../i18n/econexTranslations.ts';

interface Props {
  onNavigate: (tab: string) => void;
  onStartOnboarding: () => void;
  onOpenOfflineSync: () => void;
  onOpenAuth: () => void;
}

export const EconexHomeView: React.FC<Props> = ({
  onNavigate,
  onStartOnboarding,
  onOpenOfflineSync,
  onOpenAuth,
}) => {
  const { currentUser, role } = useAuth();
  const {
    mode,
    language,
    t,
    activeCountry,
    activeCurrency,
    activeWorkspaceId,
    setActiveCountry,
  } = useExperience();

  const [orders, setOrders] = useState<Order[]>([]);
  const [opportunities, setOpportunities] = useState<EconomicOpportunity[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [notices, setNotices] = useState<NotificationItem[]>([]);
  const [homeSummary, setHomeSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [heroIndex, setHeroIndex] = useState(0);
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const actor = { userId: currentUser?.id || role, userRole: role };
      const [ordList, oppList, notifList, v26Summary, bizRes] = await Promise.all([
        ApiClient.getOrders().catch(() => []),
        ApiClient.getEconomicOpportunities().catch(() => []),
        ApiClient.getNotifications(currentUser?.id).catch(() => []),
        ApiClient.v26GetHomeSummary({
          userId: currentUser?.id,
          userRole: role,
          organisationId: activeWorkspaceId,
          countryCode: activeCountry,
        }).catch(() => null),
        ApiClient.v22GetBusinesses(undefined, actor).catch(() => ({ businesses: [] })),
      ]);
      setOrders(Array.isArray(ordList) ? ordList : []);
      setOpportunities(Array.isArray(oppList) ? oppList : []);
      setNotices(Array.isArray(notifList) ? notifList : []);
      setHomeSummary(v26Summary);
      setBusinesses(Array.isArray(bizRes?.businesses) ? bizRes.businesses : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [currentUser?.id, role, activeCountry, activeWorkspaceId]);

  const firstName = (currentUser?.name || 'Friend').split(' ')[0];
  const roleHumanLabel =
    role === 'FARMER'
      ? 'Producer & Farmer'
      : role === 'BUYER'
        ? 'Buyer & Trader'
        : role === 'AGRO_DEALER'
          ? 'Supplier & Input Dealer'
          : role === 'COOPERATIVE_ADMIN'
            ? 'Cooperative'
            : role === 'TRANSPORTER'
              ? 'Transport Partner'
              : 'Platform Administrator';

  const myOrders = useMemo(
    () =>
      orders
        .filter((o) => o.buyerId === currentUser?.id || o.sellerId === currentUser?.id || role === 'PLATFORM_ADMIN')
        .slice(0, 3),
    [orders, currentUser?.id, role]
  );

  const opportunityLocations = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      const loc = o.corridorOrDistrict || o.targetRegion;
      if (loc) set.add(loc);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    if (districtFilter === 'ALL') return opportunities;
    return opportunities.filter(
      (o) => (o.corridorOrDistrict || o.targetRegion || '').toLowerCase() === districtFilter.toLowerCase()
    );
  }, [opportunities, districtFilter]);

  const handleVoiceIntent = (intent: VoiceCommandIntent) => {
    if (intent === 'MARKET_PRICES') onNavigate('prices-simple');
    else if (intent === 'SELL_PRODUCT') onNavigate('v22-marketplace');
    else if (intent === 'FIND_BUYERS') onNavigate('discovery-matching');
    else if (intent === 'MY_ORDERS') onNavigate('activity');
    else if (intent === 'CHECK_PAYMENT') onNavigate('payments');
    else if (intent === 'REGISTER_BUSINESS') onNavigate('business-simple');
    else if (intent === 'FIND_TRANSPORT') onNavigate('logistics');
  };

  const welcomeSpeech = `Welcome ${firstName}. You are using ECONEX in ${roleHumanLabel} mode in ${currentUser?.district || 'Uganda'}. You have ${myOrders.length} active orders and ${opportunities.length} open opportunities today.`;

  const activeSlide = ECONEX_HERO_SLIDES[heroIndex % ECONEX_HERO_SLIDES.length];
  const walletSub =
    homeSummary?.walletSummary?.subaccounts?.find((s: any) => s.currency === activeCurrency) ||
    homeSummary?.walletSummary?.subaccounts?.[0];
  const unreadNoticeCount = notices.filter((n) => !n.read).length;

  const quickActions = [
    {
      id: 'buy',
      icon: ShoppingBag,
      label: t('action_buy') || 'Buy Goods',
      desc: 'Browse trusted listings',
      tab: 'explore',
      primary: true,
    },
    {
      id: 'sell',
      icon: Tag,
      label: t('action_sell') || 'Sell & Offer',
      desc: 'Publish products or services',
      tab: 'v22-marketplace',
      primary: false,
    },
    {
      id: 'work',
      icon: Briefcase,
      label: t('action_work') || 'Find Work & Tenders',
      desc: 'Open contracts & RFQs',
      tab: 'opportunities',
      primary: false,
    },
    {
      id: 'buyers',
      icon: Users,
      label: t('action_buyers') || 'Find Partners',
      desc: 'Match verified buyers & suppliers',
      tab: 'discovery-matching',
      primary: false,
    },
    {
      id: 'business',
      icon: Building2,
      label: t('action_business') || 'My Business',
      desc: 'Orders, stock & profile',
      tab: 'business-simple',
      primary: false,
    },
    {
      id: 'procurement',
      icon: ClipboardCheck,
      label: 'Procurement',
      desc: 'Manage bids & projects',
      tab: 'v22-procurement',
      primary: false,
    },
    {
      id: 'services',
      icon: Wrench,
      label: 'Explore Sectors',
      desc: '28+ active economic sectors',
      tab: 'v22-discover',
      primary: false,
    },
    {
      id: 'wallet',
      icon: Wallet,
      label: 'Wallet & Payments',
      desc: 'Balances, escrow & history',
      tab: 'v23-wallet',
      primary: false,
    },
  ];

  return (
    <div className="space-y-6">
      <OfflineStatusIndicator onOpenSync={onOpenOfflineSync} />

      <UserWelcomeCard
        firstName={firstName}
        roleLabel={roleHumanLabel}
        district={`${currentUser?.district || 'Uganda'} (${activeCountry} · ${activeCurrency})`}
        verified={currentUser?.isVerified}
        onSpeakWelcome={() => speakTextOutLoud(welcomeSpeech, language)}
      />

      {/* Voice, Country Selector & Setup Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121212] border border-[#27272a] rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <VoiceHelpButton onNavigateIntent={handleVoiceIntent} summaryToSpeak={welcomeSpeech} />
          <button
            type="button"
            onClick={onStartOnboarding}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Guided Setup</span>
          </button>
          <label className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#C0C0C0] flex items-center gap-2">
            <Globe size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <span className="sr-only">Active Country</span>
            <select
              aria-label="Active Country & Currency"
              value={activeCountry}
              onChange={(e) => setActiveCountry(e.target.value, currentUser?.id, role)}
              className="bg-transparent text-xs font-semibold text-[#F5F5F5] focus:outline-none cursor-pointer"
            >
              {EAC_ACTIVE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#121212] text-[#F5F5F5]">
                  {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('account')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs sm:text-sm text-[#C0C0C0] hover:text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <Sliders size={15} className="text-[#D4AF37]" aria-hidden="true" />
            <span>View: {mode === 'SIMPLE' ? 'Simple' : mode === 'STANDARD' ? 'Standard' : mode === 'PROFESSIONAL' ? 'Enterprise' : 'Admin'} · Language</span>
          </button>
          {role === 'PLATFORM_ADMIN' && (
            <button
              type="button"
              onClick={() => onNavigate('v26-hub')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37]/60 text-xs sm:text-sm text-[#D4AF37] font-medium hover:bg-[#D4AF37] hover:text-[#050505] cursor-pointer transition-colors"
            >
              Admin Console
            </button>
          )}
        </div>
      </div>

      {error !== null && (
        <ErrorRecoveryPanel
          error={error}
          isAdmin={role === 'PLATFORM_ADMIN'}
          onRetry={loadHomeData}
          onSignIn={onOpenAuth}
          onOpenHelp={() => onNavigate('help')}
        />
      )}

      {/* Visual Hero Showcase Banner */}
      <section aria-label="ECONEX platform overview" className="relative rounded-2xl overflow-hidden border border-[#27272a] bg-[#121212]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-wider text-[#D4AF37]">
                Universal Economic Platform
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F5] leading-tight">
                One platform. Every sector. More opportunities.
              </h2>
              <p className="text-sm sm:text-base text-[#C0C0C0] leading-relaxed">
                Find verified suppliers, discover open buyers and tenders, track deliveries, and manage your business or household trade across East Africa.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('v22-discover')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold text-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Explore 28+ Sectors</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] font-medium text-sm cursor-pointer transition-colors"
                >
                  Find Opportunities
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#27272a]">
                {ECONEX_HERO_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setHeroIndex(idx)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs border transition-colors cursor-pointer ${
                      idx === heroIndex
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-medium'
                        : 'bg-[#181818] border-[#27272a] text-[#A0A0A0] hover:text-[#F5F5F5]'
                    }`}
                  >
                    {slide.caption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[240px] lg:min-h-[340px]">
            <EconexImage
              src={activeSlide.path}
              alt={activeSlide.alt}
              fallbackLabel={activeSlide.caption}
              aspectClassName="h-full w-full min-h-[240px]"
              overlayGradient
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 text-xs">
              <span className="text-[#F5F5F5] font-medium">{activeSlide.caption}</span>
              <span className="text-[#D4AF37] flex items-center gap-1">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>Verified Network</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Quick Actions Grid */}
      <section aria-label="Quick actions" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">What would you like to do today?</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => onNavigate(act.tab)}
                className={`min-h-[84px] p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer ${
                  act.primary
                    ? 'bg-[#D4AF37] border-[#D4AF37] text-[#050505] hover:bg-[#e5bf43]'
                    : 'bg-[#121212] border-[#27272a] hover:border-[#D4AF37]/60 text-[#F5F5F5]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon
                    size={20}
                    className={act.primary ? 'text-[#050505]' : 'text-[#D4AF37]'}
                    aria-hidden="true"
                  />
                  <ArrowRight
                    size={15}
                    className={act.primary ? 'text-[#050505]/70' : 'text-[#A0A0A0]'}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">{act.label}</div>
                  <div className={`text-xs mt-0.5 ${act.primary ? 'text-[#181818]' : 'text-[#A0A0A0]'}`}>
                    {act.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Grounded Activity at a Glance */}
      <section aria-label="Your activity at a glance" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#A0A0A0]">Your Active Orders</div>
          <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">
            {loading ? '—' : myOrders.length}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
          >
            Track deliveries
          </button>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#A0A0A0]">Open Opportunities</div>
          <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">
            {loading ? '—' : opportunities.length}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('opportunities')}
            className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
          >
            Browse tenders &amp; buyers
          </button>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#A0A0A0]">Registered Businesses</div>
          <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">
            {loading ? '—' : businesses.length}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('v22-businesses')}
            className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
          >
            Explore directory
          </button>
        </div>

        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#A0A0A0]">Sandbox Wallet ({activeCurrency})</div>
          <div className="text-2xl font-bold text-[#D4AF37] tabular-nums">
            {walletSub
              ? `${(Number(walletSub.availableBalanceMinor) / 100).toLocaleString()}`
              : '0'}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('v23-wallet')}
            className="text-xs text-[#C0C0C0] hover:text-[#D4AF37] cursor-pointer tabular-nums"
          >
            {unreadNoticeCount > 0 ? `${unreadNoticeCount} unread alerts · Open Wallet` : 'Open Wallet & Transfers'}
          </button>
        </div>
      </section>

      {/* Two-Column Recent Orders + Important Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3" aria-label="My recent orders">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">{t('recent_activity') || 'Recent Activity'}</h2>
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="text-sm text-[#D4AF37] hover:underline font-medium cursor-pointer"
            >
              See all orders
            </button>
          </div>

          {loading ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 text-sm text-[#A0A0A0]">
              Loading your latest orders...
            </div>
          ) : myOrders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={22} />}
              title="No orders yet"
              description="When you order goods, tools, or services—or receive an order from a buyer—you can follow every delivery step here."
              actionLabel="Browse Marketplace"
              onAction={() => onNavigate('explore')}
            />
          ) : (
            <div className="space-y-3">
              {myOrders.map((ord) => (
                <OrderStatusCard
                  key={ord.id}
                  reference={ord.orderNumber}
                  itemTitle={`${ord.productTitle} (${ord.quantity} ${ord.unit})`}
                  counterparty={ord.buyerId === currentUser?.id ? `Seller: ${ord.sellerName}` : `Buyer: ${ord.buyerName}`}
                  amount={ord.totalAmountUGX}
                  currency={ord.currency || 'UGX'}
                  dateIso={ord.createdAt}
                  rawStatus={ord.status}
                  showTimeline
                  actionLabel="View details"
                  onAction={() => onNavigate('activity')}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3" aria-label="Important notices and help">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Notices &amp; Support</h2>
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="text-sm text-[#D4AF37] hover:underline font-medium cursor-pointer"
            >
              All messages
            </button>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-3">
            {notices.length === 0 ? (
              <div className="text-sm text-[#A0A0A0] py-2">No new notices today.</div>
            ) : (
              notices.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-[#181818] border border-[#27272a] space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium">
                    <Bell size={13} aria-hidden="true" />
                    <span>{formatShortDate(n.timestamp, language)}</span>
                  </div>
                  <div className="text-sm font-medium text-[#F5F5F5]">{n.title}</div>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed">{n.body}</p>
                </div>
              ))
            )}

            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm font-medium text-[#F5F5F5] flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle size={17} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Need help? Open Help Centre</span>
            </button>
          </div>
        </section>
      </div>

      {/* Opportunities Near You (District-Filtered) */}
      {opportunities.length > 0 && (
        <section className="space-y-3" aria-label="Opportunities near you">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#F5F5F5]">Opportunities Near You</h2>
              {opportunityLocations.length > 0 && (
                <label className="inline-flex items-center gap-1.5 text-xs text-[#A0A0A0] bg-[#121212] border border-[#27272a] rounded-xl px-3 py-1.5">
                  <MapPin size={13} className="text-[#D4AF37]" aria-hidden="true" />
                  <span className="sr-only">Filter opportunities by district</span>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="bg-transparent text-xs text-[#F5F5F5] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-[#121212]">All Areas</option>
                    {opportunityLocations.map((loc) => (
                      <option key={loc} value={loc} className="bg-[#121212]">
                        {loc}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-sm text-[#D4AF37] hover:underline font-medium cursor-pointer"
            >
              View all opportunities
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpportunities.slice(0, 3).map((opp) => (
              <OpportunityCard
                key={opp.id}
                title={opp.title}
                organization={opp.keyOfftakers?.[0] || opp.targetSector || 'Regional Network Partner'}
                location={opp.targetRegion || opp.corridorOrDistrict || 'Uganda & EAC'}
                category={String(opp.opportunityType || opp.category || 'Opportunity').replace(/_/g, ' ')}
                summary={opp.rationale || 'Open commercial and supply opportunity verified on the network.'}
                onApply={() => onNavigate('opportunities')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Verified Businesses */}
      {businesses.length > 0 && (
        <section className="space-y-3" aria-label="Recommended businesses">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Featured Businesses &amp; Suppliers</h2>
            <button
              type="button"
              onClick={() => onNavigate('v22-businesses')}
              className="text-sm text-[#D4AF37] hover:underline font-medium cursor-pointer"
            >
              View business directory
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.slice(0, 3).map((biz: any) => (
              <BusinessVisualCard
                key={biz.id}
                name={biz.name}
                sectorLabel={String(biz.primarySectorCode || 'General Trade').replace(/_/g, ' ')}
                location={`${biz.district || 'Kampala'}${biz.countryCode ? `, ${biz.countryCode}` : ''}`}
                summary={biz.description || 'Registered commercial participant offering goods and services across the network.'}
                verified={Boolean(biz.verified)}
                actionLabel="Open Business Profile"
                onAction={() => onNavigate('v22-businesses')}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
