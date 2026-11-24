import mongoose from 'mongoose';
import { Feedback } from './feedback.model.js';
import { analyzeFeedbackAsync } from '../ai/ai.service.js';

// Fallback ObjectId for testing fallback
export const DEFAULT_WORKSPACE_ID = new mongoose.Types.ObjectId('000000000000000000000001');

export const createFeedback = async (data, workspaceId = DEFAULT_WORKSPACE_ID, userId = null) => {
  const feedback = new Feedback({
    ...data,
    workspaceId,
    createdBy: userId,
    receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
    ai: {
      sentiment: 'UNKNOWN',
      category: 'OTHER',
      summary: '',
      keyPhrases: [],
      confidence: 0,
      status: 'PENDING'
    }
  });

  const saved = await feedback.save();

  // Async non-blocking fire-and-forget analysis pipeline (Section 6)
  analyzeFeedbackAsync(saved._id, workspaceId);

  return saved;
};

export const getFeedbackList = async (workspaceId = DEFAULT_WORKSPACE_ID, query = {}) => {
  const {
    q,
    source,
    sentiment,
    category,
    status,
    sort = '-receivedAt',
    page = 1,
    limit = 10
  } = query;

  const filter = { workspaceId };

  if (q && q.trim()) {
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { message: { $regex: escaped, $options: 'i' } },
      { customerName: { $regex: escaped, $options: 'i' } },
      { customerEmail: { $regex: escaped, $options: 'i' } }
    ];
  }

  if (source && source !== 'ALL') {
    filter.source = source;
  }

  if (status && status !== 'ALL') {
    filter.status = status;
  }

  if (sentiment && sentiment !== 'ALL') {
    filter['ai.sentiment'] = sentiment;
  }

  if (category && category !== 'ALL') {
    filter['ai.category'] = category;
  }

  const skip = (page - 1) * limit;

  // Sorting parser
  let sortOption = { receivedAt: -1 };
  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;
    sortOption = { [field]: isDesc ? -1 : 1 };
  }

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages
  };
};

export const getFeedbackById = async (id, workspaceId = DEFAULT_WORKSPACE_ID) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return await Feedback.findOne({ _id: id, workspaceId }).lean();
};

export const updateFeedbackStatus = async (id, status, workspaceId = DEFAULT_WORKSPACE_ID) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return await Feedback.findOneAndUpdate(
    { _id: id, workspaceId },
    { $set: { status } },
    { new: true, runValidators: true }
  ).lean();
};

export const deleteFeedback = async (id, workspaceId = DEFAULT_WORKSPACE_ID) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  const result = await Feedback.findOneAndDelete({ _id: id, workspaceId });
  return !!result;
};
