import mongoose from 'mongoose';
import { Feedback } from '../feedback/feedback.model.js';
import { getAnthropicClient } from '../ai/ai.service.js';
import { env } from '../../config/env.js';

/**
 * Step 1: Precompute workspace statistics server-side in code
 */
export const precomputeWorkspaceStats = async (workspaceId) => {
  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  const [totalCount, sentimentAgg, categoryAgg, dateSpanAgg] = await Promise.all([
    Feedback.countDocuments({ workspaceId: wsObjectId }),
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId } },
      { $group: { _id: '$ai.sentiment', count: { $sum: 1 } } }
    ]),
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId } },
      { $group: { _id: '$ai.category', count: { $sum: 1 } } }
    ]),
    Feedback.aggregate([
      { $match: { workspaceId: wsObjectId } },
      {
        $group: {
          _id: null,
          earliest: { $min: '$receivedAt' },
          latest: { $max: '$receivedAt' }
        }
      }
    ])
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

  const categoryCounts = {};
  categoryAgg.forEach((c) => {
    if (c._id) {
      categoryCounts[c._id] = c.count;
    }
  });

  return {
    totalCount,
    sentimentCounts,
    categoryCounts,
    earliestDate: dateSpanAgg[0]?.earliest || null,
    latestDate: dateSpanAgg[0]?.latest || null
  };
};

/**
 * Step 2: Retrieve ~20 relevant feedback items for the question
 */
export const retrieveRelevantFeedback = async (workspaceId, question) => {
  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  // Extract keywords (filter common stopwords)
  const stopwords = new Set([
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at',
    'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
    'now', 'tell', 'me', 'our', 'customers', 'feedback', 'say', 'saying'
  ]);

  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  let matchedItems = [];

  if (words.length > 0) {
    const regexPattern = words.join('|');
    matchedItems = await Feedback.find({
      workspaceId: wsObjectId,
      $or: [
        { message: { $regex: regexPattern, $options: 'i' } },
        { customerName: { $regex: regexPattern, $options: 'i' } },
        { 'ai.keyPhrases': { $in: words.map((w) => new RegExp(w, 'i')) } }
      ]
    })
      .sort({ receivedAt: -1 })
      .limit(20)
      .lean();
  }

  // If fewer than 20 items matched keywords, supplement with most recent feedback
  if (matchedItems.length < 20) {
    const existingIds = matchedItems.map((m) => m._id);
    const filler = await Feedback.find({
      workspaceId: wsObjectId,
      _id: { $nin: existingIds }
    })
      .sort({ receivedAt: -1 })
      .limit(20 - matchedItems.length)
      .lean();

    matchedItems = [...matchedItems, ...filler];
  }

  return matchedItems;
};

/**
 * Step 3 & 4: Execute Ask LOOP Q&A with grounded retrieval and citation verification
 */
