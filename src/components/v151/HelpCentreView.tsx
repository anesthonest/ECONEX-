/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Help Centre, Step-by-Step Guides & Traceable Support Tickets
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { HelpCircle, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useExperience } from '../../context/ExperienceContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { HelpCentreCard } from '../ux/DomainCards.tsx';
import { formatShortDate } from '../../i18n/econexTranslations.ts';

interface Props {
  onNavigate: (tab: string) => void;
  prefillSubject?: string;
}

export const HelpCentreView: React.FC<Props> = ({ onNavigate, prefillSubject = '' }) => {
  const { currentUser, role } = useAuth();
  const { language } = useExperience();

  const [category, setCategory] = useState('GENERAL_HELP');
  const [subject, setSubject] = useState(prefillSubject);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCase, setCreatedCase] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});

  const actor = {
    userId: currentUser?.id || 'usr_farmer_01',
    userRole: role || 'FARMER',
    tenantId: 'TEN-UG-ELGON-01',
  };

  useEffect(() => {
    if (prefillSubject) setSubject(prefillSubject);
  }, [prefillSubject]);

  const loadCases = async () => {
    const res = await ApiClient.v151GetSupportCases(actor).catch(() => ({ cases: [] }));
    setCases(res?.cases || []);
  };

  useEffect(() => {
    loadCases();
  }, [currentUser?.id]);

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;
    setSubmitting(true);
    try {
      const res = await ApiClient.v151CreateSupportCase({ category, subject, details }, actor);
      setCreatedCase(res?.case?.caseNumber || 'Saved');
      setSubject('');
      setDetails('');
      await loadCases();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (caseId: string, targetStatus: 'IN_REVIEW' | 'RESOLVED' | 'CLOSED') => {
    setStatusFeedback(null);
    try {
      const note = resolutionDrafts[caseId]?.trim();
      await ApiClient.v159UpdateSupportStatus(caseId, { targetStatus, resolutionNote: note }, actor);
      setStatusFeedback(`Case updated to ${targetStatus.replace(/_/g, ' ')}.`);
      await loadCases();
    } catch (err: any) {
      setStatusFeedback(err?.message || 'Could not update support case.');
    }
  };

  const guides = [
    {
      title: 'Getting started with ECONEX',
      steps: [
        'Open Home and pick what you want to do today: Buy, Sell, Find Work, or Check Payments.',
        'Tap Language in Account settings if you prefer Luganda, Kiswahili, Runyankole, Acholi, Ateso, or Lusoga.',
        'Tap Voice Assistant anytime to hear page instructions read aloud.',
      ],
      actionLabel: 'Go to Home',
      target: 'home',
    },
    {
      title: 'How to sell & list your products',
      steps: [
        'Open Sell or Farmer Centre and select Put Product on Sale.',
        'Follow the 7 guided steps: name, category, local units (kg or bags), price, and district.',
        'Review your summary and tap Put Product on Sale Now.',
      ],
      actionLabel: 'Open Sell Wizard',
      target: 'farmer-simple',
    },
    {
      title: 'How to buy safely',
      steps: [
        'Open Explore to search products and compare prices across districts.',
        'Check the Verified seller mark on product cards.',
        'Tap Order Now, enter quantity and delivery town, and track every step under My Activity.',
      ],
      actionLabel: 'Open Marketplace',
      target: 'explore',
    },
    {
      title: 'How to receive and check payments',
      steps: [
        'Open My Transactions from Home or Account.',
        'Check whether a payment says Pending confirmation, Successful, or Failed.',
        'If a payment is delayed or missing, tap Report missing or disputed payment to open a case number.',
      ],
      actionLabel: 'Open Payments',
      target: 'payments',
    },
    {
      title: 'How to track orders & transport',
      steps: [
        'Open My Activity from the bottom or side menu.',
        'Review plain status notes: Accepted, On the way, or Completed.',
        'Share the delivery confirmation PIN only when goods physically arrive.',
      ],
      actionLabel: 'Open My Activity',
      target: 'activity',
    },
    {
      title: 'How to verify an account or recover access',
      steps: [
        'Open Account to see your current verification status.',
        'If you signed out or switched phones, sign back in using your registered email or contact support below.',
        'For cooperative or business verification help, submit a support request with your registration reference.',
      ],
      actionLabel: 'Open Account Settings',
      target: 'account',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-medium">
          <HelpCircle size={18} aria-hidden="true" />
          <span>ECONEX Help &amp; Learning Centre</span>
        </div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">How can we help you today?</h1>
        <p className="text-sm text-[#A0A0A0]">
          Read or listen to step-by-step guides below, or send a support request to receive a traceable case number.
        </p>
      </div>

      {/* Guided How-To Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((g) => (
          <HelpCentreCard
            key={g.title}
            title={g.title}
            steps={g.steps}
            actionLabel={g.actionLabel}
            onStartAction={() => onNavigate(g.target)}
          />
        ))}
      </div>

      {/* Real Support Ticket Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitCase} className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={18} className="text-[#D4AF37]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Send a Support Request</h2>
          </div>

          {createdCase && (
            <div className="p-3 rounded-xl bg-[#181818] border border-emerald-700 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>Support request saved! Your traceable case number is <strong>{createdCase}</strong>.</span>
            </div>
          )}

          <div>
            <label htmlFor="sup-cat" className="block text-xs text-[#C0C0C0] mb-1">Topic</label>
            <select
              id="sup-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            >
              <option value="GENERAL_HELP">General Question</option>
              <option value="PAYMENT_DISPUTE">Missing or Disputed Payment</option>
              <option value="ORDER_DELIVERY">Order or Delivery Problem</option>
              <option value="ACCOUNT_VERIFICATION">Account Verification or Recovery</option>
            </select>
          </div>

          <div>
            <label htmlFor="sup-subj" className="block text-xs text-[#C0C0C0] mb-1">Short Title</label>
            <input
              id="sup-subj"
              required
              placeholder="e.g. Need help confirming order payment"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </div>

          <div>
            <label htmlFor="sup-details" className="block text-xs text-[#C0C0C0] mb-1">Explain what happened</label>
            <textarea
              id="sup-details"
              required
              rows={3}
              placeholder="Write any order number or phone details so our team can assist quickly..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5bf43] text-[#050505] text-sm font-semibold cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Support Request'}
          </button>
        </form>

        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Your Recent Support Cases</h2>
            <span className="text-xs text-[#A0A0A0]">{cases.length} total</span>
          </div>
          {statusFeedback && (
            <div className="p-2.5 rounded-xl bg-[#181818] border border-[#D4AF37]/50 text-xs text-[#D4AF37]">
              {statusFeedback}
            </div>
          )}
          {cases.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">
              You have no open support cases yet. Whenever you send a request, your case number stays saved here.
            </p>
          ) : (
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {cases.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#D4AF37]">{c.caseNumber}</span>
                    <span className={`font-medium ${c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#F5F5F5]">{c.subject}</div>
                  <p className="text-xs text-[#A0A0A0]">{c.details}</p>
                  {c.resolutionNote && (
                    <div className="p-2 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-emerald-300">
                      Resolution Note: {c.resolutionNote}
                    </div>
                  )}
                  {Array.isArray(c.history) && c.history.length > 0 && (
                    <div className="pt-2 border-t border-[#27272a] space-y-1">
                      <div className="text-[11px] font-medium text-[#C0C0C0]">Status Timeline</div>
                      {c.history.map((h: any, idx: number) => (
                        <div key={idx} className="text-[11px] text-[#A0A0A0] flex justify-between gap-2">
                          <span>{h.status.replace(/_/g, ' ')} · {h.note}</span>
                          <span className="shrink-0 text-[#71717a]">{formatShortDate(h.timestamp, language)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {c.status !== 'CLOSED' && (
                    <div className="pt-2 border-t border-[#27272a] space-y-2">
                      {role === 'PLATFORM_ADMIN' && (
                        <input
                          type="text"
                          placeholder="Add reviewer or resolution note..."
                          value={resolutionDrafts[c.id] || ''}
                          onChange={(e) => setResolutionDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
                        />
                      )}
                      <div className="flex flex-wrap gap-2">
                        {role === 'PLATFORM_ADMIN' && c.status === 'OPEN' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.id, 'IN_REVIEW')}
                            className="px-3 py-1.5 rounded-lg bg-[#121212] border border-[#D4AF37]/60 text-xs text-[#D4AF37] cursor-pointer"
                          >
                            Mark In Review
                          </button>
                        )}
                        {role === 'PLATFORM_ADMIN' && (c.status === 'OPEN' || c.status === 'IN_REVIEW') && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(c.id, 'RESOLVED')}
                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
                          >
                            Resolve Case
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(c.id, 'CLOSED')}
                          className="px-3 py-1.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#C0C0C0] hover:text-[#F5F5F5] cursor-pointer"
                        >
                          Close Case
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="text-[11px] text-[#71717a]">{formatShortDate(c.createdAt, language)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
