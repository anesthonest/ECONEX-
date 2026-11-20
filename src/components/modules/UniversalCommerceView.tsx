/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V6.0 - Universal Commercial Exchange (AETHER COMMERCE)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.ts';
import {
  CommercialCatalogueItem,
  CommercialOrderV6,
  CommercialInvoice,
  CommercialDispute,
  EconomicSector,
} from '../../types/index.ts';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  FileCheck2,
  FileText,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';

export const UniversalCommerceView: React.FC = () => {
  const [catalogue, setCatalogue] = useState<CommercialCatalogueItem[]>([]);
  const [orders, setOrders] = useState<CommercialOrderV6[]>([]);
  const [invoices, setInvoices] = useState<CommercialInvoice[]>([]);
  const [disputes, setDisputes] = useState<CommercialDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CATALOGUE' | 'ORDERS' | 'INVOICES' | 'DISPUTES'>('CATALOGUE');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // New Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CommercialCatalogueItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [orderDeliveryAddress, setOrderDeliveryAddress] = useState('Plot 48, Industrial Area 7th Street, Kampala');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  // New Catalogue Item Modal State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatSector, setNewCatSector] = useState<EconomicSector>('MANUFACTURING');
  const [newCatPrice, setNewCatPrice] = useState<number>(150000);
  const [newCatQty, setNewCatQty] = useState<number>(500);
  const [newCatMetric, setNewCatMetric] = useState('Units');
  const [newCatDesc, setNewCatDesc] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catList, ordList, invList, dspList] = await Promise.all([
        api.getCommercialCatalogue(),
        api.getCommercialOrders(),
        api.getCommercialInvoices(),
        api.getCommercialDisputes(),
      ]);
      setCatalogue(Array.isArray(catList) ? catList : []);
      setOrders(Array.isArray(ordList) ? ordList : []);
      setInvoices(Array.isArray(invList) ? invList : []);
      setDisputes(Array.isArray(dspList) ? dspList : []);
    } catch (err) {
      console.error('Failed to load commerce data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setOrderSubmitting(true);
    setOrderSuccessMsg('');
    try {
      const res = await api.createCommercialOrder({
        buyerId: 'PART-UG-001',
        sellerId: selectedItem.supplierId,
        sector: selectedItem.sector,
        items: [
          {
            itemId: selectedItem.id,
            title: selectedItem.title,
            quantity: Number(orderQuantity),
            unitPrice: selectedItem.unitPrice,
            currency: selectedItem.currency,
          },
        ],
        shippingAddress: orderDeliveryAddress,
      });
      setOrderSuccessMsg(`Order ${res.order.orderNumber} placed & Invoice ${res.invoice.invoiceNumber} generated.`);
      setTimeout(() => {
        setShowOrderModal(false);
        setSelectedItem(null);
        setOrderSuccessMsg('');
        fetchData();
      }, 1500);
    } catch (err: any) {
      setOrderSuccessMsg(`Error: ${err.message || 'Failed to place order'}`);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleCreateCatalogueItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle || !newCatPrice) return;
    try {
      await api.createCommercialCatalogueItem({
        supplierId: 'PART-UG-001',
        title: newCatTitle,
        description: newCatDesc,
        sector: newCatSector,
        category: `${newCatSector} Supply`,
        unitPrice: Number(newCatPrice),
        currency: 'UGX',
        availableQuantity: Number(newCatQty),
        unitMetric: newCatMetric,
        country: 'UG',
      });
      setShowAddCatModal(false);
      setNewCatTitle('');
      setNewCatDesc('');
      fetchData();
    } catch (err) {
      console.error('Failed to add catalogue item:', err);
    }
  };

  const filteredCatalogue = selectedSector === 'ALL'
    ? catalogue
    : catalogue.filter((item) => item.sector === selectedSector);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">ECONEX COMMERCE</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c1c1f] text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
              Universal Commercial Exchange
            </span>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Sector-independent commercial trade infrastructure supporting C2C, B2C, B2B, and B2G commerce across all industries.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab('CATALOGUE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'CATALOGUE' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            All-Sector Catalogue
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'ORDERS' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Commercial Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'INVOICES' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Invoices & Tax ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('DISPUTES')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'DISPUTES' ? 'bg-[#1e1e24] text-[#D4AF37] shadow-sm' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
            }`}
          >
            Disputes ({disputes.length})
          </button>
        </div>
      </div>

      {/* VIEW: CATALOGUE */}
      {activeTab === 'CATALOGUE' && (
        <div className="space-y-4">
          {/* Sector Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121212] p-3 rounded-lg border border-[#27272a]">
            <div className="flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
              <span className="text-[#A0A0A0] shrink-0 font-medium mr-1">Sector Filter:</span>
              {['ALL', 'MANUFACTURING', 'CONSTRUCTION', 'ENERGY', 'AGRICULTURE', 'SERVICES'].map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                    selectedSector === sector
                      ? 'bg-[#1e1e24] text-[#D4AF37] border border-[#D4AF37]/40 font-medium'
                      : 'text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#18181b]'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddCatModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded-md transition-colors shrink-0"
            >
              <Plus size={14} />
              <span>List Product / Service</span>
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalogue.map((item) => (
              <div key={item.id} className="bg-[#121212] border border-[#27272a] rounded-lg p-5 flex flex-col justify-between hover:border-[#D4AF37]/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                    <span className="font-mono text-[#D4AF37]">{item.sector}</span>
                    <span>{item.country}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F5F5F5] leading-snug">{item.title}</h3>
                  <p className="text-xs text-[#A0A0A0] line-clamp-2">{item.description}</p>

                  <div className="pt-2 text-[11px] text-[#71717a]">
                    Supplier: <strong className="text-[#A0A0A0]">{item.supplierName}</strong>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#1e1e24] flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#A0A0A0]">Price per {item.unitMetric}</div>
                    <div className="text-base font-bold font-mono text-[#F5F5F5] tabular-nums">
                      {item.unitPrice.toLocaleString()} {item.currency}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setShowOrderModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded transition-colors"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181b] border-b border-[#27272a] text-[#A0A0A0]">
              <tr>
                <th className="py-3 px-4 font-medium">Order Number</th>
                <th className="py-3 px-4 font-medium">Buyer</th>
                <th className="py-3 px-4 font-medium">Seller</th>
                <th className="py-3 px-4 font-medium">Sector</th>
                <th className="py-3 px-4 font-medium text-right">Total Amount</th>
                <th className="py-3 px-4 font-medium">Payment Status</th>
                <th className="py-3 px-4 font-medium">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e24] text-[#F5F5F5]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#71717a]">
                    No commercial orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#18181b]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{ord.orderNumber}</td>
                    <td className="py-3 px-4">{ord.buyerName}</td>
                    <td className="py-3 px-4">{ord.sellerName}</td>
                    <td className="py-3 px-4 text-[#A0A0A0]">{ord.sector}</td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums font-bold">
                      {ord.totalAmount.toLocaleString()} {ord.currency}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#A0A0A0]">{ord.fulfillmentStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW: INVOICES */}
      {activeTab === 'INVOICES' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#18181b] border-b border-[#27272a] text-[#A0A0A0]">
              <tr>
                <th className="py-3 px-4 font-medium">Invoice Number</th>
                <th className="py-3 px-4 font-medium">Issuer</th>
                <th className="py-3 px-4 font-medium">Recipient</th>
                <th className="py-3 px-4 font-medium text-right">Subtotal</th>
                <th className="py-3 px-4 font-medium text-right">Tax (18% VAT)</th>
                <th className="py-3 px-4 font-medium text-right">Total Payable</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e24] text-[#F5F5F5]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#71717a]">
                    No commercial invoices issued yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#18181b]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">{inv.issuerName}</td>
                    <td className="py-3 px-4">{inv.recipientName}</td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums">{inv.subtotal.toLocaleString()} {inv.currency}</td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums text-[#A0A0A0]">{inv.taxAmount.toLocaleString()} {inv.currency}</td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums font-bold text-emerald-400">{inv.totalAmount.toLocaleString()} {inv.currency}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#1c1c1f] text-[#A0A0A0] border border-[#3f3f46]">
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW: DISPUTES */}
      {activeTab === 'DISPUTES' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#F5F5F5]">Commercial Dispute Resolution Console</h3>
              <p className="text-xs text-[#A0A0A0]">Fair mediation and evidence-backed settlement for cross-sector transactions.</p>
            </div>
          </div>

          <div className="space-y-3">
            {disputes.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#71717a]">No active commercial disputes. Trade relations healthy.</div>
            ) : (
              disputes.map((d) => (
                <div key={d.id} className="p-4 bg-[#18181b] rounded-lg border border-[#27272a] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#D4AF37]">{d.disputeNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">{d.status}</span>
                  </div>
                  <div className="text-[#F5F5F5] font-medium">{d.reason}</div>
                  <div className="text-[#A0A0A0] text-[11px]">
                    Complainant: {d.complainantName} · Disputed Amount: {d.disputedAmount.toLocaleString()} {d.currency}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Order Placement */}
      {showOrderModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Place Commercial Purchase Order</h3>
            <div className="p-3 bg-[#18181b] rounded text-xs space-y-1">
              <div className="font-medium text-[#D4AF37]">{selectedItem.title}</div>
              <div className="text-[#A0A0A0]">Sector: {selectedItem.sector} · Price: {selectedItem.unitPrice.toLocaleString()} {selectedItem.currency}</div>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Order Quantity ({selectedItem.unitMetric})</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.availableQuantity}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Delivery Destination / Warehouse</label>
                <input
                  type="text"
                  value={orderDeliveryAddress}
                  onChange={(e) => setOrderDeliveryAddress(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div className="p-3 bg-[#18181b] rounded border border-[#27272a] flex justify-between items-center font-mono">
                <span className="text-[#A0A0A0]">Total Order Value:</span>
                <span className="text-sm font-bold text-emerald-400">
                  {(orderQuantity * selectedItem.unitPrice).toLocaleString()} {selectedItem.currency}
                </span>
              </div>

              {orderSuccessMsg && (
                <div className={`p-2 rounded text-xs ${orderSuccessMsg.startsWith('Error') ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                  {orderSuccessMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  {orderSubmitting ? 'Placing...' : 'Confirm Order & Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Catalogue Item */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-lg max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#F5F5F5]">List New Commercial Product / Service</h3>
            <form onSubmit={handleCreateCatalogueItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Steel Rebar 12mm"
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Economic Sector</label>
                <select
                  value={newCatSector}
                  onChange={(e) => setNewCatSector(e.target.value as EconomicSector)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                >
                  <option value="MANUFACTURING">MANUFACTURING</option>
                  <option value="CONSTRUCTION">CONSTRUCTION</option>
                  <option value="ENERGY">ENERGY</option>
                  <option value="AGRICULTURE">AGRICULTURE</option>
                  <option value="SERVICES">SERVICES</option>
                  <option value="TECHNOLOGY">TECHNOLOGY</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unit Price (UGX)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCatPrice}
                    onChange={(e) => setNewCatPrice(Number(e.target.value))}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unit Metric (e.g. MT, Unit)</label>
                  <input
                    type="text"
                    value={newCatMetric}
                    onChange={(e) => setNewCatMetric(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Available Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newCatQty}
                  onChange={(e) => setNewCatQty(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Product / Service Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-3 py-2 text-[#F5F5F5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-black bg-[#D4AF37] hover:bg-[#c49f27] rounded"
                >
                  Publish to Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
