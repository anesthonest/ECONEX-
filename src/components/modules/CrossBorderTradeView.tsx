/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V4 - Regional Cross-Border Trade & 15-Stage Execution Engine
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Truck,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Anchor,
  Scale,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import {
  CrossBorderTrade,
  CrossBorderTradeStage,
  TradeDocumentRef,
  TradeDocumentType,
  TradeScope,
  TradeCommodityType,
  UserProfile,
} from '../../types/index.ts';

interface CrossBorderTradeViewProps {
  currentUser?: UserProfile | null;
}

const ALL_15_STAGES: Array<{ stage: CrossBorderTradeStage; label: string; description: string }> = [
  { stage: 'INQUIRY_SOURCING', label: '1. Sourcing Inquiry', description: 'Buyer initiates regional procurement request' },
  { stage: 'COMMERCIAL_TERMS_AGREED', label: '2. Commercial Terms', description: 'Volume, Incoterm (DAP/FOB), and USD pricing agreed' },
  { stage: 'SALES_PURCHASE_CONTRACT_SIGNED', label: '3. Contract Execution', description: 'Bilateral legal trade contract executed' },
  { stage: 'ESCROW_FUNDING_CONFIRMED', label: '4. Escrow Deposit', description: 'Letter of Credit or Multi-Currency Escrow locked' },
  { stage: 'PRODUCE_AGGREGATION_WAREHOUSE', label: '5. Hub Aggregation', description: 'Commodity assembled at regional warehouse' },
  { stage: 'SPS_PHYTOSANITARY_INSPECTION', label: '6. SPS Phytosanitary', description: 'MAAIF laboratory testing for moisture and pests' },
  { stage: 'EAC_CERTIFICATE_OF_ORIGIN_ISSUED', label: '7. EAC Certificate', description: 'Rules of Origin verified for 0% preferential tariff' },
  { stage: 'TRANSIT_CONSIGNMENT_DISPATCHED', label: '8. Fleet Dispatched', description: 'Carrier loaded and sealed with RECTS e-seal' },
  { stage: 'BORDER_CHECKPOINT_ARRIVAL', label: '9. Border Post Arrival', description: 'Truck arrives at One-Stop Border Post (e.g. Malaba)' },
  { stage: 'SINGLE_CUSTOMS_TERRITORY_DECLARATION', label: '10. SCT Declaration', description: 'Joint customs assessment (URA / KRA / TRA)' },
  { stage: 'IMPORT_SPS_BORDER_CLEARANCE', label: '11. Border Cleared', description: 'Customs & SPS clearance stamp issued' },
  { stage: 'CORRIDOR_TRANSIT_DESTINATION', label: '12. Inland Corridor', description: 'Final transit segment along corridor highway' },
  { stage: 'DESTINATION_WAREHOUSE_ARRIVAL', label: '13. Offtaker Arrival', description: 'Consignment arrives at destination factory' },
  { stage: 'CONSIGNEE_QUALITY_ACCEPTANCE', label: '14. Lab Acceptance', description: 'Offtaker lab verifies specifications' },
  { stage: 'FINAL_SETTLEMENT_COMPLETE', label: '15. Final Settlement', description: 'Escrow released and currency settled to exporter' },
];

