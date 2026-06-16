'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/config';

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';

export default function FinancialReportsPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [activeTab, setActiveTab] = useState<'pl' | 'trial_balance' | 'balance_sheet'>('pl');
  const [period, setPeriod] = useState<Period>('monthly');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => { loadFarms(); }, []);
  useEffect(() => { if (farmId) loadReportData(); }, [farmId, dateFrom, dateTo]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const d = await res.json();
    setFarms(d.farms || []);
    if (d.farms?.length) setFarmId(d.farms[0].id);
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [salesRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE}/api/sales?farmId=${farmId}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/expenses?farmId=${farmId}`, { headers: getAuthHeaders() }),
      ]);
      const s = await salesRes.json();
      const e = await expensesRes.json();
      setSales(Array.isArray(s) ? s : []);
      setExpenses(Array.isArray(e) ? e : []);
    } catch { }
    setLoading(false);
  };

  // Calculate P&L from actual data
  const totalRevenue = sales.reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
    return acc;
  }, {});

  const tabs = [
    { id: 'pl', label: 'Profit & Loss' },
    { id: 'trial_balance', label: 'Trial Balance' },
    { id: 'balance_sheet', label: 'Balance Sheet' },
  ];

  const handleExport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const rows = [
        ['Report', 'Profit & Loss Statement'],
        ['Period', `${dateFrom} to ${dateTo}`],
        [''],
        ['REVENUE', ''],
        ['Total Sales', totalRevenue.toFixed(2)],
        [''],
        ['EXPENSES', ''],
        ...Object.entries(expensesByCategory).map(([cat, amt]: any) => [cat, amt.toFixed(2)]),
        ['Total Expenses', totalExpenses.toFixed(2)],
        [''],
        ['NET PROFIT', netProfit.toFixed(2)],
        ['Profit Margin', `${profitMargin}%`],
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `profit-loss-${dateFrom}-${dateTo}.csv`; a.click();
    }
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-sm text-gray-500">P&L, Trial Balance, Balance Sheet</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleExport('csv')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                📥 Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <select value={farmId} onChange={e => setFarmId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={period} onChange={e => setPeriod(e.target.value as Period)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semi_annual">Semi-Annual</option>
            <option value="yearly">Yearly</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
          <span className="text-gray-500 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
          <button onClick={loadReportData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            Generate Report
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" /></div> : (

          <>
            {/* Profit & Loss */}
            {activeTab === 'pl' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">KES {totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                    <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-600">KES {totalExpenses.toFixed(2)}</p>
                  </div>
                  <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${netProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
                    <p className="text-sm text-gray-600 mb-1">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</p>
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      ${Math.abs(netProfit).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Margin: {profitMargin}%</p>
                  </div>
                </div>

                {/* Detailed P&L */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Statement</h3>
                    <p className="text-sm text-gray-500">{dateFrom} to {dateTo}</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Revenue Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Revenue</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">Sales Income</span>
                          <span className="font-medium text-green-700">KES {totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 font-bold">
                          <span>Total Revenue</span>
                          <span className="text-green-700">KES {totalRevenue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Expenses</h4>
                      <div className="space-y-2">
                        {Object.entries(expensesByCategory).map(([cat, amt]: any) => (
                          <div key={cat} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-700">{cat}</span>
                            <span className="font-medium text-red-700">KES {amt.toFixed(2)}</span>
                          </div>
                        ))}
                        {Object.keys(expensesByCategory).length === 0 && (
                          <p className="text-sm text-gray-500 py-2">No expenses recorded</p>
                        )}
                        <div className="flex justify-between py-2 font-bold">
                          <span>Total Expenses</span>
                          <span className="text-red-700">KES {totalExpenses.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Profit */}
                    <div className={`p-4 rounded-lg ${netProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">
                          NET {netProfit >= 0 ? 'PROFIT' : 'LOSS'}
                        </span>
                        <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          KES {Math.abs(netProfit).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Profit Margin: {profitMargin}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trial Balance */}
            {activeTab === 'trial_balance' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Trial Balance</h3>
                   <p className="text-sm text-gray-500">{dateFrom} to {dateTo}</p>
                </div>
                <div className="p-6">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 text-sm font-semibold text-gray-700">Account</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-700">Debit</th>
                        <th className="text-right py-2 text-sm font-semibold text-gray-700">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="py-2">
                        <td className="py-2 text-sm text-gray-700">Cash / Bank</td>
                        <td className="py-2 text-sm text-right text-gray-900">KES {totalRevenue.toFixed(2)}</td>
                        <td className="py-2 text-sm text-right text-gray-400">-</td>
                      </tr>
                      <tr className="py-2">
                        <td className="py-2 text-sm text-gray-700">Sales Revenue</td>
                        <td className="py-2 text-sm text-right text-gray-400">-</td>
                        <td className="py-2 text-sm text-right text-gray-900">KES {totalRevenue.toFixed(2)}</td>
                      </tr>
                      {Object.entries(expensesByCategory).map(([cat, amt]: any) => (
                        <tr key={cat}>
                          <td className="py-2 text-sm text-gray-700">{cat} Expense</td>
                          <td className="py-2 text-sm text-right text-gray-900">KES {amt.toFixed(2)}</td>
                          <td className="py-2 text-sm text-right text-gray-400">-</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 font-bold">
                        <td className="py-3 text-sm text-gray-800">TOTALS</td>
                        <td className="py-3 text-sm text-right text-gray-800">KES {(totalRevenue + totalExpenses).toFixed(2)}</td>
                        <td className="py-3 text-sm text-right text-gray-800">KES {(totalRevenue + totalExpenses).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className={`mt-4 p-3 rounded text-sm ${Math.abs(totalRevenue - (totalRevenue + totalExpenses)) < 0.01 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    Note: Connect your Chart of Accounts to see the full double-entry trial balance.
                  </div>
                </div>
              </div>
            )}

            {/* Balance Sheet */}
            {activeTab === 'balance_sheet' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Balance Sheet</h3>
                  <p className="text-sm text-gray-500">As of {dateTo}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 uppercase text-sm tracking-wide">Assets</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 text-sm">Cash & Bank</span>
                        <span className="text-sm font-medium text-gray-800">KES {netProfit > 0 ? netProfit.toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 text-sm">Accounts Receivable</span>
                        <span className="text-sm font-medium text-gray-800">KES 0.00</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold border-t-2 border-gray-300 mt-2">
                        <span>Total Assets</span>
                        <span className="text-blue-700">KES {netProfit > 0 ? netProfit.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 uppercase text-sm tracking-wide">Liabilities & Equity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 text-sm">Accounts Payable</span>
                        <span className="text-sm font-medium text-gray-800">KES 0.00</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700 text-sm">Retained Earnings</span>
                        <span className="text-sm font-medium text-gray-800">KES {netProfit > 0 ? netProfit.toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold border-t-2 border-gray-300 mt-2">
                        <span>Total Liabilities & Equity</span>
                        <span className="text-blue-700">KES {netProfit > 0 ? netProfit.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    💡 Set up your Chart of Accounts and Journal Entries for a complete Balance Sheet.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
