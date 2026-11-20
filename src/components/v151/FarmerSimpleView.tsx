/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Simplified Farmer & Producer Experience + 7-Step Listing Creator
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import {
  Sprout,
  Tag,
  TrendingUp,
  Users,
  Briefcase,
  ShoppingBag,
  Truck,
  CreditCard,
  HelpCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useOffline } from '../../context/OfflineContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import {
  Farm,
  MarketplaceListing,
  CommodityPriceObservation,
  Order,
  CropCategory,
  ProductUnit,
  EconomicOpportunity,
} from '../../types/index.ts';
import { GuidedForm, EmptyState, StatusLabel } from '../ux/CorePrimitives.tsx';
import { OrderStatusCard, OpportunityCard } from '../ux/DomainCards.tsx';
import { formatMoney, formatShortDate } from '../../i18n/econexTranslations.ts';

type FarmerSubTab =
  | 'sell_wizard'
  | 'my_farm'
  | 'my_products'
  | 'market_prices'
  | 'find_buyers'
  | 'opportunities'
  | 'my_orders';

const UNIT_WEIGHT_CONVERSIONS: Record<string, { label: string; kgFactor: number }> = {
  KG: { label: 'Kilogram (kg)', kgFactor: 1 },
  BAG_50KG: { label: '50 kg Bag (1 Bag = 50 kg)', kgFactor: 50 },
  BAG_100KG: { label: '100 kg Bag (1 Bag = 100 kg)', kgFactor: 100 },
  TONNE: { label: 'Metric Tonne (1 Tonne = 1,000 kg)', kgFactor: 1000 },
  CRATE: { label: 'Crate (Approx. 1 Crate = 25 kg)', kgFactor: 25 },
  BUNCH: { label: 'Bunch (Matooke / Plantain)', kgFactor: 20 },
};

