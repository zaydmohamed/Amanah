import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import PurchasesPage from './pages/PurchasesPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import EmployeesPage from './pages/EmployeesPage';
import ExpensesPage from './pages/ExpensesPage';
import OwnerEquityPage from './pages/OwnerEquityPage';
import CashRegisterPage from './pages/CashRegisterPage';
import AccountingPage from './pages/AccountingPage';
import FinancialReportsPage from './pages/FinancialReportsPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        Initializing Amanah POS Engine...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="pos" element={<PosPage />} />
            <Route path="sales" element={<SalesHistoryPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="owner-equity" element={<OwnerEquityPage />} />
            <Route path="cash-register" element={<CashRegisterPage />} />
            <Route path="accounting" element={<AccountingPage />} />
            <Route path="reports" element={<FinancialReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