export default function CrossBorderTradeView({ currentUser }: CrossBorderTradeViewProps) {
  const [trades, setTrades] = useState<CrossBorderTrade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<CrossBorderTrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterScope, setFilterScope] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [advancing, setAdvancing] = useState(false);
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  // New Trade Form
  const [newCommodity, setNewCommodity] = useState('Non-GMO Soybeans');
  const [newCommodityType, setNewCommodityType] = useState<TradeCommodityType>('OILSEEDS');
  const [newScope, setNewScope] = useState<TradeScope>('EAST_AFRICAN_COMMUNITY');
  const [newOriginCountry, setNewOriginCountry] = useState('Uganda');
  const [newDestCountry, setNewDestCountry] = useState('Kenya');
  const [newVolume, setNewVolume] = useState('100');
  const [newUnitPrice, setNewUnitPrice] = useState('580');
  const [newIncoterm, setNewIncoterm] = useState<'FOB' | 'CIF' | 'DAP' | 'EXW'>('DAP');
  const [newBorderPost, setNewBorderPost] = useState('Malaba OSBP');
  const [newCorridor, setNewCorridor] = useState('corridor_northern_01');

  // New Document Form
  const [docType, setDocType] = useState<TradeDocumentType>('COMMERCIAL_INVOICE');
  const [docNumber, setDocNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');

  const loadTrades = async () => {
    try {
      setLoading(true);
      const data = await api.getTrades();
      setTrades(data);
      if (data.length > 0 && !selectedTrade) {
        setSelectedTrade(data[0]);
      } else if (selectedTrade) {
        const refreshed = data.find((t) => t.id === selectedTrade.id);
        if (refreshed) setSelectedTrade(refreshed);
      }
    } catch (err) {
      console.error('Failed to load cross border trades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const handleAdvanceStage = async () => {
    if (!selectedTrade) return;
    const currentIndex = ALL_15_STAGES.findIndex((s) => s.stage === selectedTrade.currentStage);
    if (currentIndex >= ALL_15_STAGES.length - 1) return;

    const nextStage = ALL_15_STAGES[currentIndex + 1].stage;
    try {
      setAdvancing(true);
      const updated = await api.advanceTradeStage(
        selectedTrade.id,
        nextStage,
        currentUser?.name || 'Authorized Regional Trade Officer',
        advanceNotes || `Advancement to ${nextStage} verified with trade audit trail.`
      );
      setSelectedTrade(updated);
      setAdvanceNotes('');
      await loadTrades();
    } catch (err) {
      console.error('Failed to advance stage:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const handleDocumentStatus = async (docId: string, status: string) => {
    if (!selectedTrade) return;
    try {
      await api.updateTradeDocumentStatus(
        selectedTrade.id,
        docId,
        status,
        `Status set to ${status} by verified trade official.`
      );
      await loadTrades();
    } catch (err) {
      console.error('Failed to update document status:', err);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrade || !issuingAuthority) return;
    try {
      await api.addTradeDocument(selectedTrade.id, {
        documentType: docType,
        documentNumber: docNumber || `DOC-${Date.now().toString().slice(-6)}`,
        issuingAuthority,
        issuingCountry: selectedTrade.originCountry,
      });
      setShowNewDocModal(false);
      setDocNumber('');
      setIssuingAuthority('');
      await loadTrades();
    } catch (err) {
      console.error('Failed to add document:', err);
    }
  };

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vol = Number(newVolume);
      const price = Number(newUnitPrice);
      const total = vol * price;
      const created = await api.createTrade({
        commodityName: newCommodity,
        commodityType: newCommodityType,
        scope: newScope,
        originCountry: newOriginCountry,
        destinationCountry: newDestCountry,
        exporterId: currentUser?.id || 'org_coop_elgon',
        exporterName: currentUser?.organizationName || 'Mount Elgon Farmers Union',
        importerId: 'org_ind_mukwano',
        importerName: 'Mukwano Industries Uganda & Kenya Ltd',
        volumeMetricTonnes: vol,
        unitPriceUsd: price,
        totalValueUsd: total,
        settlementCurrency: 'USD',
        settlementAmountLocal: total * 3750,
        incoterm: newIncoterm,
        borderPost: newBorderPost,
        corridorId: newCorridor,
      });
      setShowNewTradeModal(false);
      await loadTrades();
      setSelectedTrade(created);
    } catch (err) {
      console.error('Failed to create cross-border trade:', err);
    }
  };

  const filteredTrades = trades.filter((t) => {
    if (filterScope !== 'ALL' && t.scope !== filterScope) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        (t.commodityName || t.commodity || '').toLowerCase().includes(q) ||
        (t.exporterName || t.sellerName || '').toLowerCase().includes(q) ||
        (t.importerName || t.buyerName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const currentStageIndex = selectedTrade
    ? ALL_15_STAGES.findIndex((s) => s.stage === selectedTrade.currentStage)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121212] via-[#1a1a1a] to-[#121212] border border-[#2a2a2a] rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#D4AF37]/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 tracking-wider">
                ECONEX REGIONAL TRADE
              </span>
              <span className="text-xs text-[#A0A0A0] flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#D4AF37]" /> EAC Customs Union & AfCFTA
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F5] tracking-tight">
              Cross-Border Trade Lifecycle & Document Engine
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-2xl">
              15-stage end-to-end execution covering commercial agreements, multi-currency escrow, SPS phytosanitary compliance, EAC Certificates of Origin, RECTS transit tracking, and One-Stop Border Post customs clearance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadTrades}
              className="p-2.5 bg-[#1e1e1e] hover:bg-[#282828] text-[#F5F5F5] border border-[#333] rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Refresh trade records"
            >
              <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowNewTradeModal(true)}
              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Cross-Border Trade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Trade Contracts List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#D4AF37]" /> Active Trade Contracts ({filteredTrades.length})
              </h2>
              <span className="text-xs text-[#A0A0A0]">{trades.length} Total</span>
            </div>

            {/* Filter & Search */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#777]" />
                <input
                  type="text"
                  placeholder="Search contract, crop, partner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {['ALL', 'EAST_AFRICAN_COMMUNITY', 'CONTINENTAL_AFCFTA'].map((scope) => (
                  <button
                    key={scope}
                    onClick={() => setFilterScope(scope)}
                    className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                      filterScope === scope
                        ? 'bg-[#D4AF37] text-[#050505] font-semibold'
                        : 'bg-[#1a1a1a] text-[#A0A0A0] hover:text-[#F5F5F5]'
                    }`}
                  >
                    {scope === 'ALL' ? 'All Scopes' : scope === 'EAST_AFRICAN_COMMUNITY' ? 'EAC Trade' : 'AfCFTA'}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredTrades.map((t) => {
                const isSelected = selectedTrade?.id === t.id;
                const stageIdx = ALL_15_STAGES.findIndex((s) => s.stage === t.currentStage) + 1;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrade(t)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1f1a0e] border-[#D4AF37] shadow-md shadow-[#D4AF37]/10'
                        : 'bg-[#181818] border-[#2a2a2a] hover:border-[#444]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-[#D4AF37] font-semibold">{t.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#222] text-[#A0A0A0]">
                        Stage {stageIdx}/15
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#F5F5F5] truncate">{t.commodityName}</div>
                    <div className="flex items-center justify-between text-xs text-[#A0A0A0] mt-1.5">
                      <span className="flex items-center gap-1">
                        {t.originCountry} <ArrowRight className="w-3 h-3 text-[#D4AF37]" /> {t.destinationCountry}
                      </span>
                      <span className="font-semibold text-[#F5F5F5]">{t.volumeMetricTonnes} MT</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-[#262626]">
                      <span className="text-[11px] text-[#A0A0A0]">{t.borderPost}</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        ${(t.totalValueUsd || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed 15-Stage Workflow & Documents */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTrade ? (
            <>
              {/* Selected Trade Overview Card */}
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#222]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs px-2.5 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 rounded">
                        {selectedTrade.id}
                      </span>
                      <span className="text-xs text-[#A0A0A0] font-mono">Contract: {selectedTrade.contractNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#1e293b] text-blue-300 font-medium">
                        Incoterm: {selectedTrade.incoterm}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
                      {selectedTrade.volumeMetricTonnes} MT {selectedTrade.commodityName}
                    </h2>
                    <p className="text-xs text-[#A0A0A0] mt-0.5 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{selectedTrade.exporterName}</span>
                      <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                      <span>{selectedTrade.importerName}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs text-[#A0A0A0]">Total Contract Value</span>
                    <span className="text-2xl font-bold text-[#D4AF37] font-mono">
                      ${(selectedTrade.totalValueUsd || 0).toLocaleString()}{' '}
                      <span className="text-xs text-[#A0A0A0]">USD</span>
                    </span>
                    <span className="text-[11px] text-[#A0A0A0] font-mono">
                      ≈ {(selectedTrade.settlementAmountLocal || (selectedTrade.totalValueUsd || 0) * 3750).toLocaleString()} UGX
                    </span>
                  </div>
                </div>

                {/* Quick Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="p-2.5 bg-[#181818] border border-[#262626] rounded-lg">
                    <span className="text-[#A0A0A0] block">Corridor & Route</span>
                    <span className="font-semibold text-[#F5F5F5] flex items-center gap-1 mt-0.5">
                      <Truck className="w-3 h-3 text-[#D4AF37]" /> {selectedTrade.borderPost}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-[#262626] rounded-lg">
                    <span className="text-[#A0A0A0] block">Escrow Protection</span>
                    <span className={`font-semibold flex items-center gap-1 mt-0.5 ${selectedTrade.escrowLocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <ShieldCheck className="w-3 h-3" />
                      {selectedTrade.escrowLocked ? 'Locked in Escrow' : 'Pending Funding'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-[#262626] rounded-lg">
                    <span className="text-[#A0A0A0] block">SPS Phytosanitary</span>
                    <span className={`font-semibold flex items-center gap-1 mt-0.5 ${selectedTrade.qualityInspected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <CheckCircle className="w-3 h-3" />
                      {selectedTrade.qualityInspected ? 'MAAIF Inspected' : 'Pending Testing'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#181818] border border-[#262626] rounded-lg">
                    <span className="text-[#A0A0A0] block">Customs Clearance</span>
                    <span className={`font-semibold flex items-center gap-1 mt-0.5 ${selectedTrade.customsCleared ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <Anchor className="w-3 h-3" />
                      {selectedTrade.customsCleared ? 'OSBP Cleared' : 'In Transit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 15-Stage Execution Stepper */}
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D4AF37]" /> 15-Stage Trade Progression Track
                    </h3>
                    <p className="text-xs text-[#A0A0A0]">
                      Current Stage: <span className="font-semibold text-[#D4AF37]">{ALL_15_STAGES[currentStageIndex]?.label}</span> ({currentStageIndex + 1}/15)
                    </p>
                  </div>

                  {currentStageIndex < ALL_15_STAGES.length - 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAdvanceStage}
                        disabled={advancing}
                        className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
                      >
                        {advancing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        Advance to Stage {currentStageIndex + 2}
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden mb-6">
                  <div
                    className="bg-gradient-to-r from-[#D4AF37] to-amber-300 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${((currentStageIndex + 1) / ALL_15_STAGES.length) * 100}%` }}
                  />
                </div>

                {/* Stepper Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {ALL_15_STAGES.map((s, idx) => {
                    const isPassed = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const isPending = idx > currentStageIndex;

                    return (
                      <div
                        key={s.stage}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          isCurrent
                            ? 'bg-[#241d0f] border-[#D4AF37] text-[#F5F5F5] ring-1 ring-[#D4AF37]/50'
                            : isPassed
                            ? 'bg-[#151c14] border-emerald-800/40 text-[#c8d6c5]'
                            : 'bg-[#161616] border-[#222] text-[#666]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold ${isCurrent ? 'text-[#D4AF37]' : isPassed ? 'text-emerald-400' : 'text-[#888]'}`}>
                            {s.label}
                          </span>
                          {isPassed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                          {isCurrent && <Clock className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />}
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#A0A0A0]">{s.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trade Documents Repository */}
              <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D4AF37]" /> Official Cross-Border Trade Documents
                    </h3>
                    <p className="text-xs text-[#A0A0A0]">
                      Statutory EAC Customs, MAAIF Phytosanitary, and Carrier Consignment documentation.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewDocModal(true)}
                    className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#282828] text-[#F5F5F5] border border-[#333] rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Add Document
                  </button>
                </div>

                <div className="space-y-3">
                  {(selectedTrade.requiredDocuments || selectedTrade.documents || []).map((doc) => {
                    const isValid = doc.verificationStatus === 'VERIFIED_VALID';
                    const isRejected = doc.verificationStatus === 'REJECTED_DEFECTIVE';
                    const isPending = doc.verificationStatus === 'PENDING' || doc.verificationStatus === 'SUBMITTED';

                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 bg-[#181818] border border-[#262626] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#F5F5F5]">
                              {(doc.documentType || doc.docType || 'DOCUMENT').replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isValid
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                                  : isRejected
                                  ? 'bg-red-950/60 text-red-400 border border-red-800'
                                  : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {doc.verificationStatus}
                            </span>
                          </div>
                          <div className="text-[#A0A0A0] flex flex-wrap items-center gap-3 text-[11px]">
                            <span>Ref: <span className="font-mono text-[#F5F5F5]">{doc.documentNumber}</span></span>
                            <span>Authority: <span className="text-[#F5F5F5]">{doc.issuingAuthority}</span></span>
                            <span>Country: <span className="text-[#F5F5F5]">{doc.issuingCountry}</span></span>
                          </div>
                          {doc.checksumSha256 && (
                            <div className="text-[10px] text-[#666] font-mono truncate max-w-md">
                              SHA256: {doc.checksumSha256}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleDocumentStatus(doc.id, 'VERIFIED_VALID')}
                                className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleDocumentStatus(doc.id, 'REJECTED_DEFECTIVE')}
                                className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-700/50 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                          {isValid && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-12 text-center text-[#A0A0A0]">
              <Globe className="w-12 h-12 text-[#D4AF37] mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-semibold text-[#F5F5F5]">No Trade Selected</h3>
              <p className="text-xs text-[#888] mt-1">Select an active contract from the left or initiate a new cross-border trade.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Trade Modal */}
      {showNewTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#333] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#D4AF37]" /> Initiate Regional Trade Contract
              </h3>
              <button
                onClick={() => setShowNewTradeModal(false)}
                className="text-[#888] hover:text-[#F5F5F5] text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrade} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Commodity Name</label>
                <input
                  type="text"
                  required
                  value={newCommodity}
                  onChange={(e) => setNewCommodity(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Trade Scope</label>
                  <select
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value as TradeScope)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="EAST_AFRICAN_COMMUNITY">East African Community (EAC)</option>
                    <option value="CONTINENTAL_AFCFTA">Continental AfCFTA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Commodity Type</label>
                  <select
                    value={newCommodityType}
                    onChange={(e) => setNewCommodityType(e.target.value as TradeCommodityType)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="GRAINS_CEREALS">Grains & Cereals</option>
                    <option value="OILSEEDS">Oilseeds & Edible Oils</option>
                    <option value="COFFEE_TEA">Coffee & Tea</option>
                    <option value="COTTON_TEXTILE">Cotton & Textiles</option>
                    <option value="HORTICULTURE_FRUITS">Horticulture</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Origin Country</label>
                  <select
                    value={newOriginCountry}
                    onChange={(e) => setNewOriginCountry(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Uganda">Uganda</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Destination Country</label>
                  <select
                    value={newDestCountry}
                    onChange={(e) => setNewDestCountry(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="South Sudan">South Sudan</option>
                    <option value="DR Congo">DR Congo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Volume (MT)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newVolume}
                    onChange={(e) => setNewVolume(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unit Price ($/MT)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Incoterm</label>
                  <select
                    value={newIncoterm}
                    onChange={(e) => setNewIncoterm(e.target.value as any)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="DAP">DAP (Delivered at Place)</option>
                    <option value="FOB">FOB (Free on Board)</option>
                    <option value="CIF">CIF (Cost Insurance Freight)</option>
                    <option value="EXW">EXW (Ex Works)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Border Post</label>
                  <select
                    value={newBorderPost}
                    onChange={(e) => setNewBorderPost(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Malaba OSBP">Malaba OSBP (UG / KE)</option>
                    <option value="Busia OSBP">Busia OSBP (UG / KE)</option>
                    <option value="Mutukula OSBP">Mutukula OSBP (UG / TZ)</option>
                    <option value="Katuna OSBP">Katuna OSBP (UG / RW)</option>
                    <option value="Elegu OSBP">Elegu OSBP (UG / SS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Corridor</label>
                  <select
                    value={newCorridor}
                    onChange={(e) => setNewCorridor(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="corridor_northern_01">Northern Economic Corridor</option>
                    <option value="corridor_central_02">Central Corridor Highway</option>
                    <option value="corridor_western_03">Western Albertine & Great Lakes</option>
                    <option value="corridor_great_north_04">Great North Corridor</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2a2a2a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTradeModal(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#333] text-[#A0A0A0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold rounded-lg shadow"
                >
                  Create & Issue Trade Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#161616] border border-[#333] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" /> Add Trade Document
              </h3>
              <button
                onClick={() => setShowNewDocModal(false)}
                className="text-[#888] hover:text-[#F5F5F5] text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as TradeDocumentType)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="COMMERCIAL_INVOICE">Commercial Invoice</option>
                  <option value="EAC_CERTIFICATE_OF_ORIGIN">EAC Certificate of Origin</option>
                  <option value="PHYTOSANITARY_CERTIFICATE">MAAIF Phytosanitary Certificate</option>
                  <option value="TRANSPORT_CONSIGNMENT_NOTE">Transport Consignment Note</option>
                  <option value="CUSTOMS_SINGLE_DECLARATION">Single Customs Territory Declaration</option>
                  <option value="CERTIFICATE_OF_ANALYSIS">Certificate of Quality Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Document Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. URA-SCT-2026-991"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Issuing Authority</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uganda Revenue Authority / MAAIF"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 border-t border-[#2a2a2a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewDocModal(false)}
                  className="px-3.5 py-1.5 bg-[#222] hover:bg-[#333] text-[#A0A0A0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#050505] font-semibold rounded-lg shadow"
                >
                  Upload & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
