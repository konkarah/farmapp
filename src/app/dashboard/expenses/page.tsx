'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/config';

const EXPENSE_CATEGORIES = ['Feed', 'Veterinary', 'Labor', 'Equipment', 'Utilities', 'Transport', 'Seeds/Seedlings', 'Fertilizer', 'Pesticides', 'Maintenance', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: 'Feed', description: '', amount: '',
    vendor: '', payment_method: 'cash', expense_date: new Date().toISOString().split('T')[0], notes: '',
  });

  useEffect(() => { loadFarms(); }, []);
  useEffect(() => { if (farmId) loadExpenses(); }, [farmId]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const d = await res.json();
    setFarms(d.farms || []);
    if (d.farms?.length) setFarmId(d.farms[0].id);
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/expenses?farmId=${farmId}`, { headers: getAuthHeaders() });
      const d = await res.json();
      setExpenses(Array.isArray(d) ? d : []);
    } catch { setExpenses([]); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ ...form, farm_id: farmId, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowForm(false); loadExpenses();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const byCategory = expenses.reduce((acc: any, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
    return acc;
  }, {});

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500">Track all farm operating expenses</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            + Add Expense
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600 mt-1">KES{totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Number of Entries</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{expenses.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Top Category</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0] || '-'}
            </p>
          </div>
        </div>

        {/* Expense Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Add Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                    <input type="number" step="0.01" value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input type="text" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="What was this expense for?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Supplier</label>
                    <input type="text" value={form.vendor}
                      onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cheque">Cheque</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.expense_date}
                    onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    {submitting ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        {loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" /></div>
          : expenses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">💸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Expenses Recorded</h3>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg mt-4">Add First Expense</button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Date', 'Category', 'Description', 'Vendor', 'Payment Method', 'Amount', 'Status'].map(h =>
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((ex: any) => (
                    <tr key={ex.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{new Date(ex.expense_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm"><span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">{ex.category}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{ex.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{ex.vendor || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{ex.payment_method?.replace('_', ' ') || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">KES{parseFloat(ex.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${ex.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {ex.status || 'pending'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </main>
    </div>
  );
}
