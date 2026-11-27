/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Plain-Language Financial & Payments View
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Order } from '../../types/index.ts';
import { PaymentStatusCard } from '../ux/DomainCards.tsx';
import { EmptyState, AccessibleDialog } from '../ux/CorePrimitives.tsx';
import { formatMoney } from '../../i18n/econexTranslations.ts';

interface Props {
  onOpenPaymentModal: (order: Order) => void;
  onReportDispute: (prefillSubject: string) => void;
  onNavigate?: (tab: string) => void;
}

export const FinancialSimpleView: React.FC<Props> = ({ onOpenPaymentModal, onReportDispute, onNavigate }) => {
  const { currentUser, role } = useAuth();
  const { language } = useExperience();

  const [orders, setOrders] = useState<Order[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [v15Payments, setV15Payments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    tenantId: 'TEN-UG-ELGON-01',
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const [ordRes, provRes, finRes] = await Promise.all([
        ApiClient.getOrders().catch(() => []),
        ApiClient.v15GetProviders(actor).catch(() => ({ providers: [] })),
        ApiClient.v15GetFinancial(actor).catch(() => ({ providerTransactions: [] })),
      ]);
      setOrders(Array.isArray(ordRes) ? ordRes : []);
      setProviders(provRes?.providers || []);
      setV15Payments(finRes?.providerTransactions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [currentUser?.id]);

  const unpaidOrders = orders.filter(
    (o) =>
      (o.buyerId === currentUser?.id || role === 'PLATFORM_ADMIN') &&
      (o.status === 'ACCEPTED' || o.status === 'AWAITING_PAYMENT' || o.status === 'PAYMENT_PENDING')
  );

  const liveProvidersConfigured = providers.filter((p) => p.lifecycleState === 'PRODUCTION_ACTIVE').length;

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-[#F5F5F5]">My Payments &amp; Money</h1>
            <p className="text-sm text-[#A0A0A0]">
              Clear record of money sent, money received, and payments waiting for confirmation. We never show a payment as finished until the payment provider confirms receipt.
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('v23-wallet')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold shrink-0 cursor-pointer"
            >
              Open Universal Wallet
            </button>
          )}
        </div>

        {/* Honest Provider Status Disclosure */}
        <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] flex items-start gap-3 text-xs text-[#C0C0C0]">
          {liveProvidersConfigured > 0 ? (
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertTriangle size={18} className="text-[#D4AF37] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="space-y-1">
            <div className="font-semibold text-[#F5F5F5]">
              {liveProvidersConfigured > 0
                ? `${liveProvidersConfigured} live payment channel active`
                : 'Sandbox / Test Mode Active for Payment Channels'}
            </div>
            <p className="text-[#A0A0A0]">
              Live bank or Mobile Money rails are in sandbox verification ({providers.length} registered channels). No real bank or mobile wallet money is debited during pilot verification.
            </p>
          </div>
        </div>
      </div>

      {/* Orders Ready to Pay */}
      {unpaidOrders.length > 0 && (
        <section className="space-y-3" aria-label="Orders waiting for your payment">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Waiting for Your Payment</h2>
          <div className="space-y-3">
            {unpaidOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs text-[#A0A0A0] font-mono">{ord.orderNumber}</div>
                  <div className="text-base font-semibold text-[#F5F5F5]">{ord.productTitle}</div>
                  <div className="text-sm text-[#C0C0C0]">Seller: {ord.sellerName}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-[#D4AF37] tabular-nums">
                    {formatMoney(ord.totalAmountUGX, 'UGX', language)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmOrder(ord)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold cursor-pointer"
                  >
                    Review &amp; Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Payment Activity List */}
      <section className="space-y-3" aria-label="Recent payments">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Recent Payments &amp; Receipts</h2>
          <button
            type="button"
            onClick={() => onReportDispute('Payment Question or Missing Receipt')}
            className="text-sm text-[#D4AF37] hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle size={15} aria-hidden="true" />
            <span>Need help with a payment?</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 text-sm text-[#A0A0A0]">
            Loading payment records...
          </div>
        ) : v15Payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={22} />}
            title="No payments recorded yet"
            description="Once you initiate or receive a payment, its exact progress (pending confirmation, successful, or failed) will show here."
          />
        ) : (
          <div className="space-y-3">
            {v15Payments.map((tx: any) => (
              <PaymentStatusCard
                key={tx.id}
                amount={tx.amount || 0}
                currency={tx.currency || 'UGX'}
                counterparty={tx.payerParticipantId === currentUser?.id ? `Paid via ${tx.providerId}` : `Participant: ${tx.payerParticipantId || 'Network Buyer'}`}
                reference={tx.idempotencyKey || tx.id}
                dateIso={tx.initiatedAt || tx.updatedAt || new Date().toISOString()}
                providerName={tx.providerId || 'Payment Channel'}
                rawStatus={tx.status}
                direction={tx.payeeParticipantId === currentUser?.id ? 'RECEIVED' : 'SENT'}
                onReportProblem={() => onReportDispute(`Dispute / Help for payment ${tx.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pre-Send Confirmation Step */}
      <AccessibleDialog
        isOpen={Boolean(confirmOrder)}
        title="Confirm Payment Details Before Sending"
        onClose={() => setConfirmOrder(null)}
      >
        {confirmOrder && (
          <div className="space-y-4 text-sm text-[#C0C0C0]">
            <p className="text-[#F5F5F5]">
              Please check who you are paying and the total amount before choosing a payment channel.
            </p>
            <div className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2">
              <div className="flex justify-between">
                <span>Order Number</span>
                <strong className="font-mono text-[#F5F5F5]">{confirmOrder.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Paying To</span>
                <strong className="text-[#F5F5F5]">{confirmOrder.sellerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Amount</span>
                <strong className="text-[#D4AF37] tabular-nums">
                  {formatMoney(confirmOrder.totalAmountUGX, 'UGX', language)}
                </strong>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const o = confirmOrder;
                  setConfirmOrder(null);
                  onOpenPaymentModal(o);
                }}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] font-semibold cursor-pointer"
              >
                Continue to Payment Channel
              </button>
              <button
                type="button"
                onClick={() => setConfirmOrder(null)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#181818] border border-[#27272a] text-[#C0C0C0] cursor-pointer"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </AccessibleDialog>
    </div>
  );
};
