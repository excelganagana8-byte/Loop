import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { Feedback } from '../feedback/feedback.model.js';
import { aiAnalysisOutputSchema } from './ai.validators.js';

let anthropicClient = null;

export const getAnthropicClient = () => {
  if (!env.ANTHROPIC_API_KEY || !env.ANTHROPIC_API_KEY.trim()) {
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY
    });
  }
  return anthropicClient;
};

// Export tool definition for structured tool use
export const FEEDBACK_CLASSIFIER_TOOL = {
  name: 'classify_customer_feedback',
  description: 'Analyze and classify customer feedback into structured intelligence: sentiment, category, one-line summary, and key phrases.',
  input_schema: {
    type: 'object',
    properties: {
      sentiment: {
        type: 'string',
        enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
        description: 'Overall emotional tone of the feedback'
      },
      category: {
        type: 'string',
        enum: [
          'BUG',
          'FEATURE_REQUEST',
          'PRICING',
          'USABILITY',
          'CUSTOMER_SUPPORT',
          'PERFORMANCE',
          'PRAISE',
          'OTHER'
        ],
        description: 'Primary feedback category'
      },
      summary: {
        type: 'string',
        description: 'Concise, objective one-line summary of what the customer is expressing (max 200 chars)'
      },
      keyPhrases: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of 3 to 6 key terms or phrases mentioned in the feedback'
      },
      confidence: {
        type: 'number',
        description: 'Confidence score between 0.0 and 1.0 in this classification'
      }
    },
    required: ['sentiment', 'category', 'summary', 'keyPhrases', 'confidence']
  }
};

/**
 * Calls Anthropic API to classify a feedback message with structured tool output.
 * Retries once on validation error.
 */
export const classifyFeedbackWithClaude = async (message, customerName, clientInstance = null) => {
  const client = clientInstance || getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key is not configured');
  }

  const model = env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  const systemPrompt = `You are the AI Intelligence Engine for LOOP, a customer-feedback platform.
Your task is to analyze raw customer feedback and return structured classification through the classify_customer_feedback tool.
Always be objective, concise, and accurate. Do not invent details not present in the customer message.`;

  const userPrompt = `Customer: ${customerName || 'Anonymous'}
Feedback Message:
"""
${message}
"""

Please classify this feedback.`;

  const makeApiCall = async () => {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [FEEDBACK_CLASSIFIER_TOOL],
      tool_choice: { type: 'tool', name: 'classify_customer_feedback' },
      messages: [{ role: 'user', content: userPrompt }]
    });

    const toolUseBlock = response.content?.find((block) => block.type === 'tool_use');
    if (!toolUseBlock || !toolUseBlock.input) {
      throw new Error('Claude response did not contain expected tool_use block');
    }

    // Validate with Zod
    return aiAnalysisOutputSchema.parse(toolUseBlock.input);
  };

  try {
    return await makeApiCall();
  } catch (firstErr) {
    console.warn(`[AI Service] First attempt failed: ${firstErr.message}. Retrying once...`);
    // Retry once per Section 6 rules
    return await makeApiCall();
  }
};

/**
 * Core function to analyze a single feedback document by ID.
 * Updates the document with result or marks FAILED if unavailable.
 */
export const analyzeFeedbackItem = async (feedbackId, workspaceId, clientInstance = null) => {
  const feedback = await Feedback.findOne({ _id: feedbackId, workspaceId });
  if (!feedback) {
    return null;
  }

  const client = clientInstance || getAnthropicClient();
  if (!client) {
    // Fallback mode: Mark as FAILED, never invent fake data
    feedback.ai = {
      sentiment: 'UNKNOWN',
      category: 'OTHER',
      summary: '',
      keyPhrases: [],
      confidence: 0,
      analyzedAt: new Date(),
      model: '',
      status: 'FAILED'
    };
    await feedback.save();
    return feedback;
  }

  try {
    const classification = await classifyFeedbackWithClaude(
      feedback.message,
      feedback.customerName,
      client
    );

    feedback.ai = {
      sentiment: classification.sentiment,
      category: classification.category,
      summary: classification.summary,
      keyPhrases: classification.keyPhrases,
      confidence: classification.confidence,
      analyzedAt: new Date(),
      model: env.ANTHROPIC_MODEL,
      status: 'DONE'
    };
    await feedback.save();
    return feedback;
  } catch (err) {
    console.error(`[AI Service] Analysis failed for feedback ${feedbackId}:`, err.message);
    feedback.ai = {
      sentiment: 'UNKNOWN',
      category: 'OTHER',
      summary: '',
      keyPhrases: [],
      confidence: 0,
      analyzedAt: new Date(),
      model: env.ANTHROPIC_MODEL,
      status: 'FAILED'
    };
    await feedback.save();
    return feedback;
  }
};

/**
 * Non-blocking fire-and-forget async execution for feedback creation pipeline
 */
export const analyzeFeedbackAsync = (feedbackId, workspaceId) => {
  setImmediate(async () => {
    try {
      await analyzeFeedbackItem(feedbackId, workspaceId);
    } catch (err) {
      console.error(`[AI Async Pipeline] Background error for ${feedbackId}:`, err.message);
    }
  });
};

/**
 * Batch analysis for up to 25 unanalyzed items in workspace
 */
export const analyzeBatch = async (workspaceId, feedbackIds = null, clientInstance = null) => {
  const query = {
    workspaceId
  };

  if (feedbackIds && feedbackIds.length > 0) {
    query._id = { $in: feedbackIds };
  } else {
    // Process items that are PENDING or FAILED
    query['ai.status'] = { $in: ['PENDING', 'FAILED'] };
  }

  const items = await Feedback.find(query).limit(25);

  const results = {
    total: items.length,
    successful: 0,
    failed: 0,
    processedIds: []
  };

  for (const item of items) {
    try {
      const updated = await analyzeFeedbackItem(item._id, workspaceId, clientInstance);
      if (updated && updated.ai.status === 'DONE') {
        results.successful++;
      } else {
        results.failed++;
      }
      results.processedIds.push(item._id);

      // Brief 150ms delay between items to avoid hammering API rate limits
      await new Promise((r) => setTimeout(r, 150));
    } catch (err) {
      results.failed++;
    }
  }

  return results;
};
