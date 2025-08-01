const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    risk_level?: string;
    industry?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any>(endpoint);
  }

  async getCustomer(id: string) {
    return this.request<any>(`/customers/${id}`);
  }

  async getCustomerHealthHistory(id: string) {
    return this.request<any>(`/customers/${id}/health-history`);
  }

  async updateCustomerHealth(id: string, healthScore: number) {
    return this.request<any>(`/customers/${id}/health`, {
      method: 'PUT',
      body: JSON.stringify({ health_score: healthScore }),
    });
  }

  async getAtRiskCustomers() {
    return this.request<any>('/customers/at-risk');
  }

  async getChurnPredictions(params?: {
    page?: number;
    limit?: number;
    risk_level?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/churn/predictions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any>(endpoint);
  }

  async generateChurnPrediction(customerId: string) {
    return this.request<any>(`/churn/predict/${customerId}`, {
      method: 'POST',
    });
  }

  async getChurnFactors(customerId: string) {
    return this.request<any>(`/churn/factors/${customerId}`);
  }

  async getChurnTrends(period: number = 12) {
    return this.request<any>(`/churn/trends?period=${period}`);
  }

  async getDashboardOverview() {
    return this.request<any>('/analytics/overview');
  }

  async getCohortAnalysis(period: number = 12) {
    return this.request<any>(`/analytics/cohorts?period=${period}`);
  }

  async getRevenueAtRisk() {
    return this.request<any>('/analytics/revenue-at-risk');
  }

  async getInterventionEffectiveness() {
    return this.request<any>('/analytics/intervention-effectiveness');
  }

  async getInterventions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customer_id?: string;
    assigned_to?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/interventions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any>(endpoint);
  }

  async createIntervention(intervention: {
    customer_id: string;
    intervention_type: string;
    trigger_reason: string;
    assigned_to: string;
    notes?: string;
  }) {
    return this.request<any>('/interventions', {
      method: 'POST',
      body: JSON.stringify(intervention),
    });
  }

  async updateIntervention(id: string, updates: {
    status?: string;
    outcome?: string;
    notes?: string;
  }) {
    return this.request<any>(`/interventions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getIntervention(id: string) {
    return this.request<any>(`/interventions/${id}`);
  }

  async getRecentAlerts() {
    return this.request<any>('/interventions/alerts/recent');
  }

  async getTasks(params?: { assigned_to?: string; status?: string; priority?: string; customer_id?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any>(endpoint);
  }

  async createTask(data: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async getCSMMetrics(csmName?: string) {
    const queryParams = new URLSearchParams();
    if (csmName) queryParams.append('csm_name', csmName);
    
    const endpoint = `/analytics/csm-metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any>(endpoint);
  }
}

export const apiService = new ApiService();
