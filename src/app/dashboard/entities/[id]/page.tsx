'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function ViewEntityPage() {
  const router = useRouter();
  const params = useParams();
    const searchParams = useSearchParams(); // Add this
  const entityId = params?.id as string;
  const farmId = searchParams.get('farmId'); 
  
  const [entity, setEntity] = useState<any>(null);
  const [entityType, setEntityType] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!entityId || !farmId) {
    if (!farmId) setError('Farm ID is missing from URL');
    return;
  }
  fetchEntity();
}, [entityId, farmId]); // Add farmId to dependencies

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
    console.error('Fetch error:', err);
  } finally {
    setLoading(false);
  }
};
  const handleDelete = async () => {
    if (!entity) return;
    
    const confirmed = window.confirm(
      `Delete "${entity.identifier || entity.name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${API_BASE}/api/entities/${entityId}?farmId=${farmId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      
      alert('✅ Entity deleted');
      router.push('/dashboard/entities');
      router.refresh();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
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

  // Helper to get field value from field_values array
  const getFieldValue = (fieldName: string) => {
    const fv = entity.field_values?.find((f: any) => f.field_name === fieldName);
    return fv?.value || '—';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.push('/dashboard/entities')}
            className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <div className="flex items-center space-x-3">
       		<button
  onClick={() => router.push(`/dashboard/entities/${entityId}/edit?farmId=${farmId}`)}
  className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
>
  Edit
</button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Entity Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {entity.identifier || entity.name || 'Unnamed Entity'}
              </h1>
              <p className="text-gray-600 mt-1">
                Type: {entity.entity_type_name}
              </p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              entity.status === 'active' ? 'bg-green-100 text-green-800' :
              entity.status === 'sold' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {entity.status}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <dl className="space-y-3">
              {entity.batch_number && (
                <div className="flex">
                  <dt className="w-32 text-sm text-gray-500">Batch #</dt>
                  <dd className="text-sm text-gray-900">{entity.batch_number}</dd>
                </div>
              )}
              {entity.quantity && (
                <div className="flex">
                  <dt className="w-32 text-sm text-gray-500">Quantity</dt>
                  <dd className="text-sm text-gray-900">{entity.quantity}</dd>
                </div>
              )}
              <div className="flex">
                <dt className="w-32 text-sm text-gray-500">Acquired</dt>
                <dd className="text-sm text-gray-900">
                  {entity.acquisition_date 
                    ? new Date(entity.acquisition_date).toLocaleDateString() 
                    : '—'}
                </dd>
              </div>
              {entity.acquisition_cost && (
                <div className="flex">
                  <dt className="w-32 text-sm text-gray-500">Cost</dt>
                  <dd className="text-sm text-gray-900">
                    ${parseFloat(entity.acquisition_cost).toFixed(2)}
                  </dd>
                </div>
              )}
              {entity.notes && (
                <div className="pt-3">
                  <dt className="text-sm font-medium text-gray-700">Notes</dt>
                  <dd className="text-sm text-gray-900 mt-1">{entity.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Custom Fields */}
          {entityType?.fields?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h2>
              <dl className="space-y-3">
                {entityType.fields.map((field: any) => (
                  <div key={field.id} className="flex">
                    <dt className="w-32 text-sm text-gray-500">{field.field_label}</dt>
                    <dd className="text-sm text-gray-900">
                      {getFieldValue(field.field_name)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-8 text-xs text-gray-400">
          <p>Created: {new Date(entity.created_at).toLocaleString()}</p>
          {entity.updated_at !== entity.created_at && (
            <p>Updated: {new Date(entity.updated_at).toLocaleString()}</p>
          )}
        </div>
      </main>
    </div>
  );
}
