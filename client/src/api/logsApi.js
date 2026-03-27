import axios from './axiosInstance';

// Accounting Periods
export const getPeriods = () => axios.get('/logs/periods').then(res => res.data);
export const closePeriod = (period_id) => axios.post('/logs/periods/close', { period_id }).then(res => res.data);

export const getGrnLogs = () => axios.get('/logs/grn').then(res => res.data);
export const addGrnLog = (data) => axios.post('/logs/grn', data).then(res => res.data);
export const deleteGrnLog = (id) => axios.delete(`/logs/grn/${id}`).then(res => res.data);

export const getIssueLogs = () => axios.get('/logs/issue').then(res => res.data);
export const addIssueLog = (data) => axios.post('/logs/issue', data).then(res => res.data);
export const deleteIssueLog = (id) => axios.delete(`/logs/issue/${id}`).then(res => res.data);

export const getAdjLogs = () => axios.get('/logs/adj').then(res => res.data);
export const addAdjLog = (data) => axios.post('/logs/adj', data).then(res => res.data);
export const deleteAdjLog = (id) => axios.delete(`/logs/adj/${id}`).then(res => res.data);

export const getUsageLogs = () => axios.get('/logs/usage').then(res => res.data);
export const addUsageLog = (data) => axios.post('/logs/usage', data).then(res => res.data);
export const deleteUsageLog = (id) => axios.delete(`/logs/usage/${id}`).then(res => res.data);

// Opening Balances
export const getOpeningBalances = () => axios.get('/opening-balances').then(res => res.data);
export const upsertOpeningBalance = (payload) => axios.post('/opening-balances', payload).then(res => res.data);

