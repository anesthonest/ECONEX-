/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V2 - Continental Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

export type UserRole =
  | 'FARMER'
  | 'BUYER'
  | 'AGRO_DEALER'
  | 'COOPERATIVE_ADMIN'
  | 'TRANSPORTER'
  | 'PLATFORM_ADMIN';

export type VerificationState =
  | 'UNVERIFIED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type User = UserProfile;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  orgRole?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'AUDITOR';
  district: string;
  country: string; // Default: 'UG'
  avatarUrl?: string;
  isVerified: boolean;
  verificationStatus: VerificationState;
  supportingDocuments?: { type: string; documentUrl: string; uploadedAt: string }[];
  consentGiven: boolean;
  consentTimestamp?: string;
  joinedAt: string;
  bio?: string;
  sessionRevokedBefore?: string;
}

export interface Organization {
  id: string;
  name: string;
  type:
    | 'COOPERATIVE'
    | 'ENTERPRISE'
    | 'AGRO_DEALER_HUB'
    | 'LOGISTICS_FLEET'
    | 'FINANCIAL_INSTITUTION'
    | 'GOVERNMENT_INSTITUTION';
  district: string;
  country: string;
  registrationNumber: string;
  verifiedStatus: VerificationState;
  membersCount: number;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
}

export interface OrganizationMembership {
  id: string;
  orgId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joinedAt: string;
}

export interface FarmPlot {
  id: string;
  farmId: string;
  plotName: string;
  sizeAcres: number;
  soilType: 'CLAY' | 'LOAM' | 'SANDY_LOAM' | 'VOLCANIC' | 'ALLUVIAL';
  irrigationType: 'RAIN_FED' | 'DRIP' | 'SPRINKLER' | 'CANAL' | 'BOREHOLE';
  currentCropId?: string;
  createdAt: string;
}

export interface Farm {
  id: string;
  farmerId: string;
  organizationId?: string;
  farmName: string;
  district: string;
  subCounty: string;
  village: string;
  totalAcres: number;
  waterSource: string;
  plots: FarmPlot[];
  createdAt: string;
}

export type CropGrowthStage =
  | 'LAND_PREPARATION'
  | 'PLANTED'
  | 'GERMINATION'
  | 'VEGETATIVE'
  | 'FLOWERING'
  | 'FRUITING'
  | 'HARVEST_READY'
  | 'HARVESTED';

export interface CropRecord {
  id: string;
  farmId: string;
  plotId: string;
  farmerId: string;
  cropName: string;
  variety: string;
  category: CropCategory;
  growthStage: CropGrowthStage;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  estimatedYieldKg: number;
  actualYieldKg?: number;
  notes?: string;
  scoutingNotes?: string[];
  createdAt: string;
}

export type CropCategory =
  | 'GRAINS_CEREALS'
  | 'LEGUMES_PULSES'
  | 'TUBERS_ROOTS'
  | 'COFFEE_CASH_CROPS'
  | 'FRUITS_VEGETABLES'
  | 'LIVESTOCK_DAIRY'
  | 'SEEDS_FERTILIZERS'
  | 'FARM_TOOLS';

export type ProductUnit =
  | 'KG'
  | 'BAG_100KG'
  | 'BAG_50KG'
  | 'TONNE'
  | 'CRATE'
  | 'LITRE'
  | 'PIECE'
  | 'BUNCH';

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerRole: UserRole;
  organizationId?: string;
  sellerDistrict: string;
  isVerifiedSeller: boolean;
  title: string;
  description: string;
  category: CropCategory;
  variety?: string;
  quantityAvailable: number;
  unit: ProductUnit;
  pricePerUnitUGX: number;
  minimumOrder: number;
  currency: 'UGX';
  location: string;
  district: string;
  harvestDate?: string;
  imageUrl?: string;
  status: 'ACTIVE' | 'PAUSED' | 'SOLD_OUT';
  organicCertified?: boolean;
  qualityGrade?: 'GRADE_1' | 'GRADE_2' | 'STANDARD';
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY_FOR_DISPATCH'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerDistrict: string;
  sellerId: string;
  sellerName: string;
  sellerRole: UserRole;
  listingId: string;
  productTitle: string;
  category: CropCategory;
  quantity: number;
  unit: ProductUnit;
  unitPriceUGX: number;
  subtotalUGX: number;
  logisticsFeeUGX: number;
  totalAmountUGX: number;
  currency: 'UGX';
  deliveryDistrict: string;
  deliveryAddress: string;
  specialInstructions?: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  paymentReference?: string;
  paymentMethod?: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'BANK_ESCROW' | 'CASH_ON_DELIVERY_TEST';
  paymentStatus?: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  shipmentId?: string;
  transporterId?: string;
  transporterName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ShipmentStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface Shipment {
  id: string;
  orderId: string;
  orderNumber: string;
  transporterId?: string;
  transporterName?: string;
  carrierPhone?: string;
  vehicleRegistration?: string;
  vehicleType?: 'PICKUP_1T' | 'CANTER_3.5T' | 'ISUZU_7T' | 'TRAILER_30T' | 'BODA_CARGO';
  originDistrict: string;
  originAddress: string;
  destinationDistrict: string;
  destinationAddress: string;
  cargoDescription: string;
  weightTonnage: number;
  freightCostUGX: number;
  status: ShipmentStatus;
  pickupScheduledAt?: string;
  deliveredAt?: string;
  recipientConfirmPin?: string;
  notes?: string;
  createdAt: string;
}

export interface AgroDealerInput {
  id: string;
  dealerId: string;
  dealerName: string;
  productName: string;
  category: 'CERTIFIED_SEEDS' | 'INORGANIC_FERTILIZER' | 'ORGANIC_FERTILIZER' | 'PESTICIDE' | 'IRRIGATION_KIT' | 'TOOL_MACHINERY';
  brand: string;
  registrationNumber?: string;
  priceUGX: number;
  unit: string;
  stockAvailable: number;
  activeIngredient?: string;
  applicationInstructions?: string;
  district: string;
  isMinistryApproved: boolean;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amountUGX: number;
  currency: 'UGX';
  provider: 'MTN_MOMO_TEST' | 'AIRTEL_MONEY_TEST' | 'AROS_ESCROW_TEST';
  paymentReference: string;
  providerTransactionId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';
  payerPhone: string;
  timestamp: string;
  isTestMode: true;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'ORDER' | 'USER' | 'LISTING' | 'SHIPMENT' | 'PAYMENT' | 'FARM' | 'VOUCHER' | 'CONTRACT' | 'WAREHOUSE' | 'CLAIM' | 'ORGANIZATION' | 'APPLICATION' | 'TRADE_CONTRACT' | 'AUDIT_LOG';
  entityId: string;
  details: string;
}

export interface OfflineQueueItem {
  id: string;
  type:
    | 'FARM_CREATE'
    | 'PLOT_CREATE'
    | 'CROP_RECORD_CREATE'
    | 'LISTING_DRAFT'
    | 'ORDER_DRAFT'
    | 'PRICE_OBSERVATION'
    | 'WAREHOUSE_ENTRY'
    | 'ENQUIRY_DRAFT'
    | 'INVENTORY_UPDATE'
    | 'DELIVERY_EVIDENCE'
    | 'COOP_MEMBER_RECORD'
    | 'TRADE_AGREEMENT_DRAFT';
  payload: any;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT_DETECTED';
  errorMessage?: string;
  clientVersion?: number;
  conflictId?: string;
}

export interface CropAdvisoryRequest {
  cropName: string;
  district: string;
  growthStage: string;
  symptomsOrQuestion: string;
  imageBase64?: string;
}

export interface CropAdvisoryResponse {
  answer: string;
  confidence: 'HIGH' | 'MODERATE' | 'PRELIMINARY';
  recommendedActions: string[];
  disclaimer: string;
  source: 'GEMINI_SERVER_API' | 'CALIBRATED_EAST_AFRICA_KB';
  requiresExtensionOfficerAudit?: boolean;
}

// ==========================================
// V2 NOVEL CAPABILITY DATA MODELS
// ==========================================

export interface AgriculturalVoucher {
  id: string;
  voucherCode: string;
  beneficiaryId: string;
  beneficiaryName: string;
  programName: string;
  inputCategory: string;
  subsidyValueUGX: number;
  maxQuantity: number;
  eligibleDealers: string[];
  status: 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
  issuedAt: string;
  redeemedAt?: string;
  redeemedDealerId?: string;
  fraudFlag?: boolean;
  auditTrail: string[];
  // V2 UI aliases
  category?: string;
  subsidyPercentage?: number;
  valueUgx?: number;
  farmerName?: string;
  expiryDate?: string;
}

export interface CommodityPriceObservation {
  id: string;
  commodity: string;
  category: CropCategory;
  district: string;
  marketName: string;
  wholesalePriceUGX: number;
  farmGatePriceUGX: number;
  unit: ProductUnit;
  trend: 'RISING' | 'STABLE' | 'FALLING';
  reportedBy: string;
  sourceVerification: 'USER_REPORTED' | 'VERIFIED_MARKET_MONITOR' | 'UNMA_OFFICIAL';
  anomalyFlag?: boolean;
  recordedAt: string;
}

export interface TradeContract {
  id: string;
  contractNumber: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  commodity: string;
  quantity: number;
  unit: ProductUnit;
  proposedUnitPriceUGX: number;
  agreedUnitPriceUGX?: number;
  counterOfferPriceUGX?: number;
  counterOfferBy?: string;
  deliveryTerms: string;
  qualityGrade: string;
  status: 'RFQ_PENDING' | 'QUOTATION_ISSUED' | 'COUNTER_OFFER' | 'CONFIRMED' | 'DISPUTED' | 'CANCELLED';
  termsNotes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ProductTraceabilityRecord {
  id: string;
  batchNumber: string;
  commodity: string;
  variety: string;
  producerId: string;
  producerName: string;
  farmId: string;
  farmName: string;
  plotId: string;
  harvestDate: string;
  inspectionCertificate?: string;
  qualityGrade: string;
  aggregationWarehouseId?: string;
  transporterId?: string;
  vehicleRegistration?: string;
  buyerId?: string;
  events: {
    eventType: 'HARVESTED' | 'INSPECTED' | 'AGGREGATED' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED';
    timestamp: string;
    location: string;
    actorName: string;
    notes?: string;
  }[];
}

export interface BuyerSellerMatch {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  commodity: string;
  matchScorePct: number;
  matchReasons: string[];
  priceDifferenceUGX: number;
  distanceKm: number;
}

export interface Warehouse {
  id: string;
  name: string;
  operatorId: string;
  operatorName: string;
  district: string;
  address: string;
  capacityTons: number;
  currentOccupancyTons: number;
  coldChainEnabled: boolean;
  averageTempC?: number;
  sensorStatus: 'PROVIDER_READY' | 'CONNECTED' | 'MANUAL';
  receiptsIssued: number;
  createdAt: string;
  // V2 aliases for regional metric views
  totalCapacityKg?: number;
  currentOccupancyKg?: number;
  hasColdStorage?: boolean;
  region?: string;
  dailyRateUgxPerKg?: number;
  certificationNumber?: string;
  temperatureCelsius?: number;
  humidityPercent?: number;
  acceptedCommodities?: string[];
}

export interface WarehouseReceipt {
  id: string;
  receiptNumber: string;
  warehouseId: string;
  warehouseName: string;
  depositorId: string;
  depositorName: string;
  commodity: string;
  quantityTons: number;
  grade: string;
  storageDate: string;
  releaseAuthorized: boolean;
  // V2 aliases
  quantityKg?: number;
  moistureContent?: number;
  insuredValueUgx?: number;
  depositDate?: string;
  bagCount?: number;
  status?: 'ISSUED' | 'PLEDGED_AS_COLLATERAL' | 'REDEEMED' | 'EXPIRED';
}

export interface FinancialProduct {
  id: string;
  institutionName: string;
  productType: 'AGRICULTURAL_LOAN' | 'INPUT_FINANCING' | 'CROP_INSURANCE' | 'EQUIPMENT_LEASE';
  maxAmountUGX: number;
  interestRateAnnualPct: number;
  repaymentPeriodMonths: number;
  eligibilityCriteria: string;
  status: 'ACTIVE' | 'SANDBOX_ONLY';
  // V2 UI aliases
  name?: string;
  category?: string;
  providerName?: string;
  interestRatePct?: number;
  description?: string;
  tenureMonths?: number;
  minAmountUgx?: number;
  maxAmountUgx?: number;
  collateralRequired?: boolean;
}

export interface SavingsGroup {
  id: string;
  name: string;
  community: string;
  district: string;
  totalSavingsUGX: number;
  shareValueUGX: number;
  membersCount: number;
  activeLoansCount: number;
  meetingSchedule: string;
  // V2 UI aliases
  totalSavingsUgx?: number;
  shareValueUgx?: number;
  cycleNumber?: number;
  loansOutstandingUgx?: number;
  nextMeetingDate?: string;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyType: 'DROUGHT_INDEX' | 'EXCESS_RAINFALL' | 'HAIL_STORM' | 'PEST_OUTBREAK';
  farmerId: string;
  farmerName: string;
  crop: string;
  acreage: number;
  claimAmountUGX: number;
  status: 'SUBMITTED' | 'INSPECTION_PENDING' | 'APPROVED' | 'SETTLED' | 'REJECTED' | 'PAID' | 'UNDER_ASSESSMENT';
  evidenceNotes: string;
  submissionDate: string;
  // V2 UI aliases
  peril?: string;
  insuredCrop?: string;
  policyNumber?: string;
  description?: string;
  satelliteValidationNotes?: string;
  incidentDate?: string;
  claimAmountUgx?: number;
}

export interface EarlyWarningAlert {
  id: string;
  alertType: 'PRICE_SPIKE' | 'SUPPLY_DEFICIT' | 'DROUGHT_RISK' | 'TRANSPORT_DISRUPTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  affectedDistricts: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'PRELIMINARY';
  explanation: string;
  recommendedAction: string;
  timestamp: string;
  // V2 UI aliases
  type?: string;
  affectedRegion?: string;
  issuedDate?: string;
  summary?: string;
  recommendedMitigation?: string[];
}

export type AiAgentType =
  | 'AGRONOMIST'
  | 'PRICE_INTELLIGENCE'
  | 'LOGISTICS_OPTIMIZER'
  | 'CLIMATE_RISK'
  | 'FINANCIAL_LITERACY'
  | 'TRADE_SUPPLY_CHAIN'
  | 'INSTITUTIONAL_ANALYTICS'
  | 'REGIONAL_TRADE_INTEL'
  | 'INDUSTRIAL_VALUE_CHAIN'
  | 'CORRIDOR_LOGISTICS'
  | 'DISRUPTION_RESILIENCE'
  | 'FOOD_SECURITY_ANALYST'
  | 'ECONOMIC_FORECASTER';

export interface AiAgentQuery {
  agentType: AiAgentType;
  prompt: string;
  contextData?: any;
}

export interface AiAgentResponse {
  agentType: AiAgentType;
  responseText: string;
  actionableSteps: string[];
  confidence: 'HIGH' | 'MODERATE' | 'PRELIMINARY';
  dataProvenance: string;
  disclaimer: string;
  timestamp: string;
}

export type SupportedLanguage = 'en' | 'lg' | 'sw';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'ORDER' | 'PAYMENT' | 'WEATHER' | 'PRICE' | 'VOUCHER' | 'VERIFICATION' | 'SYSTEM';
  channel: 'IN_APP' | 'SMS_SANDBOX' | 'WHATSAPP_SANDBOX' | 'EMAIL_SANDBOX';
  read: boolean;
  timestamp: string;
}

// ==========================================
// AETHER–AROS V3 & V4 FINANCIAL & INTEROPERABILITY MODELS
// ==========================================

export type SupportedCurrency =
  | 'UGX'
  | 'KES'
  | 'TZS'
  | 'RWF'
  | 'BIF'
  | 'SSP'
  | 'CDF'
  | 'NGN'
  | 'ZAR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CNY'
  | 'JPY'
  | string;

export interface CurrencyMetadata {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  fractionDigits: number;
  exchangeRateToUGX: number; // e.g. 1 KES = 28.5 UGX, 1 USD = 3750 UGX
  rateSource: 'BOU_OFFICIAL' | 'CENTRAL_BANK_EAC' | 'INDICATIVE_MARKET' | 'INTERNATIONAL_FX_FEED';
  baseCurrency?: SupportedCurrency;
  quoteCurrency?: SupportedCurrency;
  observationTime?: string;
  retrievalTime?: string;
  isExecutable?: boolean;
  providerStatus?: 'OFFICIAL_CENTRAL_BANK' | 'INTERBANK_INDICATIVE' | 'REGIONAL_CLEARING_HOUSE';
  lastRateUpdate: string;
  isTradable?: boolean;
  minorUnits?: number;
  settlementRestrictions?: string[];
}

export type PaymentOrchestrationStatus =
  | 'CREATED'
  | 'VALIDATED'
  | 'AUTHORIZED'
  | 'PROCESSING'
  | 'SETTLED'
  | 'INITIATED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'PENDING_RECONCILIATION'
  | 'UNDER_REVIEW';

export type PaymentChannelProvider =
  | 'MTN_MOMO_UG'
  | 'AIRTEL_MONEY_UG'
  | 'STANBIC_FLEXIPAY'
  | 'MPESA_KENYA'
  | 'AIRTEL_MONEY_KE'
  | 'MPESA_TANZANIA'
  | 'AIRTEL_MONEY_TZ'
  | 'TIGO_PESA'
  | 'MTN_MOMO_RW'
  | 'AIRTEL_MONEY_RW'
  | 'LUMICASH_BI'
  | 'ECOCASH_BI'
  | 'MGURUSH_SS'
  | 'AIRTEL_MONEY_CD'
  | 'ORANGE_MONEY_CD'
  | 'MPESA_CD'
  | 'BANK_TRANSFER'
  | 'BANK_TRANSFER_EFT'
  | 'PAPSS_CROSS_BORDER'
  | 'AUTHORIZED_GATEWAY_SANDBOX';

export interface OrchestratedPayment {
  id: string;
  idempotencyKey: string;
  transactionReference: string; // e.g. AROS-PAY-2026-XXXX
  providerReference?: string;
  orderId?: string;
  contractId?: string;
  payerId: string;
  payerName: string;
  payerPhoneOrAccount: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  currency: SupportedCurrency;
  exchangeRateApplied: number;
  equivalentUGX: number;
  channel: PaymentChannelProvider;
  status: PaymentOrchestrationStatus;
  statusHistory: {
    status: PaymentOrchestrationStatus;
    timestamp: string;
    actor: string;
    notes?: string;
  }[];
  callbackWebhookPayload?: any;
  webhookSignatureVerified?: boolean;
  reconciliationStatus: 'UNRECONCILED' | 'MATCHED' | 'DISCREPANCY' | 'MANUALLY_ADJUSTED';
  reconciledAt?: string;
  disputeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  entryNumber: string;
  debitAccount: string; // e.g. ESCROW_RECEIVABLE, BUYER_SETTLEMENT, CLEARING_TRANSIT
  creditAccount: string; // e.g. SELLER_PAYABLE, REVENUE_FEE, PLATFORM_CLEARING
  amount: number;
  currency: SupportedCurrency;
  narration: string;
  balanced: boolean;
  createdAt: string;
}

export interface CountryTenantConfig {
  code: 'UG' | 'KE' | 'TZ' | 'RW' | 'BI' | 'SS' | 'CD' | string;
  name: string;
  primaryCurrency: SupportedCurrency;
  supportedCurrencies: SupportedCurrency[];
  timeZone: string;
  administrativeDivisions: string[]; // e.g. Districts, Counties, Provinces
  supportedLanguages: SupportedLanguage[];
  regulatoryBody: string; // e.g. MAAIF / Bank of Uganda
  dataResidencyPolicy: 'LOCAL_UGANDA_DATA_STORE' | 'REGIONAL_EAC_CLUSTER' | 'LOCAL_NATIONAL_VAULT' | string;
  paymentProvidersAvailable: PaymentChannelProvider[];
  activeInProduction: boolean;
  vatTaxRatePercent?: number;
  tradeDocumentationProtocol?: string;
  borderAuthorities?: string[];
  customsSystemCode?: string;
  // Aliases for Regional Observatory
  countryCode?: string;
  countryName?: string;
  defaultCurrency?: string;
}

export interface InstitutionalWorkspace {
  id: string;
  orgId: string;
  orgName: string;
  type:
    | 'COMMERCIAL_BANK'
    | 'SACCO_UNION'
    | 'GRAIN_COUNCIL'
    | 'GOVERNMENT_MINISTRY'
    | 'COMMODITY_EXCHANGE'
    | 'RESEARCH_CONSORTIUM';
  countryCode: string;
  verifiedLicenseNumber?: string;
  verificationSource: 'AUTHORITATIVE_REGISTRY' | 'SUBMITTED_FOR_AUDIT';
  dataSharingAgreements: {
    partnerOrgId: string;
    partnerOrgName: string;
    purpose: string;
    fieldsPermitted: string[]; // e.g. 'aggregated_yield', 'pricing_trends' (NO PII)
    grantedAt: string;
    expiresAt: string;
    status: 'ACTIVE' | 'REVOKED';
  }[];
  institutionalReports: {
    id: string;
    reportTitle: string;
    period: string;
    metricsSummary: Record<string, any>;
    generatedAt: string;
  }[];
}

