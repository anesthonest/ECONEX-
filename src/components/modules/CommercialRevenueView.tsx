import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  TrendingUp,
  FileText,
  DollarSign,
  Building2,
  CheckCircle2,
  Zap,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { SubscriptionPlan, CommercialSubscription, BillingInvoice } from '../../types';

export const CommercialRevenueView: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<CommercialSubscription[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Subscribe modal
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [subscriberId, setSubscriberId] = useState('PART-UG-KLA-001');

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, iRes] = await Promise.all([
        apiClient.getSubscriptionPlans(),
        apiClient.getSubscriptions(),
        apiClient.getBillingInvoices()
      ]);
      setPlans(pRes || []);
      setSubscriptions(sRes || []);
      setInvoices(iRes || []);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to load billing infrastructure', error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    try {
      const res = await apiClient.subscribeToPlan(subscriberId, selectedPlan.id, 'UGX');
      setActionMsg({ text: `Subscribed to ${selectedPlan.name}. Invoice ${res.invoice.invoiceNumber} generated.` });
      setSelectedPlan(null);
      loadBillingData();
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Subscription failed', error: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121212] border border-[#262626] p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-[#D4AF37]" />
              <h1 className="text-xl font-semibold text-[#F5F5F5] tracking-tight">
                ECONEX Commercial Revenue & Subscription Infrastructure
              </h1>
            </div>
            <p className="text-sm text-[#A0A0A0]">
              Multi-tier SaaS plans, automated usage metering, tax-compliant invoicing, commission settlement and recurring billing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#D4AF37] px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded">
              COMMERCIAL ENGINE: V7 ACTIVE
            </span>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3.5 rounded text-xs border ${actionMsg.error ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Active Subscriptions</div>
          <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 tabular-nums">
            {subscriptions.length} <span className="text-xs font-normal text-[#808080]">Accounts</span>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">100% recurring auto-renew</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Monthly Recurring Revenue</div>
          <div className="text-xl font-bold font-mono text-[#D4AF37] mt-1 tabular-nums">
            UGX {(subscriptions.reduce((sum, s) => sum + s.recurringAmount, 0) / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">Multi-currency denominated</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Invoiced Billings</div>
          <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 tabular-nums">
            {invoices.length} <span className="text-xs font-normal text-[#808080]">Invoices</span>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">18% statutory URA VAT collected</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Gross Margin Ratio</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            87.4%
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">After rail & inference costs</div>
        </div>
      </div>

      {/* Subscription Plans Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A0A0A0]">
            Configurable Universal Subscription Plans ({plans.length})
          </h2>
          <span className="text-xs font-mono text-[#808080]">PRICED IN UGX, KES, USD</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(p => (
            <div
              key={p.id}
              className="bg-[#121212] border border-[#262626] p-5 rounded-lg flex flex-col justify-between hover:border-[#D4AF37]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1c1c1f] text-[#D4AF37] border border-[#2f2f35]">
                    {p.tier}
                  </span>
                  <span className="text-[11px] text-[#808080] uppercase">{p.targetCategory}</span>
                </div>
                <h3 className="text-sm font-semibold text-[#F5F5F5] mb-2">{p.name}</h3>
                <div className="text-xl font-bold font-mono text-[#F5F5F5] mb-4">
                  {p.pricing.UGX === 0 ? (
                    <span className="text-emerald-400">FREE TIER</span>
                  ) : (
                    <>UGX {p.pricing.UGX.toLocaleString()} <span className="text-xs font-normal text-[#808080]">/mo</span></>
                  )}
                </div>
                <ul className="space-y-1.5 text-xs text-[#A0A0A0] mb-4">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="text-[11px]">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlan(p)}
                className="w-full py-2 px-3 bg-[#181818] hover:bg-[#222222] text-[#F5F5F5] text-xs font-medium rounded border border-[#333333] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Select Plan</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Subscriptions and Billing Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Subscriptions Table */}
        <div className="bg-[#121212] border border-[#262626] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Active Subscriptions ({subscriptions.length})</h3>
            <span className="text-xs font-mono text-[#808080]">STATUS: ACTIVE</span>
          </div>
          <div className="divide-y divide-[#202020]">
            {subscriptions.map(sub => (
              <div key={sub.id} className="p-4 hover:bg-[#161616] transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#F5F5F5]">{sub.subscriberName}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                    {sub.status}
                  </span>
                </div>
                <div className="text-xs text-[#A0A0A0]">Plan: {sub.planName} ({sub.tier})</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#808080] pt-1">
                  <span>Rate: {sub.currency} {sub.recurringAmount.toLocaleString()}/mo</span>
                  <span>Usage: {sub.usageCounts.monthlyTransactions} txs · {sub.usageCounts.seatsUsed} seats</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-[#121212] border border-[#262626] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#262626] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Billing Invoices & VAT Ledger ({invoices.length})</h3>
            <span className="text-xs font-mono text-[#808080]">STATUTORY URA 18%</span>
          </div>
          <div className="divide-y divide-[#202020]">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 hover:bg-[#161616] transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#D4AF37]">{inv.invoiceNumber}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${inv.status === 'PAID' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="text-xs text-[#F5F5F5]">{inv.customerName}</div>
                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-[#808080]">
                  <span>Subtotal: {inv.currency} {inv.subtotal.toLocaleString()}</span>
                  <span>18% VAT: {inv.currency} {inv.taxAmount.toLocaleString()}</span>
                  <span className="text-[#F5F5F5] font-semibold">Total: {inv.currency} {inv.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2e2e33] p-6 rounded-lg max-w-md w-full space-y-4">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Subscribe to {selectedPlan.name}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Subscriber Economic Participant ID</label>
                <input
                  type="text"
                  value={subscriberId}
                  onChange={e => setSubscriberId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="p-3 bg-[#181818] border border-[#282828] rounded space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-[#808080]">
                  <span>Monthly Base:</span>
                  <span className="text-[#F5F5F5]">UGX {selectedPlan.pricing.UGX.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#808080]">
                  <span>URA Statutory VAT (18%):</span>
                  <span className="text-[#F5F5F5]">UGX {((selectedPlan.pricing.UGX * 18) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#D4AF37] font-bold border-t border-[#333333] pt-1">
                  <span>Total Recurring Due:</span>
                  <span>UGX {((selectedPlan.pricing.UGX * 1.18)).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-3 py-1.5 bg-[#1C1C1C] text-xs text-[#A0A0A0] rounded hover:text-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscribe}
                className="px-4 py-1.5 bg-[#D4AF37] text-xs font-semibold text-[#050505] rounded hover:bg-[#E5C158]"
              >
                Confirm Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
