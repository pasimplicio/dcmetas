// Database module
// All data is stored in SQLite via the Express backend (server.js port 3001).
// This module is kept as a placeholder for potential future client-side caching.

const API_URL = 'http://localhost:3001/api';

export const getStats = async () => {
  const res = await fetch(`${API_URL}/stats`);
  return await res.json();
};

export default { API_URL };
