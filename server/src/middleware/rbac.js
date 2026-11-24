import { sendError } from '../utils/apiResponse.js';

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return sendError(res, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, 401);
    }

    if (!allowedRoles.includes(req.userRole)) {
      return sendError(res, {
        code: 'FORBIDDEN',
        message: `Action requires one of the following roles: ${allowedRoles.join(', ')}`
      }, 403);
    }

    next();
  };
};
