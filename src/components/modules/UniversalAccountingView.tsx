import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { ChartOfAccountItem, UniversalJournalEntry } from '../../types';

export const UniversalAccountingView: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccountItem[]>([]);
  const [journals, setJournals] = useState<UniversalJournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // New Account modal state
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccCategory, setNewAccCategory] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('ASSET');
  const [newAccCurrency, setNewAccCurrency] = useState('UGX');
  const [newAccBalance, setNewAccBalance] = useState(0);

  // New Journal Entry modal state
  const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
  const [jDebitAcc, setJDebitAcc] = useState('COA-1010');
  const [jCreditAcc, setJCreditAcc] = useState('COA-1200');
  const [jAmount, setJAmount] = useState<number>(25000000);
  const [jMemo, setJMemo] = useState('Trade settlement invoice clearing');

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const [accRes, jrnRes, tbRes] = await Promise.all([
        apiClient.getChartOfAccounts(),
        apiClient.getUniversalJournal(),
        apiClient.getTrialBalance()
      ]);
      setAccounts(accRes || []);
      setJournals(jrnRes || []);
      setTrialBalance(tbRes || null);
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Failed to load ledger records', error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountingData();
  }, []);

  const handleCreateAccount = async () => {
    try {
      await apiClient.createChartOfAccount({
        accountNumber: newAccNumber,
        accountName: newAccName,
        category: newAccCategory,
        currency: newAccCurrency,
        initialBalance: newAccBalance
      });
      setActionMsg({ text: `Account ${newAccNumber} created successfully.` });
      setShowAccountModal(false);
      setNewAccNumber('');
      setNewAccName('');
      loadAccountingData();
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Account creation failed.', error: true });
    }
  };

  const handlePostJournal = async () => {
    try {
      const lines = [
        { accountId: jDebitAcc, direction: 'DEBIT', amount: Number(jAmount), currency: 'UGX', memo: jMemo },
        { accountId: jCreditAcc, direction: 'CREDIT', amount: Number(jAmount), currency: 'UGX', memo: jMemo }
      ];
      await apiClient.postJournalEntry({
        referenceType: 'PAYMENT',
        referenceId: `REF-${Date.now().toString().slice(-6)}`,
        lines,
        postedBy: 'auditor@vinexsah.tech'
      });
      setActionMsg({ text: `Balanced universal journal entry posted (UGX ${Number(jAmount).toLocaleString()}).` });
      setShowJournalModal(false);
      loadAccountingData();
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Journal posting failed.', error: true });
    }
  };

  const handleReverseJournal = async (id: string) => {
    try {
      await apiClient.reverseJournalEntry(id, 'Reversal audit test');
      setActionMsg({ text: `Journal entry ${id} reversed with immutable reversing entries.` });
      loadAccountingData();
    } catch (err: any) {
      setActionMsg({ text: err.message || 'Reversal failed.', error: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#262626] p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              <h1 className="text-xl font-semibold text-[#F5F5F5] tracking-tight">
                Universal General Ledger & Chart of Accounts
              </h1>
            </div>
            <p className="text-sm text-[#A0A0A0]">
              Multi-currency double-entry accounting foundation with immutable posted journals, trial balance verification and auditable reversing entries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#252525] text-xs font-medium text-[#F5F5F5] border border-[#333333] rounded flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>New Account</span>
            </button>
            <button
              onClick={() => setShowJournalModal(true)}
              className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-xs font-semibold text-[#050505] rounded flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Post Journal Entry</span>
            </button>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3.5 rounded text-xs border ${actionMsg.error ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Trial Balance Health Bar */}
      {trialBalance && (
        <div className="bg-[#121212] border border-[#262626] p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded border ${trialBalance.isBalanced ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400' : 'bg-red-950/60 border-red-800/80 text-red-400'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#F5F5F5]">
                Trial Balance Status: {trialBalance.isBalanced ? 'BALANCED (DEBIT = CREDIT)' : 'OUT OF BALANCE'}
              </div>
              <div className="text-[11px] text-[#808080]">
                Period: {trialBalance.period} · Base Currency: UGX · Dual-entry integrity verified
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-[#808080]">TOTAL DEBIT: </span>
              <span className="text-[#F5F5F5] font-semibold tabular-nums">UGX {(trialBalance.totalDebitUGX / 1000000).toFixed(2)}M</span>
            </div>
            <div>
              <span className="text-[#808080]">TOTAL CREDIT: </span>
              <span className="text-[#D4AF37] font-semibold tabular-nums">UGX {(trialBalance.totalCreditUGX / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart of Accounts Table */}
      <div className="bg-[#121212] border border-[#262626] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F5F5F5]">Chart of Accounts Registry ({accounts.length})</h2>
          <span className="text-[11px] font-mono text-[#D4AF37]">SYSTEM CATEGORIES: ASSET · LIABILITY · REVENUE · EXPENSE · SUSPENSE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171717] text-[#808080] uppercase text-[10px] tracking-wider border-b border-[#262626]">
              <tr>
                <th className="py-2.5 px-4">Account #</th>
                <th className="py-2.5 px-4">Account Name</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Currency</th>
                <th className="py-2.5 px-4 text-right">Balance</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020] text-[#C0C0C0]">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-[#181818] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#F5F5F5]">{acc.accountNumber}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#F5F5F5]">{acc.accountName}</div>
                    <div className="text-[11px] text-[#707070] truncate max-w-xs">{acc.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-[#1c1c1f] border border-[#2e2e33] text-[#D4AF37]">
                      {acc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{acc.currency}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-[#F5F5F5] font-semibold">
                    {acc.currency} {acc.balance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal Journal Entries */}
      <div className="bg-[#121212] border border-[#262626] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#262626] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Universal Journal Entry Audit Stream ({journals.length})</h2>
            <p className="text-xs text-[#808080]">Cryptographically hashed financial postings with immutable ledger lines</p>
          </div>
          <button
            onClick={loadAccountingData}
            className="p-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-[#333333] rounded text-[#A0A0A0] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[#202020]">
          {journals.map(j => (
            <div key={j.id} className="p-4 hover:bg-[#161616] transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#D4AF37]">{j.entryNumber}</span>
                  <span className="text-xs text-[#A0A0A0]">· Ref: {j.referenceType} ({j.referenceId})</span>
                  {j.isReversed && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded">
                      REVERSED ({j.reversedByEntryId})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#707070] font-mono">
                    {new Date(j.timestamp).toLocaleString()}
                  </span>
                  {!j.isReversed && (
                    <button
                      onClick={() => handleReverseJournal(j.id)}
                      className="px-2 py-1 bg-[#1C1C1C] hover:bg-[#282828] text-[10px] text-amber-300 border border-amber-900/60 rounded flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reverse</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Journal Lines */}
              <div className="bg-[#181818] border border-[#262626] rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1C1C1C] text-[#808080] text-[10px] uppercase">
                    <tr>
                      <th className="py-1.5 px-3">Account</th>
                      <th className="py-1.5 px-3">Direction</th>
                      <th className="py-1.5 px-3">Memo</th>
                      <th className="py-1.5 px-3 text-right">Amount (Native)</th>
                      <th className="py-1.5 px-3 text-right">Base Amount (UGX)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {j.lines.map(line => (
                      <tr key={line.id} className="text-[#C0C0C0]">
                        <td className="py-2 px-3 font-mono">
                          <span className="text-[#F5F5F5] font-semibold">{line.accountNumber}</span> - {line.accountName}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          <span className={line.direction === 'DEBIT' ? 'text-emerald-400' : 'text-blue-400'}>
                            {line.direction}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#A0A0A0]">{line.memo}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-[#F5F5F5]">
                          {line.currency} {line.amount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-[#D4AF37]">
                          UGX {line.baseAmountUGX.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] font-mono text-[#666666] truncate">
                AUDIT HASH: {j.auditHash} · POSTED BY: {j.postedBy}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: New Account */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2e2e33] p-6 rounded-lg max-w-md w-full space-y-4">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Create Chart of Accounts Record</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Account Number (e.g. 1040, 2020)</label>
                <input
                  type="text"
                  value={newAccNumber}
                  onChange={e => setNewAccNumber(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="1040"
                />
              </div>
              <div>
                <label className="block text-[#A0A0A0] mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Regional FX Clearing Account (KES)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Category</label>
                  <select
                    value={newAccCategory}
                    onChange={e => setNewAccCategory(e.target.value as any)}
                    className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="REVENUE">REVENUE</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Currency</label>
                  <input
                    type="text"
                    value={newAccCurrency}
                    onChange={e => setNewAccCurrency(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#A0A0A0] mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={newAccBalance}
                  onChange={e => setNewAccBalance(Number(e.target.value))}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAccountModal(false)}
                className="px-3 py-1.5 bg-[#1C1C1C] text-xs text-[#A0A0A0] rounded hover:text-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                className="px-4 py-1.5 bg-[#D4AF37] text-xs font-semibold text-[#050505] rounded hover:bg-[#E5C158]"
              >
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Journal Entry */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2e2e33] p-6 rounded-lg max-w-lg w-full space-y-4">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Post Balanced Universal Journal Entry</h3>
            <p className="text-xs text-[#808080]">
              Atomic double-entry transaction posting. Debits and Credits must balance precisely.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Debit Account</label>
                <select
                  value={jDebitAcc}
                  onChange={e => setJDebitAcc(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountNumber} - {a.accountName} ({a.currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A0A0A0] mb-1">Credit Account</label>
                <select
                  value={jCreditAcc}
                  onChange={e => setJCreditAcc(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountNumber} - {a.accountName} ({a.currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A0A0A0] mb-1">Amount (UGX)</label>
                <input
                  type="number"
                  value={jAmount}
                  onChange={e => setJAmount(Number(e.target.value))}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[#A0A0A0] mb-1">Transaction Narration / Memo</label>
                <input
                  type="text"
                  value={jMemo}
                  onChange={e => setJMemo(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333333] rounded p-2 text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowJournalModal(false)}
                className="px-3 py-1.5 bg-[#1C1C1C] text-xs text-[#A0A0A0] rounded hover:text-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                onClick={handlePostJournal}
                className="px-4 py-1.5 bg-[#D4AF37] text-xs font-semibold text-[#050505] rounded hover:bg-[#E5C158]"
              >
                Post Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
