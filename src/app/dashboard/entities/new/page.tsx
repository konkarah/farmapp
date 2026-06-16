'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function NewEntityPage() {
  const router = useRouter();
  const [farms, setFarms] = useState<any[]>([]);
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    farm_id: '', entity_type_id: '', identifier: '', name: '',
    batch_number: '', quantity: '', acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_cost: '', status: 'active', notes: '',
  });
  const [fieldValues, setFieldValues] = useState<any>({});

  useEffect(() => { loadFarms(); }, []);
  useEffect(() => { if (form.farm_id) loadEntityTypes(); }, [form.farm_id]);
  useEffect(() => { if (form.entity_type_id) loadTypeDetails(); }, [form.entity_type_id]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const d = await res.json();
    setFarms(d.farms || []);
    if (d.farms?.length) setForm((f: any) => ({ ...f, farm_id: d.farms[0].id }));
  };

  const loadEntityTypes = async () => {
    const res = await fetch(`${API_BASE}/api/entity-types?farmId=${form.farm_id}`, { headers: getAuthHeaders() });
    const d = await res.json();
    setEntityTypes(Array.isArray(d) ? d : []);
  };

  const loadTypeDetails = async () => {
    const res = await fetch(
      `${API_BASE}/api/entity-types/${form.entity_type_id}?farmId=${form.farm_id}`,
      { headers: getAuthHeaders() }
    );

    const d = await res.json();
    setSelectedType(d);
    setCustomFields(d.fields || []);
    setFieldValues({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const payload = {
        ...form,
        quantity: form.quantity ? parseInt(form.quantity) : undefined,
        acquisition_cost: form.acquisition_cost ? parseFloat(form.acquisition_cost) : undefined,
        field_values: Object.entries(fieldValues).map(([field_id, value]) => ({ field_id, value })),
      };
      const res = await fetch(`${API_BASE}/api/entities`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create entity');
      router.push('/dashboard/entities');
    } catch (err: any) { alert(err.message); }
    setSubmitting(false);
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center space-x-4">
          <button onClick={() => router.push('/dashboard/entities')} className="text-gray-600 hover:text-gray-900">← Back</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Entity</h1>
            <p className="text-sm text-gray-500">Add a new animal, batch, or crop</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                <select value={form.farm_id} onChange={e => setForm((f: any) => ({ ...f, farm_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
                <select value={form.entity_type_id} onChange={e => setForm((f: any) => ({ ...f, entity_type_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required>
                  <option value="">Select type...</option>
                  {entityTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {selectedType && (
              <>
                {/* Identity */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {Number(selectedType.track_individually) === 1
                      ? '🐄 Individual Identity'
                      : '🐔 Batch Details'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedType.track_individually === 1 ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tag / ID Number *</label>
                        <input type="text" value={form.identifier} onChange={e => setForm((f: any) => ({ ...f, identifier: e.target.value }))}
                          placeholder="e.g. KE-001" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                        <input type="text" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Bessie"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                        <input type="text" value={form.batch_number} onChange={e => setForm((f: any) => ({ ...f, batch_number: e.target.value }))}
                          placeholder="e.g. BATCH-2026-001" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                        <input type="number" value={form.quantity} onChange={e => setForm((f: any) => ({ ...f, quantity: e.target.value }))}
                          placeholder="e.g. 500" required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                    <input type="date" value={form.acquisition_date} onChange={e => setForm((f: any) => ({ ...f, acquisition_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost</label>
                    <input type="number" step="0.01" value={form.acquisition_cost} onChange={e => setForm((f: any) => ({ ...f, acquisition_cost: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                      <option value="active">Active</option>
                      <option value="sold">Sold</option>
                      <option value="deceased">Deceased</option>
                      <option value="culled">Culled</option>
                      <option value="quarantine">Quarantine</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customFields.map((field: any) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.field_label} {field.is_required && '*'}
                        </label>
                        {field.field_type === 'select' ? (
                          <select value={fieldValues[field.id] || ''} onChange={e => setFieldValues((v: any) => ({ ...v, [field.id]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required={field.is_required}>
                            <option value="">Select...</option>
                            {(field.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : field.field_type === 'boolean' ? (
                          <select value={fieldValues[field.id] ?? ''} onChange={e => setFieldValues((v: any) => ({ ...v, [field.id]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900">
                            <option value="">Select...</option>
                            <option value="1">Yes</option>
                            <option value="0">No</option>
                          </select>
                        ) : field.field_type === 'textarea' ? (
                          <textarea value={fieldValues[field.id] || ''} onChange={e => setFieldValues((v: any) => ({ ...v, [field.id]: e.target.value }))}
                            rows={2} required={field.is_required}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                        ) : (
                          <input type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                            value={fieldValues[field.id] || ''} onChange={e => setFieldValues((v: any) => ({ ...v, [field.id]: e.target.value }))}
                            required={field.is_required}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => router.push('/dashboard/entities')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting || !form.entity_type_id}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
              {submitting ? 'Saving...' : 'Add Entity'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
