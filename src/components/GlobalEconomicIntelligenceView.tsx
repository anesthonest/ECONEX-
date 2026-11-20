/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V12.0 - Global Economic Intelligence, Predictive Analytics & Decision Coordination Console
 * Universal Economic Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/apiClient.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { sanitizeCsvCell } from '../utils/errorMessages.ts';
import type {
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
import {
  Globe2,
  BarChart3,
  LineChart,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  FlaskConical,
  Briefcase,
  Truck,
  Bot,
  Database,
  ShieldCheck,
  FileText,
  Settings,
  Download,
  RefreshCw,
  Search,
  Lock,
  Play,
  Menu,
  X,
} from 'lucide-react';

type V12Section =
  | 'overview'
  | 'economic-intel'
  | 'market-observatory'
  | 'forecasting'
  | 'early-warning'
  | 'opportunity'
  | 'scenario-sim'
  | 'business-intel'
  | 'trade-logistics'
  | 'ai-assistant'
  | 'data-sources'
  | 'model-governance'
  | 'reports'
  | 'administration';

const SECTION_NAV: { id: V12Section; label: string; icon: React.ComponentType<any>; group: string }[] = [
  { id: 'overview', label: 'Global Overview', icon: Globe2, group: 'Intelligence' },
  { id: 'economic-intel', label: 'Economic Intelligence', icon: BarChart3, group: 'Intelligence' },
  { id: 'market-observatory', label: 'Market Observatory', icon: LineChart, group: 'Intelligence' },
  { id: 'forecasting', label: 'Forecasting Centre', icon: TrendingUp, group: 'Analytics' },
  { id: 'early-warning', label: 'Early Warning Centre', icon: AlertTriangle, group: 'Analytics' },
  { id: 'opportunity', label: 'Opportunity Intelligence', icon: Sparkles, group: 'Analytics' },
  { id: 'scenario-sim', label: 'Scenario Simulator', icon: FlaskConical, group: 'Decision' },
  { id: 'business-intel', label: 'Business Intelligence', icon: Briefcase, group: 'Decision' },
  { id: 'trade-logistics', label: 'Trade & Logistics', icon: Truck, group: 'Decision' },
  { id: 'ai-assistant', label: 'AI Intelligence Assistant', icon: Bot, group: 'Decision' },
  { id: 'data-sources', label: 'Data Sources', icon: Database, group: 'Governance' },
  { id: 'model-governance', label: 'Model Governance', icon: ShieldCheck, group: 'Governance' },
  { id: 'reports', label: 'Intelligence Reports', icon: FileText, group: 'Governance' },
  { id: 'administration', label: 'Administration', icon: Settings, group: 'System' },
];

export const GlobalEconomicIntelligenceView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [section, setSection] = useState<V12Section>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Global Filters
  const [jurisdiction, setJurisdiction] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('2026-Q3_Q4');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('TEN-UG-ELGON-01');

  // Operational States
  const [loading, setLoading] = useState<boolean>(true);
  const [banner, setBanner] = useState<{ type: 'info' | 'success' | 'error' | 'forbidden'; message: string } | null>(null);

  // Core Data States (backed 100% by /api/v12/*)
  const [overview, setOverview] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [coverage, setCoverage] = useState<any>(null);
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [selectedIndicatorDetail, setSelectedIndicatorDetail] = useState<any>(null);
  const [regionalData, setRegionalData] = useState<any>(null);
  const [observations, setObservations] = useState<EconomicObservation[]>([]);
  const [forecasts, setForecasts] = useState<V12EconomicForecast[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<EconomicAnomaly[]>([]);
  const [warnings, setWarnings] = useState<V12EconomicEarlyWarning[]>([]);
  const [opportunities, setOpportunities] = useState<V12EconomicOpportunity[]>([]);
  const [scenarios, setScenarios] = useState<EconomicScenario[]>([]);
  const [scenarioResults, setScenarioResults] = useState<ScenarioSimulationResult[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [bizSimulations, setBizSimulations] = useState<BusinessImpactSimulation[]>([]);
  const [bizDeniedMessage, setBizDeniedMessage] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<EconomicRecommendation[]>([]);
  const [tradeLogistics, setTradeLogistics] = useState<any>(null);
  const [agents, setAgents] = useState<IntelligenceAgentPolicy[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agentRuns, setAgentRuns] = useState<IntelligenceAgentRun[]>([]);
  const [sources, setSources] = useState<IntelligenceSource[]>([]);
  const [models, setModels] = useState<ForecastModel[]>([]);
  const [driftEvents, setDriftEvents] = useState<ModelDriftEvent[]>([]);
  const [auditEvents, setAuditEvents] = useState<IntelligenceAuditEvent[]>([]);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [reviewQueue, setReviewQueue] = useState<IntelligenceReviewQueueItem[]>([]);
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [publications, setPublications] = useState<IntelligencePublicationRecord[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<IntelligenceSubscriptionProduct[]>([]);
  const [commercialDisclosure, setCommercialDisclosure] = useState<string>('');
  const [jobs, setJobs] = useState<V12BackgroundJob[]>([]);
  const [migrationAudit, setMigrationAudit] = useState<any>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  // Interactive Forms State
  const [importCsvText, setImportCsvText] = useState<string>(
    'indicatorId,numericValue,unit,currency,observationPeriod,regionOrCorridor\nIND-UG-MAIZE-WHOLESALE,1510,UGX_PER_KG,UGX,2026-12,Kampala Central Market'
  );
  const [importSourceId, setImportSourceId] = useState<string>('SRC-UG-MARKET-MONITORS');
  const [fcIndicatorId, setFcIndicatorId] = useState<string>('IND-UG-MAIZE-WHOLESALE');
  const [fcDomain, setFcDomain] = useState<string>('COMMODITY_PRICES');
  const [fcHorizon, setFcHorizon] = useState<string>('SHORT_TERM');
  const [fcAsync, setFcAsync] = useState<boolean>(false);
  const [evalTargetId, setEvalTargetId] = useState<string>('');
  const [evalActualValue, setEvalActualValue] = useState<string>('1495');

  const [warnTitle, setWarnTitle] = useState<string>('');
  const [warnDomain, setWarnDomain] = useState<string>('LOGISTICS');
  const [warnSeverity, setWarnSeverity] = useState<string>('ELEVATED');
  const [warnPublic, setWarnPublic] = useState<boolean>(false);
  const [warnEvidence, setWarnEvidence] = useState<string>('');

  const [scenName, setScenName] = useState<string>('Northern Corridor Fuel +15% Sensitivity');
  const [scenType, setScenType] = useState<string>('FUEL_PRICE_INCREASE');
  const [scenBaseline, setScenBaseline] = useState<string>('5200');
  const [scenShockPct, setScenShockPct] = useState<string>('15');

  const [bizSupplierDelta, setBizSupplierDelta] = useState<string>('6');
  const [bizDemandDelta, setBizDemandDelta] = useState<string>('4');
  const [bizFxDelta, setBizFxDelta] = useState<string>('3');
  const [bizTransportDelta, setBizTransportDelta] = useState<string>('9');

  const [assistantQuestion, setAssistantQuestion] = useState<string>(
    'Summarize verified Uganda food price and freight cost indicators alongside model forecasts.'
  );
  const [assistantReply, setAssistantReply] = useState<any>(null);
  const [agentPrompt, setAgentPrompt] = useState<string>('Analyze corridor inflation drivers using only verified V12 records.');
  const [agentAction, setAgentAction] = useState<string>('ANALYZE_CORRIDOR_SIGNALS');
  const [agentAutonomy, setAgentAutonomy] = useState<number>(2);

  const [newSourceName, setNewSourceName] = useState<string>('');
  const [newSourceJurisdiction, setNewSourceJurisdiction] = useState<string>('UG');
  const [newSourceSecret, setNewSourceSecret] = useState<string>('');

  const [newReportTitle, setNewReportTitle] = useState<string>('EAC Q4 Multi-Sector Economic Intelligence Brief');
  const [newReportType, setNewReportType] = useState<string>('REGIONAL_BRIEF');

  const actor = {
    tenantId: selectedTenantId,
    userId: currentUser?.id,
    userRole: role,
  };

  const publicActor = {
    tenantId: 'GLOBAL_PUBLIC',
    userId: currentUser?.id,
    userRole: role,
  };

  const handleErr = (err: any) => {
    if (err?.status === 403) {
      setBanner({ type: 'forbidden', message: `Access Denied (HTTP 403): ${err.message}` });
    } else {
      setBanner({ type: 'error', message: err?.message || 'Operation failed.' });
    }
  };

  const loadIntelligenceData = useCallback(async () => {
    setLoading(true);
    setBizDeniedMessage(null);
    try {
      const [
        ov,
        st,
        cov,
        inds,
        reg,
        obs,
        fcs,
        accHist,
        anoms,
        warns,
        opps,
        sims,
        recs,
        tl,
        agts,
        srcs,
        govModels,
        aud,
        dq,
        revQ,
        rpts,
        plans,
        jobList,
        mig,
      ] = await Promise.all([
        api.v12GetOverview({ jurisdiction, sector: sectorFilter }, publicActor),
        api.v12GetStatus(publicActor),
        api.v12GetCoverage(publicActor),
        api.v12GetIndicators({ jurisdiction, sector: sectorFilter, q: searchQuery }, publicActor),
        api.v12GetRegionalEconomy(jurisdiction, publicActor),
        api.v12GetObservations({ jurisdiction }, publicActor),
        api.v12GetForecasts({}, publicActor),
        api.v12GetForecastAccuracyHistory(publicActor),
        api.v12GetAnomalies(publicActor),
        api.v12GetEarlyWarnings(publicActor),
        api.v12GetOpportunities(publicActor),
        api.v12GetSimulations(publicActor),
        api.v12GetRecommendations(publicActor),
        api.v12GetTradeLogistics(publicActor),
        api.v12GetAgents(publicActor),
        api.v12GetSources(publicActor),
        api.v12GetGovernanceModels(publicActor),
        api.v12GetAuditEvents(publicActor),
        api.v12GetDataQuality(publicActor),
        api.v12GetReviewQueue(publicActor),
        api.v12GetReports(publicActor),
        api.v12GetSubscriptionPlans(publicActor),
        api.v12GetJobs(actor).catch(() => [] as V12BackgroundJob[]),
        api.v12GetMigrationAudit(publicActor),
      ]);

      setOverview(ov);
      setSystemStatus(st);
      setCoverage(cov);
      setIndicators(inds.indicators || []);
      setRegionalData(reg);
      setObservations(obs || []);
      setForecasts(fcs || []);
      if (fcs.length > 0 && !evalTargetId) setEvalTargetId(fcs[0].id);
      setAccuracyHistory(accHist || []);
      setAnomalies(anoms || []);
      setWarnings(warns || []);
      setOpportunities(opps || []);
      setScenarios(sims.scenarios || []);
      setScenarioResults(sims.results || []);
      setRecommendations(recs || []);
      setTradeLogistics(tl);
      setAgents(agts || []);
      if (agts.length > 0 && !selectedAgentId) setSelectedAgentId(agts[0].id);
      setSources(srcs || []);
      setModels(govModels.models || []);
      setDriftEvents(govModels.driftEvents || []);
      setAuditEvents(aud || []);
      setDataQuality(dq);
      setReviewQueue(revQ || []);
      setReports(rpts.reports || []);
      setPublications(rpts.publications || []);
      setSubscriptionPlans(plans.tiers || []);
      setCommercialDisclosure(plans.commercialDisclosure || '');
      setJobs(jobList || []);
      setMigrationAudit(mig);

      // Tenant-isolated Business Impact Simulations
      try {
        const biz = await api.v12GetBusinessImpactSimulations(actor);
        setBizSimulations(biz);
      } catch (bizErr: any) {
        setBizSimulations([]);
        setBizDeniedMessage(bizErr?.message || 'Tenant access restricted for current persona.');
      }
    } catch (err: any) {
      handleErr(err);
    } finally {
      setLoading(false);
    }
  }, [jurisdiction, sectorFilter, searchQuery, selectedTenantId, currentUser?.id, role]);

  useEffect(() => {
    loadIntelligenceData();
  }, [loadIntelligenceData]);

  useEffect(() => {
    if (!selectedAgentId) return;
    api.v12GetAgentRuns(selectedAgentId, actor).then(setAgentRuns).catch(() => setAgentRuns([]));
  }, [selectedAgentId, selectedTenantId, currentUser?.id]);

  const exportFile = (format: 'json' | 'csv', filenameBase: string, rows: any[]) => {
    let content = '';
    let mime = 'application/json';
    if (format === 'json') {
      content = JSON.stringify({ exportedAt: new Date().toISOString(), disclaimer: 'ECONEX Intelligence Export', rows }, null, 2);
    } else {
      mime = 'text/csv';
      if (rows.length === 0) {
        content = 'empty\n';
      } else {
        const cols = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object');
        const lines = [cols.map((c) => sanitizeCsvCell(c)).join(',')];
        rows.forEach((r) => {
          lines.push(cols.map((c) => sanitizeCsvCell(r[c] ?? '')).join(','));
        });
        content = lines.join('\n');
      }
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeSectionMeta = SECTION_NAV.find((s) => s.id === section)!;

  return (
    <div className="space-y-4">
      {/* Top Workspace Header & Operational Disclosures */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#D4AF37]">
              <span>ECONEX INTELLIGENCE</span>
              <span className="text-[#52525b]">·</span>
              <span>GLOBAL ECONOMIC INTELLIGENCE</span>
              <span className="text-[#52525b]">·</span>
              <span className="text-[#A0A0A0]">SCHEMA v{overview?.schemaVersion ?? 12}</span>
              {systemStatus?.circuitBreakerActive && (
                <>
                  <span className="text-[#52525b]">·</span>
                  <span className="text-red-400 font-semibold">AI CIRCUIT BREAKER ENGAGED</span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#F5F5F5] mt-1 tracking-tight">
              {activeSectionMeta.label}
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-0.5">
              Verified observations, statistical forecasting with prediction intervals, scenario simulations, and governed decision coordination.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded-lg text-xs text-[#F5F5F5] flex items-center gap-1.5"
            >
              {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
              <span>Sections</span>
            </button>
            <button
              onClick={() => exportFile('json', `aether-v12-${section}`, indicators)}
              className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37]/60 rounded-lg text-xs text-[#F5F5F5] flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} className="text-[#D4AF37]" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => exportFile('csv', `aether-v12-${section}`, indicators)}
              className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37]/60 rounded-lg text-xs text-[#F5F5F5] flex items-center gap-1.5 transition-colors"
            >
              <Download size={13} className="text-[#D4AF37]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadIntelligenceData}
              disabled={loading}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Sync Node</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="mt-4 pt-4 border-t border-[#1e1e24] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[#71717a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators or codes..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#09090b] border border-[#27272a] focus:border-[#D4AF37] rounded-lg text-[#F5F5F5] outline-none"
            />
          </div>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] focus:border-[#D4AF37] rounded-lg text-[#F5F5F5] outline-none"
          >
            <option value="ALL">Jurisdiction: All Corridors</option>
            <option value="UG">Uganda (UG)</option>
            <option value="KE">Kenya (KE)</option>
            <option value="TZ">Tanzania (TZ)</option>
            <option value="RW">Rwanda (RW)</option>
            <option value="BI">Burundi (BI)</option>
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] focus:border-[#D4AF37] rounded-lg text-[#F5F5F5] outline-none"
          >
            <option value="">Sector: Multi-Sector All</option>
            <option value="Agriculture">Agriculture & Food</option>
            <option value="Logistics">Logistics & Trade</option>
            <option value="Finance">Finance & Monetary</option>
            <option value="Energy">Energy & Utilities</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] focus:border-[#D4AF37] rounded-lg text-[#F5F5F5] outline-none"
          >
            <option value="2026-Q3_Q4">Horizon: 2026 Q3–Q4</option>
            <option value="2026-LAST-30D">Last 30 Days</option>
            <option value="2026-YTD">2026 Year-to-Date</option>
          </select>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] focus:border-[#D4AF37] rounded-lg text-[#F5F5F5] outline-none font-mono text-[11px]"
          >
            <option value="TEN-UG-ELGON-01">Tenant: TEN-UG-ELGON-01 (Elgon Coop)</option>
            <option value="TEN-UG-ROOFINGS-02">Tenant: TEN-UG-ROOFINGS-02 (Roofings UG)</option>
            <option value="TEN-KE-ROASTERS-03">Tenant: TEN-KE-ROASTERS-03 (Nairobi Roasters KE)</option>
            <option value="TEN-UG-DEVLAB-04">Tenant: TEN-UG-DEVLAB-04 (DevLab UG)</option>
          </select>
        </div>
      </div>

      {/* Feedback & RBAC Banners */}
      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            banner.type === 'forbidden'
              ? 'bg-red-950/50 border-red-700 text-red-200'
              : banner.type === 'error'
              ? 'bg-red-950/40 border-red-800 text-red-300'
              : banner.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-[#18181b] border-[#D4AF37]/40 text-[#F5F5F5]'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'forbidden' ? <Lock size={15} className="text-red-400 shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-[11px] underline opacity-80 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Workspace: Left 240px Sidebar + Right Analytical Canvas */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Navigation Sidebar */}
        <aside
          className={`${
            mobileNavOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-60 shrink-0 bg-[#121212] border border-[#27272a] rounded-xl p-2.5 space-y-3`}
        >
          {['Intelligence', 'Analytics', 'Decision', 'Governance', 'System'].map((grp) => (
            <div key={grp}>
              <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#71717a]">{grp}</div>
              <div className="space-y-0.5">
                {SECTION_NAV.filter((item) => item.group === grp).map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSection(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        active
                          ? 'bg-[#18181b] text-[#D4AF37] border border-[#443714]'
                          : 'text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#161619]'
                      }`}
                    >
                      <Icon size={14} className={active ? 'text-[#D4AF37]' : 'text-[#71717a]'} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Right Workspace Content */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {loading && !overview ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-10 text-center text-xs text-[#A0A0A0]">
              Loading V12 intelligence datasets from verified node...
            </div>
          ) : (
            <>
              {/* 1. GLOBAL OVERVIEW */}
              {section === 'overview' && overview && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 text-xs text-[#A0A0A0] flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong className="text-[#F5F5F5]">Source &amp; Coverage Honesty:</strong> {coverage?.coverageDisclaimer}
                    </span>
                    <span className="font-mono text-[11px] text-[#D4AF37]">
                      Local/Seeded: {systemStatus?.sourceConnectionsSummary?.localOnly ?? 0} · Reference: {systemStatus?.sourceConnectionsSummary?.referenceDirectory ?? 0} · External Unconfigured: {systemStatus?.sourceConnectionsSummary?.notConfigured ?? 0}
                    </span>
                  </div>

                  {/* Primary KPI Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
                      <div className="text-[11px] text-[#A0A0A0]">Economic Indicators</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#F5F5F5] mt-1">{overview.indicators.total}</div>
                      <div className="text-[11px] text-[#71717a] mt-1 font-mono">
                        {overview.indicators.fresh} fresh · {overview.indicators.stale} stale · {overview.indicators.unavailable} unavailable
                      </div>
                    </div>
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
                      <div className="text-[11px] text-[#A0A0A0]">Verified Observations</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#F5F5F5] mt-1">{overview.observationsCount}</div>
                      <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                        Quality Score: {overview.dataQuality.overallQualityScore ?? 'N/A'}/100
                      </div>
                    </div>
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
                      <div className="text-[11px] text-[#A0A0A0]">Active Forecasts</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#D4AF37] mt-1">{overview.forecasts.activeCount}</div>
                      <div className="text-[11px] text-[#71717a] mt-1 font-mono">
                        Avg MAPE: {overview.modelPerformance.averageMapePct ?? 'N/A'}% · Models: {overview.modelPerformance.activeProductionModels}
                      </div>
                    </div>
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
                      <div className="text-[11px] text-[#A0A0A0]">Risk &amp; Review Queue</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
                        {overview.alerts.activeWarnings + overview.alerts.openAnomalies}
                      </div>
                      <div className="text-[11px] text-[#71717a] mt-1 font-mono">
                        {overview.alerts.activeWarnings} warnings · {overview.alerts.openAnomalies} anomalies · {overview.pendingHumanReviews} reviews
                      </div>
                    </div>
                  </div>

                  {/* Registered vs Active Participants & Confidence Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                      <div className="text-sm font-semibold text-[#F5F5F5]">Registered vs. Active Participants</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3">
                          <div className="text-[11px] text-[#A0A0A0]">Registered Tenants &amp; Accounts</div>
                          <div className="text-xl font-bold font-mono tabular-nums text-[#F5F5F5] mt-1">
                            {overview.participantsSummary.registeredCount}
                          </div>
                        </div>
                        <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3">
                          <div className="text-[11px] text-[#A0A0A0]">Actively Transacting Entities</div>
                          <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                            {overview.participantsSummary.activeTransactingCount}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#71717a]">{overview.participantsSummary.distinctionNotice}</p>
                    </div>

                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                      <div className="text-sm font-semibold text-[#F5F5F5]">Forecast Confidence Distribution</div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {Object.entries(overview.forecasts.confidenceDistribution).map(([band, count]: [string, any]) => (
                          <div key={band} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-2.5">
                            <div className="text-[10px] font-mono text-[#A0A0A0]">{band}</div>
                            <div className="text-lg font-bold font-mono tabular-nums text-[#D4AF37] mt-1">{count}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-[#71717a]">
                        Registered Sources: {overview.sources.totalRegistered} · Verified Approved: {overview.sources.verifiedActive} · Stale Alerts: {overview.sources.staleWarnings}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ECONOMIC INTELLIGENCE */}
              {section === 'economic-intel' && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-[#F5F5F5]">Verified Economic Indicators &amp; Availability Registry</h2>
                        <p className="text-[11px] text-[#71717a]">{regionalData?.completenessDisclosure}</p>
                      </div>
                      <span className="text-[11px] font-mono text-[#A0A0A0]">{indicators.length} indicators shown</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#161619] text-[#A0A0A0] border-b border-[#27272a]">
                          <tr>
                            <th className="px-4 py-2.5 font-medium">Indicator</th>
                            <th className="px-4 py-2.5 font-medium">Jurisdiction · Sector</th>
                            <th className="px-4 py-2.5 font-medium text-right">Latest Value</th>
                            <th className="px-4 py-2.5 font-medium">Status</th>
                            <th className="px-4 py-2.5 font-medium">Source Classification</th>
                            <th className="px-4 py-2.5 font-medium text-right">Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e24]">
                          {indicators.map((ind) => (
                            <tr key={ind.id} className="hover:bg-[#161619]">
                              <td className="px-4 py-3">
                                <div className="font-medium text-[#F5F5F5]">{ind.name}</div>
                                <div className="text-[10px] font-mono text-[#71717a]">{ind.code} · Period {ind.effectivePeriod}</div>
                              </td>
                              <td className="px-4 py-3 text-[#A0A0A0]">
                                {ind.jurisdiction} · {ind.sector}
                              </td>
                              <td className="px-4 py-3 text-right font-mono tabular-nums">
                                {ind.availabilityStatus === 'UNAVAILABLE' || ind.latestValue === null ? (
                                  <span className="text-amber-400">UNAVAILABLE</span>
                                ) : (
                                  <span className="text-[#F5F5F5] font-semibold">
                                    {ind.latestValue.toLocaleString()} {ind.unit}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px]">
                                <span
                                  className={
                                    ind.availabilityStatus === 'AVAILABLE'
                                      ? 'text-emerald-400'
                                      : ind.availabilityStatus === 'STALE'
                                      ? 'text-amber-400'
                                      : 'text-red-400'
                                  }
                                >
                                  {ind.availabilityStatus}
                                </span>
                                {ind.unavailableReason && (
                                  <div className="text-[10px] text-[#71717a] font-sans max-w-xs">{ind.unavailableReason}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[11px] font-mono text-[#A0A0A0]">
                                {ind.sourceClassification}
                                <div className="text-[10px] text-[#71717a]">{ind.factOrEstimate}</div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => api.v12GetIndicatorDetail(ind.id, publicActor).then(setSelectedIndicatorDetail).catch(handleErr)}
                                  className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] rounded text-[11px] text-[#D4AF37]"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {selectedIndicatorDetail && (
                    <div className="bg-[#121212] border border-[#D4AF37]/40 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-[#D4AF37]">
                          {selectedIndicatorDetail.indicator?.name} ({selectedIndicatorDetail.indicator?.code})
                        </strong>
                        <button onClick={() => setSelectedIndicatorDetail(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                          Close
                        </button>
                      </div>
                      <p className="text-[#A0A0A0]">{selectedIndicatorDetail.definition?.calculationMethodology}</p>
                      <p className="text-[11px] text-[#71717a]">Limitations: {selectedIndicatorDetail.indicator?.limitations}</p>
                      {selectedIndicatorDetail.timeSeries?.points?.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                          {selectedIndicatorDetail.timeSeries.points.slice(-6).map((pt: any) => (
                            <div key={pt.observationId} className="bg-[#09090b] border border-[#1f1f23] rounded p-2 font-mono">
                              <div className="text-[10px] text-[#71717a]">{pt.period}</div>
                              <div className="text-xs text-[#F5F5F5] tabular-nums">{pt.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. MARKET OBSERVATORY */}
              {section === 'market-observatory' && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-[#F5F5F5]">Ingest Economic Observation (CSV / JSON Pipeline)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] text-[#A0A0A0] mb-1">Registered Source ID</label>
                        <select
                          value={importSourceId}
                          onChange={(e) => setImportSourceId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]"
                        >
                          {sources.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.id} · {s.sourceName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-[#A0A0A0] mb-1">CSV Payload (Validates duplicates, units, timestamps &amp; poisoning outliers)</label>
                        <textarea
                          rows={2}
                          value={importCsvText}
                          onChange={(e) => setImportCsvText(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg font-mono text-[11px] text-[#F5F5F5]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.v12ImportObservations({ sourceId: importSourceId, format: 'CSV', csvPayload: importCsvText }, actor);
                          setBanner({ type: 'success', message: `Ingested ${res.accepted.length} observations (${res.rejected.length} rejected).` });
                          await loadIntelligenceData();
                        } catch (e) {
                          handleErr(e);
                        }
                      }}
                      className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg text-xs"
                    >
                      Validate &amp; Ingest Observation
                    </button>
                  </div>

                  <div className="bg-[#121212] border border-[#27272a] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#27272a] text-sm font-semibold text-[#F5F5F5]">
                      Market &amp; Macro Observations ({observations.length})
                    </div>
                    <div className="overflow-x-auto max-h-[420px]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#161619] text-[#A0A0A0] border-b border-[#27272a] sticky top-0">
                          <tr>
                            <th className="px-4 py-2">Period</th>
                            <th className="px-4 py-2">Subject · Region</th>
                            <th className="px-4 py-2 text-right">Value</th>
                            <th className="px-4 py-2">Quality</th>
                            <th className="px-4 py-2">Source Class</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e24]">
                          {observations.slice(0, 40).map((o) => (
                            <tr key={o.id} className="hover:bg-[#161619]">
                              <td className="px-4 py-2 font-mono text-[#A0A0A0]">{o.observationPeriod}</td>
                              <td className="px-4 py-2">
                                <div className="text-[#F5F5F5]">{o.commodityOrSubject}</div>
                                <div className="text-[10px] text-[#71717a]">{o.jurisdiction} · {o.regionOrCorridor}</div>
                              </td>
                              <td className="px-4 py-2 text-right font-mono tabular-nums text-[#F5F5F5]">
                                {o.normalizedValue.toLocaleString()} {o.normalizedUnit}
                              </td>
                              <td className="px-4 py-2 font-mono text-emerald-400">{o.qualityScore}/100</td>
                              <td className="px-4 py-2 font-mono text-[11px] text-[#A0A0A0]">{o.sourceClassification}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FORECASTING CENTRE */}
              {section === 'forecasting' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">Statistical Forecast Generator</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select value={fcIndicatorId} onChange={(e) => setFcIndicatorId(e.target.value)} className="px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                          {indicators.map((i) => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                        <select value={fcDomain} onChange={(e) => setFcDomain(e.target.value)} className="px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                          <option value="COMMODITY_PRICES">COMMODITY_PRICES</option>
                          <option value="FOOD_PRICES">FOOD_PRICES</option>
                          <option value="FREIGHT_TRANSPORT_COSTS">FREIGHT_TRANSPORT_COSTS</option>
                          <option value="CURRENCY_TRENDS">CURRENCY_TRENDS</option>
                          <option value="REGIONAL_ECONOMIC_ACTIVITY">REGIONAL_ECONOMIC_ACTIVITY</option>
                        </select>
                        <select value={fcHorizon} onChange={(e) => setFcHorizon(e.target.value)} className="px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                          <option value="SHORT_TERM">SHORT_TERM (14d)</option>
                          <option value="NEAR_TERM">NEAR_TERM (30d)</option>
                          <option value="MEDIUM_TERM">MEDIUM_TERM (90d)</option>
                          <option value="LONG_TERM">LONG_TERM (365d · Guarded)</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[#A0A0A0]">
                          <input type="checkbox" checked={fcAsync} onChange={(e) => setFcAsync(e.target.checked)} />
                          <span>Dispatch via bounded background queue</span>
                        </label>
                        <button
                          onClick={async () => {
                            try {
                              const out = await api.v12GenerateForecast({ indicatorId: fcIndicatorId, domain: fcDomain, horizon: fcHorizon, asyncQueue: fcAsync }, actor);
                              setBanner({
                                type: 'success',
                                message: fcAsync
                                  ? `Queued forecast job ${out.job?.id} (${out.job?.status}).`
                                  : `Generated forecast ${out.id}: ${out.expectedValue} ${out.unit} [${out.confidenceClassification}].`,
                              });
                              await loadIntelligenceData();
                            } catch (e) {
                              handleErr(e);
                            }
                          }}
                          className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg"
                        >
                          Run Statistical Forecast
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">Post-Hoc Actual Accuracy Evaluation</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select value={evalTargetId} onChange={(e) => setEvalTargetId(e.target.value)} className="px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                          {forecasts.map((f) => (
                            <option key={f.id} value={f.id}>{f.id} · {f.indicatorName}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={evalActualValue}
                          onChange={(e) => setEvalActualValue(e.target.value)}
                          placeholder="Actual Observed Value"
                          className="px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5] font-mono"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const out = await api.v12EvaluateForecast(evalTargetId, Number(evalActualValue), actor);
                            setBanner({
                              type: 'success',
                              message: `Evaluated forecast ${evalTargetId}: Error ${out.evaluation?.percentageErrorPct}% · In Interval: ${out.evaluation?.withinPredictionInterval}.`,
                            });
                            await loadIntelligenceData();
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-4 py-1.5 bg-[#18181b] border border-[#D4AF37]/50 text-[#D4AF37] font-semibold rounded-lg"
                      >
                        Compare Forecast vs. Actual
                      </button>
                    </div>
                  </div>

                  {/* Forecasts List */}
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                    {forecasts.map((fc) => (
                      <div key={fc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[#D4AF37]">{fc.id}</span>
                            <span className="font-semibold text-[#F5F5F5]">{fc.indicatorName}</span>
                            <span className="font-mono text-[11px] text-[#A0A0A0]">· {fc.horizon} · {fc.methodUsed} · {fc.modelVersion}</span>
                            {fc.suspendedDueToDrift && <span className="text-red-400 font-mono">· SUSPENDED DUE TO DRIFT</span>}
                          </div>
                          <p className="text-[#A0A0A0]">{fc.methodology}</p>
                          <p className="text-[11px] text-[#71717a]">Limitations: {fc.knownLimitations.join(' | ')}</p>
                        </div>
                        <div className="text-left md:text-right shrink-0 font-mono tabular-nums space-y-0.5">
                          <div className="text-base font-bold text-[#F5F5F5]">
                            {fc.expectedValue.toLocaleString()} {fc.unit}
                          </div>
                          <div className="text-[11px] text-[#A0A0A0]">
                            PI({fc.predictionInterval.coverageLevelPct}%): [{fc.predictionInterval.lower} – {fc.predictionInterval.upper}]
                          </div>
                          <div className="text-[11px] text-emerald-400">
                            Confidence: {fc.confidenceClassification} · Obs: {fc.observationCountUsed}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. EARLY WARNING CENTRE */}
              {section === 'early-warning' && (
                <div className="space-y-4">
                  <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl p-3 text-xs text-amber-200">
                    <strong>Platform Risk Signal Notice:</strong> All alerts generated by ECONEX are analytical platform intelligence signals backed by verified source references—never official statutory government or emergency-service declarations. Public or CRITICAL alerts require PLATFORM_ADMIN authorization.
                  </div>

                  {/* Issue Warning Form */}
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">Issue Evidence-Backed Risk Signal</h2>
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.v12DetectAnomalies(actor);
                            setBanner({ type: 'info', message: `Statistical anomaly scan finished: ${res.newlyDetectedCount} new anomalies detected.` });
                            await loadIntelligenceData();
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-3 py-1 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] rounded text-[#D4AF37]"
                      >
                        Run Anomaly Scan
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        value={warnTitle}
                        onChange={(e) => setWarnTitle(e.target.value)}
                        placeholder="Warning Title"
                        className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]"
                      />
                      <select value={warnDomain} onChange={(e) => setWarnDomain(e.target.value)} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                        <option value="LOGISTICS">LOGISTICS</option>
                        <option value="FOOD_SUPPLY">FOOD_SUPPLY</option>
                        <option value="ENERGY">ENERGY</option>
                        <option value="CURRENCY_LIQUIDITY">CURRENCY_LIQUIDITY</option>
                        <option value="TRADE">TRADE</option>
                      </select>
                      <select value={warnSeverity} onChange={(e) => setWarnSeverity(e.target.value)} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                        <option value="WATCH">WATCH</option>
                        <option value="ELEVATED">ELEVATED</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL (Admin Only)</option>
                      </select>
                      <input
                        value={warnEvidence}
                        onChange={(e) => setWarnEvidence(e.target.value)}
                        placeholder="Evidence Summary"
                        className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-[#A0A0A0]">
                        <input type="checkbox" checked={warnPublic} onChange={(e) => setWarnPublic(e.target.checked)} />
                        <span>Publish as public network alert (PLATFORM_ADMIN required)</span>
                      </label>
                      <button
                        onClick={async () => {
                          try {
                            const w = await api.v12CreateEarlyWarning(
                              {
                                title: warnTitle || 'Corridor Transit Bottleneck Watch',
                                riskDomain: warnDomain,
                                severity: warnSeverity,
                                evidenceSummary: warnEvidence || 'Observed freight latency variance across Malaba OSBP.',
                                sourceReferences: ['OBS-UG-DIESEL-01', 'IND-EAC-FREIGHT-INDEX'],
                                isPublicAlert: warnPublic,
                              },
                              actor
                            );
                            setBanner({ type: 'success', message: `Warning ${w.id} recorded (${w.severity}).` });
                            setWarnTitle('');
                            setWarnEvidence('');
                            await loadIntelligenceData();
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg"
                      >
                        Issue Signal
                      </button>
                    </div>
                  </div>

                  {/* Warnings & Anomalies Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                      <div className="px-4 py-3 text-sm font-semibold text-[#F5F5F5]">Active Early Warnings ({warnings.length})</div>
                      {warnings.map((w) => (
                        <div key={w.id} className="p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F5F5F5]">{w.title}</span>
                            <span className="font-mono text-amber-400">{w.severity} · {w.reviewStatus}</span>
                          </div>
                          <p className="text-[#A0A0A0]">{w.evidenceSummary}</p>
                          <div className="text-[11px] text-[#71717a]">Sources: {w.sourceReferences.join(', ')}</div>
                          {w.reviewStatus !== 'CLOSED' && (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => api.v12ReviewEarlyWarning(w.id, 'MITIGATED', 'Contingency route advised', actor).then(loadIntelligenceData).catch(handleErr)}
                                className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#F5F5F5]"
                              >
                                Mark Mitigated
                              </button>
                              <button
                                onClick={() => api.v12ReviewEarlyWarning(w.id, 'CLOSED', 'Resolved after verification', actor).then(loadIntelligenceData).catch(handleErr)}
                                className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0]"
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                      <div className="px-4 py-3 text-sm font-semibold text-[#F5F5F5]">Economic Anomalies — Human Review Required ({anomalies.length})</div>
                      {anomalies.map((a) => (
                        <div key={a.id} className="p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F5F5F5]">{a.title}</span>
                            <span className="font-mono text-[#D4AF37]">{a.classification} · {a.reviewStatus}</span>
                          </div>
                          <p className="text-[#A0A0A0]">{a.detectionReason}</p>
                          <div className="font-mono text-[11px] text-[#71717a]">
                            Baseline: {a.historicalBaselineValue} · Observed: {a.observedValue} · Z-Score: {a.deviationZScore}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => api.v12ReviewAnomaly(a.id, 'CONFIRMED', 'Verified by operations analyst', actor).then(loadIntelligenceData).catch(handleErr)}
                              className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 rounded text-emerald-300"
                            >
                              Confirm Signal
                            </button>
                            <button
                              onClick={() => api.v12ReviewAnomaly(a.id, 'FALSE_POSITIVE', 'Normal seasonal shift confirmed', actor).then(loadIntelligenceData).catch(handleErr)}
                              className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0]"
                            >
                              Dismiss False Positive
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. OPPORTUNITY INTELLIGENCE */}
              {section === 'opportunity' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#D4AF37]">{opp.opportunityType}</span>
                        <span className="font-mono text-emerald-400">Confidence: {opp.confidence}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#F5F5F5]">{opp.title}</h3>
                      <p className="text-[#A0A0A0]">{opp.description}</p>
                      <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-2.5 space-y-1">
                        <div><strong className="text-[#F5F5F5]">Demand Evidence:</strong> <span className="text-[#A0A0A0]">{opp.demandEvidence}</span></div>
                        <div><strong className="text-[#F5F5F5]">Supply Evidence:</strong> <span className="text-[#A0A0A0]">{opp.supplyEvidence}</span></div>
                        {opp.estimatedMarketSizeAmount && (
                          <div className="font-mono text-[#D4AF37]">
                            Est. Market Size: {opp.estimatedMarketSizeAmount.toLocaleString()} {opp.estimatedMarketSizeCurrency}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-[#71717a]">
                        Linked V11 Records: {opp.linkedV11RecordIds.join(', ') || 'None'} · {opp.disclaimer}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 7. SCENARIO SIMULATOR */}
              {section === 'scenario-sim' && (
                <div className="space-y-4">
                  <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-3 text-xs text-blue-200">
                    <strong>SIMULATED_SCENARIO Isolation:</strong> All scenario shock modeling and regional stress tests run inside strictly isolated simulation tables (<code className="font-mono">mutatesRealRecords: false</code>). Operational V1–V11 ledgers are untouched.
                  </div>

                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <h2 className="text-sm font-semibold text-[#F5F5F5]">Run Economic Shock or Multi-Country Stress Test</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input value={scenName} onChange={(e) => setScenName(e.target.value)} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]" />
                      <select value={scenType} onChange={(e) => setScenType(e.target.value)} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                        <option value="FUEL_PRICE_INCREASE">FUEL_PRICE_INCREASE</option>
                        <option value="CURRENCY_DEPRECIATION">CURRENCY_DEPRECIATION</option>
                        <option value="TRANSPORT_COST_INCREASE">TRANSPORT_COST_INCREASE</option>
                        <option value="REGIONAL_BORDER_DISRUPTION">REGIONAL_BORDER_DISRUPTION</option>
                        <option value="MULTI_COUNTRY_STRESS">MULTI_COUNTRY_STRESS</option>
                      </select>
                      <input type="number" value={scenBaseline} onChange={(e) => setScenBaseline(e.target.value)} placeholder="Baseline" className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5] font-mono" />
                      <input type="number" value={scenShockPct} onChange={(e) => setScenShockPct(e.target.value)} placeholder="Shock %" className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5] font-mono" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await api.v12CreateSimulation({ scenarioName: scenName, scenarioType: scenType, baselineValue: Number(scenBaseline), shockPct: Number(scenShockPct) }, publicActor);
                            setBanner({ type: 'success', message: 'Created isolated SIMULATED_SCENARIO run.' });
                            await loadIntelligenceData();
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg"
                      >
                        Run Isolated Simulation
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api.v12RunStressTest({ scenarioName: 'EAC Multi-Corridor Stress Test', shockPct: Number(scenShockPct) }, publicActor);
                            setBanner({ type: 'success', message: 'Regional multi-corridor stress test completed cleanly.' });
                            await loadIntelligenceData();
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-4 py-1.5 bg-[#18181b] border border-[#D4AF37]/50 text-[#D4AF37] font-semibold rounded-lg"
                      >
                        Run Multi-Country Stress Test
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {scenarios.map((s) => {
                      const res = scenarioResults.find((r) => r.scenarioId === s.id);
                      return (
                        <div key={s.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[#D4AF37]">{s.label}</span>
                            <span className="text-[11px] font-mono text-[#71717a]">{s.affectedJurisdictions.join(', ')}</span>
                          </div>
                          <div className="text-sm font-semibold text-[#F5F5F5]">{s.scenarioName}</div>
                          <p className="text-[#A0A0A0]">{s.description}</p>
                          {res?.baselineComparison.map((m) => (
                            <div key={m.metric} className="bg-[#09090b] border border-[#1f1f23] rounded p-2 flex items-center justify-between font-mono">
                              <span className="text-[#A0A0A0]">{m.metric}</span>
                              <span className="text-[#F5F5F5] tabular-nums">
                                {m.baselineValue} → {m.simulatedValue} ({m.deltaPct > 0 ? '+' : ''}{m.deltaPct}% {m.unit})
                              </span>
                            </div>
                          ))}
                          <button
                            onClick={() => api.v12CompareSimulation(s.id, [0, 10, 25, -10], publicActor).then(setComparisonResult).catch(handleErr)}
                            className="px-3 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#D4AF37]"
                          >
                            Compare Sensitivity (+10% / +25% / -10%)
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {comparisonResult && (
                    <div className="bg-[#121212] border border-[#D4AF37]/40 rounded-xl p-4 text-xs space-y-2">
                      <div className="font-semibold text-[#D4AF37]">Sensitivity Matrix — {comparisonResult.scenarioId} ({comparisonResult.label})</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                        {comparisonResult.comparisons.map((c: any) => (
                          <div key={c.shockPct} className="bg-[#09090b] border border-[#1f1f23] rounded p-2">
                            <div className="text-[#A0A0A0]">Shock {c.shockPct > 0 ? `+${c.shockPct}` : c.shockPct}%</div>
                            <div className="text-[#F5F5F5] font-bold">{c.projectedValue}</div>
                            <div className="text-[10px] text-[#71717a]">Downstream: {c.downstreamPriceImpactPct}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 8. BUSINESS INTELLIGENCE (STRICTLY TENANT-ISOLATED) */}
              {section === 'business-intel' && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-[#F5F5F5]">Tenant-Isolated Business Impact Calculator</h2>
                        <p className="text-[11px] text-[#71717a]">Active Tenant: <span className="font-mono text-[#D4AF37]">{selectedTenantId}</span> · Role: <span className="font-mono">{role}</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-[#A0A0A0]">Supplier Cost Δ%</label>
                        <input type="number" value={bizSupplierDelta} onChange={(e) => setBizSupplierDelta(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded text-[#F5F5F5] font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A0A0A0]">Demand Δ%</label>
                        <input type="number" value={bizDemandDelta} onChange={(e) => setBizDemandDelta(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded text-[#F5F5F5] font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A0A0A0]">FX Exposure Δ%</label>
                        <input type="number" value={bizFxDelta} onChange={(e) => setBizFxDelta(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded text-[#F5F5F5] font-mono" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#A0A0A0]">Transport Δ%</label>
                        <input type="number" value={bizTransportDelta} onChange={(e) => setBizTransportDelta(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 bg-[#09090b] border border-[#27272a] rounded text-[#F5F5F5] font-mono" />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await api.v12RunBusinessImpactSimulation(
                            {
                              supplierCostDeltaPct: Number(bizSupplierDelta),
                              productDemandDeltaPct: Number(bizDemandDelta),
                              fxExposureDeltaPct: Number(bizFxDelta),
                              transportExpenseDeltaPct: Number(bizTransportDelta),
                            },
                            actor
                          );
                          setBanner({ type: 'success', message: `Executed isolated business impact model for ${selectedTenantId}.` });
                          await loadIntelligenceData();
                        } catch (e) {
                          handleErr(e);
                        }
                      }}
                      className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg"
                    >
                      Calculate Best / Base / Stress Projections
                    </button>
                  </div>

                  {bizDeniedMessage ? (
                    <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-xs text-red-200 flex items-center gap-2">
                      <Lock size={15} className="text-red-400 shrink-0" />
                      <span>
                        <strong>Cross-Tenant Isolation Enforced:</strong> {bizDeniedMessage} Switch active tenant to your assigned organization or switch persona to Platform Controller.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bizSimulations.map((b) => (
                        <div key={b.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F5F5F5]">{b.businessName} ({b.tenantId})</span>
                            <span className="font-mono text-[#D4AF37]">{b.label}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono tabular-nums">
                            {(['bestCase', 'baseCase', 'stressCase'] as const).map((k) => {
                              const sc = b.projectedScenarios[k];
                              return (
                                <div key={k} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 space-y-1">
                                  <div className="text-[11px] uppercase text-[#A0A0A0]">{k}</div>
                                  <div className="text-[#F5F5F5]">Rev: {sc.projectedRevenue.toLocaleString()} {b.inputAssumptions.currency}</div>
                                  <div className="text-[#A0A0A0]">Cost: {sc.projectedCost.toLocaleString()}</div>
                                  <div className={sc.netMargin >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    Margin: {sc.netMargin.toLocaleString()} · Pressure: {sc.cashPressure}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-[#71717a]">{b.disclaimer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 9. TRADE & LOGISTICS INTELLIGENCE */}
              {section === 'trade-logistics' && tradeLogistics && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-3 text-xs text-[#A0A0A0]">
                    {tradeLogistics.disclosure}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">Logistics Carriers ({tradeLogistics.carriers?.length || 0})</h2>
                      {tradeLogistics.carriers?.map((c: any) => (
                        <div key={c.id} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-[#F5F5F5]">{c.carrierName}</div>
                            <div className="text-[11px] text-[#71717a]">{c.corridorsCovered?.join(' · ')}</div>
                          </div>
                          <div className="text-right font-mono text-[11px]">
                            <div className="text-[#D4AF37]">{c.trackingSourceType}</div>
                            <div className="text-[#A0A0A0]">{c.deliveryEstimateBasis}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">Active Shipments &amp; Qualified Suppliers</h2>
                      {tradeLogistics.activeShipments?.slice(0, 5).map((s: any) => (
                        <div key={s.id} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-[#F5F5F5]">{s.shipmentNumber} · {s.origin} → {s.destination}</div>
                            <div className="text-[11px] text-[#71717a] font-mono">{s.deliveryTimeClassification}</div>
                          </div>
                          <span className="font-mono text-emerald-400">{s.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 10. AI INTELLIGENCE ASSISTANT & 15 GOVERNED AGENTS */}
              {section === 'ai-assistant' && (
                <div className="space-y-4">
                  {/* Grounded Assistant Query */}
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <h2 className="text-sm font-semibold text-[#F5F5F5]">Grounded AI Economic Intelligence Assistant</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={assistantQuestion}
                        onChange={(e) => setAssistantQuestion(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#09090b] border border-[#27272a] focus:border-[#D4AF37] rounded-lg text-[#F5F5F5]"
                      />
                      <button
                        onClick={async () => {
                          try {
                            const rep = await api.v12QueryAssistant({ question: assistantQuestion, jurisdiction }, publicActor);
                            setAssistantReply(rep);
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg shrink-0"
                      >
                        Query Grounded Intelligence
                      </button>
                    </div>
                    {assistantReply && (
                      <div className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3.5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#D4AF37]">
                          <span>Model: {assistantReply.modelDependency}</span>
                          <span>Cited Sources: {assistantReply.citedSourceIds?.join(', ') || 'None'}</span>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-[#F5F5F5] leading-relaxed">{assistantReply.answer}</pre>
                        {assistantReply.limitations?.length > 0 && (
                          <div className="text-[11px] text-[#71717a] border-t border-[#1e1e24] pt-2">
                            Limitations: {assistantReply.limitations.join(' · ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 15 Specialist Governed Agents */}
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-[#F5F5F5]">15 Governed Economic Intelligence Agents (Levels 1–5)</h2>
                        <p className="text-[11px] text-[#71717a]">Level 5 actions NEVER self-execute and enforce dual human authorization.</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const nextActive = !systemStatus?.circuitBreakerActive;
                            await api.v12ToggleCircuitBreaker(nextActive, actor);
                            setBanner({ type: 'info', message: `AI Emergency Circuit Breaker set to ${nextActive ? 'ACTIVE' : 'INACTIVE'}.` });
                            await loadIntelligenceData();
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg font-semibold border ${
                          systemStatus?.circuitBreakerActive
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                            : 'bg-red-950/60 border-red-800 text-red-300'
                        }`}
                      >
                        {systemStatus?.circuitBreakerActive ? 'Reset Emergency Circuit Breaker' : 'Engage Emergency Circuit Breaker'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>{ag.agentCode} · {ag.agentName}</option>
                        ))}
                      </select>
                      <select value={agentAutonomy} onChange={(e) => setAgentAutonomy(Number(e.target.value))} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                        <option value={1}>Level 1 · Read-Only Synthesis</option>
                        <option value={2}>Level 2 · Analytical Classification</option>
                        <option value={3}>Level 3 · Human-Reviewed Draft</option>
                        <option value={4}>Level 4 · Bounded Coordination Prep</option>
                        <option value={5}>Level 5 · Regulated / Financial (Dual Auth Hold)</option>
                      </select>
                      <input value={agentAction} onChange={(e) => setAgentAction(e.target.value)} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5] font-mono" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} className="flex-1 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]" />
                      <button
                        onClick={async () => {
                          try {
                            const run = await api.v12RunAgent(selectedAgentId, { prompt: agentPrompt, requestedAction: agentAction, autonomyLevel: agentAutonomy }, actor);
                            setBanner({ type: 'success', message: `Agent Run ${run.id} -> ${run.executionStatus}` });
                            const runs = await api.v12GetAgentRuns(selectedAgentId, actor);
                            setAgentRuns(runs);
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg flex items-center gap-1.5 shrink-0"
                      >
                        <Play size={12} /> Execute Agent
                      </button>
                    </div>

                    {agentRuns.length > 0 && (
                      <div className="divide-y divide-[#1e1e24] border border-[#1f1f23] rounded-lg bg-[#09090b]">
                        {agentRuns.slice(0, 6).map((r) => (
                          <div key={r.id} className="p-3 space-y-1">
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-[#D4AF37]">{r.id} · Level {r.autonomyLevel} · {r.requestedAction}</span>
                              <span className="text-[#F5F5F5]">{r.executionStatus}</span>
                            </div>
                            <p className="text-[#A0A0A0]">{r.responseText}</p>
                            {r.executionStatus === 'PENDING_DUAL_AUTHORIZATION' && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => api.v12ApproveAgentRun(r.id, currentUser?.id || 'usr_admin_01', actor).then(() => api.v12GetAgentRuns(selectedAgentId, actor).then(setAgentRuns)).catch(handleErr)}
                                  className="px-2.5 py-1 bg-[#18181b] border border-[#D4AF37]/50 text-[#D4AF37] rounded text-[11px]"
                                >
                                  Sign Dual Auth Approval ({r.approvers.length}/2)
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 11. DATA SOURCES */}
              {section === 'data-sources' && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <h2 className="text-sm font-semibold text-[#F5F5F5]">Register Intelligence Source (Encrypted/Hashed Secret Vault)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} placeholder="Source Name" className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]" />
                      <input value={newSourceJurisdiction} onChange={(e) => setNewSourceJurisdiction(e.target.value)} placeholder="Jurisdiction (e.g. UG)" className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5] font-mono" />
                      <input type="password" value={newSourceSecret} onChange={(e) => setNewSourceSecret(e.target.value)} placeholder="Optional API Secret (Never returned)" className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]" />
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const created = await api.v12RegisterSource(
                            {
                              sourceName: newSourceName || 'EAC Partner Observatory CSV Source',
                              sourceCategory: 'PARTNER_FEED',
                              sourceClassification: 'AUTHORIZED_PARTNER_SOURCE',
                              jurisdiction: newSourceJurisdiction || 'UG',
                              apiSecretForStorageOnly: newSourceSecret || undefined,
                            },
                            actor
                          );
                          setBanner({ type: 'success', message: `Registered source ${created.id} (${created.adminApprovalStatus}).` });
                          setNewSourceName('');
                          setNewSourceSecret('');
                          await loadIntelligenceData();
                        } catch (e) {
                          handleErr(e);
                        }
                      }}
                      className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg"
                    >
                      Register Source
                    </button>
                  </div>

                  <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                    {sources.map((s: any) => (
                      <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[#D4AF37]">{s.id}</span>
                            <span className="font-semibold text-[#F5F5F5]">{s.sourceName}</span>
                            <span className="font-mono text-[11px] text-[#A0A0A0]">· {s.connectionStatus}</span>
                          </div>
                          <div className="text-[11px] text-[#71717a]">
                            {s.sourceCategory} · {s.sourceClassification} · Approval: {s.adminApprovalStatus}
                            {s.credentialSummary && ` · Key Preview: ${s.credentialSummary.maskedPreview}`}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => api.v12VerifySource(s.id, 'APPROVED', actor).then(loadIntelligenceData).catch(handleErr)}
                            className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#D4AF37]"
                          >
                            Verify (Admin)
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.v12RefreshSource(s.id, actor);
                                setBanner({ type: 'info', message: res.message || `Refreshed ${s.id}` });
                                await loadIntelligenceData();
                              } catch (e) {
                                handleErr(e);
                              }
                            }}
                            className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#F5F5F5]"
                          >
                            Refresh Check
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 12. MODEL GOVERNANCE */}
              {section === 'model-governance' && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                    <div className="px-4 py-3 text-sm font-semibold text-[#F5F5F5]">Forecast Model Registry &amp; Drift Fallback ({models.length})</div>
                    {models.map((m) => (
                      <div key={m.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-[#F5F5F5]">
                            {m.modelName} <span className="font-mono text-[#D4AF37]">v{m.version}</span> · <span className="font-mono text-emerald-400">{m.deploymentStatus}</span>
                          </div>
                          <div className="font-mono text-[11px] text-[#A0A0A0]">
                            MAPE: {m.errorMetrics.mapePct}% · RMSE: {m.errorMetrics.rmse} · Coverage: {m.errorMetrics.predictionIntervalCoveragePct}% · Baseline: {String(m.isBaselineModel)}
                          </div>
                          <div className="text-[11px] text-[#71717a]">Weaknesses: {m.knownWeaknesses.join(' | ')}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => api.v12TransitionModelStatus(m.id, 'ACTIVE', 'Promoted via Model Governance', actor).then(loadIntelligenceData).catch(handleErr)}
                            className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#D4AF37]"
                          >
                            Promote ACTIVE
                          </button>
                          <button
                            onClick={() => api.v12TriggerModelDrift(m.id, { driftType: 'ACCURACY_DETERIORATION', metricBefore: m.errorMetrics.mapePct, metricAfter: 23.4 }, actor).then(loadIntelligenceData).catch(handleErr)}
                            className="px-2.5 py-1 bg-amber-950/60 border border-amber-800 rounded text-amber-300"
                          >
                            Simulate Drift Fallback
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {driftEvents.length > 0 && (
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
                      <h3 className="font-semibold text-[#F5F5F5]">Model Drift Events ({driftEvents.length})</h3>
                      {driftEvents.map((d) => (
                        <div key={d.id} className="bg-[#09090b] border border-[#1f1f23] rounded p-2.5 font-mono text-[11px] flex justify-between">
                          <span className="text-amber-300">{d.modelId} · {d.driftType} ({d.metricBefore}% → {d.metricAfter}%)</span>
                          <span className="text-[#A0A0A0]">Fallback: {d.fallbackModelId}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs">
                    <h3 className="font-semibold text-[#F5F5F5]">Immutable Intelligence Audit Log (Latest 15 of {auditEvents.length})</h3>
                    <div className="max-h-60 overflow-y-auto divide-y divide-[#1e1e24]">
                      {auditEvents.slice(0, 15).map((ev) => (
                        <div key={ev.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="font-mono text-[#D4AF37]">{ev.actionType}</span> · <span className="text-[#F5F5F5]">{ev.details}</span>
                          </div>
                          <span className="font-mono text-[10px] text-[#71717a]">{ev.actorId} · {ev.timestamp.slice(0, 19)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 13. INTELLIGENCE REPORTS & REVIEW QUEUE */}
              {section === 'reports' && (
                <div className="space-y-4">
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <h2 className="text-sm font-semibold text-[#F5F5F5]">Compile Custom Intelligence Report</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={newReportTitle} onChange={(e) => setNewReportTitle(e.target.value)} className="flex-1 px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]" />
                      <select value={newReportType} onChange={(e) => setNewReportType(e.target.value)} className="px-3 py-1.5 bg-[#09090b] border border-[#27272a] rounded-lg text-[#F5F5F5]">
                        <option value="REGIONAL_BRIEF">REGIONAL_BRIEF</option>
                        <option value="COMMODITY_OUTLOOK">COMMODITY_OUTLOOK</option>
                        <option value="CORRIDOR_RISK">CORRIDOR_RISK</option>
                        <option value="DATA_QUALITY">DATA_QUALITY</option>
                      </select>
                      <button
                        onClick={async () => {
                          try {
                            await api.v12GenerateReport({ reportTitle: newReportTitle, reportType: newReportType, jurisdiction, sectors: [sectorFilter || 'Multi-Sector'], timeRange }, publicActor);
                            setBanner({ type: 'success', message: 'Compiled new verified Intelligence Report.' });
                            await loadIntelligenceData();
                          } catch (e) {
                            handleErr(e);
                          }
                        }}
                        className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg"
                      >
                        Compile Report
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                      <div className="px-4 py-3 text-sm font-semibold text-[#F5F5F5]">Intelligence Reports ({reports.length})</div>
                      {reports.map((r) => (
                        <div key={r.id} className="p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F5F5F5]">{r.reportTitle}</span>
                            <button onClick={() => exportFile('json', r.id, [r])} className="text-[#D4AF37] underline">Download</button>
                          </div>
                          <p className="text-[#A0A0A0]">{r.summary}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                      <div className="px-4 py-3 text-sm font-semibold text-[#F5F5F5]">Governance Human Review Queue ({reviewQueue.length})</div>
                      {reviewQueue.map((q) => (
                        <div key={q.id} className="p-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F5F5F5]">{q.title}</span>
                            <span className="font-mono text-[#D4AF37]">{q.status}</span>
                          </div>
                          <p className="text-[#A0A0A0]">{q.riskReason}</p>
                          {q.status === 'PENDING_REVIEW' && (
                            <div className="flex gap-2">
                              <button onClick={() => api.v12DecideReviewQueueItem(q.id, 'APPROVED', 'Approved by reviewer', actor).then(loadIntelligenceData).catch(handleErr)} className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 rounded text-emerald-300">Approve</button>
                              <button onClick={() => api.v12DecideReviewQueueItem(q.id, 'REJECTED', 'Rejected by reviewer', actor).then(loadIntelligenceData).catch(handleErr)} className="px-2.5 py-1 bg-red-950 border border-red-800 rounded text-red-300">Reject</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 14. ADMINISTRATION (RECOMMENDATIONS, SUBSCRIPTIONS, JOBS, MIGRATION & BENCHMARK) */}
              {section === 'administration' && (
                <div className="space-y-4">
                  {/* Recommendations Human Approval Queue */}
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl divide-y divide-[#1e1e24]">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-[#F5F5F5]">Decision Coordination Recommendations ({recommendations.length})</h2>
                        <p className="text-[11px] text-[#71717a]">Explainable advisory actions only (autoExecutionProhibited: true).</p>
                      </div>
                      <button
                        onClick={() => api.v12GenerateRecommendation({ targetParticipantName: selectedTenantId }, publicActor).then(loadIntelligenceData).catch(handleErr)}
                        className="px-3 py-1 bg-[#18181b] border border-[#D4AF37]/50 rounded text-xs text-[#D4AF37]"
                      >
                        Generate Advisory
                      </button>
                    </div>
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-[#F5F5F5]">{rec.recommendedAction} <span className="font-mono text-[#D4AF37]">· {rec.approvalStatus}</span></div>
                          <p className="text-[#A0A0A0]">{rec.explanation}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => api.v12DecideRecommendation(rec.id, 'approve', 'Human operator confirmed', publicActor).then(loadIntelligenceData).catch(handleErr)} className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 rounded text-emerald-300">Approve</button>
                          <button onClick={() => api.v12DecideRecommendation(rec.id, 'reject', 'Not required at this cycle', publicActor).then(loadIntelligenceData).catch(handleErr)} className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0]">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Proposed Intelligence Commercialization Tiers */}
                  <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">Intelligence Subscription Product Catalogue</h2>
                      <span className="text-[11px] text-[#71717a]">{commercialDisclosure}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {subscriptionPlans.map((p) => (
                        <div key={p.id} className="bg-[#09090b] border border-[#1f1f23] rounded-lg p-3 space-y-1">
                          <div className="font-semibold text-[#D4AF37]">{p.tierName}</div>
                          <div className="text-[10px] font-mono text-[#71717a]">{p.status}</div>
                          <div className="text-[11px] text-[#A0A0A0]">{p.targetAudience}</div>
                          <div className="font-mono text-[11px] text-[#F5F5F5] pt-1">
                            API Quota: {p.apiCallsLimitPerMonth.toLocaleString()}/mo
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Migration Audit, Backup Verify & Benchmark */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2.5 text-xs">
                      <h2 className="text-sm font-semibold text-[#F5F5F5]">V11 → V12 Non-Destructive Migration &amp; Backup Integrity</h2>
                      <div className="font-mono text-[11px] text-[#A0A0A0] space-y-1">
                        <div>Active Schema: v{migrationAudit?.schemaVersion}</div>
                        <div>V11 Canonical Backup Valid: {String(migrationAudit?.v11CanonicalBackupCheck?.valid)}</div>
                        <div>Preserved V1–V11 Users: {migrationAudit?.preservedFinancialTotals?.usersCount} · Financial Executions: {migrationAudit?.preservedFinancialTotals?.executionsCount}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => api.v12VerifyBackup(publicActor).then((r) => setBanner({ type: 'success', message: `Verified backup ${r.backup?.backupFile} (SHA-256 valid: ${r.integrity?.valid}).` })).catch(handleErr)}
                          className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#D4AF37]"
                        >
                          Create &amp; Verify Checksum Backup
                        </button>
                        <button
                          onClick={() => api.v12CheckRollback(publicActor).then((r) => setBanner({ type: 'info', message: `Rollback ready: ${r.rollbackPossible} (V11 SHA-256 verified).` })).catch(handleErr)}
                          className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#F5F5F5]"
                        >
                          Verify V11 Rollback Readiness
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[#F5F5F5]">Bounded Background Jobs ({jobs.length}) &amp; Benchmark</h2>
                        <button
                          onClick={() => api.v12RunBenchmark(50, publicActor).then(setBenchmarkResult).catch(handleErr)}
                          className="px-3 py-1 bg-[#D4AF37] text-black font-semibold rounded"
                        >
                          Run Latency Benchmark
                        </button>
                      </div>
                      {benchmarkResult && (
                        <div className="bg-[#09090b] border border-[#1f1f23] rounded p-2.5 font-mono text-[11px] text-emerald-400">
                          {benchmarkResult.scenario}: {benchmarkResult.sampleSize} ops in {benchmarkResult.totalDurationMs}ms · p95: {benchmarkResult.p95InProcessMs}ms
                        </div>
                      )}
                      {jobs.slice(0, 4).map((j) => (
                        <div key={j.id} className="bg-[#09090b] border border-[#1f1f23] rounded p-2 flex items-center justify-between font-mono text-[11px]">
                          <span className="text-[#F5F5F5]">{j.id} · {j.jobType} ({j.status})</span>
                          {j.status === 'QUEUED' && (
                            <button onClick={() => api.v12CancelJob(j.id, actor).then(loadIntelligenceData).catch(handleErr)} className="text-red-400 underline">Cancel</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
