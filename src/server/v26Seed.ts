/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V26.0 - Deterministic Additive Seed for Schema 24 Activation & UX State
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import {
  buildCanonicalControlAuditCatalog,
  buildCanonicalRouteInventory,
} from './v26AuditRegistry.ts';

export function seedV26Collections(db: any): void {
  const now = new Date().toISOString();

  // 1. Seed Route Inventory & Interactive Control Audit Catalog (incremental sync for V26 + V27)
  for (const r of buildCanonicalRouteInventory()) {
    if (!db.v26RouteInventory.has(r.routeId)) {
      db.v26RouteInventory.set(r.routeId, r);
    }
  }
  for (const c of buildCanonicalControlAuditCatalog()) {
    if (!db.v26ControlAudits.has(c.controlId)) {
      db.v26ControlAudits.set(c.controlId, c);
    }
  }

  // 2. Seed User Preferences & Onboarding Progress for existing canonical users
  const defaultUsers = [
    { id: 'usr_farmer_01', mode: 'SIMPLE', lang: 'en', country: 'UG', currency: 'UGX', district: 'Mbale', org: 'ORG-V25-UG-PRODUCE' },
    { id: 'usr_buyer_01', mode: 'STANDARD', lang: 'en', country: 'UG', currency: 'UGX', district: 'Kampala', org: 'ORG-V25-UG-PRODUCE' },
    { id: 'usr_admin_01', mode: 'ADMINISTRATOR', lang: 'en', country: 'UG', currency: 'UGX', district: 'Kampala', org: 'ORG-V25-ECONEX-HQ' },
  ];

  for (const u of defaultUsers) {
    if (!db.v26UserPreferences.has(u.id)) {
      db.v26UserPreferences.set(u.id, {
        userId: u.id,
        experienceMode: u.mode,
        languageCode: u.lang,
        activeCountryCode: u.country,
        activeCurrency: u.currency,
        activeWorkspaceId: u.org,
        textSize: 'normal',
        highContrast: false,
        reducedMotion: false,
        lowBandwidth: false,
        dashboardLayout: { pinnedWidgets: ['wallet', 'orders', 'workflow', 'notifications'] },
        updatedAt: now,
      });
    }
    if (!db.v26UserOnboarding.has(u.id)) {
      const userObj = db.users.get(u.id);
      db.v26UserOnboarding.set(u.id, {
        id: `ONB-U-${u.id}`,
        userId: u.id,
        currentStep: 7,
        totalSteps: 7,
        selectedLanguage: u.lang,
        countryCode: u.country,
        accountType: userObj?.role || 'FARMER',
        fullName: userObj?.name || 'ECONEX Participant',
        phone: userObj?.phone || '+256700000001',
        email: userObj?.email || '',
        district: u.district,
        interests: ['sell_crops', 'market_prices', 'manage_orders'],
        consentAccepted: true,
        completed: true,
        completedAt: now,
        updatedAt: now,
      });
    }
    if (!db.v26NotificationPreferences.has(u.id)) {
      db.v26NotificationPreferences.set(u.id, {
        userId: u.id,
        inAppEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        whatsappEnabled: false,
        categories: {
          ORDERS: true,
          WALLET: true,
          PROCUREMENT: true,
          LOGISTICS: true,
          SUPPORT: true,
          SYSTEM: true,
        },
        quietHours: { enabled: false, start: '22:00', end: '06:00' },
        updatedAt: now,
      });
    }
  }

  // 3. Seed Sample Business Onboarding Records
  if (db.v26BusinessOnboarding.size === 0) {
    db.v26BusinessOnboarding.set('BIZ-ONB-SEED-01', {
      id: 'BIZ-ONB-SEED-01',
      userId: 'usr_buyer_01',
      organisationId: 'ORG-V25-UG-PRODUCE',
      businessProfileId: 'BIZ-V22-SEED-01',
      euwn: 'EX-UG-BIZ-0001',
      businessName: 'Elgon Harvest Trading & Logistics Ltd',
      businessType: 'SME',
      sectorId: 'SEC-AGRI',
      countryCode: 'UG',
      currency: 'UGX',
      registrationNumber: 'URSB-80020034912',
      routedWorkspace: 'v22-businesses',
      status: 'VERIFICATION_PENDING',
      completed: true,
      idempotencyKey: 'SEED-BIZ-ONB-01',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 4. Seed Unified In-App Notifications & Provider Delivery Logs
  if (db.v26Notifications.size === 0) {
    const seededNotifs = [
      {
        id: 'NTF-V26-001',
        userId: 'usr_farmer_01',
        tenantId: 'TENANT-UG',
        category: 'SYSTEM',
        severity: 'INFO',
        title: 'ECONEX V26 Unified Workspace Active',
        body: 'All workflows, notifications, reports, and country tools are connected in Schema 24 sandbox mode.',
        targetRoute: '/v26-hub',
        targetTabId: 'v26-hub',
        isRead: false,
        archived: false,
        createdAt: now,
      },
      {
        id: 'NTF-V26-002',
        userId: 'usr_buyer_01',
        tenantId: 'TENANT-UG',
        category: 'ORDERS',
        severity: 'ACTION_REQUIRED',
        title: 'Connected Commerce & Procurement Ready',
        body: 'Discovery, RFQ, Quotation, Agreement, Order, Inventory ATP, and Wallet Obligations are linked.',
        targetRoute: '/commerce-network',
        targetTabId: 'v24-execution-hub',
        isRead: false,
        archived: false,
        createdAt: now,
      },
      {
        id: 'NTF-V26-003',
        userId: 'usr_admin_01',
        tenantId: 'TENANT-UG',
        category: 'SYSTEM',
        severity: 'INFO',
        title: 'Schema 24 Migration & V25 Rollback Backup Verified',
        body: 'All V1–V25 invariants preserved alongside V26 interactive control audit coverage.',
        targetRoute: '/v26-audit',
        targetTabId: 'v26-audit',
        isRead: false,
        archived: false,
        createdAt: now,
      },
    ];
    for (const n of seededNotifs) {
      db.v26Notifications.set(n.id, n);
      db.v26NotificationDeliveries.set(`DEL-${n.id}`, {
        id: `DEL-${n.id}`,
        notificationId: n.id,
        userId: n.userId,
        channel: 'IN_APP',
        providerConfigured: true,
        deliveryStatus: 'DELIVERED_IN_APP',
        providerNote: 'Persisted in ECONEX V26 in-app inbox.',
        attemptedAt: now,
      });
    }
  }

  // 5. Seed Saved Searches / Quick Actions
  if (db.v26SavedItems.size === 0) {
    db.v26SavedItems.set('SAV-V26-001', {
      id: 'SAV-V26-001',
      userId: 'usr_farmer_01',
      itemType: 'SAVED_SEARCH',
      label: 'Kampala & Mbale Arabica Coffee Demand',
      queryText: 'Arabica Coffee',
      filters: { countryCode: 'UG', sector: 'Agriculture' },
      targetTabId: 'explore',
      createdAt: now,
    });
    db.v26SavedItems.set('SAV-V26-002', {
      id: 'SAV-V26-002',
      userId: 'usr_buyer_01',
      itemType: 'QUICK_ACTION',
      label: 'Run Commerce E2E Workflow',
      queryText: 'commerce',
      filters: {},
      targetTabId: 'v26-hub',
      createdAt: now,
    });
  }

  // 6. Seed Support Ticket & Threaded Message
  if (db.v26SupportTickets.size === 0) {
    db.v26SupportTickets.set('TKT-V26-001', {
      id: 'TKT-V26-001',
      caseNumber: 'CASE-V26-1001',
      userId: 'usr_farmer_01',
      tenantId: 'TENANT-UG',
      organisationId: 'ORG-V25-UG-PRODUCE',
      category: 'GENERAL_HELP',
      priority: 'NORMAL',
      subject: 'Verify cooperative onboarding documentation requirements',
      description: 'Checking accepted URSB certificate formats for Tier 2 cooperative onboarding.',
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    });
    db.v26SupportMessages.set('TMSG-V26-001', {
      id: 'TMSG-V26-001',
      ticketId: 'TKT-V26-001',
      senderUserId: 'usr_farmer_01',
      senderRole: 'FARMER',
      messageBody: 'Please advise if cooperative registration certificate PDF can be uploaded via Document Vault.',
      isInternalNote: false,
      createdAt: now,
    });
  }

  // 7. Seed Connected E2E Commerce Workflow Execution Sample
  if (db.v26WorkflowExecutions.size === 0) {
    db.v26WorkflowExecutions.set('WFX-V26-SEED-01', {
      id: 'WFX-V26-SEED-01',
      userId: 'usr_buyer_01',
      organisationId: 'ORG-V25-UG-PRODUCE',
      workflowType: 'COMMERCE_E2E_LIFECYCLE',
      currentStage: 'ORDER_CREATED',
      completedStages: ['DISCOVERY', 'ENQUIRY', 'RFQ_ISSUED', 'QUOTATION_ACCEPTED', 'AGREEMENT_ACTIVE', 'ORDER_CREATED'],
      linkedRefs: {
        listingId: 'V24-LST-SEED-01',
        rfqId: 'V24-RFQ-SEED-01',
        orderId: 'V24-ORD-SEED-01',
      },
      status: 'ACTIVE',
      honestyNotice: 'Sandbox execution pipeline: internal wallet obligation settlement only; external bank/tax/GPS remain unprovisioned.',
      createdAt: now,
      updatedAt: now,
    });
  }

  // 8. Seed Verified Report Export Sample
  if (db.v26ReportExports.size === 0) {
    const sampleBody = 'reportId,release,schemaVersion,status\nRPT-V26-SEED-01,V26.0-UNIVERSAL-PLATFORM-ACTIVATION,24,VERIFIED\n';
    const sha = crypto.createHash('sha256').update(sampleBody).digest('hex');
    db.v26ReportExports.set('RPT-V26-SEED-01', {
      id: 'RPT-V26-SEED-01',
      userId: 'usr_admin_01',
      tenantId: 'TENANT-UG',
      reportType: 'AUDIT_SUMMARY_CSV',
      format: 'CSV',
      rowCount: 1,
      contentSha256: sha,
      bytes: Buffer.byteLength(sampleBody, 'utf8'),
      content: sampleBody,
      createdAt: now,
    });
  }
}
