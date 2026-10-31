import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Boxes, History, AlertTriangle, DollarSign, PackageCheck } from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('MOVEMENTS'); // 'MOVEMENTS' | 'VALUATION' | 'LOW_STOCK'
  const [movements, setMovements] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'MOVEMENTS') {
        const res = await api.get('/products/movements/history');
        setMovements(res.data || []);
      } else if (activeTab === 'VALUATION') {
        const res = await api.get('/products/reports/valuation');
        setValuation(res.data || null);
      } else if (activeTab === 'LOW_STOCK') {
        const res = await api.get('/products/alerts/low-stock');
        setLowStock(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Inventory & Stock Movement Ledger</h2>
        <p className="text-xs text-slate-500">
          Auditable stock movements, physical counts, and Weighted Average Cost valuations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        {[
          { id: 'MOVEMENTS', label: 'Stock Movements Ledger', icon: History },
          { id: 'VALUATION', label: 'Valuation & Margin Report', icon: DollarSign },
          { id: 'LOW_STOCK', label: 'Low Stock Alerts', icon: AlertTriangle },
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

      {/* Tab 1: Movements Ledger */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Qty In</th>
                  <th className="py-3 px-4 text-center">Qty Out</th>
                  <th className="py-3 px-4 text-center">Resulting Stock</th>
                  <th className="py-3 px-4">Ref / Reason</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-400">Loading movements...</td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-400">No inventory movements recorded</td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500">{new Date(m.date).toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {m.product?.name} <span className="text-[10px] text-slate-400">({m.product?.sku})</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.movementType.includes('RECEIVE') || m.movementType.includes('RETURN') && m.quantityIn > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.movementType === 'SALE'
                              ? 'bg-sky-100 text-sky-800'
                              : m.movementType.includes('DAMAGED')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-emerald-600">
                        {m.quantityIn > 0 ? `+${m.quantityIn}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-rose-600">
                        {m.quantityOut > 0 ? `-${m.quantityOut}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-800">
                        {m.resultingStock}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                        {m.referenceNumber ? `[${m.referenceNumber}] ` : ''}{m.reason}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{m.user?.name || 'System'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Valuation Report */}
      {activeTab === 'VALUATION' && valuation && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Total Active Items</span>
              <div className="text-2xl font-bold text-slate-900">{valuation.totalItemsCount}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Total Physical Units</span>
              <div className="text-2xl font-bold text-slate-900">{valuation.totalStockQuantity}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Asset Valuation (Cost Basis)</span>
              <div className="text-2xl font-bold text-brand-600">${valuation.totalInventoryValue?.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Est. Potential Sales Value</span>
              <div className="text-2xl font-bold text-emerald-600">${valuation.totalPotentialSalesValue?.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Current Qty</th>
                    <th className="py-3 px-4 text-right">Avg Unit Cost</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Inventory Value</th>
                    <th className="py-3 px-4 text-right">Gross Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {valuation.products?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{p.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{p.category}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-900">{p.currentStock} {p.unit}</td>
                      <td className="py-2.5 px-4 text-right font-mono">${p.purchaseCost.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">${p.sellingPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-brand-600">${p.valuation.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-emerald-600">{p.marginPercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Low Stock Alerts */}
      {activeTab === 'LOW_STOCK' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Min Threshold</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-emerald-600 font-medium">
                      ✓ All products are comfortably stocked above their minimum threshold.
                    </td>
                  </tr>
                ) : (
                  lowStock.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{p.sku}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{p.name}</td>
                      <td className="py-2.5 px-4 text-slate-500">{p.category?.name || 'Uncategorized'}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-rose-600">{p.currentStock} {p.unit}</td>
                      <td className="py-2.5 px-4 text-center text-slate-600">{p.minStockLevel} {p.unit}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          {p.currentStock <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

