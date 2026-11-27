/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V29.0 - Visual Domain Cards (Product, Order, Payment, Opportunity, Sector, Business, Help)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React from 'react';
import {
  MapPin,
  Truck,
  CreditCard,
  Briefcase,
  HelpCircle,
  Volume2,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { formatMoney, formatShortDate } from '../../i18n/econexTranslations.ts';
import { OrderDeliveryTimeline, StatusLabel } from './CorePrimitives.tsx';
import { speakTextOutLoud } from './VoiceHelpButton.tsx';
import { EconexImage } from './EconexImage.tsx';
import { resolveMarketplaceAsset } from '../../config/econexAssetManifest.ts';

export const ProductCard: React.FC<{
  title: string;
  price: number;
  currency?: string;
  unit: string;
  sellerName: string;
  location: string;
  availabilityText: string;
  verifiedSeller?: boolean;
  imageUrl?: string;
  category?: string;
  sectorCode?: string;
  onAction: () => void;
  actionLabel?: string;
}> = ({
  title,
  price,
  currency = 'UGX',
  unit,
  sellerName,
  location,
  availabilityText,
  verifiedSeller = false,
  imageUrl,
  category,
  sectorCode,
  onAction,
  actionLabel = 'Order or Enquire',
}) => {
  const { language } = useExperience();
  const resolvedMedia = resolveMarketplaceAsset({
    imageUrl,
    title,
    category,
    sectorCode,
  });

  return (
    <article className="bg-[#121212] border border-[#27272a] hover:border-[#D4AF37]/60 transition-colors rounded-2xl overflow-hidden flex flex-col justify-between group">
      <div>
        <EconexImage
          src={resolvedMedia.path}
          alt={resolvedMedia.alt || title}
          fallbackLabel={title}
          aspectClassName="h-44 w-full"
          overlayGradient
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />

        <div className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span>{location}</span>
            <span aria-hidden="true">·</span>
            <span className={verifiedSeller ? 'text-emerald-400 font-medium' : 'text-[#C0C0C0]'}>
              {verifiedSeller ? 'Verified seller' : 'Listed seller'}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[#F5F5F5] leading-snug line-clamp-2">{title}</h3>
          <div className="text-xl font-bold text-[#D4AF37] tabular-nums">
            {formatMoney(price, currency, language)} <span className="text-xs font-normal text-[#A0A0A0]">/ {unit}</span>
          </div>
          <div className="text-xs text-[#C0C0C0] space-y-1">
            <div className="truncate">By {sellerName}</div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <MapPin size={13} className="shrink-0" aria-hidden="true" />
              <span>Available: {availabilityText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={onAction}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};

export function plainOrderStatus(raw: string): { tone: 'good' | 'wait' | 'warn' | 'neutral'; label: string } {
  const s = String(raw || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'DELIVERY_VERIFIED' || s === 'RECONCILED') {
    return { tone: 'good', label: 'Delivered' };
  }
  if (s === 'DISPATCHED' || s === 'IN_TRANSIT') {
    return { tone: 'wait', label: 'Dispatched · In transit' };
  }
  if (s === 'PREPARING' || s === 'READY_FOR_DISPATCH' || s === 'PAID') {
    return { tone: 'neutral', label: 'Processing your order' };
  }
  if (s === 'ACCEPTED') {
    return { tone: 'neutral', label: 'Confirmed' };
  }
  if (s === 'PAYMENT_PENDING' || s === 'AWAITING_PAYMENT' || s === 'PENDING' || s === 'REQUESTED' || s === 'SUBMITTED') {
    return { tone: 'wait', label: 'Order placed · Waiting confirmation' };
  }
  if (s === 'REJECTED' || s === 'CANCELLED' || s === 'DISPUTED') {
    return { tone: 'warn', label: 'Cancelled or paused' };
  }
  return { tone: 'neutral', label: 'Confirmed' };
}

export const OrderStatusCard: React.FC<{
  reference: string;
  itemTitle: string;
  counterparty: string;
  amount: number;
  currency?: string;
  dateIso: string;
  rawStatus: string;
  onAction?: () => void;
  actionLabel?: string;
  showTimeline?: boolean;
}> = ({
  reference,
  itemTitle,
  counterparty,
  amount,
  currency = 'UGX',
  dateIso,
  rawStatus,
  onAction,
  actionLabel,
  showTimeline = true,
}) => {
  const { language } = useExperience();
  const status = plainOrderStatus(rawStatus);
  return (
    <article className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
            <span className="font-mono text-[#C0C0C0]">{reference}</span>
            <span aria-hidden="true">·</span>
            <span>{formatShortDate(dateIso, language)}</span>
          </div>
          <h3 className="text-base font-semibold text-[#F5F5F5] truncate">{itemTitle}</h3>
          <div className="text-sm text-[#C0C0C0] flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-[#A0A0A0]" aria-hidden="true" />
              <span>{counterparty}</span>
            </span>
            <StatusLabel tone={status.tone} label={status.label} />
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <div className="text-lg font-bold text-[#F5F5F5] tabular-nums">{formatMoney(amount, currency, language)}</div>
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm font-medium text-[#D4AF37] cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {showTimeline && <OrderDeliveryTimeline rawStatus={rawStatus} compact />}
    </article>
  );
};

export function plainPaymentDescription(status: string, direction: 'SENT' | 'RECEIVED'): {
  tone: 'good' | 'wait' | 'warn';
  title: string;
  stageExplanation: string;
} {
  const s = String(status || '').toUpperCase();
  if (s === 'SETTLED' || s === 'SETTLEMENT_CONFIRMED' || s === 'RECONCILED' || s === 'ESCROW_FUNDED') {
    return {
      tone: 'good',
      title: direction === 'RECEIVED' ? 'Money received · Confirmed' : 'Money sent · Confirmed',
      stageExplanation: 'Recorded and confirmed in sandbox transaction history.',
    };
  }
  if (s.includes('REFUND') && (s.includes('COMPLETE') || s.includes('APPROVED'))) {
    return {
      tone: 'good',
      title: 'Refund completed',
      stageExplanation: 'Refund has been processed back to your account channel.',
    };
  }
  if (s.includes('REFUND')) {
    return {
      tone: 'wait',
      title: 'Refund requested',
      stageExplanation: 'Waiting for confirmation of refund completion.',
    };
  }
  if (s === 'FAILED' || s === 'REJECTED') {
    return {
      tone: 'warn',
      title: 'Payment not completed',
      stageExplanation: 'No funds were settled. Review your details and try again.',
    };
  }
  return {
    tone: 'wait',
    title: 'Payment pending confirmation',
    stageExplanation: 'Submitted and waiting for provider confirmation.',
  };
}

export const PaymentStatusCard: React.FC<{
  amount: number;
  currency: string;
  counterparty: string;
  reference: string;
  dateIso: string;
  providerName: string;
  rawStatus: string;
  direction?: 'SENT' | 'RECEIVED';
  onReportProblem?: () => void;
}> = ({ amount, currency, counterparty, reference, dateIso, providerName, rawStatus, direction = 'SENT', onReportProblem }) => {
  const { language } = useExperience();
  const desc = plainPaymentDescription(rawStatus, direction);

  return (
    <article className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <StatusLabel tone={desc.tone} label={desc.title} />
          <div className="text-sm text-[#C0C0C0]">{counterparty}</div>
        </div>
        <div className="text-xl font-bold text-[#F5F5F5] tabular-nums">{formatMoney(amount, currency, language)}</div>
      </div>

      <p className="text-xs text-[#A0A0A0]">{desc.stageExplanation}</p>

      <div className="pt-2 border-t border-[#27272a] flex flex-wrap items-center justify-between gap-2 text-xs text-[#A0A0A0]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <CreditCard size={13} aria-hidden="true" />
            <span>{providerName}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">Ref: {reference}</span>
          <span aria-hidden="true">·</span>
          <span>{formatShortDate(dateIso, language)}</span>
        </div>
        {onReportProblem && (
          <button
            type="button"
            onClick={onReportProblem}
            className="text-[#D4AF37] hover:underline font-medium cursor-pointer"
          >
            Report an issue
          </button>
        )}
      </div>
    </article>
  );
};

export const OpportunityCard: React.FC<{
  title: string;
  organization: string;
  location: string;
  category: string;
  summary: string;
  imageUrl?: string;
  onApply: () => void;
  applied?: boolean;
}> = ({ title, organization, location, category, summary, imageUrl, onApply, applied }) => {
  const asset = resolveMarketplaceAsset({ imageUrl, title, category });
  return (
    <article className="bg-[#121212] border border-[#27272a] hover:border-[#D4AF37]/50 transition-colors rounded-2xl overflow-hidden flex flex-col justify-between">
      <div>
        <EconexImage
          src={asset.path}
          alt={asset.alt}
          fallbackLabel={title}
          aspectClassName="h-36 w-full"
          overlayGradient
        />
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <Briefcase size={13} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
            <span className="truncate">{category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{location}</span>
          </div>
          <h3 className="text-base font-semibold text-[#F5F5F5] line-clamp-2">{title}</h3>
          <div className="text-xs text-[#C0C0C0]">{organization}</div>
          <p className="text-sm text-[#A0A0A0] leading-relaxed line-clamp-3">{summary}</p>
        </div>
      </div>
      <div className="px-5 pb-5">
        <button
          type="button"
          disabled={applied}
          onClick={onApply}
          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
            applied
              ? 'bg-[#181818] border border-emerald-700/60 text-emerald-400'
              : 'bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505]'
          }`}
        >
          {applied ? 'Application Submitted' : 'View & Apply'}
        </button>
      </div>
    </article>
  );
};

export const BusinessVisualCard: React.FC<{
  name: string;
  sectorLabel: string;
  location: string;
  summary: string;
  verified?: boolean;
  imageUrl?: string;
  onAction: () => void;
  actionLabel?: string;
}> = ({
  name,
  sectorLabel,
  location,
  summary,
  verified = false,
  imageUrl,
  onAction,
  actionLabel = 'View Profile',
}) => {
  const asset = resolveMarketplaceAsset({ imageUrl, title: name, sectorCode: sectorLabel });
  return (
    <article className="bg-[#121212] border border-[#27272a] hover:border-[#D4AF37]/60 transition-colors rounded-2xl overflow-hidden flex flex-col justify-between group">
      <div>
        <EconexImage
          src={asset.path}
          alt={asset.alt}
          fallbackLabel={name}
          aspectClassName="h-36 w-full"
          overlayGradient
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <Building2 size={13} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
            <span className="truncate">{sectorLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{location}</span>
          </div>
          <h3 className="text-base font-semibold text-[#F5F5F5] line-clamp-1">{name}</h3>
          <p className="text-xs text-[#A0A0A0] leading-relaxed line-clamp-2">{summary}</p>
          <div className="text-xs font-medium text-emerald-400">
            {verified ? 'Identity verified' : 'Active registered business'}
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={onAction}
          className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm font-medium text-[#D4AF37] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};

export const HelpCentreCard: React.FC<{
  title: string;
  steps: string[];
  onStartAction?: () => void;
  actionLabel?: string;
}> = ({ title, steps, onStartAction, actionLabel }) => {
  const { language } = useExperience();
  return (
    <article className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[#F5F5F5]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => speakTextOutLoud(`${title}. ${steps.join('. ')}`, language)}
            aria-label={`Read aloud: ${title}`}
            className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#C0C0C0] flex items-center gap-1 cursor-pointer"
          >
            <Volume2 size={14} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Listen</span>
          </button>
        </div>
        <ol className="space-y-1.5 text-sm text-[#C0C0C0] list-decimal list-inside leading-relaxed">
          {steps.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ol>
      </div>
      {onStartAction && actionLabel && (
        <button
          type="button"
          onClick={onStartAction}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-sm font-medium text-[#D4AF37] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </article>
  );
};
