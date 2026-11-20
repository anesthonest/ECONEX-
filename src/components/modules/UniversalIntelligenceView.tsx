import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  DollarSign,
  Building2,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { AiEconomicDomain, EconomicOpportunity } from '../../types';

interface AgentResponse {
  domain: AiEconomicDomain;
  analysis: string;
  recommendations: string[];
  confidence: number;
  indicators: Record<string, string | number>;
  source: string;
}

export const UniversalIntelligenceView: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<AiEconomicDomain>('ECONOMIC_FORECASTER');
  const [queryContext, setQueryContext] = useState<string>('Assess macro-liquidity and corridor trade settlements between Uganda and Kenya under current EAC tariff provisions.');
  const [consulting, setConsulting] = useState<boolean>(false);
  const [agentResult, setAgentResult] = useState<AgentResponse | null>(null);
  const [opportunities, setOpportunities] = useState<EconomicOpportunity[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const domains: { id: AiEconomicDomain; label: string; desc: string; icon: any }[] = [
    { id: 'CURRENCY_INTELLIGENCE', label: 'Currency Intelligence', desc: 'Forex liquidity, rate volatility & corridor settlement spreads', icon: DollarSign },
    { id: 'PAYMENT_INTELLIGENCE', label: 'Payment Orchestration', desc: 'Rail routing optimization across bank wires, MM & cards', icon: Zap },
    { id: 'BANKING_CONNECTIVITY', label: 'Banking Connectivity', desc: 'Direct ISO 20022 clearing & core ledger synchrony', icon: Building2 },
    { id: 'CAPITAL_INTELLIGENCE', label: 'Capital Intelligence', desc: 'Underwriting models, PO finance & merchant liquidity scoring', icon: TrendingUp },
    { id: 'INVESTMENT_INTELLIGENCE', label: 'Investment Intelligence', desc: 'Yield curve analytics for treasury bills & green infrastructure bonds', icon: Sparkles },
    { id: 'COMMERCE_INTELLIGENCE', label: 'Commerce Intelligence', desc: 'Supply-demand equilibria, catalogue pricing & inventory velocity', icon: Briefcase },
    { id: 'BUSINESS_INTELLIGENCE', label: 'Business Enterprise', desc: 'Corporate solvency ratios, balance sheet stress testing', icon: Building2 },
    { id: 'WORKFORCE_INTELLIGENCE', label: 'Workforce & Income', desc: 'Labor compensation parity, statutory tax (NSSF/PAYE) compliance', icon: Briefcase },
    { id: 'INDUSTRIAL_INTELLIGENCE', label: 'Industrial Production', desc: 'Factory throughput, capacity utilization & agro-processing yields', icon: Cpu },
    { id: 'TRADE_INTELLIGENCE', label: 'Regional Trade', desc: 'EAC cross-border arbitrage, AfCFTA tariff compliance', icon: Globe2 },
    { id: 'LOGISTICS_INTELLIGENCE', label: 'Logistics & Corridors', desc: 'Northern & Central corridor dwell times and fuel hedging', icon: Globe2 },
    { id: 'PUBLIC_ECONOMY_INTELLIGENCE', label: 'Public Economy', desc: 'PPDA tender integrity & national tax revenue forecasting', icon: ShieldCheck },
    { id: 'ASSET_INTELLIGENCE', label: 'Asset Intelligence', desc: 'Collateral valuation, land title verification & depreciation', icon: Building2 },
    { id: 'ECONOMIC_FORECASTER', label: 'Economic Forecaster', desc: 'Integrated regional macro-projection & inflation forecasting', icon: Brain },
    { id: 'RISK_RESILIENCE', label: 'Risk & Resilience', desc: 'Systemic liquidity shocks, climate disruption & corridor security', icon: AlertCircle },
  ];

  const handleConsult = async () => {
    setConsulting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.consultAiEconomicAgent(
        selectedDomain,
        queryContext,
        { participantId: 'PART-UG-KLA-001', countryCode: 'UG' }
      );
      setAgentResult({
        domain: res.domain,
        analysis: res.analysis,
        recommendations: res.recommendedActions || [],
        confidence: res.confidenceScore || 0.94,
        indicators: {
          confidenceScore: `${((res.confidenceScore || 0.94) * 100).toFixed(0)}%`,
          riskFactorsIdentified: (res.riskFactors || []).length,
          provenance: res.dataProvenance || 'ECONEX Real-Time Ledger',
          timestamp: new Date().toLocaleTimeString()
        },
        source: res.dataProvenance || 'ECONEX Real-Time Economic Registry'
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Consultation request failed.');
    } finally {
      setConsulting(false);
    }
  };

  const handleFetchRadar = async () => {
    setLoadingOpportunities(true);
    try {
      const res = await apiClient.getEconomicOpportunities();
      setOpportunities(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingOpportunities(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#262626] p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-[#D4AF37]" />
              <h1 className="text-xl font-semibold text-[#F5F5F5] tracking-tight">
                ECONEX Universal Economic Intelligence
              </h1>
            </div>
            <p className="text-sm text-[#A0A0A0]">
              15 autonomous economic agents delivering econometric analysis, corridor arbitrage models and risk assessment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#D4AF37] px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">
              MODELS: GEMINI 2.5 FLASH / AR-ECONOMETRIC DUAL-ENGINE
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 15 Domain Selector & Consultation Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Domain Selector (Left 4 cols) */}
        <div className="lg:col-span-4 bg-[#121212] border border-[#262626] p-4 rounded-lg flex flex-col h-[740px]">
          <h2 className="text-sm font-medium text-[#F5F5F5] uppercase tracking-wider mb-3">
            Economic Intelligence Domains (15)
          </h2>
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
            {domains.map((d) => {
              const Icon = d.icon;
              const isSelected = selectedDomain === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDomain(d.id)}
                  className={`w-full text-left p-3 rounded border transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#1C1C1C] border-[#D4AF37] text-[#F5F5F5]'
                      : 'bg-[#151515] border-[#262626] text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#F5F5F5]'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-[#707070]'}`} />
                  <div>
                    <div className="text-xs font-medium">{d.label}</div>
                    <div className="text-[11px] text-[#707070] line-clamp-1 mt-0.5">{d.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Console & Results (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Query Input Box */}
          <div className="bg-[#121212] border border-[#262626] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#D4AF37] uppercase">
                ACTIVE DOMAIN: {selectedDomain}
              </span>
              <span className="text-xs text-[#707070]">
                Participant ID: PART-UG-KLA-001 (Uganda Sovereign Scope)
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
                Economic Query & Operational Context
              </label>
              <textarea
                value={queryContext}
                onChange={(e) => setQueryContext(e.target.value)}
                rows={3}
                className="w-full bg-[#181818] border border-[#333333] rounded p-3 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37] resize-none"
                placeholder="Specify macroeconomic context, trade parameters, or financial liquidity inquiry..."
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-[#707070]">
                Backed by real-time double-entry ledgers, central bank indices and EAC trade data.
              </div>
              <button
                onClick={handleConsult}
                disabled={consulting}
                className="px-4 py-2 bg-[#D4AF37] text-[#050505] text-xs font-semibold rounded hover:bg-[#E5C158] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {consulting ? (
                  <>Consulting Model Engine...</>
                ) : (
                  <>
                    <span>Execute Consultation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-300">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Consultation Result Display */}
          {agentResult && (
            <div className="bg-[#121212] border border-[#262626] p-6 rounded-lg space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-[#F5F5F5]">
                    Agent Synthesis Report: {agentResult.domain}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-[#A0A0A0]">CONFIDENCE:</span>
                  <span className="text-[#D4AF37] tabular-nums font-bold">
                    {(agentResult.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-[#404040]">|</span>
                  <span className="text-[#A0A0A0]">SOURCE:</span>
                  <span className="text-[#C0C0C0]">{agentResult.source}</span>
                </div>
              </div>

              {/* Textual Analysis */}
              <div>
                <h3 className="text-xs uppercase text-[#A0A0A0] tracking-wider mb-2 font-mono">
                  Econometric Analysis
                </h3>
                <div className="p-4 bg-[#181818] border border-[#2a2a2a] rounded text-xs leading-relaxed text-[#F5F5F5] whitespace-pre-wrap">
                  {agentResult.analysis}
                </div>
              </div>

              {/* Quantitative Indicators */}
              {agentResult.indicators && Object.keys(agentResult.indicators).length > 0 && (
                <div>
                  <h3 className="text-xs uppercase text-[#A0A0A0] tracking-wider mb-2 font-mono">
                    Model Indicators & Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(agentResult.indicators).map(([key, val]) => (
                      <div key={key} className="p-3 bg-[#181818] border border-[#262626] rounded">
                        <div className="text-[10px] text-[#808080] uppercase truncate">{key}</div>
                        <div className="text-xs font-mono text-[#D4AF37] font-semibold mt-1 tabular-nums truncate">
                          {String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Recommendations */}
              {agentResult.recommendations && agentResult.recommendations.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase text-[#A0A0A0] tracking-wider mb-2 font-mono">
                    Prescribed Operational Actions
                  </h3>
                  <ul className="space-y-2">
                    {agentResult.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-[#C0C0C0] p-2.5 bg-[#181818] border border-[#262626] rounded flex items-start gap-2"
                      >
                        <span className="text-[#D4AF37] font-mono text-[11px] mt-0.5">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Opportunity Discovery Radar */}
          <div className="bg-[#121212] border border-[#262626] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#F5F5F5]">
                  Cross-Border Opportunity Discovery Radar
                </h3>
                <p className="text-xs text-[#808080]">
                  Automated detection of value chain deficits, processing opportunities, and trade arbitrage.
                </p>
              </div>
              <button
                onClick={handleFetchRadar}
                disabled={loadingOpportunities}
                className="px-3 py-1.5 bg-[#202020] hover:bg-[#282828] text-xs font-medium text-[#C0C0C0] border border-[#333333] rounded transition-colors"
              >
                {loadingOpportunities ? 'Scanning Radar...' : 'Scan Corridor Radar'}
              </button>
            </div>

            {opportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-3.5 bg-[#181818] border border-[#282828] rounded flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#D4AF37] mb-1">
                        <span>{opp.type}</span>
                        <span className="text-[#808080]">{opp.corridor || opp.countryCode || 'EAC'}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#F5F5F5]">{opp.title}</div>
                      <div className="text-[11px] text-[#A0A0A0] mt-1 line-clamp-2">{opp.description}</div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#262626] flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#808080]">Estimated Value:</span>
                      <span className="text-[#F5F5F5] font-semibold tabular-nums">
                        {opp.currency || 'USD'} {opp.estimatedValue?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#161616] border border-[#262626] rounded text-center text-xs text-[#707070]">
                Click "Scan Corridor Radar" to pull active industrial & cross-border opportunities across Uganda, Kenya, Tanzania, and Rwanda corridors.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
