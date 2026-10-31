import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Settings, ShieldCheck, DollarSign, Receipt, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('STORE'); // 'STORE' | 'AUDIT_LOGS'
  const [settings, setSettings] = useState({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: '',
    taxRate: 0.05,
    baseCurrency: 'USD',
    secondaryCurrency: 'SOS',
    exchangeRate: 26000,
    receiptHeader: '',
    receiptFooter: '',
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    if (activeTab === 'AUDIT_LOGS') {
      api.get('/dashboard/audit-logs').then((res) => setAuditLogs(res.data || [])).catch(() => {});
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', {
        ...settings,
        taxRate: Number(settings.taxRate),
        exchangeRate: Number(settings.exchangeRate),
      });
      alert('Store settings successfully updated!');
    } catch (err) {
      alert(`Error updating settings: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Store Settings & Governance</h2>
        <p className="text-xs text-slate-500">
          Configure business details, tax rates, multi-currency exchange rates, and view immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        {[
          { id: 'STORE', label: 'Store & Currency Configuration', icon: Settings },
          { id: 'AUDIT_LOGS', label: 'System Audit Logs & Governance', icon: ShieldCheck },
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

      {activeTab === 'STORE' && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Registration Number</label>
              <input
                type="text"
                value={settings.taxNumber}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Sales Tax Rate (0.05 = 5%)</label>
              <input
                type="number"
                step="0.01"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Currency</label>
              <input
                type="text"
                disabled
                value={settings.baseCurrency}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Currency</label>
              <input
                type="text"
                value={settings.secondaryCurrency}
                onChange={(e) => setSettings({ ...settings, secondaryCurrency: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Spot Exchange Rate (1 {settings.baseCurrency} = ? {settings.secondaryCurrency})
              </label>
              <input
                type="number"
                value={settings.exchangeRate}
                onChange={(e) => setSettings({ ...settings, exchangeRate: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">POS Receipt Footer Message</label>
              <input
                type="text"
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>

          <div className="pt-6 border-t border-slate-200 mt-6">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <h4 className="text-xs font-bold text-rose-800">Khatarta / Danger Zone: Tirtir Xogta Dhan</h4>
              <p className="text-[11px] text-rose-600 mt-0.5 mb-3">
                Tani waxay tirtiraysaa dhammaan iibka, alaabta, iibsiyada, deynta, shaqaalaha, iyo kharashyada adiga oo ku reebaya nidaam cusub oo nadiif ah.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const confirmed = window.confirm(
                    'Ma hubtaa inaad tirtirto dhammaan xogta nidaamka? Talaabadan dib looma noqon karo!'
                  );
                  if (confirmed) {
                    try {
                      const res = await api.post('/settings/reset-database');
                      alert(res.message || 'Xogta oo dhan waa la tirtiray!');
                      window.location.reload();
                    } catch (err) {
                      alert(`Khalad: ${err.message}`);
                    }
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Tirtir Xogta Dhan (Clear All Data)
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 font-sans">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 font-sans">No audit records found</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500 font-sans">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 font-sans">{log.username}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {log.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-brand-600">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
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

