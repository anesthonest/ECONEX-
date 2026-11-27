/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Universal Marketplace 2.0
 * Goods, services, equipment rentals, wholesale lots, retail items, digital offers,
 * separate identity vs product/licence verification indicators, fraud reporting & admin moderation.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Flag, Plus, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type { V22FraudReport, V22ProductOrService, V22SectorDefinition } from '../../types/index.ts';
import { EconexImage } from '../ux/EconexImage.tsx';
import { resolveMarketplaceAsset } from '../../config/econexAssetManifest.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

const OFFER_KINDS: Array<V22ProductOrService['offerKind'] | 'ALL'> = [
  'ALL',
  'GOODS',
  'SERVICE',
  'EQUIPMENT_RENTAL',
  'WHOLESALE_LOT',
  'RETAIL_ITEM',
  'DIGITAL_OFFER',
  'PROFESSIONAL_SERVICE',
  'CONTRACT_OFFER',
];

const OFFER_KIND_LABELS: Record<string, string> = {
  ALL: 'All Offer Types',
  GOODS: 'Goods',
  SERVICE: 'Services',
  EQUIPMENT_RENTAL: 'Equipment Rentals',
  WHOLESALE_LOT: 'Wholesale Lots',
  RETAIL_ITEM: 'Retail Items',
  DIGITAL_OFFER: 'Digital & Software',
  PROFESSIONAL_SERVICE: 'Professional Services',
  CONTRACT_OFFER: 'Contract Offers',
};

const REPORT_REASON_LABELS: Record<string, string> = {
  MISLEADING_TERMS: 'Misleading Terms or Pricing',
  PROHIBITED_ACTIVITY: 'Prohibited Item or Activity',
  IMPERSONATION: 'Impersonation / False Identity',
  UNLICENSED_CLAIM: 'Unlicensed Regulatory Claim',
  SUSPECTED_FRAUD: 'Suspected Fraud',
};

