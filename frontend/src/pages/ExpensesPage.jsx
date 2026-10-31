import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { CreditCard, Plus, DollarSign, Calendar, X, AlertCircle } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    categoryAccountId: '',
    description: '',
    amount: '',
    paymentMethod: 'CASH',
    payee: '',
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
    api.get('/accounting/accounts?type=EXPENSE').then((res) => {
      setAccounts(res.data || []);
      if (res.data?.length > 0) {
        setFormData((prev) => ({ ...prev, categoryAccountId: res.data[0]._id }));
      }
    }).catch(() => {});
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount),
      });
      alert('Expense recorded and double-entry ledger updated.');
      setIsAddOpen(false);
      setFormData({
        categoryAccountId: accounts[0]?._id || '',
        description: '',
        amount: '',
        paymentMethod: 'CASH',
        payee: '',
        notes: '',
      });
      fetchExpenses();
    } catch (err) {
      alert(`Error recording expense: ${err.message}`);
    }
  };

  const handlePayUnpaid = async (expenseId) => {
    try {
      await api.post(`/expenses/${expenseId}/pay`, { paymentMethod: 'CASH' });
      alert('Accrued expense settled from cash drawer!');
      fetchExpenses();
    } catch (err) {
      alert(`Error settling expense: ${err.message}`);
    }
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Operating Expenses</h2>
          <p className="text-xs text-slate-500">
            Rent, utilities, maintenance, supplies, and store overheads with full double-entry postings.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Record New Expense
        </button>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
        <div>
          <span className="text-xs text-slate-500">Total Recorded Expenses</span>
          <div className="text-2xl font-bold text-rose-600">${totalExpenseSum.toFixed(2)}</div>
        </div>
        <div className="text-xs text-slate-400">Accrual-based general ledger sync</div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category Account</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payee</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-400">No expenses recorded</td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{e.expenseNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{e.categoryName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{e.description}</td>
                    <td className="py-2.5 px-4 text-slate-500">{e.payee || '-'}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {e.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-600 font-mono">
                      ${e.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {e.status === 'UNPAID' && (
                        <button
                          onClick={() => handlePayUnpaid(e._id)}
                          className="px-2 py-1 bg-brand-600 text-white rounded text-[10px] font-bold"
                        >
                          Settle Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Record Store Expense</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category (Chart of Accounts)</label>
                <select
                  required
                  value={formData.categoryAccountId}
                  onChange={(e) => setFormData({ ...formData, categoryAccountId: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. November Store Premises Lease"
                />
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="CASH">Cash on Hand (1010)</option>
                  <option value="BANK_TRANSFER">Bank Account (1020)</option>
                  <option value="MOBILE_MONEY">Mobile Money Wallet (1030)</option>
                  <option value="UNPAID">Accrue as Unpaid (Accrued Expenses 2030)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payee / Vendor</label>
                <input
                  type="text"
                  value={formData.payee}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Utility Company or Landlord"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Post Expense
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

