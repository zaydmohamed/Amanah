import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { UserCheck, Plus, Calendar, DollarSign, CheckCircle, Clock, X } from 'lucide-react';

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState('EMPLOYEES'); // 'EMPLOYEES' | 'ATTENDANCE' | 'PAYROLL'
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [isGenPayrollOpen, setIsGenPayrollOpen] = useState(false);
  const [disbursingPayroll, setDisbursingPayroll] = useState(null);

  // Forms
  const [newEmp, setNewEmp] = useState({
    fullName: '',
    phone: '',
    email: '',
    jobTitle: '',
    department: 'Retail Sales',
    salaryType: 'MONTHLY',
    baseSalary: '400',
  });

  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'EMPLOYEES') {
        const res = await api.get('/employees');
        setEmployees(res.data || []);
      } else if (activeTab === 'ATTENDANCE') {
        const res = await api.get('/employees/attendance');
        setAttendance(res.data || []);
      } else if (activeTab === 'PAYROLL') {
        const res = await api.get('/employees/payrolls');
        setPayrolls(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', { ...newEmp, baseSalary: Number(newEmp.baseSalary) });
      setIsAddEmpOpen(false);
      setNewEmp({ fullName: '', phone: '', email: '', jobTitle: '', department: 'Retail Sales', salaryType: 'MONTHLY', baseSalary: '400' });
      loadData();
    } catch (err) {
      alert(`Error adding employee: ${err.message}`);
    }
  };

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees/payrolls/generate', { payrollMonth });
      alert(`Payroll generated and accrued for ${payrollMonth}! Salaries Expense and Salaries Payable recognized.`);
      setIsGenPayrollOpen(false);
      loadData();
    } catch (err) {
      alert(`Payroll error: ${err.message}`);
    }
  };

  const handleDisburseConfirm = async (paymentMethod) => {
    if (!disbursingPayroll) return;
    try {
      await api.post(`/employees/payrolls/${disbursingPayroll._id}/disburse`, {
        amount: disbursingPayroll.amountDue,
        paymentMethod,
      });
      alert('Salary disbursed! Liability settled and bank/cash account credited.');
      setDisbursingPayroll(null);
      loadData();
    } catch (err) {
      alert(`Disbursement error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Human Resources & Monthly Payroll</h2>
          <p className="text-xs text-slate-500">
            Staff directory, attendance records, monthly payroll accruals, and salary payments.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'EMPLOYEES' && (
            <button
              onClick={() => setIsAddEmpOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          )}
          {activeTab === 'PAYROLL' && (
            <button
              onClick={() => setIsGenPayrollOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Run Monthly Payroll
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        {[
          { id: 'EMPLOYEES', label: 'Employee Profiles', icon: UserCheck },
          { id: 'PAYROLL', label: 'Monthly Payroll Ledger', icon: DollarSign },
          { id: 'ATTENDANCE', label: 'Daily Attendance', icon: Calendar },
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

      {/* Tab 1: Employees List */}
      {activeTab === 'EMPLOYEES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Base Salary</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{e.employeeId}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{e.fullName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{e.jobTitle}</td>
                    <td className="py-2.5 px-4 text-slate-500">{e.department}</td>
                    <td className="py-2.5 px-4 text-slate-500">{e.phone || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">${e.baseSalary?.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {e.employmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payroll */}
      {activeTab === 'PAYROLL' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4 text-right">Base Salary</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Unpaid Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{p.payrollMonth}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{p.employeeName}</td>
                    <td className="py-2.5 px-4 text-right font-mono">${p.baseSalary?.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">${p.netSalary?.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-600">${p.amountPaid?.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">${p.amountDue?.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {p.amountDue > 0 && (
                        <button
                          onClick={() => setDisbursingPayroll(p)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs"
                        >
                          Disburse Salary
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Overtime Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">No attendance entries recorded yet</td>
                  </tr>
                ) : (
                  attendance.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{a.employee?.fullName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{a.employee?.department}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-slate-700">{a.overtimeHours} hrs</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddEmpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleAddEmployee} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Add Employee Profile</h3>
              <button type="button" onClick={() => setIsAddEmpOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newEmp.fullName}
                  onChange={(e) => setNewEmp({ ...newEmp, fullName: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newEmp.jobTitle}
                  onChange={(e) => setNewEmp({ ...newEmp, jobTitle: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  placeholder="POS Cashier, Inventory Clerk, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newEmp.department}
                  onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Base Salary ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newEmp.baseSalary}
                  onChange={(e) => setNewEmp({ ...newEmp, baseSalary: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newEmp.phone}
                  onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
            >
              Save Employee Profile
            </button>
          </form>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {isGenPayrollOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleGeneratePayroll} className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base">Generate Monthly Payroll</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Recognizes monthly salary expenses on accrual basis: DR Salaries Expense / CR Salaries Payable.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Month (YYYY-MM)</label>
              <input
                type="month"
                required
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsGenPayrollOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
              >
                Accrue Payroll
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disburse Salary Modal */}
      {disbursingPayroll && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base">Disburse Salary Payment</h3>
            <div className="p-3 my-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div>Employee: <strong>{disbursingPayroll.employeeName}</strong></div>
              <div>Period: <strong>{disbursingPayroll.payrollMonth}</strong></div>
              <div>Amount Due: <strong className="text-emerald-700 font-bold">${disbursingPayroll.amountDue.toFixed(2)}</strong></div>
            </div>

            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleDisburseConfirm('BANK_TRANSFER')}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs"
              >
                Disburse via Bank Wire (1020)
              </button>
              <button
                onClick={() => handleDisburseConfirm('CASH')}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
              >
                Disburse from Cash Drawer (1010)
              </button>
              <button
                onClick={() => handleDisburseConfirm('MOBILE_MONEY')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
              >
                Disburse via Mobile Money (1030)
              </button>
            </div>

            <button
              onClick={() => setDisbursingPayroll(null)}
              className="w-full py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

