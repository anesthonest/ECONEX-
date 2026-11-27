/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Order Lifecycle & Escrow Management Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Order, OrderStatus } from '../../types/index.ts';
import { OrderDeliveryTimeline } from '../ux/CorePrimitives.tsx';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  XCircle,
  Package,
} from 'lucide-react';

interface OrderManagementViewProps {
  onOpenPaymentModal: (order: Order) => void;
}

const formatOrderStatus = (status: string): string =>
  String(status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({ onOpenPaymentModal }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      let data: Order[] = [];
      if (currentUser.role === 'PLATFORM_ADMIN') {
        data = await ApiClient.getOrders({ role: 'PLATFORM_ADMIN' });
      } else if (currentUser.role === 'BUYER') {
        data = await ApiClient.getOrders({ buyerId: currentUser.id });
      } else if (currentUser.role === 'FARMER' || currentUser.role === 'AGRO_DEALER' || currentUser.role === 'COOPERATIVE_ADMIN') {
        data = await ApiClient.getOrders({ sellerId: currentUser.id });
      } else if (currentUser.role === 'TRANSPORTER') {
        data = await ApiClient.getOrders({ transporterId: currentUser.id });
      }
      setOrders(data);
      if (selectedOrder) {
        const refreshed = data.find((o) => o.id === selectedOrder.id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (err: any) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const handleTransition = async (orderId: string, nextStatus: OrderStatus, notes?: string) => {
    if (!currentUser) return;
    try {
      const updated = await ApiClient.transitionOrder(orderId, nextStatus, currentUser.id, notes);
      setFeedbackMsg({
        type: 'success',
        text: `Order #${updated.orderNumber} updated to ${formatOrderStatus(nextStatus)}.`,
      });
      await fetchOrders();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Unable to update order status.' });
    }
  };

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter);

  const statusTextColors: Record<OrderStatus, string> = {
    DRAFT: 'text-[#A0A0A0]',
    SUBMITTED: 'text-[#D4AF37]',
    ACCEPTED: 'text-sky-400',
    REJECTED: 'text-red-400',
    AWAITING_PAYMENT: 'text-[#D4AF37]',
    PAYMENT_PENDING: 'text-purple-300',
    PAID: 'text-emerald-400',
    PREPARING: 'text-indigo-300',
    READY_FOR_DISPATCH: 'text-cyan-300',
    IN_TRANSIT: 'text-orange-300',
    DELIVERED: 'text-teal-300',
    COMPLETED: 'text-emerald-400',
    CANCELLED: 'text-red-400',
    DISPUTED: 'text-rose-400',
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
              : 'bg-red-950/60 border-red-700 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5] cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight flex items-center gap-2">
              <FileText size={20} className="text-[#D4AF37]" aria-hidden="true" /> Order Lifecycle &amp; Delivery Tracking
            </h1>
            <p className="text-xs text-[#A0A0A0] mt-1">
              Track every order cleanly through 5 steps from Order Placed to Delivered with verified payment &amp; handoff milestones.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#A0A0A0] flex items-center gap-1">
              <Filter size={13} aria-hidden="true" /> Filter:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[40px] bg-[#18181b] border border-[#27272a] text-[#F5F5F5] text-xs rounded-xl px-3 py-1.5 focus:border-[#D4AF37] outline-none font-medium"
            >
              <option value="ALL">All Orders ({orders.length})</option>
              <option value="SUBMITTED">Order Placed</option>
              <option value="ACCEPTED">Confirmed</option>
              <option value="PAID">Paid / Protected</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
              <option value="IN_TRANSIT">On the Way</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Clean 5-Stage Progress Banner */}
        <div className="pt-2 border-t border-[#1f1f23] space-y-2">
          <div className="text-xs text-[#A0A0A0]">
            {selectedOrder
              ? `Active progress for Order #${selectedOrder.orderNumber}: ${formatOrderStatus(selectedOrder.status)}`
              : 'Select any order below to inspect its delivery milestone progress'}
          </div>
          <OrderDeliveryTimeline rawStatus={selectedOrder?.status || 'SUBMITTED'} />
        </div>
      </div>

      {/* Orders List & Detail View Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center text-xs text-[#A0A0A0]">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-10 text-center text-xs text-[#A0A0A0]">
              No orders found matching this filter.
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const statusColor = statusTextColors[ord.status] || 'text-[#C0C0C0]';
              const isSelected = selectedOrder?.id === ord.id;
              const isBuyer = currentUser?.id === ord.buyerId;
              const isSeller = currentUser?.id === ord.sellerId;

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`bg-[#121212] border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer ${
                    isSelected ? 'border-[#D4AF37] shadow-md shadow-[#D4AF37]/5 bg-[#161619]' : 'border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[#F5F5F5]">#{ord.orderNumber}</span>
                        <span aria-hidden="true" className="text-[#52525b]">·</span>
                        <span className={`font-semibold ${statusColor}`}>
                          {formatOrderStatus(ord.status)}
                        </span>
                        <span aria-hidden="true" className="text-[#52525b]">·</span>
                        <span className="text-[#A0A0A0] tabular-nums">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F5] mt-1">
                        {ord.quantity} {ord.unit} · {ord.productTitle}
                      </h3>
                      <p className="text-xs text-[#A0A0A0] mt-0.5">
                        Buyer: <strong className="text-[#F5F5F5]">{ord.buyerName}</strong> ({ord.buyerDistrict}) → Seller: <strong className="text-[#F5F5F5]">{ord.sellerName}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-base font-bold text-[#D4AF37] font-mono tabular-nums">
                        {ord.totalAmountUGX.toLocaleString()} UGX
                      </div>
                      <div className="text-xs text-[#71717a] tabular-nums">
                        Items {ord.subtotalUGX.toLocaleString()} + Delivery {ord.logisticsFeeUGX.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Contextual Action Buttons depending on logged-in actor & state */}
                  <div className="mt-3 pt-3 border-t border-[#1e1e24] flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-[#A0A0A0]">
                      {ord.paymentReference ? (
                        <span className="text-emerald-400 font-mono">Ref: {ord.paymentReference} · Protected</span>
                      ) : (
                        <span>Waiting for payment</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Seller actions */}
                      {isSeller && ord.status === 'SUBMITTED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleTransition(ord.id, 'ACCEPTED', 'Seller verified stock available.')}
                            className="min-h-[38px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Accept Order
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransition(ord.id, 'REJECTED', 'Stock allocation unavailable.')}
                            className="min-h-[38px] px-3.5 py-1.5 bg-[#18181b] hover:bg-red-950 text-red-400 border border-red-900 text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {/* Buyer actions: Pay */}
                      {isBuyer && (ord.status === 'ACCEPTED' || ord.status === 'AWAITING_PAYMENT') && (
                        <button
                          type="button"
                          onClick={() => onOpenPaymentModal(ord)}
                          className="min-h-[38px] px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CreditCard size={13} aria-hidden="true" /> Pay Safely (Sandbox)
                        </button>
                      )}

                      {/* Seller: Prepare */}
                      {isSeller && ord.status === 'PAID' && (
                        <button
                          type="button"
                          onClick={() => handleTransition(ord.id, 'PREPARING', 'Order preparation underway.')}
                          className="min-h-[38px] px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Start Preparing
                        </button>
                      )}

                      {/* Seller: Ready for dispatch */}
                      {isSeller && ord.status === 'PREPARING' && (
                        <button
                          type="button"
                          onClick={() => handleTransition(ord.id, 'READY_FOR_DISPATCH', 'Packed and ready for pickup.')}
                          className="min-h-[38px] px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Ready for Pickup
                        </button>
                      )}

                      {/* Buyer: Complete Order */}
                      {isBuyer && ord.status === 'DELIVERED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleTransition(ord.id, 'COMPLETED', 'Goods received in satisfactory condition. Escrow released.')}
                            className="min-h-[38px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Confirm &amp; Release Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransition(ord.id, 'DISPUTED', 'Goods damaged or quantity mismatch.')}
                            className="min-h-[38px] px-3.5 py-1.5 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded-xl hover:bg-rose-900 cursor-pointer"
                          >
                            Report Issue
                          </button>
                        </>
                      )}

                      {/* Buyer cancellation */}
                      {isBuyer && ord.status === 'SUBMITTED' && (
                        <button
                          type="button"
                          onClick={() => handleTransition(ord.id, 'CANCELLED', 'Order cancelled by buyer before seller acceptance.')}
                          className="min-h-[38px] px-3 py-1.5 bg-[#18181b] border border-[#27272a] text-[#A0A0A0] hover:text-red-400 text-xs rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="min-h-[38px] px-3 py-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#D4AF37] rounded-xl cursor-pointer"
                      >
                        Track Progress
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Details & Audit Timeline Inspector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 sticky top-24 space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Clock size={15} className="text-[#D4AF37]" aria-hidden="true" /> Order Progress &amp; History
            </h2>

            {selectedOrder ? (
              <div className="space-y-4 text-xs">
                {/* Header summary */}
                <div className="bg-[#09090b] p-3.5 rounded-xl border border-[#1f1f23] space-y-2">
                  <div className="flex justify-between font-mono font-bold text-[#F5F5F5]">
                    <span>#{selectedOrder.orderNumber}</span>
                    <span className="text-[#D4AF37]">{formatOrderStatus(selectedOrder.status)}</span>
                  </div>
                  <div className="text-xs text-[#C0C0C0]">
                    {selectedOrder.quantity} {selectedOrder.unit} · {selectedOrder.productTitle}
                  </div>
                  <div className="pt-1">
                    <OrderDeliveryTimeline rawStatus={selectedOrder.status} compact />
                  </div>
                  <div className="text-xs text-[#A0A0A0] pt-1 border-t border-[#1e1e24]">
                    Delivery: {selectedOrder.deliveryAddress}, {selectedOrder.deliveryDistrict}
                  </div>
                </div>

                {/* Timeline History */}
                <div>
                  <div className="text-xs font-medium text-[#A0A0A0] mb-2">
                    Updates ({selectedOrder.statusHistory.length} steps)
                  </div>
                  <div className="space-y-3 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#27272a]">
                    {selectedOrder.statusHistory.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] border-2 border-[#121212]" />
                        <div className="font-semibold text-[#F5F5F5] flex items-center justify-between">
                          <span>{formatOrderStatus(step.status)}</span>
                          <span className="text-[11px] text-[#71717a] font-mono tabular-nums">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#D4AF37]">
                          by {step.actorName} ({step.actorRole})
                        </div>
                        {step.notes && (
                          <div className="text-[11px] text-[#A0A0A0] mt-0.5 bg-[#18181b] p-1.5 rounded border border-[#27272a]">
                            {step.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transporter / Haulage Link */}
                {selectedOrder.transporterName && (
                  <div className="bg-[#18181b] p-2.5 rounded border border-[#27272a] text-[11px] space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-[#71717a]">Assigned Transporter:</span>
                    <div className="font-medium text-[#F5F5F5] flex items-center gap-1.5">
                      <Truck size={13} className="text-orange-400" />
                      <span>{selectedOrder.transporterName}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-[#71717a]">
                Select an order from the list to view its complete lifecycle timeline and state transitions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
