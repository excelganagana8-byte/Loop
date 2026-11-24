import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { User } from './user.model.js';
import { Workspace, Membership } from '../workspace/workspace.model.js';
import { ROLES } from 'loop-shared';

const generateSlug = (name) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || 'workspace'}-${randomSuffix}`;
};

export const generateToken = (userId, workspaceId) => {
  return jwt.sign(
    { userId: userId.toString(), workspaceId: workspaceId.toString() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

export const registerUser = async ({ name, email, password, workspaceName }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    error.code = 'EMAIL_EXISTS';
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash
  });

  // Create Workspace for the new user
  const wsName = workspaceName || `${name}'s Workspace`;
  const slug = generateSlug(wsName);

  const workspace = await Workspace.create({
    name: wsName,
    slug,
    ownerId: user._id
  });

  // Create Membership as OWNER
  const membership = await Membership.create({
    userId: user._id,
    workspaceId: workspace._id,
    role: ROLES.OWNER
  });

  const token = generateToken(user._id, workspace._id);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    },
    workspace: {
      _id: workspace._id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId
    },
    role: membership.role
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Find user's workspace membership (e.g. first/owner workspace)
  const membership = await Membership.findOne({ userId: user._id }).sort({ createdAt: 1 }).lean();
  if (!membership) {
    const error = new Error('User has no active workspace membership');
    error.statusCode = 403;
    error.code = 'NO_WORKSPACE';
    throw error;
  }

  const workspace = await Workspace.findById(membership.workspaceId).lean();
  if (!workspace) {
    const error = new Error('Workspace not found');
    error.statusCode = 404;
    error.code = 'WORKSPACE_NOT_FOUND';
    throw error;
  }

  const token = generateToken(user._id, workspace._id);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    },
    workspace: {
      _id: workspace._id,
      name: workspace.name,
      slug: workspace.slug,
      ownerId: workspace.ownerId
    },
    role: membership.role
  };
};

export const getMe = async (userId, workspaceId) => {
  const user = await User.findById(userId).select('-passwordHash').lean();
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(workspaceId).lean();
  const membership = await Membership.findOne({ userId, workspaceId }).lean();

  return {
    user,
    workspace,
    role: membership?.role || ROLES.MEMBER
  };
};
