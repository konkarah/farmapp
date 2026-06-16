'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function HealthPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [farms, setFarms] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    entity_id: '', record_type: 'checkup', description: '',
    veterinarian_name: '', diagnosis: '', treatment: '',
    medication: '', cost: '', next_checkup_date: '', recorded_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadFarms(); }, []);
  useEffect(() => { if (farmId) loadData(); }, [farmId]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const d = await res.json();
    setFarms(d.farms || []);
    if (d.farms?.length) setFarmId(d.farms[0].id);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [hrRes, entRes] = await Promise.all([
        fetch(`${API_BASE}/api/health-records?farmId=${farmId}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/entities?farmId=${farmId}`, { headers: getAuthHeaders() }),
      ]);
      const hr = await hrRes.json(); const ent = await entRes.json();
      setRecords(Array.isArray(hr) ? hr : []);
      setEntities(Array.isArray(ent) ? ent : []);
    } catch { setRecords([]); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/health-records`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ ...form, farm_id: farmId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowForm(false); loadData();
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  const recordTypeColors: any = {
    checkup: 'bg-blue-100 text-blue-800', vaccination: 'bg-green-100 text-green-800',
    treatment: 'bg-yellow-100 text-yellow-800', illness: 'bg-red-100 text-red-800',
    injury: 'bg-orange-100 text-orange-800',
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
            <p className="text-sm text-gray-500">Veterinary visits, vaccinations, treatments</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            + Add Health Record
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">New Health Record</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity *</label>
                    <select value={form.entity_id} onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required>
                      <option value="">Select entity</option>
                      {entities.map(e => <option key={e.id} value={e.id}>{e.identifier || e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Record Type *</label>
                    <select value={form.record_type} onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      <option value="checkup">Checkup</option>
                      <option value="vaccination">Vaccination</option>
                      <option value="treatment">Treatment</option>
                      <option value="illness">Illness</option>
                      <option value="injury">Injury</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian</label>
                    <input type="text" value={form.veterinarian_name} onChange={e => setForm(f => ({ ...f, veterinarian_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                    <input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
                    <input type="text" value={form.medication} onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Checkup Date</label>
                    <input type="date" value={form.next_checkup_date} onChange={e => setForm(f => ({ ...f, next_checkup_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                  <textarea value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
                  <textarea value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))}
                    required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" /></div>
          : records.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">🏥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Health Records Yet</h3>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mt-4">
                Add First Record
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Date', 'Entity', 'Type', 'Description', 'Vet', 'Cost', 'Next Checkup'].map(h =>
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{new Date(r.recorded_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.entity_id}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${recordTypeColors[r.record_type] || 'bg-gray-100 text-gray-800'}`}>
                          {r.record_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{r.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{r.veterinarian_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{r.cost ? `$${r.cost}` : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {r.next_checkup_date ? new Date(r.next_checkup_date).toLocaleDateString() : '-'}
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
