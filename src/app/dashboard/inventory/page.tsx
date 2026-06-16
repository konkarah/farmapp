'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState({ category: '', lowStock: false });
  const [stats, setStats] = useState({ total_items: 0, total_value: 0, low_stock_items: 0 });
  
  const [form, setForm] = useState({
    category: 'feed',
    item_name: '',
    description: '',
    quantity: '',
    unit: 'kg',
    unit_cost: '',
    reorder_level: '',
    supplier: '',
    location: '',
    notes: '',
  });

  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'in',
    quantity: '',
    unit_cost: '',
    reference: '',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });

  const router = useRouter();

  useEffect(() => { loadFarms(); }, []);
  useEffect(() => { if (farmId) { loadData(); loadStats(); } }, [farmId, filter]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const data = await res.json();
    setFarms(data.farms || []);
    if (data.farms?.length) setFarmId(data.farms[0].id);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/inventory?farmId=${farmId}`;
      if (filter.category) url += `&category=${filter.category}`;
      if (filter.lowStock) url += `&lowStock=true`;
      
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { setItems([]); }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/stats/summary?farmId=${farmId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error('Stats error:', e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId) return alert('Farm ID missing');
    
    setSubmitting(true);
    try {
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem 
        ? `${API_BASE}/api/inventory/${selectedItem.id}` 
        : `${API_BASE}/api/inventory`;
      
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...form, farm_id: farmId }),
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      setShowForm(false);
      setSelectedItem(null);
      resetForm();
      loadData();
      loadStats();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${selectedItem.id}/transaction`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transactionForm),
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      setShowTransactionForm(false);
      setSelectedItem(null);
      setTransactionForm({
        transaction_type: 'in',
        quantity: '',
        unit_cost: '',
        reference: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      loadData();
      loadStats();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this inventory item?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      loadData();
      loadStats();
    } catch (err: any) { alert(err.message); }
  };

  const resetForm = () => {
    setForm({
      category: 'feed',
      item_name: '',
      description: '',
      quantity: '',
      unit: 'kg',
      unit_cost: '',
      reorder_level: '',
      supplier: '',
      location: '',
      notes: '',
    });
  };

  const openEditForm = (item: any) => {
    setSelectedItem(item);
    setForm({
      category: item.category,
      item_name: item.item_name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unit_cost || '',
      reorder_level: item.reorder_level || '',
      supplier: item.supplier || '',
      location: item.location || '',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const openTransactionForm = (item: any) => {
    setSelectedItem(item);
    setShowTransactionForm(true);
  };

  const categories = ['Feed', 'Medication', 'Equipment', 'Seeds', 'Fertilizer', 'Pesticide', 'Fuel', 'Supplies', 'Other'];
  const units = ['kg', 'liters', 'pieces', 'bags', 'bottles', 'boxes'];

  const getStockStatusColor = (status: string) => {
    const colors: any = {
      low: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      good: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-500">Track stock levels, suppliers, and reorder points</p>
          </div>
          <button onClick={() => { setSelectedItem(null); resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            + Add Item
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_items}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-3xl font-bold text-gray-900">KES{stats.total_value || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-red-600">{stats.low_stock_items}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Categories</p>
            <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center">
          <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={filter.lowStock} 
              onChange={e => setFilter(f => ({ ...f, lowStock: e.target.checked }))}
              className="rounded" />
            <span className="text-sm text-gray-700">Low Stock Only</span>
          </label>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {selectedItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      {categories.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                    <input type="text" value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" step="0.01" value={form.quantity} 
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                    <input type="number" step="0.01" value={form.unit_cost} 
                      onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input type="number" step="0.01" value={form.reorder_level} 
                      onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g., Warehouse A, Shelf 3" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setSelectedItem(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    {submitting ? 'Saving...' : selectedItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transaction Form Modal */}
        {showTransactionForm && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Record Transaction: {selectedItem.item_name}
              </h2>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type *</label>
                  <select value={transactionForm.transaction_type} 
                    onChange={e => setTransactionForm(f => ({ ...f, transaction_type: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                    <option value="in">Stock In (Add)</option>
                    <option value="out">Stock Out (Remove)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity * ({selectedItem.unit})</label>
                  <input type="number" step="0.01" value={transactionForm.quantity} 
                    onChange={e => setTransactionForm(f => ({ ...f, quantity: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  <p className="text-xs text-gray-500 mt-1">Current stock: {selectedItem.quantity} {selectedItem.unit}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                  <input type="number" step="0.01" value={transactionForm.unit_cost} 
                    onChange={e => setTransactionForm(f => ({ ...f, unit_cost: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input type="text" value={transactionForm.reference} 
                    onChange={e => setTransactionForm(f => ({ ...f, reference: e.target.value }))}
                    placeholder="PO#, Invoice#, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={transactionForm.transaction_date} 
                    onChange={e => setTransactionForm(f => ({ ...f, transaction_date: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={transactionForm.notes} 
                    onChange={e => setTransactionForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => { setShowTransactionForm(false); setSelectedItem(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    {submitting ? 'Recording...' : 'Record Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inventory Items</h3>
            <p className="text-gray-600 mb-6">Start by adding your first inventory item</p>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add First Item
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Item', 'Category', 'Quantity', 'Stock Status', 'Unit Cost', 'Total Value', 'Supplier', 'Actions'].map(h =>
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.item_name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${getStockStatusColor(item.stock_status)}`}>
                        {item.stock_status === 'low' ? '🔴 Low' : item.stock_status === 'medium' ? '🟡 Medium' : '🟢 Good'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">KES{item.unit_cost || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">KES{(item.quantity * (item.unit_cost || 0)).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.supplier || '-'}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button onClick={() => openTransactionForm(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium">+/-</button>
                      <button onClick={() => openEditForm(item)}
                        className="text-green-600 hover:text-green-800 font-medium">Edit</button>
                      <button onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 font-medium">Delete</button>
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