'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function ProductionPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    entity_type_id: '', entity_id: '', batch_number: '',
    production_type: 'milk', quantity: '', unit: 'liters',
    quality_grade: '', recorded_date: new Date().toISOString().split('T')[0], notes: '',
  });
  const router = useRouter();

  useEffect(() => { loadFarms(); }, []);
  useEffect(() => { if (farmId) { loadData(); } }, [farmId]);
  useEffect(() => {
    if (form.entity_type_id && farmId) {
      loadEntities(form.entity_type_id);
    }
  }, [form.entity_type_id]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const data = await res.json();
    setFarms(data.farms || []);
    if (data.farms?.length) {
      setFarmId(data.farms[0].id);
    } else {
      setFarmId('');
      alert('No farm assigned to your account. Please contact your administrator or create a farm.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading data for farmId:', farmId);
      
      const [typesRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/api/entity-types?farmId=${farmId}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/production?farmId=${farmId}`, { headers: getAuthHeaders() }),
      ]);
      
      console.log('Entity types response status:', typesRes.status);
      console.log('Production response status:', prodRes.status);
      
      const types = await typesRes.json();
      const prod = await prodRes.json();
      
      console.log('Entity types loaded:', types);
      console.log('Production records loaded:', prod);
      
      setEntityTypes(Array.isArray(types) ? types : []);
      setRecords(Array.isArray(prod) ? prod : []);
    } catch (e) { 
      console.error('Error loading data:', e);
      setRecords([]); 
    }
    setLoading(false);
  };

  const loadEntities = async (typeId: string) => {
    const res = await fetch(`${API_BASE}/api/entities?farmId=${farmId}&entityTypeId=${typeId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    setEntities(Array.isArray(data) ? data : []);
  };

  const productionUnits: any = {
    milk: 'liters', eggs: 'pieces', meat: 'kg',
    crop_yield: 'kg', honey: 'kg', wool: 'kg',
  };

  const handleTypeChange = (type: string) => {
    setForm(f => ({ ...f, production_type: type, unit: productionUnits[type] || 'kg' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate farmId exists
    if (!farmId) {
      alert('Farm ID is missing. Please refresh the page and try again.');
      return;
    }
    
    // Validate entity_type_id
    if (!form.entity_type_id) {
      alert('Please select an Entity Type before submitting.');
      return;
    }

    // Validate entity_id if entities exist
    if (entities.length > 0 && !form.entity_id) {
      alert('Please select a specific Entity before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, farm_id: farmId };
      console.log('Submitting production record:', payload);
      
      const res = await fetch(`${API_BASE}/api/production`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create record');
      }
      
      setShowForm(false);
      setForm({
        entity_type_id: '', entity_id: '', batch_number: '',
        production_type: 'milk', quantity: '', unit: 'liters',
        quality_grade: '', recorded_date: new Date().toISOString().split('T')[0], notes: '',
      });
      loadData();
    } catch (err: any) { 
      console.error('Production record error:', err);
      alert(err.message); 
    }
    setSubmitting(false);
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Production Records</h1>
            <p className="text-sm text-gray-500">Track daily milk, eggs, crop yields and more</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            + Record Production
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Farm Selector */}
        <div className="mb-6 flex items-center space-x-4">
          <select value={farmId} onChange={e => setFarmId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900">
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Record Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Record Production</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Production Type *</label>
                    <select value={form.production_type} onChange={e => handleTypeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      <option value="milk">🥛 Milk</option>
                      <option value="eggs">🥚 Eggs</option>
                      <option value="meat">🍖 Meat</option>
                      <option value="crop_yield">🌾 Crop Yield</option>
                      <option value="honey">🍯 Honey</option>
                      <option value="wool">🧶 Wool</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recorded Date *</label>
                    <input type="date" value={form.recorded_date}
                      onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                  <select value={form.entity_type_id}
                    onChange={e => setForm(f => ({ ...f, entity_type_id: e.target.value, entity_id: '' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                    <option value="">All / General</option>
                    {entityTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                {entities.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specific Entity (optional)</label>
                    <select value={form.entity_id}
                      onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      <option value="">All entities</option>
                      {entities.map(e => <option key={e.id} value={e.id}>{e.identifier || e.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" step="0.01" value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      placeholder="0.00" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Grade</label>
                  <select value={form.quality_grade}
                    onChange={e => setForm(f => ({ ...f, quality_grade: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                    <option value="">Not graded</option>
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Below Standard)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    {submitting ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Records Table */}
        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" /></div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Production Records Yet</h3>
            <p className="text-gray-600 mb-6">Start recording your daily production</p>
            <button onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Record First Production
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Type', 'Quantity', 'Unit', 'Grade', 'Notes'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(r.recorded_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">{r.production_type}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-700">{r.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.unit}</td>
                    <td className="px-6 py-4 text-sm">
                      {r.quality_grade ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{r.quality_grade}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{r.notes || '-'}</td>
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
