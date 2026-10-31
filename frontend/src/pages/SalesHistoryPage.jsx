import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Search, Printer, RotateCcw, Eye, X, AlertCircle } from 'lucide-react';
import PrintableInvoiceModal from '../components/common/PrintableInvoiceModal';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [printingSale, setPrintingSale] = useState(null);
  const [returnModalSale, setReturnModalSale] = useState(null);
  const [returnQty, setReturnQty] = useState({});
  const [returnReason, setReturnReason] = useState('Customer changed mind');
  const [refundMethod, setRefundMethod] = useState('CASH');

  useEffect(() => {
    fetchSales();
    api.get('/settings').then((res) => setSettings(res.data)).catch(() => {});
  }, [search]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sales?search=${encodeURIComponent(search)}`);
      setSales(res.data || []);
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintClick = (sale) => {
    setPrintingSale(sale);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnModalSale) return;

    try {
      const returnedItems = returnModalSale.items
        .map((item) => ({
          productId: item.product?._id || item.product,
          quantity: Number(returnQty[item.product?._id || item.product] || 0),
        }))
        .filter((i) => i.quantity > 0);

      if (returnedItems.length === 0) {
        alert('Please specify quantity to return for at least one item');
        return;
      }

      await api.post(`/sales/${returnModalSale._id}/return`, {
        returnedItems,
        refundMethod,
        reason: returnReason,
      });

      alert('Return processed successfully! Stock reinstated and ledger updated.');
      setReturnModalSale(null);
      fetchSales();
    } catch (err) {
      alert(`Return failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sales Invoices & Receipts</h2>
          <p className="text-xs text-slate-500">
            Audit trail of historical sales transactions, customer debt issuances, and returns.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">Loading invoices...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">No sales invoices found</td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{s.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500">{new Date(s.saleDate).toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{s.customerName}</td>
                    <td className="py-2.5 px-4 text-slate-500">{s.cashierName}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">${s.totalAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'RETURNED'
                            ? 'bg-rose-100 text-rose-700'
                            : s.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status === 'RETURNED' ? 'RETURNED' : s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedSale(s)}
                        title="View Details"
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrintClick(s)}
                        title="Print Invoice / Receipt"
                        className="p-1.5 hover:bg-slate-100 rounded text-brand-600"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {s.status !== 'RETURNED' && (
                        <button
                          onClick={() => {
                            setReturnModalSale(s);
                            const initial = {};
                            s.items.forEach((item) => {
                              initial[item.product?._id || item.product] = 0;
                            });
                            setReturnQty(initial);
                          }}
                          title="Process Return"
                          className="p-1.5 hover:bg-rose-50 rounded text-rose-600"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
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

      {/* Invoice Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Invoice {selectedSale.invoiceNumber}</h3>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Date:</span> <span>{new Date(selectedSale.saleDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Customer:</span> <span className="font-medium text-slate-800">{selectedSale.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cashier:</span> <span>{selectedSale.cashierName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Journal Entry:</span> <span className="font-mono text-brand-600">{selectedSale.journalEntry || 'Posted'}</span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-lg overflow-hidden my-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">{item.name}</td>
                      <td className="py-2 px-3 text-center">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-medium">${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs text-right pt-2 border-t border-slate-100">
              <div className="text-slate-500">Subtotal: ${selectedSale.subtotal?.toFixed(2)}</div>
              {selectedSale.discountTotal > 0 && (
                <div className="text-slate-500">Discount: -${selectedSale.discountTotal?.toFixed(2)}</div>
              )}
              {selectedSale.taxTotal > 0 && (
                <div className="text-slate-500">Tax: ${selectedSale.taxTotal?.toFixed(2)}</div>
              )}
              <div className="text-sm font-bold text-slate-900 pt-1">
                Grand Total: <span className="text-brand-600">${selectedSale.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="text-xs text-slate-500">
                Amount Paid: ${selectedSale.amountPaid?.toFixed(2)} | Balance Due: ${selectedSale.amountDue?.toFixed(2)}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedSale(null);
                  handlePrintClick(selectedSale);
                }}
                className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Daabac Rasiidhka / Invoice-ka
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModalSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleReturnSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Process Sales Return</h3>
              <button type="button" onClick={() => setReturnModalSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-3">
              Invoice <strong>{returnModalSale.invoiceNumber}</strong>. Enter quantity being returned to restock inventory and credit refund.
            </p>

            <div className="space-y-2 mb-4">
              {returnModalSale.items.map((item, idx) => {
                const prodId = item.product?._id || item.product;
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-500">Purchased: {item.quantity} @ ${item.unitPrice.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Return:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnQty[prodId] || 0}
                        onChange={(e) =>
                          setReturnQty({ ...returnQty, [prodId]: Math.min(item.quantity, Number(e.target.value)) })
                        }
                        className="w-16 p-1 text-center border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="CASH">Cash Refund</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT">Credit Customer Debt Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Return</label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
            >
              Confirm Return & Restock Inventory
            </button>
          </form>
        </div>
      )}

      {/* Printable Invoice & Receipt Modal */}
      {printingSale && (
        <PrintableInvoiceModal
          sale={printingSale}
          settings={settings}
          onClose={() => setPrintingSale(null)}
        />
      )}
    </div>
  );
}

