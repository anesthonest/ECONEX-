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
const V21FieldOperationsApp = lazy(() =>
  import('./components/v21/V21FieldOperationsApp.tsx').then((m) => ({ default: m.V21FieldOperationsApp }))
);
const V21OnboardingHub = lazy(() =>
  import('./components/v21/V21OnboardingHub.tsx').then((m) => ({ default: m.V21OnboardingHub }))
);
const V21PilotCommandCentre = lazy(() =>
  import('./components/v21/V21PilotCommandCentre.tsx').then((m) => ({ default: m.V21PilotCommandCentre }))
);
const V22UniversalDashboard = lazy(() =>
  import('./components/v22/V22UniversalDashboard.tsx').then((m) => ({ default: m.V22UniversalDashboard }))
);
const V22DiscoverEconomyView = lazy(() =>
  import('./components/v22/V22DiscoverEconomyView.tsx').then((m) => ({ default: m.V22DiscoverEconomyView }))
);
const V22UniversalMarketplaceView = lazy(() =>
  import('./components/v22/V22UniversalMarketplaceView.tsx').then((m) => ({ default: m.V22UniversalMarketplaceView }))
);
const V22BusinessWorkspaceView = lazy(() =>
  import('./components/v22/V22BusinessWorkspaceView.tsx').then((m) => ({ default: m.V22BusinessWorkspaceView }))
);
const V22ProcurementProjectsView = lazy(() =>
  import('./components/v22/V22ProcurementProjectsView.tsx').then((m) => ({ default: m.V22ProcurementProjectsView }))
);
const V22FinancialIntelligenceView = lazy(() =>
  import('./components/v22/V22FinancialIntelligenceView.tsx').then((m) => ({ default: m.V22FinancialIntelligenceView }))
);
const V23UniversalWalletDashboard = lazy(() =>
  import('./components/v23/V23UniversalWalletDashboard.tsx').then((m) => ({ default: m.V23UniversalWalletDashboard }))
);
const V23MerchantAcceptanceView = lazy(() =>
  import('./components/v23/V23MerchantAcceptanceView.tsx').then((m) => ({ default: m.V23MerchantAcceptanceView }))
);
const V23CardsInfrastructureView = lazy(() =>
  import('./components/v23/V23CardsInfrastructureView.tsx').then((m) => ({ default: m.V23CardsInfrastructureView }))
);
const V23CrossCountryNetworkView = lazy(() =>
  import('./components/v23/V23CrossCountryNetworkView.tsx').then((m) => ({ default: m.V23CrossCountryNetworkView }))
);
const V23WalletOperationsAdminView = lazy(() =>
  import('./components/v23/V23WalletOperationsAdminView.tsx').then((m) => ({ default: m.V23WalletOperationsAdminView }))
);
const V24ExecutionNetworkHub = lazy(() =>
  import('./components/v24/V24ExecutionNetworkHub.tsx').then((m) => ({ default: m.V24ExecutionNetworkHub }))
);
const V24MarketplaceRfqContractsView = lazy(() =>
  import('./components/v24/V24MarketplaceRfqContractsView.tsx').then((m) => ({ default: m.V24MarketplaceRfqContractsView }))
);
const V24OrdersInventoryManufacturingView = lazy(() =>
  import('./components/v24/V24OrdersInventoryManufacturingView.tsx').then((m) => ({ default: m.V24OrdersInventoryManufacturingView }))
);
const V24ProcurementLogisticsProjectsView = lazy(() =>
  import('./components/v24/V24ProcurementLogisticsProjectsView.tsx').then((m) => ({ default: m.V24ProcurementLogisticsProjectsView }))
);
const V24BusinessDocumentsExecutionView = lazy(() =>
  import('./components/v24/V24BusinessDocumentsExecutionView.tsx').then((m) => ({ default: m.V24BusinessDocumentsExecutionView }))
);
const V25InfrastructureCommandCentreView = lazy(() =>
  import('./components/v25/V25InfrastructureCommandCentreView.tsx').then((m) => ({ default: m.V25InfrastructureCommandCentreView }))
);
const V25EnterpriseOrgIdentityView = lazy(() =>
  import('./components/v25/V25EnterpriseOrgIdentityView.tsx').then((m) => ({ default: m.V25EnterpriseOrgIdentityView }))
);
const V25PostgresMigrationOpsView = lazy(() =>
  import('./components/v25/V25PostgresMigrationOpsView.tsx').then((m) => ({ default: m.V25PostgresMigrationOpsView }))
);
const V25DeveloperPlatformIntegrationsView = lazy(() =>
  import('./components/v25/V25DeveloperPlatformIntegrationsView.tsx').then((m) => ({ default: m.V25DeveloperPlatformIntegrationsView }))
);
const V26ActivationCommandHub = lazy(() =>
  import('./components/v26/V26ActivationCommandHub.tsx').then((m) => ({ default: m.V26ActivationCommandHub }))
);
const V26DocumentsReportsVaultView = lazy(() =>
  import('./components/v26/V26DocumentsReportsVaultView.tsx').then((m) => ({ default: m.V26DocumentsReportsVaultView }))
);
const V26InteractiveAuditAndRoutesView = lazy(() =>
  import('./components/v26/V26InteractiveAuditAndRoutesView.tsx').then((m) => ({ default: m.V26InteractiveAuditAndRoutesView }))
);
const V27EconomicNetworkHub = lazy(() =>
  import('./components/v27/V27EconomicNetworkHub.tsx').then((m) => ({ default: m.V27EconomicNetworkHub }))
);
const V27TrustDiscoveryMatchingView = lazy(() =>
  import('./components/v27/V27TrustDiscoveryMatchingView.tsx').then((m) => ({ default: m.V27TrustDiscoveryMatchingView }))
);
const V27OpportunitiesCrmGrowthView = lazy(() =>
  import('./components/v27/V27OpportunitiesCrmGrowthView.tsx').then((m) => ({ default: m.V27OpportunitiesCrmGrowthView }))
);
const V27IntelligenceAiPilotView = lazy(() =>
  import('./components/v27/V27IntelligenceAiPilotView.tsx').then((m) => ({ default: m.V27IntelligenceAiPilotView }))
);
const V27FieldIntegrationSecurityView = lazy(() =>
  import('./components/v27/V27FieldIntegrationSecurityView.tsx').then((m) => ({ default: m.V27FieldIntegrationSecurityView }))
);
const V28ExecutionWorkspaceView = lazy(() =>
  import('./components/v28/V28ExecutionWorkspaceView.tsx').then((m) => ({ default: m.V28ExecutionWorkspaceView }))
);
const V28ContractsProcurementView = lazy(() =>
  import('./components/v28/V28ContractsProcurementView.tsx').then((m) => ({ default: m.V28ContractsProcurementView }))
);
const V28FulfilmentCrossBorderView = lazy(() =>
  import('./components/v28/V28FulfilmentCrossBorderView.tsx').then((m) => ({ default: m.V28FulfilmentCrossBorderView }))
);
const V28InteroperabilityEventsView = lazy(() =>
  import('./components/v28/V28InteroperabilityEventsView.tsx').then((m) => ({ default: m.V28InteroperabilityEventsView }))
);
const V28ContinentalIntelligenceOpsView = lazy(() =>
  import('./components/v28/V28ContinentalIntelligenceOpsView.tsx').then((m) => ({ default: m.V28ContinentalIntelligenceOpsView }))
);
const V28FieldRepoEngineeringView = lazy(() =>
  import('./components/v28/V28FieldRepoEngineeringView.tsx').then((m) => ({ default: m.V28FieldRepoEngineeringView }))
);
const V30FinancialNetworkHub = lazy(() =>
  import('./components/v30/V30FinancialNetworkHub.tsx').then((m) => ({ default: m.V30FinancialNetworkHub }))
);
const V30CorridorsAgentsLiquidityView = lazy(() =>
  import('./components/v30/V30CorridorsAgentsLiquidityView.tsx').then((m) => ({ default: m.V30CorridorsAgentsLiquidityView }))
);
const V30BusinessDisputesComplianceView = lazy(() =>
  import('./components/v30/V30BusinessDisputesComplianceView.tsx').then((m) => ({ default: m.V30BusinessDisputesComplianceView }))
);
const V30UniversalWalletAndCardsView = lazy(() =>
  import('./components/v30/V30UniversalWalletAndCardsView.tsx').then((m) => ({ default: m.V30UniversalWalletAndCardsView }))
);
const V30DeveloperGitHubIntegrationsView = lazy(() =>
  import('./components/v30/V30DeveloperGitHubIntegrationsView.tsx').then((m) => ({ default: m.V30DeveloperGitHubIntegrationsView }))
);
const V31SovereignInfrastructureHub = lazy(() =>
  import('./components/v31/V31SovereignInfrastructureHub.tsx').then((m) => ({ default: m.V31SovereignInfrastructureHub }))
);
const V31ConnectivityCertificationView = lazy(() =>
  import('./components/v31/V31ConnectivityCertificationView.tsx').then((m) => ({ default: m.V31ConnectivityCertificationView }))
);
const V31ContinentalEnterpriseView = lazy(() =>
  import('./components/v31/V31ContinentalEnterpriseView.tsx').then((m) => ({ default: m.V31ContinentalEnterpriseView }))
);
const V31PilotSecurityIntelligenceView = lazy(() =>
  import('./components/v31/V31PilotSecurityIntelligenceView.tsx').then((m) => ({ default: m.V31PilotSecurityIntelligenceView }))
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

const TOTAL_VERIFICATION_TESTS = 9800;

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
            onNavigate={(tab) => navigateToTab(tab)}
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
      case 'v21-field-ops':
        return <V21FieldOperationsApp onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v21-onboarding':
        return <V21OnboardingHub onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v21-command-centre':
        return <V21PilotCommandCentre onNavigateTab={(tab) => navigateToTab(tab)} />;
      case 'v22-overview':
        return <V22UniversalDashboard onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v22-discover':
        return <V22DiscoverEconomyView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v22-marketplace':
        return <V22UniversalMarketplaceView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v22-businesses':
        return <V22BusinessWorkspaceView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v22-procurement':
        return <V22ProcurementProjectsView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v22-finance-intel':
        return <V22FinancialIntelligenceView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v23-wallet':
        return <V23UniversalWalletDashboard onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v23-merchant':
        return <V23MerchantAcceptanceView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v23-cards':
        return <V23CardsInfrastructureView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v23-country-network':
        return <V23CrossCountryNetworkView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v23-wallet-admin':
        return <V23WalletOperationsAdminView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v24-execution-hub':
        return <V24ExecutionNetworkHub onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v24-marketplace-rfq':
        return <V24MarketplaceRfqContractsView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v24-orders-inventory':
        return <V24OrdersInventoryManufacturingView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v24-procurement-logistics':
        return <V24ProcurementLogisticsProjectsView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v24-documents-settlement':
        return <V24BusinessDocumentsExecutionView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v25-command-centre':
        return <V25InfrastructureCommandCentreView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v25-enterprise-org':
        return <V25EnterpriseOrgIdentityView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v25-postgres-migration':
        return <V25PostgresMigrationOpsView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v25-developer-platform':
        return <V25DeveloperPlatformIntegrationsView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v26-hub':
        return <V26ActivationCommandHub onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v26-reports':
        return <V26DocumentsReportsVaultView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v26-audit':
        return <V26InteractiveAuditAndRoutesView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v27-network-hub':
        return <V27EconomicNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="DIRECTORY" />;
      case 'v27-participants':
        return <V27EconomicNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="DIRECTORY" />;
      case 'v27-relationships':
        return <V27EconomicNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="RELATIONSHIPS" />;
      case 'v27-analytics':
        return <V27EconomicNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="GROWTH" />;
      case 'v27-discover':
        return <V27TrustDiscoveryMatchingView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="DISCOVER" />;
      case 'v27-matching':
        return <V27TrustDiscoveryMatchingView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="MATCHING" />;
      case 'v27-trust':
        return <V27TrustDiscoveryMatchingView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="TRUST" />;
      case 'v27-suppliers':
        return <V27TrustDiscoveryMatchingView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="SUPPLIERS" />;
      case 'v27-buyers':
        return <V27TrustDiscoveryMatchingView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="BUYERS" />;
      case 'v27-opportunities':
        return <V27OpportunitiesCrmGrowthView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="OPPORTUNITIES" />;
      case 'v27-crm':
        return <V27OpportunitiesCrmGrowthView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CRM" />;
      case 'v27-economic-intelligence':
        return <V27IntelligenceAiPilotView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="INTELLIGENCE" />;
      case 'v27-pilot-operations':
        return <V27IntelligenceAiPilotView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="PILOTS" />;
      case 'v27-field-operations':
        return <V27FieldIntegrationSecurityView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="FIELD" />;
      case 'v27-integration-centre':
        return <V27FieldIntegrationSecurityView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="PARTNERS" />;
      case 'v28-execution-hub':
        return <V28ExecutionWorkspaceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="EXECUTION" />;
      case 'v28-workspace':
        return <V28ExecutionWorkspaceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="WORKSPACE" />;
      case 'v28-contracts':
        return <V28ContractsProcurementView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CONTRACTS" />;
      case 'v28-obligations':
        return <V28ContractsProcurementView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="OBLIGATIONS" />;
      case 'v28-procurement':
        return <V28ContractsProcurementView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="PROCUREMENT" />;
      case 'v28-procurement-approvals':
        return <V28ContractsProcurementView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="APPROVALS" />;
      case 'v28-fulfilment':
        return <V28FulfilmentCrossBorderView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="FULFILMENT" />;
      case 'v28-inventory':
        return <V28FulfilmentCrossBorderView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="INVENTORY" />;
      case 'v28-cross-border':
        return <V28FulfilmentCrossBorderView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CROSS_BORDER" />;
      case 'v28-wallet-coordination':
        return <V28FulfilmentCrossBorderView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="WALLET" />;
      case 'v28-interoperability':
        return <V28InteroperabilityEventsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="INTEROPERABILITY" />;
      case 'v28-events':
        return <V28InteroperabilityEventsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="EVENTS" />;
      case 'v28-vault':
        return <V28InteroperabilityEventsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="VAULT" />;
      case 'v28-intelligence':
        return <V28ContinentalIntelligenceOpsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="INTELLIGENCE" />;
      case 'v28-ai-orchestrator':
        return <V28ContinentalIntelligenceOpsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="AI" />;
      case 'v28-control-centre':
        return <V28ContinentalIntelligenceOpsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CONTROL_CENTRE" />;
      case 'v28-dual-approvals':
        return <V28ContinentalIntelligenceOpsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="DUAL_APPROVALS" />;
      case 'v28-field-offline':
        return <V28FieldRepoEngineeringView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="FIELD" />;
      case 'v28-security':
        return <V28FieldRepoEngineeringView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="SECURITY" />;
      case 'v28-repository-health':
        return <V28FieldRepoEngineeringView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="REPO_HEALTH" />;
      case 'v30-financial-network':
        return <V30FinancialNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="OVERVIEW" />;
      case 'v30-providers':
        return <V30FinancialNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="PROVIDERS" />;
      case 'v30-interoperability':
        return <V30FinancialNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="INTEROP" />;
      case 'v30-routing':
        return <V30FinancialNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="ROUTING" />;
      case 'v30-transactions':
        return <V30FinancialNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="TRANSACTIONS" />;
      case 'v30-reconciliation':
        return <V30FinancialNetworkHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="RECONCILIATION" />;
      case 'v30-corridors':
        return <V30CorridorsAgentsLiquidityView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CORRIDORS" />;
      case 'v30-currency':
        return <V30CorridorsAgentsLiquidityView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CURRENCY" />;
      case 'v30-agents':
        return <V30CorridorsAgentsLiquidityView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="AGENTS" />;
      case 'v30-liquidity':
        return <V30CorridorsAgentsLiquidityView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="LIQUIDITY" />;
      case 'v30-ussd':
        return <V30CorridorsAgentsLiquidityView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="USSD" />;
      case 'v30-business-finance':
        return <V30BusinessDisputesComplianceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="BUSINESS_FINANCE" />;
      case 'v30-disputes':
        return <V30BusinessDisputesComplianceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="DISPUTES" />;
      case 'v30-wallet-universal':
        return <V30UniversalWalletAndCardsView onNavigate={(tab) => navigateToTab(tab)} />;
      case 'v30-fraud-protection':
        return <V30BusinessDisputesComplianceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="FRAUD" />;
      case 'v30-regulatory-readiness':
        return <V30BusinessDisputesComplianceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="REGULATORY" />;
      case 'v30-ai-intelligence':
        return <V30DeveloperGitHubIntegrationsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="AI" />;
      case 'v30-resilience':
        return <V30DeveloperGitHubIntegrationsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="RESILIENCE" />;
      case 'v30-developer-github':
        return <V30DeveloperGitHubIntegrationsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="GITHUB" />;
      case 'v30-developer-integrations':
        return <V30DeveloperGitHubIntegrationsView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="INTEGRATIONS" />;
      case 'v31-infrastructure-hub':
        return <V31SovereignInfrastructureHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="OVERVIEW" />;
      case 'v31-postgres-migration':
      case 'v31-dr-continuity':
        return <V31SovereignInfrastructureHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="POSTGRES" />;
      case 'v31-data-residency':
        return <V31SovereignInfrastructureHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="RESIDENCY" />;
      case 'v31-github-cicd':
        return <V31SovereignInfrastructureHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CICD" />;
      case 'v31-readiness-openapi':
        return <V31SovereignInfrastructureHub onNavigate={(tab) => navigateToTab(tab)} initialSubTab="READINESS" />;
      case 'v31-provider-certification':
        return <V31ConnectivityCertificationView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CERTIFICATION" />;
      case 'v31-connectivity-telemetry':
        return <V31ConnectivityCertificationView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="CREDENTIALS" />;
      case 'v31-country-framework':
        return <V31ContinentalEnterpriseView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="COUNTRIES" />;
      case 'v31-enterprise-hierarchy':
        return <V31ContinentalEnterpriseView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="ENTERPRISE" />;
      case 'v31-commercial-workflows':
        return <V31ContinentalEnterpriseView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="WORKFLOWS" />;
      case 'v31-pilot-readiness':
        return <V31PilotSecurityIntelligenceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="PILOT" />;
      case 'v31-field-validation':
        return <V31PilotSecurityIntelligenceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="FIELD" />;
      case 'v31-security-sessions':
        return <V31PilotSecurityIntelligenceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="SECURITY" />;
      case 'v31-continental-intelligence':
        return <V31PilotSecurityIntelligenceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="INTELLIGENCE" />;
      case 'v31-ai-advisor':
        return <V31PilotSecurityIntelligenceView onNavigate={(tab) => navigateToTab(tab)} initialSubTab="AI" />;
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

      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-display font-bold text-sm text-[#F5F5F5] tracking-wide">
              ECONEX <span className="text-[#D4AF37] font-normal text-xs ml-1">V31.0</span>
            </div>
            <p className="text-xs text-[#A0A0A0]">Universal Economic Operating System</p>
            <p className="text-xs text-[#A0A0A0]">
              Developed under <strong className="text-[#F5F5F5]">VINEXSAH TECHNOLOGIES</strong>. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <button type="button" onClick={() => navigateToTab('v22-discover')} className="hover:text-[#D4AF37] cursor-pointer">
              Explore Sectors
            </button>
            <button type="button" onClick={() => navigateToTab('v22-marketplace')} className="hover:text-[#D4AF37] cursor-pointer">
              Marketplace
            </button>
            <button type="button" onClick={() => navigateToTab('opportunities')} className="hover:text-[#D4AF37] cursor-pointer">
              Opportunities
            </button>
            <button type="button" onClick={() => navigateToTab('tasks')} className="hover:text-[#D4AF37] cursor-pointer">
              Tasks &amp; Alerts
            </button>
            <button type="button" onClick={() => setSearchOpen(true)} className="hover:text-[#D4AF37] cursor-pointer">
              Search
            </button>
            <button type="button" onClick={() => navigateToTab('help')} className="hover:text-[#D4AF37] cursor-pointer">
              Help &amp; Support
            </button>
            <button type="button" onClick={() => setOnboardingOpen(true)} className="hover:text-[#D4AF37] cursor-pointer">
              Guided Setup
            </button>
            <button type="button" onClick={() => navigateToTab('account')} className="hover:text-[#D4AF37] cursor-pointer">
              Account &amp; Language
            </button>
            {role === 'PLATFORM_ADMIN' && (
              <>
                <button type="button" onClick={() => navigateToTab('v28-execution-hub')} className="text-[#D4AF37] hover:underline cursor-pointer">
                  Execution Hub
                </button>
                <button type="button" onClick={() => navigateToTab('v26-audit')} className="text-[#D4AF37] hover:underline cursor-pointer">
                  Route Audit
                </button>
                <button type="button" onClick={() => navigateToTab('tests')} className="text-[#D4AF37] hover:underline cursor-pointer">
                  System Tests
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppWithExperience() {
  const { role, currentUser } = useAuth();
  return (
    <ExperienceProvider userRole={role} userId={currentUser?.id}>
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
