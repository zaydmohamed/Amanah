import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Truck,
  Users,
  Building2,
  UserCheck,
  CreditCard,
  Wallet,
  PiggyBank,
  BookOpen,
  PieChart,
  Settings,
  ShieldCheck,
  CircleDollarSign,
} from 'lucide-react';

export default function Sidebar() {
  const { hasRole } = useAuth();

  const navSections = [
    {
      title: 'Point of Sale & Inventory',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER'] },
        { name: 'POS Terminal', path: '/pos', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER'] },
        { name: 'Sales Invoices', path: '/sales', icon: Receipt, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER'] },
        { name: 'Products Catalog', path: '/products', icon: Package, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER'] },
        { name: 'Stock & Movements', path: '/inventory', icon: Boxes, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'] },
        { name: 'Purchases & Receiving', path: '/purchases', icon: Truck, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'Counterparties & Debts',
      items: [
        { name: 'Customers & Debts', path: '/customers', icon: Users, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT', 'CASHIER'] },
        { name: 'Suppliers & Payables', path: '/suppliers', icon: Building2, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'Staff & Operations',
      items: [
        { name: 'Staff & Attendance', path: '/employees', icon: UserCheck, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'] },
        { name: 'Operating Expenses', path: '/expenses', icon: CreditCard, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'] },
        { name: 'Cash Register & Shifts', path: '/cash-register', icon: Wallet, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER'] },
        { name: 'Owner Equity & Drawings', path: '/owner-equity', icon: PiggyBank, roles: ['SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'Accounting & Reports',
      items: [
        { name: 'General Ledger & COA', path: '/accounting', icon: BookOpen, roles: ['SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'] },
        { name: 'Financial Statements', path: '/reports', icon: PieChart, roles: ['SUPER_ADMIN', 'OWNER', 'ACCOUNTANT'] },
        { name: 'Store Settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'OWNER'] },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">
          <CircleDollarSign className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white text-sm tracking-wide">AMANAH POS</div>
          <div className="text-[10px] text-slate-400 font-mono">FINANCIAL CORE 2.0</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => hasRole(...item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Accounting: Balanced</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
      </div>
    </aside>
  );
}

