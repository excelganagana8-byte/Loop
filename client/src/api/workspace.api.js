import { apiClient } from './client.js';

export const getWorkspaceMembers = async (workspaceId) => {
  const response = await apiClient.get(`/workspaces/${workspaceId}/members`);
  return response.data;
};

export const inviteWorkspaceMember = async (workspaceId, { email, role }) => {
  const response = await apiClient.post(`/workspaces/${workspaceId}/members/invite`, { email, role });
  return response.data;
};

export const updateWorkspaceMemberRole = async (workspaceId, userId, role) => {
  const response = await apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
  return response.data;
};

export const removeWorkspaceMember = async (workspaceId, userId) => {
  const response = await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`);
  return response.data;
};

export const updateWorkspaceName = async (workspaceId, name) => {
  const response = await apiClient.patch(`/workspaces/${workspaceId}`, { name });
  return response.data;
};
