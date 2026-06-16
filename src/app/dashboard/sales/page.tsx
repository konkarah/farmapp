'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', sale_date: new Date().toISOString().split('T')[0],
    product_type: 'milk', product_name: '', quantity: '',
    unit: 'liters', unit_price: '', notes: '',
  });

  useEffect(() => { loadFarms(); }, []);
  useEffect(() => { if (farmId) loadSales(); }, [farmId]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const d = await res.json();
    setFarms(d.farms || []);
    if (d.farms?.length) {
      setFarmId(d.farms[0].id);
    } else {
      setFarmId('');
      alert('No farm assigned to your account. Please contact your administrator or create a farm.');
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales?farmId=${farmId}`, { headers: getAuthHeaders() });
      const d = await res.json();
      setSales(Array.isArray(d) ? d : []);
    } catch { setSales([]); }
    setLoading(false);
  };

  const totalAmount = (q: string, p: string) => (parseFloat(q || '0') * parseFloat(p || '0')).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/sales`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({
          farm_id: farmId, customer_name: form.customer_name,
          sale_date: form.sale_date, notes: form.notes,
          items: [{
            product_type: form.product_type, product_name: form.product_name,
            quantity: parseFloat(form.quantity), unit: form.unit,
            unit_price: parseFloat(form.unit_price),
            total_price: parseFloat(totalAmount(form.quantity, form.unit_price)),
          }],
          total_amount: parseFloat(totalAmount(form.quantity, form.unit_price)),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowForm(false); loadSales();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  const productUnits: any = {
    milk: 'liters', eggs: 'pieces', meat: 'kg',
    crops: 'kg', livestock: 'head',
  };

  const totalRevenue = sales.reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0);

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
            <p className="text-sm text-gray-500">Record and track all farm sales</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            + Record Sale
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Sales</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{sales.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-1">KES{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Avg Sale Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${sales.length ? (totalRevenue / sales.length).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {/* Sale Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Record Sale</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input type="text" value={form.customer_name}
                      onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="Walk-in customer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
                    <input type="date" value={form.sale_date}
                      onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
                    <select value={form.product_type}
                      onChange={e => setForm(f => ({ ...f, product_type: e.target.value, unit: productUnits[e.target.value] || 'kg' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      <option value="milk">🥛 Milk</option>
                      <option value="eggs">🥚 Eggs</option>
                      <option value="meat">🍖 Meat</option>
                      <option value="crops">🌾 Crops</option>
                      <option value="livestock">🐄 Livestock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input type="text" value={form.product_name}
                      onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="e.g. Fresh Milk" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" step="0.01" value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                    <input type="number" step="0.01" value={form.unit_price}
                      onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
                {form.quantity && form.unit_price && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800">
                      Total: ${totalAmount(form.quantity, form.unit_price)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    {submitting ? 'Saving...' : 'Record Sale'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sales Table */}
        {loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" /></div>
          : sales.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sales Recorded</h3>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg mt-4">Record First Sale</button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Invoice', 'Date', 'Customer', 'Amount', 'Status'].map(h =>
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(s.sale_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.customer_name || 'Walk-in'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-700">KES{parseFloat(s.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${s.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {s.status}
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
