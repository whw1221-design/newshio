import { api } from './client.js';

export const ordersApi = {
  list: (params) => api.get('/get_orders', params),
  get: (oid) => api.get(`/get_order/${oid}`),
  byUser: (uid) => api.get(`/get_orders/uid/${uid}`),
  byProduct: (pid) => api.get(`/get_orders/pid/${pid}`),
  create: (payload) => api.post('/add_order', payload),
  update: (oid, payload) => api.put(`/update_order/${oid}`, payload),
  remove: (oid) => api.delete(`/delete_order/${oid}`),
};
