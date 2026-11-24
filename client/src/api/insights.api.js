import { apiClient } from './client.js';

export const getInsights = async () => {
  const response = await apiClient.get('/insights');
  return response.data;
};

export const generateInsights = async () => {
  const response = await apiClient.post('/insights/generate');
  return response.data;
};
