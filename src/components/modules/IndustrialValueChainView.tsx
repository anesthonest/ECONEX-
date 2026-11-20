/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V4 - Industrial Value Chains & Agro-Processing Infrastructure
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Factory,
  Layers,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Building2,
  ShieldCheck,
  Scale,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  IndustrialFacility,
  ProductionOrder,
  RegionalProcurementRfq,
  RfqQuotation,
  IndustrialSector,
  UserProfile,
} from '../../types/index.ts';

interface IndustrialValueChainViewProps {
  currentUser?: UserProfile | null;
}

export default function IndustrialValueChainView({ currentUser }: IndustrialValueChainViewProps) {
  const [facilities, setFacilities] = useState<IndustrialFacility[]>([]);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [rfqs, setRfqs] = useState<RegionalProcurementRfq[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<IndustrialFacility | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'FACILITIES' | 'ORDERS' | 'RFQS'>('FACILITIES');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);

  // RFQ Form
  const [rfqTitle, setRfqTitle] = useState('Bulk Soya Beans Offtake 2026 Season B');
  const [rfqCommodity, setRfqCommodity] = useState('Non-GMO Soybeans');
  const [rfqVolume, setRfqVolume] = useState('500');
  const [rfqMoisture, setRfqMoisture] = useState('12.5');
  const [rfqPrice, setRfqPrice] = useState('590');
  const [rfqDelivery, setRfqDelivery] = useState('Factory Gate Jinja Complex');

  // Lab Test Form
  const [testParameter, setTestParameter] = useState('Moisture & Aflatoxin Assay');
  const [testValue, setTestValue] = useState('11.8% moisture, <4 ppb aflatoxin');
  const [testPassed, setTestPassed] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facList, orderList, rfqList] = await Promise.all([
        api.getIndustrialFacilities(),
        api.getProductionOrders(),
        api.getProcurementRfqs(),
      ]);
      setFacilities(facList);
      setOrders(orderList);
      setRfqs(rfqList);
      if (facList.length > 0 && !selectedFacility) setSelectedFacility(facList[0]);
      if (orderList.length > 0 && !selectedOrder) setSelectedOrder(orderList[0]);
    } catch (err) {
      console.error('Failed to load industrial value chain data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProcurementRfq({
        title: rfqTitle,
        issuerOrganizationId: selectedFacility?.organizationId || 'org_ind_mukwano',
        issuerName: selectedFacility?.name || 'Industrial Processor',
        commodityName: rfqCommodity,
        commodityType: 'OILSEEDS',
        requiredVolumeMT: Number(rfqVolume),
        minimumGrade: 'Grade 1 Premium Processing',
        maxMoisturePercent: Number(rfqMoisture),
        targetPriceUsdPerMT: Number(rfqPrice),
        deliveryPoint: rfqDelivery,
      });
      setShowRfqModal(false);
      await loadData();
      setActiveTab('RFQS');
    } catch (err) {
      console.error('Failed to create procurement RFQ:', err);
    }
  };

  const handleAdvanceOrder = async (orderId: string, nextStatus: any) => {
    try {
      const updated = await api.updateProductionOrderStage(orderId, {
        status: nextStatus,
        notes: `Production stage advanced to ${nextStatus} by plant manager.`,
      });
      setSelectedOrder(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to update order stage:', err);
    }
  };

  const handleAddLabTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const updated = await api.updateProductionOrderStage(selectedOrder.id, {
        labTest: {
          testParameter,
          observedValue: testValue,
          standardThreshold: 'Moisture <= 12.5%, Aflatoxin < 10 ppb',
          passed: testPassed,
          testedAt: new Date().toISOString(),
          inspector: currentUser?.name || 'UNBS Quality Chemist',
        },
      });
      setSelectedOrder(updated);
      setShowLabModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to log lab test:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#121212] border border-[#2a2a2a] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#D4AF37]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 tracking-wider">
                ECONEX INDUSTRIAL VALUE CHAINS
              </span>
              <span className="text-xs text-[#A0A0A0] flex items-center gap-1">
                <Factory className="w-3.5 h-3.5 text-[#D4AF37]" /> Manufacturing & Agro-Processing Network
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F5] tracking-tight">
              Agro-Industrial Processing & Raw Material Sourcing
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-2xl">
              Connects regional processing hubs (edible oils, grain milling, sugar, textiles) to agricultural cooperatives via forward procurement RFQs and batch production tracking.
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
              onClick={() => setShowRfqModal(true)}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Procurement RFQ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2a2a2a] pb-3 text-xs">
        <button
          onClick={() => setActiveTab('FACILITIES')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'FACILITIES'
              ? 'bg-[#D4AF37] text-[#050505] shadow'
              : 'bg-[#181818] text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Factory className="w-3.5 h-3.5" />
          <span>Industrial Facilities ({facilities.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'ORDERS'
              ? 'bg-[#D4AF37] text-[#050505] shadow'
              : 'bg-[#181818] text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Production Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('RFQS')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'RFQS'
              ? 'bg-[#D4AF37] text-[#050505] shadow'
              : 'bg-[#181818] text-[#A0A0A0] hover:text-[#F5F5F5]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Procurement RFQs ({rfqs.length})</span>
        </button>
      </div>

      {/* Tab 1: Industrial Facilities */}
      {activeTab === 'FACILITIES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {facilities.map((f) => (
            <div
              key={f.id}
              className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-[#D4AF37] font-semibold">{f.sector.replace(/_/g, ' ')}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-semibold">
                    {f.verificationStatus}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#F5F5F5]">{f.name}</h3>
                <p className="text-xs text-[#A0A0A0] mt-0.5">{f.address}, {f.district}, {f.country}</p>

                <div className="mt-4 p-3 bg-[#181818] border border-[#262626] rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Annual Processing:</span>
                    <strong className="text-[#F5F5F5]">{(f.annualProcessingCapacityMT || f.processingCapacityTonsPerDay || 0).toLocaleString()} MT</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Raw Feedstocks:</span>
                    <span className="text-[#D4AF37] truncate max-w-[150px]">{(f.activeRawMaterials || []).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Finished Products:</span>
                    <span className="text-[#F5F5F5] truncate max-w-[150px]">{(f.finishedProducts || []).join(', ')}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(f.certifications || []).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-[#222] text-[#A0A0A0] border border-[#333]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#222] flex items-center justify-between text-xs">
                <span className="text-[#888]">Quality: Moisture &le; {f.qualityStandards?.maxMoisturePercent ?? 12.5}%</span>
                <button
                  onClick={() => {
                    setSelectedFacility(f);
                    setShowRfqModal(true);
                  }}
                  className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#282828] text-[#D4AF37] border border-[#333] rounded text-xs font-semibold"
                >
                  Issue Sourcing RFQ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Production Orders */}
      {activeTab === 'ORDERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {orders.map((o) => {
              const isSelected = selectedOrder?.id === o.id;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1e190e] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                      : 'bg-[#121212] border-[#282828] hover:border-[#3a3a3a]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-[#D4AF37] font-semibold">{o.batchCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#222] text-[#A0A0A0] font-medium">
                      {(o.status || 'QUEUED').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F5F5F5]">{o.productName}</h4>
                  <div className="text-xs text-[#A0A0A0] mt-1 flex justify-between">
                    <span>Target: <strong>{(o.targetQuantityUnits || o.quantityPlanned || 0).toLocaleString()} {o.unitMetric || o.unit || 'Units'}</strong></span>
                    <span>Raw Sourced: <strong className="text-emerald-400">{o.rawMaterialSourcedMT || 0}/{o.rawMaterialRequiredMT || 0} MT</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-8 space-y-4">
            {selectedOrder ? (
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-[#222] pb-4">
                  <div>
                    <span className="font-mono text-xs text-[#D4AF37]">{selectedOrder.id}</span>
                    <h3 className="text-lg font-bold text-[#F5F5F5]">{selectedOrder.productName} ({selectedOrder.batchCode})</h3>
                    <p className="text-xs text-[#A0A0A0]">
                      Facility: {selectedOrder.facilityName} &bull; Offtaker: {selectedOrder.offtakerName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLabModal(true)}
                    className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#282828] text-[#D4AF37] border border-[#333] rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Log Lab Test
                  </button>
                </div>

                {/* 6-Stage Industrial Tracker */}
                <div>
                  <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Production Stages</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      'CONTRACT_SIGNED',
                      'RAW_MATERIAL_INTAKE',
                      'QUALITY_TESTING',
                      'PROCESSING_ACTIVE',
                      'PACKAGED_INSPECTED',
                      'DISPATCHED_TO_OFFTAKER',
                    ].map((stageName, sIdx) => {
                      const stages = [
                        'CONTRACT_SIGNED',
                        'RAW_MATERIAL_INTAKE',
                        'QUALITY_TESTING',
                        'PROCESSING_ACTIVE',
                        'PACKAGED_INSPECTED',
                        'DISPATCHED_TO_OFFTAKER',
                      ];
                      const currentIdx = stages.indexOf(selectedOrder.status || 'CONTRACT_SIGNED');
                      const isPassed = sIdx <= currentIdx;
                      const isCurrent = sIdx === currentIdx;

                      return (
                        <div
                          key={stageName}
                          onClick={() => handleAdvanceOrder(selectedOrder.id, stageName)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-[#241d0f] border-[#D4AF37] text-[#F5F5F5] font-semibold'
                              : isPassed
                              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                              : 'bg-[#181818] border-[#222] text-[#666]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span>{stageName.replace(/_/g, ' ')}</span>
                            {isPassed && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lab Tests */}
                <div>
                  <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Quality Assurance & Lab Tests</h4>
                  {(selectedOrder.labTests || []).length > 0 ? (
                    <div className="space-y-2">
                      {(selectedOrder.labTests || []).map((t, idx) => (
                        <div key={idx} className="p-3 bg-[#181818] border border-[#262626] rounded-lg text-xs flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-[#F5F5F5]">{t.testParameter}</span>
                            <div className="text-[#A0A0A0] text-[11px]">Result: {t.observedValue} | Standard: {t.standardThreshold}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.passed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                            {t.passed ? 'PASSED' : 'DEFECTIVE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#666]">No lab tests logged yet for this batch.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-12 text-center text-[#A0A0A0]">
                Select a production order to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Procurement RFQs */}
      {activeTab === 'RFQS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#D4AF37] font-semibold">{rfq.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#1e293b] text-blue-300 font-medium">
                    {rfq.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F5]">{rfq.title}</h3>
                  <p className="text-xs text-[#A0A0A0]">Issuer: {rfq.issuerName}</p>
                </div>
                <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Volume Required:</span>
                    <strong className="text-[#F5F5F5]">{rfq.requiredVolumeMT} MT ({rfq.commodityName})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Max Moisture:</span>
                    <strong className="text-amber-400">&le; {rfq.maxMoisturePercent}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Target Price:</span>
                    <strong className="text-emerald-400 font-mono">${rfq.targetPriceUsdPerMT} / MT</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0A0A0]">Delivery Destination:</span>
                    <span className="text-[#F5F5F5]">{rfq.deliveryPoint}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#888]">Quotations: {rfq.quotationsCount} Submitted</span>
                  <span className="text-[#D4AF37] font-semibold">{rfq.settlementTerms}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New RFQ Modal */}
      {showRfqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#333] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" /> Issue Regional Sourcing RFQ
              </h3>
              <button onClick={() => setShowRfqModal(false)} className="text-[#888] hover:text-[#F5F5F5] text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">RFQ Title</label>
                <input
                  type="text"
                  required
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Commodity Name</label>
                  <input
                    type="text"
                    required
                    value={rfqCommodity}
                    onChange={(e) => setRfqCommodity(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Required Volume (MT)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={rfqVolume}
                    onChange={(e) => setRfqVolume(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Max Moisture (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={rfqMoisture}
                    onChange={(e) => setRfqMoisture(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Target Price ($/MT)</label>
                  <input
                    type="number"
                    required
                    value={rfqPrice}
                    onChange={(e) => setRfqPrice(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Delivery Destination</label>
                <input
                  type="text"
                  required
                  value={rfqDelivery}
                  onChange={(e) => setRfqDelivery(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 border-t border-[#2a2a2a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRfqModal(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] text-[#A0A0A0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold rounded-lg shadow"
                >
                  Publish RFQ to Cooperatives
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Modal */}
      {showLabModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#333] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Log Laboratory Inspection
              </h3>
              <button onClick={() => setShowLabModal(false)} className="text-[#888] hover:text-[#F5F5F5] text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLabTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Test Parameter</label>
                <input
                  type="text"
                  required
                  value={testParameter}
                  onChange={(e) => setTestParameter(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Observed Value</label>
                <input
                  type="text"
                  required
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="testPassedCheckbox"
                  checked={testPassed}
                  onChange={(e) => setTestPassed(e.target.checked)}
                  className="rounded text-[#D4AF37]"
                />
                <label htmlFor="testPassedCheckbox" className="text-[#F5F5F5]">
                  Meets UNBS & Factory Quality Specifications (PASSED)
                </label>
              </div>

              <div className="pt-3 border-t border-[#2a2a2a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLabModal(false)}
                  className="px-3.5 py-1.5 bg-[#222] hover:bg-[#333] text-[#A0A0A0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold rounded-lg shadow"
                >
                  Record Lab Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
