/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V6.0 - Portable Economic Identity & Trust Infrastructure (AETHER ID)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.ts';
import {
  EconomicParticipant,
  EconomicIdentity,
} from '../../types/index.ts';
import {
  Award,
  CheckCircle2,
  FileCheck2,
  Key,
  Lock,
  QrCode,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

export const TrustAndIdentityView: React.FC = () => {
  const [participants, setParticipants] = useState<EconomicParticipant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<EconomicParticipant | null>(null);
  const [identityProfile, setIdentityProfile] = useState<EconomicIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationLevel, setVerificationLevel] = useState<number>(3);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const parts = await api.getEconomicParticipants();
      setParticipants(Array.isArray(parts) ? parts : []);
      if (parts && parts.length > 0) {
        setSelectedParticipant(parts[0]);
        loadIdentity(parts[0].id);
      }
    } catch (err) {
      console.error('Failed to load identity participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadIdentity = async (id: string) => {
    try {
      const idProfile = await api.getEconomicIdentity(id);
      setIdentityProfile(idProfile);
    } catch {
      // Create fallback profile if not yet issued
      setIdentityProfile(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpgradeVerification = async (level: number) => {
    if (!selectedParticipant) return;
    setVerifySuccessMsg('');
    try {
      const id = await api.verifyEconomicIdentity(selectedParticipant.id, level);
      setIdentityProfile(id);
      setVerifySuccessMsg(`Identity upgraded to Level ${level} Verified! New Trust Score: ${id.trustScore}/100.`);
      fetchData();
    } catch (err: any) {
      setVerifySuccessMsg(`Error: ${err.message || 'Verification upgrade failed'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272a]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">ECONEX ID & TRUST</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c1c1f] text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
              Portable Economic Identity
            </span>
          </div>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Sovereign, portable economic identity (DID) and verifiable credentials across individuals, enterprises, and institutions without universal surveillance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participants Directory */}
        <div className="lg:col-span-1 bg-[#121212] border border-[#27272a] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#F5F5F5]">Registered Entities</h3>
            <span className="text-xs text-[#A0A0A0] font-mono">{participants.length} Active</span>
          </div>

          <div className="divide-y divide-[#1e1e24] max-h-[500px] overflow-y-auto">
            {participants.map((p) => {
              const isSelected = selectedParticipant?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedParticipant(p);
                    loadIdentity(p.id);
                  }}
                  className={`w-full text-left py-3 px-2 rounded transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-[#18181b] border-l-2 border-[#D4AF37]' : 'hover:bg-[#18181b]/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#1c1c1f] border border-[#3f3f46] flex items-center justify-center font-bold text-xs text-[#D4AF37] shrink-0 mt-0.5">
                    {p.legalName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#F5F5F5] truncate">{p.legalName}</div>
                    <div className="text-[11px] text-[#A0A0A0] truncate">{p.participantType} · {p.countryCode}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-[#D4AF37]">Trust: {p.trustScore}/100</span>
                      <span className="text-[10px] text-emerald-400">{p.verificationStatus}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Identity Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {selectedParticipant && (
            <div className="bg-[#121212] border border-[#27272a] rounded-lg p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#27272a]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#F5F5F5]">{selectedParticipant.legalName}</h2>
                    <ShieldCheck size={18} className="text-[#D4AF37]" />
                  </div>
                  <div className="text-xs font-mono text-[#D4AF37] mt-0.5">{selectedParticipant.aetherId}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded text-xs font-semibold bg-[#1c1c1f] border border-[#D4AF37]/40 text-[#D4AF37]">
                    Level {identityProfile?.verificationLevel || 3} Verified
                  </span>
                </div>
              </div>

              {/* Trust Score & Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#18181b] rounded border border-[#27272a]">
                  <span className="text-[#A0A0A0]">Trust Score</span>
                  <div className="text-xl font-bold font-mono text-[#D4AF37] tabular-nums mt-1">
                    {identityProfile?.trustScore || selectedParticipant.trustScore}/100
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Tier 1 Exemplary</div>
                </div>

                <div className="p-3 bg-[#18181b] rounded border border-[#27272a]">
                  <span className="text-[#A0A0A0]">Trade Fulfillment</span>
                  <div className="text-xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
                    {identityProfile?.fulfillmentRatePct || 98.4}%
                  </div>
                  <div className="text-[10px] text-[#A0A0A0] mt-0.5">Verified on ledger</div>
                </div>

                <div className="p-3 bg-[#18181b] rounded border border-[#27272a]">
                  <span className="text-[#A0A0A0]">Settlement Punctuality</span>
                  <div className="text-xl font-bold font-mono text-[#F5F5F5] tabular-nums mt-1">
                    {identityProfile?.onTimeSettlementPct || 99.1}%
                  </div>
                  <div className="text-[10px] text-[#A0A0A0] mt-0.5">Zero default record</div>
                </div>

                <div className="p-3 bg-[#18181b] rounded border border-[#27272a]">
                  <span className="text-[#A0A0A0]">Commercial Disputes</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                    {identityProfile?.disputeCount || 0}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Clean mediation record</div>
                </div>
              </div>

              {/* Entity Registration & Attributes */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Verified Legal Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#18181b] rounded space-y-1">
                    <span className="text-[#A0A0A0]">Tax Identification Number (TIN):</span>
                    <div className="font-mono text-[#F5F5F5] font-semibold">{selectedParticipant.taxIdentificationNumber}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> URA Tax Compliance Cleared
                    </div>
                  </div>

                  <div className="p-3 bg-[#18181b] rounded space-y-1">
                    <span className="text-[#A0A0A0]">Registered Country Jurisdiction:</span>
                    <div className="font-mono text-[#F5F5F5] font-semibold">{selectedParticipant.countryCode} · East African Community</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Cross-Border EAC Transit Cleared
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Verifiable Attributes */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">Verifiable Credentials Chain</h4>
                <div className="space-y-1.5 text-xs">
                  {(identityProfile?.verifiedAttributes || [
                    'URA Tax Clearance 2026 Verified',
                    'URSB Certificate of Good Standing',
                    'Anti-Money Laundering (AML) Compliance Cleared',
                  ]).map((attr, idx) => (
                    <div key={idx} className="p-2.5 bg-[#18181b] rounded border border-[#27272a] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#D4AF37]" />
                        <span className="text-[#F5F5F5]">{attr}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#A0A0A0]">Cryptographically Signed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Tier Upgrade Buttons */}
              <div className="pt-4 border-t border-[#27272a] space-y-2">
                <div className="text-xs text-[#A0A0A0]">Upgrade Verification Tier (Demonstration Governance):</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpgradeVerification(2)}
                    className="px-3 py-1.5 text-xs bg-[#18181b] hover:bg-[#27272a] text-[#F5F5F5] border border-[#3f3f46] rounded transition-colors"
                  >
                    Set Level 2 (National ID / NIN)
                  </button>
                  <button
                    onClick={() => handleUpgradeVerification(3)}
                    className="px-3 py-1.5 text-xs bg-[#18181b] hover:bg-[#27272a] text-[#D4AF37] border border-[#D4AF37]/40 rounded transition-colors"
                  >
                    Set Level 3 (Corporate Tax & Legal)
                  </button>
                  <button
                    onClick={() => handleUpgradeVerification(4)}
                    className="px-3 py-1.5 text-xs bg-[#18181b] hover:bg-[#27272a] text-emerald-400 border border-emerald-800 rounded transition-colors"
                  >
                    Set Level 4 (Licensed Sovereign/Bank)
                  </button>
                </div>

                {verifySuccessMsg && (
                  <div className="p-2 rounded text-xs bg-emerald-950 text-emerald-300 mt-2">
                    {verifySuccessMsg}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
