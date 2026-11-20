/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Visual Accessible Marketplace
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { MarketplaceListing } from '../../types/index.ts';
import { ProductCard } from '../ux/DomainCards.tsx';
import { AccessibleDialog, EmptyState, ErrorRecoveryPanel } from '../ux/CorePrimitives.tsx';
import { formatMoney } from '../../i18n/econexTranslations.ts';

import coffeeImg from '../../assets/images/uganda_coffee_harvest_1794827462481.jpg';
import maizeImg from '../../assets/images/uganda_maize_grain_1794827462265.jpg';
import produceImg from '../../assets/images/uganda_fresh_produce_1794827463494.jpg';
import truckImg from '../../assets/images/econex_logistics_truck_1794827463870.jpg';

export function resolveListingImage(listing: MarketplaceListing): string {
  if (listing.imageUrl) return listing.imageUrl;
  const text = `${listing.title} ${listing.category}`.toLowerCase();
  if (text.includes('coffee') || text.includes('tea') || text.includes('cocoa')) return coffeeImg;
  if (text.includes('maize') || text.includes('grain') || text.includes('bean') || text.includes('rice') || text.includes('sesame')) {
    return maizeImg;
  }
  if (text.includes('transport') || text.includes('truck') || text.includes('freight') || text.includes('logistics')) {
    return truckImg;
  }
  return produceImg;
}

