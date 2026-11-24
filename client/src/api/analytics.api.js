import { apiClient } from './client.js';

export const getSummary = async () => {
  const response = await apiClient.get('/analytics/summary');
  return response.data;
};

export const getDistribution = async (params = {}) => {
  const response = await apiClient.get('/analytics/distribution', { params });
  return response.data;
};

export const getTrends = async (params = {}) => {
  const response = await apiClient.get('/analytics/trends', { params });
  return response.data;
};

export const getTopIssues = async () => {
  const response = await apiClient.get('/analytics/top-issues');
  return response.data;
};

export const getRecentFeedback = async () => {
  const response = await apiClient.get('/analytics/recent');
  return response.data;
};
