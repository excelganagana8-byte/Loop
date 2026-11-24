import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { askLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validate.js';
import { askQuestionSchema } from './ask.validators.js';
import * as askController from './ask.controller.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  askLimiter,
  validate(askQuestionSchema, 'body'),
  askController.askHandler
);

export default router;
