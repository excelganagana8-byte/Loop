import mongoose from 'mongoose';
import { INSIGHT_TYPE_LIST, INSIGHT_TYPES } from 'loop-shared';

const InsightSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: {
        values: INSIGHT_TYPE_LIST,
        message: 'Invalid insight type'
      },
      required: true
    },
    title: {
      type: String,
      required: [true, 'Insight title is required'],
      trim: true,
      maxlength: 200
    },
    body: {
      type: String,
      required: [true, 'Insight description is required'],
      trim: true,
      maxlength: 2000
    },
    evidence: {
      feedbackIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Feedback'
        }
      ],
      count: {
        type: Number,
        default: 0
      }
    },
    windowDays: {
      type: Number,
      default: 30
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

InsightSchema.index({ workspaceId: 1, generatedAt: -1 });

export const Insight = mongoose.model('Insight', InsightSchema);
