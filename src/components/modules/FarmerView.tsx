/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Farmer & Farm Management Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useOffline } from '../../context/OfflineContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Farm, FarmPlot, CropRecord, Order, MarketplaceListing } from '../../types/index.ts';
import {
  Sprout,
  MapPin,
  Calendar,
  Layers,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShoppingBag,
  TrendingUp,
  Droplets,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FarmerViewProps {
  onNavigateToMarketplace: () => void;
  onNavigateToOrders: () => void;
}

export const FarmerView: React.FC<FarmerViewProps> = ({
  onNavigateToMarketplace,
  onNavigateToOrders,
}) => {
  const { currentUser } = useAuth();
  const { isSimulatedOffline, queueOfflineAction } = useOffline();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showAddFarmModal, setShowAddFarmModal] = useState<boolean>(false);
  const [showAddPlotModal, setShowAddPlotModal] = useState<string | null>(null); // farmId
  const [showAddCropModal, setShowAddCropModal] = useState<boolean>(false);
  const [showCreateListingModal, setShowCreateListingModal] = useState<boolean>(false);

  // Form states
  const [farmForm, setFarmForm] = useState({
    farmName: '',
    district: currentUser?.district || 'Mbale',
    subCounty: '',
    village: '',
    totalAcres: 3.0,
    waterSource: 'Rain-fed & stream',
  });

  const [plotForm, setPlotForm] = useState({
    plotName: '',
    sizeAcres: 1.5,
    soilType: 'LOAM' as const,
    irrigationType: 'RAIN_FED' as const,
  });

  const [cropForm, setCropForm] = useState({
    farmId: '',
    plotId: '',
    cropName: 'Arabica Coffee',
    variety: 'SL14 High Altitude',
    category: 'COFFEE_CASH_CROPS' as const,
    growthStage: 'VEGETATIVE' as const,
    plantingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    estimatedYieldKg: 1500,
    notes: 'Mulched with dry banana leaves. Soil tested loam.',
  });

  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    category: 'GRAINS_CEREALS' as const,
    variety: '',
    quantityAvailable: 1000,
    unit: 'KG' as const,
    pricePerUnitUGX: 1400,
    minimumOrder: 100,
    district: currentUser?.district || 'Mbale',
    location: `${currentUser?.district || 'Mbale'} Central Depo`,
    organicCertified: false,
    qualityGrade: 'GRADE_1' as const,
  });

  const loadData = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [farmsData, cropsData, ordersData, listingsData] = await Promise.all([
        ApiClient.getFarms(currentUser.id),
        ApiClient.getCrops(currentUser.id),
        ApiClient.getOrders({ sellerId: currentUser.id }),
        ApiClient.getListings({ sellerId: currentUser.id }),
      ]);
      setFarms(farmsData);
      setCrops(cropsData);
      setIncomingOrders(ordersData);
      setListings(listingsData);
      if (farmsData.length > 0 && !cropForm.farmId) {
        setCropForm((prev) => ({ ...prev, farmId: farmsData[0].id }));
      }
    } catch (err: any) {
      console.error('Error fetching farmer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (isSimulatedOffline) {
      // Queue offline draft
      queueOfflineAction('FARM_CREATE', {
        ...farmForm,
        farmerId: currentUser.id,
      });
      setShowAddFarmModal(false);
      setFeedbackMsg({
        type: 'success',
        text: 'Farm draft saved offline! It will synchronize automatically when connection is restored.',
      });
      return;
    }

    try {
      await ApiClient.createFarm({
        ...farmForm,
        farmerId: currentUser.id,
      });
      setShowAddFarmModal(false);
      setFeedbackMsg({ type: 'success', text: `Farm '${farmForm.farmName}' registered successfully!` });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to create farm' });
    }
  };

  const handleCreatePlot = async (farmId: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createPlot(farmId, plotForm);
      setShowAddPlotModal(null);
      setFeedbackMsg({ type: 'success', text: `Plot '${plotForm.plotName}' added successfully!` });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to add plot' });
    }
  };

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (isSimulatedOffline) {
      queueOfflineAction('CROP_RECORD_CREATE', {
        ...cropForm,
        farmerId: currentUser.id,
      });
      setShowAddCropModal(false);
      setFeedbackMsg({
        type: 'success',
        text: 'Crop cultivation record saved offline in local storage!',
      });
      return;
    }

    try {
      await ApiClient.createCrop({
        ...cropForm,
        farmerId: currentUser.id,
      });
      setShowAddCropModal(false);
      setFeedbackMsg({ type: 'success', text: `Crop '${cropForm.cropName}' registered successfully!` });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to record crop' });
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (isSimulatedOffline) {
      queueOfflineAction('LISTING_DRAFT', {
        ...listingForm,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
      });
      setShowCreateListingModal(false);
      setFeedbackMsg({
        type: 'success',
        text: 'Produce listing saved as offline draft in local storage.',
      });
      return;
    }

    try {
      await ApiClient.createListing({
        ...listingForm,
        sellerId: currentUser.id,
      });
      setShowCreateListingModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Marketplace listing '${listingForm.title}' published successfully!`,
      });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to publish listing' });
    }
  };

  const handleOrderTransition = async (orderId: string, nextStatus: any, notes?: string) => {
    if (!currentUser) return;
    try {
      await ApiClient.transitionOrder(orderId, nextStatus, currentUser.id, notes);
      setFeedbackMsg({ type: 'success', text: `Order status updated to ${nextStatus}.` });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Status transition denied.' });
    }
  };

  const growthStages = [
    'PLANTED',
    'GERMINATION',
    'VEGETATIVE',
    'FLOWERING',
    'FRUITING',
    'HARVEST_READY',
    'HARVESTED',
  ];

  return (
    <div className="space-y-6">
      {/* Banner & Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
              : 'bg-red-950/60 border-red-600 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
            ✕
          </button>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1c1c1f] to-[#27272a] border border-[#D4AF37]/40 flex items-center justify-center text-xl font-bold text-[#D4AF37]">
              <Sprout size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">{currentUser?.name}</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck size={12} /> Smallholder Farmer
                </span>
                {currentUser?.isVerified && (
                  <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-1.5 py-0.5 rounded font-medium">
                    Verified Producer
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1 flex items-center gap-2">
                <MapPin size={13} className="text-[#D4AF37]" />
                <span>{currentUser?.district} District, Uganda</span>
                <span>•</span>
                <span>{currentUser?.organizationName || 'Independent Farmer'}</span>
                <span>•</span>
                <span>{currentUser?.phone}</span>
              </p>
              {currentUser?.bio && (
                <p className="text-xs text-[#71717a] mt-1.5 line-clamp-2">{currentUser.bio}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddFarmModal(true)}
              className="px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} className="text-[#D4AF37]" /> Register Farm
            </button>
            <button
              onClick={() => setShowAddCropModal(true)}
              className="px-3 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} className="text-[#D4AF37]" /> Record Crop
            </button>
            <button
              onClick={() => setShowCreateListingModal(true)}
              className="px-3.5 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-md transition-all"
            >
              <ShoppingBag size={14} /> Sell Produce
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1e1e24]">
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Registered Farms</div>
            <div className="text-lg font-bold text-[#F5F5F5] font-mono mt-0.5">{farms.length}</div>
            <div className="text-[10px] text-[#71717a]">
              {farms.reduce((acc, f) => acc + f.totalAcres, 0).toFixed(1)} Total Acres
            </div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Active Crops</div>
            <div className="text-lg font-bold text-[#D4AF37] font-mono mt-0.5">{crops.length}</div>
            <div className="text-[10px] text-[#71717a]">
              {crops.reduce((acc, c) => acc + c.estimatedYieldKg, 0).toLocaleString()} kg Expected
            </div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Marketplace Listings</div>
            <div className="text-lg font-bold text-[#F5F5F5] font-mono mt-0.5">{listings.length}</div>
            <div className="text-[10px] text-emerald-400">
              {listings.filter((l) => l.status === 'ACTIVE').length} Active for Sale
            </div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Buyer Orders</div>
            <div className="text-lg font-bold text-[#D4AF37] font-mono mt-0.5">{incomingOrders.length}</div>
            <div className="text-[10px] text-[#71717a]">
              {incomingOrders.filter((o) => o.status === 'SUBMITTED').length} Awaiting Acceptance
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Active Cultivation & Farm Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Farm & Plot Registry */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-[#D4AF37]" /> Registered Farms & Plots
            </h2>
            <button
              onClick={() => setShowAddFarmModal(true)}
              className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              + New Farm
            </button>
          </div>

          <div className="space-y-3">
            {farms.length === 0 ? (
              <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 text-center text-xs text-[#A0A0A0]">
                No farms registered yet. Click &quot;Register Farm&quot; to begin mapping your acreage.
              </div>
            ) : (
              farms.map((farm) => (
                <div key={farm.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#F5F5F5]">{farm.farmName}</h3>
                      <p className="text-[11px] text-[#A0A0A0]">
                        {farm.subCounty}, {farm.district} • {farm.totalAcres} Acres
                      </p>
                      <p className="text-[10px] text-[#71717a] mt-0.5 flex items-center gap-1">
                        <Droplets size={11} className="text-blue-400" /> {farm.waterSource}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddPlotModal(farm.id)}
                      className="px-2 py-1 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] rounded text-[10px] font-medium text-[#D4AF37]"
                    >
                      + Add Plot
                    </button>
                  </div>

                  {/* Plots sub-list */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1e1e24]">
                    <div className="text-[10px] uppercase font-semibold text-[#71717a] tracking-wider">
                      Plots ({farm.plots.length})
                    </div>
                    {farm.plots.length === 0 ? (
                      <div className="text-[11px] text-[#71717a] italic">No plots subdivided yet.</div>
                    ) : (
                      farm.plots.map((plot) => (
                        <div
                          key={plot.id}
                          className="bg-[#09090b] px-2.5 py-1.5 rounded border border-[#1f1f23] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-[#F5F5F5]">{plot.plotName}</span>
                            <span className="text-[10px] text-[#A0A0A0] ml-2">
                              {plot.sizeAcres} ac • {plot.soilType}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                            {plot.irrigationType}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Columns: Crops & Cultivation Tracker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Sprout size={16} className="text-[#D4AF37]" /> Crop Cultivation Records
            </h2>
            <button
              onClick={() => setShowAddCropModal(true)}
              className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              + Record Cultivation
            </button>
          </div>

          <div className="space-y-3">
            {crops.length === 0 ? (
              <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
                No crop records logged. Add your first crop record to monitor growth stages, harvest forecasts, and production.
              </div>
            ) : (
              crops.map((crop) => {
                const stageIndex = growthStages.indexOf(crop.growthStage);
                const progressPct = Math.max(10, Math.min(100, ((stageIndex + 1) / growthStages.length) * 100));

                return (
                  <div key={crop.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#F5F5F5]">{crop.cropName}</h3>
                          <span className="text-xs text-[#A0A0A0]">({crop.variety})</span>
                          <span className="text-[10px] bg-[#1c1c1f] text-[#C0C0C0] px-2 py-0.5 rounded font-mono">
                            {crop.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#71717a] mt-0.5">
                          Planted: {crop.plantingDate} • Expected Harvest: {crop.expectedHarvestDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-[#D4AF37] font-mono">
                            {crop.estimatedYieldKg.toLocaleString()} KG
                          </div>
                          <div className="text-[10px] text-[#71717a]">Estimated Yield</div>
                        </div>

                        {/* Growth Stage Selector */}
                        <select
                          value={crop.growthStage}
                          onChange={async (e) => {
                            const newStage = e.target.value as any;
                            await ApiClient.updateCrop(crop.id, { growthStage: newStage });
                            await loadData();
                          }}
                          className="bg-[#18181b] border border-[#27272a] text-[#F5F5F5] text-xs rounded px-2 py-1.5 focus:border-[#D4AF37] outline-none font-medium"
                        >
                          {growthStages.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Progress Bar for Growth Stage */}
                    <div>
                      <div className="flex justify-between text-[10px] text-[#A0A0A0] mb-1">
                        <span>Current Stage: <strong className="text-[#D4AF37]">{crop.growthStage}</strong></span>
                        <span>{Math.round(progressPct)}% towards maturity</span>
                      </div>
                      <div className="w-full bg-[#18181b] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#D4AF37] to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {crop.notes && (
                      <p className="text-xs text-[#A0A0A0] bg-[#09090b] p-2 rounded border border-[#1f1f23]">
                        {crop.notes}
                      </p>
                    )}

                    {crop.scoutingNotes && crop.scoutingNotes.length > 0 && (
                      <div className="text-[11px] text-[#71717a] space-y-0.5">
                        <span className="font-semibold text-[#A0A0A0]">Scouting Notes:</span>
                        {crop.scoutingNotes.map((sn, idx) => (
                          <div key={idx} className="pl-2 border-l border-[#27272a]">
                            {sn}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Incoming Orders Section */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#D4AF37]" /> Incoming Buyer Purchase Orders
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Contracts submitted by commercial food millers, exporters, and wholesale buyers.
            </p>
          </div>
          <button
            onClick={onNavigateToOrders}
            className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            Full Pipeline <ArrowRight size={13} />
          </button>
        </div>

        {incomingOrders.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#71717a]">
            No incoming orders yet. Publish listings to receive purchase contracts from registered buyers.
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e24] overflow-x-auto">
            {incomingOrders.map((order) => (
              <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#F5F5F5]">#{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#18181b] border border-[#3f3f46] text-[#D4AF37]">
                      {order.status}
                    </span>
                    <span className="text-[#71717a]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-[#F5F5F5] font-medium mt-1">
                    {order.quantity} {order.unit} • {order.productTitle}
                  </div>
                  <div className="text-[11px] text-[#A0A0A0]">
                    Buyer: {order.buyerName} ({order.buyerDistrict}) • Total: {order.totalAmountUGX.toLocaleString()} UGX
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'SUBMITTED' && (
                    <>
                      <button
                        onClick={() => handleOrderTransition(order.id, 'ACCEPTED', 'Farmer confirmed crop stock available.')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded text-xs transition-colors"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => handleOrderTransition(order.id, 'REJECTED', 'Stock unavailable at this time.')}
                        className="px-3 py-1.5 bg-[#18181b] hover:bg-red-950 text-red-400 border border-red-900 rounded text-xs transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === 'PAID' && (
                    <button
                      onClick={() => handleOrderTransition(order.id, 'PREPARING', 'Produce bagging and quality inspection underway.')}
                      className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded text-xs transition-colors"
                    >
                      Prepare Package
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleOrderTransition(order.id, 'READY_FOR_DISPATCH', 'Bags sealed and ready for carrier pickup.')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-xs transition-colors"
                    >
                      Ready for Dispatch
                    </button>
                  )}

                  <button
                    onClick={onNavigateToOrders}
                    className="px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-[#A0A0A0] hover:text-[#F5F5F5] rounded text-xs"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Register Farm */}
      {showAddFarmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-[#D4AF37]" /> Register New Farm
              </h3>
              <button onClick={() => setShowAddFarmModal(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Farm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wanale Valley Farm"
                  value={farmForm.farmName}
                  onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={farmForm.district}
                    onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Sub-County</label>
                  <input
                    type="text"
                    placeholder="e.g. Bufumbo"
                    value={farmForm.subCounty}
                    onChange={(e) => setFarmForm({ ...farmForm, subCounty: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Total Acres *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={farmForm.totalAcres}
                    onChange={(e) => setFarmForm({ ...farmForm, totalAcres: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Water Source</label>
                  <input
                    type="text"
                    placeholder="e.g. River Stream, Borehole"
                    value={farmForm.waterSource}
                    onChange={(e) => setFarmForm({ ...farmForm, waterSource: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFarmModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded"
                >
                  {isSimulatedOffline ? 'Save Draft (Offline)' : 'Save Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Plot */}
      {showAddPlotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
                Add Subdivided Plot
              </h3>
              <button onClick={() => setShowAddPlotModal(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={(e) => handleCreatePlot(showAddPlotModal, e)} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Plot Identifier / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Ridge Block B"
                  value={plotForm.plotName}
                  onChange={(e) => setPlotForm({ ...plotForm, plotName: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Plot Size (Acres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={plotForm.sizeAcres}
                    onChange={(e) => setPlotForm({ ...plotForm, sizeAcres: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Soil Type</label>
                  <select
                    value={plotForm.soilType}
                    onChange={(e) => setPlotForm({ ...plotForm, soilType: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="VOLCANIC">Volcanic Soil</option>
                    <option value="LOAM">Rich Loam</option>
                    <option value="SANDY_LOAM">Sandy Loam</option>
                    <option value="CLAY">Clay</option>
                    <option value="ALLUVIAL">Alluvial / Riverbed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Irrigation Method</label>
                <select
                  value={plotForm.irrigationType}
                  onChange={(e) => setPlotForm({ ...plotForm, irrigationType: e.target.value as any })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                >
                  <option value="RAIN_FED">Rain-Fed (Seasonal)</option>
                  <option value="DRIP">Gravity Drip Kit</option>
                  <option value="SPRINKLER">Sprinkler System</option>
                  <option value="BOREHOLE">Borehole Pumping</option>
                  <option value="CANAL">Canal / Stream Divert</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlotModal(null)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded"
                >
                  Add Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Crop */}
      {showAddCropModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Sprout size={16} className="text-[#D4AF37]" /> Record Crop Cultivation
              </h3>
              <button onClick={() => setShowAddCropModal(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Target Farm *</label>
                  <select
                    required
                    value={cropForm.farmId}
                    onChange={(e) => setCropForm({ ...cropForm, farmId: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.farmName} ({f.district})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Crop Category *</label>
                  <select
                    value={cropForm.category}
                    onChange={(e) => setCropForm({ ...cropForm, category: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="COFFEE_CASH_CROPS">Coffee & Cash Crops</option>
                    <option value="GRAINS_CEREALS">Grains & Cereals (Maize, Rice, Sorghum)</option>
                    <option value="LEGUMES_PULSES">Legumes & Pulses (Beans, Soya, Groundnuts)</option>
                    <option value="TUBERS_ROOTS">Tubers & Roots (Cassava, Matooke, Sweet Potatoes)</option>
                    <option value="FRUITS_VEGETABLES">Fruits & Horticultural</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arabica Coffee, White Maize"
                    value={cropForm.cropName}
                    onChange={(e) => setCropForm({ ...cropForm, cropName: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Variety / Strain</label>
                  <input
                    type="text"
                    placeholder="e.g. SL14, Longe 5D, NAROCASS"
                    value={cropForm.variety}
                    onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Planting Date *</label>
                  <input
                    type="date"
                    required
                    value={cropForm.plantingDate}
                    onChange={(e) => setCropForm({ ...cropForm, plantingDate: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Expected Harvest *</label>
                  <input
                    type="date"
                    required
                    value={cropForm.expectedHarvestDate}
                    onChange={(e) => setCropForm({ ...cropForm, expectedHarvestDate: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Est. Yield (KG) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={cropForm.estimatedYieldKg}
                    onChange={(e) => setCropForm({ ...cropForm, estimatedYieldKg: parseInt(e.target.value) || 100 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Agronomic Notes / Observations</label>
                <textarea
                  rows={2}
                  placeholder="Soil amendments, germination rate, pest observations..."
                  value={cropForm.notes}
                  onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCropModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded"
                >
                  {isSimulatedOffline ? 'Save Draft (Offline)' : 'Save Crop Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Marketplace Listing */}
      {showCreateListingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={16} className="text-[#D4AF37]" /> Publish Produce to Marketplace
              </h3>
              <button onClick={() => setShowCreateListingModal(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Listing Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Altitude Grade AA Arabica Coffee"
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Category *</label>
                  <select
                    value={listingForm.category}
                    onChange={(e) => setListingForm({ ...listingForm, category: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="GRAINS_CEREALS">Grains & Cereals</option>
                    <option value="COFFEE_CASH_CROPS">Coffee & Cash Crops</option>
                    <option value="LEGUMES_PULSES">Legumes & Pulses</option>
                    <option value="TUBERS_ROOTS">Tubers & Roots</option>
                    <option value="FRUITS_VEGETABLES">Fruits & Vegetables</option>
                    <option value="LIVESTOCK_DAIRY">Livestock & Dairy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unit of Measurement *</label>
                  <select
                    value={listingForm.unit}
                    onChange={(e) => setListingForm({ ...listingForm, unit: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="KG">Kilogram (KG)</option>
                    <option value="BAG_100KG">100KG Jute Bag</option>
                    <option value="BAG_50KG">50KG Bag</option>
                    <option value="TONNE">Metric Tonne</option>
                    <option value="CRATE">Crate</option>
                    <option value="BUNCH">Bunch (Matooke)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Available Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={listingForm.quantityAvailable}
                    onChange={(e) => setListingForm({ ...listingForm, quantityAvailable: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Price / Unit (UGX) *</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={listingForm.pricePerUnitUGX}
                    onChange={(e) => setListingForm({ ...listingForm, pricePerUnitUGX: parseInt(e.target.value) || 100 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Min. Order</label>
                  <input
                    type="number"
                    min="1"
                    value={listingForm.minimumOrder}
                    onChange={(e) => setListingForm({ ...listingForm, minimumOrder: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">District Location *</label>
                  <input
                    type="text"
                    required
                    value={listingForm.district}
                    onChange={(e) => setListingForm({ ...listingForm, district: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Quality Grade</label>
                  <select
                    value={listingForm.qualityGrade}
                    onChange={(e) => setListingForm({ ...listingForm, qualityGrade: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="GRADE_1">Grade 1 (Export / Premium)</option>
                    <option value="GRADE_2">Grade 2 (Commercial Standard)</option>
                    <option value="STANDARD">Local Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Moisture content, drying method, certifications, packaging..."
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="organicCert"
                  checked={listingForm.organicCertified}
                  onChange={(e) => setListingForm({ ...listingForm, organicCertified: e.target.checked })}
                  className="rounded border-[#27272a] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="organicCert" className="text-xs text-[#A0A0A0]">
                  Certified Organic or Shade Grown
                </label>
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateListingModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded"
                >
                  {isSimulatedOffline ? 'Save Draft (Offline)' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
