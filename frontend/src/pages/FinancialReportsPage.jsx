import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { PieChart, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export default function FinancialReportsPage() {
  const [reportType, setReportType] = useState('PNL'); // 'PNL' | 'BALANCE_SHEET' | 'CASH_FLOW'
  const [pnlData, setPnlData] = useState(null);
  const [bsData, setBsData] = useState(null);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'PNL') {
        const res = await api.get('/accounting/profit-and-loss');
        setPnlData(res.data);
      } else if (reportType === 'BALANCE_SHEET') {
        const res = await api.get('/accounting/balance-sheet');
        setBsData(res.data);
      } else if (reportType === 'CASH_FLOW') {
        const res = await api.get('/accounting/cash-flow');
        setCashFlowData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (reportType === 'PNL') {
      window.open('/api/accounting/profit-and-loss?format=excel', '_blank');
    } else if (reportType === 'BALANCE_SHEET') {
      window.open('/api/accounting/balance-sheet?format=excel', '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Financial Statements & Accounting Reports</h2>
          <p className="text-xs text-slate-500">
            Authoritative financial statements computed directly from the posted general ledger.
          </p>
        </div>

        <button
          onClick={exportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export to Excel (.xlsx)
        </button>
      </div>

      {/* Report Selector Pills */}
      <div className="flex border-b border-slate-200 gap-4">
        {[
          { id: 'PNL', label: '1. Profit & Loss Statement (P&L)' },
          { id: 'BALANCE_SHEET', label: '2. Balance Sheet (Financial Position)' },
          { id: 'CASH_FLOW', label: '3. Cash Flow Statement (Direct Method)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`pb-2.5 text-xs font-semibold transition-all border-b-2 ${
              reportType === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Profit & Loss Statement */}
      {reportType === 'PNL' && pnlData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl space-y-4">
          <div className="border-b border-slate-100 pb-3 text-center">
            <h3 className="font-bold text-base text-slate-900">PROFIT & LOSS STATEMENT</h3>
            <p className="text-xs text-slate-500">
              Period: {new Date(pnlData.period.start).toLocaleDateString()} to {new Date(pnlData.period.end).toLocaleDateString()}
            </p>
          </div>

          {/* Revenue */}
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              1. Operating Revenue
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Gross Sales of Goods (4010)</span>
              <span className="font-mono font-medium">${pnlData.revenue.grossSales.toFixed(2)}</span>
            </div>
            {pnlData.revenue.salesReturns > 0 && (
              <div className="flex justify-between py-1 text-rose-600">
                <span>Less: Sales Returns & Allowances (4020)</span>
                <span className="font-mono">-${pnlData.revenue.salesReturns.toFixed(2)}</span>
              </div>
            )}
            {pnlData.revenue.salesDiscounts > 0 && (
              <div className="flex justify-between py-1 text-rose-600">
                <span>Less: Sales Discounts (4030)</span>
                <span className="font-mono">-${pnlData.revenue.salesDiscounts.toFixed(2)}</span>
              </div>
            )}
            {pnlData.revenue.otherIncome > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Other Business Income (4090)</span>
                <span className="font-mono">+${pnlData.revenue.otherIncome.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>NET OPERATING SALES</span>
              <span className="font-mono text-brand-600">${pnlData.revenue.netSales.toFixed(2)}</span>
            </div>
          </div>

          {/* COGS */}
          <div className="space-y-1 text-xs pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              2. Cost of Goods Sold (COGS)
            </div>
            {pnlData.costOfGoodsSold.breakdown.map((c) => (
              <div key={c.code} className="flex justify-between py-1 text-slate-600">
                <span>{c.name} ({c.code})</span>
                <span className="font-mono">${c.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>TOTAL COST OF GOODS SOLD</span>
              <span className="font-mono">${pnlData.costOfGoodsSold.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-xs font-bold text-slate-900">
            <div>
              <span>GROSS PROFIT</span>
              <span className="ml-2 text-slate-500 font-normal">({pnlData.margins.grossMarginPercentage}% Gross Margin)</span>
            </div>
            <span className="text-base text-emerald-600 font-mono">${pnlData.grossProfit.toFixed(2)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-1 text-xs pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              3. Operating Expenses
            </div>
            {pnlData.operatingExpenses.breakdown.map((exp) => (
              <div key={exp.code} className="flex justify-between py-1 text-slate-600">
                <span>{exp.name} ({exp.code})</span>
                <span className="font-mono">${exp.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>TOTAL OPERATING EXPENSES</span>
              <span className="font-mono text-rose-600">${pnlData.operatingExpenses.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Net Profit Summary */}
          <div className="p-4 bg-brand-50/60 border border-brand-200 rounded-xl flex justify-between items-center">
            <div>
              <div className="text-sm font-bold text-slate-900">NET PROFIT / (LOSS)</div>
              <div className="text-xs text-slate-500">Net Profit Margin: <strong>{pnlData.margins.netMarginPercentage}%</strong></div>
            </div>
            <div className={`text-2xl font-black font-mono ${pnlData.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${pnlData.netProfit.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* 2. Balance Sheet */}
      {reportType === 'BALANCE_SHEET' && bsData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl space-y-4">
          <div className="border-b border-slate-100 pb-3 text-center">
            <h3 className="font-bold text-base text-slate-900">BALANCE SHEET STATEMENT</h3>
            <p className="text-xs text-slate-500">
              As of: {new Date(bsData.asOfDate).toLocaleDateString()} | Accrual Accounting Basis
            </p>
          </div>

          {/* Balance validation banner */}
          <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
            bsData.isBalanced ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            <span>Fundamental Accounting Equation: <strong>Assets = Liabilities + Owner Equity</strong></span>
            <span>{bsData.isBalanced ? '✓ Equation Satisfied' : `✗ Difference: $${bsData.difference}`}</span>
          </div>

          {/* Assets */}
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              ASSETS
            </div>
            {bsData.assets.accounts.map((a) => (
              <div key={a.code} className="flex justify-between py-1 text-slate-600">
                <span>{a.name} ({a.code})</span>
                <span className="font-mono font-medium">${a.balance.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>TOTAL ASSETS</span>
              <span className="font-mono text-brand-600 text-sm">${bsData.assets.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Liabilities */}
          <div className="space-y-1 text-xs pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              LIABILITIES
            </div>
            {bsData.liabilities.accounts.map((l) => (
              <div key={l.code} className="flex justify-between py-1 text-slate-600">
                <span>{l.name} ({l.code})</span>
                <span className="font-mono font-medium">${l.balance.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>TOTAL LIABILITIES</span>
              <span className="font-mono text-rose-600 text-sm">${bsData.liabilities.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Owner Equity */}
          <div className="space-y-1 text-xs pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              OWNER EQUITY
            </div>
            {bsData.equity.accounts.map((eq) => (
              <div key={eq.code} className="flex justify-between py-1 text-slate-600">
                <span>{eq.name} {eq.code !== 'NET_PROFIT' ? `(${eq.code})` : ''}</span>
                <span className="font-mono font-medium">${eq.balance.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>TOTAL OWNER EQUITY</span>
              <span className="font-mono text-emerald-600 text-sm">${bsData.equity.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Bottom Total Verification */}
          <div className="p-3 bg-slate-100 rounded-lg flex justify-between items-center text-xs font-bold text-slate-900">
            <span>TOTAL LIABILITIES & OWNER EQUITY</span>
            <span className="text-base font-mono">${bsData.totalLiabilitiesAndEquity.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* 3. Cash Flow Statement */}
      {reportType === 'CASH_FLOW' && cashFlowData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl space-y-4">
          <div className="border-b border-slate-100 pb-3 text-center">
            <h3 className="font-bold text-base text-slate-900">CASH FLOW STATEMENT (DIRECT METHOD)</h3>
            <p className="text-xs text-slate-500">
              Actual Cash & Cash Equivalents Inflows and Outflows
            </p>
          </div>

          {/* Operating Activities */}
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              1. Cash Flows from Operating Activities
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Cash Collected from Sales</span>
              <span className="font-mono">+${cashFlowData.operatingActivities.cashFromSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Customer Debt Collections</span>
              <span className="font-mono">+${cashFlowData.operatingActivities.customerDebtCollections.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Cash Payments to Suppliers</span>
              <span className="font-mono">-${cashFlowData.operatingActivities.paymentsToSuppliers.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Staff Salaries Paid</span>
              <span className="font-mono">-${cashFlowData.operatingActivities.salariesPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Operating Expenses Paid</span>
              <span className="font-mono">-${cashFlowData.operatingActivities.operatingExpensesPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>NET CASH FROM OPERATING ACTIVITIES</span>
              <span className="font-mono font-bold">${cashFlowData.operatingActivities.netOperatingCashFlow.toFixed(2)}</span>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="space-y-1 text-xs pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              2. Cash Flows from Financing Activities
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Owner Capital Contributions</span>
              <span className="font-mono">+${cashFlowData.financingActivities.ownerCapitalContributions.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600">
              <span>Owner Drawings / Withdrawals</span>
              <span className="font-mono">-${cashFlowData.financingActivities.ownerDrawings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-slate-900 border-t border-slate-100">
              <span>NET CASH FROM FINANCING ACTIVITIES</span>
              <span className="font-mono font-bold">${cashFlowData.financingActivities.netFinancingCashFlow.toFixed(2)}</span>
            </div>
          </div>

          {/* Cash Summary */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Opening Cash & Equivalents:</span>
              <span>${cashFlowData.summary.openingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold">
              <span>Net Change in Cash:</span>
              <span>${cashFlowData.summary.netChangeInCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-brand-600 font-black text-sm pt-2 border-t border-slate-200">
              <span>Closing Cash & Equivalents:</span>
              <span>${cashFlowData.summary.closingCash.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

