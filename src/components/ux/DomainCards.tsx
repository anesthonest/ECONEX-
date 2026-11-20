/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Domain Cards (Product, Order, Payment, Opportunity, Help)
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState } from 'react';
import {
  MapPin,
  Package,
  Truck,
  CreditCard,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  Clock,
  Volume2,
} from 'lucide-react';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { formatMoney, formatShortDate } from '../../i18n/econexTranslations.ts';
import { StatusLabel } from './CorePrimitives.tsx';
import { speakTextOutLoud } from './VoiceHelpButton.tsx';

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
  onAction,
  actionLabel = 'Order or Enquire',
}) => {
  const { language, lowBandwidth } = useExperience();
  const [imgError, setImgError] = useState(false);

  return (
    <article className="bg-[#121212] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col justify-between">
      <div>
        {!lowBandwidth && imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-44 object-cover bg-[#181818]"
          />
        ) : (
          <div className="w-full h-32 bg-[#181818] border-b border-[#27272a] flex items-center justify-center gap-2 text-[#A0A0A0] text-xs px-4 text-center">
            <Package size={24} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
            <span>{lowBandwidth ? 'Low-data mode active (image hidden)' : title}</span>
          </div>
        )}

        <div className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
            <span>{location}</span>
            <span aria-hidden="true">·</span>
            <span>{verifiedSeller ? 'Verified seller' : 'New registrant'}</span>
          </div>
          <h3 className="text-base font-semibold text-[#F5F5F5] leading-snug">{title}</h3>
          <div className="text-xl font-bold text-[#D4AF37] tabular-nums">
            {formatMoney(price, currency, language)} <span className="text-xs font-normal text-[#A0A0A0]">/ {unit}</span>
          </div>
          <div className="text-xs text-[#C0C0C0] space-y-1">
            <div>Seller: {sellerName}</div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <MapPin size={13} aria-hidden="true" />
              <span>Available: {availabilityText}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={onAction}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
};

export function plainOrderStatus(raw: string): { tone: 'good' | 'wait' | 'warn' | 'neutral'; label: string } {
  const s = String(raw || '').toUpperCase();
  if (s === 'COMPLETED' || s === 'DELIVERED' || s === 'DELIVERY_VERIFIED' || s === 'RECONCILED') {
    return { tone: 'good', label: 'Completed and delivered' };
  }
  if (s === 'DISPATCHED' || s === 'IN_TRANSIT') {
    return { tone: 'wait', label: 'On the way to delivery' };
  }
  if (s === 'PAYMENT_PENDING' || s === 'PENDING' || s === 'REQUESTED') {
    return { tone: 'wait', label: 'Waiting for confirmation or payment' };
  }
  if (s === 'REJECTED' || s === 'CANCELLED') {
    return { tone: 'warn', label: 'Cancelled or declined' };
  }
  return { tone: 'neutral', label: 'Order accepted and being prepared' };
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
}> = ({ reference, itemTitle, counterparty, amount, currency = 'UGX', dateIso, rawStatus, onAction, actionLabel }) => {
  const { language } = useExperience();
  const status = plainOrderStatus(rawStatus);
  return (
    <article className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A0A0A0]">
          <span className="font-mono">{reference}</span>
          <span aria-hidden="true">·</span>
          <span>{formatShortDate(dateIso, language)}</span>
        </div>
        <h3 className="text-base font-semibold text-[#F5F5F5]">{itemTitle}</h3>
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
      title: direction === 'RECEIVED' ? 'Money received · Payment successful' : 'Money sent · Payment successful',
      stageExplanation: 'Confirmed by payment provider receipt and recorded safely.',
    };
  }
  if (s.includes('REFUND') && (s.includes('COMPLETE') || s.includes('APPROVED'))) {
    return {
      tone: 'good',
      title: 'Refund completed',
      stageExplanation: 'Refund has been processed back to your payment channel.',
    };
  }
  if (s.includes('REFUND')) {
    return {
      tone: 'wait',
      title: 'Refund requested',
      stageExplanation: 'Awaiting provider confirmation of refund completion.',
    };
  }
  if (s === 'FAILED' || s === 'REJECTED') {
    return {
      tone: 'warn',
      title: 'Payment failed',
      stageExplanation: 'No money was settled. Check your balance or try again.',
    };
  }
  return {
    tone: 'wait',
    title: 'Payment pending confirmation',
    stageExplanation: 'Submitted, waiting for your payment provider to confirm money moved.',
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
            Report missing or disputed payment
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
  onApply: () => void;
  applied?: boolean;
}> = ({ title, organization, location, category, summary, onApply, applied }) => (
  <article className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col justify-between gap-4">
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
        <Briefcase size={13} className="text-[#D4AF37]" aria-hidden="true" />
        <span>{category}</span>
        <span aria-hidden="true">·</span>
        <span>{location}</span>
      </div>
      <h3 className="text-base font-semibold text-[#F5F5F5]">{title}</h3>
      <div className="text-xs text-[#C0C0C0]">{organization}</div>
      <p className="text-sm text-[#A0A0A0] leading-relaxed">{summary}</p>
    </div>
    <button
      type="button"
      disabled={applied}
      onClick={onApply}
      className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
        applied
          ? 'bg-[#181818] border border-emerald-700/60 text-emerald-400'
          : 'bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505]'
      }`}
    >
      {applied ? 'Application Submitted' : 'Apply for Opportunity'}
    </button>
  </article>
);

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
