import * as aiService from './ai.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const analyzeBatchHandler = async (req, res, next) => {
  try {
    const feedbackIds = req.body?.feedbackIds || null;
    const result = await aiService.analyzeBatch(req.workspaceId, feedbackIds);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
