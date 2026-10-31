import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Truck, Plus, PackageCheck, RotateCcw, X, Eye } from 'lucide-react';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receivingPurchase, setReceivingPurchase] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);

  // New PO state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [additionalCosts, setAdditionalCosts] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  const [amountPaid, setAmountPaid] = useState('0');
  const [poNotes, setPoNotes] = useState('');

  useEffect(() => {
    fetchPurchases();
    api.get('/suppliers').then((res) => setSuppliers(res.data || [])).catch(() => {});
    api.get('/products').then((res) => setProducts(res.data || [])).catch(() => {});
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchases');
      setPurchases(res.data || []);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (productId) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;
    if (poItems.some((i) => i.productId === productId)) return;

    setPoItems([
      ...poItems,
      {
        productId: prod._id,
        name: prod.name,
        sku: prod.sku,
        orderedQuantity: 10,
        unitCost: prod.purchaseCost,
      },
    ]);
  };

  const updateItem = (productId, field, val) => {
    setPoItems(
      poItems.map((i) => (i.productId === productId ? { ...i, [field]: Number(val) } : i))
    );
  };

  const removeItem = (productId) => {
    setPoItems(poItems.filter((i) => i.productId !== productId));
  };

  const poSubtotal = poItems.reduce((sum, item) => sum + item.orderedQuantity * item.unitCost, 0);
  const poTotal = poSubtotal + Number(additionalCosts || 0);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      await api.post('/purchases', {
        supplierId: selectedSupplier,
        items: poItems,
        additionalCosts: Number(additionalCosts || 0),
        paymentMethod,
        amountPaid: Number(amountPaid || 0),
        notes: poNotes,
      });

      alert('Purchase order created! Note: Physical stock is updated upon receiving goods.');
      setIsCreateOpen(false);
      setPoItems([]);
      fetchPurchases();
    } catch (err) {
      alert(`PO creation error: ${err.message}`);
    }
  };

  const handleReceiveConfirm = async () => {
    if (!receivingPurchase) return;
    try {
      await api.post(`/purchases/${receivingPurchase._id}/receive`, {
        receivedItems: receivingPurchase.items.map((i) => ({
          productId: i.product?._id || i.product,
          receivedQuantity: i.orderedQuantity,
        })),
      });

      alert('Goods received! Inventory stock updated and Accounts Payable ledger posted.');
      setReceivingPurchase(null);
      fetchPurchases();
    } catch (err) {
      alert(`Receiving error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Purchases & Goods Receiving</h2>
          <p className="text-xs text-slate-500">
            Supplier purchase orders, merchandise receiving, freight allocation, and payables.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSupplier(suppliers[0]?._id || '');
            setPoItems([]);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Purchase Order
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Amount Due</th>
                <th className="py-3 px-4 text-center">Receiving Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">Loading purchase orders...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">No purchase orders found</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{p.purchaseNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{p.supplier?.name}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">${p.totalAmount.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">${p.amountPaid.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-700">${p.amountDue.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'RECEIVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setViewingPurchase(p)}
                        title="View Details"
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {p.status === 'ORDERED' && (
                        <button
                          onClick={() => setReceivingPurchase(p)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                        >
                          Receive Goods
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

      {/* Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSubmit} className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Create Supplier Purchase Order</h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                <select
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Product Item</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleAddItem(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select item to add...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) - ${p.purchaseCost.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Table in PO */}
            <div className="border border-slate-100 rounded-lg overflow-hidden my-3 max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3 w-24">Qty</th>
                    <th className="py-2 px-3 w-28 text-right">Unit Cost ($)</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-slate-400">No items added to order</td>
                    </tr>
                  ) : (
                    poItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={item.orderedQuantity}
                            onChange={(e) => updateItem(item.productId, 'orderedQuantity', e.target.value)}
                            className="w-20 p-1 border border-slate-200 rounded text-center text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => updateItem(item.productId, 'unitCost', e.target.value)}
                            className="w-24 p-1 border border-slate-200 rounded text-right text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ${(item.orderedQuantity * item.unitCost).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-3 my-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Freight / Direct Costs ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={additionalCosts}
                  onChange={(e) => setAdditionalCosts(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Policy</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="CREDIT">On Credit (Accounts Payable)</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK_TRANSFER">Bank Wire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upfront Amount Paid ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg mb-4 text-xs font-bold text-slate-900">
              <span>Total Purchase Valuation:</span>
              <span className="text-base text-brand-600">${poTotal.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Issue Purchase Order
            </button>
          </form>
        </div>
      )}

      {/* Receive Goods Confirmation Modal */}
      {receivingPurchase && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base">Receive Merchandise into Inventory</h3>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              PO: <strong>{receivingPurchase.purchaseNumber}</strong> from <strong>{receivingPurchase.supplier?.name}</strong>.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 mb-4">
              <div>Total Order Amount: <strong>${receivingPurchase.totalAmount.toFixed(2)}</strong></div>
              <div>Upfront Paid: <strong>${receivingPurchase.amountPaid.toFixed(2)}</strong></div>
              <div>Debt to be added to Supplier: <strong className="text-amber-700">${receivingPurchase.amountDue.toFixed(2)}</strong></div>
              <div className="text-[11px] text-slate-500 pt-1">
                Note: Receiving will automatically update inventory on hand and recalculate moving weighted average unit cost.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setReceivingPurchase(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReceiveConfirm}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
              >
                Confirm Goods Received
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

