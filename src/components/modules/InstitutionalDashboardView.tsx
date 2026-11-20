import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Shield,
  Download,
  CheckCircle2,
  Calendar,
  Globe2,
  RefreshCw,
  BarChart3,
  Layers
} from 'lucide-react';
import { EarlyWarningAlert, User } from '../../types';
import { api } from '../../services/apiClient';

interface InstitutionalDashboardViewProps {
  currentUser: User;
  alerts: EarlyWarningAlert[];
  onRefresh: () => void;
}

export const InstitutionalDashboardView: React.FC<InstitutionalDashboardViewProps> = ({
  currentUser,
  alerts,
  onRefresh
}) => {
  const [macroSummary, setMacroSummary] = useState<{
    totalAlerts: number;
    highRiskAlerts: number;
    resilienceScore: number;
    foodInsecurityIndex: number;
    crossBorderTradeVolumeUgx: number;
    strategicGrainReserveDays: number;
    monitoredDistrictsCount: number;
  }>({
    totalAlerts: alerts.length,
    highRiskAlerts: alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length,
    resilienceScore: 78.4,
    foodInsecurityIndex: 21.6,
    crossBorderTradeVolumeUgx: 48500000000,
    strategicGrainReserveDays: 62,
    monitoredDistrictsCount: 146
  });

  const [downloading, setDownloading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportPolicyReport = async () => {
    setExportError(null);
    setDownloading(true);
    const res = await api.exportDatabase();
    setDownloading(false);
    if (res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ECONEX_Policy_Resilience_Report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setExportError('Unable to export system telemetry right now. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-widest font-mono">
              Sovereign & Continental Macro Observatory
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#D4AF37]" />
            Institutional Food Resilience & Early Warning Observatory
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
            National food security monitoring, strategic grain reserve telemetry, supply chain disruption heatmaps, and multilateral policy intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPolicyReport}
            disabled={downloading}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8960C] text-[#050505] font-semibold px-4 py-2 rounded text-sm transition-colors"
          >
            <Download className="h-4 w-4" />{' '}
            {downloading ? 'Compiling Dossier...' : 'Export National Resilience Dossier'}
          </button>
        </div>
      </div>

      {exportError && (
        <div className="p-3 rounded bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
          <span>{exportError}</span>
          <button onClick={() => setExportError(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Macro Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>RESILIENCE COMPOSITE</span>
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {macroSummary.resilienceScore} / 100
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Normal baseline across 146 districts</div>
        </div>

        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>STRATEGIC GRAIN COVER</span>
            <Layers className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#D4AF37] mt-2">
            {macroSummary.strategicGrainReserveDays} Days
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Silo stocks: 42,000 MT verified</div>
        </div>

        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>REGIONAL TRADE VOLUME</span>
            <Globe2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
            UGX {(macroSummary.crossBorderTradeVolumeUgx / 1000000000).toFixed(1)}B
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Mombasa & Juba corridor throughput</div>
        </div>

        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>ACTIVE EARLY WARNINGS</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {alerts.length} Active ({macroSummary.highRiskAlerts} High)
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Karamoja & Katakwi watch active</div>
        </div>
      </div>

      {/* Early Warning Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Active Regional Early Warning Bulletins
          </h2>
          <span className="text-xs text-[#A0A0A0] font-mono">FEWS NET & UN-FAO Harmonized</span>
        </div>

        <div className="space-y-3">
          {alerts.map((al) => {
            const isCritical = al.severity === 'CRITICAL' || al.severity === 'HIGH';
            return (
              <div
                key={al.id}
                className={`p-5 rounded border transition-all ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                    : 'bg-[#121212] border-[#222] hover:border-[#333]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-bold ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {al.severity} SEVERITY
                      </span>
                      <span className="text-[10px] font-mono text-[#A0A0A0] uppercase">
                        {(al.type || al.alertType || 'ALERT').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{al.title}</h3>
                    <p className="text-xs text-[#D4AF37] font-mono">
                      Target Area: {al.affectedRegion || (al.affectedDistricts ? al.affectedDistricts.join(', ') : 'National')}
                    </p>
                  </div>
                  <span className="text-xs text-[#A0A0A0] font-mono flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Issued: {al.issuedDate || new Date(al.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-[#C0C0C0] mt-3 leading-relaxed">{al.summary || al.explanation}</p>

                {/* Mitigation Steps */}
                <div className="mt-4 pt-3 border-t border-[#1f1f1f] space-y-2">
                  <h4 className="text-[11px] font-mono text-[#A0A0A0] uppercase tracking-wider">
                    Recommended Policy & Operational Mitigations:
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#E0E0E0]">
                    {(al.recommendedMitigation || [al.recommendedAction]).filter(Boolean).map((m: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-1.5 p-2 rounded bg-[#0d0d0d] border border-[#222]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
