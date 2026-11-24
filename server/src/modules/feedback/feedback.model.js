import mongoose from 'mongoose';
import {
  FEEDBACK_SOURCE_LIST,
  FEEDBACK_STATUS_LIST,
  AI_SENTIMENT_LIST,
  AI_CATEGORY_LIST,
  AI_STATUS_LIST
} from 'loop-shared';

const FeedbackSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 120
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    message: {
      type: String,
      required: [true, 'Feedback message is required'],
      trim: true,
      maxlength: [5000, 'Feedback message cannot exceed 5000 characters']
    },
    source: {
      type: String,
      enum: {
        values: FEEDBACK_SOURCE_LIST,
        message: 'Invalid feedback source'
      },
      required: [true, 'Feedback source is required']
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: {
        values: FEEDBACK_STATUS_LIST,
        message: 'Invalid feedback status'
      },
      default: 'NEW'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    ai: {
      sentiment: {
        type: String,
        enum: AI_SENTIMENT_LIST,
        default: 'UNKNOWN'
      },
      category: {
        type: String,
        enum: AI_CATEGORY_LIST,
        default: 'OTHER'
      },
      summary: {
        type: String,
        default: ''
      },
      keyPhrases: {
        type: [String],
        default: []
      },
      confidence: {
        type: Number,
        default: 0
      },
      analyzedAt: {
        type: Date,
        default: null
      },
      model: {
        type: String,
        default: ''
      },
      status: {
        type: String,
        enum: AI_STATUS_LIST,
        default: 'PENDING'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes required by Section 4
FeedbackSchema.index({ workspaceId: 1, receivedAt: -1 });
FeedbackSchema.index({ workspaceId: 1, status: 1 });
FeedbackSchema.index({ workspaceId: 1, source: 1 });
FeedbackSchema.index({ workspaceId: 1, 'ai.sentiment': 1 });

// Text index for keyword search across message & customerName
FeedbackSchema.index({ message: 'text', customerName: 'text' });

export const Feedback = mongoose.model('Feedback', FeedbackSchema);
