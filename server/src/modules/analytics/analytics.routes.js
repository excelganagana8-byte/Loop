import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { distributionQuerySchema, trendsQuerySchema } from './analytics.validators.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', analyticsController.getSummaryHandler);

router.get(
  '/distribution',
  validate(distributionQuerySchema, 'query'),
  analyticsController.getDistributionHandler
);

router.get(
  '/trends',
  validate(trendsQuerySchema, 'query'),
  analyticsController.getTrendsHandler
);

router.get('/top-issues', analyticsController.getTopIssuesHandler);

router.get('/recent', analyticsController.getRecentFeedbackHandler);

export default router;
