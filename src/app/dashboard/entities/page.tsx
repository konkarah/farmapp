'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EntitiesPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // ✅ Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      fetchEntityTypes();
      fetchEntities();
    }
  }, [selectedFarm, selectedType]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || actionError) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setActionError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, actionError]);

  const fetchFarms = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setFarms(data.farms || []);
      if (data.farms?.[0]?.id) {
        setSelectedFarm(data.farms[0].id);
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
      setActionError('Failed to load farms');
    }
  };

  const fetchEntityTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/entity-types?farmId=${selectedFarm}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      setEntityTypes(data);
    } catch (error) {
      console.error('Error fetching entity types:', error);
    }
  };

  const fetchEntities = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const url = selectedType === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/entities?farmId=${selectedFarm}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/entities?farmId=${selectedFarm}&entityTypeId=${selectedType}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch entities');
      
      const data = await response.json();
      setEntities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching entities:', error);
      setActionError('Failed to load entities');
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ DELETE Entity
  const deleteEntity = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Delete "${name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoading(`delete-${id}`);
    setActionError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/entities/${id}?farmId=${selectedFarm}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete entity');
      }

      // Optimistic update: remove from list
      setEntities(prev => prev.filter(e => e.id !== id));
      setSuccessMessage('✅ Entity deleted successfully');
      
    } catch (error: any) {
      console.error('Delete error:', error);
      setActionError(error.message || 'Failed to delete entity');
    } finally {
      setActionLoading(null);
    }
  };

 // In entities/page.tsx, update the viewEntity function:
const viewEntity = (id: string) => {
  router.push(`/dashboard/entities/${id}?farmId=${selectedFarm}`);
};

// Also update the editEntity function:
const editEntity = (id: string) => {
  router.push(`/dashboard/entities/${id}/edit?farmId=${selectedFarm}`);
};

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      livestock: '🐄',
      poultry: '🐔', 
      crops: '🌾',
      custom: '📦'
    };
    return icons[category] || '📦';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      sold: 'bg-blue-100 text-blue-800',
      deceased: 'bg-red-100 text-red-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Entities</h1>
          <button
            onClick={() => router.push('/dashboard/entities/new')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            + Add Entity
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ✅ Action Feedback Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">✕</button>
          </div>
        )}
        
        {actionError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>❌ {actionError}</span>
            <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800">✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Farm</label>
              <select
                value={selectedFarm}
                onChange={(e) => setSelectedFarm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Types</option>
                {entityTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {getCategoryIcon(type.category)} {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Entities Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading entities...</p>
          </div>
        ) : entities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🐄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Entities Yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first animal, batch, or crop</p>
            <button
              onClick={() => router.push('/dashboard/entities/new')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add First Entity
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acquired</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entities.map((entity) => (
                    <tr key={entity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entity.identifier || entity.name || 'Unnamed'}
                        </div>
                        {entity.batch_number && (
                          <div className="text-xs text-gray-500">Batch: {entity.batch_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entity.entity_type_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entity.status)}`}>
                          {entity.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {entity.acquisition_date 
                          ? new Date(entity.acquisition_date).toLocaleDateString() 
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          {/* ✅ View Button */}
                          <button
                            onClick={() => viewEntity(entity.id)}
                            disabled={actionLoading !== null}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="View details"
                          >
                            View
                          </button>
                          
                          {/* ✅ Edit Button */}
                          <button
                            onClick={() => editEntity(entity.id)}
                            disabled={actionLoading !== null}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Edit entity"
                          >
                            Edit
                          </button>
                          
                          {/* ✅ Delete Button */}
                          <button
                            onClick={() => deleteEntity(entity.id, entity.identifier || entity.name || 'this entity')}
                            disabled={actionLoading === `delete-${entity.id}`}
                            className={`transition-colors ${
                              actionLoading === `delete-${entity.id}`
                                ? 'text-gray-400 cursor-wait'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            title="Delete entity"
                          >
                            {actionLoading === `delete-${entity.id}` ? '⏳' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-sm text-gray-500 text-center">
          Showing {entities.length} entity{entities.length !== 1 ? 'ies' : ''}
        </div>
      </main>
    </div>
  );
}
