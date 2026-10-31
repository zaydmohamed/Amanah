import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { BookOpen, ListFilter, CheckCircle, Scale, Plus, X, Search } from 'lucide-react';

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('TRIAL_BALANCE'); // 'TRIAL_BALANCE' | 'COA' | 'JOURNAL_ENTRIES' | 'GL'
  const [trialBalance, setTrialBalance] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [ledgerData, setLedgerData] = useState(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState('1010');
  const [loading, setLoading] = useState(true);

  // Manual entry modal
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualLines, setManualLines] = useState([
    { accountCode: '1010', debit: '', credit: '', description: '' },
    { accountCode: '4090', debit: '', credit: '', description: '' },
  ]);
  const [manualDesc, setManualDesc] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, selectedLedgerAccount]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'TRIAL_BALANCE') {
        const res = await api.get('/accounting/trial-balance');
        setTrialBalance(res.data);
      } else if (activeTab === 'COA') {
        const res = await api.get('/accounting/accounts');
        setAccounts(res.data || []);
      } else if (activeTab === 'JOURNAL_ENTRIES') {
        const res = await api.get('/accounting/journal-entries');
        setJournalEntries(res.data || []);
      } else if (activeTab === 'GL') {
        const res = await api.get(`/accounting/general-ledger/${selectedLedgerAccount}`);
        setLedgerData(res.data);
      }
    } catch (err) {
      console.error('Failed to load accounting data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLineChange = (index, field, val) => {
    const updated = [...manualLines];
    updated[index][field] = val;
    setManualLines(updated);
  };

  const addManualLine = () => {
    setManualLines([...manualLines, { accountCode: '1010', debit: '', credit: '', description: '' }]);
  };

  const removeManualLine = (idx) => {
    if (manualLines.length <= 2) return;
    setManualLines(manualLines.filter((_, i) => i !== idx));
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounting/manual-journal-entry', {
        description: manualDesc,
        lines: manualLines.map((l) => ({
          accountCode: l.accountCode,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          description: l.description || manualDesc,
        })),
      });

      alert('Manual journal entry successfully posted to the general ledger!');
      setIsManualOpen(false);
      setManualDesc('');
      loadData();
    } catch (err) {
      alert(`Posting error: ${err.message}`);
    }
  };

  const manualTotalDebit = manualLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const manualTotalCredit = manualLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isManualBalanced = Math.abs(manualTotalDebit - manualTotalCredit) < 0.01 && manualTotalDebit > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Double-Entry Accounting Engine</h2>
          <p className="text-xs text-slate-500">
            Standard Chart of Accounts, General Ledger, Trial Balance, and Balanced Journal Entries.
          </p>
        </div>

        <button
          onClick={() => setIsManualOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Manual Journal Entry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        {[
          { id: 'TRIAL_BALANCE', label: 'Trial Balance Verification', icon: Scale },
          { id: 'COA', label: 'Chart of Accounts (COA)', icon: ListFilter },
          { id: 'JOURNAL_ENTRIES', label: 'Journal Entries Ledger', icon: BookOpen },
          { id: 'GL', label: 'General Ledger Account Inquiry', icon: Search },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Trial Balance */}
      {activeTab === 'TRIAL_BALANCE' && trialBalance && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            trialBalance.isBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>
                {trialBalance.isBalanced
                  ? 'Ledger Equation Verified: Total Debits exactly equal Total Credits.'
                  : `WARNING: Trial balance difference of $${trialBalance.difference}. Investigate underlying journal lines.`}
              </span>
            </div>
            <div className="text-sm font-bold font-mono">
              Debits: ${trialBalance.totalDebit?.toFixed(2)} | Credits: ${trialBalance.totalCredit?.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4 text-right">Debit Balance ($)</th>
                    <th className="py-3 px-4 text-right">Credit Balance ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {trialBalance.rows?.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{row.code}</td>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{row.name}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-500">{row.type}</td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-bold">
                        {row.debit > 0 ? `$${row.debit.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-bold">
                        {row.credit > 0 ? `$${row.credit.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/70 font-bold text-slate-900 text-xs">
                    <td colSpan="3" className="py-3 px-4 text-right uppercase font-sans">
                      Total Ledger Balances:
                    </td>
                    <td className="py-3 px-4 text-right text-brand-600">
                      ${trialBalance.totalDebit?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-brand-600">
                      ${trialBalance.totalCredit?.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Chart of Accounts */}
      {activeTab === 'COA' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{a.code}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{a.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {a.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{a.description}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${a.balance?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Journal Entries */}
      {activeTab === 'JOURNAL_ENTRIES' && (
        <div className="space-y-3">
          {journalEntries.map((je) => (
            <div key={je._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <span className="font-mono font-bold text-brand-600 text-sm">{je.entryNumber}</span>
                  <span className="text-slate-400 ml-2 font-mono">[{je.sourceModule}]</span>
                </div>
                <div className="text-slate-500">{new Date(je.date).toLocaleString()}</div>
              </div>

              <div className="text-slate-700 font-medium py-1.5">{je.description}</div>

              <div className="bg-slate-50 rounded-lg p-2 mt-2">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-1 px-2">Account</th>
                      <th className="py-1 px-2">Description</th>
                      <th className="py-1 px-2 text-right">Debit ($)</th>
                      <th className="py-1 px-2 text-right">Credit ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {je.lines.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-100/60">
                        <td className="py-1 px-2 text-slate-800">
                          {l.accountCode} - {l.accountName}
                        </td>
                        <td className="py-1 px-2 text-slate-500 font-sans">{l.description}</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {l.debit > 0 ? l.debit.toFixed(2) : '-'}
                        </td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {l.credit > 0 ? l.credit.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: General Ledger Inquiry */}
      {activeTab === 'GL' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">Select Account for Ledger Inquiry:</span>
            <select
              value={selectedLedgerAccount}
              onChange={(e) => setSelectedLedgerAccount(e.target.value)}
              className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white font-bold"
            >
              <option value="1010">1010 - Cash on Hand</option>
              <option value="1020">1020 - Bank Account</option>
              <option value="1030">1030 - Mobile Money</option>
              <option value="1200">1200 - Accounts Receivable</option>
              <option value="1300">1300 - Inventory Asset</option>
              <option value="2010">2010 - Accounts Payable</option>
              <option value="2020">2020 - Salaries Payable</option>
              <option value="3010">3010 - Owner Capital</option>
              <option value="3020">3020 - Owner Drawings</option>
              <option value="4010">4010 - Sales Revenue</option>
              <option value="5010">5010 - Cost of Goods Sold</option>
              <option value="6010">6010 - Rent Expense</option>
              <option value="6020">6020 - Salaries Expense</option>
            </select>
          </div>

          {ledgerData && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Account: </span>
                  <strong className="text-slate-800">{ledgerData.account.code} - {ledgerData.account.name}</strong>
                </div>
                <div className="font-mono">
                  Opening: <strong>${ledgerData.openingBalance.toFixed(2)}</strong> | Closing: <strong className="text-brand-600">${ledgerData.closingBalance.toFixed(2)}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-sans">Date</th>
                      <th className="py-2.5 px-4">Entry #</th>
                      <th className="py-2.5 px-4 font-sans">Description</th>
                      <th className="py-2.5 px-4 text-right">Debit ($)</th>
                      <th className="py-2.5 px-4 text-right">Credit ($)</th>
                      <th className="py-2.5 px-4 text-right">Running Balance ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerData.transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-sans text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="py-2 px-4 font-bold text-brand-600">{tx.entryNumber}</td>
                        <td className="py-2 px-4 font-sans text-slate-700">{tx.description}</td>
                        <td className="py-2 px-4 text-right text-slate-800">{tx.debit > 0 ? tx.debit.toFixed(2) : '-'}</td>
                        <td className="py-2 px-4 text-right text-slate-800">{tx.credit > 0 ? tx.credit.toFixed(2) : '-'}</td>
                        <td className="py-2 px-4 text-right font-bold text-brand-700">${tx.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Journal Entry Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleManualSubmit} className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Post Manual Double-Entry Journal Entry</h3>
              <button type="button" onClick={() => setIsManualOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Description / Memo</label>
              <input
                type="text"
                required
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                placeholder="e.g. Month-end depreciation adjustment"
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="border border-slate-100 rounded-lg overflow-hidden my-3 max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3 w-48">Account Code</th>
                    <th className="py-2 px-3">Line Memo</th>
                    <th className="py-2 px-3 w-28 text-right">Debit ($)</th>
                    <th className="py-2 px-3 w-28 text-right">Credit ($)</th>
                    <th className="py-2 px-3 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {manualLines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-1 px-3">
                        <input
                          type="text"
                          required
                          value={line.accountCode}
                          onChange={(e) => handleManualLineChange(idx, 'accountCode', e.target.value)}
                          className="w-full p-1 border border-slate-200 rounded text-xs font-mono"
                          placeholder="e.g. 1010"
                        />
                      </td>
                      <td className="py-1 px-3">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => handleManualLineChange(idx, 'description', e.target.value)}
                          className="w-full p-1 border border-slate-200 rounded text-xs"
                          placeholder="Line description"
                        />
                      </td>
                      <td className="py-1 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => handleManualLineChange(idx, 'debit', e.target.value)}
                          className="w-24 p-1 border border-slate-200 rounded text-right text-xs"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-1 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => handleManualLineChange(idx, 'credit', e.target.value)}
                          className="w-24 p-1 border border-slate-200 rounded text-right text-xs"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-1 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeManualLine(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg text-xs font-bold mb-4">
              <button
                type="button"
                onClick={addManualLine}
                className="text-brand-600 hover:text-brand-700 font-semibold"
              >
                + Add Entry Line
              </button>

              <div className="space-x-4">
                <span>Debits: ${manualTotalDebit.toFixed(2)}</span>
                <span>Credits: ${manualTotalCredit.toFixed(2)}</span>
                <span className={isManualBalanced ? 'text-emerald-600' : 'text-rose-600'}>
                  {isManualBalanced ? '✓ Balanced' : '✗ Unbalanced'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isManualBalanced}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs disabled:opacity-50"
            >
              Post Journal Entry to Ledger
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

