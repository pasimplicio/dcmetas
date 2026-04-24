// Database module
// All data is stored in SQLite via the Express backend (server.js port 3001).
// This module is kept as a placeholder for potential future client-side caching.

import api from '../services/api.js';

export const getStats = async () => {
  return await api.get('/stats');
};

export default { getUrl: api.getUrl };
