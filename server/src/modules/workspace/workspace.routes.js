import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from 'loop-shared';
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema
} from './workspace.validators.js';
import * as workspaceController from './workspace.controller.js';

const router = Router();

// All workspace routes require authentication
router.use(requireAuth);

router.get(
  '/:id/members',
  workspaceController.getMembersHandler
);

router.post(
  '/:id/members/invite',
  requireRole([ROLES.OWNER, ROLES.ADMIN]),
  validate(inviteMemberSchema, 'body'),
  workspaceController.inviteMemberHandler
);

router.patch(
  '/:id/members/:userId',
  requireRole([ROLES.OWNER, ROLES.ADMIN]),
  validate(updateMemberRoleSchema, 'body'),
  workspaceController.updateMemberRoleHandler
);

router.delete(
  '/:id/members/:userId',
  requireRole([ROLES.OWNER, ROLES.ADMIN]),
  workspaceController.removeMemberHandler
);

router.patch(
  '/:id',
  requireRole([ROLES.OWNER, ROLES.ADMIN]),
  validate(updateWorkspaceSchema, 'body'),
  workspaceController.updateWorkspaceHandler
);

export default router;
