import * as askService from './ask.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const askHandler = async (req, res, next) => {
  try {
    const { question } = req.body;
    const result = await askService.askLoop(req.workspaceId, question);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
};
