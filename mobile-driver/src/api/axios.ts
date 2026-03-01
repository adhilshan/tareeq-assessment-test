import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/env';

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (cfg) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export default api;
