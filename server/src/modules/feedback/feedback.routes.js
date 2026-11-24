import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { handleCsvUpload } from '../../middleware/upload.js';
import { ROLES } from 'loop-shared';
import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
  listFeedbackQuerySchema
} from './feedback.validators.js';
import * as feedbackController from './feedback.controller.js';

const router = Router();

// Protect all feedback routes with JWT authentication
router.use(requireAuth);

router.post(
  '/',
  validate(createFeedbackSchema, 'body'),
  feedbackController.createFeedbackHandler
);

router.post(
  '/import',
  handleCsvUpload,
  feedbackController.importCsvHandler
);

router.get(
  '/',
  validate(listFeedbackQuerySchema, 'query'),
  feedbackController.listFeedbackHandler
);

router.get(
  '/:id',
  feedbackController.getFeedbackByIdHandler
);

router.patch(
  '/:id',
  validate(updateFeedbackStatusSchema, 'body'),
  feedbackController.updateFeedbackStatusHandler
);

router.delete(
  '/:id',
  requireRole([ROLES.OWNER, ROLES.ADMIN]),
  feedbackController.deleteFeedbackHandler
);

router.post(
  '/:id/analyze',
  feedbackController.analyzeFeedbackHandler
);

export default router;
