import * as analyticsService from './analytics.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const getSummaryHandler = async (req, res, next) => {
  try {
    const summary = await analyticsService.getSummary(req.workspaceId);
    return sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

export const getDistributionHandler = async (req, res, next) => {
  try {
    const { by = 'sentiment', range = '30d' } = req.query;
    const distribution = await analyticsService.getDistribution(req.workspaceId, by, range);
    return sendSuccess(res, distribution);
  } catch (err) {
    next(err);
  }
};

export const getTrendsHandler = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const trends = await analyticsService.getTrends(req.workspaceId, range);
    return sendSuccess(res, trends);
  } catch (err) {
    next(err);
  }
};

export const getTopIssuesHandler = async (req, res, next) => {
  try {
    const topIssues = await analyticsService.getTopIssues(req.workspaceId);
    return sendSuccess(res, topIssues);
  } catch (err) {
    next(err);
  }
};

export const getRecentFeedbackHandler = async (req, res, next) => {
  try {
    const recent = await analyticsService.getRecentFeedback(req.workspaceId);
    return sendSuccess(res, recent);
  } catch (err) {
    next(err);
  }
};
