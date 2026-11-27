/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V27.0 - Universal Economic Network, Trust, Opportunities, Intelligence & Governance Router (/api/v27/*)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  V27ActorCtx,
  V27HttpError,
  appealModerationCase,
  awardOpportunityResponse,
  buildV27OpenApiSpec,
  createBuyerRequirement,
  createCrmLead,
  createFieldAssignment,
  createNetworkProfile,
  createNetworkThread,
  createOpportunity,
  createPaidPromotion,
  createPilotProgramme,
  createReferralAttribution,
  createRelationshipInvite,
  createSavedSearch,
  createSupplierCapability,
  decideModerationCase,
  decideReputationAppeal,
  decideVerificationRecord,
  deleteSavedSearch,
  discoverEconomicNetwork,
  enrollPilotParticipant,
  executeV27NetworkAiAssist,
  fileReputationAppeal,
  getCountryNetworkMatrix,
  getEconomicActivityGraph,
  getEconomicIntelligenceSummary,
  getExplainableMatchRecommendations,
  getNetworkProfileById,
  getV27ReadinessMatrix,
  linkOpportunityToWalletObligation,
  listBuyerRequirements,
  listCrmLeads,
  listFieldAssignments,
  listFieldReports,
  listIntegrationPartners,
  listModerationCases,
  listNetworkProfiles,
  listNetworkThreads,
  listOpportunities,
  listOutcomeMetrics,
  listPaidPromotions,
  listPilotProgrammes,
  listReferrals,
  listRelationships,
  listReputationReviews,
  listSavedSearches,
  listSupplierCapabilities,
  listVerificationRecords,
  postNetworkMessage,
  recordOutcomeMetric,
  registerIntegrationPartner,
  reportModerationCase,
  respondToOpportunity,
  respondToRelationship,
  reviewFieldReport,
  submitMatchFeedback,
  submitReputationReview,
  submitVerificationRecord,
  syncFieldReport,
  transitionIntegrationPartner,
  transitionOpportunityStatus,
  transitionPilotStatus,
  updateCrmLeadStage,
  updateProfilePrivacy,
  updateRelationshipStatus,
  verifySupplierCapability,
} from './v27Engine.ts';
import type { UserRole } from '../types/index.ts';

export const v27Router = Router();

function resolveV27Ctx(req: Request, allowAnonymousFallback = false): V27ActorCtx {
  const authHeader = req.headers.authorization;
  let userId = (req.headers['x-user-id'] as string | undefined)?.trim();
  let role = (req.headers['x-user-role'] as string | undefined)?.trim();
  let authenticated = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const session = db.validateSession(authHeader.slice(7).trim());
    if (session) {
      userId = session.userId;
      role = session.role;
      authenticated = true;
    }
  }
  if (userId) {
    const u = db.users.get(userId);
    if (u) {
      role = u.role;
      authenticated = true;
    }
  }
  if (!authenticated && !allowAnonymousFallback) {
    throw new V27HttpError(401, 'AUTHENTICATION_REQUIRED');
  }

  const effectiveUserId = userId || 'usr_farmer_01';
  const effectiveRole = (role || 'FARMER') as UserRole;
  const prefs = db.v26UserPreferences.get(effectiveUserId);
  const requestedOrg =
    (req.headers['x-org-id'] as string | undefined)?.trim() ||
    prefs?.activeWorkspaceId ||
    db.users.get(effectiveUserId)?.organizationId ||
    'ORG-V25-UG-PRODUCE';
  const requestedCountry =
    (req.headers['x-country-code'] as string | undefined)?.trim() ||
    prefs?.activeCountryCode ||
    db.users.get(effectiveUserId)?.country ||
    'UG';

  return {
    tenantId: ((req.headers['x-tenant-id'] as string) || `TENANT-${requestedCountry.toUpperCase()}`).trim(),
    userId: effectiveUserId,
    role: effectiveRole,
    isPlatformAdmin: effectiveRole === 'PLATFORM_ADMIN',
    organisationId: requestedOrg,
    countryCode: requestedCountry.toUpperCase(),
    correlationId: (req as any).correlationId || `CORR-${crypto.randomBytes(4).toString('hex')}`,
    sourceIp: String(req.ip || '127.0.0.1'),
    authenticated,
  };
}

function handleV27(
  fn: (req: Request, res: Response, ctx: V27ActorCtx) => Promise<any> | any,
  options?: { allowAnonymous?: boolean }
) {
  return async (req: Request, res: Response) => {
    try {
      const ctx = resolveV27Ctx(req, Boolean(options?.allowAnonymous));
      await fn(req, res, ctx);
    } catch (err: any) {
      if (err instanceof V27HttpError) {
        return res.status(err.status).json({ error: err.message, code: err.code });
      }
      console.error('[ECONEX V27 ERROR]', err);
      return res.status(500).json({ error: err?.message || 'INTERNAL_V27_ERROR' });
    }
  };
}

// 1. Public Health, Readiness, OpenAPI & Schema 25 Migration Verification
v27Router.get(
  '/health',
  handleV27((_req, res) => {
    const integrity = db.validateV25SchemaIntegrity();
    const rb = db.verifyV26BackupAndRollbackReadiness();
    return res.json({
      status: integrity.valid ? 'HEALTHY' : 'DEGRADED',
      product: 'ECONEX',
      release: 'V27.0-UNIVERSAL-ECONOMIC-NETWORK',
      schemaVersion: db.schemaVersion,
      schema25IntegrityValid: integrity.valid,
      v26RollbackReady: rb.rollbackSupported,
      networkProfilesCount: db.v27NetworkProfiles.size,
      opportunitiesCount: db.v27Opportunities.size,
      pilotsCount: db.v27PilotProgrammes.size,
      attribution: 'Developed under VINEXSAH TECHNOLOGIES. All rights reserved.',
      timestamp: new Date().toISOString(),
    });
  }, { allowAnonymous: true })
);

v27Router.get(
  '/readiness-matrix',
  handleV27((_req, res) => res.json(getV27ReadinessMatrix()), { allowAnonymous: true })
);

v27Router.get(
  '/openapi.json',
  handleV27((_req, res) => res.json(buildV27OpenApiSpec()), { allowAnonymous: true })
);

v27Router.get(
  '/migration/status',
  handleV27((_req, res) => res.json(db.verifyV25MigrationCompleteness()), { allowAnonymous: true })
);

v27Router.get(
  '/migration/backup-verify',
  handleV27((_req, res) => res.json(db.verifyV26BackupAndRollbackReadiness()), { allowAnonymous: true })
);

// 2. Network Participant Profiles & Privacy Boundaries
v27Router.get(
  '/participants',
  handleV27((req, res, ctx) => {
    return res.json(
      listNetworkProfiles(ctx, {
        q: String(req.query.q || ''),
        countryCode: String(req.query.countryCode || ''),
        sectorId: String(req.query.sectorId || ''),
        participantType: String(req.query.participantType || ''),
        verifiedOnly: req.query.verifiedOnly === 'true',
      })
    );
  })
);

v27Router.get(
  '/participants/:id',
  handleV27((req, res, ctx) => res.json(getNetworkProfileById(req.params.id, ctx)))
);

v27Router.post(
  '/participants',
  handleV27((req, res, ctx) => res.status(201).json(createNetworkProfile(req.body || {}, ctx)))
);

v27Router.put(
  '/participants/:id/privacy',
  handleV27((req, res, ctx) => res.json(updateProfilePrivacy(req.params.id, req.body || {}, ctx)))
);

// 3. Trusted Relationships & Invitations
v27Router.get('/relationships', handleV27((_req, res, ctx) => res.json(listRelationships(ctx))));
v27Router.post('/relationships', handleV27((req, res, ctx) => res.status(201).json(createRelationshipInvite(req.body || {}, ctx))));
v27Router.post('/relationships/:id/respond', handleV27((req, res, ctx) => res.json(respondToRelationship(req.params.id, req.body || {}, ctx))));
v27Router.put('/relationships/:id/status', handleV27((req, res, ctx) => res.json(updateRelationshipStatus(req.params.id, req.body || {}, ctx))));

// 4. Evidence-Backed Verification & Reputation Reviews/Appeals
v27Router.get('/verification', handleV27((_req, res, ctx) => res.json(listVerificationRecords(ctx))));
v27Router.post('/verification', handleV27((req, res, ctx) => res.status(201).json(submitVerificationRecord(req.body || {}, ctx))));
v27Router.post('/verification/:id/decision', handleV27((req, res, ctx) => res.json(decideVerificationRecord(req.params.id, req.body || {}, ctx))));

v27Router.get('/reputation/reviews', handleV27((req, res) => res.json(listReputationReviews(String(req.query.targetProfileId || '') || undefined))));
v27Router.post('/reputation/reviews', handleV27((req, res, ctx) => res.status(201).json(submitReputationReview(req.body || {}, ctx))));
v27Router.get('/reputation/appeals', handleV27((_req, res) => res.json(Array.from(db.v27ReputationAppeals.values()))));
v27Router.post('/reputation/appeals', handleV27((req, res, ctx) => res.status(201).json(fileReputationAppeal(req.body || {}, ctx))));
v27Router.post('/reputation/appeals/:id/decide', handleV27((req, res, ctx) => res.json(decideReputationAppeal(req.params.id, req.body || {}, ctx))));

// 5. Discovery, Saved Searches & Explainable Matching
v27Router.get(
  '/discover',
  handleV27((req, res, ctx) =>
    res.json(
      discoverEconomicNetwork(
        {
          q: String(req.query.q || ''),
          entityScope: String(req.query.entityScope || 'ALL'),
          countryCode: String(req.query.countryCode || ''),
          sectorId: String(req.query.sectorId || ''),
          verifiedOnly: req.query.verifiedOnly === 'true',
          minTrustScore: Number(req.query.minTrustScore || 0),
          page: Number(req.query.page || 1),
          limit: Number(req.query.limit || 20),
        },
        ctx
      )
    )
  )
);
v27Router.get('/saved-searches', handleV27((_req, res, ctx) => res.json(listSavedSearches(ctx))));
v27Router.post('/saved-searches', handleV27((req, res, ctx) => res.status(201).json(createSavedSearch(req.body || {}, ctx))));
v27Router.delete('/saved-searches/:id', handleV27((req, res, ctx) => res.json(deleteSavedSearch(req.params.id, ctx))));

v27Router.get('/matching/recommendations', handleV27((req, res, ctx) => res.json(getExplainableMatchRecommendations(ctx, String(req.query.sectorId || '') || undefined))));
v27Router.post('/matching/feedback', handleV27((req, res, ctx) => res.status(201).json(submitMatchFeedback(req.body || {}, ctx))));

// 6. Economic Opportunity Exchange & Wallet Obligation Linkage
v27Router.get(
  '/opportunities',
  handleV27((req, res, ctx) =>
    res.json(
      listOpportunities(ctx, {
        countryCode: String(req.query.countryCode || ''),
        sectorId: String(req.query.sectorId || ''),
        status: String(req.query.status || ''),
        opportunityType: String(req.query.opportunityType || ''),
      })
    )
  )
);
v27Router.post('/opportunities', handleV27((req, res, ctx) => res.status(201).json(createOpportunity(req.body || {}, ctx))));
v27Router.post('/opportunities/:id/status', handleV27((req, res, ctx) => res.json(transitionOpportunityStatus(req.params.id, req.body || {}, ctx))));
v27Router.post('/opportunities/:id/responses', handleV27((req, res, ctx) => res.status(201).json(respondToOpportunity(req.params.id, req.body || {}, ctx))));
v27Router.post('/opportunities/:id/award', handleV27((req, res, ctx) => res.json(awardOpportunityResponse(req.params.id, req.body || {}, ctx))));
v27Router.post('/opportunities/:id/link-obligation', handleV27((req, res, ctx) => res.status(201).json(linkOpportunityToWalletObligation(req.params.id, ctx))));

// 7. Buyer Requirements, Supplier Capabilities, CRM & Paid Promotions
v27Router.get('/buyer-requirements', handleV27((req, res) => res.json(listBuyerRequirements(String(req.query.sectorId || '') || undefined))));
v27Router.post('/buyer-requirements', handleV27((req, res, ctx) => res.status(201).json(createBuyerRequirement(req.body || {}, ctx))));

v27Router.get('/supplier-capabilities', handleV27((req, res) => res.json(listSupplierCapabilities(String(req.query.sectorId || '') || undefined))));
v27Router.post('/supplier-capabilities', handleV27((req, res, ctx) => res.status(201).json(createSupplierCapability(req.body || {}, ctx))));
v27Router.post('/supplier-capabilities/:id/verify', handleV27((req, res, ctx) => res.json(verifySupplierCapability(req.params.id, req.body || {}, ctx))));

v27Router.get('/crm/leads', handleV27((_req, res, ctx) => res.json(listCrmLeads(ctx))));
v27Router.post('/crm/leads', handleV27((req, res, ctx) => res.status(201).json(createCrmLead(req.body || {}, ctx))));
v27Router.put('/crm/leads/:id/stage', handleV27((req, res, ctx) => res.json(updateCrmLeadStage(req.params.id, req.body || {}, ctx))));

v27Router.get('/promotions', handleV27((req, res) => res.json(listPaidPromotions(String(req.query.countryCode || '') || undefined))));
v27Router.post('/promotions', handleV27((req, res, ctx) => res.status(201).json(createPaidPromotion(req.body || {}, ctx))));

// 8. Messaging Threads & Activity Graph
v27Router.get('/threads', handleV27((_req, res, ctx) => res.json(listNetworkThreads(ctx))));
v27Router.post('/threads', handleV27((req, res, ctx) => res.status(201).json(createNetworkThread(req.body || {}, ctx))));
v27Router.post('/threads/:id/messages', handleV27((req, res, ctx) => res.status(201).json(postNetworkMessage(req.params.id, req.body || {}, ctx))));
v27Router.get('/graph', handleV27((req, res, ctx) => res.json(getEconomicActivityGraph(String(req.query.profileId || '') || undefined, ctx))));

// 9. Economic Intelligence, AI Governance, Countries, Referrals & Outcomes
v27Router.get('/intelligence/summary', handleV27((_req, res, ctx) => res.json(getEconomicIntelligenceSummary(ctx))));
v27Router.get('/intelligence/countries', handleV27((_req, res) => res.json(getCountryNetworkMatrix()), { allowAnonymous: true }));
v27Router.post('/intelligence/ai-assist', handleV27(async (req, res, ctx) => res.json(await executeV27NetworkAiAssist(req.body || {}, ctx))));

v27Router.get('/referrals', handleV27((_req, res, ctx) => res.json(listReferrals(ctx))));
v27Router.post('/referrals', handleV27((req, res, ctx) => res.status(201).json(createReferralAttribution(req.body || {}, ctx))));
v27Router.get('/outcomes', handleV27((_req, res) => res.json(listOutcomeMetrics())));
v27Router.post('/outcomes', handleV27((req, res, ctx) => res.status(201).json(recordOutcomeMetric(req.body || {}, ctx))));

// 10. Pilot Operations, Field Validation, Partner Governance & Moderation
v27Router.get('/pilots', handleV27((_req, res) => res.json(listPilotProgrammes())));
v27Router.post('/pilots', handleV27((req, res, ctx) => res.status(201).json(createPilotProgramme(req.body || {}, ctx))));
v27Router.post('/pilots/:id/status', handleV27((req, res, ctx) => res.json(transitionPilotStatus(req.params.id, req.body || {}, ctx))));
v27Router.post('/pilots/:id/participants', handleV27((req, res, ctx) => res.status(201).json(enrollPilotParticipant(req.params.id, req.body || {}, ctx))));

v27Router.get('/field/assignments', handleV27((_req, res, ctx) => res.json(listFieldAssignments(ctx))));
v27Router.post('/field/assignments', handleV27((req, res, ctx) => res.status(201).json(createFieldAssignment(req.body || {}, ctx))));
v27Router.get('/field/reports', handleV27((_req, res, ctx) => res.json(listFieldReports(ctx))));
v27Router.post('/field/reports', handleV27((req, res, ctx) => res.status(201).json(syncFieldReport(req.body || {}, ctx))));
v27Router.post('/field/reports/:id/review', handleV27((req, res, ctx) => res.json(reviewFieldReport(req.params.id, req.body || {}, ctx))));

v27Router.get('/partners', handleV27((_req, res, ctx) => res.json(listIntegrationPartners(ctx))));
v27Router.post('/partners', handleV27((req, res, ctx) => res.status(201).json(registerIntegrationPartner(req.body || {}, ctx))));
v27Router.post('/partners/:id/status', handleV27((req, res, ctx) => res.json(transitionIntegrationPartner(req.params.id, req.body || {}, ctx))));

v27Router.get('/moderation/cases', handleV27((_req, res, ctx) => res.json(listModerationCases(ctx))));
v27Router.post('/moderation/cases', handleV27((req, res, ctx) => res.status(201).json(reportModerationCase(req.body || {}, ctx))));
v27Router.post('/moderation/cases/:id/decide', handleV27((req, res, ctx) => res.json(decideModerationCase(req.params.id, req.body || {}, ctx))));
v27Router.post('/moderation/cases/:id/appeal', handleV27((req, res, ctx) => res.json(appealModerationCase(req.params.id, req.body || {}, ctx))));
