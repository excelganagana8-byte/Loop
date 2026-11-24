import * as workspaceService from './workspace.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const getMembersHandler = async (req, res, next) => {
  try {
    // If route workspace :id is requested, ensure caller belongs to that workspace
    if (req.params.id !== req.workspaceId.toString()) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Workspace not found' }, 404);
    }

    const members = await workspaceService.getWorkspaceMembers(req.workspaceId);
    return sendSuccess(res, members);
  } catch (err) {
    next(err);
  }
};

export const inviteMemberHandler = async (req, res, next) => {
  try {
    if (req.params.id !== req.workspaceId.toString()) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Workspace not found' }, 404);
    }

    const member = await workspaceService.inviteOrAddMember(req.workspaceId, req.body);
    return sendSuccess(res, member, 201);
  } catch (err) {
    next(err);
  }
};

export const updateMemberRoleHandler = async (req, res, next) => {
  try {
    if (req.params.id !== req.workspaceId.toString()) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Workspace not found' }, 404);
    }

    const updated = await workspaceService.updateMemberRole(
      req.workspaceId,
      req.params.userId,
      req.body.role
    );

    if (!updated) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Member not found in workspace' }, 404);
    }

    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};

export const removeMemberHandler = async (req, res, next) => {
  try {
    if (req.params.id !== req.workspaceId.toString()) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Workspace not found' }, 404);
    }

    // Prevent removing oneself if owner
    if (req.params.userId === req.user._id.toString() && req.userRole === 'OWNER') {
      return sendError(res, {
        code: 'BAD_REQUEST',
        message: 'Workspace owner cannot remove themselves from the workspace'
      }, 400);
    }

    const removed = await workspaceService.removeMember(req.workspaceId, req.params.userId);
    if (!removed) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Member not found in workspace' }, 404);
    }

    return sendSuccess(res, { removed: true });
  } catch (err) {
    next(err);
  }
};

export const updateWorkspaceHandler = async (req, res, next) => {
  try {
    if (req.params.id !== req.workspaceId.toString()) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Workspace not found' }, 404);
    }

    const workspace = await workspaceService.updateWorkspace(req.workspaceId, req.body);
    return sendSuccess(res, workspace);
  } catch (err) {
    next(err);
  }
};
