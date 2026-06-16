'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [farm, setFarm] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    totalEntities: 0,
    todayProduction: 0,
    monthRevenue: 0,
    alerts: 0,
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Load user profile
      const userRes = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
      const userData = await userRes.json();
      setUser(userData);

      if (userData.farms && userData.farms.length > 0) {
        const currentFarm = userData.farms[0];
        setFarm(currentFarm);

        // Load metrics in parallel
        await Promise.all([
          loadEntitiesCount(currentFarm.id),
          loadTodayProduction(currentFarm.id),
          loadMonthRevenue(currentFarm.id),
          loadAlerts(currentFarm.id),
          loadRecentActivity(currentFarm.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setMetrics(m => ({ ...m, loading: false }));
    }
  };

  const loadEntitiesCount = async (farmId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/entities?farmId=${farmId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setMetrics(m => ({ ...m, totalEntities: Array.isArray(data) ? data.length : 0 }));
    } catch (error) {
      console.error('Error loading entities:', error);
    }
  };

  const loadTodayProduction = async (farmId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE}/api/production?farmId=${farmId}&date=${today}`, { headers: getAuthHeaders() });
      const data = await res.json();
      
      // Sum up all production quantities for today
      const total = Array.isArray(data) 
        ? data.reduce((sum, record) => sum + (parseFloat(record.quantity) || 0), 0)
        : 0;
      
      setMetrics(m => ({ ...m, todayProduction: Math.round(total) }));
    } catch (error) {
      console.error('Error loading production:', error);
    }
  };

  const loadMonthRevenue = async (farmId: string) => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const res = await fetch(
        `${API_BASE}/api/sales?farmId=${farmId}&startDate=${firstDay}&endDate=${lastDay}`, 
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      
      const total = Array.isArray(data)
        ? data.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0)
        : 0;
      
      setMetrics(m => ({ ...m, monthRevenue: Math.round(total) }));
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  };

  const loadAlerts = async (farmId: string) => {
    try {
      // Check for health alerts (sick animals)
      const healthRes = await fetch(`${API_BASE}/api/health?farmId=${farmId}`, { headers: getAuthHeaders() });
      const healthData = await healthRes.json();
      
      const sickAnimals = Array.isArray(healthData)
        ? healthData.filter((h: any) => h.status === 'Sick' || h.status === 'Critical').length
        : 0;

      // Check for low inventory items
      const invRes = await fetch(`${API_BASE}/api/inventory?farmId=${farmId}&lowStock=true`, { headers: getAuthHeaders() });
      const invData = await invRes.json();
      const lowStock = Array.isArray(invData) ? invData.length : 0;

      setMetrics(m => ({ ...m, alerts: sickAnimals + lowStock }));
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadRecentActivity = async (farmId: string) => {
    try {
      // Get recent production records (last 5)
      const prodRes = await fetch(`${API_BASE}/api/production?farmId=${farmId}`, { headers: getAuthHeaders() });
      const prodData = await prodRes.json();
      
      // Get recent sales (last 5)
      const salesRes = await fetch(`${API_BASE}/api/sales?farmId=${farmId}`, { headers: getAuthHeaders() });
      const salesData = await salesRes.json();

      // Combine and sort by date
      const activities = [
        ...(Array.isArray(prodData) ? prodData.slice(0, 5).map((p: any) => ({
          type: 'production',
          icon: '📊',
          title: `${p.production_type || p.product_type || 'Production'} recorded`,
          description: `${parseFloat(p.quantity || 0).toFixed(2)} ${p.unit || 'liters'}`,
          date: p.recorded_date || p.production_date || p.created_at,
          timestamp: new Date(p.created_at || p.recorded_date || Date.now())
        })) : []),
        ...(Array.isArray(salesData) ? salesData.slice(0, 5).map((s: any) => ({
          type: 'sale',
          icon: '💰',
          title: 'Sale completed',
          description: `${s.customer_name || 'Customer'} - ${s.invoice_number || 'Invoice'} - KES ${parseFloat(s.total_amount || 0).toLocaleString()}`,
          date: s.sale_date || s.transaction_date || s.created_at,
          timestamp: new Date(s.created_at || s.sale_date || Date.now())
        })) : [])
      ];

      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivity(activities.slice(0, 8));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Invalid Date';
    
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {farm?.name || 'Loading...'} • {user?.role_name || 'User'}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Entities</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.loading ? '...' : metrics.totalEntities}
                </p>
                <p className="text-xs text-gray-500 mt-1">Across all types</p>
              </div>
              <div className="text-4xl">🐄</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Today's Production</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.loading ? '...' : metrics.todayProduction}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total units recorded</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenue (MTD)</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.loading ? '...' : formatCurrency(metrics.monthRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Month to date</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alerts</p>
                <p className={`text-3xl font-bold ${metrics.alerts > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {metrics.loading ? '...' : metrics.alerts}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="text-4xl">{metrics.alerts > 0 ? '🔔' : '✅'}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/dashboard/production')}
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <span className="text-3xl mb-2">📝</span>
              <span className="text-sm font-medium text-gray-700">Record Production</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/sales')}
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <span className="text-3xl mb-2">💵</span>
              <span className="text-sm font-medium text-gray-700">Record Sale</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/health')}
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <span className="text-3xl mb-2">🏥</span>
              <span className="text-sm font-medium text-gray-700">Health Check</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/expenses')}
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <span className="text-3xl mb-2">💸</span>
              <span className="text-sm font-medium text-gray-700">Add Expense</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p>No recent activity</p>
                <p className="text-sm mt-1">Start recording data to see activity here</p>
              </div>
            ) : (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {formatDate(activity.date)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}