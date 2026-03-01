import api from './axios';

export const getRequests = () => api.get('/api/v1/requests');
export const getRequest = (id) => api.get(`/api/v1/requests/${id}`);
export const createRequest = (data) => api.post('/api/v1/requests', data);
