'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function EditEntityPage() {
  const router = useRouter();
  const params = useParams();
    const searchParams = useSearchParams(); // Add this
  const entityId = params?.id as string;
  const farmId = searchParams.get('farmId'); 
  
  const [entity, setEntity] = useState<any>(null);
  const [entityType, setEntityType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<any>({});
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});


const fetchEntity = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    // ✅ FIX: Include farmId in the request URL
    const res = await fetch(`${API_BASE}/api/entities/${entityId}?farmId=${farmId}`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch entity');
    }
    
    const data = await res.json();
    setEntity(data);
    
    // Pre-fill form
    setForm({
      identifier: data.identifier || '',
      name: data.name || '',
      batch_number: data.batch_number || '',
      quantity: data.quantity || '',
      acquisition_date: data.acquisition_date?.split('T')[0] || '',
      acquisition_cost: data.acquisition_cost || '',
      status: data.status || 'active',
      notes: data.notes || '',
    });
    
    // Pre-fill custom field values
    if (data.field_values) {
      const values: Record<string, any> = {};
      data.field_values.forEach((fv: any) => {
        values[fv.field_id] = fv.value;
      });
      setFieldValues(values);
    }
    
    // Fetch entity type for field definitions
    if (data.entity_type_id) {
      const typeRes = await fetch(
        `${API_BASE}/api/entity-types/${data.entity_type_id}?farmId=${farmId}`,
        { headers: getAuthHeaders() }
      );
      if (typeRes.ok) {
        const typeData = await typeRes.json();
        setEntityType(typeData);
      }
    }
  } catch (err: any) {
    setError(err.message || 'Failed to load entity');
  } finally {
    setLoading(false);
  }
};

// Update useEffect dependencies
useEffect(() => {
  if (!entityId || !farmId) {
    if (!farmId) setError('Farm ID is missing from URL');
    return;
  }
  fetchEntity();
}, [entityId, farmId]);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError(null);
  
  try {
    const token = localStorage.getItem('accessToken');
    
    const payload = {
      ...form,
      quantity: form.quantity ? parseInt(form.quantity) : undefined,
      acquisition_cost: form.acquisition_cost ? parseFloat(form.acquisition_cost) : undefined,
      field_values: entityType?.fields?.map((field: any) => ({
        field_id: field.id,
        value: fieldValues[field.id]
      })).filter((fv: any) => fv.value !== undefined && fv.value !== ''),
    };
    
    const res = await fetch(`${API_BASE}/api/entities/${entityId}?farmId=${farmId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update entity');
    }
    
    // ✅ FIX: Redirect back to view page, not the list
    router.push(`/dashboard/entities/${entityId}?farmId=${farmId}`);
    router.refresh();
    
  } catch (err: any) {
    setError(err.message || 'Failed to save changes');
    alert(`❌ ${err.message}`);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Entity not found'}</p>
          <button 
            onClick={() => router.push('/dashboard/entities')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ← Back to Entities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center space-x-4">
          <button 
            onClick={() => router.push(`/dashboard/entities/${entityId}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Entity</h1>
            <p className="text-sm text-gray-500">
              {entity.identifier || entity.name} • {entity.entity_type_name}
            </p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entityType?.track_individually ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tag / ID *</label>
                    <input
                      type="text"
                      value={form.identifier}
                      onChange={e => setForm((f: any) => ({ ...f, identifier: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                    <input
                      type="text"
                      value={form.batch_number}
                      onChange={e => setForm((f: any) => ({ ...f, batch_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={e => setForm((f: any) => ({ ...f, quantity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      required
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                <input
                  type="date"
                  value={form.acquisition_date}
                  onChange={e => setForm((f: any) => ({ ...f, acquisition_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.acquisition_cost}
                  onChange={e => setForm((f: any) => ({ ...f, acquisition_cost: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
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
              <textarea
                value={form.notes}
                onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>

          {/* Custom Fields */}
          {entityType?.fields?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entityType.fields.map((field: any) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.field_label} {field.is_required && '*'}
                    </label>
                    {field.field_type === 'select' ? (
                      <select
                        value={fieldValues[field.id] || ''}
                        onChange={e => setFieldValues((v) => ({ ...v, [field.id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        required={field.is_required}
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.field_type === 'boolean' ? (
                      <select
                        value={fieldValues[field.id] ?? ''}
                        onChange={e => setFieldValues((v) => ({ ...v, [field.id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      >
                        <option value="">Select...</option>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    ) : field.field_type === 'textarea' ? (
                      <textarea
                        value={fieldValues[field.id] || ''}
                        onChange={e => setFieldValues((v) => ({ ...v, [field.id]: e.target.value }))}
                        rows={2}
                        required={field.is_required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    ) : (
                      <input
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                        value={fieldValues[field.id] || ''}
                        onChange={e => setFieldValues((v) => ({ ...v, [field.id]: e.target.value }))}
                        required={field.is_required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/entities/${entityId}`)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
