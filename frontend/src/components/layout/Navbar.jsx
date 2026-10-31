import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, LogOut, Clock, DollarSign, Menu } from 'lucide-react';
import api from '../../api/client';

export default function Navbar({ onToggleMobileSidebar }) {
  const { user, logout } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data)).catch(() => {});
    api.get('/cash-register/current-shift').then((res) => setCurrentShift(res.data)).catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm font-bold shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 max-w-[140px] sm:max-w-xs md:max-w-md">
            <h1 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight truncate">
              {settings?.businessName || 'Amanah Retail Mart'}
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">
              Retail POS & Accounting
            </p>
          </div>
        </div>

        {/* Shift indicator badge */}
        {currentShift ? (
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Shift Active (${currentShift.openingCash?.toFixed(2)})
          </span>
        ) : (
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <Clock className="w-3 h-3" /> No Active Shift
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Currency rate pill */}
        {settings?.secondaryCurrency && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
            <DollarSign className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>1 USD = {settings.exchangeRate?.toLocaleString()} {settings.secondaryCurrency}</span>
          </div>
        )}

        {/* User profile and logout */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs sm:text-sm font-medium text-slate-800 leading-tight truncate max-w-[120px]">
              {user?.name}
            </div>
            <div className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">
              {user?.role}
            </div>
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
