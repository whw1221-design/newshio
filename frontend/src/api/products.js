import { api } from './client.js';

export const productsApi = {
  list: (params) => api.get('/get_products', params),
  get: (pid) => api.get(`/get_product/${pid}`),
  create: (payload) => api.post('/add_product', payload),
  update: (pid, payload) => api.put(`/update_product/${pid}`, payload),
  remove: (pid) => api.delete(`/delete_product/${pid}`),
};
