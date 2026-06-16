'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function WorkerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    production: 0,
    health: 0,
    sales: 0,
    expenses: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      const userData = JSON.parse(u);
      setUser(userData);
      loadFarmData();
      loadTodayStats();
    }
  }, []);

  const loadFarmData = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.farms?.length) setFarm(data.farms[0]);
  };

  const loadTodayStats = async () => {
    // Load today's entries by this worker
    const today = new Date().toISOString().split('T')[0];
    // In a real implementation, fetch these from API filtered by current user
    setTodayStats({
      production: 3,
      health: 1,
      sales: 2,
      expenses: 1,
    });
  };

  const quickActions = [
    {
      title: 'Record Production',
      description: 'Log milk, eggs, or crop yield',
      icon: '📈',
      color: 'border-green-300 hover:bg-green-50',
      path: '/dashboard/production',
    },
    {
      title: 'Health Check',
      description: 'Report animal health issues',
      icon: '🏥',
      color: 'border-red-300 hover:bg-red-50',
      path: '/dashboard/health',
    },
    {
      title: 'Record Sale',
      description: 'Log a sale transaction',
      icon: '💰',
      color: 'border-blue-300 hover:bg-blue-50',
      path: '/dashboard/sales',
    },
    {
      title: 'Record Expense',
      description: 'Log farm purchase or expense',
      icon: '💸',
      color: 'border-orange-300 hover:bg-orange-50',
      path: '/dashboard/expenses',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <header className="bg-white shadow-sm border-b-4 border-green-600">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hello, {user?.name}! 👋
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {farm?.name} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Farm Worker
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Today's Activity Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Today's Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-700">{todayStats.production}</div>
              <div className="text-sm text-gray-600 mt-1">Production Records</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-700">{todayStats.health}</div>
              <div className="text-sm text-gray-600 mt-1">Health Checks</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-700">{todayStats.sales}</div>
              <div className="text-sm text-gray-600 mt-1">Sales Logged</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-700">{todayStats.expenses}</div>
              <div className="text-sm text-gray-600 mt-1">Expenses Logged</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons - LARGE and EASY TO TAP */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 What would you like to record?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.path)}
                className={`text-left p-8 bg-white border-3 rounded-xl shadow-md transition-all ${action.color}`}
              >
                <div className="text-5xl mb-4">{action.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">💡 Quick Guide</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Record immediately:</strong> Log activities as they happen for accurate data</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Be detailed:</strong> Add notes about quantities, quality, and any issues</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Check your entries:</strong> You can view your logged records but cannot edit them</span>
            </div>
            <div className="flex items-start">
              <span className="mr-2">✓</span>
              <span><strong>Manager approval:</strong> Your entries will be reviewed and approved by the farm manager</span>
            </div>
          </div>
        </div>

        {/* My Recent Entries - View Only */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📝 My Recent Entries</h3>
          <p className="text-sm text-gray-500 mb-4">
            Last 5 records you've created (view only - contact manager to make changes)
          </p>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-900">Production Record</span>
                <span className="text-gray-600 ml-2">• 50 liters milk</span>
              </div>
              <span className="text-gray-500">2 hours ago</span>
            </div>
            <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-900">Sale</span>
                <span className="text-gray-600 ml-2">• $120.00</span>
              </div>
              <span className="text-gray-500">5 hours ago</span>
            </div>
            <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-900">Health Check</span>
                <span className="text-gray-600 ml-2">• Cow #KE-045</span>
              </div>
              <span className="text-gray-500">Yesterday</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
