import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROLES } from 'loop-shared';
import { Modal, Input, Select, Button } from '../../../components/ui/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { inviteWorkspaceMember } from '../../../api/workspace.api.js';
import { UserPlus, Mail } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  role: z.enum([ROLES.ADMIN, ROLES.MEMBER], {
    errorMap: () => ({ message: 'Please select a role' })
  })
});

const ROLE_OPTIONS = [
  { value: ROLES.MEMBER, label: 'MEMBER - Can submit feedback and edit statuses' },
  { value: ROLES.ADMIN, label: 'ADMIN - Can manage team members and delete feedback' }
];

export const InviteMemberModal = ({ isOpen, onClose, workspaceId, onMemberInvited }) => {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: ROLES.MEMBER
    }
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await inviteWorkspaceMember(workspaceId, values);
      addToast({
        type: 'success',
        title: 'Invitation Sent',
        message: `${values.email} has been added to the workspace as ${values.role}.`
      });
      reset();
      onClose();
      if (onMemberInvited) {
        onMemberInvited(res.data);
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Invite Failed',
        message: err.response?.data?.error?.message || err.message || 'Could not invite member'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Add a colleague to your workspace to collaborate on feedback triage and analytics."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Colleague Email *"
          type="email"
          placeholder="colleague@company.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Select
          label="Assigned Role *"
          options={ROLE_OPTIONS}
          error={errors.role?.message}
          {...register('role')}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={UserPlus}
            isLoading={submitting}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
