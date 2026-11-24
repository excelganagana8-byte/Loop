import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { batchAnalyzeSchema } from './ai.validators.js';
import * as aiController from './ai.controller.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/analyze-batch',
  validate(batchAnalyzeSchema, 'body'),
  aiController.analyzeBatchHandler
);

export default router;
