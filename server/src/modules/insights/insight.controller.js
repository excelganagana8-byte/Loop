import * as insightService from './insight.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const getInsightsHandler = async (req, res, next) => {
  try {
    const insights = await insightService.getInsights(req.workspaceId);
    return sendSuccess(res, insights);
  } catch (err) {
    next(err);
  }
};

export const generateInsightsHandler = async (req, res, next) => {
  try {
    const insights = await insightService.generateInsights(req.workspaceId);
    return sendSuccess(res, insights, 201);
  } catch (err) {
    next(err);
  }
};
