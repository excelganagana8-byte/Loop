import { z } from 'zod';
import { ROLE_LIST } from 'loop-shared';

export const inviteMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  role: z.enum(ROLE_LIST, {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(ROLE_LIST, {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Workspace name must be at least 2 characters').max(100)
});