export const askLoop = async (workspaceId, question, clientInstance = null) => {
  // Step 1: Precomputed stats
  const stats = await precomputeWorkspaceStats(workspaceId);

  // If workspace is completely empty
  if (stats.totalCount === 0) {
    return {
      answer: 'There is not enough customer feedback data in this workspace to answer this question. Please submit or import feedback first.',
      citations: [],
      grounded: true
    };
  }

  // Step 2: Retrieve relevant items
  const retrievedItems = await retrieveRelevantFeedback(workspaceId, question);
  const retrievedMap = new Map();
  retrievedItems.forEach((item) => {
    retrievedMap.set(item._id.toString(), item);
  });

  const client = clientInstance || getAnthropicClient();

  // If Claude client is available
  if (client) {
    try {
      const itemsContext = retrievedItems.map((it) => ({
        id: it._id.toString(),
        customer: it.customerName,
        source: it.source,
        sentiment: it.ai?.sentiment || 'UNKNOWN',
        category: it.ai?.category || 'OTHER',
        summary: it.ai?.summary || '',
        message: it.message
      }));

      const systemPrompt = `You are "Ask LOOP", an AI analytics assistant answering questions strictly grounded in customer feedback for this workspace.

CRITICAL RULES:
1. Answer ONLY using the Precomputed Statistics and Retrieved Items below.
2. If the data is insufficient to answer the question, state explicitly: "There is not enough customer feedback data in this workspace to answer this question."
3. NEVER invent or hallucinate metrics, counts, or feedback quotes.
4. When citing feedback, specify the feedback IDs in the citedFeedbackIds parameter of the submit_answer tool.
5. If you state any counts, they must match the Precomputed Statistics provided.`;

      const userContent = `PRECOMPUTED WORKSPACE STATISTICS:
- Total Feedback Items: ${stats.totalCount}
- Sentiment Breakdown: Positive: ${stats.sentimentCounts.POSITIVE}, Negative: ${stats.sentimentCounts.NEGATIVE}, Neutral/Unknown: ${stats.sentimentCounts.NEUTRAL + stats.sentimentCounts.UNKNOWN}
- Category Counts: ${JSON.stringify(stats.categoryCounts)}
- Date Range: ${stats.earliestDate ? new Date(stats.earliestDate).toISOString().split('T')[0] : 'N/A'} to ${stats.latestDate ? new Date(stats.latestDate).toISOString().split('T')[0] : 'N/A'}

RETRIEVED FEEDBACK ITEMS (${itemsContext.length} items):
${JSON.stringify(itemsContext, null, 2)}

USER QUESTION:
"${question}"`;

      const response = await client.messages.create({
        model: env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        tools: [
          {
            name: 'submit_answer',
            description: 'Submit the grounded answer with citations and verified counts',
            input_schema: {
              type: 'object',
              properties: {
                answer: {
                  type: 'string',
                  description: 'The grounded answer explaining the findings.'
                },
                citedFeedbackIds: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of feedback IDs cited in your answer'
                },
                grounded: {
                  type: 'boolean',
                  description: 'True if fully grounded in the provided data, false if data was insufficient'
                }
              },
              required: ['answer', 'citedFeedbackIds']
            }
          }
        ],
        tool_choice: { type: 'tool', name: 'submit_answer' },
        messages: [{ role: 'user', content: userContent }]
      });

      const toolUse = response.content?.find((b) => b.type === 'tool_use');
      if (toolUse && toolUse.input?.answer) {
        const rawCitedIds = toolUse.input.citedFeedbackIds || [];
        const citations = [];

        // Verify citations against retrieved items
        for (const cid of rawCitedIds) {
          const matched = retrievedMap.get(cid);
          if (matched) {
            citations.push({
              feedbackId: matched._id,
              customerName: matched.customerName,
              snippet: matched.message.length > 120 ? `${matched.message.substring(0, 120)}...` : matched.message
            });
          }
        }

        return {
          answer: toolUse.input.answer,
          citations,
          grounded: toolUse.input.grounded !== false
        };
      }
    } catch (apiErr) {
      console.warn('[Ask LOOP] Anthropic call failed, utilizing grounded fallback synthesis:', apiErr.message);
    }
  }

  // Fallback Mode: Grounded deterministic synthesis directly from precomputed stats & retrieved items
  const citations = retrievedItems.slice(0, 4).map((it) => ({
    feedbackId: it._id,
    customerName: it.customerName,
    snippet: it.message.length > 120 ? `${it.message.substring(0, 120)}...` : it.message
  }));

  const topCategories = Object.entries(stats.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => `${cat.replace(/_/g, ' ')} (${count})`)
    .join(', ');

  const answer = `Based on your workspace's ${stats.totalCount} customer feedback items (${stats.sentimentCounts.POSITIVE} positive, ${stats.sentimentCounts.NEGATIVE} negative, ${stats.sentimentCounts.NEUTRAL} neutral):

The most prominent feedback categories are ${topCategories || 'general inquiries'}. Regarding your question ("${question}"), we identified ${retrievedItems.length} relevant feedback records in your workspace. Review the cited feedback snippets below for direct customer evidence.`;

  return {
    answer,
    citations,
    grounded: true
  };
};
