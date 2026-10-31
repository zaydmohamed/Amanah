import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Building2, Plus, Search, DollarSign, X } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyDebt, setOnlyDebt] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState(null);

  // Forms
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: 'Net 30',
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, [search, onlyDebt]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      let url = `/suppliers?search=${encodeURIComponent(search)}`;
      if (onlyDebt) url += '&hasDebt=true';
      const res = await api.get(url);
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', newSupplier);
      setIsAddOpen(false);
      setNewSupplier({ name: '', contactPerson: '', phone: '', email: '', address: '', paymentTerms: 'Net 30', notes: '' });
      fetchSuppliers();
    } catch (err) {
      alert(`Error creating supplier: ${err.message}`);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payingSupplier) return;

    try {
      await api.post(`/suppliers/${payingSupplier._id}/payments`, paymentData);
      alert('Supplier payment voucher posted! Accounts Payable and bank/cash account updated.');
      setPayingSupplier(null);
      setPaymentData({ amount: '', paymentMethod: 'BANK_TRANSFER', reference: '', notes: '' });
      fetchSuppliers();
    } catch (err) {
      alert(`Payment error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Supplier Management & Accounts Payable</h2>
          <p className="text-xs text-slate-500">
            Vendor accounts, payment terms, and vendor debt disbursements.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Vendor / Supplier
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by company or contact person..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={onlyDebt}
            onChange={(e) => setOnlyDebt(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500"
          />
          <span>Show Vendors with Payables Due</span>
        </label>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vendor Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Terms</th>
                <th className="py-3 px-4 text-right">Accounts Payable Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">Loading suppliers...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">No suppliers found</td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{s.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{s.contactPerson || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-500">{s.phone || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-500">{s.paymentTerms}</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-rose-700 font-mono">
                      ${s.currentBalance?.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {s.currentBalance > 0 && (
                        <button
                          onClick={() => {
                            setPayingSupplier(s);
                            setPaymentData({ amount: String(s.currentBalance), paymentMethod: 'BANK_TRANSFER', reference: '', notes: '' });
                          }}
                          className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-[11px] font-bold shadow-xs"
                        >
                          Disburse Payment
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

      {/* Add Supplier Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Add New Supplier</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Vendor Name</label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={newSupplier.paymentTerms}
                  onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="Net 15, Net 30, Cash on Delivery"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Save Supplier
            </button>
          </form>
        </div>
      )}

      {/* Disburse Supplier Payment Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handlePaymentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Disburse Supplier Debt Payment</h3>
              <button type="button" onClick={() => setPayingSupplier(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div>Supplier: <strong>{payingSupplier.name}</strong></div>
              <div>Accounts Payable Due: <strong className="text-rose-700">${payingSupplier.currentBalance.toFixed(2)}</strong></div>
              <div className="text-[10px] text-slate-500 pt-1">
                Note: This voucher reduces Accounts Payable (2010) and does NOT create an operating expense.
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Disburse ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={payingSupplier.currentBalance}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Account</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="BANK_TRANSFER">Commercial Bank Wire (1020)</option>
                  <option value="CASH">Cash on Hand (1010)</option>
                  <option value="MOBILE_MONEY">Mobile Money Wallet (1030)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Voucher Ref / Notes</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="e.g. Wire transfer ref # 99282"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Post Payment Voucher
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

