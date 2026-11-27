/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V24.0 - Multi-Sector Marketplace, RFQ Quotations, Negotiations & Commercial Agreements
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FileSignature,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V23CurrencyCode,
  V24AgreementType,
  V24CommerceListing,
  V24CommercialAgreement,
  V24CommercialParticipant,
  V24ListingType,
  V24NegotiationThread,
  V24Quotation,
  V24RequestForQuotation,
  V24SavedSearch,
  V24SectorClassification,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const LISTING_TYPES: V24ListingType[] = [
  'SELL',
  'BUY_REQUEST',
  'OFFER_SERVICE',
  'REQUEST_SERVICE',
  'RENT_OR_LEASE',
  'SUPPLY_CONTRACT',
  'MANUFACTURING_CAPACITY',
  'TRANSPORT_FREIGHT',
  'WAREHOUSE_SPACE',
  'WHOLESALE_BUNDLE',
];

const AGREEMENT_TYPES: V24AgreementType[] = [
  'GOODS_SUPPLY',
  'SERVICE_AGREEMENT',
  'EQUIPMENT_RENTAL',
  'FREIGHT_TRANSPORT',
  'STORAGE_WAREHOUSING',
  'MANUFACTURING_OFFTAKE',
  'COOPERATIVE_DELIVERY',
  'WHOLESALE_DISTRIBUTION',
  'PROJECT_WORK',
  'SUBCONTRACTING',
  'FRAMEWORK_STANDING',
  'PARTNERSHIP_JOINT_VENTURE',
];

