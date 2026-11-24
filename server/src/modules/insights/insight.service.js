import mongoose from 'mongoose';
import { Insight } from './insight.model.js';
import { Feedback } from '../feedback/feedback.model.js';
import { getAnthropicClient } from '../ai/ai.service.js';
import { INSIGHT_TYPES } from 'loop-shared';
import { env } from '../../config/env.js';

export const getInsights = async (workspaceId) => {
  return await Insight.find({ workspaceId })
    .sort({ generatedAt: -1, type: 1 })
    .lean();
};

export const generateInsights = async (workspaceId) => {
  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  // 1. Collect real workspace feedback intelligence
  const [categoryAgg, phraseAgg, totalFeedback, sampleFeedback] = await Promise.all([
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId } },
      { $group: { _id: '$ai.category', count: { $sum: 1 }, sampleIds: { $push: '$_id' } } },
      { $sort: { count: -1 } }
    ]),
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId, 'ai.keyPhrases.0': { $exists: true } } },
      { $unwind: '$ai.keyPhrases' },
      { $group: { _id: '$ai.keyPhrases', count: { $sum: 1 }, sampleIds: { $push: '$_id' } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    Feedback.countDocuments({ workspaceId: wsObjectId }),
    Feedback.find({ workspaceId: wsObjectId }).sort({ receivedAt: -1 }).limit(15).lean()
  ]);

  if (totalFeedback === 0) {
    return [];
  }

  const generatedInsights = [];
  const client = getAnthropicClient();

  // Try Claude AI Generation first if key is present
  if (client) {
    try {
      const statsContext = {
        totalCount: totalFeedback,
        categories: categoryAgg.map(c => ({ category: c._id, count: c.count })),
        topKeywords: phraseAgg.map(p => ({ keyword: p._id, count: p.count })),
        recentSnippets: sampleFeedback.map(f => ({
          id: f._id.toString(),
          category: f.ai?.category,
          sentiment: f.ai?.sentiment,
          text: f.message.substring(0, 150)
        }))
      };

      const systemPrompt = `You are LOOP's executive Intelligence Strategist.
Generate 3 to 5 grounded strategic insights (THEME, TREND, RECOMMENDATION) based solely on the provided customer feedback data.
Always cite real counts and real feedback IDs provided in the context.`;

      const response = await client.messages.create({
        model: env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        tools: [
          {
            name: 'submit_insights',
            description: 'Output strategic insights for the customer feedback workspace',
            input_schema: {
              type: 'object',
              properties: {
                insights: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['THEME', 'TREND', 'RECOMMENDATION'] },
                      title: { type: 'string' },
                      body: { type: 'string' },
                      evidenceFeedbackIds: { type: 'array', items: { type: 'string' } },
                      evidenceCount: { type: 'number' }
                    },
                    required: ['type', 'title', 'body', 'evidenceFeedbackIds', 'evidenceCount']
                  }
                }
              },
              required: ['insights']
            }
          }
        ],
        tool_choice: { type: 'tool', name: 'submit_insights' },
        messages: [{ role: 'user', content: JSON.stringify(statsContext) }]
      });

      const toolUse = response.content?.find(b => b.type === 'tool_use');
      if (toolUse && toolUse.input?.insights) {
        for (const item of toolUse.input.insights) {
          const validIds = (item.evidenceFeedbackIds || [])
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

          generatedInsights.push({
            workspaceId,
            type: item.type,
            title: item.title,
            body: item.body,
            evidence: {
              feedbackIds: validIds,
              count: item.evidenceCount || validIds.length
            },
            windowDays: 30,
            generatedAt: new Date()
          });
        }
      }
    } catch (aiErr) {
      console.warn('[Insight Service] Claude generation failed, falling back to data-driven generation:', aiErr.message);
    }
  }

  // Fallback: Data-driven generation directly from MongoDB aggregation evidence
  if (generatedInsights.length === 0) {
    // 1. Theme: Top issue / bug category
    const bugCategory = categoryAgg.find(c => c._id === 'BUG') || categoryAgg[0];
    if (bugCategory) {
      generatedInsights.push({
        workspaceId,
        type: INSIGHT_TYPES.THEME,
        title: `Persistent friction concentrated in ${bugCategory._id.replace(/_/g, ' ')} reports`,
        body: `Customers have logged ${bugCategory.count} distinct feedback items classified under ${bugCategory._id.replace(/_/g, ' ')}. Immediate review of error logs and user onboarding paths is advised.`,
        evidence: {
          feedbackIds: bugCategory.sampleIds.slice(0, 5),
          count: bugCategory.count
        },
        windowDays: 30,
        generatedAt: new Date()
      });
    }

    // 2. Trend: Top keyword or feature request
    const topPhrase = phraseAgg[0];
    const featCategory = categoryAgg.find(c => c._id === 'FEATURE_REQUEST');
    if (topPhrase) {
      generatedInsights.push({
        workspaceId,
        type: INSIGHT_TYPES.TREND,
        title: `Rising demand regarding "${topPhrase._id}"`,
        body: `Mentions of "${topPhrase._id}" have appeared across ${topPhrase.count} separate customer submissions in the recent evaluation window.`,
        evidence: {
          feedbackIds: topPhrase.sampleIds.slice(0, 5),
          count: topPhrase.count
        },
        windowDays: 30,
        generatedAt: new Date()
      });
    } else if (featCategory) {
      generatedInsights.push({
        workspaceId,
        type: INSIGHT_TYPES.TREND,
        title: `Increasing volume of Feature Requests (${featCategory.count} items)`,
        body: `Customers are actively requesting product enhancements, highlighting high engagement and growth potential.`,
        evidence: {
          feedbackIds: featCategory.sampleIds.slice(0, 5),
          count: featCategory.count
        },
        windowDays: 30,
        generatedAt: new Date()
      });
    }

    // 3. Recommendation: Actionable remediation
    const praiseCategory = categoryAgg.find(c => c._id === 'PRAISE');
    generatedInsights.push({
      workspaceId,
      type: INSIGHT_TYPES.RECOMMENDATION,
      title: 'Prioritize resolution workflows for critical customer friction points',
      body: `Cross-functional triage between engineering and product support should focus on the top recurring issue clusters. ${praiseCategory ? `Maintain velocity on praised features (${praiseCategory.count} praise items).` : ''}`,
      evidence: {
        feedbackIds: sampleFeedback.slice(0, 3).map(s => s._id),
        count: totalFeedback
      },
      windowDays: 30,
      generatedAt: new Date()
    });
  }

  // Clear previous insights for this workspace and insert new ones
  await Insight.deleteMany({ workspaceId });
  return await Insight.insertMany(generatedInsights);
};
