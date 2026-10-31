import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, User, LogOut, Clock, DollarSign, Bell } from 'lucide-react';
import api from '../../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data)).catch(() => {});
    api.get('/cash-register/current-shift').then((res) => setCurrentShift(res.data)).catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-tight">
              {settings?.businessName || 'Amanah Retail & Wholesale Mart'}
            </h1>
            <p className="text-xs text-slate-500">
              Double-Entry Retail Management System
            </p>
          </div>
        </div>

        {/* Shift indicator badge */}
        {currentShift ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Shift Active (${currentShift.openingCash?.toFixed(2)} opening)
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> No Active Shift
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Currency rate pill */}
        {settings?.secondaryCurrency && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <DollarSign className="w-3.5 h-3.5 text-brand-600" />
            <span>1 USD = {settings.exchangeRate?.toLocaleString()} {settings.secondaryCurrency}</span>
          </div>
        )}

        {/* User profile and logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-800 leading-tight">{user?.name}</div>
            <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