export const FarmerSimpleView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { isSimulatedOffline, queueOfflineAction } = useOffline();
  const { language } = useExperience();

  const [subTab, setSubTab] = useState<FarmerSubTab>('sell_wizard');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [prices, setPrices] = useState<CommodityPriceObservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [opportunities, setOpportunities] = useState<EconomicOpportunity[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  // 7-step product listing form state
  const [sellStep, setSellStep] = useState(1);
  const [productName, setProductName] = useState('Bugisu Arabica Coffee (Washed)');
  const [category, setCategory] = useState<CropCategory>('COFFEE_CASH_CROPS');
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<ProductUnit>('BAG_100KG');
  const [pricePerUnit, setPricePerUnit] = useState<number>(650000);
  const [district, setDistrict] = useState<string>(currentUser?.district || 'Mbale');
  const [description, setDescription] = useState('Clean, sun-dried harvest ready for collection or delivery.');
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  const loadData = async () => {
    const [fRes, lRes, pRes, oRes, oppRes, mRes] = await Promise.all([
      ApiClient.getFarms(currentUser?.id).catch(() => []),
      ApiClient.getListings({ sellerId: currentUser?.id }).catch(() => []),
      ApiClient.getPrices().catch(() => []),
      ApiClient.getOrders({ sellerId: currentUser?.id }).catch(() => []),
      ApiClient.getEconomicOpportunities().catch(() => []),
      ApiClient.getMatchingRecommendations().catch(() => []),
    ]);
    setFarms(Array.isArray(fRes) ? fRes : []);
    setMyListings(Array.isArray(lRes) ? lRes : []);
    setPrices(Array.isArray(pRes) ? pRes : []);
    setOrders(Array.isArray(oRes) ? oRes : []);
    setOpportunities(Array.isArray(oppRes) ? oppRes : []);
    setMatches(Array.isArray(mRes) ? mRes : []);
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const unitMeta = UNIT_WEIGHT_CONVERSIONS[unit] || { label: unit, kgFactor: 1 };
  const totalKgEquivalent = Number(quantity || 0) * unitMeta.kgFactor;
  const estimatedGrossValue = Number(quantity || 0) * Number(pricePerUnit || 0);

  const handlePublishListing = async () => {
    setPublishBusy(true);
    setPublishResult(null);
    const payload = {
      sellerId: currentUser?.id || 'usr_farmer_01',
      sellerName: currentUser?.name || 'Farmer',
      sellerRole: currentUser?.role || 'FARMER',
      sellerDistrict: district,
      title: productName.trim(),
      description: `${description.trim()} (Approx. ${totalKgEquivalent.toLocaleString()} kg total)`,
      category,
      quantityAvailable: Number(quantity),
      unit,
      pricePerUnitUGX: Number(pricePerUnit),
      minimumOrder: 1,
      location: district,
      district,
    };

    try {
      if (isSimulatedOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        queueOfflineAction('LISTING_DRAFT', payload);
        setPublishResult('Saved locally as an offline draft. It will publish to the Marketplace once you are back online and tap Sync Now.');
      } else {
        await ApiClient.createListing(payload);
        setPublishResult('Your product is now live on the Marketplace for buyers to see.');
        setSellStep(1);
        await loadData();
      }
    } catch (err: any) {
      setPublishResult(err?.message || 'Could not publish right now. Try saving offline or check your fields.');
    } finally {
      setPublishBusy(false);
    }
  };

  const navButtons: { id: FarmerSubTab; label: string; icon: any }[] = [
    { id: 'sell_wizard', label: 'Put Product on Sale', icon: Plus },
    { id: 'my_products', label: 'My Products', icon: Tag },
    { id: 'market_prices', label: 'Market Prices', icon: TrendingUp },
    { id: 'find_buyers', label: 'Find Buyers', icon: Users },
    { id: 'my_farm', label: 'My Farm', icon: Sprout },
    { id: 'my_orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Farmer &amp; Producer Centre</h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            List what you harvested, check real vs estimated prices, and connect with verified buyers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('logistics')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs sm:text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <Truck size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Transport</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('payments')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs sm:text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <CreditCard size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>My Payments</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('help')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs sm:text-sm text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
          >
            <HelpCircle size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* Simple Section Switcher */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Farmer workspace sections">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          const active = subTab === btn.id;
          return (
            <button
              key={btn.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setSubTab(btn.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border cursor-pointer ${
                active
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#121212] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]/60'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {publishResult && (
        <div className="p-4 rounded-2xl bg-[#181818] border border-[#D4AF37] text-sm text-[#F5F5F5] flex items-center gap-3">
          <CheckCircle2 size={18} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
          <span>{publishResult}</span>
        </div>
      )}

      {/* 7-STEP PRODUCT LISTING FORM */}
      {subTab === 'sell_wizard' && (
        <GuidedForm
          currentStep={sellStep}
          totalSteps={7}
          stepTitle={
            [
              'What are you selling?',
              'Choose category',
              'How much do you have?',
              'Set your price',
              'Where is the produce located?',
              'Add short buyer notes',
              'Review & Publish',
            ][sellStep - 1]
          }
          helperText={
            sellStep === 1
              ? 'Use a simple name buyers will recognize, such as Clean Maize Grain or Bugisu Arabica Coffee.'
              : sellStep === 2
                ? 'Picking the right category helps buyers find your listing faster.'
                : sellStep === 3
                  ? 'Pick a familiar local unit such as Bags, Crates, Kg, or Tonnes. We calculate the kilogram weight automatically.'
                  : sellStep === 4
                    ? 'Enter your asking price per unit in UGX. You can check Market Prices anytime to compare.'
                    : sellStep === 5
                      ? 'Tell buyers the district or trading centre for pickup.'
                      : sellStep === 6
                        ? 'Mention harvest readiness, drying quality, or moisture if known.'
                        : 'Double-check your details below before putting this product on sale.'
          }
          onBack={sellStep > 1 ? () => setSellStep((s) => s - 1) : undefined}
          onNext={sellStep < 7 ? () => setSellStep((s) => s + 1) : handlePublishListing}
          nextLabel={sellStep === 7 ? 'Put Product on Sale Now' : 'Next Step'}
          isSubmitting={publishBusy}
        >
          {sellStep === 1 && (
            <div>
              <label htmlFor="sell-title" className="block text-sm text-[#C0C0C0] mb-1.5">Product Name</label>
              <input
                id="sell-title"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
            </div>
          )}

          {sellStep === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  ['COFFEE_CASH_CROPS', 'Coffee & Cash Crops'],
                  ['GRAINS_CEREALS', 'Maize, Beans & Grains'],
                  ['FRUITS_VEGETABLES', 'Matooke, Fruits & Vegetables'],
                  ['LEGUMES_PULSES', 'Groundnuts, Soy & Pulses'],
                  ['TUBERS_ROOTS', 'Cassava, Irish Potatoes & Roots'],
                  ['SEEDS_FERTILIZERS', 'Seeds & Farm Inputs'],
                ] as [CropCategory, string][]
              ).map(([catId, label]) => (
                <button
                  key={catId}
                  type="button"
                  onClick={() => setCategory(catId)}
                  className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-left text-sm cursor-pointer ${
                    category === catId
                      ? 'bg-[#181818] border-[#D4AF37] text-[#F5F5F5] font-semibold'
                      : 'bg-[#121212] border-[#27272a] text-[#C0C0C0]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {sellStep === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sell-qty" className="block text-sm text-[#C0C0C0] mb-1.5">Quantity Available</label>
                <input
                  id="sell-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="sell-unit" className="block text-sm text-[#C0C0C0] mb-1.5">Measurement Unit</label>
                <select
                  id="sell-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as ProductUnit)}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {Object.entries(UNIT_WEIGHT_CONVERSIONS).map(([code, meta]) => (
                    <option key={code} value={code}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#C0C0C0]">
                Standard conversion: <strong className="text-[#F5F5F5] tabular-nums">{quantity} × {unitMeta.kgFactor} kg = {totalKgEquivalent.toLocaleString()} kg</strong> total weight.
              </div>
            </div>
          )}

          {sellStep === 4 && (
            <div className="space-y-3">
              <div>
                <label htmlFor="sell-price" className="block text-sm text-[#C0C0C0] mb-1.5">
                  Price per {unit.replace('_', ' ')} (UGX)
                </label>
                <input
                  id="sell-price"
                  type="number"
                  min={500}
                  step={500}
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(Math.max(0, Number(e.target.value)))}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5] tabular-nums"
                />
              </div>
              <div className="p-3 rounded-xl bg-[#181818] border border-[#27272a] text-xs text-[#C0C0C0]">
                If all {quantity} units sell at this price, gross sale total will be{' '}
                <strong className="text-[#D4AF37] tabular-nums">{formatMoney(estimatedGrossValue, 'UGX', language)}</strong>.
              </div>
            </div>
          )}

          {sellStep === 5 && (
            <div>
              <label htmlFor="sell-district" className="block text-sm text-[#C0C0C0] mb-1.5">District / Trading Centre</label>
              <input
                id="sell-district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
            </div>
          )}

          {sellStep === 6 && (
            <div>
              <label htmlFor="sell-desc" className="block text-sm text-[#C0C0C0] mb-1.5">Notes for Buyers</label>
              <textarea
                id="sell-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
            </div>
          )}

          {sellStep === 7 && (
            <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2 text-sm text-[#C0C0C0]">
              <div><strong className="text-[#F5F5F5]">Product:</strong> {productName}</div>
              <div><strong className="text-[#F5F5F5]">Amount for sale:</strong> {quantity} × {unit.replace('_', ' ')} ({totalKgEquivalent.toLocaleString()} kg)</div>
              <div><strong className="text-[#F5F5F5]">Asking Price:</strong> {formatMoney(pricePerUnit, 'UGX', language)} per unit</div>
              <div><strong className="text-[#F5F5F5]">Location:</strong> {district}</div>
            </div>
          )}
        </GuidedForm>
      )}

      {/* MY PRODUCTS */}
      {subTab === 'my_products' && (
        myListings.length === 0 ? (
          <EmptyState
            icon={<Tag size={22} />}
            title="You have no products on sale yet"
            description="Tap Put Product on Sale to publish your first crop or goods to buyers."
            actionLabel="Put Product on Sale"
            onAction={() => setSubTab('sell_wizard')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myListings.map((l) => (
              <div key={l.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[#F5F5F5]">{l.title}</h3>
                  <StatusLabel tone={l.status === 'ACTIVE' ? 'good' : 'neutral'} label={l.status === 'ACTIVE' ? 'On Sale' : l.status} />
                </div>
                <div className="text-lg font-bold text-[#D4AF37] tabular-nums">
                  {formatMoney(l.pricePerUnitUGX, 'UGX', language)} / {l.unit}
                </div>
                <div className="text-xs text-[#A0A0A0]">
                  Available: {l.quantityAvailable} {l.unit} · {l.district}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* MARKET PRICES WITH OBSERVED VS ESTIMATED LABELING */}
      {subTab === 'market_prices' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-4 text-xs text-[#C0C0C0]">
            Every market price clearly states whether it is a real <strong className="text-emerald-400">Observed market price</strong> recorded on site, or an <strong className="text-[#D4AF37]">Estimated benchmark</strong>.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prices.map((p: any) => {
              const isObserved = !String(p.source || '').toLowerCase().includes('estimat');
              return (
                <div key={p.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A0A0A0]">{p.district}</span>
                    <StatusLabel tone={isObserved ? 'good' : 'wait'} label={isObserved ? 'Observed Price' : 'Estimated Price'} />
                  </div>
                  <h3 className="text-base font-semibold text-[#F5F5F5]">{p.commodity}</h3>
                  <div className="text-xl font-bold text-[#D4AF37] tabular-nums">
                    {formatMoney(p.pricePerKgUGX || p.modalPriceUGX || 0, 'UGX', language)} / kg
                  </div>
                  <div className="text-xs text-[#A0A0A0]">
                    Source: {p.marketName || p.source || 'District Market Desk'} · {formatShortDate(p.observedAt || new Date().toISOString(), language)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FIND BUYERS */}
      {subTab === 'find_buyers' && (
        matches.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Looking for matching buyers"
            description="Browse the Marketplace or check Opportunities to connect directly with verified buyers."
            actionLabel="Open Marketplace"
            onAction={() => onNavigate('explore')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m, idx) => (
              <div key={idx} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-2">
                <div className="text-xs text-[#D4AF37] font-medium">Recommended Match</div>
                <h3 className="text-base font-semibold text-[#F5F5F5]">{m.buyerName || m.title || 'Verified Regional Buyer'}</h3>
                <p className="text-sm text-[#A0A0A0]">{m.reason || m.commodity || 'Looking for agricultural supply'}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* MY FARM */}
      {subTab === 'my_farm' && (
        farms.length === 0 ? (
          <EmptyState
            icon={<Sprout size={22} />}
            title="No farm parcel saved yet"
            description="Your farm details help buyers understand where produce is grown and harvested."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map((f) => (
              <div key={f.id} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-2">
                <h3 className="text-base font-semibold text-[#F5F5F5]">{f.farmName}</h3>
                <div className="text-sm text-[#C0C0C0]">{f.district} · {f.subCounty}, {f.village}</div>
                <div className="text-xs text-[#A0A0A0]">Total size: {f.totalAcres} acres · Water: {f.waterSource} · Plots: {f.plots?.length || 0}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* MY ORDERS */}
      {subTab === 'my_orders' && (
        orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={22} />}
            title="No buyer orders yet"
            description="Orders placed on your farm listings will appear here."
          />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <OrderStatusCard
                key={o.id}
                reference={o.orderNumber}
                itemTitle={`${o.productTitle} (${o.quantity} ${o.unit})`}
                counterparty={`Buyer: ${o.buyerName} · ${o.deliveryDistrict}`}
                amount={o.totalAmountUGX}
                dateIso={o.createdAt}
                rawStatus={o.status}
                actionLabel="Manage order"
                onAction={() => onNavigate('activity')}
              />
            ))}
          </div>
        )
      )}

      {/* OPPORTUNITIES */}
      {subTab === 'opportunities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              title={opp.title}
              organization={opp.keyOfftakers?.[0] || opp.targetSector || 'Regional Network Partner'}
              location={opp.targetRegion || opp.corridorOrDistrict || 'Uganda & EAC'}
              category={String(opp.opportunityType || opp.category || 'OPPORTUNITY').replace(/_/g, ' ')}
              summary={opp.rationale || 'Open trade and supply opportunity verified on the network.'}
              onApply={() => onNavigate('opportunities')}
            />
          ))}
        </div>
      )}
    </div>
  );
};
