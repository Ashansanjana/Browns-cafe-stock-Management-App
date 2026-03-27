import api from './axiosInstance';
export const addStock = (data) => api.post('/stock/add', data).then(r => r.data);
export const transferStock = (data) => api.post('/stock/transfer', data).then(r => r.data);
export const updateStockQty = (data) => api.put('/stock/update', data).then(r => r.data);
export const removeStock = (data) => api.delete('/stock/remove', { data }).then(r => r.data);
