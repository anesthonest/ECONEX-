/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V2 - Expanded Frontend API Client
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import {
  UserProfile,
  Farm,
  FarmPlot,
  CropRecord,
  MarketplaceListing,
  Order,
  OrderStatus,
  Shipment,
  AgroDealerInput,
  OfflineQueueItem,
  CropAdvisoryResponse,
  AgriculturalVoucher,
  CommodityPriceObservation,
  TradeContract,
  ProductTraceabilityRecord,
  Warehouse,
  WarehouseReceipt,
  FinancialProduct,
  SavingsGroup,
  InsuranceClaim,
  EarlyWarningAlert,
  NotificationItem,
  AiAgentType,
  AiAgentResponse,
  SupportedCurrency,
  CurrencyMetadata,
  PaymentOrchestrationStatus,
  PaymentChannelProvider,
  OrchestratedPayment,
  LedgerEntry,
  CountryTenantConfig,
  InstitutionalWorkspace,
  DeveloperApplication,
  DeveloperWebhookDelivery,
  ComplianceRiskEvent,
  CrossBorderTrade,
  TradeDocumentRef,
  CrossBorderTradeStage,
  RegionalProcurementRfq,
  RfqQuotation,
  EconomicCorridor,
  CorridorShipment,
  IndustrialFacility,
  ProductionOrder,
  EconomicDisruptionIncident,
  EconomicOpportunity,
  OrganizationReputationScore,
  AetherEvent,
  OperationalIncident,
  AutomatedRemediationAction,
  DisasterRecoveryDrill,
  EconomicForecast,
  SystemTelemetrySnapshot,
  LoadTestResult,
  RegionalObservatoryMetric,
  EconomicParticipant,
  EconomicAsset,
  EconomicAccountReference,
  EconomicTransaction,
  EconomicTransactionType,
  EconomicObligation,
  EconomicContract,
  EconomicInstrumentReference,
  EconomicSettlement,
  EconomicExchangeRate,
  FxQuote,
  CommercialCatalogueItem,
  CommercialOrderV6,
  CommercialInvoice,
  CommercialDispute,
  CapitalFinancingApplication,
  InvestmentOpportunity,
  WorkContract,
  WorkTimesheet,
  PayrollRun,
  PublicTender,
  TaxDeclaration,
  EconomicIdentity,
  AiEconomicDomain,
  EconomicRelationship,
  EconomicDiscoveryListing,
  EconomicMatchResult,
  WorkflowInstance,
  UniversalTransactionRecord,
  ProgrammableEconomicAgreement,
  AutomationRulePolicy,
  AutomationExecutionRecord,
  UniversalPaymentProvider,
  FederationNetwork,
  FederationStatus,
  FederatedIdentityIssuer,
  FederatedIdentityClaim,
  InteroperabilityStandardRecord,
  MessageTranslationRecord,
  TreasuryPosition,
  ReconciliationBatch,
  ReconciliationException,
  DataTransferPolicy,
  DataExchangeLog,
  MultiRegionRecoveryEvent,
  EconomicExecution,
  InstitutionalProfile,
  EconomicAgreement,
  CommercialOrder,
  SupplyChainShipment,
  FinancialExecutionRecord,
  FinancialIntegrityReport,
  EconomicRiskAssessment,
  EconomicDispute,
  GovernedAutomationPolicy,
  AutomationApprovalQueueItem,
  SustainabilityPlan,
  TenantRecord,
  TenantMembership,
  ParticipantOnboardingApplication,
  BusinessWorkspaceProfile,
  BusinessCatalogItem,
  BusinessCommercialDoc,
  BusinessTaskItem,
  ParticipantRelationshipRecord,
  ConnectionRequestRecord,
  NetworkMarketplaceListing,
  V11ProcurementRequest,
  SupplierQualificationRecord,
  LogisticsCarrierProfile,
  VerifiedProviderProfile,
  RegisteredEcosystemApp,
  IndustrialCapacityRecord,
  WorkServiceOpportunity,
  NetworkAnalyticalInsight,
  GovernedAiAgentIdentity,
  AiAgentActionLog,
  TenantSubscriptionRecord,
  TenantBillingInvoice,
  V11PerformanceBenchmark,
  IntelligenceSource,
  EconomicObservation,
  EconomicIndicator,
  V12EconomicForecast,
  ForecastModel,
  EconomicAnomaly,
  V12EconomicEarlyWarning,
  V12EconomicOpportunity,
  EconomicScenario,
  ScenarioSimulationResult,
  BusinessImpactSimulation,
  EconomicRecommendation,
  IntelligenceAgentRun,
  IntelligenceAgentPolicy,
  ModelDriftEvent,
  IntelligenceAuditEvent,
  IntelligenceSubscriptionProduct,
  IntelligenceReport,
  IntelligenceReviewQueueItem,
  IntelligencePublicationRecord,
  V12BackgroundJob,
} from '../types/index.ts';

const OFFLINE_QUEUE_KEY = 'aros_offline_queue_v2';
const TOKEN_STORAGE_KEY = 'aros_auth_token_v2';


export class ApiClient {
  static getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  static setAuthToken(token: string) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  static clearAuthToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  private static getHeaders(customHeaders: Record<string, string> = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Auth & Sessions
  static async login(identifier: { email?: string; userId?: string; password?: string }): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(identifier),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    if (data.token) this.setAuthToken(data.token);
    return data;
  }

