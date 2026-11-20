import React, { useState } from 'react';
import {
  Landmark,
  Users,
  ShieldCheck,
  Ticket,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Percent,
  Banknote
} from 'lucide-react';
import {
  FinancialProduct,
  SavingsGroup,
  InsuranceClaim,
  AgriculturalVoucher,
  User
} from '../../types';
import { api } from '../../services/apiClient';

interface FinanceResilienceViewProps {
  currentUser: User;
  financialProducts: FinancialProduct[];
  savingsGroups: SavingsGroup[];
  insuranceClaims: InsuranceClaim[];
  vouchers: AgriculturalVoucher[];
  onRefresh: () => void;
}

export const FinanceResilienceView: React.FC<FinanceResilienceViewProps> = ({
  currentUser,
  financialProducts,
  savingsGroups,
  insuranceClaims,
  vouchers,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'vsla' | 'insurance' | 'vouchers'>('products');

  // VSLA Share Contribution State
  const [contributingGroup, setContributingGroup] = useState<SavingsGroup | null>(null);
  const [shareShares, setShareShares] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Insurance Claim State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimPolicyNumber, setClaimPolicyNumber] = useState('UAP-AGRI-2026-904');
  const [claimPeril, setClaimPeril] = useState<'DROUGHT' | 'EXCESS_RAIN' | 'PEST_OUTBREAK' | 'HAIL' | 'FROST'>('DROUGHT');
  const [claimAmountUgx, setClaimAmountUgx] = useState(2500000);
  const [claimDescription, setClaimDescription] = useState('Prolonged dry spell during tasseling phase verified by satellite NDVI anomaly.');

  // Voucher Redeem State
  const [redeemVoucherId, setRedeemVoucherId] = useState<string | null>(null);

  const handleContributeShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGroup) return;
    setActionLoading(true);
    setActionFeedback(null);

    const unitShare = contributingGroup.shareValueUgx || contributingGroup.shareValueUGX || 10000;
    const shareAmount = unitShare * shareShares;
    const res = await api.contributeVslaShare({
      groupId: contributingGroup.id,
      amountUgx: shareAmount,
      sharesCount: shareShares
    });

    setActionLoading(false);
    if (res.error) {
      setActionFeedback({ type: 'error', text: res.error });
    } else {
      setActionFeedback({
        type: 'success',
        text: `Successfully contributed UGX ${shareAmount.toLocaleString()} (${shareShares} share(s)) to ${contributingGroup.name}!`
      });
      setTimeout(() => {
        setContributingGroup(null);
        setActionFeedback(null);
        onRefresh();
      }, 1500);
    }
  };

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionFeedback(null);

    try {
      const claim = await api.submitInsuranceClaim({
        farmerId: currentUser.id,
        farmerName: currentUser.name,
        policyType: 'DROUGHT_INDEX',
        crop: 'Highland Maize & Beans',
        acreage: 2.5,
        claimAmountUGX: Number(claimAmountUgx),
        evidenceNotes: claimDescription
      });

      setActionLoading(false);
      setActionFeedback({
        type: 'success',
        text: `Claim ${claim.claimNumber || claim.id} filed for automated satellite weather index validation!`
      });
      setTimeout(() => {
        setShowClaimModal(false);
        setActionFeedback(null);
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setActionLoading(false);
      setActionFeedback({ type: 'error', text: err.message || 'Claim submission failed.' });
    }
  };

  const handleRedeemVoucher = async (voucherId: string) => {
    setRedeemVoucherId(voucherId);
    setActionFeedback(null);

    try {
      await api.redeemVoucher(voucherId, currentUser.id);
      setRedeemVoucherId(null);
      setActionFeedback({
        type: 'success',
        text: `Voucher redeemed successfully! Subsidy disbursement recorded.`
      });
      onRefresh();
    } catch (err: any) {
      setRedeemVoucherId(null);
      setActionFeedback({ type: 'error', text: err.message || 'Voucher redemption failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 uppercase tracking-widest font-mono">
              Rural Capital & Risk Shield
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-[#D4AF37]" />
            Agricultural Finance & Resilience
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
            Bridging liquidity gaps with seasonal credit, digitized Village Savings & Loan Associations (VSLA), parametric index insurance, and government e-vouchers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowClaimModal(true)}
            className="flex items-center gap-2 bg-[#181818] hover:bg-[#252525] border border-[#333] text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> File Parametric Claim
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className={`p-3 rounded text-xs border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
          }`}
        >
          {actionFeedback.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 border-b border-[#222] text-sm">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'products'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          Credit & Working Capital ({financialProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('vsla')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'vsla'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          VSLA Community Savings ({savingsGroups.length})
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'insurance'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          Parametric Insurance ({insuranceClaims.length} Claims)
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'vouchers'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#A0A0A0] hover:text-white'
          }`}
        >
          MAAIF Subsidized Input Vouchers ({vouchers.length})
        </button>
      </div>

      {/* Credit & Products */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="p-4 rounded bg-[#121212] border border-[#222] text-xs text-[#A0A0A0]">
            Agricultural credit lines structured specifically for smallholders and aggregators with harvest-aligned bullet repayment cycles.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {financialProducts.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded bg-[#121212] border border-[#222] hover:border-[#333] transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40 uppercase">
                      {(p.category || p.productType || 'AGRI_LOAN').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#A0A0A0] font-mono">{p.interestRatePct || p.interestRateAnnualPct || 12}% p.a.</span>
                  </div>
                  <h3 className="font-bold text-white text-base mt-2">{p.name || p.institutionName}</h3>
                  <p className="text-xs text-[#A0A0A0] mt-1">{p.providerName || p.institutionName}</p>
                  <p className="text-xs text-[#C0C0C0] mt-3 leading-relaxed">{p.description || p.eligibilityCriteria}</p>
                </div>

                <div className="pt-3 border-t border-[#1f1f1f] space-y-2 text-xs">
                  <div className="flex justify-between font-mono text-[#A0A0A0]">
                    <span>Tenure:</span>
                    <span className="text-white">{p.tenureMonths || p.repaymentPeriodMonths || 12} Months</span>
                  </div>
                  <div className="flex justify-between font-mono text-[#A0A0A0]">
                    <span>Credit Range:</span>
                    <span className="text-white">
                      UGX {((p.minAmountUgx || 1000000) / 1000000).toFixed(1)}M – {((p.maxAmountUgx || p.maxAmountUGX || 10000000) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[#A0A0A0]">
                    <span>Collateral:</span>
                    <span className="text-[#D4AF37]">{p.collateralRequired ? 'Required' : 'Zero Collateral (Crop Pledge)'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setActionFeedback({
                        type: 'success',
                        text: `Loan application workflow initiated for ${p.name}. Provider agent will verify your ECONEX farm yield history.`,
                      });
                    }}
                    className="w-full mt-2 bg-[#181818] hover:bg-[#222] border border-[#333] text-white py-2 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    Apply with Verified Yield Track <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VSLA Savings Groups */}
      {activeTab === 'vsla' && (
        <div className="space-y-4">
          <div className="p-4 rounded bg-[#121212] border border-[#222] text-xs text-[#A0A0A0] flex items-center justify-between">
            <span>
              Digitized Village Savings & Loan Associations (VSLA) enable group collateral, micro-loans for agro-inputs, and transparent community treasury audits.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGroups.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded bg-[#121212] border border-[#222] hover:border-[#333] transition-colors space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{g.name}</h3>
                    <p className="text-xs text-[#A0A0A0] mt-0.5">
                      {g.district} • Cycle #{g.cycleNumber}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-mono">
                    {g.membersCount} Members
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-[#0d0d0d] rounded border border-[#222] text-xs">
                  <div>
                    <span className="text-[#A0A0A0] block text-[10px] font-mono">TOTAL SAVED</span>
                    <span className="font-mono font-bold text-white">
                      UGX {(g.totalSavingsUgx || g.totalSavingsUGX || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A0A0A0] block text-[10px] font-mono">LOANS OUTSTANDING</span>
                    <span className="font-mono text-amber-400">
                      UGX {(g.loansOutstandingUgx || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A0A0A0] block text-[10px] font-mono">SHARE VALUE</span>
                    <span className="font-mono text-[#D4AF37]">
                      UGX {(g.shareValueUgx || g.shareValueUGX || 10000).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f]">
                  <span className="text-xs text-[#A0A0A0]">Next Meeting: {g.nextMeetingDate || g.meetingSchedule}</span>
                  <button
                    onClick={() => setContributingGroup(g)}
                    className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#050505] font-semibold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Buy Share / Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Claims */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          <div className="p-4 rounded bg-[#121212] border border-[#222] text-xs text-[#A0A0A0]">
            Parametric index-based weather insurance triggers automated indemnities based on Copernicus satellite rainfall anomalies without costly manual farm loss adjustment.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insuranceClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 rounded bg-[#121212] border border-[#222] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 uppercase">
                      PERIL: {(claim.peril || claim.policyType || 'DROUGHT').replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-bold text-white text-base mt-2">{claim.insuredCrop || claim.crop}</h3>
                    <p className="text-xs text-[#A0A0A0]">Policy: {claim.policyNumber || claim.claimNumber}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-mono border ${
                      claim.status === 'APPROVED' || claim.status === 'PAID' || claim.status === 'SETTLED'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : claim.status === 'UNDER_ASSESSMENT' || claim.status === 'INSPECTION_PENDING'
                        ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {(claim.status || 'SUBMITTED').replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-[#A0A0A0] leading-relaxed">{claim.description || claim.evidenceNotes}</p>

                {claim.satelliteValidationNotes && (
                  <div className="p-2.5 rounded bg-[#0d0d0d] border border-[#222] text-xs font-mono text-[#D4AF37]">
                    🛰️ {claim.satelliteValidationNotes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-xs">
                  <span className="text-[#A0A0A0]">Claimed: {claim.incidentDate || claim.submissionDate}</span>
                  <span className="font-mono font-bold text-white">
                    UGX {(claim.claimAmountUgx || claim.claimAmountUGX || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Vouchers */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="p-4 rounded bg-[#121212] border border-[#222] text-xs text-[#A0A0A0]">
            MAAIF (Ministry of Agriculture, Animal Industry & Fisheries) authenticated electronic subsidy vouchers redeemable exclusively at certified agro-dealers.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((vch) => {
              const isRedeemed = vch.status === 'REDEEMED';
              return (
                <div
                  key={vch.id}
                  className="p-5 rounded bg-[#121212] border border-[#222] space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                          {vch.voucherCode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {vch.category || vch.inputCategory}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base mt-2">
                        {vch.subsidyPercentage || 50}% Subsidy Voucher
                      </h3>
                      <p className="text-xs text-[#A0A0A0]">Program: {vch.programName}</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded font-mono border ${
                        isRedeemed
                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                      }`}
                    >
                      {vch.status}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0d0d0d] rounded border border-[#222] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#A0A0A0] text-[10px] block">SUBSIDY VALUE</span>
                      <span className="font-mono font-bold text-[#D4AF37] text-sm">
                        UGX {(vch.valueUgx || vch.subsidyValueUGX || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0] text-[10px] block">BENEFICIARY</span>
                      <span className="font-medium text-white">{vch.farmerName || vch.beneficiaryName}</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0] text-[10px] block">EXPIRES</span>
                      <span className="font-mono text-zinc-400">{vch.expiryDate || '2026-12-31'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1f1f1f] flex justify-end">
                    <button
                      onClick={() => handleRedeemVoucher(vch.id)}
                      disabled={isRedeemed || redeemVoucherId === vch.id}
                      className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        isRedeemed
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-black'
                      }`}
                    >
                      {isRedeemed ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Redeemed
                        </>
                      ) : redeemVoucherId === vch.id ? (
                        'Redeeming...'
                      ) : (
                        <>
                          <Ticket className="h-3 w-3" /> Redeem at Agro-Dealer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VSLA Share Contribution Modal */}
      {contributingGroup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#333] rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="font-bold text-white text-base">
                Purchase Shares: {contributingGroup.name}
              </h3>
              <button
                onClick={() => setContributingGroup(null)}
                className="text-[#A0A0A0] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleContributeShare} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#A0A0A0] mb-1">
                  UNIT VALUE PER SHARE
                </label>
                <div className="p-2.5 bg-[#181818] rounded border border-[#333] font-mono text-white text-sm">
                  UGX {(contributingGroup.shareValueUgx || contributingGroup.shareValueUGX || 10000).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A0A0A0] mb-1">
                  NUMBER OF SHARES TO PURCHASE
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={shareShares}
                  onChange={(e) => setShareShares(Number(e.target.value))}
                  required
                  className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="p-3 rounded bg-[#0d0d0d] border border-[#222] flex justify-between text-xs font-mono">
                <span className="text-[#A0A0A0]">TOTAL CAPITAL CONTRIB:</span>
                <span className="text-[#D4AF37] font-bold">
                  UGX {((contributingGroup.shareValueUgx || contributingGroup.shareValueUGX || 10000) * shareShares).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setContributingGroup(null)}
                  className="px-4 py-2 rounded text-xs text-[#A0A0A0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#D4AF37] hover:bg-[#B8960C] text-[#050505] font-semibold px-4 py-2 rounded text-xs transition-colors"
                >
                  {actionLoading ? 'Recording Share...' : 'Confirm Share Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insurance Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-[#333] rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" /> File Parametric Weather Claim
              </h3>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-[#A0A0A0] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileClaim} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[#A0A0A0] mb-1">
                  POLICY NUMBER
                </label>
                <input
                  type="text"
                  value={claimPolicyNumber}
                  onChange={(e) => setClaimPolicyNumber(e.target.value)}
                  required
                  className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#A0A0A0] mb-1">PERIL TYPE</label>
                  <select
                    value={claimPeril}
                    onChange={(e) => setClaimPeril(e.target.value as any)}
                    className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="DROUGHT">Severe Drought (Rain deficit)</option>
                    <option value="EXCESS_RAIN">Excess Rain / Flooding</option>
                    <option value="PEST_OUTBREAK">Pest Outbreak (Fall Armyworm)</option>
                    <option value="HAIL">Hailstorm Damage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A0A0A0] mb-1">
                    CLAIM AMOUNT (UGX)
                  </label>
                  <input
                    type="number"
                    value={claimAmountUgx}
                    onChange={(e) => setClaimAmountUgx(Number(e.target.value))}
                    required
                    className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A0A0A0] mb-1">
                  INCIDENT DESCRIPTION & OBSERVED SYMPTOMS
                </label>
                <textarea
                  rows={3}
                  value={claimDescription}
                  onChange={(e) => setClaimDescription(e.target.value)}
                  required
                  className="w-full bg-[#181818] border border-[#333] rounded p-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="p-3 bg-[#0d0d0d] rounded border border-[#222] text-[11px] text-[#A0A0A0]">
                * Automated verification: AI & Copernicus climate index checks cross-reference precipitation records for your coordinates prior to fund disbursement.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 rounded text-xs text-[#A0A0A0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-2 rounded text-xs transition-colors"
                >
                  {actionLoading ? 'Validating...' : 'Submit Claim for Validation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
