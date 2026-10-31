import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Package, Plus, Search, Edit2, Sliders, AlertTriangle, X } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  // Category Form
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    unit: 'pcs',
    purchaseCost: '',
    sellingPrice: '',
    initialStock: '0',
    minStockLevel: '5',
  });

  const [adjustData, setAdjustData] = useState({
    adjustmentType: 'INCREASE',
    quantity: '1',
    reason: 'Physical count adjustment',
  });

  useEffect(() => {
    fetchProducts();
    api.get('/products/categories/all').then((res) => setCategories(res.data || [])).catch(() => {});
  }, [search, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/products?search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      const res = await api.get(url);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsAddOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(`Error saving product: ${err.message}`);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    try {
      await api.post(`/products/${adjustingProduct._id}/adjust-stock`, adjustData);
      alert('Stock successfully adjusted and inventory movement recorded.');
      setAdjustingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(`Adjustment error: ${err.message}`);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/products/categories', categoryFormData);
      alert('Category successfully created!');
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: '', code: '', description: '' });
      // Reload categories
      const catRes = await api.get('/products/categories/all');
      setCategories(catRes.data || []);
      // Auto-select in product form if add product is open
      if (res.data?._id) {
        setFormData((prev) => ({ ...prev, category: res.data._id }));
      }
    } catch (err) {
      alert(`Error creating category: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: categories[0]?._id || '',
      unit: 'pcs',
      purchaseCost: '',
      sellingPrice: '',
      initialStock: '0',
      minStockLevel: '5',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Products & Inventory Catalog</h2>
          <p className="text-xs text-slate-500">
            Catalog items, pricing rules, moving average costs, and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Abuur Category (Add Category)
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost (AVCO)</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">No products found</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-mono font-bold text-slate-800">{p.sku}</div>
                      {p.barcode && <div className="text-[10px] text-slate-400 font-mono">{p.barcode}</div>}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{p.name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{p.category?.name || 'Uncategorized'}</td>
                    <td className="py-2.5 px-4 text-right text-slate-600 font-mono">${p.purchaseCost.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-brand-600 font-mono">${p.sellingPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.currentStock <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : p.currentStock <= p.minStockLevel
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.currentStock <= p.minStockLevel && <AlertTriangle className="w-2.5 h-2.5" />}
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setAdjustingProduct(p);
                          setAdjustData({ adjustmentType: 'INCREASE', quantity: '1', reason: 'Count adjustment' });
                        }}
                        title="Reconcile / Adjust Stock"
                        className="p-1.5 hover:bg-slate-100 rounded text-amber-600 font-medium"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setFormData({
                            name: p.name,
                            sku: p.sku,
                            barcode: p.barcode || '',
                            category: p.category?._id || '',
                            unit: p.unit,
                            purchaseCost: p.purchaseCost,
                            sellingPrice: p.sellingPrice,
                            minStockLevel: p.minStockLevel,
                          });
                          setIsAddOpen(true);
                        }}
                        title="Edit Product"
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleProductSubmit} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Basmati Rice 25kg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
                <input
                  type="text"
                  required
                  disabled={!!editingProduct}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
                  placeholder="e.g. RIC-BAS-25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
                  placeholder="Scan or leave empty"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    + Abuur Category Cusub
                  </button>
                </div>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="pcs, kg, box, bag"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.purchaseCost}
                  onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="0.00"
                />
              </div>

              {!editingProduct && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Stock Qty</label>
                  <input
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                    placeholder="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Alert Level</label>
                <input
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAdjustSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Adjust Physical Stock</h3>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 my-3 bg-slate-50 rounded-lg text-xs">
              <div className="font-bold text-slate-800">{adjustingProduct.name}</div>
              <div className="text-slate-500">Current Stock: <strong>{adjustingProduct.currentStock} {adjustingProduct.unit}</strong></div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Action</label>
                <select
                  value={adjustData.adjustmentType}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustmentType: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="INCREASE">Count Surplus (Increase Stock)</option>
                  <option value="DECREASE">Count Shortage (Decrease Stock)</option>
                  <option value="DAMAGED_WRITE_OFF">Damaged / Expired Write-Off (COGS Loss)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Audit Reason</label>
                <input
                  type="text"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Physical stock count reconciliation"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
            >
              Post Stock Adjustment
            </button>
          </form>
        </div>
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCategorySubmit} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Abuur Category Cusub</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Magaca Category-ga (Category Name)</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="tusaale: Cabitaanno, Cuntooyin, Qalab..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Koodhka (Category Code)</label>
                <input
                  type="text"
                  value={categoryFormData.code}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, code: e.target.value.toUpperCase() })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono uppercase"
                  placeholder="tusaale: BEV, GRO, ELEC"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faahfaahin (Description)</label>
                <input
                  type="text"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="Faahfaahin kooban..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Keydi Category-ga (Save Category)
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

