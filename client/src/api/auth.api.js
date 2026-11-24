import { apiClient } from './client.js';

export const registerUser = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
