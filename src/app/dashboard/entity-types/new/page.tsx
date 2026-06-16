'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEntityTypePage() {
  const router = useRouter();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    farmId: '',
    name: '',
    category: 'livestock',
    track_individually: true,
    has_lifecycle: false,
    icon: '🐄',
  });

  const [fields, setFields] = useState<any[]>([]);
  const [lifecycleStages, setLifecycleStages] = useState<any[]>([]);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://32.192.225.100:8070/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setFarms(data.farms || []);
      if (data.farms && data.farms.length > 0) {
        setFormData(prev => ({ ...prev, farmId: data.farms[0].id }));
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  const categoryIcons: any = {
    livestock: '🐄',
    poultry: '🐔',
    crops: '🌾',
    custom: '📦'
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category,
      icon: categoryIcons[category]
    }));
  };

  const addField = () => {
    setFields([...fields, {
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      options: null,
      validation_rules: null
    }]);
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addLifecycleStage = () => {
    setLifecycleStages([...lifecycleStages, {
      name: '',
      color: '#6B7280'
    }]);
  };

  const updateLifecycleStage = (index: number, key: string, value: any) => {
    const updated = [...lifecycleStages];
    updated[index] = { ...updated[index], [key]: value };
    setLifecycleStages(updated);
  };

  const removeLifecycleStage = (index: number) => {
    setLifecycleStages(lifecycleStages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://32.192.225.100:8070/api/entity-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          fields: fields.filter(f => f.field_name && f.field_label),
          lifecycle_stages: formData.has_lifecycle ? lifecycleStages.filter(s => s.name) : []
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create entity type');
      }

      router.push('/dashboard/entity-types');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/entity-types')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-green-600">
              Create Entity Type
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm *
                </label>
                <select
                  value={formData.farmId}
                  onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  required
                >
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Type Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Dairy Cattle, Broilers, Coffee Plants"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(categoryIcons).map(([key, icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCategoryChange(key)}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        formData.category === key
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{icon}</div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {key}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.track_individually}
                    onChange={(e) => setFormData({ ...formData, track_individually: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    Track Individually (e.g., each cow has unique ID)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_lifecycle}
                    onChange={(e) => setFormData({ ...formData, has_lifecycle: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    Has Lifecycle Stages
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Custom Fields
              </h2>
              <button
                type="button"
                onClick={addField}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <p className="text-gray-600 text-sm">
                No custom fields yet. Add fields to track specific information.
              </p>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <input
                        type="text"
                        placeholder="Field name (e.g., breed)"
                        value={field.field_name}
                        onChange={(e) => updateField(index, 'field_name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Display label (e.g., Breed)"
                        value={field.field_label}
                        onChange={(e) => updateField(index, 'field_label', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm"
                      />
                      <select
                        value={field.field_type}
                        onChange={(e) => updateField(index, 'field_type', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded text-gray-900 text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select/Dropdown</option>
                        <option value="boolean">Yes/No</option>
                        <option value="textarea">Long Text</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Required field</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lifecycle Stages */}
          {formData.has_lifecycle && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lifecycle Stages
                </h2>
                <button
                  type="button"
                  onClick={addLifecycleStage}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  + Add Stage
                </button>
              </div>

              {lifecycleStages.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  Add lifecycle stages (e.g., Calf → Heifer → Milking Cow → Dry Cow)
                </p>
              ) : (
                <div className="space-y-3">
                  {lifecycleStages.map((stage, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-gray-500">{index + 1}.</span>
                      <input
                        type="text"
                        placeholder="Stage name"
                        value={stage.name}
                        onChange={(e) => updateLifecycleStage(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900"
                      />
                      <input
                        type="color"
                        value={stage.color}
                        onChange={(e) => updateLifecycleStage(index, 'color', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => removeLifecycleStage(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/entity-types')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Entity Type'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
