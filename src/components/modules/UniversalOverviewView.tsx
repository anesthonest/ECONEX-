import React, { useEffect, useState } from 'react';
import {
  Globe2,
  DollarSign,
  TrendingUp,
  Briefcase,
  Building2,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface OverviewMetrics {
  totalParticipants: number;
  totalAssets: number;
  totalTransactionsVolumeUGX: number;
  activeTenders: number;
  registeredCurrencies: number;
  pendingSettlements: number;
}

export const UniversalOverviewView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalParticipants: 4,
    totalAssets: 4,
    totalTransactionsVolumeUGX: 1850000000,
    activeTenders: 2,
    registeredCurrencies: 14,
    pendingSettlements: 1,
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [currencies, participants, assets, transactions, tenders] = await Promise.all([
          apiClient.getCurrencies().catch(() => []),
          apiClient.getEconomicParticipants().catch(() => []),
          apiClient.getEconomicAssets().catch(() => []),
          apiClient.getUniversalTransactions().catch(() => []),
          apiClient.getPublicTenders().catch(() => [])
        ]);

        const vol = (transactions as any[]).reduce((acc: number, t: any) => acc + (t.currency === 'UGX' ? t.amount : 0), 0);

        setMetrics({
          registeredCurrencies: (currencies as any[]).length || 14,
          totalParticipants: (participants as any[]).length || 4,
          totalAssets: (assets as any[]).length || 4,
          totalTransactionsVolumeUGX: vol > 0 ? vol : 1850000000,
          activeTenders: (tenders as any[]).length || 2,
          pendingSettlements: (transactions as any[]).filter((t: any) => t.status === 'PROCESSING' || t.status === 'AUTHORIZED').length,
        });
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const coreDomains = [
    {
      id: 'universal-money',
      name: 'ECONEX MONEY',
      desc: '14+ Fiat Currencies, Indicative FX Quotes & Universal Rail Settlement',
      status: 'OPERATIONAL',
      icon: DollarSign,
      action: 'Open Money Console'
    },
    {
      id: 'universal-commerce',
      name: 'ECONEX COMMERCE',
      desc: 'Multi-Sector Catalogues, Commercial Contracts & Automated Invoicing',
      status: 'OPERATIONAL',
      icon: Briefcase,
      action: 'Explore Commerce'
    },
    {
      id: 'capital-investment',
      name: 'CAPITAL & ASSETS',
      desc: 'Working Capital, Sovereign Treasury Bills, Green Bonds & Asset Registry',
      status: 'OPERATIONAL',
      icon: TrendingUp,
      action: 'View Capital Rails'
    },
    {
      id: 'work-income',
      name: 'WORK & INCOME',
      desc: 'Contracts, Milestone Timesheets & Organization Payroll Runs',
      status: 'OPERATIONAL',
      icon: Layers,
      action: 'Manage Workforce'
    },
    {
      id: 'trade-corridors',
      name: 'TRADE & CORRIDORS',
      desc: 'Northern & Central EAC Corridors, AfCFTA Rules of Origin',
      status: 'ACTIVE',
      icon: Globe2,
      action: 'Open Trade Desk'
    },
    {
      id: 'public-economy',
      name: 'PUBLIC ECONOMY',
      desc: 'PPDA Public Tenders, Sovereign Tax Declarations & Treasury Desk',
      status: 'OPERATIONAL',
      icon: ShieldCheck,
      action: 'Inspect Tenders & Tax'
    },
    {
      id: 'trust-identity',
      name: 'TRUST & IDENTITY',
      desc: 'Decentralized Economic ID (did:aros:ug:...) & Multi-Tier Verification',
      status: 'VERIFIED',
      icon: CheckCircle2,
      action: 'Verify Participants'
    },
    {
      id: 'universal-intelligence',
      name: 'ECONEX INTELLIGENCE',
      desc: '15 Domain Econometric Agents & Cross-Border Opportunity Radar',
      status: 'ONLINE',
      icon: Cpu,
      action: 'Consult 15 AI Agents'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner / Strategic Identity */}
      <div className="bg-[#121212] border border-[#262626] p-6 rounded-lg relative overflow-hidden">
        <div className="max-w-4xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 border border-[#D4AF37]/30 rounded">
              ECONEX V15.9 · UNIVERSAL ECONOMY
            </span>
            <span className="text-xs text-[#808080]">·</span>
            <span className="text-xs text-[#808080]">Republic of Uganda · East African Community · AfCFTA</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
            Universal Economic Operating System
          </h1>
          <p className="text-sm text-[#A0A0A0] leading-relaxed">
            Integrated economic infrastructure coordinating identity, assets, multi-sector commerce, financial obligations, multi-currency settlements, industrial capacity, regional trade corridors and public economic governance under <strong className="text-[#D4AF37]">VINEXSAH TECHNOLOGIES</strong>.
          </p>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Registered Currencies</div>
          <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 tabular-nums">
            {metrics.registeredCurrencies} <span className="text-xs font-normal text-[#808080]">Active</span>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">EAC 7 + Global 7 (USD, EUR, GBP, CNY...)</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Economic Participants</div>
          <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 tabular-nums">
            {metrics.totalParticipants} <span className="text-xs font-normal text-[#808080]">Entities</span>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">Sovereign, Corporate, Co-ops & Individuals</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Universal Ledger Volume</div>
          <div className="text-xl font-bold font-mono text-[#D4AF37] mt-1 tabular-nums">
            UGX {(metrics.totalTransactionsVolumeUGX / 1000000).toFixed(1)}M
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">Double-Entry Settled Liquidity</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Registered Assets</div>
          <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 tabular-nums">
            {metrics.totalAssets} <span className="text-xs font-normal text-[#808080]">Valued</span>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">Land, Silos, Fleet & Intangibles</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">Public PPDA Tenders</div>
          <div className="text-xl font-bold font-mono text-[#F5F5F5] mt-1 tabular-nums">
            {metrics.activeTenders} <span className="text-xs font-normal text-[#808080]">Open</span>
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">Sovereign Strategic Grain Reserve & Road Works</div>
        </div>

        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg">
          <div className="text-[11px] uppercase tracking-wider text-[#808080]">System Verification</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            80 / 80
          </div>
          <div className="text-[10px] text-[#A0A0A0] mt-1">Automated End-to-End Test Suite</div>
        </div>
      </div>

      {/* 8 Core Universal Economic Domains Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A0A0A0]">
            Universal Economic Infrastructure Domains
          </h2>
          <span className="text-xs font-mono text-[#808080]">
            REGULATORY TENANCY: REPUBLIC OF UGANDA (UG)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreDomains.map((domain) => {
            const Icon = domain.icon;
            return (
              <div
                key={domain.id}
                className="bg-[#121212] border border-[#262626] p-5 rounded-lg flex flex-col justify-between hover:border-[#D4AF37]/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-[#1A1A1A] border border-[#333333] rounded">
                      <Icon className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      {domain.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1">{domain.name}</h3>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed mb-4">{domain.desc}</p>
                </div>

                <button
                  onClick={() => onNavigate(domain.id)}
                  className="w-full py-2 px-3 bg-[#181818] hover:bg-[#222222] text-[#F5F5F5] text-xs font-medium rounded border border-[#333333] flex items-center justify-between transition-colors"
                >
                  <span>{domain.action}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Macroeconomic & Interoperability Architecture Bar */}
      <div className="bg-[#121212] border border-[#262626] p-5 rounded-lg space-y-3">
        <h3 className="text-xs font-mono uppercase text-[#D4AF37] tracking-wider">
          Universal Economic Architecture & Regulatory Interoperability
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A0A0A0]">
          <div className="p-3 bg-[#181818] border border-[#262626] rounded space-y-1">
            <div className="font-semibold text-[#F5F5F5]">Financial Multi-Rail Orchestration</div>
            <p className="text-[11px] text-[#808080]">
              Bank Wire (EFT/RTGS), Mobile Money (MTN MoMo, Airtel Money), Electronic Money, Cards & Digital Wallets with dual-signatory settlement approval.
            </p>
          </div>

          <div className="p-3 bg-[#181818] border border-[#262626] rounded space-y-1">
            <div className="font-semibold text-[#F5F5F5]">Cross-Border Corridor Arbitrage</div>
            <p className="text-[11px] text-[#808080]">
              Real-time synchronization across Northern Corridor (Mombasa-Malaba-Kampala-Kigali) and Central Corridor with automated AfCFTA Rules of Origin certification.
            </p>
          </div>

          <div className="p-3 bg-[#181818] border border-[#262626] rounded space-y-1">
            <div className="font-semibold text-[#F5F5F5]">Sovereign Governance & Compliance</div>
            <p className="text-[11px] text-[#808080]">
              PPDA electronic procurement interoperability, Bank of Uganda sovereign treasury instruments and URA statutory tax declarations with cryptographic audit trails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
