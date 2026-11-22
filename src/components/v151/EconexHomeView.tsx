/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Simple Human-Centred Home Experience
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Tag,
  Briefcase,
  Users,
  Building2,
  CreditCard,
  HelpCircle,
  Bell,
  Sparkles,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Order, EconomicOpportunity, NotificationItem } from '../../types/index.ts';
import {
  UserWelcomeCard,
  PrimaryActionButton,
  OfflineStatusIndicator,
  EmptyState,
  ErrorRecoveryPanel,
} from '../ux/CorePrimitives.tsx';
import { OrderStatusCard, OpportunityCard } from '../ux/DomainCards.tsx';
import { VoiceHelpButton, VoiceCommandIntent, speakTextOutLoud } from '../ux/VoiceHelpButton.tsx';
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
  const { mode, language, t } = useExperience();
  const [orders, setOrders] = useState<Order[]>([]);
  const [opportunities, setOpportunities] = useState<EconomicOpportunity[]>([]);
  const [notices, setNotices] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordList, oppList, notifList] = await Promise.all([
        ApiClient.getOrders().catch(() => []),
        ApiClient.getEconomicOpportunities().catch(() => []),
        ApiClient.getNotifications(currentUser?.id).catch(() => []),
      ]);
      setOrders(Array.isArray(ordList) ? ordList : []);
      setOpportunities(Array.isArray(oppList) ? oppList : []);
      setNotices(Array.isArray(notifList) ? notifList : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [currentUser?.id]);

  const firstName = (currentUser?.name || 'Friend').split(' ')[0];
  const roleHumanLabel =
    role === 'FARMER'
      ? 'Farmer'
      : role === 'BUYER'
        ? 'Buyer & Trader'
        : role === 'AGRO_DEALER'
          ? 'Agro-Dealer'
          : role === 'COOPERATIVE_ADMIN'
            ? 'Cooperative'
            : role === 'TRANSPORTER'
              ? 'Transport Partner'
              : 'Platform Administrator';

  const myOrders = orders
    .filter((o) => o.buyerId === currentUser?.id || o.sellerId === currentUser?.id || role === 'PLATFORM_ADMIN')
    .slice(0, 3);

  const handleVoiceIntent = (intent: VoiceCommandIntent) => {
    if (intent === 'MARKET_PRICES') onNavigate('prices-simple');
    else if (intent === 'SELL_PRODUCT') onNavigate('farmer-simple');
    else if (intent === 'FIND_BUYERS') onNavigate('explore');
    else if (intent === 'MY_ORDERS') onNavigate('activity');
    else if (intent === 'CHECK_PAYMENT') onNavigate('payments');
    else if (intent === 'REGISTER_BUSINESS') onNavigate('business-simple');
    else if (intent === 'FIND_TRANSPORT') onNavigate('logistics');
  };

  const welcomeSpeech = `Welcome ${firstName}. You are using ECONEX in ${roleHumanLabel} mode in ${currentUser?.district || 'Uganda'}. You have ${myOrders.length} active orders and ${opportunities.length} opportunities open today.`;

  return (
    <div className="space-y-6">
      <OfflineStatusIndicator onOpenSync={onOpenOfflineSync} />

      <UserWelcomeCard
        firstName={firstName}
        roleLabel={roleHumanLabel}
        district={currentUser?.district || 'Uganda'}
        verified={currentUser?.isVerified}
        onSpeakWelcome={() => speakTextOutLoud(welcomeSpeech, language)}
      />

      {error !== null && (
        <ErrorRecoveryPanel
          error={error}
          isAdmin={role === 'PLATFORM_ADMIN'}
          onRetry={loadHomeData}
          onSignIn={onOpenAuth}
          onOpenHelp={() => onNavigate('help')}
        />
      )}

      {/* Voice Assistant & Workspace Mode Quick Strip */}
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
        </div>
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs sm:text-sm text-[#C0C0C0] hover:text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
        >
          <Sliders size={15} className="text-[#D4AF37]" aria-hidden="true" />
          <span>Mode: {mode} · Accessibility &amp; Language</span>
        </button>
      </div>

      {/* 6 Primary Human Actions */}
      <section aria-label="Main actions" className="space-y-3">
        <h2 className="text-lg font-semibold text-[#F5F5F5]">Choose what you want to do</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <PrimaryActionButton
            variant="gold"
            fullWidth
            icon={<ShoppingBag size={22} aria-hidden="true" />}
            label={t('action_buy')}
            description="Browse trusted produce, goods, and farm inputs"
            onClick={() => onNavigate('explore')}
          />
          <PrimaryActionButton
            variant="surface"
            fullWidth
            icon={<Tag size={22} className="text-[#D4AF37]" aria-hidden="true" />}
            label={t('action_sell')}
            description="List crops or products in 7 easy steps"
            onClick={() => onNavigate('farmer-simple')}
          />
          <PrimaryActionButton
            variant="surface"
            fullWidth
            icon={<Briefcase size={22} className="text-[#D4AF37]" aria-hidden="true" />}
            label={t('action_work')}
            description="Open contracts, buyers, and tenders"
            onClick={() => onNavigate('opportunities')}
          />
          <PrimaryActionButton
            variant="surface"
            fullWidth
            icon={<Users size={22} className="text-[#D4AF37]" aria-hidden="true" />}
            label={t('action_buyers')}
            description="Check today's market prices & matching buyers"
            onClick={() => onNavigate('farmer-simple')}
          />
          <PrimaryActionButton
            variant="surface"
            fullWidth
            icon={<Building2 size={22} className="text-[#D4AF37]" aria-hidden="true" />}
            label={t('action_business')}
            description="Manage customer orders, stock, and sales"
            onClick={() => onNavigate('business-simple')}
          />
          <PrimaryActionButton
            variant="surface"
            fullWidth
            icon={<CreditCard size={22} className="text-[#D4AF37]" aria-hidden="true" />}
            label={t('action_transactions')}
            description="Check payments sent, received, or pending"
            onClick={() => onNavigate('payments')}
          />
        </div>
      </section>

      {/* Unified V22 Universal Economy, V20 Operations & V21 Field / Onboarding Entry */}
      <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#F5F5F5]">
              Universal Multi-Sector Economic Operating System (28+ Sectors)
            </h2>
            <p className="text-sm text-[#A0A0A0]">
              Coordinate goods, services, artisans, rentals, RFQs, milestone projects, invoicing, and field operations across every legitimate sector.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('v22-discover')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] font-medium text-sm cursor-pointer"
            >
              28+ Sectors
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v22-marketplace')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#F5F5F5] font-medium text-sm cursor-pointer"
            >
              Marketplace 2.0
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v22-overview')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm hover:bg-[#e5bf43] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Open Universal Economy Hub</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#27272a]">
          <button
            type="button"
            onClick={() => onNavigate('v22-businesses')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] text-xs cursor-pointer"
          >
            Businesses &amp; Artisans
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v22-procurement')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] text-xs cursor-pointer"
          >
            Procurement &amp; Projects
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v22-finance-intel')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] text-xs cursor-pointer"
          >
            Invoicing, FX &amp; AI Assistant
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v21-field-ops')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] text-xs cursor-pointer"
          >
            Field Operations
          </button>
          <button
            type="button"
            onClick={() => onNavigate('v21-onboarding')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] text-xs cursor-pointer"
          >
            Register &amp; Verify
          </button>
          <button
            type="button"
            onClick={() => onNavigate('operations-hub')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-[#C0C0C0] hover:text-[#F5F5F5] text-xs cursor-pointer"
          >
            Operations Hub
          </button>
        </div>
      </section>

      {/* Optional Business Profile Prompt (for ordinary individuals/farmers) */}
      {role === 'FARMER' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#F5F5F5]">Sell or manage a shop, cooperative, or enterprise?</h2>
            <p className="text-sm text-[#A0A0A0]">
              You can use your personal account right now. Create a Business Profile whenever you are ready.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('business-simple')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#D4AF37] text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Open Business Workspace</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* Two-Column Recent Activity + Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3" aria-label="My recent orders">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">{t('recent_activity')}</h2>
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
              description="When you buy produce, tools, or receive an order from a buyer, you can track every step right here."
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
                  actionLabel="View details"
                  onAction={() => onNavigate('activity')}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3" aria-label="Important notices and help">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Important Notices</h2>
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="text-sm text-[#D4AF37] hover:underline font-medium cursor-pointer"
            >
              Messages
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

      {/* New Opportunities Strip */}
      {opportunities.length > 0 && (
        <section className="space-y-3" aria-label="New opportunities">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">New Opportunities Near You</h2>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-sm text-[#D4AF37] hover:underline font-medium cursor-pointer"
            >
              View all opportunities
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.slice(0, 3).map((opp) => (
              <OpportunityCard
                key={opp.id}
                title={opp.title}
                organization={opp.keyOfftakers?.[0] || opp.targetSector || 'Regional Network Partner'}
                location={opp.targetRegion || opp.corridorOrDistrict || 'Uganda & EAC'}
                category={String(opp.opportunityType || opp.category || 'OPPORTUNITY').replace(/_/g, ' ')}
                summary={opp.rationale || 'Open trade and supply opportunity verified on the network.'}
                onApply={() => onNavigate('opportunities')}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
