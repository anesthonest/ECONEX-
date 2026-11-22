/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V23.0 - Non-Destructive Schema 21 Idempotent Seed
 * Universal Economic Identity, Multi-Country Wallet Network & Card Infrastructure
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import type {
  V23ComplianceReview,
  V23CountryOperatingProfile,
  V23CurrencyCode,
  V23CurrencySubaccount,
  V23FeeConfiguration,
  V23IntegrationInterface,
  V23MerchantAccount,
  V23MerchantTerminal,
  V23ParticipantIdentity,
  V23PhysicalCard,
  V23QrPaymentRequest,
  V23RegulatoryGateItem,
  V23SupportDisputeCase,
  V23VirtualCard,
  V23WalletAccount,
  V23WalletAuditEvent,
  V23WalletNumberAllocation,
} from '../types/index.ts';

function sha(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export function hashV23Pin(pin: string, salt: string): string {
  return crypto.scryptSync(pin, `econex-v23-pin:${salt}`, 32).toString('hex');
}

export function signV23QrPayload(payloadJson: string): string {
  return crypto.createHmac('sha256', 'econex-v23-sandbox-qr-hmac-v1').update(payloadJson).digest('hex');
}

export function buildDefaultRegulatoryGates(countryCode: string, authorityRef: string): V23RegulatoryGateItem[] {
  const isUganda = countryCode === 'UG';
  return [
    {
      gateCode: 'GATE_01_LEGAL_ENTITY',
      title: 'Legal entity and ownership readiness',
      completed: false,
      notes: `Corporate governance and entity registration verification pending in ${countryCode}.`,
    },
    {
      gateCode: 'GATE_02_REGULATORY_CLASSIFICATION',
      title: 'Regulatory classification completed',
      completed: false,
      notes: isUganda
        ? 'Legal opinion required under Uganda National Payment Systems Act 2020 (Act 15 of 2020) via qualified Ugandan counsel and Bank of Uganda.'
        : `Legal classification required with qualified local counsel and ${authorityRef}.`,
    },
    {
      gateCode: 'GATE_03_LICENCES_APPROVALS',
      title: 'Required payment/electronic-money/card licences or approvals obtained',
      completed: false,
      notes: isUganda
        ? 'No Bank of Uganda PSP/PSO/EMI licence claimed; see Bank of Uganda financial infrastructure & NPS Act 2020.'
        : `No live licence obtained from ${authorityRef}.`,
    },
    {
      gateCode: 'GATE_04_SAFEGUARDING',
      title: 'Customer-funds safeguarding & trust account arrangements established',
      completed: false,
      notes: 'Ring-fenced safeguarding bank trust agreements not yet signed.',
    },
    {
      gateCode: 'GATE_05_SETTLEMENT',
      title: 'Bank / scheme / settlement arrangements operational',
      completed: false,
      notes: 'External settlement partner agreements not yet active.',
    },
    {
      gateCode: 'GATE_06_AML_CFT',
      title: 'AML/CFT program and sanctions screening live',
      completed: false,
      notes: 'Screening workflows implemented in sandbox software; live list feeds not connected.',
    },
    {
      gateCode: 'GATE_07_CDD_KYB',
      title: 'Customer & Business Due Diligence (CDD/KYB/UBO) procedures approved',
      completed: false,
      notes: 'Verification workflows audited in sandbox; national ID registry links inactive.',
    },
    {
      gateCode: 'GATE_08_CONSUMER_PROTECTION',
      title: 'Consumer protection, disclosure & complaint SLA framework approved',
      completed: false,
      notes: 'Fee transparency and dispute workflows built; supervisory approval pending.',
    },
    {
      gateCode: 'GATE_09_OPERATIONAL_RISK',
      title: 'Operational risk & fraud limit governance signed off',
      completed: false,
      notes: 'Velocity, dual-approval, and limit controls implemented in code.',
    },
    {
      gateCode: 'GATE_10_CYBERSECURITY',
      title: 'Independent cybersecurity penetration & audit assessment',
      completed: false,
      notes: 'Independent external security certification pending.',
    },
    {
      gateCode: 'GATE_11_DATA_PROTECTION',
      title: 'Statutory Data Protection & Privacy compliance verification',
      completed: false,
      notes: isUganda
        ? 'PDPO Uganda registration and cross-border transfer impact assessment pending.'
        : 'Local data residency and privacy registration pending.',
    },
    {
      gateCode: 'GATE_12_BCDR',
      title: 'Business continuity & disaster recovery tested in production topology',
      completed: false,
      notes: 'WAL/recovery failure scenarios verified in local runtime only.',
    },
    {
      gateCode: 'GATE_13_INDEPENDENT_TEST',
      title: 'Independent regulatory sandbox / compliance readiness testing',
      completed: false,
      notes: 'External compliance sign-off not yet completed.',
    },
    {
      gateCode: 'GATE_14_COUNTRY_AUTH',
      title: 'Formal written country-specific authorization for real-value activation',
      completed: false,
      notes: 'Real-value wallet transfers, cash-in/out, and live cards remain strictly disabled.',
    },
  ];
}

export function seedV23Collections(dbInstance: any) {
  const now = '2026-11-21T10:00:00.000Z';

  // 1. Country Operating Profiles (7 Initial Configurable Countries — NOT_ACTIVATED for real-value ops)
  if (dbInstance.v23CountryProfiles.size === 0) {
    const specs: Array<{
      code: string;
      name: string;
      defaultCurrency: V23CurrencyCode;
      supported: V23CurrencyCode[];
      authority: string;
      taxNote: string;
      perTxMinor: Partial<Record<V23CurrencyCode, number>>;
      dailyMinor: Partial<Record<V23CurrencyCode, number>>;
    }> = [
      {
        code: 'UG',
        name: 'Republic of Uganda',
        defaultCurrency: 'UGX',
        supported: ['UGX', 'KES', 'USD', 'EUR'],
        authority: 'Bank of Uganda (BoU) — National Payment Systems Act 2020',
        taxNote: 'Sandbox calculation reference only; URA statutory VAT/excise rules verified prior to launch.',
        perTxMinor: { UGX: 500000000, KES: 20000000, USD: 150000, EUR: 140000 },
        dailyMinor: { UGX: 1500000000, KES: 60000000, USD: 450000, EUR: 400000 },
      },
      {
        code: 'KE',
        name: 'Republic of Kenya',
        defaultCurrency: 'KES',
        supported: ['KES', 'UGX', 'TZS', 'USD', 'EUR'],
        authority: 'Central Bank of Kenya (CBK) — National Payment System Act',
        taxNote: 'Configurable Kenya tax & excise note; NOT connected to live KRA or CBK.',
        perTxMinor: { KES: 20000000, UGX: 500000000, USD: 150000 },
        dailyMinor: { KES: 60000000, UGX: 1500000000, USD: 450000 },
      },
      {
        code: 'TZ',
        name: 'United Republic of Tanzania',
        defaultCurrency: 'TZS',
        supported: ['TZS', 'UGX', 'KES', 'USD'],
        authority: 'Bank of Tanzania (BoT) — National Payment Systems Act 2015',
        taxNote: 'Configurable Tanzania tax & reporting rules; NOT connected to TRA or BoT.',
        perTxMinor: { TZS: 350000000, USD: 150000 },
        dailyMinor: { TZS: 1000000000, USD: 450000 },
      },
      {
        code: 'RW',
        name: 'Republic of Rwanda',
        defaultCurrency: 'RWF',
        supported: ['RWF', 'UGX', 'KES', 'USD'],
        authority: 'National Bank of Rwanda (BNR) — Payment System Law',
        taxNote: 'Configurable Rwanda tax & reporting rules; NOT connected to RRA or BNR.',
        perTxMinor: { RWF: 200000000, USD: 150000 },
        dailyMinor: { RWF: 600000000, USD: 450000 },
      },
      {
        code: 'BI',
        name: 'Republic of Burundi',
        defaultCurrency: 'BIF',
        supported: ['BIF', 'UGX', 'USD'],
        authority: 'Bank of the Republic of Burundi (BRB)',
        taxNote: 'Configurable Burundi profile target only; NOT connected to BRB.',
        perTxMinor: { BIF: 400000000, USD: 100000 },
        dailyMinor: { BIF: 1000000000, USD: 300000 },
      },
      {
        code: 'SS',
        name: 'Republic of South Sudan',
        defaultCurrency: 'SSP',
        supported: ['SSP', 'UGX', 'USD'],
        authority: 'Bank of South Sudan (BoSS)',
        taxNote: 'Configurable South Sudan profile target only; NOT connected to BoSS.',
        perTxMinor: { SSP: 250000000, USD: 100000 },
        dailyMinor: { SSP: 750000000, USD: 300000 },
      },
      {
        code: 'CD',
        name: 'Democratic Republic of the Congo',
        defaultCurrency: 'CDF',
        supported: ['CDF', 'USD', 'UGX', 'RWF'],
        authority: 'Central Bank of Congo (BCC)',
        taxNote: 'Configurable DRC corridor profile target only; NOT connected to BCC.',
        perTxMinor: { CDF: 350000000, USD: 150000 },
        dailyMinor: { CDF: 1000000000, USD: 450000 },
      },
    ];

    for (const s of specs) {
      const profile: V23CountryOperatingProfile = {
        countryCode: s.code,
        countryName: s.name,
        regionalBloc: 'EAC_AFCFTA',
        countryActivationStatus: 'NOT_ACTIVATED',
        operationalAvailabilityStatus: 'SANDBOX_ONLY_NOT_LIVE',
        sandboxWalletAvailable: true,
        supportedCurrencies: s.supported,
        defaultCurrency: s.defaultCurrency,
        localWalletEligibilityRules: [
          'Permanent ECONEX Universal Wallet Number (EX-...) recognized without re-registration',
          'Sandbox testing active for verified developer/pilot personas; real-value ops gated',
        ],
        verificationRequirements: [
          'Participant Identity registration & consent',
          'Device & PIN hash binding',
          'CDD / KYB review for higher tiers prior to regulatory go-live',
        ],
        permittedTransactionTypes: [
          'WALLET_TO_WALLET',
          'INDIVIDUAL_TO_BUSINESS',
          'BUSINESS_TO_BUSINESS',
          'CUSTOMER_TO_MERCHANT',
          'COMMERCIAL_ORDER_PAYMENT',
          'INVOICE_SETTLEMENT_RECORD',
          'COOPERATIVE_ALLOCATION',
          'REFUND',
          'REVERSAL',
          'CARD_PURCHASE_RECORD',
          'CROSS_COUNTRY_INTERNAL_TRANSFER',
        ],
        perTxLimitMinor: s.perTxMinor,
        dailyLimitMinor: s.dailyMinor,
        feeScheduleSummary: 'Transparent pre-confirm fee preview; sandbox charges zero real fees.',
        taxAndReportingNotes: s.taxNote,
        localDisputeProcedure: 'Submit wallet case within ECONEX Support & Consumer Protection Desk; human escalation required.',
        cardPermissions: 'SANDBOX_SIMULATION_ONLY',
        withdrawalPermissions: 'DISABLED_PENDING_LICENCE',
        regulatoryStatus: 'PRE_REGULATORY_CLASSIFICATION_AND_LICENSING',
        regulatoryAuthorityRef: s.authority,
        customerProtectionRequirements: [
          'Clear pre-transaction fee & FX rate disclosure',
          'Human review mandatory before any risk-based account restriction',
          'Zero auto-forfeiture or hidden balance deductions',
        ],
        dataHandlingRules: `Minimized identity PII; public wallet lookup exposes display name, verification state & country eligibility only (${s.code}).`,
        activationGates: buildDefaultRegulatoryGates(s.code, s.authority),
        updatedAt: now,
      };
      dbInstance.v23CountryProfiles.set(s.code, profile);
    }
  }

  // 2. Permanent Universal Participant Identities, EUWNs, Wallets & Multi-Currency Subaccounts
  if (dbInstance.v23Identities.size === 0) {
    const seedActors: Array<{
      id: string;
      userId: string;
      category: V23ParticipantIdentity['category'];
      roles: V23ParticipantIdentity['authorizedRoles'];
      displayName: string;
      legalName: string;
      emailMasked: string;
      phoneMasked: string;
      country: string;
      district: string;
      walletId: string;
      euwn: string;
      walletCategory: V23WalletAccount['walletCategory'];
      label: string;
      linkedEntityId?: string;
      pin: string;
      balancesMinor: Partial<Record<V23CurrencyCode, number>>;
      verifStatus: V23ParticipantIdentity['identityVerificationStatus'];
      bizVerifStatus: V23ParticipantIdentity['businessVerificationStatus'];
    }> = [
      {
        id: 'IDN-V23-001',
        userId: 'usr_farmer_01',
        category: 'INDIVIDUAL',
        roles: ['INDIVIDUAL', 'SUPPLIER', 'COOPERATIVE_MEMBER'],
        displayName: 'Sarah Namubiru',
        legalName: 'Sarah Namubiru (Private KYC Record)',
        emailMasked: 'sa***@farm.aros.ug',
        phoneMasked: '+256 772 *** 456',
        country: 'UG',
        district: 'Mbale',
        walletId: 'WLT-V23-001',
        euwn: 'EX-7K9M2P4Q8R5W',
        walletCategory: 'INDIVIDUAL',
        label: 'Personal & Producer Wallet',
        pin: '2468',
        balancesMinor: { UGX: 150000000, KES: 2500000, USD: 50000 },
        verifStatus: 'VERIFIED',
        bizVerifStatus: 'NOT_APPLICABLE',
      },
      {
        id: 'IDN-V23-002',
        userId: 'usr_buyer_01',
        category: 'MEDIUM_BUSINESS',
        roles: ['BUSINESS_OWNER', 'INDIVIDUAL', 'MERCHANT'],
        displayName: 'Kampala Agro & Hardware Supply',
        legalName: 'Kampala Agro & Hardware Supply Ltd',
        emailMasked: 'pr***@khs.aros.ug',
        phoneMasked: '+256 701 *** 890',
        country: 'UG',
        district: 'Kampala',
        walletId: 'WLT-V23-002',
        euwn: 'EX-3H8N6V2X9C4T',
        walletCategory: 'BUSINESS',
        label: 'Commercial Operations Wallet',
        linkedEntityId: 'BIZ-V22-001',
        pin: '1357',
        balancesMinor: { UGX: 500000000, KES: 8000000, TZS: 12000000, USD: 200000 },
        verifStatus: 'VERIFIED',
        bizVerifStatus: 'VERIFIED',
      },
      {
        id: 'IDN-V23-003',
        userId: 'usr_dealer_01',
        category: 'SMALL_BUSINESS',
        roles: ['BUSINESS_OWNER', 'SUPPLIER', 'MERCHANT'],
        displayName: 'East Africa Solar & Engineering Depot',
        legalName: 'East Africa Solar & Engineering Depot Ltd',
        emailMasked: 'de***@solar.aros.ug',
        phoneMasked: '+256 782 *** 312',
        country: 'UG',
        district: 'Wakiso',
        walletId: 'WLT-V23-003',
        euwn: 'EX-9D5F3G7J2L6B',
        walletCategory: 'BUSINESS',
        label: 'Merchant & Engineering Wallet',
        linkedEntityId: 'BIZ-V22-002',
        pin: '9753',
        balancesMinor: { UGX: 320000000, KES: 4000000, USD: 120000 },
        verifStatus: 'VERIFIED',
        bizVerifStatus: 'VERIFIED',
      },
      {
        id: 'IDN-V23-004',
        userId: 'usr_coop_01',
        category: 'COOPERATIVE',
        roles: ['COOPERATIVE_MEMBER', 'INSTITUTIONAL_APPROVER', 'SUPPLIER'],
        displayName: 'Elgon Growers & Multi-Sector Cooperative',
        legalName: 'Elgon Growers & Multi-Sector Cooperative Society Ltd',
        emailMasked: 'ad***@elgoncoop.ug',
        phoneMasked: '+256 774 *** 118',
        country: 'UG',
        district: 'Mbale',
        walletId: 'WLT-V23-004',
        euwn: 'EX-4W6Y8Z2A5C9E',
        walletCategory: 'COOPERATIVE',
        label: 'Cooperative Treasury & Member Pool Wallet',
        linkedEntityId: 'org_coop_01',
        pin: '4321',
        balancesMinor: { UGX: 850000000, KES: 5000000, USD: 150000 },
        verifStatus: 'VERIFIED',
        bizVerifStatus: 'VERIFIED',
      },
      {
        id: 'IDN-V23-005',
        userId: 'usr_transporter_01',
        category: 'SOLE_TRADER',
        roles: ['SERVICE_PROVIDER', 'INDIVIDUAL', 'EMPLOYEE'],
        displayName: 'Malaba Corridor Freight & Haulage',
        legalName: 'Grace Okello t/a Malaba Corridor Haulage',
        emailMasked: 'fr***@haulage.aros.ug',
        phoneMasked: '+254 712 *** 604',
        country: 'KE',
        district: 'Nairobi',
        walletId: 'WLT-V23-005',
        euwn: 'EX-6M8Q4R2T9W3P',
        walletCategory: 'INDIVIDUAL',
        label: 'Cross-Border Carrier Wallet',
        linkedEntityId: 'BIZ-V22-004',
        pin: '5511',
        balancesMinor: { KES: 9500000, UGX: 120000000, USD: 80000 },
        verifStatus: 'VERIFIED',
        bizVerifStatus: 'VERIFIED',
      },
      {
        id: 'IDN-V23-006',
        userId: 'usr_admin_01',
        category: 'INSTITUTION',
        roles: ['INSTITUTIONAL_APPROVER'],
        displayName: 'ECONEX Institutional Operations & Escrow Program',
        legalName: 'VINEXSAH TECHNOLOGIES Sandbox Operations Account',
        emailMasked: 'op***@vinexsah.tech',
        phoneMasked: '+256 700 *** 001',
        country: 'UG',
        district: 'Kampala',
        walletId: 'WLT-V23-006',
        euwn: 'EX-8P2N5K7M3R9X',
        walletCategory: 'INSTITUTIONAL',
        label: 'Institutional Governance Wallet',
        pin: '8642',
        balancesMinor: { UGX: 1200000000, KES: 10000000, USD: 300000, EUR: 100000 },
        verifStatus: 'VERIFIED',
        bizVerifStatus: 'VERIFIED',
      },
    ];

    for (const a of seedActors) {
      const identity: V23ParticipantIdentity = {
        id: a.id,
        tenantId: 'TEN-UG-ELGON-01',
        userId: a.userId,
        category: a.category,
        authorizedRoles: a.roles,
        displayName: a.displayName,
        legalName: a.legalName,
        emailMasked: a.emailMasked,
        phoneMasked: a.phoneMasked,
        phoneHash: sha(`phone:${a.userId}`),
        countryCode: a.country,
        activeCountryContext: a.country,
        districtOrCity: a.district,
        identityVerificationStatus: a.verifStatus,
        businessVerificationStatus: a.bizVerifStatus,
        accountStatus: 'ACTIVE',
        deviceFingerprintHash: sha(`device:${a.userId}`),
        recoveryEmailHint: a.emailMasked,
        consentGiven: true,
        consentTimestamp: now,
        createdAt: now,
        updatedAt: now,
      };
      dbInstance.v23Identities.set(identity.id, identity);

      const alloc: V23WalletNumberAllocation = {
        id: `EUWN-${a.walletId}`,
        euwn: a.euwn,
        participantIdentityId: identity.id,
        walletAccountId: a.walletId,
        walletCategory: a.walletCategory,
        permanent: true,
        reassigned: false,
        countryIndependent: true,
        phoneChangeCount: 0,
        deviceMigrationCount: 0,
        travelCountryHistory: [a.country],
        issuedAt: now,
      };
      dbInstance.v23WalletNumbers.set(alloc.euwn, alloc);

      const salt = `salt-${a.walletId.toLowerCase()}`;
      const wallet: V23WalletAccount = {
        id: a.walletId,
        tenantId: 'TEN-UG-ELGON-01',
        participantIdentityId: identity.id,
        euwn: a.euwn,
        walletCategory: a.walletCategory,
        label: a.label,
        displayName: a.displayName,
        status: 'ACTIVE',
        ownerUserId: a.userId,
        linkedEntityId: a.linkedEntityId,
        staffPermissions: [
          {
            userId: a.userId,
            role: 'OWNER',
            canInitiate: true,
            canApprove: true,
          },
        ],
        dualApprovalThresholdMinor: a.walletCategory === 'INSTITUTIONAL' || a.walletCategory === 'COOPERATIVE' ? 100000000 : 0,
        primaryCountryCode: a.country,
        activeCountryCode: a.country,
        pinHash: hashV23Pin(a.pin, salt),
        pinSalt: salt,
        pinSet: true,
        mfaEnabled: true,
        dailyLimitMinorByCurrency: {
          UGX: 1500000000,
          KES: 60000000,
          TZS: 1000000000,
          RWF: 600000000,
          USD: 450000,
          EUR: 400000,
        },
        isTestMode: true,
        createdAt: now,
        updatedAt: now,
      };
      dbInstance.v23Wallets.set(wallet.id, wallet);

      for (const [curr, balMinor] of Object.entries(a.balancesMinor)) {
        const subId = `SUB-${a.walletId}-${curr}`;
        const sub: V23CurrencySubaccount = {
          id: subId,
          tenantId: 'TEN-UG-ELGON-01',
          walletAccountId: wallet.id,
          euwn: wallet.euwn,
          currency: curr as V23CurrencyCode,
          minorUnitScale: 100,
          availableMinor: Number(balMinor || 0),
          pendingMinor: 0,
          reservedMinor: 0,
          restrictedMinor: 0,
          reversedMinor: 0,
          testOnlyBalanceMinor: Number(balMinor || 0),
          ledgerAccountId: curr === 'USD' ? 'COA-1030' : 'COA-1010',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };
        dbInstance.v23Subaccounts.set(sub.id, sub);
      }
    }
  }

  // 3. Sandbox Merchant Acceptance & Terminals & QR Requests
  if (dbInstance.v23Merchants.size === 0) {
    const m1: V23MerchantAccount = {
      id: 'MRC-V23-001',
      tenantId: 'TEN-UG-ELGON-01',
      walletAccountId: 'WLT-V23-002',
      euwn: 'EX-3H8N6V2X9C4T',
      merchantName: 'Kampala Agro & Hardware Supply',
      sectorCode: 'RETAIL_CONSUMER',
      countryCode: 'UG',
      districtOrCity: 'Kampala',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE_SANDBOX',
      perTxLimitMinor: 100000000,
      dailyLimitMinor: 500000000,
      acceptedCurrencies: ['UGX', 'KES', 'USD'],
      sandboxVolumeMinorByCurrency: { UGX: 0 },
      sandboxTxCount: 0,
      sandboxRefundCount: 0,
      modeLabel: 'SANDBOX_TEST_MODE_ONLY',
      createdAt: now,
      updatedAt: now,
    };
    const m2: V23MerchantAccount = {
      id: 'MRC-V23-002',
      tenantId: 'TEN-UG-ELGON-01',
      walletAccountId: 'WLT-V23-003',
      euwn: 'EX-9D5F3G7J2L6B',
      merchantName: 'East Africa Solar & Engineering Depot',
      sectorCode: 'RENEWABLE_ENERGY_SOLAR',
      countryCode: 'UG',
      districtOrCity: 'Wakiso',
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE_SANDBOX',
      perTxLimitMinor: 250000000,
      dailyLimitMinor: 1000000000,
      acceptedCurrencies: ['UGX', 'KES', 'USD'],
      sandboxVolumeMinorByCurrency: { UGX: 0 },
      sandboxTxCount: 0,
      sandboxRefundCount: 0,
      modeLabel: 'SANDBOX_TEST_MODE_ONLY',
      createdAt: now,
      updatedAt: now,
    };
    dbInstance.v23Merchants.set(m1.id, m1);
    dbInstance.v23Merchants.set(m2.id, m2);

    const t1: V23MerchantTerminal = {
      id: 'TRM-V23-001',
      tenantId: 'TEN-UG-ELGON-01',
      merchantId: m1.id,
      terminalCode: 'KHS-POS-01',
      terminalType: 'DYNAMIC_POS_SIM',
      label: 'Nakasero Counter Terminal 01',
      locationLabel: 'Kampala Central, Uganda',
      status: 'ACTIVE',
      lastActivityAt: now,
      createdAt: now,
    };
    const t2: V23MerchantTerminal = {
      id: 'TRM-V23-002',
      tenantId: 'TEN-UG-ELGON-01',
      merchantId: m2.id,
      terminalCode: 'SOLAR-QR-01',
      terminalType: 'STATIC_QR_POINT',
      label: 'Wakiso Showroom Desk',
      locationLabel: 'Wakiso, Uganda',
      status: 'ACTIVE',
      lastActivityAt: now,
      createdAt: now,
    };
    dbInstance.v23Terminals.set(t1.id, t1);
    dbInstance.v23Terminals.set(t2.id, t2);

    const p1 = JSON.stringify({
      ref: 'QRPAY-V23-001',
      merchantId: m1.id,
      merchantEuwn: m1.euwn,
      terminalId: t1.id,
      kind: 'DYNAMIC',
      amountMinor: 2500000,
      currency: 'UGX',
    });
    const qr1: V23QrPaymentRequest = {
      id: 'QR-V23-001',
      tenantId: 'TEN-UG-ELGON-01',
      paymentReference: 'QRPAY-V23-001',
      merchantId: m1.id,
      merchantName: m1.merchantName,
      merchantEuwn: m1.euwn,
      terminalId: t1.id,
      qrKind: 'DYNAMIC',
      amountMinor: 2500000,
      currency: 'UGX',
      feePreviewMinor: 0,
      description: 'Solar Water Pump Spare Parts (Sandbox)',
      countryCode: 'UG',
      payloadJson: p1,
      payloadSignatureSha256: signV23QrPayload(p1),
      status: 'ACTIVE',
      expiresAt: '2027-12-31T23:59:59.000Z',
      modeLabel: 'SANDBOX_TEST_MODE_ONLY',
      createdAt: now,
      updatedAt: now,
    };
    dbInstance.v23QrRequests.set(qr1.id, qr1);
  }

  // 4. Virtual & Physical Card Architectures (Unmistakably Fictional Sandbox Credentials, Zero External Network Certification)
  if (dbInstance.v23VirtualCards.size === 0) {
    const vc1: V23VirtualCard = {
      id: 'VCARD-V23-001',
      tenantId: 'TEN-UG-ELGON-01',
      walletAccountId: 'WLT-V23-001',
      euwn: 'EX-7K9M2P4Q8R5W',
      participantIdentityId: 'IDN-V23-001',
      cardholderName: 'SARAH NAMUBIRU (TEST)',
      tokenizedCardRef: 'TOK-ECONEX-VTEST-001',
      maskedPan: '4999 00XX XXXX 4242',
      expiryPlaceholder: '12/29 (SIM)',
      cardStatus: 'ACTIVE_TEST',
      allowedCurrencies: ['UGX', 'KES', 'USD'],
      allowedCountries: ['UG', 'KE'],
      blockedMccs: ['7995'],
      perTxLimitMinor: 50000000,
      dailyLimitMinor: 150000000,
      onlinePaymentsEnabled: true,
      contactlessConfigured: true,
      testMode: true,
      externalNetworkUsable: false,
      nonIssuanceNotice: 'Simulated ECONEX virtual card in sandbox mode only; NOT usable on live external card networks.',
      createdAt: now,
      updatedAt: now,
    };
    const vc2: V23VirtualCard = {
      id: 'VCARD-V23-002',
      tenantId: 'TEN-UG-ELGON-01',
      walletAccountId: 'WLT-V23-002',
      euwn: 'EX-3H8N6V2X9C4T',
      participantIdentityId: 'IDN-V23-002',
      cardholderName: 'KAMPALA AGRO HARDWARE (TEST)',
      tokenizedCardRef: 'TOK-ECONEX-VTEST-002',
      maskedPan: '5999 00XX XXXX 8810',
      expiryPlaceholder: '11/29 (SIM)',
      cardStatus: 'ACTIVE_TEST',
      allowedCurrencies: ['UGX', 'KES', 'TZS', 'USD'],
      allowedCountries: ['UG', 'KE', 'TZ'],
      blockedMccs: [],
      perTxLimitMinor: 200000000,
      dailyLimitMinor: 500000000,
      onlinePaymentsEnabled: true,
      contactlessConfigured: false,
      testMode: true,
      externalNetworkUsable: false,
      nonIssuanceNotice: 'Simulated ECONEX corporate virtual card in sandbox mode only; NOT usable on external card networks.',
      createdAt: now,
      updatedAt: now,
    };
    dbInstance.v23VirtualCards.set(vc1.id, vc1);
    dbInstance.v23VirtualCards.set(vc2.id, vc2);
  }

  if (dbInstance.v23PhysicalCards.size === 0) {
    const pc1: V23PhysicalCard = {
      id: 'PCARD-V23-001',
      tenantId: 'TEN-UG-ELGON-01',
      walletAccountId: 'WLT-V23-001',
      euwn: 'EX-7K9M2P4Q8R5W',
      participantIdentityId: 'IDN-V23-001',
      cardholderName: 'SARAH NAMUBIRU (TEST)',
      tokenizedCardRef: 'TOK-ECONEX-PTEST-001',
      maskedPan: '4999 01XX XXXX 1001',
      stage: 'ELIGIBILITY_REVIEW',
      cardStatus: 'ISSUED_TEST',
      emvChipConfigured: true,
      contactlessConfigured: true,
      atmInterfaceStatus: 'INACTIVE_NOT_LIVE',
      issuerInterfaceStatus: 'INACTIVE_PENDING_PARTNER_AND_LICENCE',
      acquirerInterfaceStatus: 'INACTIVE_SANDBOX_ONLY',
      schemeCertified: false,
      physicalCardLiveIssued: false,
      deliveryCountryCode: 'UG',
      deliveryDistrict: 'Mbale',
      nonCertificationNotice: 'Future physical ECONEX card workflow simulation only. Physical cards are NOT issued, scheme-certified, or accepted at banks/ATMs.',
      history: [
        { stage: 'APPLIED', actorUserId: 'usr_farmer_01', note: 'Sandbox physical card workflow application initiated.', timestamp: now },
        { stage: 'ELIGIBILITY_REVIEW', actorUserId: 'usr_admin_01', note: 'Under sandbox design & KYC readiness review.', timestamp: now },
      ],
      createdAt: now,
      updatedAt: now,
    };
    dbInstance.v23PhysicalCards.set(pc1.id, pc1);
  }

  // 5. Configurable Fee Schedules (Actual Recognized Revenue = 0)
  if (dbInstance.v23FeeConfigs.size === 0) {
    const fees: V23FeeConfiguration[] = [
      {
        id: 'FEE-V23-W2W-UGX',
        serviceType: 'WALLET_TO_WALLET',
        countryCode: 'UG',
        currency: 'UGX',
        participantCategory: 'ALL',
        flatFeeMinor: 0,
        percentBps: 0,
        minFeeMinor: 0,
        maxFeeMinor: 0,
        classification: 'CONFIGURABLE_SANDBOX_SCHEDULE',
        activeRevenueRecognizedMinor: 0,
        updatedBy: 'system',
        updatedAt: now,
      },
      {
        id: 'FEE-V23-B2B-UGX',
        serviceType: 'BUSINESS_TO_BUSINESS',
        countryCode: 'UG',
        currency: 'UGX',
        participantCategory: 'ALL',
        flatFeeMinor: 50000, // UGX 500
        percentBps: 25, // 0.25%
        minFeeMinor: 50000,
        maxFeeMinor: 1500000,
        classification: 'CONFIGURABLE_SANDBOX_SCHEDULE',
        activeRevenueRecognizedMinor: 0,
        updatedBy: 'system',
        updatedAt: now,
      },
      {
        id: 'FEE-V23-XC-ALL',
        serviceType: 'CROSS_COUNTRY_INTERNAL_TRANSFER',
        countryCode: 'ALL',
        currency: 'USD',
        participantCategory: 'ALL',
        flatFeeMinor: 50, // $0.50
        percentBps: 50, // 0.50%
        minFeeMinor: 50,
        maxFeeMinor: 2500,
        classification: 'CONFIGURABLE_SANDBOX_SCHEDULE',
        activeRevenueRecognizedMinor: 0,
        updatedBy: 'system',
        updatedAt: now,
      },
      {
        id: 'FEE-V23-QR-UGX',
        serviceType: 'MERCHANT_QR',
        countryCode: 'UG',
        currency: 'UGX',
        participantCategory: 'ALL',
        flatFeeMinor: 0,
        percentBps: 50, // 0.50% configurable merchant rate (sandbox only)
        minFeeMinor: 0,
        maxFeeMinor: 2500000,
        classification: 'CONFIGURABLE_SANDBOX_SCHEDULE',
        activeRevenueRecognizedMinor: 0,
        updatedBy: 'system',
        updatedAt: now,
      },
    ];
    for (const f of fees) dbInstance.v23FeeConfigs.set(f.id, f);
  }

  // 6. Configurable External Integration Gates (All NOT_CONFIGURED or CONFIGURED_TEST)
  if (dbInstance.v23Integrations.size === 0) {
    const ints: V23IntegrationInterface[] = [
      {
        id: 'INT-V23-PSW',
        code: 'ECONEX_INTERNAL_SWITCH',
        name: 'ECONEX Internal Transaction Switch',
        category: 'PAYMENT_SWITCH',
        countryCode: 'UG',
        state: 'TEST_VERIFIED',
        liveEnabled: false,
        providerPlaceholder: 'ECONEX Internal Engine (Sandbox Mode)',
        regulatoryPrereq: 'Bank of Uganda NPS Act 2020 Payment System Operator classification',
        updatedAt: now,
      },
      {
        id: 'INT-V23-CARD-ISS',
        code: 'CARD_ISSUER_PROCESSOR_API',
        name: 'Licensed Card Issuer Processor Interface',
        category: 'CARD_ISSUER_PROCESSOR',
        countryCode: 'UG',
        state: 'NOT_CONFIGURED',
        liveEnabled: false,
        providerPlaceholder: 'Licensed Partner BIN Sponsor & Processor (Inactive)',
        regulatoryPrereq: 'Scheme membership, PCI-DSS Level 1, and Bank of Uganda instrument approval',
        updatedAt: now,
      },
      {
        id: 'INT-V23-ATM',
        code: 'ATM_SWITCH_GATEWAY',
        name: 'ATM Network & Cash Switch Interface',
        category: 'ATM_NETWORK',
        countryCode: 'UG',
        state: 'NOT_CONFIGURED',
        liveEnabled: false,
        providerPlaceholder: 'National ATM / Shared Agent Switch (Inactive)',
        regulatoryPrereq: 'Licensed issuer + scheme switching agreement',
        updatedAt: now,
      },
      {
        id: 'INT-V23-KYC',
        code: 'NATIONAL_IDENTITY_REGISTRY_INTERFACE',
        name: 'National ID / Business Registry KYC Adapter',
        category: 'KYC_REGISTRY',
        countryCode: 'UG',
        state: 'CONFIGURED_TEST',
        liveEnabled: false,
        providerPlaceholder: 'Sandbox KYC Mock Adapter (No live NIRA/URSB link)',
        regulatoryPrereq: 'Statutory API MOU & PDPO compliance clearance',
        updatedAt: now,
      },
      {
        id: 'INT-V23-SANCTIONS',
        code: 'SANCTIONS_PEP_SCREENING_ADAPTER',
        name: 'Sanctions & PEP Screening Adapter',
        category: 'SANCTIONS_SCREENING',
        countryCode: 'ALL',
        state: 'CONFIGURED_TEST',
        liveEnabled: false,
        providerPlaceholder: 'Sandbox Screening Interface (Does not perform live list checks)',
        regulatoryPrereq: 'Licensed compliance screening vendor contract',
        updatedAt: now,
      },
      {
        id: 'INT-V23-SETTLE',
        code: 'TRUST_SAFEGUARDING_SETTLEMENT_BANK',
        name: 'Customer Funds Safeguarding & Settlement Bank',
        category: 'SETTLEMENT_BANK',
        countryCode: 'UG',
        state: 'NOT_CONFIGURED',
        liveEnabled: false,
        providerPlaceholder: 'Supervised Commercial Bank Trust Account (Not Opened)',
        regulatoryPrereq: 'Executed trust safeguarding deed & BoU approval',
        updatedAt: now,
      },
    ];
    for (const i of ints) dbInstance.v23Integrations.set(i.id, i);
  }

  // 7. Initial Compliance Stub & Support Template & Genesis Audit Record
  if (dbInstance.v23ComplianceReviews.size === 0) {
    const rev: V23ComplianceReview = {
      id: 'CMP-V23-001',
      tenantId: 'TEN-UG-ELGON-01',
      subjectType: 'BUSINESS',
      subjectId: 'IDN-V23-002',
      reviewType: 'KYB',
      riskScore: 18,
      riskReasons: ['Baseline KYB documentation submitted for Kampala Agro & Hardware Supply'],
      automatedRecommendation: 'LOW_RISK_PROCEED_WITH_HUMAN_SIGN_OFF',
      humanDecision: 'CLEARED',
      requiresHumanReview: true,
      reviewedByUserId: 'usr_admin_01',
      decisionReason: 'Verified sandbox corporate identity profile.',
      liveScreeningClaimed: false,
      screeningNotice: 'Sandbox compliance review record only; does NOT constitute live sanctions screening or regulatory clearance.',
      createdAt: now,
      updatedAt: now,
    };
    dbInstance.v23ComplianceReviews.set(rev.id, rev);
  }

  if (dbInstance.v23SupportCases.size === 0) {
    const sc: V23SupportDisputeCase = {
      id: 'WCASE-V23-001',
      tenantId: 'TEN-UG-ELGON-01',
      caseReference: 'ECONEX-WLT-CASE-0001',
      category: 'ACCOUNT_RECOVERY',
      participantIdentityId: 'IDN-V23-001',
      walletAccountId: 'WLT-V23-001',
      assignedSupportRole: 'WALLET_SUPPORT_SPECIALIST',
      status: 'RESOLVED',
      summary: 'Sandbox device recovery verification check for Sarah Namubiru retaining permanent EUWN EX-7K9M2P4Q8R5W.',
      evidenceRefs: ['device-migration-check-01'],
      resolutionNotes: 'Device fingerprint updated while preserving permanent EUWN EX-7K9M2P4Q8R5W.',
      escalationHistory: [],
      closureReason: 'Verified device migration complete.',
      consumerProtectionNotice: 'ECONEX investigates internal wallet records; external settlement disputes require the relevant licensed provider or competent authority.',
      submittedAt: now,
      updatedAt: now,
    };
    dbInstance.v23SupportCases.set(sc.id, sc);
  }

  if (dbInstance.v23AuditEvents.size === 0) {
    const payload = `AUD-V23-GENESIS|GENESIS|system|${now}`;
    const ev: V23WalletAuditEvent = {
      id: 'AUD-V23-GENESIS',
      tenantId: 'TEN-UG-ELGON-01',
      actorUserId: 'system',
      actorRole: 'PLATFORM_ADMIN',
      action: 'V23_SCHEMA_21_INITIALIZED',
      targetType: 'SYSTEM',
      targetId: 'SCHEMA_21',
      summary: 'ECONEX V23.0 Universal Identity, Wallet Network & Card Infrastructure Schema 21 initialized.',
      correlationId: 'corr-v23-genesis',
      prevHash: '0'.repeat(64),
      entryHash: sha(payload),
      createdAt: now,
    };
    dbInstance.v23AuditEvents.set(ev.id, ev);
  }
}
