import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Building2,
  AlertTriangle,
  Wallet,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/metrics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const { cards, charts, recent } = data;
  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Banner with Alert notices if low stock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Executive Financial Dashboard</h2>
          <p className="text-xs text-slate-500">
            Real-time business performance, inventory valuation, and double-entry reconciliations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cards.lowStockProducts > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              {cards.lowStockProducts} Low Stock Items
            </span>
          )}
          {cards.unpaidSalaries > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <Users className="w-3.5 h-3.5" />
              ${cards.unpaidSalaries.toFixed(2)} Accrued Salaries
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Today's Total Sales</span>
            <DollarSign className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${cards.todaySales?.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Gross Profit: </span>
            <span className="font-semibold text-emerald-600">${cards.todayGrossProfit?.toFixed(2)}</span>
          </div>
        </div>

        {/* Today's Cash Collections */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Today's Cash Collected</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${cards.todayTotalCashCollections?.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sales cash + customer debt payments
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Monthly Net Profit</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div className={`text-2xl font-bold ${cards.monthlyNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${cards.monthlyNetProfit?.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            From ${cards.monthlySales?.toFixed(2)} Net Sales
          </div>
        </div>

        {/* Total Inventory Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Inventory Valuation (AVCO)</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${cards.totalInventoryValue?.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Asset account (1300) cost basis
          </div>
        </div>

        {/* Liquid Balances */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium mb-1">Liquid Cash Accounts</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Cash on Hand:</span>
              <span className="font-bold text-slate-800">${cards.cashInHand?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Account:</span>
              <span className="font-bold text-slate-800">${cards.bankBalances?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mobile Money:</span>
              <span className="font-bold text-slate-800">${cards.mobileMoneyBalances?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Receivables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Customer Receivables</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${cards.totalCustomerReceivables?.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total outstanding credit debt owed to store
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Supplier Payables</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${cards.totalSupplierPayables?.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Accounts Payable (2010) owed to vendors
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Monthly Expenses</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">${cards.totalOperatingExpenses?.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Rent, utilities, supplies, and overhead
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Sales & Gross Profit Trends (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailySalesTrends || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Sales ($)" stroke="#0284c7" fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" name="Gross Profit ($)" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category (1 column) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Expenses by Category</h3>
          <div className="h-64 flex items-center justify-center">
            {charts.expenseByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.expenseByCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `$${entry.amount}`}
                  >
                    {charts.expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No expenses recorded this month</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Recent Sales Invoices</h3>
            <span className="text-xs text-slate-500">Last 5 sales</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.sales?.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-brand-600">{s.invoiceNumber}</td>
                    <td className="py-2 px-3">{s.customerName}</td>
                    <td className="py-2 px-3 font-bold">${s.totalAmount.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        s.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Best-Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Top Best-Selling Products</h3>
            <span className="text-xs text-slate-500">By sales volume</span>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {charts.bestSellingProducts?.map((p, idx) => (
                <div key={p._id || idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-800">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">${p.totalRevenue?.toFixed(2)}</span>
                    <span className="text-slate-400 ml-2">({p.totalQuantity} units)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

