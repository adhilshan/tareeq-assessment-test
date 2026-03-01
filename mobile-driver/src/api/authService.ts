import api from './axios';

export const register = (data: object) => api.post('/api/v1/auth/register', data);
export const login = (data: object) => api.post('/api/v1/auth/login', data);
export const logout = () => api.post('/api/v1/auth/logout');
export const getMe = () => api.get('/api/v1/auth/me');
