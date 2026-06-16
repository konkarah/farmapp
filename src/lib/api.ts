import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Token is set globally in authStore
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error
          throw new Error(error.response.data.error || 'An error occurred');
        } else if (error.request) {
          // Request made but no response
          throw new Error('No response from server');
        } else {
          // Error in request setup
          throw new Error(error.message);
        }
      }
    );
  }

  // Auth endpoints
  auth = {
    getProfile: () => this.client.get('/api/auth/me'),
    logout: () => this.client.post('/api/auth/logout'),
  };

  // Farm endpoints
  farms = {
    getAll: () => this.client.get('/api/farms'),
    getById: (id: string) => this.client.get(`/api/farms/${id}`),
    create: (data: any) => this.client.post('/api/farms', data),
    update: (id: string, data: any) => this.client.put(`/api/farms/${id}`, data),
    delete: (id: string) => this.client.delete(`/api/farms/${id}`),
  };

  // Entity Type endpoints
  entityTypes = {
    getAll: (farmId: string) => this.client.get(`/api/entity-types?farmId=${farmId}`),
    getById: (id: string, farmId: string) => 
      this.client.get(`/api/entity-types/${id}?farmId=${farmId}`),
    create: (data: any) => this.client.post('/api/entity-types', data),
    update: (id: string, data: any) => this.client.put(`/api/entity-types/${id}`, data),
    delete: (id: string, farmId: string) => 
      this.client.delete(`/api/entity-types/${id}?farmId=${farmId}`),
    getFields: (id: string, farmId: string) =>
      this.client.get(`/api/entity-types/${id}/fields?farmId=${farmId}`),
  };

  // Entity endpoints
  entities = {
    getAll: (farmId: string, filters?: any) => 
      this.client.get('/api/entities', { params: { farmId, ...filters } }),
    getById: (id: string, farmId: string) => 
      this.client.get(`/api/entities/${id}?farmId=${farmId}`),
    create: (data: any) => this.client.post('/api/entities', data),
    update: (id: string, data: any) => this.client.put(`/api/entities/${id}`, data),
    delete: (id: string, farmId: string) => 
      this.client.delete(`/api/entities/${id}?farmId=${farmId}`),
  };

  // Production endpoints
  production = {
    getAll: (farmId: string, filters?: any) =>
      this.client.get('/api/production', { params: { farmId, ...filters } }),
    create: (data: any) => this.client.post('/api/production', data),
    update: (id: string, data: any) => this.client.put(`/api/production/${id}`, data),
    delete: (id: string, farmId: string) =>
      this.client.delete(`/api/production/${id}?farmId=${farmId}`),
  };

  // Accounting endpoints
  accounting = {
    getChartOfAccounts: (farmId: string) =>
      this.client.get(`/api/accounting/chart-of-accounts?farmId=${farmId}`),
    createAccount: (data: any) =>
      this.client.post('/api/accounting/chart-of-accounts', data),
    getJournalEntries: (farmId: string, filters?: any) =>
      this.client.get('/api/accounting/journal-entries', { params: { farmId, ...filters } }),
    createJournalEntry: (data: any) =>
      this.client.post('/api/accounting/journal-entries', data),
    approveJournalEntry: (id: string, farmId: string) =>
      this.client.post(`/api/accounting/journal-entries/${id}/approve?farmId=${farmId}`),
  };

  // Reports endpoints
  reports = {
    getTrialBalance: (farmId: string, params: any) =>
      this.client.get('/api/reports/trial-balance', { params: { farmId, ...params } }),
    getBalanceSheet: (farmId: string, params: any) =>
      this.client.get('/api/reports/balance-sheet', { params: { farmId, ...params } }),
    getProfitLoss: (farmId: string, params: any) =>
      this.client.get('/api/reports/profit-loss', { params: { farmId, ...params } }),
    getProductionReport: (farmId: string, params: any) =>
      this.client.get('/api/reports/production', { params: { farmId, ...params } }),
    exportReport: (type: string, format: string, params: any) =>
      this.client.get(`/api/reports/${type}/export`, {
        params: { ...params, format },
        responseType: 'blob'
      }),
  };

  // Inventory endpoints
  inventory = {
    getItems: (farmId: string) =>
      this.client.get('/api/inventory/items', { params: { farmId } }),
    createItem: (data: any) =>
      this.client.post('/api/inventory/items', data),
    recordTransaction: (data: any) =>
      this.client.post('/api/inventory/transactions', data),
  };

  // Sales endpoints
  sales = {
    getAll: (farmId: string, filters?: any) =>
      this.client.get('/api/sales', { params: { farmId, ...filters } }),
    create: (data: any) => this.client.post('/api/sales', data),
    update: (id: string, data: any) => this.client.put(`/api/sales/${id}`, data),
  };

  // Expenses endpoints
  expenses = {
    getAll: (farmId: string, filters?: any) =>
      this.client.get('/api/expenses', { params: { farmId, ...filters } }),
    create: (data: any) => this.client.post('/api/expenses', data),
    approve: (id: string, farmId: string) =>
      this.client.post(`/api/expenses/${id}/approve?farmId=${farmId}`),
  };

  // Sync endpoints (for mobile offline sync)
  sync = {
    push: (data: any) => this.client.post('/api/sync/push', data),
    pull: (farmId: string, lastSyncTime?: string) =>
      this.client.get('/api/sync/pull', { params: { farmId, lastSyncTime } }),
  };

  // File upload
  upload = {
    file: (file: File, folder: string = 'general') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      return this.client.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
  };
}

export const api = new ApiClient();
