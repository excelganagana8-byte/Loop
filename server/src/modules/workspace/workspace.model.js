import mongoose from 'mongoose';
import { ROLE_LIST, ROLES } from 'loop-shared';

const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

const MembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: {
        values: ROLE_LIST,
        message: 'Invalid role'
      },
      default: ROLES.MEMBER,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

// Unique index: a user can only have one membership per workspace
MembershipSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export const Workspace = mongoose.model('Workspace', WorkspaceSchema);
export const Membership = mongoose.model('Membership', MembershipSchema);
