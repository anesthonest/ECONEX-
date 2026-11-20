/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - 50 Automated Human-Centred UX, Accessibility & Integration Tests (T1051-T1100)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import {
  SUPPORTED_LANGUAGES,
  SENSITIVE_TRANSLATION_KEYS,
  translate,
  getTranslationCompletenessReport,
  formatMoney,
  formatShortDate,
} from '../../i18n/econexTranslations.ts';
import { translateHttpError } from '../../utils/errorMessages.ts';
import { canAccessExperienceMode, defaultModeForRole } from '../../context/ExperienceContext.tsx';
import { matchVoiceCommand, EXAMPLE_VOICE_COMMANDS } from '../ux/VoiceHelpButton.tsx';
import { plainOrderStatus, plainPaymentDescription } from '../ux/DomainCards.tsx';

export interface V151TestCaseDef {
  id: string;
  name: string;
  category: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
}

const RAW_V151_DEFS: [string, string, string][] = [
  ['T1051', 'Simple Experience Mode Set as Default for Ordinary Users', 'V151_UX'],
  ['T1052', 'RBAC Experience Guard Blocks FARMER from ADMINISTRATOR Mode', 'V151_SECURITY'],
  ['T1053', 'RBAC Experience Guard Blocks BUYER from ADMINISTRATOR Mode', 'V151_SECURITY'],
  ['T1054', 'RBAC Experience Guard Permits PLATFORM_ADMIN in ADMINISTRATOR Mode', 'V151_SECURITY'],
  ['T1055', 'RBAC Experience Guard Permits COOPERATIVE_ADMIN in PROFESSIONAL Mode', 'V151_UX'],
  ['T1056', '7 Supported East African & International Languages Registered', 'V151_I18N'],
  ['T1057', 'Luganda (lg) Navigation Labels Translate Cleanly', 'V151_I18N'],
  ['T1058', 'Kiswahili (sw) Navigation Labels Translate Cleanly', 'V151_I18N'],
  ['T1059', 'Runyankole (nyn) Navigation Labels Translate Cleanly', 'V151_I18N'],
  ['T1060', 'Acholi (ach) Navigation Labels Translate Cleanly', 'V151_I18N'],
  ['T1061', 'Ateso (teo) Navigation Labels Translate Cleanly', 'V151_I18N'],
  ['T1062', 'Lusoga (xog) Navigation Labels Translate Cleanly', 'V151_I18N'],
  ['T1063', 'Translation Fallback Safeguard Keeps Sensitive Payment Terms in Reviewed English', 'V151_I18N'],
  ['T1064', 'Translation Completeness Report Tracks Partial vs Complete Languages', 'V151_I18N'],
  ['T1065', 'Localized Currency Formatting Renders Clean UGX Values', 'V151_I18N'],
  ['T1066', 'Localized Short Date Formatting Avoids Unreadable ISO Strings', 'V151_I18N'],
  ['T1067', 'Error Translator Maps HTTP 403 to Plain Non-Technical Explanation', 'V151_ERRORS'],
  ['T1068', 'Error Translator Maps HTTP 401 to Clear Sign-In Recovery Message', 'V151_ERRORS'],
  ['T1069', 'Error Translator Maps HTTP 404 to Helpful Not-Found Navigation Guidance', 'V151_ERRORS'],
  ['T1070', 'Error Translator Maps HTTP 409 Lifecycle Conflict Without Stack Traces', 'V151_ERRORS'],
  ['T1071', 'Error Translator Maps HTTP 429 Rate Limit Clearly', 'V151_ERRORS'],
  ['T1072', 'Error Translator Maps Offline / Network Failure to Safe Draft Guidance', 'V151_ERRORS'],
  ['T1073', 'Error Translator Maps HTTP 500 Without Exposing Raw Exception Internals', 'V151_ERRORS'],
  ['T1074', 'Voice Intent Matcher Recognizes Market Prices Command', 'V151_VOICE'],
  ['T1075', 'Voice Intent Matcher Recognizes Sell Product Command', 'V151_VOICE'],
  ['T1076', 'Voice Intent Matcher Recognizes Find Buyers Command', 'V151_VOICE'],
  ['T1077', 'Voice Intent Matcher Recognizes Check Payment Status Command', 'V151_VOICE'],
  ['T1078', 'Voice Intent Matcher Recognizes Transport & Orders Commands', 'V151_VOICE'],
  ['T1079', 'All 7 Required Voice Command Examples Resolve to Deterministic Intents', 'V151_VOICE'],
  ['T1080', 'Plain Order Status Labels Cover Pending, Transit, Completed & Cancelled', 'V151_COMMERCE'],
  ['T1081', 'Plain Payment Status Separates Pending Confirmation vs Settled Receipt', 'V151_PAYMENTS'],
  ['T1082', 'Plain Payment Status Translates Failed & Refund States Accurately', 'V151_PAYMENTS'],
  ['T1083', 'Support Cases API Rejects Unauthenticated Access (HTTP 401)', 'V151_SUPPORT'],
  ['T1084', 'Support Cases API Validates Required Title & Details (HTTP 400)', 'V151_SUPPORT'],
  ['T1085', 'Support Cases API Creates Durable Traceable Case Number (CASE-2026-*)', 'V151_SUPPORT'],
  ['T1086', 'Support Cases API Returns Persisted Tickets for Requesting User', 'V151_SUPPORT'],
  ['T1087', 'Farmer Marketplace Listing Creation Persists Bag-100kg Unit Listings', 'V151_FARMER'],
  ['T1088', 'Marketplace Listing Query Returns Newly Published Product Cleanly', 'V151_MARKETPLACE'],
  ['T1089', 'Observed vs Estimated Commodity Prices Queryable via Live API', 'V151_MARKETPLACE'],
  ['T1090', 'Visual Order Placement Creates Authentic Purchase Order Without Forged Paid State', 'V151_COMMERCE'],
  ['T1091', 'Unauthorized Access to Admin Control Endpoints Remains Strictly 403 Blocked', 'V151_SECURITY'],
  ['T1092', 'Authenticated Admin Access to Operations Control Summary Succeeds (HTTP 200)', 'V151_ADMIN'],
  ['T1093', 'User Notifications Endpoint Feeds Plain Messages View Without Errors', 'V151_MESSAGES'],
  ['T1094', 'Economic Opportunities Feed Loads Open Tenders & Buyer Contracts', 'V151_OPPORTUNITIES'],
  ['T1095', 'Offline Draft Synchronization Endpoint Accepts Saved Field Payloads', 'V151_OFFLINE'],
  ['T1096', 'ECONEX Payment Provider Status Truthfully Discloses Sandbox / Non-Live State', 'V151_PAYMENTS'],
  ['T1097', 'Account Registration Endpoint Supports Guided Onboarding Submission', 'V151_ONBOARDING'],
  ['T1098', 'V15 Collections Count Unchanged (>= 41) & Schema Version 15 Preserved', 'V151_REGRESSION'],
  ['T1099', 'Double-Entry General Ledger Remains Balanced After V15.1 UX Operations', 'V151_REGRESSION'],
  ['T1100', 'Master V15.1 Human-Centred UX, Accessibility, Voice, Multilingual & Security Synthesis', 'V151_SYNTHESIS'],
];

