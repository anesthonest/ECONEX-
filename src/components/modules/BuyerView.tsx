/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Buyer Experience & Sourcing Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Order, MarketplaceListing } from '../../types/index.ts';
import {
  ShoppingBag,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Truck,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface BuyerViewProps {
  onNavigateToMarketplace: () => void;
  onNavigateToOrders: () => void;
  onOpenPaymentModal: (order: Order) => void;
}

export const BuyerView: React.FC<BuyerViewProps> = ({
  onNavigateToMarketplace,
  onNavigateToOrders,
  onOpenPaymentModal,
}) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [featuredListings, setFeaturedListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBuyerData = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [ordersData, listingsData] = await Promise.all([
        ApiClient.getOrders({ buyerId: currentUser.id }),
        ApiClient.getListings({ status: 'ACTIVE' }),
      ]);
      setOrders(ordersData);
      setFeaturedListings(listingsData.slice(0, 4));
    } catch (err: any) {
      console.error('Failed to load buyer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerData();
  }, [currentUser]);

  const handleCancelOrder = async (orderId: string) => {
    if (!currentUser) return;
    try {
      await ApiClient.transitionOrder(
        orderId,
        'CANCELLED',
        currentUser.id,
        'Cancelled by buyer prior to fulfillment.'
      );
      setFeedbackMsg({ type: 'success', text: 'Order cancelled successfully.' });
      await fetchBuyerData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to cancel order.' });
    }
  };

  const handleConfirmReceipt = async (orderId: string) => {
    if (!currentUser) return;
    try {
      await ApiClient.transitionOrder(
        orderId,
        'COMPLETED',
        currentUser.id,
        'Goods received, inspected, and verified. Escrow funds released to producer.'
      );
      setFeedbackMsg({ type: 'success', text: 'Order completed and escrow released!' });
      await fetchBuyerData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to complete order.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
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

      {/* Buyer Profile Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-950/50 border border-amber-800 flex items-center justify-center text-xl font-bold text-amber-300">
              <Building size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">
                  {currentUser?.organizationName || currentUser?.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                  Commercial Buyer & Aggregator
                </span>
                {currentUser?.isVerified && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck size={11} /> Verified Enterprise
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1 flex items-center gap-2">
                <MapPin size={13} className="text-[#D4AF37]" />
                <span>Primary Depot: {currentUser?.district} District</span>
                <span>•</span>
                <span>Procurement Rep: {currentUser?.name} ({currentUser?.phone})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToMarketplace}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Search size={14} /> Browse Commodities
          </button>
        </div>

        {/* Quick Sourcing Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1e1e24]">
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Active Orders</div>
            <div className="text-lg font-bold font-mono text-[#F5F5F5] mt-0.5">
              {orders.filter((o) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(o.status)).length}
            </div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">In-Transit Cargo</div>
            <div className="text-lg font-bold font-mono text-orange-400 mt-0.5">
              {orders.filter((o) => o.status === 'IN_TRANSIT').length}
            </div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Awaiting Escrow Payment</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'AWAITING_PAYMENT').length}
            </div>
          </div>
          <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
            <div className="text-[11px] text-[#A0A0A0]">Total Sourced Value</div>
            <div className="text-lg font-bold font-mono text-[#D4AF37] mt-0.5">
              {(orders.reduce((acc, o) => acc + o.totalAmountUGX, 0) / 1000000).toFixed(1)}M UGX
            </div>
          </div>
        </div>
      </div>

      {/* Active Purchase Contracts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag size={16} className="text-[#D4AF37]" /> My Sourcing Contracts & Purchase Orders
          </h2>
          <button
            onClick={onNavigateToOrders}
            className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            All Orders <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
              No purchase orders placed yet. Visit the Marketplace to source commodities.
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#F5F5F5]">#{ord.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#18181b] border border-[#3f3f46] text-[#D4AF37]">
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-[#71717a]">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#F5F5F5] mt-1">
                      {ord.quantity} {ord.unit} • {ord.productTitle}
                    </h3>
                    <p className="text-[11px] text-[#A0A0A0]">
                      Producer: <strong className="text-[#F5F5F5]">{ord.sellerName}</strong> ({ord.sellerRole})
                    </p>
                  </div>

                  <div className="text-right sm:text-right">
                    <div className="text-sm font-bold text-[#D4AF37] font-mono">
                      {ord.totalAmountUGX.toLocaleString()} UGX
                    </div>
                    <div className="text-[10px] text-[#71717a]">
                      Delivery to {ord.deliveryDistrict}
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-[#1e1e24] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-[#71717a]">
                    {ord.paymentReference ? (
                      <span className="text-emerald-400 font-mono">Ref: {ord.paymentReference} (Escrow Secured)</span>
                    ) : (
                      <span className="text-amber-400">Escrow deposit required upon acceptance</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Pay button */}
                    {(ord.status === 'ACCEPTED' || ord.status === 'AWAITING_PAYMENT') && (
                      <button
                        onClick={() => onOpenPaymentModal(ord)}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <CreditCard size={12} /> Pay Escrow (Test Mode)
                      </button>
                    )}

                    {/* Delivery confirmation */}
                    {ord.status === 'DELIVERED' && (
                      <button
                        onClick={() => handleConfirmReceipt(ord.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded transition-colors"
                      >
                        Confirm Receipt & Release Escrow
                      </button>
                    )}

                    {/* Cancellation */}
                    {ord.status === 'SUBMITTED' && (
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        className="px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-red-800 text-red-400 text-xs rounded transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}

                    <button
                      onClick={onNavigateToOrders}
                      className="px-2.5 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] rounded"
                    >
                      Track Order →
                    </button>
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
