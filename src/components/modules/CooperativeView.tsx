/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Agricultural Cooperative Union Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { MarketplaceListing, Order } from '../../types/index.ts';
import {
  Users2,
  ShieldCheck,
  Package,
  Plus,
  ShoppingBag,
  TrendingUp,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface CooperativeViewProps {
  onNavigateToMarketplace: () => void;
  onNavigateToOrders: () => void;
}

export const CooperativeView: React.FC<CooperativeViewProps> = ({
  onNavigateToMarketplace,
  onNavigateToOrders,
}) => {
  const { currentUser } = useAuth();
  const [coopListings, setCoopListings] = useState<MarketplaceListing[]>([]);
  const [coopOrders, setCoopOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCoopData = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [listingsData, ordersData] = await Promise.all([
        ApiClient.getListings({ sellerId: currentUser.id }),
        ApiClient.getOrders({ sellerId: currentUser.id }),
      ]);
      setCoopListings(listingsData);
      setCoopOrders(ordersData);
    } catch (err: any) {
      console.error('Failed to load cooperative data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoopData();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-950/50 border border-blue-800 flex items-center justify-center text-xl font-bold text-blue-300">
              <Users2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">
                  {currentUser?.organizationName || currentUser?.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  Farmers Cooperative Society
                </span>
                {currentUser?.isVerified && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck size={11} /> Registered Union
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1 flex items-center gap-2">
                <MapPin size={13} className="text-[#D4AF37]" />
                <span>Central Silo & Warehouse: {currentUser?.district} District</span>
                <span>•</span>
                <span>Union Manager: {currentUser?.name}</span>
              </p>
              {currentUser?.bio && (
                <p className="text-xs text-[#71717a] mt-1 line-clamp-2">{currentUser.bio}</p>
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToMarketplace}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <ShoppingBag size={14} /> View Aggregated Exchange
          </button>
        </div>

        {/* Aggregation KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1e1e24]">
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Member Smallholders</div>
            <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-0.5">1,240</div>
            <div className="text-[10px] text-emerald-400">Acholi Sub-Region</div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Silo Stock In Store</div>
            <div className="text-lg font-bold font-mono text-[#D4AF37] mt-0.5">180 MT</div>
            <div className="text-[10px] text-[#71717a]">Soya, Sesame, Sorghum</div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Active Bulk Listings</div>
            <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-0.5">{coopListings.length}</div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Aggregated Orders</div>
            <div className="text-lg font-bold font-mono text-[#D4AF37] mt-0.5">{coopOrders.length}</div>
          </div>
        </div>
      </div>

      {/* Cooperative Bulk Listings */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
            <Package size={16} className="text-[#D4AF37]" /> Union Bulk Commodity Listings
          </h2>
        </div>

        <div className="space-y-3">
          {coopListings.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#71717a]">
              No bulk commodity listings currently published.
            </div>
          ) : (
            coopListings.map((item) => (
              <div
                key={item.id}
                className="bg-[#09090b] p-4 rounded-lg border border-[#1f1f23] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F5F5F5]">{item.title}</span>
                    <span className="text-[10px] text-[#D4AF37] font-mono">{item.category}</span>
                  </div>
                  <p className="text-[11px] text-[#A0A0A0] mt-0.5">{item.description}</p>
                  <p className="text-[10px] text-[#71717a] mt-0.5">
                    Storage: {item.location} • Minimum Order: {item.minimumOrder} {item.unit}
                  </p>
                </div>

                <div className="text-right sm:text-right shrink-0">
                  <div className="text-sm font-bold text-[#D4AF37] font-mono">
                    {item.pricePerUnitUGX.toLocaleString()} UGX / {item.unit}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Stock: {item.quantityAvailable} {item.unit}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
