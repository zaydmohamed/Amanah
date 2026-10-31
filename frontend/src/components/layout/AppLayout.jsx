import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Sidebar for both desktop & mobile drawer */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
