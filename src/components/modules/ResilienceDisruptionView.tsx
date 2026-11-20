/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V4 - Disruption Monitoring, Alternative Sourcing & Business Continuity
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Search,
  Plus,
  ArrowRight,
  Truck,
  Building,
  Radio,
  FileText,
  Compass,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  EconomicDisruptionIncident,
  DisruptionSeverity,
  DisruptionCategory,
  UserProfile,
} from '../../types/index.ts';

interface ResilienceDisruptionViewProps {
  currentUser?: UserProfile | null;
}

export default function ResilienceDisruptionView({ currentUser }: ResilienceDisruptionViewProps) {
  const [incidents, setIncidents] = useState<EconomicDisruptionIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EconomicDisruptionIncident | null>(null);
  const [alternativeSuppliers, setAlternativeSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCommodity, setSearchCommodity] = useState('soya beans');
  const [matchingSuppliers, setMatchingSuppliers] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Incident reporting modal
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [mitigationNotes, setMitigationNotes] = useState('');

  // Form states
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<DisruptionSeverity>('HIGH');
  const [incidentCategory, setIncidentCategory] = useState<DisruptionCategory>('BORDER_CUSTOMS_DELAY');
  const [incidentLocation, setIncidentLocation] = useState('Malaba OSBP Border Crossing');
  const [incidentDelayHours, setIncidentDelayHours] = useState('36');
  const [incidentSummary, setIncidentSummary] = useState('');
  const [incidentCorridorId, setIncidentCorridorId] = useState('corridor_northern_01');
  const [altRouteName, setAltRouteName] = useState('Diversion via Busia OSBP');

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getDisruptionIncidents();
      setIncidents(list);
      if (list.length > 0 && !selectedIncident) {
        setSelectedIncident(list[0]);
      }
      await findSuppliers(searchCommodity);
    } catch (err) {
      console.error('Failed to load resilience incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const findSuppliers = async (commodity: string) => {
    try {
      setMatchingSuppliers(true);
      const res = await api.getAlternativeSuppliers(commodity);
      setAlternativeSuppliers(res.alternativeSuppliers || []);
    } catch (err) {
      console.error('Failed to find alternative suppliers:', err);
    } finally {
      setMatchingSuppliers(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createDisruptionIncident({
        title: incidentTitle,
        severity: incidentSeverity,
        category: incidentCategory,
        corridorId: incidentCorridorId,
        affectedLocation: incidentLocation,
        estimatedDelayHours: Number(incidentDelayHours),
        summary: incidentSummary,
        alternativeRouteName: altRouteName,
        reportedBy: currentUser?.name || 'Corridor Resilience Officer',
      });
      setShowIncidentModal(false);
      setIncidentTitle('');
      setIncidentSummary('');
      await loadData();
      setSelectedIncident(created);
    } catch (err) {
      console.error('Failed to report incident:', err);
    }
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await api.resolveDisruptionIncident(
        selectedIncident.id,
        mitigationNotes || 'Corridor cleared and standard transit resumed.'
      );
      setShowResolveModal(false);
      setMitigationNotes('');
      await loadData();
      setSelectedIncident(res.incident);
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#121212] border border-[#2a2a2a] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800 tracking-wider">
                ECONEX SUPPLY CHAIN RESILIENCE
              </span>
              <span className="text-xs text-[#A0A0A0] flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Telemetry & Continuity Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F5] tracking-tight">
              Disruption Monitoring & Alternative Sourcing
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-2xl">
              Monitors border bottlenecks, weather hazards, and fuel volatility; rapidly matches certified alternative supplier clusters without breaching formal off-take contracts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-[#1e1e1e] hover:bg-[#282828] text-[#F5F5F5] border border-[#333] rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="px-4 py-2.5 bg-red-900/80 hover:bg-red-800 text-[#F5F5F5] font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-lg border border-red-700/50"
            >
              <AlertTriangle className="w-4 h-4 text-red-300" />
              <span>Report Disruption Alert</span>
            </button>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Disruption Incidents */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Active Disruption Incidents ({incidents.length})
            </h3>

            <div className="space-y-3">
              {incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isCritical = inc.severity === 'CRITICAL';
                const isHigh = inc.severity === 'HIGH';
                const isResolved = inc.status === 'RESOLVED';

                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1f1616] border-red-500/60 ring-1 ring-red-500/40'
                        : 'bg-[#181818] border-[#282828] hover:border-[#3a3a3a]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-[#D4AF37] font-semibold">{inc.id}</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : isHigh
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#222] text-[#A0A0A0]">
                          {inc.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-[#F5F5F5]">{inc.title}</h4>
                    <p className="text-xs text-[#A0A0A0] mt-1 line-clamp-2">{inc.summary}</p>

                    <div className="mt-3 pt-2.5 border-t border-[#222] flex items-center justify-between text-xs text-[#888]">
                      <span>Location: <strong className="text-[#F5F5F5]">{inc.affectedLocation}</strong></span>
                      <span className="text-amber-400 font-semibold">+{inc.estimatedDelayHours}h Delay</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Incident Resolution & Alternative Supplier Matching */}
        <div className="lg:col-span-7 space-y-6">
          {/* Selected Incident Details */}
          {selectedIncident && (
            <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-mono text-[#D4AF37]">{selectedIncident.id}</span>
                    <span className="text-[#888]">&bull;</span>
                    <span className="text-[#A0A0A0]">{selectedIncident.category.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F5F5]">{selectedIncident.title}</h3>
                </div>

                {selectedIncident.status === 'ACTIVE' && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="px-3.5 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 font-semibold text-xs rounded-lg transition-colors border border-emerald-700/50 flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Resolve Incident
                  </button>
                )}
              </div>

              <p className="text-xs text-[#D4AF37]/90 bg-[#1e190e] p-3 rounded-lg border border-[#D4AF37]/30 leading-relaxed">
                {selectedIncident.summary}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg">
                  <span className="text-[#A0A0A0] block">Recommended Alternative Route</span>
                  <strong className="text-[#F5F5F5] mt-0.5 block">{selectedIncident.alternativeRouteName || 'None identified'}</strong>
                </div>
                <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg">
                  <span className="text-[#A0A0A0] block">Telemetry Data Provenance</span>
                  <strong className="text-[#F5F5F5] mt-0.5 block truncate">{selectedIncident.dataProvenance}</strong>
                </div>
              </div>

              {selectedIncident.mitigationNotes && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300">
                  <strong>Resolution Audit Notes:</strong> {selectedIncident.mitigationNotes}
                </div>
              )}
            </div>
          )}

          {/* Alternative Supplier Matching Engine */}
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Alternative Certified Supplier Matcher
                </h3>
                <p className="text-xs text-[#A0A0A0]">
                  Algorithmic routing to non-disrupted cooperative hubs with verified inventory.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchCommodity}
                  onChange={(e) => setSearchCommodity(e.target.value)}
                  placeholder="Commodity (e.g. soya, maize)"
                  className="bg-[#181818] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  onClick={() => findSuppliers(searchCommodity)}
                  className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold text-xs rounded-lg transition-colors"
                >
                  Match
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {alternativeSuppliers.map((supp, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3.5 bg-[#181818] border border-[#262626] rounded-lg text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F5F5F5]">{supp.organizationName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
                        Reputation: {supp.reputationScore}/100
                      </span>
                    </div>
                    <div className="text-xs text-[#A0A0A0] mt-1 flex flex-wrap gap-3">
                      <span>District: <strong className="text-[#F5F5F5]">{supp.district}</strong></span>
                      <span>Available Capacity: <strong className="text-emerald-400">{supp.availableCapacityMT} MT</strong></span>
                      <span>Distance: <strong className="text-[#F5F5F5]">{supp.distanceKm} km</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Corridor Operational
                    </span>
                    <button
                      onClick={() => setActionNotice(`Contingency RFQ drafted for ${supp.organizationName}. Negotiate terms directly via ECONEX contracts.`)}
                      className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#282828] text-[#D4AF37] border border-[#333] rounded text-xs font-semibold"
                    >
                      Issue Emergency RFQ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#333] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Report Regional Disruption Incident
              </h3>
              <button onClick={() => setShowIncidentModal(false)} className="text-[#888] hover:text-[#F5F5F5] text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Incident Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Flooding Closes Katonga River Crossing"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Severity Level</label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value as DisruptionSeverity)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="CRITICAL">CRITICAL (Total Closure)</option>
                    <option value="HIGH">HIGH (Severe Delay)</option>
                    <option value="MEDIUM">MEDIUM (Moderate Congestion)</option>
                    <option value="LOW">LOW (Cautionary Notice)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Category</label>
                  <select
                    value={incidentCategory}
                    onChange={(e) => setIncidentCategory(e.target.value as DisruptionCategory)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="BORDER_CUSTOMS_DELAY">Border Customs Delay</option>
                    <option value="SEVERE_WEATHER_FLOOD">Severe Weather / Flood</option>
                    <option value="INFRASTRUCTURE_FAILURE">Infrastructure / Bridge Failure</option>
                    <option value="FUEL_SURCHARGE_SPIKE">Fuel Surcharge / Price Spike</option>
                    <option value="EXPORT_IMPORT_RESTRICTION">Regulatory / SPS Restriction</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Estimated Delay (Hours)</label>
                  <input
                    type="number"
                    required
                    value={incidentDelayHours}
                    onChange={(e) => setIncidentDelayHours(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Recommended Alternative Route / Action</label>
                <input
                  type="text"
                  required
                  value={altRouteName}
                  onChange={(e) => setAltRouteName(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Incident Summary & Provenance</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide verifiable context from UNMA, border police, or customs authorities."
                  value={incidentSummary}
                  onChange={(e) => setIncidentSummary(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 border-t border-[#2a2a2a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] text-[#A0A0A0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 text-[#F5F5F5] font-semibold rounded-lg shadow"
                >
                  Broadcast Incident Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Incident Modal */}
      {showResolveModal && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#333] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Resolve Disruption Incident
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-[#888] hover:text-[#F5F5F5] text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Mitigation & Restoration Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail how normal traffic flow or supply chain continuity was restored."
                  value={mitigationNotes}
                  onChange={(e) => setMitigationNotes(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 border-t border-[#2a2a2a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3.5 py-1.5 bg-[#222] hover:bg-[#333] text-[#A0A0A0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold rounded-lg shadow"
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
