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
        text: `Order #${updated.orderNumber} transitioned to '${nextStatus}'.`,
      });
      await fetchOrders();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Transition denied by state machine.' });
    }
  };

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter);

  const statusColors: Record<OrderStatus, { bg: string; text: string; border: string }> = {
    DRAFT: { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700' },
    SUBMITTED: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800' },
    ACCEPTED: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-800' },
    REJECTED: { bg: 'bg-red-950/60', text: 'text-red-400', border: 'border-red-900' },
    AWAITING_PAYMENT: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800' },
    PAYMENT_PENDING: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-800' },
    PAID: { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-600' },
    PREPARING: { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-800' },
    READY_FOR_DISPATCH: { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-800' },
    IN_TRANSIT: { bg: 'bg-orange-950/60', text: 'text-orange-300', border: 'border-orange-800' },
    DELIVERED: { bg: 'bg-teal-950/60', text: 'text-teal-300', border: 'border-teal-700' },
    COMPLETED: { bg: 'bg-emerald-900/60', text: 'text-emerald-400', border: 'border-emerald-500' },
    CANCELLED: { bg: 'bg-red-950/60', text: 'text-red-400', border: 'border-red-900' },
    DISPUTED: { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700' },
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

      {/* Header & Filter Controls */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#F5F5F5] tracking-tight flex items-center gap-2">
              <FileText size={20} className="text-[#D4AF37]" /> Order Lifecycle & Escrow Pipeline
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              State-machine governed commodity trade with escrow milestones, dispatch handoffs, and audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#71717a] flex items-center gap-1">
              <Filter size={13} /> Filter Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-[#F5F5F5] text-xs rounded px-2.5 py-1.5 focus:border-[#D4AF37] outline-none font-medium"
            >
              <option value="ALL">All Statuses ({orders.length})</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PAID">Paid / In Escrow</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* State Machine Flow Visualization Banner */}
        <div className="overflow-x-auto py-2">
          <div className="flex items-center gap-1 min-w-[700px] text-[11px] font-medium text-[#71717a]">
            {['SUBMITTED', 'ACCEPTED', 'PAID (ESCROW)', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].map(
              (step, idx) => (
                <React.Fragment key={step}>
                  <div className="bg-[#18181b] border border-[#27272a] px-2 py-1 rounded text-center shrink-0">
                    {step}
                  </div>
                  {idx < 7 && <ArrowRight size={12} className="text-[#3f3f46] shrink-0" />}
                </React.Fragment>
              )
            )}
          </div>
        </div>
      </div>

      {/* Orders List & Detail View Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-10 text-center text-xs text-[#A0A0A0]">
              No orders found matching the filter.
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const colors = statusColors[ord.status] || {
                bg: 'bg-zinc-900',
                text: 'text-zinc-300',
                border: 'border-zinc-700',
              };
              const isSelected = selectedOrder?.id === ord.id;
              const isBuyer = currentUser?.id === ord.buyerId;
              const isSeller = currentUser?.id === ord.sellerId;
              const isAdmin = currentUser?.role === 'PLATFORM_ADMIN';

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`bg-[#121212] border rounded-xl p-4 transition-all cursor-pointer ${
                    isSelected ? 'border-[#D4AF37] shadow-md shadow-[#D4AF37]/5 bg-[#161619]' : 'border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#F5F5F5]">#{ord.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-[#71717a]">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#F5F5F5] mt-1">
                        {ord.quantity} {ord.unit} • {ord.productTitle}
                      </h3>
                      <p className="text-[11px] text-[#A0A0A0] mt-0.5">
                        Buyer: <strong className="text-[#F5F5F5]">{ord.buyerName}</strong> ({ord.buyerDistrict}) → Seller: <strong className="text-[#F5F5F5]">{ord.sellerName}</strong>
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-sm font-bold text-[#D4AF37] font-mono">
                        {ord.totalAmountUGX.toLocaleString()} UGX
                      </div>
                      <div className="text-[10px] text-[#71717a]">
                        Subtotal: {ord.subtotalUGX.toLocaleString()} + Freight: {ord.logisticsFeeUGX.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Contextual Action Buttons depending on logged-in actor & state */}
                  <div className="mt-3 pt-3 border-t border-[#1e1e24] flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-[#71717a]">
                      {ord.paymentReference ? (
                        <span className="text-emerald-400 font-mono">Ref: {ord.paymentReference} (Escrow Secured)</span>
                      ) : (
                        <span>Awaiting Escrow Deposit</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Seller actions */}
                      {isSeller && ord.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => handleTransition(ord.id, 'ACCEPTED', 'Seller verified stock available.')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleTransition(ord.id, 'REJECTED', 'Stock allocation unavailable.')}
                            className="px-3 py-1 bg-[#18181b] hover:bg-red-950 text-red-400 border border-red-900 text-xs rounded transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Buyer actions: Pay */}
                      {isBuyer && (ord.status === 'ACCEPTED' || ord.status === 'AWAITING_PAYMENT') && (
                        <button
                          onClick={() => onOpenPaymentModal(ord)}
                          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded flex items-center gap-1 transition-colors shadow-sm"
                        >
                          <CreditCard size={12} /> Pay Escrow (Test)
                        </button>
                      )}

                      {/* Seller: Prepare */}
                      {isSeller && ord.status === 'PAID' && (
                        <button
                          onClick={() => handleTransition(ord.id, 'PREPARING', 'Crop bagging underway.')}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors"
                        >
                          Mark Preparing
                        </button>
                      )}

                      {/* Seller: Ready for dispatch */}
                      {isSeller && ord.status === 'PREPARING' && (
                        <button
                          onClick={() => handleTransition(ord.id, 'READY_FOR_DISPATCH', 'Bags sealed and ready for carrier.')}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded transition-colors"
                        >
                          Ready for Dispatch
                        </button>
                      )}

                      {/* Buyer: Complete Order */}
                      {isBuyer && ord.status === 'DELIVERED' && (
                        <>
                          <button
                            onClick={() => handleTransition(ord.id, 'COMPLETED', 'Goods received in satisfactory condition. Escrow released.')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs rounded transition-colors"
                          >
                            Confirm & Release Escrow
                          </button>
                          <button
                            onClick={() => handleTransition(ord.id, 'DISPUTED', 'Goods damaged or quantity mismatch.')}
                            className="px-3 py-1 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded hover:bg-rose-900"
                          >
                            Raise Dispute
                          </button>
                        </>
                      )}

                      {/* Buyer cancellation */}
                      {isBuyer && ord.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleTransition(ord.id, 'CANCELLED', 'Order cancelled by buyer before seller acceptance.')}
                          className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] text-[#A0A0A0] hover:text-red-400 text-xs rounded"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 bg-[#18181b] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#D4AF37] rounded"
                      >
                        Timeline →
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
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 sticky top-24 space-y-4">
            <h2 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Clock size={15} className="text-[#D4AF37]" /> Lifecycle Timeline & Verification
            </h2>

            {selectedOrder ? (
              <div className="space-y-4 text-xs">
                {/* Header summary */}
                <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] space-y-1">
                  <div className="flex justify-between font-mono font-bold text-[#F5F5F5]">
                    <span>#{selectedOrder.orderNumber}</span>
                    <span className="text-[#D4AF37]">{selectedOrder.status}</span>
                  </div>
                  <div className="text-[11px] text-[#A0A0A0]">
                    {selectedOrder.quantity} {selectedOrder.unit} of {selectedOrder.productTitle}
                  </div>
                  <div className="text-[11px] text-[#71717a] pt-1 border-t border-[#1e1e24]">
                    Delivery: {selectedOrder.deliveryAddress}, {selectedOrder.deliveryDistrict}
                  </div>
                </div>

                {/* Timeline History */}
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#71717a] tracking-wider mb-2">
                    Audit Trail ({selectedOrder.statusHistory.length} Milestones)
                  </div>
                  <div className="space-y-3 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#27272a]">
                    {selectedOrder.statusHistory.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] border-2 border-[#121212]" />
                        <div className="font-semibold text-[#F5F5F5] flex items-center justify-between">
                          <span>{step.status.replace(/_/g, ' ')}</span>
                          <span className="text-[9px] text-[#71717a] font-mono">
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
