import useAuthStore from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const request = async (path, options = {}) => {
  // Get token from auth store
  const { token } = useAuthStore.getState();
  
  const url = `${API_URL}/api${path}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
if (!response.ok) {
  let errorMessage = data?.error;
  if (!errorMessage && Array.isArray(data?.errors)) {
    errorMessage = data.errors.join(', ');
  }
  errorMessage = errorMessage || data?.message || `HTTP error ${response.status}`;
  throw new Error(errorMessage);
}
    return data;
  } catch (error) {
    console.error(`API Error (${path}):`, error);
    throw error;
  }
};

export const api = {
  // ==================== TRANSACTIONS ====================
  transactions: {
    // GET /api/transactions - List all transactions
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/transactions${queryString ? `?${queryString}` : ''}`);
    },
    
    // POST /api/transactions - Create transaction
    create: (data) => 
      request('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // PUT /api/transactions/:id - Update transaction
    update: (id, data) => 
      request(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // DELETE /api/transactions/:id - Delete single transaction
    delete: (id) => 
      request(`/transactions/${id}`, {
        method: 'DELETE',
      }),
    
    // DELETE /api/transactions/bulk - Bulk delete transactions
    deleteBulk: (ids) => 
      request('/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
    
    // GET /api/transactions/summary - Get monthly summary
    getSummary: () => 
      request('/transactions/summary'),
  },

  // ==================== BUDGETS ====================
  budgets: {
    // GET /api/budgets - List budgets (with optional month/year filter)
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/budgets${queryString ? `?${queryString}` : ''}`);
    },
    
    // POST /api/budgets - Create budget
    create: (data) => 
      request('/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // PUT /api/budgets/:id - Update budget
    update: (id, data) => 
      request(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // DELETE /api/budgets/:id - Delete budget
    delete: (id) => 
      request(`/budgets/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== GOALS ====================
  goals: {
    // GET /api/goals - List all goals
    getAll: () => 
      request('/goals'),
    
    // POST /api/goals - Create goal
    create: (data) => 
      request('/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // PUT /api/goals/:id - Update goal
    update: (id, data) => 
      request(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // POST /api/goals/:id/progress - Add progress to goal
    addProgress: (id, amount) => 
      request(`/goals/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
    
    // DELETE /api/goals/:id - Delete goal
    delete: (id) => 
      request(`/goals/${id}`, {
        method: 'DELETE',
      }),
  },

  // ==================== RECURRING TRANSACTIONS ====================
  recurring: {
    // GET /api/recurring - List all recurring transactions
    getAll: () => 
      request('/recurring'),
    
    // GET /api/recurring/upcoming - Get upcoming bills (next 30 days)
    getUpcoming: () => 
      request('/recurring/upcoming'),
    
    // POST /api/recurring - Create recurring transaction
    create: (data) => 
      request('/recurring', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id, data) => 
      request(`/recurring/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id) => 
      request(`/recurring/${id}`, {
        method: 'DELETE',
      }),
        deleteBulk: (ids) => 
      request('/recurring/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
  },

  dashboard: {
    getSummary: () => 
      request('/dashboard/summary'),
  },
  health: {
    check: () => 
      request('/health'),
  },
};

export default api;