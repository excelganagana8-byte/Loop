import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../modules/auth/user.model.js';
import { Membership } from '../modules/workspace/workspace.model.js';
import { sendError } from '../utils/apiResponse.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. No Bearer token provided.'
      }, 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      return sendError(res, {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token.'
      }, 401);
    }

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return sendError(res, {
        code: 'UNAUTHORIZED',
        message: 'User account no longer exists.'
      }, 401);
    }

    // Resolve membership for workspace
    const membership = await Membership.findOne({
      userId: user._id,
      workspaceId: decoded.workspaceId
    }).lean();

    if (!membership) {
      return sendError(res, {
        code: 'UNAUTHORIZED',
        message: 'User is not a member of the requested workspace.'
      }, 401);
    }

    // Attach to request context
    req.user = user;
    req.membership = membership;
    req.workspaceId = membership.workspaceId;
    req.userRole = membership.role;

    next();
  } catch (err) {
    next(err);
  }
};
