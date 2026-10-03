import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';

export default function DashboardLayout() {
  const { sidebarOpen, setSidebarOpen } = useApp();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Subtle National Tricolor Hairline Accent */}
      <div className="fixed top-0 inset-x-0 z-50 h-[3px] bg-gradient-to-r from-orange-500 via-blue-600 to-emerald-500 opacity-90" />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64' : 'md:ml-[68px]'} ml-0 flex min-h-screen flex-col`}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
