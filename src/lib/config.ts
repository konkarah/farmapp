export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8070';

export const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

export const getCurrentFarmId = () => {
  const farms = JSON.parse(localStorage.getItem('farms') || '[]');
  return farms[0]?.id || '';
};

export const apiFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};
