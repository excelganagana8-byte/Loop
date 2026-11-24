import mongoose from 'mongoose';
import { Workspace, Membership } from './workspace.model.js';
import { User } from '../auth/user.model.js';
import bcrypt from 'bcryptjs';

export const getWorkspaceMembers = async (workspaceId) => {
  const memberships = await Membership.find({ workspaceId })
    .populate('userId', 'name email createdAt')
    .sort({ createdAt: 1 })
    .lean();

  return memberships.map((m) => ({
    membershipId: m._id,
    userId: m.userId?._id,
    name: m.userId?.name || 'Unknown',
    email: m.userId?.email || '',
    role: m.role,
    joinedAt: m.createdAt
  }));
};

export const inviteOrAddMember = async (workspaceId, { email, role }) => {
  let user = await User.findOne({ email });

  // If user doesn't exist, create an account with default password so they can be part of workspace
  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('loop123456', salt);
    user = await User.create({
      name: email.split('@')[0],
      email,
      passwordHash
    });
  }

  // Check if membership already exists in this workspace
  const existingMembership = await Membership.findOne({
    userId: user._id,
    workspaceId
  });

  if (existingMembership) {
    const error = new Error('User is already a member of this workspace');
    error.statusCode = 400;
    error.code = 'MEMBER_EXISTS';
    throw error;
  }

  const membership = await Membership.create({
    userId: user._id,
    workspaceId,
    role
  });

  return {
    membershipId: membership._id,
    userId: user._id,
    name: user.name,
    email: user.email,
    role: membership.role,
    joinedAt: membership.createdAt
  };
};

export const updateMemberRole = async (workspaceId, targetUserId, newRole) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return null;
  }

  const membership = await Membership.findOneAndUpdate(
    { workspaceId, userId: targetUserId },
    { $set: { role: newRole } },
    { new: true, runValidators: true }
  ).populate('userId', 'name email');

  if (!membership) {
    return null;
  }

  return {
    membershipId: membership._id,
    userId: membership.userId?._id,
    name: membership.userId?.name,
    email: membership.userId?.email,
    role: membership.role
  };
};

export const removeMember = async (workspaceId, targetUserId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return null;
  }

  const result = await Membership.findOneAndDelete({
    workspaceId,
    userId: targetUserId
  });

  return !!result;
};

export const updateWorkspace = async (workspaceId, { name }) => {
  return await Workspace.findByIdAndUpdate(
    workspaceId,
    { $set: { name } },
    { new: true }
  ).lean();
};
