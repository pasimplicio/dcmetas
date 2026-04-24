const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('adminToken');
  if (token) headers['x-admin-token'] = token;
  return headers;
};

const api = {
  get: async (path, params) => {
    const url = params 
      ? `${API_URL}${path}?${new URLSearchParams(params).toString()}` 
      : `${API_URL}${path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  post: async (path, body) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  download: (path, params) => {
    const url = params 
      ? `${API_URL}${path}?${new URLSearchParams(params).toString()}` 
      : `${API_URL}${path}`;
    window.location.href = url;
  },

  getUrl: () => API_URL
};

export default api;
