'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/config';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmId, setFarmId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    role_id: '',
    password: '',
    farm_id: '',  // Farm selector in modal
  });
  const router = useRouter();

  useEffect(() => { loadFarms(); loadRoles(); }, []);
  useEffect(() => { if (farmId) loadUsers(); }, [farmId]);

  const loadFarms = async () => {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: getAuthHeaders() });
    const d = await res.json();
    setFarms(d.farms || []);
    if (d.farms?.length) {
      setFarmId(d.farms[0].id);
      setUserForm(f => ({ ...f, farm_id: d.farms[0].id })); // Set default farm in form
    }
  };

  const loadRoles = async () => {
    const res = await fetch(`${API_BASE}/api/users/roles`, { headers: getAuthHeaders() });
    const d = await res.json();
    setRoles(Array.isArray(d) ? d : []);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/farm/${farmId}`, { headers: getAuthHeaders() });
      const d = await res.json();
      setUsers(Array.isArray(d) ? d : []);
    } catch { setUsers([]); }
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userForm), // Use form's farm_id, not the page filter
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      const data = await res.json();
      alert(`User created successfully!\nEmail: ${data.email}\nThey can now login.`);
      
      setShowAddModal(false);
      setUserForm({ email: '', name: '', role_id: '', password: '', farm_id: farmId });
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    if (!confirm('Change user role?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/farm/${farmId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role_id: newRoleId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove user from this farm?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/farm/${farmId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Deactivate' : 'Activate'} this user?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    const colors: any = {
      'Super Admin': 'bg-purple-100 text-purple-800 border-purple-300',
      'Farm Manager': 'bg-blue-100 text-blue-800 border-blue-300',
      'Accountant': 'bg-green-100 text-green-800 border-green-300',
      'Farm Worker': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getRoleDescription = (roleName: string) => {
    const descriptions: any = {
      'Super Admin': 'Full system access - can manage everything',
      'Farm Manager': 'Can manage farm operations, approve transactions',
      'Accountant': 'Handles financial records, approves accounting entries',
      'Farm Worker': 'Data entry only - records production, health, sales, expenses',
    };
    return descriptions[roleName] || '';
  };

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
            <p className="text-sm text-gray-500">Manage team members and permissions</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            + Add User
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Farm Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Farm</label>
          <select value={farmId} onChange={e => setFarmId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900">
            {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Role Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {roles.map((role) => (
            <div key={role.id} className={`p-4 rounded-lg border-2 ${getRoleBadgeColor(role.name)}`}>
              <h3 className="font-semibold mb-1">{role.name}</h3>
              <p className="text-xs opacity-90">{getRoleDescription(role.name)}</p>
            </div>
          ))}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                
                {/* Farm Selector in Modal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Farm *
                  </label>
                  <select 
                    value={userForm.farm_id}
                    onChange={e => setUserForm(f => ({ ...f, farm_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="">Select a farm...</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    User will be added to this farm with the selected role
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={userForm.name}
                      onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="John Doe" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={userForm.email}
                      onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                      required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      placeholder="user@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" value={userForm.password}
                    onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Enter a secure password" />
                  <p className="text-xs text-gray-500 mt-1">User will login with this password</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role * {!userForm.role_id && <span className="text-red-600">(Please select a role)</span>}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <label key={role.id} 
                        className={`flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          userForm.role_id === role.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value={role.id}
                          checked={userForm.role_id === role.id}
                          onChange={e => setUserForm(f => ({ ...f, role_id: e.target.value }))}
                          className="mt-1 mr-3" 
                          required 
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">{role.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{getRoleDescription(role.name)}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" 
                    onClick={() => { 
                      setShowAddModal(false); 
                      setUserForm({ email: '', name: '', role_id: '', password: '', farm_id: farmId }); 
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || !userForm.role_id || !userForm.farm_id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto" /></div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Yet</h3>
            <p className="text-gray-600 mb-6">Add team members to collaborate</p>
            <button onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Add First User
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Email', 'Role', 'Assigned', 'Status', 'Actions'].map(h =>
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium mr-3">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <select value={user.role_id}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        className={`px-3 py-1 text-xs font-medium rounded border ${getRoleBadgeColor(user.role_name)}`}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={`px-2 py-1 text-xs rounded font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 space-x-3">
                      <button onClick={() => handleRemove(user.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 About Roles & Permissions</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div><strong>Super Admin:</strong> Complete system access - manages all farms and users</div>
            <div><strong>Farm Manager:</strong> Manages operations, approves transactions, assigns workers</div>
            <div><strong>Accountant:</strong> Handles finances, chart of accounts, journal entries</div>
            <div><strong>Farm Worker:</strong> <strong className="text-blue-900">Primary data entry role</strong> - records daily production, health checks, sales, and expenses</div>
          </div>
        </div>
      </main>
    </div>
  );
}
