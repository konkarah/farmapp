'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function TrendsPage() {
  const [farmId, setFarmId] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'financial' | 'production' | 'sales' | 'expenses' | 'health'>('financial');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [productionData, setProductionData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadFarm();
  }, []);

  useEffect(() => {
    if (farmId) {
      loadData();
    }
  }, [farmId, dateRange, groupBy, activeTab]);

  const loadFarm = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.farms && data.farms.length > 0) {
        setFarmId(data.farms[0].id);
      }
    } catch (error) {
      console.error('Error loading farm:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        farmId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy
      });

      // Load summary (always)
      const summaryRes = await fetch(`${API_BASE}/api/trends/summary?farmId=${farmId}`, { headers: getAuthHeaders() });
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // Load data based on active tab
      switch (activeTab) {
        case 'financial':
          const finRes = await fetch(`${API_BASE}/api/trends/financial?${params}`, { headers: getAuthHeaders() });
          const finData = await finRes.json();
          setFinancialData(Array.isArray(finData) ? finData : []);
          break;

        case 'production':
          const prodRes = await fetch(`${API_BASE}/api/trends/production?${params}`, { headers: getAuthHeaders() });
          const prodData = await prodRes.json();
          setProductionData(Array.isArray(prodData) ? prodData : []);
          break;

        case 'sales':
          const salesRes = await fetch(`${API_BASE}/api/trends/sales?${params}`, { headers: getAuthHeaders() });
          const salesResData = await salesRes.json();
          setSalesData(Array.isArray(salesResData) ? salesResData : []);
          break;

        case 'expenses':
          const expRes = await fetch(`${API_BASE}/api/trends/expenses?${params}`, { headers: getAuthHeaders() });
          const expData = await expRes.json();
          setExpensesData(Array.isArray(expData) ? expData : []);
          break;

        case 'health':
          const healthRes = await fetch(`${API_BASE}/api/trends/health?${params}`, { headers: getAuthHeaders() });
          const healthResData = await healthRes.json();
          setHealthData(Array.isArray(healthResData) ? healthResData : []);
          break;
      }
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
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

  const formatPeriod = (period: string) => {
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period.match(/^\d{4}-\d{1,2}$/)) {
      return `Week ${period.split('-')[1]}, ${period.split('-')[0]}`;
    }
    return period;
  };

  const renderFinancialChart = () => {
    if (financialData.length === 0) {
      return <div className="text-center py-12 text-gray-500">No financial data available</div>;
    }

    const maxValue = Math.max(...financialData.map(d => Math.max(
      parseFloat(d.revenue) || 0, 
      parseFloat(d.expenses) || 0
    )));

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Revenue vs Expenses</h3>
          <div className="space-y-3">
            {financialData.map((item, idx) => {
              const revenue = parseFloat(item.revenue) || 0;
              const expenses = parseFloat(item.expenses) || 0;
              const profit = parseFloat(item.profit) || 0;
              const margin = parseFloat(item.margin) || 0;
              
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{formatPeriod(item.period)}</span>
                    <span className="text-gray-600">
                      {formatCurrency(revenue)} / {formatCurrency(expenses)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-8">
                    <div 
                      className="bg-green-500 rounded flex items-center justify-end px-2 text-white text-xs"
                      style={{ width: `${maxValue > 0 ? (revenue / maxValue) * 100 : 0}%` }}>
                      {revenue > 0 && formatCurrency(revenue)}
                    </div>
                    <div 
                      className="bg-red-500 rounded flex items-center justify-end px-2 text-white text-xs"
                      style={{ width: `${maxValue > 0 ? (expenses / maxValue) * 100 : 0}%` }}>
                      {expenses > 0 && formatCurrency(expenses)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Profit: <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(profit)}
                    </span>
                    {' '}({margin.toFixed(1)}% margin)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(financialData.reduce((sum, d) => sum + (parseFloat(d.revenue) || 0), 0))}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(financialData.reduce((sum, d) => sum + (parseFloat(d.expenses) || 0), 0))}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className={`text-2xl font-bold ${financialData.reduce((sum, d) => sum + (parseFloat(d.profit) || 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialData.reduce((sum, d) => sum + (parseFloat(d.profit) || 0), 0))}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderProductionChart = () => {
    if (productionData.length === 0) {
      return <div className="text-center py-12 text-gray-500">No production data available</div>;
    }

    const productTypes = Array.from(new Set(productionData.map(d => d.product_type)));
    
    return (
      <div className="space-y-6">
        {productTypes.map(productType => {
          const data = productionData.filter(d => d.product_type === productType);
          const maxQty = Math.max(...data.map(d => parseFloat(d.total_quantity) || 0));
          
          return (
            <div key={productType} className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">{productType}</h3>
              <div className="space-y-2">
                {data.map((item, idx) => {
                  const qty = parseFloat(item.total_quantity) || 0;
                  
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatPeriod(item.period)}</span>
                        <span className="font-medium">{qty.toFixed(1)} {item.unit}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 flex items-center justify-end px-2 text-white text-xs"
                          style={{ width: `${maxQty > 0 ? (qty / maxQty) * 100 : 0}%` }}>
                          {item.record_count} records
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSalesChart = () => {
    if (salesData.length === 0) {
      return <div className="text-center py-12 text-gray-500">No sales data available</div>;
    }

    const productTypes = Array.from(new Set(salesData.map(d => d.product_type).filter(Boolean)));

    return (
      <div className="space-y-6">
        {productTypes.length > 0 ? productTypes.map(productType => {
          const data = salesData.filter(d => d.product_type === productType);
          const maxRevenue = Math.max(...data.map(d => parseFloat(d.total_revenue) || 0));
          
          return (
            <div key={productType} className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">{productType} Sales</h3>
              <div className="space-y-2">
                {data.map((item, idx) => {
                  const revenue = parseFloat(item.total_revenue) || 0;
                  const qty = parseFloat(item.total_quantity) || 0;
                  
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatPeriod(item.period)}</span>
                        <span className="font-medium">{formatCurrency(revenue)}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="h-full bg-green-500 flex items-center justify-end px-2 text-white text-xs"
                          style={{ width: `${maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0}%` }}>
                          {qty > 0 && `${qty.toFixed(0)} units`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }) : (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">All Sales</h3>
            <div className="space-y-2">
              {salesData.map((item, idx) => {
                const revenue = parseFloat(item.total_revenue) || 0;
                const maxRevenue = Math.max(...salesData.map(d => parseFloat(d.total_revenue) || 0));
                
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{formatPeriod(item.period)}</span>
                      <span className="font-medium">{formatCurrency(revenue)}</span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded overflow-hidden">
                      <div 
                        className="h-full bg-green-500 flex items-center justify-end px-2 text-white text-xs"
                        style={{ width: `${maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0}%` }}>
                        {item.transaction_count} transactions
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExpensesChart = () => {
    if (expensesData.length === 0) {
      return <div className="text-center py-12 text-gray-500">No expense data available</div>;
    }

    const categories = Array.from(new Set(expensesData.map(d => d.category)));

    return (
      <div className="space-y-6">
        {categories.map(category => {
          const data = expensesData.filter(d => d.category === category);
          const maxAmount = Math.max(...data.map(d => parseFloat(d.total_amount) || 0));
          
          return (
            <div key={category} className="bg-white p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">{category}</h3>
              <div className="space-y-2">
                {data.map((item, idx) => {
                  const amount = parseFloat(item.total_amount) || 0;
                  
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatPeriod(item.period)}</span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="h-full bg-red-500 flex items-center justify-end px-2 text-white text-xs"
                          style={{ width: `${maxAmount > 0 ? (amount / maxAmount) * 100 : 0}%` }}>
                          {item.transaction_count} transactions
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Trend Analysis</h1>
          <p className="text-sm text-gray-500">Visualize farm performance over time</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
              <p className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(summary.thisMonth.revenue)}</p>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-xs text-gray-500 mt-2">
                {summary.changes.revenue > 0 ? '↑' : '↓'} {Math.abs(summary.changes.revenue).toFixed(1)}% vs last month
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
              <p className="text-3xl font-bold text-red-600 mb-1">{formatCurrency(summary.thisMonth.expenses)}</p>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-xs text-gray-500 mt-2">
                {summary.changes.expenses > 0 ? '↑' : '↓'} {Math.abs(summary.changes.expenses).toFixed(1)}% vs last month
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
              <p className={`text-3xl font-bold mb-1 ${summary.thisMonth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.thisMonth.profit)}
              </p>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className="text-xs text-gray-500 mt-2">
                {summary.thisMonth.revenue > 0 ? (summary.thisMonth.profit / summary.thisMonth.revenue * 100).toFixed(1) : 0}% margin
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={e => setDateRange(d => ({ ...d, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={e => setDateRange(d => ({ ...d, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: 'financial', label: 'Financial', icon: '💰' },
                { id: 'production', label: 'Production', icon: '📊' },
                { id: 'sales', label: 'Sales', icon: '💵' },
                { id: 'expenses', label: 'Expenses', icon: '💸' },
                { id: 'health', label: 'Health', icon: '🏥' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
            </div>
          ) : (
            <>
              {activeTab === 'financial' && renderFinancialChart()}
              {activeTab === 'production' && renderProductionChart()}
              {activeTab === 'sales' && renderSalesChart()}
              {activeTab === 'expenses' && renderExpensesChart()}
              {activeTab === 'health' && (
                <div className="text-center py-12 text-gray-500">Health trends coming soon</div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}