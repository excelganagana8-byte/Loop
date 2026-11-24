import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { registerSchema, loginSchema } from './auth.validators.js';
import * as authController from './auth.controller.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema, 'body'),
  authController.registerHandler
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  authController.loginHandler
);

router.get(
  '/me',
  requireAuth,
  authController.getMeHandler
);

export default router;
