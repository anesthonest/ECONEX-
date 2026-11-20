/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V5 - National & Regional Infrastructure Observatory
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  TrendingUp,
  AlertCircle,
  Truck,
  Building,
  Shield,
  Layers,
  MapPin,
  RefreshCw,
  Sliders,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  CountryTenantConfig,
  RegionalObservatoryMetric,
} from '../../types/index.ts';

export default function RegionalObservatoryView() {
  const [tenants, setTenants] = useState<CountryTenantConfig[]>([]);
  const [metrics, setMetrics] = useState<RegionalObservatoryMetric[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('UG');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tenant Isolation Tester state
  const [testActorId, setTestActorId] = useState('usr-farmer-01');
  const [testTargetTenant, setTestTargetTenant] = useState('org-coop-masaka');
  const [testCountry, setTestCountry] = useState('KE');
  const [isolationResult, setIsolationResult] = useState<any>(null);
  const [testingIsolation, setTestingIsolation] = useState(false);

  // Country Configuration modal/edit state
  const [activeTenant, setActiveTenant] = useState<CountryTenantConfig | null>(null);
  const [editTaxRate, setEditTaxRate] = useState<number>(18);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const loadData = async (countryCode?: string) => {
    try {
      setRefreshing(true);
      const [tList, mList] = await Promise.all([
        api.getCountryTenants(),
        api.getRegionalObservatoryMetrics(countryCode),
      ]);
      setTenants(tList);
      setMetrics(mList);

      const current = tList.find((t) => (t.countryCode || t.code) === (countryCode || selectedCountry));
      if (current) {
        setActiveTenant(current);
        setEditTaxRate(current.vatTaxRatePercent || 18);
      }
    } catch (err) {
      console.error('Failed to load observatory data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedCountry);
  }, [selectedCountry]);

  const handleTestIsolation = async () => {
    try {
      setTestingIsolation(true);
      const res = await api.checkTenantIsolation(testActorId, testTargetTenant, testCountry);
      setIsolationResult(res);
    } catch (err: any) {
      setIsolationResult({
        allowed: false,
        reason: err.message || 'Tenant check failed',
      });
    } finally {
      setTestingIsolation(false);
    }
  };

  const handleSaveCountryConfig = async () => {
    if (!activeTenant) return;
    try {
      setSavingConfig(true);
      const code = activeTenant.countryCode || activeTenant.code || 'UG';
      const updated = await api.configureCountryTenant(code, {
        vatTaxRatePercent: Number(editTaxRate),
      });
      setActiveTenant(updated);
      setSaveStatus('Country tenant configuration saved successfully');
      setTimeout(() => setSaveStatus(null), 4000);
      await loadData(selectedCountry);
    } catch (err: any) {
      setSaveStatus(`Failed to update config: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  // Aggregated summaries
  const totalProductionMT = metrics.reduce((acc, m) => acc + (m.seasonalYieldActualMT ?? m.seasonalYieldForecastMT ?? m.grainReservesTons ?? 0), 0);
  const totalStorageCapacity = metrics.reduce((acc, m) => acc + (m.storageCapacityMT ?? 10000), 0);
  const totalOccupiedStorage = metrics.reduce((acc, m) => acc + (m.occupiedStorageMT ?? m.grainReservesTons ?? 0), 0);
  const avgStorageUtilization = totalStorageCapacity > 0 ? (totalOccupiedStorage / totalStorageCapacity) * 100 : 0;
  const highRiskCount = metrics.filter((m) => m.foodSecurityStatus === 'DEFICIT_WARNING' || m.foodSecurityStatus === 'FAMINE_EARLY_WARNING' || m.foodSecurityLevel === 'ACUTE_ALERT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Globe className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-100">
              National & Regional Infrastructure Observatory
            </h1>
            <p className="text-sm text-stone-400">
              7 EAC Partner States, District Grain Reserves, Cross-Border Flows & Data Sovereignty
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 bg-stone-900 border border-stone-700 text-amber-400 font-semibold text-sm rounded-lg focus:outline-none focus:border-amber-500"
          >
            {tenants.map((t) => {
              const code = t.countryCode || t.code;
              const name = t.countryName || t.name;
              const cur = t.defaultCurrency || t.primaryCurrency;
              return (
                <option key={code} value={code}>
                  {name} ({code}) - {cur}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => loadData(selectedCountry)}
            disabled={refreshing}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-700 text-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Aggregate Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>REGIONAL HARVEST YIELD</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {totalProductionMT.toLocaleString()} <span className="text-xs text-stone-400 font-normal">MT</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Aggregated seasonal forecast</div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>GRAIN STORAGE CAPACITY</span>
            <Building className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {totalStorageCapacity.toLocaleString()} <span className="text-xs text-stone-400 font-normal">MT</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {avgStorageUtilization.toFixed(1)}% currently utilized
          </div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>FOOD SECURITY ALERT</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-stone-100">
            {highRiskCount > 0 ? (
              <span className="text-rose-400">{highRiskCount} Districts Alert</span>
            ) : (
              <span className="text-emerald-400">SURPLUS STABLE</span>
            )}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">IPC Level 1–2 surveillance</div>
        </div>

        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-xl">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
            <span>BORDER JURISDICTION</span>
            <Shield className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {activeTenant?.customsSystemCode || 'ASYCUDA++'}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {activeTenant?.borderAuthorities?.join(', ') || 'Customs'}
          </div>
        </div>
      </div>

      {/* Main Grid: District Metrics Table vs Country Config & Isolation Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Metrics List */}
        <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-stone-100">
                District Level Economic & Food Reserves ({selectedCountry})
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-stone-800 text-stone-300 font-mono">
              {metrics.length} Monitored Zones
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-500">Loading district metrics...</div>
          ) : metrics.length === 0 ? (
            <div className="py-12 text-center text-stone-500">No district metrics available for this country.</div>
          ) : (
            <div className="space-y-3">
              {metrics.map((m) => {
                const storageCap = m.storageCapacityMT ?? 10000;
                const occStorage = m.occupiedStorageMT ?? m.grainReservesTons ?? 0;
                const utilPercent = (occStorage / storageCap) * 100;
                const status = m.foodSecurityStatus || (m.foodSecurityLevel === 'SECURE' ? 'SURPLUS_OPTIMAL' : 'BALANCED');
                return (
                  <div
                    key={m.id}
                    className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl hover:border-stone-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-200">{m.districtName || m.district}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
                          {(m.primaryCommodities || ['Yellow Maize', 'Robusta Coffee']).join(', ')}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-mono font-semibold self-start sm:self-auto ${
                          status === 'SURPLUS_OPTIMAL'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : status === 'BALANCED'
                            ? 'bg-blue-500/20 text-blue-300'
                            : status === 'DEFICIT_WARNING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-stone-800 text-xs">
                      <div>
                        <div className="text-stone-500 text-[11px]">Forecast Yield</div>
                        <div className="font-semibold text-stone-300 font-mono">
                          {(m.seasonalYieldForecastMT ?? m.grainReservesTons ?? 0).toLocaleString()} MT
                        </div>
                      </div>
                      <div>
                        <div className="text-stone-500 text-[11px]">Storage In-Use</div>
                        <div className="font-semibold text-stone-300 font-mono">
                          {occStorage.toLocaleString()} / {storageCap.toLocaleString()} MT
                        </div>
                      </div>
                      <div>
                        <div className="text-stone-500 text-[11px]">Market Price Avg</div>
                        <div className="font-semibold text-amber-300 font-mono">
                          {(m.priceAverageLocalCurrency ?? 1350).toLocaleString()} {activeTenant?.defaultCurrency || activeTenant?.primaryCurrency || 'UGX'}
                        </div>
                      </div>
                      <div>
                        <div className="text-stone-500 text-[11px]">Corridor Outflow</div>
                        <div className="font-semibold text-cyan-300 font-mono">
                          {(m.crossBorderOutflowMT ?? 0).toLocaleString()} MT
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Storage Utilization */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                        <span>Grain Silo Capacity Utilization</span>
                        <span className="font-mono">{utilPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            utilPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(utilPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Country Tenant Configuration & Data Sovereignty Tester */}
        <div className="space-y-6">
          {/* Country Tenant Configuration Box */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-3">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-stone-100">Tenant Jurisdiction Config</h2>
            </div>

            {activeTenant ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-500 block">Member State:</span>
                  <span className="text-stone-200 font-semibold">{activeTenant.countryName || activeTenant.name} ({activeTenant.countryCode || activeTenant.code})</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Currency & Protocol:</span>
                  <span className="text-amber-400 font-mono">{activeTenant.defaultCurrency || activeTenant.primaryCurrency} • {activeTenant.tradeDocumentationProtocol}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Customs System:</span>
                  <span className="text-stone-300 font-mono">{activeTenant.customsSystemCode}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Border Authorities:</span>
                  <span className="text-stone-300">{activeTenant.borderAuthorities?.join(', ')}</span>
                </div>

                <div className="pt-2 border-t border-stone-800">
                  <label className="block text-stone-400 font-medium mb-1">
                    Standard VAT Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={editTaxRate}
                    onChange={(e) => setEditTaxRate(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 text-stone-100 rounded px-3 py-2 font-mono"
                  />
                </div>

                {saveStatus && (
                  <div className="text-[11px] p-2 bg-stone-800 text-amber-300 rounded">
                    {saveStatus}
                  </div>
                )}

                <button
                  onClick={handleSaveCountryConfig}
                  disabled={savingConfig}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded text-xs transition-colors disabled:opacity-50"
                >
                  {savingConfig ? 'Saving Tenant Settings...' : 'Update Tenant Config'}
                </button>
              </div>
            ) : (
              <div className="text-stone-500 text-xs">Select a country tenant to view details.</div>
            )}
          </div>

          {/* Real-Time Tenant Isolation Verification Tool */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-stone-100">Tenant Isolation Verifier</h2>
            </div>
            <p className="text-xs text-stone-400 mb-3">
              Enforce strict data sovereignty and cross-tenant boundaries before accessing data.
            </p>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-stone-400 block mb-0.5">Actor User ID</label>
                <input
                  type="text"
                  value={testActorId}
                  onChange={(e) => setTestActorId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-stone-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-0.5">Target Tenant / Org ID</label>
                <input
                  type="text"
                  value={testTargetTenant}
                  onChange={(e) => setTestTargetTenant(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-stone-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-0.5">Target Country Sovereign Code</label>
                <select
                  value={testCountry}
                  onChange={(e) => setTestCountry(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-stone-200 text-xs"
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

              <button
                onClick={handleTestIsolation}
                disabled={testingIsolation}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>{testingIsolation ? 'Checking Policy...' : 'Verify Isolation Boundary'}</span>
              </button>

              {isolationResult && (
                <div
                  className={`p-3 rounded-lg border text-xs mt-3 ${
                    isolationResult.allowed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    {isolationResult.allowed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{isolationResult.allowed ? 'ACCESS PERMITTED' : 'ACCESS DENIED (ISOLATED)'}</span>
                  </div>
                  <div className="text-[11px]">{isolationResult.reason}</div>
                  {isolationResult.actor && (
                    <div className="text-[10px] text-stone-400 mt-1">
                      Actor Role: {isolationResult.actor.role} • Country: {isolationResult.actor.country}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
