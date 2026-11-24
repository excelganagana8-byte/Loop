import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const registerHandler = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const loginHandler = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};

export const getMeHandler = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user._id, req.workspaceId);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};