export const V22UniversalMarketplaceView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || role, userRole: role };

  const [items, setItems] = useState<V22ProductOrService[]>([]);
  const [sectors, setSectors] = useState<V22SectorDefinition[]>([]);
  const [reports, setReports] = useState<V22FraudReport[]>([]);
  const [offerKind, setOfferKind] = useState<string>('ALL');
  const [sectorCode, setSectorCode] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [publishOpen, setPublishOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [newSector, setNewSector] = useState<string>('ICT_SOFTWARE_DIGITAL');
  const [newKind, setNewKind] = useState<V22ProductOrService['offerKind']>('SERVICE');
  const [unitPrice, setUnitPrice] = useState<number>(1500000);
  const [currency, setCurrency] = useState<string>('UGX');
  const [unitLabel, setUnitLabel] = useState<string>('Engagement');

  const [reportTarget, setReportTarget] = useState<V22ProductOrService | null>(null);
  const [reportReason, setReportReason] = useState<V22FraudReport['reasonCategory']>('MISLEADING_TERMS');
  const [reportDesc, setReportDesc] = useState<string>('');

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [mktRes, secRes] = await Promise.all([
        ApiClient.v22GetMarketplace(
          {
            offerKind: offerKind === 'ALL' ? undefined : offerKind,
            sectorCode: sectorCode || undefined,
            q: q.trim() || undefined,
          },
          actor
        ),
        ApiClient.v22GetSectors(undefined, actor),
      ]);
      setItems(mktRes.items || []);
      setSectors(secRes.sectors || []);
      if (role === 'PLATFORM_ADMIN') {
        const repRes = await ApiClient.v22GetFraudReports(actor).catch(() => ({ reports: [] }));
        setReports(repRes.reports || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load Universal Marketplace.');
    }
  }, [offerKind, sectorCode, q, currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const created = await ApiClient.v22CreateListing(
        {
          sectorCode: newSector,
          offerKind: newKind,
          title,
          description,
          unitPrice,
          currency,
          unitLabel,
        },
        actor
      );
      setFeedback(`Published offer "${created.title}" (${created.id}).`);
      setTitle('');
      setDescription('');
      setPublishOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish marketplace offer.');
    }
  };

  const handleInitiateOrder = async (item: V22ProductOrService) => {
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v22CreateActivity(
        {
          sectorCode: item.sectorCode,
          activityType: item.offerKind === 'EQUIPMENT_RENTAL' ? 'EQUIPMENT_RENTAL' : item.offerKind === 'GOODS' ? 'GOODS_SALE' : 'SERVICE_ENGAGEMENT',
          title: item.title,
          listingId: item.id,
          sellerUserId: item.sellerUserId,
          sellerName: item.sellerName,
          quantity: item.minOrderQty || 1,
          unitLabel: item.unitLabel,
          unitPrice: item.unitPrice,
          currency: item.currency,
          district: item.district,
          countryCode: item.countryCode,
        },
        actor
      );
      setFeedback(`Commercial activity ${res.activity?.activityCode} initiated for "${item.title}".`);
    } catch (err: any) {
      setError(err?.message || 'Could not initiate order.');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    setError(null);
    setFeedback(null);
    try {
      await ApiClient.v22ReportListing(
        {
          targetType: 'LISTING',
          targetId: reportTarget.id,
          reasonCategory: reportReason,
          description: reportDesc,
        },
        actor
      );
      setFeedback(`Compliance report submitted for "${reportTarget.title}". Listing flagged for review.`);
      setReportTarget(null);
      setReportDesc('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not submit report.');
    }
  };

  const handleModerate = async (reportId: string, decision: 'REMOVE_TARGET' | 'RESTORE_TARGET') => {
    setError(null);
    setFeedback(null);
    try {
      await ApiClient.v22ModerateReport(reportId, { decision, reviewNote: `Admin action: ${decision}` }, actor);
      setFeedback(`Moderation decision ${decision} recorded.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Moderation failed.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-[#D4AF37]">Goods, Services, Rentals &amp; Wholesale Offers</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">Universal Marketplace</h1>
            <p className="text-sm text-[#A0A0A0]">
              Seller identity checks and product or licence verification are displayed independently for full transparency.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('v22-overview')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm text-[#F5F5F5] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Active Deals
            </button>
            <button
              type="button"
              onClick={() => setPublishOpen((v) => !v)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={16} aria-hidden="true" />
              <span>Publish Offer</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, services, suppliers, equipment, or software..."
            className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
          />
          <select
            aria-label="Filter by sector"
            value={sectorCode}
            onChange={(e) => setSectorCode(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {OFFER_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setOfferKind(k)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs border cursor-pointer whitespace-nowrap shrink-0 ${
                offerKind === k
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#181818] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              {OFFER_KIND_LABELS[k] || k}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-200">
          {error}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 text-sm text-emerald-200">
          {feedback}
        </div>
      )}

      {publishOpen && (
        <form onSubmit={handlePublish} className="bg-[#121212] border border-[#D4AF37]/60 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5]">Publish Marketplace 2.0 Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Offer Title</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Heavy Excavator Wet Hire"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Sector</span>
              <select
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {sectors.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Offer Kind</span>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as V22ProductOrService['offerKind'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {OFFER_KINDS.filter((k) => k !== 'ALL').map((k) => (
                  <option key={k} value={k}>
                    {OFFER_KIND_LABELS[k] || k}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Unit Price</span>
              <input
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              />
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Currency</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
              >
                <option value="UGX">UGX</option>
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="TZS">TZS</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Unit Label</span>
              <input
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="Day / Kit / Licence / Batch"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-[#A0A0A0]">
            <span>Detailed Terms &amp; Scope</span>
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specifications, turnaround time, and delivery region..."
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer"
            >
              Publish Listing
            </button>
          </div>
        </form>
      )}

      {/* Report Listing Modal Drawer */}
      {reportTarget && (
        <form onSubmit={handleSubmitReport} className="bg-[#121212] border border-amber-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-amber-300 flex items-center gap-2">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>Report Offer: {reportTarget.title}</span>
            </h2>
            <button type="button" onClick={() => setReportTarget(null)} className="text-xs text-[#A0A0A0] cursor-pointer">
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Reason Category</span>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as V22FraudReport['reasonCategory'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                <option value="MISLEADING_TERMS">{REPORT_REASON_LABELS.MISLEADING_TERMS}</option>
                <option value="PROHIBITED_ACTIVITY">{REPORT_REASON_LABELS.PROHIBITED_ACTIVITY}</option>
                <option value="IMPERSONATION">{REPORT_REASON_LABELS.IMPERSONATION}</option>
                <option value="UNLICENSED_CLAIM">{REPORT_REASON_LABELS.UNLICENSED_CLAIM}</option>
                <option value="SUSPECTED_FRAUD">{REPORT_REASON_LABELS.SUSPECTED_FRAUD}</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-[#A0A0A0]">
              <span>Details for Compliance Review</span>
              <input
                required
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe discrepancy or compliance concern..."
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 text-[#050505] font-semibold text-sm cursor-pointer">
              Submit Fraud / Compliance Report
            </button>
          </div>
        </form>
      )}

      {/* Marketplace Catalog */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const media = resolveMarketplaceAsset({
            imageUrl: (item as any).imageUrl,
            title: item.title,
            sectorCode: item.sectorCode,
            offerKind: item.offerKind,
          });
          return (
            <article key={item.id} className="bg-[#121212] border border-[#27272a] hover:border-[#D4AF37]/60 transition-colors rounded-2xl overflow-hidden flex flex-col justify-between group">
              <div>
                <EconexImage
                  src={media.path}
                  alt={media.alt}
                  fallbackLabel={item.title}
                  aspectClassName="h-44 w-full"
                  overlayGradient
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#D4AF37] font-medium">
                      {OFFER_KIND_LABELS[item.offerKind] || item.offerKind}
                    </span>
                    <span className={item.moderationStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.moderationStatus === 'ACTIVE' ? 'Active' : item.moderationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-display font-semibold text-[#F5F5F5] line-clamp-1">{item.title}</h2>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed line-clamp-2">{item.description}</p>
                  <div className="text-base font-bold tabular-nums text-[#F5F5F5]">
                    {item.currency} {item.unitPrice.toLocaleString()} <span className="text-xs font-normal text-[#A0A0A0]">/ {item.unitLabel}</span>
                  </div>
                  <div className="text-xs text-[#A0A0A0]">
                    {item.sellerName} · {item.district}, {item.countryCode}
                  </div>
                  <div className="pt-1 flex flex-wrap gap-3 text-xs">
                    <span className={item.identityVerified ? 'text-emerald-400' : 'text-[#A0A0A0]'}>
                      {item.identityVerified ? 'Verified Seller' : 'Unverified Seller'}
                    </span>
                    <span aria-hidden="true" className="text-[#52525b]">·</span>
                    <span className={item.productOrLicenceVerified ? 'text-emerald-400' : 'text-amber-400'}>
                      {item.productOrLicenceVerified
                        ? 'Verified Product / Licence'
                        : String(item.qualityClassification || 'Self-declared').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-[#27272a] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setReportTarget(item)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] hover:border-amber-500 text-xs text-[#A0A0A0] hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Flag size={13} aria-hidden="true" />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  disabled={item.moderationStatus === 'REMOVED'}
                  onClick={() => handleInitiateOrder(item)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] disabled:opacity-40 text-[#050505] font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShoppingBag size={14} aria-hidden="true" />
                  <span>Order or Enquire</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Admin Moderation Queue */}
      {role === 'PLATFORM_ADMIN' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Admin Marketplace Moderation Queue ({reports.length})</span>
          </h2>
          <div className="divide-y divide-[#27272a]">
            {reports.map((rep) => (
              <div key={rep.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-[#D4AF37]">
                    {rep.id} · {rep.targetType}:{rep.targetId} · {rep.reasonCategory} · {rep.status}
                  </div>
                  <div className="text-[#F5F5F5]">{rep.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModerate(rep.id, 'REMOVE_TARGET')}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-red-950/50 border border-red-800 text-red-200 cursor-pointer"
                  >
                    Remove Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(rep.id, 'RESTORE_TARGET')}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#F5F5F5] cursor-pointer"
                  >
                    Dismiss / Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default V22UniversalMarketplaceView;
