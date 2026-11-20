/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V20.0 - Unified Economic Operations Hub (/operations-hub)
 * Connects Identity/Verification, 15-Category Marketplace, Harvest-to-Market,
 * 12-Stage Trade Execution, Logistics Delivery Evidence, Reconciliation,
 * Cooperative Pooling, Explainable Reputation, Regional FX/Units & Human-Confirmed AI Copilot.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Layers,
  Package,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V20CooperativePool,
  V20LogisticsShipment,
  V20PaymentObligation,
  V20SavedSearch,
  V20TradeRecord,
  V20TradeStage,
} from '../../types/index.ts';

type HubTab = 'MARKETPLACE' | 'TRADES_LOGISTICS' | 'RECONCILIATION' | 'COOPS_TRUST' | 'REGIONAL_AI';

interface Props {
  onNavigate?: (tab: string) => void;
}

function downloadTextBlob(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function stageTone(stage: string): string {
  if (['COMPLETED', 'RECONCILED', 'DELIVERY_CONFIRMED', 'CLOSED', 'VERIFIED'].includes(stage)) {
    return 'bg-emerald-950/60 border-emerald-700/70 text-emerald-300';
  }
  if (['DISPUTED', 'FAILED', 'CANCELLED', 'REJECTED', 'DAMAGED'].includes(stage)) {
    return 'bg-red-950/60 border-red-700/70 text-red-300';
  }
  return 'bg-amber-950/50 border-amber-700/70 text-amber-300';
}

const NEXT_STAGE_MAP: Partial<Record<V20TradeStage, V20TradeStage[]>> = {
  DISCOVERY: ['ENQUIRY', 'QUOTATION', 'CANCELLED'],
  ENQUIRY: ['QUOTATION', 'NEGOTIATION', 'REJECTED', 'CANCELLED'],
  QUOTATION: ['NEGOTIATION', 'OFFER_ACCEPTED', 'REJECTED'],
  NEGOTIATION: ['OFFER_ACCEPTED', 'QUOTATION', 'REJECTED'],
  OFFER_ACCEPTED: ['AGREEMENT_CREATED', 'CANCELLED'],
  AGREEMENT_CREATED: ['FULFILMENT_PLANNED', 'FULFILMENT_IN_PROGRESS', 'CANCELLED'],
  FULFILMENT_PLANNED: ['FULFILMENT_IN_PROGRESS', 'DELIVERY_EVIDENCE_SUBMITTED'],
  FULFILMENT_IN_PROGRESS: ['DELIVERY_EVIDENCE_SUBMITTED', 'DISPUTED'],
  DELIVERY_EVIDENCE_SUBMITTED: ['BUYER_CONFIRMATION', 'DISPUTED'],
  BUYER_CONFIRMATION: ['RECONCILIATION', 'DISPUTED'],
  RECONCILIATION: ['COMPLETED', 'DISPUTED'],
  DISPUTED: ['RECONCILIATION', 'CANCELLED'],
};

export const V20EconomicOperationsHub: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const [activeTab, setActiveTab] = useState<HubTab>('MARKETPLACE');
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Core state
  const [overview, setOverview] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; label: string; sector: string; defaultUnit: string }[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<V20SavedSearch[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [trades, setTrades] = useState<V20TradeRecord[]>([]);
  const [shipments, setShipments] = useState<V20LogisticsShipment[]>([]);
  const [obligations, setObligations] = useState<V20PaymentObligation[]>([]);
  const [obSummary, setObSummary] = useState<any>(null);
  const [pools, setPools] = useState<V20CooperativePool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('V20-POOL-ELGON-01');
  const [memberStatements, setMemberStatements] = useState<any[]>([]);
  const [statementsError, setStatementsError] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reputation, setReputation] = useState<any>(null);
  const [repParticipantId, setRepParticipantId] = useState('V17-PART-FARMER-01');

  // Marketplace Filters & Forms
  const [searchQ, setSearchQ] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [savedSearchLabel, setSavedSearchLabel] = useState('');

  // Publish Harvest Form
  const [harvestTitle, setHarvestTitle] = useState('');
  const [harvestCat, setHarvestCat] = useState('Coffee & Cash Crops');
  const [harvestDistrict, setHarvestDistrict] = useState(currentUser?.district || 'Mbale');
  const [harvestQty, setHarvestQty] = useState('250');
  const [harvestUnit, setHarvestUnit] = useState('KG');
  const [harvestPrice, setHarvestPrice] = useState('12000');
  const [harvestCropId, setHarvestCropId] = useState('');

  // Create Enquiry / Trade Form
  const [tradeTitle, setTradeTitle] = useState('');
  const [tradeCategory, setTradeCategory] = useState('Grains & Cereals');
  const [tradeQty, setTradeQty] = useState('20');
  const [tradeUnit, setTradeUnit] = useState('BAG_100KG');
  const [tradePrice, setTradePrice] = useState('145000');
  const [tradeCurrency, setTradeCurrency] = useState('UGX');
  const [tradeBuyerId, setTradeBuyerId] = useState('V17-PART-BUYER-01');
  const [tradeSellerId, setTradeSellerId] = useState('V17-PART-FARMER-01');

  // Shipment & Delivery Evidence Form
  const [shipTradeId, setShipTradeId] = useState('V20-TRD-ELGON-01');
  const [shipDestDistrict, setShipDestDistrict] = useState('Kampala');
  const [evShipmentId, setEvShipmentId] = useState('V20-SHP-ELGON-01');
  const [evRecipient, setEvRecipient] = useState('');
  const [evQtyRecv, setEvQtyRecv] = useState('500');
  const [evShortage, setEvShortage] = useState('0');
  const [evDamage, setEvDamage] = useState('Intact and dry');
  const [evLocation, setEvLocation] = useState('Kampala Receiving Bay');

  // Payment Reconciliation Form
  const [payObId, setPayObId] = useState('V20-POB-ELGON-01');
  const [payAmount, setPayAmount] = useState('6250000');
  const [payChannel, setPayChannel] = useState<'SANDBOX_MOMO' | 'SANDBOX_BANK' | 'MANUAL_RECEIPT_RECORD'>('SANDBOX_MOMO');
  const [payRef, setPayRef] = useState('');

  // Cooperative Pool Contribution & Dispute Form
  const [contribQty, setContribQty] = useState('120');
  const [contribFarmerName, setContribFarmerName] = useState(currentUser?.name || 'Sarah Namubiru');
  const [disputeTradeId, setDisputeTradeId] = useState('V20-TRD-ELGON-01');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeAmount, setDisputeAmount] = useState('250000');

  // Regional Converter & Checklist
  const [convMode, setConvMode] = useState<'FX' | 'UNIT'>('FX');
  const [convVal, setConvVal] = useState('100000');
  const [convFrom, setConvFrom] = useState('UGX');
  const [convTo, setConvTo] = useState('KES');
  const [convResult, setConvResult] = useState<any>(null);
  const [cbTradeId, setCbTradeId] = useState('V20-TRD-ELGON-01');
  const [cbDestCountry, setCbDestCountry] = useState('KE');
  const [cbChecklist, setCbChecklist] = useState<any>(null);

  // Controlled AI Copilot
  const [aiTask, setAiTask] = useState<'LISTING_DRAFT' | 'TRADE_SUMMARY' | 'CROSS_BORDER_CHECK'>('LISTING_DRAFT');
  const [aiPrompt, setAiPrompt] = useState('Freshly dried Arabica parchment coffee from Mbale, 300kg Grade AA');
  const [aiHumanConfirm, setAiHumanConfirm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role,
    tenantId: 'TEN-UG-ELGON-01',
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, mkt, recs, trd, shp, obs, pls, dsp, rep] = await Promise.all([
        ApiClient.v20GetOverview(actor),
        ApiClient.v20GetMarketplace({ q: searchQ, category: filterCategory, district: filterDistrict }, actor),
        ApiClient.v20GetRecommendations({ q: searchQ, category: filterCategory, district: filterDistrict }, actor),
        ApiClient.v20GetTrades(actor),
        ApiClient.v20GetShipments(actor),
        ApiClient.v20GetObligations(actor),
        ApiClient.v20GetCooperativePools(actor),
        ApiClient.v20GetDisputes(actor),
        ApiClient.v20GetReputation(repParticipantId, actor),
      ]);
      setOverview(ov);
      setCategories(Array.isArray(mkt?.categories) ? mkt.categories : []);
      setListings(Array.isArray(mkt?.listings) ? mkt.listings : []);
      setSavedSearches(Array.isArray(mkt?.savedSearches) ? mkt.savedSearches : []);
      setCrops(Array.isArray(mkt?.crops) ? mkt.crops : []);
      setRecommendations(Array.isArray(recs?.recommendations) ? recs.recommendations : []);
      setTrades(Array.isArray(trd?.trades) ? trd.trades : []);
      setShipments(Array.isArray(shp?.shipments) ? shp.shipments : []);
      setObligations(Array.isArray(obs?.obligations) ? obs.obligations : []);
      setObSummary(obs?.summary || null);
      setPools(Array.isArray(pls?.pools) ? pls.pools : []);
      setDisputes(Array.isArray(dsp?.disputes) ? dsp.disputes : []);
      setReputation(rep || null);
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Failed to load Unified Operations data.' });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role, searchQ, filterCategory, filterDistrict, repParticipantId]);

  const loadMemberStatements = useCallback(async (poolId: string) => {
    setStatementsError(null);
    try {
      const res = await ApiClient.v20GetMemberStatements(poolId, actor);
      setMemberStatements(Array.isArray(res?.statements) ? res.statements : []);
    } catch (err: any) {
      setMemberStatements([]);
      setStatementsError(err?.message || 'Unable to load member statements');
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (selectedPoolId) {
      loadMemberStatements(selectedPoolId);
    }
  }, [selectedPoolId, loadMemberStatements]);

  const handleSaveSearch = async () => {
    try {
      await ApiClient.v20SaveSearch(
        {
          label: savedSearchLabel || `${filterCategory || 'All'} (${filterDistrict || 'Regional'})`,
          category: filterCategory || undefined,
          district: filterDistrict || undefined,
          queryText: searchQ,
        },
        actor
      );
      setSavedSearchLabel('');
      setBanner({ kind: 'ok', text: 'Saved marketplace filter alert created.' });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Could not save search.' });
    }
  };

  const handlePublishHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.v20PublishHarvest(
        {
          title: harvestTitle,
          category: harvestCat,
          district: harvestDistrict,
          availableQty: Number(harvestQty),
          unitCode: harvestUnit,
          unitPrice: Number(harvestPrice),
          cropRecordId: harvestCropId || undefined,
          sellerParticipantId: 'V17-PART-FARMER-01',
        },
        actor
      );
      setHarvestTitle('');
      setBanner({ kind: 'ok', text: `Harvest published to Marketplace (${res.listing?.id}).` });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Failed to publish harvest.' });
    }
  };

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.v20CreateTrade(
        {
          title: tradeTitle || 'Commercial Supply Enquiry',
          category: tradeCategory,
          quantity: Number(tradeQty),
          unitCode: tradeUnit,
          unitPrice: Number(tradePrice),
          currency: tradeCurrency,
          buyerParticipantId: tradeBuyerId,
          sellerParticipantId: tradeSellerId,
          district: currentUser?.district || 'Mbale',
        },
        actor
      );
      setTradeTitle('');
      setBanner({ kind: 'ok', text: `Trade ${res.trade?.id} created at stage ${res.trade?.stage}.` });
      setActiveTab('TRADES_LOGISTICS');
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Trade creation failed.' });
    }
  };

  const handleTransitionTrade = async (tradeId: string, targetStage: V20TradeStage) => {
    try {
      await ApiClient.v20TransitionTrade(tradeId, { targetStage, note: `UI transition to ${targetStage}` }, actor);
      setBanner({ kind: 'ok', text: `Trade ${tradeId} advanced to ${targetStage}.` });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || `Transition to ${targetStage} blocked.` });
    }
  };

  const handleDownloadAgreement = async (tradeId: string) => {
    try {
      const res = await ApiClient.v20GetAgreementSummary(tradeId, actor);
      downloadTextBlob(res.downloadFilename || `ECONEX-Agreement-${tradeId}.txt`, res.summaryText);
      setBanner({ kind: 'ok', text: `Downloaded ${res.downloadFilename} (SHA-256 ${String(res.sha256 || '').slice(0, 12)}...).` });
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Agreement summary unavailable at current stage.' });
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.v20CreateShipment(
        { tradeId: shipTradeId, destinationDistrict: shipDestDistrict, agreedFreightAmount: 220000 },
        actor
      );
      setBanner({ kind: 'ok', text: `Shipment ${res.shipment?.id} booked for trade ${shipTradeId}.` });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Shipment booking failed.' });
    }
  };

  const handleTransitionShipment = async (shipmentId: string, targetStatus: string) => {
    try {
      await ApiClient.v20TransitionShipment(shipmentId, { targetStatus }, actor);
      setBanner({ kind: 'ok', text: `Shipment ${shipmentId} moved to ${targetStatus}.` });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Shipment transition failed.' });
    }
  };

  const handleSubmitDeliveryEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.v20SubmitDeliveryEvidence(
        evShipmentId,
        {
          recipientName: evRecipient || currentUser?.name || 'Receiving Clerk',
          quantityReceived: Number(evQtyRecv),
          shortageQty: Number(evShortage || 0),
          damageNotes: evDamage,
          consentedLocation: evLocation,
        },
        actor
      );
      setBanner({
        kind: 'ok',
        text: `Delivery evidence recorded for ${evShipmentId}; linked trade ${res.trade?.id || ''} synced to ${res.trade?.stage || ''}.`,
      });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Delivery evidence submission failed.' });
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.v20RecordObligationPayment(
        payObId,
        {
          amount: Number(payAmount),
          paymentChannel: payChannel,
          receiptRef: payRef || `SBX-RCPT-${Date.now().toString(36).toUpperCase()}`,
        },
        actor
      );
      setPayRef('');
      setBanner({
        kind: 'ok',
        text: `Payment recorded against ${payObId}. Status: ${res.obligation?.status} (Journal ${res.obligation?.ledgerEntryId}).`,
      });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Reconciliation payment failed.' });
    }
  };

  const handleContributePool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.v20ContributeToPool(
        selectedPoolId,
        {
          farmerParticipantId: 'V17-PART-FARMER-01',
          farmerName: contribFarmerName,
          qtyContributed: Number(contribQty),
        },
        actor
      );
      setBanner({ kind: 'ok', text: `Contributed ${contribQty} units to pool ${selectedPoolId}.` });
      loadAllData();
      loadMemberStatements(selectedPoolId);
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Pool contribution failed.' });
    }
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await ApiClient.v20OpenDispute(
        { tradeId: disputeTradeId, reason: disputeReason, claimedAmount: Number(disputeAmount) },
        actor
      );
      setDisputeReason('');
      setBanner({ kind: 'ok', text: `Dispute ${res.dispute?.id} opened and linked trade paused at DISPUTED.` });
      loadAllData();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Failed to open dispute.' });
    }
  };

  const handleConvertRegional = async () => {
    try {
      const res = await ApiClient.v20ConvertRegional(
        convMode === 'FX'
          ? { mode: 'FX', amount: Number(convVal), fromCurrency: convFrom, toCurrency: convTo }
          : { mode: 'UNIT', quantity: Number(convVal), fromUnit: convFrom, toUnit: convTo },
        actor
      );
      setConvResult(res);
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Conversion failed.' });
    }
  };

  const handleFetchCrossBorder = async () => {
    try {
      const res = await ApiClient.v20GetCrossBorderChecklist(cbTradeId, cbDestCountry, actor);
      setCbChecklist(res);
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'Checklist lookup failed.' });
    }
  };

  const handleRequestAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const res = await ApiClient.v20RequestAiAssist(
        { taskType: aiTask, prompt: aiPrompt, humanConfirmedAction: aiHumanConfirm },
        actor
      );
      setAiResponse(res);
    } catch (err: any) {
      setBanner({ kind: 'err', text: err?.message || 'AI request blocked or failed.' });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiDraftToHarvest = () => {
    if (!aiHumanConfirm) {
      setBanner({ kind: 'err', text: 'Check the human confirmation box before applying an AI draft.' });
      return;
    }
    const d = aiResponse?.draft || {};
    if (d.title) setHarvestTitle(d.title);
    if (d.category) setHarvestCat(d.category);
    if (d.suggestedUnit) setHarvestUnit(d.suggestedUnit);
    setActiveTab('MARKETPLACE');
    setBanner({ kind: 'ok', text: 'AI listing draft populated into Harvest form for your manual review & submission.' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Top Metrics Strip */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#D4AF37]">
              ECONEX V20.0 · SCHEMA {overview?.schemaVersion || 18}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#A0A0A0]">
              Role: {role}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
            Unified Economic Operations Hub
          </h1>
          <p className="text-xs text-[#A0A0A0]">
            Connected discovery, harvest-to-market, 12-stage trade agreements, logistics delivery evidence, cooperative pooling, and sandbox financial reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === 'PLATFORM_ADMIN' && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('v20-pilots')}
              className="px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
            >
              Open Pilot Control Desk
            </button>
          )}
          <button
            type="button"
            onClick={loadAllData}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#e5bf43] text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Hub'}</span>
          </button>
        </div>
      </div>

      {banner && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            banner.kind === 'ok'
              ? 'bg-emerald-950/40 border-emerald-700/70 text-emerald-200'
              : 'bg-red-950/40 border-red-700/70 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.kind === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{banner.text}</span>
          </div>
          <button type="button" onClick={() => setBanner(null)} className="text-[#A0A0A0] hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Flat Overview KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active Listings', val: overview?.counts?.marketplaceListings ?? listings.length },
          { label: 'Unified Trades', val: overview?.counts?.unifiedTrades ?? trades.length },
          { label: 'Shipments', val: overview?.counts?.logisticsShipments ?? shipments.length },
          { label: 'Reconciled', val: overview?.counts?.reconciledObligations ?? 0 },
          { label: 'Coop Pools', val: overview?.counts?.cooperativePools ?? pools.length },
          { label: 'Offline Conflicts', val: overview?.counts?.unresolvedOfflineConflicts ?? 0 },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#121212] border border-[#27272a] rounded-xl p-3.5">
            <div className="text-[11px] text-[#A0A0A0]">{kpi.label}</div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#F5F5F5] mt-1">{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3" role="tablist">
        {(
          [
            { id: 'MARKETPLACE', label: '1. Marketplace & Harvest', icon: ShoppingBag },
            { id: 'TRADES_LOGISTICS', label: '2. Trades & Logistics', icon: Truck },
            { id: 'RECONCILIATION', label: '3. Reconciliation', icon: Wallet },
            { id: 'COOPS_TRUST', label: '4. Cooperatives & Trust', icon: Users },
            { id: 'REGIONAL_AI', label: '5. Regional & AI Copilot', icon: Globe },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37]'
                  : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]/60'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MARKETPLACE & HARVEST-TO-MARKET */}
      {activeTab === 'MARKETPLACE' && (
        <div className="space-y-6">
          {/* Search & 15-Category Filter Bar */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-[#71717a]" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search coffee, maize, haulage, machinery..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              >
                <option value="">All {categories.length || 15} Economic Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                placeholder="Filter district (e.g., Mbale, Kampala)"
                className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <div className="flex gap-2">
                <input
                  value={savedSearchLabel}
                  onChange={(e) => setSavedSearchLabel(e.target.value)}
                  placeholder="Saved filter label"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <button
                  type="button"
                  onClick={handleSaveSearch}
                  className="px-3 py-2 rounded-lg bg-[#18181b] border border-[#D4AF37] text-xs text-[#D4AF37] font-semibold cursor-pointer shrink-0"
                >
                  Save Search
                </button>
              </div>
            </div>

            {savedSearches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-[#71717a]">Saved Alerts:</span>
                {savedSearches.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchQ(s.queryText || '');
                      setFilterCategory(s.category || '');
                      setFilterDistrict(s.district || '');
                    }}
                    className="px-2 py-0.5 rounded bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[11px] text-[#C0C0C0] cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Listings & Explainable Recommendations */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                    <Sparkles size={15} className="text-[#D4AF37]" />
                    Explainable Marketplace Recommendations
                  </h2>
                  <span className="text-[11px] font-mono text-[#71717a]">{recommendations.length} ranked</span>
                </div>

                {recommendations.length === 0 ? (
                  <div className="text-xs text-[#71717a] py-4 text-center">No recommendations match the current filter.</div>
                ) : (
                  <div className="divide-y divide-[#27272a]">
                    {recommendations.slice(0, 6).map((rec) => (
                      <div key={rec.listing.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-[#F5F5F5]">{rec.listing.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#27272a] bg-[#09090b] text-[#D4AF37]">
                              Score {rec.matchScore}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stageTone(rec.sellerVerificationState)}`}>
                              {rec.sellerVerificationState}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#A0A0A0]">
                            {rec.listing.category} · {rec.listing.district}, {rec.listing.countryCode} ·{' '}
                            <span className="font-mono tabular-nums text-[#F5F5F5]">
                              {Number(rec.listing.unitPrice).toLocaleString()} {rec.listing.currency}/{rec.listing.unitCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#71717a]">
                            Factors: {(rec.explanationFactors || []).join(' · ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTradeTitle(`Enquiry: ${rec.listing.title}`);
                            setTradeCategory(rec.listing.category);
                            setTradeUnit(rec.listing.unitCode);
                            setTradePrice(String(rec.listing.unitPrice));
                            setTradeCurrency(rec.listing.currency);
                            setTradeSellerId(rec.listing.sellerParticipantId);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs shrink-0 cursor-pointer"
                        >
                          Prefill Trade Enquiry
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Publish Harvest + Create Trade Enquiry */}
            <div className="space-y-4">
              <form onSubmit={handlePublishHarvest} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Sprout size={15} className="text-emerald-400" />
                  Publish Farm Harvest to Marketplace
                </h2>
                <input
                  required
                  value={harvestTitle}
                  onChange={(e) => setHarvestTitle(e.target.value)}
                  placeholder="Harvest lot title (e.g., Grade AA Washed Coffee)"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                {crops.length > 0 && (
                  <select
                    value={harvestCropId}
                    onChange={(e) => setHarvestCropId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                  >
                    <option value="">Optional: Link existing farm crop record</option>
                    {crops.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.cropName} ({c.variety || c.growthStage})
                      </option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={harvestCat}
                    onChange={(e) => setHarvestCat(e.target.value)}
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={harvestDistrict}
                    onChange={(e) => setHarvestDistrict(e.target.value)}
                    placeholder="District"
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="1"
                    value={harvestQty}
                    onChange={(e) => setHarvestQty(e.target.value)}
                    placeholder="Qty"
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                  <select
                    value={harvestUnit}
                    onChange={(e) => setHarvestUnit(e.target.value)}
                    className="px-2 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                  >
                    {['KG', 'BAG_50KG', 'BAG_100KG', 'TONNE', 'CRATE', 'LITRE'].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={harvestPrice}
                    onChange={(e) => setHarvestPrice(e.target.value)}
                    placeholder="UGX/unit"
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Publish Harvest Listing
                </button>
              </form>

              <form onSubmit={handleCreateTrade} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Layers size={15} className="text-[#D4AF37]" />
                  Raise Commercial Trade Enquiry
                </h2>
                <input
                  required
                  value={tradeTitle}
                  onChange={(e) => setTradeTitle(e.target.value)}
                  placeholder="Trade item or service description"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="1"
                    value={tradeQty}
                    onChange={(e) => setTradeQty(e.target.value)}
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                  <input
                    type="number"
                    min="1"
                    value={tradePrice}
                    onChange={(e) => setTradePrice(e.target.value)}
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                  <select
                    value={tradeCurrency}
                    onChange={(e) => setTradeCurrency(e.target.value)}
                    className="px-2 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                  >
                    {['UGX', 'KES', 'TZS', 'RWF', 'USD'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <input
                    value={tradeBuyerId}
                    onChange={(e) => setTradeBuyerId(e.target.value)}
                    placeholder="Buyer ID"
                    className="px-2.5 py-1.5 rounded-lg bg-[#09090b] border border-[#27272a] font-mono text-[#F5F5F5]"
                  />
                  <input
                    value={tradeSellerId}
                    onChange={(e) => setTradeSellerId(e.target.value)}
                    placeholder="Seller ID"
                    className="px-2.5 py-1.5 rounded-lg bg-[#09090b] border border-[#27272a] font-mono text-[#F5F5F5]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-xs font-semibold cursor-pointer"
                >
                  Submit Enquiry to Trade Engine
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRADES & LOGISTICS */}
      {activeTab === 'TRADES_LOGISTICS' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <FileText size={15} className="text-[#D4AF37]" />
                Unified Commercial Trade Execution (12 Core Stages)
              </h2>
              <span className="text-[11px] font-mono text-[#71717a]">{trades.length} active record(s)</span>
            </div>

            {trades.length === 0 ? (
              <div className="text-xs text-[#71717a] py-6 text-center">No commercial trades recorded yet. Raise an enquiry from Marketplace.</div>
            ) : (
              <div className="divide-y divide-[#27272a]">
                {trades.map((tr) => {
                  const nextStages = NEXT_STAGE_MAP[tr.stage] || [];
                  return (
                    <div key={tr.id} className="py-3.5 space-y-2">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#D4AF37]">{tr.id}</span>
                            <span className="text-xs font-semibold text-[#F5F5F5]">{tr.title}</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stageTone(tr.stage)}`}>
                              {tr.stage}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#A0A0A0] font-mono tabular-nums">
                            {tr.quantity} {tr.unitCode} · {tr.totalAmount.toLocaleString()} {tr.currency} (v{tr.version}) ·{' '}
                            {tr.buyerParticipantId} ↔ {tr.sellerParticipantId}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {tr.agreementSummaryText && (
                            <button
                              type="button"
                              onClick={() => handleDownloadAgreement(tr.id)}
                              className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[11px] text-[#D4AF37] flex items-center gap-1 cursor-pointer"
                            >
                              <Download size={12} /> Agreement .txt
                            </button>
                          )}
                          {nextStages.slice(0, 3).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleTransitionTrade(tr.id, st)}
                              className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[11px] text-[#F5F5F5] cursor-pointer"
                            >
                              → {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Logistics Shipments + Delivery Evidence */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Truck size={15} className="text-[#D4AF37]" />
                  Logistics Fulfilment & Shipment State
                </h2>
                <span className="text-[11px] font-mono text-[#71717a]">{shipments.length} shipments</span>
              </div>
              <div className="divide-y divide-[#27272a]">
                {shipments.map((shp) => (
                  <div key={shp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#F5F5F5]">{shp.id}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stageTone(shp.status)}`}>
                          {shp.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A0A0A0]">
                        Trade: <span className="font-mono">{shp.tradeId}</span> · {shp.originDistrict} → {shp.destinationDistrict} ({shp.corridorCode})
                      </div>
                      {shp.deliveryEvidence && (
                        <div className="text-[11px] text-emerald-300">
                          POD: {shp.deliveryEvidence.recipientName} · Received {shp.deliveryEvidence.quantityReceived} (Shortage {shp.deliveryEvidence.shortageQty})
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {shp.status === 'REQUESTED' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionShipment(shp.id, 'ASSIGNED')}
                          className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-[11px] text-[#F5F5F5] cursor-pointer"
                        >
                          Assign Carrier
                        </button>
                      )}
                      {shp.status === 'ASSIGNED' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionShipment(shp.id, 'IN_TRANSIT')}
                          className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-[11px] text-[#F5F5F5] cursor-pointer"
                        >
                          Mark In Transit
                        </button>
                      )}
                      {shp.status === 'IN_TRANSIT' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionShipment(shp.id, 'ARRIVED')}
                          className="px-2.5 py-1 rounded bg-[#18181b] border border-[#27272a] text-[11px] text-[#F5F5F5] cursor-pointer"
                        >
                          Mark Arrived
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <form onSubmit={handleCreateShipment} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">Book Transport Shipment</h3>
                <select
                  value={shipTradeId}
                  onChange={(e) => setShipTradeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                >
                  {trades.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} ({t.stage})
                    </option>
                  ))}
                </select>
                <input
                  value={shipDestDistrict}
                  onChange={(e) => setShipDestDistrict(e.target.value)}
                  placeholder="Destination district"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <button type="submit" className="w-full py-2 rounded-lg bg-[#18181b] border border-[#D4AF37] text-xs font-semibold text-[#D4AF37] cursor-pointer">
                  Book Shipment
                </button>
              </form>

              <form onSubmit={handleSubmitDeliveryEvidence} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-1.5">
                  <Package size={14} className="text-[#D4AF37]" /> Submit Delivery Evidence
                </h3>
                <select
                  value={evShipmentId}
                  onChange={(e) => setEvShipmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} ({s.status})
                    </option>
                  ))}
                </select>
                <input
                  required
                  value={evRecipient}
                  onChange={(e) => setEvRecipient(e.target.value)}
                  placeholder="Recipient full name"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={evQtyRecv}
                    onChange={(e) => setEvQtyRecv(e.target.value)}
                    placeholder="Qty received"
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                  <input
                    type="number"
                    min="0"
                    value={evShortage}
                    onChange={(e) => setEvShortage(e.target.value)}
                    placeholder="Shortage"
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                </div>
                <input
                  value={evLocation}
                  onChange={(e) => setEvLocation(e.target.value)}
                  placeholder="Consented handoff location"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <input
                  value={evDamage}
                  onChange={(e) => setEvDamage(e.target.value)}
                  placeholder="Condition / damage notes"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <button type="submit" className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer">
                  Confirm Delivery Evidence
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECONCILIATION */}
      {activeTab === 'RECONCILIATION' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/60 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong>Operational Boundary Notice:</strong>{' '}
              {obSummary?.sandboxDisclaimer ||
                'Reconciliation obligations reflect sandbox/simulated or manual receipt coordination ONLY. ECONEX is NOT a licensed bank or PSP; live Mobile Money/Bank settlement awaits Gate 10 & Gate 24 clearance.'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0]">Total Expected (UGX)</div>
              <div className="text-lg font-bold font-mono tabular-nums text-[#F5F5F5] mt-1">
                {Number(obSummary?.totalExpectedUgx || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0]">Total Received (UGX)</div>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1">
                {Number(obSummary?.totalReceivedUgx || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0]">Outstanding (UGX)</div>
              <div className="text-lg font-bold font-mono tabular-nums text-amber-400 mt-1">
                {Number(obSummary?.outstandingUgx || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4">
              <div className="text-[11px] text-[#A0A0A0]">Ledger Balanced</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {overview?.ledgerIntegrity?.journalBalanced ? 'TRUE' : 'CHECK'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 overflow-x-auto">
              <h2 className="text-sm font-bold text-[#F5F5F5]">Payment Obligations & Reconciliation Ledger</h2>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#27272a] text-[#71717a] text-[11px]">
                    <th className="py-2 pr-3">Obligation / Trade</th>
                    <th className="py-2 pr-3 text-right">Expected</th>
                    <th className="py-2 pr-3 text-right">Received</th>
                    <th className="py-2 pr-3 text-right">Variance</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Journal Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {obligations.map((ob) => (
                    <tr key={ob.id}>
                      <td className="py-2.5 pr-3">
                        <div className="font-mono font-semibold text-[#F5F5F5]">{ob.id}</div>
                        <div className="text-[10px] font-mono text-[#71717a]">{ob.tradeId}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                        {ob.expectedAmount.toLocaleString()} {ob.currency}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-emerald-400">
                        {ob.receivedAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-amber-300">
                        {ob.varianceAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stageTone(ob.status)}`}>
                          {ob.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-[#A0A0A0]">
                        {ob.ledgerEntryId || 'PENDING'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleRecordPayment} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#F5F5F5]">Record Sandbox / Manual Payment</h2>
              <select
                value={payObId}
                onChange={(e) => setPayObId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
              >
                {obligations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} ({o.outstandingAmount.toLocaleString()} {o.currency} due)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Amount received"
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
              />
              <select
                value={payChannel}
                onChange={(e) => setPayChannel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              >
                <option value="SANDBOX_MOMO">Sandbox Mobile Money (MTN/Airtel Sim)</option>
                <option value="SANDBOX_BANK">Sandbox Bank Transfer</option>
                <option value="MANUAL_RECEIPT_RECORD">Manual Verified Receipt Reference</option>
              </select>
              <input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Receipt reference (optional auto)"
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
              />
              <button type="submit" className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer">
                Post Double-Entry Reconciliation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: COOPERATIVES & TRUST */}
      {activeTab === 'COOPS_TRUST' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#F5F5F5]">Cooperative Collective Supply Pools</h2>
                <span className="text-[11px] font-mono text-[#71717a]">{pools.length} pool(s)</span>
              </div>

              <div className="divide-y divide-[#27272a]">
                {pools.map((p) => (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F5]">{p.title}</div>
                      <div className="text-[11px] text-[#A0A0A0] font-mono tabular-nums">
                        {p.id} · Total Aggregated: {p.totalQty.toLocaleString()} {p.unitCode} · Target {p.targetUnitPrice.toLocaleString()} {p.currency}/{p.unitCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPoolId(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] cursor-pointer"
                    >
                      Inspect Member Statements
                    </button>
                  </div>
                ))}
              </div>

              {/* Member-Isolated Statements */}
              <div className="pt-3 border-t border-[#27272a] space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Member-Isolated Distribution Statements ({selectedPoolId})
                </h3>
                {statementsError ? (
                  <div className="text-xs text-red-400">{statementsError}</div>
                ) : memberStatements.length === 0 ? (
                  <div className="text-xs text-[#71717a]">No individual member statements visible for the active account.</div>
                ) : (
                  <div className="divide-y divide-[#27272a]">
                    {memberStatements.map((st: any) => (
                      <div key={st.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-[#F5F5F5]">{st.farmerName}</span>{' '}
                          <span className="font-mono text-[10px] text-[#71717a]">({st.farmerParticipantId})</span>
                        </div>
                        <div className="font-mono tabular-nums text-emerald-400">
                          {st.qtyContributed} units ({Math.round(st.shareRatio * 100)}%) → Net {st.netPayableAmount.toLocaleString()} {st.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleContributePool} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 h-fit">
              <h2 className="text-sm font-bold text-[#F5F5F5]">Contribute Harvest to Pool</h2>
              <input
                value={contribFarmerName}
                onChange={(e) => setContribFarmerName(e.target.value)}
                placeholder="Member name"
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
              <input
                type="number"
                min="1"
                value={contribQty}
                onChange={(e) => setContribQty(e.target.value)}
                placeholder="Quantity contributed"
                className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
              />
              <button type="submit" className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer">
                Add Member Contribution
              </button>
            </form>
          </div>

          {/* Explainable Reputation & Disputes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  Explainable Operational Reputation
                </h2>
                <select
                  value={repParticipantId}
                  onChange={(e) => setRepParticipantId(e.target.value)}
                  className="px-2.5 py-1 rounded bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                >
                  <option value="V17-PART-FARMER-01">V17-PART-FARMER-01</option>
                  <option value="V17-PART-BUYER-01">V17-PART-BUYER-01</option>
                  <option value="V17-PART-COOP-01">V17-PART-COOP-01</option>
                </select>
              </div>
              {reputation && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold font-mono tabular-nums text-[#D4AF37]">{reputation.explainableScore}/100</span>
                    <span className="text-[#A0A0A0]">
                      Completed trades: <strong className="text-[#F5F5F5]">{reputation.completedTradesCount}</strong> · Valid complaints filed (0 penalty):{' '}
                      <strong className="text-emerald-400">{reputation.validComplaintsFiledWithoutPenalty}</strong>
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-[#A0A0A0]">
                    {(reputation.explanationFactors || []).map((f: string, idx: number) => (
                      <li key={idx}>• {f}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-[#71717a]">{reputation.disclaimer}</p>
                </div>
              )}
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <Scale size={15} className="text-amber-400" />
                Dispute Case Management ({disputes.length} cases)
              </h2>
              <form onSubmit={handleOpenDispute} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={disputeTradeId}
                    onChange={(e) => setDisputeTradeId(e.target.value)}
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  >
                    {trades.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={disputeAmount}
                    onChange={(e) => setDisputeAmount(e.target.value)}
                    placeholder="Claimed amount"
                    className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                  />
                </div>
                <input
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Evidence-backed dispute reason (e.g., weight shortage on receipt)"
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-red-900/70 border border-red-700 text-xs font-semibold text-red-100 cursor-pointer">
                  Open Trade Dispute
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REGIONAL & CONTROLLED AI COPILOT */}
      {activeTab === 'REGIONAL_AI' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* FX & Unit Converter */}
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <Globe size={15} className="text-[#D4AF37]" />
                Multi-Currency & Measurement Unit Converter
              </h2>
              <div className="grid grid-cols-4 gap-2">
                <select
                  value={convMode}
                  onChange={(e) => {
                    const m = e.target.value as 'FX' | 'UNIT';
                    setConvMode(m);
                    setConvFrom(m === 'FX' ? 'UGX' : 'BAG_100KG');
                    setConvTo(m === 'FX' ? 'KES' : 'KG');
                    setConvResult(null);
                  }}
                  className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                >
                  <option value="FX">Currency FX</option>
                  <option value="UNIT">Mass Unit</option>
                </select>
                <input
                  type="number"
                  value={convVal}
                  onChange={(e) => setConvVal(e.target.value)}
                  className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                />
                <input
                  value={convFrom}
                  onChange={(e) => setConvFrom(e.target.value)}
                  placeholder="From"
                  className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                />
                <input
                  value={convTo}
                  onChange={(e) => setConvTo(e.target.value)}
                  placeholder="To"
                  className="px-2.5 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                />
              </div>
              <button
                type="button"
                onClick={handleConvertRegional}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
              >
                Convert Value
              </button>
              {convResult && (
                <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-emerald-300">
                  {convMode === 'FX'
                    ? `${convResult.originalAmount} ${convResult.fromCurrency} = ${convResult.convertedAmount} ${convResult.toCurrency} (${convResult.rateSource})`
                    : `${convResult.originalQty} ${convResult.fromUnit} = ${convResult.convertedQty} ${convResult.toUnit} (${convResult.kgEquivalent} KG)`}
                </div>
              )}
            </div>

            {/* Cross-Border Readiness Checklist */}
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-[#F5F5F5]">Cross-Border Readiness Checklist (EAC / AfCFTA Aid)</h2>
              <div className="flex gap-2">
                <select
                  value={cbTradeId}
                  onChange={(e) => setCbTradeId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs font-mono text-[#F5F5F5]"
                >
                  {trades.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id}
                    </option>
                  ))}
                </select>
                <select
                  value={cbDestCountry}
                  onChange={(e) => setCbDestCountry(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
                >
                  <option value="KE">Kenya (KE)</option>
                  <option value="TZ">Tanzania (TZ)</option>
                  <option value="RW">Rwanda (RW)</option>
                  <option value="UG">Uganda (UG)</option>
                </select>
                <button
                  type="button"
                  onClick={handleFetchCrossBorder}
                  className="px-3 py-2 rounded-lg bg-[#18181b] border border-[#D4AF37] text-xs text-[#D4AF37] font-semibold cursor-pointer"
                >
                  Check
                </button>
              </div>
              {cbChecklist && (
                <div className="space-y-2 text-xs">
                  {(cbChecklist.checklist || []).map((item: any) => (
                    <div key={item.code} className="flex items-center justify-between p-2 rounded bg-[#09090b] border border-[#27272a]">
                      <span className="text-[#F5F5F5]">{item.label}</span>
                      <span className="font-mono text-[10px] text-[#D4AF37]">{item.status}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-amber-300">{cbChecklist.officialGovernmentDisclaimer}</p>
                </div>
              )}
            </div>
          </div>

          {/* Controlled AI Operational Copilot */}
          <form onSubmit={handleRequestAi} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3 h-fit">
            <h2 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
              <Bot size={15} className="text-[#D4AF37]" />
              Controlled AI Operational Copilot (Human-Confirmed)
            </h2>
            <p className="text-[11px] text-[#A0A0A0]">
              Drafts listings, trade briefs, and cross-border checklists. Never executes autonomous trades, payments, ledger posts, or verification approvals.
            </p>
            <select
              value={aiTask}
              onChange={(e) => setAiTask(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            >
              <option value="LISTING_DRAFT">Draft Marketplace Listing</option>
              <option value="TRADE_SUMMARY">Plain-Language Trade Brief</option>
              <option value="CROSS_BORDER_CHECK">Cross-Border Preparation Notes</option>
            </select>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <label className="flex items-start gap-2 text-xs text-[#C0C0C0] cursor-pointer">
              <input
                type="checkbox"
                checked={aiHumanConfirm}
                onChange={(e) => setAiHumanConfirm(e.target.checked)}
                className="mt-0.5 accent-[#D4AF37]"
              />
              <span>
                I confirm I will manually review any AI output before applying it. AI cannot autonomously submit or approve actions.
              </span>
            </label>
            <button
              type="submit"
              disabled={aiLoading}
              className="w-full py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? 'Generating Assistive Draft...' : 'Generate Assistive Draft'}
            </button>

            {aiResponse && (
              <div className="p-3 rounded-lg bg-[#09090b] border border-[#27272a] space-y-2 text-xs">
                <div className="font-mono text-[10px] text-[#D4AF37]">
                  Provider: {aiResponse.provider} · Human Confirmation Required: {String(aiResponse.requiresHumanConfirmation)}
                </div>
                <p className="text-[#F5F5F5] leading-relaxed">{aiResponse.summary}</p>
                {aiTask === 'LISTING_DRAFT' && aiResponse.draft && (
                  <button
                    type="button"
                    onClick={applyAiDraftToHarvest}
                    disabled={!aiHumanConfirm}
                    className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply Reviewed Draft to Harvest Form
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
