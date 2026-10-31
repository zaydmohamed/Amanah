import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Wallet, Clock, ArrowRightLeft, CheckCircle, AlertCircle, X, DollarSign } from 'lucide-react';

export default function CashRegisterPage() {
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftsHistory, setShiftsHistory] = useState([]);
  const [liquidAccounts, setLiquidAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [isTransferModal, setIsTransferModal] = useState(false);

  const [openingCashInput, setOpeningCashInput] = useState('100');
  const [actualClosingInput, setActualClosingInput] = useState('');
  const [transferData, setTransferData] = useState({
    sourceAccountCode: '1010',
    targetAccountCode: '1020',
    amount: '',
    reason: 'Daily cash deposit to bank',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftRes, historyRes, accRes] = await Promise.all([
        api.get('/cash-register/current-shift'),
        api.get('/cash-register/shifts-history'),
        api.get('/cash-register/accounts'),
      ]);
      setCurrentShift(shiftRes.data || null);
      setShiftsHistory(historyRes.data || []);
      setLiquidAccounts(accRes.data || []);
      if (shiftRes.data) {
        setActualClosingInput(String(shiftRes.data.expectedClosingCash || '0'));
      }
    } catch (err) {
      console.error('Failed to load cash register data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/cash-register/open-shift', {
        openingCash: Number(openingCashInput),
      });
      alert('Shift started! Cash drawer is now ready for POS transactions.');
      setIsOpenShiftModal(false);
      loadData();
    } catch (err) {
      alert(`Error starting shift: ${err.message}`);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!currentShift) return;
    try {
      await api.post(`/cash-register/close-shift/${currentShift._id}`, {
        actualClosingCash: Number(actualClosingInput),
      });
      alert('Shift closed! Physical cash drawer count reconciled against expected ledger.');
      setIsCloseShiftModal(false);
      loadData();
    } catch (err) {
      alert(`Error closing shift: ${err.message}`);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash-register/transfer-funds', {
        ...transferData,
        amount: Number(transferData.amount),
      });
      alert('Liquidity transfer posted! Note: Transfers do not create artificial revenue or expenses.');
      setIsTransferModal(false);
      setTransferData({ sourceAccountCode: '1010', targetAccountCode: '1020', amount: '', reason: '' });
      loadData();
    } catch (err) {
      alert(`Transfer failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cash Register & Account Reconciliations</h2>
          <p className="text-xs text-slate-500">
            Cashier shift drawers, physical cash counts, shortages/overages, and inter-account transfers.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsTransferModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer Between Accounts
          </button>
        </div>
      </div>

      {/* Liquid Account Balances Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {liquidAccounts.map((acc) => (
          <div key={acc._id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
              <span>{acc.name} ({acc.code})</span>
              <Wallet className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">${acc.balance?.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{acc.description}</div>
          </div>
        ))}
      </div>

      {/* Active Cashier Shift Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" /> Current Cashier Shift Status
        </h3>

        {currentShift ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-500">Opening Cash</span>
                <div className="text-base font-bold text-slate-900">${currentShift.openingCash?.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Cash Sales</span>
                <div className="text-base font-bold text-emerald-600">+${currentShift.totalCashSales?.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Debt Collections</span>
                <div className="text-base font-bold text-brand-600">+${currentShift.totalDebtCollections?.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Expected in Drawer</span>
                <div className="text-base font-bold text-slate-900 font-mono">${currentShift.expectedClosingCash?.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Shift started at {new Date(currentShift.startTime).toLocaleTimeString()} by <strong>{currentShift.cashierName}</strong>
              </span>
              <button
                onClick={() => {
                  setActualClosingInput(String(currentShift.expectedClosingCash || '0'));
                  setIsCloseShiftModal(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
              >
                Reconcile & Close Shift
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500 mb-3">No active cashier shift is currently open.</p>
            <button
              onClick={() => setIsOpenShiftModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-sm transition-all"
            >
              Start New Cashier Shift
            </button>
          </div>
        )}
      </div>

      {/* Shifts History Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Past Shift Reconciliation Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4 text-right">Opening Cash</th>
                <th className="py-3 px-4 text-right">Cash Inflows</th>
                <th className="py-3 px-4 text-right">Expected Cash</th>
                <th className="py-3 px-4 text-right">Counted Cash</th>
                <th className="py-3 px-4 text-right">Shortage / Overage</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shiftsHistory.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-800">{s.cashierName}</td>
                  <td className="py-2.5 px-4 text-slate-500">{new Date(s.startTime).toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-slate-500">{s.endTime ? new Date(s.endTime).toLocaleTimeString() : '-'}</td>
                  <td className="py-2.5 px-4 text-right font-mono">${s.openingCash?.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-600">
                    +${((s.totalCashSales || 0) + (s.totalDebtCollections || 0)).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">${s.expectedClosingCash?.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {s.actualClosingCash !== undefined ? `$${s.actualClosingCash?.toFixed(2)}` : '-'}
                  </td>
                  <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                    (s.shortageOrOverage || 0) < 0
                      ? 'text-rose-600'
                      : (s.shortageOrOverage || 0) > 0
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                  }`}>
                    {s.shortageOrOverage !== undefined ? `$${s.shortageOrOverage?.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleOpenShift} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base">Open Shift Cash Drawer</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Count the physical cash float in your drawer and enter below.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Cash Float ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={openingCashInput}
                onChange={(e) => setOpeningCashInput(e.target.value)}
                className="w-full text-sm p-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
              >
                Start Shift
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCloseShift} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base">Close Shift & Reconcile Cash</h3>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Compare actual physical cash against expected cash inflows.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Opening Cash Float:</span>
                <span>${currentShift.openingCash?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cash Sales:</span>
                <span className="text-emerald-700">+${currentShift.totalCashSales?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Debt Collections:</span>
                <span className="text-brand-700">+${currentShift.totalDebtCollections?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
                <span>Expected Drawer Total:</span>
                <span>${currentShift.expectedClosingCash?.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Counted Cash ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={actualClosingInput}
                onChange={(e) => setActualClosingInput(e.target.value)}
                className="w-full text-base p-2.5 border border-slate-200 rounded-lg font-mono font-bold"
              />
              <div className="text-[11px] mt-1 font-semibold flex justify-between">
                <span>Variance:</span>
                <span className={
                  (Number(actualClosingInput) - currentShift.expectedClosingCash) < 0
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }>
                  ${(Number(actualClosingInput) - currentShift.expectedClosingCash).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCloseShiftModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
              >
                Confirm Closing Count
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inter-Account Transfer Modal */}
      {isTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleTransferSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Transfer Funds Between Accounts</h3>
              <button type="button" onClick={() => setIsTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Source Account</label>
                <select
                  value={transferData.sourceAccountCode}
                  onChange={(e) => setTransferData({ ...transferData, sourceAccountCode: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="1010">Cash on Hand (1010)</option>
                  <option value="1020">Bank Checking Account (1020)</option>
                  <option value="1030">Mobile Money Wallet (1030)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To Destination Account</label>
                <select
                  value={transferData.targetAccountCode}
                  onChange={(e) => setTransferData({ ...transferData, targetAccountCode: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="1020">Bank Checking Account (1020)</option>
                  <option value="1010">Cash on Hand (1010)</option>
                  <option value="1030">Mobile Money Wallet (1030)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Reference</label>
                <input
                  type="text"
                  required
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Post Liquidity Transfer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

