import { apiClient } from './client.js';

export const getFeedback = async (params = {}) => {
  const response = await apiClient.get('/feedback', { params });
  return response.data;
};

export const getFeedbackById = async (id) => {
  const response = await apiClient.get(`/feedback/${id}`);
  return response.data;
};

export const createFeedback = async (data) => {
  const response = await apiClient.post('/feedback', data);
  return response.data;
};

export const updateFeedbackStatus = async (id, status) => {
  const response = await apiClient.patch(`/feedback/${id}`, { status });
  return response.data;
};

export const deleteFeedback = async (id) => {
  const response = await apiClient.delete(`/feedback/${id}`);
  return response.data;
};

export const reanalyzeFeedback = async (id) => {
  const response = await apiClient.post(`/feedback/${id}/analyze`);
  return response.data;
};

export const analyzeBatch = async (feedbackIds = null) => {
  const response = await apiClient.post('/ai/analyze-batch', { feedbackIds });
  return response.data;
};

export const importCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/feedback/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};
