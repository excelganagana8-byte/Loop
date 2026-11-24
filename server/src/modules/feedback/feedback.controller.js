import * as feedbackService from './feedback.service.js';
import * as aiService from '../ai/ai.service.js';
import * as csvService from './csv.service.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

export const createFeedbackHandler = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId || feedbackService.DEFAULT_WORKSPACE_ID;
    const userId = req.user?._id || null;

    const feedback = await feedbackService.createFeedback(req.body, workspaceId, userId);

    return sendSuccess(res, feedback, 201);
  } catch (err) {
    next(err);
  }
};

export const listFeedbackHandler = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId || feedbackService.DEFAULT_WORKSPACE_ID;
    const result = await feedbackService.getFeedbackList(workspaceId, req.query);

    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getFeedbackByIdHandler = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId || feedbackService.DEFAULT_WORKSPACE_ID;
    const item = await feedbackService.getFeedbackById(req.params.id, workspaceId);

    if (!item) {
      // Must return 404, not 403 (don't leak existence per Section 3 rule 2)
      return sendError(res, {
        code: 'NOT_FOUND',
        message: 'Feedback not found'
      }, 404);
    }

    return sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
};

export const updateFeedbackStatusHandler = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId || feedbackService.DEFAULT_WORKSPACE_ID;
    const updated = await feedbackService.updateFeedbackStatus(
      req.params.id,
      req.body.status,
      workspaceId
    );

    if (!updated) {
      return sendError(res, {
        code: 'NOT_FOUND',
        message: 'Feedback not found'
      }, 404);
    }

    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};

export const deleteFeedbackHandler = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId || feedbackService.DEFAULT_WORKSPACE_ID;
    const deleted = await feedbackService.deleteFeedback(req.params.id, workspaceId);

    if (!deleted) {
      return sendError(res, {
        code: 'NOT_FOUND',
        message: 'Feedback not found'
      }, 404);
    }

    return sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};

export const analyzeFeedbackHandler = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId || feedbackService.DEFAULT_WORKSPACE_ID;
    const updated = await aiService.analyzeFeedbackItem(req.params.id, workspaceId);

    if (!updated) {
      return sendError(res, {
        code: 'NOT_FOUND',
        message: 'Feedback not found'
      }, 404);
    }

    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
};

export const importCsvHandler = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId || feedbackService.DEFAULT_WORKSPACE_ID;
    const userId = req.user?._id || null;

    const result = await csvService.parseAndImportCsv(req.file.buffer, workspaceId, userId);

    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};
