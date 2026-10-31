import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Shield, User, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPassword123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white mb-3 shadow-lg shadow-brand-500/30">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Shop Management & Accounting</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise MERN Retail POS & Double-Entry Ledger
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
            Quick-Fill Demo Roles
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin', 'AdminPassword123!')}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors"
            >
              <div className="text-xs font-bold text-slate-800">👑 Super Admin</div>
              <div className="text-[10px] text-slate-500">Full Access</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('accountant', 'AccountantPassword123!')}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors"
            >
              <div className="text-xs font-bold text-slate-800">📊 Accountant</div>
              <div className="text-[10px] text-slate-500">Financial Reports & GL</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('cashier', 'CashierPassword123!')}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors"
            >
              <div className="text-xs font-bold text-slate-800">🛒 Cashier</div>
              <div className="text-[10px] text-slate-500">POS & Sales Only</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('manager', 'ManagerPassword123!')}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors"
            >
              <div className="text-xs font-bold text-slate-800">🏢 Manager</div>
              <div className="text-[10px] text-slate-500">Stock & Purchases</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

