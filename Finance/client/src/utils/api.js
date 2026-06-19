// client/src/utils/api.js
import useAuthStore from '../store/authStore';

// ✅ Keep /api in the base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Base request function with authentication
 */
const request = async (path, options = {}) => {
  const { token } = useAuthStore.getState();
  
  // ✅ No extra /api - API_URL already has it
  const url = `${API_URL}${path}`;
  
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

/**
 * API Methods - Only routes that exist in the backend
 */
export const api = {
  transactions: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/transactions${queryString ? `?${queryString}` : ''}`);
    },
    
    create: (data) => 
      request('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id, data) => 
      request(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id) => 
      request(`/transactions/${id}`, {
        method: 'DELETE',
      }),
    
    deleteBulk: (ids) => 
      request('/transactions/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
    
    getSummary: () => 
      request('/transactions/summary'),
  },

  budgets: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return request(`/budgets${queryString ? `?${queryString}` : ''}`);
    },
    
    create: (data) => 
      request('/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id, data) => 
      request(`/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id) => 
      request(`/budgets/${id}`, {
        method: 'DELETE',
      }),
  },

  goals: {
    getAll: () => 
      request('/goals'),
    
    create: (data) => 
      request('/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id, data) => 
      request(`/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    addProgress: (id, amount) => 
      request(`/goals/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
    
    delete: (id) => 
      request(`/goals/${id}`, {
        method: 'DELETE',
      }),
  },

  recurring: {
    getAll: () => 
      request('/recurring'),
    
    getUpcoming: () => 
      request('/recurring/upcoming'),
    
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
