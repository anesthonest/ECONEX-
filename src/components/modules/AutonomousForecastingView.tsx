/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V5 - Continental Economic Intelligence & Forecasting
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  Compass,
  DollarSign,
  BarChart3,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import { EconomicForecast, AiAgentType } from '../../types/index.ts';

export default function AutonomousForecastingView() {
  const [forecasts, setForecasts] = useState<EconomicForecast[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [activeForecast, setActiveForecast] = useState<EconomicForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Forecast Generator state
  const [genCommodity, setGenCommodity] = useState('Yellow Maize');
  const [genCountry, setGenCountry] = useState('UG');
  const [genHorizon, setGenHorizon] = useState<'30_DAYS' | '60_DAYS' | '90_DAYS' | '180_DAYS'>('30_DAYS');
  const [generating, setGenerating] = useState(false);
  const [generationMsg, setGenerationMsg] = useState<string | null>(null);

  // AI Agent Consultation state
  const [aiDomain, setAiDomain] = useState<AiAgentType>('ECONOMIC_FORECASTER');
  const [aiPrompt, setAiPrompt] = useState(
    'Assess the regional maize price trend across Uganda and Kenya for Q3 considering delayed rains in Northern Uganda.'
  );
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [consultingAi, setConsultingAi] = useState(false);

  const loadForecasts = async () => {
    try {
      setRefreshing(true);
      const list = await api.getEconomicForecasts(
        selectedCommodity || undefined,
        selectedCountry || undefined
      );
      setForecasts(list);
      if (list.length > 0 && !activeForecast) {
        setActiveForecast(list[0]);
      }
    } catch (err) {
      console.error('Failed to load forecasts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, [selectedCommodity, selectedCountry]);

  const handleGenerateForecast = async () => {
    try {
      setGenerating(true);
      setGenerationMsg('Running econometric regression & climate model projection...');
      const created = await api.generateEconomicForecast({
        commodity: genCommodity,
        countryCode: genCountry,
        timeHorizon: genHorizon,
      });
      setGenerationMsg(`Forecast generated for ${created.commodity} (Confidence: ${(created.confidenceScore * 100).toFixed(0)}%)`);
      setActiveForecast(created);
      await loadForecasts();
    } catch (err: any) {
      setGenerationMsg(`Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleConsultAiAgent = async () => {
    try {
      setConsultingAi(true);
      const res = await api.consultAiAgent({
        agentType: aiDomain,
        prompt: aiPrompt,
        context: {
          currentForecast: activeForecast?.commodity,
          predictedTrend: activeForecast?.predictedTrend,
          countryCode: genCountry,
        },
      });
      setAiResponse(res);
    } catch (err: any) {
      setAiResponse({ error: err.message || 'AI Consultation failed' });
    } finally {
      setConsultingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <BrainCircuit className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-100">
              Continental Economic Intelligence Engine
            </h1>
            <p className="text-sm text-stone-400">
              12-Domain AI Advisory, Commodity Price Predictions, Uncertainty Bands & Strategic Action
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadForecasts}
            disabled={refreshing}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-700 text-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {generationMsg && (
        <div className="p-3 bg-stone-900 border border-amber-500/40 text-amber-300 rounded-xl text-xs flex items-center justify-between">
          <span>{generationMsg}</span>
          <button onClick={() => setGenerationMsg(null)} className="text-stone-400 hover:text-stone-200">
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Forecast Cards & Detail Viewer vs Generator & AI Agent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Forecast Registry & Detailed Price Curve */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Forecast Highlight Card */}
          {activeForecast && (
            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-stone-100">{activeForecast.commodity}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {activeForecast.countryCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                      {(activeForecast.timeHorizon || '30_DAYS').replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Generated via {activeForecast.modelUsed || 'GEMINI_2_5_FLASH'} • Updated {new Date(activeForecast.generatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-stone-400">Confidence Band</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {((activeForecast.confidenceScore || 0.85) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Price Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
                  <div className="text-[11px] text-stone-400">Current Spot Price</div>
                  <div className="text-base font-bold text-stone-200 font-mono mt-0.5">
                    {(activeForecast.currentSpotPrice || activeForecast.baselineHistoricalPriceUGX || 0).toLocaleString()} {activeForecast.currency || 'UGX'}
                  </div>
                </div>

                <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
                  <div className="text-[11px] text-stone-400">Projected Price</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {(activeForecast.projectedPrice || activeForecast.projectedPriceUGX || 0).toLocaleString()} {activeForecast.currency || 'UGX'}
                  </div>
                </div>

                <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
                  <div className="text-[11px] text-stone-400">Uncertainty Bounds</div>
                  <div className="text-xs font-mono text-stone-300 mt-1">
                    {(activeForecast.confidenceIntervalLow || (activeForecast.uncertaintyRangeUGX ? activeForecast.uncertaintyRangeUGX[0] : 0)).toLocaleString()} – {(activeForecast.confidenceIntervalHigh || (activeForecast.uncertaintyRangeUGX ? activeForecast.uncertaintyRangeUGX[1] : 0)).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
                  <div className="text-[11px] text-stone-400">Trend Trajectory</div>
                  <div
                    className={`text-sm font-bold font-mono mt-0.5 ${
                      activeForecast.predictedTrend === 'BULLISH'
                        ? 'text-emerald-400'
                        : activeForecast.predictedTrend === 'BEARISH'
                        ? 'text-rose-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {activeForecast.predictedTrend || 'STABLE'}
                  </div>
                </div>
              </div>

              {/* Contributing Drivers & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Key Market Drivers
                  </h4>
                  <ul className="space-y-1.5 text-xs text-stone-300">
                    {(activeForecast.contributingDrivers || activeForecast.primaryDrivers || []).map((driver, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Strategic Guidance
                  </h4>
                  <ul className="space-y-1.5 text-xs text-stone-300">
                    {(activeForecast.actionableRecommendations || activeForecast.assumptions || []).map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Registry List */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-100">Continental Commodity Predictions</h3>
              <span className="text-xs text-stone-500 font-mono">{forecasts.length} Models Tracked</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {forecasts.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setActiveForecast(f)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    activeForecast?.id === f.id
                      ? 'bg-stone-800/90 border-amber-500'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-200 text-sm">{f.commodity}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        f.predictedTrend === 'BULLISH'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : f.predictedTrend === 'BEARISH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {f.predictedTrend}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-400 mt-2 font-mono">
                    <span>Spot: {(f.currentSpotPrice || f.baselineHistoricalPriceUGX || 0).toLocaleString()} {f.currency || 'UGX'}</span>
                    <span className="text-amber-400">Target: {(f.projectedPrice || f.projectedPriceUGX || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-stone-500 mt-1 flex justify-between">
                    <span>Horizon: {(f.timeHorizon || '30_DAYS').replace('_', ' ')}</span>
                    <span>Confidence: {((f.confidenceScore || 0.85) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Forecast Generator & AI Domain Consultation */}
        <div className="space-y-6">
          {/* Forecast Generator */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2 mb-1">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-stone-100">Model Forecast Generator</h3>
            </div>
            <p className="text-xs text-stone-400">
              Run automated econometric regression for agricultural inputs, crops, and fuel across EAC.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Target Commodity</label>
                <select
                  value={genCommodity}
                  onChange={(e) => setGenCommodity(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded px-2.5 py-2"
                >
                  <option value="Yellow Maize">Yellow Maize</option>
                  <option value="Robusta Coffee Screen 18">Robusta Coffee Screen 18</option>
                  <option value="Soya Beans Grade 1">Soya Beans Grade 1</option>
                  <option value="Cassava Flour HQCF">Cassava Flour HQCF</option>
                  <option value="Fertilizer NPK 17-17-17">Fertilizer NPK 17-17-17</option>
                  <option value="Dry Red Kidney Beans">Dry Red Kidney Beans</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Country Jurisdiction</label>
                <select
                  value={genCountry}
                  onChange={(e) => setGenCountry(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded px-2.5 py-2"
                >
                  <option value="UG">Uganda (UG)</option>
                  <option value="KE">Kenya (KE)</option>
                  <option value="TZ">Tanzania (TZ)</option>
                  <option value="RW">Rwanda (RW)</option>
                  <option value="BI">Burundi (BI)</option>
                  <option value="SS">South Sudan (SS)</option>
                  <option value="CD">DR Congo (CD)</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Projection Horizon</label>
                <select
                  value={genHorizon}
                  onChange={(e) => setGenHorizon(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded px-2.5 py-2"
                >
                  <option value="30_DAYS">30 Days (Short-term)</option>
                  <option value="60_DAYS">60 Days (Seasonal harvest)</option>
                  <option value="90_DAYS">90 Days (Quarterly buffer)</option>
                  <option value="180_DAYS">180 Days (Semi-annual cycle)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateForecast}
                disabled={generating}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <TrendingUp className={`w-3.5 h-3.5 ${generating ? 'animate-bounce' : ''}`} />
                <span>{generating ? 'Calculating Forecast...' : 'Generate New Forecast'}</span>
              </button>
            </div>
          </div>

          {/* Gemini AI Agent Consultation Box */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-stone-100">12-Domain AI Consultation</h3>
            </div>
            <p className="text-xs text-stone-400">
              Query specialized Gemini models calibrated with Ugandan and East African agronomic rules.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Specialist Domain</label>
                <select
                  value={aiDomain}
                  onChange={(e) => setAiDomain(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded px-2.5 py-2 font-mono text-xs"
                >
                  <option value="FOOD_SECURITY_ANALYST">FOOD_SECURITY_ANALYST (V5)</option>
                  <option value="ECONOMIC_FORECASTER">ECONOMIC_FORECASTER (V5)</option>
                  <option value="CROSS_BORDER_REGULATORY_AGENT">CROSS_BORDER_REGULATORY_AGENT</option>
                  <option value="SUPPLY_CHAIN_COORDINATOR">SUPPLY_CHAIN_COORDINATOR</option>
                  <option value="CLIMATE_RESILIENCE_AGENT">CLIMATE_RESILIENCE_AGENT</option>
                  <option value="FINANCIAL_INCLUSION_AGENT">FINANCIAL_INCLUSION_AGENT</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Advisory Prompt</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded p-2.5 text-xs"
                />
              </div>

              <button
                onClick={handleConsultAiAgent}
                disabled={consultingAi}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded text-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <BrainCircuit className={`w-3.5 h-3.5 text-amber-400 ${consultingAi ? 'animate-pulse' : ''}`} />
                <span>{consultingAi ? 'Consulting Agent...' : 'Consult Intelligence Agent'}</span>
              </button>

              {aiResponse && (
                <div className="p-3 bg-stone-950 border border-amber-500/30 rounded-lg text-xs space-y-2 max-h-60 overflow-y-auto">
                  <div className="font-semibold text-amber-300 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Agent Assessment ({aiResponse.source})</span>
                  </div>
                  <p className="text-stone-300 text-[11px] whitespace-pre-line leading-relaxed">
                    {aiResponse.response || aiResponse.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
