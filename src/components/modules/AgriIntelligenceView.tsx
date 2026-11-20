/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Agricultural Intelligence & Climate Resilience Module
 * Powered by @google/genai on the server
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { CropAdvisoryResponse } from '../../types/index.ts';
import {
  Bot,
  CloudSun,
  AlertTriangle,
  Send,
  Sparkles,
  Droplets,
  Thermometer,
  ShieldAlert,
  HelpCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export const AgriIntelligenceView: React.FC = () => {
  const { currentUser } = useAuth();

  const [selectedCrop, setSelectedCrop] = useState<string>('Arabica Coffee');
  const [district, setDistrict] = useState<string>(currentUser?.district || 'Mbale');
  const [growthStage, setGrowthStage] = useState<string>('FRUITING');
  const [symptomsOrQuestion, setSymptomsOrQuestion] = useState<string>(
    'Noticing orange powdery spots on the undersides of coffee leaves and some premature leaf drop on the lower branches. How do I protect the ripening cherries?'
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [advisoryResult, setAdvisoryResult] = useState<CropAdvisoryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Weather data
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);

  const commonCrops = [
    'Arabica Coffee',
    'Robusta Coffee',
    'White Maize (Longe 5D)',
    'Highland Cooking Banana (Matooke)',
    'Climbing Beans (NARO Bean 1)',
    'Cassava (NAROCASS 1)',
    'Yellow Soya Beans',
    'Horticultural Tomatoes',
  ];

  const districts = ['Mbale', 'Kampala', 'Gulu', 'Jinja', 'Kasese', 'Mbarara', 'Arua', 'Masaka'];

  const fetchWeather = async (targetDistrict: string) => {
    try {
      setWeatherLoading(true);
      const data = await ApiClient.getWeather(targetDistrict);
      setWeatherData(data);
    } catch (err) {
      console.error('Failed to load weather data:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(district);
  }, [district]);

  const handleSubmitAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !symptomsOrQuestion.trim()) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const result = await ApiClient.getCropAdvisory({
        cropName: selectedCrop,
        district,
        growthStage,
        symptomsOrQuestion: symptomsOrQuestion.trim(),
      });
      setAdvisoryResult(result);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate agricultural advice.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1c1c1f] to-[#050505] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#F5F5F5] tracking-tight flex items-center gap-2">
                Agricultural Intelligence Foundation
                <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded font-mono font-medium">
                  Gemini Server API
                </span>
              </h1>
              <p className="text-xs text-[#A0A0A0]">
                Specialized agronomic decision-support for smallholders, extension scouts, and cooperative agronomists.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Crop Diagnostic & Extension Inquiry */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-[#D4AF37]" /> Crop Doctor & Agronomic Advisory
            </h2>

            <form onSubmit={handleSubmitAdvisory} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Select Crop *</label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    {commonCrops.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] mb-1">District / Agro-Zone *</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d} District
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] mb-1">Current Growth Stage</label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="GERMINATION">Germination & Seedling</option>
                    <option value="VEGETATIVE">Vegetative / Canopy Growth</option>
                    <option value="FLOWERING">Flowering / Tasseling</option>
                    <option value="FRUITING">Fruiting / Grain Filling</option>
                    <option value="HARVEST_READY">Harvest Ready / Maturation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">
                  Observed Symptoms, Pest Activity, or Agronomic Question *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe leaf discoloration, pest damage, soil conditions, or ask about fertilizer timing..."
                  value={symptomsOrQuestion}
                  onChange={(e) => setSymptomsOrQuestion(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded p-3 text-[#F5F5F5] focus:border-[#D4AF37] outline-none leading-relaxed"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-[#71717a]">
                  Uses calibrated East African agronomic guidelines & Gemini server intelligence.
                </span>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e5bf43] disabled:opacity-50 text-black font-semibold rounded-lg text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing Crop Health...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Request Agronomic Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Advisory Response Display */}
          {advisoryResult && (
            <div className="bg-[#121212] border border-[#443714] rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="font-bold text-sm text-[#F5F5F5]">Agronomic Advisory Report</span>
                  <span className="text-[10px] bg-[#18181b] text-[#D4AF37] border border-[#27272a] px-2 py-0.5 rounded font-mono">
                    Source: {advisoryResult.source}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  Confidence: {advisoryResult.confidence}
                </span>
              </div>

              {/* Assessment Text */}
              <div className="text-xs text-[#F5F5F5] leading-relaxed whitespace-pre-line bg-[#09090b] p-4 rounded-lg border border-[#1f1f23]">
                {advisoryResult.answer}
              </div>

              {/* Action Checklist */}
              {advisoryResult.recommendedActions && advisoryResult.recommendedActions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase font-bold text-[#D4AF37] tracking-wider">
                    Recommended Immediate Field Actions
                  </div>
                  <div className="space-y-1.5">
                    {advisoryResult.recommendedActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="bg-[#18181b] p-2.5 rounded border border-[#27272a] text-xs flex items-start gap-2 text-[#F5F5F5]"
                      >
                        <CheckCircle2 size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mandatory Regulatory / High-Risk Verification Disclaimer */}
              <div className="bg-[#1c120c] border border-amber-900/60 rounded-lg p-3 text-[11px] text-amber-200/90 flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-snug">{advisoryResult.disclaimer}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Regional Weather & Seasonal Intelligence */}
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
                <CloudSun size={15} className="text-[#D4AF37]" /> Regional Weather Outlook
              </h2>
              <span className="text-[10px] text-[#71717a] font-mono">{district}</span>
            </div>

            {weatherLoading ? (
              <div className="text-center py-6 text-xs text-[#A0A0A0]">Loading regional meteorological data...</div>
            ) : weatherData ? (
              <div className="space-y-3 text-xs">
                {/* Temp & Season */}
                <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-[#71717a]">Current Season</div>
                    <div className="font-bold text-[#F5F5F5] text-xs mt-0.5">{weatherData.currentSeason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-[#D4AF37]">
                      {weatherData.temperatureC}°C
                    </div>
                    <div className="text-[10px] text-[#A0A0A0]">Humidity: {weatherData.relativeHumidityPct}%</div>
                  </div>
                </div>

                {/* Rainfall Outlook */}
                <div className="bg-[#18181b] p-3 rounded-lg border border-[#27272a] space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-[#A0A0A0] flex items-center gap-1">
                    <Droplets size={12} className="text-blue-400" /> Precipitation Forecast
                  </div>
                  <p className="text-[11px] text-[#F5F5F5] leading-relaxed">{weatherData.rainfallOutlook}</p>
                </div>

                {/* Field Drying Advice */}
                {weatherData.fieldAdvice && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-semibold text-[#71717a]">Post-Harvest & Field Guidance</div>
                    {weatherData.fieldAdvice.map((fa: string, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#09090b] p-2 rounded border border-[#1f1f23] text-[11px] text-[#A0A0A0]"
                      >
                        • {fa}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-[#1e1e24] text-[9px] text-[#71717a]">
                  Data Provenance: {weatherData.provenance}
                </div>
              </div>
            ) : null}
          </div>

          {/* Ugandan Agro-Ecological Zones Info Card */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-[#F5F5F5] flex items-center gap-1.5">
              <FileText size={14} className="text-[#D4AF37]" /> Seasonal Planting Windows (Uganda)
            </div>
            <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
              Uganda experiences a bimodal rainfall regime in Southern and Highland zones (Season A: Mar–May, Season B: Aug–Nov), and a unimodal season in Northern savannah zones (Apr–Oct).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
