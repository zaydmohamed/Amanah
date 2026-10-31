import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { PiggyBank, Plus, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';

export default function OwnerEquityPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'DRAWING',
    amount: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/owner-transactions');
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to load owner transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/owner-transactions', {
        ...formData,
        amount: Number(formData.amount),
      });
      alert('Owner transaction recorded into equity ledger!');
      setIsOpen(false);
      setFormData({ type: 'DRAWING', amount: '', reason: '', notes: '' });
      fetchTransactions();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Owner Capital & Drawings (Equity)</h2>
          <p className="text-xs text-slate-500">
            Track proprietor capital contributions and personal drawings without distorting operating profit.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Record Equity Movement
        </button>
      </div>

      <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
        <strong>Accounting Integrity Rule:</strong> Owner Drawings reduce the proprietor's equity directly via contra-account <code>3020</code> and do <em>not</em> count as an operating expense. Capital contributions credit equity account <code>3010</code> and do <em>not</em> count as sales revenue.
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4">Account Used</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">Loading transactions...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">No owner equity records found</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{t.transactionNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'CAPITAL_CONTRIBUTION'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.type === 'CAPITAL_CONTRIBUTION' ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Capital Deposit
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-rose-600" /> Owner Withdrawal
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{t.reason}</td>
                    <td className="py-2.5 px-4 text-slate-500">{t.paymentAccount?.name || 'Cash on Hand'}</td>
                    <td className={`py-2.5 px-4 text-right font-bold font-mono ${
                      t.type === 'CAPITAL_CONTRIBUTION' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {t.type === 'CAPITAL_CONTRIBUTION' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{t.recordedBy?.name || 'Admin'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Record Owner Equity Movement</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-bold"
                >
                  <option value="DRAWING">Owner Drawing (Personal Cash Withdrawal)</option>
                  <option value="CAPITAL_CONTRIBUTION">Capital Contribution (Seed / Equity Injection)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Reason</label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Monthly family living allowance"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Post Transaction to Ledger
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

