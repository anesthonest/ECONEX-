/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Mobile Money & Escrow Payment Simulator (Test Mode)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState } from 'react';
import { Order } from '../../types/index.ts';
import { ApiClient } from '../../services/apiClient.ts';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PaymentSimulatorModalProps {
  order: Order;
  onClose: () => void;
  onPaymentSuccess: (updatedOrder: Order) => void;
}

export const PaymentSimulatorModal: React.FC<PaymentSimulatorModalProps> = ({
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const [provider, setProvider] = useState<'MTN_MOMO_TEST' | 'AIRTEL_MONEY_TEST' | 'AROS_ESCROW_TEST'>('MTN_MOMO_TEST');
  const [phone, setPhone] = useState<string>(order.buyerPhone || '+256 772 000 000');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'DETAILS' | 'USSD_PROMPT' | 'SUCCESS'>('DETAILS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      await ApiClient.initiateTestPayment(order.id, phone, provider);
      setStep('USSD_PROMPT');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Payment initiation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateApprove = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const ref = `${provider === 'MTN_MOMO_TEST' ? 'MOMO' : 'AIRTEL'}-TEST-${Date.now().toString().slice(-6)}`;
      const res = await ApiClient.verifyTestPayment(order.id, ref, provider, phone);
      setStep('SUCCESS');
      setTimeout(() => {
        onPaymentSuccess(res.order);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Payment authorization failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider">
                Escrow Payment Gateway
              </h3>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/70 border border-amber-800 px-1.5 py-0.2 rounded">
                TEST SIMULATION ENVIRONMENT
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
            ✕
          </button>
        </div>

        {/* Warning Badge: No Real Funds */}
        <div className="bg-amber-950/40 border border-amber-800/80 p-2.5 rounded text-[11px] text-amber-200 flex items-start gap-2">
          <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Simulated Settlement:</strong> No real funds or credit balances are debited. This exercises the authenticated escrow lifecycle and order transition.
          </span>
        </div>

        {step === 'DETAILS' && (
          <form onSubmit={handleInitiate} className="space-y-4 text-xs">
            {/* Amount Summary */}
            <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] space-y-1">
              <div className="text-[11px] text-[#A0A0A0]">Contract #{order.orderNumber}</div>
              <div className="flex justify-between items-baseline">
                <span className="text-[#F5F5F5] font-medium">{order.productTitle}</span>
                <span className="text-base font-bold text-[#D4AF37] font-mono">
                  {order.totalAmountUGX.toLocaleString()} UGX
                </span>
              </div>
              <div className="text-[10px] text-[#71717a]">
                Seller: {order.sellerName} (Funds held in safety until delivery confirmation)
              </div>
            </div>

            {/* Provider Select */}
            <div>
              <label className="block text-[#A0A0A0] mb-1 font-medium">Select Payment Channel *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('MTN_MOMO_TEST')}
                  className={`p-2 rounded border text-center transition-all ${
                    provider === 'MTN_MOMO_TEST'
                      ? 'bg-amber-950/50 border-[#D4AF37] text-[#D4AF37]'
                      : 'bg-[#18181b] border-[#27272a] text-[#A0A0A0]'
                  }`}
                >
                  <div className="font-bold text-xs">MTN MoMo</div>
                  <div className="text-[9px]">Mobile Money</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('AIRTEL_MONEY_TEST')}
                  className={`p-2 rounded border text-center transition-all ${
                    provider === 'AIRTEL_MONEY_TEST'
                      ? 'bg-red-950/50 border-red-500 text-red-300'
                      : 'bg-[#18181b] border-[#27272a] text-[#A0A0A0]'
                  }`}
                >
                  <div className="font-bold text-xs">Airtel Money</div>
                  <div className="text-[9px]">Uganda Wallet</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('AROS_ESCROW_TEST')}
                  className={`p-2 rounded border text-center transition-all ${
                    provider === 'AROS_ESCROW_TEST'
                      ? 'bg-blue-950/50 border-blue-500 text-blue-300'
                      : 'bg-[#18181b] border-[#27272a] text-[#A0A0A0]'
                  }`}
                >
                  <div className="font-bold text-xs">ECONEX Escrow</div>
                  <div className="text-[9px]">Bank Deposit</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#A0A0A0] mb-1">Subscriber Mobile Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256 77X XXX XXX"
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] font-mono focus:border-[#D4AF37] outline-none"
              />
            </div>

            {errorMsg && (
              <div className="text-red-400 text-[11px] bg-red-950/50 p-2 rounded border border-red-900">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 border-t border-[#27272a] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded shadow-md disabled:opacity-50"
              >
                {isProcessing ? 'Connecting...' : 'Request Push Prompt'}
              </button>
            </div>
          </form>
        )}

        {step === 'USSD_PROMPT' && (
          <div className="space-y-4 text-xs text-center py-2">
            <div className="w-12 h-12 rounded-full bg-[#1c1c1f] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto animate-pulse">
              <Smartphone size={24} />
            </div>

            <div>
              <div className="font-bold text-[#F5F5F5] text-sm">USSD Push Dispatched</div>
              <p className="text-[#A0A0A0] text-[11px] mt-1">
                Prompt sent to <strong>{phone}</strong> for amount{' '}
                <strong className="text-[#D4AF37] font-mono">{order.totalAmountUGX.toLocaleString()} UGX</strong>.
              </p>
            </div>

            <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] text-left text-[11px] space-y-1 font-mono">
              <div className="text-[#A0A0A0]">SIMULATED HANDSET DISPLAY:</div>
              <div className="text-[#F5F5F5]">
                &quot;Authorize payment of UGX {order.totalAmountUGX.toLocaleString()} to VINEXSAH ECONEX ESCROW?&quot;
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setStep('DETAILS')}
                className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] text-[#A0A0A0] rounded hover:text-[#F5F5F5]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSimulateApprove}
                disabled={isProcessing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing ? 'Verifying PIN...' : 'Simulate Enter PIN & Approve'}
              </button>
            </div>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-3 text-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-sm font-bold text-[#F5F5F5]">Escrow Deposit Secured!</div>
            <p className="text-[#A0A0A0] text-[11px]">
              Order #{order.orderNumber} updated to <strong>PAID</strong>. Funds held securely in escrow pending seller dispatch and delivery.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
