import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getWorkspaceMembers, updateWorkspaceName } from '../../api/workspace.api.js';
import { MemberList } from './components/MemberList.jsx';
import { InviteMemberModal } from './components/InviteMemberModal.jsx';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  TableSkeleton,
  ErrorState,
  Badge
} from '../../components/ui/index.js';
import { ROLES } from 'loop-shared';
import {
  Settings,
  Users,
  UserPlus,
  Building2,
  Shield,
  Save,
  CheckCircle2
} from 'lucide-react';

export const TeamSettingsPage = () => {
  const { workspace, user, role, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [workspaceNameInput, setWorkspaceNameInput] = useState(workspace?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const canManage = role === ROLES.OWNER || role === ROLES.ADMIN;

  const loadMembers = useCallback(async () => {
    if (!workspace?._id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getWorkspaceMembers(workspace._id);
      setMembers(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [workspace?._id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (workspace?.name) {
      setWorkspaceNameInput(workspace.name);
    }
  }, [workspace?.name]);

  const handleSaveWorkspaceName = async (e) => {
    e.preventDefault();
    if (!workspaceNameInput.trim() || !workspace?._id) return;
    setSavingName(true);
    try {
      await updateWorkspaceName(workspace._id, workspaceNameInput.trim());
      addToast({
        type: 'success',
        title: 'Workspace Updated',
        message: 'Workspace name saved successfully.'
      });
      await refreshProfile();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error?.message || 'Failed to update workspace name'
      });
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Team & Workspace Settings</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage workspace identity, membership invitations, and access control permissions.
        </p>
      </div>

      {/* Section 1: Workspace Profile */}
      <Card>
        <CardHeader
          title="Workspace Details"
          description="General configuration and unique workspace identifier."
        />
        <CardContent>
          <form onSubmit={handleSaveWorkspaceName} className="space-y-4 max-w-xl">
            <Input
              label="Workspace Name"
              value={workspaceNameInput}
              onChange={(e) => setWorkspaceNameInput(e.target.value)}
              disabled={!canManage}
              helperText={!canManage ? 'Only workspace OWNER or ADMIN can rename the workspace.' : undefined}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Workspace Slug
                </label>
                <div className="font-mono text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {workspace?.slug || '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Workspace ID
                </label>
                <div className="font-mono text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 truncate">
                  {workspace?._id || '—'}
                </div>
              </div>
            </div>

            {canManage && (
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Save}
                  isLoading={savingName}
                  disabled={workspaceNameInput === workspace?.name}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Team Members & Roles */}
      <Card>
        <CardHeader
          title="Team Members"
          description={`Collaborators with access to this workspace (${members.length} members).`}
          action={
            canManage ? (
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => setInviteModalOpen(true)}
              >
                Invite Member
              </Button>
            ) : null
          }
        />
        <CardContent className="pt-2">
          {loading ? (
            <TableSkeleton rows={3} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadMembers} />
          ) : (
            <MemberList
              members={members}
              workspaceId={workspace?._id}
              currentUserId={user?._id}
              currentUserRole={role}
              onMembersChange={loadMembers}
            />
          )}
        </CardContent>
      </Card>

      {/* Section 3: Role Permission Reference */}
      <Card className="bg-slate-50/60 border-slate-200">
        <CardHeader
          title="Role Permissions Overview"
          description="Role-based access control enforced across both frontend UI and API endpoints."
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-700">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>OWNER</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Full administrative rights. Can invite/remove members, update roles, rename workspace, and delete feedback. Cannot be removed.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-brand-700">
                <Shield className="w-4 h-4 text-brand-600" />
                <span>ADMIN</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Team operations authority. Can invite colleagues, change member roles, delete feedback, and trigger batch AI analysis.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Shield className="w-4 h-4 text-slate-500" />
                <span>MEMBER</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Core contributor access. Can submit feedback, import CSVs, change status, and ask questions in Ask LOOP. Cannot delete feedback.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        workspaceId={workspace?._id}
        onMemberInvited={loadMembers}
      />
    </div>
  );
};
