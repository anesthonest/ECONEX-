/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V18.0 - Unified System Navigation & Consolidated Platform Shell
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { Component, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { OfflineProvider } from './context/OfflineContext.tsx';
import { ExperienceProvider } from './context/ExperienceContext.tsx';
import {
  EconexBreadcrumbs,
  EconexDesktopSidebar,
  EconexMobileBottomNav,
  EconexMobileDrawer,
  EconexTopBar,
} from './components/layout/EconexNavigation.tsx';
import {
  getNavItemById,
  hasRolePermission,
  resolveRouteToNavItem,
} from './navigation/navigationRegistry.ts';
import { GlobalCommandSearch } from './components/ux/GlobalCommandSearch.tsx';
import { EconexHomeView } from './components/v151/EconexHomeView.tsx';
import { GuidedOnboardingWizard } from './components/v151/GuidedOnboardingWizard.tsx';
import { PaymentSimulatorModal } from './components/modals/PaymentSimulatorModal.tsx';
import { OfflineSyncDrawer } from './components/modals/OfflineSyncDrawer.tsx';
import { AuthModal } from './components/modals/AuthModal.tsx';
import { NotificationCenterModal } from './components/modals/NotificationCenterModal.tsx';
import {
  Order,
  TradeContract,
  CommodityPriceObservation,
  Warehouse,
  WarehouseReceipt,
  FinancialProduct,
  SavingsGroup,
  InsuranceClaim,
  AgriculturalVoucher,
  EarlyWarningAlert,
  NotificationItem,
} from './types/index.ts';
import { api } from './services/apiClient.ts';

// V19 Code-Split Lazy Modules to reduce Vite build memory and initial bundle weight
const TaskNotificationCenterView = lazy(() =>
  import('./components/v18/TaskNotificationCenterView.tsx').then((m) => ({ default: m.TaskNotificationCenterView }))
);
const V18SystemControlCenter = lazy(() =>
  import('./components/V18SystemControlCenter.tsx').then((m) => ({ default: m.V18SystemControlCenter }))
);
const V19DiagnosticsControlCenter = lazy(() =>
  import('./components/V19DiagnosticsControlCenter.tsx').then((m) => ({ default: m.V19DiagnosticsControlCenter }))
);
const V20EconomicOperationsHub = lazy(() =>
  import('./components/v20/V20EconomicOperationsHub.tsx').then((m) => ({ default: m.V20EconomicOperationsHub }))
);
const V20PilotControlView = lazy(() =>
  import('./components/v20/V20PilotControlView.tsx').then((m) => ({ default: m.V20PilotControlView }))
);
const FarmerSimpleView = lazy(() =>
  import('./components/v151/FarmerSimpleView.tsx').then((m) => ({ default: m.FarmerSimpleView }))
);
const BusinessSimpleView = lazy(() =>
  import('./components/v151/BusinessSimpleView.tsx').then((m) => ({ default: m.BusinessSimpleView }))
);
const MarketplaceVisualView = lazy(() =>
  import('./components/v151/MarketplaceVisualView.tsx').then((m) => ({ default: m.MarketplaceVisualView }))
);
const FinancialSimpleView = lazy(() =>
  import('./components/v151/FinancialSimpleView.tsx').then((m) => ({ default: m.FinancialSimpleView }))
);
const HelpCentreView = lazy(() =>
  import('./components/v151/HelpCentreView.tsx').then((m) => ({ default: m.HelpCentreView }))
);
const MessagesSimpleView = lazy(() =>
  import('./components/v151/AccountMessagesView.tsx').then((m) => ({ default: m.MessagesSimpleView }))
);
const AccountSettingsView = lazy(() =>
  import('./components/v151/AccountMessagesView.tsx').then((m) => ({ default: m.AccountSettingsView }))
);
const FarmerView = lazy(() =>
  import('./components/modules/FarmerView.tsx').then((m) => ({ default: m.FarmerView }))
);
const MarketplaceView = lazy(() =>
  import('./components/modules/MarketplaceView.tsx').then((m) => ({ default: m.MarketplaceView }))
);
const OrderManagementView = lazy(() =>
  import('./components/modules/OrderManagementView.tsx').then((m) => ({ default: m.OrderManagementView }))
);
const BuyerView = lazy(() =>
  import('./components/modules/BuyerView.tsx').then((m) => ({ default: m.BuyerView }))
);
const AgroDealerView = lazy(() =>
  import('./components/modules/AgroDealerView.tsx').then((m) => ({ default: m.AgroDealerView }))
);
const LogisticsView = lazy(() =>
  import('./components/modules/LogisticsView.tsx').then((m) => ({ default: m.LogisticsView }))
);
const CooperativeView = lazy(() =>
  import('./components/modules/CooperativeView.tsx').then((m) => ({ default: m.CooperativeView }))
);
const AdminView = lazy(() =>
  import('./components/modules/AdminView.tsx').then((m) => ({ default: m.AdminView }))
);
const SystemVerificationView = lazy(() =>
  import('./components/modules/SystemVerificationView.tsx').then((m) => ({ default: m.SystemVerificationView }))
);
const TradeContractsView = lazy(() =>
  import('./components/modules/TradeContractsView.tsx').then((m) => ({ default: m.TradeContractsView }))
);
const PriceIntelligenceView = lazy(() =>
  import('./components/modules/PriceIntelligenceView.tsx').then((m) => ({ default: m.PriceIntelligenceView }))
);
const ProductTraceabilityView = lazy(() =>
  import('./components/modules/ProductTraceabilityView.tsx').then((m) => ({ default: m.ProductTraceabilityView }))
);
const WarehousesView = lazy(() =>
  import('./components/modules/WarehousesView.tsx').then((m) => ({ default: m.WarehousesView }))
);
const FinanceResilienceView = lazy(() =>
  import('./components/modules/FinanceResilienceView.tsx').then((m) => ({ default: m.FinanceResilienceView }))
);
const AiEconomicEngineView = lazy(() =>
  import('./components/modules/AiEconomicEngineView.tsx').then((m) => ({ default: m.AiEconomicEngineView }))
);
const InstitutionalDashboardView = lazy(() =>
  import('./components/modules/InstitutionalDashboardView.tsx').then((m) => ({ default: m.InstitutionalDashboardView }))
);
const MoneyOrchestrationView = lazy(() => import('./components/modules/MoneyOrchestrationView.tsx'));
const RegionalTradeView = lazy(() => import('./components/modules/RegionalTradeView.tsx'));
const InstitutionalWorkspacesView = lazy(() => import('./components/modules/InstitutionalWorkspacesView.tsx'));
const DeveloperEcosystemView = lazy(() => import('./components/modules/DeveloperEcosystemView.tsx'));
const ComplianceRiskView = lazy(() => import('./components/modules/ComplianceRiskView.tsx'));
const CrossBorderTradeView = lazy(() => import('./components/modules/CrossBorderTradeView.tsx'));
const CorridorLogisticsView = lazy(() => import('./components/modules/CorridorLogisticsView.tsx'));
const IndustrialValueChainView = lazy(() => import('./components/modules/IndustrialValueChainView.tsx'));
const ResilienceDisruptionView = lazy(() => import('./components/modules/ResilienceDisruptionView.tsx'));
const OpportunityDiscoveryView = lazy(() => import('./components/modules/OpportunityDiscoveryView.tsx'));
const OperationsCenterView = lazy(() => import('./components/modules/OperationsCenterView.tsx'));
const RegionalObservatoryView = lazy(() => import('./components/modules/RegionalObservatoryView.tsx'));
const EventStreamView = lazy(() => import('./components/modules/EventStreamView.tsx'));
const AutonomousForecastingView = lazy(() => import('./components/modules/AutonomousForecastingView.tsx'));
const PerformanceTestingView = lazy(() => import('./components/modules/PerformanceTestingView.tsx'));
const UniversalOverviewView = lazy(() =>
  import('./components/modules/UniversalOverviewView.tsx').then((m) => ({ default: m.UniversalOverviewView }))
);
const UniversalAccountingView = lazy(() =>
  import('./components/modules/UniversalAccountingView.tsx').then((m) => ({ default: m.UniversalAccountingView }))
);
const CommercialRevenueView = lazy(() =>
  import('./components/modules/CommercialRevenueView.tsx').then((m) => ({ default: m.CommercialRevenueView }))
);
const IntegrationAdaptersView = lazy(() =>
  import('./components/modules/IntegrationAdaptersView.tsx').then((m) => ({ default: m.IntegrationAdaptersView }))
);
const FraudAndJurisdictionView = lazy(() =>
  import('./components/modules/FraudAndJurisdictionView.tsx').then((m) => ({ default: m.FraudAndJurisdictionView }))
);
const UniversalMoneyView = lazy(() =>
  import('./components/modules/UniversalMoneyView.tsx').then((m) => ({ default: m.UniversalMoneyView }))
);
const UniversalCommerceView = lazy(() =>
  import('./components/modules/UniversalCommerceView.tsx').then((m) => ({ default: m.UniversalCommerceView }))
);
const CapitalAndInvestmentView = lazy(() =>
  import('./components/modules/CapitalAndInvestmentView.tsx').then((m) => ({ default: m.CapitalAndInvestmentView }))
);
const WorkAndIncomeView = lazy(() =>
  import('./components/modules/WorkAndIncomeView.tsx').then((m) => ({ default: m.WorkAndIncomeView }))
);
const PublicEconomyView = lazy(() =>
  import('./components/modules/PublicEconomyView.tsx').then((m) => ({ default: m.PublicEconomyView }))
);
const TrustAndIdentityView = lazy(() =>
  import('./components/modules/TrustAndIdentityView.tsx').then((m) => ({ default: m.TrustAndIdentityView }))
);
const UniversalIntelligenceView = lazy(() =>
  import('./components/modules/UniversalIntelligenceView.tsx').then((m) => ({ default: m.UniversalIntelligenceView }))
);
const EconomicNetworkView = lazy(() =>
  import('./components/EconomicNetworkView.tsx').then((m) => ({ default: m.EconomicNetworkView }))
);
const DiscoveryMatchingView = lazy(() =>
  import('./components/DiscoveryMatchingView.tsx').then((m) => ({ default: m.DiscoveryMatchingView }))
);
const WorkflowOrchestrationView = lazy(() =>
  import('./components/WorkflowOrchestrationView.tsx').then((m) => ({ default: m.WorkflowOrchestrationView }))
);
const AgreementsAutomationView = lazy(() =>
  import('./components/AgreementsAutomationView.tsx').then((m) => ({ default: m.AgreementsAutomationView }))
);
const GlobalFederationView = lazy(() =>
  import('./components/GlobalFederationView.tsx').then((m) => ({ default: m.GlobalFederationView }))
);
const GlobalTreasuryReconciliationView = lazy(() =>
  import('./components/GlobalTreasuryReconciliationView.tsx').then((m) => ({ default: m.GlobalTreasuryReconciliationView }))
);
const GlobalExecutionOperationsView = lazy(() =>
  import('./components/GlobalExecutionOperationsView.tsx').then((m) => ({ default: m.GlobalExecutionOperationsView }))
);
const GlobalNetworkScaleView = lazy(() =>
  import('./components/GlobalNetworkScaleView.tsx').then((m) => ({ default: m.GlobalNetworkScaleView }))
);
const GlobalEconomicIntelligenceView = lazy(() =>
  import('./components/GlobalEconomicIntelligenceView.tsx').then((m) => ({ default: m.GlobalEconomicIntelligenceView }))
);
const V13InfrastructureWorkspaceView = lazy(() =>
  import('./components/V13InfrastructureWorkspaceView.tsx').then((m) => ({ default: m.V13InfrastructureWorkspaceView }))
);
const V14GlobalOperationsView = lazy(() =>
  import('./components/V14GlobalOperationsView.tsx').then((m) => ({ default: m.V14GlobalOperationsView }))
);
const V16OperationsControlCenter = lazy(() =>
  import('./components/V16OperationsControlCenter.tsx').then((m) => ({ default: m.V16OperationsControlCenter }))
);
const V17NetworkControlCenter = lazy(() =>
  import('./components/V17NetworkControlCenter.tsx').then((m) => ({ default: m.V17NetworkControlCenter }))
);

const TOTAL_VERIFICATION_TESTS = 1725;

function ModuleLoadingFallback() {
  return (
    <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-2">
      <div className="text-xs font-mono text-[#D4AF37]">LOADING MODULE</div>
      <p className="text-sm text-[#A0A0A0]">Loading ECONEX workspace module cleanly...</p>
    </div>
  );
}

class RouteErrorBoundary extends Component<
  { children: React.ReactNode; routeKey: string; onResetHome: () => void },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode; routeKey: string; onResetHome: () => void }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected rendering error' };
  }

  componentDidUpdate(prevProps: { routeKey: string }) {
    if (prevProps.routeKey !== this.props.routeKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4">
          <div className="text-xs font-mono text-red-400">MODULE RECOVERY GUARD</div>
          <h1 className="text-lg font-display font-bold text-[#F5F5F5]">
            This screen encountered an unexpected problem
          </h1>
          <p className="text-sm text-[#A0A0A0]">
            {this.state.errorMessage || 'Please return to Home or retry loading this module.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-sm text-[#F5F5F5] cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                this.props.onResetHome();
              }}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotFoundView({
  unknownPath,
  onReturnHome,
  onOpenSearch,
}: {
  unknownPath: string;
  onReturnHome: () => void;
  onOpenSearch: () => void;
}) {
  return (
    <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4">
      <div className="text-xs font-mono text-[#D4AF37]">404 · PAGE NOT FOUND</div>
      <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
        We could not find that ECONEX page
      </h1>
      <p className="text-sm text-[#A0A0A0]">
        No registered module matches <span className="font-mono text-[#F5F5F5]">{unknownPath}</span>.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onOpenSearch}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#0a0a0c] text-sm text-[#F5F5F5] hover:border-[#D4AF37] cursor-pointer"
        >
          Search Modules
        </button>
        <button
          type="button"
          onClick={onReturnHome}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

function UnauthorizedView({
  moduleLabel,
  requiredRoles,
  currentRole,
  onReturnHome,
}: {
  moduleLabel: string;
  requiredRoles: string[];
  currentRole: string;
  onReturnHome: () => void;
}) {
  return (
    <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4">
      <div className="text-xs font-mono text-amber-400">403 · ACCESS RESTRICTED</div>
      <h1 className="text-xl font-display font-bold text-[#F5F5F5]">
        Permission required for {moduleLabel}
      </h1>
      <p className="text-sm text-[#A0A0A0]">
        Your active role (<strong className="text-[#F5F5F5]">{currentRole}</strong>) does not have access to this workspace.
        Authorized roles: <span className="font-mono text-xs text-[#D4AF37]">{requiredRoles.join(', ')}</span>.
      </p>
      <button
        type="button"
        onClick={onReturnHome}
        className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
      >
        Return to Home
      </button>
    </div>
  );
}

function MainAppShell() {
  const { currentUser, role, authError, isLoading: authLoading, refreshUsers } = useAuth();
  const [unknownPath, setUnknownPath] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const res = resolveRouteToNavItem(window.location.pathname);
    return res.isUnknown ? res.normalizedPath : null;
  });
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home';
    const res = resolveRouteToNavItem(window.location.pathname);
    return res.item ? res.item.id : 'home';
  });
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [offlineDrawerOpen, setOfflineDrawerOpen] = useState<boolean>(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [helpPrefill, setHelpPrefill] = useState<string>('');

  // Shared V2+ Data State (preserved cleanly for all views)
  const [contracts, setContracts] = useState<TradeContract[]>([]);
  const [priceObservations, setPriceObservations] = useState<CommodityPriceObservation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseReceipts, setWarehouseReceipts] = useState<WarehouseReceipt[]>([]);
  const [financialProducts, setFinancialProducts] = useState<FinancialProduct[]>([]);
  const [savingsGroups, setSavingsGroups] = useState<SavingsGroup[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<InsuranceClaim[]>([]);
  const [vouchers, setVouchers] = useState<AgriculturalVoucher[]>([]);
  const [earlyWarnings, setEarlyWarnings] = useState<EarlyWarningAlert[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadV2Data = async () => {
    try {
      const [
        contractsRes,
        pricesRes,
        warehousesRes,
        receiptsRes,
        financeRes,
        savingsRes,
        claimsRes,
        vouchersRes,
        alertsRes,
        notifsRes,
      ] = await Promise.all([
        api.getContracts(),
        api.getPriceObservations(),
        api.getWarehouses(),
        api.getWarehouseReceipts(),
        api.getFinancialProducts(),
        api.getSavingsGroups(),
        api.getInsuranceClaims(),
        api.getVouchers(),
        api.getEarlyWarnings(),
        api.getNotifications(),
      ]);

      if (contractsRes) setContracts(contractsRes);
      if (pricesRes.data) setPriceObservations(pricesRes.data);
      if (warehousesRes) setWarehouses(warehousesRes);
      if (receiptsRes) setWarehouseReceipts(receiptsRes);
      if (financeRes) setFinancialProducts(financeRes);
      if (savingsRes) setSavingsGroups(savingsRes);
      if (claimsRes) setInsuranceClaims(claimsRes);
      if (vouchersRes) setVouchers(vouchersRes);
      if (alertsRes) setEarlyWarnings(alertsRes);
      if (notifsRes) setNotifications(notifsRes);
    } catch {
      // Non-fatal initial background refresh
    }
  };

  useEffect(() => {
    loadV2Data();
  }, [currentUser?.id]);

  const navigateToTab = useCallback((nextTabId: string, pushHistory = true) => {
    const resolvedItem = getNavItemById(nextTabId);
    if (!resolvedItem) {
      setUnknownPath(`/${nextTabId}`);
      return;
    }

    setUnknownPath(null);
    setActiveTabState((prev) => {
      if (prev && prev !== nextTabId) {
        setTabHistory((h) => [...h.slice(-19), prev]);
      }
      return nextTabId;
    });

    if (typeof window !== 'undefined') {
      const targetPath = resolvedItem.route;
      if (window.location.pathname !== targetPath) {
        if (pushHistory) window.history.pushState({ tabId: nextTabId }, '', targetPath);
        else window.history.replaceState({ tabId: nextTabId }, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const handleGoBack = useCallback(() => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory((h) => h.slice(0, -1));
      const item = getNavItemById(prev);
      setUnknownPath(null);
      setActiveTabState(prev);
      if (typeof window !== 'undefined' && item) {
        window.history.pushState({ tabId: prev }, '', item.route);
      }
    } else {
      navigateToTab('home');
    }
  }, [tabHistory, navigateToTab]);

  // Browser back/forward popstate listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      const res = resolveRouteToNavItem(window.location.pathname);
      if (res.isUnknown || !res.item) {
        setUnknownPath(res.normalizedPath);
      } else {
        setUnknownPath(null);
        setActiveTabState(res.item.id);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Global Search keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const activeNavItem = getNavItemById(activeTab);
  const isRoleAuthorized = activeNavItem ? hasRolePermission(activeNavItem, role) : true;

  const renderDashboardByRole = () => {
    switch (role) {
      case 'FARMER':
        return (
          <FarmerView
            onNavigateToMarketplace={() => navigateToTab('explore')}
            onNavigateToOrders={() => navigateToTab('activity')}
          />
        );
      case 'BUYER':
        return (
          <BuyerView
            onNavigateToMarketplace={() => navigateToTab('explore')}
            onNavigateToOrders={() => navigateToTab('activity')}
            onOpenPaymentModal={(ord) => setPaymentModalOrder(ord)}
          />
        );
      case 'AGRO_DEALER':
        return <AgroDealerView />;
      case 'COOPERATIVE_ADMIN':
        return (
          <CooperativeView
            onNavigateToMarketplace={() => navigateToTab('explore')}
            onNavigateToOrders={() => navigateToTab('activity')}
          />
        );
      case 'TRANSPORTER':
        return <LogisticsView />;
      case 'PLATFORM_ADMIN':
        return <AdminView />;
      default:
        return (
          <FarmerView
            onNavigateToMarketplace={() => navigateToTab('explore')}
            onNavigateToOrders={() => navigateToTab('activity')}
          />
        );
    }
  };

  const renderAuthorizedModule = () => {
    if (unknownPath) {
      return (
        <NotFoundView
          unknownPath={unknownPath}
          onReturnHome={() => navigateToTab('home')}
          onOpenSearch={() => setSearchOpen(true)}
        />
      );
    }

    if (activeNavItem && !isRoleAuthorized) {
      return (
        <UnauthorizedView
          moduleLabel={activeNavItem.label}
          requiredRoles={activeNavItem.requiredRoles}
          currentRole={role}
          onReturnHome={() => navigateToTab('home')}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <EconexHomeView
            onNavigate={(tab) => navigateToTab(tab)}
            onStartOnboarding={() => setOnboardingOpen(true)}
            onOpenOfflineSync={() => setOfflineDrawerOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        );
      case 'tasks':
        return (
          <TaskNotificationCenterView
            onNavigateTab={(tab) => navigateToTab(tab)}
            onRefreshNotifications={loadV2Data}
          />
        );
      case 'explore':
        return (
          <MarketplaceVisualView
            onOrderCreated={() => navigateToTab('activity')}
            onNavigate={(tab) => navigateToTab(tab)}
          />
        );
      case 'farmer-simple':
        return <FarmerSimpleView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'farmer-ops':
        return (
          <FarmerView
            onNavigateToMarketplace={() => navigateToTab('explore')}
            onNavigateToOrders={() => navigateToTab('activity')}
          />
        );
      case 'buyer-ops':
        return (
          <BuyerView
            onNavigateToMarketplace={() => navigateToTab('explore')}
            onNavigateToOrders={() => navigateToTab('activity')}
            onOpenPaymentModal={(ord) => setPaymentModalOrder(ord)}
          />
        );
      case 'agro-dealer':
        return <AgroDealerView />;
      case 'cooperatives':
        return (
          <CooperativeView
            onNavigateToMarketplace={() => navigateToTab('explore')}
            onNavigateToOrders={() => navigateToTab('activity')}
          />
        );
      case 'business-simple':
        return <BusinessSimpleView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'activity':
      case 'orders':
        return <OrderManagementView onOpenPaymentModal={(order) => setPaymentModalOrder(order)} />;
      case 'payments':
        return (
          <FinancialSimpleView
            onOpenPaymentModal={(order) => setPaymentModalOrder(order)}
            onReportDispute={(subj) => {
              setHelpPrefill(subj);
              navigateToTab('help');
            }}
          />
        );
      case 'prices-simple':
      case 'prices':
        return currentUser ? (
          <PriceIntelligenceView
            currentUser={currentUser}
            observations={priceObservations}
            onRefresh={loadV2Data}
          />
        ) : (
          <ModuleLoadingFallback />
        );
      case 'messages':
        return <MessagesSimpleView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'account':
        return (
          <AccountSettingsView
            onStartOnboarding={() => setOnboardingOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={(tab) => navigateToTab(tab)}
          />
        );
      case 'help':
        return (
          <HelpCentreView
            onNavigate={(tab) => navigateToTab(tab)}
            prefillSubject={helpPrefill}
          />
        );
      case 'operations-hub':
        return <V20EconomicOperationsHub onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v20-pilots':
        return <V20PilotControlView onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'v18-control-center':
        return <V18SystemControlCenter onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'v19-diagnostics':
        return <V19DiagnosticsControlCenter onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'v17-control-center':
        return <V17NetworkControlCenter onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'v16-control-center':
        return <V16OperationsControlCenter onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'global-operations':
        return <V14GlobalOperationsView onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'v13-infrastructure':
        return <V13InfrastructureWorkspaceView onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'global-intelligence':
        return <GlobalEconomicIntelligenceView />;
      case 'global-network':
        return <GlobalNetworkScaleView />;
      case 'global-execution':
        return <GlobalExecutionOperationsView />;
      case 'global-federation':
        return <GlobalFederationView />;
      case 'global-treasury':
        return <GlobalTreasuryReconciliationView />;
      case 'economic-network':
        return <EconomicNetworkView />;
      case 'discovery-matching':
        return <DiscoveryMatchingView />;
      case 'workflow-orchestration':
        return <WorkflowOrchestrationView />;
      case 'agreements-automation':
        return <AgreementsAutomationView />;
      case 'universal-overview':
        return <UniversalOverviewView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'accounting-ledger':
        return <UniversalAccountingView />;
      case 'commercial-revenue':
        return <CommercialRevenueView />;
      case 'integration-adapters':
        return <IntegrationAdaptersView />;
      case 'fraud-jurisdiction':
        return <FraudAndJurisdictionView />;
      case 'universal-money':
        return <UniversalMoneyView />;
      case 'universal-commerce':
        return <UniversalCommerceView />;
      case 'capital-investment':
        return <CapitalAndInvestmentView />;
      case 'work-income':
        return <WorkAndIncomeView />;
      case 'public-economy':
        return <PublicEconomyView />;
      case 'trust-identity':
        return <TrustAndIdentityView />;
      case 'universal-intelligence':
        return <UniversalIntelligenceView />;
      case 'dashboard':
        return renderDashboardByRole();
      case 'marketplace':
        return <MarketplaceView onOrderCreated={() => navigateToTab('activity')} />;
      case 'money':
        return <MoneyOrchestrationView />;
      case 'contracts':
        return currentUser ? (
          <TradeContractsView
            currentUser={currentUser}
            contracts={contracts}
            onRefresh={loadV2Data}
          />
        ) : (
          <ModuleLoadingFallback />
        );
      case 'regional':
        return <RegionalTradeView />;
      case 'workspaces':
        return <InstitutionalWorkspacesView />;
      case 'traceability':
        return currentUser ? <ProductTraceabilityView currentUser={currentUser} /> : <ModuleLoadingFallback />;
      case 'warehouses':
        return currentUser ? (
          <WarehousesView
            currentUser={currentUser}
            warehouses={warehouses}
            receipts={warehouseReceipts}
            onRefresh={loadV2Data}
          />
        ) : (
          <ModuleLoadingFallback />
        );
      case 'finance':
        return currentUser ? (
          <FinanceResilienceView
            currentUser={currentUser}
            financialProducts={financialProducts}
            savingsGroups={savingsGroups}
            insuranceClaims={insuranceClaims}
            vouchers={vouchers}
            onRefresh={loadV2Data}
          />
        ) : (
          <ModuleLoadingFallback />
        );
      case 'cross-border':
        return <CrossBorderTradeView currentUser={currentUser} />;
      case 'corridors':
        return <CorridorLogisticsView currentUser={currentUser} />;
      case 'industry':
        return <IndustrialValueChainView currentUser={currentUser} />;
      case 'resilience':
        return <ResilienceDisruptionView currentUser={currentUser} />;
      case 'opportunities':
        return <OpportunityDiscoveryView currentUser={currentUser} />;
      case 'logistics':
        return <LogisticsView />;
      case 'developer':
        return <DeveloperEcosystemView />;
      case 'compliance':
        return <ComplianceRiskView />;
      case 'ai-engine':
        return currentUser ? <AiEconomicEngineView currentUser={currentUser} /> : <ModuleLoadingFallback />;
      case 'institutional':
        return currentUser ? (
          <InstitutionalDashboardView
            currentUser={currentUser}
            alerts={earlyWarnings}
            onRefresh={loadV2Data}
          />
        ) : (
          <ModuleLoadingFallback />
        );
      case 'admin':
        return <AdminView />;
      case 'operations':
        return <OperationsCenterView />;
      case 'observatory':
        return <RegionalObservatoryView />;
      case 'events':
        return <EventStreamView />;
      case 'forecasting':
        return <AutonomousForecastingView />;
      case 'performance':
        return <PerformanceTestingView />;
      case 'tests':
        return <SystemVerificationView />;
      default:
        return (
          <NotFoundView
            unknownPath={`/${activeTab}`}
            onReturnHome={() => navigateToTab('home')}
            onOpenSearch={() => setSearchOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#F5F5F5] pb-16 lg:pb-0">
      <a
        href="#econex-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#D4AF37] focus:text-[#050505] focus:font-semibold"
      >
        Skip to main content
      </a>

      <EconexTopBar
        activeTab={activeTab}
        setActiveTab={(t) => navigateToTab(t)}
        unreadCount={unreadNotifsCount}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        totalTestsCount={TOTAL_VERIFICATION_TESTS}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <EconexDesktopSidebar
          activeTab={activeTab}
          setActiveTab={(t) => navigateToTab(t)}
          unreadCount={unreadNotifsCount}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          totalTestsCount={TOTAL_VERIFICATION_TESTS}
        />

        <main id="econex-main-content" className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
          <EconexBreadcrumbs
            activeTab={activeTab}
            setActiveTab={(t) => navigateToTab(t)}
            onGoBack={handleGoBack}
            canGoBack={tabHistory.length > 0 || activeTab !== 'home'}
          />

          {authError && (
            <div
              role="alert"
              className="mb-5 p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-xs sm:text-sm text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="font-semibold text-amber-300">Server Connection Recovery Needed: </span>
                <span>{authError}</span>
              </div>
              <button
                type="button"
                onClick={() => refreshUsers()}
                disabled={authLoading}
                className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer shrink-0"
              >
                {authLoading ? 'Reconnecting...' : 'Retry Connection'}
              </button>
            </div>
          )}

          <RouteErrorBoundary
            routeKey={`${activeTab}:${unknownPath || ''}`}
            onResetHome={() => navigateToTab('home')}
          >
            <Suspense fallback={<ModuleLoadingFallback />}>
              {renderAuthorizedModule()}
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>

      <EconexMobileBottomNav
        activeTab={activeTab}
        setActiveTab={(t) => navigateToTab(t)}
        unreadCount={unreadNotifsCount}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <EconexMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={(t) => navigateToTab(t)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <GlobalCommandSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigateTab={(t) => navigateToTab(t)}
      />

      {/* Modals */}
      <GuidedOnboardingWizard
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onFinish={() => navigateToTab('home')}
      />

      {paymentModalOrder && (
        <PaymentSimulatorModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onPaymentSuccess={() => {
            setPaymentModalOrder(null);
            navigateToTab('activity');
          }}
        />
      )}

      <OfflineSyncDrawer
        isOpen={offlineDrawerOpen}
        onClose={() => setOfflineDrawerOpen(false)}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {notificationModalOpen && (
        <NotificationCenterModal
          notifications={notifications}
          onClose={() => setNotificationModalOpen(false)}
          onRefresh={loadV2Data}
        />
      )}

      {/* Clean ECONEX Corporate Footer */}
      <footer className="bg-[#0a0a0c] border-t border-[#27272a] py-6 text-xs text-[#A0A0A0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-display font-bold text-sm text-[#F5F5F5] tracking-wide">
              ECONEX <span className="text-[#D4AF37] font-normal text-xs ml-1">V20.0</span>
            </div>
            <p className="text-xs text-[#A0A0A0]">Universal Economic Operating System</p>
            <p className="text-xs text-[#A0A0A0]">
              Developed under <strong className="text-[#F5F5F5]">VINEXSAH TECHNOLOGIES</strong>. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <button type="button" onClick={() => navigateToTab('tasks')} className="hover:text-[#D4AF37] cursor-pointer">
              Tasks &amp; Alerts
            </button>
            <button type="button" onClick={() => setSearchOpen(true)} className="hover:text-[#D4AF37] cursor-pointer">
              Global Search
            </button>
            <button type="button" onClick={() => navigateToTab('help')} className="hover:text-[#D4AF37] cursor-pointer">
              Help Centre
            </button>
            <button type="button" onClick={() => setOnboardingOpen(true)} className="hover:text-[#D4AF37] cursor-pointer">
              Guided Setup
            </button>
            <button type="button" onClick={() => navigateToTab('account')} className="hover:text-[#D4AF37] cursor-pointer">
              Language &amp; Accessibility
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppWithExperience() {
  const { role } = useAuth();
  return (
    <ExperienceProvider userRole={role}>
      <MainAppShell />
    </ExperienceProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <AppWithExperience />
      </OfflineProvider>
    </AuthProvider>
  );
}
