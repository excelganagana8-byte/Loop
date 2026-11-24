import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    return sendError(res, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request input',
      details
    }, 400);
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, {
      code: 'NOT_FOUND',
      message: 'Resource not found'
    }, 404);
  }

  // Handle custom AppError
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 401 ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'Internal server error';

  const details = env.NODE_ENV === 'development' ? err.stack : undefined;

  return sendError(res, {
    code,
    message,
    details: details ? { stack: details } : undefined
  }, statusCode);
};
