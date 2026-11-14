import { api } from './client.js';

export const usersApi = {
  list: (params) => api.get('/get_users', params),
  get: (uid) => api.get(`/get_user/${uid}`),
  create: (payload) => api.post('/add_user', payload),
  update: (uid, payload) => api.put(`/update_user/${uid}`, payload),
  remove: (uid) => api.delete(`/delete_user/${uid}`),
};
