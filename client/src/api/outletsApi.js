import api from './axiosInstance';
export const getOutlets = () => api.get('/outlets').then(r => r.data);
export const getOutlet = (id) => api.get(`/outlets/${id}`).then(r => r.data);
export const getOutletStock = (id) => api.get(`/outlets/${id}/stock`).then(r => r.data);
