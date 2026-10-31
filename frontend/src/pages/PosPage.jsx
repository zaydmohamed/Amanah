import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  DollarSign,
  Smartphone,
  CheckCircle,
  Printer,
  X,
  AlertCircle,
} from 'lucide-react';

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0.05); // 5% default

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const barcodeRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories/all'),
        api.get('/customers'),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  // Barcode scanner auto-enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product matching barcode / SKU: ${barcodeInput}`);
    }
  };

  const addToCart = (product) => {
    if (product.currentStock <= 0) {
      alert(`Product "${product.name}" is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          alert(`Cannot add more than available stock (${product.currentStock})`);
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.sellingPrice }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.currentStock) {
              alert(`Maximum available stock is ${item.product.currentStock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxableAmount = Math.max(0, subtotal - Number(discountTotal || 0));
  const taxTotal = Math.round(taxableAmount * Number(taxRate || 0) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + taxTotal) * 100) / 100;
  const changeDue = Math.max(0, (Number(cashTendered || 0) - grandTotal)).toFixed(2);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category?._id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  const handleCheckout = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        customerId: selectedCustomer ? selectedCustomer._id : null,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        customerPhone: selectedCustomer ? selectedCustomer.phone : '',
        items: cart.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discountTotal: Number(discountTotal || 0),
        taxRate: Number(taxRate || 0),
        paymentMethod,
        payments: [
          {
            method: paymentMethod === 'CREDIT' ? 'CREDIT' : paymentMethod,
            amount: paymentMethod === 'CREDIT' ? 0 : grandTotal,
          },
        ],
      };

      const res = await api.post('/sales', payload);
      setCompletedSale(res.data);
      setIsCheckoutOpen(false);
      setCart([]);
      setDiscountTotal(0);
      setSelectedCustomer(null);
      setCashTendered('');
      // Reload products to update current stock
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const printReceipt = (saleId) => {
    window.open(`/api/sales/${saleId}/receipt`, '_blank');
  };

  return (
    <div className="min-h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-4 pb-12 lg:pb-0">
      {/* Left side: Product catalog and search */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[450px] lg:min-h-0">
        {/* Search and barcode header */}
        <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <Barcode className="w-4 h-4 text-brand-600 absolute left-3 top-2.5" />
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or enter SKU & press Enter..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </form>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c._id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c._id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => (
              <div
                key={p._id}
                onClick={() => addToCart(p)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  p.currentStock <= 0
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-brand-500 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono text-slate-400">{p.sku}</div>
                  <div className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5">{p.name}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-brand-600">${p.sellingPrice.toFixed(2)}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      p.currentStock <= 0
                        ? 'bg-rose-100 text-rose-700'
                        : p.currentStock <= p.minStockLevel
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Stock: {p.currentStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Shopping Cart & Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Customer selection */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/50">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer</label>
          <select
            value={selectedCustomer?._id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c._id === e.target.value);
              setSelectedCustomer(cust || null);
            }}
            className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Walk-in Customer (Cash / Immediate)</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.currentBalance > 0 ? `(Debt: $${c.currentBalance.toFixed(2)})` : ''}
              </option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="mt-2 text-[11px] p-2 bg-brand-50/60 rounded border border-brand-100 flex justify-between">
              <span>Credit Limit: <strong>${selectedCustomer.creditLimit}</strong></span>
              <span>Current Balance: <strong className={selectedCustomer.currentBalance > 0 ? 'text-amber-700' : ''}>${selectedCustomer.currentBalance.toFixed(2)}</strong></span>
            </div>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[10px]">Select or scan products to start sale</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product._id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{item.product.name}</div>
                  <div className="text-[10px] text-slate-500">
                    ${item.unitPrice.toFixed(2)} / {item.product.unit}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.product._id, -1)}
                    className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product._id, 1)}
                    className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right w-16">
                  <div className="text-xs font-bold text-slate-900">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.product._id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & checkout button */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Discount ($):</span>
              <input
                type="number"
                min="0"
                value={discountTotal}
                onChange={(e) => setDiscountTotal(e.target.value)}
                className="w-20 text-right px-1.5 py-0.5 border border-slate-200 rounded text-xs bg-white"
              />
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax (5%):</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Amount:</span>
              <span className="text-brand-600">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => {
              setCashTendered(String(grandTotal));
              setIsCheckoutOpen(true);
            }}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
          >
            Pay ${grandTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Checkout Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Complete Payment</h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="my-4 text-center p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500">Total Invoice Due</span>
              <div className="text-2xl font-black text-slate-900">${grandTotal.toFixed(2)}</div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { id: 'CASH', label: 'Cash', icon: DollarSign },
                { id: 'MOBILE_MONEY', label: 'Mobile', icon: Smartphone },
                { id: 'BANK_TRANSFER', label: 'Bank', icon: CreditCard },
                { id: 'CREDIT', label: 'On Credit', icon: User },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === m.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash details if CASH selected */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cash Tendered ($)</label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex gap-2">
                  {[5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(String(amt))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold text-slate-700"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between text-xs font-semibold text-emerald-800">
                  <span>Change to Return:</span>
                  <span>${changeDue}</span>
                </div>
              </div>
            )}

            {paymentMethod === 'CREDIT' && !selectedCustomer && (
              <div className="p-2.5 mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
                ⚠️ Credit sales require choosing a registered customer from the cart.
              </div>
            )}

            <button
              disabled={isSubmitting || (paymentMethod === 'CREDIT' && !selectedCustomer)}
              onClick={handleCheckout}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Posting Transaction...' : 'Confirm and Print Receipt'}
            </button>
          </div>
        </div>
      )}

      {/* Sale Success Popup */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sale Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">Invoice: <strong>{completedSale.invoiceNumber}</strong></p>
            <p className="text-xl font-black text-brand-600 mt-2">${completedSale.totalAmount?.toFixed(2)}</p>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => printReceipt(completedSale._id)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print PDF Thermal Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Start Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

