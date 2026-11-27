/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Agricultural Marketplace Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { MarketplaceListing, CropCategory, Order } from '../../types/index.ts';
import {
  Search,
  Filter,
  MapPin,
  Tag,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';
import { EconexImage } from '../ux/EconexImage.tsx';
import { resolveMarketplaceAsset } from '../../config/econexAssetManifest.ts';

interface MarketplaceViewProps {
  onOrderCreated: (order: Order) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onOrderCreated }) => {
  const { currentUser } = useAuth();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceListing | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Order Placement Form
  const [orderForm, setOrderForm] = useState({
    quantity: 100,
    deliveryDistrict: currentUser?.district || 'Kampala',
    deliveryAddress: 'Plot 48, Industrial Area 7th Street, Kampala',
    specialInstructions: 'Direct offload at warehouse bay 2. Morning delivery preferred.',
  });

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Commodities' },
    { id: 'GRAINS_CEREALS', label: 'Grains & Cereals' },
    { id: 'COFFEE_CASH_CROPS', label: 'Coffee & Cash Crops' },
    { id: 'LEGUMES_PULSES', label: 'Legumes & Pulses' },
    { id: 'TUBERS_ROOTS', label: 'Tubers & Bananas' },
    { id: 'FRUITS_VEGETABLES', label: 'Fruits & Vegetables' },
  ];

  const districts = ['ALL', 'Mbale', 'Kampala', 'Gulu', 'Jinja', 'Kasese', 'Mbarara', 'Masaka'];

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.getListings({
        q: searchQuery || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        district: selectedDistrict !== 'ALL' ? selectedDistrict : undefined,
      });
      setListings(data);
    } catch (err: any) {
      console.error('Failed to load listings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedDistrict]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFeedbackMsg({ type: 'error', text: 'You must be logged in to place an order.' });
      return;
    }
    if (!selectedProduct) return;

    try {
      const order = await ApiClient.createOrder({
        buyerId: currentUser.id,
        listingId: selectedProduct.id,
        quantity: Number(orderForm.quantity),
        deliveryDistrict: orderForm.deliveryDistrict,
        deliveryAddress: orderForm.deliveryAddress,
        specialInstructions: orderForm.specialInstructions,
      });

      setOrderModalOpen(false);
      setSelectedProduct(null);
      setFeedbackMsg({
        type: 'success',
        text: `Order #${order.orderNumber} placed successfully! Value: ${order.totalAmountUGX.toLocaleString()} UGX. Check Order Pipeline for status.`,
      });
      onOrderCreated(order);
      await fetchListings();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Order placement failed.' });
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

      {/* Hero Search & Filter Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#F5F5F5] tracking-tight">Agricultural Commodity Marketplace</h1>
            <p className="text-xs text-[#A0A0A0]">
              Direct wholesale and farm-gate exchange with verified Ugandan growers, cooperatives, and aggregators.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#A0A0A0]">Standard Currency:</span>
            <span className="font-mono font-bold text-[#D4AF37] bg-[#18181b] border border-[#3f3f46] px-2 py-0.5 rounded">
              UGX (Ugandan Shilling)
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-[#71717a]" />
            <input
              type="text"
              placeholder="Search by commodity, variety (e.g. Arabica AA, Longe 5D Maize, Maksoy), producer, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F5F5F5] placeholder-[#71717a] focus:border-[#D4AF37] outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            Search
          </button>
        </form>

        {/* Category Pills & District Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1e1e24]">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#D4AF37] text-black font-semibold'
                    : 'bg-[#18181b] text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#222226]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#71717a] flex items-center gap-1">
              <MapPin size={13} /> Region:
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-[#F5F5F5] text-xs rounded px-2.5 py-1 focus:border-[#D4AF37] outline-none"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Uganda Districts' : `${d} District`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Produce Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-xs text-[#A0A0A0]">
            Loading active commodity listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="col-span-full bg-[#121212] border border-[#27272a] rounded-xl p-12 text-center text-xs text-[#A0A0A0]">
            No listings found matching your search and category filter. Try clearing filters.
          </div>
        ) : (
          listings.map((item) => {
            const media = resolveMarketplaceAsset({
              imageUrl: item.imageUrl,
              title: item.title,
              category: item.category,
            });
            return (
              <div
                key={item.id}
                className="bg-[#121212] border border-[#27272a] hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 shadow-md group"
              >
                <EconexImage
                  src={media.path}
                  alt={item.title || media.alt}
                  fallbackLabel={item.title}
                  aspectClassName="h-44 w-full"
                  overlayGradient
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                  <div>
                    <div className="text-[11px] text-[#D4AF37] font-medium mb-1">
                      {item.category.replace(/_/g, ' ')}
                      {item.qualityGrade ? ` · ${item.qualityGrade}` : ''}
                      {item.organicCertified ? ' · Organic' : ''}
                    </div>
                    <h3 className="font-bold text-[#F5F5F5] text-sm line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[#A0A0A0] text-[11px] line-clamp-2 mt-1">{item.description}</p>
                  </div>

                  {/* Seller & Location */}
                  <div className="bg-[#09090b] p-2.5 rounded-xl border border-[#1f1f23] text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-[#F5F5F5]">
                      <span className="truncate font-medium">{item.sellerName}</span>
                      {item.isVerifiedSeller && (
                        <span className="text-emerald-400 flex items-center gap-0.5 shrink-0 text-[10px]">
                          <ShieldCheck size={12} aria-hidden="true" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[#A0A0A0] text-[10px] tabular-nums">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-[#D4AF37]" aria-hidden="true" /> {item.district}
                      </span>
                      <span>Min: {item.minimumOrder} {item.unit}</span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-[#D4AF37] tabular-nums">
                        {item.pricePerUnitUGX.toLocaleString()} <span className="text-[10px] font-normal text-[#A0A0A0]">UGX/{item.unit}</span>
                      </div>
                      <div className="text-[10px] text-[#A0A0A0] tabular-nums">
                        Stock: {item.quantityAvailable.toLocaleString()} {item.unit}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(item);
                        setOrderForm((prev) => ({
                          ...prev,
                          quantity: Math.max(item.minimumOrder, Math.min(100, item.quantityAvailable)),
                        }));
                        setOrderModalOpen(true);
                      }}
                      className="min-h-[38px] px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Buy <ArrowRight size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Place Purchase Order */}
      {orderModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={16} className="text-[#D4AF37]" /> Place Agricultural Purchase Order
                </h3>
                <p className="text-[11px] text-[#A0A0A0]">Direct B2B and wholesale purchase contract</p>
              </div>
              <button
                onClick={() => {
                  setOrderModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-[#A0A0A0] hover:text-[#F5F5F5]"
              >
                ✕
              </button>
            </div>

            {/* Product summary pill */}
            <div className="bg-[#18181b] p-3 rounded-lg border border-[#27272a] text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-[#F5F5F5]">{selectedProduct.title}</div>
                <div className="text-[#A0A0A0] text-[11px]">
                  Seller: {selectedProduct.sellerName} • {selectedProduct.district}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-[#D4AF37]">
                  {selectedProduct.pricePerUnitUGX.toLocaleString()} UGX / {selectedProduct.unit}
                </div>
                <div className="text-[10px] text-[#71717a]">
                  Max Available: {selectedProduct.quantityAvailable} {selectedProduct.unit}
                </div>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">
                  Order Quantity ({selectedProduct.unit}) * (Min: {selectedProduct.minimumOrder})
                </label>
                <input
                  type="number"
                  min={selectedProduct.minimumOrder}
                  max={selectedProduct.quantityAvailable}
                  required
                  value={orderForm.quantity}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || selectedProduct.minimumOrder })
                  }
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Destination District *</label>
                  <input
                    type="text"
                    required
                    value={orderForm.deliveryDistrict}
                    onChange={(e) => setOrderForm({ ...orderForm, deliveryDistrict: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={orderForm.deliveryAddress}
                    onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Logistics / Offloading Instructions</label>
                <textarea
                  rows={2}
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Price Calculation Card */}
              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] text-xs space-y-1">
                <div className="flex justify-between text-[#A0A0A0]">
                  <span>Subtotal ({orderForm.quantity} {selectedProduct.unit}):</span>
                  <span className="font-mono text-[#F5F5F5]">
                    {(orderForm.quantity * selectedProduct.pricePerUnitUGX).toLocaleString()} UGX
                  </span>
                </div>
                <div className="flex justify-between text-[#A0A0A0]">
                  <span>Estimated Freight Fee (UG Freight Grid):</span>
                  <span className="font-mono text-[#F5F5F5]">
                    {(orderForm.deliveryDistrict.toLowerCase() === selectedProduct.district.toLowerCase() ? 50000 : 250000).toLocaleString()} UGX
                  </span>
                </div>
                <div className="pt-2 border-t border-[#1e1e24] flex justify-between font-bold text-sm">
                  <span className="text-[#F5F5F5]">Total Order Value:</span>
                  <span className="font-mono text-[#D4AF37]">
                    {(
                      orderForm.quantity * selectedProduct.pricePerUnitUGX +
                      (orderForm.deliveryDistrict.toLowerCase() === selectedProduct.district.toLowerCase() ? 50000 : 250000)
                    ).toLocaleString()}{' '}
                    UGX
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderModalOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded shadow-md"
                >
                  Submit Order Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
