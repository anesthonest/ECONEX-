/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Multilingual Selector & Translation Completeness Drawer
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { Globe, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  EconexLanguageCode,
  SUPPORTED_LANGUAGES,
  getTranslationCompletenessReport,
  syncLanguageReviewApproval,
} from '../../i18n/econexTranslations.ts';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { AccessibleDialog } from './CorePrimitives.tsx';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useExperience();
  const { currentUser, role } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [serverReviews, setServerReviews] = useState<any[]>([]);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      const res = await ApiClient.v159GetTranslationReviews({
        userId: currentUser?.id,
        userRole: role,
      });
      const list = Array.isArray(res?.reviews) ? res.reviews : [];
      setServerReviews(list);
      list.forEach((r: any) => {
        if (r?.langCode) {
          syncLanguageReviewApproval(r.langCode, Boolean(r.reviewedLegalFinancial), r.reviewerName);
        }
      });
    } catch {
      // Fallback safely to static translation metadata if offline
    }
  };

  useEffect(() => {
    if (showReport || !compact) {
      loadReviews();
    }
  }, [showReport, compact, currentUser?.id]);

  const handleApprovePack = async (code: string) => {
    setBusyCode(code);
    setReviewMsg(null);
    try {
      const res = await ApiClient.v159ApproveTranslation(
        code,
        {
          status: 'APPROVED',
          reviewedLegalFinancial: true,
          reviewerName: currentUser?.name || 'Platform Language Reviewer',
          notes: 'Legal and financial terminology formally verified for release.',
        },
        { userId: currentUser?.id, userRole: role }
      );
      if (res?.review?.langCode) {
        syncLanguageReviewApproval(res.review.langCode, true, res.review.reviewerName);
        setReviewMsg(`Approved legal/financial pack for ${res.review.nativeName} (${res.review.langCode.toUpperCase()}).`);
      }
      await loadReviews();
    } catch (err: any) {
      setReviewMsg(err?.message || 'Unable to approve translation pack.');
    } finally {
      setBusyCode(null);
    }
  };

  const currentMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const completeness = getTranslationCompletenessReport();
  const reviewMap = new Map(serverReviews.map((r: any) => [r.langCode, r]));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="econex-lang-select" className="sr-only">
          Choose your language
        </label>
        <div className="inline-flex items-center gap-2 bg-[#181818] border border-[#27272a] rounded-xl px-3 min-h-[44px]">
          <Globe size={16} className="text-[#D4AF37] shrink-0" aria-hidden="true" />
          <select
            id="econex-lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as EconexLanguageCode)}
            className="bg-transparent text-sm text-[#F5F5F5] outline-none py-2 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-[#121212] text-[#F5F5F5]">
                {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>

        {!compact && (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#C0C0C0] hover:text-[#F5F5F5] flex items-center gap-1.5 cursor-pointer"
          >
            <Info size={14} aria-hidden="true" />
            <span>Language Review Status</span>
          </button>
        )}
      </div>

      {!compact && currentMeta.code !== 'en' && !currentMeta.reviewedLegalFinancial && (
        <p className="text-xs text-[#A0A0A0]">
          {currentMeta.nativeName} UI navigation and marketplace labels are active. Legal and payment confirmations stay in verified English until formally approved by a language reviewer.
        </p>
      )}

      <AccessibleDialog isOpen={showReport} title="Supported Languages & Review Status" onClose={() => setShowReport(false)}>
        <div className="space-y-3 text-sm text-[#C0C0C0]">
          <p>
            ECONEX supports 7 Ugandan and East African languages with 100% UI string coverage. Unreviewed packs automatically retain verified English for legal contracts and financial consent terms until approved.
          </p>
          {reviewMsg && (
            <div className="p-2.5 rounded-lg bg-[#181818] border border-[#D4AF37]/50 text-xs text-[#D4AF37]">
              {reviewMsg}
            </div>
          )}
          <div className="divide-y divide-[#27272a] border border-[#27272a] rounded-xl overflow-hidden">
            {completeness.map((item) => {
              const srv = reviewMap.get(item.code);
              const approved = srv ? Boolean(srv.reviewedLegalFinancial) : item.reviewedLegalFinancial;
              const statusLabel = srv?.status || (approved ? 'APPROVED' : 'PENDING_REVIEW');
              return (
                <div key={item.code} className="p-3 bg-[#181818] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#F5F5F5]">
                      {item.nativeName} · {item.name}
                    </div>
                    <div className="text-xs text-[#A0A0A0]">
                      {item.regionFocus} · {item.translatedKeys}/{item.totalKeys} phrases ({item.completenessPct}%)
                    </div>
                    {srv?.reviewerName && (
                      <div className="text-[11px] text-[#71717a] mt-0.5">
                        Reviewer: {srv.reviewerName} · Status: {statusLabel}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {approved ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium whitespace-nowrap">
                        <CheckCircle2 size={14} aria-hidden="true" /> Legal &amp; UI Verified
                      </span>
                    ) : (
                      <>
                        <span className="text-[#D4AF37]">English legal fallback active</span>
                        {role === 'PLATFORM_ADMIN' && (
                          <button
                            type="button"
                            disabled={busyCode === item.code}
                            onClick={() => handleApprovePack(item.code)}
                            className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck size={12} aria-hidden="true" />
                            <span>{busyCode === item.code ? 'Saving...' : 'Approve Legal Pack'}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AccessibleDialog>
    </div>
  );
};
