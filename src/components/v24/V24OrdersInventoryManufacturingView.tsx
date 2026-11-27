/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V24.0 - 18-State Commercial Orders, Warehouse ATP Inventory & Manufacturing BOM Execution
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Factory,
  PackageCheck,
  RefreshCw,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V24BillOfMaterials,
  V24CommercialOrder,
  V24CommercialParticipant,
  V24InventoryItem,
  V24OrderType,
  V24ProductionOrder,
  V24StockMovement,
  V24WarehouseFacility,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const ORDER_TYPES: V24OrderType[] = [
  'B2B',
  'B2C',
  'C2C',
  'WHOLESALE',
  'RETAIL',
  'SERVICE',
  'RENTAL_BOOKING',
  'MANUFACTURING',
  'INSTITUTIONAL',
  'RECURRING_SUPPLY',
];

function fmtMinor(minor: number, currency = 'UGX'): string {
  return `${currency} ${(Number(minor || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export const V24OrdersInventoryManufacturingView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = useMemo(
    () => ({ userId: currentUser?.id || 'usr_buyer_01', userRole: role }),
    [currentUser?.id, role]
  );

  const [tab, setTab] = useState<'ORDERS' | 'INVENTORY' | 'MANUFACTURING'>('ORDERS');
  const [participants, setParticipants] = useState<V24CommercialParticipant[]>([]);
  const [orders, setOrders] = useState<V24CommercialOrder[]>([]);
  const [warehouses, setWarehouses] = useState<V24WarehouseFacility[]>([]);
  const [inventory, setInventory] = useState<V24InventoryItem[]>([]);
  const [movements, setMovements] = useState<V24StockMovement[]>([]);
  const [reconcile, setReconcile] = useState<any>(null);
  const [boms, setBoms] = useState<V24BillOfMaterials[]>([]);
  const [productionOrders, setProductionOrders] = useState<V24ProductionOrder[]>([]);

  // Order form
  const [orderType, setOrderType] = useState<V24OrderType>('B2B');
  const [sellerPartId, setSellerPartId] = useState<string>('PRTC-V24-001');
  const [selectedInvId, setSelectedInvId] = useState<string>('INV-V24-001');
  const [orderQty, setOrderQty] = useState<number>(2);
  const [unitPriceMajor, setUnitPriceMajor] = useState<number>(250000);
  const [deliveryAddr, setDeliveryAddr] = useState<string>('Industrial Area Plot 14, Kampala');

  // Receive Stock form
  const [recvItemId, setRecvItemId] = useState<string>('INV-V24-001');
  const [recvQty, setRecvQty] = useState<number>(10);
  const [recvBatch, setRecvBatch] = useState<string>('BCH-2026-NEW');

  // Stock Operation form
  const [adjItemId, setAdjItemId] = useState<string>('INV-V24-001');
  const [adjOp, setAdjOp] = useState<'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED' | 'TRANSFER'>('ADJUSTMENT');
  const [adjQty, setAdjQty] = useState<number>(1);
  const [targetWhId, setTargetWhId] = useState<string>('WH-V24-002');
  const [adjReason, setAdjReason] = useState<string>('Cycle count verification');

  // Production Batch execution
  const [goodQty, setGoodQty] = useState<number>(22);
  const [wasteQty, setWasteQty] = useState<number>(2);
  const [labourCostMajor, setLabourCostMajor] = useState<number>(180000);

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partRes, ordRes, whRes, invRes, movRes, recRes, bomRes, poRes] = await Promise.all([
        ApiClient.v24GetParticipants({}, actor),
        ApiClient.v24GetOrders(actor),
        ApiClient.v24GetWarehouses(actor),
        ApiClient.v24GetInventory(undefined, actor),
        ApiClient.v24GetInventoryMovements(undefined, actor),
        ApiClient.v24ReconcileInventory(actor),
        ApiClient.v24GetBoms(actor),
        ApiClient.v24GetProductionOrders(actor),
      ]);
      setParticipants(partRes.participants || []);
      setOrders(ordRes.orders || []);
      setWarehouses(whRes.warehouses || []);
      setInventory(invRes.items || []);
      setMovements(movRes.movements || []);
      setReconcile(recRes);
      setBoms(bomRes.boms || []);
      setProductionOrders(poRes.productionOrders || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Orders, Inventory & Manufacturing.');
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myParticipant = useMemo(
    () => participants.find((p) => p.userId === actor.userId || p.authorizedRepresentatives.some((r) => r.userId === actor.userId)),
    [participants, actor.userId]
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const inv = inventory.find((i) => i.id === selectedInvId);
      const res = await ApiClient.v24CreateOrder(
        {
          orderType,
          buyerParticipantId: myParticipant?.id,
          sellerParticipantId: sellerPartId,
          items: [
            {
              inventoryItemId: inv?.id,
              sku: inv?.sku,
              title: inv ? inv.name : 'Commercial Supply Lot',
              quantityOrdered: orderQty,
              unitOfMeasure: inv?.unitOfMeasure || 'UNIT',
              unitPriceMinor: Math.round(unitPriceMajor * 100),
            },
          ],
          currency: 'UGX',
          deliveryLocation: deliveryAddr,
          allowPartialFulfilment: true,
          submitImmediately: true,
        },
        actor
      );
      setFeedback(
        `Created order ${res.order?.orderNumber} (${res.order?.status}) with UNPAID obligation ${res.order?.paymentObligationId || res.obligation?.id}.`
      );
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Order creation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleTransitionOrder = async (order: V24CommercialOrder, nextStatus: string) => {
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, any> = { nextStatus };
      if (nextStatus === 'ORDER_INSPECTED') payload.inspectionResult = 'PASSED';
      if (nextStatus === 'ORDER_DELIVERED') payload.deliveryEvidenceRef = `POD-${order.orderNumber}`;
      await ApiClient.v24TransitionOrder(order.id, payload, actor);
      setFeedback(`Order ${order.orderNumber} transitioned to ${nextStatus}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Order transition rejected.');
    } finally {
      setBusy(false);
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const item = inventory.find((i) => i.id === recvItemId);
      await ApiClient.v24ReceiveInventory(
        {
          inventoryItemId: recvItemId,
          quantity: recvQty,
          batchNumber: recvBatch,
          expectedVersion: item?.version,
        },
        actor
      );
      setFeedback(`Received ${recvQty} units into ${recvItemId}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Inventory receipt failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const item = inventory.find((i) => i.id === adjItemId);
      await ApiClient.v24AdjustInventory(
        {
          inventoryItemId: adjItemId,
          operation: adjOp,
          quantity: adjQty,
          targetWarehouseId: adjOp === 'TRANSFER' ? targetWhId : undefined,
          reason: adjReason,
          expectedVersion: item?.version,
        },
        actor
      );
      setFeedback(`Stock ${adjOp} applied to ${adjItemId}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Stock adjustment failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleExecuteProduction = async (poId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24ExecuteProductionBatch(
        poId,
        {
          producedGoodQty: goodQty,
          rejectedOrWastageQty: wasteQty,
          actualLabourCostMinor: Math.round(labourCostMajor * 100),
        },
        actor
      );
      setFeedback(
        `Executed ${res.productionOrder?.productionNumber}: produced ${res.productionOrder?.producedGoodQty} good, ${res.productionOrder?.rejectedOrWastageQty} wastage.`
      );
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Production execution failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#D4AF37]">ECONEX V24.0 · Fulfilment & Supply Operations</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Orders, ATP Warehousing & Manufacturing Engine
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              18-state commercial order engine · ATP = Physical - Reserved (negative stock blocked) · Optimistic concurrency locks · BOM wastage & operational cost variance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-[#27272a] bg-[#181818] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v24-documents-settlement')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
            >
              Pay Obligations
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 p-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg w-fit">
          {(
            [
              { id: 'ORDERS', label: `Commercial Orders (${orders.length})` },
              { id: 'INVENTORY', label: `Warehouses & ATP (${inventory.length})` },
              { id: 'MANUFACTURING', label: `Manufacturing & BOM (${productionOrders.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                tab === t.id ? 'bg-[#D4AF37] text-[#050505] font-semibold' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div role="alert" className="bg-red-950/30 border border-red-800 rounded-xl px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl px-4 py-3 text-xs text-emerald-300">
          {feedback}
        </div>
      )}

      {tab === 'ORDERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateOrder} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
              <PackageCheck size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Place Order (With ATP Reservation)</span>
            </div>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Order Type</span>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as V24OrderType)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                {ORDER_TYPES.map((ot) => (
                  <option key={ot} value={ot}>
                    {ot}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Seller Participant</span>
              <select
                value={sellerPartId}
                onChange={(e) => setSellerPartId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} ({p.id})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Inventory SKU</span>
              <select
                value={selectedInvId}
                onChange={(e) => setSelectedInvId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.sku} — {i.name} (ATP: {i.availableToPromiseQty})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Unit Price (UGX)</span>
                <input
                  type="number"
                  min={1}
                  value={unitPriceMajor}
                  onChange={(e) => setUnitPriceMajor(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </label>
            </div>
            <input
              value={deliveryAddr}
              onChange={(e) => setDeliveryAddr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Submit Commercial Order
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              Commercial Orders ({orders.length})
            </h2>
            <div className="divide-y divide-[#27272a] text-xs">
              {orders.map((o) => (
                <div key={o.id} className="py-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-medium text-sm text-[#F5F5F5]">
                      {o.orderNumber} · {o.orderType}
                    </div>
                    <div className="font-mono text-[#D4AF37]">{o.status}</div>
                  </div>
                  <div className="text-[#A0A0A0] font-mono tabular-nums">
                    Total: {fmtMinor(o.totalMinor, o.currency)} · Buyer: {o.buyerParticipantId} · Seller:{' '}
                    {o.sellerParticipantId} · Obligation: {o.paymentObligationId || 'None'}
                  </div>
                  <div className="text-[#A0A0A0]">
                    Items: {o.items.map((it) => `${it.title} (${it.quantityFulfilled}/${it.quantityOrdered})`).join(', ')}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {o.status === 'ORDER_SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleTransitionOrder(o, 'ORDER_ACCEPTED')}
                        className="px-3 py-1.5 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                      >
                        Accept Order
                      </button>
                    )}
                    {o.status === 'ORDER_ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => handleTransitionOrder(o, 'ORDER_CONFIRMED')}
                        className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                      >
                        Confirm
                      </button>
                    )}
                    {o.status === 'ORDER_CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => handleTransitionOrder(o, 'ORDER_DISPATCHED')}
                        className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                      >
                        Dispatch Stock
                      </button>
                    )}
                    {(o.status === 'ORDER_DISPATCHED' || o.status === 'ORDER_IN_TRANSIT') && (
                      <button
                        type="button"
                        onClick={() => handleTransitionOrder(o, 'ORDER_DELIVERED')}
                        className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {o.status === 'ORDER_DELIVERED' && (
                      <button
                        type="button"
                        onClick={() => handleTransitionOrder(o, 'ORDER_INSPECTED')}
                        className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                      >
                        Pass Inspection
                      </button>
                    )}
                    {o.status === 'ORDER_INSPECTED' && (
                      <button
                        type="button"
                        onClick={() => handleTransitionOrder(o, 'ORDER_COMPLETED')}
                        className="px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                      >
                        Complete Order
                      </button>
                    )}
                    {!['ORDER_COMPLETED', 'ORDER_CANCELLED', 'ORDER_REJECTED'].includes(o.status) && (
                      <button
                        type="button"
                        onClick={() => handleTransitionOrder(o, 'ORDER_CANCELLED')}
                        className="px-3 py-1.5 rounded border border-red-800 text-red-300 cursor-pointer"
                      >
                        Cancel & Release Stock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((w) => (
              <div key={w.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-[#F5F5F5] flex items-center gap-2">
                    <Warehouse size={15} className="text-[#D4AF37]" aria-hidden="true" />
                    {w.name}
                  </span>
                  <span className="font-mono text-[#D4AF37]">{w.status}</span>
                </div>
                <div className="text-[#A0A0A0]">
                  {w.districtOrCity} ({w.countryCode}) · Capacity: <span className="font-mono tabular-nums">{w.usedCapacityUnits}/{w.maxCapacityUnits}</span>
                </div>
                <div className="text-[#71717a] font-mono">{w.facilityType}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleReceiveStock} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs">
              <h2 className="text-sm font-display font-semibold text-[#F5F5F5]">Receive Warehouse Stock</h2>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={recvItemId}
                  onChange={(e) => setRecvItemId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.sku}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={recvQty}
                  onChange={(e) => setRecvQty(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
                <input
                  value={recvBatch}
                  onChange={(e) => setRecvBatch(e.target.value)}
                  placeholder="Batch #"
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
              >
                Post Stock Receipt
              </button>
            </form>

            <form onSubmit={handleAdjustStock} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs">
              <h2 className="text-sm font-display font-semibold text-[#F5F5F5]">
                Stock Adjustment / Damage / Inter-Warehouse Transfer
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={adjItemId}
                  onChange={(e) => setAdjItemId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.sku}
                    </option>
                  ))}
                </select>
                <select
                  value={adjOp}
                  onChange={(e) => setAdjOp(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                  <option value="DAMAGED">DAMAGED</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="TRANSFER">TRANSFER</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={adjQty}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </div>
              {adjOp === 'TRANSFER' && (
                <select
                  value={targetWhId}
                  onChange={(e) => setTargetWhId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      Destination: {w.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] font-semibold cursor-pointer"
              >
                Apply Stock Operation
              </button>
            </form>
          </div>

          <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                ATP Inventory Ledger · Balanced: {String(reconcile?.balanced ?? true)}
              </h2>
              <span className="font-mono text-[#A0A0A0]">{movements.length} immutable stock movements</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#27272a] text-[#A0A0A0]">
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Item</th>
                    <th className="py-2 pr-3 text-right">Physical</th>
                    <th className="py-2 pr-3 text-right">Reserved</th>
                    <th className="py-2 pr-3 text-right">ATP</th>
                    <th className="py-2 pr-3 text-right">Reorder Min</th>
                    <th className="py-2 pr-3 text-right">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f24] font-mono tabular-nums">
                  {inventory.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5 pr-3 text-[#D4AF37]">{i.sku}</td>
                      <td className="py-2.5 pr-3 font-sans text-[#F5F5F5]">{i.name}</td>
                      <td className="py-2.5 pr-3 text-right text-[#F5F5F5]">{i.physicalQty}</td>
                      <td className="py-2.5 pr-3 text-right text-amber-400">{i.reservedQty}</td>
                      <td className="py-2.5 pr-3 text-right text-emerald-400 font-bold">{i.availableToPromiseQty}</td>
                      <td className="py-2.5 pr-3 text-right text-[#A0A0A0]">{i.reorderThresholdQty}</td>
                      <td className="py-2.5 pr-3 text-right text-[#A0A0A0]">v{i.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'MANUFACTURING' && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Factory size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                Bills of Materials & Production Orders
              </h2>
            </div>
            <div className="divide-y divide-[#27272a] text-xs">
              {boms.map((b) => (
                <div key={b.id} className="py-3 space-y-1">
                  <div className="font-medium text-sm text-[#F5F5F5]">
                    {b.productName} ({b.finishedSku})
                  </div>
                  <div className="text-[#A0A0A0] font-mono">
                    Work Centre: {b.workCentre} · Est Unit Cost: {fmtMinor(b.estimatedUnitCostMinor, b.currency)} ·{' '}
                    {b.costStatementNotice}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-display font-semibold text-[#F5F5F5]">
              Production Orders ({productionOrders.length})
            </h3>
            <div className="grid grid-cols-3 gap-3 max-w-xl">
              <label className="space-y-1">
                <span className="text-[#A0A0A0]">Good Qty</span>
                <input
                  type="number"
                  min={0}
                  value={goodQty}
                  onChange={(e) => setGoodQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[#A0A0A0]">Wastage/Reject</span>
                <input
                  type="number"
                  min={0}
                  value={wasteQty}
                  onChange={(e) => setWasteQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[#A0A0A0]">Labour (UGX)</span>
                <input
                  type="number"
                  min={0}
                  value={labourCostMajor}
                  onChange={(e) => setLabourCostMajor(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </label>
            </div>
            <div className="divide-y divide-[#27272a]">
              {productionOrders.map((po) => (
                <div key={po.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium text-sm text-[#F5F5F5]">
                      {po.productionNumber} · Target {po.targetQuantity} · Batch {po.finishedBatchNumber}
                    </div>
                    <div className="text-[#A0A0A0] font-mono tabular-nums">
                      Status: {po.status} · Good: {po.producedGoodQty} · Wastage: {po.rejectedOrWastageQty} ·
                      Est: {fmtMinor(po.estimatedCostMinor, po.currency)} · Actual:{' '}
                      {fmtMinor(po.actualOperationalCostMinor, po.currency)} · Variance:{' '}
                      {fmtMinor(po.costVarianceMinor, po.currency)}
                    </div>
                  </div>
                  {po.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => handleExecuteProduction(po.id)}
                      disabled={busy}
                      className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer shrink-0"
                    >
                      Execute Batch
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
