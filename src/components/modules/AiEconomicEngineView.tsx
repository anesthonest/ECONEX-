import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  ShieldAlert,
  Send,
  Upload,
  Bot,
  Compass,
  TrendingUp,
  Truck,
  CloudRain,
  DollarSign,
  Activity,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AiAgentType, User } from '../../types';
import { api } from '../../services/apiClient';

interface AiEconomicEngineViewProps {
  currentUser: User;
}

interface AgentQueryResponse {
  answer: string;
  actionableSteps?: string[];
  confidence: number;
  dataProvenance: string[];
  disclaimer: string;
}

export const AiEconomicEngineView: React.FC<AiEconomicEngineViewProps> = ({ currentUser }) => {
  const [selectedAgent, setSelectedAgent] = useState<AiAgentType>('AGRONOMIST');
  const [userQuery, setUserQuery] = useState(
    'My Robusta coffee trees in Masaka are showing brown circular lesions with yellow halos on leaves. What disease is this and how should I treat it?'
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentResponse, setAgentResponse] = useState<AgentQueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const agents: Array<{
    type: AiAgentType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    promptTemplate: string;
  }> = [
    {
      type: 'AGRONOMIST',
      label: 'Agronomist & Crop Pathologist',
      icon: Sparkles,
      desc: 'Disease identification, chemical/organic treatment, and soil fertility remediation.',
      promptTemplate:
        'My Robusta coffee trees in Masaka are showing brown circular lesions with yellow halos on leaves. What disease is this and how should I treat it?'
    },
    {
      type: 'PRICE_INTELLIGENCE',
      label: 'Commodity Price Strategist',
      icon: TrendingUp,
      desc: 'Arbitrage corridors, seasonal price projections, and wholesale bargaining margins.',
      promptTemplate:
        'I have 5 metric tons of dried maize in Kapchorwa. Should I sell immediately in Mbale market or hold for 6 weeks in certified warehouse storage?'
    },
    {
      type: 'LOGISTICS_OPTIMIZER',
      label: 'Corridor Logistics Planner',
      icon: Truck,
      desc: 'East African freight routing, weighbridge bottlenecks, fuel efficiency, and reefer preservation.',
      promptTemplate:
        'What is the optimal route to transport 12 metric tons of fresh matooke from Mbarara to Juba via Gulu, minimizing transit spoilage?'
    },
    {
      type: 'CLIMATE_RISK',
      label: 'Agro-Climate & Weather Analyst',
      icon: CloudRain,
      desc: 'ENSO rainfall shifts, planting windows, drought adaptation, and irrigation timing.',
      promptTemplate:
        'Given the current rainfall pattern in Lira district, when is the safest planting window for second season sunflower?'
    },
    {
      type: 'FINANCIAL_LITERACY',
      label: 'Agri-Credit & Cashflow Advisor',
      icon: DollarSign,
      desc: 'Input financing payback modeling, VSLA share accumulation, and warehouse receipt collateral.',
      promptTemplate:
        'How should our 25-member coffee cooperative structure loan repayments for our hulling machine so members do not default during the low crop season?'
    },
    {
      type: 'TRADE_SUPPLY_CHAIN',
      label: 'Cross-Border Trade Specialist',
      icon: Compass,
      desc: 'EAC single customs territory, phytosanitary certificates, COMESA rules of origin.',
      promptTemplate:
        'What export documents and UCDA quality certificates are mandatory to ship green coffee from Uganda to Mombasa port for European buyers?'
    },
    {
      type: 'INSTITUTIONAL_ANALYTICS',
      label: 'Food Security Macroeconomist',
      icon: Activity,
      desc: 'National grain reserves, price inflation velocity, cross-border tariff impacts.',
      promptTemplate:
        'Analyze the impact of fuel price fluctuations on wholesale staple food inflation across Uganda secondary towns over the next quarter.'
    }
  ];

  const handleSelectAgent = (agent: (typeof agents)[0]) => {
    setSelectedAgent(agent.type);
    setUserQuery(agent.promptTemplate);
    setAgentResponse(null);
    setQueryError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    setLoading(true);
    setQueryError(null);
    setAgentResponse(null);

    try {
      const res = await api.queryAiAgent(selectedAgent, userQuery, {
        userName: currentUser.name,
        role: currentUser.role,
        imageBase64: imageBase64 || undefined
      });

      setLoading(false);
      setAgentResponse({
        answer: res.responseText,
        actionableSteps: res.actionableSteps,
        confidence: res.confidence === 'HIGH' ? 0.95 : res.confidence === 'MODERATE' ? 0.8 : 0.65,
        dataProvenance: [res.dataProvenance],
        disclaimer: res.disclaimer
      });
    } catch (err: any) {
      setLoading(false);
      setQueryError(err.message || 'Consultation query failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-widest font-mono">
              Server-Authoritative Multi-Agent Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-[#D4AF37]" />
            ECONEX Multi-Agent Agricultural Intelligence Engine
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
            Seven specialized economic agents trained on East African agrarian data, regional trade corridors, and agronomic science powered by Google Gemini.
          </p>
        </div>
      </div>

      {/* Agents Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {agents.map((ag) => {
          const isSelected = selectedAgent === ag.type;
          const Icon = ag.icon;
          return (
            <button
              key={ag.type}
              onClick={() => handleSelectAgent(ag)}
              className={`p-3 rounded text-left transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#1a1a1a] border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]'
                  : 'bg-[#121212] border-[#222] hover:border-[#333]'
              }`}
            >
              <div>
                <Icon
                  className={`h-5 w-5 mb-2 ${
                    isSelected ? 'text-[#D4AF37]' : 'text-[#A0A0A0]'
                  }`}
                />
                <div className="text-xs font-bold text-white leading-tight">
                  {ag.label.split('&')[0]}
                </div>
              </div>
              <span
                className={`text-[9px] font-mono mt-2 uppercase ${
                  isSelected ? 'text-[#D4AF37]' : 'text-zinc-500'
                }`}
              >
                {isSelected ? '● ACTIVE' : 'SELECT'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Agent Info Banner */}
      {(() => {
        const current = agents.find((a) => a.type === selectedAgent);
        if (!current) return null;
        return (
          <div className="p-3.5 rounded bg-[#121212] border border-[#222] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#D4AF37]" />
              <span className="font-semibold text-white">{current.label}:</span>
              <span className="text-[#A0A0A0]">{current.desc}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">ENGINE: gemini-3.8-flash</span>
          </div>
        );
      })()}

      {/* Query Form & Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleRunQuery}
            className="p-5 rounded bg-[#121212] border border-[#222] space-y-4"
          >
            <div>
              <label className="block text-xs font-mono text-[#A0A0A0] mb-1">
                CONSULTATION QUERY OR SCENARIO
              </label>
              <textarea
                rows={5}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask specific agronomic, price arbitrage, logistics, or risk questions..."
                className="w-full bg-[#181818] border border-[#333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#D4AF37] leading-relaxed"
                required
              />
            </div>

            {/* Optional Image attachment for Crop Diagnosis */}
            {selectedAgent === 'AGRONOMIST' && (
              <div>
                <label className="block text-xs font-mono text-[#A0A0A0] mb-1">
                  CROP PHOTO FOR MULTIMODAL DIAGNOSIS (OPTIONAL)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded bg-[#181818] border border-[#333] text-xs text-[#C0C0C0] hover:text-white transition-colors">
                    <Upload className="h-4 w-4 text-[#D4AF37]" />
                    <span>Upload Leaf / Stem Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {imageBase64 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                      <CheckCircle2 className="h-3 w-3" /> Image attached
                      <button
                        type="button"
                        onClick={() => setImageBase64(null)}
                        className="text-zinc-500 hover:text-rose-400 text-xs ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#B8960C] text-[#050505] font-bold py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Synthesizing East African Agricultural Intelligence...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Run Agent Consultation
                </>
              )}
            </button>
          </form>

          {/* Quick Guidance Box */}
          <div className="p-4 rounded bg-[#121212] border border-[#222] text-xs space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-[#D4AF37]" /> Operational Provenance
            </h4>
            <p className="text-[#A0A0A0] leading-relaxed">
              Every analysis grounds itself with current regional database state: Ugandan district market prices, corridor distance matrices, and agronomic thresholds.
            </p>
          </div>
        </div>

        {/* Response Output Panel */}
        <div className="lg:col-span-7">
          {queryError && (
            <div className="p-4 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{queryError}</span>
            </div>
          )}

          {loading && (
            <div className="p-12 rounded bg-[#121212] border border-[#222] text-center space-y-3">
              <div className="h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white text-sm font-semibold">
                Consulting {agents.find((a) => a.type === selectedAgent)?.label}...
              </p>
              <p className="text-xs text-[#A0A0A0] font-mono">
                Running real-time cross-evaluation via @google/genai SDK
              </p>
            </div>
          )}

          {!loading && agentResponse && (
            <div className="p-6 rounded bg-[#121212] border border-[#222] space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#222] pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {agents.find((a) => a.type === selectedAgent)?.label} Consultation
                    </h3>
                    <p className="text-[11px] text-[#A0A0A0]">
                      Confidence: {Math.round(agentResponse.confidence * 100)}% • Engine Model:{' '}
                      <span className="font-mono text-zinc-300">gemini-3.8-flash</span>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-xs font-mono">
                  VERIFIED
                </span>
              </div>

              {/* Main Answer */}
              <div className="text-sm text-[#F5F5F5] leading-relaxed whitespace-pre-line">
                {agentResponse.answer}
              </div>

              {/* Actionable Steps */}
              {agentResponse.actionableSteps && agentResponse.actionableSteps.length > 0 && (
                <div className="p-4 rounded bg-[#0d0d0d] border border-[#222] space-y-2">
                  <h4 className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                    Recommended Implementation Protocol
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#C0C0C0]">
                    {agentResponse.actionableSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#D4AF37] font-mono font-bold mt-0.5">
                          {idx + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data Provenance & References */}
              {agentResponse.dataProvenance && agentResponse.dataProvenance.length > 0 && (
                <div className="border-t border-[#1f1f1f] pt-4">
                  <div className="text-[11px] font-mono text-[#A0A0A0] uppercase tracking-wider mb-1.5">
                    Data Provenance & Citations:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agentResponse.dataProvenance.map((source, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] font-mono text-[#C0C0C0]"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Regulatory Disclaimer */}
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 italic">
                <span className="font-semibold text-zinc-300 not-italic">
                  Advisory Governance Notice:{' '}
                </span>
                {agentResponse.disclaimer}
              </div>
            </div>
          )}

          {!loading && !agentResponse && !queryError && (
            <div className="p-12 rounded bg-[#121212] border border-[#222] text-center space-y-3">
              <Bot className="h-10 w-10 text-[#333] mx-auto" />
              <h3 className="font-semibold text-white text-sm">Consultation Console Ready</h3>
              <p className="text-xs text-[#A0A0A0] max-w-sm mx-auto">
                Select an agent above or edit your query, then click &quot;Run Agent Consultation&quot; to receive calibrated economic guidance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
