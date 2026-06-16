'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    
    if (!accessToken || !userStr) {
      window.location.href = '/';
      return;
    }
    
    setUser(JSON.parse(userStr));
    fetchUserProfile(accessToken);
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('http://32.192.225.100:8070/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      
      if (data.farms?.length > 0) {
        setUserRole(data.farms[0].role_name);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // RBAC: Role-based menu configuration
  const allMenuItems = [
    {
      section: 'Overview',
      items: [
        { name: 'Dashboard', icon: '📊', path: '/dashboard', roles: ['Super Admin', 'Farm Manager', 'Accountant', 'Farm Worker'] },
      ]
    },
    {
      section: 'Farm Management',
      items: [
        { name: 'Entity Types', icon: '📦', path: '/dashboard/entity-types', roles: ['Super Admin', 'Farm Manager'] },
        { name: 'Entities', icon: '🐄', path: '/dashboard/entities', roles: ['Super Admin', 'Farm Manager', 'Accountant'] },
        { name: 'Production Records', icon: '📈', path: '/dashboard/production', roles: ['Super Admin', 'Farm Manager', 'Accountant', 'Farm Worker'] },
        // { name: 'Health Records', icon: '🏥', path: '/dashboard/health', roles: ['Super Admin', 'Farm Manager', 'Farm Worker'] },
        // { name: 'Breeding', icon: '👶', path: '/dashboard/breeding', roles: ['Super Admin', 'Farm Manager'] },
        // { name: 'Fields & Crops', icon: '🌾', path: '/dashboard/fields', roles: ['Super Admin', 'Farm Manager'] },
      ]
    },
    {
      section: 'Inventory',
      items: [
        { name: 'Inventory', icon: '📦', path: '/dashboard/inventory', roles: ['Super Admin', 'Farm Manager'] },
        // { name: 'Feed Management', icon: '🌿', path: '/dashboard/inventory/feed', roles: ['Super Admin', 'Farm Manager'] },
      ]
    },
    {
      section: 'Financial',
      items: [
        // { name: 'Chart of Accounts', icon: '📋', path: '/dashboard/accounting/accounts', roles: ['Super Admin', 'Accountant'] },
        // { name: 'Journal Entries', icon: '📝', path: '/dashboard/accounting/journal', roles: ['Super Admin', 'Accountant'] },
        { name: 'Sales', icon: '💰', path: '/dashboard/sales', roles: ['Super Admin', 'Farm Manager', 'Accountant', 'Farm Worker'] },
        { name: 'Expenses', icon: '💸', path: '/dashboard/expenses', roles: ['Super Admin', 'Farm Manager', 'Accountant', 'Farm Worker'] },
      ]
    },
    {
      section: 'Reports',
      items: [
        { name: 'Financial Reports', icon: '📊', path: '/dashboard/reports/financial', roles: ['Super Admin', 'Farm Manager', 'Accountant'] },
        // { name: 'Production Reports', icon: '📈', path: '/dashboard/reports/production', roles: ['Super Admin', 'Farm Manager'] },
        // { name: 'Trial Balance', icon: '⚖️', path: '/dashboard/reports/trial-balance', roles: ['Super Admin', 'Accountant'] },
        // { name: 'P&L Statement', icon: '📉', path: '/dashboard/reports/profit-loss', roles: ['Super Admin', 'Farm Manager', 'Accountant'] },
        // { name: 'Balance Sheet', icon: '📄', path: '/dashboard/reports/balance-sheet', roles: ['Super Admin', 'Accountant'] },
        { name: 'Trend Analysis', icon: '📊', path: '/dashboard/reports/trends', roles: ['Super Admin', 'Farm Manager'] },
      ]
    },
    {
      section: 'Settings',
      items: [
        { name: 'Farm Settings', icon: '⚙️', path: '/dashboard/settings', roles: ['Super Admin', 'Farm Manager'] },
        { name: 'Users & Roles', icon: '👥', path: '/dashboard/users', roles: ['Super Admin'] },
      ]
    },
  ];

  // Filter menu based on user role
  const canAccessItem = (itemRoles: string[]) => {
    if (!userRole) return false;
    return itemRoles.includes(userRole);
  };

  const filteredMenuItems = allMenuItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => canAccessItem(item.roles))
    }))
    .filter(section => section.items.length > 0);

  const isActive = (path: string) => pathname === path;

  if (!user || !userRole) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-green-600">🌾 Farm Manager</h1>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{userRole}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {filteredMenuItems.map((section) => (
            <div key={section.section} className="mb-6">
              {sidebarOpen && (
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button key={item.path} onClick={() => router.push(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-green-50 text-green-700 border-r-4 border-green-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && <span className="flex-1 text-left font-medium">{item.name}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
