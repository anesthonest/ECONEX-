/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V21.0 - 10-Category Participant & Organization Onboarding + Verification Hub (/onboarding)
 * Enforces explicit registration != verified identity rule, 6-tier Uganda geography,
 * 7-state verification workflow, recovery request, and self-service JSON data export.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { SUPPORTED_LANGUAGES } from '../../i18n/econexTranslations.ts';
import type {
  V21ParticipantCategory,
  V21ParticipantOnboarding,
  V21VerificationStatus,
} from '../../types/index.ts';

const CATEGORIES: V21ParticipantCategory[] = [
  'INDIVIDUAL',
  'FARMER',
  'BUYER_TRADER',
  'SME_BUSINESS',
  'COOPERATIVE',
  'AGRO_DEALER',
  'LOGISTICS_OPERATOR',
  'SERVICE_PROVIDER',
  'INSTITUTIONAL',
  'FIELD_OFFICER',
];

const VERIFICATION_STATES: V21VerificationStatus[] = [
  'UNVERIFIED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
  'EXPIRED',
];

function triggerJsonDownload(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const V21OnboardingHub: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const { t, language } = useExperience();

  const [onboardings, setOnboardings] = useState<V21ParticipantOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Registration Form State
  const [pilotId, setPilotId] = useState('V21-PILOT-UG-ELGON-01');
  const [category, setCategory] = useState<V21ParticipantCategory>('FARMER');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+256 772 ');
  const [organizationName, setOrganizationName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<string>(language || 'en');

  // Uganda 6-tier geographic model
  const [countryCode, setCountryCode] = useState('UG');
  const [region, setRegion] = useState('Eastern Region');
  const [district, setDistrict] = useState('Mbale');
  const [subcounty, setSubcounty] = useState('Wanale');
  const [parish, setParish] = useState('Bukasakya');
  const [village, setVillage] = useState('Nabweya');

  // Optional Self-Declared Document Evidence & Explicit Consent
  const [documentType, setDocumentType] = useState('');
  const [documentReference, setDocumentReference] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Admin Review State
  const [reviewNotes, setReviewNotes] = useState('Independent verification evidence checked.');
  const [recoveryReason, setRecoveryReason] = useState('SIM card replaced — verify primary contact ownership');

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role,
    tenantId: 'TEN-UG-ELGON-01',
  };

  const loadOnboardings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiClient.v21GetOnboardings(actor);
      setOnboardings(Array.isArray(res?.onboardings) ? res.onboardings : []);
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Unable to load onboarding records.' });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadOnboardings();
  }, [loadOnboardings]);

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAccepted) {
      setNotice({ kind: 'err', text: 'Explicit privacy & pilot consent acceptance is required.' });
      return;
    }
    try {
      const created = await ApiClient.v21SubmitOnboarding(
        {
          pilotId,
          category,
          fullName,
          phone,
          preferredLanguage,
          organizationName: organizationName.trim() || undefined,
          geography: {
            countryCode,
            region,
            district,
            subcounty,
            parish,
            village,
          },
          consentAccepted,
          documentType: documentType.trim() || undefined,
          documentReference: documentReference.trim() || undefined,
        },
        actor
      );
      setFullName('');
      setDocumentType('');
      setDocumentReference('');
      setConsentAccepted(false);
      setNotice({
        kind: 'ok',
        text: `Onboarding ${created.id} created with status ${created.verificationStatus}. Note: registration does NOT verify identity until independent review.`,
      });
      loadOnboardings();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Onboarding submission failed.' });
    }
  };

  const handleReviewStatus = async (id: string, targetStatus: V21VerificationStatus) => {
    try {
      const updated = await ApiClient.v21ReviewOnboarding(id, { targetStatus, note: reviewNotes }, actor);
      setNotice({ kind: 'ok', text: `Verification status updated to ${updated.verificationStatus}.` });
      loadOnboardings();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Verification transition failed.' });
    }
  };

  const handleExportOwnData = async (id: string) => {
    try {
      const exported = await ApiClient.v21ExportParticipantData(id, actor);
      triggerJsonDownload(`ECONEX-Participant-Data-${id}.json`, exported);
      setNotice({ kind: 'ok', text: `Exported personal onboarding & trade records for ${id}.` });
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Participant export blocked.' });
    }
  };

  const handleRequestRecovery = async (id: string) => {
    try {
      const res = await ApiClient.v21RequestAccountRecovery(id, recoveryReason, actor);
      setNotice({ kind: 'ok', text: `Account recovery case ${res.recoveryRequest?.id || 'opened'} recorded.` });
      loadOnboardings();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err?.message || 'Recovery request failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Explicit Non-Claim Identity Notice */}
      <header className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-[#D4AF37]">ECONEX V21.0 · PARTICIPANT &amp; ORGANISATION ONBOARDING</div>
            <h1 className="text-xl font-semibold text-[#F5F5F5] flex items-center gap-2 mt-1">
              <UserPlus size={20} className="text-[#D4AF37]" />
              <span>{t('pilot_register_cta')} &amp; Verification</span>
            </h1>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('v21-field-ops')}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs font-medium text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer"
            >
              Open Field Operations App
            </button>
          )}
        </div>
        <div className="p-3 rounded-xl bg-[#09090b] border border-[#27272a] flex items-start gap-2.5 text-xs text-[#C0C0C0]">
          <ShieldAlert size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#F5F5F5]">Important Separation:</strong> Registration on ECONEX does{' '}
            <strong className="text-[#F5F5F5]">not</strong> establish verified identity. Self-declared uploads remain unverified
            until an independent administrator completes review and updates status to <span className="font-mono text-emerald-400">VERIFIED</span>.
          </span>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            notice.kind === 'ok'
              ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800 text-amber-200'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Onboarding Submission Form */}
      <form onSubmit={handleSubmitOnboarding} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-[#F5F5F5]">New Participant / Organisation Registration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Pilot Programme</span>
            <select
              value={pilotId}
              onChange={(e) => setPilotId(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            >
              <option value="V21-PILOT-UG-ELGON-01">Mt. Elgon Farmer-to-Buyer (UG)</option>
              <option value="V21-PILOT-UG-KLA-SME-02">Kampala SME Trade (UG)</option>
              <option value="V21-PILOT-UG-COOP-03">Busoga Cooperative Aggregation (UG)</option>
            </select>
          </label>

          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Participant Category (10 Supported)</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as V21ParticipantCategory)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Preferred Language</span>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Full Name / Contact Lead *</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Namono Beatrice"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>

          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Phone Number (Masked on storage) *</span>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 772 110440"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>

          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Organisation / Cooperative Name (Optional)</span>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Bugisu Coffee Growers Coop"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>
        </div>

        {/* Uganda 6-Tier Geography */}
        <div className="pt-1 space-y-2">
          <div className="text-xs font-medium text-[#D4AF37]">
            Geographic Location Hierarchy (Country → Region → District → Subcounty → Parish → Village)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <input
              type="text"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              aria-label="Country Code"
              placeholder="Country (UG)"
              className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              aria-label="Region"
              placeholder="Region"
              className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              aria-label="District"
              placeholder="District"
              className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              value={subcounty}
              onChange={(e) => setSubcounty(e.target.value)}
              aria-label="Subcounty"
              placeholder="Subcounty"
              className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              value={parish}
              onChange={(e) => setParish(e.target.value)}
              aria-label="Parish"
              placeholder="Parish"
              className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              aria-label="Village"
              placeholder="Village"
              className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
            />
          </div>
        </div>

        {/* Optional Evidence Upload Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Document Type (Optional — sets status to SUBMITTED for review)</span>
            <input
              type="text"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="e.g. NATIONAL_ID_FRONT, COOP_CERT, TIN_REF"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>
          <label className="space-y-1 text-xs text-[#A0A0A0]">
            <span>Reference / File Digest Label</span>
            <input
              type="text"
              value={documentReference}
              onChange={(e) => setDocumentReference(e.target.value)}
              placeholder="e.g. CM-REF-9001"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </label>
        </div>

        {/* Explicit Privacy & Consent Checkbox */}
        <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#C0C0C0] cursor-pointer">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-[#D4AF37]"
          />
          <span>
            I explicitly accept the ECONEX Privacy Notice &amp; Controlled Pilot Terms (Consent V21.0), understand how my data is processed, and acknowledge that registration alone does not verify legal identity.
          </span>
        </label>

        <button
          type="submit"
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm hover:bg-[#e5bf43] cursor-pointer"
        >
          {t('pilot_register_cta')}
        </button>
      </form>

      {/* Onboarding & Verification Queue */}
      <section className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#F5F5F5]">{t('pilot_verification_label')} Queue</h2>
            <p className="text-xs text-[#A0A0A0]">
              Participants see their own records; administrators and officers review within authorised jurisdiction.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {role === 'PLATFORM_ADMIN' && (
              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                aria-label="Reviewer note"
                className="min-h-[44px] px-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-[#F5F5F5]"
              />
            )}
            <button
              type="button"
              onClick={loadOnboardings}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#C0C0C0] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-[#A0A0A0]">Loading participant onboarding records...</p>
        ) : onboardings.length === 0 ? (
          <p className="text-xs text-[#A0A0A0]">No onboarding records visible for the active user scope.</p>
        ) : (
          <div className="divide-y divide-[#27272a]">
            {onboardings.map((rec) => (
              <div key={rec.id} className="py-4 space-y-2.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
                      {rec.verificationStatus === 'VERIFIED' ? (
                        <ShieldCheck size={16} className="text-emerald-400" />
                      ) : rec.verificationStatus === 'SUSPENDED' || rec.verificationStatus === 'REJECTED' ? (
                        <AlertCircle size={16} className="text-amber-400" />
                      ) : (
                        <CheckCircle2 size={16} className="text-[#D4AF37]" />
                      )}
                      <span>{rec.fullName}</span>
                      {rec.organizationName && <span className="text-xs text-[#A0A0A0]">· {rec.organizationName}</span>}
                    </div>
                    <div className="text-xs text-[#A0A0A0] font-mono">
                      {rec.id} · {rec.category} · {rec.geography.district}/{rec.geography.subcounty}/{rec.geography.village} · Status:{' '}
                      <span className={rec.verificationStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-[#D4AF37]'}>
                        {rec.verificationStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportOwnData(rec.id)}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#F5F5F5] hover:border-[#D4AF37] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Export Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestRecovery(rec.id)}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl border border-[#27272a] bg-[#09090b] text-xs text-[#C0C0C0] hover:border-[#D4AF37] cursor-pointer"
                    >
                      Account Recovery
                    </button>

                    {role === 'PLATFORM_ADMIN' && (
                      <select
                        aria-label={`Change verification status for ${rec.fullName}`}
                        value={rec.verificationStatus}
                        onChange={(e) => handleReviewStatus(rec.id, e.target.value as V21VerificationStatus)}
                        className="min-h-[44px] px-2.5 rounded-xl bg-[#09090b] border border-[#D4AF37] text-xs text-[#D4AF37]"
                      >
                        {VERIFICATION_STATES.map((st) => (
                          <option key={st} value={st} className="bg-[#121212] text-[#F5F5F5]">
                            Review → {st}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
export default V21OnboardingHub;
