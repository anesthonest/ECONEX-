/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V22.0 - Universal Invoicing, Non-Custodial Payment References, Extensible Multi-Currency FX,
 * Explainable Economic Intelligence, Relationship Graph, Grounded AI Assistant & PostgreSQL Schema 20 Dry-Run.
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Database,
  Globe,
  Network,
  Receipt,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V22AiAssistantQueryResult,
  V22EconomicInsight,
  V22EconomicRelationship,
  V22FxRateRecord,
  V22InvoiceRecord,
  V22PaymentReference,
  V22SectorDefinition,
} from '../../types/index.ts';

interface Props {
  onNavigate?: (tab: string) => void;
}

export const V22FinancialIntelligenceView: React.FC<Props> = () => {
  const { currentUser, role } = useAuth();
  const actor = { userId: currentUser?.id || role, userRole: role };

  const [tab, setTab] = useState<'INVOICES' | 'FX' | 'INTELLIGENCE' | 'AI_ASSISTANT' | 'SCHEMA20'>('INVOICES');
  const [invoices, setInvoices] = useState<V22InvoiceRecord[]>([]);
  const [paymentRefs, setPaymentRefs] = useState<V22PaymentReference[]>([]);
  const [nonCustodialNotice, setNonCustodialNotice] = useState<string>('');
  const [fxRates, setFxRates] = useState<V22FxRateRecord[]>([]);
  const [insights, setInsights] = useState<V22EconomicInsight[]>([]);
  const [relationships, setRelationships] = useState<V22EconomicRelationship[]>([]);
  const [sectors, setSectors] = useState<V22SectorDefinition[]>([]);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [invRecipient, setInvRecipient] = useState<string>('Kampala Medical Centre');
  const [invSector, setInvSector] = useState<string>('HEALTHCARE_MEDICAL');
  const [invDesc, setInvDesc] = useState<string>('Diagnostic Equipment Maintenance & Calibration');
  const [invAmount, setInvAmount] = useState<number>(2200000);
  const [invCurrency, setInvCurrency] = useState<string>('UGX');

  const [payInvId, setPayInvId] = useState<string>('');
  const [payChannel, setPayChannel] = useState<V22PaymentReference['externalChannel']>('MOBILE_MONEY');
  const [payProvider, setPayProvider] = useState<string>('MTN MoMo Business');
  const [payRefNum, setPayRefNum] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(1000000);

  const [aiQuery, setAiQuery] = useState<string>('Summarize open procurement opportunities and unpaid invoices');
  const [aiResponse, setAiResponse] = useState<V22AiAssistantQueryResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [invRes, fxRes, insRes, relRes, secRes] = await Promise.all([
        ApiClient.v22GetInvoices(actor),
        ApiClient.v22GetFxRates(actor),
        ApiClient.v22GetInsights(actor),
        ApiClient.v22GetRelationships(actor),
        ApiClient.v22GetSectors(undefined, actor),
      ]);
      setInvoices(invRes.invoices || []);
      setPaymentRefs(invRes.paymentRefs || []);
      setNonCustodialNotice(invRes.disclaimer || '');
      setFxRates(fxRes.rates || []);
      setInsights(insRes.insights || []);
      setRelationships(relRes.relationships || []);
      setSectors(secRes.sectors || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load financial & intelligence records.');
    }
  }, [currentUser?.id, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleIssueInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const inv = await ApiClient.v22CreateInvoice(
        {
          recipientUserId: 'EXT-RECIPIENT',
          recipientName: invRecipient,
          sectorCode: invSector,
          currency: invCurrency,
          taxRatePct: 18,
          lineItems: [{ description: invDesc, qty: 1, unitPrice: invAmount }],
        },
        actor
      );
      setFeedback(`Issued invoice ${inv.invoiceNumber} with balanced double-entry journal ${inv.journalEntryId}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not issue invoice.');
    }
  };

  const handleRecordPaymentRef = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v22RecordPaymentRef(
        {
          invoiceId: payInvId,
          externalChannel: payChannel,
          externalProviderName: payProvider,
          externalReferenceNumber: payRefNum,
          amount: payAmount,
        },
        actor
      );
      setFeedback(`Recorded non-custodial external payment reference ${res.paymentRef?.externalReferenceNumber}.`);
      setPayInvId('');
      setPayRefNum('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not record external payment reference.');
    }
  };

  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setError(null);
    try {
      const res = await ApiClient.v22AskAssistant(aiQuery, actor);
      setAiResponse(res);
    } catch (err: any) {
      if (err?.payload?.promptInjectionDetected) {
        setAiResponse(err.payload);
      } else {
        setError(err?.message || 'Assistant request failed.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleAckInsight = async (id: string) => {
    try {
      await ApiClient.v22AcknowledgeInsight(id, actor);
      setFeedback(`Acknowledged growth insight ${id}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not acknowledge insight.');
    }
  };

  const handleRunDryRun = async () => {
    setError(null);
    setFeedback(null);
    try {
      const res = await ApiClient.v22RunPostgresDryRun(actor);
      setDryRunResult(res);
      setFeedback(`Schema 20 PostgreSQL dry-run audited (${res.mappedTablesCount} tables mapped).`);
    } catch (err: any) {
      setError(err?.message || 'Admin role required for Schema 20 dry-run audit.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-[#121212] border border-[#27272a] rounded-2xl p-6 space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#D4AF37]">FINANCE COORDINATION, FX, INTELLIGENCE &amp; GOVERNANCE</div>
          <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
            Invoicing, Multi-Currency &amp; Grounded Intelligence
          </h1>
          <p className="text-xs text-[#A0A0A0]">{nonCustodialNotice}</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#27272a]">
          {(
            [
              ['INVOICES', 'Invoices & Payment Refs'],
              ['FX', `Multi-Currency FX (${fxRates.length})`],
              ['INTELLIGENCE', 'Insights & Network Graph'],
              ['AI_ASSISTANT', 'Grounded AI Assistant'],
              ['SCHEMA20', 'Schema 20 & Migration'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-mono border cursor-pointer whitespace-nowrap shrink-0 ${
                tab === id
                  ? 'bg-[#D4AF37] text-[#050505] border-[#D4AF37] font-semibold'
                  : 'bg-[#181818] text-[#C0C0C0] border-[#27272a]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div role="alert" className="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-200 flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-400 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-4 text-sm text-emerald-200">
          {feedback}
        </div>
      )}

      {tab === 'INVOICES' && (
        <div className="space-y-6">
          <form onSubmit={handleIssueInvoice} className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Receipt size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Issue Tax-Calculated Commercial Invoice (18% VAT + Balanced Journal)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                required
                value={invRecipient}
                onChange={(e) => setInvRecipient(e.target.value)}
                placeholder="Recipient organization"
                className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
              <select
                value={invSector}
                onChange={(e) => setInvSector(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              >
                {sectors.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                required
                value={invDesc}
                onChange={(e) => setInvDesc(e.target.value)}
                placeholder="Line item description"
                className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={invAmount}
                  onChange={(e) => setInvAmount(Number(e.target.value))}
                  className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
                />
                <select
                  value={invCurrency}
                  onChange={(e) => setInvCurrency(e.target.value)}
                  className="w-24 min-h-[44px] px-2 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
                >
                  {fxRates.map((fx) => (
                    <option key={fx.currencyCode} value={fx.currencyCode}>
                      {fx.currencyCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer">
                Issue Invoice
              </button>
            </div>
          </form>

          {payInvId && (
            <form onSubmit={handleRecordPaymentRef} className="bg-[#121212] border border-[#D4AF37] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                  Record Non-Custodial External Payment Reference ({payInvId})
                </h2>
                <button type="button" onClick={() => setPayInvId('')} className="text-xs text-[#A0A0A0] cursor-pointer">
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value as V22PaymentReference['externalChannel'])}
                  className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                >
                  <option value="MOBILE_MONEY">MOBILE_MONEY</option>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                  <option value="RTGS">RTGS</option>
                  <option value="PESALINK">PESALINK</option>
                </select>
                <input
                  required
                  value={payProvider}
                  onChange={(e) => setPayProvider(e.target.value)}
                  placeholder="External Provider"
                  className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
                />
                <input
                  required
                  value={payRefNum}
                  onChange={(e) => setPayRefNum(e.target.value)}
                  placeholder="External Receipt / Txn Ref"
                  className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
                />
                <input
                  type="number"
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="min-h-[44px] px-3 rounded-xl bg-[#181818] border border-[#27272a] text-sm font-mono text-[#F5F5F5]"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm cursor-pointer">
                  Reconcile Payment Reference
                </button>
              </div>
            </form>
          )}

          <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 divide-y divide-[#27272a]">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-[#D4AF37]">
                    {inv.invoiceNumber} · {inv.sectorCode} · {inv.status}
                  </div>
                  <div className="text-sm font-medium text-[#F5F5F5]">
                    {inv.issuerName} → {inv.recipientName}
                  </div>
                  <div className="font-mono text-[#A0A0A0] tabular-nums">
                    Total: {inv.currency} {inv.totalAmount.toLocaleString()} (VAT {inv.taxRatePct}%: {inv.taxAmount.toLocaleString()}) ·
                    Paid: {inv.paidAmount.toLocaleString()} · Balance Due: {inv.balanceDue.toLocaleString()}
                  </div>
                </div>
                {inv.balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayInvId(inv.id);
                      setPayAmount(inv.balanceDue);
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#181818] border border-[#D4AF37] text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Record External Payment Ref
                  </button>
                )}
              </div>
            ))}
          </section>

          {paymentRefs.length > 0 && (
            <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-mono text-[#D4AF37]">EXTERNAL PAYMENT REFERENCES ({paymentRefs.length})</h3>
              {paymentRefs.map((p) => (
                <div key={p.id} className="text-xs font-mono text-[#A0A0A0] border-t border-[#27272a] pt-2">
                  {p.externalReferenceNumber} · {p.externalProviderName} ({p.externalChannel}) · {p.currency}{' '}
                  {p.amount.toLocaleString()} · SHA-256: {p.evidenceSha256.slice(0, 16)}...
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {tab === 'FX' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
            <Globe size={16} className="text-[#D4AF37]" aria-hidden="true" />
            <span>Extensible Multi-Currency Exchange Reference Registry ({fxRates.length} Currencies)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fxRates.map((fx) => (
              <div key={fx.currencyCode} className="bg-[#181818] border border-[#27272a] rounded-xl p-4 space-y-1">
                <div className="text-xs font-mono text-[#D4AF37]">{fx.currencyCode} · {fx.symbol}</div>
                <div className="text-sm font-medium text-[#F5F5F5]">{fx.currencyName}</div>
                <div className="text-lg font-mono font-bold tabular-nums text-[#F5F5F5]">
                  1 {fx.currencyCode} = {fx.rateToUgx.toLocaleString()} UGX
                </div>
                <div className="text-[11px] font-mono text-[#A0A0A0]">{fx.classification} · {fx.rateSource}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'INTELLIGENCE' && (
        <div className="space-y-6">
          <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
              <TrendingUp size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Explainable Cross-Sector Growth Insights</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((ins) => (
                <article key={ins.id} className="bg-[#181818] border border-[#27272a] rounded-xl p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-[#D4AF37]">
                      {ins.sectorCode} · {ins.classification} · Confidence: {ins.confidence}
                    </div>
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">{ins.title}</h3>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed">{ins.summary}</p>
                    <div className="text-[11px] font-mono text-[#C0C0C0]">Provenance: {ins.evidenceBasis}</div>
                    <div className="text-[11px] font-mono text-[#A0A0A0]">Next step: {ins.recommendedNextStep}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAckInsight(ins.id)}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#121212] border border-[#27272a] hover:border-[#D4AF37] text-xs text-[#F5F5F5] cursor-pointer"
                  >
                    {ins.acknowledgedBy ? `Acknowledged by ${ins.acknowledgedBy}` : 'Acknowledge & Review'}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Network size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Cross-Sector Economic Relationship Graph ({relationships.length})</span>
            </h2>
            <div className="divide-y divide-[#27272a]">
              {relationships.map((rel) => (
                <div key={rel.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#F5F5F5]">{rel.sourceEntityName}</span>{' '}
                    <span className="font-mono text-[#D4AF37]">[{rel.relationshipType}]</span>{' '}
                    <span className="font-semibold text-[#F5F5F5]">{rel.targetEntityName}</span>
                  </div>
                  <div className="font-mono text-[#A0A0A0]">
                    {rel.sectorCode} · Verified Txns: {rel.verifiedByTransactionCount} · Masking: {String(rel.sensitiveMaskApplied)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'AI_ASSISTANT' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Bot size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Grounded Economic Assistant (Human Confirmation Required)</span>
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Grounded strictly in verified workspace records with prompt-injection screening. Does not authorize commitments automatically.
            </p>
          </div>
          <form onSubmit={handleAskAssistant} className="flex flex-col sm:flex-row gap-3">
            <input
              required
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask about active tenders, unpaid invoices, or cross-sector suppliers..."
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#181818] border border-[#27272a] text-sm text-[#F5F5F5]"
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              {aiLoading ? 'Analyzing...' : 'Ask Grounded Assistant'}
            </button>
          </form>

          {aiResponse && (
            <div className="bg-[#181818] border border-[#27272a] rounded-xl p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#D4AF37]">Model: {aiResponse.modelUsed}</span>
                {aiResponse.promptInjectionDetected && (
                  <span className="text-red-400">PROMPT INJECTION BLOCKED</span>
                )}
              </div>
              <p className="text-[#F5F5F5] leading-relaxed">{aiResponse.answer}</p>
              <div className="text-xs font-mono text-[#A0A0A0]">
                Cited Records: {aiResponse.evidenceIdsCited.join(', ') || 'None'}
              </div>
              <div className="text-xs text-[#A0A0A0] space-y-1 border-t border-[#27272a] pt-2">
                {aiResponse.limitations.map((lim) => (
                  <div key={lim}>· {lim}</div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'SCHEMA20' && (
        <section className="bg-[#121212] border border-[#27272a] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-display font-semibold text-[#F5F5F5] flex items-center gap-2">
                <Database size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <span>PostgreSQL 16 Schema 20 Dry-Run &amp; WAL Portability Audit</span>
              </h2>
              <p className="text-xs text-[#A0A0A0]">
                Local JSON WAL remains authoritative in the current runtime. External PostgreSQL cutover flags stay false until live database provisioning.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunDryRun}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050505] font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Run Schema 20 Dry-Run Audit
            </button>
          </div>
          {dryRunResult && (
            <div className="bg-[#181818] border border-[#27272a] rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>
                  DDL: {dryRunResult.ddlFile} ({dryRunResult.ddlBytes} bytes) · Tables Mapped: {dryRunResult.mappedTablesCount} ·
                  Ledger Balanced: {String(dryRunResult.ledgerBalanced)}
                </span>
              </div>
              <div className="text-[#A0A0A0]">
                SHA-256: {dryRunResult.ddlSha256} · Cutover Complete: {String(dryRunResult.postgresCutoverComplete)}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default V22FinancialIntelligenceView;