  static async register(data: any): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    const result = await res.json();
    if (result.token) this.setAuthToken(result.token);
    return result;
  }

  static async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST', headers: this.getHeaders() }).catch(() => {});
    this.clearAuthToken();
  }

  static async getSession(): Promise<{ user: UserProfile } | null> {
    const token = this.getAuthToken();
    if (!token) return null;
    const res = await fetch('/api/auth/session', { headers: this.getHeaders() });
    if (!res.ok) return null;
    return res.json();
  }

  private static async fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 15000
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const mergedSignal = init.signal || controller.signal;
      return await fetch(input, { ...init, signal: mergedSignal });
    } finally {
      clearTimeout(timer);
    }
  }

  static async getUsers(role?: string): Promise<UserProfile[]> {
    const url = role ? `/api/users?role=${role}` : '/api/users';
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await this.fetchWithTimeout(url, { headers: this.getHeaders() }, 10000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Unable to load user directory');
  }

  static async verifyUser(userId: string, status: string, actorId: string, notes?: string): Promise<UserProfile> {
    const res = await fetch(`/api/users/${userId}/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, actorId, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Verification failed');
    }
    return res.json();
  }

  // Organizations
  static async getOrganizations(): Promise<any[]> {
    const res = await fetch('/api/organizations', { headers: this.getHeaders() });
    return res.json();
  }

  static async createOrganization(data: any): Promise<any> {
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // Farms & Crops
  static async getFarms(farmerId?: string): Promise<Farm[]> {
    const url = farmerId ? `/api/farms?farmerId=${farmerId}` : '/api/farms';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async createFarm(farmData: Partial<Farm>): Promise<Farm> {
    const res = await fetch('/api/farms', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(farmData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create farm');
    }
    return res.json();
  }

  static async createPlot(farmId: string, plotData: Partial<FarmPlot>): Promise<FarmPlot> {
    const res = await fetch(`/api/farms/${farmId}/plots`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(plotData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create plot');
    }
    return res.json();
  }

  static async getCrops(farmerId?: string, farmId?: string): Promise<CropRecord[]> {
    const params = new URLSearchParams();
    if (farmerId) params.append('farmerId', farmerId);
    if (farmId) params.append('farmId', farmId);
    const res = await fetch(`/api/crops?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createCrop(cropData: Partial<CropRecord>): Promise<CropRecord> {
    const res = await fetch('/api/crops', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(cropData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record crop cultivation');
    }
    return res.json();
  }

  static async updateCrop(cropId: string, updates: Partial<CropRecord> & { newScoutNote?: string }): Promise<CropRecord> {
    const res = await fetch(`/api/crops/${cropId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update crop');
    }
    return res.json();
  }

  // Marketplace Listings
  static async getListings(filters: {
    q?: string;
    category?: string;
    district?: string;
    sellerId?: string;
    status?: string;
  } = {}): Promise<MarketplaceListing[]> {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.category) params.append('category', filters.category);
    if (filters.district) params.append('district', filters.district);
    if (filters.sellerId) params.append('sellerId', filters.sellerId);
    if (filters.status) params.append('status', filters.status);

    const res = await fetch(`/api/listings?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createListing(listingData: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(listingData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create listing');
    }
    return res.json();
  }

  static async deleteListing(id: string, actorId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/listings/${id}?actorId=${actorId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // Orders & State Machine
  static async getOrders(filters: {
    buyerId?: string;
    sellerId?: string;
    transporterId?: string;
    role?: string;
  } = {}): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters.buyerId) params.append('buyerId', filters.buyerId);
    if (filters.sellerId) params.append('sellerId', filters.sellerId);
    if (filters.transporterId) params.append('transporterId', filters.transporterId);
    if (filters.role) params.append('role', filters.role);

    const res = await fetch(`/api/orders?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createOrder(data: {
    buyerId: string;
    listingId: string;
    quantity: number;
    deliveryDistrict?: string;
    deliveryAddress?: string;
    specialInstructions?: string;
  }, idempotencyKey?: string): Promise<Order> {
    const customHeaders: Record<string, string> = {};
    if (idempotencyKey) customHeaders['Idempotency-Key'] = idempotencyKey;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Order placement failed');
    }
    return res.json();
  }

  static async transitionOrder(
    orderId: string,
    nextStatus: OrderStatus,
    actorId: string,
    notes?: string
  ): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/transition`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ nextStatus, actorId, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'State transition denied');
    }
    return res.json();
  }

  // V2: Vouchers
  static async getVouchers(beneficiaryId?: string): Promise<AgriculturalVoucher[]> {
    const url = beneficiaryId ? `/api/vouchers?beneficiaryId=${beneficiaryId}` : '/api/vouchers';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async issueVoucher(data: Partial<AgriculturalVoucher>): Promise<AgriculturalVoucher> {
    const res = await fetch('/api/vouchers/issue', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async redeemVoucher(voucherId: string, dealerId: string): Promise<AgriculturalVoucher> {
    const res = await fetch(`/api/vouchers/${voucherId}/redeem`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ dealerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to redeem voucher');
    }
    return res.json();
  }

  // V2: Price Intelligence & Matching
  static async getPrices(commodity?: string, district?: string): Promise<CommodityPriceObservation[]> {
    const params = new URLSearchParams();
    if (commodity) params.append('commodity', commodity);
    if (district) params.append('district', district);
    const res = await fetch(`/api/prices?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async recordPrice(data: Partial<CommodityPriceObservation>): Promise<CommodityPriceObservation> {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getMatchingRecommendations(): Promise<any[]> {
    const res = await fetch('/api/matching', { headers: this.getHeaders() });
    return res.json();
  }

  // V2: Trade Contracts
  static async getContracts(userId?: string): Promise<TradeContract[]> {
    const url = userId ? `/api/contracts?userId=${userId}` : '/api/contracts';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async createContract(data: Partial<TradeContract>): Promise<TradeContract> {
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async counterOfferContract(id: string, counterOfferPriceUGX: number, actorId: string, notes?: string): Promise<TradeContract> {
    const res = await fetch(`/api/contracts/${id}/counter-offer`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ counterOfferPriceUGX, actorId, notes }),
    });
    return res.json();
  }

  static async confirmContract(id: string, actorId: string): Promise<TradeContract> {
    const res = await fetch(`/api/contracts/${id}/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorId }),
    });
    return res.json();
  }

  // V2: Traceability
  static async getTraceabilityBatch(batchNumber: string): Promise<ProductTraceabilityRecord> {
    const res = await fetch(`/api/traceability/${encodeURIComponent(batchNumber)}`, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error('Traceability batch record not found');
    }
    return res.json();
  }

  // V2: Warehouses & Receipts
  static async getWarehouses(): Promise<Warehouse[]> {
    const res = await fetch('/api/warehouses', { headers: this.getHeaders() });
    return res.json();
  }

  static async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const res = await fetch('/api/warehouses', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getWarehouseReceipts(): Promise<WarehouseReceipt[]> {
    const res = await fetch('/api/warehouses/receipts', { headers: this.getHeaders() });
    return res.json();
  }

  static async issueWarehouseReceipt(data: Partial<WarehouseReceipt>): Promise<WarehouseReceipt> {
    const res = await fetch('/api/warehouses/receipts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // V2: Financial Products, Savings Groups & Insurance
  static async getFinancialProducts(): Promise<FinancialProduct[]> {
    const res = await fetch('/api/finance/products', { headers: this.getHeaders() });
    return res.json();
  }

  static async getSavingsGroups(): Promise<SavingsGroup[]> {
    const res = await fetch('/api/finance/savings-groups', { headers: this.getHeaders() });
    return res.json();
  }

  static async contributeSavingsGroup(id: string, amountUGX: number, memberName: string): Promise<SavingsGroup> {
    const res = await fetch(`/api/finance/savings-groups/${id}/contribute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amountUGX, memberName }),
    });
    return res.json();
  }

  static async getInsuranceClaims(): Promise<InsuranceClaim[]> {
    const res = await fetch('/api/insurance/claims', { headers: this.getHeaders() });
    return res.json();
  }

  static async submitInsuranceClaim(data: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
    const res = await fetch('/api/insurance/claims', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // V2: Early Warnings & Institutional
  static async getEarlyWarnings(): Promise<EarlyWarningAlert[]> {
    const res = await fetch('/api/institutional/early-warnings', { headers: this.getHeaders() });
    return res.json();
  }

  static async getMacroSummary(): Promise<any> {
    const res = await fetch('/api/institutional/macro-summary', { headers: this.getHeaders() });
    return res.json();
  }

  // V2: Shared Multi-Agent AI
  static async queryAiAgent(agentType: AiAgentType, prompt: string, contextData?: any): Promise<AiAgentResponse> {
    const res = await fetch('/api/ai/agent', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ agentType, prompt, contextData }),
    });
    if (!res.ok) {
      throw new Error('AI Agent query failed');
    }
    return res.json();
  }

  // Notifications
  static async getNotifications(userId?: string): Promise<NotificationItem[]> {
    const url = userId ? `/api/notifications?userId=${userId}` : '/api/notifications';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: this.getHeaders() });
  }

  // Logistics & Shipments
  static async getShipments(transporterId?: string, status?: string): Promise<Shipment[]> {
    const params = new URLSearchParams();
    if (transporterId) params.append('transporterId', transporterId);
    if (status) params.append('status', status);
    const res = await fetch(`/api/logistics/shipments?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async assignShipment(
    shipmentId: string,
    transporterId: string,
    vehicleRegistration?: string,
    vehicleType?: string
  ): Promise<Shipment> {
    const res = await fetch(`/api/logistics/shipments/${shipmentId}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ transporterId, vehicleRegistration, vehicleType }),
    });
    return res.json();
  }

  static async updateShipmentStatus(
    shipmentId: string,
    status: string,
    actorId: string,
    confirmPin?: string,
    notes?: string
  ): Promise<Shipment> {
    const res = await fetch(`/api/logistics/shipments/${shipmentId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, actorId, confirmPin, notes }),
    });
    return res.json();
  }

  // Agro Inputs
  static async getAgroInputs(filters: { category?: string; district?: string } = {}): Promise<AgroDealerInput[]> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.district) params.append('district', filters.district);
    const res = await fetch(`/api/agro-inputs?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createAgroInput(data: Partial<AgroDealerInput>): Promise<AgroDealerInput> {
    const res = await fetch('/api/agro-inputs', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // Payments (Test Mode Simulation)
  static async initiateTestPayment(orderId: string, payerPhone: string, provider: string) {
    const res = await fetch('/api/payments/initiate-test', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ orderId, payerPhone, provider }),
    });
    return res.json();
  }

  static async verifyTestPayment(orderId: string, paymentReference: string, provider: string, payerPhone: string) {
    const res = await fetch('/api/payments/verify-test', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ orderId, paymentReference, provider, payerPhone }),
    });
    return res.json();
  }

  // Weather & Crop Advisory
  static async getCropAdvisory(data: {
    cropName: string;
    district: string;
    growthStage: string;
    symptomsOrQuestion: string;
    imageBase64?: string;
  }): Promise<CropAdvisoryResponse> {
    const res = await fetch('/api/ai/advisory', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getWeather(district: string) {
    const res = await fetch(`/api/weather/${encodeURIComponent(district)}`, { headers: this.getHeaders() });
    return res.json();
  }

  // Admin Telemetry & Backups
  static async getAdminMetrics() {
    const res = await fetch('/api/admin/metrics', { headers: this.getHeaders() });
    return res.json();
  }

  static async getAuditLogs(limit = 50) {
    const res = await fetch(`/api/admin/audit-logs?limit=${limit}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async backupDatabase() {
    const res = await fetch('/api/admin/backup', { method: 'POST', headers: this.getHeaders() });
    return res.json();
  }

  static async exportDatabase(): Promise<{ data?: any; error?: string }> {
    try {
      const res = await fetch('/api/admin/database/export', { headers: this.getHeaders() });
      if (!res.ok) return { error: 'Export failed' };
      const data = await res.json();
      return { data };
    } catch (err: any) {
      return { error: err.message || 'Export failed' };
    }
  }

  static async getPriceObservations(commodity?: string, district?: string): Promise<{ data: CommodityPriceObservation[] }> {
    const data = await this.getPrices(commodity, district);
    return { data };
  }

  static async contributeVslaShare(data: { groupId: string; amountUgx: number; sharesCount: number }): Promise<{ data?: any; error?: string }> {
    try {
      const res = await fetch('/api/finance/vsla/contribute', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) return { error: resData.error || 'Contribution failed' };
      return { data: resData };
    } catch (err: any) {
      return { error: err.message || 'Contribution failed' };
    }
  }

  // Offline Storage Queue
  static getOfflineQueue(): OfflineQueueItem[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static queueOfflineItem(type: OfflineQueueItem['type'], payload: any): OfflineQueueItem {
    const item: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };
    const current = this.getOfflineQueue();
    current.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
    return item;
  }

  static async syncOfflineQueue(): Promise<{ syncedCount: number; remainingCount: number }> {
    const current = this.getOfflineQueue().filter((item) => item.status === 'PENDING');
    if (current.length === 0) {
      return { syncedCount: 0, remainingCount: 0 };
    }

    try {
      const res = await fetch('/api/offline/sync', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ items: current }),
      });
      const data = await res.json();

      const all = this.getOfflineQueue();
      const updated = all.filter((localItem) => {
        const syncedMatch = data.results?.find((r: any) => r.itemId === localItem.id && r.status === 'SYNCED');
        return !syncedMatch;
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));

      return {
        syncedCount: data.syncedCount || 0,
        remainingCount: updated.length,
      };
    } catch {
      return { syncedCount: 0, remainingCount: current.length };
    }
  }

  static clearOfflineQueue() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  // ==========================================
  // V3: FINANCIAL & MONEY ORCHESTRATION
  // ==========================================

  static async orchestratePayment(data: {
    idempotencyKey: string;
    orderId?: string;
    contractId?: string;
    payerId: string;
    payerName?: string;
    payerPhoneOrAccount?: string;
    payeeId: string;
    payeeName?: string;
    amount: number;
    currency?: SupportedCurrency;
    channel?: PaymentChannelProvider;
    autoConfirmSandbox?: boolean;
  }): Promise<OrchestratedPayment> {
    const res = await fetch('/api/money/orchestrate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to orchestrate payment (${res.status})`);
    }
    return res.json();
  }

  static async getOrchestratedPayments(params?: {
    payerId?: string;
    payeeId?: string;
    status?: PaymentOrchestrationStatus;
    channel?: PaymentChannelProvider;
  }): Promise<OrchestratedPayment[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`/api/money/payments${query ? `?${query}` : ''}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async getOrchestratedPayment(id: string): Promise<OrchestratedPayment> {
    const res = await fetch(`/api/money/payments/${id}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async sendWebhookSimulation(
    provider: string,
    payload: any,
    signature?: string,
    timestamp?: number
  ): Promise<{ success: boolean; paymentId?: string; status?: string; error?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getHeaders(),
    };
    if (signature) headers['x-aros-signature'] = signature;
    if (timestamp) headers['x-aros-timestamp'] = String(timestamp);

    const res = await fetch(`/api/money/webhooks/${provider}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async getLedgerEntries(): Promise<{
    totalEntries: number;
    allBalanced: boolean;
    totalVolumeUGX: number;
    entries: LedgerEntry[];
  }> {
    const res = await fetch('/api/money/ledger', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async reconcilePayment(data: {
    paymentId: string;
    providerReference?: string;
    notes?: string;
  }): Promise<{ success: boolean; payment: OrchestratedPayment }> {
    const res = await fetch('/api/money/reconciliation', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ==========================================
  // V3: REGIONAL MULTI-CURRENCY & TENANTS
  // ==========================================

  static async getRegionalCurrencies(): Promise<CurrencyMetadata[]> {
    const res = await fetch('/api/regional/currencies', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async convertCurrency(
    from: SupportedCurrency,
    to: SupportedCurrency,
    amount: number
  ): Promise<{
    from: SupportedCurrency;
    to: SupportedCurrency;
    inputAmount: number;
    convertedAmount: number;
    amountInUGX: number;
    rateProvenance: string;
    calculatedAt: string;
  }> {
    const res = await fetch('/api/regional/convert', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ from, to, amount }),
    });
    return res.json();
  }

  static async getCountryTenants(): Promise<CountryTenantConfig[]> {
    const res = await fetch('/api/regional/tenants', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async getCountryTenant(code: string): Promise<CountryTenantConfig> {
    const res = await fetch(`/api/regional/tenants/${code}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // ==========================================
  // V3: INSTITUTIONAL WORKSPACES
  // ==========================================

  static async getInstitutionalWorkspaces(): Promise<InstitutionalWorkspace[]> {
    const res = await fetch('/api/institutions/workspaces', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async getInstitutionalWorkspace(id: string): Promise<InstitutionalWorkspace> {
    const res = await fetch(`/api/institutions/workspaces/${id}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async createDataSharingAgreement(data: {
    workspaceId: string;
    partnerOrgId: string;
    partnerOrgName: string;
    purpose: string;
    fieldsPermitted: string[];
  }): Promise<any> {
    const res = await fetch('/api/institutions/agreements', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async revokeDataSharingAgreement(
    workspaceId: string,
    agreementIndex: number
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/institutions/agreements/${agreementIndex}/revoke`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ workspaceId }),
    });
    return res.json();
  }

  // ==========================================
  // V3: COMPLIANCE & RISK MONITORING
  // ==========================================

  static async getComplianceRiskEvents(): Promise<ComplianceRiskEvent[]> {
    const res = await fetch('/api/compliance/risk-events', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async investigateComplianceRisk(id: string, auditorName?: string): Promise<ComplianceRiskEvent> {
    const res = await fetch(`/api/compliance/risk-events/${id}/investigate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ auditorName }),
    });
    return res.json();
  }

  static async resolveComplianceRisk(
    id: string,
    resolutionNotes: string,
    actionTaken?: boolean
  ): Promise<ComplianceRiskEvent> {
    const res = await fetch(`/api/compliance/risk-events/${id}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ resolutionNotes, actionTaken }),
    });
    return res.json();
  }

  // ==========================================
  // V3: DEVELOPER ECOSYSTEM & SCOPED APIS
  // ==========================================

  static async getDeveloperApps(): Promise<DeveloperApplication[]> {
    const res = await fetch('/api/developer/apps', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async createDeveloperApp(data: {
    organizationId?: string;
    appName: string;
    allowedScopes?: ('read:market' | 'read:prices' | 'write:contracts' | 'read:traceability' | 'read:warehouses')[];
    isLive?: boolean;
    webhookUrl?: string;
  }): Promise<DeveloperApplication> {
    const res = await fetch('/api/developer/apps', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async testDeveloperWebhook(data: {
    appId?: string;
    event?: string;
    payload?: any;
  }): Promise<{ success: boolean; delivery: DeveloperWebhookDelivery }> {
    const res = await fetch('/api/developer/webhooks/test', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getDeveloperWebhookDeliveries(): Promise<DeveloperWebhookDelivery[]> {
    const res = await fetch('/api/developer/webhooks/deliveries', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // ==========================================
  // V4: REGIONAL CROSS-BORDER TRADE (15-STAGE)
  // ==========================================

  static async getTrades(filters: { exporterId?: string; importerId?: string; scope?: string; stage?: string } = {}): Promise<CrossBorderTrade[]> {
    const params = new URLSearchParams();
    if (filters.exporterId) params.append('exporterId', filters.exporterId);
    if (filters.importerId) params.append('importerId', filters.importerId);
    if (filters.scope) params.append('scope', filters.scope);
    if (filters.stage) params.append('stage', filters.stage);
    const res = await fetch(`/api/trades?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async getTrade(id: string): Promise<CrossBorderTrade> {
    const res = await fetch(`/api/trades/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createTrade(data: Partial<CrossBorderTrade>): Promise<CrossBorderTrade> {
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async advanceTradeStage(
    id: string,
    targetStage: CrossBorderTradeStage,
    completedBy?: string,
    notes?: string
  ): Promise<CrossBorderTrade> {
    const res = await fetch(`/api/trades/${id}/stage`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetStage, completedBy, notes }),
    });
    return res.json();
  }

  static async addTradeDocument(tradeId: string, data: Partial<TradeDocumentRef>): Promise<TradeDocumentRef> {
    const res = await fetch(`/api/trades/${tradeId}/documents`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async updateTradeDocumentStatus(
    tradeId: string,
    docId: string,
    verificationStatus: string,
    remarks?: string
  ): Promise<TradeDocumentRef> {
    const res = await fetch(`/api/trades/${tradeId}/documents/${docId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ verificationStatus, remarks }),
    });
    return res.json();
  }

  // ==========================================
  // V4: REGIONAL PROCUREMENT RFQs & QUOTES
  // ==========================================

  static async getProcurementRfqs(filters: { issuerId?: string; status?: string; commodityType?: string } = {}): Promise<RegionalProcurementRfq[]> {
    const params = new URLSearchParams();
    if (filters.issuerId) params.append('issuerId', filters.issuerId);
    if (filters.status) params.append('status', filters.status);
    if (filters.commodityType) params.append('commodityType', filters.commodityType);
    const res = await fetch(`/api/procurement/rfqs?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async getProcurementRfq(id: string): Promise<RegionalProcurementRfq> {
    const res = await fetch(`/api/procurement/rfqs/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createProcurementRfq(data: Partial<RegionalProcurementRfq>): Promise<RegionalProcurementRfq> {
    const res = await fetch('/api/procurement/rfqs', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getRfqQuotations(rfqId: string): Promise<RfqQuotation[]> {
    const res = await fetch(`/api/procurement/rfqs/${rfqId}/quotations`, { headers: this.getHeaders() });
    return res.json();
  }

  static async submitRfqQuotation(rfqId: string, data: Partial<RfqQuotation>): Promise<RfqQuotation> {
    const res = await fetch(`/api/procurement/rfqs/${rfqId}/quotations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async awardRfqQuotation(
    rfqId: string,
    quotationId: string
  ): Promise<{ success: boolean; rfq: RegionalProcurementRfq; awardedQuotation: RfqQuotation }> {
    const res = await fetch(`/api/procurement/rfqs/${rfqId}/award`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ quotationId }),
    });
    return res.json();
  }

  // ==========================================
  // V4: ECONOMIC CORRIDORS & LOGISTICS
  // ==========================================

  static async getCorridors(): Promise<EconomicCorridor[]> {
    const res = await fetch('/api/corridors', { headers: this.getHeaders() });
    return res.json();
  }

  static async getCorridor(id: string): Promise<EconomicCorridor> {
    const res = await fetch(`/api/corridors/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async updateCorridorStatus(
    id: string,
    data: { status?: string; congestionLevel?: string; activeDisruptions?: string[] }
  ): Promise<EconomicCorridor> {
    const res = await fetch(`/api/corridors/${id}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getCorridorShipments(filters: { corridorId?: string; status?: string; tradeId?: string } = {}): Promise<CorridorShipment[]> {
    const params = new URLSearchParams();
    if (filters.corridorId) params.append('corridorId', filters.corridorId);
    if (filters.status) params.append('status', filters.status);
    if (filters.tradeId) params.append('tradeId', filters.tradeId);
    const res = await fetch(`/api/corridors/shipments?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createCorridorShipment(data: Partial<CorridorShipment>): Promise<CorridorShipment> {
    const res = await fetch('/api/corridors/shipments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async recordShipmentMilestone(
    id: string,
    data: { checkpointName?: string; cleared?: boolean; currentLocation?: string; delayNotice?: string; status?: string }
  ): Promise<CorridorShipment> {
    const res = await fetch(`/api/corridors/shipments/${id}/milestone`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ==========================================
  // V4: INDUSTRIAL FACILITIES & PRODUCTION
  // ==========================================

  static async getIndustrialFacilities(filters: { sector?: string; district?: string } = {}): Promise<IndustrialFacility[]> {
    const params = new URLSearchParams();
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.district) params.append('district', filters.district);
    const res = await fetch(`/api/industry/facilities?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async getIndustrialFacility(id: string): Promise<IndustrialFacility> {
    const res = await fetch(`/api/industry/facilities/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createIndustrialFacility(data: Partial<IndustrialFacility>): Promise<IndustrialFacility> {
    const res = await fetch('/api/industry/facilities', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getProductionOrders(filters: { facilityId?: string; status?: string } = {}): Promise<ProductionOrder[]> {
    const params = new URLSearchParams();
    if (filters.facilityId) params.append('facilityId', filters.facilityId);
    if (filters.status) params.append('status', filters.status);
    const res = await fetch(`/api/industry/production-orders?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createProductionOrder(data: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const res = await fetch('/api/industry/production-orders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async updateProductionOrderStage(
    id: string,
    data: { status?: string; rawMaterialSourcedMT?: number; labTest?: any; notes?: string }
  ): Promise<ProductionOrder> {
    const res = await fetch(`/api/industry/production-orders/${id}/stage`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ==========================================
  // V4: RESILIENCE & DISRUPTION MANAGEMENT
  // ==========================================

  static async getDisruptionIncidents(filters: { severity?: string; status?: string; corridorId?: string } = {}): Promise<EconomicDisruptionIncident[]> {
    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.corridorId) params.append('corridorId', filters.corridorId);
    const res = await fetch(`/api/resilience/incidents?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createDisruptionIncident(data: Partial<EconomicDisruptionIncident>): Promise<EconomicDisruptionIncident> {
    const res = await fetch('/api/resilience/incidents', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async resolveDisruptionIncident(
    id: string,
    mitigationNotes?: string
  ): Promise<{ success: boolean; incident: EconomicDisruptionIncident }> {
    const res = await fetch(`/api/resilience/incidents/${id}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ mitigationNotes }),
    });
    return res.json();
  }

  static async getAlternativeSuppliers(commodity: string): Promise<{
    commodity: string;
    alternativeSuppliers: any[];
    disclaimer: string;
  }> {
    const res = await fetch(`/api/resilience/alternative-suppliers/${encodeURIComponent(commodity)}`, {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // ==========================================
  // V4: OPPORTUNITIES & REPUTATION
  // ==========================================

  static async getEconomicOpportunities(filters: { type?: string; targetSector?: string; status?: string } = {}): Promise<EconomicOpportunity[]> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.targetSector) params.append('targetSector', filters.targetSector);
    if (filters.status) params.append('status', filters.status);
    const res = await fetch(`/api/opportunities?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createEconomicOpportunity(data: Partial<EconomicOpportunity>): Promise<EconomicOpportunity> {
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getOrganizationReputation(orgId: string): Promise<OrganizationReputationScore> {
    const res = await fetch(`/api/reputations/${orgId}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async evaluateOrganizationReputation(
    organizationId: string,
    overallScore: number,
    ratingBand?: string
  ): Promise<OrganizationReputationScore> {
    const res = await fetch('/api/reputations/evaluate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ organizationId, overallScore, ratingBand }),
    });
    return res.json();
  }

  // ==========================================
  // V5: AETHER EVENT NETWORK
  // ==========================================

  static async getEvents(category?: string, status?: string): Promise<AetherEvent[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const res = await fetch(`/api/events?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async emitEvent(data: Partial<AetherEvent>): Promise<AetherEvent> {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to emit event');
    }
    return res.json();
  }

  static async acknowledgeEvent(id: string, consumerGroup?: string): Promise<AetherEvent> {
    const res = await fetch(`/api/events/${id}/ack`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ consumerGroup }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to acknowledge event');
    }
    return res.json();
  }

  static async replayEvent(id: string, reason?: string): Promise<AetherEvent> {
    const res = await fetch(`/api/events/${id}/replay`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to replay event');
    }
    return res.json();
  }

  static async getDeadLetterQueue(): Promise<AetherEvent[]> {
    const res = await fetch('/api/events/dlq', { headers: this.getHeaders() });
    return res.json();
  }

  static async retryDlqEvent(id: string): Promise<AetherEvent> {
    const res = await fetch(`/api/events/dlq/${id}/retry`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to retry DLQ event');
    }
    return res.json();
  }

  // ==========================================
  // V5: AUTONOMOUS OPERATIONS CONTROL PLANE
  // ==========================================

  static async getTelemetrySnapshot(): Promise<SystemTelemetrySnapshot> {
    const res = await fetch('/api/system/telemetry', { headers: this.getHeaders() });
    return res.json();
  }

  static async getGatewayHealth(): Promise<any> {
    const res = await fetch('/api/system/gateway-health', { headers: this.getHeaders() });
    return res.json();
  }

  static async runLoadTest(profileUsers: number = 100, durationSeconds: number = 5): Promise<LoadTestResult> {
    const res = await fetch('/api/system/load-test', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ profileUsers, durationSeconds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run load test');
    }
    return res.json();
  }

  static async getLoadTestResults(): Promise<LoadTestResult[]> {
    const res = await fetch('/api/system/load-test/results', { headers: this.getHeaders() });
    return res.json();
  }

  static async getOperationalIncidents(severity?: string, status?: string): Promise<OperationalIncident[]> {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (status) params.append('status', status);
    const res = await fetch(`/api/operations/incidents?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createOperationalIncident(data: Partial<OperationalIncident>): Promise<OperationalIncident> {
    const res = await fetch('/api/operations/incidents', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async remediateIncident(incidentId: string, actionType: string, triggeredBy: string = 'AUTONOMOUS_CONTROLLER'): Promise<{ incident: OperationalIncident; action: AutomatedRemediationAction }> {
    const res = await fetch(`/api/operations/incidents/${incidentId}/remediate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ actionType, triggeredBy }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Remediation failed');
    }
    return res.json();
  }

  static async approveRemediation(actionId: string, approvedBy: string): Promise<AutomatedRemediationAction> {
    const res = await fetch(`/api/operations/remediation/${actionId}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ approvedBy }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve remediation');
    }
    return res.json();
  }

  static async rejectRemediation(actionId: string, rejectedBy: string, reason: string): Promise<AutomatedRemediationAction> {
    const res = await fetch(`/api/operations/remediation/${actionId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ rejectedBy, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reject remediation');
    }
    return res.json();
  }

  static async runDisasterRecoveryDrill(scenario: string, verifiedBy: string): Promise<DisasterRecoveryDrill> {
    const res = await fetch('/api/operations/dr-drill', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ scenario, verifiedBy }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute DR drill');
    }
    return res.json();
  }

  static async getDisasterRecoveryDrills(): Promise<DisasterRecoveryDrill[]> {
    const res = await fetch('/api/operations/dr-drills', { headers: this.getHeaders() });
    return res.json();
  }

  static async createAutomatedBackup(): Promise<{ success: boolean; backupFile: string; timestamp: string; collectionsBackedUp: number }> {
    const res = await fetch('/api/operations/backup', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Backup creation failed');
    }
    return res.json();
  }

  // ==========================================
  // V5: CONTINENTAL ECONOMIC FORECASTS
  // ==========================================

  static async getEconomicForecasts(commodity?: string, countryCode?: string): Promise<EconomicForecast[]> {
    const params = new URLSearchParams();
    if (commodity) params.append('commodity', commodity);
    if (countryCode) params.append('countryCode', countryCode);
    const res = await fetch(`/api/intelligence/forecasts?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async generateEconomicForecast(data: Partial<EconomicForecast>): Promise<EconomicForecast> {
    const res = await fetch('/api/intelligence/forecasts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate forecast');
    }
    return res.json();
  }

  // ==========================================
  // V5: REGIONAL OBSERVATORY & MULTI-TENANCY
  // ==========================================

  static async getRegionalObservatoryMetrics(countryCode?: string): Promise<RegionalObservatoryMetric[]> {
    const url = countryCode ? `/api/observatory/metrics?countryCode=${countryCode}` : '/api/observatory/metrics';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async configureCountryTenant(code: string, data: Partial<CountryTenantConfig>): Promise<CountryTenantConfig> {
    const res = await fetch(`/api/tenants/countries/${code}/configure`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to configure tenant');
    }
    return res.json();
  }

  static async checkTenantIsolation(actorUserId: string, targetTenantId?: string, targetCountryCode?: string): Promise<{
    allowed: boolean;
    reason: string;
    actor: { id: string; role: string; organizationId: string; country: string };
  }> {
    const res = await fetch('/api/tenants/check-isolation', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorUserId, targetTenantId, targetCountryCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Tenant isolation check failed');
    }
    return res.json();
  }

  static async consultAiAgent(data: { agentType: AiAgentType; prompt: string; context?: any }): Promise<{
    response: string;
    actionableSteps: string[];
    confidence: number;
    source: string;
    error?: string;
  }> {
    const res = await fetch('/api/ai/agent-query', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        response: '',
        actionableSteps: [],
        confidence: 0,
        source: 'Error',
        error: err.error || 'AI agent consultation failed',
      };
    }
    const d = await res.json();
    return {
      response: d.answer || d.responseText || '',
      actionableSteps: d.actionableSteps || [],
      confidence: d.confidence || 0.85,
      source: d.dataProvenance || 'AETHER-AROS Intelligence',
    };
  }

  // ==========================================
  // V6: UNIVERSAL CURRENCY & MONEY
  // ==========================================

  static async getCurrencies(): Promise<CurrencyMetadata[]> {
    const res = await fetch('/api/money/currencies', { headers: this.getHeaders() });
    return res.json();
  }

  static async registerCurrency(data: Partial<CurrencyMetadata>): Promise<CurrencyMetadata> {
    const res = await fetch('/api/money/currencies', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getFxQuote(baseCurrency: string, quoteCurrency: string, amount: number): Promise<FxQuote> {
    const res = await fetch('/api/money/fx/quote', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ baseCurrency, quoteCurrency, amount }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate FX quote');
    }
    return res.json();
  }

  static async orchestrateUniversalPayment(data: {
    originatingParticipantId: string;
    receivingParticipantId: string;
    amount: number;
    currency: string;
    settlementCurrency?: string;
    paymentMethod?: string;
    provider?: string;
    transactionType?: string;
  }): Promise<EconomicTransaction> {
    const res = await fetch('/api/money/payments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Payment orchestration failed');
    }
    return res.json();
  }

  static async getUniversalTransactions(): Promise<EconomicTransaction[]> {
    const res = await fetch('/api/money/payments', { headers: this.getHeaders() });
    return res.json();
  }

  static async authorizeUniversalPayment(id: string, operatorId?: string): Promise<EconomicTransaction> {
    const res = await fetch(`/api/money/payments/${id}/authorize`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ operatorId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Payment authorization failed');
    }
    return res.json();
  }

  static async reconcileMultiCurrencySettlements(): Promise<{
    reconciledCount: number;
    totalSettledVolumeUGX: number;
    discrepanciesCount: number;
    settlements: EconomicSettlement[];
    reconciledAt: string;
  }> {
    const res = await fetch('/api/money/reconciliation', { headers: this.getHeaders() });
    return res.json();
  }

  // ==========================================
  // V6: UNIVERSAL COMMERCE
  // ==========================================

  static async getCommercialCatalogue(sector?: string): Promise<CommercialCatalogueItem[]> {
    const url = sector ? `/api/commerce/catalogue?sector=${sector}` : '/api/commerce/catalogue';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async createCommercialCatalogueItem(data: Partial<CommercialCatalogueItem>): Promise<CommercialCatalogueItem> {
    const res = await fetch('/api/commerce/catalogue', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async createCommercialOrder(data: {
    buyerId: string;
    sellerId: string;
    sector?: string;
    items: any[];
    shippingAddress?: string;
  }): Promise<{ order: CommercialOrderV6; invoice: CommercialInvoice }> {
    const res = await fetch('/api/commerce/orders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create commercial order');
    }
    return res.json();
  }

  static async getCommercialOrders(): Promise<CommercialOrderV6[]> {
    const res = await fetch('/api/commerce/orders', { headers: this.getHeaders() });
    return res.json();
  }

  static async getCommercialInvoices(): Promise<CommercialInvoice[]> {
    const res = await fetch('/api/commerce/invoices', { headers: this.getHeaders() });
    return res.json();
  }

  static async getCommercialDisputes(): Promise<CommercialDispute[]> {
    const res = await fetch('/api/commerce/disputes', { headers: this.getHeaders() });
    return res.json();
  }

  static async createCommercialDispute(data: Partial<CommercialDispute>): Promise<CommercialDispute> {
    const res = await fetch('/api/commerce/disputes', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ==========================================
  // V6: CAPITAL & INVESTMENT
  // ==========================================

  static async applyForCapital(data: Partial<CapitalFinancingApplication>): Promise<CapitalFinancingApplication> {
    const res = await fetch('/api/capital/apply', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Capital application failed');
    }
    return res.json();
  }

  static async getCapitalApplications(): Promise<CapitalFinancingApplication[]> {
    const res = await fetch('/api/capital/applications', { headers: this.getHeaders() });
    return res.json();
  }

  static async getInvestmentOpportunities(): Promise<InvestmentOpportunity[]> {
    const res = await fetch('/api/investment/opportunities', { headers: this.getHeaders() });
    return res.json();
  }

  static async subscribeToInvestment(opportunityId: string, subscriptionAmount: number, investorParticipantId?: string): Promise<any> {
    const res = await fetch('/api/investment/subscribe', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ opportunityId, subscriptionAmount, investorParticipantId }),
    });
    return res.json();
  }

  // ==========================================
  // V6: ASSET REGISTRY & VALUATION
  // ==========================================

  static async getEconomicAssets(): Promise<EconomicAsset[]> {
    const res = await fetch('/api/assets', { headers: this.getHeaders() });
    return res.json();
  }

  static async registerEconomicAsset(data: Partial<EconomicAsset>): Promise<EconomicAsset> {
    const res = await fetch('/api/assets/register', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register economic asset');
    }
    return res.json();
  }

  // ==========================================
  // V6: WORK, INCOME & PAYROLL
  // ==========================================

  static async getWorkContracts(): Promise<WorkContract[]> {
    const res = await fetch('/api/work/contracts', { headers: this.getHeaders() });
    return res.json();
  }

  static async createWorkContract(data: Partial<WorkContract>): Promise<WorkContract> {
    const res = await fetch('/api/work/contracts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async submitWorkTimesheet(data: Partial<WorkTimesheet>): Promise<WorkTimesheet> {
    const res = await fetch('/api/work/timesheets', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getPayrollRuns(): Promise<PayrollRun[]> {
    const res = await fetch('/api/work/payroll', { headers: this.getHeaders() });
    return res.json();
  }

  static async executePayrollRun(data: {
    organizationId?: string;
    period?: string;
    grossPayAmount?: number;
    employeeCount?: number;
    currency?: string;
  }): Promise<PayrollRun> {
    const res = await fetch('/api/work/payroll/run', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ==========================================
  // V6: PUBLIC ECONOMY & INSTITUTIONS
  // ==========================================

  static async getPublicTenders(): Promise<PublicTender[]> {
    const res = await fetch('/api/public-economy/tenders', { headers: this.getHeaders() });
    return res.json();
  }

  static async publishPublicTender(data: Partial<PublicTender>): Promise<PublicTender> {
    const res = await fetch('/api/public-economy/tenders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  static async getTaxDeclarations(): Promise<TaxDeclaration[]> {
    const res = await fetch('/api/public-economy/tax', { headers: this.getHeaders() });
    return res.json();
  }

  static async submitTaxDeclaration(data: Partial<TaxDeclaration>): Promise<TaxDeclaration> {
    const res = await fetch('/api/public-economy/tax/declare', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ==========================================
  // V6: AETHER ID & TRUST
  // ==========================================

  static async getEconomicParticipants(): Promise<EconomicParticipant[]> {
    const res = await fetch('/api/identity/participants', { headers: this.getHeaders() });
    return res.json();
  }

  static async getEconomicIdentity(id: string): Promise<EconomicIdentity> {
    const res = await fetch(`/api/identity/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async verifyEconomicIdentity(participantId: string, level: number = 3): Promise<EconomicIdentity> {
    const res = await fetch('/api/identity/verify', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ participantId, level }),
    });
    return res.json();
  }

  // ==========================================
  // V6: 15-DOMAIN AI INTELLIGENCE ADVISORY
  // ==========================================

  static async consultAiEconomicAgent(domain: AiEconomicDomain, query: string, context?: any): Promise<{
    domain: AiEconomicDomain;
    analysis: string;
    confidenceScore: number;
    recommendedActions: string[];
    riskFactors: string[];
    dataProvenance: string;
    timestamp: string;
  }> {
    const res = await fetch('/api/intelligence/agents/consult', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ domain, query, context }),
    });
    return res.json();
  }

  // ==========================================
  // V7: GLOBAL ECONOMIC INFRASTRUCTURE & ACCOUNTING
  // ==========================================

  static async getChartOfAccounts(): Promise<any[]> {
    const res = await fetch('/api/accounting/accounts', { headers: this.getHeaders() });
    return res.json();
  }

  static async createChartOfAccount(account: any): Promise<any> {
    const res = await fetch('/api/accounting/accounts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(account)
    });
    return res.json();
  }

  static async getUniversalJournal(): Promise<any[]> {
    const res = await fetch('/api/accounting/journal', { headers: this.getHeaders() });
    return res.json();
  }

  static async postJournalEntry(entry: any): Promise<any> {
    const res = await fetch('/api/accounting/journal', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(entry)
    });
    return res.json();
  }

  static async reverseJournalEntry(id: string, reason: string): Promise<any> {
    const res = await fetch(`/api/accounting/journal/${id}/reverse`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  }

  static async getTrialBalance(): Promise<any> {
    const res = await fetch('/api/accounting/reports/trial-balance', { headers: this.getHeaders() });
    return res.json();
  }

  static async getSubscriptionPlans(): Promise<any[]> {
    const res = await fetch('/api/billing/plans', { headers: this.getHeaders() });
    return res.json();
  }

  static async getSubscriptions(): Promise<any[]> {
    const res = await fetch('/api/billing/subscriptions', { headers: this.getHeaders() });
    return res.json();
  }

  static async subscribeToPlan(subscriberId: string, planId: string, currency = 'UGX'): Promise<any> {
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ subscriberId, planId, currency })
    });
    return res.json();
  }

  static async getBillingInvoices(): Promise<any[]> {
    const res = await fetch('/api/billing/invoices', { headers: this.getHeaders() });
    return res.json();
  }

  static async getIntegrationAdapters(): Promise<any[]> {
    const res = await fetch('/api/integrations/adapters', { headers: this.getHeaders() });
    return res.json();
  }

  static async pingIntegrationAdapter(id: string): Promise<any> {
    const res = await fetch(`/api/integrations/adapters/${id}/ping`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.json();
  }

  static async getJurisdictionRules(countryCode?: string): Promise<any[]> {
    const url = countryCode ? `/api/jurisdiction/rules?countryCode=${countryCode}` : '/api/jurisdiction/rules';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async calculateStatutoryTax(countryCode: string, taxCategory: string, grossAmount: number): Promise<any> {
    const res = await fetch('/api/jurisdiction/calculate-tax', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ countryCode, taxCategory, grossAmount })
    });
    return res.json();
  }

  static async getFraudAlerts(): Promise<any[]> {
    const res = await fetch('/api/compliance/fraud-alerts', { headers: this.getHeaders() });
    return res.json();
  }

  static async evaluateFraudRisk(params: any): Promise<any> {
    const res = await fetch('/api/compliance/evaluate-risk', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  static async getBeneficialOwnership(entityId?: string): Promise<any[]> {
    const url = entityId ? `/api/compliance/beneficial-ownership?entityId=${entityId}` : '/api/compliance/beneficial-ownership';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  // ==========================================
  // V8: CONTINENTAL ECONOMIC NETWORK CLIENT
  // ==========================================

  static async getEconomicRelationships(params?: { participantId?: string; viewerRole?: string; viewerId?: string }): Promise<EconomicRelationship[]> {
    const query = new URLSearchParams();
    if (params?.participantId) query.append('participantId', params.participantId);
    if (params?.viewerRole) query.append('viewerRole', params.viewerRole);
    if (params?.viewerId) query.append('viewerId', params.viewerId);
    const url = `/api/network/relationships${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async createEconomicRelationship(data: any): Promise<EconomicRelationship> {
    const res = await fetch('/api/network/relationships', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  static async terminateEconomicRelationship(id: string, reason?: string): Promise<EconomicRelationship> {
    const res = await fetch(`/api/network/relationships/${id}/terminate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  }

  static async getDiscoveryListings(params?: { q?: string; country?: string; industry?: string; currency?: string }): Promise<EconomicDiscoveryListing[]> {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.country) query.append('country', params.country);
    if (params?.industry) query.append('industry', params.industry);
    if (params?.currency) query.append('currency', params.currency);
    const url = `/api/network/discovery${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async createDiscoveryListing(data: any): Promise<EconomicDiscoveryListing> {
    const res = await fetch('/api/network/discovery', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  static async executeEconomicMatching(sourceEntityId: string, targetDomain = 'TRADE'): Promise<EconomicMatchResult[]> {
    const res = await fetch('/api/network/matching', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ sourceEntityId, targetDomain })
    });
    return res.json();
  }

  static async getWorkflowInstances(): Promise<WorkflowInstance[]> {
    const res = await fetch('/api/workflows/instances', { headers: this.getHeaders() });
    return res.json();
  }

  static async createWorkflowInstance(data: { definitionId: string; workflowName: string; initiatorId?: string; initiatorName?: string; entityId?: string }): Promise<WorkflowInstance> {
    const res = await fetch('/api/workflows/instances', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  static async advanceWorkflowStage(id: string, action: string, actorId?: string, approvalNotes?: string): Promise<WorkflowInstance> {
    const res = await fetch(`/api/workflows/instances/${id}/advance`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, actorId, approvalNotes })
    });
    return res.json();
  }

  static async getCoordinatedTransactions(): Promise<UniversalTransactionRecord[]> {
    const res = await fetch('/api/coordination/transactions', { headers: this.getHeaders() });
    return res.json();
  }

  static async createUniversalTransaction(data: any): Promise<UniversalTransactionRecord> {
    const res = await fetch('/api/coordination/transactions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  static async settleTransactionMilestone(transactionId: string, milestoneId: string, actorId?: string): Promise<UniversalTransactionRecord> {
    const res = await fetch(`/api/coordination/transactions/${transactionId}/milestone`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ milestoneId, actorId })
    });
    return res.json();
  }

  static async getProgrammableAgreements(): Promise<ProgrammableEconomicAgreement[]> {
    const res = await fetch('/api/agreements', { headers: this.getHeaders() });
    return res.json();
  }

  static async createProgrammableAgreement(data: any): Promise<ProgrammableEconomicAgreement> {
    const res = await fetch('/api/agreements', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  static async approveAgreementMilestone(id: string, milestoneId: string, actorId?: string): Promise<ProgrammableEconomicAgreement> {
    const res = await fetch(`/api/agreements/${id}/milestones/${milestoneId}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorId })
    });
    return res.json();
  }

  static async amendProgrammableAgreement(id: string, amendedBy: string, notes: string, newTerms?: string): Promise<ProgrammableEconomicAgreement> {
    const res = await fetch(`/api/agreements/${id}/amend`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amendedBy, notes, newTerms })
    });
    return res.json();
  }

  static async getAutomationPolicies(): Promise<AutomationRulePolicy[]> {
    const res = await fetch('/api/automations/policies', { headers: this.getHeaders() });
    return res.json();
  }

  static async toggleAutomationPolicy(id: string): Promise<AutomationRulePolicy> {
    const res = await fetch(`/api/automations/policies/${id}/toggle`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.json();
  }

  static async getAutomationExecutions(): Promise<AutomationExecutionRecord[]> {
    const res = await fetch('/api/automations/executions', { headers: this.getHeaders() });
    return res.json();
  }

  static async approveHighImpactExecution(id: string, approverId?: string): Promise<AutomationExecutionRecord> {
    const res = await fetch(`/api/automations/executions/${id}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ approverId })
    });
    return res.json();
  }

  static async triggerAutomation(policyId: string, payload?: any, isSimulated?: boolean): Promise<AutomationExecutionRecord> {
    const res = await fetch('/api/automations/trigger', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ policyId, payload, isSimulated })
    });
    return res.json();
  }

  static async getPaymentProviders(): Promise<UniversalPaymentProvider[]> {
    const res = await fetch('/api/providers/network', { headers: this.getHeaders() });
    return res.json();
  }

  static async routePayment(params: any): Promise<any> {
    const res = await fetch('/api/providers/route-payment', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  // ==========================================
  // V9 GLOBAL ECONOMIC INFRASTRUCTURE & SOVEREIGN INTEROPERABILITY
  // ==========================================

  // 1. Sovereign Federation Registry & Lifecycle
  static async getFederations(countryCode?: string, status?: string): Promise<FederationNetwork[]> {
    const params = new URLSearchParams();
    if (countryCode) params.append('countryCode', countryCode);
    if (status) params.append('status', status);
    const res = await fetch(`/api/federations?${params.toString()}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async registerFederation(payload: any): Promise<FederationNetwork> {
    const res = await fetch('/api/federations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  static async updateFederationLifecycle(id: string, targetStatus: FederationStatus, actorId?: string, notes?: string): Promise<any> {
    const res = await fetch(`/api/federations/${id}/lifecycle`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetStatus, actorId, notes })
    });
    return res.json();
  }

  // 2. Federated Identity
  static async getFederatedIssuers(): Promise<FederatedIdentityIssuer[]> {
    const res = await fetch('/api/federated-identity/issuers', { headers: this.getHeaders() });
    return res.json();
  }

  static async getFederatedClaims(subjectAetherId?: string): Promise<FederatedIdentityClaim[]> {
    const url = subjectAetherId ? `/api/federated-identity/claims?subjectAetherId=${encodeURIComponent(subjectAetherId)}` : '/api/federated-identity/claims';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async issueFederatedClaim(claim: any): Promise<FederatedIdentityClaim> {
    const res = await fetch('/api/federated-identity/claims', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(claim)
    });
    return res.json();
  }

  static async revokeFederatedClaim(id: string, reason: string): Promise<FederatedIdentityClaim> {
    const res = await fetch(`/api/federated-identity/claims/${id}/revoke`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  }

  static async resolveFederatedIdentity(aetherId: string, requestingJurisdiction?: string): Promise<any> {
    const url = requestingJurisdiction
      ? `/api/federated-identity/resolve/${encodeURIComponent(aetherId)}?requestingJurisdiction=${requestingJurisdiction}`
      : `/api/federated-identity/resolve/${encodeURIComponent(aetherId)}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  // 3. Global Interoperability Standards & Message Translation
  static async getInteroperabilityStandards(): Promise<InteroperabilityStandardRecord[]> {
    const res = await fetch('/api/interop/standards', { headers: this.getHeaders() });
    return res.json();
  }

  static async registerInteroperabilityStandard(std: any): Promise<InteroperabilityStandardRecord> {
    const res = await fetch('/api/interop/standards', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(std)
    });
    return res.json();
  }

  static async translateMessage(params: any): Promise<MessageTranslationRecord> {
    const res = await fetch('/api/interop/translate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  // 4. Global Payment Routing & FX
  static async evaluateGlobalPaymentRoute(params: any): Promise<any> {
    const res = await fetch('/api/payments/global-route', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  // 5. Global Treasury Positions & Liquidity
  static async getTreasuryPositions(): Promise<TreasuryPosition[]> {
    const res = await fetch('/api/treasury/positions', { headers: this.getHeaders() });
    return res.json();
  }

  static async recordTreasuryPosition(pos: any): Promise<TreasuryPosition> {
    const res = await fetch('/api/treasury/positions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(pos)
    });
    return res.json();
  }

  // 6. Financial Reconciliation
  static async getReconciliationBatches(): Promise<ReconciliationBatch[]> {
    const res = await fetch('/api/reconciliation/batches', { headers: this.getHeaders() });
    return res.json();
  }

  static async getReconciliationExceptions(): Promise<ReconciliationException[]> {
    const res = await fetch('/api/reconciliation/exceptions', { headers: this.getHeaders() });
    return res.json();
  }

  static async executeReconciliation(params: any): Promise<any> {
    const res = await fetch('/api/reconciliation/execute', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  static async resolveReconciliationException(id: string, owner: string, notes?: string): Promise<ReconciliationException> {
    const res = await fetch(`/api/reconciliation/exceptions/${id}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ owner, notes })
    });
    return res.json();
  }

  // 7. Data Sovereignty & Exchange
  static async getDataTransferPolicies(): Promise<DataTransferPolicy[]> {
    const res = await fetch('/api/sovereignty/policies', { headers: this.getHeaders() });
    return res.json();
  }

  static async getDataExchangeLogs(): Promise<DataExchangeLog[]> {
    const res = await fetch('/api/sovereignty/logs', { headers: this.getHeaders() });
    return res.json();
  }

  static async checkDataTransferPolicy(params: any): Promise<any> {
    const res = await fetch('/api/sovereignty/transfer-check', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  // 8. Multi-Region Resilience
  static async getMultiRegionRecoveryEvents(): Promise<MultiRegionRecoveryEvent[]> {
    const res = await fetch('/api/resilience/multi-region-events', { headers: this.getHeaders() });
    return res.json();
  }

  static async logMultiRegionRecovery(event: any): Promise<MultiRegionRecoveryEvent> {
    const res = await fetch('/api/resilience/multi-region-events', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(event)
    });
    return res.json();
  }

  // 9. Global Observatory
  static async getGlobalObservatoryIndicators(): Promise<any> {
    const res = await fetch('/api/observatory/global-indicators', { headers: this.getHeaders() });
    return res.json();
  }

  // ==========================================
  // V10 GLOBAL ECONOMIC EXECUTION & INSTITUTIONAL OPERATIONS
  // ==========================================

  // 1. Economic Executions
  static async getEconomicExecutions(filter?: {
    status?: string;
    originJurisdiction?: string;
    destinationJurisdiction?: string;
    activityClassification?: string;
  }): Promise<EconomicExecution[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.originJurisdiction) params.append('originJurisdiction', filter.originJurisdiction);
    if (filter?.destinationJurisdiction) params.append('destinationJurisdiction', filter.destinationJurisdiction);
    if (filter?.activityClassification) params.append('activityClassification', filter.activityClassification);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/executions${query}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async getEconomicExecution(id: string): Promise<EconomicExecution> {
    const res = await fetch(`/api/executions/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createEconomicExecution(params: any): Promise<EconomicExecution> {
    const res = await fetch('/api/executions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  static async transitionEconomicExecution(
    id: string,
    targetStatus: string,
    actor: string,
    reason: string,
    authorizationEvidence?: string
  ): Promise<any> {
    const res = await fetch(`/api/executions/${id}/transition`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetStatus, actor, reason, authorizationEvidence })
    });
    return res.json();
  }

  static async verifyExecutionMilestone(executionId: string, milestoneId: string, actor: string, evidenceHash?: string): Promise<any> {
    const res = await fetch(`/api/executions/${executionId}/milestones/${milestoneId}/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ actor, evidenceHash })
    });
    return res.json();
  }

  // 2. Institutional Operations
  static async getInstitutionalProfiles(filter?: {
    status?: string;
    classification?: string;
    jurisdiction?: string;
  }): Promise<InstitutionalProfile[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.classification) params.append('classification', filter.classification);
    if (filter?.jurisdiction) params.append('jurisdiction', filter.jurisdiction);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/institutions${query}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async getInstitutionalProfile(id: string): Promise<InstitutionalProfile> {
    const res = await fetch(`/api/institutions/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async registerInstitutionalProfile(profile: any): Promise<InstitutionalProfile> {
    const res = await fetch('/api/institutions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(profile)
    });
    return res.json();
  }

  static async updateInstitutionalLifecycle(id: string, targetStatus: string, actor: string, notes?: string): Promise<any> {
    const res = await fetch(`/api/institutions/${id}/lifecycle`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetStatus, actor, notes })
    });
    return res.json();
  }

  // 3. Economic Agreements
  static async getEconomicAgreements(filter?: {
    status?: string;
    type?: string;
    jurisdiction?: string;
  }): Promise<EconomicAgreement[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.type) params.append('type', filter.type);
    if (filter?.jurisdiction) params.append('jurisdiction', filter.jurisdiction);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/agreements${query}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async getEconomicAgreement(id: string): Promise<EconomicAgreement> {
    const res = await fetch(`/api/agreements/${id}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async createEconomicAgreement(agreement: any): Promise<EconomicAgreement> {
    const res = await fetch('/api/agreements', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(agreement)
    });
    return res.json();
  }

  static async signEconomicAgreement(id: string, signatoryId: string, signatoryName: string, signatoryRole: string, hash?: string): Promise<any> {
    const res = await fetch(`/api/agreements/${id}/sign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ signatoryId, signatoryName, signatoryRole, hash })
    });
    return res.json();
  }

  static async transitionAgreementStatus(id: string, targetStatus: string, actor: string, reason: string): Promise<any> {
    const res = await fetch(`/api/agreements/${id}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetStatus, actor, reason })
    });
    return res.json();
  }

  // 4. Commercial Orders (V10)
  static async getV10CommercialOrders(): Promise<CommercialOrder[]> {
    const res = await fetch('/api/commercial/orders', { headers: this.getHeaders() });
    return res.json();
  }

  static async createV10CommercialOrder(params: any): Promise<CommercialOrder> {
    const res = await fetch('/api/commercial/orders', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  static async updateV10CommercialOrderStatus(id: string, status: string): Promise<any> {
    const res = await fetch(`/api/commercial/orders/${id}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  }

  // 5. Supply Chain & Multimodal Logistics
  static async getSupplyChainShipments(): Promise<SupplyChainShipment[]> {
    const res = await fetch('/api/supply-chain/shipments', { headers: this.getHeaders() });
    return res.json();
  }

  static async createSupplyChainShipment(params: any): Promise<SupplyChainShipment> {
    const res = await fetch('/api/supply-chain/shipments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  }

  static async updateSupplyChainShipmentStatus(id: string, status: string, location: string, event: string, verifiedBy: string): Promise<any> {
    const res = await fetch(`/api/supply-chain/shipments/${id}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, location, event, verifiedBy })
    });
    return res.json();
  }

  // 6. Financial Execution Assurance & Integrity
  static async getFinancialExecutions(): Promise<FinancialExecutionRecord[]> {
    const res = await fetch('/api/financial/executions', { headers: this.getHeaders() });
    return res.json();
  }

  static async recordFinancialExecution(record: any): Promise<FinancialExecutionRecord> {
    const res = await fetch('/api/financial/executions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(record)
    });
    return res.json();
  }

  static async updateFinancialSettlementStatus(id: string, stage: string, providerResponseCode?: string, settlementEvidenceHash?: string, providerConfirmedAt?: string): Promise<any> {
    const res = await fetch(`/api/financial/executions/${id}/settlement`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ stage, providerResponseCode, settlementEvidenceHash, providerConfirmedAt })
    });
    return res.json();
  }

  static async getFinancialIntegrityReport(): Promise<FinancialIntegrityReport> {
    const res = await fetch('/api/financial/integrity-report', { headers: this.getHeaders() });
    return res.json();
  }

  // 7. Economic Risk & Trust Intelligence
  static async getEconomicRiskAssessments(): Promise<EconomicRiskAssessment[]> {
    const res = await fetch('/api/risk/assessments', { headers: this.getHeaders() });
    return res.json();
  }

  static async recordEconomicRiskAssessment(assessment: any): Promise<EconomicRiskAssessment> {
    const res = await fetch('/api/risk/assessments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(assessment)
    });
    return res.json();
  }

  // 8. Economic Disputes
  static async getEconomicDisputes(): Promise<EconomicDispute[]> {
    const res = await fetch('/api/disputes', { headers: this.getHeaders() });
    return res.json();
  }

  static async createEconomicDispute(dispute: any): Promise<EconomicDispute> {
    const res = await fetch('/api/disputes', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(dispute)
    });
    return res.json();
  }

  static async updateDisputeStatus(id: string, status: string, resolutionProposal?: string, resolutionOutcome?: string): Promise<any> {
    const res = await fetch(`/api/disputes/${id}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, resolutionProposal, resolutionOutcome })
    });
    return res.json();
  }

  // 9. Governed Autonomous Operations
  static async getGovernedAutomationPolicies(): Promise<GovernedAutomationPolicy[]> {
    const res = await fetch('/api/automation/policies', { headers: this.getHeaders() });
    return res.json();
  }

  static async getAutomationApprovalQueue(): Promise<AutomationApprovalQueueItem[]> {
    const res = await fetch('/api/automation/approval-queue', { headers: this.getHeaders() });
    return res.json();
  }

  static async submitAutomationApproval(item: any): Promise<AutomationApprovalQueueItem> {
    const res = await fetch('/api/automation/approval-queue', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(item)
    });
    return res.json();
  }

  static async processAutomationApproval(id: string, decision: string, actor: string, notes?: string): Promise<any> {
    const res = await fetch(`/api/automation/approval-queue/${id}/process`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ decision, actor, notes })
    });
    return res.json();
  }

  // 10. Commercial Sustainability & Pricing Plans
  static async getSustainabilityPlans(): Promise<SustainabilityPlan[]> {
    const res = await fetch('/api/sustainability/plans', { headers: this.getHeaders() });
    return res.json();
  }

  static async recordSustainabilityPlan(plan: any): Promise<SustainabilityPlan> {
    const res = await fetch('/api/sustainability/plans', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(plan)
    });
    return res.json();
  }

  // 11. Operations Control Center Executive Summary
  static async getOperationsControlCenterSummary(): Promise<any> {
    const res = await fetch('/api/operations/control-center-summary', { headers: this.getHeaders() });
    return res.json();
  }

  // ==========================================
  // V11: GLOBAL ECONOMIC NETWORK SCALE CLIENT
  // ==========================================

  private static v11Headers(tenantId?: string, extra: Record<string, string> = {}) {
    return this.getHeaders({
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      ...extra,
    });
  }

  static async v11GetTenants(includeMemberships = false): Promise<TenantRecord[]> {
    const res = await fetch(`/api/v11/tenants?includeMemberships=${includeMemberships}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async v11CreateTenant(payload: any): Promise<{ tenant: TenantRecord; adminMembership: TenantMembership }> {
    const res = await fetch('/api/v11/tenants', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11GetOnboardingApplications(publicView = false): Promise<ParticipantOnboardingApplication[]> {
    const res = await fetch(`/api/v11/onboarding/applications?publicView=${publicView}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async v11CreateOnboardingApplication(payload: any): Promise<ParticipantOnboardingApplication> {
    const res = await fetch('/api/v11/onboarding/applications', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11TransitionOnboarding(id: string, targetStatus: string, actor?: string, notes?: string): Promise<any> {
    const res = await fetch(`/api/v11/onboarding/applications/${id}/transition`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetStatus, actor, notes }),
    });
    return res.json();
  }

  static async v11GetWorkspaceSummary(tenantId: string): Promise<any> {
    const res = await fetch('/api/v11/workspace/summary', { headers: this.v11Headers(tenantId) });
    return res.json();
  }

  static async v11GetWorkspaceProfile(tenantId: string): Promise<BusinessWorkspaceProfile> {
    const res = await fetch('/api/v11/workspace/profile', { headers: this.v11Headers(tenantId) });
    return res.json();
  }

  static async v11GetWorkspaceCatalog(tenantId: string): Promise<BusinessCatalogItem[]> {
    const res = await fetch('/api/v11/workspace/catalog', { headers: this.v11Headers(tenantId) });
    return res.json();
  }

  static async v11CreateWorkspaceCatalogItem(tenantId: string, payload: any): Promise<BusinessCatalogItem> {
    const res = await fetch('/api/v11/workspace/catalog', {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11GetWorkspaceDocuments(tenantId: string): Promise<BusinessCommercialDoc[]> {
    const res = await fetch('/api/v11/workspace/documents', { headers: this.v11Headers(tenantId) });
    return res.json();
  }

  static async v11CreateWorkspaceDocument(tenantId: string, payload: any): Promise<BusinessCommercialDoc> {
    const res = await fetch('/api/v11/workspace/documents', {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11GetWorkspaceTasks(tenantId: string): Promise<BusinessTaskItem[]> {
    const res = await fetch('/api/v11/workspace/tasks', { headers: this.v11Headers(tenantId) });
    return res.json();
  }

  static async v11GetRelationships(tenantId: string): Promise<ParticipantRelationshipRecord[]> {
    const res = await fetch('/api/v11/network/relationships', { headers: this.v11Headers(tenantId) });
    return res.json();
  }

  static async v11GetConnections(tenantId: string): Promise<ConnectionRequestRecord[]> {
    const res = await fetch('/api/v11/network/connections', { headers: this.v11Headers(tenantId) });
    return res.json();
  }

  static async v11CreateConnection(tenantId: string, payload: any): Promise<ConnectionRequestRecord> {
    const res = await fetch('/api/v11/network/connections', {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11RespondConnection(tenantId: string, id: string, decision: 'APPROVED' | 'REJECTED'): Promise<any> {
    const res = await fetch(`/api/v11/network/connections/${id}/respond`, {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify({ decision }),
    });
    return res.json();
  }

  static async v11GetMarketplaceListings(query?: string): Promise<NetworkMarketplaceListing[]> {
    const url = query ? `/api/v11/marketplace/listings?q=${encodeURIComponent(query)}` : '/api/v11/marketplace/listings';
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  static async v11CreateMarketplaceListing(tenantId: string, payload: any): Promise<NetworkMarketplaceListing> {
    const res = await fetch('/api/v11/marketplace/listings', {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11SubmitListingOffer(tenantId: string, listingId: string, payload: any): Promise<NetworkMarketplaceListing> {
    const res = await fetch(`/api/v11/marketplace/listings/${listingId}/offers`, {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11GetProcurementRequests(): Promise<V11ProcurementRequest[]> {
    const res = await fetch('/api/v11/procurement/requests', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11CreateProcurementRequest(tenantId: string, payload: any): Promise<V11ProcurementRequest> {
    const res = await fetch('/api/v11/procurement/requests', {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11AwardProcurement(tenantId: string, reqId: string, bidId: string, humanAuthorizedBy: string): Promise<any> {
    const res = await fetch(`/api/v11/procurement/requests/${reqId}/award`, {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify({ bidId, humanAuthorizedBy }),
    });
    return res.json();
  }

  static async v11GetSupplierQualifications(): Promise<SupplierQualificationRecord[]> {
    const res = await fetch('/api/v11/procurement/qualifications', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11GetLogisticsCarriers(): Promise<LogisticsCarrierProfile[]> {
    const res = await fetch('/api/v11/logistics/carriers', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11GetProviders(): Promise<VerifiedProviderProfile[]> {
    const res = await fetch('/api/v11/providers', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11CertifyProvider(id: string): Promise<VerifiedProviderProfile> {
    const res = await fetch(`/api/v11/providers/${id}/certify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ environment: 'SANDBOX', passed: true }),
    });
    return res.json();
  }

  static async v11CompareFx(from: string, to: string, amount: number): Promise<any> {
    const res = await fetch(`/api/v11/currency/fx-compare?from=${from}&to=${to}&amount=${amount}`, { headers: this.getHeaders() });
    return res.json();
  }

  static async v11GetDeveloperApps(): Promise<RegisteredEcosystemApp[]> {
    const res = await fetch('/api/v11/developer/apps', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11RegisterDeveloperApp(tenantId: string, payload: any): Promise<any> {
    const res = await fetch('/api/v11/developer/apps', {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11GetIndustrialCapacities(): Promise<IndustrialCapacityRecord[]> {
    const res = await fetch('/api/v11/industrial/capacities', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11GetWorkOpportunities(): Promise<WorkServiceOpportunity[]> {
    const res = await fetch('/api/v11/work/opportunities', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11GetInsights(): Promise<NetworkAnalyticalInsight[]> {
    const res = await fetch('/api/v11/intelligence/insights', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11RunScenario(payload: any): Promise<NetworkAnalyticalInsight> {
    const res = await fetch('/api/v11/intelligence/scenarios', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async v11GetAiAgents(): Promise<{ agents: GovernedAiAgentIdentity[]; actionLogs: AiAgentActionLog[] }> {
    const res = await fetch('/api/v11/ai/agents', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11ExecuteAiAgent(tenantId: string, agentId: string, requestedAction: string, autonomyLevel: number): Promise<any> {
    const res = await fetch(`/api/v11/ai/agents/${agentId}/execute`, {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify({ requestedAction, autonomyLevel }),
    });
    return res.json();
  }

  static async v11DecideAiApproval(logId: string, decision: 'APPROVED' | 'REJECTED', approvedBy: string): Promise<AiAgentActionLog> {
    const res = await fetch(`/api/v11/ai/approvals/${logId}/decide`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ decision, approvedBy }),
    });
    return res.json();
  }

  static async v11GetSubscriptions(): Promise<TenantSubscriptionRecord[]> {
    const res = await fetch('/api/v11/billing/subscriptions', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11GetBillingInvoices(): Promise<TenantBillingInvoice[]> {
    const res = await fetch('/api/v11/billing/invoices', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11GenerateBillingInvoice(tenantId: string, subscriptionId: string): Promise<TenantBillingInvoice> {
    const res = await fetch('/api/v11/billing/invoices', {
      method: 'POST',
      headers: this.v11Headers(tenantId),
      body: JSON.stringify({ subscriptionId }),
    });
    return res.json();
  }

  static async v11GetNetworkSummary(): Promise<any> {
    const res = await fetch('/api/v11/operations/network-summary', { headers: this.getHeaders() });
    return res.json();
  }

  static async v11RunBenchmark(concurrentOperations = 60): Promise<V11PerformanceBenchmark> {
    const res = await fetch('/api/v11/operations/benchmark', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ concurrentOperations, scenario: 'V11_PRODUCTION_READINESS_CONCURRENCY' }),
    });
    return res.json();
  }

  static async v11VerifyBackup(): Promise<any> {
    const res = await fetch('/api/v11/system/backup-verify', { method: 'POST', headers: this.getHeaders() });
    return res.json();
  }

  static async v11GetMigrationAudit(): Promise<any> {
    const res = await fetch('/api/v11/system/migration-audit', { headers: this.getHeaders() });
    return res.json();
  }

  // ==========================================
  // V12: GLOBAL ECONOMIC INTELLIGENCE CLIENT
  // ==========================================

  private static v12Headers(opts?: { tenantId?: string; userId?: string; userRole?: string; extra?: Record<string, string> }) {
    return this.getHeaders({
      ...(opts?.tenantId ? { 'x-tenant-id': opts.tenantId } : {}),
      ...(opts?.userId ? { 'x-user-id': opts.userId } : {}),
      ...(opts?.userRole ? { 'x-user-role': opts.userRole } : {}),
      ...(opts?.extra || {}),
    });
  }

  private static async v12Json<T = any>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await this.fetchWithTimeout(url, init, 20000);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data?.message || data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.code = data?.error;
      err.payload = data;
      throw err;
    }
    return data as T;
  }

  static async v12GetOverview(params?: { jurisdiction?: string; sector?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const q = new URLSearchParams();
    if (params?.jurisdiction && params.jurisdiction !== 'ALL') q.append('jurisdiction', params.jurisdiction);
    if (params?.sector) q.append('sector', params.sector);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.v12Json(`/api/v12/intelligence/overview${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v12GetStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/intelligence/status', { headers: this.v12Headers(actor) });
  }

  static async v12GetCoverage(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/intelligence/coverage', { headers: this.v12Headers(actor) });
  }

  static async v12GetSources(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceSource[]> {
    return this.v12Json('/api/v12/intelligence/sources', { headers: this.v12Headers(actor) });
  }

  static async v12RegisterSource(payload: any, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceSource> {
    return this.v12Json('/api/v12/intelligence/sources', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12VerifySource(id: string, decision: 'APPROVED' | 'SUSPEND', actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceSource> {
    return this.v12Json(`/api/v12/intelligence/sources/${id}/verify`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ decision }),
    });
  }

  static async v12RefreshSource(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/intelligence/sources/${id}/refresh`, {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v12GetIndicators(params?: { jurisdiction?: string; sector?: string; q?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<{ indicators: EconomicIndicator[]; cacheHit: boolean; total: number }> {
    const q = new URLSearchParams();
    if (params?.jurisdiction && params.jurisdiction !== 'ALL') q.append('jurisdiction', params.jurisdiction);
    if (params?.sector) q.append('sector', params.sector);
    if (params?.q) q.append('q', params.q);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.v12Json(`/api/v12/economy/indicators${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v12GetIndicatorDetail(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/economy/indicators/${id}`, { headers: this.v12Headers(actor) });
  }

  static async v12GetObservations(params?: { indicatorId?: string; jurisdiction?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<EconomicObservation[]> {
    const q = new URLSearchParams();
    if (params?.indicatorId) q.append('indicatorId', params.indicatorId);
    if (params?.jurisdiction && params.jurisdiction !== 'ALL') q.append('jurisdiction', params.jurisdiction);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.v12Json(`/api/v12/economy/observations${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v12ImportObservations(payload: { sourceId: string; format: 'JSON' | 'CSV'; csvPayload?: string; observations?: any[] }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/economy/observations/import', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12GetRegionalEconomy(scope = 'ALL', actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/economy/regional?scope=${encodeURIComponent(scope)}`, { headers: this.v12Headers(actor) });
  }

  static async v12GetForecasts(params?: { domain?: string; horizon?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<V12EconomicForecast[]> {
    const q = new URLSearchParams();
    if (params?.domain) q.append('domain', params.domain);
    if (params?.horizon) q.append('horizon', params.horizon);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.v12Json(`/api/v12/forecasts${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v12GenerateForecast(payload: { indicatorId: string; domain: string; horizon: string; modelId?: string; asyncQueue?: boolean; idempotencyKey?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/forecasts/generate', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12EvaluateForecast(forecastId: string, actualValue: number, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/forecasts/${forecastId}/evaluate`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ actualValue }),
    });
  }

  static async v12GetForecastAccuracyHistory(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/forecasts/accuracy/history', { headers: this.v12Headers(actor) });
  }

  static async v12GetAnomalies(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<EconomicAnomaly[]> {
    return this.v12Json('/api/v12/intelligence/anomalies', { headers: this.v12Headers(actor) });
  }

  static async v12DetectAnomalies(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/intelligence/anomalies/detect', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v12ReviewAnomaly(id: string, reviewStatus: string, notes: string, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<EconomicAnomaly> {
    return this.v12Json(`/api/v12/intelligence/anomalies/${id}/review`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ reviewStatus, notes }),
    });
  }

  static async v12GetEarlyWarnings(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<V12EconomicEarlyWarning[]> {
    return this.v12Json('/api/v12/intelligence/warnings', { headers: this.v12Headers(actor) });
  }

  static async v12CreateEarlyWarning(payload: any, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<V12EconomicEarlyWarning> {
    return this.v12Json('/api/v12/intelligence/warnings', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12ReviewEarlyWarning(id: string, reviewStatus: string, notes: string, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<V12EconomicEarlyWarning> {
    return this.v12Json(`/api/v12/intelligence/warnings/${id}/review`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ reviewStatus, notes }),
    });
  }

  static async v12GetOpportunities(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<V12EconomicOpportunity[]> {
    return this.v12Json('/api/v12/intelligence/opportunities', { headers: this.v12Headers(actor) });
  }

  static async v12GetSimulations(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<{ scenarios: EconomicScenario[]; results: ScenarioSimulationResult[] }> {
    return this.v12Json('/api/v12/simulations', { headers: this.v12Headers(actor) });
  }

  static async v12CreateSimulation(payload: any, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/simulations', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12CompareSimulation(id: string, shockPercentages: number[], actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/simulations/${id}/compare`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ shockPercentages }),
    });
  }

  static async v12RunStressTest(payload: any, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/simulations/stress-test', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12GetBusinessImpactSimulations(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<BusinessImpactSimulation[]> {
    return this.v12Json('/api/v12/simulations/business-impact', { headers: this.v12Headers(actor) });
  }

  static async v12RunBusinessImpactSimulation(payload: any, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<BusinessImpactSimulation> {
    return this.v12Json('/api/v12/simulations/business-impact', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12GetRecommendations(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<EconomicRecommendation[]> {
    return this.v12Json('/api/v12/recommendations', { headers: this.v12Headers(actor) });
  }

  static async v12GenerateRecommendation(payload: any, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<EconomicRecommendation> {
    return this.v12Json('/api/v12/recommendations/generate', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12DecideRecommendation(id: string, decision: 'approve' | 'reject', notes: string, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<EconomicRecommendation> {
    return this.v12Json(`/api/v12/recommendations/${id}/${decision}`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ notes }),
    });
  }

  static async v12GetTradeLogistics(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/intelligence/trade-logistics', { headers: this.v12Headers(actor) });
  }

  static async v12QueryAssistant(payload: { question: string; jurisdiction?: string; agentType?: string; externalSnippets?: string[] }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/assistant/query', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12GetAgents(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceAgentPolicy[]> {
    return this.v12Json('/api/v12/agents', { headers: this.v12Headers(actor) });
  }

  static async v12RunAgent(agentId: string, payload: { prompt: string; requestedAction: string; autonomyLevel: number; jurisdiction?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceAgentRun> {
    return this.v12Json(`/api/v12/agents/${agentId}/run`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12GetAgentRuns(agentId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceAgentRun[]> {
    return this.v12Json(`/api/v12/agents/${agentId}/runs`, { headers: this.v12Headers(actor) });
  }

  static async v12ApproveAgentRun(runId: string, approverId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceAgentRun> {
    return this.v12Json(`/api/v12/agents/runs/${runId}/approve`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ approverId }),
    });
  }

  static async v12ToggleCircuitBreaker(active: boolean, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/agents/circuit-breaker', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ active }),
    });
  }

  static async v12GetGovernanceModels(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<{ models: ForecastModel[]; driftEvents: ModelDriftEvent[]; evaluations: any[] }> {
    return this.v12Json('/api/v12/governance/models', { headers: this.v12Headers(actor) });
  }

  static async v12TransitionModelStatus(modelId: string, targetStatus: string, notes: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/governance/models/${modelId}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ targetStatus, notes }),
    });
  }

  static async v12TriggerModelDrift(modelId: string, payload: { driftType: string; metricBefore: number; metricAfter: number }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/governance/models/${modelId}/drift-check`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12GetAuditEvents(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceAuditEvent[]> {
    return this.v12Json('/api/v12/governance/audit', { headers: this.v12Headers(actor) });
  }

  static async v12GetDataQuality(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/governance/data-quality', { headers: this.v12Headers(actor) });
  }

  static async v12GetReviewQueue(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceReviewQueueItem[]> {
    return this.v12Json('/api/v12/governance/review-queue', { headers: this.v12Headers(actor) });
  }

  static async v12DecideReviewQueueItem(id: string, decision: 'APPROVED' | 'REJECTED', notes: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/governance/review-queue/${id}/decide`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ decision, notes }),
    });
  }

  static async v12GetReports(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<{ reports: IntelligenceReport[]; publications: IntelligencePublicationRecord[] }> {
    return this.v12Json('/api/v12/governance/reports', { headers: this.v12Headers(actor) });
  }

  static async v12GenerateReport(payload: { reportTitle: string; reportType: string; jurisdiction: string; sectors: string[]; timeRange: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<IntelligenceReport> {
    return this.v12Json('/api/v12/governance/reports', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v12GetSubscriptionPlans(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<{ tiers: IntelligenceSubscriptionProduct[]; commercialDisclosure: string; v11BillingIntegrated: boolean }> {
    return this.v12Json('/api/v12/subscriptions/plans', { headers: this.v12Headers(actor) });
  }

  static async v12GetJobs(actor?: { tenantId?: string; userId?: string; userRole?: string }): Promise<V12BackgroundJob[]> {
    return this.v12Json('/api/v12/jobs', { headers: this.v12Headers(actor) });
  }

  static async v12CancelJob(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v12/jobs/${id}/cancel`, {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v12GetMigrationAudit(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/system/migration-audit', { headers: this.v12Headers(actor) });
  }

  static async v12VerifyBackup(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/system/backup-verify', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v12CheckRollback(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/system/rollback-check', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v12RunBenchmark(iterations = 50, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v12/system/benchmark', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ iterations }),
    });
  }

  // ==========================================
  // V13 DISTRIBUTED INFRASTRUCTURE, SOVEREIGN FEDERATION & CRYPTOGRAPHIC TRUST API
  // ==========================================

  static async v13GetOperationsHealth(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/operations/health', { headers: this.v12Headers(actor) });
  }

  static async v13GetDatabaseStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/database/status', { headers: this.v12Headers(actor) });
  }

  static async v13GetDatabaseReplication(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/database/replication', { headers: this.v12Headers(actor) });
  }

  static async v13VerifyDatabase(payload: { mode?: string; requestedWriter?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/database/verify', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13GetDatabaseMigrations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/database/migrations', { headers: this.v12Headers(actor) });
  }

  static async v13GetEventStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/events/status', { headers: this.v12Headers(actor) });
  }

  static async v13PublishEvent(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/events/publish', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13GetEventConsumers(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/events/consumers', { headers: this.v12Headers(actor) });
  }

  static async v13GetDeadLetterEvents(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/events/dead-letter', { headers: this.v12Headers(actor) });
  }

  static async v13ReplayEvents(payload: { simulateOutage?: boolean; deadLetterId?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/infrastructure/events/replay', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13GetJurisdictions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/federation/jurisdictions', { headers: this.v12Headers(actor) });
  }

  static async v13GetFederationPolicies(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/federation/policies', { headers: this.v12Headers(actor) });
  }

  static async v13GetEnclaves(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/federation/enclaves', { headers: this.v12Headers(actor) });
  }

  static async v13SealInEnclave(payload: { jurisdictionCode: string; plaintext: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/federation/enclaves/verify-seal', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13CreateCrossBorderTransfer(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/federation/transfers', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13GetInstitutionalConnectors(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/institutions/connectors', { headers: this.v12Headers(actor) });
  }

  static async v13TestInstitutionalConnector(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v13/institutions/connectors/${id}/test`, {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v13GetCertificates(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/institutions/certificates', { headers: this.v12Headers(actor) });
  }

  static async v13CertificateLifecycle(id: string, action: string, reason?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v13/institutions/certificates/${id}/lifecycle`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ action, reason }),
    });
  }

  static async v13GetSecurityKeys(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/security/keys', { headers: this.v12Headers(actor) });
  }

  static async v13KeyLifecycle(id: string, action: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v13/security/keys/${id}/lifecycle`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ action }),
    });
  }

  static async v13GetHsmStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/security/hsm/status', { headers: this.v12Headers(actor) });
  }

  static async v13IssueAuditCheckpoint(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/security/audit-checkpoint', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v13CreateApprovalRequest(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/security/approvals', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13SignApprovalRequest(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v13/security/approvals/${id}/sign`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13GetWorkers(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/intelligence/workers', { headers: this.v12Headers(actor) });
  }

  static async v13ScheduleForecastJob(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/intelligence/forecast-jobs', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13RunModelValidation(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/intelligence/models/validate', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13GetModelExperiments(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/intelligence/models/experiments', { headers: this.v12Headers(actor) });
  }

  static async v13RunSovereignAIWorker(workerId: string, payload: { jurisdiction: string; prompt: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v13/intelligence/ai-workers/${workerId}/infer`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v13GetRegions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/operations/regions', { headers: this.v12Headers(actor) });
  }

  static async v13GetDisasterRecovery(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/operations/disaster-recovery', { headers: this.v12Headers(actor) });
  }

  static async v13TriggerRecoveryTest(payload: { scenarioType: string; affectedRegion: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v13/operations/recovery-tests', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // V14 GLOBAL INSTITUTIONAL OPERATIONS & FINANCIAL INTEROPERABILITY CLIENT
  // ==========================================

  static async v14GetReadiness(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/operations/readiness', { headers: this.v12Headers(actor) });
  }

  static async v14GetDatabaseStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/infrastructure/database/status', { headers: this.v12Headers(actor) });
  }

  static async v14RunCutoverCheck(payload: { requestedAuthorityState: string; platformAdminApproved: boolean }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/infrastructure/database/cutover-check', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v14VerifyBackup(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/infrastructure/backups/verify', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v14GetEventsStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/infrastructure/events/status', { headers: this.v12Headers(actor) });
  }

  static async v14GetInstitutionalConnectors(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/institutions/connectors', { headers: this.v12Headers(actor) });
  }

  static async v14TestConnector(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v14/institutions/connectors/${id}/test`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ testType: 'SIGNED_PAYLOAD_ROUNDTRIP' }),
    });
  }

  static async v14ActivateConnectorProduction(id: string, justification: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v14/institutions/connectors/${id}/activate-production`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ justification }),
    });
  }

  static async v14GetOnboardingRequests(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/institutions/onboarding', { headers: this.v12Headers(actor) });
  }

  static async v14CreateOnboarding(payload: { institutionName: string; institutionCategory: string; jurisdiction: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/institutions/onboarding', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v14AdvanceOnboarding(id: string, targetStage: string, note?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v14/institutions/onboarding/${id}/advance`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ targetStage, note }),
    });
  }

  static async v14GetPaymentProviders(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/payments/providers', { headers: this.v12Headers(actor) });
  }

  static async v14GetPaymentTransactions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/payments/transactions', { headers: this.v12Headers(actor) });
  }

  static async v14InitiatePayment(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/payments/initiate', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v14GetReconciliation(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/payments/reconciliation', { headers: this.v12Headers(actor) });
  }

  static async v14RunReconciliation(payload: { currency: string; providerId: string; providerStatements: any[] }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/payments/reconcile', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v14GetCurrenciesAndFx(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/treasury/currencies', { headers: this.v12Headers(actor) });
  }

  static async v14GetTrades(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/operations/trades', { headers: this.v12Headers(actor) });
  }

  static async v14GetTaxRules(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/tax/rules', { headers: this.v12Headers(actor) });
  }

  static async v14GetSecurityOverview(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/security/overview', { headers: this.v12Headers(actor) });
  }

  static async v14ExportWormArchive(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/security/audit/archive', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v14GetCommercialPlans(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/commercial/plans', { headers: this.v12Headers(actor) });
  }

  static async v14GetCommercialSubscriptions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/commercial/subscriptions', { headers: this.v12Headers(actor) });
  }

  static async v14Subscribe(payload: { planCode: string; billingCycle: string; currency: string; apiCallsUsage?: number }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/commercial/subscribe', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v14GetRegions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/operations/regions', { headers: this.v12Headers(actor) });
  }

  static async v14TriggerDrExercise(payload: { scenario: string; affectedRegion: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v14/operations/dr-exercises', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // V15 GLOBAL ECONOMIC NETWORK ACTIVATION & CONTROL CENTER CLIENT
  // ==========================================

  static async v15GetOperations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/operations', { headers: this.v12Headers(actor) });
  }

  static async v15GetParticipants(actor?: { tenantId?: string; userId?: string; userRole?: string }, query = '') {
    return this.v12Json(`/api/v15/participants${query}`, { headers: this.v12Headers(actor) });
  }

  static async v15RegisterParticipant(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/participants', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v15VerifyParticipant(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v15/participants/${id}/verify`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v15GetMarketplace(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/marketplace', { headers: this.v12Headers(actor) });
  }

  static async v15DiscoverySearch(params: Record<string, string>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const qs = new URLSearchParams(params).toString();
    return this.v12Json(`/api/v15/discovery?${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v15CreateOrder(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/orders', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v15TransitionOrder(id: string, targetState: string, note: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v15/orders/${id}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ targetState, note }),
    });
  }

  static async v15GetExecutions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/executions', { headers: this.v12Headers(actor) });
  }

  static async v15GetProviders(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/providers', { headers: this.v12Headers(actor) });
  }

  static async v15GetFinancial(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/financial', { headers: this.v12Headers(actor) });
  }

  static async v15RunReconciliation(payload: { providerId: string; currency: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/financial/reconcile', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v15GetInstitutions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/institutions', { headers: this.v12Headers(actor) });
  }

  static async v15GetTrade(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/trade', { headers: this.v12Headers(actor) });
  }

  static async v15GetLogistics(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/logistics', { headers: this.v12Headers(actor) });
  }

  static async v15GetOpportunities(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/opportunities', { headers: this.v12Headers(actor) });
  }

  static async v15GetIndustries(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/industries', { headers: this.v12Headers(actor) });
  }

  static async v15GetImpact(jurisdiction = '', actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const qs = jurisdiction ? `?jurisdiction=${encodeURIComponent(jurisdiction)}` : '';
    return this.v12Json(`/api/v15/impact${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v15GetCommercial(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/commercial', { headers: this.v12Headers(actor) });
  }

  static async v15GetDevelopers(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/developers', { headers: this.v12Headers(actor) });
  }

  static async v15RegisterDeveloperApp(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/developers/apps', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v15GetInfrastructure(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/infrastructure', { headers: this.v12Headers(actor) });
  }

  static async v15GetSecurity(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/security', { headers: this.v12Headers(actor) });
  }

  static async v15ExportWormArchive(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/security/audit/archive', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v15RunRecoveryVerification(payload: { scenario: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/operations/recovery-verify', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v15GetVerification(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/verification', { headers: this.v12Headers(actor) });
  }

  static async v151GetSupportCases(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/support', { headers: this.v12Headers(actor) });
  }

  static async v151CreateSupportCase(
    payload: { category: string; subject: string; details: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v15/support', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v159UpdateSupportStatus(
    id: string,
    payload: { targetStatus: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'; resolutionNote?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v15/support/${id}/status`, {
      method: 'PATCH',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v159GetExperienceMode(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/experience-mode', { headers: this.v12Headers(actor) });
  }

  static async v159SetExperienceMode(
    mode: 'SIMPLE' | 'STANDARD' | 'PROFESSIONAL' | 'ADMINISTRATOR',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v15/experience-mode', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ mode }),
    });
  }

  static async v159GetTranslationReviews(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/translations/reviews', { headers: this.v12Headers(actor) });
  }

  static async v159ApproveTranslation(
    code: string,
    payload: { status: 'APPROVED' | 'PENDING_REVIEW' | 'NEEDS_CHANGES'; reviewedLegalFinancial: boolean; reviewerName?: string; notes?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v15/translations/reviews/${encodeURIComponent(code)}/approve`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v159GetReadiness(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v15/readiness/v159', { headers: this.v12Headers(actor) });
  }

  // ==========================================
  // V16 PRODUCTION INFRASTRUCTURE & UGANDA PILOT METHODS
  // ==========================================

  static async v16GetInfrastructureStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/infrastructure/status', { headers: this.v12Headers(actor) });
  }

  static async v16GetDependencies(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/infrastructure/dependencies', { headers: this.v12Headers(actor) });
  }

  static async v16GetEnvironments(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/infrastructure/environments', { headers: this.v12Headers(actor) });
  }

  static async v16RotateCredential(env: string, keyName: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v16/infrastructure/environments/${encodeURIComponent(env)}/rotate-credential`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ keyName }),
    });
  }

  static async v16GetDatabaseStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/database/status', { headers: this.v12Headers(actor) });
  }

  static async v16GetMigrations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/database/migrations', { headers: this.v12Headers(actor) });
  }

  static async v16RunMigrationDryRun(targetEngine?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/database/migrate-dry-run', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ targetEngine }),
    });
  }

  static async v16RequestDatabaseAuthority(targetAuthorityState: string, adminApproved: boolean, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const res = await fetch('/api/v16/database/authority', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ targetAuthorityState, adminApproved }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  }

  static async v16GetEventBusStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/events/status', { headers: this.v12Headers(actor) });
  }

  static async v16PublishEvent(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/events/publish', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v16GetHsmStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/security/hsm', { headers: this.v12Headers(actor) });
  }

  static async v16HsmLifecycle(action: string, keyId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const res = await fetch('/api/v16/security/hsm/lifecycle', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ action, keyId }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  }

  static async v16ExportAuditArchive(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/audit/archive/export', {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v16GetProviders(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/providers', { headers: this.v12Headers(actor) });
  }

  static async v16TestProvider(providerId: string, environment = 'INTEGRATION_TESTING', actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const res = await fetch(`/api/v16/providers/${encodeURIComponent(providerId)}/test`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ environment }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  }

  static async v16GetInstitutions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/institutions/onboarding', { headers: this.v12Headers(actor) });
  }

  static async v16AdvanceInstitution(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const res = await fetch(`/api/v16/institutions/${encodeURIComponent(id)}/advance`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  }

  static async v16GetPilot(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/pilot', { headers: this.v12Headers(actor) });
  }

  static async v16EnrollPilotConsent(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/pilot/consent', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v16GetUsability(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/usability/sessions', { headers: this.v12Headers(actor) });
  }

  static async v16GetTranslations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/translations/reviews', { headers: this.v12Headers(actor) });
  }

  static async v16GetMonitoringHealth(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/monitoring/health', { headers: this.v12Headers(actor) });
  }

  static async v16CreateIncident(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/monitoring/incidents', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v16ExecuteRecovery(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/recovery/exercises', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v16GetRecoveryStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/recovery/status', { headers: this.v12Headers(actor) });
  }

  static async v16GetReleases(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/releases', { headers: this.v12Headers(actor) });
  }

  static async v16AdvanceRelease(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const res = await fetch(`/api/v16/releases/${encodeURIComponent(id)}/advance`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  }

  static async v16GetReadinessGates(environment = 'DEVELOPMENT', actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v16/releases/readiness?environment=${encodeURIComponent(environment)}`, { headers: this.v12Headers(actor) });
  }

  static async v16GetUnitEconomics(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/sustainability/unit-economics', { headers: this.v12Headers(actor) });
  }

  static async v16GetComplianceReviews(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/compliance/reviews', { headers: this.v12Headers(actor) });
  }

  static async v16GetImpactSummary(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v16/impact/summary', { headers: this.v12Headers(actor) });
  }

  // ==========================================
  // V17 VERIFIED ECONOMIC NETWORK OPERATIONS CLIENT
  // ==========================================

  static async v17GetOverview(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/network/overview', { headers: this.v12Headers(actor) });
  }

  static async v17GetGates(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/gates', { headers: this.v12Headers(actor) });
  }

  static async v17RemediateGate(gateId: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v17/gates/${encodeURIComponent(gateId)}/remediate`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v17GetMigrations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/database/migrations', { headers: this.v12Headers(actor) });
  }

  static async v17GetParticipants(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/participants', { headers: this.v12Headers(actor) });
  }

  static async v17OnboardParticipant(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/participants/onboard', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v17GetOrganizations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/organizations', { headers: this.v12Headers(actor) });
  }

  static async v17GetRelationships(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/relationships', { headers: this.v12Headers(actor) });
  }

  static async v17GetCommercialListings(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/commercial/listings', { headers: this.v12Headers(actor) });
  }

  static async v17CreateListing(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/commercial/listings', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v17GetTransactions(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/transactions', { headers: this.v12Headers(actor) });
  }

  static async v17CreateTransaction(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/transactions', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v17TransitionTransaction(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v17/transactions/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v17AttachEvidence(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v17/transactions/${encodeURIComponent(id)}/evidence`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v17VerifyTransaction(id: string, independentReviewPassed = true, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v17/transactions/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ independentReviewPassed }),
    });
  }

  static async v17GetDisputes(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/disputes', { headers: this.v12Headers(actor) });
  }

  static async v17OpenDispute(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/disputes', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v17GetRegional(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/regional/jurisdictions', { headers: this.v12Headers(actor) });
  }

  static async v17GetCooperatives(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/cooperatives', { headers: this.v12Headers(actor) });
  }

  static async v17GetReconciliationCases(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/reconciliation/cases', { headers: this.v12Headers(actor) });
  }

  static async v17GetBillingSummary(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/billing/summary', { headers: this.v12Headers(actor) });
  }

  static async v17GetGovernancePolicies(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/governance/policies', { headers: this.v12Headers(actor) });
  }

  static async v17GetOfflineQueue(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/offline/queue', { headers: this.v12Headers(actor) });
  }

  static async v17GetIntelligence(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v17/intelligence/metrics', { headers: this.v12Headers(actor) });
  }

  // ==========================================
  // V18: NAVIGATION, GLOBAL SEARCH, TASK CENTRE & CONTROL CENTRE
  // ==========================================

  static async v18GetNavigationRegistry(
    params?: { mode?: string; includeAllPermitted?: boolean },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const query = new URLSearchParams();
    if (params?.mode) query.append('mode', params.mode);
    if (params?.includeAllPermitted) query.append('includeAllPermitted', 'true');
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.v12Json(`/api/v18/navigation/registry${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v18AuthorizeRoute(
    route: string,
    mode?: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const query = new URLSearchParams({ route });
    if (mode) query.append('mode', mode);
    const res = await fetch(`/api/v18/navigation/authorize?${query.toString()}`, {
      headers: this.v12Headers(actor),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ...data };
  }

  static async v18Search(
    q: string,
    mode?: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const query = new URLSearchParams({ q });
    if (mode) query.append('mode', mode);
    return this.v12Json(`/api/v18/search?${query.toString()}`, { headers: this.v12Headers(actor) });
  }

  static async v18GetNotificationsTasks(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v18/notifications-tasks', { headers: this.v12Headers(actor) });
  }

  static async v18UpdateTaskStatus(
    id: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v18/tasks/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ status }),
    });
  }

  static async v18GetAdminControlCenter(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v18/admin/control-center', { headers: this.v12Headers(actor) });
  }

  static async v18VerifyBackup(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v18/system/backup-verify', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  // ==========================================
  // V19: PLATFORM STABILITY, DIAGNOSTICS, SECRET SCAN & VERIFIED EXPORT
  // ==========================================

  static async v19GetDiagnostics(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v19/diagnostics', { headers: this.v12Headers(actor) });
  }

  static async v19RunSecretScan(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v19/secret-scan', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v19GenerateExport(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v19/export/generate', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v19FetchDownloadBlob(
    endpoint: '/api/v19/export/download' | '/api/v19/diagnostics/report-download',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ): Promise<Blob> {
    const res = await this.fetchWithTimeout(endpoint, { headers: this.v12Headers(actor) }, 30000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message || `Download failed (${res.status})`);
    }
    return res.blob();
  }

  // ==========================================
  // V20: UNIFIED ECONOMIC OPERATIONS CLIENT
  // ==========================================

  static async v20GetOverview(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/overview', { headers: this.v12Headers(actor) });
  }

  static async v20GetParticipants(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/participants', { headers: this.v12Headers(actor) });
  }

  static async v20GetMarketplace(
    params?: { q?: string; category?: string; countryCode?: string; district?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.category) query.append('category', params.category);
    if (params?.countryCode) query.append('countryCode', params.countryCode);
    if (params?.district) query.append('district', params.district);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.v12Json(`/api/v20/marketplace/listings${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v20GetRecommendations(
    params?: { district?: string; category?: string; q?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const query = new URLSearchParams();
    if (params?.district) query.append('district', params.district);
    if (params?.category) query.append('category', params.category);
    if (params?.q) query.append('q', params.q);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.v12Json(`/api/v20/marketplace/recommendations${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v20SaveSearch(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/marketplace/saved-searches', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20PublishHarvest(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/agriculture/publish-harvest', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetTrades(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/trades', { headers: this.v12Headers(actor) });
  }

  static async v20CreateTrade(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/trades', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20TransitionTrade(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/trades/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetAgreementSummary(tradeId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/trades/${encodeURIComponent(tradeId)}/agreement-summary`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v20GetShipments(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/shipments', { headers: this.v12Headers(actor) });
  }

  static async v20CreateShipment(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/shipments', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20TransitionShipment(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/shipments/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20SubmitDeliveryEvidence(shipmentId: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/shipments/${encodeURIComponent(shipmentId)}/delivery-evidence`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetObligations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/reconciliation/obligations', { headers: this.v12Headers(actor) });
  }

  static async v20RecordObligationPayment(obligationId: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/reconciliation/obligations/${encodeURIComponent(obligationId)}/record-payment`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetCooperativePools(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/cooperatives/pools', { headers: this.v12Headers(actor) });
  }

  static async v20ContributeToPool(poolId: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/cooperatives/pools/${encodeURIComponent(poolId)}/contribute`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetMemberStatements(poolId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/cooperatives/pools/${encodeURIComponent(poolId)}/member-statements`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v20GetReputation(participantId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/reputation/${encodeURIComponent(participantId)}`, { headers: this.v12Headers(actor) });
  }

  static async v20GetDisputes(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/disputes', { headers: this.v12Headers(actor) });
  }

  static async v20OpenDispute(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/disputes', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetRegionalConfig(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/regional/config', { headers: this.v12Headers(actor) });
  }

  static async v20ConvertRegional(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/regional/convert', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetCrossBorderChecklist(tradeId: string, destinationCountry: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(
      `/api/v20/regional/cross-border-checklist/${encodeURIComponent(tradeId)}?destinationCountry=${encodeURIComponent(destinationCountry)}`,
      { headers: this.v12Headers(actor) }
    );
  }

  static async v20SyncOfflineItems(items: any[], actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/offline/sync', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ items }),
    });
  }

  static async v20GetOfflineConflicts(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/offline/conflicts', { headers: this.v12Headers(actor) });
  }

  static async v20ResolveOfflineConflict(
    conflictId: string,
    resolution: 'RESOLVED_SERVER_WINS' | 'RESOLVED_CLIENT_MERGE' | 'DISCARDED',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v20/offline/conflicts/${encodeURIComponent(conflictId)}/resolve`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ resolution }),
    });
  }

  static async v20RequestAiAssist(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/ai/assist', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20GetPilots(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/pilots', { headers: this.v12Headers(actor) });
  }

  static async v20CreatePilot(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v20/pilots', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20OnboardPilotParticipant(pilotId: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/pilots/${encodeURIComponent(pilotId)}/onboard`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v20UpdatePilotLifecycle(pilotId: string, status: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/pilots/${encodeURIComponent(pilotId)}/lifecycle`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ status }),
    });
  }

  static async v20GetPilotReport(pilotId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v20/pilots/${encodeURIComponent(pilotId)}/report`, { headers: this.v12Headers(actor) });
  }

  // ==========================================
  // V21 CONTROLLED PILOT, ONBOARDING, FIELD OPS & MONITORING APIs
  // ==========================================

  static async v21GetOverview(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/overview', { headers: this.v12Headers(actor) });
  }

  static async v21GetPilots(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/pilots', { headers: this.v12Headers(actor) });
  }

  static async v21CreatePilot(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/pilots', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21TransitionPilot(
    pilotId: string,
    payload: { targetState: string; reason?: string; closureSummary?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v21/pilots/${encodeURIComponent(pilotId)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21GetPilotReport(pilotId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v21/pilots/${encodeURIComponent(pilotId)}/report`, { headers: this.v12Headers(actor) });
  }

  static async v21GetOnboardings(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/onboarding', { headers: this.v12Headers(actor) });
  }

  static async v21SubmitOnboarding(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/onboarding', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21ReviewOnboarding(
    id: string,
    payload: { targetStatus: string; note?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v21/onboarding/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21RequestAccountRecovery(id: string, reason: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v21/onboarding/${encodeURIComponent(id)}/recover`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ reason }),
    });
  }

  static async v21ExportParticipantData(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v21/onboarding/${encodeURIComponent(id)}/export`, { headers: this.v12Headers(actor) });
  }

  static async v21GetFieldRecords(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/field/records', { headers: this.v12Headers(actor) });
  }

  static async v21SaveFieldRecord(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/field/records', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21RetryFieldRecord(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v21/field/records/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
      headers: this.v12Headers(actor),
    });
  }

  static async v21GetFieldTasks(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/field/tasks', { headers: this.v12Headers(actor) });
  }

  static async v21CreateFieldTask(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/field/tasks', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21TransitionFieldTask(
    taskId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v21/field/tasks/${encodeURIComponent(taskId)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21GetControlCentre(
    params?: { pilotId?: string; district?: string; category?: string; status?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const q = new URLSearchParams();
    if (params?.pilotId) q.set('pilotId', params.pilotId);
    if (params?.district) q.set('district', params.district);
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    return this.v12Json(`/api/v21/monitoring/control-centre${q.toString() ? `?${q.toString()}` : ''}`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v21UpdateException(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v21/exceptions/${encodeURIComponent(id)}/update`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21CreateSupportRequest(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/support', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21UpdateSupportRequest(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v21/support/${encodeURIComponent(id)}/update`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v21GetCountries(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/regional/countries', { headers: this.v12Headers(actor) });
  }

  static async v21GetPostgresAudit(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/postgres/audit', { headers: this.v12Headers(actor) });
  }

  static async v21RunPostgresDryRun(
    payload?: { simulateInterruptedRecovery?: boolean },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v21/postgres/dry-run', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload || {}),
    });
  }

  static async v21GetGithubReadiness(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v21/github/readiness', { headers: this.v12Headers(actor) });
  }

  // ==========================================
  // V22 UNIVERSAL ECONOMIC ACTIVITY & GROWTH ENGINE APIs
  // ==========================================

  static async v22GetHealth(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/health', { headers: this.v12Headers(actor) });
  }

  static async v22GetOverview(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/overview', { headers: this.v12Headers(actor) });
  }

  static async v22GetSectors(
    params?: { categoryGroup?: string; q?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const q = new URLSearchParams();
    if (params?.categoryGroup) q.set('categoryGroup', params.categoryGroup);
    if (params?.q) q.set('q', params.q);
    return this.v12Json(`/api/v22/sectors${q.toString() ? `?${q.toString()}` : ''}`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v22CreateSector(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/sectors', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetBusinesses(
    params?: { sectorCode?: string; q?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const q = new URLSearchParams();
    if (params?.sectorCode) q.set('sectorCode', params.sectorCode);
    if (params?.q) q.set('q', params.q);
    return this.v12Json(`/api/v22/businesses${q.toString() ? `?${q.toString()}` : ''}`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v22CreateBusiness(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/businesses', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22VerifyBusiness(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/businesses/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetIndividuals(
    params?: { sectorCode?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const q = new URLSearchParams();
    if (params?.sectorCode) q.set('sectorCode', params.sectorCode);
    return this.v12Json(`/api/v22/individuals${q.toString() ? `?${q.toString()}` : ''}`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v22CreateIndividual(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/individuals', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetMarketplace(
    params?: { sectorCode?: string; offerKind?: string; q?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const q = new URLSearchParams();
    if (params?.sectorCode) q.set('sectorCode', params.sectorCode);
    if (params?.offerKind) q.set('offerKind', params.offerKind);
    if (params?.q) q.set('q', params.q);
    return this.v12Json(`/api/v22/marketplace${q.toString() ? `?${q.toString()}` : ''}`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v22CreateListing(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/marketplace', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetFraudReports(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/marketplace/reports', { headers: this.v12Headers(actor) });
  }

  static async v22ReportListing(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/marketplace/reports', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22ModerateReport(
    reportId: string,
    payload: { decision: 'REMOVE_TARGET' | 'RESTORE_TARGET'; reviewNote?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/marketplace/reports/${encodeURIComponent(reportId)}/moderate`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetActivities(
    params?: { sectorCode?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const q = new URLSearchParams();
    if (params?.sectorCode) q.set('sectorCode', params.sectorCode);
    return this.v12Json(`/api/v22/activities${q.toString() ? `?${q.toString()}` : ''}`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v22CreateActivity(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/activities', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22TransitionActivity(
    activityId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/activities/${encodeURIComponent(activityId)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetTenders(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/tenders', { headers: this.v12Headers(actor) });
  }

  static async v22CreateTender(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/tenders', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22SubmitBid(
    tenderId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/tenders/${encodeURIComponent(tenderId)}/bids`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22AwardTender(
    tenderId: string,
    payload: { bidId: string; evaluationScore?: number; justification: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/tenders/${encodeURIComponent(tenderId)}/award`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetProjects(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/projects', { headers: this.v12Headers(actor) });
  }

  static async v22CreateProject(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/projects', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22UpdateMilestone(
    projectId: string,
    milestoneId: string,
    payload: { status: string; evidenceNotes?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(
      `/api/v22/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}/update`,
      {
        method: 'POST',
        headers: this.v12Headers(actor),
        body: JSON.stringify(payload),
      }
    );
  }

  static async v22RequestVariation(
    projectId: string,
    payload: { reason: string; scopeDelta: string; budgetDelta?: number; scheduleDeltaDays?: number },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/projects/${encodeURIComponent(projectId)}/variations`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22DecideVariation(
    projectId: string,
    variationId: string,
    decision: 'APPROVED' | 'REJECTED',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(
      `/api/v22/projects/${encodeURIComponent(projectId)}/variations/${encodeURIComponent(variationId)}/decision`,
      {
        method: 'POST',
        headers: this.v12Headers(actor),
        body: JSON.stringify({ decision }),
      }
    );
  }

  static async v22GetInvoices(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/invoices', { headers: this.v12Headers(actor) });
  }

  static async v22CreateInvoice(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/invoices', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22RecordPaymentRef(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/payment-references', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetFxRates(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/fx-rates', { headers: this.v12Headers(actor) });
  }

  static async v22UpsertFxRate(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/fx-rates', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetWorkforceTasks(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/workforce/tasks', { headers: this.v12Headers(actor) });
  }

  static async v22CreateWorkforceTask(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/workforce/tasks', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22UpdateTaskStatus(
    taskId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'DONE',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/workforce/tasks/${encodeURIComponent(taskId)}/status`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ status }),
    });
  }

  static async v22GetInsights(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/intelligence/insights', { headers: this.v12Headers(actor) });
  }

  static async v22AcknowledgeInsight(
    insightId: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v22/intelligence/insights/${encodeURIComponent(insightId)}/acknowledge`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v22AskAssistant(
    query: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/intelligence/assistant', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ query }),
    });
  }

  static async v22GetRelationships(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/relationships', { headers: this.v12Headers(actor) });
  }

  static async v22CreateRelationship(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v22/relationships', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v22GetPlans(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/plans', { headers: this.v12Headers(actor) });
  }

  static async v22Search(query: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v22/search?q=${encodeURIComponent(query)}`, { headers: this.v12Headers(actor) });
  }

  static async v22RunPostgresDryRun(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/postgres/dry-run', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v22GetMigrationStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v22/migration/status', { headers: this.v12Headers(actor) });
  }

  // ==========================================
  // V23: UNIVERSAL WALLET NETWORK, CARDS, QR & REGULATORY GATES
  // ==========================================

  static async v23GetHealth() {
    return this.v12Json('/api/v23/health');
  }

  static async v23GetReadinessMatrix(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/readiness-matrix', { headers: this.v12Headers(actor) });
  }

  static async v23GetOverview(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/overview', { headers: this.v12Headers(actor) });
  }

  static async v23GetIdentities(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/identities', { headers: this.v12Headers(actor) });
  }

  static async v23CreateIdentityAndWallet(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/identities', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23UpdatePortability(
    identityId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/identities/${encodeURIComponent(identityId)}/portability`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23CloseRetainAccount(
    identityId: string,
    reason: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/identities/${encodeURIComponent(identityId)}/close-retain`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ reason }),
    });
  }

  static async v23LookupEuwn(euwn: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v23/lookup/${encodeURIComponent(euwn)}`, { headers: this.v12Headers(actor) });
  }

  static async v23GetWallets(
    scope: 'own' | 'all' = 'own',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/wallets?scope=${scope}`, { headers: this.v12Headers(actor) });
  }

  static async v23EnableSubaccount(
    walletId: string,
    currency: string,
    initialTestMinor = 0,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/wallets/${encodeURIComponent(walletId)}/subaccounts`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ currency, initialTestMinor }),
    });
  }

  static async v23UpdateWalletPin(
    walletId: string,
    payload: { action: 'VERIFY' | 'CHANGE'; currentPin: string; newPin?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/wallets/${encodeURIComponent(walletId)}/pin`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetWalletStatement(walletId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v23/wallets/${encodeURIComponent(walletId)}/statement`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v23PreviewFx(
    payload: { sourceCurrency: string; destinationCurrency: string; sourceAmountMinor: number },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/fx/preview', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23PreviewFees(
    payload: { serviceType: string; countryCode: string; currency: string; amountMinor: number },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/fees/preview', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetTransactions(walletId?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const qs = walletId ? `?walletId=${encodeURIComponent(walletId)}` : '';
    return this.v12Json(`/api/v23/transactions${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v23PostTransaction(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/transactions', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23RefundOrReverse(
    transactionId: string,
    payload: { kind: 'FULL_REVERSAL' | 'PARTIAL_REFUND' | 'FULL_REFUND'; amountMinor?: number; reason: string; merchantId?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/transactions/${encodeURIComponent(transactionId)}/reverse-or-refund`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetMerchants(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/merchants', { headers: this.v12Headers(actor) });
  }

  static async v23RegisterMerchant(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/merchants', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23SetMerchantStatus(
    merchantId: string,
    status: 'ACTIVE_SANDBOX' | 'SUSPENDED',
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/merchants/${encodeURIComponent(merchantId)}/status`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ status }),
    });
  }

  static async v23GetTerminals(merchantId?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : '';
    return this.v12Json(`/api/v23/terminals${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v23CreateTerminal(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/terminals', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetQrRequests(merchantId?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : '';
    return this.v12Json(`/api/v23/qr${qs}`, { headers: this.v12Headers(actor) });
  }

  static async v23CreateQrRequest(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/qr', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23PayQr(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/qr/pay', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetCards(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/cards', { headers: this.v12Headers(actor) });
  }

  static async v23IssueVirtualCard(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/cards/virtual', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23SetVirtualCardStatus(
    cardId: string,
    payload: { targetStatus: string; reason?: string; newWalletId?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/cards/virtual/${encodeURIComponent(cardId)}/status`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23SimulateVirtualCardAuth(
    cardId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/cards/virtual/${encodeURIComponent(cardId)}/authorize-sim`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23ApplyPhysicalCard(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/cards/physical', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23AdvancePhysicalCardStage(
    cardId: string,
    payload: { targetStage: string; note?: string; simPin?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/cards/physical/${encodeURIComponent(cardId)}/stage`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetCountries(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/countries', { headers: this.v12Headers(actor) });
  }

  static async v23RegisterCountry(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/countries', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23UpdateCountryGate(
    countryCode: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/countries/${encodeURIComponent(countryCode)}/gates`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetOfflineQueue(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/offline-queue', { headers: this.v12Headers(actor) });
  }

  static async v23EnqueueOfflineItem(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/offline-queue', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetCompliance(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/compliance', { headers: this.v12Headers(actor) });
  }

  static async v23ReviewCompliance(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v23/compliance/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetRiskEvents(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/risk-events', { headers: this.v12Headers(actor) });
  }

  static async v23GetAuditEvents(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/audit-events', { headers: this.v12Headers(actor) });
  }

  static async v23GetSupportCases(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/support-cases', { headers: this.v12Headers(actor) });
  }

  static async v23CreateSupportCase(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/support-cases', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23GetFees(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/fees', { headers: this.v12Headers(actor) });
  }

  static async v23GetIntegrations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/integrations', { headers: this.v12Headers(actor) });
  }

  static async v23LinkModulePayment(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/integrations/link-payment', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v23RunReconciliation(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/reconciliations/run', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v23RunContinuityDrills(
    scenarioCode?: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v23/continuity/run', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(scenarioCode ? { scenarioCode } : {}),
    });
  }

  static async v23RunPostgresAudit(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v23/postgres-audit', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  // ==========================================
  // V24 UNIVERSAL COMMERCE, SUPPLY CHAIN & EXECUTION NETWORK
  // ==========================================

  static async v24GetSectors() {
    return this.v12Json('/api/v24/sectors', { headers: this.v12Headers() });
  }

  static async v24GetCorridors() {
    return this.v12Json('/api/v24/corridors', { headers: this.v12Headers() });
  }

  static async v24GetReadinessMatrix() {
    return this.v12Json('/api/v24/readiness-matrix', { headers: this.v12Headers() });
  }

  static async v24GetParticipants(
    filters?: { sectorId?: string; countryCode?: string; organizationType?: string; verificationStatus?: string },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const qs = new URLSearchParams();
    if (filters?.sectorId) qs.set('sectorId', filters.sectorId);
    if (filters?.countryCode) qs.set('countryCode', filters.countryCode);
    if (filters?.organizationType) qs.set('organizationType', filters.organizationType);
    if (filters?.verificationStatus) qs.set('verificationStatus', filters.verificationStatus);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.v12Json(`/api/v24/participants${suffix}`, { headers: this.v12Headers(actor) });
  }

  static async v24RegisterParticipant(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/participants', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetListings(filters?: {
    keyword?: string;
    q?: string;
    sectorId?: string;
    countryCode?: string;
    listingType?: string;
    verifiedOnly?: boolean;
    deliveryAvailable?: boolean;
    maxPriceMinor?: number;
  }) {
    const qs = new URLSearchParams();
    if (filters?.keyword) qs.set('keyword', filters.keyword);
    if (filters?.q) qs.set('q', filters.q);
    if (filters?.sectorId) qs.set('sectorId', filters.sectorId);
    if (filters?.countryCode) qs.set('countryCode', filters.countryCode);
    if (filters?.listingType) qs.set('listingType', filters.listingType);
    if (filters?.verifiedOnly) qs.set('verifiedOnly', 'true');
    if (filters?.deliveryAvailable) qs.set('deliveryAvailable', 'true');
    if (filters?.maxPriceMinor !== undefined) qs.set('maxPriceMinor', String(filters.maxPriceMinor));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this.v12Json(`/api/v24/listings${suffix}`, { headers: this.v12Headers() });
  }

  static async v24CreateListing(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/listings', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetSavedSearches(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/saved-searches', { headers: this.v12Headers(actor) });
  }

  static async v24SaveSearch(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/saved-searches', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetRfqs(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/rfqs', { headers: this.v12Headers(actor) });
  }

  static async v24CreateRfq(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/rfqs', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetQuotations(rfqId?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const suffix = rfqId ? `?rfqId=${encodeURIComponent(rfqId)}` : '';
    return this.v12Json(`/api/v24/quotations${suffix}`, { headers: this.v12Headers(actor) });
  }

  static async v24SubmitQuotation(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/quotations', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24DecideQuotation(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/quotations/${encodeURIComponent(id)}/decide`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetNegotiations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/negotiations', { headers: this.v12Headers(actor) });
  }

  static async v24PostNegotiationMessage(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/negotiations/messages', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetAgreements(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/agreements', { headers: this.v12Headers(actor) });
  }

  static async v24CreateAgreement(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/agreements', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24TransitionAgreement(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/agreements/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetOrders(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/orders', { headers: this.v12Headers(actor) });
  }

  static async v24CreateOrder(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/orders', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24TransitionOrder(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/orders/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetWarehouses(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/warehouses', { headers: this.v12Headers(actor) });
  }

  static async v24GetInventory(warehouseId?: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    const suffix = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : '';
    return this.v12Json(`/api/v24/inventory${suffix}`, { headers: this.v12Headers(actor) });
  }

  static async v24ReceiveInventory(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/inventory/receive', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24AdjustInventory(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/inventory/adjust', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetInventoryMovements(
    inventoryItemId?: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    const suffix = inventoryItemId ? `?inventoryItemId=${encodeURIComponent(inventoryItemId)}` : '';
    return this.v12Json(`/api/v24/inventory/movements${suffix}`, { headers: this.v12Headers(actor) });
  }

  static async v24ReconcileInventory(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/inventory/reconcile', { headers: this.v12Headers(actor) });
  }

  static async v24GetProcurementRequests(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/procurement', { headers: this.v12Headers(actor) });
  }

  static async v24CreateProcurementRequest(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/procurement', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24ApproveProcurementRequest(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/procurement/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetPurchaseOrders(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/purchase-orders', { headers: this.v12Headers(actor) });
  }

  static async v24PerformThreeWayMatch(
    poId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/purchase-orders/${encodeURIComponent(poId)}/three-way-match`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetBoms(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/boms', { headers: this.v12Headers(actor) });
  }

  static async v24GetProductionOrders(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/production-orders', { headers: this.v12Headers(actor) });
  }

  static async v24ExecuteProductionBatch(
    poId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/production-orders/${encodeURIComponent(poId)}/execute`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetShipments(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/shipments', { headers: this.v12Headers(actor) });
  }

  static async v24CreateShipment(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/shipments', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24TransitionShipment(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/shipments/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetDocuments(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/documents', { headers: this.v12Headers(actor) });
  }

  static async v24CreateDocument(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/documents', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24ShareDocument(
    docId: string,
    ttlHours: number,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/documents/${encodeURIComponent(docId)}/share`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({ ttlHours }),
    });
  }

  static async v24GetObligations(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/obligations', { headers: this.v12Headers(actor) });
  }

  static async v24PayObligation(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/obligations/${encodeURIComponent(id)}/pay`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24RefundObligation(
    id: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/obligations/${encodeURIComponent(id)}/refund`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetProjects(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/projects', { headers: this.v12Headers(actor) });
  }

  static async v24CreateProject(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/projects', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24TransitionMilestone(
    projectId: string,
    milestoneId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(
      `/api/v24/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}/transition`,
      {
        method: 'POST',
        headers: this.v12Headers(actor),
        body: JSON.stringify(payload),
      }
    );
  }

  static async v24GetReviews(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/reviews', { headers: this.v12Headers(actor) });
  }

  static async v24SubmitReview(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/reviews', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24AppealReview(
    reviewId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/reviews/${encodeURIComponent(reviewId)}/appeal`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetTrustProfile(
    participantId: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/trust/${encodeURIComponent(participantId)}`, {
      headers: this.v12Headers(actor),
    });
  }

  static async v24GetThreads(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/threads', { headers: this.v12Headers(actor) });
  }

  static async v24PostThreadMessage(
    threadId: string,
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v24/threads/${encodeURIComponent(threadId)}/messages`, {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetOfflineDrafts(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/offline-drafts', { headers: this.v12Headers(actor) });
  }

  static async v24SyncOfflineDraft(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/offline-drafts/sync', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetIntelligence(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/intelligence', { headers: this.v12Headers(actor) });
  }

  static async v24Search(q: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v24/search?q=${encodeURIComponent(q)}`, { headers: this.v12Headers(actor) });
  }

  static async v24AskAiAssist(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/ai/assist', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24GetApiCredentials(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/api-credentials', { headers: this.v12Headers(actor) });
  }

  static async v24IssueApiCredential(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/api-credentials', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24RevokeApiCredential(id: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v24/api-credentials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.v12Headers(actor),
    });
  }

  static async v24GetWebhooks(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/webhooks', { headers: this.v12Headers(actor) });
  }

  static async v24DeliverWebhook(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v24/webhooks/deliver', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v24RunPostgresAudit(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/postgres-audit', {
      method: 'POST',
      headers: this.v12Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v24GetRollbackReadiness(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v24/rollback-readiness', { headers: this.v12Headers(actor) });
  }

  // ==========================================
  // V25 CONTINENTAL INFRASTRUCTURE & SOVEREIGN PLATFORM
  // ==========================================

  private static v25Headers(
    actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ): Record<string, string> {
    const base = this.v12Headers(actor);
    if (actor?.organisationId) base['x-org-id'] = actor.organisationId;
    if (actor?.countryCode) base['x-country-code'] = actor.countryCode;
    return base;
  }

  static async v25GetHealth() {
    return this.v12Json('/api/v25/health', { headers: this.v25Headers() });
  }

  static async v25GetTelemetry(actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/telemetry', { headers: this.v25Headers(actor) });
  }

  static async v25GetReadinessMatrix() {
    return this.v12Json('/api/v25/readiness-matrix', { headers: this.v25Headers() });
  }

  static async v25GetOpenApiSpec() {
    return this.v12Json('/api/v25/openapi.json', { headers: this.v25Headers() });
  }

  static async v25GetPostgresStatus(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/postgres/status', { headers: this.v25Headers(actor) });
  }

  static async v25RunPostgresMigration(
    payload?: { simulateInterruptAtStage?: number; resumeFromRunId?: string; attemptLivePg?: boolean },
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v25/postgres/migrate', {
      method: 'POST',
      headers: this.v25Headers(actor),
      body: JSON.stringify(payload || {}),
    });
  }

  static async v25GetOrganisations(actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/organisations', { headers: this.v25Headers(actor) });
  }

  static async v25CreateOrganisation(
    payload: Record<string, any>,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v25/organisations', {
      method: 'POST',
      headers: this.v25Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v25SwitchOrganisation(
    organisationId: string,
    actor?: { tenantId?: string; userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v25/organisations/switch', {
      method: 'POST',
      headers: this.v25Headers(actor),
      body: JSON.stringify({ organisationId }),
    });
  }

  static async v25CreateBusinessUnit(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/organisations/business-units', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25CreateBranch(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/organisations/branches', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25GrantMembership(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/organisations/memberships', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25EvaluateRbac(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/rbac/evaluate', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25GetIdentitySecurityState(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/identity/security-state', { headers: this.v25Headers(actor) });
  }

  static async v25RegisterDevice(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/identity/devices', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25CreateSession(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/identity/sessions', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25RevokeSession(sessionId: string, revokeAllForUser = false, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v25/identity/sessions/${encodeURIComponent(sessionId)}/revoke`, {
      method: 'POST',
      headers: this.v25Headers(actor),
      body: JSON.stringify({ revokeAllForUser }),
    });
  }

  static async v25IssueMfaChallenge(payload?: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/identity/mfa/challenge', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload || {}) });
  }

  static async v25VerifyMfaChallenge(payload: { challengeId: string; code: string; userId?: string }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/identity/mfa/verify', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25GetLedgerTransactions(actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/ledger/transactions', { headers: this.v25Headers(actor) });
  }

  static async v25InitiateLedgerTransaction(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/ledger/transactions', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25TransitionLedgerTransaction(id: string, targetState: string, note: string, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v25/ledger/transactions/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      headers: this.v25Headers(actor),
      body: JSON.stringify({ targetState, note }),
    });
  }

  static async v25RunConcurrencyProof(payload?: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/ledger/concurrency-proof', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload || {}) });
  }

  static async v25GetOutboxAndAudit(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/outbox/events', { headers: this.v25Headers(actor) });
  }

  static async v25DispatchOutboxEvent(eventId: string, payload?: { consumerName?: string; simulateFailure?: boolean }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v25/outbox/events/${encodeURIComponent(eventId)}/dispatch`, {
      method: 'POST',
      headers: this.v25Headers(actor),
      body: JSON.stringify(payload || {}),
    });
  }

  static async v25ReplayDeadLetter(dlqId: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v25/outbox/dlq/${encodeURIComponent(dlqId)}/replay`, { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify({}) });
  }

  static async v25GetJobs(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/jobs', { headers: this.v25Headers(actor) });
  }

  static async v25EnqueueJob(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/jobs', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25GetDeveloperPlatform(actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/developer/platform', { headers: this.v25Headers(actor) });
  }

  static async v25CreateApiApp(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/developer/apps', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25IssueScopedApiKey(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/developer/keys', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25RevokeApiKey(keyId: string, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v25/developer/keys/${encodeURIComponent(keyId)}/revoke`, { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify({}) });
  }

  static async v25RegisterWebhook(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/developer/webhooks', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25DeliverWebhook(endpointId: string, payload?: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v25/developer/webhooks/${encodeURIComponent(endpointId)}/deliver`, {
      method: 'POST',
      headers: this.v25Headers(actor),
      body: JSON.stringify(payload || {}),
    });
  }

  static async v25GetCountries(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/countries', { headers: this.v25Headers(actor) });
  }

  static async v25RegisterCountry(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/countries', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25ActivateCountry(code: string, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v25/countries/${encodeURIComponent(code)}/activate`, { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify({}) });
  }

  static async v25GetFxQuotes(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/fx/quotes', { headers: this.v25Headers(actor) });
  }

  static async v25CreateFxQuote(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/fx/quotes', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25ExecuteFxClearing(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/fx/clear', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25GetVaultDocuments(actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/vault/documents', { headers: this.v25Headers(actor) });
  }

  static async v25UploadVaultDocument(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/vault/documents', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25IssueVaultDownloadToken(docId: string, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v25/vault/documents/${encodeURIComponent(docId)}/download-token`, { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify({}) });
  }

  static async v25RedeemVaultDownloadToken(token: string, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v25/vault/download/${encodeURIComponent(token)}`, { headers: this.v25Headers(actor) });
  }

  static async v25GetSecurityIncidents(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/security/incidents', { headers: this.v25Headers(actor) });
  }

  static async v25CreateSecurityIncident(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/security/incidents', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25AdvanceSecurityIncident(id: string, payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v25/security/incidents/${encodeURIComponent(id)}/advance`, { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25GetComplianceRecords(actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/compliance/records', { headers: this.v25Headers(actor) });
  }

  static async v25UpsertComplianceRecord(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/compliance/records', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25GetPlatformBilling(actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/billing/plans', { headers: this.v25Headers(actor) });
  }

  static async v25SubscribePlan(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/billing/subscribe', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  static async v25Search(q: string, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v25/search?q=${encodeURIComponent(q)}`, { headers: this.v25Headers(actor) });
  }

  static async v25RunBackupDrill(actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/resilience/backup-drill', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify({}) });
  }

  static async v25RunLoadBenchmark(payload?: { concurrency?: number; totalRequests?: number }, actor?: { tenantId?: string; userId?: string; userRole?: string }) {
    return this.v12Json('/api/v25/resilience/load-benchmark', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload || {}) });
  }

  static async v25AskAiAssist(payload: Record<string, any>, actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v25/ai/assist', { method: 'POST', headers: this.v25Headers(actor), body: JSON.stringify(payload) });
  }

  // ==========================================
  // V26 UNIVERSAL PLATFORM ACTIVATION & COMPLETE WORKFLOWS
  // ==========================================

  private static v26Headers(
    actor?: { tenantId?: string; userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ): Record<string, string> {
    const base = this.v25Headers(actor);
    if (!base['x-country-code']) {
      const savedCountry = typeof localStorage !== 'undefined' ? localStorage.getItem('econex_active_country') : null;
      if (savedCountry) base['x-country-code'] = savedCountry;
    }
    if (!base['x-org-id']) {
      const savedOrg = typeof localStorage !== 'undefined' ? localStorage.getItem('econex_active_workspace') : null;
      if (savedOrg) base['x-org-id'] = savedOrg;
    }
    return base;
  }

  static async v26GetHealth() {
    return this.v12Json('/api/v26/health', { headers: this.v26Headers() });
  }

  static async v26GetReadinessMatrix() {
    return this.v12Json('/api/v26/readiness-matrix', { headers: this.v26Headers() });
  }

  static async v26GetOpenApiSpec() {
    return this.v12Json('/api/v26/openapi.json', { headers: this.v26Headers() });
  }

  static async v26GetLocalization() {
    return this.v12Json('/api/v26/localization', { headers: this.v26Headers() });
  }

  static async v26GetHomeSummary(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v26/home-summary', { headers: this.v26Headers(actor) });
  }

  static async v26GetPreferences(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v26/preferences', { headers: this.v26Headers(actor) });
  }

  static async v26UpdatePreferences(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v26/preferences', {
      method: 'PUT',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26GetUserOnboarding(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v26/onboarding/user', { headers: this.v26Headers(actor) });
  }

  static async v26UpdateUserOnboarding(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v26/onboarding/user', {
      method: 'PUT',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26UpdateAccountProfile(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v26/account/profile', {
      method: 'PUT',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26RequestRecoveryOrVerification(
    payload: { requestType?: 'CONTACT_VERIFY' | 'ACCESS_RECOVERY'; contactChannel?: 'EMAIL' | 'PHONE_SMS'; contactTarget?: string },
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v26/account/recovery/request', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26VerifyRecoveryOrContact(
    payload: { requestId: string; code: string },
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v26/account/recovery/verify', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26GetDevicesAndSessions(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v26/account/devices-sessions', { headers: this.v26Headers(actor) });
  }

  static async v26ListBusinessOnboardings(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v26/onboarding/business', { headers: this.v26Headers(actor) });
  }

  static async v26OnboardBusinessEntity(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v26/onboarding/business', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26GetWorkspaces(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v26/workspaces/active', { headers: this.v26Headers(actor) });
  }

  static async v26SwitchWorkspace(
    organisationId: string,
    actor?: { userId?: string; userRole?: string; organisationId?: string }
  ) {
    return this.v12Json('/api/v26/workspaces/switch', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify({ organisationId }),
    });
  }

  static async v26GetCommerceWorkflows(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v26/workflows/commerce-e2e', { headers: this.v26Headers(actor) });
  }

  static async v26StartCommerceWorkflow(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string }
  ) {
    return this.v12Json('/api/v26/workflows/commerce-e2e', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26AdvanceCommerceWorkflow(
    id: string,
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string }
  ) {
    return this.v12Json(`/api/v26/workflows/${encodeURIComponent(id)}/advance`, {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26GetSavedItems(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v26/marketplace/saved', { headers: this.v26Headers(actor) });
  }

  static async v26CreateSavedItem(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v26/marketplace/saved', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26DeleteSavedItem(id: string, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v26/marketplace/saved/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.v26Headers(actor),
    });
  }

  static async v26GetNotifications(
    filters?: { unreadOnly?: boolean; archived?: 'true' | 'false' | 'all'; category?: string },
    actor?: { userId?: string; userRole?: string }
  ) {
    const params = new URLSearchParams();
    if (filters?.unreadOnly) params.set('unreadOnly', 'true');
    if (filters?.archived) params.set('archived', filters.archived);
    if (filters?.category && filters.category !== 'ALL') params.set('category', filters.category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.v12Json(`/api/v26/notifications${qs}`, { headers: this.v26Headers(actor) });
  }

  static async v26CreateNotification(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v26/notifications', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26MarkAllNotificationsRead(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v26/notifications/mark-all-read', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v26MarkNotificationRead(id: string, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v26/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v26ArchiveNotification(id: string, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v26/notifications/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v26GetNotificationPreferences(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v26/notifications/preferences', { headers: this.v26Headers(actor) });
  }

  static async v26UpdateNotificationPreferences(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v26/notifications/preferences', {
      method: 'PUT',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26Search(q: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v26/search?q=${encodeURIComponent(q)}`, { headers: this.v26Headers(actor) });
  }

  static async v26GetQuickActions(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v26/quick-actions', { headers: this.v26Headers(actor) });
  }

  static async v26GetDocuments(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v26/documents', { headers: this.v26Headers(actor) });
  }

  static async v26ShareDocument(
    payload: { documentId: string; permission?: 'VIEW' | 'DOWNLOAD'; ttlHours?: number; targetUserId?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string }
  ) {
    return this.v12Json('/api/v26/documents/share', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26RevokeDocumentShare(shareId: string, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v26/documents/shares/${encodeURIComponent(shareId)}/revoke`, {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v26ResolveDocumentShare(token: string) {
    return this.v12Json(`/api/v26/documents/share/${encodeURIComponent(token)}`, { headers: this.v26Headers() });
  }

  static async v26GetReports(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v26/reports', { headers: this.v26Headers(actor) });
  }

  static async v26GenerateReport(
    payload: { reportType: string; format: 'CSV' | 'JSON' | 'PDF' },
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json('/api/v26/reports/generate', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26DownloadReportBlob(
    reportId: string,
    actor?: { userId?: string; userRole?: string }
  ): Promise<{ blob: Blob; filename: string; contentType: string; sha256: string | null }> {
    const res = await fetch(`/api/v26/reports/${encodeURIComponent(reportId)}/download`, {
      headers: this.v26Headers(actor),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Report download failed (${res.status})`);
    }
    const blob = await res.blob();
    const disp = res.headers.get('Content-Disposition') || '';
    const match = disp.match(/filename="([^"]+)"/);
    return {
      blob,
      filename: match ? match[1] : `ECONEX-${reportId}`,
      contentType: res.headers.get('Content-Type') || 'application/octet-stream',
      sha256: res.headers.get('X-Content-SHA256'),
    };
  }

  static async v26GetSupportTickets(statusFilter = 'ALL', actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v26/support/tickets?status=${encodeURIComponent(statusFilter)}`, {
      headers: this.v26Headers(actor),
    });
  }

  static async v26CreateSupportTicket(
    payload: { subject: string; description?: string; details?: string; category?: string; priority?: string; linkedOrderId?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string }
  ) {
    return this.v12Json('/api/v26/support/tickets', {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26ReplySupportTicket(
    ticketId: string,
    payload: { messageBody: string; isInternalNote?: boolean },
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v26/support/tickets/${encodeURIComponent(ticketId)}/reply`, {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26UpdateSupportTicketStatus(
    ticketId: string,
    payload: { status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'; resolutionNote?: string },
    actor?: { userId?: string; userRole?: string }
  ) {
    return this.v12Json(`/api/v26/support/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'POST',
      headers: this.v26Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v26GetAuditControls(filters?: { status?: string; module?: string; q?: string }) {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.module && filters.module !== 'ALL') params.set('module', filters.module);
    if (filters?.q) params.set('q', filters.q);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.v12Json(`/api/v26/audit/controls${qs}`, { headers: this.v26Headers() });
  }

  static async v26GetAuditRoutes(roleFilter?: string) {
    const qs = roleFilter ? `?role=${encodeURIComponent(roleFilter)}` : '';
    return this.v12Json(`/api/v26/audit/routes${qs}`, { headers: this.v26Headers() });
  }

  static async v26GetAuditWorkflows() {
    return this.v12Json('/api/v26/audit/workflows', { headers: this.v26Headers() });
  }

  static async v26GetMigrationStatus() {
    return this.v12Json('/api/v26/migration/status', { headers: this.v26Headers() });
  }

  static async v26VerifyV25Backup() {
    return this.v12Json('/api/v26/migration/backup-verify', { headers: this.v26Headers() });
  }

  // ==========================================
  // V27 UNIVERSAL ECONOMIC NETWORK, TRUST, OPPORTUNITIES & GOVERNANCE
  // ==========================================

  private static v27Headers(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v26Headers(actor);
  }

  static async v27GetHealth() {
    return this.v12Json('/api/v27/health', { headers: this.v27Headers() });
  }

  static async v27GetReadinessMatrix() {
    return this.v12Json('/api/v27/readiness-matrix', { headers: this.v27Headers() });
  }

  static async v27GetParticipants(
    filters?: { q?: string; countryCode?: string; sectorId?: string; participantType?: string; verifiedOnly?: boolean },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    const p = new URLSearchParams();
    if (filters?.q) p.set('q', filters.q);
    if (filters?.countryCode && filters.countryCode !== 'ALL') p.set('countryCode', filters.countryCode);
    if (filters?.sectorId && filters.sectorId !== 'ALL') p.set('sectorId', filters.sectorId);
    if (filters?.participantType && filters.participantType !== 'ALL') p.set('participantType', filters.participantType);
    if (filters?.verifiedOnly) p.set('verifiedOnly', 'true');
    const qs = p.toString() ? `?${p.toString()}` : '';
    return this.v12Json(`/api/v27/participants${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27CreateParticipant(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v27/participants', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27UpdatePrivacy(profileId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/participants/${encodeURIComponent(profileId)}/privacy`, {
      method: 'PUT',
      headers: this.v27Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v27GetRelationships(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/relationships', { headers: this.v27Headers(actor) });
  }

  static async v27InviteRelationship(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/relationships', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27RespondRelationship(relId: string, decision: 'ACCEPTED' | 'REJECTED', reason?: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/relationships/${encodeURIComponent(relId)}/respond`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify({ decision, reason }),
    });
  }

  static async v27GetVerificationRecords(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/verification', { headers: this.v27Headers(actor) });
  }

  static async v27SubmitVerification(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/verification', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27DecideVerification(recordId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/verification/${encodeURIComponent(recordId)}/decision`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v27GetReputationReviews(targetProfileId?: string, actor?: { userId?: string; userRole?: string }) {
    const qs = targetProfileId ? `?targetProfileId=${encodeURIComponent(targetProfileId)}` : '';
    return this.v12Json(`/api/v27/reputation/reviews${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27SubmitReputationReview(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/reputation/reviews', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27GetReputationAppeals(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/reputation/appeals', { headers: this.v27Headers(actor) });
  }

  static async v27FileReputationAppeal(payload: Record<string, any>, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/reputation/appeals', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27Discover(filters?: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    const p = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') p.set(k, String(v));
    });
    const qs = p.toString() ? `?${p.toString()}` : '';
    return this.v12Json(`/api/v27/discover${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27GetSavedSearches(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/saved-searches', { headers: this.v27Headers(actor) });
  }

  static async v27SaveSearch(payload: Record<string, any>, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/saved-searches', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27GetMatches(sectorId?: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    const qs = sectorId && sectorId !== 'ALL' ? `?sectorId=${encodeURIComponent(sectorId)}` : '';
    return this.v12Json(`/api/v27/matching/recommendations${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27SubmitMatchFeedback(payload: Record<string, any>, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/matching/feedback', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27GetOpportunities(filters?: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    const p = new URLSearchParams();
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') p.set(k, String(v));
    });
    const qs = p.toString() ? `?${p.toString()}` : '';
    return this.v12Json(`/api/v27/opportunities${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27CreateOpportunity(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v27/opportunities', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27RespondOpportunity(oppId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/opportunities/${encodeURIComponent(oppId)}/responses`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v27AwardOpportunity(oppId: string, responseId: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/opportunities/${encodeURIComponent(oppId)}/award`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify({ responseId }),
    });
  }

  static async v27LinkOpportunityObligation(oppId: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/opportunities/${encodeURIComponent(oppId)}/link-obligation`, {
      method: 'POST',
      headers: this.v27Headers(actor),
    });
  }

  static async v27GetBuyerRequirements(sectorId?: string, actor?: { userId?: string; userRole?: string }) {
    const qs = sectorId && sectorId !== 'ALL' ? `?sectorId=${encodeURIComponent(sectorId)}` : '';
    return this.v12Json(`/api/v27/buyer-requirements${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27CreateBuyerRequirement(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/buyer-requirements', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27GetSupplierCapabilities(sectorId?: string, actor?: { userId?: string; userRole?: string }) {
    const qs = sectorId && sectorId !== 'ALL' ? `?sectorId=${encodeURIComponent(sectorId)}` : '';
    return this.v12Json(`/api/v27/supplier-capabilities${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27CreateSupplierCapability(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/supplier-capabilities', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27GetCrmLeads(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/crm/leads', { headers: this.v27Headers(actor) });
  }

  static async v27CreateCrmLead(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/crm/leads', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27UpdateCrmStage(leadId: string, stage: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/crm/leads/${encodeURIComponent(leadId)}/stage`, {
      method: 'PUT',
      headers: this.v27Headers(actor),
      body: JSON.stringify({ stage }),
    });
  }

  static async v27GetPromotions(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/promotions', { headers: this.v27Headers(actor) });
  }

  static async v27CreatePromotion(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/promotions', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27GetThreads(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/threads', { headers: this.v27Headers(actor) });
  }

  static async v27CreateThread(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/threads', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27PostThreadMessage(threadId: string, body: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json(`/api/v27/threads/${encodeURIComponent(threadId)}/messages`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify({ body }),
    });
  }

  static async v27GetGraph(profileId?: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    const qs = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
    return this.v12Json(`/api/v27/graph${qs}`, { headers: this.v27Headers(actor) });
  }

  static async v27GetIntelligenceSummary(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/intelligence/summary', { headers: this.v27Headers(actor) });
  }

  static async v27GetCountryMatrix() {
    return this.v12Json('/api/v27/intelligence/countries', { headers: this.v27Headers() });
  }

  static async v27AiAssist(payload: { taskType?: string; prompt: string; countryCode?: string }, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/intelligence/ai-assist', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27GetReferrals(actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/referrals', { headers: this.v27Headers(actor) });
  }

  static async v27CreateReferral(referredEmail: string, actor?: { userId?: string; userRole?: string; organisationId?: string }) {
    return this.v12Json('/api/v27/referrals', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify({ referredEmail }) });
  }

  static async v27GetOutcomes(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/outcomes', { headers: this.v27Headers(actor) });
  }

  static async v27GetPilots(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/pilots', { headers: this.v27Headers(actor) });
  }

  static async v27TransitionPilotStatus(pilotId: string, status: string, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v27/pilots/${encodeURIComponent(pilotId)}/status`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify({ status }),
    });
  }

  static async v27GetFieldAssignments(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/field/assignments', { headers: this.v27Headers(actor) });
  }

  static async v27GetFieldReports(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/field/reports', { headers: this.v27Headers(actor) });
  }

  static async v27SyncFieldReport(payload: Record<string, any>, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/field/reports', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27ReviewFieldReport(reportId: string, decision: string, reviewDecisionNote: string, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v27/field/reports/${encodeURIComponent(reportId)}/review`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify({ decision, reviewDecisionNote }),
    });
  }

  static async v27GetPartners(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/partners', { headers: this.v27Headers(actor) });
  }

  static async v27TransitionPartner(partnerId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v27/partners/${encodeURIComponent(partnerId)}/status`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v27GetModerationCases(actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/moderation/cases', { headers: this.v27Headers(actor) });
  }

  static async v27ReportModerationCase(payload: Record<string, any>, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json('/api/v27/moderation/cases', { method: 'POST', headers: this.v27Headers(actor), body: JSON.stringify(payload) });
  }

  static async v27DecideModerationCase(caseId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string }) {
    return this.v12Json(`/api/v27/moderation/cases/${encodeURIComponent(caseId)}/decide`, {
      method: 'POST',
      headers: this.v27Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  // ==========================================
  // V28 UNIVERSAL ECONOMIC EXECUTION, INTEROPERABILITY & CONTINENTAL OPERATIONS
  // ==========================================

  private static v28Headers(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v27Headers(actor);
  }

  static async v28GetHealth() {
    return this.v12Json('/api/v28/health', { headers: this.v28Headers() });
  }

  static async v28GetReadinessMatrix() {
    return this.v12Json('/api/v28/readiness-matrix', { headers: this.v28Headers() });
  }

  static async v28GetMigrationStatus() {
    return this.v12Json('/api/v28/migration/status', { headers: this.v28Headers() });
  }

  static async v28GetBackupVerify() {
    return this.v12Json('/api/v28/migration/backup-verify', { headers: this.v28Headers() });
  }

  static async v28GetWorkspace(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/workspace', { headers: this.v28Headers(actor) });
  }

  static async v28GetExecutions(
    filters?: { stage?: string; status?: string; countryCode?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    const p = new URLSearchParams();
    if (filters?.stage && filters.stage !== 'ALL') p.set('stage', filters.stage);
    if (filters?.status && filters.status !== 'ALL') p.set('status', filters.status);
    if (filters?.countryCode && filters.countryCode !== 'ALL') p.set('countryCode', filters.countryCode);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return this.v12Json(`/api/v28/executions${qs}`, { headers: this.v28Headers(actor) });
  }

  static async v28CreateExecution(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/executions', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28TransitionExecution(workflowId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/executions/${encodeURIComponent(workflowId)}/transition`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28GetContracts(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/contracts', { headers: this.v28Headers(actor) });
  }

  static async v28CreateContract(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/contracts', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28TransitionContract(contractId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/contracts/${encodeURIComponent(contractId)}/transition`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28CreateContractObligation(contractId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/contracts/${encodeURIComponent(contractId)}/obligations`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28GetProcurement(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/procurement', { headers: this.v28Headers(actor) });
  }

  static async v28CreateProcurementPlan(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/procurement/plans', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28CreateProcurementRequisition(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/procurement/requisitions', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28DecideProcurementRequisition(reqId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/procurement/requisitions/${encodeURIComponent(reqId)}/decide`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28EvaluateProcurementRequisition(reqId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/procurement/requisitions/${encodeURIComponent(reqId)}/evaluate`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28GetFulfilment(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/fulfilment', { headers: this.v28Headers(actor) });
  }

  static async v28ReserveFulfilmentStock(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/fulfilment/reserve', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28RecordFulfilmentMilestone(planId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/fulfilment/${encodeURIComponent(planId)}/record`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28GetCrossBorder(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/cross-border', { headers: this.v28Headers(actor) });
  }

  static async v28CreateCrossBorder(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/cross-border', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28GetWalletCoordination(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/wallet/coordination', { headers: this.v28Headers(actor) });
  }

  static async v28ExecuteSandboxTransfer(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/wallet/transfer', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28ReverseSandboxTransfer(txId: string, reason: string, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/wallet/reverse/${encodeURIComponent(txId)}`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify({ reason }),
    });
  }

  static async v28GetConnectors(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/interoperability/connectors', { headers: this.v28Headers(actor) });
  }

  static async v28TransitionConnector(connectorId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/interoperability/connectors/${encodeURIComponent(connectorId)}/transition`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28SignWebhook(payload: Record<string, any>, secret: string, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/interoperability/webhook-sign', {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify({ payload, secret }),
    });
  }

  static async v28GetEvents(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/events', { headers: this.v28Headers(actor) });
  }

  static async v28ReplayDlqEvent(dlqId: string, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/events/dlq/${encodeURIComponent(dlqId)}/replay`, {
      method: 'POST',
      headers: this.v28Headers(actor),
    });
  }

  static async v28GetVaultDocuments(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/vault/documents', { headers: this.v28Headers(actor) });
  }

  static async v28RegisterVaultDocument(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/vault/documents', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28UpdateVaultGovernance(docId: string, action: string, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/vault/documents/${encodeURIComponent(docId)}/governance`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify({ action }),
    });
  }

  static async v28GetContinentalIntelligence(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/intelligence/continental', { headers: this.v28Headers(actor) });
  }

  static async v28RunAiOrchestration(payload: { taskType: string; prompt: string }, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/ai/orchestrate', { method: 'POST', headers: this.v28Headers(actor), body: JSON.stringify(payload) });
  }

  static async v28GetAiRuns(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/ai/runs', { headers: this.v28Headers(actor) });
  }

  static async v28GetControlCentre(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/operations/control-centre', { headers: this.v28Headers(actor) });
  }

  static async v28ResolveException(exceptionId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/operations/exceptions/${encodeURIComponent(exceptionId)}/resolve`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28CreateDualApproval(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/operations/dual-approvals', {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28DecideDualApproval(requestId: string, decision: 'APPROVE' | 'REJECT', actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/operations/dual-approvals/${encodeURIComponent(requestId)}/decide`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify({ decision }),
    });
  }

  static async v28GetFieldOfflineRecords(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/field/offline-records', { headers: this.v28Headers(actor) });
  }

  static async v28SyncFieldOfflineRecord(payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v28/field/offline-records', {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28ResolveFieldConflict(recordId: string, payload: Record<string, any>, actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json(`/api/v28/field/offline-records/${encodeURIComponent(recordId)}/resolve`, {
      method: 'POST',
      headers: this.v28Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v28GetRepositoryHealth() {
    return this.v12Json('/api/v28/developer/repository-health', { headers: this.v28Headers() });
  }

  // ==========================================
  // V30 UNIVERSAL FINANCIAL INTEROPERABILITY, RESILIENCE & EXECUTION APIs
  // ==========================================

  private static v30Headers(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v27Headers(actor);
  }

  static async v30GetHealth() {
    return this.v12Json('/api/v30/health', { headers: this.v30Headers() });
  }

  static async v30GetReadinessMatrix() {
    return this.v12Json('/api/v30/readiness-matrix', { headers: this.v30Headers() });
  }

  static async v30GetMigrationStatus() {
    return this.v12Json('/api/v30/migration/status', { headers: this.v30Headers() });
  }

  static async v30GetBackupVerify() {
    return this.v12Json('/api/v30/migration/backup-verify', { headers: this.v30Headers() });
  }

  static async v30GetOverview(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/overview', { headers: this.v30Headers(actor) });
  }

  static async v30GetProviders(
    filters?: { country?: string; currency?: string; category?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    const p = new URLSearchParams();
    if (filters?.country && filters.country !== 'ALL') p.set('country', filters.country);
    if (filters?.currency && filters.currency !== 'ALL') p.set('currency', filters.currency);
    if (filters?.category && filters.category !== 'ALL') p.set('category', filters.category);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return this.v12Json(`/api/v30/providers${qs}`, { headers: this.v30Headers(actor) });
  }

  static async v30TransitionProviderHealth(
    providerId: string,
    payload: { newStatus: string; reason: string; latencyMs?: number; errorRateBps?: number },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v30/providers/${encodeURIComponent(providerId)}/health`, {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30EvaluateRouting(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/routing/evaluate', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetPayments(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/payments', { headers: this.v30Headers(actor) });
  }

  static async v30ExecutePayment(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/payments', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30TransitionPayment(
    paymentId: string,
    payload: { targetState: string; reason?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v30/payments/${encodeURIComponent(paymentId)}/transition`, {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30ResolveReconciliation(
    caseId: string,
    payload: { status: string; resolutionNote: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v30/reconciliation/${encodeURIComponent(caseId)}/resolve`, {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetCorridors(
    origin?: string,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    const qs = origin && origin !== 'ALL' ? `?origin=${encodeURIComponent(origin)}` : '';
    return this.v12Json(`/api/v30/corridors${qs}`, { headers: this.v30Headers(actor) });
  }

  static async v30GetAgents(
    filters?: { country?: string; district?: string; provider?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    const p = new URLSearchParams();
    if (filters?.country && filters.country !== 'ALL') p.set('country', filters.country);
    if (filters?.district && filters.district !== 'ALL') p.set('district', filters.district);
    if (filters?.provider && filters.provider !== 'ALL') p.set('provider', filters.provider);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return this.v12Json(`/api/v30/agents${qs}`, { headers: this.v30Headers(actor) });
  }

  static async v30SubmitLiquidityReport(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/liquidity/report', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetBusinessFinanceDocs(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/business-finance', { headers: this.v30Headers(actor) });
  }

  static async v30CreateBusinessFinanceDoc(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/business-finance', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30DecideBusinessFinanceDoc(
    docId: string,
    decision: 'APPROVE' | 'REJECT',
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v30/business-finance/${encodeURIComponent(docId)}/decide`, {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify({ decision }),
    });
  }

  static async v30GetDisputes(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/disputes', { headers: this.v30Headers(actor) });
  }

  static async v30CreateDispute(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/disputes', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30TransitionDispute(
    disputeId: string,
    payload: { targetStatus: string; resolutionNote?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v30/disputes/${encodeURIComponent(disputeId)}/transition`, {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetFraudEvents(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/fraud-events', { headers: this.v30Headers(actor) });
  }

  static async v30ReviewFraudEvent(
    eventId: string,
    payload: { decision: 'CLEARED' | 'BLOCKED_CONFIRMED' | 'FALSE_POSITIVE'; reviewNote: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v30/fraud-events/${encodeURIComponent(eventId)}/review`, {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetRegulatoryReadiness(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/regulatory', { headers: this.v30Headers(actor) });
  }

  static async v30SubmitRegulatoryEvidence(
    payload: { requirementId: string; documentTitle: string; contentDigestSource: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/regulatory/evidence', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetUniversalWalletOverview(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/wallet/universal', { headers: this.v30Headers(actor) });
  }

  static async v30UpdateCardControls(
    cardProfileId: string,
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v30/wallet/cards/${encodeURIComponent(cardProfileId)}/controls`, {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetUssdSessions(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/ussd/sessions', { headers: this.v30Headers(actor) });
  }

  static async v30SimulateUssd(
    payload: { msisdn: string; dialString: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/ussd/simulate', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30RunAiAdvisor(
    payload: { domainTask: string; prompt: string; countryCode?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v30/ai/advise', {
      method: 'POST',
      headers: this.v30Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v30GetAiTelemetry(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/ai/telemetry', { headers: this.v30Headers(actor) });
  }

  static async v30GetGitHubDiagnostics() {
    return this.v12Json('/api/v30/developer/github-diagnostics', { headers: this.v30Headers() });
  }

  static async v30GetRepairRegister(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v30/repair-register', { headers: this.v30Headers(actor) });
  }

  // ==========================================
  // V31 SOVEREIGN INFRASTRUCTURE, CONNECTIVITY & CONTINENTAL DEPLOYMENT APIs
  // ==========================================

  private static v31Headers(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v27Headers(actor);
  }

  static async v31GetHealth() {
    return this.v12Json('/api/v31/health', { headers: this.v31Headers() });
  }

  static async v31GetOverview(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v31/overview', { headers: this.v31Headers(actor) });
  }

  static async v31GetReadinessMatrix() {
    return this.v12Json('/api/v31/readiness-matrix', { headers: this.v31Headers() });
  }

  static async v31GetOpenApiSpec() {
    return this.v12Json('/api/v31/openapi.json', { headers: this.v31Headers() });
  }

  static async v31GetPostgresStatus() {
    return this.v12Json('/api/v31/postgres/status', { headers: this.v31Headers() });
  }

  static async v31RunPostgresDryRun(
    payload: { simulateInterrupt?: boolean } = {},
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/postgres/migrate-dry-run', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31RunBackupDrill(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v31/postgres/backup-drill', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v31GetResidencyPolicies() {
    return this.v12Json('/api/v31/residency/policies', { headers: this.v31Headers() });
  }

  static async v31UpsertResidencyPolicy(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/residency/policies', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31GetProviderCertifications() {
    return this.v12Json('/api/v31/providers/certifications', { headers: this.v31Headers() });
  }

  static async v31RunProviderCertHarness(
    providerId: string,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v31/providers/${encodeURIComponent(providerId)}/certify`, {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v31AdvanceProviderCertStage(
    providerId: string,
    targetStage: string,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v31/providers/${encodeURIComponent(providerId)}/advance`, {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify({ targetStage }),
    });
  }

  static async v31RotateCredentialMetadata(
    credentialId: string,
    rotationIntervalDays?: number,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v31/providers/credentials/${encodeURIComponent(credentialId)}/rotate`, {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify({ rotationIntervalDays }),
    });
  }

  static async v31GetCountries() {
    return this.v12Json('/api/v31/countries', { headers: this.v31Headers() });
  }

  static async v31UpsertCountry(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/countries', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31CalculateCountryTax(countryCode: string, grossMinor: number) {
    return this.v12Json(`/api/v31/countries/${encodeURIComponent(countryCode)}/tax-calculate`, {
      method: 'POST',
      headers: this.v31Headers(),
      body: JSON.stringify({ grossMinor }),
    });
  }

  static async v31GetEnterpriseOverview(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v31/enterprise/overview', { headers: this.v31Headers(actor) });
  }

  static async v31CreateOrganization(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/enterprise/organizations', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31CreateBranch(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/enterprise/branches', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31CreateCommercialCase(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/enterprise/cases', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31TransitionCommercialCase(
    caseId: string,
    payload: { action: string; note?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v31/enterprise/cases/${encodeURIComponent(caseId)}/transition`, {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31GetPilotOverview() {
    return this.v12Json('/api/v31/pilot/overview', { headers: this.v31Headers() });
  }

  static async v31AdvancePilotStage(
    payload: { programId?: string; targetStageNumber: number },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/pilot/advance-stage', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31RegisterPilotParticipant(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/pilot/participants', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31RecordFieldValidation(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/pilot/field-validations', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31LogPilotIncident(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/pilot/incidents', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31GetSecurityOverview(actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }) {
    return this.v12Json('/api/v31/security/overview', { headers: this.v31Headers(actor) });
  }

  static async v31RevokeSession(
    sessionId: string,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v31/security/sessions/${encodeURIComponent(sessionId)}/revoke`, {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify({}),
    });
  }

  static async v31TransitionSecurityIncident(
    incidentId: string,
    payload: { status: string; containmentAction?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json(`/api/v31/security/incidents/${encodeURIComponent(incidentId)}/transition`, {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31GetContinentalAnalytics(countryCode?: string) {
    const qs = countryCode && countryCode !== 'ALL' ? `?countryCode=${encodeURIComponent(countryCode)}` : '';
    return this.v12Json(`/api/v31/intelligence/analytics${qs}`, { headers: this.v31Headers() });
  }

  static async v31CreateAnalyticsSnapshot(
    payload: Record<string, any>,
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/intelligence/analytics', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31RunCountryAiAdvisor(
    payload: { prompt: string; countryCode?: string; forceLocalSimulation?: boolean },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/intelligence/ai-advisor', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }

  static async v31GetGitHubDiagnostics() {
    return this.v12Json('/api/v31/github/diagnostics', { headers: this.v31Headers() });
  }

  static async v31GetDeployments() {
    return this.v12Json('/api/v31/deployments', { headers: this.v31Headers() });
  }

  static async v31VerifyEnvironment(
    payload: { environment: 'DEV' | 'TEST' | 'STAGING' | 'PROD'; notes?: string },
    actor?: { userId?: string; userRole?: string; organisationId?: string; countryCode?: string }
  ) {
    return this.v12Json('/api/v31/deployments/verify', {
      method: 'POST',
      headers: this.v31Headers(actor),
      body: JSON.stringify(payload),
    });
  }
}

export const api = ApiClient;
export const apiClient = ApiClient;
export default ApiClient;


