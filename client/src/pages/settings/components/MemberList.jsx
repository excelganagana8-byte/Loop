import React, { useState } from 'react';
import { ROLES } from 'loop-shared';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button
} from '../../../components/ui/index.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { updateWorkspaceMemberRole, removeWorkspaceMember } from '../../../api/workspace.api.js';
import { Trash2, Shield, User, Crown } from 'lucide-react';

export const MemberList = ({
  members = [],
  workspaceId,
  currentUserId,
  currentUserRole,
  onMembersChange
}) => {
  const { addToast } = useToast();
  const [actionLoading, setActionLoading] = useState(null);

  const canManage = currentUserRole === ROLES.OWNER || currentUserRole === ROLES.ADMIN;

  const handleRoleChange = async (targetUserId, newRole) => {
    setActionLoading(targetUserId);
    try {
      await updateWorkspaceMemberRole(workspaceId, targetUserId, newRole);
      addToast({
        type: 'success',
        title: 'Role Updated',
        message: `Member role successfully updated to ${newRole}.`
      });
      if (onMembersChange) {
        onMembersChange();
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error?.message || 'Could not change member role'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName || 'this user'} from the workspace?`)) {
      return;
    }
    setActionLoading(targetUserId);
    try {
      await removeWorkspaceMember(workspaceId, targetUserId);
      addToast({
        type: 'success',
        title: 'Member Removed',
        message: `${targetName || 'User'} has been removed from this workspace.`
      });
      if (onMembersChange) {
        onMembersChange();
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Removal Failed',
        message: err.response?.data?.error?.message || 'Could not remove member'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleIcon = (role) => {
    if (role === ROLES.OWNER) return <Crown className="w-3.5 h-3.5 text-amber-500" />;
    if (role === ROLES.ADMIN) return <Shield className="w-3.5 h-3.5 text-brand-500" />;
    return <User className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <Table>
      <TableHeader>
        <tr>
          <TableHead className="w-[40%]">User</TableHead>
          <TableHead className="w-[25%]">Role</TableHead>
          <TableHead className="w-[20%]">Joined</TableHead>
          <TableHead className="w-[15%] text-right">Actions</TableHead>
        </tr>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const isOwner = member.role === ROLES.OWNER;
          const canEditThisMember = canManage && !isOwner && (!isSelf || currentUserRole === ROLES.OWNER);

          return (
            <TableRow key={member.membershipId} hoverable={false}>
              {/* User Avatar + Name + Email */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                    {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 text-xs">
                        {member.name}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {member.email}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Role */}
              <TableCell>
                {canEditThisMember ? (
                  <select
                    value={member.role}
                    disabled={actionLoading === member.userId}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                    className="text-xs font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value={ROLES.ADMIN}>ADMIN</option>
                    <option value={ROLES.MEMBER}>MEMBER</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {getRoleIcon(member.role)}
                    <span className="text-xs font-semibold text-slate-700 uppercase">
                      {member.role}
                    </span>
                  </div>
                )}
              </TableCell>

              {/* Joined Date */}
              <TableCell className="text-xs text-slate-500">
                {formatDate(member.joinedAt)}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                {canEditThisMember && (
                  <button
                    type="button"
                    disabled={actionLoading === member.userId}
                    onClick={() => handleRemove(member.userId, member.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
