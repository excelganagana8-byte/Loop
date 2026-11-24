import mongoose from 'mongoose';
import { Feedback } from '../feedback/feedback.model.js';

const getDateRangeFilter = (range) => {
  if (!range || range === 'all') return null;

  const now = new Date();
  let days = 30;
  if (range === '7d') days = 7;
  if (range === '90d') days = 90;

  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { $gte: cutoff };
};

/**
 * GET /api/analytics/summary
 * Total feedback, sentiment counts, status resolution rate, avg per day
 */
export const getSummary = async (workspaceId) => {
  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  const [sentimentAgg, statusAgg, timeAgg, totalCount] = await Promise.all([
    // Sentiment breakdown
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId } },
      { $group: { _id: '$ai.sentiment', count: { $sum: 1 } } }
    ]),
    // Status breakdown
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    // Time span for avg per day calculation
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId } },
      {
        $group: {
          _id: null,
          minDate: { $min: '$receivedAt' },
          maxDate: { $max: '$receivedAt' },
          count: { $sum: 1 }
        }
      }
    ]),
    // Total count
    Feedback.countDocuments({ workspaceId: wsObjectId })
  ]);

  const sentimentCounts = {
    POSITIVE: 0,
    NEGATIVE: 0,
    NEUTRAL: 0,
    UNKNOWN: 0
  };
  sentimentAgg.forEach((s) => {
    if (s._id && sentimentCounts[s._id] !== undefined) {
      sentimentCounts[s._id] = s.count;
    }
  });

  const statusCounts = {
    NEW: 0,
    IN_REVIEW: 0,
    RESOLVED: 0,
    ARCHIVED: 0
  };
  statusAgg.forEach((st) => {
    if (st._id && statusCounts[st._id] !== undefined) {
      statusCounts[st._id] = st.count;
    }
  });

  const resolved = statusCounts.RESOLVED || 0;
  const resolutionRate = totalCount > 0 ? Math.round((resolved / totalCount) * 100) : 0;

  // Avg per day
  let avgPerDay = 0;
  if (timeAgg.length > 0 && timeAgg[0].minDate && totalCount > 0) {
    const diffMs = Math.max(
      new Date().getTime() - new Date(timeAgg[0].minDate).getTime(),
      24 * 60 * 60 * 1000
    );
    const diffDays = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    avgPerDay = Number((totalCount / diffDays).toFixed(1));
  }

  return {
    total: totalCount,
    sentimentCounts,
    statusCounts,
    avgPerDay,
    resolutionRate
  };
};

/**
 * GET /api/analytics/distribution?by=sentiment|category|source&range=7d|30d|90d|all
 */
export const getDistribution = async (workspaceId, by = 'sentiment', range = '30d') => {
  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);
  const matchFilter = { workspaceId: wsObjectId };

  const dateFilter = getDateRangeFilter(range);
  if (dateFilter) {
    matchFilter.receivedAt = dateFilter;
  }

  let groupField = '$ai.sentiment';
  if (by === 'category') groupField = '$ai.category';
  if (by === 'source') groupField = '$source';

  const agg = await Feedback.aggregate([
    { $match: matchFilter },
    { $group: { _id: groupField, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const totalInFilter = agg.reduce((acc, curr) => acc + curr.count, 0);

  const data = agg.map((item) => ({
    name: item._id || 'OTHER',
    count: item.count,
    percentage: totalInFilter > 0 ? Math.round((item.count / totalInFilter) * 100) : 0
  }));

  return {
    by,
    range,
    total: totalInFilter,
    data
  };
};

/**
 * GET /api/analytics/trends?range=7d|30d|90d|all
 * Time series data grouped by day
 */
export const getTrends = async (workspaceId, range = '30d') => {
  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);
  const matchFilter = { workspaceId: wsObjectId };

  const dateFilter = getDateRangeFilter(range);
  if (dateFilter) {
    matchFilter.receivedAt = dateFilter;
  }

  const trends = await Feedback.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' }
        },
        total: { $sum: 1 },
        positive: {
          $sum: {
            $cond: [{ $eq: ['$ai.sentiment', 'POSITIVE'] }, 1, 0]
          }
        },
        negative: {
          $sum: {
            $cond: [{ $eq: ['$ai.sentiment', 'NEGATIVE'] }, 1, 0]
          }
        },
        neutral: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $eq: ['$ai.sentiment', 'NEUTRAL'] },
                  { $eq: ['$ai.sentiment', 'UNKNOWN'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return trends.map((t) => ({
    date: t._id,
    total: t.total,
    positive: t.positive,
    negative: t.negative,
    neutral: t.neutral
  }));
};

/**
 * GET /api/analytics/top-issues
 * Top categories and top key phrases with counts and sample feedback IDs
 */
export const getTopIssues = async (workspaceId) => {
  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  const [topCategories, topKeyPhrases] = await Promise.all([
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId, 'ai.category': { $exists: true, $ne: 'OTHER' } } },
      {
        $group: {
          _id: '$ai.category',
          count: { $sum: 1 },
          sampleIds: { $push: '$_id' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]),
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId, 'ai.keyPhrases.0': { $exists: true } } },
      { $unwind: '$ai.keyPhrases' },
      {
        $group: {
          _id: '$ai.keyPhrases',
          count: { $sum: 1 },
          sampleIds: { $push: '$_id' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    categories: topCategories.map((c) => ({
      category: c._id,
      count: c.count,
      sampleIds: c.sampleIds.slice(0, 3)
    })),
    keyPhrases: topKeyPhrases.map((k) => ({
      phrase: k._id,
      count: k.count,
      sampleIds: k.sampleIds.slice(0, 3)
    }))
  };
};

/**
 * GET /api/analytics/recent
 * Latest 10 feedback items for the workspace
 */
export const getRecentFeedback = async (workspaceId) => {
  return await Feedback.find({ workspaceId })
    .sort({ receivedAt: -1 })
    .limit(10)
    .lean();
};
