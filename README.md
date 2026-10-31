# Amanah - Shop Management System

A comprehensive Enterprise Retail Shop Management & Double-Entry Accounting System built with the MERN stack.

## 🏪 Features

### Core Modules
1. **Sales Management (POS)** - Point of sale with barcode scanning, receipts, and invoice printing
2. **Purchase Management** - Supplier orders, goods receiving, and purchase tracking
3. **Inventory Management** - Moving Average Cost (AVCO), stock movements, adjustments
4. **Customer Debts (Accounts Receivable)** - Credit sales, payment tracking, aging reports
5. **Supplier Debts (Accounts Payable)** - Credit purchases, supplier payments
6. **Employee Management** - Employee records, attendance tracking
7. **Monthly Salary/Payroll** - Two-stage accrual payroll system
8. **Expenses Management** - Operating expense tracking by category
9. **Owner Drawing & Capital** - Owner equity transactions
10. **Profit & Loss Statement** - Revenue, COGS, gross profit, net income
11. **Balance Sheet** - Assets, liabilities, owner's equity
12. **Cash Flow Statement** - Operating, investing, financing activities
13. **Daily & Monthly Reports** - Dashboard with charts and analytics

### Key Features
- 🔐 Role-Based Access Control (Super Admin, Manager, Cashier, Accountant)
- 📊 Double-Entry Accounting with automatic journal entries
- 🧾 Printable invoices and receipts (PDF + direct print)
- 📈 Interactive dashboard with Recharts visualizations
- 📱 Responsive design (desktop, tablet, mobile)
- 🔍 Barcode scanning support
- 📋 Audit trail for sensitive operations
- 💰 Multi-currency display (USD + SOS)

## 🛠️ Tech Stack

### Frontend
- React.js + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- React Hook Form + Zod
- Lucide React Icons

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Joi validation
- PDFKit for report generation
- mongodb-memory-server (auto fallback)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/zaydmohamed/Amanah.git
cd Amanah

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

```bash
# From root directory - start both servers
npm run dev

# Or start individually:
# Backend (port 5000)
cd backend
npm start

# Frontend (port 5173)
cd frontend
npm run dev
```

### Default Login
- **Username:** admin
- **Password:** AdminPassword123!

### Running Tests

```bash
cd backend
npm test
```

### Seed Demo Data

```bash
cd backend
npm run seed
```

## 📁 Project Structure

```
Amanah/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth, audit, error handling
│   │   ├── models/         # Mongoose schemas (15+ models)
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Seed & reset scripts
│   │   └── services/       # Business logic layer
│   ├── tests/              # Automated tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context (Auth)
│   │   ├── pages/          # All page components
│   │   └── App.jsx         # Router setup
│   └── package.json
└── package.json            # Root scripts
```

## 📊 Chart of Accounts

The system automatically initializes 20+ standard accounts:
- **Assets:** Cash (1010), Bank (1020), Mobile Money (1030), Accounts Receivable (1200), Inventory (1300)
- **Liabilities:** Accounts Payable (2010), Salaries Payable (2020), Accrued Expenses (2030)
- **Equity:** Owner Capital (3010), Owner Drawings (3020)
- **Revenue:** Sales (4010), Sales Returns (4020), Sales Discounts (4030)
- **Expenses:** COGS (5010), Rent (6010), Utilities (6020), Salaries Expense (6030), and more

## 📄 License

This project is proprietary software.

## 👤 Author

Zayd Mohamed
