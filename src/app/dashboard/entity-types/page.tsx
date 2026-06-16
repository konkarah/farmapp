'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EntityTypesPage() {
  const [entityTypes, setEntityTypes] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/');
      return;
    }
    fetchFarms();
  }, [router]);

  useEffect(() => {
    if (selectedFarm) {
      fetchEntityTypes();
    }
  }, [selectedFarm]);

  const fetchFarms = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://32.192.225.100:8070/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setFarms(data.farms || []);
      if (data.farms && data.farms.length > 0) {
        setSelectedFarm(data.farms[0].id);
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  const fetchEntityTypes = async () => {
    setLoading(true);
    setDeleteError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://32.192.225.100:8070/api/entity-types?farmId=${selectedFarm}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setEntityTypes(data);
    } catch (error) {
      console.error('Error fetching entity types:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Delete entity type function
  const deleteEntityType = async (id: string, name: string) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\n` +
      `This will soft-delete the entity type. ` +
      `It cannot be deleted if it has existing entities.`
    );
    
    if (!confirmed) return;

    setDeletingId(id);
    setDeleteError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://32.192.225.100:8070/api/entity-types/${id}?farmId=${selectedFarm}`,
        {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete entity type');
      }

      // Remove from local state
      setEntityTypes(prev => prev.filter(type => type.id !== id));
      
      // Optional: Show success toast
      alert('✅ Entity type deleted successfully');
      
    } catch (error: any) {
      console.error('Delete error:', error);
      setDeleteError(error.message || 'Failed to delete entity type');
      alert(`❌ ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      livestock: '🐄',
      poultry: '🐔',
      crops: '🌾',
      custom: '📦'
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      livestock: 'bg-blue-100 text-blue-800',
      poultry: 'bg-yellow-100 text-yellow-800',
      crops: 'bg-green-100 text-green-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-green-600">
              Entity Types
            </h1>
          </div>
          <button
            onClick={() => router.push('/dashboard/entity-types/new')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Create Entity Type
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Farm Selector */}
        {farms.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Farm:
            </label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name} ({farm.role_name})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Delete Error Alert */}
        {deleteError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {deleteError}
            <button 
              onClick={() => setDeleteError(null)}
              className="ml-4 text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Entity Types List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : entityTypes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Entity Types Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first entity type to start managing your farm
            </p>
            <button
              onClick={() => router.push('/dashboard/entity-types/new')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Entity Type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entityTypes.map((type) => (
              <div
                key={type.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 relative group"
              >
                {/* ✅ Delete Button - Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEntityType(type.id, type.name);
                  }}
                  disabled={deletingId === type.id || type.entity_count > 0}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                    type.entity_count > 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : deletingId === type.id
                      ? 'text-gray-400 cursor-wait'
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={
                    type.entity_count > 0 
                      ? 'Cannot delete: has existing entities' 
                      : 'Delete entity type'
                  }
                >
                  {deletingId === type.id ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>🗑️</span>
                  )}
                </button>

                {/* Card Content - Clickable for navigation */}
                <div
                  className="cursor-pointer pr-8"
                  onClick={() => router.push(`/dashboard/entity-types/${type.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{getCategoryIcon(type.category)}</div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(type.category)}`}>
                      {type.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {type.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="w-32">Tracking:</span>
                      <span className="font-medium">
                        {type.track_individually ? 'Individual' : 'Batch'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32">Lifecycle:</span>
                      <span className="font-medium">
                        {type.has_lifecycle ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32">Entities:</span>
                      <span className={`font-medium ${type.entity_count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {type.entity_count || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Helper text when deletion is blocked */}
                {type.entity_count > 0 && (
                  <p className="mt-3 text-xs text-gray-400 italic">
                    Delete {type.entity_count} entities first
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Helper Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 What are Entity Types?
          </h3>
          <p className="text-blue-800 mb-3">
            Entity Types are configurable templates that define what you want to track on your farm.
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <div><strong>🐄 Dairy Cattle:</strong> Track individual cows with custom fields like breed, age, milk production</div>
            <div><strong>🐔 Broilers/Layers:</strong> Track poultry batches with fields like batch size, feed consumption</div>
            <div><strong>🌾 Crops:</strong> Track different crops with planting dates, expected yields</div>
            <div><strong>📦 Custom:</strong> Create any entity type you need (goats, fish, vegetables, etc.)</div>
          </div>
        </div>
      </main>
    </div>
  );
}
