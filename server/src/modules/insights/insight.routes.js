import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as insightController from './insight.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', insightController.getInsightsHandler);
router.post('/generate', insightController.generateInsightsHandler);

export default router;