function fmtMinor(minor: number, currency = 'UGX'): string {
  return `${currency} ${(Number(minor || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export const V24MarketplaceRfqContractsView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = useMemo(
    () => ({ userId: currentUser?.id || 'usr_buyer_01', userRole: role }),
    [currentUser?.id, role]
  );

  const [tab, setTab] = useState<'LISTINGS' | 'RFQS' | 'NEGOTIATIONS' | 'AGREEMENTS'>('LISTINGS');
  const [sectors, setSectors] = useState<V24SectorClassification[]>([]);
  const [participants, setParticipants] = useState<V24CommercialParticipant[]>([]);
  const [listings, setListings] = useState<V24CommerceListing[]>([]);
  const [savedSearches, setSavedSearches] = useState<V24SavedSearch[]>([]);
  const [rfqs, setRfqs] = useState<V24RequestForQuotation[]>([]);
  const [quotations, setQuotations] = useState<V24Quotation[]>([]);
  const [negotiations, setNegotiations] = useState<V24NegotiationThread[]>([]);
  const [agreements, setAgreements] = useState<V24CommercialAgreement[]>([]);

  // Filters
  const [keyword, setKeyword] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Create Listing form
  const [listingTitle, setListingTitle] = useState<string>('');
  const [listingType, setListingType] = useState<V24ListingType>('SELL');
  const [listingSector, setListingSector] = useState<string>('SEC-AGRI');
  const [listingQty, setListingQty] = useState<number>(50);
  const [listingPriceMajor, setListingPriceMajor] = useState<number>(150000);
  const [listingCurrency, setListingCurrency] = useState<V23CurrencyCode>('UGX');
  const [listingLocation, setListingLocation] = useState<string>('Kampala, Uganda');

  // Create RFQ form
  const [rfqTitle, setRfqTitle] = useState<string>('');
  const [rfqProduct, setRfqProduct] = useState<string>('');
  const [rfqQty, setRfqQty] = useState<number>(20);
  const [rfqSector, setRfqSector] = useState<string>('SEC-MANUF');

  // Quote submission
  const [quoteRfqId, setQuoteRfqId] = useState<string>('RFQ-V24-001');
  const [quoteUnitPriceMajor, setQuoteUnitPriceMajor] = useState<number>(480000);
  const [quoteDays, setQuoteDays] = useState<number>(5);

  // Negotiation message
  const [negRfqId, setNegRfqId] = useState<string>('RFQ-V24-001');
  const [negBody, setNegBody] = useState<string>('');

  // Agreement form
  const [agrTitle, setAgrTitle] = useState<string>('');
  const [agrType, setAgrType] = useState<V24AgreementType>('GOODS_SUPPLY');
  const [agrSellerId, setAgrSellerId] = useState<string>('PRTC-V24-003');
  const [agrValueMajor, setAgrValueMajor] = useState<number>(2500000);

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [secRes, partRes, listRes, ssRes, rfqRes, quoRes, negRes, agrRes] = await Promise.all([
        ApiClient.v24GetSectors(),
        ApiClient.v24GetParticipants({}, actor),
        ApiClient.v24GetListings({
          keyword: keyword || undefined,
          sectorId: sectorFilter || undefined,
          listingType: typeFilter || undefined,
          verifiedOnly,
        }),
        ApiClient.v24GetSavedSearches(actor),
        ApiClient.v24GetRfqs(actor),
        ApiClient.v24GetQuotations(undefined, actor),
        ApiClient.v24GetNegotiations(actor),
        ApiClient.v24GetAgreements(actor),
      ]);
      setSectors(secRes.sectors || []);
      setParticipants(partRes.participants || []);
      setListings(listRes.listings || []);
      setSavedSearches(ssRes.savedSearches || []);
      setRfqs(rfqRes.rfqs || []);
      setQuotations(quoRes.quotations || []);
      setNegotiations(negRes.negotiations || []);
      setAgreements(agrRes.agreements || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Marketplace & Agreement workflows.');
    } finally {
      setLoading(false);
    }
  }, [actor, keyword, sectorFilter, typeFilter, verifiedOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myParticipant = useMemo(
    () => participants.find((p) => p.userId === actor.userId || p.authorizedRepresentatives.some((r) => r.userId === actor.userId)),
    [participants, actor.userId]
  );

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v24CreateListing(
        {
          participantId: myParticipant?.id,
          listingType,
          title: listingTitle,
          description: listingTitle,
          sectorId: listingSector,
          unitOfMeasure: 'UNIT',
          totalQuantityOrCapacity: listingQty,
          priceMinor: Math.round(listingPriceMajor * 100),
          currency: listingCurrency,
          countryCode: 'UG',
          location: listingLocation,
          deliveryAvailable: true,
        },
        actor
      );
      setFeedback(`Published listing ${res.listing?.id}: ${res.listing?.title}`);
      setListingTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to publish listing.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCurrentSearch = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24SaveSearch(
        {
          label: keyword ? `Search: ${keyword}` : `Sector ${sectorFilter || 'All'}`,
          query: keyword || undefined,
          sectorId: sectorFilter || undefined,
          listingType: typeFilter || undefined,
        },
        actor
      );
      setFeedback(`Saved search filter ${res.savedSearch?.label}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to save search.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24CreateRfq(
        {
          buyerParticipantId: myParticipant?.id,
          title: rfqTitle,
          sectorId: rfqSector,
          productOrService: rfqProduct || rfqTitle,
          specifications: rfqProduct || rfqTitle,
          quantity: rfqQty,
          unitOfMeasure: 'UNIT',
          currency: 'UGX',
          countryCode: 'UG',
          deliveryLocation: 'Kampala, Uganda',
          visibility: 'PUBLIC',
        },
        actor
      );
      setFeedback(`Created RFQ ${res.rfq?.id}.`);
      setRfqTitle('');
      setRfqProduct('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to create RFQ.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent, parentQuotationId?: string) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24SubmitQuotation(
        {
          rfqId: quoteRfqId,
          supplierParticipantId: myParticipant?.id,
          unitPriceMinor: Math.round(quoteUnitPriceMajor * 100),
          currency: 'UGX',
          deliveryEstimateDays: quoteDays,
          parentQuotationId,
        },
        actor
      );
      setFeedback(`Submitted quotation ${res.quotation?.id} (rev ${res.quotation?.revisionNumber}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to submit quotation.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecideQuotation = async (id: string, decision: 'ACCEPTED' | 'REJECTED') => {
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24DecideQuotation(id, { decision }, actor);
      setFeedback(`Quotation ${id} marked ${decision}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Only the RFQ buyer can decide quotations.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendNegMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24PostNegotiationMessage(
        {
          rfqId: negRfqId,
          senderParticipantId: myParticipant?.id,
          kind: 'CLARIFICATION',
          body: negBody,
        },
        actor
      );
      setNegBody('');
      setFeedback('Negotiation message posted.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to send negotiation message.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const buyerId = myParticipant?.id || 'PRTC-V24-002';
      const sellerId = agrSellerId === buyerId ? 'PRTC-V24-003' : agrSellerId;
      const res = await ApiClient.v24CreateAgreement(
        {
          agreementType: agrType,
          title: agrTitle,
          buyerParticipantId: buyerId,
          sellerParticipantId: sellerId,
          itemsSummary: [
            { name: agrTitle, quantity: 1, unitOfMeasure: 'CONTRACT', unitPriceMinor: Math.round(agrValueMajor * 100) },
          ],
          currency: 'UGX',
        },
        actor
      );
      setFeedback(`Created agreement ${res.agreement?.agreementNumber} (${res.agreement?.status}).`);
      setAgrTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to create agreement.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdvanceAgreement = async (agr: V24CommercialAgreement, nextStatus: string, acceptSignature = false) => {
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24TransitionAgreement(agr.id, { nextStatus, acceptSignature }, actor);
      setFeedback(`Agreement ${agr.agreementNumber} moved to ${nextStatus}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Transition rejected.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#D4AF37]">ECONEX V24.0 · Discovery, Quotes & Contracts</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Multi-Sector Marketplace, RFQs & Commercial Agreements
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              10 commercial listing formats · Revisioned immutable quotation snapshots · 12-type versioned agreements
              (regulatedEscrowIncluded: false).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
              onClick={() => onNavigate('v24-orders-inventory')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
            >
              Go to Orders & Stock
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 p-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg w-fit">
          {(
            [
              { id: 'LISTINGS', label: `Listings (${listings.length})` },
              { id: 'RFQS', label: `RFQs & Quotations (${rfqs.length})` },
              { id: 'NEGOTIATIONS', label: `Negotiations (${negotiations.length})` },
              { id: 'AGREEMENTS', label: `Agreements (${agreements.length})` },
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

      {tab === 'LISTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateListing} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 self-start text-xs">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
              <Plus size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Publish Commercial Listing</span>
            </div>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Listing Title</span>
              <input
                required
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
                placeholder="e.g. Solar Borehole Pumping Installation Package"
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Listing Type</span>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value as V24ListingType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {LISTING_TYPES.map((lt) => (
                    <option key={lt} value={lt}>
                      {lt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Sector</span>
                <select
                  value={listingSector}
                  onChange={(e) => setListingSector(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={listingQty}
                  onChange={(e) => setListingQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Unit Price</span>
                <input
                  type="number"
                  min={1}
                  value={listingPriceMajor}
                  onChange={(e) => setListingPriceMajor(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[#A0A0A0]">Currency</span>
                <select
                  value={listingCurrency}
                  onChange={(e) => setListingCurrency(e.target.value as V23CurrencyCode)}
                  className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {['UGX', 'KES', 'TZS', 'RWF', 'USD', 'EUR'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Location</span>
              <input
                value={listingLocation}
                onChange={(e) => setListingLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Publish Listing
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" aria-hidden="true" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Filter keyword..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                <option value="">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                <option value="">All Types</option>
                {LISTING_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {lt}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-[#A0A0A0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                <span>Verified Only</span>
              </label>
              <button
                type="button"
                onClick={handleSaveCurrentSearch}
                className="px-3 py-2 rounded-lg border border-[#27272a] bg-[#181818] text-[#D4AF37] cursor-pointer"
              >
                Save Search ({savedSearches.length})
              </button>
            </div>

            <div className="divide-y divide-[#27272a]">
              {listings.map((item) => (
                <div key={item.id} className="py-3.5 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
                      <span className="text-sm font-semibold text-[#F5F5F5]">{item.title}</span>
                    </div>
                    <span className="text-sm font-mono tabular-nums font-bold text-[#D4AF37]">
                      {fmtMinor(item.priceMinor, item.currency)} / {item.unitOfMeasure}
                    </span>
                  </div>
                  <div className="text-xs text-[#A0A0A0]">
                    {item.listingType} · {item.location} · Available:{' '}
                    <span className="font-mono tabular-nums text-[#F5F5F5]">{item.totalQuantityOrCapacity}</span>{' '}
                    {item.unitOfMeasure} · {item.verificationStatus} · Expires{' '}
                    <span className="font-mono">{(item.expiresAt || 'Open-ended').slice(0, 10)}</span>
                  </div>
                </div>
              ))}
              {listings.length === 0 && (
                <div className="py-8 text-center text-xs text-[#A0A0A0]">
                  No commercial listings match the current filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'RFQS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <form onSubmit={handleCreateRfq} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs">
              <h2 className="text-sm font-display font-semibold text-[#F5F5F5]">Issue Request for Quotation</h2>
              <input
                required
                value={rfqTitle}
                onChange={(e) => setRfqTitle(e.target.value)}
                placeholder="RFQ Title"
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
              <input
                value={rfqProduct}
                onChange={(e) => setRfqProduct(e.target.value)}
                placeholder="Product or service specification"
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  value={rfqQty}
                  onChange={(e) => setRfqQty(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                />
                <select
                  value={rfqSector}
                  onChange={(e) => setRfqSector(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
              >
                Create RFQ
              </button>
            </form>

            <form
              onSubmit={(e) => handleSubmitQuote(e)}
              className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs"
            >
              <h2 className="text-sm font-display font-semibold text-[#F5F5F5]">Submit Supplier Quotation</h2>
              <select
                value={quoteRfqId}
                onChange={(e) => setQuoteRfqId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                {rfqs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.title}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[#A0A0A0]">Unit Price (UGX)</span>
                  <input
                    type="number"
                    min={1}
                    value={quoteUnitPriceMajor}
                    onChange={(e) => setQuoteUnitPriceMajor(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[#A0A0A0]">Delivery Days</span>
                  <input
                    type="number"
                    min={1}
                    value={quoteDays}
                    onChange={(e) => setQuoteDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg border border-[#D4AF37] text-[#D4AF37] font-semibold cursor-pointer"
              >
                Submit Quotation
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-display font-semibold text-[#F5F5F5] mb-3">
                Active RFQs & Immutable Quotation Snapshots
              </h2>
              <div className="divide-y divide-[#27272a] text-xs">
                {rfqs.map((r) => (
                  <div key={r.id} className="py-3 space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-sm text-[#F5F5F5]">{r.title}</span>
                      <span className="font-mono text-[#D4AF37]">{r.status}</span>
                    </div>
                    <div className="text-[#A0A0A0]">
                      {r.id} · Qty {r.quantity} {r.unitOfMeasure} · {r.deliveryLocation} · Deadline{' '}
                      {r.deadlineAt.slice(0, 10)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#27272a] pt-4">
              <h3 className="text-sm font-display font-semibold text-[#F5F5F5] mb-3">
                Quotations ({quotations.length})
              </h3>
              <div className="divide-y divide-[#27272a] text-xs">
                {quotations.map((q) => (
                  <div key={q.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-medium text-[#F5F5F5]">
                        {q.id} · Rev {q.revisionNumber} · {q.supplierName}
                      </div>
                      <div className="text-[#A0A0A0] font-mono tabular-nums">
                        Total: {fmtMinor(q.totalPriceMinor, q.currency)} · Delivery: {q.deliveryEstimateDays}d ·{' '}
                        Status: {q.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleSubmitQuote(e, q.id)}
                        disabled={busy}
                        className="px-2.5 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                      >
                        Clone Revision
                      </button>
                      {q.status === 'SUBMITTED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDecideQuotation(q.id, 'ACCEPTED')}
                            disabled={busy}
                            className="px-2.5 py-1.5 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecideQuotation(q.id, 'REJECTED')}
                            disabled={busy}
                            className="px-2.5 py-1.5 rounded border border-red-800 text-red-300 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'NEGOTIATIONS' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              Structured RFQ & Counteroffer Negotiation Threads
            </h2>
          </div>

          <form onSubmit={handleSendNegMessage} className="flex flex-col sm:flex-row gap-3 text-xs">
            <select
              value={negRfqId}
              onChange={(e) => setNegRfqId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {rfqs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}
                </option>
              ))}
            </select>
            <input
              required
              value={negBody}
              onChange={(e) => setNegBody(e.target.value)}
              placeholder="Write commercial clarification or counteroffer note..."
              className="flex-1 px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer whitespace-nowrap"
            >
              Post Note
            </button>
          </form>

          <div className="divide-y divide-[#27272a] text-xs">
            {negotiations.map((n) => (
              <div key={n.id} className="py-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-mono text-[#D4AF37]">
                    {n.id} · RFQ {n.rfqId}
                  </span>
                  <span className="font-mono text-[#A0A0A0]">{n.messages.length} msgs</span>
                </div>
                <div className="space-y-1.5 pl-3 border-l border-[#27272a]">
                  {n.messages.map((m) => (
                    <div key={m.id} className="text-[#F5F5F5]">
                      <span className="font-mono text-[#A0A0A0]">[{m.kind}]</span> {m.body}{' '}
                      <span className="text-[#71717a] font-mono">({m.createdAt.slice(0, 16)})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'AGREEMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateAgreement} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
              <FileSignature size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Create Commercial Agreement</span>
            </div>
            <input
              required
              value={agrTitle}
              onChange={(e) => setAgrTitle(e.target.value)}
              placeholder="Agreement Title"
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            />
            <select
              value={agrType}
              onChange={(e) => setAgrType(e.target.value as V24AgreementType)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {AGREEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={agrSellerId}
              onChange={(e) => setAgrSellerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  Counterparty: {p.displayName} ({p.id})
                </option>
              ))}
            </select>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Total Contract Value (UGX)</span>
              <input
                type="number"
                min={100}
                value={agrValueMajor}
                onChange={(e) => setAgrValueMajor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
              />
            </label>
            <p className="text-[#A0A0A0]">
              Commercial terms notice: regulatedEscrowIncluded stays <span className="font-mono">false</span>; both
              parties must sign electronically before activation.
            </p>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Create Agreement Draft
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              Commercial Agreements (10-State Lifecycle)
            </h2>
            <div className="divide-y divide-[#27272a] text-xs">
              {agreements.map((agr) => (
                <div key={agr.id} className="py-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-medium text-sm text-[#F5F5F5]">
                      {agr.agreementNumber} · {agr.title}
                    </div>
                    <div className="font-mono text-[#D4AF37]">{agr.status}</div>
                  </div>
                  <div className="text-[#A0A0A0] font-mono tabular-nums">
                    {agr.agreementType} · Value: {fmtMinor(agr.totalValueMinor, agr.currency)} · Revisions: {agr.history.length} ·
                    Signatures: {[agr.buyerSignedAt, agr.sellerSignedAt].filter(Boolean).length}/2 · regulatedEscrowIncluded:{' '}
                    {String(agr.regulatedEscrowIncluded)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {agr.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceAgreement(agr, 'UNDER_REVIEW')}
                        className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                      >
                        Send to Review
                      </button>
                    )}
                    {agr.status === 'UNDER_REVIEW' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceAgreement(agr, 'PENDING_SIGNATURE')}
                        className="px-3 py-1.5 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                      >
                        Request Signatures
                      </button>
                    )}
                    {agr.status === 'PENDING_SIGNATURE' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceAgreement(agr, 'ACTIVE', true)}
                        className="px-3 py-1.5 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                      >
                        Electronic Sign & Activate
                      </button>
                    )}
                    {agr.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceAgreement(agr, 'COMPLETED')}
                        className="px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