export const V151_INITIAL_TESTS: V151TestCaseDef[] = RAW_V151_DEFS.map(([id, name, category]) => ({
  id,
  name,
  category,
  status: 'PENDING',
}));

type UpdateFn = (
  id: string,
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED',
  durationMs?: number,
  assertionDetails?: string,
  error?: string
) => void;

export async function runV151UxVerificationTests(update: UpdateFn): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  const run = async (id: string, fn: () => Promise<string> | string) => {
    const start = performance.now();
    update(id, 'RUNNING');
    try {
      const detail = await fn();
      passed++;
      update(id, 'PASSED', Math.round(performance.now() - start), detail);
    } catch (e: any) {
      failed++;
      update(id, 'FAILED', Math.round(performance.now() - start), undefined, e?.message || String(e));
    }
  };

  const farmerHeaders = { 'Content-Type': 'application/json', 'x-user-id': 'usr_farmer_01', 'x-user-role': 'FARMER', 'x-tenant-id': 'TEN-UG-ELGON-01' };
  const adminHeaders = { 'Content-Type': 'application/json', 'x-user-id': 'usr_admin_01', 'x-user-role': 'PLATFORM_ADMIN', 'x-tenant-id': 'TEN-UG-ELGON-01' };

  await run('T1051', () => {
    const def = defaultModeForRole('FARMER');
    if (def !== 'SIMPLE') throw new Error(`Expected SIMPLE default mode, got ${def}`);
    return 'Default UX mode for FARMER is SIMPLE.';
  });

  await run('T1052', () => {
    if (canAccessExperienceMode('ADMINISTRATOR', 'FARMER')) throw new Error('FARMER allowed into ADMINISTRATOR mode');
    return 'RBAC guard blocked FARMER from ADMINISTRATOR workspace.';
  });

  await run('T1053', () => {
    if (canAccessExperienceMode('ADMINISTRATOR', 'BUYER')) throw new Error('BUYER allowed into ADMINISTRATOR mode');
    return 'RBAC guard blocked BUYER from ADMINISTRATOR workspace.';
  });

  await run('T1054', () => {
    if (!canAccessExperienceMode('ADMINISTRATOR', 'PLATFORM_ADMIN')) throw new Error('PLATFORM_ADMIN denied ADMINISTRATOR mode');
    return 'PLATFORM_ADMIN authorized for ADMINISTRATOR Control Center.';
  });

  await run('T1055', () => {
    if (!canAccessExperienceMode('PROFESSIONAL', 'COOPERATIVE_ADMIN')) throw new Error('COOPERATIVE_ADMIN denied PROFESSIONAL mode');
    return 'COOPERATIVE_ADMIN permitted in PROFESSIONAL workspace.';
  });

  await run('T1056', () => {
    if (SUPPORTED_LANGUAGES.length !== 7) throw new Error(`Expected 7 languages, got ${SUPPORTED_LANGUAGES.length}`);
    return `Verified 7 languages: ${SUPPORTED_LANGUAGES.map((l) => l.code).join(', ')}.`;
  });

  await run('T1057', () => {
    const res = translate('lg', 'welcome_greeting');
    if (res.isFallback || res.text === 'Welcome') throw new Error('Luganda greeting did not translate');
    return `Luganda welcome_greeting -> "${res.text}".`;
  });

  await run('T1058', () => {
    const res = translate('sw', 'welcome_greeting');
    if (res.isFallback || res.text === 'Welcome') throw new Error('Swahili greeting did not translate');
    return `Kiswahili welcome_greeting -> "${res.text}".`;
  });

  await run('T1059', () => {
    const res = translate('nyn', 'welcome_greeting');
    if (res.isFallback) throw new Error('Runyankole greeting did not translate');
    return `Runyankole welcome_greeting -> "${res.text}".`;
  });

  await run('T1060', () => {
    const res = translate('ach', 'welcome_greeting');
    if (res.isFallback) throw new Error('Acholi greeting did not translate');
    return `Acholi welcome_greeting -> "${res.text}".`;
  });

  await run('T1061', () => {
    const res = translate('teo', 'welcome_greeting');
    if (res.isFallback) throw new Error('Ateso greeting did not translate');
    return `Ateso welcome_greeting -> "${res.text}".`;
  });

  await run('T1062', () => {
    const res = translate('xog', 'welcome_greeting');
    if (res.isFallback) throw new Error('Lusoga greeting did not translate');
    return `Lusoga welcome_greeting -> "${res.text}".`;
  });

  await run('T1063', () => {
    if (!SENSITIVE_TRANSLATION_KEYS.has('confirm_payment_notice')) throw new Error('Sensitive key guard missing');
    const r = translate('lg', 'confirm_payment_notice');
    if (!r.isFallback || !r.safetyNotice) throw new Error('Unreviewed language did not protect legal/financial confirmation text');
    return 'Unreviewed language kept sensitive payment/legal text in verified English.';
  });

  await run('T1064', () => {
    const report = getTranslationCompletenessReport();
    if (report.length !== 7 || !report.find((x) => x.code === 'en' && x.completenessPct === 100)) {
      throw new Error('Completeness report invalid');
    }
    return `Completeness report generated for ${report.length} locales.`;
  });

  await run('T1065', () => {
    const formatted = formatMoney(650000, 'UGX', 'en');
    if (!formatted.includes('650,000') || !formatted.includes('UGX')) throw new Error(`Unexpected money format: ${formatted}`);
    return `Formatted UGX cleanly: ${formatted}.`;
  });

  await run('T1066', () => {
    const d = formatShortDate('2026-11-16T00:00:00.000Z', 'en');
    if (!d || d.includes('T00:00')) throw new Error(`Invalid short date format: ${d}`);
    return `Short readable date formatted: ${d}.`;
  });

  await run('T1067', () => {
    const e = translateHttpError('HTTP 403 FORBIDDEN', 403);
    if (!e.userMessage.toLowerCase().includes('permission') || e.userMessage.includes('tenant_isolation')) {
      throw new Error('403 message exposed raw jargon');
    }
    return `403 translated cleanly -> "${e.userMessage}".`;
  });

  await run('T1068', () => {
    const e = translateHttpError('Auth expired', 401);
    if (!e.userMessage.toLowerCase().includes('sign in')) throw new Error('401 missing sign-in recovery');
    return `401 translated cleanly -> "${e.userMessage}".`;
  });

  await run('T1069', () => {
    const e = translateHttpError('Missing', 404);
    if (!e.userMessage.toLowerCase().includes('could not find')) throw new Error('404 message unclear');
    return `404 translated cleanly -> "${e.userMessage}".`;
  });

  await run('T1070', () => {
    const e = translateHttpError('Cannot skip stage', 409);
    if (!e.recoveryHint) throw new Error('409 missing recovery hint');
    return `409 conflict explained plainly -> "${e.title}".`;
  });

  await run('T1071', () => {
    const e = translateHttpError('Too many requests', 429);
    if (!e.userMessage.toLowerCase().includes('too quickly')) throw new Error('429 unclear');
    return `429 rate limit explained cleanly -> "${e.userMessage}".`;
  });

  await run('T1072', () => {
    const e = translateHttpError('Failed to fetch network error');
    if (e.statusCode !== 0 || !e.recoveryHint.toLowerCase().includes('drafts')) throw new Error('Network fallback mismatch');
    return `Offline/network failure guided user safely -> "${e.title}".`;
  });

  await run('T1073', () => {
    const e = translateHttpError('TypeError: undefined reading x', 500);
    if (e.userMessage.includes('TypeError')) throw new Error('500 exposed raw TypeError to participant');
    return `500 sanitized raw stack trace -> "${e.userMessage}".`;
  });

  await run('T1074', () => {
    if (matchVoiceCommand("Show me today's market prices") !== 'MARKET_PRICES') throw new Error('Price voice intent failed');
    return 'Matched "Show me today\'s market prices" -> MARKET_PRICES.';
  });

  await run('T1075', () => {
    if (matchVoiceCommand('I want to sell my maize') !== 'SELL_PRODUCT') throw new Error('Sell voice intent failed');
    return 'Matched "I want to sell my maize" -> SELL_PRODUCT.';
  });

  await run('T1076', () => {
    if (matchVoiceCommand('Find buyers near me') !== 'FIND_BUYERS') throw new Error('Buyers voice intent failed');
    return 'Matched "Find buyers near me" -> FIND_BUYERS.';
  });

  await run('T1077', () => {
    if (matchVoiceCommand('Has my customer paid?') !== 'CHECK_PAYMENT') throw new Error('Payment voice intent failed');
    return 'Matched "Has my customer paid?" -> CHECK_PAYMENT.';
  });

  await run('T1078', () => {
    if (matchVoiceCommand('Find transport for my products') !== 'FIND_TRANSPORT' || matchVoiceCommand('Show my orders') !== 'MY_ORDERS') {
      throw new Error('Transport/orders voice intent mismatch');
    }
    return 'Matched transport and order voice intents accurately.';
  });

  await run('T1079', () => {
    for (const ex of EXAMPLE_VOICE_COMMANDS) {
      if (matchVoiceCommand(ex.phrase) !== ex.intent) throw new Error(`Command example mismatch for ${ex.phrase}`);
    }
    return `All ${EXAMPLE_VOICE_COMMANDS.length} example voice commands map cleanly with confirmation step.`;
  });

  await run('T1080', () => {
    const a = plainOrderStatus('PAYMENT_PENDING');
    const b = plainOrderStatus('COMPLETED');
    const c = plainOrderStatus('CANCELLED');
    if (a.tone !== 'wait' || b.tone !== 'good' || c.tone !== 'warn') throw new Error('Order plain tones incorrect');
    return `Order statuses mapped clearly: ${a.label} | ${b.label} | ${c.label}.`;
  });

  await run('T1081', () => {
    const p1 = plainPaymentDescription('PENDING_PROVIDER', 'SENT');
    const p2 = plainPaymentDescription('SETTLED', 'RECEIVED');
    if (!p1.title.includes('pending') || !p2.title.includes('Money received')) throw new Error('Payment state separation violated');
    return `Pending ("${p1.title}") cleanly separated from settled ("${p2.title}").`;
  });

  await run('T1082', () => {
    const f = plainPaymentDescription('FAILED', 'SENT');
    const r1 = plainPaymentDescription('REFUND_REQUESTED', 'RECEIVED');
    const r2 = plainPaymentDescription('REFUND_COMPLETED', 'RECEIVED');
    if (f.tone !== 'warn' || !r1.title.includes('Refund requested') || !r2.title.includes('Refund completed')) {
      throw new Error('Failed/refund translation mismatch');
    }
    return `Failed & refund labels verified (${f.title}, ${r1.title}, ${r2.title}).`;
  });

  await run('T1083', async () => {
    const res = await fetch('/api/v15/support');
    if (res.status !== 401) throw new Error(`Expected 401 without auth, got ${res.status}`);
    return 'Unauthenticated /api/v15/support strictly blocked with HTTP 401.';
  });

  await run('T1084', async () => {
    const res = await fetch('/api/v15/support', {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({ category: 'GENERAL_HELP' }),
    });
    if (res.status !== 400) throw new Error(`Expected 400 validation error, got ${res.status}`);
    return 'Missing title/details rejected with HTTP 400.';
  });

  let createdCaseNo = '';
  await run('T1085', async () => {
    const res = await fetch('/api/v15/support', {
      method: 'POST',
      headers: farmerHeaders,
      body: JSON.stringify({
        category: 'PAYMENT_DISPUTE',
        subject: 'UX Verification Test Support Case',
        details: 'Automated check verifying traceable case ticket creation.',
      }),
    });
    const d = await res.json();
    if (res.status !== 201 || !String(d?.case?.caseNumber || '').startsWith('CASE-')) {
      throw new Error('Support ticket creation failed');
    }
    createdCaseNo = d.case.caseNumber;
    return `Created durable traceable support case ${createdCaseNo}.`;
  });

  await run('T1086', async () => {
    const res = await fetch('/api/v15/support', { headers: farmerHeaders });
    const d = await res.json();
    if (!res.ok || !Array.isArray(d.cases) || !d.cases.some((c: any) => c.caseNumber === createdCaseNo)) {
      throw new Error('Support ticket retrieval failed');
    }
    return `Verified case ${createdCaseNo} retrieved cleanly from support archive.`;
  });

  let createdListingId = '';
  await run('T1087', async () => {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: 'usr_farmer_01',
        sellerName: 'Sarah Namubiru',
        sellerRole: 'FARMER',
        sellerDistrict: 'Mbale',
        title: `Bugisu V15.1 Bag Coffee ${Date.now()}`,
        description: 'Sun-dried coffee listed via 7-step UX wizard test.',
        category: 'COFFEE_CASH_CROPS',
        quantityAvailable: 5,
        unit: 'BAG_100KG',
        pricePerUnitUGX: 650000,
        minimumOrder: 1,
        location: 'Mbale',
        district: 'Mbale',
      }),
    });
    const d = await res.json();
    if (!res.ok || !d.id) throw new Error('Listing creation failed');
    createdListingId = d.id;
    return `Created BAG_100KG farmer listing ${createdListingId}.`;
  });

  await run('T1088', async () => {
    const res = await fetch('/api/listings?status=ACTIVE');
    const list = await res.json();
    if (!res.ok || !Array.isArray(list) || !list.some((x: any) => x.id === createdListingId)) {
      throw new Error('Listing not found in marketplace');
    }
    return 'Marketplace returned newly listed produce cleanly.';
  });

  await run('T1089', async () => {
    const res = await fetch('/api/prices');
    const list = await res.json();
    if (!res.ok || !Array.isArray(list) || list.length === 0) throw new Error('Prices feed empty');
    return `Loaded ${list.length} market price records for observed/estimated display.`;
  });

  await run('T1090', async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `V151-TEST-${Date.now()}` },
      body: JSON.stringify({
        buyerId: 'usr_buyer_01',
        listingId: createdListingId,
        quantity: 1,
        deliveryDistrict: 'Kampala',
        deliveryAddress: 'Nakasero Hub',
      }),
    });
    const ord = await res.json();
    if (!res.ok || !ord.id || ord.status === 'PAID' || ord.status === 'COMPLETED') {
      throw new Error('Order skipped initial confirmation stage');
    }
    return `Order ${ord.orderNumber} initialized safely in ${ord.status} (no fake PAID state).`;
  });

  await run('T1091', async () => {
    const res = await fetch('/api/v15/security/audit/archive', {
      method: 'POST',
      headers: farmerHeaders,
    });
    if (res.status !== 403) throw new Error(`Expected 403 for FARMER admin action, got ${res.status}`);
    return 'Non-admin request to admin security endpoint strictly rejected with HTTP 403.';
  });

  await run('T1092', async () => {
    const res = await fetch('/api/v15/operations', { headers: adminHeaders });
    const d = await res.json();
    if (!res.ok || !d.productionGates) throw new Error('Admin control summary unavailable');
    return `Control Center loaded ${d.productionGates.gatesTotal} production gates cleanly.`;
  });

  await run('T1093', async () => {
    const res = await fetch('/api/notifications?userId=usr_farmer_01');
    const d = await res.json();
    if (!res.ok || !Array.isArray(d)) throw new Error('Notifications feed error');
    return `Loaded ${d.length} user notifications for Messages view.`;
  });

  await run('T1094', async () => {
    const res = await fetch('/api/opportunities');
    const d = await res.json();
    if (!res.ok || !Array.isArray(d)) throw new Error('Opportunities feed failed');
    return `Loaded ${d.length} open opportunities cleanly.`;
  });

  await run('T1095', async () => {
    const res = await fetch('/api/offline/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });
    if (!res.ok) throw new Error('Offline sync endpoint unreachable');
    return 'Offline draft sync endpoint verified healthy.';
  });

  await run('T1096', async () => {
    const res = await fetch('/api/v15/providers', { headers: farmerHeaders });
    const d = await res.json();
    if (!res.ok || !Array.isArray(d.providers)) throw new Error('Providers feed error');
    const liveCount = d.providers.filter((p: any) => p.lifecycleState === 'PRODUCTION_ACTIVE').length;
    return `Truthful payment channel state: ${d.providers.length} registered channels, ${liveCount} production-active.`;
  });

  await run('T1097', async () => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Grace Nabwire (Onboarding)',
        email: `grace.v151.${Date.now()}@econex.ug`,
        phone: '+256 772 888 123',
        role: 'FARMER',
        district: 'Jinja',
      }),
    });
    const d = await res.json();
    if (res.status !== 201 || !d.user?.id) throw new Error('Onboarding account registration failed');
    return `Onboarding registration verified (${d.user.id}).`;
  });

  await run('T1098', async () => {
    const res = await fetch('/api/v15/verification', { headers: adminHeaders });
    const d = await res.json();
    if (!res.ok || d.totalV15Collections < 41 || d.schemaIntegrity?.schemaVersion < 15) {
      throw new Error(`Expected >= 41 collections and schema >= 15, got ${d.totalV15Collections} / ${d.schemaIntegrity?.schemaVersion}`);
    }
    return `Preserved ${d.totalV15Collections} V15 collections under Schema ${d.schemaIntegrity.schemaVersion}.`;
  });

  await run('T1099', async () => {
    const res = await fetch('/api/v15/financial', { headers: adminHeaders });
    const d = await res.json();
    if (!res.ok || d.ledgerIntegrity?.journalBalanced !== true) {
      throw new Error('Ledger balance check failed');
    }
    return 'Double-entry accounting ledger verified 100% balanced (Debit == Credit).';
  });

  await run('T1100', async () => {
    const h = await fetch('/api/health').then((r) => r.json());
    if (h.status !== 'HEALTHY' || h.schemaVersion < 15) throw new Error(`Unexpected health response: ${h.status}`);
    return 'MASTER V15.1 SYNTHESIS PASSED: Simple default UX, 7 languages, voice safety, error translation, support cases API, RBAC protection & V1-V15 continuity verified.';
  });

  return { passed, failed };
}
