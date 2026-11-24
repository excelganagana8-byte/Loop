import { apiClient } from './client.js';

export const askQuestion = async ({ question, conversationId }) => {
  const response = await apiClient.post('/ask', { question, conversationId });
  return response.data;
};
