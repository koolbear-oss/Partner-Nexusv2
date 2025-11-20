
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Award, 
  GraduationCap, 
  DollarSign,
  BarChart3,
  Store,
  Menu,
  X,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from './components/hooks/useCurrentUser';
import PartnerSelector from './components/admin/PartnerSelector';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mimicPartnerId, setMimicPartnerId] = useState(null);
  const { user, isAdmin } = useCurrentUser();

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard', roles: ['admin', 'partner_user'] },
    { name: 'Partners', icon: Users, page: 'Partners', roles: ['admin'] },
    { name: 'Projects', icon: Briefcase, page: 'Projects', roles: ['admin', 'partner_user'] },
    { name: 'Competencies', icon: Award, page: 'Competencies', roles: ['admin', 'partner_user'] },
    { name: 'Certifications', icon: GraduationCap, page: 'Certifications', roles: ['admin', 'partner_user'] },
    { name: 'Pricing', icon: DollarSign, page: 'Pricing', roles: ['admin'] },
    { name: 'Bonuses', icon: DollarSign, page: 'Bonuses', roles: ['admin'] },
    { name: 'Analytics', icon: BarChart3, page: 'Analytics', roles: ['admin'] },
    { name: 'Marketplace', icon: Store, page: 'Marketplace', roles: ['admin'] },
  ];

  const navigation = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-slate-900 w-64`}>
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-3">
            <div>
              <div className="text-white font-bold text-xl tracking-tight">ASSA ABLOY</div>
              <div className="text-slate-400 text-xs mt-0.5">Partner Network</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="border-t border-slate-800 pt-4 mt-4">
              <div className="px-3 py-2 text-xs text-slate-400">
                <div className="font-medium text-white mb-1">{user.full_name}</div>
                <div className="truncate">{user.email}</div>
              </div>
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center w-full px-3 py-2 mt-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-600 hover:text-slate-900"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4">
                {isAdmin && (
                  <PartnerSelector 
                    value={mimicPartnerId} 
                    onChange={setMimicPartnerId}
                  />
                )}
                <button className="relative text-slate-600 hover:text-slate-900">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    3
                  </span>
                </button>
                <button className="text-slate-600 hover:text-slate-900">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
