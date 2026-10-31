import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Users, Plus, DollarSign, Search, Phone, History, X, AlertCircle } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyDebt, setOnlyDebt] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);

  // Form states
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: '1000',
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, [search, onlyDebt]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = `/customers?search=${encodeURIComponent(search)}`;
      if (onlyDebt) url += '&hasDebt=true';
      const res = await api.get(url);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', newCustomer);
      setIsAddOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', creditLimit: '1000', notes: '' });
      fetchCustomers();
    } catch (err) {
      alert(`Error creating customer: ${err.message}`);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payingCustomer) return;

    try {
      await api.post(`/customers/${payingCustomer._id}/payments`, paymentData);
      alert('Payment recorded! Accounts Receivable reduced and cash/bank ledger updated.');
      setPayingCustomer(null);
      setPaymentData({ amount: '', paymentMethod: 'CASH', reference: '', notes: '' });
      fetchCustomers();
    } catch (err) {
      alert(`Payment error: ${err.message}`);
    }
  };

  const viewCustomerDetails = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomerDetails(res.data);
    } catch (err) {
      alert(`Error fetching customer details: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customer Management & Accounts Receivable</h2>
          <p className="text-xs text-slate-500">
            Track customer balances, credit limits, invoices, and debt settlements.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Register New Customer
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
            placeholder="Search customers by name or phone..."
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
          <span>Show Customers with Debt Only</span>
        </label>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4 text-right">Outstanding Debt</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">No customers found</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{c.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{c.phone || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-600">${c.creditLimit?.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-amber-700 font-mono">
                      ${c.currentBalance?.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1">
                      {c.currentBalance > 0 && (
                        <button
                          onClick={() => {
                            setPayingCustomer(c);
                            setPaymentData({ amount: String(c.currentBalance), paymentMethod: 'CASH', reference: '', notes: '' });
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs"
                        >
                          Collect Debt
                        </button>
                      )}
                      <button
                        onClick={() => viewCustomerDetails(c._id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 text-xs font-semibold"
                        title="Statement & Invoices"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Register New Customer</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit ($)</label>
                <input
                  type="number"
                  value={newCustomer.creditLimit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Save Customer
            </button>
          </form>
        </div>
      )}

      {/* Collect Debt Payment Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handlePaymentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Collect Customer Debt Settlement</h3>
              <button type="button" onClick={() => setPayingCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div>Customer: <strong>{payingCustomer.name}</strong></div>
              <div>Current Outstanding Debt: <strong className="text-amber-700">${payingCustomer.currentBalance.toFixed(2)}</strong></div>
              <div className="text-[10px] text-slate-500 pt-1">
                Note: This payment reduces Accounts Receivable and does NOT duplicate sales revenue.
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Pay ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={payingCustomer.currentBalance}
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="CASH">Cash on Hand</option>
                  <option value="MOBILE_MONEY">Mobile Money (EVC / Zaad / M-Pesa)</option>
                  <option value="BANK_TRANSFER">Bank Wire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Notes</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="e.g. Wire ref or slip #"
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
            >
              Post Payment Collection
            </button>
          </form>
        </div>
      )}

      {/* Customer History & Statement Drawer */}
      {selectedCustomerDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">{selectedCustomerDetails.customer?.name}</h3>
                <button onClick={() => setSelectedCustomerDetails(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <div>Phone: <strong>{selectedCustomerDetails.customer?.phone}</strong></div>
                <div>Credit Limit: <strong>${selectedCustomerDetails.customer?.creditLimit}</strong></div>
                <div>Current Debt: <strong className="text-amber-700 font-bold">${selectedCustomerDetails.customer?.currentBalance?.toFixed(2)}</strong></div>
              </div>

              <h4 className="font-bold text-xs text-slate-800 mt-4 mb-2">Previous Purchases</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2">
                {selectedCustomerDetails.salesHistory?.map((s) => (
                  <div key={s._id} className="text-xs p-1.5 bg-slate-50/50 rounded flex justify-between">
                    <div>
                      <div className="font-mono font-bold text-brand-600">{s.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">{new Date(s.saleDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${s.totalAmount.toFixed(2)}</div>
                      <div className="text-[10px] text-amber-700">Due: ${s.amountDue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="font-bold text-xs text-slate-800 mt-4 mb-2">Debt Payment History</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-2">
                {selectedCustomerDetails.paymentHistory?.length === 0 ? (
                  <div className="text-[11px] text-slate-400 text-center py-2">No debt payments on record</div>
                ) : (
                  selectedCustomerDetails.paymentHistory?.map((p) => (
                    <div key={p._id} className="text-xs p-1.5 bg-emerald-50/50 rounded flex justify-between">
                      <div>
                        <div className="font-bold text-emerald-800">{p.paymentNumber}</div>
                        <div className="text-[10px] text-slate-400">{new Date(p.date).toLocaleDateString()} ({p.paymentMethod})</div>
                      </div>
                      <div className="font-bold text-emerald-700">+${p.amount.toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomerDetails(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

