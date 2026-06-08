import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, School, Activity, TrendingUp, Settings, 
  LogOut, Menu, X, ChevronRight, User, Database, DollarSign, Shield, BarChart3,
  Users
} from 'lucide-react';
import { authApi } from '../api';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('owner_user') || '{}');

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore
    }
    localStorage.removeItem('owner_access_token');
    localStorage.removeItem('owner_user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/schools', label: 'Schools', icon: School },
    { path: '/health', label: 'Health Monitor', icon: Activity },
    { path: '/portal-fee', label: 'Portal Fee', icon: Shield },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/owner-analytics', label: 'Advanced Analytics', icon: BarChart3 },
    { path: '/owner-security', label: 'Security Monitor', icon: Shield },
    { path: '/owner-users', label: 'All Users', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/backup', label: 'Data Backup', icon: Database },
    { path: '/owner-activity', label: 'Activity Dashboard', icon: Activity },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D94801] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">EduFlow</h1>
                <p className="text-xs text-gray-400">Owner Control Panel</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D94801] bg-opacity-10 rounded-xl flex items-center justify-center">
                <User size={20} className="text-[#D94801]" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{user.username || 'Admin'}</p>
                <p className="text-xs text-gray-400">Owner / Super Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-[#D94801] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1 font-medium text-sm">{item.label}</span>
                {isActive(item.path) && <ChevronRight size={16} />}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">Logout</span>
            </button>
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">EduFlow v2.0 | Multi-Tenant Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Database size={14} />
                <span>SQLite</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <DollarSign size={14} />
                <span>Multi-Tenant</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}