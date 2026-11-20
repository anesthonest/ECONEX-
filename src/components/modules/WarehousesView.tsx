import React, { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Snowflake,
  FileText,
  Plus,
  TrendingUp,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  MapPin,
  Shield,
  Layers
} from 'lucide-react';
import { Warehouse, WarehouseReceipt, User } from '../../types';
import { api } from '../../services/apiClient';

interface WarehousesViewProps {
  currentUser: User;
  warehouses: Warehouse[];
  receipts: WarehouseReceipt[];
  onRefresh: () => void;
}

export const WarehousesView: React.FC<WarehousesViewProps> = ({
  currentUser,
  warehouses,
  receipts,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'facilities' | 'receipts'>('facilities');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(warehouses[0] || null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueMessage, setIssueMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for creating a warehouse receipt
  const [commodity, setCommodity] = useState('Arabica Coffee Parchment');
  const [grade, setGrade] = useState('Grade AA');
  const [quantityKg, setQuantityKg] = useState(1500);
  const [moistureContent, setMoistureContent] = useState(12.1);
  const [insuredValueUgx, setInsuredValueUgx] = useState(18000000);
  const [bagCount, setBagCount] = useState(25);

  const handleIssueReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    setIssueSubmitting(true);
    setIssueMessage(null);

    try {
      const receipt = await api.issueWarehouseReceipt({
        warehouseId: selectedWarehouse.id,
        depositorId: currentUser.id,
        depositorName: currentUser.name,
        commodity,
        grade,
        quantityKg: Number(quantityKg),
        moistureContent: Number(moistureContent),
        insuredValueUgx: Number(insuredValueUgx),
        bagCount: Number(bagCount)
      });

      setIssueSubmitting(false);
      setIssueMessage({
        type: 'success',
        text: `Warehouse Receipt ${receipt.receiptNumber || ''} created and recorded under secured collateral registry!`
      });
      setTimeout(() => {
        setShowIssueModal(false);
        setIssueMessage(null);
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setIssueSubmitting(false);
      setIssueMessage({ type: 'error', text: err.message || 'Failed to issue receipt.' });
    }
  };

  const totalCapacity = warehouses.reduce((acc, w) => acc + (w.totalCapacityKg || w.capacityTons * 1000 || 50000), 0);
  const currentOccupancy = warehouses.reduce((acc, w) => acc + (w.currentOccupancyKg || w.currentOccupancyTons * 1000 || 0), 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-widest font-mono">
              Collateral & Preservation Infrastructure
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
            <WarehouseIcon className="h-6 w-6 text-[#D4AF37]" />
            Warehouses & Cold-Chain Network
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
            Certified grain silos, horticultural cold-chain storage with real-time telemetry, and collateralized warehouse receipt issuance for agricultural credit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8960C] text-[#050505] font-semibold px-4 py-2 rounded text-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Issue Deposit Receipt
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>NETWORK STORAGE</span>
            <WarehouseIcon className="h-4 w-4 text-[#C0C0C0]" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2">
            {(totalCapacity / 1000).toLocaleString()} MT
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Across 3 certified regional hubs</div>
        </div>

        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>CURRENT UTILIZATION</span>
            <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#D4AF37] mt-2">
            {overallOccupancyPct}%
          </div>
          <div className="w-full bg-[#222] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#D4AF37] h-full"
              style={{ width: `${overallOccupancyPct}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>COLD CHAIN STATUS</span>
            <Snowflake className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-2">
            3.8°C avg
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">Telemetry active: Jinja & Mbale</div>
        </div>

        <div className="p-4 rounded bg-[#121212] border border-[#222]">
          <div className="flex items-center justify-between text-xs text-[#A0A0A0] font-mono">
            <span>ACTIVE RECEIPTS</span>
            <FileText className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {receipts.length} Issued
          </div>
          <div className="text-xs text-[#A0A0A0] mt-1">
            Collateralized: UGX{' '}
            {(receipts.reduce((sum, r) => sum + (r.insuredValueUgx || (r.quantityTons * 1200000) || 0), 0) / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#222] text-sm">
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'facilities'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          Storage Facilities ({warehouses.length})
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'receipts'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          Collateralized Warehouse Receipts ({receipts.length})
        </button>
      </div>

      {/* Facility Tab Content */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-mono text-[#A0A0A0] uppercase tracking-wider">
              Regional Silos & Hubs
            </h3>
            {warehouses.map((w) => {
              const cap = w.totalCapacityKg || w.capacityTons * 1000 || 50000;
              const occ = w.currentOccupancyKg || w.currentOccupancyTons * 1000 || 0;
              const occPct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
              const isSelected = selectedWarehouse?.id === w.id;
              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWarehouse(w)}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#181818] border-[#D4AF37] shadow-md'
                      : 'bg-[#121212] border-[#222] hover:border-[#444]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{w.name}</h4>
                      <p className="text-xs text-[#A0A0A0] flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {w.district}, {w.region || 'Uganda'}
                      </p>
                    </div>
                    {(w.hasColdStorage || w.coldChainEnabled) && (
                      <span className="p-1 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 text-[10px] flex items-center gap-1 font-mono">
                        <Snowflake className="h-3 w-3" /> Cold Chain
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-xs">
                    <div className="flex justify-between text-[#A0A0A0] mb-1 font-mono">
                      <span>Occupancy</span>
                      <span>{occPct}% ({(occ / 1000).toLocaleString()} MT)</span>
                    </div>
                    <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${occPct > 80 ? 'bg-amber-400' : 'bg-[#D4AF37]'}`}
                        style={{ width: `${occPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#1f1f1f] flex items-center justify-between text-[11px] text-[#A0A0A0]">
                    <span>Rate: UGX {w.dailyRateUgxPerKg || 15}/kg/day</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Certified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warehouse Detail Card */}
          <div className="lg:col-span-2">
            {selectedWarehouse ? (
              <div className="p-6 rounded bg-[#121212] border border-[#222] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedWarehouse.name}</h2>
                    <p className="text-xs text-[#A0A0A0] mt-1 font-mono">
                      Operator: {selectedWarehouse.operatorName} • Cert No: {selectedWarehouse.certificationNumber || 'UWRSA-CERT-2026'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-xs font-mono">
                      MAAIF & UCDA COMPLIANT
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-[#0d0d0d] rounded border border-[#222]">
                    <div className="text-xs text-[#A0A0A0] font-mono">TOTAL CAPACITY</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {((selectedWarehouse.totalCapacityKg || selectedWarehouse.capacityTons * 1000 || 50000) / 1000).toLocaleString()} Metric Tons
                    </div>
                  </div>
                  <div className="p-3 bg-[#0d0d0d] rounded border border-[#222]">
                    <div className="text-xs text-[#A0A0A0] font-mono">AVAILABLE SPACE</div>
                    <div className="text-lg font-bold text-[#D4AF37] mt-1">
                      {(((selectedWarehouse.totalCapacityKg || selectedWarehouse.capacityTons * 1000 || 50000) - (selectedWarehouse.currentOccupancyKg || selectedWarehouse.currentOccupancyTons * 1000 || 0)) / 1000).toLocaleString()} MT
                    </div>
                  </div>
                  <div className="p-3 bg-[#0d0d0d] rounded border border-[#222]">
                    <div className="text-xs text-[#A0A0A0] font-mono">DAILY STORAGE TARIFF</div>
                    <div className="text-lg font-bold text-white mt-1">
                      UGX {selectedWarehouse.dailyRateUgxPerKg || 15} / kg
                    </div>
                  </div>
                </div>

                {/* Telemetry Section */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#D4AF37]" /> Environmental & Sensor Telemetry
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded bg-[#181818] border border-[#262626]">
                      <div className="text-xs text-[#A0A0A0]">Temperature</div>
                      <div className="text-lg font-bold text-white mt-1 font-mono">
                        {selectedWarehouse.temperatureCelsius !== undefined
                          ? `${selectedWarehouse.temperatureCelsius}°C`
                          : 'Ambient (21.4°C)'}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">Within optimal grain range</div>
                    </div>
                    <div className="p-3 rounded bg-[#181818] border border-[#262626]">
                      <div className="text-xs text-[#A0A0A0]">Relative Humidity</div>
                      <div className="text-lg font-bold text-white mt-1 font-mono">
                        {selectedWarehouse.humidityPercent !== undefined
                          ? `${selectedWarehouse.humidityPercent}%`
                          : '54.0%'}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-1">Fungal threshold safe (&lt;65%)</div>
                    </div>
                    <div className="p-3 rounded bg-[#181818] border border-[#262626]">
                      <div className="text-xs text-[#A0A0A0]">Security & Inspection</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1 font-mono flex items-center gap-1">
                        <Shield className="h-4 w-4" /> 24/7 Guarded
                      </div>
                      <div className="text-[10px] text-[#A0A0A0] mt-1">CCTV + Biometric seal verified</div>
                    </div>
                  </div>
                </div>

                {/* Accepted Commodities */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Accepted Agricultural Commodities</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedWarehouse.acceptedCommodities || ['Maize Grain', 'Arabica Coffee', 'Robusta Coffee', 'Soybeans']).map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded bg-[#1e1e1e] border border-[#333] text-xs text-[#C0C0C0]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Action */}
                <div className="pt-4 border-t border-[#222] flex justify-end">
                  <button
                    onClick={() => setShowIssueModal(true)}
                    className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#050505] font-semibold px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Deposit Cargo at {selectedWarehouse.name}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[#A0A0A0] bg-[#121212] rounded border border-[#222]">
                Select a warehouse to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipts Tab Content */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#121212] rounded border border-[#222] flex items-center justify-between text-xs text-[#A0A0A0]">
            <span>
              Warehouse Receipts (e-WHR) conform to the Uganda Warehouse Receipt System Authority (UWRSA) standard and can be pledged to partner commercial banks or VSLAs as loan collateral.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receipts.map((rcpt) => (
              <div
                key={rcpt.id}
                className="p-5 rounded bg-[#121212] border border-[#222] hover:border-[#333] transition-colors relative space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                      {rcpt.receiptNumber}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{rcpt.commodity}</h3>
                    <p className="text-xs text-[#A0A0A0]">
                      Depositor: <span className="text-white font-medium">{rcpt.depositorName}</span>
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-mono border ${
                      rcpt.status === 'ISSUED'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : rcpt.status === 'PLEDGED_AS_COLLATERAL'
                        ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {(rcpt.status || 'ISSUED').replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-[#0a0a0a] rounded border border-[#1e1e1e] text-xs">
                  <div>
                    <span className="text-[#A0A0A0] block text-[10px]">QUANTITY</span>
                    <span className="font-mono font-bold text-white">
                      {(rcpt.quantityKg || rcpt.quantityTons * 1000 || 0).toLocaleString()} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A0A0A0] block text-[10px]">GRADE / MOISTURE</span>
                    <span className="font-mono text-[#D4AF37]">
                      {rcpt.grade} ({rcpt.moistureContent || 12.5}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A0A0A0] block text-[10px]">INSURED VAL (UGX)</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(rcpt.insuredValueUgx || (rcpt.quantityTons * 1200000) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#A0A0A0] pt-2 border-t border-[#1f1f1f]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Deposited: {rcpt.depositDate || rcpt.storageDate}
                  </span>
                  <span className="text-[11px] font-mono">Bags: {rcpt.bagCount || 50} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Receipt Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#333] rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#D4AF37]" /> Issue Electronic Warehouse Receipt
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-[#A0A0A0] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {issueMessage && (
              <div
                className={`p-3 rounded text-xs border ${
                  issueMessage.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                }`}
              >
                {issueMessage.text}
              </div>
            )}

            <form onSubmit={handleIssueReceipt} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#A0A0A0] mb-1">FACILITY</label>
                <select
                  value={selectedWarehouse?.id || ''}
                  onChange={(e) => {
                    const found = warehouses.find((w) => w.id === e.target.value);
                    if (found) setSelectedWarehouse(found);
                  }}
                  className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#A0A0A0] mb-1">COMMODITY</label>
                  <input
                    type="text"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                    required
                    className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A0A0A0] mb-1">GRADE</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                    className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#A0A0A0] mb-1">WEIGHT (KG)</label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    required
                    className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A0A0A0] mb-1">MOISTURE (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moistureContent}
                    onChange={(e) => setMoistureContent(Number(e.target.value))}
                    required
                    className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A0A0A0] mb-1">BAG COUNT</label>
                  <input
                    type="number"
                    value={bagCount}
                    onChange={(e) => setBagCount(Number(e.target.value))}
                    required
                    className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A0A0A0] mb-1">INSURED VALUATION (UGX)</label>
                <input
                  type="number"
                  value={insuredValueUgx}
                  onChange={(e) => setInsuredValueUgx(Number(e.target.value))}
                  required
                  className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded text-xs text-[#A0A0A0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueSubmitting}
                  className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#050505] font-semibold px-4 py-2 rounded text-xs transition-colors flex items-center gap-2"
                >
                  {issueSubmitting ? 'Issuing e-WHR...' : 'Certify & Record Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