export interface DeveloperApplication {
  id: string;
  organizationId: string;
  appName: string;
  apiKey: string; // Scoped API Key: aros_live_... or aros_test_...
  keyPrefix: string;
  status: 'ACTIVE' | 'REVOKED';
  allowedScopes: ('read:market' | 'read:prices' | 'write:contracts' | 'read:traceability' | 'read:warehouses')[];
  rateLimitPerMin: number;
  requestCountTotal: number;
  webhookUrl?: string;
  webhookSecret?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface DeveloperWebhookDelivery {
  id: string;
  appId: string;
  event: 'payment.confirmed' | 'contract.signed' | 'shipment.dispatched' | 'early_warning.issued';
  payload: any;
  deliveryStatus: 'SUCCESS' | 'RETRY_PENDING' | 'FAILED';
  httpStatusCode?: number;
  attempts: number;
  lastAttemptAt: string;
}

export interface ComplianceRiskEvent {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'SUSPICIOUS_PAYMENT' | 'DUPLICATE_INVOICE' | 'PRICE_ANOMALY' | 'AUTH_BRUTE_FORCE' | 'INVENTORY_DISCREPANCY';
  subjectType: 'USER' | 'PAYMENT' | 'ORDER' | 'WAREHOUSE' | 'CONTRACT';
  subjectId: string;
  title: string;
  description: string;
  aiReviewSignalOnly: boolean; // Must NEVER automatically condemn or seize without human compliance review
  status: 'OPEN' | 'UNDER_HUMAN_INVESTIGATION' | 'RESOLVED_CLEARED' | 'ACTION_TAKEN';
  assignedAuditor?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ==========================================
// AETHER–AROS V4 REGIONAL TRADE & INDUSTRIAL CONTINENTAL NETWORK MODELS
// ==========================================

export type TradeScope =
  | 'DOMESTIC'
  | 'REGIONAL_CROSS_BORDER'
  | 'CONTINENTAL'
  | 'EAST_AFRICAN_COMMUNITY'
  | 'REGIONAL_EAC'
  | 'CROSS_BORDER'
  | string;

export type TradeCommodityType =
  | 'RAW_AGRICULTURAL'
  | 'PROCESSING_GRADE'
  | 'INDUSTRIAL_RAW_MATERIAL'
  | 'MANUFACTURED_GOOD'
  | 'AGRO_INPUT'
  | 'EQUIPMENT_MACHINERY'
  | 'OILSEEDS'
  | 'GRAINS'
  | 'COFFEE_TEA'
  | 'HORTICULTURE'
  | 'LIVESTOCK_DAIRY'
  | string;

export type CrossBorderTradeStage =
  | 'INQUIRY_SOURCING'
  | 'COMMERCIAL_TERMS_AGREED'
  | 'SALES_PURCHASE_CONTRACT_SIGNED'
  | 'ESCROW_FUNDING_CONFIRMED'
  | 'PRODUCE_AGGREGATION_WAREHOUSE'
  | 'SPS_PHYTOSANITARY_INSPECTION'
  | 'EAC_CERTIFICATE_OF_ORIGIN_ISSUED'
  | 'TRANSIT_CONSIGNMENT_DISPATCHED'
  | 'BORDER_CHECKPOINT_ARRIVAL'
  | 'SINGLE_CUSTOMS_TERRITORY_DECLARATION'
  | 'IMPORT_SPS_BORDER_CLEARANCE'
  | 'CORRIDOR_TRANSIT_DESTINATION'
  | 'DESTINATION_WAREHOUSE_ARRIVAL'
  | 'CONSIGNEE_QUALITY_ACCEPTANCE'
  | 'FINAL_SETTLEMENT_COMPLETE'
  | 'BUYER_REQUEST'
  | 'SELLER_OFFER'
  | 'QUOTATION_NEGOTIATION'
  | 'CONTRACT_CONFIRMED'
  | 'QUALITY_INSPECTION'
  | 'EXPORT_DOCS_PREPARED'
  | 'TRANSPORT_BOOKED'
  | 'CUSTOMS_REVIEW'
  | 'SHIPMENT_DISPATCHED'
  | 'BORDER_TRANSIT_CHECKPOINT'
  | 'IMPORT_RECEIPT'
  | 'DELIVERY_CONFIRMED'
  | 'PAYMENT_VERIFIED'
  | 'SETTLEMENT_RECONCILED'
  | 'CONTRACT_COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type TradeDocumentType =
  | 'COMMERCIAL_INVOICE'
  | 'PACKING_LIST'
  | 'EAC_CERTIFICATE_OF_ORIGIN'
  | 'CERTIFICATE_OF_ORIGIN'
  | 'PHYTOSANITARY_CERTIFICATE'
  | 'QUALITY_INSPECTION_CERT'
  | 'CUSTOMS_SINGLE_DECLARATION'
  | 'CUSTOMS_DECLARATION'
  | 'TRANSPORT_CONSIGNMENT_NOTE'
  | 'CERTIFICATE_OF_ANALYSIS'
  | 'IMPORT_EXPORT_PERMIT';

export interface TradeDocumentRef {
  id: string;
  documentType?: TradeDocumentType;
  documentNumber?: string;
  issuingAuthority?: string;
  issuingCountry?: string;
  verificationStatus?:
    | 'PENDING'
    | 'SUBMITTED'
    | 'VERIFIED_VALID'
    | 'REJECTED_DEFECTIVE'
    | 'EXPIRED'
    | 'DRAFT'
    | 'VERIFIED'
    | 'OFFICIALLY_APPROVED'
    | 'REJECTED'
    | string;
  issuedAt?: string;
  validUntil?: string;
  fileUrl?: string;
  checksumSha256?: string;
  remarks?: string;
  tradeId?: string;
  docType?: TradeDocumentType;
  title?: string;
  issuer?: string;
  status?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt?: string;
}

export interface CrossBorderTrade {
  id: string;
  contractNumber?: string;
  scope?: TradeScope;
  commodityType?: TradeCommodityType;
  commodityName?: string;
  originCountry?: string;
  destinationCountry?: string;
  exporterId?: string;
  exporterName?: string;
  importerId?: string;
  importerName?: string;
  volumeMetricTonnes?: number;
  unitPriceUsd?: number;
  totalValueUsd?: number;
  settlementCurrency?: SupportedCurrency;
  settlementAmountLocal?: number;
  incoterm?: 'FOB' | 'CIF' | 'DAP' | 'EXW';
  currentStage?: CrossBorderTradeStage;
  stageHistory?: {
    stage: CrossBorderTradeStage;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    timestamp?: string;
    actor?: string;
    actorRole?: UserRole;
  }[];
  requiredDocuments?: TradeDocumentRef[];
  corridorId?: string;
  borderPost?: string;
  escrowLocked?: boolean;
  qualityInspected?: boolean;
  customsCleared?: boolean;
  pickupLocation?: string;
  deliveryDestination?: string;
  estimatedTransitDays?: number;
  tradeReference?: string;
  buyerId?: string;
  buyerName?: string;
  buyerCountry?: string;
  sellerId?: string;
  sellerName?: string;
  sellerCountry?: string;
  commodity?: string;
  quantity?: number;
  qualityGrade?: string;
  unit?: string;
  unitPrice?: number;
  totalValue?: number;
  equivalentUGX?: number;
  currency?: SupportedCurrency | string;
  stage?: CrossBorderTradeStage;
  documents?: TradeDocumentRef[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegionalProcurementRfq {
  id: string;
  title?: string;
  issuerOrganizationId?: string;
  issuerName?: string;
  commodityType: TradeCommodityType;
  commodityName?: string;
  requiredVolumeMT?: number;
  minimumGrade?: string;
  maxMoisturePercent?: number;
  targetPriceUsdPerMT?: number;
  deliveryPoint?: string;
  deadlineDate: string;
  settlementTerms?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'AWARDED' | 'CLOSED';
  quotationsCount: number;
  awardedQuotationId?: string;
  currency?: SupportedCurrency;
  rfqNumber?: string;
  buyerId?: string;
  buyerOrgName?: string;
  buyerCountry?: string;
  requiredQuantity?: number;
  unit?: string;
  targetQualitySpec?: string;
  deliveryLocation?: string;
  createdAt: string;
}

export interface RfqQuotation {
  id: string;
  rfqId: string;
  bidderOrganizationId?: string;
  bidderName?: string;
  offeredVolumeMT?: number;
  unitPriceUsdPerMT?: number;
  totalQuotationUsd?: number;
  offeredMoisturePercent?: number;
  originRegion?: string;
  leadTimeDays?: number;
  status: 'SUBMITTED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'COUNTEROFFERED' | 'AWARDED';
  reputationScore?: number;
  notes?: string;
  submittedAt?: string;
  supplierId?: string;
  supplierOrgName?: string;
  supplierCountry?: string;
  offeredPrice?: number;
  currency?: SupportedCurrency;
  availableQuantity?: number;
  deliveryTerms?: 'EXW' | 'FOB' | 'CIF' | 'DAP';
  earliestDeliveryDate?: string;
  createdAt?: string;
}

export interface EconomicCorridor {
  id: string;
  name: string;
  primaryRoute?: string;
  lengthKm?: number;
  averageTransitDays?: number;
  status?: 'OPERATIONAL' | 'CAUTION' | 'DISRUPTED' | 'RESTRICTED' | 'DELAYED_CONGESTION' | 'OFFLINE_DISRUPTED';
  congestionLevel?: 'LOW' | 'MODERATE' | 'HEAVY' | 'GRIDLOCK';
  checkpoints?: {
    name: string;
    country: string;
    averageWaitHours: number;
    facilities: string[];
  }[];
  activeDisruptions?: string[];
  lastMonitoredAt?: string;
  corridorCode?: string;
  originCountry?: string;
  destinationCountry?: string;
  transitCountries?: string[];
  primaryBorderPost?: string;
  operatingStatus?: 'OPERATIONAL' | 'RESTRICTED' | 'DELAYED_CONGESTION' | 'OFFLINE_DISRUPTED';
  supportedModes?: ('ROAD_FREIGHT' | 'RAIL_FREIGHT' | 'LAKE_BARGE' | 'AIR_CARGO')[];
  distanceKm?: number;
  averageTransitHours?: number;
  activeCheckpoints?: any[];
  registeredTransportersCount?: number;
  lastVerifiedAt?: string;
}

export interface CorridorShipment {
  id: string;
  trackingNumber: string;
  tradeContractId?: string;
  corridorId: string;
  carrierName: string;
  carrierContact: string;
  truckPlateNumber: string;
  driverName: string;
  driverPhone: string;
  cargoDescription: string;
  weightMetricTonnes: number;
  originFacility: string;
  destinationFacility: string;
  status: ShipmentStatus | 'DISPATCHED' | 'BORDER_TRANSIT' | 'CUSTOMS_INSPECTING' | 'CORRIDOR_HAUL' | 'DELIVERED';
  currentLocation: string;
  rectsEsealActive: boolean;
  checkpointWaypoints: {
    checkpointName: string;
    country?: string;
    cleared: boolean;
    timestamp?: string;
  }[];
  delayNotices: string[];
  dispatchedAt: string;
  estimatedArrival: string;
  actualArrival?: string;
  manifestNumber?: string;
  vehicleRegPlate?: string;
  cargoWeightKg?: number;
  cargoVolumeCbm?: number;
  checkpointsCleared?: any[];
  delayAlerts?: any[];
  customsStatus?: string;
}

export type IndustrialSector =
  | 'FOOD_PROCESSING'
  | 'TEXTILE_APPAREL'
  | 'EDIBLE_OILS_REFINERY'
  | 'EDIBLE_OILS'
  | 'GRAIN_MILLING'
  | 'SUGAR_REFINERY'
  | 'BEVERAGE'
  | 'ANIMAL_FEED'
  | 'PACKAGING'
  | 'CONSTRUCTION_MATERIALS';

export interface IndustrialFacility {
  id: string;
  name: string;
  organizationId?: string;
  sector: IndustrialSector;
  country: string;
  district: string;
  address?: string;
  annualProcessingCapacityMT?: number;
  activeRawMaterials?: string[];
  finishedProducts?: string[];
  certifications?: string[];
  qualityStandards?: {
    maxMoisturePercent: number;
    minOilContentPercent?: number;
    maxAflatoxinPpb?: number;
  };
  verificationStatus: VerificationState;
  createdAt?: string;
  orgId?: string;
  processingCapacityTonsPerDay?: number;
  currentUtilizationPct?: number;
  rawMaterialsRequired?: any[];
  finishedProductsProduced?: any[];
}

export interface ProductionOrder {
  id: string;
  batchCode?: string;
  facilityId?: string;
  facilityName?: string;
  offtakerOrganizationId?: string;
  offtakerName?: string;
  productName?: string;
  targetQuantityUnits?: number;
  unitMetric?: string;
  rawMaterialRequiredMT?: number;
  rawMaterialCommodity?: string;
  rawMaterialSourcedMT?: number;
  status?:
    | 'CONTRACT_SIGNED'
    | 'RAW_MATERIAL_INTAKE'
    | 'QUALITY_TESTING'
    | 'PROCESSING_ACTIVE'
    | 'PACKAGED_INSPECTED'
    | 'DISPATCHED_TO_OFFTAKER'
    | 'QUEUED'
    | 'RAW_MATERIAL_PREP'
    | 'PROCESSING'
    | 'QUALITY_CHECK'
    | 'PACKAGING'
    | 'COMPLETED'
    | string;
  targetDeliveryDate?: string;
  labTests?: {
    testParameter: string;
    observedValue: string;
    standardThreshold: string;
    passed: boolean;
    testedAt: string;
    inspector?: string;
  }[];
  notes?: string;
  createdAt?: string;
  orderNumber?: string;
  quantityPlanned?: number;
  unit?: string;
  rawMaterialsConsumed?: any[];
  stage?: string;
  qualityStatus?: string;
  inspectorNotes?: string;
  finishedGoodsCount?: number;
  wasteScrapKg?: number;
  startedAt?: string;
  completedAt?: string;
}

export type DisruptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ADVISORY' | 'MODERATE' | 'SEVERE' | 'CRITICAL_DISRUPTION';

export type DisruptionCategory =
  | 'BORDER_CUSTOMS_DELAY'
  | 'SEVERE_WEATHER_FLOOD'
  | 'INFRASTRUCTURE_FAILURE'
  | 'FUEL_SURCHARGE_SPIKE'
  | 'EXPORT_IMPORT_RESTRICTION'
  | 'SEVERE_WEATHER'
  | 'CORRIDOR_ROADBLOCK'
  | 'BORDER_INTERRUPTION'
  | 'COLD_CHAIN_FAILURE'
  | 'GRAIN_SPOILAGE_RISK'
  | 'COMMUNICATION_OUTAGE'
  | 'PEST_DISEASE_OUTBREAK'
  | 'COMMODITY_PRICE_SHOCK';

export interface EconomicDisruptionIncident {
  id: string;
  title: string;
  severity: DisruptionSeverity;
  category: DisruptionCategory;
  corridorId?: string;
  affectedCorridorId?: string;
  affectedLocation?: string;
  affectedCommodities?: string[];
  estimatedDelayHours?: number;
  summary?: string;
  alternativeCorridorId?: string;
  alternativeRouteName?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'REPORTED' | 'VERIFIED' | 'RESPONSE_DISPATCHED' | 'MITIGATED' | string;
  reportedBy?: string;
  dataProvenance?: string;
  detectedAt?: string;
  resolvedAt?: string;
  mitigationNotes?: string;
  incidentNumber?: string;
  affectedRegion?: string;
  countryCode?: string;
  reportedAt?: string;
  verifiedSource?: string;
  isVerified?: boolean;
  estimatedImpactSummary?: string;
  assignedLead?: string;
  alternativeSuppliersRecommended?: any[];
  alternativeRoutesRecommended?: any[];
  actionHistory?: any[];
}

export interface EconomicOpportunity {
  id: string;
  title: string;
  opportunityType?:
    | 'PROCESSING_DEFICIT'
    | 'LOGISTICS_BOTTLENECK'
    | 'CROSS_BORDER_ARBITRAGE'
    | 'STORAGE_EXPANSION'
    | 'UNMET_RAW_MATERIAL_DEMAND'
    | 'PROCESSING_CAPACITY_GAP'
    | 'STORAGE_INFRASTRUCTURE_DEFICIT'
    | 'VALUE_ADDITION_VENTURE';
  targetSector?: string;
  targetRegion?: string;
  countryCode?: string;
  estimatedMarketSizeUsd?: number;
  unmetDemandVolumeMT?: number;
  rationale?: string;
  keyOfftakers?: string[];
  dataProvenance?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  createdAt?: string;
  category?: any;
  corridorOrDistrict?: string;
  targetCommodity?: string;
  estimatedAnnualValueUGX?: number;
  evidenceBasis?: string[];
  confidenceLevel?: string;
  interestedPartiesCount?: number;
  lastUpdatedAt?: string;
  type?: string;
  description?: string;
  corridor?: string;
  currency?: string;
  estimatedValue?: number;
}

export interface OrganizationReputationScore {
  organizationId?: string;
  organizationName?: string;
  overallScore?: number;
  ratingBand?: 'TIER_1_EXEMPLARY' | 'TIER_2_RELIABLE' | 'TIER_3_PROBATIONARY';
  fulfillmentRatePercent?: number;
  qualityPassRatePercent?: number;
  onTimeDeliveryRatePercent?: number;
  completedTradesCount?: number;
  disputeFrequencyPercent?: number;
  evaluatedAt?: string;
  orgId?: string;
  orgName?: string;
  trustScore?: number;
  completedTransactions?: number;
  onTimeDeliveryRate?: number;
  qualityComplianceRate?: number;
  disputeCount?: number;
  verifiedSince?: string;
  badges?: string[];
}

// ==========================================
// AETHER–AROS V5: DISTRIBUTED SCALE, EVENT NETWORK & AUTONOMOUS OPERATIONS
// ==========================================

export type AetherEventCategory =
  | 'USER'
  | 'AGRICULTURAL'
  | 'MARKETPLACE'
  | 'FINANCIAL'
  | 'PAYMENT'
  | 'LOGISTICS'
  | 'CARGO'
  | 'INDUSTRIAL'
  | 'INSTITUTIONAL'
  | 'SECURITY'
  | 'DISASTER'
  | 'INTELLIGENCE'
  | 'FARMER_HARVEST_RECORDED'
  | 'TRADE_CONTRACT_CONFIRMED'
  | 'PAYMENT_SETTLEMENT_CONFIRMED'
  | 'CARGO_CHECKPOINT_REACHED'
  | 'PRODUCTION_BATCH_COMPLETED'
  | 'CROSS_BORDER_CUSTOMS_CLEARED'
  | 'DISRUPTION_DETECTED'
  | 'REMEDIATION_TRIGGERED';

export type AetherEventStatus =
  | 'EMITTED'
  | 'PROCESSED'
  | 'ACKNOWLEDGED'
  | 'FAILED_DLQ'
  | 'REPLAYED'
  | 'PENDING'
  | 'PROCESSING'
  | 'FAILED'
  | 'DEAD_LETTER';

export interface AetherEvent {
  id: string;
  eventType: string;
  category: AetherEventCategory;
  timestamp: string;
  sourceService: string;
  countryCode: string;
  tenantId?: string;
  correlationId: string;
  entityType?: string;
  entityId?: string;
  payload: Record<string, any>;
  status: AetherEventStatus;
  retryCount: number;
  lastError?: string;
  acknowledgedAt?: string;
  // UI aliases
  producerService?: string;
  emittedAt?: string;
  schemaVersion?: number;
  deadLetterReason?: string;
}

export type OperationalIncidentSeverity =
  | 'INFORMATIONAL'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type OperationalIncidentCategory =
  | 'API_DEGRADATION'
  | 'DATABASE_CONNECTION'
  | 'STORAGE_GROWTH'
  | 'QUEUE_CONGESTION'
  | 'BACKUP_FAILURE'
  | 'SECURITY_ANOMALY'
  | 'INTEGRATION_OUTAGE'
  | 'SYNCHRONIZATION_ERROR'
  | 'DATABASE'
  | 'NETWORK'
  | 'WORKER_STALL'
  | 'PAYMENT_GATEWAY'
  | 'TENANT_ISOLATION';

export interface OperationalIncident {
  id: string;
  incidentCode: string;
  title: string;
  severity: OperationalIncidentSeverity;
  category: OperationalIncidentCategory;
  affectedService: string;
  affectedRegion: string;
  evidence: string;
  impactAssessment: string;
  detectedAt: string;
  status: 'DETECTED' | 'ACKNOWLEDGED' | 'IN_REMEDIATION' | 'AWAITING_APPROVAL' | 'RESOLVED' | 'CLOSED' | 'MITIGATING' | 'INVESTIGATING';
  assignedOperator?: string;
  recommendedAction?: string;
  automatedRemediationEligible: boolean;
  requiresHumanApproval: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  resolvedAt?: string;
  resolutionHistory: {
    timestamp: string;
    action: string;
    actor: string;
    result: string;
  }[];
  // UI aliases
  description?: string;
  targetService?: string;
  remediationActions?: AutomatedRemediationAction[];
}

export interface AutomatedRemediationAction {
  id: string;
  incidentId: string;
  actionType:
    | 'RESTART_WORKER'
    | 'FLUSH_EXPIRED_CACHE'
    | 'RETRY_FAILED_JOB'
    | 'SWITCH_FAILOVER_ROUTE'
    | 'RECONNECT_ADAPTER'
    | 'TRIGGER_BACKUP'
    | 'SCALE_CONNECTION_POOL'
    | 'FINANCIAL_SETTLEMENT_HOLD'
    | 'TENANT_ISOLATION_REPAIR'
    | string;
  executedBy: 'AUTONOMOUS_OPERATIONS_ENGINE' | 'HUMAN_OPERATOR' | string;
  targetService: string;
  policyName: string;
  executionState: 'PENDING_APPROVAL' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK' | 'REJECTED' | string;
  beforeState: Record<string, any>;
  afterState?: Record<string, any>;
  resultMessage?: string;
  rollbackAvailable: boolean;
  executedAt?: string;
  // UI aliases
  executionStatus?: 'PENDING_APPROVAL' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK' | 'REJECTED' | string;
  details?: string;
  requiresHumanApproval?: boolean;
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

export interface DisasterRecoveryDrill {
  id: string;
  drillName: string;
  scenario:
    | 'DATABASE_CORRUPTION'
    | 'BACKUP_RESTORATION'
    | 'REGIONAL_OUTAGE'
    | 'EVENT_QUEUE_CONGESTION'
    | 'CREDENTIAL_ROTATION'
    | 'DATABASE_FAILOVER_SIMULATION'
    | 'REGIONAL_GATEWAY_OUTAGE'
    | 'BACKUP_RESTORATION_VERIFICATION'
    | 'CROSS_BORDER_CORRIDOR_PARTITION'
    | string;
  targetService: string;
  simulatedAt: string;
  recoveryDurationMs: number;
  rpoTargetMinutes: number;
  rtoTargetMinutes: number;
  actualRpoMinutes: number;
  actualRtoMinutes: number;
  dataLossRecords: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'COMPLETED' | string;
  correctiveActions: string[];
  verifiedBy: string;
  rtoActualSeconds?: number;
  rpoActualSeconds?: number;
  dataIntegrityVerified?: boolean;
}

export interface EconomicForecast {
  id: string;
  commodity: string;
  countryCode: string;
  regionOrCorridor: string;
  forecastHorizon: '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | string;
  baselineHistoricalPriceUGX: number;
  projectedPriceUGX: number;
  uncertaintyRangeUGX: [number, number];
  projectedVolumeMT: number;
  confidenceScore: number; // 0 to 1 (or 0 to 100)
  primaryDrivers: string[];
  assumptions: string[];
  dataSourceProvenance: string;
  generatedAt: string;
  // UI aliases
  timeHorizon?: string;
  currentSpotPrice?: number;
  projectedPrice?: number;
  confidenceIntervalLow?: number;
  confidenceIntervalHigh?: number;
  predictedTrend?: 'BULLISH' | 'BEARISH' | 'STABLE' | string;
  currency?: string;
  contributingDrivers?: string[];
  actionableRecommendations?: string[];
  modelUsed?: string;
}

export interface SystemTelemetrySnapshot {
  cpuUtilizationPercent: number;
  memoryUtilizationPercent: number;
  diskStorageUtilizationPercent: number;
  databaseStorageBytes: number;
  databaseRecordCount: number;
  apiMedianLatencyMs: number;
  apiP95LatencyMs: number;
  apiP99LatencyMs: number;
  activeBackgroundTasks: number;
  eventQueueLagCount: number;
  deadLetterQueueCount: number;
  backupHealthStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  lastBackupTimestamp: string;
  uptimeSeconds: number;
  // UI aliases
  requestsPerSecond?: number;
  averageLatencyMs?: number;
  activeConnections?: number;
  systemHealthStatus?: string;
  memoryUsagePercent?: number;
}

export interface LoadTestResult {
  id: string;
  profileUsers: number;
  durationSeconds: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsPerSecond: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  timestamp: string;
  // UI aliases
  concurrentUsers?: number;
  throughputRps?: number;
  p50LatencyMs?: number;
  maxLatencyMs?: number;
  systemStability?: string;
}

export interface RegionalObservatoryMetric {
  id: string;
  countryCode: string;
  district: string;
  cropYieldIndex: number;
  activeProducersCount: number;
  grainReservesTons: number;
  storageUtilizationPct: number;
  foodSecurityLevel: 'SECURE' | 'MODERATE_STRESS' | 'ACUTE_ALERT';
  activeDisruptionsCount: number;
  lastUpdated: string;
  // UI aliases
  districtName?: string;
  primaryCommodities?: string[];
  foodSecurityStatus?: string;
  seasonalYieldActualMT?: number;
  seasonalYieldForecastMT?: number;
  storageCapacityMT?: number;
  occupiedStorageMT?: number;
  priceAverageLocalCurrency?: number;
  crossBorderOutflowMT?: number;
}

// ==========================================
// AETHER–AROS V6: UNIVERSAL ECONOMIC CORE & INTEROPERABILITY MODELS
// ==========================================

export type EconomicParticipantType =
  | 'INDIVIDUAL'
  | 'ENTERPRISE'
  | 'FINANCIAL_INSTITUTION'
  | 'GOVERNMENT_AGENCY'
  | 'COOPERATIVE';

export type EconomicSector =
  | 'AGRICULTURE'
  | 'MANUFACTURING'
  | 'FINANCE'
  | 'LOGISTICS'
  | 'RETAIL'
  | 'ENERGY'
  | 'MINING'
  | 'SERVICES'
  | 'CONSTRUCTION'
  | 'HEALTHCARE'
  | 'TECHNOLOGY'
  | 'PUBLIC_SECTOR';

export interface EconomicParticipant {
  id: string;
  participantType: EconomicParticipantType;
  legalName: string;
  tradeName?: string;
  countryCode: string;
  taxIdentificationNumber: string;
  verificationStatus: VerificationState;
  trustScore: number;
  primarySectors: EconomicSector[];
  primaryCurrency: SupportedCurrency;
  contactEmail?: string;
  contactPhone?: string;
  registeredAddress?: string;
  aetherId: string;
  industrySector?: string;
  entityType?: string;
  supportedCurrencies?: string[];
  createdAt: string;
}

export type EconomicAssetCategory =
  | 'LAND'
  | 'BUILDING'
  | 'VEHICLE'
  | 'INDUSTRIAL_MACHINERY'
  | 'INTELLECTUAL_PROPERTY'
  | 'COMMODITY_STOCK'
  | 'RECEIVABLE_INVOICE'
  | 'FINANCIAL_INSTRUMENT';

export interface EconomicAsset {
  id: string;
  ownerParticipantId: string;
  ownerName: string;
  assetCategory: EconomicAssetCategory;
  assetName: string;
  registrationReference: string;
  jurisdiction: string;
  estimatedValuation: number;
  valuationCurrency: SupportedCurrency;
  valuationDate: string;
  certifiedEvaluator?: string;
  encumbrances?: string[];
  status: 'ACTIVE' | 'PLEDGED_COLLATERAL' | 'LEASED' | 'TRANSFERRED' | 'DISPUTED';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface EconomicAccountReference {
  id: string;
  participantId: string;
  institutionName: string;
  accountType: 'COMMERCIAL_BANK' | 'MOBILE_MONEY' | 'ELECTRONIC_MONEY' | 'REGULATED_WALLET' | 'CENTRAL_BANK';
  accountNumberMasked: string;
  currency: SupportedCurrency;
  countryCode: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'SUSPENDED';
  isDefault: boolean;
}

export type EconomicTransactionType =
  | 'COMMERCIAL_EXCHANGE'
  | 'FUNDS_TRANSFER'
  | 'CAPITAL_DISBURSEMENT'
  | 'INVESTMENT_SUBSCRIPTION'
  | 'PAYROLL_SETTLEMENT'
  | 'TAX_PAYMENT'
  | 'DIVIDEND_PAYOUT';

export interface EconomicTransaction {
  id: string;
  transactionReference: string;
  transactionType: EconomicTransactionType;
  originatingParticipantId: string;
  originatingName: string;
  receivingParticipantId: string;
  receivingName: string;
  originalAmount: number;
  originalCurrency: SupportedCurrency;
  settlementAmount: number;
  settlementCurrency: SupportedCurrency;
  exchangeRate: number;
  paymentMethod: string;
  provider: string;
  feeAmount: number;
  status: PaymentOrchestrationStatus;
  authorizedAt?: string;
  settledAt?: string;
  disputeReason?: string;
  auditHash: string;
  createdAt: string;
}

export interface EconomicObligation {
  id: string;
  debtorParticipantId: string;
  debtorName: string;
  creditorParticipantId: string;
  creditorName: string;
  obligationType: 'INVOICE' | 'LOAN_REPAYMENT' | 'TAX_LIABILITY' | 'DIVIDEND' | 'SUPPLY_SETTLEMENT';
  totalAmount: number;
  currency: SupportedCurrency;
  dueDate: string;
  outstandingAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'SATISFIED' | 'DEFAULTED';
  createdAt: string;
}

export interface EconomicContract {
  id: string;
  contractNumber: string;
  contractType: 'COMMERCIAL_SUPPLY' | 'SERVICE_AGREEMENT' | 'WORK_CONTRACT' | 'CREDIT_AGREEMENT' | 'ASSET_LEASE';
  parties: { participantId: string; role: string; name: string }[];
  contractTerms: string;
  effectiveDate: string;
  terminationDate: string;
  totalContractValue: number;
  currency: SupportedCurrency;
  status: 'DRAFT' | 'ACTIVE' | 'FULFILLED' | 'TERMINATED' | 'DISPUTED';
  governingLaw: string;
  createdAt: string;
}

export interface EconomicInstrumentReference {
  id: string;
  instrumentType: 'EQUITY' | 'TREASURY_BILL' | 'SOVEREIGN_BOND' | 'CORPORATE_BOND' | 'COMMODITY_RECEIPT' | 'COMMERCIAL_PAPER';
  isinOrTicker: string;
  issuerParticipantId: string;
  issuerName: string;
  faceValue: number;
  currency: SupportedCurrency;
  maturityDate: string;
  indicativeYieldPercent?: number;
  regulatoryJurisdiction: string;
  status: 'ACTIVE' | 'MATURED' | 'DEFAULTED';
}

export interface EconomicSettlement {
  id: string;
  transactionId: string;
  clearingProvider: string;
  batchReference: string;
  grossAmount: number;
  netAmount: number;
  feeBreakdown: {
    networkFee: number;
    interchangeFee: number;
    fxSpreadFee: number;
  };
  ledgerReference: string;
  reconciliationStatus: 'MATCHED' | 'DISCREPANCY_FLAGGED' | 'ADJUSTED';
  timestamp: string;
}

export interface EconomicExchangeRate {
  baseCurrency: SupportedCurrency;
  quoteCurrency: SupportedCurrency;
  indicativeRate: number;
  providerLiveRate: number;
  buySpreadPct: number;
  sellSpreadPct: number;
  source: string;
  validUntil: string;
  timestamp: string;
}

export interface FxQuote {
  id: string;
  baseCurrency: SupportedCurrency;
  quoteCurrency: SupportedCurrency;
  baseAmount: number;
  quotedAmount: number;
  exchangeRate: number;
  feeAmount: number;
  feeCurrency: SupportedCurrency;
  quoteHash: string;
  expiresAt: string;
  createdAt: string;
}

export interface CommercialCatalogueItem {
  id: string;
  supplierId: string;
  supplierName: string;
  title: string;
  description: string;
  sector: EconomicSector;
  category: string;
  unitPrice: number;
  currency: SupportedCurrency;
  availableQuantity: number;
  unitMetric: string;
  country: string;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  rating?: number;
  createdAt: string;
}

export interface CommercialOrderV6 {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sector: EconomicSector;
  items: {
    itemId: string;
    title: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  currency: SupportedCurrency;
  paymentStatus: PaymentOrchestrationStatus;
  fulfillmentStatus: 'QUEUED' | 'IN_PROCESSING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  createdAt: string;
}

export interface CommercialInvoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  issuerParticipantId: string;
  issuerName: string;
  recipientParticipantId: string;
  recipientName: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: SupportedCurrency;
  dueDate: string;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issuedAt: string;
  settledAt?: string;
}

export interface CommercialDispute {
  id: string;
  disputeNumber: string;
  orderId: string;
  complainantId: string;
  complainantName: string;
  respondentId: string;
  respondentName: string;
  reason: string;
  disputedAmount: number;
  currency: SupportedCurrency;
  status: 'OPEN' | 'UNDER_REVIEW' | 'MEDIATION' | 'RESOLVED' | 'REJECTED';
  resolutionNotes?: string;
  openedAt: string;
  resolvedAt?: string;
}

export interface CapitalFinancingApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  facilityType: 'WORKING_CAPITAL' | 'MERCHANT_CREDIT' | 'INVOICE_DISCOUNTING' | 'PURCHASE_ORDER' | 'EQUIPMENT_LEASE' | 'TRADE_FINANCE';
  requestedAmount: number;
  currency: SupportedCurrency;
  purpose: string;
  annualRevenue: number;
  matchedProvider: string;
  indicativeApr: number;
  repaymentMonths: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDERWRITING' | 'APPROVED' | 'DISBURSED' | 'REJECTED';
  repaymentSchedule?: {
    monthNumber: number;
    dueDate: string;
    principal: number;
    interest: number;
    totalDue: number;
    status: 'PENDING' | 'PAID';
  }[];
  createdAt: string;
}

export interface InvestmentOpportunity {
  id: string;
  title: string;
  issuer: string;
  instrumentType: 'SOVEREIGN_BOND' | 'TREASURY_BILL' | 'CORPORATE_BOND' | 'PRIVATE_EQUITY' | 'INFRASTRUCTURE_FUND' | 'REIT';
  currency: SupportedCurrency;
  targetAmount: number;
  minimumSubscription: number;
  indicativeYieldPercent: number;
  tenorMonths: number;
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
  regulatoryFiling: string;
  summary: string;
  status: 'OPEN' | 'FULLY_SUBSCRIBED' | 'CLOSED';
  createdAt: string;
}

export interface WorkContract {
  id: string;
  contractTitle: string;
  employerId: string;
  employerName: string;
  contractorId: string;
  contractorName: string;
  workType: 'EMPLOYMENT' | 'CONTRACT' | 'FREELANCE' | 'CONSULTING';
  sector: EconomicSector;
  rateAmount: number;
  currency: SupportedCurrency;
  ratePeriod: 'HOURLY' | 'DAILY' | 'MONTHLY' | 'MILESTONE';
  milestones: {
    id: string;
    title: string;
    amount: number;
    completed: boolean;
  }[];
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
  startDate: string;
  endDate?: string;
}

export interface WorkTimesheet {
  id: string;
  contractId: string;
  contractorId: string;
  contractorName: string;
  hoursLogged: number;
  periodStart: string;
  periodEnd: string;
  description: string;
  approvalStatus: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  submittedAt: string;
}

export interface PayrollRun {
  id: string;
  organizationId: string;
  organizationName: string;
  period: string;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  currency: SupportedCurrency;
  employeeCount: number;
  status: 'DRAFT' | 'APPROVED' | 'DISBURSED';
  disbursedAt?: string;
  createdAt: string;
}

export interface PublicTender {
  id: string;
  tenderNumber: string;
  procuringEntity: string;
  title: string;
  sector: EconomicSector;
  countryCode: string;
  budgetEstimate: number;
  currency: SupportedCurrency;
  closingDate: string;
  status: 'OPEN' | 'UNDER_EVALUATION' | 'AWARDED';
  requirements: string[];
  submissionCount: number;
  createdAt: string;
}

export interface TaxDeclaration {
  id: string;
  taxpayerTIN: string;
  taxpayerName: string;
  countryCode: string;
  taxType: 'VAT' | 'CORPORATE_INCOME_TAX' | 'WITHHOLDING_TAX' | 'CUSTOMS_DUTY';
  taxPeriod: string;
  declaredTaxAmount: number;
  currency: SupportedCurrency;
  status: 'SUBMITTED' | 'ASSESSED' | 'PAID';
  submittedAt: string;
  paidAt?: string;
}

export interface EconomicIdentity {
  id: string;
  participantId: string;
  aetherId: string;
  legalName: string;
  verificationLevel: 1 | 2 | 3 | 4;
  trustScore: number;
  verifiedAttributes: string[];
  disputeCount: number;
  fulfillmentRatePct: number;
  onTimeSettlementPct: number;
  registeredCountry: string;
  issuedAt: string;
}

export type AiEconomicDomain =
  | 'CURRENCY_INTELLIGENCE'
  | 'PAYMENT_INTELLIGENCE'
  | 'BANKING_CONNECTIVITY'
  | 'CAPITAL_INTELLIGENCE'
  | 'INVESTMENT_INTELLIGENCE'
  | 'COMMERCE_INTELLIGENCE'
  | 'BUSINESS_INTELLIGENCE'
  | 'WORKFORCE_INTELLIGENCE'
  | 'INDUSTRIAL_INTELLIGENCE'
  | 'TRADE_INTELLIGENCE'
  | 'LOGISTICS_INTELLIGENCE'
  | 'PUBLIC_ECONOMY_INTELLIGENCE'
  | 'ASSET_INTELLIGENCE'
  | 'ECONOMIC_FORECASTER'
  | 'RISK_RESILIENCE';

// ==========================================
// AETHER–AROS V7: GLOBAL ECONOMIC INFRASTRUCTURE & TRUST MODELS
// ==========================================

export type AccountCategory =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE'
  | 'CLEARING'
  | 'SUSPENSE';

export interface ChartOfAccountItem {
  id: string;
  accountNumber: string;
  accountName: string;
  category: AccountCategory;
  currency: string;
  balance: number;
  description: string;
  isSystemAccount: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  exchangeRateToUGX: number;
  baseAmountUGX: number;
  memo: string;
}

export interface UniversalJournalEntry {
  id: string;
  entryNumber: string;
  timestamp: string;
  period: string; // e.g. "2026-11"
  referenceType: 'PAYMENT' | 'INVOICE' | 'SETTLEMENT' | 'PAYROLL' | 'COMMISSION' | 'ADJUSTMENT' | 'FX_REVALUATION';
  referenceId: string;
  lines: JournalLine[];
  totalDebitUGX: number;
  totalCreditUGX: number;
  isBalanced: boolean;
  isPosted: boolean;
  isReversed?: boolean;
  reversedByEntryId?: string;
  postedBy: string;
  auditHash: string;
}

export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'INSTITUTIONAL';
export type BillingFrequency = 'MONTHLY' | 'ANNUAL';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  targetCategory: 'INDIVIDUAL' | 'BUSINESS' | 'INSTITUTION' | 'DEVELOPER';
  pricing: Record<string, number>; // currency -> price
  billingFrequency: BillingFrequency;
  maxUsers: number;
  maxTransactionsMonthly: number;
  apiCallsMonthly: number;
  features: string[];
  isActive: boolean;
}

export interface CommercialSubscription {
  id: string;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  subscriberId: string;
  subscriberName: string;
  billingFrequency: BillingFrequency;
  currency: string;
  recurringAmount: number;
  status: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  usageCounts: {
    monthlyTransactions: number;
    monthlyApiCalls: number;
    seatsUsed: number;
  };
  createdAt: string;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string;
  customerId: string;
  customerName: string;
  currency: string;
  subtotal: number;
  taxJurisdiction: string;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  dueDate: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'REFUNDED';
  paidAt?: string;
  paymentReference?: string;
  createdAt: string;
}

export interface IntegrationAdapter {
  id: string;
  providerId: string;
  providerName: string;
  category:
    | 'CENTRAL_BANK'
    | 'COMMERCIAL_BANK'
    | 'MOBILE_MONEY'
    | 'CARD_NETWORK'
    | 'FX_MARKET'
    | 'TAX_AUTHORITY'
    | 'CUSTOMS_AUTHORITY'
    | 'ERP_SYSTEM'
    | 'IDENTITY_PROVIDER';
  countryCode: string;
  status: 'DESIGNED' | 'LOCAL_STUB' | 'SANDBOX_CONNECTED' | 'PRODUCTION_CONNECTED' | 'VERIFIED' | 'SUSPENDED';
  supportedCurrencies: string[];
  endpointUrl: string;
  apiSpecVersion: string;
  webhookEnabled: boolean;
  averageLatencyMs: number;
  successRatePct: number;
  lastHealthCheck: string;
  isSimulated: boolean;
}

export interface StatutoryJurisdictionRule {
  id: string;
  countryCode: string;
  jurisdictionName: string;
  ruleCategory: 'VAT' | 'CORPORATE_TAX' | 'PAYE' | 'PENSION_NSSF' | 'WITHHOLDING' | 'CUSTOMS_DUTY';
  versionTag: string;
  standardRatePercent: number;
  reducedRatePercent?: number;
  zeroRatedSectors: string[];
  statutoryThreshold: number;
  thresholdCurrency: string;
  effectiveDate: string;
  expirationDate?: string;
  regulatorySource: string;
  isVerified: boolean;
}

export interface FraudRiskAlert {
  id: string;
  alertNumber: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ruleTriggered:
    | 'VELOCITY_SPIKE'
    | 'DUPLICATE_PAYMENT_ATTEMPT'
    | 'SANCTIONS_NAME_MATCH'
    | 'UNUSUAL_CORRIDOR_AMOUNT'
    | 'DEVICE_GEOLOCATION_MISMATCH'
    | 'RAPID_BENEFICIARY_CHANGE';
  participantId: string;
  participantName: string;
  transactionRef?: string;
  amount?: number;
  currency?: string;
  riskScore: number; // 0 - 100
  evidencePayload: Record<string, any>;
  status: 'FLAGGED' | 'INVESTIGATING' | 'DISMISSED_FALSE_POSITIVE' | 'ESCALATED_RESTRICTED';
  investigatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficialOwnershipRecord {
  id: string;
  entityId: string;
  entityName: string;
  beneficialOwnerName: string;
  nationality: string;
  ownershipPercentage: number;
  controlType: 'SHAREHOLDER' | 'VOTING_RIGHTS' | 'EXECUTIVE_OFFICER' | 'TRUSTEE';
  isPoliticallyExposedPerson: boolean;
  sanctionsClearanceStatus: 'CLEARED' | 'PENDING_DOCUMENTATION' | 'FLAGGED';
  verifiedDate: string;
}

// ==========================================
// AETHER–AROS V8.0 - CONTINENTAL ECONOMIC NETWORK & AUTONOMOUS COORDINATION
// ==========================================

export type EconomicRelationshipType =
  | 'OWNERSHIP'
  | 'BENEFICIAL_OWNERSHIP'
  | 'EMPLOYMENT'
  | 'SUPPLIER'
  | 'CUSTOMER'
  | 'CONTRACTUAL'
  | 'PAYMENT'
  | 'FINANCING'
  | 'INVESTMENT'
  | 'CUSTODY'
  | 'SERVICE_PROVISION'
  | 'TRADE'
  | 'INSTITUTIONAL_AUTHORIZATION'
  | 'COMMERCIAL_PARTNERSHIP'
  | 'INVESTOR'
  | 'LOGISTICS'
  | 'CLEARING_AGENT'
  | 'REGULATOR';

export type VisibilityLevel = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED' | 'INSTITUTION_ONLY';

export interface EconomicRelationship {
  id: string;
  sourceParticipantId: string;
  sourceParticipantName: string;
  targetParticipantId: string;
  targetParticipantName: string;
  relationshipType: EconomicRelationshipType;
  visibility: VisibilityLevel;
  status: 'PROPOSED' | 'VERIFIED' | 'ACTIVE' | 'TERMINATED' | 'DISPUTED';
  termsSummary?: string;
  validFrom: string;
  validTo?: string;
  evidenceRef?: string;
  provenance: string;
  createdAt: string;
  updatedAt: string;
}

export interface EconomicDiscoveryListing {
  id: string;
  participantId: string;
  participantName: string;
  title: string;
  description: string;
  countryCode: string;
  region?: string;
  industry: string;
  productServiceCategory?: string;
  currency?: string;
  priceIndication?: number;
  transactionType?:
    | 'SALE'
    | 'PURCHASE'
    | 'SERVICE'
    | 'PROCUREMENT'
    | 'FINANCING'
    | 'INVESTMENT'
    | 'EMPLOYMENT'
    | 'PARTNERSHIP';
  businessSize?: 'MICRO' | 'SME' | 'ENTERPRISE' | 'CORPORATE' | 'COOPERATIVE';
  deliveryRegions: string[];
  supportedPaymentMethods?: string[];
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'INSTITUTIONAL';
  verifiedStatus?: 'VERIFIED' | 'UNVERIFIED' | 'INSTITUTIONAL';
  isPublic?: boolean;
  capabilities?: string[];
  settlementCurrencies?: SupportedCurrency[];
  leadTimeDays?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EconomicMatchResult {
  id?: string;
  matchId?: string;
  sourceEntityId?: string;
  matchedEntityId: string;
  matchedEntityName: string;
  domain?: string;
  matchType?: string;
  matchScore: number;
  explanation?: string;
  matchExplanation?: string;
  supportingEvidence?: string[];
  evidencePoints?: string[];
  missingRequirements?: string[];
  confidence?: number;
  confidenceBand?: 'HIGH' | 'MEDIUM' | 'LOW';
  dataFreshness?: string;
  potentialConflicts?: string[];
  evaluatedAt?: string;
  createdAt?: string;
}

export interface WorkflowStageDefinition {
  stageId: string;
  name: string;
  type: 'AUTOMATED' | 'HUMAN_APPROVAL' | 'EXTERNAL_SERVICE';
  requiredRole?: string;
  timeoutSeconds: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  domain: string;
  version: number;
  stages: WorkflowStageDefinition[];
  retryPolicy: { maxRetries: number; backoffSeconds: number };
  createdAt: string;
}

export interface WorkflowStageState {
  stageId: string;
  name?: string;
  stageName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  assignedTo?: string;
  requiredApprovers?: string[];
  completedAt?: string;
  approvalNotes?: string;
  outputPayload?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  definitionId?: string;
  workflowDefinitionId?: string;
  workflowName: string;
  initiatorId: string;
  initiatorName: string;
  entityId: string;
  currentStageIndex: number;
  status?:
    | 'CREATED'
    | 'VALIDATED'
    | 'APPROVED'
    | 'ACTIVE'
    | 'EXECUTING'
    | 'PAUSED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REQUIRES_APPROVAL'
    | 'COMPLETED'
    | 'REJECTED';
  currentState?:
    | 'CREATED'
    | 'VALIDATED'
    | 'APPROVED'
    | 'ACTIVE'
    | 'EXECUTING'
    | 'PAUSED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REQUIRES_APPROVAL'
    | 'COMPLETED'
    | 'REJECTED';
  stagesState?: WorkflowStageState[];
  stages: WorkflowStageState[];
  timeline: { timestamp: string; event: string; actor: string; notes?: string }[];
  universalTransactionRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UniversalTransactionRecord {
  id: string;
  transactionReference: string;
  initiatorId: string;
  counterpartyId: string;
  workflowInstanceId?: string;
  totalAmount: number;
  currency: string;
  functionalCurrency: string;
  executionFxRate: number;
  status:
    | 'DRAFT'
    | 'INITIATED'
    | 'VALIDATED'
    | 'AUTHORIZED'
    | 'PROCESSING'
    | 'PARTIALLY_COMPLETED'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REVERSED'
    | 'DISPUTED';
  multiRailProviders: string[];
  contractIds: string[];
  invoiceIds: string[];
  journalEntryIds: string[];
  milestones: { milestoneId: string; description: string; amount: number; isSettled: boolean }[];
  auditTrail: { timestamp: string; action: string; actor: string; hash: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgrammableEconomicAgreement {
  id: string;
  agreementNumber: string;
  templateId?: string;
  title: string;
  category: any;
  parties: { participantId: string; participantName: string; role: string; signed: boolean; signedAt?: string }[];
  terms: string;
  currency: string;
  amount: number;
  paymentMilestones: { milestoneId: string; title: string; amount: number; condition: string; isApproved: boolean; isPaid: boolean }[];
  status:
    | 'DRAFT'
    | 'PENDING_SIGNATURES'
    | 'ACTIVE'
    | 'MILESTONE_IN_PROGRESS'
    | 'FULFILLED'
    | 'DISPUTED'
    | 'TERMINATED';
  digitalSignaturesCount: number;
  version: number;
  amendmentHistory: { version?: number; amendmentNumber?: number; amendedAt?: string; timestamp?: string; amendedBy: string; notes: string }[];
  createdAt: string;
  updatedAt: string;
}

export type AutomationCategory = 'ROUTINE' | 'CONDITIONAL' | 'AI_ASSISTED' | 'HIGH_IMPACT';

export interface AutomationRulePolicy {
  id: string;
  name: string;
  category: AutomationCategory;
  owner: string;
  authorizedScope: string;
  triggerCondition: string;
  requiresHumanApproval: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  riskClassification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  executionCount: number;
  failureCount: number;
  circuitBreakerTripped: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecutionRecord {
  id: string;
  policyId: string;
  policyName: string;
  category: AutomationCategory;
  state:
    | 'CREATED'
    | 'VALIDATED'
    | 'APPROVED'
    | 'ACTIVE'
    | 'EXECUTING'
    | 'COMPLETED'
    | 'EXECUTED'
    | 'PAUSED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REQUIRES_APPROVAL';
  triggeredAt: string;
  approvedBy?: string;
  approvedAt?: string;
  outputSummary: string;
  payload?: any;
  isHighImpact: boolean;
}

export interface UniversalPaymentProvider {
  id: string;
  providerName: string;
  providerType:
    | 'MOBILE_MONEY'
    | 'COMMERCIAL_BANK'
    | 'PSP'
    | 'CARD_PROCESSOR'
    | 'REMITTANCE'
    | 'CENTRAL_BANK_SETTLEMENT';
  supportedCountries: string[];
  supportedCurrencies: string[];
  transactionLimits: { min: number; max: number };
  feeSchedulePercent: number;
  settlementPeriod: string;
  availabilityPercent: number;
  regulatoryStatus: 'LICENSED' | 'REGULATORY_SANDBOX' | 'EXEMPT_INSTITUTIONAL' | 'PENDING_AUTHORIZATION';
  integrationStatus:
    | 'IMPLEMENTED'
    | 'SANDBOX_CONNECTED'
    | 'PRODUCTION_CONNECTED'
    | 'PRODUCTION_VERIFIED'
    | 'REQUIRES_CREDENTIALS';
  idempotencyEnabled: boolean;
}

// ==========================================
// AETHER–AROS V9.0 - GLOBAL ECONOMIC INFRASTRUCTURE & SOVEREIGN INTEROPERABILITY
// ==========================================

export type FederationStatus =
  | 'REGISTERED'
  | 'TECHNICALLY_VALIDATED'
  | 'AUTHORIZATION_VERIFIED'
  | 'SANDBOX_CONNECTED'
  | 'PRODUCTION_CONNECTED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'REQUIRES_REVIEW';

export type FederationInterfaceType =
  | 'REST_API'
  | 'ISO20022'
  | 'MTLS_WEBHOOK'
  | 'OPENAPI_V3'
  | 'SECURE_FILE_EXCHANGE';

export type FederationTransactionType =
  | 'CROSS_BORDER_SETTLEMENT'
  | 'TRADE_FINANCE'
  | 'FX_SWAP'
  | 'IDENTITY_RESOLUTION'
  | 'CUSTOMS_CLEARING'
  | 'REMITTANCE';

export interface FederationNetwork {
  id: string;
  federationId: string;
  countryCode: string;
  organizationName: string;
  responsibleAuthority: string;
  authorizedRepresentatives: string[];
  technicalEndpoint: string;
  supportedInterfaces: FederationInterfaceType[];
  supportedCurrencies: string[];
  supportedTransactionTypes: FederationTransactionType[];
  dataSharingPolicy: {
    dataMinimization: boolean;
    sovereignStorageCountry: string;
    crossBorderTransferApproved: boolean;
    piiRedaction: boolean;
  };
  securityCredentials: {
    certificateThumbprint: string;
    mutualTlsVerified: boolean;
    keyAlgorithm: string;
    tokenEndpoint: string;
  };
  regulatoryAuthorizationEvidence: {
    licenseNumber: string;
    regulatoryBody: string;
    validUntil: string;
    verified: boolean;
  };
  status: FederationStatus;
  availabilityPercent: number;
  registrationHistory: {
    timestamp: string;
    event: string;
    actor: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface FederatedIdentityIssuer {
  id: string;
  issuerName: string;
  issuerCountry: string;
  issuerAuthority: string;
  verificationMethod: 'NATIONAL_ID_API' | 'COMMERCIAL_REGISTRY' | 'CENTRAL_BANK_KYC' | 'LEI_REGISTER' | 'PKI_X509';
  supportedClaims: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  trustScore: number;
  crossBorderResolutionEnabled: boolean;
  createdAt: string;
}

export interface FederatedIdentityClaim {
  id: string;
  issuerId: string;
  issuerName: string;
  subjectAetherId: string;
  subjectName: string;
  homeJurisdiction: string;
  claimType:
    | 'LEGAL_ENTITY'
    | 'BENEFICIAL_OWNERSHIP'
    | 'SANCTIONS_CLEARED'
    | 'TAX_RESIDENCY'
    | 'ACCREDITED_INVESTOR'
    | 'SOVEREIGN_AUTHORITY';
  claimValue: string;
  issuedAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revocationReason?: string;
  provenanceHash: string;
  consentRecordRef: string;
}

export interface InteroperabilityStandardRecord {
  id: string;
  standardName: string;
  protocolType: 'REST' | 'ISO_20022' | 'WEBHOOK' | 'MTLS' | 'SECURE_FILE' | 'EVENT_STREAM';
  providerId: string;
  providerName: string;
  supportedOperations: string[];
  authenticationMethod: 'MTLS_BEARER' | 'HMAC_SHA256' | 'OAUTH2' | 'X509_PKI';
  messageFormats: string[];
  version: string;
  jurisdiction: string;
  supportedCurrencies: string[];
  dataClassification: 'CONFIDENTIAL' | 'RESTRICTED' | 'PUBLIC';
  authorizationRequirements: string[];
  status: 'DESIGNED' | 'SANDBOX_CONNECTED' | 'PRODUCTION_CONNECTED' | 'VERIFIED';
  createdAt: string;
}

export interface MessageTranslationRecord {
  id: string;
  sourceFormat: string;
  targetFormat: string;
  providerReference: string;
  originalPayloadPreview: string;
  normalizedPayload: Record<string, any>;
  transformationRules: string[];
  transformationResult: 'SUCCESS' | 'MAPPING_WARNING' | 'FAILED';
  signatureVerified: boolean;
  timestamp: string;
}

export interface TreasuryPosition {
  id: string;
  institutionId: string;
  institutionName: string;
  accountNumber: string;
  jurisdiction: string;
  currency: string;
  totalBalance: number;
  availableBalance: number;
  encumberedBalance: number;
  asOfDate: string;
  authorizedSignatories: string[];
  fxExposureUGX: number;
}

export interface ReconciliationBatch {
  id: string;
  batchNumber: string;
  providerId: string;
  providerName: string;
  period: string;
  internalTransactionsCount: number;
  externalTransactionsCount: number;
  matchedCount: number;
  unmatchedCount: number;
  varianceAmount: number;
  currency: string;
  status: 'RECONCILED' | 'VARIANCE_DETECTED' | 'INVESTIGATION_REQUIRED';
  reconciledAt: string;
}

export interface ReconciliationException {
  id: string;
  batchId: string;
  transactionRef: string;
  exceptionType:
    | 'MISSING_IN_EXTERNAL'
    | 'AMOUNT_MISMATCH'
    | 'CURRENCY_MISMATCH'
    | 'DUPLICATE_ENTRY'
    | 'TIMING_DIFFERENCE'
    | 'FEE_UNMATCHED';
  internalAmount: number;
  externalAmount: number;
  currency: string;
  assignedOwner: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'WRITTEN_OFF';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DataTransferPolicy {
  id: string;
  originCountry: string;
  destinationCountry: string;
  dataCategory: 'FINANCIAL_TRANSACTION' | 'IDENTITY_METADATA' | 'TRADE_DOCUMENT' | 'ANALYTICS_AGGREGATE';
  legalBasis: 'TREATY_EAC_ARTICLE_104' | 'CONSENT_EXPLICIT' | 'STATUTORY_CUSTOMS' | 'CONTRACTUAL_NECESSITY';
  encryptionStandard: string;
  retentionDays: number;
  requiresPreAuthorization: boolean;
  isAllowed: boolean;
  createdAt: string;
}

export interface DataExchangeLog {
  id: string;
  policyId: string;
  originCountry: string;
  destinationCountry: string;
  sendingEntity: string;
  receivingEntity: string;
  dataCategory: string;
  recordCount: number;
  provenanceHash: string;
  status: 'COMPLIANT_TRANSFERRED' | 'BLOCKED_BY_SOVEREIGNTY' | 'FLAGGED_EXCESSIVE';
  timestamp: string;
}

export interface MultiRegionRecoveryEvent {
  id: string;
  region: string;
  eventType: 'FAILOVER_DRILL' | 'PARTITION_DETECTED' | 'BACKUP_VERIFIED' | 'OFFLINE_SYNC_RESUMED';
  durationSeconds: number;
  recoveryPointActualMinutes: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  auditSummary: string;
  timestamp: string;
}

// ==========================================
// V10 GLOBAL ECONOMIC EXECUTION & INSTITUTIONAL OPERATIONS
// ==========================================

export type EconomicExecutionStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'AUTHORIZATION_PENDING'
  | 'AUTHORIZED'
  | 'SCHEDULED'
  | 'EXECUTING'
  | 'MILESTONE_VERIFICATION'
  | 'COMPLETION_PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'SUSPENDED'
  | 'DISPUTED'
  | 'REVERSED';

export interface ExecutionMilestone {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';
  verifiedAt?: string;
  verifiedBy?: string;
  evidenceHash?: string;
}

export interface ExecutionEvidence {
  id: string;
  evidenceType: 'CONTRACT' | 'CUSTOMS_DECLARATION' | 'BILL_OF_LADING' | 'INSPECTION_CERTIFICATE' | 'SETTLEMENT_RECEIPT' | 'DELIVERY_NOTE';
  title: string;
  hash: string;
  issuer: string;
  timestamp: string;
}

export interface ExecutionTransitionEvent {
  id: string;
  timestamp: string;
  actor: string;
  previousState: string;
  newState: string;
  reason: string;
  authorizationEvidence?: string;
}

export interface EconomicExecution {
  id: string;
  executionNumber: string;
  originatingParticipantId: string;
  originatingParticipantName: string;
  receivingParticipantId: string;
  receivingParticipantName: string;
  originJurisdiction: string;
  destinationJurisdiction: string;
  activityClassification:
    | 'CROSS_BORDER_TRADE'
    | 'INDUSTRIAL_PROCUREMENT'
    | 'COMMODITY_EXPORT'
    | 'INFRASTRUCTURE_FINANCING'
    | 'SERVICES_CONTRACT'
    | 'AGRICULTURAL_CORRIDOR_SUPPLY'
    | 'CROSS_CURRENCY_SETTLEMENT';
  currency: string;
  value: number;
  agreementId?: string;
  requiredAuthorizations: string[];
  requiredServiceProviders: string[];
  status: EconomicExecutionStatus;
  milestones: ExecutionMilestone[];
  evidenceRecords: ExecutionEvidence[];
  exceptions: string[];
  auditTrail: ExecutionTransitionEvent[];
  settlementVerifiedByProvider: boolean;
  regulatoryClearanceConfirmed: boolean;
  createdAt: string;
  completedAt?: string;
}

export type InstitutionalOperationalClassification =
  | 'CENTRAL_BANK'
  | 'COMMERCIAL_BANK'
  | 'PAYMENT_SERVICE_PROVIDER'
  | 'CUSTOMS_AUTHORITY'
  | 'TAX_AUTHORITY'
  | 'BUSINESS_REGISTRY'
  | 'LOGISTICS_PROVIDER'
  | 'CLEARING_HOUSE'
  | 'INSURANCE_UNDERWRITER'
  | 'DEVELOPMENT_FINANCE_INSTITUTION'
  | 'INDUSTRY_FEDERATION'
  | 'TECHNOLOGY_PROVIDER';

export type InstitutionalLifecycleStatus =
  | 'APPLICATION'
  | 'IDENTITY_REVIEW'
  | 'LEGAL_REVIEW'
  | 'TECHNICAL_ASSESSMENT'
  | 'SANDBOX_VALIDATION'
  | 'AUTHORIZATION_APPROVAL'
  | 'PRODUCTION_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED';

export interface InstitutionalAuthorizationEvidence {
  regulatoryBody: string;
  licenseNumber: string;
  validUntil: string;
  statutoryBasis: string;
  status: 'VALIDATED' | 'CONDITIONAL' | 'EXPIRED' | 'UNVERIFIED';
}

export interface InstitutionalProfile {
  id: string;
  institutionId: string;
  legalName: string;
  jurisdiction: string;
  operationalClassification: InstitutionalOperationalClassification;
  authorizationEvidence: InstitutionalAuthorizationEvidence;
  integrationCapabilities: string[];
  supportedMessageStandards: string[];
  supportedCurrencies: string[];
  serviceAvailability: number;
  integrationEnvironment: 'SANDBOX' | 'PRODUCTION_STAGED' | 'PRODUCTION_VERIFIED';
  operationalContactRoles: string[];
  governanceRestrictions: string[];
  status: InstitutionalLifecycleStatus;
  auditHistory: { timestamp: string; action: string; actor: string; notes?: string }[];
  createdAt: string;
}

export type EconomicAgreementType =
  | 'COMMERCIAL_CONTRACT'
  | 'SUPPLY_AGREEMENT'
  | 'PURCHASE_ORDER'
  | 'SERVICE_AGREEMENT'
  | 'LOGISTICS_AGREEMENT'
  | 'INDUSTRIAL_SUPPLY_AGREEMENT'
  | 'FINANCING_AGREEMENT'
  | 'PROCUREMENT_CONTRACT'
  | 'CROSS_BORDER_TRADE_AGREEMENT'
  | 'INSTITUTIONAL_SERVICE_AGREEMENT'
  | 'MULTI_PARTY_AGREEMENT';

export type EconomicAgreementStatus =
  | 'DRAFT'
  | 'NEGOTIATION'
  | 'APPROVAL'
  | 'SIGNATURE_PENDING'
  | 'EXECUTED'
  | 'ACTIVE'
  | 'FULFILLMENT'
  | 'COMPLETED'
  | 'AMENDED'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'EXPIRED'
  | 'DISPUTED';

export interface AgreementParty {
  participantId: string;
  name: string;
  role: 'BUYER' | 'SELLER' | 'FINANCIER' | 'ESCROW_AGENT' | 'LOGISTICS_CARRIER' | 'REGULATORY_OBSERVER';
  jurisdiction: string;
  authorizedSignatory: string;
}

export interface AgreementSignature {
  signatoryId: string;
  signatoryName: string;
  signatoryRole: string;
  signedAt: string;
  cryptographicHash: string;
  verificationStatus: 'VERIFIED' | 'PENDING';
}

export interface ContractMilestone {
  id: string;
  title: string;
  targetDate: string;
  amount: number;
  status: 'PENDING' | 'ACHIEVED' | 'VERIFIED' | 'DISPUTED';
}

export interface EconomicAgreement {
  id: string;
  agreementNumber: string;
  title: string;
  agreementType: EconomicAgreementType;
  parties: AgreementParty[];
  jurisdictions: string[];
  scope: string;
  deliverables: string[];
  value: number;
  currency: string;
  pricingTerms: string;
  paymentConditions: string;
  milestones: ContractMilestone[];
  deliveryConditions: string;
  disputeProvisions: string;
  governingLaw: string;
  signatures: AgreementSignature[];
  documentHash: string;
  status: EconomicAgreementStatus;
  version: number;
  amendmentHistory: { version: number; amendedAt: string; amendedBy: string; changeSummary: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CommercialOrder {
  id: string;
  orderNumber: string;
  type: 'B2B' | 'B2C' | 'C2C' | 'B2G' | 'G2B' | 'INSTITUTIONAL_PROCUREMENT' | 'WHOLESALE' | 'CROSS_BORDER' | 'SERVICES';
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  items: { sku: string; description: string; quantity: number; unitPrice: number; total: number }[];
  totalAmount: number;
  currency: string;
  jurisdiction: string;
  applicableTaxRate: number;
  taxAuthorityCode: string;
  taxAmount: number;
  status:
    | 'OPPORTUNITY'
    | 'OFFER'
    | 'NEGOTIATION'
    | 'ORDER'
    | 'CONTRACT'
    | 'FULFILLMENT'
    | 'DELIVERY_CONFIRMATION'
    | 'INVOICE'
    | 'PAYMENT_COORDINATION'
    | 'RECONCILIATION'
    | 'CLOSED';
  deliveryAddress: string;
  incoterm: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyChainShipment {
  id: string;
  shipmentNumber: string;
  orderId: string;
  originLocation: string;
  destinationLocation: string;
  carrierId: string;
  carrierName: string;
  transportMode: 'ROAD' | 'RAIL' | 'AIR' | 'MARITIME' | 'INLAND_WATERWAY' | 'MULTIMODAL';
  currentStatus:
    | 'PENDING'
    | 'DISPATCHED'
    | 'IN_TRANSIT'
    | 'CUSTOMS_HOLD'
    | 'CUSTOMS_CLEARED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'DELAYED'
    | 'EXCEPTION';
  milestoneHistory: { timestamp: string; location: string; event: string; verifiedBy: string }[];
  actualEventsOnly: boolean;
  dispatchedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export interface FinancialExecutionRecord {
  id: string;
  executionId: string;
  transactionRef: string;
  amount: number;
  currency: string;
  sourceAccount: string;
  beneficiaryAccount: string;
  originatingParticipantId: string;
  providerId: string;
  providerName: string;
  lifecycleStage:
    | 'INTERNAL_CREATED'
    | 'AUTHORIZED'
    | 'INSTRUCTION_SUBMITTED'
    | 'PROVIDER_ACKNOWLEDGED'
    | 'CLEARING'
    | 'SETTLEMENT_CONFIRMED'
    | 'RECONCILED'
    | 'REVERSED'
    | 'DISPUTED';
  idempotencyKey: string;
  providerResponseCode?: string;
  settlementEvidenceHash?: string;
  providerConfirmedAt?: string;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
}

export interface FinancialIntegrityReport {
  journalBalanced: boolean;
  totalDebitsByCurrency: Record<string, number>;
  totalCreditsByCurrency: Record<string, number>;
  currencyIntegrityPassed: boolean;
  suspenseAccountBalance: number;
  unverifiedSettlementsCount: number;
  openExceptions: any[];
  trialBalanceDate: string;
}

export interface EconomicRiskAssessment {
  id: string;
  entityId: string;
  entityType: 'PARTICIPANT' | 'INSTITUTION' | 'TRANSACTION' | 'EXECUTION';
  compositeRiskScore: number;
  riskTier: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  flags: string[];
  sanctionsScreeningResult: 'CLEARED' | 'POTENTIAL_MATCH' | 'SANCTIONED' | 'NOT_APPLICABLE';
  jurisdictionalExposure: string;
  deliveryReliabilityRating: number;
  explainableFactors: { factor: string; impact: string; source: string; confidence: number }[];
  assessedAt: string;
  reviewerNotes?: string;
}

export interface EconomicDispute {
  id: string;
  disputeNumber: string;
  executionId?: string;
  agreementId?: string;
  complainantId: string;
  respondentId: string;
  disputeCategory:
    | 'PAYMENT'
    | 'CONTRACT'
    | 'DELIVERY'
    | 'PRODUCT_QUALITY'
    | 'SERVICE'
    | 'INVOICE'
    | 'INSTITUTIONAL_INTEGRATION'
    | 'DATA_SHARING';
  claimAmount: number;
  currency: string;
  description: string;
  evidenceItems: { id: string; title: string; hash: string; uploadedBy: string; timestamp: string }[];
  status:
    | 'OPENED'
    | 'EVIDENCE_COLLECTION'
    | 'REVIEW'
    | 'RESPONSE_PENDING'
    | 'MEDIATION'
    | 'RESOLUTION_PROPOSED'
    | 'ACCEPTED'
    | 'CLOSED'
    | 'ESCALATED'
    | 'WITHDRAWN'
    | 'REJECTED'
    | 'LEGAL_REFERRAL';
  mediatorRole?: string;
  resolutionProposal?: string;
  resolutionOutcome?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface GovernedAutomationPolicy {
  id: string;
  policyName: string;
  automationLevel: 1 | 2 | 3 | 4 | 5;
  allowedActions: string[];
  requiresHumanApproval: boolean;
  maxAutoApprovalAmount: number;
  currency: string;
  activeCircuitBreaker: boolean;
  createdAt: string;
}

export interface AutomationApprovalQueueItem {
  id: string;
  actionType: string;
  automationLevel: 1 | 2 | 3 | 4 | 5;
  payload: any;
  requestedBy: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EMERGENCY_STOPPED';
  approvedBy?: string;
  executedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface SustainabilityPlan {
  id: string;
  planName: string;
  planType:
    | 'SUBSCRIPTION'
    | 'ENTERPRISE_CONTRACT'
    | 'INSTITUTIONAL_LICENSING'
    | 'API_USAGE'
    | 'DEVELOPER_TIER'
    | 'MARKETPLACE_SERVICE_FEE';
  currency: string;
  price: number;
  billingInterval: 'MONTHLY' | 'ANNUAL' | 'PER_TRANSACTION';
  effectiveDate: string;
  activeSubscribers: number;
}

// ==========================================
// V11 GLOBAL ECONOMIC NETWORK SCALE & ECOSYSTEM ADOPTION
// ==========================================

export type V11TenantRole =
  | 'TENANT_ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'FINANCE_OFFICER'
  | 'PROCUREMENT_LEAD'
  | 'COMPLIANCE_AUDITOR'
  | 'MEMBER';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'CLOSED';

export interface TenantRecord {
  id: string;
  slug: string;
  legalName: string;
  organizationType: 'BUSINESS' | 'COOPERATIVE' | 'INSTITUTION' | 'LOGISTICS_CARRIER' | 'DEVELOPER_ORG' | 'PUBLIC_AGENCY';
  jurisdiction: string;
  parentTenantId?: string;
  primaryAdminUserId: string;
  status: TenantStatus;
  dataOwnershipPolicy: {
    residencyCountry: string;
    retainAuthoritativeControl: boolean;
    retentionDays: number;
    allowCrossBorderAnalytics: boolean;
  };
  billingPlanId: string;
  integrationEnvironment: 'SANDBOX' | 'PRODUCTION_STAGED';
  createdAt: string;
  updatedAt: string;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  email: string;
  role: V11TenantRole;
  attributes: string[]; // ABAC attributes e.g. ['EXPORT_SIGNATORY', 'TREASURY_VIEW']
  status: 'ACTIVE' | 'INVITED' | 'REVOKED' | 'SUSPENDED';
  invitedBy: string;
  joinedAt: string;
  revokedAt?: string;
}

export type ParticipantCategory = 'INDIVIDUAL' | 'BUSINESS' | 'INSTITUTION' | 'DEVELOPER';

export type OnboardingLifecycleStatus =
  | 'APPLICATION'
  | 'IDENTITY_VERIFICATION'
  | 'CLASSIFICATION'
  | 'DOCUMENT_REVIEW'
  | 'RISK_ASSESSMENT'
  | 'APPROVAL'
  | 'ACTIVATION'
  | 'PENDING_INFORMATION'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'REVOKED';

export interface OnboardingEvidenceDoc {
  id: string;
  documentType: string;
  fileName: string;
  documentHash: string;
  classification: 'SENSITIVE_IDENTITY' | 'CORPORATE_REGISTRATION' | 'TAX_CERTIFICATE' | 'STATUTORY_MANDATE';
  verificationStatus: 'SELF_DECLARED' | 'PENDING_REVIEW' | 'INDEPENDENTLY_VERIFIED' | 'REJECTED';
  uploadedAt: string;
  verifiedBy?: string;
}

export interface ParticipantOnboardingApplication {
  id: string;
  tenantId: string;
  participantType: ParticipantCategory;
  legalOrFullName: string;
  email: string;
  phone: string;
  jurisdiction: string;
  registrationOrNationalId: string;
  taxId?: string;
  declaredCapabilities: string[];
  authorizedRepresentatives: { name: string; role: string; email: string }[];
  consentGranted: boolean;
  consentTimestamp: string;
  status: OnboardingLifecycleStatus;
  evidenceDocuments: OnboardingEvidenceDoc[];
  duplicateCheckStatus: 'CLEAR' | 'POTENTIAL_DUPLICATE';
  verificationClaimType: 'SELF_DECLARED' | 'PARTIALLY_VERIFIED' | 'INDEPENDENTLY_VERIFIED';
  renewalDueAt?: string;
  auditHistory: { timestamp: string; action: string; actor: string; notes?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BusinessWorkspaceProfile {
  id: string;
  tenantId: string;
  businessName: string;
  sector: string;
  jurisdiction: string;
  locations: { id: string; label: string; city: string; country: string; isPrimary: boolean }[];
  representatives: { name: string; title: string; verificationStatus: 'SELF_DECLARED' | 'VERIFIED' }[];
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  statutoryDisclaimer: string;
  updatedAt: string;
}

export interface BusinessCatalogItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  itemType: 'PRODUCT' | 'SERVICE' | 'RAW_MATERIAL' | 'INDUSTRIAL_INPUT';
  category: string;
  unit: string;
  unitPrice: number;
  currency: string;
  availableStockOrCapacity: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export interface BusinessCommercialDoc {
  id: string;
  tenantId: string;
  docNumber: string;
  docType: 'QUOTATION' | 'PURCHASE_ORDER' | 'INVOICE' | 'DELIVERY_NOTE';
  counterpartyName: string;
  counterpartyTenantId?: string;
  lineItems: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'PAID' | 'DELIVERED' | 'DISPUTED' | 'CANCELLED';
  dueDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface BusinessTaskItem {
  id: string;
  tenantId: string;
  title: string;
  assignedTo: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  createdAt: string;
}

export type V11RelationshipType =
  | 'CUSTOMER'
  | 'SUPPLIER'
  | 'DISTRIBUTOR'
  | 'MANUFACTURER'
  | 'INVESTOR'
  | 'SERVICE_PROVIDER'
  | 'LOGISTICS_PROVIDER'
  | 'PROCUREMENT_RELATIONSHIP'
  | 'CONTRACTUAL_RELATIONSHIP'
  | 'INSTITUTIONAL_AUTHORIZATION'
  | 'OWNERSHIP'
  | 'BENEFICIAL_OWNERSHIP';

export interface ParticipantRelationshipRecord {
  id: string;
  tenantId: string;
  sourceParticipantId: string;
  sourceParticipantName: string;
  targetParticipantId: string;
  targetParticipantName: string;
  relationshipType: V11RelationshipType;
  jurisdiction: string;
  visibility: 'PUBLIC' | 'NETWORK_PARTICIPANTS' | 'BILATERAL_ONLY' | 'RESTRICTED_REGULATORY';
  evidenceRef: string;
  verificationStatus: 'SELF_DECLARED' | 'VERIFIED';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  authorizedContacts: string[];
  expiresAt?: string;
  createdAt: string;
}

export interface ConnectionRequestRecord {
  id: string;
  fromTenantId: string;
  fromName: string;
  toTenantId: string;
  toName: string;
  proposedRelationshipType: V11RelationshipType;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  respondedAt?: string;
}

export interface NetworkMarketplaceListing {
  id: string;
  tenantId: string;
  publisherName: string;
  listingType:
    | 'PRODUCT'
    | 'SERVICE'
    | 'RAW_MATERIAL'
    | 'INDUSTRIAL_INPUT'
    | 'PRODUCTION_CAPACITY'
    | 'DISTRIBUTION'
    | 'PROCUREMENT_REQUIREMENT'
    | 'LOGISTICS_SERVICE'
    | 'PROFESSIONAL_SERVICE'
    | 'WORK_OPPORTUNITY'
    | 'TECH_SERVICE'
    | 'FINANCIAL_SERVICE';
  title: string;
  description: string;
  jurisdiction: string;
  currency: string;
  unitPrice: number;
  unit: string;
  minOrderQuantity: number;
  availableQuantity: number;
  claimClassification: 'VERIFIED_BUSINESS_LISTING' | 'PARTICIPANT_SUBMITTED_CLAIM';
  verificationNotes: string;
  status: 'ACTIVE' | 'MODERATION_HOLD' | 'EXPIRED' | 'CLOSED';
  offers: {
    id: string;
    buyerTenantId: string;
    buyerName: string;
    offeredPrice: number;
    quantity: number;
    notes: string;
    status: 'SUBMITTED' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
  }[];
  fraudReportsCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface V11ProcurementRequest {
  id: string;
  tenantId: string;
  referenceNumber: string;
  procurementScope: 'PRIVATE_SECTOR' | 'INDUSTRIAL' | 'COOPERATIVE' | 'INSTITUTIONAL' | 'CROSS_BORDER' | 'AUTHORIZED_PUBLIC';
  title: string;
  category: string;
  jurisdiction: string;
  budgetAmount: number;
  currency: string;
  evaluationCriteria: { criterion: string; weightPct: number }[];
  officialGovernmentPortalLinked: boolean;
  status: 'OPEN' | 'EVALUATION' | 'AWARD_PENDING_HUMAN_APPROVAL' | 'AWARDED' | 'CANCELLED';
  bids: {
    id: string;
    supplierTenantId: string;
    supplierName: string;
    bidAmount: number;
    deliveryDays: number;
    qualificationVerified: boolean;
    technicalScore: number;
    status: 'SUBMITTED' | 'SHORTLISTED' | 'AWARDED' | 'REJECTED';
    submittedAt: string;
  }[];
  awardedToBidId?: string;
  awardAuthorizedBy?: string;
  awardedAt?: string;
  createdAt: string;
}

export interface SupplierQualificationRecord {
  id: string;
  tenantId: string;
  supplierName: string;
  jurisdiction: string;
  categories: string[];
  complianceDocsHash: string;
  qualificationStatus: 'PREQUALIFIED' | 'PENDING_REVIEW' | 'EXPIRED';
  verifiedBy: string;
  validUntil: string;
}

export interface LogisticsCarrierProfile {
  id: string;
  tenantId: string;
  carrierName: string;
  modes: ('ROAD' | 'RAIL' | 'AIR' | 'MARITIME' | 'INLAND_WATERWAY' | 'COLD_CHAIN' | 'LAST_MILE')[];
  corridorsCovered: string[];
  fleetCount: number;
  trackingSourceType: 'CARRIER_API' | 'RECTS_E_SEAL' | 'MANUAL_DISPATCH_EVIDENCE';
  verificationStatus: 'VERIFIED_CARRIER' | 'SELF_DECLARED';
  activeShipmentsCount: number;
}

export type ProviderIntegrationLifecycle =
  | 'DISCOVERED'
  | 'REVIEW_PENDING'
  | 'CONFIGURED'
  | 'SANDBOX_TESTED'
  | 'SECURITY_APPROVED'
  | 'AUTHORIZED'
  | 'PRODUCTION_CONNECTED'
  | 'MONITORED';

export type IntegrationConnectionClassification =
  | 'REFERENCE_DIRECTORY'
  | 'LOCAL_SIMULATOR'
  | 'SANDBOX_CONNECTED'
  | 'PRODUCTION_CONNECTED_AND_VERIFIED'
  | 'NOT_CONFIGURED';

export interface VerifiedProviderProfile {
  id: string;
  providerCode: string;
  legalName: string;
  providerType: 'BANK' | 'MOBILE_MONEY' | 'REGIONAL_SWITCH' | 'CENTRAL_BANK' | 'PAYMENT_GATEWAY' | 'FX_PROVIDER';
  jurisdiction: string;
  regulatoryEvidence: {
    authority: string;
    licenseRef: string;
    verified: boolean;
  };
  supportedCurrencies: string[];
  supportedMethods: string[];
  lifecycleStage: ProviderIntegrationLifecycle;
  connectionClassification: IntegrationConnectionClassification;
  transactionLimitSingle: number;
  limitCurrency: string;
  callbackVerificationMethod: 'HMAC_SHA256' | 'MTLS_SIGNED_WEBHOOK' | 'NONE';
  failoverProviderCode?: string;
  lastCertificationRun?: {
    timestamp: string;
    passed: boolean;
    environment: 'SANDBOX' | 'PRODUCTION';
    notes: string;
  };
  credentialStatus: 'ACTIVE' | 'ROTATION_REQUIRED' | 'REVOKED' | 'NOT_PROVISIONED';
  updatedAt: string;
}

export type AppRegistryLifecycle =
  | 'SUBMITTED'
  | 'REVIEW_PENDING'
  | 'SECURITY_REVIEW'
  | 'SANDBOX_APPROVED'
  | 'PRODUCTION_APPROVED'
  | 'PUBLISHED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'RETIRED';

export interface RegisteredEcosystemApp {
  id: string;
  tenantId: string;
  developerName: string;
  organizationName: string;
  appName: string;
  apiVersion: string;
  scopes: string[];
  webhookUrl?: string;
  clientId: string;
  apiKeyPrefix: string;
  keyHash: string;
  rateLimitPerMin: number;
  usageCount24h: number;
  lifecycleStage: AppRegistryLifecycle;
  credentialStatus: 'SANDBOX_ACTIVE' | 'PRODUCTION_ACTIVE' | 'REVOKED';
  securityReviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndustrialCapacityRecord {
  id: string;
  tenantId: string;
  facilityName: string;
  jurisdiction: string;
  sector: string;
  productLine: string;
  totalCapacityPerMonth: number;
  availableCapacityPerMonth: number;
  unit: string;
  inputRequirements: string[];
  equipmentStatus: 'OPERATIONAL' | 'PARTIAL_MAINTENANCE' | 'OFFLINE';
  sourceAttribution: string;
  verificationStatus: 'AUDITED_CAPACITY' | 'SELF_REPORTED';
  updatedAt: string;
}

export interface WorkServiceOpportunity {
  id: string;
  tenantId: string;
  publisherName: string;
  engagementType: 'EMPLOYMENT' | 'CONTRACT_WORK' | 'PROFESSIONAL_SERVICE' | 'TECHNICAL_SERVICE' | 'B2B_CONSULTING';
  title: string;
  skillsRequired: string[];
  jurisdiction: string;
  compensationAmount: number;
  currency: string;
  billingModel: 'FIXED_MILESTONE' | 'HOURLY' | 'MONTHLY_RETAINER';
  platformRoleDisclaimer: string;
  status: 'OPEN' | 'ASSIGNED' | 'MILESTONE_REVIEW' | 'COMPLETED';
  milestones: { id: string; title: string; amount: number; status: 'PENDING' | 'VERIFIED' }[];
  createdAt: string;
}

export interface NetworkAnalyticalInsight {
  id: string;
  domain: 'TRADE_FLOW' | 'COMMODITY_PRICE' | 'SUPPLIER_CAPACITY' | 'CORRIDOR_LOGISTICS' | 'CURRENCY_EXPOSURE';
  title: string;
  summary: string;
  factOrForecast: 'OBSERVED_FACT' | 'ECONOMETRIC_FORECAST' | 'SCENARIO_MODEL';
  dataSource: string;
  observationPeriod: string;
  modelVersion: string;
  assumptions: string[];
  confidencePct: number;
  limitations: string;
  updatedAt: string;
}

export interface GovernedAiAgentIdentity {
  id: string;
  agentCode: string;
  name: string;
  domain: string;
  maxAutonomyLevel: 1 | 2 | 3 | 4 | 5;
  allowedTools: string[];
  dataAccessBoundary: string;
  modelVersion: string;
  emergencyStopped: boolean;
  actionsExecutedCount: number;
}

export interface AiAgentActionLog {
  id: string;
  agentId: string;
  tenantId: string;
  requestedAction: string;
  autonomyLevel: 1 | 2 | 3 | 4 | 5;
  status: 'EXECUTED_OBSERVE_ASSIST' | 'PENDING_HUMAN_APPROVAL' | 'APPROVED_BY_HUMAN' | 'REJECTED' | 'BLOCKED_BOUNDARY';
  promptInjectionCheck: 'CLEAN' | 'BLOCKED';
  outputValidation: 'PASSED' | 'FLAGGED';
  approvedBy?: string;
  resultSummary: string;
  timestamp: string;
}

export interface TenantSubscriptionRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  audienceTier: 'INDIVIDUAL' | 'SME' | 'BUSINESS' | 'ENTERPRISE' | 'INSTITUTIONAL' | 'DEVELOPER';
  monthlyBaseFee: number;
  currency: string;
  entitlements: {
    maxUsers: number;
    maxApiCallsPerMonth: number;
    includedModules: string[];
  };
  apiCallsUsedCurrentCycle: number;
  apiOverageUnitFee: number;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  billingCycleStart: string;
  billingCycleEnd: string;
}

export interface TenantBillingInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  subscriptionId: string;
  pricingBasis: string;
  baseAmount: number;
  usageOverageAmount: number;
  taxRatePct: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'ISSUED' | 'PAID' | 'REFUNDED' | 'ADJUSTED';
  refundReason?: string;
  issuedAt: string;
}

export interface V11PerformanceBenchmark {
  id: string;
  scenario: string;
  concurrentOperations: number;
  durationMs: number;
  throughputOpsPerSec: number;
  errorCount: number;
  p95LatencyMs: number;
  measuredAt: string;
}

// ==========================================
// V12 GLOBAL ECONOMIC INTELLIGENCE, PREDICTIVE ANALYTICS & DECISION COORDINATION
// ==========================================

export type V12SourceClassification =
  | 'VERIFIED_PRIMARY_SOURCE'
  | 'VERIFIED_INSTITUTIONAL_SOURCE'
  | 'VERIFIED_MARKET_SOURCE'
  | 'AUTHORIZED_PARTNER_SOURCE'
  | 'VERIFIED_USER_OBSERVATION'
  | 'UNVERIFIED_USER_SUBMISSION'
  | 'THIRD_PARTY_ESTIMATE'
  | 'MODEL_GENERATED_ESTIMATE'
  | 'SIMULATED_DATA';

export type V12DataClassification =
  | 'PUBLIC'
  | 'RESTRICTED'
  | 'TENANT_PRIVATE'
  | 'INSTITUTION_PRIVATE'
  | 'CONFIDENTIAL'
  | 'SOVEREIGN_RESTRICTED';

export type V12ConfidenceClassification = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA';

export type V12ForecastHorizon = 'SHORT_TERM' | 'NEAR_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';

export type V12ForecastDomain =
  | 'COMMODITY_PRICES'
  | 'FOOD_PRICES'
  | 'BUSINESS_DEMAND'
  | 'PRODUCT_DEMAND'
  | 'SUPPLY_AVAILABILITY'
  | 'IMPORT_EXPORT_ACTIVITY'
  | 'FREIGHT_TRANSPORT_COSTS'
  | 'CURRENCY_TRENDS'
  | 'INDUSTRIAL_PRODUCTION'
  | 'INVENTORY_REQUIREMENTS'
  | 'PROCUREMENT_DEMAND'
  | 'EMPLOYMENT_DEMAND'
  | 'REGIONAL_ECONOMIC_ACTIVITY'
  | 'SUPPLY_CHAIN_DISRUPTION_RISK'
  | 'BUSINESS_CASH_FLOW_SCENARIOS';

export type V12ForecastMethod =
  | 'MOVING_AVERAGE'
  | 'EXPONENTIAL_SMOOTHING'
  | 'LINEAR_REGRESSION'
  | 'SEASONAL_DECOMPOSITION'
  | 'ANOMALY_ADJUSTED'
  | 'SCENARIO_MODELLING';

export type V12ForecastModelStatus =
  | 'DEVELOPMENT'
  | 'VALIDATION'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'RETIRED';

export type V12AnomalyClassification =
  | 'INFORMATIONAL_ANOMALY'
  | 'DATA_QUALITY_ANOMALY'
  | 'OPERATIONAL_ANOMALY'
  | 'FINANCIAL_REVIEW_REQUIRED'
  | 'SECURITY_REVIEW_REQUIRED'
  | 'POTENTIAL_FRAUD_SIGNAL';

export type V12WarningSeverity = 'NORMAL' | 'WATCH' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export type V12RecommendationStatus =
  | 'GENERATED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXECUTION_PENDING'
  | 'EXECUTED'
  | 'FAILED';

export type V12SpecialistAgentType =
  | 'GLOBAL_ECONOMIC_RESEARCH'
  | 'MARKET_INTELLIGENCE'
  | 'COMMODITY_INTELLIGENCE'
  | 'CURRENCY_INTELLIGENCE'
  | 'TRADE_INTELLIGENCE'
  | 'LOGISTICS_INTELLIGENCE'
  | 'INDUSTRIAL_INTELLIGENCE'
  | 'BUSINESS_INTELLIGENCE'
  | 'PROCUREMENT_INTELLIGENCE'
  | 'RISK_INTELLIGENCE'
  | 'EARLY_WARNING'
  | 'ECONOMIC_FORECASTING'
  | 'SCENARIO_SIMULATION'
  | 'DATA_QUALITY'
  | 'ECONOMIC_COORDINATION';

export interface V12BaseRecordMeta {
  tenantId: string;
  jurisdiction: string;
  sourceReference: string;
  verificationStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'UNVERIFIED' | 'REJECTED' | 'DISPUTED';
  accessClassification: V12DataClassification;
  provenance: string;
  retentionPolicy: string;
  createdAt: string;
  updatedAt: string;
}

// 1. intelligenceSources
export interface IntelligenceSource extends V12BaseRecordMeta {
  id: string;
  sourceName: string;
  sourceCategory:
    | 'PUBLIC_STATISTICS'
    | 'CENTRAL_BANK'
    | 'INTERNAL_NETWORK'
    | 'COMMODITY_EXCHANGE'
    | 'LOGISTICS_CORRIDOR'
    | 'CUSTOMS_TRADE'
    | 'WEATHER_CLIMATE'
    | 'PARTNER_FEED'
    | 'USER_SUBMISSION';
  sourceClassification: V12SourceClassification;
  endpointOrReference: string;
  accessMethod: 'INTERNAL_LEDGER' | 'AUTHORIZED_API' | 'CSV_IMPORT' | 'JSON_IMPORT' | 'WEBHOOK' | 'MANUAL_SUBMISSION' | 'SCHEDULED_PULL';
  connectionStatus: 'PRODUCTION_CONNECTED_AND_VERIFIED' | 'SANDBOX_CONNECTED' | 'LOCAL_ONLY' | 'REFERENCE_DIRECTORY' | 'NOT_CONFIGURED' | 'FAILED';
  authenticationRequired: boolean;
  licensingRestrictions: string;
  commercialRedistributionAllowed: boolean;
  updateFrequencyHours: number;
  lastSuccessfulRetrieval?: string;
  lastFailedRetrieval?: string;
  reliabilityScorePct: number;
  adminApprovalStatus: 'APPROVED' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'REVOKED';
  approvedBy?: string;
}

// 2. intelligenceSourceCredentials (secrets NEVER returned in API JSON responses)
export interface IntelligenceSourceCredential extends V12BaseRecordMeta {
  id: string;
  sourceId: string;
  authScheme: 'API_KEY' | 'OAUTH2_CLIENT' | 'MTLS_CERT' | 'HMAC_WEBHOOK' | 'NONE';
  keyHash: string;
  maskedPreview: string;
  expiresAt?: string;
  rotationStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
}

// 3. intelligenceSourceHealth
export interface IntelligenceSourceHealth extends V12BaseRecordMeta {
  id: string;
  sourceId: string;
  sourceName: string;
  status: 'HEALTHY' | 'STALE' | 'DEGRADED' | 'BROKEN' | 'EXPIRED_CREDENTIALS' | 'NOT_CONFIGURED';
  lastCheckedAt: string;
  stalenessHours: number;
  duplicateRatePct: number;
  formatDriftDetected: boolean;
  abnormalValueCount: number;
  missingUpdateCount: number;
  diagnosticNotes: string;
}

// 4. economicObservations
export interface EconomicObservation extends V12BaseRecordMeta {
  id: string;
  sourceId: string;
  sourceClassification: V12SourceClassification;
  indicatorId: string;
  indicatorCode: string;
  sector: string;
  commodityOrSubject: string;
  regionOrCorridor: string;
  observationPeriod: string; // e.g. "2026-10" or "2026-W45"
  observedAt: string;
  publishedAt?: string;
  numericValue: number;
  unit: string;
  normalizedValue: number;
  normalizedUnit: string;
  currency?: string;
  dataOwner: string;
  authorizationScope: string;
  qualityScore: number; // 0-100
  isStale: boolean;
  isDuplicateFlagged?: boolean;
  dedupeKey: string;
}

// 5. economicIndicators
export interface EconomicIndicator extends V12BaseRecordMeta {
  id: string;
  definitionId: string;
  code: string;
  name: string;
  category:
    | 'INFLATION'
    | 'COMMODITY_PRICES'
    | 'FOOD_PRICES'
    | 'EMPLOYMENT'
    | 'TRADE_VOLUME'
    | 'BUSINESS_FORMATION'
    | 'INDUSTRIAL_OUTPUT'
    | 'LOGISTICS_COSTS'
    | 'FREIGHT_AVAILABILITY'
    | 'CURRENCY_FX'
    | 'CORRIDOR_CONGESTION'
    | 'PROCUREMENT_DEMAND'
    | 'INVENTORY_LEVELS'
    | 'ENERGY_AVAILABILITY'
    | 'PAYMENT_DELAYS'
    | 'SUPPLY_DISRUPTIONS'
    | 'REGIONAL_ACTIVITY';
  sector: string;
  regionLabel: string;
  latestValue: number | null;
  previousValue: number | null;
  changePct: number | null;
  unit: string;
  currency?: string;
  availabilityStatus: 'AVAILABLE' | 'STALE' | 'UNAVAILABLE';
  unavailableReason?: string;
  factOrEstimate: 'OBSERVED_FACT' | 'USER_SUBMITTED' | 'THIRD_PARTY_ESTIMATE' | 'UNAVAILABLE';
  sourceClassification: V12SourceClassification;
  effectivePeriod: string;
  confidence: V12ConfidenceClassification;
  limitations: string;
  staleWarning: boolean;
}

// 6. economicIndicatorDefinitions
export interface EconomicIndicatorDefinition extends V12BaseRecordMeta {
  id: string;
  code: string;
  name: string;
  description: string;
  economicCategory: string;
  unitOfMeasurement: string;
  canonicalNormalizationUnit: string;
  updateFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  calculationMethodology: string;
  minimumObservationsForForecast: number;
  maxStalenessHours: number;
  limitations: string;
  definitionalDifferencesByJurisdiction?: Record<string, string>;
}

// 7. economicTimeSeries
export interface EconomicTimeSeries extends V12BaseRecordMeta {
  id: string;
  indicatorId: string;
  indicatorCode: string;
  unit: string;
  currency?: string;
  points: {
    period: string;
    observedAt: string;
    value: number;
    observationId: string;
    sourceClassification: V12SourceClassification;
    qualityScore: number;
  }[];
}

// 8. economicDataQualityReports
export interface EconomicDataQualityReport extends V12BaseRecordMeta {
  id: string;
  scope: string;
  totalObservationsChecked: number;
  verifiedCount: number;
  staleCount: number;
  duplicateRejectedCount: number;
  invalidRejectedCount: number;
  missingIndicatorCount: number;
  overallQualityScore: number;
  poisoningSignalsDetected: number;
  issues: { severity: 'LOW' | 'MEDIUM' | 'HIGH'; code: string; description: string; affectedId?: string }[];
  generatedAt: string;
}

// 9. economicForecasts (V12 collection stored cleanly as v12EconomicForecasts)
export interface V12EconomicForecast extends V12BaseRecordMeta {
  id: string;
  indicatorId: string;
  indicatorName: string;
  domain: V12ForecastDomain;
  sector: string;
  horizon: V12ForecastHorizon;
  horizonDays: number;
  generatedAt: string;
  expiresAt: string;
  sourceObservationIds: string[];
  observationCountUsed: number;
  inputHash: string;
  modelId: string;
  modelVersion: string;
  methodUsed: V12ForecastMethod;
  methodology: string;
  assumptions: string[];
  baselineValue: number;
  expectedValue: number;
  unit: string;
  currency?: string;
  predictionInterval: {
    lower: number;
    upper: number;
    coverageLevelPct: number;
  };
  confidenceClassification: V12ConfidenceClassification;
  validationMetrics: {
    mae: number | null;
    rmse: number | null;
    mapePct: number | null;
    directionalAccuracyPct: number | null;
  };
  knownLimitations: string[];
  modelStatus: V12ForecastModelStatus;
  outputValidated: boolean;
  suspendedDueToDrift?: boolean;
}

// 10. forecastModels
export interface ForecastModel extends V12BaseRecordMeta {
  id: string;
  modelName: string;
  version: string;
  method: V12ForecastMethod;
  supportedDomains: V12ForecastDomain[];
  trainingDataReference: string;
  validationDataReference: string;
  evaluationPeriod: string;
  baselineModelId?: string;
  errorMetrics: {
    mae: number;
    rmse: number;
    mapePct: number;
    predictionIntervalCoveragePct: number;
    directionalAccuracyPct: number;
  };
  knownWeaknesses: string[];
  approvalStatus: 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  approvedBy?: string;
  deploymentStatus: V12ForecastModelStatus;
  isBaselineModel: boolean;
  driftDetected: boolean;
  requiresReviewBeforeRestore: boolean;
}

// 11. forecastEvaluations
export interface ForecastEvaluation extends V12BaseRecordMeta {
  id: string;
  forecastId: string;
  modelId: string;
  modelVersion: string;
  indicatorId: string;
  forecastValue: number;
  actualObservedValue: number;
  actualObservationId: string;
  absoluteError: number;
  squaredError: number;
  percentageErrorPct: number;
  withinPredictionInterval: boolean;
  directionCorrect: boolean;
  evaluatedAt: string;
  notes: string;
}

// 12. forecastAccuracyHistory
export interface ForecastAccuracyHistoryRecord extends V12BaseRecordMeta {
  id: string;
  modelId: string;
  modelVersion: string;
  period: string;
  sampleCount: number;
  mae: number;
  rmse: number;
  mapePct: number;
  intervalCoveragePct: number;
  directionalAccuracyPct: number;
  comparedAgainstBaselineDeltaPct: number;
  recordedAt: string;
}

// 13. economicAnomalies
export interface EconomicAnomaly extends V12BaseRecordMeta {
  id: string;
  classification: V12AnomalyClassification;
  title: string;
  detectionReason: string;
  affectedRecordType: 'OBSERVATION' | 'LISTING' | 'PROCUREMENT' | 'PAYMENT' | 'SHIPMENT' | 'SOURCE' | 'CURRENCY';
  affectedRecordId: string;
  affectedParticipantId?: string;
  historicalBaselineValue: number;
  observedValue: number;
  deviationZScore: number;
  detectionMethod: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: V12ConfidenceClassification;
  recommendedInvestigation: string;
  humanInvestigationRequired: boolean; // Always true before adverse action on fraud signals
  reviewStatus: 'OPEN' | 'UNDER_INVESTIGATION' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED';
  resolutionHistory: { timestamp: string; actor: string; status: string; notes: string }[];
}

// 14. economicEarlyWarnings
export interface V12EconomicEarlyWarning extends V12BaseRecordMeta {
  id: string;
  eventCode: string;
  title: string;
  riskDomain:
    | 'FOOD_SUPPLY'
    | 'ENERGY'
    | 'AGRICULTURE'
    | 'MANUFACTURING'
    | 'TRADE'
    | 'CURRENCY_LIQUIDITY'
    | 'LOGISTICS'
    | 'EMPLOYMENT'
    | 'BUSINESS_CONTINUITY'
    | 'INFRASTRUCTURE'
    | 'CLIMATE'
    | 'NATURAL_DISASTER'
    | 'PUBLIC_HEALTH';
  severity: V12WarningSeverity;
  affectedSectors: string[];
  evidenceSummary: string;
  sourceReferences: string[];
  detectedAt: string;
  expectedImpact: string;
  potentialAffectedParticipants: string[];
  forecastHorizon: string;
  recommendedPreventiveAction: string;
  escalationRequirements: string;
  isPublicAlert: boolean;
  authorizedPublicPublisher?: string;
  officialGovernmentDisclaimer: string;
  reviewStatus: 'ACTIVE' | 'UNDER_REVIEW' | 'ESCALATED' | 'MITIGATED' | 'CLOSED';
  reviewNotes?: string;
  closedAt?: string;
}

// 15. economicOpportunities (V12 collection stored cleanly as v12EconomicOpportunities)
export interface V12EconomicOpportunity extends V12BaseRecordMeta {
  id: string;
  opportunityType:
    | 'UNDERSERVED_MARKET'
    | 'SUPPLIER_SHORTAGE'
    | 'PROCUREMENT_DEMAND'
    | 'EXPORT_OPPORTUNITY'
    | 'IMPORT_SUBSTITUTION'
    | 'INDUSTRIAL_CAPACITY'
    | 'FREIGHT_CAPACITY'
    | 'WORKFORCE_DEMAND'
    | 'BUSINESS_PARTNERSHIP'
    | 'REGIONAL_TRADE'
    | 'MARKET_EXPANSION'
    | 'INVESTMENT_INFORMATION';
  title: string;
  description: string;
  sector: string;
  demandEvidence: string;
  supplyEvidence: string;
  estimatedMarketSizeAmount: number | null;
  estimatedMarketSizeCurrency: string;
  competitionIndicators: string;
  potentialParticipants: { id: string; name: string; role: string }[];
  linkedV11RecordIds: string[];
  confidence: V12ConfidenceClassification;
  limitations: string;
  suggestedNextSteps: string[];
  disclaimer: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
}

// 16. economicScenarios
export interface EconomicScenario extends V12BaseRecordMeta {
  id: string;
  scenarioName: string;
  scenarioType:
    | 'FUEL_PRICE_INCREASE'
    | 'CURRENCY_DEPRECIATION'
    | 'CURRENCY_APPRECIATION'
    | 'TRANSPORT_COST_INCREASE'
    | 'AGRICULTURAL_SUPPLY_SHOCK'
    | 'INDUSTRIAL_DISRUPTION'
    | 'IMPORT_RESTRICTIONS'
    | 'EXPORT_DEMAND_INCREASE'
    | 'INTEREST_RATE_CHANGE'
    | 'TAX_POLICY_CHANGE'
    | 'REGIONAL_BORDER_DISRUPTION'
    | 'NATURAL_DISASTER'
    | 'COMMODITY_SHORTAGE'
    | 'CONSUMER_DEMAND_SURGE'
    | 'SUPPLY_CHAIN_RECOVERY'
    | 'MULTI_COUNTRY_STRESS';
  description: string;
  label: 'SIMULATED_SCENARIO';
  startingConditions: Record<string, number | string>;
  assumptions: string[];
  inputVariables: {
    variable: string;
    baselineValue: number;
    shockPct: number;
    unit: string;
  }[];
  affectedJurisdictions: string[];
  affectedSectors: string[];
  timeHorizon: string;
  modelUsed: string;
  createdBy: string;
  mutatesRealRecords: false;
}

// 17. scenarioSimulationResults
export interface ScenarioSimulationResult extends V12BaseRecordMeta {
  id: string;
  scenarioId: string;
  label: 'SIMULATED_SCENARIO';
  baselineComparison: {
    metric: string;
    baselineValue: number;
    simulatedValue: number;
    deltaPct: number;
    unit: string;
  }[];
  alternativeComparisons: {
    caseName: string;
    shockPct: number;
    projectedImpactPct: number;
    projectedValue: number;
  }[];
  uncertaintyRangePct: [number, number];
  affectedCorridors?: string[];
  alternativeRoutesOrSuppliers?: string[];
  estimatedRecoveryPeriodDays?: number | null;
  dataGaps: string[];
  limitations: string[];
  reproducibleSeedHash: string;
  generatedAt: string;
}

// 18. businessImpactSimulations
export interface BusinessImpactSimulation extends V12BaseRecordMeta {
  id: string;
  businessName: string;
  label: 'SIMULATED_SCENARIO';
  inputAssumptions: {
    supplierCostDeltaPct: number;
    productDemandDeltaPct: number;
    fxExposureDeltaPct: number;
    inventoryCostDeltaPct: number;
    transportExpenseDeltaPct: number;
    payrollDeltaPct: number;
    currency: string;
  };
  baselineMetrics: {
    monthlyRevenue: number;
    monthlyOperatingCost: number;
    monthlyNetMargin: number;
    sourceRecordCount: number;
  };
  projectedScenarios: {
    bestCase: { projectedRevenue: number; projectedCost: number; netMargin: number; cashPressure: 'LOW' | 'MODERATE' | 'HIGH' };
    baseCase: { projectedRevenue: number; projectedCost: number; netMargin: number; cashPressure: 'LOW' | 'MODERATE' | 'HIGH' };
    stressCase: { projectedRevenue: number; projectedCost: number; netMargin: number; cashPressure: 'LOW' | 'MODERATE' | 'HIGH' };
  };
  uncertaintyNotes: string;
  recommendedManagementActions: string[];
  disclaimer: string;
  createdBy: string;
}

// 19. economicRecommendations
export interface EconomicRecommendation extends V12BaseRecordMeta {
  id: string;
  targetParticipantId: string;
  targetParticipantName: string;
  recommendationType:
    | 'SUPPLIER_SHORTAGE_ALERT'
    | 'ALTERNATIVE_SUPPLIER'
    | 'ALTERNATIVE_FREIGHT'
    | 'PROCUREMENT_OPPORTUNITY'
    | 'DEMAND_SHIFT_ALERT'
    | 'INVENTORY_REVIEW'
    | 'CORRIDOR_DISRUPTION_CONTINGENCY'
    | 'DATA_QUALITY_ALERT'
    | 'OPERATIONAL_CONTINGENCY';
  sourceIntelligenceIds: string[];
  explanation: string;
  expectedBenefit: string;
  potentialRisk: string;
  requiredPermissions: string[];
  recommendedAction: string;
  confidence: V12ConfidenceClassification;
  expiresAt: string;
  requiresHumanApproval: true;
  approvalStatus: V12RecommendationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  autoExecutionProhibited: true;
}

// 20. intelligenceAgentRuns
export interface IntelligenceAgentRun extends V12BaseRecordMeta {
  id: string;
  agentId: string;
  agentType: V12SpecialistAgentType;
  requestedAction: string;
  autonomyLevel: 1 | 2 | 3 | 4 | 5;
  promptSummary: string;
  citedSourceIds: string[];
  citedRecordsCount: number;
  distinguishedFactsVsForecasts: boolean;
  promptInjectionStatus: 'CLEAN' | 'BLOCKED_INJECTION_ATTEMPT';
  outputValidationStatus: 'PASSED' | 'REFUSED_INSUFFICIENT_DATA' | 'BLOCKED_POLICY_VIOLATION';
  humanEscalationRequired: boolean;
  dualAuthorizationRequired: boolean;
  approvers: string[];
  executionStatus: 'COMPLETED' | 'PENDING_HUMAN_APPROVAL' | 'PENDING_DUAL_AUTHORIZATION' | 'BLOCKED_BOUNDARY' | 'CIRCUIT_BREAKER_HALTED' | 'DEGRADED_FALLBACK' | 'FAILED';
  responseText: string;
  limitationsDisclosed: string[];
  durationMs: number;
  modelDependency: string;
}

// 21. intelligenceAgentPolicies
export interface IntelligenceAgentPolicy extends V12BaseRecordMeta {
  id: string;
  agentCode: string;
  agentName: string;
  agentType: V12SpecialistAgentType;
  purpose: string;
  authorizedDataScope: V12DataClassification[];
  inputSchemaDescription: string;
  outputSchemaDescription: string;
  modelDependency: string;
  maxAutonomyLevelAllowed: 1 | 2 | 3 | 4; // Level 5 never auto-authorized by AI
  executionRateLimitPerHour: number;
  humanEscalationRule: string;
  emergencyCircuitBreakerActive: boolean;
  totalRunsCount: number;
}

// 22. modelDriftEvents
export interface ModelDriftEvent extends V12BaseRecordMeta {
  id: string;
  modelId: string;
  modelVersion: string;
  driftType:
    | 'INPUT_DISTRIBUTION_SHIFT'
    | 'ACCURACY_DETERIORATION'
    | 'MISSING_OBSERVATIONS'
    | 'SOURCE_FAILURE'
    | 'OUTPUT_ANOMALY'
    | 'DATA_POISONING_INDICATOR';
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  metricBefore: number;
  metricAfter: number;
  affectedForecastIds: string[];
  fallbackModelId?: string;
  modelMarkedDegraded: boolean;
  adminNotified: boolean;
  restorationReviewStatus: 'PENDING_REVIEW' | 'APPROVED_RESTORE' | 'RETIRED';
  reviewedBy?: string;
  detectedAt: string;
}

// 23. intelligenceAuditEvents
export interface IntelligenceAuditEvent {
  id: string;
  timestamp: string;
  tenantId: string;
  jurisdiction: string;
  actorId: string;
  actorRole: string;
  actionType:
    | 'SOURCE_REGISTERED'
    | 'SOURCE_VERIFIED'
    | 'DATA_INGESTED'
    | 'DATA_CORRECTION'
    | 'FORECAST_GENERATED'
    | 'FORECAST_EVALUATED'
    | 'MODEL_PROMOTED'
    | 'MODEL_SUSPENDED'
    | 'DRIFT_DETECTED'
    | 'ANOMALY_DETECTED'
    | 'ANOMALY_REVIEWED'
    | 'EARLY_WARNING_ISSUED'
    | 'EARLY_WARNING_CLOSED'
    | 'SCENARIO_SIMULATED'
    | 'RECOMMENDATION_DECIDED'
    | 'AGENT_EXECUTED'
    | 'PUBLICATION_ISSUED'
    | 'CIRCUIT_BREAKER_TOGGLED'
    | 'MIGRATION_EVENT'
    | 'CROSS_BORDER_DATA_TRANSFER'
    | 'INSTITUTIONAL_CONNECTOR_TEST'
    | 'CRYPTO_KEY_ROTATED'
    | 'FORECAST_WALK_FORWARD_VALIDATED'
    | 'DISASTER_RECOVERY_DRILL'
    | 'DB_CUTOVER_APPROVED'
    | 'DB_CUTOVER_BLOCKED'
    | 'BROKER_ADAPTER_CONFIGURED'
    | 'V14_DR_EXERCISE'
    | 'V14_READINESS_ASSESSMENT'
    | 'GOVERNANCE_GATE_UPDATED'
    | 'DUAL_AUTH_POLICY_DECISION'
    | 'V18_NAVIGATION_ACCESS'
    | 'V18_ADMIN_ACTION'
    | 'V19_EXPORT_VERIFIED'
    | 'V20_TRADE_TRANSITION'
    | 'V20_PILOT_LIFECYCLE'
    | 'V21_PILOT_LIFECYCLE'
    | 'V21_ONBOARDING_EVENT'
    | 'V21_FIELD_TASK_EVENT'
    | 'V21_EXCEPTION_ACTION'
    | 'V21_SUPPORT_ACTION'
    | 'V21_POSTGRES_MIGRATION'
    | 'PROMPT_INJECTION_BLOCKED'
    | 'REPORT_EXPORTED';
  entityType: string;
  entityId: string;
  details: string;
  inputHash?: string;
  tamperHash: string;
}

// 24. intelligenceSubscriptions (proposed configurable tiers - never fabricated revenue)
export interface IntelligenceSubscriptionProduct extends V12BaseRecordMeta {
  id: string;
  tierCode:
    | 'INTELLIGENCE_STARTER'
    | 'INTELLIGENCE_BUSINESS'
    | 'INTELLIGENCE_ENTERPRISE'
    | 'INTELLIGENCE_INSTITUTIONAL'
    | 'INTELLIGENCE_DEVELOPER';
  tierName: string;
  isProposedTier: true;
  targetAudience: string;
  includedCapabilities: string[];
  apiCallsLimitPerMonth: number;
  customForecastQuotaPerMonth: number;
  configurablePricingByJurisdiction: Record<string, { currency: string; monthlyFee: number; annualFee: number }>;
  licensingAndUsageRestrictions: string;
  permitsConfidentialResale: false;
  status: 'PROPOSED_CATALOG_ITEM' | 'ACTIVE_OFFERING';
}

// 25. intelligenceReports
export interface IntelligenceReport extends V12BaseRecordMeta {
  id: string;
  reportTitle: string;
  reportType: 'REGIONAL_BRIEF' | 'COMMODITY_OUTLOOK' | 'CORRIDOR_RISK' | 'DATA_QUALITY' | 'STRESS_TEST' | 'CUSTOM';
  sectors: string[];
  timeRange: string;
  summary: string;
  keyFindings: string[];
  sourceReferences: string[];
  distinguishesFactsVsForecasts: boolean;
  generatedBy: string;
  exportFormats: ('JSON' | 'CSV')[];
}

// 26. intelligenceReviewQueue
export interface IntelligenceReviewQueueItem extends V12BaseRecordMeta {
  id: string;
  itemType: 'ANOMALY' | 'CRITICAL_WARNING' | 'FORECAST_MODEL_PROMOTION' | 'DATA_SOURCE_APPROVAL' | 'RECOMMENDATION' | 'AI_LEVEL5_ESCALATION' | 'MODEL_RESTORATION';
  targetId: string;
  title: string;
  riskReason: string;
  requestedBy: string;
  requiredRole: 'PLATFORM_ADMIN' | 'COMPLIANCE_AUDITOR' | 'OPERATIONS_MANAGER';
  dualAuthorizationRequired: boolean;
  approvalsReceived: { actorId: string; role: string; timestamp: string }[];
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  decisionNotes?: string;
}

// 27. intelligencePublicationRecords
export interface IntelligencePublicationRecord extends V12BaseRecordMeta {
  id: string;
  artifactType: 'INDICATOR_RELEASE' | 'FORECAST_BRIEF' | 'EARLY_WARNING' | 'REPORT';
  artifactId: string;
  title: string;
  audienceScope: V12DataClassification;
  publishedBy: string;
  authorizedBy: string;
  licensingNotice: string;
  publishedAt: string;
  retracted: boolean;
}

// Asynchronous Queue Job & Migration Manifest helpers
export interface V12BackgroundJob {
  id: string;
  jobType: 'FORECAST_GENERATION' | 'SOURCE_REFRESH' | 'BULK_OBSERVATION_IMPORT' | 'ANOMALY_SCAN' | 'DRIFT_EVALUATION';
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  tenantId: string;
  idempotencyKey: string;
  payload: Record<string, any>;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'DEAD_LETTER';
  attempts: number;
  maxAttempts: number;
  resultId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface V12MigrationManifest {
  fromVersion: number;
  toVersion: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ROLLED_BACK' | 'RECOVERED';
  backupFile: string;
  backupChecksumSha256: string;
  preMigrationCounts: Record<string, number>;
  preMigrationFinancialTotals: Record<string, number>;
  postMigrationCounts: Record<string, number>;
  startedAt: string;
  completedAt?: string;
}

// ==========================================
// V13 DISTRIBUTED INFRASTRUCTURE, SOVEREIGN FEDERATION & PRODUCTION SCALE TYPES
// ==========================================

export type V13TruthfulStatus =
  | 'CONFIGURED'
  | 'LOCAL_ONLY'
  | 'SIMULATED'
  | 'SANDBOX_CONNECTED'
  | 'PRODUCTION_CONNECTED_AND_VERIFIED'
  | 'DEGRADED'
  | 'FAILED'
  | 'NOT_CONFIGURED';

// 1. distributedDatabaseNodes
export interface DistributedDatabaseNode {
  id: string;
  nodeName: string;
  engine: 'POSTGRESQL_16' | 'TIMESCALEDB' | 'WAL_JSON_LOCAL';
  role: 'PRIMARY' | 'READ_REPLICA' | 'SHADOW_VALIDATOR' | 'LOCAL_FALLBACK';
  jurisdiction: string;
  regionCode: string;
  connectionStatus: V13TruthfulStatus;
  hostRedacted: string;
  poolSizeMax: number;
  activeConnections: number;
  timescaleExtensionDetected: boolean;
  workloadDomains: string[];
  lastHealthCheckAt: string;
  latencyMs: number | null;
}

// 2. databaseReplicationStates
export interface DatabaseReplicationState {
  id: string;
  primaryNodeId: string;
  replicaNodeId: string;
  replicationMode: 'SYNCHRONOUS_QUORUM' | 'ASYNCHRONOUS_STREAMING' | 'LOGICAL_SHADOW' | 'NOT_ACTIVE';
  status: V13TruthfulStatus;
  lagBytes: number | null;
  lagMs: number | null;
  walPosition: string;
  lastSyncedAt: string | null;
  failoverTested: boolean;
}

// 3. databaseMigrationManifests
export interface DatabaseMigrationManifest {
  id: string;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  targetEngine: 'WAL_JSON_TO_POSTGRES_V13' | 'POSTGRES_DDL_MIGRATION';
  stage:
    | 'READINESS_CHECK'
    | 'BACKUP_CREATED'
    | 'SCHEMA_MIGRATED'
    | 'SHADOW_VALIDATED'
    | 'COMPLETED'
    | 'RECOVERED'
    | 'ROLLED_BACK';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'RECOVERED' | 'ROLLED_BACK' | 'FAILED';
  backupFile: string;
  backupChecksumSha256: string;
  preMigrationCounts: Record<string, number>;
  postMigrationCounts: Record<string, number>;
  preFinancialTotals: Record<string, number>;
  postFinancialTotals: Record<string, number>;
  shadowValidationPassed: boolean;
  postgresLiveApplied: boolean;
  startedAt: string;
  completedAt?: string;
}

// 4. distributedEventSchemas
export interface DistributedEventSchema {
  id: string;
  eventType: string;
  schemaVersion: string;
  category:
    | 'IDENTITY'
    | 'MARKETPLACE'
    | 'PROCUREMENT'
    | 'FINANCIAL'
    | 'LOGISTICS'
    | 'INTELLIGENCE'
    | 'INSTITUTIONAL'
    | 'AUDIT';
  requiredFields: string[];
  containsRestrictedPayloadRefsOnly: boolean;
  retentionDays: number;
  backwardCompatibleWith: string[];
  registeredAt: string;
}

// 5. distributedEventOutbox
export interface DistributedEventOutbox {
  id: string;
  eventType: string;
  schemaVersion: string;
  producer: string;
  timestamp: string;
  jurisdiction: string;
  tenantId: string;
  correlationId: string;
  idempotencyKey: string;
  authorizationContext: { actorId: string; role: string; clearance: string };
  payloadReference: string;
  payloadSummary: Record<string, any>;
  integrityHash: string;
  brokerAdapter: 'LOCAL_OUTBOX_LOG' | 'KAFKA_ADAPTER' | 'NATS_ADAPTER';
  deliveryStatus: 'PENDING' | 'PUBLISHED' | 'ACKNOWLEDGED' | 'FAILED' | 'DEAD_LETTER';
  sequenceNumber: number;
  retryCount: number;
  maxRetries: number;
}

// 6. distributedEventInbox
export interface DistributedEventInbox {
  id: string;
  outboxEventId: string;
  consumerGroupId: string;
  idempotencyKey: string;
  receivedAt: string;
  processedAt?: string;
  status: 'PROCESSED' | 'DUPLICATE_SUPPRESSED' | 'FAILED';
  financialSettlementVerifiedByProvider: boolean;
}

// 7. distributedEventConsumers
export interface DistributedEventConsumer {
  id: string;
  consumerGroup: string;
  subscribedEventTypes: string[];
  tenantScope: string;
  jurisdictionScope: string;
  deliverySemantics: 'AT_LEAST_ONCE_IDEMPOTENT';
  status: 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'RECOVERING';
  ackCount: number;
  duplicateSuppressedCount: number;
  lagEvents: number;
  lastHeartbeatAt: string;
}

// 8. distributedDeadLetterEvents
export interface DistributedDeadLetterEvent {
  id: string;
  outboxEventId: string;
  eventType: string;
  tenantId: string;
  jurisdiction: string;
  failureReason: string;
  poisonPayloadDetected: boolean;
  attempts: number;
  quarantinedAt: string;
  replayedAt?: string;
  status: 'QUARANTINED' | 'REPLAYED' | 'DISCARDED';
}

// 9. sovereignJurisdictions
export interface SovereignJurisdiction {
  id: string;
  code: string;
  name: string;
  regionalBloc: 'EAC' | 'AFCFTA' | 'GLOBAL';
  residencyRequirement: 'STRICT_LOCAL_RESIDENCY' | 'REGIONAL_FEDERATED_OK';
  defaultCrossBorderPolicy: 'RESTRICTED_PENDING_REVIEW' | 'AGGREGATES_ONLY' | 'AUTHORIZED_CORRIDOR';
  approvedInstitutionalConnectors: string[];
  keyManagementMode: 'LOCAL_KMS_DEV_ISOLATED' | 'SOVEREIGN_HSM_TARGET';
  localAdministrativeAuthority: string;
  auditRetentionDays: number;
  status: 'ACTIVE' | 'CONFIGURABLE';
  configuredAt: string;
}

// 10. sovereignDataPolicies
export interface SovereignDataPolicy {
  id: string;
  jurisdictionCode: string;
  dataCategory: 'FINANCIAL_LEDGER' | 'PERSONAL_IDENTITY' | 'MARKET_OBSERVATIONS' | 'TRADE_CORRIDOR' | 'MODEL_WEIGHTS';
  allowLocalStorage: boolean;
  allowParticipantShare: boolean;
  allowAggregatedIntelligence: boolean;
  allowCrossBorderTransfer: boolean;
  allowForecastTraining: boolean;
  requiresExplicitOwnerConsent: boolean;
  defaultOnUnknownLaw: 'RESTRICTED_PENDING_REVIEW';
  updatedAt: string;
}

// 11. sovereignDataEnclaves
export interface SovereignDataEnclave {
  id: string;
  jurisdictionCode: string;
  enclaveName: string;
  encryptionAlgorithm: 'AES-256-GCM';
  keyId: string;
  keyFingerprintSha256: string;
  tenantIdsAllowed: string[];
  isolationMode: 'STRICT_JURISDICTION_ENCLAVE';
  auditCount: number;
  createdAt: string;
}

// 12. crossBorderDataTransfers
export interface CrossBorderDataTransfer {
  id: string;
  originJurisdiction: string;
  destinationJurisdiction: string;
  tenantId: string;
  dataClassification: 'PUBLIC' | 'RESTRICTED' | 'TENANT_PRIVATE' | 'INSTITUTION_PRIVATE' | 'CONFIDENTIAL';
  dataOwnerId: string;
  dataOwnerConsentGranted: boolean;
  sendingJurisdictionAuthorized: boolean;
  receivingJurisdictionAuthorized: boolean;
  purpose: string;
  minimizedFields: string[];
  encryptedDigestSha256: string;
  receivingParty: string;
  retentionDays: number;
  expiresAt: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'REJECTED' | 'REVOKED' | 'EXPIRED' | 'RECOVERED';
  rejectionReason?: string;
  transferredAt: string;
}

// 13. institutionalConnectorRegistry
export interface InstitutionalConnectorRegistry {
  id: string;
  institutionName: string;
  institutionType: 'CENTRAL_BANK' | 'STATISTICAL_AGENCY' | 'TAX_AUTHORITY' | 'COMMERCIAL_BANK' | 'CUSTOMS' | 'PAYMENT_CLEARING';
  jurisdiction: string;
  protocol: 'REST_MTLS' | 'ISO_20022_MTLS' | 'OAUTH2_OIDC' | 'WEBHOOK_HMAC';
  targetEndpointTemplate: string;
  integrationOwner: string;
  sandboxStatus: V13TruthfulStatus;
  productionStatus: V13TruthfulStatus;
  requiresSignedDataSharingAgreement: boolean;
  agreementSigned: boolean;
  lastSuccessfulTestAt: string | null;
  lastFailureReason: string | null;
}

// 14. institutionalConnectorCredentials (secrets never emitted in API responses)
export interface InstitutionalConnectorCredential {
  id: string;
  connectorId: string;
  authScheme: 'MTLS_X509' | 'OAUTH2_CLIENT_CREDENTIALS' | 'HMAC_WEBHOOK_SECRET';
  secretHashSha256: string;
  credentialState: 'UNPROVISIONED' | 'DEV_SANDBOX_ONLY' | 'ROTATION_REQUIRED' | 'REVOKED';
  redactedPreview: string;
  rotatedAt: string;
  expiresAt: string;
}

// 15. institutionalCertificates
export interface InstitutionalCertificate {
  id: string;
  connectorId: string;
  jurisdiction: string;
  commonName: string;
  issuer: string;
  fingerprintSha256: string;
  validFrom: string;
  validTo: string;
  mtlsRequired: boolean;
  status: 'VALID_DEV_TEST' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
  revocationReason?: string;
}

// 16. institutionalConnectionHealth
export interface InstitutionalConnectionHealth {
  id: string;
  connectorId: string;
  status: V13TruthfulStatus;
  latencyMs: number | null;
  lastCheckedAt: string;
  consecutiveFailures: number;
  diagnosticNote: string;
}

// 17. cryptographicKeyRegistry
export interface CryptographicKeyRegistry {
  id: string;
  keyAlias: string;
  algorithm: 'ECDSA_P256_SHA256';
  environmentScope: 'DEVELOPMENT_ISOLATED' | 'PRODUCTION_HSM_REQUIRED';
  hsmModuleId: string;
  jurisdiction: string;
  publicKeyPem: string;
  privateKeyDevOnlyRef?: string; // Never exposed via REST routes
  version: number;
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED' | 'COMPROMISED';
  createdAt: string;
  rotatedAt?: string;
}

// 18. hardwareSecurityModules
export interface HardwareSecurityModule {
  id: string;
  providerName: string;
  mode: 'DEV_SOFTWARE_ISOLATED_ADAPTER' | 'PKCS11_CLOUD_HSM_ADAPTER';
  environmentScope: 'DEVELOPMENT' | 'PRODUCTION';
  status: V13TruthfulStatus;
  allowsFallbackFromProdToDev: false;
  fipsLevelNote: string;
  lastHeartbeatAt: string;
}

// 19. cryptographicApprovalRequests
export interface CryptographicApprovalRequest {
  id: string;
  tenantId: string;
  jurisdiction: string;
  actionType: string;
  operationPayload: Record<string, any>;
  canonicalPayloadHash: string;
  requestedBy: string;
  requiredSignatures: number;
  expiresAt: string;
  status: 'PENDING_DUAL_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'TAMPER_INVALIDATED';
  createdAt: string;
}

// 20. cryptographicApprovalSignatures
export interface CryptographicApprovalSignature {
  id: string;
  approvalRequestId: string;
  signerUserId: string;
  signerRole: string;
  signerSessionTokenHash: string;
  keyId: string;
  keyVersion: number;
  signedPayloadHash: string;
  signatureBase64: string;
  verified: boolean;
  signedAt: string;
}

// 21. signedAuditCheckpoints
export interface SignedAuditCheckpoint {
  id: string;
  sequenceRangeStart: number;
  sequenceRangeEnd: number;
  merkleOrChainRootHash: string;
  previousCheckpointHash: string;
  signingKeyId: string;
  signatureBase64: string;
  integrityVerified: boolean;
  createdAt: string;
  tamperLimitationNote: string;
}

// 22. forecastingWorkers
export interface ForecastingWorker {
  id: string;
  workerName: string;
  jurisdictionScope: string;
  supportedMethods: string[];
  hardwareTier: 'CPU_STATISTICAL_POOL' | 'GPU_OPTIONAL_POOL';
  maxConcurrentJobs: number;
  activeJobs: number;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastHeartbeatAt: string;
}

// 23. forecastingJobQueue
export interface ForecastingJobQueueItem {
  id: string;
  tenantId: string;
  indicatorId: string;
  method: 'SARIMA_SEASONAL' | 'SEASONAL_REGRESSION' | 'MULTIVARIATE_RIDGE' | 'ENSEMBLE_BLEND' | 'HOLT_WINTERS' | 'MOVING_AVERAGE';
  horizon: 'SHORT_TERM' | 'NEAR_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  assignedWorkerId: string | null;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED_RETRYING' | 'DEAD_LETTER';
  attempts: number;
  maxAttempts: number;
  resultForecastId?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// 24. forecastingModelExperiments
export interface ForecastingModelExperiment {
  id: string;
  modelName: string;
  method: 'SARIMA_SEASONAL' | 'SEASONAL_REGRESSION' | 'MULTIVARIATE_RIDGE' | 'ENSEMBLE_BLEND';
  indicatorId: string;
  lifecycleStage: 'DEVELOPMENT' | 'VALIDATION' | 'APPROVED' | 'ACTIVE' | 'ROLLED_BACK';
  trainingDataPeriodCount: number;
  validationWindowType: 'WALK_FORWARD_EXPANDING' | 'WALK_FORWARD_ROLLING';
  outOfSampleMapePct: number;
  baselineMapePct: number;
  outperformsBaseline: boolean;
  rollbackModelId: string;
  limitations: string[];
  promotedBy?: string;
  createdAt: string;
}

// 25. forecastingValidationRuns
export interface ForecastingValidationRun {
  id: string;
  experimentId: string;
  indicatorId: string;
  method: string;
  windowType: 'WALK_FORWARD_EXPANDING' | 'WALK_FORWARD_ROLLING';
  foldsEvaluated: number;
  strictChronologicalNoLeakage: boolean;
  walkForwardMapePct: number;
  walkForwardRmse: number;
  baselineMapePct: number;
  beatsBaseline: boolean;
  foldDetails: { foldIndex: number; trainEndIndex: number; testIndex: number; predicted: number; actual: number; absErrorPct: number }[];
  executedAt: string;
}

// 26. forecastingHyperparameters
export interface ForecastingHyperparameterSet {
  id: string;
  experimentId: string;
  method: string;
  parameters: Record<string, number>;
  validationMapePct: number;
  selectedBest: boolean;
  evaluatedAt: string;
}

// 27. distributedAIWorkers
export interface DistributedAIWorker {
  id: string;
  workerName: string;
  jurisdiction: string;
  inferenceMode: 'LOCAL_SOVEREIGN_RULES' | 'APPROVED_REGIONAL_MODEL' | 'PRIVATE_INSTITUTION_MODEL';
  modelId: string;
  maxRequestsPerMin: number;
  timeoutMs: number;
  status: 'ONLINE' | 'SUSPENDED' | 'OFFLINE';
  lastHealthAt: string;
}

// 28. distributedAIJobRuns
export interface DistributedAIJobRun {
  id: string;
  workerId: string;
  tenantId: string;
  jurisdiction: string;
  promptSummary: string;
  sovereignPolicyEnforced: boolean;
  promptInjectionBlocked: boolean;
  fallbackUsed: boolean;
  outputValidated: boolean;
  status: 'COMPLETED' | 'BLOCKED' | 'FALLBACK_COMPLETED' | 'FAILED';
  latencyMs: number;
  executedAt: string;
}

// 29. regionalServiceHealth
export interface RegionalServiceHealth {
  id: string;
  regionCode: string;
  jurisdiction: string;
  displayName: string;
  topologyRole: 'PRIMARY_LOCAL_NODE' | 'REGIONAL_TARGET_CONFIG';
  status: V13TruthfulStatus;
  databaseNodeId: string;
  eventBrokerMode: string;
  rpoTargetMinutes: number;
  rtoTargetMinutes: number;
  activeReadReplicas: number;
  lastHeartbeatAt: string;
}

// 30. disasterRecoveryEvents
export interface DisasterRecoveryEvent {
  id: string;
  scenarioType:
    | 'DATABASE_OUTAGE'
    | 'REPLICA_FAILOVER'
    | 'BROKER_OUTAGE'
    | 'REGION_PARTITION'
    | 'WORKER_RESTART'
    | 'CERTIFICATE_REVOCATION_DRILL';
  affectedRegion: string;
  recoveryStepsExecuted: string[];
  rpoObservedSeconds: number;
  rtoObservedSeconds: number;
  financialReconciliationPassed: boolean;
  duplicateExecutionsPrevented: number;
  unverifiedCompletionsBlocked: boolean;
  status: 'PASSED' | 'DEGRADED' | 'FAILED';
  executedBy: string;
  executedAt: string;
}

export interface V13VersionedContractSummary {
  contractName: string;
  version: string;
  standardReference: string;
  conformanceStatus: 'ADAPTER_READY_UNVERIFIED_EXTERNAL' | 'INTERNAL_SCHEMA_ENFORCED';
  backwardCompatible: boolean;
}

// ==========================================
// V14.0 — GLOBAL INSTITUTIONAL INTEGRATION, FINANCIAL INTEROPERABILITY & REAL-WORLD ECONOMIC OPERATIONS
// Schema Version 14 — 40 New Collections & Strict Lifecycle / Authority States
// ==========================================

export type V14TruthfulStatus =
  | 'NOT_CONFIGURED'
  | 'LOCAL_ONLY'
  | 'SANDBOX_CONNECTED'
  | 'PRODUCTION_CONNECTED_AND_VERIFIED'
  | 'SIMULATED'
  | 'PARTIALLY_IMPLEMENTED'
  | 'DEGRADED'
  | 'FAILED';

export type DatabaseAuthorityState =
  | 'WAL_JSON_SINGLE_NODE'
  | 'POSTGRES_SHADOW'
  | 'POSTGRES_PRIMARY'
  | 'POSTGRES_PRIMARY_WITH_REPLICAS'
  | 'DATABASE_DEGRADED'
  | 'DATABASE_RECOVERY_REQUIRED';

export type V14ConnectorLifecycleStatus =
  | 'DISCOVERED'
  | 'DOCUMENTATION_REVIEW'
  | 'AUTHORIZATION_REQUIRED'
  | 'AGREEMENT_PENDING'
  | 'CREDENTIALS_PENDING'
  | 'CONFIGURED'
  | 'CONNECTIVITY_TESTING'
  | 'SANDBOX_CONNECTED'
  | 'SANDBOX_VALIDATED'
  | 'PRODUCTION_APPROVAL_PENDING'
  | 'PRODUCTION_CONNECTED'
  | 'PRODUCTION_VERIFIED'
  | 'DEGRADED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'FAILED';

export type V14PaymentLifecycleStatus =
  | 'CREATED'
  | 'VALIDATED'
  | 'PROVIDER_SELECTED'
  | 'SUBMITTED'
  | 'PENDING_PROVIDER_CONFIRMATION'
  | 'AUTHORIZED'
  | 'CLEARING'
  | 'SETTLED'
  | 'REJECTED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'DISPUTED'
  | 'REQUIRES_RECONCILIATION';

export type InstitutionalOnboardingStage =
  | 'REQUEST_SUBMITTED'
  | 'LEGAL_IDENTITY_REVIEW'
  | 'REGULATORY_AUTHORITY_REVIEW'
  | 'AGREEMENT_NEGOTIATION'
  | 'AGREEMENT_SIGNED'
  | 'TECHNICAL_SETUP'
  | 'CREDENTIALS_ISSUED'
  | 'SANDBOX_TESTING'
  | 'SANDBOX_VERIFIED'
  | 'PRODUCTION_APPROVAL'
  | 'LIVE_OPERATIONS';

export type DeploymentProfileType = 'DEVELOPMENT' | 'STAGING' | 'PILOT' | 'PRODUCTION';

// 1. databaseCutoverChecklists
export interface DatabaseCutoverChecklist {
  id: string;
  targetEngine: 'POSTGRESQL_16' | 'POSTGRESQL_HA_CLUSTER';
  currentAuthorityState: DatabaseAuthorityState;
  requestedAuthorityState: DatabaseAuthorityState;
  gates: {
    postgresProvisionedAndReachable: boolean;
    schemaV14AppliedAndVerified: boolean;
    zeroDataLossChecksumVerified: boolean;
    shadowParityPassed: boolean;
    backupAndRestoreVerified: boolean;
    singleWriterLockConfirmed: boolean;
    platformAdminApproved: boolean;
  };
  allGatesPassed: boolean;
  blockedReasons: string[];
  evaluatedBy: string;
  evaluatedAt: string;
}

// 2. databaseReplicaHealth
export interface DatabaseReplicaHealth {
  id: string;
  nodeId: string;
  role: 'PRIMARY' | 'SYNC_REPLICA' | 'ASYNC_REPLICA' | 'LOCAL_WAL_AUTHORITY';
  region: string;
  jurisdiction: string;
  connectionStatus: V14TruthfulStatus;
  replicationLagMs: number | null;
  walPosition: string;
  connectionPoolUsed: number;
  connectionPoolMax: number;
  lastCheckedAt: string;
}

// 3. databaseBackupVerifications
export interface DatabaseBackupVerification {
  id: string;
  backupType: 'CANONICAL_PRE_V14' | 'SCHEDULED_SNAPSHOT' | 'RESTORE_DRILL';
  filePath: string;
  schemaVersion: number;
  checksumSha256: string;
  bytes: number;
  restoreSimulated: boolean;
  integrityVerified: boolean;
  rollbackSupported: boolean;
  restoredRecordCounts: Record<string, number>;
  verifiedBy: string;
  verifiedAt: string;
}

// 4. distributedBrokerHealth
export interface DistributedBrokerHealth {
  id: string;
  brokerName: string;
  adapterType: 'KAFKA' | 'NATS_JETSTREAM' | 'LOCAL_OUTBOX_LOG';
  connectionStatus: V14TruthfulStatus;
  isActiveAuthoritativeLog: boolean;
  orderingKeyEnforced: boolean;
  retentionPolicyHours: number;
  maxInFlightMessages: number;
  currentBackpressurePct: number;
  dlqCount: number;
  lastHealthCheckAt: string;
  diagnosticNote: string;
}

// 5. distributedConsumerOffsets
export interface DistributedConsumerOffset {
  id: string;
  consumerGroup: string;
  topicOrEventType: string;
  partitionKey: string;
  committedOffset: number;
  latestOutboxOffset: number;
  consumerLag: number;
  status: 'ACTIVE' | 'LAGGING' | 'DEGRADED' | 'PAUSED';
  lastCommittedAt: string;
}

// 6. institutionalAgreements
export interface InstitutionalAgreement {
  id: string;
  connectorId: string;
  institutionName: string;
  jurisdiction: string;
  agreementType: 'DATA_SHARING_MOU' | 'PAYMENT_CLEARING_CONTRACT' | 'API_ACCESS_SLA' | 'TAX_GATEWAY_ACCORD';
  agreementReference: string;
  signed: boolean;
  signedByInstitution: string | null;
  signedByArosOfficer: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  scopeRestrictions: string[];
  status: 'DRAFT' | 'PENDING_COUNTERSIGNATURE' | 'SIGNED_ACTIVE' | 'EXPIRED' | 'REVOKED';
}

// 7. institutionalOnboardingRequests
export interface InstitutionalOnboardingRequest {
  id: string;
  tenantId: string;
  institutionName: string;
  institutionCategory:
    | 'CENTRAL_BANK'
    | 'TAX_AUTHORITY'
    | 'STATISTICAL_AGENCY'
    | 'COMMERCIAL_BANK'
    | 'PAYMENT_PROVIDER'
    | 'CUSTOMS_AUTHORITY'
    | 'ENTERPRISE_PARTNER';
  jurisdiction: string;
  stage: InstitutionalOnboardingStage;
  legalIdentityStatus: 'SUBMITTED_IDENTITY' | 'VERIFIED_LEGAL_REGISTRATION' | 'REJECTED';
  regulatoryAuthorityStatus: 'UNVERIFIED' | 'VERIFIED_INSTITUTIONAL_AUTHORITY' | 'SUSPENDED';
  submittedBy: string;
  assignedReviewer?: string;
  connectorId?: string;
  agreementId?: string;
  stageHistory: { stage: InstitutionalOnboardingStage; actorId: string; note: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

// 8. institutionalSandboxTests
export interface InstitutionalSandboxTest {
  id: string;
  connectorId: string;
  testType: 'HANDSHAKE_PROBE' | 'MTLS_VERIFY' | 'SIGNED_PAYLOAD_ROUNDTRIP' | 'WEBHOOK_HMAC_VERIFY' | 'ISO20022_SCHEMA';
  environment: 'LOCAL_CONTRACT_HARNESS' | 'EXTERNAL_SANDBOX';
  passed: boolean;
  externalReachable: boolean;
  httpStatus: number | null;
  latencyMs: number;
  diagnosticMessage: string;
  executedBy: string;
  executedAt: string;
}

// 9. institutionalProductionApprovals
export interface InstitutionalProductionApproval {
  id: string;
  connectorId: string;
  requestedBy: string;
  approvedBy: string | null;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  prerequisitesChecked: {
    signedAgreement: boolean;
    validCredentials: boolean;
    verifiedSandboxTests: boolean;
    validCertificateOrToken: boolean;
    securitySignOff: boolean;
  };
  justification: string;
  decidedAt: string | null;
  createdAt: string;
}

// 10. externalSystemSyncLogs
export interface ExternalSystemSyncLog {
  id: string;
  connectorId: string;
  direction: 'OUTBOUND' | 'INBOUND';
  operation: string;
  correlationId: string;
  idempotencyKey: string;
  requestSignatureSha256: string;
  truthfulExecutionMode: 'LOCAL_CONTRACT_DRY_RUN' | 'EXTERNAL_SANDBOX' | 'EXTERNAL_PRODUCTION';
  status: 'BLOCKED_UNPROVISIONED' | 'DRY_RUN_VERIFIED' | 'SUCCEEDED' | 'FAILED_RETRYING' | 'FAILED';
  errorCode?: string;
  errorMessage?: string;
  syncedAt: string;
}

// 11. webhookDeliveryLogs
export interface WebhookDeliveryLog {
  id: string;
  connectorId?: string;
  providerId?: string;
  webhookId: string;
  eventType: string;
  signatureVerified: boolean;
  replayProtected: boolean;
  idempotencyStatus: 'PROCESSED' | 'DUPLICATE_REJECTED' | 'SIGNATURE_REJECTED' | 'EXPIRED_TIMESTAMP';
  httpStatusReturned: number;
  receivedAt: string;
}

// 12. paymentProviderIntegrations
export interface PaymentProviderIntegration {
  id: string;
  providerCode: string;
  providerName: string;
  railType: 'MOBILE_MONEY' | 'COMMERCIAL_BANK_API' | 'NATIONAL_CLEARING_SWITCH' | 'CROSS_BORDER_RAIL';
  jurisdiction: string;
  supportedCurrencies: string[];
  credentialsConfigured: boolean;
  sandboxStatus: V14TruthfulStatus;
  productionStatus: V14TruthfulStatus;
  supportsSettlementReceiptQuery: boolean;
  webhookSecretConfigured: boolean;
  rateLimitPerMinute: number;
  lastCheckedAt: string;
}

// 13. paymentTransactions
export interface V14PaymentTransaction {
  id: string;
  tenantId: string;
  idempotencyKey: string;
  providerId: string;
  corridor: string;
  sourceCurrency: string;
  settlementCurrency: string;
  amount: number;
  feeAmount: number;
  fxQuoteId?: string;
  fxQuoteMode: 'INDICATIVE' | 'EXECUTABLE';
  payerAccountRef: string;
  payeeAccountRef: string;
  status: V14PaymentLifecycleStatus;
  settlementReceiptId: string | null;
  settlementVerified: boolean;
  ledgerJournalId: string | null;
  failureReason?: string;
  stateTransitions: { fromStatus: string; toStatus: V14PaymentLifecycleStatus; actorId: string; note: string; at: string }[];
  createdAt: string;
  updatedAt: string;
}

// 14. providerSettlementReceipts
export interface ProviderSettlementReceipt {
  id: string;
  paymentTransactionId: string;
  providerId: string;
  providerReference: string;
  currency: string;
  settledAmount: number;
  providerFeeAmount: number;
  proofSource: 'SIGNED_PROVIDER_RECEIPT' | 'CLEARING_BATCH_FILE' | 'SYNTHETIC_REJECTED';
  signatureHex: string;
  verifiedByPlatform: boolean;
  verificationNote: string;
  settledAt: string;
  receivedAt: string;
}

// 15. financialReconciliationBatches
export interface FinancialReconciliationBatch {
  id: string;
  tenantId: string;
  currency: string;
  providerId: string;
  periodStart: string;
  periodEnd: string;
  totalInternalCount: number;
  totalProviderCount: number;
  matchedCount: number;
  partialMatchCount: number;
  unmatchedInternalCount: number;
  unmatchedProviderCount: number;
  feeVarianceTotal: number;
  fxVarianceTotal: number;
  status: 'COMPLETED_CLEAN' | 'COMPLETED_WITH_EXCEPTIONS';
  executedBy: string;
  executedAt: string;
}

// 16. financialReconciliationExceptions
export interface FinancialReconciliationException {
  id: string;
  batchId: string;
  tenantId: string;
  paymentTransactionId?: string;
  providerReference?: string;
  exceptionType:
    | 'UNMATCHED_INTERNAL'
    | 'UNMATCHED_PROVIDER'
    | 'PARTIAL_AMOUNT_MISMATCH'
    | 'FEE_VARIANCE'
    | 'FX_VARIANCE'
    | 'DUPLICATE_ENTRY'
    | 'MISSING_SETTLEMENT_PROOF';
  currency: string;
  expectedAmount: number;
  observedAmount: number;
  varianceAmount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolutionStatus: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED_BY_OPERATOR' | 'ESCALATED_TO_DISPUTE';
  resolutionNote?: string;
  detectedAt: string;
  resolvedAt?: string;
}

// 17. paymentDisputes
export interface PaymentDispute {
  id: string;
  tenantId: string;
  paymentTransactionId: string;
  reconciliationExceptionId?: string;
  disputeType: 'UNAUTHORIZED_CHARGE' | 'UNSETTLED_FUNDS' | 'DUPLICATE_DEBIT' | 'FX_FEE_DISCREPANCY' | 'DELIVERY_FAILURE';
  disputedAmount: number;
  currency: string;
  raisedBy: string;
  status: 'OPEN' | 'EVIDENCE_REVIEW' | 'PROVIDER_ESCALATED' | 'RESOLVED_REFUNDED' | 'RESOLVED_REJECTED';
  evidenceSummary: string;
  resolutionOutcome?: string;
  createdAt: string;
  updatedAt: string;
}

// 18. currencySettlementConfigs
export interface CurrencySettlementConfig {
  currency: string;
  currencyName: string;
  minorUnits: number;
  regionGroup: 'EAC' | 'AFRICA' | 'GLOBAL';
  clearingRail: string;
  independentLedgerAccountPrefix: string;
  crossCurrencyConversionRequiresExplicitFxEntry: true;
  active: boolean;
}

// 19. fxQuoteSources
export interface FxQuoteSource {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  quoteClassification: 'INDICATIVE' | 'EXECUTABLE';
  sourceName: string;
  spreadBps: number;
  validUntil: string;
  requiresLiveProviderForExecution: boolean;
  truthfulAvailability: 'LOCAL_REFERENCE_ONLY' | 'PROVIDER_SANDBOX' | 'LIVE_FEED';
  capturedAt: string;
}

// 20. tradeOperationWorkflows
export interface TradeOperationWorkflow {
  id: string;
  tenantId: string;
  exporterId: string;
  importerId: string;
  originJurisdiction: string;
  destinationJurisdiction: string;
  commodityDescription: string;
  contractValue: number;
  currency: string;
  currentStepIndex: number;
  currentStepName: string;
  stepsCompleted: string[];
  requiredEvidenceTypes: string[];
  verifiedEvidenceIds: string[];
  paymentTransactionId?: string;
  taxAssessmentId?: string;
  status: 'IN_PROGRESS' | 'AWAITING_VERIFIED_EVIDENCE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

// 21. procurementOperationWorkflows
export interface ProcurementOperationWorkflow {
  id: string;
  tenantId: string;
  procuringEntity: string;
  supplierId: string;
  jurisdiction: string;
  budgetAmount: number;
  currency: string;
  stage:
    | 'REQUISITION'
    | 'TENDER_PUBLISHED'
    | 'BID_EVALUATION'
    | 'AWARDED'
    | 'CONTRACT_EXECUTED'
    | 'DELIVERY_INSPECTION'
    | 'PAYMENT_RELEASED'
    | 'CLOSED';
  complianceChecklistPassed: boolean;
  deliveryEvidenceId?: string;
  paymentTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// 22. deliveryVerificationEvidences
export interface DeliveryVerificationEvidence {
  id: string;
  tenantId: string;
  operationType: 'TRADE' | 'PROCUREMENT' | 'LOGISTICS';
  operationId: string;
  submittedBy: string;
  claimDescription: string;
  documentHashSha256: string;
  evidenceTrustState: 'SUBMITTED_CLAIM' | 'INDEPENDENTLY_VERIFIED' | 'REJECTED_FRAUDULENT';
  verifiedBy?: string;
  verificationSource?: 'CUSTOMS_SEAL' | 'WAREHOUSE_INSPECTOR' | 'CARRIER_WAYBILL_HASH' | 'BUYER_ATTESTATION';
  verifiedAt?: string;
  submittedAt: string;
}

// 23. taxJurisdictionRules
export interface TaxJurisdictionRule {
  id: string;
  jurisdiction: string;
  taxType: 'VAT' | 'WITHHOLDING_TAX' | 'EXCISE_DUTY' | 'IMPORT_DUTY' | 'EXPORT_LEVY';
  ruleCode: string;
  ratePct: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  authorityName: string;
  version: number;
  active: boolean;
}

// 24. taxAssessmentRecords
export interface TaxAssessmentRecord {
  id: string;
  tenantId: string;
  jurisdiction: string;
  ruleId: string;
  operationReferenceId: string;
  taxableBase: number;
  currency: string;
  calculatedTaxAmount: number;
  appliedRatePct: number;
  externalFilingStatus: 'LOCAL_ASSESSMENT_ONLY' | 'SUBMITTED_TO_SANDBOX' | 'CONFIRMED_BY_TAX_AUTHORITY';
  assessedAt: string;
}

// 25. identityVerificationRecords
export interface IdentityVerificationRecord {
  id: string;
  tenantId: string;
  participantId: string;
  legalEntityName: string;
  jurisdiction: string;
  registrationNumber: string;
  verificationTier: 'SUBMITTED_IDENTITY' | 'VERIFIED_LEGAL_REGISTRATION' | 'REJECTED';
  verifiedBy?: string;
  evidenceHashSha256: string;
  submittedAt: string;
  verifiedAt?: string;
}

// 26. institutionalAuthorityRecords
export interface InstitutionalAuthorityRecord {
  id: string;
  participantId: string;
  institutionName: string;
  jurisdiction: string;
  mandateCode: string;
  authorityStatus: 'CLAIMED' | 'VERIFIED_INSTITUTIONAL_AUTHORITY' | 'VERIFIED_INTEGRATION_ACCESS' | 'REVOKED';
  authorizedScopes: string[];
  verifiedBy: string;
  validUntil: string;
  recordedAt: string;
}

// 27. authorizationPolicies
export interface AuthorizationPolicy {
  id: string;
  policyName: string;
  actionType: string;
  allowedRoles: string[];
  jurisdictionConstraints: string[];
  maxTransactionValueUgx: number | null;
  requiresDualApproval: boolean;
  requiresVerifiedIdentity: boolean;
  timeWindowUtc?: { startHour: number; endHour: number };
  active: boolean;
}

// 28. securityIncidents
export interface SecurityIncident {
  id: string;
  tenantId: string;
  category:
    | 'AUTH_FAILURE_BURST'
    | 'CROSS_TENANT_ACCESS_ATTEMPT'
    | 'PRIVILEGE_ESCALATION_ATTEMPT'
    | 'EXPIRING_CERTIFICATE'
    | 'KEY_COMPROMISE_ALERT'
    | 'INVALID_SETTLEMENT_PROOF'
    | 'WEBHOOK_TAMPER_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actorId?: string;
  details: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'MITIGATED' | 'CLOSED';
  detectedAt: string;
  mitigatedBy?: string;
  mitigatedAt?: string;
}

// 29. productionKeyManagementRecords
export interface ProductionKeyManagementRecord {
  id: string;
  keyAlias: string;
  environmentScope: 'DEVELOPMENT_ISOLATED' | 'PRODUCTION_HSM_PKCS11';
  hsmProviderStatus: V14TruthfulStatus;
  pkcs11SlotConfigured: boolean;
  failClosedWhenProdHsmMissing: true;
  rotationIntervalDays: number;
  lastRotatedAt: string;
  nextRotationDueAt: string;
  compromiseDetected: boolean;
}

// 30. externalAuditArchives
export interface ExternalAuditArchive {
  id: string;
  checkpointId: string;
  sequenceStart: number;
  sequenceEnd: number;
  rootHash: string;
  signatureBase64: string;
  archiveDestinationType: 'LOCAL_HASH_CHAIN_ONLY' | 'S3_OBJECT_LOCK_WORM' | 'AZURE_IMMUTABLE_BLOB';
  externalWormStatus: V14TruthfulStatus;
  bundleChecksumSha256: string;
  exportedAt: string;
  limitationNote: string;
}

// 31. commercialPlanCatalog
export interface CommercialPlanCatalogItem {
  id: string;
  planCode: 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'DEVELOPER_ECOSYSTEM' | 'INSTITUTIONAL';
  displayName: string;
  monthlyPriceUsd: number;
  monthlyPriceUgx: number;
  annualDiscountPct: number;
  includedApiCallsPerMonth: number;
  includedSettlementTxPerMonth: number;
  maxTenants: number;
  overagePricePer1kCallsUsd: number;
  slaTier: string;
  active: boolean;
}

// 32. customerSubscriptions
export interface CustomerSubscription {
  id: string;
  tenantId: string;
  planCode: 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'DEVELOPER_ECOSYSTEM' | 'INSTITUTIONAL';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  status: 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
  currency: string;
  contractedPrice: number;
  startedAt: string;
  currentPeriodEnd: string;
}

// 33. billingUsageRecords
export interface BillingUsageRecord {
  id: string;
  tenantId: string;
  subscriptionId: string;
  meterName: 'API_CALLS' | 'SETTLEMENT_TRANSACTIONS' | 'FORECAST_JOBS' | 'SOVEREIGN_TRANSFERS';
  quantity: number;
  unitPrice: number;
  currency: string;
  totalCharge: number;
  recordedAt: string;
}

// 34. customerInvoices
export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  subscriptionId: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'ISSUED' | 'PAID_VERIFIED' | 'PARTIALLY_PAID' | 'REFUNDED' | 'VOID';
  revenueRecognitionNote: string;
  issuedAt: string;
  paidAt?: string;
}

// 35. refundRecords
export interface RefundRecord {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  reason: string;
  approvedBy: string;
  status: 'REQUESTED' | 'APPROVED' | 'SETTLED';
  createdAt: string;
}

// 36. deploymentEnvironmentProfiles
export interface DeploymentEnvironmentProfile {
  id: string;
  profileName: DeploymentProfileType;
  databaseAuthority: DatabaseAuthorityState;
  eventBrokerMode: 'LOCAL_OUTBOX_LOG' | 'KAFKA' | 'NATS_JETSTREAM';
  hsmMode: 'DEV_SOFTWARE_ISOLATED_ADAPTER' | 'PKCS11_CLOUD_HSM_ADAPTER';
  externalWormRequired: boolean;
  allowsUnverifiedSettlements: false;
  active: boolean;
  configuredAt: string;
}

// 37. multiRegionDeployments
export interface MultiRegionDeployment {
  id: string;
  regionCode: string;
  jurisdiction: string;
  role: 'PRIMARY_NODE' | 'WARM_STANDBY_TARGET' | 'READ_REPLICA_TARGET';
  deploymentStatus: V14TruthfulStatus;
  databaseStatus: V14TruthfulStatus;
  eventBrokerStatus: V14TruthfulStatus;
  hsmStatus: V14TruthfulStatus;
  rpoTargetSeconds: number;
  rtoTargetSeconds: number;
  lastHealthCheckAt: string;
}

// 38. disasterRecoveryExercises
export interface DisasterRecoveryExercise {
  id: string;
  scenario:
    | 'DATABASE_CORRUPTION'
    | 'HSM_UNAVAILABLE'
    | 'CREDENTIAL_COMPROMISE'
    | 'INTERRUPTED_FINANCIAL_TX'
    | 'FAILED_SETTLEMENT_PROOF'
    | 'REGIONAL_FAILOVER_SIMULATION';
  affectedRegion: string;
  executionMode: 'LOCAL_NODE_DETERMINISTIC_DRILL' | 'MULTI_REGION_LIVE';
  stepsExecuted: string[];
  rpoObservedSeconds: number;
  rtoObservedSeconds: number;
  financialConsistencyVerified: boolean;
  failClosedSecurityVerified: boolean;
  status: 'PASSED' | 'DEGRADED' | 'FAILED';
  executedBy: string;
  executedAt: string;
}

// 39. productionReadinessAssessments
export interface ProductionReadinessAssessment {
  id: string;
  environmentProfile: DeploymentProfileType;
  overallStatus: 'READY_FOR_DEV_AND_PILOT' | 'BLOCKED_FOR_LIVE_PRODUCTION';
  checks: {
    domain: string;
    controlName: string;
    currentStatus: V14TruthfulStatus;
    productionRequired: boolean;
    passedForProduction: boolean;
    blockingGap: string | null;
  }[];
  passedControls: number;
  totalControls: number;
  blockingGapsCount: number;
  assessedBy: string;
  assessedAt: string;
}

// 40. v14MigrationCheckpoints
export interface V14MigrationCheckpoint {
  id: string;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  stage: 'BACKUP_VERIFIED' | 'SCHEMA_APPLIED' | 'COLLECTIONS_SEEDED' | 'INTEGRITY_RECONCILED' | 'COMPLETED' | 'RECOVERED';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'RECOVERED' | 'FAILED';
  v13BackupPath: string;
  v13BackupSha256: string;
  preMigrationCounts: Record<string, number>;
  postMigrationCounts: Record<string, number>;
  financialTotalsPreserved: boolean;
  startedAt: string;
  completedAt?: string;
}

// ==========================================
// V15.0 — GLOBAL ECONOMIC NETWORK ACTIVATION, PRODUCTION LAUNCH & MEASURABLE ECONOMIC IMPACT
// ==========================================

export type V15ReadinessState =
  | 'NOT_CONFIGURED'
  | 'LOCAL_ONLY'
  | 'CONFIGURED_NOT_CONNECTED'
  | 'CONNECTED_NOT_VALIDATED'
  | 'SANDBOX_CONNECTED'
  | 'SANDBOX_VALIDATED'
  | 'APPROVAL_PENDING'
  | 'PRODUCTION_CONNECTED'
  | 'PRODUCTION_VERIFIED'
  | 'FAILED'
  | 'BLOCKED';

export type V15DatabaseAuthorityState =
  | 'JSON_WAL_ACTIVE'
  | 'POSTGRESQL_CONFIGURED'
  | 'POSTGRESQL_CONNECTED'
  | 'MIGRATION_IN_PROGRESS'
  | 'POSTGRESQL_VALIDATED'
  | 'POSTGRESQL_PRIMARY'
  | 'FAILOVER_ACTIVE'
  | 'RECOVERY_REQUIRED';

export type ParticipantCategoryV15 =
  | 'INDIVIDUAL'
  | 'FARMER'
  | 'FARMER_GROUP'
  | 'COOPERATIVE'
  | 'SME'
  | 'LARGE_BUSINESS'
  | 'MANUFACTURER'
  | 'SUPPLIER'
  | 'WHOLESALER'
  | 'RETAILER'
  | 'IMPORTER'
  | 'EXPORTER'
  | 'LOGISTICS_PROVIDER'
  | 'FREIGHT_OPERATOR'
  | 'WAREHOUSE'
  | 'FINANCIAL_SERVICE_PROVIDER'
  | 'LICENSED_PAYMENT_PROVIDER'
  | 'INSTITUTIONAL_BUYER'
  | 'GOVERNMENT_AGENCY'
  | 'DEVELOPMENT_ORGANIZATION'
  | 'PROFESSIONAL_SERVICE_PROVIDER'
  | 'DEVELOPER'
  | 'INVESTOR_CAPITAL_PROVIDER'
  | 'EDUCATIONAL_RESEARCH_INSTITUTION';

export type MarketplaceOrderLifecycleV15 =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'CONTRACTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AUTHORIZED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELIVERY_VERIFIED'
  | 'RECONCILED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'PARTIAL_FULFILMENT'
  | 'DISPUTED';

export type PaymentProviderLifecycleV15 =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'AUTHENTICATED'
  | 'SANDBOX_CONNECTED'
  | 'SANDBOX_VALIDATED'
  | 'PRODUCTION_AUTHORIZED'
  | 'PRODUCTION_CONNECTED'
  | 'PRODUCTION_VERIFIED';

export type InstitutionalIntegrationStatusV15 =
  | 'REGISTERED'
  | 'APPLICATION_SUBMITTED'
  | 'AGREEMENT_PENDING'
  | 'CREDENTIALS_PENDING'
  | 'SANDBOX_TESTING'
  | 'SANDBOX_VALIDATED'
  | 'PRODUCTION_APPROVAL_PENDING'
  | 'PRODUCTION_CONNECTED'
  | 'PRODUCTION_VERIFIED'
  | 'SUSPENDED'
  | 'DISCONNECTED';

export type IndustrySectorV15 =
  | 'AGRICULTURE'
  | 'FOOD_PROCESSING'
  | 'MANUFACTURING'
  | 'CONSTRUCTION'
  | 'TRANSPORT'
  | 'LOGISTICS'
  | 'ENERGY'
  | 'TECHNOLOGY'
  | 'HEALTHCARE_SUPPLY_CHAINS'
  | 'EDUCATION_SERVICES'
  | 'RETAIL'
  | 'WHOLESALE'
  | 'TOURISM'
  | 'PROFESSIONAL_SERVICES'
  | 'MINING_SUPPLY_CHAINS'
  | 'EXPORT_INDUSTRIES';

// 1. V15EconomicParticipant
export interface V15EconomicParticipant {
  id: string;
  tenantId: string;
  userId?: string;
  displayName: string;
  category: ParticipantCategoryV15;
  jurisdiction: string;
  districtOrCity: string;
  kycStatus: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  kybStatus: 'NOT_APPLICABLE' | 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  regulatoryAuthorized: boolean;
  verificationLevel: 'REGISTERED_UNVERIFIED' | 'IDENTITY_VERIFIED' | 'BUSINESS_VERIFIED' | 'REGULATED_VERIFIED';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'UNDER_APPEAL';
  suspensionReason?: string;
  appealNote?: string;
  trustScore: number; // Derived strictly from verifiable completed actions
  trustScoreBasis: string;
  isPilotParticipant: boolean;
  pilotConsentRecorded: boolean;
  createdAt: string;
  updatedAt: string;
}

// 2. ParticipantVerification
export interface ParticipantVerification {
  id: string;
  participantId: string;
  tenantId: string;
  verificationType: 'KYC_INDIVIDUAL' | 'KYB_BUSINESS' | 'REGULATORY_LICENSE';
  providerOrReviewer: string;
  documentReferenceHash: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  notes: string;
  verifiedBy?: string;
  createdAt: string;
  decidedAt?: string;
}

// 3. V15OrganizationMembership
export interface V15OrganizationMembership {
  id: string;
  organizationParticipantId: string;
  memberParticipantId: string;
  tenantId: string;
  branchId?: string;
  roleTitle: string;
  permissions: string[];
  status: 'ACTIVE' | 'REVOKED';
  createdAt: string;
}

// 4. EconomicProfile
export interface EconomicProfile {
  id: string;
  participantId: string;
  tenantId: string;
  primarySector: IndustrySectorV15;
  secondarySectors: IndustrySectorV15[];
  summary: string;
  annualCapacityDescription: string;
  operatingAreas: string[];
  supportedCurrencies: string[];
  updatedAt: string;
}

// 5. BusinessLocation
export interface BusinessLocation {
  id: string;
  participantId: string;
  tenantId: string;
  branchName: string;
  jurisdiction: string;
  cityOrDistrict: string;
  addressSummary: string;
  locationType: 'HEADQUARTERS' | 'BRANCH' | 'WAREHOUSE' | 'DEPOT' | 'COLLECTION_CENTER';
  isPrimary: boolean;
  active: boolean;
  createdAt: string;
}

// 6. EconomicListing
export interface EconomicListing {
  id: string;
  sellerParticipantId: string;
  tenantId: string;
  marketType: 'WHOLESALE' | 'RETAIL' | 'BULK_PROCUREMENT' | 'EXPORT';
  sector: IndustrySectorV15;
  title: string;
  description: string;
  jurisdiction: string;
  unit: string;
  unitPrice: number;
  currency: string;
  availableQuantity: number;
  minOrderQuantity: number;
  verifiedSupplier: boolean;
  promotedPlacement: boolean; // Disclosed separately from organic score
  active: boolean;
  createdAt: string;
}

// 7. ServiceListing
export interface ServiceListing {
  id: string;
  providerParticipantId: string;
  tenantId: string;
  serviceCategory: 'LOGISTICS' | 'FREIGHT' | 'WAREHOUSING' | 'PROCESSING' | 'FINANCIAL_REFERRAL' | 'PROFESSIONAL' | 'API_SERVICE';
  title: string;
  jurisdictionCoverage: string[];
  baseRate: number;
  currency: string;
  rateUnit: string;
  verifiedProvider: boolean;
  promotedPlacement: boolean;
  active: boolean;
  createdAt: string;
}

// 8. BuyerRequest
export interface BuyerRequest {
  id: string;
  buyerParticipantId: string;
  tenantId: string;
  title: string;
  sector: IndustrySectorV15;
  jurisdiction: string;
  quantity: number;
  unit: string;
  targetUnitPrice: number;
  currency: string;
  deliveryLocation: string;
  status: 'OPEN' | 'QUOTED' | 'AWARDED' | 'CANCELLED';
  createdAt: string;
}

// 9. SupplierOffer
export interface SupplierOffer {
  id: string;
  buyerRequestId: string;
  supplierParticipantId: string;
  tenantId: string;
  offeredUnitPrice: number;
  currency: string;
  availableQuantity: number;
  leadTimeDays: number;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

// 10. MarketOpportunity
export interface MarketOpportunity {
  id: string;
  issuerParticipantId: string;
  tenantId: string;
  opportunityType: 'PROCUREMENT' | 'SUPPLY' | 'DISTRIBUTION' | 'EXPORT' | 'LOGISTICS' | 'MANUFACTURING' | 'PARTNERSHIP';
  title: string;
  sector: IndustrySectorV15;
  jurisdiction: string;
  estimatedValue: number;
  currency: string;
  eligibilitySummary: string;
  outcomeDisclaimer: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

// 11. ParticipantMatch
export interface ParticipantMatch {
  id: string;
  requesterParticipantId: string;
  matchedEntityId: string;
  matchedEntityType: 'PARTICIPANT' | 'ECONOMIC_LISTING' | 'SERVICE_LISTING' | 'OPPORTUNITY' | 'FREIGHT' | 'API';
  title: string;
  organicScore: number;
  promotedPlacement: boolean;
  promotionDisclosure: string | null;
  explanationFactors: { factor: string; weight: number; detail: string }[];
  generatedAt: string;
}

// 12. MarketplaceOrder
export interface MarketplaceOrder {
  id: string;
  tenantId: string;
  buyerParticipantId: string;
  sellerParticipantId: string;
  listingId?: string;
  quotationId?: string;
  purchaseOrderId?: string;
  jurisdiction: string;
  currency: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  lifecycleState: MarketplaceOrderLifecycleV15;
  paymentAuthorized: boolean;
  settlementVerified: boolean;
  deliveryVerified: boolean;
  cancellationOrDisputeReason?: string;
  history: { state: MarketplaceOrderLifecycleV15; actorId: string; note: string; at: string }[];
  createdAt: string;
  updatedAt: string;
}

// 13. PurchaseOrder
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  tenantId: string;
  marketplaceOrderId: string;
  buyerParticipantId: string;
  supplierParticipantId: string;
  currency: string;
  totalAmount: number;
  termsSummary: string;
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
}

// 14. CommercialQuotation
export interface CommercialQuotation {
  id: string;
  tenantId: string;
  buyerParticipantId: string;
  sellerParticipantId: string;
  listingId?: string;
  buyerRequestId?: string;
  quantity: number;
  quotedUnitPrice: number;
  totalQuotedValue: number;
  currency: string;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
  createdAt: string;
}

// 15. OrderFulfilment
export interface OrderFulfilment {
  id: string;
  marketplaceOrderId: string;
  tenantId: string;
  fulfilledQuantity: number;
  remainingQuantity: number;
  shipmentId?: string;
  carrierParticipantId?: string;
  status: 'PREPARING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'PARTIAL';
  updatedAt: string;
}

// 16. DeliveryEvidence (V15 explicit model)
export interface V15DeliveryEvidence {
  id: string;
  marketplaceOrderId: string;
  executionId?: string;
  tenantId: string;
  submittedByParticipantId: string;
  verifiedByIndependentParticipantId?: string;
  evidenceType: 'SIGNED_WAYBILL' | 'WAREHOUSE_GRN' | 'CUSTOMS_RELEASE_REF' | 'INSPECTION_ATTESTATION';
  documentHashSha256: string;
  trustStatus: 'SUBMITTED_CLAIM' | 'INDEPENDENTLY_VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt: string;
  verifiedAt?: string;
}

// 17. EconomicExecution (V15 verified execution)
export interface V15EconomicExecution {
  id: string;
  tenantId: string;
  initiatingParticipantId: string;
  counterpartyParticipantId: string;
  jurisdiction: string;
  currency: string;
  transactionValue: number;
  settledValue: number;
  contractReference?: string;
  marketplaceOrderId?: string;
  paymentProviderReference?: string;
  deliveryReference?: string;
  settlementEvidenceId?: string;
  deliveryEvidenceId?: string;
  ledgerJournalId?: string;
  lifecycleState:
    | 'INITIATED'
    | 'CONTRACTED'
    | 'PAYMENT_INITIATED'
    | 'PARTIALLY_SETTLED'
    | 'SETTLED_AWAITING_DELIVERY'
    | 'DELIVERY_VERIFIED'
    | 'RECONCILED'
    | 'COMPLETED'
    | 'DISPUTED'
    | 'CANCELLED';
  authorizationHistory: { actorId: string; action: string; at: string }[];
  createdAt: string;
  updatedAt: string;
}

// 18. EconomicExecutionEvent
export interface EconomicExecutionEvent {
  id: string;
  executionId: string;
  tenantId: string;
  eventType: string;
  fromState: string;
  toState: string;
  actorId: string;
  details: string;
  createdAt: string;
}

// 19. ProviderIntegration
export interface ProviderIntegration {
  id: string;
  providerCode: string;
  providerName: string;
  railType: 'MOBILE_MONEY' | 'COMMERCIAL_BANK' | 'REGIONAL_SWITCH' | 'RTGS' | 'INTERNATIONAL_RAIL';
  jurisdiction: string;
  supportedCurrencies: string[];
  lifecycleState: PaymentProviderLifecycleV15;
  credentialsConfigured: boolean;
  sandboxValidated: boolean;
  productionAuthorized: boolean;
  licensingDisclosure: string;
  availabilityStatus: 'NOT_CONFIGURED' | 'SANDBOX_AVAILABLE' | 'DEGRADED' | 'PRODUCTION_READY';
  lastHealthCheckAt: string;
}

// 20. ProviderTransaction
export interface ProviderTransaction {
  id: string;
  providerId: string;
  executionId?: string;
  marketplaceOrderId?: string;
  tenantId: string;
  idempotencyKey: string;
  providerReference: string;
  currency: string;
  requestedAmount: number;
  settledAmount: number;
  feeAmount: number;
  status: 'INITIATED' | 'SANDBOX_CONFIRMED' | 'SETTLED' | 'PARTIAL_SETTLED' | 'FAILED' | 'REFUNDED';
  isNonProductionTest: boolean;
  createdAt: string;
  updatedAt: string;
}

// 21. SettlementEvidence
export interface SettlementEvidence {
  id: string;
  providerTransactionId: string;
  providerId: string;
  tenantId: string;
  providerReceiptRef: string;
  currency: string;
  settledAmount: number;
  proofSource: 'SIGNED_PROVIDER_RECEIPT' | 'SANDBOX_SIMULATION' | 'SYNTHETIC_REJECTED';
  signatureHex: string;
  verifiedByPlatform: boolean;
  createdAt: string;
}

// 22. V15FinancialReconciliation
export interface V15FinancialReconciliation {
  id: string;
  tenantId: string;
  currency: string;
  providerId: string;
  matchedCount: number;
  discrepancyCount: number;
  totalSettledMatched: number;
  status: 'BALANCED' | 'EXCEPTIONS_DETECTED';
  notes: string;
  executedBy: string;
  executedAt: string;
}

// 23. TradeOpportunity
export interface TradeOpportunity {
  id: string;
  tenantId: string;
  originJurisdiction: string;
  destinationJurisdiction: string;
  corridorCode: string;
  commodityOrHsRef: string;
  volumeMetric: string;
  estimatedValue: number;
  currency: string;
  status: 'OPEN' | 'MATCHED' | 'CLOSED';
  createdAt: string;
}

// 24. TradeShipment
export interface TradeShipment {
  id: string;
  tenantId: string;
  executionId?: string;
  originJurisdiction: string;
  destinationJurisdiction: string;
  corridorCode: string;
  carrierParticipantId: string;
  hsClassificationRef: string;
  estimatedDutyTaxAmount: number;
  currency: string;
  platformDocumentGenerated: boolean;
  officialCustomsClearanceVerified: boolean;
  customsAuthorityReference?: string;
  milestone: 'BOOKED' | 'ORIGIN_DISPATCHED' | 'BORDER_IN_TRANSIT' | 'CUSTOMS_HOLD' | 'CLEARED' | 'DELIVERED';
  createdAt: string;
  updatedAt: string;
}

// 25. LogisticsBooking
export interface LogisticsBooking {
  id: string;
  tenantId: string;
  tradeShipmentId: string;
  logisticsParticipantId: string;
  shipperParticipantId: string;
  quotedFreightCost: number;
  currency: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
}

// 26. CorridorActivity
export interface CorridorActivity {
  id: string;
  corridorCode: string;
  originCountry: string;
  destinationCountry: string;
  activeShipments: number;
  clearedShipments: number;
  totalTradeValueUsdEquivalent: number;
  bottleneckNote: string;
  updatedAt: string;
}

// 27. EmploymentOpportunity
export interface EmploymentOpportunity {
  id: string;
  issuerParticipantId: string;
  tenantId: string;
  category: 'EMPLOYMENT' | 'CONTRACT_WORK' | 'SKILLS_SERVICE' | 'SUPPLIER_OPPORTUNITY' | 'DISTRIBUTION';
  title: string;
  sector: IndustrySectorV15;
  jurisdiction: string;
  compensationRangeSummary: string;
  outcomeGuaranteeDisclaimer: string;
  status: 'OPEN' | 'FILLED' | 'CLOSED';
  createdAt: string;
}

// 28. OpportunityApplication
export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunityKind: 'MARKET' | 'EMPLOYMENT';
  applicantParticipantId: string;
  tenantId: string;
  eligibilityVerified: boolean;
  coverNote: string;
  status: 'SUBMITTED' | 'SHORTLISTED' | 'SELECTED' | 'NOT_SELECTED';
  appliedAt: string;
}

// 29. IndustryValueChain
export interface IndustryValueChain {
  id: string;
  sector: IndustrySectorV15;
  title: string;
  jurisdiction: string;
  nodesMapped: {
    stage: 'PRODUCER' | 'RAW_SUPPLIER' | 'PROCESSOR' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'LOGISTICS' | 'BUYER' | 'FINANCIAL_PROVIDER';
    participantCount: number;
    capacityNote: string;
  }[];
  identifiedBottlenecks: string[];
  regulatoryRequirements: string[];
  updatedAt: string;
}

// 30. V15DeveloperApplication
export interface V15DeveloperApplication {
  id: string;
  developerParticipantId: string;
  tenantId: string;
  appName: string;
  authMode: 'OAUTH2_CLIENT_CREDENTIALS' | 'API_KEY_SCOPED';
  clientId: string;
  apiSecretHashSha256: string;
  secretPreviewRedacted: string;
  scopes: string[];
  rateLimitPerMinute: number;
  environment: 'SANDBOX' | 'PRODUCTION_PENDING_APPROVAL';
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  createdAt: string;
}

// 31. APIUsageRecord
export interface APIUsageRecord {
  id: string;
  developerAppId: string;
  tenantId: string;
  endpointPath: string;
  apiVersion: string;
  statusCode: number;
  latencyMs: number;
  rateLimited: boolean;
  recordedAt: string;
}

// 32. ImpactMetric
export interface ImpactMetric {
  id: string;
  metricNumber: number; // 1..24
  metricCode: string;
  label: string;
  value: number;
  unit: string;
  valueCategory: 'COUNT' | 'REGISTERED_VALUE' | 'QUOTED_VALUE' | 'CONTRACTED_VALUE' | 'ORDERED_VALUE' | 'PAID_VALUE' | 'PROVIDER_SETTLED_VALUE' | 'RECONCILED_VALUE' | 'RATE_PCT' | 'DURATION';
  dataCoverageNote: string;
  verificationMethod: string;
  missingDataDisclosure: string;
  computedAt: string;
}

// 33. ImpactMeasurement
export interface ImpactMeasurement {
  id: string;
  tenantId: string;
  jurisdiction: string;
  reportingPeriod: string;
  metricsSnapshot: Record<string, number>;
  valueBreakdown: {
    registeredValue: number;
    quotedValue: number;
    contractedValue: number;
    orderedValue: number;
    paidValue: number;
    providerSettledValue: number;
    reconciledValue: number;
  };
  methodologyDisclosure: string;
  computedBy: string;
  computedAt: string;
}

// 34. ParticipantOutcome
export interface ParticipantOutcome {
  id: string;
  participantId: string;
  tenantId: string;
  outcomeType: 'ORDER_COMPLETED' | 'OPPORTUNITY_CONVERTED' | 'VERIFIED_INCOME_EVENT';
  evidenceRefId: string;
  consentGranted: boolean;
  verifiedValue: number;
  currency: string;
  recordedAt: string;
}

// 35. ProductionDeployment
export interface ProductionDeployment {
  id: string;
  releaseVersion: string;
  environment: 'DEVELOPMENT' | 'PILOT' | 'STAGING' | 'PRODUCTION';
  databaseAuthorityState: V15DatabaseAuthorityState;
  gatesPassed: number;
  gatesTotal: 17;
  gateEvaluations: {
    gateNumber: number;
    gateName: string;
    state: V15ReadinessState;
    passedForProduction: boolean;
    evidence: string;
    blocker: string | null;
  }[];
  productionAllowed: boolean;
  evaluatedAt: string;
}

// 36. InfrastructureActivation
export interface InfrastructureActivation {
  id: string;
  component: 'POSTGRESQL_16' | 'KAFKA_OR_NATS' | 'PKCS11_HSM' | 'EXTERNAL_WORM_ARCHIVE' | 'MULTI_REGION_FAILOVER' | 'OBSERVABILITY_MONITORING';
  targetSpec: string;
  currentState: V15ReadinessState;
  poolOrClusterMetrics: Record<string, any>;
  slowQueriesDetected: number;
  pitrEnabled: boolean;
  lastProbedAt: string;
  diagnosticMessage: string;
}

// 37. RegionalServiceStatus
export interface RegionalServiceStatus {
  id: string;
  regionCode: string;
  jurisdiction: string;
  role: 'PRIMARY_CANDIDATE' | 'REGIONAL_CANDIDATE';
  readinessState: V15ReadinessState;
  databaseBound: string;
  sovereignPolicyId: string;
  activeActiveClaimed: false;
  lastCheckedAt: string;
}

// 38. RecoveryVerification
export interface RecoveryVerification {
  id: string;
  scenario: string;
  targetRpoMinutes: number;
  targetRtoMinutes: number;
  observedRpoMinutes: number;
  observedRtoMinutes: number;
  executionMode: 'LOCAL_NODE_CONTROLLED_DRILL' | 'LIVE_INFRASTRUCTURE_RECOVERY';
  ledgerReconciledPostRecovery: boolean;
  rpoDemonstratedLive: boolean;
  status: 'PASSED_LOCAL_DRILL' | 'FAILED';
  verifiedBy: string;
  verifiedAt: string;
}

// 39. CommercialUsageRecord
export interface CommercialUsageRecord {
  id: string;
  tenantId: string;
  participantId: string;
  streamType: 'SUBSCRIPTION' | 'API_USAGE' | 'MARKETPLACE_FEE' | 'PROCUREMENT_SERVICE' | 'LOGISTICS_SERVICE' | 'ANALYTICS_SUBSCRIPTION';
  quantity: number;
  unitFeeUsd: number;
  totalBilledUsd: number;
  collectedRevenueUsd: number;
  feeDisclosed: boolean;
  publicServiceExemptChecked: boolean;
  recordedAt: string;
}

// 40. PilotOperationRecord (Uganda Controlled Pilot tracking)
export interface PilotOperationRecord {
  id: string;
  pilotCode: string;
  tenantId: string;
  jurisdiction: string;
  producerParticipantId: string;
  buyerParticipantId: string;
  logisticsParticipantId?: string;
  listingId?: string;
  orderId?: string;
  executionId?: string;
  currentStepNumber: number; // 1..16
  currentStepName: string;
  usesLivePaymentRail: boolean;
  nonProductionWorkflowDisclosed: boolean;
  operationalIssues: string[];
  participantFeedback: string[];
  status: 'ACTIVE_IN_PROGRESS' | 'COMPLETED_NON_PROD' | 'COMPLETED_LIVE';
  updatedAt: string;
}

// 41. V15MigrationCheckpoint
export interface V15MigrationCheckpoint {
  id: string;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  stage: 'BACKUP_VERIFIED' | 'SCHEMA_APPLIED' | 'COLLECTIONS_SEEDED' | 'INTEGRITY_RECONCILED' | 'COMPLETED' | 'RECOVERED';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'RECOVERED' | 'FAILED';
  v14BackupPath: string;
  v14BackupSha256: string;
  preMigrationCounts: Record<string, number>;
  postMigrationCounts: Record<string, number>;
  financialTotalsPreserved: boolean;
  startedAt: string;
  completedAt?: string;
}

// ==========================================
// V16 PRODUCTION INFRASTRUCTURE, VERIFIED INTEGRATIONS & UGANDA PILOT TYPES
// ==========================================

export type V16EnvironmentName =
  | 'DEVELOPMENT'
  | 'AUTOMATED_TESTING'
  | 'STAGING'
  | 'INTEGRATION_TESTING'
  | 'CONTROLLED_PILOT'
  | 'PRODUCTION';

export type V16ReadinessState =
  | 'NOT_CONFIGURED'
  | 'LOCAL_ONLY'
  | 'CONFIGURED_NOT_CONNECTED'
  | 'CONNECTED_NOT_VALIDATED'
  | 'SANDBOX_CONNECTED'
  | 'SANDBOX_VALIDATED'
  | 'APPROVAL_PENDING'
  | 'PRODUCTION_CONNECTED'
  | 'PRODUCTION_VERIFIED'
  | 'FAILED'
  | 'BLOCKED';

export type V16DatabaseAuthorityState =
  | 'JSON_WAL_ACTIVE'
  | 'POSTGRESQL_CONFIGURED'
  | 'POSTGRESQL_CONNECTED'
  | 'POSTGRESQL_MIGRATION_READY'
  | 'POSTGRESQL_MIGRATING'
  | 'POSTGRESQL_VALIDATION_FAILED'
  | 'POSTGRESQL_VALIDATED'
  | 'POSTGRESQL_PRIMARY'
  | 'FAILOVER_ACTIVE'
  | 'RECOVERY_REQUIRED';

export type V16EventCategory =
  | 'PARTICIPANTS'
  | 'IDENTITY'
  | 'MARKETPLACE'
  | 'ORDERS'
  | 'FINANCIAL_OPERATIONS'
  | 'INSTITUTIONAL_CONNECTIVITY'
  | 'LOGISTICS'
  | 'NOTIFICATIONS'
  | 'SECURITY'
  | 'AUDIT'
  | 'BILLING'
  | 'ECONOMIC_INTELLIGENCE';

export interface V16EnvironmentConfig {
  id: string;
  environment: V16EnvironmentName;
  configVersion: string;
  databaseTargetLabel: string;
  providerEndpointScope: 'LOCAL_SANDBOX' | 'EXTERNAL_SANDBOX' | 'PILOT_RESTRICTED' | 'PRODUCTION_LOCKED';
  secretRefs: {
    keyName: string;
    configured: boolean;
    lastRotatedAt: string | null;
    fingerprintRedacted: string;
    scope: V16EnvironmentName;
  }[];
  requiredVariablesChecked: boolean;
  missingRequiredVariables: string[];
  crossEnvProductionCredBlocked: boolean;
  accessPolicySummary: string;
  status: V16ReadinessState;
  updatedAt: string;
}

export interface V16MigrationException {
  id: string;
  checkpointId: string;
  collectionName: string;
  recordId: string;
  reason: string;
  resolved: boolean;
  detectedAt: string;
}

export interface V16MigrationCheckpoint {
  id: string;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  targetEngine: 'JSON_WAL_SCHEMA_16' | 'POSTGRESQL_16_CUTOVER';
  status: 'IN_PROGRESS' | 'DRY_RUN_VALIDATED' | 'COMPLETED' | 'RECOVERED' | 'FAILED' | 'ROLLED_BACK';
  backupFilePath: string;
  backupChecksumSha256: string;
  migrationChecksumSha256: string;
  preCounts: Record<string, number>;
  postCounts: Record<string, number>;
  preFinancialTotals: Record<string, number>;
  postFinancialTotals: Record<string, number>;
  exceptionsCount: number;
  relationshipChecksPassed: boolean;
  duplicateCheckPassed: boolean;
  postgresLiveApplied: boolean;
  rollbackAvailable: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface V16ProviderConnectionTest {
  id: string;
  providerId: string;
  providerCode: string;
  environment: V16EnvironmentName;
  mode: 'LOCAL_DRY_RUN' | 'SANDBOX_PROBE' | 'PRODUCTION_PROBE';
  webhookSignatureTested: boolean;
  idempotencyVerified: boolean;
  externalReachable: boolean;
  latencyMs: number | null;
  status: V16ReadinessState;
  diagnosticNote: string;
  testedBy: string;
  testedAt: string;
}

export type V16InstitutionalStage =
  | '1_IDENTIFIED'
  | '2_INTEREST_RECORDED'
  | '3_AUTHORIZED_CONTACT'
  | '4_TECHNICAL_REQUIREMENTS'
  | '5_LEGAL_DATA_SHARING_REVIEW'
  | '6_AGREEMENT_APPROVAL'
  | '7_SANDBOX_CREDENTIALS_ISSUED'
  | '8_TECHNICAL_TESTING'
  | '9_SECURITY_VALIDATION'
  | '10_PRODUCTION_AUTHORIZATION'
  | '11_PRODUCTION_CONNECTION'
  | '12_OPERATIONAL_MONITORING';

export interface V16InstitutionalOnboardingRecord {
  id: string;
  institutionName: string;
  institutionType: 'CENTRAL_BANK' | 'COMMERCIAL_BANK' | 'MOBILE_MONEY' | 'CUSTOMS_REVENUE' | 'MINISTRY' | 'COOPERATIVE_APEX' | 'INSURER';
  jurisdiction: string;
  currentStage: V16InstitutionalStage;
  stageNumber: number;
  protocolsSupported: ('REST' | 'OAUTH2' | 'MTLS' | 'SIGNED_WEBHOOK' | 'ISO_20022' | 'SECURE_FILE')[];
  contactNameRedacted: string;
  agreementApproved: boolean;
  sandboxTested: boolean;
  securityValidated: boolean;
  productionAuthorized: boolean;
  evidenceRefs: string[];
  approvalDisclaimer: string;
  readinessState: V16ReadinessState;
  updatedAt: string;
}

export interface V16PilotProgramme {
  id: string;
  pilotCode: string;
  title: string;
  jurisdiction: string;
  districtsCovered: string[];
  startDate: string;
  endDate: string;
  administrators: string[];
  operationalRulesSummary: string;
  usesLivePaymentRails: boolean;
  nonProductionDisclosure: string;
  status: 'PREPARING' | 'CONTROLLED_SANDBOX_ACTIVE' | 'PAUSED' | 'COMPLETED';
  updatedAt: string;
}

export interface V16PilotCohort {
  id: string;
  pilotId: string;
  name: string;
  jurisdiction: string;
  district: string;
  targetCategories: string[];
  enrolledCount: number;
  verifiedCount: number;
  status: 'OPEN' | 'ACTIVE' | 'CLOSED';
  createdAt: string;
}

export interface V16PilotParticipantConsent {
  id: string;
  pilotId: string;
  cohortId: string;
  participantId: string;
  participantCategory: string;
  jurisdiction: string;
  district: string;
  consentVersion: string;
  informedConsentGranted: boolean;
  disclosedNonProduction: boolean;
  supportNeedsNote: string;
  isNonProductionTestRecord: boolean;
  consentedAt: string;
}

export interface V16PilotActivityRecord {
  id: string;
  pilotId: string;
  cohortId: string;
  participantId: string;
  workflowStepNumber: number;
  workflowStepName: string;
  orderOrExecutionId?: string;
  amountUgx: number;
  isNonProductionSimulation: boolean;
  verifiedByExternalProvider: boolean;
  note: string;
  recordedAt: string;
}

export interface V16UsabilitySession {
  id: string;
  personaCode: string;
  participantGroup:
    | 'RURAL_FARMER'
    | 'MARKET_VENDOR'
    | 'COOPERATIVE_MEMBER'
    | 'SMALL_BUSINESS_OWNER'
    | 'FIRST_TIME_SMARTPHONE'
    | 'LIMITED_LITERACY'
    | 'LOCAL_LANGUAGE_USER'
    | 'ENTERPRISE_OPERATOR';
  languageUsed: string;
  consentRecorded: boolean;
  moderatorId: string;
  locationDistrict: string;
  overallAccessibilityNotes: string;
  recommendations: string[];
  conductedAt: string;
}

export interface V16UsabilityTaskResult {
  id: string;
  sessionId: string;
  taskCode: string;
  taskTitle: string;
  completed: boolean;
  errorsCount: number;
  assistanceRequired: boolean;
  durationSeconds: number;
  feedbackNote: string;
  recordedAt: string;
}

export interface V16ReleaseRecord {
  id: string;
  versionTag: string;
  environment: V16EnvironmentName;
  strategy: 'ROLLING' | 'BLUE_GREEN' | 'CANARY';
  artifactChecksumSha256: string;
  buildVerified: boolean;
  migrationChecked: boolean;
  securityChecked: boolean;
  smokeTestsPassed: boolean;
  stagingValidated: boolean;
  approvedBy?: string;
  status: 'CANDIDATE' | 'STAGING_VALIDATED' | 'APPROVED_FOR_DEPLOY' | 'DEPLOYED' | 'ROLLED_BACK';
  rollbackTargetVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface V16MonitoringIncident {
  id: string;
  tenantId: string;
  component: 'API' | 'POSTGRESQL' | 'EVENT_BUS' | 'HSM' | 'AUDIT_ARCHIVE' | 'PAYMENT_PROVIDER' | 'AUTH' | 'STORAGE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  correlationId: string;
  summary: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'MITIGATING' | 'RESOLVED';
  timeline: { status: string; actorId: string; note: string; at: string }[];
  openedAt: string;
  resolvedAt?: string;
}

export interface V16RecoveryExercise {
  id: string;
  systemsAffected: string[];
  backupSource: string;
  recoveryStepsExecuted: string[];
  targetRpoMinutes: number;
  targetRtoMinutes: number;
  actualRpoSeconds: number;
  actualRtoSeconds: number;
  dataIntegrityPassed: boolean;
  liveExternalInfrastructureProven: boolean;
  failuresObserved: string[];
  correctiveActions: string[];
  approvedBy?: string;
  status: 'EXECUTED_LOCAL_NODE' | 'EXECUTED_LIVE_INFRA' | 'FAILED';
  executedAt: string;
}

export interface V16ComplianceReview {
  id: string;
  jurisdiction: string;
  domain:
    | 'DATA_PROTECTION'
    | 'PRIVACY'
    | 'PAYMENT_PROVIDER_INTEGRATION'
    | 'CONSUMER_PROTECTION'
    | 'ELECTRONIC_TRANSACTIONS'
    | 'TAX_REPORTING'
    | 'CROSS_BORDER_TRADE'
    | 'RECORD_RETENTION'
    | 'INSTITUTIONAL_DATA_SHARING';
  statutoryReference: string;
  requirementSummary: string;
  reviewStatus: 'PENDING_LEGAL_REVIEW' | 'CHANGES_REQUIRED' | 'LEGAL_COUNSEL_CLEARED';
  regulatedActivationBlocked: boolean;
  reviewerName?: string;
  reviewedAt?: string;
  notes: string;
}

export interface V16OperationalCostRecord {
  id: string;
  category: 'HOSTING' | 'DATABASE' | 'STORAGE' | 'NETWORK' | 'PROVIDER_FEES' | 'SUPPORT' | 'PERSONNEL';
  period: string;
  jurisdiction: string;
  amountUsd: number;
  recordedAt: string;
  note: string;
}

export interface V16AcceptanceGateEvaluation {
  gateNumber: number;
  gateName: string;
  state: V16ReadinessState;
  passedForProduction: boolean;
  evidence: string;
  blocker: string | null;
}

// ==========================================
// V17 VERIFIED ECONOMIC NETWORK OPERATIONS & REGIONAL ADOPTION TYPES
// ==========================================

export type V17GateStatus =
  | 'NOT_STARTED'
  | 'SPECIFIED'
  | 'IMPLEMENTED'
  | 'TESTED_LOCAL'
  | 'SANDBOX_VALIDATED'
  | 'STAGING_VALIDATED'
  | 'SECURITY_REVIEWED'
  | 'LEGAL_REVIEWED'
  | 'EXTERNAL_DEPENDENCY_BLOCKED'
  | 'PRODUCTION_READY'
  | 'WAIVED_WITH_AUTHORITY';

export interface V17GateRemediationRecord {
  gateId: string;
  gateNumber: number;
  gateName: string;
  category: 'INFRASTRUCTURE' | 'SECURITY' | 'FINANCIAL' | 'LEGAL' | 'PILOT_OPERATIONS' | 'LOCALIZATION';
  status: V17GateStatus;
  criticalNonWaivable: boolean;
  owner: string;
  reviewer: string;
  blockedByGates: string[];
  requiredEvidence: string;
  submittedEvidence: string;
  waiverAuthority: string | null;
  targetDate: string;
  updatedAt: string;
}

export type V17VerificationLevel =
  | 'UNVERIFIED'
  | 'CONTACT_VERIFIED'
  | 'IDENTITY_VERIFIED'
  | 'ORGANIZATION_VERIFIED'
  | 'DOCUMENTS_REVIEWED'
  | 'INSTITUTIONALLY_ATTESTED'
  | 'SUSPENDED'
  | 'EXPIRED';

export interface V17Participant {
  id: string;
  userId: string;
  tenantId: string;
  participantType: 'FARMER' | 'TRADER' | 'SME' | 'BUYER' | 'LOGISTICS_OPERATOR' | 'COOPERATIVE_MEMBER' | 'INSTITUTION_REP';
  displayName: string;
  phoneMasked: string;
  countryCode: string;
  district: string;
  languages: string[];
  verificationLevel: V17VerificationLevel;
  verificationSourceLabel: string;
  govtVerified: boolean;
  consentVersion: string;
  consentGranted: boolean;
  visibility: 'PUBLIC' | 'PARTICIPANTS_ONLY' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
}

export interface V17OrganizationProfile {
  id: string;
  tenantId: string;
  legalName: string;
  orgType: 'SME' | 'FARMER_COOPERATIVE' | 'ENTERPRISE' | 'LOGISTICS' | 'FINANCIAL_PROVIDER' | 'INSTITUTION' | 'PUBLIC_BODY';
  countryCode: string;
  district: string;
  registrationRef: string;
  verificationLevel: V17VerificationLevel;
  govtVerified: boolean;
  verifiedByNote: string;
  visibility: 'PUBLIC' | 'PARTICIPANTS_ONLY' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
}

export interface V17OrganizationMember {
  id: string;
  organizationId: string;
  participantId: string;
  role: 'OWNER' | 'ADMIN' | 'FINANCE_OPERATOR' | 'LOGISTICS_COORDINATOR' | 'MEMBER';
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  addedAt: string;
}

export interface V17VerificationEvidence {
  id: string;
  subjectId: string;
  subjectType: 'PARTICIPANT' | 'ORGANIZATION';
  documentType: string;
  fileHashSha256: string;
  submittedBy: string;
  reviewedBy?: string;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes: string;
  verificationTier: V17VerificationLevel;
  submittedAt: string;
  reviewedAt?: string;
}

export type V17RelationshipType =
  | 'SUPPLIER_BUYER'
  | 'FARMER_COOPERATIVE'
  | 'BUSINESS_LOGISTICS'
  | 'PARTICIPANT_SERVICE_PROVIDER'
  | 'ENTERPRISE_DISTRIBUTOR'
  | 'INSTITUTION_PARTICIPANT'
  | 'APPROVED_CORRIDOR_PARTNER';

export interface V17RelationshipInvitation {
  id: string;
  tenantId: string;
  fromParticipantId: string;
  toParticipantId: string;
  relationshipType: V17RelationshipType;
  visibility: 'PUBLIC' | 'PARTICIPANTS_ONLY' | 'PRIVATE';
  termsSummary: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  respondedAt?: string;
}

export interface V17Relationship {
  id: string;
  tenantId: string;
  partyAId: string;
  partyBId: string;
  relationshipType: V17RelationshipType;
  visibility: 'PUBLIC' | 'PARTICIPANTS_ONLY' | 'PRIVATE';
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';
  establishedAt: string;
  expiresAt: string;
  updatedAt: string;
}

export type V17UnitCode = 'KG' | 'BAG_50KG' | 'BAG_100KG' | 'TONNE' | 'CRATE' | 'BUNCH' | 'PIECE' | 'LITRE' | 'SERVICE_UNIT';

export interface V17CommercialListing {
  id: string;
  tenantId: string;
  sellerParticipantId: string;
  organizationId?: string;
  title: string;
  sector: string;
  category: string;
  countryCode: string;
  district: string;
  unitPrice: number;
  currency: string;
  unitCode: V17UnitCode;
  availableQty: number;
  minOrderQty: number;
  qualityGrade: string;
  deliveryTerms: string;
  visibility: 'PUBLIC' | 'PARTICIPANTS_ONLY' | 'PRIVATE';
  status: 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface V17BuyerRequest {
  id: string;
  tenantId: string;
  buyerParticipantId: string;
  title: string;
  sector: string;
  countryCode: string;
  targetDistrict: string;
  requestedQty: number;
  unitCode: V17UnitCode;
  targetUnitPrice: number;
  currency: string;
  deliveryDeadline: string;
  status: 'OPEN' | 'QUOTING' | 'AWARDED' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
}

export interface V17Quotation {
  id: string;
  tenantId: string;
  requestId?: string;
  listingId?: string;
  sellerParticipantId: string;
  buyerParticipantId: string;
  quantity: number;
  unitCode: V17UnitCode;
  normalizedKg: number | null;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  validUntil: string;
  status: 'SENT' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface V17Negotiation {
  id: string;
  tenantId: string;
  quotationId: string;
  roundNumber: number;
  proposedBy: string;
  proposedUnitPrice: number;
  proposedQty: number;
  message: string;
  createdAt: string;
}

export type V17TransactionState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED_UNVERIFIED'
  | 'PAYMENT_PROVIDER_VERIFIED'
  | 'IN_FULFILLMENT'
  | 'READY_FOR_DISPATCH'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELIVERY_CONFIRMED'
  | 'COMPLETED'
  | 'RECONCILED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED'
  | 'EXPIRED';

export type V17TransactionVerificationTier =
  | 'PLATFORM_RECORDED'
  | 'PARTICIPANT_CONFIRMED'
  | 'PROVIDER_CONFIRMED'
  | 'DELIVERY_CONFIRMED'
  | 'RECONCILED'
  | 'INDEPENDENTLY_REVIEWED';

export interface V17TransactionRecord {
  id: string;
  tenantId: string;
  buyerId: string;
  sellerId: string;
  listingId?: string;
  quotationId?: string;
  currency: string;
  amount: number;
  quantity: number;
  unitCode: V17UnitCode;
  state: V17TransactionState;
  verificationTier: V17TransactionVerificationTier;
  externalProviderRef?: string;
  offlineQueued: boolean;
  offlineRevalidated: boolean;
  stateHistory: { state: V17TransactionState; actorId: string; note: string; at: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface V17TransactionEvidence {
  id: string;
  transactionId: string;
  tenantId: string;
  evidenceType:
    | 'CONTRACT_DOC'
    | 'INVOICE_DOC'
    | 'WAYBILL'
    | 'DELIVERY_PHOTO_HASH'
    | 'RECIPIENT_ACK'
    | 'PROVIDER_RECEIPT'
    | 'BANK_SETTLEMENT'
    | 'INSPECTION_REPORT';
  submittedBy: string;
  submittedRole: string;
  externalRefId?: string;
  payloadHashSha256: string;
  verifiedByIndependentReviewer: boolean;
  verificationTier: V17TransactionVerificationTier;
  autoVerifiedFromUserUpload: boolean;
  recordedAt: string;
}

export interface V17TransactionVerificationResult {
  transactionId: string;
  state: V17TransactionState;
  verificationTier: V17TransactionVerificationTier;
  providerVerified: boolean;
  deliveryVerified: boolean;
  reconciled: boolean;
  evidenceCount: number;
  hasDispute: boolean;
  checks: string[];
  evaluatedAt: string;
}

export interface V17ReviewRecord {
  id: string;
  transactionId: string;
  reviewerParticipantId: string;
  subjectParticipantId: string;
  rating: number;
  comment: string;
  moderationStatus: 'VISIBLE' | 'FLAGGED' | 'APPEALED' | 'HIDDEN';
  appealNote?: string;
  createdAt: string;
}

export interface V17ReputationRecord {
  participantId: string;
  completedTransactions: number;
  disputeCount: number;
  averageRating: number;
  evidenceVerifiedTransactions: number;
  disputeFrequencyPct: number;
  volumeNeutralNote: string;
  nonCreditScoringDisclaimer: string;
  updatedAt: string;
}

export type V17DisputeStage =
  | '1_OPENED'
  | '2_RESPONDED'
  | '3_EVIDENCE_COLLECTED'
  | '4_INITIAL_ASSESSMENT'
  | '5_MEDIATION_PROPOSED'
  | '6_PARTY_NEGOTIATION'
  | '7_ADMIN_OR_COOP_REVIEW'
  | '8_RESOLUTION_PROPOSED'
  | '9_SETTLEMENT_OR_ADJUSTMENT'
  | '10_APPEAL_REVIEW'
  | '11_CLOSED';

export interface V17DisputeRecord {
  id: string;
  tenantId: string;
  transactionId: string;
  complainantId: string;
  respondentId: string;
  reason: string;
  claimedAmount: number;
  currency: string;
  stage: V17DisputeStage;
  assignedMediatorId?: string;
  conflictOfInterestDeclared: boolean;
  evidenceIds: string[];
  resolutionProposal?: string;
  finalDecision?: string;
  nonCourtDisclaimer: string;
  nonUnlicensedEscrowDisclaimer: string;
  history: { stage: V17DisputeStage; actorId: string; note: string; at: string }[];
  openedAt: string;
  closedAt?: string;
}

export interface V17JurisdictionProfile {
  countryCode: string;
  countryName: string;
  currency: string;
  activationState: 'CONTROLLED_PILOT_SANDBOX' | 'INACTIVE' | 'PENDING_REVIEW';
  complianceReviewCleared: boolean;
  regulatoryApprovalsPending: string[];
  rulesSummary: string;
  updatedAt: string;
}

export interface V17RegionalCorridor {
  id: string;
  code: string;
  name: string;
  originCountry: string;
  destinationCountry: string;
  originDistrict: string;
  destinationDistrict: string;
  transportModes: ('MOTORCYCLE' | 'PICKUP_VAN' | 'TRUCK' | 'CROSS_BORDER_FREIGHT' | 'COOPERATIVE_BULK')[];
  status: 'PLANNING' | 'SANDBOX_CORRIDOR' | 'ACTIVE' | 'CONGESTED';
  nonCustomsDisclaimer: string;
}

export interface V17LogisticsShipment {
  id: string;
  tenantId: string;
  transactionId: string;
  corridorId?: string;
  carrierParticipantId: string;
  transportMode: 'MOTORCYCLE' | 'PICKUP_VAN' | 'TRUCK' | 'CROSS_BORDER_FREIGHT' | 'COOPERATIVE_BULK';
  originLocation: string;
  destinationLocation: string;
  status: 'DISPATCHED' | 'AT_COLLECTION_HUB' | 'IN_TRANSIT' | 'DELIVERED' | 'EXCEPTION';
  offlineSubmitted: boolean;
  hasFakeGpsCoordinates: false;
  proofRef?: string;
  updatedAt: string;
}

export interface V17CooperativeWorkspace {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  district: string;
  countryCode: string;
  memberPrivacyMode: 'AGGREGATED_ONLY' | 'MEMBER_CONSENTED';
  nonDepositTakingDisclaimer: string;
  createdAt: string;
}

export interface V17CooperativeMembership {
  id: string;
  cooperativeId: string;
  participantId: string;
  consentToShareProfile: boolean;
  producedKgAggregated: number;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
}

export interface V17CooperativeActivity {
  id: string;
  cooperativeId: string;
  activityType: 'AGGREGATED_LOT' | 'SHARED_TRANSPORT' | 'BULK_INPUT_PURCHASE';
  title: string;
  totalQty: number;
  unitCode: V17UnitCode;
  currency: string;
  totalAmount: number;
  recordedAt: string;
}

export interface V17ReconciliationCase {
  id: string;
  tenantId: string;
  transactionId: string;
  currency: string;
  expectedAmount: number;
  providerReportedAmount: number;
  varianceAmount: number;
  causeCategory: 'FEE_MISMATCH' | 'PARTIAL_SETTLEMENT' | 'FX_SPREAD' | 'DUPLICATE_CALLBACK' | 'MISSING_PROOF';
  status: 'OPEN' | 'INVESTIGATING' | 'REVERSAL_POSTED' | 'RESOLVED';
  correctingJournalEntryId?: string;
  resolvedBy?: string;
  openedAt: string;
  resolvedAt?: string;
}

export interface V17NetworkBillingRecord {
  id: string;
  tenantId: string;
  transactionId: string;
  currency: string;
  grossTransactionValue: number;
  providerFeeAmount: number;
  taxAmount: number;
  refundAmount: number;
  platformServiceFeeAmount: number;
  collectedPlatformRevenue: number;
  platformReceivableAmount: number;
  exemptPublicService: boolean;
  settlementMatched: boolean;
  recordedAt: string;
}

export interface V17GovernancePolicy {
  id: string;
  policyCode: string;
  title: string;
  domain: 'TREASURY' | 'CROSS_TENANT' | 'REGULATORY' | 'DISPUTE_APPEAL' | 'DATA_PRIVACY';
  requiresDualAuthorization: boolean;
  status: 'DRAFT' | 'PENDING_SECOND_APPROVAL' | 'ACTIVE' | 'RETIRED';
  version: number;
  updatedAt: string;
}

export interface V17PolicyApproval {
  id: string;
  policyId: string;
  actionRequested: string;
  requestedBy: string;
  firstApprovedBy: string;
  secondApprovedBy?: string;
  status: 'PENDING_SECOND_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  decidedAt?: string;
}

export interface V17DataPrivacyRequest {
  id: string;
  participantId: string;
  requestType: 'DATA_EXPORT' | 'DELETION_REVIEW' | 'CONSENT_WITHDRAWAL';
  status: 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED_LEGAL_HOLD';
  exportedPayloadSummary?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface V17OfflineSyncItem {
  id: string;
  participantId: string;
  tenantId: string;
  actionType: 'CREATE_LISTING' | 'SUBMIT_ORDER_DRAFT' | 'LOGISTICS_STATUS_UPDATE' | 'SETTLEMENT_ATTEMPT';
  targetEntityId?: string;
  queuedPayload: Record<string, any>;
  validationStatus: 'QUEUED' | 'REVALIDATED' | 'REJECTED_STALE_OR_SETTLEMENT';
  rejectionReason?: string;
  queuedAt: string;
  syncedAt?: string;
}

export interface V17MigrationCheckpoint {
  id: string;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  status: 'IN_PROGRESS' | 'DRY_RUN_VALIDATED' | 'COMPLETED' | 'RECOVERED' | 'FAILED';
  v16BackupFilePath: string;
  v16BackupChecksumSha256: string;
  migrationChecksumSha256: string;
  preCounts: Record<string, number>;
  postCounts: Record<string, number>;
  preFinancialTotals: Record<string, number>;
  postFinancialTotals: Record<string, number>;
  financialTotalsPreserved: boolean;
  startedAt: string;
  completedAt?: string;
}

// ==========================================
// V18.0 COMPLETE SYSTEM NAVIGATION, CONSOLIDATION & ADMIN INTERFACES
// ==========================================

export type V18NavGroupId =
  | 'HOME_PERSONAL'
  | 'DISCOVER_MARKETPLACE'
  | 'BUSINESS_ENTERPRISE'
  | 'AGRICULTURE_PRODUCTION'
  | 'TRADE_COMMERCIAL'
  | 'WORK_SERVICES'
  | 'LOGISTICS_SUPPLY'
  | 'FINANCIAL_COORDINATION'
  | 'COOPERATIVES_INSTITUTIONS'
  | 'TRUST_VERIFICATION'
  | 'INTELLIGENCE_RESILIENCE'
  | 'NETWORK_ADMIN'
  | 'HELP_ACCOUNT';

export interface V18NavItem {
  id: string;
  label: string;
  description: string;
  route: string;
  legacyRoutes?: string[];
  parentId?: string;
  groupId: V18NavGroupId;
  groupLabel: string;
  iconName: string;
  requiredRoles: UserRole[];
  minExperienceMode: 'SIMPLE' | 'STANDARD' | 'PROFESSIONAL' | 'ADMINISTRATOR';
  availability: 'AVAILABLE' | 'SANDBOX_ONLY' | 'ADMIN_ONLY';
  keywords: string[];
  showInMobileMore?: boolean;
  isPrimaryMobile?: boolean;
}

export interface V18BreadcrumbItem {
  id: string;
  label: string;
  route: string;
}

export interface V18SearchResult {
  id: string;
  kind: 'MODULE' | 'LISTING' | 'OPPORTUNITY' | 'ORDER' | 'SUPPORT_CASE' | 'PARTICIPANT' | 'ORGANIZATION';
  title: string;
  subtitle: string;
  route: string;
  tabId: string;
  requiresConfirmation?: boolean;
  badge?: string;
}

export type V18TaskBucket = 'ASSIGNED_TO_ME' | 'AWAITING_MY_ACTION' | 'ASSIGNED_BY_ME' | 'OVERDUE' | 'COMPLETED';

export interface V18UnifiedTask {
  id: string;
  sourceType: 'BUSINESS_TASK' | 'SUPPORT_CASE' | 'RELATIONSHIP_INVITE' | 'DISPUTE' | 'ORDER' | 'OFFLINE_SYNC';
  title: string;
  description: string;
  bucket: V18TaskBucket;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  dueDate?: string;
  targetRoute: string;
  targetTabId: string;
  actionable: boolean;
}

export interface V18AdminControlSummary {
  product: string;
  releaseVersion: string;
  schemaVersion: number;
  attribution: string;
  serverUptimeSeconds: number;
  database: {
    authorityMode: string;
    walFileSizeBytes: number;
    walExists: boolean;
    postgresConfigured: boolean;
    postgresConnected: boolean;
    lastBackupTimestamp: string | null;
    v16BackupValid: boolean;
    v15BackupValid: boolean;
    v14BackupValid: boolean;
  };
  queues: {
    pendingVerifications: number;
    openDisputes: number;
    openSupportCases: number;
    offlineSyncItems: number;
    openSecurityIncidents: number;
    openOperationalIncidents: number;
    deadLetterEvents: number;
  };
  ledger: {
    journalBalanced: boolean;
    totalJournalEntries: number;
    suspenseAccountBalance: number;
  };
  gatesSummary: {
    totalGates: number;
    v16GatesPassed: number;
    v17ProductionReadyCount: number;
    externalBlockedCount: number;
  };
  statuses: {
    ENGINEERING_COMPLETE: boolean;
    PRODUCTION_READY: boolean;
    LIVE_PILOT_OPERATIONAL: boolean;
  };
}

// ==========================================
// V19.0 PLATFORM STABILITY, RECOVERY, EXPORT & DEPLOYMENT INTERFACES
// ==========================================

export interface V19ExportManifest {
  product: string;
  release: string;
  attribution: string;
  secretScan: {
    passed: boolean;
    filesScanned: number;
    findings: { file: string; rule: string; preview: string }[];
    forbiddenEnvFiles: string[];
    scannedAt: string;
  };
  verification: {
    verified: boolean;
    archiveName: string;
    archivePath: string;
    bytes: number;
    sha256: string;
    fileCount: number;
    missingRequired: string[];
    forbiddenPresent: string[];
    manifestOk: boolean;
    unzipIntegrityPassed: boolean;
    extractedInspectionPassed: boolean;
    verifiedAt: string;
  };
}

export interface V19DiagnosticsSummary {
  product: string;
  release: string;
  attribution: string;
  environment: string;
  schemaVersion: number;
  port: number;
  serverUptimeSeconds: number;
  memory: {
    processRssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    systemTotalMb: number;
    systemFreeMb: number;
  };
  workspace: {
    srcSizeMb: number;
    dataSizeMb: number;
    walFileSizeMb: number;
    walExists: boolean;
    rollingBackupsCount: number;
    nodeModulesPresent: boolean;
    distBuildPresent: boolean;
    distIndexPresent: boolean;
  };
  persistence: {
    authorityMode: string;
    postgresConfigured: boolean;
    postgresConnected: boolean;
    lastBackupTimestamp: string | null;
    journalBalanced: boolean;
  };
  exportArchive: {
    exists: boolean;
    verified: boolean;
    archiveName: string;
    bytes: number;
    sha256: string | null;
    fileCount: number;
    verifiedAt: string | null;
    downloadUrl: string | null;
  };
  gitRepository: {
    gitInitialized: boolean;
    branch: string | null;
    remoteConfigured: boolean;
    remoteNames: string[];
    latestCommit: string | null;
    dirtyEntriesCount: number | null;
    gitignoreProtected: boolean;
  };
  verificationReport: {
    available: boolean;
    executedAt: string | null;
    overallStatus: string | null;
    totalPassed: number;
    totalFailed: number;
    suitesCount: number;
  };
  artifactChecks?: {
    envExamplePresent: boolean;
    readmePresent: boolean;
    recoveryDocPresent: boolean;
    deploymentDocPresent: boolean;
    gitattributesPresent: boolean;
    packageScriptsReady: boolean;
    sequentialVerifierPresent: boolean;
    secretScannerPresent: boolean;
    zipExporterPresent: boolean;
  };
  warnings: string[];
  recentErrors: string[];
  milestones: {
    ENGINEERING_STABLE: boolean;
    EXPORT_READY: boolean;
    GITHUB_READY: boolean;
    GITHUB_PUBLISHED: boolean;
    DEPLOYMENT_READY: boolean;
    PRODUCTION_DEPLOYED: boolean;
  };
}

// ==========================================
// V20.0 UNIFIED ECONOMIC OPERATIONS INTERFACES
// ==========================================

export type V20VerificationState =
  | 'UNVERIFIED'
  | 'INFORMATION_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'VERIFICATION_REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED';

export type V20OrgStaffRole = 'OWNER' | 'MANAGER' | 'FINANCE' | 'OPERATIONS' | 'VIEWER';

export type V20TradeStage =
  | 'DISCOVERY'
  | 'ENQUIRY'
  | 'QUOTATION'
  | 'NEGOTIATION'
  | 'OFFER_ACCEPTED'
  | 'AGREEMENT_CREATED'
  | 'FULFILMENT_PLANNED'
  | 'FULFILMENT_IN_PROGRESS'
  | 'DELIVERY_EVIDENCE_SUBMITTED'
  | 'BUYER_CONFIRMATION'
  | 'RECONCILIATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'DISPUTED'
  | 'SUSPENDED'
  | 'FAILED';

export type V20ShipmentStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'COLLECTION_CONFIRMED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERY_CONFIRMED'
  | 'CLOSED'
  | 'DELAYED'
  | 'DAMAGED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface V20TradeStageEvent {
  stage: V20TradeStage;
  actorId: string;
  actorRole: string;
  note: string;
  timestamp: string;
}

export interface V20TradeRecord {
  id: string;
  tenantId: string;
  listingId?: string;
  farmPlotId?: string;
  cropRecordId?: string;
  cooperativeId?: string;
  cooperativePoolId?: string;
  buyerParticipantId: string;
  sellerParticipantId: string;
  organizationId?: string;
  title: string;
  category: string;
  sector: string;
  countryCode: string;
  district: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  currency: string;
  totalAmount: number;
  baseUgxEquivalent: number;
  fxRateUsed: number;
  stage: V20TradeStage;
  idempotencyKey: string;
  version: number;
  linkedShipmentId?: string;
  paymentObligationId?: string;
  disputeId?: string;
  isTestRecord: boolean;
  deliveryTerms: string;
  qualitySpec: string;
  agreementSummaryText?: string;
  agreementSummarySha256?: string;
  agreementRecordDisclaimer: string;
  crossBorderChecklistCleared: boolean;
  stageHistory: V20TradeStageEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface V20DeliveryEvidence {
  recipientName: string;
  quantityReceived: number;
  shortageQty: number;
  damageNotes: string;
  consentedLocation?: string;
  photoEvidenceHash?: string;
  capturedAt: string;
  offlineCaptured: boolean;
  submittedBy: string;
}

export interface V20LogisticsShipment {
  id: string;
  tenantId: string;
  tradeId: string;
  transporterParticipantId?: string;
  originCountry: string;
  originDistrict: string;
  destinationCountry: string;
  destinationDistrict: string;
  corridorCode: string;
  status: V20ShipmentStatus;
  version: number;
  estimatedWeightKg: number;
  agreedFreightAmount: number;
  currency: string;
  deliveryEvidence?: V20DeliveryEvidence;
  statusHistory: {
    status: V20ShipmentStatus;
    actorId: string;
    note: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface V20PaymentObligation {
  id: string;
  tenantId: string;
  tradeId: string;
  payerParticipantId: string;
  payeeParticipantId: string;
  currency: string;
  expectedAmount: number;
  receivedAmount: number;
  varianceAmount: number;
  outstandingAmount: number;
  disputedAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID_SANDBOX' | 'VARIANCE_OPEN' | 'RECONCILED' | 'DISPUTED';
  paymentChannel: 'SANDBOX_MOMO' | 'SANDBOX_BANK' | 'MANUAL_RECEIPT_RECORD' | 'TEST_LEDGER';
  ledgerEntryId?: string;
  ledgerScope: 'SANDBOX_RECONCILIATION' | 'TEST_VERIFICATION';
  sandboxDisclaimer: string;
  isTestRecord: boolean;
  receiptReferences: {
    ref: string;
    amount: number;
    channel: string;
    recordedBy: string;
    recordedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface V20CooperativeMemberContribution {
  id: string;
  farmerParticipantId: string;
  farmerName: string;
  cropRecordId?: string;
  qtyContributed: number;
  qualityGrade: string;
  contributedAt: string;
}

export interface V20CooperativeDistributionStatement {
  id: string;
  poolId: string;
  cooperativeId: string;
  farmerParticipantId: string;
  farmerUserId: string;
  farmerName: string;
  qtyContributed: number;
  shareRatio: number;
  grossEntitlementAmount: number;
  cooperativeServiceDeduction: number;
  netPayableAmount: number;
  currency: string;
  settlementStatus: 'CALCULATED' | 'SANDBOX_SCHEDULED' | 'RECONCILED';
  generatedAt: string;
}

export interface V20CooperativePool {
  id: string;
  tenantId: string;
  cooperativeId: string;
  title: string;
  category: string;
  unitCode: string;
  totalQty: number;
  currency: string;
  targetUnitPrice: number;
  linkedTradeId?: string;
  status: 'OPEN' | 'AGGREGATED' | 'TRADED' | 'DISTRIBUTED';
  contributions: V20CooperativeMemberContribution[];
  memberStatements: V20CooperativeDistributionStatement[];
  createdAt: string;
  updatedAt: string;
}

export interface V20SavedSearch {
  id: string;
  tenantId: string;
  userId: string;
  label: string;
  category?: string;
  countryCode?: string;
  district?: string;
  maxUnitPrice?: number;
  queryText: string;
  alertEnabled: boolean;
  createdAt: string;
}

export interface V20OfflineConflict {
  id: string;
  tenantId: string;
  actorUserId: string;
  actionType: string;
  entityId?: string;
  idempotencyKey: string;
  clientVersion: number;
  serverVersion: number;
  clientPayload: Record<string, any>;
  serverSnapshot?: Record<string, any>;
  resolutionState: 'CONFLICT_DETECTED' | 'RESOLVED_SERVER_WINS' | 'RESOLVED_CLIENT_MERGE' | 'DISCARDED';
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface V20PilotProgramme {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  countryCode: string;
  regionName: string;
  districts: string[];
  status: 'PLANNING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  supportContact: string;
  onboardedParticipants: {
    participantId: string;
    displayName: string;
    roleType: string;
    district: string;
    onboardedAt: string;
    supportNotes: string;
  }[];
  metrics: {
    actual: {
      onboardedCount: number;
      activeTradesCount: number;
      completedTradesCount: number;
      totalTradeVolumeUgx: number;
    };
    simulated: {
      sandboxPaymentsCount: number;
      sandboxVolumeUgx: number;
    };
    test: {
      verificationTradesCount: number;
    };
    target: {
      targetParticipants: number;
      targetCompletedTrades: number;
    };
    projection: {
      estimatedMonthlyGmUgx: number;
      projectionDisclaimer: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface V20InteroperabilityWebhook {
  id: string;
  tenantId: string;
  partnerName: string;
  endpointUrl: string;
  apiVersion: 'v1';
  events: string[];
  mode: 'SANDBOX';
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
}

export interface V20MigrationCheckpoint {
  id: string;
  fromSchemaVersion: number;
  toSchemaVersion: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'RECOVERED' | 'FAILED';
  v17BackupFilePath: string;
  v17BackupChecksumSha256: string;
  migrationChecksumSha256: string;
  preCounts: Record<string, number>;
  postCounts: Record<string, number>;
  preFinancialTotals: Record<string, number>;
  postFinancialTotals: Record<string, number>;
  financialTotalsPreserved: boolean;
  startedAt: string;
  completedAt?: string;
}

// ==========================================
// ECONEX V21.0 — CONTROLLED PILOT DEPLOYMENT, FIELD OPS & COMMERCIAL ACTIVATION
// ==========================================

export type V21PilotLifecycleState =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'READY'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'SUSPENDED'
  | 'CANCELLED';

export type V21PilotTemplateModel =
  | 'FARMER_TO_BUYER'
  | 'SME_TRADE'
  | 'COOPERATIVE_AGGREGATION';

export type V21ParticipantCategory =
  | 'INDIVIDUAL'
  | 'FARMER'
  | 'BUYER_TRADER'
  | 'SME_BUSINESS'
  | 'COOPERATIVE'
  | 'AGRO_DEALER'
  | 'LOGISTICS_OPERATOR'
  | 'SERVICE_PROVIDER'
  | 'INSTITUTIONAL'
  | 'FIELD_OFFICER';

export type V21VerificationStatus =
  | 'UNVERIFIED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED';

export type V21OfflineSyncStatus =
  | 'LOCAL_DRAFT'
  | 'QUEUED'
  | 'SYNCING'
  | 'SYNCED'
  | 'CONFLICT'
  | 'FAILED';

export type V21FieldTaskStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'CLOSED'
  | 'REJECTED'
  | 'REASSIGNED';

export interface V21GeoLocation {
  countryCode: string;
  region: string;
  district: string;
  subcounty: string;
  parish: string;
  village: string;
  gpsPermissionGranted?: boolean;
  gpsLat?: number;
  gpsLng?: number;
}

export interface V21AuditEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  fromState?: string;
  toState?: string;
  note: string;
  timestamp: string;
  immutableHash: string;
}

export interface V21MetricDefinition {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  definition: string;
  sourceRecord: string;
  timePeriod: string;
  geographicScope: string;
  pilotId: string;
  classification: 'ACTUAL' | 'SIMULATED' | 'TEST' | 'TARGET' | 'PROJECTION' | 'PENDING_EXTERNAL_SURVEY';
  calculationMethod: string;
}

export interface V21PilotRecord {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  modelTemplate: V21PilotTemplateModel;
  geography: V21GeoLocation;
  objectives: string[];
  participatingOrganizationIds: string[];
  participantCategories: V21ParticipantCategory[];
  pilotAdminIds: string[];
  fieldOfficerIds: string[];
  startDate: string;
  endDate: string;
  approvedEconomicActivities: string[];
  operationalRules: string[];
  maxParticipantsLimit: number;
  maxSingleTradeUgx: number;
  verificationRequirements: string[];
  riskClassification: 'LOW' | 'MEDIUM' | 'HIGH';
  supportContacts: { name: string; role: string; phoneOrChannel: string }[];
  status: V21PilotLifecycleState;
  statusReason?: string;
  performanceIndicators: V21MetricDefinition[];
  separatedSummary: {
    actual: {
      onboardedParticipants: number;
      verifiedParticipants: number;
      organizationsOnboarded: number;
      activeListings: number;
      activeTrades: number;
      completedTrades: number;
      realizedTradeVolumeUgx: number;
      reconciledObligationsCount: number;
      deliveriesCompleted: number;
      disputesOpened: number;
      disputesResolved: number;
    };
    simulated: {
      sandboxPaymentsCount: number;
      sandboxPaymentVolumeUgx: number;
    };
    test: {
      testTradesCount: number;
      testObligationsCount: number;
    };
    target: {
      targetParticipants: number;
      targetVerifiedRatePct: number;
      targetCompletedTrades: number;
    };
    projection: {
      estimatedMonthlyGmUgx: number;
      disclaimer: string;
    };
  };
  auditHistory: V21AuditEntry[];
  closureReport?: {
    closedBy: string;
    closedAt: string;
    summary: string;
    lessonsLearned: string[];
    pendingExternalOutcomeNotes: string[];
    reportChecksumSha256: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface V21ParticipantOnboarding {
  id: string;
  tenantId: string;
  pilotId: string;
  userId: string;
  participantId: string;
  fullName: string;
  phoneMasked: string;
  preferredLanguage: string;
  category: V21ParticipantCategory;
  organizationId?: string;
  organizationName?: string;
  geography: V21GeoLocation;
  consentAccepted: boolean;
  consentVersion: string;
  privacyNoticeAcceptedAt: string;
  verificationStatus: V21VerificationStatus;
  registrationIsNotIdentityVerification: true;
  evidenceSubmitted: {
    id: string;
    documentType: string;
    referenceNumberMasked: string;
    fileHashSha256: string;
    attestationStatus: 'SELF_DECLARED_UNVERIFIED' | 'INDEPENDENTLY_REVIEWED' | 'AUTHORITY_ATTESTED';
    uploadedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNote?: string;
  }[];
  activityPermissions: string[];
  suspended: boolean;
  suspensionReason?: string;
  recoveryRequests: { id: string; reason: string; status: 'REQUESTED' | 'VERIFIED' | 'COMPLETED'; requestedAt: string }[];
  auditHistory: V21AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface V21FieldActivityRecord {
  id: string;
  tenantId: string;
  pilotId: string;
  fieldOfficerId: string;
  participantId?: string;
  recordType: 'ONBOARDING_CAPTURE' | 'HARVEST_CAPTURE' | 'DELIVERY_PROOF' | 'SITE_VISIT' | 'ASSISTANCE_LOG';
  title: string;
  summary: string;
  payload: Record<string, any>;
  evidenceAttachmentMeta?: { fileName: string; mimeType: string; sizeBytes: number; sha256: string };
  gpsPermissionGranted: boolean;
  gpsCoordinates?: { lat: number; lng: number; accuracyMeters?: number };
  syncStatus: V21OfflineSyncStatus;
  idempotencyKey: string;
  clientVersion: number;
  serverVersion: number;
  retryCount: number;
  lastError?: string;
  conflictId?: string;
  syncedEntityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface V21FieldOfficerTask {
  id: string;
  tenantId: string;
  pilotId: string;
  officerUserId: string;
  officerDisplayName: string;
  assignedDistrict: string;
  assignedSubcounty?: string;
  participantId?: string;
  title: string;
  instructions: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: V21FieldTaskStatus;
  siteVisitNotes?: string;
  assistanceSummary?: string;
  followUpAction?: string;
  supervisorReviewNote?: string;
  supervisorId?: string;
  dueDate: string;
  history: V21AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface V21OperationalException {
  id: string;
  tenantId: string;
  pilotId: string;
  exceptionType:
    | 'VERIFICATION_BACKLOG'
    | 'DELIVERY_EXCEPTION'
    | 'OFFLINE_SYNC_FAILURE'
    | 'RECONCILIATION_EXCEPTION'
    | 'DISPUTE_ATTENTION'
    | 'SUPPORT_ESCALATION';
  title: string;
  description: string;
  sourceEntityId: string;
  district: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  ownerId: string;
  resolutionHistory: { actorId: string; note: string; status: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface V21SupportRequest {
  id: string;
  tenantId: string;
  pilotId: string;
  reporterUserId: string;
  reporterRole: string;
  category: 'SUPPORT' | 'COMPLAINT' | 'ABUSE_REPORT' | 'PRIVACY_EXPORT' | 'VERIFICATION_HELP';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'ASSIGNED' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  assignedOfficerId?: string;
  resolutionNotes: { actorId: string; note: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface V21CountryProfile {
  countryCode: string;
  countryName: string;
  regionalBloc: 'EAC' | 'EAC_AFCFTA';
  defaultCurrency: string;
  supportedUnits: string[];
  timezone: string;
  supportedLanguages: string[];
  geographicHierarchy: string[];
  businessProfileFields: string[];
  verificationRequirements: string[];
  operationalDocuments: string[];
  institutionalIntegrationStatus: 'NOT_CONNECTED_OPERATIONAL_GUIDANCE_ONLY';
  disclaimer: string;
}

export interface V21PostgresMigrationRun {
  id: string;
  mode: 'DRY_RUN_AUDIT' | 'LOCAL_TEST_PG' | 'CUTOVER_BLOCKED';
  status: 'COMPLETED' | 'RECOVERED_INTERRUPTED' | 'BLOCKED' | 'FAILED';
  databaseUrlConfigured: boolean;
  activeAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE';
  postgresCutoverComplete: false;
  collectionsAudited: number;
  mappedTablesCount: number;
  collectionMappings: {
    collectionName: string;
    postgresTable: string;
    recordCount: number;
    foreignKeysChecked: boolean;
    tenantIsolationField: string;
    checksumSha256: string;
  }[];
  duplicatePreventionVerified: boolean;
  interruptedRecoveryVerified: boolean;
  rollbackVerified: boolean;
  ledgerBalancedBefore: boolean;
  ledgerBalancedAfter: boolean;
  ledgerDebitUgx: number;
  ledgerCreditUgx: number;
  executedAt: string;
  notes: string;
}

// ==========================================
// ECONEX V22.0 — UNIVERSAL ECONOMIC ACTIVITY & GROWTH ENGINE (SCHEMA 20)
// ==========================================

export type V22MetricClassification =
  | 'ACTUAL'
  | 'SIMULATED'
  | 'TEST'
  | 'TARGET'
  | 'PROJECTION'
  | 'PENDING_EXTERNAL_SURVEY';

export type V22SectorCode =
  | 'AGRI_LIVESTOCK'
  | 'FOOD_PROCESSING'
  | 'MANUFACTURING'
  | 'WHOLESALE_DISTRIBUTION'
  | 'RETAIL_CONSUMER'
  | 'CONSTRUCTION_CIVIL'
  | 'REAL_ESTATE'
  | 'TRANSPORT_LOGISTICS'
  | 'WAREHOUSING_SUPPLY'
  | 'ENERGY_UTILITIES'
  | 'WATER_ENVIRONMENT'
  | 'MINING_EXTRACTIVES'
  | 'FORESTRY_TIMBER'
  | 'HEALTHCARE_MEDICAL'
  | 'PHARMA_BIOTECH'
  | 'EDUCATION_TRAINING'
  | 'ICT_SOFTWARE'
  | 'TELECOM_MEDIA'
  | 'FINANCIAL_COORDINATION'
  | 'PROFESSIONAL_ADVISORY'
  | 'TOURISM_HOSPITALITY'
  | 'CREATIVE_ARTS'
  | 'SECURITY_FACILITIES'
  | 'AUTOMOTIVE_MACHINERY'
  | 'TEXTILES_APPAREL'
  | 'CHEMICALS_PLASTICS'
  | 'COOPERATIVES_NGOS'
  | 'PUBLIC_INSTITUTIONAL'
  | string;

export interface V22SectorDefinition {
  id: string;
  code: V22SectorCode;
  name: string;
  categoryGroup:
    | 'PRIMARY_PRODUCTION'
    | 'INDUSTRY_CONSTRUCTION'
    | 'COMMERCE_LOGISTICS'
    | 'SERVICES_TECHNOLOGY'
    | 'SOCIAL_PUBLIC_INSTITUTIONS';
  description: string;
  subsectors: string[];
  supportedActivityTypes: string[];
  sensitiveDataIsolationRequired: boolean;
  complianceNotes: string;
  isCustomAdded: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface V22BusinessProfile {
  id: string;
  tenantId: string;
  ownerUserId: string;
  name: string;
  legalEntityType:
    | 'SOLE_PROPRIETORSHIP'
    | 'PARTNERSHIP'
    | 'LIMITED_COMPANY'
    | 'COOPERATIVE'
    | 'NGO_ASSOCIATION'
    | 'PUBLIC_INSTITUTION';
  primarySectorCode: V22SectorCode;
  secondarySectorCodes: V22SectorCode[];
  subsectors: string[];
  activityCategories: string[];
  countryCode: string;
  district: string;
  operatingLocations: string[];
  currenciesSupported: string[];
  registrationReference?: string;
  taxReference?: string;
  registrationVerified: boolean;
  productLicenceVerified: boolean;
  verificationStatus: 'SELF_DECLARED' | 'PENDING_REVIEW' | 'IDENTITY_VERIFIED' | 'LICENCE_VERIFIED' | 'SUSPENDED';
  operationalStatus: 'ACTIVE' | 'PAUSED' | 'SUSPENDED';
  summary: string;
  capabilities: string[];
  traceableDocuments: {
    id: string;
    docType: 'REGISTRATION' | 'TAX_CLEARANCE' | 'SECTOR_LICENCE' | 'QUALITY_CERT' | 'SAFETY_RECORD';
    title: string;
    referenceMasked: string;
    sha256: string;
    verified: boolean;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface V22IndividualProfile {
  id: string;
  tenantId: string;
  userId: string;
  fullName: string;
  professionalTitle: string;
  sectorCodes: V22SectorCode[];
  skills: string[];
  countryCode: string;
  district: string;
  isIndividualNonRegistered: true;
  hourlyOrUnitRate: number;
  currency: string;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  portfolioItems: {
    id: string;
    title: string;
    sectorCode: string;
    completedYear: string;
    summary: string;
    evidenceHashSha256: string;
  }[];
  identityVerified: boolean;
  verificationNote: string;
  createdAt: string;
  updatedAt: string;
}

export type V22ListingOfferKind =
  | 'GOODS'
  | 'SERVICE'
  | 'EQUIPMENT_RENTAL'
  | 'WHOLESALE_LOT'
  | 'RETAIL_ITEM'
  | 'DIGITAL_OFFER'
  | 'PROFESSIONAL_SERVICE'
  | 'CONTRACT_OFFER';

export interface V22ProductOrService {
  id: string;
  tenantId: string;
  sectorCode: V22SectorCode;
  subsector: string;
  offerKind: V22ListingOfferKind;
  transactionMode: 'B2B' | 'B2C' | 'INSTITUTIONAL' | 'B2B_B2C';
  sellerType: 'BUSINESS' | 'INDIVIDUAL' | 'COOPERATIVE' | 'INSTITUTION';
  sellerProfileId: string;
  sellerUserId: string;
  sellerName: string;
  title: string;
  description: string;
  pricingModel: 'FIXED' | 'QUOTE_BASED' | 'HOURLY' | 'MILESTONE';
  unitPrice: number;
  currency: string;
  unitLabel: string;
  minOrderQty: number;
  availableQty?: number | null;
  countryCode: string;
  district: string;
  deliveryRegions: string[];
  identityVerified: boolean;
  productOrLicenceVerified: boolean;
  qualityClassification: string;
  moderationStatus: 'ACTIVE' | 'FLAGGED_UNDER_REVIEW' | 'REMOVED';
  fraudReportsCount: number;
  isTestRecord?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface V22FraudReport {
  id: string;
  tenantId: string;
  targetType: 'LISTING' | 'BUSINESS' | 'INDIVIDUAL' | 'TENDER';
  targetId: string;
  reporterUserId: string;
  reasonCategory: 'MISLEADING_TERMS' | 'SUSPECTED_FRAUD' | 'UNLICENSED_CLAIM' | 'ABUSIVE_CONTENT' | 'SENSITIVE_DATA_EXPOSURE';
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'DISMISSED';
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type V22CommercialStage =
  | 'PARTICIPANT_REGISTERED'
  | 'DISCOVERY'
  | 'ENQUIRY'
  | 'QUOTATION'
  | 'NEGOTIATION'
  | 'AGREEMENT_CONFIRMED'
  | 'ORDER_OR_ENGAGEMENT_ACTIVE'
  | 'OBLIGATIONS_ASSIGNED'
  | 'EXECUTION_IN_PROGRESS'
  | 'MILESTONE_EVIDENCE_SUBMITTED'
  | 'DELIVERY_OR_SERVICE_ACCEPTED'
  | 'INVOICE_ISSUED'
  | 'EXTERNAL_PAYMENT_REFERENCED'
  | 'RECONCILIATION_COMPLETED'
  | 'COMPLETED'
  | 'PERFORMANCE_TRUST_RECORDED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface V22CommercialAgreementSnapshot {
  version: number;
  templateCode: string;
  title: string;
  termsSummary: string;
  scopeOfWorkOrGoods: string;
  agreedAmount: number;
  currency: string;
  deliveryOrScheduleTerms: string;
  buyerAccepted: boolean;
  sellerAccepted: boolean;
  lockedAfterAcceptance: boolean;
  sha256Hash: string;
  legalDisclaimer: string;
  recordedAt: string;
}

export interface V22EconomicActivity {
  id: string;
  tenantId: string;
  activityCode: string;
  sectorCode: V22SectorCode;
  activityType:
    | 'GOODS_TRADE'
    | 'SERVICE_ENGAGEMENT'
    | 'WHOLESALE_SUPPLY'
    | 'RETAIL_ORDER'
    | 'EQUIPMENT_HIRE'
    | 'PROJECT_CONTRACT'
    | 'PROCUREMENT_AWARD';
  title: string;
  listingId?: string;
  buyerUserId: string;
  buyerName: string;
  sellerUserId: string;
  sellerName: string;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  countryCode: string;
  district: string;
  stage: V22CommercialStage;
  configuredStages: V22CommercialStage[];
  agreement?: V22CommercialAgreementSnapshot;
  evidenceRecords: {
    id: string;
    stage: V22CommercialStage;
    summary: string;
    sha256: string;
    submittedBy: string;
    submittedAt: string;
  }[];
  invoiceId?: string;
  paymentReferenceId?: string;
  idempotencyKey: string;
  version: number;
  isTestRecord?: boolean;
  history: {
    stage: V22CommercialStage;
    actorId: string;
    actorRole: string;
    note: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface V22ProcurementOpportunity {
  id: string;
  tenantId: string;
  referenceNumber: string;
  sectorCode: V22SectorCode;
  issuerProfileId: string;
  issuerName: string;
  issuerKind: 'PRIVATE_BUSINESS' | 'COOPERATIVE' | 'NGO' | 'INSTITUTION_ADVISORY';
  opportunityType: 'RFQ' | 'TENDER' | 'SERVICE_CALL' | 'SUBCONTRACT_CALL';
  title: string;
  scopeDescription: string;
  budgetAmount: number;
  currency: string;
  countryCode: string;
  district: string;
  submissionDeadline: string;
  evaluationCriteria: { criterion: string; weightPct: number }[];
  status: 'OPEN' | 'EVALUATION' | 'AWARDED' | 'CLOSED' | 'CANCELLED';
  awardedBidId?: string;
  linkedActivityId?: string;
  nonOfficialGovernmentDisclaimer: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface V22ProcurementBid {
  id: string;
  tenantId: string;
  tenderId: string;
  bidderProfileId: string;
  bidderUserId: string;
  bidderName: string;
  proposedAmount: number;
  currency: string;
  deliveryLeadDays: number;
  technicalSummary: string;
  supportingEvidenceHash: string;
  evaluationScore?: number;
  evaluationJustification?: string;
  evaluatedBy?: string;
  status: 'SUBMITTED' | 'SHORTLISTED' | 'AWARDED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface V22ProjectMilestone {
  id: string;
  sequence: number;
  title: string;
  deliverable: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'EVIDENCE_SUBMITTED' | 'INSPECTED' | 'ACCEPTED' | 'REJECTED';
  evidenceHash?: string;
  evidenceNotes?: string;
  acceptedBy?: string;
  acceptedAt?: string;
}

export interface V22ProjectVariation {
  id: string;
  requestedBy: string;
  reason: string;
  scopeDelta: string;
  budgetDelta: number;
  scheduleDeltaDays: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface V22ProjectRecord {
  id: string;
  tenantId: string;
  projectCode: string;
  sectorCode: V22SectorCode;
  title: string;
  clientName: string;
  clientUserId: string;
  contractorName: string;
  contractorUserId: string;
  countryCode: string;
  district: string;
  totalBudget: number;
  currency: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  milestones: V22ProjectMilestone[];
  variations: V22ProjectVariation[];
  linkedActivityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface V22InvoiceRecord {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  activityId?: string;
  projectId?: string;
  issuerUserId: string;
  issuerName: string;
  recipientUserId: string;
  recipientName: string;
  sectorCode: V22SectorCode;
  lineItems: { description: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxRatePct: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  exchangeRateToUgx: number;
  exchangeRateSource: string;
  status: 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'DISPUTED' | 'VOID';
  dueDate: string;
  journalEntryId?: string;
  isTestRecord?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface V22PaymentReference {
  id: string;
  tenantId: string;
  invoiceId: string;
  activityId?: string;
  externalChannel: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE_EFT' | 'SANDBOX_RAIL' | 'EXTERNAL_POS_RECEIPT';
  externalProviderName: string;
  externalReferenceNumber: string;
  amount: number;
  currency: string;
  evidenceSha256: string;
  reconciliationStatus: 'RECORDED_EXTERNAL_REF' | 'VERIFIED_RECONCILED' | 'VARIANCE_FLAGGED';
  nonCustodialNotice: string;
  journalEntryId?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface V22FxRateRecord {
  currencyCode: string;
  currencyName: string;
  symbol: string;
  rateToUgx: number;
  rateSource: string;
  classification: 'ACTUAL_REFERENCE' | 'INDICATIVE_MARKET' | 'SANDBOX_FIXED';
  updatedAt: string;
}

export interface V22WorkforceTask {
  id: string;
  tenantId: string;
  businessProfileId: string;
  assigneeName: string;
  assigneeRole: string;
  title: string;
  sectorCode: V22SectorCode;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface V22EconomicInsight {
  id: string;
  tenantId: string;
  sectorCode: V22SectorCode;
  title: string;
  insightType: 'SUPPLY_GAP' | 'PROCUREMENT_DEMAND' | 'SECTOR_OPPORTUNITY' | 'CORRIDOR_BOTTLENECK' | 'GROWTH_SIGNAL';
  summary: string;
  evidenceBasis: string;
  sourceRecordIds: string[];
  dataDate: string;
  geographicCoverage: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  limitations: string;
  classification: V22MetricClassification;
  recommendedNextStep: string;
  requiresHumanConfirmation: true;
  acknowledgedBy?: string;
  createdAt: string;
}

export interface V22EconomicRelationship {
  id: string;
  tenantId: string;
  sourceEntityId: string;
  sourceEntityName: string;
  sourceEntityType: 'INDIVIDUAL' | 'BUSINESS' | 'COOPERATIVE' | 'INSTITUTION' | 'PROJECT';
  targetEntityId: string;
  targetEntityName: string;
  targetEntityType: 'INDIVIDUAL' | 'BUSINESS' | 'COOPERATIVE' | 'INSTITUTION' | 'PROJECT';
  relationshipType: 'SUPPLIER_TO' | 'SERVICE_CONTRACTOR_FOR' | 'BUYER_OF' | 'PROCUREMENT_PARTNER' | 'PROJECT_PARTNER' | 'FINANCE_COORDINATOR';
  sectorCode: V22SectorCode;
  verifiedByTransactionCount: number;
  sensitiveMaskApplied: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface V22SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  targetAudience: string;
  monthlyFeeUgx: number;
  annualFeeUgx: number;
  currency: string;
  includedCapabilities: string[];
  classification: 'PROPOSED_CONFIGURABLE_PLAN';
  activeSubscribersCount: number;
  createdAt: string;
}

export interface V22BusinessSubscription {
  id: string;
  tenantId: string;
  subscriberProfileId: string;
  planId: string;
  status: 'CONFIGURED_TRIAL' | 'ACTIVE_PENDING_BILLING' | 'CANCELLED';
  billingNotice: string;
  createdAt: string;
}

export interface V22InteroperabilityEvent {
  id: string;
  tenantId: string;
  partnerId: string;
  eventType: string;
  idempotencyKey: string;
  signatureValid: boolean;
  payloadSummary: string;
  receivedAt: string;
}

export interface V22AiAssistantQueryResult {
  id: string;
  query: string;
  promptInjectionDetected: boolean;
  blockedReason?: string;
  answer: string;
  modelUsed: string;
  evidenceIdsCited: string[];
  limitations: string[];
  suggestedAction?: {
    actionLabel: string;
    endpointHint: string;
    requiresExplicitHumanConfirmation: true;
  };
  generatedAt: string;
}

// ==========================================
// ECONEX V23.0 — UNIVERSAL ECONOMIC IDENTITY, WALLET NETWORK & CARD INFRASTRUCTURE (SCHEMA 21)
// ==========================================

export type V23ParticipantCategory =
  | 'INDIVIDUAL'
  | 'SOLE_TRADER'
  | 'SMALL_BUSINESS'
  | 'MEDIUM_BUSINESS'
  | 'CORPORATION'
  | 'PARTNERSHIP'
  | 'COOPERATIVE'
  | 'ASSOCIATION'
  | 'INSTITUTION'
  | 'APPROVED_ORGANIZATION';

export type V23AuthorizedEconomicRole =
  | 'INDIVIDUAL'
  | 'BUSINESS_OWNER'
  | 'SUPPLIER'
  | 'EMPLOYEE'
  | 'SERVICE_PROVIDER'
  | 'COOPERATIVE_MEMBER'
  | 'MERCHANT'
  | 'INSTITUTIONAL_APPROVER';

export type V23VerificationStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
export type V23AccountLifecycleStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED' | 'CLOSED_RETAINED';

export interface V23ParticipantIdentity {
  id: string;
  tenantId: string;
  userId?: string;
  category: V23ParticipantCategory;
  authorizedRoles: V23AuthorizedEconomicRole[];
  displayName: string;
  legalName: string;
  emailMasked: string;
  phoneMasked: string;
  phoneHash: string;
  countryCode: string;
  activeCountryContext: string;
  districtOrCity: string;
  identityVerificationStatus: V23VerificationStatus;
  businessVerificationStatus: 'NOT_APPLICABLE' | V23VerificationStatus;
  accountStatus: V23AccountLifecycleStatus;
  statusReason?: string;
  deviceFingerprintHash: string;
  recoveryEmailHint?: string;
  consentGiven: boolean;
  consentTimestamp: string;
  retentionLockUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export type V23WalletCategory = 'INDIVIDUAL' | 'BUSINESS' | 'COOPERATIVE' | 'INSTITUTIONAL';

export interface V23WalletNumberAllocation {
  id: string;
  euwn: string; // EX-XXXXXXXXXXXX (non-predictable permanent Universal Wallet Number)
  participantIdentityId: string;
  walletAccountId: string;
  walletCategory: V23WalletCategory;
  permanent: true;
  reassigned: false;
  countryIndependent: true;
  phoneChangeCount: number;
  deviceMigrationCount: number;
  travelCountryHistory: string[];
  issuedAt: string;
}

export type V23CurrencyCode = 'UGX' | 'KES' | 'TZS' | 'RWF' | 'BIF' | 'SSP' | 'CDF' | 'USD' | 'EUR';

export interface V23WalletAccount {
  id: string;
  tenantId: string;
  participantIdentityId: string;
  euwn: string;
  walletCategory: V23WalletCategory;
  label: string;
  displayName: string;
  status: V23AccountLifecycleStatus;
  statusReason?: string;
  ownerUserId: string;
  linkedEntityId?: string; // e.g., BIZ-V22-* or coop/institution id
  staffPermissions: {
    userId: string;
    role: 'OWNER' | 'OPERATOR' | 'APPROVER' | 'AUDITOR';
    canInitiate: boolean;
    canApprove: boolean;
  }[];
  dualApprovalThresholdMinor: number;
  primaryCountryCode: string;
  activeCountryCode: string;
  pinHash: string;
  pinSalt: string;
  pinSet: boolean;
  mfaEnabled: boolean;
  newDeviceRestrictedUntil?: string;
  dailyLimitMinorByCurrency: Partial<Record<V23CurrencyCode, number>>;
  isTestMode: true;
  createdAt: string;
  updatedAt: string;
}

export interface V23CurrencySubaccount {
  id: string;
  tenantId: string;
  walletAccountId: string;
  euwn: string;
  currency: V23CurrencyCode;
  minorUnitScale: 100;
  availableMinor: number;
  pendingMinor: number;
  reservedMinor: number;
  restrictedMinor: number;
  reversedMinor: number;
  testOnlyBalanceMinor: number;
  ledgerAccountId: string;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface V23RegulatoryGateItem {
  gateCode: string;
  title: string;
  completed: boolean;
  evidenceRef?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes: string;
}

export interface V23CountryOperatingProfile {
  countryCode: string;
  countryName: string;
  regionalBloc: 'EAC' | 'EAC_AFCFTA' | 'AFCFTA';
  countryActivationStatus: 'NOT_ACTIVATED' | 'SANDBOX_CONFIGURED' | 'REGULATORY_REVIEW';
  operationalAvailabilityStatus: 'SANDBOX_ONLY_NOT_LIVE';
  sandboxWalletAvailable: boolean;
  supportedCurrencies: V23CurrencyCode[];
  defaultCurrency: V23CurrencyCode;
  localWalletEligibilityRules: string[];
  verificationRequirements: string[];
  permittedTransactionTypes: V23TransactionType[];
  perTxLimitMinor: Partial<Record<V23CurrencyCode, number>>;
  dailyLimitMinor: Partial<Record<V23CurrencyCode, number>>;
  feeScheduleSummary: string;
  taxAndReportingNotes: string;
  localDisputeProcedure: string;
  cardPermissions: 'SANDBOX_SIMULATION_ONLY';
  withdrawalPermissions: 'DISABLED_PENDING_LICENCE';
  regulatoryStatus: 'PRE_REGULATORY_CLASSIFICATION_AND_LICENSING';
  regulatoryAuthorityRef: string;
  customerProtectionRequirements: string[];
  dataHandlingRules: string;
  activationGates: V23RegulatoryGateItem[];
  updatedAt: string;
}

export type V23TransactionType =
  | 'WALLET_TO_WALLET'
  | 'INDIVIDUAL_TO_BUSINESS'
  | 'BUSINESS_TO_BUSINESS'
  | 'CUSTOMER_TO_MERCHANT'
  | 'COMMERCIAL_ORDER_PAYMENT'
  | 'INVOICE_SETTLEMENT_RECORD'
  | 'COOPERATIVE_ALLOCATION'
  | 'REFUND'
  | 'REVERSAL'
  | 'CASH_WITHDRAWAL_RECORD'
  | 'CASH_DEPOSIT_RECORD'
  | 'CARD_PURCHASE_RECORD'
  | 'CROSS_COUNTRY_INTERNAL_TRANSFER';

export type V23TransactionStatus =
  | 'CREATED'
  | 'INITIATED'
  | 'VALIDATED'
  | 'PENDING_AUTHORIZATION'
  | 'AUTHORIZED'
  | 'RISK_CHECKED'
  | 'APPROVED'
  | 'PROCESSING'
  | 'POSTED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'DISPUTED'
  | 'REVERSED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'EXPIRED';

export interface V23TransactionHistoryEntry {
  fromStatus: V23TransactionStatus | null;
  toStatus: V23TransactionStatus;
  actorUserId: string;
  reason: string;
  timestamp: string;
}

export interface V23WalletTransaction {
  id: string;
  tenantId: string;
  txReference: string;
  idempotencyKey: string;
  correlationId: string;
  txType: V23TransactionType;
  status: V23TransactionStatus;
  sourceWalletId: string;
  sourceEuwn: string;
  sourceSubaccountId: string;
  sourceCurrency: V23CurrencyCode;
  sourceAmountMinor: number;
  feeMinor: number;
  feeCurrency: V23CurrencyCode;
  destinationWalletId: string;
  destinationEuwn: string;
  destinationSubaccountId: string;
  destinationCurrency: V23CurrencyCode;
  destinationAmountMinor: number;
  fxApplied: boolean;
  fxRateApplied: number;
  fxRateSource: string;
  fxRateTimestamp: string;
  fxRateClassification: 'NONE' | 'SYNTHETIC_TEST_RATE';
  fxUserConfirmed: boolean;
  sourceCountryCode: string;
  destinationCountryCode: string;
  purpose: string;
  settlementClassification: 'SANDBOX_INTERNAL_LEDGER' | 'BLOCKED_REAL_VALUE_GATE';
  isTestTransaction: true;
  linkedModuleRef?: {
    module: 'MARKETPLACE' | 'INVOICE' | 'PROCUREMENT' | 'LOGISTICS' | 'COOPERATIVE' | 'PROJECT' | 'BUSINESS' | 'MERCHANT_QR' | 'CARD';
    recordId: string;
    label: string;
  };
  journalEntryId?: string;
  reversedByTransactionId?: string;
  parentTransactionId?: string;
  refundedMinorTotal: number;
  riskScore: number;
  riskFlags: string[];
  approvalRequired: boolean;
  approvedByUserId?: string;
  history: V23TransactionHistoryEntry[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface V23LedgerPosting {
  id: string;
  tenantId: string;
  transactionId: string;
  txReference: string;
  journalEntryId: string;
  lines: {
    subaccountId: string;
    walletAccountId: string;
    direction: 'DEBIT' | 'CREDIT';
    amountMinor: number;
    currency: V23CurrencyCode;
    memo: string;
  }[];
  totalDebitMinor: number;
  totalCreditMinor: number;
  balanced: boolean;
  immutable: true;
  postingHashSha256: string;
  postedAt: string;
}

export interface V23MerchantAccount {
  id: string;
  tenantId: string;
  walletAccountId: string;
  euwn: string;
  merchantName: string;
  sectorCode: string;
  countryCode: string;
  districtOrCity: string;
  verificationStatus: V23VerificationStatus;
  status: 'ACTIVE_SANDBOX' | 'SUSPENDED' | 'CLOSED';
  suspensionReason?: string;
  perTxLimitMinor: number;
  dailyLimitMinor: number;
  acceptedCurrencies: V23CurrencyCode[];
  sandboxVolumeMinorByCurrency: Partial<Record<V23CurrencyCode, number>>;
  sandboxTxCount: number;
  sandboxRefundCount: number;
  modeLabel: 'SANDBOX_TEST_MODE_ONLY';
  createdAt: string;
  updatedAt: string;
}

export interface V23MerchantTerminal {
  id: string;
  tenantId: string;
  merchantId: string;
  terminalCode: string;
  terminalType: 'STATIC_QR_POINT' | 'DYNAMIC_POS_SIM' | 'WEB_CHECKOUT_SIM';
  label: string;
  locationLabel: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DECOMMISSIONED';
  lastActivityAt: string;
  createdAt: string;
}

export interface V23QrPaymentRequest {
  id: string;
  tenantId: string;
  paymentReference: string;
  merchantId: string;
  merchantName: string;
  merchantEuwn: string;
  terminalId: string;
  qrKind: 'STATIC' | 'DYNAMIC';
  amountMinor: number;
  currency: V23CurrencyCode;
  feePreviewMinor: number;
  description: string;
  countryCode: string;
  payloadJson: string;
  payloadSignatureSha256: string;
  status: 'ACTIVE' | 'AUTHORIZED' | 'COMPLETED_SANDBOX' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  linkedTransactionId?: string;
  receiptNumber?: string;
  expiresAt: string;
  modeLabel: 'SANDBOX_TEST_MODE_ONLY';
  createdAt: string;
  updatedAt: string;
}

export type V23CardStatus =
  | 'ISSUED_TEST'
  | 'ACTIVE_TEST'
  | 'FROZEN'
  | 'SUSPENDED'
  | 'REPORTED_LOST'
  | 'REPORTED_STOLEN'
  | 'REPLACEMENT_REQUESTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface V23VirtualCard {
  id: string;
  tenantId: string;
  walletAccountId: string;
  euwn: string;
  participantIdentityId: string;
  cardholderName: string;
  tokenizedCardRef: string;
  maskedPan: string; // Unmistakably fictional test format e.g. 4999 00XX XXXX 4242
  expiryPlaceholder: string;
  cardStatus: V23CardStatus;
  allowedCurrencies: V23CurrencyCode[];
  allowedCountries: string[];
  blockedMccs: string[];
  perTxLimitMinor: number;
  dailyLimitMinor: number;
  onlinePaymentsEnabled: boolean;
  contactlessConfigured: boolean;
  testMode: true;
  externalNetworkUsable: false;
  nonIssuanceNotice: string;
  createdAt: string;
  updatedAt: string;
}

export type V23PhysicalCardStage =
  | 'APPLIED'
  | 'ELIGIBILITY_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PRODUCTION_REQUESTED'
  | 'PERSONALIZATION'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'ACTIVATED'
  | 'PIN_SETUP_VERIFIED'
  | 'SUSPENDED'
  | 'REPLACEMENT_REQUESTED'
  | 'RENEWED'
  | 'CANCELLED';

export interface V23PhysicalCard {
  id: string;
  tenantId: string;
  walletAccountId: string;
  euwn: string;
  participantIdentityId: string;
  cardholderName: string;
  tokenizedCardRef: string;
  maskedPan: string;
  stage: V23PhysicalCardStage;
  cardStatus: V23CardStatus;
  emvChipConfigured: boolean;
  contactlessConfigured: boolean;
  atmInterfaceStatus: 'INACTIVE_NOT_LIVE';
  issuerInterfaceStatus: 'INACTIVE_PENDING_PARTNER_AND_LICENCE';
  acquirerInterfaceStatus: 'INACTIVE_SANDBOX_ONLY';
  schemeCertified: false;
  physicalCardLiveIssued: false;
  dispatchTrackingRef?: string;
  deliveryCountryCode: string;
  deliveryDistrict: string;
  pinConfiguredHash?: string;
  nonCertificationNotice: string;
  history: { stage: V23PhysicalCardStage; actorUserId: string; note: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface V23ComplianceReview {
  id: string;
  tenantId: string;
  subjectType: 'IDENTITY' | 'BUSINESS' | 'TRANSACTION' | 'MERCHANT';
  subjectId: string;
  reviewType: 'CDD' | 'KYB' | 'UBO' | 'PEP_INTERFACE_STUB' | 'SANCTIONS_INTERFACE_STUB' | 'SUSPICIOUS_TX_REVIEW';
  riskScore: number;
  riskReasons: string[];
  automatedRecommendation: string;
  humanDecision: 'PENDING_HUMAN_REVIEW' | 'CLEARED' | 'RESTRICTED' | 'ESCALATED' | 'APPEAL_OPEN';
  requiresHumanReview: true;
  reviewedByUserId?: string;
  decisionReason?: string;
  appealNotes?: string;
  liveScreeningClaimed: false;
  screeningNotice: string;
  createdAt: string;
  updatedAt: string;
}

export interface V23RiskEvent {
  id: string;
  tenantId: string;
  walletAccountId?: string;
  transactionId?: string;
  eventKind: 'VELOCITY_ALERT' | 'DUPLICATE_TX' | 'NEW_DEVICE_RESTRICTION' | 'COUNTRY_BLOCK' | 'CARD_FROZEN_BLOCK' | 'RATE_LIMIT_ABUSE' | 'ENUMERATION_DEFENSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
  resolved: boolean;
  createdAt: string;
}

export interface V23ReconciliationRecord {
  id: string;
  tenantId: string;
  scope: 'FULL_WALLET_NETWORK' | 'MERCHANT_BATCH' | 'CURRENCY_SUBLEDGER';
  status: 'BALANCED' | 'EXCEPTION_DETECTED' | 'RESOLVED';
  journalBalanced: boolean;
  totalSubaccountsChecked: number;
  totalPostingsChecked: number;
  imbalanceCount: number;
  exceptions: string[];
  executedBy: string;
  executedAt: string;
}

export interface V23WalletAuditEvent {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  correlationId: string;
  prevHash: string;
  entryHash: string;
  createdAt: string;
}

export interface V23FeeConfiguration {
  id: string;
  serviceType: V23TransactionType | 'CARD_VIRTUAL_TEST' | 'CARD_PHYSICAL_TEST' | 'MERCHANT_QR';
  countryCode: string;
  currency: V23CurrencyCode;
  participantCategory: V23ParticipantCategory | 'ALL';
  flatFeeMinor: number;
  percentBps: number; // basis points (e.g., 50 = 0.50%)
  minFeeMinor: number;
  maxFeeMinor: number;
  classification: 'CONFIGURABLE_SANDBOX_SCHEDULE';
  activeRevenueRecognizedMinor: 0;
  updatedBy: string;
  updatedAt: string;
}

export type V23SupportCategory =
  | 'INCORRECT_RECIPIENT'
  | 'MISSING_TRANSACTION'
  | 'DUPLICATE_TRANSACTION'
  | 'UNAUTHORIZED_ACTIVITY'
  | 'MERCHANT_DISPUTE'
  | 'REFUND_COMPLAINT'
  | 'CARD_LOSS_THEFT'
  | 'ACCOUNT_TAKEOVER'
  | 'ACCOUNT_RECOVERY'
  | 'VERIFICATION_APPEAL'
  | 'SUSPENSION_APPEAL'
  | 'DATA_CORRECTION';

export interface V23SupportDisputeCase {
  id: string;
  tenantId: string;
  caseReference: string;
  category: V23SupportCategory;
  participantIdentityId: string;
  walletAccountId?: string;
  linkedTransactionId?: string;
  assignedSupportRole: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  summary: string;
  evidenceRefs: string[];
  resolutionNotes?: string;
  escalationHistory: { role: string; note: string; at: string }[];
  closureReason?: string;
  consumerProtectionNotice: string;
  submittedAt: string;
  updatedAt: string;
}

export interface V23OfflineQueueItem {
  id: string;
  tenantId: string;
  deviceId: string;
  clientDraftId: string;
  sourceWalletId: string;
  recipientEuwn: string;
  amountMinor: number;
  currency: V23CurrencyCode;
  countryCode: string;
  purpose: string;
  syncStatus: 'QUEUED_LOCAL' | 'SUBMITTED' | 'SERVER_POSTED' | 'SERVER_REJECTED' | 'CONFLICT_DETECTED';
  linkedTransactionId?: string;
  conflictOrRejectReason?: string;
  queuedAt: string;
  syncedAt?: string;
}

export type V23IntegrationState =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED_TEST'
  | 'TEST_VERIFIED'
  | 'PENDING_APPROVAL'
  | 'LIVE_APPROVED'
  | 'SUSPENDED';

export interface V23IntegrationInterface {
  id: string;
  code: string;
  name: string;
  category: 'PAYMENT_SWITCH' | 'CARD_ISSUER_PROCESSOR' | 'CARD_ACQUIRER' | 'ATM_NETWORK' | 'KYC_REGISTRY' | 'SANCTIONS_SCREENING' | 'SETTLEMENT_BANK' | 'FX_RATE_FEED';
  countryCode: string;
  state: V23IntegrationState;
  liveEnabled: boolean;
  providerPlaceholder: string;
  regulatoryPrereq: string;
  updatedAt: string;
}

export interface V23ReversalOrRefund {
  id: string;
  tenantId: string;
  kind: 'FULL_REVERSAL' | 'PARTIAL_REFUND' | 'FULL_REFUND';
  originalTransactionId: string;
  refundTransactionId: string;
  amountMinor: number;
  currency: V23CurrencyCode;
  reason: string;
  merchantId?: string;
  approvedByUserId: string;
  createdAt: string;
}

export interface V23PostgresMigrationRun {
  id: string;
  mode: 'DRY_RUN_AUDIT' | 'LOCAL_TEST_PG' | 'CUTOVER_BLOCKED';
  status: 'COMPLETED' | 'BLOCKED' | 'RECOVERED_INTERRUPTED';
  databaseUrlConfigured: boolean;
  activeAuthority: 'LOCAL_JSON_WAL_AUTHORITATIVE';
  postgresCutoverComplete: false;
  schemaVersionTarget: 21;
  collectionsAudited: number;
  mappedTablesCount: number;
  collectionMappings: {
    collectionName: string;
    postgresTable: string;
    recordCount: number;
    foreignKeysChecked: boolean;
    checksumSha256: string;
  }[];
  uniqueEuwnVerified: boolean;
  uniqueTxRefVerified: boolean;
  rollbackVerified: boolean;
  ledgerBalancedBefore: boolean;
  ledgerBalancedAfter: boolean;
  executedAt: string;
  notes: string;
}

export interface V23ContinuityTestRun {
  id: string;
  scenarioCode: string;
  scenarioTitle: string;
  passed: boolean;
  expectedTransactionState: string;
  observedTransactionState: string;
  recoveryProcedure: string;
  auditEvidenceId: string;
  userFacingOutcome: string;
  durationMs: number;
  executedAt: string;
}




