/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Simplified Trader, Seller & SME Business View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Building2,
  ClipboardCheck,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Order, MarketplaceListing } from '../../types/index.ts';
import { OrderStatusCard } from '../ux/DomainCards.tsx';
import { EmptyState } from '../ux/CorePrimitives.tsx';

export const BusinessSimpleView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const { mode, canAccessMode } = useExperience();
  const [orders, setOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = async () => {
    const [oRes, lRes] = await Promise.all([
      ApiClient.getOrders().catch(() => []),
      ApiClient.getListings().catch(() => []),
    ]);
    setOrders(Array.isArray(oRes) ? oRes : []);
    setListings(Array.isArray(lRes) ? lRes : []);
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const waitingResponse = orders.filter((o) => o.status === 'SUBMITTED');
  const awaitingPayment = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'AWAITING_PAYMENT' || o.status === 'PAYMENT_PENDING');
  const readyForDelivery = orders.filter((o) => o.status === 'PAID' || o.status === 'PREPARING' || o.status === 'READY_FOR_DISPATCH');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED');
  const activeListings = listings.filter((l) => l.status === 'ACTIVE');

  const acceptOrder = async (order: Order) => {
    if (!currentUser) return;
    setBusyId(order.id);
    try {
      await ApiClient.transitionOrder(order.id, 'ACCEPTED', currentUser.id, 'Accepted via Business Workspace');
      await loadData();
    } catch {
      // ignore if already transitioned
    } finally {
      setBusyId(null);
    }
  };

  const showAdvancedAccounting = canAccessMode('STANDARD', role) && mode !== 'SIMPLE';

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium">
            <Building2 size={15} aria-hidden="true" />
            <span>{currentUser?.organizationName || `${currentUser?.name}'s Business`}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">My Business Workspace</h1>
          <p className="text-sm text-[#A0A0A0]">
            Track orders waiting for your reply, listed stock, deliveries, and customer payments without accounting jargon.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('farmer-simple')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
          >
            + Add Product Listing
          </button>
          {showAdvancedAccounting && (
            <button
              type="button"
              onClick={() => onNavigate('accounting-ledger')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
            >
              <BookOpen size={15} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Advanced Accounting</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Everyday Business KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <ClipboardCheck size={14} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Orders waiting for response</span>
          </div>
          <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">{waitingResponse.length}</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <CreditCard size={14} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Payments awaiting confirmation</span>
          </div>
          <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">{awaitingPayment.length}</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <Package size={14} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Products currently listed</span>
          </div>
          <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">{activeListings.length}</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <Truck size={14} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Orders ready for delivery</span>
          </div>
          <div className="text-2xl font-bold text-[#F5F5F5] tabular-nums">{readyForDelivery.length}</div>
        </div>
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <CheckCircle2 size={14} className="text-emerald-400" aria-hidden="true" />
            <span>Completed sales</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{completedOrders.length}</div>
        </div>
      </div>

      {/* Customer Orders Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Recent Business Orders</h2>
          <button
            type="button"
            onClick={() => onNavigate('activity')}
            className="text-sm text-[#D4AF37] hover:underline cursor-pointer"
          >
            Open full order history
          </button>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={<Package size={22} />}
            title="No customer orders yet"
            description="List products or reply to open buyer requests to start building your sales history."
            actionLabel="Browse Buyers & Marketplace"
            onAction={() => onNavigate('explore')}
          />
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 6).map((ord) => (
              <OrderStatusCard
                key={ord.id}
                reference={ord.orderNumber}
                itemTitle={`${ord.productTitle} (${ord.quantity} ${ord.unit})`}
                counterparty={`Customer: ${ord.buyerName} · ${ord.deliveryDistrict}`}
                amount={ord.totalAmountUGX}
                dateIso={ord.createdAt}
                rawStatus={ord.status}
                actionLabel={
                  ord.status === 'SUBMITTED' && ord.sellerId === currentUser?.id
                    ? busyId === ord.id
                      ? 'Accepting...'
                      : 'Accept Order'
                    : 'View Order'
                }
                onAction={() =>
                  ord.status === 'SUBMITTED' && ord.sellerId === currentUser?.id
                    ? acceptOrder(ord)
                    : onNavigate('activity')
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
