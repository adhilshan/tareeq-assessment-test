import api from './axios';

export const getRequests = (lat?: number, lng?: number) => api.get('/api/v1/requests', { params: { lat, lng } });
export const getRequest = (id: number) => api.get(`/api/v1/requests/${id}`);
export const acceptRequest = (id: number) => api.post(`/api/v1/requests/${id}/accept`);
export const rejectRequest = (id: number) => api.post(`/api/v1/requests/${id}/reject`);
export const completeRequest = (id: number) => api.post(`/api/v1/requests/${id}/complete`);
