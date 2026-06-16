'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [currentFarm, setCurrentFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (!accessToken || !userStr) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userStr));
    fetchUserProfile(accessToken);
  }, [router]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8070/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setFarms(data.farms || []);
      if (data.farms && data.farms.length > 0) {
        setCurrentFarm(data.farms[0]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.clear();
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Record Production',
      description: 'Record today\'s milk, eggs, or crop yield',
      icon: '📈',
      path: '/dashboard/production',
    },
    {
      title: 'Add Entity',
      description: 'Add new animal or batch',
      icon: '➕',
      path: '/dashboard/entities',
    },
    {
      title: 'Health Check',
      description: 'Record health or vet visit',
      icon: '🏥',
      path: '/dashboard/health',
    },
    {
      title: 'Record Sale',
      description: 'Record a sale transaction',
      icon: '💰',
      path: '/dashboard/sales',
    },
    {
      title: 'Add Expense',
      description: 'Record farm expense',
      icon: '💸',
      path: '/dashboard/expenses',
    },
    {
      title: 'View Reports',
      description: 'Financial and production reports',
      icon: '📊',
      path: '/dashboard/reports/financial',
    },
  ];

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            {currentFarm && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Farm</p>
                <p className="text-lg font-semibold text-green-600">{currentFarm.name}</p>
                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  {currentFarm.role_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Entities</p>
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-1">Across all types</p>
              </div>
              <div className="text-4xl">🐄</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Production</p>
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-1">Milk, eggs, yields</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue (MTD)</p>
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-1">Month to date</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alerts</p>
                <p className="text-3xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="text-4xl">🔔</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.path)}
                className="text-left p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity / Setup Guide */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Setup Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚀 Setup Progress
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-gray-900">Farm Created</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-gray-900">Entity Types Configured</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400">○</span>
                  <span className="text-sm text-gray-600">Add Your First Entity</span>
                </div>
                <button
                  onClick={() => router.push('/dashboard/entities')}
                  className="text-xs text-green-600 hover:underline"
                >
                  Add Now →
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400">○</span>
                  <span className="text-sm text-gray-600">Record First Production</span>
                </div>
                <button
                  onClick={() => router.push('/dashboard/production')}
                  className="text-xs text-green-600 hover:underline"
                >
                  Record →
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400">○</span>
                  <span className="text-sm text-gray-600">Setup Chart of Accounts</span>
                </div>
                <button
                  onClick={() => router.push('/dashboard/accounting/accounts')}
                  className="text-xs text-green-600 hover:underline"
                >
                  Setup →
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ℹ️ System Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Farms:</span>
                <span className="font-medium text-gray-900">{farms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Role:</span>
                <span className="font-medium text-gray-900">{currentFarm?.role_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Backend Status:</span>
                <span className="font-medium text-green-600">● Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">API Version:</span>
                <span className="font-medium text-gray-900">v1.0.0</span>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <a
                  href="http://localhost:8070/api-docs"
                  target="_blank"
                  className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  📚 API Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
