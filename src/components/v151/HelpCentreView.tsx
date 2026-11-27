/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V15.1 - Help Centre, Step-by-Step Guides & Traceable Support Tickets
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { HelpCircle, CheckCircle2, MessageSquarePlus, Send } from 'lucide-react';
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
  const [v26Tickets, setV26Tickets] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState<string>('ALL');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
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
    const [legacyRes, ticketsRes] = await Promise.all([
      ApiClient.v151GetSupportCases(actor).catch(() => ({ cases: [] })),
      ApiClient.v26GetSupportTickets(ticketFilter, actor).catch(() => []),
    ]);
    setCases(legacyRes?.cases || []);
    setV26Tickets(Array.isArray(ticketsRes) ? ticketsRes : []);
  };

  useEffect(() => {
    loadCases();
  }, [currentUser?.id, role, ticketFilter]);

  const submitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;
    setSubmitting(true);
    setStatusFeedback(null);
    try {
      const [ticketRes] = await Promise.all([
        ApiClient.v26CreateSupportTicket({ category, subject, description: details }, actor),
        ApiClient.v151CreateSupportCase({ category, subject, details }, actor).catch(() => null),
      ]);
      setCreatedCase(ticketRes?.caseNumber || 'Saved');
      setSubject('');
      setDetails('');
      await loadCases();
    } catch (err: any) {
      setStatusFeedback(err?.message || 'Unable to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyTicket = async (ticketId: string) => {
    const msg = (replyDrafts[ticketId] || '').trim();
    if (!msg) return;
    setStatusFeedback(null);
    try {
      await ApiClient.v26ReplySupportTicket(ticketId, { messageBody: msg }, actor);
      setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      setStatusFeedback('Reply appended to ticket thread.');
      await loadCases();
    } catch (err: any) {
      setStatusFeedback(err?.message || 'Could not post reply.');
    }
  };

  const handleV26StatusChange = async (ticketId: string, status: 'IN_REVIEW' | 'RESOLVED' | 'CLOSED') => {
    setStatusFeedback(null);
    try {
      const resolutionNote = resolutionDrafts[ticketId]?.trim();
      await ApiClient.v26UpdateSupportTicketStatus(ticketId, { status, resolutionNote }, actor);
      setStatusFeedback(`Support ticket updated to ${status.replace(/_/g, ' ')}.`);
      await loadCases();
    } catch (err: any) {
      setStatusFeedback(err?.message || 'Could not update support ticket status.');
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

  const [topicFilter, setTopicFilter] = useState<string>('ALL');

  const guides = [
    {
      topic: 'GETTING_STARTED',
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
      topic: 'SELLING',
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
      topic: 'BUYING',
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
      topic: 'PAYMENTS',
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
      topic: 'DELIVERY',
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
      topic: 'ACCOUNT',
      title: 'How to verify an account or recover access',
      steps: [
        'Open Account to see your current verification status or issue a sandbox verification challenge.',
        'If you signed out or switched phones, use Direct Login or Access Recovery under Sign In.',
        'For cooperative or business verification help, submit a support request with your registration reference.',
      ],
      actionLabel: 'Open Account Settings',
      target: 'account',
    },
  ];

  const topicTabs = [
    { id: 'ALL', label: 'All Topics' },
    { id: 'GETTING_STARTED', label: 'Getting Started' },
    { id: 'SELLING', label: 'Selling' },
    { id: 'BUYING', label: 'Buying' },
    { id: 'PAYMENTS', label: 'Payments' },
    { id: 'DELIVERY', label: 'Delivery' },
    { id: 'ACCOUNT', label: 'Account' },
  ];

  const visibleGuides = topicFilter === 'ALL' ? guides : guides.filter((g) => g.topic === topicFilter);

  return (
    <div className="space-y-6">
      <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-medium">
            <HelpCircle size={18} aria-hidden="true" />
            <span>ECONEX Help &amp; Learning Centre</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">How can we help you today?</h1>
          <p className="text-sm text-[#A0A0A0]">
            Read or listen to step-by-step guides below, or open a threaded support ticket with a traceable case number.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {topicTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTopicFilter(tab.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                topicFilter === tab.id
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#181818] text-[#C0C0C0] border-[#27272a] hover:border-[#D4AF37]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guided How-To Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleGuides.map((g) => (
          <HelpCentreCard
            key={g.title}
            title={g.title}
            steps={g.steps}
            actionLabel={g.actionLabel}
            onStartAction={() => onNavigate(g.target)}
          />
        ))}
      </div>

      {role === 'PLATFORM_ADMIN' && (
        <div className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#F5F5F5]">For Administrators &amp; Developers</div>
            <p className="text-xs text-[#A0A0A0] mt-0.5">
              Access route inventory, interactive control audits, and platform diagnostic exports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('v26-audit')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#F5F5F5] cursor-pointer"
            >
              Route &amp; Control Audit
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v19-diagnostics')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#181818] border border-[#27272a] hover:border-[#D4AF37] text-xs font-medium text-[#D4AF37] cursor-pointer"
            >
              Platform Diagnostics
            </button>
          </div>
        </div>
      )}

      {/* Real Support Ticket Submission + Threaded Tickets */}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Threaded Support Tickets</h2>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTicketFilter(st)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    ticketFilter === st
                      ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                      : 'bg-[#181818] text-[#C0C0C0] border-[#27272a]'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {statusFeedback && (
            <div className="p-2.5 rounded-xl bg-[#181818] border border-[#D4AF37]/50 text-xs text-[#D4AF37]">
              {statusFeedback}
            </div>
          )}

          {v26Tickets.length === 0 && cases.length === 0 ? (
            <p className="text-sm text-[#A0A0A0]">
              You have no support cases in this filter yet. Whenever you send a request, your case number and thread stay saved here.
            </p>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {v26Tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#D4AF37]">{t.caseNumber}</span>
                    <span className={`font-medium ${t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#F5F5F5]">{t.subject}</div>
                  <p className="text-xs text-[#A0A0A0]">{t.description}</p>

                  {Array.isArray(t.messages) && t.messages.length > 0 && (
                    <div className="pt-2 border-t border-[#27272a] space-y-1.5">
                      <div className="text-[11px] font-medium text-[#C0C0C0]">Thread ({t.messages.length})</div>
                      {t.messages.map((m: any) => (
                        <div key={m.id} className="p-2 rounded-lg bg-[#121212] border border-[#27272a] text-xs space-y-0.5">
                          <div className="flex justify-between text-[11px] text-[#A0A0A0]">
                            <span className="font-mono text-[#D4AF37]">{m.senderRole}</span>
                            <span>{formatShortDate(m.createdAt, language)}</span>
                          </div>
                          <div className="text-[#F5F5F5]">{m.messageBody}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {t.status !== 'CLOSED' && (
                    <div className="pt-2 border-t border-[#27272a] space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a reply on this ticket..."
                          value={replyDrafts[t.id] || ''}
                          onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#F5F5F5]"
                        />
                        <button
                          type="button"
                          onClick={() => handleReplyTicket(t.id)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Send size={13} aria-hidden="true" />
                          <span>Reply</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {role === 'PLATFORM_ADMIN' && t.status === 'OPEN' && (
                          <button
                            type="button"
                            onClick={() => handleV26StatusChange(t.id, 'IN_REVIEW')}
                            className="px-3 py-1.5 rounded-lg bg-[#121212] border border-[#D4AF37]/60 text-xs text-[#D4AF37] cursor-pointer"
                          >
                            Mark In Review
                          </button>
                        )}
                        {role === 'PLATFORM_ADMIN' && (t.status === 'OPEN' || t.status === 'IN_REVIEW') && (
                          <button
                            type="button"
                            onClick={() => handleV26StatusChange(t.id, 'RESOLVED')}
                            className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold text-xs cursor-pointer"
                          >
                            Resolve Ticket
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleV26StatusChange(t.id, 'CLOSED')}
                          className="px-3 py-1.5 rounded-lg bg-[#121212] border border-[#27272a] text-xs text-[#C0C0C0] hover:text-[#F5F5F5] cursor-pointer"
                        >
                          Close Ticket
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {cases
                .filter((c) => !v26Tickets.some((t) => t.subject === c.subject))
                .map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-[#181818] border border-[#27272a] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#D4AF37]">{c.caseNumber}</span>
                      <span className={`font-medium ${c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'text-emerald-400' : 'text-[#D4AF37]'}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#F5F5F5]">{c.subject}</div>
                    <p className="text-xs text-[#A0A0A0]">{c.details}</p>
                    {c.status !== 'CLOSED' && (
                      <div className="pt-2 border-t border-[#27272a] flex flex-wrap gap-2">
                        {role === 'PLATFORM_ADMIN' && (
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