export const MarketplaceVisualView: React.FC<{ onOrderCreated: () => void; onNavigate: (tab: string) => void }> = ({
  onOrderCreated,
  onNavigate,
}) => {
  const { currentUser, role } = useAuth();
  const { language } = useExperience();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_LOW' | 'PRICE_HIGH'>('NEWEST');

  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [deliveryDistrict, setDeliveryDistrict] = useState(currentUser?.district || 'Kampala');
  const [deliveryAddress, setDeliveryAddress] = useState('Central Trading Market');
  const [placing, setPlacing] = useState(false);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getListings({ status: 'ACTIVE' });
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const districts = useMemo(
    () => Array.from(new Set(listings.map((l) => l.district).filter(Boolean))).sort(),
    [listings]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = listings.filter((l) => {
      if (categoryFilter !== 'ALL' && l.category !== categoryFilter) return false;
      if (districtFilter !== 'ALL' && l.district !== districtFilter) return false;
      if (verifiedOnly && !l.isVerifiedSeller) return false;
      if (q && !`${l.title} ${l.description} ${l.sellerName} ${l.district}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortBy === 'PRICE_LOW') return [...list].sort((a, b) => a.pricePerUnitUGX - b.pricePerUnitUGX);
    if (sortBy === 'PRICE_HIGH') return [...list].sort((a, b) => b.pricePerUnitUGX - a.pricePerUnitUGX);
    return list;
  }, [listings, query, categoryFilter, districtFilter, verifiedOnly, sortBy]);

  const handleConfirmOrder = async () => {
    if (!selectedListing || !currentUser) return;
    setPlacing(true);
    setOrderNotice(null);
    try {
      await ApiClient.createOrder(
        {
          buyerId: currentUser.id,
          listingId: selectedListing.id,
          quantity: orderQty,
          deliveryDistrict,
          deliveryAddress,
        },
        `V151-ORD-${Date.now()}`
      );
      setSelectedListing(null);
      setOrderNotice('Order placed! Check My Activity to track seller confirmation and payment.');
      onOrderCreated();
    } catch (err: any) {
      setOrderNotice(err?.message || 'Could not place order. Check quantity and try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Explore Marketplace</h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Browse real produce, farm inputs, and goods from verified growers and local traders across Uganda and East Africa.
          </p>
        </div>

        {/* Search & Plain Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search size={18} className="absolute left-3.5 top-3.5 text-[#A0A0A0]" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search marketplace products"
              placeholder="Search maize, coffee, beans, seeds..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="md:col-span-3 min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
          >
            <option value="ALL">All Categories</option>
            <option value="COFFEE_CASH_CROPS">Coffee &amp; Cash Crops</option>
            <option value="GRAINS_CEREALS">Grains &amp; Maize</option>
            <option value="FRUITS_VEGETABLES">Fruits &amp; Vegetables</option>
            <option value="LEGUMES_PULSES">Beans &amp; Pulses</option>
            <option value="SEEDS_FERTILIZERS">Seeds &amp; Farm Inputs</option>
          </select>

          <select
            aria-label="Filter by district"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="md:col-span-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
          >
            <option value="ALL">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            aria-label="Sort products"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="md:col-span-2 min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
          >
            <option value="NEWEST">Recommended</option>
            <option value="PRICE_LOW">Lowest Price First</option>
            <option value="PRICE_HIGH">Highest Price First</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="inline-flex items-center gap-2 text-[#C0C0C0] cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 accent-[#D4AF37]"
            />
            <span>Show verified sellers only</span>
          </label>
          <span className="text-[#A0A0A0] inline-flex items-center gap-1.5">
            <SlidersHorizontal size={13} aria-hidden="true" />
            <span>Showing {filtered.length} available items</span>
          </span>
        </div>
      </div>

      {orderNotice && (
        <div className="p-4 rounded-2xl bg-[#181818] border border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-2">
          <CheckCircle2 size={18} className="text-[#D4AF37]" aria-hidden="true" />
          <span>{orderNotice}</span>
        </div>
      )}

      {error !== null && (
        <ErrorRecoveryPanel
          error={error}
          isAdmin={role === 'PLATFORM_ADMIN'}
          onRetry={loadListings}
          onGoHome={() => onNavigate('home')}
          onOpenHelp={() => onNavigate('help')}
        />
      )}

      {loading ? (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-8 text-center text-sm text-[#A0A0A0]">
          Loading available items...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={22} />}
          title="No products matched your search"
          description="Try clearing a filter or searching another district."
          actionLabel="Clear Filters"
          onAction={() => {
            setQuery('');
            setCategoryFilter('ALL');
            setDistrictFilter('ALL');
            setVerifiedOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <ProductCard
              key={item.id}
              title={item.title}
              price={item.pricePerUnitUGX}
              currency={item.currency || 'UGX'}
              unit={item.unit.replace('_', ' ')}
              sellerName={item.sellerName}
              location={item.district}
              availabilityText={`${item.quantityAvailable} ${item.unit.replace('_', ' ')} ready`}
              verifiedSeller={item.isVerifiedSeller}
              imageUrl={resolveListingImage(item)}
              actionLabel={item.sellerId === currentUser?.id ? 'Your Listing' : 'Order Now'}
              onAction={() => {
                setSelectedListing(item);
                setOrderQty(item.minimumOrder || 1);
              }}
            />
          ))}
        </div>
      )}

      {/* Guided Order Confirmation Dialog */}
      <AccessibleDialog
        isOpen={Boolean(selectedListing)}
        title="Confirm Your Order"
        onClose={() => setSelectedListing(null)}
      >
        {selectedListing && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-1">
              <div className="font-semibold text-[#F5F5F5]">{selectedListing.title}</div>
              <div className="text-xs text-[#A0A0A0]">Seller: {selectedListing.sellerName} · {selectedListing.district}</div>
              <div className="text-base font-bold text-[#D4AF37] tabular-nums">
                {formatMoney(selectedListing.pricePerUnitUGX, 'UGX', language)} / {selectedListing.unit.replace('_', ' ')}
              </div>
            </div>

            <div>
              <label htmlFor="ord-qty" className="block text-xs text-[#C0C0C0] mb-1">
                Quantity ({selectedListing.unit.replace('_', ' ')}) — Max {selectedListing.quantityAvailable}
              </label>
              <input
                id="ord-qty"
                type="number"
                min={selectedListing.minimumOrder || 1}
                max={selectedListing.quantityAvailable}
                value={orderQty}
                onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5] tabular-nums"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ord-dist" className="block text-xs text-[#C0C0C0] mb-1">Delivery District</label>
                <input
                  id="ord-dist"
                  type="text"
                  value={deliveryDistrict}
                  onChange={(e) => setDeliveryDistrict(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
              <div>
                <label htmlFor="ord-addr" className="block text-xs text-[#C0C0C0] mb-1">Drop-off Location</label>
                <input
                  id="ord-addr"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181818] border border-[#27272a] flex items-center justify-between text-sm">
              <span className="text-[#C0C0C0]">Subtotal (before delivery fee)</span>
              <strong className="text-[#D4AF37] tabular-nums">
                {formatMoney(selectedListing.pricePerUnitUGX * orderQty, 'UGX', language)}
              </strong>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={placing}
                onClick={handleConfirmOrder}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold cursor-pointer disabled:opacity-50"
              >
                {placing ? 'Sending Order...' : 'Place Order'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedListing(null)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#C0C0C0] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </AccessibleDialog>
    </div>
  );
};
